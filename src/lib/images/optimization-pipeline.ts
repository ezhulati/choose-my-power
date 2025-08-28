/**
 * Image Optimization Pipeline
 * Provides WebP conversion, lazy loading, and responsive sizing
 * Integrates with CDN for maximum performance
 */

interface ImageOptimizationConfig {
  formats: Array<'webp' | 'avif' | 'jpeg' | 'png'>;
  quality: number; // 1-100
  sizes: Array<{ width: number; height?: number; suffix: string }>;
  lazyLoading: boolean;
  placeholder: 'blur' | 'empty' | 'base64';
  cdnBaseUrl?: string;
}

interface OptimizedImageSource {
  src: string;
  srcSet: string;
  sizes: string;
  type: string;
  width: number;
  height?: number;
}

interface OptimizedImageData {
  sources: OptimizedImageSource[];
  fallback: {
    src: string;
    width: number;
    height?: number;
  };
  placeholder?: string;
  alt: string;
  loading: 'lazy' | 'eager';
}

export class ImageOptimizationPipeline {
  private config: ImageOptimizationConfig;
  private cache = new Map<string, OptimizedImageData>();
  private observer: IntersectionObserver | null = null;

  constructor(config: Partial<ImageOptimizationConfig> = {}) {
    this.config = {
      formats: ['webp', 'jpeg'],
      quality: 85,
      sizes: [
        { width: 320, suffix: '_xs' },
        { width: 640, suffix: '_sm' },
        { width: 768, suffix: '_md' },
        { width: 1024, suffix: '_lg' },
        { width: 1280, suffix: '_xl' },
        { width: 1920, suffix: '_xxl' }
      ],
      lazyLoading: true,
      placeholder: 'blur',
      cdnBaseUrl: 'https://res.cloudinary.com/choosemypower/image/fetch',
      ...config
    };

    if (typeof window !== 'undefined' && this.config.lazyLoading) {
      this.initializeLazyLoading();
    }
  }

