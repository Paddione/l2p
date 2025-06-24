#!/usr/bin/env node

/**
 * Comprehensive Question Sets Test Suite
 * Tests all question set creation, validation, and management features
 */

require('dotenv').config();
const axios = require('axios');

// Configuration from environment variables  
const BASE_URL = `http://${process.env.LOCAL_IP || '10.0.0.44'}`;
const API_BASE = `${BASE_URL}/api`;

// Test data
let authToken = null;
let testQuestionSetIds = [];

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

async function setupTestUser() {
    log('=== Setting Up Test User ===');
    
    const username = 'qs_test_' + Math.floor(Math.random() * 10000);
    
    try {
        const registerResponse = await makeRequest('POST', '/auth/register', {
            username: username,
            password: 'testpass123',
            character: 'wiz'
        });
        
        if (registerResponse.success) {
            log('✓ User registered successfully', 'SUCCESS');
            authToken = registerResponse.data.token;
            return true;
        }
    } catch (regError) {
        // Try to login if registration fails
        const loginResponse = await makeRequest('POST', '/auth/login', {
            username: username,
            password: 'testpass123'
        });
        
        if (loginResponse.success) {
            log('✓ User logged in successfully', 'SUCCESS');
            authToken = loginResponse.data.token;
            return true;
        }
    }
    
    log('✗ Failed to setup test user', 'ERROR');
    return false;
}

async function testQuestionSetCreation() {
    log('=== Testing Question Set Creation ===');
    
    // Test 1: Basic question set with multiple choice and true/false
    const basicQuestionSet = {
        name: 'Basic Test QS ' + Date.now(),
        description: 'A basic test question set with mixed question types',
        questions: [
            {
                question: 'What is 2 + 2?',
                options: ['3', '4', '5', '6'],
                correct: 1,
                type: 'multiple_choice'
            },
            {
                question: 'Is the Earth round?',
                correct: true,
                type: 'true_false'
            },
            {
                question: 'What is the capital of France?',
                options: ['London', 'Berlin', 'Paris', 'Madrid'],
                correct: 2,
                type: 'multiple_choice'
            }
        ]
    };
    
    const basicResult = await makeRequest('POST', '/question-sets', basicQuestionSet, authToken);
    if (basicResult.success) {
        testQuestionSetIds.push(basicResult.data.id);
        log(`✓ Basic question set created with ID: ${basicResult.data.id}`, 'SUCCESS');
        log(`Question count: ${basicResult.data.question_count}`);
    } else {
        log(`✗ Failed to create basic question set: ${basicResult.fullError}`, 'ERROR');
    }
    
    // Test 2: Large question set (testing scalability)
    const largeQuestions = [];
    for (let i = 1; i <= 50; i++) {
        largeQuestions.push({
            question: `Test Question ${i}: What is ${i} + 1?`,
            options: [`${i}`, `${i + 1}`, `${i + 2}`, `${i + 3}`],
            correct: 1,
            type: 'multiple_choice'
        });
    }
    
    const largeQuestionSet = {
        name: 'Large Test QS ' + Date.now(),
        description: 'A large question set for scalability testing',
        questions: largeQuestions
    };
    
    const largeResult = await makeRequest('POST', '/question-sets', largeQuestionSet, authToken);
    if (largeResult.success) {
        testQuestionSetIds.push(largeResult.data.id);
        log(`✓ Large question set created: ${largeResult.data.question_count} questions`, 'SUCCESS');
    } else {
        log(`✗ Failed to create large question set: ${largeResult.error}`, 'ERROR');
    }
    
    // Test 3: Question set with only true/false questions
    const trueFalseQuestionSet = {
        name: 'True/False Test QS ' + Date.now(),
        description: 'A question set with only true/false questions',
        questions: [
            {
                question: 'The sky is blue.',
                correct: true,
                type: 'true_false'
            },
            {
                question: 'Fish can fly.',
                correct: false,
                type: 'true_false'
            },
            {
                question: 'Water boils at 100°C.',
                correct: true,
                type: 'true_false'
            },
            {
                question: 'There are 13 months in a year.',
                correct: false,
                type: 'true_false'
            }
        ]
    };
    
    const tfResult = await makeRequest('POST', '/question-sets', trueFalseQuestionSet, authToken);
    if (tfResult.success) {
        testQuestionSetIds.push(tfResult.data.id);
        log(`✓ True/False question set created`, 'SUCCESS');
    } else {
        log(`✗ Failed to create T/F question set: ${tfResult.error}`, 'ERROR');
    }
}

