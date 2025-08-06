// Auto-generated test configuration - Updated by TestRunnerConfigUpdater
// Last updated: 2025-08-06T03:31:40.722Z
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
  coverageConfig = coverageManager.getFrontendJestConfig();
} catch (error) {
  console.error('Failed to load test configuration:', error.message);
  // Fallback to basic configuration
  context = {
    test_type_config: {
      timeout: 10000,
      verbose: false,
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
          '**/*.test.tsx',
          '**/*.spec.ts',
          '**/*.spec.tsx',
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
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/main.tsx',
      '!src/setupTests.ts',
      '!src/**/*.test.{ts,tsx}',
      '!src/**/*.spec.{ts,tsx}'
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
      '.*\.test\.ts$',
      '.*\.test\.tsx$',
      '.*\.spec\.ts$',
      '.*\.spec\.tsx$',
      '/node_modules/',
      '/dist/',
      '/coverage/'
    ]
  };
}

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@frontend/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.module\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/__mocks__/fileMock.js'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020',
        lib: ['ES2020', 'DOM', 'DOM.Iterable', 'WebAudio'],
        module: 'CommonJS',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        jsx: 'react-jsx',
        strict: false,
        skipLibCheck: true,
        isolatedModules: true,
        resolveJsonModule: true,
        allowJs: true
      },
      useESM: false,
      esModuleInterop: true,
      isolatedModules: true
    }],
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-dropzone|react-router-dom|zustand|@testing-library)/)'
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/__tests__/e2e/',
    '<rootDir>/e2e/',
    '<rootDir>/playwright-report/',
    '<rootDir>/test-results/',
    '\\.e2e\\.(ts|js)$',
    '\\.playwright\\.(ts|js)$'
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
  // Handle import.meta.env and Vite-specific features
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
    url: 'http://localhost:3000'
  },
  // Mock Vite's import.meta.env
  setupFiles: ['<rootDir>/src/test-setup.ts']
}; 