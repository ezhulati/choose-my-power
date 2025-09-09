// T033: POST /api/analytics/filter-interaction endpoint
// User interaction analytics for filter optimization and UX insights (FR-014)

import type { APIRoute } from 'astro';

// Rate limiting and security
const MAX_REQUESTS_PER_MINUTE = 120; // Higher limit for analytics
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Analytics data types
interface FilterInteractionData {
  sessionId: string;
  timestamp: number;
  userId?: string;
  city: string;
  state: string;
  interactionType: 'filter_change' | 'filter_clear' | 'sort_change' | 'view_change' | 'plan_compare' | 'plan_select';
  filterName?: string;
  filterValue?: string | number | boolean;
  previousValue?: string | number | boolean;
  resultCount: number;
  responseTime: number;
  userAgent?: string;
  referrer?: string;
  viewport?: {
    width: number;
    height: number;
  };
  metadata?: Record<string, any>;
}

interface AnalyticsResponse {
  success: boolean;
  message?: string;
  sessionId: string;
  recorded: boolean;
  requestId: string;
  responseTime: number;
  error?: string;
  details?: string;
}

// Simple in-memory storage for analytics (production should use database/external service)
const analyticsBuffer: FilterInteractionData[] = [];
const BUFFER_SIZE = 1000;
const FLUSH_INTERVAL = 30000; // 30 seconds

export const POST: APIRoute = async ({ request }) => {
  const startTime = performance.now();
  const requestId = generateRequestId();
  
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.headers.get('cf-connecting-ip') ||
                     'unknown';
    
    const rateLimitResult = checkRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded for analytics',
          retryAfter: rateLimitResult.retryAfter,
          sessionId: 'rate-limited',
          recorded: false,
          requestId,
          responseTime: Math.round(performance.now() - startTime)
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter.toString(),
            'X-RateLimit-Limit': MAX_REQUESTS_PER_MINUTE.toString(),
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }

    // Parse request body
    let requestData: any;
    try {
      requestData = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
          sessionId: 'invalid-json',
          recorded: false,
          requestId,
          responseTime: Math.round(performance.now() - startTime)
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate required fields
    const validationResult = validateInteractionData(requestData);
    if (!validationResult.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid interaction data',
          details: validationResult.errors,
          sessionId: requestData.sessionId || 'invalid',
          recorded: false,
          requestId,
          responseTime: Math.round(performance.now() - startTime)
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Enrich with server-side data
    const interactionData: FilterInteractionData = {
      ...requestData,
      timestamp: Date.now(),
      userAgent: request.headers.get('user-agent') || undefined,
      referrer: request.headers.get('referer') || undefined,
      // Sanitize and validate data
      city: sanitizeString(requestData.city),
      state: sanitizeString(requestData.state),
      sessionId: sanitizeString(requestData.sessionId),
      userId: requestData.userId ? sanitizeString(requestData.userId) : undefined,
      resultCount: Math.max(0, parseInt(requestData.resultCount, 10) || 0),
      responseTime: Math.max(0, parseFloat(requestData.responseTime) || 0)
    };

    // Store interaction data
    const recorded = recordInteraction(interactionData);
    
    // Generate response
    const response: AnalyticsResponse = {
      success: true,
      message: recorded ? 'Interaction recorded successfully' : 'Interaction queued for processing',
      sessionId: interactionData.sessionId,
      recorded,
      requestId,
      responseTime: Math.round(performance.now() - startTime)
    };

    // Set response headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Response-Time': `${response.responseTime}ms`,
      'X-Request-ID': requestId,
      'X-RateLimit-Limit': MAX_REQUESTS_PER_MINUTE.toString(),
      'X-RateLimit-Remaining': (MAX_REQUESTS_PER_MINUTE - rateLimitResult.currentCount).toString()
    };

    // Add privacy headers
    headers['X-Analytics-Privacy'] = 'anonymized';
    headers['X-Data-Retention'] = '7-days';

    return new Response(JSON.stringify(response), {
      status: 201,
      headers
    });

  } catch (error) {
    console.error('[/api/analytics/filter-interaction] Unexpected error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        sessionId: 'error',
        recorded: false,
        requestId,
        responseTime: Math.round(performance.now() - startTime),
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'X-Response-Time': `${Math.round(performance.now() - startTime)}ms`
        }
      }
    );
  }
};

/**
 * Validate interaction data structure and required fields
 */
