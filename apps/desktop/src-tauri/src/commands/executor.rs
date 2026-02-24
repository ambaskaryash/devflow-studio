use tokio::process::Command;
use std::process::Stdio;
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
) -> Result<CommandResult, String> {
    let start_time = Instant::now();

    let shell = if cfg!(target_os = "windows") {
        ("powershell.exe", vec!["-NonInteractive", "-Command"])
    } else {
        let shell_env = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string());
        if shell_env.contains("zsh") {
            ("zsh", vec!["-c"])
        } else {
            ("bash", vec!["-c"])
        }
    };

    let mut cmd = Command::new(shell.0);
    for arg in &shell.1 {
        cmd.arg(arg);
    }
    cmd.arg(&command);

    if let Some(dir) = cwd {
        cmd.current_dir(&dir);
    }

    let mut child = cmd
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn command: {e}"))?;

    let pid = child.id().map(|id| id as usize);
    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    // Collect stdout lines — try emitting events, fall back to collecting strings
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

    // Monitor process metrics while it runs
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

    // Collect the buffered output
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
