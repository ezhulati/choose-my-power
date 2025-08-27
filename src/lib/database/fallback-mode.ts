/**
 * Fallback Mode for Database Operations
 * Allows the app to work without database connection using file-based caching
 */

import type { Plan, ApiParams } from '../../types/facets';
import fs from 'fs/promises';
import path from 'path';

const CACHE_DIR = './cache';
const CACHE_TTL = 3600000; // 1 hour

export class FallbackRepository {
  private ensureCacheDir = async () => {
    try {
      await fs.mkdir(CACHE_DIR, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  };

  /**
   * Get plans from file cache
   */
  async getPlansFromCache(params: ApiParams): Promise<Plan[] | null> {
    try {
      await this.ensureCacheDir();
      
      const cacheKey = JSON.stringify(params);
      const fileName = Buffer.from(cacheKey).toString('base64').replace(/[/+=]/g, '_') + '.json';
      const filePath = path.join(CACHE_DIR, fileName);

      const data = await fs.readFile(filePath, 'utf-8');
      const cached = JSON.parse(data);

      // Check if expired
      if (Date.now() - cached.timestamp > CACHE_TTL) {
        await fs.unlink(filePath).catch(() => {}); // Clean up expired file
        return null;
      }

      console.log(`File cache hit for TDSP: ${params.tdsp_duns}`);
      return cached.plans;
    } catch (error) {
      return null;
    }
  }

  /**
   * Store plans in file cache
   */
  async setPlansCache(params: ApiParams, plans: Plan[]): Promise<void> {
    try {
      await this.ensureCacheDir();
      
      const cacheKey = JSON.stringify(params);
      const fileName = Buffer.from(cacheKey).toString('base64').replace(/[/+=]/g, '_') + '.json';
      const filePath = path.join(CACHE_DIR, fileName);

      const cacheData = {
        plans,
        timestamp: Date.now(),
        params,
        planCount: plans.length,
        lowestRate: plans.length > 0 ? Math.min(...plans.map(p => p.pricing.rate1000kWh)) : 0
      };

      await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2));
      console.log(`Cached ${plans.length} plans to file for TDSP ${params.tdsp_duns}`);
    } catch (error) {
      console.warn('File cache storage failed:', error);
    }
  }

  /**
   * Store plans for analysis (file-based)
   */
  async storePlans(apiPlans: any[], tdspDuns: string): Promise<void> {
    try {
      await this.ensureCacheDir();
      
      const analyticsFile = path.join(CACHE_DIR, 'plans_analytics.json');
      let analytics = { plans: [], lastUpdated: null };
      
      try {
        const existing = await fs.readFile(analyticsFile, 'utf-8');
        analytics = JSON.parse(existing);
      } catch {
        // File doesn't exist yet
      }

      // Add new plans with metadata
      const newPlans = apiPlans.map(plan => ({
        id: plan._id,
        name: plan.product.name,
        provider: plan.product.brand.name,
        tdsp_duns: tdspDuns,
        rate: plan.display_pricing_1000?.avg_cents || (plan.display_pricing_1000?.avg * 100),
        timestamp: new Date().toISOString()
      }));

      analytics.plans.push(...newPlans);
      analytics.lastUpdated = new Date().toISOString();
      
      // Keep only recent plans (last 1000)
      if (analytics.plans.length > 1000) {
        analytics.plans = analytics.plans.slice(-1000);
      }

      await fs.writeFile(analyticsFile, JSON.stringify(analytics, null, 2));
      console.log(`Stored ${newPlans.length} plans for analytics`);
    } catch (error) {
      console.warn('Analytics storage failed:', error);
    }
  }

  /**
   * Log API calls to file
   */
  async logApiCall(endpoint: string, params: any, status: number, responseTime: number, error?: string): Promise<void> {
    try {
      await this.ensureCacheDir();
      
      const logFile = path.join(CACHE_DIR, 'api_logs.json');
      let logs = [];
      
      try {
        const existing = await fs.readFile(logFile, 'utf-8');
        logs = JSON.parse(existing);
      } catch {
        // File doesn't exist yet
      }

      logs.push({
        endpoint,
        params,
        status,
        responseTime,
        error,
        timestamp: new Date().toISOString()
      });

      // Keep only recent logs (last 100)
      if (logs.length > 100) {
        logs = logs.slice(-100);
      }

      await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.warn('API logging failed:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      await this.ensureCacheDir();
      
      const files = await fs.readdir(CACHE_DIR);
      const cacheFiles = files.filter(f => f.endsWith('.json') && f !== 'api_logs.json' && f !== 'plans_analytics.json');
      
      let validCache = 0;
      for (const file of cacheFiles) {
        try {
          const filePath = path.join(CACHE_DIR, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const cached = JSON.parse(data);
          
          if (Date.now() - cached.timestamp <= CACHE_TTL) {
            validCache++;
          }
        } catch {
          // Invalid cache file
        }
      }

      // Get API logs count
      let apiCallsLast24h = 0;
      try {
        const logFile = path.join(CACHE_DIR, 'api_logs.json');
        const logs = JSON.parse(await fs.readFile(logFile, 'utf-8'));
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        apiCallsLast24h = logs.filter((log: any) => new Date(log.timestamp) > yesterday).length;
      } catch {
        // No logs yet
      }

      return {
        totalCacheEntries: cacheFiles.length,
        activeCacheEntries: validCache,
        apiCallsLast24h,
        timestamp: new Date().toISOString(),
        mode: 'fallback-file-based'
      };
    } catch (error) {
      return {
        totalCacheEntries: 0,
        activeCacheEntries: 0,
        apiCallsLast24h: 0,
        timestamp: new Date().toISOString(),
        mode: 'fallback-file-based',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clean expired cache files
   */
  async cleanExpiredCache(): Promise<number> {
    try {
      await this.ensureCacheDir();
      
      const files = await fs.readdir(CACHE_DIR);
      const cacheFiles = files.filter(f => f.endsWith('.json') && f !== 'api_logs.json' && f !== 'plans_analytics.json');
      
      let cleaned = 0;
      for (const file of cacheFiles) {
        try {
          const filePath = path.join(CACHE_DIR, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const cached = JSON.parse(data);
          
          if (Date.now() - cached.timestamp > CACHE_TTL) {
            await fs.unlink(filePath);
            cleaned++;
          }
        } catch {
          // Invalid cache file, delete it
          await fs.unlink(path.join(CACHE_DIR, file)).catch(() => {});
          cleaned++;
        }
      }

      return cleaned;
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
      return 0;
    }
  }
}

export const fallbackRepository = new FallbackRepository();