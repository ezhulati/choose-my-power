/**
 * ProviderLogo Component - Robust logo display with fallbacks
 * Uses the database-backed logo service with automatic error handling
 */

import React, { useState, useEffect } from 'react';
import { PROVIDER_LOGO_URLS, PROVIDER_NAME_MAPPING, generateFallbackLogoSVG } from '../../lib/logo/provider-mappings';

interface ProviderLogoProps {
  providerName: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'square' | 'rounded' | 'circle';
  showFallbackText?: boolean;
  onError?: (error: string) => void;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
  '2xl': 'w-24 h-24'
};

const variantClasses = {
  square: '',
  rounded: 'rounded-lg',
  circle: 'rounded-full'
};

export const ProviderLogo: React.FC<ProviderLogoProps> = ({
  providerName,
  className = '',
  size = 'md',
  variant = 'rounded',
  showFallbackText = false,
  onError
}) => {
  const [logoSrc, setLogoSrc] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!providerName?.trim()) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    try {
      // Try multiple variations of provider name to match our mapping
      const normalized = providerName.toLowerCase().trim();
      
      // Try direct lookup first
      let logoUrl = PROVIDER_LOGO_URLS[normalized];
      
      // Try with dashes
      if (!logoUrl) {
        const dashedName = normalized.replace(/[^a-z0-9]+/g, '-');
        logoUrl = PROVIDER_LOGO_URLS[dashedName];
      }
      
      // Try mapped name
      if (!logoUrl) {
        const mappedName = PROVIDER_NAME_MAPPING[normalized];
        if (mappedName) {
          logoUrl = PROVIDER_LOGO_URLS[mappedName];
        }
      }
      
      // Try partial matches for common providers
      if (!logoUrl) {
        const searchKeys = Object.keys(PROVIDER_LOGO_URLS);
        const match = searchKeys.find(key => {
          const keyNormalized = key.toLowerCase();
          const providerNormalized = normalized.toLowerCase();
          return keyNormalized.includes(providerNormalized) || providerNormalized.includes(keyNormalized);
        });
        if (match) {
          logoUrl = PROVIDER_LOGO_URLS[match];
        }
      }
      
      if (logoUrl) {
        setLogoSrc(logoUrl);
      } else {
        console.warn(`⚠️ No logo found for ${providerName}, using branded fallback`);
        // Generate branded fallback SVG using provider colors
        const fallbackSvg = generateFallbackLogoSVG(providerName);
        setLogoSrc(fallbackSvg);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Logo mapping error:', error);
      setHasError(true);
      setIsLoading(false);
      onError?.(error instanceof Error ? error.message : 'Logo loading failed');
    }
  }, [providerName, onError]);

  const handleImageError = () => {
    if (!hasError) {
      console.warn(`Logo failed to load for ${providerName}, using branded fallback`);
      // Generate branded fallback SVG when CDN fails
      const fallbackSvg = generateFallbackLogoSVG(providerName);
      
      setLogoSrc(fallbackSvg);
      setHasError(true);
      onError?.(`CDN failed for ${providerName}, using fallback`);
    }
  };

  const baseClasses = `
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    object-contain
    border border-gray-200
    shadow-sm
    bg-white
    transition-all duration-200
    hover:shadow-md
    ${className}
  `.trim().replace(/\s+/g, ' ');

  if (isLoading) {
    return (
      <div className={`${baseClasses} animate-pulse bg-gray-200`}>
        <div className="w-full h-full bg-gray-300 rounded-inherit"></div>
      </div>
    );
  }

  if (showFallbackText && hasError) {
    return (
      <div className={`${baseClasses} flex items-center justify-center bg-gray-100 text-gray-600 font-semibold text-xs`}>
        {providerName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 3)}
      </div>
    );
  }

  return (
    <img
      src={logoSrc}
      alt={`${providerName} logo`}
      className={baseClasses}
      onError={handleImageError}
      loading="lazy"
      decoding="async"
      title={providerName}
    />
  );
};

// Specialized variants for common use cases
export const ProviderLogoSmall: React.FC<Omit<ProviderLogoProps, 'size'>> = (props) => (
  <ProviderLogo {...props} size="sm" />
);

export const ProviderLogoMedium: React.FC<Omit<ProviderLogoProps, 'size'>> = (props) => (
  <ProviderLogo {...props} size="md" />
);

export const ProviderLogoLarge: React.FC<Omit<ProviderLogoProps, 'size'>> = (props) => (
  <ProviderLogo {...props} size="lg" />
);

// Circle variants
export const ProviderLogoCircle: React.FC<Omit<ProviderLogoProps, 'variant'>> = (props) => (
  <ProviderLogo {...props} variant="circle" />
);

// Usage examples:
// <ProviderLogo providerName="Reliant Energy" size="lg" />
// <ProviderLogoSmall providerName="TXU Energy" />
// <ProviderLogoCircle providerName="Direct Energy" size="xl" />

export default ProviderLogo;