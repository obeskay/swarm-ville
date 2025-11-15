use crate::agents::memory::{ConversationEntry, TaskEntry, TaskStatus};
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection, Result as SqliteResult};
use std::sync::Arc;
use tokio::sync::Mutex;

/// Database persistence layer for agent memory
pub struct AgentPersistence {
    db: Arc<Mutex<Connection>>,
}

impl AgentPersistence {
    /// Create or open database connection
    pub fn new(db_path: &str) -> SqliteResult<Self> {
        let conn = Connection::open(db_path)?;

        // Initialize migrations
        Self::run_migrations(&conn)?;

        Ok(AgentPersistence {
            db: Arc::new(Mutex::new(conn)),
        })
    }

    /// Create in-memory database (for testing)
    pub fn new_memory() -> SqliteResult<Self> {
        let conn = Connection::open_in_memory()?;
        Self::run_migrations(&conn)?;

        Ok(AgentPersistence {
            db: Arc::new(Mutex::new(conn)),
        })
    }

    /// Run all migrations
    fn run_migrations(conn: &Connection) -> SqliteResult<()> {
        // Migration 001: Agent memory tables
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS agent_conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                sender TEXT NOT NULL,
                content TEXT NOT NULL,
                recipient TEXT,
                FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent_timestamp
            ON agent_conversations(agent_id, timestamp DESC);

            CREATE TABLE IF NOT EXISTS agent_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT NOT NULL,
                task_id TEXT NOT NULL UNIQUE,
                task_name TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'assigned',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                result TEXT,
                FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_status
            ON agent_tasks(agent_id, status);

            CREATE TABLE IF NOT EXISTS agent_state_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT NOT NULL,
                old_state TEXT NOT NULL,
                new_state TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_agent_state_history_agent_timestamp
            ON agent_state_history(agent_id, timestamp DESC);",
        )?;

