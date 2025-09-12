/**
 * Comprehensive SEO System Integration and Testing Utilities
 * Orchestrates all SEO components for 10,000+ page scalability
 * Performance target: <100ms total SEO generation per page
 */

import { generateFacetedMeta, generateBatchMeta, type FacetedMeta } from './meta-generator-scale';
import { determineCanonicalUrl, validateCanonicalUrls } from './canonical-scale';
import { generateFacetedSchema, generateBatchSchema } from './schema-scale';
import { generateInternalLinks, generateBatchInternalLinks, type LinkingContext } from './internal-linking';
import { generateCityHubContent, generateSingleFilterContent, generateMultiFilterContent, generateProviderContent, generateBatchContent, type ContentTemplate } from './content-templates';

// Performance monitoring and optimization
interface SEOPerformanceMetrics {
  totalGenerationTime: number;
  metaGenerationTime: number;
  canonicalGenerationTime: number;
  schemaGenerationTime: number;
  internalLinksTime: number;
  contentGenerationTime: number;
  cacheHitRate: number;
  errorsCount: number;
  pagesProcessed: number;
}

interface SEOPageContext {
  city: string;
  state: string;
  filters: string[];
  planCount: number;
  lowestRate: number;
  averageRate: number;
  topProvider: string;
  tdspName: string;
  population: number;
  currentPath: string;
  pageType: 'city-hub' | 'single-filter' | 'multi-filter' | 'provider';
  priority: number;
  seasonalContext?: 'winter' | 'summer' | 'spring' | 'fall';
  marketData?: {
    searchVolume: number;
    competition: number;
    trending: boolean;
  };
}

interface CompleteSEOOutput {
  meta: FacetedMeta;
  canonical: string;
  schema: object[];
  internalLinks: unknown;
  content: ContentTemplate;
  performance: SEOPerformanceMetrics;
  validation: SEOValidationResult;
}

interface SEOValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
  recommendations: string[];
}

// Global performance tracking
const performanceMetrics = new Map<string, SEOPerformanceMetrics>();
const globalSEOCache = new Map<string, CompleteSEOOutput>();

/**
 * Master SEO generation function - orchestrates all SEO components
 * Generates complete SEO package for a single page with performance tracking
 */
export async function generateCompleteSEO(context: SEOPageContext): Promise<CompleteSEOOutput> {
  const startTime = Date.now();
  const cacheKey = generateSEOCacheKey(context);
  
  // Check cache first for performance optimization
  if (globalSEOCache.has(cacheKey)) {
    const cached = globalSEOCache.get(cacheKey)!;
    cached.performance.cacheHitRate = 1.0;
    return cached;
  }
  
  try {
    // Initialize performance tracking
    const performance: SEOPerformanceMetrics = {
      totalGenerationTime: 0,
      metaGenerationTime: 0,
      canonicalGenerationTime: 0,
      schemaGenerationTime: 0,
      internalLinksTime: 0,
      contentGenerationTime: 0,
      cacheHitRate: 0,
      errorsCount: 0,
      pagesProcessed: 1
    };
    
    // Generate meta tags with performance tracking
    const metaStart = Date.now();
    const meta = await generateFacetedMeta(
      context.city,
      context.filters,
      context.planCount,
      context.lowestRate,
      {
        topProvider: context.topProvider,
        tdspName: context.tdspName,
        seasonalContext: context.seasonalContext
      }
    );
    performance.metaGenerationTime = Date.now() - metaStart;
    
    // Generate canonical URL with performance tracking
    const canonicalStart = Date.now();
    const canonical = determineCanonicalUrl(
      context.currentPath,
      context.filters,
      context.priority,
      context.seasonalContext,
      context.marketData
    );
    performance.canonicalGenerationTime = Date.now() - canonicalStart;
    
    // Generate schema markup with performance tracking
    const schemaStart = Date.now();
    const schema = generateFacetedSchema({
      city: context.city,
      state: context.state,
      filters: context.filters,
      planCount: context.planCount,
      lowestRate: context.lowestRate,
      averageRate: context.averageRate,
      topProvider: context.topProvider,
      currentPath: context.currentPath,
      tdspName: context.tdspName
    });
    performance.schemaGenerationTime = Date.now() - schemaStart;
    
    // Generate internal links with performance tracking
    const linksStart = Date.now();
    const linkingContext: LinkingContext = {
      currentUrl: context.currentPath,
      city: context.city,
      filters: context.filters,
      planCount: context.planCount,
      topProvider: context.topProvider,
      pageType: context.pageType,
      priority: context.priority
    };
    const internalLinks = await generateInternalLinks(linkingContext);
    performance.internalLinksTime = Date.now() - linksStart;
    
    // Generate content template with performance tracking
    const contentStart = Date.now();
    let content: ContentTemplate;
    switch (context.pageType) {
      case 'city-hub':
        content = generateCityHubContent(context);
        break;
      case 'single-filter':
        content = generateSingleFilterContent(context);
        break;
      case 'multi-filter':
        content = generateMultiFilterContent(context);
        break;
      case 'provider':
        content = generateProviderContent(context as SEOPageContext & { provider: string });
        break;
      default:
        content = generateCityHubContent(context);
    }
    performance.contentGenerationTime = Date.now() - contentStart;
    
    // Calculate total performance
    performance.totalGenerationTime = Date.now() - startTime;
    
    // Validate the generated SEO
    const validation = validateSEOOutput({
      meta,
      canonical,
      schema,
      internalLinks,
      content
    });
    
    // Increment error count if validation failed
    if (!validation.isValid) {
      performance.errorsCount = validation.errors.length;
    }
    
    const result: CompleteSEOOutput = {
      meta,
      canonical,
      schema,
      internalLinks,
      content,
      performance,
      validation
    };
    
    // Cache the result for future use
    globalSEOCache.set(cacheKey, result);
    
    // Track metrics
    performanceMetrics.set(cacheKey, performance);
    
    return result;
    
  } catch (error) {
    // Error handling with fallback generation
    console.error('SEO generation error:', error);
    
    return generateFallbackSEO(context, error as Error);
  }
}

