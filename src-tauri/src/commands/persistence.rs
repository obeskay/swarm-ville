use crate::db::{Agent, PersistenceLayer, Space, UserProgress};
use crate::error::Result;
use chrono::Utc;
use std::sync::Arc;
use tauri::State;

pub struct AppState {
    pub db: Arc<PersistenceLayer>,
}

#[tauri::command]
pub async fn save_space(state: State<'_, AppState>, space: Space) -> Result<()> {
    state
        .db
        .create_space(&space)
        .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;
    Ok(())
}

#[tauri::command]
pub async fn get_space(state: State<'_, AppState>, id: String) -> Result<Space> {
    state
        .db
        .get_space(&id)
        .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))
}

#[tauri::command]
pub async fn list_spaces(state: State<'_, AppState>, owner_id: String) -> Result<Vec<Space>> {
    state
        .db
        .list_spaces(&owner_id)
        .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))
}

#[tauri::command]
pub async fn update_space(state: State<'_, AppState>, mut space: Space) -> Result<()> {
    space.updated_at = Utc::now().timestamp_millis();
    state
        .db
        .update_space(&space)
        .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;
    Ok(())
}

#[tauri::command]
pub async fn delete_space(state: State<'_, AppState>, id: String) -> Result<()> {
    state
        .db
        .delete_space(&id)
        .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;
    Ok(())
}

#[tauri::command]
pub async fn save_agent(state: State<'_, AppState>, agent: Agent) -> Result<()> {
    state
        .db
        .create_agent(&agent)
        .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;
    Ok(())
}

#[tauri::command]
pub async fn get_agents_by_space(
    state: State<'_, AppState>,
    space_id: String,
) -> Result<Vec<Agent>> {
    state
        .db
        .get_agents_by_space(&space_id)
        .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))
}

#[tauri::command]
pub async fn update_agent_position(
    state: State<'_, AppState>,
    agent_id: String,
    x: i32,
    y: i32,
) -> Result<()> {
    state
        .db
        .update_agent_position(&agent_id, x, y)
        .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;
    Ok(())
}

#[tauri::command]
pub async fn delete_agent(state: State<'_, AppState>, id: String) -> Result<()> {
    state
        .db
        .delete_agent(&id)
        .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;
    Ok(())
}

#[tauri::command]
pub async fn get_user_progress(
    state: State<'_, AppState>,
    user_id: String,
) -> Result<UserProgress> {
    state
        .db
        .get_or_create_user_progress(&user_id)
        .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))
}

#[tauri::command]
pub async fn update_user_progress(
    state: State<'_, AppState>,
    progress: UserProgress,
) -> Result<()> {
    state
        .db
        .update_user_progress(&progress)
        .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;
    Ok(())
}

#[tauri::command]
pub async fn add_xp(
    state: State<'_, AppState>,
    user_id: String,
    xp_amount: i32,
) -> Result<UserProgress> {
    let mut progress = state
        .db
        .get_or_create_user_progress(&user_id)
        .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;

    progress.xp += xp_amount;

    // Level up logic (every 1000 XP = 1 level)
    let new_level = (progress.xp / 1000) + 1;
    if new_level > progress.level {
        progress.level = new_level;
    }

    progress.last_active = Utc::now().timestamp_millis();

    state
        .db
        .update_user_progress(&progress)
        .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;

    Ok(progress)
}

#[tauri::command]
pub async fn complete_mission(
    state: State<'_, AppState>,
    user_id: String,
    mission_id: String,
) -> Result<UserProgress> {
    let mut progress = state
        .db
        .get_or_create_user_progress(&user_id)
        .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;

    if !progress.completed_missions.contains(&mission_id) {
        progress.completed_missions.push(mission_id);
        progress.last_active = Utc::now().timestamp_millis();

        state
            .db
            .update_user_progress(&progress)
            .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;
    }

    Ok(progress)
}

#[tauri::command]
pub async fn unlock_achievement(
    state: State<'_, AppState>,
    user_id: String,
    achievement_id: String,
) -> Result<UserProgress> {
    let mut progress = state
        .db
        .get_or_create_user_progress(&user_id)
        .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;

    if !progress.achievements.contains(&achievement_id) {
        progress.achievements.push(achievement_id);
        progress.last_active = Utc::now().timestamp_millis();

        state
            .db
            .update_user_progress(&progress)
            .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;
    }

    Ok(progress)
}
