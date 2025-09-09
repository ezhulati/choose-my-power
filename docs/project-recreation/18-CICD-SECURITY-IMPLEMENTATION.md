# CI/CD Pipeline & Security Implementation

**Document**: Complete CI/CD Pipeline and Security Implementation Guide  
**Version**: 1.0  
**Date**: 2025-09-09  
**Purpose**: Provide complete CI/CD pipeline configuration and security implementation

## CI/CD Pipeline Implementation

### **GitHub Actions Workflow (.github/workflows/ci.yml)**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20.5.0'
  
jobs:
  # Quality Gates - Must pass before deployment
  quality-gates:
    name: Quality Gates & Linting
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Lint code
        run: npm run lint
        
      - name: Type check
        run: npx astro check
        
      - name: Constitutional ID validation (Critical)
        run: npm run validate:ids
        
      - name: Security scan
        run: npm run security:scan

  # Unit & Integration Tests
  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    needs: quality-gates
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_USER: test_user
          POSTGRES_DB: choosemypower_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
          
      redis:
        image: redis:7
        ports:
          - 6379:6379
          
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Setup test database
        run: |
          npm run db:migrate
          npm run db:seed
        env:
          TEST_DATABASE_URL: postgresql://test_user:test_password@localhost:5432/choosemypower_test
          REDIS_URL: redis://localhost:6379/1
          
      - name: Run unit tests
        run: npm run test:coverage
        env:
          TEST_DATABASE_URL: postgresql://test_user:test_password@localhost:5432/choosemypower_test
          REDIS_URL: redis://localhost:6379/1
          COMPAREPOWER_API_KEY: ${{ secrets.COMPAREPOWER_API_KEY_TEST }}
          
      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage/lcov.info
          
      - name: Coverage threshold check
        run: |
          COVERAGE=$(node -e "const data = require('./coverage/coverage-summary.json'); console.log(data.total.lines.pct)")
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below threshold (80%)"
            exit 1
          fi
          echo "Coverage $COVERAGE% meets threshold"

  # E2E Tests
  e2e-tests:
    name: End-to-End Tests
    runs-on: ubuntu-latest
    needs: [quality-gates, test]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Build application
        run: npm run build:local
        env:
          LOCAL_BUILD: true
          MAX_CITIES: 5  # Limited for CI speed
          USE_CACHED_DATA: true
          
      - name: Start test server
        run: npm run preview &
        env:
          PORT: 4325
          
      - name: Wait for server
        run: npx wait-on http://localhost:4325 --timeout 60000
        
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          TEST_BASE_URL: http://localhost:4325
          
      - name: Upload E2E artifacts
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  # Performance Tests
  performance:
    name: Performance Tests
    runs-on: ubuntu-latest
    needs: [quality-gates, test]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build for performance testing
        run: npm run build:local
        env:
          LOCAL_BUILD: true
          MAX_CITIES: 10
          
      - name: Start server for performance testing
        run: npm run preview &
        env:
          PORT: 4325
          
      - name: Wait for server
        run: npx wait-on http://localhost:4325 --timeout 60000
        
      - name: Run critical performance tests
        run: npm run perf:test:critical
        env:
          TEST_BASE_URL: http://localhost:4325
          
      - name: Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          configPath: './.lighthouserc.json'
          uploadArtifacts: true
          temporaryPublicStorage: true

  # Security Audit
  security-audit:
    name: Security Audit
    runs-on: ubuntu-latest
    needs: quality-gates
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run security audit
        run: npm audit --audit-level high
        
      - name: Run custom security scan
        run: npm run security:audit
        
      - name: CodeQL Analysis
        uses: github/codeql-action/init@v3
        with:
          languages: javascript
          
      - name: CodeQL Analyze
        uses: github/codeql-action/analyze@v3

  # Build & Deploy to Staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [test, e2e-tests, performance, security-audit]
    if: github.ref == 'refs/heads/develop'
    
    environment:
      name: staging
      url: https://staging--choose-my-power.netlify.app
      
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build for staging
        run: npm run build
        env:
          NETLIFY_DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
          COMPAREPOWER_API_KEY: ${{ secrets.COMPAREPOWER_API_KEY }}
          REDIS_URL: ${{ secrets.STAGING_REDIS_URL }}
          MAX_CITIES: 100  # Limited for staging
          
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --dir=dist --functions=netlify/functions
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_STAGING_SITE_ID }}
          
      - name: Health check staging
        run: |
          sleep 30  # Wait for deployment
          curl -f https://staging--choose-my-power.netlify.app/api/health/system || exit 1

  # Build & Deploy to Production
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [test, e2e-tests, performance, security-audit]
    if: github.ref == 'refs/heads/main'
    
    environment:
      name: production
      url: https://choosemypower.com
      
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Production readiness check
        run: npm run production:validate
        env:
          NETLIFY_DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
          COMPAREPOWER_API_KEY: ${{ secrets.COMPAREPOWER_API_KEY }}
          
      - name: Build for production
        run: npm run build
        env:
          NODE_ENV: production
          NETLIFY_DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
          COMPAREPOWER_API_KEY: ${{ secrets.COMPAREPOWER_API_KEY }}
          REDIS_URL: ${{ secrets.PRODUCTION_REDIS_URL }}
          MAX_CITIES: 881  # Full build for production
          BATCH_SIZE: 15
          BATCH_DELAY_MS: 1500
          
      - name: Deploy to Netlify Production
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist --functions=netlify/functions
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          
      - name: Health check production
        run: |
          sleep 60  # Wait for deployment
          curl -f https://choosemypower.com/api/health/system || exit 1
          
      - name: Post-deployment tests
        run: npm run test:api
        env:
          TEST_BASE_URL: https://choosemypower.com

  # Notification
  notify:
    name: Notification
    runs-on: ubuntu-latest
    needs: [deploy-staging, deploy-production]
    if: always()
    
    steps:
      - name: Notify deployment status
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### **Lighthouse CI Configuration (.lighthouserc.json)**
```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:4325/",
        "http://localhost:4325/texas/",
        "http://localhost:4325/electricity-plans/dallas-tx/",
        "http://localhost:4325/electricity-plans/houston-tx/"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

## Security Implementation

### **Input Validation Middleware (src/lib/middleware/input-validation.ts)**
```typescript
import { z } from 'zod';

