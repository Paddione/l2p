import { healthMonitor } from 'shared/error-handling/index';
import { databaseHealthCheck } from './DatabaseHealthCheck.js';

/**
 * Initialize backend-specific health checks
 */
export async function initializeBackendHealthChecks(): Promise<void> {
  // Register database health check
  healthMonitor.registerHealthCheck(databaseHealthCheck);

  // Register backend-specific alert rules
  healthMonitor.registerAlertRule({
    name: 'database-connection-failed',
    condition: (health: any) => {
      const dbCheck = health.checks['database'];
      return Boolean(dbCheck && dbCheck.status === 'unhealthy');
    },
    severity: 'critical',
    cooldown: 5, // 5 minutes
    channels: ['email', 'slack']
  });

  healthMonitor.registerAlertRule({
    name: 'database-slow-response',
    condition: (health: any) => {
      const dbCheck = health.checks['database'];
      return Boolean(dbCheck && dbCheck.status === 'degraded' && dbCheck.responseTime && dbCheck.responseTime > 2000);
    },
    severity: 'high',
    cooldown: 15, // 15 minutes
    channels: ['slack']
  });
}

export { databaseHealthCheck };