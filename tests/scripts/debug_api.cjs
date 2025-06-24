#!/usr/bin/env node

/**
 * Debug API Test Suite
 * Comprehensive API health checks, endpoint validation, and system diagnostics
 */

require('dotenv').config();
const axios = require('axios');

// Configuration from environment variables
const BASE_URL = `http://${process.env.LOCAL_IP || '10.0.0.44'}`;
const API_BASE = `${BASE_URL}/api`;

// Test data
let authToken = null;

// Test utilities
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

async function makeRequest(method, endpoint, data = null, token = null) {
    const startTime = Date.now();
    try {
        const config = {
            method,
            url: `${API_BASE}${endpoint}`,
            headers: {},
            timeout: 10000, // 10 second timeout
            validateStatus: () => true // Don't throw errors for non-2xx status codes
        };

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            config.data = data;
            config.headers['Content-Type'] = 'application/json';
        }

        const response = await axios(config);
        const responseTime = Date.now() - startTime;
        return { 
            success: response.status >= 200 && response.status < 300, 
            data: response.data, 
            status: response.status,
            responseTime
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status || 500,
            fullError: error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message,
            responseTime
        };
    }
}

async function testSystemHealth() {
    log('=== Testing System Health ===');
    
    // Test main health endpoint
    const healthResponse = await makeRequest('GET', '/health');
    if (healthResponse.success) {
        log('✓ Health endpoint working', 'SUCCESS');
        log(`Response: ${JSON.stringify(healthResponse.data, null, 2)}`);
        log(`Response time: ${healthResponse.responseTime}`);
    } else {
        log('✗ Health endpoint failed', 'ERROR');
        log(`Error: ${healthResponse.error}`);
        return false;
    }
    
    // Test readiness endpoint
    const readinessResponse = await makeRequest('GET', '/ready');
    if (readinessResponse.success) {
        log('✓ Readiness endpoint working', 'SUCCESS');
        log(`Database status: ${readinessResponse.data.database || 'N/A'}`);
    } else {
        log('✗ Readiness endpoint failed', 'ERROR');
        log(`Error: ${readinessResponse.error}`);
    }
    
    return true;
}

async function testAllAPIEndpoints() {
    log('=== Testing All API Endpoints ===');
    
    // Define all known endpoints with their expected behavior
    const endpoints = [
        { method: 'GET', path: '/health', expectedStatus: 200, requiresAuth: false },
        { method: 'GET', path: '/ready', expectedStatus: 200, requiresAuth: false },
        { method: 'POST', path: '/auth/register', expectedStatus: [201, 409], requiresAuth: false },
        { method: 'POST', path: '/auth/login', expectedStatus: [200, 401], requiresAuth: false },
        { method: 'POST', path: '/auth/refresh', expectedStatus: [200, 400, 401], requiresAuth: false },
        { method: 'GET', path: '/question-sets', expectedStatus: [200, 401], requiresAuth: true },
        { method: 'POST', path: '/question-sets', expectedStatus: [201, 400, 401], requiresAuth: true },
        { method: 'GET', path: '/lobbies/list', expectedStatus: [200, 401], requiresAuth: true },
        { method: 'POST', path: '/lobbies/create', expectedStatus: [201, 400, 401], requiresAuth: true },
        { method: 'POST', path: '/lobbies/cleanup', expectedStatus: [200, 401], requiresAuth: true },
        { method: 'GET', path: '/hall-of-fame', expectedStatus: [200, 401], requiresAuth: false },
        { method: 'POST', path: '/hall-of-fame', expectedStatus: [201, 400, 401], requiresAuth: true },
        { method: 'GET', path: '/hall-of-fame/stats', expectedStatus: [200], requiresAuth: false }
    ];
    
    let workingEndpoints = 0;
    let totalEndpoints = endpoints.length;
    
    for (const endpoint of endpoints) {
        const description = `${endpoint.method} ${endpoint.path}`;
        log(`Testing ${description}...`);
        
        const result = await makeRequest(endpoint.method, endpoint.path);
        
        const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
            ? endpoint.expectedStatus 
            : [endpoint.expectedStatus];
        
        if (result.success && expectedStatuses.includes(result.status)) {
            log(`✓ ${description} - OK (${result.status})`, 'SUCCESS');
            workingEndpoints++;
        } else if (!result.success && expectedStatuses.includes(result.status)) {
            log(`✓ ${description} - Expected response (${result.status})`, 'SUCCESS');
            workingEndpoints++;
        } else {
            log(`✗ ${description} - Unexpected response (${result.status || 'timeout'})`, 'ERROR');
        }
    }
    
    log(`API Endpoints Summary: ${workingEndpoints}/${totalEndpoints} working correctly`);
    return workingEndpoints === totalEndpoints;
}