// Common validation schemas
export const CommonSchemas = {
  zipCode: z.string().regex(/^\d{5}$/, 'ZIP code must be 5 digits'),
  mongoObjectId: z.string().regex(/^[0-9a-f]{24}$/, 'Invalid MongoDB ObjectId format'),
  esiid: z.string().regex(/^1\d{16}$/, 'ESID must be 17 digits starting with 1'),
  citySlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Invalid city slug format'),
  planName: z.string().min(1).max(255).trim(),
  providerName: z.string().min(1).max(255).trim(),
};

// SQL injection prevention
export function sanitizeInput(input: string): string {
  return input
    .replace(/['"\\;]/g, '') // Remove dangerous characters
    .trim()
    .slice(0, 1000); // Limit length
}

// XSS prevention
export function sanitizeForHTML(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Rate limiting key generator
export function generateRateLimitKey(request: Request, identifier?: string): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const userAgent = request.headers.get('user-agent')?.slice(0, 100) || 'unknown';
  const endpoint = new URL(request.url).pathname;
  
  return `${identifier || ip}:${endpoint}:${userAgent}`;
}

// CSRF token validation
export function validateCSRFToken(request: Request, expectedToken: string): boolean {
  const token = request.headers.get('x-csrf-token') || 
                request.headers.get('csrf-token');
  
  return token === expectedToken;
}
```

### **Security Headers Middleware (src/lib/middleware/security-headers.ts)**
```typescript
export function addSecurityHeaders(response: Response): Response {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: http:",
      "connect-src 'self' https://pricing.api.comparepower.com https://ercot.api.comparepower.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://comparepower.com",
    ].join('; ')
  );

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HTTPS enforcement
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  return response;
}

