// backend/routes/monitoring.js - Enhanced monitoring with performance metrics
const express = require('express');
const router = express.Router();
const { query, getPoolMetrics } = require('../database/connection');

// Get comprehensive system metrics
router.get('/metrics', async (req, res) => {
    try {
        const metrics = {
            timestamp: new Date().toISOString(),
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                version: process.version,
                platform: process.platform
            },
            database: {},
            application: {}
        };

        // Get database connection pool metrics
        try {
            metrics.database.pool = getPoolMetrics();
        } catch (error) {
            console.error('Error getting pool metrics:', error);
            metrics.database.pool = { error: 'Unable to retrieve pool metrics' };
        }

        // Get lobby performance statistics
        try {
            const lobbyStatsResult = await query('SELECT * FROM get_lobby_performance_stats()');
            if (lobbyStatsResult.rows.length > 0) {
                metrics.application.lobbyStats = lobbyStatsResult.rows[0];
            }
        } catch (error) {
            console.warn('Lobby performance stats not available:', error.message);
            metrics.application.lobbyStats = { error: 'Statistics function not available' };
        }

        // Get question set popularity
        try {
            const popularityResult = await query('SELECT * FROM get_question_set_popularity() LIMIT 10');
            metrics.application.questionSetPopularity = popularityResult.rows;
        } catch (error) {
            console.warn('Question set popularity not available:', error.message);
            metrics.application.questionSetPopularity = { error: 'Popularity function not available' };
        }

        // Get basic table counts
        try {
            const counts = {};
            
            const userCountResult = await query('SELECT COUNT(*) as count FROM users');
            counts.users = parseInt(userCountResult.rows[0].count);
            
            const lobbyCountResult = await query('SELECT COUNT(*) as count FROM lobbies');
            counts.lobbies = parseInt(lobbyCountResult.rows[0].count);
            
            const playerCountResult = await query('SELECT COUNT(*) as count FROM lobby_players');
            counts.activePlayers = parseInt(playerCountResult.rows[0].count);
            
            const hofCountResult = await query('SELECT COUNT(*) as count FROM hall_of_fame');
            counts.hallOfFameEntries = parseInt(hofCountResult.rows[0].count);
            
            // Try to get question sets count if table exists
            try {
                const qsCountResult = await query('SELECT COUNT(*) as count FROM question_sets');
                counts.questionSets = parseInt(qsCountResult.rows[0].count);
            } catch (qsError) {
                counts.questionSets = 'N/A';
            }
            
            metrics.application.counts = counts;
        } catch (error) {
            console.error('Error getting application counts:', error);
            metrics.application.counts = { error: 'Unable to retrieve counts' };
        }

        res.json(metrics);

    } catch (error) {
        console.error('Error generating metrics:', error);
        res.status(500).json({ 
            error: 'Failed to generate metrics',
            timestamp: new Date().toISOString()
        });
    }
});

// Get database performance analysis
router.get('/performance', async (req, res) => {
    try {
        const performance = {
            timestamp: new Date().toISOString(),
            database: {},
            queries: {}
        };

        // Get slow queries if available
        try {
            const slowQueriesResult = await query('SELECT * FROM get_slow_queries()');
            performance.queries.slowQueries = slowQueriesResult.rows;
        } catch (error) {
            performance.queries.slowQueries = { 
                error: 'Slow query analysis not available - pg_stat_statements extension may not be installed' 
            };
        }

        // Get index usage statistics
        try {
            const indexUsageResult = await query(`
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    idx_scan,
                    idx_tup_read,
                    idx_tup_fetch
                FROM pg_stat_user_indexes 
                WHERE schemaname = 'public'
                ORDER BY idx_scan DESC
                LIMIT 20
            `);
            performance.database.indexUsage = indexUsageResult.rows;
        } catch (error) {
            performance.database.indexUsage = { error: 'Index usage statistics not available' };
        }

        // Get table statistics
        try {
            const tableStatsResult = await query(`
                SELECT 
                    schemaname,
                    tablename,
                    n_tup_ins as inserts,
                    n_tup_upd as updates,
                    n_tup_del as deletes,
                    n_live_tup as live_tuples,
                    n_dead_tup as dead_tuples,
                    last_vacuum,
                    last_autovacuum,
                    last_analyze,
                    last_autoanalyze
                FROM pg_stat_user_tables 
                WHERE schemaname = 'public'
                ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC
            `);
            performance.database.tableStats = tableStatsResult.rows;
        } catch (error) {
            performance.database.tableStats = { error: 'Table statistics not available' };
        }

        // Get connection statistics
        try {
            const connectionStatsResult = await query(`
                SELECT 
                    state,
                    COUNT(*) as connection_count,
                    MAX(now() - query_start) as max_query_duration
                FROM pg_stat_activity 
                WHERE datname = current_database()
                GROUP BY state
            `);
            performance.database.connections = connectionStatsResult.rows;
        } catch (error) {
            performance.database.connections = { error: 'Connection statistics not available' };
        }

        res.json(performance);

    } catch (error) {
        console.error('Error generating performance metrics:', error);
        res.status(500).json({ 
            error: 'Failed to generate performance metrics',
            timestamp: new Date().toISOString()
        });
    }
});

