use async_trait::async_trait;
use std::process::Stdio;
use std::time::Duration;
use tokio::io::AsyncWriteExt;
use tokio::process::Command;
use tokio::time::timeout;

use crate::agents::agent::AgentAction;
use crate::agents::llm_provider::{parse_llm_action, AgentDecisionContext, LLMError, LLMProvider};

/// Claude CLI provider using claude-cli
pub struct ClaudeProvider {
    model: String,
    timeout_ms: u64,
    cli_path: String,
}

impl ClaudeProvider {
    /// Create new Claude provider
    pub fn new() -> Self {
        Self {
            model: std::env::var("CLAUDE_MODEL")
                .unwrap_or_else(|_| "claude-haiku-4-5-20251001".to_string()),
            timeout_ms: std::env::var("LLM_TIMEOUT_MS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(30000),
            cli_path: "claude".to_string(),
        }
    }

    /// Create with custom model
    pub fn with_model(model: &str) -> Self {
        Self {
            model: model.to_string(),
            timeout_ms: 30000,
            cli_path: "claude".to_string(),
        }
    }

    /// Execute claude CLI command
    async fn execute_claude(&self, prompt: &str) -> Result<String, LLMError> {
        // Check if claude is installed
        if !self.is_available().await {
            return Err(LLMError::NotInstalled("claude".to_string()));
        }

        tracing::debug!("Executing Claude CLI with model: {}", self.model);

        // Build command
        let mut cmd = Command::new(&self.cli_path);
        cmd.arg("-p") // Print mode (non-interactive)
            .arg("--output-format")
            .arg("json")
            .arg("--model")
            .arg(&self.model)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // Execute with timeout
        let result =
            timeout(Duration::from_millis(self.timeout_ms), async {
                let mut child = cmd
                    .spawn()
                    .map_err(|e| LLMError::ExecutionFailed(format!("Failed to spawn: {}", e)))?;

                // Write prompt to stdin
                if let Some(mut stdin) = child.stdin.take() {
                    stdin.write_all(prompt.as_bytes()).await.map_err(|e| {
                        LLMError::ExecutionFailed(format!("Failed to write: {}", e))
                    })?;
                    stdin.shutdown().await.map_err(|e| {
                        LLMError::ExecutionFailed(format!("Failed to close: {}", e))
                    })?;
                }

                // Wait for completion
                let output = child
                    .wait_with_output()
                    .await
                    .map_err(|e| LLMError::ExecutionFailed(format!("Failed to wait: {}", e)))?;

                if !output.status.success() {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    return Err(LLMError::ExecutionFailed(format!(
                        "Claude CLI failed: {}",
                        stderr
                    )));
                }

                Ok(String::from_utf8_lossy(&output.stdout).to_string())
            })
            .await
            .map_err(|_| LLMError::Timeout)??;

        tracing::debug!("Claude CLI response received");
        Ok(result)
    }

    /// Parse JSON output from Claude CLI
    fn parse_claude_json(&self, json_str: &str) -> Result<String, LLMError> {
        let value: serde_json::Value = serde_json::from_str(json_str)
            .map_err(|e| LLMError::ParseError(format!("Invalid JSON: {}", e)))?;

        // Claude CLI JSON format (new format):
        // {"type": "result", "result": "...", ...}
        let text = value
            .get("result")
            .and_then(|r| r.as_str())
            .ok_or_else(|| {
                LLMError::ParseError(
                    "Unexpected JSON structure - missing 'result' field".to_string(),
                )
            })?;

        Ok(text.to_string())
    }
}

impl Default for ClaudeProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl LLMProvider for ClaudeProvider {
    async fn make_decision(&self, context: &AgentDecisionContext) -> Result<AgentAction, LLMError> {
        let prompt = context.build_prompt();

        tracing::info!("Claude making decision for agent: {}", context.agent_name);

        // Execute Claude CLI
        let json_response = self.execute_claude(&prompt).await?;

        // Parse Claude JSON wrapper
        let text_response = self.parse_claude_json(&json_response)?;

        tracing::debug!("Claude response text: {}", text_response);

        // Parse action from text response
        let action = parse_llm_action(&text_response)?;

        tracing::info!("Claude decision for {}: {:?}", context.agent_name, action);

        Ok(action)
    }

    async fn generate_text(&self, prompt: &str) -> Result<String, LLMError> {
        let json_response = self.execute_claude(prompt).await?;
        self.parse_claude_json(&json_response)
    }

    fn name(&self) -> &str {
        "claude"
    }

    async fn is_available(&self) -> bool {
        // Check if claude CLI is in PATH
        Command::new("which")
            .arg("claude")
            .output()
            .await
            .map(|output| output.status.success())
            .unwrap_or(false)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_claude_json() {
        let provider = ClaudeProvider::new();
        let json = r#"{"message": {"role": "assistant", "content": [{"type": "text", "text": "Hello world"}]}}"#;

        let text = provider.parse_claude_json(json).unwrap();
        assert_eq!(text, "Hello world");
    }

    #[tokio::test]
    async fn test_claude_availability() {
        let provider = ClaudeProvider::new();
        let available = provider.is_available().await;

        // Should be true if claude CLI is installed
        println!("Claude available: {}", available);
    }
}
