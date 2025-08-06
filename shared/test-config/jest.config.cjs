module.exports = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  
  // Test file patterns - exclude Playwright tests
  testMatch: [
    '**/__tests__/**/*.{test,spec}.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Ignore Playwright and e2e test files
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/e2e/',
    '**/*.e2e.{js,ts}',
    '**/*.playwright.{js,ts}',
    '**/playwright.config.*',
    '**/test-results/',
    '**/playwright-report/'
  ],
  
  // Transform configuration for ES modules and TypeScript
  transform: {
    '^.+\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        target: 'ES2022',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true
      }
    }]
  },
  
  // Module name mapping for shared modules and path aliases
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
    '^@test-config/(.*)$': '<rootDir>/../shared/test-config/$1'
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!jest.config.cjs'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Test timeout and performance
  testTimeout: 15000,
  verbose: true,
  
  // Global configuration
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};