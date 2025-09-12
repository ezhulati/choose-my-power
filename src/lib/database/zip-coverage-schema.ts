/**
 * Database Schema for ZIP Code Coverage System
 * Defines tables for comprehensive Texas ZIP-to-city mapping
 */

// ZIP Coverage System Entities
export interface ZIPCodeMapping {
  id: string;                    // Primary key: UUID
  zip_code: string;              // 5-digit ZIP code (indexed)
  city_slug: string;             // City identifier (e.g., "dallas", "houston")
  city_display_name: string;     // Human-readable city name (e.g., "Dallas, TX")
  tdsp_duns: string;             // TDSP identifier (e.g., "1039940674000")
  tdsp_name: string;             // TDSP display name (e.g., "Oncor Electric Delivery")
  service_type: 'deregulated' | 'municipal' | 'cooperative' | 'regulated';
  is_active: boolean;            // Whether ZIP code mapping is currently valid
  last_validated: Date;          // Last validation against external sources
  data_source: string;           // Which external source provided this mapping
  confidence: number;            // Confidence score (0-100) based on source validation
  created_at: Date;
  updated_at: Date;
}

export interface CityTerritory {
  id: string;                    // Primary key: UUID
  city_slug: string;             // Unique city identifier (indexed)
  city_display_name: string;     // Full display name with state
  primary_tdsp: string;          // Primary TDSP DUNS for this city
  service_type: 'deregulated' | 'municipal' | 'cooperative' | 'regulated';
  zip_codes: string[];           // JSON array of ZIP codes in this territory
  plan_count: number;            // Number of available electricity plans
  is_active: boolean;            // Whether city is currently served
  last_updated: Date;            // Last data refresh
  coordinates: {                 // JSON object with city center coordinates
    latitude: number;
    longitude: number;
  };
  metadata: {                    // JSON object with additional city data
    population?: number;
    average_rate?: number;       // Average electricity rate ¢/kWh
    competitive_plans?: number;  // Number of competitive plans
  };
}

export interface TDSPInfo {
  duns: string;                  // Primary key: DUNS number
  name: string;                  // Official TDSP name
  zone: string;                  // Geographic zone (North, South, Central, Coast)
  service_area: string[];        // JSON array of cities served
  api_endpoint?: string;         // TDSP API for territory validation
  is_active: boolean;            // Currently operating status
  last_updated: Date;
  contact_info: {                // JSON object with contact information
    website?: string;
    phone?: string;
    service_territory?: string;  // URL for territory maps
  };
}

export interface DataSource {
  id: string;                    // Primary key: UUID
  name: string;                  // Data source name (e.g., "ERCOT_MIS")
  type: 'api' | 'file' | 'manual';
  endpoint?: string;             // API endpoint URL
  last_sync: Date;               // Last successful data sync
  next_sync: Date;               // Scheduled next sync
  is_active: boolean;            // Whether source is currently used
  priority: number;              // Source priority for conflict resolution (1-10)
  rate_limits: {                 // JSON object with rate limiting info
    requests_per_hour: number;
    requests_per_day: number;
  };
  sync_status: 'success' | 'error' | 'in_progress' | 'scheduled';
  error_details?: string;        // Last error message if sync failed
}

export interface ValidationLog {
  id: string;                    // Primary key: UUID
  zip_code: string;              // ZIP code being validated
  validation_type: 'lookup' | 'sync' | 'manual' | 'conflict_resolution';
  data_source: string;           // Source that provided the data
  result: 'success' | 'error' | 'conflict' | 'no_change';
  old_value?: Record<string, unknown>; // JSON object with previous values
  new_value?: Record<string, unknown>; // JSON object with new values
  conflict_sources?: string[];   // JSON array of sources that disagreed
  resolved_by?: string;          // How conflict was resolved
  timestamp: Date;
  processing_time: number;       // Milliseconds taken for validation
  user_agent?: string;           // If triggered by user request
}

