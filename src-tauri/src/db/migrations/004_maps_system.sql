-- Migration 004: Maps Storage System
-- Store generated maps in database instead of files

CREATE TABLE IF NOT EXISTS generated_maps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,

  -- Dimensions
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,

  -- Style/Theme
  style TEXT NOT NULL, -- startup, office, nature, tech
  room_count INTEGER DEFAULT 1,

  -- Map data (JSON)
  tilemap_data TEXT NOT NULL, -- Full tilemap JSON structure

  -- Metadata
  generation_method TEXT, -- ai, procedural, manual
  ai_model_used TEXT, -- gemini-2.0-flash-exp, etc
  generation_time_ms INTEGER,

  -- Stats
  tile_count INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_favorite INTEGER DEFAULT 0,

  -- Timestamps
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_maps_style ON generated_maps(style);
CREATE INDEX idx_maps_created ON generated_maps(created_at DESC);
CREATE INDEX idx_maps_favorite ON generated_maps(is_favorite);
CREATE INDEX idx_maps_usage ON generated_maps(usage_count DESC);

-- Insert default map
INSERT INTO generated_maps (
  id,
  name,
  width,
  height,
  style,
  room_count,
  tilemap_data,
  generation_method,
  tile_count,
  usage_count,
  is_favorite,
  created_at,
  updated_at
) VALUES (
  'default-map-001',
  'Default Grassland',
  50,
  50,
  'nature',
  1,
  '{"rooms":[{"name":"Home","tilemap":{}}]}',
  'manual',
  0,
  0,
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
