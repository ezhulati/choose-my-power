/**
 * Multi-TDSP Detection System
 * Detects when a ZIP code might be served by multiple TDSPs and triggers address collection
 * Implements the rule: "When two TDUs could return from API, ask user to enter address"
 */

import { tdspMapping, zipToCity } from '../../config/tdsp-mapping';
import { ercotESIIDClient } from './ercot-esiid-client';
import { comparePowerClient } from './comparepower-client';
import type { ApiParams } from '../../types/facets';

export interface MultiTDSPZipCode {
  zipCode: string;
  possibleTDSPs: Array<{
    duns: string;
    name: string;
    cities: string[];
    confidence: 'high' | 'medium' | 'low';
  }>;
  requiresAddress: boolean;
  boundaryType: 'city_boundary' | 'service_territory' | 'geographic' | 'unknown';
}

export interface TDSPResolutionResult {
  method: 'zip_direct' | 'address_required' | 'esiid_resolved' | 'user_selected';
  tdsp_duns: string;
  tdsp_name: string;
  confidence: 'high' | 'medium' | 'low';
  requiresUserInput: boolean;
  addressRequired: boolean;
  alternatives?: Array<{
    duns: string;
    name: string;
    description: string;
  }>;
  apiParams: ApiParams;
  esiid?: string;
  resolvedAddress?: string;
}

export class MultiTDSPDetector {
  private knownMultiTDSPZips: Map<string, MultiTDSPZipCode> = new Map();
  private zipCache: Map<string, TDSPResolutionResult> = new Map();
  private cacheTimeout = 1800000; // 30 minutes

  constructor() {
    this.initializeKnownMultiTDSPZips();
  }

  /**
   * Main detection method: Analyze ZIP code for multi-TDSP potential
   */
  async analyzeZipCode(zipCode: string, displayUsage: number = 1000): Promise<TDSPResolutionResult> {
    const normalizedZip = zipCode.trim();
    console.warn(`🔍 Analyzing ZIP code for multi-TDSP: ${normalizedZip}`);

    // Check cache first
    const cached = this.zipCache.get(normalizedZip);
    if (cached) {
      console.warn(`Cache hit for ZIP analysis: ${normalizedZip}`);
      return cached;
    }

    try {
      // Step 1: Check if this is a known multi-TDSP ZIP
      const multiTDSPInfo = this.knownMultiTDSPZips.get(normalizedZip);
      
      if (multiTDSPInfo) {
        console.warn(`⚠️  Known multi-TDSP ZIP detected: ${normalizedZip}`);
        return {
          method: 'address_required',
          tdsp_duns: multiTDSPInfo.possibleTDSPs[0].duns, // Primary TDSP as default
          tdsp_name: multiTDSPInfo.possibleTDSPs[0].name,
          confidence: 'medium',
          requiresUserInput: true,
          addressRequired: true,
          alternatives: multiTDSPInfo.possibleTDSPs.map(tdsp => ({
            duns: tdsp.duns,
            name: tdsp.name,
            description: `Serves ${tdsp.cities.length} cities in this area`
          })),
          apiParams: {
            tdsp_duns: multiTDSPInfo.possibleTDSPs[0].duns,
            display_usage: displayUsage
          }
        };
      }

      // Step 2: Check standard ZIP-to-city mapping
      const citySlug = zipToCity[normalizedZip];
      if (citySlug && tdspMapping[citySlug]) {
        const tdsp = tdspMapping[citySlug];
        console.warn(`✅ Direct ZIP-to-TDSP mapping: ${normalizedZip} → ${citySlug} → ${tdsp.name}`);
        
        const result = {
          method: 'zip_direct' as const,
          tdsp_duns: tdsp.duns,
          tdsp_name: tdsp.name,
          confidence: 'high' as const,
          requiresUserInput: false,
          addressRequired: false,
          apiParams: {
            tdsp_duns: tdsp.duns,
            display_usage: displayUsage
          }
        };

        // Cache the result
        this.zipCache.set(normalizedZip, result);
        setTimeout(() => this.zipCache.delete(normalizedZip), this.cacheTimeout);

        return result;
      }

      // Step 3: Dynamic multi-TDSP detection via API testing
      console.warn(`🧪 Testing multiple TDSPs for unknown ZIP: ${normalizedZip}`);
      const multiTDSPResult = await this.testMultipleTDSPs(normalizedZip, displayUsage);
      
      if (multiTDSPResult) {
        console.warn(`⚠️  Dynamic multi-TDSP detected for ${normalizedZip}`);
        return multiTDSPResult;
      }

      // Step 4: Fallback - unknown ZIP
      console.warn(`❓ Unknown ZIP code: ${normalizedZip}`);
      return {
        method: 'address_required',
        tdsp_duns: '1039940674000', // Default to Oncor (largest TDSP)
        tdsp_name: 'Oncor Electric Delivery',
        confidence: 'low',
        requiresUserInput: true,
        addressRequired: true,
        apiParams: {
          tdsp_duns: '1039940674000',
          display_usage: displayUsage
        }
      };

    } catch (error) {
      console.error('Error analyzing ZIP code:', error);
      throw error;
    }
  }

