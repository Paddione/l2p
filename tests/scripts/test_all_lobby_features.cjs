#!/usr/bin/env node

/**
 * Comprehensive Lobby Functionality Test Suite
 * Tests all lobby features and API endpoints
 */

require('dotenv').config();
const axios = require('axios');

// Configuration from environment variables
const BASE_URL = `http://${process.env.LOCAL_IP || '10.0.0.44'}`;
const API_BASE = `${BASE_URL}/api`;

// Test users
const TEST_USERS = [
    { username: 'host_player', character: 'wiz' },
    { username: 'player_1', character: 'knt' },
    { username: 'player_2', character: 'arc' },
    { username: 'player_3', character: 'mag' }
];

// Test data
let authTokens = {};
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

// Test functions
async function testUserRegistration() {
    log('=== Testing User Registration ===');
    
    for (const user of TEST_USERS) {
        log(`Registering user: ${user.username}`);
        
        const result = await makeRequest('POST', '/auth/register', {
            username: user.username,
            password: 'testpass123',
            character: user.character
        });

        if (result.success) {
            log(`✓ User ${user.username} registered successfully`, 'SUCCESS');
            authTokens[user.username] = result.data.token;
        } else if (result.status === 409) {
            log(`User ${user.username} already exists, logging in...`, 'WARNING');
            const loginResult = await makeRequest('POST', '/auth/login', {
                username: user.username,
                password: 'testpass123'
            });
            if (loginResult.success) {
                authTokens[user.username] = loginResult.data.token;
                log(`✓ User ${user.username} logged in successfully`, 'SUCCESS');
            } else {
                log(`✗ Failed to login user ${user.username}: ${loginResult.fullError || loginResult.error}`, 'ERROR');
            }
        } else {
            log(`✗ Failed to register user ${user.username}: ${result.fullError || result.error}`, 'ERROR');
        }
    }
}

async function testAuthenticationEdgeCases() {
    log('=== Testing Authentication Edge Cases ===');
    
    // Test invalid login credentials
    const invalidLoginResult = await makeRequest('POST', '/auth/login', {
        username: 'nonexistent_user',
        password: 'wrongpassword'
    });
    
    if (!invalidLoginResult.success && invalidLoginResult.status === 401) {
        log(`✓ Invalid login credentials handled correctly`, 'SUCCESS');
    } else {
        log(`✗ Invalid login not handled properly`, 'ERROR');
    }
    
    // Test registration with invalid data
    const invalidRegResult = await makeRequest('POST', '/auth/register', {
        username: '', // Empty username
        password: '123', // Too short password
        character: 'invalid'
    });
    
    if (!invalidRegResult.success && invalidRegResult.status === 400) {
        log(`✓ Invalid registration data handled correctly`, 'SUCCESS');
    } else {
        log(`✗ Invalid registration data not handled properly`, 'ERROR');
    }
    
    // Test token refresh functionality
    if (authTokens.host_player) {
        const refreshResult = await makeRequest('POST', '/auth/refresh', {
            refreshToken: 'invalid_refresh_token'
        });
        
        if (!refreshResult.success && refreshResult.status === 401) {
            log(`✓ Invalid refresh token handled correctly`, 'SUCCESS');
        } else {
            log(`✗ Invalid refresh token not handled properly`, 'ERROR');
        }
    }
}

async function testQuestionSetCreation() {
    log('=== Testing Question Set Creation ===');
    
    const questionSet = {
        name: 'Test Question Set ' + Date.now(),
        description: 'A test question set for lobby testing',
        questions: [
            {
                question: 'What is 2 + 2?',
                options: ['3', '4', '5', '6'],
                correct: 1,
                type: 'multiple_choice'
            },
            {
                question: 'Is the sky blue?',
                correct: true,
                type: 'true_false'
            },
            {
                question: 'What is the capital of France?',
                options: ['London', 'Berlin', 'Paris', 'Madrid'],
                correct: 2,
                type: 'multiple_choice'
            },
            {
                question: 'Is 10 > 5?',
                correct: true,
                type: 'true_false'
            },
            {
                question: 'What is 3 × 3?',
                options: ['6', '8', '9', '12'],
                correct: 2,
                type: 'multiple_choice'
            }
        ]
    };

    const result = await makeRequest('POST', '/question-sets', questionSet, authTokens.host_player);
    
    if (result.success) {
        testQuestionSetId = result.data.id;
        log(`✓ Question set created with ID: ${testQuestionSetId}`, 'SUCCESS');
    } else {
        log(`✗ Failed to create question set: ${result.fullError || result.error}`, 'ERROR');
    }
}

