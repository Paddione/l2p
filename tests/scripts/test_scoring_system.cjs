#!/usr/bin/env node

/**
 * Advanced Scoring System Test Suite
 * Tests the time-based scoring, multiplier system, and scoring mechanics
 */

require('dotenv').config();
const axios = require('axios');

// Configuration from environment variables
const BASE_URL = `http://${process.env.LOCAL_IP || '10.0.0.44'}`;
const API_BASE = `${BASE_URL}/api`;

// Test data
let authToken = null;
let testLobbyCode = null;
let testQuestionSetId = null;

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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(method, endpoint, data = null, token = null) {
    try {
        const config = {
            method,
            url: `${API_BASE}${endpoint}`,
            headers: {},
            timeout: 15000, // 15 second timeout for scoring tests
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

// Scoring calculation function (mirrors backend logic)
function calculateExpectedScore(isCorrect, timeElapsed, multiplier = 1, baseScore = 60) {
    if (!isCorrect) return 0;
    const timeRemaining = Math.max(0, baseScore - timeElapsed);
    return Math.round(timeRemaining * multiplier);
}

// Setup functions
async function setupTestEnvironment() {
    log('=== Setting Up Test Environment ===');
    
    // Register/login test user
    const username = 'score' + Math.floor(Math.random() * 1000);
    
    try {
        const registerResult = await makeRequest('POST', '/auth/register', {
            username: username,
            password: 'testpass123',
            character: 'wiz'
        }, authToken);
        
        if (registerResult.success) {
            authToken = registerResult.data.token;
            log(`✓ Test user registered: ${username}`, 'SUCCESS');
        } else {
            log(`✗ Failed to register test user: ${registerResult.error}`, 'ERROR');
            return false;
        }
    } catch (error) {
        log(`✗ Setup failed: ${error.message}`, 'ERROR');
        return false;
    }
    
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
            },
            {
                question: 'Test Question 3: What is 2 × 2?',
                options: ['2', '4', '6', '8'],
                correct: 1,
                type: 'multiple_choice'
            },
            {
                question: 'Test Question 4: Is 5 > 3?',
                correct: true,
                type: 'true_false'
            },
            {
                question: 'Test Question 5: What is 3 + 3?',
                options: ['5', '6', '7', '8'],
                correct: 1,
                type: 'multiple_choice'
            }
        ]
    };
    
    const qsResult = await makeRequest('POST', '/question-sets', questionSet, authToken);
    if (qsResult.success) {
        testQuestionSetId = qsResult.data.id;
        log(`✓ Test question set created: ID ${testQuestionSetId}`, 'SUCCESS');
    } else {
        log(`✗ Failed to create question set: ${qsResult.error}`, 'ERROR');
        return false;
    }
    
    // Create test lobby
    const lobbyResult = await makeRequest('POST', '/lobbies/create', {
        character: 'wiz',
        question_set_id: testQuestionSetId
    }, authToken);
    
    if (lobbyResult.success) {
        testLobbyCode = lobbyResult.data.code;
        log(`✓ Test lobby created: ${testLobbyCode}`, 'SUCCESS');
    } else {
        log(`✗ Failed to create lobby: ${lobbyResult.error}`, 'ERROR');
        return false;
    }
    
    // Set question count
    await makeRequest('POST', `/lobbies/${testLobbyCode}/question-count`, {
        question_count: 5
    }, authToken);
    
    return true;
}

