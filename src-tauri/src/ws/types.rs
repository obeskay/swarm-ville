use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ClientMessage {
    #[serde(rename = "join_space")]
    JoinSpace {
        space_id: String,
        user_id: String,
        name: String,
        is_agent: bool,
    },

    #[serde(rename = "leave_space")]
    LeaveSpace { space_id: String },

    #[serde(rename = "update_position")]
    UpdatePosition { x: f64, y: f64, direction: String },

    #[serde(rename = "chat_message")]
    ChatMessage { message: String },

    #[serde(rename = "agent_action")]
    AgentAction {
        action: String,
        target: Option<String>,
        data: Option<serde_json::Value>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ServerMessage {
    #[serde(rename = "space_state")]
    SpaceState {
        space_id: String,
        users: Vec<UserState>,
    },

    #[serde(rename = "user_joined")]
    UserJoined { user: UserState },

    #[serde(rename = "user_left")]
    UserLeft { user_id: String },

    #[serde(rename = "position_update")]
    PositionUpdate {
        user_id: String,
        x: f64,
        y: f64,
        direction: String,
    },

    #[serde(rename = "chat_broadcast")]
    ChatBroadcast {
        user_id: String,
        name: String,
        message: String,
    },

    #[serde(rename = "agent_broadcast")]
    AgentBroadcast {
        agent_id: String,
        action: String,
        data: Option<serde_json::Value>,
    },

    #[serde(rename = "error")]
    Error { message: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserState {
    pub id: String,
    pub name: String,
    pub x: f64,
    pub y: f64,
    pub direction: String,
    pub is_agent: bool,
}

#[derive(Debug, Clone)]
pub struct ConnectionInfo {
    pub user_id: String,
    pub name: String,
    pub space_id: Option<String>,
    pub is_agent: bool,
    pub x: f64,
    pub y: f64,
    pub direction: String,
}

impl Default for ConnectionInfo {
    fn default() -> Self {
        Self {
            user_id: String::new(),
            name: String::new(),
            space_id: None,
            is_agent: false,
            x: 0.0,
            y: 0.0,
            direction: "down".to_string(),
        }
    }
}

pub type SharedConnectionInfo = Arc<Mutex<ConnectionInfo>>;
