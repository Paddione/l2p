import { Request, Response, NextFunction } from 'express';
import { RequestLogger as CentralLogger } from 'shared/error-handling/index';

export interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  statusCode?: number;
  responseTime?: number;
  ip: string;
  userAgent?: string | undefined;
  userId?: number | undefined;
  error?: string;
}

export class RequestLogger {
  private static centralLogger = CentralLogger.getInstance();
  /**
   * Request logging middleware
   */
  static log = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    // Log request start
    const logEntry: LogEntry = {
      timestamp,
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId
    };

    // Log request start using central logger
    RequestLogger.centralLogger.logInfo('HTTP Request', {
      method: req.method,
      url: req.url,
      ip: logEntry.ip,
      userAgent: logEntry.userAgent,
      userId: logEntry.userId
    });

    // Override res.end to capture response details
    const originalEnd = res.end.bind(res);
    res.end = function(chunk?: any, encoding?: any, cb?: () => void) {
      const responseTime = Date.now() - startTime;
      
      // Complete log entry
      const completeLogEntry: LogEntry = {
        ...logEntry,
        statusCode: res.statusCode,
        responseTime
      };

      // Log response using central logger
      const logMethod = res.statusCode >= 400 ? 'logWarn' : 'logInfo';
      RequestLogger.centralLogger[logMethod]('HTTP Response', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime,
        ip: logEntry.ip,
        userId: logEntry.userId
      });

      // Log slow requests (> 1 second)
      if (responseTime > 1000) {
        RequestLogger.centralLogger.logWarn('Slow HTTP Request', {
          method: req.method,
          url: req.url,
          responseTime,
          statusCode: res.statusCode
        });
      }

      // Call original end method
      return originalEnd(chunk, encoding, cb);
    };

    next();
  };

  /**
   * Error logging middleware
   */
  static logError = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId,
      error: err.message
    };

    // Log error using central logger
    RequestLogger.centralLogger.logError({
      code: 'HTTP_ERROR',
      message: err.message,
      context: {
        timestamp: logEntry.timestamp,
        environment: process.env.NODE_ENV || 'development',
        service: 'backend-api',
        method: req.method,
        url: req.url,
        ip: logEntry.ip,
        userId: logEntry.userId,
        userAgent: logEntry.userAgent
      },
      severity: 'medium',
      category: 'network',
      recoverable: true,
      retryable: false,
      stack: err.stack
    });

    next(err);
  };

  /**
   * Socket.IO connection logging
   */
  static logSocketConnection = (socketId: string, event: 'connect' | 'disconnect', userId?: number): void => {
    const emoji = event === 'connect' ? '🔌' : '🔌❌';
    RequestLogger.centralLogger.logInfo(`Socket ${event}`, {
      socketId,
      userId,
      event
    });
  };

  /**
   * Socket.IO event logging
   */
  static logSocketEvent = (socketId: string, event: string, data?: any, userId?: number): void => {
    RequestLogger.centralLogger.logInfo('Socket Event', {
      socketId,
      event,
      userId,
      dataSize: data ? JSON.stringify(data).length : 0
    });
  };

  /**
   * Database query logging
   */
  static logDatabaseQuery = (query: string, params?: any[], duration?: number): void => {
    RequestLogger.centralLogger.logDebug('Database Query', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      paramCount: params?.length || 0,
      duration
    });
  };

  /**
   * Authentication event logging
   */
  static logAuthEvent = (event: 'login' | 'logout' | 'register' | 'token_refresh', userId?: number, ip?: string): void => {
    const emoji = {
      login: '🔐',
      logout: '🔓',
      register: '👤',
      token_refresh: '🔄'
    }[event];

    RequestLogger.centralLogger.logInfo('Auth Event', {
      event,
      userId,
      ip
    });
  };

  /**
   * Game event logging
   */
  static logGameEvent = (event: string, lobbyCode?: string, userId?: number, data?: any): void => {
    RequestLogger.centralLogger.logInfo('Game Event', {
      event,
      lobbyCode,
      userId,
      dataSize: data ? JSON.stringify(data).length : 0
    });
  };
}

// Export convenience functions
export const requestLogger = RequestLogger.log;
export const errorLogger = RequestLogger.logError;
export const logSocketConnection = RequestLogger.logSocketConnection;
export const logSocketEvent = RequestLogger.logSocketEvent;
export const logDatabaseQuery = RequestLogger.logDatabaseQuery;
export const logAuthEvent = RequestLogger.logAuthEvent;
export const logGameEvent = RequestLogger.logGameEvent;