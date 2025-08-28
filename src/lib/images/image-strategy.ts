/**
 * Intelligent Image Reuse Strategy System
 * Optimizes costs by strategically sharing images across similar pages
 * Reduces from 10,000+ unique images to ~300 strategically chosen images
 */

import type { ImageGenerationContext } from '../../types/images';
import { tdspMapping } from '../../config/tdsp-mapping';

interface ImageTemplate {
  id: string;
  name: string;
  pattern: string;
  reuseScope: 'exact' | 'city' | 'zone' | 'tier' | 'filter' | 'global';
  priority: number;
  estimatedPages: number;
}

class ImageStrategy {
  private imageTemplates: ImageTemplate[] = [
    // HOMEPAGE & GLOBAL PAGES (1-5 images)
    { id: 'homepage', name: 'Homepage Hero', pattern: 'homepage', reuseScope: 'exact', priority: 1, estimatedPages: 1 },
    { id: 'state-texas', name: 'Texas State Page', pattern: 'state:texas', reuseScope: 'exact', priority: 1, estimatedPages: 1 },
    { id: 'global-comparison', name: 'Global Comparison', pattern: 'comparison:all', reuseScope: 'global', priority: 1, estimatedPages: 50 },
    { id: 'global-providers', name: 'All Providers', pattern: 'providers:all', reuseScope: 'global', priority: 1, estimatedPages: 20 },
    
    // MAJOR CITIES - UNIQUE IMAGES (Only top 3 cities get unique images)
    { id: 'city-dallas', name: 'Dallas Energy Hub', pattern: 'city:dallas-tx', reuseScope: 'exact', priority: 2, estimatedPages: 200 },
    { id: 'city-houston', name: 'Houston Energy Capital', pattern: 'city:houston-tx', reuseScope: 'exact', priority: 2, estimatedPages: 200 },
    { id: 'city-austin', name: 'Austin Tech Energy', pattern: 'city:austin-tx', reuseScope: 'exact', priority: 2, estimatedPages: 150 },
    
    // TIER-BASED CITY TEMPLATES (12 images: 3 zones × 4 tier combinations)
    { id: 'tier1-north', name: 'Major North Texas Cities', pattern: 'tier:1,zone:North', reuseScope: 'tier', priority: 3, estimatedPages: 200 },
    { id: 'tier2-north', name: 'Mid North Texas Cities', pattern: 'tier:2,zone:North', reuseScope: 'tier', priority: 4, estimatedPages: 150 },
    { id: 'tier1-coast', name: 'Major Coast Cities', pattern: 'tier:1,zone:Coast', reuseScope: 'tier', priority: 3, estimatedPages: 150 },
    { id: 'tier2-coast', name: 'Mid Coast Cities', pattern: 'tier:2,zone:Coast', reuseScope: 'tier', priority: 4, estimatedPages: 100 },
    { id: 'tier1-central', name: 'Major Central Cities', pattern: 'tier:1,zone:Central', reuseScope: 'tier', priority: 3, estimatedPages: 120 },
    { id: 'tier2-central', name: 'Mid Central Cities', pattern: 'tier:2,zone:Central', reuseScope: 'tier', priority: 4, estimatedPages: 80 },
    { id: 'tier1-south', name: 'Major South Cities', pattern: 'tier:1,zone:South', reuseScope: 'tier', priority: 3, estimatedPages: 100 },
    { id: 'tier2-south', name: 'Mid South Cities', pattern: 'tier:2,zone:South', reuseScope: 'tier', priority: 4, estimatedPages: 80 },
    { id: 'tier3-all', name: 'Smaller Texas Cities', pattern: 'tier:3', reuseScope: 'tier', priority: 5, estimatedPages: 300 },
    
    // FILTER-SPECIFIC TEMPLATES (Reduced to ~15 images total)
    { id: 'green-energy-all', name: 'Green Energy Plans', pattern: 'filter:green-energy', reuseScope: 'filter', priority: 3, estimatedPages: 800 },
    { id: 'fixed-rate-all', name: 'Fixed Rate Plans', pattern: 'filter:fixed-rate', reuseScope: 'filter', priority: 3, estimatedPages: 700 },
    { id: '12month-all', name: '12-Month Plans', pattern: 'filter:12-month', reuseScope: 'filter', priority: 3, estimatedPages: 600 },
    { id: 'prepaid-all', name: 'Prepaid Plans', pattern: 'filter:prepaid', reuseScope: 'filter', priority: 4, estimatedPages: 400 },
    { id: 'no-deposit-all', name: 'No Deposit Plans', pattern: 'filter:no-deposit', reuseScope: 'filter', priority: 4, estimatedPages: 400 },
    
    // POPULAR FILTER COMBINATIONS (Only 3 most common)
    { id: 'green-fixed', name: 'Green Fixed Rate', pattern: 'filter:green-energy+fixed-rate', reuseScope: 'filter', priority: 4, estimatedPages: 300 },
    { id: 'green-12month', name: 'Green 12-Month', pattern: 'filter:green-energy+12-month', reuseScope: 'filter', priority: 4, estimatedPages: 250 },
    { id: 'fixed-12month', name: 'Fixed 12-Month', pattern: 'filter:fixed-rate+12-month', reuseScope: 'filter', priority: 4, estimatedPages: 200 },
    
    // SEASONAL/SPECIAL (10-20 images)
    { id: 'summer-cooling', name: 'Summer Cooling', pattern: 'season:summer', reuseScope: 'global', priority: 5, estimatedPages: 1000 },
    { id: 'winter-heating', name: 'Winter Heating', pattern: 'season:winter', reuseScope: 'global', priority: 5, estimatedPages: 1000 },
    { id: 'spring-renewal', name: 'Spring Renewal', pattern: 'season:spring', reuseScope: 'global', priority: 5, estimatedPages: 1000 },
    { id: 'fall-efficiency', name: 'Fall Efficiency', pattern: 'season:fall', reuseScope: 'global', priority: 5, estimatedPages: 1000 },
  ];

