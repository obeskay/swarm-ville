use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub space_id: String,
    pub role: String,
    pub model_provider: String,
    pub model_name: String,
    pub position: Position,
    pub state: AgentState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: u32,
    pub y: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentState {
    Idle,
    Listening,
    Thinking,
    Speaking,
    Error,
}

impl Agent {
    pub fn new(
        name: String,
        space_id: String,
        role: String,
        model_provider: String,
        model_name: String,
    ) -> Self {
        Agent {
            id: Uuid::new_v4().to_string(),
            name,
            space_id,
            role,
            model_provider,
            model_name,
            position: Position { x: 25, y: 25 },
            state: AgentState::Idle,
        }
    }
}
