#!/bin/bash

# Learn2Play Test Runner Script
# Comprehensive testing suite for the Learn2Play platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_ENV_TIMEOUT=60  # Reduced from 120 to 60 seconds
CLEANUP_ON_EXIT=true
VERBOSE=false
PARALLEL=true
MAX_RETRIES=3

function show_help() {
  cat << EOF
Learn2Play Test Runner

Usage: $0 [OPTIONS] [TEST_TYPE]

TEST_TYPES:
  all             Run all tests (default)
  unit            Run unit tests only
  integration     Run integration tests only
  e2e             Run E2E tests only
  smoke           Run smoke tests only
  performance     Run performance tests only
  accessibility   Run accessibility tests only
  error-handling  Run error handling tests only

OPTIONS:
  -h, --help          Show this help message
  -v, --verbose       Enable verbose output
  --no-cleanup        Don't cleanup test environment on exit
  --sequential        Run tests sequentially instead of parallel
  --timeout SECONDS   Set timeout for test environment startup (default: 60)

EXAMPLES:
  $0                          # Run all tests
  $0 smoke                    # Run smoke tests only
  $0 --verbose e2e            # Run E2E tests with verbose output
  $0 --no-cleanup unit        # Run unit tests without cleanup
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --help|-h)
      show_help
      exit 0
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --no-cleanup)
      CLEANUP_ON_EXIT=false
      shift
      ;;
    --sequential)
      PARALLEL=false
      shift
      ;;
    --timeout)
      TEST_ENV_TIMEOUT="$2"
      shift 2
      ;;
    *)
      TEST_TYPE="$1"
      shift
      ;;
  esac
done

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
  
  if [[ $VERBOSE == true ]]; then
    echo "[VERBOSE] $message" >> test-runner.log
  fi
}

function cleanup() {
  if [[ $CLEANUP_ON_EXIT == true ]]; then
    log "INFO" "Cleaning up test environment..."
    
    # Stop test environment
    cd testing 2>/dev/null && docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true
    cd ..
    
    # Stop production environment if it was started
    docker-compose down 2>/dev/null || true
    
    # Clean up test artifacts
    rm -rf frontend/e2e/test-results 2>/dev/null || true
    rm -rf frontend/e2e/playwright-report 2>/dev/null || true
    rm -rf frontend/coverage 2>/dev/null || true
    rm -rf backend/coverage 2>/dev/null || true
    rm -f .env.test 2>/dev/null || true
  fi
}

function check_service_health() {
  local url=$1
  local service_name=$2
  local max_attempts=5
  local attempt=1
  
  while [[ $attempt -le $max_attempts ]]; do
    if curl -f -s "$url" >/dev/null 2>&1; then
      return 0
    fi
    
    log "INFO" "Attempt $attempt/$max_attempts: $service_name not ready yet..."
    sleep 2
    ((attempt++))
  done
  
  return 1
}

function setup_test_environment() {
  log "INFO" "Setting up test environment..."
  
  # Check if we're in the right directory
  if [[ ! -f "testing/docker-compose.test.yml" ]]; then
    log "ERROR" "Test environment not found. Make sure you're in the project root directory."
    return 1
  fi
  
  # Create test environment file
  cat > .env.test << EOF
NODE_ENV=test
POSTGRES_DB=l2p_test
POSTGRES_USER=l2p_user
POSTGRES_PASSWORD=l2p_password
DATABASE_URL=postgresql://l2p_user:l2p_password@localhost:5433/l2p_test
BACKEND_PORT=3001
JWT_SECRET=test-jwt-secret-for-testing-only
JWT_REFRESH_SECRET=test-jwt-refresh-secret-for-testing-only
FRONTEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
DB_SSL=false
LOG_LEVEL=warn
EOF

  # Start test services
  log "INFO" "Starting test services..."
  cd testing
  docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true
  docker-compose -f docker-compose.test.yml up -d
  
  # Wait for services to be ready with timeout
  log "INFO" "Waiting for services to be ready (timeout: ${TEST_ENV_TIMEOUT}s)..."
  
  local start_time=$(date +%s)
  local backend_ready=false
  local frontend_ready=false
  
  while [[ $(($(date +%s) - start_time)) -lt $TEST_ENV_TIMEOUT ]]; do
    if [[ $backend_ready == false ]] && check_service_health "http://localhost:3001/api/health" "Backend"; then
      backend_ready=true
      log "SUCCESS" "Backend service is ready"
    fi
    
    if [[ $frontend_ready == false ]] && check_service_health "http://localhost:3000" "Frontend"; then
      frontend_ready=true
      log "SUCCESS" "Frontend service is ready"
    fi
    
    if [[ $backend_ready == true && $frontend_ready == true ]]; then
      log "SUCCESS" "All services are ready"
      cd ..
      return 0
    fi
    
    sleep 2
  done
  
  log "ERROR" "Services failed to start within timeout"
  cd ..
  return 1
}

