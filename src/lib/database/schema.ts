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
  
  // Faceted search support
  facets?: Record<string, any>; // JSON field for facet data
  search_vector?: string; // Full-text search vector
  city_slug?: string; // For faceted navigation
  
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

export interface Lead {
  id: string;
  zip_code: string;
  city_slug?: string;
  monthly_usage?: number;
  current_rate?: number;
  preferred_contract_length?: number;
  green_energy_preference: boolean;
  contact_email?: string;
  contact_phone?: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  status: 'new' | 'qualified' | 'contacted' | 'converted' | 'unqualified';
  score?: number; // Lead scoring 0-100
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PlanComparison {
  id: string;
  session_id: string;
  plan_ids: string[];
  city_slug?: string;
  filters_applied: Record<string, any>;
  comparison_duration_seconds?: number;
  selected_plan_id?: string;
  created_at: Date;
}

export interface SearchHistory {
  id: string;
  session_id?: string;
  search_query: string;
  search_type: 'city' | 'provider' | 'plan_features' | 'zip_code';
  results_count: number;
  clicked_result?: string;
  no_results: boolean;
  created_at: Date;
}

export interface ProviderCache {
  id: string;
  provider_name: string;
  logo_url?: string;
  website_url?: string;
  customer_service_phone?: string;
  service_areas: string[]; // Array of city slugs
  specialties: string[]; // Array like ['green_energy', 'business_plans']
  rating?: number;
  total_plans: number;
  updated_at: Date;
  created_at: Date;
}

export interface CityAnalytics {
  id: string;
  city_slug: string;
  tdsp_duns: string;
  average_rate: number;
  lowest_rate: number;
  highest_rate: number;
  total_plans: number;
  green_plans: number;
  fixed_rate_plans: number;
  variable_rate_plans: number;
  last_updated: Date;
  monthly_trend?: number; // Rate change from previous month
  created_at: Date;
}

export interface ApiMetrics {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  cache_hit: boolean;
  error_type?: string;
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
  
  -- Faceted search support
  facets JSONB DEFAULT '{}', -- Facet metadata for fast filtering
  search_vector tsvector, -- Full-text search vector
  city_slug VARCHAR(255), -- For faceted navigation
  
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

-- Customer leads and inquiries
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code VARCHAR(10) NOT NULL,
  city_slug VARCHAR(255),
  monthly_usage INTEGER,
  current_rate DECIMAL(8,4),
  preferred_contract_length INTEGER,
  green_energy_preference BOOLEAN DEFAULT false,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  utm_source VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_content VARCHAR(100),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'qualified', 'contacted', 'converted', 'unqualified')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Plan comparison sessions
CREATE TABLE IF NOT EXISTS plan_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  plan_ids JSONB NOT NULL, -- Array of plan IDs
  city_slug VARCHAR(255),
  filters_applied JSONB DEFAULT '{}',
  comparison_duration_seconds INTEGER,
  selected_plan_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User search history
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255),
  search_query VARCHAR(255) NOT NULL,
  search_type VARCHAR(50) NOT NULL CHECK (search_type IN ('city', 'provider', 'plan_features', 'zip_code')),
  results_count INTEGER NOT NULL DEFAULT 0,
  clicked_result VARCHAR(255),
  no_results BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Provider information cache
CREATE TABLE IF NOT EXISTS provider_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name VARCHAR(255) UNIQUE NOT NULL,
  logo_url VARCHAR(500),
  website_url VARCHAR(500),
  customer_service_phone VARCHAR(20),
  service_areas JSONB DEFAULT '[]', -- Array of city slugs
  specialties JSONB DEFAULT '[]', -- Array like ['green_energy', 'business_plans']
  rating DECIMAL(3,2),
  total_plans INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- City market analytics
CREATE TABLE IF NOT EXISTS city_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug VARCHAR(255) UNIQUE NOT NULL,
  tdsp_duns VARCHAR(20) NOT NULL,
  average_rate DECIMAL(8,4) NOT NULL,
  lowest_rate DECIMAL(8,4) NOT NULL,
  highest_rate DECIMAL(8,4) NOT NULL,
  total_plans INTEGER NOT NULL DEFAULT 0,
  green_plans INTEGER DEFAULT 0,
  fixed_rate_plans INTEGER DEFAULT 0,
  variable_rate_plans INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  monthly_trend DECIMAL(8,4), -- Rate change from previous month
  created_at TIMESTAMP DEFAULT NOW()
);

