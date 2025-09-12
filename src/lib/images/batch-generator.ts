/**
 * Batch Generation System for Strategic OG Image Creation
 * Generates optimized set of ~300 template images to cover 10,000+ pages
 * Cost-effective batch processing with queue management and progress tracking
 */

import type { ImageGenerationContext } from '../../types/images';
import { ogImageGenerator } from './og-image-generator';
import { imageStrategy } from './image-strategy';
import { imageCache } from './image-cache';
import { tdspMapping } from '../../config/tdsp-mapping';

interface BatchJob {
  id: string;
  contexts: ImageGenerationContext[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  errors: string[];
  generatedImages: number;
  totalImages: number;
}

interface BatchGenerationOptions {
  batchSize?: number;
  maxConcurrency?: number;
  delayBetweenBatches?: number;
  priority?: 'low' | 'medium' | 'high';
  warmCache?: boolean;
  generateFallbacks?: boolean;
}

class BatchGenerator {
  private activeJobs: Map<string, BatchJob> = new Map();
  private queue: BatchJob[] = [];
  private maxConcurrentJobs: number = 2;
  private isProcessing: boolean = false;

  /**
   * Generate comprehensive batch of strategic images
   */
  async generateStrategicBatch(options: BatchGenerationOptions = {}): Promise<string> {
    const jobId = this.generateJobId();
    const contexts = await this.generateAllPageContexts();
    
    console.warn(`🏭 Starting strategic batch generation: ${contexts.length} page contexts`);
    
    // Use image strategy to optimize contexts to ~300 unique templates
    const requiredTemplates = imageStrategy.getRequiredTemplates(contexts);
    const optimizedContexts = this.createTemplateContexts(requiredTemplates, contexts);
    
    const costSavings = imageStrategy.getCostSavings(contexts);
    console.warn(`💰 Cost optimization: ${costSavings.totalPages} pages → ${costSavings.uniqueImages} images`);
    console.warn(`💵 Estimated savings: ${costSavings.estimatedCostReduction}`);
    
    const job: BatchJob = {
      id: jobId,
      contexts: optimizedContexts,
      status: 'pending',
      progress: 0,
      errors: [],
      generatedImages: 0,
      totalImages: optimizedContexts.length
    };
    
    this.activeJobs.set(jobId, job);
    this.queue.push(job);
    
    // Start processing queue
    this.processQueue();
    
    return jobId;
  }

  /**
   * Generate batch for specific city and filters
   */
  async generateCityBatch(
    city: string, 
    filters: string[] = [],
    options: BatchGenerationOptions = {}
  ): Promise<string> {
    const jobId = this.generateJobId();
    const contexts = this.generateCityContexts(city, filters);
    
    const job: BatchJob = {
      id: jobId,
      contexts,
      status: 'pending',
      progress: 0,
      errors: [],
      generatedImages: 0,
      totalImages: contexts.length
    };
    
    this.activeJobs.set(jobId, job);
    this.queue.push(job);
    
    this.processQueue();
    return jobId;
  }

  /**
   * Generate high-priority images first (homepage, major cities, common filters)
   */
  async generateHighPriorityBatch(options: BatchGenerationOptions = {}): Promise<string> {
    const jobId = this.generateJobId();
    const contexts = this.generateHighPriorityContexts();
    
    const job: BatchJob = {
      id: jobId,
      contexts,
      status: 'pending',
      progress: 0,
      errors: [],
      generatedImages: 0,
      totalImages: contexts.length
    };
    
    this.activeJobs.set(jobId, job);
    this.queue.unshift(job); // Add to front of queue for priority
    
    this.processQueue();
    return jobId;
  }

  /**
   * Get job status and progress
   */
  getJobStatus(jobId: string): BatchJob | null {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Get all active jobs
   */
  getAllJobs(): BatchJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Cancel a running job
   */
  cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (job && job.status === 'running') {
      job.status = 'failed';
      job.errors.push('Job cancelled by user');
      return true;
    }
    return false;
  }

