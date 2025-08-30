/**
 * Progressive Image React Component
 * Mobile-optimized image component with progressive loading, format detection,
 * and performance monitoring for maximum conversion optimization
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { progressiveImageLoader } from '../../lib/mobile/progressive-image-loader';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  priority?: 'high' | 'medium' | 'low';
  sizes?: string;
  loading?: 'eager' | 'lazy';
  aspectRatio?: number;
  placeholder?: 'blur' | 'shimmer' | 'color' | 'none';
  placeholderColor?: string;
  quality?: number[];
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (step: number, totalSteps: number) => void;
}

interface ImageState {
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  currentSrc: string;
  loadProgress: number;
  retryCount: number;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  style = {},
  priority = 'medium',
  sizes = '100vw',
  loading = 'lazy',
  aspectRatio,
  placeholder = 'shimmer',
  placeholderColor = '#f3f4f6',
  quality = [30, 60, 85, 100],
  onLoad,
  onError,
  onProgress
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [state, setState] = useState<ImageState>({
    isLoading: loading === 'eager',
    isLoaded: false,
    hasError: false,
    currentSrc: '',
    loadProgress: 0,
    retryCount: 0
  });

  const [intersectionObserver, setIntersectionObserver] = useState<IntersectionObserver | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  /**
   * Initialize intersection observer for lazy loading
   */
  useEffect(() => {
    if (loading === 'lazy' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !state.isLoading && !state.isLoaded) {
              startLoading();
              observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.01
        }
      );

      setIntersectionObserver(observer);

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }
  }, [loading, state.isLoading, state.isLoaded]);

  /**
   * Start loading immediately for eager images
   */
  useEffect(() => {
    if (loading === 'eager' || priority === 'high') {
      startLoading();
    }
  }, [loading, priority]);

  /**
   * Calculate dimensions based on aspect ratio
   */
  useEffect(() => {
    if (width && height) {
      setDimensions({ width, height });
    } else if (width && aspectRatio) {
      setDimensions({ width, height: width / aspectRatio });
    } else if (height && aspectRatio) {
      setDimensions({ width: height * aspectRatio, height });
    }
  }, [width, height, aspectRatio]);

  /**
   * Start the progressive loading process
   */
  const startLoading = useCallback(async () => {
    if (state.isLoading || state.isLoaded) return;

    setState(prev => ({ ...prev, isLoading: true, hasError: false }));

    try {
      await loadProgressively();
    } catch (error) {
      handleLoadError(error as Error);
    }
  }, [src, quality, state.isLoading, state.isLoaded]);

  /**
   * Load image progressively through quality steps
   */
  const loadProgressively = async (): Promise<void> => {
    const totalSteps = quality.length;
    
    for (let i = 0; i < totalSteps; i++) {
      const currentQuality = quality[i];
      const stepProgress = ((i + 1) / totalSteps) * 100;
      
      try {
        const optimizedSrc = await generateOptimizedUrl(src, currentQuality);
        await loadImageStep(optimizedSrc);
        
        setState(prev => ({ 
          ...prev, 
          currentSrc: optimizedSrc,
          loadProgress: stepProgress
        }));

        onProgress?.(i + 1, totalSteps);

        // Add delay between steps for smooth progression (except final step)
        if (i < totalSteps - 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      } catch (error) {
        console.warn(`Failed to load quality step ${currentQuality}:`, error);
        
        // If not the final step, continue to next quality level
        if (i < totalSteps - 1) continue;
        
        // If final step fails, throw error
        throw error;
      }
    }

    // Mark as fully loaded
    setState(prev => ({ 
      ...prev, 
      isLoading: false, 
      isLoaded: true,
      loadProgress: 100
    }));

    onLoad?.();
  };

  /**
   * Load a single image step
   */
  const loadImageStep = (imageSrc: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        if (imageRef.current) {
          imageRef.current.src = img.src;
          
          // Apply progressive blur reduction
          const blurAmount = Math.max(0, 5 * (1 - state.loadProgress / 100));
          imageRef.current.style.filter = `blur(${blurAmount}px)`;
        }
        resolve();
      };
      
      img.onerror = reject;
      img.src = imageSrc;
    });
  };

  /**
   * Generate optimized image URL
   */
  const generateOptimizedUrl = async (originalSrc: string, qualityLevel: number): Promise<string> => {
    const url = new URL(originalSrc, window.location.origin);
    
    // Quality parameter
    url.searchParams.set('q', qualityLevel.toString());
    
    // Responsive width
    const devicePixelRatio = window.devicePixelRatio || 1;
    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
    const targetWidth = Math.min(containerWidth * devicePixelRatio, 1200);
    url.searchParams.set('w', targetWidth.toString());
    
    // Format optimization
    const formatSupport = await detectFormatSupport();
    if (formatSupport.avif) {
      url.searchParams.set('f', 'avif');
    } else if (formatSupport.webp) {
      url.searchParams.set('f', 'webp');
    }
    
    return url.toString();
  };

  /**
   * Detect modern image format support
   */
  const detectFormatSupport = async (): Promise<{ webp: boolean; avif: boolean }> => {
    // Use cached results if available
    const cached = sessionStorage.getItem('format-support');
    if (cached) {
      return JSON.parse(cached);
    }

    const support = {
      webp: await testFormat('webp', 'UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'),
      avif: await testFormat('avif', 'AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=')
    };

    sessionStorage.setItem('format-support', JSON.stringify(support));
    return support;
  };

  /**
   * Test format support
   */
  const testFormat = (format: string, testData: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width > 0 && img.height > 0);
      img.onerror = () => resolve(false);
      img.src = `data:image/${format};base64,${testData}`;
    });
  };

  /**
   * Handle loading errors with retry logic
   */
  const handleLoadError = (error: Error): void => {
    setState(prev => {
      const newRetryCount = prev.retryCount + 1;
      
      if (newRetryCount < 3) {
        // Retry with exponential backoff
        setTimeout(() => startLoading(), 1000 * newRetryCount);
        
        return { 
          ...prev, 
          retryCount: newRetryCount,
          isLoading: false
        };
      } else {
        // Max retries reached
        onError?.(error);
        
        return { 
          ...prev, 
          hasError: true, 
          isLoading: false,
          retryCount: newRetryCount
        };
      }
    });
  };

  /**
   * Render placeholder based on type
   */
  const renderPlaceholder = (): React.ReactNode => {
    if (placeholder === 'none') return null;
    
    const placeholderStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: placeholderColor,
      opacity: state.isLoaded ? 0 : 1,
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none'
    };

    switch (placeholder) {
      case 'blur':
        return (
          <div style={placeholderStyle}>
            <div style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, ${placeholderColor} 0%, #e0e0e0 50%, ${placeholderColor} 100%)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              filter: 'blur(10px)'
            }} />
          </div>
        );
        
      case 'color':
        return <div style={placeholderStyle} />;
        
      case 'shimmer':
      default:
        return (
          <div style={placeholderStyle}>
            <div style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, ${placeholderColor} 0%, #e0e0e0 50%, ${placeholderColor} 100%)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite'
            }} />
          </div>
        );
    }
  };

  /**
   * Get container styles with aspect ratio support
   */
  const getContainerStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: placeholderColor,
      ...style
    };

    if (dimensions) {
      baseStyles.width = dimensions.width;
      baseStyles.height = dimensions.height;
    } else if (aspectRatio) {
      baseStyles.aspectRatio = aspectRatio.toString();
      baseStyles.width = '100%';
    }

    return baseStyles;
  };

  /**
   * Get image styles
   */
  const getImageStyles = (): React.CSSProperties => {
    return {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'filter 0.3s ease, opacity 0.3s ease',
      opacity: state.hasError ? 0.5 : 1,
      filter: state.isLoaded ? 'none' : `blur(${Math.max(0, 5 * (1 - state.loadProgress / 100))}px)`
    };
  };

  return (
    <div 
      ref={containerRef}
      className={`progressive-image-container ${className} ${
        state.isLoading ? 'loading' : ''
      } ${state.isLoaded ? 'loaded' : ''} ${state.hasError ? 'error' : ''}`}
      style={getContainerStyles()}
    >
      {/* Placeholder */}
      {renderPlaceholder()}
      
      {/* Main Image */}
      <img
        ref={imageRef}
        alt={alt}
        className="progressive-image"
        style={getImageStyles()}
        data-src={src}
        sizes={sizes}
        loading={loading}
        width={dimensions?.width}
        height={dimensions?.height}
        data-priority={priority}
      />
      
      {/* Loading Progress Indicator */}
      {state.isLoading && state.loadProgress > 0 && (
        <div 
          className="progressive-loading-bar"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '2px',
            backgroundColor: '#3b82f6',
            width: `${state.loadProgress}%`,
            transition: 'width 0.3s ease',
            zIndex: 10
          }}
        />
      )}
      
      {/* Error State */}
      {state.hasError && (
        <div 
          className="progressive-error-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(243, 244, 246, 0.9)',
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: '500',
            textAlign: 'center',
            padding: '16px'
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
          <div>Image failed to load</div>
          <button
            onClick={() => {
              setState(prev => ({ ...prev, hasError: false, retryCount: 0 }));
              startLoading();
            }}
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default ProgressiveImage;