function run_unit_tests() {
  log "INFO" "Running unit tests..."
  
  local frontend_exit=0
  local backend_exit=0
  
  # Check if test files exist
  if [[ ! -d "frontend/src/__tests__/unit" ]] || [[ ! -d "backend/src/__tests__/unit" ]]; then
    log "WARNING" "Unit test directories not found. Skipping unit tests."
    return 0
  fi
  
  if [[ $PARALLEL == true ]]; then
    # Run tests in parallel
    (
      log "INFO" "Running frontend unit tests..."
      cd frontend && npm run test:unit
    ) &
    local frontend_pid=$!
    
    (
      log "INFO" "Running backend unit tests..."
      cd backend && npm run test:unit
    ) &
    local backend_pid=$!
    
    # Wait for both to complete with timeout
    local timeout=300  # 5 minutes timeout
    local start_time=$(date +%s)
    
    while [[ $(($(date +%s) - start_time)) -lt $timeout ]]; do
      if ! kill -0 $frontend_pid 2>/dev/null && ! kill -0 $backend_pid 2>/dev/null; then
        break
      fi
      sleep 1
    done
    
    # Kill processes if they're still running
    kill -9 $frontend_pid 2>/dev/null || true
    kill -9 $backend_pid 2>/dev/null || true
    
    # Check exit codes
    wait $frontend_pid 2>/dev/null || frontend_exit=$?
    wait $backend_pid 2>/dev/null || backend_exit=$?
  else
    # Run tests sequentially
    log "INFO" "Running frontend unit tests..."
    cd frontend && npm run test:unit || frontend_exit=$?
    cd ..
    
    log "INFO" "Running backend unit tests..."
    cd backend && npm run test:unit || backend_exit=$?
    cd ..
  fi
  
  if [[ $frontend_exit -eq 0 && $backend_exit -eq 0 ]]; then
    log "SUCCESS" "All unit tests passed"
    return 0
  else
    log "ERROR" "Some unit tests failed (Frontend: $frontend_exit, Backend: $backend_exit)"
    return 1
  fi
}

function run_e2e_tests() {
  log "INFO" "Running E2E tests..."
  
  setup_test_environment || return 1
  
  # Check if E2E tests exist
  if [[ ! -d "frontend/e2e/tests" ]]; then
    log "WARNING" "E2E test directory not found. Skipping E2E tests."
    return 0
  fi
  
  cd frontend/e2e
  
  # Install browsers if needed
  if [[ ! -d ~/.cache/ms-playwright ]]; then
    log "INFO" "Installing Playwright browsers..."
    npx playwright install --with-deps
  fi
  
  # Run E2E tests with timeout
  log "INFO" "Executing E2E test suite..."
  timeout 600 npm test || {  # 10 minute timeout
    log "ERROR" "E2E tests failed or timed out"
    cd ../..
    return 1
  }
  
  log "SUCCESS" "E2E tests passed"
  cd ../..
  return 0
}

