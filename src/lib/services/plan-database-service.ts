/**
 * Database-Driven Plan Search Service
 * 
 * Provides plan search functionality using the database instead of JSON files.
 * This ensures all plan data comes from the centralized database with real MongoDB ObjectIds.
 */

import { db } from '../../config/database.js';

export interface DatabasePlan {
  id: string; // MongoDB ObjectId
  name: string;
  provider: {
    id: number;
    name: string;
    legal_name?: string;
    logo_filename?: string;
  };
  city: {
    id: number;
    name: string;
    slug: string;
  };
  tdsp: {
    id: number;
    name: string;
    short_name: string;
  };
  pricing: {
    rate500kWh: number;
    rate1000kWh: number;
    rate2000kWh: number;
    ratePerKwh: number;
  };
  contract: {
    lengthMonths: number;
    type: string;
    earlyTerminationFee: number;
  };
  features: {
    greenEnergyPercentage: number;
    billCredit: number;
    hasFreeTime: boolean;
    depositRequired: boolean;
    depositAmount: number;
  };
  planData: unknown; // Full original plan data as JSON
}

/**
 * Find a plan by name and provider using database
 */
export async function findPlanByNameAndProviderDB(
  planName: string, 
  providerName: string, 
  citySlug?: string
): Promise<DatabasePlan | null> {
  try {
    console.warn(`[PlanDatabaseService] Searching for plan: "${planName}" by "${providerName}" ${citySlug ? `in ${citySlug}` : ''}`);
    
    let query = `
      SELECT 
        ep.id,
        ep.name,
        ep.rate_500kwh,
        ep.rate_1000kwh,
        ep.rate_2000kwh,
        ep.rate_per_kwh,
        ep.contract_length_months,
        ep.contract_type,
        ep.early_termination_fee,
        ep.green_energy_percentage,
        ep.bill_credit,
        ep.has_free_time,
        ep.deposit_required,
        ep.deposit_amount,
        ep.plan_data,
        p.id as provider_id,
        p.name as provider_name,
        p.legal_name as provider_legal_name,
        p.logo_filename as provider_logo,
        c.id as city_id,
        c.name as city_name,
        c.slug as city_slug,
        t.id as tdsp_id,
        t.name as tdsp_name,
        t.short_name as tdsp_short_name
      FROM electricity_plans ep
      JOIN providers p ON ep.provider_id = p.id
      JOIN cities c ON ep.city_id = c.id
      JOIN tdsp t ON ep.tdsp_id = t.id
      WHERE LOWER(p.name) = LOWER($1)
    `;
    
    const params = [providerName];
    
    if (citySlug) {
      query += ' AND LOWER(c.slug) = LOWER($2)';
      params.push(citySlug);
    }
    
    // First try exact plan name match
    const exactQuery = query + ` AND LOWER(ep.name) = LOWER($${params.length + 1})`;
    const exactParams = [...params, planName];
    
    console.warn(`[PlanDatabaseService] Trying exact match query`);
    let results = await db.query(exactQuery, exactParams);
    
    // If no exact match, try fuzzy matching
    if (!results || results.length === 0) {
      console.warn(`[PlanDatabaseService] No exact match, trying fuzzy search...`);
      
      // Use ILIKE for partial matching (case-insensitive)
      const fuzzyQuery = query + ` AND ep.name ILIKE $${params.length + 1}`;
      const fuzzyParams = [...params, `%${planName}%`];
      
      results = await db.query(fuzzyQuery, fuzzyParams);
    }
    
    // If still no match, just find any plan from the provider in the city
    if (!results || results.length === 0) {
      console.warn(`[PlanDatabaseService] No fuzzy match, finding any plan from provider...`);
      results = await db.query(query + ' LIMIT 1', params);
    }
    
    if (results && results.length > 0) {
      const row = results[0];
      
      const plan: DatabasePlan = {
        id: row.id,
        name: row.name,
        provider: {
          id: row.provider_id,
          name: row.provider_name,
          legal_name: row.provider_legal_name,
          logo_filename: row.provider_logo
        },
        city: {
          id: row.city_id,
          name: row.city_name,
          slug: row.city_slug
        },
        tdsp: {
          id: row.tdsp_id,
          name: row.tdsp_name,
          short_name: row.tdsp_short_name
        },
        pricing: {
          rate500kWh: parseFloat(row.rate_500kwh),
          rate1000kWh: parseFloat(row.rate_1000kwh),
          rate2000kWh: parseFloat(row.rate_2000kwh),
          ratePerKwh: parseFloat(row.rate_per_kwh)
        },
        contract: {
          lengthMonths: row.contract_length_months,
          type: row.contract_type,
          earlyTerminationFee: parseFloat(row.early_termination_fee)
        },
        features: {
          greenEnergyPercentage: parseFloat(row.green_energy_percentage),
          billCredit: parseFloat(row.bill_credit),
          hasFreeTime: row.has_free_time,
          depositRequired: row.deposit_required,
          depositAmount: parseFloat(row.deposit_amount)
        },
        planData: row.plan_data
      };
      
      console.warn(`[PlanDatabaseService] Found plan: ${plan.name} with ID: ${plan.id}`);
      return plan;
    } else {
      console.warn(`[PlanDatabaseService] No plan found for "${planName}" by "${providerName}"`);
      return null;
    }
    
  } catch (error) {
    console.error(`[PlanDatabaseService] Database search error:`, error);
    return null;
  }
}

