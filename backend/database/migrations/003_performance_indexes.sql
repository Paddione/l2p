-- Migration 003: Performance Optimizations and Additional Indexes
-- Learn2Play Database Performance Enhancement
-- Created: 2025-06-25

-- =============================================
-- Performance Indexes for Lobbies
-- =============================================

-- Index for lobby lookup by game state and status (frequently used in cleanup and listing)
CREATE INDEX IF NOT EXISTS idx_lobbies_started_phase 
ON lobbies(started, game_phase);

-- Index for active lobby lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_lobbies_active 
ON lobbies(started, last_activity) 
WHERE started = TRUE;

-- Composite index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_lobbies_cleanup 
ON lobbies(created_at, started, game_phase, last_activity);

-- Index for question set lookups
CREATE INDEX IF NOT EXISTS idx_lobbies_question_set 
ON lobbies(question_set_id) 
WHERE question_set_id IS NOT NULL;

-- =============================================
-- Performance Indexes for Lobby Players
-- =============================================

-- Index for player score rankings within lobbies
CREATE INDEX IF NOT EXISTS idx_lobby_players_score 
ON lobby_players(lobby_code, score DESC);

-- Index for answered status queries (used during question progression)
CREATE INDEX IF NOT EXISTS idx_lobby_players_answered 
ON lobby_players(lobby_code, answered);

-- Index for ready status queries (used during game setup)
CREATE INDEX IF NOT EXISTS idx_lobby_players_ready 
ON lobby_players(lobby_code, ready);

-- Index for host identification (frequently needed for permissions)
CREATE INDEX IF NOT EXISTS idx_lobby_players_host 
ON lobby_players(lobby_code, is_host) 
WHERE is_host = TRUE;

-- =============================================
-- Performance Indexes for Questions
-- =============================================

-- Index for question data retrieval (JSONB operations)
CREATE INDEX IF NOT EXISTS idx_lobby_questions_data 
ON lobby_questions USING GIN (question_data);

-- Index for question ordering within lobbies
CREATE INDEX IF NOT EXISTS idx_lobby_questions_order 
ON lobby_questions(lobby_code, question_index);

-- =============================================
-- Performance Indexes for Question Sets
-- =============================================

-- Index for question set name searches (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'question_sets') THEN
        -- Index for name-based searches
        CREATE INDEX IF NOT EXISTS idx_question_sets_name 
        ON question_sets(name);
        
        -- Index for question count filtering
        CREATE INDEX IF NOT EXISTS idx_question_sets_count 
        ON question_sets(question_count);
        
        -- Index for created date ordering
        CREATE INDEX IF NOT EXISTS idx_question_sets_created 
        ON question_sets(created_at DESC);
        
        -- Full-text search index for descriptions
        CREATE INDEX IF NOT EXISTS idx_question_sets_description_fulltext 
        ON question_sets USING GIN (to_tsvector('english', description));
    END IF;
END $$;

-- =============================================
-- Performance Indexes for Users
-- =============================================

-- Index for user statistics (best score, total games)
CREATE INDEX IF NOT EXISTS idx_users_stats 
ON users(best_score DESC, total_games_played DESC);

-- Index for user activity
CREATE INDEX IF NOT EXISTS idx_users_activity 
ON users(updated_at DESC);

-- =============================================
-- Performance Indexes for Hall of Fame
-- =============================================

-- Composite index for leaderboard queries by catalog
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_leaderboard 
ON hall_of_fame(catalog_name, score DESC, created_at DESC);

-- Index for user performance history
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_user_history 
ON hall_of_fame(username, created_at DESC);

-- Index for accuracy-based rankings
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_accuracy 
ON hall_of_fame(catalog_name, accuracy DESC, score DESC);

-- =============================================
-- Query Performance Functions
-- =============================================

