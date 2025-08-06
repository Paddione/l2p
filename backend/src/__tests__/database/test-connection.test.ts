import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Pool } from 'pg';

// Test database connection using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

describe('Test Database Configuration', () => {
  beforeAll(async () => {
    // Verify we're using the test database
    console.log('Testing database connection with URL:', process.env.DATABASE_URL);
    expect(process.env.DATABASE_URL).toContain('test');
  });

  afterAll(async () => {
    await pool.end();
  });

  test('should connect to PostgreSQL test database', async () => {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() as current_time');
      expect(result.rows[0]).toHaveProperty('current_time');
      console.log('Successfully connected to test database at:', result.rows[0].current_time);
    } finally {
      client.release();
    }
  });

  test('should use test database name', async () => {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT current_database() as db_name');
      expect(result.rows[0].db_name).toContain('test');
      console.log('Connected to database:', result.rows[0].db_name);
    } finally {
      client.release();
    }
  });

  test('should load configuration from .env files', () => {
    expect(process.env.DB_NAME).toBe('learn2play_test');
    expect(process.env.DB_HOST).toBe('localhost');
    expect(process.env.DB_PORT).toBe('5432');
    expect(process.env.DATABASE_URL).toContain('postgresql://');
  });
});
