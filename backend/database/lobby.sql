-- Lobbies table
CREATE TABLE IF NOT EXISTS lobbies (
    code VARCHAR(4) PRIMARY KEY,
    host VARCHAR(16) NOT NULL REFERENCES users(username),
    started BOOLEAN DEFAULT FALSE,
    current_question INTEGER DEFAULT 0,
    catalog VARCHAR(100) DEFAULT NULL,
    question_set_id INTEGER DEFAULT NULL,
    game_phase VARCHAR(20) DEFAULT 'waiting',
    question_start_time TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lobby players table
CREATE TABLE IF NOT EXISTS lobby_players (
    lobby_code VARCHAR(4) REFERENCES lobbies(code) ON DELETE CASCADE,
    username VARCHAR(16) REFERENCES users(username),
    character VARCHAR(4) NOT NULL,
    score INTEGER DEFAULT 0,
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lobby_players_username ON lobby_players(username);
CREATE INDEX IF NOT EXISTS idx_lobby_created_at ON lobbies(created_at);
CREATE INDEX IF NOT EXISTS idx_lobby_last_activity ON lobbies(last_activity);

-- Function to automatically delete inactive lobbies (older than 1 minute)
CREATE OR REPLACE FUNCTION delete_inactive_lobbies()
RETURNS void AS $$
BEGIN
    DELETE FROM lobbies
    WHERE last_activity < NOW() - INTERVAL '1 minute'
    AND started = FALSE;  -- Only delete lobbies that haven't started
    
    -- Also delete very old started games (older than 2 hours)
    DELETE FROM lobbies
    WHERE created_at < NOW() - INTERVAL '2 hours'
    AND started = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update lobby activity timestamp
CREATE OR REPLACE FUNCTION update_lobby_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lobbies 
    SET last_activity = CURRENT_TIMESTAMP 
    WHERE code = COALESCE(NEW.lobby_code, OLD.lobby_code);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update last_activity when players join/leave/update
-- Note: These will be managed by init.js to ensure proper dependency order
DROP TRIGGER IF EXISTS trigger_update_lobby_activity_insert ON lobby_players;
DROP TRIGGER IF EXISTS trigger_update_lobby_activity_update ON lobby_players;
DROP TRIGGER IF EXISTS trigger_update_lobby_activity_delete ON lobby_players;

-- Only create triggers if tables exist (they will be created by init.js if needed)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lobby_players') THEN
        CREATE TRIGGER trigger_update_lobby_activity_insert
            AFTER INSERT ON lobby_players
            FOR EACH ROW
            EXECUTE FUNCTION update_lobby_activity();

        CREATE TRIGGER trigger_update_lobby_activity_update
            AFTER UPDATE ON lobby_players
            FOR EACH ROW
            EXECUTE FUNCTION update_lobby_activity();

        CREATE TRIGGER trigger_update_lobby_activity_delete
            AFTER DELETE ON lobby_players
            FOR EACH ROW
            EXECUTE FUNCTION update_lobby_activity();
    END IF;
END $$;

-- Extensions and cron jobs will be managed by init.js to prevent conflicts
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.unschedule('delete-old-lobbies'); -- Remove old job if exists
-- SELECT cron.schedule('delete-inactive-lobbies', '* * * * *', 'SELECT delete_inactive_lobbies();'); 