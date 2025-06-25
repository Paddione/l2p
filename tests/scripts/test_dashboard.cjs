#!/usr/bin/env node

/**
 * Testing Dashboard Validation Script
 * Validates that the testing dashboard is accessible and functioning
 */

require('dotenv').config();
const puppeteer = require('puppeteer');
const axios = require('axios');

// Configuration from environment variables
const BASE_URL = `http://${process.env.LOCAL_IP || '10.0.0.44'}`;
const TESTING_URL = `${BASE_URL}/testing.html`;

// Puppeteer configuration
const PUPPETEER_OPTIONS = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
};

// Utility functions
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const colors = {
        INFO: '\x1b[36m',    // Cyan
        SUCCESS: '\x1b[32m', // Green
        ERROR: '\x1b[31m',   // Red
        WARNING: '\x1b[33m', // Yellow
        RESET: '\x1b[0m'     // Reset
    };
    console.log(`${colors[level]}[${timestamp}] ${level}: ${message}${colors.RESET}`);
}

async function testDashboardAccessibility() {
    log('=== Testing Dashboard Accessibility ===');
    
    try {
        const response = await axios.get(TESTING_URL, { timeout: 10000 });
        
        if (response.status === 200) {
            log('✓ Testing dashboard is accessible', 'SUCCESS');
            return true;
        } else {
            log(`✗ Testing dashboard returned status ${response.status}`, 'ERROR');
            return false;
        }
    } catch (error) {
        log(`✗ Testing dashboard accessibility failed: ${error.message}`, 'ERROR');
        return false;
    }
}

async function testDashboardFunctionality() {
    log('=== Testing Dashboard Functionality ===');
    
    const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    
    try {
        // Navigate to testing dashboard
        await page.goto(TESTING_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Check if the page loaded correctly
        const title = await page.title();
        log(`Page title: ${title}`);
        
        // Check for essential elements
        const systemTestButton = await page.$('button[onclick="testSystemHealth()"]');
        if (systemTestButton) {
            log('✓ System test button found', 'SUCCESS');
        } else {
            log('✗ System test button not found', 'ERROR');
            return false;
        }
        
        // Check for test result containers
        const testResultContainers = await page.$$('.test-result');
        if (testResultContainers.length > 0) {
            log(`✓ Found ${testResultContainers.length} test result containers`, 'SUCCESS');
        } else {
            log('✗ No test result containers found', 'ERROR');
            return false;
        }
        
        // Check for test log containers
        const testLogContainers = await page.$$('.test-log');
        if (testLogContainers.length > 0) {
            log(`✓ Found ${testLogContainers.length} test log containers`, 'SUCCESS');
        } else {
            log('✗ No test log containers found', 'ERROR');
            return false;
        }
        
        // Test the run all tests button
        const runAllTestsButton = await page.$('button[onclick="runAllTests()"]');
        if (runAllTestsButton) {
            log('✓ Run all tests button found', 'SUCCESS');
            
            // Click the button and wait for results
            await runAllTestsButton.click();
            
            // Wait for tests to complete (up to 30 seconds)
            await page.waitForFunction(() => {
                const summaryElement = document.getElementById('test-summary');
                return summaryElement && summaryElement.textContent.includes('Total Tests:');
            }, { timeout: 30000 });
            
            // Check test results
            const testSummary = await page.$eval('#test-summary', el => el.textContent);
            log(`Test summary: ${testSummary.replace(/\s+/g, ' ').trim()}`);
            
            if (testSummary.includes('Total Tests:')) {
                log('✓ Tests executed successfully', 'SUCCESS');
                return true;
            } else {
                log('✗ Tests did not execute correctly', 'ERROR');
                return false;
            }
        } else {
            log('✗ Run all tests button not found', 'ERROR');
            return false;
        }
        
    } catch (error) {
        log(`✗ Dashboard functionality test failed: ${error.message}`, 'ERROR');
        return false;
    } finally {
        await browser.close();
    }
}

async function testAPIEndpoints() {
    log('=== Testing API Endpoints ===');
    
    const endpoints = [
        { name: 'Question Sets', url: `${BASE_URL}/api/question-sets` },
        { name: 'Hall of Fame', url: `${BASE_URL}/api/hall-of-fame/1` },
        { name: 'Main App', url: `${BASE_URL}/index.html` }
    ];
    
    let allPassed = true;
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(endpoint.url, { timeout: 5000 });
            
            if (response.status === 200) {
                log(`✓ ${endpoint.name} API working`, 'SUCCESS');
            } else {
                log(`✗ ${endpoint.name} API returned status ${response.status}`, 'ERROR');
                allPassed = false;
            }
        } catch (error) {
            log(`✗ ${endpoint.name} API failed: ${error.message}`, 'ERROR');
            allPassed = false;
        }
    }
    
    return allPassed;
}

async function main() {
    log('=== Testing Dashboard Validation Started ===');
    
    const results = {
        dashboardAccessible: false,
        dashboardFunctional: false,
        apiEndpoints: false
    };
    
    try {
        results.dashboardAccessible = await testDashboardAccessibility();
        results.apiEndpoints = await testAPIEndpoints();
        
        if (results.dashboardAccessible && results.apiEndpoints) {
            results.dashboardFunctional = await testDashboardFunctionality();
        }
        
        // Summary
        log('=== Test Results Summary ===');
        log(`Dashboard Accessible: ${results.dashboardAccessible ? '✓' : '✗'}`);
        log(`API Endpoints Working: ${results.apiEndpoints ? '✓' : '✗'}`);
        log(`Dashboard Functional: ${results.dashboardFunctional ? '✓' : '✗'}`);
        
        const allPassed = Object.values(results).every(result => result === true);
        
        if (allPassed) {
            log('🎉 All tests passed! Testing dashboard is fully functional.', 'SUCCESS');
            process.exit(0);
        } else {
            log('❌ Some tests failed. Check the logs above for details.', 'ERROR');
            process.exit(1);
        }
        
    } catch (error) {
        log(`Fatal error: ${error.message}`, 'ERROR');
        process.exit(1);
    }
}

// Run the main function
main().catch(error => {
    log(`Unhandled error: ${error.message}`, 'ERROR');
    process.exit(1);
}); 