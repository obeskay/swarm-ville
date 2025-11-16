use crate::agents::{
    Agent, AgentConfig, AgentInputMessage, ClaudeProvider, CursorProvider, LLMProvider, MessageBus,
};
use dashmap::DashMap;
use std::sync::Arc;
use tokio::sync::mpsc;
use tokio::task::JoinHandle;

/// Handle to an agent task
type AgentTaskHandle = JoinHandle<()>;

/// Agent Runtime - orchestrates all agents
pub struct AgentRuntime {
    /// Active agents: agent_id -> (task_handle, sender)
    agents: Arc<DashMap<String, (AgentTaskHandle, mpsc::UnboundedSender<AgentInputMessage>)>>,
    /// Message bus for inter-agent communication
    message_bus: Arc<MessageBus>,
}

impl AgentRuntime {
    /// Create new agent runtime
    pub fn new(message_bus_capacity: usize) -> Self {
        AgentRuntime {
            agents: Arc::new(DashMap::new()),
            message_bus: Arc::new(MessageBus::new(message_bus_capacity)),
        }
    }

    /// Create LLM provider based on config - only real providers, no mock
    fn create_provider(provider_name: &str, model_name: &str) -> Arc<dyn LLMProvider> {
        match provider_name.to_lowercase().as_str() {
            "claude" => Arc::new(ClaudeProvider::with_model(model_name)),
            "cursor" => Arc::new(CursorProvider::with_model(model_name)),
            _ => {
                // Panic if unknown provider - no mock fallback
                panic!(
                    "Unknown provider '{}'. Only 'claude' and 'cursor' are supported.",
                    provider_name
                );
            }
        }
    }

    /// Spawn a new agent with LLM provider
    pub async fn spawn_agent(&self, config: AgentConfig) -> Result<String, String> {
        let (tx, rx) = mpsc::unbounded_channel();
        let message_bus = (*self.message_bus).clone();

        // Create LLM provider based on config
        let provider = Self::create_provider(&config.model_provider, &config.model_name);

        // Check if provider is available - fail if not (no mock fallback)
        if !provider.is_available().await {
            return Err(format!(
                "Provider '{}' is not available. Please ensure {} CLI is installed and authenticated.",
                provider.name(),
                provider.name()
            ));
        }

        let agent = Agent::new(config, rx, message_bus).with_llm_provider(provider);
        let agent_id = agent.id.clone();

        // Spawn agent in tokio task
        let handle = tokio::spawn(async move {
            agent.run().await;
        });

        // Store agent handle and sender
        self.agents.insert(agent_id.clone(), (handle, tx));

        Ok(agent_id)
    }

    /// Terminate an agent
    pub async fn terminate_agent(&self, agent_id: &str) -> Result<(), String> {
        if let Some((_id, (handle, tx))) = self.agents.remove(agent_id) {
            // Send shutdown message
            let _ = tx.send(AgentInputMessage::Shutdown);

            // Wait for task to finish (with timeout)
            let _ = tokio::time::timeout(std::time::Duration::from_secs(5), handle).await;

            Ok(())
        } else {
            Err(format!("Agent {} not found", agent_id))
        }
    }

    /// Send a message to an agent
    pub async fn send_message_to_agent(
        &self,
        agent_id: &str,
        from: String,
        content: String,
    ) -> Result<(), String> {
        if let Some(entry) = self.agents.get(agent_id) {
            let (_handle, tx) = entry.value();
            tx.send(AgentInputMessage::Message { from, content })
                .map_err(|e| format!("Failed to send message: {}", e))
        } else {
            Err(format!("Agent {} not found", agent_id))
        }
    }

    /// Assign a task to an agent
    pub async fn assign_task_to_agent(
        &self,
        agent_id: &str,
        task_id: String,
        task_name: String,
    ) -> Result<(), String> {
        if let Some(entry) = self.agents.get(agent_id) {
            let (_handle, tx) = entry.value();
            tx.send(AgentInputMessage::AssignTask { task_id, task_name })
                .map_err(|e| format!("Failed to assign task: {}", e))
        } else {
            Err(format!("Agent {} not found", agent_id))
        }
    }

