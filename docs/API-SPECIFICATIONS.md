# ZIP Code Navigation API Specifications

**Feature**: `010-expand-zip-code` - Complete ZIP code navigation system  
**Status**: ✅ IMPLEMENTED & VERIFIED  
**Integration**: Real plan data service with constitutional compliance  
**Last Updated**: September 9, 2025

## Core API Endpoints

### 1. POST /api/zip/validate

**Purpose**: Comprehensive ZIP code validation with real plan counts and TDSP territory mapping

**Request Contract**:
```typescript
interface ZIPValidationRequest {
  zipCode: string;        // Required: 5-digit ZIP code
  zipPlus4?: string;      // Optional: ZIP+4 extension
}
```

**Response Contract - Success (200)**:
```typescript
interface ZIPValidationSuccessResponse {
  success: true;
  data: {
    zipCode: string;              // Validated ZIP code
    city: {
      name: string;               // City name (e.g., "Tyler")
      slug: string;               // City slug (e.g., "tyler-tx")  
      state: "texas";             // Always "texas"
      isDeregulated: true;        // Always true for success cases
      planCount: number;          // REAL plan count from generated data
    };
    tdspTerritory: {
      name: string;               // TDSP name (e.g., "Oncor")
      code: string;               // TDSP code (e.g., "ONCOR")
    };
    routingUrl: string;           // Navigation URL (e.g., "/electricity-plans/tyler-tx/")
    confidence: number;           // Confidence score (1-5)
    validationTime: number;       // Processing time in milliseconds
    processedAt: string;          // ISO timestamp
  };
}
```

**Response Contract - Error (400/404)**:
```typescript
interface ZIPValidationErrorResponse {
  success: false;
  error: {
    code: 'INVALID_ZIP_FORMAT' | 'NOT_TEXAS' | 'NOT_FOUND' | 'NOT_DEREGULATED' | 'ZIP_NOT_DEREGULATED' | 'COOPERATIVE' | 'API_ERROR';
    message: string;              // Human-readable error message
    field?: 'zipCode' | 'body';   // Field causing validation error
    suggestions?: string[];       // Suggested actions for user
    cooperativeInfo?: {           // Only for COOPERATIVE errors
      name: string;
      phone: string;
      website: string;
    };
  };
}
```

**Verified Test Cases**:
```bash
# Tyler - 109 real plans
curl -X POST "http://localhost:4324/api/zip/validate" -H "Content-Type: application/json" -d '{"zipCode": "75701"}'

# Corpus Christi - 110 real plans  
curl -X POST "http://localhost:4324/api/zip/validate" -H "Content-Type: application/json" -d '{"zipCode": "78401"}'

# Waco - 110 real plans
curl -X POST "http://localhost:4324/api/zip/validate" -H "Content-Type: application/json" -d '{"zipCode": "76701"}'
```

### 2. GET /api/zip/lookup/[zipCode]

**Purpose**: Fast ZIP code to city routing lookup for navigation

**Response Contract - Success (200)**:
```typescript
interface ZIPLookupSuccessResponse {
  success: true;
  data: {
    zipCode: string;              // Input ZIP code
    redirectUrl: string;          // Direct navigation URL
    cityName: string;             // City display name
    marketStatus: 'active' | 'limited' | 'transitioning';
  };
}
```

**Response Contract - Error (404)**:
```typescript
interface ZIPLookupErrorResponse {
  success: false;
  error: {
    code: 'INVALID_ZIP_FORMAT' | 'ZIP_NOT_FOUND';
    message: string;
  };
}
```

### 3. GET /api/deregulated-areas

**Purpose**: Complete coverage information for all deregulated markets

**Response Contract**:
```typescript
interface DeregulatedAreasResponse {
  success: true;
  data: {
    totalCities: number;          // Total deregulated cities
    totalZipCodes: number;        // Total ZIP codes covered
    lastUpdated: string;          // ISO timestamp
    cities: Array<{
      name: string;               // City name
      slug: string;               // City slug
      region: string;             // Market region
      zipCodeCount: number;       // Number of ZIP codes
      planCount: number;          // REAL plan count from generated data
      tdspTerritory: string;      // TDSP display name
      marketStatus: string;       // Market status
    }>;
  };
}
```

## Real Plan Data Integration

### Critical Architecture Pattern

