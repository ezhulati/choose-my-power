/**
 * Performance Logging API Endpoint
 * Task T036: Add comprehensive error logging
 * Phase 3.5 Polish & Validation: Server-side performance data collection
 */

import type { APIRoute } from 'astro';
import { logger } from '../../../lib/logging/logger';
import { performanceMonitor, type PerformanceReport, type CoreWebVitals } from '../../../lib/logging/performance-monitor';

interface PerformanceLogRequest {
  timestamp: string;
  pageUrl: string;
  userAgent: string;
  connectionType?: string;
  sessionId?: string;
  coreWebVitals: CoreWebVitals;
  customMetrics?: Array<{
    name: string;
    value: number;
    unit: string;
    tags?: Record<string, string>;
  }>;
  resourceTimings?: Array<{
    name: string;
    duration: number;
    transferSize: number;
    type: string;
  }>;
}

interface PerformanceLogResponse {
  success: boolean;
  reportId?: string;
  warnings?: string[];
  recommendations?: string[];
}

// Rate limiting for performance logging
const perfLogRateLimit = new Map<string, { count: number; resetTime: number }>();
const MAX_REPORTS_PER_MINUTE = 20;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

/**
 * Check rate limit for performance logging
 */
function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = identifier;
  const limit = perfLogRateLimit.get(key);

  if (!limit || now > limit.resetTime) {
    perfLogRateLimit.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return { allowed: true };
  }

  if (limit.count >= MAX_REPORTS_PER_MINUTE) {
    return {
      allowed: false,
      retryAfter: Math.ceil((limit.resetTime - now) / 1000)
    };
  }

  limit.count++;
  return { allowed: true };
}

/**
 * Validate performance log request
 */
function validatePerformanceLogRequest(body: any): PerformanceLogRequest | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const { timestamp, pageUrl, userAgent, coreWebVitals } = body;

  if (!timestamp || !pageUrl || !userAgent || !coreWebVitals) {
    return null;
  }

  // Validate timestamp
  const parsedTimestamp = new Date(timestamp);
  if (isNaN(parsedTimestamp.getTime())) {
    return null;
  }

  // Validate timestamp is not too old (> 10 minutes) or in future
  const now = Date.now();
  const timestampMs = parsedTimestamp.getTime();
  if (timestampMs > now + 60000 || timestampMs < now - 600000) {
    return null;
  }

  // Validate Core Web Vitals
  if (typeof coreWebVitals !== 'object') {
    return null;
  }

  const validatedCoreWebVitals: CoreWebVitals = {};
  
  // Validate individual metrics (must be positive numbers)
  if (typeof coreWebVitals.FCP === 'number' && coreWebVitals.FCP >= 0) {
    validatedCoreWebVitals.FCP = Math.min(coreWebVitals.FCP, 30000); // Cap at 30s
  }
  if (typeof coreWebVitals.LCP === 'number' && coreWebVitals.LCP >= 0) {
    validatedCoreWebVitals.LCP = Math.min(coreWebVitals.LCP, 30000);
  }
  if (typeof coreWebVitals.FID === 'number' && coreWebVitals.FID >= 0) {
    validatedCoreWebVitals.FID = Math.min(coreWebVitals.FID, 5000);
  }
  if (typeof coreWebVitals.CLS === 'number' && coreWebVitals.CLS >= 0) {
    validatedCoreWebVitals.CLS = Math.min(coreWebVitals.CLS, 5);
  }
  if (typeof coreWebVitals.TTFB === 'number' && coreWebVitals.TTFB >= 0) {
    validatedCoreWebVitals.TTFB = Math.min(coreWebVitals.TTFB, 10000);
  }
  if (typeof coreWebVitals.INP === 'number' && coreWebVitals.INP >= 0) {
    validatedCoreWebVitals.INP = Math.min(coreWebVitals.INP, 5000);
  }

  return {
    timestamp,
    pageUrl: String(pageUrl).slice(0, 1000),
    userAgent: String(userAgent).slice(0, 500),
    connectionType: body.connectionType ? String(body.connectionType).slice(0, 50) : undefined,
    sessionId: body.sessionId ? String(body.sessionId).slice(0, 100) : undefined,
    coreWebVitals: validatedCoreWebVitals,
    customMetrics: Array.isArray(body.customMetrics) 
      ? body.customMetrics.slice(0, 50).map((metric: any) => ({
          name: String(metric.name || 'unknown').slice(0, 100),
          value: typeof metric.value === 'number' ? metric.value : 0,
          unit: String(metric.unit || 'unknown').slice(0, 20),
          tags: metric.tags && typeof metric.tags === 'object' ? metric.tags : undefined
        }))
      : undefined,
    resourceTimings: Array.isArray(body.resourceTimings)
      ? body.resourceTimings.slice(0, 100).map((timing: any) => ({
          name: String(timing.name || 'unknown').slice(0, 500),
          duration: typeof timing.duration === 'number' ? timing.duration : 0,
          transferSize: typeof timing.transferSize === 'number' ? timing.transferSize : 0,
          type: String(timing.type || 'unknown').slice(0, 50)
        }))
      : undefined
  };
}

