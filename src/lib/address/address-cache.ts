/**
 * Address-to-TDSP Mapping Cache System
 * 
 * Multi-layer caching strategy for address validation and TDSP resolution.
 * Optimizes performance while maintaining data freshness and accuracy.
 * 
 * Cache Layers:
 * 1. Memory Cache - Ultra-fast lookup for recent results
 * 2. Redis Cache - Shared cache across instances  
 * 3. Database Cache - Persistent storage with TTL
 * 4. File Cache - Static boundary data and ZIP+4 mappings
 * 
 * Cache Strategy:
 * - ZIP-only lookups: 24 hours TTL
 * - Address validations: 7 days TTL  
 * - TDSP boundaries: 30 days TTL (static data)
 * - API responses: 1 hour TTL
 */

import type { 
  AddressInfo, 
  NormalizedAddress, 
  AddressTdspResult, 
  TdspInfo 
} from '../../types/facets';
import { RedisCache } from '../api/redis-cache';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  source: 'memory' | 'redis' | 'database' | 'file';
  version: string;
}

export interface CacheConfig {
  enableMemoryCache: boolean;
  enableRedisCache: boolean;
  enableDatabaseCache: boolean;
  enableFileCache: boolean;
  memoryMaxSize: number;
  redisTTL: number;
  databaseTTL: number;
  fileTTL: number;
}

export interface CacheStats {
  hits: {
    memory: number;
    redis: number;
    database: number;
    file: number;
    total: number;
  };
  misses: number;
  evictions: number;
  size: {
    memory: number;
    redis: number;
    database: number;
    file: number;
  };
  hitRatio: number;
  averageResponseTime: {
    memory: number;
    redis: number;
    database: number;
    file: number;
  };
}

export class AddressCache {
  private config: CacheConfig;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private redisCache?: RedisCache;
  private stats: CacheStats;
  private readonly CACHE_VERSION = '1.0.0';

  // TTL configurations by data type
  private readonly TTL_CONFIG = {
    zipAnalysis: 86400000,      // 24 hours - ZIP code analysis
    addressValidation: 604800000, // 7 days - Address validation  
    tdspResolution: 3600000,    // 1 hour - TDSP resolution with API
    boundaryData: 2592000000,   // 30 days - Boundary/geographic data
    esidLookup: 2592000000,     // 30 days - ESID lookups (semi-static)
    multiTdspConfig: 86400000   // 24 hours - Multi-TDSP configuration
  };

  constructor(config: Partial<CacheConfig> = {}) {
    // Detect build/static generation environment and disable Redis
    const isBuildTime = process.env.NODE_ENV === 'development' || 
                       process.env.ASTRO_BUILD === 'true' ||
                       process.env.NETLIFY === 'true' ||
                       process.env.CI === 'true' ||
                       process.argv.includes('build') ||
                       process.argv.includes('astro');

    this.config = {
      enableMemoryCache: true,
      enableRedisCache: Boolean(process.env.REDIS_URL) && !isBuildTime,
      enableDatabaseCache: true,
      enableFileCache: true,
      memoryMaxSize: 1000, // entries
      redisTTL: 3600, // seconds
      databaseTTL: 86400, // seconds  
      fileTTL: 2592000, // seconds (30 days)
      ...config
    };

    this.stats = {
      hits: { memory: 0, redis: 0, database: 0, file: 0, total: 0 },
      misses: 0,
      evictions: 0,
      size: { memory: 0, redis: 0, database: 0, file: 0 },
      hitRatio: 0,
      averageResponseTime: { memory: 0, redis: 0, database: 0, file: 0 }
    };

    // Initialize Redis cache if enabled
    if (this.config.enableRedisCache) {
      this.redisCache = new RedisCache({
        redis: {
          url: process.env.REDIS_URL!,
          ttlSeconds: this.config.redisTTL,
          maxRetries: 3,
          retryDelayMs: 1000
        }
      });
    }

    // Set up memory cache cleanup
    this.setupMemoryCacheCleanup();
  }

