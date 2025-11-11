use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GeneratedMap {
    pub id: String,
    pub name: String,
    pub width: i32,
    pub height: i32,
    pub style: String,
    pub room_count: i32,
    pub tilemap_data: String,
    pub generation_method: Option<String>,
    pub ai_model_used: Option<String>,
    pub generation_time_ms: Option<i32>,
    pub tile_count: Option<i32>,
    pub usage_count: i32,
    pub is_favorite: i32,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MapListItem {
    pub id: String,
    pub name: String,
}

pub fn save_generated_map(
    conn: &Connection,
    id: &str,
    name: &str,
    width: i32,
    height: i32,
    style: &str,
    room_count: i32,
    tilemap_data: &str,
    generation_method: Option<&str>,
    ai_model_used: Option<&str>,
) -> Result<()> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    conn.execute(
        "INSERT INTO generated_maps (
            id, name, width, height, style, room_count,
            tilemap_data, generation_method, ai_model_used,
            tile_count, usage_count, is_favorite, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 0, 0, 0, ?10, ?10)",
        params![
            id,
            name,
            width,
            height,
            style,
            room_count,
            tilemap_data,
            generation_method,
            ai_model_used,
            now,
        ],
    )?;

    Ok(())
}

pub fn load_generated_map(conn: &Connection, map_id: &str) -> Result<String> {
    let tilemap_data: String = conn.query_row(
        "SELECT tilemap_data FROM generated_maps WHERE id = ?1",
        params![map_id],
        |row| row.get(0),
    )?;

    Ok(tilemap_data)
}

pub fn list_generated_maps(conn: &Connection) -> Result<Vec<MapListItem>> {
    let mut stmt = conn.prepare("SELECT id, name FROM generated_maps ORDER BY created_at DESC")?;

    let maps = stmt
        .query_map([], |row| {
            Ok(MapListItem {
                id: row.get(0)?,
                name: row.get(1)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

    Ok(maps)
}

#[allow(dead_code)]
pub fn increment_map_usage(conn: &Connection, map_id: &str) -> Result<()> {
    conn.execute(
        "UPDATE generated_maps SET usage_count = usage_count + 1 WHERE id = ?1",
        params![map_id],
    )?;

    Ok(())
}

#[allow(dead_code)]
pub fn delete_generated_map(conn: &Connection, map_id: &str) -> Result<()> {
    conn.execute("DELETE FROM generated_maps WHERE id = ?1", params![map_id])?;

    Ok(())
}

#[allow(dead_code)]
pub fn get_map_count(conn: &Connection) -> Result<i32> {
    let count: i32 = conn.query_row("SELECT COUNT(*) FROM generated_maps", [], |row| row.get(0))?;

    Ok(count)
}
