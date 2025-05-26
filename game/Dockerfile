# game/Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:18-slim AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-slim AS production

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Copy node_modules from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy application code
COPY . .

# Create necessary directories and set permissions
RUN mkdir -p logs public/assets/sounds && \
    chown -R appuser:appuser /usr/src/app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Add health check (this will be overridden by docker-compose but good to have)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Use production command
CMD ["npm", "start"]