use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::broadcast;

/// Messages that agents can publish to the bus
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum AgentMessage {
    /// Agent spoke/broadcast text
    #[serde(rename = "agent_spoke")]
    AgentSpoke {
        agent_id: String,
        content: String,
        /// Specific agent recipient, or "broadcast" for all
        recipient: Option<String>,
    },

    /// Agent moved position
    #[serde(rename = "agent_moved")]
    AgentMoved { agent_id: String, x: u32, y: u32 },

    /// Task assigned to agent
    #[serde(rename = "task_assigned")]
    TaskAssigned {
        agent_id: String,
        task_id: String,
        task_name: String,
    },

    /// Agent completed a task
    #[serde(rename = "task_completed")]
    TaskCompleted {
        agent_id: String,
        task_id: String,
        result: String,
    },

    /// Agent state changed
    #[serde(rename = "agent_state_changed")]
    AgentStateChanged {
        agent_id: String,
        old_state: String,
        new_state: String,
    },

    /// Generic broadcast message
    #[serde(rename = "agent_broadcast")]
    Broadcast {
        agent_id: String,
        data: serde_json::Value,
    },
}

/// Message bus for inter-agent communication
/// Uses broadcast channels for pub/sub messaging
#[derive(Clone)]
pub struct MessageBus {
    tx: Arc<broadcast::Sender<AgentMessage>>,
}

impl MessageBus {
    /// Create a new message bus with given capacity
    pub fn new(capacity: usize) -> Self {
        let (tx, _rx) = broadcast::channel(capacity);
        MessageBus { tx: Arc::new(tx) }
    }

    /// Publish a message to all subscribers
    pub async fn publish(&self, message: AgentMessage) {
        // Ignore error if no subscribers (not critical)
        let _ = self.tx.send(message);
    }

    /// Subscribe to message bus
    /// Returns a receiver for messages
    pub fn subscribe(&self) -> broadcast::Receiver<AgentMessage> {
        self.tx.subscribe()
    }

    /// Get number of active subscribers
    pub fn subscriber_count(&self) -> usize {
        self.tx.receiver_count()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_message_bus_publish_subscribe() {
        let bus = MessageBus::new(10);
        let mut rx = bus.subscribe();

        let msg = AgentMessage::AgentSpoke {
            agent_id: "agent_001".to_string(),
            content: "Hello!".to_string(),
            recipient: None,
        };

        bus.publish(msg.clone()).await;

        // Receive should get the message
        let received = rx.recv().await;
        assert!(received.is_ok());
    }

    #[tokio::test]
    async fn test_multiple_subscribers() {
        let bus = MessageBus::new(10);
        let mut rx1 = bus.subscribe();
        let mut rx2 = bus.subscribe();

        let msg = AgentMessage::AgentMoved {
            agent_id: "agent_001".to_string(),
            x: 10,
            y: 20,
        };

        bus.publish(msg).await;

        // Both should receive
        assert!(rx1.recv().await.is_ok());
        assert!(rx2.recv().await.is_ok());
    }

    #[tokio::test]
    async fn test_subscriber_count() {
        let bus = MessageBus::new(10);
        assert_eq!(bus.subscriber_count(), 0);

        let _rx1 = bus.subscribe();
        assert_eq!(bus.subscriber_count(), 1);

        let _rx2 = bus.subscribe();
        assert_eq!(bus.subscriber_count(), 2);
    }
}
