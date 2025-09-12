/**
 * TDSP Information Database Model
 * Drizzle ORM schema for Transmission and Distribution Service Providers in Texas
 */

import { pgTable, varchar, boolean, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const tdspInfo = pgTable('tdsp_info', {
  duns: varchar('duns', { length: 13 }).primaryKey(), // DUNS number as primary key
  name: varchar('name', { length: 200 }).notNull(),
  zone: varchar('zone', { length: 50 }).notNull(), // North, South, Central, Coast, Valley
  serviceArea: jsonb('service_area').notNull().default('[]'), // Array of cities served
  apiEndpoint: varchar('api_endpoint', { length: 500 }), // TDSP API for territory validation
  isActive: boolean('is_active').notNull().default(true),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  contactInfo: jsonb('contact_info').notNull().default('{}'), // Contact information
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // Indexes for performance
  nameIdx: index('idx_tdsp_info_name').on(table.name),
  zoneIdx: index('idx_tdsp_info_zone').on(table.zone),
  isActiveIdx: index('idx_tdsp_info_is_active').on(table.isActive),
  lastUpdatedIdx: index('idx_tdsp_info_last_updated').on(table.lastUpdated),
}));

// Relations to other tables
export const tdspInfoRelations = relations(tdspInfo, ({ many }) => ({
  // Cities served by this TDSP
  cityTerritories: many(cityTerritoriesTable),
  
  // ZIP code mappings for this TDSP
  zipCodeMappings: many(zipCodeMappingsTable),
}));

// Type exports
export type TdspInfo = typeof tdspInfo.$inferSelect;
export type NewTdspInfo = typeof tdspInfo.$inferInsert;

