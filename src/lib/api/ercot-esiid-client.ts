/**
 * ERCOT ESIID Lookup Client
 * Integrates with ComparePower's ERCOT API to resolve addresses to specific ESIIDs and TDSPs
 * Based on orders.comparepower.com implementation
 * 
 * API Endpoints:
 * - Search: GET https://ercot.api.comparepower.com/api/esiids?address={address}&zip_code={zip}
 * - Details: GET https://ercot.api.comparepower.com/api/esiids/{esiid}
 */

import type { ApiParams } from '../../types/facets';
import { ComparePowerApiError, ApiErrorType } from './errors';

export interface ESIIDSearchParams {
  address: string;
  zip_code: string;
}

export interface ESIIDSearchResult {
  esiid: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  tdsp_duns: string;
  tdsp_name: string;
  service_voltage: string;
  meter_type: string;
}

export interface ESIIDDetails extends ESIIDSearchResult {
  premise_number: string;
  service_delivery_identifier: string;
  profile_id: string;
  switch_hold_indicator: string;
  customer_class: string;
  load_profile: string;
  rate_class: string;
}

export interface AddressTDSPResolution {
  success: boolean;
  method: 'esiid_lookup' | 'multiple_results' | 'single_result';
  confidence: 'high' | 'medium' | 'low';
  tdsp_duns: string;
  tdsp_name: string;
  esiid?: string;
  address: string;
  zip_code: string;
  alternatives?: Array<{
    tdsp_duns: string;
    tdsp_name: string;
    esiid: string;
    address: string;
  }>;
  apiParams: ApiParams;
}

import { createManagedCache } from '../utils/memory-manager';

export class ERCOTESIIDClient {
  private baseUrl: string;
  private apiKey?: string;
  private cache = createManagedCache<ESIIDSearchResult[]>('esiid-search', 3600000); // 1 hour

  constructor() {
    this.baseUrl = process.env.ERCOT_API_URL || 'https://ercot.api.comparepower.com';
    this.apiKey = process.env.ERCOT_API_KEY || process.env.COMPAREPOWER_API_KEY;
  }

