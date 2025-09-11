/**
 * Bulk Operations API - POST /api/bulk/operations
 * Handles bulk operations for ZIP coverage system
 * Supports bulk validation, coverage improvement, and data refresh
 */

import type { APIRoute } from 'astro';
import { zipCoverageOrchestrator } from '../../../lib/services/zip-coverage-orchestrator';
import { cityCoverageService } from '../../../lib/services/city-coverage-service';

// Rate limiting for bulk operations (stricter)
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // Only 5 bulk operations per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

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
          error: 'Bulk operation rate limit exceeded',
          retryAfter: Math.ceil((rateLimitCheck.resetTime! - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimitCheck.resetTime! - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Parse request
    const body = await request.json();
    const { 
      operation,
      data = {},
      options = {}
    } = body;

    if (!operation) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Operation type is required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    let result;
    const operationId = `bulk_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    switch (operation) {
      case 'validate_zips':
        // Bulk ZIP validation
        const { zipCodes, batchSize = 25, includeAnalytics = true } = data;
        
        if (!Array.isArray(zipCodes) || zipCodes.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'zipCodes array is required for validate_zips operation'
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        if (zipCodes.length > 500) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Maximum 500 ZIP codes per bulk validation'
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        result = await zipCoverageOrchestrator.validateZIPsBulk(zipCodes, {
          batchSize: Math.min(batchSize, 50),
          includeAnalytics,
          improveCoverage: options.improveCoverage || false
        });
        break;

      case 'improve_city_coverage':
        // Bulk city coverage improvement
        const { citySlug, citySlugs } = data;
        
        if (citySlug) {
          // Single city improvement
          result = await zipCoverageOrchestrator.improveZIPCoverage(citySlug);
        } else if (Array.isArray(citySlugs) && citySlugs.length > 0) {
          // Multiple cities improvement
          if (citySlugs.length > 50) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Maximum 50 cities per bulk improvement operation'
              }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }

          const cityResults = [];
          let totalProcessed = 0;
          let totalErrors = 0;

          for (const slug of citySlugs) {
            try {
              const cityResult = await zipCoverageOrchestrator.improveZIPCoverage(slug);
              cityResults.push({ citySlug: slug, result: cityResult });
              totalProcessed += cityResult.processed;
              totalErrors += cityResult.errors;
            } catch (error) {
              cityResults.push({ 
                citySlug: slug, 
                error: error instanceof Error ? error.message : 'Unknown error' 
              });
              totalErrors++;
            }
          }

          result = {
            success: totalErrors < citySlugs.length * 0.2,
            processed: totalProcessed,
            errors: totalErrors,
            details: {
              cities: cityResults.length,
              cityResults
            },
            processingTime: Date.now() - startTime,
            summary: `Processed ${citySlugs.length} cities with ${totalErrors} errors`
          };
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'citySlug or citySlugs array is required for improve_city_coverage operation'
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
        break;

      case 'refresh_coverage_data':
        // Bulk coverage data refresh
        const { targetCities = [], maxCities = 100 } = data;
        
        let citiesToRefresh = targetCities;
        if (citiesToRefresh.length === 0) {
          // Get cities that need attention
          const citiesNeedingAttention = await cityCoverageService.getCitiesNeedingAttention(maxCities);
          citiesToRefresh = citiesNeedingAttention.map(c => c.citySlug);
        }

        if (citiesToRefresh.length > maxCities) {
          citiesToRefresh = citiesToRefresh.slice(0, maxCities);
        }

        const refreshResults = [];
        let refreshedCount = 0;
        let refreshErrors = 0;

        for (const citySlug of citiesToRefresh) {
          try {
            const refreshResult = await cityCoverageService.refreshCityCoverage(citySlug);
            refreshResults.push({ citySlug, result: refreshResult });
            if (refreshResult.success) refreshedCount++;
            else refreshErrors++;
          } catch (error) {
            refreshResults.push({ 
              citySlug, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            refreshErrors++;
          }
        }

        result = {
          success: refreshErrors < citiesToRefresh.length * 0.2,
          processed: refreshedCount,
          errors: refreshErrors,
          details: {
            totalCities: citiesToRefresh.length,
            refreshResults
          },
          processingTime: Date.now() - startTime,
          summary: `Refreshed coverage data for ${refreshedCount}/${citiesToRefresh.length} cities`
        };
        break;

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid operation. Supported operations: validate_zips, improve_city_coverage, refresh_coverage_data'
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
        success: result.success,
        data: {
          operationId,
          operation,
          result,
          summary: {
            totalProcessed: result.processed || 0,
            totalErrors: result.errors || 0,
            processingTime: result.processingTime || processingTime,
            successRate: result.processed ? 
              Math.round(((result.processed - result.errors) / result.processed) * 10000) / 100 : 0
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          processingTime,
          operation,
          options
        }
      }),
      {
        status: result.success ? 200 : 207, // 207 Multi-Status for partial success
        headers: {
          'Content-Type': 'application/json',
          'X-Operation-ID': operationId,
          'X-Response-Time': `${processingTime}ms`,
          'X-Operation-Type': operation
        }
      }
    );

  } catch (error) {
    console.error('[Bulk Operations API] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Bulk operation failed',
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
      error: 'Method not allowed. Use POST for bulk operations.',
      supportedOperations: {
        'validate_zips': {
          description: 'Bulk ZIP code validation',
          data: { zipCodes: ['12345', '67890'], batchSize: 25 },
          maxItems: 500
        },
        'improve_city_coverage': {
          description: 'Improve ZIP coverage for cities',
          data: { citySlugs: ['dallas-tx', 'houston-tx'] },
          maxItems: 50
        },
        'refresh_coverage_data': {
          description: 'Refresh coverage data for cities needing attention',
          data: { maxCities: 100 },
          options: { autoSelect: true }
        }
      },
      rateLimits: {
        maxOperations: 5,
        windowHours: 1
      }
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

export const PUT = GET;
export const DELETE = GET;