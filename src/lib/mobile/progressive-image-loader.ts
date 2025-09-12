/**
 * Progressive Image Loading System for Mobile
 * Optimized image loading with progressive enhancement, bandwidth awareness,
 * and mobile-first performance for Texas electricity comparison platform
 */

interface ProgressiveImageConfig {
  // Progressive loading settings
  placeholderQuality: number;     // Quality for initial placeholder (1-100)
  progressiveSteps: number[];     // Quality steps for progressive loading
  lazyLoadThreshold: string;      // Intersection observer threshold
  
  // Mobile optimizations
  maxMobileWidth: number;         // Max width for mobile images
  webpSupport: boolean;          // Use WebP when supported
  avifSupport: boolean;          // Use AVIF when supported
  
  // Bandwidth awareness
  respectDataSaver: boolean;      // Honor data saver preference
  adaptToConnection: boolean;     // Adapt quality based on connection
  
  // Performance settings
  preloadCritical: number;        // Number of above-fold images to preload
  batchLoadSize: number;         // Number of images to load in parallel
  loadingDelay: number;          // Delay between batch loads (ms)
  
  // Error handling
  retryAttempts: number;         // Max retry attempts for failed loads
  fallbackFormat: string;        // Fallback image format
  
  // Caching
  enableServiceWorker: boolean;  // Use service worker for caching
  cacheStrategy: 'network-first' | 'cache-first' | 'stale-while-revalidate';
}

interface ImageLoadState {
  src: string;
  placeholder: string;
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  retryCount: number;
  loadStartTime: number;
  currentStep: number;
  totalSteps: number;
}

interface ConnectionInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface ImageMetrics {
  totalImages: number;
  loadedImages: number;
  failedImages: number;
  averageLoadTime: number;
  bandwidthSaved: number; // in bytes
  webpUsage: number;      // percentage
  avifUsage: number;      // percentage
}

class ProgressiveImageLoader {
  private config: ProgressiveImageConfig;
  private imageStates = new Map<string, ImageLoadState>();
  private loadQueue: HTMLImageElement[] = [];
  private intersectionObserver: IntersectionObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private connectionInfo: ConnectionInfo | null = null;
  private metrics: ImageMetrics;
  private formatSupport = {
    webp: false,
    avif: false
  };

  constructor(config: Partial<ProgressiveImageConfig> = {}) {
    this.config = {
      // Default configuration optimized for mobile
      placeholderQuality: 20,
      progressiveSteps: [30, 60, 85, 100],
      lazyLoadThreshold: '50px',
      
      maxMobileWidth: 800,
      webpSupport: true,
      avifSupport: true,
      
      respectDataSaver: true,
      adaptToConnection: true,
      
      preloadCritical: 3,
      batchLoadSize: 4,
      loadingDelay: 100,
      
      retryAttempts: 2,
      fallbackFormat: 'jpg',
      
      enableServiceWorker: true,
      cacheStrategy: 'stale-while-revalidate',
      
      ...config
    };

    this.metrics = {
      totalImages: 0,
      loadedImages: 0,
      failedImages: 0,
      averageLoadTime: 0,
      bandwidthSaved: 0,
      webpUsage: 0,
      avifUsage: 0
    };

    this.initialize();
  }

  /**
   * Initialize the progressive image loader
   */
  private async initialize(): Promise<void> {
    // Detect format support
    await this.detectFormatSupport();
    
    // Get connection information
    this.detectConnectionInfo();
    
    // Setup intersection observer for lazy loading
    this.setupIntersectionObserver();
    
    // Setup mutation observer for dynamic images
    this.setupMutationObserver();
    
    // Process existing images
    this.processExistingImages();
    
    // Setup service worker if enabled
    if (this.config.enableServiceWorker) {
      this.setupServiceWorker();
    }

    console.warn('Progressive Image Loader initialized:', {
      webpSupported: this.formatSupport.webp,
      avifSupported: this.formatSupport.avif,
      connectionType: this.connectionInfo?.effectiveType,
      dataSaver: this.connectionInfo?.saveData
    });
  }

  /**
   * Detect modern image format support
   */
  private async detectFormatSupport(): Promise<void> {
    // Test WebP support
    if (this.config.webpSupport) {
      this.formatSupport.webp = await this.testImageFormat('webp', 'UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA');
    }

    // Test AVIF support
    if (this.config.avifSupport) {
      this.formatSupport.avif = await this.testImageFormat('avif', 'AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=');
    }
  }

