/**
 * TDSP Overview API - GET /api/tdsp/overview
 * Provides comprehensive overview of all Texas TDSPs
 * Shows service areas, health status, and coverage metrics
 */

import type { APIRoute } from 'astro';
import { tdspService, TEXAS_TDSPS } from '../../../lib/services/tdsp-service';
import { apiClientFactory } from '../../../lib/external-apis/client-factory';

// Simple caching
let overviewCache: {
  data: unknown;
  timestamp: number;
  ttl: number;
} | null = null;

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export const GET: APIRoute = async ({ request }) => {
  const startTime = Date.now();

  try {
    // Parse query parameters
    const url = new URL(request.url);
    const includeHealth = url.searchParams.get('health') === 'true';
    const includeMetrics = url.searchParams.get('metrics') === 'true';
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
            'Cache-Control': 'public, max-age=900', // 15 minutes
            'X-Cache-Status': 'HIT'
          }
        }
      );
    }

    // Get all TDSP information
    const tdspPromises = Object.values(TEXAS_TDSPS).map(async (tdspConfig) => {
      try {
        const [tdspData, metrics, health] = await Promise.all([
          tdspService.getTDSPByDuns(tdspConfig.duns, { 
            includeServiceArea: true,
            includeBoundaries: false 
          }),
          includeMetrics ? tdspService.getTDSPMetrics(tdspConfig.duns) : Promise.resolve(null),
          includeHealth ? apiClientFactory.getClientHealthStatus() : Promise.resolve(null)
        ]);

        return {
          duns: tdspConfig.duns,
          name: tdspConfig.name,
          serviceArea: tdspConfig.serviceArea,
          type: tdspConfig.type,
          isRegulated: tdspConfig.isRegulated,
          primaryZipRanges: tdspConfig.primaryZipRanges,
          data: tdspData,
          ...(includeMetrics && { metrics }),
          ...(includeHealth && { health: health?.clients?.[tdspConfig.name.toLowerCase().replace(/\s+/g, '_')] })
        };

      } catch (error) {
        console.error(`[TDSP Overview] Error getting data for ${tdspConfig.name}:`, error);
        return {
          duns: tdspConfig.duns,
          name: tdspConfig.name,
          serviceArea: tdspConfig.serviceArea,
          type: tdspConfig.type,
          isRegulated: tdspConfig.isRegulated,
          primaryZipRanges: tdspConfig.primaryZipRanges,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const tdspResults = await Promise.all(tdspPromises);

    // Calculate system-wide metrics
    const systemMetrics = {
      totalTDSPs: Object.keys(TEXAS_TDSPS).length,
      deregulatedTDSPs: Object.values(TEXAS_TDSPS).filter(t => !t.isRegulated).length,
      municipalTDSPs: Object.values(TEXAS_TDSPS).filter(t => t.isRegulated).length,
      totalZipCodes: tdspResults.reduce((sum, tdsp) => 
        sum + (tdsp.data?.zipCodes?.length || 0), 0
      ),
      avgConfidence: includeMetrics ? 
        tdspResults.reduce((sum, tdsp) => sum + (tdsp.metrics?.avgConfidence || 0), 0) / 
        tdspResults.filter(t => t.metrics).length : null,
      healthyAPIs: includeHealth ?
        tdspResults.filter(tdsp => tdsp.health?.status === 'healthy').length : null
    };

    // Build coverage breakdown
    const coverageBreakdown = tdspResults.map(tdsp => ({
      duns: tdsp.duns,
      name: tdsp.name,
      serviceArea: tdsp.serviceArea,
      type: tdsp.type,
      isRegulated: tdsp.isRegulated,
      zipCount: tdsp.data?.zipCodes?.length || 0,
      cities: tdsp.data?.cities?.length || 0,
      ...(includeMetrics && {
        avgConfidence: tdsp.metrics?.avgConfidence || 0,
        totalValidations: tdsp.metrics?.totalZipCodes || 0
      }),
      ...(includeHealth && {
        apiHealth: tdsp.health?.status || 'unknown'
      }),
      status: tdsp.error ? 'error' : 'active'
    })).sort((a, b) => b.zipCount - a.zipCount);

    // Territory analysis
    const territoryAnalysis = {
      largestTerritory: coverageBreakdown[0]?.name || 'Unknown',
      mostReliable: includeHealth ? 
        coverageBreakdown.find(t => t.apiHealth === 'healthy')?.name || 'Unknown' : null,
      highestQuality: includeMetrics ?
        coverageBreakdown.reduce((best, current) => 
          (current.avgConfidence || 0) > (best.avgConfidence || 0) ? current : best
        ).name : null,
      coverageGaps: coverageBreakdown.filter(t => t.zipCount === 0).length
    };

    const responseData = {
      overview: {
        systemMetrics,
        territoryAnalysis,
        lastUpdated: new Date().toISOString()
      },
      tdsps: coverageBreakdown,
      ...(includeHealth && {
        systemHealth: {
          overall: systemMetrics.healthyAPIs === systemMetrics.totalTDSPs ? 'healthy' :
                  (systemMetrics.healthyAPIs || 0) >= systemMetrics.totalTDSPs * 0.75 ? 'degraded' : 'critical',
          healthyServices: systemMetrics.healthyAPIs,
          totalServices: systemMetrics.totalTDSPs
        }
      }),
      recommendations: [
        ...(systemMetrics.avgConfidence && systemMetrics.avgConfidence < 75 ? [
          'System-wide confidence scores are below target - consider data quality improvements'
        ] : []),
        ...(territoryAnalysis.coverageGaps > 0 ? [
          `${territoryAnalysis.coverageGaps} TDSPs have no ZIP coverage data - needs immediate attention`
        ] : []),
        ...(includeHealth && (systemMetrics.healthyAPIs || 0) < systemMetrics.totalTDSPs ? [
          `${systemMetrics.totalTDSPs - (systemMetrics.healthyAPIs || 0)} TDSP APIs are experiencing issues`
        ] : [])
      ]
    };

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
            includeHealth,
            includeMetrics
          }
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=900',
          'X-Response-Time': `${processingTime}ms`,
          'X-Cache-Status': 'MISS',
          'X-Total-TDSPs': systemMetrics.totalTDSPs.toString(),
          'X-Total-ZIP-Coverage': systemMetrics.totalZipCodes.toString()
        }
      }
    );

  } catch (error) {
    console.error('[TDSP Overview API] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to retrieve TDSP overview',
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
      error: 'Method not allowed. Use GET to retrieve TDSP overview.',
      availableEndpoints: {
        'GET /api/tdsp/overview': 'Basic TDSP overview',
        'GET /api/tdsp/overview?health=true': 'Include API health status',
        'GET /api/tdsp/overview?metrics=true': 'Include detailed metrics',
        'GET /api/tdsp/overview?health=true&metrics=true': 'Complete overview with all data'
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