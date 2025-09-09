/**
 * ZIP Code Mapping Database Model
 * Drizzle ORM schema for ZIP-to-city mappings with TDSP assignments
 */

import { pgTable, uuid, varchar, boolean, timestamp, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const zipCodeMappings = pgTable('zip_code_mappings', {
  id: uuid('id').defaultRandom().primaryKey(),
  zipCode: varchar('zip_code', { length: 5 }).notNull(),
  citySlug: varchar('city_slug', { length: 100 }).notNull(),
  cityDisplayName: varchar('city_display_name', { length: 200 }).notNull(),
  tdspDuns: varchar('tdsp_duns', { length: 13 }).notNull(),
  tdspName: varchar('tdsp_name', { length: 200 }).notNull(),
  serviceType: varchar('service_type', { length: 20 }).notNull(), // deregulated, municipal, cooperative, regulated
  isActive: boolean('is_active').notNull().default(true),
  lastValidated: timestamp('last_validated').notNull().defaultNow(),
  dataSource: varchar('data_source', { length: 100 }).notNull(),
  confidence: integer('confidence').notNull(), // 0-100
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Primary indexes for fast lookups
  zipCodeIdx: uniqueIndex('idx_zip_code_mappings_zip_code').on(table.zipCode),
  citySlugIdx: index('idx_zip_code_mappings_city_slug').on(table.citySlug),
  tdspDunsIdx: index('idx_zip_code_mappings_tdsp_duns').on(table.tdspDuns),
  serviceTypeIdx: index('idx_zip_code_mappings_service_type').on(table.serviceType),
  isActiveIdx: index('idx_zip_code_mappings_is_active').on(table.isActive),
  lastValidatedIdx: index('idx_zip_code_mappings_last_validated').on(table.lastValidated),
  dataSourceIdx: index('idx_zip_code_mappings_data_source').on(table.dataSource),
  confidenceIdx: index('idx_zip_code_mappings_confidence').on(table.confidence),
  
  // Composite indexes for common query patterns
  activeServiceIdx: index('idx_zip_code_mappings_active_service').on(table.serviceType, table.isActive),
  cityActiveIdx: index('idx_zip_code_mappings_city_active').on(table.citySlug, table.isActive),
  tdspActiveIdx: index('idx_zip_code_mappings_tdsp_active').on(table.tdspDuns, table.isActive),
}));

// Relations to other tables
export const zipCodeMappingRelations = relations(zipCodeMappings, ({ one, many }) => ({
  // Reference to TDSP info table
  tdspInfo: one(tdspInfoTable, {
    fields: [zipCodeMappings.tdspDuns],
    references: [tdspInfoTable.duns],
  }),
  
  // Reference to city territory table
  cityTerritory: one(cityTerritoriesTable, {
    fields: [zipCodeMappings.citySlug],
    references: [cityTerritoriesTable.citySlug],
  }),
  
  // Validation logs for this mapping
  validationLogs: many(validationLogsTable),
}));

// Type exports for use in application code
export type ZipCodeMapping = typeof zipCodeMappings.$inferSelect;
export type NewZipCodeMapping = typeof zipCodeMappings.$inferInsert;

// Service type enum for validation
export const SERVICE_TYPES = {
  DEREGULATED: 'deregulated',
  MUNICIPAL: 'municipal', 
  COOPERATIVE: 'cooperative',
  REGULATED: 'regulated'
} as const;

export type ServiceType = typeof SERVICE_TYPES[keyof typeof SERVICE_TYPES];

// Data source types
export const DATA_SOURCES = {
  ERCOT_MIS: 'ERCOT_MIS',
  PUCT_RETAIL_PROVIDERS: 'PUCT_RETAIL_PROVIDERS',
  ONCOR_TERRITORY_API: 'ONCOR_TERRITORY_API',
  CENTERPOINT_TERRITORY_API: 'CENTERPOINT_TERRITORY_API',
  USPS_ZIP_DATABASE: 'USPS_ZIP_DATABASE',
  AEP_NORTH_API: 'AEP_NORTH_API',
  AEP_CENTRAL_API: 'AEP_CENTRAL_API',
  TNMP_API: 'TNMP_API',
  MANUAL_ENTRY: 'MANUAL_ENTRY'
} as const;

// Validation functions
export function isValidServiceType(type: string): type is ServiceType {
  return Object.values(SERVICE_TYPES).includes(type as ServiceType);
}

export function isValidZipCode(zipCode: string): boolean {
  return /^\d{5}$/.test(zipCode) && 
         parseInt(zipCode) >= 73000 && 
         parseInt(zipCode) <= 79999; // Texas ZIP code range
}

export function isValidConfidence(confidence: number): boolean {
  return confidence >= 0 && confidence <= 100 && Number.isInteger(confidence);
}

export function isValidTdspDuns(duns: string): boolean {
  return /^\d{9,13}$/.test(duns);
}

// Query builder helpers
export const zipCodeMappingQueries = {
  // Find by ZIP code
  findByZipCode: (zipCode: string) => ({
    where: (table: typeof zipCodeMappings) => eq(table.zipCode, zipCode)
  }),
  
  // Find active mappings for a city
  findActiveByCitySlug: (citySlug: string) => ({
    where: (table: typeof zipCodeMappings) => and(
      eq(table.citySlug, citySlug),
      eq(table.isActive, true)
    )
  }),
  
  // Find by TDSP
  findByTdsp: (tdspDuns: string) => ({
    where: (table: typeof zipCodeMappings) => and(
      eq(table.tdspDuns, tdspDuns),
      eq(table.isActive, true)
    )
  }),
  
  // Find deregulated areas only
  findDeregulated: () => ({
    where: (table: typeof zipCodeMappings) => and(
      eq(table.serviceType, SERVICE_TYPES.DEREGULATED),
      eq(table.isActive, true)
    )
  }),
  
  // Find by confidence threshold
  findHighConfidence: (minConfidence: number = 90) => ({
    where: (table: typeof zipCodeMappings) => and(
      gte(table.confidence, minConfidence),
      eq(table.isActive, true)
    )
  }),
  
  // Find stale mappings needing revalidation
  findStaleValidations: (daysOld: number = 30) => ({
    where: (table: typeof zipCodeMappings) => lt(
      table.lastValidated, 
      new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
    )
  }),
  
  // Find conflicts between data sources
  findConflicts: () => ({
    // This would be a more complex query to find ZIP codes with conflicting mappings
    where: (table: typeof zipCodeMappings) => eq(table.confidence, 50) // Placeholder
  })
};

// Import statements for relations (these would be defined in their respective files)
import type { tdspInfo as tdspInfoTable } from './tdsp-info';
import type { cityTerritories as cityTerritoriesTable } from './city-territory';
import type { validationLogs as validationLogsTable } from './validation-log';
import { eq, and, gte, lt } from 'drizzle-orm';