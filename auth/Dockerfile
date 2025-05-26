# auth/Dockerfile
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
RUN mkdir -p logs && \
    chown -R appuser:appuser /usr/src/app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Add health check (this will be overridden by docker-compose but good to have)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Use production command
CMD ["npm", "start"]