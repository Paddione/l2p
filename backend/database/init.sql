-- backend/database/init.sql
-- Initialize the Quiz Meister database schema

-- Enable required extensions first
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(16) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    character VARCHAR(4) NOT NULL,
    total_games_played INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hall of Fame entries
CREATE TABLE IF NOT EXISTS hall_of_fame (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(16) NOT NULL, -- Denormalized for performance
    character VARCHAR(4) NOT NULL, -- Denormalized for performance
    score INTEGER NOT NULL,
    questions INTEGER NOT NULL,
    accuracy INTEGER NOT NULL, -- Percentage (0-100)
    max_multiplier INTEGER NOT NULL,
    catalog_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lobbies table
CREATE TABLE IF NOT EXISTS lobbies (
    code VARCHAR(4) PRIMARY KEY,
    host VARCHAR(16) NOT NULL REFERENCES users(username),
    started BOOLEAN DEFAULT FALSE,
    current_question INTEGER DEFAULT 0,
    catalog VARCHAR(100) DEFAULT NULL,
    game_phase VARCHAR(20) DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lobby players table
CREATE TABLE IF NOT EXISTS lobby_players (
    lobby_code VARCHAR(4) REFERENCES lobbies(code) ON DELETE CASCADE,
    username VARCHAR(16) REFERENCES users(username),
    character VARCHAR(4) NOT NULL,
    score INTEGER DEFAULT 0,
    multiplier INTEGER DEFAULT 1,
    current_answer TEXT DEFAULT NULL,
    answered BOOLEAN DEFAULT FALSE,
    ready BOOLEAN DEFAULT FALSE,
    is_host BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (lobby_code, username)
);

-- Lobby questions table
CREATE TABLE IF NOT EXISTS lobby_questions (
    lobby_code VARCHAR(4) REFERENCES lobbies(code) ON DELETE CASCADE,
    question_index INTEGER,
    question_data JSONB NOT NULL,
    PRIMARY KEY (lobby_code, question_index)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_score ON hall_of_fame(score DESC);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_catalog ON hall_of_fame(catalog_name);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_user_id ON hall_of_fame(user_id);
CREATE INDEX IF NOT EXISTS idx_lobby_players_username ON lobby_players(username);
CREATE INDEX IF NOT EXISTS idx_lobby_created_at ON lobbies(created_at);

-- Function to update user stats when new hall of fame entry is added
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET 
        total_games_played = total_games_played + 1,
        best_score = GREATEST(best_score, NEW.score),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically delete old lobbies (older than 1 hour)
CREATE OR REPLACE FUNCTION delete_old_lobbies()
RETURNS void AS $$
BEGIN
    DELETE FROM lobbies
    WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_user_stats ON hall_of_fame;

-- Create triggers
CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT ON hall_of_fame
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Setup cron job for lobby cleanup
SELECT cron.schedule('*/5 * * * *', 'SELECT delete_old_lobbies();');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO CURRENT_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO CURRENT_USER;

-- Insert sample data only if tables are empty
INSERT INTO users (username, password_hash, character)
SELECT 'TestUser1', '$2b$10$rQZ5q2Q6Q3Q4Q5Q6Q7Q8Q9QaQbQcQdQeQfQgQhQiQjQkQlQmQnQoQp', '🐱'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'TestUser1');

INSERT INTO users (username, password_hash, character)
SELECT 'TestUser2', '$2b$10$rQZ5q2Q6Q3Q4Q5Q6Q7Q8Q9QaQbQcQdQeQfQgQhQiQjQkQlQmQnQoQp', '🐶'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'TestUser2');

INSERT INTO users (username, password_hash, character)
SELECT 'TestUser3', '$2b$10$rQZ5q2Q6Q3Q4Q5Q6Q7Q8Q9QaQbQcQdQeQfQgQhQiQjQkQlQmQnQoQp', '🐸'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'TestUser3');

INSERT INTO hall_of_fame (user_id, username, character, score, questions, accuracy, max_multiplier, catalog_name)
SELECT 1, 'TestUser1', '🐱', 550, 10, 100, 5, 'General Knowledge'
WHERE NOT EXISTS (SELECT 1 FROM hall_of_fame WHERE username = 'TestUser1');

INSERT INTO hall_of_fame (user_id, username, character, score, questions, accuracy, max_multiplier, catalog_name)
SELECT 2, 'TestUser2', '🐶', 480, 10, 90, 4, 'Science'
WHERE NOT EXISTS (SELECT 1 FROM hall_of_fame WHERE username = 'TestUser2');

INSERT INTO hall_of_fame (user_id, username, character, score, questions, accuracy, max_multiplier, catalog_name)
SELECT 3, 'TestUser3', '🐸', 420, 10, 80, 3, 'History'
WHERE NOT EXISTS (SELECT 1 FROM hall_of_fame WHERE username = 'TestUser3');