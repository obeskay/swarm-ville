-- Migration 007: Space Versioning System
-- Add version tracking and updated_at timestamp to spaces table
-- Enables change detection and conflict resolution

ALTER TABLE spaces ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE spaces ADD COLUMN updated_at_ms INTEGER;

-- Update existing rows to have updated_at_ms = updated_at (convert to ms if needed)
UPDATE spaces SET updated_at_ms = updated_at * 1000 WHERE updated_at_ms IS NULL;

-- Make updated_at_ms NOT NULL after populating
ALTER TABLE spaces MODIFY COLUMN updated_at_ms INTEGER NOT NULL;

CREATE INDEX idx_spaces_version ON spaces(version);
CREATE INDEX idx_spaces_updated ON spaces(updated_at_ms DESC);
