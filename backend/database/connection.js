// backend/database/connection.js
const { Pool } = require('pg');

let pool = null;
let poolMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingRequests: 0,
    totalQueries: 0,
    failedQueries: 0,
    averageQueryTime: 0,
    lastQueryTimes: [],
    reconnectionAttempts: 0,
    lastReconnectionTime: null,
    poolCreatedAt: null,
    healthCheckFailures: 0,
    lastHealthCheck: null
};

// Pool monitoring interval
let monitoringInterval = null;
const MONITORING_INTERVAL_MS = 30000; // 30 seconds
const MAX_QUERY_TIME_SAMPLES = 100;
const HEALTH_CHECK_INTERVAL_MS = 60000; // 1 minute
const MAX_RECONNECTION_ATTEMPTS = 10;
const RECONNECTION_DELAY_MS = 5000; // 5 seconds

/**
 * Log pool metrics for monitoring
 */
function logPoolMetrics() {
    if (!pool) return;
    
    const poolInfo = {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
    };
    
    poolMetrics.totalConnections = poolInfo.totalCount;
    poolMetrics.activeConnections = poolInfo.totalCount - poolInfo.idleCount;
    poolMetrics.idleConnections = poolInfo.idleCount;
    poolMetrics.waitingRequests = poolInfo.waitingCount;
    
    console.log('📊 Database Pool Metrics:', {
        ...poolMetrics,
        poolInfo,
        uptime: poolMetrics.poolCreatedAt ? Math.floor((Date.now() - poolMetrics.poolCreatedAt) / 1000) + 's' : 'N/A'
    });
    
    // Alert on concerning metrics
    if (poolInfo.waitingCount > 5) {
        console.warn('⚠️  High number of waiting requests:', poolInfo.waitingCount);
    }
    
    if (poolMetrics.averageQueryTime > 1000) {
        console.warn('⚠️  High average query time:', poolMetrics.averageQueryTime + 'ms');
    }
    
    if (poolMetrics.failedQueries > 0) {
        console.warn('⚠️  Failed queries detected:', poolMetrics.failedQueries);
    }
}

/**
 * Start pool monitoring
 */
function startPoolMonitoring() {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
    }
    
    monitoringInterval = setInterval(() => {
        logPoolMetrics();
        performHealthCheck();
    }, MONITORING_INTERVAL_MS);
    
    console.log('📈 Database pool monitoring started');
}

/**
 * Stop pool monitoring
 */
function stopPoolMonitoring() {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
        console.log('📈 Database pool monitoring stopped');
    }
}

/**
 * Perform health check on the database connection
 */
async function performHealthCheck() {
    try {
        const isHealthy = await testConnection();
        poolMetrics.lastHealthCheck = new Date().toISOString();
        
        if (isHealthy) {
            poolMetrics.healthCheckFailures = 0;
        } else {
            poolMetrics.healthCheckFailures++;
            console.warn(`⚠️  Health check failed (${poolMetrics.healthCheckFailures} consecutive failures)`);
            
            // Trigger reconnection if multiple failures
            if (poolMetrics.healthCheckFailures >= 3) {
                console.error('❌ Multiple health check failures, attempting reconnection...');
                await attemptReconnection();
            }
        }
    } catch (error) {
        poolMetrics.healthCheckFailures++;
        console.error('❌ Health check error:', error.message);
    }
}

/**
 * Attempt to reconnect the database pool
 */
