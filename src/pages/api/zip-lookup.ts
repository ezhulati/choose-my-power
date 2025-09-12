import type { APIRoute } from 'astro';
import { zipToCity, municipalUtilities, getCityFromZip } from '../../config/tdsp-mapping';
import { comprehensiveZIPService } from '../../lib/services/comprehensive-zip-service';

// Import 100% coverage mapping
let comprehensiveMapping: Record<string, unknown> | null = null;

async function loadComprehensiveMapping() {
  if (!comprehensiveMapping) {
    try {
      const module = await import('../../types/comprehensive-zip-mapping-100');
      comprehensiveMapping = module.COMPREHENSIVE_ZIP_TDSP_MAPPING_100;
      console.warn(`🎯 Loaded 100% coverage mapping with ${Object.keys(comprehensiveMapping).length} ZIP codes`);
    } catch (error) {
      console.error('Failed to load 100% coverage mapping:', error);
      comprehensiveMapping = {};
    }
  }
  return comprehensiveMapping;
}

// Force server-side rendering for API endpoint
export const prerender = false;

export interface ZipLookupResponse {
  success: boolean;
  zipCode: string;
  city?: string;
  cityDisplayName?: string;
  redirectUrl?: string;
  municipalUtility?: boolean;
  utilityName?: string;
  utilityInfo?: string;
  error?: string;
  errorType?: 'invalid_zip' | 'non_deregulated' | 'out_of_service' | 'not_found';
}


// Helper function to format city display name
function formatCityDisplayName(citySlug: string): string {
  return citySlug
    .split('-')
    .map(word => word === 'tx' ? 'TX' : word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(' Tx', ', TX');
}

// Generate city slug from ZIP code and mapping data (from 100% coverage system)
function generateCitySlug(zipCode: string, mappingData?: Record<string, unknown>): string {
  const zip = parseInt(zipCode);
  
  // Major metro area mappings
  if (zip >= 75000 && zip <= 75399) return 'dallas';
  if (zip >= 76000 && zip <= 76299) return 'fort-worth';
  if (zip >= 77000 && zip <= 77599) return 'houston';
  if (zip >= 78000 && zip <= 78299) return 'austin';
  if (zip >= 78400 && zip <= 78499) return 'corpus-christi';
  if (zip >= 79000 && zip <= 79199) return 'lubbock';
  if (zip >= 79900 && zip <= 79999) return 'el-paso';
  
  // Secondary cities
  if (zip >= 75700 && zip <= 75799) return 'tyler';
  if (zip >= 76700 && zip <= 76799) return 'waco';
  if (zip >= 77550 && zip <= 77599) return 'galveston';
  if (zip >= 78500 && zip <= 78599) return 'mcallen';
  if (zip >= 78600 && zip <= 78699) return 'laredo';
  if (zip >= 79300 && zip <= 79399) return 'amarillo';
  if (zip >= 76900 && zip <= 76999) return 'san-angelo';
  
  // Default based on TDSP zone if available
  if (mappingData?.zone) {
    switch (mappingData.zone) {
      case 'North': return 'north-texas';
      case 'Coast': return 'southeast-texas';
      case 'Central': return 'central-texas';
      case 'South': return 'south-texas';
      case 'Valley': return 'rio-grande-valley';
      default: return 'texas';
    }
  }
  
  return 'texas';
}

// Generate display name for city (from 100% coverage system)
function generateCityDisplayName(zipCode: string, mappingData?: Record<string, unknown>): string {
  const zip = parseInt(zipCode);
  
  // Major metro area display names
  if (zip >= 75000 && zip <= 75399) return 'Dallas';
  if (zip >= 76000 && zip <= 76299) return 'Fort Worth';
  if (zip >= 77000 && zip <= 77599) return 'Houston';
  if (zip >= 78000 && zip <= 78299) return 'Austin';
  if (zip >= 78400 && zip <= 78499) return 'Corpus Christi';
  if (zip >= 79000 && zip <= 79199) return 'Lubbock';
  if (zip >= 79900 && zip <= 79999) return 'El Paso';
  
  // Secondary cities
  if (zip >= 75700 && zip <= 75799) return 'Tyler';
  if (zip >= 76700 && zip <= 76799) return 'Waco';
  if (zip >= 77550 && zip <= 77599) return 'Galveston';
  if (zip >= 78500 && zip <= 78599) return 'McAllen';
  if (zip >= 78600 && zip <= 78699) return 'Laredo';
  if (zip >= 79300 && zip <= 79399) return 'Amarillo';
  if (zip >= 76900 && zip <= 76999) return 'San Angelo';
  
  // Default based on TDSP zone if available
  if (mappingData?.zone) {
    switch (mappingData.zone) {
      case 'North': return 'North Texas';
      case 'Coast': return 'Southeast Texas';
      case 'Central': return 'Central Texas';
      case 'South': return 'South Texas';
      case 'Valley': return 'Rio Grande Valley';
      default: return 'Texas';
    }
  }
  
  return 'Texas';
}

// Validate ZIP code format
function isValidZipCode(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

// Helper function to create CORS-enabled headers
function createCORSHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    ...additionalHeaders
  };
}

