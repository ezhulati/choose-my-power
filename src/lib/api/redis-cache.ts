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
      console.log('Redis not configured, using memory cache only');
      return;
    }

    try {
      // Dynamic import for Redis to handle environments where it's not available
      const Redis = await import('ioredis').catch(() => null);
      if (!Redis) {
        console.warn('Redis not available, falling back to memory cache only');
        return;
      }

      this.redisClient = new Redis.default(this.config.redis.url, {
        retryDelayOnFailover: this.config.redis.retryDelayMs,
        maxRetriesPerRequest: this.config.redis.maxRetries,
        lazyConnect: true,
        maxmemoryPolicy: 'allkeys-lru'
      });

      this.redisClient.on('connect', () => {
        this.redisConnected = true;
        this.stats.redis.connected = true;
        console.log('Redis cache connected successfully');
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

    // Store in Redis if available
    if (this.redisConnected && this.config.redis) {
      try {
        const redisKey = `cmp:plans:${key}`;
        const ttlSeconds = customTtlMs ? Math.floor(customTtlMs / 1000) : this.config.redis.ttlSeconds;
        
        await this.redisClient.setex(
          redisKey,
          ttlSeconds,
          JSON.stringify({
            data: plans,
            timestamp: Date.now(),
            params
          })
        );
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

    const redisKey = `cmp:plans:${key}`;
    const result = await this.redisClient.get(redisKey);
    
    if (!result) return null;

    try {
      const parsed = JSON.parse(result);
      return parsed.data;
    } catch (error) {
      console.warn('Failed to parse Redis cache data:', error);
      // Remove corrupted data
      await this.redisClient.del(redisKey);
      return null;
    }
  }

  async warmCache(fetchFunction: (params: ApiParams) => Promise<Plan[]>): Promise<void> {
    if (!this.config.warming.enabled) return;

    const startTime = Date.now();
    let citiesWarmed = 0;
    let plansWarmed = 0;

    console.log('Starting cache warming...');

    for (const cityDuns of this.config.warming.popularCities) {
      for (const filters of this.config.warming.commonFilters) {
        try {
          const params: ApiParams = {
            tdsp_duns: cityDuns,
            ...filters
          };

          const existing = await this.get(params);
          if (!existing) {
            const plans = await fetchFunction(params);
            if (plans.length > 0) {
              await this.set(params, plans);
              plansWarmed += plans.length;
            }
          }
        } catch (error) {
          console.warn(`Cache warming failed for ${cityDuns}:`, error);
        }
      }
      citiesWarmed++;
      
      // Add small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.stats.warming = {
      lastRun: Date.now(),
      citiesWarmed,
      plansWarmed
    };

    console.log(`Cache warming completed in ${Date.now() - startTime}ms: ${citiesWarmed} cities, ${plansWarmed} plans`);
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

    // Remove from Redis cache
    if (this.redisConnected) {
      try {
        const pattern = `cmp:plans:*${cityDuns}*`;
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } catch (error) {
        this.stats.redis.errors++;
        console.warn('Redis invalidation error:', error);
      }
    }
  }

  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear Redis cache
    if (this.redisConnected) {
      try {
        const keys = await this.redisClient.keys('cmp:plans:*');
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
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
      }, {} as any);

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

  getStats(): CacheStats {
    this.stats.memory.size = this.memoryCache.size;
    this.updateHitRates();
    return { ...this.stats };
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
  const defaultConfig: CacheConfig = {
    redis: process.env.REDIS_URL ? {
      url: process.env.REDIS_URL,
      maxRetries: 3,
      retryDelayMs: 2000,
      ttlSeconds: 3600, // 1 hour
      maxMemoryMb: 256
    } : undefined,
    memory: {
      maxEntries: 1000,
      ttlMs: 1800000, // 30 minutes
      cleanupIntervalMs: 300000 // 5 minutes
    },
    warming: {
      enabled: process.env.NODE_ENV === 'production',
      popularCities: [
        '1039940674000', // Dallas/Fort Worth (Oncor)
        '957877905',     // Houston (CenterPoint)
        '007924772',     // Austin (AEP Central)
        '007929441'      // Corpus Christi/South Texas (TNMP)
      ],
      commonFilters: [
        {}, // No filters (default)
        { term: 12 }, // 12-month term
        { term: 24 }, // 24-month term
        { percent_green: 100 }, // 100% green
        { is_pre_pay: false, term: 12 } // Non-prepaid 12-month
      ]
    }
  };

  return new RedisCache({
    ...defaultConfig,
    ...config,
    memory: { ...defaultConfig.memory, ...config.memory },
    redis: config.redis !== undefined ? { ...defaultConfig.redis, ...config.redis } : defaultConfig.redis,
    warming: { ...defaultConfig.warming, ...config.warming }
  });
}