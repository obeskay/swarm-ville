-- Migration 003: Sprite Generation System
-- Tablas para sprites generados, templates, variaciones y relaciones

-- ============================================
-- 1. TEMPLATES DE SPRITES
-- ============================================

CREATE TABLE IF NOT EXISTS sprite_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- humanoid, creature, vehicle, object

  -- Template data
  base_prompt TEXT NOT NULL,
  proportions TEXT NOT NULL, -- JSON: {headRatio, bodyRatio, legsRatio}
  constraints TEXT NOT NULL, -- JSON: {minHeight, maxHeight, symmetrical}
  color_palette TEXT, -- JSON array: ["#ff0000", "#00ff00"]
  example_prompts TEXT, -- JSON array

  -- Metadata
  is_predefined INTEGER DEFAULT 0, -- Si es un template builtin
  usage_count INTEGER DEFAULT 0,
  rating REAL, -- Average rating 0-5

  -- Timestamps
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_templates_category ON sprite_templates(category);
CREATE INDEX idx_templates_predefined ON sprite_templates(is_predefined);
CREATE INDEX idx_templates_rating ON sprite_templates(rating DESC);

-- ============================================
-- 2. SPRITES GENERADOS
-- ============================================

CREATE TABLE IF NOT EXISTS generated_sprites (
  id TEXT PRIMARY KEY,
  character_name TEXT NOT NULL,
  description TEXT NOT NULL,
  template_id TEXT,

  -- Metadata de generación
  style TEXT NOT NULL, -- pixel-art, retro, 16-bit
  dimensions TEXT NOT NULL, -- JSON: {width: 192, height: 192}

  -- Storage
  file_path TEXT NOT NULL, -- Ruta relativa: /sprites/generated/sprite_123.png
  thumbnail_path TEXT, -- Thumbnail 64x64

  -- AI generation info
  prompt TEXT NOT NULL, -- Full prompt usado
  model_used TEXT, -- imagen-3.0-generate-002, gemini-2.5-flash-image, etc
  generation_params TEXT, -- JSON con todos los parámetros

  -- Post-processing info
  validation_result TEXT, -- JSON con resultado de validación
  had_warnings INTEGER DEFAULT 0,
  had_errors INTEGER DEFAULT 0,

  -- Stats
  generation_time_ms INTEGER,
  file_size_bytes INTEGER,
  retries INTEGER DEFAULT 0,

  -- Organización
  tags TEXT, -- JSON array: ["knight", "warrior", "red"]
  is_favorite INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  rating REAL, -- User rating 0-5

  -- Timestamps
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY (template_id) REFERENCES sprite_templates(id) ON DELETE SET NULL
);

CREATE INDEX idx_sprites_template ON generated_sprites(template_id);
CREATE INDEX idx_sprites_created ON generated_sprites(created_at DESC);
CREATE INDEX idx_sprites_favorite ON generated_sprites(is_favorite);
CREATE INDEX idx_sprites_style ON generated_sprites(style);
CREATE INDEX idx_sprites_rating ON generated_sprites(rating DESC);

-- ============================================
-- 3. VARIACIONES DE SPRITES
-- ============================================

CREATE TABLE IF NOT EXISTS sprite_variations (
  id TEXT PRIMARY KEY,
  base_sprite_id TEXT NOT NULL,

  -- Tipo de variación
  variation_type TEXT NOT NULL, -- color, size, style, palette_swap

  -- Data
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  params TEXT, -- JSON con parámetros de la variación

  -- Stats
  file_size_bytes INTEGER,
  usage_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at INTEGER NOT NULL,

  FOREIGN KEY (base_sprite_id) REFERENCES generated_sprites(id) ON DELETE CASCADE
);

CREATE INDEX idx_variations_base ON sprite_variations(base_sprite_id);
CREATE INDEX idx_variations_type ON sprite_variations(variation_type);

-- ============================================
-- 4. RELACIÓN AGENT -> SPRITE
-- ============================================

