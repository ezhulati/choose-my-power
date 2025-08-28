/**
 * ResponsiveContainer React Component
 * Adaptive container with responsive breakpoints, touch optimizations,
 * and mobile-first layout patterns for electricity plan interfaces
 */

import { useState, useEffect, useRef, ReactNode } from 'react';

interface Breakpoint {
  name: 'mobile' | 'tablet' | 'desktop' | 'wide';
  minWidth: number;
  maxWidth?: number;
}

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  centerContent?: boolean;
  adaptiveLayout?: boolean;
  touchOptimized?: boolean;
  enableSwipeGestures?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  renderMobile?: () => ReactNode;
  renderTablet?: () => ReactNode;
  renderDesktop?: () => ReactNode;
}

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  startTime: number;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  maxWidth = 'xl',
  padding = 'md',
  centerContent = true,
  adaptiveLayout = true,
  touchOptimized = true,
  enableSwipeGestures = false,
  onSwipeLeft,
  onSwipeRight,
  renderMobile,
  renderTablet,
  renderDesktop
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint['name']>('mobile');
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [touchSupport, setTouchSupport] = useState(false);
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
    startTime: 0
  });

  // Breakpoint definitions
  const breakpoints: Breakpoint[] = [
    { name: 'mobile', minWidth: 0, maxWidth: 767 },
    { name: 'tablet', minWidth: 768, maxWidth: 1023 },
    { name: 'desktop', minWidth: 1024, maxWidth: 1439 },
    { name: 'wide', minWidth: 1440 }
  ];

  // Update screen size and breakpoint
  const updateScreenInfo = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setScreenSize({ width, height });
    setOrientation(width > height ? 'landscape' : 'portrait');
    
    // Determine current breakpoint
    const newBreakpoint = breakpoints.find(bp => {
      if (bp.maxWidth) {
        return width >= bp.minWidth && width <= bp.maxWidth;
      }
      return width >= bp.minWidth;
    })?.name || 'mobile';
    
    setCurrentBreakpoint(newBreakpoint);
  };

  // Detect touch support
  const detectTouchSupport = () => {
    const hasTouch = 'ontouchstart' in window || 
                    navigator.maxTouchPoints > 0 || 
                    (window as any).DocumentTouch && document instanceof (window as any).DocumentTouch;
    setTouchSupport(hasTouch);
  };

  // Initialize responsive behavior
  useEffect(() => {
    updateScreenInfo();
    detectTouchSupport();
    
    window.addEventListener('resize', updateScreenInfo);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateScreenInfo, 100); // Delay to get accurate dimensions after rotation
    });
    
    return () => {
      window.removeEventListener('resize', updateScreenInfo);
      window.removeEventListener('orientationchange', updateScreenInfo);
    };
  }, []);

  // Touch gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipeGestures) return;
    
    const touch = e.touches[0];
    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isDragging: false,
      startTime: Date.now()
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enableSwipeGestures) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;
    
    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isDragging: Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10
    }));
    
    // Prevent scrolling for horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!enableSwipeGestures) return;
    
    const deltaX = touchState.currentX - touchState.startX;
    const deltaY = touchState.currentY - touchState.startY;
    const touchDuration = Date.now() - touchState.startTime;
    const isSwipe = Math.abs(deltaX) > 50 && touchDuration < 300 && Math.abs(deltaX) > Math.abs(deltaY);
    
    if (isSwipe) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    // Reset touch state
    setTouchState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false,
      startTime: 0
    });
  };

  // Get responsive styles
  const getContainerStyles = (): string => {
    const styles = ['responsive-container'];
    
    // Add breakpoint class
    styles.push(`breakpoint-${currentBreakpoint}`);
    
    // Add orientation class
    styles.push(`orientation-${orientation}`);
    
    // Add touch support class
    if (touchSupport && touchOptimized) {
      styles.push('touch-enabled');
    }
    
    // Add max-width class
    styles.push(`max-w-${maxWidth}`);
    
    // Add padding class
    styles.push(`padding-${padding}`);
    
    // Add center content class
    if (centerContent) {
      styles.push('centered');
    }
    
    // Add adaptive layout class
    if (adaptiveLayout) {
      styles.push('adaptive-layout');
    }
    
    // Add custom className
    if (className) {
      styles.push(className);
    }
    
    return styles.join(' ');
  };

  // Get content to render based on breakpoint
  const getResponsiveContent = (): ReactNode => {
    if (adaptiveLayout) {
      switch (currentBreakpoint) {
        case 'mobile':
          return renderMobile ? renderMobile() : children;
        case 'tablet':
          return renderTablet ? renderTablet() : children;
        case 'desktop':
        case 'wide':
          return renderDesktop ? renderDesktop() : children;
        default:
          return children;
      }
    }
    return children;
  };

  // Responsive utilities available to children
  const responsiveContext = {
    currentBreakpoint,
    screenSize,
    orientation,
    touchSupport,
    isMobile: currentBreakpoint === 'mobile',
    isTablet: currentBreakpoint === 'tablet',
    isDesktop: currentBreakpoint === 'desktop' || currentBreakpoint === 'wide',
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    isTouch: touchSupport
  };

  return (
    <div
      ref={containerRef}
      className={getContainerStyles()}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-breakpoint={currentBreakpoint}
      data-orientation={orientation}
      data-touch-support={touchSupport}
      style={{
        '--screen-width': `${screenSize.width}px`,
        '--screen-height': `${screenSize.height}px`,
        '--safe-area-inset-top': 'env(safe-area-inset-top)',
        '--safe-area-inset-bottom': 'env(safe-area-inset-bottom)',
        '--safe-area-inset-left': 'env(safe-area-inset-left)',
        '--safe-area-inset-right': 'env(safe-area-inset-right)'
      } as React.CSSProperties}
    >
      {/* Render children with context if needed */}
      {adaptiveLayout && (renderMobile || renderTablet || renderDesktop) ? (
        getResponsiveContent()
      ) : (
        <>
          {children}
          {/* Pass responsive context via data attributes for CSS */}
          <div 
            className="responsive-context" 
            data-context={JSON.stringify(responsiveContext)}
            style={{ display: 'none' }}
          />
        </>
      )}
    </div>
  );
};

