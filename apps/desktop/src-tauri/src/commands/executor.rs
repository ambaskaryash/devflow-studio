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
}

#[tauri::command]
pub async fn execute_command(
    app: AppHandle,
    node_id: String,
    command: String,
    cwd: Option<String>,
    env_vars: Option<HashMap<String, String>>,
) -> Result<CommandResult, String> {
    let start_time = Instant::now();

    let (shell_bin, shell_flag) = {
        let env_shell = std::env::var("SHELL").unwrap_or_default();
        if cfg!(target_os = "windows") {
            ("powershell.exe".to_string(), "-Command".to_string())
        } else if env_shell.contains("zsh") {
            (env_shell, "-c".to_string())
        } else {
            ("/bin/bash".to_string(), "-c".to_string())
        }
    };

    let mut cmd = Command::new(&shell_bin);
    cmd.arg(&shell_flag).arg(&command);

    if let Some(dir) = &cwd {
        cmd.current_dir(dir);
    }

    // Apply environment variables
    if let Some(envs) = env_vars {
        for (k, v) in envs {
            cmd.env(k, v);
        }
    }

    let mut child = cmd
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn command: {e}"))?;

    let pid = child.id().map(|id| id as usize);
    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    let app_clone = app.clone();
    let node_id_clone = node_id.clone();
    let stdout_handle = tokio::spawn(async move {
        let mut lines = Vec::new();
        let mut reader = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let _ = app_clone.emit("node-log", (node_id_clone.clone(), "stdout", line.clone()));
            lines.push(line);
        }
        lines
    });

    let app_clone2 = app.clone();
    let node_id_clone2 = node_id.clone();
    let stderr_handle = tokio::spawn(async move {
        let mut lines = Vec::new();
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let _ = app_clone2.emit("node-log", (node_id_clone2.clone(), "stderr", line.clone()));
            lines.push(line);
        }
        lines
    });

    let mut sys = System::new_all();
    let mut max_cpu = 0.0f32;
    let mut max_mem = 0u64;

    if let Some(p_id) = pid {
        while let Ok(None) = child.try_wait() {
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
            tokio::time::sleep(Duration::from_millis(500)).await;
        }
    }

    let status = child.wait().await.map_err(|e| format!("Failed to wait: {e}"))?;
    let duration = start_time.elapsed().as_millis() as u64;

    let stdout_lines = stdout_handle.await.unwrap_or_default();
    let stderr_lines = stderr_handle.await.unwrap_or_default();

    Ok(CommandResult {
        stdout: stdout_lines.join("\n"),
        stderr: stderr_lines.join("\n"),
        exit_code: status.code().unwrap_or(-1),
        max_cpu,
        max_memory_mb: max_mem,
        duration_ms: duration,
    })
}
