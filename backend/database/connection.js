// backend/database/connection.js
const { Pool } = require('pg');

let pool = null;

/**
 * Initialize database connection pool with retries
 * @returns {Promise<Pool>} PostgreSQL connection pool
 */
async function initializePool() {
    if (pool) {
        return pool;
    }

    // Parse DATABASE_URL or use individual components
    const databaseUrl = process.env.DATABASE_URL;
    let poolConfig;

    if (databaseUrl) {
        poolConfig = {
            connectionString: databaseUrl,
            // Only use SSL in production with external databases
            ssl: process.env.NODE_ENV === 'production' && databaseUrl.includes('ssl=true') ? 
                { rejectUnauthorized: false } : false,
            max: 20, // Maximum number of clients in the pool
            idleTimeoutMillis: 60000, // Close idle clients after 60 seconds
            connectionTimeoutMillis: 10000, // Increased to 10 seconds
            statement_timeout: 30000, // Statement timeout after 30 seconds
            query_timeout: 30000, // Query timeout after 30 seconds
        };
    } else {
        // Fallback to individual environment variables
        poolConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'learn2play',
            user: process.env.DB_USER || 'l2p_user',
            password: process.env.DB_PASSWORD || 'l2p_password',
            ssl: false, // No SSL for local development
            max: 20,
            idleTimeoutMillis: 60000,
            connectionTimeoutMillis: 10000,
            statement_timeout: 30000,
            query_timeout: 30000,
        };
    }

    pool = new Pool(poolConfig);

    // Test connection with retries
    const maxRetries = 5;
    const retryDelay = 2000; // 2 seconds between retries
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await testConnection();
            console.log(`✅ Database connection established (attempt ${attempt}/${maxRetries})`);
            break;
        } catch (error) {
            if (attempt === maxRetries) {
                console.error('❌ Failed to establish database connection after', maxRetries, 'attempts:', error.message);
                throw error;
            }
            console.log(`⏳ Retrying database connection in ${retryDelay}ms (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }

    // Handle pool errors
    pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        // Don't exit the process, try to recover
        if (!pool._closed) {
            console.log('Attempting to create a new connection pool...');
            pool = null;
            initializePool().catch(error => {
                console.error('Failed to recreate connection pool:', error);
                process.exit(-1);
            });
        }
    });

    // Handle process termination
    process.on('SIGINT', () => {
        console.log('Received SIGINT, closing database pool...');
        pool.end(() => {
            console.log('Database pool closed.');
            process.exit(0);
        });
    });

    process.on('SIGTERM', () => {
        console.log('Received SIGTERM, closing database pool...');
        pool.end(() => {
            console.log('Database pool closed.');
            process.exit(0);
        });
    });

    return pool;
}

/**
 * Get database connection pool
 * @returns {Pool} PostgreSQL connection pool
 */
function getPool() {
    if (!pool) {
        throw new Error('Database pool not initialized. Call initializePool() first.');
    }
    return pool;
}

/**
 * Execute a database query
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params = []) {
    const start = Date.now();
    try {
        if (!pool) {
            throw new Error('Database pool not initialized. Call initializePool() first.');
        }
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', {
            text: text.substring(0, 100),
            params,
            error: error.message,
            stack: error.stack,
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            position: error.position,
            internalPosition: error.internalPosition,
            internalQuery: error.internalQuery,
            where: error.where,
            schema: error.schema,
            table: error.table,
            column: error.column,
            dataType: error.dataType,
            constraint: error.constraint
        });
        throw error;
    }
}

/**
 * Execute a transaction
 * @param {Function} callback - Function that receives client and executes queries
 * @returns {Promise<any>} Transaction result
 */
async function transaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
    if (!pool) {
        return false;
    }
    
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT NOW() as current_time');
        console.log('Database connection test successful:', result.rows[0].current_time);
        return true;
    } catch (error) {
        console.error('Database connection test failed:', error.message);
        return false;
    } finally {
        client.release();
    }
}

module.exports = {
    initializePool,
    getPool,
    query,
    transaction,
    testConnection
};