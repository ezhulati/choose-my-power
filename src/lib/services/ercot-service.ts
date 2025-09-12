/**
 * ERCOT Service - Real Database Integration
 * Handles ESIID validation and address lookup using real database data
 */

import { db } from '../../config/database.js';

export interface ESIIDDetails {
  esiid: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  tdsp: string;
  tdsp_code: string;
  meter_type: string;
  service_class: string;
  rate_class: string;
  load_profile: string;
  status: string;
  premise_type: string;
  switch_hold: boolean;
  market_participant: string;
  created_date: string;
  updated_date: string;
}

export interface AddressSearchResult {
  success: boolean;
  locations: Array<{
    esiid: string;
    address: string;
    city: string;
    zip: string;
    tdsp: string;
    service_class: string;
    premise_type: string;
  }>;
  message?: string;
}

/**
 * Generate realistic ESIID from address and ZIP code
 * Uses ZIP code patterns to determine service territory
 */
export function generateESIIDFromAddress(address: string, zipCode: string): string {
  const zipNum = parseInt(zipCode);
  
  // ESIID format: 10 + [3-digit utility] + [12-digit unique identifier]
  let utilityCode = '000'; // Default
  
  // Map ZIP codes to utility service areas
  if (zipNum >= 75000 && zipNum <= 75999) {
    // Dallas area - Oncor
    utilityCode = '443';
  } else if (zipNum >= 77000 && zipNum <= 77999) {
    // Houston area - CenterPoint Energy
    utilityCode = '811';
  } else if (zipNum >= 78000 && zipNum <= 78999) {
    // Austin area - AEP Texas
    utilityCode = '814';
  } else if (zipNum >= 76000 && zipNum <= 76999) {
    // Fort Worth area - Oncor
    utilityCode = '443';
  } else if (zipNum >= 79000 && zipNum <= 79999) {
    // El Paso area - TNMP
    utilityCode = '814';
  }
  
  // Generate unique 12-digit identifier based on address and ZIP
  const addressHash = address.toLowerCase().replace(/\s+/g, '');
  const hashNum = addressHash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const uniqueId = String(zipNum + hashNum).padEnd(12, '0').substring(0, 12);
  
  return `10${utilityCode}${uniqueId}`;
}

/**
 * Look up city and TDSP information by ZIP code
 */
export async function lookupZipCodeInfo(zipCode: string): Promise<{
  city: string;
  tdsp: string;
  tdsp_code: string;
  zone: string;
} | null> {
  try {
    const result = await db.query(`
      SELECT 
        c.name as city_name,
        c.slug as city_slug,
        t.name as tdsp_name,
        t.abbreviation as tdsp_code,
        t.zone
      FROM cities c
      JOIN tdsp t ON c.tdsp_duns = t.duns_number
      WHERE c.zip_codes @> $1::jsonb
      LIMIT 1
    `, [`"${zipCode}"`]);

    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      return {
        city: row.city_name,
        tdsp: row.tdsp_name,
        tdsp_code: row.tdsp_code,
        zone: row.zone
      };
    }

    return null;
  } catch (error) {
    console.error('ZIP code lookup error:', error);
    return null;
  }
}

/**
 * Search for service locations by address using ComparePower ERCOT API
 */
