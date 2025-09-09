/**
 * ZIP Lookup SEO API - Generate SEO metadata for ZIP lookup pages
 * Task T033: SEO optimization for ZIP code lookup and routing
 * Phase 3.5 Polish & Validation: Dynamic SEO for ZIP navigation
 */

import type { APIRoute } from 'astro';
import { zipNavigationSEOService } from '../../../lib/seo/zip-navigation-seo';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const zipCode = searchParams.get('zipCode');

    // Validate ZIP code parameter
    if (!zipCode) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          message: 'Missing zipCode parameter',
          details: 'ZIP code is required for SEO metadata generation'
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Validate ZIP code format
    if (!/^\d{5}$/.test(zipCode)) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          message: 'Invalid ZIP code format',
          details: 'ZIP code must be exactly 5 digits'
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Generate ZIP lookup SEO metadata
    const seoMetadata = zipNavigationSEOService.generateZIPLookupSEO(zipCode);

    return new Response(JSON.stringify({
      success: true,
      data: {
        zipCode,
        metadata: seoMetadata,
        generated: new Date().toISOString(),
        source: 'zip-navigation-seo-service'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=1800, s-maxage=3600' // 30 min cache, 1 hour CDN
      }
    });

  } catch (error) {
    console.error('[SEO ZIP API] Error generating ZIP lookup metadata:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        message: 'Failed to generate ZIP lookup SEO metadata',
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
    
    // Support bulk ZIP lookup metadata generation
    if (Array.isArray(body.zipCodes)) {
      const results = [];
      
      for (const zipCode of body.zipCodes) {
        try {
          // Validate ZIP code format
          if (!/^\d{5}$/.test(zipCode)) {
            results.push({
              zipCode,
              success: false,
              error: 'Invalid ZIP code format'
            });
            continue;
          }

          const seoMetadata = zipNavigationSEOService.generateZIPLookupSEO(zipCode);
          
          results.push({
            zipCode,
            success: true,
            metadata: seoMetadata
          });
        } catch (error) {
          results.push({
            zipCode,
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

    // Single ZIP lookup metadata generation
    const zipCode = body.zipCode;
    
    if (!zipCode || !/^\d{5}$/.test(zipCode)) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          message: 'Invalid or missing ZIP code',
          details: 'ZIP code must be exactly 5 digits'
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const seoMetadata = zipNavigationSEOService.generateZIPLookupSEO(zipCode);

    return new Response(JSON.stringify({
      success: true,
      data: {
        zipCode,
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
    console.error('[SEO ZIP API] Error in POST request:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: {
        message: 'Failed to process ZIP lookup SEO request',
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