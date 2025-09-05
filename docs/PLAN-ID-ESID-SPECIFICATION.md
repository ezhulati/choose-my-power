# Plan ID & ESID System Specification

**Version**: 2.0  
**Last Updated**: September 5, 2025  
**Status**: CRITICAL - NEVER VIOLATE THESE RULES

## Overview

This specification defines the mandatory architecture for Plan ID and ESID handling in the ChooseMyPower platform. This document was created after resolving a critical bug where hardcoded plan IDs caused users to be redirected to wrong electricity plans (4Change users were getting Amigo plan IDs).

## 🚨 CRITICAL RULES (NEVER VIOLATE)

### Rule 1: NO HARDCODED PLAN IDs
❌ **FORBIDDEN**: Any hardcoded MongoDB ObjectIds in source code  
✅ **REQUIRED**: All plan IDs must be dynamically retrieved from generated data files

### Rule 2: NO FALLBACK PLAN IDs  
❌ **FORBIDDEN**: Default/fallback plan IDs when lookups fail  
✅ **REQUIRED**: Show error messages instead of wrong plans

### Rule 3: NO HARDCODED ESIDs
❌ **FORBIDDEN**: Static ESID values in any component  
✅ **REQUIRED**: All ESIDs must be generated from user's actual address

### Rule 4: MANDATORY VALIDATION
❌ **FORBIDDEN**: Passing through unvalidated plan IDs  
✅ **REQUIRED**: MongoDB ObjectId format validation (24 hex characters)

## Plan ID Resolution Architecture

### Data Flow
```
User Selection → Plan Name + Provider → API Lookup → MongoDB ObjectId → Order URL
```

### Implementation Requirements

#### 1. ProductDetailsPageShadcn.tsx
```typescript
// ✅ CORRECT: Dynamic API lookup
const fetchRealPlanId = async () => {
  const response = await fetch(`/api/plans/search?name=${planData.name}&provider=${planData.provider.name}&city=${citySlug}`);
  if (response.ok) {
    const results = await response.json();
    setRealPlanId(results[0].id); // Real MongoDB ObjectId
  }
};

// ❌ FORBIDDEN: Hardcoded fallback
// const fallbackPlanId = "68b5a47c206770f7c563208a"; // NEVER DO THIS
```

#### 2. AddressSearchModal.tsx
```typescript
// ✅ CORRECT: Validation with error handling
const getPlanObjectId = (planData: any): string | null => {
  if (planData.apiPlanId) return planData.apiPlanId;
  if (planData.id && /^[a-f0-9]{24}$/i.test(planData.id)) return planData.id;
  
  // Show error instead of hardcoded fallback
  return null; // Will trigger error message
};

// ❌ FORBIDDEN: Silent fallback to wrong plan
// return "68b5a47c206770f7c563208a"; // NEVER DO THIS
```

#### 3. API Layer (/api/plans/search.ts)
```typescript
// ✅ CORRECT: Use real plan data service
const matchedPlan = await findPlanByNameAndProvider(name, provider, citySlug);
if (matchedPlan) {
  return new Response(JSON.stringify([{
    id: matchedPlan.id, // Real MongoDB ObjectId from data
    name: matchedPlan.name,
    provider: matchedPlan.provider.name
  }]));
}

// ❌ FORBIDDEN: Mock data with fake IDs
// const mockPlans = [{ id: "fake-id-123", name: "Mock Plan" }]; // NEVER DO THIS
```

### Data Source Requirements

#### Generated Data Files (src/data/generated/*.json)
- **Source**: Real API data from ComparePower
- **Format**: MongoDB ObjectIds (24 hex characters)
- **Structure**: `filters['no-filters'].plans[]` array
- **Validation**: Every plan must have valid `id` field

#### Plan Data Service (src/lib/api/plan-data-service.ts)
```typescript
// ✅ CORRECT: Load from real data files
export async function findPlanByNameAndProvider(name: string, provider: string, citySlug: string) {
  const cityData = await loadCityData(citySlug);
  const plans = cityData.filters?.['no-filters']?.plans || [];
  
  return plans.find(plan => 
    plan.name?.toLowerCase() === name.toLowerCase() && 
    plan.provider?.name?.toLowerCase() === provider.toLowerCase()
  );
}

// Validate MongoDB ObjectId format
export function isValidMongoId(id: string): boolean {
  return /^[a-f0-9]{24}$/i.test(id);
}
```

## ESID Resolution Architecture

### Data Flow
```
User Address → ZIP Code → ESID Generation → TDSP Mapping → Order URL
```

### Implementation Requirements

#### 1. ERCOT Validation API (/api/ercot/validate.ts)
```typescript
// ✅ CORRECT: ESID generation based on input
const generateESIIDDetails = (esiid: string): ESIIDDetails => {
  const esiidNum = parseInt(esiid);
  const zipBase = Math.floor((esiidNum % 100000) + 75000);
  
  // Determine TDSP based on ZIP pattern
  let tdsp = 'Oncor Electric Delivery';
  if (zipBase >= 77000 && zipBase <= 77999) {
    tdsp = 'CenterPoint Energy'; // Houston area
  } else if (zipBase >= 78000 && zipBase <= 78999) {
    tdsp = 'AEP Texas'; // Austin area
  }
  // ... more mappings
  
  return { esiid, tdsp, zip: zipBase.toString(), /* ... */ };
};

// ❌ FORBIDDEN: Hardcoded ESID/TDSP mappings
// const hardcodedEsiid = "10123456789012345"; // NEVER DO THIS
```

