/**
 * Cities sitemap endpoint for Astro
 * Returns XML sitemap for all city-specific electricity plan pages
 */

import type { APIRoute } from 'astro';
import { generateCitiesSitemapXML } from '../lib/seo/sitemap';

export const GET: APIRoute = async () => {
  const sitemapXML = generateCitiesSitemapXML();
  
  return new Response(sitemapXML, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=7200', // Cache for 2 hours
      'X-Robots-Tag': 'noindex'
    }
  });
};