async function testUserAuthentication() {
    log('=== Testing User Authentication Flow ===');
    
    const testUsername = 'debug_user_' + Math.floor(Math.random() * 10000);
    let authToken = null;
    
    // Test user registration
    log('Testing user registration...');
    const registerResponse = await makeRequest('POST', '/auth/register', {
        username: testUsername,
        password: 'testpass123',
        character: 'wiz'
    });
    
    if (registerResponse.success) {
        log('✓ Registration successful', 'SUCCESS');
        authToken = registerResponse.data.token;
        log(`Token received: ${authToken ? 'Yes' : 'No'}`);
    } else if (registerResponse.status === 409) {
        log('⚠ User already exists, trying login...', 'WARNING');
        
        // Try login instead
        const loginResponse = await makeRequest('POST', '/auth/login', {
            username: testUsername,
            password: 'testpass123'
        });
        
        if (loginResponse.success) {
            log('✓ Login successful', 'SUCCESS');
            authToken = loginResponse.data.token;
        } else {
            log('✗ Login failed', 'ERROR');
            log(`Error: ${JSON.stringify(loginResponse.error, null, 2)}`);
            return null;
        }
    } else {
        log('✗ Registration failed', 'ERROR');
        log(`Status: ${registerResponse.status}`);
        log(`Error: ${JSON.stringify(registerResponse.error, null, 2)}`);
        return null;
    }
    
    // Test authenticated endpoint
    if (authToken) {
        log('Testing authenticated endpoint...');
        const authTestResponse = await makeRequest('GET', '/lobbies/list', null, authToken);
        
        if (authTestResponse.success) {
            log('✓ Authenticated request successful', 'SUCCESS');
            log(`Found ${authTestResponse.data.length} lobbies`);
        } else {
            log('✗ Authenticated request failed', 'ERROR');
            log(`Error: ${authTestResponse.error}`);
        }
    }
    
    return authToken;
}

async function testLobbyManagement(authToken) {
    log('=== Testing Lobby Management ===');
    
    if (!authToken) {
        log('✗ No auth token available for lobby testing', 'ERROR');
        return;
    }
    
    // Test lobby creation
    log('Testing lobby creation...');
    const lobbyResponse = await makeRequest('POST', '/lobbies/create', {
        character: 'wiz'
    }, authToken);
    
    if (lobbyResponse.success) {
        const lobbyCode = lobbyResponse.data.code;
        log(`✓ Lobby creation successful: ${lobbyCode}`, 'SUCCESS');
        log(`Lobby data: ${JSON.stringify(lobbyResponse.data, null, 2)}`);
        
        // Test lobby retrieval
        log('Testing lobby retrieval...');
        const retrieveResponse = await makeRequest('GET', `/lobbies/${lobbyCode}`, null, authToken);
        
        if (retrieveResponse.success) {
            log('✓ Lobby retrieval successful', 'SUCCESS');
            log(`Players: ${retrieveResponse.data.players.length}`);
        } else {
            log('✗ Lobby retrieval failed', 'ERROR');
        }
        
        // Test lobby cleanup
        log('Testing lobby cleanup...');
        const cleanupResponse = await makeRequest('POST', '/lobbies/cleanup', {}, authToken);
        
        if (cleanupResponse.success) {
            log(`✓ Cleanup successful: ${cleanupResponse.data.cleaned} lobbies cleaned`, 'SUCCESS');
        } else {
            log('✗ Cleanup failed', 'ERROR');
        }
        
        return lobbyCode;
    } else {
        log('✗ Lobby creation failed', 'ERROR');
        log(`Status: ${lobbyResponse.status}`);
        log(`Error: ${JSON.stringify(lobbyResponse.error, null, 2)}`);
    }
    
    return null;
}

async function testDatabaseConnectivity() {
    log('=== Testing Database Connectivity ===');
    
    // Test through health endpoint
    const healthResponse = await makeRequest('GET', '/health');
    
    if (healthResponse.success && healthResponse.data.database) {
        log('✓ Database connectivity confirmed via health endpoint', 'SUCCESS');
        log(`Database status: ${healthResponse.data.database}`);
    } else {
        log('⚠ Database status not available in health endpoint', 'WARNING');
    }
    
    // Test through readiness endpoint
    const readyResponse = await makeRequest('GET', '/ready');
    
    if (readyResponse.success) {
        log('✓ Database connectivity confirmed via readiness endpoint', 'SUCCESS');
        if (readyResponse.data.database) {
            log(`Database details: ${JSON.stringify(readyResponse.data.database, null, 2)}`);
        }
    } else {
        log('✗ Database connectivity issue detected', 'ERROR');
        log(`Error: ${readyResponse.error}`);
    }
}

