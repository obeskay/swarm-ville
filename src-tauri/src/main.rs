// Tauri backend for SwarmVille
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod agents;
mod cli;
mod commands;
mod db;
mod error;
mod language; // Thronglet language learning system
mod sprite_generator;
mod ws;
// mod audio; // Temporarily disabled - requires cpal 0.15+ API updates

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::Manager;

use crate::db::Database;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ExecuteCLIRequest {
    cli_type: String,
    prompt: String,
}

#[tauri::command]
async fn init_db(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

    let db = Database::new(&app_dir).await.map_err(|e| e.to_string())?;

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
async fn detect_installed_clis() -> Result<String, String> {
    let detected = cli::detect_installed_clis();
    serde_json::to_string(&detected).map_err(|e| e.to_string())
}

#[tauri::command]
async fn execute_cli_command(request: ExecuteCLIRequest) -> Result<String, String> {
    use cli::{CLICommand, CLIConnector, CLIType, CommandOptions};

    let connector = CLIConnector::new(120000); // 120s timeout for code generation

    let cli_type = match request.cli_type.to_lowercase().as_str() {
        "claude" => CLIType::Claude,
        "claude-code" | "claudecode" => CLIType::ClaudeCode,
        "gemini" => CLIType::Gemini,
        "openai" => CLIType::OpenAI,
        custom => CLIType::Custom(custom.to_string()),
    };

    let command = CLICommand {
        prompt: request.prompt,
        options: CommandOptions::default(),
    };

    let response = connector
        .execute(&cli_type, command)
        .await
        .map_err(|e| e.to_string())?;

    serde_json::to_string(&response).map_err(|e| e.to_string())
}

#[tauri::command]
async fn start_claude_code_task(task_description: String) -> Result<String, String> {
    use std::io::Write;
    use std::process::{Command, Stdio};

    // Invoke claude-code-cli without requiring API keys
    // claude-code-cli works directly with local projects
    let mut child = Command::new("claude-code-cli")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start claude-code-cli: {}", e))?;

    // Send task description via stdin
    {
        let stdin = child.stdin.as_mut().ok_or("Failed to open stdin")?;
        stdin
            .write_all(task_description.as_bytes())
            .map_err(|e| format!("Failed to write to stdin: {}", e))?;
    }

    // Wait for completion
    let output = child
        .wait_with_output()
        .map_err(|e| format!("Failed to wait for claude-code-cli: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("claude-code-cli error: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.to_string())
}

#[tauri::command]
async fn execute_claude_script(prompt: String) -> Result<String, String> {
    use std::process::Command;
    use std::time::Duration;
    use tokio::time::timeout;

    // Execute the Node.js script
    let script_path = "scripts/claude-agent.mjs";

    let output = timeout(Duration::from_secs(60), async {
        tokio::task::spawn_blocking(move || {
            Command::new("node").arg(script_path).arg(&prompt).output()
        })
        .await
    })
    .await
    .map_err(|_| "Claude script timeout after 60 seconds".to_string())?
    .map_err(|e| format!("Failed to spawn Node.js: {}", e))?
    .map_err(|e| format!("Failed to execute script: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Claude script failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(stdout.trim().to_string())
}

#[tauri::command]
async fn test_cli_connection(cli_type: String) -> Result<bool, String> {
    use cli::{CLICommand, CLIConnector, CLIType, CommandOptions};

    let connector = CLIConnector::new(5000); // 5s timeout for test

    let cli_type_enum = match cli_type.to_lowercase().as_str() {
        "claude" => CLIType::Claude,
        "gemini" => CLIType::Gemini,
        "openai" => CLIType::OpenAI,
        _ => return Ok(false),
    };

    if !connector.has_cli(&cli_type_enum) {
        return Ok(false);
    }

    // Test with simple query
    let command = CLICommand {
        prompt: "Say 'test' if you can read this.".to_string(),
        options: CommandOptions::default(),
    };

    match connector.execute(&cli_type_enum, command).await {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
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
    _width: u32,
    _height: u32,
    _theme: String,
) -> Result<String, String> {
    // TODO: Create space in database
    Ok(format!("Space created: {}", name))
}

#[tauri::command]
async fn execute_shell_command(command: String) -> Result<String, String> {
    use std::process::Command;

    tracing::info!("Executing shell command: {}", command);

    let output = if cfg!(target_os = "windows") {
        Command::new("cmd").args(["/C", &command]).output()
    } else {
        Command::new("sh").arg("-c").arg(&command).output()
    };

    match output {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();

            let result = serde_json::json!({
                "success": output.status.success(),
                "stdout": stdout,
                "stderr": stderr,
                "exit_code": output.status.code()
            });

            Ok(serde_json::to_string(&result).map_err(|e| e.to_string())?)
        }
        Err(e) => Err(format!("Failed to execute command: {}", e)),
    }
}

#[tauri::command]
async fn spawn_agent(
    app_handle: tauri::AppHandle,
    space_id: String,
    name: String,
    role: String,
    cli_type: String,
    x: u32,
    y: u32,
) -> Result<String, String> {
    use agents::{AgentConfig, Position};

    // Determine model based on cli_type - only real providers, no mock
    let (provider, model) = match cli_type.to_lowercase().as_str() {
        "cursor" | "cursor-auto" => ("cursor", "claude-3.5-sonnet"),
        "claude" | "claude-haiku" => ("claude", "claude-haiku-4-5-20251001"),
        _ => {
            return Err(format!(
                "Invalid CLI type: {}. Only 'cursor' or 'claude' are supported.",
                cli_type
            ));
        }
    };

    let config = AgentConfig {
        name: name.clone(),
        role,
        model_provider: provider.to_string(),
        model_name: model.to_string(),
        initial_position: Position { x, y },
        space_id,
    };

    // Clone runtime to avoid holding lock across await
    let runtime_state = app_handle.state::<Mutex<agents::AgentRuntime>>();
    let runtime = {
        let guard = runtime_state.lock().map_err(|e| e.to_string())?;
        guard.clone()
    };

    let agent_id = runtime.spawn_agent(config).await?;

    tracing::info!("Spawned agent '{}' with ID: {}", name, agent_id);

    Ok(agent_id)
}

#[tauri::command]
async fn execute_complex_task(
    app_handle: tauri::AppHandle,
    task_id: String,
    description: String,
    space_id: String,
    cli_type: String,
) -> Result<String, String> {
    use agents::{ComplexTask, TaskOrchestrator};

    tracing::info!("Executing complex task: {}", description);

    let task = ComplexTask {
        task_id,
        description,
        space_id,
    };

    // Get runtime and create orchestrator
    let runtime_state = app_handle.state::<Mutex<agents::AgentRuntime>>();
    let runtime = {
        let guard = runtime_state.lock().map_err(|e| e.to_string())?;
        std::sync::Arc::new(guard.clone())
    };

    let orchestrator = TaskOrchestrator::new(runtime);

    // Execute complex task (spawns multiple specialized agents)
    let agent_ids = orchestrator.execute_complex_task(task, &cli_type).await?;

    let result = serde_json::json!({
        "success": true,
        "agent_ids": agent_ids,
        "message": format!("Spawned {} specialized agents for complex task", agent_ids.len())
    });

    Ok(serde_json::to_string(&result).map_err(|e| e.to_string())?)
}

#[tauri::command]
async fn get_sprite_templates(app_handle: tauri::AppHandle) -> Result<String, String> {
    let db_state = app_handle.state::<Mutex<Database>>();
    let db = db_state.lock().map_err(|e| e.to_string())?;

    let templates =
        db::sprites::get_all_templates(db.get_connection()).map_err(|e| e.to_string())?;

    serde_json::to_string(&templates).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_sprite_template(
    app_handle: tauri::AppHandle,
    template_id: String,
) -> Result<String, String> {
    let db_state = app_handle.state::<Mutex<Database>>();
    let db = db_state.lock().map_err(|e| e.to_string())?;

    let template = db::sprites::get_template_by_id(db.get_connection(), &template_id)
        .map_err(|e| e.to_string())?;

    serde_json::to_string(&template).map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_generated_sprite(
    app_handle: tauri::AppHandle,
    sprite_json: String,
) -> Result<String, String> {
    let db_state = app_handle.state::<Mutex<Database>>();
    let db = db_state.lock().map_err(|e| e.to_string())?;

    let sprite: db::sprites::GeneratedSprite =
        serde_json::from_str(&sprite_json).map_err(|e| e.to_string())?;

    db::sprites::save_generated_sprite(db.get_connection(), &sprite).map_err(|e| e.to_string())?;

    Ok("Sprite saved successfully".to_string())
}

#[tauri::command]
async fn get_sprites_by_template(
    app_handle: tauri::AppHandle,
    template_id: String,
) -> Result<String, String> {
    let db_state = app_handle.state::<Mutex<Database>>();
    let db = db_state.lock().map_err(|e| e.to_string())?;

    let sprites = db::sprites::get_sprites_by_template(db.get_connection(), &template_id)
        .map_err(|e| e.to_string())?;

    serde_json::to_string(&sprites).map_err(|e| e.to_string())
}

#[tauri::command]
async fn increment_template_usage(
    app_handle: tauri::AppHandle,
    template_id: String,
) -> Result<String, String> {
    let db_state = app_handle.state::<Mutex<Database>>();
    let db = db_state.lock().map_err(|e| e.to_string())?;

    db::sprites::increment_template_usage(db.get_connection(), &template_id)
        .map_err(|e| e.to_string())?;

    Ok("Template usage incremented".to_string())
}

#[tauri::command]
async fn generate_sprite_with_ai(
    description: String,
    template_id: Option<String>,
) -> Result<String, String> {
    // Get API key from environment
    let api_key = std::env::var("GEMINI_API_KEY")
        .or_else(|_| std::env::var("VITE_GEMINI_API_KEY"))
        .map_err(|_| "GEMINI_API_KEY not found in environment".to_string())?;

    let generator = sprite_generator::SpriteGenerator::new(api_key);

    let request = sprite_generator::SpriteGenerationRequest {
        description: description.clone(),
        template_id,
    };

    let sprite = generator
        .generate_sprite(request)
        .map_err(|e| format!("Sprite generation failed: {}", e))?;

    serde_json::to_string(&sprite).map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_generated_map(
    app_handle: tauri::AppHandle,
    id: String,
    name: String,
    width: i32,
    height: i32,
    style: String,
    room_count: i32,
    tilemap_data: String,
    generation_method: Option<String>,
    ai_model_used: Option<String>,
) -> Result<String, String> {
    let db_state = app_handle.state::<Mutex<Database>>();
    let db = db_state.lock().unwrap();
    let conn = db.get_connection();

    db::maps::save_generated_map(
        conn,
        &id,
        &name,
        width,
        height,
        &style,
        room_count,
        &tilemap_data,
        generation_method.as_deref(),
        ai_model_used.as_deref(),
    )
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
async fn load_generated_map(
    app_handle: tauri::AppHandle,
    map_id: String,
) -> Result<String, String> {
    let db_state = app_handle.state::<Mutex<Database>>();
    let db = db_state.lock().unwrap();
    let conn = db.get_connection();

    db::maps::load_generated_map(conn, &map_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_generated_maps(app_handle: tauri::AppHandle) -> Result<String, String> {
    let db_state = app_handle.state::<Mutex<Database>>();
    let db = db_state.lock().unwrap();
    let conn = db.get_connection();

    let maps = db::maps::list_generated_maps(conn).map_err(|e| e.to_string())?;
    serde_json::to_string(&maps).map_err(|e| e.to_string())
}

// ============================================
// LANGUAGE SYSTEM COMMANDS
// ============================================

#[tauri::command]
async fn teach_word(app_handle: tauri::AppHandle, request_json: String) -> Result<String, String> {
    let db_state = app_handle.state::<Mutex<Database>>();
    let db = db_state.lock().unwrap();
    let language_system = language::LanguageSystem::new(&db);

    let request: language::TeachWordRequest =
        serde_json::from_str(&request_json).map_err(|e| e.to_string())?;

    let word = language_system
        .teach_word(request)
        .map_err(|e| e.to_string())?;

    serde_json::to_string(&word).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_agent_vocabulary(
    app_handle: tauri::AppHandle,
    agent_id: String,
) -> Result<String, String> {
    let db_state = app_handle.state::<Mutex<Database>>();
    let db = db_state.lock().unwrap();
    let language_system = language::LanguageSystem::new(&db);

    let vocabulary = language_system
        .get_agent_vocabulary(&agent_id)
        .map_err(|e| e.to_string())?;

    serde_json::to_string(&vocabulary).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_agent_language_state(
    app_handle: tauri::AppHandle,
    agent_id: String,
) -> Result<String, String> {
    let db_state = app_handle.state::<Mutex<Database>>();
    let db = db_state.lock().unwrap();
    let language_system = language::LanguageSystem::new(&db);

    let state = language_system
        .get_agent_language_state(&agent_id)
        .map_err(|e| e.to_string())?;

    serde_json::to_string(&state).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_word_associations(
    app_handle: tauri::AppHandle,
    word_id: String,
) -> Result<String, String> {
    let db_state = app_handle.state::<Mutex<Database>>();
    let db = db_state.lock().unwrap();
    let language_system = language::LanguageSystem::new(&db);

    let associations = language_system
        .get_word_associations(&word_id)
        .map_err(|e| e.to_string())?;

    serde_json::to_string(&associations).map_err(|e| e.to_string())
}

fn main() {
    // Initialize tracing for better logging
    tracing_subscriber::fmt::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let app_handle = app.handle();

            // Initialize persistence layer
            let app_dir = app_handle
                .path()
                .app_data_dir()
                .map_err(|e| format!("Failed to get app data directory: {}", e))?;

            std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

            let db_path = app_dir.join("swarmville_persistence.db");
            let persistence = db::PersistenceLayer::new(db_path.to_str().unwrap())
                .map_err(|e| format!("Failed to initialize persistence: {}", e))?;

            // Store persistence layer in app state
            app.manage(commands::AppState {
                db: std::sync::Arc::new(persistence),
            });

            // Initialize AgentRuntime for LLM-powered agents
            let agent_runtime = agents::AgentRuntime::new(100);
            app.manage(Mutex::new(agent_runtime));

            tracing::info!("Persistence layer initialized at {:?}", db_path);
            tracing::info!("Agent Runtime initialized with LLM providers");

            // Start WebSocket server on background thread
            tauri::async_runtime::spawn(async move {
                let ws_server = ws::WebSocketServer::new(8765);
                if let Err(e) = ws_server.start().await {
                    eprintln!("WebSocket server error: {}", e);
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            init_db,
            load_user_data,
            detect_installed_clis,
            test_cli_connection,
            execute_cli_command,
            start_claude_code_task,
            execute_claude_script,
            start_stt,
            stop_stt,
            create_space,
            execute_shell_command,
            spawn_agent,
            execute_complex_task,
            get_sprite_templates,
            get_sprite_template,
            save_generated_sprite,
            get_sprites_by_template,
            increment_template_usage,
            generate_sprite_with_ai,
            save_generated_map,
            load_generated_map,
            list_generated_maps,
            // Language System commands
            teach_word,
            get_agent_vocabulary,
            get_agent_language_state,
            get_word_associations,
            // Achievement System commands
            commands::achievements::init_achievements,
            commands::achievements::get_all_achievements,
            commands::achievements::get_achievement_by_id,
            commands::achievements::get_player_progress,
            commands::achievements::update_achievement_progress,
            commands::achievements::unlock_achievement,
            commands::achievements::get_player_stats,
            commands::achievements::add_xp,
            commands::achievements::get_achievement_analytics,
            commands::achievements::get_unlock_history,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
