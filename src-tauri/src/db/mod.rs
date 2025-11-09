use std::path::Path;
use rusqlite::{Connection, Result as SqliteResult};
use crate::error::Result;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub async fn new(app_dir: &Path) -> Result<Self> {
        let db_path = app_dir.join("swarmville.db");
        let conn = Connection::open(db_path)
            .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;

        let db = Database { conn };
        db.init_schema()?;
        Ok(db)
    }

    fn init_schema(&self) -> Result<()> {
        self.conn
            .execute_batch(
                r#"
                CREATE TABLE IF NOT EXISTS spaces (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    owner_id TEXT NOT NULL,
                    width INTEGER NOT NULL,
                    height INTEGER NOT NULL,
                    theme TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS agents (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    space_id TEXT NOT NULL,
                    owner_id TEXT NOT NULL,
                    position_x INTEGER NOT NULL,
                    position_y INTEGER NOT NULL,
                    role TEXT NOT NULL,
                    model_provider TEXT NOT NULL,
                    model_name TEXT NOT NULL,
                    avatar_icon TEXT NOT NULL,
                    avatar_color TEXT NOT NULL,
                    state TEXT NOT NULL DEFAULT 'idle',
                    created_at INTEGER NOT NULL,
                    FOREIGN KEY (space_id) REFERENCES spaces(id)
                );

                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    agent_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp INTEGER NOT NULL,
                    FOREIGN KEY (agent_id) REFERENCES agents(id)
                );

                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT NOT NULL UNIQUE,
                    email TEXT,
                    settings TEXT,
                    created_at INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS cli_connections (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    cli_type TEXT NOT NULL,
                    path TEXT NOT NULL,
                    verified INTEGER NOT NULL DEFAULT 0,
                    last_used INTEGER,
                    version TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
                "#,
            )
            .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;

        Ok(())
    }
}
