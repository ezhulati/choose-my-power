/**
 * Data Source Database Model
 * Drizzle ORM schema for external API data sources and their configurations
 */

import { pgTable, uuid, varchar, boolean, timestamp, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const dataSources = pgTable('data_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull(),
  type: varchar('type', { length: 30 }).notNull(), // api, database, file, scraper
  baseUrl: varchar('base_url', { length: 500 }),
  apiVersion: varchar('api_version', { length: 20 }),
  authentication: jsonb('authentication').notNull().default('{}'), // API keys, tokens, etc.
  configuration: jsonb('configuration').notNull().default('{}'), // Rate limits, endpoints, etc.
  isActive: boolean('is_active').notNull().default(true),
  priority: integer('priority').notNull().default(50), // 1-100, higher = higher priority
  reliability: integer('reliability').notNull().default(90), // 0-100 reliability score
  averageResponseTime: integer('average_response_time'), // milliseconds
  lastSuccess: timestamp('last_success'),
  lastFailure: timestamp('last_failure'),
  consecutiveFailures: integer('consecutive_failures').notNull().default(0),
  metadata: jsonb('metadata').notNull().default('{}'), // Additional source info
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Primary indexes
  nameIdx: index('idx_data_sources_name').on(table.name),
  slugIdx: uniqueIndex('idx_data_sources_slug').on(table.slug),
  typeIdx: index('idx_data_sources_type').on(table.type),
  isActiveIdx: index('idx_data_sources_is_active').on(table.isActive),
  priorityIdx: index('idx_data_sources_priority').on(table.priority),
  reliabilityIdx: index('idx_data_sources_reliability').on(table.reliability),
  
  // Performance indexes
  lastSuccessIdx: index('idx_data_sources_last_success').on(table.lastSuccess),
  consecutiveFailuresIdx: index('idx_data_sources_consecutive_failures').on(table.consecutiveFailures),
  
  // Composite indexes for common queries
  activeReliabilityIdx: index('idx_data_sources_active_reliability').on(table.isActive, table.reliability),
  typePriorityIdx: index('idx_data_sources_type_priority').on(table.type, table.priority),
}));

// Relations to other tables
export const dataSourceRelations = relations(dataSources, ({ many }) => ({
  // ZIP code mappings using this source
  zipCodeMappings: many(zipCodeMappingsTable),
  
  // Validation logs from this source
  validationLogs: many(validationLogsTable),
}));

// Type exports
export type DataSource = typeof dataSources.$inferSelect;
export type NewDataSource = typeof dataSources.$inferInsert;

// Data source types
export const DATA_SOURCE_TYPES = {
  API: 'api',
  DATABASE: 'database',
  FILE: 'file',
  SCRAPER: 'scraper',
  CACHE: 'cache'
} as const;

export type DataSourceType = typeof DATA_SOURCE_TYPES[keyof typeof DATA_SOURCE_TYPES];

// Authentication types
export interface APIAuthentication {
  type: 'bearer' | 'api_key' | 'oauth' | 'basic' | 'none';
  token?: string;
  apiKey?: string;
  keyHeader?: string; // Header name for API key
  username?: string;
  password?: string;
  oauthUrl?: string;
  clientId?: string;
  clientSecret?: string;
}

// Configuration interface for API sources
export interface APIConfiguration {
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit?: number;
  };
  timeouts: {
    connect: number;
    read: number;
    total: number;
  };
  retryPolicy: {
    maxRetries: number;
    baseDelay: number; // milliseconds
    maxDelay: number; // milliseconds
    backoffMultiplier: number;
  };
  endpoints: {
    [key: string]: {
      path: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      cache?: {
        enabled: boolean;
        ttl: number; // seconds
      };
    };
  };
  circuitBreaker?: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeout: number; // milliseconds
  };
}

