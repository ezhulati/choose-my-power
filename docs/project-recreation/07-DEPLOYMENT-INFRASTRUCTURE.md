# Deployment & Infrastructure Documentation

**Document**: Complete DevOps and Infrastructure Guide  
**Version**: 1.0  
**Date**: 2025-09-09  

## Infrastructure Architecture Overview

The ChooseMyPower platform is designed for **enterprise-scale deployment** with dual adapter support, comprehensive monitoring, and performance optimization for serving 2,000+ pages with 881+ Texas cities.

### **Deployment Strategies**
1. **Production Deployment**: Netlify serverless with PostgreSQL + Redis
2. **Development Environment**: Node.js standalone with local database  
3. **Staging Environment**: Netlify preview deployments with production data
4. **CI/CD Pipeline**: GitHub Actions with automated testing and deployment

### **Infrastructure Components**
- **Primary Hosting**: Netlify serverless functions
- **Database**: PostgreSQL via Netlify's Neon integration
- **Caching**: Redis for performance optimization
- **CDN**: Netlify's global CDN with edge optimization
- **Monitoring**: Built-in performance and health monitoring
- **Analytics**: Custom analytics with user interaction tracking

## Production Infrastructure

### **Netlify Serverless Configuration**
```javascript
// astro.config.mjs - Production adapter configuration
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

const isProduction = process.env.NODE_ENV === 'production';
const isNetlify = process.env.NETLIFY === 'true' || process.env.DEPLOY_CONTEXT;

export default defineConfig({
  output: 'server', // SSR enabled for dynamic content
  
  // Conditional adapter based on environment
  adapter: isNetlify || (isProduction && !process.env.LOCAL_BUILD) 
    ? netlify({
        dist: new URL('./dist/', import.meta.url),
        edgeMiddleware: false, // Use serverless functions
        cacheOnDemandPages: true, // Cache rendered pages
      })
    : node({ mode: 'standalone' }),
    
  // Serverless optimization
  vite: {
    build: {
      target: 'es2020',
      rollupOptions: {
        external: ['sharp', 'vite', 'esbuild'], // Externalize heavy dependencies
        output: {
          manualChunks: strategicChunkStrategy, // Optimize for serverless cold starts
        }
      }
    }
  }
});
```

### **Netlify Deployment Configuration**
```toml
# netlify.toml - Production deployment settings
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "dist"

[build.environment]
  NODE_ENV = "production"
  NETLIFY = "true"
  # Build performance settings
  MAX_CITIES = "881"
  BATCH_SIZE = "15" 
  BATCH_DELAY_MS = "1500"
  USE_CACHED_DATA = "true"

# Serverless function configuration
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

# Advanced caching and optimization
[build.processing]
  skip_processing = false

[build.processing.css]
  bundle = true
  minify = true

[build.processing.js]
  bundle = true
  minify = true

[build.processing.html]
  pretty_urls = true

# Headers for performance and security
[[headers]]
  for = "/*"
  [headers.values]
    # Security headers
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    
    # Performance headers
    Cache-Control = "public, max-age=3600"
    
[[headers]]
  for = "/assets/*"
  [headers.values]
    # Long-term caching for assets
    Cache-Control = "public, max-age=31536000, immutable"
    
[[headers]]
  for = "/api/*"
  [headers.values]
    # API-specific headers
    Cache-Control = "public, max-age=300" # 5 minutes
    Access-Control-Allow-Origin = "https://choosemypower.org"

# Redirects for SEO and user experience
[[redirects]]
  from = "/old-plans/*"
  to = "/electricity-plans/:splat"
  status = 301

[[redirects]]
  from = "/compare"
  to = "/electricity-plans"  
  status = 301

# Environment-specific redirects
[[redirects]]
  from = "/api/zip-lookup" 
  to = "/api/zip/navigate"
  status = 301

# Form handling for contact forms
[[forms]]
  name = "contact"
  
# Plugin configuration for advanced features  
[[plugins]]
  package = "@netlify/plugin-sitemap"
  
  [plugins.inputs]
    buildDir = "dist"
    
[[plugins]]
  package = "netlify-plugin-lighthouse"
  
  [plugins.inputs]
    auditsToRun = ["performance", "accessibility", "best-practices", "seo"]
```

