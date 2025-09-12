// ZIPCodeLookup entity model
// Feature: Add Comprehensive ZIP Code Lookup Forms to City Pages

import { z } from 'zod';
import { ERROR_CODES, ZIP_CODE_REGEX } from '../../types/zip-validation';
import type { ZIPCodeLookup, ZIPCodeLookupEntity } from '../../types/zip-validation';

// Zod schema for ZIPCodeLookup validation
export const ZIPCodeLookupSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
  zipCode: z.string().regex(ZIP_CODE_REGEX, 'ZIP code must be exactly 5 digits'),
  citySlug: z.string().min(1, 'City slug is required').regex(/^[a-z0-9\-]+$/, 'City slug must contain only lowercase letters, numbers, and hyphens'),
  timestamp: z.date(),
  isValid: z.boolean(),
  tdspId: z.string().nullable(),
  redirectUrl: z.string().url().nullable(),
  errorCode: z.enum(Object.values(ERROR_CODES) as [string, ...string[]]).nullable(),
  userAgent: z.string().min(1, 'User agent is required'),
  sessionId: z.string().min(1, 'Session ID is required')
});

// Database entity schema (snake_case for PostgreSQL)
export const ZIPCodeLookupEntitySchema = z.object({
  id: z.string().uuid(),
  zip_code: z.string().regex(ZIP_CODE_REGEX),
  city_slug: z.string().regex(/^[a-z0-9\-]+$/),
  created_at: z.date(),
  is_valid: z.boolean(),
  tdsp_id: z.string().nullable(),
  redirect_url: z.string().url().nullable(),
  error_code: z.enum(Object.values(ERROR_CODES) as [string, ...string[]]).nullable(),
  user_agent: z.string(),
  session_id: z.string()
});

export class ZIPCodeLookupModel {
  constructor(private data: ZIPCodeLookup) {}

  static create(data: Omit<ZIPCodeLookup, 'id' | 'timestamp'>): ZIPCodeLookupModel {
    const zipCodeLookup: ZIPCodeLookup = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    // Validate the data
    const validated = ZIPCodeLookupSchema.parse(zipCodeLookup);
    return new ZIPCodeLookupModel(validated);
  }

  static fromEntity(entity: ZIPCodeLookupEntity): ZIPCodeLookupModel {
    const data: ZIPCodeLookup = {
      id: entity.id,
      zipCode: entity.zip_code,
      citySlug: entity.city_slug,
      timestamp: entity.created_at,
      isValid: entity.is_valid,
      tdspId: entity.tdsp_id,
      redirectUrl: entity.redirect_url,
      errorCode: entity.error_code,
      userAgent: entity.user_agent,
      sessionId: entity.session_id
    };

    return new ZIPCodeLookupModel(data);
  }

  get id(): string {
    return this.data.id;
  }

  get zipCode(): string {
    return this.data.zipCode;
  }

  get citySlug(): string {
    return this.data.citySlug;
  }

  get timestamp(): Date {
    return this.data.timestamp;
  }

  get isValid(): boolean {
    return this.data.isValid;
  }

  get tdspId(): string | null {
    return this.data.tdspId;
  }

  get redirectUrl(): string | null {
    return this.data.redirectUrl;
  }

  get errorCode(): string | null {
    return this.data.errorCode;
  }

  get userAgent(): string {
    return this.data.userAgent;
  }

  get sessionId(): string {
    return this.data.sessionId;
  }

  toJSON(): ZIPCodeLookup {
    return { ...this.data };
  }

  toEntity(): ZIPCodeLookupEntity {
    return {
      id: this.data.id,
      zip_code: this.data.zipCode,
      city_slug: this.data.citySlug,
      created_at: this.data.timestamp,
      is_valid: this.data.isValid,
      tdsp_id: this.data.tdspId,
      redirect_url: this.data.redirectUrl,
      error_code: this.data.errorCode,
      user_agent: this.data.userAgent,
      session_id: this.data.sessionId
    };
  }

  // Business logic methods
  markAsValid(tdsp: string, redirectUrl: string): void {
    this.data.isValid = true;
    this.data.tdspId = tdsp;
    this.data.redirectUrl = redirectUrl;
    this.data.errorCode = null;
    
    // Re-validate after changes
    ZIPCodeLookupSchema.parse(this.data);
  }

  markAsInvalid(errorCode: string): void {
    this.data.isValid = false;
    this.data.tdspId = null;
    this.data.redirectUrl = null;
    this.data.errorCode = errorCode as unknown; // Type assertion for error codes
    
    // Re-validate after changes
    ZIPCodeLookupSchema.parse(this.data);
  }

  isFromSameCity(): boolean {
    if (!this.data.redirectUrl || !this.data.isValid) {
      return false;
    }
    
    // Check if redirect URL contains the same city as the original citySlug
    return this.data.redirectUrl.includes(this.data.citySlug);
  }

  isCrossCityRedirect(): boolean {
    return this.data.isValid && !this.isFromSameCity();
  }

  getAgeInMinutes(): number {
    const now = new Date();
    const diffMs = now.getTime() - this.data.timestamp.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }

  // Validation methods
  static validateZipCode(zipCode: string): boolean {
    return ZIP_CODE_REGEX.test(zipCode);
  }

  static validateCitySlug(citySlug: string): boolean {
    return /^[a-z0-9\-]+$/.test(citySlug) && citySlug.length > 0;
  }

  static isTexasZipCode(zipCode: string): boolean {
    if (!this.validateZipCode(zipCode)) {
      return false;
    }
    
    const zipNum = parseInt(zipCode, 10);
    // Texas ZIP code ranges (approximate)
    return (zipNum >= 73000 && zipNum <= 73999) ||  // North Texas
           (zipNum >= 74000 && zipNum <= 79999);     // Rest of Texas
  }

  // Static factory methods for common scenarios
  static createValid(data: {
    zipCode: string;
    citySlug: string;
    tdspId: string;
    redirectUrl: string;
    userAgent: string;
    sessionId: string;
  }): ZIPCodeLookupModel {
    return this.create({
      ...data,
      isValid: true,
      errorCode: null
    });
  }

  static createInvalid(data: {
    zipCode: string;
    citySlug: string;
    errorCode: string;
    userAgent: string;
    sessionId: string;
  }): ZIPCodeLookupModel {
    return this.create({
      ...data,
      isValid: false,
      tdspId: null,
      redirectUrl: null
    });
  }
}

// Export type guards
export const isZIPCodeLookup = (obj: unknown): obj is ZIPCodeLookup => {
  return ZIPCodeLookupSchema.safeParse(obj).success;
};

export const isZIPCodeLookupEntity = (obj: unknown): obj is ZIPCodeLookupEntity => {
  return ZIPCodeLookupEntitySchema.safeParse(obj).success;
};