    /// Get all active agent IDs
    pub fn get_all_agent_ids(&self) -> Vec<String> {
        self.agents
            .iter()
            .map(|entry| entry.key().clone())
            .collect()
    }

    /// Check if agent exists
    pub fn agent_exists(&self, agent_id: &str) -> bool {
        self.agents.contains_key(agent_id)
    }

    /// Get number of active agents
    pub fn agent_count(&self) -> usize {
        self.agents.len()
    }

    /// Get message bus reference
    pub fn message_bus(&self) -> &MessageBus {
        &self.message_bus
    }

    /// Graceful shutdown of all agents
    pub async fn shutdown(&self) {
        let agent_ids: Vec<_> = self.get_all_agent_ids();

        for agent_id in agent_ids {
            let _ = self.terminate_agent(&agent_id).await;
        }
    }
}

impl Clone for AgentRuntime {
    fn clone(&self) -> Self {
        AgentRuntime {
            agents: Arc::clone(&self.agents),
            message_bus: Arc::clone(&self.message_bus),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agents::Position;

    #[tokio::test]
    async fn test_spawn_agent() {
        let runtime = AgentRuntime::new(10);
        let config = AgentConfig {
            name: "Test Agent".to_string(),
            role: "tester".to_string(),
            model_provider: "mock".to_string(),
            model_name: "mock".to_string(),
            initial_position: Position { x: 10, y: 10 },
            space_id: "space_001".to_string(),
        };

        let result = runtime.spawn_agent(config).await;
        assert!(result.is_ok());

        let agent_id = result.unwrap();
        assert!(runtime.agent_exists(&agent_id));
        assert_eq!(runtime.agent_count(), 1);
    }

    #[tokio::test]
    async fn test_terminate_agent() {
        let runtime = AgentRuntime::new(10);
        let config = AgentConfig {
            name: "Test Agent".to_string(),
            role: "tester".to_string(),
            model_provider: "mock".to_string(),
            model_name: "mock".to_string(),
            initial_position: Position { x: 10, y: 10 },
            space_id: "space_001".to_string(),
        };

        let agent_id = runtime.spawn_agent(config).await.unwrap();
        assert_eq!(runtime.agent_count(), 1);

        runtime.terminate_agent(&agent_id).await.unwrap();
        assert_eq!(runtime.agent_count(), 0);
    }

    #[tokio::test]
    async fn test_multiple_agents() {
        let runtime = AgentRuntime::new(10);

        for i in 0..5 {
            let config = AgentConfig {
                name: format!("Agent {}", i),
                role: "tester".to_string(),
                model_provider: "mock".to_string(),
                model_name: "mock".to_string(),
                initial_position: Position {
                    x: i * 10,
                    y: i * 10,
                },
                space_id: "space_001".to_string(),
            };
            runtime.spawn_agent(config).await.unwrap();
        }

        assert_eq!(runtime.agent_count(), 5);
    }

    #[tokio::test]
    async fn test_send_message_to_agent() {
        let runtime = AgentRuntime::new(10);
        let config = AgentConfig {
            name: "Test Agent".to_string(),
            role: "tester".to_string(),
            model_provider: "mock".to_string(),
            model_name: "mock".to_string(),
            initial_position: Position { x: 10, y: 10 },
            space_id: "space_001".to_string(),
        };

        let agent_id = runtime.spawn_agent(config).await.unwrap();

        let result = runtime
            .send_message_to_agent(&agent_id, "user".to_string(), "Hello agent".to_string())
            .await;

        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_clone() {
        let runtime = AgentRuntime::new(10);
        let config = AgentConfig {
            name: "Test Agent".to_string(),
            role: "tester".to_string(),
            model_provider: "mock".to_string(),
            model_name: "mock".to_string(),
            initial_position: Position { x: 10, y: 10 },
            space_id: "space_001".to_string(),
        };

        let agent_id = runtime.spawn_agent(config).await.unwrap();

        // Clone runtime and verify shared state
        let runtime2 = runtime.clone();
        assert!(runtime2.agent_exists(&agent_id));
        assert_eq!(runtime2.agent_count(), 1);
    }
}
