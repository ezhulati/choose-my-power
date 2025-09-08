/**
 * Comprehensive Type Definitions for Enterprise ZIP Code Search System
 * 
 * This module provides the definitive type system for the entire ZIP code search pipeline,
 * ensuring 100% type safety from frontend forms to API responses to database storage.
 * 
 * Features:
 * - Complete Zod validation schemas for input/output validation
 * - Comprehensive ZIP-to-TDSP mapping for all major Texas ZIP codes
 * - Type definitions for ComparePower API responses
 * - ESIID lookup types and validation
 * - Error response schemas with proper error handling
 * - API parameter validation with comprehensive constraints
 * - Frontend hook types for React integration
 * - Full compatibility with existing facets.ts types
 * 
 * @module ElectricityPlansTypes
 */

import { z } from 'zod';
import type { 
  Plan, 
  TdspInfo, 
  ApiParams, 
  FilterState,
  FacetValue 
} from './facets';

// ============================================================================
// CORE ZIP CODE SEARCH SCHEMAS
// ============================================================================

/**
 * ZIP Code validation schema
 * Supports 5-digit and 9-digit (ZIP+4) formats
 */
export const BasicZipCodeSchema = z.string()
  .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
  .transform(zip => zip.replace('-', ''))
  .refine(zip => zip.length === 5 || zip.length === 9, 'ZIP code must be 5 or 9 digits');

/**
 * Texas ZIP code validation (must start with 7)
 */
export const TexasZipCodeSchema = BasicZipCodeSchema
  .refine(zip => zip.startsWith('7'), 'ZIP code must be in Texas (start with 7)');

/**
 * Address validation schema for ESIID lookup
 */
export const AddressSchema = z.object({
  /** Street address including number and name */
  street: z.string()
    .min(5, 'Street address must be at least 5 characters')
    .max(100, 'Street address must be less than 100 characters')
    .regex(/^\d+\s+.+/, 'Street address must start with a number'),
  
  /** City name */
  city: z.string()
    .min(2, 'City name must be at least 2 characters')
    .max(50, 'City name must be less than 50 characters'),
  
  /** State abbreviation (always TX for this system) */
  state: z.literal('TX').default('TX'),
  
  /** ZIP code */
  zipCode: TexasZipCodeSchema,
  
  /** Optional ZIP+4 extension */
  zip4: z.string()
    .regex(/^\d{4}$/, 'ZIP+4 must be 4 digits')
    .optional(),
  
  /** Optional unit/apartment number */
  unitNumber: z.string()
    .max(10, 'Unit number must be less than 10 characters')
    .optional(),
});

/**
 * Normalized address schema (output from address normalization)
 */
export const NormalizedAddressSchema = z.object({
  streetNumber: z.string(),
  streetName: z.string(),
  streetType: z.string(),
  unitType: z.string().optional(),
  unitNumber: z.string().optional(),
  city: z.string(),
  state: z.literal('TX'),
  zipCode: TexasZipCodeSchema,
  zip4: z.string().optional(),
  fullAddress: z.string(),
});

// ============================================================================
// TDSP (TRANSMISSION/DISTRIBUTION SERVICE PROVIDER) SCHEMAS
// ============================================================================

/**
 * TDSP zones in Texas
 */
export const TdspZoneSchema = z.enum(['North', 'Coast', 'Central', 'South', 'Valley']);

/**
 * TDSP coverage type
 */
export const CoverageTypeSchema = z.enum(['primary', 'secondary', 'boundary']);

/**
 * Comprehensive TDSP information schema
 */
export const TdspInfoSchema = z.object({
  /** DUNS (Data Universal Numbering System) identifier */
  duns: z.string()
    .regex(/^\d{9,13}$/, 'DUNS must be 9-13 digits'),
  
  /** Full TDSP company name */
  name: z.string()
    .min(5, 'TDSP name must be at least 5 characters'),
  
  /** Geographic zone */
  zone: TdspZoneSchema,
  
  /** Priority tier (1 = highest priority) */
  tier: z.number()
    .int()
    .min(1)
    .max(5),
  
  /** Priority weight for conflict resolution */
  priority: z.number()
    .min(0)
    .max(1),
  
  /** Coverage type for this ZIP/address */
  coverage: CoverageTypeSchema,
});