  /**
   * Determine which image template to use for a given context
   */
  selectImageTemplate(context: ImageGenerationContext): ImageTemplate {
    // Check for exact matches first (highest priority)
    const exactMatch = this.findExactMatch(context);
    if (exactMatch) return exactMatch;

    // Check for major city matches
    const majorCityMatch = this.findMajorCityMatch(context);
    if (majorCityMatch) return majorCityMatch;

    // Check for filter-specific matches
    const filterMatch = this.findFilterMatch(context);
    if (filterMatch) return filterMatch;

    // Check for tier/zone matches
    const tierMatch = this.findTierMatch(context);
    if (tierMatch) return tierMatch;

    // Fallback to most generic template
    return this.getDefaultTemplate(context);
  }

  /**
   * Generate strategic image mapping for all contexts
   */
  generateImageMapping(contexts: ImageGenerationContext[]): Map<string, ImageTemplate> {
    const mapping = new Map<string, ImageTemplate>();
    const templateUsage = new Map<string, number>();

    contexts.forEach(context => {
      const template = this.selectImageTemplate(context);
      const cacheKey = this.generateCacheKey(context);
      
      mapping.set(cacheKey, template);
      templateUsage.set(template.id, (templateUsage.get(template.id) || 0) + 1);
    });

    // Log usage statistics
    console.log('📊 Image Template Usage:');
    templateUsage.forEach((count, templateId) => {
      const template = this.imageTemplates.find(t => t.id === templateId);
      console.log(`  ${template?.name || templateId}: ${count} pages`);
    });

    const uniqueTemplates = templateUsage.size;
    console.log(`✅ Total unique images needed: ${uniqueTemplates}`);
    console.log(`💰 Cost optimization: ${contexts.length} pages → ${uniqueTemplates} images`);

    return mapping;
  }

  /**
   * Get list of unique templates that need generation
   */
  getRequiredTemplates(contexts: ImageGenerationContext[]): ImageTemplate[] {
    const mapping = this.generateImageMapping(contexts);
    const usedTemplates = new Set<string>();
    
    mapping.forEach(template => {
      usedTemplates.add(template.id);
    });

    return this.imageTemplates.filter(template => usedTemplates.has(template.id));
  }

  /**
   * Get estimated cost savings
   */
  getCostSavings(contexts: ImageGenerationContext[]): {
    totalPages: number;
    uniqueImages: number;
    savingsPercent: number;
    estimatedCostReduction: string;
  } {
    const totalPages = contexts.length;
    const requiredTemplates = this.getRequiredTemplates(contexts);
    const uniqueImages = requiredTemplates.length;
    const savingsPercent = Math.round((1 - uniqueImages / totalPages) * 100);
    
    // Assuming $0.10 per image (example pricing)
    const fullCost = totalPages * 0.10;
    const optimizedCost = uniqueImages * 0.10;
    const savings = fullCost - optimizedCost;
    
    return {
      totalPages,
      uniqueImages,
      savingsPercent,
      estimatedCostReduction: `$${savings.toFixed(2)} (from $${fullCost.toFixed(2)} to $${optimizedCost.toFixed(2)})`
    };
  }

