#!/usr/bin/env node

/**
 * Test Configuration Validation Script
 * Validates that the unified test configuration system is working correctly
 */

import { TestConfigManager } from './shared/test-config/dist/TestConfigManager.js';
import { TestUtilities } from './shared/test-config/dist/TestUtilities.js';

async function validateConfiguration() {
  console.log('🔧 Validating Unified Test Configuration System...\n');

  try {
    // Test 1: Load configuration manager
    console.log('1. Loading configuration manager...');
    const configManager = TestConfigManager.getInstance();
    console.log('   ✅ Configuration manager loaded successfully');

    // Test 2: Load configuration file
    console.log('\n2. Loading test configuration...');
    const config = configManager.loadConfig();
    console.log('   ✅ Configuration file loaded successfully');
    console.log(`   📊 Found ${Object.keys(config.environments).length} environments: ${Object.keys(config.environments).join(', ')}`);
    console.log(`   📊 Found ${Object.keys(config.test_types).length} test types: ${Object.keys(config.test_types).join(', ')}`);

    // Test 3: Validate configuration
    console.log('\n3. Validating configuration...');
    const validation = configManager.validateConfig();
    if (validation.isValid) {
      console.log('   ✅ Configuration validation passed');
      if (validation.warnings.length > 0) {
        console.log(`   ⚠️  ${validation.warnings.length} warnings found:`);
        validation.warnings.forEach(warning => console.log(`      - ${warning}`));
      }
    } else {
      console.log('   ❌ Configuration validation failed:');
      validation.errors.forEach(error => console.log(`      - ${error.field}: ${error.message}`));
      return false;
    }

    // Test 4: Test environment configurations
    console.log('\n4. Testing environment configurations...');
    const environments = ['local', 'ci', 'docker'];
    for (const env of environments) {
      try {
        const envConfig = configManager.getEnvironmentConfig(env);
        console.log(`   ✅ ${env} environment configuration loaded`);
        console.log(`      - Database: ${envConfig.database.url}`);
        console.log(`      - Services: ${Object.keys(envConfig.services).join(', ')}`);
        console.log(`      - Coverage threshold: ${envConfig.coverage.threshold.statements}%`);
      } catch (error) {
        console.log(`   ❌ Failed to load ${env} environment: ${error.message}`);
        return false;
      }
    }

    // Test 5: Test type configurations
    console.log('\n5. Testing test type configurations...');
    const testTypes = ['unit', 'integration', 'e2e', 'performance', 'accessibility'];
    for (const type of testTypes) {
      try {
        const typeConfig = configManager.getTestTypeConfig(type);
        console.log(`   ✅ ${type} test type configuration loaded`);
        console.log(`      - Timeout: ${typeConfig.timeout}ms`);
        console.log(`      - Parallel: ${typeConfig.parallel}`);
        console.log(`      - Coverage: ${typeConfig.collect_coverage}`);
      } catch (error) {
        console.log(`   ❌ Failed to load ${type} test type: ${error.message}`);
        return false;
      }
    }

    // Test 6: Test execution context creation
    console.log('\n6. Testing execution context creation...');
    try {
      const context = configManager.createExecutionContext('local', 'unit');
      console.log('   ✅ Execution context created successfully');
      console.log(`      - Environment: ${context.environment}`);
      console.log(`      - Test type: ${context.test_type}`);
      console.log(`      - Database URL: ${context.environment_config.database.url}`);
      console.log(`      - Test timeout: ${context.test_type_config.timeout}ms`);
    } catch (error) {
      console.log(`   ❌ Failed to create execution context: ${error.message}`);
      return false;
    }

    // Test 7: Test Jest configuration generation
    console.log('\n7. Testing Jest configuration generation...');
    try {
      const context = configManager.createExecutionContext('local', 'unit');
      const jestConfigBackend = configManager.getJestConfig(context, true);
      const jestConfigFrontend = configManager.getJestConfig(context, false);
      
      console.log('   ✅ Jest configurations generated successfully');
      console.log(`      - Backend coverage patterns: ${jestConfigBackend.collectCoverageFrom.length} patterns`);
      console.log(`      - Frontend coverage patterns: ${jestConfigFrontend.collectCoverageFrom.length} patterns`);
      console.log(`      - Coverage threshold: ${jestConfigBackend.coverageThreshold.global.statements}%`);
    } catch (error) {
      console.log(`   ❌ Failed to generate Jest configuration: ${error.message}`);
      return false;
    }

    // Test 8: Test utilities initialization
    console.log('\n8. Testing test utilities...');
    try {
      const context = await TestUtilities.initializeTestEnvironment('local', 'unit');
      console.log('   ✅ Test utilities initialized successfully');
      console.log(`      - Environment: ${context.environment}`);
      console.log(`      - Test type: ${context.test_type}`);
      
      // Test mock data generation
      const mockData = TestUtilities.createMockData();
      const testUser = mockData.user();
      console.log('   ✅ Mock data generators working');
      console.log(`      - Generated test user: ${testUser.username}`);
      
      // Test helpers
      const helpers = TestUtilities.createTestHelpers();
      console.log('   ✅ Test helpers created');
      console.log(`      - Available helpers: ${Object.keys(helpers).length}`);
      
    } catch (error) {
      console.log(`   ❌ Failed to initialize test utilities: ${error.message}`);
      return false;
    }

    console.log('\n🎉 All tests passed! Unified test configuration system is working correctly.\n');
    
    // Summary
    console.log('📋 Configuration Summary:');
    console.log(`   - Environments: ${Object.keys(config.environments).join(', ')}`);
    console.log(`   - Test Types: ${Object.keys(config.test_types).join(', ')}`);
    console.log(`   - Global Settings: ${Object.keys(config.global).length} settings configured`);
    console.log(`   - Validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(`   - Warnings: ${validation.warnings.length}`);
    
    return true;

  } catch (error) {
    console.log(`\n❌ Configuration validation failed: ${error.message}`);
    console.log(`   Stack trace: ${error.stack}`);
    return false;
  }
}

// Run validation
validateConfiguration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});