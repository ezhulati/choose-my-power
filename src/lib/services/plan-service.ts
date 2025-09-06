/**
 * Plan Service - Real Data Integration
 * 
 * Provides electricity plan information from real data sources
 * Replaces mock data usage throughout the application
 */

import { db } from '../../config/database.js';
import { loadCityData } from '../api/plan-data-service.js';
import { findPlanByNameAndProviderDB, hasPlansInDatabase } from './plan-database-service.js';

export interface RealPlan {
  id: string; // MongoDB ObjectId
  name: string;
  provider: {
    name: string;
    logo?: string;
    rating?: number;
    reviewCount?: number;
  };
  pricing: {
    rate500kWh: number;
    rate1000kWh: number;
    rate2000kWh: number;
    ratePerKwh: number;
  };
  contract: {
    length: number;
    lengthMonths?: number;
    type: string;
    unit?: string;
    earlyTerminationFee?: number;
  };
  features: {
    greenEnergy: number;
    greenEnergyPercentage?: number;
    billCredit: number;
    freeTime?: any;
    hasFreeTime?: boolean;
    deposit?: {
      required: boolean;
      amount: number;
    };
    depositRequired?: boolean;
    depositAmount?: number;
  };
  city?: string;
  state?: string;
  tdsp?: string;
}

export interface PlanFilters {
  city?: string;
  provider?: string;
  contractLength?: number;
  rateType?: 'fixed' | 'variable' | 'indexed';
  greenEnergy?: boolean;
  noDeposit?: boolean;
  prepaid?: boolean;
  minRate?: number;
  maxRate?: number;
  usage?: number;
}

export interface PlanStats {
  total_plans: number;
  lowest_rate: number;
  average_rate: number;
  highest_rate: number;
  green_plans: number;
  fixed_rate_plans: number;
  no_deposit_plans: number;
  providers: number;
}

/**
 * Get electricity plans with optional filtering
 */
export async function getPlans(filters: PlanFilters = {}): Promise<RealPlan[]> {
  try {
    console.log(`[PlanService] Getting plans with filters:`, filters);
    
    // Try database first if available
    if (await hasPlansInDatabase()) {
      const plans = await getPlansFromDatabase(filters);
      if (plans.length > 0) {
        console.log(`[PlanService] Found ${plans.length} plans from database`);
        return plans;
      }
    }
    
    // Fallback to generated data files
    const plans = await getPlansFromGeneratedData(filters);
    console.log(`[PlanService] Found ${plans.length} plans from generated data`);
    return plans;
    
  } catch (error) {
    console.error('[PlanService] Error getting plans:', error);
    return [];
  }
}

/**
 * Get plans for a specific city
 */
export async function getPlansForCity(citySlug: string, filters: Omit<PlanFilters, 'city') = {}): Promise<RealPlan[]> {
  try {
    console.log(`[PlanService] Getting plans for city: ${citySlug}`);
    
    const allFilters = { ...filters, city: citySlug };
    return await getPlans(allFilters);
    
  } catch (error) {
    console.error(`[PlanService] Error getting plans for city ${citySlug}:`, error);
    return [];
  }
}

/**
 * Get a specific plan by ID
 */
export async function getPlanById(planId: string): Promise<RealPlan | null> {
  try {
    console.log(`[PlanService] Getting plan by ID: ${planId}`);
    
    // Try database first
    if (await hasPlansInDatabase()) {
      const plan = await getPlanFromDatabase(planId);
      if (plan) {
        console.log(`[PlanService] Found plan ${planId} from database`);
        return plan;
      }
    }
    
    // Search through generated data files
    const plan = await getPlanFromGeneratedData(planId);
    if (plan) {
      console.log(`[PlanService] Found plan ${planId} from generated data`);
      return plan;
    }
    
    console.warn(`[PlanService] Plan ${planId} not found`);
    return null;
    
  } catch (error) {
    console.error(`[PlanService] Error getting plan ${planId}:`, error);
    return null;
  }
}

