/**
 * Robust Logo Management Service
 * Database-backed logo system with automatic fallbacks
 */

import { db } from '../database/connection';

interface LogoData {
  url: string;
  fallbackText: string;
  isDefault: boolean;
}

import { 
  PROVIDER_NAME_MAPPING, 
  PROVIDER_COLORS, 
  PROVIDER_LOGO_URLS 
} from './provider-mappings';

// Cache for logo data to avoid repeated database queries
const logoCache = new Map<string, LogoData>();

/**
 * Normalize provider name to consistent slug format
 */
function normalizeProviderName(name: string): string {
  const normalized = name.toLowerCase().trim();
  return PROVIDER_NAME_MAPPING[normalized] || normalized.replace(/[^a-z0-9]+/g, '-');
}

/**
 * Generate fallback SVG logo for provider
 */
function generateFallbackSvg(providerName: string, color?: string): string {
  const normalizedName = normalizeProviderName(providerName);
  const displayName = providerName.toUpperCase().replace(/[^A-Z0-9\s]/g, '').slice(0, 12);
  const bgColor = color || PROVIDER_COLORS[normalizedName] || '#6B7280';
  
  return `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="none">
      <rect width="120" height="40" rx="4" fill="${bgColor}"/>
      <text x="60" y="26" font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="white">${displayName}</text>
    </svg>
  `)}`;
}

/**
 * Get logo data from database with caching
 */
async function getLogoFromDatabase(providerName: string): Promise<LogoData | null> {
  try {
    const normalizedName = normalizeProviderName(providerName);
    
    // Check provider_cache first (faster lookup)
    const cachedProvider = await db.query(`
      SELECT logo_url FROM provider_cache 
      WHERE LOWER(provider_name) = $1 OR provider_name ILIKE $2
    `, [normalizedName, `%${providerName}%`]);
    
    if (cachedProvider.rows.length > 0 && cachedProvider.rows[0].logo_url) {
      return {
        url: cachedProvider.rows[0].logo_url,
        fallbackText: providerName,
        isDefault: false
      };
    }
    
    // Check main providers table
    const provider = await db.query(`
      SELECT logo_url, logo_filename, name FROM providers 
      WHERE LOWER(name) = $1 OR name ILIKE $2
    `, [normalizedName.replace(/-/g, ' '), `%${providerName}%`]);
    
    if (provider.rows.length > 0) {
      const row = provider.rows[0];
      if (row.logo_url) {
        return {
          url: row.logo_url,
          fallbackText: row.name,
          isDefault: false
        };
      }
      
      if (row.logo_filename) {
        return {
          url: `/logos/${row.logo_filename}`,
          fallbackText: row.name,
          isDefault: false
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Database logo lookup error:', error);
    return null;
  }
}

/**
 * Check if logo URL exists in our mapping
 */
async function getLogoFromMapping(providerName: string): Promise<string | null> {
  const normalizedName = normalizeProviderName(providerName);
  
  // First check direct mapping
  if (PROVIDER_LOGO_URLS[normalizedName]) {
    return PROVIDER_LOGO_URLS[normalizedName];
  }
  
  // Check local logos as fallback
  const knownLocalLogos = [
    'reliant-energy', 'txu-energy', 'direct-energy', 'constellation',
    'frontier-utilities', 'rhythm-energy', 'discount-power', 'payless-power',
    'atlantex-power', 'apge', 'tara-energy'
  ];
  
  if (knownLocalLogos.includes(normalizedName)) {
    return `/logos/${normalizedName}.svg`;
  }
  
  return null;
}

/**
 * Store logo information in database cache
 */
async function storeLogoInCache(providerName: string, logoUrl: string): Promise<void> {
  try {
    await db.query(`
      INSERT INTO provider_cache (provider_name, logo_url, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (provider_name) 
      DO UPDATE SET logo_url = $2, updated_at = NOW()
    `, [providerName, logoUrl]);
  } catch (error) {
    console.warn('Failed to cache logo:', error);
  }
}

/**
 * Main logo service function with intelligent fallbacks
 */
export async function getProviderLogo(providerName: string): Promise<LogoData> {
  if (!providerName?.trim()) {
    return {
      url: generateFallbackSvg('Unknown Provider'),
      fallbackText: 'Unknown Provider',
      isDefault: true
    };
  }
  
  const cacheKey = providerName.toLowerCase().trim();
  
  // Check memory cache first
  if (logoCache.has(cacheKey)) {
    return logoCache.get(cacheKey)!;
  }
  
  // 1. Try database lookup
  const dbLogo = await getLogoFromDatabase(providerName);
  if (dbLogo) {
    logoCache.set(cacheKey, dbLogo);
    return dbLogo;
  }
  
  // 2. Try logo mapping (external URLs + local fallbacks)
  const mappedLogo = await getLogoFromMapping(providerName);
  if (mappedLogo) {
    const logoData: LogoData = {
      url: mappedLogo,
      fallbackText: providerName,
      isDefault: false
    };
    
    // Cache in database for future use
    await storeLogoInCache(providerName, mappedLogo);
    logoCache.set(cacheKey, logoData);
    return logoData;
  }
  
  // 3. Generate fallback SVG
  const fallbackLogo: LogoData = {
    url: generateFallbackSvg(providerName),
    fallbackText: providerName,
    isDefault: true
  };
  
  // Cache fallback temporarily (shorter cache time)
  logoCache.set(cacheKey, fallbackLogo);
  return fallbackLogo;
}

/**
 * Batch logo retrieval for multiple providers
 */
export async function getProviderLogos(providerNames: string[]): Promise<Record<string, LogoData>> {
  const logos: Record<string, LogoData> = {};
  
  // Process in parallel for better performance
  await Promise.all(
    providerNames.map(async (name) => {
      if (name?.trim()) {
        logos[name] = await getProviderLogo(name);
      }
    })
  );
  
  return logos;
}

/**
 * Synchronous logo URL generator (for components that can't use async)
 * Uses cached data or generates fallback immediately
 */
export function getProviderLogoSync(providerName: string): string {
  if (!providerName?.trim()) {
    return generateFallbackSvg('Unknown Provider');
  }
  
  const cacheKey = providerName.toLowerCase().trim();
  
  // Check memory cache
  if (logoCache.has(cacheKey)) {
    return logoCache.get(cacheKey)!.url;
  }
  
  // Check logo mapping first
  const normalizedName = normalizeProviderName(providerName);
  
  // Check external URL mapping
  if (PROVIDER_LOGO_URLS[normalizedName]) {
    return PROVIDER_LOGO_URLS[normalizedName];
  }
  
  // Check local logos as fallback
  const knownLocalLogos = [
    'reliant-energy', 'txu-energy', 'direct-energy', 'constellation',
    'frontier-utilities', 'rhythm-energy', 'discount-power', 'payless-power',
    'atlantex-power', 'apge', 'tara-energy'
  ];
  
  if (knownLocalLogos.includes(normalizedName)) {
    return `/logos/${normalizedName}.svg`;
  }
  
  // Generate fallback
  return generateFallbackSvg(providerName);
}

/**
 * Clear logo cache (useful for development)
 */
export function clearLogoCache(): void {
  logoCache.clear();
}

/**
 * Get cache statistics
 */
export function getLogoCacheStats(): { size: number; keys: string[] } {
  return {
    size: logoCache.size,
    keys: Array.from(logoCache.keys())
  };
}

/**
 * Preload logos for common providers
 */
export async function preloadCommonLogos(): Promise<void> {
  // Get all providers from our mapping
  const commonProviders = [
    'Reliant', 'TXU Energy', 'Direct Energy', 'Frontier Utilities', 
    'Gexa Energy', '4change Energy', 'Discount Power', 'Cirro Energy',
    'APGE', 'Rhythm Energy', 'Atlantex Power', 'Just Energy',
    'Tara Energy', 'Green Mountain', 'Amigo Energy', 'Payless Power'
  ];
  
  await Promise.all(
    commonProviders.map(provider => getProviderLogo(provider))
  );
  
  console.log(`✅ Preloaded ${commonProviders.length} common provider logos`);
}