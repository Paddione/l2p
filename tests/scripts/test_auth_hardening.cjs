#!/usr/bin/env node

/**
 * Test script for Authentication System Hardening
 * Tests password complexity, rate limiting, account lockout, and email verification
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE = process.env.API_BASE || 'http://10.0.0.44/api';
const TEST_TIMEOUT = 30000; // 30 seconds

// Test data
const testUsers = {
    validUser: {
        username: 'user' + Math.random().toString(36).substr(2, 8),
        password: 'SecurePass123!',
        character: '🧪',
        email: 'test@example.com'
    },
    weakPassword: {
        username: 'weak' + Math.random().toString(36).substr(2, 8),
        password: 'weak',
        character: '🔓'
    },
    bruteForceTarget: {
        username: 'brute' + Math.random().toString(36).substr(2, 7),
        password: 'ValidPass123!',
        character: '🎯'
    }
};

// Test results
const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    tests: []
};

/**
 * Make HTTP request
 */
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const client = options.protocol === 'https:' ? https : http;
        
        const req = client.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = responseData ? JSON.parse(responseData) : {};
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: parsedData
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: responseData
                    });
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(TEST_TIMEOUT, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

/**
 * Parse URL and create request options
 */
function createRequestOptions(url, method = 'GET', headers = {}) {
    const urlObj = new URL(url);
    
    return {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Learn2Play-Auth-Test/1.0',
            ...headers
        }
    };
}

/**
 * Run a test and record results
 */
async function runTest(testName, testFunction) {
    results.totalTests++;
    console.log(`\n🧪 Running: ${testName}`);
    
    const startTime = Date.now();
    try {
        await testFunction();
        const duration = Date.now() - startTime;
        
        results.passedTests++;
        results.tests.push({
            name: testName,
            status: 'PASSED',
            duration,
            error: null
        });
        
        console.log(`✅ PASSED: ${testName} (${duration}ms)`);
        
    } catch (error) {
        const duration = Date.now() - startTime;
        results.failedTests++;
        results.tests.push({
            name: testName,
            status: 'FAILED',
            duration,
            error: error.message
        });
        
        console.log(`❌ FAILED: ${testName}`);
        console.log(`   Error: ${error.message}`);
    }
}

/**
 * Test password complexity requirements
 */
async function testPasswordComplexity() {
    const weakPasswords = [
        'weak',           // Too short
        'password',       // No uppercase, numbers, special chars
        'PASSWORD',       // No lowercase, numbers, special chars
        'Password',       // No numbers, special chars
        'Password123',    // No special chars
        'Password!',      // No numbers
        '12345678',       // No letters, special chars
        '!@#$%^&*'        // No letters, numbers
    ];
    
    for (const weakPassword of weakPasswords) {
        const options = createRequestOptions(`${API_BASE}/auth/register`, 'POST');
        const userData = {
            username: 'test' + Math.random().toString(36).substr(2, 8),
            password: weakPassword,
            character: '🔓'
        };
        
        const response = await makeRequest(options, userData);
        
        if (response.statusCode === 200 || response.statusCode === 201) {
            throw new Error(`Weak password "${weakPassword}" was accepted (should be rejected)`);
        }
        
        if (!response.data.details || !response.data.details.fields || !response.data.details.fields.password) {
            throw new Error(`Expected password validation error for "${weakPassword}", got: ${JSON.stringify(response.data)}`);
        }
    }
    
    // Test valid password
    const options = createRequestOptions(`${API_BASE}/auth/register`, 'POST');
    const response = await makeRequest(options, testUsers.validUser);
    
    if (response.statusCode !== 201) {
        throw new Error(`Valid password was rejected: ${JSON.stringify(response.data)}`);
    }
}

/**
 * Test rate limiting and account lockout
 */