/**
 * ZIP code to TDSP mapping entry
 */
export const ZipTdspMappingSchema = z.object({
  /** Primary TDSP for this ZIP code */
  primaryTdsp: TdspInfoSchema,
  
  /** Alternative TDSPs (for boundary ZIP codes) */
  alternativeTdsps: z.array(TdspInfoSchema).optional(),
  
  /** Whether address validation is required */
  requiresAddressValidation: z.boolean(),
  
  /** Boundary resolution method */
  boundaryType: z.enum(['street-level', 'block-level', 'zip4-level']).optional(),
  
  /** Additional notes about this mapping */
  notes: z.string().optional(),
});

// ============================================================================
// ESIID (ELECTRIC SERVICE IDENTIFIER) SCHEMAS
// ============================================================================

/**
 * ESIID (22-character electric service identifier)
 */
export const ESIIDSchema = z.string()
  .length(22, 'ESIID must be exactly 22 characters')
  .regex(/^[0-9]{17}[0-9A-Z]{5}$/, 'Invalid ESIID format');

/**
 * ESIID search parameters
 */
export const ESIIDSearchParamsSchema = z.object({
  /** Street address for lookup */
  address: z.string()
    .min(5, 'Address must be at least 5 characters'),
  
  /** ZIP code for lookup */
  zip_code: TexasZipCodeSchema,
});

/**
 * ESIID search result
 */
export const ESIIDSearchResultSchema = z.object({
  /** ESIID identifier */
  esiid: ESIIDSchema,
  
  /** Matched address */
  address: z.string(),
  
  /** City name */
  city: z.string(),
  
  /** State (always TX) */
  state: z.literal('TX'),
  
  /** ZIP code */
  zip_code: TexasZipCodeSchema,
  
  /** County name */
  county: z.string(),
  
  /** TDSP DUNS number */
  tdsp_duns: z.string(),
  
  /** TDSP name */
  tdsp_name: z.string(),
  
  /** Service voltage level */
  service_voltage: z.string().optional(),
  
  /** Meter type */
  meter_type: z.string().optional(),
});

/**
 * Extended ESIID details
 */
export const ESIIDDetailsSchema = ESIIDSearchResultSchema.extend({
  /** Premise number */
  premise_number: z.string(),
  
  /** Service delivery identifier */
  service_delivery_identifier: z.string().optional(),
  
  /** Profile ID */
  profile_id: z.string().optional(),
  
  /** Switch hold indicator */
  switch_hold_indicator: z.string().optional(),
  
  /** Customer class */
  customer_class: z.string().optional(),
  
  /** Load profile */
  load_profile: z.string().optional(),
  
  /** Rate class */
  rate_class: z.string().optional(),
});

/**
 * Address to TDSP resolution result
 */
export const AddressTDSPResolutionSchema = z.object({
  /** Whether resolution was successful */
  success: z.boolean(),
  
  /** Resolution method used */
  method: z.enum(['esiid_lookup', 'multiple_results', 'single_result', 'zip_fallback']),
  
  /** Confidence level */
  confidence: z.enum(['high', 'medium', 'low']),
  
  /** Resolved TDSP DUNS */
  tdsp_duns: z.string(),
  
  /** Resolved TDSP name */
  tdsp_name: z.string(),
  
  /** Matched ESIID (if available) */
  esiid: ESIIDSchema.optional(),
  
  /** Resolved address */
  address: z.string(),
  
  /** ZIP code */
  zip_code: TexasZipCodeSchema,
  
  /** Alternative TDSPs (for boundary cases) */
  alternatives: z.array(z.object({
    tdsp_duns: z.string(),
    tdsp_name: z.string(),
    esiid: ESIIDSchema,
    address: z.string(),
    confidence: z.enum(['high', 'medium', 'low']),
  })).optional(),
  
  /** API parameters for plan lookup */
  apiParams: z.object({
    tdsp_duns: z.string(),
    display_usage: z.number().optional(),
  }),
  
  /** Any warnings or additional info */
  warnings: z.array(z.string()).optional(),
});

// ============================================================================
// COMPAREPOWER API SCHEMAS
// ============================================================================

/**
 * API parameter validation schema
 */