function run_smoke_tests() {
  log "INFO" "Running smoke tests..."
  
  setup_test_environment || return 1
  
  # Check if smoke tests exist
  if [[ ! -d "frontend/e2e/tests/smoke" ]]; then
    log "WARNING" "Smoke test directory not found. Skipping smoke tests."
    return 0
  fi
  
  cd frontend/e2e
  timeout 300 npm run test:smoke || {  # 5 minute timeout
    log "ERROR" "Smoke tests failed or timed out"
    cd ../..
    return 1
  }
  
  log "SUCCESS" "Smoke tests passed"
  cd ../..
  return 0
}

function run_performance_tests() {
  log "INFO" "Running performance tests..."
  
  setup_test_environment || return 1
  
  # Check if performance tests exist
  if [[ ! -d "frontend/e2e/tests/performance" ]]; then
    log "WARNING" "Performance test directory not found. Skipping performance tests."
    return 0
  fi
  
  cd frontend/e2e
  timeout 600 npm run test:performance || {  # 10 minute timeout
    log "ERROR" "Performance tests failed or timed out"
    cd ../..
    return 1
  }
  
  log "SUCCESS" "Performance tests passed"
  cd ../..
  return 0
}

function run_accessibility_tests() {
  log "INFO" "Running accessibility tests..."
  
  setup_test_environment || return 1
  
  # Check if accessibility tests exist
  if [[ ! -d "frontend/e2e/tests/accessibility" ]]; then
    log "WARNING" "Accessibility test directory not found. Skipping accessibility tests."
    return 0
  fi
  
  cd frontend/e2e
  timeout 300 npm run test:accessibility || {  # 5 minute timeout
    log "ERROR" "Accessibility tests failed or timed out"
    cd ../..
    return 1
    }
  
  log "SUCCESS" "Accessibility tests passed"
  cd ../..
  return 0
}

function run_error_handling_tests() {
  log "INFO" "Running error handling tests..."
  
  setup_test_environment || return 1
  
  # Check if error handling tests exist
  if [[ ! -d "frontend/e2e/tests/error-handling" ]]; then
    log "WARNING" "Error handling test directory not found. Skipping error handling tests."
    return 0
  fi
  
  cd frontend/e2e
  timeout 300 npm run test:error-handling || {  # 5 minute timeout
    log "ERROR" "Error handling tests failed or timed out"
    cd ../..
    return 1
  }
  
  log "SUCCESS" "Error handling tests passed"
  cd ../..
  return 0
}

function run_integration_tests() {
  log "INFO" "Running integration tests..."
  
  local frontend_exit=0
  local backend_exit=0
  
  # Check if integration test directories exist
  if [[ ! -d "frontend/src/__tests__/integration" ]] && [[ ! -d "backend/src/__tests__/integration" ]]; then
    log "WARNING" "Integration test directories not found. Skipping integration tests."
    return 0
  fi
  
  if [[ $PARALLEL == true ]]; then
    # Run tests in parallel
    (
      if [[ -d "frontend/src/__tests__/integration" ]]; then
        log "INFO" "Running frontend integration tests..."
        cd frontend && npm run test:integration
      fi
    ) &
    local frontend_pid=$!
    
    (
      if [[ -d "backend/src/__tests__/integration" ]]; then
        log "INFO" "Running backend integration tests..."
        cd backend && npm run test:integration
      fi
    ) &
    local backend_pid=$!
    
    # Wait for both to complete with timeout
    local timeout=600  # 10 minutes timeout
    local start_time=$(date +%s)
    
    while [[ $(($(date +%s) - start_time)) -lt $timeout ]]; do
      if ! kill -0 $frontend_pid 2>/dev/null && ! kill -0 $backend_pid 2>/dev/null; then
        break
      fi
      sleep 1
    done
    
    # Kill processes if they're still running
    kill -9 $frontend_pid 2>/dev/null || true
    kill -9 $backend_pid 2>/dev/null || true
    
    # Check exit codes
    wait $frontend_pid 2>/dev/null || frontend_exit=$?
    wait $backend_pid 2>/dev/null || backend_exit=$?
  else
    # Run tests sequentially
    if [[ -d "frontend/src/__tests__/integration" ]]; then
      log "INFO" "Running frontend integration tests..."
      cd frontend && npm run test:integration || frontend_exit=$?
      cd ..
    fi
    
    if [[ -d "backend/src/__tests__/integration" ]]; then
      log "INFO" "Running backend integration tests..."
      cd backend && npm run test:integration || backend_exit=$?
      cd ..
    fi
  fi
  
  if [[ $frontend_exit -eq 0 && $backend_exit -eq 0 ]]; then
    log "SUCCESS" "All integration tests passed"
    return 0
  else
    log "ERROR" "Some integration tests failed (Frontend: $frontend_exit, Backend: $backend_exit)"
    return 1
  fi
}

