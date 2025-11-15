// Core module exports for agent runtime system
pub mod agent;
pub mod llm_provider;
pub mod memory;
pub mod message_bus;
pub mod persistence;
pub mod providers;
pub mod runtime;
pub mod state;
pub mod task_orchestrator;

pub use agent::{Agent, AgentInputMessage};
pub use llm_provider::{AgentDecisionContext, LLMError, LLMProvider};
pub use memory::AgentMemory;
pub use message_bus::{AgentMessage, MessageBus};
pub use persistence::AgentPersistence;
pub use providers::{ClaudeProvider, CursorProvider, MockProvider};
pub use runtime::AgentRuntime;
pub use state::AgentState;
pub use task_orchestrator::{ComplexTask, SubTask, TaskOrchestrator};

use serde::{Deserialize, Serialize};

/// Configuration for spawning a new agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    pub name: String,
    pub role: String,
    pub model_provider: String,
    pub model_name: String,
    pub initial_position: Position,
    pub space_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: u32,
    pub y: u32,
}

impl Position {
    pub fn distance_to(&self, other: &Position) -> f32 {
        let dx = (self.x as f32) - (other.x as f32);
        let dy = (self.y as f32) - (other.y as f32);
        (dx * dx + dy * dy).sqrt()
    }
}
