-- One row per player name; stores the S3 key of their current avatar (see api/player.js).
CREATE TABLE IF NOT EXISTS players (
    name VARCHAR(50) PRIMARY KEY,
    avatar_key TEXT,
    avatar_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