### **Database Infrastructure (Neon/PostgreSQL)**
```typescript
// src/lib/database/production-config.ts
export const productionDatabaseConfig = {
  // Connection configuration
  connectionString: process.env.NETLIFY_DATABASE_URL!,
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.DATABASE_CA_CERT,
  },
  
  // Connection pooling for serverless
  pooling: {
    max: 10,                    // Maximum connections
    min: 2,                     // Minimum connections  
    idle_timeout: 30_000,       // 30 seconds
    connect_timeout: 60_000,    // 1 minute
    acquire_timeout: 60_000,    // 1 minute to acquire
  },
  
  // Performance optimization
  prepared_statements: false,   // Disabled for serverless
  query_timeout: 30_000,        // 30 second query timeout
  
  // Monitoring and logging
  logging: process.env.NODE_ENV === 'production' ? false : true,
  slow_query_threshold: 1000,   // Log queries > 1 second
  
  // Backup and maintenance
  backup_schedule: 'daily',
  maintenance_window: '02:00-04:00 UTC',
  
  // Scaling configuration
  auto_scaling: {
    enabled: true,
    min_size: '0.25 vCPU',
    max_size: '2 vCPU',
    scale_up_threshold: 70,     // CPU percentage
    scale_down_threshold: 30,
  }
};

// Database health monitoring
export class DatabaseHealthMonitor {
  private healthCheckInterval: NodeJS.Timeout;
  
  startMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const startTime = performance.now();
        await db.execute(sql`SELECT 1`);
        const responseTime = performance.now() - startTime;
        
        // Log metrics
        console.log(`DB Health: ${responseTime.toFixed(2)}ms`);
        
        // Alert on slow responses
        if (responseTime > 1000) {
          await this.sendSlowQueryAlert(responseTime);
        }
        
      } catch (error) {
        console.error('Database health check failed:', error);
        await this.sendDatabaseErrorAlert(error);
      }
    }, 30_000); // Every 30 seconds
  }
  
  async getDatabaseMetrics() {
    const metrics = await db.execute(sql`
      SELECT 
        (SELECT count(*) FROM electricity_plans WHERE is_active = true) as active_plans,
        (SELECT count(*) FROM providers WHERE is_active = true) as active_providers,
        (SELECT count(*) FROM cities WHERE is_active = true) as active_cities,
        (SELECT pg_size_pretty(pg_database_size(current_database()))) as database_size,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections
    `);
    
    return metrics[0];
  }
}
```

