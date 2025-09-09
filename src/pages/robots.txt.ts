/**
 * Robots.txt Generation for SEO
 * Task T033: Dynamic robots.txt with sitemap references
 * Phase 3.5 Polish & Validation: Search engine guidance
 */

import type { APIRoute } from 'astro';
import { zipNavigationSEOService } from '../lib/seo/zip-navigation-seo';

export const GET: APIRoute = async () => {
  // Generate robots.txt directives using SEO service
  const robotsDirectives = zipNavigationSEOService.generateRobotsDirectives();
  
  return new Response(robotsDirectives.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=7200, s-maxage=14400' // 2 hour cache, 4 hour CDN
    }
  });
};