async function testQuestionSetManagement() {
    log('=== Testing Question Set Management ===');
    
    // Test listing question sets
    const listResult = await makeRequest('GET', '/question-sets', null, authTokens.host_player);
    if (listResult.success) {
        log(`✓ Retrieved ${listResult.data.length} question sets`, 'SUCCESS');
    } else {
        log(`✗ Failed to list question sets: ${listResult.error}`, 'ERROR');
    }
    
    // Test getting specific question set
    if (testQuestionSetId) {
        const getResult = await makeRequest('GET', `/question-sets/${testQuestionSetId}`, null, authTokens.host_player);
        if (getResult.success) {
            log(`✓ Retrieved question set details`, 'SUCCESS');
        } else {
            log(`✗ Failed to get question set: ${getResult.error}`, 'ERROR');
        }
    }
    
    // Test question set validation with invalid data
    const invalidQSResult = await makeRequest('POST', '/question-sets', {
        name: '', // Empty name
        questions: [] // No questions
    }, authTokens.host_player);
    
    if (!invalidQSResult.success && invalidQSResult.status === 400) {
        log(`✓ Invalid question set data handled correctly`, 'SUCCESS');
    } else {
        log(`✗ Invalid question set validation failed`, 'ERROR');
    }
}

async function testLobbyCreation() {
    log('=== Testing Lobby Creation ===');
    
    // Test basic lobby creation
    const result = await makeRequest('POST', '/lobbies/create', {
        character: TEST_USERS[0].character
    }, authTokens.host_player);

    if (result.success) {
        testLobbyCode = result.data.code;
        log(`✓ Lobby created successfully with code: ${testLobbyCode}`, 'SUCCESS');
        log(`Lobby data: ${JSON.stringify(result.data, null, 2)}`);
    } else {
        log(`✗ Failed to create lobby: ${result.error}`, 'ERROR');
        return false;
    }

    // Test lobby creation with question set
    const resultWithQuestionSet = await makeRequest('POST', '/lobbies/create', {
        character: TEST_USERS[0].character,
        question_set_id: testQuestionSetId
    }, authTokens.host_player);

    if (resultWithQuestionSet.success) {
        log(`✓ Lobby with question set created successfully`, 'SUCCESS');
    } else {
        log(`✗ Failed to create lobby with question set: ${resultWithQuestionSet.error}`, 'ERROR');
    }

    return true;
}

async function testLobbyListing() {
    log('=== Testing Lobby Listing ===');
    
    const result = await makeRequest('GET', '/lobbies/list', null, authTokens.host_player);
    
    if (result.success) {
        log(`✓ Retrieved ${result.data.length} active lobbies`, 'SUCCESS');
        if (result.data.length > 0) {
            log(`Sample lobby: ${JSON.stringify(result.data[0], null, 2)}`);
        }
    } else {
        log(`✗ Failed to list lobbies: ${result.error}`, 'ERROR');
    }
}

async function testLobbyRetrieval() {
    log('=== Testing Lobby Retrieval ===');
    
    const result = await makeRequest('GET', `/lobbies/${testLobbyCode}`, null, authTokens.host_player);
    
    if (result.success) {
        log(`✓ Retrieved lobby data successfully`, 'SUCCESS');
        log(`Lobby details: ${JSON.stringify(result.data, null, 2)}`);
    } else {
        log(`✗ Failed to retrieve lobby: ${result.error}`, 'ERROR');
    }
}

async function testPlayerJoining() {
    log('=== Testing Player Joining ===');
    
    for (let i = 1; i < TEST_USERS.length; i++) {
        const user = TEST_USERS[i];
        log(`Player ${user.username} joining lobby ${testLobbyCode}`);
        
        const result = await makeRequest('POST', `/lobbies/${testLobbyCode}/join`, {
            character: user.character
        }, authTokens[user.username]);

        if (result.success) {
            log(`✓ Player ${user.username} joined successfully`, 'SUCCESS');
        } else {
            log(`✗ Failed to join lobby: ${result.error}`, 'ERROR');
        }
        
        await sleep(500); // Small delay between joins
    }
}