### **Redis Caching Infrastructure**
```typescript
// src/lib/cache/production-cache.ts  
import Redis from 'ioredis';

export const productionCacheConfig = {
  // Redis connection
  redis: new Redis(process.env.REDIS_URL!, {
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    
    // Cluster configuration for high availability
    enableOfflineQueue: false,
    
    // Performance optimization
    compression: 'gzip',
    keyPrefix: 'choosemypower:',
    
    // Monitoring
    showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
  }),
  
  // Cache strategies by data type
  cachingStrategies: {
    plan_data: {
      ttl: 3600,              // 1 hour
      maxSize: '100MB',
      evictionPolicy: 'LRU',
    },
    city_data: {
      ttl: 86400,             // 24 hours  
      maxSize: '50MB',
      evictionPolicy: 'LRU',
    },
    provider_data: {
      ttl: 14400,             // 4 hours
      maxSize: '25MB', 
      evictionPolicy: 'LRU',
    },
    user_sessions: {
      ttl: 1800,              // 30 minutes
      maxSize: '200MB',
      evictionPolicy: 'LRU',
    }
  }
};

export class ProductionCacheManager {
  private redis: Redis;
  private metrics: CacheMetrics;
  
  constructor() {
    this.redis = productionCacheConfig.redis;
    this.metrics = new CacheMetrics();
    this.setupEventHandlers();
  }
  
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      const cached = await this.redis.get(key);
      const responseTime = performance.now() - startTime;
      
      if (cached) {
        this.metrics.recordHit(key, responseTime);
        return JSON.parse(cached);
      } else {
        this.metrics.recordMiss(key, responseTime);
        return null;
      }
      
    } catch (error) {
      this.metrics.recordError(key, error);
      console.error('Cache get error:', error);
      return null; // Graceful degradation
    }
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      
      this.metrics.recordSet(key);
      return true;
      
    } catch (error) {
      this.metrics.recordError(key, error);
      console.error('Cache set error:', error);
      return false;
    }
  }
  
  async getStats() {
    const info = await this.redis.info();
    const memoryUsage = await this.redis.memory('usage');
    
    return {
      connected: this.redis.status === 'ready',
      memoryUsage: this.parseMemoryInfo(info),
      hitRate: this.metrics.getHitRate(),
      averageResponseTime: this.metrics.getAverageResponseTime(),
      errorRate: this.metrics.getErrorRate(),
      totalRequests: this.metrics.getTotalRequests(),
    };
  }
}
```

## Development Environment

### **Local Development Setup**
```javascript
// Local development with Node.js adapter
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
    host: true,              // Allow external connections
    port: 4324,             // Development port
  }),
  
  server: {
    port: 4324,
    host: '0.0.0.0',        // Allow network access
    open: false,            // Don't auto-open browser
  },
  
  // Development-specific optimizations
  vite: {
    server: {
      hmr: {
        overlay: true,       // Show errors as overlay
      },
      fs: {
        allow: ['..']       // Allow parent directory access
      }
    },
    
    // Faster builds in development
    build: {
      sourcemap: true,
      minify: false,
      
      rollupOptions: {
        external: [],       // Don't externalize in development
      }
    }
  }
});
```

### **Development Database Setup**
```bash
#!/bin/bash
# scripts/setup-development-environment.sh

echo "🔧 Setting up ChooseMyPower development environment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment variables
echo "⚙️ Setting up environment variables..."
cp .env.example .env.local

# Database setup
echo "🗄️ Setting up development database..."
if command -v docker &> /dev/null; then
    # Use Docker for local PostgreSQL
    docker run --name choosemypower-postgres \
        -e POSTGRES_DB=choosemypower_dev \
        -e POSTGRES_USER=dev_user \
        -e POSTGRES_PASSWORD=dev_password \
        -p 5432:5432 \
        -d postgres:15
        
    # Wait for database to be ready
    sleep 10
    
    # Run migrations and seeds
    echo "🌱 Running database migrations and seeds..."
    npm run db:setup
    npm run db:seed
    
else
    echo "⚠️ Docker not found. Please install PostgreSQL manually or use Docker."
    echo "Database URL should be: postgresql://dev_user:dev_password@localhost:5432/choosemypower_dev"
fi

# Setup Redis (optional for development)
if command -v redis-server &> /dev/null; then
    echo "🔴 Starting Redis server..."
    redis-server --daemonize yes --port 6379
else
    echo "⚠️ Redis not found. Caching will be disabled in development."
fi

# Generate initial data (small subset for development)
echo "📊 Generating development data..."
MAX_CITIES=10 BATCH_SIZE=3 npm run build:data:smart

# Start development server
echo "🚀 Development environment ready!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your API keys"
echo "2. Run 'npm run dev' to start the development server" 
echo "3. Visit http://localhost:4324 to see the application"
echo ""
echo "Useful development commands:"
echo "- npm run dev          # Start development server"
echo "- npm run build:local  # Test local build"
echo "- npm run test         # Run test suite"
echo "- npm run db:reset     # Reset development database"
```