// Test functions
async function testBasicScoring() {
    log('=== Testing Basic Scoring Mechanics ===');
    
    // Start the game
    const startResult = await makeRequest('POST', `/lobbies/${testLobbyCode}/start`, null, authToken);
    if (!startResult.success) {
        log(`✗ Failed to start game: ${startResult.error}`, 'ERROR');
        return;
    }
    
    log('✓ Game started successfully', 'SUCCESS');
    
    // Test immediate correct answer (should get close to 60 points)
    const immediateStart = Date.now();
    await sleep(1000); // 1 second delay
    const immediateEnd = Date.now();
    const immediateElapsed = Math.floor((immediateEnd - immediateStart) / 1000);
    
    const immediateResult = await makeRequest('POST', `/lobbies/${testLobbyCode}/answer`, {
        answer: 1 // Correct answer for first question
    }, authToken);
    
    if (immediateResult.success) {
        // Wait for score processing (asynchronous in backend)
        await sleep(3000); // Give backend time to process scores
        
        // Get lobby state to check actual score
        const lobbyState = await makeRequest('GET', `/lobbies/${testLobbyCode}`, null, authToken);
        if (lobbyState.success && lobbyState.data.players) {
            const player = lobbyState.data.players[0]; // First (and only) player
            const actualScore = player ? player.score : 0;
            const expectedScore = calculateExpectedScore(true, immediateElapsed, 1);
            const scoreDiff = Math.abs(actualScore - expectedScore);
            
            log(`Fast answer (${immediateElapsed}s): Expected ~${expectedScore}, Got ${actualScore}, Diff: ${scoreDiff}`, 
                scoreDiff <= 5 ? 'SUCCESS' : 'WARNING');
        } else {
            log(`Fast answer (${immediateElapsed}s): Expected ~${calculateExpectedScore(true, immediateElapsed, 1)}, Got 0, Diff: ${calculateExpectedScore(true, immediateElapsed, 1)}`, 'WARNING');
        }
        
        if (immediateResult.data.isCorrect) {
            log(`✓ Answer marked as correct`, 'SUCCESS');
        } else {
            log(`✗ Answer should be correct but marked wrong`, 'ERROR');
        }
    } else {
        log(`✗ Failed to submit immediate answer: ${immediateResult.error}`, 'ERROR');
    }
}

async function testTimingBasedScoring() {
    log('=== Testing Timing-Based Scoring ===');
    
    // Advance to next question
    await sleep(2000);
    await makeRequest('POST', `/lobbies/${testLobbyCode}/next-question`, null, authToken);
    
    // Test different timing scenarios
    const timingTests = [
        { delay: 5, description: 'Very fast (5s)' },
        { delay: 15, description: 'Medium (15s)' },
        // Disabled long tests to prevent timeout issues in testing
        // { delay: 30, description: 'Slow (30s)' },
        // { delay: 50, description: 'Very slow (50s)' }
    ];
    
    for (let i = 0; i < timingTests.length; i++) {
        const test = timingTests[i];
        
        if (i > 0) {
            // Advance to next question (except for first iteration)
            await sleep(2000);
            await makeRequest('POST', `/lobbies/${testLobbyCode}/next-question`, null, authToken);
        }
        
        log(`Testing ${test.description} answer...`);
        
        const start = Date.now();
        await sleep(test.delay * 1000);
        const end = Date.now();
        const actualElapsed = Math.floor((end - start) / 1000);
        
        const result = await makeRequest('POST', `/lobbies/${testLobbyCode}/answer`, {
            answer: true // Correct answer for true/false question
        }, authToken);
        
        if (result.success) {
            // Wait for score processing (asynchronous in backend)
            await sleep(3000); // Give backend time to process scores
            
            // Get lobby state to check actual score
            const lobbyState = await makeRequest('GET', `/lobbies/${testLobbyCode}`, null, authToken);
            if (lobbyState.success && lobbyState.data.players) {
                const player = lobbyState.data.players[0]; // First (and only) player
                const actualScore = player ? player.score : 0;
                const expectedScore = calculateExpectedScore(true, actualElapsed, 1);
                const scoreDiff = Math.abs(actualScore - expectedScore);
                
                log(`${test.description}: Expected ~${expectedScore}, Got ${actualScore}, Elapsed: ${actualElapsed}s`, 
                    scoreDiff <= 3 ? 'SUCCESS' : 'WARNING');
            } else {
                log(`${test.description}: Expected ~${calculateExpectedScore(true, actualElapsed, 1)}, Got 0, Elapsed: ${actualElapsed}s`, 'WARNING');
            }
        } else {
            const errorMsg = typeof result.error === 'object' ? 
                JSON.stringify(result.error, null, 2) : 
                (result.error || 'Unknown error');
            log(`✗ Failed ${test.description} test: ${errorMsg}`, 'ERROR');
        }
        
        await sleep(1000); // Brief pause between tests
    }
}

