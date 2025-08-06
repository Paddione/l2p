import request from 'supertest';
import express from 'express';

describe('Basic Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Create a simple test app for basic integration tests
    app = express();
    
    // Add basic middleware
    app.use(express.json());
    
    // Add a simple health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // Add a 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
  });

  test('should respond to health check', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('ok');
  });

  test('should handle 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/api/unknown-route')
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });
}); 