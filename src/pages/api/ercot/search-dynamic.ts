import type { APIRoute } from 'astro';
import { searchServiceLocations, type AddressSearchResult } from '../../../lib/services/ercot-service.ts';
import { initializeDatabase } from '../../../lib/database/init.ts';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Initialize database if needed
    try {
      await initializeDatabase();
    } catch (dbError) {
      console.warn('Database initialization skipped (may already be initialized):', dbError.message);
    }

    const body = await request.json();
    const { address, zipCode } = body;

    if (!address || !zipCode) {
      return new Response(JSON.stringify({ 
        error: 'Address and ZIP code are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate ZIP code format
    if (!/^\d{5}$/.test(zipCode)) {
      return new Response(JSON.stringify({ 
        error: 'ZIP code must be 5 digits' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔍 Address search: "${address}" in ZIP ${zipCode}`);

    // Search for service locations using database-driven service
    const searchResult: AddressSearchResult = await searchServiceLocations(address.trim(), zipCode);

    if (!searchResult.success) {
      console.log(`❌ Address search failed: ${searchResult.message}`);
      return new Response(JSON.stringify({ 
        error: searchResult.message || 'Unable to find service locations for this address'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ Found ${searchResult.locations.length} service locations: ${searchResult.message}`);

    // Transform to match expected format (keeping compatibility)
    const locations = searchResult.locations.map(loc => ({
      esiid: loc.esiid,
      address: loc.address,
      city: loc.city,
      state: 'TX',
      zip: loc.zip,
      tdsp: loc.tdsp,
      meter_type: 'Smart Meter',
      service_class: loc.service_class,
      premise_type: loc.premise_type
    }));

    return new Response(JSON.stringify(locations), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ ERCOT Search API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};