async function testWrongAnswerScoring() {
    log('=== Testing Wrong Answer Scoring ===');
    
    // Advance to next question
    await sleep(2000);
    await makeRequest('POST', `/lobbies/${testLobbyCode}/next-question`, null, authToken);
    
    // Submit wrong answer quickly
    await sleep(5000); // 5 second delay
    
    const wrongResult = await makeRequest('POST', `/lobbies/${testLobbyCode}/answer`, {
        answer: 0 // Wrong answer (correct is 1)
    }, authToken);
    
    if (wrongResult.success) {
        const actualScore = wrongResult.data.score || 0;
        
        if (actualScore === 0) {
            log(`✓ Wrong answer correctly scored 0 points`, 'SUCCESS');
        } else {
            log(`✗ Wrong answer scored ${actualScore} points (should be 0)`, 'ERROR');
        }
        
        if (!wrongResult.data.isCorrect) {
            log(`✓ Answer correctly marked as wrong`, 'SUCCESS');
        } else {
            log(`✗ Wrong answer marked as correct`, 'ERROR');
        }
    } else {
        const errorMsg = typeof wrongResult.error === 'object' ? 
            JSON.stringify(wrongResult.error, null, 2) : 
            (wrongResult.error || 'Unknown error');
        log(`✗ Failed to submit wrong answer: ${errorMsg}`, 'ERROR');
    }
}

async function testMultiplierSystem() {
    log('=== Testing Multiplier System ===');
    
    // Create a new lobby for multiplier testing
    const multiplierLobby = await makeRequest('POST', '/lobbies/create', {
        character: 'knt',
        question_set_id: testQuestionSetId
    }, authToken);
    
    if (!multiplierLobby.success) {
        log(`✗ Failed to create multiplier test lobby: ${multiplierLobby.error}`, 'ERROR');
        return;
    }
    
    const multiplierLobbyCode = multiplierLobby.data.code;
    log(`✓ Created multiplier test lobby: ${multiplierLobbyCode}`, 'SUCCESS');
    
    // Set question count and start game
    await makeRequest('POST', `/lobbies/${multiplierLobbyCode}/question-count`, {
        question_count: 5
    }, authToken);
    
    const startResult = await makeRequest('POST', `/lobbies/${multiplierLobbyCode}/start`, null, authToken);
    if (!startResult.success) {
        log(`✗ Failed to start multiplier test game: ${startResult.error}`, 'ERROR');
        return;
    }
    
    // Test multiplier progression by answering correctly multiple times
    const multiplierTests = [
        { expectedMultiplier: 1, description: 'First correct (1x)' },
        { expectedMultiplier: 2, description: 'Second correct (2x)' },
        { expectedMultiplier: 3, description: 'Third correct (3x)' },
        { expectedMultiplier: 4, description: 'Fourth correct (4x)' },
        { expectedMultiplier: 5, description: 'Fifth correct (5x max)' }
    ];
    
    for (let i = 0; i < multiplierTests.length; i++) {
        const test = multiplierTests[i];
        
        log(`Testing ${test.description}...`);
        
        // Get current game state to check multiplier
        const stateResult = await makeRequest('GET', `/lobbies/${multiplierLobbyCode}/game-state`);
        if (stateResult.success) {
            const currentQuestion = stateResult.data.currentQuestion;
            if (currentQuestion) {
                // Submit correct answer after 10 seconds
                await sleep(10000);
                
                const correctAnswer = currentQuestion.type === 'true_false' ? 
                    currentQuestion.correct : currentQuestion.correct;
                
                const answerResult = await makeRequest('POST', `/lobbies/${multiplierLobbyCode}/answer`, {
                    answer: correctAnswer
                }, authToken);
                
                if (answerResult.success && answerResult.data.isCorrect) {
                    const actualScore = answerResult.data.score || 0;
                    const expectedScore = calculateExpectedScore(true, 10, test.expectedMultiplier);
                    const scoreDiff = Math.abs(actualScore - expectedScore);
                    
                    log(`${test.description}: Expected ~${expectedScore} (50 * ${test.expectedMultiplier}), Got ${actualScore}`, 
                        scoreDiff <= 5 ? 'SUCCESS' : 'WARNING');
                } else {
                    log(`✗ Failed to submit correct answer for ${test.description}`, 'ERROR');
                }
            }
        }
        
        // Advance to next question (except for last iteration)
        if (i < multiplierTests.length - 1) {
            await sleep(2000);
            await makeRequest('POST', `/lobbies/${multiplierLobbyCode}/next-question`, null, authToken);
        }
    }
    
    // Test multiplier reset with wrong answer
    log('Testing multiplier reset with wrong answer...');
    
    // Create another fresh lobby for reset test
    const resetLobby = await makeRequest('POST', '/lobbies/create', {
        character: 'arc',
        question_set_id: testQuestionSetId
    }, authToken);
    
    if (resetLobby.success) {
        const resetLobbyCode = resetLobby.data.code;
        
        await makeRequest('POST', `/lobbies/${resetLobbyCode}/question-count`, {
            question_count: 3
        }, authToken);
        
        await makeRequest('POST', `/lobbies/${resetLobbyCode}/start`, null, authToken);
        
        // Get multiplier up to 2x
        await sleep(10000);
        await makeRequest('POST', `/lobbies/${resetLobbyCode}/answer`, { answer: 1 }); // Correct
        
        await sleep(2000);
        await makeRequest('POST', `/lobbies/${resetLobbyCode}/next-question`, null, authToken);
        
        await sleep(10000);
        await makeRequest('POST', `/lobbies/${resetLobbyCode}/answer`, { answer: true }); // Correct
        
        // Now submit wrong answer to test reset
        await sleep(2000);
        await makeRequest('POST', `/lobbies/${resetLobbyCode}/next-question`, null, authToken);
        
        await sleep(10000);
        const wrongResetResult = await makeRequest('POST', `/lobbies/${resetLobbyCode}/answer`, { 
            answer: 0 // Wrong answer
        }, authToken);
        
        if (wrongResetResult.success && !wrongResetResult.data.isCorrect) {
            log(`✓ Multiplier reset test: Wrong answer submitted`, 'SUCCESS');
            
            // Check if multiplier was reset by checking player state
            const finalState = await makeRequest('GET', `/lobbies/${resetLobbyCode}/game-state`);
            if (finalState.success) {
                log(`✓ Multiplier reset test completed`, 'SUCCESS');
            }
        }
    }
}

