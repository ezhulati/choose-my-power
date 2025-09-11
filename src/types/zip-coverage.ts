/**
 * TypeScript types for ZIP Code Coverage System
 * Defines interfaces and enums for comprehensive Texas ZIP-to-city mapping
 */

// Core Enums

export enum ServiceType {
  DEREGULATED = "deregulated",     // Customer choice available
  MUNICIPAL = "municipal",         // Municipal utility (no choice)
  COOPERATIVE = "cooperative",     // Electric cooperative (limited choice)  
  REGULATED = "regulated"          // Traditional regulated utility
}

export enum SourceType {
  API = "api",                     // Real-time API integration
  FILE = "file",                   // Bulk file download
  MANUAL = "manual"                // Manually entered data
}

export enum SyncStatus {
  SUCCESS = "success",
  ERROR = "error",
  IN_PROGRESS = "in_progress",
  SCHEDULED = "scheduled"
}

export enum ValidationType {
  LOOKUP = "lookup",               // User ZIP code lookup
  SYNC = "sync",                   // Scheduled data sync
  MANUAL = "manual",               // Manual data entry
  CONFLICT_RESOLUTION = "conflict_resolution" // Resolving data conflicts
}

export enum ValidationResult {
  SUCCESS = "success",
  ERROR = "error",
  CONFLICT = "conflict",           // Multiple sources disagree
  NO_CHANGE = "no_change"          // Data unchanged after validation
}

// Core Entity Interfaces

export interface ZIPCodeMapping {
  id: string;                    // Primary key: UUID
  zipCode: string;               // 5-digit ZIP code (indexed)
  citySlug: string;              // City identifier (e.g., "dallas", "houston")
  cityDisplayName: string;       // Human-readable city name (e.g., "Dallas, TX")
  tdspDuns: string;              // TDSP identifier (e.g., "1039940674000")
  tdspName: string;              // TDSP display name (e.g., "Oncor Electric Delivery")
  serviceType: ServiceType;      // deregulated | municipal | cooperative | regulated
  isActive: boolean;             // Whether ZIP code mapping is currently valid
  lastValidated: Date;           // Last validation against external sources
  dataSource: string;            // Which external source provided this mapping
  confidence: number;            // Confidence score (0-100) based on source validation
  createdAt: Date;
  updatedAt: Date;
}

export interface CityTerritory {
  id: string;                    // Primary key: UUID
  citySlug: string;              // Unique city identifier (indexed)
  cityDisplayName: string;       // Full display name with state
  primaryTdsp: string;           // Primary TDSP DUNS for this city
  serviceType: ServiceType;      // Deregulation status
  zipCodes: string[];            // Array of ZIP codes in this territory
  planCount: number;             // Number of available electricity plans
  isActive: boolean;             // Whether city is currently served
  lastUpdated: Date;             // Last data refresh
  coordinates: {                 // City center coordinates
    latitude: number;
    longitude: number;
  };
  metadata: {
    population?: number;
    averageRate?: number;        // Average electricity rate ¢/kWh
    competitivePlans?: number;   // Number of competitive plans
  };
}

export interface TDSPInfo {
  duns: string;                  // Primary key: DUNS number
  name: string;                  // Official TDSP name
  zone: string;                  // Geographic zone (North, South, Central, Coast)
  serviceArea: string[];         // List of cities served
  apiEndpoint?: string;          // TDSP API for territory validation
  isActive: boolean;             // Currently operating status
  lastUpdated: Date;
  contactInfo: {
    website?: string;
    phone?: string;
    serviceTerritory?: string;   // URL for territory maps
  };
}

export interface DataSource {
  id: string;                    // Primary key: UUID
  name: string;                  // Data source name (e.g., "ERCOT_MIS")
  type: SourceType;              // api | file | manual
  endpoint?: string;             // API endpoint URL
  lastSync: Date;                // Last successful data sync
  nextSync: Date;                // Scheduled next sync
  isActive: boolean;             // Whether source is currently used
  priority: number;              // Source priority for conflict resolution (1-10)
  rateLimits: {
    requestsPerHour: number;
    requestsPerDay: number;
  };
  syncStatus: SyncStatus;        // success | error | in_progress | scheduled
  errorDetails?: string;         // Last error message if sync failed
}

export interface ValidationLog {
  id: string;                    // Primary key: UUID
  zipCode: string;               // ZIP code being validated
  validationType: ValidationType; // lookup | sync | manual | conflict_resolution
  dataSource: string;            // Source that provided the data
  result: ValidationResult;      // success | error | conflict | no_change
  oldValue?: Partial<ZIPCodeMapping>; // Previous values (for updates)
  newValue?: Partial<ZIPCodeMapping>; // New values
  conflictSources?: string[];    // Sources that disagreed (for conflicts)
  resolvedBy?: string;           // How conflict was resolved
  timestamp: Date;
  processingTime: number;        // Milliseconds taken for validation
  userAgent?: string;            // If triggered by user request
}

// API Request/Response Types

export interface ZIPValidationRequest {
  zipCodes: string[];
  validateAccuracy?: boolean;
}

export interface ZIPValidationResponse {
  success: boolean;
  results: ZIPCoverageResult[];
  summary: {
    totalRequested: number;
    validMappings: number;
    invalidZIPs: number;
    conflicts: number;
    processingTime: number;
  };
}

