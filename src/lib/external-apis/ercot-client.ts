/**
 * ERCOT MIS API Client
 * Integrates with Electric Reliability Council of Texas Market Information System
 */

import { BaseAPIClient, type BaseClientConfig } from './base-client';
import type { 
  ERCOTServiceTerritoryRequest,
  ERCOTServiceTerritoryResponse,
  ERCOTLoadZoneData
} from '../../types/external-apis';

interface ERCOTClientConfig extends Omit<BaseClientConfig, 'name' | 'baseUrl'> {
  apiKey?: string;
  environment?: 'production' | 'sandbox';
}

export class ERCOTClient extends BaseAPIClient {
  constructor(config: ERCOTClientConfig) {
    const baseConfig: BaseClientConfig = {
      name: 'ERCOT MIS API',
      baseUrl: config.environment === 'sandbox' 
        ? 'https://sandbox.ercot.com/api/1/services/read'
        : 'https://www.ercot.com/api/1/services/read',
      timeout: 35000,
      maxRetries: 3,
      retryDelay: 1000,
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerHour: 3600,
        requestsPerDay: 86400
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        recoveryTimeout: 60000
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      authentication: config.apiKey ? {
        type: 'api_key',
        apiKey: config.apiKey,
        keyHeader: 'Ocp-Apim-Subscription-Key'
      } : {
        type: 'none' // ERCOT MIS public endpoints
      },
      ...config
    };
    
    super(baseConfig);
  }

  /**
   * Validate ZIP codes using ERCOT service territory lookup
   */
  async validateZipCodes(zipCodes: string[]): Promise<any[]> {
    const results = [];
    
    // Process ZIP codes in batches to respect rate limits
    const batchSize = 5;
    for (let i = 0; i < zipCodes.length; i += batchSize) {
      const batch = zipCodes.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(zipCode => this.lookupServiceTerritory(zipCode))
      );
      
      batchResults.forEach((result, index) => {
        const zipCode = batch[index];
        if (result.status === 'fulfilled' && result.value.success) {
          results.push({
            zipCode,
            isValid: true,
            ...result.value.data,
            source: 'ercot_mis',
            processingTime: result.value.processingTime
          });
        } else {
          results.push({
            zipCode,
            isValid: false,
            error: result.status === 'rejected' ? result.reason : result.value.error,
            source: 'ercot_mis'
          });
        }
      });
      
      // Add delay between batches
      if (i + batchSize < zipCodes.length) {
        await this.sleep(500);
      }
    }
    
