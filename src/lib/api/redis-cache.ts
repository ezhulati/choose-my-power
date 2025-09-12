/**
 * Redis Caching Layer for ComparePower API
 * Provides tiered caching with memory -> Redis -> API fallback
 * Includes cache warming and invalidation strategies
 */

import type { Plan, ApiParams } from '../../types/facets';

export interface CacheConfig {
  redis?: {
    url: string;
    maxRetries: number;
    retryDelayMs: number;
    ttlSeconds: number;
    maxMemoryMb: number;
    keyPrefix?: string;
    compression?: boolean;
    pipeline?: boolean;
  };
  memory: {
    maxEntries: number;
    ttlMs: number;
    cleanupIntervalMs: number;
  };
  warming: {
    enabled: boolean;
    popularCities: string[];
    commonFilters: Partial<ApiParams>[];
    batchSize: number;
    concurrentBatches: number;
  };
  production: {
    massDeployment: boolean;
    priorityTiers: boolean;
    backgroundWarming: boolean;
  };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
}

interface CacheStats {
  memory: {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  };
  redis: {
    connected: boolean;
    hits: number;
    misses: number;
    hitRate: number;
    errors: number;
  };
  warming: {
    lastRun: number;
    citiesWarmed: number;
    plansWarmed: number;
  };
}

