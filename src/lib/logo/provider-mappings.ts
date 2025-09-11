/**
 * Auto-generated Provider Mappings from CSV Data
 * Generated: 2025-08-31T03:07:46.575Z
 */

export const PROVIDER_NAME_MAPPING = {
  "frontier utilities": "frontier-utilities",
  "frontier": "frontier-utilities",
  "gexa energy": "gexa-energy",
  "gexa": "gexa-energy",
  "4change energy": "4change-energy",
  "4change": "4change-energy",
  "discount power": "discount-power",
  "discount": "discount-power",
  "cirro energy": "cirro-energy",
  "cirro": "cirro-energy",
  "apge": "apge",
  "rhythm energy": "rhythm-energy",
  "rhythm": "rhythm-energy",
  "atlantex power": "atlantex-power",
  "atlantex": "atlantex-power",
  "just energy": "just-energy",
  "just": "just-energy",
  "tara energy": "tara-energy",
  "tara": "tara-energy",
  "reliant": "reliant",
  "direct energy": "direct-energy",
  "direct": "direct-energy",
  "green mountain": "green-mountain",
  "green": "green-mountain",
  "amigo energy": "amigo-energy",
  "amigo": "amigo-energy",
  "payless power": "payless-power",
  "payless": "payless-power",
  "txu energy": "txu-energy",
  "txu": "txu-energy"
};

export const PROVIDER_COLORS = {
  "frontier-utilities": "#8B5A3C",
  "gexa-energy": "#10B981",
  "4change-energy": "#EF4444",
  "discount-power": "#2563EB",
  "cirro-energy": "#06B6D4",
  "apge": "#DC2626",
  "rhythm-energy": "#FF6B35",
  "atlantex-power": "#7C3AED",
  "just-energy": "#8B5CF6",
  "tara-energy": "#EA580C",
  "reliant": "#E31E24",
  "direct-energy": "#00A651",
  "green-mountain": "#22C55E",
  "amigo-energy": "#F59E0B",
  "payless-power": "#059669",
  "txu-energy": "#1E3A8A"
};

// Provider logo URLs with CDN fallbacks and local fallback SVGs
export const PROVIDER_LOGO_URLS = {
  'frontier-utilities': 'https://assets.comparepower.com/images/frontier_utilities.svg',
  'frontier utilities': 'https://assets.comparepower.com/images/frontier_utilities.svg',
  'gexa-energy': 'https://assets.comparepower.com/images/gexa_energy.svg',
  'gexa energy': 'https://assets.comparepower.com/images/gexa_energy.svg',
  '4change-energy': 'https://assets.comparepower.com/images/4change_energy.svg',
  '4change energy': 'https://assets.comparepower.com/images/4change_energy.svg',
  'discount-power': 'https://assets.comparepower.com/images/discount_power.svg',
  'discount power': 'https://assets.comparepower.com/images/discount_power.svg',
  'cirro-energy': 'https://assets.comparepower.com/images/cirro_energy.svg',
  'cirro energy': 'https://assets.comparepower.com/images/cirro_energy.svg',
  'apge': 'https://assets.comparepower.com/images/apge.svg',
  'rhythm-energy': 'https://assets.comparepower.com/images/rhythm_energy.svg',
  'rhythm energy': 'https://assets.comparepower.com/images/rhythm_energy.svg',
  'atlantex-power': 'https://assets.comparepower.com/images/atlantex_power.svg',
  'atlantex power': 'https://assets.comparepower.com/images/atlantex_power.svg',
  'just-energy': 'https://assets.comparepower.com/images/just_energy.svg',
  'just energy': 'https://assets.comparepower.com/images/just_energy.svg',
  'tara-energy': 'https://assets.comparepower.com/images/tara_energy.svg',
  'tara energy': 'https://assets.comparepower.com/images/tara_energy.svg',
  'reliant': 'https://assets.comparepower.com/images/reliant.svg',
  'reliant energy': 'https://assets.comparepower.com/images/reliant.svg',
  'direct-energy': 'https://assets.comparepower.com/images/direct_energy.svg',
  'direct energy': 'https://assets.comparepower.com/images/direct_energy.svg',
  'green-mountain': 'https://assets.comparepower.com/images/green_mountain.svg',
  'green mountain': 'https://assets.comparepower.com/images/green_mountain.svg',
  'green mountain energy': 'https://assets.comparepower.com/images/green_mountain.svg',
  'amigo-energy': 'https://assets.comparepower.com/images/amigo_energy.svg',
  'amigo energy': 'https://assets.comparepower.com/images/amigo_energy.svg',
  'payless-power': 'https://assets.comparepower.com/images/payless_power.svg',
  'payless power': 'https://assets.comparepower.com/images/payless_power.svg',
  'txu-energy': 'https://assets.comparepower.com/images/txu_energy.svg',
  'txu energy': 'https://assets.comparepower.com/images/txu_energy.svg'
};

// Fallback SVG generator - creates branded logos when CDN fails
export const generateFallbackLogoSVG = (providerName: string): string => {
  const normalizedName = providerName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const color = PROVIDER_COLORS[normalizedName] || '#002868'; // Default Texas navy
  const initials = providerName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 3);
  
  return `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="none">
      <rect width="120" height="40" rx="6" fill="${color}"/>
      <text x="60" y="27" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="white">${initials}</text>
    </svg>
  `)}`;
};

// Enhanced logo fetcher with CDN fallback logic
export const getProviderLogo = async (providerName: string): Promise<string> => {
  const normalized = providerName.toLowerCase().trim();
  
  // Try to get URL from mapping
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
  
  // If we have a URL, test if it loads
  if (logoUrl) {
    try {
      const response = await fetch(logoUrl, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        return logoUrl;
      }
    } catch (error) {
      console.warn(`CDN logo failed for ${providerName}, using fallback:`, error);
    }
  }
  
  // Return fallback SVG
  return generateFallbackLogoSVG(providerName);
};