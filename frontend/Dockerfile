# Multi-stage build for React frontend with optimized caching and security

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
RUN npm ci --include=dev && \
    npm cache clean --force

# Copy source code
COPY --chown=nodejs:nodejs . .

# Create necessary directories with proper permissions
RUN mkdir -p coverage test-results playwright-report && \
    chown -R nodejs:nodejs coverage test-results playwright-report

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

CMD ["dumb-init", "npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Dependencies stage - separate for better caching
FROM base AS dependencies
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci --include=dev && \
    npm cache clean --force

# Build stage with optimized caching
FROM dependencies AS build
WORKDIR /app

# Copy source code (this layer will be cached if source doesn't change)
COPY --chown=nodejs:nodejs . .

# Build the application with optimizations
ENV NODE_ENV=production
RUN npm run build

# Production stage with Nginx and security hardening
FROM nginx:alpine AS production

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user for nginx
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S nginx-app -u 1001 -G nginx-app

# Copy built application with proper ownership
COPY --from=build --chown=nginx-app:nginx-app /app/dist /usr/share/nginx/html

# Copy optimized nginx configuration
COPY --chown=nginx-app:nginx-app nginx.conf /etc/nginx/nginx.conf

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    chown -R nginx-app:nginx-app /etc/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-app:nginx-app /var/run/nginx.pid

# Remove unnecessary packages and files for security
RUN rm -rf /tmp/* /var/tmp/*

# Switch to non-root user
USER nginx-app

EXPOSE 80

# Health check with proper timeout and retries
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Use dumb-init for proper signal handling
CMD ["dumb-init", "nginx", "-g", "daemon off;"]

# Add labels for monitoring and management
LABEL maintainer="Learn2Play Team" \
      version="1.0" \
      description="Learn2Play Frontend Application" \
      org.opencontainers.image.source="https://github.com/learn2play/frontend"