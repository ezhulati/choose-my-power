/**
 * Provider Logo Mapping Utility
 * Maps provider names to logo assets for consistent branding throughout the app
 */

import providerData from '../../data/provider-logos.json';

// Import logo assets (Astro will handle these as static assets)
const logoAssets = import.meta.glob('/src/assets/logos/*.svg', { query: '?url', import: 'default', eager: true });

interface ProviderInfo {
  name: string;
  logoUrl: string;
  logoFilename: string;
  puctNumber: string;
}

/**
 * Normalize provider name for lookup
 */
function normalizeProviderName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+(energy|power|electric|utilities?)$/i, '')
    .trim();
}

/**
 * Get provider logo information by name
 */
export function getProviderLogo(providerName: string): ProviderInfo | null {
  if (!providerName) return null;
  
  // Try multiple normalized variations
  const lookupKeys = [
    normalizeProviderName(providerName),
    normalizeProviderName(providerName).replace(/\s+/g, ''),
    normalizeProviderName(providerName).replace(/\s+/g, '_'),
    providerName.toLowerCase().trim(),
    providerName.toLowerCase().replace(/\s+/g, ''),
  ];
  
  // Search in the mapping
  for (const key of lookupKeys) {
    if (providerData.mapping[key]) {
      return providerData.mapping[key];
    }
  }
  
  // Try partial matches for common providers
  const normalizedInput = normalizeProviderName(providerName);
  for (const provider of providerData.providers) {
    const normalizedProvider = normalizeProviderName(provider.name);
    if (normalizedProvider.includes(normalizedInput) || normalizedInput.includes(normalizedProvider)) {
      return provider;
    }
  }
  
  return null;
}

/**
 * Get logo asset URL for a provider
 */
export function getProviderLogoUrl(providerName: string): string {
  const providerInfo = getProviderLogo(providerName);
  if (!providerInfo) {
    return logoAssets['/src/assets/logos/fallback.svg'] || '/src/assets/logos/fallback.svg';
  }
  
  const logoPath = `/src/assets/logos/${providerInfo.logoFilename}`;
  return logoAssets[logoPath] || '/src/assets/logos/fallback.svg';
}

/**
 * Get all available providers with logos
 */
export function getAllProviders(): ProviderInfo[] {
  return providerData.providers;
}

/**
 * Check if a provider has a logo
 */
export function hasProviderLogo(providerName: string): boolean {
  return getProviderLogo(providerName) !== null;
}

/**
 * Logo component props for consistent usage
 */
export interface LogoProps {
  provider: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  alt?: string;
}

/**
 * Get standardized logo props
 */
export function getLogoProps(
  provider: string, 
  options: Omit<LogoProps, 'provider'> = {}
): Required<LogoProps> {
  const { size = 'md', className = '', alt = '' } = options;
  
  return {
    provider,
    size,
    className: `provider-logo provider-logo-${size} ${className}`.trim(),
    alt: alt || `${provider} logo`
  };
}

// Export metadata for debugging
export const logoMetadata = {
  totalProviders: providerData.metadata.totalProviders,
  generatedAt: providerData.metadata.generatedAt,
  availableLogos: Object.keys(logoAssets).length
};