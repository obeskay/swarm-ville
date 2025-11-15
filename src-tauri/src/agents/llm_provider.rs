use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fmt;

use super::agent::AgentAction;
use super::memory::AgentMemory;
use super::Position;

/// Context for LLM to make agent decisions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentDecisionContext {
    pub agent_id: String,
    pub agent_name: String,
    pub agent_role: String,
    pub position: Position,
    pub nearby_agents: Vec<String>,
    pub current_task: Option<String>,
    pub recent_memory: String,
}

impl AgentDecisionContext {
    /// Build context from agent state
    pub fn from_agent(
        agent_id: &str,
        agent_name: &str,
        agent_role: &str,
        position: &Position,
        memory: &AgentMemory,
        current_task: Option<&String>,
        nearby_agents: Vec<String>,
    ) -> Self {
        Self {
            agent_id: agent_id.to_string(),
            agent_name: agent_name.to_string(),
            agent_role: agent_role.to_string(),
            position: position.clone(),
            nearby_agents,
            current_task: current_task.cloned(),
            recent_memory: memory.build_context(),
        }
    }

    /// Build prompt for LLM
    pub fn build_prompt(&self) -> String {
        format!(
            r#"You are {}, a {} agent in SwarmVille office simulation.

CURRENT STATE:
- Position: ({}, {})
- Current Task: {}
- Nearby Agents: {}

RECENT ACTIVITY:
{}

INSTRUCTION: Decide your next action and return ONLY a JSON object. No explanations, no markdown code blocks, ONLY raw JSON.

Required JSON format (choose ONE):
{{"action": "move", "x": 50, "y": 50, "reason": "exploring new area"}}
{{"action": "wait", "reason": "observing surroundings"}}
{{"action": "speak", "content": "Hello!", "recipient": null}}
{{"action": "complete_task", "task_id": "task_123", "result": "completed successfully"}}

Your response must start with {{ and end with }} - nothing else."#,
            self.agent_name,
            self.agent_role,
            self.position.x,
            self.position.y,
            self.current_task.as_ref().unwrap_or(&"None".to_string()),
            if self.nearby_agents.is_empty() {
                "None".to_string()
            } else {
                self.nearby_agents.join(", ")
            },
            if self.recent_memory.is_empty() {
                "No recent activity"
            } else {
                &self.recent_memory
            }
        )
    }
}

/// Error type for LLM operations
#[derive(Debug)]
pub enum LLMError {
    ExecutionFailed(String),
    ParseError(String),
    Timeout,
    NotInstalled(String),
    AuthenticationFailed,
    InvalidResponse(String),
}

impl fmt::Display for LLMError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LLMError::ExecutionFailed(msg) => write!(f, "LLM execution failed: {}", msg),
            LLMError::ParseError(msg) => write!(f, "Failed to parse LLM response: {}", msg),
            LLMError::Timeout => write!(f, "LLM request timed out"),
            LLMError::NotInstalled(cli) => write!(f, "{} CLI not installed", cli),
            LLMError::AuthenticationFailed => write!(f, "Authentication failed"),
            LLMError::InvalidResponse(msg) => write!(f, "Invalid LLM response: {}", msg),
        }
    }
}

impl Error for LLMError {}

/// Trait for LLM providers (Claude, Cursor, Mock)
#[async_trait]
pub trait LLMProvider: Send + Sync {
    /// Make decision for agent based on context
    async fn make_decision(&self, context: &AgentDecisionContext) -> Result<AgentAction, LLMError>;

    /// Generate text response for a prompt
    async fn generate_text(&self, prompt: &str) -> Result<String, LLMError>;

    /// Provider name
    fn name(&self) -> &str;

    /// Check if provider is available (CLI installed, authenticated)
    async fn is_available(&self) -> bool;
}

/// Parse JSON response from LLM into AgentAction
pub fn parse_llm_action(json_str: &str) -> Result<AgentAction, LLMError> {
    // Clean up response (remove markdown code blocks if present)
    let cleaned = json_str
        .trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();

    // Parse JSON
    let value: serde_json::Value = serde_json::from_str(cleaned)
        .map_err(|e| LLMError::ParseError(format!("JSON parse error: {}", e)))?;

    // Extract action type
    let action_type = value
        .get("action")
        .and_then(|v| v.as_str())
        .ok_or_else(|| LLMError::InvalidResponse("Missing 'action' field".to_string()))?;

    // Build AgentAction based on type
    match action_type {
        "move" => {
            let x = value
                .get("x")
                .and_then(|v| v.as_u64())
                .ok_or_else(|| LLMError::InvalidResponse("Missing 'x' field".to_string()))?
                as u32;
            let y = value
                .get("y")
                .and_then(|v| v.as_u64())
                .ok_or_else(|| LLMError::InvalidResponse("Missing 'y' field".to_string()))?
                as u32;
            let reason = value
                .get("reason")
                .and_then(|v| v.as_str())
                .unwrap_or("no reason provided")
                .to_string();

            Ok(AgentAction::Move { x, y, reason })
        }

        "wait" => {
            let reason = value
                .get("reason")
                .and_then(|v| v.as_str())
                .unwrap_or("waiting")
                .to_string();

            Ok(AgentAction::Wait { reason })
        }

        "speak" => {
            let content = value
                .get("content")
                .and_then(|v| v.as_str())
                .ok_or_else(|| LLMError::InvalidResponse("Missing 'content' field".to_string()))?
                .to_string();

            let recipient = value
                .get("recipient")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            Ok(AgentAction::Speak { content, recipient })
        }

        "complete_task" => {
            let task_id = value
                .get("task_id")
                .and_then(|v| v.as_str())
                .ok_or_else(|| LLMError::InvalidResponse("Missing 'task_id' field".to_string()))?
                .to_string();

            let result = value
                .get("result")
                .and_then(|v| v.as_str())
                .unwrap_or("completed")
                .to_string();

            Ok(AgentAction::CompleteTask { task_id, result })
        }

        _ => Err(LLMError::InvalidResponse(format!(
            "Unknown action type: {}",
            action_type
        ))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_move_action() {
        let json = r#"{"action": "move", "x": 50, "y": 75, "reason": "exploring"}"#;
        let action = parse_llm_action(json).unwrap();

        match action {
            AgentAction::Move { x, y, reason } => {
                assert_eq!(x, 50);
                assert_eq!(y, 75);
                assert_eq!(reason, "exploring");
            }
            _ => panic!("Wrong action type"),
        }
    }

    #[test]
    fn test_parse_wait_action() {
        let json = r#"{"action": "wait", "reason": "resting"}"#;
        let action = parse_llm_action(json).unwrap();

        match action {
            AgentAction::Wait { reason } => {
                assert_eq!(reason, "resting");
            }
            _ => panic!("Wrong action type"),
        }
    }

    #[test]
    fn test_parse_speak_action() {
        let json = r#"{"action": "speak", "content": "Hello!", "recipient": "agent_2"}"#;
        let action = parse_llm_action(json).unwrap();

        match action {
            AgentAction::Speak { content, recipient } => {
                assert_eq!(content, "Hello!");
                assert_eq!(recipient, Some("agent_2".to_string()));
            }
            _ => panic!("Wrong action type"),
        }
    }

    #[test]
    fn test_parse_with_markdown() {
        let json = r#"```json
{"action": "wait", "reason": "thinking"}
```"#;
        let action = parse_llm_action(json).unwrap();

        match action {
            AgentAction::Wait { reason } => {
                assert_eq!(reason, "thinking");
            }
            _ => panic!("Wrong action type"),
        }
    }
}