export async function searchServiceLocations(address: string, zipCode: string): Promise<AddressSearchResult> {
  try {
    // Normalize the input
    const normalizedAddress = address.trim();
    const normalizedZip = zipCode.trim();

    // Searching ERCOT API - debug logging removed for ESLint compliance

    // Call the real ComparePower ERCOT API
    const response = await fetch(`https://ercot.api.comparepower.com/api/esiids?address=${encodeURIComponent(normalizedAddress)}&zip_code=${normalizedZip}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ChooseMyPower/1.0'
      }
    });

    if (!response.ok) {
      console.error(`❌ ERCOT API error: ${response.status} ${response.statusText}`);
      
      // Log the failed lookup
      await logAddressSearch(address, zipCode, null, false);
      
      return {
        success: false,
        locations: [],
        message: `Unable to find service locations for this address. Please verify your address and try again. (API Error: ${response.status})`
      };
    }

    const apiResult = await response.json();
    // ERCOT API search successful - debug logging removed for ESLint compliance

    // Transform API response to our expected format
    if (!apiResult || !Array.isArray(apiResult) || apiResult.length === 0) {
      // Log the failed lookup
      await logAddressSearch(address, zipCode, null, false);
      
      return {
        success: false,
        locations: [],
        message: 'No service locations found for this address. Please check your address and try again.'
      };
    }

    // Transform the API response to match our interface
    const locations = apiResult.map(loc => ({
      esiid: loc.esiid || loc.esiid_number || loc.id,
      address: loc.address || normalizedAddress,
      city: loc.city || 'Unknown',
      zip: loc.zip || loc.zip_code || normalizedZip,
      tdsp: loc.tdsp || loc.utility || 'Unknown',
      service_class: loc.service_class || 'Residential',
      premise_type: loc.premise_type || 'Single Family'
    }));

    // Log the successful lookup
    await logAddressSearch(normalizedAddress, normalizedZip, locations[0]?.city || 'Unknown', true);

    return {
      success: true,
      locations,
      message: `Found ${locations.length} service location${locations.length === 1 ? '' : 's'} for your address`
    };

  } catch (error) {
    console.error('❌ ERCOT API search error:', error);
    
    // Log the failed lookup
    await logAddressSearch(address, zipCode, null, false);

    return {
      success: false,
      locations: [],
      message: 'Unable to search for service locations. Please verify your address and try again.'
    };
  }
}

/**
 * Validate and get detailed information for an ESIID using ComparePower ERCOT API
 */
export async function validateESIID(esiid: string): Promise<ESIIDDetails | null> {
  try {
    // Validate ESIID format (17 digits starting with 10)
    if (!/^10\d{15}$/.test(esiid)) {
      throw new Error('Invalid ESIID format. Must be 17 digits starting with 10.');
    }

    // Validating ESIID - debug logging removed for ESLint compliance

    // Call the real ComparePower ERCOT API for ESIID details
    const response = await fetch(`https://ercot.api.comparepower.com/api/esiids/${esiid}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ChooseMyPower/1.0'
      }
    });

    if (!response.ok) {
      console.error(`❌ ERCOT API ESIID validation error: ${response.status} ${response.statusText}`);
      
      // Log the failed validation
      await logESIIDValidation(esiid, false);
      
      return null;
    }

    const apiResult = await response.json();
    // ERCOT API ESIID validation successful - debug logging removed for ESLint compliance

    if (!apiResult) {
      // Log the failed validation
      await logESIIDValidation(esiid, false);
      return null;
    }

    // Transform API response to our interface
    const details: ESIIDDetails = {
      esiid: apiResult.esiid || esiid,
      address: apiResult.address || 'Unknown Address',
      city: apiResult.city || 'Unknown',
      state: apiResult.state || 'TX',
      zip: apiResult.zip || apiResult.zip_code || '00000',
      county: apiResult.county || 'Unknown',
      tdsp: apiResult.tdsp || apiResult.utility || 'Unknown',
      tdsp_code: apiResult.tdsp_code || apiResult.utility_code || 'UNKNOWN',
      meter_type: apiResult.meter_type || 'Smart Meter',
      service_class: apiResult.service_class || 'Residential',
      rate_class: apiResult.rate_class || 'R1',
      load_profile: apiResult.load_profile || 'R1',
      status: apiResult.status || 'Active',
      premise_type: apiResult.premise_type || 'Single Family',
      switch_hold: apiResult.switch_hold || false,
      market_participant: apiResult.market_participant || 'Unknown',
      created_date: apiResult.created_date || new Date().toISOString(),
      updated_date: apiResult.updated_date || new Date().toISOString()
    };

    // Log the successful validation
    await logESIIDValidation(esiid, true);

    return details;

  } catch (error) {
    console.error('❌ ERCOT API ESIID validation error:', error);
    
    // Log the failed validation
    await logESIIDValidation(esiid, false);
    
    return null;
  }
}

/**
 * Log address searches for analytics
 */
async function logAddressSearch(address: string, zipCode: string, cityFound: string | null, success: boolean): Promise<void> {
  try {
    await db.query(`
      INSERT INTO search_history (search_query, search_type, results_count, no_results)
      VALUES ($1, 'zip_code', $2, $3)
    `, [
      `${address}, ${zipCode}`,
      success ? 1 : 0,
      !success
    ]);
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.warn('Failed to log address search:', error.message);
  }
}

/**
 * Log ESIID validations for analytics
 */
async function logESIIDValidation(esiid: string, success: boolean): Promise<void> {
  try {
    await db.query(`
      INSERT INTO api_logs (endpoint, params, response_status)
      VALUES ('ercot/validate', $1, $2)
    `, [
      JSON.stringify({ esiid }),
      success ? 200 : 400
    ]);
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.warn('Failed to log ESIID validation:', error.message);
  }
}