#!/bin/bash
# Rebuild only the application containers (API and frontend)
# Leaves postgres and traefik running

set -e

echo "🛑 Stopping application containers..."
docker compose stop quiz-api quiz-app

echo ""
echo "🔨 Rebuilding application containers..."
docker compose build --no-cache quiz-api quiz-app

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