async function testRateLimitingAndLockout() {
    // First register the target user
    const registerOptions = createRequestOptions(`${API_BASE}/auth/register`, 'POST');
    const registerResponse = await makeRequest(registerOptions, testUsers.bruteForceTarget);
    
    if (registerResponse.statusCode !== 201) {
        throw new Error(`Failed to register brute force target user: ${JSON.stringify(registerResponse.data)}`);
    }
    
    // Attempt multiple failed logins
    const maxAttempts = 6; // Should trigger lockout at 5 attempts
    let lockoutTriggered = false;
    
    for (let i = 1; i <= maxAttempts; i++) {
        const loginOptions = createRequestOptions(`${API_BASE}/auth/login`, 'POST');
        const loginData = {
            username: testUsers.bruteForceTarget.username,
            password: 'WrongPassword123!'
        };
        
        const response = await makeRequest(loginOptions, loginData);
        
        console.log(`   Attempt ${i}: Status ${response.statusCode}`);
        
        if (response.statusCode === 423) { // Account locked
            lockoutTriggered = true;
            console.log(`   🔒 Account locked after ${i} attempts`);
            break;
        }
        
        if (response.statusCode === 429) { // Rate limit exceeded
            lockoutTriggered = true;
            console.log(`   ⏰ Rate limit exceeded after ${i} attempts`);
            break;
        }
        
        if (i < 5 && response.statusCode !== 401) {
            throw new Error(`Expected 401 for failed login attempt ${i}, got ${response.statusCode}`);
        }
        
        // Small delay between attempts
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!lockoutTriggered) {
        throw new Error('Account lockout was not triggered after multiple failed attempts');
    }
    
    // Verify that correct password is also blocked during lockout
    const lockedLoginOptions = createRequestOptions(`${API_BASE}/auth/login`, 'POST');
    const lockedLoginData = {
        username: testUsers.bruteForceTarget.username,
        password: testUsers.bruteForceTarget.password
    };
    
    const lockedResponse = await makeRequest(lockedLoginOptions, lockedLoginData);
    
    if (lockedResponse.statusCode === 200) {
        throw new Error('Login succeeded with correct password during lockout period');
    }
}

/**
 * Test email verification functionality
 */
async function testEmailVerification() {
    // Register user with email
    const registerOptions = createRequestOptions(`${API_BASE}/auth/register`, 'POST');
    const userWithEmail = {
        username: 'email' + Math.random().toString(36).substr(2, 8),
        password: 'EmailTest123!',
        character: '📧',
        email: 'test.email@example.com'
    };
    
    const registerResponse = await makeRequest(registerOptions, userWithEmail);
    
    if (registerResponse.statusCode !== 201) {
        throw new Error(`Failed to register user with email: ${JSON.stringify(registerResponse.data)}`);
    }
    
    // Check if email verification was initiated
    if (!registerResponse.data.hasOwnProperty('emailVerificationSent')) {
        throw new Error('Registration response should include emailVerificationSent field');
    }
    
    // Test invalid email format
    const invalidEmailOptions = createRequestOptions(`${API_BASE}/auth/register`, 'POST');
    const invalidEmailUser = {
        username: 'inv' + Math.random().toString(36).substr(2, 9),
        password: 'ValidPass123!',
        character: '❌',
        email: 'invalid-email'
    };
    
    const invalidEmailResponse = await makeRequest(invalidEmailOptions, invalidEmailUser);
    
    if (invalidEmailResponse.statusCode === 201) {
        throw new Error('Registration with invalid email format should be rejected');
    }
    
    // Test email verification endpoint with invalid token
    const verifyOptions = createRequestOptions(`${API_BASE}/auth/verify-email`, 'POST');
    const verifyResponse = await makeRequest(verifyOptions, { token: 'invalid_token_123' });
    
    if (verifyResponse.statusCode === 200) {
        throw new Error('Email verification with invalid token should fail');
    }
}

/**
 * Test password reset functionality
 */
