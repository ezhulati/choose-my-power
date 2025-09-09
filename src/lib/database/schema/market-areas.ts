/**
 * Drizzle ORM schema for deregulated market areas table
 * Feature: 010-expand-zip-code
 * Constitutional compliance: Real market definitions, PUCT data sources
 */

import { pgTable, varchar, boolean, integer, timestamp, text, index } from 'drizzle-orm/pg-core';

export const deregulatedMarketAreas = pgTable('deregulated_market_areas', {
  id: varchar('id', { length: 36 }).primaryKey().default('gen_random_uuid()'),
  areaId: varchar('area_id', { length: 100 }).notNull().unique(),
  areaName: varchar('area_name', { length: 150 }).notNull(),
  primaryCity: varchar('primary_city', { length: 100 }).notNull(),
  primaryCitySlug: varchar('primary_city_slug', { length: 100 }).notNull(),
  coverageZipCodes: text('coverage_zip_codes').notNull(), // JSON array of ZIP codes
  tdspProviders: text('tdsp_providers').notNull(), // JSON array of TDU DUNS numbers
  marketZone: varchar('market_zone', { length: 20 }).notNull(), // 'North' | 'Central' | 'Coast' | 'South' | 'West'
  regulatoryStatus: varchar('regulatory_status', { length: 20 }).notNull().default('DEREGULATED'), // 'DEREGULATED' | 'MUNICIPAL' | 'COOPERATIVE'
  planAvailability: boolean('plan_availability').notNull().default(true),
  priorityLevel: integer('priority_level').notNull().default(2), // 1 = major metro, 2 = regional city, 3 = rural
  lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  areaIdIdx: index('market_areas_area_id_idx').on(table.areaId),
  primaryCitySlugIdx: index('market_areas_primary_city_slug_idx').on(table.primaryCitySlug),
  marketZoneIdx: index('market_areas_market_zone_idx').on(table.marketZone),
  priorityLevelIdx: index('market_areas_priority_level_idx').on(table.priorityLevel),
  regulatoryStatusIdx: index('market_areas_regulatory_status_idx').on(table.regulatoryStatus),
  planAvailabilityIdx: index('market_areas_plan_availability_idx').on(table.planAvailability),
}));

export const zipCoverageGaps = pgTable('zip_coverage_gaps', {
  id: varchar('id', { length: 36 }).primaryKey().default('gen_random_uuid()'),
  zipCode: varchar('zip_code', { length: 5 }).notNull().unique(),
  requestCount: integer('request_count').notNull().default(1),
  firstRequested: timestamp('first_requested', { withTimezone: true }).notNull().defaultNow(),
  lastRequested: timestamp('last_requested', { withTimezone: true }).notNull().defaultNow(),
  investigationStatus: varchar('investigation_status', { length: 20 }).notNull().default('PENDING'), // 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'NOT_APPLICABLE'
  resolution: text('resolution'),
  priority: varchar('priority', { length: 10 }).notNull().default('MEDIUM'), // 'HIGH' | 'MEDIUM' | 'LOW'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  zipCodeIdx: index('zip_coverage_gaps_zip_code_idx').on(table.zipCode),
  priorityIdx: index('zip_coverage_gaps_priority_idx').on(table.priority),
  investigationStatusIdx: index('zip_coverage_gaps_investigation_status_idx').on(table.investigationStatus),
  requestCountIdx: index('zip_coverage_gaps_request_count_idx').on(table.requestCount),
}));

export const tduServiceTerritories = pgTable('tdu_service_territories', {
  id: varchar('id', { length: 36 }).primaryKey().default('gen_random_uuid()'),
  duns: varchar('duns', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  abbreviation: varchar('abbreviation', { length: 10 }).notNull(),
  serviceZipCodes: text('service_zip_codes').notNull(), // JSON array of ZIP codes
  marketZones: text('market_zones').notNull(), // JSON array of market zones
  isDeregulated: boolean('is_deregulated').notNull().default(true),
  contactPhone: varchar('contact_phone', { length: 20 }),
  contactWebsite: varchar('contact_website', { length: 200 }),
  serviceAreas: text('service_areas'), // JSON array of service area names
  lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  dunsIdx: index('tdu_service_territories_duns_idx').on(table.duns),
  nameIdx: index('tdu_service_territories_name_idx').on(table.name),
  abbreviationIdx: index('tdu_service_territories_abbreviation_idx').on(table.abbreviation),
  isDeregulatedIdx: index('tdu_service_territories_is_deregulated_idx').on(table.isDeregulated),
}));

export type DeregulatedMarketArea = typeof deregulatedMarketAreas.$inferSelect;
export type NewDeregulatedMarketArea = typeof deregulatedMarketAreas.$inferInsert;
export type ZipCoverageGap = typeof zipCoverageGaps.$inferSelect;
export type NewZipCoverageGap = typeof zipCoverageGaps.$inferInsert;
export type TduServiceTerritory = typeof tduServiceTerritories.$inferSelect;
export type NewTduServiceTerritory = typeof tduServiceTerritories.$inferInsert;