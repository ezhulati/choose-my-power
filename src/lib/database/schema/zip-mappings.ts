/**
 * Drizzle ORM schema for ZIP code mappings table
 * Feature: 010-expand-zip-code
 * Constitutional compliance: Real data mappings, no hardcoded values
 */

import { pgTable, varchar, boolean, decimal, timestamp, text, index } from 'drizzle-orm/pg-core';

export const zipMappings = pgTable('zip_mappings', {
  id: varchar('id', { length: 36 }).primaryKey().default('gen_random_uuid()'),
  zipCode: varchar('zip_code', { length: 5 }).notNull(),
  zipPlus4Pattern: varchar('zip_plus4_pattern', { length: 10 }),
  cityName: varchar('city_name', { length: 100 }).notNull(),
  citySlug: varchar('city_slug', { length: 100 }).notNull(),
  countyName: varchar('county_name', { length: 100 }).notNull(),
  tdspTerritory: varchar('tdsp_territory', { length: 100 }).notNull(),
  tdspDuns: varchar('tdsp_duns', { length: 20 }).notNull(),
  isDeregulated: boolean('is_deregulated').notNull().default(true),
  marketZone: varchar('market_zone', { length: 20 }).notNull(), // 'North' | 'Central' | 'Coast' | 'South' | 'West'
  priority: decimal('priority', { precision: 3, scale: 1 }).notNull().default('1.0'),
  lastValidated: timestamp('last_validated', { withTimezone: true }).notNull().defaultNow(),
  dataSource: varchar('data_source', { length: 10 }).notNull().default('MANUAL'), // 'USPS' | 'TDU' | 'MANUAL' | 'PUCT'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  zipCodeIdx: index('zip_mappings_zip_code_idx').on(table.zipCode),
  citySlugIdx: index('zip_mappings_city_slug_idx').on(table.citySlug),
  tdspDunsIdx: index('zip_mappings_tdsp_duns_idx').on(table.tdspDuns),
  marketZoneIdx: index('zip_mappings_market_zone_idx').on(table.marketZone),
  isDeregulatedIdx: index('zip_mappings_is_deregulated_idx').on(table.isDeregulated),
  uniqueZipCityIdx: index('zip_mappings_unique_zip_city_idx').on(table.zipCode, table.citySlug),
}));

export type ZipMapping = typeof zipMappings.$inferSelect;
export type NewZipMapping = typeof zipMappings.$inferInsert;