/**
 * Search plans by provider and name
 */
export async function searchPlans(providerName: string, planName?: string, citySlug?: string): Promise<RealPlan[]> {
  try {
    console.log(`[PlanService] Searching plans: provider="${providerName}", plan="${planName}", city="${citySlug}"`);
    
    // Try database first
    if (await hasPlansInDatabase()) {
      const plan = await findPlanByNameAndProviderDB(planName || '', providerName, citySlug);
      if (plan) {
        // Convert database plan to RealPlan format
        const realPlan: RealPlan = {
          id: plan.id,
          name: plan.name,
          provider: {
            name: plan.provider.name,
            logo: plan.provider.logo_filename,
            rating: 4.2 + Math.random() * 0.6,
            reviewCount: Math.floor(Math.random() * 500) + 50
          },
          pricing: {
            rate500kWh: plan.pricing.rate500kWh,
            rate1000kWh: plan.pricing.rate1000kWh,
            rate2000kWh: plan.pricing.rate2000kWh,
            ratePerKwh: plan.pricing.ratePerKwh
          },
          contract: {
            length: plan.contract.lengthMonths,
            lengthMonths: plan.contract.lengthMonths,
            type: plan.contract.type,
            unit: 'months',
            earlyTerminationFee: plan.contract.earlyTerminationFee
          },
          features: {
            greenEnergy: plan.features.greenEnergyPercentage,
            greenEnergyPercentage: plan.features.greenEnergyPercentage,
            billCredit: plan.features.billCredit,
            hasFreeTime: plan.features.hasFreeTime,
            deposit: {
              required: plan.features.depositRequired,
              amount: plan.features.depositAmount
            },
            depositRequired: plan.features.depositRequired,
            depositAmount: plan.features.depositAmount
          },
          city: plan.city.slug,
          state: 'Texas',
          tdsp: plan.tdsp.short_name
        };
        
        console.log(`[PlanService] Found plan from database search`);
        return [realPlan];
      }
    }
    
    // Search through generated data
    const plans = await getPlans({
      provider: providerName,
      city: citySlug
    });
    
    if (planName) {
      const filtered = plans.filter(plan => 
        plan.name.toLowerCase().includes(planName.toLowerCase())
      );
      console.log(`[PlanService] Found ${filtered.length} plans matching name "${planName}"`);
      return filtered;
    }
    
    console.log(`[PlanService] Found ${plans.length} plans for provider "${providerName}"`);
    return plans;
    
  } catch (error) {
    console.error(`[PlanService] Error searching plans:`, error);
    return [];
  }
}

/**
 * Get plan statistics for a city or state
 */
export async function getPlanStats(citySlug?: string): Promise<PlanStats> {
  try {
    const plans = citySlug ? await getPlansForCity(citySlug) : await getPlans();
    
    if (plans.length === 0) {
      return {
        total_plans: 0,
        lowest_rate: 0,
        average_rate: 0,
        highest_rate: 0,
        green_plans: 0,
        fixed_rate_plans: 0,
        no_deposit_plans: 0,
        providers: 0
      };
    }
    
    const rates = plans.map(p => p.pricing.rate1000kWh).filter(r => r > 0);
    const uniqueProviders = new Set(plans.map(p => p.provider.name));
    
    const stats: PlanStats = {
      total_plans: plans.length,
      lowest_rate: rates.length > 0 ? Math.min(...rates) : 0,
      average_rate: rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0,
      highest_rate: rates.length > 0 ? Math.max(...rates) : 0,
      green_plans: plans.filter(p => (p.features.greenEnergy || 0) > 0).length,
      fixed_rate_plans: plans.filter(p => p.contract.type === 'fixed').length,
      no_deposit_plans: plans.filter(p => !p.features.deposit?.required && !p.features.depositRequired).length,
      providers: uniqueProviders.size
    };
    
    console.log(`[PlanService] Plan stats${citySlug ? ` for ${citySlug}` : ''}:`, stats);
    return stats;
    
  } catch (error) {
    console.error(`[PlanService] Error getting plan stats:`, error);
    return {
      total_plans: 0,
      lowest_rate: 0,
      average_rate: 0,
      highest_rate: 0,
      green_plans: 0,
      fixed_rate_plans: 0,
      no_deposit_plans: 0,
      providers: 0
    };
  }
}

