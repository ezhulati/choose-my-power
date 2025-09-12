/**
 * Faceted Navigation Cache Optimizer
 * Specialized caching strategies for faceted navigation performance
 * Optimizes Redis and memory cache usage for thousands of URL combinations
 */

import type { Plan, ApiParams } from '../../types/facets';
import { comparePowerClient } from '../api/comparepower-client';
import { tdspMapping } from '../../config/tdsp-mapping';
import { filterMapper } from '../api/filter-mapper';

export interface CacheOptimizationConfig {
  // Cache warming settings
  warmingBatchSize: number;
  warmingDelayMs: number;
  popularCitiesLimit: number;
  
  // Cache invalidation settings
  invalidationSchedule: number; // Minutes between cache refreshes
  staleThresholdMs: number;     // How long before cache is considered stale
  
  // Performance optimization
  preloadHighValuePages: boolean;
  enablePrefetching: boolean;
  maxConcurrentRequests: number;
  
  // Cache prioritization
  tierWeights: { [tier: number]: number };
  filterPriorityWeights: { [filterType: string]: number };
}

interface CacheWarmingPlan {
  highPriority: Array<{ city: string; filters: string[]; tdspDuns: string }>;
  mediumPriority: Array<{ city: string; filters: string[]; tdspDuns: string }>;
  lowPriority: Array<{ city: string; filters: string[]; tdspDuns: string }>;
  totalRequests: number;
  estimatedTimeMs: number;
}

interface CacheMetrics {
  warmingStartTime: number;
  warmingEndTime: number;
  requestsWarmed: number;
  errorsEncountered: number;
  cacheHitRate: number;
  averageResponseTime: number;
}

export class FacetedCacheOptimizer {
  private config: CacheOptimizationConfig;
  private metrics: CacheMetrics;
  private warmingInProgress = false;
  
  constructor(config?: Partial<CacheOptimizationConfig>) {
    this.config = {
      warmingBatchSize: 5,
      warmingDelayMs: 200,
      popularCitiesLimit: 20,
      invalidationSchedule: 60, // 1 hour
      staleThresholdMs: 3600000, // 1 hour
      preloadHighValuePages: true,
      enablePrefetching: true,
      maxConcurrentRequests: 10,
      tierWeights: { 1: 3, 2: 2, 3: 1 },
      filterPriorityWeights: {
        'term': 3,
        'rate_type': 3,
        'green_energy': 2,
        'plan_features': 2,
        'provider': 1,
        'usage': 1
      },
      ...config
    };
    
    this.metrics = {
      warmingStartTime: 0,
      warmingEndTime: 0,
      requestsWarmed: 0,
      errorsEncountered: 0,
      cacheHitRate: 0,
      averageResponseTime: 0
    };
  }

  /**
   * Warm cache with high-value faceted navigation combinations
   */
  async warmCache(): Promise<CacheMetrics> {
    if (this.warmingInProgress) {
      console.warn('Cache warming already in progress, skipping...');
      return this.metrics;
    }

    this.warmingInProgress = true;
    this.metrics.warmingStartTime = Date.now();
    this.metrics.requestsWarmed = 0;
    this.metrics.errorsEncountered = 0;

    console.warn('🔥 Starting faceted navigation cache warming...');

    try {
      const warmingPlan = this.createWarmingPlan();
      console.warn(`📋 Warming plan: ${warmingPlan.totalRequests} requests across ${warmingPlan.highPriority.length} high priority + ${warmingPlan.mediumPriority.length} medium priority combinations`);

      // Warm high-priority combinations first
      await this.warmCombinations(warmingPlan.highPriority, 'high');
      
      // Warm medium-priority combinations
      await this.warmCombinations(warmingPlan.mediumPriority, 'medium');
      
      // Warm low-priority combinations if time allows
      const elapsedTime = Date.now() - this.metrics.warmingStartTime;
      if (elapsedTime < warmingPlan.estimatedTimeMs * 1.5) {
        await this.warmCombinations(warmingPlan.lowPriority.slice(0, 50), 'low');
      }

    } catch (error) {
      console.error('❌ Cache warming failed:', error);
      this.metrics.errorsEncountered++;
    } finally {
      this.metrics.warmingEndTime = Date.now();
      this.warmingInProgress = false;
      
      const duration = this.metrics.warmingEndTime - this.metrics.warmingStartTime;
      this.metrics.averageResponseTime = this.metrics.requestsWarmed > 0 
        ? duration / this.metrics.requestsWarmed 
        : 0;
      
      console.warn(`✅ Cache warming completed: ${this.metrics.requestsWarmed} requests in ${duration}ms`);
    }

    return this.metrics;
  }

