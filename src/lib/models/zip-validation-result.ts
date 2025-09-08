// ZIPValidationResult entity model
// Feature: Add Comprehensive ZIP Code Lookup Forms to City Pages

import { z } from 'zod';
import { ZIP_CODE_REGEX } from '../../types/zip-validation';
import type { ZIPValidationResult } from '../../types/zip-validation';

// Zod schema for ZIPValidationResult validation
export const ZIPValidationResultSchema = z.object({
  zipCode: z.string().regex(ZIP_CODE_REGEX, 'ZIP code must be exactly 5 digits'),
  isValid: z.boolean(),
  tdsp: z.string().nullable(),
  citySlug: z.string().nullable(),
  redirectUrl: z.string().url().nullable(),
  availablePlans: z.number().int().min(0, 'Available plans must be non-negative'),
  errorMessage: z.string().nullable(),
  suggestions: z.array(z.string().regex(ZIP_CODE_REGEX)).default([])
});

// Valid TDSP identifiers
const VALID_TDSPS = [
  'oncor',
  'centerpoint', 
  'aep-texas',
  'tnmp',
  'austin-energy',
  'entergy-texas',
  'magic-valley',
  'sharyland'
] as const;

export type ValidTDSP = typeof VALID_TDSPS[number];

export class ZIPValidationResultModel {
  constructor(private data: ZIPValidationResult) {}

  static create(data: ZIPValidationResult): ZIPValidationResultModel {
    // Validate the data
    const validated = ZIPValidationResultSchema.parse(data);
    return new ZIPValidationResultModel(validated);
  }

  static createValid(data: {
    zipCode: string;
    tdsp: string;
    citySlug: string;
    redirectUrl: string;
    availablePlans: number;
  }): ZIPValidationResultModel {
    return this.create({
      ...data,
      isValid: true,
      errorMessage: null,
      suggestions: []
    });
  }

  static createInvalid(data: {
    zipCode: string;
    errorMessage: string;
    suggestions?: string[];
  }): ZIPValidationResultModel {
    return this.create({
      ...data,
      isValid: false,
      tdsp: null,
      citySlug: null,
      redirectUrl: null,
      availablePlans: 0,
      suggestions: data.suggestions || []
    });
  }

  // Getters
  get zipCode(): string {
    return this.data.zipCode;
  }

  get isValid(): boolean {
    return this.data.isValid;
  }

  get tdsp(): string | null {
    return this.data.tdsp;
  }

  get citySlug(): string | null {
    return this.data.citySlug;
  }

  get redirectUrl(): string | null {
    return this.data.redirectUrl;
  }

  get availablePlans(): number {
    return this.data.availablePlans;
  }

  get errorMessage(): string | null {
    return this.data.errorMessage;
  }

  get suggestions(): string[] {
    return this.data.suggestions;
  }

  toJSON(): ZIPValidationResult {
    return { ...this.data };
  }

  // Business logic methods
  isCrossCityRedirect(originalCitySlug: string): boolean {
    return this.data.isValid && 
           this.data.citySlug !== null && 
           this.data.citySlug !== originalCitySlug;
  }

  hasPlanAvailability(): boolean {
    return this.data.isValid && this.data.availablePlans > 0;
  }

  getTDSPDisplayName(): string | null {
    if (!this.data.tdsp) return null;
    
    const tdspNames: Record<string, string> = {
      'oncor': 'Oncor Electric Delivery Company',
      'centerpoint': 'CenterPoint Energy Houston Electric',
      'aep-texas': 'AEP Texas',
      'tnmp': 'Texas-New Mexico Power Company',
      'austin-energy': 'Austin Energy',
      'entergy-texas': 'Entergy Texas',
      'magic-valley': 'Magic Valley Electric Cooperative',
      'sharyland': 'Sharyland Utilities'
    };

    return tdspNames[this.data.tdsp] || this.data.tdsp;
  }