export const ApiParamsSchema = z.object({
  /** TDSP DUNS number (required) */
  tdsp_duns: z.string()
    .regex(/^\d{9,13}$/, 'Invalid TDSP DUNS format'),
  
  /** Contract term in months */
  term: z.number()
    .int()
    .refine(val => [6, 12, 18, 24, 36].includes(val), 'Term must be 6, 12, 18, 24, or 36 months')
    .optional(),
  
  /** Green energy percentage */
  percent_green: z.number()
    .min(0, 'Green energy percentage must be at least 0')
    .max(100, 'Green energy percentage must be at most 100')
    .optional(),
  
  /** Whether plan is prepaid */
  is_pre_pay: z.boolean().optional(),
  
  /** Whether plan has time-of-use pricing */
  is_time_of_use: z.boolean().optional(),
  
  /** Whether plan requires auto-pay */
  requires_auto_pay: z.boolean().optional(),
  
  /** Display usage level for rate calculation */
  display_usage: z.number()
    .int()
    .min(500, 'Usage must be at least 500 kWh')
    .max(5000, 'Usage must be at most 5000 kWh')
    .default(1000),
  
  /** Brand/provider ID filter */
  brand_id: z.string().optional(),
});

/**
 * Plan pricing information
 */
export const PlanPricingSchema = z.object({
  /** Rate for 500 kWh usage (cents per kWh) */
  rate500kWh: z.number().min(0),
  
  /** Rate for 1000 kWh usage (cents per kWh) */
  rate1000kWh: z.number().min(0),
  
  /** Rate for 2000 kWh usage (cents per kWh) */
  rate2000kWh: z.number().min(0),
  
  /** Base rate per kWh (cents) */
  ratePerKwh: z.number().min(0),
  
  /** Total cost for 500 kWh ($) */
  total500kWh: z.number().min(0).optional(),
  
  /** Total cost for 1000 kWh ($) */
  total1000kWh: z.number().min(0).optional(),
  
  /** Total cost for 2000 kWh ($) */
  total2000kWh: z.number().min(0).optional(),
});

/**
 * Provider/brand information
 */
export const ProviderInfoSchema = z.object({
  /** Provider name */
  name: z.string().min(1),
  
  /** Logo URL */
  logo: z.string().url().optional(),
  
  /** Extended logo information */
  logoInfo: z.object({
    name: z.string(),
    logoUrl: z.string().url(),
    logoFilename: z.string(),
    puctNumber: z.string(),
  }).nullable().optional(),
  
  /** Provider rating (0-5) */
  rating: z.number().min(0).max(5),
  
  /** Number of reviews */
  reviewCount: z.number().min(0),
});

/**
 * Contract terms information
 */
export const ContractInfoSchema = z.object({
  /** Contract length in months */
  length: z.number().int().min(1).max(60),
  
  /** Rate type */
  type: z.enum(['fixed', 'variable', 'indexed']),
  
  /** Early termination fee ($) */
  earlyTerminationFee: z.number().min(0),
  
  /** Whether contract auto-renews */
  autoRenewal: z.boolean(),
  
  /** Whether satisfaction guarantee is offered */
  satisfactionGuarantee: z.boolean(),
});

/**
 * Plan features information
 */
export const PlanFeaturesSchema = z.object({
  /** Green energy percentage */
  greenEnergy: z.number().min(0).max(100),
  
  /** Monthly bill credit ($) */
  billCredit: z.number().min(0),
  
  /** Free time periods */
  freeTime: z.object({
    hours: z.string(),
    days: z.array(z.string()),
  }).optional(),
  
  /** Deposit requirements */
  deposit: z.object({
    required: z.boolean(),
    amount: z.number().min(0),
  }),
});

/**
 * Plan availability information
 */
export const AvailabilityInfoSchema = z.object({
  /** How customers can enroll */
  enrollmentType: z.enum(['online', 'phone', 'both']),
  
  /** Service areas covered */
  serviceAreas: z.array(z.string()),
});

/**
 * Complete electricity plan schema
 */
