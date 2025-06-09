// backend/database/init.js
// Enhanced version with better error handling and pg_cron management
const fs = require('fs');
const path = require('path');
const { query } = require('./connection');

/**
 * Check if pg_cron extension is available and enabled
 * @returns {Promise<boolean>} Whether pg_cron is available
 */
async function isPgCronAvailable() {
    try {
        // First check if extension files are available in the system
        const extensionAvailable = await query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_available_extensions 
                WHERE name = 'pg_cron'
            ) as available
        `);
        
        if (!extensionAvailable.rows[0].available) {
            return false;
        }
        
        // Check if extension is already installed
        const result = await query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_extension 
                WHERE extname = 'pg_cron'
            ) as extension_exists
        `);
        
        return result.rows[0].extension_exists;
    } catch (error) {
        console.log('ℹ️ pg_cron extension not available:', error.message);
        return false;
    }
}

/**
 * Initialize database schema with comprehensive checks to prevent duplicate operations
 */
async function initializeDatabase() {
    try {
        console.log('🔄 Starting database initialization...');
        
        // Check database connection first
        await testDatabaseConnection();
        
        // Enable required extensions
        await enableExtensions();
        
        // Check if database has been initialized
        const isInitialized = await checkDatabaseInitialization();
        
        if (!isInitialized) {
            console.log('📊 Database not initialized. Creating fresh schema...');
            await createFreshSchema();
        } else {
            console.log('✅ Database already initialized. Checking for updates...');
            await updateExistingSchema();
        }
        
        // Always ensure functions and triggers are up to date
        await updateFunctionsAndTriggers();
        
        // Setup cron jobs only if extension is available
        await setupCronJobs();
        
        // Final validation
        await validateDatabaseSchema();
        
        console.log('✅ Database initialization completed successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

/**
 * Test database connection
 */
async function testDatabaseConnection() {
    try {
        const result = await query('SELECT NOW() as current_time, version() as db_version');
        console.log('✅ Database connection test successful');
        console.log(`   Time: ${result.rows[0].current_time}`);
        console.log(`   Version: ${result.rows[0].db_version.split(' ').slice(0, 2).join(' ')}`);
    } catch (error) {
        console.error('❌ Database connection test failed:', error.message);
        throw new Error('Database connection failed. Please check your database configuration.');
    }
}

/**
 * Enable required PostgreSQL extensions with improved error handling
 */
async function enableExtensions() {
    try {
        console.log('🔧 Checking PostgreSQL extensions...');
        
        // Check and install pg_cron extension if available
        const cronAvailable = await isPgCronAvailable();
        
        if (cronAvailable) {
            console.log('✅ pg_cron extension is already installed');
        } else {
            try {
                // Try to install pg_cron if files are available
                const extensionFiles = await query(`
                    SELECT EXISTS (
                        SELECT 1 FROM pg_available_extensions 
                        WHERE name = 'pg_cron'
                    ) as available
                `);
                
                if (extensionFiles.rows[0].available) {
                    await query('CREATE EXTENSION IF NOT EXISTS pg_cron');
                    console.log('✅ pg_cron extension installed successfully');
                } else {
                    console.log('ℹ️ pg_cron extension files not available - cron jobs will be disabled');
                }
            } catch (cronError) {
                console.log('ℹ️ pg_cron extension not available - cron jobs will be disabled');
                console.log('   This is normal for many PostgreSQL installations');
            }
        }
        
        console.log('✅ Extensions check completed');
    } catch (error) {
        console.warn('⚠️ Could not check extensions:', error.message);
        // Don't throw error as extensions might not be available in all environments
    }
}

/**
 * Check if database has been properly initialized
 */
async function checkDatabaseInitialization() {
    try {
        const result = await query(`
            SELECT COUNT(*) as table_count
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'hall_of_fame', 'lobbies', 'lobby_players', 'question_sets')
        `);
        
        const tableCount = parseInt(result.rows[0].table_count);
        
        if (tableCount > 0) {
            console.log(`ℹ️ Found ${tableCount}/5 required tables`);
            
            // Check if hall_of_fame has all required columns
            const hofColumns = await query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'hall_of_fame'
                AND column_name IN ('username', 'character', 'questions')
            `);
            
            const requiredColumns = ['username', 'character', 'questions'];
            const existingColumns = hofColumns.rows.map(row => row.column_name);
            const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
            
            if (missingColumns.length > 0) {
                console.log(`⚠️ hall_of_fame table missing columns: ${missingColumns.join(', ')}`);
                return false; // Force re-initialization to fix schema
            }
        }
        
        return tableCount === 5; // All required tables exist
    } catch (error) {
        console.log('Database check failed, assuming fresh installation');
        return false;
    }
}

/**
 * Create fresh database schema
 */
async function createFreshSchema() {
    try {
        // Execute schema files in correct order
        await executeSchemaFile('schema.sql', 'Main schema (users, hall_of_fame)');
        await executeSchemaFile('lobby.sql', 'Lobby schema (lobbies, lobby_players, lobby_questions)');
        await executeSchemaFile('questionsets.sql', 'Question sets schema');
        
        console.log('✅ Fresh schema created successfully');
    } catch (error) {
        console.error('❌ Failed to create fresh schema:', error);
        throw error;
    }
}

/**
 * Update existing schema with missing components
 */
async function updateExistingSchema() {
    try {
        // Check and add missing tables
        await checkAndCreateMissingTables();
        
        // Check and add missing columns (especially for hall_of_fame)
        await checkAndAddMissingColumns();
        
        // Check and add missing indexes
        await checkAndCreateMissingIndexes();
        
        console.log('✅ Schema updates completed');
    } catch (error) {
        console.error('❌ Failed to update existing schema:', error);
        throw error;
    }
}

/**
 * Check and add missing columns (fixes the hall_of_fame issue)
 */
async function checkAndAddMissingColumns() {
    const requiredColumns = [
        // Hall of Fame required columns
        { table: 'hall_of_fame', column: 'username', type: 'VARCHAR(50) NOT NULL DEFAULT \'unknown\'' },
        { table: 'hall_of_fame', column: 'character', type: 'VARCHAR(10) NOT NULL DEFAULT \'🎯\'' },
        { table: 'hall_of_fame', column: 'questions', type: 'INTEGER NOT NULL DEFAULT 0' },
        // Lobby columns
        { table: 'lobbies', column: 'last_activity', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
        { table: 'lobbies', column: 'question_set_id', type: 'INTEGER REFERENCES question_sets(id)' }
    ];
    
    for (const col of requiredColumns) {
        const exists = await checkColumnExists(col.table, col.column);
        if (!exists) {
            console.log(`🔧 Adding missing column: ${col.table}.${col.column}`);
            await query(`ALTER TABLE ${col.table} ADD COLUMN IF NOT EXISTS ${col.column} ${col.type}`);
            
            // Special handling for last_activity column
            if (col.column === 'last_activity') {
                await query(`UPDATE ${col.table} SET ${col.column} = created_at WHERE ${col.column} IS NULL`);
            }
        } else {
            console.log(`✅ Column exists: ${col.table}.${col.column}`);
        }
    }
}

/**
 * Check if a column exists
 */
async function checkColumnExists(tableName, columnName) {
    try {
        const result = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = $1
                AND column_name = $2
            )
        `, [tableName, columnName]);
        
        return result.rows[0].exists;
    } catch (error) {
        return false;
    }
}

/**
 * Check and create missing tables
 */
async function checkAndCreateMissingTables() {
    const requiredTables = [
        { name: 'users', file: 'schema.sql' },
        { name: 'hall_of_fame', file: 'schema.sql' },
        { name: 'lobbies', file: 'lobby.sql' },
        { name: 'lobby_players', file: 'lobby.sql' },
        { name: 'lobby_questions', file: 'lobby.sql' },
        { name: 'question_sets', file: 'questionsets.sql' }
    ];
    
    for (const table of requiredTables) {
        const exists = await checkTableExists(table.name);
        if (!exists) {
            console.log(`📊 Creating missing table: ${table.name}`);
            await executeSchemaFile(table.file, `Missing table: ${table.name}`);
        } else {
            console.log(`✅ Table exists: ${table.name}`);
        }
    }
}

/**
 * Check if a table exists
 */
async function checkTableExists(tableName) {
    try {
        const result = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
            )
        `, [tableName]);
        
        return result.rows[0].exists;
    } catch (error) {
        return false;
    }
}

/**
 * Check and create missing indexes
 */
async function checkAndCreateMissingIndexes() {
    const requiredIndexes = [
        'idx_hall_of_fame_user_id',
        'idx_hall_of_fame_catalog',
        'idx_hall_of_fame_score',
        'idx_users_username',
        'idx_lobby_players_username',
        'idx_lobby_created_at',
        'idx_lobby_last_activity',
        'idx_question_sets_name',
        'idx_question_sets_created_by',
        'idx_question_sets_public',
        'idx_lobbies_question_set_id'
    ];
    
    for (const indexName of requiredIndexes) {
        const exists = await checkIndexExists(indexName);
        if (!exists) {
            console.log(`🔍 Creating missing index: ${indexName}`);
            await createIndexSafely(indexName);
        } else {
            console.log(`✅ Index exists: ${indexName}`);
        }
    }
}

/**
 * Check if an index exists
 */
async function checkIndexExists(indexName) {
    try {
        const result = await query(`
            SELECT EXISTS (
                SELECT FROM pg_indexes
                WHERE schemaname = 'public'
                AND indexname = $1
            )
        `, [indexName]);
        
        return result.rows[0].exists;
    } catch (error) {
        return false;
    }
}

/**
 * Create index safely with proper SQL
 */
async function createIndexSafely(indexName) {
    const indexDefinitions = {
        'idx_hall_of_fame_user_id': 'CREATE INDEX IF NOT EXISTS idx_hall_of_fame_user_id ON hall_of_fame(user_id)',
        'idx_hall_of_fame_catalog': 'CREATE INDEX IF NOT EXISTS idx_hall_of_fame_catalog ON hall_of_fame(catalog_name)',
        'idx_hall_of_fame_score': 'CREATE INDEX IF NOT EXISTS idx_hall_of_fame_score ON hall_of_fame(score DESC)',
        'idx_users_username': 'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
        'idx_lobby_players_username': 'CREATE INDEX IF NOT EXISTS idx_lobby_players_username ON lobby_players(username)',
        'idx_lobby_created_at': 'CREATE INDEX IF NOT EXISTS idx_lobby_created_at ON lobbies(created_at)',
        'idx_lobby_last_activity': 'CREATE INDEX IF NOT EXISTS idx_lobby_last_activity ON lobbies(last_activity)',
        'idx_question_sets_name': 'CREATE INDEX IF NOT EXISTS idx_question_sets_name ON question_sets(name)',
        'idx_question_sets_created_by': 'CREATE INDEX IF NOT EXISTS idx_question_sets_created_by ON question_sets(created_by)',
        'idx_question_sets_public': 'CREATE INDEX IF NOT EXISTS idx_question_sets_public ON question_sets(is_public)',
        'idx_lobbies_question_set_id': 'CREATE INDEX IF NOT EXISTS idx_lobbies_question_set_id ON lobbies(question_set_id)'
    };
    
    if (indexDefinitions[indexName]) {
        await query(indexDefinitions[indexName]);
    }
}

/**
 * Update functions and triggers to latest version
 */
async function updateFunctionsAndTriggers() {
    try {
        console.log('🔧 Updating database functions and triggers...');
        
        // Create/update timestamp function
        await query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        // Create/update lobby activity functions
        await query(`
            CREATE OR REPLACE FUNCTION delete_inactive_lobbies()
            RETURNS void AS $$
            BEGIN
                DELETE FROM lobbies
                WHERE last_activity < NOW() - INTERVAL '1 minute'
                AND started = FALSE;
                
                DELETE FROM lobbies
                WHERE created_at < NOW() - INTERVAL '2 hours'
                AND started = TRUE;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        await query(`
            CREATE OR REPLACE FUNCTION update_lobby_activity()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE lobbies 
                SET last_activity = CURRENT_TIMESTAMP 
                WHERE code = COALESCE(NEW.lobby_code, OLD.lobby_code);
                RETURN COALESCE(NEW, OLD);
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        // Drop and recreate triggers to ensure they're current
        const triggers = [
            { name: 'update_users_updated_at', table: 'users', function: 'update_updated_at_column()' },
            { name: 'update_question_sets_updated_at', table: 'question_sets', function: 'update_updated_at_column()' },
            { name: 'trigger_update_lobby_activity_insert', table: 'lobby_players', function: 'update_lobby_activity()', when: 'AFTER INSERT' },
            { name: 'trigger_update_lobby_activity_update', table: 'lobby_players', function: 'update_lobby_activity()', when: 'AFTER UPDATE' },
            { name: 'trigger_update_lobby_activity_delete', table: 'lobby_players', function: 'update_lobby_activity()', when: 'AFTER DELETE' }
        ];
        
        for (const trigger of triggers) {
            // Check if table exists before creating trigger
            const tableExists = await checkTableExists(trigger.table);
            if (tableExists) {
                await query(`DROP TRIGGER IF EXISTS ${trigger.name} ON ${trigger.table}`);
                const when = trigger.when || 'BEFORE UPDATE';
                await query(`
                    CREATE TRIGGER ${trigger.name}
                        ${when} ON ${trigger.table}
                        FOR EACH ROW
                        EXECUTE FUNCTION ${trigger.function}
                `);
                console.log(`✅ Created trigger: ${trigger.name}`);
            }
        }
        
        console.log('✅ Functions and triggers updated successfully');
    } catch (error) {
        console.error('❌ Failed to update functions and triggers:', error);
        throw error;
    }
}

/**
 * Setup cron jobs for maintenance
 */
async function setupCronJobs() {
    const cronAvailable = await isPgCronAvailable();
    
    if (!cronAvailable) {
        console.log('ℹ️ pg_cron extension not available - skipping cron job setup');
        console.log('💡 Lobby cleanup will need to be handled manually or via external scheduler');
        return;
    }
    
    try {
        console.log('⏰ Setting up cron jobs...');
        
        // Remove any existing lobby cleanup jobs
        const oldJobNames = ['delete-old-lobbies', 'delete-inactive-lobbies'];
        for (const jobName of oldJobNames) {
            try {
                await query(`SELECT cron.unschedule('${jobName}')`);
                console.log(`   ✓ Removed old cron job: ${jobName}`);
            } catch (error) {
                // Ignore errors - job might not exist
                console.log(`   ℹ️ Cron job ${jobName} did not exist`);
            }
        }
        
        // Create new cron job for lobby cleanup
        await query(`SELECT cron.schedule('lobby-cleanup', '* * * * *', 'SELECT delete_inactive_lobbies()')`);
        
        console.log('✅ Cron jobs configured successfully');
    } catch (error) {
        console.warn('⚠️ Could not setup cron jobs:', error.message);
        // Don't throw error as cron jobs are optional
    }
}

/**
 * Execute a schema file safely
 */
async function executeSchemaFile(filename, description) {
    try {
        console.log(`📄 Executing ${description}...`);
        const filePath = path.join(__dirname, filename);
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`Schema file not found: ${filename}`);
        }
        
        const schema = fs.readFileSync(filePath, 'utf8');
        await query(schema);
        
        console.log(`✅ ${description} executed successfully`);
    } catch (error) {
        console.error(`❌ Failed to execute ${description}:`, error);
        throw error;
    }
}

/**
 * Validate database schema after initialization
 */
async function validateDatabaseSchema() {
    try {
        console.log('🔍 Validating database schema...');
        
        // Check all required tables exist
        const requiredTables = ['users', 'hall_of_fame', 'lobbies', 'lobby_players', 'question_sets'];
        const tableResults = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ANY($1)
        `, [requiredTables]);
        
        const existingTables = tableResults.rows.map(row => row.table_name);
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));
        
        if (missingTables.length > 0) {
            throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
        }
        
        // Check hall_of_fame has all required columns
        const hofColumns = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'hall_of_fame'
        `);
        
        const columnNames = hofColumns.rows.map(row => row.column_name);
        const requiredColumns = ['id', 'user_id', 'username', 'character', 'catalog_name', 'score', 'questions', 'accuracy', 'max_multiplier', 'created_at'];
        const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
        
        if (missingColumns.length > 0) {
            throw new Error(`hall_of_fame table missing columns: ${missingColumns.join(', ')}`);
        }
        
        // Check functions exist
        const functions = await query(`
            SELECT routine_name
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_type = 'FUNCTION'
            AND routine_name IN ('update_updated_at_column', 'delete_inactive_lobbies', 'update_lobby_activity')
        `);
        
        console.log(`✅ Database schema validation passed`);
        console.log(`   Tables: ${existingTables.length}/${requiredTables.length}`);
        console.log(`   hall_of_fame columns: ${columnNames.length}/${requiredColumns.length}`);
        console.log(`   Functions: ${functions.rows.length}/3`);
        
    } catch (error) {
        console.error('❌ Database schema validation failed:', error);
        throw error;
    }
}

module.exports = {
    initializeDatabase,
    isPgCronAvailable,
    testDatabaseConnection,
    validateDatabaseSchema
};