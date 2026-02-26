// ============================================================
// DevFlow Studio — Command Executor (Rust)
// Supports: native shell, Docker container, SSH remote profiles.
// Features: per-node timeout, resource metrics, env var injection.
// ============================================================

use tokio::process::Command;
use std::process::Stdio;
use std::collections::HashMap;
use tokio::io::{AsyncBufReadExt, BufReader};
use std::time::{Instant, Duration};
use serde::{Deserialize, Serialize};
use sysinfo::{Pid, System};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExecutionMetrics {
    pub cpu_usage: f32,
    pub memory_mb: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub max_cpu: f32,
    pub max_memory_mb: u64,
    pub duration_ms: u64,
    pub timed_out: bool,
}

/// Execution profile determines the sandbox environment.
/// - `native`: run directly in the host shell (default)
/// - `docker`: wrap in `docker run --rm` with optional CPU/memory limits
/// - `ssh`: forward to a remote host via SSH
#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum ExecutionProfile {
    Native,
    Docker,
    Ssh,
}

impl Default for ExecutionProfile {
    fn default() -> Self { ExecutionProfile::Native }
}

/// Configuration for the Docker execution profile.
#[derive(Debug, Deserialize, Default, Clone)]
pub struct DockerConfig {
    pub image: Option<String>,
    pub cpu_limit: Option<String>,
    pub mem_limit: Option<String>,
}

/// Configuration for the SSH execution profile.
#[derive(Debug, Deserialize, Default, Clone)]
pub struct SshConfig {
    pub host: Option<String>,
    pub user: Option<String>,
}

/// Wraps a shell command for the Docker sandbox profile.
fn wrap_for_docker(command: &str, cwd: &Option<String>, cfg: &DockerConfig) -> String {
    let image = cfg.image.as_deref().unwrap_or("ubuntu:22.04");
    let work_dir = cwd.as_deref().unwrap_or(".");
    let cpu = cfg.cpu_limit.as_deref().map(|c| format!("--cpus={}", c)).unwrap_or_default();
    let mem = cfg.mem_limit.as_deref().map(|m| format!("--memory={}", m)).unwrap_or_default();

    format!(
        "docker run --rm {} {} -v {}:/workspace -w /workspace {} sh -c {}",
        cpu, mem,
        work_dir,
        image,
        shell_escape(command)
    )
}

/// Wraps a shell command for SSH remote execution.
fn wrap_for_ssh(command: &str, cfg: &SshConfig) -> String {
    let user = cfg.user.as_deref().unwrap_or("root");
    let host = cfg.host.as_deref().unwrap_or("localhost");
    format!("ssh -o StrictHostKeyChecking=no {}@{} {}", user, host, shell_escape(command))
}

/// Shell-escape a command string for embedding in a shell -c argument.
fn shell_escape(cmd: &str) -> String {
    format!("'{}'", cmd.replace('\'', "'\\''"))
}

/// Determine the host shell to use.
fn detect_shell() -> (String, String) {
    if cfg!(target_os = "windows") {
        ("powershell.exe".to_string(), "-Command".to_string())
    } else {
        let env_shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string());
        (env_shell, "-c".to_string())
    }
}