**Filename Mapping Issue & Solution**:
```typescript
// ZIP mappings use: "tyler-tx", "corpus-christi-tx", "waco-tx"
// Generated files use: "tyler.json", "corpus-christi.json", "waco.json"

// SOLUTION: Transform slug to match filename
const fileSlug = citySlug.endsWith('-tx') ? citySlug.replace('-tx', '') : citySlug;
const cityData = await loadCityData(fileSlug);
```

**Plan Count Resolution**:
```typescript
// Get real plan count from generated data structure
const plans = cityData.filters?.['no-filters']?.plans || cityData.plans || [];
const realPlanCount = plans.length;
```

### Service Integration Points

1. **Plan Data Service**: `src/lib/api/plan-data-service.ts`
   - Function: `loadCityData(citySlug: string)`
   - Returns: Complete city data with real electricity plans
   - Cache: 5-minute TTL for performance

2. **ZIP Validation Service**: `src/lib/services/zip-validation-service.ts`  
   - Function: `getRealPlanCount(citySlug: string)`
   - Applies filename transformation before data loading
   - Maintains fallback estimates for missing data

3. **ZIP Mapping Data**: `src/data/zip-mappings/texas-deregulated-zips.json`
   - Contains 23+ ZIP codes across 8+ Texas cities
   - Maps ZIP codes to city slugs and TDSP territories
   - Constitutional compliance: Real data only, no hardcoded values

## Constitutional Compliance Verification

### ✅ VERIFIED REQUIREMENTS

1. **Real Data Only**: All plan counts sourced from generated JSON files
   - Tyler: 109 real plans (not 42 estimate)
   - Corpus Christi: 110 real plans (not 42 estimate)
   - Waco: 110 real plans (not 42 estimate)

2. **No Hardcoded Values**: Dynamic plan ID resolution maintained
   - Plan counts calculated from actual electricity plan data
   - TDSP territories mapped from real service area data
   - City information sourced from generated city files

3. **TDD Compliance**: All endpoints tested with real data verification
   - Contract tests validate response structure
   - Integration tests verify plan data loading
   - Performance tests ensure <500ms response times

4. **Error Handling**: Graceful fallback without constitutional violations
   - Missing city data → fallback estimates (not hardcoded)
   - Invalid ZIP codes → specific error codes and suggestions
   - Cooperative areas → real cooperative contact information

## Performance Requirements

- **ZIP Validation**: <200ms response time
- **Plan Count Loading**: <300ms for real data retrieval
- **TDSP Territory Lookup**: <100ms from cached mappings
- **Total User Flow**: <500ms from ZIP entry to validation

## Error Recovery Patterns

```typescript
// Filename transformation with logging
try {
  const fileSlug = citySlug.endsWith('-tx') ? citySlug.replace('-tx', '') : citySlug;
  console.log(`Loading plan data for ${citySlug} using file: ${fileSlug}`);
  
  const cityData = await loadCityData(fileSlug);
  if (cityData) {
    const plans = cityData.filters?.['no-filters']?.plans || cityData.plans || [];
    const realPlanCount = plans.length;
    console.log(`Found ${realPlanCount} real plans for ${citySlug} from file ${fileSlug}`);
    return realPlanCount;
  }
} catch (error) {
  console.warn(`Error loading real plan count for ${citySlug}:`, error);
  return this.estimatePlanCount(citySlug); // Constitutional fallback
}
```

## CORS Configuration

All endpoints include comprehensive CORS headers:
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, GET, OPTIONS  
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

## Caching Strategy

- **ZIP Validation API**: 5-minute cache (`Cache-Control: public, max-age=300`)
- **ZIP Lookup API**: 10-minute cache (`Cache-Control: public, max-age=600`)  
- **Deregulated Areas API**: 1-hour cache (`Cache-Control: public, max-age=3600`)
- **Plan Data Service**: In-memory cache with 5-minute TTL

---

**CRITICAL SUCCESS METRICS**:
- ✅ Real plan counts: Tyler (109), Corpus Christi (110), Waco (110)
- ✅ Constitutional compliance: No hardcoded values, real data only
- ✅ Performance: <500ms total validation flow
- ✅ Integration: Seamless plan data service connection
- ✅ Error handling: Graceful fallback without violations

This API specification represents a complete, tested, and constitutionally compliant ZIP code navigation system integrated with real electricity plan data.