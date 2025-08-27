/**
 * ComparePower API Client
 * Handles all interactions with the ComparePower pricing API
 * Includes caching, error handling, and response transformation
 * 
 * NOTE: This requires API access agreement with ComparePower
 * Contact: api-integrator agent for implementation details
 */

import type { Plan, ApiParams, CachedResponse } from '../../types/facets';
import { getProviderLogo, getProviderLogoUrl } from '../providers/logo-mapper';

interface ComparePowerAPIConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retryAttempts: number;
  cacheTTL: number;
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
  private retryDelays = [1000, 2000, 4000]; // Progressive backoff

  constructor(config: Partial<ComparePowerAPIConfig> = {}) {
    this.config = {
      baseUrl: process.env.COMPAREPOWER_API_URL || 'https://pricing.api.comparepower.com',
      apiKey: process.env.COMPAREPOWER_API_KEY,
      timeout: 10000, // 10 seconds
      retryAttempts: 3,
      cacheTTL: 3600000, // 1 hour
      ...config
    };
    this.cache = new Map();
  }

  /**
   * Fetch electricity plans from ComparePower API
   * @param params - API parameters including TDSP DUNS and filters
   * @returns Promise<Plan[]> - Transformed plan data
   */
  async fetchPlans(params: ApiParams): Promise<Plan[]> {
    const cacheKey = this.getCacheKey(params);
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`Cache hit for key: ${cacheKey}`);
      return cached;
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      group: 'default',
      tdsp_duns: params.tdsp_duns,
      display_usage: String(params.display_usage || 1000),
    });

    // Add optional parameters
    if (params.term) queryParams.set('term', String(params.term));
    if (params.percent_green !== undefined) queryParams.set('percent_green', String(params.percent_green));
    if (params.is_pre_pay !== undefined) queryParams.set('is_pre_pay', String(params.is_pre_pay));
    if (params.is_time_of_use !== undefined) queryParams.set('is_time_of_use', String(params.is_time_of_use));
    if (params.requires_auto_pay !== undefined) queryParams.set('requires_auto_pay', String(params.requires_auto_pay));
    if (params.brand_id) queryParams.set('brand_id', params.brand_id);

    const url = `${this.config.baseUrl}/api/plans/current?${queryParams}`;

    try {
      const data = await this.makeRequestWithRetry(url);
      const transformedPlans = this.transformPlans(data);
      
      // Cache the response
      this.setCache(cacheKey, transformedPlans);
      
      return transformedPlans;
    } catch (error) {
      console.error('ComparePower API Error:', error);
      
      // Return stale cache if available
      const staleCache = this.cache.get(cacheKey);
      if (staleCache) {
        console.warn('Returning stale cache due to API error');
        return staleCache.data;
      }
      
      throw error;
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequestWithRetry(url: string, attempt = 1): Promise<ComparePowerPlanResponse[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'ChooseMyPower.org/1.0',
      };

      if (this.config.apiKey) {
        headers['X-API-Key'] = this.config.apiKey;
      }

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid API response format - expected array');
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (attempt < this.config.retryAttempts) {
        const delay = this.retryDelays[attempt - 1] || 4000;
        console.warn(`API request failed (attempt ${attempt}), retrying in ${delay}ms...`);
        await this.sleep(delay);
        return this.makeRequestWithRetry(url, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Transform API response to internal Plan format
   */
  private transformPlans(apiData: ComparePowerPlanResponse[]): Plan[] {
    return apiData.map(plan => ({
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
        rate500kWh: plan.display_pricing_500?.avg_cents || (plan.display_pricing_500?.avg * 100) || 0,
        rate1000kWh: plan.display_pricing_1000?.avg_cents || (plan.display_pricing_1000?.avg * 100) || 0,
        rate2000kWh: plan.display_pricing_2000?.avg_cents || (plan.display_pricing_2000?.avg * 100) || 0,
        ratePerKwh: plan.display_pricing_1000?.avg_cents || (plan.display_pricing_1000?.avg * 100) || 0, // Use 1000kWh as default
        
        // Store the total cost from API (in dollars)
        total500kWh: plan.display_pricing_500?.total || 0,
        total1000kWh: plan.display_pricing_1000?.total || 0,
        total2000kWh: plan.display_pricing_2000?.total || 0,
      },
      contract: {
        length: plan.product.term,
        type: this.determineRateType(plan.product),
        earlyTerminationFee: plan.product.early_termination_fee || 0,
        autoRenewal: false, // Not specified in API
        satisfactionGuarantee: false, // Not specified in API
      },
      features: {
        greenEnergy: plan.product.percent_green || 0,
        billCredit: 0, // Not clearly specified in API
        freeTime: plan.product.is_time_of_use ? this.parseTimeOfUse(plan.product.headline) : undefined,
        deposit: {
          required: plan.product.is_pre_pay || false,
          amount: 0, // Not specified in API
        },
      },
      availability: {
        enrollmentType: 'both', // Default - would need more API data
        serviceAreas: [plan.tdsp.name], // Use TDSP name as service area
      },
    }));
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
   * Get cache statistics
   */
  public getCacheStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    const fresh = entries.filter(([_, value]) => now - value.timestamp < this.config.cacheTTL);
    
    return {
      totalEntries: this.cache.size,
      freshEntries: fresh.length,
      staleEntries: this.cache.size - fresh.length,
      hitRate: fresh.length / this.cache.size,
    };
  }

  /**
   * Clear cache manually
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Use a simple API call to check connectivity
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'ChooseMyPower.org/1.0',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export a default instance
export const comparePowerClient = new ComparePowerClient();

// Export for testing with custom config
export { ComparePowerClient as ComparePowerClientClass };