// Known Texas electricity market data sources
export const TEXAS_DATA_SOURCES = {
  ERCOT_MIS: {
    name: 'ERCOT Market Information System',
    slug: 'ercot_mis',
    type: DATA_SOURCE_TYPES.API,
    baseUrl: 'https://www.ercot.com/api',
    description: 'Official ERCOT market data and territory mappings',
    priority: 95,
    reliability: 98
  },
  PUCT_REP_DIRECTORY: {
    name: 'PUCT Retail Electric Provider Directory',
    slug: 'puct_rep_directory',
    type: DATA_SOURCE_TYPES.API,
    baseUrl: 'http://www.puc.texas.gov/api',
    description: 'Official PUCT provider certification data',
    priority: 90,
    reliability: 95
  },
  ONCOR_TERRITORY_API: {
    name: 'Oncor Service Territory API',
    slug: 'oncor_territory_api',
    type: DATA_SOURCE_TYPES.API,
    baseUrl: 'https://www.oncor.com/api',
    description: 'Oncor TDSP territory validation',
    priority: 85,
    reliability: 92
  },
  CENTERPOINT_TERRITORY_API: {
    name: 'CenterPoint Energy Territory API',
    slug: 'centerpoint_territory_api',
    type: DATA_SOURCE_TYPES.API,
    baseUrl: 'https://www.centerpointenergy.com/api',
    description: 'CenterPoint TDSP territory validation',
    priority: 85,
    reliability: 90
  },
  USPS_ADDRESS_API: {
    name: 'USPS Address Validation API',
    slug: 'usps_address_api',
    type: DATA_SOURCE_TYPES.API,
    baseUrl: 'https://secure.shippingapis.com/ShippingAPI.dll',
    description: 'Official USPS address standardization',
    priority: 80,
    reliability: 96
  },
  AEP_NORTH_API: {
    name: 'AEP Texas North Territory API',
    slug: 'aep_north_api',
    type: DATA_SOURCE_TYPES.API,
    baseUrl: 'https://www.aeptexas.com/api',
    description: 'AEP Texas North service territory data',
    priority: 75,
    reliability: 88
  },
  AEP_CENTRAL_API: {
    name: 'AEP Texas Central Territory API',
    slug: 'aep_central_api',
    type: DATA_SOURCE_TYPES.API,
    baseUrl: 'https://www.aeptexas.com/api',
    description: 'AEP Texas Central service territory data',
    priority: 75,
    reliability: 88
  },
  TNMP_API: {
    name: 'Texas-New Mexico Power API',
    slug: 'tnmp_api',
    type: DATA_SOURCE_TYPES.API,
    baseUrl: 'https://www.tnmp.com/api',
    description: 'TNMP service territory validation',
    priority: 70,
    reliability: 85
  },
  INTERNAL_CACHE: {
    name: 'Internal Redis Cache',
    slug: 'internal_cache',
    type: DATA_SOURCE_TYPES.CACHE,
    description: 'High-speed internal cache for validated data',
    priority: 100,
    reliability: 99
  }
} as const;

// Validation functions
export function isValidDataSourceType(type: string): type is DataSourceType {
  return Object.values(DATA_SOURCE_TYPES).includes(type as DataSourceType);
}

export function isValidPriority(priority: number): boolean {
  return priority >= 1 && priority <= 100 && Number.isInteger(priority);
}

export function isValidReliability(reliability: number): boolean {
  return reliability >= 0 && reliability <= 100 && Number.isInteger(reliability);
}

export function isValidConfiguration(config: unknown, type: DataSourceType): boolean {
  if (!config || typeof config !== 'object') return false;
  
  if (type === DATA_SOURCE_TYPES.API) {
    const apiConfig = config as APIConfiguration;
    return !!(apiConfig.rateLimits && 
             apiConfig.timeouts && 
             apiConfig.retryPolicy &&
             apiConfig.endpoints);
  }
  
  return true; // Other types have flexible configuration
}

// Query builder helpers
export const dataSourceQueries = {
  // Find active sources by type
  findActiveByType: (type: DataSourceType) => ({
    where: (table: typeof dataSources) => and(
      eq(table.type, type),
      eq(table.isActive, true)
    )
  }),
  
  // Find sources by reliability threshold
  findHighReliability: (minReliability: number = 90) => ({
    where: (table: typeof dataSources) => and(
      gte(table.reliability, minReliability),
      eq(table.isActive, true)
    )
  }),
  
  // Find sources with recent failures
  findWithRecentFailures: (maxFailures: number = 5) => ({
    where: (table: typeof dataSources) => and(
      gte(table.consecutiveFailures, maxFailures),
      eq(table.isActive, true)
    )
  }),
  
  // Find sources by priority range
  findByPriorityRange: (minPriority: number, maxPriority: number) => ({
    where: (table: typeof dataSources) => and(
      gte(table.priority, minPriority),
      lte(table.priority, maxPriority),
      eq(table.isActive, true)
    )
  }),
  
  // Find sources needing health check
  findNeedingHealthCheck: (hoursOld: number = 24) => ({
    where: (table: typeof dataSources) => or(
      isNull(table.lastSuccess),
      lt(table.lastSuccess, new Date(Date.now() - hoursOld * 60 * 60 * 1000))
    )
  }),
  
  // Find fastest sources
  findFastest: (maxResponseTime: number = 5000) => ({
    where: (table: typeof dataSources) => and(
      lte(table.averageResponseTime, maxResponseTime),
      eq(table.isActive, true)
    ),
    orderBy: (table: typeof dataSources) => asc(table.averageResponseTime)
  }),
  
  // Find sources for ZIP validation
  findForZipValidation: () => ({
    where: (table: typeof dataSources) => and(
      inArray(table.slug, [
        'ercot_mis',
        'puct_rep_directory', 
        'oncor_territory_api',
        'centerpoint_territory_api',
        'usps_address_api'
      ]),
      eq(table.isActive, true)
    ),
    orderBy: (table: typeof dataSources) => [
      desc(table.priority),
      desc(table.reliability)
    ]
  })
};

