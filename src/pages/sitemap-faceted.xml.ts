/**
 * Comprehensive Faceted Navigation Sitemap
 * Generates XML sitemap for thousands of city/filter combinations
 * Optimized for crawl budget management and SEO performance
 * 
 * SEO Strategist Agent - Phase 2 Implementation
 */

import type { APIRoute } from 'astro';
import { tdspMapping } from '../config/tdsp-mapping';
import { getAllCanonicalPatterns } from '../lib/seo/canonical-scale';
import { getSitemapPriority, getChangeFrequency, shouldIndexCombination } from '../lib/faceted/url-parser';

export const GET: APIRoute = async ({ site }) => {
  const canonicalMap = getAllCanonicalPatterns();
  const sitemapEntries: SitemapEntry[] = [];
  
  // Generate entries for all canonical URLs
  canonicalMap.forEach((canonicalUrls, city) => {
    canonicalUrls.forEach(url => {
      // Extract filters from URL for priority calculation
      const urlParts = url.split('/').filter(Boolean);
      const filters = urlParts.slice(3); // After 'texas' and city name
      
      // Only include URLs that should be indexed
      if (shouldIndexCombination(city, filters)) {
        sitemapEntries.push({
          url,
          lastmod: new Date().toISOString().split('T')[0], // Today's date
          changefreq: getChangeFrequency(city, filters),
          priority: getSitemapPriority(city, filters).toFixed(1)
        });
      }
    });
  });
  
  // Sort by priority (highest first) then by URL
  sitemapEntries.sort((a, b) => {
    const priorityDiff = parseFloat(b.priority) - parseFloat(a.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return a.url.localeCompare(b.url);
  });
  
  // Generate XML
  const xml = generateSitemapXML(sitemapEntries, site?.toString() || 'https://choosemypower.org');
  
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
};

interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

function generateSitemapXML(entries: SitemapEntry[], baseUrl: string): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  
  const xmlEntries = entries.map(entry => `  <url>
    <loc>${(entry.url.startsWith('http') ? entry.url : baseUrl + entry.url).replace(/\/+$/, '')}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n');
  
  const xmlFooter = `</urlset>`;
  
  return `${xmlHeader}\n${xmlEntries}\n${xmlFooter}`;
}
