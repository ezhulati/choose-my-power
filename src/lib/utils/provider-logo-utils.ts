/**
 * Provider Logo Utility for ChooseMyPower
 * Maps provider names to logo paths in /public/logos/ directory
 */

interface ProviderLogoMapping {
  [key: string]: string;
}

// Master provider logo mapping - maps various provider name formats to logo filenames
const providerLogoMap: ProviderLogoMapping = {
  // 4Change Energy
  '4change energy': '4change-energy.svg',
  '4change-energy': '4change-energy.svg',
  '4changeenergy': '4change-energy.svg',
  '4change': '4change-energy.svg',
  
  // Amigo Energy
  'amigo energy': 'amigo-energy.svg',
  'amigo-energy': 'amigo-energy.svg',
  'amigoenergy': 'amigo-energy.svg',
  'amigo': 'amigo-energy.svg',
  
  // APGE (American Power & Gas)
  'apge': 'apge.svg',
  'american power & gas': 'apge.svg',
  'american power and gas': 'apge.svg',
  
  // Atlantex Power
  'atlantex power': 'atlantex-power.svg',
  'atlantex-power': 'atlantex-power.svg',
  'atlantexpower': 'atlantex-power.svg',
  'atlantex': 'atlantex-power.svg',
  
  // Cirro Energy
  'cirro energy': 'cirro-energy.svg',
  'cirro-energy': 'cirro-energy.svg',
  'cirroenergy': 'cirro-energy.svg',
  'cirro': 'cirro-energy.svg',
  
  // Constellation
  'constellation': 'constellation.svg',
  'constellation energy': 'constellation.svg',
  
  // Direct Energy
  'direct energy': 'direct-energy.svg',
  'direct-energy': 'direct-energy.svg',
  'directenergy': 'direct-energy.svg',
  'direct': 'direct-energy.svg',
  
  // Discount Power
  'discount power': 'discount-power.svg',
  'discount-power': 'discount-power.svg',
  'discountpower': 'discount-power.svg',
  'discount': 'discount-power.svg',
  
  // Frontier Utilities
  'frontier utilities': 'frontier-utilities.svg',
  'frontier-utilities': 'frontier-utilities.svg',
  'frontierutilities': 'frontier-utilities.svg',
  'frontier': 'frontier-utilities.svg',
  
  // Gexa Energy
  'gexa energy': 'gexa-energy.svg',
  'gexa-energy': 'gexa-energy.svg',
  'gexaenergy': 'gexa-energy.svg',
  'gexa': 'gexa-energy.svg',
  
  // Green Mountain Energy
  'green mountain energy': 'green-mountain-energy.svg',
  'green mountain': 'green-mountain-energy.svg',
  'green-mountain-energy': 'green-mountain-energy.svg',
  'green-mountain': 'green-mountain-energy.svg',
  'greenmountainenergy': 'green-mountain-energy.svg',
  'greenmountain': 'green-mountain-energy.svg',
  
  // Just Energy
  'just energy': 'just-energy.svg',
  'just-energy': 'just-energy.svg',
  'justenergy': 'just-energy.svg',
  'just': 'just-energy.svg',
  
  // Payless Power
  'payless power': 'payless-power.svg',
  'payless-power': 'payless-power.svg',
  'paylesspower': 'payless-power.svg',
  'payless': 'payless-power.svg',
  
  // Reliant Energy
  'reliant energy': 'reliant-energy.svg',
  'reliant-energy': 'reliant-energy.svg',
  'reliantenergy': 'reliant-energy.svg',
  'reliant': 'reliant-energy.svg',
  
  // Rhythm Energy
  'rhythm energy': 'rhythm-energy.svg',
  'rhythm-energy': 'rhythm-energy.svg',
  'rhythmenergy': 'rhythm-energy.svg',
  'rhythm': 'rhythm-energy.svg',
  
  // Tara Energy
  'tara energy': 'tara-energy.svg',
  'tara-energy': 'tara-energy.svg',
  'taraenergy': 'tara-energy.svg',
  'tara': 'tara-energy.svg',
  
  // TXU Energy
  'txu energy': 'txu-energy.svg',
  'txu-energy': 'txu-energy.svg',
  'txuenergy': 'txu-energy.svg',
  'txu': 'txu-energy.svg',
};

/**
 * Normalize provider name for consistent lookup
 */
function normalizeProviderName(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s&-]/g, '') // Remove special chars except &, -, and spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/\s*(energy|power|electric|utilities?)\s*$/i, '') // Remove common suffixes
    .trim();
}

/**
 * Get the logo filename for a provider
 * Returns the filename only (not the full path)
 */
export function getProviderLogoFilename(providerName: string): string | null {
  if (!providerName) return null;
  
  // Try exact match first
  const normalizedName = normalizeProviderName(providerName);
  let logoFilename = providerLogoMap[normalizedName];
  
  if (logoFilename) return logoFilename;
  
  // Try alternative normalizations
  const alternatives = [
    providerName.toLowerCase().trim(),
    providerName.toLowerCase().replace(/\s+/g, ''),
    providerName.toLowerCase().replace(/\s+/g, '-'),
    normalizedName.replace(/\s+/g, ''),
    normalizedName.replace(/\s+/g, '-'),
  ];
  
  for (const alt of alternatives) {
    logoFilename = providerLogoMap[alt];
    if (logoFilename) return logoFilename;
  }
  
  // Try partial matches
  for (const [key, filename] of Object.entries(providerLogoMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return filename;
    }
  }
  
  return null;
}

/**
 * Get the full logo path for a provider
 * Returns the complete path relative to the website root
 */
export function getProviderLogoPath(providerName: string): string {
  const filename = getProviderLogoFilename(providerName);
  
  if (!filename) {
    return '/logos/placeholder.png'; // fallback image
  }
  
  return `/logos/${filename}`;
}

/**
 * Check if a provider has a logo available
 */
export function hasProviderLogo(providerName: string): boolean {
  return getProviderLogoFilename(providerName) !== null;
}

/**
 * Get all available provider logos
 */
export function getAvailableProviders(): string[] {
  const providers = new Set<string>();
  
  // Extract unique provider names from the mapping
  for (const logoFilename of Object.values(providerLogoMap)) {
    const providerName = logoFilename
      .replace(/\.svg$/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    providers.add(providerName);
  }
  
  return Array.from(providers).sort();
}

/**
 * Logo component props for React/Astro components
 */
export interface ProviderLogoProps {
  provider: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
  fallbackText?: boolean;
}

/**
 * Get standardized logo props for consistent usage across components
 */
export function getProviderLogoProps(
  provider: string,
  options: Omit<ProviderLogoProps, 'provider'> = {}
): Required<ProviderLogoProps> & { src: string; hasLogo: boolean } {
  const { 
    size = 'md', 
    className = '', 
    alt = '',
    fallbackText = false 
  } = options;
  
  const logoPath = getProviderLogoPath(provider);
  const hasLogo = hasProviderLogo(provider);
  
  return {
    provider,
    size,
    className: `provider-logo provider-logo-${size} ${className}`.trim(),
    alt: alt || `${provider} logo`,
    fallbackText,
    src: logoPath,
    hasLogo
  };
}

// Export the provider mapping for debugging/testing
export const PROVIDER_LOGO_MAPPING = providerLogoMap;