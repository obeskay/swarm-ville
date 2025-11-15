use crate::agents::{
    AgentConfig, AgentDecisionContext, AgentMemory, AgentMessage, AgentState, LLMProvider,
    MessageBus, Position,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::mpsc;

/// Agent action - what the agent decides to do
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "action")]
pub enum AgentAction {
    #[serde(rename = "move")]
    Move { x: u32, y: u32, reason: String },
    #[serde(rename = "wait")]
    Wait { reason: String },
    #[serde(rename = "speak")]
    Speak {
        content: String,
        recipient: Option<String>,
    },
    #[serde(rename = "complete_task")]
    CompleteTask { task_id: String, result: String },
}

/// External message to agent
#[derive(Debug, Clone)]
pub enum AgentInputMessage {
    Shutdown,
    Message { from: String, content: String },
    AssignTask { task_id: String, task_name: String },
}

/// Runtime state for an agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentRuntimeState {
    pub id: String,
    pub name: String,
    pub role: String,
    pub position: Position,
    pub state: AgentState,
    pub last_update: DateTime<Utc>,
    pub current_task: Option<String>,
}

/// An autonomous agent that runs in its own tokio task
pub struct Agent {
    pub id: String,
    pub name: String,
    pub role: String,
    pub model_provider: String,
    pub space_id: String,

    // State
    state: AgentState,
    position: Position,
    last_state_change: DateTime<Utc>,

    // Memory
    memory: AgentMemory,
    current_task: Option<String>,

    // Communication
    rx: mpsc::UnboundedReceiver<AgentInputMessage>,
    message_bus: MessageBus,

    // Periodic decision making
    decision_interval_secs: u64,

    // LLM Provider for decision making
    llm_provider: Option<Arc<dyn LLMProvider>>,
}

impl Agent {
    pub fn new(
        config: AgentConfig,
        rx: mpsc::UnboundedReceiver<AgentInputMessage>,
        message_bus: MessageBus,
    ) -> Self {
        Agent {
            id: uuid::Uuid::new_v4().to_string(),
            name: config.name,
            role: config.role,
            model_provider: config.model_provider,
            space_id: config.space_id,

            state: AgentState::Idle,
            position: config.initial_position,
            last_state_change: Utc::now(),

            memory: AgentMemory::new(),
            current_task: None,

            rx,
            message_bus,
            decision_interval_secs: 5,
            llm_provider: None,
        }
    }

    /// Set LLM provider for this agent
    pub fn with_llm_provider(mut self, provider: Arc<dyn LLMProvider>) -> Self {
        self.llm_provider = Some(provider);
        self
    }

    /// Get current runtime state
    pub fn get_state(&self) -> AgentRuntimeState {
        AgentRuntimeState {
            id: self.id.clone(),
            name: self.name.clone(),
            role: self.role.clone(),
            position: self.position.clone(),
            state: self.state,
            last_update: Utc::now(),
            current_task: self.current_task.clone(),
        }
    }

    /// Main agent loop - runs in tokio task
    pub async fn run(mut self) {
        let mut message_rx = self.message_bus.subscribe();
        let mut decision_interval =
            tokio::time::interval(std::time::Duration::from_secs(self.decision_interval_secs));

        loop {
            tokio::select! {
                // Handle incoming messages
                Some(msg) = self.rx.recv() => {
                    match msg {
                        AgentInputMessage::Shutdown => {
                            tracing::info!("Agent {} shutting down", self.id);
                            break;
                        }
                        AgentInputMessage::Message { from, content } => {
                            self.handle_incoming_message(&from, &content).await;
                        }
                        AgentInputMessage::AssignTask { task_id, task_name } => {
                            self.handle_task_assignment(&task_id, &task_name).await;
                        }
                    }
                }

                // Periodic autonomous decision making
                _ = decision_interval.tick() => {
                    self.autonomous_decision().await;
                }

                // Listen to broadcasts from other agents
                Ok(msg) = message_rx.recv() => {
                    self.process_broadcast_message(&msg).await;
                }
            }
        }
    }

    /// Handle incoming message from user or other agent
    async fn handle_incoming_message(&mut self, from: &str, content: &str) {
        // Record in memory
        self.memory
            .add_conversation(from.to_string(), content.to_string(), Some(self.id.clone()));

        // Transition to Listening if idle
        if self.state == AgentState::Idle {
            self.transition_state(AgentState::Listening).await;
        }
    }

    /// Handle task assignment
    async fn handle_task_assignment(&mut self, task_id: &str, task_name: &str) {
        self.memory
            .assign_task(task_id.to_string(), task_name.to_string());
        self.current_task = Some(task_id.to_string());

        // Broadcast that we received the task
        self.message_bus
            .publish(AgentMessage::TaskAssigned {
                agent_id: self.id.clone(),
                task_id: task_id.to_string(),
                task_name: task_name.to_string(),
            })
            .await;
    }

    /// Process broadcast messages from other agents
    async fn process_broadcast_message(&mut self, _msg: &AgentMessage) {
        // In Phase 2, we'll implement sophisticated message processing
        // For Phase 1, just receiving is enough
    }