  /**
   * Create optimized cache warming plan
   */
  private createWarmingPlan(): CacheWarmingPlan {
    const plan: CacheWarmingPlan = {
      highPriority: [],
      mediumPriority: [],
      lowPriority: [],
      totalRequests: 0,
      estimatedTimeMs: 0
    };

    // Get popular cities by tier
    const cities = Object.entries(tdspMapping)
      .sort(([,a], [,b]) => (a.priority || 0) - (b.priority || 0))
      .reverse()
      .slice(0, this.config.popularCitiesLimit);

    for (const [citySlug, cityData] of cities) {
      const tier = cityData.tier || 3;
      const tdspDuns = cityData.duns;
      const weight = this.config.tierWeights[tier];

      // City page (no filters) - always high priority
      plan.highPriority.push({
        city: citySlug,
        filters: [],
        tdspDuns
      });

      // Popular single filter combinations
      const popularSingleFilters = this.getPopularFiltersForTier(tier);
      for (const filter of popularSingleFilters) {
        const priority = weight >= 3 ? 'high' : weight >= 2 ? 'medium' : 'low';
        const combination = { city: citySlug, filters: [filter], tdspDuns };
        
        if (priority === 'high') plan.highPriority.push(combination);
        else if (priority === 'medium') plan.mediumPriority.push(combination);
        else plan.lowPriority.push(combination);
      }

      // Popular two-filter combinations for tier 1 cities
      if (tier === 1) {
        const popularCombos = [
          ['12-month', 'fixed-rate'],
          ['12-month', 'green-energy'],
          ['fixed-rate', 'green-energy'],
          ['24-month', 'fixed-rate']
        ];

        for (const combo of popularCombos) {
          plan.mediumPriority.push({
            city: citySlug,
            filters: combo,
            tdspDuns
          });
        }
      }
    }

    plan.totalRequests = plan.highPriority.length + plan.mediumPriority.length + plan.lowPriority.length;
    plan.estimatedTimeMs = plan.totalRequests * 300; // 300ms average per request

    return plan;
  }

  /**
   * Get popular filters based on city tier
   */
  private getPopularFiltersForTier(tier: number): string[] {
    const baseFilters = ['12-month', 'fixed-rate', 'green-energy'];
    
    if (tier === 1) {
      return [...baseFilters, '24-month', 'prepaid', 'no-deposit', 'autopay-discount'];
    } else if (tier === 2) {
      return [...baseFilters, '24-month', 'prepaid'];
    } else {
      return baseFilters;
    }
  }

