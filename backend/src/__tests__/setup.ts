import { TestUtilities } from '../../../shared/test-config/dist/cjs/TestUtilities.js';
import { TestExecutionContext } from '../../../shared/test-config/dist/cjs/types.js';
import { Server } from 'http';
import express from 'express';

export interface TestEnvironment {
  app: express.Application;
  server: Server;
}

// Get test context from global setup
let testContext: TestExecutionContext | undefined;

// Set up environment variables for tests
function setupTestEnvironmentVariables() {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test_user:test_pass@localhost:5433/test_db';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_testing_only_not_secure';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_for_testing_only_not_secure';
  process.env.CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8001';
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test_api_key';
  process.env.EMAIL_HOST = process.env.EMAIL_HOST || 'localhost';
  process.env.EMAIL_PORT = process.env.EMAIL_PORT || '587';
  process.env.EMAIL_USER = process.env.EMAIL_USER || 'test@example.com';
  process.env.EMAIL_PASS = process.env.EMAIL_PASS || 'test_password';
}

// Global test setup
global.beforeAll(async () => {
  try {
    // Set up environment variables first
    setupTestEnvironmentVariables();
    
    // Get context from global setup or initialize if not available
    testContext = (global as any).__TEST_CONTEXT__;
    
    if (!testContext) {
      try {
        testContext = await TestUtilities.initializeTestEnvironment();
      } catch (error) {
        // Continue without test context for unit tests
        console.warn('Could not initialize test context, using fallback configuration');
      }
    }
    
    // Setup database if needed for this test type
    if (testContext) {
      try {
        await TestUtilities.setupTestDatabase(testContext);
      } catch (error) {
        // Ignore database setup errors for unit tests
        if (testContext.test_type !== 'unit') {
          console.warn('Database setup failed:', error);
        }
      }
    }
    
    if (testContext) {
      console.log(`Test setup complete for ${testContext.environment}/${testContext.test_type}`);
    } else {
      console.log('Test setup complete with fallback configuration');
    }
  } catch (error) {
    console.error('Test setup failed:', error);
    // Ensure environment variables are set even if setup fails
    setupTestEnvironmentVariables();
  }
});

// Global test teardown
global.afterAll(async () => {
  try {
    if (testContext) {
      await TestUtilities.cleanupTestEnvironment(testContext);
    }
  } catch (error) {
    console.warn('Test teardown warning:', error);
  }
});

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
global.beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

global.afterEach(() => {
  jest.restoreAllMocks();
});

// Set timeout from configuration
const timeout = testContext?.test_type_config?.timeout || 10000;
jest.setTimeout(timeout);

// Suppress console warnings during tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  // Suppress specific warnings that are expected in test environment
  if (typeof args[0] === 'string' && (args[0].includes('Invalid DATABASE_URL') || 
      args[0].includes('Database connection test failed'))) {
    return;
  }
  originalWarn(...args);
};

// Suppress console errors during tests
const originalError = console.error;
console.error = (...args: any[]) => {
  // Suppress specific errors that are expected in test environment
  if (args[0] && typeof args[0] === 'string' && (args[0].includes('Database connection test failed') ||
      args[0].includes('ECONNREFUSED'))) {
    return;
  }
  originalError(...args);
};

// Mock external services for unit tests
jest.mock('../services/DatabaseService.js', () => ({
  DatabaseService: {
    reset: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue({ rows: [] }),
    getClient: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn()
    })
  }
}));

// ChromaService mock removed - no longer needed

jest.mock('../services/GeminiService.js', () => ({
  GeminiService: {
    getInstance: jest.fn().mockReturnValue({
      generateQuestions: jest.fn().mockResolvedValue({
        questions: [],
        metadata: {}
      })
    })
  }
}));

export async function setupTestEnvironment(): Promise<TestEnvironment> {
  // Import the app directly
  const { app } = await import('../server.js');
  
  // Create a test server
  const server = app.listen(0); // Use port 0 to get a random available port
  
  return { app, server };
}

export async function cleanupTestEnvironment(server: Server): Promise<void> {
  return new Promise((resolve) => {
    if (server && server.close) {
      server.close(() => {
        resolve();
      });
    } else {
      resolve();
    }
  });
} 