#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Orchestrates all test suites and provides detailed reporting
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

// Configuration from environment variables
const BASE_URL = `http://${process.env.LOCAL_IP || '10.0.0.44'}`;
const API_BASE = `${BASE_URL}/api`;

// Configuration
const TEST_FILES = [
    'test_all_lobby_features.cjs',
    'test_question_sets.cjs',
    'test_frontend_ui.cjs',
    'test_scoring_system.cjs',
    'test_dashboard.cjs',
    'debug_api.cjs'
];

const PARALLEL_EXECUTION = process.argv.includes('--parallel') || process.argv.includes('-p');
const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');
const FILTER = process.argv.find(arg => arg.startsWith('--filter='))?.split('=')[1];

// Test results tracking
let testResults = [];
let startTime = Date.now();

// Utility functions
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const colors = {
        INFO: '\x1b[36m',     // Cyan
        SUCCESS: '\x1b[32m',  // Green
        ERROR: '\x1b[31m',    // Red
        WARNING: '\x1b[33m',  // Yellow
        HEADER: '\x1b[35m',   // Magenta
        RESET: '\x1b[0m'      // Reset
    };
    console.log(`${colors[level]}[${timestamp}] ${level}: ${message}${colors.RESET}`);
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
}

async function checkTestFiles() {
    log('=== Checking Test Files ===');
    
    const missingFiles = [];
    const availableFiles = [];
    
    for (const file of TEST_FILES) {
        if (fs.existsSync(file)) {
            availableFiles.push(file);
            log(`✓ Found ${file}`, 'SUCCESS');
        } else {
            missingFiles.push(file);
            log(`✗ Missing ${file}`, 'ERROR');
        }
    }
    
    if (missingFiles.length > 0) {
        log(`${missingFiles.length} test files are missing`, 'WARNING');
    }
    
    return availableFiles;
}

function runTestFile(testFile) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        log(`Starting ${testFile}...`, 'INFO');
        
        const child = spawn('node', [testFile], {
            stdio: VERBOSE ? 'inherit' : 'pipe'
        });
        
        let stdout = '';
        let stderr = '';
        
        if (!VERBOSE) {
            child.stdout?.on('data', (data) => {
                stdout += data.toString();
            });
            
            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
        }
        
        child.on('close', (code) => {
            const duration = Date.now() - startTime;
            const result = {
                file: testFile,
                exitCode: code,
                duration: duration,
                startTime: new Date(startTime).toISOString(),
                stdout: stdout,
                stderr: stderr,
                success: code === 0
            };
            
            if (code === 0) {
                log(`✓ ${testFile} completed successfully (${formatDuration(duration)})`, 'SUCCESS');
            } else {
                log(`✗ ${testFile} failed with exit code ${code} (${formatDuration(duration)})`, 'ERROR');
            }
            
            resolve(result);
        });
        
        child.on('error', (error) => {
            const duration = Date.now() - startTime;
            log(`✗ Failed to start ${testFile}: ${error.message}`, 'ERROR');
            
            resolve({
                file: testFile,
                exitCode: -1,
                duration: duration,
                startTime: new Date(startTime).toISOString(),
                stdout: '',
                stderr: error.message,
                success: false,
                error: error.message
            });
        });
    });
}

async function runTestsSequentially(testFiles) {
    log('=== Running Tests Sequentially ===');
    
    for (const testFile of testFiles) {
        const result = await runTestFile(testFile);
        testResults.push(result);
    }
}

async function runTestsInParallel(testFiles) {
    log('=== Running Tests in Parallel ===');
    
    const promises = testFiles.map(testFile => runTestFile(testFile));
    const results = await Promise.all(promises);
    testResults.push(...results);
}