// Get application health summary
router.get('/health-summary', async (req, res) => {
    try {
        const summary = {
            timestamp: new Date().toISOString(),
            status: 'healthy',
            checks: {}
        };

        // Database connectivity check
        try {
            await query('SELECT 1');
            summary.checks.database = { status: 'healthy', message: 'Connected' };
        } catch (error) {
            summary.checks.database = { status: 'unhealthy', message: error.message };
            summary.status = 'unhealthy';
        }

        // Pool health check
        try {
            const poolMetrics = getPoolMetrics();
            const poolHealthy = poolMetrics.totalConnections > 0 && poolMetrics.healthCheckFailures === 0;
            summary.checks.connectionPool = { 
                status: poolHealthy ? 'healthy' : 'warning',
                message: poolHealthy ? 'Pool operating normally' : 'Pool has issues',
                metrics: {
                    total: poolMetrics.totalConnections,
                    active: poolMetrics.activeConnections,
                    idle: poolMetrics.idleConnections,
                    waiting: poolMetrics.waitingRequests,
                    failures: poolMetrics.healthCheckFailures
                }
            };
            
            if (!poolHealthy) {
                summary.status = summary.status === 'unhealthy' ? 'unhealthy' : 'warning';
            }
        } catch (error) {
            summary.checks.connectionPool = { status: 'unknown', message: 'Unable to check pool status' };
            summary.status = summary.status === 'unhealthy' ? 'unhealthy' : 'warning';
        }

        // Application logic check (basic functionality)
        try {
            const activeLobbies = await query('SELECT COUNT(*) as count FROM lobbies WHERE started = TRUE');
            const playerCount = await query('SELECT COUNT(*) as count FROM lobby_players');
            
            summary.checks.application = {
                status: 'healthy',
                message: 'Application logic functioning',
                activeLobbies: parseInt(activeLobbies.rows[0].count),
                activePlayers: parseInt(playerCount.rows[0].count)
            };
        } catch (error) {
            summary.checks.application = { status: 'warning', message: 'Application metrics unavailable' };
            summary.status = summary.status === 'unhealthy' ? 'unhealthy' : 'warning';
        }

        // Disk space check (basic)
        try {
            const diskSpaceResult = await query(`
                SELECT 
                    pg_size_pretty(pg_database_size(current_database())) as database_size,
                    pg_size_pretty(pg_total_relation_size('lobbies')) as lobbies_size,
                    pg_size_pretty(pg_total_relation_size('lobby_players')) as players_size,
                    pg_size_pretty(pg_total_relation_size('hall_of_fame')) as hall_of_fame_size
            `);
            
            summary.checks.storage = {
                status: 'healthy',
                message: 'Storage metrics available',
                sizes: diskSpaceResult.rows[0]
            };
        } catch (error) {
            summary.checks.storage = { status: 'unknown', message: 'Storage metrics unavailable' };
        }

        res.json(summary);

    } catch (error) {
        console.error('Error generating health summary:', error);
        res.status(500).json({ 
            status: 'unhealthy',
            error: 'Failed to generate health summary',
            timestamp: new Date().toISOString()
        });
    }
});

// Get real-time activity metrics
router.get('/activity', async (req, res) => {
    try {
        const activity = {
            timestamp: new Date().toISOString(),
            current: {},
            recent: {}
        };

        // Current activity
        const currentActivityResult = await query(`
            SELECT 
                COUNT(*) FILTER (WHERE started = FALSE) as waiting_lobbies,
                COUNT(*) FILTER (WHERE started = TRUE AND game_phase = 'question') as active_games,
                COUNT(*) FILTER (WHERE started = TRUE AND game_phase = 'results') as result_phase_games,
                COUNT(*) FILTER (WHERE started = TRUE AND game_phase = 'post-game') as finished_games,
                COUNT(*) FILTER (WHERE last_activity > NOW() - INTERVAL '1 minute') as recent_activity
            FROM lobbies
        `);
        
        activity.current.lobbies = currentActivityResult.rows[0];

        // Player activity
        const playerActivityResult = await query(`
            SELECT 
                COUNT(*) as total_players,
                COUNT(*) FILTER (WHERE answered = TRUE) as answered_players,
                COUNT(*) FILTER (WHERE ready = TRUE) as ready_players,
                COUNT(DISTINCT lobby_code) as lobbies_with_players
            FROM lobby_players
        `);
        
        activity.current.players = playerActivityResult.rows[0];

        // Recent activity (last hour)
        const recentActivityResult = await query(`
            SELECT 
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as lobbies_created_last_hour,
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour' AND started = TRUE) as games_started_last_hour,
                MAX(created_at) as most_recent_lobby
            FROM lobbies
        `);
        
        activity.recent.lobbies = recentActivityResult.rows[0];

        // Hall of Fame activity
        const hofActivityResult = await query(`
            SELECT 
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as entries_last_hour,
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as entries_last_day,
                MAX(score) as highest_score_recent,
                MAX(created_at) as most_recent_entry
            FROM hall_of_fame
        `);
        
        activity.recent.hallOfFame = hofActivityResult.rows[0];

        res.json(activity);

    } catch (error) {
        console.error('Error generating activity metrics:', error);
        res.status(500).json({ 
            error: 'Failed to generate activity metrics',
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router; 