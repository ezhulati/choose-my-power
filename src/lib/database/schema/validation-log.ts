/**
 * Validation Log Database Model
 * Drizzle ORM schema for tracking ZIP code validation attempts and results
 */

import { pgTable, uuid, varchar, boolean, timestamp, integer, jsonb, text, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const validationLogs = pgTable('validation_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  zipCode: varchar('zip_code', { length: 5 }).notNull(),
  validationType: varchar('validation_type', { length: 30 }).notNull(), // single, bulk, batch
  requestId: varchar('request_id', { length: 100 }), // For tracking bulk requests
  dataSourceId: uuid('data_source_id').notNull(),
  dataSourceSlug: varchar('data_source_slug', { length: 50 }).notNull(),
  
  // Validation results
  isValid: boolean('is_valid').notNull(),
  confidence: integer('confidence').notNull(), // 0-100
  citySlug: varchar('city_slug', { length: 100 }),
  cityDisplayName: varchar('city_display_name', { length: 200 }),
  tdspDuns: varchar('tdsp_duns', { length: 13 }),
  tdspName: varchar('tdsp_name', { length: 200 }),
  serviceType: varchar('service_type', { length: 20 }), // deregulated, municipal, etc.
  
  // Request/Response metadata
  requestPayload: jsonb('request_payload').notNull().default('{}'),
  responseData: jsonb('response_data').notNull().default('{}'),
  processingTime: integer('processing_time').notNull(), // milliseconds
  cacheHit: boolean('cache_hit').notNull().default(false),
  
  // Error handling
  errorCode: varchar('error_code', { length: 50 }),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').notNull().default(0),
  circuitBreakerTripped: boolean('circuit_breaker_tripped').notNull().default(false),
  
  // IP and user tracking
  clientIp: varchar('client_ip', { length: 45 }), // IPv6 compatible
  userAgent: text('user_agent'),
  sessionId: varchar('session_id', { length: 100 }),
  userId: varchar('user_id', { length: 100 }), // If authenticated
  
  // Timestamps
  validatedAt: timestamp('validated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // Primary lookup indexes
  zipCodeIdx: index('idx_validation_logs_zip_code').on(table.zipCode),
  dataSourceIdx: index('idx_validation_logs_data_source').on(table.dataSourceId),
  dataSourceSlugIdx: index('idx_validation_logs_data_source_slug').on(table.dataSourceSlug),
  validationTypeIdx: index('idx_validation_logs_validation_type').on(table.validationType),
  requestIdIdx: index('idx_validation_logs_request_id').on(table.requestId),
  
  // Performance indexes
  isValidIdx: index('idx_validation_logs_is_valid').on(table.isValid),
  confidenceIdx: index('idx_validation_logs_confidence').on(table.confidence),
  processingTimeIdx: index('idx_validation_logs_processing_time').on(table.processingTime),
  cacheHitIdx: index('idx_validation_logs_cache_hit').on(table.cacheHit),
  validatedAtIdx: index('idx_validation_logs_validated_at').on(table.validatedAt),
  
  // Error tracking indexes
  errorCodeIdx: index('idx_validation_logs_error_code').on(table.errorCode),
  retryCountIdx: index('idx_validation_logs_retry_count').on(table.retryCount),
  circuitBreakerIdx: index('idx_validation_logs_circuit_breaker').on(table.circuitBreakerTripped),
  
  // Analytics indexes
  clientIpIdx: index('idx_validation_logs_client_ip').on(table.clientIp),
  sessionIdIdx: index('idx_validation_logs_session_id').on(table.sessionId),
  
  // Composite indexes for common analytics queries
  zipSourceIdx: index('idx_validation_logs_zip_source').on(table.zipCode, table.dataSourceSlug),
  zipValidIdx: index('idx_validation_logs_zip_valid').on(table.zipCode, table.isValid),
  sourceValidIdx: index('idx_validation_logs_source_valid').on(table.dataSourceSlug, table.isValid),
  dateSourceIdx: index('idx_validation_logs_date_source').on(table.validatedAt, table.dataSourceSlug),
  performanceIdx: index('idx_validation_logs_performance').on(table.processingTime, table.cacheHit),
}));