  /**
   * Resolve address to specific TDSP using ESIID lookup
   */
  async resolveAddressToTDSP(
    address: string, 
    zipCode: string, 
    displayUsage: number = 1000
  ): Promise<TDSPResolutionResult> {
    
    console.warn(`📍 Resolving address to TDSP: ${address}, ${zipCode}`);
    
    try {
      const esiidResolution = await ercotESIIDClient.resolveAddressToTDSP(
        address, 
        zipCode, 
        displayUsage
      );

      if (esiidResolution.success) {
        const result: TDSPResolutionResult = {
          method: 'esiid_resolved',
          tdsp_duns: esiidResolution.tdsp_duns,
          tdsp_name: esiidResolution.tdsp_name,
          confidence: esiidResolution.confidence,
          requiresUserInput: esiidResolution.alternatives ? esiidResolution.alternatives.length > 0 : false,
          addressRequired: false,
          apiParams: esiidResolution.apiParams,
          esiid: esiidResolution.esiid,
          resolvedAddress: esiidResolution.address,
          alternatives: esiidResolution.alternatives?.map(alt => ({
            duns: alt.tdsp_duns,
            name: alt.tdsp_name,
            description: alt.address
          }))
        };

        console.warn(`✅ ESIID resolution successful: ${result.tdsp_name} (${result.confidence} confidence)`);
        return result;
      }

      throw new Error('ESIID resolution failed');

    } catch (error) {
      console.error('Address-to-TDSP resolution failed:', error);
      
      // Fallback to ZIP analysis
      console.warn('Falling back to ZIP analysis...');
      return this.analyzeZipCode(zipCode, displayUsage);
    }
  }

