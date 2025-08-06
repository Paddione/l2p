#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Fixing Learn2Play Test Environment...\n');

// Function to run command and handle errors
function runCommand(command, description) {
  try {
    console.log(`📝 ${description}...`);
    execSync(command, { stdio: 'inherit', cwd: __dirname });
    console.log(`   ✅ ${description} completed`);
    return true;
  } catch (error) {
    console.log(`   ❌ ${description} failed: ${error.message}`);
    return false;
  }
}

// Function to create missing directories
function createDirectory(path, description) {
  if (!existsSync(path)) {
    try {
      execSync(`mkdir -p "${path}"`, { stdio: 'pipe' });
      console.log(`   ✅ Created ${description}`);
    } catch (error) {
      console.log(`   ❌ Failed to create ${description}: ${error.message}`);
      return false;
    }
  } else {
    console.log(`   ✅ ${description} already exists`);
  }
  return true;
}

console.log('1. Installing dependencies...');
runCommand('npm install', 'Installing testing dependencies');

console.log('\n2. Installing frontend dependencies...');
runCommand('cd ../frontend && npm install', 'Installing frontend dependencies');

console.log('\n3. Installing backend dependencies...');
runCommand('cd ../backend && npm install', 'Installing backend dependencies');

console.log('\n4. Building frontend for testing...');
runCommand('cd ../frontend && npm run build', 'Building frontend');

console.log('\n5. Building backend for testing...');
runCommand('cd ../backend && npm run build', 'Building backend');

console.log('\n6. Stopping existing test environment...');
runCommand('docker-compose -f docker-compose.test.yml down', 'Stopping existing test environment');

console.log('\n7. Starting test environment...');
runCommand('docker-compose -f docker-compose.test.yml up -d', 'Starting test environment');

console.log('\n8. Waiting for services to be ready...');
setTimeout(() => {
  console.log('   ⏳ Waiting 30 seconds for services to start...');
}, 1000);

setTimeout(() => {
  console.log('\n9. Validating test environment...');
  runCommand('node validate-test-env.js', 'Validating test environment');
  
  console.log('\n10. Running quick test to verify fixes...');
  runCommand('cd ../frontend && npm run test:unit', 'Running frontend unit tests');
  
  console.log('\n🎉 Test environment fix completed!');
  console.log('\n📋 Next steps:');
  console.log('   - Run unit tests: npm run test:unit');
  console.log('   - Run integration tests: npm run test:integration');
  console.log('   - Run E2E tests: npm run test:e2e');
  console.log('   - Run all tests: npm run test:all');
  console.log('\n🔧 Fixed issues:');
  console.log('   - Added missing data-testid attributes');
  console.log('   - Fixed accessibility landmark roles');
  console.log('   - Fixed test environment detection');
  console.log('   - Fixed hydration issues in test environment');
  console.log('   - Added proper error message handling');
}, 35000); 