-- Migration: ZIP Coverage System Tables
-- Created: 2025-01-09
-- Description: Creates all tables for ZIP code coverage system with proper indexes and constraints

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Data Sources Table
CREATE TABLE IF NOT EXISTS "data_sources" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"type" varchar(30) NOT NULL,
	"base_url" varchar(500),
	"api_version" varchar(20),
	"authentication" jsonb DEFAULT '{}' NOT NULL,
	"configuration" jsonb DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 50 NOT NULL,
	"reliability" integer DEFAULT 90 NOT NULL,
	"average_response_time" integer,
	"last_success" timestamp,
	"last_failure" timestamp,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- 2. TDSP Information Table
CREATE TABLE IF NOT EXISTS "tdsp_info" (
	"duns" varchar(13) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"zone" varchar(50) NOT NULL,
	"service_area" jsonb DEFAULT '[]' NOT NULL,
	"api_endpoint" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"contact_info" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- 3. City Territories Table
CREATE TABLE IF NOT EXISTS "city_territories" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"city_slug" varchar(100) NOT NULL,
	"city_display_name" varchar(200) NOT NULL,
	"primary_tdsp" varchar(13) NOT NULL,
	"service_type" varchar(20) NOT NULL,
	"zip_codes" jsonb DEFAULT '[]' NOT NULL,
	"plan_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"coordinates" jsonb DEFAULT '{}' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- 4. ZIP Code Mappings Table
CREATE TABLE IF NOT EXISTS "zip_code_mappings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"zip_code" varchar(5) NOT NULL,
	"city_slug" varchar(100) NOT NULL,
	"city_display_name" varchar(200) NOT NULL,
	"tdsp_duns" varchar(13) NOT NULL,
	"tdsp_name" varchar(200) NOT NULL,
	"service_type" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_validated" timestamp DEFAULT now() NOT NULL,
	"data_source" varchar(100) NOT NULL,
	"confidence" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- 5. Validation Logs Table
CREATE TABLE IF NOT EXISTS "validation_logs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"zip_code" varchar(5) NOT NULL,
	"validation_type" varchar(30) NOT NULL,
	"request_id" varchar(100),
	"data_source_id" uuid NOT NULL,
	"data_source_slug" varchar(50) NOT NULL,
	"is_valid" boolean NOT NULL,
	"confidence" integer NOT NULL,
	"city_slug" varchar(100),
	"city_display_name" varchar(200),
	"tdsp_duns" varchar(13),
	"tdsp_name" varchar(200),
	"service_type" varchar(20),
	"request_payload" jsonb DEFAULT '{}' NOT NULL,
	"response_data" jsonb DEFAULT '{}' NOT NULL,
	"processing_time" integer NOT NULL,
	"cache_hit" boolean DEFAULT false NOT NULL,
	"error_code" varchar(50),
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"circuit_breaker_tripped" boolean DEFAULT false NOT NULL,
	"client_ip" varchar(45),
	"user_agent" text,
	"session_id" varchar(100),
	"user_id" varchar(100),
	"validated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- INDEXES

-- Data Sources Indexes
CREATE INDEX IF NOT EXISTS "idx_data_sources_name" ON "data_sources" ("name");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_data_sources_slug" ON "data_sources" ("slug");
CREATE INDEX IF NOT EXISTS "idx_data_sources_type" ON "data_sources" ("type");
CREATE INDEX IF NOT EXISTS "idx_data_sources_is_active" ON "data_sources" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_data_sources_priority" ON "data_sources" ("priority");
CREATE INDEX IF NOT EXISTS "idx_data_sources_reliability" ON "data_sources" ("reliability");
CREATE INDEX IF NOT EXISTS "idx_data_sources_last_success" ON "data_sources" ("last_success");
CREATE INDEX IF NOT EXISTS "idx_data_sources_consecutive_failures" ON "data_sources" ("consecutive_failures");
CREATE INDEX IF NOT EXISTS "idx_data_sources_active_reliability" ON "data_sources" ("is_active", "reliability");
CREATE INDEX IF NOT EXISTS "idx_data_sources_type_priority" ON "data_sources" ("type", "priority");

-- TDSP Info Indexes
CREATE INDEX IF NOT EXISTS "idx_tdsp_info_name" ON "tdsp_info" ("name");
CREATE INDEX IF NOT EXISTS "idx_tdsp_info_zone" ON "tdsp_info" ("zone");
CREATE INDEX IF NOT EXISTS "idx_tdsp_info_is_active" ON "tdsp_info" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_tdsp_info_last_updated" ON "tdsp_info" ("last_updated");

-- City Territories Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "idx_city_territories_city_slug" ON "city_territories" ("city_slug");
CREATE INDEX IF NOT EXISTS "idx_city_territories_primary_tdsp" ON "city_territories" ("primary_tdsp");
CREATE INDEX IF NOT EXISTS "idx_city_territories_service_type" ON "city_territories" ("service_type");
CREATE INDEX IF NOT EXISTS "idx_city_territories_is_active" ON "city_territories" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_city_territories_last_updated" ON "city_territories" ("last_updated");
CREATE INDEX IF NOT EXISTS "idx_city_territories_plan_count" ON "city_territories" ("plan_count");
CREATE INDEX IF NOT EXISTS "idx_city_territories_active_service" ON "city_territories" ("service_type", "is_active");
CREATE INDEX IF NOT EXISTS "idx_city_territories_tdsp_active" ON "city_territories" ("primary_tdsp", "is_active");

-- ZIP Code Mappings Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "idx_zip_code_mappings_zip_code" ON "zip_code_mappings" ("zip_code");
CREATE INDEX IF NOT EXISTS "idx_zip_code_mappings_city_slug" ON "zip_code_mappings" ("city_slug");
CREATE INDEX IF NOT EXISTS "idx_zip_code_mappings_tdsp_duns" ON "zip_code_mappings" ("tdsp_duns");
CREATE INDEX IF NOT EXISTS "idx_zip_code_mappings_service_type" ON "zip_code_mappings" ("service_type");
CREATE INDEX IF NOT EXISTS "idx_zip_code_mappings_is_active" ON "zip_code_mappings" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_zip_code_mappings_last_validated" ON "zip_code_mappings" ("last_validated");
CREATE INDEX IF NOT EXISTS "idx_zip_code_mappings_data_source" ON "zip_code_mappings" ("data_source");
CREATE INDEX IF NOT EXISTS "idx_zip_code_mappings_confidence" ON "zip_code_mappings" ("confidence");
CREATE INDEX IF NOT EXISTS "idx_zip_code_mappings_active_service" ON "zip_code_mappings" ("service_type", "is_active");
CREATE INDEX IF NOT EXISTS "idx_zip_code_mappings_city_active" ON "zip_code_mappings" ("city_slug", "is_active");
CREATE INDEX IF NOT EXISTS "idx_zip_code_mappings_tdsp_active" ON "zip_code_mappings" ("tdsp_duns", "is_active");

-- Validation Logs Indexes
CREATE INDEX IF NOT EXISTS "idx_validation_logs_zip_code" ON "validation_logs" ("zip_code");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_data_source" ON "validation_logs" ("data_source_id");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_data_source_slug" ON "validation_logs" ("data_source_slug");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_validation_type" ON "validation_logs" ("validation_type");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_request_id" ON "validation_logs" ("request_id");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_is_valid" ON "validation_logs" ("is_valid");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_confidence" ON "validation_logs" ("confidence");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_processing_time" ON "validation_logs" ("processing_time");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_cache_hit" ON "validation_logs" ("cache_hit");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_validated_at" ON "validation_logs" ("validated_at");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_error_code" ON "validation_logs" ("error_code");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_retry_count" ON "validation_logs" ("retry_count");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_circuit_breaker" ON "validation_logs" ("circuit_breaker_tripped");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_client_ip" ON "validation_logs" ("client_ip");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_session_id" ON "validation_logs" ("session_id");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_zip_source" ON "validation_logs" ("zip_code", "data_source_slug");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_zip_valid" ON "validation_logs" ("zip_code", "is_valid");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_source_valid" ON "validation_logs" ("data_source_slug", "is_valid");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_date_source" ON "validation_logs" ("validated_at", "data_source_slug");
CREATE INDEX IF NOT EXISTS "idx_validation_logs_performance" ON "validation_logs" ("processing_time", "cache_hit");

-- FOREIGN KEY CONSTRAINTS

-- City Territories -> TDSP Info
ALTER TABLE "city_territories" ADD CONSTRAINT "fk_city_territories_primary_tdsp" 
  FOREIGN KEY ("primary_tdsp") REFERENCES "tdsp_info"("duns") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ZIP Code Mappings -> City Territories  
ALTER TABLE "zip_code_mappings" ADD CONSTRAINT "fk_zip_code_mappings_city_slug" 
  FOREIGN KEY ("city_slug") REFERENCES "city_territories"("city_slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ZIP Code Mappings -> TDSP Info
ALTER TABLE "zip_code_mappings" ADD CONSTRAINT "fk_zip_code_mappings_tdsp_duns" 
  FOREIGN KEY ("tdsp_duns") REFERENCES "tdsp_info"("duns") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Validation Logs -> Data Sources
ALTER TABLE "validation_logs" ADD CONSTRAINT "fk_validation_logs_data_source_id" 
  FOREIGN KEY ("data_source_id") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CHECK CONSTRAINTS

-- Data Sources
ALTER TABLE "data_sources" ADD CONSTRAINT "check_data_sources_priority" 
  CHECK ("priority" >= 1 AND "priority" <= 100);

ALTER TABLE "data_sources" ADD CONSTRAINT "check_data_sources_reliability" 
  CHECK ("reliability" >= 0 AND "reliability" <= 100);

ALTER TABLE "data_sources" ADD CONSTRAINT "check_data_sources_type" 
  CHECK ("type" IN ('api', 'database', 'file', 'scraper', 'cache'));

-- TDSP Info
ALTER TABLE "tdsp_info" ADD CONSTRAINT "check_tdsp_info_duns" 
  CHECK (LENGTH("duns") >= 9 AND LENGTH("duns") <= 13 AND "duns" ~ '^[0-9]+$');

ALTER TABLE "tdsp_info" ADD CONSTRAINT "check_tdsp_info_zone" 
  CHECK ("zone" IN ('North', 'Coast', 'Central', 'South', 'Valley'));

-- City Territories
ALTER TABLE "city_territories" ADD CONSTRAINT "check_city_territories_service_type" 
  CHECK ("service_type" IN ('deregulated', 'municipal', 'cooperative', 'regulated'));

ALTER TABLE "city_territories" ADD CONSTRAINT "check_city_territories_plan_count" 
  CHECK ("plan_count" >= 0);

-- ZIP Code Mappings
ALTER TABLE "zip_code_mappings" ADD CONSTRAINT "check_zip_code_mappings_zip_code" 
  CHECK (LENGTH("zip_code") = 5 AND "zip_code" ~ '^[0-9]+$' AND "zip_code"::integer >= 73000 AND "zip_code"::integer <= 79999);

ALTER TABLE "zip_code_mappings" ADD CONSTRAINT "check_zip_code_mappings_confidence" 
  CHECK ("confidence" >= 0 AND "confidence" <= 100);

ALTER TABLE "zip_code_mappings" ADD CONSTRAINT "check_zip_code_mappings_service_type" 
  CHECK ("service_type" IN ('deregulated', 'municipal', 'cooperative', 'regulated'));

-- Validation Logs
ALTER TABLE "validation_logs" ADD CONSTRAINT "check_validation_logs_validation_type" 
  CHECK ("validation_type" IN ('single', 'bulk', 'batch', 'background', 'scheduled'));

ALTER TABLE "validation_logs" ADD CONSTRAINT "check_validation_logs_confidence" 
  CHECK ("confidence" >= 0 AND "confidence" <= 100);

ALTER TABLE "validation_logs" ADD CONSTRAINT "check_validation_logs_processing_time" 
  CHECK ("processing_time" >= 0 AND "processing_time" <= 300000);

ALTER TABLE "validation_logs" ADD CONSTRAINT "check_validation_logs_retry_count" 
  CHECK ("retry_count" >= 0 AND "retry_count" <= 10);

-- TRIGGERS for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON "data_sources" 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_zip_code_mappings_updated_at BEFORE UPDATE ON "zip_code_mappings" 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE "data_sources" IS 'External API data sources and their configurations for ZIP validation';
COMMENT ON TABLE "tdsp_info" IS 'Texas Transmission and Distribution Service Provider information';
COMMENT ON TABLE "city_territories" IS 'Texas city territories with service areas and ZIP code mappings';
COMMENT ON TABLE "zip_code_mappings" IS 'Comprehensive ZIP code to city and TDSP mappings for Texas';
COMMENT ON TABLE "validation_logs" IS 'Audit log of all ZIP code validation attempts and results';

-- Grant permissions (adjust based on your user/role setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;