/**
 * Dynamic Sitemap Generation API for ZIP Navigation SEO
 * Task T033: Generate XML sitemaps for city electricity plans pages
 * Phase 3.5 Polish & Validation: SEO optimization and search engine visibility
 */

import type { APIRoute } from 'astro';
import { zipNavigationSEOService } from '../../../lib/seo/zip-navigation-seo';
import type { ZIPCodeMapping } from '../../../types/zip-navigation';

// Mock ZIP mappings - in production, this would come from the database
const getMockZIPMappings = (): ZIPCodeMapping[] => {
  return [
    {
      zipCode: '75201',
      cityName: 'dallas',
      citySlug: 'dallas-tx',
      stateName: 'texas',
      stateCode: 'TX',
      county: 'Dallas County',
      marketZone: 'North' as const,
      tdspTerritory: 'oncor',
      isDeregulated: true,
      priority: 0.9,
      lastValidated: new Date('2024-01-01')
    },
    {
      zipCode: '77001',
      cityName: 'houston',
      citySlug: 'houston-tx',
      stateName: 'texas',
      stateCode: 'TX',
      county: 'Harris County',
      marketZone: 'Coast' as const,
      tdspTerritory: 'centerpoint',
      isDeregulated: true,
      priority: 0.9,
      lastValidated: new Date('2024-01-01')
    },
    {
      zipCode: '78701',
      cityName: 'austin',
      citySlug: 'austin-tx',
      stateName: 'texas',
      stateCode: 'TX',
      county: 'Travis County',
      marketZone: 'Central' as const,
      tdspTerritory: 'austin-energy',
      isDeregulated: false,
      priority: 0.8,
      lastValidated: new Date('2024-01-01')
    },
    {
      zipCode: '78201',
      cityName: 'san-antonio',
      citySlug: 'san-antonio-tx',
      stateName: 'texas',
      stateCode: 'TX',
      county: 'Bexar County',
      marketZone: 'South' as const,
      tdspTerritory: 'cps-energy',
      isDeregulated: false,
      priority: 0.8,
      lastValidated: new Date('2024-01-01')
    },
    {
      zipCode: '76101',
      cityName: 'fort-worth',
      citySlug: 'fort-worth-tx',
      stateName: 'texas',
      stateCode: 'TX',
      county: 'Tarrant County',
      marketZone: 'North' as const,
      tdspTerritory: 'oncor',
      isDeregulated: true,
      priority: 0.8,
      lastValidated: new Date('2024-01-01')
    }
  ];
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const format = searchParams.get('format') || 'xml';
    const type = searchParams.get('type') || 'cities';

    // In production, this would fetch from the database
    // const zipMappings = await getZIPMappings();
    const zipMappings = getMockZIPMappings();

    if (format === 'xml') {
      // Generate XML sitemap
      const sitemapEntries = zipNavigationSEOService.generateZIPSitemapEntries(zipMappings);
      
      const xmlSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`).join('\n')}
</urlset>`;

      return new Response(xmlSitemap, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600, s-maxage=7200' // 1 hour cache, 2 hour CDN
        }
      });
    }

    if (format === 'json') {
      // Generate JSON sitemap for API consumption
      const sitemapEntries = zipNavigationSEOService.generateZIPSitemapEntries(zipMappings);
      
      return new Response(JSON.stringify({
        success: true,
        data: {
          sitemap: sitemapEntries,
          generated: new Date().toISOString(),
          total: sitemapEntries.length,
          type: 'city-electricity-plans'
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=1800, s-maxage=3600' // 30 min cache, 1 hour CDN
        }
      });
    }

    // Generate robots.txt directives
    if (format === 'robots') {
      const robotsDirectives = zipNavigationSEOService.generateRobotsDirectives();
      
      return new Response(robotsDirectives.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=7200, s-maxage=14400' // 2 hour cache, 4 hour CDN
        }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: {
        message: 'Invalid format parameter',
        details: 'Supported formats: xml, json, robots'
      }
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('[SEO Sitemap API] Error generating sitemap:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        message: 'Failed to generate sitemap',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { zipMappings, options = {} } = body;

    if (!Array.isArray(zipMappings)) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          message: 'Invalid request body',
          details: 'zipMappings array is required'
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Generate sitemap entries from provided ZIP mappings
    const sitemapEntries = zipNavigationSEOService.generateZIPSitemapEntries(zipMappings);
    
    const format = options.format || 'json';
    
    if (format === 'xml') {
      const xmlSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`).join('\n')}
</urlset>`;

      return new Response(xmlSitemap, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml'
        }
      });
    }

    // Default to JSON format
    return new Response(JSON.stringify({
      success: true,
      data: {
        sitemap: sitemapEntries,
        generated: new Date().toISOString(),
        total: sitemapEntries.length,
        source: 'custom-zip-mappings'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('[SEO Sitemap API] Error in POST request:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        message: 'Failed to process sitemap generation request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};