/**
 * Batch SEO generation for high-volume page creation
 * Optimized for processing thousands of pages efficiently
 */
export async function generateBatchSEO(
  contexts: SEOPageContext[],
  options: {
    batchSize?: number;
    concurrency?: number;
    cacheStrategy?: 'aggressive' | 'conservative' | 'none';
  } = {}
): Promise<Map<string, CompleteSEOOutput>> {
  const { batchSize = 100, concurrency = 10, cacheStrategy = 'aggressive' } = options;
  const results = new Map<string, CompleteSEOOutput>();
  const totalPages = contexts.length;
  let processedPages = 0;
  
  console.warn(`Starting batch SEO generation for ${totalPages} pages...`);
  
  // Process in batches to manage memory and performance
  for (let i = 0; i < contexts.length; i += batchSize) {
    const batch = contexts.slice(i, i + batchSize);
    const batchStartTime = Date.now();
    
    // Process batch with controlled concurrency
    const batchPromises = batch.map(context => 
      limitConcurrency(() => generateCompleteSEO(context), concurrency)
    );
    
    try {
      const batchResults = await Promise.all(batchPromises);
      
      // Map results back to contexts
      batch.forEach((context, index) => {
        const key = generateSEOCacheKey(context);
        results.set(key, batchResults[index]);
      });
      
      processedPages += batch.length;
      const batchTime = Date.now() - batchStartTime;
      const avgTimePerPage = batchTime / batch.length;
      
      console.warn(`Batch ${Math.floor(i / batchSize) + 1} completed: ${batch.length} pages in ${batchTime}ms (${avgTimePerPage.toFixed(1)}ms/page). Progress: ${processedPages}/${totalPages}`);
      
      // Memory optimization: clear cache if using conservative strategy
      if (cacheStrategy === 'conservative' && globalSEOCache.size > 1000) {
        globalSEOCache.clear();
      }
      
    } catch (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
      
      // Generate fallback results for failed batch
      batch.forEach(context => {
        const key = generateSEOCacheKey(context);
        results.set(key, generateFallbackSEO(context, error as Error));
      });
    }
  }
  
  console.warn(`Batch SEO generation completed: ${processedPages} pages processed`);
  return results;
}

/**
 * SEO validation system with comprehensive quality checks
 */