  /**
   * Test if a specific image format is supported
   */
  private async testImageFormat(format: string, testData: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width > 0 && img.height > 0);
      img.onerror = () => resolve(false);
      img.src = `data:image/${format};base64,${testData}`;
    });
  }

  /**
   * Detect connection information for adaptive loading
   */
  private detectConnectionInfo(): void {
    const connection = (navigator as unknown).connection || (navigator as unknown).mozConnection || (navigator as unknown).webkitConnection;
    
    if (connection) {
      this.connectionInfo = {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false
      };

      // Listen for connection changes
      connection.addEventListener('change', () => {
        this.detectConnectionInfo();
        this.adaptToConnection();
      });
    }
  }

  /**
   * Setup intersection observer for lazy loading
   */
  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.intersectionObserver?.unobserve(img);
          }
        });
      },
      {
        rootMargin: this.config.lazyLoadThreshold,
        threshold: 0.01
      }
    );
  }

  /**
   * Setup mutation observer for dynamically added images
   */
  private setupMutationObserver(): void {
    if (!('MutationObserver' in window)) return;

    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              const images = element.querySelectorAll('img[data-src]');
              images.forEach((img) => this.observeImage(img as HTMLImageElement));
              
              if (element.tagName === 'IMG' && element.hasAttribute('data-src')) {
                this.observeImage(element as HTMLImageElement);
              }
            }
          });
        }
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Process existing images on the page
   */
  private processExistingImages(): void {
    const images = document.querySelectorAll('img[data-src]');
    let criticalCount = 0;

    images.forEach((img, index) => {
      const imageElement = img as HTMLImageElement;
      
      // Determine if image is above the fold (critical)
      const rect = imageElement.getBoundingClientRect();
      const isAboveFold = rect.top < window.innerHeight;
      
      if (isAboveFold && criticalCount < this.config.preloadCritical) {
        // Load critical images immediately
        this.loadImage(imageElement, true);
        criticalCount++;
      } else {
        // Observe non-critical images for lazy loading
        this.observeImage(imageElement);
      }
    });

    this.metrics.totalImages = images.length;
  }

  /**
   * Observe an image for lazy loading
   */
  private observeImage(img: HTMLImageElement): void {
    if (!this.intersectionObserver) {
      // Fallback: load immediately if no intersection observer
      this.loadImage(img);
      return;
    }

    // Initialize image state
    const originalSrc = img.dataset.src || img.src;
    this.imageStates.set(originalSrc, {
      src: originalSrc,
      placeholder: '',
      isLoading: false,
      isLoaded: false,
      hasError: false,
      retryCount: 0,
      loadStartTime: 0,
      currentStep: 0,
      totalSteps: this.config.progressiveSteps.length
    });

    // Set up placeholder
    this.setupPlaceholder(img, originalSrc);

    // Start observing
    this.intersectionObserver.observe(img);
  }

  /**
   * Setup placeholder for progressive loading
   */
  private setupPlaceholder(img: HTMLImageElement, originalSrc: string): void {
    const placeholderSrc = this.generatePlaceholderUrl(originalSrc);
    const state = this.imageStates.get(originalSrc);
    
    if (state) {
      state.placeholder = placeholderSrc;
    }

    // Load ultra-low quality placeholder immediately
    img.src = placeholderSrc;
    img.style.filter = 'blur(5px)';
    img.style.transition = 'filter 0.3s ease, opacity 0.3s ease';
    
    // Add loading class for styling
    img.classList.add('progressive-loading');
  }

  /**
   * Generate optimized placeholder URL
   */
  private generatePlaceholderUrl(originalSrc: string): string {
    const url = new URL(originalSrc, window.location.origin);
    
    // Add placeholder parameters
    url.searchParams.set('q', this.config.placeholderQuality.toString());
    url.searchParams.set('w', '50'); // Very small width for placeholder
    
    // Add format if supported
    if (this.formatSupport.avif) {
      url.searchParams.set('f', 'avif');
    } else if (this.formatSupport.webp) {
      url.searchParams.set('f', 'webp');
    }
    
    return url.toString();
  }

  /**
   * Load an image with progressive enhancement
   */
  private async loadImage(img: HTMLImageElement, isCritical: boolean = false): Promise<void> {
    const originalSrc = img.dataset.src || img.src;
    const state = this.imageStates.get(originalSrc);
    
    if (!state || state.isLoading || state.isLoaded) return;

    state.isLoading = true;
    state.loadStartTime = performance.now();

    try {
      if (isCritical) {
        // Load critical images at full quality immediately
        await this.loadFullQuality(img, originalSrc);
      } else {
        // Load non-critical images progressively
        await this.loadProgressively(img, originalSrc);
      }

      state.isLoaded = true;
      state.isLoading = false;
      this.metrics.loadedImages++;

      // Calculate load time
      const loadTime = performance.now() - state.loadStartTime;
      this.updateLoadTimeMetrics(loadTime);

      // Remove loading class and blur
      img.classList.remove('progressive-loading');
      img.classList.add('progressive-loaded');
      img.style.filter = 'none';

    } catch (error) {
      console.warn('Image load failed:', originalSrc, error);
      state.hasError = true;
      state.isLoading = false;
      this.metrics.failedImages++;
      
      // Retry if attempts remaining
      if (state.retryCount < this.config.retryAttempts) {
        state.retryCount++;
        setTimeout(() => this.loadImage(img, isCritical), 1000 * state.retryCount);
      } else {
        this.handleImageError(img, originalSrc);
      }
    }
  }

  /**
   * Load image at full quality (for critical images)
   */
  private async loadFullQuality(img: HTMLImageElement, originalSrc: string): Promise<void> {
    const optimizedSrc = this.getOptimizedImageUrl(originalSrc, 100);
    
    return new Promise((resolve, reject) => {
      const tempImg = new Image();
      
      tempImg.onload = () => {
        img.src = tempImg.src;
        resolve();
      };
      
      tempImg.onerror = reject;
      tempImg.src = optimizedSrc;
    });
  }

  /**
   * Load image progressively through quality steps
   */
  private async loadProgressively(img: HTMLImageElement, originalSrc: string): Promise<void> {
    const state = this.imageStates.get(originalSrc)!;
    
    for (let i = 0; i < this.config.progressiveSteps.length; i++) {
      const quality = this.config.progressiveSteps[i];
      const optimizedSrc = this.getOptimizedImageUrl(originalSrc, quality);
      
      state.currentStep = i + 1;
      
      await new Promise<void>((resolve, reject) => {
        const tempImg = new Image();
        
        tempImg.onload = () => {
          img.src = tempImg.src;
          
          // Reduce blur as quality improves
          const blurAmount = Math.max(0, 5 - (quality / 20));
          img.style.filter = `blur(${blurAmount}px)`;
          
          resolve();
        };
        
        tempImg.onerror = reject;
        tempImg.src = optimizedSrc;
      });

      // Small delay between steps for smooth progression
      if (i < this.config.progressiveSteps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, this.config.loadingDelay));
      }
    }
  }

  /**
   * Get optimized image URL with mobile-first parameters
   */
  private getOptimizedImageUrl(originalSrc: string, quality: number): string {
    const url = new URL(originalSrc, window.location.origin);
    
    // Quality parameter
    url.searchParams.set('q', quality.toString());
    
    // Mobile width optimization
    const devicePixelRatio = window.devicePixelRatio || 1;
    const maxWidth = Math.min(
      window.innerWidth * devicePixelRatio,
      this.config.maxMobileWidth
    );
    url.searchParams.set('w', maxWidth.toString());
    
    // Format optimization
    if (this.formatSupport.avif) {
      url.searchParams.set('f', 'avif');
      this.metrics.avifUsage++;
    } else if (this.formatSupport.webp) {
      url.searchParams.set('f', 'webp');
      this.metrics.webpUsage++;
    }
    
    // Connection-based adjustments
    if (this.config.adaptToConnection && this.connectionInfo) {
      if (this.connectionInfo.effectiveType === '2g' || this.connectionInfo.saveData) {
        // Reduce quality for slow connections
        const adjustedQuality = Math.max(quality * 0.7, 30);
        url.searchParams.set('q', adjustedQuality.toString());
      }
    }
    
    return url.toString();
  }

  /**
   * Handle image loading errors
   */
  private handleImageError(img: HTMLImageElement, originalSrc: string): void {
    // Try fallback format
    const fallbackUrl = new URL(originalSrc, window.location.origin);
    fallbackUrl.searchParams.set('f', this.config.fallbackFormat);
    
    img.src = fallbackUrl.toString();
    img.classList.add('progressive-error');
    
    // Set fallback styling
    img.style.filter = 'grayscale(50%)';
    img.style.opacity = '0.8';
  }

  /**
   * Adapt loading strategy to connection changes
   */
  private adaptToConnection(): void {
    if (!this.connectionInfo) return;

    const { effectiveType, saveData } = this.connectionInfo;

    // Adjust loading strategy based on connection
    if (effectiveType === '2g' || saveData) {
      // Slow connection: reduce quality and batch size
      this.config.progressiveSteps = [20, 40, 70];
      this.config.batchLoadSize = 2;
      this.config.loadingDelay = 200;
    } else if (effectiveType === '4g') {
      // Fast connection: increase quality and batch size
      this.config.progressiveSteps = [30, 60, 85, 100];
      this.config.batchLoadSize = 6;
      this.config.loadingDelay = 50;
    }
  }

  /**
   * Setup service worker for image caching
   */
  private setupServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-images.js')
        .then((registration) => {
          console.warn('Image SW registered:', registration);
        })
        .catch((error) => {
          console.warn('Image SW registration failed:', error);
        });
    }
  }

  /**
   * Update loading time metrics
   */
  private updateLoadTimeMetrics(loadTime: number): void {
    const { loadedImages, averageLoadTime } = this.metrics;
    this.metrics.averageLoadTime = 
      (averageLoadTime * (loadedImages - 1) + loadTime) / loadedImages;
  }

  /**
   * Get current loading metrics
   */
  public getMetrics(): ImageMetrics & {
    formatSupport: typeof this.formatSupport;
    connectionInfo: ConnectionInfo | null;
    successRate: number;
  } {
    const successRate = this.metrics.totalImages > 0 
      ? (this.metrics.loadedImages / this.metrics.totalImages) * 100 
      : 0;

    return {
      ...this.metrics,
      formatSupport: this.formatSupport,
      connectionInfo: this.connectionInfo,
      successRate
    };
  }

  /**
   * Preload specific images
   */
  public preloadImages(urls: string[]): Promise<void[]> {
    const promises = urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = this.getOptimizedImageUrl(url, 100);
      });
    });

    return Promise.all(promises);
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.intersectionObserver?.disconnect();
    this.mutationObserver?.disconnect();
    this.imageStates.clear();
    this.loadQueue = [];
  }

  /**
   * Force reload all images with updated settings
   */
  public reload(): void {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach((img) => {
      const imageElement = img as HTMLImageElement;
      imageElement.classList.remove('progressive-loaded', 'progressive-error');
      this.loadImage(imageElement);
    });
  }
}

