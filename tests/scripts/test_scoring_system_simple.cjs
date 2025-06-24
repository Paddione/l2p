#!/usr/bin/env node

/**
 * Simplified Scoring System Test
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = `http://${process.env.LOCAL_IP || '10.0.0.44'}`;
const API_BASE = `${BASE_URL}/api`;

let authToken = null;
let testQuestionSetId = null;
let testLobbyCode = null;

function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const colors = {
        INFO: '\x1b[36m',
        SUCCESS: '\x1b[32m',
        ERROR: '\x1b[31m',
        WARNING: '\x1b[33m',
        RESET: '\x1b[0m'
    };
    console.log(`${colors[level]}[${timestamp}] ${level}: ${message}${colors.RESET}`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(method, endpoint, data = null, token = null) {
    try {
        const config = {
            method,
            url: `${API_BASE}${endpoint}`,
            headers: {},
            timeout: 15000,
            validateStatus: () => true
        };

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            config.data = data;
            config.headers['Content-Type'] = 'application/json';
        }

        const response = await axios(config);
        return { 
            success: response.status >= 200 && response.status < 300, 
            data: response.data, 
            status: response.status 
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
}

async function setupTestEnvironment() {
    log('=== Setting Up Test Environment ===');
    
    // Register test user with shorter username
    const username = 'score' + Math.floor(Math.random() * 1000);
    
    const registerResult = await makeRequest('POST', '/auth/register', {
        username: username,
        password: 'testpass123',
        character: 'wiz'
    });
    
    if (!registerResult.success) {
        log(`✗ Failed to register test user: ${registerResult.error}`, 'ERROR');
        return false;
    }
    
    authToken = registerResult.data.token;
    log(`✓ Test user registered: ${username}`, 'SUCCESS');
    
    // Create test question set
    const questionSet = {
        name: 'Scoring Test QS ' + Date.now(),
        description: 'Question set for scoring system testing',
        questions: [
            {
                question: 'Test Question 1: What is 1 + 1?',
                options: ['1', '2', '3', '4'],
                correct: 1,
                type: 'multiple_choice'
            },
            {
                question: 'Test Question 2: Is this a test?',
                correct: true,
                type: 'true_false'
            }
        ]
    };
    
    const qsResult = await makeRequest('POST', '/question-sets', questionSet, authToken);
    if (!qsResult.success) {
        log(`✗ Failed to create question set: ${qsResult.error}`, 'ERROR');
        return false;
    }
    
    testQuestionSetId = qsResult.data.id;
    log(`✓ Test question set created: ID ${testQuestionSetId}`, 'SUCCESS');
    
    // Create test lobby
    const lobbyResult = await makeRequest('POST', '/lobbies/create', {
        character: 'wiz',
        question_set_id: testQuestionSetId
    }, authToken);
    
    if (!lobbyResult.success) {
        log(`✗ Failed to create lobby: ${lobbyResult.error}`, 'ERROR');
        return false;
    }
    
    testLobbyCode = lobbyResult.data.code;
    log(`✓ Test lobby created: ${testLobbyCode}`, 'SUCCESS');
    
    // Set question count
    await makeRequest('POST', `/lobbies/${testLobbyCode}/question-count`, {
        question_count: 2
    }, authToken);
    
    return true;
}

async function testBasicScoring() {
    log('=== Testing Basic Scoring Mechanics ===');
    
    // Start the game
    const startResult = await makeRequest('POST', `/lobbies/${testLobbyCode}/start`, null, authToken);
    if (!startResult.success) {
        log(`✗ Failed to start game: ${startResult.error}`, 'ERROR');
        return;
    }
    
    log('✓ Game started successfully', 'SUCCESS');
    
    // Test correct answer
    await sleep(2000); // 2 second delay
    
    const answerResult = await makeRequest('POST', `/lobbies/${testLobbyCode}/answer`, {
        answer: 1 // Correct answer for first question
    }, authToken);
    
    if (answerResult.success) {
        const actualScore = answerResult.data.score || 0;
        log(`Answer result: Score=${actualScore}, Correct=${answerResult.data.isCorrect}`, 'INFO');
        
        if (answerResult.data.isCorrect) {
            log(`✓ Answer marked as correct`, 'SUCCESS');
        } else {
            log(`✗ Answer should be correct but marked wrong`, 'ERROR');
        }
    } else {
        log(`✗ Failed to submit answer: ${answerResult.error}`, 'ERROR');
    }
}

async function runTests() {
    log('🚀 Starting Simplified Scoring System Test Suite');
    log('============================================================');
    
    try {
        const setupSuccess = await setupTestEnvironment();
        if (!setupSuccess) {
            log('✗ Test environment setup failed', 'ERROR');
            return;
        }
        
        await testBasicScoring();
        
        log('============================================================');
        log('🎉 Scoring system test completed!', 'SUCCESS');
        
    } catch (error) {
        log(`✗ Test execution failed: ${error.message}`, 'ERROR');
    }
}

runTests(); 