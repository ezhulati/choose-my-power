/**
 * SEO Metadata API for City Electricity Plans Pages
 * Task T033: Generate SEO metadata for city pages using ZIP navigation SEO service
 * Phase 3.5 Polish & Validation: SEO optimization implementation
 */

import type { APIRoute } from 'astro';
import { zipNavigationSEOService, type ZIPSEOData } from '../../../lib/seo/zip-navigation-seo';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    
    // Extract query parameters
    const zipCode = searchParams.get('zipCode');
    const cityName = searchParams.get('cityName');
    const citySlug = searchParams.get('citySlug');
    const countyName = searchParams.get('countyName');
    const marketZone = searchParams.get('marketZone') as 'North' | 'Central' | 'Coast' | 'South' | 'West';
    const tdspTerritory = searchParams.get('tdspTerritory');
    const planCount = parseInt(searchParams.get('planCount') || '0');
    const avgRate = parseFloat(searchParams.get('avgRate') || '12.5');
    const isDeregulated = searchParams.get('isDeregulated') === 'true';

    // Validate required parameters
    if (!zipCode || !cityName || !citySlug || !marketZone) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          message: 'Missing required parameters',
          details: 'zipCode, cityName, citySlug, and marketZone are required'
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Build ZIP SEO data object
    const zipSEOData: ZIPSEOData = {
      zipCode,
      cityName,
      citySlug,
      countyName: countyName || `${cityName} County`,
      marketZone,
      tdspTerritory: tdspTerritory || 'Unknown',
      planCount,
      avgRate,
      isDeregulated,
      lastUpdated: new Date()
    };

    // Generate comprehensive SEO metadata
    const seoMetadata = zipNavigationSEOService.generateCityPageSEO(zipSEOData);

    // Return SEO metadata
    return new Response(JSON.stringify({
      success: true,
      data: {
        metadata: seoMetadata,
        generated: new Date().toISOString(),
        source: 'zip-navigation-seo-service'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=7200' // 1 hour cache, 2 hour CDN
      }
    });

  } catch (error) {
    console.error('[SEO API] Error generating city metadata:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        message: 'Failed to generate SEO metadata',
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
    
    // Support bulk metadata generation for multiple cities
    if (Array.isArray(body.cities)) {
      const results = [];
      
      for (const cityData of body.cities) {
        try {
          const zipSEOData: ZIPSEOData = {
            zipCode: cityData.zipCode,
            cityName: cityData.cityName,
            citySlug: cityData.citySlug,
            countyName: cityData.countyName || `${cityData.cityName} County`,
            marketZone: cityData.marketZone,
            tdspTerritory: cityData.tdspTerritory || 'Unknown',
            planCount: cityData.planCount || 0,
            avgRate: cityData.avgRate || 12.5,
            isDeregulated: cityData.isDeregulated || false,
            lastUpdated: new Date()
          };

          const seoMetadata = zipNavigationSEOService.generateCityPageSEO(zipSEOData);
          
          results.push({
            citySlug: cityData.citySlug,
            success: true,
            metadata: seoMetadata
          });
        } catch (error) {
          results.push({
            citySlug: cityData.citySlug,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        data: {
          results,
          processed: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          generated: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Single city metadata generation
    const zipSEOData: ZIPSEOData = {
      zipCode: body.zipCode,
      cityName: body.cityName,
      citySlug: body.citySlug,
      countyName: body.countyName || `${body.cityName} County`,
      marketZone: body.marketZone,
      tdspTerritory: body.tdspTerritory || 'Unknown',
      planCount: body.planCount || 0,
      avgRate: body.avgRate || 12.5,
      isDeregulated: body.isDeregulated || false,
      lastUpdated: new Date()
    };

    const seoMetadata = zipNavigationSEOService.generateCityPageSEO(zipSEOData);

    return new Response(JSON.stringify({
      success: true,
      data: {
        metadata: seoMetadata,
        generated: new Date().toISOString(),
        source: 'zip-navigation-seo-service'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('[SEO API] Error in POST request:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        message: 'Failed to process SEO metadata request',
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