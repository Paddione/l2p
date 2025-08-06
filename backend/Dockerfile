# Multi-stage build for Node.js backend with optimized caching and security

# Base stage with security hardening
FROM node:18-alpine AS base
WORKDIR /app

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    wget \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Development stage
FROM base AS development
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install --legacy-peer-deps && \
    npm cache clean --force

# Copy source code
COPY --chown=nodejs:nodejs . .

# Create necessary directories with proper permissions
RUN mkdir -p logs coverage test-results && \
    chown -R nodejs:nodejs logs coverage test-results

# Switch to non-root user
USER nodejs

EXPOSE 3001

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["dumb-init", "npm", "run", "dev"]

# Dependencies stage - separate for better caching
FROM base AS dependencies
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install --legacy-peer-deps && \
    npm cache clean --force

# Production dependencies stage
FROM base AS prod-dependencies
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --production --legacy-peer-deps --force && \
    npm cache clean --force

# Build stage with optimized caching
FROM dependencies AS build
WORKDIR /app

# Copy source code (this layer will be cached if source doesn't change)
COPY --chown=nodejs:nodejs . .

# Build the application
RUN npm run build

# Production stage with minimal footprint
FROM base AS production
WORKDIR /app

# Copy production dependencies
COPY --from=prod-dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/package*.json ./

# Create necessary directories with proper permissions
RUN mkdir -p logs chroma && \
    chown -R nodejs:nodejs logs chroma

# Remove unnecessary packages and files for security
RUN rm -rf /tmp/* /var/tmp/* /root/.npm

# Switch to non-root user
USER nodejs

EXPOSE 3001

# Health check with proper timeout and retries
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3001/api/health || exit 1

# Use dumb-init for proper signal handling and graceful shutdown
CMD ["dumb-init", "node", "dist/server.js"]

# Add labels for monitoring and management
LABEL maintainer="Learn2Play Team" \
      version="1.0" \
      description="Learn2Play Backend API" \
      org.opencontainers.image.source="https://github.com/learn2play/backend"