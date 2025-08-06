// Test setup file for Jest
import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test_db';
process.env.DB_USER = 'test';
process.env.POSTGRES_PASSWORD = 'test';
process.env.DB_SSL = 'false';
process.env.GEMINI_API_KEY = 'test_key';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test_password';

// Global test timeout
jest.setTimeout(10000);

// Suppress console warnings during tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  // Suppress specific warnings that are expected in test environment
  if (args[0]?.includes('Invalid DATABASE_URL') || 
      args[0]?.includes('Database connection test failed')) {
    return;
  }
  originalWarn(...args);
};

// Suppress console errors during tests
const originalError = console.error;
console.error = (...args: any[]) => {
  // Suppress specific errors that are expected in test environment
  if (args[0]?.includes('Database connection test failed') ||
      args[0]?.includes('ECONNREFUSED')) {
    return;
  }
  originalError(...args);
}; 