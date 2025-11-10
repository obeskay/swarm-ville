/**
 * Thronglet Language Learning System
 * Backend implementation for vocabulary, associations, and learning
 */
use crate::db::Database;
use crate::error::Result;
use rusqlite::params;
use serde::{Deserialize, Serialize};

pub mod vocabulary;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Word {
    pub id: String,
    pub word: String,
    pub language: String,
    pub category: Option<String>,
    pub definition: Option<String>,
    pub example_usage: Option<String>,
    pub times_taught: i32,
    pub times_used: i32,
    pub mastery_level: f32,
    pub frequency_score: f32,
    pub first_learned_at: Option<i64>,
    pub last_used_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WordAssociation {
    pub id: String,
    pub word_id: String,
    pub associated_word_id: String,
    pub strength: f32,
    pub association_type: Option<String>,
    pub context: Option<String>,
    pub co_occurrence_count: i32,
    pub last_co_occurred_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgentLanguageState {
    pub agent_id: String,
    pub vocabulary_size: i32,
    pub total_words_taught: i32,
    pub total_words_used: i32,
    pub learning_rate: f32,
    pub auto_teach_enabled: bool,
    pub preferred_language: String,
    pub network_state: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TeachWordRequest {
    pub agent_id: String,
    pub word: String,
    pub associations: Vec<String>,
    pub definition: Option<String>,
    pub example: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentVocabulary {
    pub agent_id: String,
    pub word_id: String,
    pub times_used: i32,
    pub mastery_level: f32,
    pub confidence: f32,
    pub learned_at: i64,
    pub last_used_at: Option<i64>,
}

pub struct LanguageSystem<'a> {
    db: &'a Database,
}

impl<'a> LanguageSystem<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    /// Teach a new word to an agent
    pub fn teach_word(&self, request: TeachWordRequest) -> Result<Word> {
        let conn = self.db.get_connection();
        let now = chrono::Utc::now().timestamp();

        // 1. Check if word exists in global vocabulary
        let word_id = format!("word_{}", uuid::Uuid::new_v4());
        let word_lower = request.word.to_lowercase();

        let existing_word: Option<String> = conn
            .query_row(
                "SELECT id FROM vocabulary WHERE LOWER(word) = ? LIMIT 1",
                params![word_lower],
                |row| row.get(0),
            )
            .ok();

        let final_word_id = if let Some(existing_id) = existing_word {
            // Word exists, increment times_taught
            conn.execute(
                "UPDATE vocabulary SET times_taught = times_taught + 1, updated_at = ? WHERE id = ?",
                params![now, existing_id],
            ).map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;
            existing_id
        } else {
            // Create new word
            conn.execute(
                r#"INSERT INTO vocabulary (
                    id, word, language, definition, example_usage,
                    times_taught, times_used, mastery_level, frequency_score,
                    first_learned_at, created_at, updated_at
                ) VALUES (?, ?, 'en', ?, ?, 1, 0, 0.0, 0.0, ?, ?, ?)"#,
                params![
                    &word_id,
                    &request.word,
                    &request.definition,
                    &request.example,
                    now,
                    now,
                    now
                ],
            )
            .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;
            word_id
        };

        // 2. Add to agent's vocabulary if not already known
        let agent_knows_word: Option<i32> = conn
            .query_row(
                "SELECT 1 FROM agent_vocabulary WHERE agent_id = ? AND word_id = ?",
                params![&request.agent_id, &final_word_id],
                |row| row.get(0),
            )
            .ok();

        if agent_knows_word.is_none() {
            // Initialize agent language state if doesn't exist
            self.ensure_agent_language_state(&request.agent_id)?;

            // Add word to agent's vocabulary
            conn.execute(
                r#"INSERT INTO agent_vocabulary (
                    agent_id, word_id, times_used, mastery_level, confidence, learned_at
                ) VALUES (?, ?, 0, 0.0, 0.5, ?)"#,
                params![&request.agent_id, &final_word_id, now],
            )
            .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;

            // Update agent language state
            conn.execute(
                r#"UPDATE agent_language_state
                   SET vocabulary_size = vocabulary_size + 1,
                       total_words_taught = total_words_taught + 1,
                       updated_at = ?
                   WHERE agent_id = ?"#,
                params![now, &request.agent_id],
            )
            .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;
        }

        // 3. Add associations
        for assoc_word in request.associations {
            let assoc_word_lower = assoc_word.to_lowercase();

            // Find or create associated word
            let assoc_word_id: String = conn
                .query_row(
                    "SELECT id FROM vocabulary WHERE LOWER(word) = ? LIMIT 1",
                    params![assoc_word_lower],
                    |row| row.get(0),
                )
                .unwrap_or_else(|_| {
                    let new_id = format!("word_{}", uuid::Uuid::new_v4());
                    conn.execute(
                        r#"INSERT INTO vocabulary (
                            id, word, language, times_taught, times_used,
                            mastery_level, frequency_score, created_at, updated_at
                        ) VALUES (?, ?, 'en', 0, 0, 0.0, 0.0, ?, ?)"#,
                        params![&new_id, &assoc_word, now, now],
                    )
                    .ok();
                    new_id
                });

            // Create association (if doesn't exist)
            let assoc_id = format!("assoc_{}", uuid::Uuid::new_v4());
            conn.execute(
                r#"INSERT OR IGNORE INTO word_associations (
                    id, word_id, associated_word_id, strength, association_type,
                    co_occurrence_count, created_at, updated_at
                ) VALUES (?, ?, ?, 0.7, 'related', 0, ?, ?)"#,
                params![&assoc_id, &final_word_id, &assoc_word_id, now, now],
            )
            .ok();
        }

        // 4. Log learning event
        let event_id = format!("event_{}", uuid::Uuid::new_v4());
        conn.execute(
            r#"INSERT INTO learning_history (
                id, agent_id, word_id, event_type, teacher_id, created_at
            ) VALUES (?, ?, ?, 'taught', 'user', ?)"#,
            params![&event_id, &request.agent_id, &final_word_id, now],
        )
        .ok();

        // 5. Return the word
        self.get_word_by_id(&final_word_id)
    }

    /// Get agent's vocabulary
    pub fn get_agent_vocabulary(&self, agent_id: &str) -> Result<Vec<Word>> {
        let conn = self.db.get_connection();

        let mut stmt = conn
            .prepare(
                r#"SELECT v.* FROM vocabulary v
                   JOIN agent_vocabulary av ON av.word_id = v.id
                   WHERE av.agent_id = ?
                   ORDER BY av.mastery_level DESC, v.word"#,
            )
            .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;

        let words = stmt
            .query_map(params![agent_id], |row| {
                Ok(Word {
                    id: row.get(0)?,
                    word: row.get(1)?,
                    language: row.get(2)?,
                    category: row.get(3)?,
                    definition: row.get(4)?,
                    example_usage: row.get(5)?,
                    times_taught: row.get(6)?,
                    times_used: row.get(7)?,
                    mastery_level: row.get(8)?,
                    frequency_score: row.get(9)?,
                    first_learned_at: row.get(10)?,
                    last_used_at: row.get(11)?,
                    created_at: row.get(12)?,
                    updated_at: row.get(13)?,
                })
            })
            .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;

        Ok(words)
    }

    /// Get agent's language state
    pub fn get_agent_language_state(&self, agent_id: &str) -> Result<AgentLanguageState> {
        let conn = self.db.get_connection();

        let state = conn
            .query_row(
                "SELECT * FROM agent_language_state WHERE agent_id = ?",
                params![agent_id],
                |row| {
                    Ok(AgentLanguageState {
                        agent_id: row.get(0)?,
                        vocabulary_size: row.get(1)?,
                        total_words_taught: row.get(2)?,
                        total_words_used: row.get(3)?,
                        learning_rate: row.get(4)?,
                        auto_teach_enabled: row.get::<_, i32>(5)? == 1,
                        preferred_language: row.get(6)?,
                        network_state: row.get(7)?,
                        created_at: row.get(8)?,
                        updated_at: row.get(9)?,
                    })
                },
            )
            .or_else(|_| {
                // Create if doesn't exist
                self.ensure_agent_language_state(agent_id).ok();
                std::result::Result::<AgentLanguageState, rusqlite::Error>::Ok(AgentLanguageState {
                    agent_id: agent_id.to_string(),
                    vocabulary_size: 0,
                    total_words_taught: 0,
                    total_words_used: 0,
                    learning_rate: 0.1,
                    auto_teach_enabled: true,
                    preferred_language: "en".to_string(),
                    network_state: None,
                    created_at: chrono::Utc::now().timestamp(),
                    updated_at: chrono::Utc::now().timestamp(),
                })
            })
            .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;

        Ok(state)
    }

    /// Ensure agent language state exists
    fn ensure_agent_language_state(&self, agent_id: &str) -> Result<()> {
        let conn = self.db.get_connection();
        let now = chrono::Utc::now().timestamp();

        conn.execute(
            r#"INSERT OR IGNORE INTO agent_language_state (
                agent_id, vocabulary_size, total_words_taught, total_words_used,
                learning_rate, auto_teach_enabled, preferred_language, created_at, updated_at
            ) VALUES (?, 0, 0, 0, 0.1, 1, 'en', ?, ?)"#,
            params![agent_id, now, now],
        )
        .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;

        Ok(())
    }

    /// Get word by ID
    fn get_word_by_id(&self, word_id: &str) -> Result<Word> {
        let conn = self.db.get_connection();

        let word = conn
            .query_row(
                "SELECT * FROM vocabulary WHERE id = ?",
                params![word_id],
                |row| {
                    Ok(Word {
                        id: row.get(0)?,
                        word: row.get(1)?,
                        language: row.get(2)?,
                        category: row.get(3)?,
                        definition: row.get(4)?,
                        example_usage: row.get(5)?,
                        times_taught: row.get(6)?,
                        times_used: row.get(7)?,
                        mastery_level: row.get(8)?,
                        frequency_score: row.get(9)?,
                        first_learned_at: row.get(10)?,
                        last_used_at: row.get(11)?,
                        created_at: row.get(12)?,
                        updated_at: row.get(13)?,
                    })
                },
            )
            .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;

        Ok(word)
    }

    /// Get word associations
    pub fn get_word_associations(&self, word_id: &str) -> Result<Vec<(Word, f32)>> {
        let conn = self.db.get_connection();

        let mut stmt = conn
            .prepare(
                r#"SELECT v.*, wa.strength FROM vocabulary v
                   JOIN word_associations wa ON wa.associated_word_id = v.id
                   WHERE wa.word_id = ?
                   ORDER BY wa.strength DESC"#,
            )
            .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;

        let associations = stmt
            .query_map(params![word_id], |row| {
                Ok((
                    Word {
                        id: row.get(0)?,
                        word: row.get(1)?,
                        language: row.get(2)?,
                        category: row.get(3)?,
                        definition: row.get(4)?,
                        example_usage: row.get(5)?,
                        times_taught: row.get(6)?,
                        times_used: row.get(7)?,
                        mastery_level: row.get(8)?,
                        frequency_score: row.get(9)?,
                        first_learned_at: row.get(10)?,
                        last_used_at: row.get(11)?,
                        created_at: row.get(12)?,
                        updated_at: row.get(13)?,
                    },
                    row.get(14)?,
                ))
            })
            .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(|e| crate::error::SwarmvilleError::Database(e.to_string()))?;

        Ok(associations)
    }
}
