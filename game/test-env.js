// Create this file as test-env.js in your game/ directory
// Run with: node test-env.js

require('dotenv').config({ path: '.env.game' });

console.log('=== TESTING .env.game FILE LOADING ===');
console.log('');

const requiredVars = [
    'PORT',
    'AUTH_APP_URL',
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
];

let allGood = true;

requiredVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    const displayValue = varName.includes('SECRET') || varName.includes('KEY')
        ? (value ? '[HIDDEN]' : '[MISSING]')
        : (value || '[MISSING]');

    console.log(`${status} ${varName} = ${displayValue}`);

    if (!value) {
        allGood = false;
    }
});

console.log('');
if (allGood) {
    console.log('🎉 SUCCESS: All required environment variables are loaded!');
    console.log('Your .env.game file is working correctly.');
} else {
    console.log('❌ ERROR: Some required environment variables are missing.');
    console.log('Please check your .env.game file.');
}

console.log('');
console.log('File should be located at:', require('path').join(__dirname, '.env.game'));
console.log('Current working directory:', process.cwd());