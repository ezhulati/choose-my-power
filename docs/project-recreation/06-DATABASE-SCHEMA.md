# Database Schema & Data Architecture

**Document**: Complete Database Design Specification  
**Version**: 1.0  
**Date**: 2025-09-09  

## Database Architecture Overview

The ChooseMyPower platform uses a **database-first architecture** with PostgreSQL as the primary data store, Redis for caching, and JSON files as fallback data sources. The system is designed for **100% real data** with zero mock data usage.

### **Technology Stack**
- **Primary Database**: PostgreSQL via Netlify's Neon integration
- **ORM**: Drizzle ORM 0.44.5 for type-safe queries
- **Connection Pool**: Built-in connection pooling for serverless optimization
- **Caching Layer**: Redis (ioredis) for performance optimization
- **Fallback Storage**: Generated JSON files (881 city files)
- **Migration System**: Drizzle migrations with seed data management

## Core Data Entities

### **1. Electricity Plans Table**
```sql
-- Core table for all electricity plan data
CREATE TABLE electricity_plans (
  id VARCHAR(24) PRIMARY KEY,              -- MongoDB ObjectId format (constitutional requirement)
  external_id VARCHAR(50) NOT NULL,       -- ComparePower API reference ID
  provider_id INTEGER NOT NULL REFERENCES providers(id),
  tdsp_duns VARCHAR(20) NOT NULL REFERENCES tdsp_territories(duns),
  
  -- Plan identification
  name VARCHAR(255) NOT NULL,
  family VARCHAR(100),                     -- Plan family/series name
  headline TEXT,                           -- Marketing headline
  description TEXT,                        -- Detailed description
  
  -- Contract details
  term_months INTEGER NOT NULL,            -- Contract length (6, 12, 24, 36)
  rate_type VARCHAR(20) NOT NULL CHECK (rate_type IN ('fixed', 'variable', 'indexed')),
  
  -- Pricing structure
  rate_500_kwh DECIMAL(6,4),              -- Rate at 500 kWh usage
  rate_1000_kwh DECIMAL(6,4) NOT NULL,    -- Rate at 1000 kWh usage (primary)
  rate_2000_kwh DECIMAL(6,4),             -- Rate at 2000 kWh usage
  monthly_fee DECIMAL(8,2) DEFAULT 0,     -- Fixed monthly fee
  cancellation_fee DECIMAL(8,2) DEFAULT 0,-- Early termination fee
  
  -- Plan features
  percent_green INTEGER DEFAULT 0,         -- Renewable energy percentage
  is_pre_pay BOOLEAN DEFAULT FALSE,       -- Prepaid plan flag
  is_time_of_use BOOLEAN DEFAULT FALSE,   -- Time-of-use pricing
  requires_auto_pay BOOLEAN DEFAULT FALSE, -- Auto-pay requirement
  requires_deposit BOOLEAN DEFAULT FALSE, -- Security deposit required
  
  -- Availability and status
  is_active BOOLEAN DEFAULT TRUE,
  city_slugs TEXT[],                      -- Array of city slugs where available
  zip_codes TEXT[],                       -- Array of ZIP codes served
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_plans_provider_city (provider_id, city_slugs USING GIN),
  INDEX idx_plans_rate_type (rate_type),
  INDEX idx_plans_term (term_months),
  INDEX idx_plans_active (is_active) WHERE is_active = TRUE,
  INDEX idx_plans_tdsp (tdsp_duns),
  INDEX idx_plans_green (percent_green) WHERE percent_green > 0
);
```