// Utility functions for data source management
export const dataSourceUtils = {
  // Calculate source health score
  calculateHealthScore: (source: DataSource): number => {
    if (!source.isActive) return 0;
    
    let score = source.reliability;
    
    // Penalize for consecutive failures
    score -= source.consecutiveFailures * 5;
    
    // Bonus for recent success
    if (source.lastSuccess) {
      const hoursAgo = (Date.now() - source.lastSuccess.getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 1) score += 10;
      else if (hoursAgo < 24) score += 5;
    }
    
    // Performance bonus
    if (source.averageResponseTime && source.averageResponseTime < 2000) {
      score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  },
  
  // Get best sources for a specific purpose
  getBestSources: (sources: DataSource[], purpose: 'zip_validation' | 'address_validation' | 'territory_lookup'): DataSource[] => {
    const activeSources = sources.filter(s => s.isActive);
    
    // Sort by health score and priority
    return activeSources.sort((a, b) => {
      const scoreA = dataSourceUtils.calculateHealthScore(a);
      const scoreB = dataSourceUtils.calculateHealthScore(b);
      
      if (scoreA !== scoreB) return scoreB - scoreA;
      return b.priority - a.priority;
    });
  },
  
  // Update source statistics
  recordSuccess: (currentStats: Partial<DataSource>, responseTime: number): Partial<DataSource> => {
    const avgResponseTime = currentStats.averageResponseTime || responseTime;
    
    return {
      ...currentStats,
      lastSuccess: new Date(),
      consecutiveFailures: 0,
      averageResponseTime: Math.round((avgResponseTime * 0.8) + (responseTime * 0.2)), // Weighted average
      reliability: Math.min(100, (currentStats.reliability || 90) + 1)
    };
  },
  
  // Record failure
  recordFailure: (currentStats: Partial<DataSource>, error: string): Partial<DataSource> => {
    const consecutiveFailures = (currentStats.consecutiveFailures || 0) + 1;
    
    return {
      ...currentStats,
      lastFailure: new Date(),
      consecutiveFailures,
      reliability: Math.max(0, (currentStats.reliability || 90) - Math.min(10, consecutiveFailures))
    };
  },
  
  // Check if source needs circuit breaker
  shouldCircuitBreak: (source: DataSource): boolean => {
    if (source.consecutiveFailures >= 10) return true;
    if (source.reliability < 50) return true;
    
    // Check if recent failures are too frequent
    if (source.lastFailure && source.lastSuccess) {
      const failureTime = source.lastFailure.getTime();
      const successTime = source.lastSuccess.getTime();
      
      if (failureTime > successTime && (Date.now() - failureTime) < 300000) { // 5 minutes
        return true;
      }
    }
    
    return false;
  },
  
  // Format source for display
  formatSourceInfo: (source: DataSource): string => {
    const health = dataSourceUtils.calculateHealthScore(source);
    const status = source.isActive ? 'Active' : 'Inactive';
    const responseTime = source.averageResponseTime ? `${source.averageResponseTime}ms` : 'Unknown';
    
    return `${source.name} (${status}, Health: ${health}%, Response: ${responseTime})`;
  }
};

// Default seed data for Texas electricity market sources
export const DEFAULT_DATA_SOURCE_SEED: NewDataSource[] = Object.values(TEXAS_DATA_SOURCES).map(source => ({
  name: source.name,
  slug: source.slug,
  type: source.type,
  baseUrl: source.baseUrl,
  priority: source.priority,
  reliability: source.reliability,
  isActive: true,
  configuration: source.type === DATA_SOURCE_TYPES.API ? {
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      requestsPerDay: 86400
    },
    timeouts: {
      connect: 5000,
      read: 30000,
      total: 35000
    },
    retryPolicy: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    },
    endpoints: {}
  } : {},
  metadata: {
    description: (source as unknown).description || '',
    region: 'texas',
    category: 'electricity_market'
  }
}));

// Import statements for relations
import type { zipCodeMappings as zipCodeMappingsTable } from './zip-code-mapping';
import type { validationLogs as validationLogsTable } from './validation-log';
import { eq, and, or, gte, lte, lt, desc, asc, inArray, isNull } from 'drizzle-orm';