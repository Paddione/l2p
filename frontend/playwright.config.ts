import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import os from 'os';

/**
 * Enhanced Playwright configuration for better reliability and performance
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e/tests',
  
  /* Output directories */
  outputDir: './e2e/test-results',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry configuration with exponential backoff */
  retries: process.env.CI ? 3 : 1,
  
  /* Worker configuration for optimal performance */
  workers: process.env.CI ? 2 : Math.max(1, Math.floor(os.cpus().length / 2)),
  
  /* Enhanced reporter configuration */
  reporter: [
    ['html', { 
      outputFolder: './e2e/playwright-report',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    ['json', { outputFile: './e2e/test-results.json' }],
    ['junit', { outputFile: './e2e/test-results.xml' }],
    ['line'],
    ...(process.env.CI ? [['github']] : [])
  ],
  
  /* Global test configuration */
  use: {
    /* Base URL with fallback */
    baseURL: process.env.BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    /* Enhanced tracing */
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
    
    /* Screenshot configuration */
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true
    },
    
    /* Video recording with compression */
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 }
    },
    
    /* Timeout configurations */
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    /* Browser context options */
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    /* Locale and timezone */
    locale: 'en-US',
    timezoneId: 'America/New_York',
    
    /* Performance optimizations */
    launchOptions: {
      args: [
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-background-timer-throttling',
        '--force-color-profile=srgb',
        '--disable-dev-shm-usage',
        '--no-sandbox'
      ]
    }
  },

  /* Test environment setup */
  // globalSetup: './e2e/global-setup.ts',
  // globalTeardown: './e2e/global-teardown.ts',

  /* Configure projects for comprehensive testing */
  projects: [
    /* Setup project */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: undefined // Don't use storage state for setup
      }
    },

    /* Desktop browsers */
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome'
      },
      dependencies: ['setup']
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup']
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup']
    },

    /* Mobile devices */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup']
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup']
    },

    /* Tablet */
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] },
      dependencies: ['setup']
    },

    /* Accessibility testing project */
    {
      name: 'accessibility',
      testMatch: /.*accessibility.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        // Enable accessibility tree snapshots
        launchOptions: {
          args: ['--force-renderer-accessibility']
        }
      },
      dependencies: ['setup']
    },

    /* Performance testing project */
    {
      name: 'performance',
      testMatch: /.*performance.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        // Performance testing specific options
        launchOptions: {
          args: ['--enable-precise-memory-info']
        }
      },
      dependencies: ['setup']
    }
  ],

  /* Global timeouts */
  timeout: process.env.CI ? 90000 : 60000,
  expect: {
    timeout: 15000,
    toHaveScreenshot: { 
      threshold: 0.2,
      maxDiffPixels: 1000
    },
    toMatchSnapshot: { 
      threshold: 0.2 
    }
  },

  /* Web server configuration for local development */
  webServer: process.env.CI ? undefined : {
    command: 'echo "Using existing test environment"',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 5000,
    stdout: 'pipe',
    stderr: 'pipe'
  },

  /* Test metadata */
  metadata: {
    'test-environment': process.env.NODE_ENV || 'test',
    'base-url': process.env.BASE_URL || 'http://localhost:3000',
    'ci': !!process.env.CI
  }
}); 