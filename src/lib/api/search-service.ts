/**
 * Search & Autocomplete Service for ChooseMyPower
 * Comprehensive search functionality for cities, providers, and plan features
 * Features:
 * - Fuzzy matching for 881 Texas cities
 * - Provider search with autocomplete
 * - Plan feature search and filtering
 * - Search analytics and popular queries
 * - Search suggestions and typo correction
 */

import Fuse from 'fuse.js';
import type { SearchHistory, CityAnalytics } from '../database/schema';
import { planRepository } from '../database/plan-repository';

export interface SearchResult {
  id: string;
  type: 'city' | 'provider' | 'plan_feature' | 'zip_code';
  title: string;
  subtitle?: string;
  url: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface SearchSuggestion {
  query: string;
  type: 'popular' | 'recent' | 'correction' | 'completion';
  count?: number;
  score: number;
}

export interface CitySearchData {
  slug: string;
  name: string;
  state: string;
  tdsp_duns: string;
  zone: string;
  zip_codes: string[];
  population?: number;
  is_major_city: boolean;
  average_rate?: number;
  total_plans?: number;
}

export interface ProviderSearchData {
  name: string;
  legal_name: string;
  logo_url?: string;
  rating?: number;
  total_plans: number;
  service_areas: string[];
  specialties: string[];
}

export interface SearchFilters {
  type?: string;
  zone?: string;
  minPlans?: number;
  maxRate?: number;
  greenEnergyOnly?: boolean;
}

export class SearchService {
  private citySearchIndex: Fuse<CitySearchData> | null = null;
  private providerSearchIndex: Fuse<ProviderSearchData> | null = null;
  private planFeatureSearchIndex: Fuse<any> | null = null;
  private popularQueries: Map<string, number> = new Map();
  private searchCache: Map<string, SearchResult[]> = new Map();
  private lastIndexUpdate = 0;
  private readonly CACHE_TTL = 300000; // 5 minutes
  private readonly INDEX_UPDATE_INTERVAL = 3600000; // 1 hour

  constructor() {
    this.initializeSearchIndexes();
    
    // Update indexes periodically
    setInterval(() => {
      this.refreshSearchIndexes();
    }, this.INDEX_UPDATE_INTERVAL);
  }

  /**
   * Initialize search indexes with data
   */
  private async initializeSearchIndexes(): Promise<void> {
    try {
      // Initialize city search index
      await this.initializeCityIndex();
      
      // Initialize provider search index
      await this.initializeProviderIndex();
      
      // Initialize plan feature index
      await this.initializePlanFeatureIndex();
      
      // Load popular queries
      await this.loadPopularQueries();

      this.lastIndexUpdate = Date.now();
      console.log('Search indexes initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize search indexes:', error);
    }
  }

  /**
   * Initialize city search index with all Texas cities
   */
  private async initializeCityIndex(): Promise<void> {
    const cities = await this.loadCitiesData();
    
    const fuseOptions = {
      keys: [
        { name: 'name', weight: 0.7 },
        { name: 'slug', weight: 0.5 },
        { name: 'zip_codes', weight: 0.3 },
        { name: 'zone', weight: 0.2 },
      ],
      threshold: 0.4, // More permissive for typos
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
    };

    this.citySearchIndex = new Fuse(cities, fuseOptions);
  }