-- Function to get lobby performance statistics
CREATE OR REPLACE FUNCTION get_lobby_performance_stats()
RETURNS TABLE (
    total_lobbies BIGINT,
    active_lobbies BIGINT,
    started_games BIGINT,
    avg_players_per_lobby NUMERIC,
    total_players BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_lobbies,
        COUNT(*) FILTER (WHERE last_activity > NOW() - INTERVAL '5 minutes') as active_lobbies,
        COUNT(*) FILTER (WHERE started = TRUE) as started_games,
        (SELECT AVG(player_count) FROM (
            SELECT COUNT(*) as player_count 
            FROM lobby_players 
            GROUP BY lobby_code
        ) as subq) as avg_players_per_lobby,
        (SELECT COUNT(*) FROM lobby_players) as total_players
    FROM lobbies;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze question set popularity
CREATE OR REPLACE FUNCTION get_question_set_popularity()
RETURNS TABLE (
    question_set_id INTEGER,
    usage_count BIGINT,
    last_used TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.question_set_id,
        COUNT(*) as usage_count,
        MAX(l.created_at) as last_used
    FROM lobbies l
    WHERE l.question_set_id IS NOT NULL
    GROUP BY l.question_set_id
    ORDER BY usage_count DESC, last_used DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Database Performance Monitoring
-- =============================================

-- Function to analyze slow queries (requires pg_stat_statements extension)
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE (
    query TEXT,
    calls BIGINT,
    total_time NUMERIC,
    avg_time NUMERIC
) AS $$
BEGIN
    -- Check if pg_stat_statements extension is available
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_stat_statements') THEN
        RETURN QUERY
        SELECT 
            pss.query,
            pss.calls,
            pss.total_exec_time as total_time,
            pss.mean_exec_time as avg_time
        FROM pg_stat_statements pss
        WHERE pss.mean_exec_time > 100 -- queries taking more than 100ms on average
        ORDER BY pss.mean_exec_time DESC
        LIMIT 10;
    ELSE
        -- Return empty result if extension not available
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Cache Invalidation Support
-- =============================================

-- Function to invalidate lobby caches (for future Redis integration)
CREATE OR REPLACE FUNCTION invalidate_lobby_cache(lobby_code_param VARCHAR(4))
RETURNS void AS $$
BEGIN
    -- This function is a placeholder for future cache invalidation logic
    -- When Redis caching is implemented, this will trigger cache invalidation
    -- For now, it just logs the cache invalidation request
    RAISE NOTICE 'Cache invalidation requested for lobby: %', lobby_code_param;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Performance Analysis Views
-- =============================================

-- View for lobby performance metrics
CREATE OR REPLACE VIEW lobby_performance_view AS
SELECT 
    l.code,
    l.created_at,
    l.last_activity,
    l.started,
    l.game_phase,
    COUNT(lp.username) as player_count,
    MAX(lp.score) as highest_score,
    AVG(lp.score) as average_score,
    COUNT(lq.question_index) as total_questions
FROM lobbies l
LEFT JOIN lobby_players lp ON l.code = lp.lobby_code
LEFT JOIN lobby_questions lq ON l.code = lq.lobby_code
GROUP BY l.code, l.created_at, l.last_activity, l.started, l.game_phase;

-- View for user performance summary
CREATE OR REPLACE VIEW user_performance_view AS
SELECT 
    u.username,
    u.total_games_played,
    u.best_score,
    COUNT(hof.id) as hall_of_fame_entries,
    MAX(hof.score) as hall_of_fame_best,
    AVG(hof.accuracy) as average_accuracy,
    MAX(hof.max_multiplier) as highest_multiplier
FROM users u
LEFT JOIN hall_of_fame hof ON u.username = hof.username
GROUP BY u.username, u.total_games_played, u.best_score;

-- =============================================
-- Migration Completion
-- =============================================

-- Log migration completion
INSERT INTO schema_migrations (version, applied_at) 
VALUES ('003_performance_indexes', CURRENT_TIMESTAMP)
ON CONFLICT (version) DO UPDATE SET applied_at = CURRENT_TIMESTAMP;

-- Performance optimization complete
SELECT 'Migration 003: Performance indexes and optimizations applied successfully!' as status; 