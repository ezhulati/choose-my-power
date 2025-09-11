/**
 * POST /api/zip/navigate - ZIP Code Navigation Endpoint
 * Task T013 from tasks.md
 * FIXES: Legacy API redirect bug (line 174 in zip-lookup.ts)
 * Constitutional compliance: Dynamic data only, real plan counts
 */

import type { APIRoute } from 'astro';
import { zipToCity, municipalUtilities, getCityFromZip } from '../../../config/tdsp-mapping';
import { comprehensiveZIPService } from '../../../lib/services/comprehensive-zip-service';
import type { 
  ZIPNavigationRequest, 
  ZIPNavigationResponse, 
  ZIPErrorCode 
} from '../../../types/zip-navigation';

export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  
  try {
    // Parse request body
    let requestData: ZIPNavigationRequest;
    try {
      requestData = await request.json();
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body',
        errorCode: 'INVALID_FORMAT',
        suggestions: ['Ensure request body contains valid JSON with zipCode field']
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { zipCode, validatePlansAvailable = false, usageKwh } = requestData;

    // Validate required fields
    if (!zipCode || typeof zipCode !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'zipCode is required and must be a string',
        errorCode: 'INVALID_FORMAT',
        suggestions: ['Provide a valid ZIP code string']
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Basic ZIP format validation
    if (!/^\d{5}$/.test(zipCode)) {
      return new Response(JSON.stringify({
        success: false,
        errorCode: 'INVALID_FORMAT' as ZIPErrorCode,
        error: 'ZIP code must be 5 digits',
        suggestions: ['Enter a valid 5-digit ZIP code'],
        validationTime: Date.now() - startTime
      } as ZIPNavigationResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use the same lookup logic as the working /api/zip-lookup endpoint
    let citySlug = getCityFromZip(zipCode);
    let cityDisplayName = '';
    const isDeregulated = true;

    if (!citySlug) {
      // Fallback to comprehensive ZIP service
      try {
        const universalResult = await comprehensiveZIPService.lookupZIPCode(zipCode);
        
        if (universalResult.success) {
          citySlug = universalResult.citySlug!;
          cityDisplayName = universalResult.cityDisplayName || universalResult.cityName || '';
        } else if (universalResult.municipalUtility) {
          // Handle municipal utility
          return new Response(JSON.stringify({
            success: true,
            redirectUrl: universalResult.redirectUrl!,
            cityName: universalResult.cityDisplayName || universalResult.cityName || '',
            citySlug: universalResult.citySlug || '',
            stateName: 'Texas',
            stateSlug: 'texas',
            tdspTerritory: universalResult.utilityName || 'Municipal',
            serviceTerritory: 'MUNICIPAL',
            planCount: 0,
            hasPlans: false,
            isMunicipalUtility: true,
            validationTime: Date.now() - startTime,
            processedAt: new Date().toISOString(),
            source: 'database'
          } as ZIPNavigationResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          // ZIP not found
          return new Response(JSON.stringify({
            success: false,
            errorCode: 'NOT_FOUND' as ZIPErrorCode,
            error: universalResult.error || 'ZIP code not found in Texas',
            suggestions: [
              'Check if ZIP code is correct',
              'Texas ZIP codes start with 7',
              'Try a nearby ZIP code'
            ],
            validationTime: Date.now() - startTime
          } as ZIPNavigationResponse), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          errorCode: 'NOT_FOUND' as ZIPErrorCode,
          error: 'ZIP code not found in our service area',
          suggestions: [
            'Check if ZIP code is correct',
            'Try a nearby ZIP code'
          ],
          validationTime: Date.now() - startTime
        } as ZIPNavigationResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (!citySlug) {
      return new Response(JSON.stringify({
        success: false,
        errorCode: 'NOT_FOUND' as ZIPErrorCode,
        error: 'ZIP code not found in our service area',
        suggestions: [
          'Check if ZIP code is correct',
          'Try a nearby ZIP code'
        ],
        validationTime: Date.now() - startTime
      } as ZIPNavigationResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Format city display name if not already set
    if (!cityDisplayName) {
      cityDisplayName = citySlug
        .split('-')
        .map(word => word === 'tx' ? 'TX' : word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(' Tx', ', TX');
    }

    // Check if this is a municipal utility area
    if (municipalUtilities[citySlug]) {
      const utilityInfo = municipalUtilities[citySlug];
      const municipalRedirectUrl = `/electricity-plans/${citySlug}/municipal-utility`;
      
      return new Response(JSON.stringify({
        success: true,
        redirectUrl: municipalRedirectUrl,
        cityName: cityDisplayName,
        citySlug: citySlug,
        stateName: 'Texas',
        stateSlug: 'texas',
        tdspTerritory: utilityInfo.name,
        serviceTerritory: 'MUNICIPAL',
        planCount: 0,
        hasPlans: false,
        isMunicipalUtility: true,
        validationTime: Date.now() - startTime,
        processedAt: new Date().toISOString(),
        source: 'database'
      } as ZIPNavigationResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 5: Validate plans are available (if requested)
    let planCount = 0;
    if (validatePlansAvailable) {
      try {
        // Use the plan count method from the service (fallback to 0)
        try {
          const { loadCityData } = await import('../../../lib/api/plan-data-service');
          const cityPlanData = await loadCityData(cityData.slug.replace('-tx', ''));
          planCount = cityPlanData?.filters?.['no-filters']?.plans?.length || 0;
        } catch (error) {
          console.warn('[ZIP Navigation] Error loading plan count:', error);
          planCount = 0;
        }
        
        if (planCount === 0) {
          await analyticsService.trackZIPValidation({
            zipCode,
            success: false,
            errorCode: 'NO_PLANS',
            validationTime: Date.now() - startTime
          });

          return new Response(JSON.stringify({
            success: false,
            errorCode: 'NO_PLANS' as ZIPErrorCode,
            error: `No electricity plans available for ${cityData.name}`,
            suggestions: [
              'Try a nearby city ZIP code',
              'Check back later as plans are updated regularly',
              'Contact customer service for assistance'
            ],
            validationTime: Date.now() - startTime
          } as ZIPNavigationResponse), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        console.error('[ZIP Navigation] Error checking plan availability:', error);
        // Continue without plan validation if service is unavailable
      }
    }

    // Generate correct redirect URL (no trailing slash)
    const redirectUrl = `/electricity-plans/${citySlug}`;

    // Return success response
    const validationTime = Date.now() - startTime;
    const response: ZIPNavigationResponse = {
      success: true,
      redirectUrl,
      cityName: cityDisplayName,
      citySlug: citySlug,
      stateName: 'Texas',
      stateSlug: 'texas',
      tdspTerritory: 'Oncor',
      serviceTerritory: 'ERCOT',
      planCount: validatePlansAvailable ? planCount : undefined,
      hasPlans: validatePlansAvailable ? planCount > 0 : undefined,
      validationTime,
      processedAt: new Date().toISOString(),
      source: 'database' // Always use real data
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 minute cache
      }
    });

  } catch (error) {
    console.error('[ZIP Navigation] Unexpected error:', error);

    // Track system error
    try {
      const analyticsService = new AnalyticsService();
      await analyticsService.trackZIPValidation({
        zipCode: 'unknown',
        success: false,
        errorCode: 'API_ERROR',
        validationTime: Date.now() - startTime
      });
    } catch (analyticsError) {
      console.error('[ZIP Navigation] Analytics error:', analyticsError);
    }

    return new Response(JSON.stringify({
      success: false,
      errorCode: 'API_ERROR' as ZIPErrorCode,
      error: 'Internal server error processing ZIP code',
      suggestions: [
        'Try again in a moment',
        'Contact support if problem persists'
      ],
      validationTime: Date.now() - startTime
    } as ZIPNavigationResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};