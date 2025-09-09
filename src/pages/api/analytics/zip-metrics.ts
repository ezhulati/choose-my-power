/**
 * ZIP Analytics API - GET /api/analytics/zip-metrics
 * Provides comprehensive ZIP validation analytics and metrics
 * Shows validation trends, error patterns, and performance data
 */

import type { APIRoute } from 'astro';
import { analyticsService } from '../../../lib/services/analytics-service';

// Rate limiting
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): { allowed: boolean } {
  const now = Date.now();
  const clientLimit = rateLimits.get(ip);
  
  if (!clientLimit || now > clientLimit.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true };
  }
  
  if (clientLimit.count >= RATE_LIMIT) {
    return { allowed: false };
  }
  
  clientLimit.count++;
  return { allowed: true };
}

function parseDateRange(dateRangeParam: string | null): [Date, Date] | undefined {
  if (!dateRangeParam) return undefined;
  
  try {
    const [start, end] = dateRangeParam.split(',');
    return [new Date(start), new Date(end)];
  } catch {
    return undefined;
  }
}

export const GET: APIRoute = async ({ request, clientAddress }) => {
  const startTime = Date.now();

  try {
    // Rate limiting
    const clientIP = clientAddress || 'unknown';
    const rateLimitCheck = checkRateLimit(clientIP);
    
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded'
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const metricType = url.searchParams.get('type') || 'overview';
    const dateRangeParam = url.searchParams.get('dateRange');
    const includeDetails = url.searchParams.get('details') === 'true';
    const citySlug = url.searchParams.get('city');

    const dateRange = parseDateRange(dateRangeParam);

    let responseData;

    switch (metricType) {
      case 'overview':
        // General ZIP validation overview
        const [dbMetrics, coverageAnalytics, inMemoryMetrics] = await Promise.all([
          analyticsService.getZIPValidationMetricsFromDB(dateRange),
          analyticsService.getZIPCoverageAnalytics(),
          analyticsService.getZIPValidationMetrics()
        ]);

        responseData = {
          overview: {
            totalValidations: dbMetrics.totalValidations || inMemoryMetrics.totalValidations,
            successRate: Math.round((dbMetrics.successRate || inMemoryMetrics.successRate) * 10000) / 100,
            avgResponseTime: Math.round(dbMetrics.averageTime || inMemoryMetrics.averageTime),
            avgConfidence: coverageAnalytics.coverageByTdsp.reduce(
              (sum, tdsp) => sum + tdsp.avgConfidence, 0
            ) / Math.max(coverageAnalytics.coverageByTdsp.length, 1)
          },
          coverage: {
            totalMappedZips: coverageAnalytics.totalMappedZips,
            tdspDistribution: coverageAnalytics.coverageByTdsp.map(tdsp => ({
              name: tdsp.tdsp,
              zipCount: tdsp.zipCount,
              confidence: tdsp.avgConfidence
            })),
            dataFreshness: {
              avgAgeInDays: coverageAnalytics.dataFreshness.avgAge,
              oldestMapping: coverageAnalytics.dataFreshness.oldest,
              newestMapping: coverageAnalytics.dataFreshness.newest
            }
          },
          quality: {
            recentValidations: coverageAnalytics.recentValidations,
            lowConfidenceZips: coverageAnalytics.lowConfidenceZips.length,
            confidenceDistribution: dbMetrics.confidenceDistribution
          },
          ...(includeDetails && {
            trends: {
              topSources: dbMetrics.topSources,
              topCities: dbMetrics.topCities,
              errorPatterns: inMemoryMetrics.topErrorCodes
            }
          })
        };
        break;

      case 'performance':
        // Performance-focused metrics
        const performanceMetrics = await analyticsService.getPerformanceMetrics(citySlug);
        
        responseData = {
          performance: {
            avgResponseTime: Math.round(performanceMetrics.averageResponseTime),
            slowInteractions: performanceMetrics.slowInteractions,
            mobile: {
              avgTime: Math.round(performanceMetrics.mobilePerformance.averageTime),
              slowCount: performanceMetrics.mobilePerformance.slowCount
            },
            desktop: {
              avgTime: Math.round(performanceMetrics.desktopPerformance.averageTime),
              slowCount: performanceMetrics.desktopPerformance.slowCount
            },
            recommendations: [
              ...(performanceMetrics.averageResponseTime > 2000 ? [
                'Average response time exceeds target - consider optimization'
              ] : []),
              ...(performanceMetrics.slowInteractions > 5 ? [
                'High number of slow interactions detected'
              ] : []),
              ...(performanceMetrics.mobilePerformance.averageTime > performanceMetrics.desktopPerformance.averageTime * 1.5 ? [
                'Mobile performance significantly slower than desktop'
              ] : [])
            ]
          }
        };
        break;

      case 'quality':
        // Data quality metrics
        const qualityMetrics = await analyticsService.getDataQualitySummary(24);
        const coverageData = await analyticsService.getZIPCoverageAnalytics();

        responseData = {
          dataQuality: {
            summary: {
              totalIssues: qualityMetrics.totalIssues,
              criticalIssues: qualityMetrics.criticalIssues,
              qualityScore: Math.max(0, 100 - qualityMetrics.totalIssues * 2)
            },
            issueBreakdown: {
              byType: qualityMetrics.issuesByType,
              bySeverity: qualityMetrics.issuesBySeverity
            },
            trends: qualityMetrics.recentTrends,
            coverage: {
              lowConfidenceZips: coverageData.lowConfidenceZips.length,
              staleDataPoints: coverageData.dataFreshness.avgAge > 30 ? 
                Math.floor(coverageData.dataFreshness.avgAge / 7) : 0
            }
          }
        };
        break;

      case 'usage':
        // Usage analytics
        const zipAnalytics = await analyticsService.getZipCodeAnalytics(dateRange);
        
        responseData = {
          usage: {
            zipLookups: {
              total: zipAnalytics.totalZipLookups,
              unique: zipAnalytics.uniqueZipCodes,
              invalidAttempts: zipAnalytics.invalidZipAttempts,
              crossCityRedirects: zipAnalytics.crossCityRedirects
            },
            popularZips: zipAnalytics.topZipCodes.slice(0, 10),
            patterns: {
              peakUsageDays: [], // Would be calculated from real usage data
              commonErrors: zipAnalytics.invalidZipAttempts,
              userJourney: {
                directLookups: zipAnalytics.totalZipLookups - zipAnalytics.crossCityRedirects,
                redirectedLookups: zipAnalytics.crossCityRedirects
              }
            }
          }
        };
        break;

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid metric type. Supported types: overview, performance, quality, usage'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
    }

    const processingTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: responseData,
        metadata: {
          metricType,
          processingTime,
          timestamp: new Date().toISOString(),
          dateRange: dateRange ? {
            start: dateRange[0].toISOString(),
            end: dateRange[1].toISOString()
          } : null,
          ...(citySlug && { citySlug })
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // 5 minutes
          'X-Response-Time': `${processingTime}ms`,
          'X-Metric-Type': metricType
        }
      }
    );

  } catch (error) {
    console.error('[ZIP Analytics API] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to retrieve analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Handle unsupported methods
export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Method not allowed. Use GET to retrieve analytics.',
      availableEndpoints: {
        'GET /api/analytics/zip-metrics?type=overview': 'General validation overview',
        'GET /api/analytics/zip-metrics?type=performance': 'Performance metrics',
        'GET /api/analytics/zip-metrics?type=quality': 'Data quality metrics',
        'GET /api/analytics/zip-metrics?type=usage': 'Usage analytics',
        'GET /api/analytics/zip-metrics?dateRange=2024-01-01,2024-01-31': 'Metrics for date range',
        'GET /api/analytics/zip-metrics?city=dallas-tx': 'City-specific metrics'
      }
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

export const PUT = POST;
export const DELETE = POST;