### **2. Providers Table**
```sql
-- Electricity provider/retail electric provider (REP) data
CREATE TABLE providers (
  id SERIAL PRIMARY KEY,
  
  -- Provider identification
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  display_name VARCHAR(255),
  puct_number VARCHAR(20) UNIQUE,          -- PUCT registration number
  
  -- Branding and contact
  logo_filename VARCHAR(255),
  logo_url TEXT,
  website_url TEXT,
  
  -- Contact information
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  support_phone VARCHAR(20),
  support_email VARCHAR(255),
  support_address TEXT,
  
  -- Ratings and metrics
  rating DECIMAL(3,2),                     -- Average customer rating (1-5)
  review_count INTEGER DEFAULT 0,
  plans_count INTEGER DEFAULT 0,          -- Denormalized count for performance
  active_plans_count INTEGER DEFAULT 0,
  
  -- Business details
  license_status VARCHAR(20) DEFAULT 'active',
  service_territories TEXT[],             -- TDSP territories served
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints and indexes
  UNIQUE(name),
  INDEX idx_providers_active (is_active) WHERE is_active = TRUE,
  INDEX idx_providers_puct (puct_number),
  INDEX idx_providers_rating (rating) WHERE rating IS NOT NULL
);
```

### **3. TDSP Territories Table**
```sql
-- Texas Distribution Service Provider (utility) territories
CREATE TABLE tdsp_territories (
  id SERIAL PRIMARY KEY,
  
  -- TDSP identification
  duns VARCHAR(20) UNIQUE NOT NULL,        -- TDSP DUNS number (official identifier)
  name VARCHAR(255) NOT NULL,
  abbreviation VARCHAR(10),
  
  -- Service area information
  service_region VARCHAR(100),             -- "North Texas", "Houston/Coast", etc.
  primary_cities TEXT[],                  -- Major cities served
  zip_code_patterns TEXT[],               -- ZIP code patterns (e.g., "752*", "770*")
  
  -- Delivery charges (varies by TDSP)
  delivery_charge_structure JSONB,        -- Complex rate structures
  base_connection_fee DECIMAL(8,2),
  
  -- Contact and regulatory
  website_url TEXT,
  customer_service_phone VARCHAR(20),
  emergency_outage_phone VARCHAR(20),
  regulatory_contact TEXT,
  
  -- Coverage statistics
  cities_served_count INTEGER DEFAULT 0,
  zip_codes_served_count INTEGER DEFAULT 0,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  UNIQUE(duns),
  INDEX idx_tdsp_active (is_active) WHERE is_active = TRUE,
  INDEX idx_tdsp_zip_patterns (zip_code_patterns USING GIN)
);

-- Insert major Texas TDSPs with correct DUNS numbers
INSERT INTO tdsp_territories (duns, name, abbreviation, service_region) VALUES
('103994067400', 'Oncor Electric Delivery', 'ONCR', 'North Texas'),
('035717006', 'CenterPoint Energy', 'CNPE', 'Houston/Coast'),
('828892001', 'AEP Texas Central', 'AEPC', 'Central Texas'),
('828892002', 'AEP Texas North', 'AEPN', 'North Central Texas'),
('175533569', 'Texas-New Mexico Power', 'TNMP', 'South/West Texas');
```

### **4. Cities Table**
```sql
-- Texas cities with electricity service data
CREATE TABLE cities (
  id SERIAL PRIMARY KEY,
  
  -- City identification
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,      -- URL-friendly identifier
  state VARCHAR(2) DEFAULT 'TX',
  county VARCHAR(100),
  
  -- Geographic data
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone VARCHAR(50) DEFAULT 'America/Chicago',
  
  -- Demographics (for market analysis)
  population INTEGER,
  median_income INTEGER,
  median_home_value INTEGER,
  
  -- Electricity market data
  tdsp_duns VARCHAR(20) REFERENCES tdsp_territories(duns),
  is_deregulated BOOLEAN DEFAULT TRUE,    -- Texas deregulated market flag
  zip_codes TEXT[],                       -- Array of ZIP codes in city
  
  -- Plan availability metrics (denormalized for performance)
  active_plans_count INTEGER DEFAULT 0,
  provider_count INTEGER DEFAULT 0,
  avg_rate_1000_kwh DECIMAL(6,4),        -- Average rate for market analysis
  lowest_rate_1000_kwh DECIMAL(6,4),     -- Lowest available rate
  
  -- SEO and content
  meta_title VARCHAR(255),
  meta_description TEXT,
  content_summary TEXT,                   -- City-specific content
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_plan_sync TIMESTAMP,
  
  -- Indexes
  UNIQUE(slug),
  INDEX idx_cities_state (state),
  INDEX idx_cities_tdsp (tdsp_duns),
  INDEX idx_cities_active (is_active) WHERE is_active = TRUE,
  INDEX idx_cities_zip_codes (zip_codes USING GIN),
  INDEX idx_cities_population (population) WHERE population IS NOT NULL
);
```

