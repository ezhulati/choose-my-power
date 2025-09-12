/**
 * Usage Examples for Electricity Plans Type System
 * 
 * This file demonstrates how to use the comprehensive type definitions
 * and validation schemas for the enterprise ZIP code search system.
 */

import {
  // Validation schemas
  TexasZipCodeSchema,
  AddressSchema,
  ApiParamsSchema,
  ESIIDSearchParamsSchema,
  ZipSearchRequestSchema,
  
  // Type interfaces
  type Address,
  type ApiParams,
  type ESIIDSearchParams,
  type ZipSearchRequest,
  type ZipSearchResponse,
  type TdspInfo,
  type ElectricityPlan,
  
  // Utility functions
  validateZipCode,
  validateTexasZipCode,
  validateAddress,
  getTdspFromZip,
  isDeregulatedZip,
  getZipCodesForTdsp,
  
  // Constants and mappings
  COMPREHENSIVE_ZIP_TDSP_MAPPING,
  VALIDATION_CONSTANTS,
} from './electricity-plans';

// ============================================================================
// EXAMPLE 1: ZIP CODE VALIDATION
// ============================================================================

/**
 * Example: Validate ZIP codes with comprehensive error handling
 */
function exampleZipCodeValidation() {
  
  const testZipCodes = ['75201', '77001', '78701', '90210', 'invalid', '75201-1234'];
  
  testZipCodes.forEach(zip => {
    const isValid = validateZipCode(zip);
    const isTexasValid = validateTexasZipCode(zip);
    const isDeregulated = isDeregulatedZip(zip);
    
      validFormat: isValid,
      texasZip: isTexasValid,
      deregulated: isDeregulated,
    });
  });
}

// ============================================================================
// EXAMPLE 2: ADDRESS VALIDATION AND NORMALIZATION
// ============================================================================

/**
 * Example: Validate and process addresses for ESIID lookup
 */
function exampleAddressValidation() {
  
  const testAddresses = [
    // Valid address
    {
      street: '123 Main St',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75201',
    },
    // Address with unit
    {
      street: '456 Oak Avenue',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      unitNumber: 'Apt 2B',
    },
    // Invalid address (street too short)
    {
      street: '123',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
    },
  ] as Address[];
  
  testAddresses.forEach((address, index) => {
    const validation = AddressSchema.safeParse(address);
      valid: validation.success,
      address: validation.success ? validation.data : 'Invalid',
      errors: validation.success ? [] : validation.error.errors,
    });
  });
}

// ============================================================================
// EXAMPLE 3: TDSP RESOLUTION
// ============================================================================

/**
 * Example: Resolve ZIP codes to TDSP information
 */
function exampleTdspResolution() {
  
  const testZips = ['75201', '77001', '78701', '78401', '79601'];
  
  testZips.forEach(zip => {
    const tdspInfo = getTdspFromZip(zip);
    const zipCodesInSameTdsp = tdspInfo ? getZipCodesForTdsp(tdspInfo.duns).length : 0;
    
      tdsp: tdspInfo?.name || 'Not found',
      zone: tdspInfo?.zone || 'Unknown',
      duns: tdspInfo?.duns || 'N/A',
      totalZipsInTdsp: zipCodesInSameTdsp,
    });
  });
}

// ============================================================================
// EXAMPLE 4: API PARAMETER VALIDATION
// ============================================================================

/**
 * Example: Validate API parameters before making requests
 */
function exampleApiParameterValidation() {
  
  const testApiParams = [
    // Valid parameters
    {
      tdsp_duns: '1039940674000',
      term: 12,
      display_usage: 1000,
      percent_green: 50,
    },
    // Invalid term
    {
      tdsp_duns: '1039940674000',
      term: 13, // Invalid term
      display_usage: 1000,
    },
    // Invalid DUNS
    {
      tdsp_duns: 'invalid',
      display_usage: 1000,
    },
  ];
  
  testApiParams.forEach((params, index) => {
    const validation = ApiParamsSchema.safeParse(params);
      valid: validation.success,
      params: validation.success ? validation.data : 'Invalid',
      errors: validation.success ? [] : validation.error.errors.map(e => e.message),
    });
  });
}

// ============================================================================
// EXAMPLE 5: ESIID SEARCH PARAMETERS
// ============================================================================

/**
 * Example: Validate ESIID search parameters
 */
function exampleESIIDSearchValidation() {
  
  const testSearchParams = [
    // Valid search
    {
      address: '123 Main St',
      zip_code: '75201',
    },
    // Invalid address (too short)
    {
      address: '123',
      zip_code: '75201',
    },
    // Invalid ZIP code
    {
      address: '123 Main St',
      zip_code: '90210',
    },
  ];
  
  testSearchParams.forEach((params, index) => {
    const validation = ESIIDSearchParamsSchema.safeParse(params);
      valid: validation.success,
      params: validation.success ? validation.data : 'Invalid',
      errors: validation.success ? [] : validation.error.errors.map(e => e.message),
    });
  });
}