export class RedisCache {
  private memoryCache = new Map<string, CacheEntry<Plan[]>>();
  private redisClient: any = null;
  private redisConnected = false;
  private stats: CacheStats;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private config: CacheConfig) {
    this.stats = {
      memory: { size: 0, hits: 0, misses: 0, hitRate: 0 },
      redis: { connected: false, hits: 0, misses: 0, hitRate: 0, errors: 0 },
      warming: { lastRun: 0, citiesWarmed: 0, plansWarmed: 0 }
    };

    this.initializeRedis();
    this.startMemoryCleanup();
  }

  private async initializeRedis(): Promise<void> {
    if (!this.config.redis) {
      console.warn('Redis not configured, using memory cache only');
      return;
    }

    // Detect build/static generation environment and disable Redis
    const isBuildTime = process.env.NODE_ENV === 'development' || 
                       process.env.ASTRO_BUILD === 'true' ||
                       process.env.NETLIFY === 'true' ||
                       process.env.CI === 'true' ||
                       process.argv.includes('build') ||
                       process.argv.includes('astro');

    if (isBuildTime) {
      console.warn('Build environment detected, using memory cache only (Redis disabled)');
      return;
    }

    try {
      // Dynamic import for Redis to handle environments where it's not available
      const Redis = await import('ioredis').catch(() => null);
      if (!Redis) {
        console.warn('Redis not available, falling back to memory cache only');
        return;
      }

      // Production-optimized Redis configuration
      const redisConfig = {
        retryDelayOnFailover: this.config.redis.retryDelayMs,
        maxRetriesPerRequest: this.config.redis.maxRetries,
        lazyConnect: true,
        maxmemoryPolicy: 'allkeys-lru',
        // Production optimizations for high-volume deployment
        connectTimeout: 10000,
        commandTimeout: 5000,
        enableAutoPipelining: this.config.redis.pipeline !== false,
        maxLoadingTimeout: 30000,
        // Connection pool settings for high concurrency
        family: 4,
        keepAlive: true,
        // Compression for large payloads (881 cities)
        compression: this.config.redis.compression ? 'gzip' : undefined
      };

      this.redisClient = new Redis.default(this.config.redis.url, redisConfig);

      this.redisClient.on('connect', () => {
        this.redisConnected = true;
        this.stats.redis.connected = true;
        console.warn('Redis cache connected successfully with production optimizations');
        
        // Set Redis memory optimization for 881 cities
        this.optimizeRedisForMassDeployment();
      });

      this.redisClient.on('error', (error: Error) => {
        this.redisConnected = false;
        this.stats.redis.connected = false;
        this.stats.redis.errors++;
        console.warn('Redis cache error:', error.message);
      });

      await this.redisClient.connect();
    } catch (error) {
      console.warn('Failed to initialize Redis:', error);
      this.redisConnected = false;
    }
  }
  
  /**
   * Optimize Redis configuration for mass deployment of 881 cities
   */
  private async optimizeRedisForMassDeployment(): Promise<void> {
    if (!this.redisClient || !this.config.production?.massDeployment) return;
    
    try {
      // Set optimal memory policy for 881 cities worth of data
      await this.redisClient.config('SET', 'maxmemory-policy', 'allkeys-lru');
      
      // Optimize for large datasets
      await this.redisClient.config('SET', 'hash-max-ziplist-entries', '1024');
      await this.redisClient.config('SET', 'hash-max-ziplist-value', '8192');
      
      // Enable compression for large city datasets
      if (this.config.redis?.compression) {
        console.warn('Redis optimized for mass deployment with compression enabled');
      }
    } catch (error) {
      console.warn('Failed to optimize Redis for mass deployment:', error);
    }
  }

  private startMemoryCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupMemoryCache();
    }, this.config.memory.cleanupIntervalMs);
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    const entries = Array.from(this.memoryCache.entries());
    
    // Remove expired entries
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
      }
    }

    // If still over limit, remove least recently used
    if (this.memoryCache.size > this.config.memory.maxEntries) {
      const sortedEntries = entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
      const excessCount = this.memoryCache.size - this.config.memory.maxEntries;
      
      for (let i = 0; i < excessCount; i++) {
        this.memoryCache.delete(sortedEntries[i][0]);
      }
    }

    this.stats.memory.size = this.memoryCache.size;
  }

  async get(params: ApiParams): Promise<Plan[] | null> {
    const key = this.generateCacheKey(params);
    
    // Try memory cache first
    const memoryResult = this.getFromMemory(key);
    if (memoryResult) {
      this.stats.memory.hits++;
      this.updateHitRates();
      return memoryResult;
    }
    
    this.stats.memory.misses++;

    // Try Redis cache
    if (this.redisConnected) {
      try {
        const redisResult = await this.getFromRedis(key);
        if (redisResult) {
          // Store in memory for faster next access
          this.setInMemory(key, redisResult, this.config.memory.ttlMs);
          this.stats.redis.hits++;
          this.updateHitRates();
          return redisResult;
        }
        this.stats.redis.misses++;
      } catch (error) {
        this.stats.redis.errors++;
        console.warn('Redis get error:', error);
      }
    }

    this.updateHitRates();
    return null;
  }

  async set(params: ApiParams, plans: Plan[], customTtlMs?: number): Promise<void> {
    const key = this.generateCacheKey(params);
    const ttl = customTtlMs || this.config.memory.ttlMs;
    
    // Always store in memory
    this.setInMemory(key, plans, ttl);

    // Store in Redis if available with production optimizations
    if (this.redisConnected && this.config.redis) {
      try {
        const keyPrefix = this.config.redis.keyPrefix || 'cmp:plans:';
        const redisKey = `${keyPrefix}${key}`;
        const ttlSeconds = customTtlMs ? Math.floor(customTtlMs / 1000) : this.config.redis.ttlSeconds;
        
        const cacheData = {
          data: plans,
          timestamp: Date.now(),
          params,
          version: '2.0' // For cache versioning during deployments
        };
        
        const serializedData = JSON.stringify(cacheData);
        
        // Use compression for large datasets in mass deployment
        if (this.config.redis.compression && plans.length > 20) {
          try {
            const zlib = await import('zlib');
            const compressed = zlib.gzipSync(serializedData);
            
            // Use pipeline for better performance with compression
            const pipeline = this.redisClient.pipeline();
            pipeline.setex(`${redisKey}:gz`, ttlSeconds, compressed.toString('base64'));
            pipeline.setex(`${redisKey}:meta`, ttlSeconds, JSON.stringify({
              compressed: true,
              originalSize: serializedData.length,
              compressedSize: compressed.length
            }));
            
            await pipeline.exec();
          } catch (compressionError) {
            // Fallback to uncompressed if compression fails
            await this.redisClient.setex(redisKey, ttlSeconds, serializedData);
          }
        } else {
          // Standard uncompressed storage
          if (this.config.redis.pipeline) {
            const pipeline = this.redisClient.pipeline();
            pipeline.setex(redisKey, ttlSeconds, serializedData);
            await pipeline.exec();
          } else {
            await this.redisClient.setex(redisKey, ttlSeconds, serializedData);
          }
        }
        
      } catch (error) {
        this.stats.redis.errors++;
        console.warn('Redis set error:', error);
      }
    }
  }

  private getFromMemory(key: string): Plan[] | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    entry.accessCount++;
    entry.lastAccess = now;
    return entry.data;
  }

  private setInMemory(key: string, plans: Plan[], ttl: number): void {
    const now = Date.now();
    this.memoryCache.set(key, {
      data: plans,
      timestamp: now,
      ttl,
      accessCount: 1,
      lastAccess: now
    });
  }

  private async getFromRedis(key: string): Promise<Plan[] | null> {
    if (!this.redisClient) return null;

    const keyPrefix = this.config.redis?.keyPrefix || 'cmp:plans:';
    const redisKey = `${keyPrefix}${key}`;
    
    try {
      // Check if data is compressed
      const metaResult = await this.redisClient.get(`${redisKey}:meta`);
      
      if (metaResult) {
        // Handle compressed data
        const meta = JSON.parse(metaResult);
        if (meta.compressed) {
          const compressedData = await this.redisClient.get(`${redisKey}:gz`);
          if (!compressedData) return null;
          
          try {
            const zlib = await import('zlib');
            const compressed = Buffer.from(compressedData, 'base64');
            const decompressed = zlib.gunzipSync(compressed).toString();
            const parsed = JSON.parse(decompressed);
            return parsed.data;
          } catch (decompressionError) {
            console.warn('Failed to decompress Redis cache data:', decompressionError);
            // Clean up corrupted compressed data
            await this.redisClient.del(`${redisKey}:gz`, `${redisKey}:meta`);
            return null;
          }
        }
      }
      
      // Handle uncompressed data (standard path)
      const result = await this.redisClient.get(redisKey);
      if (!result) return null;
      
      const parsed = JSON.parse(result);
      
      // Validate cache version for deployment compatibility
      if (parsed.version !== '2.0' && process.env.NODE_ENV === 'production') {
        console.warn('Invalidating old cache version:', parsed.version);
        await this.redisClient.del(redisKey);
        return null;
      }
      
      return parsed.data;
      
    } catch (error) {
      console.warn('Failed to parse Redis cache data:', error);
      // Remove corrupted data
      await this.redisClient.del(redisKey);
      return null;
    }
  }

  /**
   * Production-grade cache warming optimized for 881 Texas cities
   * Implements tiered warming and intelligent batching
   */
  async warmCache(fetchFunction: (params: ApiParams) => Promise<Plan[]>): Promise<void> {
    if (!this.config.warming.enabled) return;

    const startTime = Date.now();
    let citiesWarmed = 0;
    let plansWarmed = 0;
    let errors = 0;

    console.warn('Starting production cache warming for 881 cities...');

    // Group cities by TDSP for efficient batch processing
    const tdspGroups = new Map<string, string[]>();
    this.config.warming.popularCities.forEach(cityDuns => {
      if (!tdspGroups.has(cityDuns)) {
        tdspGroups.set(cityDuns, []);
      }
      tdspGroups.get(cityDuns)!.push(cityDuns);
    });

    // Process TDSP groups with controlled concurrency
    const batchPromises: Promise<void>[] = [];
    let activeBatches = 0;
    
    for (const [tdspDuns, cities] of tdspGroups) {
      // Limit concurrent batches to prevent overwhelming the system
      while (activeBatches >= this.config.warming.concurrentBatches) {
        await Promise.race(batchPromises);
        activeBatches--;
      }
      
      activeBatches++;
      const batchPromise = this.warmTdspBatch(tdspDuns, cities, fetchFunction)
        .then(result => {
          citiesWarmed += result.citiesWarmed;
          plansWarmed += result.plansWarmed;
          errors += result.errors;
        })
        .catch(error => {
          console.warn(`TDSP batch warming failed for ${tdspDuns}:`, error);
          errors++;
        });
        
      batchPromises.push(batchPromise);
    }

    // Wait for all batches to complete
    await Promise.all(batchPromises);

    this.stats.warming = {
      lastRun: Date.now(),
      citiesWarmed,
      plansWarmed
    };

    const duration = Date.now() - startTime;
    console.warn(`Production cache warming completed:`);
    console.warn(`  Duration: ${Math.round(duration / 1000)}s`);
    console.warn(`  Cities: ${citiesWarmed}`);
    console.warn(`  Plans: ${plansWarmed}`);
    console.warn(`  Errors: ${errors}`);
    console.warn(`  Success Rate: ${Math.round(((citiesWarmed - errors) / citiesWarmed) * 100)}%`);
  }
  
  /**
   * Warm cache for a specific TDSP batch
   */
  private async warmTdspBatch(
    tdspDuns: string, 
    cities: string[], 
    fetchFunction: (params: ApiParams) => Promise<Plan[]>
  ): Promise<{ citiesWarmed: number; plansWarmed: number; errors: number }> {
    let citiesWarmed = 0;
    let plansWarmed = 0;
    let errors = 0;
    
    try {
      // Make single API call for this TDSP
      const baseParams: ApiParams = { tdsp_duns: tdspDuns };
      const allPlans = await fetchFunction(baseParams);
      
      // Cache plans for all filter combinations
      const filterPromises = this.config.warming.commonFilters.map(async (filters) => {
        try {
          const params: ApiParams = {
            tdsp_duns: tdspDuns,
            ...filters
          };
          
          const existing = await this.get(params);
          if (!existing) {
            // Filter plans based on the specific parameters
            const filteredPlans = this.filterPlansForParams(allPlans, params);
            
            if (filteredPlans.length > 0) {
              await this.set(params, filteredPlans);
              plansWarmed += filteredPlans.length;
            }
          }
        } catch (error) {
          errors++;
          console.warn(`Filter warming failed for ${tdspDuns}:`, error);
        }
      });
      
      await Promise.all(filterPromises);
      citiesWarmed = cities.length;
      
    } catch (error) {
      errors++;
      console.warn(`TDSP warming failed for ${tdspDuns}:`, error);
    }
    
    // Add delay between TDSP batches
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return { citiesWarmed, plansWarmed, errors };
  }
  
  /**
   * Filter plans based on parameters (used in warming)
   */
  private filterPlansForParams(plans: Plan[], params: ApiParams): Plan[] {
    return plans.filter(plan => {
      // Apply filters similar to the main client
      if (params.term && plan.contract?.length !== params.term) return false;
      if (params.percent_green !== undefined && (plan.features?.greenEnergy || 0) < params.percent_green) return false;
      if (params.is_pre_pay !== undefined) {
        const isPrepaid = plan.features?.deposit?.required || false;
        if (params.is_pre_pay !== isPrepaid) return false;
      }
      return true;
    });
  }

  async invalidateCity(cityDuns: string): Promise<void> {
    // Remove from memory cache
    const keysToRemove: string[] = [];
    for (const [key, entry] of this.memoryCache.entries()) {
      if (key.includes(cityDuns)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => this.memoryCache.delete(key));

    // Remove from Redis cache with production optimizations
    if (this.redisConnected) {
      try {
        const keyPrefix = this.config.redis?.keyPrefix || 'cmp:plans:';
        
        // Use SCAN instead of KEYS for production safety
        const stream = this.redisClient.scanStream({
          match: `${keyPrefix}*${cityDuns}*`,
          count: 100 // Process in batches
        });
        
        const keysToDelete: string[] = [];
        
        stream.on('data', (keys: string[]) => {
          keysToDelete.push(...keys);
          
          // Also check for compressed data keys
          keys.forEach(key => {
            keysToDelete.push(`${key}:gz`, `${key}:meta`);
          });
        });
        
        stream.on('end', async () => {
          if (keysToDelete.length > 0) {
            // Use pipeline for efficient deletion
            const pipeline = this.redisClient.pipeline();
            keysToDelete.forEach(key => pipeline.del(key));
            await pipeline.exec();
            
            console.warn(`Invalidated ${keysToDelete.length} cache entries for city ${cityDuns}`);
          }
        });
        
      } catch (error) {
        this.stats.redis.errors++;
        console.warn('Redis invalidation error:', error);
      }
    }
  }

  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear Redis cache with production safety
    if (this.redisConnected) {
      try {
        const keyPrefix = this.config.redis?.keyPrefix || 'cmp:plans:';
        
        // Use SCAN for production safety with large datasets (881 cities)
        const stream = this.redisClient.scanStream({
          match: `${keyPrefix}*`,
          count: 1000 // Larger batches for clearing
        });
        
        let totalKeysDeleted = 0;
        
        stream.on('data', async (keys: string[]) => {
          if (keys.length > 0) {
            // Use pipeline for efficient batch deletion
            const pipeline = this.redisClient.pipeline();
            
            keys.forEach(key => {
              pipeline.del(key);
              pipeline.del(`${key}:gz`); // Clean up compressed data
              pipeline.del(`${key}:meta`); // Clean up metadata
            });
            
            const results = await pipeline.exec();
            totalKeysDeleted += keys.length;
          }
        });
        
        stream.on('end', () => {
          console.warn(`Cleared ${totalKeysDeleted} cache entries from Redis`);
        });
        
      } catch (error) {
        this.stats.redis.errors++;
        console.warn('Redis clear error:', error);
      }
    }

    this.resetStats();
  }

  private generateCacheKey(params: ApiParams): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key as keyof ApiParams];
        return result;
      }, {} as unknown);

    return Buffer.from(JSON.stringify(sortedParams)).toString('base64');
  }

  private updateHitRates(): void {
    const memoryTotal = this.stats.memory.hits + this.stats.memory.misses;
    this.stats.memory.hitRate = memoryTotal > 0 ? this.stats.memory.hits / memoryTotal : 0;

    const redisTotal = this.stats.redis.hits + this.stats.redis.misses;
    this.stats.redis.hitRate = redisTotal > 0 ? this.stats.redis.hits / redisTotal : 0;
  }

  private resetStats(): void {
    this.stats.memory = { size: 0, hits: 0, misses: 0, hitRate: 0 };
    this.stats.redis.hits = 0;
    this.stats.redis.misses = 0;
    this.stats.redis.hitRate = 0;
  }

  getStats(): CacheStats & { production?: unknown} {
    this.stats.memory.size = this.memoryCache.size;
    this.updateHitRates();
    
    const baseStats = { ...this.stats };
    
    // Add production-specific statistics for monitoring
    if (this.config.production?.massDeployment) {
      return {
        ...baseStats,
        production: {
          massDeployment: true,
          estimatedCitiesCached: Math.round(this.memoryCache.size / 5), // Rough estimate
          compressionEnabled: this.config.redis?.compression || false,
          pipelineEnabled: this.config.redis?.pipeline || false,
          redisMemoryMb: this.config.redis?.maxMemoryMb || 256
        }
      };
    }
    
    return baseStats;
  }

  isRedisConnected(): boolean {
    return this.redisConnected;
  }

  async disconnect(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch (error) {
        console.warn('Error closing Redis connection:', error);
      }
    }
  }
}

