use rusqlite::{params, Connection, OptionalExtension, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SpriteTemplate {
    pub id: String,
    pub name: String,
    pub category: String,
    pub base_prompt: String,
    pub proportions: String,
    pub constraints: String,
    pub color_palette: Option<String>,
    pub example_prompts: Option<String>,
    pub is_predefined: i32,
    pub usage_count: i32,
    pub rating: Option<f64>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeneratedSprite {
    pub id: String,
    pub character_name: String,
    pub description: String,
    pub template_id: Option<String>,
    pub style: String,
    pub dimensions: String,
    pub file_path: String,
    pub thumbnail_path: Option<String>,
    pub prompt: String,
    pub model_used: String,
    pub generation_params: Option<String>,
    pub validation_result: Option<String>,
    pub had_warnings: i32,
    pub had_errors: i32,
    pub generation_time_ms: Option<i64>,
    pub file_size_bytes: Option<i64>,
    pub retries: i32,
    pub tags: Option<String>,
    pub is_favorite: i32,
    pub usage_count: i32,
    pub rating: Option<f64>,
    pub created_at: i64,
    pub updated_at: i64,
}

pub fn get_all_templates(conn: &Connection) -> Result<Vec<SpriteTemplate>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, category, base_prompt, proportions, constraints,
         color_palette, example_prompts, is_predefined, usage_count, rating,
         created_at, updated_at
         FROM sprite_templates
         ORDER BY is_predefined DESC, rating DESC, usage_count DESC",
    )?;

    let templates = stmt
        .query_map([], |row| {
            Ok(SpriteTemplate {
                id: row.get(0)?,
                name: row.get(1)?,
                category: row.get(2)?,
                base_prompt: row.get(3)?,
                proportions: row.get(4)?,
                constraints: row.get(5)?,
                color_palette: row.get(6)?,
                example_prompts: row.get(7)?,
                is_predefined: row.get(8)?,
                usage_count: row.get(9)?,
                rating: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

    Ok(templates)
}

pub fn get_template_by_id(conn: &Connection, id: &str) -> Result<Option<SpriteTemplate>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, category, base_prompt, proportions, constraints,
         color_palette, example_prompts, is_predefined, usage_count, rating,
         created_at, updated_at
         FROM sprite_templates
         WHERE id = ?",
    )?;

    let template = stmt
        .query_row([id], |row| {
            Ok(SpriteTemplate {
                id: row.get(0)?,
                name: row.get(1)?,
                category: row.get(2)?,
                base_prompt: row.get(3)?,
                proportions: row.get(4)?,
                constraints: row.get(5)?,
                color_palette: row.get(6)?,
                example_prompts: row.get(7)?,
                is_predefined: row.get(8)?,
                usage_count: row.get(9)?,
                rating: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })
        .optional()?;

    Ok(template)
}

pub fn increment_template_usage(conn: &Connection, template_id: &str) -> Result<()> {
    conn.execute(
        "UPDATE sprite_templates
         SET usage_count = usage_count + 1,
             updated_at = strftime('%s', 'now')
         WHERE id = ?",
        params![template_id],
    )?;
    Ok(())
}

pub fn save_generated_sprite(conn: &Connection, sprite: &GeneratedSprite) -> Result<()> {
    conn.execute(
        "INSERT INTO generated_sprites (
            id, character_name, description, template_id, style, dimensions,
            file_path, thumbnail_path, prompt, model_used, generation_params,
            validation_result, had_warnings, had_errors, generation_time_ms,
            file_size_bytes, retries, tags, is_favorite, usage_count, rating,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            sprite.id,
            sprite.character_name,
            sprite.description,
            sprite.template_id,
            sprite.style,
            sprite.dimensions,
            sprite.file_path,
            sprite.thumbnail_path,
            sprite.prompt,
            sprite.model_used,
            sprite.generation_params,
            sprite.validation_result,
            sprite.had_warnings,
            sprite.had_errors,
            sprite.generation_time_ms,
            sprite.file_size_bytes,
            sprite.retries,
            sprite.tags,
            sprite.is_favorite,
            sprite.usage_count,
            sprite.rating,
            sprite.created_at,
            sprite.updated_at,
        ],
    )?;
    Ok(())
}

pub fn get_sprites_by_template(
    conn: &Connection,
    template_id: &str,
) -> Result<Vec<GeneratedSprite>> {
    let mut stmt = conn.prepare(
        "SELECT id, character_name, description, template_id, style, dimensions,
         file_path, thumbnail_path, prompt, model_used, generation_params,
         validation_result, had_warnings, had_errors, generation_time_ms,
         file_size_bytes, retries, tags, is_favorite, usage_count, rating,
         created_at, updated_at
         FROM generated_sprites
         WHERE template_id = ?
         ORDER BY created_at DESC",
    )?;

    let sprites = stmt
        .query_map([template_id], |row| {
            Ok(GeneratedSprite {
                id: row.get(0)?,
                character_name: row.get(1)?,
                description: row.get(2)?,
                template_id: row.get(3)?,
                style: row.get(4)?,
                dimensions: row.get(5)?,
                file_path: row.get(6)?,
                thumbnail_path: row.get(7)?,
                prompt: row.get(8)?,
                model_used: row.get(9)?,
                generation_params: row.get(10)?,
                validation_result: row.get(11)?,
                had_warnings: row.get(12)?,
                had_errors: row.get(13)?,
                generation_time_ms: row.get(14)?,
                file_size_bytes: row.get(15)?,
                retries: row.get(16)?,
                tags: row.get(17)?,
                is_favorite: row.get(18)?,
                usage_count: row.get(19)?,
                rating: row.get(20)?,
                created_at: row.get(21)?,
                updated_at: row.get(22)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

    Ok(sprites)
}
