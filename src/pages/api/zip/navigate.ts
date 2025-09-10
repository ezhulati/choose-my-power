/**
 * POST /api/zip/navigate - ZIP Code Navigation Endpoint
 * Task T013 from tasks.md
 * FIXES: Legacy API redirect bug (line 174 in zip-lookup.ts)
 * Constitutional compliance: Dynamic data only, real plan counts
 */

import type { APIRoute } from 'astro';
import { ZIPValidationService } from '../../../lib/services/zip-validation-service';
import { TDSPService } from '../../../lib/services/tdsp-service';
import { AnalyticsService } from '../../../lib/services/analytics-service';
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

    // Initialize services
    const zipService = new ZIPValidationService();
    const tdspService = new TDSPService();
    const analyticsService = new AnalyticsService();

    // Step 1: Validate ZIP code format
    const formatValidation = zipService.validateZIPFormat(zipCode);
    if (!formatValidation.isValid) {
      // Track failed validation
      await analyticsService.trackZIPValidation({
        zipCode,
        success: false,
        errorCode: formatValidation.errorCode!,
        validationTime: Date.now() - startTime
      });

      return new Response(JSON.stringify({
        success: false,
        errorCode: formatValidation.errorCode,
        error: formatValidation.errorMessage,
        suggestions: formatValidation.suggestions,
        validationTime: Date.now() - startTime
      } as ZIPNavigationResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 2: Validate ZIP code is in Texas
    const texasValidation = await zipService.validateZIPCode(zipCode);
    if (!texasValidation.isValid) {
      // Track failed validation
      await analyticsService.trackZIPValidation({
        zipCode,
        success: false,
        errorCode: texasValidation.errorCode!,
        validationTime: Date.now() - startTime
      });

      return new Response(JSON.stringify({
        success: false,
        errorCode: texasValidation.errorCode,
        error: texasValidation.errorMessage,
        suggestions: texasValidation.suggestions,
        validationTime: Date.now() - startTime
      } as ZIPNavigationResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 3: Get city and TDSP territory mapping
    const cityData = texasValidation.cityData;
    if (!cityData) {
      await analyticsService.trackZIPValidation({
        zipCode,
        success: false,
        errorCode: 'NOT_FOUND',
        validationTime: Date.now() - startTime
      });

      return new Response(JSON.stringify({
        success: false,
        errorCode: 'NOT_FOUND' as ZIPErrorCode,
        error: `ZIP code ${zipCode} not found in Texas database`,
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

    // Step 4: Check if this is a deregulated market or municipal utility
    const tdspData = await tdspService.getTDSPByZIP(zipCode);
    
    // Handle municipal utilities (like Austin) differently  
    if (!texasValidation.isDeregulated) {
      // This is a municipal utility - redirect to special page
      const municipalRedirectUrl = `/texas/${cityData.slug}/municipal-utility`;
      
      await analyticsService.trackZIPValidation({
        zipCode,
        success: true, // Municipal utility is a valid result, just different flow
        errorCode: 'MUNICIPAL_UTILITY',
        cityName: cityData.name,
        tdspTerritory: texasValidation.tdspData?.name || 'Municipal',
        validationTime: Date.now() - startTime
      });

      return new Response(JSON.stringify({
        success: true,
        redirectUrl: municipalRedirectUrl,
        cityName: cityData.name,
        citySlug: cityData.slug,
        stateName: 'Texas',
        stateSlug: 'texas',
        tdspTerritory: texasValidation.tdspData?.name || 'Municipal',
        serviceTerritory: texasValidation.tdspData?.territory || 'MUNICIPAL',
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
    
    // For deregulated areas, check TDSP data
    if (!tdspData?.isDeregulated) {
      await analyticsService.trackZIPValidation({
        zipCode,
        success: false,
        errorCode: 'NOT_DEREGULATED',
        validationTime: Date.now() - startTime
      });

      return new Response(JSON.stringify({
        success: false,
        errorCode: 'NOT_DEREGULATED' as ZIPErrorCode,
        error: `ZIP code ${zipCode} is in a regulated electricity market`,
        suggestions: [
          'This area is served by a regulated utility',
          'Deregulated areas in Texas include Houston, Dallas, Fort Worth',
          'Contact your local utility directly for service'
        ],
        validationTime: Date.now() - startTime
      } as ZIPNavigationResponse), {
        status: 400,
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

    // Step 6: Generate correct redirect URL (FIXES legacy bug!)
    // OLD WRONG: `/texas/${citySlug}` 
    // NEW CORRECT: `/electricity-plans/${citySlug}`
    // FIX: Remove -tx suffix to match route expectations
    const citySlugWithoutSuffix = cityData.slug.replace(/-tx$/, '');
    const redirectUrl = `/electricity-plans/${citySlugWithoutSuffix}`;

    // Step 7: Track successful validation
    const validationTime = Date.now() - startTime;
    await analyticsService.trackZIPValidation({
      zipCode,
      success: true,
      cityName: cityData.name,
      tdspTerritory: texasValidation.tdspData?.name || 'Unknown',
      planCount,
      validationTime
    });

    // Step 8: Return success response
    const response: ZIPNavigationResponse = {
      success: true,
      redirectUrl,
      cityName: cityData.name,
      citySlug: cityData.slug,
      stateName: 'Texas',
      stateSlug: 'texas',
      tdspTerritory: texasValidation.tdspData?.name || 'Unknown',
      serviceTerritory: texasValidation.tdspData?.territory || 'Unknown',
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