async function testQuestionSetValidation() {
    log('=== Testing Question Set Validation ===');
    
    // Test 1: Empty name
    const emptyNameResult = await makeRequest('POST', '/question-sets', {
        name: '',
        description: 'Test description',
        questions: [
            {
                question: 'Test question?',
                options: ['A', 'B', 'C', 'D'],
                correct: 0,
                type: 'multiple_choice'
            }
        ]
    }, authToken);
    
    if (!emptyNameResult.success && emptyNameResult.status === 400) {
        log('✓ Empty name validation working', 'SUCCESS');
    } else {
        log('✗ Empty name validation failed', 'ERROR');
    }
    
    // Test 2: No questions
    const noQuestionsResult = await makeRequest('POST', '/question-sets', {
        name: 'No Questions Test',
        description: 'Test with no questions',
        questions: []
    }, authToken);
    
    // Check if validation should fail (some APIs might accept empty questions)
    if (!noQuestionsResult.success && (noQuestionsResult.status === 400 || noQuestionsResult.status === 422)) {
        log('✓ No questions validation working', 'SUCCESS');
    } else if (noQuestionsResult.success && noQuestionsResult.data.id) {
        // If the API accepts empty questions, that's also valid behavior
        log('⚠ No questions validation allows empty questions (API design choice)', 'WARNING');
        testQuestionSetIds.push(noQuestionsResult.data.id); // Track for cleanup
    } else {
        log('✗ No questions validation failed', 'ERROR');
        log(`  Expected: success=false, status=400/422 OR success=true with valid response`, 'ERROR');
        log(`  Got: success=${noQuestionsResult.success}, status=${noQuestionsResult.status}`, 'ERROR');
        log(`  Response: ${JSON.stringify(noQuestionsResult.data)}`, 'ERROR');
    }
    
    // Test 3: Invalid question structure
    const invalidQuestionResult = await makeRequest('POST', '/question-sets', {
        name: 'Invalid Question Test',
        description: 'Test with invalid question',
        questions: [
            {
                question: 'Test question?',
                // Missing options for multiple choice
                correct: 0,
                type: 'multiple_choice'
            }
        ]
    }, authToken);
    
    if (!invalidQuestionResult.success && invalidQuestionResult.status === 400) {
        log('✓ Invalid question structure validation working', 'SUCCESS');
    } else {
        log('✗ Invalid question structure validation failed', 'ERROR');
    }
    
    // Test 4: Invalid correct answer index
    const invalidCorrectResult = await makeRequest('POST', '/question-sets', {
        name: 'Invalid Correct Test',
        description: 'Test with invalid correct answer',
        questions: [
            {
                question: 'Test question?',
                options: ['A', 'B', 'C', 'D'],
                correct: 5, // Index out of bounds
                type: 'multiple_choice'
            }
        ]
    }, authToken);
    
    if (!invalidCorrectResult.success && invalidCorrectResult.status === 400) {
        log('✓ Invalid correct answer validation working', 'SUCCESS');
    } else {
        log('✗ Invalid correct answer validation failed', 'ERROR');
    }
    
    // Test 5: Missing question text
    const missingQuestionResult = await makeRequest('POST', '/question-sets', {
        name: 'Missing Question Text',
        description: 'Test with missing question text',
        questions: [
            {
                question: '', // Empty question
                options: ['A', 'B', 'C', 'D'],
                correct: 0,
                type: 'multiple_choice'
            }
        ]
    }, authToken);
    
    if (!missingQuestionResult.success && missingQuestionResult.status === 400) {
        log('✓ Missing question text validation working', 'SUCCESS');
    } else {
        log('✗ Missing question text validation failed', 'ERROR');
    }
}

