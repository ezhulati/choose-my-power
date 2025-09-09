/**
 * Responsive ZIP Code Lookup Form
 * Task T032: Adaptive component that switches between desktop and mobile optimized views
 * Phase 3.5 Polish & Validation: Responsive design with progressive enhancement
 */

import React, { useState, useEffect } from 'react';
import { ZIPCodeLookupForm } from './ZIPCodeLookupForm';
import { MobileZIPLookupForm } from '../mobile/MobileZIPLookupForm';
import type { ZIPRoutingResult } from '../../types/zip-navigation';

interface ResponsiveZIPLookupFormProps {
  cityName?: string;
  placeholder?: string;
  className?: string;
  onSuccess?: (response: ZIPRoutingResult) => void;
  onError?: (error: string) => void;
  showPerformanceMetrics?: boolean;
  variant?: 'compact' | 'hero' | 'inline';
  forceDesktop?: boolean;
  forceMobile?: boolean;
}

export const ResponsiveZIPLookupForm: React.FC<ResponsiveZIPLookupFormProps> = ({
  cityName = 'your area',
  placeholder,
  className = '',
  onSuccess,
  onError,
  showPerformanceMetrics = false,
  variant = 'compact',
  forceDesktop = false,
  forceMobile = false
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  // Detect device capabilities and screen size
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      
      // Mobile breakpoint (768px) and touch detection
      const mobileScreen = width < 768;
      const touchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setIsMobile(mobileScreen);
      setIsTouch(touchCapable);
    };

    // Initial check
    checkDevice();

    // Listen for resize events
    const handleResize = () => checkDevice();
    window.addEventListener('resize', handleResize);
    
    // Listen for orientation changes on mobile
    const handleOrientationChange = () => {
      setTimeout(checkDevice, 100); // Small delay to get accurate measurements
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Determine which component to render
  const shouldUseMobile = () => {
    if (forceDesktop) return false;
    if (forceMobile) return true;
    
    // Use mobile version for:
    // 1. Small screens (< 768px)
    // 2. Touch-capable devices on medium screens (< 1024px)
    // 3. Explicitly mobile user agents
    return isMobile || (isTouch && windowWidth < 1024);
  };

  const useMobileVersion = shouldUseMobile();

  // Adaptive placeholder based on device
  const adaptivePlaceholder = placeholder || (
    useMobileVersion ? 'Enter ZIP code' : 'Enter 5-digit ZIP code'
  );

  // Log device detection for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && showPerformanceMetrics) {
      console.log('[ResponsiveZIPForm] Device detection:', {
        windowWidth,
        isMobile,
        isTouch,
        useMobileVersion,
        variant
      });
    }
  }, [windowWidth, isMobile, isTouch, useMobileVersion, variant, showPerformanceMetrics]);

  // Render the appropriate component
  if (useMobileVersion) {
    return (
      <MobileZIPLookupForm
        cityName={cityName}
        placeholder={adaptivePlaceholder}
        className={className}
        onSuccess={onSuccess}
        onError={onError}
        showPerformanceMetrics={showPerformanceMetrics}
        variant={variant}
      />
    );
  }

  return (
    <ZIPCodeLookupForm
      cityName={cityName}
      placeholder={adaptivePlaceholder}
      className={className}
      onSuccess={onSuccess}
      onError={onError}
      showPerformanceMetrics={showPerformanceMetrics}
    />
  );
};

// Export additional utilities for responsive design
export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTouch: false,
    windowWidth: 0,
    windowHeight: 0,
    orientation: 'portrait' as 'portrait' | 'landscape'
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setDeviceInfo({
        isMobile: width < 768,
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        windowWidth: width,
        windowHeight: height,
        orientation: width > height ? 'landscape' : 'portrait'
      });
    };

    updateDeviceInfo();
    
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateDeviceInfo, 100);
    });

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
};

export const getBreakpointClasses = (windowWidth: number) => {
  if (windowWidth < 640) return 'mobile-sm';
  if (windowWidth < 768) return 'mobile';
  if (windowWidth < 1024) return 'tablet';
  if (windowWidth < 1280) return 'desktop';
  return 'desktop-lg';
};

export default ResponsiveZIPLookupForm;