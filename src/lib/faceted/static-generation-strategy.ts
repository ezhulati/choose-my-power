/**
 * Static Page Generation Strategy for Faceted Navigation
 * Implements ISR (Incremental Static Regeneration) and pre-builds high-value pages
 * Optimized for thousands of URL combinations with smart prioritization
 */

import type { GetStaticPathsOptions, GetStaticPathsResult } from 'astro';
import { tdspMapping, type TdspMapping } from '../../config/tdsp-mapping';
import { multiFilterValidator, type FilterCombinationResult } from './multi-filter-validator';
import { facetedRouter } from './faceted-router';

export interface StaticGenerationConfig {
  // Build configuration
  maxPagesPerBuild: number;
  priorityThreshold: number;
  enableISR: boolean;
  
  // City tier configuration
  tier1MaxCombinations: number;
  tier2MaxCombinations: number; 
  tier3MaxCombinations: number;
  
  // Performance limits
  buildTimeoutMs: number;
  maxConcurrentGenerations: number;
  
  // ISR configuration
  revalidateSeconds: number;
  fallbackMode: 'blocking' | 'static' | false;
}

export interface GenerationPlan {
  totalPages: number;
  highPriorityPages: number;
  mediumPriorityPages: number;
  lowPriorityPages: number;
  estimatedBuildTimeMs: number;
  cityBreakdown: Record<string, number>;
  shouldUseISR: boolean;
}

export interface StaticPath {
  params: { path: string };
  props?: {
    preloaded?: boolean;
    priority?: 'high' | 'medium' | 'low';
    lastGenerated?: number;
  };
}

export class StaticGenerationStrategy {
  private config: StaticGenerationConfig;
  
