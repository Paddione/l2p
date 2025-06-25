-- Database schema for Learn2Play
-- Fixed version with all required columns

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    character VARCHAR(10) NOT NULL,
    total_games_played INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hall of Fame table with ALL required columns
CREATE TABLE IF NOT EXISTS hall_of_fame (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,        -- ✅ Required column
    character VARCHAR(10) NOT NULL,       -- ✅ Required column  
    catalog_name VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    questions INTEGER NOT NULL,           -- ✅ Required column
    accuracy INTEGER NOT NULL,
    max_multiplier INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_user_id ON hall_of_fame(user_id);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_catalog ON hall_of_fame(catalog_name);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_score ON hall_of_fame(score DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add question_count column to lobbies table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lobbies' AND column_name = 'question_count'
    ) THEN
        ALTER TABLE lobbies ADD COLUMN question_count INTEGER DEFAULT NULL;
    END IF;
END $$;

-- Add play_again_from column to lobbies table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lobbies' AND column_name = 'play_again_from'
    ) THEN
        ALTER TABLE lobbies ADD COLUMN play_again_from VARCHAR(4) DEFAULT NULL;
    END IF;
END $$;

-- Fix any existing hall_of_fame entries with NULL created_at timestamps
UPDATE hall_of_fame 
SET created_at = CURRENT_TIMESTAMP 
WHERE created_at IS NULL;

-- Add answer_time column to lobby_players table for accurate scoring
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lobby_players' AND column_name = 'answer_time'
    ) THEN
        ALTER TABLE lobby_players ADD COLUMN answer_time TIMESTAMP;
        CREATE INDEX IF NOT EXISTS idx_lobby_players_answer_time 
        ON lobby_players(lobby_code, answer_time);
    END IF;
END $$;