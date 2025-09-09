/**
 * TypeScript types for External API Integrations
 * Defines request/response interfaces for all external data sources
 */

import { ServiceType, SourceType, SyncStatus } from './zip-coverage.ts';

// =============================================================================
// COMMON API TYPES
// =============================================================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
  source: string;
  processingTime?: number;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
  timestamp: Date;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // seconds
}

export interface APIHealthCheck {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastCheck: Date;
  error?: string;
}

// =============================================================================
// ERCOT (ELECTRIC RELIABILITY COUNCIL OF TEXAS) API TYPES
// =============================================================================

export interface ERCOTTerritoryRequest {
  zipCodes: string[];
  includeLoadZones?: boolean;
  includeWeatherZones?: boolean;
}

export interface ERCOTTerritoryResponse extends APIResponse<ERCOTTerritoryData[]> {
  rateLimitInfo?: RateLimitInfo;
}

export interface ERCOTTerritoryData {
  zipCode: string;
  tdspDuns: string;
  tdspName: string;
  serviceArea: string;
  loadZone?: string;
  weatherZone?: string;
  effectiveDate: Date;
  source: 'ercot_mis';
  confidence: number;
}

export interface ERCOTMarketData {
  date: Date;
  loadZone: string;
  avgPrice: number;
  peakLoad: number;
  renewableGeneration: number;
}

// =============================================================================
// PUCT (PUBLIC UTILITY COMMISSION OF TEXAS) API TYPES
// =============================================================================

export interface PUCTDeregulatedAreaRequest {
  cities?: string[];
  counties?: string[];
  zipCodes?: string[];
  includeProviders?: boolean;
}

export interface PUCTDeregulatedAreaResponse extends APIResponse<PUCTDeregulatedArea[]> {
  rateLimitInfo?: RateLimitInfo;
}

export interface PUCTDeregulatedArea {
  cityName: string;
  county: string;
  zipCodes: string[];
  tdsp: string;
  tdspDuns: string;
  isDeregulated: boolean;
  certifiedProviders: PUCTProvider[];
  lastUpdate: Date;
  source: 'puct_rep_directory';
}

export interface PUCTProvider {
  name: string;
  puctNumber: string;
  certificationStatus: 'active' | 'suspended' | 'revoked';
  serviceAreas: string[];
  contactInfo: {
    phone?: string;
    website?: string;
  };
}

// =============================================================================
// USPS ADDRESS/ZIP VALIDATION API TYPES
// =============================================================================

export interface USPSAddressValidationRequest {
  zipCodes: string[];
  includeCounty?: boolean;
  includeCongressionalDistrict?: boolean;
}

export interface USPSAddressValidationResponse extends APIResponse<USPSZipCodeData[]> {
  rateLimitInfo?: RateLimitInfo;
}

export interface USPSZipCodeData {
  zipCode: string;
  city: string;
  state: string;
  county: string;
  congressionalDistrict?: string;
  timeZone: string;
  dstObserved: boolean;
  latitude: number;
  longitude: number;
  deliveryPoints: number;
  zipType: 'standard' | 'po_box' | 'unique' | 'military';
  recordType: 'street' | 'po_box' | 'rural_route' | 'highway_contract';
  isActive: boolean;
  lastUpdated: Date;
  source: 'usps_api';
}

// =============================================================================
// TDSP-SPECIFIC API TYPES
// =============================================================================

// Common TDSP Request/Response Base Types
export interface TDSPTerritoryRequest {
  zipCodes?: string[];
  addresses?: string[];
  includeServiceClasses?: boolean;
  includeRateSchedules?: boolean;
}

export interface TDSPTerritoryResponse<T> extends APIResponse<T[]> {
  rateLimitInfo?: RateLimitInfo;
  tdspDuns: string;
  tdspName: string;
}

export interface BaseTDSPTerritoryData {
  zipCode: string;
  isInTerritory: boolean;
  city?: string;
  county?: string;
  serviceAddress?: string;
  serviceClass?: string[];
  rateSchedules?: string[];
  meterType?: 'standard' | 'smart' | 'advanced';
  responseTime: number;
  source: string;
  confidence: number;
  lastUpdated: Date;
}

// Oncor Electric Delivery Specific Types
export interface OncorTerritoryRequest extends TDSPTerritoryRequest {
  includeSubstations?: boolean;
  includeCircuits?: boolean;
}

export interface OncorTerritoryData extends BaseTDSPTerritoryData {
  substation?: string;
  circuit?: string;
  voltageClass?: string;
  loadZone: string;
  weatherZone: string;
  source: 'oncor_api';
}

export interface OncorTerritoryResponse extends TDSPTerritoryResponse<OncorTerritoryData> {
  additionalInfo?: {
    serviceTerritoryMap?: string;
    outageInfo?: string;
  };
}

// CenterPoint Energy Specific Types
export interface CenterPointTerritoryRequest extends TDSPTerritoryRequest {
  includeServiceAreas?: boolean;
}

export interface CenterPointTerritoryData extends BaseTDSPTerritoryData {
  serviceAreaCode?: string;
  transmissionZone?: string;
  coastalWeatherZone?: boolean;
  source: 'centerpoint_api';
}

export interface CenterPointTerritoryResponse extends TDSPTerritoryResponse<CenterPointTerritoryData> {}

// AEP Texas (North/Central) Specific Types
export interface AEPTerritoryRequest extends TDSPTerritoryRequest {
  region: 'north' | 'central';
  includeTransmissionInfo?: boolean;
}

export interface AEPTerritoryData extends BaseTDSPTerritoryData {
  region: 'north' | 'central';
  transmissionSubstation?: string;
  distributionFeeder?: string;
  ruralArea?: boolean;
  source: 'aep_north_api' | 'aep_central_api';
}