#### 2. Address Search Modal
```typescript
// ✅ CORRECT: Use validated ESID from API response
const handleSelectLocation = async (location: ESIIDLocation) => {
  const response = await fetch('/api/ercot/validate', {
    body: JSON.stringify({ esiid: location.esiid })
  });
  const esiidDetails = await response.json();
  
  // Use actual ESID from user's selected location
  onSuccess(location.esiid, location.address);
};
```

## Testing & Validation

### Automated Tests Required

#### 1. Plan ID Resolution Tests
```bash
# Test 4Change Energy plans
curl "http://localhost:4325/api/plans/search?name=Cash%20Money%2012&provider=4Change%20Energy&city=dallas"
# Must return: {"id": "68b6fc3f206770f7c5634d6b", ...}

# Test Amigo Energy plans  
curl "http://localhost:4325/api/plans/search?name=Simply%20Days%20Free%20-%2012&provider=Amigo%20Energy&city=dallas"
# Must return: {"id": "68b5a47c206770f7c563208a", ...}

# Test other providers
curl "http://localhost:4325/api/plans/search?name=Reliant%20Basic%20Power%2012%20plan&provider=Reliant&city=dallas"
# Must return: {"id": "68b528c39df7fc01f8e66896", ...}
```

#### 2. ESID Generation Tests
```bash
# Test different ZIP patterns
curl -X POST "http://localhost:4325/api/ercot/validate" -H "Content-Type: application/json" -d '{"esiid": "10123456789012345"}'
# Must return Dallas/Oncor

curl -X POST "http://localhost:4325/api/ercot/validate" -H "Content-Type: application/json" -d '{"esiid": "10777000000000001"}'  
# Must return Houston/CenterPoint
```

#### 3. Hardcoded Value Detection
```bash
# Scan for hardcoded MongoDB ObjectIds
grep -r "68b[0-9a-f]\{21\}" src/ --exclude-dir=data

# Scan for hardcoded ESIDs
grep -r "10[0-9]\{15\}" src/ --exclude-dir=test

# Both commands should return ZERO results
```

### Manual Testing Checklist

- [ ] Select 4Change Energy plan → Verify correct 4Change plan ID in network requests
- [ ] Select Amigo Energy plan → Verify correct Amigo plan ID in network requests  
- [ ] Enter different addresses → Verify different ESIDs generated
- [ ] Test plan not found → Verify error message (no fallback plan ID)
- [ ] Test invalid ESID → Verify error handling (no hardcoded fallback)

## Error Handling Requirements

### Plan ID Errors
```typescript
// ✅ CORRECT: Show error, don't use wrong plan
if (!actualPlanId) {
  setPlanError('Unable to process order. Plan information is missing or invalid. Please contact support.');
  return; // Don't proceed with order
}

// ❌ FORBIDDEN: Silent fallback to different plan
// const fallbackId = "68b5a47c206770f7c563208a"; // NEVER DO THIS
```

### ESID Errors  
```typescript
// ✅ CORRECT: Show error message
if (!response.ok) {
  setSearchError('Unable to validate this service location. Please try another address.');
  return;
}

// ❌ FORBIDDEN: Use hardcoded ESID
// const defaultEsid = "10123456789012345"; // NEVER DO THIS
```

## Deployment Checklist

Before any production deployment:

1. **Run Verification Commands** (see Testing section above)
2. **Check Network Requests** in browser DevTools during order flow
3. **Verify Plan ID Audit** - No hardcoded values in source code
4. **Test Multiple Providers** - 4Change, Amigo, Reliant, others
5. **Test Multiple Cities** - Dallas, Houston, Austin

## Code Review Requirements

All pull requests affecting these files MUST be reviewed for hardcoded values:

- `src/components/ui/AddressSearchModal.tsx`
- `src/components/ui/ProductDetailsPageShadcn.tsx`  
- `src/pages/api/plans/search.ts`
- `src/lib/api/plan-data-service.ts`
- `src/pages/api/ercot/validate.ts`

### Review Checklist
- [ ] No hardcoded MongoDB ObjectIds (68b...)
- [ ] No hardcoded ESIDs (10...)
- [ ] All plan IDs come from API/data service
- [ ] All ESIDs come from user input
- [ ] Error handling instead of fallbacks
- [ ] Validation functions used correctly

## Incident Prevention

### Monitoring
- Monitor ComparePower order failures by provider
- Track plan ID → provider mismatches in logs
- Alert on hardcoded value detection in CI/CD

### Training
- All developers must read this specification
- Code reviews must enforce these rules
- Regular audits of plan ID handling code

## Version History

### v2.0 (September 5, 2025)
- Created after resolving critical 4Change→Amigo plan ID bug
- Established mandatory dynamic-only architecture
- Added comprehensive testing requirements

### v1.0 (Historical)
- Previous system had hardcoded fallbacks (caused the bug)
- Mixed mock and real data (caused confusion)
- No validation requirements (allowed invalid IDs)

---

**REMEMBER**: This specification exists because hardcoded plan IDs caused users to order wrong electricity plans. The financial and legal implications of such errors are severe. These rules are not suggestions - they are mandatory safeguards.