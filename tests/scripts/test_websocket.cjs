const { io } = require('socket.io-client');

// Test configuration
const API_BASE_URL = 'http://10.0.0.44';
const WS_URL = 'http://10.0.0.44'; // Connect through Traefik

console.log('🔌 Testing WebSocket Implementation');
console.log('==================================');

async function testWebSocketConnection() {
    console.log('\n1. Testing WebSocket Connection...');
    
    // First try polling-only transport (should work if Socket.IO is running)
    console.log('   Trying polling transport first...');
    
    return new Promise((resolve, reject) => {
        const socket = io(WS_URL, {
            transports: ['polling'], // Start with polling only
            timeout: 10000,
            reconnection: false,
            forceNew: true
        });

        const timeout = setTimeout(() => {
            console.log('⏰ Connection timeout (10s)');
            socket.disconnect();
            reject(new Error('Connection timeout'));
        }, 15000);

        socket.on('connect', () => {
            console.log('✅ WebSocket connected successfully (polling)');
            console.log('   Socket ID:', socket.id);
            console.log('   Transport:', socket.io.engine.transport.name);
            
            // Now try to upgrade to websocket
            console.log('   Attempting upgrade to WebSocket...');
            // The upgrade happens automatically if available
            
            setTimeout(() => {
                console.log('   Final transport:', socket.io.engine.transport.name);
                clearTimeout(timeout);
                socket.disconnect();
                resolve(true);
            }, 2000);
        });

        socket.on('connect_error', (error) => {
            console.log('❌ WebSocket connection failed:', error.message);
            console.log('   Error details:', error);
            clearTimeout(timeout);
            reject(error);
        });

        socket.on('disconnect', (reason) => {
            console.log('🔌 WebSocket disconnected:', reason);
        });

        socket.on('error', (error) => {
            console.log('❌ Socket error:', error);
        });

        socket.on('upgrade', () => {
            console.log('✅ Successfully upgraded to WebSocket transport');
        });

        socket.on('upgradeError', (error) => {
            console.log('⚠️  WebSocket upgrade failed (polling still works):', error.message);
        });
    });
}

async function testWebSocketAuthentication() {
    console.log('\n2. Testing WebSocket Authentication...');
    
    // First, we need to get a valid JWT token by logging in
    const fetch = require('node-fetch');
    
    try {
        // Register a test user
        const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'websocket_test_user',
                password: 'testpass123',
                character: 'test-character'
            })
        });

        let token;
        if (registerResponse.status === 201) {
            const registerData = await registerResponse.json();
            token = registerData.token;
            console.log('✅ Test user registered');
        } else if (registerResponse.status === 409) {
            // User already exists, try to login
            const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'websocket_test_user',
                    password: 'testpass123'
                })
            });

            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                token = loginData.token;
                console.log('✅ Test user logged in');
            } else {
                throw new Error('Failed to login test user');
            }
        } else {
            throw new Error('Failed to register test user');
        }

        if (!token) {
            throw new Error('No token received');
        }

        // Test WebSocket authentication
        return new Promise((resolve, reject) => {
            const socket = io(WS_URL, {
                transports: ['websocket', 'polling'],
                timeout: 5000,
                reconnection: false
            });

            const timeout = setTimeout(() => {
                socket.disconnect();
                reject(new Error('Authentication timeout'));
            }, 10000);

            socket.on('connect', () => {
                console.log('✅ WebSocket connected, testing authentication...');
                
                // Authenticate
                socket.emit('authenticate', {
                    token: token,
                    username: 'websocket_test_user'
                });
            });

            socket.on('authenticated', (data) => {
                console.log('✅ WebSocket authentication successful');
                console.log('   Authenticated user:', data.username);
                clearTimeout(timeout);
                socket.disconnect();
                resolve(true);
            });

            socket.on('authentication_error', (error) => {
                console.log('❌ WebSocket authentication failed:', error.error);
                clearTimeout(timeout);
                socket.disconnect();
                reject(new Error(error.error));
            });

            socket.on('connect_error', (error) => {
                console.log('❌ WebSocket connection failed:', error.message);
                clearTimeout(timeout);
                reject(error);
            });
        });

    } catch (error) {
        console.log('❌ Authentication test failed:', error.message);
        throw error;
    }
}

async function testWebSocketRooms() {
    console.log('\n3. Testing WebSocket Room Management...');
    
    // This would require creating a lobby first, which is more complex
    // For now, we'll just test the basic room join/leave functionality
    
    const fetch = require('node-fetch');
    
    try {
        // Login to get token
        const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'websocket_test_user',
                password: 'testpass123'
            })
        });

        if (!loginResponse.ok) {
            throw new Error('Failed to login for room test');
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;

        return new Promise((resolve, reject) => {
            const socket = io(WS_URL, {
                transports: ['websocket', 'polling'],
                timeout: 5000,
                reconnection: false
            });

            const timeout = setTimeout(() => {
                socket.disconnect();
                reject(new Error('Room test timeout'));
            }, 15000);

            let authenticated = false;

            socket.on('connect', () => {
                // Authenticate first
                socket.emit('authenticate', {
                    token: token,
                    username: 'websocket_test_user'
                });
            });

            socket.on('authenticated', () => {
                authenticated = true;
                console.log('✅ Authenticated, testing room join...');
                
                // Test joining a lobby room
                socket.emit('join_lobby', { lobbyCode: 'TEST' });
            });

            socket.on('lobby_joined', (data) => {
                console.log('✅ Successfully joined lobby room:', data.lobbyCode);
                
                // Test leaving the room
                socket.emit('leave_lobby', { lobbyCode: 'TEST' });
            });

            socket.on('lobby_left', (data) => {
                console.log('✅ Successfully left lobby room:', data.lobbyCode);
                clearTimeout(timeout);
                socket.disconnect();
                resolve(true);
            });

            socket.on('error', (error) => {
                console.log('❌ WebSocket error:', error.message);
                clearTimeout(timeout);
                socket.disconnect();
                reject(error);
            });

            socket.on('connect_error', (error) => {
                console.log('❌ WebSocket connection failed:', error.message);
                clearTimeout(timeout);
                reject(error);
            });
        });

    } catch (error) {
        console.log('❌ Room test failed:', error.message);
        throw error;
    }
}

async function runWebSocketTests() {
    console.log('Starting WebSocket tests...\n');
    
    const results = {
        connection: false,
        authentication: false,
        rooms: false
    };

    try {
        // Test 1: Basic connection
        try {
            await testWebSocketConnection();
            results.connection = true;
        } catch (error) {
            console.log('❌ Connection test failed:', error.message);
        }

        // Test 2: Authentication
        try {
            await testWebSocketAuthentication();
            results.authentication = true;
        } catch (error) {
            console.log('❌ Authentication test failed:', error.message);
        }

        // Test 3: Room management
        try {
            await testWebSocketRooms();
            results.rooms = true;
        } catch (error) {
            console.log('❌ Room test failed:', error.message);
        }

    } catch (error) {
        console.log('❌ Test suite failed:', error.message);
    }

    // Summary
    console.log('\n📊 WebSocket Test Results');
    console.log('=========================');
    console.log(`Connection:     ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Authentication: ${results.authentication ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Room Management: ${results.rooms ? '✅ PASS' : '❌ FAIL'}`);
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All WebSocket tests passed!');
        process.exit(0);
    } else {
        console.log('⚠️ Some WebSocket tests failed');
        process.exit(1);
    }
}

// Run the tests
runWebSocketTests().catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
}); 