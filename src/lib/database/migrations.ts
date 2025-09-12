/**
 * Database Migration System for ChooseMyPower
 * Handles database setup, seeding, and maintenance operations
 */

import { createUnpooledDatabaseConnection } from './config';
import { CREATE_TABLES_SQL } from './schema';
import type { Provider, TDSP, City } from './schema';
import { getProviderLogo, getAllProviders } from '../providers/logo-mapper';

/**
 * Run database migrations - create all tables and indexes
 */
export async function runMigrations(): Promise<void> {
  console.warn('🔄 Running database migrations...');
  
  try {
    const sql = createUnpooledDatabaseConnection();
    
    // Execute the full schema creation
    await sql`${CREATE_TABLES_SQL}`;
    
    console.warn('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Seed providers table with existing logo data
 */
export async function seedProviders(): Promise<void> {
  console.warn('🌱 Seeding providers table...');
  
  try {
    const sql = createUnpooledDatabaseConnection();
    const providers = getAllProviders();
    
    for (const provider of providers) {
      await sql`
        INSERT INTO providers (name, legal_name, puct_number, logo_filename, logo_url)
        VALUES (
          ${provider.name},
          ${provider.name}, -- Use name as legal_name for now
          ${provider.puctNumber},
          ${provider.logoFilename},
          ${provider.logoUrl}
        )
        ON CONFLICT (puct_number) DO UPDATE SET
          name = EXCLUDED.name,
          logo_filename = EXCLUDED.logo_filename,
          logo_url = EXCLUDED.logo_url,
          updated_at = NOW()
      `;
    }
    
    console.warn(`✅ Seeded ${providers.length} providers`);
  } catch (error) {
    console.error('❌ Provider seeding failed:', error);
    throw error;
  }
}

/**
 * Seed TDSP (Transmission and Distribution Service Providers) data
 */
export async function seedTDSP(): Promise<void> {
  console.warn('🌱 Seeding TDSP data...');
  
  const tdspData: Omit<TDSP, 'id' | 'created_at' | 'updated_at'>[] = [
    {
      duns_number: '007909548000',
      name: 'AEP Texas North Company',
      short_name: 'AEP Texas North',
      abbreviation: 'AEPTXN',
      zone: 'North'
    },
    {
      duns_number: '007928010000',
      name: 'AEP Texas Central Company', 
      short_name: 'AEP Texas Central',
      abbreviation: 'AEPTXC',
      zone: 'Central'
    },
    {
      duns_number: '026741090000',
      name: 'CenterPoint Energy Houston Electric, LLC',
      short_name: 'CenterPoint Energy',
      abbreviation: 'CNP',
      zone: 'Coast'
    },
    {
      duns_number: '009777091000',
      name: 'Oncor Electric Delivery Company LLC',
      short_name: 'Oncor',
      abbreviation: 'ONCOR',
      zone: 'North'
    },
    {
      duns_number: '171663460000',
      name: 'Texas New Mexico Power Company',
      short_name: 'TNMP',
      abbreviation: 'TNMP',
      zone: 'South'
    }
  ];

  try {
    const sql = createUnpooledDatabaseConnection();
    
    for (const tdsp of tdspData) {
      await sql`
        INSERT INTO tdsp (duns_number, name, short_name, abbreviation, zone)
        VALUES (${tdsp.duns_number}, ${tdsp.name}, ${tdsp.short_name}, ${tdsp.abbreviation}, ${tdsp.zone})
        ON CONFLICT (duns_number) DO UPDATE SET
          name = EXCLUDED.name,
          short_name = EXCLUDED.short_name,
          abbreviation = EXCLUDED.abbreviation,
          zone = EXCLUDED.zone,
          updated_at = NOW()
      `;
    }
    
    console.warn(`✅ Seeded ${tdspData.length} TDSP records`);
  } catch (error) {
    console.error('❌ TDSP seeding failed:', error);
    throw error;
  }
}

/**
 * Seed major Texas cities data
 */
export async function seedCities(): Promise<void> {
  console.warn('🌱 Seeding cities data...');
  
  const citiesData: Omit<City, 'id' | 'created_at' | 'updated_at'>[] = [
    {
      name: 'Houston',
      slug: 'houston',
      state: 'TX',
      tdsp_duns: '026741090000', // CenterPoint
      zone: 'Coast',
      zip_codes: ['77001', '77002', '77003', '77004', '77005'],
      population: 2304580,
      is_major_city: true
    },
    {
      name: 'Dallas',
      slug: 'dallas', 
      state: 'TX',
      tdsp_duns: '009777091000', // Oncor
      zone: 'North',
      zip_codes: ['75201', '75202', '75203', '75204', '75205'],
      population: 1343573,
      is_major_city: true
    },
    {
      name: 'Fort Worth',
      slug: 'fort-worth',
      state: 'TX', 
      tdsp_duns: '009777091000', // Oncor
      zone: 'North',
      zip_codes: ['76101', '76102', '76103', '76104', '76105'],
      population: 918915,
      is_major_city: true
    },
    {
      name: 'Austin',
      slug: 'austin',
      state: 'TX',
      tdsp_duns: '009777091000', // Oncor (some areas)
      zone: 'Central',
      zip_codes: ['73301', '78701', '78702', '78703', '78704'],
      population: 965872,
      is_major_city: true
    },
    {
      name: 'San Antonio',
      slug: 'san-antonio',
      state: 'TX',
      tdsp_duns: '171663460000', // TNMP
      zone: 'South',
      zip_codes: ['78201', '78202', '78203', '78204', '78205'],
      population: 1547253,
      is_major_city: true
    }
  ];

  try {
    const sql = createUnpooledDatabaseConnection();
    
    for (const city of citiesData) {
      await sql`
        INSERT INTO cities (name, slug, state, tdsp_duns, zone, zip_codes, population, is_major_city)
        VALUES (
          ${city.name}, 
          ${city.slug}, 
          ${city.state}, 
          ${city.tdsp_duns}, 
          ${city.zone}, 
          ${JSON.stringify(city.zip_codes)}, 
          ${city.population}, 
          ${city.is_major_city}
        )
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
    
    console.warn(`✅ Seeded ${citiesData.length} cities`);
  } catch (error) {
    console.error('❌ Cities seeding failed:', error);
    throw error;
  }
}

/**
 * Clean expired cache entries
 */
export async function cleanExpiredCache(): Promise<void> {
  console.warn('🧹 Cleaning expired cache entries...');
  
  try {
    const sql = createUnpooledDatabaseConnection();
    
    const result = await sql`
      DELETE FROM plan_cache 
      WHERE expires_at < NOW()
    `;
    
    console.warn(`✅ Cleaned ${result.length} expired cache entries`);
  } catch (error) {
    console.error('❌ Cache cleanup failed:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const sql = createUnpooledDatabaseConnection();
    
    const [providers, plans, cache, cities, logs] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM providers`,
      sql`SELECT COUNT(*) as count FROM electricity_plans WHERE is_active = true`,
      sql`SELECT COUNT(*) as count FROM plan_cache WHERE expires_at > NOW()`,
      sql`SELECT COUNT(*) as count FROM cities`,
      sql`SELECT COUNT(*) as count FROM api_logs WHERE created_at > NOW() - INTERVAL '24 hours'`
    ]);
    
    return {
      providers: Number(providers[0].count),
      activePlans: Number(plans[0].count),
      validCacheEntries: Number(cache[0].count),
      cities: Number(cities[0].count),
      apiCallsLast24h: Number(logs[0].count),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Failed to get database stats:', error);
    throw error;
  }
}

/**
 * Full database setup - run all migrations and seeding
 */
export async function setupDatabase(): Promise<void> {
  console.warn('🚀 Setting up ChooseMyPower database...');
  
  try {
    await runMigrations();
    await seedTDSP();
    await seedProviders();
    await seedCities();
    
    const stats = await getDatabaseStats();
    console.warn('📊 Database setup completed:', stats);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

/**
 * Reset database - WARNING: This will drop all data
 */
export async function resetDatabase(): Promise<void> {
  console.warn('⚠️  RESETTING DATABASE - ALL DATA WILL BE LOST!');
  
  try {
    const sql = createUnpooledDatabaseConnection();
    
    // Drop all tables in correct order
    await sql`
      DROP TABLE IF EXISTS user_searches CASCADE;
      DROP TABLE IF EXISTS api_logs CASCADE;
      DROP TABLE IF EXISTS plan_cache CASCADE;
      DROP TABLE IF EXISTS electricity_plans CASCADE;
      DROP TABLE IF EXISTS cities CASCADE;
      DROP TABLE IF EXISTS tdsp CASCADE;
      DROP TABLE IF EXISTS providers CASCADE;
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    `;
    
    console.warn('🗑️  Database reset completed');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
}