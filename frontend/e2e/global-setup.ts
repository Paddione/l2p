import { chromium, FullConfig } from '@playwright/test';
import { TestEnvironment } from '../../shared/test-config/dist/TestEnvironment.js';

/**
 * Global setup for Playwright tests
 * Ensures test environment is ready before running tests
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  // Initialize test environment if not in CI
  if (!process.env.CI) {
    try {
      const testEnv = new TestEnvironment();
      await testEnv.start();
      console.log('✅ Test environment started successfully');
    } catch (error) {
      console.error('❌ Failed to start test environment:', error);
      throw error;
    }
  }

  // Create a browser instance for setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for application to be available
    const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
    console.log(`🔍 Checking application availability at ${baseURL}`);
    
    let retries = 0;
    const maxRetries = 30;
    
    while (retries < maxRetries) {
      try {
        const response = await page.goto(baseURL, { 
          waitUntil: 'networkidle',
          timeout: 10000 
        });
        
        if (response?.ok()) {
          console.log('✅ Application is available');
          break;
        }
      } catch (error) {
        retries++;
        if (retries === maxRetries) {
          throw new Error(`Application not available after ${maxRetries} attempts: ${error}`);
        }
        console.log(`⏳ Waiting for application... (attempt ${retries}/${maxRetries})`);
        await page.waitForTimeout(2000);
      }
    }

    // Verify backend connectivity
    try {
      const apiResponse = await page.request.get('/api/health');
      if (!apiResponse.ok()) {
        throw new Error(`Backend health check failed: ${apiResponse.status()}`);
      }
      console.log('✅ Backend connectivity verified');
    } catch (error) {
      console.warn('⚠️ Backend health check failed, tests may be unstable:', error);
    }

    // Create test data directory
    const fs = require('fs');
    const path = require('path');
    
    const testDataDir = path.join(__dirname, 'test-data');
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
      console.log('📁 Created test data directory');
    }

    // Clean up any existing test data
    await cleanupTestData(page);
    
    console.log('✅ Global setup completed successfully');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Clean up any existing test data from previous runs
 */
async function cleanupTestData(page: any) {
  try {
    // Clear browser storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear IndexedDB if present
      if ('indexedDB' in window) {
        indexedDB.databases?.().then(databases => {
          databases.forEach(db => {
            if (db.name?.startsWith('test_')) {
              indexedDB.deleteDatabase(db.name);
            }
          });
        });
      }
    });

    // Clear cookies
    const context = page.context();
    await context.clearCookies();

    console.log('🧹 Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️ Test data cleanup failed:', error);
  }
}

export default globalSetup;