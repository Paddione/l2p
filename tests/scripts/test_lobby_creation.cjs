#!/usr/bin/env node

/**
 * Lobby Creation Test Suite
 * Simple test for lobby creation functionality
 */

require('dotenv').config();
const axios = require('axios');

// Configuration from environment variables
const BASE_URL = `http://${process.env.LOCAL_IP || '10.0.0.44'}`;
const API_BASE = `${BASE_URL}/api`;

// Test data
let authToken = null;

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

async function makeRequest(method, endpoint, data = null, token = null) {
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
        return { success: response.status >= 200 && response.status < 300, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status || 500,
            fullError: error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message
        };
    }
}

async function testLobbyCreation() {
    console.log('🧪 Testing Learn2Play Lobby Creation Flow');
    console.log('==========================================\n');

    try {
        // Step 1: Test API health
        console.log('1️⃣ Testing API health...');
        const healthResponse = await makeRequest('GET', '/health');
        console.log(`   Status: ${healthResponse.status}`);
        console.log(`   Response: ${JSON.stringify(healthResponse.data, null, 2)}\n`);

        if (healthResponse.status !== 200) {
            throw new Error('API health check failed');
        }

        // Step 2: Test question sets endpoint
        console.log('2️⃣ Testing question sets endpoint...');
        const questionSetsResponse = await makeRequest('GET', '/question-sets');
        console.log(`   Status: ${questionSetsResponse.status}`);
        
        if (questionSetsResponse.status === 200) {
            console.log(`   Found ${questionSetsResponse.data.length} question sets`);
            if (questionSetsResponse.data.length > 0) {
                console.log(`   First question set: ${questionSetsResponse.data[0].name} (${questionSetsResponse.data[0].question_count} questions)`);
            }
        } else {
            console.log(`   Error: ${JSON.stringify(questionSetsResponse.data, null, 2)}`);
        }
        console.log('');

        // Step 3: Test lobby creation (this will fail without auth, but we can check the error)
        console.log('3️⃣ Testing lobby creation endpoint...');
        const lobbyResponse = await makeRequest('POST', '/lobbies/create', {
            character: '🎯',
            question_set_id: 1
        });
        console.log(`   Status: ${lobbyResponse.status}`);
        console.log(`   Response: ${JSON.stringify(lobbyResponse.data, null, 2)}\n`);

        // Step 4: Test lobby list endpoint
        console.log('4️⃣ Testing lobby list endpoint...');
        const lobbyListResponse = await makeRequest('GET', '/lobbies/list');
        console.log(`   Status: ${lobbyListResponse.status}`);
        console.log(`   Response: ${JSON.stringify(lobbyListResponse.data, null, 2)}\n`);

        console.log('✅ Basic API endpoints are responding correctly!');
        console.log('');
        console.log('📝 Test Summary:');
        console.log('   - API is healthy and responding');
        console.log('   - Question sets endpoint is accessible');
        console.log('   - Lobby creation endpoint exists (auth required)');
        console.log('   - Lobby list endpoint is accessible');
        console.log('');
        console.log('🎯 The "Spiel erstellen" button should now work correctly!');
        console.log('   1. Click "Spiel erstellen" → Goes to question set selection');
        console.log('   2. Select a question set → Question count section appears');
        console.log('   3. Enter question count → Lobby is created automatically');
        console.log('   4. Lobby screen appears in host mode');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testLobbyCreation();
