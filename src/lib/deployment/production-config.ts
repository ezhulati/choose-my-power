/**
 * Production Deployment Configuration System
 * Task T035: Create production deployment configuration
 * Phase 3.5 Polish & Validation: Production readiness configuration
 */

export interface ProductionConfig {
  environment: 'staging' | 'production' | 'preview';
  deployment: {
    platform: 'netlify' | 'vercel' | 'cloudflare';
    region: string;
    domain: string;
    buildCommand: string;
    outputDirectory: string;
    nodeVersion: string;
    npmVersion: string;
  };
  performance: {
    enableCaching: boolean;
    enableCompression: boolean;
    enableImageOptimization: boolean;
    cacheStrategy: 'aggressive' | 'balanced' | 'conservative';
    bundleAnalysis: boolean;
  };
  monitoring: {
    enableHealthChecks: boolean;
    enablePerformanceMonitoring: boolean;
    enableErrorReporting: boolean;
    enableAnalytics: boolean;
    alertingChannels: string[];
  };
  security: {
    enableCSP: boolean;
    enableHSTS: boolean;
    enableRateLimiting: boolean;
    trustedDomains: string[];
    apiCorsOrigins: string[];
  };
  features: {
    enableFacetedNavigation: boolean;
    enableSEOOptimization: boolean;
    enableAccessibilityFeatures: boolean;
    enablePrefetching: boolean;
    enableServiceWorker: boolean;
  };
  database: {
    provider: 'neon' | 'planetscale' | 'postgresql' | 'mock';
    connectionPooling: boolean;
    ssl: boolean;
    readReplicas: number;
    backupSchedule: string;
  };
  cache: {
    provider: 'redis' | 'memory' | 'cloudflare' | 'none';
    ttl: {
      default: number;
      static: number;
      api: number;
      pages: number;
    };
    warming: {
      enabled: boolean;
      schedule: string;
      routes: string[];
    };
  };
  build: {
    maxCities: number;
    batchSize: number;
    batchDelay: number;
    useCachedData: boolean;
    forceRebuild: boolean;
    tier: 'tier1' | 'tier2' | 'all';
    parallelBuilds: number;
  };
}

export class ProductionConfigService {
  private defaultConfig: ProductionConfig = {
    environment: 'production',
    deployment: {
      platform: 'netlify',
      region: 'us-east-1',
      domain: 'choosemypower.org',
      buildCommand: 'npm run build:production',
      outputDirectory: 'dist',
      nodeVersion: '20.5.0',
      npmVersion: '10.2.4'
    },
    performance: {
      enableCaching: true,
      enableCompression: true,
      enableImageOptimization: true,
      cacheStrategy: 'aggressive',
      bundleAnalysis: true
    },
    monitoring: {
      enableHealthChecks: true,
      enablePerformanceMonitoring: true,
      enableErrorReporting: true,
      enableAnalytics: true,
      alertingChannels: ['slack', 'email']
    },
    security: {
      enableCSP: true,
      enableHSTS: true,
      enableRateLimiting: true,
      trustedDomains: ['choosemypower.org', 'api.comparepower.com'],
      apiCorsOrigins: ['https://choosemypower.org']
    },
    features: {
      enableFacetedNavigation: true,
      enableSEOOptimization: true,
      enableAccessibilityFeatures: true,
      enablePrefetching: true,
      enableServiceWorker: false // Disabled for Astro SSR
    },
    database: {
      provider: 'neon',
      connectionPooling: true,
      ssl: true,
      readReplicas: 1,
      backupSchedule: '0 2 * * *' // Daily at 2 AM
    },
    cache: {
      provider: 'redis',
      ttl: {
        default: 3600, // 1 hour
        static: 31536000, // 1 year
        api: 600, // 10 minutes
        pages: 14400 // 4 hours
      },
      warming: {
        enabled: true,
        schedule: '0 1 * * *', // Daily at 1 AM
        routes: [
          '/',
          '/texas/houston',
          '/texas/dallas',
          '/electricity-plans/houston-tx',
          '/electricity-plans/dallas-tx'
        ]
      }
    },
    build: {
      maxCities: 881,
      batchSize: 10,
      batchDelay: 2000,
      useCachedData: true,
      forceRebuild: false,
      tier: 'all',
      parallelBuilds: 3
    }
  };