async function attemptReconnection() {
    if (poolMetrics.reconnectionAttempts >= MAX_RECONNECTION_ATTEMPTS) {
        console.error('❌ Maximum reconnection attempts reached, giving up');
        return false;
    }
    
    poolMetrics.reconnectionAttempts++;
    poolMetrics.lastReconnectionTime = new Date().toISOString();
    
    console.log(`🔄 Attempting database reconnection (${poolMetrics.reconnectionAttempts}/${MAX_RECONNECTION_ATTEMPTS})`);
    
    try {
        // Close existing pool
        if (pool && !pool.ended) {
            await pool.end();
        }
        
        // Reset pool reference
        pool = null;
        
        // Wait before reconnecting
        await new Promise(resolve => setTimeout(resolve, RECONNECTION_DELAY_MS));
        
        // Reinitialize pool
        await initializePool();
        
        console.log('✅ Database reconnection successful');
        poolMetrics.reconnectionAttempts = 0; // Reset counter on success
        return true;
        
    } catch (error) {
        console.error(`❌ Reconnection attempt ${poolMetrics.reconnectionAttempts} failed:`, error.message);
        return false;
    }
}

/**
 * Get optimized pool configuration based on environment
 */
function getOptimizedPoolConfig(databaseUrl) {
    const isProduction = process.env.NODE_ENV === 'production';
    const baseConfig = {
        // Connection pool sizing - optimized for typical web application load
        max: isProduction ? 25 : 15, // Maximum connections
        min: isProduction ? 5 : 2,   // Minimum connections to maintain
        
        // Timeout configurations
        idleTimeoutMillis: 60000,     // Close idle clients after 60 seconds
        connectionTimeoutMillis: 15000, // Increased connection timeout
        statement_timeout: 45000,     // Statement timeout
        query_timeout: 45000,         // Query timeout
        
        // Advanced pool settings
        acquireTimeoutMillis: 30000,  // Time to wait for connection from pool
        createTimeoutMillis: 30000,   // Time to wait for new connection creation
        destroyTimeoutMillis: 5000,   // Time to wait for connection destruction
        reapIntervalMillis: 1000,     // How often to check for idle connections
        createRetryIntervalMillis: 200, // Retry interval for failed connections
        
        // Application name for database monitoring
        application_name: `learn2play_${process.env.NODE_ENV || 'development'}_${process.pid}`
    };
    
    if (databaseUrl) {
        return {
            ...baseConfig,
            connectionString: databaseUrl,
            ssl: isProduction && databaseUrl.includes('ssl=true') ? 
                { rejectUnauthorized: false } : false
        };
    } else {
        return {
            ...baseConfig,
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'learn2play',
            user: process.env.DB_USER || 'l2p_user',
            password: process.env.DB_PASSWORD || 'l2p_password',
            ssl: false
        };
    }
}

/**
 * Initialize database connection pool with retries
 * @returns {Promise<Pool>} PostgreSQL connection pool
 */