  /**
   * Initialize provider search index
   */
  private async initializeProviderIndex(): Promise<void> {
    const providers = await this.loadProvidersData();
    
    const fuseOptions = {
      keys: [
        { name: 'name', weight: 0.8 },
        { name: 'legal_name', weight: 0.6 },
        { name: 'specialties', weight: 0.4 },
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
    };

    this.providerSearchIndex = new Fuse(providers, fuseOptions);
  }

  /**
   * Initialize plan feature search index
   */
  private async initializePlanFeatureIndex(): Promise<void> {
    const planFeatures = [
      { id: 'green-energy', name: 'Green Energy', aliases: ['renewable', 'clean', 'eco-friendly'], category: 'environment' },
      { id: 'fixed-rate', name: 'Fixed Rate', aliases: ['stable', 'locked'], category: 'pricing' },
      { id: 'variable-rate', name: 'Variable Rate', aliases: ['flexible', 'market'], category: 'pricing' },
      { id: 'no-deposit', name: 'No Deposit', aliases: ['deposit-free', 'no upfront'], category: 'fees' },
      { id: 'prepaid', name: 'Prepaid', aliases: ['pay-as-you-go', 'no credit check'], category: 'billing' },
      { id: 'time-of-use', name: 'Time of Use', aliases: ['free nights', 'free weekends'], category: 'features' },
      { id: '12-month', name: '12 Month Contract', aliases: ['one year', '1 year'], category: 'contract' },
      { id: '24-month', name: '24 Month Contract', aliases: ['two year', '2 year'], category: 'contract' },
      { id: 'month-to-month', name: 'Month to Month', aliases: ['no contract', 'flexible'], category: 'contract' },
      { id: 'bill-credit', name: 'Bill Credit', aliases: ['cash back', 'credits'], category: 'incentives' },
    ];

    const fuseOptions = {
      keys: [
        { name: 'name', weight: 0.8 },
        { name: 'aliases', weight: 0.6 },
        { name: 'category', weight: 0.4 },
      ],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 3,
    };

    this.planFeatureSearchIndex = new Fuse(planFeatures, fuseOptions);
  }

  /**
   * Load cities data from database
   */
  private async loadCitiesData(): Promise<CitySearchData[]> {
    // In production, load from database
    // For now, simulate with comprehensive Texas cities
    return [
      {
        slug: 'houston',
        name: 'Houston',
        state: 'TX',
        tdsp_duns: '957877905',
        zone: 'Coast',
        zip_codes: ['77001', '77002', '77003'],
        population: 2320268,
        is_major_city: true,
        average_rate: 12.5,
        total_plans: 45,
      },
      {
        slug: 'dallas',
        name: 'Dallas',
        state: 'TX',
        tdsp_duns: '1039940674000',
        zone: 'North',
        zip_codes: ['75201', '75202', '75203'],
        population: 1343573,
        is_major_city: true,
        average_rate: 11.8,
        total_plans: 52,
      },
      {
        slug: 'austin',
        name: 'Austin',
        state: 'TX',
        tdsp_duns: '007924772',
        zone: 'Central',
        zip_codes: ['78701', '78702', '78703'],
        population: 978908,
        is_major_city: true,
        average_rate: 10.9,
        total_plans: 38,
      },
      // Add more cities...
    ];
  }

  /**
   * Load providers data from cache
   */
  private async loadProvidersData(): Promise<ProviderSearchData[]> {
    return planRepository.getAllProviders();
  }

  /**
   * Load popular queries from analytics
   */
  private async loadPopularQueries(): Promise<void> {
    const queries = await planRepository.getPopularSearchQueries();
    this.popularQueries = new Map(queries.map(q => [q.query, q.count]));
  }

  /**
   * Perform comprehensive search across all data types
   */
  async search(
    query: string,
    options: {
      type?: 'all' | 'city' | 'provider' | 'plan_feature';
      limit?: number;
      filters?: SearchFilters;
      sessionId?: string;
    } = {}
  ): Promise<{
    results: SearchResult[];
    suggestions: SearchSuggestion[];
    totalResults: number;
    searchTime: number;
  }> {
    const startTime = Date.now();
    const { type = 'all', limit = 20, filters = {}, sessionId } = options;
    
    try {
      // Check cache first
      const cacheKey = `${query}_${type}_${JSON.stringify(filters)}`;
      if (this.searchCache.has(cacheKey)) {
        const cached = this.searchCache.get(cacheKey)!;
        return {
          results: cached.slice(0, limit),
          suggestions: await this.generateSuggestions(query),
          totalResults: cached.length,
          searchTime: Date.now() - startTime,
        };
      }

      let results: SearchResult[] = [];

      // ZIP code search (exact match)
      if (this.isZipCode(query)) {
        const zipResults = await this.searchByZipCode(query);
        results = [...results, ...zipResults];
      }

      // City search
      if (type === 'all' || type === 'city') {
        const cityResults = await this.searchCities(query, filters);
        results = [...results, ...cityResults];
      }

      // Provider search
      if (type === 'all' || type === 'provider') {
        const providerResults = await this.searchProviders(query, filters);
        results = [...results, ...providerResults];
      }

      // Plan feature search
      if (type === 'all' || type === 'plan_feature') {
        const featureResults = await this.searchPlanFeatures(query);
        results = [...results, ...featureResults];
      }

      // Sort by relevance score
      results.sort((a, b) => b.score - a.score);

      // Cache results
      this.searchCache.set(cacheKey, results);
      setTimeout(() => this.searchCache.delete(cacheKey), this.CACHE_TTL);

      // Log search for analytics
      if (sessionId) {
        await this.logSearch(sessionId, query, type, results.length);
      }

      // Get suggestions
      const suggestions = await this.generateSuggestions(query);

      return {
        results: results.slice(0, limit),
        suggestions,
        totalResults: results.length,
        searchTime: Date.now() - startTime,
      };

    } catch (error) {
      console.error('Search failed:', error);
      
      return {
        results: [],
        suggestions: await this.generateSuggestions(query),
        totalResults: 0,
        searchTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Search cities with fuzzy matching
   */
  private async searchCities(query: string, filters: SearchFilters): Promise<SearchResult[]> {
    if (!this.citySearchIndex) return [];

    const searchResults = this.citySearchIndex.search(query, { limit: 50 });
    
    return searchResults
      .filter(result => {
        const city = result.item;
        if (filters.zone && city.zone !== filters.zone) return false;
        if (filters.minPlans && (city.total_plans || 0) < filters.minPlans) return false;
        if (filters.maxRate && (city.average_rate || 999) > filters.maxRate) return false;
        return true;
      })
      .map(result => ({
        id: result.item.slug,
        type: 'city' as const,
        title: result.item.name,
        subtitle: `${result.item.zone} Texas • ${result.item.total_plans || 0} plans available`,
        url: `/texas/${result.item.slug}`,
        score: 1 - (result.score || 0),
        metadata: {
          population: result.item.population,
          averageRate: result.item.average_rate,
          totalPlans: result.item.total_plans,
          zone: result.item.zone,
          zipCodes: result.item.zip_codes,
        },
      }));
  }

  /**
   * Search providers
   */
  private async searchProviders(query: string, filters: SearchFilters): Promise<SearchResult[]> {
    if (!this.providerSearchIndex) return [];

    const searchResults = this.providerSearchIndex.search(query, { limit: 20 });
    
    return searchResults
      .filter(result => {
        const provider = result.item;
        if (filters.minPlans && provider.total_plans < filters.minPlans) return false;
        if (filters.greenEnergyOnly && !provider.specialties.includes('green_energy')) return false;
        return true;
      })
      .map(result => ({
        id: result.item.name.toLowerCase().replace(/\s+/g, '-'),
        type: 'provider' as const,
        title: result.item.name,
        subtitle: `${result.item.total_plans} plans • Serves ${result.item.service_areas.length} cities`,
        url: `/providers/${result.item.name.toLowerCase().replace(/\s+/g, '-')}`,
        score: 1 - (result.score || 0),
        metadata: {
          legalName: result.item.legal_name,
          rating: result.item.rating,
          totalPlans: result.item.total_plans,
          serviceAreas: result.item.service_areas,
          specialties: result.item.specialties,
          logoUrl: result.item.logo_url,
        },
      }));
  }

  /**
   * Search plan features
   */
  private async searchPlanFeatures(query: string): Promise<SearchResult[]> {
    if (!this.planFeatureSearchIndex) return [];

    const searchResults = this.planFeatureSearchIndex.search(query, { limit: 10 });
    
    return searchResults.map(result => ({
      id: result.item.id,
      type: 'plan_feature' as const,
      title: result.item.name,
      subtitle: `Filter plans by ${result.item.category}`,
      url: `/electricity-plans/?${result.item.id}=true`,
      score: 1 - (result.score || 0),
      metadata: {
        category: result.item.category,
        aliases: result.item.aliases,
      },
    }));
  }

  /**
   * Search by ZIP code
   */
  private async searchByZipCode(zipCode: string): Promise<SearchResult[]> {
    const city = await this.getCityByZipCode(zipCode);
    
    if (!city) {
      return [];
    }

    return [{
      id: `zip_${zipCode}`,
      type: 'zip_code' as const,
      title: `${zipCode} - ${city.name}`,
      subtitle: `${city.zone} Texas • View electricity plans`,
      url: `/texas/${city.slug}/?zip=${zipCode}`,
      score: 1.0, // Exact match
      metadata: {
        zipCode,
        citySlug: city.slug,
        cityName: city.name,
        zone: city.zone,
      },
    }];
  }

  /**
   * Generate search suggestions
   */
  private async generateSuggestions(query: string): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    // Popular queries that start with the current query
    for (const [popularQuery, count] of this.popularQueries.entries()) {
      if (popularQuery.toLowerCase().startsWith(query.toLowerCase()) && popularQuery !== query) {
        suggestions.push({
          query: popularQuery,
          type: 'completion',
          count,
          score: count / 100, // Normalize count
        });
      }
    }

    // Typo corrections using Levenshtein distance
    const corrections = this.generateTypoCorrections(query);
    suggestions.push(...corrections);

    // Popular recent searches (if available)
    const recentPopular = await this.getRecentPopularQueries();
    for (const recentQuery of recentPopular) {
      if (!suggestions.find(s => s.query === recentQuery) && recentQuery !== query) {
        suggestions.push({
          query: recentQuery,
          type: 'popular',
          score: 0.8,
        });
      }
    }

    // Sort by score and limit
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  /**
   * Generate typo corrections
   */
  private generateTypoCorrections(query: string): SearchSuggestion[] {
    // Common Texas city names for typo detection
    const commonCities = ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Lubbock'];
    const corrections: SearchSuggestion[] = [];

    for (const city of commonCities) {
      const distance = this.levenshteinDistance(query.toLowerCase(), city.toLowerCase());
      if (distance <= 2 && distance > 0) {
        corrections.push({
          query: city,
          type: 'correction',
          score: 1 - (distance / Math.max(query.length, city.length)),
        });
      }
    }

    return corrections;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(
    query: string,
    type: 'city' | 'provider' | 'all' = 'all',
    limit = 8
  ): Promise<SearchResult[]> {
    if (query.length < 2) return [];

    const results = await this.search(query, { type, limit });
    return results.results.filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.subtitle?.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Get popular searches for a time period
   */
  async getPopularSearches(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    query: string;
    count: number;
    type: string;
  }[]> {
    return planRepository.getPopularSearches(timeframe);
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    noResultsRate: number;
    topQueries: Array<{ query: string; count: number }>;
    searchesByType: Record<string, number>;
  }> {
    return planRepository.getSearchAnalytics(timeframe);
  }

  /**
   * Utility functions
   */
  private isZipCode(query: string): boolean {
    return /^\d{5}(-\d{4})?$/.test(query.trim());
  }

  private async getCityByZipCode(zipCode: string): Promise<CitySearchData | null> {
    // Implement ZIP to city mapping
    return null;
  }

  private async getRecentPopularQueries(): Promise<string[]> {
    const popular = await planRepository.getRecentPopularQueries(10);
    return popular.map(p => p.query);
  }

  private async logSearch(
    sessionId: string,
    query: string,
    type: string,
    resultsCount: number
  ): Promise<void> {
    const searchData: Omit<SearchHistory, 'id'> = {
      session_id: sessionId,
      search_query: query,
      search_type: type as any,
      results_count: resultsCount,
      no_results: resultsCount === 0,
      created_at: new Date(),
    };

    await planRepository.logSearch(searchData);
  }

  /**
   * Refresh search indexes
   */
  private async refreshSearchIndexes(): Promise<void> {
    console.log('Refreshing search indexes...');
    try {
      await this.initializeCityIndex();
      await this.initializeProviderIndex();
      await this.loadPopularQueries();
      this.lastIndexUpdate = Date.now();
      console.log('Search indexes refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh search indexes:', error);
    }
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
    console.log('Search cache cleared');
  }

  /**
   * Get search service health
   */
  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastIndexUpdate: number;
    cacheSize: number;
    popularQueriesLoaded: boolean;
  } {
    const now = Date.now();
    const indexAge = now - this.lastIndexUpdate;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (indexAge > this.INDEX_UPDATE_INTERVAL * 2) {
      status = 'degraded';
    }
    
    if (!this.citySearchIndex || !this.providerSearchIndex) {
      status = 'unhealthy';
    }

    return {
      status,
      lastIndexUpdate: this.lastIndexUpdate,
      cacheSize: this.searchCache.size,
      popularQueriesLoaded: this.popularQueries.size > 0,
    };
  }
}

// Export singleton instance
export const searchService = new SearchService();

// Export types for external use
export type { SearchResult, SearchSuggestion, SearchFilters };