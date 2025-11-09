// Tauri backend for SwarmVille
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod db;
mod audio;
mod agents;
mod cli;
mod error;

use tauri::Manager;
use std::sync::Mutex;
use serde::{Deserialize, Serialize};

use crate::db::Database;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ExecuteCLIRequest {
    cli_type: String,
    prompt: String,
}

#[tauri::command]
async fn init_db(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;

    std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

    let db = Database::new(&app_dir)
        .await
        .map_err(|e| e.to_string())?;

    // Store database in app state
    app_handle.manage(Mutex::new(db));

    Ok("Database initialized".to_string())
}

#[tauri::command]
async fn load_user_data() -> Result<String, String> {
    // TODO: Load user data from database
    Ok(r#"{"onboarding_complete": false}"#.to_string())
}

#[tauri::command]
async fn detect_installed_clis() -> Result<Vec<String>, String> {
    cli::detect_clis().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn execute_cli_command(request: ExecuteCLIRequest) -> Result<String, String> {
    cli::execute_cli_command(&request.cli_type, &request.prompt)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn start_stt(model: String) -> Result<String, String> {
    // TODO: Implement speech-to-text start
    Ok(format!("STT started with model: {}", model))
}

#[tauri::command]
async fn stop_stt() -> Result<(), String> {
    // TODO: Implement speech-to-text stop
    Ok(())
}

#[tauri::command]
async fn create_space(
    name: String,
    width: u32,
    height: u32,
    theme: String,
) -> Result<String, String> {
    // TODO: Create space in database
    Ok(format!("Space created: {}", name))
}

#[tauri::command]
async fn spawn_agent(
    space_id: String,
    name: String,
    role: String,
    cli_type: String,
) -> Result<String, String> {
    // TODO: Create agent in database
    Ok(format!("Agent spawned: {}", name))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            init_db,
            load_user_data,
            detect_installed_clis,
            execute_cli_command,
            start_stt,
            stop_stt,
            create_space,
            spawn_agent,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
