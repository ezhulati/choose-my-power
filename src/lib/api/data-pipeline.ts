/**
 * Real-Time Data Pipeline Service for ChooseMyPower
 * Handles scheduled data updates, market analytics calculation, and cache management
 * Features:
 * - Scheduled plan data updates every 6 hours
 * - Provider information sync daily
 * - Market analytics calculation for city-level insights
 * - Intelligent cache invalidation
 * - Error monitoring and alerting
 */

import { comparePowerClient } from './comparepower-client';
import { planRepository } from '../database/plan-repository';
import { analyticsService } from './analytics-service';
import { searchService } from './search-service';
import type { CityAnalytics, ProviderCache } from '../database/schema';

interface PipelineJob {
  id: string;
  name: string;
  schedule: string; // Cron expression
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  status: 'idle' | 'running' | 'completed' | 'failed';
  duration?: number;
  errorMessage?: string;
}

interface DataUpdateResult {
  success: boolean;
  updated: number;
  failed: number;
  duration: number;
  errors: Array<{ item: string; error: string }>;
}

export class DataPipelineService {
  private jobs: Map<string, PipelineJob> = new Map();
  private runningJobs: Set<string> = new Set();
  private jobIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializePipelineJobs();
    this.startJobScheduler();
  }

  /**
   * Initialize pipeline jobs
   */
  private initializePipelineJobs(): void {
    const jobs: PipelineJob[] = [
      {
        id: 'plan-data-update',
        name: 'Plan Data Update',
        schedule: '0 */6 * * *', // Every 6 hours
        enabled: true,
        status: 'idle',
      },
      {
        id: 'provider-sync',
        name: 'Provider Information Sync',
        schedule: '0 2 * * *', // Daily at 2 AM
        enabled: true,
        status: 'idle',
      },
      {
        id: 'market-analytics',
        name: 'Market Analytics Calculation',
        schedule: '30 2 * * *', // Daily at 2:30 AM
        enabled: true,
        status: 'idle',
      },
      {
        id: 'cache-cleanup',
        name: 'Cache Cleanup',
        schedule: '0 1 * * *', // Daily at 1 AM
        enabled: true,
        status: 'idle',
      },
      {
        id: 'search-index-refresh',
        name: 'Search Index Refresh',
        schedule: '15 3 * * *', // Daily at 3:15 AM
        enabled: true,
        status: 'idle',
      },
    ];

    jobs.forEach(job => {
      this.jobs.set(job.id, job);
    });
  }

  /**
   * Start job scheduler
   */
  private startJobScheduler(): void {
    console.warn('Starting data pipeline scheduler...');
    
    // Check jobs every minute
    setInterval(() => {
      this.checkAndRunJobs();
    }, 60000);

    // Initial job status update
    this.updateNextRunTimes();
  }

  /**
   * Check and run scheduled jobs
   */
  private async checkAndRunJobs(): Promise<void> {
    const now = new Date();

    for (const [jobId, job] of this.jobs.entries()) {
      if (!job.enabled || this.runningJobs.has(jobId)) {
        continue;
      }

      // Check if job should run
      if (this.shouldRunJob(job, now)) {
        console.warn(`Starting pipeline job: ${job.name}`);
        await this.runJob(jobId);
      }
    }
  }

  /**
   * Check if job should run based on schedule
   */
  private shouldRunJob(job: PipelineJob, now: Date): boolean {
    if (!job.nextRun) {
      return true; // First run
    }
    
    return now >= job.nextRun;
  }

  /**
   * Run a specific pipeline job
   */
  async runJob(jobId: string): Promise<DataUpdateResult> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (this.runningJobs.has(jobId)) {
      throw new Error(`Job ${jobId} is already running`);
    }

    this.runningJobs.add(jobId);
    job.status = 'running';
    job.lastRun = new Date();

    const startTime = Date.now();
    let result: DataUpdateResult;

    try {
      switch (jobId) {
        case 'plan-data-update':
          result = await this.updatePlanData();
          break;
        case 'provider-sync':
          result = await this.syncProviderData();
          break;
        case 'market-analytics':
          result = await this.calculateMarketAnalytics();
          break;
        case 'cache-cleanup':
          result = await this.cleanupCaches();
          break;
        case 'search-index-refresh':
          result = await this.refreshSearchIndexes();
          break;
        default:
          throw new Error(`Unknown job: ${jobId}`);
      }

      job.status = result.success ? 'completed' : 'failed';
      job.duration = Date.now() - startTime;
      job.errorMessage = result.success ? undefined : 'Some operations failed';

      // Schedule next run
      this.scheduleNextRun(job);

      console.warn(`Pipeline job ${job.name} completed:`, {
        success: result.success,
        updated: result.updated,
        failed: result.failed,
        duration: job.duration,
      });

    } catch (error) {
      job.status = 'failed';
      job.duration = Date.now() - startTime;
      job.errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`Pipeline job ${job.name} failed:`, error);

      result = {
        success: false,
        updated: 0,
        failed: 1,
        duration: job.duration,
        errors: [{ item: job.name, error: job.errorMessage }],
      };

      // Schedule next run even if failed
      this.scheduleNextRun(job);
    } finally {
      this.runningJobs.delete(jobId);

      // Send alert for failed jobs
      if (job.status === 'failed') {
        await this.sendJobFailureAlert(job);
      }
    }

    return result;
  }

  /**
   * Update plan data from external APIs
   */
  private async updatePlanData(): Promise<DataUpdateResult> {
    console.warn('Starting plan data update...');
    
    const startTime = Date.now();
    let updated = 0;
    let failed = 0;
    const errors: Array<{ item: string; error: string }> = [];

    try {
      // Get all cities that need data updates
      const cities = await planRepository.getCitiesForDataUpdate();
      console.warn(`Updating plan data for ${cities.length} cities`);

      // Process cities in batches to respect rate limits
      const batchSize = 10;
      for (let i = 0; i < cities.length; i += batchSize) {
        const batch = cities.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (city) => {
          try {
            const params = {
              tdsp_duns: city.tdsp_duns,
              display_usage: 1000,
            };

            const plans = await comparePowerClient.fetchPlans(params);
            
            if (plans.length > 0) {
              await planRepository.updateCityPlans(city.slug, plans);
              updated++;
            } else {
              console.warn(`No plans found for city: ${city.name}`);
            }

          } catch (error) {
            failed++;
            errors.push({
              item: city.name,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        });

        await Promise.all(batchPromises);
        
        // Small delay between batches
        await this.sleep(1000);
      }

      // Invalidate relevant caches
      await comparePowerClient.clearCache();
      
      return {
        success: failed === 0,
        updated,
        failed,
        duration: Date.now() - startTime,
        errors,
      };

    } catch (error) {
      return {
        success: false,
        updated,
        failed: failed + 1,
        duration: Date.now() - startTime,
        errors: [...errors, {
          item: 'Plan Data Update',
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  /**
   * Sync provider information
   */
  private async syncProviderData(): Promise<DataUpdateResult> {
    console.warn('Starting provider data sync...');
    
    const startTime = Date.now();
    let updated = 0;
    let failed = 0;
    const errors: Array<{ item: string; error: string }> = [];

    try {
      // Get all providers from plan data
      const providers = await planRepository.getAllUniqueProviders();
      console.warn(`Syncing data for ${providers.length} providers`);

      for (const provider of providers) {
        try {
          // Get provider statistics
          const stats = await planRepository.getProviderStats(provider.name);
          
          const providerCache: Omit<ProviderCache, 'id'> = {
            provider_name: provider.name,
            logo_url: provider.logo_url,
            website_url: provider.website_url,
            customer_service_phone: provider.customer_service_phone,
            service_areas: stats.service_areas,
            specialties: this.detectProviderSpecialties(stats),
            rating: provider.rating,
            total_plans: stats.total_plans,
            updated_at: new Date(),
            created_at: new Date(),
          };

          await planRepository.updateProviderCache(providerCache);
          updated++;

        } catch (error) {
          failed++;
          errors.push({
            item: provider.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return {
        success: failed === 0,
        updated,
        failed,
        duration: Date.now() - startTime,
        errors,
      };

    } catch (error) {
      return {
        success: false,
        updated,
        failed: failed + 1,
        duration: Date.now() - startTime,
        errors: [...errors, {
          item: 'Provider Sync',
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  /**
   * Calculate market analytics for all cities
   */
  private async calculateMarketAnalytics(): Promise<DataUpdateResult> {
    console.warn('Starting market analytics calculation...');
    
    const startTime = Date.now();
    let updated = 0;
    let failed = 0;
    const errors: Array<{ item: string; error: string }> = [];

    try {
      const cities = await planRepository.getAllCities();
      console.warn(`Calculating market analytics for ${cities.length} cities`);

      for (const city of cities) {
        try {
          const analytics = await this.calculateCityAnalytics(city.slug, city.tdsp_duns);
          
          await planRepository.updateCityAnalytics(analytics);
          updated++;

        } catch (error) {
          failed++;
          errors.push({
            item: city.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return {
        success: failed === 0,
        updated,
        failed,
        duration: Date.now() - startTime,
        errors,
      };

    } catch (error) {
      return {
        success: false,
        updated,
        failed: failed + 1,
        duration: Date.now() - startTime,
        errors: [...errors, {
          item: 'Market Analytics',
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  /**
   * Clean up expired caches
   */
  private async cleanupCaches(): Promise<DataUpdateResult> {
    console.warn('Starting cache cleanup...');
    
    const startTime = Date.now();
    let updated = 0;

    try {
      // Clean expired plan cache entries
      const cleanedPlanCache = await planRepository.cleanExpiredCache();
      updated += cleanedPlanCache;

      // Clear in-memory caches
      searchService.clearCache();
      
      // Clean API logs older than 30 days
      const cleanedApiLogs = await planRepository.cleanOldApiLogs(30);
      updated += cleanedApiLogs;

      console.warn(`Cache cleanup completed: ${updated} items cleaned`);

      return {
        success: true,
        updated,
        failed: 0,
        duration: Date.now() - startTime,
        errors: [],
      };

    } catch (error) {
      return {
        success: false,
        updated,
        failed: 1,
        duration: Date.now() - startTime,
        errors: [{
          item: 'Cache Cleanup',
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  /**
   * Refresh search indexes
   */
  private async refreshSearchIndexes(): Promise<DataUpdateResult> {
    console.warn('Starting search index refresh...');
    
    const startTime = Date.now();

    try {
      // This would refresh the search service indexes
      // The search service handles its own index management
      await searchService.clearCache();
      
      return {
        success: true,
        updated: 1,
        failed: 0,
        duration: Date.now() - startTime,
        errors: [],
      };

    } catch (error) {
      return {
        success: false,
        updated: 0,
        failed: 1,
        duration: Date.now() - startTime,
        errors: [{
          item: 'Search Index Refresh',
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }

  /**
   * Calculate analytics for a specific city
   */
  private async calculateCityAnalytics(citySlug: string, tdspDuns: string): Promise<Omit<CityAnalytics, 'id'>> {
    const plans = await planRepository.getActivePlans(tdspDuns);
    
    if (plans.length === 0) {
      throw new Error(`No plans found for city: ${citySlug}`);
    }

    // Calculate rate statistics
    const rates = plans.map(p => p.pricing.ratePerKwh);
    const averageRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    const lowestRate = Math.min(...rates);
    const highestRate = Math.max(...rates);

    // Count plan types
    const greenPlans = plans.filter(p => p.features.greenEnergy > 0).length;
    const fixedRatePlans = plans.filter(p => p.contract.type === 'fixed').length;
    const variableRatePlans = plans.filter(p => p.contract.type === 'variable').length;

    // Get previous month's data for trend calculation
    const previousAnalytics = await planRepository.getPreviousCityAnalytics(citySlug);
    const monthlyTrend = previousAnalytics 
      ? averageRate - previousAnalytics.average_rate 
      : null;

    return {
      city_slug: citySlug,
      tdsp_duns: tdspDuns,
      average_rate: Math.round(averageRate * 100) / 100,
      lowest_rate: Math.round(lowestRate * 100) / 100,
      highest_rate: Math.round(highestRate * 100) / 100,
      total_plans: plans.length,
      green_plans: greenPlans,
      fixed_rate_plans: fixedRatePlans,
      variable_rate_plans: variableRatePlans,
      last_updated: new Date(),
      monthly_trend: monthlyTrend ? Math.round(monthlyTrend * 100) / 100 : null,
      created_at: new Date(),
    };
  }

  /**
   * Detect provider specialties based on their plans
   */
  private detectProviderSpecialties(stats: unknown): string[] {
    const specialties: string[] = [];

    if (stats.green_percentage > 50) {
      specialties.push('green_energy');
    }

    if (stats.business_plans > 0) {
      specialties.push('business_plans');
    }

    if (stats.prepaid_plans > stats.total_plans * 0.3) {
      specialties.push('prepaid_specialist');
    }

    if (stats.no_deposit_plans > stats.total_plans * 0.7) {
      specialties.push('no_deposit');
    }

    return specialties;
  }

  /**
   * Schedule next run for a job
   */
  private scheduleNextRun(job: PipelineJob): void {
    // Simple scheduling - in production, use a proper cron parser
    const now = new Date();
    
    switch (job.schedule) {
      case '0 */6 * * *': // Every 6 hours
        job.nextRun = new Date(now.getTime() + 6 * 60 * 60 * 1000);
        break;
      case '0 1 * * *': // Daily at 1 AM
      case '0 2 * * *': // Daily at 2 AM
      case '30 2 * * *': // Daily at 2:30 AM
      case '15 3 * * *': // Daily at 3:15 AM
        job.nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      default:
        job.nextRun = new Date(now.getTime() + 60 * 60 * 1000); // Default 1 hour
    }
  }

  /**
   * Update next run times for all jobs
   */
  private updateNextRunTimes(): void {
    for (const job of this.jobs.values()) {
      if (!job.nextRun) {
        this.scheduleNextRun(job);
      }
    }
  }

  /**
   * Send job failure alert
   */
  private async sendJobFailureAlert(job: PipelineJob): Promise<void> {
    try {
      console.error(`Pipeline job failed: ${job.name}`, {
        id: job.id,
        errorMessage: job.errorMessage,
        duration: job.duration,
        lastRun: job.lastRun,
      });

      // In production, send alerts via email, Slack, or monitoring system
      // await sendAlert({
      //   type: 'pipeline_job_failure',
      //   job: job.name,
      //   error: job.errorMessage,
      //   timestamp: new Date(),
      // });

    } catch (error) {
      console.error('Failed to send job failure alert:', error);
    }
  }

  /**
   * Utility to sleep for given milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Public methods for external access
   */

  /**
   * Get pipeline status
   */
  getPipelineStatus(): {
    totalJobs: number;
    runningJobs: number;
    completedJobs: number;
    failedJobs: number;
    jobs: PipelineJob[];
  } {
    const jobs = Array.from(this.jobs.values());
    
    return {
      totalJobs: jobs.length,
      runningJobs: jobs.filter(j => j.status === 'running').length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      jobs,
    };
  }

  /**
   * Manually trigger a job
   */
  async triggerJob(jobId: string): Promise<DataUpdateResult> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    return await this.runJob(jobId);
  }

  /**
   * Enable/disable a job
   */
  setJobEnabled(jobId: string, enabled: boolean): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    job.enabled = enabled;
    return true;
  }

  /**
   * Get job history and statistics
   */
  async getJobHistory(jobId: string, limit = 10): Promise<Array<{
    timestamp: Date;
    status: string;
    duration: number;
    updated: number;
    failed: number;
  }>> {
    // In production, this would query job execution history from database
    return [];
  }
}

// Export singleton instance
export const dataPipelineService = new DataPipelineService();

// Export types for external use
export type { PipelineJob, DataUpdateResult };