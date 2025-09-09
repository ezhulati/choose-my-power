-- ZIP Navigation System Database Migration
-- Feature: 010-expand-zip-code
-- Constitutional compliance: Real data architecture, no hardcoded values
-- Performance targets: <500ms ZIP validation queries

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ZIP code mappings table with comprehensive indexing
CREATE TABLE IF NOT EXISTS zip_mappings (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    zip_code VARCHAR(5) NOT NULL,
    zip_plus4_pattern VARCHAR(10),
    city_name VARCHAR(100) NOT NULL,
    city_slug VARCHAR(100) NOT NULL,
    county_name VARCHAR(100) NOT NULL,
    tdsp_territory VARCHAR(100) NOT NULL,
    tdsp_duns VARCHAR(20) NOT NULL,
    is_deregulated BOOLEAN NOT NULL DEFAULT true,
    market_zone VARCHAR(20) NOT NULL CHECK (market_zone IN ('North', 'Central', 'Coast', 'South', 'West')),
    priority DECIMAL(3,1) NOT NULL DEFAULT 1.0 CHECK (priority >= 0.1 AND priority <= 3.0),
    last_validated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_source VARCHAR(10) NOT NULL DEFAULT 'MANUAL' CHECK (data_source IN ('USPS', 'TDU', 'MANUAL', 'PUCT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create deregulated market areas table
CREATE TABLE IF NOT EXISTS deregulated_market_areas (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    area_id VARCHAR(100) NOT NULL UNIQUE,
    area_name VARCHAR(150) NOT NULL,
    primary_city VARCHAR(100) NOT NULL,
    primary_city_slug VARCHAR(100) NOT NULL,
    coverage_zip_codes TEXT NOT NULL, -- JSON array
    tdsp_providers TEXT NOT NULL, -- JSON array
    market_zone VARCHAR(20) NOT NULL CHECK (market_zone IN ('North', 'Central', 'Coast', 'South', 'West')),
    regulatory_status VARCHAR(20) NOT NULL DEFAULT 'DEREGULATED' CHECK (regulatory_status IN ('DEREGULATED', 'MUNICIPAL', 'COOPERATIVE')),
    plan_availability BOOLEAN NOT NULL DEFAULT true,
    priority_level INTEGER NOT NULL DEFAULT 2 CHECK (priority_level IN (1, 2, 3)),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ZIP coverage gaps tracking table
CREATE TABLE IF NOT EXISTS zip_coverage_gaps (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    zip_code VARCHAR(5) NOT NULL UNIQUE,
    request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count > 0),
    first_requested TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_requested TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    investigation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (investigation_status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'NOT_APPLICABLE')),
    resolution TEXT,
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create TDU service territories table
CREATE TABLE IF NOT EXISTS tdu_service_territories (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    duns VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL,
    service_zip_codes TEXT NOT NULL, -- JSON array
    market_zones TEXT NOT NULL, -- JSON array
    is_deregulated BOOLEAN NOT NULL DEFAULT true,
    contact_phone VARCHAR(20),
    contact_website VARCHAR(200),
    service_areas TEXT, -- JSON array
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance-critical indexes for ZIP validation (<500ms requirement)
CREATE INDEX IF NOT EXISTS zip_mappings_zip_code_idx ON zip_mappings(zip_code);
CREATE INDEX IF NOT EXISTS zip_mappings_city_slug_idx ON zip_mappings(city_slug);
CREATE INDEX IF NOT EXISTS zip_mappings_tdsp_duns_idx ON zip_mappings(tdsp_duns);
CREATE INDEX IF NOT EXISTS zip_mappings_market_zone_idx ON zip_mappings(market_zone);
CREATE INDEX IF NOT EXISTS zip_mappings_is_deregulated_idx ON zip_mappings(is_deregulated);
CREATE UNIQUE INDEX IF NOT EXISTS zip_mappings_unique_zip_city_idx ON zip_mappings(zip_code, city_slug);

-- Market areas indexes
CREATE INDEX IF NOT EXISTS market_areas_area_id_idx ON deregulated_market_areas(area_id);
CREATE INDEX IF NOT EXISTS market_areas_primary_city_slug_idx ON deregulated_market_areas(primary_city_slug);
CREATE INDEX IF NOT EXISTS market_areas_market_zone_idx ON deregulated_market_areas(market_zone);
CREATE INDEX IF NOT EXISTS market_areas_priority_level_idx ON deregulated_market_areas(priority_level);
CREATE INDEX IF NOT EXISTS market_areas_regulatory_status_idx ON deregulated_market_areas(regulatory_status);
CREATE INDEX IF NOT EXISTS market_areas_plan_availability_idx ON deregulated_market_areas(plan_availability);

-- Coverage gaps indexes  
CREATE INDEX IF NOT EXISTS zip_coverage_gaps_zip_code_idx ON zip_coverage_gaps(zip_code);
CREATE INDEX IF NOT EXISTS zip_coverage_gaps_priority_idx ON zip_coverage_gaps(priority);
CREATE INDEX IF NOT EXISTS zip_coverage_gaps_investigation_status_idx ON zip_coverage_gaps(investigation_status);
CREATE INDEX IF NOT EXISTS zip_coverage_gaps_request_count_idx ON zip_coverage_gaps(request_count);

-- TDU territories indexes
CREATE INDEX IF NOT EXISTS tdu_service_territories_duns_idx ON tdu_service_territories(duns);
CREATE INDEX IF NOT EXISTS tdu_service_territories_name_idx ON tdu_service_territories(name);
CREATE INDEX IF NOT EXISTS tdu_service_territories_abbreviation_idx ON tdu_service_territories(abbreviation);
CREATE INDEX IF NOT EXISTS tdu_service_territories_is_deregulated_idx ON tdu_service_territories(is_deregulated);

-- Function to update updated_at timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER zip_mappings_update_updated_at 
    BEFORE UPDATE ON zip_mappings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER market_areas_update_updated_at 
    BEFORE UPDATE ON deregulated_market_areas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER coverage_gaps_update_updated_at 
    BEFORE UPDATE ON zip_coverage_gaps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tdu_territories_update_updated_at 
    BEFORE UPDATE ON tdu_service_territories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries to optimize performance
CREATE OR REPLACE VIEW active_zip_mappings AS
SELECT 
    zip_code,
    city_name,
    city_slug,
    tdsp_territory,
    tdsp_duns,
    is_deregulated,
    market_zone,
    priority
FROM zip_mappings 
WHERE is_deregulated = true 
ORDER BY priority DESC, city_name;

CREATE OR REPLACE VIEW deregulated_cities_summary AS
SELECT 
    dma.primary_city,
    dma.primary_city_slug,
    dma.market_zone,
    COUNT(zm.zip_code) as zip_code_count,
    dma.priority_level,
    dma.plan_availability
FROM deregulated_market_areas dma
LEFT JOIN zip_mappings zm ON zm.city_slug = dma.primary_city_slug
WHERE dma.regulatory_status = 'DEREGULATED' AND dma.plan_availability = true
GROUP BY dma.id, dma.primary_city, dma.primary_city_slug, dma.market_zone, dma.priority_level, dma.plan_availability
ORDER BY dma.priority_level ASC, zip_code_count DESC;

-- Analytics table for tracking ZIP navigation performance
CREATE TABLE IF NOT EXISTS zip_navigation_analytics (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('zip_lookup_success', 'zip_lookup_failed', 'zip_routing_redirect', 'zip_coverage_gap')),
    zip_code VARCHAR(5) NOT NULL,
    city_resolved VARCHAR(100),
    error_code VARCHAR(30),
    response_time INTEGER NOT NULL CHECK (response_time > 0), -- milliseconds
    user_agent TEXT,
    referrer TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS zip_analytics_event_type_idx ON zip_navigation_analytics(event_type);
CREATE INDEX IF NOT EXISTS zip_analytics_zip_code_idx ON zip_navigation_analytics(zip_code);
CREATE INDEX IF NOT EXISTS zip_analytics_timestamp_idx ON zip_navigation_analytics(timestamp);
CREATE INDEX IF NOT EXISTS zip_analytics_response_time_idx ON zip_navigation_analytics(response_time);

-- Insert comment for migration tracking
COMMENT ON TABLE zip_mappings IS 'ZIP code to city mappings for Texas deregulated electricity markets - Feature 010-expand-zip-code';
COMMENT ON TABLE deregulated_market_areas IS 'Deregulated electricity market area definitions - Constitutional compliance real data';
COMMENT ON TABLE zip_coverage_gaps IS 'Tracking for ZIP codes not yet covered - Continuous improvement';
COMMENT ON TABLE tdu_service_territories IS 'TDU territory mappings for precise service area determination';
COMMENT ON TABLE zip_navigation_analytics IS 'Performance and usage analytics for ZIP navigation system';