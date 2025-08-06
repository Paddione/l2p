#!/bin/bash

# Quick Test Script for Learn2Play
# Lightweight alternative to test-runner.sh when it gets stuck

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function log() {
  local level=$1
  shift
  local message="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  case $level in
    "INFO")
      echo -e "${BLUE}[INFO]${NC} ${timestamp} - $message"
      ;;
    "SUCCESS")
      echo -e "${GREEN}[SUCCESS]${NC} ${timestamp} - $message"
      ;;
    "WARNING")
      echo -e "${YELLOW}[WARNING]${NC} ${timestamp} - $message"
      ;;
    "ERROR")
      echo -e "${RED}[ERROR]${NC} ${timestamp} - $message"
      ;;
  esac
}

function show_help() {
  cat << EOF
Quick Test Script for Learn2Play

Usage: $0 [OPTIONS]

OPTIONS:
  -h, --help          Show this help message
  --check-env         Only check environment setup
  --check-deps        Only check dependencies
  --check-services    Only check if services are running

EXAMPLES:
  $0                    # Run all quick checks
  $0 --check-env        # Only check environment
  $0 --check-deps       # Only check dependencies
EOF
}

# Parse command line arguments
CHECK_ENV_ONLY=false
CHECK_DEPS_ONLY=false
CHECK_SERVICES_ONLY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --help|-h)
      show_help
      exit 0
      ;;
    --check-env)
      CHECK_ENV_ONLY=true
      shift
      ;;
    --check-deps)
      CHECK_DEPS_ONLY=true
      shift
      ;;
    --check-services)
      CHECK_SERVICES_ONLY=true
      shift
      ;;
    *)
      log "ERROR" "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

function check_environment() {
  log "INFO" "Checking environment setup..."
  
  local issues=0
  
  # Check if we're in the right directory
  if [[ ! -f "package.json" ]]; then
    log "ERROR" "Not in project root directory (package.json not found)"
    ((issues++))
  else
    log "SUCCESS" "Project root directory found"
  fi
  
  # Check if .env file exists
  if [[ ! -f ".env" ]]; then
    log "WARNING" ".env file not found - some tests may fail"
    ((issues++))
  else
    log "SUCCESS" ".env file found"
  fi
  
  # Check if test directories exist
  if [[ ! -d "testing" ]]; then
    log "ERROR" "Test directories not found"
    ((issues++))
  else
    log "SUCCESS" "Test directories found"
  fi
  
  # Check if docker-compose files exist
  if [[ ! -f "docker-compose.yml" ]]; then
    log "ERROR" "docker-compose.yml not found"
    ((issues++))
  else
    log "SUCCESS" "docker-compose.yml found"
  fi
  
  if [[ ! -f "testing/docker-compose.test.yml" ]]; then
    log "ERROR" "testing/docker-compose.test.yml not found"
    ((issues++))
  else
    log "SUCCESS" "testing/docker-compose.test.yml found"
  fi
  
  return $issues
}

function check_dependencies() {
  log "INFO" "Checking dependencies..."
  
  local issues=0
  
  # Check if Node.js is installed
  if ! command -v node &> /dev/null; then
    log "ERROR" "Node.js not found"
    ((issues++))
  else
    local node_version=$(node --version)
    log "SUCCESS" "Node.js found: $node_version"
  fi
  
  # Check if npm is installed
  if ! command -v npm &> /dev/null; then
    log "ERROR" "npm not found"
    ((issues++))
  else
    local npm_version=$(npm --version)
    log "SUCCESS" "npm found: $npm_version"
  fi
  
  # Check if Docker is installed
  if ! command -v docker &> /dev/null; then
    log "ERROR" "Docker not found"
    ((issues++))
  else
    local docker_version=$(docker --version)
    log "SUCCESS" "Docker found: $docker_version"
  fi
  
  # Check if Docker Compose is installed
  if ! command -v docker-compose &> /dev/null; then
    log "ERROR" "Docker Compose not found"
    ((issues++))
  else
    local compose_version=$(docker-compose --version)
    log "SUCCESS" "Docker Compose found: $compose_version"
  fi
  
  # Check if timeout command is available
  if ! command -v timeout &> /dev/null; then
    log "WARNING" "timeout command not found - some tests may hang"
    ((issues++))
  else
    log "SUCCESS" "timeout command found"
  fi
  
  # Check if node_modules exist in key directories
  if [[ ! -d "node_modules" ]]; then
    log "WARNING" "Root node_modules not found - run 'npm install'"
    ((issues++))
  else
    log "SUCCESS" "Root node_modules found"
  fi
  
  if [[ ! -d "testing/node_modules" ]]; then
    log "WARNING" "Testing node_modules not found - run 'cd testing && npm install'"
    ((issues++))
  else
    log "SUCCESS" "Testing node_modules found"
  fi
  
  if [[ ! -d "frontend/node_modules" ]]; then
    log "WARNING" "Frontend node_modules not found - run 'cd frontend && npm install'"
    ((issues++))
  else
    log "SUCCESS" "Frontend node_modules found"
  fi
  
  if [[ ! -d "backend/node_modules" ]]; then
    log "WARNING" "Backend node_modules not found - run 'cd backend && npm install'"
    ((issues++))
  else
    log "SUCCESS" "Backend node_modules found"
  fi
  
  return $issues
}

