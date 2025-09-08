// ZIP validation schemas with Zod
// Feature: Add Comprehensive ZIP Code Lookup Forms to City Pages

import { z } from 'zod';
import { ZIP_CODE_REGEX, ERROR_CODES } from '../../types/zip-validation';
import type { 
  ZIPValidationRequest, 
  CityZipCodesResponse, 
  FormInteractionRequest,
  APIErrorResponse,
  FormAction,
  DeviceType
} from '../../types/zip-validation';

// Base ZIP code validation
export const ZipCodeSchema = z
  .string()
  .regex(ZIP_CODE_REGEX, 'ZIP code must be exactly 5 digits')
  .refine((zip) => {
    const zipNum = parseInt(zip, 10);
    return zipNum >= 73000 && zipNum <= 79999;
  }, 'ZIP code must be in Texas range (73000-79999)');

// Partial ZIP code for input validation (allows 1-5 digits)
export const PartialZipCodeSchema = z
  .string()
  .regex(/^\d{1,5}$/, 'ZIP code must contain only digits')
  .max(5, 'ZIP code cannot exceed 5 digits');

// City slug validation
export const CitySlugSchema = z
  .string()
  .min(1, 'City slug is required')
  .regex(/^[a-z0-9\-]+$/, 'City slug must contain only lowercase letters, numbers, and hyphens')
  .max(50, 'City slug too long');

// Session ID validation
export const SessionIdSchema = z
  .string()
  .uuid('Session ID must be a valid UUID')
  .optional();

// Device type validation
export const DeviceTypeSchema = z.enum(['mobile', 'desktop', 'tablet']);

// Form action validation
export const FormActionSchema = z.enum(['focus', 'input', 'submit', 'error', 'redirect']);

// API Request Schemas

// POST /api/zip/validate request
export const ZIPValidationRequestSchema = z.object({
  zipCode: ZipCodeSchema,
  citySlug: CitySlugSchema,
  sessionId: SessionIdSchema
});

// POST /api/analytics/form-interaction request
export const FormInteractionRequestSchema = z.object({
  zipCode: PartialZipCodeSchema.or(z.literal('')), // Allow empty for focus events
  cityPage: CitySlugSchema,
  action: FormActionSchema,
  timestamp: z.string().datetime().optional(),
  duration: z.number().int().min(0, 'Duration must be non-negative').max(300000, 'Duration too long (max 5 minutes)'),
  deviceType: DeviceTypeSchema,
  sessionId: SessionIdSchema,
  success: z.boolean()
});

// API Response Schemas

// ZIP validation response
export const ZIPValidationResponseSchema = z.object({
  zipCode: z.string().regex(ZIP_CODE_REGEX),
  isValid: z.boolean(),
  tdsp: z.string().nullable(),
  citySlug: z.string().nullable(),
  redirectUrl: z.string().url().nullable(),
  availablePlans: z.number().int().min(0),
  errorMessage: z.string().nullable(),
  suggestions: z.array(z.string().regex(ZIP_CODE_REGEX)).default([])
});

// City ZIP codes response
export const CityZipCodesResponseSchema = z.object({
  citySlug: CitySlugSchema,
  cityName: z.string().min(1, 'City name is required'),
  zipCodes: z.array(z.object({
    zipCode: z.string().regex(ZIP_CODE_REGEX),
    tdsp: z.string().min(1, 'TDSP is required'),
    planCount: z.number().int().min(0)
  })),
  totalZipCodes: z.number().int().min(0)
});

// Error response schema
export const APIErrorResponseSchema = z.object({
  error: z.string().min(1, 'Error code is required'),
  message: z.string().min(1, 'Error message is required'),
  details: z.record(z.any()).optional(),
  timestamp: z.string().datetime()
});

// Form validation schemas for client-side

// ZIP lookup form data
export const ZIPFormDataSchema = z.object({
  zipCode: ZipCodeSchema
});

// Progressive form validation (for input events)
export const ProgressiveZIPSchema = z.object({
  zipCode: z.string()
    .regex(/^\d*$/, 'ZIP code must contain only digits')
    .max(5, 'ZIP code cannot exceed 5 digits')
    .transform((val) => {
      // Validate completeness when user stops typing
      if (val.length === 5) {
        return ZipCodeSchema.parse(val);
      }
      return val;
    })
});

// Combined validation for form submission
export const ZIPSubmissionSchema = z.object({
  zipCode: ZipCodeSchema,
  citySlug: CitySlugSchema,
  sessionId: SessionIdSchema,
  userAgent: z.string().min(1, 'User agent is required'),
  timestamp: z.date().default(() => new Date())
});

// Validation functions

