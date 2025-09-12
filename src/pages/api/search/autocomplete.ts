/**
 * Autocomplete API Endpoint
 * GET /api/search/autocomplete?q=query&type=all&limit=8
 * Fast autocomplete suggestions for search queries
 */

import type { APIRoute } from 'astro';
import { searchService, type SearchResult } from '../../../lib/api/search-service';

interface AutocompleteResponse {
  success: boolean;
  query: string;
  suggestions: SearchResult[];
  responseTime: number;
  error?: string;
}

export const GET: APIRoute = async ({ request, url, clientAddress }) => {
  const startTime = Date.now();
  
  try {
    // Extract query parameters
    const searchParams = url.searchParams;
    const query = searchParams.get('q')?.trim();
    const type = (searchParams.get('type') || 'all') as 'city' | 'provider' | 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20); // Max 20 suggestions

    // Validate query
    if (!query) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Query parameter "q" is required',
        query: '',
        suggestions: [],
        responseTime: Date.now() - startTime
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Skip very short queries to avoid noise
    if (query.length < 2) {
      return new Response(JSON.stringify({
        success: true,
        query,
        suggestions: [],
        responseTime: Date.now() - startTime
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        }
      });
    }

    // Get autocomplete suggestions
    const suggestions = await searchService.getAutocompleteSuggestions(query, type, limit);

    // Log API metrics
    await logApiMetrics({
      endpoint: '/api/search/autocomplete',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      cacheHit: false,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: clientAddress || 'unknown',
    });

    const response: AutocompleteResponse = {
      success: true,
      query,
      suggestions,
      responseTime: Date.now() - startTime,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'X-Response-Time': `${Date.now() - startTime}ms`,
      }
    });

  } catch (error) {
    console.error('Autocomplete API error:', error);

    // Log error metrics
    await logApiMetrics({
      endpoint: '/api/search/autocomplete',
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      cacheHit: false,
      errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
    });

    return new Response(JSON.stringify({
      success: false,
      error: 'Autocomplete service temporarily unavailable',
      query: '',
      suggestions: [],
      responseTime: Date.now() - startTime,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Log API metrics for monitoring
 */
async function logApiMetrics(metrics: {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  cacheHit: boolean;
  errorType?: string;
  userAgent?: string;
  ipAddress?: string;
}): Promise<void> {
  try {
    console.warn('API Metrics:', {
      timestamp: new Date().toISOString(),
      ...metrics
    });
  } catch (error) {
    console.error('Failed to log API metrics:', error);
  }
}