export default ResponsiveContainer;

// Responsive container styles
const styles = `
/* Base Responsive Container */
.responsive-container {
  position: relative;
  width: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Max-width variants */
.max-w-sm { max-width: 640px; }
.max-w-md { max-width: 768px; }
.max-w-lg { max-width: 1024px; }
.max-w-xl { max-width: 1280px; }
.max-w-2xl { max-width: 1536px; }
.max-w-full { max-width: none; }

/* Padding variants */
.padding-none { padding: 0; }
.padding-sm { padding: 0.75rem; }
.padding-md { padding: 1rem; }
.padding-lg { padding: 1.5rem; }

/* Centered content */
.centered {
  margin-left: auto;
  margin-right: auto;
}

/* Adaptive layout */
.adaptive-layout {
  display: flex;
  flex-direction: column;
}

/* Touch-enabled optimizations */
.touch-enabled {
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

.touch-enabled * {
  touch-action: manipulation;
}

/* Breakpoint-specific styles */
.breakpoint-mobile {
  --container-spacing: 1rem;
  --font-size-base: 14px;
  --touch-target-size: 44px;
}

.breakpoint-tablet {
  --container-spacing: 1.5rem;
  --font-size-base: 15px;
  --touch-target-size: 48px;
}

.breakpoint-desktop {
  --container-spacing: 2rem;
  --font-size-base: 16px;
  --touch-target-size: 40px;
}

.breakpoint-wide {
  --container-spacing: 2.5rem;
  --font-size-base: 16px;
  --touch-target-size: 40px;
}

/* Orientation-specific styles */
.orientation-portrait {
  --nav-height: 60px;
  --safe-area-adjustment: var(--safe-area-inset-top, 0px);
}

.orientation-landscape {
  --nav-height: 50px;
  --safe-area-adjustment: 0px;
}

/* Mobile-first responsive utilities */
@media (max-width: 767px) {
  .responsive-container {
    min-height: 100vh;
    min-height: 100dvh; /* Dynamic viewport height */
  }
  
  .padding-md {
    padding: 1rem 0.75rem;
  }
  
  .padding-lg {
    padding: 1.25rem 1rem;
  }
  
  /* Mobile touch optimizations */
  .touch-enabled .button,
  .touch-enabled button,
  .touch-enabled [role="button"],
  .touch-enabled a {
    min-height: var(--touch-target-size);
    min-width: var(--touch-target-size);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 16px;
  }
  
  /* Mobile typography */
  .touch-enabled h1 { font-size: 1.75rem; line-height: 1.2; }
  .touch-enabled h2 { font-size: 1.5rem; line-height: 1.3; }
  .touch-enabled h3 { font-size: 1.25rem; line-height: 1.4; }
  .touch-enabled p { font-size: var(--font-size-base); line-height: 1.6; }
  
  /* Mobile spacing */
  .touch-enabled .section { margin-bottom: 1.5rem; }
  .touch-enabled .card { margin-bottom: 1rem; }
  .touch-enabled .button-group { gap: 0.75rem; }
}

/* Tablet optimizations */
@media (min-width: 768px) and (max-width: 1023px) {
  .orientation-landscape .responsive-container {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 2rem;
    max-height: 100vh;
  }
  
  .touch-enabled .button,
  .touch-enabled button,
  .touch-enabled [role="button"] {
    min-height: var(--touch-target-size);
    padding: 14px 20px;
  }
  
  /* Tablet typography */
  .touch-enabled h1 { font-size: 2rem; }
  .touch-enabled h2 { font-size: 1.75rem; }
  .touch-enabled h3 { font-size: 1.5rem; }
  
  /* Tablet layout patterns */
  .adaptive-layout {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }
}

/* Desktop and wide screen optimizations */
@media (min-width: 1024px) {
  .responsive-container {
    display: block;
  }
  
  /* Remove touch optimizations for desktop */
  .touch-enabled .button,
  .touch-enabled button,
  .touch-enabled [role="button"] {
    min-height: auto;
    padding: 8px 16px;
  }
  
  /* Desktop typography */
  .responsive-container h1 { font-size: 2.5rem; }
  .responsive-container h2 { font-size: 2rem; }
  .responsive-container h3 { font-size: 1.75rem; }
  
  /* Desktop layout patterns */
  .adaptive-layout {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
  }
  
  /* Hover states for non-touch devices */
  .responsive-container:not(.touch-enabled) .button:hover,
  .responsive-container:not(.touch-enabled) button:hover,
  .responsive-container:not(.touch-enabled) [role="button"]:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
}

/* Wide screen optimizations */
@media (min-width: 1440px) {
  .max-w-xl {
    max-width: 1400px;
  }
  
  .adaptive-layout {
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2.5rem;
  }
}

/* High DPI display optimizations */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .responsive-container img,
  .responsive-container .logo,
  .responsive-container .icon {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .responsive-container,
  .responsive-container * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .responsive-container {
    border: 2px solid;
  }
  
  .responsive-container .button,
  .responsive-container button {
    border: 2px solid;
    font-weight: bold;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .responsive-container {
    background-color: #111827;
    color: #f9fafb;
  }
  
  .responsive-container .card,
  .responsive-container .section {
    background-color: #1f2937;
    border-color: #374151;
  }
}

/* Print styles */
@media print {
  .responsive-container {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }
  
  .touch-enabled .button,
  .touch-enabled button {
    display: none !important;
  }
}

/* Screen reader optimizations */
@media (prefers-reduced-motion: reduce) {
  .responsive-container {
    scroll-behavior: auto;
  }
}

/* Focus management for keyboard navigation */
.responsive-container:focus-within {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Container queries support (progressive enhancement) */
@supports (container-type: inline-size) {
  .responsive-container {
    container-type: inline-size;
    container-name: responsive;
  }
  
  @container responsive (max-width: 400px) {
    .adaptive-layout {
      grid-template-columns: 1fr;
    }
  }
  
  @container responsive (min-width: 600px) {
    .adaptive-layout {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @container responsive (min-width: 900px) {
    .adaptive-layout {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}

/* iOS Safari specific optimizations */
@supports (-webkit-touch-callout: none) {
  .responsive-container {
    -webkit-overflow-scrolling: touch;
  }
  
  .touch-enabled input,
  .touch-enabled textarea,
  .touch-enabled select {
    font-size: 16px; /* Prevent zoom on focus */
  }
}

/* Samsung Internet optimizations */
@media screen and (-webkit-min-device-pixel-ratio: 0) and (min-color-index: 0) {
  .responsive-container {
    transform: translateZ(0); /* Enable hardware acceleration */
  }
}

/* Firefox mobile optimizations */
@supports (-moz-appearance: none) {
  .touch-enabled .button,
  .touch-enabled button {
    -moz-appearance: none;
    background-clip: padding-box;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('responsive-container-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'responsive-container-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}