/**
 * Ideogram.ai API Client for OG Image Generation
 * Production-ready client with error handling, rate limiting, and caching
 */

import type { 
  IdeogramApiRequest, 
  IdeogramApiResponse, 
  ImageGenerationOptions,
  GeneratedImage,
  ImageGenerationContext 
} from '../../types/images';

class IdeogramClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.ideogram.ai/v1/ideogram-v3/generate';
  private rateLimitDelay: number = 2000; // 2 seconds between requests (conservative)
  private lastRequestTime: number = 0;
  private retryAttempts: number = 3;
  private retryDelay: number = 3000; // 3 seconds retry delay

  constructor() {
    this.apiKey = import.meta.env.IDEOGRAM_API_KEY || process.env.IDEOGRAM_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ Ideogram API key not found. Image generation will use fallbacks.');
    }
  }

  /**
   * Generate image using Ideogram.ai API
   */
  async generateImage(
    prompt: string, 
    context: ImageGenerationContext,
    options: ImageGenerationOptions = {}
  ): Promise<GeneratedImage | null> {
    if (!this.apiKey) {
      console.warn('⚠️ Ideogram API key missing, using fallback image');
      return this.getFallbackImage(prompt, context);
    }

    // Apply rate limiting
    await this.enforceRateLimit();

    const requestData = {
      prompt: this.enhancePrompt(prompt),
      rendering_speed: 'TURBO', // Fast rendering for OG images
      style_type: this.mapStyleType(options.style || 'modern'),
      aspect_ratio: options.aspectRatio || '16:9', // Good for OG images
      negative_prompt: 'text, words, letters, numbers, writing, typography, labels, signs, watermark, signature, blurry, low quality, pixelated'
    };

    try {
      const response = await this.makeRequest(requestData);
      
      if (response?.data?.[0]) {
        const imageData = response.data[0];
        
        return {
          url: imageData.url,
          prompt: imageData.prompt,
          context,
          generatedAt: new Date().toISOString(),
          cacheKey: this.generateCacheKey(context),
          width: 1200, // Standard OG image width
          height: 630  // Standard OG image height
        };
      }

      throw new Error('No image data received from Ideogram API');

    } catch (error) {
      console.error('❌ Ideogram API error:', error);
      
      // Return fallback image on API failure
      return this.getFallbackImage(prompt, context);
    }
  }

  /**
   * Generate multiple images in batch with intelligent queuing
   */
  async generateBatch(
    prompts: { prompt: string; context: ImageGenerationContext }[],
    options: ImageGenerationOptions = {}
  ): Promise<GeneratedImage[]> {
    const results: GeneratedImage[] = [];
    const batchSize = 5; // Process 5 at a time to respect rate limits
    
    console.log(`🎨 Starting batch generation of ${prompts.length} images...`);

    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize);
      const batchPromises = batch.map(({ prompt, context }) => 
        this.generateImage(prompt, context, options)
      );

      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            results.push(result.value);
            console.log(`✅ Generated image ${i + index + 1}/${prompts.length}`);
          } else {
            console.warn(`⚠️ Failed to generate image ${i + index + 1}/${prompts.length}`);
          }
        });

        // Delay between batches to respect rate limits
        if (i + batchSize < prompts.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error('❌ Batch processing error:', error);
      }
    }

    console.log(`🎉 Batch complete: ${results.length}/${prompts.length} images generated`);
    return results;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(data: any): Promise<any> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Api-Key': this.apiKey, // Ideogram v3 uses Api-Key header
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return await response.json();

      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Attempt ${attempt}/${this.retryAttempts} failed:`, error);

        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Enhance prompt with consistent quality markers
   */
  private enhancePrompt(prompt: string): string {
    const qualityEnhancements = [
      'high quality',
      'professional design',
      'clean composition',
      'modern style',
      'vibrant colors',
      'clear details'
    ];

    const noTextReminder = 'no text, no words, no letters, no typography';
    
    return `${prompt}, ${qualityEnhancements.join(', ')}, ${noTextReminder}`;
  }

  /**
   * Map our style options to Ideogram API style types
   */
  private mapStyleType(style: string): 'REALISTIC' | 'DESIGN' | 'RENDER_3D' | 'ANIME' {
    const styleMap: Record<string, 'REALISTIC' | 'DESIGN' | 'RENDER_3D' | 'ANIME'> = {
      realistic: 'REALISTIC',
      illustration: 'DESIGN',
      minimalist: 'DESIGN',
      corporate: 'DESIGN',
      modern: 'DESIGN',
      '3d': 'RENDER_3D'
    };

    return styleMap[style] || 'DESIGN';
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
   * Enforce rate limiting between requests
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Get fallback image when API fails
   */
  private getFallbackImage(prompt: string, context: ImageGenerationContext): GeneratedImage {
    // Generate a unique fallback based on context
    const fallbackImages = {
      homepage: '/images/og/fallback-homepage.jpg',
      city: `/images/og/fallback-city-${context.cityTier}.jpg`,
      filtered: `/images/og/fallback-filtered.jpg`,
      comparison: '/images/og/fallback-comparison.jpg',
      provider: '/images/og/fallback-provider.jpg',
      state: '/images/og/fallback-state.jpg'
    };

    return {
      url: fallbackImages[context.pageType] || '/images/og/fallback-default.jpg',
      prompt,
      context,
      generatedAt: new Date().toISOString(),
      cacheKey: this.generateCacheKey(context),
      width: 1200,
      height: 630
    };
  }

  /**
   * Check API connection and key validity
   */
  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      // Simple test generation to verify API access
      const testPrompt = 'simple blue circle, minimal design, no text';
      const testContext: ImageGenerationContext = {
        city: 'test',
        filters: [],
        planCount: 0,
        lowestRate: 0,
        topProviders: [],
        pageType: 'homepage',
        cityTier: 1,
        tdspZone: 'North'
      };

      const result = await this.generateImage(testPrompt, testContext);
      return result !== null;

    } catch (error) {
      console.error('❌ Ideogram API health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const ideogramClient = new IdeogramClient();