/**
 * Health Check Function for ChooseMyPower.org
 * Enterprise monitoring endpoint with comprehensive system validation
 */

import type { Context } from "@netlify/functions";

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: CheckResult;
    redis: CheckResult;
    api: CheckResult;
    build: CheckResult;
    performance: CheckResult;
  };
  metrics: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    responseTime: number;
  };
  deploymentInfo: {
    commitSha?: string;
    deployTime?: string;
    buildNumber?: string;
  };
}

interface CheckResult {
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  details?: string;
  lastError?: string;
}

// Track service uptime
const startTime = Date.now();

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  
  try {
    // Import database connection dynamically
    if (process.env.DATABASE_URL) {
      const { planRepository } = await import('../../src/lib/database/plan-repository');
      
      // Simple database connectivity test
      const stats = await planRepository.getCacheStats();
      
      return {
        status: 'pass',
        duration: Date.now() - start,
        details: `Database responsive. Cache entries: ${stats.totalCacheEntries}`
      };
    } else {
      return {
        status: 'warn',
        duration: Date.now() - start,
        details: 'Database URL not configured (fallback mode)'
      };
    }
  } catch (error) {
    return {
      status: 'fail',
      duration: Date.now() - start,
      lastError: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

async function checkRedis(): Promise<CheckResult> {
  const start = Date.now();
  
  try {
    if (process.env.REDIS_URL) {
      const { comparePowerClient } = await import('../../src/lib/api/comparepower-client');
      
      // Test Redis connectivity through client
      const cacheStats = await comparePowerClient.getCacheStats();
      
      return {
        status: cacheStats.redis.connected ? 'pass' : 'fail',
        duration: Date.now() - start,
        details: `Redis ${cacheStats.redis.connected ? 'connected' : 'disconnected'}. Hit rate: ${Math.round(cacheStats.redis.hitRate * 100)}%`
      };
    } else {
      return {
        status: 'warn',
        duration: Date.now() - start,
        details: 'Redis URL not configured (memory cache only)'
      };
    }
  } catch (error) {
    return {
      status: 'fail',
      duration: Date.now() - start,
      lastError: error instanceof Error ? error.message : 'Redis check failed'
    };
  }
}

async function checkAPI(): Promise<CheckResult> {
  const start = Date.now();
  
  try {
    const { comparePowerClient } = await import('../../src/lib/api/comparepower-client');
    
    // Test API connectivity and circuit breaker status
    const healthCheck = await comparePowerClient.healthCheck();
    
    if (healthCheck.healthy && !healthCheck.circuitBreakerOpen) {
      return {
        status: 'pass',
        duration: Date.now() - start,
        details: `API responsive in ${healthCheck.responseTime}ms`
      };
    } else if (healthCheck.circuitBreakerOpen) {
      return {
        status: 'fail',
        duration: Date.now() - start,
        details: 'Circuit breaker is OPEN',
        lastError: healthCheck.lastError
      };
    } else {
      return {
        status: 'fail',
        duration: Date.now() - start,
        details: 'API health check failed',
        lastError: healthCheck.lastError
      };
    }
  } catch (error) {
    return {
      status: 'fail',
      duration: Date.now() - start,
      lastError: error instanceof Error ? error.message : 'API check failed'
    };
  }
}

async function checkBuild(): Promise<CheckResult> {
  const start = Date.now();
  
  try {
    // Check if critical build artifacts exist
    const fs = await import('fs');
    const path = await import('path');
    
    // In Netlify, we're in the functions directory, so adjust path
    const distPath = path.join(process.cwd(), '../dist');
    
    const criticalFiles = [
      'index.html',
      'robots.txt',
      'sitemap.xml'
    ];
    
    const missingFiles = criticalFiles.filter(file => {
      const filePath = path.join(distPath, file);
      return !fs.existsSync(filePath);
    });
    
    if (missingFiles.length === 0) {
      return {
        status: 'pass',
        duration: Date.now() - start,
        details: 'All critical build files present'
      };
    } else {
      return {
        status: 'fail',
        duration: Date.now() - start,
        details: `Missing files: ${missingFiles.join(', ')}`
      };
    }
  } catch (error) {
    return {
      status: 'warn',
      duration: Date.now() - start,
      details: 'Build check not available in serverless environment'
    };
  }
}

async function checkPerformance(): Promise<CheckResult> {
  const start = Date.now();
  
  try {
    // Get memory usage and other performance metrics
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Simple performance heuristics
    const memoryUsageMB = memUsage.heapUsed / 1024 / 1024;
    const memoryThreshold = 128; // MB
    
    let status: 'pass' | 'warn' | 'fail' = 'pass';
    let details = `Memory: ${Math.round(memoryUsageMB)}MB, Uptime: ${Math.round(uptime)}s`;
    
    if (memoryUsageMB > memoryThreshold) {
      status = 'warn';
      details += ` (high memory usage)`;
    }
    
    return {
      status,
      duration: Date.now() - start,
      details
    };
  } catch (error) {
    return {
      status: 'fail',
      duration: Date.now() - start,
      lastError: error instanceof Error ? error.message : 'Performance check failed'
    };
  }
}

export default async function handler(request: Request, context: Context) {
  const requestStart = Date.now();
  
  // Allow CORS
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'X-Health-Check': 'ChooseMyPower.org'
  });
  
  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  
  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }
  
  try {
    // Run all health checks concurrently
    const [databaseCheck, redisCheck, apiCheck, buildCheck, performanceCheck] = await Promise.allSettled([
      checkDatabase(),
      checkRedis(), 
      checkAPI(),
      checkBuild(),
      checkPerformance()
    ]);
    
    // Extract results, handling any rejections
    const checks = {
      database: databaseCheck.status === 'fulfilled' ? databaseCheck.value : {
        status: 'fail' as const,
        duration: 0,
        lastError: 'Health check promise rejected'
      },
      redis: redisCheck.status === 'fulfilled' ? redisCheck.value : {
        status: 'fail' as const,
        duration: 0,
        lastError: 'Health check promise rejected'
      },
      api: apiCheck.status === 'fulfilled' ? apiCheck.value : {
        status: 'fail' as const,
        duration: 0,
        lastError: 'Health check promise rejected'
      },
      build: buildCheck.status === 'fulfilled' ? buildCheck.value : {
        status: 'fail' as const,
        duration: 0,
        lastError: 'Health check promise rejected'
      },
      performance: performanceCheck.status === 'fulfilled' ? performanceCheck.value : {
        status: 'fail' as const,
        duration: 0,
        lastError: 'Health check promise rejected'
      }
    };
    
    // Determine overall health status
    const failedChecks = Object.values(checks).filter(check => check.status === 'fail').length;
    const warnChecks = Object.values(checks).filter(check => check.status === 'warn').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (failedChecks === 0 && warnChecks === 0) {
      overallStatus = 'healthy';
    } else if (failedChecks === 0 && warnChecks > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }
    
    // Get deployment info from environment
    const deploymentInfo = {
      commitSha: process.env.COMMIT_REF || context.clientContext?.git?.commit_sha,
      deployTime: process.env.BUILD_TIME,
      buildNumber: process.env.BUILD_ID || context.clientContext?.git?.commit_sha?.substring(0, 8)
    };
    
    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      checks,
      metrics: {
        uptime: Date.now() - startTime,
        memoryUsage: process.memoryUsage(),
        responseTime: Date.now() - requestStart
      },
      deploymentInfo
    };
    
    // Set appropriate HTTP status code
    let httpStatus = 200;
    if (overallStatus === 'degraded') httpStatus = 200; // Still OK but with warnings
    if (overallStatus === 'unhealthy') httpStatus = 503; // Service Unavailable
    
    return new Response(
      JSON.stringify(response, null, 2),
      { 
        status: httpStatus, 
        headers: {
          ...headers,
          'X-Health-Status': overallStatus,
          'X-Response-Time': `${Date.now() - requestStart}ms`
        }
      }
    );
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - requestStart
    };
    
    return new Response(
      JSON.stringify(errorResponse, null, 2),
      { 
        status: 503, 
        headers: {
          ...headers,
          'X-Health-Status': 'unhealthy',
          'X-Error': 'Health check system failure'
        }
      }
    );
  }
}