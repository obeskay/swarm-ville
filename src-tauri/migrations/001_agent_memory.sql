-- Migration: Agent Memory Tables
-- Adds tables for agent conversation history, task tracking, and state history

-- Agent conversations: records all agent communications
CREATE TABLE IF NOT EXISTS agent_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    sender TEXT NOT NULL,      -- agent_id or 'user' or 'system'
    content TEXT NOT NULL,
    recipient TEXT,            -- specific agent_id or 'broadcast' or NULL
    FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Create index for fast retrieval by agent and timestamp
CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent_timestamp
ON agent_conversations(agent_id, timestamp DESC);

-- Agent tasks: tracks task assignments and completion
CREATE TABLE IF NOT EXISTS agent_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    task_id TEXT NOT NULL UNIQUE,
    task_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'assigned',  -- 'assigned', 'in_progress', 'completed', 'failed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    result TEXT,                -- Task result or error message
    FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Create index for fast filtering by status
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_status
ON agent_tasks(agent_id, status);

-- Agent state history: debug tracking of state transitions
CREATE TABLE IF NOT EXISTS agent_state_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    old_state TEXT NOT NULL,     -- 'idle', 'listening', 'thinking', 'speaking', 'error'
    new_state TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Create index for state debugging
CREATE INDEX IF NOT EXISTS idx_agent_state_history_agent_timestamp
ON agent_state_history(agent_id, timestamp DESC);