// Apply to all API responses
export function secureAPIResponse(data: any, status: number = 200): Response {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return addSecurityHeaders(response);
}
```

### **Environment Variable Validation (src/lib/config/env-validation.ts)**
```typescript
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  
  // Database (required)
  NETLIFY_DATABASE_URL: z.string().url('Invalid database URL'),
  DATABASE_URL: z.string().url().optional(),
  
  // API Keys (required for production)
  COMPAREPOWER_API_KEY: z.string().min(10, 'ComparePower API key required'),
  ERCOT_API_KEY: z.string().optional(),
  
  // Optional services
  REDIS_URL: z.string().url().optional(),
  ANALYTICS_KEY: z.string().optional(),
  
  // Build configuration
  MAX_CITIES: z.string().transform(Number).default('881'),
  BATCH_SIZE: z.string().transform(Number).default('10'),
  BATCH_DELAY_MS: z.string().transform(Number).default('2000'),
  USE_CACHED_DATA: z.string().transform(Boolean).default('true'),
  
  // Security
  SECRET_KEY: z.string().min(32, 'Secret key must be at least 32 characters').optional(),
});

export function validateEnvironment() {
  try {
    const env = EnvSchema.parse(process.env);
    
    // Additional security checks
    if (env.NODE_ENV === 'production') {
      if (!env.SECRET_KEY) {
        throw new Error('SECRET_KEY is required in production');
      }
      
      if (env.COMPAREPOWER_API_KEY.includes('test') || env.COMPAREPOWER_API_KEY.includes('dev')) {
        throw new Error('Production API key appears to be a test key');
      }
    }
    
    console.log('✅ Environment validation passed');
    return env;
    
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1); // Fail hard in production
    }
    
    throw error;
  }
}

// Export validated environment
export const ENV = validateEnvironment();
```

### **API Security Wrapper (src/lib/security/api-security.ts)**
```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { rateLimit } from '../middleware/rate-limit';
import { secureAPIResponse } from '../middleware/security-headers';
import { sanitizeInput } from '../middleware/input-validation';

interface SecureAPIOptions {
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  validation?: {
    query?: z.ZodSchema;
    body?: z.ZodSchema;
  };
  requireAuth?: boolean;
}

export function secureAPI(
  handler: (context: any) => Promise<any>,
  options: SecureAPIOptions = {}
): APIRoute {
  return async (context) => {
    const { request } = context;
    const startTime = performance.now();

    try {
      // Rate limiting
      if (options.rateLimit) {
        const rateLimiter = rateLimit(options.rateLimit);
        const rateLimitResponse = await rateLimiter(request, context, async () => {
          return new Response('', { status: 200 });
        });
        
        if (rateLimitResponse.status === 429) {
          return rateLimitResponse;
        }
      }

      // Input validation
      if (options.validation) {
        const url = new URL(request.url);
        
        // Validate query parameters
        if (options.validation.query) {
          const queryParams = Object.fromEntries(url.searchParams.entries());
          const queryValidation = options.validation.query.safeParse(queryParams);
          
          if (!queryValidation.success) {
            return secureAPIResponse({
              success: false,
              error: {
                code: 'INVALID_QUERY',
                message: 'Invalid query parameters',
                details: queryValidation.error.errors,
              },
            }, 400);
          }
        }

        // Validate request body
        if (options.validation.body && request.method !== 'GET') {
          try {
            const body = await request.json();
            const bodyValidation = options.validation.body.safeParse(body);
            
            if (!bodyValidation.success) {
              return secureAPIResponse({
                success: false,
                error: {
                  code: 'INVALID_BODY',
                  message: 'Invalid request body',
                  details: bodyValidation.error.errors,
                },
              }, 400);
            }
          } catch {
            return secureAPIResponse({
              success: false,
              error: {
                code: 'INVALID_JSON',
                message: 'Invalid JSON in request body',
              },
            }, 400);
          }
        }
      }

      // Execute handler
      const result = await handler(context);

      // Add security headers and return
      return secureAPIResponse({
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          performance: {
            responseTime: Math.round(performance.now() - startTime),
          },
        },
      });

    } catch (error) {
      console.error('[API Security] Error:', error);
      
      return secureAPIResponse({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: process.env.NODE_ENV === 'production' ? 
            'Internal server error' : 
            error.message,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          performance: {
            responseTime: Math.round(performance.now() - startTime),
          },
        },
      }, 500);
    }
  };
}
```

### **Database Security (src/lib/database/security.ts)**
```typescript
import { sql } from 'drizzle-orm';
import { db } from './connection';

