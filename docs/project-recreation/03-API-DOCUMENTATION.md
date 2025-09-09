# API Documentation & Service Specifications

**Document**: Complete API Implementation Guide  
**Version**: 1.0  
**Date**: 2025-09-09  

## API Architecture Overview

The ChooseMyPower platform uses **36 serverless API endpoints** built on Astro's server-side rendering with Netlify Functions. All APIs follow RESTful principles with standardized JSON responses and comprehensive error handling.

### **API Categories**
1. **Plan Management APIs** (8 endpoints) - Plan search, comparison, filtering
2. **Location & Validation APIs** (12 endpoints) - ZIP, address, ESID validation
3. **Search & Discovery APIs** (6 endpoints) - Faceted search, autocomplete
4. **System & Health APIs** (5 endpoints) - Monitoring, health checks
5. **Analytics & Tracking APIs** (3 endpoints) - User interaction tracking
6. **Utility APIs** (2 endpoints) - Cache management, bulk operations

## Standard API Response Format

### **Success Response**
```typescript
interface APIResponse<T> {
  success: true;
  data: T;
  metadata: {
    timestamp: string;
    requestId: string;
    performance: {
      responseTime: number;
      source: 'database' | 'cache' | 'api' | 'json';
    };
  };
}
```

### **Error Response**
```typescript
interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}
```

## External API Integration (ComparePower & ERCOT)

### **ComparePower Pricing API Integration**
The application integrates with ComparePower's official APIs for real electricity plan data.

#### **Base Configuration**
```typescript
// ComparePower API endpoints
const COMPAREPOWER_ENDPOINTS = {
  pricing: 'https://pricing.api.comparepower.com/api/plans/current',
  ercot: 'https://ercot.api.comparepower.com/api/esiids'
};

// TDSP DUNS mapping (Texas utility territories)
const TDSP_DUNS_MAPPING = {
  'oncor': '103994067400',      // Oncor Electric Delivery (Dallas area)
  'centerpoint': '035717006',   // CenterPoint Energy (Houston area)  
  'aep_central': '828892001',   // AEP Texas Central
  'aep_north': '828892002',     // AEP Texas North
  'tnmp': '175533569'           // Texas-New Mexico Power
};
```

#### **1. Plan Data API (ComparePower Pricing)**
**External Endpoint**: `https://pricing.api.comparepower.com/api/plans/current`  
**Purpose**: Fetch current electricity plans for a specific utility territory  
**Integration**: `/api/plans/current`

```typescript
// Example ComparePower API call for ZIP 75205 (Oncor territory)
GET https://pricing.api.comparepower.com/api/plans/current?group=default&tdsp_duns=103994067400&display_usage=1000

// Optional filters can be added:
// &term=12                    // 12-month plans only
// &percent_green=100          // 100% green energy plans
// &is_pre_pay=false          // Exclude prepaid plans
// &brand_id=123              // Specific provider
// &requires_auto_pay=false   // Exclude auto-pay required plans

// Response format (ComparePower API)
{
  "plans": [
    {
      "id": "cp_plan_123456",
      "name": "Cash Money 12",
      "brand": {
        "id": "brand_456", 
        "name": "4Change Energy"
      },
      "term": 12,
      "rate_1000_kwh": 12.5,
      "percent_green": 0,
      "is_pre_pay": false,
      "monthly_fee": 0,
      "early_termination_fee": 150
    }
  ],
  "meta": {
    "total": 45,
    "tdsp_duns": "103994067400"
  }
}
```

