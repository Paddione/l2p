# Unified Test CLI Guide

The Unified Test CLI provides a comprehensive command-line interface for running different test types, managing test environments, and generating reports in the Learn2Play platform.

## Quick Start

### Installation

The CLI is already installed as part of the project. No additional installation is required.

### Basic Usage

```bash
# Show help
node test-cli.js --help

# Run unit tests
node test-cli.js test unit

# Start test environment
node test-cli.js env start

# Check environment status
node test-cli.js env status

# Run all tests
node test-cli.js test all
```

### Using the Wrapper Script

For convenience, use the wrapper script for common operations:

```bash
# Quick unit tests
./scripts/test-cli-wrapper.sh quick-test

# Start environment
./scripts/test-cli-wrapper.sh env-start

# Health check
./scripts/test-cli-wrapper.sh health-check

# Full test suite
./scripts/test-cli-wrapper.sh full-test
```

## Commands Overview

### Test Execution Commands

#### `test unit`
Run unit tests for both frontend and backend.

```bash
# Basic unit tests
node test-cli.js test unit

# With coverage
node test-cli.js test unit --coverage

# Parallel execution
node test-cli.js test unit --parallel

# Verbose output
node test-cli.js test unit --verbose

# Watch mode
node test-cli.js test unit --watch

# Stop on first failure
node test-cli.js test unit --bail
```

**Options:**
- `-e, --env <environment>`: Test environment (local, ci, docker)
- `-p, --parallel`: Run tests in parallel
- `-c, --coverage`: Collect coverage
- `-w, --watch`: Watch mode
- `-v, --verbose`: Verbose output
- `--bail`: Stop on first failure
- `--max-workers <number>`: Maximum number of workers

#### `test integration`
Run integration tests that require database and service connections.

```bash
# Basic integration tests
node test-cli.js test integration

# With specific environment
node test-cli.js test integration --env docker

# With coverage
node test-cli.js test integration --coverage --verbose
```

**Options:**
- `-e, --env <environment>`: Test environment
- `-c, --coverage`: Collect coverage
- `-v, --verbose`: Verbose output
- `--bail`: Stop on first failure

#### `test e2e`
Run end-to-end tests using Playwright.

```bash
# Basic E2E tests
node test-cli.js test e2e

# Specific browser
node test-cli.js test e2e --browser firefox

# Headed mode (show browser)
node test-cli.js test e2e --no-headless

# Debug mode
node test-cli.js test e2e --debug
```

**Options:**
- `-e, --env <environment>`: Test environment
- `-b, --browser <browser>`: Browser to use (chromium, firefox, webkit)
- `-h, --headless`: Run in headless mode (default: true)
- `-v, --verbose`: Verbose output
- `--debug`: Debug mode

#### `test performance`
Run performance and load tests.

```bash
# Basic performance tests
node test-cli.js test performance

# Specific scenarios
node test-cli.js test performance --scenarios load_test,stress_test

# Custom user count and duration
node test-cli.js test performance --users 20 --duration 120
```

**Options:**
- `-e, --env <environment>`: Test environment
- `-s, --scenarios <scenarios>`: Test scenarios to run
- `-u, --users <number>`: Number of concurrent users
- `-d, --duration <seconds>`: Test duration in seconds

#### `test accessibility`
Run accessibility tests for WCAG compliance.

```bash
# Basic accessibility tests
node test-cli.js test accessibility

# Specific standard
node test-cli.js test accessibility --standard WCAG21AAA

# Verbose output
node test-cli.js test accessibility --verbose
```

**Options:**
- `-e, --env <environment>`: Test environment
- `-s, --standard <standard>`: Accessibility standard (WCAG21AA, WCAG21AAA)
- `-v, --verbose`: Verbose output

#### `test all`
Run all test types in sequence.

```bash
# Run all tests
node test-cli.js test all

# With coverage
node test-cli.js test all --coverage

# Skip specific test types
node test-cli.js test all --skip performance,accessibility

# Stop on first failure
node test-cli.js test all --bail
```