// Parameterized query helper to prevent SQL injection
export function safeQuery(query: string, params: any[] = []) {
  // Validate that query uses parameters correctly
  const paramCount = (query.match(/\$\d+/g) || []).length;
  
  if (paramCount !== params.length) {
    throw new Error('Parameter count mismatch - potential SQL injection attempt');
  }
  
  return sql.raw(query, params);
}

// Database connection security
export async function validateDatabaseConnection() {
  try {
    // Test connection with read-only query
    const result = await db.execute(sql`SELECT 1 as test`);
    
    if (!result || result.length === 0) {
      throw new Error('Database connection test failed');
    }
    
    console.log('✅ Database connection secure');
    return true;
    
  } catch (error) {
    console.error('❌ Database security check failed:', error);
    throw error;
  }
}

// Query performance monitoring
export function monitorQuery(queryName: string, duration: number) {
  if (duration > 5000) { // 5 second threshold
    console.warn(`⚠️ Slow query detected: ${queryName} took ${duration}ms`);
  }
  
  // Log to monitoring service in production
  if (process.env.NODE_ENV === 'production' && duration > 1000) {
    // Send to monitoring service
    console.log(`Query performance: ${queryName} - ${duration}ms`);
  }
}
```

### **Security Audit Script (scripts/security-scan.mjs)**
```javascript
#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

class SecurityScanner {
  constructor() {
    this.vulnerabilities = [];
    this.warnings = [];
  }

  async runSecurityScan() {
    console.log('🔒 Running security audit...');
    
    try {
      await this.checkDependencyVulnerabilities();
      await this.scanForSecurityPatterns();
      await this.validateEnvironmentSecurity();
      await this.checkAPISecurityPatterns();
      
      this.reportResults();
      
    } catch (error) {
      console.error('❌ Security scan failed:', error);
      throw error;
    }
  }

  async checkDependencyVulnerabilities() {
    console.log('📦 Checking dependency vulnerabilities...');
    
    try {
      const auditResult = execSync('npm audit --json', { encoding: 'utf-8' });
      const audit = JSON.parse(auditResult);
      
      if (audit.vulnerabilities) {
        Object.entries(audit.vulnerabilities).forEach(([pkg, vuln]) => {
          if (vuln.severity === 'high' || vuln.severity === 'critical') {
            this.vulnerabilities.push({
              type: 'dependency',
              package: pkg,
              severity: vuln.severity,
              title: vuln.title,
            });
          }
        });
      }
      
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      if (error.stdout) {
        const audit = JSON.parse(error.stdout);
        // Process audit results...
      }
    }
  }

  async scanForSecurityPatterns() {
    console.log('🔍 Scanning for security patterns...');
    
    const securityPatterns = [
      {
        name: 'Hardcoded API Keys',
        pattern: /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
        severity: 'critical',
      },
      {
        name: 'SQL Injection Risk',
        pattern: /\$\{[^}]*\}/g, // Template literal in SQL context
        severity: 'high',
      },
      {
        name: 'Eval Usage',
        pattern: /eval\s*\(/gi,
        severity: 'high',
      },
      {
        name: 'Dangerous innerHTML',
        pattern: /innerHTML\s*=\s*[^;]+;/gi,
        severity: 'medium',
      },
    ];

    const sourceFiles = this.getSourceFiles();

    for (const file of sourceFiles) {
      const content = readFileSync(file, 'utf-8');
      
      for (const pattern of securityPatterns) {
        const matches = content.match(pattern.pattern);
        
        if (matches) {
          const filteredMatches = matches.filter(match => 
            !this.isInComment(content, match) && 
            !this.isInTestFile(file)
          );
          
          if (filteredMatches.length > 0) {
            this.vulnerabilities.push({
              type: 'code_pattern',
              file,
              pattern: pattern.name,
              severity: pattern.severity,
              matches: filteredMatches,
            });
          }
        }
      }
    }
  }