#### **Our API Wrapper Implementation**
```typescript
// src/pages/api/plans/current.ts
export const GET: APIRoute = async ({ url }) => {
  const searchParams = new URL(url).searchParams;
  const zipCode = searchParams.get('zip_code');
  const term = searchParams.get('term');
  const percentGreen = searchParams.get('percent_green');
  
  // Get TDSP DUNS from ZIP code
  const tdspDuns = await getTdspDunsFromZip(zipCode);
  
  // Build ComparePower API request
  const comparePowerParams = new URLSearchParams({
    group: 'default',
    tdsp_duns: tdspDuns,
    display_usage: '1000'
  });
  
  // Add optional filters
  if (term) comparePowerParams.append('term', term);
  if (percentGreen) comparePowerParams.append('percent_green', percentGreen);
  
  // Call ComparePower API
  const response = await fetch(
    `${COMPAREPOWER_ENDPOINTS.pricing}?${comparePowerParams}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.COMPAREPOWER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const planData = await response.json();
  
  // Transform to our internal format with dynamic MongoDB ObjectIds
  const transformedPlans = planData.plans.map(plan => ({
    id: generateDynamicPlanId(plan), // Generate dynamic ObjectId
    name: plan.name,
    provider: {
      name: plan.brand.name,
      id: plan.brand.id
    },
    pricing: {
      rate1000kWh: plan.rate_1000_kwh,
      monthlyFee: plan.monthly_fee
    },
    contract: {
      lengthMonths: plan.term,
      type: 'fixed', // Determine from plan data
      cancellationFee: plan.early_termination_fee
    },
    features: extractPlanFeatures(plan),
    // CRITICAL: Store ComparePower plan ID for ordering
    externalPlanId: plan.id
  }));
  
  return new Response(JSON.stringify({
    success: true,
    data: transformedPlans,
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'comparepower_api',
      tdspDuns: tdspDuns,
      totalPlans: planData.meta.total
    }
  }));
};
```

## Plan Management APIs

### **1. Plan Search API**
**Endpoint**: `GET /api/plans/search`  
**Purpose**: Dynamic plan ID resolution for ComparePower ordering  
**Critical**: Constitutional requirement - never return hardcoded plan IDs

```typescript
// Request
GET /api/plans/search?name=Cash%20Money%2012&provider=4Change%20Energy&city=dallas

// Response
{
  "success": true,
  "data": [
    {
      "id": "68b4f12d8e9c4a5b2f3e6d8a9", // MongoDB ObjectId (dynamic)
      "name": "Cash Money 12",
      "provider": "4Change Energy",
      "rate": 12.5,
      "termLength": 12,
      "externalPlanId": "cp_plan_123456" // ComparePower plan ID for ordering
    }
  ],
  "metadata": {
    "timestamp": "2025-09-09T12:00:00Z",
    "requestId": "req_abc123",
    "performance": {
      "responseTime": 145,
      "source": "database"
    }
  }
}
```

**Implementation**:
```typescript
export const GET: APIRoute = async ({ url, request }) => {
  const searchParams = new URL(url).searchParams;
  const name = searchParams.get('name');
  const provider = searchParams.get('provider');
  const city = searchParams.get('city') || extractCityFromReferer(request);

  // Database-first approach with JSON fallback
  const hasDbPlans = await hasPlansInDatabase();
  
  let matchedPlan;
  if (hasDbPlans) {
    matchedPlan = await findPlanByNameAndProviderDB(name, provider, city);
  } else {
    matchedPlan = await findPlanByNameAndProvider(name, provider, city);
  }

  return formatAPIResponse(matchedPlan);
};
```

### **2. Plan Filter API**
**Endpoint**: `POST /api/plans/filter`  
**Purpose**: Multi-dimensional plan filtering with faceted navigation

```typescript
// Request
POST /api/plans/filter
{
  "city": "dallas",
  "filters": {
    "contractLength": [12, 24],
    "rateType": ["fixed"],
    "greenEnergy": true,
    "providers": ["TXU Energy", "Direct Energy"]
  },
  "sorting": {
    "field": "rate",
    "direction": "asc"
  },
  "pagination": {
    "page": 1,
    "limit": 20
  }
}

