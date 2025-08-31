-- Auto-generated Provider Logo Population SQL
-- Generated: 2025-08-31T03:07:46.576Z
-- Source: comparepower-2025-08-27.csv

BEGIN;


INSERT INTO provider_cache (provider_name, logo_url, updated_at)
VALUES ('Frontier Utilities', 'https://assets.comparepower.com/images/frontier_utilities.svg', NOW())
ON CONFLICT (provider_name) 
DO UPDATE SET logo_url = 'https://assets.comparepower.com/images/frontier_utilities.svg', updated_at = NOW();

INSERT INTO provider_cache (provider_name, logo_url, updated_at)
VALUES ('Gexa Energy', 'https://assets.comparepower.com/images/gexa_energy.svg', NOW())
ON CONFLICT (provider_name) 
DO UPDATE SET logo_url = 'https://assets.comparepower.com/images/gexa_energy.svg', updated_at = NOW();

INSERT INTO provider_cache (provider_name, logo_url, updated_at)
VALUES ('4change Energy', 'https://assets.comparepower.com/images/4change_energy.svg', NOW())
ON CONFLICT (provider_name) 
DO UPDATE SET logo_url = 'https://assets.comparepower.com/images/4change_energy.svg', updated_at = NOW();

INSERT INTO provider_cache (provider_name, logo_url, updated_at)
VALUES ('Discount Power', 'https://assets.comparepower.com/images/discount_power.svg', NOW())
ON CONFLICT (provider_name) 
DO UPDATE SET logo_url = 'https://assets.comparepower.com/images/discount_power.svg', updated_at = NOW();

INSERT INTO provider_cache (provider_name, logo_url, updated_at)
VALUES ('Cirro Energy', 'https://assets.comparepower.com/images/cirro_energy.svg', NOW())
ON CONFLICT (provider_name) 
DO UPDATE SET logo_url = 'https://assets.comparepower.com/images/cirro_energy.svg', updated_at = NOW();

INSERT INTO provider_cache (provider_name, logo_url, updated_at)
VALUES ('Apge', 'https://assets.comparepower.com/images/apge.svg', NOW())
ON CONFLICT (provider_name) 
DO UPDATE SET logo_url = 'https://assets.comparepower.com/images/apge.svg', updated_at = NOW();

INSERT INTO provider_cache (provider_name, logo_url, updated_at)
VALUES ('Rhythm Energy', 'https://assets.comparepower.com/images/rhythm_energy.svg', NOW())
ON CONFLICT (provider_name) 
DO UPDATE SET logo_url = 'https://assets.comparepower.com/images/rhythm_energy.svg', updated_at = NOW();

INSERT INTO provider_cache (provider_name, logo_url, updated_at)
VALUES ('Atlantex Power', 'https://assets.comparepower.com/images/atlantex_power.svg', NOW())
ON CONFLICT (provider_name) 
DO UPDATE SET logo_url = 'https://assets.comparepower.com/images/atlantex_power.svg', updated_at = NOW();

INSERT INTO provider_cache (provider_name, logo_url, updated_at)
VALUES ('Just Energy', 'https://assets.comparepower.com/images/just_energy.svg', NOW())
ON CONFLICT (provider_name) 
DO UPDATE SET logo_url = 'https://assets.comparepower.com/images/just_energy.svg', updated_at = NOW();

INSERT INTO provider_cache (provider_name, logo_url, updated_at)
VALUES ('Tara Energy', 'https://assets.comparepower.com/images/tara_energy.svg', NOW())
ON CONFLICT (provider_name) 
DO UPDATE SET logo_url = 'https://assets.comparepower.com/images/tara_energy.svg', updated_at = NOW();

INSERT INTO provider_cache (provider_name, logo_url, updated_at)
VALUES ('Reliant', 'https://assets.comparepower.com/images/reliant.svg', NOW())
ON CONFLICT (provider_name) 
DO UPDATE SET logo_url = 'https://assets.comparepower.com/images/reliant.svg', updated_at = NOW();

INSERT INTO provider_cache (provider_name, logo_url, updated_at)
VALUES ('Direct Energy', 'https://assets.comparepower.com/images/direct_energy.svg', NOW())
ON CONFLICT (provider_name) 
DO UPDATE SET logo_url = 'https://assets.comparepower.com/images/direct_energy.svg', updated_at = NOW();

INSERT INTO provider_cache (provider_name, logo_url, updated_at)
VALUES ('Green Mountain', 'https://assets.comparepower.com/images/green_mountain.svg', NOW())
ON CONFLICT (provider_name) 
DO UPDATE SET logo_url = 'https://assets.comparepower.com/images/green_mountain.svg', updated_at = NOW();

INSERT INTO provider_cache (provider_name, logo_url, updated_at)
VALUES ('Amigo Energy', 'https://assets.comparepower.com/images/amigo_energy.svg', NOW())
ON CONFLICT (provider_name) 
DO UPDATE SET logo_url = 'https://assets.comparepower.com/images/amigo_energy.svg', updated_at = NOW();

INSERT INTO provider_cache (provider_name, logo_url, updated_at)
VALUES ('Payless Power', 'https://assets.comparepower.com/images/payless_power.svg', NOW())
ON CONFLICT (provider_name) 
DO UPDATE SET logo_url = 'https://assets.comparepower.com/images/payless_power.svg', updated_at = NOW();

INSERT INTO provider_cache (provider_name, logo_url, updated_at)
VALUES ('Txu Energy', 'https://assets.comparepower.com/images/txu_energy.svg', NOW())
ON CONFLICT (provider_name) 
DO UPDATE SET logo_url = 'https://assets.comparepower.com/images/txu_energy.svg', updated_at = NOW();

COMMIT;

-- Verification query
SELECT provider_name, logo_url FROM provider_cache ORDER BY provider_name;
