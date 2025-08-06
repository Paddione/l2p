# Learn2Play Rebuild Script - Profile Upgrade Summary

## Overview
The rebuild script has been upgraded to support multiple Docker Compose profiles: `test`, `dev`, and `production`. This allows you to manage different environments with specific configurations and services.

## New Features

### 1. Profile Support
- **Available Profiles**: `test`, `dev`, `production`
- **Profile Validation**: Invalid profiles are rejected with helpful error messages
- **Profile Indicators**: Color-coded indicators for each profile:
  - 🟡 `[TEST]` for test environment
  - 🔵 `[DEV]` for development environment  
  - 🟢 `[PROD]` for production environment

### 2. Profile-Specific Environment Files
- **Automatic Loading**: Profile-specific `.env.{profile}` files are loaded automatically
- **Fallback**: Main `.env` file is loaded as fallback
- **Creation Tool**: Built-in command to create profile environment files

### 3. Enhanced Menu System
- **Profile Display**: Current profile shown in menu header
- **Profile Selection**: Interactive profile switching (option 13)
- **Profile Info**: Detailed profile information (option 14)
- **Profile Services**: Shows services available in each profile (option 16)
- **Environment Creation**: Create profile-specific environment files (option 15)

### 4. Command Line Enhancements
- **Profile Parameter**: `-p` or `--profile` to specify profile
- **Profile Validation**: Invalid profiles show helpful error messages
- **Profile-Specific Commands**: All commands work with any profile

## Usage Examples

### Command Line Usage
```bash
# Show status for test profile
./rebuild.sh status -p test

# Rebuild frontend in development profile
./rebuild.sh rebuild-frontend -p dev

# Reset database in production profile
./rebuild.sh reset-db -p production

# Create environment file for test profile
./rebuild.sh create-profile-env -p test -y
```

### Interactive Mode
```bash
# Start interactive mode (defaults to production profile)
./rebuild.sh

# Use menu options:
# 13 - Change profile
# 14 - Show profile info  
# 15 - Create profile environment file
# 16 - Show profile services
```

## Profile Descriptions

### Test Profile
- **Purpose**: Minimal services for testing
- **Services**: frontend (minimal), backend (test mode), postgres (test DB), traefik (basic)
- **Use Case**: Unit tests, integration tests, CI/CD pipelines

### Development Profile  
- **Purpose**: Full development environment with debugging
- **Services**: frontend (hot reload), backend (debug mode), postgres (dev DB), traefik (dev routing), debugging tools
- **Use Case**: Local development, debugging, feature development

### Production Profile
- **Purpose**: Full production environment with all services
- **Services**: frontend (optimized), backend (production), postgres (production DB), traefik (SSL), monitoring, logging
- **Use Case**: Production deployment, staging environments

## Environment File Structure

### Profile-Specific Files
- `.env.test` - Test environment variables
- `.env.dev` - Development environment variables  
- `.env.production` - Production environment variables

### Loading Priority
1. Profile-specific environment file (`.env.{profile}`)
2. Main environment file (`.env`)

### Example Environment File
```bash
# Database Configuration
POSTGRES_DB=l2p_test
POSTGRES_USER=l2p_test_user
POSTGRES_PASSWORD=test_password_123
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Application Configuration
NODE_ENV=test
DOMAIN=l2p.korczewski.de

# Profile-specific settings
DEBUG=true
LOG_LEVEL=debug
```

## Backward Compatibility

- **Default Profile**: Still defaults to `production` if no profile specified
- **Existing Commands**: All existing commands work without changes
- **Environment Files**: Existing `.env` file continues to work as fallback

## New Commands

### `create-profile-env`
Creates a new environment file for the current profile with default values.

```bash
./rebuild.sh create-profile-env -p test -y
```

### Profile-Specific Status
All existing commands now show profile information:

```bash
./rebuild.sh status -p dev
# Shows: [INFO] Profile: [DEV] dev
```

## Error Handling

- **Invalid Profiles**: Clear error messages with valid options
- **Missing Files**: Helpful warnings about missing environment files
- **Profile Validation**: Prevents invalid profile usage

## Migration Guide

### For Existing Users
1. **No Changes Required**: Existing usage continues to work
2. **Optional Upgrade**: Use `-p production` to explicitly specify production profile
3. **Environment Files**: Create profile-specific files as needed

### For New Users
1. **Choose Profile**: Select appropriate profile for your use case
2. **Create Environment**: Use `create-profile-env` command
3. **Customize Settings**: Edit generated environment files

## Benefits

1. **Environment Isolation**: Separate configurations for different environments
2. **Easier Testing**: Dedicated test environment with minimal services
3. **Development Efficiency**: Hot reload and debugging tools in dev profile
4. **Production Safety**: Optimized production environment with monitoring
5. **Flexibility**: Easy switching between environments
6. **Automation**: Profile-specific commands for CI/CD pipelines

## Future Enhancements

- Profile-specific Docker Compose files
- Profile templates for quick setup
- Profile validation against Docker Compose configuration
- Profile-specific backup and restore strategies 