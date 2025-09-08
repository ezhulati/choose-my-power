// Analytics tracking API endpoint - POST /api/analytics/form-interaction
// Feature: Add Comprehensive ZIP Code Lookup Forms to City Pages

import type { APIRoute } from 'astro';
import { analyticsService } from '../../../lib/services/analytics-service';
import { validateFormInteractionRequest, createValidationError } from '../../../lib/validation/zip-schemas';
import type { FormInteractionRequest } from '../../../types/zip-validation';

// Rate limiting for analytics (more permissive than validation)
const analyticsRateLimits = new Map<string, { count: number; resetTime: number }>();
const ANALYTICS_RATE_LIMIT = 100; // requests per hour
const ANALYTICS_RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkAnalyticsRateLimit(ip: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const clientLimit = analyticsRateLimits.get(ip);
  
  if (!clientLimit || now > clientLimit.resetTime) {
    // New client or reset period passed
    analyticsRateLimits.set(ip, { count: 1, resetTime: now + ANALYTICS_RATE_WINDOW });
    return { allowed: true };
  }
  
  if (clientLimit.count >= ANALYTICS_RATE_LIMIT) {
    return { allowed: false, resetTime: clientLimit.resetTime };
  }
  
  clientLimit.count++;
  return { allowed: true };
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const startTime = Date.now();
  
  try {
    // Check rate limiting (more permissive for analytics)
    const clientIP = clientAddress || 'unknown';
    const rateLimitCheck = checkAnalyticsRateLimit(clientIP);
    
    if (!rateLimitCheck.allowed) {
      console.log(`[Analytics API] Rate limit exceeded for ${clientIP}`);
      return new Response(
        JSON.stringify({
          error: 'RATE_LIMITED',
          message: 'Too many analytics requests. Please reduce request frequency.',
          retryAfter: Math.ceil((rateLimitCheck.resetTime! - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '3600' // 1 hour
          }
        }
      );
    }

    // Parse and validate request body
    let interactionData: FormInteractionRequest;
    try {
      const body = await request.json();
      
      // Add timestamp if not provided
      if (!body.timestamp) {
        body.timestamp = new Date().toISOString();
      }
      
      interactionData = validateFormInteractionRequest(body);
    } catch (error) {
      console.error('[Analytics API] Request validation error:', error);
      
      return new Response(
        JSON.stringify(createValidationError(
          'INVALID_FORMAT',
          'Invalid analytics request format',
          { 
            error: error instanceof Error ? error.message : 'Unknown validation error',
            requiredFields: ['zipCode', 'cityPage', 'action', 'duration', 'deviceType', 'success']
          }
        )),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Track the interaction asynchronously (don't wait for completion)
    const trackingPromise = analyticsService.trackFormInteraction(interactionData);
    
    // Don't await - respond immediately for best UX
    trackingPromise.catch(error => {
      console.error('[Analytics API] Async tracking error:', error);
    });

    const processingTime = Date.now() - startTime;
    
    // Respond immediately with success
    return new Response(
      JSON.stringify({
        success: true
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Time': `${processingTime}ms`
        }
      }
    );

  } catch (error) {
    console.error('[Analytics API] Internal server error:', error);
    
    // For analytics, we don't want to fail user operations
    // Return success even if analytics tracking fails
    return new Response(
      JSON.stringify({
        success: true,
        warning: 'Analytics tracking may have failed, but your request was processed'
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// GET endpoint for retrieving analytics (administrative use)
export const GET: APIRoute = async ({ url }) => {
  try {
    const params = new URLSearchParams(url.search);
    const citySlug = params.get('citySlug');
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');
    
    // Basic authentication check (in production, use proper auth)
    const authHeader = url.searchParams.get('auth');
    if (authHeader !== 'admin-token') {
      return new Response(
        JSON.stringify(createValidationError(
          'RATE_LIMITED',
          'Unauthorized access to analytics data'
        )),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    let dateRange: [Date, Date] | undefined;
    if (startDate && endDate) {
      dateRange = [new Date(startDate), new Date(endDate)];
    }

    if (citySlug) {
      // Get metrics for specific city
      const metrics = await analyticsService.getInteractionMetrics(citySlug, dateRange);
      return new Response(JSON.stringify(metrics), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Get overall metrics
      const overallMetrics = await analyticsService.getInteractionMetrics('', dateRange);
      return new Response(JSON.stringify(overallMetrics), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('[Analytics API] Error retrieving metrics:', error);
    return new Response(
      JSON.stringify(createValidationError(
        'VALIDATION_FAILED',
        'Error retrieving analytics data'
      )),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Handle unsupported methods
export const PUT: APIRoute = async () => {
  return new Response(
    JSON.stringify(createValidationError(
      'INVALID_FORMAT',
      'Method not allowed. Use POST to track interactions or GET to retrieve analytics.'
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
      'Method not allowed. Use POST to track interactions or GET to retrieve analytics.'
    )),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};