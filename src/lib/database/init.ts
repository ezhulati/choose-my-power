/**
 * Database Initialization Script
 * Creates tables and populates initial data
 */

import { db } from '../../config/database.js';
import { CREATE_TABLES_SQL } from './schema.ts';
import { loadCityData } from '../api/plan-data-service.ts';

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
    
    // Seed electricity plans from generated data files
    await seedElectricityPlans();
    
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
 * Seed electricity plans from generated JSON data files
 */
async function seedElectricityPlans() {
  console.log('🔄 Seeding electricity plans from generated data...');
  
  // List of major cities to seed plans from
  const cities = ['dallas', 'houston', 'arlington', 'irving', 'south-houston'];
  let totalPlansSeeded = 0;
  
  for (const citySlug of cities) {
    try {
      console.log(`Loading plans for ${citySlug}...`);
      const cityData = await loadCityData(citySlug);
      
      if (!cityData) {
        console.warn(`No city data found for ${citySlug}`);
        continue;
      }
      
      const plans = cityData.filters?.['no-filters']?.plans || cityData.plans || [];
      
      if (plans.length === 0) {
        console.warn(`No plans found for ${citySlug}`);
        continue;
      }
      
      // Get the city ID and TDSP from database
      const cityRecord = await db.query('SELECT id, tdsp_duns FROM cities WHERE slug = $1', [citySlug]);
      if (!cityRecord || cityRecord.length === 0) {
        console.warn(`City ${citySlug} not found in database`);
        continue;
      }
      
      const cityId = cityRecord[0].id;
      const tdspDuns = cityRecord[0].tdsp_duns;
      
      // Get TDSP ID
      const tdspRecord = await db.query('SELECT id FROM tdsp WHERE duns_number = $1', [tdspDuns]);
      if (!tdspRecord || tdspRecord.length === 0) {
        console.warn(`TDSP ${tdspDuns} not found in database`);
        continue;
      }
      
      const tdspId = tdspRecord[0].id;
      
      for (const plan of plans) {
        try {
          // Get or create provider
          let providerRecord = await db.query('SELECT id FROM providers WHERE name = $1', [plan.provider.name]);
          let providerId;
          
          if (!providerRecord || providerRecord.length === 0) {
            // Create provider if doesn't exist
            const newProvider = await db.query(`
              INSERT INTO providers (name, legal_name, logo_filename)
              VALUES ($1, $2, $3)
              RETURNING id
            `, [plan.provider.name, plan.provider.name, '']);
            providerId = newProvider[0].id;
          } else {
            providerId = providerRecord[0].id;
          }
          
          // Insert electricity plan
          await db.query(`
            INSERT INTO electricity_plans (
              id, name, provider_id, city_id, tdsp_id,
              rate_500kwh, rate_1000kwh, rate_2000kwh, rate_per_kwh,
              contract_length_months, contract_type, early_termination_fee,
              green_energy_percentage, bill_credit, has_free_time,
              deposit_required, deposit_amount, plan_data
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            ON CONFLICT (id) DO NOTHING
          `, [
            plan.id,
            plan.name,
            providerId,
            cityId,
            tdspId,
            plan.pricing?.rate500kWh || 0,
            plan.pricing?.rate1000kWh || 0,
            plan.pricing?.rate2000kWh || 0,
            plan.pricing?.ratePerKwh || 0,
            plan.contract?.length || 12,
            plan.contract?.type || 'fixed',
            plan.contract?.earlyTerminationFee || 0,
            plan.features?.greenEnergy || 0,
            plan.features?.billCredit || 0,
            !!plan.features?.freeTime,
            plan.features?.deposit?.required || false,
            plan.features?.deposit?.amount || 0,
            JSON.stringify(plan)
          ]);
          
          totalPlansSeeded++;
        } catch (planError) {
          console.warn(`Failed to insert plan ${plan.id} (${plan.name}):`, planError.message);
        }
      }
      
      console.log(`✅ Seeded ${plans.length} plans for ${citySlug}`);
    } catch (error) {
      console.warn(`Failed to process city ${citySlug}:`, error.message);
    }
  }
  
  console.log(`✅ Electricity plans seeded: ${totalPlansSeeded} total plans`);
}

/**
 * Check if database is properly initialized
 */
export async function checkDatabaseHealth() {
  try {
    const [tdspCount] = await db.query('SELECT COUNT(*) as count FROM tdsp');
    const [cityCount] = await db.query('SELECT COUNT(*) as count FROM cities');
    const [providerCount] = await db.query('SELECT COUNT(*) as count FROM providers');
    const [planCount] = await db.query('SELECT COUNT(*) as count FROM electricity_plans');
    
    return {
      healthy: true,
      tdsp_count: tdspCount.count,
      city_count: cityCount.count,
      provider_count: providerCount.count,
      plan_count: planCount.count,
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