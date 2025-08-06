#!/bin/bash

# Test CLI Wrapper Script
# Provides convenient shortcuts for common test CLI operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Test CLI Wrapper - Convenient shortcuts for test operations"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Quick Commands:"
    echo "  quick-test          Run unit tests quickly"
    echo "  full-test           Run all test types"
    echo "  env-start           Start test environment"
    echo "  env-stop            Stop test environment"
    echo "  env-status          Check environment status"
    echo "  health-check        Perform health check"
    echo "  coverage            Show coverage summary"
    echo "  validate            Validate configuration"
    echo "  info                Show system information"
    echo "  help                Show this help message"
    echo ""
    echo "Advanced Commands:"
    echo "  test <type>         Run specific test type (unit, integration, e2e, performance, accessibility)"
    echo "  env <action>        Environment management (start, stop, reset, status, logs)"
    echo "  config <action>     Configuration management (show, environments, test-types, jest)"
    echo "  debug <action>      Debugging utilities (health, validate, info, cleanup, troubleshoot)"
    echo "  report <action>     Report generation (generate, view, coverage)"
    echo ""
    echo "Examples:"
    echo "  $0 quick-test"
    echo "  $0 env-start"
    echo "  $0 test unit --coverage"
    echo "  $0 health-check"
}

# Main command processing
case "$1" in
    "quick-test")
        print_status "Running quick unit tests..."
        node test-cli.js test unit --env local --parallel --coverage
        ;;
    
    "full-test")
        print_status "Running comprehensive test suite..."
        node test-cli.js test all --env local --coverage --verbose
        ;;
    
    "env-start")
        print_status "Starting test environment..."
        node test-cli.js env start --env local
        ;;
    
    "env-stop")
        print_status "Stopping test environment..."
        node test-cli.js env stop --env local
        ;;
    
    "env-status")
        print_status "Checking environment status..."
        node test-cli.js env status --env local
        ;;
    
    "health-check")
        print_status "Performing health check..."
        node test-cli.js debug health --env local
        ;;
    
    "coverage")
        print_status "Showing coverage summary..."
        node test-cli.js report coverage --detailed
        ;;
    
    "validate")
        print_status "Validating configuration..."
        node test-cli.js debug validate
        ;;
    
    "info")
        print_status "Showing system information..."
        node test-cli.js debug info
        ;;
    
    "test")
        if [ -z "$2" ]; then
            print_error "Test type required. Available: unit, integration, e2e, performance, accessibility, all"
            exit 1
        fi
        print_status "Running $2 tests..."
        shift
        node test-cli.js test "$@"
        ;;
    
    "env")
        if [ -z "$2" ]; then
            print_error "Environment action required. Available: start, stop, reset, status, logs"
            exit 1
        fi
        print_status "Environment action: $2"
        shift
        node test-cli.js env "$@"
        ;;
    
    "config")
        if [ -z "$2" ]; then
            print_error "Config action required. Available: show, environments, test-types, jest"
            exit 1
        fi
        print_status "Configuration action: $2"
        shift
        node test-cli.js config "$@"
        ;;
    
    "debug")
        if [ -z "$2" ]; then
            print_error "Debug action required. Available: health, validate, info, cleanup, troubleshoot"
            exit 1
        fi
        print_status "Debug action: $2"
        shift
        node test-cli.js debug "$@"
        ;;
    
    "report")
        if [ -z "$2" ]; then
            print_error "Report action required. Available: generate, view, coverage"
            exit 1
        fi
        print_status "Report action: $2"
        shift
        node test-cli.js report "$@"
        ;;
    
    "help"|"--help"|"-h"|"")
        show_usage
        ;;
    
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac

# Check exit code and provide feedback
if [ $? -eq 0 ]; then
    print_success "Command completed successfully"
else
    print_error "Command failed with exit code $?"
    exit 1
fi