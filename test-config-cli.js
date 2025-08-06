#!/usr/bin/env node

/**
 * Test Configuration CLI Tool
 * Command-line interface for managing test configurations
 */

import { TestConfigManager } from './shared/test-config/dist/TestConfigManager.js';
import { TestUtilities } from './shared/test-config/dist/TestUtilities.js';

const commands = {
  validate: 'Validate the test configuration',
  environments: 'List available environments',
  'test-types': 'List available test types',
  context: 'Create and display execution context',
  'jest-config': 'Generate Jest configuration',
  'health-check': 'Perform health check on services',
  help: 'Show this help message'
};

function showHelp() {
  console.log('🔧 Test Configuration CLI\n');
  console.log('Usage: node test-config-cli.js <command> [options]\n');
  console.log('Commands:');
  Object.entries(commands).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(15)} ${desc}`);
  });
  console.log('\nOptions:');
  console.log('  --env <env>     Environment (local, ci, docker)');
  console.log('  --type <type>   Test type (unit, integration, e2e, performance, accessibility)');
  console.log('  --backend       Generate backend-specific configuration');
  console.log('  --frontend      Generate frontend-specific configuration');
  console.log('\nExamples:');
  console.log('  node test-config-cli.js validate');
  console.log('  node test-config-cli.js context --env local --type unit');
  console.log('  node test-config-cli.js jest-config --env ci --type integration --backend');
  console.log('  node test-config-cli.js health-check --env local');
}

async function validateConfig() {
  console.log('🔧 Validating test configuration...\n');
  
  try {
    const configManager = TestConfigManager.getInstance();
    const config = configManager.loadConfig();
    const validation = configManager.validateConfig();
    
    if (validation.isValid) {
      console.log('✅ Configuration is valid');
      console.log(`📊 Environments: ${Object.keys(config.environments).join(', ')}`);
      console.log(`📊 Test types: ${Object.keys(config.test_types).join(', ')}`);
      
      if (validation.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        validation.warnings.forEach(warning => console.log(`  - ${warning}`));
      }
    } else {
      console.log('❌ Configuration validation failed:');
      validation.errors.forEach(error => console.log(`  - ${error.field}: ${error.message}`));
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

function listEnvironments() {
  console.log('🌍 Available environments:\n');
  
  try {
    const configManager = TestConfigManager.getInstance();
    const config = configManager.loadConfig();
    
    Object.entries(config.environments).forEach(([name, envConfig]) => {
      console.log(`📍 ${name}`);
      console.log(`   Database: ${envConfig.database.url}`);
      console.log(`   Services: ${Object.keys(envConfig.services).join(', ')}`);
      console.log(`   Coverage threshold: ${envConfig.coverage.threshold.statements}%`);
      console.log('');
    });
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

function listTestTypes() {
  console.log('🧪 Available test types:\n');
  
  try {
    const configManager = TestConfigManager.getInstance();
    const config = configManager.loadConfig();
    
    Object.entries(config.test_types).forEach(([name, typeConfig]) => {
      console.log(`🔬 ${name}`);
      console.log(`   Timeout: ${typeConfig.timeout}ms`);
      console.log(`   Parallel: ${typeConfig.parallel}`);
      console.log(`   Coverage: ${typeConfig.collect_coverage}`);
      if (typeConfig.headless !== undefined) {
        console.log(`   Headless: ${typeConfig.headless}`);
      }
      if (typeConfig.browsers) {
        console.log(`   Browsers: ${typeConfig.browsers.join(', ')}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

function createContext(env, type) {
  console.log(`🎯 Creating execution context for ${env}/${type}...\n`);
  
  try {
    const configManager = TestConfigManager.getInstance();
    const context = configManager.createExecutionContext(env, type);
    
    console.log('✅ Execution context created successfully');
    console.log(`Environment: ${context.environment}`);
    console.log(`Test type: ${context.test_type}`);
    console.log('\n📊 Environment Configuration:');
    console.log(`  Database URL: ${context.environment_config.database.url}`);
    console.log(`  Database timeout: ${context.environment_config.database.timeout}ms`);
    console.log(`  Services: ${Object.keys(context.environment_config.services).join(', ')}`);
    console.log(`  Coverage threshold: ${context.environment_config.coverage.threshold.statements}%`);
    
    console.log('\n🔬 Test Type Configuration:');
    console.log(`  Timeout: ${context.test_type_config.timeout}ms`);
    console.log(`  Parallel: ${context.test_type_config.parallel}`);
    console.log(`  Max workers: ${context.test_type_config.max_workers}`);
    console.log(`  Collect coverage: ${context.test_type_config.collect_coverage}`);
    console.log(`  Bail on failure: ${context.test_type_config.bail}`);
    console.log(`  Verbose: ${context.test_type_config.verbose}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

function generateJestConfig(env, type, isBackend) {
  const target = isBackend ? 'backend' : 'frontend';
  console.log(`⚙️  Generating Jest configuration for ${target} (${env}/${type})...\n`);
  
  try {
    const configManager = TestConfigManager.getInstance();
    const context = configManager.createExecutionContext(env, type);
    const jestConfig = configManager.getJestConfig(context, isBackend);
    
    console.log('✅ Jest configuration generated successfully');
    console.log('\n📋 Configuration:');
    console.log(JSON.stringify(jestConfig, null, 2));
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

async function performHealthCheck(env) {
  console.log(`🏥 Performing health check for ${env} environment...\n`);
  
  try {
    const configManager = TestConfigManager.getInstance();
    const status = await configManager.performHealthCheck(env);
    
    console.log(`Environment: ${status.environment}`);
    console.log(`Status: ${status.status}`);
    console.log(`Database connected: ${status.database_connected}`);
    
    if (status.setup_time) {
      console.log(`Setup time: ${status.setup_time}ms`);
    }
    
    if (status.error) {
      console.log(`Error: ${status.error}`);
    }
    
    console.log('\n🔍 Service Health:');
    status.services.forEach(service => {
      const statusIcon = service.status === 'healthy' ? '✅' : '❌';
      console.log(`  ${statusIcon} ${service.service}: ${service.status}`);
      console.log(`     URL: ${service.url}`);
      if (service.response_time) {
        console.log(`     Response time: ${service.response_time}ms`);
      }
      if (service.error) {
        console.log(`     Error: ${service.error}`);
      }
    });
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Parse options
const options = {};
for (let i = 1; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].substring(2);
    if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
      options[key] = args[i + 1];
      i++; // Skip next argument as it's the value
    } else {
      options[key] = true;
    }
  }
}

// Default values
const env = options.env || 'local';
const type = options.type || 'unit';
const isBackend = options.backend || !options.frontend;

// Execute command
switch (command) {
  case 'validate':
    await validateConfig();
    break;
    
  case 'environments':
    listEnvironments();
    break;
    
  case 'test-types':
    listTestTypes();
    break;
    
  case 'context':
    createContext(env, type);
    break;
    
  case 'jest-config':
    generateJestConfig(env, type, isBackend);
    break;
    
  case 'health-check':
    await performHealthCheck(env);
    break;
    
  case 'help':
  case undefined:
    showHelp();
    break;
    
  default:
    console.error(`❌ Unknown command: ${command}`);
    console.log('Run "node test-config-cli.js help" for available commands.');
    process.exit(1);
}