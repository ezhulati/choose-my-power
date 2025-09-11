import type { APIRoute } from 'astro';
import { ercotESIIDClient } from '../../../lib/api/ercot-esiid-client.ts';

export const POST: APIRoute = async ({ request }) => {
  try {
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

    console.log(`🔍 ERCOT API Address search: "${address}" in ZIP ${zipCode}`);

    // Use real ERCOT API client - Search service locations using ComparePower ERCOT API
    const esiidResults = await ercotESIIDClient.searchESIIDs({
      address: address.trim(),
      zip_code: zipCode
    });

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