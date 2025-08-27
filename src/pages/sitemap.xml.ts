/**
 * Main sitemap index endpoint for Astro
 * Returns XML sitemap index pointing to specific sitemaps
 */

import type { APIRoute } from 'astro';
import { generateSitemapIndexXML } from '../lib/seo/sitemap';

export const GET: APIRoute = async () => {
  const sitemapXML = generateSitemapIndexXML();
  
  return new Response(sitemapXML, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'X-Robots-Tag': 'noindex' // Don't index sitemap files themselves
    }
  });
};