async function initializePool() {
    if (pool && !pool.ended) {
        return pool;
    }

    console.log('🔄 Initializing database connection pool...');
    
    // Parse DATABASE_URL or use individual components
    const databaseUrl = process.env.DATABASE_URL;
    const poolConfig = getOptimizedPoolConfig(databaseUrl);
    
    console.log('📋 Pool configuration:', {
        max: poolConfig.max,
        min: poolConfig.min,
        host: poolConfig.host || 'from_connection_string',
        database: poolConfig.database || 'from_connection_string',
        application_name: poolConfig.application_name
    });

    pool = new Pool(poolConfig);
    poolMetrics.poolCreatedAt = Date.now();
    poolMetrics.reconnectionAttempts = 0;

    // Test connection with retries
    const maxRetries = 5;
    const retryDelay = 2000;
    
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

    // Enhanced error handling with automatic reconnection
    pool.on('error', async (err, client) => {
        console.error('💥 Unexpected error on database client:', {
            error: err.message,
            code: err.code,
            severity: err.severity,
            detail: err.detail
        });
        
        // Attempt automatic reconnection for connection-related errors
        if (err.code === 'ECONNRESET' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
            console.log('🔄 Connection error detected, attempting automatic reconnection...');
            await attemptReconnection();
        }
    });

    // Connection event listeners for monitoring
    pool.on('connect', (client) => {
        console.log('🔗 New database client connected');
        client.on('error', (err) => {
            console.error('💥 Database client error:', err.message);
        });
    });

    pool.on('acquire', (client) => {
        // Client acquired from pool (optional verbose logging)
        if (process.env.DB_VERBOSE_LOGGING === 'true') {
            console.log('📤 Database client acquired from pool');
        }
    });

    pool.on('remove', (client) => {
        console.log('🗑️  Database client removed from pool');
    });

    // Handle graceful shutdown
    const gracefulShutdown = async (signal) => {
        console.log(`📥 Received ${signal}, initiating graceful database shutdown...`);
        stopPoolMonitoring();
        
        if (pool && !pool.ended) {
            try {
                await pool.end();
                console.log('✅ Database pool closed gracefully');
            } catch (error) {
                console.error('❌ Error closing database pool:', error.message);
            }
        }
        
        process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    // Start monitoring
    startPoolMonitoring();

    return pool;
}

/**
 * Get database connection pool
 * @returns {Pool} PostgreSQL connection pool
 */
function getPool() {
    if (!pool || pool.ended) {
        throw new Error('Database pool not initialized or has been closed. Call initializePool() first.');
    }
    return pool;
}

/**
 * Get current pool metrics
 * @returns {Object} Pool metrics and statistics
 */
function getPoolMetrics() {
    const currentMetrics = { ...poolMetrics };
    
    if (pool && !pool.ended) {
        currentMetrics.poolInfo = {
            totalCount: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount
        };
    }
    
    return currentMetrics;
}

/**
 * Execute a database query with enhanced monitoring
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params = []) {
    const start = Date.now();
    const queryId = Math.random().toString(36).substr(2, 9);
    
    try {
        if (!pool || pool.ended) {
            throw new Error('Database pool not initialized or has been closed. Call initializePool() first.');
        }
        
        poolMetrics.totalQueries++;
        
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        
        // Update query time metrics
        poolMetrics.lastQueryTimes.push(duration);
        if (poolMetrics.lastQueryTimes.length > MAX_QUERY_TIME_SAMPLES) {
            poolMetrics.lastQueryTimes.shift();
        }
        
        // Calculate average query time
        poolMetrics.averageQueryTime = Math.round(
            poolMetrics.lastQueryTimes.reduce((sum, time) => sum + time, 0) / 
            poolMetrics.lastQueryTimes.length
        );
        
        // Log slow queries
        if (duration > 1000) {
            console.warn('🐌 Slow query detected:', {
                queryId,
                duration: duration + 'ms',
                query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                rowCount: res.rowCount
            });
        } else if (process.env.DB_VERBOSE_LOGGING === 'true') {
            console.log('⚡ Query executed:', {
                queryId,
                duration: duration + 'ms',
                query: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                rowCount: res.rowCount
            });
        }
        
        return res;
        
    } catch (error) {
        const duration = Date.now() - start;
        poolMetrics.failedQueries++;
        
        console.error('💥 Database query error:', {
            queryId,
            duration: duration + 'ms',
            query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            params: params.length > 0 ? '[' + params.length + ' params]' : 'none',
            error: error.message,
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            position: error.position,
            constraint: error.constraint
        });
        
        // Attempt reconnection on connection-related errors
        if (error.code === 'ECONNRESET' || error.code === '57P01' || error.code === '08003') {
            console.log('🔄 Connection error in query, attempting reconnection...');
            await attemptReconnection();
        }
        
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
    if (!pool || pool.ended) {
        return false;
    }
    
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT NOW() as current_time');
        if (process.env.DB_VERBOSE_LOGGING === 'true') {
            console.log('✅ Database connection test successful:', result.rows[0].current_time);
        }
        return true;
    } catch (error) {
        console.error('❌ Database connection test failed:', error.message);
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
    testConnection,
    getPoolMetrics,
    logPoolMetrics,
    startPoolMonitoring,
    stopPoolMonitoring
};