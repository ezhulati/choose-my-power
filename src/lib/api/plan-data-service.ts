/**
 * Plan Data Service
 * 
 * Centralized service to fetch real plan data from generated JSON files.
 * This service provides accurate MongoDB ObjectIds for electricity plans,
 * ensuring the correct plan IDs are used throughout the application.
 */

import { promises as fs } from 'fs';
import path from 'path';

interface Plan {
  id: string; // MongoDB ObjectId
  name: string;
  provider: {
    name: string;
    logo?: string;
    rating?: number;
    reviewCount?: number;
  };
  pricing?: {
    rate500kWh: number;
    rate1000kWh: number;
    rate2000kWh: number;
    ratePerKwh: number;
  };
  term?: {
    length: number;
    unit: string;
  };
  [key: string]: any; // Allow additional properties
}

interface CityData {
  citySlug: string;
  cityName: string;
  tdsp?: any;
  filters?: {
    'no-filters'?: {
      plans: Plan[];
    };
    [key: string]: any;
  };
  plans?: Plan[]; // Fallback for different structure
  [key: string]: any;
}

// Simple in-memory cache to avoid repeated file reads
const cityDataCache = new Map<string, CityData>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

/**
 * Load city data from generated JSON file
 * @param citySlug - The city slug (e.g., 'dallas', 'houston')
 * @returns City data including all plans
 */
export async function loadCityData(citySlug: string): Promise<CityData | null> {
  try {
    // Check cache first
    const cached = cityDataCache.get(citySlug);
    const cachedTime = cacheTimestamps.get(citySlug);
    
    if (cached && cachedTime && (Date.now() - cachedTime) < CACHE_TTL) {
      console.log(`[PlanDataService] Using cached data for city: ${citySlug}`);
      return cached;
    }

    // Construct file path - handle both server and build contexts
    const dataDir = process.env.NODE_ENV === 'production' 
      ? path.join(process.cwd(), 'dist', 'data', 'generated')
      : path.join(process.cwd(), 'src', 'data', 'generated');
    
    const filePath = path.join(dataDir, `${citySlug}.json`);
    
    console.log(`[PlanDataService] Loading city data from: ${filePath}`);
    
    // Read and parse JSON file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const cityData = JSON.parse(fileContent) as CityData;
    
    // Update cache
    cityDataCache.set(citySlug, cityData);
    cacheTimestamps.set(citySlug, Date.now());
    
    // Get plans from the correct location
    const plans = cityData.filters?.['no-filters']?.plans || cityData.plans || [];
    console.log(`[PlanDataService] Loaded ${plans.length} plans for ${citySlug}`);
    
    return cityData;
  } catch (error) {
    console.error(`[PlanDataService] Error loading city data for ${citySlug}:`, error);
    return null;
  }
}

/**
 * Find a plan by name and provider
 * @param name - Plan name
 * @param provider - Provider name
 * @param citySlug - Optional city slug (defaults to 'dallas')
 * @returns Plan with MongoDB ObjectId or null
 */
