/**
 * TypeScript types for comprehensive Texas ZIP code navigation system
 * Feature: 010-expand-zip-code
 * Constitutional compliance: Real data types, no hardcoded values
 */

export type MarketZone = 'North' | 'Central' | 'Coast' | 'South' | 'West';
export type RegulatorStatus = 'DEREGULATED' | 'MUNICIPAL' | 'COOPERATIVE';
export type DataSource = 'USPS' | 'TDU' | 'MANUAL' | 'PUCT';
export type MarketStatus = 'ACTIVE' | 'LIMITED' | 'TRANSITIONING' | 'INACTIVE';

/**
 * Core entity: Replaces overly broad ZIP ranges with precise city mappings
 */
export interface ZIPCodeMapping {
  zipCode: string;              // 5-digit ZIP code (e.g., "75701")
  zipPlus4Pattern?: string;     // Optional ZIP+4 pattern for disambiguation (e.g., "75701-*")
  cityName: string;             // Full city name (e.g., "Tyler")  
  citySlug: string;             // URL-safe city identifier (e.g., "tyler-tx")
  countyName: string;           // Texas county (e.g., "Smith County")
  tdspTerritory: string;        // TDU service provider (e.g., "Oncor Electric Delivery")
  tdspDuns: string;             // TDU DUNS number for ComparePower API calls (e.g., "103994067400")
  isDeregulated: boolean;       // true for competitive markets, false for municipal utilities
  marketZone: MarketZone;       // Geographic market zone
  priority: number;             // City priority (1.0 = major metro, 0.3 = rural)
  lastValidated: Date;          // Last verification of ZIP/city/TDU accuracy
  dataSource: DataSource;       // Source of mapping data
}

/**
 * Defines competitive electricity markets served by the platform
 */
export interface DeregulatedMarketArea {
  areaId: string;               // Unique identifier (e.g., "east-texas-tyler")
  areaName: string;             // Display name (e.g., "Tyler Metropolitan Area")  
  primaryCity: string;          // Main city name (e.g., "Tyler")
  primaryCitySlug: string;      // URL slug for primary city (e.g., "tyler-tx")
  coverageZipCodes: string[];   // All ZIP codes in this market area
  tdspProviders: string[];      // TDU DUNS numbers serving this area
  marketZone: MarketZone;       // Geographic zone classification
  regulatoryStatus: RegulatorStatus; // Market type
  planAvailability: boolean;    // Whether competitive plans are available
  priorityLevel: 1 | 2 | 3;     // 1 = major metro, 2 = regional city, 3 = rural
  lastUpdated: Date;            // Last data refresh timestamp
}

/**
 * Error codes for ZIP validation failures
 */
export type ZIPErrorCode = 
  | 'INVALID_FORMAT'           // ZIP code format invalid
  | 'NOT_TEXAS'               // ZIP code outside Texas  
  | 'NOT_FOUND'               // ZIP code not in database
  | 'NOT_DEREGULATED'         // Regulated market area
  | 'MUNICIPAL_UTILITY'       // Municipal utility service
  | 'COOPERATIVE'             // Electric cooperative area
  | 'NO_PLANS'               // No electricity plans available
  | 'API_ERROR';             // System/database error

/**
 * Standardized ZIP code validation responses for consistent API behavior
 */
export interface ZIPValidationResult {
  zipCode: string;              // Original ZIP code from request
  isValid: boolean;             // Whether ZIP code is valid format
  isTexas: boolean;             // Whether ZIP code is in Texas
  isDeregulated: boolean;       // Whether competitive electricity market
  cityData?: {                  // City information (if found)
    name: string;               // City name (e.g., "Tyler")
    slug: string;               // URL slug (e.g., "tyler-tx")
    county: string;             // County name
    redirectUrl: string;        // Target navigation URL
  };
  tdspData?: {                  // TDU information (if applicable)
    name: string;               // TDU company name
    duns: string;               // DUNS identifier  
    territory: string;          // Service territory code
  };
  errorCode?: ZIPErrorCode;     // Error classification (if invalid)
  errorMessage?: string;        // User-friendly error description
  suggestions?: string[];       // Helpful user guidance
  validationTime: number;       // Processing time in milliseconds
  processedAt: Date;           // Validation timestamp
}

/**
 * Supporting entity: Tracks areas lacking ZIP code coverage for continuous improvement
 */
export interface ZIPCoverageGap {
  zipCode: string;              // Unmapped ZIP code
  requestCount: number;         // User request frequency
  firstRequested: Date;         // Initial gap identification
  lastRequested: Date;          // Most recent user request
  investigationStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'NOT_APPLICABLE';
  resolution?: string;          // Action taken (if resolved)
  priority: 'HIGH' | 'MEDIUM' | 'LOW'; // Based on request frequency
}

/**
 * Extended TDU territory information for precise service area determination
 */
export interface TDUServiceTerritory {
  duns: string;                 // TDU DUNS identifier
  name: string;                 // Company name
  abbreviation: string;         // Short code (e.g., "ONCOR")
  serviceZipCodes: string[];    // All ZIP codes served
  marketZones: MarketZone[];    // Geographic zones covered
  isDeregulated: boolean;       // Whether territory allows competition
  contactInfo: {                // Customer service information
    phone: string;
    website: string;
    serviceAreas: string[];
  };
  lastUpdated: Date;            // Territory data refresh
}

