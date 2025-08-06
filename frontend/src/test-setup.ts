/**
 * Test setup for Vite compatibility
 * This file runs before setupTests.ts and handles Vite-specific mocking
 */

// Mock import.meta.env for Vite
const mockEnv = {
  VITE_API_URL: 'http://localhost:3001/api',
  VITE_SOCKET_URL: 'http://localhost:3001',
  VITE_APP_TITLE: 'Learn2Play',
  VITE_APP_VERSION: '1.0.0',
  VITE_APP_ENVIRONMENT: 'test',
  VITE_GEMINI_API_KEY: 'test-api-key',
  VITE_AZURE_CONNECTION_STRING: 'test-connection-string',
  VITE_CHROMA_URL: 'http://localhost:8000',
  VITE_CHROMA_COLLECTION: 'test-collection',
  VITE_CHROMA_API_KEY: 'test-chroma-key',
  VITE_APP_DEBUG: 'true',
  VITE_APP_LOG_LEVEL: 'debug',
  VITE_APP_FEATURE_FLAGS: '{}',
  VITE_APP_CONFIG: '{}',
  MODE: 'test',
  DEV: false,
  PROD: false,
  SSR: false
};

// Mock import.meta for both global and window contexts
const importMeta = {
  env: mockEnv,
  url: 'http://localhost:3000',
  hot: undefined,
  glob: jest.fn()
};

// Set up import.meta mock for different contexts
if (typeof globalThis !== 'undefined') {
  Object.defineProperty(globalThis, 'import', {
    value: { meta: importMeta },
    writable: true,
    configurable: true
  });
}

if (typeof global !== 'undefined') {
  Object.defineProperty(global, 'import', {
    value: { meta: importMeta },
    writable: true,
    configurable: true
  });
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'import', {
    value: { meta: importMeta },
    writable: true,
    configurable: true
  });
}

// Mock Vite's dynamic imports
Object.defineProperty(globalThis, '__vite__', {
  value: {
    injectQuery: jest.fn(),
    createHotContext: jest.fn(),
    updateStyle: jest.fn(),
    removeStyle: jest.fn()
  },
  writable: true,
  configurable: true
});

// Mock CSS modules
jest.mock('*.module.css', () => ({}), { virtual: true });
jest.mock('*.module.scss', () => ({}), { virtual: true });
jest.mock('*.module.sass', () => ({}), { virtual: true });
jest.mock('*.module.less', () => ({}), { virtual: true });

// Mock asset imports
jest.mock('*.svg', () => 'test-file-stub', { virtual: true });
jest.mock('*.png', () => 'test-file-stub', { virtual: true });
jest.mock('*.jpg', () => 'test-file-stub', { virtual: true });
jest.mock('*.jpeg', () => 'test-file-stub', { virtual: true });
jest.mock('*.gif', () => 'test-file-stub', { virtual: true });
jest.mock('*.webp', () => 'test-file-stub', { virtual: true });
jest.mock('*.mp3', () => 'test-file-stub', { virtual: true });
jest.mock('*.wav', () => 'test-file-stub', { virtual: true });
jest.mock('*.mp4', () => 'test-file-stub', { virtual: true });
jest.mock('*.webm', () => 'test-file-stub', { virtual: true });

// Mock Vite's HMR API
if (typeof window !== 'undefined') {
  (window as any).__vite_plugin_react_preamble_installed__ = true;
}

export {};