// Response
{
  "success": true,
  "data": {
    "plans": [...],
    "totalCount": 45,
    "facets": {
      "contractLengths": [6, 12, 24, 36],
      "rateTypes": ["fixed", "variable"],
      "providers": ["TXU Energy", "Direct Energy", "..."],
      "averageRates": {
        "fixed_12_month": 11.2,
        "variable": 12.8
      }
    }
  }
}
```

### **3. Plan Comparison API**
**Endpoint**: `POST /api/plans/compare`  
**Purpose**: Side-by-side plan comparison with detailed metrics

```typescript
// Request
POST /api/plans/compare
{
  "planIds": ["68b4f12d...", "68b4f12e...", "68b4f12f..."],
  "usageProfile": {
    "monthlyKwh": 1000,
    "usagePattern": "residential"
  }
}

// Response - Detailed comparison with calculated costs
{
  "success": true,
  "data": {
    "comparison": [
      {
        "planId": "68b4f12d...",
        "name": "Cash Money 12",
        "provider": "4Change Energy",
        "calculations": {
          "monthlyBill": 125.50,
          "annualCost": 1506.00,
          "savings": 0 // baseline
        },
        "features": ["fixed_rate", "no_deposit"],
        "ratings": {
          "overall": 4.2,
          "customerService": 4.0,
          "billing": 4.5
        }
      }
    ]
  }
}
```

## Location & Validation APIs

### **4. ZIP Code Validation API**
**Endpoint**: `POST /api/zip/validate`  
**Purpose**: ZIP code validation with TDSP territory mapping

```typescript
// Request
POST /api/zip/validate
{
  "zipCode": "75201",
  "source": "user_input" // or "geolocation"
}

// Response
{
  "success": true,
  "data": {
    "zipCode": "75201",
    "isValid": true,
    "city": {
      "name": "Dallas",
      "slug": "dallas",
      "state": "TX"
    },
    "tdsp": {
      "name": "Oncor Electric Delivery",
      "duns": "007738114",
      "serviceTerritory": "North Texas"
    },
    "isDeregulated": true,
    "availablePlansCount": 156
  }
}
```

### **2. ERCOT ESID Lookup API (ComparePower Integration)**
**External Endpoint**: `https://ercot.api.comparepower.com/api/esiids`  
**Purpose**: Search and validate Electric Service Identifiers via ERCOT  
**Integration**: `/api/ercot/lookup` and `/api/ercot/validate`