## CI/CD Pipeline

### **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20.5.0'
  
jobs:
  # Quality assurance
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Run security audit
        run: npm run security:audit
        
      - name: Validate no hardcoded IDs
        run: npm run validate:ids
        
      - name: Run unit tests
        run: npm run test:coverage
        
      # Upload coverage reports
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          
  # Build and test
  build-test:
    runs-on: ubuntu-latest
    needs: quality-check
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js  
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      # Setup test database
      - name: Setup test database
        run: |
          docker run --name test-postgres \
            -e POSTGRES_DB=choosemypower_test \
            -e POSTGRES_USER=test_user \
            -e POSTGRES_PASSWORD=test_password \
            -p 5432:5432 \
            -d postgres:15
          sleep 10
          
      - name: Run database tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/choosemypower_test
          
      # Test production build
      - name: Build application (tier1 for CI)
        run: |
          MAX_CITIES=25 BATCH_SIZE=5 BATCH_DELAY_MS=1000 \
          npm run build:data:smart
          npm run build
        env:
          NODE_ENV: production
          USE_CACHED_DATA: true
          
      # E2E testing
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:4324
          
      # Performance testing
      - name: Run performance tests
        run: npm run perf:test:critical
        
  # Deploy to production (main branch only)
  deploy-production:
    runs-on: ubuntu-latest
    needs: [quality-check, build-test]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      # Production data generation
      - name: Generate production data
        run: |
          MAX_CITIES=881 BATCH_SIZE=15 BATCH_DELAY_MS=1500 \
          npm run build:data:smart
        env:
          COMPAREPOWER_API_KEY: ${{ secrets.COMPAREPOWER_API_KEY }}
          USE_CACHED_DATA: true
          
      # Deploy to Netlify
      - name: Deploy to Netlify
        uses: netlify/actions/build@master
        with:
          publish-dir: './dist'
          production-branch: main
          production-deploy: true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          NODE_ENV: production
          NETLIFY_DATABASE_URL: ${{ secrets.NETLIFY_DATABASE_URL }}
          REDIS_URL: ${{ secrets.REDIS_URL }}
          COMPAREPOWER_API_KEY: ${{ secrets.COMPAREPOWER_API_KEY }}
          ERCOT_API_KEY: ${{ secrets.ERCOT_API_KEY }}
          
      # Post-deployment validation
      - name: Validate deployment
        run: |
          sleep 60  # Wait for deployment to propagate
          curl -f https://choosemypower.org/api/health/system || exit 1
          curl -f https://choosemypower.org/ || exit 1
          
      # Performance monitoring  
      - name: Run post-deploy performance check
        run: |
          npx lighthouse-ci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
          
  # Preview deployment for PRs
  deploy-preview:
    runs-on: ubuntu-latest
    needs: [quality-check, build-test] 
    if: github.event_name == 'pull_request'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      # Limited data generation for preview
      - name: Generate preview data  
        run: |
          MAX_CITIES=50 BATCH_SIZE=10 BATCH_DELAY_MS=1000 \
          npm run build:data:smart
        env:
          USE_CACHED_DATA: true
          
      - name: Deploy preview
        uses: netlify/actions/build@master
        with:
          publish-dir: './dist'
          production-branch: main
          production-deploy: false
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Monitoring & Performance

