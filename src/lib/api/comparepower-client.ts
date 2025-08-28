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
    concurrentRequests: number;
  };
  batchProcessing: {
    enabled: boolean;
    maxBatchSize: number;
    batchTimeoutMs: number;
    tdspGrouping: boolean;
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
  private activeRequests = 0;
  private tdspBatchQueue = new Map<string, Array<{ params: ApiParams; resolve: Function; reject: Function }>>;
  private batchTimeouts = new Map<string, NodeJS.Timeout>();
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
        requestsPerSecond: 25,
        burstLimit: 50,
        concurrentRequests: 10
      },
      batchProcessing: {
        enabled: true,
        maxBatchSize: 20,
        batchTimeoutMs: 50,
        tdspGrouping: true
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
    // Use batch processing for production efficiency
    if (this.config.batchProcessing.enabled && process.env.NODE_ENV === 'production') {
      return this.fetchPlansViaBatch(params);
    }
    
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
        const { plans, rawApiData } = await this.circuitBreaker.execute(async () => {
          return this.fetchFromApiWithRawData(params);
        });
        
        // Store in all cache levels
        await Promise.all([
          this.redisCache.set(params, plans),
          planRepository.setPlansCache(params, plans, 1),
          planRepository.storePlans(rawApiData, params.tdsp_duns)
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
   * Fetch plans with raw API data for robust ingestion
   */
  private async fetchFromApiWithRawData(params: ApiParams): Promise<{ plans: Plan[], rawApiData: ComparePowerPlanResponse[] }> {
    const url = this.buildApiUrl(params);
    const rawApiData = await this.makeRequestWithRetry(url);
    
    // Validate and clean raw API data before transformation
    const validatedData = this.validateAndCleanApiData(rawApiData, params);
    const plans = this.transformPlans(validatedData, params);
    
    return { plans, rawApiData: validatedData };
  }

  /**
   * Robust API data validation and cleaning
   */
  private validateAndCleanApiData(rawData: ComparePowerPlanResponse[], params: ApiParams): ComparePowerPlanResponse[] {
    const cityName = this.getCityNameFromTdsp(params.tdsp_duns);
    const validPlans: ComparePowerPlanResponse[] = [];
    let skippedCount = 0;
    let fixedCount = 0;

    for (const plan of rawData) {
      try {
        // Create a cleaned/fixed version of the plan
        const cleanedPlan = this.cleanPlanData(plan);
        
        // Validate the cleaned plan
        if (this.validatePlanDataRobust(cleanedPlan)) {
          validPlans.push(cleanedPlan);
        } else {
          console.warn(`Skipping invalid plan ${plan?._id || 'unknown'} for ${cityName}: failed validation after cleaning`);
          skippedCount++;
        }
      } catch (error) {
        console.warn(`Error processing plan ${plan?._id || 'unknown'} for ${cityName}:`, error);
        skippedCount++;
      }
    }

    if (skippedCount > 0) {
      console.log(`${cityName}: Processed ${validPlans.length} plans, skipped ${skippedCount}, fixed ${fixedCount}`);
    }

    return validPlans;
  }

  /**
   * Clean and fix plan data automatically
   */
  private cleanPlanData(plan: ComparePowerPlanResponse): ComparePowerPlanResponse {
    // Create a deep copy to avoid mutation
    const cleaned = JSON.parse(JSON.stringify(plan));
    let wasFixed = false;

    // Fix missing or malformed brand data
    if (!cleaned.product?.brand) {
      cleaned.product = cleaned.product || {};
      cleaned.product.brand = {
        _id: 'unknown',
        name: 'Unknown Provider',
        puct_number: '',
        legal_name: 'Unknown Provider',
        contact_info: {
          sales: { phone_number: '' },
          support: { address: '', email: '', phone_number: '' }
        }
      };
      wasFixed = true;
    } else {
      // Fix missing brand name
      if (!cleaned.product.brand.name) {
        cleaned.product.brand.name = cleaned.product.brand.legal_name || 'Unknown Provider';
        wasFixed = true;
      }
      
      // Fix missing contact info
      if (!cleaned.product.brand.contact_info) {
        cleaned.product.brand.contact_info = {
          sales: { phone_number: '' },
          support: { address: '', email: '', phone_number: '' }
        };
        wasFixed = true;
      }
    }

    // Fix missing product data
    if (!cleaned.product?.name) {
      cleaned.product = cleaned.product || {};
      cleaned.product.name = `Plan ${cleaned._id || 'Unknown'}`;
      wasFixed = true;
    }

    // Fix missing TDSP data
    if (!cleaned.tdsp) {
      cleaned.tdsp = {
        _id: 'unknown',
        name: 'Unknown TDSP',
        short_name: 'Unknown',
        abbreviation: 'UNK',
        duns_number: 'unknown'
      };
      wasFixed = true;
    }

    // Fix missing pricing data
    if (!cleaned.display_pricing_1000) {
      cleaned.display_pricing_1000 = {
        usage: 1000,
        avg: 0.15, // Default rate
        avg_cents: 15,
        total: 150
      };
      wasFixed = true;
    } else {
      // Ensure pricing consistency
      if (!cleaned.display_pricing_1000.avg_cents && cleaned.display_pricing_1000.avg) {
        cleaned.display_pricing_1000.avg_cents = cleaned.display_pricing_1000.avg * 100;
        wasFixed = true;
      } else if (!cleaned.display_pricing_1000.avg && cleaned.display_pricing_1000.avg_cents) {
        cleaned.display_pricing_1000.avg = cleaned.display_pricing_1000.avg_cents / 100;
        wasFixed = true;
      }
    }

    // Fix missing secondary pricing tiers
    if (!cleaned.display_pricing_500) {
      cleaned.display_pricing_500 = {
        usage: 500,
        avg: cleaned.display_pricing_1000.avg * 1.1, // Slightly higher rate for lower usage
        avg_cents: (cleaned.display_pricing_1000.avg_cents || 15) * 1.1,
        total: ((cleaned.display_pricing_1000.avg_cents || 15) * 1.1 * 500) / 100
      };
      wasFixed = true;
    }

    if (!cleaned.display_pricing_2000) {
      cleaned.display_pricing_2000 = {
        usage: 2000,
        avg: cleaned.display_pricing_1000.avg * 0.95, // Slightly lower rate for higher usage
        avg_cents: (cleaned.display_pricing_1000.avg_cents || 15) * 0.95,
        total: ((cleaned.display_pricing_1000.avg_cents || 15) * 0.95 * 2000) / 100
      };
      wasFixed = true;
    }

    // Fix missing product attributes
    cleaned.product.term = cleaned.product.term || 12;
    cleaned.product.percent_green = cleaned.product.percent_green || 0;
    cleaned.product.early_termination_fee = cleaned.product.early_termination_fee || 0;
    cleaned.product.is_pre_pay = cleaned.product.is_pre_pay || false;
    cleaned.product.is_time_of_use = cleaned.product.is_time_of_use || false;

    if (wasFixed && this.config.monitoring.logRequests) {
      console.log(`Auto-fixed plan data for ${cleaned._id}: ${cleaned.product.brand.name}`);
    }

    return cleaned;
  }

  /**
   * Robust validation that's more forgiving than the strict version
   */
  private validatePlanDataRobust(plan: ComparePowerPlanResponse): boolean {
    try {
      // Essential requirements that cannot be auto-fixed
      const hasEssentials = Boolean(
        plan?._id &&
        plan?.product &&
        plan?.product?.name &&
        plan?.product?.brand?.name &&
        plan?.tdsp?.duns_number &&
        plan?.display_pricing_1000
      );

      if (!hasEssentials) {
        const missing = [];
        if (!plan?._id) missing.push('id');
        if (!plan?.product) missing.push('product');
        if (!plan?.product?.name) missing.push('product.name');
        if (!plan?.product?.brand?.name) missing.push('brand.name');
        if (!plan?.tdsp?.duns_number) missing.push('tdsp.duns_number');
        if (!plan?.display_pricing_1000) missing.push('pricing');
        
        console.warn(`Plan ${plan?._id || 'unknown'} missing essential fields: ${missing.join(', ')}`);
        return false;
      }

      // Validate pricing makes sense
      const rate1000 = plan.display_pricing_1000.avg_cents || (plan.display_pricing_1000.avg * 100);
      if (rate1000 <= 0 || rate1000 > 50) { // Reasonable bounds for electricity rates
        console.warn(`Plan ${plan._id} has unrealistic rate: ${rate1000}¢/kWh`);
        return false;
      }

      return true;
    } catch (error) {
      console.warn(`Validation error for plan ${plan?._id || 'unknown'}:`, error);
      return false;
    }
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

      // Validate response data structure and filter invalid plans
      const validData = this.validateApiResponse(data);

      return validData;
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
          // Safe access with fallbacks
          const brandName = plan?.product?.brand?.name || 'Unknown Provider';
          
          return {
            id: plan._id,
            name: plan.product.name,
            provider: {
              name: brandName,
              logo: getProviderLogoUrl(brandName),
              logoInfo: getProviderLogo(brandName),
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
   * Batch processing for high-volume requests (Production Mode)
   * Groups requests by TDSP to minimize API calls
   */
  private async fetchPlansViaBatch(params: ApiParams): Promise<Plan[]> {
    const tdspDuns = params.tdsp_duns;
    
    return new Promise((resolve, reject) => {
      // Add to TDSP-specific batch queue
      if (!this.tdspBatchQueue.has(tdspDuns)) {
        this.tdspBatchQueue.set(tdspDuns, []);
      }
      
      const queue = this.tdspBatchQueue.get(tdspDuns)!;
      queue.push({ params, resolve, reject });
      
      // Process immediately if batch is full
      if (queue.length >= this.config.batchProcessing.maxBatchSize) {
        this.processTdspBatch(tdspDuns);
      } else {
        // Schedule batch processing
        this.scheduleTdspBatch(tdspDuns);
      }
    });
  }
  
  /**
   * Process batched requests for a specific TDSP
   */
  private async processTdspBatch(tdspDuns: string): Promise<void> {
    const queue = this.tdspBatchQueue.get(tdspDuns);
    if (!queue || queue.length === 0) return;
    
    // Clear the queue and timeout
    this.tdspBatchQueue.delete(tdspDuns);
    const timeout = this.batchTimeouts.get(tdspDuns);
    if (timeout) {
      clearTimeout(timeout);
      this.batchTimeouts.delete(tdspDuns);
    }
    
    const requests = [...queue]; // Copy to avoid mutation
    
    try {
      // Get base parameters from first request
      const baseParams = requests[0].params;
      
      // Check cache first for all requests
      const cachePromises = requests.map(async (req) => {
        const cached = await this.redisCache.get(req.params);
        return { request: req, cached };
      });
      
      const cacheResults = await Promise.all(cachePromises);
      const uncachedRequests = cacheResults.filter(result => !result.cached);
      
      // Resolve cached requests immediately
      cacheResults.forEach(result => {
        if (result.cached) {
          result.request.resolve(result.cached);
          this.metrics.cacheHits++;
        }
      });
      
      // Process uncached requests in batch
      if (uncachedRequests.length > 0) {
        // Make single API call for this TDSP with robust ingestion
        const { plans } = await this.executeWithRateLimit(() => this.fetchFromApiWithRawData(baseParams));
        
        // Filter and resolve each request based on their specific parameters
        await Promise.all(uncachedRequests.map(async (result) => {
          try {
            const filteredPlans = this.filterPlansForRequest(plans, result.request.params);
            
            // Cache the filtered result
            await this.redisCache.set(result.request.params, filteredPlans);
            await planRepository.setPlansCache(result.request.params, filteredPlans, 1);
            
            result.request.resolve(filteredPlans);
            this.metrics.successfulRequests++;
          } catch (error) {
            result.request.reject(error);
            this.metrics.failedRequests++;
          }
        }));
      }
    } catch (error) {
      // If batch fails, reject all uncached requests
      const uncachedRequests = requests.filter(req => 
        !cacheResults.find(result => result.request === req && result.cached)
      );
      
      uncachedRequests.forEach(req => {
        req.reject(error);
        this.metrics.failedRequests++;
      });
    }
  }
  
  /**
   * Filter plans based on specific request parameters
   */
  private filterPlansForRequest(allPlans: Plan[], params: ApiParams): Plan[] {
    return allPlans.filter(plan => {
      // Filter by contract term
      if (params.term && plan.contract.length !== params.term) return false;
      
      // Filter by green energy percentage
      if (params.percent_green !== undefined && plan.features.greenEnergy < params.percent_green) return false;
      
      // Filter by prepaid
      if (params.is_pre_pay !== undefined) {
        const isPrepaid = plan.features.deposit.required;
        if (params.is_pre_pay !== isPrepaid) return false;
      }
      
      // Filter by time of use
      if (params.is_time_of_use !== undefined) {
        const isTimeOfUse = Boolean(plan.features.freeTime);
        if (params.is_time_of_use !== isTimeOfUse) return false;
      }
      
      return true;
    });
  }
  
  /**
   * Schedule TDSP batch processing
   */
  private scheduleTdspBatch(tdspDuns: string): void {
    if (this.batchTimeouts.has(tdspDuns)) return;
    
    const timeout = setTimeout(() => {
      this.processTdspBatch(tdspDuns);
    }, this.config.batchProcessing.batchTimeoutMs);
    
    this.batchTimeouts.set(tdspDuns, timeout);
  }

  /**
   * Enhanced rate limiting with concurrency control
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
      
      // Check concurrent request limit
      if (this.activeRequests >= this.config.rateLimit.concurrentRequests) {
        await this.sleep(50); // Small delay before checking again
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
      this.activeRequests++;
      this.lastRequestTime = Date.now();
      
      // Execute request asynchronously to allow concurrency
      (async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
        }
      })();
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
  private validateApiResponse(data: any[]): any[] {
    if (!Array.isArray(data)) {
      throw new ComparePowerApiError(
        ApiErrorType.DATA_VALIDATION_ERROR,
        'API response is not an array',
        {},
        false
      );
    }
    
    // Filter out invalid plans instead of throwing errors
    const validPlans = data.filter(plan => {
      if (!plan._id || !plan.product || !plan.tdsp) {
        console.warn(`Filtering out invalid plan: ${plan._id || 'unknown'}`);
        return false;
      }
      return true;
    });
    
    return validPlans;
  }

  /**
   * Validate individual plan data
   */
  private validatePlanData(plan: ComparePowerPlanResponse): boolean {
    try {
      // More thorough validation
      const hasRequiredPlanData = Boolean(
        plan?._id &&
        plan?.product &&
        plan?.product?.name &&
        plan?.product?.brand &&
        plan?.product?.brand?.name &&
        plan?.tdsp &&
        plan?.tdsp?.duns_number &&
        (plan?.display_pricing_1000?.avg || plan?.display_pricing_1000?.total)
      );
      
      if (!hasRequiredPlanData) {
        console.warn(`Plan validation failed for ${plan?._id || 'unknown'}:`, {
          hasId: Boolean(plan?._id),
          hasProduct: Boolean(plan?.product),
          hasProductName: Boolean(plan?.product?.name),
          hasBrand: Boolean(plan?.product?.brand),
          hasBrandName: Boolean(plan?.product?.brand?.name),
          hasTdsp: Boolean(plan?.tdsp),
          hasTdspDuns: Boolean(plan?.tdsp?.duns_number),
          hasPricing: Boolean(plan?.display_pricing_1000?.avg || plan?.display_pricing_1000?.total)
        });
      }
      
      return hasRequiredPlanData;
    } catch (error) {
      console.warn(`Plan validation error for ${plan?._id || 'unknown'}:`, error);
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
   * Mass batch processing for 881 cities (Production Deployment)
   * Optimized for initial data warming and periodic refreshes
   */
  async batchProcessAllCities(cityTdspMappings: Record<string, string>[]): Promise<{
    successful: number;
    failed: number;
    duration: number;
    errors: Array<{ city: string; error: string }>;
  }> {
    const startTime = Date.now();
    let successful = 0;
    let failed = 0;
    const errors: Array<{ city: string; error: string }> = [];
    
    console.log(`Starting mass batch processing for ${cityTdspMappings.length} cities...`);
    
    // Group cities by TDSP for maximum efficiency
    const tdspGroups = new Map<string, string[]>();
    
    cityTdspMappings.forEach(({ city, tdsp }) => {
      if (!tdspGroups.has(tdsp)) {
        tdspGroups.set(tdsp, []);
      }
      tdspGroups.get(tdsp)!.push(city);
    });
    
    console.log(`Grouped into ${tdspGroups.size} TDSP batches:`);
    tdspGroups.forEach((cities, tdsp) => {
      console.log(`  ${tdsp}: ${cities.length} cities`);
    });
    
    // Process each TDSP group concurrently with smart throttling
    const batchPromises = Array.from(tdspGroups.entries()).map(async ([tdspDuns, cities]) => {
      try {
        // Base API call for this TDSP
        const baseParams: ApiParams = { tdsp_duns: tdspDuns };
        const allPlans = await this.fetchFromApi(baseParams);
        
        // Cache plans for all cities served by this TDSP
        const cachePromises = cities.map(async (citySlug) => {
          try {
            // Store with city-specific cache key
            const cityParams: ApiParams = { 
              tdsp_duns: tdspDuns,
              city: citySlug
            };
            
            await Promise.all([
              this.redisCache.set(cityParams, allPlans),
              planRepository.setPlansCache(cityParams, allPlans, 24), // 24 hour cache
              planRepository.storePlans(allPlans as any, tdspDuns)
            ]);
            
            return { city: citySlug, success: true };
          } catch (error) {
            return { 
              city: citySlug, 
              success: false, 
              error: error instanceof Error ? error.message : String(error) 
            };
          }
        });
        
        const results = await Promise.all(cachePromises);
        
        results.forEach(result => {
          if (result.success) {
            successful++;
          } else {
            failed++;
            errors.push({ city: result.city, error: result.error || 'Unknown error' });
          }
        });
        
        // Add delay between TDSP groups to respect rate limits
        await this.sleep(200);
        
      } catch (error) {
        // If TDSP group fails, mark all cities as failed
        cities.forEach(city => {
          failed++;
          errors.push({ 
            city, 
            error: `TDSP ${tdspDuns} batch failed: ${error instanceof Error ? error.message : String(error)}` 
          });
        });
      }
    });
    
    await Promise.all(batchPromises);
    
    const duration = Date.now() - startTime;
    
    console.log(`Mass batch processing complete:`);
    console.log(`  Duration: ${Math.round(duration / 1000)}s`);
    console.log(`  Successful: ${successful}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Success Rate: ${Math.round((successful / (successful + failed)) * 100)}%`);
    
    return { successful, failed, duration, errors };
  }
  
  /**
   * Intelligent cache warming for production deployment
   * Warms cache for high-priority cities first, then fills in background
   */
  async warmProductionCache(): Promise<void> {
    console.log('Starting intelligent production cache warming...');
    
    try {
      // Import TDSP mapping dynamically
      const { tdspMapping } = await import('../../config/tdsp-mapping-comprehensive');
      
      // Group cities by priority for intelligent warming
      const tier1Cities = Object.entries(tdspMapping)
        .filter(([_, config]) => config.tier === 1)
        .map(([citySlug, config]) => ({ city: citySlug, tdsp: config.duns }));
        
      const tier2Cities = Object.entries(tdspMapping)
        .filter(([_, config]) => config.tier === 2)
        .map(([citySlug, config]) => ({ city: citySlug, tdsp: config.duns }));
        
      const tier3Cities = Object.entries(tdspMapping)
        .filter(([_, config]) => config.tier === 3)
        .map(([citySlug, config]) => ({ city: citySlug, tdsp: config.duns }));
      
      // Warm Tier 1 (high-priority) cities first
      console.log(`Warming Tier 1 cities (${tier1Cities.length})...`);
      await this.batchProcessAllCities(tier1Cities);
      
      // Warm Tier 2 cities
      console.log(`Warming Tier 2 cities (${tier2Cities.length})...`);
      await this.batchProcessAllCities(tier2Cities);
      
      // Warm Tier 3 cities in background (async)
      console.log(`Starting background warming for Tier 3 cities (${tier3Cities.length})...`);
      this.batchProcessAllCities(tier3Cities).then(() => {
        console.log('Background cache warming for Tier 3 cities complete');
      }).catch(error => {
        console.warn('Background cache warming failed:', error);
      });
      
    } catch (error) {
      console.error('Production cache warming failed:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down ComparePower client...');
    
    // Clear all batch timeouts
    this.batchTimeouts.forEach(timeout => clearTimeout(timeout));
    this.batchTimeouts.clear();
    
    // Clear batch queues
    this.tdspBatchQueue.clear();
    
    await this.redisCache.disconnect();
    this.cache.clear();
    console.log('ComparePower client shutdown complete');
  }
}

// Export a default instance with production optimization
export const comparePowerClient = new ComparePowerClient();

// Export for testing with custom config
export { ComparePowerClient as ComparePowerClientClass };

// Export error types for external use
export { ComparePowerApiError, ApiErrorType } from './errors';

// Export utility functions for mass deployment
export async function warmAllCitiesCache(): Promise<void> {
  await comparePowerClient.warmProductionCache();
}

export async function batchProcessCities(mappings: Record<string, string>[]): Promise<any> {
  return comparePowerClient.batchProcessAllCities(mappings);
}