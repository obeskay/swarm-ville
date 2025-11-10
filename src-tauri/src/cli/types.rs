use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CLIType {
    Claude,
    Gemini,
    OpenAI,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedCLI {
    pub cli_type: CLIType,
    pub path: PathBuf,
    pub version: Option<String>,
    pub verified: bool,
    pub capabilities: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CLICommand {
    pub prompt: String,
    pub options: CommandOptions,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandOptions {
    pub print_mode: bool,
    pub output_format: OutputFormat,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
    pub stream: bool,
}

impl Default for CommandOptions {
    fn default() -> Self {
        Self {
            print_mode: true,
            output_format: OutputFormat::Text,
            temperature: None,
            max_tokens: None,
            stream: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OutputFormat {
    Text,
    Json,
    StreamJson,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CLIResponse {
    pub content: String,
    pub cli_type: CLIType,
    pub execution_time_ms: u64,
    pub metadata: ResponseMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResponseMetadata {
    pub model: Option<String>,
    pub tokens_used: Option<u32>,
    pub finish_reason: Option<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum CLIError {
    #[error("CLI not found: {0}")]
    NotFound(String),

    #[error("CLI execution failed: {0}")]
    ExecutionFailed(String),

    #[error("Invalid response format: {0}")]
    InvalidResponse(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Timeout: command took longer than {0}ms")]
    Timeout(u64),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

impl Serialize for CLIError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