/**
 * SQL DDL for ZIP Coverage System Tables
 */
export const ZIP_COVERAGE_TABLES_SQL = `
-- ZIP Code Mapping table
CREATE TABLE IF NOT EXISTS zip_code_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code VARCHAR(5) NOT NULL UNIQUE,
  city_slug VARCHAR(100) NOT NULL,
  city_display_name VARCHAR(200) NOT NULL,
  tdsp_duns VARCHAR(13) NOT NULL,
  tdsp_name VARCHAR(200) NOT NULL,
  service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('deregulated', 'municipal', 'cooperative', 'regulated')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_validated TIMESTAMP NOT NULL DEFAULT NOW(),
  data_source VARCHAR(100) NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- City Territory table
CREATE TABLE IF NOT EXISTS city_territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug VARCHAR(100) NOT NULL UNIQUE,
  city_display_name VARCHAR(200) NOT NULL,
  primary_tdsp VARCHAR(13) NOT NULL,
  service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('deregulated', 'municipal', 'cooperative', 'regulated')),
  zip_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  plan_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  coordinates JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- TDSP Information table  
CREATE TABLE IF NOT EXISTS tdsp_info (
  duns VARCHAR(13) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  zone VARCHAR(50) NOT NULL,
  service_area JSONB NOT NULL DEFAULT '[]'::jsonb,
  api_endpoint VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  contact_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Data Sources table
CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('api', 'file', 'manual')),
  endpoint VARCHAR(500),
  last_sync TIMESTAMP,
  next_sync TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 10),
  rate_limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  sync_status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (sync_status IN ('success', 'error', 'in_progress', 'scheduled')),
  error_details TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Validation Log table
CREATE TABLE IF NOT EXISTS validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code VARCHAR(5) NOT NULL,
  validation_type VARCHAR(30) NOT NULL CHECK (validation_type IN ('lookup', 'sync', 'manual', 'conflict_resolution')),
  data_source VARCHAR(100) NOT NULL,
  result VARCHAR(20) NOT NULL CHECK (result IN ('success', 'error', 'conflict', 'no_change')),
  old_value JSONB,
  new_value JSONB,
  conflict_sources JSONB,
  resolved_by VARCHAR(200),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  processing_time INTEGER NOT NULL DEFAULT 0,
  user_agent TEXT
);

-- Indexes for ZIP Code Mappings
CREATE INDEX IF NOT EXISTS idx_zip_code_mappings_zip_code ON zip_code_mappings(zip_code);
CREATE INDEX IF NOT EXISTS idx_zip_code_mappings_city_slug ON zip_code_mappings(city_slug);
CREATE INDEX IF NOT EXISTS idx_zip_code_mappings_tdsp_duns ON zip_code_mappings(tdsp_duns);
CREATE INDEX IF NOT EXISTS idx_zip_code_mappings_service_type ON zip_code_mappings(service_type);
CREATE INDEX IF NOT EXISTS idx_zip_code_mappings_is_active ON zip_code_mappings(is_active);
CREATE INDEX IF NOT EXISTS idx_zip_code_mappings_last_validated ON zip_code_mappings(last_validated);
CREATE INDEX IF NOT EXISTS idx_zip_code_mappings_data_source ON zip_code_mappings(data_source);
CREATE INDEX IF NOT EXISTS idx_zip_code_mappings_confidence ON zip_code_mappings(confidence);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_zip_code_mappings_active_service ON zip_code_mappings(service_type, is_active);
CREATE INDEX IF NOT EXISTS idx_zip_code_mappings_city_active ON zip_code_mappings(city_slug, is_active);
CREATE INDEX IF NOT EXISTS idx_zip_code_mappings_tdsp_active ON zip_code_mappings(tdsp_duns, is_active);

-- Indexes for City Territories
CREATE INDEX IF NOT EXISTS idx_city_territories_city_slug ON city_territories(city_slug);
CREATE INDEX IF NOT EXISTS idx_city_territories_primary_tdsp ON city_territories(primary_tdsp);
CREATE INDEX IF NOT EXISTS idx_city_territories_service_type ON city_territories(service_type);
CREATE INDEX IF NOT EXISTS idx_city_territories_is_active ON city_territories(is_active);
CREATE INDEX IF NOT EXISTS idx_city_territories_last_updated ON city_territories(last_updated);
CREATE INDEX IF NOT EXISTS idx_city_territories_plan_count ON city_territories(plan_count);

-- Indexes for TDSP Info
CREATE INDEX IF NOT EXISTS idx_tdsp_info_name ON tdsp_info(name);
CREATE INDEX IF NOT EXISTS idx_tdsp_info_zone ON tdsp_info(zone);
CREATE INDEX IF NOT EXISTS idx_tdsp_info_is_active ON tdsp_info(is_active);
CREATE INDEX IF NOT EXISTS idx_tdsp_info_last_updated ON tdsp_info(last_updated);

-- Indexes for Data Sources
CREATE INDEX IF NOT EXISTS idx_data_sources_name ON data_sources(name);
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
CREATE INDEX IF NOT EXISTS idx_data_sources_is_active ON data_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_data_sources_sync_status ON data_sources(sync_status);
CREATE INDEX IF NOT EXISTS idx_data_sources_priority ON data_sources(priority);
CREATE INDEX IF NOT EXISTS idx_data_sources_last_sync ON data_sources(last_sync);
CREATE INDEX IF NOT EXISTS idx_data_sources_next_sync ON data_sources(next_sync);

-- Indexes for Validation Logs
CREATE INDEX IF NOT EXISTS idx_validation_logs_zip_code ON validation_logs(zip_code);
CREATE INDEX IF NOT EXISTS idx_validation_logs_validation_type ON validation_logs(validation_type);
CREATE INDEX IF NOT EXISTS idx_validation_logs_data_source ON validation_logs(data_source);
CREATE INDEX IF NOT EXISTS idx_validation_logs_result ON validation_logs(result);
CREATE INDEX IF NOT EXISTS idx_validation_logs_timestamp ON validation_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_validation_logs_processing_time ON validation_logs(processing_time);

-- Composite indexes for validation logs
CREATE INDEX IF NOT EXISTS idx_validation_logs_zip_timestamp ON validation_logs(zip_code, timestamp);
CREATE INDEX IF NOT EXISTS idx_validation_logs_source_result ON validation_logs(data_source, result);

-- Update triggers for ZIP Coverage tables
CREATE OR REPLACE FUNCTION update_zip_coverage_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_zip_code_mappings_updated_at BEFORE UPDATE ON zip_code_mappings
  FOR EACH ROW EXECUTE FUNCTION update_zip_coverage_updated_at_column();

-- Foreign key constraints
ALTER TABLE zip_code_mappings 
ADD CONSTRAINT fk_zip_code_mappings_tdsp 
FOREIGN KEY (tdsp_duns) REFERENCES tdsp_info(duns) ON DELETE RESTRICT;

ALTER TABLE city_territories 
ADD CONSTRAINT fk_city_territories_tdsp 
FOREIGN KEY (primary_tdsp) REFERENCES tdsp_info(duns) ON DELETE RESTRICT;
`;