async function testPlayerReadyStatus() {
    log('=== Testing Player Ready Status ===');
    
    for (let i = 1; i < TEST_USERS.length; i++) {
        const user = TEST_USERS[i];
        log(`Setting ${user.username} as ready`);
        
        const result = await makeRequest('POST', `/lobbies/${testLobbyCode}/ready`, {
            ready: true
        }, authTokens[user.username]);

        if (result.success) {
            log(`✓ Player ${user.username} set as ready`, 'SUCCESS');
        } else {
            log(`✗ Failed to set ready status: ${result.error}`, 'ERROR');
        }
    }
}

async function testLobbyQuestionSetManagement() {
    log('=== Testing Question Set Management ===');
    
    // Set question set
    const setResult = await makeRequest('POST', `/lobbies/${testLobbyCode}/question-set`, {
        question_set_id: testQuestionSetId
    }, authTokens.host_player);

    if (setResult.success) {
        log(`✓ Question set assigned to lobby`, 'SUCCESS');
    } else {
        log(`✗ Failed to set question set: ${setResult.error}`, 'ERROR');
    }

    // Set question count
    const countResult = await makeRequest('POST', `/lobbies/${testLobbyCode}/question-count`, {
        question_count: 3
    }, authTokens.host_player);

    if (countResult.success) {
        log(`✓ Question count set to 3`, 'SUCCESS');
    } else {
        log(`✗ Failed to set question count: ${countResult.error}`, 'ERROR');
    }
}

async function testGameStart() {
    log('=== Testing Game Start ===');
    
    const result = await makeRequest('POST', `/lobbies/${testLobbyCode}/start`, {}, authTokens.host_player);
    
    if (result.success) {
        log(`✓ Game started successfully`, 'SUCCESS');
        log(`Game data: ${JSON.stringify(result.data, null, 2)}`);
    } else {
        log(`✗ Failed to start game: ${result.error}`, 'ERROR');
    }
}

async function testGameStateRetrieval() {
    log('=== Testing Game State Retrieval ===');
    
    const result = await makeRequest('GET', `/lobbies/${testLobbyCode}/game-state`, null, authTokens.host_player);
    
    if (result.success) {
        log(`✓ Game state retrieved successfully`, 'SUCCESS');
        log(`Current question: ${result.data.current_question}`);
        log(`Game phase: ${result.data.game_phase}`);
        log(`Time remaining: ${result.data.timing?.timeRemaining || 'N/A'}`);
    } else {
        log(`✗ Failed to retrieve game state: ${result.error}`, 'ERROR');
    }
}

async function testScoringSystem() {
    log('=== Testing Scoring System ===');
    
    // Test different timing scenarios for scoring
    const scoringTests = [
        { answer: 1, delay: 5, expected: 'high score (fast answer)' },
        { answer: 1, delay: 15, expected: 'medium score' },
        { answer: 1, delay: 45, expected: 'low score (slow answer)' },
        { answer: 0, delay: 10, expected: 'zero score (wrong answer)' }
    ];
    
    for (let i = 0; i < scoringTests.length && i < TEST_USERS.length; i++) {
        const user = TEST_USERS[i];
        const test = scoringTests[i];
        
        // Simulate delay
        await sleep(test.delay * 1000);
        
        log(`Player ${user.username} submitting answer after ${test.delay}s: ${test.expected}`);
        
        const result = await makeRequest('POST', `/lobbies/${testLobbyCode}/answer`, {
            answer: test.answer
        }, authTokens[user.username]);

        if (result.success) {
            log(`✓ Answer submitted: Correct=${result.data.isCorrect}, Score=${result.data.score || 'N/A'}`, 'SUCCESS');
        } else {
            log(`✗ Failed to submit answer: ${result.error}`, 'ERROR');
        }
    }
}

async function testAnswerSubmission() {
    log('=== Testing Answer Submission ===');
    
    // Submit answers for all players
    for (let i = 0; i < TEST_USERS.length; i++) {
        const user = TEST_USERS[i];
        const answer = i % 2; // Alternate between 0 and 1 for variety
        
        log(`Player ${user.username} submitting answer: ${answer}`);
        
        const result = await makeRequest('POST', `/lobbies/${testLobbyCode}/answer`, {
            answer: answer
        }, authTokens[user.username]);

        if (result.success) {
            log(`✓ Answer submitted by ${user.username}`, 'SUCCESS');
            log(`Correct: ${result.data.isCorrect}, All answered: ${result.data.allAnswered}`);
        } else {
            log(`✗ Failed to submit answer: ${result.error}`, 'ERROR');
        }
        
        await sleep(200); // Small delay between submissions
    }
}

