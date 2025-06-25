#!/bin/bash

# Test React Frontend Development Script
# This script helps test the React frontend integration

set -e

echo "🚀 Testing React Frontend Integration"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to print status
print_status() {
    echo ""
    echo "📋 $1"
    echo "------------------------------------"
}

# Function to check if service is running
check_service() {
    local service=$1
    if docker-compose ps "$service" | grep -q "Up"; then
        echo "✅ $service is running"
        return 0
    else
        echo "❌ $service is not running"
        return 1
    fi
}

print_status "Step 1: Building React Frontend"
cd react-frontend
if npm run build; then
    echo "✅ React frontend built successfully"
else
    echo "❌ Failed to build React frontend"
    exit 1
fi
cd ..

print_status "Step 2: Checking Docker Services"
echo "Checking if services are running..."

# Check main services
services_running=true
check_service "l2p-api" || services_running=false
check_service "l2p-db" || services_running=false

if [ "$services_running" = false ]; then
    echo ""
    echo "🔄 Starting required services..."
    docker-compose up -d l2p-api l2p-db l2p-traefik
    
    echo "⏳ Waiting for services to be ready..."
    sleep 10
fi

print_status "Step 3: Health Check"
echo "Checking API health..."
if curl -f -s http://10.0.0.44/api/health > /dev/null; then
    echo "✅ API is responding"
else
    echo "❌ API is not responding"
    echo "💡 Try running: docker-compose logs l2p-api"
fi

print_status "Step 4: Database Connection"
echo "Checking database connection..."
if docker-compose exec -T l2p-db psql -U learn2play -d learn2play -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database is connected"
else
    echo "❌ Database connection failed"
    echo "💡 Try running: docker-compose logs l2p-db"
fi

print_status "Step 5: React Development Server"
echo "You can now start the React development server with:"
echo ""
echo "  cd react-frontend"
echo "  npm run dev"
echo ""
echo "The React app will be available at: http://localhost:5173"
echo "The backend API is available at: http://10.0.0.44/api"
echo ""

print_status "Step 6: Testing URLs"
echo "Available endpoints to test:"
echo ""
echo "🏠 Home Page:        http://localhost:5173/"
echo "🔐 Login Page:       http://localhost:5173/login"
echo "📝 Register Page:    http://localhost:5173/register"
echo "🎮 Lobby Page:       http://localhost:5173/lobby"
echo "🏆 Hall of Fame:     http://localhost:5173/hall-of-fame"
echo ""
echo "🔗 Backend API:      http://10.0.0.44/api"
echo "📊 API Health:       http://10.0.0.44/api/health"
echo "📋 API Catalogs:     http://10.0.0.44/api/catalogs"
echo ""

print_status "Development Tips"
echo "• Use 'npm run react:dev' to start React dev server"
echo "• Use 'docker-compose logs -f l2p-api' to monitor backend"
echo "• Use 'docker-compose restart l2p-api' to restart backend"
echo "• Check 'REACT_MIGRATION_STATUS.md' for current progress"
echo ""

echo "🎉 React Frontend Integration Test Complete!"
echo ""
echo "Next steps:"
echo "1. Start the React dev server: cd react-frontend && npm run dev"
echo "2. Open http://localhost:5173 in your browser"
echo "3. Test the login/register flow"
echo "4. Create and join game lobbies"
echo "5. Test real-time multiplayer features"
echo "" 