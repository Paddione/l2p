// backend/server.js - Fixed version with proper error handling and missing endpoints
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import database connection and initialization
const { initializePool, testConnection, getPoolMetrics } = require('./database/connection');
const { initializeDatabase } = require('./database/init');

// Import routes
const authRoutes = require('./routes/auth');
const hallOfFameRoutes = require('./routes/hallOfFame');
const lobbyRoutes = require('./routes/lobby');
const questionSetsRoutes = require('./routes/questionSets');
const monitoringRoutes = require('./routes/monitoring');

// Import error handling middleware
const { errorHandler, notFoundHandler, AppError } = require('./middleware/errorHandler');
const { checkSQLInjection } = require('./middleware/sqlInjectionProtection');

// Import WebSocket service
const websocketService = require('./services/websocketService');

const app = express();
const port = process.env.PORT || 3000;

// Database readiness flag
let dbReady = false;
let dbInitializationInProgress = false;

async function attemptDbInitializationWithRetry() {
    if (dbInitializationInProgress) return dbReady;
    dbInitializationInProgress = true;
    try {
        console.log('Attempting database initialization...');
        await initializePool();
        
        // Initialize database schema
        await initializeDatabase();
        
        dbReady = true;
        console.log('✅ Database is now connected and ready.');
        return true;
    } catch (error) {
        dbReady = false;
        console.error('❌ Database initialization failed:', error.message);
        return false;
    } finally {
        dbInitializationInProgress = false;
    }
}

// Middleware to check database readiness
function checkDatabaseReady(req, res, next) {
    if (!dbReady) {
        console.warn(`API request to ${req.method} ${req.path} rejected - database not ready`);
        return res.status(503).json({ 
            error: 'Service temporarily unavailable - database not ready',
            code: 'DATABASE_NOT_READY'
        });
    }
    next();
}

