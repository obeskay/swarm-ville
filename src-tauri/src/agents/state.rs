use serde::{Deserialize, Serialize};

/// Agent state machine
/// Flow: Idle -> Listening -> Thinking -> Speaking -> Idle
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentState {
    Idle,
    Listening,
    Thinking,
    Speaking,
    Error,
}

impl AgentState {
    /// Check if state transition is valid
    pub fn can_transition_to(&self, next_state: AgentState) -> bool {
        match (self, next_state) {
            // Idle can go to Listening or Thinking
            (AgentState::Idle, AgentState::Listening) => true,
            (AgentState::Idle, AgentState::Thinking) => true,
            (AgentState::Idle, AgentState::Idle) => true, // No-op, allowed

            // Listening can go to Thinking
            (AgentState::Listening, AgentState::Thinking) => true,
            (AgentState::Listening, AgentState::Idle) => true, // Timeout

            // Thinking can go to Speaking
            (AgentState::Thinking, AgentState::Speaking) => true,
            (AgentState::Thinking, AgentState::Idle) => true, // Direct back to idle

            // Speaking can go to Idle
            (AgentState::Speaking, AgentState::Idle) => true,
            (AgentState::Speaking, AgentState::Thinking) => false, // Can't go back to thinking

            // Error can go to Idle
            (AgentState::Error, AgentState::Idle) => true,

            // Any state can go to Error
            (_, AgentState::Error) => true,

            // Default: not allowed
            _ => false,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            AgentState::Idle => "idle",
            AgentState::Listening => "listening",
            AgentState::Thinking => "thinking",
            AgentState::Speaking => "speaking",
            AgentState::Error => "error",
        }
    }
}

impl std::fmt::Display for AgentState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_state_transitions() {
        assert!(AgentState::Idle.can_transition_to(AgentState::Listening));
        assert!(AgentState::Idle.can_transition_to(AgentState::Thinking));
        assert!(AgentState::Listening.can_transition_to(AgentState::Thinking));
        assert!(AgentState::Thinking.can_transition_to(AgentState::Speaking));
        assert!(AgentState::Speaking.can_transition_to(AgentState::Idle));
    }

    #[test]
    fn test_invalid_state_transitions() {
        assert!(!AgentState::Speaking.can_transition_to(AgentState::Thinking));
        assert!(!AgentState::Idle.can_transition_to(AgentState::Speaking));
    }

    #[test]
    fn test_error_recovery() {
        assert!(AgentState::Thinking.can_transition_to(AgentState::Error));
        assert!(AgentState::Error.can_transition_to(AgentState::Idle));
    }
}
