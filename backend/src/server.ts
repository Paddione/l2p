import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { db } from './services/DatabaseService.js';
import { migrationService } from './services/MigrationService.js';
import { SocketService } from './services/SocketService.js';
import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';
import lobbyRoutes from './routes/lobbies.js';
import questionRoutes from './routes/questions.js';
import questionManagementRoutes from './routes/question-management.js';
import scoringRoutes from './routes/scoring.js';
import hallOfFameRoutes from './routes/hall-of-fame.js';
import characterRoutes from './routes/characters.js';
import fileUploadRoutes from './routes/file-upload.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger, errorLogger } from './middleware/logging.js';
import { sanitize } from './middleware/validation.js';
import { initializeErrorHandling } from '../../shared/error-handling/index.js';
import { initializeBackendHealthChecks } from './health/index.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Export app for testing
export { app };

// CORS configuration with subdomain support
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    // Get allowed origins from environment
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const corsOrigin = process.env.CORS_ORIGIN;

    // Create allowlist of origins
    const allowedOrigins = [frontendUrl];

    // Add CORS_ORIGIN if specified
    if (corsOrigin) {
      allowedOrigins.push(corsOrigin);
    }

    // Always allow localhost for development
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173');
    }

    console.log(`CORS check - Origin: ${origin}, Allowed origins: ${JSON.stringify(allowedOrigins)}`);

    // Check exact matches first
    if (allowedOrigins.includes(origin)) {
      console.log(`CORS allowed - exact match: ${origin}`);
      return callback(null, true);
    }

    // Allow localhost and 127.0.0.1 in development
    if (process.env.NODE_ENV === 'development') {
      try {
        const originUrl = new URL(origin);
        if (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') {
          console.log(`CORS allowed - localhost: ${origin}`);
          return callback(null, true);
        }
      } catch (e) {
        // Invalid origin URL, continue with other checks
      }
    }

    // Extract domain from frontendUrl for subdomain validation
    let allowedDomain: string | null = null;
    try {
      const url = new URL(frontendUrl);
      // Extract the domain (e.g., "korczewski.de" from "https://l2p.korczewski.de")
      const hostParts = url.hostname.split('.');
      if (hostParts.length >= 2) {
        allowedDomain = hostParts.slice(-2).join('.');
      }
    } catch (e) {
      // Invalid URL, skip subdomain validation
    }

    // Check subdomain validation if we have an allowed domain
    if (allowedDomain) {
      try {
        const originUrl = new URL(origin);
        // Check if origin is a subdomain of the allowed domain
        if (originUrl.hostname.endsWith('.' + allowedDomain) || originUrl.hostname === allowedDomain) {
          console.log(`CORS allowed - subdomain match: ${origin} for domain ${allowedDomain}`);
          return callback(null, true);
        }
      } catch (e) {
        // Invalid origin URL
        console.log(`CORS rejected - invalid origin URL: ${origin}`);
        return callback(new Error('Not allowed by CORS - Invalid origin'), false);
      }
    }

    // For production, allow same-origin requests (when frontend and backend are on same domain)
    if (process.env.NODE_ENV === 'production') {
      try {
        const originUrl = new URL(origin);
        const frontendUrlObj = new URL(frontendUrl);
        
        // Allow if same protocol, hostname, and port
        if (originUrl.protocol === frontendUrlObj.protocol && 
            originUrl.hostname === frontendUrlObj.hostname && 
            originUrl.port === frontendUrlObj.port) {
          console.log(`CORS allowed - same origin in production: ${origin}`);
          return callback(null, true);
        }
      } catch (e) {
        // Invalid URL, continue with rejection
      }
    }

    // Origin not allowed
    console.log(`CORS rejected - no match: ${origin}`);
    callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  // Add headers for Private Network Access
  exposedHeaders: ['Access-Control-Allow-Private-Network'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

const io = new Server(server, {
  cors: corsOptions
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors(corsOptions));

// Add Private Network Access headers for Chrome
app.use((req, res, next) => {
  // Handle preflight requests for Private Network Access
  if (req.method === 'OPTIONS' && req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});

// Rate limiting with different limits for different endpoints
// Disable rate limiting in test environment
const generalLimiter = process.env.NODE_ENV === 'test' ? (req: Request, res: Response, next: NextFunction) => next() : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = process.env.NODE_ENV === 'test' ? (req: Request, res: Response, next: NextFunction) => next() : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: {
    error: 'Too Many Authentication Attempts',
    message: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

app.use(generalLimiter);

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging middleware
app.use(requestLogger);

// Input sanitization middleware
app.use(sanitize);

// Error logging middleware
app.use(errorLogger);

// Health check routes (no rate limiting for health checks)
app.use('/api/health', healthRoutes);

// Migration status endpoint under API
app.get('/api/migrations/status', async (req: Request, res: Response) => {
  try {
    const status = await migrationService.getMigrationStatus();
    res.json({
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get migration status',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/lobbies', lobbyRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/question-management', questionManagementRoutes);
app.use('/api/scoring', scoringRoutes);
app.use('/api/hall-of-fame', hallOfFameRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/file-upload', fileUploadRoutes);

// Basic API routes
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    message: 'Learn2Play API is running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database test endpoint
app.get('/api/database/test', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT NOW() as current_time, version() as pg_version');
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Database test failed'
    });
  }
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize Socket.IO service
const socketService = new SocketService(io);

// Initialize database and start server
async function startServer() {
  const PORT = process.env.PORT || 3001;

  try {
    console.log('Initializing error handling system...');
    await initializeErrorHandling({
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
      enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
      enableRemoteLogging: process.env.ENABLE_REMOTE_LOGGING === 'true',
      enableHealthMonitoring: true,
      enableNotifications: process.env.ENABLE_NOTIFICATIONS !== 'false'
    });
    console.log('Error handling system initialized');

    console.log('Initializing backend health checks...');
    await initializeBackendHealthChecks();
    console.log('Backend health checks initialized');

    console.log('Initializing database connection...');
    await db.testConnection();
    console.log('Database connection established successfully');

    console.log('Running database migrations...');
    await migrationService.runMigrations();
    console.log('Database migrations completed');

    console.log('Validating applied migrations...');
    const isValid = await migrationService.validateMigrations();
    if (!isValid) {
      throw new Error('Migration validation failed');
    }
    console.log('Migration validation passed');

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database: ${db.isHealthy() ? 'Connected' : 'Disconnected'}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');

  try {
    await db.close();
    console.log('Database connections closed');

    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');

  try {
    await db.close();
    console.log('Database connections closed');

    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server only if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}