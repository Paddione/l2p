// Central exports for error handling and logging system
export { CentralizedErrorHandler, errorHandler } from './ErrorHandler.js';
export { RequestLogger } from './Logger.js';
export { HealthMonitor, healthMonitor } from './HealthMonitor.js';
export { NotificationService, notificationService } from './NotificationService.js';

// Import instances for internal use
import { RequestLogger } from './Logger.js';
import { healthMonitor } from './HealthMonitor.js';

// Type exports
export type { 
  ErrorContext, 
  ErrorDetails, 
  RecoveryStrategy 
} from './ErrorHandler.js';

export type { 
  LogEntry, 
  LoggerConfig 
} from './Logger.js';

export type { 
  HealthCheck, 
  HealthCheckResult, 
  SystemHealth, 
  SystemMetrics, 
  AlertRule 
} from './HealthMonitor.js';

export type { 
  NotificationChannel, 
  NotificationMessage, 
  NotificationTemplate 
} from './NotificationService.js';

// Convenience function to initialize the entire error handling system
export async function initializeErrorHandling(config?: {
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  enableFileLogging?: boolean;
  enableRemoteLogging?: boolean;
  enableHealthMonitoring?: boolean;
  enableNotifications?: boolean;
}): Promise<void> {
  const {
    logLevel = 'info',
    enableFileLogging = false,
    enableRemoteLogging = false,
    enableHealthMonitoring = true,
    enableNotifications = true
  } = config || {};

  // Initialize logger with configuration
  const logger = RequestLogger.getInstance({
    level: logLevel,
    enableFile: enableFileLogging,
    enableRemote: enableRemoteLogging
  });

  await logger.logInfo('Initializing error handling system', {
    logLevel,
    enableFileLogging,
    enableRemoteLogging,
    enableHealthMonitoring,
    enableNotifications
  });

  // Start health monitoring if enabled
  if (enableHealthMonitoring) {
    await healthMonitor.startMonitoring();
    await logger.logInfo('Health monitoring started');
  }

  // Initialize notification service if enabled
  if (enableNotifications) {
    // Notification service is initialized automatically
    await logger.logInfo('Notification service initialized');
  }

  await logger.logInfo('Error handling system initialized successfully');
}

// Convenience function for graceful shutdown
export async function shutdownErrorHandling(): Promise<void> {
  const logger = RequestLogger.getInstance();
  
  await logger.logInfo('Shutting down error handling system');
  
  // Stop health monitoring
  await healthMonitor.stopMonitoring();
  
  await logger.logInfo('Error handling system shutdown complete');
}