// Configure the Express app
function configureApp() {
    // Configure trust proxy for Docker/Traefik
    app.set('trust proxy', 1);

    // Security middleware
    app.use(helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                fontSrc: ["'self'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                mediaSrc: ["'self'"],
                objectSrc: ["'none'"],
                frameSrc: ["'none'"],
                baseUri: ["'self'"]
            },
        },
    }));

    // CORS middleware with more permissive settings for development
    const corsOptions = {
        origin: process.env.NODE_ENV === 'production' ?
            ['https://game.korczewski.de', 'http://10.0.0.44', 'http://localhost:8080'] :
            ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://10.0.0.44', '*'], // More permissive for dev
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: [
            'Content-Type', 
            'Authorization', 
            'X-Requested-With', 
            'Accept', 
            'Origin', 
            'X-File-Name', 
            'Cache-Control',
            'Content-Length',
            'X-CSRF-Token'
        ],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        maxAge: 600,
        optionsSuccessStatus: 200,
        preflightContinue: false
    };

    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));

    // JSON parsing with error handling
    app.use(express.json({ 
        limit: '10mb',
        verify: (req, res, buf, encoding) => {
            req.rawBody = buf;
        }
    }));
    
    // Handle JSON parsing errors
    app.use((error, req, res, next) => {
        if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_JSON',
                    message: 'Invalid JSON format',
                    recovery: 'Please check your JSON syntax and try again'
                },
                timestamp: new Date().toISOString()
            });
        }
        next(error);
    });
    
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware (only in non-test environment)
    if (process.env.NODE_ENV !== 'test') {
        app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
            next();
        });
    }

    // Rate limiting - More lenient for gameplay
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 2000, // Increased from 1000 to 2000 requests per 15 minutes per IP
        message: { error: 'Too many requests from this IP, please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
        standardHeaders: true,
        legacyHeaders: false,
        validate: false,
        skip: (req) => process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
    });
    app.use('/api/', limiter);

    // SQL injection protection
    app.use('/api/', checkSQLInjection);

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Increased from 50 to 100 auth requests per 15 minutes per IP
        message: { error: 'Too many authentication attempts, please try again later.', code: 'AUTH_RATE_LIMIT_EXCEEDED' },
        standardHeaders: true,
        legacyHeaders: false,
        validate: false,
        skip: (req) => process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
    });
    app.use('/api/auth', authLimiter);

    // Health check endpoint (doesn't require database)
    app.get('/api/health', async (req, res) => {
        let dbConnectedStatus = false;
        try {
            if (dbReady) {
                dbConnectedStatus = await testConnection();
                if (!dbConnectedStatus) {
                    dbReady = false;
                    console.warn('DB was marked ready, but testConnection failed. Marking as disconnected.');
                }
            }

            // Get pool metrics for health monitoring
            const poolMetrics = dbConnectedStatus ? getPoolMetrics() : null;
            
            const healthPayload = {
                status: dbConnectedStatus ? 'OK' : 'DEGRADED',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                database: dbConnectedStatus ? 'connected' : 'disconnected',
                uptime: Math.floor(process.uptime()),
                port: port,
                poolMetrics: poolMetrics ? {
                    totalConnections: poolMetrics.totalConnections,
                    activeConnections: poolMetrics.activeConnections,
                    idleConnections: poolMetrics.idleConnections,
                    waitingRequests: poolMetrics.waitingRequests,
                    totalQueries: poolMetrics.totalQueries,
                    failedQueries: poolMetrics.failedQueries,
                    averageQueryTime: poolMetrics.averageQueryTime,
                    healthCheckFailures: poolMetrics.healthCheckFailures,
                    reconnectionAttempts: poolMetrics.reconnectionAttempts
                } : null
            };

            if (dbConnectedStatus) {
                res.status(200).json(healthPayload);
            } else {
                console.warn(`Health check reporting DEGRADED: DB disconnected. DBReady: ${dbReady}`);
                res.status(503).json(healthPayload);
            }
        } catch (error) {
            console.error('Critical error in health check:', error);
            res.status(503).json({
                status: 'ERROR',
                timestamp: new Date().toISOString(),
                error: 'Service unavailable due to health check error',
                database: 'unknown'
            });
        }
    });

    // Ready endpoint (simpler than health, just checks database readiness)
    app.get('/api/ready', (req, res) => {
        try {
            if (dbReady) {
                res.status(200).json({
                    status: 'ready',
                    timestamp: new Date().toISOString(),
                    database: 'ready'
                });
            } else {
                res.status(503).json({
                    status: 'not_ready',
                    timestamp: new Date().toISOString(),
                    database: 'not_ready'
                });
            }
        } catch (error) {
            console.error('Error in ready check:', error);
            res.status(503).json({
                status: 'error',
                timestamp: new Date().toISOString(),
                error: 'Ready check failed'
            });
        }
    });

    // Monitoring routes (no database readiness check for system monitoring)
    app.use('/api/monitoring', monitoringRoutes);

    // Apply database readiness check to all API routes except health, ready, and monitoring
    app.use('/api', (req, res, next) => {
        if (req.path === '/health' || req.path === '/ready' || req.path.startsWith('/monitoring')) {
            return next();
        }
        checkDatabaseReady(req, res, next);
    });

    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/hall-of-fame', hallOfFameRoutes);
    app.use('/api/lobbies', lobbyRoutes);
    app.use('/api/question-sets', questionSetsRoutes);

    // Development mode endpoint
    app.get('/api/development-mode', (req, res) => {
        const isDevelopmentMode = process.env.DEVELOPMENT_MODE === 'true';
        res.json({
            developmentMode: isDevelopmentMode,
            nodeEnv: process.env.NODE_ENV || 'development'
        });
    });

    // API documentation endpoint
    app.get('/api', (req, res) => {
        res.json({
                name: 'Learn2Play API',
    version: '1.0.0',
    description: 'Backend API for Learn2Play multiplayer quiz game',
            endpoints: {
                auth: {
                    'POST /auth/register': 'Register a new user',
                    'POST /auth/login': 'Login user',
                    'POST /auth/logout': 'Logout user',
                    'GET /auth/me': 'Get current user info',
                    'POST /auth/refresh': 'Refresh access token'
                },
                hallOfFame: {
                    'GET /hall-of-fame': 'Get hall of fame entries',
                    'POST /hall-of-fame': 'Add hall of fame entry',
                    'GET /hall-of-fame/stats/:catalog': 'Get catalog statistics',
                    'GET /hall-of-fame/leaderboard/:catalog': 'Get catalog leaderboard'
                },
                lobbies: {
                    'POST /lobbies/create': 'Create a new lobby',
                    'GET /lobbies/list': 'Get active lobbies',
                    'GET /lobbies/:code': 'Get lobby details',
                    'POST /lobbies/:code/join': 'Join a lobby',
                    'POST /lobbies/:code/leave': 'Leave a lobby',
                    'POST /lobbies/:code/ready': 'Update ready status'
                },
                questionSets: {
                    'GET /question-sets/list': 'Get all question sets',
                    'GET /question-sets/:id': 'Get a specific question set',
                    'POST /question-sets': 'Create a new question set',
                    'PUT /question-sets/:id': 'Update a question set',
                    'DELETE /question-sets/:id': 'Delete a question set'
                },
                monitoring: {
                    'GET /monitoring/db-metrics': 'Get database connection pool metrics',
                    'GET /monitoring/status': 'Get comprehensive system status',
                    'GET /health': 'Get health check with pool metrics',
                    'GET /ready': 'Get readiness status'
                }
            },
            status: 'running',
            timestamp: new Date().toISOString()
        });
    });

    // 404 handler for undefined API routes
    app.use('/api/*', notFoundHandler);

    // Global error handler (must be last middleware)
    app.use(errorHandler);

    return app;
}

// Initialize server
async function startServer() {
    try {
        console.log('🚀 Starting Learn2Play API server...');
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔌 Port: ${port}`);

        // Initialize database BEFORE configuring app
        if (process.env.NODE_ENV !== 'test') {
            console.log('🔄 Initializing database...');
            const dbInitialized = await attemptDbInitializationWithRetry();
            if (!dbInitialized) {
                console.error('❌ Failed to initialize database. Server will start but API requests will be rejected until database is ready.');
            }
        }

        configureApp();

        // Start server
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`🚀 Learn2Play API server running on port ${port}`);
            console.log(`🏥 Health check: http://localhost:${port}/api/health`);
            console.log(`📖 API docs: http://localhost:${port}/api`);
            console.log('✅ Server startup complete, application layer is up.');
        });

        // Initialize WebSocket service
        websocketService.initialize(server);
        console.log('🔌 WebSocket service integrated with server');

        server.timeout = 30000;

        // Graceful shutdown
        const shutdown = (signal) => {
            console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
            server.close(() => {
                console.log('✅ Server closed.');
                process.exit(0);
            });
        };
        
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        return server;

    } catch (error) {
        console.error('❌ Failed to setup server:', error);
        process.exit(1);
    }
}

// Enhanced error handling
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Configure app for tests
if (process.env.NODE_ENV === 'test') {
    configureApp();
}

// Only start server if this file is run directly (not imported)
if (require.main === module) {
    startServer();
}

module.exports = app;