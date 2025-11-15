use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;

/// Agent conversation entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationEntry {
    pub timestamp: DateTime<Utc>,
    pub sender: String, // agent_id or "user" or "system"
    pub content: String,
    pub recipient: Option<String>, // specific agent_id or "broadcast"
}

/// Agent task entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskEntry {
    pub task_id: String,
    pub task_name: String,
    pub status: TaskStatus,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Assigned,
    InProgress,
    Completed,
    Failed,
}

impl TaskStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            TaskStatus::Assigned => "assigned",
            TaskStatus::InProgress => "in_progress",
            TaskStatus::Completed => "completed",
            TaskStatus::Failed => "failed",
        }
    }
}

/// Agent memory - holds conversation history and tasks
/// Kept in-memory for fast access, synced to SQLite periodically
#[derive(Debug, Clone)]
pub struct AgentMemory {
    /// Recent conversation history (bounded to last 100 entries)
    conversations: VecDeque<ConversationEntry>,
    /// Active and recent tasks
    tasks: Vec<TaskEntry>,
    /// Max conversations to keep in memory
    max_conversations: usize,
}

impl AgentMemory {
    pub fn new() -> Self {
        AgentMemory {
            conversations: VecDeque::with_capacity(100),
            tasks: Vec::new(),
            max_conversations: 100,
        }
    }

    /// Add a conversation entry
    pub fn add_conversation(&mut self, sender: String, content: String, recipient: Option<String>) {
        let entry = ConversationEntry {
            timestamp: Utc::now(),
            sender,
            content,
            recipient,
        };

        self.conversations.push_back(entry);

        // Keep only recent conversations in memory
        while self.conversations.len() > self.max_conversations {
            self.conversations.pop_front();
        }
    }

    /// Get recent conversations (most recent first)
    pub fn get_recent_conversations(&self, limit: usize) -> Vec<ConversationEntry> {
        self.conversations
            .iter()
            .rev()
            .take(limit)
            .cloned()
            .collect()
    }

    /// Assign a task to this agent
    pub fn assign_task(&mut self, task_id: String, task_name: String) {
        let entry = TaskEntry {
            task_id,
            task_name,
            status: TaskStatus::Assigned,
            created_at: Utc::now(),
            completed_at: None,
        };
        self.tasks.push(entry);
    }

    /// Update task status
    pub fn update_task_status(&mut self, task_id: &str, status: TaskStatus) {
        if let Some(task) = self.tasks.iter_mut().find(|t| t.task_id == task_id) {
            task.status = status;
            if status == TaskStatus::Completed || status == TaskStatus::Failed {
                task.completed_at = Some(Utc::now());
            }
        }
    }

    /// Get all tasks with given status
    pub fn get_tasks_by_status(&self, status: TaskStatus) -> Vec<TaskEntry> {
        self.tasks
            .iter()
            .filter(|t| t.status == status)
            .cloned()
            .collect()
    }

    /// Get current active tasks (assigned or in_progress)
    pub fn get_active_tasks(&self) -> Vec<TaskEntry> {
        self.tasks
            .iter()
            .filter(|t| t.status == TaskStatus::Assigned || t.status == TaskStatus::InProgress)
            .cloned()
            .collect()
    }

    /// Get all tasks
    pub fn get_all_tasks(&self) -> &[TaskEntry] {
        &self.tasks
    }

    /// Build context string for LLM prompt
    /// Includes recent conversations and current tasks
    pub fn build_context(&self) -> String {
        let mut context = String::new();

        // Recent conversations
        let recent = self.get_recent_conversations(5);
        if !recent.is_empty() {
            context.push_str("Recent conversations:\n");
            for entry in recent.iter().rev() {
                context.push_str(&format!("- {}: {}\n", entry.sender, entry.content));
            }
            context.push('\n');
        }

        // Active tasks
        let active = self.get_active_tasks();
        if !active.is_empty() {
            context.push_str("Current tasks:\n");
            for task in active {
                context.push_str(&format!(
                    "- [{}] {} (id: {})\n",
                    task.status.as_str(),
                    task.task_name,
                    task.task_id
                ));
            }
        }

        context
    }

    /// Clear all memory (for testing or reset)
    pub fn clear(&mut self) {
        self.conversations.clear();
        self.tasks.clear();
    }
}

impl Default for AgentMemory {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_conversation() {
        let mut memory = AgentMemory::new();
        memory.add_conversation("user".to_string(), "Hello agent".to_string(), None);

        let recent = memory.get_recent_conversations(10);
        assert_eq!(recent.len(), 1);
        assert_eq!(recent[0].sender, "user");
    }

    #[test]
    fn test_conversation_limit() {
        let mut memory = AgentMemory::new();
        for i in 0..150 {
            memory.add_conversation("user".to_string(), format!("Message {}", i), None);
        }

        // Should only keep last 100
        assert_eq!(memory.conversations.len(), 100);
    }

    #[test]
    fn test_task_management() {
        let mut memory = AgentMemory::new();
        memory.assign_task("task_1".to_string(), "Research X".to_string());

        let assigned = memory.get_tasks_by_status(TaskStatus::Assigned);
        assert_eq!(assigned.len(), 1);

        memory.update_task_status("task_1", TaskStatus::InProgress);
        let in_progress = memory.get_tasks_by_status(TaskStatus::InProgress);
        assert_eq!(in_progress.len(), 1);
    }

    #[test]
    fn test_build_context() {
        let mut memory = AgentMemory::new();
        memory.add_conversation("user".to_string(), "Hello".to_string(), None);
        memory.assign_task("task_1".to_string(), "Find data".to_string());

        let context = memory.build_context();
        assert!(context.contains("Hello"));
        assert!(context.contains("Find data"));
    }
}