export async function findPlanByNameAndProvider(
  name: string, 
  provider: string, 
  citySlug: string = 'dallas'
): Promise<Plan | null> {
  try {
    console.log(`[PlanDataService] Searching for plan: "${name}" by "${provider}" in ${citySlug}`);
    
    const cityData = await loadCityData(citySlug);
    
    if (!cityData) {
      console.warn(`[PlanDataService] No city data found for ${citySlug}`);
      return null;
    }
    
    // Get plans from the correct location in the data structure
    const plans = cityData.filters?.['no-filters']?.plans || cityData.plans || [];
    
    if (plans.length === 0) {
      console.warn(`[PlanDataService] No plans found for ${citySlug}`);
      return null;
    }
    
    // Try exact match first
    let matchedPlan = plans.find(plan => 
      plan.name?.toLowerCase() === name.toLowerCase() && 
      plan.provider?.name?.toLowerCase() === provider.toLowerCase()
    );
    
    // If no exact match, try fuzzy matching
    if (!matchedPlan) {
      console.log(`[PlanDataService] No exact match, trying fuzzy search...`);
      
      // Normalize names for comparison
      const normalizedName = name.toLowerCase().replace(/\s+/g, ' ').trim();
      const normalizedProvider = provider.toLowerCase().replace(/\s+/g, ' ').trim();
      
      matchedPlan = plans.find(plan => {
        const planName = plan.name?.toLowerCase().replace(/\s+/g, ' ').trim();
        const planProvider = plan.provider?.name?.toLowerCase().replace(/\s+/g, ' ').trim();
        
        // Check if provider matches and plan name is similar
        if (planProvider === normalizedProvider) {
          // Check for partial matches
          if (planName?.includes(normalizedName) || normalizedName.includes(planName || '')) {
            return true;
          }
          
          // Check if key words match
          const nameWords = normalizedName.split(' ');
          const planWords = planName?.split(' ') || [];
          const matchingWords = nameWords.filter(word => 
            planWords.some(planWord => planWord.includes(word) || word.includes(planWord))
          );
          
          return matchingWords.length >= Math.min(2, nameWords.length - 1);
        }
        
        return false;
      });
    }
    
    // If still no match, try to find any plan from the same provider
    if (!matchedPlan) {
      console.log(`[PlanDataService] No fuzzy match, finding any plan from provider...`);
      matchedPlan = plans.find(plan => 
        plan.provider?.name?.toLowerCase() === provider.toLowerCase()
      );
    }
    
    if (matchedPlan) {
      console.log(`[PlanDataService] Found plan: ${matchedPlan.name} with ID: ${matchedPlan.id}`);
      
      // Validate MongoDB ObjectId format
      if (!isValidMongoId(matchedPlan.id)) {
        console.warn(`[PlanDataService] Invalid MongoDB ID format: ${matchedPlan.id}`);
      }
      
      return matchedPlan;
    } else {
      console.warn(`[PlanDataService] No plan found for "${name}" by "${provider}"`);
      return null;
    }
  } catch (error) {
    console.error(`[PlanDataService] Error searching for plan:`, error);
    return null;
  }
}

/**
 * Find a plan by its MongoDB ObjectId
 * @param planId - MongoDB ObjectId
 * @param citySlug - Optional city slug
 * @returns Plan or null
 */
export async function findPlanById(
  planId: string, 
  citySlug: string = 'dallas'
): Promise<Plan | null> {
  try {
    console.log(`[PlanDataService] Searching for plan by ID: ${planId} in ${citySlug}`);
    
    const cityData = await loadCityData(citySlug);
    
    if (!cityData) {
      console.warn(`[PlanDataService] No city data found for ${citySlug}`);
      return null;
    }
    
    // Get plans from the correct location in the data structure
    const plans = cityData.filters?.['no-filters']?.plans || cityData.plans || [];
    
    if (plans.length === 0) {
      console.warn(`[PlanDataService] No plans found for ${citySlug}`);
      return null;
    }
    
    const plan = plans.find(p => p.id === planId);
    
    if (plan) {
      console.log(`[PlanDataService] Found plan: ${plan.name} by ${plan.provider.name}`);
      return plan;
    } else {
      console.warn(`[PlanDataService] No plan found with ID: ${planId}`);
      return null;
    }
  } catch (error) {
    console.error(`[PlanDataService] Error searching for plan by ID:`, error);
    return null;
  }
}

/**
 * Get all unique providers from a city's plan data
 * @param citySlug - City slug
 * @returns Array of unique provider names
 */
export async function getUniqueProviders(citySlug: string = 'dallas'): Promise<string[]> {
  try {
    const cityData = await loadCityData(citySlug);
    
    if (!cityData || !cityData.plans) {
      return [];
    }
    
    const providers = new Set<string>();
    plans.forEach(plan => {
      if (plan.provider?.name) {
        providers.add(plan.provider.name);
      }
    });
    
    const uniqueProviders = Array.from(providers).sort();
    console.log(`[PlanDataService] Found ${uniqueProviders.length} unique providers in ${citySlug}`);
    
    return uniqueProviders;
  } catch (error) {
    console.error(`[PlanDataService] Error getting unique providers:`, error);
    return [];
  }
}

/**
 * Validate MongoDB ObjectId format
 * @param id - String to validate
 * @returns true if valid MongoDB ObjectId format
 */
export function isValidMongoId(id: string): boolean {
  return /^[a-f0-9]{24}$/i.test(id);
}

/**
 * Clear the cache (useful for testing or when data is updated)
 */
export function clearCache(): void {
  cityDataCache.clear();
  cacheTimestamps.clear();
  console.log('[PlanDataService] Cache cleared');
}