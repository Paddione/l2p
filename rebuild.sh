#!/bin/bash
# Rebuild only the application containers (API and frontend)
# Leaves postgres and traefik running

set -e

# Parse command line arguments
CLEAN_BUILD=false
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --clean) CLEAN_BUILD=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo "🛑 Stopping application containers..."
docker compose stop quiz-api quiz-app

echo ""
echo "🔨 Rebuilding application containers..."
if [ "$CLEAN_BUILD" = true ]; then
    echo "🧹 Performing clean build (no cache)..."
    docker compose build --no-cache --parallel quiz-api quiz-app
else
    echo "📦 Using build cache..."
    docker compose build --parallel quiz-api quiz-app
fi

echo ""
echo "🚀 Starting application containers..."
docker compose up -d quiz-api quiz-app

echo ""
echo "✅ Application containers rebuilt and started!"
echo ""
echo "📍 Access URLs:"
echo "   API: http://10.0.0.44/api"
echo "   Frontend: http://10.0.0.44"
echo "   Production: https://game.korczewski.de"
echo "   Traefik Dashboard: https://traefik.korczewski.de"
echo ""
echo "📊 Check container status:"
echo "   docker compose ps"
echo ""
echo "📋 View logs:"
echo "   docker compose logs -f quiz-api"
echo "   docker compose logs -f quiz-app"
echo ""
echo "💡 Tip: Use --clean flag for a complete rebuild without cache"