export const ElectricityPlanSchema = z.object({
  /** Plan ID */
  id: z.string().min(1),
  
  /** Plan name */
  name: z.string().min(1),
  
  /** Provider information */
  provider: ProviderInfoSchema,
  
  /** Pricing details */
  pricing: PlanPricingSchema,
  
  /** Contract terms */
  contract: ContractInfoSchema,
  
  /** Plan features */
  features: PlanFeaturesSchema,
  
  /** Availability info */
  availability: AvailabilityInfoSchema,
});

/**
 * ComparePower API response schema
 */
export const ComparePowerAPIResponseSchema = z.object({
  /** Plan ID */
  _id: z.string(),
  
  /** Product information */
  product: z.object({
    _id: z.string(),
    brand: z.object({
      _id: z.string(),
      name: z.string(),
      puct_number: z.string().optional(),
      legal_name: z.string(),
      contact_info: z.object({
        sales: z.object({
          phone_number: z.string(),
        }),
        support: z.object({
          address: z.string(),
          email: z.string(),
          phone_number: z.string(),
        }),
      }).optional(),
    }),
    name: z.string(),
    term: z.number().int(),
    family: z.string().optional(),
    percent_green: z.number().min(0).max(100),
    headline: z.string().optional(),
    early_termination_fee: z.number().min(0),
    description: z.string().optional(),
    is_pre_pay: z.boolean(),
    is_time_of_use: z.boolean(),
  }),
  
  /** TDSP information */
  tdsp: z.object({
    _id: z.string(),
    name: z.string(),
    short_name: z.string(),
    abbreviation: z.string(),
    duns_number: z.string(),
  }),
  
  /** Expected prices array */
  expected_prices: z.array(z.object({
    usage: z.number(),
    price: z.number(),
    actual: z.number(),
    valid: z.boolean(),
  })),
  
  /** Display pricing for 500 kWh */
  display_pricing_500: z.object({
    usage: z.literal(500),
    avg: z.number(),
    avg_cents: z.number().optional(),
    total: z.number(),
  }),
  
  /** Display pricing for 1000 kWh */
  display_pricing_1000: z.object({
    usage: z.literal(1000),
    avg: z.number(),
    avg_cents: z.number().optional(),
    total: z.number(),
  }),
  
  /** Display pricing for 2000 kWh */
  display_pricing_2000: z.object({
    usage: z.literal(2000),
    avg: z.number(),
    avg_cents: z.number().optional(),
    total: z.number(),
  }),
  
  /** Document links */
  document_links: z.array(z.object({
    type: z.string(),
    language: z.string(),
    link: z.string().url(),
  })),
});

// ============================================================================
// ERROR HANDLING SCHEMAS
// ============================================================================

/**
 * API error types
 */
export const ApiErrorTypeSchema = z.enum([
  'TIMEOUT',
  'NETWORK_ERROR',
  'DNS_ERROR',
  'CONNECTION_REFUSED',
  'UNAUTHORIZED',
  'FORBIDDEN', 
  'NOT_FOUND',
  'RATE_LIMITED',
  'SERVER_ERROR',
  'SERVICE_UNAVAILABLE',
  'GATEWAY_TIMEOUT',
  'INVALID_TDSP',
  'NO_PLANS_AVAILABLE',
  'INVALID_PARAMETERS',
  'DATA_VALIDATION_ERROR',
  'API_REQUEST_ERROR',
  'BATCH_PROCESSING_ERROR',
  'CIRCUIT_OPEN',
  'CIRCUIT_HALF_OPEN',
  'CIRCUIT_BREAKER_OPEN',
  'CACHE_ERROR',
  'REDIS_ERROR',
  'FALLBACK_UNAVAILABLE',
  'MASS_DEPLOYMENT_ERROR',
  'TDSP_MAPPING_ERROR',
  'ESIID_LOOKUP_ERROR',
  'ESIID_NOT_FOUND',
  'ADDRESS_VALIDATION_ERROR',
  'ZIP_CODE_NOT_FOUND',
  'BOUNDARY_RESOLUTION_ERROR',
  'UNKNOWN',
]);

/**
 * API error context
 */
