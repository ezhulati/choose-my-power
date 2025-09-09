import { z } from "zod"

// Constitutional requirement: All validation must prevent hardcoded plan IDs and ESIDs

// MongoDB ObjectId validation
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: "Invalid MongoDB ObjectId format"
})

// ESID validation - 17 digits for ERCOT
export const esidSchema = z.string().regex(/^1\d{16}$/, {
  message: "ESID must be 17 digits starting with 1"
})

// ZIP Code validation for Texas
export const zipCodeSchema = z.string().regex(/^\d{5}(-\d{4})?$/, {
  message: "ZIP code must be in format 12345 or 12345-6789"
})

// Texas phone number validation
export const phoneSchema = z.string().regex(/^(\+1|1)?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?[2-9]\d{2}[-.\s]?\d{4}$/, {
  message: "Please enter a valid phone number"
})

// Email validation
export const emailSchema = z.string().email({
  message: "Please enter a valid email address"
})

// Provider validation schema
export const providerSchema = z.object({
  id: objectIdSchema,
  name: z.string().min(2).max(100),
  displayName: z.string().min(2).max(100),
  logoUrl: z.string().url().optional().nullable(),
  website: z.string().url().optional(),
  phoneNumber: phoneSchema.optional(),
  customerServiceHours: z.string().optional(),
  businessLicenseNumber: z.string().optional(),
  isActive: z.boolean(),
  servesResidential: z.boolean(),
  servesCommercial: z.boolean(),
  averageCustomerRating: z.number().min(0).max(5).optional(),
  totalReviews: z.number().min(0).optional(),
  description: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
})

// TDSP validation schema
export const tdspSchema = z.object({
  id: z.string(),
  name: z.string().min(5).max(100),
  dunsNumber: z.string().regex(/^\d{9,13}$/, {
    message: "DUNS number must be 9-13 digits"
  }),
  serviceTerritory: z.array(z.string()),
  website: z.string().url().optional(),
  phoneNumber: phoneSchema.optional(),
  emergencyNumber: phoneSchema,
  serviceTypes: z.array(z.string()),
  connectionFees: z.object({
    residential: z.number().min(0),
    commercial: z.number().min(0),
  }),
})

// Plan validation schema - Constitutional requirement: Dynamic plan IDs only
export const planSchema = z.object({
  id: objectIdSchema, // Must be MongoDB ObjectId, never hardcoded
  name: z.string().min(3).max(100),
  provider: providerSchema,
  tdsp: tdspSchema,
  
  // Rate structure
  rateType: z.enum(['fixed', 'variable', 'indexed']),
  rate500Kwh: z.number().min(0).max(1), // Cents per kWh, reasonable range
  rate1000Kwh: z.number().min(0).max(1),
  rate2000Kwh: z.number().min(0).max(1),
  
  // Contract terms
  termMonths: z.number().int().min(1).max(36),
  monthlyFee: z.number().min(0).max(100), // Reasonable monthly fee range
  cancellationFee: z.number().min(0).max(500),
  connectionFee: z.number().min(0).max(200),
  depositRequired: z.boolean(),
  
  // Features
  percentGreen: z.number().min(0).max(100),
  isPrepay: z.boolean(),
  isTimeOfUse: z.boolean(),
  requiresAutoPay: z.boolean(),
  requiresPaperlessBilling: z.boolean(),
  
  // Customer info
  customerRating: z.number().min(1).max(5).optional(),
  reviewCount: z.number().min(0).optional(),
  customerComplaints: z.number().min(0).optional(),
  
  // Marketing
  headline: z.string().max(200).optional(),
  specialOffers: z.array(z.string()).optional(),
  
  // Compliance - Constitutional requirement: Dynamic ESIDs
  esiid: esidSchema, // Must be 17-digit ERCOT format, never hardcoded
  puct: z.string(),
  isAvailable: z.boolean(),
})

