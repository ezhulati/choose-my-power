/**
 * Error Logging API Endpoint
 * Task T036: Add comprehensive error logging
 * Phase 3.5 Polish & Validation: Server-side error collection and aggregation
 */

import type { APIRoute } from 'astro';
import { logger } from '../../../lib/logging/logger';
import { errorTracker, type ErrorStats } from '../../../lib/logging/error-tracker';

interface ErrorLogRequest {
  timestamp: string;
  level: 'error' | 'fatal';
  message: string;
  stack?: string;
  context?: {
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    url?: string;
    component?: string;
    action?: string;
    metadata?: Record<string, unknown>;
  };
}

interface ErrorLogResponse {
  success: boolean;
  errorId?: string;
  userMessage?: string;
  retryAfter?: number;
  stats?: ErrorStats;
}

// Rate limiting for error logging
const errorLogRateLimit = new Map<string, { count: number; resetTime: number }>();
const MAX_ERRORS_PER_MINUTE = 50;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

/**
 * Check rate limit for error logging
 */
function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = identifier;
  const limit = errorLogRateLimit.get(key);

  if (!limit || now > limit.resetTime) {
    errorLogRateLimit.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return { allowed: true };
  }

  if (limit.count >= MAX_ERRORS_PER_MINUTE) {
    return {
      allowed: false,
      retryAfter: Math.ceil((limit.resetTime - now) / 1000)
    };
  }

  limit.count++;
  return { allowed: true };
}

/**
 * Validate error log request
 */
function validateErrorLogRequest(body: any): ErrorLogRequest | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const { timestamp, level, message, stack, context } = body;

  if (!timestamp || !level || !message) {
    return null;
  }

  if (!['error', 'fatal'].includes(level)) {
    return null;
  }

  // Validate timestamp
  const parsedTimestamp = new Date(timestamp);
  if (isNaN(parsedTimestamp.getTime())) {
    return null;
  }

  // Validate timestamp is not too old (> 5 minutes) or in future
  const now = Date.now();
  const timestampMs = parsedTimestamp.getTime();
  if (timestampMs > now + 60000 || timestampMs < now - 300000) {
    return null;
  }

  return {
    timestamp,
    level,
    message: String(message).slice(0, 1000), // Limit message length
    stack: stack ? String(stack).slice(0, 5000) : undefined, // Limit stack length
    context: context && typeof context === 'object' ? {
      userId: context.userId ? String(context.userId) : undefined,
      sessionId: context.sessionId ? String(context.sessionId) : undefined,
      userAgent: context.userAgent ? String(context.userAgent).slice(0, 500) : undefined,
      url: context.url ? String(context.url).slice(0, 1000) : undefined,
      component: context.component ? String(context.component).slice(0, 100) : undefined,
      action: context.action ? String(context.action).slice(0, 100) : undefined,
      metadata: context.metadata && typeof context.metadata === 'object' 
        ? context.metadata 
        : undefined
    } : undefined
  };
}

/**
 * Sanitize sensitive data from error logs
 */
