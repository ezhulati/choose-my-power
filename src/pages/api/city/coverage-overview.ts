/**
 * City Coverage Overview API - GET /api/city/coverage-overview
 * Provides system-wide city coverage metrics and analysis
 * Shows which cities need attention and overall coverage statistics
 */

import type { APIRoute } from 'astro';
import { cityCoverageService } from '../../../lib/services/city-coverage-service';

// Simple caching
let overviewCache: {
  data: unknown;
  timestamp: number;
  ttl: number;
} | null = null;

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const GET: APIRoute = async ({ request }) => {
  const startTime = Date.now();

  try {
    // Parse query parameters
    const url = new URL(request.url);
    const includeDetails = url.searchParams.get('details') === 'true';
    const showNeedsAttention = url.searchParams.get('needsAttention') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    // Check cache
    if (!forceRefresh && overviewCache && Date.now() - overviewCache.timestamp < overviewCache.ttl) {
      return new Response(
        JSON.stringify({
          success: true,
          data: overviewCache.data,
          metadata: {
            cached: true,
            cacheAge: Date.now() - overviewCache.timestamp,
            processingTime: Date.now() - startTime
          }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=600', // 10 minutes
            'X-Cache-Status': 'HIT'
          }
        }
      );
    }

    // Get system coverage metrics
    const systemMetrics = await cityCoverageService.getSystemCoverageMetrics();
    
    // Get cities needing attention if requested
    let citiesNeedingAttention: unknown[] = [];
    if (showNeedsAttention || includeDetails) {
      citiesNeedingAttention = await cityCoverageService.getCitiesNeedingAttention(
        Math.min(limit, 100)
      );
    }

    // Build response data
    const responseData = {
      overview: {
        totalCities: systemMetrics.totalCities,
        coverageDistribution: {
          fullyCovered: systemMetrics.fullyCoveredCities,
          partiallyCovered: systemMetrics.partiallyCoveredCities,
          uncovered: systemMetrics.uncoveredCities
        },
        averageCoverage: Math.round(systemMetrics.averageCoveragePercentage * 100) / 100,
        systemHealth: {
          coverageRating: systemMetrics.averageCoveragePercentage >= 90 ? 'excellent' :
                         systemMetrics.averageCoveragePercentage >= 75 ? 'good' :
                         systemMetrics.averageCoveragePercentage >= 50 ? 'fair' : 'poor',
          completionPercentage: Math.round(
            ((systemMetrics.fullyCoveredCities + systemMetrics.partiallyCoveredCities) / systemMetrics.totalCities) * 100
          )
        }
      },
      topCities: systemMetrics.topCitiesByZipCount.slice(0, Math.min(limit, 25)),
      tdspBreakdown: systemMetrics.coverageByTdsp,
      ...(showNeedsAttention && {
        citiesNeedingAttention: citiesNeedingAttention.map(city => ({
          ...city,
          priorityLevel: city.priority,
          estimatedEffort: city.missingZips <= 5 ? 'low' :
                          city.missingZips <= 15 ? 'medium' : 'high',
          recommendedAction: city.avgConfidence < 60 ? 'data_quality_improvement' :
                           city.coverage < 50 ? 'comprehensive_mapping' : 'gap_filling'
        }))
      })
    };

    if (includeDetails) {
      responseData.analytics = {
        coverageTrends: {
          improving: citiesNeedingAttention.filter(c => c.priority === 'medium').length,
          declining: citiesNeedingAttention.filter(c => c.priority === 'high').length,
          stable: systemMetrics.fullyCoveredCities
        },
        dataQuality: {
          highConfidence: systemMetrics.topCitiesByZipCount.filter(c => c.coverage >= 90).length,
          mediumConfidence: systemMetrics.topCitiesByZipCount.filter(c => c.coverage >= 70 && c.coverage < 90).length,
          lowConfidence: systemMetrics.topCitiesByZipCount.filter(c => c.coverage < 70).length
        },
        recommendations: [
          ...(systemMetrics.uncoveredCities > 0 ? [
            `${systemMetrics.uncoveredCities} cities have no ZIP coverage and need immediate attention`
          ] : []),
          ...(systemMetrics.averageCoveragePercentage < 80 ? [
            'System average coverage is below target - consider bulk improvement operations'
          ] : []),
          ...(citiesNeedingAttention.filter(c => c.priority === 'high').length > 10 ? [
            'High number of cities with critical coverage issues - prioritize data quality improvements'
          ] : [])
        ]
      };
    }

    // Cache the result
    overviewCache = {
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
          parameters: {
            includeDetails,
            showNeedsAttention,
            limit
          }
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600',
          'X-Response-Time': `${processingTime}ms`,
          'X-Cache-Status': 'MISS',
          'X-Total-Cities': systemMetrics.totalCities.toString(),
          'X-Avg-Coverage': `${Math.round(systemMetrics.averageCoveragePercentage)}%`
        }
      }
    );

  } catch (error) {
    console.error('[City Coverage Overview API] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to retrieve coverage overview',
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

// Handle unsupported methods
export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Method not allowed. Use GET to retrieve coverage overview.',
      availableEndpoints: {
        'GET /api/city/coverage-overview': 'Basic coverage overview',
        'GET /api/city/coverage-overview?details=true': 'Detailed overview with analytics',
        'GET /api/city/coverage-overview?needsAttention=true': 'Include cities needing attention',
        'GET /api/city/coverage-overview?limit=50': 'Limit number of results'
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