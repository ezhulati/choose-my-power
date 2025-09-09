/**
 * City Territory Database Model
 * Drizzle ORM schema for Texas city territories and service areas
 */

import { pgTable, uuid, varchar, boolean, timestamp, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const cityTerritories = pgTable('city_territories', {
  id: uuid('id').defaultRandom().primaryKey(),
  citySlug: varchar('city_slug', { length: 100 }).notNull(),
  cityDisplayName: varchar('city_display_name', { length: 200 }).notNull(),
  primaryTdsp: varchar('primary_tdsp', { length: 13 }).notNull(), // TDSP DUNS
  serviceType: varchar('service_type', { length: 20 }).notNull(), // deregulated, municipal, cooperative, regulated
  zipCodes: jsonb('zip_codes').notNull().default('[]'), // Array of ZIP codes in this territory
  planCount: integer('plan_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  coordinates: jsonb('coordinates').notNull().default('{}'), // { latitude: number, longitude: number }
  metadata: jsonb('metadata').notNull().default('{}'), // Additional city data
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // Primary indexes
  citySlugIdx: uniqueIndex('idx_city_territories_city_slug').on(table.citySlug),
  primaryTdspIdx: index('idx_city_territories_primary_tdsp').on(table.primaryTdsp),
  serviceTypeIdx: index('idx_city_territories_service_type').on(table.serviceType),
  isActiveIdx: index('idx_city_territories_is_active').on(table.isActive),
  lastUpdatedIdx: index('idx_city_territories_last_updated').on(table.lastUpdated),
  planCountIdx: index('idx_city_territories_plan_count').on(table.planCount),
  
  // Composite indexes for common queries
  activeServiceIdx: index('idx_city_territories_active_service').on(table.serviceType, table.isActive),
  tdspActiveIdx: index('idx_city_territories_tdsp_active').on(table.primaryTdsp, table.isActive),
}));

// Relations to other tables
export const cityTerritoryRelations = relations(cityTerritories, ({ one, many }) => ({
  // Reference to TDSP info table
  tdspInfo: one(tdspInfoTable, {
    fields: [cityTerritories.primaryTdsp],
    references: [tdspInfoTable.duns],
  }),
  
  // ZIP code mappings for this city
  zipCodeMappings: many(zipCodeMappingsTable),
}));

// Type exports
export type CityTerritory = typeof cityTerritories.$inferSelect;
export type NewCityTerritory = typeof cityTerritories.$inferInsert;

// Coordinate interface for type safety
export interface CityCoordinates {
  latitude: number;
  longitude: number;
}

// Metadata interface for city information
export interface CityMetadata {
  population?: number;
  averageRate?: number; // Average electricity rate ¢/kWh
  competitivePlans?: number; // Number of competitive plans
  county?: string;
  timezone?: string;
  majorTdsp?: string; // Alternative TDSP serving area
  ruralArea?: boolean;
  newDevelopment?: boolean;
}

// Texas geographic zones
export const TEXAS_ZONES = {
  NORTH: 'North',
  COAST: 'Coast', 
  CENTRAL: 'Central',
  SOUTH: 'South',
  VALLEY: 'Valley'
} as const;

export type TexasZone = typeof TEXAS_ZONES[keyof typeof TEXAS_ZONES];

// Major Texas cities configuration
export const MAJOR_TEXAS_CITIES = [
  'houston',
  'dallas',
  'san-antonio', 
  'austin',
  'fort-worth',
  'el-paso',
  'arlington',
  'corpus-christi',
  'plano',
  'irving'
] as const;

// Validation functions
export function isValidCitySlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 100;
}

export function isValidCoordinates(coords: any): coords is CityCoordinates {
  return coords &&
         typeof coords.latitude === 'number' &&
         typeof coords.longitude === 'number' &&
         coords.latitude >= 25 && coords.latitude <= 37 && // Texas latitude range
         coords.longitude >= -107 && coords.longitude <= -93; // Texas longitude range
}

export function isValidZipCodeArray(zipCodes: any): zipCodes is string[] {
  return Array.isArray(zipCodes) &&
         zipCodes.length > 0 &&
         zipCodes.every(zip => typeof zip === 'string' && /^\d{5}$/.test(zip));
}

export function isMajorTexasCity(citySlug: string): boolean {
  return MAJOR_TEXAS_CITIES.includes(citySlug as typeof MAJOR_TEXAS_CITIES[number]);
}