  /**
   * Get cached ZIP code analysis
   */
  async getZipAnalysis(zipCode: string): Promise<any | null> {
    const key = `zip_analysis:${zipCode}`;
    return this.get(key, 'zipAnalysis');
  }

  /**
   * Set ZIP code analysis cache
   */
  async setZipAnalysis(zipCode: string, analysis: any): Promise<void> {
    const key = `zip_analysis:${zipCode}`;
    await this.set(key, analysis, 'zipAnalysis');
  }

  /**
   * Get cached address validation result
   */
  async getAddressValidation(address: AddressInfo): Promise<any | null> {
    const key = this.getAddressKey('address_validation', address);
    return this.get(key, 'addressValidation');
  }

  /**
   * Set address validation cache
   */
  async setAddressValidation(address: AddressInfo, validation: any): Promise<void> {
    const key = this.getAddressKey('address_validation', address);
    await this.set(key, validation, 'addressValidation');
  }

  /**
   * Get cached TDSP resolution result
   */
  async getTdspResolution(address: NormalizedAddress): Promise<AddressTdspResult | null> {
    const key = this.getNormalizedAddressKey('tdsp_resolution', address);
    return this.get(key, 'tdspResolution');
  }

  /**
   * Set TDSP resolution cache
   */
  async setTdspResolution(address: NormalizedAddress, result: AddressTdspResult): Promise<void> {
    const key = this.getNormalizedAddressKey('tdsp_resolution', address);
    await this.set(key, result, 'tdspResolution');
  }

  /**
   * Get cached boundary data for ZIP code
   */
  async getBoundaryData(zipCode: string): Promise<any | null> {
    const key = `boundary_data:${zipCode}`;
    return this.get(key, 'boundaryData');
  }

  /**
   * Set boundary data cache
   */
  async setBoundaryData(zipCode: string, data: any): Promise<void> {
    const key = `boundary_data:${zipCode}`;
    await this.set(key, data, 'boundaryData');
  }

  /**
   * Get cached ESID lookup result
   */
  async getEsidLookup(address: NormalizedAddress): Promise<any | null> {
    const key = this.getNormalizedAddressKey('esid_lookup', address);
    return this.get(key, 'esidLookup');
  }

  /**
   * Set ESID lookup cache
   */
  async setEsidLookup(address: NormalizedAddress, result: any): Promise<void> {
    const key = this.getNormalizedAddressKey('esid_lookup', address);
    await this.set(key, result, 'esidLookup');
  }

  /**
   * Generic get method with multi-layer cache lookup
   */
  private async get<T>(key: string, type: keyof typeof this.TTL_CONFIG): Promise<T | null> {
    const startTime = Date.now();
    const source: CacheEntry<T>['source'] | null = null;
    const result: T | null = null;

    try {
      // Layer 1: Memory Cache
      if (this.config.enableMemoryCache) {
        const memoryResult = this.getFromMemory<T>(key);
        if (memoryResult) {
          this.updateStats('memory', Date.now() - startTime, true);
          return memoryResult;
        }
      }

      // Layer 2: Redis Cache
      if (this.config.enableRedisCache && this.redisCache) {
        try {
          const redisResult = await this.getFromRedis<T>(key);
          if (redisResult) {
            // Store in memory for faster future access
            if (this.config.enableMemoryCache) {
              this.setInMemory(key, redisResult, type);
            }
            this.updateStats('redis', Date.now() - startTime, true);
            return redisResult;
          }
        } catch (error) {
          console.warn('Redis cache error:', error);
        }
      }

      // Layer 3: Database Cache
      if (this.config.enableDatabaseCache) {
        try {
          const dbResult = await this.getFromDatabase<T>(key);
          if (dbResult) {
            // Store in upper cache layers
            if (this.config.enableMemoryCache) {
              this.setInMemory(key, dbResult, type);
            }
            if (this.config.enableRedisCache && this.redisCache) {
              await this.setInRedis(key, dbResult, type);
            }
            this.updateStats('database', Date.now() - startTime, true);
            return dbResult;
          }
        } catch (error) {
          console.warn('Database cache error:', error);
        }
      }

      // Layer 4: File Cache (for static data)
      if (this.config.enableFileCache && this.isFileCacheableType(type)) {
        try {
          const fileResult = await this.getFromFile<T>(key, type);
          if (fileResult) {
            // Store in upper cache layers
            if (this.config.enableMemoryCache) {
              this.setInMemory(key, fileResult, type);
            }
            this.updateStats('file', Date.now() - startTime, true);
            return fileResult;
          }
        } catch (error) {
          console.warn('File cache error:', error);
        }
      }

      // Cache miss
      this.stats.misses++;
      this.updateHitRatio();
      return null;

    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      this.updateHitRatio();
      return null;
    }
  }

