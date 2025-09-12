/**
 * Analytics Dashboard API Endpoint
 * GET /api/analytics/dashboard?timeframe=week
 * Provides comprehensive analytics data for the admin dashboard
 */

import type { APIRoute } from 'astro';
import { analyticsService } from '../../../lib/api/analytics-service';
import { searchService } from '../../../lib/api/search-service';
import { leadManagementService } from '../../../lib/api/lead-management';

interface DashboardRequest {
  timeframe: 'day' | 'week' | 'month';
  metrics?: string[]; // Optional filter for specific metrics
}

interface DashboardResponse {
  success: boolean;
  timeframe: string;
  data: {
    overview: {
      totalVisitors: number;
      totalSearches: number;
      totalLeads: number;
      conversionRate: number;
      averageSessionDuration: number;
      bounceRate: number;
    };
    realTime: {
      activeUsers: number;
      currentSearches: number;
      recentConversions: number;
      systemHealth: 'healthy' | 'warning' | 'critical';
      alerts: Array<{ type: string; message: string; severity: string }>;
    };
    funnel: Array<{
      step: string;
      users: number;
      conversionRate: number;
      dropOffRate: number;
    }>;
    performance: {
      avgResponseTime: number;
      p95ResponseTime: number;
      p99ResponseTime: number;
      errorRate: number;
      cacheHitRate: number;
      totalRequests: number;
      slowQueries: number;
    };
    topContent: {
      pages: Array<{ page: string; views: number; conversions: number }>;
      searches: Array<{ query: string; count: number; conversions: number }>;
      plans: Array<{ planId: string; views: number; comparisons: number }>;
    };
    trends: {
      traffic: Array<{ date: string; visits: number; conversions: number }>;
      searches: Array<{ date: string; searches: number; results: number }>;
      performance: Array<{ date: string; responseTime: number; errorRate: number }>;
    };
    geographic: {
      topCities: Array<{ city: string; users: number; conversions: number }>;
      topZones: Array<{ zone: string; users: number; conversions: number }>;
    };
    userBehavior: {
      avgPagesPerSession: number;
      avgSessionDuration: number;
      returnVisitorRate: number;
      mobileUsageRate: number;
    };
    businessMetrics: {
      totalLeads: number;
      qualifiedLeads: number;
      averageLeadScore: number;
      leadsBySource: Record<string, number>;
      leadsByStatus: Record<string, number>;
    };
  };
  metadata: {
    generatedAt: string;
    dataFreshness: string;
    totalDataPoints: number;
  };
  error?: string;
}