#### **Address Search for ESIDs**
```typescript
// ComparePower ERCOT API call (as user types address)
GET https://ercot.api.comparepower.com/api/esiids?address=123%20Main%20St&zip_code=75205

// Response format (ComparePower ERCOT API)
{
  "esiids": [
    {
      "esiid": "10750500123456789",
      "service_address": "123 MAIN ST",
      "city": "DALLAS", 
      "state": "TX",
      "zip_code": "75205",
      "tdsp_code": "ONCR",
      "tdsp_name": "Oncor Electric Delivery",
      "premise_type": "RESIDENTIAL",
      "meter_status": "ACTIVE"
    },
    {
      "esiid": "10750500123456790", 
      "service_address": "123 MAIN ST APT 1",
      "city": "DALLAS",
      "state": "TX", 
      "zip_code": "75205",
      "tdsp_code": "ONCR",
      "tdsp_name": "Oncor Electric Delivery",
      "premise_type": "RESIDENTIAL",
      "meter_status": "ACTIVE"
    }
  ]
}

// Our API wrapper for ESID search
// GET /api/ercot/lookup?address=123%20Main%20St&zip_code=75205
export const GET: APIRoute = async ({ url }) => {
  const searchParams = new URL(url).searchParams;
  const address = searchParams.get('address');
  const zipCode = searchParams.get('zip_code');
  
  // Call ComparePower ERCOT API
  const ercotResponse = await fetch(
    `https://ercot.api.comparepower.com/api/esiids?` + 
    new URLSearchParams({ address, zip_code: zipCode }),
    {
      headers: {
        'Authorization': `Bearer ${process.env.COMPAREPOWER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const ercotData = await ercotResponse.json();
  
  // Transform to our format
  const transformedESIIDs = ercotData.esiids.map(esid => ({
    esiid: esid.esiid,
    serviceAddress: {
      street: esid.service_address,
      city: esid.city,
      state: esid.state,
      zipCode: esid.zip_code
    },
    tdsp: {
      code: esid.tdsp_code,
      name: esid.tdsp_name,
      duns: mapTdspCodeToDuns(esid.tdsp_code) // Convert ONCR -> 103994067400
    },
    premiseType: esid.premise_type,
    meterStatus: esid.meter_status,
    isActive: esid.meter_status === 'ACTIVE'
  }));
  
  return new Response(JSON.stringify({
    success: true,
    data: transformedESIIDs,
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'ercot_api',
      searchTerms: { address, zipCode }
    }
  }));
};
```

#### **ESID Details API**
```typescript
// Get specific ESID details
GET https://ercot.api.comparepower.com/api/esiids/10750500123456789

// Response format (ComparePower ERCOT API)
{
  "esiid": "10750500123456789",
  "service_address": "123 MAIN ST",
  "city": "DALLAS",
  "state": "TX", 
  "zip_code": "75205-1234",
  "tdsp_code": "ONCR",
  "tdsp_name": "Oncor Electric Delivery",
  "tdsp_duns": "103994067400",
  "premise_type": "RESIDENTIAL",
  "meter_status": "ACTIVE",
  "service_voltage": "120/240",
  "rate_class": "RESIDENTIAL_SECONDARY",
  "load_profile": "RESIDENTIAL"
}

// Our API wrapper for ESID details  
// GET /api/ercot/validate/{esiid}
export const GET: APIRoute = async ({ params }) => {
  const esiid = params.esiid;
  
  // Validate ESIID format
  if (!esiid || !esiid.match(/^1\d{16}$/)) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'INVALID_ESIID_FORMAT',
        message: 'ESIID must be 17 digits starting with 1'
      }
    }), { status: 400 });
  }
  
  // Call ComparePower ERCOT API
  const ercotResponse = await fetch(
    `https://ercot.api.comparepower.com/api/esiids/${esiid}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.COMPAREPOWER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!ercotResponse.ok) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'ESIID_NOT_FOUND',
        message: 'ESIID not found in ERCOT system'
      }
    }), { status: 404 });
  }
  
  const ercotData = await ercotResponse.json();
  
  return new Response(JSON.stringify({
    success: true,
    data: {
      esiid: ercotData.esiid,
      isValid: ercotData.meter_status === 'ACTIVE',
      serviceAddress: {
        street: ercotData.service_address,
        city: ercotData.city,
        state: ercotData.state,
        zipCode: ercotData.zip_code
      },
      tdsp: {
        code: ercotData.tdsp_code,
        name: ercotData.tdsp_name,
        duns: ercotData.tdsp_duns
      },
      premiseDetails: {
        type: ercotData.premise_type,
        voltage: ercotData.service_voltage,
        rateClass: ercotData.rate_class,
        loadProfile: ercotData.load_profile
      },
      meterStatus: ercotData.meter_status
    },
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'ercot_api'
    }
  }));
};
```

### **6. Address Validation API**  
**Endpoint**: `POST /api/address/validate`  
**Purpose**: USPS address standardization with suggestions

```typescript
// Request
POST /api/address/validate
{
  "address": {
    "street": "123 main street",
    "city": "dallas", 
    "state": "tx",
    "zipCode": "75201"
  },
  "strict": false // Allow suggestions for partial matches
}

// Response
{
  "success": true,
  "data": {
    "isValid": true,
    "standardized": {
      "street": "123 MAIN ST",
      "city": "DALLAS",
      "state": "TX",
      "zipCode": "75201-1234"
    },
    "suggestions": [], // Empty for exact matches
    "confidence": "high", // high, medium, low
    "uspsValidation": {
      "deliverable": true,
      "residential": true
    }
  }
}
```

## Search & Discovery APIs

### **7. Faceted Search API**
**Endpoint**: `GET /api/search/faceted`  
**Purpose**: Multi-dimensional search with real-time filtering

```typescript
// Request
GET /api/search/faceted?q=green energy&city=houston&filters=fixed,12month

