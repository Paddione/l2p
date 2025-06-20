#!/bin/bash

# Disable Development Mode Script
# This script helps disable development mode

echo "🔧 Learn2Play Development Mode Disable"
echo "======================================"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Backup current .env
cp .env .env.backup
echo "✅ Created backup: .env.backup"

# Disable development mode
if grep -q "DEVELOPMENT_MODE=" .env; then
    sed -i 's/DEVELOPMENT_MODE=.*/DEVELOPMENT_MODE=false/' .env
    echo "✅ Updated DEVELOPMENT_MODE=false"
else
    echo "⚠️  DEVELOPMENT_MODE not found in .env file"
fi

# Set NODE_ENV to production
if grep -q "NODE_ENV=" .env; then
    sed -i 's/NODE_ENV=.*/NODE_ENV=production/' .env
    echo "✅ Updated NODE_ENV=production"
fi

echo ""
echo "✅ Development mode disabled!"
echo "Next steps:"
echo "1. Restart the backend container:"
echo "   docker compose restart l2p-api"
echo "2. Access the application at http://10.0.0.44"
echo "3. Cache clearing screen will no longer appear"
echo ""
echo "📝 Note: Your original .env has been backed up to .env.backup" 