/**
 * Comprehensive ZIP Validation API - POST /api/zip/validate-comprehensive
 * Enhanced endpoint with full ZIP coverage system integration
 * Provides detailed validation results, confidence scoring, and multi-source validation
 */

import type { APIRoute } from 'astro';
import { zipCoverageOrchestrator } from '../../../lib/services/zip-coverage-orchestrator';

// Rate limiting (simple in-memory - in production use Redis)
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // Higher limit for comprehensive endpoint
const RATE_WINDOW = 60 * 1000; // 1 minute

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

export const POST: APIRoute = async ({ request, clientAddress }) => {
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
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      );
    }

    // Parse request
    const body = await request.json();
    const { 
      zipCode, 
      options = {},
      includeAnalytics = false,
      updateCoverage = false
    } = body;

    // Basic validation
    if (!zipCode || typeof zipCode !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'zipCode is required and must be a string'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ZIP format validation
    if (!/^\d{5}$/.test(zipCode)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid ZIP code format. Must be 5 digits.',
          zipCode
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Comprehensive validation
    const validationResult = await zipCoverageOrchestrator.validateZIP(zipCode, {
      ...options,
      updateCoverage,
      trackAnalytics: includeAnalytics,
      sources: options.sources || ['ercot', 'puct', 'oncor'],
      requireMultipleSources: options.requireMultipleSources || false,
      enableFallback: options.enableFallback !== false,
      conflictResolution: options.conflictResolution || 'highest_confidence'
    });

    const processingTime = Date.now() - startTime;

    // Enhanced response format
    const response = {
      success: true,
      data: {
        validation: validationResult,
        metadata: {
          processingTime,
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          apiVersion: 'v2',
          timestamp: new Date().toISOString()
        }
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': validationResult.isValid ? 'public, max-age=1800' : 'no-cache', // 30 minutes for valid
          'X-Response-Time': `${processingTime}ms`,
          'X-Confidence-Score': `${validationResult.confidence || 0}`,
          'X-Data-Sources': (options.sources || ['ercot', 'puct', 'oncor']).join(','),
          'X-API-Version': 'v2'
        }
      }
    );

  } catch (error) {
    console.error('[ZIP Comprehensive API] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
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

// Bulk validation endpoint
export const PUT: APIRoute = async ({ request, clientAddress }) => {
  const startTime = Date.now();
  
  try {
    // Rate limiting (lower limit for bulk operations)
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

    // Parse bulk request
    const body = await request.json();
    const { 
      zipCodes, 
      options = {},
      batchSize = 10,
      includeAnalytics = false,
      improveCoverage = false
    } = body;

    // Validation
    if (!Array.isArray(zipCodes) || zipCodes.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'zipCodes must be a non-empty array'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (zipCodes.length > 100) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Maximum 100 ZIP codes per batch request'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Bulk validation
    const bulkResult = await zipCoverageOrchestrator.validateZIPsBulk(zipCodes, {
      batchSize: Math.min(batchSize, 25),
      includeAnalytics,
      improveCoverage
    });

    const processingTime = Date.now() - startTime;

    const response = {
      success: bulkResult.success,
      data: {
        summary: {
          totalRequested: zipCodes.length,
          processed: bulkResult.processed,
          errors: bulkResult.errors,
          processingTime: bulkResult.processingTime
        },
        details: bulkResult.details,
        metadata: {
          requestId: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          apiVersion: 'v2',
          timestamp: new Date().toISOString(),
          batchSize
        }
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        status: bulkResult.success ? 200 : 207, // 207 Multi-Status for partial success
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Time': `${processingTime}ms`,
          'X-Batch-Size': `${batchSize}`,
          'X-API-Version': 'v2'
        }
      }
    );

  } catch (error) {
    console.error('[ZIP Bulk API] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Bulk validation failed',
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
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Method not allowed. Use POST for single validation, PUT for bulk validation.',
      endpoints: {
        'POST /api/zip/validate-comprehensive': 'Single ZIP comprehensive validation',
        'PUT /api/zip/validate-comprehensive': 'Bulk ZIP validation (up to 100 ZIPs)'
      }
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

export const DELETE: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};