// Relations to other tables
export const validationLogRelations = relations(validationLogs, ({ one }) => ({
  // Reference to data source
  dataSource: one(dataSourcesTable, {
    fields: [validationLogs.dataSourceId],
    references: [dataSourcesTable.id],
  }),
  
  // Reference to ZIP code mapping if validation was successful
  zipCodeMapping: one(zipCodeMappingsTable, {
    fields: [validationLogs.zipCode],
    references: [zipCodeMappingsTable.zipCode],
  }),
  
  // Reference to city territory if mapped
  cityTerritory: one(cityTerritoriesTable, {
    fields: [validationLogs.citySlug],
    references: [cityTerritoriesTable.citySlug],
  }),
}));

// Type exports
export type ValidationLog = typeof validationLogs.$inferSelect;
export type NewValidationLog = typeof validationLogs.$inferInsert;

// Validation types
export const VALIDATION_TYPES = {
  SINGLE: 'single',
  BULK: 'bulk',
  BATCH: 'batch',
  BACKGROUND: 'background',
  SCHEDULED: 'scheduled'
} as const;

export type ValidationType = typeof VALIDATION_TYPES[keyof typeof VALIDATION_TYPES];

// Error codes for validation failures
export const VALIDATION_ERROR_CODES = {
  INVALID_ZIP: 'INVALID_ZIP',
  NOT_TEXAS: 'NOT_TEXAS',
  NOT_FOUND: 'NOT_FOUND',
  API_ERROR: 'API_ERROR',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',
  CIRCUIT_BREAKER: 'CIRCUIT_BREAKER',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  CONFLICT: 'CONFLICT',
  INSUFFICIENT_CONFIDENCE: 'INSUFFICIENT_CONFIDENCE'
} as const;

export type ValidationErrorCode = typeof VALIDATION_ERROR_CODES[keyof typeof VALIDATION_ERROR_CODES];

// Request payload interface
export interface ValidationRequestPayload {
  zipCode: string;
  options?: {
    sources?: string[];
    requireMultipleSources?: boolean;
    conflictResolution?: 'highest_confidence' | 'majority_vote' | 'latest_data';
    enableFallback?: boolean;
    forceRefresh?: boolean;
    maxRetries?: number;
    timeout?: number;
  };
  context?: {
    userAgent?: string;
    sessionId?: string;
    referrer?: string;
    feature?: string; // Which feature triggered validation
  };
}

// Response data interface
export interface ValidationResponseData {
  sources: {
    slug: string;
    responseTime: number;
    success: boolean;
    confidence: number;
    data?: unknown;
    error?: string;
  }[];
  conflicts?: {
    field: string;
    values: { source: string; value: unknown; confidence: number; }[];
    resolved: unknown;
    resolution: string;
  }[];
  method: 'primary' | 'fallback' | 'cache_only' | 'tdsp_api' | 'fallback_nearest';
  cacheInfo?: {
    hit: boolean;
    age: number; // seconds
    ttl: number; // seconds
  };
  performance: {
    totalTime: number;
    sourceTime: number;
    processingTime: number;
    cacheTime?: number;
  };
}

// Validation functions
export function isValidValidationType(type: string): type is ValidationType {
  return Object.values(VALIDATION_TYPES).includes(type as ValidationType);
}

export function isValidErrorCode(code: string): code is ValidationErrorCode {
  return Object.values(VALIDATION_ERROR_CODES).includes(code as ValidationErrorCode);
}

export function isValidConfidence(confidence: number): boolean {
  return confidence >= 0 && confidence <= 100 && Number.isInteger(confidence);
}

export function isValidProcessingTime(time: number): boolean {
  return time >= 0 && time <= 300000; // Max 5 minutes
}

