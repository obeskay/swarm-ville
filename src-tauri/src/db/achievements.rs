/**
 * Achievement Database Layer
 * Handles all database operations for the achievement system
 */
use rusqlite::{params, Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Achievement {
    pub id: String,
    pub title: String,
    pub description: String,
    pub icon: String,
    pub category: String,
    pub rarity: String,
    pub r#type: String,
    pub xp_reward: i64,
    pub hidden: bool,
    pub hint: Option<String>,
    pub condition_data: String,           // JSON
    pub prerequisite_ids: Option<String>, // JSON array
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AchievementProgress {
    pub id: String,
    pub achievement_id: String,
    pub player_id: String,
    pub progress: i64,
    pub max_progress: i64,
    pub unlocked: bool,
    pub unlocked_at: Option<i64>,
    pub started_at: i64,
    pub last_updated_at: i64,
    pub metadata: Option<String>, // JSON
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AchievementUnlock {
    pub id: String,
    pub player_id: String,
    pub achievement_id: String,
    pub unlocked_at: i64,
    pub context: Option<String>, // JSON
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerStats {
    pub player_id: String,
    pub level: i64,
    pub xp: i64,
    pub total_xp_earned: i64,
    pub achievements_unlocked: i64,
    pub current_streak: i64,
    pub longest_streak: i64,
    pub last_login: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

pub struct AchievementDb<'a> {
    conn: &'a Connection,
}

impl<'a> AchievementDb<'a> {
    pub fn new(conn: &'a Connection) -> Self {
        Self { conn }
    }

    // ============================================
    // ACHIEVEMENT CRUD
    // ============================================

    pub fn insert_achievement(&self, achievement: &Achievement) -> SqliteResult<()> {
        self.conn.execute(
            r#"
            INSERT INTO achievements (
                id, title, description, icon, category, rarity, type,
                xp_reward, hidden, hint, condition_data, prerequisite_ids,
                created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                description = excluded.description,
                updated_at = excluded.updated_at
            "#,
            params![
                achievement.id,
                achievement.title,
                achievement.description,
                achievement.icon,
                achievement.category,
                achievement.rarity,
                achievement.r#type,
                achievement.xp_reward,
                achievement.hidden as i64,
                achievement.hint,
                achievement.condition_data,
                achievement.prerequisite_ids,
                achievement.created_at,
                achievement.updated_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_all_achievements(&self) -> SqliteResult<Vec<Achievement>> {
        let mut stmt = self.conn.prepare(
            r#"
            SELECT id, title, description, icon, category, rarity, type,
                   xp_reward, hidden, hint, condition_data, prerequisite_ids,
                   created_at, updated_at
            FROM achievements
            ORDER BY rarity DESC, category ASC
            "#,
        )?;

        let achievements = stmt.query_map([], |row| {
            Ok(Achievement {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                icon: row.get(3)?,
                category: row.get(4)?,
                rarity: row.get(5)?,
                r#type: row.get(6)?,
                xp_reward: row.get(7)?,
                hidden: row.get::<_, i64>(8)? != 0,
                hint: row.get(9)?,
                condition_data: row.get(10)?,
                prerequisite_ids: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        })?;

        achievements.collect()
    }

    pub fn get_achievement_by_id(&self, id: &str) -> SqliteResult<Option<Achievement>> {
        let mut stmt = self.conn.prepare(
            r#"
            SELECT id, title, description, icon, category, rarity, type,
                   xp_reward, hidden, hint, condition_data, prerequisite_ids,
                   created_at, updated_at
            FROM achievements
            WHERE id = ?1
            "#,
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(Achievement {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                icon: row.get(3)?,
                category: row.get(4)?,
                rarity: row.get(5)?,
                r#type: row.get(6)?,
                xp_reward: row.get(7)?,
                hidden: row.get::<_, i64>(8)? != 0,
                hint: row.get(9)?,
                condition_data: row.get(10)?,
                prerequisite_ids: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            }))
        } else {
            Ok(None)
        }
    }

    // ============================================
    // PROGRESS TRACKING
    // ============================================

    pub fn upsert_progress(&self, progress: &AchievementProgress) -> SqliteResult<()> {
        self.conn.execute(
            r#"
            INSERT INTO achievement_progress (
                id, achievement_id, player_id, progress, max_progress,
                unlocked, unlocked_at, started_at, last_updated_at, metadata
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
            ON CONFLICT(achievement_id, player_id) DO UPDATE SET
                progress = excluded.progress,
                unlocked = excluded.unlocked,
                unlocked_at = excluded.unlocked_at,
                last_updated_at = excluded.last_updated_at,
                metadata = excluded.metadata
            "#,
            params![
                progress.id,
                progress.achievement_id,
                progress.player_id,
                progress.progress,
                progress.max_progress,
                progress.unlocked as i64,
                progress.unlocked_at,
                progress.started_at,
                progress.last_updated_at,
                progress.metadata,
            ],
        )?;
        Ok(())
    }

    pub fn get_progress_by_player(
        &self,
        player_id: &str,
    ) -> SqliteResult<Vec<AchievementProgress>> {
        let mut stmt = self.conn.prepare(
            r#"
            SELECT id, achievement_id, player_id, progress, max_progress,
                   unlocked, unlocked_at, started_at, last_updated_at, metadata
            FROM achievement_progress
            WHERE player_id = ?1
            "#,
        )?;

        let progress_list = stmt.query_map(params![player_id], |row| {
            Ok(AchievementProgress {
                id: row.get(0)?,
                achievement_id: row.get(1)?,
                player_id: row.get(2)?,
                progress: row.get(3)?,
                max_progress: row.get(4)?,
                unlocked: row.get::<_, i64>(5)? != 0,
                unlocked_at: row.get(6)?,
                started_at: row.get(7)?,
                last_updated_at: row.get(8)?,
                metadata: row.get(9)?,
            })
        })?;

        progress_list.collect()
    }

    pub fn get_progress(
        &self,
        achievement_id: &str,
        player_id: &str,
    ) -> SqliteResult<Option<AchievementProgress>> {
        let mut stmt = self.conn.prepare(
            r#"
            SELECT id, achievement_id, player_id, progress, max_progress,
                   unlocked, unlocked_at, started_at, last_updated_at, metadata
            FROM achievement_progress
            WHERE achievement_id = ?1 AND player_id = ?2
            "#,
        )?;

        let mut rows = stmt.query(params![achievement_id, player_id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(AchievementProgress {
                id: row.get(0)?,
                achievement_id: row.get(1)?,
                player_id: row.get(2)?,
                progress: row.get(3)?,
                max_progress: row.get(4)?,
                unlocked: row.get::<_, i64>(5)? != 0,
                unlocked_at: row.get(6)?,
                started_at: row.get(7)?,
                last_updated_at: row.get(8)?,
                metadata: row.get(9)?,
            }))
        } else {
            Ok(None)
        }
    }

    // ============================================
    // UNLOCK HISTORY
    // ============================================

    pub fn record_unlock(&self, unlock: &AchievementUnlock) -> SqliteResult<()> {
        self.conn.execute(
            r#"
            INSERT INTO achievement_unlocks (id, player_id, achievement_id, unlocked_at, context)
            VALUES (?1, ?2, ?3, ?4, ?5)
            "#,
            params![
                unlock.id,
                unlock.player_id,
                unlock.achievement_id,
                unlock.unlocked_at,
                unlock.context,
            ],
        )?;
        Ok(())
    }

    pub fn get_unlocks_by_player(&self, player_id: &str) -> SqliteResult<Vec<AchievementUnlock>> {
        let mut stmt = self.conn.prepare(
            r#"
            SELECT id, player_id, achievement_id, unlocked_at, context
            FROM achievement_unlocks
            WHERE player_id = ?1
            ORDER BY unlocked_at DESC
            "#,
        )?;

        let unlocks = stmt.query_map(params![player_id], |row| {
            Ok(AchievementUnlock {
                id: row.get(0)?,
                player_id: row.get(1)?,
                achievement_id: row.get(2)?,
                unlocked_at: row.get(3)?,
                context: row.get(4)?,
            })
        })?;

        unlocks.collect()
    }

    // ============================================
    // PLAYER STATS
    // ============================================

    pub fn get_player_stats(&self, player_id: &str) -> SqliteResult<Option<PlayerStats>> {
        let mut stmt = self.conn.prepare(
            r#"
            SELECT player_id, level, xp, total_xp_earned, achievements_unlocked,
                   current_streak, longest_streak, last_login, created_at, updated_at
            FROM player_stats
            WHERE player_id = ?1
            "#,
        )?;

        let mut rows = stmt.query(params![player_id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(PlayerStats {
                player_id: row.get(0)?,
                level: row.get(1)?,
                xp: row.get(2)?,
                total_xp_earned: row.get(3)?,
                achievements_unlocked: row.get(4)?,
                current_streak: row.get(5)?,
                longest_streak: row.get(6)?,
                last_login: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn update_player_stats(&self, stats: &PlayerStats) -> SqliteResult<()> {
        self.conn.execute(
            r#"
            INSERT INTO player_stats (
                player_id, level, xp, total_xp_earned, achievements_unlocked,
                current_streak, longest_streak, last_login, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
            ON CONFLICT(player_id) DO UPDATE SET
                level = excluded.level,
                xp = excluded.xp,
                total_xp_earned = excluded.total_xp_earned,
                achievements_unlocked = excluded.achievements_unlocked,
                current_streak = excluded.current_streak,
                longest_streak = excluded.longest_streak,
                last_login = excluded.last_login,
                updated_at = excluded.updated_at
            "#,
            params![
                stats.player_id,
                stats.level,
                stats.xp,
                stats.total_xp_earned,
                stats.achievements_unlocked,
                stats.current_streak,
                stats.longest_streak,
                stats.last_login,
                stats.created_at,
                stats.updated_at,
            ],
        )?;
        Ok(())
    }

    // ============================================
    // ANALYTICS
    // ============================================

    pub fn get_unlock_count(&self, player_id: &str) -> SqliteResult<i64> {
        let count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM achievement_progress WHERE player_id = ?1 AND unlocked = 1",
            params![player_id],
            |row| row.get(0),
        )?;
        Ok(count)
    }

    pub fn get_total_achievements(&self) -> SqliteResult<i64> {
        let count: i64 = self
            .conn
            .query_row("SELECT COUNT(*) FROM achievements", [], |row| row.get(0))?;
        Ok(count)
    }

    pub fn get_rarity_distribution(&self, player_id: &str) -> SqliteResult<Vec<(String, i64)>> {
        let mut stmt = self.conn.prepare(
            r#"
            SELECT a.rarity, COUNT(*) as count
            FROM achievements a
            JOIN achievement_progress p ON a.id = p.achievement_id
            WHERE p.player_id = ?1 AND p.unlocked = 1
            GROUP BY a.rarity
            "#,
        )?;

        let distribution =
            stmt.query_map(params![player_id], |row| Ok((row.get(0)?, row.get(1)?)))?;

        distribution.collect()
    }
}

pub fn get_current_timestamp() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

pub fn generate_id() -> String {
    uuid::Uuid::new_v4().to_string()
}
