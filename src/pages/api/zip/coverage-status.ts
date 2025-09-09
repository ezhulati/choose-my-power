/**
 * ZIP Coverage Status API - GET /api/zip/coverage-status
 * Provides real-time status information about ZIP coverage system
 * Shows coverage metrics, data quality, and system health
 */

import type { APIRoute } from 'astro';
import { zipCoverageOrchestrator } from '../../../lib/services/zip-coverage-orchestrator';
import { cityCoverageService } from '../../../lib/services/city-coverage-service';
import { analyticsService } from '../../../lib/services/analytics-service';

// Simple caching for status endpoint
let statusCache: {
  data: any;
  timestamp: number;
  ttl: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const GET: APIRoute = async ({ request }) => {
  const startTime = Date.now();

  try {
    // Check for query parameters
    const url = new URL(request.url);
    const includeDetails = url.searchParams.get('details') === 'true';
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    // Check cache unless force refresh
    if (!forceRefresh && statusCache && Date.now() - statusCache.timestamp < statusCache.ttl) {
      return new Response(
        JSON.stringify({
          success: true,
          data: statusCache.data,
          metadata: {
            cached: true,
            cacheAge: Date.now() - statusCache.timestamp,
            processingTime: Date.now() - startTime
          }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300', // 5 minutes
            'X-Cache-Status': 'HIT'
          }
        }
      );
    }

    // Get system status
    const systemStatus = await zipCoverageOrchestrator.getSystemStatus();
    
    // Get additional details if requested
    let detailedMetrics = {};
    if (includeDetails) {
      const [coverageMetrics, dataQualityMetrics] = await Promise.all([
        cityCoverageService.getSystemCoverageMetrics(),
        analyticsService.getDataQualitySummary(24)
      ]);

      detailedMetrics = {
        cityBreakdown: {
          totalCities: coverageMetrics.totalCities,
          fullyCovered: coverageMetrics.fullyCoveredCities,
          partiallyCovered: coverageMetrics.partiallyCoveredCities,
          uncovered: coverageMetrics.uncoveredCities,
          topCities: coverageMetrics.topCitiesByZipCount.slice(0, 10)
        },
        dataQuality: {
          totalIssues: dataQualityMetrics.totalIssues,
          criticalIssues: dataQualityMetrics.criticalIssues,
          issueDistribution: dataQualityMetrics.issuesByType,
          trends: dataQualityMetrics.recentTrends.slice(-12) // Last 12 hours
        },
        tdspBreakdown: coverageMetrics.coverageByTdsp
      };
    }

    const responseData = {
      overview: {
        systemHealth: systemStatus.health.overall,
        totalZipsMapped: systemStatus.coverage.totalZipsMapped,
        averageCoverage: Math.round(systemStatus.coverage.averageCoverage * 100) / 100,
        dataQualityScore: Math.max(0, 100 - systemStatus.quality.recentIssues),
        lastUpdated: systemStatus.coverage.lastUpdated
      },
      health: {
        services: systemStatus.health.services,
        criticalIssues: systemStatus.health.issues.filter(i => i.severity === 'critical').length,
        totalIssues: systemStatus.health.issues.length
      },
      performance: {
        avgResponseTime: systemStatus.performance.avgResponseTime,
        recentValidations: systemStatus.performance.recentValidations,
        errorRate: Math.round(systemStatus.performance.errorRate * 10000) / 100, // As percentage
        throughputPerHour: systemStatus.performance.throughput
      },
      coverage: {
        totalCities: systemStatus.coverage.totalCities,
        coveredCities: systemStatus.coverage.coveredCities,
        coveragePercentage: Math.round((systemStatus.coverage.coveredCities / systemStatus.coverage.totalCities) * 100)
      },
      ...(includeDetails && { details: detailedMetrics })
    };

    // Cache the result
    statusCache = {
      data: responseData,
      timestamp: Date.now(),
      ttl: CACHE_TTL
    };

    const processingTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: responseData,
        metadata: {
          cached: false,
          processingTime,
          timestamp: new Date().toISOString(),
          apiVersion: 'v1'
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
          'X-Response-Time': `${processingTime}ms`,
          'X-Cache-Status': 'MISS',
          'X-System-Health': systemStatus.health.overall
        }
      }
    );

  } catch (error) {
    console.error('[ZIP Coverage Status API] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to retrieve system status',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Health check endpoint for monitoring
export const HEAD: APIRoute = async () => {
  try {
    // Quick health check without full status
    const healthCheck = await zipCoverageOrchestrator.performHealthCheck();
    
    const status = healthCheck.overall === 'healthy' ? 200 :
                  healthCheck.overall === 'degraded' ? 200 : 503;
    
    return new Response(null, {
      status,
      headers: {
        'X-System-Health': healthCheck.overall,
        'X-Services-Healthy': Object.values(healthCheck.services).filter(s => s === 'healthy').length.toString(),
        'X-Total-Services': Object.keys(healthCheck.services).length.toString(),
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    return new Response(null, {
      status: 503,
      headers: {
        'X-System-Health': 'critical',
        'X-Error': 'Health check failed'
      }
    });
  }
};

// Handle unsupported methods
export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Method not allowed. Use GET to retrieve status.',
      availableEndpoints: {
        'GET /api/zip/coverage-status': 'Get system status overview',
        'GET /api/zip/coverage-status?details=true': 'Get detailed status with metrics',
        'GET /api/zip/coverage-status?refresh=true': 'Force refresh cached data',
        'HEAD /api/zip/coverage-status': 'Quick health check'
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