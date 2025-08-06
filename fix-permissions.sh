#!/bin/bash

# Fix Docker container permission issues
# This script sets the correct ownership for mounted volumes to match the container user

set -e

echo "🔧 Fixing Docker container permissions..."

# Get the current user's UID and GID
HOST_UID=$(id -u)
HOST_GID=$(id -g)

# Container user UID/GID (matches Dockerfile)
CONTAINER_UID=1001
CONTAINER_GID=1001

echo "Host UID: $HOST_UID, Host GID: $HOST_GID"
echo "Container UID: $CONTAINER_UID, Container GID: $CONTAINER_GID"

# Function to fix permissions for a directory
fix_permissions() {
    local dir="$1"
    if [ -d "$dir" ]; then
        echo "Fixing permissions for: $dir"
        sudo chown -R $CONTAINER_UID:$CONTAINER_GID "$dir"
        sudo chmod -R 755 "$dir"
    else
        echo "Directory not found: $dir"
    fi
}

# Fix permissions for backend directories
echo "📁 Fixing backend permissions..."
fix_permissions "./backend/src"
fix_permissions "./backend/dist"
fix_permissions "./backend/logs"
fix_permissions "./backend/coverage"
fix_permissions "./backend/test-results"

# Fix permissions for frontend directories
echo "📁 Fixing frontend permissions..."
fix_permissions "./frontend/src"
fix_permissions "./frontend/dist"
fix_permissions "./frontend/coverage"
fix_permissions "./frontend/test-results"
fix_permissions "./frontend/playwright-report"

# Fix permissions for shared directories
echo "📁 Fixing shared directories..."
fix_permissions "./logs"
fix_permissions "./test-reports"

# Create necessary directories if they don't exist
echo "📁 Creating necessary directories..."
mkdir -p ./backend/dist
mkdir -p ./backend/logs
mkdir -p ./backend/coverage
mkdir -p ./backend/test-results
mkdir -p ./frontend/dist
mkdir -p ./frontend/coverage
mkdir -p ./frontend/test-results
mkdir -p ./frontend/playwright-report
mkdir -p ./logs
mkdir -p ./test-reports

# Fix permissions for newly created directories
fix_permissions "./backend/dist"
fix_permissions "./backend/logs"
fix_permissions "./backend/coverage"
fix_permissions "./backend/test-results"
fix_permissions "./frontend/dist"
fix_permissions "./frontend/coverage"
fix_permissions "./frontend/test-results"
fix_permissions "./frontend/playwright-report"
fix_permissions "./logs"
fix_permissions "./test-reports"

echo "✅ Permissions fixed successfully!"
echo ""
echo "You can now restart your Docker containers:"
echo "  docker-compose --profile test down"
echo "  docker-compose --profile test up -d"
echo ""
echo "Or for development:"
echo "  docker-compose --profile development down"
echo "  docker-compose --profile development up -d" 