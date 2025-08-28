# Production Dockerfile for ChooseMyPower.org
# Multi-stage build for optimal production performance
# Features:
# - Security hardening and minimal attack surface
# - Performance optimization for Core Web Vitals
# - Static asset generation and optimization
# - Health checks and monitoring integration

# Stage 1: Build environment
FROM node:20-alpine AS build

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Install dependencies for build process
RUN apk add --no-cache \
    libc6-compat \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY astro.config.mjs ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY vite.config.ts ./
COPY vitest.config.ts ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --only=production=false --frozen-lockfile

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY scripts/ ./scripts/
COPY config/ ./config/
COPY seo/ ./seo/

# Set production environment
ENV NODE_ENV=production
ENV ASTRO_TELEMETRY_DISABLED=1

# Build application with all optimizations
# This runs the smart build system for 881 cities
RUN npm run build:production

# Stage 2: Production runtime
FROM nginx:1.25-alpine AS production

# Security: Install security updates
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

# Create non-root user for nginx
RUN addgroup -g 1001 -S nginx-group
RUN adduser -S nginx-user -u 1001 -G nginx-group

# Copy built application from build stage
COPY --from=build --chown=nginx-user:nginx-group /app/dist /usr/share/nginx/html

# Copy optimized nginx configuration
COPY deployment/nginx.conf /etc/nginx/nginx.conf
COPY deployment/security-headers.conf /etc/nginx/conf.d/security-headers.conf
COPY deployment/cache-optimization.conf /etc/nginx/conf.d/cache-optimization.conf

# Copy SSL configuration (for local testing)
COPY deployment/ssl.conf /etc/nginx/conf.d/ssl.conf

# Health check script
COPY deployment/health-check.sh /usr/local/bin/health-check.sh
RUN chmod +x /usr/local/bin/health-check.sh

# Performance monitoring script
COPY deployment/performance-monitor.sh /usr/local/bin/performance-monitor.sh
RUN chmod +x /usr/local/bin/performance-monitor.sh

# Switch to non-root user
USER nginx-user

# Expose ports
EXPOSE 8080 8443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD /usr/local/bin/health-check.sh

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Stage 3: Development environment (optional)
FROM node:20-alpine AS development

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

RUN apk add --no-cache libc6-compat git

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

USER nextjs

EXPOSE 4324

CMD ["npm", "run", "dev"]