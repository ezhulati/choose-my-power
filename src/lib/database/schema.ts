/**
 * Database Schema for ChooseMyPower Electricity Data
 * Defines tables for plans, providers, pricing, and caching
 */

export interface Provider {
  id: string;
  name: string;
  legal_name: string;
  puct_number: string;
  logo_filename?: string;
  logo_url?: string;
  contact_phone?: string;
  contact_email?: string;
  support_phone?: string;
  support_email?: string;
  support_address?: string;
  rating?: number;
  review_count?: number;
  created_at: Date;
  updated_at: Date;
}

export interface ElectricityPlan {
  id: string;
  external_id: string; // ComparePower API ID
  provider_id: string;
  tdsp_duns: string;
  name: string;
  family: string;
  term_months: number;
  rate_type: 'fixed' | 'variable' | 'indexed';
  percent_green: number;
  headline?: string;
  description?: string;
  early_termination_fee: number;
  is_pre_pay: boolean;
  is_time_of_use: boolean;
  requires_auto_pay: boolean;
  
  // Pricing data
  rate_500kwh: number; // cents per kWh
  rate_1000kwh: number;
  rate_2000kwh: number;
  total_500kwh: number; // total monthly cost
  total_1000kwh: number;
  total_2000kwh: number;
  
  // Features
  bill_credit: number;
  free_time_hours?: string;
  free_time_days?: string[];
  deposit_required: boolean;
  deposit_amount?: number;
  satisfaction_guarantee: boolean;
  auto_renewal: boolean;
  
  // Document links
  efl_link?: string;
  tos_link?: string;
  yrac_link?: string;
  
  // Metadata
  is_active: boolean;
  last_scraped_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TDSP {
  id: string;
  duns_number: string;
  name: string;
  short_name: string;
  abbreviation: string;
  zone: 'North' | 'Coast' | 'Central' | 'South' | 'Valley';
  created_at: Date;
  updated_at: Date;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  state: string;
  tdsp_duns: string;
  zone: string;
  zip_codes: string[];
  population?: number;
  is_major_city: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PlanCache {
  id: string;
  cache_key: string; // JSON.stringify of API params
  tdsp_duns: string;
  plans_data: ElectricityPlan[]; // JSON data
  plan_count: number;
  lowest_rate: number;
  cached_at: Date;
  expires_at: Date;
  created_at: Date;
}

export interface ApiLog {
  id: string;
  endpoint: string;
  params: Record<string, any>;
  response_status: number;
  response_time_ms: number;
  error_message?: string;
  created_at: Date;
}

export interface UserSearch {
  id: string;
  session_id?: string;
  zip_code?: string;
  city_slug?: string;
  filters_applied: string[];
  plans_viewed: number;
  conversion_event?: 'clicked_enroll' | 'viewed_details' | 'shared';
  user_agent?: string;
  ip_address?: string;
  created_at: Date;
}

/**
 * SQL DDL for creating tables
 */
export const CREATE_TABLES_SQL = `
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