function sanitizeErrorData(errorLog: ErrorLogRequest): ErrorLogRequest {
  const sanitized = { ...errorLog };

  // Remove potential sensitive data from message and stack
  const sensitivePatterns = [
    /password[s]?["\s]*[:=]["\s]*[^"\s]+/gi,
    /token[s]?["\s]*[:=]["\s]*[^"\s]+/gi,
    /api[_-]?key[s]?["\s]*[:=]["\s]*[^"\s]+/gi,
    /secret[s]?["\s]*[:=]["\s]*[^"\s]+/gi,
    /authorization["\s]*[:=]["\s]*[^"\s]+/gi,
    /bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, // Email addresses
  ];

  sensitivePatterns.forEach(pattern => {
    if (sanitized.message) {
      sanitized.message = sanitized.message.replace(pattern, '[REDACTED]');
    }
    if (sanitized.stack) {
      sanitized.stack = sanitized.stack.replace(pattern, '[REDACTED]');
    }
  });

  // Remove sensitive data from context metadata
  if (sanitized.context?.metadata) {
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization', 'key'];
    
    Object.keys(sanitized.context.metadata).forEach(key => {
      if (sensitiveKeys.some(sensitiveKey => 
        key.toLowerCase().includes(sensitiveKey.toLowerCase())
      )) {
        sanitized.context!.metadata![key] = '[REDACTED]';
      }
    });
  }

  return sanitized;
}

/**
 * Store error log in database/persistent storage
 */
async function storeErrorLog(errorLog: ErrorLogRequest): Promise<string> {
  // In a real implementation, this would save to database
  // For now, we'll generate a unique error ID
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Log to our internal system
  const error = errorLog.stack ? new Error(errorLog.message) : undefined;
  if (error && errorLog.stack) {
    error.stack = errorLog.stack;
  }

  const logMethod = errorLog.level === 'fatal' ? 'fatal' : 'error';
  logger[logMethod](`Client error logged: ${errorLog.message}`, error, {
    ...errorLog.context,
    action: 'client_error_logged',
    metadata: {
      ...errorLog.context?.metadata,
      clientTimestamp: errorLog.timestamp,
      errorId,
      serverTimestamp: new Date().toISOString()
    }
  });

  return errorId;
}

/**
 * POST /api/logging/errors
 * Log client-side errors
 */
export const POST: APIRoute = async ({ request }) => {
  const startTime = performance.now();
  
  try {
    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      logger.warn('Invalid JSON in error log request', error, {
        action: 'error_log_invalid_json',
        url: request.url
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON format'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate request
    const errorLog = validateErrorLogRequest(body);
    if (!errorLog) {
      logger.warn('Invalid error log request format', undefined, {
        action: 'error_log_invalid_format',
        url: request.url,
        metadata: { requestBody: body }
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request format'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get client identifier for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const sessionId = errorLog.context?.sessionId || 'anonymous';
    const identifier = `${clientIp}:${sessionId}`;

    // Check rate limit
    const rateLimitResult = checkRateLimit(identifier);
    if (!rateLimitResult.allowed) {
      logger.warn('Error logging rate limit exceeded', undefined, {
        action: 'error_log_rate_limited',
        url: request.url,
        metadata: {
          identifier,
          retryAfter: rateLimitResult.retryAfter
        }
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter
      }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
        }
      });
    }

    // Sanitize sensitive data
    const sanitizedErrorLog = sanitizeErrorData(errorLog);

    // Store error log
    const errorId = await storeErrorLog(sanitizedErrorLog);

    // Track error for pattern analysis
    const error = sanitizedErrorLog.stack ? new Error(sanitizedErrorLog.message) : sanitizedErrorLog.message;
    const trackedErrorKey = errorTracker.trackError(error, sanitizedErrorLog.context);

    // Get user-friendly message
    const userMessage = errorTracker.getUserMessage(error);

    // Get current error stats for monitoring
    const errorStats = errorTracker.getErrorStats();

    const duration = performance.now() - startTime;
    
    logger.info(`Error log processed successfully: ${errorId}`, undefined, {
      action: 'error_log_processed',
      url: request.url,
      metadata: {
        errorId,
        trackedErrorKey,
        duration,
        clientIdentifier: identifier,
        errorLevel: sanitizedErrorLog.level
      }
    });

    const response: ErrorLogResponse = {
      success: true,
      errorId,
      userMessage,
      stats: process.env.NODE_ENV === 'development' ? errorStats : undefined
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error('Failed to process error log request', error as Error, {
      action: 'error_log_processing_failed',
      url: request.url,
      metadata: { duration }
    });

    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      userMessage: 'Unable to log error. Please try again later.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * GET /api/logging/errors
 * Get error statistics (development only)
 */
export const GET: APIRoute = async ({ request, url }) => {
  const startTime = performance.now();
  
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return new Response(JSON.stringify({
        error: 'Not available in production'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const searchParams = new URLSearchParams(url.search);
    const format = searchParams.get('format') || 'json';
    
    const errorStats = errorTracker.getErrorStats();
    const duration = performance.now() - startTime;
    
    logger.info('Error statistics retrieved', undefined, {
      action: 'error_stats_retrieved',
      url: request.url,
      metadata: {
        duration,
        totalErrors: errorStats.total,
        format
      }
    });

    if (format === 'summary') {
      const summary = {
        totalErrors: errorStats.total,
        errorsByCategory: errorStats.byCategory,
        errorsBySeverity: errorStats.bySeverity,
        recentErrorsCount: errorStats.recentErrors.length
      };
      
      return new Response(JSON.stringify(summary), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(errorStats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error('Failed to retrieve error statistics', error as Error, {
      action: 'error_stats_failed',
      url: request.url,
      metadata: { duration }
    });

    return new Response(JSON.stringify({
      error: 'Failed to retrieve error statistics'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};