async function testPerformanceMetrics() {
    log('=== Testing Performance Metrics ===');
    
    const performanceTests = [
        { name: 'Health Check', method: 'GET', path: '/health' },
        { name: 'Question Sets List', method: 'GET', path: '/question-sets' },
        { name: 'Lobby List', method: 'GET', path: '/lobbies/list' },
        { name: 'Hall of Fame', method: 'GET', path: '/hall-of-fame' }
    ];
    
    for (const test of performanceTests) {
        const startTime = Date.now();
        const result = await makeRequest(test.method, test.path);
        const duration = Date.now() - startTime;
        
        if (result.success) {
            log(`✓ ${test.name}: ${duration}ms`, duration < 1000 ? 'SUCCESS' : 'WARNING');
        } else {
            log(`✗ ${test.name}: ${duration}ms (failed)`, 'ERROR');
        }
    }
}

async function testErrorHandling() {
    log('=== Testing Error Handling ===');
    
    const errorTests = [
        { 
            name: 'Invalid endpoint', 
            method: 'GET', 
            path: '/invalid-endpoint',
            expectedStatus: 404 
        },
        { 
            name: 'Malformed JSON', 
            method: 'POST', 
            path: '/auth/login',
            data: 'invalid-json',
            expectedStatus: 400 
        },
        { 
            name: 'Missing required fields', 
            method: 'POST', 
            path: '/auth/register',
            data: { username: 'test' }, // Missing password
            expectedStatus: 400 
        },
        { 
            name: 'Invalid authentication', 
            method: 'GET', 
            path: '/lobbies/list',
            token: 'invalid-token',
            expectedStatus: [401, 403] // Accept either 401 or 403
        }
    ];
    
    for (const test of errorTests) {
        const result = await makeRequest(test.method, test.path, test.data, test.token);
        
        const expectedStatuses = Array.isArray(test.expectedStatus) ? test.expectedStatus : [test.expectedStatus];
        
        if (expectedStatuses.includes(result.status)) {
            log(`✓ ${test.name}: Correctly returned ${result.status}`, 'SUCCESS');
        } else {
            log(`✗ ${test.name}: Expected ${expectedStatuses.join(' or ')}, got ${result.status}`, 'ERROR');
        }
    }
}

async function testFrontendConnectivity() {
    log('=== Testing Frontend Connectivity ===');
    
    try {
        // Test main page
        const mainPageResponse = await axios.get(BASE_URL, { timeout: 5000 });
        if (mainPageResponse.status === 200) {
            log('✓ Main page accessible', 'SUCCESS');
            log(`Content length: ${mainPageResponse.data.length} bytes`);
        } else {
            log(`✗ Main page returned status ${mainPageResponse.status}`, 'ERROR');
        }
        
        // Test static assets
        const assetsToTest = [
            '/css/main.css',
            '/js/app.js',
            '/assets/images/knowledge-map.svg'
        ];
        
        for (const asset of assetsToTest) {
            try {
                const assetResponse = await axios.get(`${BASE_URL}${asset}`, { timeout: 3000 });
                if (assetResponse.status === 200) {
                    log(`✓ Asset ${asset} accessible`, 'SUCCESS');
                } else {
                    log(`✗ Asset ${asset} returned ${assetResponse.status}`, 'ERROR');
                }
            } catch (error) {
                log(`✗ Asset ${asset} failed to load`, 'ERROR');
            }
        }
        
    } catch (error) {
        log('✗ Frontend connectivity test failed', 'ERROR');
        log(`Error: ${error.message}`);
    }
}

async function generateSystemReport() {
    log('=== Generating System Report ===');
    
    const report = {
        timestamp: new Date().toISOString(),
        system: {
            nodeVersion: process.version,
            platform: process.platform,
            architecture: process.arch,
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
            }
        },
        api: {
            baseUrl: API_BASE,
            responsive: true // Will be updated based on tests
        },
        frontend: {
            baseUrl: BASE_URL,
            accessible: true // Will be updated based on tests
        }
    };
    
    log('System Report:', 'INFO');
    log(JSON.stringify(report, null, 2));
    
    return report;
}

// Main test execution
async function testAPI() {
    log('🚀 Starting Debug API Test Suite', 'INFO');
    log('='.repeat(60));
    
    try {
        // Core system tests
        const healthOk = await testSystemHealth();
        if (!healthOk) {
            log('❌ System health check failed - aborting remaining tests', 'ERROR');
            return;
        }
        
        await testDatabaseConnectivity();
        await testAllAPIEndpoints();
        await testPerformanceMetrics();
        await testErrorHandling();
        
        // Authentication and user flow tests
        const authToken = await testUserAuthentication();
        if (authToken) {
            await testLobbyManagement(authToken);
        }
        
        // Frontend connectivity
        await testFrontendConnectivity();
        
        // Generate final report
        await generateSystemReport();
        
        log('='.repeat(60));
        log('🎉 Debug API test suite completed!', 'SUCCESS');
        
    } catch (error) {
        log(`💥 Debug API test failed: ${error.message}`, 'ERROR');
        console.error(error);
    }
}

// Run the tests
if (require.main === module) {
    testAPI();
}

module.exports = {
    testAPI,
    testSystemHealth,
    testUserAuthentication,
    testLobbyManagement,
    makeRequest
}; 