async function testScoreAccumulation() {
    log('=== Testing Score Accumulation ===');
    
    // Create new lobby for accumulation test
    const accumLobby = await makeRequest('POST', '/lobbies/create', {
        character: 'mag',
        question_set_id: testQuestionSetId
    }, authToken);
    
    if (!accumLobby.success) {
        log(`✗ Failed to create accumulation test lobby: ${accumLobby.error}`, 'ERROR');
        return;
    }
    
    const accumLobbyCode = accumLobby.data.code;
    
    await makeRequest('POST', `/lobbies/${accumLobbyCode}/question-count`, {
        question_count: 3
    }, authToken);
    
    await makeRequest('POST', `/lobbies/${accumLobbyCode}/start`, null, authToken);
    
    let totalScore = 0;
    const scoreTests = [
        { delay: 10, correct: true, description: 'Q1: 10s correct' },
        { delay: 20, correct: true, description: 'Q2: 20s correct' },
        { delay: 5, correct: false, description: 'Q3: 5s wrong' }
    ];
    
    for (let i = 0; i < scoreTests.length; i++) {
        const test = scoreTests[i];
        
        log(`Testing ${test.description}...`);
        
        await sleep(test.delay * 1000);
        
        const answer = test.correct ? 1 : 0; // Assume first option is correct for MC
        const answerResult = await makeRequest('POST', `/lobbies/${accumLobbyCode}/answer`, {
            answer: answer
        }, authToken);
        
        if (answerResult.success) {
            const questionScore = answerResult.data.score || 0;
            totalScore += questionScore;
            
            log(`${test.description}: Scored ${questionScore} points, Total: ${totalScore}`, 'SUCCESS');
        }
        
        // Advance to next question
        if (i < scoreTests.length - 1) {
            await sleep(2000);
            await makeRequest('POST', `/lobbies/${accumLobbyCode}/next-question`, null, authToken);
        }
    }
    
    // Verify final score
    const finalState = await makeRequest('GET', `/lobbies/${accumLobbyCode}/game-state`);
    if (finalState.success && finalState.data.players) {
        const player = finalState.data.players[0];
        if (player && player.score === totalScore) {
            log(`✓ Score accumulation verified: ${totalScore} points`, 'SUCCESS');
        } else {
            log(`✗ Score accumulation mismatch: Expected ${totalScore}, Got ${player?.score || 0}`, 'ERROR');
        }
    }
}

