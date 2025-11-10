/**
 * Tauri Commands for Achievement System
 * Exposes achievement database operations to the frontend
 */
use crate::db::{
    Achievement, AchievementDb, AchievementProgress, AchievementUnlock, Database, PlayerStats,
};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct InitAchievementsRequest {
    pub achievements_json: String, // Serialized array of achievements from frontend
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProgressRequest {
    pub achievement_id: String,
    pub progress: i64,
    pub player_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UnlockAchievementRequest {
    pub achievement_id: String,
    pub player_id: Option<String>,
    pub context_json: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AddXpRequest {
    pub amount: i64,
    pub player_id: Option<String>,
}

// ============================================
// INITIALIZATION
// ============================================

#[tauri::command]
pub async fn init_achievements(
    db: State<'_, Mutex<Database>>,
    request: InitAchievementsRequest,
) -> Result<String, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();
    let achievement_db = AchievementDb::new(conn);

    // Parse achievements from JSON
    let achievements: Vec<Achievement> = serde_json::from_str(&request.achievements_json)
        .map_err(|e| format!("Failed to parse achievements: {}", e))?;

    // Insert all achievements
    let count = achievements.len();
    for achievement in achievements {
        achievement_db
            .insert_achievement(&achievement)
            .map_err(|e| format!("Failed to insert achievement: {}", e))?;
    }

    Ok(format!("Initialized {} achievements", count))
}

// ============================================
// ACHIEVEMENT QUERIES
// ============================================

#[tauri::command]
pub async fn get_all_achievements(db: State<'_, Mutex<Database>>) -> Result<String, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();
    let achievement_db = AchievementDb::new(conn);

    let achievements = achievement_db
        .get_all_achievements()
        .map_err(|e| format!("Failed to get achievements: {}", e))?;

    serde_json::to_string(&achievements)
        .map_err(|e| format!("Failed to serialize achievements: {}", e))
}

#[tauri::command]
pub async fn get_achievement_by_id(
    db: State<'_, Mutex<Database>>,
    achievement_id: String,
) -> Result<String, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();
    let achievement_db = AchievementDb::new(conn);

    let achievement = achievement_db
        .get_achievement_by_id(&achievement_id)
        .map_err(|e| format!("Failed to get achievement: {}", e))?;

    serde_json::to_string(&achievement)
        .map_err(|e| format!("Failed to serialize achievement: {}", e))
}

// ============================================
// PROGRESS TRACKING
// ============================================

#[tauri::command]
pub async fn get_player_progress(
    db: State<'_, Mutex<Database>>,
    player_id: Option<String>,
) -> Result<String, String> {
    let player_id = player_id.unwrap_or_else(|| "local-user".to_string());

    let db = db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();
    let achievement_db = AchievementDb::new(conn);

    let progress = achievement_db
        .get_progress_by_player(&player_id)
        .map_err(|e| format!("Failed to get progress: {}", e))?;

    serde_json::to_string(&progress).map_err(|e| format!("Failed to serialize progress: {}", e))
}

#[tauri::command]
pub async fn update_achievement_progress(
    db: State<'_, Mutex<Database>>,
    request: UpdateProgressRequest,
) -> Result<String, String> {
    let player_id = request
        .player_id
        .unwrap_or_else(|| "local-user".to_string());
    let now = crate::db::achievements::get_current_timestamp();

    let db = db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();
    let achievement_db = AchievementDb::new(conn);

    // Get or create progress record
    let mut progress = match achievement_db
        .get_progress(&request.achievement_id, &player_id)
        .map_err(|e| format!("Failed to get progress: {}", e))?
    {
        Some(p) => p,
        None => {
            // Get achievement to determine max_progress
            let achievement = achievement_db
                .get_achievement_by_id(&request.achievement_id)
                .map_err(|e| format!("Failed to get achievement: {}", e))?
                .ok_or_else(|| format!("Achievement not found: {}", request.achievement_id))?;

            // Parse condition to get max_progress
            let condition: serde_json::Value = serde_json::from_str(&achievement.condition_data)
                .map_err(|e| format!("Failed to parse condition: {}", e))?;

            let max_progress = match condition.get("target") {
                Some(target) => target.as_i64().unwrap_or(1),
                None => 1,
            };

            AchievementProgress {
                id: crate::db::achievements::generate_id(),
                achievement_id: request.achievement_id.clone(),
                player_id: player_id.clone(),
                progress: 0,
                max_progress,
                unlocked: false,
                unlocked_at: None,
                started_at: now,
                last_updated_at: now,
                metadata: None,
            }
        }
    };

    // Update progress
    progress.progress = request.progress;
    progress.last_updated_at = now;

    // Check if unlocked
    if progress.progress >= progress.max_progress && !progress.unlocked {
        progress.unlocked = true;
        progress.unlocked_at = Some(now);
    }

    // Save to database
    achievement_db
        .upsert_progress(&progress)
        .map_err(|e| format!("Failed to update progress: {}", e))?;

    serde_json::to_string(&progress).map_err(|e| format!("Failed to serialize progress: {}", e))
}

// ============================================
// UNLOCKING
// ============================================

#[tauri::command]
pub async fn unlock_achievement(
    db: State<'_, Mutex<Database>>,
    request: UnlockAchievementRequest,
) -> Result<String, String> {
    let player_id = request
        .player_id
        .unwrap_or_else(|| "local-user".to_string());
    let now = crate::db::achievements::get_current_timestamp();

    let db = db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();
    let achievement_db = AchievementDb::new(conn);

    // Record unlock
    let unlock = AchievementUnlock {
        id: crate::db::achievements::generate_id(),
        player_id: player_id.clone(),
        achievement_id: request.achievement_id.clone(),
        unlocked_at: now,
        context: request.context_json,
    };

    achievement_db
        .record_unlock(&unlock)
        .map_err(|e| format!("Failed to record unlock: {}", e))?;

    // Update progress to unlocked
    let mut progress = achievement_db
        .get_progress(&request.achievement_id, &player_id)
        .map_err(|e| format!("Failed to get progress: {}", e))?
        .ok_or_else(|| "Progress record not found".to_string())?;

    progress.unlocked = true;
    progress.unlocked_at = Some(now);
    progress.last_updated_at = now;

    achievement_db
        .upsert_progress(&progress)
        .map_err(|e| format!("Failed to update progress: {}", e))?;

    Ok("Achievement unlocked".to_string())
}

// ============================================
// PLAYER STATS
// ============================================

#[tauri::command]
pub async fn get_player_stats(
    db: State<'_, Mutex<Database>>,
    player_id: Option<String>,
) -> Result<String, String> {
    let player_id = player_id.unwrap_or_else(|| "local-user".to_string());

    let db = db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();
    let achievement_db = AchievementDb::new(conn);

    let stats = achievement_db
        .get_player_stats(&player_id)
        .map_err(|e| format!("Failed to get player stats: {}", e))?
        .ok_or_else(|| "Player stats not found".to_string())?;

    serde_json::to_string(&stats).map_err(|e| format!("Failed to serialize stats: {}", e))
}

#[tauri::command]
pub async fn add_xp(
    db: State<'_, Mutex<Database>>,
    request: AddXpRequest,
) -> Result<String, String> {
    let player_id = request
        .player_id
        .unwrap_or_else(|| "local-user".to_string());
    let now = crate::db::achievements::get_current_timestamp();

    let db = db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();
    let achievement_db = AchievementDb::new(conn);

    // Get or create player stats
    let mut stats = match achievement_db
        .get_player_stats(&player_id)
        .map_err(|e| format!("Failed to get player stats: {}", e))?
    {
        Some(stats) => stats,
        None => {
            // Create new player stats if not found
            let new_stats = PlayerStats {
                player_id: player_id.clone(),
                level: 1,
                xp: 0,
                total_xp_earned: 0,
                achievements_unlocked: 0,
                current_streak: 0,
                longest_streak: 0,
                last_login: Some(now),
                created_at: now,
                updated_at: now,
            };

            achievement_db
                .update_player_stats(&new_stats)
                .map_err(|e| format!("Failed to create player stats: {}", e))?;

            new_stats
        }
    };

    // Add XP
    stats.xp += request.amount;
    stats.total_xp_earned += request.amount;

    // Calculate level (using exponential curve: level = floor(1.5^(level-1) * 100))
    let mut new_level = stats.level;
    loop {
        let xp_for_next_level = (100.0 * (1.5_f64).powi((new_level) as i32)) as i64;
        if stats.xp >= xp_for_next_level {
            stats.xp -= xp_for_next_level;
            new_level += 1;
        } else {
            break;
        }
    }
    stats.level = new_level;
    stats.updated_at = now;

    achievement_db
        .update_player_stats(&stats)
        .map_err(|e| format!("Failed to update stats: {}", e))?;

    serde_json::to_string(&stats).map_err(|e| format!("Failed to serialize stats: {}", e))
}

// ============================================
// ANALYTICS
// ============================================

#[tauri::command]
pub async fn get_achievement_analytics(
    db: State<'_, Mutex<Database>>,
    player_id: Option<String>,
) -> Result<String, String> {
    let player_id = player_id.unwrap_or_else(|| "local-user".to_string());

    let db = db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();
    let achievement_db = AchievementDb::new(conn);

    let unlocked_count = achievement_db
        .get_unlock_count(&player_id)
        .map_err(|e| format!("Failed to get unlock count: {}", e))?;

    let total_count = achievement_db
        .get_total_achievements()
        .map_err(|e| format!("Failed to get total achievements: {}", e))?;

    let rarity_dist = achievement_db
        .get_rarity_distribution(&player_id)
        .map_err(|e| format!("Failed to get rarity distribution: {}", e))?;

    let analytics = serde_json::json!({
        "unlockedCount": unlocked_count,
        "totalCount": total_count,
        "unlockPercentage": if total_count > 0 {
            (unlocked_count as f64 / total_count as f64) * 100.0
        } else {
            0.0
        },
        "rarityDistribution": rarity_dist.into_iter().collect::<std::collections::HashMap<_, _>>(),
    });

    serde_json::to_string(&analytics).map_err(|e| format!("Failed to serialize analytics: {}", e))
}

#[tauri::command]
pub async fn get_unlock_history(
    db: State<'_, Mutex<Database>>,
    player_id: Option<String>,
) -> Result<String, String> {
    let player_id = player_id.unwrap_or_else(|| "local-user".to_string());

    let db = db.lock().map_err(|e| e.to_string())?;
    let conn = db.get_connection();
    let achievement_db = AchievementDb::new(conn);

    let unlocks = achievement_db
        .get_unlocks_by_player(&player_id)
        .map_err(|e| format!("Failed to get unlocks: {}", e))?;

    serde_json::to_string(&unlocks).map_err(|e| format!("Failed to serialize unlocks: {}", e))
}