async function testQuestionProgression() {
    log('=== Testing Question Progression ===');
    
    // Wait for auto-progression or manually advance
    await sleep(2000);
    
    const result = await makeRequest('POST', `/lobbies/${testLobbyCode}/next-question`, {}, authTokens.host_player);
    
    if (result.success) {
        log(`✓ Advanced to next question`, 'SUCCESS');
    } else {
        log(`Question progression result: ${result.error}`, 'WARNING');
    }
}

async function testHallOfFameSystem() {
    log('=== Testing Hall of Fame System ===');
    
    // Test getting hall of fame entries
    const listResult = await makeRequest('GET', '/hall-of-fame', null, authTokens.host_player);
    if (listResult.success) {
        log(`✓ Retrieved hall of fame entries: ${listResult.data.entries.length} entries`, 'SUCCESS');
    } else {
        log(`✗ Failed to get hall of fame entries: ${listResult.error}`, 'ERROR');
    }
    
    // Test adding a hall of fame entry
    const entryData = {
        score: 1250,
        questions: 5,
        accuracy: 80.0,
        maxMultiplier: 4,
        catalogName: 'Test Catalog'
    };
    
    const addResult = await makeRequest('POST', '/hall-of-fame', entryData, authTokens.host_player);
    if (addResult.success) {
        log(`✓ Added hall of fame entry successfully`, 'SUCCESS');
    } else {
        log(`✗ Failed to add hall of fame entry: ${addResult.error}`, 'ERROR');
    }
    
    // Test getting catalog-specific leaderboard
    const leaderboardResult = await makeRequest('GET', '/hall-of-fame/leaderboard/Test%20Catalog', null, authTokens.host_player);
    if (leaderboardResult.success) {
        log(`✓ Retrieved catalog leaderboard: ${leaderboardResult.data.leaderboard.length} entries`, 'SUCCESS');
    } else {
        log(`✗ Failed to get catalog leaderboard: ${leaderboardResult.error}`, 'ERROR');
    }
    
    // Test getting statistics
    const statsResult = await makeRequest('GET', '/hall-of-fame/stats', null, authTokens.host_player);
    if (statsResult.success) {
        log(`✓ Retrieved hall of fame statistics`, 'SUCCESS');
    } else {
        log(`✗ Failed to get hall of fame statistics: ${statsResult.error}`, 'ERROR');
    }
}

async function testLobbyUpdate() {
    log('=== Testing Lobby Update ===');
    
    const updateData = {
        catalog: 'Updated Test Catalog'
    };
    
    const result = await makeRequest('PUT', `/lobbies/${testLobbyCode}`, updateData, authTokens.host_player);
    
    if (result.success) {
        log(`✓ Lobby updated successfully`, 'SUCCESS');
    } else {
        log(`✗ Failed to update lobby: ${result.error}`, 'ERROR');
    }
}

async function testPlayerLeaving() {
    log('=== Testing Player Leaving ===');
    
    // Have one player leave
    const leavingPlayer = TEST_USERS[TEST_USERS.length - 1];
    log(`Player ${leavingPlayer.username} leaving lobby`);
    
    const result = await makeRequest('POST', `/lobbies/${testLobbyCode}/leave`, {}, authTokens[leavingPlayer.username]);
    
    if (result.success) {
        if (result.data.closed) {
            log(`✓ Lobby was closed (no players remaining)`, 'SUCCESS');
        } else {
            log(`✓ Player left successfully`, 'SUCCESS');
        }
    } else {
        log(`✗ Failed to leave lobby: ${result.error}`, 'ERROR');
    }
}

async function testLobbyDeletion() {
    log('=== Testing Lobby Deletion ===');
    
    const result = await makeRequest('DELETE', `/lobbies/${testLobbyCode}`, null, authTokens.host_player);
    
    if (result.success) {
        log(`✓ Lobby deleted successfully`, 'SUCCESS');
    } else {
        log(`✗ Failed to delete lobby: ${result.error}`, 'ERROR');
    }
}

async function testDebugEndpoint() {
    log('=== Testing Debug Endpoint ===');
    
    // Create a new lobby for debug testing
    const createResult = await makeRequest('POST', '/lobbies/create', {
        character: TEST_USERS[0].character
    }, authTokens.host_player);

    if (createResult.success) {
        const debugLobbyCode = createResult.data.code;
        
        const result = await makeRequest('GET', `/lobbies/${debugLobbyCode}/debug`, null, authTokens.host_player);
        
        if (result.success) {
            log(`✓ Debug endpoint working`, 'SUCCESS');
            log(`Debug data: ${JSON.stringify(result.data, null, 2)}`);
        } else {
            log(`✗ Debug endpoint failed: ${result.error}`, 'ERROR');
        }
        
        // Clean up debug lobby
        await makeRequest('DELETE', `/lobbies/${debugLobbyCode}`, null, authTokens.host_player);
    }
}