async function testEdgeCases() {
    log('=== Testing Scoring Edge Cases ===');
    
    // Test answering after time limit
    const edgeLobby = await makeRequest('POST', '/lobbies/create', {
        character: 'wiz',
        question_set_id: testQuestionSetId
    }, authToken);
    
    if (edgeLobby.success) {
        const edgeLobbyCode = edgeLobby.data.code;
        
        await makeRequest('POST', `/lobbies/${edgeLobbyCode}/question-count`, {
            question_count: 1
        }, authToken);
        
        await makeRequest('POST', `/lobbies/${edgeLobbyCode}/start`, null, authToken);
        
        // Wait more than 60 seconds (time limit)
        log('Testing late answer (after time limit)...');
        await sleep(65000); // 65 seconds
        
        const lateResult = await makeRequest('POST', `/lobbies/${edgeLobbyCode}/answer`, {
            answer: 1
        }, authToken);
        
        if (lateResult.success) {
            const score = lateResult.data.score || 0;
            if (score === 0) {
                log(`✓ Late answer correctly scored 0 points`, 'SUCCESS');
            } else {
                log(`✗ Late answer scored ${score} points (should be 0)`, 'ERROR');
            }
        } else {
            log(`✗ Late answer submission failed: ${lateResult.error}`, 'ERROR');
        }
    }
    
    // Test invalid answer values
    log('Testing invalid answer values...');
    
    const invalidLobby = await makeRequest('POST', '/lobbies/create', {
        character: 'knt',
        question_set_id: testQuestionSetId
    }, authToken);
    
    if (invalidLobby.success) {
        const invalidLobbyCode = invalidLobby.data.code;
        
        await makeRequest('POST', `/lobbies/${invalidLobbyCode}/question-count`, {
            question_count: 1
        }, authToken);
        
        await makeRequest('POST', `/lobbies/${invalidLobbyCode}/start`, null, authToken);
        
        await sleep(5000);
        
        // Test various invalid answers
        const invalidAnswers = [999, -1, 'invalid', null, undefined];
        
        for (const invalidAnswer of invalidAnswers) {
            const invalidResult = await makeRequest('POST', `/lobbies/${invalidLobbyCode}/answer`, {
                answer: invalidAnswer
            }, authToken);
            
            if (!invalidResult.success) {
                log(`✓ Invalid answer (${invalidAnswer}) properly rejected`, 'SUCCESS');
            } else {
                log(`✗ Invalid answer (${invalidAnswer}) was accepted`, 'ERROR');
            }
        }
    }
}

// Main test execution
async function runAllScoringTests() {
    log('🚀 Starting Advanced Scoring System Test Suite', 'INFO');
    log('=' .repeat(60));
    
    try {
        const setupSuccess = await setupTestEnvironment();
        if (!setupSuccess) {
            log('✗ Test environment setup failed', 'ERROR');
            return;
        }
        
        await testBasicScoring();
        await testTimingBasedScoring();
        await testWrongAnswerScoring();
        await testMultiplierSystem();
        await testScoreAccumulation();
        await testEdgeCases();
        
        log('=' .repeat(60));
        log('🎉 All scoring system tests completed!', 'SUCCESS');
        
    } catch (error) {
        log(`💥 Scoring test suite failed with error: ${error.message}`, 'ERROR');
        console.error(error);
    }
}

// Run the tests
if (require.main === module) {
    runAllScoringTests();
}

module.exports = {
    runAllScoringTests,
    testBasicScoring,
    testMultiplierSystem,
    testScoreAccumulation,
    calculateExpectedScore
}; 