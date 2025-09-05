# Plan ID Resolution Fix - Implementation Plan

## Overview
Fix the critical issue where wrong plan IDs are being passed through when users select electricity plans, particularly affecting 4Change Energy and other providers not in the mock database.

## Implementation Steps

### Step 1: Create Real Plan Data Service
**File**: `/src/lib/api/plan-data-service.ts` (NEW)
**Purpose**: Centralized service to fetch real plan data from generated JSON files
**Actions**:
1. Create new service file
2. Implement function to load city data: `loadCityData(citySlug: string)`
3. Implement plan search by name and provider: `findPlanByNameAndProvider(name: string, provider: string, citySlug?: string)`
4. Implement plan search by ID: `findPlanById(planId: string, citySlug?: string)`
5. Add caching layer for performance
6. Add error handling and logging

**Verification**:
- Service can load dallas.json and find 4Change Energy plans
- Returns correct MongoDB ObjectIds
- Handles missing files gracefully

### Step 2: Replace Mock API with Real Data
**File**: `/src/pages/api/plans/search.ts`
**Purpose**: Fix the API endpoint to return real plan IDs
**Actions**:
1. Remove hardcoded `mockPlanDatabase` array (lines 11-67)
2. Import the new `plan-data-service`
3. Update GET handler to:
   - Extract city from referer or default to 'dallas'
   - Use `findPlanByNameAndProvider()` to search real data
   - Return actual MongoDB ObjectId from plan data
4. Add proper error handling for missing plans
5. Add request logging for debugging

**Verification**:
- API returns real plan IDs for 4Change Energy
- API returns real plan IDs for all providers
- API logs all search attempts

### Step 3: Update Plan Data Flow in Components
**File**: `/src/components/ui/ProductDetailsPageShadcn.tsx`
**Purpose**: Ensure plan ID is properly passed through
**Actions**:
1. Check if plan data already contains `id` field (line 1086)
2. Pass plan's actual `id` as `apiPlanId` if available
3. Keep existing fetch as fallback for plans without ID
4. Add console logging for debugging plan ID flow

**Pseudocode**:
```tsx
planData={{
  id: planData.id,
  name: planData.name,
  provider: {
    name: planData.provider.name
  },
  apiPlanId: planData.id || realPlanId // Use plan's ID first
}}
```

### Step 4: Remove Hardcoded Mappings from Modal
**File**: `/src/components/ui/AddressSearchModal.tsx`
**Purpose**: Eliminate all hardcoded plan mappings
**Actions**:
1. Remove the entire `planSlugMapping` object (lines 287-297)
2. Simplify `getPlanObjectId()` function to:
   - Return `apiPlanId` if available
   - Return plan's `id` field if available
   - Show error if no valid ID found
3. Remove the hardcoded fallback ID (line 305)
4. Add error state for missing plan ID

**New Implementation**:
```tsx
const getPlanObjectId = (planData: any): string | null => {
  // Use API-fetched MongoDB ObjectId
  if (planData.apiPlanId) {
    console.log('Using apiPlanId:', planData.apiPlanId);
    return planData.apiPlanId;
  }
  
  // Use plan's own ID if it's a valid MongoDB ObjectId
  if (planData.id && /^[a-f0-9]{24}$/i.test(planData.id)) {
    console.log('Using plan.id:', planData.id);
    return planData.id;
  }
  
  // No valid plan ID found
  console.error('No valid plan ID found for:', planData);
  return null;
};
```

### Step 5: Add Error Handling for Missing Plan IDs
**File**: `/src/components/ui/AddressSearchModal.tsx`
**Purpose**: Prevent orders with wrong plan IDs
**Actions**:
1. Update `handleProceedToOrder()` (line 308)
2. Check if `actualPlanId` is null
3. If null, show error message instead of opening order URL
4. Add error state to component
5. Display user-friendly error message

**Implementation**:
```tsx
const handleProceedToOrder = () => {
  if (!selectedLocation) return;
  
  const actualPlanId = getPlanObjectId(planData);
  
  if (!actualPlanId) {
    setError('Unable to process order. Plan information is missing.');
    console.error('Cannot proceed: No valid plan ID', planData);
    return;
  }
  
  // Continue with order...
}
```