async function testCleanupEndpoint() {
    log('=== Testing Cleanup Endpoint ===');
    
    const result = await makeRequest('POST', '/lobbies/cleanup', {}, authTokens.host_player);
    
    if (result.success) {
        log(`✓ Cleanup completed: ${result.data.cleaned} lobbies cleaned`, 'SUCCESS');
    } else {
        log(`✗ Cleanup failed: ${result.error}`, 'ERROR');
    }
}

async function testErrorHandling() {
    log('=== Testing Error Handling ===');
    
    // Test invalid lobby code
    const invalidResult = await makeRequest('GET', '/lobbies/INVALID', null, authTokens.host_player);
    if (!invalidResult.success && invalidResult.status === 404) {
        log(`✓ Invalid lobby code handled correctly`, 'SUCCESS');
    } else {
        log(`✗ Invalid lobby code not handled properly`, 'ERROR');
    }
    
    // Test joining non-existent lobby
    const joinInvalidResult = await makeRequest('POST', '/lobbies/INVALID/join', {
        character: 'wizard'
    }, authTokens.host_player);
    if (!joinInvalidResult.success && joinInvalidResult.status === 404) {
        log(`✓ Joining invalid lobby handled correctly`, 'SUCCESS');
    } else {
        log(`✗ Joining invalid lobby not handled properly`, 'ERROR');
    }
    
    // Test unauthorized access
    const unauthorizedResult = await makeRequest('GET', '/lobbies/list', null, 'invalid_token');
    if (!unauthorizedResult.success && (unauthorizedResult.status === 401 || unauthorizedResult.status === 403)) {
        log(`✓ Unauthorized access handled correctly`, 'SUCCESS');
    } else {
        log(`✗ Unauthorized access not handled properly`, 'ERROR');
        log(`  Expected: success=false, status=401 or 403`, 'ERROR');
        log(`  Got: success=${unauthorizedResult.success}, status=${unauthorizedResult.status}`, 'ERROR');
    }
}

async function testAPIHealthAndReadiness() {
    log('=== Testing API Health and Readiness ===');
    
    // Test health endpoint
    const healthResult = await makeRequest('GET', '/health');
    if (healthResult.success) {
        log(`✓ Health endpoint working: ${JSON.stringify(healthResult.data)}`, 'SUCCESS');
    } else {
        log(`✗ Health endpoint failed: ${healthResult.error}`, 'ERROR');
    }
    
    // Test readiness (database connectivity)
    const readinessResult = await makeRequest('GET', '/ready');
    if (readinessResult.success) {
        log(`✓ Readiness endpoint working`, 'SUCCESS');
    } else {
        log(`✗ Readiness endpoint failed: ${readinessResult.error}`, 'ERROR');
    }
}

// Main test execution
async function runAllTests() {
    log('🚀 Starting Comprehensive Lobby Functionality Test Suite', 'INFO');
    log('=' .repeat(60));
    
    try {
        await testAPIHealthAndReadiness();
        await testUserRegistration();
        await testAuthenticationEdgeCases();
        await testQuestionSetCreation();
        await testQuestionSetManagement();
        await testLobbyCreation();
        await testLobbyListing();
        await testLobbyRetrieval();
        await testPlayerJoining();
        await testPlayerReadyStatus();
        await testLobbyQuestionSetManagement();
        await testGameStart();
        await testGameStateRetrieval();
        await testScoringSystem();
        await testAnswerSubmission();
        await testQuestionProgression();
        await testHallOfFameSystem();
        await testLobbyUpdate();
        await testPlayerLeaving();
        await testLobbyDeletion();
        await testDebugEndpoint();
        await testCleanupEndpoint();
        await testErrorHandling();
        
        log('=' .repeat(60));
        log('🎉 All lobby functionality tests completed!', 'SUCCESS');
        
    } catch (error) {
        log(`💥 Test suite failed with error: ${error.message}`, 'ERROR');
        console.error(error);
    }
}

// Run the tests
if (require.main === module) {
    runAllTests();
}

module.exports = {
    runAllTests,
    testUserRegistration,
    testLobbyCreation,
    testGameStart,
    testHallOfFameSystem,
    makeRequest
};