  /**
   * Process job queue with concurrency control
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const runningJobs = Array.from(this.activeJobs.values()).filter(j => j.status === 'running');
      
      if (runningJobs.length >= this.maxConcurrentJobs) {
        // Wait for a job to complete
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

      const job = this.queue.shift();
      if (job) {
        this.executeJob(job);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Execute individual batch job
   */
  private async executeJob(job: BatchJob): Promise<void> {
    try {
      console.warn(`🚀 Starting batch job ${job.id}: ${job.totalImages} images`);
      
      job.status = 'running';
      job.startedAt = new Date().toISOString();
      job.progress = 0;

      const batchSize = 10;
      const delayBetweenBatches = 3000; // 3 seconds to respect rate limits

      for (let i = 0; i < job.contexts.length; i += batchSize) {
        if (job.status !== 'running') break; // Job was cancelled
        
        const batch = job.contexts.slice(i, i + batchSize);
        console.warn(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(job.contexts.length / batchSize)}`);

        try {
          const results = await this.processBatch(batch);
          job.generatedImages += results.successCount;
          
          if (results.errors.length > 0) {
            job.errors.push(...results.errors);
          }

          job.progress = Math.round((i + batch.length) / job.contexts.length * 100);
          
        } catch (error) {
          console.error(`❌ Batch processing error:`, error);
          job.errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${error}`);
        }

        // Rate limiting delay between batches
        if (i + batchSize < job.contexts.length) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }

      job.status = job.errors.length === 0 ? 'completed' : 'failed';
      job.completedAt = new Date().toISOString();
      job.progress = 100;

      console.warn(`✅ Batch job ${job.id} completed: ${job.generatedImages}/${job.totalImages} images`);
      
