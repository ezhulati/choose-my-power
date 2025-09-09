// ZIP validation API endpoint - POST /api/zip/validate
// Feature: Add Comprehensive ZIP Code Lookup Forms to City Pages

import type { APIRoute } from 'astro';
import { zipCoverageOrchestrator } from '../../../lib/services/zip-coverage-orchestrator';
import { analyticsService } from '../../../lib/services/analytics-service';
import { 
  validateZIPRequest, 
  createValidationError, 
  createZipFormatError,
  createRateLimitError
} from '../../../lib/validation/zip-schemas';
import type { ZIPValidationRequest } from '../../../types/zip-validation';

// Rate limiting (simple in-memory - in production use Redis)
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds

function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const clientLimit = rateLimits.get(ip);
  
  if (!clientLimit || now > clientLimit.resetTime) {
    // New client or reset period passed
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
    // Check rate limiting
    const clientIP = clientAddress || 'unknown';
    const rateLimitCheck = checkRateLimit(clientIP);
    
    if (!rateLimitCheck.allowed) {
      console.log(`[ZIP Validate API] Rate limit exceeded for ${clientIP}`);
      return new Response(
        JSON.stringify(createRateLimitError()),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      );
    }

    // Parse and validate request body
    let requestData: ZIPValidationRequest;
    try {
      const body = await request.json();
      requestData = validateZIPRequest(body);
    } catch (error) {
      console.error('[ZIP Validate API] Request validation error:', error);
      
      return new Response(
        JSON.stringify(createValidationError(
          'INVALID_FORMAT',
          'Invalid request format. Required fields: zipCode, citySlug',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        )),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate ZIP code format specifically
    if (!/^\d{5}$/.test(requestData.zipCode)) {
      return new Response(
        JSON.stringify(createZipFormatError(requestData.zipCode)),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Process validation through enhanced orchestrator
    const result = await zipCoverageOrchestrator.validateZIP(requestData.zipCode, {
      updateCoverage: requestData.validateTerritory !== false,
      trackAnalytics: true,
      sources: ['ercot', 'puct', 'oncor'],
      enableFallback: true,
      requireMultipleSources: false
    });

    // Convert to expected response format for backward compatibility
    const legacyResponse = {
      isValid: result.isValid,
      zipCode: result.zipCode,
      city: result.cityName,
      state: 'Texas',
      county: result.county,
      tdspTerritory: result.tdspName,
      isDeregulated: result.serviceType === 'deregulated',
      planCount: result.planCount,
      hasActivePlans: (result.planCount || 0) > 0,
      validationTime: result.processingTime,
      errorCode: result.error ? 'VALIDATION_FAILED' : undefined,
      errorMessage: result.error,
      confidence: result.confidence,
      source: result.source,
      lastValidated: result.lastValidated
    };
    
    // Log successful validation
    const processingTime = Date.now() - startTime;
    console.log(`[ZIP Validate API] Processed ${requestData.zipCode} for ${requestData.citySlug} in ${processingTime}ms`);
    
    // Return appropriate status based on validation result
    const statusCode = result.isValid ? 200 : 422; // 422 for validation failure
    
    return new Response(
      JSON.stringify(legacyResponse),
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': result.isValid ? 'public, max-age=900' : 'no-cache', // Cache valid results for 15 minutes
          'X-Response-Time': `${processingTime}ms`,
          'X-Confidence-Score': `${result.confidence || 0}`,
          'X-Data-Source': result.source || 'unknown'
        }
      }
    );

  } catch (error) {
    console.error('[ZIP Validate API] Internal server error:', error);
    
    return new Response(
      JSON.stringify(createValidationError(
        'VALIDATION_FAILED',
        'Internal server error during ZIP code validation',
        { 
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      )),
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
    JSON.stringify(createValidationError(
      'INVALID_FORMAT',
      'Method not allowed. Use POST to validate ZIP codes.'
    )),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

export const PUT: APIRoute = async () => {
  return new Response(
    JSON.stringify(createValidationError(
      'INVALID_FORMAT',
      'Method not allowed. Use POST to validate ZIP codes.'
    )),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

export const DELETE: APIRoute = async () => {
  return new Response(
    JSON.stringify(createValidationError(
      'INVALID_FORMAT',
      'Method not allowed. Use POST to validate ZIP codes.'
    )),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};