  /**
   * Get production configuration based on environment
   */
  getConfig(environment?: string): ProductionConfig {
    const env = environment || process.env.NODE_ENV || 'production';
    const config = { ...this.defaultConfig };

    switch (env) {
      case 'staging':
        return this.getStagingConfig(config);
      case 'preview':
        return this.getPreviewConfig(config);
      case 'production':
      default:
        return this.getProductionConfig(config);
    }
  }

  /**
   * Get production-specific configuration
   */
  private getProductionConfig(baseConfig: ProductionConfig): ProductionConfig {
    return {
      ...baseConfig,
      environment: 'production',
      deployment: {
        ...baseConfig.deployment,
        domain: 'choosemypower.org'
      },
      performance: {
        ...baseConfig.performance,
        cacheStrategy: 'aggressive',
        bundleAnalysis: true
      },
      monitoring: {
        ...baseConfig.monitoring,
        enableHealthChecks: true,
        enablePerformanceMonitoring: true,
        enableErrorReporting: true,
        enableAnalytics: true
      },
      build: {
        ...baseConfig.build,
        maxCities: 881,
        tier: 'all',
        useCachedData: true
      }
    };
  }

  /**
   * Get staging-specific configuration
   */
  private getStagingConfig(baseConfig: ProductionConfig): ProductionConfig {
    return {
      ...baseConfig,
      environment: 'staging',
      deployment: {
        ...baseConfig.deployment,
        domain: 'staging.choosemypower.org'
      },
      performance: {
        ...baseConfig.performance,
        cacheStrategy: 'balanced',
        bundleAnalysis: false
      },
      monitoring: {
        ...baseConfig.monitoring,
        enableAnalytics: false,
        alertingChannels: ['slack']
      },
      build: {
        ...baseConfig.build,
        maxCities: 200,
        tier: 'tier1',
        useCachedData: true
      }
    };
  }

  /**
   * Get preview-specific configuration
   */
  private getPreviewConfig(baseConfig: ProductionConfig): ProductionConfig {
    return {
      ...baseConfig,
      environment: 'preview',
      deployment: {
        ...baseConfig.deployment,
        domain: 'preview.choosemypower.org'
      },
      performance: {
        ...baseConfig.performance,
        cacheStrategy: 'conservative',
        bundleAnalysis: false
      },
      monitoring: {
        ...baseConfig.monitoring,
        enableAnalytics: false,
        enablePerformanceMonitoring: false,
        alertingChannels: []
      },
      build: {
        ...baseConfig.build,
        maxCities: 50,
        tier: 'tier1',
        useCachedData: true,
        forceRebuild: false
      }
    };
  }

  /**
   * Generate environment variables for deployment
   */
  generateEnvironmentVariables(config: ProductionConfig): Record<string, string> {
    return {
      // Node.js Configuration
      NODE_ENV: config.environment,
      ASTRO_TELEMETRY_DISABLED: '1',
      
      // Build Configuration
      MAX_CITIES: config.build.maxCities.toString(),
      BATCH_SIZE: config.build.batchSize.toString(),
      BATCH_DELAY_MS: config.build.batchDelay.toString(),
      USE_CACHED_DATA: config.build.useCachedData.toString(),
      FORCE_REBUILD: config.build.forceRebuild.toString(),
      BUILD_TIER: config.build.tier,
      PARALLEL_BUILDS: config.build.parallelBuilds.toString(),

      // Performance Configuration
      ENABLE_CACHING: config.performance.enableCaching.toString(),
      ENABLE_COMPRESSION: config.performance.enableCompression.toString(),
      ENABLE_IMAGE_OPTIMIZATION: config.performance.enableImageOptimization.toString(),
      CACHE_STRATEGY: config.performance.cacheStrategy,
      BUNDLE_ANALYSIS: config.performance.bundleAnalysis.toString(),

      // Monitoring Configuration
      ENABLE_HEALTH_CHECKS: config.monitoring.enableHealthChecks.toString(),
      ENABLE_PERFORMANCE_MONITORING: config.monitoring.enablePerformanceMonitoring.toString(),
      ENABLE_ERROR_REPORTING: config.monitoring.enableErrorReporting.toString(),
      ENABLE_ANALYTICS: config.monitoring.enableAnalytics.toString(),
      ALERTING_CHANNELS: config.monitoring.alertingChannels.join(','),

      // Security Configuration
      ENABLE_CSP: config.security.enableCSP.toString(),
      ENABLE_HSTS: config.security.enableHSTS.toString(),
      ENABLE_RATE_LIMITING: config.security.enableRateLimiting.toString(),
      TRUSTED_DOMAINS: config.security.trustedDomains.join(','),
      API_CORS_ORIGINS: config.security.apiCorsOrigins.join(','),

      // Feature Flags
      ENABLE_FACETED_NAVIGATION: config.features.enableFacetedNavigation.toString(),
      ENABLE_SEO_OPTIMIZATION: config.features.enableSEOOptimization.toString(),
      ENABLE_ACCESSIBILITY_FEATURES: config.features.enableAccessibilityFeatures.toString(),
      ENABLE_PREFETCHING: config.features.enablePrefetching.toString(),
      ENABLE_SERVICE_WORKER: config.features.enableServiceWorker.toString(),

      // Database Configuration
      DATABASE_PROVIDER: config.database.provider,
      DATABASE_CONNECTION_POOLING: config.database.connectionPooling.toString(),
      DATABASE_SSL: config.database.ssl.toString(),
      DATABASE_READ_REPLICAS: config.database.readReplicas.toString(),
      DATABASE_BACKUP_SCHEDULE: config.database.backupSchedule,

      // Cache Configuration
      CACHE_PROVIDER: config.cache.provider,
      CACHE_TTL_DEFAULT: config.cache.ttl.default.toString(),
      CACHE_TTL_STATIC: config.cache.ttl.static.toString(),
      CACHE_TTL_API: config.cache.ttl.api.toString(),
      CACHE_TTL_PAGES: config.cache.ttl.pages.toString(),
      CACHE_WARMING_ENABLED: config.cache.warming.enabled.toString(),
      CACHE_WARMING_SCHEDULE: config.cache.warming.schedule,
      CACHE_WARMING_ROUTES: config.cache.warming.routes.join(','),

      // Deployment Configuration
      DEPLOYMENT_PLATFORM: config.deployment.platform,
      DEPLOYMENT_REGION: config.deployment.region,
      DEPLOYMENT_DOMAIN: config.deployment.domain,
      NODE_VERSION: config.deployment.nodeVersion,
      NPM_VERSION: config.deployment.npmVersion
    };
  }

