#!/bin/bash

# Learn2Play Test Runner Script
# Comprehensive testing suite for the Learn2Play platform
# Updated to use modern test infrastructure

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
CLEANUP_ON_EXIT=true
VERBOSE=false
PARALLEL=true
MAX_RETRIES=3
TEST_ENVIRONMENT=${TEST_ENVIRONMENT:-"local"}
TEST_CONFIG_FILE="test-config.yml"
USE_MODERN_INFRASTRUCTURE=true

# Import test infrastructure
TEST_CONFIG_DIR="shared/test-config/dist"
TEST_UTILITIES="$TEST_CONFIG_DIR/TestUtilities.js"
TEST_CONFIG_MANAGER="$TEST_CONFIG_DIR/TestConfigManager.js"
TEST_RUNNER="$TEST_CONFIG_DIR/TestRunner.js"
TEST_ENVIRONMENT_SCRIPT="$TEST_CONFIG_DIR/TestEnvironment.js"
TEST_REPORTER="$TEST_CONFIG_DIR/TestReporter.js"

function show_help() {
  cat << EOF
Learn2Play Test Runner (Modern Infrastructure)

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
  --env ENVIRONMENT   Set test environment (local, ci, docker) [default: local]
  --config FILE       Use custom test config file [default: test-config.yml]
  --timeout SECONDS   Set timeout for test environment startup
  --coverage          Generate coverage reports
  --report FORMAT     Generate test reports (html, json, junit) [default: html]
  --retry COUNT       Number of retry attempts for failed tests [default: 3]
  --basic             Use basic infrastructure (fallback mode)

ENVIRONMENT VARIABLES:
  TEST_ENVIRONMENT    Set default test environment
  TEST_TYPE           Set default test type
  NODE_ENV            Set Node.js environment
  LOG_LEVEL           Set logging level (debug, info, warn, error)

EXAMPLES:
  $0                          # Run all tests with default settings
  $0 smoke                    # Run smoke tests only
  $0 --verbose e2e            # Run E2E tests with verbose output
  $0 --no-cleanup unit        # Run unit tests without cleanup
  $0 --env docker performance # Run performance tests in Docker environment
  $0 --coverage --report html # Run tests with coverage and HTML report
  $0 --basic unit            # Run unit tests with basic infrastructure

INFRASTRUCTURE:
  This test runner uses the modern test infrastructure:
  - TestConfigManager: Centralized configuration management
  - TestEnvironment: Environment setup and health checks
  - TestRunner: Test execution and orchestration
  - TestReporter: Comprehensive reporting and coverage
  - ServiceDiscovery: Dynamic service detection
  - ResourceCleanup: Automatic resource management
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
    --env)
      TEST_ENVIRONMENT="$2"
      shift 2
      ;;
    --config)
      TEST_CONFIG_FILE="$2"
      shift 2
      ;;
    --timeout)
      TEST_ENV_TIMEOUT="$2"
      shift 2
      ;;
    --coverage)
      GENERATE_COVERAGE=true
      shift
      ;;
    --report)
      REPORT_FORMAT="$2"
      shift 2
      ;;
    --retry)
      MAX_RETRIES="$2"
      shift 2
      ;;
    --basic)
      USE_MODERN_INFRASTRUCTURE=false
      shift
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
    "DEBUG")
      if [[ $VERBOSE == true ]]; then
        echo -e "${PURPLE}[DEBUG]${NC} ${timestamp} - $message"
      fi
      ;;
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
    "CONFIG")
      echo -e "${CYAN}[CONFIG]${NC} ${timestamp} - $message"
      ;;
  esac
  
  if [[ $VERBOSE == true ]]; then
    echo "[VERBOSE] $message" >> test-runner.log
  fi
}

