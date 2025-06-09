const { query } = require('./connection');
const { initializeDatabase } = require('./init');

/**
 * Check if pg_cron extension is available and enabled
 * @returns {Promise<boolean>} Whether pg_cron is available
 */
async function isPgCronAvailable() {
    try {
        const result = await query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_extension 
                WHERE extname = 'pg_cron'
            ) as extension_exists
        `);
        return result.rows[0].extension_exists;
    } catch (error) {
        return false;
    }
}

/**
 * Reset the entire database - USE WITH CAUTION!
 * This will drop all tables and recreate them from scratch
 */
async function resetDatabase() {
    try {
        console.log('🚨 WARNING: Resetting entire database...');
        
        // Disable foreign key checks temporarily by dropping tables in correct order
        await dropAllTables();
        
        // Drop all functions and triggers
        await dropAllFunctions();
        
        // Remove all cron jobs
        await removeAllCronJobs();
        
        console.log('🗑️ All database objects dropped successfully');
        
        // Reinitialize fresh database
        console.log('🔄 Reinitializing fresh database...');
        await initializeDatabase();
        
        console.log('✅ Database reset completed successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Database reset failed:', error);
        throw error;
    }
}

/**
 * Drop all tables in correct order to avoid foreign key constraints
 */
async function dropAllTables() {
    try {
        console.log('🗑️ Dropping all tables...');
        
        // Drop tables in reverse dependency order
        const tablesToDrop = [
            'lobby_questions',
            'lobby_players', 
            'lobbies',
            'question_sets',
            'hall_of_fame',
            'users'
        ];
        
        for (const table of tablesToDrop) {
            try {
                await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
                console.log(`   ✓ Dropped table: ${table}`);
            } catch (error) {
                console.warn(`   ⚠️ Could not drop table ${table}:`, error.message);
            }
        }
        
        console.log('✅ All tables dropped');
    } catch (error) {
        console.error('❌ Failed to drop tables:', error);
        throw error;
    }
}

/**
 * Drop all custom functions
 */
async function dropAllFunctions() {
    try {
        console.log('🗑️ Dropping all functions...');
        
        const functionsToDrop = [
            'update_updated_at_column',
            'delete_inactive_lobbies',
            'update_lobby_activity'
        ];
        
        for (const func of functionsToDrop) {
            try {
                await query(`DROP FUNCTION IF EXISTS ${func}() CASCADE`);
                console.log(`   ✓ Dropped function: ${func}()`);
            } catch (error) {
                console.warn(`   ⚠️ Could not drop function ${func}():`, error.message);
            }
        }
        
        console.log('✅ All functions dropped');
    } catch (error) {
        console.error('❌ Failed to drop functions:', error);
        // Don't throw error as functions might not exist
    }
}

/**
 * Remove all cron jobs
 */
async function removeAllCronJobs() {
    const cronAvailable = await isPgCronAvailable();
    
    if (!cronAvailable) {
        console.log('ℹ️ pg_cron extension not available - skipping cron job removal');
        return;
    }
    
    try {
        console.log('⏰ Removing all cron jobs...');
        
        const jobsToRemove = [
            'delete-old-lobbies',
            'delete-inactive-lobbies', 
            'lobby-cleanup'
        ];
        
        for (const job of jobsToRemove) {
            try {
                await query(`SELECT cron.unschedule('${job}')`);
                console.log(`   ✓ Removed cron job: ${job}`);
            } catch (error) {
                // Ignore errors - job might not exist
                console.log(`   ℹ️ Cron job ${job} did not exist or could not be removed`);
            }
        }
        
        console.log('✅ All cron jobs removed');
    } catch (error) {
        console.warn('⚠️ Could not remove cron jobs:', error.message);
        // Don't throw error as cron jobs are optional
    }
}

/**
 * Check if database is empty (no tables exist)
 */
async function isDatabaseEmpty() {
    try {
        const result = await query(`
            SELECT COUNT(*) as table_count
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
        `);
        
        return parseInt(result.rows[0].table_count) === 0;
    } catch (error) {
        return true; // Assume empty if check fails
    }
}

/**
 * Get database status information
 */
async function getDatabaseStatus() {
    try {
        const tablesResult = await query(`
            SELECT table_name
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        const functionsResult = await query(`
            SELECT routine_name
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_type = 'FUNCTION'
            ORDER BY routine_name
        `);
        
        const indexesResult = await query(`
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY indexname
        `);
        
        return {
            tables: tablesResult.rows.map(row => row.table_name),
            functions: functionsResult.rows.map(row => row.routine_name),
            indexes: indexesResult.rows.map(row => row.indexname),
            isEmpty: tablesResult.rows.length === 0
        };
    } catch (error) {
        console.error('Failed to get database status:', error);
        return { tables: [], functions: [], indexes: [], isEmpty: true };
    }
}

module.exports = {
    resetDatabase,
    isDatabaseEmpty,
    getDatabaseStatus
}; 