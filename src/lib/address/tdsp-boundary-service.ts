/**
 * TDSP Boundary Lookup Service
 * 
 * Determines the correct TDSP for an address using multiple resolution strategies.
 * Integrates with external APIs and boundary data sources for accurate mapping.
 * 
 * Resolution Strategies (in order of preference):
 * 1. ESID Lookup - Most accurate but requires external service
 * 2. ZIP+4 Boundary Data - High accuracy for known boundary areas
 * 3. Street-Level Boundary Data - Medium accuracy using geographic data
 * 4. Multi-TDSP ZIP Configuration - Fallback with primary TDSP
 * 5. Standard ZIP-to-City Mapping - Final fallback
 */

import type { 
  AddressInfo, 
  NormalizedAddress, 
  AddressTdspResult, 
  TdspInfo, 
  TdspBoundaryData 
} from '../../types/facets';
import { addressValidator } from './address-validator';
import { 
  multiTdspMapping, 
  requiresAddressValidation, 
  getPrimaryTdspForZip, 
  getAlternativeTdsps,
  getBoundaryType,
  TDSP_INFO
} from '../config/multi-tdsp-mapping';
import { tdspMapping } from '../../config/tdsp-mapping';

export interface TdspBoundaryConfig {
  esidApiUrl?: string;
  esidApiKey?: string;
  boundaryDataUrl?: string;
  enableCaching: boolean;
  cacheTTL: number;
  timeoutMs: number;
  maxRetries: number;
}

export interface ESIDLookupResponse {
  esid: string;
  tdsp_duns: string;
  tdsp_name: string;
  meter_type: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  confidence: number;
}

export interface BoundaryLookupResult {
  method: 'esid-lookup' | 'zip4-boundary' | 'street-boundary' | 'multi-tdsp-config' | 'zip-fallback';
  tdsp: TdspInfo;
  confidence: 'high' | 'medium' | 'low';
  alternativeTdsps?: TdspInfo[];
  warnings: string[];
  metadata?: {
    esid?: string;
    boundarySource?: string;
    responseTime?: number;
  };
}

export class TdspBoundaryService {
  private config: TdspBoundaryConfig;
  private cache: Map<string, BoundaryLookupResult> = new Map();
  private boundaryData: Map<string, TdspBoundaryData> = new Map();
  
  constructor(config: Partial<TdspBoundaryConfig> = {}) {
    this.config = {
      enableCaching: true,
      cacheTTL: 86400000, // 24 hours
      timeoutMs: 5000,
      maxRetries: 2,
      ...config
    };

    // Initialize with any preloaded boundary data
    this.loadBoundaryData();
  }