/**
 * API request/response types for ZIP validation endpoints
 */
export interface ZIPValidationRequest {
  zipCode: string;
  zipPlus4?: string;
}

export interface ZIPLookupRequest {
  zipCode: string;
}

export interface DeregulatedAreasResponse {
  totalCities: number;
  totalZipCodes: number;
  lastUpdated: string;
  cities: Array<{
    name: string;
    slug: string;
    region: string;
    zipCodeCount: number;
    planCount: number;
    tdspTerritory: string;
    marketStatus: MarketStatus;
  }>;
}

/**
 * Service configuration types
 */
export interface ZIPNavigationConfig {
  enableCaching: boolean;
  cacheTTL: number;              // Cache time-to-live in milliseconds
  maxConcurrentValidations: number;
  performanceThreshold: number;   // Max response time in ms (500ms target)
  fallbackToJSON: boolean;       // Enable JSON fallback if database unavailable
  analyticsEnabled: boolean;     // Track ZIP lookup analytics
}

/**
 * Analytics event types for ZIP navigation tracking
 */
export interface ZIPNavigationEvent {
  eventType: 'zip_lookup_success' | 'zip_lookup_failed' | 'zip_routing_redirect' | 'zip_coverage_gap';
  zipCode: string;
  cityResolved?: string;
  errorCode?: ZIPErrorCode;
  responseTime: number;
  userAgent?: string;
  referrer?: string;
  timestamp: Date;
}

/**
 * ZIP Routing Service Types (Phase 3.4 Enhancement)
 */
export interface ZIPRoutingResult {
  success: boolean;
  data?: {
    zipCode: string;
    redirectUrl: string;
    cityName: string;
    citySlug: string;
    planCount: number;
    tdspTerritory: string;
    marketStatus: 'active' | 'limited' | 'transitioning';
    source: 'cache' | 'fresh';
  };
  error?: {
    code: string;
    message: string;
    suggestions?: string[];
    recoveryActions?: string[];
    helpfulTips?: string[];
  };
  responseTime: number;
  cached: boolean;
}

export interface CachedZIPRouting {
  zipCode: string;
  redirectUrl: string;
  cityName: string;
  citySlug: string;
  planCount: number;
  tdspTerritory: string;
  marketStatus: 'active' | 'limited' | 'transitioning';
  cachedAt: string;
  expiresAt: string;
}

export interface ZIPPerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  totalRequests: number;
  averageResponseTime: number;
  fastRoutes: Set<string>;
}

/**
 * Database query result types
 */
export interface ZIPMappingQueryResult {
  zipCode: string;
  citySlug: string;
  cityName: string;
  isDeregulated: boolean;
  tdspDuns: string;
  tdspName: string;
  marketZone: MarketZone;
  priority: number;
}

/**
 * Cache key types for Redis caching
 */
export type ZIPCacheKey = `zip:${string}` | `city:${string}` | `tdsp:${string}`;

/**
 * Constitutional compliance validation
 */
export interface ConstitutionalValidation {
  hasHardcodedValues: boolean;
  usesRealData: boolean;
  followsTDDPrinciples: boolean;
  maintainsTXMarketIntegrity: boolean;
  validatedAt: Date;
}

/**
 * ComparePower API integration types for real plan data validation
 */
export interface ZIPNavigationWithPlanValidation {
  zipCode: string;
  citySlug: string;
  tdspDuns: string;
  pricingApiCall: {
    endpoint: string;
    queryParams: {
      group: 'default';
      tdsp_duns: string;
      display_usage: number;
    };
  };
  planValidation: {
    availablePlans: number;
    lastChecked: Date;
    apiResponseTime: number;
  };
}

/**
 * TDSP DUNS number mapping for ComparePower API calls
 * Format: https://pricing.api.comparepower.com/api/plans/current
 */
export const TDSP_DUNS_MAPPING = {
  'oncor': '103994067400',          // Oncor Electric Delivery (Dallas, Tyler, East Texas)
  'centerpoint': '957877905',       // CenterPoint Energy (Houston, Coast)
  'aep-north': '007923311',         // AEP Texas North (Abilene, West Texas)  
  'aep-central': '007923443',       // AEP Texas Central (Corpus Christi, Victoria, South Texas)
  'aep-south': '007923443',         // AEP Texas South (Laredo, McAllen, Border)
  'tnmp': '007929441'               // Texas-New Mexico Power (West/Border areas)
} as const;

export type TDSPProvider = keyof typeof TDSP_DUNS_MAPPING;

/**
 * ComparePower API response types
 */
export interface ComparePowerPlanResponse {
  plans: Array<{
    id: string;
    name: string;
    provider: string;
    rate: number;
    term: number;
    isGreen: boolean;
  }>;
  totalCount: number;
  responseTime: number;
}

// Export all types for easy importing
export type {
  MarketZone,
  RegulatorStatus,
  DataSource,
  MarketStatus,
  ZIPErrorCode,
  ZIPCacheKey,
  TDSPProvider
};