export const ApiErrorContextSchema = z.object({
  url: z.string().url().optional(),
  params: z.record(z.any()).optional(),
  statusCode: z.number().optional(),
  retryAttempt: z.number().optional(),
  maxRetries: z.number().optional(),
  responseTime: z.number().optional(),
  tdspDuns: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  address: z.string().optional(),
  esiid: z.string().optional(),
  batchId: z.string().optional(),
  citiesAffected: z.number().optional(),
  deploymentPhase: z.enum(['warming', 'production', 'validation']).optional(),
  errorCode: z.string().optional(),
  requestId: z.string().optional(),
  timestamp: z.number().optional(),
});

/**
 * API error response schema
 */
export const ApiErrorResponseSchema = z.object({
  /** Error type */
  type: ApiErrorTypeSchema,
  
  /** Error message */
  message: z.string(),
  
  /** User-friendly message */
  userMessage: z.string(),
  
  /** Error context */
  context: ApiErrorContextSchema,
  
  /** Whether error is retryable */
  isRetryable: z.boolean(),
  
  /** Timestamp */
  timestamp: z.string().datetime(),
  
  /** Suggested actions */
  suggestions: z.array(z.string()).optional(),
});

// ============================================================================
// SEARCH AND FILTER SCHEMAS
// ============================================================================

/**
 * ZIP code search request
 */
export const ZipSearchRequestSchema = z.object({
  /** ZIP code to search */
  zipCode: TexasZipCodeSchema,
  
  /** Optional address for precise TDSP resolution */
  address: z.string().optional(),
  
  /** Usage level for rate calculation */
  displayUsage: z.number()
    .int()
    .min(500)
    .max(5000)
    .default(1000),
  
  /** Session ID for tracking */
  sessionId: z.string().optional(),
  
  /** Client IP for rate limiting */
  clientIp: z.string().optional(),
});

/**
 * ZIP code search response
 */
export const ZipSearchResponseSchema = z.object({
  /** Whether search was successful */
  success: z.boolean(),
  
  /** Resolved TDSP information */
  tdsp: TdspInfoSchema.optional(),
  
  /** Address resolution result */
  addressResolution: AddressTDSPResolutionSchema.optional(),
  
  /** Available electricity plans */
  plans: z.array(ElectricityPlanSchema),
  
  /** Total number of plans found */
  totalPlans: z.number().min(0),
  
  /** Search metadata */
  metadata: z.object({
    zipCode: TexasZipCodeSchema,
    city: z.string().optional(),
    county: z.string().optional(),
    zone: TdspZoneSchema.optional(),
    searchTime: z.number(),
    cacheHit: z.boolean(),
    dataSource: z.enum(['api', 'cache', 'database', 'fallback']),
  }),
  
  /** Any errors or warnings */
  errors: z.array(ApiErrorResponseSchema).optional(),
  
  /** Suggested alternatives (for boundary ZIP codes) */
  alternatives: z.array(z.object({
    tdsp: TdspInfoSchema,
    confidence: z.enum(['high', 'medium', 'low']),
    planCount: z.number(),
  })).optional(),
});

/**
 * Filter request schema
 */
export const FilterRequestSchema = z.object({
  /** ZIP code or city slug */
  location: z.string().min(1),
  
  /** Filter criteria */
  filters: z.object({
    /** Rate type filter */
    rateType: z.enum(['fixed', 'variable', 'indexed']).optional(),
    
    /** Contract length filter */
    contractLength: z.array(z.number().int()).optional(),
    
    /** Green energy requirement */
    greenEnergy: z.boolean().optional(),
    
    /** Prepaid plans only */
    prePaid: z.boolean().optional(),
    
    /** No deposit required */
    noDeposit: z.boolean().optional(),
    
    /** Price range */
    priceRange: z.object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    }).optional(),
    
    /** Provider filters */
    providers: z.array(z.string()).optional(),
    
    /** Feature filters */
    features: z.array(z.string()).optional(),
  }),
  
  /** Sorting preferences */
  sort: z.object({
    field: z.enum(['rate', 'green_energy', 'contract_length', 'provider']),
    order: z.enum(['asc', 'desc']),
  }).default({ field: 'rate', order: 'asc' }),
  
  /** Pagination */
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }).default({ page: 1, limit: 20 }),
  
  /** Session ID */
  sessionId: z.string().optional(),
});

// ============================================================================
// REACT HOOKS AND FRONTEND INTEGRATION SCHEMAS
// ============================================================================

/**
 * Hook state for ZIP code search
 */