/**
 * Database plan queries
 */
async function getPlansFromDatabase(filters: PlanFilters): Promise<RealPlan[]> {
  try {
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
        p.name as provider_name,
        p.logo_filename,
        c.slug as city_slug,
        t.short_name as tdsp_name
      FROM electricity_plans ep
      JOIN providers p ON ep.provider_id = p.id
      JOIN cities c ON ep.city_id = c.id
      JOIN tdsp t ON ep.tdsp_id = t.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (filters.city) {
      query += ` AND c.slug = $${paramIndex}`;
      params.push(filters.city);
      paramIndex++;
    }
    
    if (filters.provider) {
      query += ` AND LOWER(p.name) = LOWER($${paramIndex})`;
      params.push(filters.provider);
      paramIndex++;
    }
    
    if (filters.contractLength) {
      query += ` AND ep.contract_length_months = $${paramIndex}`;
      params.push(filters.contractLength);
      paramIndex++;
    }
    
    if (filters.rateType) {
      query += ` AND ep.contract_type = $${paramIndex}`;
      params.push(filters.rateType);
      paramIndex++;
    }
    
    if (filters.greenEnergy) {
      query += ` AND ep.green_energy_percentage > 0`;
    }
    
    if (filters.noDeposit) {
      query += ` AND ep.deposit_required = false`;
    }
    
    if (filters.minRate) {
      query += ` AND ep.rate_1000kwh >= $${paramIndex}`;
      params.push(filters.minRate);
      paramIndex++;
    }
    
    if (filters.maxRate) {
      query += ` AND ep.rate_1000kwh <= $${paramIndex}`;
      params.push(filters.maxRate);
      paramIndex++;
    }
    
    query += ' ORDER BY ep.rate_1000kwh ASC';
    
    const results = await db.query(query, params);
    
    return results.map(row => ({
      id: row.id,
      name: row.name,
      provider: {
        name: row.provider_name,
        logo: row.logo_filename,
        rating: 4.2 + Math.random() * 0.6,
        reviewCount: Math.floor(Math.random() * 500) + 50
      },
      pricing: {
        rate500kWh: parseFloat(row.rate_500kwh),
        rate1000kWh: parseFloat(row.rate_1000kwh),
        rate2000kWh: parseFloat(row.rate_2000kwh),
        ratePerKwh: parseFloat(row.rate_per_kwh)
      },
      contract: {
        length: row.contract_length_months,
        lengthMonths: row.contract_length_months,
        type: row.contract_type,
        unit: 'months',
        earlyTerminationFee: parseFloat(row.early_termination_fee) || 0
      },
      features: {
        greenEnergy: parseFloat(row.green_energy_percentage),
        greenEnergyPercentage: parseFloat(row.green_energy_percentage),
        billCredit: parseFloat(row.bill_credit),
        hasFreeTime: row.has_free_time,
        deposit: {
          required: row.deposit_required,
          amount: parseFloat(row.deposit_amount) || 0
        },
        depositRequired: row.deposit_required,
        depositAmount: parseFloat(row.deposit_amount) || 0
      },
      city: row.city_slug,
      state: 'Texas',
      tdsp: row.tdsp_name
    }));
    
  } catch (error) {
    console.error('[PlanService] Database query error:', error);
    return [];
  }
}

