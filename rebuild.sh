#!/bin/bash

# Learn2Play - Interactive Container Rebuild Script
# Domain: l2p.korczewski.de

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
PROFILE="production"
ENV_FILE=".env"

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

print_header() {
    echo -e "${CYAN}$1${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS] [COMMAND]"
    echo
    echo "Learn2Play Container Manager - Non-interactive mode for automation"
    echo
    echo "COMMANDS:"
    echo "  status              Show container status"
    echo "  rebuild-all         Rebuild all services (with cache)"
    echo "  rebuild-all-force   Rebuild all services (no cache)"
    echo "  rebuild-frontend    Rebuild frontend only (with cache)"
    echo "  rebuild-frontend-force Rebuild frontend only (no cache)"
    echo "  rebuild-backend     Rebuild backend only (with cache)"
    echo "  rebuild-backend-force Rebuild backend only (no cache)"
    echo "  rebuild-db          Rebuild database only"
    echo "  reset-db            Reset database (with backup)"
    echo "  backup-db           Create database backup"
    echo "  logs [SERVICE]      View service logs (all, frontend, backend, postgres, traefik)"
    echo "  verify-routing      Verify Traefik routing"
    echo "  start               Start all services"
    echo "  stop                Stop all services"
    echo "  restart             Restart all services"
    echo "  cache-clean         Clean Docker build cache"
    echo "  cache-prune         Prune unused Docker images and volumes"
    echo
    echo "OPTIONS:"
    echo "  -h, --help          Show this help message"
    echo "  -y, --yes           Auto-confirm all prompts (for automation)"
    echo "  -v, --verbose       Verbose output"
    echo "  -p, --profile       Docker Compose profile (default: production)"
    echo "  -f, --file          Docker Compose file (default: docker-compose.yml)"
    echo "  -e, --env           Environment file (default: .env)"
    echo
    echo "EXAMPLES:"
    echo "  $0 rebuild-all -y                    # Rebuild all services without prompts"
    echo "  $0 rebuild-frontend -y               # Rebuild frontend only"
    echo "  $0 status                            # Show current status"
    echo "  $0 logs frontend                     # View frontend logs"
    echo "  $0 reset-db -y                       # Reset database with auto-confirm"
    echo
    echo "For interactive mode, run without parameters: $0"
}