export const GET: APIRoute = async ({ request, url, clientAddress }) => {
  const startTime = Date.now();
  
  try {
    // Extract and validate parameters
    const searchParams = url.searchParams;
    const timeframe = (searchParams.get('timeframe') || 'week') as 'day' | 'week' | 'month';
    const metricsParam = searchParams.get('metrics');
    const requestedMetrics = metricsParam ? metricsParam.split(',') : undefined;

    // Validate timeframe
    if (!['day', 'week', 'month'].includes(timeframe)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid timeframe. Must be "day", "week", or "month"'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check authorization (in production, implement proper auth)
    const authToken = request.headers.get('authorization');
    if (!isAuthorized(authToken)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized access to analytics dashboard'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Gather analytics data in parallel for performance
    const [
      dashboardData,
      searchAnalytics,
      leadAnalytics,
      systemHealth
    ] = await Promise.all([
      analyticsService.getDashboardData(timeframe),
      searchService.getSearchAnalytics(timeframe),
      leadManagementService.getLeadAnalytics(timeframe),
      getSystemHealthMetrics(),
    ]);

    // Combine all data into dashboard response
    const response: DashboardResponse = {
      success: true,
      timeframe,
      data: {
        overview: {
          totalVisitors: dashboardData.overview.totalLeads, // This would be actual visitor count
          totalSearches: searchAnalytics.totalSearches,
          totalLeads: dashboardData.overview.totalLeads,
          conversionRate: dashboardData.overview.conversionRate,
          averageSessionDuration: 0, // Would be calculated from session data
          bounceRate: 0, // Would be calculated from session data
        },
        realTime: dashboardData.realTime,
        funnel: dashboardData.funnel,
        performance: dashboardData.performance,
        topContent: {
          pages: dashboardData.overview.topPerformingPages,
          searches: dashboardData.overview.topSearchQueries,
          plans: dashboardData.overview.planPopularity,
        },
        trends: dashboardData.trends,
        geographic: {
          topCities: [], // Would be populated from geographic analytics
          topZones: [], // Would be populated from geographic analytics
        },
        userBehavior: {
          avgPagesPerSession: 0, // Would be calculated from session data
          avgSessionDuration: 0, // Would be calculated from session data
          returnVisitorRate: 0, // Would be calculated from visitor data
          mobileUsageRate: 0, // Would be calculated from user agent data
        },
        businessMetrics: {
          totalLeads: leadAnalytics.totalLeads,
          qualifiedLeads: leadAnalytics.qualifiedLeads,
          averageLeadScore: leadAnalytics.averageScore,
          leadsBySource: leadAnalytics.leadsBySource,
          leadsByStatus: leadAnalytics.leadsByStatus,
        },
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dataFreshness: 'real-time', // Could be calculated based on data age
        totalDataPoints: calculateDataPoints(dashboardData),
      },
    };

    // Filter metrics if requested
    if (requestedMetrics) {
      filterDashboardMetrics(response, requestedMetrics);
    }

    // Log API metrics
    await logApiMetrics({
      endpoint: '/api/analytics/dashboard',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      cacheHit: false,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: clientAddress || 'unknown',
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'X-Data-Points': calculateDataPoints(dashboardData).toString(),
      }
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);

    // Log error metrics
    await logApiMetrics({
      endpoint: '/api/analytics/dashboard',
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      cacheHit: false,
      errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
    });

    return new Response(JSON.stringify({
      success: false,
      error: 'Analytics service temporarily unavailable',
      timeframe: '',
      data: getEmptyDashboardData(),
      metadata: {
        generatedAt: new Date().toISOString(),
        dataFreshness: 'unavailable',
        totalDataPoints: 0,
      },
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Check if request is authorized
 */
function isAuthorized(authToken: string | null): boolean {
  // In production, implement proper JWT or API key validation
  if (process.env.NODE_ENV === 'development') {
    return true; // Allow all requests in development
  }
  
  if (!authToken) {
    return false;
  }

  // Check for valid API key or JWT token
  const validTokens = [
    process.env.ANALYTICS_API_KEY,
    process.env.ADMIN_API_KEY,
  ].filter(Boolean);

  return validTokens.some(token => authToken === `Bearer ${token}`);
}

/**
 * Get system health metrics
 */
async function getSystemHealthMetrics(): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}> {
  try {
    // In production, these would come from actual system monitoring
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
      cpuUsage: 0, // Would require additional monitoring
    };
  } catch (error) {
    return {
      status: 'critical',
      uptime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
    };
  }
}

/**
 * Calculate total data points in dashboard response
 */
function calculateDataPoints(dashboardData: Record<string, unknown>): number {
  let count = 0;
  
  count += dashboardData.funnel?.length || 0;
  count += dashboardData.overview?.topPerformingPages?.length || 0;
  count += dashboardData.overview?.topSearchQueries?.length || 0;
  count += dashboardData.overview?.planPopularity?.length || 0;
  count += dashboardData.trends?.trafficTrend?.length || 0;
  count += dashboardData.trends?.searchTrend?.length || 0;
  count += dashboardData.trends?.performanceTrend?.length || 0;
  
  return count;
}

/**
 * Filter dashboard metrics based on requested metrics
 */
function filterDashboardMetrics(response: DashboardResponse, requestedMetrics: string[]): void {
  const metricsMap: Record<string, keyof DashboardResponse['data']> = {
    'overview': 'overview',
    'realtime': 'realTime',
    'funnel': 'funnel',
    'performance': 'performance',
    'content': 'topContent',
    'trends': 'trends',
    'geographic': 'geographic',
    'behavior': 'userBehavior',
    'business': 'businessMetrics',
  };

  // Create new data object with only requested metrics
  const filteredData: Partial<DashboardResponse['data']> = {};
  
  requestedMetrics.forEach(metric => {
    const key = metricsMap[metric.toLowerCase()];
    if (key && response.data[key]) {
      (filteredData as Record<string, unknown>)[key] = response.data[key];
    }
  });

  response.data = filteredData as DashboardResponse['data'];
}

/**
 * Get empty dashboard data structure for error responses
 */
function getEmptyDashboardData(): DashboardResponse['data'] {
  return {
    overview: {
      totalVisitors: 0,
      totalSearches: 0,
      totalLeads: 0,
      conversionRate: 0,
      averageSessionDuration: 0,
      bounceRate: 0,
    },
    realTime: {
      activeUsers: 0,
      currentSearches: 0,
      recentConversions: 0,
      systemHealth: 'critical',
      alerts: [],
    },
    funnel: [],
    performance: {
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      cacheHitRate: 0,
      totalRequests: 0,
      slowQueries: 0,
    },
    topContent: {
      pages: [],
      searches: [],
      plans: [],
    },
    trends: {
      traffic: [],
      searches: [],
      performance: [],
    },
    geographic: {
      topCities: [],
      topZones: [],
    },
    userBehavior: {
      avgPagesPerSession: 0,
      avgSessionDuration: 0,
      returnVisitorRate: 0,
      mobileUsageRate: 0,
    },
    businessMetrics: {
      totalLeads: 0,
      qualifiedLeads: 0,
      averageLeadScore: 0,
      leadsBySource: {},
      leadsByStatus: {},
    },
  };
}

/**
 * Log API metrics
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