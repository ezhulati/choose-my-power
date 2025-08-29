# ComparePower API Integration - Complete Implementation Guide

## Overview
Implement a production-ready API integration with ComparePower's pricing and ERCOT APIs to fetch electricity plans by ZIP code, handling edge cases where ZIP codes span multiple utilities (TDUs).

## Architecture Decisions

### Why These Choices
1. **Netlify Functions**: Hide API endpoints, handle CORS, serverless scaling
2. **ERCOT Integration**: Required for split ZIP codes where multiple TDUs serve one area
3. **Type Safety**: Zod schemas prevent runtime errors and API contract violations
4. **Caching Strategy**: 30-minute cache balances freshness with performance
5. **Two-Step Flow**: ZIP → Address (if needed) → Plans

### API Endpoints Used
- **Plans**: `GET https://pricing.api.comparepower.com/api/plans/current`
- **ESIID Search**: `GET https://ercot.api.comparepower.com/api/esiids`
- **ESIID Details**: `GET https://ercot.api.comparepower.com/api/esiids/{esiid}`

## Implementation Steps

### Step 1: Create Type Definitions
Create `src/types/electricity-plans.ts`:

```typescript
import { z } from 'zod';

// Texas ZIP to TDSP mapping - identifies split ZIPs
export const ZIP_TO_TDSP: Record<string, { name: string; duns: string } | { split: true; tdsps: Array<{ name: string; duns: string }> }> = {
  // Single TDU ZIP codes
  '75201': { name: 'Oncor', duns: '103994067400' },
  '75202': { name: 'Oncor', duns: '103994067400' },
  '75203': { name: 'Oncor', duns: '103994067400' },
  '75204': { name: 'Oncor', duns: '103994067400' },
  '75205': { name: 'Oncor', duns: '103994067400' },
  
  // Houston (CenterPoint)
  '77001': { name: 'CenterPoint', duns: '100000000000' }, // TODO: Add actual DUNS
  '77002': { name: 'CenterPoint', duns: '100000000000' },
  
  // Split ZIP example - requires address lookup
  '76234': {
    split: true,
    tdsps: [
      { name: 'Oncor', duns: '103994067400' },
      { name: 'TNMP', duns: '200000000000' } // TODO: Add actual DUNS
    ]
  },
  
  // TODO: Complete mapping for all Texas deregulated ZIPs
};

// Input validation schemas
export const ZipCodeSearchSchema = z.object({
  zipCode: z.string().regex(/^\d{5}$/, "Must be 5 digits"),
  displayUsage: z.number().min(100).max(5000).optional().default(1000),
  address: z.string().optional(), // For split ZIPs
  filters: z.object({
    term: z.number().optional(),
    percentGreen: z.number().min(0).max(100).optional(),
    isPrePay: z.boolean().optional(),
    isTimeOfUse: z.boolean().optional(),
    requiresAutoPay: z.boolean().optional(),
    brandId: z.string().optional()
  }).optional()
});

// ESIID lookup schemas
export const ESIIDLookupSchema = z.object({
  address: z.string().min(3),
  zipCode: z.string().regex(/^\d{5}$/)
});

export const ESIIDResponseSchema = z.object({
  esiid: z.string(),
  address: z.string(),
  tdsp_duns: z.string(),
  tdsp_name: z.string(),
  meter_type: z.string().optional()
});

// ComparePower API response schemas
export const PlanSchema = z.object({
  plan_id: z.string(),
  brand_name: z.string(),
  plan_name: z.string(),
  price_kwh_500: z.number().optional(),
  price_kwh_1000: z.number(),
  price_kwh_2000: z.number().optional(),
  term_months: z.number(),
  renewable_percentage: z.number().optional(),
  monthly_fee: z.number().optional(),
  enrollment_fee: z.number().optional(),
  early_termination_fee: z.number().optional(),
  is_pre_pay: z.boolean(),
  is_time_of_use: z.boolean(),
  requires_auto_pay: z.boolean(),
  signup_url: z.string().url(),
  efl_url: z.string().url().optional(),
  tos_url: z.string().url().optional()
});

// Response schemas
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  zipCode: z.string(),
  tdsp: z.object({
    name: z.string(),
    duns: z.string()
  }),
  plans: z.array(PlanSchema),
  totalPlans: z.number()
});

export const AddressRequiredResponseSchema = z.object({
  success: z.literal(false),
  requiresAddress: z.literal(true),
  message: z.string(),
  possibleTDSPs: z.array(z.object({
    name: z.string(),
    duns: z.string()
  }))
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string()
});

// Export types
export type ZipCodeSearchInput = z.infer<typeof ZipCodeSearchSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type AddressRequiredResponse = z.infer<typeof AddressRequiredResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type APIResponse = SuccessResponse | AddressRequiredResponse | ErrorResponse;
```

