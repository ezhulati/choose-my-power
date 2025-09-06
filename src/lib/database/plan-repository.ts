/**
 * Plan Repository - Database operations for electricity plans
 * Handles all database interactions for plan data with caching and performance optimization
 */

import { getDatabase } from './config';
import type { Plan, ApiParams } from '../../types/facets';
import type { 
  ElectricityPlan, 
  Provider, 
  Lead, 
  PlanComparison, 
  SearchHistory, 
  CityAnalytics,
  ProviderCache,
  ApiMetrics,
  UserSearch
} from './schema';

// Type definitions for API plan data
interface ApiPlan {
  _id: string;
  product: {
    brand: BrandData;
    name: string;
    family?: string;
    term?: number;
    percent_green?: number;
    headline?: string;
    description?: string;
    early_termination_fee?: number;
    is_pre_pay?: boolean;
    is_time_of_use?: boolean;
  };
  display_pricing_500?: { avg_cents?: number; avg?: number; total?: number };
  display_pricing_1000?: { avg_cents?: number; avg?: number; total?: number };
  display_pricing_2000?: { avg_cents?: number; avg?: number; total?: number };
  document_links?: DocumentLink[];
}

interface BrandData {
  name: string;
  legal_name?: string;
  puct_number?: string;
  contact_info?: {
    sales?: { phone_number?: string };
    support?: { 
      phone_number?: string; 
      email?: string; 
      address?: string; 
    };
  };
}

interface DocumentLink {
  type: string;
  language?: string;
  link: string;
}

interface DatabasePlan {
  external_id: string;
  provider_name: string;
  logo_filename?: string;
  logo_url?: string;
  rating?: number;
  review_count?: number;
  name: string;
  term_months: number;
  rate_type: 'fixed' | 'variable' | 'indexed';
  early_termination_fee: number;
  auto_renewal: boolean;
  satisfaction_guarantee: boolean;
  percent_green: number;
  bill_credit: number;
  deposit_required: boolean;
  deposit_amount?: number;
  tdsp_duns: string;
  rate_500kwh: number;
  rate_1000kwh: number;
  rate_2000kwh: number;
  total_500kwh: number;
  total_1000kwh: number;
  total_2000kwh: number;
}

export class PlanRepository {
  private db = getDatabase();

