#!/bin/bash

# Docker Manager Script for Learn2Play
# Provides easy management of different Docker environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
ACTION="up"
DETACHED=false
BUILD=false
LOGS=false
CLEANUP=false

# Function to display usage
usage() {
    echo -e "${BLUE}Learn2Play Docker Manager${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS] [ACTION]"
    echo ""
    echo "ENVIRONMENTS:"
    echo "  -e, --env ENV        Environment to use (development, test, production) [default: production]"
    echo ""
    echo "ACTIONS:"
    echo "  up                   Start services"
    echo "  down                 Stop services"
    echo "  restart              Restart services"
    echo "  logs                 Show logs"
    echo "  build                Build images"
    echo "  pull                 Pull latest images"
    echo "  ps                   Show running containers"
    echo "  exec SERVICE CMD     Execute command in service"
    echo "  cleanup              Remove unused containers, networks, and volumes"
    echo ""
    echo "OPTIONS:"
    echo "  -d, --detach         Run in detached mode"
    echo "  -b, --build          Force rebuild images"
    echo "  -f, --follow         Follow logs (only with logs action)"
    echo "  -c, --cleanup        Clean up after stopping"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 -e development up -d          # Start development environment in background"
    echo "  $0 -e test up --build            # Start test environment and rebuild images"
    echo "  $0 -e production logs -f         # Follow production logs"
    echo "  $0 -e development exec backend bash  # Open bash in development backend"
    echo "  $0 cleanup                       # Clean up unused Docker resources"
    echo ""
}

# Function to check if .env file exists
check_env_file() {
    if [[ ! -f .env ]]; then
        echo -e "${YELLOW}Warning: .env file not found. Creating from .env.example...${NC}"
        if [[ -f .env.example ]]; then
            cp .env.example .env
            echo -e "${GREEN}Created .env file from .env.example${NC}"
            echo -e "${YELLOW}Please edit .env file with your configuration before continuing.${NC}"
            exit 1
        else
            echo -e "${RED}Error: Neither .env nor .env.example found!${NC}"
            exit 1
        fi
    fi
}

# Function to create necessary directories
create_directories() {
    local data_path="${DATA_PATH:-./data}"
    local logs_path="${LOGS_PATH:-./logs}"
    
    echo -e "${BLUE}Creating necessary directories...${NC}"
    
    # Create data directories
    mkdir -p "${data_path}/postgres"

    mkdir -p "${data_path}/letsencrypt"
    
    # Create log directories
    mkdir -p "${logs_path}/backend"
    mkdir -p "${logs_path}/frontend"
    mkdir -p "${logs_path}/traefik"
    
    # Set proper permissions
    chmod 755 "${data_path}"/{postgres,letsencrypt}
    chmod 755 "${logs_path}"/{backend,frontend,traefik}
    
    echo -e "${GREEN}Directories created successfully${NC}"
}

# Function to validate environment
validate_environment() {
    case $ENVIRONMENT in
        development|test|production)
            echo -e "${GREEN}Using environment: $ENVIRONMENT${NC}"
            ;;
        *)
            echo -e "${RED}Error: Invalid environment '$ENVIRONMENT'. Use: development, test, or production${NC}"
            exit 1
            ;;
    esac
}

# Function to get Docker Compose command
get_compose_cmd() {
    local cmd="docker-compose --profile $ENVIRONMENT"
    
    # Add additional compose files based on environment
    case $ENVIRONMENT in
        development)
            if [[ -f docker-compose.dev.yml ]]; then
                cmd="$cmd -f docker-compose.yml -f docker-compose.dev.yml"
            fi
            ;;
        test)
            if [[ -f docker-compose.test.yml ]]; then
                cmd="$cmd -f docker-compose.yml -f docker-compose.test.yml"
            fi
            ;;
        production)
            if [[ -f docker-compose.prod.yml ]]; then
                cmd="$cmd -f docker-compose.yml -f docker-compose.prod.yml"
            fi
            ;;
    esac
    
    echo "$cmd"
}

# Function to handle different actions
handle_action() {
    local compose_cmd=$(get_compose_cmd)
    
    case $ACTION in
        up)
            echo -e "${BLUE}Starting $ENVIRONMENT environment...${NC}"
            create_directories
            
            local up_cmd="$compose_cmd up"
            if [[ $BUILD == true ]]; then
                up_cmd="$up_cmd --build"
            fi
            if [[ $DETACHED == true ]]; then
                up_cmd="$up_cmd -d"
            fi
            
            eval $up_cmd
            
            if [[ $DETACHED == true ]]; then
                echo -e "${GREEN}Services started in background${NC}"
                eval "$compose_cmd ps"
            fi
            ;;
            
        down)
            echo -e "${BLUE}Stopping $ENVIRONMENT environment...${NC}"
            local down_cmd="$compose_cmd down"
            if [[ $CLEANUP == true ]]; then
                down_cmd="$down_cmd --volumes --remove-orphans"
            fi
            eval $down_cmd
            echo -e "${GREEN}Services stopped${NC}"
            ;;
            
        restart)
            echo -e "${BLUE}Restarting $ENVIRONMENT environment...${NC}"
            eval "$compose_cmd restart"
            echo -e "${GREEN}Services restarted${NC}"
            ;;
            
        logs)
            local logs_cmd="$compose_cmd logs"
            if [[ $LOGS == true ]]; then
                logs_cmd="$logs_cmd -f"
            fi
            eval $logs_cmd
            ;;
            
        build)
            echo -e "${BLUE}Building images for $ENVIRONMENT environment...${NC}"
            eval "$compose_cmd build --no-cache"
            echo -e "${GREEN}Images built successfully${NC}"
            ;;
            
        pull)
            echo -e "${BLUE}Pulling latest images for $ENVIRONMENT environment...${NC}"
            eval "$compose_cmd pull"
            echo -e "${GREEN}Images pulled successfully${NC}"
            ;;
            
        ps)
            eval "$compose_cmd ps"
            ;;
            
        exec)
            if [[ $# -lt 2 ]]; then
                echo -e "${RED}Error: exec requires service name and command${NC}"
                echo "Usage: $0 -e $ENVIRONMENT exec <service> <command>"
                exit 1
            fi
            local service=$1
            shift
            local command="$@"
            eval "$compose_cmd exec $service $command"
            ;;
            
        cleanup)
            echo -e "${BLUE}Cleaning up Docker resources...${NC}"
            docker system prune -f
            docker volume prune -f
            docker network prune -f
            echo -e "${GREEN}Cleanup completed${NC}"
            ;;
            
        *)
            echo -e "${RED}Error: Unknown action '$ACTION'${NC}"
            usage
            exit 1
            ;;
    esac
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -d|--detach)
            DETACHED=true
            shift
            ;;
        -b|--build)
            BUILD=true
            shift
            ;;
        -f|--follow)
            LOGS=true
            shift
            ;;
        -c|--cleanup)
            CLEANUP=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        up|down|restart|logs|build|pull|ps|exec|cleanup)
            ACTION="$1"
            shift
            break
            ;;
        *)
            echo -e "${RED}Error: Unknown option '$1'${NC}"
            usage
            exit 1
            ;;
    esac
done

# Main execution
echo -e "${BLUE}Learn2Play Docker Manager${NC}"
echo "================================"

# Check prerequisites
check_env_file
validate_environment

# Load environment variables
source .env

# Handle the action
if [[ $ACTION == "exec" ]]; then
    handle_action "$@"
else
    handle_action
fi

echo -e "${GREEN}Operation completed successfully!${NC}"