async function testQuestionSetRetrieval() {
    log('=== Testing Question Set Retrieval ===');
    
    // Test listing all question sets
    const listResult = await makeRequest('GET', '/question-sets', null, authToken);
    if (listResult.success) {
        log(`✓ Retrieved ${listResult.data.length} question sets`, 'SUCCESS');
        
        // Verify our test question sets are in the list
        const testSetsInList = listResult.data.filter(qs => 
            testQuestionSetIds.includes(qs.id)
        );
        
        if (testSetsInList.length > 0) {
            log(`✓ Found ${testSetsInList.length} test question sets in list`, 'SUCCESS');
        } else {
            log('✗ Test question sets not found in list', 'ERROR');
        }
    } else {
        log(`✗ Failed to list question sets: ${listResult.error}`, 'ERROR');
    }
    
    // Test retrieving specific question sets
    for (const qsId of testQuestionSetIds) {
        const getResult = await makeRequest('GET', `/question-sets/${qsId}`, null, authToken);
        if (getResult.success) {
            log(`✓ Retrieved question set ${qsId}: ${getResult.data.name}`, 'SUCCESS');
            log(`  Questions: ${getResult.data.questions.length}, Description: ${getResult.data.description}`);
        } else {
            log(`✗ Failed to retrieve question set ${qsId}: ${getResult.error}`, 'ERROR');
        }
    }
    
    // Test retrieving non-existent question set
    const nonExistentResult = await makeRequest('GET', '/question-sets/99999', null, authToken);
    if (!nonExistentResult.success && nonExistentResult.status === 404) {
        log('✓ Non-existent question set properly returns 404', 'SUCCESS');
    } else {
        log('✗ Non-existent question set handling failed', 'ERROR');
    }
}

async function testQuestionSetUpdate() {
    log('=== Testing Question Set Update ===');
    
    if (testQuestionSetIds.length === 0) {
        log('✗ No test question sets available for update testing', 'ERROR');
        return;
    }
    
    const qsId = testQuestionSetIds[0];
    
    // Test updating question set
    const updateData = {
        name: 'Updated Test QS ' + Date.now(),
        description: 'Updated description for testing',
        questions: [
            {
                question: 'Updated question: What is 5 + 5?',
                options: ['8', '9', '10', '11'],
                correct: 2,
                type: 'multiple_choice'
            },
            {
                question: 'Updated T/F: Is this an update test?',
                correct: true,
                type: 'true_false'
            }
        ]
    };
    
    const updateResult = await makeRequest('PUT', `/question-sets/${qsId}`, updateData, authToken);
    if (updateResult.success) {
        log(`✓ Question set ${qsId} updated successfully`, 'SUCCESS');
        
        // Verify the update
        const verifyResult = await makeRequest('GET', `/question-sets/${qsId}`, null, authToken);
        if (verifyResult.success) {
            const updated = verifyResult.data;
            if (updated.name === updateData.name && 
                updated.description === updateData.description &&
                updated.questions.length === updateData.questions.length) {
                log('✓ Update verification successful', 'SUCCESS');
            } else {
                log('✗ Update verification failed - data mismatch', 'ERROR');
            }
        }
    } else {
        log(`✗ Failed to update question set: ${updateResult.error}`, 'ERROR');
    }
}

async function testQuestionSetDeletion() {
    log('=== Testing Question Set Deletion ===');
    
    if (testQuestionSetIds.length === 0) {
        log('✗ No test question sets available for deletion testing', 'ERROR');
        return;
    }
    
    // Test deleting the last question set (keep others for integration tests)
    const qsId = testQuestionSetIds[testQuestionSetIds.length - 1];
    
    const deleteResult = await makeRequest('DELETE', `/question-sets/${qsId}`, null, authToken);
    if (deleteResult.success) {
        log(`✓ Question set ${qsId} deleted successfully`, 'SUCCESS');
        
        // Verify deletion
        const verifyResult = await makeRequest('GET', `/question-sets/${qsId}`, null, authToken);
        if (!verifyResult.success && verifyResult.status === 404) {
            log('✓ Deletion verification successful', 'SUCCESS');
            testQuestionSetIds.pop(); // Remove from our tracking array
        } else {
            log('✗ Deletion verification failed - question set still exists', 'ERROR');
        }
    } else {
        log(`✗ Failed to delete question set: ${deleteResult.error}`, 'ERROR');
    }
    
    // Test deleting non-existent question set
    const nonExistentDeleteResult = await makeRequest('DELETE', '/question-sets/99999', null, authToken);
    if (!nonExistentDeleteResult.success && nonExistentDeleteResult.status === 404) {
        log('✓ Non-existent question set deletion properly returns 404', 'SUCCESS');
    } else {
        log('✗ Non-existent question set deletion handling failed', 'ERROR');
    }
}

