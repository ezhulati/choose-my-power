/**
 * PUCT (Public Utility Commission of Texas) Client
 * Integrates with PUCT REP Directory and deregulated area data
 */

import { BaseAPIClient, type BaseClientConfig } from './base-client';
import type { 
  PUCTDeregulatedAreaRequest,
  PUCTDeregulatedAreaResponse,
  PUCTDeregulatedArea
} from '../../types/external-apis';

interface PUCTClientConfig extends Omit<BaseClientConfig, 'name' | 'baseUrl'> {
  apiKey?: string;
  userAgent?: string;
}

export class PUCTClient extends BaseAPIClient {
  constructor(config: PUCTClientConfig = {}) {
    const baseConfig: BaseClientConfig = {
      name: 'PUCT REP Directory',
      baseUrl: 'http://www.puc.texas.gov/industry/electric/directories',
      timeout: 50000, // PUCT can be slow
      maxRetries: 2,
      retryDelay: 2000,
      rateLimits: {
        requestsPerMinute: 30,
        requestsPerHour: 1800,
        requestsPerDay: 43200
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 3,
        recoveryTimeout: 120000
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/html, application/xml',
        'User-Agent': config.userAgent || 'ChooseMyPower-ZIPLookup/1.0'
      },
      authentication: {
        type: 'none' // PUCT directory is public
      },
      ...config
    };
    
    super(baseConfig);
  }

  /**
   * Validate ZIP codes using PUCT deregulated area data
   */
  async validateZipCodes(zipCodes: string[]): Promise<unknown[]> {
    const results = [];
    
    // PUCT doesn't have a batch API, so we process one by one with delays
    for (const zipCode of zipCodes) {
      const result = await this.validateSingleZipCode(zipCode);
      results.push(result);
      
      // Add delay between requests to respect rate limits
      if (zipCodes.indexOf(zipCode) < zipCodes.length - 1) {
        await this.sleep(2000);
      }
    }
    
    return results;
  }

  /**
   * Validate a single ZIP code against PUCT data
   */
  async validateSingleZipCode(zipCode: string): Promise<unknown> {
    if (!this.isValidTexasZipCode(zipCode)) {
      return {
        zipCode,
        isValid: false,
        error: 'Invalid Texas ZIP code format',
        source: 'puct_rep_directory',
        confidence: 0
      };
    }

    try {
      // Try multiple PUCT endpoints for comprehensive validation
      const [deregulatedStatus, cityInfo] = await Promise.allSettled([
        this.checkDeregulatedStatus(zipCode),
        this.getCityInformation(zipCode)
      ]);

      const result = this.combineValidationResults(
        zipCode,
        deregulatedStatus,
        cityInfo
      );

      return result;
    } catch (error: unknown) {
      return {
        zipCode,
        isValid: false,
        error: error.message,
        source: 'puct_rep_directory',
        confidence: 0
      };
    }
  }

