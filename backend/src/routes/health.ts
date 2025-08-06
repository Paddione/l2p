import { Router, Request, Response } from 'express';
import { healthMonitor } from '../../../shared/error-handling/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const health = await healthMonitor.getSystemHealth();
  
  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json({
    status: health.status,
    timestamp: health.timestamp,
    uptime: health.uptime,
    version: health.version,
    environment: health.environment,
    service: 'backend-api'
  });
}));

/**
 * GET /health/detailed
 * Detailed health check with all checks and metrics
 */
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const health = await healthMonitor.getSystemHealth();
  
  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(health);
}));

/**
 * GET /health/ready
 * Readiness probe for Kubernetes/Docker
 */
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  const health = await healthMonitor.getSystemHealth();
  
  // Check if critical services are healthy
  const criticalChecks = Object.entries(health.checks)
    .filter(([name, result]) => {
      // Assume database and disk are critical
      return ['database', 'disk'].includes(name);
    });
  
  const allCriticalHealthy = criticalChecks.every(([, result]) => 
    result.status === 'healthy'
  );
  
  if (allCriticalHealthy) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      failedChecks: criticalChecks
        .filter(([, result]) => result.status !== 'healthy')
        .map(([name, result]) => ({ name, status: result.status, message: result.message }))
    });
  }
}));

/**
 * GET /health/live
 * Liveness probe for Kubernetes/Docker
 */
router.get('/live', asyncHandler(async (req: Request, res: Response) => {
  // Simple liveness check - if we can respond, we're alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime() * 1000 // Convert to milliseconds
  });
}));

export default router;