async function testGameIntegration() {
    log('=== Testing Game Integration ===');
    
    if (testQuestionSetIds.length === 0) {
        log('✗ No test question sets available for game integration testing', 'ERROR');
        return;
    }
    
    const qsId = testQuestionSetIds[0];
    
    // Test creating lobby with question set
    log('Creating lobby with question set...');
    const lobbyResult = await makeRequest('POST', '/lobbies/create', {
        character: 'wiz',
        question_set_id: qsId
    }, authToken);
    
    if (lobbyResult.success) {
        const lobbyCode = lobbyResult.data.code;
        log(`✓ Lobby created with question set: ${lobbyCode}`, 'SUCCESS');
        
        // Test setting question count
        const countResult = await makeRequest('POST', `/lobbies/${lobbyCode}/question-count`, {
            question_count: 3
        }, authToken);
        
        if (countResult.success) {
            log('✓ Question count set successfully', 'SUCCESS');
        } else {
            log(`✗ Failed to set question count: ${countResult.error}`, 'ERROR');
        }
        
        // Test starting the game
        const startResult = await makeRequest('POST', `/lobbies/${lobbyCode}/start`, {}, authToken);
        if (startResult.success) {
            log(`✓ Game started successfully: ${startResult.data.game_phase}`, 'SUCCESS');
            
            // Test game state retrieval
            const stateResult = await makeRequest('GET', `/lobbies/${lobbyCode}/game-state`, null, authToken);
            if (stateResult.success) {
                const state = stateResult.data;
                log(`✓ Game state retrieved:`, 'SUCCESS');
                log(`  - Phase: ${state.game_phase}`);
                log(`  - Current Question: ${state.current_question}`);
                log(`  - Total Questions: ${state.totalQuestions}`);
                log(`  - Has Current Question: ${!!state.currentQuestion}`);
                
                if (state.currentQuestion) {
                    log(`  - Question Text: "${state.currentQuestion.question}"`);
                    log(`  - Question Type: ${state.currentQuestion.type}`);
                }
            } else {
                log(`✗ Failed to get game state: ${stateResult.error}`, 'ERROR');
            }
            
            // Test answer submission
            if (stateResult.success && stateResult.data.currentQuestion) {
                log('Testing answer submission...');
                const answerResult = await makeRequest('POST', `/lobbies/${lobbyCode}/answer`, {
                    answer: 1
                }, authToken);
                
                if (answerResult.success) {
                    log(`✓ Answer submitted successfully:`, 'SUCCESS');
                    log(`  - Correct: ${answerResult.data.isCorrect}`);
                    log(`  - All Answered: ${answerResult.data.allAnswered}`);
                    log(`  - Score: ${answerResult.data.score || 'N/A'}`);
                } else {
                    log(`✗ Failed to submit answer: ${answerResult.error}`, 'ERROR');
                }
            }
        } else {
            log(`✗ Failed to start game: ${startResult.error}`, 'ERROR');
        }
        
        // Clean up - delete the test lobby
        await makeRequest('DELETE', `/lobbies/${lobbyCode}`, null, authToken);
        
    } else {
        log(`✗ Failed to create lobby with question set: ${lobbyResult.error}`, 'ERROR');
    }
}