# Function to parse command line arguments
parse_args() {
    AUTO_CONFIRM=false
    VERBOSE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -y|--yes)
                AUTO_CONFIRM=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -p|--profile)
                PROFILE="$2"
                shift 2
                ;;
            -f|--file)
                COMPOSE_FILE="$2"
                shift 2
                ;;
            -e|--env)
                ENV_FILE="$2"
                shift 2
                ;;
            status|rebuild-all|rebuild-frontend|rebuild-backend|rebuild-db|reset-db|backup-db|logs|verify-routing|start|stop|restart)
                COMMAND="$1"
                shift
                # Handle logs command with optional service parameter
                if [[ "$COMMAND" == "logs" && $# -gt 0 ]]; then
                    LOGS_SERVICE="$1"
                    shift
                fi
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Function to handle auto-confirmation
auto_confirm() {
    if [[ "$AUTO_CONFIRM" == "true" ]]; then
        return 0
    else
        read -p "$1 (y/N): " confirm
        [[ $confirm =~ ^[Yy]$ ]]
    fi
}

# Function to check if required files exist
check_prerequisites() {
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        print_error "docker-compose.yml not found!"
        exit 1
    fi
    
    if [[ ! -f "$ENV_FILE" ]]; then
        print_error ".env file not found!"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed!"
        exit 1
    fi
}

# Function to load environment variables
load_env() {
    if [[ -f "$ENV_FILE" ]]; then
        # Use a safer method to load environment variables
        while IFS= read -r line || [[ -n "$line" ]]; do
            if [[ "$line" =~ ^[^#]*= ]]; then
                export "$line"
            fi
        done < "$ENV_FILE"
        print_status "Environment variables loaded from $ENV_FILE"
    fi
}

# Function to show current status
show_status() {
    print_header "=== Current Container Status ==="
    docker-compose --profile "$PROFILE" ps
    echo
    
    print_header "=== Service Health ==="
    if docker-compose --profile "$PROFILE" ps --services --filter "status=running" | grep -q .; then
        for service in $(docker-compose --profile "$PROFILE" ps --services --filter "status=running"); do
            if docker-compose --profile "$PROFILE" exec -T "$service" echo "Service $service is responsive" 2>/dev/null; then
                print_success "$service: ✓ Running and responsive"
            else
                print_warning "$service: ⚠ Running but not responsive"
            fi
        done
    else
        print_warning "No services are currently running"
    fi
    echo
}

# Function to backup database
backup_database() {
    print_status "Creating database backup..."
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if docker-compose --profile "$PROFILE" exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$backup_file"; then
        print_success "Database backup created: $backup_file"
        return 0
    else
        print_error "Failed to create database backup"
        return 1
    fi
}

# Function to reset database
reset_database() {
    if [[ "$AUTO_CONFIRM" != "true" ]]; then
        print_warning "This will PERMANENTLY DELETE all data in the database!"
        echo -e "Database: ${YELLOW}$POSTGRES_DB${NC}"
        echo -e "User: ${YELLOW}$POSTGRES_USER${NC}"
        echo
        
        if ! auto_confirm "Are you sure you want to proceed?"; then
            print_status "Database reset cancelled"
            return 0
        fi
    fi
    
    print_status "Creating backup before reset..."
    if backup_database; then
        print_status "Stopping and removing database container..."
        docker-compose --profile "$PROFILE" stop postgres
        docker-compose --profile "$PROFILE" rm -f postgres
        
        print_status "Removing database volume..."
        docker volume rm "$(docker-compose config --profile "$PROFILE" | grep -A 5 volumes: | grep postgres_data -A 1 | tail -1 | awk '{print $1}' | sed 's/://')" 2>/dev/null || true
        
        print_status "Starting database with fresh data..."
        docker-compose --profile "$PROFILE" up -d postgres
        
        print_status "Waiting for database to be ready..."
        sleep 10
        
        print_success "Database has been reset and reinitialized"
    else
        print_error "Backup failed. Database reset aborted for safety."
        return 1
    fi
}

# Function to rebuild specific service with intelligent caching
rebuild_service() {
    local service=$1
    local force_rebuild=${2:-false}
    
    print_status "Rebuilding $service..."
    
    # Stop the service
    docker-compose --profile "$PROFILE" stop "$service"
    
    # Remove the container
    docker-compose --profile "$PROFILE" rm -f "$service"
    
    # Check if we should force rebuild or use cache
    local build_args=""
    if [[ "$force_rebuild" == "true" ]]; then
        build_args="--no-cache"
        print_status "Force rebuilding $service (no cache)"
    else
        print_status "Rebuilding $service with cache optimization"
    fi
    
    # Rebuild and start
    docker-compose --profile "$PROFILE" build $build_args "$service"
    docker-compose --profile "$PROFILE" up -d "$service"
    
    print_success "$service has been rebuilt"
}

# Function to rebuild all services with intelligent caching
rebuild_all() {
    local force_rebuild=${1:-false}
    
    print_status "Rebuilding all services..."
    
    # Stop all services
    print_status "Stopping all services..."
    docker-compose --profile "$PROFILE" down
    
    # Check if we should force rebuild or use cache
    local build_args=""
    if [[ "$force_rebuild" == "true" ]]; then
        build_args="--no-cache"
        print_status "Force rebuilding all services (no cache)"
    else
        print_status "Rebuilding all services with cache optimization"
    fi
    
    # Build all services
    print_status "Building all services..."
    docker-compose --profile "$PROFILE" build $build_args
    
    # Start all services
    print_status "Starting all services..."
    docker-compose --profile "$PROFILE" up -d
    
    print_success "All services have been rebuilt"
}

# Function to view logs
view_logs() {
    local service=${LOGS_SERVICE:-"all"}
    
    case $service in
        all) docker-compose --profile "$PROFILE" logs -f ;;
        frontend) docker-compose --profile "$PROFILE" logs -f frontend ;;
        backend) docker-compose --profile "$PROFILE" logs -f backend ;;
        postgres) docker-compose --profile "$PROFILE" logs -f postgres ;;
        traefik) docker-compose --profile "$PROFILE" logs -f traefik ;;
        *) 
            print_error "Invalid service: $service"
            print_status "Valid services: all, frontend, backend, postgres, traefik"
            exit 1
            ;;
    esac
}

# Function to clean Docker build cache
clean_cache() {
    print_header "=== Docker Cache Cleanup ==="
    print_status "Cleaning Docker build cache..."
    
    # Clean build cache
    docker builder prune -f
    
    # Clean system cache
    docker system prune -f
    
    print_success "Docker cache cleaned successfully"
}

# Function to prune unused Docker resources
prune_cache() {
    print_header "=== Docker Resource Pruning ==="
    print_status "Pruning unused Docker images, containers, and volumes..."
    
    # Prune everything (images, containers, networks, volumes)
    docker system prune -a -f --volumes
    
    print_success "Docker resources pruned successfully"
}