  /**
   * Warm specific combinations with rate limiting
   */
  private async warmCombinations(
    combinations: Array<{ city: string; filters: string[]; tdspDuns: string }>,
    priority: string
  ): Promise<void> {
    console.warn(`🔥 Warming ${combinations.length} ${priority} priority combinations...`);
    
    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < combinations.length; i += this.config.warmingBatchSize) {
      const batch = combinations.slice(i, i + this.config.warmingBatchSize);
      
      const promises = batch.map(combo => this.warmSingleCombination(combo));
      const results = await Promise.allSettled(promises);
      
      // Count successes and failures
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          this.metrics.requestsWarmed++;
        } else {
          this.metrics.errorsEncountered++;
          console.warn(`⚠️ Failed to warm cache for combination:`, result.reason);
        }
      });

      // Rate limiting delay
      if (i + this.config.warmingBatchSize < combinations.length) {
        await this.sleep(this.config.warmingDelayMs);
      }
    }
  }

  /**
   * Warm cache for a single combination
   */
  private async warmSingleCombination(
    combo: { city: string; filters: string[]; tdspDuns: string }
  ): Promise<void> {
    try {
      // Build API parameters using the filter mapper
      const filterResult = filterMapper.mapFiltersToApiParams(
        combo.city, 
        combo.filters, 
        combo.tdspDuns
      );

      if (!filterResult.isValid) {
        console.warn(`Invalid filter combination for ${combo.city}: ${combo.filters.join(', ')}`);
        return;
      }

      // Fetch plans (this will populate cache)
      await comparePowerClient.fetchPlans(filterResult.apiParams);
      
    } catch (error) {
      throw new Error(`Cache warming failed for ${combo.city}/${combo.filters.join('/')}: ${error}`);
    }
  }

  /**
   * Prefetch related filter combinations
   */
  async prefetchRelatedCombinations(currentCity: string, currentFilters: string[]): Promise<void> {
    if (!this.config.enablePrefetching) return;

    try {
      const tdspDuns = tdspMapping[currentCity]?.duns;
      if (!tdspDuns) return;

      // Generate related combinations
      const relatedCombinations = this.generateRelatedCombinations(currentCity, currentFilters);
      
      // Prefetch up to 3 related combinations
      const prefetchPromises = relatedCombinations.slice(0, 3).map(async (filters) => {
        const filterResult = filterMapper.mapFiltersToApiParams(currentCity, filters, tdspDuns);
        if (filterResult.isValid) {
          await comparePowerClient.fetchPlans(filterResult.apiParams);
        }
      });

      await Promise.allSettled(prefetchPromises);
      
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  }

  /**
   * Generate related filter combinations for prefetching
   */
  private generateRelatedCombinations(city: string, currentFilters: string[]): string[][] {
    const related: string[][] = [];
    
    // Add single filter variations
    const popularFilters = ['12-month', '24-month', 'fixed-rate', 'green-energy', 'prepaid'];
    
    for (const filter of popularFilters) {
      if (!currentFilters.includes(filter)) {
        // Add filter to current combination
        if (currentFilters.length < 2) {
          related.push([...currentFilters, filter]);
        }
        
        // Replace one filter with this filter
        if (currentFilters.length > 0) {
          related.push([filter, ...currentFilters.slice(1)]);
        }
      }
    }

    return related;
  }

  /**
   * Invalidate stale cache entries
   */
  async invalidateStaleCache(): Promise<number> {
    const staleThreshold = Date.now() - this.config.staleThresholdMs;
    let invalidatedCount = 0;

    try {
      // Get cache statistics and identify stale entries
      const cacheStats = await comparePowerClient.getCacheStats();
      
      // For now, clear all cache - in production you'd selectively invalidate
      await comparePowerClient.clearCache();
      invalidatedCount = cacheStats.memory.totalEntries || 0;
      
      console.warn(`🗑️ Invalidated ${invalidatedCount} stale cache entries`);
      
    } catch (error) {
      console.error('Cache invalidation failed:', error);
    }

    return invalidatedCount;
  }

  /**
   * Get current cache metrics
   */
  async getCacheMetrics(): Promise<CacheMetrics & { currentStats: unknown}> {
    try {
      const currentStats = await comparePowerClient.getCacheStats();
      
      return {
        ...this.metrics,
        currentStats,
        cacheHitRate: currentStats.memory.hitRate || 0
      };
    } catch (error) {
      return {
        ...this.metrics,
        currentStats: null
      };
    }
  }

  /**
   * Schedule periodic cache maintenance
   */
  scheduleMaintenanceTasks(): void {
    // Schedule cache warming
    setInterval(async () => {
      console.warn('🔄 Running scheduled cache warming...');
      await this.warmCache();
    }, this.config.invalidationSchedule * 60 * 1000);

    // Schedule stale cache invalidation
    setInterval(async () => {
      console.warn('🗑️ Running scheduled cache invalidation...');
      await this.invalidateStaleCache();
    }, (this.config.invalidationSchedule * 2) * 60 * 1000);
  }

  /**
   * Optimize cache configuration based on usage patterns
   */
  optimizeConfiguration(usageStats: unknown): CacheOptimizationConfig {
    const optimized = { ...this.config };

    // Adjust warming batch size based on error rate
    if (this.metrics.errorsEncountered / this.metrics.requestsWarmed > 0.1) {
      optimized.warmingBatchSize = Math.max(2, optimized.warmingBatchSize - 1);
      optimized.warmingDelayMs += 100;
    } else if (this.metrics.errorsEncountered / this.metrics.requestsWarmed < 0.05) {
      optimized.warmingBatchSize = Math.min(10, optimized.warmingBatchSize + 1);
      optimized.warmingDelayMs = Math.max(100, optimized.warmingDelayMs - 50);
    }

    // Adjust cache invalidation based on hit rate
    if (this.metrics.cacheHitRate < 0.7) {
      optimized.staleThresholdMs *= 1.5; // Keep cache longer
    } else if (this.metrics.cacheHitRate > 0.9) {
      optimized.staleThresholdMs *= 0.8; // Refresh cache more frequently
    }

    return optimized;
  }

  /**
   * Utility to sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton for use across the application
export const facetedCacheOptimizer = new FacetedCacheOptimizer();

// Export utility functions
export async function warmFacetedCache(): Promise<CacheMetrics> {
  return facetedCacheOptimizer.warmCache();
}

export async function prefetchRelatedPages(city: string, filters: string[]): Promise<void> {
  return facetedCacheOptimizer.prefetchRelatedCombinations(city, filters);
}

export async function getFacetedCacheMetrics() {
  return facetedCacheOptimizer.getCacheMetrics();
}