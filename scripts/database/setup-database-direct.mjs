#!/usr/bin/env node

/**
 * Direct Database Setup Script
 * Creates all tables and seeds data directly using Neon connection
 */

import { neon } from '@netlify/neon';
import { config } from 'dotenv';

// Load environment variables
config();

// SQL DDL for creating tables
const CREATE_TABLES_SQL = `
-- Providers table
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  puct_number VARCHAR(50),
  logo_filename VARCHAR(255),
  logo_url TEXT,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  support_phone VARCHAR(20),
  support_email VARCHAR(255),
  support_address TEXT,
  rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name),
  UNIQUE(puct_number)
);

-- TDSP table
CREATE TABLE IF NOT EXISTS tdsp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duns_number VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100),
  abbreviation VARCHAR(10),
  zone VARCHAR(20) CHECK (zone IN ('North', 'Coast', 'Central', 'South', 'Valley')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  state CHAR(2) DEFAULT 'TX',
  tdsp_duns VARCHAR(20) REFERENCES tdsp(duns_number),
  zone VARCHAR(20),
  zip_codes JSONB,
  population INTEGER,
  is_major_city BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Electricity plans table
CREATE TABLE IF NOT EXISTS electricity_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255) NOT NULL,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  tdsp_duns VARCHAR(20) REFERENCES tdsp(duns_number),
  name VARCHAR(255) NOT NULL,
  family VARCHAR(255),
  term_months INTEGER NOT NULL,
  rate_type VARCHAR(20) CHECK (rate_type IN ('fixed', 'variable', 'indexed')),
  percent_green INTEGER DEFAULT 0,
  headline TEXT,
  description TEXT,
  early_termination_fee DECIMAL(10,2) DEFAULT 0,
  is_pre_pay BOOLEAN DEFAULT false,
  is_time_of_use BOOLEAN DEFAULT false,
  requires_auto_pay BOOLEAN DEFAULT false,
  
  -- Pricing
  rate_500kwh DECIMAL(8,2) NOT NULL,
  rate_1000kwh DECIMAL(8,2) NOT NULL,
  rate_2000kwh DECIMAL(8,2) NOT NULL,
  total_500kwh DECIMAL(10,2) NOT NULL,
  total_1000kwh DECIMAL(10,2) NOT NULL,
  total_2000kwh DECIMAL(10,2) NOT NULL,
  
  -- Features
  bill_credit DECIMAL(10,2) DEFAULT 0,
  free_time_hours VARCHAR(100),
  free_time_days JSONB,
  deposit_required BOOLEAN DEFAULT false,
  deposit_amount DECIMAL(10,2),
  satisfaction_guarantee BOOLEAN DEFAULT false,
  auto_renewal BOOLEAN DEFAULT false,
  
  -- Documents
  efl_link TEXT,
  tos_link TEXT,
  yrac_link TEXT,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(external_id, tdsp_duns)
);

-- Plan cache table for API response caching
CREATE TABLE IF NOT EXISTS plan_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(500) NOT NULL UNIQUE,
  tdsp_duns VARCHAR(20) NOT NULL,
  plans_data JSONB NOT NULL,
  plan_count INTEGER NOT NULL,
  lowest_rate DECIMAL(8,2) NOT NULL,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- API logs for monitoring
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR(255) NOT NULL,
  params JSONB,
  response_status INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User search analytics
CREATE TABLE IF NOT EXISTS user_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255),
  zip_code VARCHAR(10),
  city_slug VARCHAR(255),
  filters_applied JSONB DEFAULT '[]',
  plans_viewed INTEGER DEFAULT 0,
  conversion_event VARCHAR(50),
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_plans_tdsp_duns ON electricity_plans(tdsp_duns);
CREATE INDEX IF NOT EXISTS idx_plans_provider_id ON electricity_plans(provider_id);
CREATE INDEX IF NOT EXISTS idx_plans_rate_1000kwh ON electricity_plans(rate_1000kwh);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON electricity_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_term_months ON electricity_plans(term_months);
CREATE INDEX IF NOT EXISTS idx_plans_percent_green ON electricity_plans(percent_green);

CREATE INDEX IF NOT EXISTS idx_cache_key ON plan_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON plan_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_tdsp ON plan_cache(tdsp_duns);

CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);
CREATE INDEX IF NOT EXISTS idx_cities_tdsp ON cities(tdsp_duns);

CREATE INDEX IF NOT EXISTS idx_user_searches_created ON user_searches(created_at);
CREATE INDEX IF NOT EXISTS idx_user_searches_city ON user_searches(city_slug);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON electricity_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tdsp_updated_at BEFORE UPDATE ON tdsp
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function setupDatabase() {
  console.log('🚀 Setting up ChooseMyPower Database');
  console.log('===================================\n');

  const dbUrl = process.env.NETLIFY_DATABASE_URL_UNPOOLED;
  if (!dbUrl) {
    console.error('❌ NETLIFY_DATABASE_URL_UNPOOLED not found');
    process.exit(1);
  }

  try {
    const sql = neon(dbUrl);
    
    console.log('🔄 Creating tables and indexes...');
    await sql`${CREATE_TABLES_SQL}`;
    console.log('✅ Tables created successfully\n');

    // Seed TDSP data
    console.log('🌱 Seeding TDSP data...');
    const tdspData = [
      ['007909548000', 'AEP Texas North Company', 'AEP Texas North', 'AEPTXN', 'North'],
      ['007928010000', 'AEP Texas Central Company', 'AEP Texas Central', 'AEPTXC', 'Central'],
      ['026741090000', 'CenterPoint Energy Houston Electric, LLC', 'CenterPoint Energy', 'CNP', 'Coast'],
      ['009777091000', 'Oncor Electric Delivery Company LLC', 'Oncor', 'ONCOR', 'North'],
      ['171663460000', 'Texas New Mexico Power Company', 'TNMP', 'TNMP', 'South']
    ];

    for (const [duns, name, shortName, abbrev, zone] of tdspData) {
      await sql`
        INSERT INTO tdsp (duns_number, name, short_name, abbreviation, zone)
        VALUES (${duns}, ${name}, ${shortName}, ${abbrev}, ${zone})
        ON CONFLICT (duns_number) DO UPDATE SET
          name = EXCLUDED.name,
          short_name = EXCLUDED.short_name,
          abbreviation = EXCLUDED.abbreviation,
          zone = EXCLUDED.zone,
          updated_at = NOW()
      `;
    }
    console.log(`✅ Seeded ${tdspData.length} TDSP records\n`);

    // Seed cities data
    console.log('🌱 Seeding cities data...');
    const citiesData = [
      ['Houston', 'houston', 'TX', '026741090000', 'Coast', ['77001', '77002', '77003'], 2304580, true],
      ['Dallas', 'dallas', 'TX', '009777091000', 'North', ['75201', '75202', '75203'], 1343573, true],
      ['Fort Worth', 'fort-worth', 'TX', '009777091000', 'North', ['76101', '76102', '76103'], 918915, true],
      ['Austin', 'austin', 'TX', '009777091000', 'Central', ['73301', '78701', '78702'], 965872, true],
      ['San Antonio', 'san-antonio', 'TX', '171663460000', 'South', ['78201', '78202', '78203'], 1547253, true]
    ];

    for (const [name, slug, state, tdsp, zone, zipCodes, population, isMajor] of citiesData) {
      await sql`
        INSERT INTO cities (name, slug, state, tdsp_duns, zone, zip_codes, population, is_major_city)
        VALUES (${name}, ${slug}, ${state}, ${tdsp}, ${zone}, ${JSON.stringify(zipCodes)}, ${population}, ${isMajor})
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          tdsp_duns = EXCLUDED.tdsp_duns,
          zone = EXCLUDED.zone,
          zip_codes = EXCLUDED.zip_codes,
          population = EXCLUDED.population,
          is_major_city = EXCLUDED.is_major_city,
          updated_at = NOW()
      `;
    }
    console.log(`✅ Seeded ${citiesData.length} cities\n`);

    // Seed provider data from our existing provider logos
    console.log('🌱 Seeding provider data...');
    
    // Sample providers (you can expand this with your actual data)
    const providersData = [
      ['Reliant Energy', 'Reliant Energy', 'REP10000', 'reliant.svg'],
      ['TXU Energy', 'TXU Energy Services Company LLC', 'REP10001', 'txu_energy.svg'],
      ['Gexa Energy', 'Gexa Energy LP', 'REP10002', 'gexa_energy.svg'],
      ['Direct Energy', 'Direct Energy LP', 'REP10003', 'direct_energy.svg'],
      ['Green Mountain Energy', 'Green Mountain Energy Company', 'REP10004', 'green_mountain.svg'],
      ['Discount Power', 'Discount Power, LLC', 'REP10005', 'discount_power.svg']
    ];

    for (const [name, legalName, puctNumber, logoFilename] of providersData) {
      await sql`
        INSERT INTO providers (name, legal_name, puct_number, logo_filename)
        VALUES (${name}, ${legalName}, ${puctNumber}, ${logoFilename})
        ON CONFLICT (puct_number) DO UPDATE SET
          name = EXCLUDED.name,
          legal_name = EXCLUDED.legal_name,
          logo_filename = EXCLUDED.logo_filename,
          updated_at = NOW()
      `;
    }
    console.log(`✅ Seeded ${providersData.length} providers\n`);

    // Get final statistics
    const [providers, cities, tdsp, plans, cache] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM providers`,
      sql`SELECT COUNT(*) as count FROM cities`,
      sql`SELECT COUNT(*) as count FROM tdsp`,
      sql`SELECT COUNT(*) as count FROM electricity_plans`,
      sql`SELECT COUNT(*) as count FROM plan_cache`
    ]);

    console.log('🎉 Database setup completed successfully!\n');
    console.log('📊 Final Statistics:');
    console.log(`   • Providers: ${providers[0].count}`);
    console.log(`   • Cities: ${cities[0].count}`);
    console.log(`   • TDSP Records: ${tdsp[0].count}`);
    console.log(`   • Active Plans: ${plans[0].count}`);
    console.log(`   • Cache Entries: ${cache[0].count}\n`);

    console.log('🚀 Your database is ready! Next steps:');
    console.log('• Test with: node scripts/test-database-simple.mjs');
    console.log('• Start development: npm run dev');
    console.log('• API calls will now automatically cache to database');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();