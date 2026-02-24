// DevFlow Studio — Tauri Library (lib.rs)

pub mod commands;
use commands::executor::execute_command;
use commands::detector::detect_project;
use commands::folders::pick_folder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            execute_command,
            detect_project,
            pick_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running DevFlow Studio");
}
