/**
 * Plan Repository - Database operations for electricity plans
 * Handles all database interactions for plan data with caching and performance optimization
 */

import { getDatabase } from './config';
import type { Plan, ApiParams } from '../../types/facets';
import type { ElectricityPlan, Provider } from './schema';

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
  async storePlans(apiPlans: any[], tdspDuns: string): Promise<void> {
    try {
      for (const apiPlan of apiPlans) {
        // Validate required data before processing
        if (!apiPlan?.product?.brand) {
          console.warn(`Skipping plan ${apiPlan?._id || 'unknown'}: missing brand data`);
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
            ${this.determineRateType(apiPlan.product)}, ${apiPlan.product.percent_green || 0},
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
  private async ensureProviderExists(brandData: any): Promise<string> {
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
      let plans: any[];
      
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
  async logApiCall(endpoint: string, params: any, status: number, responseTime: number, error?: string): Promise<void> {
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
  private determineRateType(product: any): 'fixed' | 'variable' | 'indexed' {
    const name = product.name?.toLowerCase() || '';
    const headline = product.headline?.toLowerCase() || '';
    
    if (name.includes('variable') || headline.includes('variable')) return 'variable';
    if (name.includes('indexed') || headline.includes('indexed')) return 'indexed';
    return 'fixed';
  }

  private findDocumentLink(links: any[] = [], type: string): string | null {
    const link = links.find(l => l.type?.toLowerCase() === type.toLowerCase());
    return link?.link || null;
  }

  private transformDatabasePlan = (dbPlan: any): Plan => ({
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