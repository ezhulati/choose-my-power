/**
 * API Endpoint: POST /api/zip/route
 * Feature: 010-expand-zip-code - Phase 3.4 Enhancement
 * Fast ZIP code routing with caching optimization
 */

import type { APIRoute } from 'astro';
import { zipRoutingService } from '../../../lib/services/zip-routing-service';
import type { ZIPRoutingResult } from '../../../lib/types/zip-navigation';

export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();

  try {
    // Parse request body
    let body: { zipCode: string; zipPlus4?: string };
    try {
      body = await request.json();
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid JSON in request body'
        },
        responseTime: Date.now() - startTime,
        cached: false
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // Validate ZIP code
    if (!body.zipCode || typeof body.zipCode !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_ZIP_FORMAT',
          message: 'ZIP code is required and must be a string'
        },
        responseTime: Date.now() - startTime,
        cached: false
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // ZIP format validation
    if (!/^\d{5}$/.test(body.zipCode)) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_ZIP_FORMAT',
          message: 'ZIP code must be 5 digits'
        },
        responseTime: Date.now() - startTime,
        cached: false
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // Get routing using the enhanced service
    const routingResult = await zipRoutingService.getZIPRouting(body.zipCode);
    
    const responseStatus = routingResult.success ? 200 : 404;
    const cacheHeaders = routingResult.cached ? 
      { 'Cache-Control': 'public, max-age=3600' } : // 1 hour for cached
      { 'Cache-Control': 'public, max-age=300' };   // 5 minutes for fresh

    return new Response(JSON.stringify(routingResult), {
      status: responseStatus,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        ...cacheHeaders,
        'X-Cache-Status': routingResult.cached ? 'HIT' : 'MISS',
        'X-Response-Time': `${routingResult.responseTime}ms`
      }
    });

  } catch (error) {
    console.error('[API] ZIP routing error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'ROUTING_ERROR',
        message: 'Internal server error during ZIP routing'
      },
      responseTime: Date.now() - startTime,
      cached: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
};