/**
 * Find a plan by its MongoDB ObjectId using database
 */
export async function findPlanByIdDB(planId: string): Promise<DatabasePlan | null> {
  try {
    console.warn(`[PlanDatabaseService] Searching for plan by ID: ${planId}`);
    
    const query = `
      SELECT 
        ep.id,
        ep.name,
        ep.rate_500kwh,
        ep.rate_1000kwh,
        ep.rate_2000kwh,
        ep.rate_per_kwh,
        ep.contract_length_months,
        ep.contract_type,
        ep.early_termination_fee,
        ep.green_energy_percentage,
        ep.bill_credit,
        ep.has_free_time,
        ep.deposit_required,
        ep.deposit_amount,
        ep.plan_data,
        p.id as provider_id,
        p.name as provider_name,
        p.legal_name as provider_legal_name,
        p.logo_filename as provider_logo,
        c.id as city_id,
        c.name as city_name,
        c.slug as city_slug,
        t.id as tdsp_id,
        t.name as tdsp_name,
        t.short_name as tdsp_short_name
      FROM electricity_plans ep
      JOIN providers p ON ep.provider_id = p.id
      JOIN cities c ON ep.city_id = c.id
      JOIN tdsp t ON ep.tdsp_id = t.id
      WHERE ep.id = $1
    `;
    
    const results = await db.query(query, [planId]);
    
    if (results && results.length > 0) {
      const row = results[0];
      
      const plan: DatabasePlan = {
        id: row.id,
        name: row.name,
        provider: {
          id: row.provider_id,
          name: row.provider_name,
          legal_name: row.provider_legal_name,
          logo_filename: row.provider_logo
        },
        city: {
          id: row.city_id,
          name: row.city_name,
          slug: row.city_slug
        },
        tdsp: {
          id: row.tdsp_id,
          name: row.tdsp_name,
          short_name: row.tdsp_short_name
        },
        pricing: {
          rate500kWh: parseFloat(row.rate_500kwh),
          rate1000kWh: parseFloat(row.rate_1000kwh),
          rate2000kWh: parseFloat(row.rate_2000kwh),
          ratePerKwh: parseFloat(row.rate_per_kwh)
        },
        contract: {
          lengthMonths: row.contract_length_months,
          type: row.contract_type,
          earlyTerminationFee: parseFloat(row.early_termination_fee)
        },
        features: {
          greenEnergyPercentage: parseFloat(row.green_energy_percentage),
          billCredit: parseFloat(row.bill_credit),
          hasFreeTime: row.has_free_time,
          depositRequired: row.deposit_required,
          depositAmount: parseFloat(row.deposit_amount)
        },
        planData: row.plan_data
      };
      
      console.warn(`[PlanDatabaseService] Found plan: ${plan.name} by ${plan.provider.name}`);
      return plan;
    } else {
      console.warn(`[PlanDatabaseService] No plan found with ID: ${planId}`);
      return null;
    }
    
  } catch (error) {
    console.error(`[PlanDatabaseService] Database ID search error:`, error);
    return null;
  }
}

/**
 * Get unique providers from database for a specific city
 */
export async function getUniqueProvidersDB(citySlug?: string): Promise<string[]> {
  try {
    console.warn(`[PlanDatabaseService] Getting unique providers ${citySlug ? `for ${citySlug}` : ''}`);
    
    let query = `
      SELECT DISTINCT p.name
      FROM providers p
      JOIN electricity_plans ep ON p.id = ep.provider_id
    `;
    
    const params: string[] = [];
    
    if (citySlug) {
      query += `
        JOIN cities c ON ep.city_id = c.id
        WHERE LOWER(c.slug) = LOWER($1)
      `;
      params.push(citySlug);
    }
    
    query += ' ORDER BY p.name';
    
    const results = await db.query(query, params);
    
    const providers = results.map(row => row.name);
    console.warn(`[PlanDatabaseService] Found ${providers.length} unique providers`);
    
    return providers;
  } catch (error) {
    console.error(`[PlanDatabaseService] Error getting unique providers:`, error);
    return [];
  }
}

/**
 * Check if database has plan data
 */
export async function hasPlansInDatabase(): Promise<boolean> {
  try {
    const results = await db.query('SELECT COUNT(*) as count FROM electricity_plans LIMIT 1');
    const count = results[0]?.count || 0;
    return count > 0;
  } catch (error) {
    console.error('[PlanDatabaseService] Error checking for plans:', error);
    return false;
  }
}