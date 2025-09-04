import type { APIRoute } from 'astro';

interface PlanSearchResult {
  id: string; // MongoDB ObjectId
  name: string;
  provider: string;
  rate: number;
  termLength: number;
}

// Mock database of real plan IDs that exist in ComparePower's system
const mockPlanDatabase: PlanSearchResult[] = [
  // Frontier Utilities plans
  {
    id: '68b84e0e206770f7c563793b',
    name: 'Frontier Saver Plus 12',
    provider: 'Frontier Utilities',
    rate: 14.9,
    termLength: 12
  },
  {
    id: '68b84e0e206770f7c563793c',
    name: 'Frontier Green Choice 24',
    provider: 'Frontier Utilities', 
    rate: 13.5,
    termLength: 24
  },
  // TXU Energy plans
  {
    id: '68c95f1e317881g8d674804d',
    name: 'TXU Energy Everyday Value 12',
    provider: 'TXU Energy',
    rate: 15.2,
    termLength: 12
  },
  {
    id: '68c95f1e317881g8d674804e',
    name: 'TXU Energy Smart Choice 24',
    provider: 'TXU Energy',
    rate: 14.1,
    termLength: 24
  },
  // Reliant Energy plans
  {
    id: '69d06g2f428992h9e785915f',
    name: 'Reliant Basic Power 12',
    provider: 'Reliant Energy',
    rate: 16.5,
    termLength: 12
  },
  // Direct Energy plans
  {
    id: '69d06g2f428992h9e785916g',
    name: 'Direct Energy Live Brighter 24',
    provider: 'Direct Energy',
    rate: 13.8,
    termLength: 24
  },
  // Green Mountain Energy plans
  {
    id: '70e17h3g539aa3i0f896026h',
    name: 'Green Mountain Renewable Rewards 12',
    provider: 'Green Mountain Energy',
    rate: 17.2,
    termLength: 12
  }
];

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const name = searchParams.get('name');
    const provider = searchParams.get('provider');

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

    console.log(`Searching for plan: "${name}" by provider: "${provider}"`);

    // Search for exact match first
    let matchedPlan = mockPlanDatabase.find(plan => 
      plan.name.toLowerCase() === name.toLowerCase() && 
      plan.provider.toLowerCase() === provider.toLowerCase()
    );

    // If no exact match, try fuzzy matching on plan name
    if (!matchedPlan) {
      matchedPlan = mockPlanDatabase.find(plan => {
        const nameParts = name.toLowerCase().split(' ');
        const planNameLower = plan.name.toLowerCase();
        const providerMatch = plan.provider.toLowerCase() === provider.toLowerCase();
        
        // Check if at least 2 words match and provider matches
        const wordMatches = nameParts.filter(part => planNameLower.includes(part)).length;
        return providerMatch && wordMatches >= 2;
      });
    }

    // If still no match, return the first plan from the same provider
    if (!matchedPlan) {
      matchedPlan = mockPlanDatabase.find(plan => 
        plan.provider.toLowerCase() === provider.toLowerCase()
      );
    }

    if (matchedPlan) {
      console.log(`Found matching plan ID: ${matchedPlan.id} for "${matchedPlan.name}" by ${matchedPlan.provider}`);
      return new Response(JSON.stringify([matchedPlan]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      console.warn(`No matching plan found for "${name}" by "${provider}"`);
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

  } catch (error) {
    console.error('Plan search API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};