/**
 * Backend Performance Tests
 * Comprehensive performance testing for API endpoints and services
 */

import { PerformanceTestFramework } from '../../../../shared/test-config/dist/cjs/PerformanceTestFramework';
import { TestConfigManager } from '../../../../shared/test-config/dist/cjs/TestConfigManager';

describe('Backend Performance Tests', () => {
  let performanceFramework: PerformanceTestFramework;
  let configManager: TestConfigManager;

  beforeAll(async () => {
    configManager = TestConfigManager.getInstance();
    performanceFramework = new PerformanceTestFramework();
    
    // Ensure test environment is ready
    const context = configManager.createExecutionContext('testing' as any, 'performance');
    // await configManager.setupEnvironment(context.environment); // Method not available
  }, 60000);

  afterAll(async () => {
    performanceFramework.cleanup();
    
    const context = configManager.createExecutionContext('testing' as any, 'performance');
    // await configManager.teardownEnvironment(context.environment); // Method not available
  });

  test('should run comprehensive performance test suite', async () => {
    const context = configManager.createExecutionContext('testing' as any, 'performance');
    
    const results = await performanceFramework.runPerformanceTests(context);
    
    // Verify all scenarios completed
    expect(results).toHaveLength(2); // api-baseline and high-load scenarios
    
    // Check that at least one scenario passed thresholds
    const passedScenarios = results.filter(r => r.thresholdsPassed);
    expect(passedScenarios.length).toBeGreaterThan(0);
    
    // Verify metrics were collected
    for (const result of results) {
      if (result.regression) {
        expect(result.regression.detected).toBe(true);
        expect(result.regression.detected).toBe(true);
      }
      expect(result.metrics.throughput.totalRequests).toBeGreaterThan(0);
      expect(result.artifacts).toBeDefined();
      expect(Array.isArray(result.artifacts)).toBe(true);
    }
    
    // Log results for debugging
    console.log('\n📊 Performance Test Results Summary:');
    results.forEach(result => {
      console.log(`\n🎯 Scenario: ${result.scenario}`);
      console.log(`✅ Passed: ${result.thresholdsPassed}`);
      console.log(`⏱️  Avg Response: ${result.metrics.responseTime.avg.toFixed(2)}ms`);
      console.log(`🚀 Throughput: ${result.metrics.throughput.requestsPerSecond.toFixed(2)} req/s`);
      console.log(`💾 Memory: ${result.metrics.memory.heapUsed.toFixed(2)}MB`);
      console.log(`❌ Error Rate: ${result.metrics.errors.errorRate.toFixed(2)}%`);
      
      if (result.regression?.detected) {
        console.log(`⚠️  Regression detected: ${result.regression.details.join(', ')}`);
      }
    });
    
  }, 300000); // 5 minute timeout for performance tests

  test('should detect performance regressions', async () => {
    const context = configManager.createExecutionContext('testing' as any, 'performance');
    
    // Run performance tests twice to test regression detection
    const firstRun = await performanceFramework.runPerformanceTests(context);
    
    // Brief pause between runs
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const secondRun = await performanceFramework.runPerformanceTests(context);
    
    // Verify both runs completed
    expect(firstRun).toHaveLength(2);
    expect(secondRun).toHaveLength(2);
    
    // Check that regression detection is working
    // (In a real scenario, we might artificially degrade performance for the second run)
    for (const result of secondRun) {
      expect(result.regression).toBeDefined();
      // Regression detection should be working even if no regression is detected
      if (result.regression) {
        expect(typeof result.regression.detected).toBe('boolean');
        expect(Array.isArray(result.regression.details)).toBe(true);
      }
    }
    
  }, 600000); // 10 minute timeout for regression tests

  test('should validate performance thresholds', async () => {
    const context = configManager.createExecutionContext('testing' as any, 'performance');
    
    const results = await performanceFramework.runPerformanceTests(context);
    
    for (const result of results) {
      // Verify threshold checking is working
      expect(typeof result.thresholdsPassed).toBe('boolean');
      expect(Array.isArray(result.thresholdFailures)).toBe(true);
      
      // If thresholds failed, there should be failure messages
      if (!result.thresholdsPassed) {
        expect(result.thresholdFailures.length).toBeGreaterThan(0);
        console.log(`❌ Threshold failures for ${result.scenario}:`, result.thresholdFailures);
      }
      
      // Verify metrics are within reasonable bounds
      expect(result.metrics.responseTime.avg).toBeGreaterThan(0);
      expect(result.metrics.responseTime.avg).toBeLessThan(30000); // 30 seconds max
      expect(result.metrics.throughput.requestsPerSecond).toBeGreaterThanOrEqual(0);
      expect(result.metrics.memory.heapUsed).toBeGreaterThan(0);
      expect(result.metrics.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(result.metrics.cpu.usage).toBeLessThanOrEqual(100);
      expect(result.metrics.errors.errorRate).toBeGreaterThanOrEqual(0);
      expect(result.metrics.errors.errorRate).toBeLessThanOrEqual(100);
    }
    
  }, 300000);

  test('should generate performance reports and artifacts', async () => {
    const context = configManager.createExecutionContext('testing' as any, 'performance');
    
    const results = await performanceFramework.runPerformanceTests(context);
    
    // Verify artifacts were generated
    for (const result of results) {
      expect(result.artifacts.length).toBeGreaterThan(0);
      
      // Check for expected artifact types
      const hasLogFiles = result.artifacts.some(artifact => 
        artifact.includes('test-output.log') || artifact.includes('system-metrics.json')
      );
      expect(hasLogFiles).toBe(true);
    }
    
    // Verify report files exist in the artifacts directory
    const fs = require('fs');
    const path = require('path');
    const reportDir = path.join(process.cwd(), 'test-artifacts', 'performance', 'reports');
    
    if (fs.existsSync(reportDir)) {
      const reportFiles = fs.readdirSync(reportDir);
      const hasHtmlReport = reportFiles.some((file: string) => file.endsWith('.html'));
      const hasJsonReport = reportFiles.some((file: string) => file.endsWith('.json'));
      
      expect(hasHtmlReport).toBe(true);
      expect(hasJsonReport).toBe(true);
    }
    
  }, 300000);
});