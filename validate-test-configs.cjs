#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

async function validateTestConfigs() {
  console.log('🔍 Validating test configurations...\n');
  
  const results = [];
  
  // Validate Jest (backend)
  console.log('🧪 Validating backend Jest configuration...');
  try {
    const backendResult = await runCommand('npm', ['test', '--', '--listTests'], { cwd: 'backend' });
    const testFiles = backendResult.stdout.split('\n').filter(line => line.trim().length > 0);
    
    results.push({
      runner: 'Jest (Backend)',
      status: 'success',
      filesFound: testFiles.length,
      message: `Found ${testFiles.length} test files`
    });
    
    console.log(`✅ Backend Jest: ${testFiles.length} test files found`);
  } catch (error) {
    results.push({
      runner: 'Jest (Backend)',
      status: 'error',
      filesFound: 0,
      message: `Error: ${error.message}`
    });
    console.log(`❌ Backend Jest: ${error.message}`);
  }
  
  // Validate Jest (frontend)
  console.log('🧪 Validating frontend Jest configuration...');
  try {
    const frontendResult = await runCommand('npm', ['test', '--', '--listTests'], { cwd: 'frontend' });
    const testFiles = frontendResult.stdout.split('\n').filter(line => line.trim().length > 0);
    
    results.push({
      runner: 'Jest (Frontend)',
      status: 'success',
      filesFound: testFiles.length,
      message: `Found ${testFiles.length} test files`
    });
    
    console.log(`✅ Frontend Jest: ${testFiles.length} test files found`);
  } catch (error) {
    results.push({
      runner: 'Jest (Frontend)',
      status: 'error',
      filesFound: 0,
      message: `Error: ${error.message}`
    });
    console.log(`❌ Frontend Jest: ${error.message}`);
  }
  
  // Validate Playwright
  console.log('🧪 Validating Playwright configuration...');
  try {
    const playwrightResult = await runCommand('npx', ['playwright', 'test', '--list'], { cwd: 'frontend/e2e' });
    const testLines = playwrightResult.stdout.split('\n').filter(line => line.includes('.spec.'));
    
    results.push({
      runner: 'Playwright',
      status: 'success',
      filesFound: testLines.length,
      message: `Found ${testLines.length} test files`
    });
    
    console.log(`✅ Playwright: ${testLines.length} test files found`);
  } catch (error) {
    results.push({
      runner: 'Playwright',
      status: 'error',
      filesFound: 0,
      message: `Error: ${error.message}`
    });
    console.log(`❌ Playwright: ${error.message}`);
  }
  
  // Check performance test files
  console.log('🧪 Checking performance test files...');
  try {
    const performanceFiles = await findFiles('**/performance/**/*.test.*');
    
    results.push({
      runner: 'Performance Tests',
      status: 'success',
      filesFound: performanceFiles.length,
      message: `Found ${performanceFiles.length} performance test files`
    });
    
    console.log(`✅ Performance Tests: ${performanceFiles.length} files found`);
  } catch (error) {
    results.push({
      runner: 'Performance Tests',
      status: 'error',
      filesFound: 0,
      message: `Error: ${error.message}`
    });
    console.log(`❌ Performance Tests: ${error.message}`);
  }
  
  // Check CLI test files
  console.log('🧪 Checking CLI test files...');
  try {
    const cliFiles = await findFiles('**/cli/**/*.ts');
    
    results.push({
      runner: 'CLI Tests',
      status: 'success',
      filesFound: cliFiles.length,
      message: `Found ${cliFiles.length} CLI test files`
    });
    
    console.log(`✅ CLI Tests: ${cliFiles.length} files found`);
  } catch (error) {
    results.push({
      runner: 'CLI Tests',
      status: 'error',
      filesFound: 0,
      message: `Error: ${error.message}`
    });
    console.log(`❌ CLI Tests: ${error.message}`);
  }
  
  // Summary
  console.log('\n📊 Validation Summary:');
  console.log('======================');
  
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const totalFiles = results.reduce((sum, r) => sum + r.filesFound, 0);
  
  console.log(`✅ Successful validations: ${successCount}`);
  console.log(`❌ Failed validations: ${errorCount}`);
  console.log(`📁 Total test files found: ${totalFiles}`);
  
  if (errorCount > 0) {
    console.log('\n🚨 Issues found:');
    results.filter(r => r.status === 'error').forEach(result => {
      console.log(`  - ${result.runner}: ${result.message}`);
    });
    
    console.log('\n💡 Recommendations:');
    console.log('  - Check that all dependencies are installed');
    console.log('  - Ensure test configurations are valid');
    console.log('  - Run npm install in both frontend and backend directories');
    console.log('  - Check that Playwright is properly installed');
  } else {
    console.log('\n🎉 All test configurations are valid!');
  }
  
  return results;
}

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      ...options, 
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true 
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
    
    // Set a timeout
    setTimeout(() => {
      child.kill();
      reject(new Error('Command timed out'));
    }, 30000); // 30 second timeout
  });
}

async function findFiles(pattern) {
  const glob = require('glob');
  
  return new Promise((resolve, reject) => {
    glob(pattern, { 
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**'
      ]
    }, (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
}

// Run validation
validateTestConfigs().catch(console.error);