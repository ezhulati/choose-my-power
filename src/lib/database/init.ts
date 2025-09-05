/**
 * Database Initialization Script
 * Creates tables and populates initial data
 */

import { db } from '../../config/database.js';
import { CREATE_TABLES_SQL } from './schema.ts';

/**
 * Initialize database tables and seed basic data
 */
export async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Create all tables
    await db.query(CREATE_TABLES_SQL);
    console.log('✅ Database tables created successfully');

    // Seed TDSP data
    await seedTDSPData();
    
    // Seed initial cities
    await seedCityData();
    
    // Seed providers
    await seedProviderData();
    
    console.log('✅ Database initialization complete');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Seed TDSP (Transmission and Distribution Service Provider) data
 */
async function seedTDSPData() {
  const tdspData = [
    {
      duns_number: '0061445999',
      name: 'Oncor Electric Delivery Company LLC',
      short_name: 'Oncor Electric Delivery',
      abbreviation: 'ONCOR',
      zone: 'North'
    },
    {
      duns_number: '0081133950',
      name: 'CenterPoint Energy Houston Electric LLC',
      short_name: 'CenterPoint Energy',
      abbreviation: 'CNPE',
      zone: 'Coast'
    },
    {
      duns_number: '0081471956',
      name: 'Texas-New Mexico Power Company',
      short_name: 'TNMP',
      abbreviation: 'TNMP',
      zone: 'South'
    },
    {
      duns_number: '0081133951',
      name: 'AEP Texas Central Company',
      short_name: 'AEP Texas Central',
      abbreviation: 'AEPTXC',
      zone: 'Central'
    },
    {
      duns_number: '0081133952',
      name: 'AEP Texas North Company',
      short_name: 'AEP Texas North',
      abbreviation: 'AEPTXN',
      zone: 'Central'
    }
  ];

  for (const tdsp of tdspData) {
    try {
      await db.query(`
        INSERT INTO tdsp (duns_number, name, short_name, abbreviation, zone)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (duns_number) DO NOTHING
      `, [tdsp.duns_number, tdsp.name, tdsp.short_name, tdsp.abbreviation, tdsp.zone]);
    } catch (error) {
      console.warn(`Warning: Failed to insert TDSP ${tdsp.abbreviation}:`, error.message);
    }
  }
  
  console.log('✅ TDSP data seeded');
}

/**
 * Seed major Texas cities data
 */
async function seedCityData() {
  const cityData = [
    {
      name: 'Dallas',
      slug: 'dallas',
      tdsp_duns: '0061445999',
      zone: 'North',
      zip_codes: ['75201', '75202', '75203', '75204', '75205'],
      population: 1331000,
      is_major_city: true
    },
    {
      name: 'Houston',
      slug: 'houston',
      tdsp_duns: '0081133950',
      zone: 'Coast',
      zip_codes: ['77001', '77002', '77003', '77004', '77005'],
      population: 2320000,
      is_major_city: true
    },
    {
      name: 'Austin',
      slug: 'austin',
      tdsp_duns: '0081133951',
      zone: 'Central',
      zip_codes: ['78701', '78702', '78703', '78704', '78705'],
      population: 965000,
      is_major_city: true
    },
    {
      name: 'Fort Worth',
      slug: 'fort-worth',
      tdsp_duns: '0061445999',
      zone: 'North',
      zip_codes: ['76101', '76102', '76103', '76104', '76105'],
      population: 918000,
      is_major_city: true
    },
    {
      name: 'Arlington',
      slug: 'arlington',
      tdsp_duns: '0061445999',
      zone: 'North',
      zip_codes: ['76001', '76002', '76003', '76004', '76005'],
      population: 398000,
      is_major_city: true
    }
  ];

  for (const city of cityData) {
    try {
      await db.query(`
        INSERT INTO cities (name, slug, tdsp_duns, zone, zip_codes, population, is_major_city)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (slug) DO NOTHING
      `, [
        city.name, 
        city.slug, 
        city.tdsp_duns, 
        city.zone, 
        JSON.stringify(city.zip_codes), 
        city.population, 
        city.is_major_city
      ]);
    } catch (error) {
      console.warn(`Warning: Failed to insert city ${city.name}:`, error.message);
    }
  }
  
  console.log('✅ City data seeded');
}

/**
 * Seed major electricity providers
 */
async function seedProviderData() {
  const providerData = [
    {
      name: 'TXU Energy',
      legal_name: 'TXU Energy Retail Company LLC',
      puct_number: '10098',
      logo_filename: 'txu-energy.png',
      contact_phone: '1-855-368-8942',
      support_email: 'customer.service@txu.com'
    },
    {
      name: 'Reliant Energy',
      legal_name: 'Reliant Energy Retail Services LLC',
      puct_number: '10007',
      logo_filename: 'reliant-energy.png',
      contact_phone: '1-866-222-7100',
      support_email: 'customer.service@reliant.com'
    },
    {
      name: 'Direct Energy',
      legal_name: 'Direct Energy LP',
      puct_number: '10003',
      logo_filename: 'direct-energy.png',
      contact_phone: '1-877-937-3298',
      support_email: 'customer.care@directenergy.com'
    },
    {
      name: 'Green Mountain Energy',
      legal_name: 'Green Mountain Energy Company',
      puct_number: '10088',
      logo_filename: 'green-mountain-energy.png',
      contact_phone: '1-888-637-4636',
      support_email: 'customercare@greenmountain.com'
    },
    {
      name: '4Change Energy',
      legal_name: '4Change Energy LP',
      puct_number: '10171',
      logo_filename: '4change-energy.png',
      contact_phone: '1-844-466-3808',
      support_email: 'info@4changeenergy.com'
    }
  ];

  for (const provider of providerData) {
    try {
      await db.query(`
        INSERT INTO providers (name, legal_name, puct_number, logo_filename, contact_phone, support_email)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (name) DO NOTHING
      `, [
        provider.name,
        provider.legal_name,
        provider.puct_number,
        provider.logo_filename,
        provider.contact_phone,
        provider.support_email
      ]);
    } catch (error) {
      console.warn(`Warning: Failed to insert provider ${provider.name}:`, error.message);
    }
  }
  
  console.log('✅ Provider data seeded');
}

/**
 * Check if database is properly initialized
 */
export async function checkDatabaseHealth() {
  try {
    const [tdspCount] = await db.query('SELECT COUNT(*) as count FROM tdsp');
    const [cityCount] = await db.query('SELECT COUNT(*) as count FROM cities');
    const [providerCount] = await db.query('SELECT COUNT(*) as count FROM providers');
    
    return {
      healthy: true,
      tdsp_count: tdspCount.count,
      city_count: cityCount.count,
      provider_count: providerCount.count,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}