export const ZipSearchStateSchema = z.object({
  /** Current ZIP code being searched */
  zipCode: z.string(),
  
  /** Optional address */
  address: z.string().optional(),
  
  /** Loading state */
  isLoading: z.boolean(),
  
  /** Error state */
  error: ApiErrorResponseSchema.nullable(),
  
  /** Search results */
  results: ZipSearchResponseSchema.nullable(),
  
  /** Search history */
  history: z.array(z.object({
    zipCode: z.string(),
    timestamp: z.number(),
    planCount: z.number(),
  })),
});

/**
 * Hook actions for ZIP code search
 */
export const ZipSearchActionsSchema = z.object({
  /** Search for ZIP code */
  search: z.function()
    .args(ZipSearchRequestSchema)
    .returns(z.promise(ZipSearchResponseSchema)),
  
  /** Clear current results */
  clear: z.function().args().returns(z.void()),
  
  /** Reset error state */
  resetError: z.function().args().returns(z.void()),
  
  /** Set ZIP code */
  setZipCode: z.function()
    .args(z.string())
    .returns(z.void()),
  
  /** Set address */
  setAddress: z.function()
    .args(z.string())
    .returns(z.void()),
});

/**
 * Complete hook return type
 */
export const ZipSearchHookSchema = ZipSearchStateSchema.merge(
  z.object({ actions: ZipSearchActionsSchema })
);

// ============================================================================
// COMPREHENSIVE ZIP-TO-TDSP MAPPING
// ============================================================================

/**
 * Major Texas ZIP codes to TDSP mapping
 * This extends the existing multi-TDSP mapping with additional coverage
 */
