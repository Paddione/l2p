#!/bin/bash

# Enable Development Mode Script
# This script helps enable development mode with forced cache clearing

echo "🛠️ Learn2Play Development Mode Setup"
echo "====================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please copy env.example to .env first:"
    echo "cp env.example .env"
    exit 1
fi

# Backup current .env
cp .env .env.backup
echo "✅ Created backup: .env.backup"

# Enable development mode
if grep -q "DEVELOPMENT_MODE=" .env; then
    # Update existing line
    sed -i 's/DEVELOPMENT_MODE=.*/DEVELOPMENT_MODE=true/' .env
    echo "✅ Updated DEVELOPMENT_MODE=true"
else
    # Add new line
    echo "" >> .env
    echo "# Development mode with forced cache clearing" >> .env
    echo "DEVELOPMENT_MODE=true" >> .env
    echo "✅ Added DEVELOPMENT_MODE=true"
fi

# Also enable debug mode if not already set
if grep -q "DEBUG_MODE=" .env; then
    sed -i 's/DEBUG_MODE=.*/DEBUG_MODE=true/' .env
    echo "✅ Updated DEBUG_MODE=true"
else
    echo "DEBUG_MODE=true" >> .env
    echo "✅ Added DEBUG_MODE=true"
fi

# Set NODE_ENV to development if not already set
if grep -q "NODE_ENV=" .env; then
    sed -i 's/NODE_ENV=.*/NODE_ENV=development/' .env
    echo "✅ Updated NODE_ENV=development"
else
    echo "NODE_ENV=development" >> .env
    echo "✅ Added NODE_ENV=development"
fi

echo ""
echo "🚀 Development mode enabled!"
echo "Next steps:"
echo "1. Restart the backend container:"
echo "   docker compose restart l2p-api"
echo "2. Access the application at http://10.0.0.44"
echo "3. You will see the development mode cache clearing screen"
echo ""
echo "To disable development mode later, run:"
echo "   ./scripts/disable-dev-mode.sh"
echo ""
echo "📝 Note: Your original .env has been backed up to .env.backup" 