  /**
   * Get plans from database cache first, fallback to fresh data
   */
  async getPlansFromCache(params: ApiParams): Promise<Plan[] | null> {
    try {
      const cacheKey = JSON.stringify(params);
      
      const cached = await this.db`
        SELECT plans_data, cached_at, expires_at
        FROM plan_cache 
        WHERE cache_key = ${cacheKey} 
          AND expires_at > NOW()
        ORDER BY cached_at DESC 
        LIMIT 1
      `;

      if (cached.length > 0) {
        console.log(`Database cache hit for key: ${cacheKey}`);
        return cached[0].plans_data as Plan[];
      }

      return null;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  /**
   * Store plans in database cache
   */
  async setPlansCache(params: ApiParams, plans: Plan[], ttlHours = 1): Promise<void> {
    try {
      const cacheKey = JSON.stringify(params);
      const lowestRate = plans.length > 0 ? Math.min(...plans.map(p => p.pricing.rate1000kWh)) : 0;
      const expiresAt = new Date(Date.now() + (ttlHours * 60 * 60 * 1000));

      await this.db`
        INSERT INTO plan_cache (cache_key, tdsp_duns, plans_data, plan_count, lowest_rate, expires_at)
        VALUES (
          ${cacheKey}, 
          ${params.tdsp_duns}, 
          ${JSON.stringify(plans)}, 
          ${plans.length}, 
          ${lowestRate}, 
          ${expiresAt}
        )
        ON CONFLICT (cache_key) DO UPDATE SET
          plans_data = EXCLUDED.plans_data,
          plan_count = EXCLUDED.plan_count,
          lowest_rate = EXCLUDED.lowest_rate,
          cached_at = NOW(),
          expires_at = EXCLUDED.expires_at
      `;

      console.log(`Cached ${plans.length} plans for TDSP ${params.tdsp_duns}`);
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  /**
   * Store individual plans in the database for long-term analysis
   */
  async storePlans(apiPlans: ApiPlan[], tdspDuns: string): Promise<void> {
    try {
      for (const apiPlan of apiPlans) {
        // Validate required data before processing
        if (!apiPlan?.product?.brand?.name) {
          console.warn(`Skipping plan ${apiPlan?._id || 'unknown'}: missing brand data - brand: ${JSON.stringify(apiPlan?.product?.brand)}`);
          continue;
        }
        
        // First ensure provider exists
        const providerId = await this.ensureProviderExists(apiPlan.product.brand);
        
        // Then insert/update the plan
        await this.db`
          INSERT INTO electricity_plans (
            external_id, provider_id, tdsp_duns, name, family, term_months, 
            rate_type, percent_green, headline, description, early_termination_fee,
            is_pre_pay, is_time_of_use, requires_auto_pay,
            rate_500kwh, rate_1000kwh, rate_2000kwh,
            total_500kwh, total_1000kwh, total_2000kwh,
            bill_credit, deposit_required, satisfaction_guarantee, auto_renewal,
            efl_link, tos_link, yrac_link, is_active, last_scraped_at
          ) VALUES (
            ${apiPlan._id}, ${providerId}, ${tdspDuns}, ${apiPlan.product.name},
            ${apiPlan.product.family}, ${apiPlan.product.term},
            ${this.determineRateType(apiPlan.product)}, ${Math.round(apiPlan.product.percent_green || 0)},
            ${apiPlan.product.headline}, ${apiPlan.product.description},
            ${apiPlan.product.early_termination_fee || 0},
            ${apiPlan.product.is_pre_pay || false}, ${apiPlan.product.is_time_of_use || false},
            ${false}, -- requires_auto_pay not in API
            ${apiPlan.display_pricing_500?.avg_cents || (apiPlan.display_pricing_500?.avg * 100) || 0},
            ${apiPlan.display_pricing_1000?.avg_cents || (apiPlan.display_pricing_1000?.avg * 100) || 0},
            ${apiPlan.display_pricing_2000?.avg_cents || (apiPlan.display_pricing_2000?.avg * 100) || 0},
            ${apiPlan.display_pricing_500?.total || 0},
            ${apiPlan.display_pricing_1000?.total || 0},
            ${apiPlan.display_pricing_2000?.total || 0},
            ${0}, -- bill_credit not clearly in API
            ${apiPlan.product.is_pre_pay || false}, -- deposit_required
            ${false}, -- satisfaction_guarantee not in API
            ${false}, -- auto_renewal not in API
            ${this.findDocumentLink(apiPlan.document_links, 'efl')},
            ${this.findDocumentLink(apiPlan.document_links, 'tos')},
            ${this.findDocumentLink(apiPlan.document_links, 'yrac')},
            ${true}, ${new Date()}
          )
          ON CONFLICT (external_id, tdsp_duns) DO UPDATE SET
            name = EXCLUDED.name,
            headline = EXCLUDED.headline,
            rate_500kwh = EXCLUDED.rate_500kwh,
            rate_1000kwh = EXCLUDED.rate_1000kwh,
            rate_2000kwh = EXCLUDED.rate_2000kwh,
            total_500kwh = EXCLUDED.total_500kwh,
            total_1000kwh = EXCLUDED.total_1000kwh,
            total_2000kwh = EXCLUDED.total_2000kwh,
            is_active = EXCLUDED.is_active,
            last_scraped_at = EXCLUDED.last_scraped_at,
            updated_at = NOW()
        `;
      }

      console.log(`Stored ${apiPlans.length} plans in database for TDSP ${tdspDuns}`);
    } catch (error) {
      console.error('Plan storage error:', error);
    }
  }

  /**
   * Ensure provider exists in database, create if not
   */
  private async ensureProviderExists(brandData: BrandData): Promise<string> {
    try {
      // Validate brand data
      if (!brandData?.name) {
        throw new Error('Brand data missing required name field');
      }
      
      // First try to find existing provider
      const existing = await this.db`
        SELECT id FROM providers 
        WHERE puct_number = ${brandData.puct_number || ''}
        LIMIT 1
      `;

      if (existing.length > 0) {
        return existing[0].id;
      }

      // Create new provider
      const newProvider = await this.db`
        INSERT INTO providers (name, legal_name, puct_number, contact_phone, support_phone, support_email, support_address)
        VALUES (
          ${brandData.name},
          ${brandData.legal_name || brandData.name},
          ${brandData.puct_number},
          ${brandData.contact_info?.sales?.phone_number},
          ${brandData.contact_info?.support?.phone_number},
          ${brandData.contact_info?.support?.email},
          ${brandData.contact_info?.support?.address}
        )
        RETURNING id
      `;

      return newProvider[0].id;
    } catch (error) {
      console.error('Provider creation error:', error);
      throw error;
    }
  }

  /**
   * Get active plans from database (for when API is down)
   */
  async getActivePlans(tdspDuns: string, filters: Partial<ApiParams> = {}): Promise<Plan[]> {
    try {
      // Use separate queries for different filter combinations to avoid SQL building issues
      let plans: DatabasePlan[];
      
      if (filters.term && filters.percent_green !== undefined && filters.is_pre_pay !== undefined) {
        plans = await this.db`
          SELECT 
            p.*,
            pr.name as provider_name,
            pr.logo_filename,
            pr.logo_url,
            pr.rating,
            pr.review_count
          FROM electricity_plans p
          JOIN providers pr ON p.provider_id = pr.id
          WHERE p.tdsp_duns = ${tdspDuns} 
            AND p.is_active = true
            AND p.term_months = ${filters.term}
            AND p.percent_green >= ${filters.percent_green}
            AND p.is_pre_pay = ${filters.is_pre_pay}
          ORDER BY p.rate_1000kwh ASC 
          LIMIT 50
        `;
      } else if (filters.term && filters.percent_green !== undefined) {
        plans = await this.db`
          SELECT 
            p.*,
            pr.name as provider_name,
            pr.logo_filename,
            pr.logo_url,
            pr.rating,
            pr.review_count
          FROM electricity_plans p
          JOIN providers pr ON p.provider_id = pr.id
          WHERE p.tdsp_duns = ${tdspDuns} 
            AND p.is_active = true
            AND p.term_months = ${filters.term}
            AND p.percent_green >= ${filters.percent_green}
          ORDER BY p.rate_1000kwh ASC 
          LIMIT 50
        `;
      } else if (filters.term) {
        plans = await this.db`
          SELECT 
            p.*,
            pr.name as provider_name,
            pr.logo_filename,
            pr.logo_url,
            pr.rating,
            pr.review_count
          FROM electricity_plans p
          JOIN providers pr ON p.provider_id = pr.id
          WHERE p.tdsp_duns = ${tdspDuns} 
            AND p.is_active = true
            AND p.term_months = ${filters.term}
          ORDER BY p.rate_1000kwh ASC 
          LIMIT 50
        `;
      } else if (filters.percent_green !== undefined) {
        plans = await this.db`
          SELECT 
            p.*,
            pr.name as provider_name,
            pr.logo_filename,
            pr.logo_url,
            pr.rating,
            pr.review_count
          FROM electricity_plans p
          JOIN providers pr ON p.provider_id = pr.id
          WHERE p.tdsp_duns = ${tdspDuns} 
            AND p.is_active = true
            AND p.percent_green >= ${filters.percent_green}
          ORDER BY p.rate_1000kwh ASC 
          LIMIT 50
        `;
      } else if (filters.is_pre_pay !== undefined) {
        plans = await this.db`
          SELECT 
            p.*,
            pr.name as provider_name,
            pr.logo_filename,
            pr.logo_url,
            pr.rating,
            pr.review_count
          FROM electricity_plans p
          JOIN providers pr ON p.provider_id = pr.id
          WHERE p.tdsp_duns = ${tdspDuns} 
            AND p.is_active = true
            AND p.is_pre_pay = ${filters.is_pre_pay}
          ORDER BY p.rate_1000kwh ASC 
          LIMIT 50
        `;
      } else {
        // No filters
        plans = await this.db`
          SELECT 
            p.*,
            pr.name as provider_name,
            pr.logo_filename,
            pr.logo_url,
            pr.rating,
            pr.review_count
          FROM electricity_plans p
          JOIN providers pr ON p.provider_id = pr.id
          WHERE p.tdsp_duns = ${tdspDuns} 
            AND p.is_active = true
          ORDER BY p.rate_1000kwh ASC 
          LIMIT 50
        `;
      }

      return plans.map(this.transformDatabasePlan);
    } catch (error) {
      console.error('Database plan retrieval error:', error);
      return [];
    }
  }

  /**
   * Log API calls for monitoring
   */
  async logApiCall(endpoint: string, params: Record<string, unknown>, status: number, responseTime: number, error?: string): Promise<void> {
    try {
      await this.db`
        INSERT INTO api_logs (endpoint, params, response_status, response_time_ms, error_message)
        VALUES (${endpoint}, ${JSON.stringify(params)}, ${status}, ${responseTime}, ${error})
      `;
    } catch (err) {
      console.error('API logging error:', err);
    }
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpiredCache(): Promise<number> {
    try {
      const result = await this.db`
        DELETE FROM plan_cache 
        WHERE expires_at < NOW()
      `;
      return result.length;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const [totalCache, activeCache, recentLogs] = await Promise.all([
        this.db`SELECT COUNT(*) as count FROM plan_cache`,
        this.db`SELECT COUNT(*) as count FROM plan_cache WHERE expires_at > NOW()`,
        this.db`SELECT COUNT(*) as count FROM api_logs WHERE created_at > NOW() - INTERVAL '24 hours'`
      ]);

      return {
        totalCacheEntries: Number(totalCache[0].count),
        activeCacheEntries: Number(activeCache[0].count),
        apiCallsLast24h: Number(recentLogs[0].count),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { totalCacheEntries: 0, activeCacheEntries: 0, apiCallsLast24h: 0, timestamp: new Date().toISOString() };
    }
  }

  /**
   * Helper methods
   */
  private determineRateType(product: ApiPlan['product']): 'fixed' | 'variable' | 'indexed' {
    const name = product.name?.toLowerCase() || '';
    const headline = product.headline?.toLowerCase() || '';
    
    if (name.includes('variable') || headline.includes('variable')) return 'variable';
    if (name.includes('indexed') || headline.includes('indexed')) return 'indexed';
    return 'fixed';
  }

  private findDocumentLink(links: DocumentLink[] = [], type: string): string | null {
    const link = links.find(l => l.type?.toLowerCase() === type.toLowerCase());
    return link?.link || null;
  }

  /**
   * Lead Management Methods
   */
  
  async storeLead(leadData: Omit<Lead, 'id'>): Promise<string> {
    try {
      const result = await this.db`
        INSERT INTO leads (
          zip_code, city_slug, monthly_usage, current_rate, preferred_contract_length,
          green_energy_preference, contact_email, contact_phone, utm_source, utm_campaign,
          utm_medium, utm_content, status, score, notes, created_at, updated_at
        ) VALUES (
          ${leadData.zip_code}, ${leadData.city_slug}, ${leadData.monthly_usage},
          ${leadData.current_rate}, ${leadData.preferred_contract_length},
          ${leadData.green_energy_preference}, ${leadData.contact_email}, ${leadData.contact_phone},
          ${leadData.utm_source}, ${leadData.utm_campaign}, ${leadData.utm_medium}, ${leadData.utm_content},
          ${leadData.status}, ${leadData.score}, ${leadData.notes}, 
          ${leadData.created_at}, ${leadData.updated_at}
        ) RETURNING id
      `;
      return result[0].id;
    } catch (error) {
      console.error('Lead storage error:', error);
      throw error;
    }
  }

  async updateLead(leadId: string, updates: Partial<Lead>): Promise<void> {
    try {
      const setClause: string[] = [];
      const values: any[] = [];

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
          setClause.push(`${key} = $${values.length + 1}`);
          values.push(value);
        }
      });

      if (setClause.length > 0) {
        setClause.push('updated_at = NOW()');
        await this.db`
          UPDATE leads 
          SET ${this.db(setClause.join(', '))}
          WHERE id = ${leadId}
        `;
      }
    } catch (error) {
      console.error('Lead update error:', error);
      throw error;
    }
  }

  async getLeadAnalytics(timeframe: 'day' | 'week' | 'month'): Promise<{
    totalLeads: number;
    qualifiedLeads: number;
    conversionRate: number;
    averageScore: number;
    leadsBySource: Record<string, number>;
    leadsByStatus: Record<string, number>;
  }> {
    try {
      const interval = timeframe === 'day' ? '1 day' : timeframe === 'week' ? '7 days' : '30 days';

      const [totalLeads, qualifiedLeads, averageScore, bySource, byStatus] = await Promise.all([
        this.db`SELECT COUNT(*) as count FROM leads WHERE created_at > NOW() - INTERVAL ${interval}`,
        this.db`SELECT COUNT(*) as count FROM leads WHERE status IN ('qualified', 'converted') AND created_at > NOW() - INTERVAL ${interval}`,
        this.db`SELECT AVG(score) as avg FROM leads WHERE created_at > NOW() - INTERVAL ${interval} AND score IS NOT NULL`,
        this.db`
          SELECT utm_source, COUNT(*) as count 
          FROM leads 
          WHERE created_at > NOW() - INTERVAL ${interval} 
            AND utm_source IS NOT NULL
          GROUP BY utm_source
        `,
        this.db`
          SELECT status, COUNT(*) as count 
          FROM leads 
          WHERE created_at > NOW() - INTERVAL ${interval}
          GROUP BY status
        `
      ]);

      const leadsBySource: Record<string, number> = {};
      bySource.forEach(row => {
        leadsBySource[row.utm_source] = Number(row.count);
      });

      const leadsByStatus: Record<string, number> = {};
      byStatus.forEach(row => {
        leadsByStatus[row.status] = Number(row.count);
      });

      const total = Number(totalLeads[0].count);
      const qualified = Number(qualifiedLeads[0].count);

      return {
        totalLeads: total,
        qualifiedLeads: qualified,
        conversionRate: total > 0 ? (qualified / total) * 100 : 0,
        averageScore: Number(averageScore[0]?.avg || 0),
        leadsBySource,
        leadsByStatus,
      };
    } catch (error) {
      console.error('Lead analytics error:', error);
      return {
        totalLeads: 0,
        qualifiedLeads: 0,
        conversionRate: 0,
        averageScore: 0,
        leadsBySource: {},
        leadsByStatus: {},
      };
    }
  }

  async getLeadsWithFilters(filters?: {
    status?: Lead['status'];
    minScore?: number;
    dateFrom?: Date;
    dateTo?: Date;
    utmSource?: string;
  }): Promise<Lead[]> {
    try {
      let query = 'SELECT * FROM leads WHERE 1=1';
      const values: any[] = [];

      if (filters?.status) {
        query += ` AND status = $${values.length + 1}`;
        values.push(filters.status);
      }

      if (filters?.minScore !== undefined) {
        query += ` AND score >= $${values.length + 1}`;
        values.push(filters.minScore);
      }

      if (filters?.dateFrom) {
        query += ` AND created_at >= $${values.length + 1}`;
        values.push(filters.dateFrom);
      }

      if (filters?.dateTo) {
        query += ` AND created_at <= $${values.length + 1}`;
        values.push(filters.dateTo);
      }

      if (filters?.utmSource) {
        query += ` AND utm_source = $${values.length + 1}`;
        values.push(filters.utmSource);
      }

      query += ' ORDER BY created_at DESC LIMIT 1000';

      return await this.db.unsafe(query, values);
    } catch (error) {
      console.error('Leads filter error:', error);
      return [];
    }
  }

  /**
   * Plan Comparison Methods
   */

  async storePlanComparison(comparisonData: Omit<PlanComparison, 'id'>): Promise<void> {
    try {
      await this.db`
        INSERT INTO plan_comparisons (
          session_id, plan_ids, city_slug, filters_applied, 
          comparison_duration_seconds, selected_plan_id, created_at
        ) VALUES (
          ${comparisonData.session_id}, ${JSON.stringify(comparisonData.plan_ids)}, 
          ${comparisonData.city_slug}, ${JSON.stringify(comparisonData.filters_applied)},
          ${comparisonData.comparison_duration_seconds}, ${comparisonData.selected_plan_id},
          ${comparisonData.created_at}
        )
      `;
    } catch (error) {
      console.error('Plan comparison storage error:', error);
      throw error;
    }
  }

  async getPlanComparisonAnalytics(timeframe: 'day' | 'week' | 'month'): Promise<{
    totalComparisons: number;
    averagePlansPerComparison: number;
    mostComparedPlans: Array<{ planId: string; count: number; provider: string }>;
    comparisonConversionRate: number;
    popularComparisons: Array<{ planIds: string[]; count: number }>;
  }> {
    try {
      const interval = timeframe === 'day' ? '1 day' : timeframe === 'week' ? '7 days' : '30 days';

      const [totalComparisons, avgPlans] = await Promise.all([
        this.db`SELECT COUNT(*) as count FROM plan_comparisons WHERE created_at > NOW() - INTERVAL ${interval}`,
        this.db`
          SELECT AVG(JSONB_ARRAY_LENGTH(plan_ids)) as avg
          FROM plan_comparisons 
          WHERE created_at > NOW() - INTERVAL ${interval}
        `
      ]);

      return {
        totalComparisons: Number(totalComparisons[0].count),
        averagePlansPerComparison: Number(avgPlans[0]?.avg || 0),
        mostComparedPlans: [], // Would require complex JSON aggregation
        comparisonConversionRate: 0, // Would require lead correlation
        popularComparisons: [], // Would require complex JSON aggregation
      };
    } catch (error) {
      console.error('Plan comparison analytics error:', error);
      return {
        totalComparisons: 0,
        averagePlansPerComparison: 0,
        mostComparedPlans: [],
        comparisonConversionRate: 0,
        popularComparisons: [],
      };
    }
  }

  /**
   * Search Analytics Methods
   */

  async logSearch(searchData: Omit<SearchHistory, 'id'>): Promise<void> {
    try {
      await this.db`
        INSERT INTO search_history (
          session_id, search_query, search_type, results_count, 
          clicked_result, no_results, created_at
        ) VALUES (
          ${searchData.session_id}, ${searchData.search_query}, ${searchData.search_type},
          ${searchData.results_count}, ${searchData.clicked_result}, ${searchData.no_results},
          ${searchData.created_at}
        )
      `;
    } catch (error) {
      console.error('Search logging error:', error);
    }
  }

  async getSearchAnalytics(timeframe: 'day' | 'week' | 'month'): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    noResultsRate: number;
    averageResultsPerQuery: number;
    topQueries: Array<{ query: string; count: number; avgResults: number }>;
    searchToLeadRate: number;
    queryCategories: Record<string, number>;
  }> {
    try {
      const interval = timeframe === 'day' ? '1 day' : timeframe === 'week' ? '7 days' : '30 days';

      const [total, unique, noResults, avgResults, topQueries] = await Promise.all([
        this.db`SELECT COUNT(*) as count FROM search_history WHERE created_at > NOW() - INTERVAL ${interval}`,
        this.db`SELECT COUNT(DISTINCT search_query) as count FROM search_history WHERE created_at > NOW() - INTERVAL ${interval}`,
        this.db`SELECT COUNT(*) as count FROM search_history WHERE no_results = true AND created_at > NOW() - INTERVAL ${interval}`,
        this.db`SELECT AVG(results_count) as avg FROM search_history WHERE created_at > NOW() - INTERVAL ${interval}`,
        this.db`
          SELECT search_query, COUNT(*) as count, AVG(results_count) as avg_results
          FROM search_history 
          WHERE created_at > NOW() - INTERVAL ${interval}
          GROUP BY search_query
          ORDER BY count DESC
          LIMIT 10
        `
      ]);

      const totalCount = Number(total[0].count);
      const noResultsCount = Number(noResults[0].count);

      return {
        totalSearches: totalCount,
        uniqueQueries: Number(unique[0].count),
        noResultsRate: totalCount > 0 ? (noResultsCount / totalCount) * 100 : 0,
        averageResultsPerQuery: Number(avgResults[0]?.avg || 0),
        topQueries: topQueries.map(q => ({
          query: q.search_query,
          count: Number(q.count),
          avgResults: Number(q.avg_results),
        })),
        searchToLeadRate: 0, // Would require correlation analysis
        queryCategories: {}, // Would require query classification
      };
    } catch (error) {
      console.error('Search analytics error:', error);
      return {
        totalSearches: 0,
        uniqueQueries: 0,
        noResultsRate: 0,
        averageResultsPerQuery: 0,
        topQueries: [],
        searchToLeadRate: 0,
        queryCategories: {},
      };
    }
  }

  async getPopularSearchQueries(): Promise<Array<{ query: string; count: number }>> {
    try {
      const result = await this.db`
        SELECT search_query as query, COUNT(*) as count
        FROM search_history 
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY search_query
        ORDER BY count DESC
        LIMIT 50
      `;
      return result.map(r => ({ query: r.query, count: Number(r.count) }));
    } catch (error) {
      console.error('Popular queries error:', error);
      return [];
    }
  }

  async getRecentPopularQueries(limit: number): Promise<Array<{ query: string }>> {
    try {
      const result = await this.db`
        SELECT DISTINCT search_query as query
        FROM search_history 
        WHERE created_at > NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return result;
    } catch (error) {
      console.error('Recent popular queries error:', error);
      return [];
    }
  }

  /**
   * City Analytics Methods
   */

  async updateCityAnalytics(analytics: Omit<CityAnalytics, 'id'>): Promise<void> {
    try {
      await this.db`
        INSERT INTO city_analytics (
          city_slug, tdsp_duns, average_rate, lowest_rate, highest_rate,
          total_plans, green_plans, fixed_rate_plans, variable_rate_plans,
          last_updated, monthly_trend, created_at
        ) VALUES (
          ${analytics.city_slug}, ${analytics.tdsp_duns}, ${analytics.average_rate},
          ${analytics.lowest_rate}, ${analytics.highest_rate}, ${analytics.total_plans},
          ${analytics.green_plans}, ${analytics.fixed_rate_plans}, ${analytics.variable_rate_plans},
          ${analytics.last_updated}, ${analytics.monthly_trend}, ${analytics.created_at}
        )
        ON CONFLICT (city_slug) DO UPDATE SET
          average_rate = EXCLUDED.average_rate,
          lowest_rate = EXCLUDED.lowest_rate,
          highest_rate = EXCLUDED.highest_rate,
          total_plans = EXCLUDED.total_plans,
          green_plans = EXCLUDED.green_plans,
          fixed_rate_plans = EXCLUDED.fixed_rate_plans,
          variable_rate_plans = EXCLUDED.variable_rate_plans,
          last_updated = EXCLUDED.last_updated,
          monthly_trend = EXCLUDED.monthly_trend
      `;
    } catch (error) {
      console.error('City analytics update error:', error);
      throw error;
    }
  }

  async getPreviousCityAnalytics(citySlug: string): Promise<CityAnalytics | null> {
    try {
      const result = await this.db`
        SELECT * FROM city_analytics 
        WHERE city_slug = ${citySlug}
        ORDER BY last_updated DESC
        LIMIT 1
      `;
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Previous city analytics error:', error);
      return null;
    }
  }

  /**
   * Provider Cache Methods
   */

  async updateProviderCache(providerData: Omit<ProviderCache, 'id'>): Promise<void> {
    try {
      await this.db`
        INSERT INTO provider_cache (
          provider_name, logo_url, website_url, customer_service_phone,
          service_areas, specialties, rating, total_plans, updated_at, created_at
        ) VALUES (
          ${providerData.provider_name}, ${providerData.logo_url}, ${providerData.website_url},
          ${providerData.customer_service_phone}, ${JSON.stringify(providerData.service_areas)},
          ${JSON.stringify(providerData.specialties)}, ${providerData.rating}, ${providerData.total_plans},
          ${providerData.updated_at}, ${providerData.created_at}
        )
        ON CONFLICT (provider_name) DO UPDATE SET
          logo_url = EXCLUDED.logo_url,
          website_url = EXCLUDED.website_url,
          customer_service_phone = EXCLUDED.customer_service_phone,
          service_areas = EXCLUDED.service_areas,
          specialties = EXCLUDED.specialties,
          rating = EXCLUDED.rating,
          total_plans = EXCLUDED.total_plans,
          updated_at = EXCLUDED.updated_at
      `;
    } catch (error) {
      console.error('Provider cache update error:', error);
      throw error;
    }
  }

  async getAllProviders(): Promise<Array<{
    name: string;
    legal_name: string;
    logo_url?: string;
    rating?: number;
    total_plans: number;
    service_areas: string[];
    specialties: string[];
  }>> {
    try {
      const result = await this.db`
        SELECT 
          pc.provider_name as name,
          p.legal_name,
          pc.logo_url,
          pc.rating,
          pc.total_plans,
          pc.service_areas,
          pc.specialties
        FROM provider_cache pc
        LEFT JOIN providers p ON pc.provider_name = p.name
        ORDER BY pc.total_plans DESC
      `;
      
      return result.map(r => ({
        name: r.name,
        legal_name: r.legal_name || r.name,
        logo_url: r.logo_url,
        rating: r.rating,
        total_plans: r.total_plans,
        service_areas: r.service_areas || [],
        specialties: r.specialties || [],
      }));
    } catch (error) {
      console.error('Get all providers error:', error);
      return [];
    }
  }

  async getAllUniqueProviders(): Promise<Array<{
    name: string;
    logo_url?: string;
    website_url?: string;
    customer_service_phone?: string;
    rating?: number;
  }>> {
    try {
      const result = await this.db`
        SELECT DISTINCT
          p.name,
          p.logo_url,
          pc.website_url,
          pc.customer_service_phone,
          p.rating
        FROM providers p
        LEFT JOIN provider_cache pc ON p.name = pc.provider_name
        WHERE EXISTS (
          SELECT 1 FROM electricity_plans ep WHERE ep.provider_id = p.id
        )
        ORDER BY p.name
      `;
      return result;
    } catch (error) {
      console.error('Get unique providers error:', error);
      return [];
    }
  }

  async getProviderStats(providerName: string): Promise<{
    service_areas: string[];
    total_plans: number;
    green_percentage: number;
    business_plans: number;
    prepaid_plans: number;
    no_deposit_plans: number;
  }> {
    try {
      const result = await this.db`
        SELECT 
          ARRAY_AGG(DISTINCT c.slug) as service_areas,
          COUNT(*) as total_plans,
          AVG(ep.percent_green) as green_percentage,
          COUNT(CASE WHEN ep.name ILIKE '%business%' THEN 1 END) as business_plans,
          COUNT(CASE WHEN ep.is_pre_pay = true THEN 1 END) as prepaid_plans,
          COUNT(CASE WHEN ep.deposit_required = false THEN 1 END) as no_deposit_plans
        FROM electricity_plans ep
        JOIN providers p ON ep.provider_id = p.id
        LEFT JOIN cities c ON ep.tdsp_duns = c.tdsp_duns
        WHERE p.name = ${providerName}
        GROUP BY p.name
      `;

      if (result.length > 0) {
        return {
          service_areas: result[0].service_areas || [],
          total_plans: Number(result[0].total_plans),
          green_percentage: Number(result[0].green_percentage || 0),
          business_plans: Number(result[0].business_plans),
          prepaid_plans: Number(result[0].prepaid_plans),
          no_deposit_plans: Number(result[0].no_deposit_plans),
        };
      }

      return {
        service_areas: [],
        total_plans: 0,
        green_percentage: 0,
        business_plans: 0,
        prepaid_plans: 0,
        no_deposit_plans: 0,
      };
    } catch (error) {
      console.error('Provider stats error:', error);
      return {
        service_areas: [],
        total_plans: 0,
        green_percentage: 0,
        business_plans: 0,
        prepaid_plans: 0,
        no_deposit_plans: 0,
      };
    }
  }

  /**
   * Analytics and Reporting Methods
   */

  async storeUserJourneyEvents(events: Array<any>): Promise<void> {
    try {
      // This would store user journey events in a dedicated table
      console.log(`Would store ${events.length} user journey events`);
    } catch (error) {
      console.error('User journey events storage error:', error);
    }
  }

  async getPerformanceMetrics(timeframe: 'hour' | 'day' | 'week'): Promise<{
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    totalRequests: number;
    slowQueries: number;
  }> {
    try {
      const interval = timeframe === 'hour' ? '1 hour' : timeframe === 'day' ? '1 day' : '7 days';

      const result = await this.db`
        SELECT 
          AVG(response_time_ms) as avg_response_time,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
          PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) as p99_response_time,
          (COUNT(CASE WHEN response_status >= 400 THEN 1 END)::float / COUNT(*)) * 100 as error_rate,
          COUNT(*) as total_requests,
          COUNT(CASE WHEN response_time_ms > 5000 THEN 1 END) as slow_queries
        FROM api_logs
        WHERE created_at > NOW() - INTERVAL ${interval}
      `;

      return {
        avgResponseTime: Number(result[0]?.avg_response_time || 0),
        p95ResponseTime: Number(result[0]?.p95_response_time || 0),
        p99ResponseTime: Number(result[0]?.p99_response_time || 0),
        errorRate: Number(result[0]?.error_rate || 0),
        cacheHitRate: 0, // Would need cache-specific logging
        totalRequests: Number(result[0]?.total_requests || 0),
        slowQueries: Number(result[0]?.slow_queries || 0),
      };
    } catch (error) {
      console.error('Performance metrics error:', error);
      return {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        cacheHitRate: 0,
        totalRequests: 0,
        slowQueries: 0,
      };
    }
  }

  async getPlanById(planId: string): Promise<Plan | null> {
    try {
      const result = await this.db`
        SELECT 
          p.*,
          pr.name as provider_name,
          pr.logo_url,
          pr.rating,
          pr.review_count
        FROM electricity_plans p
        JOIN providers pr ON p.provider_id = pr.id
        WHERE p.external_id = ${planId}
          AND p.is_active = true
        LIMIT 1
      `;

      if (result.length > 0) {
        return this.transformDatabasePlan(result[0]);
      }
      return null;
    } catch (error) {
      console.error('Get plan by ID error:', error);
      return null;
    }
  }

  async getCitiesForDataUpdate(): Promise<Array<{ slug: string; name: string; tdsp_duns: string }>> {
    try {
      const result = await this.db`
        SELECT slug, name, tdsp_duns
        FROM cities
        WHERE is_major_city = true OR slug IN (
          SELECT city_slug FROM leads 
          WHERE created_at > NOW() - INTERVAL '7 days'
          AND city_slug IS NOT NULL
        )
        ORDER BY is_major_city DESC, name
      `;
      return result;
    } catch (error) {
      console.error('Get cities for update error:', error);
      return [];
    }
  }

  async getAllCities(): Promise<Array<{ slug: string; name: string; tdsp_duns: string }>> {
    try {
      const result = await this.db`
        SELECT slug, name, tdsp_duns
        FROM cities
        ORDER BY name
      `;
      return result;
    } catch (error) {
      console.error('Get all cities error:', error);
      return [];
    }
  }

  async updateCityPlans(citySlug: string, plans: Plan[]): Promise<void> {
    try {
      console.log(`Updated plans for city: ${citySlug} (${plans.length} plans)`);
      // Implementation would update city-specific plan cache
    } catch (error) {
      console.error('Update city plans error:', error);
    }
  }

  async cleanOldApiLogs(daysOld: number): Promise<number> {
    try {
      const result = await this.db`
        DELETE FROM api_logs 
        WHERE created_at < NOW() - INTERVAL '${daysOld} days'
      `;
      return result.length;
    } catch (error) {
      console.error('Clean old API logs error:', error);
      return 0;
    }
  }

  // Placeholder methods for analytics service requirements
  async healthCheck(): Promise<{ healthy: boolean; critical?: boolean }> {
    try {
      await this.db`SELECT 1`;
      return { healthy: true };
    } catch (error) {
      return { healthy: false, critical: true };
    }
  }

  async getActiveUsersCount(): Promise<number> { return 0; }
  async getCurrentSearchesCount(): Promise<number> { return 0; }
  async getRecentConversionsCount(): Promise<number> { return 0; }
  async getRecentPerformanceMetrics(): Promise<any> { return {}; }
  async getRecentErrorRates(): Promise<any> { return { errorRate: 0 }; }
  async getCurrentErrorRate(): Promise<number> { return 0; }
  async getCurrentAvgResponseTime(): Promise<number> { return 0; }
  async isDatabaseHealthy(): Promise<boolean> { return true; }
  async getUserJourneyEvents(timeframe: string): Promise<any[]> { return []; }
  async getSessionEvents(sessionId: string): Promise<any[]> { return []; }
  async getTopPerformingPages(timeframe: string): Promise<any[]> { return []; }
  async getTopSearchQueries(timeframe: string): Promise<any[]> { return []; }
  async getPlanPopularityStats(timeframe: string): Promise<any[]> { return []; }
  async getPopularSearches(timeframe: string): Promise<any[]> { return []; }
  async getTrafficTrend(timeframe: string): Promise<any[]> { return []; }
  async getSearchTrend(timeframe: string): Promise<any[]> { return []; }
  async getPerformanceTrend(timeframe: string): Promise<any[]> { return []; }

  private transformDatabasePlan = (dbPlan: DatabasePlan): Plan => ({
    id: dbPlan.external_id,
    name: dbPlan.name,
    provider: {
      name: dbPlan.provider_name,
      logo: dbPlan.logo_url || '/src/assets/logos/fallback.svg',
      rating: dbPlan.rating || 0,
      reviewCount: dbPlan.review_count || 0,
    },
    pricing: {
      rate500kWh: Number(dbPlan.rate_500kwh),
      rate1000kWh: Number(dbPlan.rate_1000kwh),
      rate2000kWh: Number(dbPlan.rate_2000kwh),
      ratePerKwh: Number(dbPlan.rate_1000kwh),
      total500kWh: Number(dbPlan.total_500kwh),
      total1000kWh: Number(dbPlan.total_1000kwh),
      total2000kWh: Number(dbPlan.total_2000kwh),
    },
    contract: {
      length: dbPlan.term_months,
      type: dbPlan.rate_type,
      earlyTerminationFee: Number(dbPlan.early_termination_fee),
      autoRenewal: dbPlan.auto_renewal,
      satisfactionGuarantee: dbPlan.satisfaction_guarantee,
    },
    features: {
      greenEnergy: dbPlan.percent_green,
      billCredit: Number(dbPlan.bill_credit),
      deposit: {
        required: dbPlan.deposit_required,
        amount: Number(dbPlan.deposit_amount || 0),
      },
    },
    availability: {
      enrollmentType: 'both' as const,
      serviceAreas: [dbPlan.tdsp_duns],
    },
  });
}

export const planRepository = new PlanRepository();