export interface ZIPCoverageResult {
  zipCode: string;
  success: boolean;
  citySlug?: string;
  cityDisplayName?: string;
  tdspDuns?: string;
  tdspName?: string;
  serviceType: ServiceType;
  isActive: boolean;
  confidence: number;
  lastValidated: Date;
  planCount?: number;
  redirectUrl?: string;
  dataSource: string;
  conflicts?: Array<{
    source: string;
    conflictingValue: string;
    confidence: number;
  }>;
}

export interface EnhancedZIPResult extends ZIPCoverageResult {
  territory?: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    boundaries?: Array<{
      lat: number;
      lng: number;
    }>;
  };
  planAvailability?: {
    totalPlans: number;
    competitiveRate?: number;
    avgRate?: number;
    topProviders: string[];
  };
  validationDetails: {
    method: 'exact_match' | 'tdsp_api' | 'ercot_territory' | 'fallback_nearest';
    sources: string[];
    validatedAt: Date;
    nextValidation: Date;
  };
}

export interface CoverageStatusResponse {
  success: boolean;
  coverageStats: {
    totalZIPCodes: number;
    mappedZIPCodes: number;
    deregulatedCoverage: number;
    lastUpdated: Date;
    accuracyScore: number;
  };
  gapAnalysis: Array<{
    region: string;
    missingZIPs: number;
    priorityLevel: 'high' | 'medium' | 'low';
  }>;
  tdspBreakdown: Array<{
    tdsp: string;
    coverage: number;
    zipCount: number;
  }>;
}

export interface CoverageGapsResponse {
  success: boolean;
  gaps: Array<{
    zipCode: string;
    estimatedCity?: string;
    estimatedTDSP?: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    suggestedSources: string[];
  }>;
  totalGaps: number;
  recommendations: string[];
}

export interface SyncRequest {
  sources: Array<'ercot' | 'puct' | 'oncor' | 'centerpoint' | 'aep_north' | 'aep_central' | 'tnmp'>;
  forceRefresh?: boolean;
  dryRun?: boolean;
}

export interface SyncResponse {
  success: boolean;
  syncId: string;
  estimatedDuration: number;
  statusEndpoint: string;
}

// External API Integration Types

export interface ERCOTTerritoryData {
  zipCode: string;
  tdspDuns: string;
  tdspName: string;
  serviceArea: string;
  effectiveDate: Date;
  source: 'ercot_mis';
}

export interface PUCTDeregulatedArea {
  cityName: string;
  county: string;
  tdsp: string;
  isDeregulated: boolean;
  certifiedProviders: string[];
  lastUpdate: Date;
}

export interface TDSPTerritoryResponse {
  zipCode: string;
  isInTerritory: boolean;
  city?: string;
  serviceAddress?: string;
  responseTime: number;
  source: string;
}

// Validation and Error Types

export interface ValidationRules {
  zipCodeFormat: RegExp;
  texasZipRange: {
    min: number;
    max: number;
  };
  citySlugFormat: RegExp;
  dunsFormat: RegExp;
  confidenceRange: {
    min: number;
    max: number;
  };
}

export interface APIError {
  success: false;
  error: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  errorId?: string;
}

// Configuration Types

export interface ZIPCoverageConfig {
  database: {
    connectionString: string;
    maxConnections: number;
    queryTimeout: number;
  };
  cache: {
    redis: {
      url: string;
      ttl: {
        zipLookup: number;
        cityTerritory: number;
        tdspInfo: number;
      };
    };
  };
  externalApis: {
    ercot: {
      endpoint: string;
      apiKey: string;
      rateLimits: {
        requestsPerHour: number;
      };
    };
    puct: {
      endpoint: string;
      rateLimits: {
        requestsPerHour: number;
      };
    };
    tdsps: {
      [key: string]: {
        endpoint: string;
        rateLimits: {
          requestsPerHour: number;
        };
      };
    };
  };
  sync: {
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string; // HH:MM format
    };
    batchSize: number;
    maxRetries: number;
    backoffMultiplier: number;
  };
  performance: {
    maxConcurrentRequests: number;
    responseTimeTarget: number; // milliseconds
    accuracyTarget: number; // percentage
  };
}

// Constants

export const VALIDATION_RULES: ValidationRules = {
  zipCodeFormat: /^\d{5}$/,
  texasZipRange: {
    min: 73000,
    max: 79999
  },
  citySlugFormat: /^[a-z0-9-]+$/,
  dunsFormat: /^\d{9,13}$/,
  confidenceRange: {
    min: 0,
    max: 100
  }
};

export const MAJOR_TDSPS = {
  ONCOR: '1039940674000',
  CENTERPOINT: '957877905', 
  AEP_NORTH: '007923311',
  AEP_CENTRAL: '007924772',
  TNMP: '007929441'
};

export const DEFAULT_CACHE_TTL = {
  ZIP_LOOKUP: 24 * 60 * 60, // 24 hours
  CITY_TERRITORY: 7 * 24 * 60 * 60, // 7 days
  TDSP_INFO: 30 * 24 * 60 * 60, // 30 days
  VALIDATION_LOG: 60 * 60 // 1 hour
};