-- API performance metrics
CREATE TABLE IF NOT EXISTS api_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  cache_hit BOOLEAN DEFAULT false,
  error_type VARCHAR(100),
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

-- Faceted search indexes for performance
CREATE INDEX IF NOT EXISTS idx_plans_facets_gin ON electricity_plans USING gin(facets);
CREATE INDEX IF NOT EXISTS idx_plans_search_vector ON electricity_plans USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_plans_city_slug ON electricity_plans(city_slug);
CREATE INDEX IF NOT EXISTS idx_plans_city_rate_type ON electricity_plans(city_slug, rate_type);
CREATE INDEX IF NOT EXISTS idx_plans_contract_green ON electricity_plans(term_months, percent_green);
CREATE INDEX IF NOT EXISTS idx_plans_rate_green ON electricity_plans(rate_type, percent_green);
CREATE INDEX IF NOT EXISTS idx_plans_prepay_deposit ON electricity_plans(is_pre_pay, deposit_required);
CREATE INDEX IF NOT EXISTS idx_plans_active_city ON electricity_plans(is_active, city_slug);

CREATE INDEX IF NOT EXISTS idx_cache_key ON plan_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON plan_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_tdsp ON plan_cache(tdsp_duns);

CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);
CREATE INDEX IF NOT EXISTS idx_cities_tdsp ON cities(tdsp_duns);

CREATE INDEX IF NOT EXISTS idx_user_searches_created ON user_searches(created_at);
CREATE INDEX IF NOT EXISTS idx_user_searches_city ON user_searches(city_slug);

-- Indexes for leads table
CREATE INDEX IF NOT EXISTS idx_leads_zip_code ON leads(zip_code);
CREATE INDEX IF NOT EXISTS idx_leads_city_slug ON leads(city_slug);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON leads(utm_source);

-- Indexes for plan comparisons
CREATE INDEX IF NOT EXISTS idx_plan_comparisons_session ON plan_comparisons(session_id);
CREATE INDEX IF NOT EXISTS idx_plan_comparisons_city ON plan_comparisons(city_slug);
CREATE INDEX IF NOT EXISTS idx_plan_comparisons_created ON plan_comparisons(created_at);

-- Indexes for search history
CREATE INDEX IF NOT EXISTS idx_search_history_session ON search_history(session_id);
CREATE INDEX IF NOT EXISTS idx_search_history_type ON search_history(search_type);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(search_query);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at);
CREATE INDEX IF NOT EXISTS idx_search_history_no_results ON search_history(no_results);

-- Indexes for provider cache
CREATE INDEX IF NOT EXISTS idx_provider_cache_name ON provider_cache(provider_name);
CREATE INDEX IF NOT EXISTS idx_provider_cache_updated ON provider_cache(updated_at);
CREATE INDEX IF NOT EXISTS idx_provider_cache_rating ON provider_cache(rating);

-- Indexes for city analytics
CREATE INDEX IF NOT EXISTS idx_city_analytics_slug ON city_analytics(city_slug);
CREATE INDEX IF NOT EXISTS idx_city_analytics_tdsp ON city_analytics(tdsp_duns);
CREATE INDEX IF NOT EXISTS idx_city_analytics_updated ON city_analytics(last_updated);
CREATE INDEX IF NOT EXISTS idx_city_analytics_avg_rate ON city_analytics(average_rate);
CREATE INDEX IF NOT EXISTS idx_city_analytics_lowest_rate ON city_analytics(lowest_rate);

-- Indexes for API metrics
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint ON api_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_metrics_created ON api_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_api_metrics_status ON api_metrics(status_code);
CREATE INDEX IF NOT EXISTS idx_api_metrics_response_time ON api_metrics(response_time_ms);
CREATE INDEX IF NOT EXISTS idx_api_metrics_cache_hit ON api_metrics(cache_hit);

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

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_cache_updated_at BEFORE UPDATE ON provider_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;