  // Enterprise caching for 881-city optimization
  private readonly tierCityCache: Map<number, string[]> = new Map();
  private readonly generationCache: Map<string, unknown> = new Map();
  private readonly buildMetrics: any = {
    startTime: Date.now(),
    memoryUsage: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  constructor(config?: Partial<StaticGenerationConfig>) {
    this.config = {
      // Build limits
      maxPagesPerBuild: 1000,
      priorityThreshold: 0.7,
      enableISR: true,
      
      // City tier limits
      tier1MaxCombinations: 50,  // Major metros get more combinations
      tier2MaxCombinations: 25,  // Secondary metros get moderate combinations  
      tier3MaxCombinations: 10,  // Smaller cities get basic combinations
      
      // Performance
      buildTimeoutMs: 300000, // 5 minutes max build time
      maxConcurrentGenerations: 10,
      
      // ISR settings
      revalidateSeconds: 3600, // 1 hour
      fallbackMode: 'static',
      
      ...config
    };
  }

  /**
   * Generate static paths for Astro's getStaticPaths
   */
  async generateStaticPaths(): Promise<GetStaticPathsResult> {
    console.warn('🏗️  Generating static paths for faceted navigation...');
    const startTime = Date.now();
    
    try {
      const plan = await this.createGenerationPlan();
      const paths = await this.executePlan(plan);
      
      const duration = Date.now() - startTime;
      console.warn(`✅ Generated ${paths.length} static paths in ${duration}ms`);
      
      // Log generation summary
      this.logGenerationSummary(plan, paths.length, duration);
      
      return paths.map(path => ({
        params: { path: path.params.path },
        props: path.props
      }));
      
    } catch (error) {
      console.error('❌ Static path generation failed:', error);
      
      // Return fallback paths for essential pages
      return this.generateFallbackPaths();
    }
  }

  /**
   * Create generation plan based on city tiers and SEO value
   */
  private async createGenerationPlan(): Promise<GenerationPlan> {
    const plan: GenerationPlan = {
      totalPages: 0,
      highPriorityPages: 0,
      mediumPriorityPages: 0,
      lowPriorityPages: 0,
      estimatedBuildTimeMs: 0,
      cityBreakdown: {},
      shouldUseISR: false
    };

    // Process each city by tier
    for (const [citySlug, cityData] of Object.entries(tdspMapping)) {
      const cityTier = cityData.tier || 3;
      const maxCombinations = this.getMaxCombinationsForTier(cityTier);
      
      // Generate combinations for this city
      const combinations = multiFilterValidator.generateFilterCombinations(citySlug, 2);
      const filteredCombinations = combinations
        .filter(c => c.shouldGenerate)
        .sort((a, b) => this.compareSeoValue(b.seoValue, a.seoValue))
        .slice(0, maxCombinations);

      plan.cityBreakdown[citySlug] = filteredCombinations.length + 1; // +1 for city page
      plan.totalPages += filteredCombinations.length + 1;

      // Count by priority
      filteredCombinations.forEach(combo => {
        switch (combo.seoValue) {
          case 'high': plan.highPriorityPages++; break;
          case 'medium': plan.mediumPriorityPages++; break;
          case 'low': plan.lowPriorityPages++; break;
        }
      });
    }

    // Add city pages as high priority
    plan.highPriorityPages += Object.keys(tdspMapping).length;

    // Estimate build time (rough calculation)
    plan.estimatedBuildTimeMs = plan.totalPages * 500; // 500ms per page estimate

    // Determine if ISR should be used
    plan.shouldUseISR = plan.totalPages > this.config.maxPagesPerBuild && this.config.enableISR;

    return plan;
  }

  /**
   * Execute the generation plan
   */
  private async executePlan(plan: GenerationPlan): Promise<StaticPath[]> {
    const paths: StaticPath[] = [];
    const startTime = Date.now();

    // Batch process cities to avoid memory issues
    const cityChunks = this.chunkArray(Object.entries(tdspMapping), 10);
    
    for (const chunk of cityChunks) {
      // Check timeout
      if (Date.now() - startTime > this.config.buildTimeoutMs) {
        console.warn('⚠️  Build timeout reached, stopping generation');
        break;
      }

      const chunkPaths = await Promise.all(
        chunk.map(([citySlug, cityData]) => this.generatePathsForCity(citySlug, cityData))
      );

      paths.push(...chunkPaths.flat());

      // Respect page limits
      if (paths.length >= this.config.maxPagesPerBuild) {
        console.warn(`⚠️  Reached page limit (${this.config.maxPagesPerBuild}), stopping generation`);
        break;
      }
    }

    return paths.slice(0, this.config.maxPagesPerBuild);
  }

  /**
   * Generate paths for a specific city
   */
  private async generatePathsForCity(citySlug: string, cityData: unknown): Promise<StaticPath[]> {
    const paths: StaticPath[] = [];
    const cityTier = cityData.tier || 3;
    const maxCombinations = this.getMaxCombinationsForTier(cityTier);

    // Always include city page (high priority)
    paths.push({
      params: { path: citySlug },
      props: {
        preloaded: true,
        priority: 'high',
        lastGenerated: Date.now()
      }
    });

    // Generate filter combinations
    try {
      const combinations = multiFilterValidator.generateFilterCombinations(citySlug, 2);
      const topCombinations = combinations
        .filter(c => c.shouldGenerate && c.isValid)
        .sort((a, b) => this.compareSeoValue(b.seoValue, a.seoValue))
        .slice(0, maxCombinations);

      for (const combo of topCombinations) {
        const filterPath = combo.filters.join('/');
        const fullPath = `${citySlug}/${filterPath}`;

        paths.push({
          params: { path: fullPath },
          props: {
            preloaded: true,
            priority: combo.seoValue,
            lastGenerated: Date.now()
          }
        });
      }
    } catch (error) {
      console.warn(`⚠️  Failed to generate combinations for ${citySlug}:`, error);
    }

    return paths;
  }

  /**
   * Get maximum combinations for city tier
   */
  private getMaxCombinationsForTier(tier: number): number {
    switch (tier) {
      case 1: return this.config.tier1MaxCombinations;
      case 2: return this.config.tier2MaxCombinations;
      case 3: return this.config.tier3MaxCombinations;
      default: return this.config.tier3MaxCombinations;
    }
  }

  /**
   * Compare SEO values for sorting
   */
  private compareSeoValue(a: string, b: string): number {
    const valueMap = { high: 3, medium: 2, low: 1 };
    return (valueMap[a as keyof typeof valueMap] || 0) - (valueMap[b as keyof typeof valueMap] || 0);
  }

  /**
   * Generate fallback paths for critical pages
   */
  private generateFallbackPaths(): StaticPath[] {
    const fallbackPaths: StaticPath[] = [];
    
    // Include major cities only
    const majorCities = Object.entries(tdspMapping)
      .filter(([_, data]) => data.tier === 1)
      .slice(0, 10);

    for (const [citySlug] of majorCities) {
      // City page
      fallbackPaths.push({
        params: { path: citySlug },
        props: { preloaded: true, priority: 'high' }
      });

      // Essential filter combinations
      const essentialFilters = ['12-month', 'fixed-rate', 'green-energy'];
      for (const filter of essentialFilters) {
        fallbackPaths.push({
          params: { path: `${citySlug}/${filter}` },
          props: { preloaded: true, priority: 'high' }
        });
      }
    }

    return fallbackPaths;
  }

  /**
   * Utility to chunk arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Log generation summary
   */
  private logGenerationSummary(plan: GenerationPlan, actualGenerated: number, duration: number): void {
    console.warn('\n📊 Static Generation Summary:');
    console.warn('=' .repeat(40));
    console.warn(`Planned pages: ${plan.totalPages}`);
    console.warn(`Generated pages: ${actualGenerated}`);
    console.warn(`High priority: ${plan.highPriorityPages}`);
    console.warn(`Medium priority: ${plan.mediumPriorityPages}`);
    console.warn(`Low priority: ${plan.lowPriorityPages}`);
    console.warn(`Build time: ${duration}ms`);
    console.warn(`Average per page: ${(duration / actualGenerated).toFixed(2)}ms`);
    console.warn(`ISR enabled: ${plan.shouldUseISR ? 'Yes' : 'No'}`);
    
    // Top cities by page count
    const topCities = Object.entries(plan.cityBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    console.warn('\nTop 5 cities by page count:');
    topCities.forEach(([city, count]) => {
      console.warn(`  ${city}: ${count} pages`);
    });
  }

  /**
   * Get ISR configuration for Astro
   */
  getISRConfig(): { revalidate?: number; fallback?: 'blocking' | 'static' | false } {
    if (!this.config.enableISR) return {};
    
    return {
      revalidate: this.config.revalidateSeconds,
      fallback: this.config.fallbackMode
    };
  }

  /**
   * Get pre-build URLs for warming cache
   */
  async getPreBuildUrls(): Promise<string[]> {
    const paths = await this.generateStaticPaths();
    return paths.map(path => `/electricity-plans/${path.params.path}`);
  }

  /**
   * Optimize build for production
   */
  optimizeForProduction(): StaticGenerationConfig {
    return {
      ...this.config,
      maxPagesPerBuild: 2000,    // More pages for production
      tier1MaxCombinations: 100, // More combinations for tier 1 cities
      tier2MaxCombinations: 50,  // More combinations for tier 2 cities
      tier3MaxCombinations: 25,  // More combinations for tier 3 cities
      enableISR: true,
      revalidateSeconds: 3600    // 1 hour revalidation
    };
  }

  /**
   * Optimize build for development
   */
  optimizeForDevelopment(): StaticGenerationConfig {
    return {
      ...this.config,
      maxPagesPerBuild: 50,      // Fewer pages for faster dev builds
      tier1MaxCombinations: 10,  // Minimal combinations
      tier2MaxCombinations: 5,   // Minimal combinations
      tier3MaxCombinations: 3,   // Minimal combinations
      enableISR: false,          // No ISR in development
      buildTimeoutMs: 30000      // 30 seconds max for dev
    };
  }
  
  /**
   * Performance helper methods for 881-city optimization
   */
  private getCitiesByTier(tier: number): string[] {
    if (this.tierCityCache.has(tier)) {
      return this.tierCityCache.get(tier)!;
    }
    
    const cities = Object.entries(tdspMapping)
      .filter(([_, config]) => config.tier === tier)
      .map(([citySlug]) => citySlug)
      .sort((a, b) => {
        // Sort by priority within tier
        const aConfig = tdspMapping[a];
        const bConfig = tdspMapping[b];
        return (bConfig?.priority || 0) - (aConfig?.priority || 0);
      });
    
    this.tierCityCache.set(tier, cities);
    return cities;
  }
  
  private prioritizePaths(paths: StaticPath[]): StaticPath[] {
    return paths.sort((a, b) => {
      const aTier = a.props?.tier || 3;
      const bTier = b.props?.tier || 3;
      
      // Sort by tier first
      if (aTier !== bTier) {
        return aTier - bTier;
      }
      
      // Then by priority
      const priorityMap = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityMap[a.props?.priority as keyof typeof priorityMap] || 0;
      const bPriority = priorityMap[b.props?.priority as keyof typeof priorityMap] || 0;
      
      return bPriority - aPriority;
    });
  }
  
  private clearGenerationCache(): void {
    this.generationCache.clear();
    this.buildMetrics.memoryUsage = process.memoryUsage().heapUsed;
  }
  
  /**
   * Enhanced monitoring and statistics
   */
  getBuildMetrics() {
    return {
      ...this.buildMetrics,
      duration: Date.now() - this.buildMetrics.startTime,
      cacheEfficiency: this.buildMetrics.cacheHits / (this.buildMetrics.cacheHits + this.buildMetrics.cacheMisses),
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    };
  }
}

// Export singleton instances with 881-city optimization
export const productionStrategy = new StaticGenerationStrategy(
  new StaticGenerationStrategy().optimizeForProduction()
);

export const developmentStrategy = new StaticGenerationStrategy(
  new StaticGenerationStrategy().optimizeForDevelopment()
);

// Export the appropriate strategy based on environment
export const staticGenerationStrategy = process.env.NODE_ENV === 'production' 
  ? productionStrategy 
  : developmentStrategy;

// Export utility functions
export async function generateFacetedStaticPaths(): Promise<GetStaticPathsResult> {
  return staticGenerationStrategy.generateStaticPaths();
}

export function getISRConfig() {
  return staticGenerationStrategy.getISRConfig();
}

export async function getPreBuildUrls(): Promise<string[]> {
  return staticGenerationStrategy.getPreBuildUrls();
}