  getRedirectPath(): string | null {
    if (!this.data.redirectUrl) return null;
    
    try {
      const url = new URL(this.data.redirectUrl, 'https://example.com');
      return url.pathname + url.search;
    } catch {
      return this.data.redirectUrl;
    }
  }

  // Validation methods
  static validateTDSP(tdsp: string): boolean {
    return VALID_TDSPS.includes(tdsp as ValidTDSP);
  }

  static isTexasZipCode(zipCode: string): boolean {
    if (!ZIP_CODE_REGEX.test(zipCode)) {
      return false;
    }
    
    const zipNum = parseInt(zipCode, 10);
    // Texas ZIP code ranges
    return (zipNum >= 73000 && zipNum <= 79999);
  }

  // Helper methods for creating common responses
  static createTexasValidationError(zipCode: string, suggestions: string[] = []): ZIPValidationResultModel {
    return this.createInvalid({
      zipCode,
      errorMessage: `ZIP code ${zipCode} is not in Texas electricity service area`,
      suggestions
    });
  }

  static createFormatValidationError(zipCode: string): ZIPValidationResultModel {
    return this.createInvalid({
      zipCode,
      errorMessage: 'ZIP code must be exactly 5 digits',
      suggestions: []
    });
  }

  static createServiceUnavailableError(zipCode: string): ZIPValidationResultModel {
    return this.createInvalid({
      zipCode,
      errorMessage: 'ZIP code validation service temporarily unavailable',
      suggestions: []
    });
  }

  static createNoPlansAvailableResult(data: {
    zipCode: string;
    tdsp: string;
    citySlug: string;
  }): ZIPValidationResultModel {
    return this.create({
      ...data,
      isValid: true,
      redirectUrl: `/electricity-plans/${data.citySlug}?zip=${data.zipCode}`,
      availablePlans: 0,
      errorMessage: 'No electricity plans currently available for this ZIP code',
      suggestions: []
    });
  }

  // Cache key generation
  getCacheKey(): string {
    return `zip_validation:${this.data.zipCode}`;
  }

  // Serialization for caching
  static fromCacheData(cacheData: string): ZIPValidationResultModel {
    const data = JSON.parse(cacheData) as ZIPValidationResult;
    return new ZIPValidationResultModel(data);
  }

  toCacheData(): string {
    return JSON.stringify(this.data);
  }

  // Quality checks
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!ZIP_CODE_REGEX.test(this.data.zipCode)) {
      errors.push('Invalid ZIP code format');
    }

    if (this.data.isValid) {
      if (!this.data.tdsp) {
        errors.push('Valid results must have TDSP');
      } else if (!ZIPValidationResultModel.validateTDSP(this.data.tdsp)) {
        errors.push('Invalid TDSP identifier');
      }

      if (!this.data.citySlug) {
        errors.push('Valid results must have city slug');
      }

      if (!this.data.redirectUrl) {
        errors.push('Valid results must have redirect URL');
      }

      if (this.data.availablePlans < 0) {
        errors.push('Available plans count cannot be negative');
      }
    } else {
      if (!this.data.errorMessage) {
        errors.push('Invalid results must have error message');
      }
    }

    // Validate suggestions are valid ZIP codes
    for (const suggestion of this.data.suggestions) {
      if (!ZIP_CODE_REGEX.test(suggestion)) {
        errors.push(`Invalid suggestion ZIP code: ${suggestion}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Performance metrics
  static createPerformanceMetrics() {
    return {
      validationTime: 0,
      cacheHit: false,
      ercotApiTime: 0,
      tdspLookupTime: 0,
      planCountTime: 0
    };
  }
}

// Export type guards
export const isZIPValidationResult = (obj: any): obj is ZIPValidationResult => {
  return ZIPValidationResultSchema.safeParse(obj).success;
};

// Export constants
export { VALID_TDSPS, ValidTDSP };