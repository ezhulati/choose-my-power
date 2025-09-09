/**
 * Cities XML Sitemap Generator
 * Task T033: Dynamic sitemap generation for city electricity plans pages
 * Phase 3.5 Polish & Validation: SEO optimization for city-specific content
 */

import type { APIRoute } from 'astro';
import { zipNavigationSEOService } from '../lib/seo/zip-navigation-seo';
import type { ZIPCodeMapping } from '../types/zip-navigation';

// In production, this would fetch from the database
const getCityMappings = async (): Promise<ZIPCodeMapping[]> => {
  // Mock data representing major Texas cities with electricity plans
  return [
    // Major Metropolitan Areas - High Priority
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
      priority: 1.0,
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
      priority: 1.0,
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
      priority: 0.9,
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
      priority: 0.9,
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
      priority: 0.9,
      lastValidated: new Date('2024-01-01')
    },
    
    // Major Cities - High Priority
    {
      zipCode: '75069',
      cityName: 'plano',
      citySlug: 'plano-tx',
      stateName: 'texas',
      stateCode: 'TX',
      county: 'Collin County',
      marketZone: 'North' as const,
      tdspTerritory: 'oncor',
      isDeregulated: true,
      priority: 0.8,
      lastValidated: new Date('2024-01-01')
    },
    {
      zipCode: '75044',
      cityName: 'garland',
      citySlug: 'garland-tx',
      stateName: 'texas',
      stateCode: 'TX',
      county: 'Dallas County',
      marketZone: 'North' as const,
      tdspTerritory: 'oncor',
      isDeregulated: true,
      priority: 0.8,
      lastValidated: new Date('2024-01-01')
    },
    {
      zipCode: '75040',
      cityName: 'irving',
      citySlug: 'irving-tx',
      stateName: 'texas',
      stateCode: 'TX',
      county: 'Dallas County',
      marketZone: 'North' as const,
      tdspTerritory: 'oncor',
      isDeregulated: true,
      priority: 0.8,
      lastValidated: new Date('2024-01-01')
    },
    {
      zipCode: '77079',
      cityName: 'katy',
      citySlug: 'katy-tx',
      stateName: 'texas',
      stateCode: 'TX',
      county: 'Harris County',
      marketZone: 'Coast' as const,
      tdspTerritory: 'centerpoint',
      isDeregulated: true,
      priority: 0.8,
      lastValidated: new Date('2024-01-01')
    },
    {
      zipCode: '77573',
      cityName: 'league-city',
      citySlug: 'league-city-tx',
      stateName: 'texas',
      stateCode: 'TX',
      county: 'Galveston County',
      marketZone: 'Coast' as const,
      tdspTerritory: 'centerpoint',
      isDeregulated: true,
      priority: 0.7,
      lastValidated: new Date('2024-01-01')
    },
    
    // Secondary Cities - Medium Priority
    {
      zipCode: '79101',
      cityName: 'amarillo',
      citySlug: 'amarillo-tx',
      stateName: 'texas',
      stateCode: 'TX',
      county: 'Potter County',
      marketZone: 'West' as const,
      tdspTerritory: 'swepco',
      isDeregulated: true,
      priority: 0.7,
      lastValidated: new Date('2024-01-01')
    },
    {
      zipCode: '79401',
      cityName: 'lubbock',
      citySlug: 'lubbock-tx',
      stateName: 'texas',
      stateCode: 'TX',
      county: 'Lubbock County',
      marketZone: 'West' as const,
      tdspTerritory: 'south-plains-electric',
      isDeregulated: false,
      priority: 0.7,
      lastValidated: new Date('2024-01-01')
    },
    {
      zipCode: '75701',
      cityName: 'tyler',
      citySlug: 'tyler-tx',
      stateName: 'texas',
      stateCode: 'TX',
      county: 'Smith County',
      marketZone: 'North' as const,
      tdspTerritory: 'oncor',
      isDeregulated: true,
      priority: 0.6,
      lastValidated: new Date('2024-01-01')
    },
    {
      zipCode: '78501',
      cityName: 'mcallen',
      citySlug: 'mcallen-tx',
      stateName: 'texas',
      stateCode: 'TX',
      county: 'Hidalgo County',
      marketZone: 'South' as const,
      tdspTerritory: 'aep-texas-central',
      isDeregulated: true,
      priority: 0.6,
      lastValidated: new Date('2024-01-01')
    },
    {
      zipCode: '77901',
      cityName: 'victoria',
      citySlug: 'victoria-tx',
      stateName: 'texas',
      stateCode: 'TX',
      county: 'Victoria County',
      marketZone: 'South' as const,
      tdspTerritory: 'aep-texas-central',
      isDeregulated: true,
      priority: 0.6,
      lastValidated: new Date('2024-01-01')
    }
  ];
};

export const GET: APIRoute = async () => {
  try {
    // Get city mappings (in production, from database)
    const cityMappings = await getCityMappings();
    
    // Generate sitemap entries using SEO service
    const sitemapEntries = zipNavigationSEOService.generateZIPSitemapEntries(cityMappings);
    
    // Sort by priority (highest first) then alphabetically
    const sortedEntries = sitemapEntries.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.url.localeCompare(b.url);
    });

    // Generate XML sitemap
    const xmlSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sortedEntries.map(entry => `  <url>
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

  } catch (error) {
    console.error('[Cities Sitemap] Error generating sitemap:', error);
    
    // Return minimal sitemap on error
    const errorSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://choosemypower.org/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new Response(errorSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300' // 5 minute cache on error
      }
    });
  }
};