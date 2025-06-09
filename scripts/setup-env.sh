#!/bin/bash

# Comprehensive environment setup script for Quiz Meister
# Usage: ./scripts/setup-env.sh --email=admin@yourdomain.com --production-domain=game.yourdomain.com --traefik-domain=traefik.yourdomain.com --local-ip=10.0.0.44 --traefik-user=admin --traefik-pass=SecurePassword123 --env-type=production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Default values
DEFAULT_LOCAL_IP=""
DEFAULT_TRAEFIK_USER="admin"
DEFAULT_ENV_TYPE="production"

# Function to show usage
show_usage() {
    echo ""
    echo -e "${CYAN}===============================================${NC}"
    echo -e "${BOLD}${CYAN}    Quiz Meister Environment Setup${NC}"
    echo -e "${CYAN}===============================================${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Required options:"
    echo "  --email=EMAIL                Email for Let's Encrypt SSL certificates"
    echo "  --production-domain=DOMAIN   Production domain for the quiz application"
    echo "  --traefik-domain=DOMAIN      Traefik dashboard domain"
    echo "  --traefik-pass=PASSWORD      Traefik dashboard password"
    echo ""
    echo "Optional options:"
    echo "  --local-ip=IP                Local IP address for development (auto-detected if not provided)"
    echo "  --traefik-user=USER          Traefik dashboard username (default: admin)"
    echo "  --env-type=TYPE              Environment type: production or development (default: production)"
    echo "  --help, -h                   Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 --email=admin@yourdomain.com \\"
    echo "     --production-domain=game.yourdomain.com \\"
    echo "     --traefik-domain=traefik.yourdomain.com \\"
    echo "     --local-ip=10.0.0.44 \\"
    echo "     --traefik-user=admin \\"
    echo "     --traefik-pass=SecurePassword123 \\"
    echo "     --env-type=production"
    echo ""
    exit 1
}

# Function to detect local IP
detect_local_ip() {
    # Try to get the main interface IP
    local ip=""
    
    # Method 1: ip route (Linux)
    if command -v ip &> /dev/null; then
        ip=$(ip route get 8.8.8.8 2>/dev/null | awk '{print $7}' | head -n1)
    fi
    
    # Method 2: hostname -I (Linux)
    if [ -z "$ip" ] && command -v hostname &> /dev/null; then
        ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
    
    # Method 3: ifconfig (macOS/Linux)
    if [ -z "$ip" ] && command -v ifconfig &> /dev/null; then
        ip=$(ifconfig 2>/dev/null | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | head -n1)
    fi
    
    # Fallback
    echo "${ip:-10.0.0.44}"
}

# Parse command line arguments
LETSENCRYPT_EMAIL=""
PRODUCTION_DOMAIN=""
TRAEFIK_DOMAIN=""
LOCAL_IP=""
TRAEFIK_USER="$DEFAULT_TRAEFIK_USER"
TRAEFIK_PASS=""
ENV_TYPE="$DEFAULT_ENV_TYPE"

for arg in "$@"; do
    case $arg in
        --email=*)
            LETSENCRYPT_EMAIL="${arg#*=}"
            shift
            ;;
        --production-domain=*)
            PRODUCTION_DOMAIN="${arg#*=}"
            shift
            ;;
        --traefik-domain=*)
            TRAEFIK_DOMAIN="${arg#*=}"
            shift
            ;;
        --local-ip=*)
            LOCAL_IP="${arg#*=}"
            shift
            ;;
        --traefik-user=*)
            TRAEFIK_USER="${arg#*=}"
            shift
            ;;
        --traefik-pass=*)
            TRAEFIK_PASS="${arg#*=}"
            shift
            ;;
        --env-type=*)
            ENV_TYPE="${arg#*=}"
            shift
            ;;
        --help|-h)
            show_usage
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $arg${NC}"
            show_usage
            ;;
    esac
done

# Validate required parameters
MISSING_PARAMS=()

if [ -z "$LETSENCRYPT_EMAIL" ]; then
    MISSING_PARAMS+=("--email")
fi

if [ -z "$PRODUCTION_DOMAIN" ]; then
    MISSING_PARAMS+=("--production-domain")
fi

if [ -z "$TRAEFIK_DOMAIN" ]; then
    MISSING_PARAMS+=("--traefik-domain")
fi

if [ -z "$TRAEFIK_PASS" ]; then
    MISSING_PARAMS+=("--traefik-pass")
fi