  /**
   * Generic set method with multi-layer cache storage
   */
  private async set<T>(key: string, value: T, type: keyof typeof this.TTL_CONFIG): Promise<void> {
    try {
      // Store in all enabled cache layers
      const promises: Promise<void>[] = [];

      if (this.config.enableMemoryCache) {
        this.setInMemory(key, value, type);
      }

      if (this.config.enableRedisCache && this.redisCache) {
        promises.push(this.setInRedis(key, value, type));
      }

      if (this.config.enableDatabaseCache) {
        promises.push(this.setInDatabase(key, value, type));
      }

      if (this.config.enableFileCache && this.isFileCacheableType(type)) {
        promises.push(this.setInFile(key, value, type));
      }

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Memory Cache Implementation
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      this.stats.evictions++;
      return null;
    }

    return entry.data;
  }

  private setInMemory<T>(key: string, value: T, type: keyof typeof this.TTL_CONFIG): void {
    const ttl = this.TTL_CONFIG[type];
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      source: 'memory',
      version: this.CACHE_VERSION
    };

    // Check if we need to evict entries
    if (this.memoryCache.size >= this.config.memoryMaxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.memoryCache.set(key, entry);
    this.stats.size.memory = this.memoryCache.size;
  }

  // Redis Cache Implementation
  private async getFromRedis<T>(key: string): Promise<T | null> {
    if (!this.redisCache) return null;
    
    try {
      const value = await this.redisCache.get({ tdsp_duns: key } as any);
      return value as T;
    } catch (error) {
      console.warn('Redis get error:', error);
      return null;
    }
  }

  private async setInRedis<T>(key: string, value: T, type: keyof typeof this.TTL_CONFIG): Promise<void> {
    if (!this.redisCache) return;

    try {
      await this.redisCache.set({ tdsp_duns: key } as any, value as any);
    } catch (error) {
      console.warn('Redis set error:', error);
    }
  }

  // Database Cache Implementation
  private async getFromDatabase<T>(key: string): Promise<T | null> {
    // This would integrate with the existing plan repository
    // For now, return null as placeholder
    return null;
  }

  private async setInDatabase<T>(key: string, value: T, type: keyof typeof this.TTL_CONFIG): Promise<void> {
    // This would integrate with the existing plan repository
    // For now, this is a placeholder
  }

  // File Cache Implementation (for static boundary data)
  private async getFromFile<T>(key: string, type: keyof typeof this.TTL_CONFIG): Promise<T | null> {
    // This would read from pre-generated boundary files
    // For now, return null as placeholder
    return null;
  }

  private async setInFile<T>(key: string, value: T, type: keyof typeof this.TTL_CONFIG): Promise<void> {
    // This would write to cache files for static data
    // For now, this is a placeholder
  }

  // Helper Methods
  private getAddressKey(prefix: string, address: AddressInfo): string {
    return `${prefix}:${[
      address.street.toLowerCase().trim(),
      address.city.toLowerCase().trim(),
      address.state.toLowerCase(),
      address.zipCode,
      address.zip4 || '',
      address.unitNumber || ''
    ].join('|')}`;
  }