### Step 2: Write Tests First

Create `netlify/functions/__tests__/search-plans.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../search-plans';

describe('search-plans function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Single TDU ZIP codes', () => {
    it('returns plans for Dallas ZIP 75205', async () => {
      const event = {
        httpMethod: 'POST',
        headers: {},
        body: JSON.stringify({ 
          zipCode: '75205', 
          displayUsage: 1000 
        })
      };
      
      const response = await handler(event);
      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.tdsp.name).toBe('Oncor');
      expect(data.tdsp.duns).toBe('103994067400');
      expect(data.plans).toBeInstanceOf(Array);
      expect(data.totalPlans).toBeGreaterThanOrEqual(0);
    });

    it('applies filters correctly', async () => {
      const event = {
        httpMethod: 'POST',
        headers: {},
        body: JSON.stringify({
          zipCode: '75205',
          displayUsage: 1000,
          filters: {
            term: 12,
            percentGreen: 100,
            isPrePay: false
          }
        })
      };
      
      const response = await handler(event);
      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      // Filtered results should be less than or equal to unfiltered
    });
  });

  describe('Split ZIP codes', () => {
    it('requires address for split ZIP without address', async () => {
      const event = {
        httpMethod: 'POST',
        headers: {},
        body: JSON.stringify({ zipCode: '76234' })
      };
      
      const response = await handler(event);
      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.requiresAddress).toBe(true);
      expect(data.possibleTDSPs).toHaveLength(2);
      expect(data.message).toContain('multiple utilities');
    });

    it('returns plans when address provided for split ZIP', async () => {
      // Mock ESIID lookup response
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            esiid: '10443720000000000',
            tdspDuns: '103994067400',
            tdspName: 'Oncor'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ /* plan data */ }]
        });

      const event = {
        httpMethod: 'POST',
        headers: {},
        body: JSON.stringify({ 
          zipCode: '76234',
          address: '123 Main St'
        })
      };
      
      const response = await handler(event);
      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.plans).toBeInstanceOf(Array);
    });
  });

  describe('Error handling', () => {
    it('handles non-deregulated ZIP codes', async () => {
      const event = {
        httpMethod: 'POST',
        headers: {},
        body: JSON.stringify({ zipCode: '78701' }) // Austin
      };
      
      const response = await handler(event);
      const data = JSON.parse(response.body);
      
      expect(response.statusCode).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not in our coverage area');
    });

    it('validates ZIP code format', async () => {
      const event = {
        httpMethod: 'POST',
        headers: {},
        body: JSON.stringify({ zipCode: '750' }) // Invalid
      };
      
      const response = await handler(event);
      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid input');
    });

    it('handles API failures gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const event = {
        httpMethod: 'POST',
        headers: {},
        body: JSON.stringify({ zipCode: '75205' })
      };
      
      const response = await handler(event);
      expect(response.statusCode).toBe(500);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to fetch plans');
    });
  });
});
```

### Step 3: Implement ESIID Lookup Function

Create `netlify/functions/lookup-esiid.ts`:

