-- Achievement System Migration
-- Creates tables for achievements, progress tracking, and analytics

-- Achievements definition table
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK(rarity IN ('common', 'rare', 'epic', 'legendary')),
    type TEXT NOT NULL CHECK(type IN ('milestone', 'streak', 'discovery', 'mastery', 'social', 'speed', 'collection')),
    xp_reward INTEGER NOT NULL,
    hidden INTEGER NOT NULL DEFAULT 0,
    hint TEXT,
    condition_data TEXT NOT NULL, -- JSON serialized condition
    prerequisite_ids TEXT, -- JSON array of achievement IDs
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Player achievement progress
CREATE TABLE IF NOT EXISTS achievement_progress (
    id TEXT PRIMARY KEY,
    achievement_id TEXT NOT NULL,
    player_id TEXT NOT NULL DEFAULT 'local-user',
    progress INTEGER NOT NULL DEFAULT 0,
    max_progress INTEGER NOT NULL,
    unlocked INTEGER NOT NULL DEFAULT 0,
    unlocked_at INTEGER,
    started_at INTEGER NOT NULL,
    last_updated_at INTEGER NOT NULL,
    metadata TEXT, -- JSON for additional tracking data
    FOREIGN KEY (achievement_id) REFERENCES achievements(id),
    UNIQUE(achievement_id, player_id)
);

-- Unlock history for analytics
CREATE TABLE IF NOT EXISTS achievement_unlocks (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL DEFAULT 'local-user',
    achievement_id TEXT NOT NULL,
    unlocked_at INTEGER NOT NULL,
    context TEXT, -- JSON metadata about unlock (level, agents count, etc.)
    FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);

-- Event tracking for achievement progress
CREATE TABLE IF NOT EXISTS achievement_events (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL DEFAULT 'local-user',
    event_type TEXT NOT NULL,
    event_data TEXT, -- JSON event metadata
    created_at INTEGER NOT NULL
);

-- Player stats for analytics
CREATE TABLE IF NOT EXISTS player_stats (
    player_id TEXT PRIMARY KEY DEFAULT 'local-user',
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    total_xp_earned INTEGER NOT NULL DEFAULT 0,
    achievements_unlocked INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_login INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_player ON achievement_progress(player_id);
CREATE INDEX IF NOT EXISTS idx_progress_achievement ON achievement_progress(achievement_id);
CREATE INDEX IF NOT EXISTS idx_progress_unlocked ON achievement_progress(unlocked);
CREATE INDEX IF NOT EXISTS idx_unlocks_player ON achievement_unlocks(player_id);
CREATE INDEX IF NOT EXISTS idx_unlocks_achievement ON achievement_unlocks(achievement_id);
CREATE INDEX IF NOT EXISTS idx_unlocks_time ON achievement_unlocks(unlocked_at);
CREATE INDEX IF NOT EXISTS idx_events_player ON achievement_events(player_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON achievement_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_time ON achievement_events(created_at);

-- Initialize player stats if not exists
INSERT OR IGNORE INTO player_stats (player_id, created_at, updated_at)
VALUES ('local-user', strftime('%s', 'now'), strftime('%s', 'now'));
