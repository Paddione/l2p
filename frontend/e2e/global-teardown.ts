import { FullConfig } from '@playwright/test';
import { TestEnvironment } from '../../shared/test-config/dist/TestEnvironment.js';

/**
 * Global teardown for Playwright tests
 * Cleans up test environment after all tests complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');

  try {
    // Stop test environment if not in CI
    if (!process.env.CI) {
      try {
        const testEnv = new TestEnvironment();
        await testEnv.stop();
        console.log('✅ Test environment stopped successfully');
      } catch (error) {
        console.warn('⚠️ Failed to stop test environment cleanly:', error);
      }
    }

    // Clean up test artifacts
    await cleanupTestArtifacts();

    // Generate test summary
    await generateTestSummary();

    console.log('✅ Global teardown completed successfully');

  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

/**
 * Clean up test artifacts and temporary files
 */
async function cleanupTestArtifacts() {
  try {
    const fs = require('fs');
    const path = require('path');

    // Clean up temporary test data
    const testDataDir = path.join(__dirname, 'test-data');
    if (fs.existsSync(testDataDir)) {
      const files = fs.readdirSync(testDataDir);
      for (const file of files) {
        if (file.startsWith('temp_') || file.startsWith('test_')) {
          fs.unlinkSync(path.join(testDataDir, file));
        }
      }
      console.log('🗑️ Cleaned up temporary test files');
    }

    // Archive old test results
    const resultsDir = path.join(__dirname, 'test-results');
    if (fs.existsSync(resultsDir)) {
      const archiveDir = path.join(__dirname, 'archived-results');
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archivePath = path.join(archiveDir, `results-${timestamp}`);
      
      // Move old results to archive (keep last 5 runs)
      const archives = fs.readdirSync(archiveDir).sort().reverse();
      if (archives.length >= 5) {
        for (let i = 4; i < archives.length; i++) {
          fs.rmSync(path.join(archiveDir, archives[i]), { recursive: true, force: true });
        }
      }
    }

  } catch (error) {
    console.warn('⚠️ Failed to clean up test artifacts:', error);
  }
}

/**
 * Generate a summary of test execution
 */
async function generateTestSummary() {
  try {
    const fs = require('fs');
    const path = require('path');

    const resultsFile = path.join(__dirname, 'test-results.json');
    if (!fs.existsSync(resultsFile)) {
      return;
    }

    const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    
    const summary = {
      timestamp: new Date().toISOString(),
      duration: results.stats?.duration || 0,
      total: results.stats?.total || 0,
      passed: results.stats?.passed || 0,
      failed: results.stats?.failed || 0,
      skipped: results.stats?.skipped || 0,
      flaky: results.stats?.flaky || 0,
      projects: results.suites?.map((suite: any) => ({
        name: suite.title,
        tests: suite.specs?.length || 0,
        passed: suite.specs?.filter((spec: any) => spec.ok).length || 0,
        failed: suite.specs?.filter((spec: any) => !spec.ok).length || 0
      })) || []
    };

    const summaryFile = path.join(__dirname, 'test-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

    console.log('📊 Test Summary:');
    console.log(`   Total: ${summary.total}`);
    console.log(`   Passed: ${summary.passed}`);
    console.log(`   Failed: ${summary.failed}`);
    console.log(`   Skipped: ${summary.skipped}`);
    console.log(`   Duration: ${Math.round(summary.duration / 1000)}s`);

  } catch (error) {
    console.warn('⚠️ Failed to generate test summary:', error);
  }
}

export default globalTeardown;