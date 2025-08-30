/**
 * Database Performance Optimization for Professional Electricity Comparison Platform
 * 
 * This module provides advanced database optimization strategies for handling
 * high-volume electricity plan data with optimal query performance.
 * 
 * Key Features:
 * - Advanced indexing strategies for fast plan lookups
 * - Query optimization for faceted search
 * - Performance monitoring and analytics
 * - Automatic index maintenance
 * - Database health checks and optimization recommendations
 */

import { getDatabase } from './config';
import type { Plan, ApiParams } from '../../types/facets';

interface IndexStats {
  indexName: string;
  tableName: string;
  indexType: string;
  columns: string[];
  size: string;
  usage: number;
  recommendation: 'keep' | 'optimize' | 'drop' | 'create';
}

interface QueryPerformance {
  query: string;
  avgExecutionTime: number;
  totalExecutions: number;
  slowExecutions: number;
  recommendedOptimizations: string[];
}

interface DatabaseMetrics {
  totalQueries: number;
  slowQueries: number;
  cacheHitRate: number;
  averageResponseTime: number;
  indexEfficiency: number;
  recommendedActions: string[];
}

export class PerformanceOptimizer {
  private db = getDatabase();
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private readonly INDEX_USAGE_THRESHOLD = 0.1; // 10% usage minimum

  /**
   * Create advanced performance indexes for electricity plan queries
   */
  async createPerformanceIndexes(): Promise<void> {
    console.log('🚀 Creating advanced performance indexes for electricity plans...');

    const indexes = [
      // Core plan lookup indexes
      {
        name: 'idx_plans_primary_lookup',
        table: 'electricity_plans',
        columns: ['tdsp_duns', 'is_active', 'rate_1000kwh'],
        type: 'btree',
        description: 'Primary plan lookup by TDSP and rate'
      },

      // Faceted search composite indexes
      {
        name: 'idx_plans_faceted_contract',
        table: 'electricity_plans',
        columns: ['tdsp_duns', 'is_active', 'term_months', 'rate_type', 'rate_1000kwh'],
        type: 'btree',
        description: 'Contract term and type faceted search'
      },

      {
        name: 'idx_plans_faceted_green',
        table: 'electricity_plans',
        columns: ['tdsp_duns', 'is_active', 'percent_green', 'rate_1000kwh'],
        type: 'btree',
        description: 'Green energy percentage faceted search'
      },

      {
        name: 'idx_plans_faceted_features',
        table: 'electricity_plans',
        columns: ['tdsp_duns', 'is_active', 'is_pre_pay', 'deposit_required', 'rate_1000kwh'],
        type: 'btree',
        description: 'Plan features faceted search'
      },

      // Provider-based indexes
      {
        name: 'idx_plans_provider_performance',
        table: 'electricity_plans',
        columns: ['provider_id', 'is_active', 'rate_1000kwh', 'last_scraped_at'],
        type: 'btree',
        description: 'Provider plan performance lookup'
      },

      // Time-based indexes for analytics
      {
        name: 'idx_plans_analytics_time',
        table: 'electricity_plans',
        columns: ['last_scraped_at', 'tdsp_duns', 'is_active'],
        type: 'btree',
        description: 'Time-based analytics queries'
      },

      // Rate-based sorting indexes
      {
        name: 'idx_plans_rate_sorting',
        table: 'electricity_plans',
        columns: ['tdsp_duns', 'is_active', 'rate_500kwh', 'rate_1000kwh', 'rate_2000kwh'],
        type: 'btree',
        description: 'Multi-usage rate sorting'
      },

      // Full-text search index (if using PostgreSQL)
      {
        name: 'idx_plans_fulltext_search',
        table: 'electricity_plans',
        columns: ['search_vector'],
        type: 'gin',
        description: 'Full-text search on plan content'
      },

      // Cache table performance indexes
      {
        name: 'idx_cache_performance_lookup',
        table: 'plan_cache',
        columns: ['cache_key', 'expires_at', 'cached_at'],
        type: 'btree',
        description: 'Cache lookup performance'
      },

      {
        name: 'idx_cache_cleanup',
        table: 'plan_cache',
        columns: ['expires_at', 'cached_at'],
        type: 'btree',
        description: 'Cache cleanup operations'
      },

      // API logging indexes for monitoring
      {
        name: 'idx_api_logs_monitoring',
        table: 'api_logs',
        columns: ['created_at', 'response_status', 'response_time_ms'],
        type: 'btree',
        description: 'API performance monitoring'
      },

      // City analytics indexes
      {
        name: 'idx_city_analytics_performance',
        table: 'city_analytics',
        columns: ['city_slug', 'last_updated', 'average_rate'],
        type: 'btree',
        description: 'City analytics performance'
      },

      // Lead management indexes
      {
        name: 'idx_leads_conversion_analysis',
        table: 'leads',
        columns: ['status', 'created_at', 'score', 'city_slug'],
        type: 'btree',
        description: 'Lead conversion analysis'
      },

      // User search analytics indexes
      {
        name: 'idx_searches_analytics',
        table: 'user_searches',
        columns: ['created_at', 'city_slug', 'conversion_event'],
        type: 'btree',
        description: 'Search analytics and conversion tracking'
      }
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const index of indexes) {
      try {
        const columnList = index.columns.join(', ');
        const indexType = index.type === 'gin' ? 'USING gin' : '';
        
        await this.db`
          CREATE INDEX IF NOT EXISTS ${this.db(index.name)} 
          ON ${this.db(index.table)} ${this.db.unsafe(indexType)} (${this.db.unsafe(columnList)})
        `;

        console.log(`✅ Created index: ${index.name} (${index.description})`);
        createdCount++;
      } catch (error) {
        console.warn(`⚠️ Skipped index ${index.name}: ${error}`);
        skippedCount++;
      }
    }

    console.log(`📊 Index creation complete: ${createdCount} created, ${skippedCount} skipped`);
  }