function validateSEOOutput(seoOutput: Omit<CompleteSEOOutput, 'performance' | 'validation'>): SEOValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  
  // Validate meta tags
  if (!seoOutput.meta.title || seoOutput.meta.title.length < 30) {
    errors.push('Title tag is missing or too short (minimum 30 characters)');
    score -= 15;
  }
  if (seoOutput.meta.title && seoOutput.meta.title.length > 60) {
    warnings.push('Title tag is longer than 60 characters and may be truncated in search results');
    score -= 5;
  }
  if (!seoOutput.meta.description || seoOutput.meta.description.length < 120) {
    errors.push('Meta description is missing or too short (minimum 120 characters)');
    score -= 10;
  }
  if (seoOutput.meta.description && seoOutput.meta.description.length > 160) {
    warnings.push('Meta description is longer than 160 characters and may be truncated');
    score -= 3;
  }
  
  // Validate canonical URL
  if (!seoOutput.canonical || !seoOutput.canonical.startsWith('http')) {
    errors.push('Canonical URL is missing or invalid');
    score -= 10;
  }
  
  // Validate schema markup
  if (!seoOutput.schema || seoOutput.schema.length === 0) {
    errors.push('Schema markup is missing');
    score -= 10;
  } else {
    // Check for required schema types
    const hasOrganization = seoOutput.schema.some((s: unknown) => s['@type'] === 'Organization');
    const hasBreadcrumb = seoOutput.schema.some((s: unknown) => s['@type'] === 'BreadcrumbList');
    const hasItemList = seoOutput.schema.some((s: unknown) => s['@type'] === 'ItemList');
    
    if (!hasOrganization) {
      warnings.push('Missing Organization schema markup');
      score -= 3;
    }
    if (!hasBreadcrumb) {
      warnings.push('Missing BreadcrumbList schema markup');
      score -= 2;
    }
    if (!hasItemList) {
      recommendations.push('Consider adding ItemList schema for electricity plans');
    }
  }
  
  // Validate internal links
  if (!seoOutput.internalLinks || Object.keys(seoOutput.internalLinks).length < 3) {
    warnings.push('Insufficient internal links for SEO optimization');
    score -= 5;
  }
  
  // Validate content template
  if (!seoOutput.content.hero.headline || seoOutput.content.hero.headline.length < 40) {
    warnings.push('Hero headline is missing or too short');
    score -= 3;
  }
  if (!seoOutput.content.introduction || seoOutput.content.introduction.length < 150) {
    warnings.push('Introduction is missing or too short for SEO optimization');
    score -= 3;
  }
  if (seoOutput.content.faq.length < 3) {
    recommendations.push('Add more FAQ items to improve content depth');
  }
  
  // Performance recommendations
  if (score >= 90) {
    recommendations.push('Excellent SEO optimization! Consider A/B testing different title variations.');
  } else if (score >= 80) {
    recommendations.push('Good SEO foundation. Focus on addressing warnings to improve further.');
  } else if (score >= 70) {
    recommendations.push('SEO needs improvement. Address errors and warnings for better search visibility.');
  } else {
    recommendations.push('Critical SEO issues detected. Immediate attention required for search visibility.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, score),
    recommendations
  };
}

/**
 * SEO system health monitoring and diagnostics
 */
export function getSEOSystemHealth(): {
  cacheSize: number;
  averageGenerationTime: number;
  errorRate: number;
  performanceMetrics: SEOPerformanceMetrics;
  recommendations: string[];
} {
  const metrics = Array.from(performanceMetrics.values());
  const totalPages = metrics.length;
  
  if (totalPages === 0) {
    return {
      cacheSize: globalSEOCache.size,
      averageGenerationTime: 0,
      errorRate: 0,
      performanceMetrics: {
        totalGenerationTime: 0,
        metaGenerationTime: 0,
        canonicalGenerationTime: 0,
        schemaGenerationTime: 0,
        internalLinksTime: 0,
        contentGenerationTime: 0,
        cacheHitRate: 0,
        errorsCount: 0,
        pagesProcessed: 0
      },
      recommendations: ['No SEO generation metrics available yet']
    };
  }
  
  const avgGenerationTime = metrics.reduce((sum, m) => sum + m.totalGenerationTime, 0) / totalPages;
  const totalErrors = metrics.reduce((sum, m) => sum + m.errorsCount, 0);
  const errorRate = totalErrors / totalPages;
  const avgCacheHitRate = metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / totalPages;
  
  const aggregatedMetrics: SEOPerformanceMetrics = {
    totalGenerationTime: avgGenerationTime,
    metaGenerationTime: metrics.reduce((sum, m) => sum + m.metaGenerationTime, 0) / totalPages,
    canonicalGenerationTime: metrics.reduce((sum, m) => sum + m.canonicalGenerationTime, 0) / totalPages,
    schemaGenerationTime: metrics.reduce((sum, m) => sum + m.schemaGenerationTime, 0) / totalPages,
    internalLinksTime: metrics.reduce((sum, m) => sum + m.internalLinksTime, 0) / totalPages,
    contentGenerationTime: metrics.reduce((sum, m) => sum + m.contentGenerationTime, 0) / totalPages,
    cacheHitRate: avgCacheHitRate,
    errorsCount: totalErrors,
    pagesProcessed: metrics.reduce((sum, m) => sum + m.pagesProcessed, 0)
  };
  
  const recommendations: string[] = [];
  
  if (avgGenerationTime > 100) {
    recommendations.push('Average generation time exceeds 100ms target. Consider optimizing slow components.');
  }
  if (errorRate > 0.01) {
    recommendations.push('Error rate is above 1%. Review error handling and validation logic.');
  }
  if (avgCacheHitRate < 0.5) {
    recommendations.push('Cache hit rate is low. Consider implementing more aggressive caching strategies.');
  }
  if (globalSEOCache.size > 5000) {
    recommendations.push('Cache size is large. Implement cache eviction strategies to manage memory usage.');
  }
  if (aggregatedMetrics.metaGenerationTime > 30) {
    recommendations.push('Meta generation is slow. Optimize title and description template processing.');
  }
  
  return {
    cacheSize: globalSEOCache.size,
    averageGenerationTime: avgGenerationTime,
    errorRate,
    performanceMetrics: aggregatedMetrics,
    recommendations
  };
}