async function testPasswordReset() {
    // Test password reset request with non-existent email
    const resetOptions = createRequestOptions(`${API_BASE}/auth/forgot-password`, 'POST');
    const resetResponse = await makeRequest(resetOptions, { email: 'nonexistent@example.com' });
    
    // Should return success for security (don't reveal if email exists)
    if (resetResponse.statusCode !== 200) {
        throw new Error(`Password reset request should return 200 for security, got ${resetResponse.statusCode}`);
    }
    
    // Test password reset with invalid email format
    const invalidResetOptions = createRequestOptions(`${API_BASE}/auth/forgot-password`, 'POST');
    const invalidResetResponse = await makeRequest(invalidResetOptions, { email: 'invalid-email' });
    
    if (invalidResetResponse.statusCode === 200) {
        throw new Error('Password reset with invalid email format should be rejected');
    }
    
    // Test password reset confirmation with invalid token
    const confirmOptions = createRequestOptions(`${API_BASE}/auth/reset-password`, 'POST');
    const confirmResponse = await makeRequest(confirmOptions, {
        token: 'invalid_token_123',
        password: 'NewPassword123!'
    });
    
    if (confirmResponse.statusCode === 200) {
        throw new Error('Password reset with invalid token should fail');
    }
}

/**
 * Test rate limit statistics endpoint
 */
async function testRateLimitStats() {
    // First login to get a token
    const loginOptions = createRequestOptions(`${API_BASE}/auth/login`, 'POST');
    const loginResponse = await makeRequest(loginOptions, {
        username: testUsers.validUser.username,
        password: testUsers.validUser.password
    });
    
    if (loginResponse.statusCode !== 200) {
        throw new Error('Failed to login for rate limit stats test');
    }
    
    const token = loginResponse.data.token;
    
    // Test rate limit stats endpoint
    const statsOptions = createRequestOptions(`${API_BASE}/auth/rate-limit-stats`, 'GET', {
        'Authorization': `Bearer ${token}`
    });
    
    const statsResponse = await makeRequest(statsOptions);
    
    if (statsResponse.statusCode !== 200) {
        throw new Error(`Rate limit stats endpoint failed: ${statsResponse.statusCode}`);
    }
    
    if (!statsResponse.data.data || !statsResponse.data.data.configuration) {
        throw new Error('Rate limit stats response missing expected data structure');
    }
    
    const config = statsResponse.data.data.configuration;
    if (!config.maxAttempts || !config.lockoutDurationMinutes) {
        throw new Error('Rate limit stats missing configuration details');
    }
}

/**
 * Main test execution
 */
async function runAllTests() {
    console.log('🔐 Starting Authentication System Hardening Tests');
    console.log(`📡 API Base: ${API_BASE}`);
    console.log(`⏱️  Timeout: ${TEST_TIMEOUT}ms`);
    console.log('=' .repeat(60));
    
    // Test password complexity
    await runTest('Password Complexity Requirements', testPasswordComplexity);
    
    // Test rate limiting and account lockout
    await runTest('Rate Limiting and Account Lockout', testRateLimitingAndLockout);
    
    // Test email verification
    await runTest('Email Verification Functionality', testEmailVerification);
    
    // Test password reset
    await runTest('Password Reset Functionality', testPasswordReset);
    
    // Test rate limit statistics
    await runTest('Rate Limit Statistics Endpoint', testRateLimitStats);
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passedTests}/${results.totalTests}`);
    console.log(`❌ Failed: ${results.failedTests}/${results.totalTests}`);
    console.log(`📈 Success Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
    
    if (results.failedTests > 0) {
        console.log('\n❌ FAILED TESTS:');
        results.tests.filter(t => t.status === 'FAILED').forEach(test => {
            console.log(`   • ${test.name}: ${test.error}`);
        });
    }
    
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = `./tests/results/auth_hardening_results_${Date.now()}.json`;
    
    const fs = require('fs');
    const path = require('path');
    
    // Ensure results directory exists
    const resultsDir = path.dirname(resultsFile);
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(resultsFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            totalTests: results.totalTests,
            passedTests: results.passedTests,
            failedTests: results.failedTests,
            successRate: (results.passedTests / results.totalTests) * 100
        },
        tests: results.tests,
        configuration: {
            apiBase: API_BASE,
            timeout: TEST_TIMEOUT
        }
    }, null, 2));
    
    console.log(`\n💾 Results saved to: ${resultsFile}`);
    
    // Exit with appropriate code
    process.exit(results.failedTests > 0 ? 1 : 0);
}

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Run tests
runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
}); 