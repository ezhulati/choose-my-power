/**
 * TypeScript interfaces for Ideogram.ai OG Image Generation System
 * Supports contextual image generation for 10,000+ page combinations
 */

export interface ImageGenerationContext {
  city: string;
  filters: string[];
  planCount: number;
  lowestRate: number;
  averageRate?: number;
  topProviders: string[];
  pageType: 'homepage' | 'city' | 'filtered' | 'comparison' | 'provider' | 'state';
  cityTier: 1 | 2 | 3;
  tdspZone: 'North' | 'Coast' | 'Central' | 'South' | 'Valley';
  seasonalContext?: 'winter' | 'summer' | 'spring' | 'fall';
  marketTrends?: 'rising' | 'falling' | 'stable';
}

export interface GeneratedImage {
  url: string;
  localPath?: string;
  prompt: string;
  context: ImageGenerationContext;
  generatedAt: string;
  cacheKey: string;
  width: number;
  height: number;
}

export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  aspectRatio?: '16:9' | '1:1' | '3:2' | '19:10';
  style?: 'realistic' | 'illustration' | 'minimalist' | 'corporate' | 'modern';
  colorScheme?: 'blue-green' | 'corporate-blue' | 'energy-bright' | 'texas-warm' | 'professional-dark';
  includeText?: boolean; // Always false for our use case
}

export interface IdeogramApiRequest {
  image_request: {
    prompt: string;
    width: number;
    height: number;
    aspect_ratio?: string;
    model?: 'V_1' | 'V_1_TURBO' | 'V_2' | 'V_2_TURBO';
    magic_prompt_option?: 'ON' | 'OFF' | 'AUTO';
    style_type?: 'REALISTIC' | 'DESIGN' | 'RENDER_3D' | 'ANIME';
    negative_prompt?: string;
  };
}

export interface IdeogramApiResponse {
  created: string;
  data: Array<{
    url: string;
    is_image_safe: boolean;
    prompt: string;
    resolution: string;
    seed: number;
  }>;
}

export interface CachedImage {
  cacheKey: string;
  url: string;
  localPath: string;
  generatedAt: string;
  context: ImageGenerationContext;
  expiresAt: string;
}

export interface ImageCacheStats {
  totalImages: number;
  hitRate: number;
  missRate: number;
  cacheSize: string;
  oldestImage: string;
  newestImage: string;
}

export interface BatchGenerationJob {
  id: string;
  contexts: ImageGenerationContext[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalImages: number;
  generatedImages: number;
  failedImages: number;
  startedAt: string;
  completedAt?: string;
  errors: string[];
}

export interface PromptTemplate {
  id: string;
  name: string;
  basePrompt: string;
  variables: string[];
  pageTypes: string[];
  filterTypes: string[];
  priority: number;
  examples: string[];
}