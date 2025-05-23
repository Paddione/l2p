# Step 1: Check if server is reading .env.game
echo "🔍 Testing server environment loading..."
node -e "
require('dotenv').config({ path: '.env.game' });
console.log('FIREBASE_API_KEY:', process.env.FIREBASE_API_KEY ? 'LOADED' : 'MISSING');
console.log('AUTH_APP_URL:', process.env.AUTH_APP_URL);
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
"

# Step 2: Check if CONFIG_INJECTION_POINT exists in HTML
echo "🔍 Checking HTML injection point..."
curl -s http://localhost:3000 | grep -o "CONFIG_INJECTION_POINT" || echo "❌ CONFIG_INJECTION_POINT not found"

# Step 3: Check what's actually being served
echo "🔍 Checking what server is serving..."
curl -s http://localhost:3000 | grep -A5 -B5 "GAME_CONFIG" || echo "❌ GAME_CONFIG not found in HTML"

# Step 4: Check server logs for injection
echo "🔍 Check your server console for these messages:"
echo "   ✅ All environment variables present"
echo "   🎯 CONFIG_INJECTION_POINT found: true"
echo "   ✅ Injecting config from .env.game"