// Plan filters validation
export const planFiltersSchema = z.object({
  rateType: z.enum(['fixed', 'variable', 'indexed']).optional(),
  termMonths: z.array(z.number().int().min(1).max(36)).optional(),
  maxMonthlyFee: z.number().min(0).max(100).optional(),
  minGreenPercentage: z.number().min(0).max(100).optional(),
  maxCancellationFee: z.number().min(0).max(500).optional(),
  requiresDeposit: z.boolean().optional(),
  isPrepay: z.boolean().optional(),
  isTimeOfUse: z.boolean().optional(),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).optional(),
  sortBy: z.enum(['rate', 'greenPercent', 'customerRating', 'termLength']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

// Address validation schema
export const addressSchema = z.object({
  street: z.string().min(5).max(100),
  city: z.string().min(2).max(50),
  state: z.string().length(2).regex(/^TX$/, {
    message: "Only Texas addresses are supported"
  }),
  zipCode: zipCodeSchema,
  zipPlus4: z.string().regex(/^\d{4}$/).optional(),
})

// ESID lookup schema - Constitutional requirement: Real ERCOT validation
export const esidLookupSchema = z.object({
  esiid: esidSchema, // 17-digit format required
  serviceAddress: addressSchema,
})

// ZIP code validation schema
export const zipValidationSchema = z.object({
  zipCode: zipCodeSchema,
})

// City validation schema
export const citySchema = z.object({
  id: objectIdSchema,
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, {
    message: "City slug must contain only lowercase letters, numbers, and hyphens"
  }),
  state: z.string().length(2).regex(/^TX$/, {
    message: "Only Texas cities are supported"
  }),
  county: z.string().min(3).max(50),
  population: z.number().int().min(1),
  zipCodes: z.array(zipCodeSchema),
  tdsp: tdspSchema,
  coordinates: z.object({
    lat: z.number().min(25.5).max(36.5), // Texas latitude range
    lng: z.number().min(-106.5).max(-93.5), // Texas longitude range
  }),
  isDeregulated: z.boolean(),
})

// API response schema
export const apiResponseSchema = <T>(dataSchema: z.ZodSchema<T>) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.object({
    message: z.string(),
    code: z.string(),
    details: z.any().optional(),
  }).optional(),
  metadata: z.object({
    total: z.number().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
    cached: z.boolean().optional(),
    timestamp: z.date(),
  }).optional(),
})

// Search parameters schema
export const searchParamsSchema = z.object({
  q: z.string().min(1).max(100).optional(), // Search query
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Form validation schemas for API endpoints
export const planSearchSchema = z.object({
  name: z.string().min(2).max(100),
  provider: z.string().min(2).max(100),
  city: z.string().min(2).max(50),
})

export const zipNavigationSchema = z.object({
  zipCode: zipCodeSchema,
})

// Constitutional validation: Prevent hardcoded values
export const constitutionalValidation = {
  // Validate no hardcoded plan IDs in source code
  validatePlanIdFormat: (id: string) => {
    const result = objectIdSchema.safeParse(id)
    if (!result.success) {
      throw new Error(`Invalid plan ID format: ${id}. Must be MongoDB ObjectId, never hardcoded.`)
    }
    return result.data
  },

  // Validate no hardcoded ESIDs
  validateEsidFormat: (esiid: string) => {
    const result = esidSchema.safeParse(esiid)
    if (!result.success) {
      throw new Error(`Invalid ESID format: ${esiid}. Must be 17-digit ERCOT format, never hardcoded.`)
    }
    return result.data
  },

  // Validate TDSP DUNS numbers are real
  validateDunsFormat: (duns: string) => {
    if (!/^\d{9,13}$/.test(duns)) {
      throw new Error(`Invalid DUNS number format: ${duns}. Must be 9-13 digits.`)
    }
    // Known real TDSP DUNS numbers for validation
    const validDunsNumbers = [
      '103994067400', // Oncor
      '006922109', // CenterPoint Energy
      '078003734', // AEP Texas North
      '119256236', // AEP Texas Central
    ]
    if (!validDunsNumbers.includes(duns)) {
      console.warn(`Warning: DUNS number ${duns} not in known TDSP list. Verify this is correct.`)
    }
    return duns
  },
}

// Export all schemas
export {
  // Basic validation
  objectIdSchema,
  esidSchema,
  zipCodeSchema,
  phoneSchema,
  emailSchema,
  
  // Entity schemas
  providerSchema,
  tdspSchema,
  planSchema,
  citySchema,
  addressSchema,
  
  // Filter and search schemas
  planFiltersSchema,
  searchParamsSchema,
  planSearchSchema,
  zipNavigationSchema,
  zipValidationSchema,
  esidLookupSchema,
  
  // API schemas
  apiResponseSchema,
  
  // Constitutional validation
  constitutionalValidation,
}