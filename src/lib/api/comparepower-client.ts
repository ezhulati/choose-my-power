/**
 * ComparePower API Client - Production Ready
 * Handles all interactions with the ComparePower pricing API
 * Features:
 * - Tiered caching (Memory -> Redis -> Database -> API)
 * - Circuit breaker pattern for resilience
 * - Comprehensive error handling and recovery
 * - Request/response validation and transformation
 * - Exponential backoff retry logic
 * - Performance monitoring and logging
 * 
 * NOTE: This requires API access agreement with ComparePower
 * Contact: api-integrator agent for implementation details
 */

import type { Plan, ApiParams, CachedResponse } from '../../types/facets';
import { getProviderLogo, getProviderLogoUrl } from '../providers/logo-mapper';
import { planRepository } from '../database/plan-repository';
import { ComparePowerApiError, ApiErrorType, CircuitBreaker, type CircuitBreakerConfig } from './errors';
import { RedisCache, createCache, type CacheConfig } from './redis-cache';
import { validateCitySlug, getTdspFromCity, formatCityName } from '../../config/tdsp-mapping';

interface ComparePowerAPIConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retryAttempts: number;
  cacheTTL: number;
  circuitBreaker: CircuitBreakerConfig;
  cache: Partial<CacheConfig>;
  monitoring: {
    enableMetrics: boolean;
    logRequests: boolean;
    slowRequestThreshold: number;
  };
  rateLimit: {
    requestsPerSecond: number;
    burstLimit: number;
  };
}

// Updated to match actual API response structure
interface ComparePowerPlanResponse {
  _id: string;
  product: {
    _id: string;
    brand: {
      _id: string;
      name: string;
      puct_number: string;
      legal_name: string;
      contact_info: {
        sales: { phone_number: string };
        support: { 
          address: string; 
          email: string; 
          phone_number: string; 
        };
      };
    };
    name: string;
    term: number;
    family: string;
    percent_green: number;
    headline: string;
    early_termination_fee: number;
    description: string;
    is_pre_pay: boolean;
    is_time_of_use: boolean;
  };
  tdsp: {
    _id: string;
    name: string;
    short_name: string;
    abbreviation: string;
    duns_number: string;
  };
  expected_prices: Array<{
    usage: number;
    price: number;
    actual: number;
    valid: boolean;
  }>;
  display_pricing_500: {
    usage: number;
    avg: number; // Rate in dollars per kWh
    avg_cents?: number; // Rate in cents per kWh
    total: number;
  };
  display_pricing_1000: {
    usage: number;
    avg: number; // Rate in dollars per kWh  
    avg_cents?: number; // Rate in cents per kWh
    total: number;
  };
  display_pricing_2000: {
    usage: number;
    avg: number; // Rate in dollars per kWh
    avg_cents?: number; // Rate in cents per kWh
    total: number;
  };
  document_links: Array<{
    type: string;
    language: string;
    link: string;
  }>;
}

