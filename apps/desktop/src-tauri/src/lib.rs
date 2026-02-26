// DevFlow Studio — Tauri Library (lib.rs)

pub mod commands;
use commands::executor::execute_command;
use commands::detector::detect_project;
use commands::folders::{pick_folder, save_flow, load_flow};
use commands::secure_storage::{store_secret, get_secret, delete_secret, secret_exists};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            // Execution
            execute_command,
            // Project detection
            detect_project,
            // File I/O
            pick_folder,
            save_flow,
            load_flow,
            // Secure secret storage
            store_secret,
            get_secret,
            delete_secret,
            secret_exists,
        ])
        .run(tauri::generate_context!())
        .expect("error while running DevFlow Studio");
}