// Export a factory function to create cache instances
export function createCache(config: Partial<CacheConfig> = {}): RedisCache {
  const isProduction = process.env.NODE_ENV === 'production';
  const isMassDeployment = process.env.MASS_DEPLOYMENT === 'true';
  
  // Detect build/static generation environment and disable Redis
  const isBuildTime = process.env.NODE_ENV === 'development' || 
                     process.env.ASTRO_BUILD === 'true' ||
                     process.env.NETLIFY === 'true' ||
                     process.env.CI === 'true' ||
                     process.argv.includes('build') ||
                     process.argv.includes('astro');

  const defaultConfig: CacheConfig = {
    redis: process.env.REDIS_URL && !isBuildTime ? {
      url: process.env.REDIS_URL,
      maxRetries: isProduction ? 5 : 3,
      retryDelayMs: isProduction ? 1000 : 2000,
      ttlSeconds: isProduction ? 7200 : 3600, // 2 hours in production
      maxMemoryMb: isMassDeployment ? 1024 : 256, // 1GB for mass deployment
      keyPrefix: 'cmp:v2:',
      compression: isMassDeployment,
      pipeline: isProduction
    } : undefined,
    memory: {
      maxEntries: isMassDeployment ? 5000 : 1000, // More entries for 881 cities
      ttlMs: isProduction ? 3600000 : 1800000, // 1 hour in production
      cleanupIntervalMs: isProduction ? 600000 : 300000 // 10 minutes in production
    },
    warming: {
      enabled: isProduction,
      popularCities: [
        '1039940674000', // Dallas/Fort Worth (Oncor)
        '957877905',     // Houston (CenterPoint)
        '007924772',     // Austin (AEP Central)
        '007929441',     // Corpus Christi/South Texas (TNMP)
        '007923311'      // AEP North Texas
      ],
      commonFilters: [
        {}, // No filters (default)
        { term: 12 }, // 12-month term
        { term: 24 }, // 24-month term
        { percent_green: 100 }, // 100% green
        { is_pre_pay: false, term: 12 }, // Non-prepaid 12-month
        { is_pre_pay: true }, // Prepaid plans
        { is_time_of_use: true } // Time-of-use plans
      ],
      batchSize: isMassDeployment ? 50 : 10,
      concurrentBatches: isMassDeployment ? 5 : 2
    },
    production: {
      massDeployment: isMassDeployment,
      priorityTiers: isProduction,
      backgroundWarming: isProduction
    }
  };

  return new RedisCache({
    ...defaultConfig,
    ...config,
    memory: { ...defaultConfig.memory, ...config.memory },
    redis: config.redis !== undefined ? { ...defaultConfig.redis, ...config.redis } : defaultConfig.redis,
    warming: { ...defaultConfig.warming, ...config.warming },
    production: { ...defaultConfig.production, ...config.production }
  });
}

// Export production-specific cache warmer
export async function warmProductionCache(
  fetchFunction: (params: ApiParams) => Promise<Plan[]>,
  cityMappings?: Record<string, string>
): Promise<void> {
  const cache = createCache({
    production: { massDeployment: true, priorityTiers: true, backgroundWarming: true }
  });
  
  console.warn('Starting production cache warming for 881 cities...');
  
  if (cityMappings) {
    // Use provided city mappings for comprehensive warming
    const tdspDunsSet = new Set(Object.values(cityMappings));
    cache.config.warming.popularCities = Array.from(tdspDunsSet);
  }
  
  await cache.warmCache(fetchFunction);
  console.warn('Production cache warming complete');
}