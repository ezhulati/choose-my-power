/**
 * ZIP Routing Service with Redis Caching
 * Feature: 010-expand-zip-code - Phase 3.4 Enhancement
 * Provides fast ZIP code to city plans page routing with intelligent caching
 */

import type { 
  ZIPRoutingResult, 
  ZIPCodeMapping, 
  CachedZIPRouting,
  ZIPPerformanceMetrics 
} from '../types/zip-navigation';
import { zipValidationService } from './zip-validation-service';
import { analyticsService } from './analytics-service';
import { zipErrorRecoveryService } from './zip-error-recovery-service';
// Import performance monitoring for T030 integration
import { zipPerformanceMonitoringService } from './zip-performance-monitoring-service';
import Redis from 'ioredis';

export class ZIPRoutingService {
  private redis: Redis | null = null;
  private fallbackCache: Map<string, CachedZIPRouting> = new Map();
  private performanceMetrics: ZIPPerformanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    fastRoutes: new Set()
  };

  constructor() {
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL);
        console.warn('[ZIPRoutingService] Redis cache initialized');
        
        // Warm up cache with high-priority ZIPs
        await this.warmUpCache();
      }
    } catch (error) {
      console.warn('[ZIPRoutingService] Redis not available, using fallback cache:', error);
    }
  }

  /**
   * Fast ZIP routing lookup with caching
   */
  async getZIPRouting(zipCode: string): Promise<ZIPRoutingResult> {
    const startTime = Date.now();
    this.performanceMetrics.totalRequests++;

    try {
      // Step 1: Check cache first
      const cached = await this.getCachedRouting(zipCode);
      if (cached && this.isCacheValid(cached)) {
        this.performanceMetrics.cacheHits++;
        const responseTime = Date.now() - startTime;
        this.updateResponseTime(responseTime);
        
        // Track successful cache hit
        await analyticsService.trackZIPNavigationEvent({
          eventType: 'zip_lookup_success',
          zipCode,
          cityResolved: cached.cityName,
          responseTime,
          timestamp: new Date()
        });

        // Record performance event for T030 monitoring
        await zipPerformanceMonitoringService.recordPerformanceEvent({
          type: 'CACHE_HIT',
          zipCode,
          responseTime
        });
        
        return {
          success: true,
          data: {
            zipCode: cached.zipCode,
            redirectUrl: cached.redirectUrl,
            cityName: cached.cityName,
            citySlug: cached.citySlug,
            planCount: cached.planCount,
            tdspTerritory: cached.tdspTerritory,
            marketStatus: cached.marketStatus,
            source: 'cache'
          },
          responseTime,
          cached: true
        };
      }

      // Step 2: Get fresh data from validation service
      this.performanceMetrics.cacheMisses++;
      const validation = await zipValidationService.validateZIPCode(zipCode);
      
      if (!validation.isValid || !validation.cityData) {
        const responseTime = Date.now() - startTime;
        
        // Get enhanced error recovery suggestions
        const errorRecovery = await zipErrorRecoveryService.getErrorRecovery(
          zipCode, 
          validation.errorCode || 'ROUTING_FAILED'
        );
        
        // Format suggestions for display
        const formattedSuggestions = zipErrorRecoveryService.formatSuggestionsForDisplay(
          errorRecovery.suggestions
        );
        
        // Track failed lookup with enhanced error data
        await analyticsService.trackZIPNavigationEvent({
          eventType: 'zip_lookup_failed',
          zipCode,
          errorCode: validation.errorCode,
          responseTime,
          timestamp: new Date()
        });

        // Record performance event for T030 monitoring
        await zipPerformanceMonitoringService.recordPerformanceEvent({
          type: 'ERROR',
          zipCode,
          responseTime,
          errorCode: validation.errorCode
        });
        
        return {
          success: false,
          error: {
            code: validation.errorCode || 'ROUTING_FAILED',
            message: validation.errorMessage || 'Unable to route ZIP code',
            suggestions: formattedSuggestions,
            recoveryActions: errorRecovery.recoveryActions,
            helpfulTips: errorRecovery.helpfulTips
          },
          responseTime,
          cached: false
        };
      }

      // Step 3: Build routing result
      const routingData = {
        zipCode: validation.zipCode,
        redirectUrl: validation.cityData.redirectUrl,
        cityName: validation.cityData.name,
        citySlug: validation.cityData.slug,
        planCount: await this.getEstimatedPlanCount(validation.cityData.slug),
        tdspTerritory: validation.tdspData?.name || 'Unknown',
        marketStatus: validation.isDeregulated ? 'active' : 'limited' as const,
        source: 'fresh' as const
      };

      // Step 4: Cache the result
      await this.cacheRouting(zipCode, routingData);
      
      // Step 5: Track fast routes for optimization
      const responseTime = Date.now() - startTime;
      if (responseTime < 100) {
        this.performanceMetrics.fastRoutes.add(zipCode);
      }
      
      this.updateResponseTime(responseTime);

      // Track successful routing and redirection
      await analyticsService.trackZIPNavigationEvent({
        eventType: 'zip_routing_redirect',
        zipCode: validation.zipCode,
        cityResolved: validation.cityData.name,
        responseTime,
        timestamp: new Date()
      });

      // Record performance event for T030 monitoring
      await zipPerformanceMonitoringService.recordPerformanceEvent({
        type: 'CACHE_MISS',
        zipCode,
        responseTime
      });

      return {
        success: true,
        data: routingData,
        responseTime,
        cached: false
      };

    } catch (error) {
      console.error('[ZIPRoutingService] Routing error:', error);
      return {
        success: false,
        error: {
          code: 'ROUTING_ERROR',
          message: 'Internal routing service error'
        },
        responseTime: Date.now() - startTime,
        cached: false
      };
    }
  }

  /**
   * Bulk ZIP routing for multiple ZIP codes (for admin/analytics)
   */
  async getBulkZIPRouting(zipCodes: string[]): Promise<Map<string, ZIPRoutingResult>> {
    const results = new Map<string, ZIPRoutingResult>();
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < zipCodes.length; i += batchSize) {
      const batch = zipCodes.slice(i, i + batchSize);
      const batchPromises = batch.map(zip => this.getZIPRouting(zip));
      
      const batchResults = await Promise.all(batchPromises);
      batch.forEach((zip, index) => {
        results.set(zip, batchResults[index]);
      });
      
      // Small delay between batches to prevent rate limiting
      if (i + batchSize < zipCodes.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics(): ZIPPerformanceMetrics & {
    cacheHitRate: number;
    totalFastRoutes: number;
  } {
    const cacheHitRate = this.performanceMetrics.totalRequests > 0 
      ? (this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests) * 100
      : 0;

    return {
      ...this.performanceMetrics,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      totalFastRoutes: this.performanceMetrics.fastRoutes.size
    };
  }

  /**
   * Clear cache (for testing/maintenance)
   */
  async clearCache(): Promise<void> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys('zip-routing:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
      this.fallbackCache.clear();
      console.warn('[ZIPRoutingService] Cache cleared');
    } catch (error) {
      console.error('[ZIPRoutingService] Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    redisAvailable: boolean;
    totalCachedRoutes: number;
    cacheSize: string;
    oldestEntry?: string;
    newestEntry?: string;
  }> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys('zip-routing:*');
        const totalCachedRoutes = keys.length;
        
        // Get memory info if available
        const info = await this.redis.info('memory').catch(() => null);
        const memoryUsage = info ? 
          info.split('\n').find(line => line.startsWith('used_memory_human:'))?.split(':')[1]?.trim() 
          : 'unknown';

        return {
          redisAvailable: true,
          totalCachedRoutes,
          cacheSize: memoryUsage || 'unknown',
          oldestEntry: keys.length > 0 ? keys[0] : undefined,
          newestEntry: keys.length > 0 ? keys[keys.length - 1] : undefined
        };
      }

      return {
        redisAvailable: false,
        totalCachedRoutes: this.fallbackCache.size,
        cacheSize: `${this.fallbackCache.size} entries (fallback)`
      };
    } catch (error) {
      console.error('[ZIPRoutingService] Error getting cache stats:', error);
      return {
        redisAvailable: false,
        totalCachedRoutes: 0,
        cacheSize: 'error'
      };
    }
  }

  // Private helper methods

  private async getCachedRouting(zipCode: string): Promise<CachedZIPRouting | null> {
    const cacheKey = `zip-routing:${zipCode}`;
    
    try {
      if (this.redis) {
        const cached = await this.redis.get(cacheKey);
        return cached ? JSON.parse(cached) : null;
      }
      
      return this.fallbackCache.get(cacheKey) || null;
    } catch (error) {
      console.warn('[ZIPRoutingService] Cache read error:', error);
      return null;
    }
  }

  private async cacheRouting(zipCode: string, data: unknown): Promise<void> {
    const cacheKey = `zip-routing:${zipCode}`;
    const cached: CachedZIPRouting = {
      ...data,
      cachedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    try {
      if (this.redis) {
        await this.redis.setex(cacheKey, 24 * 60 * 60, JSON.stringify(cached)); // 24 hours
      } else {
        this.fallbackCache.set(cacheKey, cached);
      }
    } catch (error) {
      console.warn('[ZIPRoutingService] Cache write error:', error);
    }
  }

  private isCacheValid(cached: CachedZIPRouting): boolean {
    const now = new Date();
    const expiresAt = new Date(cached.expiresAt);
    return now < expiresAt;
  }

  private async getEstimatedPlanCount(citySlug: string): Promise<number> {
    try {
      // Try to get real plan count from the validation service
      const areas = await zipValidationService.getDeregulatedAreas();
      const city = areas.cities.find(c => c.slug === citySlug);
      return city?.planCount || 25; // Fallback estimate
    } catch (error) {
      return 25; // Conservative fallback
    }
  }

  private updateResponseTime(responseTime: number): void {
    const totalRequests = this.performanceMetrics.totalRequests;
    const currentAverage = this.performanceMetrics.averageResponseTime;
    
    // Calculate rolling average
    this.performanceMetrics.averageResponseTime = 
      ((currentAverage * (totalRequests - 1)) + responseTime) / totalRequests;
  }

  private async warmUpCache(): Promise<void> {
    try {
      // Warm up cache with high-priority ZIP codes
      const highPriorityZips = [
        '75201', '75202', '75203', // Dallas
        '77001', '77002', '77003', // Houston
        '76101', '76102', '76103', // Fort Worth
        '75701', '75702', // Tyler
        '78401', '78402', // Corpus Christi
        '76701', '76702', // Waco
        '77840', '77841', // College Station
        '79401', '79402', // Lubbock
        '79601', '79602'  // Abilene
      ];

      console.warn('[ZIPRoutingService] Warming up cache with high-priority ZIPs...');
      
      for (const zip of highPriorityZips) {
        try {
          await this.getZIPRouting(zip);
        } catch (error) {
          // Continue warming up even if some ZIPs fail
          console.warn(`[ZIPRoutingService] Failed to warm up ${zip}:`, error);
        }
      }
      
      console.warn(`[ZIPRoutingService] Cache warm-up completed for ${highPriorityZips.length} ZIP codes`);
    } catch (error) {
      console.error('[ZIPRoutingService] Cache warm-up error:', error);
    }
  }
}

// Export singleton instance
export const zipRoutingService = new ZIPRoutingService();