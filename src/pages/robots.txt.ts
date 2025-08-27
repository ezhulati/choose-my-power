/**
 * Robots.txt endpoint for Astro
 * Returns robots.txt with sitemap references and crawling instructions
 */

import type { APIRoute } from 'astro';
import { generateRobotsTxt } from '../lib/seo/sitemap';

export const GET: APIRoute = async () => {
  const robotsTxt = generateRobotsTxt();
  
  return new Response(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    }
  });
};