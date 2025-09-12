/**
 * Oncor Electric Delivery API Client
 * Integrates with Oncor TDSP territory validation services
 */

import { BaseAPIClient, type BaseClientConfig } from './base-client';
import type { 
  OncorTerritoryRequest,
  OncorTerritoryResponse,
  OncorAddressValidation
} from '../../types/external-apis';

interface OncorClientConfig extends Omit<BaseClientConfig, 'name' | 'baseUrl'> {
  apiKey: string;
  environment?: 'production' | 'sandbox';
}

export class OncorClient extends BaseAPIClient {
  constructor(config: OncorClientConfig) {
    const baseConfig: BaseClientConfig = {
      name: 'Oncor Electric Delivery API',
      baseUrl: config.environment === 'sandbox' 
        ? 'https://sandbox.oncor.com/api/territory'
        : 'https://www.oncor.com/api/territory',
      timeout: 20000,
      maxRetries: 4,
      retryDelay: 500,
      rateLimits: {
        requestsPerMinute: 120,
        requestsPerHour: 7200,
        requestsPerDay: 172800
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 8,
        recoveryTimeout: 90000
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      authentication: {
        type: 'api_key',
        apiKey: config.apiKey,
        keyHeader: 'X-API-Key'
      },
      ...config
    };
    
    super(baseConfig);
  }

  /**
   * Validate ZIP codes using Oncor territory lookup
   */
  async validateZipCodes(zipCodes: string[]): Promise<unknown[]> {
    const results = [];
    
    // Process in batches for better performance
    const batchSize = 10;
    for (let i = 0; i < zipCodes.length; i += batchSize) {
      const batch = zipCodes.slice(i, i + batchSize);
      
      // Use batch endpoint if available, otherwise process individually
      const batchResults = await this.processBatchZipCodes(batch);
      results.push(...batchResults);
      
      // Add delay between batches
      if (i + batchSize < zipCodes.length) {
        await this.sleep(1000);
      }
    }
    
    return results;
  }

  /**
   * Process a batch of ZIP codes
   */
  private async processBatchZipCodes(zipCodes: string[]): Promise<unknown[]> {
    try {
      // Try batch endpoint first
      const batchRequest = {
        zipCodes,
        includeServiceDetails: true,
        includeAddressInfo: false
      };

      const response = await this.makeRequest<unknown>(
        '/batch-zip-lookup',
        {
          method: 'POST',
          body: JSON.stringify(batchRequest)
        }
      );

      if (response.success && response.data?.results) {
        return response.data.results.map((result: unknown) => 
          this.mapOncorResponse(result, result.zipCode)
        );
      }
    } catch (error) {
      console.warn('Batch endpoint failed, falling back to individual requests:', error.message);
    }

    // Fallback to individual requests
    const results = [];
    for (const zipCode of zipCodes) {
      const result = await this.validateSingleZipCode(zipCode);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Validate a single ZIP code
   */
  async validateSingleZipCode(zipCode: string): Promise<unknown> {
    if (!this.isValidTexasZipCode(zipCode)) {
      return {
        zipCode,
        isValid: false,
        error: 'Invalid Texas ZIP code',
        source: 'oncor_territory_api',
        confidence: 0
      };
    }

    try {
      const response = await this.lookupZipCode(zipCode);
      
      if (response.success && response.data) {
        return this.mapOncorResponse(response.data, zipCode);
      } else {
        return {
          zipCode,
          isValid: false,
          error: response.error || 'ZIP code not in Oncor territory',
          source: 'oncor_territory_api',
          confidence: 0,
          processingTime: response.processingTime
        };
      }
    } catch (error: unknown) {
      return {
        zipCode,
        isValid: false,
        error: error.message,
        source: 'oncor_territory_api',
        confidence: 0,
        processingTime: 0
      };
    }
  }

  /**
   * Look up ZIP code territory information
   */
  async lookupZipCode(zipCode: string): Promise<unknown> {
    const request: OncorTerritoryRequest = {
      zipCode,
      includeServiceInfo: true,
      includeRateSchedule: false
    };

    try {
      const response = await this.makeRequest<OncorTerritoryResponse>(
        '/zip-lookup',
        {
          method: 'POST',
          body: JSON.stringify(request)
        }
      );

      return response;
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        processingTime: 0
      };
    }
  }

  /**
   * Validate full address with Oncor
   */
  async validateAddress(address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  }): Promise<unknown> {
    try {
      const request = {
        address: {
          addressLine1: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.zipCode
        },
        validateTerritory: true,
        includeESID: true
      };

      const response = await this.makeRequest<OncorAddressValidation>(
        '/address-validation',
        {
          method: 'POST',
          body: JSON.stringify(request)
        }
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            isValid: response.data.isValid,
            standardizedAddress: response.data.standardizedAddress,
            inOncorTerritory: response.data.inServiceTerritory,
            esid: response.data.esid,
            serviceClass: response.data.serviceClass,
            rateSchedule: response.data.rateSchedule,
            confidence: this.calculateAddressConfidence(response.data)
          },
          processingTime: response.processingTime
        };
      } else {
        return {
          success: false,
          error: response.error || 'Address validation failed',
          processingTime: response.processingTime
        };
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        processingTime: 0
      };
    }
  }

  /**
   * Get service boundary information
   */
  async getServiceBoundary(coordinates?: { lat: number; lng: number }): Promise<unknown> {
    try {
      let endpoint = '/service-boundary';
      if (coordinates) {
        endpoint += `?lat=${coordinates.lat}&lng=${coordinates.lng}`;
      }

      const response = await this.makeRequest<unknown>(endpoint, { method: 'GET' });

      if (response.success) {
        return {
          success: true,
          data: {
            boundaries: response.data.boundaries,
            serviceAreas: response.data.serviceAreas,
            coverage: response.data.coverage
          },
          processingTime: response.processingTime
        };
      } else {
        return response;
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        processingTime: 0
      };
    }
  }

  /**
   * Get health status of Oncor API
   */
  async getHealthStatus(): Promise<unknown> {
    try {
      const response = await this.makeRequest<unknown>('/health', { method: 'GET' });

      return {
        status: response.success ? 'healthy' : 'unhealthy',
        responseTime: response.processingTime,
        endpoint: this.config.baseUrl,
        timestamp: new Date().toISOString(),
        details: response.success ? response.data : { error: response.error }
      };
    } catch (error: unknown) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        endpoint: this.config.baseUrl,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Get current system information
   */
  async getSystemInfo(): Promise<unknown> {
    try {
      const response = await this.makeRequest<unknown>('/system-info', { method: 'GET' });

      if (response.success) {
        return {
          success: true,
          data: {
            serviceArea: response.data.serviceArea || 'North Texas',
            customerCount: response.data.customerCount,
            territorySize: response.data.territorySize,
            lastUpdate: response.data.lastUpdate || new Date().toISOString(),
            apiVersion: response.data.apiVersion || 'v1'
          },
          processingTime: response.processingTime
        };
      } else {
        return response;
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        processingTime: 0
      };
    }
  }

  /**
   * Map Oncor API response to standardized format
   */
  private mapOncorResponse(oncorData: unknown, zipCode: string): unknown {
    const isInTerritory = oncorData.inServiceTerritory !== false;
    
    return {
      zipCode,
      isValid: isInTerritory,
      cityName: oncorData.city || this.inferCityFromZip(zipCode),
      county: oncorData.county,
      tdspName: 'Oncor Electric Delivery',
      tdspDuns: '1039940674000',
      serviceType: this.determineServiceType(oncorData),
      serviceClass: oncorData.serviceClass,
      rateSchedule: oncorData.rateSchedule,
      confidence: this.calculateConfidence(oncorData, isInTerritory),
      source: 'oncor_territory_api',
      processingTime: oncorData.processingTime || 0,
      validatedAt: new Date().toISOString(),
      additionalInfo: {
        loadZone: oncorData.loadZone,
        weatherZone: oncorData.weatherZone,
        esidPrefix: this.getESIDPrefix(zipCode)
      }
    };
  }

  /**
   * Determine service type from Oncor data
   */
  private determineServiceType(oncorData: unknown): string {
    if (oncorData.serviceClass === 'Municipal') {
      return 'municipal';
    }
    
    if (oncorData.serviceClass === 'Cooperative') {
      return 'cooperative';
    }
    
    // Oncor primarily serves deregulated areas
    return 'deregulated';
  }

  /**
   * Calculate confidence score for ZIP validation
   */
  private calculateConfidence(oncorData: unknown, isInTerritory: boolean): number {
    if (!isInTerritory) {
      return 0;
    }
    
    let confidence = 90; // High base confidence for Oncor API
    
    if (oncorData.city) confidence += 3;
    if (oncorData.county) confidence += 2;
    if (oncorData.serviceClass) confidence += 2;
    if (oncorData.rateSchedule) confidence += 2;
    if (oncorData.loadZone) confidence += 1;
    
    return Math.min(confidence, 100);
  }

  /**
   * Calculate confidence for address validation
   */
  private calculateAddressConfidence(addressData: unknown): number {
    let confidence = addressData.isValid ? 85 : 0;
    
    if (addressData.standardizedAddress) confidence += 5;
    if (addressData.inServiceTerritory) confidence += 5;
    if (addressData.esid) confidence += 3;
    if (addressData.serviceClass) confidence += 2;
    
    return Math.min(confidence, 100);
  }

  /**
   * Get ESID prefix for ZIP code area
   */
  private getESIDPrefix(zipCode: string): string {
    // ESID prefixes for different Oncor areas
    const zipPrefix = zipCode.substring(0, 3);
    
    switch (zipPrefix) {
      case '752': // Dallas area
      case '750': // Dallas area
        return '10394406740';
      case '757': // Tyler area
        return '10394406741';
      case '767': // Waco area
        return '10394406742';
      default:
        return '10394406740'; // Default Dallas prefix
    }
  }

  /**
   * Infer city name from ZIP code (Oncor service area)
   */
  private inferCityFromZip(zipCode: string): string {
    const oncorZipToCityMap: Record<string, string> = {
      '75201': 'Dallas', '75202': 'Dallas', '75203': 'Dallas', '75204': 'Dallas',
      '76101': 'Fort Worth', '76102': 'Fort Worth', '76103': 'Fort Worth',
      '75024': 'Plano', '75025': 'Plano', '75074': 'Plano', '75075': 'Plano',
      '75038': 'Irving', '75039': 'Irving', '75060': 'Irving', '75061': 'Irving',
      '75040': 'Garland', '75041': 'Garland', '75042': 'Garland', '75043': 'Garland',
      '75149': 'Mesquite', '75150': 'Mesquite', '75180': 'Mesquite', '75181': 'Mesquite'
    };
    
    return oncorZipToCityMap[zipCode] || 'Unknown';
  }

  /**
   * Validate Texas ZIP code format and Oncor service area
   */
  private isValidTexasZipCode(zipCode: string): boolean {
    if (!/^\d{5}$/.test(zipCode)) {
      return false;
    }
    
    const numericZip = parseInt(zipCode, 10);
    
    // Texas ZIP range
    if (numericZip < 73000 || numericZip > 79999) {
      return false;
    }
    
    // Oncor primarily serves these ZIP ranges
    const oncorZipRanges = [
      [75000, 75999], // Dallas area
      [76000, 76999], // Fort Worth area
      [75700, 75799], // Tyler area
      [76700, 76799]  // Waco area
    ];
    
    return oncorZipRanges.some(([min, max]) => 
      numericZip >= min && numericZip <= max
    );
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}