### **Production Monitoring Setup**
```typescript
// src/lib/monitoring/production-monitoring.ts
export class ProductionMonitoring {
  private metrics: Map<string, number[]> = new Map();
  private alerts: AlertManager;
  
  constructor() {
    this.alerts = new AlertManager();
    this.startPerformanceMonitoring();
    this.startHealthChecks();
  }
  
  // Core Web Vitals monitoring
  startPerformanceMonitoring() {
    setInterval(async () => {
      const metrics = await this.collectPerformanceMetrics();
      
      // Check Core Web Vitals thresholds
      if (metrics.lcp > 2500) {  // LCP > 2.5s
        await this.alerts.send({
          type: 'performance',
          severity: 'warning', 
          message: `LCP degraded: ${metrics.lcp}ms`,
          threshold: 2500,
          current: metrics.lcp
        });
      }
      
      if (metrics.fid > 100) {   // FID > 100ms
        await this.alerts.send({
          type: 'performance',
          severity: 'warning',
          message: `FID degraded: ${metrics.fid}ms`,
          threshold: 100,
          current: metrics.fid
        });
      }
      
      if (metrics.cls > 0.1) {   // CLS > 0.1
        await this.alerts.send({
          type: 'performance', 
          severity: 'warning',
          message: `CLS degraded: ${metrics.cls}`,
          threshold: 0.1,
          current: metrics.cls
        });
      }
      
      // Store metrics for trending
      this.recordMetric('lcp', metrics.lcp);
      this.recordMetric('fid', metrics.fid);
      this.recordMetric('cls', metrics.cls);
      
    }, 300_000); // Every 5 minutes
  }
  
  // System health monitoring
  startHealthChecks() {
    setInterval(async () => {
      const health = await this.performHealthCheck();
      
      if (!health.database.healthy) {
        await this.alerts.send({
          type: 'system',
          severity: 'critical',
          message: 'Database health check failed',
          details: health.database.error
        });
      }
      
      if (!health.cache.healthy) {
        await this.alerts.send({
          type: 'system',
          severity: 'warning', 
          message: 'Cache health check failed',
          details: health.cache.error
        });
      }
      
      if (health.api.averageResponseTime > 1000) {
        await this.alerts.send({
          type: 'performance',
          severity: 'warning',
          message: `API response time degraded: ${health.api.averageResponseTime}ms`
        });
      }
      
    }, 60_000); // Every minute
  }
  
  async performHealthCheck() {
    const [database, cache, api] = await Promise.allSettled([
      this.checkDatabaseHealth(),
      this.checkCacheHealth(), 
      this.checkAPIHealth(),
    ]);
    
    return {
      timestamp: new Date().toISOString(),
      overall: database.status === 'fulfilled' && 
               cache.status === 'fulfilled' && 
               api.status === 'fulfilled',
      database: {
        healthy: database.status === 'fulfilled',
        responseTime: database.value?.responseTime,
        error: database.reason?.message
      },
      cache: {
        healthy: cache.status === 'fulfilled',
        hitRate: cache.value?.hitRate,
        error: cache.reason?.message
      },
      api: {
        healthy: api.status === 'fulfilled',
        averageResponseTime: api.value?.averageResponseTime,
        error: api.reason?.message
      }
    };
  }
  
  // Performance metrics collection
  async collectPerformanceMetrics() {
    // Use Real User Monitoring (RUM) data
    const rumData = await this.getRUMData();
    
    return {
      lcp: rumData.largestContentfulPaint,
      fid: rumData.firstInputDelay,
      cls: rumData.cumulativeLayoutShift,
      pageLoadTime: rumData.pageLoadTime,
      apiResponseTime: rumData.averageApiResponseTime,
      errorRate: rumData.errorRate,
      bounceRate: rumData.bounceRate
    };
  }
}

// Alert management system
export class AlertManager {
  async send(alert: Alert) {
    // Multiple notification channels
    await Promise.all([
      this.sendSlackAlert(alert),
      this.sendEmailAlert(alert),
      this.logAlert(alert)
    ]);
  }
  
  private async sendSlackAlert(alert: Alert) {
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook) return;
    
    const message = {
      text: `🚨 ${alert.severity.toUpperCase()}: ${alert.message}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${alert.type}* alert triggered`
          }
        },
        {
          type: 'section', 
          fields: [
            { type: 'mrkdwn', text: `*Severity:* ${alert.severity}` },
            { type: 'mrkdwn', text: `*Time:* ${new Date().toISOString()}` },
            { type: 'mrkdwn', text: `*Message:* ${alert.message}` }
          ]
        }
      ]
    };
    
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  }
}
```