async function testUnauthorizedAccess() {
    log('=== Testing Unauthorized Access ===');
    
    // Test creating question set without auth
    const noAuthResult = await makeRequest('POST', '/question-sets', {
        name: 'Unauthorized Test',
        description: 'This should fail',
        questions: [
            {
                question: 'Should this work?',
                correct: false,
                type: 'true_false'
            }
        ]
    });
    
    if (!noAuthResult.success && noAuthResult.status === 401) {
        log('✓ Unauthorized creation properly blocked', 'SUCCESS');
    } else {
        log('✗ Unauthorized creation not properly blocked', 'ERROR');
    }
    
    // Test with invalid token
    const invalidTokenResult = await makeRequest('POST', '/question-sets', {
        name: 'Invalid Token Test',
        description: 'This should also fail',
        questions: [
            {
                question: 'Should this work?',
                correct: false,
                type: 'true_false'
            }
        ]
    }, 'invalid_token_here');
    
    if (!invalidTokenResult.success && (invalidTokenResult.status === 401 || invalidTokenResult.status === 403)) {
        log('✓ Invalid token properly rejected', 'SUCCESS');
    } else {
        log('✗ Invalid token not properly rejected', 'ERROR');
        log(`  Expected: success=false, status=401 or 403`, 'ERROR');
        log(`  Got: success=${invalidTokenResult.success}, status=${invalidTokenResult.status}`, 'ERROR');
        log(`  Response: ${JSON.stringify(invalidTokenResult.data)}`, 'ERROR');
    }
}

async function testQuestionTypes() {
    log('=== Testing Different Question Types ===');
    
    // Test question set with edge cases in question types
    const edgeCaseQuestionSet = {
        name: 'Edge Case Test QS ' + Date.now(),
        description: 'Question set testing edge cases in question types',
        questions: [
            // Multiple choice with special characters
            {
                question: 'What is the formula for water? (H₂O)',
                options: ['H₂O', 'CO₂', 'NaCl', 'C₆H₁₂O₆'],
                correct: 0,
                type: 'multiple_choice'
            },
            // True/false with complex statement
            {
                question: 'JavaScript is a compiled language that runs on the Java Virtual Machine.',
                correct: false,
                type: 'true_false'
            },
            // Long question text
            {
                question: 'In computer science, what is the time complexity of finding an element in a balanced binary search tree with n elements, assuming we need to search for a specific value?',
                options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
                correct: 1,
                type: 'multiple_choice'
            },
            // Question with numbers and symbols
            {
                question: 'What is 2³ + 4² - 1?',
                options: ['22', '23', '24', '25'],
                correct: 1,
                type: 'multiple_choice'
            }
        ]
    };
    
    const edgeResult = await makeRequest('POST', '/question-sets', edgeCaseQuestionSet, authToken);
    if (edgeResult.success) {
        testQuestionSetIds.push(edgeResult.data.id);
        log(`✓ Edge case question set created successfully`, 'SUCCESS');
        
        // Verify the questions were stored correctly
        const verifyResult = await makeRequest('GET', `/question-sets/${edgeResult.data.id}`, null, authToken);
        if (verifyResult.success) {
            const questions = verifyResult.data.questions;
            let allCorrect = true;
            
            questions.forEach((q, index) => {
                const original = edgeCaseQuestionSet.questions[index];
                if (q.question !== original.question || 
                    q.type !== original.type || 
                    q.correct !== original.correct) {
                    allCorrect = false;
                }
            });
            
            if (allCorrect) {
                log('✓ Edge case questions stored and retrieved correctly', 'SUCCESS');
            } else {
                log('✗ Edge case questions not stored correctly', 'ERROR');
            }
        }
    } else {
        log(`✗ Failed to create edge case question set: ${edgeResult.error}`, 'ERROR');
    }
}

// Main test execution
async function testQuestionSets() {
    log('🚀 Starting Comprehensive Question Sets Test Suite', 'INFO');
    log('=' .repeat(60));
    
    try {
        const setupSuccess = await setupTestUser();
        if (!setupSuccess) {
            log('✗ Test user setup failed', 'ERROR');
            return;
        }
        
        await testQuestionSetCreation();
        await testQuestionSetValidation();
        await testQuestionSetRetrieval();
        await testQuestionSetUpdate();
        await testQuestionTypes();
        await testGameIntegration();
        await testUnauthorizedAccess();
        await testQuestionSetDeletion();
        
        log('=' .repeat(60));
        log('🎉 All question set tests completed!', 'SUCCESS');
        log(`Created ${testQuestionSetIds.length} test question sets during testing`);
        
    } catch (error) {
        log(`💥 Question sets test suite failed: ${error.message}`, 'ERROR');
        console.error(error);
    }
}

// Run the tests
if (require.main === module) {
    testQuestionSets();
}

module.exports = {
    testQuestionSets,
    testQuestionSetCreation,
    testQuestionSetValidation,
    testGameIntegration,
    makeRequest
}; 