export const validateZIPRequest = (data: unknown): ZIPValidationRequest => {
  return ZIPValidationRequestSchema.parse(data);
};

export const validateFormInteractionRequest = (data: unknown): FormInteractionRequest => {
  return FormInteractionRequestSchema.parse(data);
};

export const validateCitySlug = (citySlug: unknown): string => {
  return CitySlugSchema.parse(citySlug);
};

export const validateZipCode = (zipCode: unknown): string => {
  return ZipCodeSchema.parse(zipCode);
};

export const validatePartialZipCode = (zipCode: unknown): string => {
  return PartialZipCodeSchema.parse(zipCode);
};

// Sanitization functions

export const sanitizeZipCode = (input: string): string => {
  // Remove all non-digit characters and limit to 5 digits
  return input.replace(/\D/g, '').slice(0, 5);
};

export const sanitizeCitySlug = (input: string): string => {
  // Convert to lowercase, replace spaces with hyphens, remove invalid chars
  return input
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Texas-specific validation

export const isValidTexasZipCode = (zipCode: string): boolean => {
  try {
    ZipCodeSchema.parse(zipCode);
    return true;
  } catch {
    return false;
  }
};

export const getZipCodeRegion = (zipCode: string): string | null => {
  if (!isValidTexasZipCode(zipCode)) return null;
  
  const zipNum = parseInt(zipCode, 10);
  
  if (zipNum >= 73000 && zipNum <= 73999) return 'North Texas';
  if (zipNum >= 74000 && zipNum <= 74999) return 'East Texas';
  if (zipNum >= 75000 && zipNum <= 75999) return 'Dallas Metro';
  if (zipNum >= 76000 && zipNum <= 76999) return 'Fort Worth Metro';
  if (zipNum >= 77000 && zipNum <= 77999) return 'Houston Metro';
  if (zipNum >= 78000 && zipNum <= 78999) return 'Austin/San Antonio';
  if (zipNum >= 79000 && zipNum <= 79999) return 'West Texas';
  
  return 'Other Texas';
};

// Error generation helpers

export const createValidationError = (
  error: keyof typeof ERROR_CODES,
  message: string,
  details?: Record<string, any>
): APIErrorResponse => {
  return {
    error: ERROR_CODES[error],
    message,
    details,
    timestamp: new Date().toISOString()
  };
};

export const createZipFormatError = (zipCode: string): APIErrorResponse => {
  return createValidationError(
    'INVALID_FORMAT',
    'ZIP code must be exactly 5 digits',
    { providedZipCode: zipCode }
  );
};

export const createZipNotInTexasError = (zipCode: string, suggestions: string[] = []): APIErrorResponse => {
  return createValidationError(
    'NOT_IN_TEXAS',
    `ZIP code ${zipCode} is not in Texas electricity service area`,
    { providedZipCode: zipCode, suggestions }
  );
};

export const createRateLimitError = (): APIErrorResponse => {
  return createValidationError(
    'RATE_LIMITED',
    'Too many requests. Please try again later.',
    { retryAfter: 60 }
  );
};

// Suggestion generation

export const generateZipSuggestions = (invalidZip: string, targetCity?: string): string[] => {
  // Simple suggestion logic - would be enhanced with real ZIP code proximity data
  const suggestions: string[] = [];
  
  if (targetCity) {
    // City-specific common ZIP codes
    const cityZips: Record<string, string[]> = {
      'dallas-tx': ['75201', '75202', '75203', '75204', '75205'],
      'houston-tx': ['77001', '77002', '77003', '77004', '77005'],
      'austin-tx': ['78701', '78702', '78703', '78704', '78705'],
      'san-antonio-tx': ['78201', '78202', '78203', '78204', '78205']
    };
    
    if (cityZips[targetCity]) {
      suggestions.push(...cityZips[targetCity].slice(0, 3));
    }
  }
  
  // Fallback to common Texas ZIP codes
  if (suggestions.length === 0) {
    suggestions.push('75201', '77001', '78701'); // Dallas, Houston, Austin
  }
  
  return suggestions;
};

// Performance validation

export const validatePerformanceConstraints = (
  operation: string,
  duration: number
): { isValid: boolean; warning?: string } => {
  const constraints: Record<string, number> = {
    zipValidation: 200,    // 200ms max
    cityLookup: 100,      // 100ms max
    formSubmission: 50,    // 50ms max client-side
    analytics: 25          // 25ms max async
  };
  
  const maxDuration = constraints[operation];
  if (!maxDuration) {
    return { isValid: true };
  }
  
  const isValid = duration <= maxDuration;
  const warning = isValid ? undefined : 
    `${operation} took ${duration}ms, exceeding ${maxDuration}ms limit`;
    
  return { isValid, warning };
};

// All schemas are already exported individually above