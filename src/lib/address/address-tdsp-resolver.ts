/**
 * Address-Based TDSP Resolution System
 * 
 * Main integration layer that combines address validation, boundary lookup,
 * and multi-TDSP configuration to provide accurate TDSP determination.
 * 
 * This is the primary interface for the application to use when determining
 * which TDSP serves a specific address in Texas.
 * 
 * Features:
 * - Progressive enhancement (ZIP → Address → TDSP)
 * - Multiple resolution strategies with fallbacks
 * - Comprehensive caching and performance optimization
 * - User-friendly error handling and suggestions
 * - Integration with existing ComparePower API system
 */

import type { 
  AddressInfo, 
  NormalizedAddress, 
  AddressTdspResult,
  TdspInfo,
  ApiParams 
} from '../../types/facets';
import { addressValidator, type AddressValidationResult } from './address-validator';
import { tdspBoundaryService } from './tdsp-boundary-service';
import { 
  multiTdspMapping,
  requiresAddressValidation,
  getMultiTdspZipCodes,
  MULTI_TDSP_STATS
} from '../config/multi-tdsp-mapping';
import { tdspMapping, getTdspFromCity, validateCitySlug } from '../../config/tdsp-mapping';

export interface TdspResolutionOptions {
  preferHighAccuracy: boolean;
  allowFallback: boolean;
  includeAlternatives: boolean;
  timeoutMs?: number;
}

export interface TdspResolutionResult {
  success: boolean;
  address: NormalizedAddress | null;
  tdsp: TdspInfo | null;
  apiParams: ApiParams | null;
  confidence: 'high' | 'medium' | 'low';
  method: string;
  alternatives: TdspInfo[];
  warnings: string[];
  suggestions?: string[];
  requiresManualSelection: boolean;
  metadata: {
    addressValidation: AddressValidationResult | null;
    boundaryLookup: unknown;
    processingTime: number;
    cacheHit: boolean;
  };
}

export interface ProgressiveResolutionStep {
  step: 'zip-input' | 'address-collection' | 'tdsp-determination' | 'api-ready';
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  data?: unknown;
}

export class AddressTdspResolver {
  private cache: Map<string, TdspResolutionResult> = new Map();
  private readonly cacheTTL = 3600000; // 1 hour

  constructor() {
    console.warn('AddressTdspResolver initialized');
    console.warn(`Multi-TDSP ZIP codes configured: ${MULTI_TDSP_STATS.totalZipCodes}`);
  }