function check_prerequisites() {
  log "INFO" "Checking prerequisites..."
  
  # Check if Node.js is available
  if ! command -v node >/dev/null 2>&1; then
    log "ERROR" "Node.js is required but not installed"
    return 1
  fi
  
  # Check if test infrastructure needs to be built
  if [[ ! -f "$TEST_CONFIG_MANAGER" ]] || [[ ! -f "$TEST_UTILITIES" ]]; then
    log "INFO" "Test infrastructure not built. Building now..."
    build_test_infrastructure || return 1
  fi
  
  if [[ ! -f "$TEST_CONFIG_FILE" ]]; then
    log "ERROR" "Test configuration file not found: $TEST_CONFIG_FILE"
    return 1
  fi
  
  # Check if Docker is available (for Docker environment)
  if [[ "$TEST_ENVIRONMENT" == "docker" ]] && ! command -v docker >/dev/null 2>&1; then
    log "ERROR" "Docker is required for docker environment but not installed"
    return 1
  fi
  
  log "SUCCESS" "All prerequisites satisfied"
  return 0
}

function build_test_infrastructure() {
  log "INFO" "Building test infrastructure..."
  
  if [[ ! -d "shared/test-config" ]]; then
    log "ERROR" "Test infrastructure directory not found: shared/test-config"
    return 1
  fi
  
  cd shared/test-config
  
  # Check if npm is available
  if ! command -v npm >/dev/null 2>&1; then
    log "ERROR" "npm is required to build test infrastructure"
    cd ../..
    return 1
  fi
  
  # Install dependencies if needed
  if [[ ! -d "node_modules" ]]; then
    log "INFO" "Installing test infrastructure dependencies..."
    npm install || {
      log "ERROR" "Failed to install test infrastructure dependencies"
      cd ../..
      return 1
    }
  fi
  
  # Build the infrastructure
  log "INFO" "Building test infrastructure..."
  npm run build || {
    log "ERROR" "Failed to build test infrastructure"
    cd ../..
    return 1
  }
  
  cd ../..
  log "SUCCESS" "Test infrastructure built successfully"
  return 0
}