function validateInteractionData(data: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!data.sessionId || typeof data.sessionId !== 'string') {
    errors.push('sessionId is required and must be a string');
  }

  if (!data.city || typeof data.city !== 'string') {
    errors.push('city is required and must be a string');
  }

  if (!data.state || typeof data.state !== 'string') {
    errors.push('state is required and must be a string');
  }

  if (!data.interactionType || typeof data.interactionType !== 'string') {
    errors.push('interactionType is required and must be a string');
  }

  // Validate interaction type
  const validTypes = ['filter_change', 'filter_clear', 'sort_change', 'view_change', 'plan_compare', 'plan_select'];
  if (data.interactionType && !validTypes.includes(data.interactionType)) {
    errors.push(`interactionType must be one of: ${validTypes.join(', ')}`);
  }

  // Validate optional numeric fields
  if (data.resultCount !== undefined && (!Number.isInteger(data.resultCount) || data.resultCount < 0)) {
    errors.push('resultCount must be a non-negative integer');
  }

  if (data.responseTime !== undefined && (typeof data.responseTime !== 'number' || data.responseTime < 0)) {
    errors.push('responseTime must be a non-negative number');
  }

  // Validate viewport if provided
  if (data.viewport) {
    if (!Number.isInteger(data.viewport.width) || data.viewport.width <= 0) {
      errors.push('viewport.width must be a positive integer');
    }
    if (!Number.isInteger(data.viewport.height) || data.viewport.height <= 0) {
      errors.push('viewport.height must be a positive integer');
    }
  }

  // Validate session ID format (basic security check)
  if (data.sessionId && data.sessionId.length > 100) {
    errors.push('sessionId too long (max 100 characters)');
  }

  // Validate city/state format
  if (data.city && (data.city.length < 2 || data.city.length > 50)) {
    errors.push('city must be between 2-50 characters');
  }

  if (data.state && (data.state.length < 2 || data.state.length > 20)) {
    errors.push('state must be between 2-20 characters');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Sanitize string input for security
 */
function sanitizeString(input: any): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>"\';]/g, '') // Remove potentially dangerous characters
    .substring(0, 200); // Limit length
}

/**
 * Record interaction data in buffer
 */
function recordInteraction(data: FilterInteractionData): boolean {
  try {
    // Add to buffer
    analyticsBuffer.push(data);
    
    // Maintain buffer size
    if (analyticsBuffer.length > BUFFER_SIZE) {
      analyticsBuffer.splice(0, analyticsBuffer.length - BUFFER_SIZE);
    }
    
    // Log interesting interactions in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Filter interaction:', {
        type: data.interactionType,
        filter: data.filterName,
        value: data.filterValue,
        results: data.resultCount,
        responseTime: data.responseTime
      });
    }
    
    return true;
  } catch (error) {
    console.error('[Analytics] Failed to record interaction:', error);
    return false;
  }
}

/**
 * Rate limiting check
 */
function checkRateLimit(clientIP: string): {
  allowed: boolean;
  currentCount: number;
  retryAfter: number;
} {
  const now = Date.now();
  const windowStart = Math.floor(now / 60000) * 60000;
  
  const current = requestCounts.get(clientIP);
  
  if (!current || current.resetTime <= now) {
    requestCounts.set(clientIP, {
      count: 1,
      resetTime: windowStart + 60000
    });
    
    return { allowed: true, currentCount: 1, retryAfter: 0 };
  }
  
  if (current.count >= MAX_REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      currentCount: current.count,
      retryAfter: Math.ceil((current.resetTime - now) / 1000)
    };
  }
  
  current.count++;
  requestCounts.set(clientIP, current);
  
  return { allowed: true, currentCount: current.count, retryAfter: 0 };
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `ana_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Flush analytics buffer to external service (placeholder)
 */
function flushAnalyticsBuffer(): void {
  if (analyticsBuffer.length === 0) return;
  
  // In production, this would send data to analytics service
  // For now, we just log summary statistics
  const interactions = analyticsBuffer.splice(0);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] Flushing ${interactions.length} interactions`);
    
    // Generate summary statistics
    const stats = interactions.reduce((acc, interaction) => {
      const type = interaction.interactionType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('[Analytics] Interaction summary:', stats);
  }
  
  // TODO: Implement actual analytics service integration
  // Examples: Google Analytics, Mixpanel, PostHog, custom database
}

/**
 * Get analytics summary (for monitoring/debugging)
 */
export function getAnalyticsSummary(): {
  bufferSize: number;
  totalRequests: number;
  recentInteractions: number;
} {
  const recentThreshold = Date.now() - 300000; // 5 minutes ago
  const recentCount = analyticsBuffer.filter(i => i.timestamp > recentThreshold).length;
  
  return {
    bufferSize: analyticsBuffer.length,
    totalRequests: requestCounts.size,
    recentInteractions: recentCount
  };
}

// Periodic cleanup of rate limiting and analytics buffer
setInterval(() => {
  const now = Date.now();
  
  // Clean rate limiting entries
  for (const [ip, data] of requestCounts.entries()) {
    if (data.resetTime <= now) {
      requestCounts.delete(ip);
    }
  }
  
  // Flush analytics buffer periodically
  flushAnalyticsBuffer();
}, FLUSH_INTERVAL);

// Clean old analytics data (keep only last 7 days)
setInterval(() => {
  const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
  const beforeCount = analyticsBuffer.length;
  
  // Remove old entries
  for (let i = analyticsBuffer.length - 1; i >= 0; i--) {
    if (analyticsBuffer[i].timestamp < cutoffTime) {
      analyticsBuffer.splice(i, 1);
    }
  }
  
  const removedCount = beforeCount - analyticsBuffer.length;
  if (removedCount > 0 && process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] Cleaned ${removedCount} old analytics entries`);
  }
}, 60 * 60 * 1000); // Run every hour