function check_services() {
  log "INFO" "Checking if services are running..."
  
  local issues=0
  
  # Check if Docker is running
  if ! docker info &> /dev/null; then
    log "ERROR" "Docker is not running"
    ((issues++))
    return $issues
  fi
  
  # Check if any containers are running
  local running_containers=$(docker ps --format "table {{.Names}}" | grep -E "(l2p|learn2play)" | wc -l)
  if [[ $running_containers -eq 0 ]]; then
    log "INFO" "No Learn2Play containers are currently running"
  else
    log "SUCCESS" "Found $running_containers running Learn2Play container(s)"
  fi
  
  # Check if ports are in use
  if netstat -tuln 2>/dev/null | grep -q ":3000 "; then
    log "WARNING" "Port 3000 is in use (frontend)"
  else
    log "SUCCESS" "Port 3000 is available"
  fi
  
  if netstat -tuln 2>/dev/null | grep -q ":3001 "; then
    log "WARNING" "Port 3001 is in use (backend)"
  else
    log "SUCCESS" "Port 3001 is available"
  fi
  
  if netstat -tuln 2>/dev/null | grep -q ":5432 "; then
    log "WARNING" "Port 5432 is in use (database)"
  else
    log "SUCCESS" "Port 5432 is available"
  fi
  
  if netstat -tuln 2>/dev/null | grep -q ":5433 "; then
    log "WARNING" "Port 5433 is in use (test database)"
  else
    log "SUCCESS" "Port 5433 is available"
  fi
  
  return $issues
}

function run_simple_tests() {
  log "INFO" "Running simple tests..."
  
  local issues=0
  
  # Test if we can run a simple npm command
  if cd testing && npm --version &> /dev/null; then
    log "SUCCESS" "npm commands work in test directories"
  else
    log "ERROR" "npm commands failed in test directories"
    ((issues++))
  fi
  cd ..
  
  # Test if we can run a simple docker command
  if docker --version &> /dev/null; then
    log "SUCCESS" "Docker commands work"
  else
    log "ERROR" "Docker commands failed"
    ((issues++))
  fi
  
  # Test if we can access the distributed test directory structure
  if [[ -d "testing/unit" ]]; then
    log "SUCCESS" "Unit test directory accessible"
  else
    log "WARNING" "Unit test directory not found"
    ((issues++))
  fi
  
  if [[ -d "testing/e2e" ]]; then
    log "SUCCESS" "E2E test directory accessible"
  else
    log "WARNING" "E2E test directory not found"
    ((issues++))
  fi
  
  return $issues
}

function cleanup() {
  log "INFO" "Cleaning up..."
  
  # Stop any running test containers
  cd testing 2>/dev/null && docker-compose -f docker-compose.test.yml down 2>/dev/null || true
  cd ..
  
  # Remove test artifacts
  rm -f .env.test 2>/dev/null || true
}

# Set up signal handlers for cleanup
trap cleanup EXIT INT TERM

# Main execution
log "INFO" "Starting quick test checks..."

total_issues=0

if [[ $CHECK_ENV_ONLY == true ]]; then
  check_environment
  total_issues=$?
elif [[ $CHECK_DEPS_ONLY == true ]]; then
  check_dependencies
  total_issues=$?
elif [[ $CHECK_SERVICES_ONLY == true ]]; then
  check_services
  total_issues=$?
else
  # Run all checks
  check_environment
  total_issues=$?
  
  check_dependencies
  total_issues=$((total_issues + $?))
  
  check_services
  total_issues=$((total_issues + $?))
  
  run_simple_tests
  total_issues=$((total_issues + $?))
fi

if [[ $total_issues -eq 0 ]]; then
  log "SUCCESS" "All quick tests passed! ✅"
  exit 0
else
  log "WARNING" "Found $total_issues issue(s) that need attention"
  log "INFO" "Run './test-runner.sh smoke' for a more comprehensive test"
  exit 1
fi 