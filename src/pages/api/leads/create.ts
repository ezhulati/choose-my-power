/**
 * Lead Creation API Endpoint
 * POST /api/leads/create
 * Captures and processes new leads with comprehensive scoring and recommendations
 */

import type { APIRoute } from 'astro';
import { leadManagementService, type LeadFormData } from '../../../lib/api/lead-management';
import { analyticsService } from '../../../lib/api/analytics-service';

interface LeadCreateRequest {
  zipCode: string;
  citySlug?: string;
  monthlyUsage?: number;
  currentRate?: number;
  preferredContractLength?: number;
  greenEnergyPreference?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  utmSource?: string;
  utmCampaign?: string;
  utmMedium?: string;
  utmContent?: string;
  sessionId?: string;
  planComparisons?: string[];
  metadata?: Record<string, any>;
}

interface LeadCreateResponse {
  success: boolean;
  leadId?: string;
  score?: number;
  status?: string;
  recommendations?: any[];
  message?: string;
  error?: string;
}

export const POST: APIRoute = async ({ request, clientAddress, url }) => {
  const startTime = Date.now();
  
  try {
    // Validate content type
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content-Type must be application/json'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    let requestData: LeadCreateRequest;
    try {
      requestData = await request.json();
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate required fields
    const validation = validateLeadData(requestData);
    if (!validation.valid) {
      return new Response(JSON.stringify({
        success: false,
        error: validation.message,
        details: validation.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract user agent and IP for analytics
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = clientAddress || 'unknown';

    // Prepare lead data
    const leadFormData: LeadFormData = {
      zipCode: requestData.zipCode,
      citySlug: requestData.citySlug,
      monthlyUsage: requestData.monthlyUsage,
      currentRate: requestData.currentRate,
      preferredContractLength: requestData.preferredContractLength,
      greenEnergyPreference: requestData.greenEnergyPreference,
      contactEmail: requestData.contactEmail,
      contactPhone: requestData.contactPhone,
      utmSource: requestData.utmSource,
      utmCampaign: requestData.utmCampaign,
      utmMedium: requestData.utmMedium,
      utmContent: requestData.utmContent,
      sessionId: requestData.sessionId,
      planComparisons: requestData.planComparisons,
    };

    // Process lead with lead management service
    const result = await leadManagementService.captureLead(leadFormData);

    // Track analytics event
    if (requestData.sessionId) {
      await analyticsService.trackLeadCapture(
        requestData.sessionId,
        result.leadId,
        result.score,
        {
          userAgent,
          ipAddress,
          utmSource: requestData.utmSource,
          utmCampaign: requestData.utmCampaign,
          utmMedium: requestData.utmMedium,
          leadScore: result.score,
          hasContact: !!(requestData.contactEmail || requestData.contactPhone),
          ...requestData.metadata,
        }
      );
    }

    // Log API metrics
    await logApiMetrics({
      endpoint: '/api/leads/create',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      cacheHit: false,
      userAgent,
      ipAddress,
    });

    const response: LeadCreateResponse = {
      success: true,
      leadId: result.leadId,
      score: result.score,
      status: result.status,
      recommendations: result.recommendations,
      message: 'Lead captured successfully'
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });

  } catch (error) {
    console.error('Lead creation failed:', error);

    // Log error metrics
    await logApiMetrics({
      endpoint: '/api/leads/create',
      method: 'POST',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      cacheHit: false,
      errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
    });

    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process lead. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Validate lead data
 */
function validateLeadData(data: LeadCreateRequest): {
  valid: boolean;
  message?: string;
  errors?: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!data.zipCode) {
    errors.push('zipCode is required');
  } else if (!/^\d{5}(-\d{4})?$/.test(data.zipCode)) {
    errors.push('zipCode must be a valid US ZIP code');
  }

  // Optional field validation
  if (data.monthlyUsage !== undefined) {
    if (typeof data.monthlyUsage !== 'number' || data.monthlyUsage < 0 || data.monthlyUsage > 10000) {
      errors.push('monthlyUsage must be a number between 0 and 10000');
    }
  }

  if (data.currentRate !== undefined) {
    if (typeof data.currentRate !== 'number' || data.currentRate < 0 || data.currentRate > 1) {
      errors.push('currentRate must be a number between 0 and 1 (dollars per kWh)');
    }
  }

  if (data.preferredContractLength !== undefined) {
    if (![6, 12, 18, 24, 36].includes(data.preferredContractLength)) {
      errors.push('preferredContractLength must be 6, 12, 18, 24, or 36 months');
    }
  }

  if (data.contactEmail && !isValidEmail(data.contactEmail)) {
    errors.push('contactEmail must be a valid email address');
  }

  if (data.contactPhone && !isValidPhone(data.contactPhone)) {
    errors.push('contactPhone must be a valid phone number');
  }

  // At least one contact method should be provided for qualified leads
  if (!data.contactEmail && !data.contactPhone) {
    // This is not an error, but it affects lead quality
    // The lead management service will handle this in scoring
  }

  return {
    valid: errors.length === 0,
    message: errors.length > 0 ? 'Validation failed' : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Phone validation (US formats)
 */
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Log API metrics for monitoring
 */
async function logApiMetrics(metrics: {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  cacheHit: boolean;
  errorType?: string;
  userAgent?: string;
  ipAddress?: string;
}): Promise<void> {
  try {
    // This would integrate with your metrics system
    console.log('API Metrics:', {
      timestamp: new Date().toISOString(),
      ...metrics
    });
    
    // Store in analytics service or database
    // await analyticsService.recordApiMetric(metrics);
  } catch (error) {
    console.error('Failed to log API metrics:', error);
  }
}