  /**
   * Optimize an image and generate responsive sources
   */
  async optimizeImage(
    originalSrc: string,
    alt: string,
    options: {
      priority?: boolean;
      aspectRatio?: string;
      objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
      maxWidth?: number;
    } = {}
  ): Promise<OptimizedImageData> {
    const cacheKey = `${originalSrc}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const sources: OptimizedImageSource[] = [];
    
    // Generate sources for each format
    for (const format of this.config.formats) {
      const source = await this.generateSource(originalSrc, format, options);
      sources.push(source);
    }

    // Generate fallback (original format, optimized)
    const fallback = await this.generateFallback(originalSrc, options);
    
    // Generate placeholder if needed
    const placeholder = await this.generatePlaceholder(originalSrc);

    const optimizedData: OptimizedImageData = {
      sources,
      fallback,
      placeholder,
      alt,
      loading: options.priority ? 'eager' : 'lazy'
    };

    // Cache the result
    this.cache.set(cacheKey, optimizedData);
    
    return optimizedData;
  }

  /**
   * Generate responsive source for a specific format
   */
  private async generateSource(
    originalSrc: string,
    format: string,
    options: any
  ): Promise<OptimizedImageSource> {
    const sizes = this.config.sizes.filter(size => 
      !options.maxWidth || size.width <= options.maxWidth
    );

    const srcSetEntries: string[] = [];
    const sizeEntries: string[] = [];

    for (const size of sizes) {
      const optimizedSrc = this.generateOptimizedUrl(originalSrc, {
        format,
        width: size.width,
        height: size.height,
        quality: this.config.quality,
        aspectRatio: options.aspectRatio
      });

      srcSetEntries.push(`${optimizedSrc} ${size.width}w`);
      
      // Generate size descriptor for responsive images
      if (size.width <= 640) {
        sizeEntries.push('(max-width: 640px) 100vw');
      } else if (size.width <= 768) {
        sizeEntries.push('(max-width: 768px) 100vw');
      } else if (size.width <= 1024) {
        sizeEntries.push('(max-width: 1024px) 50vw');
      } else {
        sizeEntries.push('33vw');
      }
    }

    const primarySize = sizes[Math.floor(sizes.length / 2)]; // Use middle size as primary

    return {
      src: this.generateOptimizedUrl(originalSrc, {
        format,
        width: primarySize.width,
        height: primarySize.height,
        quality: this.config.quality,
        aspectRatio: options.aspectRatio
      }),
      srcSet: srcSetEntries.join(', '),
      sizes: [...new Set(sizeEntries)].join(', '),
      type: `image/${format}`,
      width: primarySize.width,
      height: primarySize.height
    };
  }

  /**
   * Generate fallback image source
   */
  private async generateFallback(originalSrc: string, options: any) {
    const fallbackSize = this.config.sizes.find(s => s.width === 1024) || this.config.sizes[0];
    
    return {
      src: this.generateOptimizedUrl(originalSrc, {
        format: 'jpeg',
        width: fallbackSize.width,
        height: fallbackSize.height,
        quality: this.config.quality,
        aspectRatio: options.aspectRatio
      }),
      width: fallbackSize.width,
      height: fallbackSize.height
    };
  }

  /**
   * Generate placeholder image
   */
  private async generatePlaceholder(originalSrc: string): Promise<string | undefined> {
    if (this.config.placeholder === 'empty') {
      return undefined;
    }

    if (this.config.placeholder === 'blur') {
      // Generate low-quality blurred version
      return this.generateOptimizedUrl(originalSrc, {
        format: 'jpeg',
        width: 40,
        height: 40,
        quality: 20,
        blur: 20
      });
    }

    if (this.config.placeholder === 'base64') {
      // Generate base64 encoded micro thumbnail
      return this.generateBase64Placeholder(originalSrc);
    }

    return undefined;
  }

  /**
   * Generate optimized image URL using CDN
   */
  private generateOptimizedUrl(
    originalSrc: string,
    params: {
      format?: string;
      width?: number;
      height?: number;
      quality?: number;
      aspectRatio?: string;
      blur?: number;
    }
  ): string {
    if (!this.config.cdnBaseUrl) {
      return originalSrc; // Return original if no CDN configured
    }

    const url = new URL(this.config.cdnBaseUrl);
    const searchParams = new URLSearchParams();

    // Add transformation parameters
    if (params.format) searchParams.set('f', params.format);
    if (params.width) searchParams.set('w', params.width.toString());
    if (params.height) searchParams.set('h', params.height.toString());
    if (params.quality) searchParams.set('q', params.quality.toString());
    if (params.aspectRatio) searchParams.set('ar', params.aspectRatio);
    if (params.blur) searchParams.set('e', `blur:${params.blur}`);

    // Add optimization flags
    searchParams.set('c', 'fill'); // Crop/fit mode
    searchParams.set('g', 'auto'); // Auto gravity/focus
    searchParams.set('dpr', '2.0'); // Device pixel ratio

    url.search = searchParams.toString();
    
    // Append original image URL
    return `${url.toString()}/${encodeURIComponent(originalSrc)}`;
  }

  /**
   * Generate base64 placeholder
   */
  private async generateBase64Placeholder(originalSrc: string): Promise<string> {
    // For now, return a simple gray placeholder
    // In production, this would generate actual base64 from the image
    const grayPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
    return grayPixel;
  }

  /**
   * Initialize lazy loading with Intersection Observer
   */
  private initializeLazyLoading(): void {
    if (!('IntersectionObserver' in window)) {
      console.warn('Intersection Observer not supported, disabling lazy loading');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.observer?.unobserve(img);
          }
        });
      },
      {
        // Start loading when image is 100px from viewport
        rootMargin: '100px 0px',
        threshold: 0.01
      }
    );
  }

  /**
   * Load an image with lazy loading
   */
  private loadImage(img: HTMLImageElement): void {
    const dataSrc = img.getAttribute('data-src');
    const dataSrcSet = img.getAttribute('data-srcset');

    if (dataSrc) {
      img.src = dataSrc;
      img.removeAttribute('data-src');
    }

    if (dataSrcSet) {
      img.srcset = dataSrcSet;
      img.removeAttribute('data-srcset');
    }

    // Add fade-in animation
    img.style.transition = 'opacity 0.3s ease-in-out';
    img.style.opacity = '0';
    
    img.onload = () => {
      img.style.opacity = '1';
      img.classList.add('loaded');
    };

    img.onerror = () => {
      img.classList.add('error');
      console.warn('Failed to load image:', img.src);
    };
  }

  /**
   * Create optimized picture element HTML
   */
  createPictureElement(imageData: OptimizedImageData): string {
    const sources = imageData.sources
      .map(source => {
        const srcAttr = imageData.loading === 'lazy' ? 'data-srcset' : 'srcset';
        return `<source ${srcAttr}="${source.srcSet}" sizes="${source.sizes}" type="${source.type}">`;
      })
      .join('\n');

    const imgAttrs = [
      `src="${imageData.loading === 'lazy' ? (imageData.placeholder || '') : imageData.fallback.src}"`,
      imageData.loading === 'lazy' ? `data-src="${imageData.fallback.src}"` : '',
      `alt="${imageData.alt}"`,
      `loading="${imageData.loading}"`,
      `width="${imageData.fallback.width}"`,
      imageData.fallback.height ? `height="${imageData.fallback.height}"` : '',
      'class="responsive-image"'
    ].filter(Boolean).join(' ');

    return `
      <picture>
        ${sources}
        <img ${imgAttrs} />
      </picture>
    `;
  }

  /**
   * Initialize lazy loading for existing images
   */
  initializeLazyImages(): void {
    if (!this.observer) return;

    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
      this.observer!.observe(img);
    });
  }

  /**
   * Preload critical images
   */
  preloadCriticalImages(sources: string[]): void {
    sources.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    return {
      cachedImages: this.cache.size,
      supportedFormats: this.config.formats,
      lazyLoadingEnabled: this.config.lazyLoading && !!this.observer
    };
  }

  /**
   * Clear image cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Destroy the pipeline and cleanup resources
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.clearCache();
  }
}

// Export singleton instance
export const imageOptimizer = new ImageOptimizationPipeline();

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    imageOptimizer.initializeLazyImages();
  });
}

// Utility function for Astro components
export async function optimizeImageForAstro(
  src: string,
  alt: string,
  options?: Parameters<typeof imageOptimizer.optimizeImage>[2]
) {
  const optimized = await imageOptimizer.optimizeImage(src, alt, options);
  return imageOptimizer.createPictureElement(optimized);
}