### **5. ZIP Code Mappings Table**
```sql
-- Comprehensive ZIP code to city and TDSP mapping
CREATE TABLE zip_code_mappings (
  zip_code VARCHAR(5) PRIMARY KEY,
  
  -- Geographic mapping
  city_id INTEGER NOT NULL REFERENCES cities(id),
  tdsp_duns VARCHAR(20) NOT NULL REFERENCES tdsp_territories(duns),
  
  -- Market classification
  is_deregulated BOOLEAN DEFAULT TRUE,
  market_type VARCHAR(20) DEFAULT 'residential',
  
  -- Plan availability (denormalized for performance)
  active_plans_count INTEGER DEFAULT 0,
  last_plan_count_update TIMESTAMP,
  
  -- Geographic details
  primary_city_name VARCHAR(255),         -- Denormalized for quick lookup
  county VARCHAR(100),
  state VARCHAR(2) DEFAULT 'TX',
  
  -- Validation and quality
  usps_validated BOOLEAN DEFAULT FALSE,   -- USPS address validation status
  ercot_validated BOOLEAN DEFAULT FALSE,  -- ERCOT service territory validation
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_zip_city (city_id),
  INDEX idx_zip_tdsp (tdsp_duns),
  INDEX idx_zip_deregulated (is_deregulated) WHERE is_deregulated = TRUE,
  INDEX idx_zip_plans_count (active_plans_count) WHERE active_plans_count > 0
);
```

## Supporting Tables

### **6. Plan Features Table**
```sql
-- Normalized plan features for flexible filtering
CREATE TABLE plan_features (
  id SERIAL PRIMARY KEY,
  plan_id VARCHAR(24) NOT NULL REFERENCES electricity_plans(id),
  
  -- Feature categorization
  feature_type VARCHAR(50) NOT NULL,      -- 'billing', 'contract', 'energy', 'service'
  feature_name VARCHAR(100) NOT NULL,     -- 'autopay_required', 'no_deposit', 'green_energy'
  feature_value TEXT,                     -- Optional value for parametric features
  
  -- Display information
  display_name VARCHAR(255),              -- Human-readable feature name
  display_order INTEGER DEFAULT 0,       -- Sort order for display
  is_highlighted BOOLEAN DEFAULT FALSE,   -- Highlight in UI
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_features_plan (plan_id),
  INDEX idx_features_type (feature_type),
  INDEX idx_features_name (feature_name),
  UNIQUE(plan_id, feature_type, feature_name)
);
```

### **7. Plan Pricing History**
```sql
-- Historical pricing data for analytics and trends
CREATE TABLE plan_pricing_history (
  id SERIAL PRIMARY KEY,
  plan_id VARCHAR(24) NOT NULL REFERENCES electricity_plans(id),
  
  -- Historical pricing snapshot
  rate_500_kwh DECIMAL(6,4),
  rate_1000_kwh DECIMAL(6,4),
  rate_2000_kwh DECIMAL(6,4),
  monthly_fee DECIMAL(8,2),
  
  -- Snapshot metadata
  snapshot_date DATE NOT NULL,
  data_source VARCHAR(50),                -- 'api_sync', 'manual_update', etc.
  
  -- Change tracking
  changed_fields TEXT[],                  -- Array of fields that changed
  previous_rate_1000_kwh DECIMAL(6,4),   -- For change calculations
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_pricing_history_plan_date (plan_id, snapshot_date),
  INDEX idx_pricing_history_date (snapshot_date),
  UNIQUE(plan_id, snapshot_date)
);
```

