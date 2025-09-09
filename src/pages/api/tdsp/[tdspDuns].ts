/**
 * TDSP Management API - GET/PUT /api/tdsp/[tdspDuns]
 * Manages individual Texas TDSP information and service areas
 * Provides TDSP details, ZIP territory mappings, and health metrics
 */

import type { APIRoute } from 'astro';
import { tdspService } from '../../../lib/services/tdsp-service';

// Rate limiting
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 50;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const clientLimit = rateLimits.get(ip);
  
  if (!clientLimit || now > clientLimit.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true };
  }
  
  if (clientLimit.count >= RATE_LIMIT) {
    return { allowed: false, resetTime: clientLimit.resetTime };
  }
  
  clientLimit.count++;
  return { allowed: true };
}

export const GET: APIRoute = async ({ params, request, clientAddress }) => {
  const startTime = Date.now();

  try {
    // Rate limiting
    const clientIP = clientAddress || 'unknown';
    const rateLimitCheck = checkRateLimit(clientIP);
    
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: 60
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '60' }
        }
      );
    }

    const tdspDuns = params.tdspDuns;
    if (!tdspDuns) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TDSP DUNS number is required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const includeServiceArea = url.searchParams.get('serviceArea') !== 'false';
    const includeBoundaries = url.searchParams.get('boundaries') === 'true';
    const includeMetrics = url.searchParams.get('metrics') === 'true';
    const includeZipCodes = url.searchParams.get('zipCodes') === 'true';
    const minConfidence = parseInt(url.searchParams.get('minConfidence') || '50');
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    // Get TDSP data
    const tdspOptions = {
      includeServiceArea,
      includeBoundaries,
      forceRefresh
    };

    const [tdspData, tdspMetrics, zipCodes] = await Promise.all([
      tdspService.getTDSPByDuns(tdspDuns, tdspOptions),
      includeMetrics ? tdspService.getTDSPMetrics(tdspDuns) : Promise.resolve(null),
      includeZipCodes ? tdspService.getZipCodesForTDSP(tdspDuns, minConfidence) : Promise.resolve([])
    ]);

    if (!tdspData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TDSP not found',
          tdspDuns
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const processingTime = Date.now() - startTime;

    // Build response
    const responseData = {
      success: true,
      data: {
        tdsp: tdspData,
        ...(includeMetrics && { metrics: tdspMetrics }),
        ...(includeZipCodes && { 
          zipCodes: {
            total: zipCodes.length,
            mappings: zipCodes,
            confidenceDistribution: {
              high: zipCodes.filter(z => z.confidence >= 80).length,
              medium: zipCodes.filter(z => z.confidence >= 60 && z.confidence < 80).length,
              low: zipCodes.filter(z => z.confidence < 60).length
            }
          }
        }),
        summary: {
          serviceQuality: tdspMetrics ? 
            (tdspMetrics.avgConfidence >= 80 ? 'excellent' :
             tdspMetrics.avgConfidence >= 70 ? 'good' :
             tdspMetrics.avgConfidence >= 60 ? 'fair' : 'poor') : 'unknown',
          apiHealth: tdspMetrics?.apiHealth || 'unknown',
          totalCoverage: tdspData.zipCodes.length
        }
      },
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        parameters: {
          includeServiceArea,
          includeBoundaries,
          includeMetrics,
          includeZipCodes,
          minConfidence
        }
      }
    };

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // 1 hour
          'X-Response-Time': `${processingTime}ms`,
          'X-TDSP-Name': tdspData.name,
          'X-Service-Area': tdspData.serviceArea,
          'X-ZIP-Count': tdspData.zipCodes.length.toString()
        }
      }
    );

  } catch (error) {
    console.error('[TDSP API] GET Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to retrieve TDSP data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const PUT: APIRoute = async ({ params, request, clientAddress }) => {
  const startTime = Date.now();

  try {
    // Rate limiting (stricter for updates)
    const clientIP = clientAddress || 'unknown';
    const rateLimitCheck = checkRateLimit(clientIP);
    
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: 60
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '60' }
        }
      );
    }

    const tdspDuns = params.tdspDuns;
    if (!tdspDuns) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TDSP DUNS number is required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action = 'update', ...actionData } = body;

    let result;

    switch (action) {
      case 'update_service_area':
        // Update TDSP service area from external sources
        result = await tdspService.updateTDSPServiceArea(tdspDuns);
        break;

      case 'validate_territory':
        // Validate a specific ZIP against this TDSP
        const { zipCode } = actionData;
        if (!zipCode) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'zipCode is required for validate_territory action'
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        result = await tdspService.validateZipInTerritory(zipCode, tdspDuns);
        break;

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid action. Supported actions: update_service_area, validate_territory'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
    }

    const processingTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: result !== null && result !== false,
        data: {
          action,
          result,
          tdspDuns
        },
        metadata: {
          processingTime,
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: result !== null && result !== false ? 200 : 422,
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Time': `${processingTime}ms`,
          'X-Action': action
        }
      }
    );

  } catch (error) {
    console.error('[TDSP API] PUT Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to update TDSP data',
        details: error instanceof Error ? error.message : 'Unknown error'
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
      error: 'Method not allowed',
      supportedMethods: ['GET', 'PUT'],
      endpoints: {
        'GET /api/tdsp/{tdspDuns}': 'Get TDSP information and service area',
        'PUT /api/tdsp/{tdspDuns}': 'Update TDSP data (actions: update_service_area, validate_territory)'
      }
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

export const DELETE = POST;