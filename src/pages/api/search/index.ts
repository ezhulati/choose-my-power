/**
 * Search API Endpoint
 * GET /api/search?q=query&type=all&limit=20
 * Comprehensive search across cities, providers, and plan features
 */

import type { APIRoute } from 'astro';
import { searchService, type SearchResult, type SearchSuggestion } from '../../../lib/api/search-service';
import { analyticsService } from '../../../lib/api/analytics-service';

interface SearchResponse {
  success: boolean;
  query: string;
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  totalResults: number;
  searchTime: number;
  filters?: {
    type: string;
    limit: number;
    appliedFilters: Record<string, any>;
  };
  error?: string;
}

export const GET: APIRoute = async ({ request, url, clientAddress }) => {
  const startTime = Date.now();
  
  try {
    // Extract query parameters
    const searchParams = url.searchParams;
    const query = searchParams.get('q')?.trim();
    const type = (searchParams.get('type') || 'all') as 'all' | 'city' | 'provider' | 'plan_feature';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 results
    const sessionId = searchParams.get('session_id');
    
    // Filters
    const filters = {
      zone: searchParams.get('zone'),
      minPlans: searchParams.get('min_plans') ? parseInt(searchParams.get('min_plans')!) : undefined,
      maxRate: searchParams.get('max_rate') ? parseFloat(searchParams.get('max_rate')!) : undefined,
      greenEnergyOnly: searchParams.get('green_energy') === 'true',
    };

    // Validate query
    if (!query) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Query parameter "q" is required',
        query: '',
        results: [],
        suggestions: [],
        totalResults: 0,
        searchTime: 0
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (query.length < 2) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Query must be at least 2 characters long',
        query,
        results: [],
        suggestions: [],
        totalResults: 0,
        searchTime: 0
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (query.length > 100) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Query must be less than 100 characters',
        query,
        results: [],
        suggestions: [],
        totalResults: 0,
        searchTime: 0
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Perform search
    const searchResults = await searchService.search(query, {
      type,
      limit,
      filters: Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null)
      ),
      sessionId: sessionId || undefined,
    });

    // Track analytics
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = clientAddress || 'unknown';
    
    if (sessionId) {
      await analyticsService.trackSearch(sessionId, query, searchResults.totalResults, {
        type,
        filters,
        userAgent,
        ipAddress,
        searchTime: searchResults.searchTime,
      });
    }

    // Log API metrics
    await logApiMetrics({
      endpoint: '/api/search',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      cacheHit: false, // Search service handles its own caching
      userAgent,
      ipAddress,
    });

    const response: SearchResponse = {
      success: true,
      query,
      results: searchResults.results,
      suggestions: searchResults.suggestions,
      totalResults: searchResults.totalResults,
      searchTime: searchResults.searchTime,
      filters: {
        type,
        limit,
        appliedFilters: filters,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'X-Search-Time': `${searchResults.searchTime}ms`,
        'X-Total-Results': searchResults.totalResults.toString(),
      }
    });

  } catch (error) {
    console.error('Search API error:', error);

    // Log error metrics
    await logApiMetrics({
      endpoint: '/api/search',
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      cacheHit: false,
      errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
    });

    return new Response(JSON.stringify({
      success: false,
      error: 'Search service temporarily unavailable',
      query: '',
      results: [],
      suggestions: [],
      totalResults: 0,
      searchTime: Date.now() - startTime,
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
    console.log('API Metrics:', {
      timestamp: new Date().toISOString(),
      ...metrics
    });
  } catch (error) {
    console.error('Failed to log API metrics:', error);
  }
}