# Function to verify Traefik routing
verify_routing() {
    print_header "=== Traefik Routing Verification ==="
    print_status "Domain: $DOMAIN"
    print_status "Frontend URL: https://$DOMAIN"
    print_status "Backend API URL: https://$DOMAIN/api"
    echo
    
    if command -v curl &> /dev/null; then
        print_status "Testing connectivity..."
        
        # Test if Traefik is running
        if docker-compose --profile "$PROFILE" ps traefik | grep -q "Up"; then
            print_success "Traefik container is running"
        else
            print_error "Traefik container is not running"
        fi
        
        # Test local connectivity
        if curl -k -s --max-time 10 http://localhost:80 > /dev/null 2>&1; then
            print_success "Local HTTP port (80) is accessible"
        else
            print_warning "Local HTTP port (80) is not accessible"
        fi
        
        if curl -k -s --max-time 10 https://localhost:443 > /dev/null 2>&1; then
            print_success "Local HTTPS port (443) is accessible"
        else
            print_warning "Local HTTPS port (443) is not accessible"
        fi
    else
        print_warning "curl not available for connectivity testing"
    fi
    
    echo
    print_status "Manual verification steps:"
    echo "1. Ensure DNS for $DOMAIN points to this server"
    echo "2. Visit https://$DOMAIN to test frontend"
    echo "3. Visit https://$DOMAIN/api/health to test backend"
    echo "4. Check SSL certificate is valid and from Let's Encrypt"
}

# Function to show main menu (interactive mode)
show_menu() {
    clear
    print_header "======================================"
    print_header "    Learn2Play Container Manager"
    print_header "    Domain: $DOMAIN"
    print_header "======================================"
    echo
    echo "1)  Show container status"
    echo "2)  Rebuild all services"
    echo "3)  Rebuild frontend only"
    echo "4)  Rebuild backend only"
    echo "5)  Rebuild database only"
    echo "6)  Reset database (with backup)"
    echo "7)  Create database backup"
    echo "8)  View service logs"
    echo "9)  Verify Traefik routing"
    echo "10) Start all services"
    echo "11) Stop all services"
    echo "12) Restart all services"
    echo "0)  Exit"
    echo
}

# Function to execute command
execute_command() {
    case $COMMAND in
        status)
            show_status
            ;;
        rebuild-all)
            rebuild_all
            ;;
        rebuild-all-force)
            rebuild_all "true"
            ;;
        rebuild-frontend)
            rebuild_service "frontend"
            ;;
        rebuild-frontend-force)
            rebuild_service "frontend" "true"
            ;;
        rebuild-backend)
            rebuild_service "backend"
            ;;
        rebuild-backend-force)
            rebuild_service "backend" "true"
            ;;
        rebuild-db)
            rebuild_service "postgres"
            ;;
        reset-db)
            reset_database
            ;;
        backup-db)
            backup_database
            ;;
        logs)
            view_logs
            ;;
        verify-routing)
            verify_routing
            ;;
        start)
            print_status "Starting all services..."
            docker-compose --profile "$PROFILE" up -d
            print_success "All services started"
            ;;
        stop)
            print_status "Stopping all services..."
            docker-compose --profile "$PROFILE" down
            print_success "All services stopped"
            ;;
        restart)
            print_status "Restarting all services..."
            docker-compose --profile "$PROFILE" restart
            print_success "All services restarted"
            ;;
        cache-clean)
            clean_cache
            ;;
        cache-prune)
            prune_cache
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# Main script execution
main() {
    # Parse command line arguments
    parse_args "$@"
    
    # If no command specified, run interactive mode
    if [[ -z "$COMMAND" ]]; then
        check_prerequisites
        load_env
        
        while true; do
            show_menu
            read -p "Enter your choice (0-12): " choice
            echo
            
            case $choice in
                1)
                    show_status
                    read -p "Press Enter to continue..."
                    ;;
                2)
                    rebuild_all
                    read -p "Press Enter to continue..."
                    ;;
                3)
                    rebuild_service "frontend"
                    read -p "Press Enter to continue..."
                    ;;
                4)
                    rebuild_service "backend"
                    read -p "Press Enter to continue..."
                    ;;
                5)
                    rebuild_service "postgres"
                    read -p "Press Enter to continue..."
                    ;;
                6)
                    reset_database
                    read -p "Press Enter to continue..."
                    ;;
                7)
                    backup_database
                    read -p "Press Enter to continue..."
                    ;;
                8)
                    view_logs
                    ;;
                9)
                    verify_routing
                    read -p "Press Enter to continue..."
                    ;;
                10)
                    print_status "Starting all services..."
                    docker-compose --profile "$PROFILE" up -d
                    print_success "All services started"
                    read -p "Press Enter to continue..."
                    ;;
                11)
                    print_status "Stopping all services..."
                    docker-compose --profile "$PROFILE" down
                    print_success "All services stopped"
                    read -p "Press Enter to continue..."
                    ;;
                12)
                    print_status "Restarting all services..."
                    docker-compose --profile "$PROFILE" restart
                    print_success "All services restarted"
                    read -p "Press Enter to continue..."
                    ;;
                0)
                    print_success "Goodbye!"
                    exit 0
                    ;;
                *)
                    print_error "Invalid choice. Please try again."
                    sleep 2
                    ;;
            esac
        done
    else
        # Non-interactive mode
        check_prerequisites
        load_env
        execute_command
    fi
}

# Run the main function
main "$@" 