// Test setup file for Jest
import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';

// Import dotenv to load environment variables from .env files
// This needs to be done before any other imports that might use environment variables
import dotenv from 'dotenv';

// Load environment variables from .env.test first, then .env as fallback
dotenv.config({ path: ['.env.test', '.env'] });

// Ensure test database configuration is used
const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL?.replace('/learn2play', '/learn2play_test') || 'postgresql://l2p_user:P/o09KBVVkgN52Hr8hxV7VoyNAHdb3lXLEgyepGdD/o=@localhost:5432/learn2play_test';

// Override process.env with test-specific values
process.env.DATABASE_URL = testDatabaseUrl;
process.env.DB_NAME = 'learn2play_test';
process.env.DB_SSL = 'false'; // Disable SSL for local testing

// Ensure other test environment variables are set
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test_key';
process.env.SMTP_HOST = process.env.SMTP_HOST || 'smtp.test.com';
process.env.SMTP_PORT = process.env.SMTP_PORT || '587';
process.env.SMTP_USER = process.env.SMTP_USER || 'test@test.com';
process.env.SMTP_PASS = process.env.SMTP_PASS || 'test_password';

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