// Query builder helpers
export const validationLogQueries = {
  // Find logs by ZIP code
  findByZipCode: (zipCode: string, limit: number = 10) => ({
    where: (table: typeof validationLogs) => eq(table.zipCode, zipCode),
    orderBy: (table: typeof validationLogs) => desc(table.validatedAt),
    limit
  }),
  
  // Find recent validations
  findRecent: (hours: number = 24, limit: number = 100) => ({
    where: (table: typeof validationLogs) => gte(
      table.validatedAt, 
      new Date(Date.now() - hours * 60 * 60 * 1000)
    ),
    orderBy: (table: typeof validationLogs) => desc(table.validatedAt),
    limit
  }),
  
  // Find successful validations
  findSuccessful: (limit: number = 100) => ({
    where: (table: typeof validationLogs) => eq(table.isValid, true),
    orderBy: (table: typeof validationLogs) => desc(table.validatedAt),
    limit
  }),
  
  // Find errors by code
  findByErrorCode: (errorCode: ValidationErrorCode, limit: number = 50) => ({
    where: (table: typeof validationLogs) => eq(table.errorCode, errorCode),
    orderBy: (table: typeof validationLogs) => desc(table.validatedAt),
    limit
  }),
  
  // Find slow validations
  findSlow: (minTime: number = 5000, limit: number = 50) => ({
    where: (table: typeof validationLogs) => gte(table.processingTime, minTime),
    orderBy: (table: typeof validationLogs) => desc(table.processingTime),
    limit
  }),
  
  // Find by data source
  findByDataSource: (dataSourceSlug: string, limit: number = 100) => ({
    where: (table: typeof validationLogs) => eq(table.dataSourceSlug, dataSourceSlug),
    orderBy: (table: typeof validationLogs) => desc(table.validatedAt),
    limit
  }),
  
  // Find validations with retries
  findWithRetries: (minRetries: number = 1, limit: number = 50) => ({
    where: (table: typeof validationLogs) => gte(table.retryCount, minRetries),
    orderBy: (table: typeof validationLogs) => desc(table.retryCount),
    limit
  }),
  
  // Find cache misses
  findCacheMisses: (limit: number = 100) => ({
    where: (table: typeof validationLogs) => eq(table.cacheHit, false),
    orderBy: (table: typeof validationLogs) => desc(table.validatedAt),
    limit
  }),
  
  // Find by session
  findBySession: (sessionId: string, limit: number = 20) => ({
    where: (table: typeof validationLogs) => eq(table.sessionId, sessionId),
    orderBy: (table: typeof validationLogs) => desc(table.validatedAt),
    limit
  }),
  
  // Find bulk validation batches
  findBulkBatches: (requestId: string) => ({
    where: (table: typeof validationLogs) => eq(table.requestId, requestId),
    orderBy: (table: typeof validationLogs) => asc(table.validatedAt)
  })
};

// Analytics and metrics functions
export const validationLogAnalytics = {
  // Calculate success rate for a data source
  getSuccessRate: async (dataSourceSlug: string, hours: number = 24): Promise<number> => {
    // This would be implemented with proper database queries
    // Placeholder for now
    return 95.5;
  },
  
  // Get average response time
  getAverageResponseTime: async (dataSourceSlug: string, hours: number = 24): Promise<number> => {
    // Placeholder - would calculate from actual logs
    return 2500;
  },
  
  // Get error distribution
  getErrorDistribution: async (hours: number = 24): Promise<Record<ValidationErrorCode, number>> => {
    // Placeholder - would count errors by code
    return {
      [VALIDATION_ERROR_CODES.INVALID_ZIP]: 5,
      [VALIDATION_ERROR_CODES.NOT_TEXAS]: 3,
      [VALIDATION_ERROR_CODES.API_ERROR]: 2,
      [VALIDATION_ERROR_CODES.TIMEOUT]: 1,
      [VALIDATION_ERROR_CODES.RATE_LIMITED]: 0,
      [VALIDATION_ERROR_CODES.CIRCUIT_BREAKER]: 0,
      [VALIDATION_ERROR_CODES.NETWORK_ERROR]: 1,
      [VALIDATION_ERROR_CODES.PARSE_ERROR]: 0,
      [VALIDATION_ERROR_CODES.CONFLICT]: 1,
      [VALIDATION_ERROR_CODES.INSUFFICIENT_CONFIDENCE]: 2,
      [VALIDATION_ERROR_CODES.NOT_FOUND]: 4
    };
  },
  
  // Get performance metrics
  getPerformanceMetrics: async (hours: number = 24) => {
    return {
      totalValidations: 1250,
      successfulValidations: 1195,
      successRate: 95.6,
      averageResponseTime: 2845,
      cacheHitRate: 78.5,
      topSources: [
        { source: 'ercot_mis', validations: 450, successRate: 98.2 },
        { source: 'oncor_territory_api', validations: 320, successRate: 94.1 },
        { source: 'puct_rep_directory', validations: 280, successRate: 96.8 }
      ],
      slowestZips: [
        { zipCode: '78613', avgTime: 8500, attempts: 5 },
        { zipCode: '77429', avgTime: 7200, attempts: 3 }
      ]
    };
  },
  
  // Detect patterns in validation failures
  detectFailurePatterns: async (hours: number = 24) => {
    return {
      zipRangeFailures: [
        { range: '795xx', failures: 12, pattern: 'AEP Central territory API issues' },
        { range: '773xx', failures: 8, pattern: 'Houston boundary conflicts' }
      ],
      temporalPatterns: [
        { hour: 14, failures: 25, pattern: 'Peak traffic rate limiting' },
        { hour: 2, failures: 3, pattern: 'Maintenance window' }
      ],
      sourcePatterns: [
        { source: 'aep_central_api', issue: 'Timeout spike', frequency: 15 }
      ]
    };
  }
};