function analyzeTestOutput(result) {
    const analysis = {
        file: result.file,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        errors: [],
        warnings: [],
        coverage: {}
    };
    
    if (result.stdout) {
        // Count success/failure patterns
        const successMatches = result.stdout.match(/✓|SUCCESS/g) || [];
        const errorMatches = result.stdout.match(/✗|ERROR/g) || [];
        const warningMatches = result.stdout.match(/⚠|WARNING/g) || [];
        
        analysis.passedTests = successMatches.length;
        analysis.failedTests = errorMatches.length;
        analysis.totalTests = analysis.passedTests + analysis.failedTests;
        
        // Extract error messages
        const errorLines = result.stdout.split('\n').filter(line => 
            line.includes('✗') || line.includes('ERROR')
        );
        analysis.errors = errorLines.slice(0, 5); // Limit to first 5 errors
        
        // Extract warning messages
        const warningLines = result.stdout.split('\n').filter(line => 
            line.includes('⚠') || line.includes('WARNING')
        );
        analysis.warnings = warningLines.slice(0, 3); // Limit to first 3 warnings
    }
    
    return analysis;
}

function generateReport() {
    log('=== Generating Test Report ===', 'HEADER');
    
    const totalDuration = Date.now() - startTime;
    const successfulTests = testResults.filter(r => r.success);
    const failedTests = testResults.filter(r => !r.success);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST EXECUTION SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`📁 Total Test Files: ${testResults.length}`);
    console.log(`✅ Successful: ${successfulTests.length}`);
    console.log(`❌ Failed: ${failedTests.length}`);
    console.log(`⏱️  Total Duration: ${formatDuration(totalDuration)}`);
    console.log(`🔄 Execution Mode: ${PARALLEL_EXECUTION ? 'Parallel' : 'Sequential'}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 DETAILED RESULTS');
    console.log('='.repeat(80));
    
    testResults.forEach((result, index) => {
        const analysis = analyzeTestOutput(result);
        const status = result.success ? '✅' : '❌';
        const duration = formatDuration(result.duration);
        
        console.log(`\n${index + 1}. ${status} ${result.file} (${duration})`);
        
        if (analysis.totalTests > 0) {
            console.log(`   📊 Tests: ${analysis.totalTests} total, ${analysis.passedTests} passed, ${analysis.failedTests} failed`);
        }
        
        if (analysis.errors.length > 0) {
            console.log(`   ❌ Errors:`);
            analysis.errors.forEach(error => {
                console.log(`      ${error.substring(0, 100)}${error.length > 100 ? '...' : ''}`);
            });
        }
        
        if (analysis.warnings.length > 0) {
            console.log(`   ⚠️  Warnings:`);
            analysis.warnings.forEach(warning => {
                console.log(`      ${warning.substring(0, 100)}${warning.length > 100 ? '...' : ''}`);
            });
        }
        
        if (!result.success && result.error) {
            console.log(`   💥 Execution Error: ${result.error}`);
        }
    });
    
    // Generate coverage analysis
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COVERAGE ANALYSIS');
    console.log('='.repeat(80));
    
    const coverageAreas = {
        'Authentication': ['auth', 'login', 'register', 'token'],
        'Lobby Management': ['lobby', 'create', 'join', 'player'],
        'Question Sets': ['question-set', 'question', 'answer'],
        'Game Logic': ['game', 'start', 'scoring', 'multiplier'],
        'Hall of Fame': ['hall-of-fame', 'leaderboard', 'stats'],
        'Frontend/UI': ['ui', 'theme', 'responsive', 'audio'],
        'API Health': ['health', 'ready', 'debug']
    };
    
    Object.entries(coverageAreas).forEach(([area, keywords]) => {
        const relevantTests = testResults.filter(result => 
            keywords.some(keyword => 
                result.file.toLowerCase().includes(keyword) ||
                result.stdout?.toLowerCase().includes(keyword)
            )
        );
        
        const coverage = relevantTests.length > 0 ? '✅' : '❌';
        console.log(`${coverage} ${area}: ${relevantTests.length} test file(s)`);
    });
}

function saveResultsToFile() {
    const reportData = {
        executionMode: PARALLEL_EXECUTION ? 'parallel' : 'sequential',
        totalDuration: Date.now() - startTime,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
        testResults: testResults.map(result => ({
            ...result,
            analysis: analyzeTestOutput(result)
        })),
        summary: {
            total: testResults.length,
            successful: testResults.filter(r => r.success).length,
            failed: testResults.filter(r => !r.success).length
        }
    };
    
    const reportFile = `test_results_${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    log(`📄 Detailed results saved to ${reportFile}`, 'INFO');
    
    // Also save a simple log file
    const logFile = 'test_results.log';
    const logContent = testResults.map(result => {
        const status = result.success ? 'PASS' : 'FAIL';
        const duration = formatDuration(result.duration);
        return `[${result.startTime}] ${status} ${result.file} (${duration})`;
    }).join('\n');
    
    fs.writeFileSync(logFile, logContent + '\n');
    log(`📝 Test log saved to ${logFile}`, 'INFO');
}

function printUsage() {
    console.log(`
📚 Test Runner Usage:
    node test_runner.cjs [options]

Options:
    --parallel, -p     Run tests in parallel (faster)
    --verbose, -v      Show detailed output from each test
    --filter=<name>    Run only tests containing <name>
    --help, -h         Show this help message

Examples:
    node test_runner.cjs --parallel --verbose
    node test_runner.cjs --filter=lobby
    node test_runner.cjs -p -v
    `);
}

// Environment check
async function checkEnvironment() {
    log('=== Environment Check ===');
    
    try {
        // Check if Node.js modules are available
        require('axios');
        log('✓ axios module available', 'SUCCESS');
    } catch (error) {
        log('✗ axios module missing - run: npm install axios', 'ERROR');
        return false;
    }
    
    try {
        require('puppeteer');
        log('✓ puppeteer module available', 'SUCCESS');
    } catch (error) {
        log('⚠ puppeteer module missing - frontend tests will be skipped', 'WARNING');
        log('  To install: npm install puppeteer', 'INFO');
    }
    
    // Check API availability
    try {
        const response = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
        log('✓ API server is responding', 'SUCCESS');
    } catch (error) {
        log('⚠ API server not responding - some tests may fail', 'WARNING');
        log('  Make sure the application is running on http://10.0.0.44', 'INFO');
    }
    
    return true;
}

// Main execution
async function main() {
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        printUsage();
        return;
    }
    
    log('🚀 Starting Comprehensive Test Suite', 'HEADER');
    log('='.repeat(60));
    
    // Environment check
    const envOk = await checkEnvironment();
    if (!envOk) {
        log('❌ Environment check failed', 'ERROR');
        process.exit(1);
    }
    
    // Check available test files
    let testFiles = await checkTestFiles();
    
    // Apply filter if specified
    if (FILTER) {
        testFiles = testFiles.filter(file => file.toLowerCase().includes(FILTER.toLowerCase()));
        log(`📋 Filtered tests: ${testFiles.length} files match "${FILTER}"`, 'INFO');
    }
    
    if (testFiles.length === 0) {
        log('❌ No test files available to run', 'ERROR');
        process.exit(1);
    }
    
    log(`📊 Execution plan: ${testFiles.length} test files, ${PARALLEL_EXECUTION ? 'parallel' : 'sequential'} mode`);
    
    // Run tests
    if (PARALLEL_EXECUTION) {
        await runTestsInParallel(testFiles);
    } else {
        await runTestsSequentially(testFiles);
    }
    
    // Generate report
    generateReport();
    
    // Save results
    saveResultsToFile();
    
    // Exit with appropriate code
    const hasFailures = testResults.some(r => !r.success);
    if (hasFailures) {
        log('❌ Some tests failed - check the report above', 'ERROR');
        process.exit(1);
    } else {
        log('🎉 All tests passed successfully!', 'SUCCESS');
        process.exit(0);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    log('⚠ Test execution interrupted by user', 'WARNING');
    if (testResults.length > 0) {
        generateReport();
    }
    process.exit(130);
});

process.on('uncaughtException', (error) => {
    log(`💥 Uncaught exception: ${error.message}`, 'ERROR');
    console.error(error);
    process.exit(1);
});

// Run the main function
main().catch(error => {
    log(`💥 Test runner failed: ${error.message}`, 'ERROR');
    console.error(error);
    process.exit(1);
}); 