    /// Periodic autonomous decision making
    async fn autonomous_decision(&mut self) {
        if self.state != AgentState::Idle {
            return; // Only make decisions when idle
        }

        self.transition_state(AgentState::Thinking).await;

        // Use LLM provider if available, otherwise fallback to mock
        let action = if let Some(provider) = &self.llm_provider {
            // Build context for LLM
            let context = AgentDecisionContext::from_agent(
                &self.id,
                &self.name,
                &self.role,
                &self.position,
                &self.memory,
                self.current_task.as_ref(),
                vec![], // TODO: Get nearby agents from runtime
            );

            // Call LLM provider
            match provider.make_decision(&context).await {
                Ok(action) => action,
                Err(e) => {
                    tracing::error!("LLM decision failed for {}: {}", self.name, e);
                    self.transition_state(AgentState::Error).await;
                    self.transition_state(AgentState::Idle).await;
                    return;
                }
            }
        } else {
            // Fallback to mock decision
            self.mock_decision().await
        };

        // Execute the action
        self.execute_action(action).await;

        self.transition_state(AgentState::Idle).await;
    }

    /// Mock decision for Phase 1 (before real LLM integration)
    async fn mock_decision(&self) -> AgentAction {
        use rand::Rng;
        let mut rng = rand::thread_rng();

        // Random action for testing
        match rng.gen_range(0..3) {
            0 => {
                let new_x = rng.gen_range(0..100);
                let new_y = rng.gen_range(0..100);
                AgentAction::Move {
                    x: new_x,
                    y: new_y,
                    reason: "exploring".to_string(),
                }
            }
            1 => AgentAction::Wait {
                reason: "resting".to_string(),
            },
            _ => AgentAction::Speak {
                content: format!("{} is thinking...", self.name),
                recipient: Some("broadcast".to_string()),
            },
        }
    }

    /// Execute an action
    async fn execute_action(&mut self, action: AgentAction) {
        match action {
            AgentAction::Move { x, y, reason } => {
                self.position = Position { x, y };
                self.memory.add_conversation(
                    "system".to_string(),
                    format!("Moved to ({}, {}) - {}", x, y, reason),
                    None,
                );

                self.message_bus
                    .publish(AgentMessage::AgentMoved {
                        agent_id: self.id.clone(),
                        x,
                        y,
                    })
                    .await;
            }

            AgentAction::Wait { reason } => {
                self.memory.add_conversation(
                    "system".to_string(),
                    format!("Waiting - {}", reason),
                    None,
                );
            }

            AgentAction::Speak { content, recipient } => {
                self.transition_state(AgentState::Speaking).await;

                self.memory
                    .add_conversation(self.id.clone(), content.clone(), recipient.clone());

                self.message_bus
                    .publish(AgentMessage::AgentSpoke {
                        agent_id: self.id.clone(),
                        content,
                        recipient,
                    })
                    .await;
            }

            AgentAction::CompleteTask { task_id, result } => {
                self.memory
                    .update_task_status(&task_id, crate::agents::memory::TaskStatus::Completed);
                self.current_task = None;

                self.message_bus
                    .publish(AgentMessage::TaskCompleted {
                        agent_id: self.id.clone(),
                        task_id,
                        result,
                    })
                    .await;
            }
        }
    }

    /// Transition state with validation and logging
    async fn transition_state(&mut self, new_state: AgentState) {
        if self.state.can_transition_to(new_state) {
            let old_state = self.state;
            self.state = new_state;
            self.last_state_change = Utc::now();

            tracing::debug!(
                "Agent {} transitioned: {} -> {}",
                self.id,
                old_state,
                new_state
            );

            // Broadcast state change
            self.message_bus
                .publish(AgentMessage::AgentStateChanged {
                    agent_id: self.id.clone(),
                    old_state: old_state.to_string(),
                    new_state: new_state.to_string(),
                })
                .await;
        } else {
            tracing::warn!(
                "Agent {} invalid state transition: {} -> {}",
                self.id,
                self.state,
                new_state
            );
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_agent_creation() {
        let config = AgentConfig {
            name: "Test Agent".to_string(),
            role: "tester".to_string(),
            model_provider: "mock".to_string(),
            model_name: "mock".to_string(),
            initial_position: Position { x: 10, y: 10 },
            space_id: "space_001".to_string(),
        };

        let (_tx, rx) = mpsc::unbounded_channel();
        let bus = MessageBus::new(10);
        let agent = Agent::new(config, rx, bus);

        assert_eq!(agent.name, "Test Agent");
        assert_eq!(agent.state, AgentState::Idle);
    }

    #[tokio::test]
    async fn test_agent_state_transitions() {
        let config = AgentConfig {
            name: "Test Agent".to_string(),
            role: "tester".to_string(),
            model_provider: "mock".to_string(),
            model_name: "mock".to_string(),
            initial_position: Position { x: 10, y: 10 },
            space_id: "space_001".to_string(),
        };

        let (_tx, rx) = mpsc::unbounded_channel();
        let bus = MessageBus::new(10);
        let mut agent = Agent::new(config, rx, bus);

        assert_eq!(agent.state, AgentState::Idle);

        agent.transition_state(AgentState::Thinking).await;
        assert_eq!(agent.state, AgentState::Thinking);

        agent.transition_state(AgentState::Speaking).await;
        assert_eq!(agent.state, AgentState::Speaking);
    }
}