// Query builder helpers
export const cityTerritoryQueries = {
  // Find by city slug
  findByCitySlug: (citySlug: string) => ({
    where: (table: typeof cityTerritories) => eq(table.citySlug, citySlug)
  }),
  
  // Find active cities
  findActive: () => ({
    where: (table: typeof cityTerritories) => eq(table.isActive, true)
  }),
  
  // Find by TDSP
  findByTdsp: (tdspDuns: string) => ({
    where: (table: typeof cityTerritories) => and(
      eq(table.primaryTdsp, tdspDuns),
      eq(table.isActive, true)
    )
  }),
  
  // Find deregulated cities
  findDeregulated: () => ({
    where: (table: typeof cityTerritories) => and(
      eq(table.serviceType, 'deregulated'),
      eq(table.isActive, true)
    )
  }),
  
  // Find cities with many plans
  findHighPlanCount: (minPlans: number = 20) => ({
    where: (table: typeof cityTerritories) => and(
      gte(table.planCount, minPlans),
      eq(table.isActive, true)
    )
  }),
  
  // Find cities by zone
  findByZone: (zone: TexasZone) => ({
    where: (table: typeof cityTerritories) => and(
      sql`${table.metadata}->>'zone' = ${zone}`,
      eq(table.isActive, true)
    )
  }),
  
  // Find major cities
  findMajorCities: () => ({
    where: (table: typeof cityTerritories) => and(
      inArray(table.citySlug, MAJOR_TEXAS_CITIES),
      eq(table.isActive, true)
    )
  }),
  
  // Find cities needing data updates
  findStaleData: (daysOld: number = 7) => ({
    where: (table: typeof cityTerritories) => lt(
      table.lastUpdated,
      new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
    )
  }),
  
  // Find cities by ZIP code
  findByZipCode: (zipCode: string) => ({
    where: (table: typeof cityTerritories) => and(
      sql`${table.zipCodes} ? ${zipCode}`, // JSONB contains operator
      eq(table.isActive, true)
    )
  }),
  
  // Find cities within geographic bounds
  findInBounds: (bounds: { north: number, south: number, east: number, west: number }) => ({
    where: (table: typeof cityTerritories) => and(
      sql`CAST(${table.coordinates}->>'latitude' AS FLOAT) BETWEEN ${bounds.south} AND ${bounds.north}`,
      sql`CAST(${table.coordinates}->>'longitude' AS FLOAT) BETWEEN ${bounds.west} AND ${bounds.east}`,
      eq(table.isActive, true)
    )
  })
};

// Utility functions for city data management
export const cityTerritoryUtils = {
  // Add ZIP code to city territory
  addZipCode: (existingZipCodes: string[], newZipCode: string): string[] => {
    if (!existingZipCodes.includes(newZipCode)) {
      return [...existingZipCodes, newZipCode].sort();
    }
    return existingZipCodes;
  },
  
  // Remove ZIP code from city territory
  removeZipCode: (existingZipCodes: string[], zipCodeToRemove: string): string[] => {
    return existingZipCodes.filter(zip => zip !== zipCodeToRemove);
  },
  
  // Update city metadata
  updateMetadata: (existing: CityMetadata, updates: Partial<CityMetadata>): CityMetadata => {
    return { ...existing, ...updates };
  },
  
  // Calculate distance between cities
  calculateDistance: (city1: CityCoordinates, city2: CityCoordinates): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (city2.latitude - city1.latitude) * Math.PI / 180;
    const dLon = (city2.longitude - city1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(city1.latitude * Math.PI / 180) * Math.cos(city2.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in miles
  },
  
  // Find nearest city
  findNearestCity: (targetCoords: CityCoordinates, cities: (CityTerritory & { coordinates: CityCoordinates })[]): CityTerritory | null => {
    if (cities.length === 0) return null;
    
    let nearest = cities[0];
    let minDistance = cityTerritoryUtils.calculateDistance(targetCoords, cities[0].coordinates);
    
    for (let i = 1; i < cities.length; i++) {
      const distance = cityTerritoryUtils.calculateDistance(targetCoords, cities[i].coordinates);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = cities[i];
      }
    }
    
    return nearest;
  }
};

// Import statements for relations
import type { tdspInfo as tdspInfoTable } from './tdsp-info';
import type { zipCodeMappings as zipCodeMappingsTable } from './zip-code-mapping';
import { eq, and, gte, lt, sql, inArray } from 'drizzle-orm';