# Docker-based Test Environment

This document describes the Docker-based test environment implementation for the Learn2Play platform.

## Overview

The test environment provides isolated, reproducible testing infrastructure using Docker containers with proper health checks, service dependencies, and resource management.

## Components

### 1. Docker Configuration Files

- **`docker-compose.test.yml`**: Main Docker Compose configuration for test services
- **`backend/Dockerfile.test`**: Optimized Dockerfile for backend testing
- **`frontend/Dockerfile.test`**: Optimized Dockerfile for frontend testing
- **`.dockerignore.test`**: Optimized build context exclusions
- **`test-config.yml`**: Test environment configuration

### 2. Test Services

The test environment includes the following services:

- **postgres-test**: PostgreSQL 15 database with test data
- **chromadb-test**: ChromaDB vector database for AI features
- **backend-test**: Node.js backend API service
- **frontend-test**: React frontend application
- **mailhog-test**: Email testing service
- **redis-test**: Redis cache service

### 3. Management Scripts

- **`scripts/test-environment.sh`**: Main environment management script
- **`scripts/validate-test-environment.sh`**: Environment validation script
- **`Makefile.test`**: Convenient make targets for test operations

### 4. Test Environment Orchestrator

Located in `shared/test-config/`:

- **`TestEnvironment.ts`**: Main orchestrator class
- **`TestEnvironmentCLI.ts`**: Command-line interface
- **`ServiceDiscovery.ts`**: Port conflict resolution and service discovery
- **`ResourceCleanup.ts`**: Proper resource cleanup management

## Features

### Health Checks and Dependencies

- All services have proper health checks with retry logic
- Services start in dependency order (database → cache → backend → frontend)
- Automatic retry with exponential backoff for failed health checks
- Configurable timeouts and retry attempts

### Port Conflict Resolution

- Automatic detection of port conflicts
- Dynamic port assignment when conflicts are detected
- Service discovery to find available ports
- Maintains service URL mapping for easy access

### Resource Management

- Isolated test data using tmpfs volumes for performance
- Proper cleanup of containers, volumes, networks, and images
- Emergency cleanup for stuck resources
- Gentle cleanup that preserves important data

### Volume Management

- **tmpfs volumes** for databases (fast, isolated, automatically cleaned)
- **named volumes** for node_modules (persistent across runs for speed)
- **bind mounts** for source code (live reloading during development)

## Usage

### Quick Start

```bash
# Validate environment
npm run test:env:validate

# Start test environment
npm run test:env:start

# Check status
npm run test:env:status

# Run health checks
npm run test:env:health

# View service URLs
npm run test:env:urls

# Stop environment
npm run test:env:stop

# Complete cleanup
npm run test:env:cleanup
```

### Using Make Commands

```bash
# Complete setup for new developers
make -f Makefile.test test-setup

# Start environment and run all tests
make -f Makefile.test test-run

# Run specific test types
make -f Makefile.test test-unit
make -f Makefile.test test-integration
make -f Makefile.test test-e2e

# Environment management
make -f Makefile.test test-env-start
make -f Makefile.test test-env-status
make -f Makefile.test test-env-cleanup
```

### Using the Test Environment Script

```bash
# Start environment
./scripts/test-environment.sh start

# Show status
./scripts/test-environment.sh status

# Show logs
./scripts/test-environment.sh logs
./scripts/test-environment.sh logs backend-test

# Reset environment
./scripts/test-environment.sh reset

# Complete cleanup
./scripts/test-environment.sh cleanup
```

## Service URLs

When the test environment is running, services are available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Database**: postgresql://test_user:test_password@localhost:5433/learn2play_test
- **ChromaDB**: http://localhost:8001
- **MailHog UI**: http://localhost:8025
- **Redis**: redis://localhost:6380

## Configuration

### Environment Variables

The test environment uses the following environment variables:

- `TEST_CONFIG_PATH`: Path to test configuration file (default: ./test-config.yml)
- `NODE_ENV`: Set to 'test' for all services
- `LOG_LEVEL`: Set to 'warn' to reduce noise during testing

### Test Configuration File

The `test-config.yml` file contains:

- Service configuration (ports, health endpoints, timeouts)
- Volume configuration (types, sizes, permissions)
- Network configuration (subnet, driver)
- Test execution settings (parallel execution, timeouts)
- Coverage and reporting settings

## Performance Optimizations

### Build Optimizations

- Multi-stage Dockerfiles with dependency caching
- Optimized .dockerignore files to reduce build context
- Parallel image building
- Layer caching for faster rebuilds

### Runtime Optimizations

- tmpfs volumes for databases (in-memory, fast I/O)
- Named volumes for node_modules (persistent across runs)
- Proper resource limits and health check intervals
- Parallel service startup where possible

### Development Optimizations

- Live reloading with bind mounts for source code
- Persistent node_modules volumes for faster installs
- Development-specific environment variables
- Hot module replacement support

## Troubleshooting

### Common Issues

1. **Port Conflicts**: The system automatically resolves port conflicts by finding alternative ports
2. **Service Health Check Failures**: Check logs with `./scripts/test-environment.sh logs <service>`
3. **Docker Daemon Issues**: Ensure Docker is running and accessible
4. **Resource Constraints**: Ensure at least 2GB RAM and 2GB disk space available

### Debugging Commands

```bash
# Validate environment setup
./scripts/validate-test-environment.sh

# Check service health
./scripts/test-environment.sh health

# View detailed logs
./scripts/test-environment.sh logs

# Check Docker resources
docker system df
docker ps -a
docker volume ls
docker network ls
```

### Emergency Recovery

```bash
# Emergency cleanup (removes everything)
./scripts/test-environment.sh cleanup

# Or using the orchestrator
cd shared/test-config
npm run test:env:cleanup
```

## Integration with CI/CD

The test environment is designed to work in CI/CD pipelines:

```bash
# CI/CD workflow
make -f Makefile.test ci-test
```

This command:
1. Validates the environment
2. Builds test images
3. Starts services
4. Runs health checks
5. Executes all test suites
6. Generates coverage reports
7. Cleans up resources

## Requirements Satisfied

This implementation satisfies the following requirements:

- **2.1**: Isolated test databases and services ✅
- **2.2**: Prevents conflicts between test environments ✅
- **2.3**: Automatic cleanup of test data and resources ✅
- **5.1**: Docker containers for database and external services ✅
- **5.3**: Health checks with exponential backoff ✅
- **5.4**: Proper resource management and cleanup ✅

## Next Steps

The test environment is now ready for:
1. Integration with the unified test runner framework (Task 4)
2. Coverage reporting system integration (Task 5)
3. E2E testing infrastructure enhancement (Task 6)
4. Performance and accessibility testing integration (Task 7)