CREATE TABLE IF NOT EXISTS agent_sprites (
  agent_id TEXT NOT NULL,
  sprite_id TEXT NOT NULL,

  -- Estado
  is_active INTEGER DEFAULT 0, -- Sprite actualmente en uso
  assigned_at INTEGER NOT NULL,

  PRIMARY KEY (agent_id, sprite_id),
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (sprite_id) REFERENCES generated_sprites(id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_sprites_active ON agent_sprites(agent_id, is_active);
CREATE INDEX idx_agent_sprites_assigned ON agent_sprites(assigned_at DESC);

-- ============================================
-- 5. HISTORIAL DE GENERACIONES
-- ============================================

CREATE TABLE IF NOT EXISTS generation_history (
  id TEXT PRIMARY KEY,

  -- Input
  description TEXT NOT NULL,
  template_id TEXT,
  style TEXT NOT NULL,
  params TEXT, -- JSON con todos los parámetros

  -- Output
  sprite_id TEXT, -- NULL si falló
  success INTEGER NOT NULL, -- 1 si exitoso, 0 si falló
  error_message TEXT,

  -- Stats
  generation_time_ms INTEGER,
  retries INTEGER DEFAULT 0,

  -- Timestamp
  created_at INTEGER NOT NULL,

  FOREIGN KEY (template_id) REFERENCES sprite_templates(id) ON DELETE SET NULL,
  FOREIGN KEY (sprite_id) REFERENCES generated_sprites(id) ON DELETE SET NULL
);

CREATE INDEX idx_history_created ON generation_history(created_at DESC);
CREATE INDEX idx_history_success ON generation_history(success);
CREATE INDEX idx_history_sprite ON generation_history(sprite_id);

-- ============================================
-- 6. CACHE DE PROMPTS (Optimización)
-- ============================================

CREATE TABLE IF NOT EXISTS prompt_cache (
  prompt_hash TEXT PRIMARY KEY, -- SHA-256 del prompt completo
  prompt_text TEXT NOT NULL,

  -- Referencia al sprite generado
  sprite_id TEXT NOT NULL,

  -- Stats
  reuse_count INTEGER DEFAULT 0,
  last_used_at INTEGER,

  -- Timestamp
  created_at INTEGER NOT NULL,

  FOREIGN KEY (sprite_id) REFERENCES generated_sprites(id) ON DELETE CASCADE
);

CREATE INDEX idx_cache_used ON prompt_cache(last_used_at DESC);
CREATE INDEX idx_cache_reuse ON prompt_cache(reuse_count DESC);

-- ============================================
-- 7. TILEMAPS GENERADOS
-- ============================================

CREATE TABLE IF NOT EXISTS generated_tilemaps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,

  -- Dimensions
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,

  -- Biome/Theme
  biome TEXT NOT NULL, -- grassland, desert, snow, city
  features TEXT, -- JSON array: ["river", "trees", "rocks"]

  -- Data
  tilemap_data TEXT NOT NULL, -- JSON: Estructura completa del tilemap
  preview_path TEXT, -- Preview image del mapa completo

  -- Stats
  tile_count INTEGER,
  generation_time_ms INTEGER,

  -- Timestamps
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_tilemaps_biome ON generated_tilemaps(biome);
CREATE INDEX idx_tilemaps_created ON generated_tilemaps(created_at DESC);

-- ============================================
-- 8. TILES GENERADOS (Para tilemaps)
-- ============================================

CREATE TABLE IF NOT EXISTS generated_tiles (
  id TEXT PRIMARY KEY,
  tilemap_id TEXT,

  -- Data
  tile_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- ground, decoration, obstacle

  -- Storage
  file_path TEXT NOT NULL,
  dimensions TEXT NOT NULL, -- JSON: {width: 32, height: 32}

  -- AI generation
  prompt TEXT NOT NULL,
  model_used TEXT,

  -- Properties
  is_collidable INTEGER DEFAULT 0,
  is_animated INTEGER DEFAULT 0,
  animation_frames INTEGER DEFAULT 1,

  -- Stats
  usage_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at INTEGER NOT NULL,

  FOREIGN KEY (tilemap_id) REFERENCES generated_tilemaps(id) ON DELETE SET NULL
);

CREATE INDEX idx_tiles_tilemap ON generated_tiles(tilemap_id);
CREATE INDEX idx_tiles_category ON generated_tiles(category);
CREATE INDEX idx_tiles_collidable ON generated_tiles(is_collidable);

-- ============================================
-- INSERTAR TEMPLATES PREDEFINIDOS
-- ============================================

INSERT INTO sprite_templates (
  id, name, category, base_prompt, proportions, constraints,
  color_palette, example_prompts, is_predefined, created_at, updated_at
) VALUES
(
  'humanoid-knight-001',
  'Humanoid Knight Template',
  'humanoid',
  'A {adjective} knight character. Armor type: {armorType}. Weapon: {weapon}. Color scheme: {colorScheme}.',
  '{"headRatio": 1, "bodyRatio": 1.5, "legsRatio": 1.5}',
  '{"minHeight": 48, "maxHeight": 56, "symmetrical": true}',
  '["#c0c0c0", "#ff0000", "#ffd700", "#000000"]',
  '["brave, plate armor, longsword, silver and blue", "dark, leather armor, dual daggers, black and red"]',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
),
(
  'creature-slime-001',
  'Slime Creature Template',
  'creature',
  'A {size} slime creature. Color: {color}. Expression: {expression}.',
  '{"headRatio": 0, "bodyRatio": 1, "legsRatio": 0}',
  '{"minHeight": 32, "maxHeight": 48, "symmetrical": true}',
  '["#00ff00", "#00aa00", "#004400", "#ffffff"]',
  '["medium, green, happy", "large, blue, angry"]',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
),
(
  'humanoid-mage-001',
  'Humanoid Mage Template',
  'humanoid',
  'A {adjective} mage character. Robe style: {robeStyle}. Staff type: {staff}. Magic element: {element}.',
  '{"headRatio": 1, "bodyRatio": 1.8, "legsRatio": 1.2}',
  '{"minHeight": 48, "maxHeight": 56, "symmetrical": true}',
  '["#4040ff", "#ff40ff", "#ffffff", "#000000"]',
  '["wise, flowing robes, crystal staff, ice magic", "evil, dark robes, bone staff, shadow magic"]',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
