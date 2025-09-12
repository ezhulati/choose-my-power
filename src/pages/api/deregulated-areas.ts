/**
 * API Endpoint: GET /api/deregulated-areas
 * Feature: 010-expand-zip-code - Complete deregulated area coverage
 * Phase 3.4 Enhancement: Redis caching optimization
 * Constitutional compliance: Real data only, dynamic generation
 */

import type { APIRoute } from 'astro';
import { zipValidationService } from '../../lib/services/zip-validation-service';
import { analyticsService } from '../../lib/services/analytics-service';
import Redis from 'ioredis';

// Cache configuration
const CACHE_KEY = 'deregulated-areas-data';
const CACHE_TTL = 4 * 60 * 60; // 4 hours (areas data changes infrequently)
let redis: Redis | null = null;
let fallbackCache: { data: unknown; cachedAt: number; expiresAt: number } | null = null;

// Initialize Redis connection
async function initializeRedis(): Promise<void> {
  if (!redis && process.env.REDIS_URL) {
    try {
      redis = new Redis(process.env.REDIS_URL);
      console.warn('[DeregulatedAreasAPI] Redis cache initialized');
    } catch (error) {
      console.warn('[DeregulatedAreasAPI] Redis not available, using fallback cache:', error);
    }
  }
}

export const GET: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  let cacheSource = 'none';

  try {
    await initializeRedis();

    // Step 1: Check Redis cache first
    let cachedData = null;
    let fromCache = false;

    try {
      if (redis) {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          cachedData = JSON.parse(cached);
          fromCache = true;
          cacheSource = 'redis';
        }
      }
    } catch (error) {
      console.warn('[DeregulatedAreasAPI] Redis read error:', error);
    }

    // Step 2: Check fallback cache if Redis failed
    if (!cachedData && fallbackCache) {
      const now = Date.now();
      if (now < fallbackCache.expiresAt) {
        cachedData = fallbackCache.data;
        fromCache = true;
        cacheSource = 'fallback';
      }
    }

    // Step 3: If cache hit, return cached data
    if (cachedData) {
      const responseTime = Date.now() - startTime;

      // Track analytics for cache hit
      await analyticsService.trackZIPNavigationEvent({
        eventType: 'zip_lookup_success',
        zipCode: 'deregulated_areas_cache_hit',
        responseTime,
        timestamp: new Date()
      });

      return new Response(JSON.stringify({
        success: true,
        data: cachedData,
        meta: {
          cached: true,
          cacheSource,
          responseTime,
          generatedAt: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600', // 1 hour for cached responses
          'X-Cache-Status': 'HIT',
          'X-Cache-Source': cacheSource,
          'X-Response-Time': `${responseTime}ms`
        }
      });
    }

    // Step 4: Cache miss - get fresh data from service
    console.warn('[DeregulatedAreasAPI] Cache miss - fetching fresh data');
    const areasData = await zipValidationService.getDeregulatedAreas();

    // Step 5: Cache the fresh data
    const cacheData = {
      totalCities: areasData.totalCities,
      totalZipCodes: areasData.totalZipCodes,
      lastUpdated: areasData.lastUpdated,
      cities: areasData.cities
    };

    // Cache in Redis
    try {
      if (redis) {
        await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(cacheData));
        cacheSource = 'redis-stored';
      }
    } catch (error) {
      console.warn('[DeregulatedAreasAPI] Redis write error:', error);
    }

    // Cache in fallback
    const now = Date.now();
    fallbackCache = {
      data: cacheData,
      cachedAt: now,
      expiresAt: now + (CACHE_TTL * 1000)
    };

    const responseTime = Date.now() - startTime;

    // Track analytics for cache miss
    await analyticsService.trackZIPNavigationEvent({
      eventType: 'zip_lookup_success',
      zipCode: 'deregulated_areas_fresh_data',
      responseTime,
      timestamp: new Date()
    });

    // Success response with fresh data
    return new Response(JSON.stringify({
      success: true,
      data: cacheData,
      meta: {
        cached: false,
        cacheSource: 'fresh',
        responseTime,
        generatedAt: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=1800', // 30 minutes for fresh responses
        'X-Cache-Status': 'MISS',
        'X-Cache-Source': cacheSource,
        'X-Response-Time': `${responseTime}ms`,
        'ETag': generateETag(cacheData)
      }
    });

  } catch (error) {
    console.error('[DeregulatedAreasAPI] Error:', error);
    
    const responseTime = Date.now() - startTime;

    // Track analytics for error
    await analyticsService.trackZIPNavigationEvent({
      eventType: 'zip_lookup_failed',
      zipCode: 'deregulated_areas_error',
      errorCode: 'API_ERROR',
      responseTime,
      timestamp: new Date()
    });
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'API_ERROR',
        message: 'Internal server error while retrieving deregulated areas'
      },
      meta: {
        responseTime,
        generatedAt: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Response-Time': `${responseTime}ms`
      }
    });
  }
};

// Handle CORS for GET requests
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
};

// Generate ETag for caching efficiency
function generateETag(data: unknown): string {
  // Simple hash based on data size and last update time
  const hash = `${data.totalCities}-${data.totalZipCodes}-${data.lastUpdated}`;
  return `"${Buffer.from(hash).toString('base64')}"`;
}