### Step 6: Update Plan Card Components
**File**: `/src/components/faceted/PlanResultsGrid.tsx` and related
**Purpose**: Ensure plan cards pass MongoDB ID
**Actions**:
1. Check that plan cards include the `id` field
2. Verify `id` is passed when navigating to plan details
3. Add data attributes for debugging

### Step 7: Create Migration Script for Existing Data
**File**: `/scripts/verify-plan-ids.mjs` (NEW)
**Purpose**: Verify all plans have valid MongoDB ObjectIds
**Actions**:
1. Create script to scan all generated JSON files
2. Check each plan has an `id` field
3. Validate `id` format (24 character hex string)
4. Report any plans with missing or invalid IDs
5. Generate report of all unique providers found

**Run Command**: `node scripts/verify-plan-ids.mjs`

### Step 8: Add Comprehensive Logging
**Files**: Multiple components
**Purpose**: Debug plan ID resolution in production
**Actions**:
1. Add console.log in `/api/plans/search` for all searches
2. Add console.log in `AddressSearchModal` for ID resolution
3. Add console.log before generating order URL
4. Include plan name, provider, and resolved ID in logs

### Step 9: Create End-to-End Tests
**File**: `/tests/e2e/plan-id-resolution.spec.ts` (NEW)
**Purpose**: Verify plan ID resolution works correctly
**Test Cases**:
1. Test 4Change Energy plan selection and order
2. Test Amigo Energy plan selection and order
3. Test plan without ID shows error
4. Test API endpoint returns correct IDs
5. Test order URL contains correct plan ID

### Step 10: Update Documentation
**File**: `/docs/plan-id-resolution.md` (NEW)
**Purpose**: Document the plan ID resolution system
**Content**:
1. How plan IDs flow through the system
2. Data sources and priority
3. Debugging guide for plan ID issues
4. How to add support for new providers

## Testing Plan

### Unit Tests
1. Test `plan-data-service` functions
2. Test `/api/plans/search` endpoint
3. Test `getPlanObjectId` function logic

### Integration Tests
1. Test full flow from plan selection to order URL
2. Test with multiple providers
3. Test error scenarios

### Manual Testing Checklist
- [ ] Select 4Change Energy plan → Verify correct plan ID in order URL
- [ ] Select Amigo Energy plan → Verify correct plan ID in order URL  
- [ ] Select TXU Energy plan → Verify correct plan ID in order URL
- [ ] Select plan with missing ID → Verify error message shown
- [ ] Check browser console for proper logging
- [ ] Test with different cities (Dallas, Houston, Austin)

## Rollback Plan

If issues occur after deployment:
1. Revert changes to `/src/components/ui/AddressSearchModal.tsx`
2. Revert changes to `/src/pages/api/plans/search.ts`
3. Restore hardcoded mappings temporarily
4. Investigate and fix issues
5. Re-deploy with fixes

## Dependencies

- No external dependencies required
- Uses existing generated data files
- Compatible with current MongoDB ObjectId format

## Risk Assessment

**Low Risk**:
- Changes are isolated to plan ID resolution
- ESID lookup remains unchanged
- Fallback to error instead of wrong plan

**Mitigations**:
- Comprehensive logging for debugging
- Error messages prevent wrong orders
- Can quickly rollback if needed

## Success Metrics

1. Zero orders with wrong plan IDs
2. All providers supported equally
3. Clear error messages for missing data
4. Improved debugging capability with logs
5. Passing E2E tests for all providers

## Timeline

- Step 1-2: 30 minutes (Core fix)
- Step 3-5: 30 minutes (Component updates)
- Step 6-8: 20 minutes (Supporting changes)
- Step 9: 30 minutes (Testing)
- Step 10: 10 minutes (Documentation)

**Total Estimated Time**: 2 hours

## Next Action

Begin with Step 1: Create the plan-data-service.ts file to establish the foundation for real plan data access.