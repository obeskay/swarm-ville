-- Migration 005: Thronglet Language Learning System
-- Sistema completo de aprendizaje de lenguaje con vocabulario, asociaciones y embeddings

-- ============================================
-- 1. VOCABULARIO (Palabras conocidas)
-- ============================================

CREATE TABLE IF NOT EXISTS vocabulary (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL UNIQUE COLLATE NOCASE, -- Case-insensitive
  language TEXT NOT NULL DEFAULT 'en',

  -- Metadata
  category TEXT, -- noun, verb, adjective, etc
  definition TEXT,
  example_usage TEXT,

  -- Learning stats
  times_taught INTEGER DEFAULT 0,
  times_used INTEGER DEFAULT 0,
  mastery_level REAL DEFAULT 0.0, -- 0.0 to 1.0
  frequency_score REAL DEFAULT 0.0, -- How often this word appears

  -- Timestamps
  first_learned_at INTEGER,
  last_used_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_vocabulary_word ON vocabulary(word);
CREATE INDEX idx_vocabulary_language ON vocabulary(language);
CREATE INDEX idx_vocabulary_category ON vocabulary(category);
CREATE INDEX idx_vocabulary_mastery ON vocabulary(mastery_level DESC);
CREATE INDEX idx_vocabulary_frequency ON vocabulary(frequency_score DESC);

-- ============================================
-- 2. ASOCIACIONES DE PALABRAS
-- ============================================

CREATE TABLE IF NOT EXISTS word_associations (
  id TEXT PRIMARY KEY,
  word_id TEXT NOT NULL,
  associated_word_id TEXT NOT NULL,

  -- Association strength (learned through usage)
  strength REAL DEFAULT 0.5, -- 0.0 to 1.0
  association_type TEXT, -- synonym, antonym, related, conceptual

  -- Context where association was learned
  context TEXT, -- Optional: sentence/phrase where learned together

  -- Stats
  co_occurrence_count INTEGER DEFAULT 0,
  last_co_occurred_at INTEGER,

  -- Timestamps
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY (word_id) REFERENCES vocabulary(id) ON DELETE CASCADE,
  FOREIGN KEY (associated_word_id) REFERENCES vocabulary(id) ON DELETE CASCADE,

  UNIQUE(word_id, associated_word_id) -- Prevent duplicate associations
);

CREATE INDEX idx_associations_word ON word_associations(word_id);
CREATE INDEX idx_associations_associated ON word_associations(associated_word_id);
CREATE INDEX idx_associations_strength ON word_associations(strength DESC);
CREATE INDEX idx_associations_type ON word_associations(association_type);

-- ============================================
-- 3. ESTADO DE LENGUAJE POR AGENTE
-- ============================================

CREATE TABLE IF NOT EXISTS agent_language_state (
  agent_id TEXT PRIMARY KEY,

  -- Vocabulary stats
  vocabulary_size INTEGER DEFAULT 0,
  total_words_taught INTEGER DEFAULT 0,
  total_words_used INTEGER DEFAULT 0,

  -- Learning configuration
  learning_rate REAL DEFAULT 0.1,
  auto_teach_enabled INTEGER DEFAULT 1,
  preferred_language TEXT DEFAULT 'en',

  -- Neural network state (for future implementation)
  network_state TEXT, -- JSON: serialized neural network weights

  -- Timestamps
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_agent_language_agent ON agent_language_state(agent_id);
CREATE INDEX idx_agent_language_vocab_size ON agent_language_state(vocabulary_size DESC);

-- ============================================
-- 4. PALABRAS CONOCIDAS POR AGENTE
-- ============================================

CREATE TABLE IF NOT EXISTS agent_vocabulary (
  agent_id TEXT NOT NULL,
  word_id TEXT NOT NULL,

  -- Learning progress for this word
  times_used INTEGER DEFAULT 0,
  mastery_level REAL DEFAULT 0.0, -- 0.0 to 1.0
  confidence REAL DEFAULT 0.5, -- How confident agent is using this word

  -- Timestamps
  learned_at INTEGER NOT NULL,
  last_used_at INTEGER,

  PRIMARY KEY (agent_id, word_id),
  FOREIGN KEY (word_id) REFERENCES vocabulary(id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_vocab_agent ON agent_vocabulary(agent_id);
CREATE INDEX idx_agent_vocab_word ON agent_vocabulary(word_id);
CREATE INDEX idx_agent_vocab_mastery ON agent_vocabulary(agent_id, mastery_level DESC);

-- ============================================
-- 5. HISTORIAL DE APRENDIZAJE
-- ============================================

CREATE TABLE IF NOT EXISTS learning_history (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  word_id TEXT NOT NULL,

  -- Event type
  event_type TEXT NOT NULL, -- taught, used, reinforced, forgotten
  event_data TEXT, -- JSON: additional context

  -- Context
  sentence TEXT, -- Sentence/phrase where word was used
  teacher_id TEXT, -- Who taught this word (user, another agent, auto)

  -- Timestamp
  created_at INTEGER NOT NULL,

  FOREIGN KEY (word_id) REFERENCES vocabulary(id) ON DELETE CASCADE
);

CREATE INDEX idx_learning_history_agent ON learning_history(agent_id);
CREATE INDEX idx_learning_history_word ON learning_history(word_id);
CREATE INDEX idx_learning_history_type ON learning_history(event_type);
CREATE INDEX idx_learning_history_created ON learning_history(created_at DESC);

-- ============================================
-- 6. EMBEDDINGS DE PALABRAS (Para futuro ML)
-- ============================================

CREATE TABLE IF NOT EXISTS word_embeddings (
  word_id TEXT PRIMARY KEY,

  -- Embedding vector (stored as JSON array)
  embedding TEXT NOT NULL, -- JSON: [0.1, 0.2, ..., 0.n]
  embedding_dim INTEGER DEFAULT 384, -- Dimensión del vector

  -- Metadata
  model_used TEXT, -- universal-sentence-encoder, gemini-embedding, etc
  generated_at INTEGER NOT NULL,

  FOREIGN KEY (word_id) REFERENCES vocabulary(id) ON DELETE CASCADE
);

CREATE INDEX idx_embeddings_word ON word_embeddings(word_id);

-- ============================================
-- 7. COMUNICACIÓN MORSE
-- ============================================

CREATE TABLE IF NOT EXISTS morse_communications (
  id TEXT PRIMARY KEY,

  -- Participants
  sender_id TEXT, -- NULL if from user
  receiver_id TEXT, -- NULL if to user

  -- Message
  message_text TEXT NOT NULL,
  morse_code TEXT NOT NULL,

  -- Stats
  duration_ms INTEGER, -- How long the morse transmission took
  errors INTEGER DEFAULT 0, -- Decoding errors

  -- Timestamp
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_morse_sender ON morse_communications(sender_id);
CREATE INDEX idx_morse_receiver ON morse_communications(receiver_id);
CREATE INDEX idx_morse_created ON morse_communications(created_at DESC);

-- ============================================
-- 8. FRASES/EXPRESIONES APRENDIDAS
-- ============================================

CREATE TABLE IF NOT EXISTS learned_phrases (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,

  -- Phrase
  phrase_text TEXT NOT NULL,
  phrase_meaning TEXT, -- Optional explanation
  phrase_category TEXT, -- greeting, question, statement, etc

  -- Learning
  times_used INTEGER DEFAULT 0,
  confidence REAL DEFAULT 0.5,

  -- Timestamps
  learned_at INTEGER NOT NULL,
  last_used_at INTEGER,

  UNIQUE(agent_id, phrase_text)
);

CREATE INDEX idx_phrases_agent ON learned_phrases(agent_id);
CREATE INDEX idx_phrases_category ON learned_phrases(phrase_category);
CREATE INDEX idx_phrases_used ON learned_phrases(times_used DESC);

-- ============================================
-- DATOS INICIALES: Vocabulario básico
-- ============================================

-- Palabras básicas para empezar
INSERT INTO vocabulary (
  id, word, language, category, definition, frequency_score, created_at, updated_at
) VALUES
  ('word_hello', 'hello', 'en', 'greeting', 'A greeting or expression of goodwill', 0.95, strftime('%s', 'now'), strftime('%s', 'now')),
  ('word_friend', 'friend', 'en', 'noun', 'A person with whom one has a bond of mutual affection', 0.90, strftime('%s', 'now'), strftime('%s', 'now')),
  ('word_world', 'world', 'en', 'noun', 'The earth and all its inhabitants', 0.85, strftime('%s', 'now'), strftime('%s', 'now')),
  ('word_learn', 'learn', 'en', 'verb', 'To gain knowledge or skill', 0.80, strftime('%s', 'now'), strftime('%s', 'now')),
  ('word_grow', 'grow', 'en', 'verb', 'To increase in size or develop', 0.75, strftime('%s', 'now'), strftime('%s', 'now')),
  ('word_happy', 'happy', 'en', 'adjective', 'Feeling or showing pleasure', 0.85, strftime('%s', 'now'), strftime('%s', 'now')),
  ('word_help', 'help', 'en', 'verb', 'To assist or aid', 0.88, strftime('%s', 'now'), strftime('%s', 'now')),
  ('word_play', 'play', 'en', 'verb', 'To engage in activity for enjoyment', 0.82, strftime('%s', 'now'), strftime('%s', 'now')),
  ('word_explore', 'explore', 'en', 'verb', 'To investigate or discover', 0.78, strftime('%s', 'now'), strftime('%s', 'now')),
  ('word_create', 'create', 'en', 'verb', 'To bring something into existence', 0.77, strftime('%s', 'now'), strftime('%s', 'now'));

-- Asociaciones básicas
INSERT INTO word_associations (
  id, word_id, associated_word_id, strength, association_type, created_at, updated_at
) VALUES
  ('assoc_1', 'word_hello', 'word_friend', 0.8, 'related', strftime('%s', 'now'), strftime('%s', 'now')),
  ('assoc_2', 'word_learn', 'word_grow', 0.75, 'related', strftime('%s', 'now'), strftime('%s', 'now')),
  ('assoc_3', 'word_happy', 'word_friend', 0.7, 'related', strftime('%s', 'now'), strftime('%s', 'now')),
  ('assoc_4', 'word_play', 'word_happy', 0.8, 'related', strftime('%s', 'now'), strftime('%s', 'now')),
  ('assoc_5', 'word_explore', 'word_world', 0.85, 'related', strftime('%s', 'now'), strftime('%s', 'now')),
  ('assoc_6', 'word_create', 'word_learn', 0.72, 'related', strftime('%s', 'now'), strftime('%s', 'now'));