function load_test_config() {
  log "CONFIG" "Loading test configuration..."
  
  if [[ "$USE_MODERN_INFRASTRUCTURE" != "true" ]]; then
    log "INFO" "Using basic configuration mode"
    return 0
  fi
  
  # Use Node.js to load and validate configuration
  local config_output
  config_output=$(node -e "
    try {
      const { TestConfigManager } = require('./$TEST_CONFIG_MANAGER');
      const configManager = TestConfigManager.getInstance();
      configManager.loadConfig('$TEST_CONFIG_FILE');
      const validation = configManager.validateConfig();
      
      if (!validation.isValid) {
        console.error('Configuration validation failed:');
        validation.errors.forEach(error => console.error(\`  - \${error.field}: \${error.message}\`));
        process.exit(1);
      }
      
      const config = configManager.getConfig();
      console.log(JSON.stringify({
        environment: '$TEST_ENVIRONMENT',
        testType: '$TEST_TYPE',
        config: config
      }));
    } catch (error) {
      console.error('Failed to load configuration:', error.message);
      process.exit(1);
    }
  " 2>/dev/null)
  
  if [[ $? -ne 0 ]]; then
    log "WARNING" "Failed to load test configuration with modern infrastructure, falling back to basic mode"
    USE_MODERN_INFRASTRUCTURE=false
    return 0
  fi
  
  # Parse configuration
  TEST_CONFIG=$(echo "$config_output" | node -e "
    const config = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    console.log(JSON.stringify(config));
  ")
  
  log "SUCCESS" "Test configuration loaded successfully"
  return 0
}

function setup_test_environment() {
  log "INFO" "Setting up test environment: $TEST_ENVIRONMENT"
  
  if [[ "$USE_MODERN_INFRASTRUCTURE" != "true" ]]; then
    setup_test_environment_basic
    return $?
  fi
  
  # Use the modern test environment setup
  local env_output
  env_output=$(node -e "
    try {
      const { TestUtilities } = require('./$TEST_UTILITIES');
      const { TestConfigManager } = require('./$TEST_CONFIG_MANAGER');
      
      const configManager = TestConfigManager.getInstance();
      configManager.loadConfig('$TEST_CONFIG_FILE');
      
      async function setup() {
        const context = await TestUtilities.initializeTestEnvironment('$TEST_ENVIRONMENT', '$TEST_TYPE');
        const status = await TestUtilities.configManager.performHealthCheck('$TEST_ENVIRONMENT');
        
        console.log(JSON.stringify({
          context: context,
          status: status,
          success: status.status === 'ready'
        }));
      }
      
      setup().catch(error => {
        console.error('Setup failed:', error.message);
        process.exit(1);
      });
    } catch (error) {
      console.error('Failed to setup environment:', error.message);
      process.exit(1);
    }
  " 2>/dev/null)
  
  if [[ $? -ne 0 ]]; then
    log "WARNING" "Failed to setup test environment with modern infrastructure, falling back to basic mode"
    setup_test_environment_basic
    return $?
  fi
  
  # Parse environment status
  local env_status
  env_status=$(echo "$env_output" | node -e "
    const result = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    console.log(JSON.stringify(result.status));
  ")
  
  # Check if all services are healthy
  local healthy_services
  healthy_services=$(echo "$env_status" | node -e "
    const status = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    const healthy = status.services.filter(s => s.status === 'healthy').length;
    const total = status.services.length;
    console.log(\`\${healthy}/\${total}\`);
  ")
  
  log "SUCCESS" "Test environment setup complete ($healthy_services services healthy)"
  return 0
}

function setup_test_environment_basic() {
  log "INFO" "Setting up basic test environment with production variables..."
  
  # Load production environment variables as defaults
  local prod_env_file=".env.production"
  if [[ -f "$prod_env_file" ]]; then
    log "INFO" "Loading production environment variables as defaults..."
    # Source production environment variables
    set -a  # automatically export all variables
    source "$prod_env_file"
    set +a  # stop automatically exporting
  else
    log "WARN" "Production environment file not found: $prod_env_file"
  fi
  
  # Create test environment file with production variables as defaults
  cat > .env.test << EOF
# Test Environment Configuration
# Uses production environment variables as defaults with test-specific overrides

# Database Configuration (test-specific)
POSTGRES_DB=\${POSTGRES_DB:-l2p_test}
POSTGRES_USER=\${POSTGRES_USER:-l2p_test_user}
POSTGRES_PASSWORD=\${POSTGRES_PASSWORD:-l2p_test_password}
POSTGRES_HOST=\${POSTGRES_HOST:-localhost}
POSTGRES_PORT=\${POSTGRES_PORT:-5433}
DATABASE_URL=postgresql://\${POSTGRES_USER:-l2p_test_user}:\${POSTGRES_PASSWORD:-l2p_test_password}@\${POSTGRES_HOST:-localhost}:\${POSTGRES_PORT:-5433}/\${POSTGRES_DB:-l2p_test}

# Application Configuration (test-specific overrides)
NODE_ENV=test
DOMAIN=\${DOMAIN:-l2p.test}
BACKEND_PORT=\${BACKEND_PORT:-3001}
FRONTEND_URL=http://localhost:3000

# JWT Configuration (test-specific secrets)
JWT_SECRET=\${JWT_SECRET:-test-jwt-secret-for-testing-only-do-not-use-in-production}
JWT_REFRESH_SECRET=\${JWT_REFRESH_SECRET:-test-jwt-refresh-secret-for-testing-only-do-not-use-in-production}

# Frontend Configuration (test-specific)
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
VITE_TEST_MODE=true

# Database SSL (disabled for local testing)
DB_SSL=false

# Logging (test-specific)
LOG_LEVEL=warn

# Email Configuration (test-specific)
SMTP_HOST=\${SMTP_HOST:-localhost}
SMTP_PORT=\${SMTP_PORT:-1025}
SMTP_SECURE=false
SMTP_USER=\${SMTP_USER:-test}
SMTP_PASS=\${SMTP_PASS:-test}
EMAIL_SENDER_ADDRESS=\${EMAIL_SENDER_ADDRESS:-test@learn2play.test}
EMAIL_SENDER_NAME=\${EMAIL_SENDER_NAME:-Learn2Play Test}

# API Keys (use production keys if available, otherwise test keys)
GEMINI_API_KEY=\${GEMINI_API_KEY:-test-api-key}
GOOGLE_CLOUD_PROJECT_ID=\${GOOGLE_CLOUD_PROJECT_ID:-}
GOOGLE_SERVICE_ACCOUNT_EMAIL=\${GOOGLE_SERVICE_ACCOUNT_EMAIL:-}

# Inherit other production variables
# Add any additional production variables you want to inherit here
EOF

  # Start test services if using Docker environment
  if [[ "$TEST_ENVIRONMENT" == "docker" ]]; then
    log "INFO" "Starting Docker test services..."
    docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true
    docker-compose -f docker-compose.test.yml up -d
    
    # Wait for services to be ready
    log "INFO" "Waiting for services to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
      if curl -f -s "http://localhost:3001/api/health" >/dev/null 2>&1 && \
         curl -f -s "http://localhost:3000" >/dev/null 2>&1; then
        log "SUCCESS" "All services are ready"
        return 0
      fi
      
      log "INFO" "Attempt $attempt/$max_attempts: Services not ready yet..."
      sleep 2
      ((attempt++))
    done
    
    log "ERROR" "Services failed to start within timeout"
    return 1
  fi
  
  log "SUCCESS" "Test environment setup complete with production variables"
  return 0
}

function run_tests_with_infrastructure() {
  local test_type=$1
  log "INFO" "Running $test_type tests using modern infrastructure..."
  
  if [[ "$USE_MODERN_INFRASTRUCTURE" != "true" ]]; then
    run_tests_basic "$test_type"
    return $?
  fi
  
  # Use the TestRunner for test execution
  local test_output
  test_output=$(node -e "
    try {
      const { TestRunner } = require('./$TEST_RUNNER');
      const { TestConfigManager } = require('./$TEST_CONFIG_MANAGER');
      const { TestReporter } = require('./$TEST_REPORTER');
      
      const configManager = TestConfigManager.getInstance();
      configManager.loadConfig('$TEST_CONFIG_FILE');
      
      async function runTests() {
        const runner = new TestRunner(configManager);
        const reporter = new TestReporter();
        
        const options = {
          environment: '$TEST_ENVIRONMENT',
          testType: '$test_type',
          parallel: $PARALLEL,
          verbose: $VERBOSE,
          maxRetries: $MAX_RETRIES,
          generateCoverage: ${GENERATE_COVERAGE:-false},
          reportFormat: '${REPORT_FORMAT:-html}'
        };
        
        const results = await runner.runTests(options);
        const report = await reporter.generateReport(results, options);
        
        console.log(JSON.stringify({
          results: results,
          report: report,
          success: results.summary.passed === results.summary.total
        }));
      }
      
      runTests().catch(error => {
        console.error('Test execution failed:', error.message);
        process.exit(1);
      });
    } catch (error) {
      console.error('Failed to run tests:', error.message);
      process.exit(1);
    }
  " 2>/dev/null)
  
  if [[ $? -ne 0 ]]; then
    log "WARNING" "Failed to run tests with modern infrastructure, falling back to basic mode"
    run_tests_basic "$test_type"
    return $?
  fi
  
  # Parse test results
  local test_results
  test_results=$(echo "$test_output" | node -e "
    const result = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    console.log(JSON.stringify(result.results));
  ")
  
  # Extract summary
  local summary
  summary=$(echo "$test_results" | node -e "
    const results = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    console.log(JSON.stringify(results.summary));
  ")
  
  # Check if tests passed
  local passed
  passed=$(echo "$summary" | node -e "
    const summary = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    console.log(summary.passed === summary.total ? 'true' : 'false');
  ")
  
  if [[ "$passed" == "true" ]]; then
    log "SUCCESS" "$test_type tests passed (${summary})"
    return 0
  else
    log "ERROR" "$test_type tests failed (${summary})"
    return 1
  fi
}

function run_tests_basic() {
  local test_type=$1
  log "INFO" "Running $test_type tests using basic infrastructure..."
  
  local frontend_exit=0
  local backend_exit=0
  
  case "$test_type" in
    "unit")
      # Run unit tests
      if [[ -d "frontend/src/__tests__/unit" ]] || [[ -d "backend/src/__tests__/unit" ]]; then
        if [[ $PARALLEL == true ]]; then
          (
            if [[ -d "frontend/src/__tests__/unit" ]]; then
              log "INFO" "Running frontend unit tests..."
              cd frontend && npm run test:unit
            fi
          ) &
          local frontend_pid=$!
          
          (
            if [[ -d "backend/src/__tests__/unit" ]]; then
              log "INFO" "Running backend unit tests..."
              cd backend && npm run test:unit
            fi
          ) &
          local backend_pid=$!
          
          # Wait for both to complete
          wait $frontend_pid 2>/dev/null || frontend_exit=$?
          wait $backend_pid 2>/dev/null || backend_exit=$?
        else
          if [[ -d "frontend/src/__tests__/unit" ]]; then
            log "INFO" "Running frontend unit tests..."
            cd frontend && npm run test:unit || frontend_exit=$?
            cd ..
          fi
          
          if [[ -d "backend/src/__tests__/unit" ]]; then
            log "INFO" "Running backend unit tests..."
            cd backend && npm run test:unit || backend_exit=$?
            cd ..
          fi
        fi
      else
        log "WARNING" "Unit test directories not found. Skipping unit tests."
        return 0
      fi
      ;;
      
    "integration")
      # Run integration tests
      if [[ -d "frontend/src/__tests__/integration" ]] || [[ -d "backend/src/__tests__/integration" ]]; then
        if [[ -d "backend/src/__tests__/integration" ]]; then
          log "INFO" "Running backend integration tests..."
          cd backend && npm run test:integration || backend_exit=$?
          cd ..
        fi
        
        if [[ -d "frontend/src/__tests__/integration" ]]; then
          log "INFO" "Running frontend integration tests..."
          cd frontend && npm run test:integration || frontend_exit=$?
          cd ..
        fi
      else
        log "WARNING" "Integration test directories not found. Skipping integration tests."
        return 0
      fi
      ;;
      
    "e2e")
      # Run E2E tests
      if [[ -d "frontend/e2e/tests" ]]; then
        log "INFO" "Running E2E tests..."
        cd frontend/e2e
        
        # Install browsers if needed
        if [[ ! -d ~/.cache/ms-playwright ]]; then
          log "INFO" "Installing Playwright browsers..."
          npx playwright install --with-deps
        fi
        
        npm test || frontend_exit=$?
        cd ../..
      else
        log "WARNING" "E2E test directory not found. Skipping E2E tests."
        return 0
      fi
      ;;
      
    "smoke")
      # Run smoke tests
      if [[ -d "frontend/e2e/tests/smoke" ]]; then
        log "INFO" "Running smoke tests..."
        cd frontend/e2e
        npm run test:smoke || frontend_exit=$?
        cd ../..
      else
        log "WARNING" "Smoke test directory not found. Skipping smoke tests."
        return 0
      fi
      ;;
      
    "performance")
      # Run performance tests
      if [[ -d "frontend/e2e/tests/performance" ]]; then
        log "INFO" "Running performance tests..."
        cd frontend/e2e
        npm run test:performance || frontend_exit=$?
        cd ../..
      else
        log "WARNING" "Performance test directory not found. Skipping performance tests."
        return 0
      fi
      ;;
      
    "accessibility")
      # Run accessibility tests
      if [[ -d "frontend/e2e/tests/accessibility" ]]; then
        log "INFO" "Running accessibility tests..."
        cd frontend/e2e
        npm run test:accessibility || frontend_exit=$?
        cd ../..
      else
        log "WARNING" "Accessibility test directory not found. Skipping accessibility tests."
        return 0
      fi
      ;;
      
    "error-handling")
      # Run error handling tests
      if [[ -d "frontend/e2e/tests/error-handling" ]]; then
        log "INFO" "Running error handling tests..."
        cd frontend/e2e
        npm run test:error-handling || frontend_exit=$?
        cd ../..
      else
        log "WARNING" "Error handling test directory not found. Skipping error handling tests."
        return 0
      fi
      ;;
      
    *)
      log "ERROR" "Unknown test type: $test_type"
      return 1
      ;;
  esac
  
  if [[ $frontend_exit -eq 0 && $backend_exit -eq 0 ]]; then
    log "SUCCESS" "$test_type tests passed"
    return 0
  else
    log "ERROR" "$test_type tests failed (Frontend: $frontend_exit, Backend: $backend_exit)"
    return 1
  fi
}

function run_unit_tests() {
  log "INFO" "Running unit tests..."
  run_tests_with_infrastructure "unit"
}

function run_integration_tests() {
  log "INFO" "Running integration tests..."
  run_tests_with_infrastructure "integration"
}

function run_e2e_tests() {
  log "INFO" "Running E2E tests..."
  run_tests_with_infrastructure "e2e"
}

function run_smoke_tests() {
  log "INFO" "Running smoke tests..."
  run_tests_with_infrastructure "smoke"
}

function run_performance_tests() {
  log "INFO" "Running performance tests..."
  run_tests_with_infrastructure "performance"
}

function run_accessibility_tests() {
  log "INFO" "Running accessibility tests..."
  run_tests_with_infrastructure "accessibility"
}

function run_error_handling_tests() {
  log "INFO" "Running error handling tests..."
  run_tests_with_infrastructure "error-handling"
}

function run_all_tests() {
  log "INFO" "Running complete test suite..."
  
  local exit_code=0
  
  # Run tests in order of complexity and speed
  run_unit_tests || exit_code=1
  
  run_integration_tests || exit_code=1
  
  run_smoke_tests || exit_code=1
  
  run_error_handling_tests || exit_code=1
  
  run_performance_tests || exit_code=1
  
  run_accessibility_tests || exit_code=1
  
  # E2E tests last as they're most comprehensive
  run_e2e_tests || exit_code=1
  
  if [[ $exit_code -eq 0 ]]; then
    log "SUCCESS" "All tests passed! 🎉"
  else
    log "ERROR" "Some tests failed. Check the output above for details."
  fi
  
  return $exit_code
}

function cleanup() {
  if [[ $CLEANUP_ON_EXIT == true ]]; then
    log "INFO" "Cleaning up test environment..."
    
    if [[ "$USE_MODERN_INFRASTRUCTURE" == "true" ]]; then
      # Use the modern cleanup infrastructure
      node -e "
        try {
          const { ResourceCleanup } = require('./shared/test-config/dist/ResourceCleanup.js');
          const { TestConfigManager } = require('./$TEST_CONFIG_MANAGER');
          
          const configManager = TestConfigManager.getInstance();
          configManager.loadConfig('$TEST_CONFIG_FILE');
          
          async function cleanup() {
            const cleanup = new ResourceCleanup(configManager);
            await cleanup.cleanupAll('$TEST_ENVIRONMENT');
            console.log('Cleanup completed');
          }
          
          cleanup().catch(error => {
            console.error('Cleanup failed:', error.message);
            process.exit(1);
          });
        } catch (error) {
          console.error('Failed to cleanup:', error.message);
          process.exit(1);
        }
      " 2>/dev/null || log "WARNING" "Modern cleanup failed, using fallback"
    fi
    
    # Fallback cleanup
    cleanup_basic
  fi
}

function cleanup_basic() {
  log "INFO" "Performing basic cleanup..."
  
  # Stop test environment
  if [[ "$TEST_ENVIRONMENT" == "docker" ]]; then
    docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true
  fi
  
  # Stop production environment if it was started
  docker-compose down 2>/dev/null || true
  
  # Clean up test artifacts
  rm -rf frontend/e2e/test-results 2>/dev/null || true
  rm -rf frontend/e2e/playwright-report 2>/dev/null || true
  rm -rf frontend/coverage 2>/dev/null || true
  rm -rf backend/coverage 2>/dev/null || true
  rm -rf test-artifacts/* 2>/dev/null || true
  rm -rf test-reports/* 2>/dev/null || true
  rm -f .env.test 2>/dev/null || true
  
  log "SUCCESS" "Basic cleanup completed"
}

function generate_test_report() {
  log "INFO" "Generating comprehensive test report..."
  
  if [[ "$USE_MODERN_INFRASTRUCTURE" == "true" ]]; then
    # Use the TestReporter for comprehensive reporting
    node -e "
      try {
        const { TestReporter } = require('./$TEST_REPORTER');
        const { TestConfigManager } = require('./$TEST_CONFIG_MANAGER');
        
        const configManager = TestConfigManager.getInstance();
        configManager.loadConfig('$TEST_CONFIG_FILE');
        
        async function generateReport() {
          const reporter = new TestReporter();
          const options = {
            environment: '$TEST_ENVIRONMENT',
            testType: '${TEST_TYPE:-all}',
            reportFormat: '${REPORT_FORMAT:-html}',
            outputDir: 'test-reports'
          };
          
          await reporter.generateComprehensiveReport(options);
          console.log('Report generated successfully');
        }
        
        generateReport().catch(error => {
          console.error('Report generation failed:', error.message);
          process.exit(1);
        });
      } catch (error) {
        console.error('Failed to generate report:', error.message);
        process.exit(1);
      }
    " 2>/dev/null
    
    if [[ $? -eq 0 ]]; then
      log "SUCCESS" "Test report generated in test-reports/ directory"
      return 0
    else
      log "WARNING" "Failed to generate comprehensive report, using fallback"
    fi
  fi
  
  # Fallback report generation
  generate_test_report_basic
}

function generate_test_report_basic() {
  log "INFO" "Generating basic test report..."
  
  # Create test-reports directory if it doesn't exist
  mkdir -p test-reports
  
  cat > test-reports/test-report.md << EOF
# Test Execution Report

**Timestamp:** $(date)
**Test Type:** ${TEST_TYPE:-all}
**Environment:** $TEST_ENVIRONMENT
**Infrastructure:** ${USE_MODERN_INFRASTRUCTURE:-false}

## Results Summary

Test execution completed with ${exit_code:-0} exit code.

EOF

  if [[ -f frontend/coverage/lcov.info ]]; then
    echo "### Frontend Coverage" >> test-reports/test-report.md
    echo "\`\`\`" >> test-reports/test-report.md
    cd frontend && npm run test:coverage:summary >> ../test-reports/test-report.md 2>/dev/null || echo "Coverage data not available" >> ../test-reports/test-report.md
    cd ..
    echo "\`\`\`" >> test-reports/test-report.md
  fi
  
  if [[ -f backend/coverage/lcov.info ]]; then
    echo "### Backend Coverage" >> test-reports/test-report.md
    echo "\`\`\`" >> test-reports/test-report.md
    cd backend && npm run test:coverage:summary >> ../test-reports/test-report.md 2>/dev/null || echo "Coverage data not available" >> ../test-reports/test-report.md
    cd ..
    echo "\`\`\`" >> test-reports/test-report.md
  fi
  
  if [[ -f frontend/e2e/test-results.json ]]; then
    echo "### E2E Test Results" >> test-reports/test-report.md
    echo "See \`frontend/e2e/playwright-report/index.html\` for detailed results" >> test-reports/test-report.md
  fi
  
  log "SUCCESS" "Basic test report generated: test-reports/test-report.md"
}

# Set up signal handlers for cleanup
trap cleanup EXIT INT TERM

# Main execution
log "INFO" "Starting Learn2Play test execution..."
log "INFO" "Test type: ${TEST_TYPE:-all}"
log "INFO" "Environment: $TEST_ENVIRONMENT"
log "INFO" "Infrastructure: ${USE_MODERN_INFRASTRUCTURE:-false}"
log "INFO" "Parallel execution: $PARALLEL"
log "INFO" "Cleanup on exit: $CLEANUP_ON_EXIT"

# Check prerequisites
check_prerequisites || exit 1

# Load test configuration
load_test_config || exit 1

# Setup test environment
setup_test_environment || exit 1

# Run tests based on type
case "${TEST_TYPE:-all}" in
  "unit")
    run_unit_tests
    exit_code=$?
    ;;
  "integration")
    run_integration_tests
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

# Generate comprehensive report
generate_test_report

if [[ $exit_code -eq 0 ]]; then
  log "SUCCESS" "Test execution completed successfully! ✅"
  log "INFO" "Check test-reports/ directory for detailed results and coverage"
else
  log "ERROR" "Test execution failed! ❌"
  log "INFO" "Check test-reports/ directory for failure details"
fi

exit $exit_code 