  /**
   * Main resolution method - determines TDSP from address information
   */
  async resolveTdspFromAddress(
    addressInfo: AddressInfo,
    options: Partial<TdspResolutionOptions> = {}
  ): Promise<TdspResolutionResult> {
    const startTime = Date.now();
    const opts = {
      preferHighAccuracy: true,
      allowFallback: true,
      includeAlternatives: true,
      ...options
    };

    const cacheKey = this.getCacheKey(addressInfo);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cacheKey)) {
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cacheHit: true,
          processingTime: Date.now() - startTime
        }
      };
    }

    try {
      // Step 1: Address validation and normalization
      const addressValidation = await addressValidator.validateAddress(addressInfo);
      
      if (!addressValidation.isValid || !addressValidation.normalized) {
        return this.createFailureResult(
          'Address validation failed',
          addressValidation.errors,
          { addressValidation, processingTime: Date.now() - startTime }
        );
      }

      // Step 2: TDSP boundary resolution
      const boundaryResult = await tdspBoundaryService.resolveTdsp(addressValidation.normalized);
      
      // Step 3: Build API parameters
      const apiParams: ApiParams = {
        tdsp_duns: boundaryResult.tdsp.duns,
        display_usage: 1000 // Default usage
      };

      // Step 4: Determine if manual selection is needed
      const requiresManualSelection = this.shouldRequireManualSelection(
        addressInfo.zipCode,
        boundaryResult,
        opts
      );

      // Step 5: Build comprehensive result
      const result: TdspResolutionResult = {
        success: true,
        address: addressValidation.normalized,
        tdsp: boundaryResult.tdsp,
        apiParams,
        confidence: this.calculateOverallConfidence(addressValidation, boundaryResult),
        method: `${addressValidation.validationMethod} + ${boundaryResult.method}`,
        alternatives: boundaryResult.alternativeTdsps || [],
        warnings: [...addressValidation.errors, ...boundaryResult.warnings],
        suggestions: this.generateSuggestions(addressInfo.zipCode, boundaryResult),
        requiresManualSelection,
        metadata: {
          addressValidation,
          boundaryLookup: boundaryResult,
          processingTime: Date.now() - startTime,
          cacheHit: false
        }
      };

      // Cache successful high-confidence results
      if (result.confidence !== 'low') {
        this.cache.set(cacheKey, result);
      }

      return result;

    } catch (error) {
      return this.createFailureResult(
        'TDSP resolution failed',
        [error instanceof Error ? error.message : 'Unknown error'],
        { processingTime: Date.now() - startTime }
      );
    }
  }

  /**
   * Progressive resolution - guides user through ZIP → Address → TDSP flow
   */
  async getProgressiveResolutionSteps(zipCode?: string, address?: AddressInfo): Promise<ProgressiveResolutionStep[]> {
    const steps: ProgressiveResolutionStep[] = [
      {
        step: 'zip-input',
        title: 'Enter ZIP Code',
        description: 'Provide your ZIP code to begin service area determination',
        required: true,
        completed: Boolean(zipCode),
        data: zipCode ? { zipCode, requiresAddressValidation: requiresAddressValidation(zipCode) } : null
      }
    ];

    if (zipCode) {
      const needsAddress = requiresAddressValidation(zipCode);
      
      steps.push({
        step: 'address-collection',
        title: needsAddress ? 'Complete Address Required' : 'Address Details (Optional)',
        description: needsAddress 
          ? 'Your ZIP code spans multiple utility areas. Full address required for accurate service determination.'
          : 'Providing your full address ensures the most accurate rate comparison.',
        required: needsAddress,
        completed: Boolean(address),
        data: address || null
      });
    }

    if (address) {
      try {
        const result = await this.resolveTdspFromAddress(address);
        
        steps.push({
          step: 'tdsp-determination',
          title: 'Utility Service Provider Identified',
          description: `Your electricity is delivered by ${result.tdsp?.name}`,
          required: true,
          completed: result.success,
          data: {
            tdsp: result.tdsp,
            confidence: result.confidence,
            alternatives: result.alternatives,
            requiresManualSelection: result.requiresManualSelection
          }
        });

        if (result.success && result.apiParams) {
          steps.push({
            step: 'api-ready',
            title: 'Ready for Rate Comparison',
            description: 'System configured to fetch current electricity rates',
            required: true,
            completed: true,
            data: {
              apiParams: result.apiParams,
              method: result.method
            }
          });
        }
      } catch (error) {
        steps.push({
          step: 'tdsp-determination',
          title: 'Service Area Determination Failed',
          description: 'Unable to determine utility service provider',
          required: true,
          completed: false,
          data: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    return steps;
  }

  /**
   * Quick ZIP code analysis
   */
  async analyzeZipCode(zipCode: string): Promise<{
    isMultiTdsp: boolean;
    primaryTdsp: TdspInfo | null;
    alternatives: TdspInfo[];
    boundaryType: string | null;
    requiresAddressValidation: boolean;
    cityOptions: string[];
    recommendedAction: 'proceed-with-primary' | 'collect-address' | 'show-options';
    explanation: string;
  }> {
    const isMultiTdsp = getMultiTdspZipCodes().includes(zipCode);
    
    if (!isMultiTdsp) {
      // Try to find in regular city mapping
      const citySlug = this.findCitySlugForZip(zipCode);
      let primaryTdsp: TdspInfo | null = null;
      
      if (citySlug && tdspMapping[citySlug]) {
        const cityConfig = tdspMapping[citySlug];
        primaryTdsp = {
          duns: cityConfig.duns,
          name: cityConfig.name,
          zone: cityConfig.zone,
          tier: cityConfig.tier || 3,
          priority: cityConfig.priority || 0.5,
          coverage: 'primary'
        };
      }

      return {
        isMultiTdsp: false,
        primaryTdsp,
        alternatives: [],
        boundaryType: null,
        requiresAddressValidation: false,
        cityOptions: citySlug ? [citySlug] : [],
        recommendedAction: primaryTdsp ? 'proceed-with-primary' : 'collect-address',
        explanation: primaryTdsp 
          ? `ZIP code ${zipCode} is served by ${primaryTdsp.name}` 
          : `ZIP code ${zipCode} requires address validation for service area determination`
      };
    }

    const config = multiTdspMapping[zipCode];
    if (!config) {
      return {
        isMultiTdsp: false,
        primaryTdsp: null,
        alternatives: [],
        boundaryType: null,
        requiresAddressValidation: true,
        cityOptions: [],
        recommendedAction: 'collect-address',
        explanation: `ZIP code ${zipCode} is not in our multi-TDSP configuration`
      };
    }

    return {
      isMultiTdsp: true,
      primaryTdsp: config.primaryTdsp,
      alternatives: config.alternativeTdsps || [],
      boundaryType: config.boundaryType || null,
      requiresAddressValidation: config.requiresAddressValidation,
      cityOptions: [], // Would be populated from boundary data
      recommendedAction: config.requiresAddressValidation ? 'collect-address' : 'show-options',
      explanation: config.notes || `ZIP code ${zipCode} spans multiple utility service areas`
    };
  }

  /**
   * Get TDSP suggestions for manual selection
   */
  async getTdspOptions(addressInfo: AddressInfo): Promise<{
    options: Array<{
      tdsp: TdspInfo;
      confidence: number;
      reason: string;
      recommended: boolean;
    }>;
    helpText: string;
  }> {
    const suggestions = await tdspBoundaryService.getTdspSuggestions(addressInfo);
    
    const options = suggestions.suggestions.map((suggestion, index) => ({
      ...suggestion,
      recommended: index === 0 // First suggestion is recommended
    }));

    const helpText = suggestions.requiresManualSelection
      ? 'Your address is in a boundary area between utility service territories. Please select your utility provider:'
      : 'Based on your address, we recommend the following utility provider:';

    return {
      options,
      helpText
    };
  }

  /**
   * Create API parameters from TDSP selection
   */
  createApiParams(tdsp: TdspInfo, usage = 1000): ApiParams {
    return {
      tdsp_duns: tdsp.duns,
      display_usage: usage
    };
  }

  /**
   * Get comprehensive statistics about the resolution system
   */
  getSystemStats(): {
    multiTdspStats: typeof MULTI_TDSP_STATS;
    cacheStats: { size: number; hitRate?: number };
    serviceStats: unknown;
  } {
    return {
      multiTdspStats: MULTI_TDSP_STATS,
      cacheStats: {
        size: this.cache.size
        // Hit rate tracking would be implemented here
      },
      serviceStats: tdspBoundaryService.getStats()
    };
  }

  /**
   * Validate that the system is properly configured
   */
  async validateConfiguration(): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check multi-TDSP configuration coverage
    const multiTdspCount = getMultiTdspZipCodes().length;
    if (multiTdspCount === 0) {
      issues.push('No multi-TDSP ZIP codes configured');
    } else if (multiTdspCount < 10) {
      recommendations.push('Consider expanding multi-TDSP ZIP code coverage for better accuracy');
    }

    // Check service integrations
    const serviceStats = tdspBoundaryService.getStats();
    if (!serviceStats.configuredMethods.includes('esid-lookup')) {
      recommendations.push('Configure ESID lookup API for highest accuracy TDSP determination');
    }

    // Check address validator configuration
    try {
      const testResult = await addressValidator.validateAddress({
        street: '123 Test St',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201'
      });
      
      if (testResult.validationMethod === 'basic-parsing') {
        recommendations.push('Configure USPS or SmartyStreets API for enhanced address validation');
      }
    } catch (error) {
      issues.push('Address validator not functioning properly');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  // Private helper methods

  private calculateOverallConfidence(
    addressValidation: AddressValidationResult,
    boundaryResult: unknown): 'high' | 'medium' | 'low' {
    const addressWeight = 0.4;
    const boundaryWeight = 0.6;

    const addressScore = addressValidation.confidence === 'high' ? 1.0 
      : addressValidation.confidence === 'medium' ? 0.7 : 0.4;
    
    const boundaryScore = boundaryResult.confidence === 'high' ? 1.0 
      : boundaryResult.confidence === 'medium' ? 0.7 : 0.4;

    const overallScore = (addressScore * addressWeight) + (boundaryScore * boundaryWeight);

    if (overallScore >= 0.8) return 'high';
    if (overallScore >= 0.6) return 'medium';
    return 'low';
  }

  private shouldRequireManualSelection(
    zipCode: string,
    boundaryResult: unknown,
    options: TdspResolutionOptions
  ): boolean {
    if (!options.includeAlternatives) return false;
    
    const config = multiTdspMapping[zipCode];
    if (config?.requiresAddressValidation && boundaryResult.confidence === 'low') {
      return true;
    }

    return (boundaryResult.alternativeTdsps?.length || 0) > 0 && boundaryResult.confidence !== 'high';
  }

  private generateSuggestions(zipCode: string, boundaryResult: unknown): string[] {
    const suggestions: string[] = [];
    
    if (requiresAddressValidation(zipCode)) {
      suggestions.push('This ZIP code spans multiple utility service areas');
    }

    if (boundaryResult.method === 'zip-fallback') {
      suggestions.push('Consider providing your complete address for more accurate service determination');
    }

    if (boundaryResult.alternativeTdsps?.length > 0) {
      suggestions.push('Multiple utility providers serve this area - verify your specific provider');
    }

    if (boundaryResult.confidence === 'low') {
      suggestions.push('Low confidence result - manual verification recommended');
    }

    return suggestions;
  }

  private findCitySlugForZip(zipCode: string): string | null {
    // This is a simplified approach - in production you'd have a proper ZIP-to-city mapping
    // For now, return null to indicate we need to implement proper ZIP-to-city lookup
    return null;
  }

  private createFailureResult(
    reason: string,
    errors: string[],
    metadata: Partial<TdspResolutionResult['metadata']>
  ): TdspResolutionResult {
    return {
      success: false,
      address: null,
      tdsp: null,
      apiParams: null,
      confidence: 'low',
      method: 'failed',
      alternatives: [],
      warnings: errors,
      suggestions: ['Please verify your address and try again'],
      requiresManualSelection: false,
      metadata: {
        addressValidation: null,
        boundaryLookup: null,
        cacheHit: false,
        ...metadata
      }
    };
  }

  private getCacheKey(address: AddressInfo): string {
    return [
      address.street.toLowerCase().trim(),
      address.city.toLowerCase().trim(),
      address.zipCode,
      address.zip4 || '',
      address.unitNumber || ''
    ].join('|');
  }

  private isCacheValid(cacheKey: string): boolean {
    // Simplified cache validation - in production you'd track timestamps
    return this.cache.has(cacheKey);
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.cache.clear();
    addressValidator.clearCache();
    tdspBoundaryService.clearCache();
  }
}

// Export default instance
export const addressTdspResolver = new AddressTdspResolver();

// Export utility functions
export { requiresAddressValidation, getMultiTdspZipCodes, MULTI_TDSP_STATS };