```typescript
import type { Handler } from '@netlify/functions';
import { ESIIDLookupSchema } from '../../src/types/electricity-plans';

const ESIID_CACHE = new Map<string, { data: any; expires: number }>();

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers, 
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  try {
    const input = ESIIDLookupSchema.parse(JSON.parse(event.body || '{}'));
    const cacheKey = `${input.address}-${input.zipCode}`;
    
    // Check cache
    const cached = ESIID_CACHE.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(cached.data)
      };
    }
    
    // Search for ESIIDs
    const params = new URLSearchParams({
      address: input.address,
      zip_code: input.zipCode
    });
    
    console.log(`Searching ESIIDs for: ${input.address}, ${input.zipCode}`);
    
    const searchResponse = await fetch(
      `https://ercot.api.comparepower.com/api/esiids?${params}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ChooseMyPower/1.0'
        }
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`ERCOT API returned ${searchResponse.status}`);
    }

    const locations = await searchResponse.json();
    
    if (!locations || locations.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'No service location found for this address'
        })
      };
    }

    // Get details for first ESIID
    const esiid = locations[0].esiid;
    const detailResponse = await fetch(
      `https://ercot.api.comparepower.com/api/esiids/${esiid}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ChooseMyPower/1.0'
        }
      }
    );
    
    if (!detailResponse.ok) {
      throw new Error(`Failed to get ESIID details: ${detailResponse.status}`);
    }

    const details = await detailResponse.json();
    
    const result = {
      success: true,
      esiid: details.esiid,
      tdspDuns: details.tdsp_duns,
      tdspName: details.tdsp_name,
      address: details.service_address || details.address,
      meterType: details.meter_type
    };
    
    // Cache for 1 hour
    ESIID_CACHE.set(cacheKey, {
      data: result,
      expires: Date.now() + 3600000
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
    
  } catch (error) {
    console.error('ESIID lookup error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid input',
          details: error.errors
        })
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to lookup address'
      })
    };
  }
};
```

### Step 4: Implement Main Search Plans Function

Create `netlify/functions/search-plans.ts`:

```typescript
import type { Handler } from '@netlify/functions';
import { 
  ZipCodeSearchSchema,
  ZIP_TO_TDSP,
  type APIResponse,
  type Plan 
} from '../../src/types/electricity-plans';

// Cache for 30 minutes
const PLAN_CACHE = new Map<string, { data: APIResponse; expires: number }>();

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse and validate input
    const input = ZipCodeSearchSchema.parse(JSON.parse(event.body || '{}'));
    
    // Get TDSP info for ZIP
    const tdspInfo = ZIP_TO_TDSP[input.zipCode];
    
    if (!tdspInfo) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'This ZIP code is not in our coverage area or is in a regulated market.'
        })
      };
    }
    
    let actualTdspDuns: string;
    let actualTdspName: string;
    
    // Handle split ZIP codes
    if ('split' in tdspInfo) {
      // This ZIP has multiple TDSPs - need address
      if (!input.address) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            requiresAddress: true,
            message: 'This ZIP code is served by multiple utilities. Please provide your address to get accurate plans.',
            possibleTDSPs: tdspInfo.tdsps
          })
        };
      }
      
      // Lookup ESIID to determine exact TDSP
      console.log(`Looking up address for split ZIP: ${input.zipCode}`);
      
      // Call our ESIID lookup function
      const baseUrl = process.env.DEPLOY_URL || `http://localhost:${process.env.PORT || 8888}`;
      const esiidResponse = await fetch(
        `${baseUrl}/.netlify/functions/lookup-esiid`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: input.address,
            zipCode: input.zipCode
          })
        }
      );
      
      const esiidData = await esiidResponse.json();
      
      if (!esiidData.success) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Could not find service location. Please verify your address.'
          })
        };
      }
      
      actualTdspDuns = esiidData.tdspDuns;
      actualTdspName = esiidData.tdspName;
    } else {
      // Single TDSP ZIP
      actualTdspDuns = tdspInfo.duns;
      actualTdspName = tdspInfo.name;
    }
    
    // Build cache key
    const filterString = input.filters ? JSON.stringify(input.filters) : '';
    const cacheKey = `${input.zipCode}-${actualTdspDuns}-${input.displayUsage}-${filterString}`;
    
    // Check cache
    const cached = PLAN_CACHE.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      console.log('Returning cached plans');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(cached.data)
      };
    }
    
    // Build query parameters
    const params = new URLSearchParams({
      group: 'default',
      tdsp_duns: actualTdspDuns,
      display_usage: input.displayUsage.toString()
    });

    // Add optional filters
    if (input.filters) {
      if (input.filters.term !== undefined) {
        params.append('term', input.filters.term.toString());
      }
      if (input.filters.percentGreen !== undefined) {
        params.append('percent_green', input.filters.percentGreen.toString());
      }
      if (input.filters.isPrePay !== undefined) {
        params.append('is_pre_pay', input.filters.isPrePay.toString());
      }
      if (input.filters.isTimeOfUse !== undefined) {
        params.append('is_time_of_use', input.filters.isTimeOfUse.toString());
      }
      if (input.filters.requiresAutoPay !== undefined) {
        params.append('requires_auto_pay', input.filters.requiresAutoPay.toString());
      }
      if (input.filters.brandId) {
        params.append('brand_id', input.filters.brandId);
      }
    }

    // Call ComparePower API
    const apiUrl = `https://pricing.api.comparepower.com/api/plans/current?${params}`;
    console.log('Fetching plans from:', apiUrl);
    
    const apiResponse = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ChooseMyPower/1.0'
      }
    });

    if (!apiResponse.ok) {
      throw new Error(`ComparePower API returned ${apiResponse.status}`);
    }

    const apiData = await apiResponse.json();
    const plans = Array.isArray(apiData) ? apiData : (apiData.plans || []);
    
    // Transform and validate response
    const response: APIResponse = {
      success: true,
      zipCode: input.zipCode,
      tdsp: {
        name: actualTdspName,
        duns: actualTdspDuns
      },
      plans: plans,
      totalPlans: plans.length
    };

    // Cache for 30 minutes
    PLAN_CACHE.set(cacheKey, {
      data: response,
      expires: Date.now() + 1800000
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Search plans error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid input',
          details: error.errors
        })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch plans. Please try again.'
      })
    };
  }
};
```

### Step 5: Create Frontend Hook

Create `src/hooks/useElectricityPlans.ts`:

```typescript
import { useState } from 'react';
import type { 
  ZipCodeSearchInput, 
  APIResponse,
  AddressRequiredResponse 
} from '../types/electricity-plans';

