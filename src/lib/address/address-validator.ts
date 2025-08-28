/**
 * Address Validation and Normalization System
 * 
 * Handles address parsing, validation, and normalization for TDSP determination.
 * Supports multiple validation strategies and integrates with external services.
 * 
 * Features:
 * - Address parsing and normalization
 * - ZIP+4 code handling  
 * - Street address validation
 * - Integration with USPS and other address services
 * - Caching for performance optimization
 */

import type { AddressInfo, NormalizedAddress } from '../../types/facets';

export interface AddressValidationConfig {
  uspsApiKey?: string;
  smartystreetsApiKey?: string;
  enableCaching: boolean;
  cacheTTL: number;
  timeoutMs: number;
  fallbackToBasicParsing: boolean;
}

export interface AddressValidationResult {
  isValid: boolean;
  normalized: NormalizedAddress | null;
  confidence: 'high' | 'medium' | 'low';
  errors: string[];
  suggestions?: NormalizedAddress[];
  validationMethod: 'usps' | 'smartystreets' | 'basic-parsing' | 'cached';
}

export class AddressValidator {
  private config: AddressValidationConfig;
  private cache: Map<string, AddressValidationResult> = new Map();
  
  constructor(config: Partial<AddressValidationConfig> = {}) {
    this.config = {
      enableCaching: true,
      cacheTTL: 86400000, // 24 hours
      timeoutMs: 5000, // 5 seconds
      fallbackToBasicParsing: true,
      ...config
    };
  }