  /**
   * Generate Netlify configuration
   */
  generateNetlifyConfig(config: ProductionConfig): string {
    const envVars = this.generateEnvironmentVariables(config);
    
    return `# Production Netlify Configuration
# Generated by ProductionConfigService for ${config.environment}

[build]
  publish = "${config.deployment.outputDirectory}"
  command = "${config.deployment.buildCommand}"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "${config.deployment.nodeVersion}"
  NPM_VERSION = "${config.deployment.npmVersion}"
${Object.entries(envVars).map(([key, value]) => `  ${key} = "${value}"`).join('\n')}

# Performance Optimization
[build.processing]
  skip_processing = false

[build.processing.css]
  bundle = ${config.performance.enableCompression}
  minify = ${config.performance.enableCompression}

[build.processing.js]
  bundle = ${config.performance.enableCompression}
  minify = ${config.performance.enableCompression}

[build.processing.html]
  pretty_urls = true

[build.processing.images]
  compress = ${config.performance.enableImageOptimization}

# Security Headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    ${config.security.enableHSTS ? 'Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"' : ''}
    ${config.security.enableCSP ? 'Content-Security-Policy = "default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:; connect-src \'self\' https:; frame-src \'none\'; object-src \'none\'"' : ''}

# Cache Configuration
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=${config.cache.ttl.static}, immutable"

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "public, max-age=${config.cache.ttl.api}"

# Context-specific configurations
[context.${config.environment}.environment]
${Object.entries(envVars).map(([key, value]) => `  ${key} = "${value}"`).join('\n')}
`;
  }

  /**
   * Generate Docker configuration
   */
  generateDockerConfig(config: ProductionConfig): string {
    return `# Production Docker Configuration
# Generated by ProductionConfigService for ${config.environment}

FROM node:${config.deployment.nodeVersion}-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Set environment variables
${Object.entries(this.generateEnvironmentVariables(config))
  .map(([key, value]) => `ENV ${key}="${value}"`)
  .join('\n')}

# Build application
RUN ${config.deployment.buildCommand}

# Expose port
EXPOSE 4321

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:4321/health || exit 1

# Start application
CMD ["npm", "run", "preview"]
`;
  }