      if (job.errors.length > 0) {
        console.warn(`⚠️ Job completed with ${job.errors.length} errors`);
      }

    } catch (error) {
      console.error(`❌ Fatal error in job ${job.id}:`, error);
      job.status = 'failed';
      job.errors.push(`Fatal error: ${error}`);
      job.completedAt = new Date().toISOString();
    }
  }

  /**
   * Process a batch of contexts
   */
  private async processBatch(contexts: ImageGenerationContext[]): Promise<{
    successCount: number;
    errors: string[];
  }> {
    const results = await Promise.allSettled(
      contexts.map(context => ogImageGenerator.getOGImageUrl(context, { useStrategy: true }))
    );

    let successCount = 0;
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        const context = contexts[index];
        const contextId = `${context.city}_${context.pageType}_${context.filters.join('+')}`;
        errors.push(`${contextId}: ${result.reason}`);
      }
    });

    return { successCount, errors };
  }

  /**
   * Generate all possible page contexts for the site
   */
  private async generateAllPageContexts(): Promise<ImageGenerationContext[]> {
    const contexts: ImageGenerationContext[] = [];
    
    // Homepage
    contexts.push({
      city: 'texas',
      filters: [],
      planCount: 0,
      lowestRate: 0,
      topProviders: [],
      pageType: 'homepage',
      cityTier: 1,
      tdspZone: 'North',
      seasonalContext: this.getCurrentSeason()
    });

    // State page
    contexts.push({
      city: 'texas',
      filters: [],
      planCount: 0,
      lowestRate: 0,
      topProviders: [],
      pageType: 'state',
      cityTier: 1,
      tdspZone: 'North',
      seasonalContext: this.getCurrentSeason()
    });

    // All city combinations
    const cities = Object.keys(tdspMapping);
    const commonFilters = [
      [],
      ['green-energy'],
      ['fixed-rate'],
      ['12-month'],
      ['prepaid'],
      ['no-deposit'],
      ['green-energy', 'fixed-rate'],
      ['green-energy', '12-month'],
      ['fixed-rate', '12-month'],
      ['prepaid', 'no-deposit']
    ];

    for (const city of cities) {
      const cityData = tdspMapping[city];
      if (!cityData) continue;

      for (const filters of commonFilters) {
        // City page
        contexts.push({
          city,
          filters,
          planCount: Math.floor(Math.random() * 100) + 20, // Simulate plan counts
          lowestRate: Math.random() * 0.15 + 0.08, // Simulate rates
          topProviders: ['TXU Energy', 'Reliant'], // Top providers
          pageType: filters.length > 0 ? 'filtered' : 'city',
          cityTier: cityData.tier,
          tdspZone: cityData.zone,
          seasonalContext: this.getCurrentSeason()
        });

        // Comparison page variant
        contexts.push({
          city,
          filters,
          planCount: Math.floor(Math.random() * 100) + 20,
          lowestRate: Math.random() * 0.15 + 0.08,
          topProviders: ['TXU Energy', 'Reliant', 'Direct Energy'],
          pageType: 'comparison',
          cityTier: cityData.tier,
          tdspZone: cityData.zone,
          seasonalContext: this.getCurrentSeason()
        });
      }
    }

    console.warn(`📊 Generated ${contexts.length} total page contexts`);
    return contexts;
  }

  /**
   * Generate contexts for a specific city
   */
  private generateCityContexts(city: string, baseFilters: string[]): ImageGenerationContext[] {
    const contexts: ImageGenerationContext[] = [];
    const cityData = tdspMapping[city];
    
    if (!cityData) {
      console.warn(`⚠️ No city data found for: ${city}`);
      return contexts;
    }

    const filterVariations = [
      baseFilters,
      [...baseFilters, 'green-energy'],
      [...baseFilters, 'fixed-rate'],
      [...baseFilters, '12-month']
    ];

    const pageTypes: Array<'city' | 'filtered' | 'comparison'> = ['city', 'filtered', 'comparison'];

    for (const filters of filterVariations) {
      for (const pageType of pageTypes) {
        contexts.push({
          city,
          filters,
          planCount: Math.floor(Math.random() * 80) + 15,
          lowestRate: Math.random() * 0.12 + 0.09,
          topProviders: ['TXU Energy', 'Reliant'],
          pageType,
          cityTier: cityData.tier,
          tdspZone: cityData.zone,
          seasonalContext: this.getCurrentSeason()
        });
      }
    }

    return contexts;
  }

  /**
   * Generate high-priority contexts (homepage, major cities, common filters)
   */
  private generateHighPriorityContexts(): ImageGenerationContext[] {
    const contexts: ImageGenerationContext[] = [];
    
    // Homepage and state
    contexts.push({
      city: 'texas',
      filters: [],
      planCount: 0,
      lowestRate: 0,
      topProviders: [],
      pageType: 'homepage',
      cityTier: 1,
      tdspZone: 'North',
      seasonalContext: this.getCurrentSeason()
    });

    // Major cities
    const majorCities = ['dallas-tx', 'houston-tx', 'austin-tx', 'san-antonio-tx', 'fort-worth-tx'];
    const highPriorityFilters = [[], ['green-energy'], ['fixed-rate']];

    for (const city of majorCities) {
      const cityData = tdspMapping[city];
      if (!cityData) continue;

      for (const filters of highPriorityFilters) {
        contexts.push({
          city,
          filters,
          planCount: Math.floor(Math.random() * 120) + 30,
          lowestRate: Math.random() * 0.10 + 0.08,
          topProviders: ['TXU Energy', 'Reliant', 'Direct Energy'],
          pageType: filters.length > 0 ? 'filtered' : 'city',
          cityTier: cityData.tier,
          tdspZone: cityData.zone,
          seasonalContext: this.getCurrentSeason()
        });
      }
    }

    console.warn(`🎯 Generated ${contexts.length} high-priority contexts`);
    return contexts;
  }

  /**
   * Create template contexts from strategy optimization
   */
  private createTemplateContexts(
    templates: unknown[], 
    allContexts: ImageGenerationContext[]
  ): ImageGenerationContext[] {
    const templateContexts: ImageGenerationContext[] = [];
    
    for (const template of templates) {
      // Find a representative context for this template
      const representativeContext = allContexts.find(ctx => 
        imageStrategy.selectImageTemplate(ctx).id === template.id
      );
      
      if (representativeContext) {
        templateContexts.push({
          ...representativeContext,
          // Mark as template for cache identification
          isTemplate: true
        });
      }
    }
    
    console.warn(`🏗️ Created ${templateContexts.length} template contexts from ${templates.length} templates`);
    return templateContexts;
  }

  /**
   * Get current season
   */
  private getCurrentSeason(): 'winter' | 'summer' | 'spring' | 'fall' {
    const month = new Date().getMonth() + 1;
    
    if (month >= 12 || month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'fall';
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get batch generation statistics
   */
  async getBatchStats(): Promise<{
    activeJobs: number;
    queuedJobs: number;
    completedJobs: number;
    totalImagesGenerated: number;
    totalErrors: number;
  }> {
    const jobs = Array.from(this.activeJobs.values());
    
    return {
      activeJobs: jobs.filter(j => j.status === 'running').length,
      queuedJobs: jobs.filter(j => j.status === 'pending').length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      totalImagesGenerated: jobs.reduce((sum, j) => sum + j.generatedImages, 0),
      totalErrors: jobs.reduce((sum, j) => sum + j.errors.length, 0)
    };
  }

  /**
   * Clean up completed jobs older than specified days
   */
  cleanupOldJobs(olderThanDays: number = 7): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let cleanedCount = 0;
    
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        const completedAt = job.completedAt ? new Date(job.completedAt) : new Date();
        
        if (completedAt < cutoffDate) {
          this.activeJobs.delete(jobId);
          cleanedCount++;
        }
      }
    }
    
    console.warn(`🧹 Cleaned up ${cleanedCount} old batch jobs`);
    return cleanedCount;
  }
}

// Export singleton instance
export const batchGenerator = new BatchGenerator();