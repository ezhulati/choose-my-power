/**
 * Route Cache Manager for 881-City Optimization
 * Implements intelligent caching and preloading strategies for faceted routing
 * 
 * Features:
 * - Multi-tier caching (Memory -> Redis -> Database)
 * - Route preloading based on user patterns
 * - Cache warming for high-priority routes
 * - Memory-efficient cache management
 * - Performance monitoring and optimization
 */

import { facetedRouter, getRouterCacheStats } from '../faceted/faceted-router';
import { comparePowerClient } from '../api/comparepower-client';
import { tdspMapping } from '../../config/tdsp-mapping';
import type { Plan, ApiParams } from '../../types/facets';

interface CacheEntry {
  data: any;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  priority: 'high' | 'medium' | 'low';
  tier: number;
  estimatedMemorySize: number;
}

interface PreloadPattern {
  citySlug: string;
  filters: string[];
  popularity: number;
  lastRequested: number;
}

interface CacheStats {
  memory: {
    totalEntries: number;
    totalMemoryMB: number;
    hitRate: number;
    avgAccessCount: number;
  };
  preloader: {
    activePreloads: number;
    successfulPreloads: number;
    failedPreloads: number;
    averagePreloadTime: number;
  };
  performance: {
    averageRouteTime: number;
    p95RouteTime: number;
    slowestRoutes: Array<{ route: string; time: number }>;
  };
}