    return results;
  }

  /**
   * Look up service territory for a specific ZIP code
   */
  async lookupServiceTerritory(zipCode: string): Promise<any> {
    if (!this.isValidTexasZipCode(zipCode)) {
      return {
        success: false,
        error: 'Invalid Texas ZIP code',
        processingTime: 0
      };
    }

    const request: ERCOTServiceTerritoryRequest = {
      zipCode,
      includeLoadZone: true,
      includeTDSP: true
    };

    try {
      const response = await this.makeRequest<ERCOTServiceTerritoryResponse>(
        '/np4-745-cd/service-territory-lookup',
        {
          method: 'POST',
          body: JSON.stringify(request)
        }
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: this.mapERCOTResponse(response.data, zipCode),
          processingTime: response.processingTime
        };
      } else {
        return {
          success: false,
          error: response.error || 'ERCOT API returned no data',
          processingTime: response.processingTime
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        processingTime: 0
      };
    }
  }

  /**
   * Get load zone information for a ZIP code
   */
  async getLoadZoneData(zipCode: string): Promise<any> {
    try {
      const response = await this.makeRequest<ERCOTLoadZoneData>(
        `/np4-745-er/load-zone-lookup?zipCode=${zipCode}`,
        { method: 'GET' }
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            zipCode,
            loadZone: response.data.loadZone,
            weatherZone: response.data.weatherZone,
            congestionZone: response.data.congestionZone,
            source: 'ercot_mis'
          },
          processingTime: response.processingTime
        };
      } else {
        return {
          success: false,
          error: response.error || 'No load zone data found',
          processingTime: response.processingTime
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        processingTime: 0
      };
    }
  }

  /**
   * Get current market data and system status
   */
  async getHealthStatus(): Promise<any> {
    try {
      const response = await this.makeRequest<any>(
        '/np4-183-cd/system-status',
        { method: 'GET' }
      );

      return {
        status: response.success ? 'healthy' : 'unhealthy',
        responseTime: response.processingTime,
        endpoint: this.config.baseUrl,
        timestamp: new Date().toISOString(),
        details: response.success ? response.data : { error: response.error }
      };
    } catch (error: any) {
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
   * Get real-time system conditions
   */
  async getSystemConditions(): Promise<any> {
    try {
      const response = await this.makeRequest<any>(
        '/np4-190-cd/system-wide-demand',
        { method: 'GET' }
      );

      if (response.success) {
        return {
          success: true,
          data: {
            currentDemand: response.data.actualSystemDemand,
            forecastDemand: response.data.forecastSystemDemand,
            operatingReserve: response.data.operatingReserve,
            systemCondition: this.getSystemCondition(response.data),
            timestamp: response.data.timestamp || new Date().toISOString()
          },
          processingTime: response.processingTime
        };
      } else {
        return response;
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        processingTime: 0
      };
    }
  }

  /**
   * Map ERCOT API response to standardized format
   */
  private mapERCOTResponse(ercotData: ERCOTServiceTerritoryResponse, zipCode: string): any {
    return {
      zipCode,
      cityName: ercotData.cityName || this.inferCityFromZip(zipCode),
      county: ercotData.county,
      tdspName: ercotData.tdspName || ercotData.utility,
      tdspDuns: this.getTDSPDuns(ercotData.tdspName || ercotData.utility),
      serviceType: this.determineServiceType(ercotData),
      loadZone: ercotData.loadZone,
      weatherZone: ercotData.weatherZone,
      isDeregulated: ercotData.isDeregulated !== false, // Default to true for ERCOT territory
      confidence: this.calculateConfidence(ercotData),
      validatedAt: new Date().toISOString()
    };
  }

  /**
   * Determine service type from ERCOT data
   */
  private determineServiceType(ercotData: ERCOTServiceTerritoryResponse): string {
    if (ercotData.isDeregulated === false || ercotData.serviceType === 'municipal') {
      return 'municipal';
    }
    
    if (ercotData.serviceType === 'cooperative') {
      return 'cooperative';
    }
    
    if (ercotData.tdspName && this.isMajorTDSP(ercotData.tdspName)) {
      return 'deregulated';
    }
    
    return 'deregulated'; // Default for ERCOT territory
  }

  /**
   * Calculate confidence score based on data completeness
   */
  private calculateConfidence(ercotData: ERCOTServiceTerritoryResponse): number {
    let confidence = 85; // Base confidence for ERCOT data
    
    if (ercotData.tdspName) confidence += 5;
    if (ercotData.county) confidence += 3;
    if (ercotData.loadZone) confidence += 3;
    if (ercotData.cityName) confidence += 2;
    if (typeof ercotData.isDeregulated === 'boolean') confidence += 2;
    
    return Math.min(confidence, 100);
  }

  /**
   * Get TDSP DUNS number from name
   */
  private getTDSPDuns(tdspName: string): string | undefined {
    const tdspMapping: Record<string, string> = {
      'Oncor Electric Delivery': '1039940674000',
      'CenterPoint Energy Houston Electric': '957877905',
      'AEP Texas North Company': '007923311',
      'AEP Texas Central Company': '007924772',
      'Texas-New Mexico Power Company': '007929441'
    };
    
    // Try exact match first
    if (tdspMapping[tdspName]) {
      return tdspMapping[tdspName];
    }
    
    // Try partial matches
    const lowerName = tdspName.toLowerCase();
    if (lowerName.includes('oncor')) return tdspMapping['Oncor Electric Delivery'];
    if (lowerName.includes('centerpoint')) return tdspMapping['CenterPoint Energy Houston Electric'];
    if (lowerName.includes('aep') && lowerName.includes('north')) return tdspMapping['AEP Texas North Company'];
    if (lowerName.includes('aep') && lowerName.includes('central')) return tdspMapping['AEP Texas Central Company'];
    if (lowerName.includes('tnmp') || lowerName.includes('texas-new mexico')) return tdspMapping['Texas-New Mexico Power Company'];
    
    return undefined;
  }

  /**
   * Check if TDSP is a major utility
   */
  private isMajorTDSP(tdspName: string): boolean {
    const majorTDSPs = [
      'Oncor Electric Delivery',
      'CenterPoint Energy Houston Electric',
      'AEP Texas North Company',
      'AEP Texas Central Company',
      'Texas-New Mexico Power Company'
    ];
    
    return majorTDSPs.some(major => 
      tdspName.includes(major) || major.includes(tdspName)
    );
  }

  /**
   * Infer city name from ZIP code (basic implementation)
   */
  private inferCityFromZip(zipCode: string): string {
    const zipToCityMap: Record<string, string> = {
      '75201': 'Dallas', '75202': 'Dallas', '75203': 'Dallas',
      '77001': 'Houston', '77002': 'Houston', '77003': 'Houston',
      '78701': 'Austin', '78702': 'Austin', '78703': 'Austin',
      '76101': 'Fort Worth', '76102': 'Fort Worth', '76103': 'Fort Worth'
    };
    
    return zipToCityMap[zipCode] || 'Unknown';
  }

  /**
   * Determine system condition from demand data
   */
  private getSystemCondition(demandData: any): string {
    const reserveMargin = demandData.operatingReserve || 0;
    const demandRatio = (demandData.actualSystemDemand || 0) / (demandData.forecastSystemDemand || 1);
    
    if (reserveMargin < 1000 || demandRatio > 0.95) {
      return 'emergency';
    } else if (reserveMargin < 2000 || demandRatio > 0.90) {
      return 'watch';
    } else {
      return 'normal';
    }
  }

  /**
   * Validate Texas ZIP code format and range
   */
  private isValidTexasZipCode(zipCode: string): boolean {
    if (!/^\d{5}$/.test(zipCode)) {
      return false;
    }
    
    const numericZip = parseInt(zipCode, 10);
    return numericZip >= 73000 && numericZip <= 79999;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}