export const GET: APIRoute = async ({ request }) => {
  // Add request logging for monitoring
  const startTime = Date.now();
  let zipCode: string | null = null;
  
  try {
    const url = new URL(request.url);
    zipCode = url.searchParams.get('zip')?.trim() || null;
  } catch (urlError) {
    // Handle malformed URL
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid request format',
      errorType: 'invalid_zip'
    } as ZipLookupResponse), {
      status: 400,
      headers: createCORSHeaders({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      })
    });
  }

  // Validate input
  if (!zipCode) {
    return new Response(JSON.stringify({
      success: false,
      error: 'ZIP code is required',
      errorType: 'invalid_zip'
    } as ZipLookupResponse), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }

  if (!isValidZipCode(zipCode)) {
    return new Response(JSON.stringify({
      success: false,
      zipCode,
      error: 'Invalid ZIP code format. Please enter a 5-digit ZIP code.',
      errorType: 'invalid_zip'
    } as ZipLookupResponse), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }

  try {
    // Load 100% coverage mapping
    await loadComprehensiveMapping();
    
    // Check if ZIP is in 100% coverage mapping first
    const mappingData = comprehensiveMapping[zipCode];
    let citySlug: string | undefined;
    let cityDisplayName: string;
    
    if (mappingData) {
      // Use 100% coverage system
      citySlug = generateCitySlug(zipCode, mappingData);
      cityDisplayName = generateCityDisplayName(zipCode, mappingData);
      console.warn(`🎯 100% coverage lookup success: ${zipCode} -> ${citySlug} (confidence: ${mappingData.confidence || 95}%, source: ${mappingData.source || 'comprehensive'})`);
    } else {
      // FALLBACK 1: Look up city from ZIP code in our static mapping
      citySlug = getCityFromZip(zipCode);
      
      if (citySlug) {
        cityDisplayName = formatCityDisplayName(citySlug);
        console.warn(`📍 Static mapping lookup success: ${zipCode} -> ${citySlug}`);
      }
    }

    if (!citySlug) {
      // FALLBACK 2: Use universal ZIP service for unknown ZIP codes
      console.warn(`🔄 ZIP ${zipCode} not found in 100% coverage or static mapping, trying universal lookup...`);
      
      try {
        const universalResult = await comprehensiveZIPService.lookupZIPCode(zipCode);
        
        if (universalResult.success) {
          // Successfully mapped to a supported city
          citySlug = universalResult.citySlug!;
          cityDisplayName = universalResult.cityDisplayName || universalResult.cityName || formatCityDisplayName(citySlug);
          console.warn(`✅ Universal lookup success: ${zipCode} -> ${citySlug} (confidence: ${universalResult.confidence}%)`);
          
          // Log this for future static mapping updates
          console.warn(`📝 Consider adding to static mapping: ${zipCode} -> ${citySlug} (from ${universalResult.cityName})`);
        } else if (universalResult.municipalUtility) {
          // Handle municipal utility case
          const cityDisplayName = universalResult.cityDisplayName || universalResult.cityName;
          const acceptHeader = request.headers.get('accept') || '';
          const wantsBrowserRedirect = acceptHeader.includes('text/html');
          
          if (wantsBrowserRedirect) {
            // Direct browser navigation - redirect to municipal utility page
            return new Response(null, {
              status: 302,
              headers: {
                'Location': universalResult.redirectUrl!,
                'Cache-Control': 'public, max-age=86400'
              }
            });
          }
          
          // AJAX/API call - return JSON response
          return new Response(JSON.stringify({
            success: false,
            zipCode,
            city: universalResult.citySlug,
            cityDisplayName,
            municipalUtility: true,
            utilityName: universalResult.utilityName,
            utilityInfo: universalResult.utilityInfo,
            redirectUrl: universalResult.redirectUrl,
            error: universalResult.error,
            errorType: universalResult.errorType
          } as ZipLookupResponse), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=86400'
            }
          });
        } else {
          // Universal lookup failed
          console.warn(`❌ Universal lookup failed for ${zipCode}: ${universalResult.error}`);
          
          return new Response(JSON.stringify({
            success: false,
            zipCode,
            error: universalResult.error || 'ZIP code not found in Texas deregulated electricity market.',
            errorType: universalResult.errorType || 'not_found'
          } as ZipLookupResponse), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=1800' // Cache universal failures for 30 minutes
            }
          });
        }
      } catch (universalError) {
        console.error(`❌ Universal ZIP lookup error for ${zipCode}:`, universalError);
        
        // Fall back to original error message
        return new Response(JSON.stringify({
          success: false,
          zipCode,
          error: 'ZIP code not found in our service area. We currently serve the Texas deregulated electricity market.',
          errorType: 'not_found'
        } as ZipLookupResponse), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
    }

    if (!citySlug) {
      // This shouldn't happen after 100% coverage mapping, but just in case
      return new Response(JSON.stringify({
        success: false,
        zipCode,
        error: 'ZIP code not found in our service area. We currently serve the Texas deregulated electricity market.',
        errorType: 'not_found'
      } as ZipLookupResponse), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // Ensure cityDisplayName is set if not already set by 100% coverage system
    if (!cityDisplayName) {
      cityDisplayName = formatCityDisplayName(citySlug);
    }

    // Check if this is a municipal utility area
    if (municipalUtilities[citySlug]) {
      const utilityInfo = municipalUtilities[citySlug];
      
      // Check if this is a direct browser navigation
      const acceptHeader = request.headers.get('accept') || '';
      const wantsBrowserRedirect = acceptHeader.includes('text/html');
      
      if (wantsBrowserRedirect) {
        // Direct browser navigation - redirect to municipal utility page
        return new Response(null, {
          status: 302,
          headers: {
            'Location': `/electricity-plans/${citySlug}/municipal-utility`,
            'Cache-Control': 'public, max-age=86400'
          }
        });
      }
      
      // AJAX/API call - return JSON response
      return new Response(JSON.stringify({
        success: false,
        zipCode,
        city: citySlug,
        cityDisplayName,
        municipalUtility: true,
        utilityName: utilityInfo.name,
        utilityInfo: utilityInfo.description,
        redirectUrl: `/electricity-plans/${citySlug}/municipal-utility`,
        error: `${cityDisplayName} is served by ${utilityInfo.name}, a municipal utility. Residents cannot choose their electricity provider.`,
        errorType: 'non_deregulated'
      } as ZipLookupResponse), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400' // Cache municipal utility responses for 24 hours
        }
      });
    }

    // Success case - deregulated market
    const processingTime = Date.now() - startTime;
    console.warn(`✅ ZIP lookup success: ${zipCode} -> ${citySlug} (${processingTime}ms)`);
    
    // Check if this is a direct browser navigation (Accept header indicates HTML)
    const acceptHeader = request.headers.get('accept') || '';
    const wantsBrowserRedirect = acceptHeader.includes('text/html');
    
    if (wantsBrowserRedirect) {
      // Direct browser navigation - perform immediate redirect
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `/electricity-plans/${citySlug}`,
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }
    
    // AJAX/API call - return JSON response
    return new Response(JSON.stringify({
      success: true,
      zipCode,
      city: citySlug,
      cityDisplayName,
      redirectUrl: `/electricity-plans/${citySlug}`,
      municipalUtility: false
    } as ZipLookupResponse), {
      status: 200,
      headers: createCORSHeaders({
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400', // Cache successful lookups for 24 hours
        'X-Processing-Time': `${processingTime}ms`
      })
    });

  } catch (error) {
    // Enhanced error logging for debugging
    const processingTime = Date.now() - startTime;
    console.error('ZIP lookup error:', {
      zipCode,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      processingTime,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer')
    });
    
    return new Response(JSON.stringify({
      success: false,
      zipCode: zipCode || 'unknown',
      error: 'An error occurred while looking up your ZIP code. Please try again.',
      errorType: 'not_found'
    } as ZipLookupResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Processing-Time': `${Date.now() - startTime}ms`
      }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { zip } = body;

    if (!zip) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ZIP code is required',
        errorType: 'invalid_zip'
      } as ZipLookupResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create a new URL with the ZIP parameter for the GET handler
    const url = new URL(request.url);
    url.searchParams.set('zip', zip);
    
    // Create a new request with the GET method
    const getRequest = new Request(url.toString(), {
      method: 'GET',
      headers: request.headers
    });

    // Call the GET handler
    return GET({ request: getRequest } as Parameters<typeof GET>[0]);
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid request body',
      errorType: 'invalid_zip'
    } as ZipLookupResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Handle CORS preflight requests
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: createCORSHeaders()
  });
};