  /**
   * Validate and normalize an address
   */
  async validateAddress(address: AddressInfo): Promise<AddressValidationResult> {
    const cacheKey = this.getCacheKey(address);
    
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cacheKey)) {
        return { ...cached, validationMethod: 'cached' };
      }
    }

    let result: AddressValidationResult;

    try {
      // Try external validation services first
      if (this.config.uspsApiKey) {
        result = await this.validateWithUSPS(address);
      } else if (this.config.smartystreetsApiKey) {
        result = await this.validateWithSmartyStreets(address);
      } else {
        // Fall back to basic parsing
        result = this.validateWithBasicParsing(address);
      }
    } catch (error) {
      console.warn('Address validation service failed:', error);
      
      if (this.config.fallbackToBasicParsing) {
        result = this.validateWithBasicParsing(address);
      } else {
        result = {
          isValid: false,
          normalized: null,
          confidence: 'low',
          errors: [error instanceof Error ? error.message : 'Validation service failed'],
          validationMethod: 'basic-parsing'
        };
      }
    }

    // Cache the result
    if (this.config.enableCaching && result.isValid) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Validate with USPS API
   */
  private async validateWithUSPS(address: AddressInfo): Promise<AddressValidationResult> {
    if (!this.config.uspsApiKey) {
      throw new Error('USPS API key not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      // USPS Web Tools API call
      const response = await fetch('https://secure.shippingapis.com/ShippingAPI.dll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: this.buildUSPSRequest(address),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`USPS API error: ${response.status}`);
      }

      const xmlData = await response.text();
      return this.parseUSPSResponse(xmlData, address);

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Validate with SmartyStreets API
   */
  private async validateWithSmartyStreets(address: AddressInfo): Promise<AddressValidationResult> {
    if (!this.config.smartystreetsApiKey) {
      throw new Error('SmartyStreets API key not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const url = new URL('https://us-street.api.smartystreets.com/street-address');
      url.searchParams.set('auth-id', this.config.smartystreetsApiKey);
      url.searchParams.set('candidates', '3');
      url.searchParams.set('street', address.street);
      url.searchParams.set('city', address.city);
      url.searchParams.set('state', address.state);
      url.searchParams.set('zipcode', address.zipCode);

      if (address.zip4) {
        url.searchParams.set('zipcode', `${address.zipCode}-${address.zip4}`);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`SmartyStreets API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseSmartyStreetsResponse(data, address);

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Basic address parsing and validation
   */
  private validateWithBasicParsing(address: AddressInfo): AddressValidationResult {
    const errors: string[] = [];
    
    // Basic validation checks
    if (!address.street || address.street.trim().length < 3) {
      errors.push('Street address is required and must be at least 3 characters');
    }
    
    if (!address.city || address.city.trim().length < 2) {
      errors.push('City is required and must be at least 2 characters');
    }
    
    if (address.state !== 'TX' && address.state !== 'Texas') {
      errors.push('Only Texas addresses are supported');
    }
    
    if (!this.isValidZipCode(address.zipCode)) {
      errors.push('Invalid ZIP code format');
    }

    if (address.zip4 && !this.isValidZip4(address.zip4)) {
      errors.push('Invalid ZIP+4 format');
    }

    // If there are validation errors, return invalid result
    if (errors.length > 0) {
      return {
        isValid: false,
        normalized: null,
        confidence: 'low',
        errors,
        validationMethod: 'basic-parsing'
      };
    }

    // Parse and normalize the address
    const normalized = this.parseAddress(address);
    
    return {
      isValid: true,
      normalized,
      confidence: 'medium',
      errors: [],
      validationMethod: 'basic-parsing'
    };
  }

  /**
   * Parse address components using basic regex patterns
   */
  private parseAddress(address: AddressInfo): NormalizedAddress {
    const streetPattern = /^(\d+[\w\/]*)\s+(.+)$/;
    const streetMatch = address.street.trim().match(streetPattern);
    
    let streetNumber = '';
    let streetNameRaw = address.street.trim();
    
    if (streetMatch) {
      streetNumber = streetMatch[1];
      streetNameRaw = streetMatch[2];
    }

    // Extract street type (Ave, St, Dr, etc.)
    const streetTypePattern = /\b(Ave|Avenue|St|Street|Dr|Drive|Rd|Road|Ln|Lane|Blvd|Boulevard|Ct|Court|Cir|Circle|Way|Pl|Place|Pkwy|Parkway)\b\.?$/i;
    const streetTypeMatch = streetNameRaw.match(streetTypePattern);
    
    let streetName = streetNameRaw;
    let streetType = '';
    
    if (streetTypeMatch) {
      streetType = this.normalizeStreetType(streetTypeMatch[1]);
      streetName = streetNameRaw.replace(streetTypePattern, '').trim();
    }

    // Handle unit numbers
    let unitType = '';
    let unitNumber = '';
    if (address.unitNumber) {
      const unitPattern = /^(Apt|Apartment|Suite|Ste|Unit|#)\s*(.+)$/i;
      const unitMatch = address.unitNumber.match(unitPattern);
      if (unitMatch) {
        unitType = unitMatch[1].toLowerCase();
        unitNumber = unitMatch[2];
      } else {
        unitNumber = address.unitNumber;
      }
    }

    const fullAddress = [
      streetNumber,
      streetName,
      streetType,
      unitType && unitNumber ? `${unitType} ${unitNumber}` : '',
      address.city,
      'TX',
      address.zip4 ? `${address.zipCode}-${address.zip4}` : address.zipCode
    ].filter(part => part).join(' ');

    return {
      streetNumber,
      streetName: streetName.trim(),
      streetType,
      unitType: unitType || undefined,
      unitNumber: unitNumber || undefined,
      city: this.normalizeCity(address.city),
      state: 'TX',
      zipCode: address.zipCode,
      zip4: address.zip4,
      fullAddress
    };
  }

  /**
   * Normalize street type abbreviations
   */
  private normalizeStreetType(streetType: string): string {
    const typeMap: Record<string, string> = {
      'ave': 'Avenue', 'avenue': 'Avenue',
      'st': 'Street', 'street': 'Street',
      'dr': 'Drive', 'drive': 'Drive',
      'rd': 'Road', 'road': 'Road',
      'ln': 'Lane', 'lane': 'Lane',
      'blvd': 'Boulevard', 'boulevard': 'Boulevard',
      'ct': 'Court', 'court': 'Court',
      'cir': 'Circle', 'circle': 'Circle',
      'way': 'Way',
      'pl': 'Place', 'place': 'Place',
      'pkwy': 'Parkway', 'parkway': 'Parkway'
    };
    
    return typeMap[streetType.toLowerCase()] || streetType;
  }

  /**
   * Normalize city names
   */
  private normalizeCity(city: string): string {
    return city.trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Validate ZIP code format
   */
  private isValidZipCode(zipCode: string): boolean {
    return /^\d{5}$/.test(zipCode);
  }

  /**
   * Validate ZIP+4 format
   */
  private isValidZip4(zip4: string): boolean {
    return /^\d{4}$/.test(zip4);
  }

  /**
   * Build USPS API request XML
   */
  private buildUSPSRequest(address: AddressInfo): string {
    const xml = `
      <AddressValidateRequest USERID="${this.config.uspsApiKey}">
        <Revision>1</Revision>
        <Address ID="0">
          <Address1>${address.unitNumber || ''}</Address1>
          <Address2>${address.street}</Address2>
          <City>${address.city}</City>
          <State>${address.state}</State>
          <Zip5>${address.zipCode}</Zip5>
          <Zip4>${address.zip4 || ''}</Zip4>
        </Address>
      </AddressValidateRequest>
    `.trim();
    
    return `API=Verify&XML=${encodeURIComponent(xml)}`;
  }

  /**
   * Parse USPS XML response
   */
  private parseUSPSResponse(xmlData: string, originalAddress: AddressInfo): AddressValidationResult {
    // Basic XML parsing (in production, use a proper XML parser)
    const addressMatch = xmlData.match(/<Address[^>]*>[\s\S]*?<\/Address>/);
    
    if (!addressMatch) {
      return {
        isValid: false,
        normalized: null,
        confidence: 'low',
        errors: ['Invalid USPS response format'],
        validationMethod: 'usps'
      };
    }

    const addressXml = addressMatch[0];
    
    // Check for errors
    if (addressXml.includes('<Error>')) {
      const errorMatch = addressXml.match(/<Description>([^<]+)<\/Description>/);
      const error = errorMatch ? errorMatch[1] : 'USPS validation failed';
      
      return {
        isValid: false,
        normalized: null,
        confidence: 'low',
        errors: [error],
        validationMethod: 'usps'
      };
    }

    // Extract validated address components
    const extractField = (field: string) => {
      const match = addressXml.match(new RegExp(`<${field}>([^<]*)<\/${field}>`));
      return match ? match[1].trim() : '';
    };

    const address2 = extractField('Address2');
    const city = extractField('City');
    const state = extractField('State');
    const zip5 = extractField('Zip5');
    const zip4 = extractField('Zip4');

    // Parse street components from Address2
    const parsedAddress = this.parseAddress({
      street: address2,
      city,
      state,
      zipCode: zip5,
      zip4: zip4 || undefined,
      unitNumber: extractField('Address1') || undefined
    });

    return {
      isValid: true,
      normalized: parsedAddress,
      confidence: 'high',
      errors: [],
      validationMethod: 'usps'
    };
  }

  /**
   * Parse SmartyStreets JSON response
   */
  private parseSmartyStreetsResponse(data: any[], originalAddress: AddressInfo): AddressValidationResult {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        isValid: false,
        normalized: null,
        confidence: 'low',
        errors: ['Address not found in SmartyStreets database'],
        validationMethod: 'smartystreets'
      };
    }

    const result = data[0]; // Use first result
    const components = result.components;
    const metadata = result.metadata;

    const normalized: NormalizedAddress = {
      streetNumber: components.primary_number || '',
      streetName: components.street_name || '',
      streetType: components.street_suffix || '',
      unitType: components.secondary_designator || undefined,
      unitNumber: components.secondary_number || undefined,
      city: components.city_name || '',
      state: components.state_abbreviation || '',
      zipCode: components.zipcode || '',
      zip4: components.plus4_code || undefined,
      fullAddress: result.delivery_line_1 + (result.delivery_line_2 ? ` ${result.delivery_line_2}` : '') + `, ${result.last_line}`
    };

    // Determine confidence based on metadata
    let confidence: 'high' | 'medium' | 'low' = 'high';
    if (metadata.precision === 'Zip9' || metadata.precision === 'Zip7') {
      confidence = 'high';
    } else if (metadata.precision === 'Zip5') {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      isValid: true,
      normalized,
      confidence,
      errors: [],
      validationMethod: 'smartystreets'
    };
  }

  /**
   * Generate cache key for address
   */
  private getCacheKey(address: AddressInfo): string {
    return [
      address.street.toLowerCase().trim(),
      address.city.toLowerCase().trim(),
      address.state.toLowerCase().trim(),
      address.zipCode,
      address.zip4 || '',
      address.unitNumber || ''
    ].join('|');
  }

  /**
   * Check if cached result is still valid
   */
  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    // For now, we'll assume all cached results have a timestamp
    // In a real implementation, you'd store timestamp with the cached result
    return true; // Simplified for this example
  }

  /**
   * Clear the address validation cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size
      // In a real implementation, you'd track hit rates
    };
  }
}

/**
 * Utility functions for address operations
 */

/**
 * Extract ZIP+4 from full ZIP code
 */
export function extractZip4(fullZip: string): { zip5: string; zip4?: string } {
  const match = fullZip.match(/^(\d{5})(?:-(\d{4}))?$/);
  if (!match) {
    throw new Error('Invalid ZIP code format');
  }
  
  return {
    zip5: match[1],
    zip4: match[2] || undefined
  };
}

/**
 * Format address for display
 */
export function formatAddress(address: NormalizedAddress, includeUnit = true): string {
  const parts = [
    address.streetNumber,
    address.streetName,
    address.streetType
  ].filter(part => part).join(' ');
  
  let formatted = parts;
  
  if (includeUnit && address.unitType && address.unitNumber) {
    formatted += ` ${address.unitType} ${address.unitNumber}`;
  }
  
  formatted += `, ${address.city}, ${address.state}`;
  formatted += address.zip4 ? ` ${address.zipCode}-${address.zip4}` : ` ${address.zipCode}`;
  
  return formatted;
}

/**
 * Compare two addresses for similarity
 */
export function compareAddresses(addr1: NormalizedAddress, addr2: NormalizedAddress): number {
  let score = 0;
  let maxScore = 0;
  
  // Street number (high weight)
  maxScore += 3;
  if (addr1.streetNumber === addr2.streetNumber) score += 3;
  
  // Street name (high weight)  
  maxScore += 3;
  if (addr1.streetName.toLowerCase() === addr2.streetName.toLowerCase()) score += 3;
  
  // Street type (medium weight)
  maxScore += 2;
  if (addr1.streetType === addr2.streetType) score += 2;
  
  // ZIP code (high weight)
  maxScore += 3;
  if (addr1.zipCode === addr2.zipCode) score += 3;
  
  // City (medium weight)
  maxScore += 2;
  if (addr1.city.toLowerCase() === addr2.city.toLowerCase()) score += 2;
  
  return score / maxScore;
}

// Export default instance
export const addressValidator = new AddressValidator();