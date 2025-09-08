/**
 * TypeScript Interfaces for ZIP Navigation System
 * Task T012 from tasks.md
 * Constitutional compliance: Dynamic data only, no hardcoded IDs
 */

// Core ZIP validation and navigation types
export interface ZIPNavigationRequest {
  zipCode: string;
  validatePlansAvailable?: boolean;
  usageKwh?: number;
}

export interface ZIPNavigationResponse {
  success: boolean;
  
  // Navigation data (on success)
  redirectUrl?: string;
  cityName?: string;
  citySlug?: string;
  stateName?: string;
  stateSlug?: string;
  
  // Service territory data
  tdspTerritory?: string;
  serviceTerritory?: string;
  
  // Plan availability data
  planCount?: number;
  hasPlans?: boolean;
  
  // Performance metrics
  validationTime?: number;
  
  // Error handling (on failure)
  errorCode?: ZIPErrorCode;
  errorMessage?: string;
  suggestions?: string[];
  
  // Metadata
  processedAt?: string;
  source?: 'database' | 'fallback' | 'cache';
}

// ZIP validation specific types
export interface ZIPValidationRequest {
  zipCode: string;
  validateFormat?: boolean;
  validateTerritory?: boolean;
  validatePlansAvailable?: boolean;
}

export interface ZIPValidationResponse {
  isValid: boolean;
  zipCode: string;
  
  // Geographic data
  city?: string;
  state?: string;
  county?: string;
  
  // Service territory
  tdspTerritory?: string;
  isDeregulated?: boolean;
  
  // Plan availability
  planCount?: number;
  hasActivePlans?: boolean;
  
  // Error details
  errorCode?: ZIPErrorCode;
  errorMessage?: string;
  
  // Performance
  validationTime?: number;
}

// City and plans validation types
export interface CityPlansValidationRequest {
  citySlug: string;
  stateSlug?: string;
  minPlans?: number;
}

export interface CityPlansValidationResponse {
  isValid: boolean;
  citySlug: string;
  
  // City data
  cityName?: string;
  stateAbbr?: string;
  
  // Plan data
  planCount: number;
  hasPlans: boolean;
  
  // TDSP data
  tdspTerritories?: string[];
  primaryTdsp?: string;
  
  // Performance
  validationTime?: number;
  
  // Error handling
  errorMessage?: string;
}

// Error handling enums and types
export enum ZIPErrorCode {
  // Format errors
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_LENGTH = 'INVALID_LENGTH',
  INVALID_CHARACTERS = 'INVALID_CHARACTERS',
  
  // Geographic errors
  NOT_FOUND = 'NOT_FOUND',
  NOT_TEXAS = 'NOT_TEXAS',
  NOT_US = 'NOT_US',
  
  // Service territory errors
  NOT_DEREGULATED = 'NOT_DEREGULATED',
  REGULATED_MARKET = 'REGULATED_MARKET',
  UNKNOWN_TERRITORY = 'UNKNOWN_TERRITORY',
  
  // Data availability errors
  NO_PLANS = 'NO_PLANS',
  INSUFFICIENT_PLANS = 'INSUFFICIENT_PLANS',
  DATA_UNAVAILABLE = 'DATA_UNAVAILABLE',
  
  // System errors
  API_ERROR = 'API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMITED = 'RATE_LIMITED'
}

export interface ZIPErrorDetails {
  code: ZIPErrorCode;
  message: string;
  suggestions: string[];
  userFriendlyMessage?: string;
  technicalDetails?: Record<string, unknown>;
}

// Texas-specific territory mapping types
export interface TDSPTerritory {
  name: string;
  code: string;
  serviceAreas: string[];
  zipCodePrefixes: string[];
  isDeregulated: boolean;
}

export interface TexasCityData {
  name: string;
  slug: string;
  county: string;
  zipCodes: string[];
  primaryTdsp: string;
  secondaryTdsps?: string[];
  isDeregulated: boolean;
  planCount: number;
  population?: number;
}

// Performance and analytics types
export interface ZIPNavigationMetrics {
  totalRequests: number;
  successfulNavigations: number;
  errorsByType: Record<ZIPErrorCode, number>;
  averageValidationTime: number;
  averageNavigationTime: number;
  popularZipCodes: Array<{ zipCode: string; count: number }>;
  conversionRate: number;
}

export interface ZIPValidationPerformance {
  validationStartTime: number;
  validationEndTime: number;
  validationDuration: number;
  cacheHit: boolean;
  dataSource: 'database' | 'api' | 'cache' | 'fallback';
  steps: Array<{
    step: string;
    duration: number;
    success: boolean;
  }>;
}

// Form and UI interaction types
export interface ZIPFormState {
  zipCode: string;
  isValid: boolean;
  isValidating: boolean;
  error: ZIPErrorDetails | null;
  suggestions: string[];
}

export interface ZIPFormActions {
  updateZipCode: (zipCode: string) => void;
  validateZipCode: () => Promise<void>;
  submitZipCode: () => Promise<void>;
  clearError: () => void;
  resetForm: () => void;
}

// API client types for service integration
export interface ZIPServiceConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  rateLimit: {
    requests: number;
    window: number;
  };
}

// Database entity types (for service layer)
export interface ZIPCodeEntity {
  id: string;
  zipCode: string;
  cityName: string;
  citySlug: string;
  stateAbbr: string;
  stateSlug: string;
  county: string;
  tdspTerritory: string;
  isDeregulated: boolean;
  planCount: number;
  lastUpdated: Date;
  isActive: boolean;
}

// Constitutional compliance types
export interface ConstitutionalValidation {
  hasRealData: boolean;
  usesGeneratedIds: boolean;
  noHardcodedValues: boolean;
  followsDataPattern: boolean;
  validationPassed: boolean;
  issues: string[];
}

// Export all types for easy importing
export type {
  ZIPNavigationRequest,
  ZIPNavigationResponse,
  ZIPValidationRequest,
  ZIPValidationResponse,
  CityPlansValidationRequest,
  CityPlansValidationResponse,
  ZIPErrorDetails,
  TDSPTerritory,
  TexasCityData,
  ZIPNavigationMetrics,
  ZIPValidationPerformance,
  ZIPFormState,
  ZIPFormActions,
  ZIPServiceConfig,
  ZIPCodeEntity,
  ConstitutionalValidation,
};

export { ZIPErrorCode };