**Options:**
- `-e, --env <environment>`: Test environment
- `-c, --coverage`: Collect coverage
- `-v, --verbose`: Verbose output
- `--bail`: Stop on first failure
- `--skip <types>`: Skip test types (comma-separated)

### Environment Management Commands

#### `env start`
Start the test environment using Docker Compose.

```bash
# Start local environment
node test-cli.js env start

# Force restart if already running
node test-cli.js env start --force

# Start specific environment
node test-cli.js env start --env docker
```

**Options:**
- `-e, --env <environment>`: Environment to start
- `-f, --force`: Force restart if already running

#### `env stop`
Stop the test environment.

```bash
# Stop environment
node test-cli.js env stop

# Stop specific environment
node test-cli.js env stop --env docker
```

#### `env reset`
Reset the test environment (clean restart).

```bash
# Reset environment
node test-cli.js env reset

# Reset specific environment
node test-cli.js env reset --env docker
```

#### `env status`
Check the status of the test environment.

```bash
# Check status
node test-cli.js env status

# Watch mode (updates every 5 seconds)
node test-cli.js env status --watch
```

**Options:**
- `-e, --env <environment>`: Environment to check
- `-w, --watch`: Watch mode

#### `env logs`
View environment logs.

```bash
# View all logs
node test-cli.js env logs

# View specific service logs
node test-cli.js env logs --service backend

# Follow logs
node test-cli.js env logs --follow

# Tail specific number of lines
node test-cli.js env logs --tail 50
```

**Options:**
- `-e, --env <environment>`: Environment
- `-s, --service <service>`: Specific service
- `-f, --follow`: Follow logs
- `-t, --tail <lines>`: Number of lines to tail

### Report Generation Commands

#### `report generate`
Generate test reports in various formats.

```bash
# Generate HTML report
node test-cli.js report generate --type test-results --format html

# Generate coverage report
node test-cli.js report generate --type coverage --format html --open

# Generate performance report
node test-cli.js report generate --type performance --format json
```

**Options:**
- `-t, --type <type>`: Report type (coverage, test-results, performance)
- `-f, --format <format>`: Output format (html, json, xml)
- `-o, --output <path>`: Output directory
- `--open`: Open report in browser

#### `report view`
View existing test reports.

```bash
# View test results report
node test-cli.js report view --type test-results

# View specific report
node test-cli.js report view --path ./test-reports/coverage
```

#### `report coverage`
Show coverage summary.

```bash
# Basic coverage summary
node test-cli.js report coverage

# Detailed coverage
node test-cli.js report coverage --detailed

# Show threshold status
node test-cli.js report coverage --threshold
```

### Debugging and Troubleshooting Commands

#### `debug health`
Perform comprehensive health check.

```bash
# Health check for local environment
node test-cli.js debug health

# Health check for specific environment
node test-cli.js debug health --env docker

# Verbose health check
node test-cli.js debug health --verbose
```

#### `debug validate`
Validate test configuration.

```bash
# Validate configuration
node test-cli.js debug validate

# Validate specific config file
node test-cli.js debug validate --config ./custom-test-config.yml

# Attempt to fix issues
node test-cli.js debug validate --fix
```

#### `debug info`
Show system information.

```bash
# Show system info
node test-cli.js debug info
```

#### `debug cleanup`
Clean up test artifacts and resources.

```bash
# Basic cleanup
node test-cli.js debug cleanup

# Clean all artifacts
node test-cli.js debug cleanup --all

# Force cleanup
node test-cli.js debug cleanup --force
```

#### `debug troubleshoot`
Interactive troubleshooting guide.

```bash
# Start troubleshooting
node test-cli.js debug troubleshoot
```

### Configuration Management Commands

#### `config show`
Show current configuration.

```bash
# Show full configuration
node test-cli.js config show

# Show environment configuration
node test-cli.js config show --env local

# Show test type configuration
node test-cli.js config show --type unit
```