export class ComparePowerClient {
  private config: ComparePowerAPIConfig;
  private cache: Map<string, CachedResponse>;
  private redisCache: RedisCache;
  private circuitBreaker: CircuitBreaker;
  private requestQueue: Array<{ resolve: Function; reject: Function; fn: Function }> = [];
  private processingQueue = false;
  private lastRequestTime = 0;
  private requestCount = 0;
  private requestWindowStart = 0;
  private retryDelays = [1000, 2000, 4000, 8000, 16000]; // Extended exponential backoff
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    cacheHits: 0,
    circuitBreakerTrips: 0,
    rateLimitHits: 0
  };

  constructor(config: Partial<ComparePowerAPIConfig> = {}) {
    this.config = {
      baseUrl: process.env.COMPAREPOWER_API_URL || 'https://pricing.api.comparepower.com',
      apiKey: process.env.COMPAREPOWER_API_KEY,
      timeout: 15000, // 15 seconds for production
      retryAttempts: 5, // More retries for production
      cacheTTL: 3600000, // 1 hour
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 60000, // 1 minute
        monitoringInterval: 10000, // 10 seconds
        halfOpenMaxCalls: 3
      },
      cache: {
        redis: process.env.REDIS_URL ? {
          url: process.env.REDIS_URL,
          maxRetries: 3,
          retryDelayMs: 2000,
          ttlSeconds: 3600,
          maxMemoryMb: 256
        } : undefined
      },
      monitoring: {
        enableMetrics: process.env.NODE_ENV === 'production',
        logRequests: process.env.NODE_ENV !== 'production',
        slowRequestThreshold: 5000 // 5 seconds
      },
      rateLimit: {
        requestsPerSecond: 10,
        burstLimit: 20
      },
      ...config
    };
    
    this.cache = new Map();
    this.redisCache = createCache(this.config.cache);
    this.circuitBreaker = new CircuitBreaker(this.config.circuitBreaker);
    
    // Initialize cache warming in production
    if (process.env.NODE_ENV === 'production') {
      this.warmCacheAsync();
    }
  }

  /**
   * Fetch electricity plans with comprehensive caching and error handling
   * @param params - API parameters including TDSP DUNS and filters
   * @returns Promise<Plan[]> - Transformed plan data
   */
  async fetchPlans(params: ApiParams): Promise<Plan[]> {
    return this.executeWithRateLimit(async () => {
      const startTime = Date.now();
      this.metrics.totalRequests++;
      
      try {
        // Validate parameters
        this.validateParams(params);
        
        // Level 1: Redis + Memory cache
        const cachedPlans = await this.redisCache.get(params);
        if (cachedPlans) {
          this.metrics.cacheHits++;
          if (this.config.monitoring.logRequests) {
            console.log(`Cache hit for TDSP ${params.tdsp_duns}`);
          }
          return cachedPlans;
        }
        
        // Level 2: Database cache
        const dbCached = await planRepository.getPlansFromCache(params);
        if (dbCached) {
          // Store in Redis for faster next access
          await this.redisCache.set(params, dbCached);
          this.metrics.cacheHits++;
          return dbCached;
        }
        
        // Level 3: API call with circuit breaker
        const plans = await this.circuitBreaker.execute(async () => {
          return this.fetchFromApi(params);
        });
        
        // Store in all cache levels
        await Promise.all([
          this.redisCache.set(params, plans),
          planRepository.setPlansCache(params, plans, 1),
          planRepository.storePlans(plans as any, params.tdsp_duns)
        ]);
        
        this.metrics.successfulRequests++;
        this.updateMetrics(Date.now() - startTime);
        
        return plans;
        
      } catch (error) {
        this.metrics.failedRequests++;
        const responseTime = Date.now() - startTime;
        
        // Enhanced error handling with fallback strategies
        return this.handleApiError(error, params, responseTime);
      }
    });
  }

  /**
   * Fetch plans directly from API with enhanced error handling
   */
  private async fetchFromApi(params: ApiParams): Promise<Plan[]> {
    const url = this.buildApiUrl(params);
    const data = await this.makeRequestWithRetry(url);
    return this.transformPlans(data, params);
  }
  
  /**
   * Build API URL with proper parameter encoding
   */
  private buildApiUrl(params: ApiParams): string {
    const queryParams = new URLSearchParams({
      group: 'default',
      tdsp_duns: params.tdsp_duns,
      display_usage: String(params.display_usage || 1000),
    });

    // Add optional parameters with validation
    if (params.term && [6, 12, 18, 24, 36].includes(params.term)) {
      queryParams.set('term', String(params.term));
    }
    if (params.percent_green !== undefined && params.percent_green >= 0 && params.percent_green <= 100) {
      queryParams.set('percent_green', String(params.percent_green));
    }
    if (params.is_pre_pay !== undefined) queryParams.set('is_pre_pay', String(params.is_pre_pay));
    if (params.is_time_of_use !== undefined) queryParams.set('is_time_of_use', String(params.is_time_of_use));
    if (params.requires_auto_pay !== undefined) queryParams.set('requires_auto_pay', String(params.requires_auto_pay));
    if (params.brand_id) queryParams.set('brand_id', params.brand_id);

    return `${this.config.baseUrl}/api/plans/current?${queryParams}`;
  }

  /**
   * Make HTTP request with advanced retry logic and error handling
   */
  private async makeRequestWithRetry(url: string, attempt = 1): Promise<ComparePowerPlanResponse[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    const requestStart = Date.now();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'ChooseMyPower.org/1.0',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      };

      if (this.config.apiKey) {
        headers['X-API-Key'] = this.config.apiKey;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - requestStart;

      // Log slow requests
      if (responseTime > this.config.monitoring.slowRequestThreshold) {
        console.warn(`Slow API request: ${responseTime}ms for ${url}`);
      }

      if (!response.ok) {
        throw ComparePowerApiError.fromHttpError(
          response.status,
          response.statusText,
          { url, retryAttempt: attempt, responseTime }
        );
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new ComparePowerApiError(
          ApiErrorType.DATA_VALIDATION_ERROR,
          'Invalid API response format - expected array',
          { url, responseTime },
          false
        );
      }

      // Validate response data structure
      this.validateApiResponse(data);

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      const responseTime = Date.now() - requestStart;

      // Convert network errors to our error type
      let apiError: ComparePowerApiError;
      if (error instanceof ComparePowerApiError) {
        apiError = error;
      } else {
        apiError = ComparePowerApiError.fromNetworkError(
          error as Error,
          { url, retryAttempt: attempt, responseTime }
        );
      }

      // Retry logic with exponential backoff
      if (apiError.isRetryable && attempt < this.config.retryAttempts) {
        const delay = this.calculateRetryDelay(attempt);
        
        if (this.config.monitoring.logRequests) {
          console.warn(`API request failed (attempt ${attempt}/${this.config.retryAttempts}), retrying in ${delay}ms: ${apiError.message}`);
        }
        
        await this.sleep(delay);
        return this.makeRequestWithRetry(url, attempt + 1);
      }

      // Log final failure
      await planRepository.logApiCall(
        url,
        { tdsp_duns: new URL(url).searchParams.get('tdsp_duns') || 'unknown' },
        apiError.context.statusCode || 0,
        responseTime,
        apiError.message
      );

      throw apiError;
    }
  }

  /**
   * Transform API response to internal Plan format with validation
   */
  private transformPlans(apiData: ComparePowerPlanResponse[], params: ApiParams): Plan[] {
    const cityName = this.getCityNameFromTdsp(params.tdsp_duns);
    
    return apiData
      .filter(plan => this.validatePlanData(plan))
      .map(plan => {
        try {
          return {
            id: plan._id,
            name: plan.product.name,
            provider: {
              name: plan.product.brand.name,
              logo: getProviderLogoUrl(plan.product.brand.name),
              logoInfo: getProviderLogo(plan.product.brand.name),
              rating: 0, // Not provided in current API structure
              reviewCount: 0, // Not provided in current API structure
            },
            pricing: {
              // Use avg_cents if available (cents per kWh), otherwise convert from dollars
              rate500kWh: this.safeParseRate(plan.display_pricing_500?.avg_cents || (plan.display_pricing_500?.avg * 100)),
              rate1000kWh: this.safeParseRate(plan.display_pricing_1000?.avg_cents || (plan.display_pricing_1000?.avg * 100)),
              rate2000kWh: this.safeParseRate(plan.display_pricing_2000?.avg_cents || (plan.display_pricing_2000?.avg * 100)),
              ratePerKwh: this.safeParseRate(plan.display_pricing_1000?.avg_cents || (plan.display_pricing_1000?.avg * 100)),
              
              // Store the total cost from API (in dollars)
              total500kWh: this.safeParseNumber(plan.display_pricing_500?.total),
              total1000kWh: this.safeParseNumber(plan.display_pricing_1000?.total),
              total2000kWh: this.safeParseNumber(plan.display_pricing_2000?.total),
            },
            contract: {
              length: plan.product.term || 12,
              type: this.determineRateType(plan.product),
              earlyTerminationFee: this.safeParseNumber(plan.product.early_termination_fee),
              autoRenewal: false, // Not specified in API
              satisfactionGuarantee: false, // Not specified in API
            },
            features: {
              greenEnergy: Math.max(0, Math.min(100, plan.product.percent_green || 0)),
              billCredit: 0, // Not clearly specified in API
              freeTime: plan.product.is_time_of_use ? this.parseTimeOfUse(plan.product.headline) : undefined,
              deposit: {
                required: Boolean(plan.product.is_pre_pay),
                amount: 0, // Not specified in API
              },
            },
            availability: {
              enrollmentType: 'both' as const,
              serviceAreas: [plan.tdsp.name],
            },
          };
        } catch (error) {
          console.warn(`Failed to transform plan ${plan._id}:`, error);
          return null;
        }
      })
      .filter((plan): plan is Plan => plan !== null);
  }

  /**
   * Determine rate type from product information
   */
  private determineRateType(product: ComparePowerPlanResponse['product']): 'fixed' | 'variable' | 'indexed' {
    const name = product.name.toLowerCase();
    const headline = product.headline?.toLowerCase() || '';
    
    if (name.includes('variable') || headline.includes('variable')) return 'variable';
    if (name.includes('indexed') || headline.includes('indexed')) return 'indexed';
    return 'fixed'; // Most plans are fixed rate
  }

  /**
   * Parse time-of-use information from headline
   */
  private parseTimeOfUse(headline: string) {
    // Extract time patterns from headline (e.g., "FREE electricity from 9:00 am to 4:00 pm")
    const timeMatch = headline.match(/(\d{1,2}:\d{2}\s*(?:am|pm))\s*to\s*(\d{1,2}:\d{2}\s*(?:am|pm))/i);
    const weekendMatch = headline.toLowerCase().includes('weekend');
    
    if (timeMatch) {
      return {
        hours: `${timeMatch[1]}-${timeMatch[2]}`,
        days: weekendMatch ? ['Saturday', 'Sunday'] : ['All'],
      };
    }
    
    // Default for time-of-use plans
    return {
      hours: 'Off-peak hours',
      days: ['All'],
    };
  }

  /**
   * Cache management
   */
  private getCacheKey(params: ApiParams): string {
    return JSON.stringify(params);
  }

  private getFromCache(cacheKey: string): Plan[] | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.config.cacheTTL) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  private setCache(cacheKey: string, data: Plan[]): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    // Cleanup old cache entries (keep max 100)
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Utility to sleep for given milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get comprehensive cache statistics from all levels
   */
  public async getCacheStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    const fresh = entries.filter(([_, value]) => now - value.timestamp < this.config.cacheTTL);
    
    const dbStats = await planRepository.getCacheStats();
    const redisStats = this.redisCache.getStats();
    const circuitBreakerStats = this.circuitBreaker.getStats();
    
    return {
      memory: {
        totalEntries: this.cache.size,
        freshEntries: fresh.length,
        staleEntries: this.cache.size - fresh.length,
        hitRate: this.cache.size > 0 ? fresh.length / this.cache.size : 0,
      },
      redis: redisStats.redis,
      database: {
        totalCacheEntries: dbStats.totalCacheEntries,
        activeCacheEntries: dbStats.activeCacheEntries,
        apiCallsLast24h: dbStats.apiCallsLast24h,
      },
      circuitBreaker: circuitBreakerStats,
      metrics: this.metrics,
      cacheWarming: redisStats.warming,
      timestamp: dbStats.timestamp
    };
  }

  /**
   * Clear all cache levels
   */
  public async clearCache(): Promise<void> {
    this.cache.clear();
    await this.redisCache.clear();
    const cleaned = await planRepository.cleanExpiredCache();
    console.log(`Cleared all caches: memory, Redis, and ${cleaned} expired database entries`);
  }

  /**
   * Enhanced health check with circuit breaker status
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    circuitBreakerOpen: boolean;
    redisConnected: boolean;
    lastError?: string;
    responseTime: number;
  }> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'ChooseMyPower.org/1.0',
        },
        signal: AbortSignal.timeout(5000)
      });
      
      return {
        healthy: response.ok,
        circuitBreakerOpen: this.circuitBreaker.getState() === 'OPEN',
        redisConnected: this.redisCache.isRedisConnected(),
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        circuitBreakerOpen: this.circuitBreaker.getState() === 'OPEN',
        redisConnected: this.redisCache.isRedisConnected(),
        lastError: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Rate limiting implementation
   */
  private async executeWithRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ resolve, reject, fn });
      if (!this.processingQueue) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    this.processingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const now = Date.now();
      
      // Reset window if needed
      if (now - this.requestWindowStart >= 1000) {
        this.requestWindowStart = now;
        this.requestCount = 0;
      }
      
      // Check rate limits
      if (this.requestCount >= this.config.rateLimit.requestsPerSecond) {
        this.metrics.rateLimitHits++;
        const waitTime = 1000 - (now - this.requestWindowStart);
        await this.sleep(waitTime);
        continue;
      }
      
      // Check burst limit
      const timeSinceLastRequest = now - this.lastRequestTime;
      const burstInterval = 1000 / this.config.rateLimit.burstLimit;
      
      if (timeSinceLastRequest < burstInterval) {
        await this.sleep(burstInterval - timeSinceLastRequest);
      }
      
      const { resolve, reject, fn } = this.requestQueue.shift()!;
      this.requestCount++;
      this.lastRequestTime = Date.now();
      
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
    
    this.processingQueue = false;
  }

  /**
   * Validate API parameters
   */
  private validateParams(params: ApiParams): void {
    if (!params.tdsp_duns) {
      throw new ComparePowerApiError(
        ApiErrorType.INVALID_PARAMETERS,
        'TDSP DUNS number is required',
        { params },
        false
      );
    }
    
    if (params.term && ![6, 12, 18, 24, 36].includes(params.term)) {
      throw new ComparePowerApiError(
        ApiErrorType.INVALID_PARAMETERS,
        'Invalid term length. Must be 6, 12, 18, 24, or 36 months',
        { params },
        false
      );
    }
    
    if (params.percent_green !== undefined && (params.percent_green < 0 || params.percent_green > 100)) {
      throw new ComparePowerApiError(
        ApiErrorType.INVALID_PARAMETERS,
        'Green energy percentage must be between 0 and 100',
        { params },
        false
      );
    }
  }

  /**
   * Validate API response structure
   */
  private validateApiResponse(data: any[]): void {
    if (!Array.isArray(data)) {
      throw new ComparePowerApiError(
        ApiErrorType.DATA_VALIDATION_ERROR,
        'API response is not an array',
        {},
        false
      );
    }
    
    for (const plan of data) {
      if (!plan._id || !plan.product || !plan.tdsp) {
        throw new ComparePowerApiError(
          ApiErrorType.DATA_VALIDATION_ERROR,
          'Invalid plan structure in API response',
          { planId: plan._id },
          false
        );
      }
    }
  }

  /**
   * Validate individual plan data
   */
  private validatePlanData(plan: ComparePowerPlanResponse): boolean {
    try {
      return Boolean(
        plan._id &&
        plan.product &&
        plan.product.name &&
        plan.product.brand &&
        plan.product.brand.name &&
        plan.tdsp &&
        plan.tdsp.duns_number &&
        (plan.display_pricing_1000?.avg || plan.display_pricing_1000?.total)
      );
    } catch {
      return false;
    }
  }

  /**
   * Handle API errors with comprehensive fallback strategies
   */
  private async handleApiError(
    error: any,
    params: ApiParams,
    responseTime: number
  ): Promise<Plan[]> {
    const cityName = this.getCityNameFromTdsp(params.tdsp_duns);
    
    // Log the error with context
    await planRepository.logApiCall(
      'API_ERROR',
      params,
      error.context?.statusCode || 0,
      responseTime,
      error.message
    );
    
    // Try database fallback
    try {
      const fallbackPlans = await planRepository.getActivePlans(params.tdsp_duns, params);
      if (fallbackPlans.length > 0) {
        console.warn(`Using database fallback for ${cityName}: ${fallbackPlans.length} plans`);
        return fallbackPlans;
      }
    } catch (dbError) {
      console.warn('Database fallback failed:', dbError);
    }
    
    // Try stale cache fallback
    const cacheKey = this.getCacheKey(params);
    const staleCache = this.cache.get(cacheKey);
    if (staleCache) {
      console.warn(`Using stale cache for ${cityName}: ${staleCache.data.length} plans`);
      return staleCache.data;
    }
    
    // If it's a specific error type, provide more context
    if (error instanceof ComparePowerApiError) {
      error.context.city = cityName;
      error.context.tdspDuns = params.tdsp_duns;
    }
    
    // No fallbacks available
    throw error instanceof ComparePowerApiError ? error : new ComparePowerApiError(
      ApiErrorType.UNKNOWN,
      error.message || 'Unknown API error',
      { city: cityName, tdspDuns: params.tdsp_duns, responseTime },
      false
    );
  }

  /**
   * Calculate retry delay with jitter
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.retryDelays[attempt - 1] || 16000;
    // Add jitter: ±20% randomness to avoid thundering herd
    const jitter = baseDelay * 0.2 * (Math.random() - 0.5);
    return Math.max(1000, baseDelay + jitter);
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(responseTime: number): void {
    if (!this.config.monitoring.enableMetrics) return;
    
    this.metrics.averageResponseTime = (
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1)) + responseTime
    ) / this.metrics.totalRequests;
  }

  /**
   * Safe number parsing
   */
  private safeParseNumber(value: any): number {
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }

  /**
   * Safe rate parsing (converts to cents per kWh)
   */
  private safeParseRate(value: any): number {
    const parsed = this.safeParseNumber(value);
    return Math.round(parsed * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get city name from TDSP DUNS
   */
  private getCityNameFromTdsp(tdspDuns: string): string {
    // This could be enhanced with a reverse lookup
    switch (tdspDuns) {
      case '1039940674000': return 'Dallas/Fort Worth Area';
      case '957877905': return 'Houston Area';
      case '007924772': return 'Austin/Central Texas';
      case '007929441': return 'South Texas';
      case '007923311': return 'North Texas';
      default: return 'Texas';
    }
  }

  /**
   * Warm cache asynchronously
   */
  private async warmCacheAsync(): Promise<void> {
    try {
      await this.redisCache.warmCache((params) => this.fetchFromApi(params));
    } catch (error) {
      console.warn('Cache warming failed:', error);
    }
  }

  /**
   * Invalidate cache for a specific city
   */
  public async invalidateCity(citySlug: string): Promise<void> {
    const tdspDuns = getTdspFromCity(citySlug);
    if (tdspDuns) {
      await this.redisCache.invalidateCity(tdspDuns);
      
      // Also clear memory cache entries for this TDSP
      const keysToDelete: string[] = [];
      for (const [key] of this.cache.entries()) {
        if (key.includes(tdspDuns)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down ComparePower client...');
    await this.redisCache.disconnect();
    this.cache.clear();
    console.log('ComparePower client shutdown complete');
  }
}

// Export a default instance
export const comparePowerClient = new ComparePowerClient();

// Export for testing with custom config
export { ComparePowerClient as ComparePowerClientClass };

// Export error types for external use
export { ComparePowerApiError, ApiErrorType } from './errors';