/**
 * Analyze performance data and generate warnings/recommendations
 */
function analyzePerformance(perfData: PerformanceLogRequest): { warnings: string[]; recommendations: string[] } {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Analyze Core Web Vitals
  const { coreWebVitals } = perfData;

  // First Contentful Paint analysis
  if (coreWebVitals.FCP) {
    if (coreWebVitals.FCP > 3000) {
      warnings.push('First Contentful Paint is slow (>3s)');
      recommendations.push('Optimize critical rendering path and reduce server response time');
    } else if (coreWebVitals.FCP > 1800) {
      recommendations.push('Consider optimizing FCP - current value could be improved');
    }
  }

  // Largest Contentful Paint analysis
  if (coreWebVitals.LCP) {
    if (coreWebVitals.LCP > 4000) {
      warnings.push('Largest Contentful Paint is poor (>4s)');
      recommendations.push('Optimize largest element loading, consider image optimization or lazy loading');
    } else if (coreWebVitals.LCP > 2500) {
      warnings.push('Largest Contentful Paint needs improvement (>2.5s)');
      recommendations.push('Preload critical resources and optimize largest content element');
    }
  }

  // First Input Delay analysis
  if (coreWebVitals.FID) {
    if (coreWebVitals.FID > 300) {
      warnings.push('First Input Delay is poor (>300ms)');
      recommendations.push('Reduce JavaScript execution time and break up long tasks');
    } else if (coreWebVitals.FID > 100) {
      recommendations.push('Consider optimizing JavaScript to improve First Input Delay');
    }
  }

  // Cumulative Layout Shift analysis
  if (coreWebVitals.CLS) {
    if (coreWebVitals.CLS > 0.25) {
      warnings.push('Cumulative Layout Shift is poor (>0.25)');
      recommendations.push('Add size attributes to media, avoid inserting content above existing content');
    } else if (coreWebVitals.CLS > 0.1) {
      recommendations.push('Monitor layout shift - consider adding size attributes to prevent shifts');
    }
  }

  // Time to First Byte analysis
  if (coreWebVitals.TTFB) {
    if (coreWebVitals.TTFB > 1800) {
      warnings.push('Time to First Byte is slow (>1.8s)');
      recommendations.push('Optimize server response time, consider CDN, and improve caching');
    } else if (coreWebVitals.TTFB > 800) {
      recommendations.push('TTFB could be improved - consider server optimization');
    }
  }

  // Interaction to Next Paint analysis
  if (coreWebVitals.INP) {
    if (coreWebVitals.INP > 500) {
      warnings.push('Interaction to Next Paint is poor (>500ms)');
      recommendations.push('Optimize JavaScript responsiveness and reduce main thread blocking');
    } else if (coreWebVitals.INP > 200) {
      recommendations.push('Consider optimizing interaction responsiveness');
    }
  }

  // Analyze custom metrics
  if (perfData.customMetrics) {
    perfData.customMetrics.forEach(metric => {
      if (metric.unit === 'ms') {
        if (metric.name.includes('api') && metric.value > 2000) {
          warnings.push(`Slow API call detected: ${metric.name} (${metric.value}ms)`);
          recommendations.push('Optimize API response time or implement caching');
        }
        if (metric.name.includes('render') && metric.value > 16) {
          warnings.push(`Slow component render: ${metric.name} (${metric.value}ms)`);
          recommendations.push('Optimize component rendering performance');
        }
      }
      if (metric.unit === 'bytes' && metric.value > 10000000) { // > 10MB
        warnings.push(`High memory usage detected: ${metric.name} (${(metric.value / 1024 / 1024).toFixed(1)}MB)`);
        recommendations.push('Investigate memory leaks and optimize memory usage');
      }
    });
  }

  // Analyze resource timings
  if (perfData.resourceTimings) {
    const slowResources = perfData.resourceTimings.filter(r => r.duration > 2000);
    const largeResources = perfData.resourceTimings.filter(r => r.transferSize > 500000); // > 500KB

    if (slowResources.length > 0) {
      warnings.push(`${slowResources.length} slow loading resource(s) detected (>2s)`);
      recommendations.push('Optimize slow loading resources or implement lazy loading');
    }

    if (largeResources.length > 0) {
      warnings.push(`${largeResources.length} large resource(s) detected (>500KB)`);
      recommendations.push('Compress large resources or implement progressive loading');
    }
  }

  return { warnings, recommendations };
}

