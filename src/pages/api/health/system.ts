/**
 * System Health API - GET /api/health/system
 * Comprehensive system health monitoring endpoint
 * Provides real-time health status for all ZIP coverage system components
 */

import type { APIRoute } from 'astro';
import { zipCoverageOrchestrator } from '../../../lib/services/zip-coverage-orchestrator';

export const GET: APIRoute = async ({ request }) => {
  const startTime = Date.now();

  try {
    // Parse query parameters
    const url = new URL(request.url);
    const detailed = url.searchParams.get('detailed') === 'true';
    const format = url.searchParams.get('format') || 'json';

    // Perform comprehensive health check
    const healthCheck = await zipCoverageOrchestrator.performHealthCheck();
    const systemStatus = await zipCoverageOrchestrator.getSystemStatus();

    // Basic health response
    const basicHealth = {
      status: healthCheck.overall,
      timestamp: healthCheck.lastChecked,
      services: Object.keys(healthCheck.services).reduce((acc, service) => {
        acc[service] = healthCheck.services[service];
        return acc;
      }, {} as Record<string, string>),
      metrics: {
        totalZipsMapped: healthCheck.metrics.totalZipsMapped,
        avgConfidence: Math.round(healthCheck.metrics.avgConfidence),
        errorRate: Math.round(healthCheck.metrics.errorRate * 10000) / 100,
        responseTime: Math.round(healthCheck.metrics.apiResponseTime)
      }
    };

    // Detailed health response
    const detailedHealth = detailed ? {
      ...basicHealth,
      issues: healthCheck.issues.map(issue => ({
        severity: issue.severity,
        component: issue.component,
        message: issue.message,
        recommendation: issue.recommendation
      })),
      systemStatus: {
        coverage: systemStatus.coverage,
        performance: systemStatus.performance,
        quality: systemStatus.quality
      },
      diagnostics: {
        uptime: Date.now() - startTime,
        memoryUsage: process.memoryUsage ? {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        } : null,
        nodeVersion: process.version
      }
    } : basicHealth;

    // Determine HTTP status based on health
    const httpStatus = healthCheck.overall === 'healthy' ? 200 :
                      healthCheck.overall === 'degraded' ? 200 : 503;

    // Handle different response formats
    if (format === 'plain') {
      // Plain text format for simple monitoring
      const plainText = `STATUS: ${healthCheck.overall.toUpperCase()}\n` +
                       `SERVICES: ${Object.values(healthCheck.services).filter(s => s === 'healthy').length}/${Object.keys(healthCheck.services).length} healthy\n` +
                       `ERROR_RATE: ${Math.round(healthCheck.metrics.errorRate * 10000) / 100}%\n` +
                       `RESPONSE_TIME: ${Math.round(healthCheck.metrics.apiResponseTime)}ms\n` +
                       `TIMESTAMP: ${healthCheck.lastChecked}`;

      return new Response(plainText, {
        status: httpStatus,
        headers: {
          'Content-Type': 'text/plain',
          'X-Health-Status': healthCheck.overall,
          'Cache-Control': 'no-cache'
        }
      });
    }

    const processingTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        health: detailedHealth,
        metadata: {
          processingTime,
          checkDuration: processingTime,
          apiVersion: 'v1',
          ...(detailed && { 
            requestId: `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          })
        }
      }),
      {
        status: httpStatus,
        headers: {
          'Content-Type': 'application/json',
          'X-Health-Status': healthCheck.overall,
          'X-Services-Healthy': `${Object.values(healthCheck.services).filter(s => s === 'healthy').length}/${Object.keys(healthCheck.services).length}`,
          'X-Response-Time': `${processingTime}ms`,
          'Cache-Control': 'no-cache'
        }
      }
    );

  } catch (error) {
    console.error('[System Health API] Error:', error);
    
    return new Response(
      JSON.stringify({
        health: {
          status: 'critical',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Health check failed'
        }
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Health-Status': 'critical'
        }
      }
    );
  }
};

// HEAD endpoint for simple uptime checks
export const HEAD: APIRoute = async () => {
  try {
    const healthCheck = await zipCoverageOrchestrator.performHealthCheck();
    const httpStatus = healthCheck.overall === 'critical' ? 503 : 200;
    
    return new Response(null, {
      status: httpStatus,
      headers: {
        'X-Health-Status': healthCheck.overall,
        'X-Services-Healthy': `${Object.values(healthCheck.services).filter(s => s === 'healthy').length}`,
        'X-Timestamp': healthCheck.lastChecked
      }
    });
  } catch {
    return new Response(null, {
      status: 503,
      headers: {
        'X-Health-Status': 'critical'
      }
    });
  }
};

// Handle unsupported methods
export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      error: 'Method not allowed',
      supportedMethods: ['GET', 'HEAD'],
      endpoints: {
        'GET /api/health/system': 'Basic system health',
        'GET /api/health/system?detailed=true': 'Detailed health with diagnostics',
        'GET /api/health/system?format=plain': 'Plain text format for monitoring',
        'HEAD /api/health/system': 'Simple uptime check'
      }
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

export const PUT = POST;
export const DELETE = POST;