// ============================================================================
// EXAMPLE 6: COMPREHENSIVE ZIP SEARCH REQUEST
// ============================================================================

/**
 * Example: Create and validate complete ZIP search requests
 */
function exampleZipSearchRequest() {
  
  const searchRequests = [
    // Basic search
    {
      zipCode: '75201',
      displayUsage: 1000,
    },
    // Search with address for precise TDSP resolution
    {
      zipCode: '75001', // Boundary ZIP that may need address validation
      address: '123 Main St, Addison, TX',
      displayUsage: 1200,
      sessionId: 'user-session-123',
    },
    // Invalid usage
    {
      zipCode: '75201',
      displayUsage: 10000, // Too high
    },
  ];
  
  searchRequests.forEach((request, index) => {
    const validation = ZipSearchRequestSchema.safeParse(request);
      valid: validation.success,
      request: validation.success ? validation.data : 'Invalid',
      errors: validation.success ? [] : validation.error.errors.map(e => e.message),
    });
  });
}

// ============================================================================
// EXAMPLE 7: TYPE-SAFE FUNCTION IMPLEMENTATIONS
// ============================================================================

/**
 * Example: Type-safe function that processes ZIP search requests
 */
async function processZipSearchRequest(request: ZipSearchRequest): Promise<ZipSearchResponse> {
  // Validate input (already typed, but we can double-check at runtime)
  const validatedRequest = ZipSearchRequestSchema.parse(request);
  
  // Get TDSP information
  const tdspInfo = getTdspFromZip(validatedRequest.zipCode);
  if (!tdspInfo) {
    return {
      success: false,
      plans: [],
      totalPlans: 0,
      metadata: {
        zipCode: validatedRequest.zipCode,
        searchTime: Date.now(),
        cacheHit: false,
        dataSource: 'fallback',
      },
      errors: [{
        type: 'ZIP_CODE_NOT_FOUND',
        message: `ZIP code ${validatedRequest.zipCode} is not in a deregulated Texas market`,
        userMessage: 'This ZIP code is not in a deregulated electricity market.',
        context: { zipCode: validatedRequest.zipCode },
        isRetryable: false,
        timestamp: new Date().toISOString(),
      }],
    };
  }
  
  // Mock response (in real implementation, would call API)
  return {
    success: true,
    tdsp: tdspInfo,
    plans: [], // Would be populated by actual API call
    totalPlans: 0,
    metadata: {
      zipCode: validatedRequest.zipCode,
      city: 'Mock City',
      zone: tdspInfo.zone,
      searchTime: Date.now(),
      cacheHit: false,
      dataSource: 'api',
    },
  };
}

/**
 * Example: Type-safe TDSP analytics function
 */
function analyzeTdspCoverage() {
  
  const tdspAnalysis = new Map<string, {
    name: string;
    zone: string;
    zipCount: number;
    sampleZips: string[];
  }>();
  
  // Analyze the comprehensive mapping
  Object.entries(COMPREHENSIVE_ZIP_TDSP_MAPPING).forEach(([zip, tdsp]) => {
    const key = tdsp.duns;
    if (!tdspAnalysis.has(key)) {
      tdspAnalysis.set(key, {
        name: tdsp.name,
        zone: tdsp.zone,
        zipCount: 0,
        sampleZips: [],
      });
    }
    
    const analysis = tdspAnalysis.get(key)!;
    analysis.zipCount++;
    if (analysis.sampleZips.length < 5) {
      analysis.sampleZips.push(zip);
    }
  });
  
  // Display analysis
  tdspAnalysis.forEach((analysis, duns) => {
      duns,
      zipCodes: analysis.zipCount,
      samples: analysis.sampleZips,
    });
  });
}

// ============================================================================
// RUN EXAMPLES
// ============================================================================

/**
 * Run all examples
 */
export function runElectricityPlansExamples() {
  
  exampleZipCodeValidation();
  exampleAddressValidation();
  exampleTdspResolution();
  exampleApiParameterValidation();
  exampleESIIDSearchValidation();
  exampleZipSearchRequest();
  analyzeTdspCoverage();
  
  // Test the type-safe function
  const sampleRequest: ZipSearchRequest = {
    zipCode: '75201',
    displayUsage: 1000,
  };
  
  processZipSearchRequest(sampleRequest).then(response => {
      success: response.success,
      tdsp: response.tdsp?.name,
      errors: response.errors?.length || 0,
    });
  });
  
}

// Only run examples if this file is executed directly
if (require.main === module) {
  runElectricityPlansExamples();
}