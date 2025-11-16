use async_trait::async_trait;
use std::process::Stdio;
use std::time::Duration;
use tokio::process::Command;
use tokio::time::timeout;

use crate::agents::agent::AgentAction;
use crate::agents::llm_provider::{parse_llm_action, AgentDecisionContext, LLMError, LLMProvider};

/// Cursor CLI provider using cursor-agent
pub struct CursorProvider {
    model: String,
    timeout_ms: u64,
    cli_path: String,
}

impl CursorProvider {
    /// Create new Cursor provider
    pub fn new() -> Self {
        // Try to find cursor CLI in common locations
        let cli_path = if let Ok(path) = std::env::var("CURSOR_CLI_PATH") {
            path
        } else {
            let home = std::env::var("HOME").unwrap_or_else(|_| "/Users/user".to_string());
            // Check common locations
            let common_paths: Vec<String> = vec![
                "/usr/local/bin/cursor".to_string(),
                "/usr/bin/cursor".to_string(),
                format!("{}/.local/bin/cursor", home),
                format!("{}/.local/bin/cursor-agent", home),
            ];

            // Use first available path or default
            common_paths
                .first()
                .cloned()
                .unwrap_or_else(|| "/usr/local/bin/cursor".to_string())
        };

        Self {
            model: std::env::var("CURSOR_MODEL")
                .unwrap_or_else(|_| "claude-3.5-sonnet".to_string()),
            timeout_ms: std::env::var("LLM_TIMEOUT_MS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(30000),
            cli_path,
        }
    }

    /// Create with custom model
    pub fn with_model(model: &str) -> Self {
        let mut provider = Self::new();
        provider.model = model.to_string();
        provider
    }

    /// Execute cursor-agent CLI command
    async fn execute_cursor(&self, prompt: &str) -> Result<String, LLMError> {
        // Check if cursor-agent is installed
        if !self.is_available().await {
            return Err(LLMError::NotInstalled("cursor-agent".to_string()));
        }

        tracing::debug!("Executing Cursor CLI with model: {}", self.model);

        // Build command - cursor CLI uses different syntax
        let mut cmd = Command::new(&self.cli_path);
        // Try cursor CLI format first (cursor -p "prompt")
        // If that doesn't work, fall back to cursor-agent format
        cmd.arg("-p") // Print mode (non-interactive)
            .arg(prompt)
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // Add API key if available
        if let Ok(api_key) = std::env::var("CURSOR_API_KEY") {
            cmd.env("CURSOR_API_KEY", api_key);
        }

        // Execute with timeout
        let result = timeout(Duration::from_millis(self.timeout_ms), async {
            let output = cmd
                .output()
                .await
                .map_err(|e| LLMError::ExecutionFailed(format!("Failed to execute: {}", e)))?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(LLMError::ExecutionFailed(format!(
                    "Cursor CLI failed: {}",
                    stderr
                )));
            }

            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        })
        .await
        .map_err(|_| LLMError::Timeout)??;

        tracing::debug!("Cursor CLI response received");
        Ok(result)
    }

    /// Parse JSON output from Cursor CLI
    fn parse_cursor_json(&self, json_str: &str) -> Result<String, LLMError> {
        // Try to parse as JSON first
        let value: serde_json::Value = serde_json::from_str(json_str)
            .map_err(|e| LLMError::ParseError(format!("Invalid JSON: {}", e)))?;

        // Cursor may return different formats - try common structures
        // Format 1: {"output": "text"}
        if let Some(output) = value.get("output").and_then(|v| v.as_str()) {
            return Ok(output.to_string());
        }

        // Format 2: {"response": "text"}
        if let Some(response) = value.get("response").and_then(|v| v.as_str()) {
            return Ok(response.to_string());
        }

        // Format 3: {"message": "text"}
        if let Some(message) = value.get("message").and_then(|v| v.as_str()) {
            return Ok(message.to_string());
        }

        // Format 4: Direct text (fallback - return entire JSON as string)
        Ok(json_str.to_string())
    }
}

impl Default for CursorProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl LLMProvider for CursorProvider {
    async fn make_decision(&self, context: &AgentDecisionContext) -> Result<AgentAction, LLMError> {
        let prompt = context.build_prompt();

        tracing::info!("Cursor making decision for agent: {}", context.agent_name);

        // Execute Cursor CLI
        let json_response = self.execute_cursor(&prompt).await?;

        // Parse Cursor JSON wrapper
        let text_response = self.parse_cursor_json(&json_response)?;

        tracing::debug!("Cursor response text: {}", text_response);

        // Parse action from text response
        let action = parse_llm_action(&text_response)?;

        tracing::info!("Cursor decision for {}: {:?}", context.agent_name, action);

        Ok(action)
    }

    async fn generate_text(&self, prompt: &str) -> Result<String, LLMError> {
        let json_response = self.execute_cursor(prompt).await?;
        self.parse_cursor_json(&json_response)
    }

    fn name(&self) -> &str {
        "cursor"
    }

    async fn is_available(&self) -> bool {
        // Check if cursor CLI exists at expected path
        if tokio::fs::metadata(&self.cli_path)
            .await
            .map(|meta| meta.is_file())
            .unwrap_or(false)
        {
            return true;
        }

        // Also check common alternative paths
        let common_paths = vec!["/usr/local/bin/cursor", "/usr/bin/cursor"];

        for path in common_paths {
            if tokio::fs::metadata(path)
                .await
                .map(|meta| meta.is_file())
                .unwrap_or(false)
            {
                return true;
            }
        }

        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_cursor_json() {
        let provider = CursorProvider::new();

        // Test format 1
        let json1 = r#"{"output": "Hello world"}"#;
        assert_eq!(provider.parse_cursor_json(json1).unwrap(), "Hello world");

        // Test format 2
        let json2 = r#"{"response": "Test response"}"#;
        assert_eq!(provider.parse_cursor_json(json2).unwrap(), "Test response");
    }

    #[tokio::test]
    async fn test_cursor_availability() {
        let provider = CursorProvider::new();
        let available = provider.is_available().await;

        println!("Cursor available: {}", available);
    }
}
