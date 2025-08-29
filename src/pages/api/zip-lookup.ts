import type { APIRoute } from 'astro';
import { zipToCity, municipalUtilities, getCityFromZip } from '../../config/tdsp-mapping';

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

// Validate ZIP code format
function isValidZipCode(zip: string): boolean {
  return /^\d{5}$/.test(zip);
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
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
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
    // Look up city from ZIP code
    const citySlug = getCityFromZip(zipCode);

    if (!citySlug) {
      return new Response(JSON.stringify({
        success: false,
        zipCode,
        error: 'ZIP code not found in our service area. We currently serve the Texas deregulated electricity market.',
        errorType: 'not_found'
      } as ZipLookupResponse), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache not found results for 1 hour
        }
      });
    }

    const cityDisplayName = formatCityDisplayName(citySlug);

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
            'Location': `/texas/${citySlug}/municipal-utility`,
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
        redirectUrl: `/texas/${citySlug}/municipal-utility`,
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
    console.log(`✅ ZIP lookup success: ${zipCode} -> ${citySlug} (${processingTime}ms)`);
    
    // Check if this is a direct browser navigation (Accept header indicates HTML)
    const acceptHeader = request.headers.get('accept') || '';
    const wantsBrowserRedirect = acceptHeader.includes('text/html');
    
    if (wantsBrowserRedirect) {
      // Direct browser navigation - perform immediate redirect
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `/texas/${citySlug}`,
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
      redirectUrl: `/texas/${citySlug}`,
      municipalUtility: false
    } as ZipLookupResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400', // Cache successful lookups for 24 hours
        'X-Processing-Time': `${processingTime}ms`
      }
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
    return GET({ request: getRequest } as any);
    
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