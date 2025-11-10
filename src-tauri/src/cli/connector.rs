use super::types::*;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};
use tokio::time::timeout;

pub struct CLIConnector {
    detected_clis: Vec<DetectedCLI>,
    timeout_ms: u64,
}

impl CLIConnector {
    pub fn new(timeout_ms: u64) -> Self {
        Self {
            detected_clis: super::detector::detect_installed_clis(),
            timeout_ms,
        }
    }

    pub fn get_detected_clis(&self) -> &[DetectedCLI] {
        &self.detected_clis
    }

    pub fn has_cli(&self, cli_type: &CLIType) -> bool {
        self.detected_clis
            .iter()
            .any(|cli| match (cli_type, &cli.cli_type) {
                (CLIType::Claude, CLIType::Claude) => true,
                (CLIType::Gemini, CLIType::Gemini) => true,
                (CLIType::OpenAI, CLIType::OpenAI) => true,
                (CLIType::Custom(a), CLIType::Custom(b)) => a == b,
                _ => false,
            })
    }

    pub async fn execute(
        &self,
        cli_type: &CLIType,
        command: CLICommand,
    ) -> Result<CLIResponse, CLIError> {
        let cli = self
            .detected_clis
            .iter()
            .find(|c| match (cli_type, &c.cli_type) {
                (CLIType::Claude, CLIType::Claude) => true,
                (CLIType::Gemini, CLIType::Gemini) => true,
                (CLIType::OpenAI, CLIType::OpenAI) => true,
                (CLIType::Custom(a), CLIType::Custom(b)) => a == b,
                _ => false,
            })
            .ok_or_else(|| CLIError::NotFound(format!("{:?}", cli_type)))?;

        let start = Instant::now();

        let output = match cli_type {
            CLIType::Claude => self.execute_claude(cli, &command).await?,
            CLIType::Gemini => self.execute_gemini(cli, &command).await?,
            CLIType::OpenAI => self.execute_openai(cli, &command).await?,
            CLIType::Custom(_) => {
                return Err(CLIError::ExecutionFailed(
                    "Custom CLIs not yet supported".to_string(),
                ))
            }
        };

        let execution_time_ms = start.elapsed().as_millis() as u64;

        Ok(CLIResponse {
            content: output,
            cli_type: cli_type.clone(),
            execution_time_ms,
            metadata: ResponseMetadata {
                model: None,
                tokens_used: None,
                finish_reason: None,
            },
        })
    }

    async fn execute_claude(
        &self,
        cli: &DetectedCLI,
        command: &CLICommand,
    ) -> Result<String, CLIError> {
        use std::io::Write;

        let mut cmd = Command::new(&cli.path);
        cmd.stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // Add Claude-specific flags
        if command.options.print_mode {
            cmd.arg("-p");
        }

        match command.options.output_format {
            OutputFormat::Text => cmd.arg("--output-format").arg("text"),
            OutputFormat::Json => cmd.arg("--output-format").arg("json"),
            OutputFormat::StreamJson => cmd.arg("--output-format").arg("stream-json"),
        };

        // Execute with timeout and pipe prompt via stdin
        let output = timeout(Duration::from_millis(self.timeout_ms), async {
            let prompt_clone = command.prompt.clone();
            tokio::task::spawn_blocking(move || {
                let mut child = cmd.spawn()?;

                // Write prompt to stdin
                if let Some(mut stdin) = child.stdin.take() {
                    stdin.write_all(prompt_clone.as_bytes())?;
                    // Close stdin to signal EOF
                    drop(stdin);
                }

                child.wait_with_output()
            })
            .await
        })
        .await
        .map_err(|_| CLIError::Timeout(self.timeout_ms))?
        .map_err(|e| CLIError::ExecutionFailed(format!("Spawn error: {}", e)))?
        .map_err(|e| CLIError::Io(e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(CLIError::ExecutionFailed(format!(
                "Claude CLI failed: {}",
                stderr
            )));
        }

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();

        // Check for empty response
        let trimmed = stdout.trim();
        if trimmed.is_empty() {
            return Err(CLIError::ExecutionFailed(
                "Claude CLI returned empty response".to_string(),
            ));
        }

        Ok(trimmed.to_string())
    }

    async fn execute_gemini(
        &self,
        cli: &DetectedCLI,
        command: &CLICommand,
    ) -> Result<String, CLIError> {
        let mut cmd = Command::new(&cli.path);
        cmd.stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // Add prompt
        cmd.arg(&command.prompt);

        // Execute with timeout
        let output = timeout(Duration::from_millis(self.timeout_ms), async {
            tokio::task::spawn_blocking(move || cmd.output()).await
        })
        .await
        .map_err(|_| CLIError::Timeout(self.timeout_ms))?
        .map_err(|e| CLIError::ExecutionFailed(format!("Spawn error: {}", e)))?
        .map_err(|e| CLIError::Io(e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(CLIError::ExecutionFailed(format!(
                "Gemini CLI failed: {}",
                stderr
            )));
        }

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        Ok(stdout.trim().to_string())
    }

    async fn execute_openai(
        &self,
        cli: &DetectedCLI,
        command: &CLICommand,
    ) -> Result<String, CLIError> {
        let mut cmd = Command::new(&cli.path);
        cmd.stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // OpenAI CLI might use different syntax
        cmd.arg("api").arg("chat.completions.create");
        cmd.arg("-m").arg("gpt-4");
        cmd.arg("-g").arg("user").arg(&command.prompt);

        // Execute with timeout
        let output = timeout(Duration::from_millis(self.timeout_ms), async {
            tokio::task::spawn_blocking(move || cmd.output()).await
        })
        .await
        .map_err(|_| CLIError::Timeout(self.timeout_ms))?
        .map_err(|e| CLIError::ExecutionFailed(format!("Spawn error: {}", e)))?
        .map_err(|e| CLIError::Io(e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(CLIError::ExecutionFailed(format!(
                "OpenAI CLI failed: {}",
                stderr
            )));
        }

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();

        // Try to parse JSON response if applicable
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
            if let Some(content) = json["choices"][0]["message"]["content"].as_str() {
                return Ok(content.to_string());
            }
        }

        Ok(stdout.trim().to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_claude_execution() {
        let connector = CLIConnector::new(30000); // 30s timeout

        if connector.has_cli(&CLIType::Claude) {
            let command = CLICommand {
                prompt: "What is 2+2?".to_string(),
                options: CommandOptions::default(),
            };

            let result = connector.execute(&CLIType::Claude, command).await;
            assert!(
                result.is_ok(),
                "Claude execution failed: {:?}",
                result.err()
            );

            let response = result.unwrap();
            println!("Claude response: {}", response.content);
            assert!(response.content.contains("4"));
        }
    }
}
