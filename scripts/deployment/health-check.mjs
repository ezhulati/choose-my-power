#!/usr/bin/env node

/**
 * Deployment Health Check Script
 * Task T035: Create production deployment configuration
 * Phase 3.5 Polish & Validation: Production health monitoring
 */

import { execSync } from 'child_process';

class DeploymentHealthChecker {
  constructor() {
    this.baseUrl = process.env.DEPLOYMENT_URL || process.env.BASE_URL || 'https://choosemypower.org';
    this.timeout = parseInt(process.env.HEALTH_CHECK_TIMEOUT || '30000');
    this.retries = parseInt(process.env.HEALTH_CHECK_RETRIES || '3');
    this.checks = [];
  }

  /**
   * Log with timestamp
   */
  log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Perform HTTP health check with retries
   */
  async httpCheck(url, expectedStatus = 200, retries = this.retries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'DeploymentHealthChecker/1.0'
          }
        });

        clearTimeout(timeoutId);

        const responseTime = Date.now() - start;
        const start = Date.now();

        return {
          success: response.status === expectedStatus,
          status: response.status,
          responseTime,
          headers: Object.fromEntries(response.headers.entries()),
          attempt,
          url
        };
      } catch (error) {
        this.log(`❌ HTTP check attempt ${attempt}/${retries} failed for ${url}:`, error.message);
        
        if (attempt === retries) {
          return {
            success: false,
            error: error.message,
            attempt,
            url
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  /**
   * Check core application health
   */
  async checkCoreHealth() {
    this.log('🏥 Checking core application health...');
    
    const healthEndpoint = `${this.baseUrl}/health`;
    const result = await this.httpCheck(healthEndpoint);

    this.checks.push({
      name: 'Core Application Health',
      category: 'critical',
      url: healthEndpoint,
      ...result
    });

    if (result.success) {
      this.log('✅ Core application health check passed');
    } else {
      this.log('❌ Core application health check failed');
    }

    return result.success;
  }

  /**
   * Check critical pages
   */
  async checkCriticalPages() {
    this.log('📄 Checking critical pages...');
    
    const criticalPages = [
      { path: '/', name: 'Homepage' },
      { path: '/texas/houston', name: 'Houston City Page' },
      { path: '/texas/dallas', name: 'Dallas City Page' },
      { path: '/electricity-plans/houston-tx', name: 'Houston Plans Page' },
      { path: '/electricity-plans/dallas-tx', name: 'Dallas Plans Page' },
      { path: '/sitemap.xml', name: 'Sitemap' },
      { path: '/robots.txt', name: 'Robots.txt' }
    ];

    const results = await Promise.all(
      criticalPages.map(async page => {
        const url = `${this.baseUrl}${page.path}`;
        const result = await this.httpCheck(url);
        
        this.checks.push({
          name: `Critical Page: ${page.name}`,
          category: 'critical',
          url,
          ...result
        });

        if (result.success) {
          this.log(`✅ ${page.name} accessible`);
        } else {
          this.log(`❌ ${page.name} failed`);
        }

        return result.success;
      })
    );

    const allPassed = results.every(success => success);
    this.log(allPassed ? '✅ All critical pages accessible' : '❌ Some critical pages failed');
    
    return allPassed;
  }

  /**
   * Check API endpoints
   */
  async checkApiEndpoints() {
    this.log('🔌 Checking API endpoints...');
    
    const apiEndpoints = [
      { path: '/api/zip/validate', name: 'ZIP Validation API', method: 'POST' },
      { path: '/api/seo/city-metadata?city=houston&zipCode=77001', name: 'SEO Metadata API' },
      { path: '/api/plans/compare', name: 'Plans Comparison API' },
      { path: '/api/analytics/zip-metrics', name: 'Analytics API' }
    ];

    const results = await Promise.all(
      apiEndpoints.map(async endpoint => {
        const url = `${this.baseUrl}${endpoint.path}`;
        let result;

        if (endpoint.method === 'POST') {
          // For POST endpoints, test with minimal valid data
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'DeploymentHealthChecker/1.0'
              },
              body: JSON.stringify({ zipCode: '77001' }),
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            result = {
              success: response.status < 500, // Accept 4xx as "working" (bad request format)
              status: response.status,
              url
            };
          } catch (error) {
            result = {
              success: false,
              error: error.message,
              url
            };
          }
        } else {
          result = await this.httpCheck(url);
        }
        
        this.checks.push({
          name: `API Endpoint: ${endpoint.name}`,
          category: 'api',
          url,
          ...result
        });

        if (result.success) {
          this.log(`✅ ${endpoint.name} responding`);
        } else {
          this.log(`❌ ${endpoint.name} failed`);
        }

        return result.success;
      })
    );

    const allPassed = results.every(success => success);
    this.log(allPassed ? '✅ All API endpoints responding' : '⚠️ Some API endpoints failed');
    
    return allPassed;
  }

  /**
   * Check performance metrics
   */
  async checkPerformance() {
    this.log('⚡ Checking performance metrics...');
    
    const performanceTests = [
      { path: '/', name: 'Homepage' },
      { path: '/texas/houston', name: 'Houston Page' },
      { path: '/electricity-plans/houston-tx', name: 'Houston Plans' }
    ];

    const results = [];

    for (const test of performanceTests) {
      const url = `${this.baseUrl}${test.path}`;
      const start = Date.now();
      
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'DeploymentHealthChecker/1.0' }
        });
        
        const responseTime = Date.now() - start;
        const contentLength = response.headers.get('content-length') || 0;
        
        const passed = responseTime < 3000; // 3 second threshold
        
        this.checks.push({
          name: `Performance: ${test.name}`,
          category: 'performance',
          url,
          success: passed,
          responseTime,
          contentLength: parseInt(contentLength),
          threshold: '3000ms'
        });

        if (passed) {
          this.log(`✅ ${test.name} performance OK (${responseTime}ms)`);
        } else {
          this.log(`⚠️ ${test.name} performance slow (${responseTime}ms)`);
        }

        results.push(passed);
      } catch (error) {
        this.log(`❌ ${test.name} performance check failed:`, error.message);
        results.push(false);
      }
    }

    const allPassed = results.every(success => success);
    this.log(allPassed ? '✅ Performance metrics acceptable' : '⚠️ Performance issues detected');
    
    return allPassed;
  }

  /**
   * Check security headers
   */
  async checkSecurityHeaders() {
    this.log('🔒 Checking security headers...');
    
    const url = `${this.baseUrl}/`;
    const result = await this.httpCheck(url);
    
    if (!result.success) {
      this.log('❌ Cannot check security headers - site unreachable');
      return false;
    }

    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'content-security-policy',
      'strict-transport-security'
    ];

    const missingHeaders = [];
    const presentHeaders = [];

    for (const header of requiredHeaders) {
      if (result.headers[header] || result.headers[header.toLowerCase()]) {
        presentHeaders.push(header);
      } else {
        missingHeaders.push(header);
      }
    }

    this.checks.push({
      name: 'Security Headers',
      category: 'security',
      url,
      success: missingHeaders.length === 0,
      presentHeaders,
      missingHeaders,
      total: requiredHeaders.length,
      present: presentHeaders.length
    });

    if (missingHeaders.length === 0) {
      this.log('✅ All security headers present');
    } else {
      this.log(`⚠️ Missing security headers: ${missingHeaders.join(', ')}`);
    }

    return missingHeaders.length === 0;
  }

  /**
   * Check SSL/TLS configuration
   */
  async checkSSL() {
    this.log('🔐 Checking SSL/TLS configuration...');
    
    if (!this.baseUrl.startsWith('https://')) {
      this.log('⚠️ Not using HTTPS - SSL check skipped');
      return false;
    }

    try {
      const url = new URL(this.baseUrl);
      const hostname = url.hostname;

      // Test SSL connection
      const response = await fetch(this.baseUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': 'DeploymentHealthChecker/1.0' }
      });

      const sslValid = response.ok;
      
      this.checks.push({
        name: 'SSL/TLS Configuration',
        category: 'security',
        hostname,
        success: sslValid,
        protocol: 'HTTPS'
      });

      if (sslValid) {
        this.log('✅ SSL/TLS configuration valid');
      } else {
        this.log('❌ SSL/TLS configuration issues detected');
      }

      return sslValid;
    } catch (error) {
      this.log('❌ SSL/TLS check failed:', error.message);
      return false;
    }
  }

  /**
   * Check database connectivity
   */
  async checkDatabase() {
    this.log('🗄️ Checking database connectivity...');
    
    try {
      // Test database health through API endpoint
      const url = `${this.baseUrl}/api/health/database`;
      const result = await this.httpCheck(url, 200);
      
      this.checks.push({
        name: 'Database Connectivity',
        category: 'infrastructure',
        url,
        ...result
      });

      if (result.success) {
        this.log('✅ Database connectivity OK');
      } else {
        this.log('⚠️ Database connectivity issues detected');
      }

      return result.success;
    } catch (error) {
      this.log('⚠️ Database check not available:', error.message);
      return true; // Don't fail health check if database endpoint not available
    }
  }

  /**
   * Check cache performance
   */
  async checkCache() {
    this.log('🚀 Checking cache performance...');
    
    try {
      // Make two requests to the same resource
      const url = `${this.baseUrl}/api/plans/compare?city=houston`;
      
      const first = await this.httpCheck(url);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      const second = await this.httpCheck(url);

      const cacheWorking = first.success && second.success && 
                          second.responseTime < first.responseTime;

      this.checks.push({
        name: 'Cache Performance',
        category: 'performance',
        url,
        success: cacheWorking,
        firstRequest: first.responseTime,
        secondRequest: second.responseTime,
        improvement: first.responseTime - second.responseTime
      });

      if (cacheWorking) {
        this.log('✅ Cache performance optimized');
      } else {
        this.log('⚠️ Cache performance could be improved');
      }

      return cacheWorking;
    } catch (error) {
      this.log('⚠️ Cache check not available:', error.message);
      return true; // Don't fail health check if cache endpoint not available
    }
  }

  /**
   * Generate health check report
   */
  generateReport() {
    const criticalChecks = this.checks.filter(c => c.category === 'critical');
    const securityChecks = this.checks.filter(c => c.category === 'security');
    const performanceChecks = this.checks.filter(c => c.category === 'performance');
    const apiChecks = this.checks.filter(c => c.category === 'api');

    const criticalPassed = criticalChecks.filter(c => c.success).length;
    const securityPassed = securityChecks.filter(c => c.success).length;
    const performancePassed = performanceChecks.filter(c => c.success).length;
    const apiPassed = apiChecks.filter(c => c.success).length;

    const totalPassed = this.checks.filter(c => c.success).length;
    const healthScore = Math.round((totalPassed / this.checks.length) * 100);

    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      overall: {
        healthy: criticalPassed === criticalChecks.length,
        score: healthScore,
        totalChecks: this.checks.length,
        passed: totalPassed,
        failed: this.checks.length - totalPassed
      },
      categories: {
        critical: {
          passed: criticalPassed,
          total: criticalChecks.length,
          health: criticalPassed === criticalChecks.length ? 'healthy' : 'unhealthy'
        },
        security: {
          passed: securityPassed,
          total: securityChecks.length,
          health: securityPassed === securityChecks.length ? 'secure' : 'vulnerable'
        },
        performance: {
          passed: performancePassed,
          total: performanceChecks.length,
          health: performancePassed >= performanceChecks.length * 0.8 ? 'good' : 'poor'
        },
        api: {
          passed: apiPassed,
          total: apiChecks.length,
          health: apiPassed >= apiChecks.length * 0.8 ? 'responsive' : 'degraded'
        }
      },
      checks: this.checks
    };

    return report;
  }

  /**
   * Run comprehensive health check
   */
  async runHealthCheck() {
    this.log(`🏥 Starting deployment health check for ${this.baseUrl}`);
    
    const startTime = Date.now();
    
    try {
      // Critical checks (must all pass)
      await this.checkCoreHealth();
      await this.checkCriticalPages();
      
      // Security checks
      await this.checkSecurityHeaders();
      await this.checkSSL();
      
      // Performance checks
      await this.checkPerformance();
      await this.checkCache();
      
      // API checks
      await this.checkApiEndpoints();
      
      // Infrastructure checks
      await this.checkDatabase();

      const endTime = Date.now();
      const duration = endTime - startTime;

      this.log(`✅ Health check completed in ${duration}ms`);
      
      const report = this.generateReport();
      this.log('📊 Health Check Report:', report);

      return report;
    } catch (error) {
      this.log('💥 Health check failed:', error.message);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const format = args.includes('--json') ? 'json' : 'console';
  const baseUrl = args.find(arg => arg.startsWith('--url='))?.split('=')[1];

  if (baseUrl) {
    process.env.DEPLOYMENT_URL = baseUrl;
  }

  try {
    const checker = new DeploymentHealthChecker();
    const report = await checker.runHealthCheck();

    if (format === 'json') {
      console.log(JSON.stringify(report, null, 2));
    }

    // Exit with appropriate code
    const healthy = report.overall.healthy;
    process.exit(healthy ? 0 : 1);
  } catch (error) {
    console.error('💥 Health check failed:', error.message);
    process.exit(1);
  }
}

// Export for testing
export { DeploymentHealthChecker };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}