## Scaling & Performance

### **Auto-Scaling Configuration**
```yaml
# Infrastructure as Code (if using AWS/Azure)
# infrastructure/scaling-config.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: choosemypower-app
spec:
  replicas: 3  # Minimum replicas
  
  template:
    spec:
      containers:
      - name: app
        image: choosemypower:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi" 
            cpu: "500m"
            
        # Health checks
        livenessProbe:
          httpGet:
            path: /api/health/system
            port: 4324
          initialDelaySeconds: 30
          periodSeconds: 10
          
        readinessProbe:
          httpGet:
            path: /api/health/database
            port: 4324
          initialDelaySeconds: 15
          periodSeconds: 5

---
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: choosemypower-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: choosemypower-app
  
  minReplicas: 3
  maxReplicas: 20
  
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
        
  - type: Resource  
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

  behavior:
    scaleUp:
      stabilizationWindowSeconds: 300    # 5 minutes
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
        
    scaleDown:
      stabilizationWindowSeconds: 600    # 10 minutes
      policies:
      - type: Percent
        value: 25
        periodSeconds: 60
```

### **Performance Optimization Checklist**
```typescript
// Production performance validation
export const performanceChecklist = {
  // Core Web Vitals requirements
  coreWebVitals: {
    lcp: '<2.5s',                    // Largest Contentful Paint
    fid: '<100ms',                   // First Input Delay  
    cls: '<0.1',                     // Cumulative Layout Shift
    fcp: '<1.8s',                    // First Contentful Paint
    ttfb: '<600ms',                  // Time to First Byte
  },
  
  // API performance requirements
  apiPerformance: {
    planSearch: '<500ms',            // Plan search API
    zipValidation: '<200ms',         // ZIP code validation
    addressValidation: '<300ms',     // Address validation
    esiidGeneration: '<400ms',       // ESID generation
    healthCheck: '<100ms',           // Health check endpoints
  },
  
  // Database performance requirements  
  databasePerformance: {
    connectionTime: '<100ms',        // Database connection
    simpleQuery: '<50ms',           // Basic SELECT queries
    complexQuery: '<200ms',         // Joins and aggregations
    planListQuery: '<150ms',        // City plan listings
  },
  
  // Build performance requirements
  buildPerformance: {
    cachedBuild: '<30s',            // Using cached data
    freshBuild: '<8min',            // Fresh data generation
    incrementalBuild: '<2min',      // Incremental updates
    deploymentTime: '<5min',        // Full deployment cycle
  },
  
  // Reliability requirements
  reliability: {
    uptime: '99.9%',                // Annual uptime target
    errorRate: '<1%',               // Error rate threshold
    mttr: '<30min',                 // Mean Time to Recovery
    dataFreshness: '<1hr',          // Plan data staleness limit
  }
};

// Automated performance testing
export async function validateProductionPerformance() {
  const results = {
    coreWebVitals: await measureCoreWebVitals(),
    apiPerformance: await measureAPIPerformance(), 
    databasePerformance: await measureDatabasePerformance(),
    reliabilityMetrics: await measureReliabilityMetrics(),
  };
  
  // Generate performance report
  const report = generatePerformanceReport(results);
  
  // Fail deployment if critical metrics don't meet requirements
  if (!results.coreWebVitals.passing || !results.apiPerformance.passing) {
    throw new Error('Performance requirements not met. Deployment halted.');
  }
  
  return report;
}
```

This comprehensive deployment and infrastructure documentation provides everything needed to deploy and maintain the ChooseMyPower platform at enterprise scale with proper monitoring, performance optimization, and reliability guarantees.