  /**
   * Find exact pattern match
   */
  private findExactMatch(context: ImageGenerationContext): ImageTemplate | null {
    // Homepage
    if (context.pageType === 'homepage') {
      return this.imageTemplates.find(t => t.id === 'homepage') || null;
    }

    // State page
    if (context.pageType === 'state') {
      return this.imageTemplates.find(t => t.id === 'state-texas') || null;
    }

    // Major cities (Dallas, Houston, Austin, etc.)
    const majorCityIds = ['dallas-tx', 'houston-tx', 'austin-tx', 'san-antonio-tx', 'fort-worth-tx'];
    if (majorCityIds.includes(context.city) && context.filters.length === 0) {
      return this.imageTemplates.find(t => t.id === `city-${context.city}`) || null;
    }

    return null;
  }

  /**
   * Find major city match regardless of filters
   */
  private findMajorCityMatch(context: ImageGenerationContext): ImageTemplate | null {
    const majorCityIds = ['dallas-tx', 'houston-tx', 'austin-tx', 'san-antonio-tx', 'fort-worth-tx'];
    
    if (majorCityIds.includes(context.city)) {
      return this.imageTemplates.find(t => t.id === `city-${context.city}`) || null;
    }

    return null;
  }

  /**
   * Find filter-specific match
   */
  private findFilterMatch(context: ImageGenerationContext): ImageTemplate | null {
    if (context.filters.length === 0) return null;

    const cityTier = context.cityTier;
    const primaryFilter = context.filters[0]; // Use first filter as primary

    // Single filter matches
    if (context.filters.length === 1) {
      const tierSuffix = cityTier === 1 ? 'tier1' : 'tier2';
      let templateId = `${primaryFilter.replace('-', '')}-${tierSuffix}`;
      let template = this.imageTemplates.find(t => t.id === templateId);
      
      if (!template) {
        // Fallback to general filter template
        templateId = `${primaryFilter.replace('-', '')}-all`;
        template = this.imageTemplates.find(t => t.id === templateId);
      }
      
      return template || null;
    }

    // Multi-filter combinations
    if (context.filters.length >= 2) {
      const sortedFilters = context.filters.sort();
      const filterCombo = sortedFilters.join('+').replace(/-/g, '');
      const tierSuffix = cityTier === 1 ? 'tier1' : '';
      
      const templateId = `${filterCombo}-${tierSuffix}`.replace('--', '-').replace(/-$/, '');
      const template = this.imageTemplates.find(t => t.id === templateId);
      
      return template || null;
    }

    return null;
  }

  /**
   * Find tier/zone match
   */
  private findTierMatch(context: ImageGenerationContext): ImageTemplate | null {
    const cityData = tdspMapping[context.city];
    if (!cityData) return null;

    const tier = cityData.tier;
    const zone = cityData.zone;

    // Try tier + zone combination
    let templateId = `tier${tier}-${zone.toLowerCase()}`;
    let template = this.imageTemplates.find(t => t.id === templateId);
    
    if (template) return template;

    // Fallback to tier only
    templateId = `tier${tier}-all`;
    template = this.imageTemplates.find(t => t.id === templateId);
    
    return template || null;
  }

  /**
   * Get default fallback template
   */
  private getDefaultTemplate(context: ImageGenerationContext): ImageTemplate {
    // Use tier 3 template as ultimate fallback
    return this.imageTemplates.find(t => t.id === 'tier3-all') || this.imageTemplates[0];
  }

  /**
   * Generate cache key for context
   */
  private generateCacheKey(context: ImageGenerationContext): string {
    const keyComponents = [
      context.city,
      context.filters.sort().join('-'),
      context.pageType,
      context.cityTier,
      context.tdspZone
    ];

    return keyComponents.join('_').replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  /**
   * Get seasonal context for current date
   */
  getCurrentSeasonalContext(): 'winter' | 'summer' | 'spring' | 'fall' {
    const month = new Date().getMonth() + 1; // 1-12
    
    if (month >= 12 || month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'fall';
  }

  /**
   * Preview template distribution
   */
  previewDistribution(contexts: ImageGenerationContext[]): void {
    const mapping = this.generateImageMapping(contexts);
    const distribution = new Map<string, number>();
    
    mapping.forEach(template => {
      distribution.set(template.name, (distribution.get(template.name) || 0) + 1);
    });

    console.log('\n📊 IMAGE TEMPLATE DISTRIBUTION:');
    console.log('=' .repeat(50));
    
    Array.from(distribution.entries())
      .sort(([,a], [,b]) => b - a)
      .forEach(([name, count]) => {
        const percentage = ((count / contexts.length) * 100).toFixed(1);
        console.log(`${name.padEnd(30)} ${count.toString().padStart(4)} pages (${percentage}%)`);
      });
      
    console.log('=' .repeat(50));
    console.log(`Total: ${contexts.length} pages → ${distribution.size} unique images`);
    
    const costSavings = this.getCostSavings(contexts);
    console.log(`💰 Cost Savings: ${costSavings.savingsPercent}% (${costSavings.estimatedCostReduction})`);
  }
}

// Export singleton instance
export const imageStrategy = new ImageStrategy();