  /**
   * Main method to determine TDSP for a given address
   */
  async resolveTdsp(address: AddressInfo | NormalizedAddress): Promise<AddressTdspResult> {
    const startTime = Date.now();
    
    // First validate and normalize the address
    let normalizedAddress: NormalizedAddress;
    if ('fullAddress' in address) {
      normalizedAddress = address;
    } else {
      const validation = await addressValidator.validateAddress(address);
      if (!validation.isValid || !validation.normalized) {
        return {
          address: this.createFallbackAddress(address as AddressInfo),
          tdsp: this.getFallbackTdsp(address.zipCode),
          confidence: 'low',
          method: 'zip-fallback',
          warnings: ['Address validation failed', ...validation.errors]
        };
      }
      normalizedAddress = validation.normalized;
    }

    const cacheKey = this.getCacheKey(normalizedAddress);
    
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          address: normalizedAddress,
          ...cached,
          warnings: [...(cached.warnings || []), 'Result from cache']
        };
      }
    }

    // Try different resolution strategies
    const strategies = [
      () => this.resolveWithESID(normalizedAddress),
      () => this.resolveWithZip4Boundary(normalizedAddress),
      () => this.resolveWithStreetBoundary(normalizedAddress),
      () => this.resolveWithMultiTdspConfig(normalizedAddress),
      () => this.resolveWithZipFallback(normalizedAddress)
    ];

    let result: BoundaryLookupResult | null = null;
    const warnings: string[] = [];

    for (const strategy of strategies) {
      try {
        result = await strategy();
        if (result) break;
      } catch (error) {
        warnings.push(`Resolution strategy failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (!result) {
      // Ultimate fallback
      result = {
        method: 'zip-fallback',
        tdsp: this.getFallbackTdsp(normalizedAddress.zipCode),
        confidence: 'low',
        warnings: ['All resolution strategies failed']
      };
    }

    // Add timing metadata
    result.metadata = {
      ...result.metadata,
      responseTime: Date.now() - startTime
    };

    // Cache successful high-confidence results
    if (this.config.enableCaching && result.confidence !== 'low') {
      this.cache.set(cacheKey, result);
    }

    return {
      address: normalizedAddress,
      ...result,
      warnings: [...warnings, ...(result.warnings || [])]
    };
  }

  /**
   * Strategy 1: ESID Lookup (Most Accurate)
   */
  private async resolveWithESID(address: NormalizedAddress): Promise<BoundaryLookupResult | null> {
    if (!this.config.esidApiUrl) {
      return null; // ESID lookup not configured
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const url = new URL(this.config.esidApiUrl);
      url.searchParams.set('street', `${address.streetNumber} ${address.streetName} ${address.streetType}`);
      url.searchParams.set('city', address.city);
      url.searchParams.set('state', address.state);
      url.searchParams.set('zip', address.zipCode);

      if (address.zip4) {
        url.searchParams.set('zip4', address.zip4);
      }

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'ChooseMyPower.org/1.0'
      };

      if (this.config.esidApiKey) {
        headers['Authorization'] = `Bearer ${this.config.esidApiKey}`;
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`ESID API error: ${response.status}`);
      }

      const data: ESIDLookupResponse = await response.json();
      
      // Find matching TDSP from our configuration
      const tdsp = this.findTdspByDuns(data.tdsp_duns);
      if (!tdsp) {
        throw new Error(`Unknown TDSP DUNS: ${data.tdsp_duns}`);
      }

      return {
        method: 'esid-lookup',
        tdsp,
        confidence: data.confidence > 0.9 ? 'high' : data.confidence > 0.7 ? 'medium' : 'low',
        warnings: [],
        metadata: {
          esid: data.esid,
          boundarySource: 'ESID Database'
        }
      };

    } catch (error) {
      clearTimeout(timeoutId);
      // Don't throw - let other strategies try
      return null;
    }
  }

  /**
   * Strategy 2: ZIP+4 Boundary Data
   */
  private async resolveWithZip4Boundary(address: NormalizedAddress): Promise<BoundaryLookupResult | null> {
    if (!address.zip4) {
      return null; // No ZIP+4 available
    }

    const zip4Key = `${address.zipCode}-${address.zip4}`;
    
    // Check if we have ZIP+4 boundary data
    const boundaryData = this.boundaryData.get(address.zipCode);
    if (!boundaryData) {
      return null;
    }

    // In a real implementation, you would have ZIP+4 to TDSP mapping data
    // For now, we'll simulate this with our multi-TDSP configuration
    const multiTdspConfig = multiTdspMapping[address.zipCode];
    if (!multiTdspConfig || getBoundaryType(address.zipCode) !== 'zip4-level') {
      return null;
    }

    // Simple ZIP+4 based resolution logic
    // In production, this would use actual ZIP+4 boundary data
    const lastDigit = parseInt(address.zip4.slice(-1));
    const useAlternative = lastDigit > 5 && multiTdspConfig.alternativeTdsps?.[0];

    return {
      method: 'zip4-boundary',
      tdsp: useAlternative || multiTdspConfig.primaryTdsp,
      confidence: 'medium',
      alternativeTdsps: useAlternative ? [multiTdspConfig.primaryTdsp] : multiTdspConfig.alternativeTdsps,
      warnings: useAlternative ? ['Using alternative TDSP based on ZIP+4 boundary'] : []
    };
  }

  /**
   * Strategy 3: Street-Level Boundary Data
   */
  private async resolveWithStreetBoundary(address: NormalizedAddress): Promise<BoundaryLookupResult | null> {
    const multiTdspConfig = multiTdspMapping[address.zipCode];
    if (!multiTdspConfig || getBoundaryType(address.zipCode) !== 'street-level') {
      return null;
    }

    // Simple street-level resolution logic
    // In production, this would use GIS boundary data or street range mapping
    const streetNumber = parseInt(address.streetNumber);
    const streetName = address.streetName.toLowerCase();

    // Example street-level boundaries (would come from real data)
    const streetBoundaries = this.getStreetBoundaryRules(address.zipCode);
    
    for (const boundary of streetBoundaries) {
      if (this.isAddressInBoundary(address, boundary)) {
        return {
          method: 'street-boundary',
          tdsp: boundary.tdsp,
          confidence: 'medium',
          alternativeTdsps: boundary.tdsp === multiTdspConfig.primaryTdsp 
            ? multiTdspConfig.alternativeTdsps 
            : [multiTdspConfig.primaryTdsp],
          warnings: ['Using street-level boundary data']
        };
      }
    }

    return null;
  }

  /**
   * Strategy 4: Multi-TDSP Configuration
   */
  private async resolveWithMultiTdspConfig(address: NormalizedAddress): Promise<BoundaryLookupResult | null> {
    const config = multiTdspMapping[address.zipCode];
    if (!config) {
      return null;
    }

    return {
      method: 'multi-tdsp-config',
      tdsp: config.primaryTdsp,
      confidence: config.requiresAddressValidation ? 'low' : 'medium',
      alternativeTdsps: config.alternativeTdsps,
      warnings: config.requiresAddressValidation 
        ? ['Address validation required for accurate TDSP determination']
        : ['Using configured primary TDSP for ZIP code']
    };
  }

  /**
   * Strategy 5: ZIP Code Fallback
   */
  private async resolveWithZipFallback(address: NormalizedAddress): Promise<BoundaryLookupResult> {
    const tdsp = this.getFallbackTdsp(address.zipCode);

    return {
      method: 'zip-fallback',
      tdsp,
      confidence: 'low',
      warnings: ['Using fallback ZIP-to-TDSP mapping']
    };
  }

  /**
   * Get street boundary rules for a ZIP code
   */
  private getStreetBoundaryRules(zipCode: string): Array<{
    tdsp: TdspInfo;
    streetPatterns: Array<{
      streetName: RegExp;
      numberRanges: Array<{ min: number; max: number; oddEven?: 'odd' | 'even' }>;
    }>;
  }> {
    // This would be loaded from external boundary data
    // For now, return simplified example rules
    const config = multiTdspMapping[zipCode];
    if (!config) return [];

    // Example boundary rules (would come from real GIS data)
    if (zipCode === '75001') { // Addison
      return [
        {
          tdsp: TDSP_INFO.TNMP,
          streetPatterns: [
            {
              streetName: /^(belt\s?line|spring\s?valley)/i,
              numberRanges: [{ min: 1, max: 9999 }]
            }
          ]
        }
      ];
    }

    return [];
  }

  /**
   * Check if address falls within a boundary rule
   */
  private isAddressInBoundary(
    address: NormalizedAddress, 
    boundary: { tdsp: TdspInfo; streetPatterns: unknown[] }
  ): boolean {
    const streetNumber = parseInt(address.streetNumber);
    const fullStreetName = `${address.streetName} ${address.streetType}`.toLowerCase();

    for (const pattern of boundary.streetPatterns) {
      if (pattern.streetName.test(fullStreetName)) {
        for (const range of pattern.numberRanges) {
          if (streetNumber >= range.min && streetNumber <= range.max) {
            if (!range.oddEven) return true;
            if (range.oddEven === 'odd' && streetNumber % 2 === 1) return true;
            if (range.oddEven === 'even' && streetNumber % 2 === 0) return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Find TDSP by DUNS number
   */
  private findTdspByDuns(duns: string): TdspInfo | null {
    for (const tdsp of Object.values(TDSP_INFO)) {
      if (tdsp.duns === duns) {
        return tdsp;
      }
    }
    return null;
  }

  /**
   * Get fallback TDSP for ZIP code using existing mapping
   */
  private getFallbackTdsp(zipCode: string): TdspInfo {
    // Try to find city from existing ZIP-to-city mapping
    // This is a simplified approach - in production you'd have a complete ZIP-to-TDSP mapping
    
    // Look for the ZIP code in existing configurations
    for (const [citySlug, cityConfig] of Object.entries(tdspMapping)) {
      // This is simplified - you'd need a proper ZIP-to-city lookup
      if (citySlug.includes('dallas') && zipCode.startsWith('75')) {
        return {
          duns: cityConfig.duns,
          name: cityConfig.name,
          zone: cityConfig.zone,
          tier: cityConfig.tier || 3,
          priority: cityConfig.priority || 0.5,
          coverage: 'primary'
        };
      }
      if (citySlug.includes('houston') && zipCode.startsWith('77')) {
        return {
          duns: cityConfig.duns,
          name: cityConfig.name,
          zone: cityConfig.zone,
          tier: cityConfig.tier || 3,
          priority: cityConfig.priority || 0.5,
          coverage: 'primary'
        };
      }
    }

    // Ultimate fallback to Oncor (most common in Texas)
    return TDSP_INFO.ONCOR;
  }

  /**
   * Create fallback address from basic AddressInfo
   */
  private createFallbackAddress(address: AddressInfo): NormalizedAddress {
    return {
      streetNumber: '',
      streetName: address.street,
      streetType: '',
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      zip4: address.zip4,
      fullAddress: `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`
    };
  }

  /**
   * Generate cache key for address
   */
  private getCacheKey(address: NormalizedAddress): string {
    return [
      address.streetNumber,
      address.streetName.toLowerCase(),
      address.streetType.toLowerCase(),
      address.city.toLowerCase(),
      address.zipCode,
      address.zip4 || ''
    ].join('|');
  }

  /**
   * Load boundary data from external sources
   */
  private async loadBoundaryData(): Promise<void> {
    // In a real implementation, this would load boundary data from:
    // - GIS services
    // - PUCT mapping data
    // - Utility company service area files
    // - Local database
    
    // For now, we'll just log that boundary data loading is not implemented
    console.warn('Boundary data loading would be implemented here');
  }

  /**
   * Get multiple TDSP suggestions for ambiguous cases
   */
  async getTdspSuggestions(address: AddressInfo): Promise<{
    suggestions: Array<{ tdsp: TdspInfo; confidence: number; reason: string }>;
    requiresManualSelection: boolean;
  }> {
    const result = await this.resolveTdsp(address);
    
    const suggestions = [
      {
        tdsp: result.tdsp,
        confidence: result.confidence === 'high' ? 0.9 : result.confidence === 'medium' ? 0.7 : 0.4,
        reason: `Primary TDSP determined by ${result.method}`
      }
    ];

    if (result.alternativeTdsps) {
      suggestions.push(...result.alternativeTdsps.map(tdsp => ({
        tdsp,
        confidence: 0.3,
        reason: 'Alternative TDSP for boundary area'
      })));
    }

    return {
      suggestions: suggestions.sort((a, b) => b.confidence - a.confidence),
      requiresManualSelection: result.confidence === 'low' && (result.alternativeTdsps?.length || 0) > 0
    };
  }

  /**
   * Batch resolve multiple addresses
   */
  async batchResolveTdsp(addresses: AddressInfo[]): Promise<AddressTdspResult[]> {
    const batchSize = 10; // Process in batches to avoid overwhelming external APIs
    const results: AddressTdspResult[] = [];

    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
      const batchPromises = batch.map(address => this.resolveTdsp(address));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < addresses.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Clear the cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get service statistics
   */
  public getStats(): {
    cacheSize: number;
    boundaryDataSets: number;
    configuredMethods: string[];
  } {
    return {
      cacheSize: this.cache.size,
      boundaryDataSets: this.boundaryData.size,
      configuredMethods: [
        this.config.esidApiUrl ? 'esid-lookup' : null,
        'zip4-boundary',
        'street-boundary',
        'multi-tdsp-config',
        'zip-fallback'
      ].filter(Boolean) as string[]
    };
  }
}

// Export default instance
export const tdspBoundaryService = new TdspBoundaryService();