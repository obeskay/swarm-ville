use super::errors::{DbError, DbResult};
use chrono::Utc;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Space {
    pub id: String,
    pub name: String,
    pub owner_id: String,
    pub width: i32,
    pub height: i32,
    pub tilemap: Option<String>, // JSON serialized tilemap
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: String,
    pub space_id: String,
    pub name: String,
    pub role: String,
    pub position_x: i32,
    pub position_y: i32,
    pub sprite_id: i32,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProgress {
    pub user_id: String,
    pub xp: i32,
    pub level: i32,
    pub completed_missions: Vec<String>, // JSON array
    pub achievements: Vec<String>,       // JSON array
    pub last_active: i64,
}

pub struct PersistenceLayer {
    conn: Arc<Mutex<Connection>>,
}

impl PersistenceLayer {
    pub fn new(db_path: &str) -> DbResult<Self> {
        let conn = Connection::open(db_path)?;
        let db = PersistenceLayer {
            conn: Arc::new(Mutex::new(conn)),
        };
        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> DbResult<()> {
        let conn = self.conn.lock().unwrap();

        // Spaces table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS spaces (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                owner_id TEXT NOT NULL,
                width INTEGER NOT NULL,
                height INTEGER NOT NULL,
                tilemap TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Agents table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                space_id TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                position_x INTEGER NOT NULL,
                position_y INTEGER NOT NULL,
                sprite_id INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // User progress table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS user_progress (
                user_id TEXT PRIMARY KEY,
                xp INTEGER NOT NULL DEFAULT 0,
                level INTEGER NOT NULL DEFAULT 1,
                completed_missions TEXT NOT NULL DEFAULT '[]',
                achievements TEXT NOT NULL DEFAULT '[]',
                last_active INTEGER NOT NULL
            )",
            [],
        )?;

        // Create indices for performance
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_agents_space ON agents(space_id)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_spaces_owner ON spaces(owner_id)",
            [],
        )?;

        Ok(())
    }

    // ========== SPACE OPERATIONS ==========

    pub fn create_space(&self, space: &Space) -> DbResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO spaces (id, name, owner_id, width, height, tilemap, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                space.id,
                space.name,
                space.owner_id,
                space.width,
                space.height,
                space.tilemap,
                space.created_at,
                space.updated_at
            ],
        )?;
        Ok(())
    }

    pub fn get_space(&self, id: &str) -> DbResult<Space> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, owner_id, width, height, tilemap, created_at, updated_at
             FROM spaces WHERE id = ?1",
        )?;

        let space = stmt
            .query_row([id], |row| {
                Ok(Space {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    owner_id: row.get(2)?,
                    width: row.get(3)?,
                    height: row.get(4)?,
                    tilemap: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })
            .map_err(|_| DbError::NotFound(format!("Space {} not found", id)))?;

        Ok(space)
    }

    pub fn list_spaces(&self, owner_id: &str) -> DbResult<Vec<Space>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, owner_id, width, height, tilemap, created_at, updated_at
             FROM spaces WHERE owner_id = ?1 ORDER BY updated_at DESC",
        )?;

        let spaces = stmt
            .query_map([owner_id], |row| {
                Ok(Space {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    owner_id: row.get(2)?,
                    width: row.get(3)?,
                    height: row.get(4)?,
                    tilemap: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(spaces)
    }

    pub fn update_space(&self, space: &Space) -> DbResult<()> {
        let conn = self.conn.lock().unwrap();
        let updated = conn.execute(
            "UPDATE spaces SET name = ?1, tilemap = ?2, updated_at = ?3 WHERE id = ?4",
            params![space.name, space.tilemap, space.updated_at, space.id],
        )?;

        if updated == 0 {
            return Err(DbError::NotFound(format!("Space {} not found", space.id)));
        }
        Ok(())
    }

    pub fn delete_space(&self, id: &str) -> DbResult<()> {
        let conn = self.conn.lock().unwrap();
        let deleted = conn.execute("DELETE FROM spaces WHERE id = ?1", [id])?;

        if deleted == 0 {
            return Err(DbError::NotFound(format!("Space {} not found", id)));
        }
        Ok(())
    }

    // ========== AGENT OPERATIONS ==========

    pub fn create_agent(&self, agent: &Agent) -> DbResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO agents (id, space_id, name, role, position_x, position_y, sprite_id, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                agent.id,
                agent.space_id,
                agent.name,
                agent.role,
                agent.position_x,
                agent.position_y,
                agent.sprite_id,
                agent.created_at,
                agent.updated_at
            ],
        )?;
        Ok(())
    }

    pub fn get_agents_by_space(&self, space_id: &str) -> DbResult<Vec<Agent>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, space_id, name, role, position_x, position_y, sprite_id, created_at, updated_at
             FROM agents WHERE space_id = ?1"
        )?;

        let agents = stmt
            .query_map([space_id], |row| {
                Ok(Agent {
                    id: row.get(0)?,
                    space_id: row.get(1)?,
                    name: row.get(2)?,
                    role: row.get(3)?,
                    position_x: row.get(4)?,
                    position_y: row.get(5)?,
                    sprite_id: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(agents)
    }

    pub fn update_agent_position(&self, agent_id: &str, x: i32, y: i32) -> DbResult<()> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().timestamp_millis();
        let updated = conn.execute(
            "UPDATE agents SET position_x = ?1, position_y = ?2, updated_at = ?3 WHERE id = ?4",
            params![x, y, now, agent_id],
        )?;

        if updated == 0 {
            return Err(DbError::NotFound(format!("Agent {} not found", agent_id)));
        }
        Ok(())
    }

    pub fn delete_agent(&self, id: &str) -> DbResult<()> {
        let conn = self.conn.lock().unwrap();
        let deleted = conn.execute("DELETE FROM agents WHERE id = ?1", [id])?;

        if deleted == 0 {
            return Err(DbError::NotFound(format!("Agent {} not found", id)));
        }
        Ok(())
    }

    // ========== USER PROGRESS OPERATIONS ==========

    pub fn get_or_create_user_progress(&self, user_id: &str) -> DbResult<UserProgress> {
        let conn = self.conn.lock().unwrap();

        // Try to get existing progress
        let mut stmt = conn.prepare(
            "SELECT user_id, xp, level, completed_missions, achievements, last_active
             FROM user_progress WHERE user_id = ?1",
        )?;

        let result = stmt.query_row([user_id], |row| {
            Ok(UserProgress {
                user_id: row.get(0)?,
                xp: row.get(1)?,
                level: row.get(2)?,
                completed_missions: serde_json::from_str(row.get::<_, String>(3)?.as_str())
                    .unwrap_or_default(),
                achievements: serde_json::from_str(row.get::<_, String>(4)?.as_str())
                    .unwrap_or_default(),
                last_active: row.get(5)?,
            })
        });

        match result {
            Ok(progress) => Ok(progress),
            Err(_) => {
                // Create new progress
                let now = Utc::now().timestamp_millis();
                conn.execute(
                    "INSERT INTO user_progress (user_id, xp, level, completed_missions, achievements, last_active)
                     VALUES (?1, 0, 1, '[]', '[]', ?2)",
                    params![user_id, now],
                )?;

                Ok(UserProgress {
                    user_id: user_id.to_string(),
                    xp: 0,
                    level: 1,
                    completed_missions: vec![],
                    achievements: vec![],
                    last_active: now,
                })
            }
        }
    }

    pub fn update_user_progress(&self, progress: &UserProgress) -> DbResult<()> {
        let conn = self.conn.lock().unwrap();
        let missions_json = serde_json::to_string(&progress.completed_missions)?;
        let achievements_json = serde_json::to_string(&progress.achievements)?;

        conn.execute(
            "UPDATE user_progress
             SET xp = ?1, level = ?2, completed_missions = ?3, achievements = ?4, last_active = ?5
             WHERE user_id = ?6",
            params![
                progress.xp,
                progress.level,
                missions_json,
                achievements_json,
                progress.last_active,
                progress.user_id
            ],
        )?;
        Ok(())
    }
}
