import type { APIRoute } from 'astro';
import { findPlanByNameAndProvider, getUniqueProviders } from '../../../lib/api/plan-data-service';
import { findPlanByNameAndProviderDB, getUniqueProvidersDB, hasPlansInDatabase } from '../../../lib/services/plan-database-service';

interface PlanSearchResult {
  id: string; // MongoDB ObjectId
  name: string;
  provider: string;
  rate?: number;
  termLength?: number;
}

export const GET: APIRoute = async ({ url, request }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const name = searchParams.get('name');
    const provider = searchParams.get('provider');
    const city = searchParams.get('city');

    if (!name || !provider) {
      return new Response(JSON.stringify({ 
        error: 'Both name and provider parameters are required' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Extract city from referer URL if not provided
    let citySlug = city || 'dallas'; // Default to Dallas
    
    try {
      const referer = request.headers.get('referer');
      if (referer && !city) {
        const refererUrl = new URL(referer);
        const pathParts = refererUrl.pathname.split('/');
        
        // Try to extract city from URL patterns like /electricity-plans/houston-tx/
        const cityIndex = pathParts.findIndex(part => part === 'electricity-plans');
        if (cityIndex !== -1 && pathParts[cityIndex + 1]) {
          const potentialCity = pathParts[cityIndex + 1].replace('-tx', '').replace('-texas', '');
          if (potentialCity && potentialCity !== 'plans') {
            citySlug = potentialCity;
          }
        }
      }
    } catch (e) {
      // Ignore referer parsing errors
    }

    console.log(`[API] Searching for plan: "${name}" by provider: "${provider}" in city: ${citySlug}`);

    // Check if database has plan data, use database if available, otherwise fall back to JSON files
    const hasDbPlans = await hasPlansInDatabase();
    
    let matchedPlan;
    if (hasDbPlans) {
      console.log('[API] Using database for plan search');
      const dbPlan = await findPlanByNameAndProviderDB(name, provider, citySlug);
      if (dbPlan) {
        // Convert database plan to expected format
        matchedPlan = {
          id: dbPlan.id,
          name: dbPlan.name,
          provider: {
            name: dbPlan.provider.name
          },
          pricing: {
            rate1000kWh: dbPlan.pricing.rate1000kWh
          },
          term: {
            length: dbPlan.contract.lengthMonths
          }
        };
      }
    } else {
      console.log('[API] Falling back to JSON file search');
      matchedPlan = await findPlanByNameAndProvider(name, provider, citySlug);
    }

    if (matchedPlan) {
      // Format the response to match expected structure
      const result: PlanSearchResult = {
        id: matchedPlan.id,
        name: matchedPlan.name,
        provider: matchedPlan.provider.name,
        rate: matchedPlan.pricing?.rate1000kWh,
        termLength: matchedPlan.term?.length
      };

      console.log(`[API] Found matching plan ID: ${result.id} for "${result.name}" by ${result.provider}`);
      
      return new Response(JSON.stringify([result]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      console.warn(`[API] No matching plan found for "${name}" by "${provider}" in ${citySlug}`);
      
      // Log available providers for debugging (use database if available)
      const availableProviders = hasDbPlans 
        ? await getUniqueProvidersDB(citySlug)
        : await getUniqueProviders(citySlug);
      console.log(`[API] Available providers in ${citySlug}: ${availableProviders.join(', ')}`);
      
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

  } catch (error) {
    console.error('[API] Plan search error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};