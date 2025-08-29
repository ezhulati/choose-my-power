/**
 * Dynamic XML Sitemap Generator for Google Search Console
 * Auto-updates when site structure changes, pages added/removed
 * Generates comprehensive sitemap for all 5,800+ pages
 */

import { generateCompleteSitemap, generateXMLSitemap } from '../lib/sitemap/sitemap-generator.js';

export async function GET() {
  try {
    // Generate complete sitemap with real-time data
    const sitemapData = generateCompleteSitemap();
    
    // Convert to XML format
    const xmlContent = generateXMLSitemap(sitemapData.sections);
    
    // Add generation metadata and auto-update info
    const xmlWithMetadata = xmlContent.replace(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Auto-Generated: ${sitemapData.lastGenerated} -->
  <!-- Total URLs: ${sitemapData.totalUrls} -->
  <!-- Sections: ${sitemapData.sections.map(s => s.name + ' (' + s.count + ')').join(', ')} -->
  <!-- Auto-updates: When pages are added/removed or site structure changes -->
  <!-- Next update: On next request after content changes -->`
    );

    return new Response(xmlWithMetadata, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, must-revalidate', // 30 min cache with revalidation
        'X-Total-URLs': sitemapData.totalUrls.toString(),
        'X-Last-Generated': sitemapData.lastGenerated,
        'X-Auto-Update': 'enabled',
        'X-Sections': sitemapData.sections.length.toString()
      }
    });
  } catch (error) {
    console.error('Dynamic sitemap generation error:', error);
    
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<error>
  <message>Dynamic sitemap generation failed</message>
  <timestamp>${new Date().toISOString()}</timestamp>
  <retry>true</retry>
</error>`, {
      status: 500,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8'
      }
    });
  }
}