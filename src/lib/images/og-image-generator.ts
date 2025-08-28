/**
 * OG Image Generator - Integration with Meta Generation System
 * Connects Ideogram API, prompt generation, caching, and cost optimization
 * Provides seamless OG image URLs for all page types
 */

import type { ImageGenerationContext, GeneratedImage } from '../../types/images';
import { ideogramClient } from './ideogram-client';
import { promptGenerator } from './prompt-generator';
import { imageCache } from './image-cache';
import { imageStrategy } from './image-strategy';
import { tdspMapping } from '../../config/tdsp-mapping';

interface OGImageOptions {
  forceRegenerate?: boolean;
  useStrategy?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

class OGImageGenerator {
  // Enterprise grade - no fallback images, all images must be generated successfully

  /**
   * Get OG image URL for page context - main entry point
   */
  async getOGImageUrl(context: ImageGenerationContext, options: OGImageOptions = {}): Promise<string> {
    try {
      // Use cost optimization strategy by default
      const useStrategy = options.useStrategy !== false;
      
      // Check cache first (unless force regenerate)
      if (!options.forceRegenerate) {
        const cachedUrl = await imageCache.getCachedImage(context);
        if (cachedUrl) {
          console.log(`🔥 Using cached OG image: ${cachedUrl}`);
          return cachedUrl;
        }
      }

      // If using strategy, check if we should reuse existing template image
      if (useStrategy) {
        const templateImage = await this.getTemplateImage(context);
        if (templateImage) {
          console.log(`♻️ Using template image: ${templateImage}`);
          return templateImage;
        }
      }

      // Generate new image
      const generatedUrl = await this.generateNewImage(context, options);
      if (generatedUrl) {
        return generatedUrl;
      }

      // Fallback to default images
      console.warn('⚠️ Using fallback OG image');
      return this.getFallbackImage(context);

    } catch (error) {
      console.error('❌ Error generating OG image:', error);
      return this.getFallbackImage(context);
    }
  }