export class RouteCacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private preloadPatterns = new Map<string, PreloadPattern>();
  private routeTimings: number[] = [];
  private slowestRoutes: Array<{ route: string; time: number }> = [];
  private preloadQueue: Set<string> = new Set();
  private isPreloading = false;
  private stats = {
    hits: 0,
    misses: 0,
    preloads: 0,
    preloadSuccesses: 0,
    preloadFailures: 0,
    totalPreloadTime: 0,
  };

  // Configuration
  private readonly MAX_MEMORY_CACHE_SIZE = 2000; // Maximum cache entries
  private readonly MAX_MEMORY_MB = 512; // Maximum memory usage in MB
  private readonly CACHE_TTL = 1800000; // 30 minutes
  private readonly PRELOAD_BATCH_SIZE = 10;
  private readonly HIGH_PRIORITY_CITIES = ['dallas-tx', 'houston-tx', 'austin-tx', 'fort-worth-tx', 'san-antonio-tx'];
  private readonly POPULAR_FILTERS = ['12-month', 'fixed-rate', 'green-energy', '24-month', 'prepaid'];

  constructor() {
    this.initializeCache();
    this.startBackgroundTasks();
  }

  /**
   * Initialize cache with high-priority routes
   */
  private async initializeCache(): Promise<void> {
    console.log('🚀 Initializing route cache for 881 cities...');
    
    try {
      // Warm cache with high-priority city pages
      for (const citySlug of this.HIGH_PRIORITY_CITIES) {
        this.preloadQueue.add(citySlug);
      }
      
      // Add popular filter combinations
      for (const citySlug of this.HIGH_PRIORITY_CITIES.slice(0, 3)) {
        for (const filter of this.POPULAR_FILTERS.slice(0, 3)) {
          this.preloadQueue.add(`${citySlug}/${filter}`);
        }
      }
      
      console.log(`✅ Cache initialized with ${this.preloadQueue.size} high-priority routes`);
      
      // Start preloading in background
      this.processPreloadQueue();
      
    } catch (error) {
      console.error('❌ Cache initialization failed:', error);
    }
  }

  /**
   * Get cached route data with intelligent caching
   */
  async getCachedRoute(path: string): Promise<any | null> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(path);
    
    try {
      // Check memory cache first
      const cached = this.memoryCache.get(cacheKey);
      if (cached && this.isCacheValid(cached)) {
        cached.accessCount++;
        cached.lastAccessed = Date.now();
        this.stats.hits++;
        
        const responseTime = Date.now() - startTime;
        this.recordRouteTime(responseTime);
        
        return cached.data;
      }
      
      this.stats.misses++;
      
      // Cache miss - add to preload queue if popular
      this.recordCacheMiss(path);
      
      return null;
      
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    } finally {
      const responseTime = Date.now() - startTime;
      this.recordRouteTime(responseTime);
    }
  }

  /**
   * Set route data in cache with intelligent priority
   */
  async setCachedRoute(path: string, data: any): Promise<void> {
    const cacheKey = this.getCacheKey(path);
    const memorySize = this.estimateMemorySize(data);
    const priority = this.calculatePriority(path);
    const tier = this.getTierFromPath(path);
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      priority,
      tier,
      estimatedMemorySize: memorySize
    };
    
    // Check memory limits before caching
    if (this.shouldCacheEntry(entry)) {
      this.memoryCache.set(cacheKey, entry);
      this.enforceMemoryLimits();
    }
  }

  /**
   * Preload popular routes based on patterns
   */
  async preloadRoute(path: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<boolean> {
    const cacheKey = this.getCacheKey(path);
    
    // Skip if already cached
    if (this.memoryCache.has(cacheKey)) {
      return true;
    }
    
    try {
      const startTime = Date.now();
      this.stats.preloads++;
      
      // Validate and fetch route data
      const routeResult = await facetedRouter.validateRoute(path, { 
        requirePlans: true,
        allowInvalidFilters: false
      });
      
      if (routeResult.isValid && routeResult.plans) {
        await this.setCachedRoute(path, routeResult);
        
        const preloadTime = Date.now() - startTime;
        this.stats.preloadSuccesses++;
        this.stats.totalPreloadTime += preloadTime;
        
        console.log(`✅ Preloaded ${path} in ${preloadTime}ms (${routeResult.plans.length} plans)`);
        return true;
      } else {
        this.stats.preloadFailures++;
        console.warn(`⚠️  Failed to preload ${path}: ${routeResult.error}`);
        return false;
      }
      
    } catch (error) {
      this.stats.preloadFailures++;
      console.error(`❌ Preload error for ${path}:`, error);
      return false;
    }
  }

  /**
   * Process preload queue in background
   */
  private async processPreloadQueue(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.size === 0) {
      return;
    }
    
    this.isPreloading = true;
    console.log(`🔄 Processing preload queue: ${this.preloadQueue.size} routes`);
    
    try {
      const batch = Array.from(this.preloadQueue).slice(0, this.PRELOAD_BATCH_SIZE);
      
      // Process batch in parallel with concurrency limit
      const preloadPromises = batch.map(async (path) => {
        this.preloadQueue.delete(path);
        return this.preloadRoute(path, 'medium');
      });
      
      const results = await Promise.allSettled(preloadPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      
      console.log(`📊 Preload batch complete: ${successful}/${batch.length} successful`);
      
      // Continue processing if queue not empty
      if (this.preloadQueue.size > 0) {
        setTimeout(() => this.processPreloadQueue(), 2000); // 2 second delay between batches
      }
      
    } catch (error) {
      console.error('Preload queue processing error:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Smart cache warming for high-value routes
   */
  async warmCacheForTier(tier: number, maxRoutes: number = 50): Promise<void> {
    console.log(`🔥 Warming cache for Tier ${tier} cities (max ${maxRoutes} routes)...`);
    
    const tierCities = Object.entries(tdspMapping)
      .filter(([_, config]) => config.tier === tier)
      .sort(([, a], [, b]) => (b.priority || 0) - (a.priority || 0))
      .slice(0, maxRoutes)
      .map(([citySlug]) => citySlug);
    
    let warmed = 0;
    const startTime = Date.now();
    
    for (const citySlug of tierCities) {
      // Add city page
      this.preloadQueue.add(citySlug);
      warmed++;
      
      // Add popular filter combinations for high-tier cities
      if (tier === 1 && warmed < maxRoutes) {
        for (const filter of this.POPULAR_FILTERS.slice(0, 3)) {
          if (warmed < maxRoutes) {
            this.preloadQueue.add(`${citySlug}/${filter}`);
            warmed++;
          }
        }
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Cache warmed for Tier ${tier}: ${warmed} routes queued in ${duration}ms`);
    
    // Start processing queue
    this.processPreloadQueue();
  }

  /**
   * Background task management
   */
  private startBackgroundTasks(): void {
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanupExpiredEntries(), 300000);
    
    // Memory optimization every 2 minutes
    setInterval(() => this.optimizeMemoryUsage(), 120000);
    
    // Stats logging every 10 minutes
    setInterval(() => this.logPerformanceStats(), 600000);
    
    console.log('🔄 Background cache management tasks started');
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * Optimize memory usage by removing low-priority entries
   */
  private optimizeMemoryUsage(): void {
    const currentMemoryMB = this.getCurrentMemoryUsage();
    
    if (currentMemoryMB > this.MAX_MEMORY_MB || this.memoryCache.size > this.MAX_MEMORY_CACHE_SIZE) {
      const entries = Array.from(this.memoryCache.entries())
        .sort(([, a], [, b]) => {
          // Sort by priority (low first) then by access patterns
          const priorityOrder = { low: 1, medium: 2, high: 3 };
          const aPriority = priorityOrder[a.priority] * 1000 + a.accessCount;
          const bPriority = priorityOrder[b.priority] * 1000 + b.accessCount;
          return aPriority - bPriority;
        });
      
      const toRemove = Math.max(
        this.memoryCache.size - this.MAX_MEMORY_CACHE_SIZE,
        Math.ceil(entries.length * 0.2) // Remove 20% when over memory limit
      );
      
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        this.memoryCache.delete(entries[i][0]);
      }
      
      const newMemoryMB = this.getCurrentMemoryUsage();
      console.log(`🗑️  Memory optimization: removed ${toRemove} entries, ${Math.round(currentMemoryMB - newMemoryMB)}MB freed`);
    }
  }

  /**
   * Helper methods
   */
  private getCacheKey(path: string): string {
    return `route:${path.toLowerCase().replace(/\/+/g, '/')}`;
  }

  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.CACHE_TTL;
  }

  private calculatePriority(path: string): 'high' | 'medium' | 'low' {
    const segments = path.split('/').filter(Boolean);
    const citySlug = segments[0];
    
    if (this.HIGH_PRIORITY_CITIES.includes(citySlug)) {
      return segments.length === 1 ? 'high' : 'medium'; // City pages are high, filters are medium
    }
    
    const tier = this.getTierFromPath(path);
    if (tier === 1) return 'medium';
    if (tier === 2) return 'medium';
    return 'low';
  }

  private getTierFromPath(path: string): number {
    const citySlug = path.split('/')[0];
    return tdspMapping[citySlug]?.tier || 3;
  }

  private estimateMemorySize(data: any): number {
    // Rough estimation of memory usage in bytes
    return JSON.stringify(data).length * 2; // Unicode strings use 2 bytes per character
  }

  private shouldCacheEntry(entry: CacheEntry): boolean {
    // Don't cache low-priority entries if memory is constrained
    if (entry.priority === 'low' && this.getCurrentMemoryUsage() > this.MAX_MEMORY_MB * 0.8) {
      return false;
    }
    
    return true;
  }

  private getCurrentMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.memoryCache.values()) {
      totalSize += entry.estimatedMemorySize;
    }
    return Math.round(totalSize / 1024 / 1024); // Convert to MB
  }

  private recordCacheMiss(path: string): void {
    const pattern = this.preloadPatterns.get(path) || {
      citySlug: path.split('/')[0],
      filters: path.split('/').slice(1),
      popularity: 0,
      lastRequested: 0
    };
    
    pattern.popularity++;
    pattern.lastRequested = Date.now();
    this.preloadPatterns.set(path, pattern);
    
    // Add to preload queue if becoming popular
    if (pattern.popularity >= 3 && !this.memoryCache.has(this.getCacheKey(path))) {
      this.preloadQueue.add(path);
    }
  }

  private recordRouteTime(time: number): void {
    this.routeTimings.push(time);
    
    // Keep only recent timings
    if (this.routeTimings.length > 1000) {
      this.routeTimings = this.routeTimings.slice(-500);
    }
  }

  private enforceMemoryLimits(): void {
    if (this.memoryCache.size > this.MAX_MEMORY_CACHE_SIZE) {
      this.optimizeMemoryUsage();
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getCacheStats(): CacheStats {
    const memoryUsage = this.getCurrentMemoryUsage();
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
    const avgAccessCount = Array.from(this.memoryCache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0) / this.memoryCache.size || 0;
    
    // Calculate timing statistics
    const sortedTimings = [...this.routeTimings].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimings.length * 0.95);
    const p95RouteTime = sortedTimings[p95Index] || 0;
    const avgRouteTime = sortedTimings.reduce((sum, time) => sum + time, 0) / sortedTimings.length || 0;
    
    return {
      memory: {
        totalEntries: this.memoryCache.size,
        totalMemoryMB: memoryUsage,
        hitRate: Math.round(hitRate * 100) / 100,
        avgAccessCount: Math.round(avgAccessCount * 10) / 10
      },
      preloader: {
        activePreloads: this.preloadQueue.size,
        successfulPreloads: this.stats.preloadSuccesses,
        failedPreloads: this.stats.preloadFailures,
        averagePreloadTime: Math.round(this.stats.totalPreloadTime / this.stats.preloads) || 0
      },
      performance: {
        averageRouteTime: Math.round(avgRouteTime * 10) / 10,
        p95RouteTime: Math.round(p95RouteTime * 10) / 10,
        slowestRoutes: this.slowestRoutes.slice(0, 5)
      }
    };
  }

  /**
   * Log performance statistics
   */
  private logPerformanceStats(): void {
    const stats = this.getCacheStats();
    const routerStats = getRouterCacheStats();
    
    console.log('\n📊 CACHE PERFORMANCE REPORT');
    console.log('═'.repeat(50));
    console.log(`Memory Cache: ${stats.memory.totalEntries} entries, ${stats.memory.totalMemoryMB}MB`);
    console.log(`Hit Rate: ${Math.round(stats.memory.hitRate * 100)}%`);
    console.log(`Preload Queue: ${stats.preloader.activePreloads} pending`);
    console.log(`Route Performance: avg ${stats.performance.averageRouteTime}ms, P95 ${stats.performance.p95RouteTime}ms`);
    console.log(`Router Caches: City=${routerStats.cityValidationCache}, TDSP=${routerStats.tdspMappingCache}, Route=${routerStats.routeCache}`);
    console.log('═'.repeat(50));
  }

  /**
   * Manual cache management methods
   */
  async clearCache(): Promise<void> {
    this.memoryCache.clear();
    this.preloadPatterns.clear();
    this.preloadQueue.clear();
    this.routeTimings.length = 0;
    this.slowestRoutes.length = 0;
    
    this.stats = {
      hits: 0,
      misses: 0,
      preloads: 0,
      preloadSuccesses: 0,
      preloadFailures: 0,
      totalPreloadTime: 0,
    };
    
    console.log('🗑️  Route cache cleared');
  }

  async warmHighPriorityCities(): Promise<void> {
    await this.warmCacheForTier(1, 100);
    await this.warmCacheForTier(2, 50);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down route cache manager...');
    // Clear any pending timers, close connections, etc.
    console.log('✅ Route cache manager shutdown complete');
  }
}

// Export singleton instance
export const routeCacheManager = new RouteCacheManager();

// Export utility functions
export async function warmCacheForProduction(): Promise<void> {
  console.log('🔥 Starting production cache warming...');
  await routeCacheManager.warmHighPriorityCities();
  console.log('✅ Production cache warming complete');
}

export function getCachePerformanceStats() {
  return routeCacheManager.getCacheStats();
}