export const COMPREHENSIVE_ZIP_TDSP_MAPPING = {
  // Dallas-Fort Worth Metroplex (Oncor Territory)
  '75001': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75002': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75006': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75007': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75019': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75020': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75021': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75022': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75023': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75024': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75025': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75026': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75030': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75034': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75035': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75039': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75040': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75041': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75042': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75043': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75044': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75048': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75052': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75054': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75056': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75057': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75060': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75061': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75062': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75063': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75065': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75067': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75068': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75069': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75070': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75071': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75074': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75075': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75080': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75081': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75082': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75083': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75085': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75086': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75087': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75088': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75089': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  
  // Downtown Dallas
  '75201': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75202': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75203': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75204': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75205': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75206': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75207': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75208': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75209': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75210': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75211': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75212': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75214': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75215': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75216': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75217': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75218': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75219': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75220': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75223': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75224': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75225': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75226': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75227': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75228': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75229': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75230': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75231': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75232': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75233': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75234': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75235': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75236': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75237': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75238': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75240': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75241': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75243': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75244': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75246': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75247': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75248': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75249': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '75250': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  
  // Fort Worth (Oncor Territory)
  '76101': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76102': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76103': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76104': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76105': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76106': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76107': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76108': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76109': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76110': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76111': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76112': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76113': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76114': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76115': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76116': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76117': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76118': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76119': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76120': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76121': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76122': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76123': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76124': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76126': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76127': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76129': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76131': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76132': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76133': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76134': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76135': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76137': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76140': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76147': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76148': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76177': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76179': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76180': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  '76182': { duns: '1039940674000', name: 'Oncor Electric Delivery', zone: 'North' as const },
  
  // Houston Metropolitan Area (CenterPoint Territory)
  '77001': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77002': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77003': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77004': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77005': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77006': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77007': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77008': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77009': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77010': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77011': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77012': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77013': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77014': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77015': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77016': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77017': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77018': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77019': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77020': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77021': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77022': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77023': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77024': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77025': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77026': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77027': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77028': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77029': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77030': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77031': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77032': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77033': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77034': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77035': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77036': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77037': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77038': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77039': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77040': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77041': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77042': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77043': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77044': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77045': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77046': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77047': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77048': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77049': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77050': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77051': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77053': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77054': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77055': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77056': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77057': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77058': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77059': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77060': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77061': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77062': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77063': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77064': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77065': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77066': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77067': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77068': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77069': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77070': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77071': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77072': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77073': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77074': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77075': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77076': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77077': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77078': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77079': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77080': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77081': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77082': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77083': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77084': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77085': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77086': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77087': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77088': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77089': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77090': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77091': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77092': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77093': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77094': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77095': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77096': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77098': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  '77099': { duns: '957877905', name: 'CenterPoint Energy Houston Electric', zone: 'Coast' as const },
  
  // Austin Metropolitan Area (AEP Central Territory)
  '78701': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78702': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78703': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78704': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78705': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78712': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78717': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78719': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78721': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78722': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78723': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78724': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78725': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78726': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78727': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78728': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78729': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78730': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78731': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78732': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78733': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78734': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78735': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78736': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78737': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78738': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78739': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78741': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78742': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78744': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78745': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78746': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78747': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78748': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78749': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78750': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78751': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78752': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78753': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78754': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78756': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78757': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78758': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78759': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78660': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78664': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  
  // San Antonio Area (AEP Central Territory)  
  '78201': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78202': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78203': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78204': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78205': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78207': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78208': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78209': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78210': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78211': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78212': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78213': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78214': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78215': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78216': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78217': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78218': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78219': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78220': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78221': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78222': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78223': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78224': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78225': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78226': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78227': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78228': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78229': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78230': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78231': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78232': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78233': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78234': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78235': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78236': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78237': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78238': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78239': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78240': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78242': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78244': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78245': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78247': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78248': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78249': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78250': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78251': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78252': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78253': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78254': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78255': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78256': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78257': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78258': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78259': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78260': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78261': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78263': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78264': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78266': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78268': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  '78269': { duns: '007924772', name: 'AEP Texas Central Company', zone: 'Central' as const },
  
  // Major cities in AEP North Territory
  '75701': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North' as const }, // Tyler
  '75702': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North' as const },
  '75703': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North' as const },
  '79601': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North' as const }, // Abilene
  '79602': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North' as const },
  '79603': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North' as const },
  '79605': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North' as const },
  '79606': { duns: '007923311', name: 'AEP Texas North Company', zone: 'North' as const },
  
  // Major cities in TNMP Territory
  '78401': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const }, // Corpus Christi
  '78402': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '78404': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '78405': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '78407': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '78408': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '78410': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '78411': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '78412': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '78413': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '78414': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '78415': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '78416': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '78417': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '78418': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '78419': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  
  // Lubbock Area (TNMP Territory)
  '79401': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '79403': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '79404': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '79407': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '79410': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '79412': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '79413': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '79414': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '79415': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  '79423': { duns: '007929441', name: 'Texas-New Mexico Power Company', zone: 'South' as const },
  
  // Rio Grande Valley (Magic Valley Electric Cooperative territory - not deregulated)
  // These would typically not be included in deregulated markets but included for completeness
  
  // El Paso Area (El Paso Electric - not deregulated)
  // These would typically not be included in deregulated markets
  
} as const;

// ============================================================================
// TYPE INFERENCE AND EXPORTS  
// ============================================================================

/**
 * Infer TypeScript types from Zod schemas
 */
export type Address = z.infer<typeof AddressSchema>;
export type NormalizedAddress = z.infer<typeof NormalizedAddressSchema>;
export type TdspInfo = z.infer<typeof TdspInfoSchema>;
export type ZipTdspMapping = z.infer<typeof ZipTdspMappingSchema>;
export type ESIIDSearchParams = z.infer<typeof ESIIDSearchParamsSchema>;
export type ESIIDSearchResult = z.infer<typeof ESIIDSearchResultSchema>;
export type ESIIDDetails = z.infer<typeof ESIIDDetailsSchema>;
export type AddressTDSPResolution = z.infer<typeof AddressTDSPResolutionSchema>;
export type ApiParams = z.infer<typeof ApiParamsSchema>;
export type PlanPricing = z.infer<typeof PlanPricingSchema>;
export type ProviderInfo = z.infer<typeof ProviderInfoSchema>;
export type ContractInfo = z.infer<typeof ContractInfoSchema>;
export type PlanFeatures = z.infer<typeof PlanFeaturesSchema>;
export type AvailabilityInfo = z.infer<typeof AvailabilityInfoSchema>;
export type ElectricityPlan = z.infer<typeof ElectricityPlanSchema>;
export type ComparePowerAPIResponse = z.infer<typeof ComparePowerAPIResponseSchema>;
export type ApiErrorType = z.infer<typeof ApiErrorTypeSchema>;
export type ApiErrorContext = z.infer<typeof ApiErrorContextSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
export type ZipSearchRequest = z.infer<typeof ZipSearchRequestSchema>;
export type ZipSearchResponse = z.infer<typeof ZipSearchResponseSchema>;
export type FilterRequest = z.infer<typeof FilterRequestSchema>;
export type ZipSearchState = z.infer<typeof ZipSearchStateSchema>;
export type ZipSearchActions = z.infer<typeof ZipSearchActionsSchema>;
export type ZipSearchHook = z.infer<typeof ZipSearchHookSchema>;