// Contact information interface
export interface TdspContactInfo {
  website?: string;
  phone?: string;
  serviceTerritory?: string; // URL for territory maps
  customerService?: string;
  emergencyContact?: string;
  businessOffice?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

// Texas TDSP zones
export const TDSP_ZONES = {
  NORTH: 'North',
  COAST: 'Coast',
  CENTRAL: 'Central', 
  SOUTH: 'South',
  VALLEY: 'Valley'
} as const;

export type TdspZone = typeof TDSP_ZONES[keyof typeof TDSP_ZONES];

// Major Texas TDSPs with their DUNS numbers
export const MAJOR_TDSPS = {
  ONCOR: {
    duns: '1039940674000',
    name: 'Oncor Electric Delivery',
    zone: TDSP_ZONES.NORTH,
    primaryCities: ['dallas', 'fort-worth', 'plano', 'irving', 'garland', 'mesquite']
  },
  CENTERPOINT: {
    duns: '957877905',
    name: 'CenterPoint Energy Houston Electric',
    zone: TDSP_ZONES.COAST,
    primaryCities: ['houston', 'baytown', 'pearland', 'sugar-land', 'the-woodlands']
  },
  AEP_NORTH: {
    duns: '007923311',
    name: 'AEP Texas North Company',
    zone: TDSP_ZONES.NORTH,
    primaryCities: ['abilene', 'amarillo', 'lubbock', 'odessa', 'midland']
  },
  AEP_CENTRAL: {
    duns: '007924772', 
    name: 'AEP Texas Central Company',
    zone: TDSP_ZONES.CENTRAL,
    primaryCities: ['corpus-christi', 'laredo', 'mcallen', 'harlingen', 'brownsville']
  },
  TNMP: {
    duns: '007929441',
    name: 'Texas-New Mexico Power Company', 
    zone: TDSP_ZONES.SOUTH,
    primaryCities: ['beaumont', 'port-arthur', 'galveston', 'texas-city', 'victoria']
  }
} as const;

// Validation functions
export function isValidDunsNumber(duns: string): boolean {
  return /^\d{9,13}$/.test(duns);
}

export function isValidTdspZone(zone: string): zone is TdspZone {
  return Object.values(TDSP_ZONES).includes(zone as TdspZone);
}

export function isValidServiceArea(serviceArea: unknown): serviceArea is string[] {
  return Array.isArray(serviceArea) &&
         serviceArea.every(city => typeof city === 'string' && city.length > 0);
}

export function isValidContactInfo(contactInfo: unknown): contactInfo is TdspContactInfo {
  if (!contactInfo || typeof contactInfo !== 'object') return false;
  
  // Optional fields should be strings if present
  const stringFields = ['website', 'phone', 'serviceTerritory', 'customerService', 'emergencyContact', 'businessOffice'];
  
  for (const field of stringFields) {
    if (contactInfo[field] !== undefined && typeof contactInfo[field] !== 'string') {
      return false;
    }
  }
  
  return true;
}

// Query builder helpers
export const tdspInfoQueries = {
  // Find by DUNS number
  findByDuns: (duns: string) => ({
    where: (table: typeof tdspInfo) => eq(table.duns, duns)
  }),
  
  // Find active TDSPs
  findActive: () => ({
    where: (table: typeof tdspInfo) => eq(table.isActive, true)
  }),
  
  // Find by zone
  findByZone: (zone: TdspZone) => ({
    where: (table: typeof tdspInfo) => and(
      eq(table.zone, zone),
      eq(table.isActive, true)
    )
  }),
  
  // Find TDSPs serving a specific city
  findServingCity: (citySlug: string) => ({
    where: (table: typeof tdspInfo) => and(
      sql`${table.serviceArea} ? ${citySlug}`, // JSONB contains operator
      eq(table.isActive, true)
    )
  }),
  
  // Find TDSPs with API endpoints
  findWithApiAccess: () => ({
    where: (table: typeof tdspInfo) => and(
      isNotNull(table.apiEndpoint),
      eq(table.isActive, true)
    )
  }),
  
  // Find TDSPs needing data updates
  findStaleData: (daysOld: number = 30) => ({
    where: (table: typeof tdspInfo) => lt(
      table.lastUpdated,
      new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
    )
  }),
  
  // Find by name pattern
  findByNamePattern: (pattern: string) => ({
    where: (table: typeof tdspInfo) => and(
      ilike(table.name, `%${pattern}%`),
      eq(table.isActive, true)
    )
  })
};

// Utility functions for TDSP data management
export const tdspInfoUtils = {
  // Get TDSP by city
  getTdspForCity: (citySlug: string): typeof MAJOR_TDSPS[keyof typeof MAJOR_TDSPS] | null => {
    for (const [key, tdsp] of Object.entries(MAJOR_TDSPS)) {
      if (tdsp.primaryCities.includes(citySlug)) {
        return tdsp;
      }
    }
    return null;
  },
  
  // Check if TDSP is a major utility
  isMajorTdsp: (duns: string): boolean => {
    return Object.values(MAJOR_TDSPS).some(tdsp => tdsp.duns === duns);
  },
  
  // Get zone for TDSP
  getZoneForTdsp: (duns: string): TdspZone | null => {
    const tdsp = Object.values(MAJOR_TDSPS).find(t => t.duns === duns);
    return tdsp?.zone || null;
  },
  
  // Add city to service area
  addCityToServiceArea: (existingCities: string[], newCity: string): string[] => {
    if (!existingCities.includes(newCity)) {
      return [...existingCities, newCity].sort();
    }
    return existingCities;
  },
  
  // Remove city from service area
  removeCityFromServiceArea: (existingCities: string[], cityToRemove: string): string[] => {
    return existingCities.filter(city => city !== cityToRemove);
  },
  
  // Update contact information
  updateContactInfo: (existing: TdspContactInfo, updates: Partial<TdspContactInfo>): TdspContactInfo => {
    return { ...existing, ...updates };
  },
  
  // Format DUNS number for display
  formatDunsNumber: (duns: string): string => {
    if (!isValidDunsNumber(duns)) return duns;
    
    // Format as XXX-XXX-XXXX for readability
    if (duns.length === 13) {
      return `${duns.slice(0, 4)}-${duns.slice(4, 7)}-${duns.slice(7)}`;
    } else if (duns.length === 9) {
      return `${duns.slice(0, 3)}-${duns.slice(3, 6)}-${duns.slice(6)}`;
    }
    
    return duns;
  },
  
  // Validate API endpoint
  isValidApiEndpoint: (endpoint: string): boolean => {
    try {
      const url = new URL(endpoint);
      return url.protocol === 'https:' && url.hostname.length > 0;
    } catch {
      return false;
    }
  }
};

// TDSP service statistics
export interface TdspServiceStats {
  totalCities: number;
  totalZipCodes: number;
  deregulatedAreas: number;
  municipalAreas: number;
  averageResponseTime?: number; // API response time if applicable
  lastDataSync?: Date;
  dataAccuracy?: number; // Percentage
}

// TDSP territory boundary information
export interface TdspTerritoryBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  centerLat: number;
  centerLng: number;
}