/**
 * Initial TDSP data for seeding
 */
export const INITIAL_TDSP_DATA = [
  {
    duns: '1039940674000',
    name: 'Oncor Electric Delivery',
    zone: 'North',
    service_area: ['dallas', 'fort-worth', 'plano', 'irving', 'garland', 'mesquite', 'richardson', 'carrollton'],
    api_endpoint: null,
    is_active: true,
    contact_info: {
      website: 'https://www.oncor.com',
      phone: '1-888-313-6862',
      service_territory: 'https://www.oncor.com/en/pages/service-areas.aspx'
    }
  },
  {
    duns: '957877905',
    name: 'CenterPoint Energy Houston Electric',
    zone: 'Coast',
    service_area: ['houston', 'baytown', 'pearland', 'sugar-land', 'the-woodlands', 'katy', 'spring', 'humble'],
    api_endpoint: null,
    is_active: true,
    contact_info: {
      website: 'https://www.centerpointenergy.com',
      phone: '1-800-332-7143',
      service_territory: 'https://www.centerpointenergy.com/en-us/services/electricity/service-areas'
    }
  },
  {
    duns: '007923311',
    name: 'AEP Texas North Company',
    zone: 'North',
    service_area: ['abilene', 'amarillo', 'lubbock', 'odessa', 'midland', 'big-spring', 'sweetwater'],
    api_endpoint: null,
    is_active: true,
    contact_info: {
      website: 'https://www.aeptexas.com',
      phone: '1-866-223-8508',
      service_territory: 'https://www.aeptexas.com/service-area/'
    }
  },
  {
    duns: '007924772',
    name: 'AEP Texas Central Company',
    zone: 'Central',
    service_area: ['corpus-christi', 'laredo', 'mcallen', 'harlingen', 'brownsville', 'edinburg', 'mission'],
    api_endpoint: null,
    is_active: true,
    contact_info: {
      website: 'https://www.aeptexas.com',
      phone: '1-866-223-8508',
      service_territory: 'https://www.aeptexas.com/service-area/'
    }
  },
  {
    duns: '007929441',
    name: 'Texas-New Mexico Power Company',
    zone: 'South',
    service_area: ['beaumont', 'port-arthur', 'galveston', 'texas-city', 'bay-city', 'victoria', 'wharton'],
    api_endpoint: null,
    is_active: true,
    contact_info: {
      website: 'https://www.tnmp.com',
      phone: '1-888-866-7456',
      service_territory: 'https://www.tnmp.com/service-area'
    }
  }
];