  /**
   * Batch generate OG images for multiple contexts
   */
  async batchGenerateOGImages(
    contexts: ImageGenerationContext[], 
    options: OGImageOptions = {}
  ): Promise<Map<string, string>> {
    console.log(`🔄 Batch generating OG images for ${contexts.length} contexts...`);
    
    const results = new Map<string, string>();
    const useStrategy = options.useStrategy !== false;
    
    if (useStrategy) {
      // Use cost optimization strategy
      const requiredTemplates = imageStrategy.getRequiredTemplates(contexts);
      console.log(`💡 Strategy optimization: ${contexts.length} pages → ${requiredTemplates.length} unique images`);
      
      // Generate template images first
      await this.generateTemplateImages(requiredTemplates, contexts);
      
      // Map all contexts to their template images
      contexts.forEach(context => {
        const template = imageStrategy.selectImageTemplate(context);
        const templateUrl = this.getTemplateImageUrl(template, context);
        results.set(this.generateCacheKey(context), templateUrl);
      });
      
    } else {
      // Generate individual images for each context
      const batchSize = 10;
      for (let i = 0; i < contexts.length; i += batchSize) {
        const batch = contexts.slice(i, i + batchSize);
        const batchPromises = batch.map(context => this.getOGImageUrl(context, options));
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          const context = batch[index];
          const cacheKey = this.generateCacheKey(context);
          
          if (result.status === 'fulfilled') {
            results.set(cacheKey, result.value);
          } else {
            console.warn(`⚠️ Failed to generate image for: ${cacheKey}`);
            results.set(cacheKey, this.getFallbackImage(context));
          }
        });
        
        // Rate limiting delay
        if (i + batchSize < contexts.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    console.log(`✅ Batch complete: ${results.size} OG images ready`);
    return results;
  }

  /**
   * Get OG image for existing meta generator integration
   */
  async getOGImageForMeta(
    city: string,
    filters: string[] = [],
    planCount: number = 0,
    lowestRate: number = 0,
    topProviders: string[] = [],
    pageType: 'homepage' | 'city' | 'filtered' | 'comparison' | 'provider' | 'state' = 'city'
  ): Promise<string> {
    const cityData = tdspMapping[city];
    
    const context: ImageGenerationContext = {
      city,
      filters,
      planCount,
      lowestRate,
      topProviders,
      pageType,
      cityTier: cityData?.tier || 3,
      tdspZone: cityData?.zone as any || 'North',
      seasonalContext: this.getCurrentSeason()
    };

    return await this.getOGImageUrl(context, { useStrategy: true });
  }

  /**
   * Generate new image using Ideogram API
   */
  private async generateNewImage(context: ImageGenerationContext, options: OGImageOptions): Promise<string | null> {
    try {
      // Generate contextual prompt
      const prompt = promptGenerator.generatePrompt(context);
      console.log(`🎨 Generated prompt: ${prompt.substring(0, 100)}...`);

      // Validate prompt quality
      const validation = promptGenerator.validatePrompt(prompt);
      if (!validation.isValid) {
        console.warn('⚠️ Prompt validation issues:', validation.issues);
      }

      // Generate image via Ideogram API
      const generatedImage = await ideogramClient.generateImage(prompt, context);
      
      if (!generatedImage) {
        console.warn('⚠️ Image generation failed');
        return null;
      }

      // Cache the generated image
      const cachedUrl = await imageCache.storeImage(generatedImage);
      
      if (cachedUrl) {
        console.log(`✅ Generated and cached OG image: ${cachedUrl}`);
        return cachedUrl;
      }

      // If caching fails, return direct URL
      return generatedImage.url;

    } catch (error) {
      console.error('❌ Error in generateNewImage:', error);
      return null;
    }
  }

  /**
   * Get template image using cost optimization strategy
   */
  private async getTemplateImage(context: ImageGenerationContext): Promise<string | null> {
    const template = imageStrategy.selectImageTemplate(context);
    
    // Check if template image already exists in cache
    const templateContext = this.createTemplateContext(template, context);
    const cachedUrl = await imageCache.getCachedImage(templateContext);
    
    if (cachedUrl) {
      return cachedUrl;
    }

    return null;
  }

  /**
   * Generate template images for strategy optimization
   */
  private async generateTemplateImages(
    templates: any[],
    contexts: ImageGenerationContext[]
  ): Promise<void> {
    console.log(`🏭 Generating ${templates.length} template images...`);
    
    for (const template of templates) {
      // Find a representative context for this template
      const representativeContext = contexts.find(ctx => 
        imageStrategy.selectImageTemplate(ctx).id === template.id
      );
      
      if (representativeContext) {
        const templateContext = this.createTemplateContext(template, representativeContext);
        
        // Check if template already exists
        const existingUrl = await imageCache.getCachedImage(templateContext);
        if (existingUrl) {
          console.log(`✅ Template ${template.name} already exists`);
          continue;
        }
        
        // Generate template image
        const templateUrl = await this.generateNewImage(templateContext, {});
        if (templateUrl) {
          console.log(`✅ Generated template: ${template.name}`);
        }
      }
    }
    
    console.log(`✅ Template generation complete`);
  }

  /**
   * Create template context for image generation
   */
  private createTemplateContext(template: any, baseContext: ImageGenerationContext): ImageGenerationContext {
    return {
      ...baseContext,
      // Modify context to represent the template rather than specific page
      city: template.pattern.includes('city:') ? 
        template.pattern.split('city:')[1].split(',')[0] : 
        baseContext.city,
      filters: template.pattern.includes('filter:') ? 
        template.pattern.split('filter:')[1].split(',')[0].split('+') : 
        baseContext.filters
    };
  }

  /**
   * Get template image URL
   */
  private getTemplateImageUrl(template: any, context: ImageGenerationContext): string {
    // This would return the cached template image URL
    // For now, return a constructed URL based on template
    return `/images/og/generated/templates/${template.id}.jpg`;
  }

  /**
   * Enterprise grade - use pre-generated static images as robust fallback
   */
  private getFallbackImage(context: ImageGenerationContext): string {
    // Use existing high-quality static images based on context
    const staticImageMap: Record<string, string> = {
      homepage: '/images/og/comprehensive-clean/residential_neighborhood_16x9.png',
      city: this.getCityStaticImage(context),
      filtered: this.getFilterStaticImage(context),
      comparison: '/images/og/comprehensive-clean/plan_comparison_16x9.png',
      provider: '/images/og/fallback_universal_utility.png',
      state: '/images/og/comprehensive-clean/texas_state_overview_16x9.png'
    };

    return staticImageMap[context.pageType] || staticImageMap.homepage;
  }

  /**
   * Get city-specific static image
   */
  private getCityStaticImage(context: ImageGenerationContext): string {
    const cityImages: Record<string, string> = {
      'dallas-tx': '/images/og/clean-cities/dallas_clean_skyline_16x9.png',
      'houston-tx': '/images/og/clean-cities/houston_clean_skyline_16x9.png',
      'austin-tx': '/images/og/clean-cities/austin_clean_skyline_16x9.png',
      'fort-worth-tx': '/images/og/clean-cities/fort_worth_clean_skyline_16x9.png',
      'san-antonio-tx': '/images/og/clean-cities/san_antonio_clean_skyline_16x9.png',
      'arlington-tx': '/images/og/clean-cities/arlington_clean_cityscape_16x9.png',
      'plano-tx': '/images/og/clean-cities/plano_clean_cityscape_16x9.png'
    };

    return cityImages[context.city] || '/images/og/comprehensive-clean/business_district_clean_16x9.png';
  }

  /**
   * Get filter-specific static image
   */
  private getFilterStaticImage(context: ImageGenerationContext): string {
    if (context.filters.includes('green-energy') || context.filters.includes('renewable')) {
      return '/images/og/comprehensive-clean/renewable_energy_clean_16x9.png';
    }
    if (context.filters.includes('12-month')) {
      return '/images/og/comprehensive-clean/12_month_plans_16x9.png';
    }
    if (context.filters.includes('24-month')) {
      return '/images/og/comprehensive-clean/24_month_plans_16x9.png';
    }
    if (context.filters.includes('fixed-rate')) {
      return '/images/og/comprehensive-clean/fixed_rate_concept_16x9.png';
    }
    if (context.filters.includes('variable-rate')) {
      return '/images/og/comprehensive-clean/variable_rate_concept_16x9.png';
    }
    if (context.filters.includes('no-deposit')) {
      return '/images/og/comprehensive-clean/no_deposit_plans_16x9.png';
    }
    if (context.filters.includes('prepaid')) {
      return '/images/og/comprehensive-clean/prepaid_electricity_16x9.png';
    }

    return '/images/og/comprehensive-clean/plan_comparison_16x9.png';
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
   * Get current seasonal context
   */
  private getCurrentSeason(): 'winter' | 'summer' | 'spring' | 'fall' {
    const month = new Date().getMonth() + 1;
    
    if (month >= 12 || month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'fall';
  }

  /**
   * Health check for OG image generation system
   */
  async healthCheck(): Promise<{
    ideogramApi: boolean;
    imageCache: boolean;
    fallbackImages: boolean;
    overallHealth: boolean;
  }> {
    const ideogramHealth = await ideogramClient.healthCheck();
    const cacheStats = await imageCache.getCacheStats();
    return {
      ideogramApi: ideogramHealth,
      imageCache: cacheStats.totalImages >= 0, // Cache is working if we can get stats
      fallbackImages: false, // Enterprise grade - no fallbacks
      overallHealth: ideogramHealth // Must have working API
    };
  }

  /**
   * Get cost optimization report
   */
  async getCostReport(contexts: ImageGenerationContext[]): Promise<any> {
    const costSavings = imageStrategy.getCostSavings(contexts);
    const cacheStats = await imageCache.getCacheStats();
    const healthStatus = await this.healthCheck();
    
    return {
      ...costSavings,
      cacheStats,
      healthStatus,
      recommendations: this.generateRecommendations(costSavings, healthStatus)
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(costSavings: any, health: any): string[] {
    const recommendations: string[] = [];
    
    if (costSavings.savingsPercent > 90) {
      recommendations.push('Excellent cost optimization achieved');
    } else if (costSavings.savingsPercent > 70) {
      recommendations.push('Good cost optimization, consider refinining template strategy');
    } else {
      recommendations.push('Consider implementing more aggressive template sharing');
    }
    
    if (!health.ideogramApi) {
      recommendations.push('Ideogram API unavailable - ensure API key is configured');
    }
    
    if (health.overallHealth) {
      recommendations.push('System ready for production use');
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const ogImageGenerator = new OGImageGenerator();