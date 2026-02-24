// DevFlow Studio — Tauri Project Detector Command

use std::path::Path;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DetectionResult {
    pub has_docker: bool,
    pub has_git: bool,
    pub has_node: bool,
    pub has_makefile: bool,
    pub has_requirements: bool,
    pub has_docker_compose: bool,
    pub package_scripts: Vec<String>,
    pub detected_type: String,
}

#[tauri::command]
pub async fn detect_project(path: String) -> Result<DetectionResult, String> {
    let dir = Path::new(&path);
    if !dir.exists() {
        return Err("Path does not exist".into());
    }

    let has_docker = dir.join("Dockerfile").exists();
    let has_docker_compose = dir.join("docker-compose.yml").exists() || dir.join("docker-compose.yaml").exists();
    let has_git = dir.join(".git").exists();
    let has_node = dir.join("package.json").exists();
    let has_makefile = dir.join("Makefile").exists();
    let has_requirements = dir.join("requirements.txt").exists();

    let mut package_scripts = Vec::new();
    if has_node {
        if let Ok(content) = std::fs::read_to_string(dir.join("package.json")) {
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(scripts) = v.get("scripts").and_then(|s| s.as_object()) {
                    package_scripts = scripts.keys().cloned().collect();
                }
            }
        }
    }

    let detected_type = if (has_docker || has_docker_compose) && has_node {
        "full-stack".to_string()
    } else if has_docker || has_docker_compose {
        "docker-only".to_string()
    } else if has_node || has_makefile || has_requirements {
        "script-only".to_string()
    } else {
        "empty".to_string()
    };

    Ok(DetectionResult {
        has_docker,
        has_git,
        has_node,
        has_makefile,
        has_requirements,
        has_docker_compose,
        package_scripts,
        detected_type,
    })
}