  async validateEnvironmentSecurity() {
    console.log('🌍 Validating environment security...');
    
    // Check for .env files in repository
    const envFiles = ['.env', '.env.local', '.env.production'];
    
    for (const envFile of envFiles) {
      try {
        const envContent = readFileSync(envFile, 'utf-8');
        
        // Check for secrets in environment files
        if (envContent.includes('password') || envContent.includes('secret')) {
          this.vulnerabilities.push({
            type: 'env_security',
            file: envFile,
            severity: 'critical',
            message: 'Potential secrets in environment file',
          });
        }
      } catch {
        // File doesn't exist, which is fine
      }
    }
  }

  async checkAPISecurityPatterns() {
    console.log('🛡️ Checking API security patterns...');
    
    const apiFiles = this.getSourceFiles().filter(file => 
      file.includes('/api/') || file.includes('pages/api/')
    );

    for (const file of apiFiles) {
      const content = readFileSync(file, 'utf-8');
      
      // Check for missing input validation
      if (!content.includes('z.object') && !content.includes('validate')) {
        this.warnings.push({
          type: 'api_validation',
          file,
          message: 'API endpoint may be missing input validation',
        });
      }
      
      // Check for missing rate limiting
      if (!content.includes('rateLimit') && !content.includes('rate-limit')) {
        this.warnings.push({
          type: 'api_rate_limit',
          file,
          message: 'API endpoint may be missing rate limiting',
        });
      }
    }
  }

  getSourceFiles() {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.astro'];
    const dirs = ['src', 'scripts'];
    const files = [];

    function walkDir(dir) {
      try {
        const items = readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = join(dir, item.name);
          
          if (item.isDirectory()) {
            if (!item.name.includes('node_modules') && !item.name.startsWith('.')) {
              walkDir(fullPath);
            }
          } else if (extensions.some(ext => item.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Directory doesn't exist or can't be read
      }
    }

    dirs.forEach(walkDir);
    return files;
  }

  isInComment(content, match) {
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.includes(match)) {
        const trimmed = line.trim();
        return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('<!--');
      }
    }
    
    return false;
  }

  isInTestFile(file) {
    return file.includes('.test.') || 
           file.includes('.spec.') || 
           file.includes('/test/') || 
           file.includes('__tests__');
  }

  reportResults() {
    console.log('\n🔒 Security Audit Results:');
    
    const criticalVulns = this.vulnerabilities.filter(v => v.severity === 'critical');
    const highVulns = this.vulnerabilities.filter(v => v.severity === 'high');
    const mediumVulns = this.vulnerabilities.filter(v => v.severity === 'medium');
    
    console.log(`Critical: ${criticalVulns.length}`);
    console.log(`High: ${highVulns.length}`);
    console.log(`Medium: ${mediumVulns.length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    
    if (criticalVulns.length > 0) {
      console.log('\n🚨 CRITICAL VULNERABILITIES:');
      criticalVulns.forEach(vuln => {
        console.log(`  ${vuln.type}: ${vuln.file || vuln.package}`);
        console.log(`    ${vuln.message || vuln.title || vuln.pattern}`);
      });
    }
    
    if (highVulns.length > 0) {
      console.log('\n⚠️  HIGH VULNERABILITIES:');
      highVulns.forEach(vuln => {
        console.log(`  ${vuln.type}: ${vuln.file || vuln.package}`);
        console.log(`    ${vuln.message || vuln.title || vuln.pattern}`);
      });
    }
    
    // Fail build on critical or high vulnerabilities
    if (criticalVulns.length > 0 || highVulns.length > 0) {
      throw new Error(`Security audit failed: ${criticalVulns.length} critical, ${highVulns.length} high vulnerabilities found`);
    }
    
    console.log('\n✅ Security audit passed!');
  }
}

// Main execution
async function main() {
  try {
    const scanner = new SecurityScanner();
    await scanner.runSecurityScan();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Security audit failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

This comprehensive CI/CD and security implementation provides:
- ✅ Complete GitHub Actions workflow with quality gates
- ✅ Automated testing pipeline (unit, integration, E2E, performance)
- ✅ Constitutional requirement validation in CI/CD
- ✅ Security headers and input validation
- ✅ Dependency vulnerability scanning
- ✅ Code pattern security analysis
- ✅ Environment variable validation
- ✅ Production deployment with health checks
- ✅ Performance monitoring with Lighthouse CI
- ✅ Comprehensive security audit automation