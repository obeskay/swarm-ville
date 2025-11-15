use async_trait::async_trait;
use rand::Rng;

use crate::agents::agent::AgentAction;
use crate::agents::llm_provider::{AgentDecisionContext, LLMError, LLMProvider};

/// Mock LLM provider for testing (uses random decisions)
pub struct MockProvider {
    deterministic: bool,
}

impl MockProvider {
    /// Create new mock provider with random decisions
    pub fn new() -> Self {
        Self {
            deterministic: false,
        }
    }

    /// Create deterministic mock provider (always returns same action)
    pub fn deterministic() -> Self {
        Self {
            deterministic: true,
        }
    }
}

impl Default for MockProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl LLMProvider for MockProvider {
    async fn make_decision(&self, context: &AgentDecisionContext) -> Result<AgentAction, LLMError> {
        if self.deterministic {
            // Always return wait for testing
            Ok(AgentAction::Wait {
                reason: format!("Mock decision for {}", context.agent_name),
            })
        } else {
            // Random decision
            let mut rng = rand::thread_rng();

            match rng.gen_range(0..4) {
                0 => {
                    let new_x = rng.gen_range(0..100);
                    let new_y = rng.gen_range(0..100);
                    Ok(AgentAction::Move {
                        x: new_x,
                        y: new_y,
                        reason: "mock exploring".to_string(),
                    })
                }
                1 => Ok(AgentAction::Wait {
                    reason: "mock resting".to_string(),
                }),
                2 => Ok(AgentAction::Speak {
                    content: format!("{} is mock thinking...", context.agent_name),
                    recipient: Some("broadcast".to_string()),
                }),
                _ => {
                    // If there's a current task, sometimes complete it
                    if let Some(task_id) = &context.current_task {
                        Ok(AgentAction::CompleteTask {
                            task_id: task_id.clone(),
                            result: "mock completed".to_string(),
                        })
                    } else {
                        Ok(AgentAction::Wait {
                            reason: "mock waiting".to_string(),
                        })
                    }
                }
            }
        }
    }

    async fn generate_text(&self, prompt: &str) -> Result<String, LLMError> {
        Ok(format!("Mock response to: {}", prompt))
    }

    fn name(&self) -> &str {
        "mock"
    }

    async fn is_available(&self) -> bool {
        true // Mock is always available
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agents::memory::AgentMemory;
    use crate::agents::Position;

    #[tokio::test]
    async fn test_mock_provider_deterministic() {
        let provider = MockProvider::deterministic();
        let context = AgentDecisionContext::from_agent(
            "test_id",
            "Test Agent",
            "tester",
            &Position { x: 10, y: 10 },
            &AgentMemory::new(),
            None,
            vec![],
        );

        let action = provider.make_decision(&context).await.unwrap();

        // Should always be Wait
        match action {
            AgentAction::Wait { .. } => {}
            _ => panic!("Expected Wait action"),
        }
    }

    #[tokio::test]
    async fn test_mock_provider_random() {
        let provider = MockProvider::new();
        let context = AgentDecisionContext::from_agent(
            "test_id",
            "Test Agent",
            "tester",
            &Position { x: 10, y: 10 },
            &AgentMemory::new(),
            None,
            vec![],
        );

        // Should return some action (random)
        let action = provider.make_decision(&context).await;
        assert!(action.is_ok());
    }

    #[tokio::test]
    async fn test_mock_always_available() {
        let provider = MockProvider::new();
        assert!(provider.is_available().await);
    }
}
