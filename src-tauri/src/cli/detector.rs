use super::types::{CLIType, DetectedCLI};
use std::path::PathBuf;
use std::process::Command;

/// Detects all installed AI CLIs in the system
pub fn detect_installed_clis() -> Vec<DetectedCLI> {
    let mut detected = Vec::new();

    // Check for Claude CLI
    if let Some(cli) = detect_claude_cli() {
        detected.push(cli);
    }

    // Check for Gemini CLI
    if let Some(cli) = detect_gemini_cli() {
        detected.push(cli);
    }

    // Check for OpenAI CLI
    if let Some(cli) = detect_openai_cli() {
        detected.push(cli);
    }

    detected
}

fn detect_claude_cli() -> Option<DetectedCLI> {
    let paths = vec![
        "/opt/homebrew/bin/claude",
        "/usr/local/bin/claude",
        "/usr/bin/claude",
    ];

    for path_str in paths {
        let path = PathBuf::from(path_str);
        if path.exists() {
            // Verify it works
            if let Ok(output) = Command::new(&path).arg("--help").output() {
                if output.status.success() {
                    // Extract version if possible
                    let version = extract_version(&output.stdout);

                    return Some(DetectedCLI {
                        cli_type: CLIType::Claude,
                        path,
                        version,
                        verified: true,
                        capabilities: vec![
                            "text".to_string(),
                            "json".to_string(),
                            "stream".to_string(),
                            "mcp".to_string(),
                        ],
                    });
                }
            }
        }
    }

    None
}

fn detect_gemini_cli() -> Option<DetectedCLI> {
    let paths = vec![
        "/opt/homebrew/bin/gemini",
        "/usr/local/bin/gemini",
        "/usr/bin/gemini",
    ];

    for path_str in paths {
        let path = PathBuf::from(path_str);
        if path.exists() {
            if let Ok(output) = Command::new(&path).arg("--help").output() {
                if output.status.success() {
                    let version = extract_version(&output.stdout);

                    return Some(DetectedCLI {
                        cli_type: CLIType::Gemini,
                        path,
                        version,
                        verified: true,
                        capabilities: vec![
                            "text".to_string(),
                            "vision".to_string(),
                            "function_calling".to_string(),
                        ],
                    });
                }
            }
        }
    }

    None
}

fn detect_openai_cli() -> Option<DetectedCLI> {
    let paths = vec![
        "/opt/homebrew/bin/openai",
        "/usr/local/bin/openai",
        "/usr/bin/openai",
    ];

    for path_str in paths {
        let path = PathBuf::from(path_str);
        if path.exists() {
            if let Ok(output) = Command::new(&path).arg("--help").output() {
                if output.status.success() {
                    let version = extract_version(&output.stdout);

                    return Some(DetectedCLI {
                        cli_type: CLIType::OpenAI,
                        path,
                        version,
                        verified: true,
                        capabilities: vec![
                            "text".to_string(),
                            "vision".to_string(),
                            "function_calling".to_string(),
                            "embeddings".to_string(),
                        ],
                    });
                }
            }
        }
    }

    None
}

fn extract_version(output: &[u8]) -> Option<String> {
    let output_str = String::from_utf8_lossy(output);

    // Try to find version pattern
    for line in output_str.lines() {
        if line.contains("version") || line.contains("Version") {
            // Extract version number
            let parts: Vec<&str> = line.split_whitespace().collect();
            for part in parts {
                if part.chars().next().map_or(false, |c| c.is_numeric()) {
                    return Some(part.to_string());
                }
            }
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_clis() {
        let detected = detect_installed_clis();
        println!("Detected CLIs: {:#?}", detected);

        // Should find at least one CLI in development environment
        assert!(!detected.is_empty(), "No CLIs detected");
    }
}
