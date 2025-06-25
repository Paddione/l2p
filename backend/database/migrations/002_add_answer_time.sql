-- Migration: Add answer_time column to lobby_players for accurate scoring

ALTER TABLE lobby_players 
ADD COLUMN answer_time TIMESTAMP;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_lobby_players_answer_time 
ON lobby_players(lobby_code, answer_time); 