// Response
{
  "success": true,
  "data": {
    "results": [...],
    "totalCount": 23,
    "facets": {
      "providers": [
        { "name": "Green Mountain Energy", "count": 8, "checked": false },
        { "name": "Renewable Choice Energy", "count": 6, "checked": false }
      ],
      "contractLengths": [
        { "length": 12, "count": 15, "checked": true },
        { "length": 24, "count": 8, "checked": false }
      ],
      "rateTypes": [
        { "type": "fixed", "count": 20, "checked": true },
        { "type": "variable", "count": 3, "checked": false }
      ]
    },
    "searchMetadata": {
      "query": "green energy",
      "searchTime": 45,
      "filterCount": 2
    }
  }
}
```

### **8. Autocomplete API**
**Endpoint**: `GET /api/search/autocomplete`  
**Purpose**: Search suggestions for plans, providers, and cities

```typescript
// Request
GET /api/search/autocomplete?q=direct&type=providers&city=dallas

// Response
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "text": "Direct Energy",
        "type": "provider",
        "planCount": 12,
        "avgRate": 11.5
      },
      {
        "text": "Direct Energy Power-To-Go 12",
        "type": "plan",
        "provider": "Direct Energy",
        "rate": 11.2
      }
    ],
    "metadata": {
      "query": "direct",
      "resultCount": 2,
      "searchTime": 23
    }
  }
}
```

## System & Health APIs

### **9. System Health API**
**Endpoint**: `GET /api/health/system`  
**Purpose**: Comprehensive system health monitoring

```typescript
// Response
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-09-09T12:00:00Z",
    "services": {
      "database": {
        "status": "healthy",
        "responseTime": 45,
        "connections": { "active": 3, "max": 10 }
      },
      "redis": {
        "status": "healthy", 
        "responseTime": 12,
        "memory": "125MB",
        "hitRate": "87%"
      },
      "apis": {
        "comparepower": { "status": "healthy", "lastCheck": "2025-09-09T11:59:30Z" },
        "ercot": { "status": "healthy", "lastCheck": "2025-09-09T11:59:45Z" }
      }
    },
    "performance": {
      "averageResponseTime": 234,
      "requestsPerMinute": 45,
      "errorRate": "0.2%"
    }
  }
}
```

### **10. Database Health API**
**Endpoint**: `GET /api/health/database`  
**Purpose**: Database connectivity and performance monitoring

```typescript
// Response
{
  "success": true,
  "data": {
    "connectionStatus": "connected",
    "responseTime": 45,
    "connectionPool": {
      "active": 3,
      "idle": 2,
      "max": 10
    },
    "queries": {
      "slowQueries": 0,
      "avgQueryTime": 25,
      "totalQueries": 1250
    },
    "dataFreshness": {
      "plans": { "lastUpdate": "2025-09-09T08:00:00Z", "recordCount": 3420 },
      "providers": { "lastUpdate": "2025-09-09T08:00:00Z", "recordCount": 45 },
      "cities": { "lastUpdate": "2025-09-09T08:00:00Z", "recordCount": 881 }
    }
  }
}
```

## Analytics & Tracking APIs

### **11. Form Interaction API**
**Endpoint**: `POST /api/analytics/form-interaction`  
**Purpose**: Track user interactions for optimization

```typescript
// Request
POST /api/analytics/form-interaction
{
  "event": "zip_lookup_submitted",
  "data": {
    "zipCode": "75201",
    "source": "homepage_hero",
    "timestamp": "2025-09-09T12:00:00Z",
    "sessionId": "session_abc123"
  },
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "deviceType": "mobile",
    "referrer": "https://google.com/search?q=electricity+plans+dallas"
  }
}

