use crate::error::{Result, SwarmvilleError};
use std::process::Command;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DetectedCLI {
    pub cli_type: String,
    pub path: String,
    pub verified: bool,
    pub version: Option<String>,
}

pub async fn detect_clis() -> Result<Vec<String>> {
    let mut detected = Vec::new();

    // Check for Claude CLI
    if is_claude_installed() {
        detected.push("claude".to_string());
    }

    // Check for Gemini CLI
    if is_gemini_installed() {
        detected.push("gemini".to_string());
    }

    // Check for OpenAI CLI
    if is_openai_installed() {
        detected.push("openai".to_string());
    }

    Ok(detected)
}

fn is_claude_installed() -> bool {
    Command::new("which")
        .arg("claude")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

fn is_gemini_installed() -> bool {
    Command::new("which")
        .arg("gemini")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

fn is_openai_installed() -> bool {
    Command::new("which")
        .arg("openai")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

pub async fn execute_cli_command(cli_type: &str, prompt: &str) -> Result<String> {
    let output = match cli_type {
        "claude" => Command::new("claude")
            .arg("--prompt")
            .arg(prompt)
            .output()
            .map_err(|e| SwarmvilleError::Cli(e.to_string()))?,
        "gemini" => Command::new("gemini")
            .arg(prompt)
            .output()
            .map_err(|e| SwarmvilleError::Cli(e.to_string()))?,
        "openai" => Command::new("openai")
            .arg(prompt)
            .output()
            .map_err(|e| SwarmvilleError::Cli(e.to_string()))?,
        _ => return Err(SwarmvilleError::Cli("Unknown CLI type".to_string())),
    };

    String::from_utf8(output.stdout)
        .map_err(|e| SwarmvilleError::Cli(format!("Failed to parse output: {}", e)))
}
