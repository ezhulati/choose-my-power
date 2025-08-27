/**
 * Filtered pages sitemap endpoint for Astro
 * Returns XML sitemap for high-value faceted navigation pages
 */

import type { APIRoute } from 'astro';
import { generateFiltersSitemapXML } from '../lib/seo/sitemap';

export const GET: APIRoute = async () => {
  const sitemapXML = generateFiltersSitemapXML();
  
  return new Response(sitemapXML, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour (plans change frequently)
      'X-Robots-Tag': 'noindex'
    }
  });
};