/**
 * SEO testing and validation utilities
 */
export class SEOTestSuite {
  static async runComprehensiveTests(): Promise<{
    passed: number;
    failed: number;
    results: Array<{ test: string; passed: boolean; message: string; }>;
  }> {
    const results: Array<{ test: string; passed: boolean; message: string; }> = [];
    
    // Test 1: Basic meta generation
    try {
      const testContext: SEOPageContext = {
        city: 'dallas-tx',
        state: 'TX',
        filters: ['12-month'],
        planCount: 45,
        lowestRate: 8.9,
        averageRate: 12.5,
        topProvider: 'Reliant Energy',
        tdspName: 'Oncor',
        population: 1300000,
        currentPath: '/electricity-plans/dallas/12-month',
        pageType: 'single-filter',
        priority: 0.8
      };
      
      const startTime = Date.now();
      const result = await generateCompleteSEO(testContext);
      const generationTime = Date.now() - startTime;
      
      if (generationTime <= 100) {
        results.push({
          test: 'Performance Test',
          passed: true,
          message: `SEO generation completed in ${generationTime}ms (target: <100ms)`
        });
      } else {
        results.push({
          test: 'Performance Test',
          passed: false,
          message: `SEO generation took ${generationTime}ms (exceeds 100ms target)`
        });
      }
      
      if (result.validation.isValid) {
        results.push({
          test: 'Validation Test',
          passed: true,
          message: `SEO validation passed with score ${result.validation.score}`
        });
      } else {
        results.push({
          test: 'Validation Test',
          passed: false,
          message: `SEO validation failed: ${result.validation.errors.join(', ')}`
        });
      }
      
    } catch (error) {
      results.push({
        test: 'Basic Generation Test',
        passed: false,
        message: `SEO generation failed: ${error}`
      });
    }
    
    // Test 2: Batch processing
    try {
      const batchContexts: SEOPageContext[] = Array.from({ length: 10 }, (_, i) => ({
        city: `test-city-${i}`,
        state: 'TX',
        filters: ['12-month'],
        planCount: 20 + i,
        lowestRate: 8.0 + i * 0.1,
        averageRate: 12.0 + i * 0.2,
        topProvider: 'Test Provider',
        tdspName: 'Test TDSP',
        population: 100000 + i * 10000,
        currentPath: `/electricity-plans/test-city-${i}/12-month`,
        pageType: 'single-filter',
        priority: 0.8
      }));
      
      const batchStartTime = Date.now();
      const batchResults = await generateBatchSEO(batchContexts, { batchSize: 5 });
      const batchTime = Date.now() - batchStartTime;
      
      if (batchResults.size === 10 && batchTime < 1000) {
        results.push({
          test: 'Batch Processing Test',
          passed: true,
          message: `Batch processed 10 pages in ${batchTime}ms`
        });
      } else {
        results.push({
          test: 'Batch Processing Test',
          passed: false,
          message: `Batch processing issues: ${batchResults.size}/10 pages, ${batchTime}ms`
        });
      }
      
    } catch (error) {
      results.push({
        test: 'Batch Processing Test',
        passed: false,
        message: `Batch processing failed: ${error}`
      });
    }
    
    // Test 3: Cache efficiency
    try {
      const testContext: SEOPageContext = {
        city: 'cache-test',
        state: 'TX',
        filters: ['fixed-rate'],
        planCount: 30,
        lowestRate: 9.5,
        averageRate: 13.0,
        topProvider: 'Test Provider',
        tdspName: 'Test TDSP',
        population: 500000,
        currentPath: '/electricity-plans/cache-test/fixed-rate',
        pageType: 'single-filter',
        priority: 0.7
      };
      
      // First generation (should be cached)
      await generateCompleteSEO(testContext);
      
      // Second generation (should use cache)
      const startTime = Date.now();
      const cachedResult = await generateCompleteSEO(testContext);
      const cachedTime = Date.now() - startTime;
      
      if (cachedResult.performance.cacheHitRate === 1.0 && cachedTime < 10) {
        results.push({
          test: 'Cache Efficiency Test',
          passed: true,
          message: `Cache hit achieved in ${cachedTime}ms`
        });
      } else {
        results.push({
          test: 'Cache Efficiency Test',
          passed: false,
          message: `Cache efficiency issues: hit rate ${cachedResult.performance.cacheHitRate}, time ${cachedTime}ms`
        });
      }
      
    } catch (error) {
      results.push({
        test: 'Cache Efficiency Test',
        passed: false,
        message: `Cache test failed: ${error}`
      });
    }
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    return { passed, failed, results };
  }
}

