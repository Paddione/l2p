// Auto-generated test configuration - Updated by TestRunnerConfigUpdater
// Last updated: 2025-08-06T03:31:40.720Z
const { TestConfigManager } = require('../shared/test-config/dist/TestConfigManager');
const { CoverageConfigManager } = require('../shared/test-config/dist/CoverageConfigManager');

// Get test environment and type from environment variables or use defaults
const testEnvironment = process.env.TEST_ENVIRONMENT || 'local';
const testType = process.env.TEST_TYPE || 'unit';

// Initialize configuration managers
const configManager = TestConfigManager.getInstance();
const coverageManager = CoverageConfigManager.getInstance();

let context;
let coverageConfig;

try {
  context = configManager.createExecutionContext(testEnvironment, testType);
  coverageConfig = coverageManager.getBackendJestConfig();
} catch (error) {
  console.error('Failed to load test configuration:', error.message);
  // Fallback to basic configuration
  context = {
    test_type_config: {
      timeout: 10000,
      verbose: true,
      bail: false,
      collect_coverage: true,
      parallel: true,
      max_workers: '50%'
    },
    environment_config: {
      coverage: {
        threshold: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80
        },
        exclude: [
          '**/*.test.ts',
          '**/*.spec.ts',
          '**/node_modules/**',
          '**/dist/**',
          '**/coverage/**'
        ]
      },
      reporting: {
        formats: ['text', 'lcov', 'html'],
        output_dir: 'coverage'
      }
    },
    global_config: {
      clear_mocks: true,
      reset_mocks: true,
      restore_mocks: true
    }
  };
  
  // Fallback coverage config
  coverageConfig = {
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/*.d.ts',
      '!src/server.ts',
      '!src/cli/**/*.ts',
      '!src/**/*.test.ts',
      '!src/**/*.spec.ts'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
    coverageThreshold: {
      global: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    },
    coveragePathIgnorePatterns: [
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**'
    ]
  };
}

module.exports = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/src/__tests__/cli/',
    '<rootDir>/src/__tests__/setup.ts',
    '<rootDir>/src/__tests__/globalSetup.js',
    '<rootDir>/src/__tests__/globalTeardown.js',
    '/node_modules/',
    '/dist/',
    '/e2e/',
    '**/*.e2e.{js,ts}',
    '**/*.playwright.{js,ts}',
    '**/playwright.config.*',
    '**/test-results/',
    '**/playwright-report/'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', { 
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        target: 'ES2022',
        lib: ['ES2022', 'DOM'],
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
        allowImportingTsExtensions: false,
        noImplicitAny: false,
        strict: false,
        skipLibCheck: true,
        resolveJsonModule: true,
        allowJs: true
      }
    }]
  },
  moduleNameMapper: {
    '^(\.{1,2}/.*)\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
    '^@test-config/(.*)$': '<rootDir>/../shared/test-config/$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chromadb|@google/generative-ai)/)',
    '!../shared/error-handling/.*\.js$'
  ],
  // Use unified coverage configuration
  collectCoverageFrom: coverageConfig.collectCoverageFrom,
  coverageDirectory: coverageConfig.coverageDirectory,
  coverageReporters: coverageConfig.coverageReporters,
  coverageThreshold: coverageConfig.coverageThreshold,
  coveragePathIgnorePatterns: coverageConfig.coveragePathIgnorePatterns,
  testTimeout: context.test_type_config.timeout,
  verbose: context.test_type_config.verbose,
  bail: context.test_type_config.bail,
  clearMocks: context.global_config.clear_mocks,
  resetMocks: context.global_config.reset_mocks,
  restoreMocks: context.global_config.restore_mocks,
  maxWorkers: context.test_type_config.parallel ? context.test_type_config.max_workers : 1,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  globalSetup: '<rootDir>/src/__tests__/globalSetup.js',
  globalTeardown: '<rootDir>/src/__tests__/globalTeardown.js'
};