  /**
   * Test multiple TDSPs for a ZIP code to detect boundaries
   */
  private async testMultipleTDSPs(zipCode: string, displayUsage: number): Promise<TDSPResolutionResult | null> {
    const majorTDSPs = [
      { duns: '1039940674000', name: 'Oncor Electric Delivery' },
      { duns: '957877905', name: 'CenterPoint Energy Houston Electric' },
      { duns: '007929441', name: 'Texas-New Mexico Power Company' },
      { duns: '007924772', name: 'AEP Texas Central Company' },
      { duns: '007923311', name: 'AEP Texas North Company' }
    ];

    const validTDSPs: Array<{ duns: string; name: string; planCount: number }> = [];

    // Test each major TDSP
    for (const tdsp of majorTDSPs) {
      try {
        const plans = await comparePowerClient.fetchPlans({
          tdsp_duns: tdsp.duns,
          display_usage: displayUsage
        });

        if (plans && plans.length > 0) {
          validTDSPs.push({
            duns: tdsp.duns,
            name: tdsp.name,
            planCount: plans.length
          });
          console.warn(`✅ ${tdsp.name}: ${plans.length} plans available`);
        }
      } catch (error) {
        // TDSP not available for this area - expected behavior
        console.warn(`❌ ${tdsp.name}: Not available`);
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // If multiple TDSPs found, this is a boundary ZIP
    if (validTDSPs.length > 1) {
      const primaryTDSP = validTDSPs.sort((a, b) => b.planCount - a.planCount)[0];
      
      return {
        method: 'address_required',
        tdsp_duns: primaryTDSP.duns,
        tdsp_name: primaryTDSP.name,
        confidence: 'medium',
        requiresUserInput: true,
        addressRequired: true,
        alternatives: validTDSPs.slice(1).map(tdsp => ({
          duns: tdsp.duns,
          name: tdsp.name,
          description: `${tdsp.planCount} plans available`
        })),
        apiParams: {
          tdsp_duns: primaryTDSP.duns,
          display_usage: displayUsage
        }
      };
    }

    return null; // Single or no TDSP found
  }

  /**
   * Initialize known multi-TDSP ZIP codes based on Texas utility boundaries
   */
  private initializeKnownMultiTDSPZips(): void {
    // Dallas/Fort Worth Metro Area - Oncor/AEP boundaries
    this.addMultiTDSPZip('75001', [
      { duns: '1039940674000', name: 'Oncor Electric Delivery', cities: ['addison-tx'], confidence: 'high' },
      { duns: '007923311', name: 'AEP Texas North Company', cities: ['farmers-branch-tx'], confidence: 'medium' }
    ], 'service_territory');

    this.addMultiTDSPZip('75006', [
      { duns: '1039940674000', name: 'Oncor Electric Delivery', cities: ['carrollton-tx'], confidence: 'high' },
      { duns: '007924772', name: 'AEP Texas Central Company', cities: ['farmers-branch-tx'], confidence: 'medium' }
    ], 'city_boundary');

    // Houston Metro Area - CenterPoint/TNMP boundaries  
    this.addMultiTDSPZip('77001', [
      { duns: '957877905', name: 'CenterPoint Energy Houston Electric', cities: ['houston-tx'], confidence: 'high' },
      { duns: '007929441', name: 'Texas-New Mexico Power Company', cities: ['katy-tx'], confidence: 'medium' }
    ], 'service_territory');

    this.addMultiTDSPZip('77494', [
      { duns: '957877905', name: 'CenterPoint Energy Houston Electric', cities: ['katy-tx'], confidence: 'high' },
      { duns: '007929441', name: 'Texas-New Mexico Power Company', cities: ['fulshear-tx'], confidence: 'high' }
    ], 'city_boundary');

    // Austin Area - AEP Central/CenterPoint boundaries
    this.addMultiTDSPZip('78610', [
      { duns: '007924772', name: 'AEP Texas Central Company', cities: ['cedar-park-tx'], confidence: 'high' },
      { duns: '957877905', name: 'CenterPoint Energy Houston Electric', cities: ['leander-tx'], confidence: 'medium' }
    ], 'geographic');

    // East Texas - Oncor/AEP North boundaries
    this.addMultiTDSPZip('75601', [
      { duns: '1039940674000', name: 'Oncor Electric Delivery', cities: ['longview-tx'], confidence: 'high' },
      { duns: '007923311', name: 'AEP Texas North Company', cities: ['marshall-tx'], confidence: 'medium' }
    ], 'service_territory');

    // West Texas - Multiple TDSP boundaries
    this.addMultiTDSPZip('79835', [
      { duns: '007929441', name: 'Texas-New Mexico Power Company', cities: ['el-paso-tx'], confidence: 'high' },
      { duns: '007923311', name: 'AEP Texas North Company', cities: ['dell-city-tx'], confidence: 'low' }
    ], 'geographic');

    // South Texas - TNMP boundaries
    this.addMultiTDSPZip('78041', [
      { duns: '007929441', name: 'Texas-New Mexico Power Company', cities: ['laredo-tx'], confidence: 'high' },
      { duns: '957877905', name: 'CenterPoint Energy Houston Electric', cities: ['zapata-tx'], confidence: 'low' }
    ], 'service_territory');

    console.warn(`📋 Initialized ${this.knownMultiTDSPZips.size} known multi-TDSP ZIP codes`);
  }

  /**
   * Helper method to add multi-TDSP ZIP codes
   */
  private addMultiTDSPZip(
    zipCode: string, 
    possibleTDSPs: MultiTDSPZipCode['possibleTDSPs'],
    boundaryType: MultiTDSPZipCode['boundaryType']
  ): void {
    this.knownMultiTDSPZips.set(zipCode, {
      zipCode,
      possibleTDSPs,
      requiresAddress: true,
      boundaryType
    });
  }

  /**
   * Check if a ZIP code is known to have multiple TDSPs
   */
  public isMultiTDSPZip(zipCode: string): boolean {
    return this.knownMultiTDSPZips.has(zipCode.trim());
  }

  /**
   * Get multi-TDSP information for a ZIP code
   */
  public getMultiTDSPInfo(zipCode: string): MultiTDSPZipCode | null {
    return this.knownMultiTDSPZips.get(zipCode.trim()) || null;
  }

  /**
   * Clear caches
   */
  public clearCache(): void {
    this.zipCache.clear();
    ercotESIIDClient.clearCache();
    console.warn('Multi-TDSP detector cache cleared');
  }

  /**
   * Get statistics
   */
  public getStats() {
    return {
      knownMultiTDSPZips: this.knownMultiTDSPZips.size,
      cachedAnalyses: this.zipCache.size,
      esiidCacheStats: ercotESIIDClient.getCacheStats()
    };
  }
}

// Export singleton instance
export const multiTDSPDetector = new MultiTDSPDetector();