### **8. Analytics and Caching Tables**
```sql
-- User interaction analytics
CREATE TABLE user_interactions (
  id SERIAL PRIMARY KEY,
  
  -- Session and user tracking
  session_id VARCHAR(255),
  user_id VARCHAR(255),                   -- Optional authenticated user ID
  
  -- Interaction details
  event_type VARCHAR(100) NOT NULL,      -- 'zip_lookup', 'plan_view', 'comparison'
  event_data JSONB,                      -- Flexible event payload
  
  -- Context
  page_url TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  ip_address INET,
  
  -- Geographic context
  zip_code VARCHAR(5),
  city_slug VARCHAR(100),
  
  -- Timing
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for analytics
  INDEX idx_interactions_session (session_id),
  INDEX idx_interactions_event_type (event_type),
  INDEX idx_interactions_zip (zip_code),
  INDEX idx_interactions_date (created_at),
  INDEX idx_interactions_event_data (event_data USING GIN)
);

-- Cache management table
CREATE TABLE cache_entries (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  
  -- Cache categorization
  cache_type VARCHAR(50) NOT NULL,       -- 'plan_data', 'city_info', 'provider_data'
  tags TEXT[],                          -- Cache invalidation tags
  
  -- Statistics
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_cache_expires (expires_at),
  INDEX idx_cache_type (cache_type),
  INDEX idx_cache_tags (tags USING GIN),
  INDEX idx_cache_accessed (last_accessed)
);
```

## ORM Configuration & Implementation

### **Drizzle ORM Setup**
```typescript
// src/lib/database/schema.ts
import { pgTable, serial, varchar, text, integer, decimal, boolean, timestamp, jsonb, index, unique } from 'drizzle-orm/pg-core';

// Electricity Plans schema
export const electricityPlans = pgTable('electricity_plans', {
  id: varchar('id', { length: 24 }).primaryKey(), // MongoDB ObjectId format
  externalId: varchar('external_id', { length: 50 }).notNull(),
  providerId: integer('provider_id').notNull().references(() => providers.id),
  tdspDuns: varchar('tdsp_duns', { length: 20 }).notNull().references(() => tdspTerritories.duns),
  
  // Plan details
  name: varchar('name', { length: 255 }).notNull(),
  family: varchar('family', { length: 100 }),
  headline: text('headline'),
  description: text('description'),
  
  // Contract and pricing
  termMonths: integer('term_months').notNull(),
  rateType: varchar('rate_type', { length: 20 }).notNull(),
  rate500kWh: decimal('rate_500_kwh', { precision: 6, scale: 4 }),
  rate1000kWh: decimal('rate_1000_kwh', { precision: 6, scale: 4 }).notNull(),
  rate2000kWh: decimal('rate_2000_kwh', { precision: 6, scale: 4 }),
  monthlyFee: decimal('monthly_fee', { precision: 8, scale: 2 }).default('0'),
  cancellationFee: decimal('cancellation_fee', { precision: 8, scale: 2 }).default('0'),
  
  // Features
  percentGreen: integer('percent_green').default(0),
  isPrePay: boolean('is_pre_pay').default(false),
  isTimeOfUse: boolean('is_time_of_use').default(false),
  requiresAutoPay: boolean('requires_auto_pay').default(false),
  requiresDeposit: boolean('requires_deposit').default(false),
  
  // Availability
  isActive: boolean('is_active').default(true),
  citySlugs: text('city_slugs').array(),
  zipCodes: text('zip_codes').array(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastSyncedAt: timestamp('last_synced_at').defaultNow(),
}, (table) => {
  return {
    providerCityIdx: index('idx_plans_provider_city').on(table.providerId),
    rateTypeIdx: index('idx_plans_rate_type').on(table.rateType),
    termIdx: index('idx_plans_term').on(table.termMonths),
    activeIdx: index('idx_plans_active').on(table.isActive),
  };
});

// Providers schema
export const providers = pgTable('providers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  legalName: varchar('legal_name', { length: 255 }),
  displayName: varchar('display_name', { length: 255 }),
  puctNumber: varchar('puct_number', { length: 20 }),
  logoFilename: varchar('logo_filename', { length: 255 }),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  contactPhone: varchar('contact_phone', { length: 20 }),
  supportPhone: varchar('support_phone', { length: 20 }),
  rating: decimal('rating', { precision: 3, scale: 2 }),
  reviewCount: integer('review_count').default(0),
  plansCount: integer('plans_count').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    nameUnique: unique().on(table.name),
    puctIdx: index('idx_providers_puct').on(table.puctNumber),
    activeIdx: index('idx_providers_active').on(table.isActive),
  };
});

// Database connection with connection pooling
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.NETLIFY_DATABASE_URL!, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 10,                                  // Connection pool size
  idle_timeout: 20,                        // Idle timeout in seconds
  connect_timeout: 60,                     // Connection timeout in seconds
  prepare: false,                          // Disable prepared statements for serverless
});

export const db = drizzle(client, { 
  schema: {
    electricityPlans,
    providers,
    tdspTerritories,
    cities,
    zipCodeMappings,
  }
});
```

