/**
 * Fal.ai API Client for Image Generation
 * Production-ready client with error handling, rate limiting, and caching
 */

import { fal } from "@fal-ai/client";
import type { 
  ImageGenerationOptions,
  GeneratedImage,
  ImageGenerationContext 
} from '../../types/images';

// Configure fal with API key
fal.config({
  credentials: process.env.FAL_KEY || import.meta.env.FAL_KEY || ''
});

interface FalImageResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  timings: Record<string, number>;
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

interface NanoBananaResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  timings: Record<string, number>;
  prompt: string;
}

class FalClient {
  private apiKey: string;
  private rateLimitDelay: number = 1000; // 1 second between requests (fal is faster)
  private lastRequestTime: number = 0;
  private retryAttempts: number = 3;
  private retryDelay: number = 2000; // 2 seconds retry delay

  constructor() {
    this.apiKey = process.env.FAL_KEY || import.meta.env.FAL_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ Fal.ai API key not found. Image generation will use fallbacks.');
    }
  }

  /**
   * Generate image using fal.ai Stable Diffusion
   */
  async generateImage(
    prompt: string, 
    context: ImageGenerationContext,
    options: ImageGenerationOptions = {}
  ): Promise<GeneratedImage | null> {
    if (!this.apiKey) {
      console.warn('⚠️ Fal.ai API key missing, using fallback image');
      return this.getFallbackImage(prompt, context);
    }

    // Apply rate limiting
    await this.enforceRateLimit();

    const requestData = {
      prompt: this.enhancePrompt(prompt),
      negative_prompt: 'text, words, letters, numbers, writing, typography, labels, signs, watermark, signature, blurry, low quality, pixelated, cartoon, anime',
      image_size: options.aspectRatio === '1:1' ? 'square_hd' : 'landscape_16_9', // 16:9 for OG images
      num_inference_steps: 25, // Good balance of speed vs quality
      guidance_scale: 7.5, // Standard guidance
      num_images: 1,
      enable_safety_checker: true,
      sync_mode: true, // Synchronous for better error handling
      seed: Math.floor(Math.random() * 1000000) // Random seed for variety
    };

    try {
      console.log(`🎨 Generating with fal.ai: ${prompt.substring(0, 50)}...`);
      
      const response = await fal.subscribe("fal-ai/stable-diffusion-v35-large", {
        input: requestData,
        logs: false, // Disable logs for cleaner output
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log(`⏳ Generation in progress...`);
          }
        }
      }) as { data: FalImageResponse };
      
      if (response?.data?.images?.[0]) {
        const imageData = response.data.images[0];
        
        return {
          url: imageData.url,
          prompt: response.data.prompt,
          context,
          generatedAt: new Date().toISOString(),
          cacheKey: this.generateCacheKey(context),
          width: imageData.width || 1216, // Default fal.ai landscape_16_9 width
          height: imageData.height || 832, // Default fal.ai landscape_16_9 height
          provider: 'fal.ai',
          seed: response.data.seed
        };
      }

      throw new Error('No image data received from fal.ai');

    } catch (error: any) {
      console.error('❌ Fal.ai API error:', error.message || error);
      
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
    const batchSize = 3; // Process 3 at a time for fal.ai
    
    console.log(`🎨 Starting fal.ai batch generation of ${prompts.length} images...`);

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

        // Delay between batches to be respectful
        if (i + batchSize < prompts.length) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

      } catch (error) {
        console.error('❌ Batch processing error:', error);
      }
    }

    console.log(`🎉 Fal.ai batch complete: ${results.length}/${prompts.length} images generated`);
    return results;
  }

  /**
   * Enhance prompt with consistent quality markers for fal.ai
   */
  private enhancePrompt(prompt: string): string {
    const qualityEnhancements = [
      'high quality',
      'professional photography',
      'detailed',
      'crisp',
      'cinematic lighting',
      '8K resolution'
    ];

    const noTextReminder = 'no text, no words, no letters, no typography, clean image';
    
    return `${prompt}, ${qualityEnhancements.join(', ')}, ${noTextReminder}`;
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
   * Enterprise grade - no fallbacks, throw error if API fails
   */
  private getFallbackImage(prompt: string, context: ImageGenerationContext): never {
    throw new Error(`Image generation failed for ${context.pageType}: ${prompt}. Enterprise build requires successful API generation.`);
  }

  /**
   * Check API connection and key validity
   */
  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      // Simple test generation to verify API access
      const testPrompt = 'simple blue geometric pattern, minimal design, no text';
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
      return result !== null && result.provider === 'fal.ai';

    } catch (error) {
      console.error('❌ Fal.ai API health check failed:', error);
      return false;
    }
  }

  /**
   * Create new images using nano-banana + Gemini model
   */
  async createWithNanoBanana(
    prompt: string,
    referenceImageUrls: string[],
    context: ImageGenerationContext,
    options: ImageGenerationOptions = {}
  ): Promise<GeneratedImage | null> {
    if (!this.apiKey) {
      console.warn('⚠️ Fal.ai API key missing, skipping nano-banana generation');
      return null;
    }

    // Apply rate limiting
    await this.enforceRateLimit();

    const requestData = {
      prompt: this.enhancePromptForNanoBanana(prompt),
      image_urls: referenceImageUrls, // Multiple reference images for nano-banana
      num_images: 1,
      output_format: options.outputFormat || "png",
      sync_mode: false // Use URLs instead of data URIs
    };

    try {
      console.log(`🍌 Creating with nano-banana: ${prompt.substring(0, 50)}...`);
      
      const response = await fal.subscribe("fal-ai/nano-banana/edit", {
        input: requestData,
        logs: false,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log(`⏳ nano-banana generation in progress...`);
          }
        }
      }) as { data: NanoBananaResponse };
      
      if (response?.data?.images?.[0]) {
        const imageData = response.data.images[0];
        
        return {
          url: imageData.url,
          prompt: response.data.prompt || prompt,
          context,
          generatedAt: new Date().toISOString(),
          cacheKey: this.generateCacheKey(context) + '_nano',
          width: imageData.width || 1216,
          height: imageData.height || 832,
          provider: 'nano-banana+gemini',
          description: response.data.description
        };
      }

      throw new Error('No image data received from nano-banana');

    } catch (error: any) {
      console.error('❌ nano-banana API error:', error.message || error);
      return null;
    }
  }

  /**
   * Generate new images with nano-banana text-to-image (Gemini-powered)
   */
  async generateWithNanoBanana(
    prompt: string, 
    context: ImageGenerationContext,
    options: ImageGenerationOptions = {}
  ): Promise<GeneratedImage | null> {
    if (!this.apiKey) {
      console.warn('⚠️ Fal.ai API key missing, using fallback image');
      return this.getFallbackImage(prompt, context);
    }

    // Apply rate limiting
    await this.enforceRateLimit();

    const requestData = {
      prompt: this.enhancePromptForNanoBanana(prompt),
      num_images: 1,
      output_format: options.outputFormat || "png",
      sync_mode: false // Use URLs instead of data URIs
    };

    try {
      console.log(`🍌 Generating with nano-banana: ${prompt.substring(0, 50)}...`);
      
      const response = await fal.subscribe("fal-ai/nano-banana", {
        input: requestData,
        logs: false,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log(`⏳ nano-banana generation in progress...`);
          }
        }
      }) as { data: NanoBananaResponse };
      
      if (response?.data?.images?.[0]) {
        const imageData = response.data.images[0];
        
        return {
          url: imageData.url,
          prompt: response.data.prompt || prompt,
          context,
          generatedAt: new Date().toISOString(),
          cacheKey: this.generateCacheKey(context) + '_nano',
          width: imageData.width || 1216,
          height: imageData.height || 832,
          provider: 'nano-banana+gemini',
          description: response.data.description
        };
      }

      throw new Error('No image data received from nano-banana');

    } catch (error: any) {
      console.error('❌ nano-banana API error:', error.message || error);
      
      // Return fallback image on API failure
      return this.getFallbackImage(prompt, context);
    }
  }

  /**
   * Batch generation with nano-banana + Gemini
   */
  async generateNanoBananaBatch(
    prompts: { prompt: string; context: ImageGenerationContext }[],
    options: ImageGenerationOptions = {}
  ): Promise<GeneratedImage[]> {
    const results: GeneratedImage[] = [];
    const batchSize = 1; // Process one at a time for nano-banana (Gemini-powered)
    
    console.log(`🍌 Starting nano-banana + Gemini batch generation of ${prompts.length} images...`);

    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize);
      const batchPromises = batch.map(({ prompt, context }) => 
        this.generateWithNanoBanana(prompt, context, options)
      );

      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            results.push(result.value);
            console.log(`✅ Generated nano-banana image ${i + index + 1}/${prompts.length}`);
          } else {
            console.warn(`⚠️ Failed to generate nano-banana image ${i + index + 1}/${prompts.length}`);
          }
        });

        // Longer delay between nano-banana requests (respects Gemini rate limits)
        if (i + batchSize < prompts.length) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error('❌ Batch processing error:', error);
      }
    }

    console.log(`🎉 nano-banana batch complete: ${results.length}/${prompts.length} images generated`);
    return results;
  }

  /**
   * Enhanced prompt for nano-banana + Gemini model
   */
  private enhancePromptForNanoBanana(prompt: string): string {
    // nano-banana works with natural language descriptions for Gemini
    const nanoBananaPrefix = 'Create a professional, high-quality image that shows: ';
    const qualityEnhancements = [
      'professional photography quality',
      'clean composition',
      'vibrant colors',
      'crisp details',
      'suitable for website use'
    ];
    
    return `${nanoBananaPrefix}${prompt}. Style: ${qualityEnhancements.join(', ')}.`;
  }

  /**
   * Get API pricing info
   */
  getPricingInfo(): { costPerImage: number; currency: string; description: string } {
    return {
      costPerImage: 0.01, // nano-banana + Gemini cost per image
      currency: 'USD',
      description: 'nano-banana + Google Gemini image generation - premium quality'
    };
  }
}

// Export singleton instance
export const falClient = new FalClient();