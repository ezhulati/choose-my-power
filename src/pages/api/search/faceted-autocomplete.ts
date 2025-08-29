/**
 * Faceted Search Autocomplete API
 * GET /api/search/faceted-autocomplete?q=query&city=dallas-tx&type=all&limit=8
 * Context-aware autocomplete for faceted navigation with filter suggestions
 */

import type { APIRoute } from 'astro';
import { validateCitySlug, getTdspFromCity, formatCityName } from '../../../config/tdsp-mapping';
import { filterMapper } from '../../../lib/api/filter-mapper';

interface FacetedAutocompleteSuggestion {
  type: 'filter' | 'provider' | 'city' | 'feature';
  value: string;
  label: string;
  description?: string;
  category: string;
  url: string;
  count?: number;
  icon?: string;
}

interface FacetedAutocompleteResponse {
  success: boolean;
  query: string;
  suggestions: FacetedAutocompleteSuggestion[];
  categories: {
    filters: FacetedAutocompleteSuggestion[];
    providers: FacetedAutocompleteSuggestion[];
    features: FacetedAutocompleteSuggestion[];
    cities: FacetedAutocompleteSuggestion[];
  };
  responseTime: number;
  cityContext?: {
    name: string;
    slug: string;
  };
  error?: string;
}

export const GET: APIRoute = async ({ request, url, clientAddress }) => {
  const startTime = Date.now();
  
  try {
    // Extract query parameters
    const searchParams = url.searchParams;
    const query = searchParams.get('q')?.trim()?.toLowerCase();
    const citySlug = searchParams.get('city');
    const type = searchParams.get('type') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20);

    // Validate query
    if (!query) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Query parameter "q" is required',
        query: '',
        suggestions: [],
        categories: { filters: [], providers: [], features: [], cities: [] },
        responseTime: Date.now() - startTime
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Skip very short queries
    if (query.length < 2) {
      return new Response(JSON.stringify({
        success: true,
        query,
        suggestions: [],
        categories: { filters: [], providers: [], features: [], cities: [] },
        responseTime: Date.now() - startTime
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300'
        }
      });
    }

    // Validate city context if provided
    let cityContext;
    if (citySlug) {
      if (validateCitySlug(citySlug)) {
        cityContext = {
          name: formatCityName(citySlug),
          slug: citySlug
        };
      }
    }

    // Generate suggestions based on query
    const suggestions = await generateFacetedSuggestions(query, citySlug, type, limit);
    
    // Categorize suggestions
    const categories = categorizeSuggestions(suggestions);

    const response: FacetedAutocompleteResponse = {
      success: true,
      query,
      suggestions: suggestions.slice(0, limit),
      categories,
      responseTime: Date.now() - startTime,
      cityContext
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'X-Query-Length': query.length.toString(),
      }
    });

  } catch (error) {
    console.error('Faceted autocomplete API error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Faceted autocomplete service temporarily unavailable',
      query: '',
      suggestions: [],
      categories: { filters: [], providers: [], features: [], cities: [] },
      responseTime: Date.now() - startTime
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Generate faceted search suggestions based on query
 */
async function generateFacetedSuggestions(
  query: string, 
  citySlug?: string, 
  type?: string, 
  limit = 8
): Promise<FacetedAutocompleteSuggestion[]> {
  const suggestions: FacetedAutocompleteSuggestion[] = [];

  // Filter suggestions (highest priority for faceted search)
  if (type === 'all' || type === 'filter') {
    suggestions.push(...getFilterSuggestions(query, citySlug));
  }

  // Provider suggestions
  if (type === 'all' || type === 'provider') {
    suggestions.push(...getProviderSuggestions(query, citySlug));
  }

  // Feature suggestions
  if (type === 'all' || type === 'feature') {
    suggestions.push(...getFeatureSuggestions(query, citySlug));
  }

  // City suggestions (if no city context)
  if (!citySlug && (type === 'all' || type === 'city')) {
    suggestions.push(...getCitySuggestions(query));
  }

  // Sort by relevance
  return suggestions
    .sort((a, b) => calculateRelevanceScore(b, query) - calculateRelevanceScore(a, query))
    .slice(0, limit);
}

/**
 * Get filter-related suggestions
 */
function getFilterSuggestions(query: string, citySlug?: string): FacetedAutocompleteSuggestion[] {
  const filters = [
    // Contract length filters
    { pattern: '12-month', label: '12 Month Plans', description: '12-month contract terms' },
    { pattern: '24-month', label: '24 Month Plans', description: '24-month contract terms' },
    { pattern: '36-month', label: '36 Month Plans', description: '36-month contract terms' },
    
    // Rate type filters
    { pattern: 'fixed-rate', label: 'Fixed Rate Plans', description: 'Rate stays the same' },
    { pattern: 'variable-rate', label: 'Variable Rate Plans', description: 'Rate can change monthly' },
    
    // Green energy filters
    { pattern: 'green-energy', label: 'Green Energy Plans', description: '100% renewable energy' },
    
    // Plan features
    { pattern: 'prepaid', label: 'Prepaid Plans', description: 'Pay before you use' },
    { pattern: 'no-deposit', label: 'No Deposit Plans', description: 'No security deposit required' },
    { pattern: 'free-nights', label: 'Free Nights Plans', description: 'Free electricity nights/weekends' },
    { pattern: 'bill-credit', label: 'Bill Credit Plans', description: 'Monthly usage credits' },
  ];

  return filters
    .filter(filter => 
      filter.label.toLowerCase().includes(query) ||
      filter.pattern.toLowerCase().includes(query) ||
      filter.description.toLowerCase().includes(query)
    )
    .map(filter => ({
      type: 'filter' as const,
      value: filter.pattern,
      label: filter.label,
      description: filter.description,
      category: 'Plan Filters',
      url: citySlug ? `/electricity-plans/${citySlug}/${filter.pattern}/` : `/electricity-plans/dallas-tx/${filter.pattern}/`,
      count: Math.floor(Math.random() * 200) + 50, // Mock count
      icon: getFilterIcon(filter.pattern)
    }));
}

/**
 * Get provider suggestions
 */
function getProviderSuggestions(query: string, citySlug?: string): FacetedAutocompleteSuggestion[] {
  const providers = [
    'Reliant Energy', 'TXU Energy', 'Direct Energy', 'NRG Energy',
    'Constellation', 'Green Mountain Energy', 'Cirro Energy', 'Gexa Energy',
    'Express Energy', 'Champion Energy', 'Ambit Energy', 'TriEagle Energy'
  ];

  return providers
    .filter(provider => provider.toLowerCase().includes(query))
    .map(provider => ({
      type: 'provider' as const,
      value: provider.toLowerCase().replace(/\s+/g, '-'),
      label: provider,
      description: `Plans from ${provider}`,
      category: 'Electricity Providers',
      url: citySlug ? `/electricity-plans/${citySlug}/${provider.toLowerCase().replace(/\s+/g, '-')}/` : `/providers/${provider.toLowerCase().replace(/\s+/g, '-')}/`,
      count: Math.floor(Math.random() * 50) + 10,
      icon: '⚡'
    }));
}

/**
 * Get feature suggestions
 */
function getFeatureSuggestions(query: string, citySlug?: string): FacetedAutocompleteSuggestion[] {
  const features = [
    { key: 'autopay', label: 'Auto Pay Required', desc: 'Plans requiring automatic payments' },
    { key: 'satisfaction', label: 'Satisfaction Guarantee', desc: 'Plans with satisfaction guarantees' },
    { key: 'time-of-use', label: 'Time of Use Plans', desc: 'Different rates by time of day' },
    { key: 'budget-billing', label: 'Budget Billing', desc: 'Level monthly payments' },
    { key: 'renewable', label: 'Renewable Energy', desc: 'Various renewable energy levels' }
  ];

  return features
    .filter(feature => 
      feature.label.toLowerCase().includes(query) ||
      feature.key.toLowerCase().includes(query) ||
      feature.desc.toLowerCase().includes(query)
    )
    .map(feature => ({
      type: 'feature' as const,
      value: feature.key,
      label: feature.label,
      description: feature.desc,
      category: 'Plan Features',
      url: citySlug ? `/electricity-plans/${citySlug}/${feature.key}/` : `/shop/${feature.key}/`,
      count: Math.floor(Math.random() * 100) + 20,
      icon: '🔋'
    }));
}

/**
 * Get city suggestions
 */
function getCitySuggestions(query: string): FacetedAutocompleteSuggestion[] {
  const majorCities = [
    'Dallas', 'Houston', 'Austin', 'San Antonio', 'Fort Worth',
    'Plano', 'Arlington', 'Corpus Christi', 'Garland', 'Irving'
  ];

  return majorCities
    .filter(city => city.toLowerCase().includes(query))
    .map(city => ({
      type: 'city' as const,
      value: `${city.toLowerCase()}-tx`,
      label: `${city}, Texas`,
      description: `Electricity plans in ${city}`,
      category: 'Texas Cities',
      url: `/texas/${city.toLowerCase()}/`,
      count: Math.floor(Math.random() * 300) + 100,
      icon: '📍'
    }));
}

/**
 * Categorize suggestions by type
 */
function categorizeSuggestions(suggestions: FacetedAutocompleteSuggestion[]) {
  return {
    filters: suggestions.filter(s => s.type === 'filter'),
    providers: suggestions.filter(s => s.type === 'provider'), 
    features: suggestions.filter(s => s.type === 'feature'),
    cities: suggestions.filter(s => s.type === 'city')
  };
}

/**
 * Calculate relevance score for sorting
 */
function calculateRelevanceScore(suggestion: FacetedAutocompleteSuggestion, query: string): number {
  let score = 0;
  
  // Exact match gets highest score
  if (suggestion.label.toLowerCase() === query) score += 100;
  
  // Starts with query gets high score
  if (suggestion.label.toLowerCase().startsWith(query)) score += 50;
  
  // Contains query gets medium score
  if (suggestion.label.toLowerCase().includes(query)) score += 25;
  
  // Value contains query gets some score
  if (suggestion.value.toLowerCase().includes(query)) score += 10;
  
  // Description contains query gets minimal score
  if (suggestion.description?.toLowerCase().includes(query)) score += 5;
  
  // Boost popular filters
  if (suggestion.type === 'filter') {
    const popularFilters = ['12-month', 'fixed-rate', 'green-energy', 'no-deposit'];
    if (popularFilters.includes(suggestion.value)) score += 20;
  }
  
  return score;
}

/**
 * Get icon for filter type
 */
function getFilterIcon(pattern: string): string {
  const icons: Record<string, string> = {
    '12-month': '📅',
    '24-month': '📅',
    '36-month': '📅',
    'fixed-rate': '📌',
    'variable-rate': '📈',
    'green-energy': '🌱',
    'prepaid': '💳',
    'no-deposit': '✅',
    'free-nights': '🌙',
    'bill-credit': '💰'
  };
  
  return icons[pattern] || '🔍';
}