/**
 * API Endpoint: GET /api/analytics/zip-navigation
 * Feature: 010-expand-zip-code - Phase 3.4 Enhancement
 * ZIP navigation analytics and insights
 */

import type { APIRoute } from 'astro';
import { analyticsService } from '../../../lib/services/analytics-service';
import { zipRoutingService } from '../../../lib/services/zip-routing-service';

export const GET: APIRoute = async ({ url }) => {
  const startTime = Date.now();

  try {
    // Get query parameters
    const hours = parseInt(url.searchParams.get('hours') || '24');
    const includePerformance = url.searchParams.get('performance') === 'true';
    
    // Validate hours parameter
    if (isNaN(hours) || hours < 1 || hours > 168) { // Max 1 week
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Hours parameter must be between 1 and 168 (1 week)'
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get ZIP navigation insights
    const insights = await analyticsService.getZIPNavigationInsights(hours);
    
    let responseData: any = {
      success: true,
      data: {
        timeRange: {
          hours,
          from: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        },
        insights: {
          totalEvents: insights.totalEvents,
          eventDistribution: insights.eventTypes,
          errorRate: insights.errorRate,
          topZIPCodes: insights.topZIPs,
          coverageGaps: insights.coverageGaps,
          performance: insights.performanceMetrics
        }
      },
      responseTime: Date.now() - startTime,
      generatedAt: new Date().toISOString()
    };

    // Include detailed performance metrics if requested
    if (includePerformance) {
      const routingMetrics = zipRoutingService.getPerformanceMetrics();
      responseData.data.detailedPerformance = {
        ...routingMetrics,
        cacheStats: await zipRoutingService.getCacheStats()
      };
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300' // 5 minutes cache
      }
    });

  } catch (error) {
    console.error('[API] ZIP navigation analytics error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Error retrieving ZIP navigation analytics'
      },
      responseTime: Date.now() - startTime
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

// Handle CORS preflight requests
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
};