// Helper functions

function generateSEOCacheKey(context: SEOPageContext): string {
  return `${context.currentPath}-${context.filters.join('-')}-${context.planCount}-${context.lowestRate}`;
}

function generateFallbackSEO(context: SEOPageContext, error: Error): CompleteSEOOutput {
  const cityName = context.city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return {
    meta: {
      title: `${cityName} Electricity Plans - Compare & Save | ChooseMyPower`,
      description: `Compare electricity plans in ${cityName}, Texas. Find competitive rates and switch to save money on your electricity bill.`,
      keywords: `${cityName} electricity plans, Texas electricity rates`,
      ogTitle: `${cityName} Electricity Plans - Compare & Save`,
      ogDescription: `Find the best electricity plans in ${cityName}, Texas.`,
      ogImage: '/images/og/default-electricity-plans.jpg',
      ogUrl: `https://choosemypower.org${context.currentPath}`,
      structuredData: []
    },
    canonical: `https://choosemypower.org${context.currentPath}`,
    schema: [],
    internalLinks: {},
    content: {
      hero: {
        headline: `Compare ${cityName} Electricity Plans`,
        subheadline: `Find competitive electricity rates in ${cityName}, Texas.`,
        cta: 'Compare Plans',
        benefits: ['Competitive rates', 'Easy switching', 'Trusted providers']
      },
      introduction: `Compare electricity plans in ${cityName}, Texas.`,
      keyPoints: [`Plans available in ${cityName}`, 'Competitive pricing', 'Easy switching process'],
      comparison: {
        title: `Why Choose ${cityName} Electricity Plans`,
        description: 'Find the best electricity plan for your needs.',
        callout: 'Compare plans and save money.'
      },
      faq: [],
      conclusion: `Find your perfect electricity plan in ${cityName}, Texas.`,
      localContext: `${cityName} residents have competitive electricity options.`
    },
    performance: {
      totalGenerationTime: 0,
      metaGenerationTime: 0,
      canonicalGenerationTime: 0,
      schemaGenerationTime: 0,
      internalLinksTime: 0,
      contentGenerationTime: 0,
      cacheHitRate: 0,
      errorsCount: 1,
      pagesProcessed: 1
    },
    validation: {
      isValid: false,
      errors: [`Fallback SEO generated due to error: ${error.message}`],
      warnings: ['Using minimal SEO fallback'],
      score: 30,
      recommendations: ['Fix underlying SEO generation error']
    }
  };
}

// Concurrency control utility
const activeTasks = new Map<string, number>();
async function limitConcurrency<T>(task: () => Promise<T>, limit: number): Promise<T> {
  const taskId = Math.random().toString(36);
  
  while ((activeTasks.get('global') || 0) >= limit) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  activeTasks.set('global', (activeTasks.get('global') || 0) + 1);
  
  try {
    const result = await task();
    return result;
  } finally {
    activeTasks.set('global', (activeTasks.get('global') || 0) - 1);
  }
}

/**
 * SEO system optimization and maintenance utilities
 */
export function optimizeSEOSystem(): {
  cacheCleared: boolean;
  performanceReset: boolean;
  memoryFreed: number;
} {
  const initialCacheSize = globalSEOCache.size;
  
  // Clear caches if they get too large
  if (globalSEOCache.size > 2000) {
    globalSEOCache.clear();
  }
  
  // Reset performance metrics if they get too numerous
  if (performanceMetrics.size > 1000) {
    performanceMetrics.clear();
  }
  
  const memoryFreed = initialCacheSize - globalSEOCache.size;
  
  return {
    cacheCleared: initialCacheSize > globalSEOCache.size,
    performanceReset: performanceMetrics.size === 0,
    memoryFreed
  };
}

export { type SEOPageContext, type CompleteSEOOutput, type SEOValidationResult, type SEOPerformanceMetrics };