if [ ${#MISSING_PARAMS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required parameters: ${MISSING_PARAMS[*]}${NC}"
    show_usage
fi

# Auto-detect local IP if not provided
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(detect_local_ip)
    echo -e "${YELLOW}Local IP auto-detected: $LOCAL_IP${NC}"
fi

# Banner
echo ""
echo -e "${CYAN}===============================================${NC}"
echo -e "${BOLD}${CYAN}    Quiz Meister Environment Setup${NC}"
echo -e "${CYAN}===============================================${NC}"
echo ""
echo "Configuration:"
echo "  Email: $LETSENCRYPT_EMAIL"
echo "  Production Domain: $PRODUCTION_DOMAIN"
echo "  Traefik Domain: $TRAEFIK_DOMAIN"
echo "  Local IP: $LOCAL_IP"
echo "  Traefik User: $TRAEFIK_USER"
echo "  Environment: $ENV_TYPE"
echo ""

# Check if required tools are available
check_tool() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}❌ Error: $1 command not found.${NC}"
        echo "Please install the required package:"
        case "$1" in
            "htpasswd")
                echo "  Ubuntu/Debian: sudo apt-get install apache2-utils"
                echo "  CentOS/RHEL: sudo yum install httpd-tools"
                echo "  macOS: brew install httpd"
                ;;
            "openssl")
                echo "  Ubuntu/Debian: sudo apt-get install openssl"
                echo "  CentOS/RHEL: sudo yum install openssl"
                echo "  macOS: brew install openssl"
                ;;
        esac
        exit 1
    fi
}

echo -e "${YELLOW}Checking required tools...${NC}"
check_tool "htpasswd"
check_tool "openssl"
echo -e "${GREEN}✅ All required tools are available${NC}"
echo ""

# Backup existing .env file
if [ -f .env ]; then
    echo -e "${YELLOW}⚠️  Existing .env file found. Creating backup...${NC}"
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ Backup created${NC}"
    echo ""
fi

echo -e "${YELLOW}🔐 Generating secure secrets...${NC}"

# Generate all secrets
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "\n")
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "\n")
SESSION_SECRET=$(openssl rand -base64 32 | tr -d "\n")
TRAEFIK_HASH=$(htpasswd -nb "$TRAEFIK_USER" "$TRAEFIK_PASS" | sed -e s/\\$/\\$\\$/g)

echo -e "${GREEN}✅ All secrets generated successfully${NC}"
echo ""

# Create .env file
echo -e "${YELLOW}📝 Creating .env file...${NC}"

cat > .env << EOF
# Quiz Meister Environment Variables Configuration
# Generated automatically by setup-env.sh on $(date)

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
DB_NAME=quiz_meister
DB_USER=quiz_user
DB_PASSWORD=$DB_PASSWORD

# =============================================================================
# JWT AUTHENTICATION
# =============================================================================
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# =============================================================================
# CORS CONFIGURATION
# =============================================================================
CORS_ORIGINS=https://$PRODUCTION_DOMAIN,http://$LOCAL_IP

# =============================================================================
# TRAEFIK CONFIGURATION
# =============================================================================
TRAEFIK_DASHBOARD_USER=$TRAEFIK_USER
TRAEFIK_DASHBOARD_PASSWORD_HASH=$TRAEFIK_HASH

# Let's Encrypt email for SSL certificates
LETSENCRYPT_EMAIL=$LETSENCRYPT_EMAIL

# Domain configuration
PRODUCTION_DOMAIN=$PRODUCTION_DOMAIN
TRAEFIK_DOMAIN=$TRAEFIK_DOMAIN
LOCAL_IP=$LOCAL_IP

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
NODE_ENV=$ENV_TYPE
BACKEND_PORT=3000
FRONTEND_PORT=8080

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=$SESSION_SECRET

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================
LOG_LEVEL=INFO
TRAEFIK_LOG_LEVEL=INFO
DEBUG_MODE=false

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=60000

# =============================================================================
# BACKUP CONFIGURATION
# =============================================================================
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=30

# =============================================================================
# MONITORING CONFIGURATION
# =============================================================================
HEALTH_CHECK_INTERVAL=30s
HEALTH_CHECK_TIMEOUT=10s
HEALTH_CHECK_RETRIES=3
EOF

echo -e "${GREEN}✅ .env file created successfully${NC}"
echo ""

# Now validate the environment
echo -e "${BOLD}${CYAN}Environment Validation${NC}"
echo "Validating the generated configuration..."
echo ""

# Source the .env file safely without bash interpretation of $$
set -a
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ $key =~ ^[[:space:]]*# ]] && continue
    [[ -z $key ]] && continue
    
    # Remove quotes from value if present
    value="${value%\"}"
    value="${value#\"}"
    
    # Export the variable
    export "$key"="$value"
done < .env
set +a

# Required variables
REQUIRED_VARS=(
    "DB_NAME"
    "DB_USER" 
    "DB_PASSWORD"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "CORS_ORIGINS"
    "TRAEFIK_DASHBOARD_USER"
    "TRAEFIK_DASHBOARD_PASSWORD_HASH"
    "LETSENCRYPT_EMAIL"
    "PRODUCTION_DOMAIN"
    "TRAEFIK_DOMAIN"
    "LOCAL_IP"
)