// Response
{
  "success": true,
  "data": {
    "eventId": "evt_def456",
    "recorded": true
  }
}
```

## Implementation Patterns

### **Database-First Pattern**
```typescript
// Standard implementation pattern for all APIs
export const GET: APIRoute = async ({ params, url, request }) => {
  const startTime = performance.now();
  
  try {
    // Input validation with Zod
    const validatedInput = APISchema.parse(getRequestParams(url));
    
    // Database-first approach with fallbacks
    const hasDatabase = await checkDatabaseHealth();
    
    let data;
    if (hasDatabase) {
      data = await getDatabaseData(validatedInput);
    } else {
      console.warn('[API] Falling back to JSON data');
      data = await getJSONData(validatedInput);
    }
    
    // Cache successful results
    await cacheResult(data, validatedInput);
    
    return formatSuccessResponse(data, {
      responseTime: performance.now() - startTime,
      source: hasDatabase ? 'database' : 'json'
    });
    
  } catch (error) {
    return formatErrorResponse(error);
  }
};
```

### **Error Handling Standards**
```typescript
// Standardized error codes
export const API_ERROR_CODES = {
  // Client errors (4xx)
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // Server errors (5xx)  
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  
  // Business logic errors
  PLAN_NOT_AVAILABLE: 'PLAN_NOT_AVAILABLE',
  INVALID_ESID: 'INVALID_ESID',
  UNSUPPORTED_LOCATION: 'UNSUPPORTED_LOCATION'
};

export function formatErrorResponse(error: any): Response {
  const errorCode = mapErrorToCode(error);
  
  return new Response(JSON.stringify({
    success: false,
    error: {
      code: errorCode,
      message: getErrorMessage(errorCode),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  }), {
    status: getStatusCodeForError(errorCode),
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### **Performance Monitoring**
```typescript
// Built-in performance tracking for all APIs
export class APIPerformanceTracker {
  static async trackRequest(
    endpoint: string, 
    handler: () => Promise<Response>
  ): Promise<Response> {
    const startTime = performance.now();
    
    try {
      const response = await handler();
      const responseTime = performance.now() - startTime;
      
      // Log performance metrics
      console.log(`[PERF] ${endpoint}: ${responseTime.toFixed(2)}ms`);
      
      // Alert on slow responses
      if (responseTime > 1000) {
        console.warn(`[PERF] Slow response detected: ${endpoint}`);
      }
      
      return response;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      console.error(`[PERF] Error in ${endpoint} after ${responseTime.toFixed(2)}ms:`, error);
      throw error;
    }
  }
}
```

## Testing Requirements

### **API Testing Standards**
- **Unit Tests**: All API endpoints must have >90% test coverage
- **Integration Tests**: Database and external API integration testing
- **Contract Tests**: API response format validation
- **Performance Tests**: Response time under load testing
- **Security Tests**: Input validation and injection attack testing

### **Test Implementation Example**
```typescript
// tests/api/plans/search.test.ts
import { describe, it, expect } from 'vitest';
import { GET } from '../../../src/pages/api/plans/search.ts';

describe('/api/plans/search', () => {
  it('should return plan with valid MongoDB ObjectId', async () => {
    const response = await GET({
      url: new URL('http://localhost/api/plans/search?name=Cash%20Money%2012&provider=4Change%20Energy&city=dallas'),
      request: new Request('http://localhost')
    });
    
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data[0].id).toMatch(/^[0-9a-f]{24}$/); // MongoDB ObjectId format
    expect(data.data[0].name).toBe('Cash Money 12');
    expect(data.metadata.performance.responseTime).toBeLessThan(500);
  });
  
  it('should never return hardcoded plan IDs', async () => {
    // Constitutional requirement test
    const response = await GET(/* ... */);
    const data = await response.json();
    
    // Ensure plan ID is not hardcoded
    expect(data.data[0].id).not.toMatch(/^68b[0-9a-f]{21}$/);
  });
});
```

This API documentation provides the complete specification for implementing all 36 serverless endpoints with proper error handling, performance monitoring, and security measures required for the ChooseMyPower platform.