### **Database Seeding Strategy**
```typescript
// src/lib/database/seeds/seed-runner.ts
import { db } from '../connection';
import { seedTdspData } from './0002_tdsp_seed';
import { seedCityData } from './0003_city_seed';
import { seedProviderData } from './0004_provider_seed';
import { seedPlanData } from './0005_plan_seed';

export async function runAllSeeds() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Seed in dependency order
    await seedTdspData(db);           // 1. TDSP territories (no dependencies)
    await seedCityData(db);           // 2. Cities (depends on TDSP)
    await seedProviderData(db);       // 3. Providers (no dependencies)
    await seedPlanData(db);           // 4. Plans (depends on providers, TDSP, cities)
    
    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Seed TDSP data
export async function seedTdspData(db: DrizzleDB) {
  const tdspData = [
    {
      duns: '007738114',
      name: 'Oncor Electric Delivery',
      abbreviation: 'ONCO',
      serviceRegion: 'North Texas',
      primaryCities: ['Dallas', 'Plano', 'McKinney', 'Garland', 'Irving'],
      zipCodePatterns: ['750*', '751*', '752*', '753*'],
    },
    {
      duns: '035717006', 
      name: 'CenterPoint Energy',
      abbreviation: 'CNPE',
      serviceRegion: 'Houston/Coast',
      primaryCities: ['Houston', 'Sugar Land', 'Katy', 'Pearland'],
      zipCodePatterns: ['770*', '771*', '772*', '773*', '774*', '775*'],
    }
    // Additional TDSP data...
  ];
  
  for (const tdsp of tdspData) {
    await db.insert(tdspTerritories).values(tdsp).onConflictDoUpdate({
      target: tdspTerritories.duns,
      set: {
        name: tdsp.name,
        serviceRegion: tdsp.serviceRegion,
        primaryCities: tdsp.primaryCities,
      }
    });
  }
}
```

## Data Generation & Synchronization

### **881-City Data Generation Pipeline**
```typescript
// scripts/build-data-smart.mjs
class DatabaseDataGenerator {
  constructor() {
    this.db = db;
    this.batchSize = parseInt(process.env.BATCH_SIZE || '10');
    this.batchDelay = parseInt(process.env.BATCH_DELAY_MS || '2000');
  }
  
  async generateAllCityData() {
    const cities = await this.loadTexasCities(); // 881 cities
    const batches = this.createBatches(cities, this.batchSize);
    
    for (const batch of batches) {
      await this.processCityBatch(batch);
      await this.delay(this.batchDelay); // Rate limiting
    }
  }
  
  async processCityBatch(cities: City[]) {
    const transaction = await this.db.transaction();
    
    try {
      for (const city of cities) {
        // Fetch plan data from ComparePower API
        const planData = await this.fetchCityPlanData(city.slug);
        
        // Insert/update city record
        await transaction.insert(citiesTable).values({
          name: city.name,
          slug: city.slug,
          tdspDuns: city.tdspDuns,
          zipCodes: city.zipCodes,
          population: city.population,
        }).onConflictDoUpdate({
          target: citiesTable.slug,
          set: { updatedAt: new Date() }
        });
        
        // Insert/update plan records
        for (const plan of planData) {
          await transaction.insert(electricityPlans).values({
            id: this.generateMongoObjectId(), // Dynamic ID generation
            externalId: plan.apiId,
            providerId: await this.getOrCreateProvider(plan.provider),
            name: plan.name,
            rate1000kWh: plan.pricing.rate1000kWh,
            termMonths: plan.contract.lengthMonths,
            citySlugs: [city.slug],
          }).onConflictDoNothing();
        }
      }
      
      await transaction.commit();
      console.log(`✅ Processed batch of ${cities.length} cities`);
      
    } catch (error) {
      await transaction.rollback();
      console.error(`❌ Batch processing failed:`, error);
      throw error;
    }
  }
  
  generateMongoObjectId(): string {
    // Generate MongoDB-compatible ObjectId
    const timestamp = Math.floor(Date.now() / 1000).toString(16);
    const random = Math.random().toString(16).substr(2, 16);
    return timestamp + random.padEnd(16, '0').substr(0, 16);
  }
}
```