# Optional variables with defaults
OPTIONAL_VARS=(
    "NODE_ENV:production"
    "BACKEND_PORT:3000"
    "FRONTEND_PORT:8080"
    "LOG_LEVEL:INFO"
    "TRAEFIK_LOG_LEVEL:INFO"
    "HEALTH_CHECK_INTERVAL:30s"
    "HEALTH_CHECK_TIMEOUT:10s"
    "HEALTH_CHECK_RETRIES:3"
    "RATE_LIMIT_WINDOW_MS:900000"
    "RATE_LIMIT_MAX_REQUESTS:100"
)

ERRORS=0
WARNINGS=0

# Check required variables
echo -e "${YELLOW}Checking required variables:${NC}"
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "  ${RED}✗ $var is not set${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "  ${GREEN}✓ $var is set${NC}"
    fi
done

echo ""

# Check optional variables
echo -e "${YELLOW}Checking optional variables (with defaults):${NC}"
for var_def in "${OPTIONAL_VARS[@]}"; do
    var=$(echo $var_def | cut -d: -f1)
    default=$(echo $var_def | cut -d: -f2)
    
    if [ -z "${!var}" ]; then
        echo -e "  ${YELLOW}⚠ $var not set, will use default: $default${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "  ${GREEN}✓ $var is set: ${!var}${NC}"
    fi
done

echo ""

# Specific validations
echo -e "${YELLOW}Running specific validations:${NC}"

# JWT Secret length check
if [ -n "$JWT_SECRET" ] && [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "  ${RED}✗ JWT_SECRET should be at least 32 characters long${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "  ${GREEN}✓ JWT_SECRET length is adequate (${#JWT_SECRET} characters)${NC}"
fi

# JWT Refresh Secret length check
if [ -n "$JWT_REFRESH_SECRET" ] && [ ${#JWT_REFRESH_SECRET} -lt 32 ]; then
    echo -e "  ${RED}✗ JWT_REFRESH_SECRET should be at least 32 characters long${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "  ${GREEN}✓ JWT_REFRESH_SECRET length is adequate (${#JWT_REFRESH_SECRET} characters)${NC}"
fi

# Email format check
if [ -n "$LETSENCRYPT_EMAIL" ] && [[ ! "$LETSENCRYPT_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
    echo -e "  ${RED}✗ LETSENCRYPT_EMAIL format appears invalid${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "  ${GREEN}✓ LETSENCRYPT_EMAIL format looks valid${NC}"
fi

# Domain format check
if [ -n "$PRODUCTION_DOMAIN" ] && [[ ! "$PRODUCTION_DOMAIN" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$ ]]; then
    echo -e "  ${YELLOW}⚠ PRODUCTION_DOMAIN format might be invalid${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "  ${GREEN}✓ PRODUCTION_DOMAIN format looks valid${NC}"
fi

# Password hash format check
if [ -n "$TRAEFIK_DASHBOARD_PASSWORD_HASH" ] && [[ ! "$TRAEFIK_DASHBOARD_PASSWORD_HASH" =~ ^([a-zA-Z0-9_-]+:)?\$\$.*\$ ]]; then
    echo -e "  ${RED}✗ TRAEFIK_DASHBOARD_PASSWORD_HASH format appears invalid${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "  ${GREEN}✓ TRAEFIK_DASHBOARD_PASSWORD_HASH format looks valid${NC}"
fi

echo ""

# Summary
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 Environment setup completed successfully!${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}Next Steps:${NC}"
    echo "1. Review the generated .env file if needed"
    echo "2. Start the application with: docker compose up -d"
    echo "3. Access your application at: https://$PRODUCTION_DOMAIN (production) or http://$LOCAL_IP (development)"
    echo "4. Access Traefik dashboard at: https://$TRAEFIK_DOMAIN"
    echo ""
    echo -e "${CYAN}Traefik Dashboard Credentials:${NC}"
    echo "  Username: $TRAEFIK_USER"
    echo "  Password: $TRAEFIK_PASS"
    echo ""
    echo -e "${YELLOW}💡 Keep these credentials secure!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️ Environment setup completed with $WARNINGS warnings.${NC}"
    echo "The application should work, but consider reviewing the warnings above."
    echo ""
    echo -e "${BOLD}${CYAN}Next Steps:${NC}"
    echo "1. Review the generated .env file if needed"
    echo "2. Start the application with: docker compose up -d"
    echo "3. Access your application at: https://$PRODUCTION_DOMAIN (production) or http://$LOCAL_IP (development)"
    exit 0
else
    echo -e "${RED}❌ Environment setup failed with $ERRORS errors and $WARNINGS warnings.${NC}"
    echo "Please check the configuration and try again."
    exit 1
fi 