#### `config environments`
List available environments.

```bash
# List environments
node test-cli.js config environments
```

#### `config test-types`
List available test types.

```bash
# List test types
node test-cli.js config test-types
```

#### `config jest`
Generate Jest configuration.

```bash
# Generate Jest config for backend unit tests
node test-cli.js config jest --env local --type unit --project backend

# Generate and save to file
node test-cli.js config jest --env ci --type integration --project frontend --output ./jest.config.js
```

## Configuration

### Test Configuration File

The CLI uses `test-config.yml` in the project root for configuration. This file defines:

- **Environments**: Different test environments (local, ci, docker)
- **Test Types**: Configuration for different test types
- **Global Settings**: Global test configuration

### Environment Variables

The CLI automatically sets up environment variables based on the selected environment:

- `NODE_ENV=test`
- `TEST_ENVIRONMENT=<selected_environment>`
- `DATABASE_URL=<database_connection_string>`
- `BACKEND_URL=<backend_service_url>`
- `FRONTEND_URL=<frontend_service_url>`
- And more...

### Coverage Configuration

Coverage thresholds and exclusions are configured per environment:

```yaml
coverage:
  threshold:
    statements: 80
    branches: 75
    functions: 80
    lines: 80
  exclude:
    - "**/*.test.ts"
    - "**/node_modules/**"
    # ... more exclusions
```

## Integration with Existing Scripts

The CLI integrates with existing npm scripts in `package.json`:

```json
{
  "scripts": {
    "test-cli": "node test-cli.js",
    "test:unit": "node test-cli.js test unit",
    "test:integration": "node test-cli.js test integration",
    "test:e2e": "node test-cli.js test e2e",
    "test:all": "node test-cli.js test all",
    "env:start": "node test-cli.js env start",
    "env:stop": "node test-cli.js env stop"
  }
}
```

## Troubleshooting

### Common Issues

#### Environment Won't Start
```bash
# Check Docker status
docker --version
docker-compose --version

# Check port availability
node test-cli.js debug health

# Reset environment
node test-cli.js env reset
```

#### Tests Failing
```bash
# Run with verbose output
node test-cli.js test unit --verbose

# Check environment status
node test-cli.js env status

# Validate configuration
node test-cli.js debug validate
```

#### Configuration Issues
```bash
# Validate configuration
node test-cli.js debug validate

# Show current configuration
node test-cli.js config show

# Use interactive troubleshooting
node test-cli.js debug troubleshoot
```

### Getting Help

- Use `--help` with any command for detailed options
- Run `node test-cli.js debug troubleshoot` for interactive help
- Check system information with `node test-cli.js debug info`
- View logs with `node test-cli.js env logs`

## Examples

### Daily Development Workflow

```bash
# Start your day
./scripts/test-cli-wrapper.sh env-start
./scripts/test-cli-wrapper.sh health-check

# Run tests during development
./scripts/test-cli-wrapper.sh quick-test

# Before committing
./scripts/test-cli-wrapper.sh full-test

# End of day
./scripts/test-cli-wrapper.sh env-stop
```

### CI/CD Integration

```bash
# In CI pipeline
node test-cli.js debug validate
node test-cli.js env start --env ci
node test-cli.js test all --env ci --coverage --bail
node test-cli.js report generate --type coverage --format lcov
```

### Performance Testing

```bash
# Start environment
node test-cli.js env start

# Run performance tests
node test-cli.js test performance --users 50 --duration 300

# Generate performance report
node test-cli.js report generate --type performance --format html --open
```

### Accessibility Testing

```bash
# Run accessibility tests
node test-cli.js test accessibility --standard WCAG21AA

# Generate accessibility report
node test-cli.js report generate --type accessibility --format html --open
```

This CLI provides a unified, consistent interface for all testing operations in the Learn2Play platform, making it easier to run tests, manage environments, and generate reports across different development scenarios.