// complete-test.js - Test the entire system step by step
// Run: node complete-test.js

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🧪 COMPLETE SYSTEM TEST');
console.log('=======================');

async function runTests() {
    let allPassed = true;

    // Test 1: Check .env.game file
    console.log('\n1️⃣ Testing .env.game file...');
    try {
        require('dotenv').config({ path: '.env.game' });

        const requiredVars = [
            'FIREBASE_API_KEY',
            'FIREBASE_AUTH_DOMAIN',
            'FIREBASE_PROJECT_ID',
            'FIREBASE_STORAGE_BUCKET',
            'FIREBASE_MESSAGING_SENDER_ID',
            'FIREBASE_APP_ID',
            'AUTH_APP_URL'
        ];

        const missingVars = requiredVars.filter(v => !process.env[v]);

        if (missingVars.length === 0) {
            console.log('   ✅ All environment variables loaded');
            console.log('   📦 Project:', process.env.FIREBASE_PROJECT_ID);
            console.log('   🔐 Auth Domain:', process.env.FIREBASE_AUTH_DOMAIN);
        } else {
            console.log('   ❌ Missing variables:', missingVars);
            allPassed = false;
        }
    } catch (e) {
        console.log('   ❌ Error loading .env.game:', e.message);
        allPassed = false;
    }

    // Test 2: Check file structure
    console.log('\n2️⃣ Testing file structure...');
    const requiredFiles = [
        'server.js',
        'public/index.html',
        'public/main.js',
        '.env.game'
    ];

    requiredFiles.forEach(file => {
        const exists = fs.existsSync(file);
        console.log(`   ${exists ? '✅' : '❌'} ${file}`);
        if (!exists) allPassed = false;
    });

    // Test 3: Check index.html injection point
    console.log('\n3️⃣ Testing index.html injection point...');
    try {
        const htmlContent = fs.readFileSync('public/index.html', 'utf8');
        const hasInjectionPoint = htmlContent.includes('<!-- CONFIG_INJECTION_POINT -->');
        const hasFirebaseScripts = htmlContent.includes('firebase-app-compat.js');
        const hasSocketIO = htmlContent.includes('/socket.io/socket.io.js');

        console.log(`   ${hasInjectionPoint ? '✅' : '❌'} CONFIG_INJECTION_POINT found`);
        console.log(`   ${hasFirebaseScripts ? '✅' : '❌'} Firebase scripts included`);
        console.log(`   ${hasSocketIO ? '✅' : '❌'} Socket.IO script included`);

        if (!hasInjectionPoint) allPassed = false;
    } catch (e) {
        console.log('   ❌ Error reading index.html:', e.message);
        allPassed = false;
    }

    // Test 4: Test server response (if running)
    console.log('\n4️⃣ Testing server response...');
    try {
        const response = await makeRequest('http://localhost:3000');

        if (response.includes('CONFIG_INJECTION_POINT')) {
            console.log('   ❌ Server not injecting config (injection point still visible)');
            allPassed = false;
        } else if (response.includes('window.GAME_CONFIG')) {
            console.log('   ✅ Server is injecting config successfully');

            // Extract the config from the response
            const configMatch = response.match(/window\.GAME_CONFIG\s*=\s*({.*?});/s);
            if (configMatch) {
                try {
                    const configStr = configMatch[1];
                    const config = JSON.parse(configStr);
                    console.log('   📦 Injected Project ID:', config.firebaseConfig?.projectId);
                    console.log('   🔐 Injected Auth Domain:', config.firebaseConfig?.authDomain);
                    console.log('   🔑 Has API Key:', !!config.firebaseConfig?.apiKey);
                } catch (e) {
                    console.log('   ⚠️  Could not parse injected config');
                }
            }
        } else {
            console.log('   ❌ Server response does not contain GAME_CONFIG');
            allPassed = false;
        }
    } catch (e) {
        console.log('   ⚠️  Server not running or not accessible:', e.message);
        console.log('   📝 Start server with: npm start');
    }

    // Test 5: Check for common issues
    console.log('\n5️⃣ Checking for common issues...');

    // Check if using correct dotenv path
    try {
        const serverContent = fs.readFileSync('server.js', 'utf8');
        const hasCorrectDotenv = serverContent.includes("'.env.game'") || serverContent.includes('".env.game"');
        const hasConfigRoute = serverContent.includes('CONFIG_INJECTION_POINT');

        console.log(`   ${hasCorrectDotenv ? '✅' : '❌'} Server loads .env.game`);
        console.log(`   ${hasConfigRoute ? '✅' : '❌'} Server has config injection route`);

        if (!hasCorrectDotenv || !hasConfigRoute) allPassed = false;
    } catch (e) {
        console.log('   ❌ Could not analyze server.js:', e.message);
        allPassed = false;
    }

    // Final result
    console.log('\n🎯 TEST RESULTS');
    console.log('===============');

    if (allPassed) {
        console.log('🎉 ALL TESTS PASSED!');
        console.log('✅ Your system should be working correctly');
        console.log('');
        console.log('📋 Next steps:');
        console.log('1. If server is not running: npm start');
        console.log('2. Open: http://localhost:3000');
        console.log('3. Check browser console for: "✅ CONFIG FOUND!"');
        console.log('4. Click "🔍 Check Config" button on the page');
    } else {
        console.log('❌ SOME TESTS FAILED');
        console.log('');
        console.log('🔧 Quick fixes:');
        console.log('1. Run: node fix-injection-point.js');
        console.log('2. Update your server.js with the working route code');
        console.log('3. Make sure .env.game exists and has all variables');
        console.log('4. Restart server: npm start');
    }
}

// Helper function to make HTTP requests
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const request = http.get(url, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => resolve(data));
        });

        request.on('error', reject);
        request.setTimeout(5000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Run the tests
runTests().catch(console.error);