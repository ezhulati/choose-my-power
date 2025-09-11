import type { APIRoute } from 'astro';
import { ercotESIIDClient } from '../../../lib/api/ercot-esiid-client.ts';

export const POST: APIRoute = async ({ request }) => {
  console.log('🔥 ENDPOINT HIT - Starting request processing');
  
  try {
    console.log('🔥 About to parse JSON body');
    const body = await request.json();
    console.log('🔥 JSON parsed successfully:', body);
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

    console.log(`🔍 ERCOT API Address search: "${address}" in ZIP ${zipCode}`);

    // Direct ERCOT API call - bypass hanging client
    const url = new URL('https://ercot.api.comparepower.com/api/esiids');
    url.searchParams.set('address', address.trim());
    url.searchParams.set('zip_code', zipCode);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ChooseMyPower.org/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ERCOT API error: ${response.status} ${response.statusText}`);
    }

    const rawResults = await response.json();
    
    // Transform to expected format
    const esiidResults = rawResults.map((result: any) => ({
      esiid: result.esiid,
      address: result.address,
      city: result.city,
      state: result.state,
      zip_code: result.zip_code,
      county: result.county,
      tdsp_duns: result.duns,
      tdsp_name: result.station_name || 'ONCOR',
      service_voltage: result.metered_service_type || '',
      meter_type: result.metered === 'Y' ? 'Smart Meter' : 'Standard Meter'
    }));

    if (esiidResults.length === 0) {
      console.log(`❌ No ESIID results found for address: ${address}, ZIP: ${zipCode}`);
      return new Response(JSON.stringify({ 
        error: 'No service locations found for this address. Please check your address and try again.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ Found ${esiidResults.length} ESIID results from real ERCOT API`);

    // Transform ERCOT API response to match expected format
    const locations = esiidResults.map(result => ({
      esiid: result.esiid,
      address: result.address,
      city: result.city,
      state: result.state,
      zip: result.zip_code,
      tdsp: result.tdsp_name,
      meter_type: result.meter_type || 'Smart Meter',
      service_voltage: result.service_voltage,
      county: result.county
    }));

    return new Response(JSON.stringify(locations), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Real ERCOT API Search error:', error);
    
    // Return appropriate error based on error type
    if (error.name === 'ComparePowerApiError') {
      return new Response(JSON.stringify({ 
        error: error.message || 'Unable to search service locations',
        type: error.type
      }), {
        status: error.retryable ? 503 : 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error during address search',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};