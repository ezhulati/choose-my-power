/**
 * Enhanced Faceted Navigation Sitemap Generator
 * Generates optimized sitemaps for thousands of faceted URLs
 * Includes priority scoring and change frequency optimization
 */

import type { APIRoute } from 'astro';
import { getPreBuildUrls } from '../lib/faceted/static-generation-strategy';
import { tdspMapping } from '../config/tdsp-mapping';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site?.toString() || 'https://choosemypower.org';
  
  try {
    console.log('🗺️  Generating enhanced faceted sitemap...');
    
    // Get all pre-build URLs from static generation strategy
    const urls = await getPreBuildUrls();
    
    // Generate sitemap entries
    const sitemapUrls: SitemapUrl[] = urls.map(url => {
      const normalizedPath = url.replace(/\/+$/, '');
      const fullUrl = `${baseUrl}${normalizedPath}`;
      const segments = url.split('/').filter(Boolean);
      const citySlug = segments[2] || '';
      const filterCount = segments.length - 2; // Subtract 'electricity-plans' and city
      
      return {
        loc: fullUrl.replace(/\/+$/, ''),
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: getChangeFrequency(citySlug, filterCount),
        priority: getPriority(citySlug, filterCount)
      };
    });

    // Sort by priority (highest first) for optimal crawling
    sitemapUrls.sort((a, b) => parseFloat(b.priority) - parseFloat(a.priority));

    // Generate XML
    const xml = generateSitemapXML(sitemapUrls);
    
    console.log(`✅ Generated sitemap with ${sitemapUrls.length} faceted URLs`);
    
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
    
  } catch (error) {
    console.error('❌ Failed to generate faceted sitemap:', error);
    
    // Return minimal sitemap on error
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/electricity-plans/dallas</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    return new Response(fallbackXml, {
      status: 500,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
};

/**
 * Determine change frequency based on city tier and filter depth
 */
function getChangeFrequency(citySlug: string, filterCount: number): SitemapUrl['changefreq'] {
  const cityData = tdspMapping[citySlug];
  const tier = cityData?.tier || 3;
  
  // City pages (no filters)
  if (filterCount === 0) {
    return tier === 1 ? 'daily' : tier === 2 ? 'weekly' : 'monthly';
  }
  
  // Single filter pages
  if (filterCount === 1) {
    return tier === 1 ? 'weekly' : 'monthly';
  }
  
  // Multi-filter pages change less frequently
  return 'monthly';
}

/**
 * Calculate priority score based on city tier and filter complexity
 */
function getPriority(citySlug: string, filterCount: number): string {
  const cityData = tdspMapping[citySlug];
  const tier = cityData?.tier || 3;
  const basePriority = cityData?.priority || 0.5;
  
  // City pages get highest priority
  if (filterCount === 0) {
    return basePriority.toFixed(1);
  }
  
  // Apply filter depth penalty
  let priority = basePriority;
  const depthPenalty = filterCount * 0.15; // 15% penalty per filter
  priority = Math.max(0.1, priority - depthPenalty);
  
  // Boost for tier 1 cities
  if (tier === 1) {
    priority += 0.1;
  }
  
  return Math.min(1.0, priority).toFixed(1);
}

/**
 * Generate XML sitemap string
 */
function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(url => 
    `  <url>
    <loc>${escapeXml(url.loc.replace(/\/+$/, ''))}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
