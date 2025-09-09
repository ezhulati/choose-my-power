/**
 * API Endpoint: GET /api/zip/lookup/{zipCode}
 * Feature: 010-expand-zip-code - Direct ZIP to city routing
 * Constitutional compliance: Dynamic routing, no hardcoded values
 */

import type { APIRoute } from 'astro';
import { zipValidationService } from '../../../../lib/services/zip-validation-service';

export const GET: APIRoute = async ({ params, request }) => {
  const startTime = Date.now();
  const zipCode = params.zipCode;

  try {
    // Validate ZIP code parameter
    if (!zipCode || typeof zipCode !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_ZIP_FORMAT',
          message: 'ZIP code parameter is required'
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ZIP format validation
    if (!/^\d{5}$/.test(zipCode)) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_ZIP_FORMAT',
          message: 'ZIP code must be 5 digits'
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Perform ZIP lookup for routing
    const lookupResult = await zipValidationService.lookupZIPRouting(zipCode);

    if (!lookupResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: lookupResult.error?.code || 'ZIP_NOT_FOUND',
          message: 'ZIP code not found in deregulated areas'
        }
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Success response
    return new Response(JSON.stringify({
      success: true,
      data: {
        zipCode: lookupResult.data!.zipCode,
        redirectUrl: lookupResult.data!.redirectUrl,
        cityName: lookupResult.data!.cityName,
        marketStatus: lookupResult.data!.marketStatus
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=600' // Cache for 10 minutes (faster routing)
      }
    });

  } catch (error) {
    console.error('[API] ZIP lookup error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'API_ERROR',
        message: 'Internal server error during ZIP lookup'
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

// Handle CORS for GET requests
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