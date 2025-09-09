/**
 * Main XML Sitemap Generator
 * Task T033: Dynamic sitemap generation for SEO optimization
 * Phase 3.5 Polish & Validation: Search engine visibility
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://choosemypower.org';
  const currentDate = new Date().toISOString().split('T')[0];

  // Main sitemap index pointing to specialized sitemaps
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-pages.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-cities.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-resources.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new Response(sitemapIndex, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=7200' // 1 hour cache, 2 hour CDN
    }
  });
};