        Ok(())
    }

    /// Save conversation entry
    pub async fn save_conversation(
        &self,
        agent_id: &str,
        entry: &ConversationEntry,
    ) -> SqliteResult<()> {
        let db = self.db.lock().await;

        db.execute(
            "INSERT INTO agent_conversations (agent_id, timestamp, sender, content, recipient)
             VALUES (?, ?, ?, ?, ?)",
            params![
                agent_id,
                entry.timestamp.to_rfc3339(),
                entry.sender,
                entry.content,
                entry.recipient,
            ],
        )?;

        Ok(())
    }

    /// Load recent conversations for an agent
    pub async fn load_recent_conversations(
        &self,
        agent_id: &str,
        limit: usize,
    ) -> SqliteResult<Vec<ConversationEntry>> {
        let db = self.db.lock().await;

        let mut stmt = db.prepare(
            "SELECT timestamp, sender, content, recipient FROM agent_conversations
             WHERE agent_id = ?
             ORDER BY timestamp DESC
             LIMIT ?",
        )?;

        let conversations = stmt
            .query_map(params![agent_id, limit], |row| {
                let timestamp_str: String = row.get(0)?;
                let timestamp = DateTime::parse_from_rfc3339(&timestamp_str)
                    .map(|dt| dt.with_timezone(&Utc))
                    .unwrap_or_else(|_| Utc::now());

                Ok(ConversationEntry {
                    timestamp,
                    sender: row.get(1)?,
                    content: row.get(2)?,
                    recipient: row.get(3)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(conversations)
    }

    /// Save task entry
    pub async fn save_task(&self, agent_id: &str, task: &TaskEntry) -> SqliteResult<()> {
        let db = self.db.lock().await;

        db.execute(
            "INSERT INTO agent_tasks (agent_id, task_id, task_name, status, created_at, completed_at)
             VALUES (?, ?, ?, ?, ?, ?)",
            params![
                agent_id,
                task.task_id,
                task.task_name,
                task.status.as_str(),
                task.created_at.to_rfc3339(),
                task.completed_at.map(|dt| dt.to_rfc3339()),
            ],
        )?;

        Ok(())
    }

    /// Update task status
    pub async fn update_task_status(
        &self,
        task_id: &str,
        status: TaskStatus,
        result: Option<&str>,
    ) -> SqliteResult<()> {
        let db = self.db.lock().await;

        let completed_at = match status {
            TaskStatus::Completed | TaskStatus::Failed => Some(Utc::now().to_rfc3339()),
            _ => None,
        };

        db.execute(
            "UPDATE agent_tasks SET status = ?, completed_at = ?, result = ?
             WHERE task_id = ?",
            params![status.as_str(), completed_at, result, task_id,],
        )?;

        Ok(())
    }

    /// Get tasks by status
    pub async fn get_tasks_by_status(
        &self,
        agent_id: &str,
        status: TaskStatus,
    ) -> SqliteResult<Vec<TaskEntry>> {
        let db = self.db.lock().await;

        let mut stmt = db.prepare(
            "SELECT task_id, task_name, status, created_at, completed_at FROM agent_tasks
             WHERE agent_id = ? AND status = ?
             ORDER BY created_at DESC",
        )?;

        let tasks = stmt
            .query_map(params![agent_id, status.as_str()], |row| {
                let created_str: String = row.get(3)?;
                let created_at = DateTime::parse_from_rfc3339(&created_str)
                    .map(|dt| dt.with_timezone(&Utc))
                    .unwrap_or_else(|_| Utc::now());

                let completed_at: Option<String> = row.get(4)?;
                let completed_at = completed_at.and_then(|s| {
                    DateTime::parse_from_rfc3339(&s)
                        .ok()
                        .map(|dt| dt.with_timezone(&Utc))
                });

                Ok(TaskEntry {
                    task_id: row.get(0)?,
                    task_name: row.get(1)?,
                    status: TaskStatus::Assigned,
                    created_at,
                    completed_at,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(tasks)
    }

    /// Record state transition
    pub async fn record_state_transition(
        &self,
        agent_id: &str,
        old_state: &str,
        new_state: &str,
    ) -> SqliteResult<()> {
        let db = self.db.lock().await;

        db.execute(
            "INSERT INTO agent_state_history (agent_id, old_state, new_state)
             VALUES (?, ?, ?)",
            params![agent_id, old_state, new_state],
        )?;

        Ok(())
    }

    /// Get state transition history for an agent
    pub async fn get_state_history(
        &self,
        agent_id: &str,
        limit: usize,
    ) -> SqliteResult<Vec<(String, String, String)>> {
        let db = self.db.lock().await;

        let mut stmt = db.prepare(
            "SELECT old_state, new_state, timestamp FROM agent_state_history
             WHERE agent_id = ?
             ORDER BY timestamp DESC
             LIMIT ?",
        )?;

        let history = stmt
            .query_map(params![agent_id, limit], |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?))
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(history)
    }

    /// Delete old conversations (cleanup)
    pub async fn delete_old_conversations(
        &self,
        agent_id: &str,
        days_to_keep: i32,
    ) -> SqliteResult<()> {
        let db = self.db.lock().await;

        db.execute(
            "DELETE FROM agent_conversations
             WHERE agent_id = ? AND timestamp < datetime('now', ? || ' days')",
            params![agent_id, -days_to_keep],
        )?;

        Ok(())
    }
}

impl Clone for AgentPersistence {
    fn clone(&self) -> Self {
        AgentPersistence {
            db: Arc::clone(&self.db),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_save_and_load_conversation() -> SqliteResult<()> {
        let db = AgentPersistence::new_memory()?;

        let entry = ConversationEntry {
            timestamp: Utc::now(),
            sender: "user".to_string(),
            content: "Hello agent".to_string(),
            recipient: None,
        };

        db.save_conversation("agent_001", &entry).await?;

        let conversations = db.load_recent_conversations("agent_001", 10).await?;
        assert_eq!(conversations.len(), 1);
        assert_eq!(conversations[0].sender, "user");

        Ok(())
    }

    #[tokio::test]
    async fn test_save_and_update_task() -> SqliteResult<()> {
        let db = AgentPersistence::new_memory()?;

        let task = TaskEntry {
            task_id: "task_001".to_string(),
            task_name: "Research X".to_string(),
            status: TaskStatus::Assigned,
            created_at: Utc::now(),
            completed_at: None,
        };

        db.save_task("agent_001", &task).await?;

        db.update_task_status("task_001", TaskStatus::Completed, Some("Done!"))
            .await?;

        Ok(())
    }
}