  /**
   * Generate GitHub Actions workflow
   */
  generateGitHubActionsWorkflow(config: ProductionConfig): string {
    return `# Production Deployment Workflow
# Generated by ProductionConfigService for ${config.environment}

name: Production Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
${Object.entries(this.generateEnvironmentVariables(config))
  .map(([key, value]) => `  ${key}: "${value}"`)
  .join('\n')}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '${config.deployment.nodeVersion}'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:run
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Security audit
        run: npm run security:audit
      
      - name: Performance tests
        run: npm run perf:test:critical

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '${config.deployment.nodeVersion}'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: ${config.deployment.buildCommand}
      
      - name: Deploy to ${config.deployment.platform}
        run: npm run deploy:production
        env:
          NETLIFY_AUTH_TOKEN: \${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: \${{ secrets.NETLIFY_SITE_ID }}
`;
  }

  /**
   * Validate production configuration
   */
  validateConfig(config: ProductionConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate deployment configuration
    if (!config.deployment.domain) {
      errors.push('Deployment domain is required');
    }

    if (!config.deployment.buildCommand) {
      errors.push('Build command is required');
    }

    if (!config.deployment.nodeVersion) {
      errors.push('Node version is required');
    }

    // Validate build configuration
    if (config.build.maxCities <= 0) {
      errors.push('Max cities must be greater than 0');
    }

    if (config.build.batchSize <= 0) {
      errors.push('Batch size must be greater than 0');
    }

    if (config.build.batchDelay < 0) {
      errors.push('Batch delay must be non-negative');
    }

    // Validate cache configuration
    if (config.cache.ttl.default <= 0) {
      errors.push('Default cache TTL must be greater than 0');
    }

    if (config.cache.provider === 'redis' && config.environment === 'production') {
      // Redis is recommended for production
    }

    // Validate security configuration
    if (config.security.trustedDomains.length === 0) {
      errors.push('At least one trusted domain is required');
    }

    if (config.environment === 'production' && !config.security.enableCSP) {
      errors.push('CSP should be enabled in production');
    }

    if (config.environment === 'production' && !config.security.enableHSTS) {
      errors.push('HSTS should be enabled in production');
    }

    // Validate monitoring configuration
    if (config.environment === 'production' && !config.monitoring.enableHealthChecks) {
      errors.push('Health checks should be enabled in production');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get deployment readiness status
   */
  getDeploymentReadiness(config: ProductionConfig): {
    ready: boolean;
    score: number;
    checks: Array<{ name: string; status: 'pass' | 'fail' | 'warning'; message: string }>;
  } {
    const checks: Array<{ name: string; status: 'pass' | 'fail' | 'warning'; message: string }> = [];

    // Configuration validation
    const validation = this.validateConfig(config);
    checks.push({
      name: 'Configuration Validation',
      status: validation.valid ? 'pass' : 'fail',
      message: validation.valid ? 'Configuration is valid' : `Errors: ${validation.errors.join(', ')}`
    });

    // Security checks
    checks.push({
      name: 'Security Headers',
      status: config.security.enableCSP && config.security.enableHSTS ? 'pass' : 'warning',
      message: config.security.enableCSP && config.security.enableHSTS ? 
        'Security headers enabled' : 'Some security headers not enabled'
    });

    // Performance checks
    checks.push({
      name: 'Performance Optimization',
      status: config.performance.enableCaching && config.performance.enableCompression ? 'pass' : 'warning',
      message: config.performance.enableCaching && config.performance.enableCompression ?
        'Performance optimizations enabled' : 'Some performance optimizations disabled'
    });

    // Monitoring checks
    checks.push({
      name: 'Monitoring Setup',
      status: config.monitoring.enableHealthChecks && config.monitoring.enableErrorReporting ? 'pass' : 'warning',
      message: config.monitoring.enableHealthChecks && config.monitoring.enableErrorReporting ?
        'Monitoring properly configured' : 'Some monitoring features disabled'
    });

    // Database checks
    checks.push({
      name: 'Database Configuration',
      status: config.database.provider !== 'mock' ? 'pass' : 'warning',
      message: config.database.provider !== 'mock' ?
        `Database provider: ${config.database.provider}` : 'Using mock database provider'
    });

    // Cache checks
    checks.push({
      name: 'Cache Configuration',
      status: config.cache.provider !== 'none' ? 'pass' : 'warning',
      message: config.cache.provider !== 'none' ?
        `Cache provider: ${config.cache.provider}` : 'No cache provider configured'
    });

    const passCount = checks.filter(c => c.status === 'pass').length;
    const score = Math.round((passCount / checks.length) * 100);
    const ready = checks.every(c => c.status !== 'fail') && score >= 80;

    return { ready, score, checks };
  }
}

// Export singleton instance
export const productionConfigService = new ProductionConfigService();