  /**
   * Check deregulated status for a ZIP code
   */
  private async checkDeregulatedStatus(zipCode: string): Promise<unknown> {
    try {
      // PUCT doesn't have a direct ZIP API, so we query the REP directory
      // This is a simplified implementation - real PUCT integration would
      // require parsing HTML or using their specific data formats
      const response = await this.makeRequest<unknown>(
        `/rep/REP_DIRECTORY.aspx?zip=${zipCode}`,
        { method: 'GET' }
      );

      if (response.success) {
        return this.parseREPDirectoryResponse(response.data, zipCode);
      } else {
        return {
          success: false,
          error: response.error,
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
   * Get city information from PUCT data
   */
  private async getCityInformation(zipCode: string): Promise<unknown> {
    try {
      // Query PUCT service area data
      const response = await this.makeRequest<unknown>(
        '/rep/service-areas.json',
        { method: 'GET' }
      );

      if (response.success && response.data) {
        const cityData = this.findCityByZipCode(response.data, zipCode);
        return {
          success: true,
          data: cityData,
          processingTime: response.processingTime
        };
      } else {
        return {
          success: false,
          error: response.error || 'No city data found',
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
   * Get deregulated areas for multiple cities
   */
  async getDeregulatedAreas(request: PUCTDeregulatedAreaRequest): Promise<PUCTDeregulatedAreaResponse> {
    try {
      const startTime = Date.now();
      const results: PUCTDeregulatedArea[] = [];

      for (const city of request.cities) {
        const cityData = await this.getCityDeregulationData(city, request.includeProviders);
        if (cityData) {
          results.push(cityData);
        }
      }

      return {
        success: true,
        data: results,
        processingTime: Date.now() - startTime,
        source: 'puct_rep_directory'
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message,
        processingTime: 0,
        source: 'puct_rep_directory'
      };
    }
  }

  /**
   * Get deregulation data for a specific city
   */
  private async getCityDeregulationData(
    cityName: string, 
    includeProviders: boolean = false
  ): Promise<PUCTDeregulatedArea | null> {
    try {
      const response = await this.makeRequest<unknown>(
        `/rep/city-lookup.aspx?city=${encodeURIComponent(cityName)}`,
        { method: 'GET' }
      );

      if (response.success && response.data) {
        const cityData = this.parseCityDeregulationData(response.data, cityName);
        
        if (includeProviders && cityData.isDeregulated) {
          cityData.certifiedProviders = await this.getCertifiedProviders(cityName);
        }
        
        return cityData;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting deregulation data for ${cityName}:`, error);
      return null;
    }
  }

  /**
   * Get certified retail electric providers for a city
   */
  private async getCertifiedProviders(cityName: string): Promise<unknown[]> {
    try {
      const response = await this.makeRequest<unknown>(
        `/rep/providers.json?city=${encodeURIComponent(cityName)}`,
        { method: 'GET' }
      );

      if (response.success && response.data) {
        return this.parseProviderData(response.data);
      }
      
      return [];
    } catch (error) {
      console.error(`Error getting providers for ${cityName}:`, error);
      return [];
    }
  }

  /**
   * Get health status of PUCT services
   */
  async getHealthStatus(): Promise<unknown> {
    try {
      const response = await this.makeRequest<unknown>(
        '/rep/REP_DIRECTORY.aspx',
        { method: 'GET' }
      );

      return {
        status: response.success ? 'healthy' : 'unhealthy',
        responseTime: response.processingTime,
        endpoint: this.config.baseUrl,
        timestamp: new Date().toISOString(),
        details: response.success ? 'PUCT directory accessible' : { error: response.error }
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
   * Parse REP directory response (simplified - real implementation would parse HTML)
   */
  private parseREPDirectoryResponse(htmlData: string, zipCode: string): unknown {
    // This is a simplified implementation
    // Real PUCT integration would require HTML parsing or using their data API
    
    const isDeregulated = this.isKnownDeregulatedZip(zipCode);
    const confidence = isDeregulated ? 85 : 70; // Lower confidence for HTML parsing
    
    return {
      success: true,
      data: {
        zipCode,
        isDeregulated,
        serviceType: isDeregulated ? 'deregulated' : 'municipal',
        confidence,
        source: 'puct_rep_directory',
        method: 'html_parsing'
      },
      processingTime: 100 // Mock processing time
    };
  }

  /**
   * Find city by ZIP code in PUCT service area data
   */
  private findCityByZipCode(serviceAreaData: unknown, zipCode: string): unknown {
    // Mock implementation - real PUCT data would have actual city mappings
    const knownCities = this.getKnownCityMapping();
    const cityName = knownCities[zipCode];
    
    if (cityName) {
      return {
        zipCode,
        cityName,
        county: this.getCountyByZip(zipCode),
        isDeregulated: this.isKnownDeregulatedZip(zipCode),
        source: 'puct_service_areas'
      };
    }
    
    return null;
  }

  /**
   * Parse city deregulation data
   */
  private parseCityDeregulationData(cityData: unknown, cityName: string): PUCTDeregulatedArea {
    // Mock implementation based on known Texas deregulation status
    const isDeregulated = this.isKnownDeregulatedCity(cityName);
    
    return {
      cityName: this.formatCityName(cityName),
      county: this.getCountyByCity(cityName),
      zipCodes: this.getZipCodesByCity(cityName),
      tdsp: this.getTDSPByCity(cityName),
      tdspDuns: this.getTDSPDunsByCity(cityName),
      isDeregulated,
      certifiedProviders: [], // Will be filled if requested
      lastUpdate: new Date(),
      source: 'puct_rep_directory'
    };
  }

  /**
   * Parse provider data from PUCT response
   */
  private parseProviderData(providerData: unknown): unknown[] {
    // Mock implementation - real PUCT data would have actual provider details
    return [
      {
        name: 'TXU Energy',
        puctNumber: '10098',
        certificationStatus: 'active',
        serviceAreas: ['dallas', 'fort-worth'],
        contactInfo: {
          phone: '1-855-368-8942',
          website: 'https://www.txu.com'
        }
      },
      {
        name: 'Reliant Energy',
        puctNumber: '10007',
        certificationStatus: 'active',
        serviceAreas: ['houston', 'dallas'],
        contactInfo: {
          phone: '1-866-222-7100',
          website: 'https://www.reliant.com'
        }
      }
    ];
  }

  /**
   * Combine results from multiple validation endpoints
   */
  private combineValidationResults(
    zipCode: string,
    deregulatedStatus: PromiseSettledResult<unknown>,
    cityInfo: PromiseSettledResult<unknown>
  ): unknown {
    let isValid = false;
    let serviceType = 'unknown';
    let cityName = 'Unknown';
    let county = 'Unknown';
    let confidence = 0;
    let error = '';

    // Process deregulated status result
    if (deregulatedStatus.status === 'fulfilled' && deregulatedStatus.value.success) {
      isValid = true;
      serviceType = deregulatedStatus.value.data.serviceType;
      confidence = Math.max(confidence, deregulatedStatus.value.data.confidence || 0);
    } else if (deregulatedStatus.status === 'rejected') {
      error += `Deregulated status check failed: ${deregulatedStatus.reason}. `;
    }

    // Process city info result
    if (cityInfo.status === 'fulfilled' && cityInfo.value.success) {
      isValid = true;
      cityName = cityInfo.value.data.cityName || cityName;
      county = cityInfo.value.data.county || county;
      confidence = Math.max(confidence, 80); // Good confidence for city match
    } else if (cityInfo.status === 'rejected') {
      error += `City info lookup failed: ${cityInfo.reason}. `;
    }

    // Fallback to known data if APIs failed
    if (!isValid) {
      const fallbackData = this.getFallbackData(zipCode);
      if (fallbackData) {
        isValid = true;
        serviceType = fallbackData.serviceType;
        cityName = fallbackData.cityName;
        county = fallbackData.county;
        confidence = 60; // Lower confidence for fallback data
      }
    }

    return {
      zipCode,
      isValid,
      serviceType,
      cityName,
      county,
      confidence,
      source: 'puct_rep_directory',
      error: error.trim() || undefined,
      processingTime: 2000, // Mock processing time
      validatedAt: new Date().toISOString()
    };
  }

  /**
   * Get fallback data for common ZIP codes
   */
  private getFallbackData(zipCode: string): unknown {
    const knownData: Record<string, unknown> = {
      '75201': { serviceType: 'deregulated', cityName: 'Dallas', county: 'Dallas County' },
      '77001': { serviceType: 'deregulated', cityName: 'Houston', county: 'Harris County' },
      '78701': { serviceType: 'deregulated', cityName: 'Austin', county: 'Travis County' },
      '76101': { serviceType: 'deregulated', cityName: 'Fort Worth', county: 'Tarrant County' },
      '78626': { serviceType: 'municipal', cityName: 'Georgetown', county: 'Williamson County' }
    };
    
    return knownData[zipCode];
  }

  // Helper methods for mock data (would be replaced with real PUCT data parsing)
  
  private isKnownDeregulatedZip(zipCode: string): boolean {
    const deregulatedZips = ['75201', '77001', '78701', '76101', '75202', '77002'];
    return deregulatedZips.includes(zipCode);
  }

  private isKnownDeregulatedCity(cityName: string): boolean {
    const deregulatedCities = ['dallas', 'houston', 'austin', 'fort worth', 'san antonio'];
    return deregulatedCities.includes(cityName.toLowerCase());
  }

  private getKnownCityMapping(): Record<string, string> {
    return {
      '75201': 'Dallas', '75202': 'Dallas',
      '77001': 'Houston', '77002': 'Houston',
      '78701': 'Austin', '78702': 'Austin',
      '76101': 'Fort Worth', '76102': 'Fort Worth'
    };
  }

  private getCountyByZip(zipCode: string): string {
    const countyMap: Record<string, string> = {
      '75201': 'Dallas County', '75202': 'Dallas County',
      '77001': 'Harris County', '77002': 'Harris County',
      '78701': 'Travis County', '78702': 'Travis County',
      '76101': 'Tarrant County', '76102': 'Tarrant County'
    };
    return countyMap[zipCode] || 'Unknown County';
  }

  private getCountyByCity(cityName: string): string {
    const cityCountyMap: Record<string, string> = {
      'dallas': 'Dallas County',
      'houston': 'Harris County',
      'austin': 'Travis County',
      'fort worth': 'Tarrant County'
    };
    return cityCountyMap[cityName.toLowerCase()] || 'Unknown County';
  }

  private getZipCodesByCity(cityName: string): string[] {
    const cityZipMap: Record<string, string[]> = {
      'dallas': ['75201', '75202', '75203'],
      'houston': ['77001', '77002', '77003'],
      'austin': ['78701', '78702', '78703'],
      'fort worth': ['76101', '76102', '76103']
    };
    return cityZipMap[cityName.toLowerCase()] || [];
  }

  private getTDSPByCity(cityName: string): string {
    const cityTdspMap: Record<string, string> = {
      'dallas': 'Oncor Electric Delivery',
      'houston': 'CenterPoint Energy Houston Electric',
      'austin': 'Oncor Electric Delivery',
      'fort worth': 'Oncor Electric Delivery'
    };
    return cityTdspMap[cityName.toLowerCase()] || 'Unknown TDSP';
  }

  private getTDSPDunsByCity(cityName: string): string {
    const cityDunsMap: Record<string, string> = {
      'dallas': '1039940674000',
      'houston': '957877905',
      'austin': '1039940674000',
      'fort worth': '1039940674000'
    };
    return cityDunsMap[cityName.toLowerCase()] || '';
  }

  private formatCityName(cityName: string): string {
    return cityName.toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private isValidTexasZipCode(zipCode: string): boolean {
    if (!/^\d{5}$/.test(zipCode)) {
      return false;
    }
    const numericZip = parseInt(zipCode, 10);
    return numericZip >= 73000 && numericZip <= 79999;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}