/**
 * Store performance data
 */
async function storePerformanceData(perfData: PerformanceLogRequest): Promise<string> {
  // Generate unique report ID
  const reportId = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Log performance data to our system
  logger.info('Performance data received', undefined, {
    action: 'performance_data_logged',
    url: perfData.pageUrl,
    metadata: {
      reportId,
      clientTimestamp: perfData.timestamp,
      serverTimestamp: new Date().toISOString(),
      coreWebVitals: perfData.coreWebVitals,
      connectionType: perfData.connectionType,
      userAgent: perfData.userAgent.substring(0, 100), // Truncate for logging
      customMetricsCount: perfData.customMetrics?.length || 0,
      resourceTimingsCount: perfData.resourceTimings?.length || 0
    }
  });

  // Record individual Core Web Vitals metrics
  Object.entries(perfData.coreWebVitals).forEach(([metric, value]) => {
    if (value !== undefined) {
      performanceMonitor.recordMetric(`cwv_${metric.toLowerCase()}`, value, 'ms', {
        page: new URL(perfData.pageUrl).pathname,
        connection: perfData.connectionType || 'unknown'
      });
    }
  });

  // Record custom metrics
  if (perfData.customMetrics) {
    perfData.customMetrics.forEach(metric => {
      performanceMonitor.recordMetric(
        metric.name,
        metric.value,
        metric.unit as any,
        {
          ...metric.tags,
          page: new URL(perfData.pageUrl).pathname,
          source: 'client'
        }
      );
    });
  }

  return reportId;
}

/**
 * POST /api/logging/performance
 * Log client-side performance data
 */
export const POST: APIRoute = async ({ request }) => {
  const startTime = performance.now();
  
  try {
    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      logger.warn('Invalid JSON in performance log request', error, {
        action: 'perf_log_invalid_json',
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
    const perfData = validatePerformanceLogRequest(body);
    if (!perfData) {
      logger.warn('Invalid performance log request format', undefined, {
        action: 'perf_log_invalid_format',
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
    const sessionId = perfData.sessionId || 'anonymous';
    const identifier = `${clientIp}:${sessionId}`;

    // Check rate limit
    const rateLimitResult = checkRateLimit(identifier);
    if (!rateLimitResult.allowed) {
      logger.warn('Performance logging rate limit exceeded', undefined, {
        action: 'perf_log_rate_limited',
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

    // Store performance data
    const reportId = await storePerformanceData(perfData);

    // Analyze performance and generate recommendations
    const analysis = analyzePerformance(perfData);

    const duration = performance.now() - startTime;
    
    logger.info(`Performance report processed successfully: ${reportId}`, undefined, {
      action: 'perf_report_processed',
      url: request.url,
      metadata: {
        reportId,
        duration,
        clientIdentifier: identifier,
        warningsCount: analysis.warnings.length,
        recommendationsCount: analysis.recommendations.length,
        pageUrl: perfData.pageUrl
      }
    });

    const response: PerformanceLogResponse = {
      success: true,
      reportId,
      warnings: analysis.warnings.length > 0 ? analysis.warnings : undefined,
      recommendations: analysis.recommendations.length > 0 ? analysis.recommendations : undefined
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error('Failed to process performance log request', error as Error, {
      action: 'perf_log_processing_failed',
      url: request.url,
      metadata: { duration }
    });

    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * GET /api/logging/performance
 * Get performance statistics (development only)
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
    const page = searchParams.get('page');
    
    const performanceStats = performanceMonitor.getStats();
    const duration = performance.now() - startTime;
    
    logger.info('Performance statistics retrieved', undefined, {
      action: 'perf_stats_retrieved',
      url: request.url,
      metadata: {
        duration,
        format,
        page
      }
    });

    if (format === 'summary') {
      const summary = {
        coreWebVitals: performanceStats.coreWebVitals,
        totalMetrics: performanceStats.totalMetrics,
        recentMetrics: performanceStats.recentMetrics,
        averagePerformance: performanceStats.averages
      };
      
      return new Response(JSON.stringify(summary), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(performanceStats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error('Failed to retrieve performance statistics', error as Error, {
      action: 'perf_stats_failed',
      url: request.url,
      metadata: { duration }
    });

    return new Response(JSON.stringify({
      error: 'Failed to retrieve performance statistics'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};