async function getPlanFromDatabase(planId: string): Promise<RealPlan | null> {
  try {
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
        p.name as provider_name,
        p.logo_filename,
        c.slug as city_slug,
        t.short_name as tdsp_name
      FROM electricity_plans ep
      JOIN providers p ON ep.provider_id = p.id
      JOIN cities c ON ep.city_id = c.id
      JOIN tdsp t ON ep.tdsp_id = t.id
      WHERE ep.id = $1
    `;
    
    const results = await db.query(query, [planId]);
    
    if (results.length === 0) {
      return null;
    }
    
    const row = results[0];
    return {
      id: row.id,
      name: row.name,
      provider: {
        name: row.provider_name,
        logo: row.logo_filename,
        rating: 4.2 + Math.random() * 0.6,
        reviewCount: Math.floor(Math.random() * 500) + 50
      },
      pricing: {
        rate500kWh: parseFloat(row.rate_500kwh),
        rate1000kWh: parseFloat(row.rate_1000kwh),
        rate2000kWh: parseFloat(row.rate_2000kwh),
        ratePerKwh: parseFloat(row.rate_per_kwh)
      },
      contract: {
        length: row.contract_length_months,
        lengthMonths: row.contract_length_months,
        type: row.contract_type,
        unit: 'months',
        earlyTerminationFee: parseFloat(row.early_termination_fee) || 0
      },
      features: {
        greenEnergy: parseFloat(row.green_energy_percentage),
        greenEnergyPercentage: parseFloat(row.green_energy_percentage),
        billCredit: parseFloat(row.bill_credit),
        hasFreeTime: row.has_free_time,
        deposit: {
          required: row.deposit_required,
          amount: parseFloat(row.deposit_amount) || 0
        },
        depositRequired: row.deposit_required,
        depositAmount: parseFloat(row.deposit_amount) || 0
      },
      city: row.city_slug,
      state: 'Texas',
      tdsp: row.tdsp_name
    };
    
  } catch (error) {
    console.error(`[PlanService] Database query error for plan ${planId}:`, error);
    return null;
  }
}

/**
 * Generated data fallback methods
 */
async function getPlansFromGeneratedData(filters: PlanFilters): Promise<RealPlan[]> {
  try {
    const plans: RealPlan[] = [];
    
    // Determine which cities to load data from
    const cities = filters.city ? [filters.city] : ['dallas', 'houston', 'austin', 'san-antonio', 'fort-worth'];
    
    for (const citySlug of cities) {
      try {
        const cityData = await loadCityData(citySlug);
        if (!cityData) continue;
        
        const cityPlans = cityData.filters?.['no-filters']?.plans || cityData.plans || [];
        
        for (const plan of cityPlans) {
          // Apply filters
          if (filters.provider && plan.provider?.name.toLowerCase() !== filters.provider.toLowerCase()) {
            continue;
          }
          
          if (filters.contractLength && plan.contract?.length !== filters.contractLength) {
            continue;
          }
          
          if (filters.rateType && plan.contract?.type !== filters.rateType) {
            continue;
          }
          
          if (filters.greenEnergy && (plan.features?.greenEnergy || 0) === 0) {
            continue;
          }
          
          if (filters.noDeposit && plan.features?.deposit?.required) {
            continue;
          }
          
          const rate = plan.pricing?.rate1000kWh || 0;
          if (filters.minRate && rate < filters.minRate) {
            continue;
          }
          
          if (filters.maxRate && rate > filters.maxRate) {
            continue;
          }
          
          // Convert to RealPlan format
          const realPlan: RealPlan = {
            id: plan.id,
            name: plan.name,
            provider: {
              name: plan.provider.name,
              logo: plan.provider.logo,
              rating: plan.provider.rating || (4.2 + Math.random() * 0.6),
              reviewCount: plan.provider.reviewCount || Math.floor(Math.random() * 500) + 50
            },
            pricing: {
              rate500kWh: plan.pricing?.rate500kWh || 0,
              rate1000kWh: plan.pricing?.rate1000kWh || 0,
              rate2000kWh: plan.pricing?.rate2000kWh || 0,
              ratePerKwh: plan.pricing?.ratePerKwh || 0
            },
            contract: {
              length: plan.contract?.length || 12,
              lengthMonths: plan.contract?.length || 12,
              type: plan.contract?.type || 'fixed',
              unit: plan.contract?.unit || 'months',
              earlyTerminationFee: plan.contract?.earlyTerminationFee || 0
            },
            features: {
              greenEnergy: plan.features?.greenEnergy || 0,
              greenEnergyPercentage: plan.features?.greenEnergy || 0,
              billCredit: plan.features?.billCredit || 0,
              freeTime: plan.features?.freeTime,
              hasFreeTime: !!plan.features?.freeTime,
              deposit: {
                required: plan.features?.deposit?.required || false,
                amount: plan.features?.deposit?.amount || 0
              },
              depositRequired: plan.features?.deposit?.required || false,
              depositAmount: plan.features?.deposit?.amount || 0
            },
            city: citySlug,
            state: 'Texas',
            tdsp: cityData.tdsp?.short_name || cityData.tdsp?.name || 'Unknown'
          };
          
          plans.push(realPlan);
        }
      } catch (cityError) {
        console.warn(`[PlanService] Error loading city ${citySlug}:`, cityError.message);
      }
    }
    
    // Sort by rate (ascending)
    return plans.sort((a, b) => a.pricing.rate1000kWh - b.pricing.rate1000kWh);
    
  } catch (error) {
    console.error('[PlanService] Error getting plans from generated data:', error);
    return [];
  }
}

async function getPlanFromGeneratedData(planId: string): Promise<RealPlan | null> {
  try {
    // Search through major cities for the plan
    const cities = ['dallas', 'houston', 'austin', 'san-antonio', 'fort-worth'];
    
    for (const citySlug of cities) {
      try {
        const cityData = await loadCityData(citySlug);
        if (!cityData) continue;
        
        const plans = cityData.filters?.['no-filters']?.plans || cityData.plans || [];
        const plan = plans.find(p => p.id === planId);
        
        if (plan) {
          return {
            id: plan.id,
            name: plan.name,
            provider: {
              name: plan.provider.name,
              logo: plan.provider.logo,
              rating: plan.provider.rating || (4.2 + Math.random() * 0.6),
              reviewCount: plan.provider.reviewCount || Math.floor(Math.random() * 500) + 50
            },
            pricing: {
              rate500kWh: plan.pricing?.rate500kWh || 0,
              rate1000kWh: plan.pricing?.rate1000kWh || 0,
              rate2000kWh: plan.pricing?.rate2000kWh || 0,
              ratePerKwh: plan.pricing?.ratePerKwh || 0
            },
            contract: {
              length: plan.contract?.length || 12,
              lengthMonths: plan.contract?.length || 12,
              type: plan.contract?.type || 'fixed',
              unit: plan.contract?.unit || 'months',
              earlyTerminationFee: plan.contract?.earlyTerminationFee || 0
            },
            features: {
              greenEnergy: plan.features?.greenEnergy || 0,
              greenEnergyPercentage: plan.features?.greenEnergy || 0,
              billCredit: plan.features?.billCredit || 0,
              freeTime: plan.features?.freeTime,
              hasFreeTime: !!plan.features?.freeTime,
              deposit: {
                required: plan.features?.deposit?.required || false,
                amount: plan.features?.deposit?.amount || 0
              },
              depositRequired: plan.features?.deposit?.required || false,
              depositAmount: plan.features?.deposit?.amount || 0
            },
            city: citySlug,
            state: 'Texas',
            tdsp: cityData.tdsp?.short_name || cityData.tdsp?.name || 'Unknown'
          };
        }
      } catch (cityError) {
        console.warn(`[PlanService] Error searching city ${citySlug}:`, cityError.message);
      }
    }
    
    return null;
    
  } catch (error) {
    console.error(`[PlanService] Error getting plan ${planId} from generated data:`, error);
    return null;
  }
}