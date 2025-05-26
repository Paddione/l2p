#!/bin/bash

# deploy.sh - Deployment script for Quiz Game

set -e

echo "🚀 Starting Quiz Game Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
check_requirements() {
    print_status "Checking requirements..."

    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found!"
        exit 1
    fi

    if [ ! -f "auth/service-account.json" ]; then
        print_error "auth/service-account.json not found!"
        print_warning "Please add your Firebase service account file"
        exit 1
    fi

    if [ ! -f "game/service-account.json" ]; then
        print_error "game/service-account.json not found!"
        print_warning "Please add your Firebase service account file"
        exit 1
    fi

    if [ ! -f "auth/.env.auth" ]; then
        print_error "auth/.env.auth not found!"
        print_warning "Please create the auth environment file"
        exit 1
    fi

    if [ ! -f "game/.env.game" ]; then
        print_error "game/.env.game not found!"
        print_warning "Please create the game environment file"
        exit 1
    fi

    print_status "All requirements satisfied ✅"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p letsencrypt
    chmod 600 letsencrypt
    print_status "Directories created ✅"
}

# Stop existing containers
stop_containers() {
    print_status "Stopping existing containers..."
    docker-compose down --remove-orphans || true
    print_status "Containers stopped ✅"
}

# Build and start containers
start_containers() {
    print_status "Building and starting containers..."
    docker-compose up --build -d

    if [ $? -eq 0 ]; then
        print_status "Containers started successfully ✅"
    else
        print_error "Failed to start containers ❌"
        exit 1
    fi
}

# Wait for services to be healthy
wait_for_health() {
    print_status "Waiting for services to become healthy..."

    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        attempt=$((attempt + 1))

        # Check auth service
        auth_status=$(docker-compose ps --services --filter "status=running" | grep auth_server || echo "")

        # Check game service
        game_status=$(docker-compose ps --services --filter "status=running" | grep game_server || echo "")

        if [ -n "$auth_status" ] && [ -n "$game_status" ]; then
            print_status "Services are running ✅"
            break
        fi

        if [ $attempt -eq $max_attempts ]; then
            print_error "Services failed to start within expected time ❌"
            docker-compose logs --tail=50
            exit 1
        fi

        echo "Attempt $attempt/$max_attempts - Waiting for services..."
        sleep 10
    done
}

# Show status
show_status() {
    print_status "Deployment Status:"
    echo ""
    docker-compose ps
    echo ""
    print_status "Services should be available at:"
    echo "  🔐 Auth Server: https://auth.korczewski.de"
    echo "  🎮 Game Server: https://game.korczewski.de"
    echo "  📊 Traefik Dashboard: https://traefik.korczewski.de"
    echo ""
    print_status "To view logs:"
    echo "  docker-compose logs -f [service_name]"
    echo ""
    print_status "To stop services:"
    echo "  docker-compose down"
}

# Main deployment process
main() {
    print_status "Quiz Game Deployment Starting..."

    check_requirements
    create_directories
    stop_containers
    start_containers
    wait_for_health
    show_status

    print_status "🎉 Deployment completed successfully!"
}

# Run main function
main "$@"