export interface AEPTerritoryResponse extends TDSPTerritoryResponse<AEPTerritoryData> {}

// TNMP (Texas-New Mexico Power) Specific Types  
export interface TNMPTerritoryRequest extends TDSPTerritoryRequest {
  includeRuralCoops?: boolean;
}

export interface TNMPTerritoryData extends BaseTDSPTerritoryData {
  isPNMTerritory?: boolean; // Parent company territory
  ruralCoopInfo?: {
    coopName: string;
    contactInfo: string;
  };
  source: 'tnmp_api';
}

export interface TNMPTerritoryResponse extends TDSPTerritoryResponse<TNMPTerritoryData> {}

// =============================================================================
// UNIFIED EXTERNAL API CLIENT TYPES
// =============================================================================

export interface ExternalAPIClient {
  name: string;
  type: SourceType;
  isHealthy: boolean;
  lastHealthCheck: Date;
  
  // Core methods
  validateZipCodes(zipCodes: string[]): Promise<ZipValidationResult[]>;
  getHealthStatus(): Promise<APIHealthCheck>;
  getRateLimitInfo(): Promise<RateLimitInfo>;
}

export interface ZipValidationResult {
  zipCode: string;
  isValid: boolean;
  cityName?: string;
  state?: string;
  county?: string;
  tdspDuns?: string;
  tdspName?: string;
  serviceType?: ServiceType;
  confidence: number;
  source: string;
  processingTime: number;
  error?: string;
}

// =============================================================================
// BATCH PROCESSING AND ORCHESTRATION TYPES
// =============================================================================

export interface BatchValidationRequest {
  zipCodes: string[];
  sources: string[]; // Which APIs to query
  strategy: 'parallel' | 'sequential' | 'fastest_first';
  maxConcurrency?: number;
  timeout?: number;
  fallbackToSingle?: boolean;
}

export interface BatchValidationResponse {
  success: boolean;
  results: BatchValidationResult[];
  summary: {
    totalRequested: number;
    successful: number;
    failed: number;
    conflicts: number;
    processingTime: number;
    sourcesUsed: string[];
  };
}

export interface BatchValidationResult {
  zipCode: string;
  results: ZipValidationResult[]; // Results from each source
  finalResult?: ZipValidationResult; // Resolved/merged result
  hasConflict: boolean;
  conflictDetails?: {
    conflictingFields: string[];
    resolutionMethod: string;
  };
}

export interface APIOrchestrationConfig {
  sources: {
    [sourceName: string]: {
      priority: number;
      weight: number; // For conflict resolution
      timeout: number;
      retries: number;
      enabled: boolean;
    };
  };
  conflictResolution: {
    strategy: 'highest_confidence' | 'highest_priority' | 'majority_vote' | 'newest_data';
    minimumConfidence: number;
    requireMultipleSources: boolean;
  };
  caching: {
    enabled: boolean;
    ttl: number;
    keyPrefix: string;
  };
}

// =============================================================================
// ERROR AND MONITORING TYPES
// =============================================================================

export interface ExternalAPIError extends APIError {
  source: string;
  requestId?: string;
  rateLimited: boolean;
  networkError: boolean;
  authenticationError: boolean;
  quotaExceeded: boolean;
}

export interface APIMetrics {
  source: string;
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  rateLimitHits: number;
  lastRequest: Date;
  uptime: number; // percentage
  errors: ExternalAPIError[];
}

export interface ExternalDataSyncJob {
  id: string;
  sources: string[];
  status: SyncStatus;
  startTime: Date;
  endTime?: Date;
  progress: {
    totalZipCodes: number;
    processedZipCodes: number;
    successfulValidations: number;
    failedValidations: number;
    conflictResolutions: number;
  };
  errors: ExternalAPIError[];
  summary?: {
    newMappings: number;
    updatedMappings: number;
    deletedMappings: number;
    dataQualityScore: number;
  };
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

export interface ExternalAPIConfiguration {
  client: {
    userAgent: string;
    timeout: number;
    retries: number;
    retryDelay: number;
    maxConcurrent: number;
  };
  rateLimiting: {
    enabled: boolean;
    globalLimit?: number;
    perSourceLimits: Record<string, number>;
    backoffStrategy: 'linear' | 'exponential';
  };
  monitoring: {
    enableMetrics: boolean;
    enableDetailedLogging: boolean;
    healthCheckInterval: number;
    alertThresholds: {
      errorRate: number;
      responseTime: number;
      availability: number;
    };
  };
  fallbacks: {
    enableFallbackSources: boolean;
    fallbackOrder: string[];
    fallbackTimeout: number;
  };
}

// =============================================================================
// MOCK/TESTING TYPES
// =============================================================================

export interface MockAPIConfiguration {
  enabled: boolean;
  latency: {
    min: number;
    max: number;
  };
  errorRate: number; // percentage
  rateLimitSimulation: boolean;
  dataSet: 'minimal' | 'comprehensive' | 'edge_cases';
}

export interface MockDataSeed {
  zipCodes: string[];
  expectedResults: Record<string, ZipValidationResult>;
  errorScenarios: Record<string, ExternalAPIError>;
}

// Export all API client factory types
export interface APIClientFactory {
  createERCOTClient(config: any): ExternalAPIClient;
  createPUCTClient(config: any): ExternalAPIClient;
  createUSPSClient(config: any): ExternalAPIClient;
  createOncorClient(config: any): ExternalAPIClient;
  createCenterPointClient(config: any): ExternalAPIClient;
  createAEPClient(config: any, region: 'north' | 'central'): ExternalAPIClient;
  createTNMPClient(config: any): ExternalAPIClient;
}