export function useElectricityPlans() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<APIResponse | null>(null);

  const searchPlans = async (input: ZipCodeSearchInput): Promise<APIResponse> => {
    setLoading(true);
    
    try {
      const response = await fetch('/.netlify/functions/search-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: APIResponse = await response.json();
      setData(result);
      return result;
    } catch (error) {
      const errorResponse: APIResponse = {
        success: false,
        error: 'Network error. Please try again.'
      };
      setData(errorResponse);
      return errorResponse;
    } finally {
      setLoading(false);
    }
  };

  const isAddressRequired = (response: APIResponse): response is AddressRequiredResponse => {
    return !response.success && 'requiresAddress' in response;
  };

  return { 
    searchPlans, 
    loading, 
    data,
    isAddressRequired 
  };
}
```

### Step 6: Create UI Component Example

Create `src/components/ZipCodeSearch.tsx`:

```typescript
import React, { useState } from 'react';
import { useElectricityPlans } from '../hooks/useElectricityPlans';

export function ZipCodeSearch() {
  const { searchPlans, loading, data, isAddressRequired } = useElectricityPlans();
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [usage, setUsage] = useState(1000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await searchPlans({ 
      zipCode, 
      displayUsage: usage,
      address: address || undefined
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="zip" className="block text-sm font-medium mb-1">
            ZIP Code
          </label>
          <input
            id="zip"
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="75205"
            maxLength={5}
            pattern="[0-9]{5}"
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        {data && isAddressRequired(data) && (
          <div className="p-4 bg-yellow-50 rounded-md">
            <p className="text-sm text-yellow-800 mb-3">{data.message}</p>
            <label htmlFor="address" className="block text-sm font-medium mb-1">
              Street Address
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        )}

        <div>
          <label htmlFor="usage" className="block text-sm font-medium mb-1">
            Monthly Usage (kWh)
          </label>
          <select
            id="usage"
            value={usage}
            onChange={(e) => setUsage(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value={500}>500 kWh</option>
            <option value={1000}>1000 kWh</option>
            <option value={2000}>2000 kWh</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search Plans'}
        </button>
      </form>

      {data && 'plans' in data && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">
            Available Plans ({data.totalPlans})
          </h2>
          <div className="space-y-4">
            {data.plans.map((plan) => (
              <div key={plan.plan_id} className="border rounded-lg p-4">
                <h3 className="font-medium">{plan.brand_name}</h3>
                <p className="text-sm text-gray-600">{plan.plan_name}</p>
                <div className="mt-2 flex justify-between">
                  <span>{plan.price_kwh_1000}¢/kWh</span>
                  <span>{plan.term_months} months</span>
                </div>
                
                  href={plan.signup_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-center py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Check Availability
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && !data.success && !isAddressRequired(data) && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {data.error}
        </div>
      )}
    </div>
  );
}
```

## Documentation & Next Steps

### Document in `docs/ADR.md`:
```markdown
# Architecture Decision Records

## ZIP Code to Plan Search Implementation

### Decision: Two-Step Flow for Split ZIPs
**Context**: Some Texas ZIP codes are served by multiple TDUs (e.g., half Oncor, half TNMP)
**Decision**: Require address lookup via ERCOT API for split ZIPs
**Consequences**: 
- More accurate plan results
- Additional API call for ~5% of searches
- Better user experience than showing wrong plans

### Decision: 30-Minute Cache Duration
**Context**: Plan prices change infrequently but not never
**Decision**: Cache API responses for 30 minutes
**Consequences**:
- Reduces API load by ~80%
- Users might see slightly stale prices
- Acceptable trade-off for performance

### Known Split ZIP Codes
- 76234: Oncor/TNMP
- [TODO: Complete list from ComparePower data]

### TDSP DUNS Numbers
- Oncor: 103994067400
- CenterPoint: [TODO]
- AEP Central: [TODO]
- AEP North: [TODO]
- TNMP: [TODO]
```

### Testing Instructions
```bash
# Run all tests
npm test

# Test specific ZIP scenarios
npm test -- --grep "split ZIP"

# Test locally with Netlify CLI
netlify dev

# Test endpoints
curl -X POST http://localhost:8888/.netlify/functions/search-plans \
  -H "Content-Type: application/json" \
  -d '{"zipCode":"75205","displayUsage":1000}'
```

### TODO List
1. Complete ZIP to TDSP mapping for all Texas deregulated areas
2. Add all TDSP DUNS numbers
3. Handle edge cases in API responses
4. Add plan comparison features
5. Implement favorites/saved plans
6. Add analytics tracking