/**
 * Initial data sources for seeding
 */
export const INITIAL_DATA_SOURCES = [
  {
    name: 'ERCOT_MIS',
    type: 'api' as const,
    endpoint: 'https://www.ercot.com/mktrpt/mis',
    is_active: true,
    priority: 10, // Highest priority
    rate_limits: {
      requests_per_hour: 100,
      requests_per_day: 1000
    },
    sync_status: 'scheduled' as const
  },
  {
    name: 'PUCT_RETAIL_PROVIDERS',
    type: 'api' as const,
    endpoint: 'https://www.puc.texas.gov/industry/electric/directories/rep',
    is_active: true,
    priority: 9,
    rate_limits: {
      requests_per_hour: 50,
      requests_per_day: 500
    },
    sync_status: 'scheduled' as const
  },
  {
    name: 'ONCOR_TERRITORY_API',
    type: 'api' as const,
    endpoint: 'https://www.oncor.com/api/territory',
    is_active: true,
    priority: 8,
    rate_limits: {
      requests_per_hour: 1000,
      requests_per_day: 10000
    },
    sync_status: 'scheduled' as const
  },
  {
    name: 'CENTERPOINT_TERRITORY_API',
    type: 'api' as const,
    endpoint: 'https://www.centerpointenergy.com/api/territory',
    is_active: true,
    priority: 8,
    rate_limits: {
      requests_per_hour: 1000,
      requests_per_day: 10000
    },
    sync_status: 'scheduled' as const
  },
  {
    name: 'USPS_ZIP_DATABASE',
    type: 'file' as const,
    endpoint: 'https://www.usps.com/business/web-tools-apis/address-information-api.htm',
    is_active: true,
    priority: 7,
    rate_limits: {
      requests_per_hour: 5000,
      requests_per_day: 50000
    },
    sync_status: 'scheduled' as const
  }
];