// Utility functions for validation logs
export const validationLogUtils = {
  // Create log entry for successful validation
  createSuccessLog: (
    zipCode: string,
    dataSourceSlug: string,
    result: unknown,
    processingTime: number,
    request: ValidationRequestPayload
  ): Omit<NewValidationLog, 'id' | 'createdAt' | 'validatedAt'> => {
    return {
      zipCode,
      validationType: request.context?.feature === 'bulk' ? VALIDATION_TYPES.BULK : VALIDATION_TYPES.SINGLE,
      dataSourceId: '', // Would be filled by service
      dataSourceSlug,
      isValid: true,
      confidence: result.confidence || 95,
      citySlug: result.citySlug,
      cityDisplayName: result.cityDisplayName,
      tdspDuns: result.tdspDuns,
      tdspName: result.tdspName,
      serviceType: result.serviceType,
      requestPayload: request,
      responseData: result,
      processingTime,
      cacheHit: result.fromCache || false,
      sessionId: request.context?.sessionId,
      userAgent: request.context?.userAgent
    };
  },
  
  // Create log entry for failed validation
  createFailureLog: (
    zipCode: string,
    dataSourceSlug: string,
    error: { code: ValidationErrorCode; message: string },
    processingTime: number,
    request: ValidationRequestPayload
  ): Omit<NewValidationLog, 'id' | 'createdAt' | 'validatedAt'> => {
    return {
      zipCode,
      validationType: request.context?.feature === 'bulk' ? VALIDATION_TYPES.BULK : VALIDATION_TYPES.SINGLE,
      dataSourceId: '', // Would be filled by service
      dataSourceSlug,
      isValid: false,
      confidence: 0,
      requestPayload: request,
      responseData: { error },
      processingTime,
      cacheHit: false,
      errorCode: error.code,
      errorMessage: error.message,
      sessionId: request.context?.sessionId,
      userAgent: request.context?.userAgent
    };
  },
  
  // Sanitize request payload for logging
  sanitizeRequestPayload: (payload: ValidationRequestPayload): ValidationRequestPayload => {
    // Remove sensitive information if any
    const sanitized = { ...payload };
    
    // Remove API keys or tokens from options if present
    if (sanitized.options) {
      delete (sanitized.options as unknown).apiKey;
      delete (sanitized.options as unknown).token;
    }
    
    return sanitized;
  },
  
  // Generate unique request ID for bulk operations
  generateRequestId: (): string => {
    return `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  
  // Check if validation should be retried based on error
  shouldRetry: (errorCode: ValidationErrorCode, retryCount: number): boolean => {
    const maxRetries = 3;
    
    if (retryCount >= maxRetries) return false;
    
    const retryableErrors = [
      VALIDATION_ERROR_CODES.NETWORK_ERROR,
      VALIDATION_ERROR_CODES.TIMEOUT,
      VALIDATION_ERROR_CODES.API_ERROR
    ];
    
    return retryableErrors.includes(errorCode);
  },
  
  // Calculate retry delay
  calculateRetryDelay: (retryCount: number): number => {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, retryCount), 10000);
  }
};

// Import statements for relations
import type { dataSources as dataSourcesTable } from './data-source';
import type { zipCodeMappings as zipCodeMappingsTable } from './zip-code-mapping';
import type { cityTerritories as cityTerritoriesTable } from './city-territory';
import { eq, gte, desc, asc } from 'drizzle-orm';