#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Validating Learn2Play Test Environment...\n');

let allChecksPassed = true;

// Check 1: Docker is running
console.log('1. Checking Docker availability...');
try {
  execSync('docker --version', { stdio: 'pipe' });
  console.log('   ✅ Docker is available');
} catch (error) {
  console.log('   ❌ Docker is not available or not running');
  allChecksPassed = false;
}

// Check 2: Docker Compose is available
console.log('2. Checking Docker Compose availability...');
try {
  execSync('docker-compose --version', { stdio: 'pipe' });
  console.log('   ✅ Docker Compose is available');
} catch (error) {
  console.log('   ❌ Docker Compose is not available');
  allChecksPassed = false;
}

// Check 3: Test environment configuration exists
console.log('3. Checking test environment configuration...');
const testComposePath = join(__dirname, 'docker-compose.test.yml');
if (existsSync(testComposePath)) {
  console.log('   ✅ Test environment configuration exists');
} else {
  console.log('   ❌ Test environment configuration missing');
  allChecksPassed = false;
}

// Check 4: Frontend test setup
console.log('4. Checking frontend test setup...');
const frontendTestPath = join(__dirname, '../frontend/src/__tests__');
if (existsSync(frontendTestPath)) {
  console.log('   ✅ Frontend test directory exists');
} else {
  console.log('   ❌ Frontend test directory missing');
  allChecksPassed = false;
}

// Check 5: Backend test setup
console.log('5. Checking backend test setup...');
const backendTestPath = join(__dirname, '../backend/src/__tests__');
if (existsSync(backendTestPath)) {
  console.log('   ✅ Backend test directory exists');
} else {
  console.log('   ❌ Backend test directory missing');
  allChecksPassed = false;
}

// Check 6: E2E test setup
console.log('6. Checking E2E test setup...');
const e2eTestPath = join(__dirname, '../frontend/e2e');
if (existsSync(e2eTestPath)) {
  console.log('   ✅ E2E test directory exists');
} else {
  console.log('   ❌ E2E test directory missing');
  allChecksPassed = false;
}

// Check 7: Test environment is running
console.log('7. Checking if test environment is running...');
try {
  const output = execSync('docker-compose -f docker-compose.test.yml ps', { stdio: 'pipe' }).toString();
  if (output.includes('Up')) {
    console.log('   ✅ Test environment is running');
  } else {
    console.log('   ⚠️  Test environment is not running (run: npm run start:test-env)');
  }
} catch (error) {
  console.log('   ⚠️  Could not check test environment status');
}

console.log('\n📊 Validation Summary:');
if (allChecksPassed) {
  console.log('✅ All checks passed! Test environment is ready.');
  console.log('\n🚀 Next steps:');
  console.log('   - Run unit tests: npm run test:unit');
  console.log('   - Run integration tests: npm run test:integration');
  console.log('   - Run E2E tests: npm run test:e2e');
  console.log('   - Run all tests: npm run test:all');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  console.log('\n🔧 To fix issues:');
  console.log('   - Install Docker and Docker Compose if missing');
  console.log('   - Run: npm run fix-test-environment');
  process.exit(1);
} 