// Export singleton instance
export const progressiveImageLoader = new ProgressiveImageLoader();
export default ProgressiveImageLoader;

// CSS for progressive image loading
export const progressiveImageCSS = `
/* Progressive Image Loading Styles */
.progressive-loading {
  background: linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.progressive-loaded {
  filter: none !important;
  opacity: 1 !important;
}

.progressive-error {
  background: #f3f4f6;
  position: relative;
}

.progressive-error::after {
  content: '📷';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2rem;
  opacity: 0.5;
  pointer-events: none;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Responsive image container */
.progressive-image-container {
  position: relative;
  overflow: hidden;
  background: #f3f4f6;
}

.progressive-image-container img {
  width: 100%;
  height: auto;
  display: block;
  transition: filter 0.3s ease, opacity 0.3s ease;
}

/* Mobile-specific optimizations */
@media (max-width: 768px) {
  .progressive-loading {
    animation-duration: 2s; /* Slower animation for mobile */
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .progressive-loading {
    animation: none;
    background: #f0f0f0;
  }
  
  .progressive-image-container img {
    transition: none;
  }
}

/* High contrast support */
@media (prefers-contrast: high) {
  .progressive-loading {
    background: #e0e0e0;
    border: 2px solid #999;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .progressive-loading {
    background: linear-gradient(90deg, #374151 0%, #4b5563 50%, #374151 100%);
  }
  
  .progressive-image-container {
    background: #374151;
  }
  
  .progressive-error {
    background: #374151;
  }
}
`;