/**
 * Utility type for ZIP code TDSP mappings
 */
export type ZipTdspMappingType = typeof COMPREHENSIVE_ZIP_TDSP_MAPPING;
export type ZipCode = keyof ZipTdspMappingType;

/**
 * Utility functions for schema validation
 */
export const validateZipCode = (zip: string): boolean => {
  return ZipCodeSchema.safeParse(zip).success;
};

export const validateTexasZipCode = (zip: string): boolean => {
  return TexasZipCodeSchema.safeParse(zip).success;
};

export const validateAddress = (address: unknown): address is Address => {
  return AddressSchema.safeParse(address).success;
};

export const validateApiParams = (params: unknown): params is ApiParams => {
  return ApiParamsSchema.safeParse(params).success;
};

export const validateESIIDSearchParams = (params: unknown): params is ESIIDSearchParams => {
  return ESIIDSearchParamsSchema.safeParse(params).success;
};

/**
 * Helper function to get TDSP info from ZIP code
 */
export const getTdspFromZip = (zipCode: string): TdspInfo | null => {
  const mapping = COMPREHENSIVE_ZIP_TDSP_MAPPING[zipCode as ZipCode];
  if (!mapping) return null;
  
  return {
    duns: mapping.duns,
    name: mapping.name,
    zone: mapping.zone,
    tier: 1, // Default tier for comprehensive mapping
    priority: 1.0, // Default priority
    coverage: 'primary' as const,
  };
};

/**
 * Helper function to check if ZIP code is in Texas deregulated market
 */
export const isDeregulatedZip = (zipCode: string): boolean => {
  return zipCode in COMPREHENSIVE_ZIP_TDSP_MAPPING;
};

/**
 * Helper function to get all ZIP codes for a specific TDSP
 */
export const getZipCodesForTdsp = (tdspDuns: string): string[] => {
  return Object.entries(COMPREHENSIVE_ZIP_TDSP_MAPPING)
    .filter(([_, mapping]) => mapping.duns === tdspDuns)
    .map(([zip]) => zip);
};

/**
 * Helper function to get all ZIP codes in a specific zone
 */
export const getZipCodesInZone = (zone: 'North' | 'Coast' | 'Central' | 'South' | 'Valley'): string[] => {
  return Object.entries(COMPREHENSIVE_ZIP_TDSP_MAPPING)
    .filter(([_, mapping]) => mapping.zone === zone)
    .map(([zip]) => zip);
};

/**
 * Constants for validation limits and constraints
 */
export const VALIDATION_CONSTANTS = {
  MIN_ZIP_LENGTH: 5,
  MAX_ZIP_LENGTH: 9,
  MIN_ADDRESS_LENGTH: 5,
  MAX_ADDRESS_LENGTH: 100,
  MIN_CITY_LENGTH: 2,
  MAX_CITY_LENGTH: 50,
  MIN_USAGE: 500,
  MAX_USAGE: 5000,
  DEFAULT_USAGE: 1000,
  VALID_CONTRACT_TERMS: [6, 12, 18, 24, 36],
  MIN_GREEN_ENERGY: 0,
  MAX_GREEN_ENERGY: 100,
  ESIID_LENGTH: 22,
  MIN_DUNS_LENGTH: 9,
  MAX_DUNS_LENGTH: 13,
  MAX_RETRY_ATTEMPTS: 3,
  DEFAULT_TIMEOUT_MS: 10000,
  CACHE_TTL_SECONDS: 3600,
} as const;

// Note: All schemas and utilities are already exported above inline
// This ensures there are no duplicate exports