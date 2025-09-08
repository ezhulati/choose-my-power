import type { APIRoute } from 'astro';
import { db } from '../../../config/database.js';

export const GET: APIRoute = async ({ url }) => {
  try {
    const zipCode = url.searchParams.get('zip') || '75201';
    
    console.log(`🔍 Testing ZIP code lookup for: ${zipCode}`);
    
    // Test 1: Check if cities table has data
    const cityCount = await db.query('SELECT COUNT(*) as count FROM cities');
    console.log(`Cities query result:`, cityCount);
    
    // Test 2: Check if TDSP table has data
    const tdspCount = await db.query('SELECT COUNT(*) as count FROM tdsp');
    console.log(`TDSPs query result:`, tdspCount);
    
    // Test 3: Show all cities with their ZIP codes
    const allCities = await db.query('SELECT name, slug, zip_codes FROM cities');
    console.log(`All cities:`, allCities.rows);
    
    // Test 4: The actual ZIP lookup query
    const zipLookup = await db.query(`
      SELECT 
        c.name as city_name,
        c.slug as city_slug,
        c.zip_codes,
        t.name as tdsp_name,
        t.abbreviation as tdsp_code,
        t.zone
      FROM cities c
      JOIN tdsp t ON c.tdsp_duns = t.duns_number
      WHERE c.zip_codes @> $1::jsonb
      LIMIT 1
    `, [`"${zipCode}"`]);
    
    console.log(`ZIP lookup result for ${zipCode}:`, zipLookup.rows);
    
    // Test 5: Try alternative query without JSONB
    const alternativeQuery = await db.query(`
      SELECT 
        c.name as city_name,
        c.slug as city_slug,
        c.zip_codes,
        t.name as tdsp_name,
        t.abbreviation as tdsp_code,
        t.zone
      FROM cities c
      JOIN tdsp t ON c.tdsp_duns = t.duns_number
      WHERE c.zip_codes::text LIKE $1
      LIMIT 1
    `, [`%"${zipCode}"%`]);
    
    console.log(`Alternative query result:`, alternativeQuery.rows);
    
    return new Response(JSON.stringify({
      success: true,
      zipCode,
      tests: {
        cityCount: cityCount,
        tdspCount: tdspCount,
        allCities: allCities,
        zipLookup: zipLookup,
        alternativeQuery: alternativeQuery
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ ZIP code test failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};