## Performance Optimization

### **Database Performance Configuration**
```sql
-- Performance optimization queries
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM electricity_plans 
WHERE provider_id = $1 AND 'dallas' = ANY(city_slugs)
AND is_active = true
ORDER BY rate_1000_kwh ASC;

-- Create covering indexes for common queries
CREATE INDEX CONCURRENTLY idx_plans_city_lookup 
ON electricity_plans (provider_id, is_active, rate_1000_kwh)
WHERE is_active = true;

-- Partial indexes for active records only
CREATE INDEX CONCURRENTLY idx_plans_active_filtered
ON electricity_plans (rate_type, term_months, rate_1000_kwh)
WHERE is_active = true;

-- GIN indexes for array searches
CREATE INDEX CONCURRENTLY idx_plans_city_slugs_gin
ON electricity_plans USING GIN (city_slugs);

-- Materialized views for analytics
CREATE MATERIALIZED VIEW city_plan_summary AS
SELECT 
  c.slug as city_slug,
  c.name as city_name,
  t.name as tdsp_name,
  COUNT(p.id) as total_plans,
  COUNT(DISTINCT p.provider_id) as provider_count,
  AVG(p.rate_1000_kwh) as avg_rate,
  MIN(p.rate_1000_kwh) as min_rate,
  MAX(p.rate_1000_kwh) as max_rate
FROM cities c
JOIN tdsp_territories t ON c.tdsp_duns = t.duns
LEFT JOIN electricity_plans p ON c.slug = ANY(p.city_slugs)
WHERE c.is_active = true AND (p.is_active = true OR p.is_active IS NULL)
GROUP BY c.slug, c.name, t.name;

-- Refresh materialized view daily
CREATE OR REPLACE FUNCTION refresh_city_plan_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY city_plan_summary;
END;
$$ LANGUAGE plpgsql;
```

### **Connection Pool Management**
```typescript
// src/lib/database/connection-pool.ts
import { Pool } from 'postgres';

export class DatabaseConnectionManager {
  private pool: Pool;
  private healthCheckInterval: NodeJS.Timeout;
  
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.NETLIFY_DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
      max: 10,                    // Maximum pool size
      idle_timeout: 30_000,       // 30 seconds
      connect_timeout: 60_000,    // 60 seconds
      acquire_timeout: 60_000,    // 60 seconds to acquire connection
      prepare: false,             // Disable prepared statements for serverless
    });
    
    this.startHealthMonitoring();
  }
  
  async getConnection() {
    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      console.error('Failed to acquire database connection:', error);
      throw new Error('Database connection unavailable');
    }
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.getConnection();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch {
      return false;
    }
  }
  
  getPoolStats() {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingQueries: this.pool.waitingCount,
    };
  }
  
  private startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.healthCheck();
      if (!isHealthy) {
        console.warn('Database health check failed');
        // Implement alerting or recovery logic
      }
    }, 30_000); // Check every 30 seconds
  }
}
```

This comprehensive database schema provides the foundation for a robust, scalable electricity comparison platform with proper indexing, relationships, and performance optimization for handling 881+ Texas cities and thousands of electricity plans.