#[tauri::command]
pub async fn execute_command(
    app: AppHandle,
    node_id: String,
    command: String,
    cwd: Option<String>,
    env_vars: Option<HashMap<String, String>>,
    timeout_seconds: Option<u64>,
    profile: Option<ExecutionProfile>,
    docker_config: Option<DockerConfig>,
    ssh_config: Option<SshConfig>,
) -> Result<CommandResult, String> {
    let start_time = Instant::now();
    let timeout_secs = timeout_seconds.unwrap_or(300);

    // ── Build the actual command based on execution profile ────────────────────
    let resolved_command = match profile.unwrap_or_default() {
        ExecutionProfile::Docker => {
            wrap_for_docker(&command, &cwd, &docker_config.unwrap_or_default())
        }
        ExecutionProfile::Ssh => {
            wrap_for_ssh(&command, &ssh_config.unwrap_or_default())
        }
        ExecutionProfile::Native => command.clone(),
    };

    let (shell_bin, shell_flag) = detect_shell();

    let mut cmd_builder = Command::new(&shell_bin);
    cmd_builder.arg(&shell_flag).arg(&resolved_command);

    if let Some(ref dir) = cwd {
        cmd_builder.current_dir(dir);
    }

    if let Some(envs) = env_vars {
        for (k, v) in envs {
            cmd_builder.env(k, v);
        }
    }

    let mut child = cmd_builder
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn command: {e}"))?;

    let pid = child.id().map(|id| id as usize);
    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    // ── Async stdout reader ────────────────────────────────────────────────────
    let app_clone = app.clone();
    let node_id_stdout = node_id.clone();
    let stdout_handle = tokio::spawn(async move {
        let mut lines = Vec::new();
        let mut reader = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let _ = app_clone.emit("node-log", (node_id_stdout.clone(), "stdout", line.clone()));
            lines.push(line);
        }
        lines
    });

    // ── Async stderr reader ────────────────────────────────────────────────────
    let app_clone2 = app.clone();
    let node_id_stderr = node_id.clone();
    let stderr_handle = tokio::spawn(async move {
        let mut lines = Vec::new();
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let _ = app_clone2.emit("node-log", (node_id_stderr.clone(), "stderr", line.clone()));
            lines.push(line);
        }
        lines
    });

    // ── Resource metrics polling + timeout ─────────────────────────────────────
    let mut sys = System::new_all();
    let mut max_cpu = 0.0f32;
    let mut max_mem = 0u64;
    let mut timed_out = false;

    let deadline = Instant::now() + Duration::from_secs(timeout_secs);

    loop {
        match child.try_wait() {
            Ok(Some(_)) => break, // Process finished
            Ok(None) => {
                if Instant::now() > deadline {
                    timed_out = true;
                    // Kill the process tree
                    let _ = child.kill().await;
                    let _ = app.emit("node-log", (node_id.clone(), "error",
                        format!("⏱ Command timed out after {}s", timeout_secs)));
                    break;
                }
            }
            Err(_) => break,
        }

        // Sample resource usage
        if let Some(p_id) = pid {
            sys.refresh_process(Pid::from(p_id));
            if let Some(p) = sys.process(Pid::from(p_id)) {
                let cpu = p.cpu_usage();
                let mem = p.memory() / 1024 / 1024;
                if cpu > max_cpu { max_cpu = cpu; }
                if mem > max_mem { max_mem = mem; }
                let _ = app.emit("execution-metrics", (node_id.clone(), ExecutionMetrics {
                    cpu_usage: cpu,
                    memory_mb: mem,
                }));
            }
        }
        tokio::time::sleep(Duration::from_millis(500)).await;
    }

    let status = child.wait().await.map_err(|e| format!("Failed to wait: {e}"))?;
    let duration = start_time.elapsed().as_millis() as u64;

    let stdout_lines = stdout_handle.await.unwrap_or_default();
    let stderr_lines = stderr_handle.await.unwrap_or_default();

    let exit_code = if timed_out { -1 } else { status.code().unwrap_or(-1) };

    Ok(CommandResult {
        stdout: stdout_lines.join("\n"),
        stderr: stderr_lines.join("\n"),
        exit_code,
        max_cpu,
        max_memory_mb: max_mem,
        duration_ms: duration,
        timed_out,
    })
}

// ── Unit tests ─────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_docker_wrap_basic() {
        let cfg = DockerConfig {
            image: Some("ubuntu:22.04".to_string()),
            cpu_limit: Some("0.5".to_string()),
            mem_limit: Some("256m".to_string()),
        };
        let result = wrap_for_docker("echo hello", &Some("/tmp".to_string()), &cfg);
        assert!(result.contains("docker run --rm"));
        assert!(result.contains("--cpus=0.5"));
        assert!(result.contains("--memory=256m"));
        assert!(result.contains("ubuntu:22.04"));
        assert!(result.contains("echo hello"));
    }

    #[test]
    fn test_ssh_wrap_basic() {
        let cfg = SshConfig {
            user: Some("deploy".to_string()),
            host: Some("prod.example.com".to_string()),
        };
        let result = wrap_for_ssh("ls -la", &cfg);
        assert!(result.contains("ssh"));
        assert!(result.contains("deploy@prod.example.com"));
        assert!(result.contains("ls -la"));
    }

    #[test]
    fn test_shell_escape() {
        let escaped = shell_escape("echo 'hello world'");
        assert!(escaped.starts_with('\''));
        assert!(escaped.ends_with('\''));
        assert!(!escaped.contains("'hello world'")); // single quotes escaped
    }

    #[test]
    fn test_detect_shell_not_empty() {
        let (shell, flag) = detect_shell();
        assert!(!shell.is_empty());
        assert!(!flag.is_empty());
    }
}
