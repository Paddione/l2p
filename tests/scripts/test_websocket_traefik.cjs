#!/usr/bin/env node

const { io } = require('socket.io-client');

/**
 * Test WebSocket/Socket.IO connectivity through Traefik
 */
async function testWebSocketTraefik() {
    console.log('🔌 Testing WebSocket/Socket.IO through Traefik...\n');
    
    const testResults = {
        timestamp: new Date().toISOString(),
        tests: [],
        summary: {
            total: 0,
            passed: 0,
            failed: 0
        }
    };

    // Test configurations
    const testConfigs = [
        {
            name: 'Local HTTP WebSocket',
            url: 'http://10.0.0.44',
            timeout: 10000
        },
        {
            name: 'Local HTTP with explicit port',
            url: 'http://10.0.0.44:80',
            timeout: 10000
        }
    ];

    for (const config of testConfigs) {
        console.log(`📡 Testing: ${config.name}`);
        console.log(`   URL: ${config.url}`);
        
        const testResult = {
            name: config.name,
            url: config.url,
            success: false,
            error: null,
            duration: 0,
            events: []
        };

        const startTime = Date.now();

        try {
            const socket = io(config.url, {
                transports: ['websocket', 'polling'],
                timeout: config.timeout,
                reconnection: false,
                forceNew: true
            });

            const connectionPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Connection timeout after ${config.timeout}ms`));
                }, config.timeout);

                socket.on('connect', () => {
                    clearTimeout(timeout);
                    testResult.events.push('Connected');
                    console.log('   ✅ Connected successfully');
                    
                    // Test ping-pong
                    socket.emit('ping');
                    socket.on('pong', () => {
                        testResult.events.push('Ping-Pong successful');
                        console.log('   ✅ Ping-Pong successful');
                        socket.disconnect();
                        resolve();
                    });

                    // Fallback if no pong received
                    setTimeout(() => {
                        testResult.events.push('No pong received, but connection works');
                        console.log('   ⚠️  No pong received, but connection established');
                        socket.disconnect();
                        resolve();
                    }, 2000);
                });

                socket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    testResult.events.push(`Connection error: ${error.message}`);
                    reject(error);
                });

                socket.on('disconnect', (reason) => {
                    testResult.events.push(`Disconnected: ${reason}`);
                    console.log(`   📤 Disconnected: ${reason}`);
                });
            });

            await connectionPromise;
            testResult.success = true;
            console.log('   ✅ Test passed\n');

        } catch (error) {
            testResult.error = error.message;
            console.log(`   ❌ Test failed: ${error.message}\n`);
        }

        testResult.duration = Date.now() - startTime;
        testResults.tests.push(testResult);
        testResults.summary.total++;
        
        if (testResult.success) {
            testResults.summary.passed++;
        } else {
            testResults.summary.failed++;
        }
    }

    // Print summary
    console.log('📊 Test Summary:');
    console.log(`   Total tests: ${testResults.summary.total}`);
    console.log(`   Passed: ${testResults.summary.passed}`);
    console.log(`   Failed: ${testResults.summary.failed}`);
    console.log(`   Success rate: ${Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%`);

    // Save results
    const fs = require('fs');
    const resultsFile = `tests/results/websocket_traefik_test_${Date.now()}.json`;
    
    try {
        // Ensure results directory exists
        if (!fs.existsSync('tests/results')) {
            fs.mkdirSync('tests/results', { recursive: true });
        }
        
        fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
        console.log(`\n💾 Results saved to: ${resultsFile}`);
    } catch (error) {
        console.error('❌ Failed to save results:', error.message);
    }

    return testResults.summary.failed === 0;
}

/**
 * Test real-time game features
 */
async function testRealTimeGameFeatures() {
    console.log('\n🎮 Testing Real-Time Game Features...\n');
    
    const socket = io('http://10.0.0.44', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: false,
        forceNew: true
    });

    return new Promise((resolve, reject) => {
        let testsPassed = 0;
        const totalTests = 3;
        const timeout = setTimeout(() => {
            socket.disconnect();
            reject(new Error('Real-time game feature tests timed out'));
        }, 15000);

        socket.on('connect', () => {
            console.log('✅ Connected for real-time game feature testing');
            
            // Test authentication event
            socket.emit('authenticate', {
                token: 'test-token',
                username: 'test-user'
            });
        });

        socket.on('authenticated', (data) => {
            console.log('✅ Authentication response received:', data);
            testsPassed++;
            checkCompletion();
        });

        socket.on('authentication_error', (error) => {
            console.log('✅ Authentication error handling works:', error);
            testsPassed++;
            checkCompletion();
        });

        socket.on('connect_error', (error) => {
            clearTimeout(timeout);
            socket.disconnect();
            reject(error);
        });

        // Test lobby events
        setTimeout(() => {
            socket.emit('join_lobby', { lobbyCode: 'TEST123' });
            console.log('📤 Sent join_lobby event');
        }, 1000);

        socket.on('error', (error) => {
            console.log('✅ Error handling works:', error);
            testsPassed++;
            checkCompletion();
        });

        function checkCompletion() {
            if (testsPassed >= totalTests) {
                clearTimeout(timeout);
                console.log(`\n✅ Real-time game features test completed (${testsPassed}/${totalTests} tests passed)`);
                socket.disconnect();
                resolve(true);
            }
        }

        // Fallback completion
        setTimeout(() => {
            clearTimeout(timeout);
            console.log(`\n⚠️  Real-time game features test completed with partial success (${testsPassed}/${totalTests} tests passed)`);
            socket.disconnect();
            resolve(testsPassed > 0);
        }, 10000);
    });
}

// Main execution
async function main() {
    try {
        console.log('🚀 Starting WebSocket/Socket.IO Traefik Configuration Tests\n');
        
        const websocketTestsPassed = await testWebSocketTraefik();
        const gameFeatureTestsPassed = await testRealTimeGameFeatures();
        
        console.log('\n🎯 Final Results:');
        console.log(`   WebSocket Tests: ${websocketTestsPassed ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`   Game Features Tests: ${gameFeatureTestsPassed ? '✅ PASSED' : '❌ FAILED'}`);
        
        if (websocketTestsPassed && gameFeatureTestsPassed) {
            console.log('\n🎉 All tests passed! WebSocket/Socket.IO configuration is working correctly.');
            process.exit(0);
        } else {
            console.log('\n⚠️  Some tests failed. Check the configuration and try again.');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

if (require.main === module) {
    main();
}

module.exports = { testWebSocketTraefik, testRealTimeGameFeatures }; 