  /**
   * Analyze query performance and provide optimization recommendations
   */
  async analyzeQueryPerformance(): Promise<QueryPerformance[]> {
    console.log('🔍 Analyzing query performance...');

    try {
      // Get query statistics (PostgreSQL specific)
      const queryStats = await this.db`
        SELECT 
          query,
          mean_exec_time as avg_execution_time,
          calls as total_executions,
          (SELECT COUNT(*) FROM pg_stat_statements WHERE mean_exec_time > ${this.SLOW_QUERY_THRESHOLD}) as slow_executions
        FROM pg_stat_statements 
        WHERE query LIKE '%electricity_plans%' 
           OR query LIKE '%plan_cache%'
           OR query LIKE '%providers%'
        ORDER BY mean_exec_time DESC, calls DESC
        LIMIT 20
      `;

      const performanceAnalysis = queryStats.map(stat => {
        const recommendations: string[] = [];
        
        if (stat.avg_execution_time > this.SLOW_QUERY_THRESHOLD) {
          recommendations.push('Query exceeds slow threshold - consider optimization');
        }
        
        if (stat.total_executions > 1000 && stat.avg_execution_time > 100) {
          recommendations.push('High-frequency query with moderate execution time - candidate for optimization');
        }

        // Analyze query patterns and suggest optimizations
        const query = stat.query.toLowerCase();
        
        if (query.includes('order by') && !query.includes('limit')) {
          recommendations.push('Consider adding LIMIT to ORDER BY queries');
        }
        
        if (query.includes('select *')) {
          recommendations.push('Avoid SELECT * - specify needed columns');
        }
        
        if (query.includes('like') && !query.includes('index')) {
          recommendations.push('LIKE queries may benefit from full-text search index');
        }

        return {
          query: stat.query,
          avgExecutionTime: Number(stat.avg_execution_time),
          totalExecutions: Number(stat.total_executions),
          slowExecutions: Number(stat.slow_executions),
          recommendedOptimizations: recommendations
        };
      });

      return performanceAnalysis;
    } catch (error) {
      console.warn('Query performance analysis unavailable (requires pg_stat_statements):', error);
      return [];
    }
  }

  /**
   * Get comprehensive database metrics and recommendations
   */
  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    console.log('📊 Gathering database performance metrics...');