  private getNormalizedAddressKey(prefix: string, address: NormalizedAddress): string {
    return `${prefix}:${[
      address.streetNumber,
      address.streetName.toLowerCase(),
      address.streetType.toLowerCase(),
      address.city.toLowerCase(),
      address.zipCode,
      address.zip4 || '',
      address.unitType || '',
      address.unitNumber || ''
    ].join('|')}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private isFileCacheableType(type: keyof typeof this.TTL_CONFIG): boolean {
    return ['boundaryData', 'multiTdspConfig'].includes(type);
  }

  private evictLeastRecentlyUsed(): void {
    // Simple LRU eviction - remove oldest entry
    const oldestKey = this.memoryCache.keys().next().value;
    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  private updateStats(source: keyof CacheStats['hits'], responseTime: number, isHit: boolean): void {
    if (isHit) {
      this.stats.hits[source]++;
      this.stats.hits.total++;
      
      // Update average response time (simple moving average)
      const currentAvg = this.stats.averageResponseTime[source];
      this.stats.averageResponseTime[source] = currentAvg === 0 
        ? responseTime 
        : (currentAvg + responseTime) / 2;
    }
    
    this.updateHitRatio();
  }

  private updateHitRatio(): void {
    const total = this.stats.hits.total + this.stats.misses;
    this.stats.hitRatio = total > 0 ? this.stats.hits.total / total : 0;
  }

  private setupMemoryCacheCleanup(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      let evicted = 0;
      
      for (const [key, entry] of this.memoryCache.entries()) {
        if (this.isExpired(entry)) {
          this.memoryCache.delete(key);
          evicted++;
        }
      }
      
      if (evicted > 0) {
        this.stats.evictions += evicted;
        this.stats.size.memory = this.memoryCache.size;
        console.log(`Cleaned up ${evicted} expired cache entries`);
      }
    }, 300000); // 5 minutes
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmupCache(commonZipCodes: string[]): Promise<void> {
    console.log(`Warming up cache for ${commonZipCodes.length} ZIP codes...`);
    
    // This would pre-load frequently accessed ZIP codes and their boundary data
    // For now, this is a placeholder
    
    console.log('Cache warmup completed');
  }

  /**
   * Clear all cache layers
   */
  async clearAllCaches(): Promise<void> {
    // Memory cache
    this.memoryCache.clear();
    this.stats.size.memory = 0;

    // Redis cache
    if (this.redisCache) {
      await this.redisCache.clear();
    }

    // Reset stats
    this.stats = {
      hits: { memory: 0, redis: 0, database: 0, file: 0, total: 0 },
      misses: 0,
      evictions: 0,
      size: { memory: 0, redis: 0, database: 0, file: 0 },
      hitRatio: 0,
      averageResponseTime: { memory: 0, redis: 0, database: 0, file: 0 }
    };

    console.log('All caches cleared');
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Optimize cache performance
   */
  async optimizeCache(): Promise<{
    recommendedActions: string[];
    performanceMetrics: any;
  }> {
    const stats = this.getStats();
    const recommendedActions: string[] = [];

    // Analyze hit ratios
    if (stats.hitRatio < 0.8) {
      recommendedActions.push('Consider increasing cache TTL values for better hit ratio');
    }

    // Analyze memory usage
    if (stats.size.memory > this.config.memoryMaxSize * 0.9) {
      recommendedActions.push('Consider increasing memory cache size or reducing TTL');
    }

    // Analyze response times
    const avgResponseTime = Object.values(stats.averageResponseTime).reduce((a, b) => a + b, 0) / 4;
    if (avgResponseTime > 100) {
      recommendedActions.push('High cache response times detected - consider cache optimization');
    }

    return {
      recommendedActions,
      performanceMetrics: {
        hitRatio: stats.hitRatio,
        totalHits: stats.hits.total,
        totalMisses: stats.misses,
        averageResponseTime: avgResponseTime,
        memoryUtilization: stats.size.memory / this.config.memoryMaxSize
      }
    };
  }
}

// Export default instance
export const addressCache = new AddressCache();

// Export utility functions
export function createCacheKey(prefix: string, ...parts: string[]): string {
  return `${prefix}:${parts.map(p => p.toLowerCase().trim()).join('|')}`;
}