function run_all_tests() {
  log "INFO" "Running complete test suite..."
  
  local exit_code=0
  
  # Run unit tests first (fastest)
  run_unit_tests || exit_code=1
  
  # Run integration tests
  run_integration_tests || exit_code=1
  
  # Run smoke tests (quick E2E validation)
  run_smoke_tests || exit_code=1
  
  # Run error handling tests
  run_error_handling_tests || exit_code=1
  
  # Run performance tests
  run_performance_tests || exit_code=1
  
  # Run accessibility tests
  run_accessibility_tests || exit_code=1
  
  if [[ $exit_code -eq 0 ]]; then
    log "SUCCESS" "All tests passed! 🎉"
  else
    log "ERROR" "Some tests failed. Check the output above for details."
  fi
  
  return $exit_code
}

function generate_test_report() {
  log "INFO" "Generating test report..."
  
  cat > test-report.md << EOF
# Test Execution Report

**Timestamp:** $(date)
**Test Type:** ${TEST_TYPE:-all}
**Environment:** Test

## Results Summary

EOF

  if [[ -f frontend/coverage/lcov.info ]]; then
    echo "### Frontend Coverage" >> test-report.md
    echo "\`\`\`" >> test-report.md
    cd frontend && npm run test:coverage:summary >> ../test-report.md 2>/dev/null || echo "Coverage data not available" >> ../test-report.md
    cd ..
    echo "\`\`\`" >> test-report.md
  fi
  
  if [[ -f backend/coverage/lcov.info ]]; then
    echo "### Backend Coverage" >> test-report.md
    echo "\`\`\`" >> test-report.md
    cd backend && npm run test:coverage:summary >> ../test-report.md 2>/dev/null || echo "Coverage data not available" >> ../test-report.md
    cd ..
    echo "\`\`\`" >> test-report.md
  fi
  
  if [[ -f frontend/e2e/test-results.json ]]; then
    echo "### E2E Test Results" >> test-report.md
    echo "See \`frontend/e2e/playwright-report/index.html\` for detailed results" >> test-report.md
  fi
  
  log "SUCCESS" "Test report generated: test-report.md"
}

# Set up signal handlers for cleanup
trap cleanup EXIT INT TERM

# Main execution
log "INFO" "Starting Learn2Play test execution..."
log "INFO" "Test type: ${TEST_TYPE:-all}"
log "INFO" "Parallel execution: $PARALLEL"
log "INFO" "Cleanup on exit: $CLEANUP_ON_EXIT"

case "${TEST_TYPE:-all}" in
  "unit")
    run_unit_tests
    exit_code=$?
    ;;
  "e2e")
    run_e2e_tests
    exit_code=$?
    ;;
  "smoke")
    run_smoke_tests
    exit_code=$?
    ;;
  "performance")
    run_performance_tests
    exit_code=$?
    ;;
  "accessibility")
    run_accessibility_tests
    exit_code=$?
    ;;
  "error-handling")
    run_error_handling_tests
    exit_code=$?
    ;;
  "integration")
    run_integration_tests
    exit_code=$?
    ;;
  "all")
    run_all_tests
    exit_code=$?
    ;;
  *)
    log "ERROR" "Unknown test type: $TEST_TYPE"
    show_help
    exit 1
    ;;
esac

# Generate report
generate_test_report

if [[ $exit_code -eq 0 ]]; then
  log "SUCCESS" "Test execution completed successfully! ✅"
else
  log "ERROR" "Test execution failed! ❌"
fi

exit $exit_code 