// Default TDSP data for seeding
export const DEFAULT_TDSP_SEED_DATA: NewTdspInfo[] = [
  {
    duns: MAJOR_TDSPS.ONCOR.duns,
    name: MAJOR_TDSPS.ONCOR.name,
    zone: MAJOR_TDSPS.ONCOR.zone,
    serviceArea: MAJOR_TDSPS.ONCOR.primaryCities,
    isActive: true,
    contactInfo: {
      website: 'https://www.oncor.com',
      phone: '1-888-313-6862',
      serviceTerritory: 'https://www.oncor.com/en/pages/service-areas.aspx'
    }
  },
  {
    duns: MAJOR_TDSPS.CENTERPOINT.duns,
    name: MAJOR_TDSPS.CENTERPOINT.name,
    zone: MAJOR_TDSPS.CENTERPOINT.zone,
    serviceArea: MAJOR_TDSPS.CENTERPOINT.primaryCities,
    isActive: true,
    contactInfo: {
      website: 'https://www.centerpointenergy.com',
      phone: '1-800-332-7143',
      serviceTerritory: 'https://www.centerpointenergy.com/en-us/services/electricity/service-areas'
    }
  },
  {
    duns: MAJOR_TDSPS.AEP_NORTH.duns,
    name: MAJOR_TDSPS.AEP_NORTH.name,
    zone: MAJOR_TDSPS.AEP_NORTH.zone,
    serviceArea: MAJOR_TDSPS.AEP_NORTH.primaryCities,
    isActive: true,
    contactInfo: {
      website: 'https://www.aeptexas.com',
      phone: '1-866-223-8508',
      serviceTerritory: 'https://www.aeptexas.com/service-area/'
    }
  },
  {
    duns: MAJOR_TDSPS.AEP_CENTRAL.duns,
    name: MAJOR_TDSPS.AEP_CENTRAL.name,
    zone: MAJOR_TDSPS.AEP_CENTRAL.zone,
    serviceArea: MAJOR_TDSPS.AEP_CENTRAL.primaryCities,
    isActive: true,
    contactInfo: {
      website: 'https://www.aeptexas.com',
      phone: '1-866-223-8508',
      serviceTerritory: 'https://www.aeptexas.com/service-area/'
    }
  },
  {
    duns: MAJOR_TDSPS.TNMP.duns,
    name: MAJOR_TDSPS.TNMP.name,
    zone: MAJOR_TDSPS.TNMP.zone,
    serviceArea: MAJOR_TDSPS.TNMP.primaryCities,
    isActive: true,
    contactInfo: {
      website: 'https://www.tnmp.com',
      phone: '1-888-866-7456',
      serviceTerritory: 'https://www.tnmp.com/service-area'
    }
  }
];

// Import statements for relations
import type { cityTerritories as cityTerritoriesTable } from './city-territory';
import type { zipCodeMappings as zipCodeMappingsTable } from './zip-code-mapping';
import { eq, and, lt, sql, isNotNull, ilike } from 'drizzle-orm';