  /**
   * Search for ESIIDs matching an address and ZIP code
   * This is the primary method to resolve addresses to TDSPs
   */
  async searchESIIDs(params: ESIIDSearchParams): Promise<ESIIDSearchResult[]> {
    const cacheKey = `${params.address}_${params.zip_code}`.toLowerCase();
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for ESIID search: ${params.address}, ${params.zip_code}`);
      return cached;
    }

    const url = new URL(`${this.baseUrl}/api/esiids`);
    url.searchParams.set('address', params.address);
    url.searchParams.set('zip_code', params.zip_code);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'ChooseMyPower.org/1.0',
        'Accept': 'application/json',
      };

      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new ComparePowerApiError(
          ApiErrorType.ESIID_LOOKUP_ERROR,
          `ESIID search failed: ${response.status} ${response.statusText}`,
          { 
            address: params.address, 
            zip_code: params.zip_code, 
            status: response.status 
          },
          response.status >= 500 // Retry on server errors
        );
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new ComparePowerApiError(
          ApiErrorType.DATA_VALIDATION_ERROR,
          'ESIID search response is not an array',
          { address: params.address, zip_code: params.zip_code },
          false
        );
      }

      // Validate and clean results
      const validResults = data
        .filter(this.validateESIIDResult)
        .map(this.normalizeESIIDResult);

      // Cache results (managed cache handles TTL automatically)
      this.cache.set(cacheKey, validResults);

      console.log(`Found ${validResults.length} ESIID results for ${params.address}, ${params.zip_code}`);
      return validResults;

    } catch (error) {
      if (error instanceof ComparePowerApiError) {
        throw error;
      }

      throw new ComparePowerApiError(
        ApiErrorType.NETWORK_ERROR,
        `Network error during ESIID search: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { address: params.address, zip_code: params.zip_code },
        true // Network errors are retryable
      );
    }
  }

  /**
   * Get detailed information for a specific ESIID
   */
  async getESIIDDetails(esiid: string): Promise<ESIIDDetails> {
    const url = `${this.baseUrl}/api/esiids/${encodeURIComponent(esiid)}`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'ChooseMyPower.org/1.0',
        'Accept': 'application/json',
      };

      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new ComparePowerApiError(
          ApiErrorType.ESIID_LOOKUP_ERROR,
          `ESIID details lookup failed: ${response.status} ${response.statusText}`,
          { esiid, status: response.status },
          response.status >= 500
        );
      }

      const data = await response.json();
      
      if (!this.validateESIIDDetails(data)) {
        throw new ComparePowerApiError(
          ApiErrorType.DATA_VALIDATION_ERROR,
          'Invalid ESIID details response',
          { esiid },
          false
        );
      }

      return this.normalizeESIIDDetails(data);

    } catch (error) {
      if (error instanceof ComparePowerApiError) {
        throw error;
      }

      throw new ComparePowerApiError(
        ApiErrorType.NETWORK_ERROR,
        `Network error during ESIID details lookup: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { esiid },
        true
      );
    }
  }

  /**
   * Main method: Resolve address to TDSP with comprehensive strategy
   */
  async resolveAddressToTDSP(
    address: string, 
    zipCode: string, 
    displayUsage: number = 1000
  ): Promise<AddressTDSPResolution> {
    
    console.log(`🔍 Resolving address to TDSP: ${address}, ${zipCode}`);
    
    try {
      // Step 1: Search for ESIIDs
      const esiidResults = await this.searchESIIDs({
        address: address.trim(),
        zip_code: zipCode.trim()
      });

      if (esiidResults.length === 0) {
        throw new ComparePowerApiError(
          ApiErrorType.ESIID_NOT_FOUND,
          'No ESIID found for this address',
          { address, zip_code: zipCode },
          false
        );
      }

      // Step 2: Analyze results
      const uniqueTDSPs = this.getUniqueTDSPs(esiidResults);

      if (uniqueTDSPs.length === 1) {
        // Single TDSP found - high confidence
        const tdsp = uniqueTDSPs[0];
        const primaryESIID = esiidResults[0];
        
        return {
          success: true,
          method: 'single_result',
          confidence: 'high',
          tdsp_duns: tdsp.duns,
          tdsp_name: tdsp.name,
          esiid: primaryESIID.esiid,
          address: primaryESIID.address,
          zip_code: primaryESIID.zip_code,
          apiParams: {
            tdsp_duns: tdsp.duns,
            display_usage: displayUsage
          }
        };
      } else {
        // Multiple TDSPs found - need user selection or additional logic
        const primaryTDSP = uniqueTDSPs[0]; // Most common or first result
        const alternatives = uniqueTDSPs.slice(1).map(tdsp => {
          const esiid = esiidResults.find(r => r.tdsp_duns === tdsp.duns)!;
          return {
            tdsp_duns: tdsp.duns,
            tdsp_name: tdsp.name,
            esiid: esiid.esiid,
            address: esiid.address
          };
        });

        return {
          success: true,
          method: 'multiple_results',
          confidence: 'medium',
          tdsp_duns: primaryTDSP.duns,
          tdsp_name: primaryTDSP.name,
          esiid: esiidResults.find(r => r.tdsp_duns === primaryTDSP.duns)?.esiid,
          address: address,
          zip_code: zipCode,
          alternatives,
          apiParams: {
            tdsp_duns: primaryTDSP.duns,
            display_usage: displayUsage
          }
        };
      }

    } catch (error) {
      console.error('ESIID resolution failed:', error);
      
      // Return error state - calling code can handle fallback
      throw error;
    }
  }

  /**
   * Extract unique TDSPs from ESIID results, ranked by frequency
   */
  private getUniqueTDSPs(results: ESIIDSearchResult[]): Array<{ duns: string; name: string; count: number }> {
    const tdspCounts = new Map<string, { name: string; count: number }>();
    
    results.forEach(result => {
      const existing = tdspCounts.get(result.tdsp_duns);
      if (existing) {
        existing.count++;
      } else {
        tdspCounts.set(result.tdsp_duns, {
          name: result.tdsp_name,
          count: 1
        });
      }
    });

    return Array.from(tdspCounts.entries())
      .map(([duns, data]) => ({ duns, name: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count); // Sort by frequency
  }

  /**
   * Validate ESIID search result structure
   */
  private validateESIIDResult(result: unknown): boolean {
    return (
      result &&
      typeof result.esiid === 'string' &&
      typeof result.address === 'string' &&
      typeof result.zip_code === 'string' &&
      typeof result.tdsp_duns === 'string' &&
      typeof result.tdsp_name === 'string'
    );
  }

  /**
   * Validate ESIID details structure
   */
  private validateESIIDDetails(details: unknown): boolean {
    return (
      this.validateESIIDResult(details) &&
      typeof details.premise_number === 'string'
    );
  }

  /**
   * Normalize ESIID result data
   */
  private normalizeESIIDResult(result: any): ESIIDSearchResult {
    return {
      esiid: result.esiid,
      address: result.address.trim(),
      city: result.city?.trim() || '',
      state: result.state?.trim() || 'TX',
      zip_code: result.zip_code.trim(),
      county: result.county?.trim() || '',
      tdsp_duns: result.tdsp_duns,
      tdsp_name: result.tdsp_name.trim(),
      service_voltage: result.service_voltage?.trim() || '',
      meter_type: result.meter_type?.trim() || ''
    };
  }

  /**
   * Normalize ESIID details data
   */
  private normalizeESIIDDetails(details: any): ESIIDDetails {
    return {
      ...this.normalizeESIIDResult(details),
      premise_number: details.premise_number,
      service_delivery_identifier: details.service_delivery_identifier || '',
      profile_id: details.profile_id || '',
      switch_hold_indicator: details.switch_hold_indicator || '',
      customer_class: details.customer_class || '',
      load_profile: details.load_profile || '',
      rate_class: details.rate_class || ''
    };
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('ESIID cache cleared');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return {
      size: this.cache.size(),
      keys: this.cache.keys()
    };
  }

  /**
   * Health check for ERCOT API
   */
  async healthCheck(): Promise<{ healthy: boolean; responseTime: number; lastError?: string }> {
    const startTime = Date.now();
    
    try {
      // Test with a known address
      await this.searchESIIDs({
        address: '1234 Main St',
        zip_code: '75201'
      });
      
      return {
        healthy: true,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const ercotESIIDClient = new ERCOTESIIDClient();

// Export types and error handling
export { ComparePowerApiError, ApiErrorType } from './errors';