    try {
      const [
        queryStats,
        indexStats,
        cacheStats,
        recentPerformance
      ] = await Promise.all([
        this.getQueryStats(),
        this.getIndexUsage(),
        this.getCachePerformance(),
        this.getRecentPerformance()
      ]);

      const recommendations: string[] = [];

      // Analyze cache hit rate
      if (cacheStats.hitRate < 0.8) {
        recommendations.push('Cache hit rate is low - consider increasing cache TTL or warming strategies');
      }

      // Analyze slow queries
      if (queryStats.slowQueryRate > 0.05) {
        recommendations.push('High slow query rate - review query optimization and indexing');
      }

      // Analyze index efficiency
      const unusedIndexes = indexStats.filter(idx => idx.usage < this.INDEX_USAGE_THRESHOLD);
      if (unusedIndexes.length > 0) {
        recommendations.push(`${unusedIndexes.length} indexes have low usage - consider removal`);
      }

      // Database size recommendations
      if (recentPerformance.avgResponseTime > 1000) {
        recommendations.push('High average response time - consider query optimization or hardware upgrades');
      }

      return {
        totalQueries: queryStats.totalQueries,
        slowQueries: queryStats.slowQueries,
        cacheHitRate: cacheStats.hitRate,
        averageResponseTime: recentPerformance.avgResponseTime,
        indexEfficiency: indexStats.length > 0 ? indexStats.reduce((sum, idx) => sum + idx.usage, 0) / indexStats.length : 0,
        recommendedActions: recommendations
      };
    } catch (error) {
      console.error('Error gathering database metrics:', error);
      return {
        totalQueries: 0,
        slowQueries: 0,
        cacheHitRate: 0,
        averageResponseTime: 0,
        indexEfficiency: 0,
        recommendedActions: ['Unable to gather metrics - check database connection']
      };
    }
  }

  /**
   * Optimize database for electricity plan queries
   */
  async optimizeForElectricityPlans(): Promise<void> {
    console.log('⚡ Optimizing database for electricity plan queries...');

    // 1. Create performance indexes
    await this.createPerformanceIndexes();

    // 2. Update table statistics for query planner
    await this.updateTableStatistics();

    // 3. Optimize specific queries
    await this.optimizeCommonQueries();

    // 4. Set up monitoring
    await this.setupPerformanceMonitoring();

    console.log('✅ Database optimization complete');
  }

  /**
   * Update table statistics for better query planning
   */
  private async updateTableStatistics(): Promise<void> {
    console.log('📈 Updating table statistics...');

    const tables = [
      'electricity_plans',
      'providers',
      'plan_cache',
      'api_logs',
      'city_analytics',
      'leads',
      'user_searches'
    ];

    for (const table of tables) {
      try {
        await this.db`ANALYZE ${this.db(table)}`;
        console.log(`✅ Updated statistics for ${table}`);
      } catch (error) {
        console.warn(`⚠️ Failed to update statistics for ${table}:`, error);
      }
    }
  }

  /**
   * Create materialized views for complex queries
   */
  async createMaterializedViews(): Promise<void> {
    console.log('🏗️ Creating materialized views for complex queries...');

    // City plan summary view
    try {
      await this.db`
        CREATE MATERIALIZED VIEW IF NOT EXISTS city_plan_summary AS
        SELECT 
          c.slug as city_slug,
          c.name as city_name,
          c.tdsp_duns,
          COUNT(p.id) as total_plans,
          MIN(p.rate_1000kwh) as lowest_rate,
          AVG(p.rate_1000kwh) as average_rate,
          MAX(p.rate_1000kwh) as highest_rate,
          COUNT(CASE WHEN p.percent_green > 0 THEN 1 END) as green_plans,
          COUNT(CASE WHEN p.rate_type = 'fixed' THEN 1 END) as fixed_plans,
          COUNT(CASE WHEN p.rate_type = 'variable' THEN 1 END) as variable_plans,
          MAX(p.last_scraped_at) as last_updated
        FROM cities c
        LEFT JOIN electricity_plans p ON c.tdsp_duns = p.tdsp_duns AND p.is_active = true
        GROUP BY c.slug, c.name, c.tdsp_duns
      `;

      await this.db`
        CREATE INDEX IF NOT EXISTS idx_city_plan_summary_lookup 
        ON city_plan_summary (city_slug, lowest_rate)
      `;

      console.log('✅ Created city_plan_summary materialized view');
    } catch (error) {
      console.warn('⚠️ Failed to create city_plan_summary view:', error);
    }

    // Provider performance view
    try {
      await this.db`
        CREATE MATERIALIZED VIEW IF NOT EXISTS provider_performance AS
        SELECT 
          pr.id as provider_id,
          pr.name as provider_name,
          COUNT(p.id) as total_plans,
          AVG(p.rate_1000kwh) as average_rate,
          MIN(p.rate_1000kwh) as lowest_rate,
          COUNT(DISTINCT p.tdsp_duns) as service_areas,
          AVG(p.percent_green) as avg_green_percentage,
          COUNT(CASE WHEN p.is_pre_pay = true THEN 1 END) as prepaid_plans,
          COUNT(CASE WHEN p.deposit_required = false THEN 1 END) as no_deposit_plans,
          pr.rating,
          pr.review_count
        FROM providers pr
        LEFT JOIN electricity_plans p ON pr.id = p.provider_id AND p.is_active = true
        GROUP BY pr.id, pr.name, pr.rating, pr.review_count
      `;

      await this.db`
        CREATE INDEX IF NOT EXISTS idx_provider_performance_lookup 
        ON provider_performance (provider_name, average_rate)
      `;

      console.log('✅ Created provider_performance materialized view');
    } catch (error) {
      console.warn('⚠️ Failed to create provider_performance view:', error);
    }
  }

  /**
   * Refresh materialized views (should be done periodically)
   */
  async refreshMaterializedViews(): Promise<void> {
    console.log('🔄 Refreshing materialized views...');

    const views = ['city_plan_summary', 'provider_performance'];

    for (const view of views) {
      try {
        await this.db`REFRESH MATERIALIZED VIEW CONCURRENTLY ${this.db(view)}`;
        console.log(`✅ Refreshed ${view}`);
      } catch (error) {
        console.warn(`⚠️ Failed to refresh ${view}:`, error);
      }
    }
  }

  /**
   * Set up performance monitoring
   */
  private async setupPerformanceMonitoring(): Promise<void> {
    console.log('📊 Setting up performance monitoring...');

    // Enable query statistics collection (if not already enabled)
    try {
      await this.db`
        SELECT pg_stat_statements_reset()
      `;
      console.log('✅ Reset query statistics for fresh monitoring');
    } catch (error) {
      console.warn('⚠️ pg_stat_statements not available - query analysis will be limited');
    }
  }

  /**
   * Get query statistics
   */
  private async getQueryStats(): Promise<{
    totalQueries: number;
    slowQueries: number;
    slowQueryRate: number;
  }> {
    try {
      const stats = await this.db`
        SELECT 
          COUNT(*) as total_queries,
          COUNT(CASE WHEN response_time_ms > ${this.SLOW_QUERY_THRESHOLD} THEN 1 END) as slow_queries
        FROM api_logs 
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `;

      const total = Number(stats[0].total_queries);
      const slow = Number(stats[0].slow_queries);

      return {
        totalQueries: total,
        slowQueries: slow,
        slowQueryRate: total > 0 ? slow / total : 0
      };
    } catch (error) {
      return { totalQueries: 0, slowQueries: 0, slowQueryRate: 0 };
    }
  }

  /**
   * Get index usage statistics
   */
  private async getIndexUsage(): Promise<IndexStats[]> {
    try {
      const indexStats = await this.db`
        SELECT 
          indexname as index_name,
          tablename as table_name,
          schemaname,
          idx_tup_read as usage
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        ORDER BY idx_tup_read DESC
      `;

      return indexStats.map(stat => ({
        indexName: stat.index_name,
        tableName: stat.table_name,
        indexType: 'btree', // Simplified
        columns: [], // Would need additional query
        size: '0', // Would need additional query
        usage: Number(stat.usage),
        recommendation: Number(stat.usage) < this.INDEX_USAGE_THRESHOLD * 1000 ? 'drop' : 'keep'
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get cache performance metrics
   */
  private async getCachePerformance(): Promise<{
    hitRate: number;
    totalEntries: number;
    activeEntries: number;
  }> {
    try {
      const cacheStats = await this.db`
        SELECT 
          COUNT(*) as total_entries,
          COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_entries
        FROM plan_cache
      `;

      const total = Number(cacheStats[0].total_entries);
      const active = Number(cacheStats[0].active_entries);

      return {
        hitRate: total > 0 ? active / total : 0,
        totalEntries: total,
        activeEntries: active
      };
    } catch (error) {
      return { hitRate: 0, totalEntries: 0, activeEntries: 0 };
    }
  }

  /**
   * Get recent performance metrics
   */
  private async getRecentPerformance(): Promise<{
    avgResponseTime: number;
    totalRequests: number;
  }> {
    try {
      const perfStats = await this.db`
        SELECT 
          AVG(response_time_ms) as avg_response_time,
          COUNT(*) as total_requests
        FROM api_logs 
        WHERE created_at > NOW() - INTERVAL '1 hour'
      `;

      return {
        avgResponseTime: Number(perfStats[0]?.avg_response_time || 0),
        totalRequests: Number(perfStats[0]?.total_requests || 0)
      };
    } catch (error) {
      return { avgResponseTime: 0, totalRequests: 0 };
    }
  }

  /**
   * Optimize common electricity plan queries
   */
  private async optimizeCommonQueries(): Promise<void> {
    console.log('🎯 Optimizing common query patterns...');

    // Set work_mem for complex queries
    try {
      await this.db`SET work_mem = '256MB'`;
      console.log('✅ Increased work_mem for complex queries');
    } catch (error) {
      console.warn('⚠️ Could not adjust work_mem:', error);
    }

    // Set shared_buffers recommendation
    console.log('💡 Recommendation: Set shared_buffers to 25% of available RAM for optimal performance');
    
    // Enable query plan caching
    try {
      await this.db`SET plan_cache_mode = 'auto'`;
      console.log('✅ Enabled query plan caching');
    } catch (error) {
      console.warn('⚠️ Could not enable plan caching:', error);
    }
  }

  /**
   * Database health check with performance focus
   */
  async performanceHealthCheck(): Promise<{
    healthy: boolean;
    metrics: DatabaseMetrics;
    criticalIssues: string[];
    recommendations: string[];
  }> {
    console.log('🏥 Performing database performance health check...');

    const metrics = await this.getDatabaseMetrics();
    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    // Check for critical performance issues
    if (metrics.averageResponseTime > 2000) {
      criticalIssues.push('Average response time exceeds 2 seconds');
    }

    if (metrics.slowQueries > metrics.totalQueries * 0.1) {
      criticalIssues.push('More than 10% of queries are slow');
    }

    if (metrics.cacheHitRate < 0.5) {
      criticalIssues.push('Cache hit rate is below 50%');
    }

    // Performance recommendations
    if (metrics.indexEfficiency < 0.7) {
      recommendations.push('Review index usage - some indexes may be redundant');
    }

    if (metrics.cacheHitRate < 0.8) {
      recommendations.push('Consider increasing cache TTL or implementing cache warming');
    }

    recommendations.push(...metrics.recommendedActions);

    const healthy = criticalIssues.length === 0;

    return {
      healthy,
      metrics,
      criticalIssues,
      recommendations
    };
  }

  /**
   * Cleanup and maintenance tasks
   */
  async performMaintenance(): Promise<void> {
    console.log('🧹 Performing database maintenance tasks...');

    // Clean expired cache entries
    const cleanedCache = await this.db`
      DELETE FROM plan_cache 
      WHERE expires_at < NOW() - INTERVAL '1 day'
    `;
    console.log(`🗑️ Cleaned ${cleanedCache.length} expired cache entries`);

    // Clean old API logs
    const cleanedLogs = await this.db`
      DELETE FROM api_logs 
      WHERE created_at < NOW() - INTERVAL '30 days'
    `;
    console.log(`🗑️ Cleaned ${cleanedLogs.length} old API log entries`);

    // Refresh materialized views
    await this.refreshMaterializedViews();

    // Update table statistics
    await this.updateTableStatistics();

    console.log('✅ Maintenance tasks completed');
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

/**
 * Utility functions for easy access
 */
export async function optimizeDatabaseForProduction(): Promise<void> {
  await performanceOptimizer.optimizeForElectricityPlans();
  await performanceOptimizer.createMaterializedViews();
}

export async function getDatabasePerformanceReport(): Promise<DatabaseMetrics> {
  return performanceOptimizer.getDatabaseMetrics();
}

export async function performDatabaseMaintenance(): Promise<void> {
  await performanceOptimizer.performMaintenance();
}

export async function checkDatabaseHealth(): Promise<any> {
  return performanceOptimizer.performanceHealthCheck();
}