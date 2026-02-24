// DevFlow Studio — Folder & Flow I/O Commands

use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use std::fs;

// ── Folder picker ─────────────────────────────────────────────────────────────
#[tauri::command]
pub async fn pick_folder(app: AppHandle) -> Result<Option<String>, String> {
    let path = app.dialog().file().blocking_pick_folder();
    Ok(path.map(|p| p.to_string()))
}

// ── Save flow ─────────────────────────────────────────────────────────────────
/// Saves flow JSON to a file using a native save dialog.
#[tauri::command]
pub async fn save_flow(app: AppHandle, content: String, default_name: String) -> Result<Option<String>, String> {
    let path = app
        .dialog()
        .file()
        .add_filter("DevFlow File", &["devflow.json"])
        .set_file_name(&default_name)
        .blocking_save_file();

    match path {
        Some(p) => {
            let path_str = p.to_string();
            fs::write(&path_str, &content)
                .map_err(|e| format!("Failed to write flow: {e}"))?;
            Ok(Some(path_str))
        }
        None => Ok(None),
    }
}

// ── Load flow ─────────────────────────────────────────────────────────────────
/// Opens a native file picker and returns the flow JSON content.
#[tauri::command]
pub async fn load_flow(app: AppHandle) -> Result<Option<(String, String)>, String> {
    let path = app
        .dialog()
        .file()
        .add_filter("DevFlow File", &["devflow.json", "json"])
        .blocking_pick_file();

    match path {
        Some(p) => {
            let path_str = p.to_string();
            let content = fs::read_to_string(&path_str)
                .map_err(|e| format!("Failed to read flow: {e}"))?;
            Ok(Some((path_str, content)))
        }
        None => Ok(None),
    }
}
