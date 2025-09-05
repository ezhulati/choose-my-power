# Plan ID Resolution Issue - Specification Document

## Problem Overview

The ChooseMyPower application is incorrectly passing hardcoded or wrong plan IDs when users select electricity plans for ordering. When a user selects a plan from provider "4Change Energy", the system incorrectly passes through a plan ID for "Amigo" or "Frontier" provider instead of the actual MongoDB ObjectId for the selected 4Change plan.

## Research Findings

### 1. Current Implementation Issues

#### A. Mock API Endpoint (`/api/plans/search.ts`)
- **Location**: `/src/pages/api/plans/search.ts`
- **Issue**: Uses a hardcoded mock database with fake MongoDB ObjectIds
- **Mock IDs**: Do not correspond to real plans in the ComparePower system
- **No 4Change Plans**: The mock database only includes plans from Frontier, TXU, Reliant, Direct Energy, and Green Mountain
- **Result**: When searching for 4Change plans, the API returns empty or falls back to wrong provider plans

#### B. AddressSearchModal Component Fallback Logic
- **Location**: `/src/components/ui/AddressSearchModal.tsx`
- **Function**: `getPlanObjectId()` (lines 280-306)
- **Issues**:
  1. Hardcoded plan slug mapping (lines 287-297) with fake/wrong ObjectIds
  2. No mappings for 4Change Energy plans
  3. Final fallback always returns Frontier plan ID: `68b84e0e206770f7c563793b`
  4. This causes ALL unmapped plans to route to the same Frontier plan

#### C. Plan Data Flow
1. User selects a plan from the UI
2. `ProductDetailsPageShadcn` attempts to fetch real plan ID via `/api/plans/search`
3. API returns nothing (4Change not in mock database)
4. `realPlanId` remains null
5. `AddressSearchModal` receives null `apiPlanId`
6. Fallback logic kicks in, returns wrong provider's plan ID
7. User is redirected to order wrong plan

### 2. Existing Infrastructure

#### A. Real MongoDB ObjectIds Available
- **Location**: `/src/data/generated/[city].json` files
- **4Change Energy IDs Found**:
  - `68b6fc3f206770f7c5634d6b` - Cash Money 12
  - `68b6fc40206770f7c5634d6c` - One Rate 12
  - `68b6fc40206770f7c5634d6f` - Power Maxx Saver 12
  - `68b6fc40206770f7c5634d70` - (Another 4Change plan)
  - `68b6fc3f206770f7c5634d66` - (Another 4Change plan)

#### B. ComparePower API Client
- **Location**: `/src/lib/api/comparepower-client.ts`
- **Structure**: Defines proper plan response structure with `_id` field
- **Capability**: Can fetch real plan data from API or database

#### C. ESID Mapping System
- **Working Correctly**: User address → ESID lookup is functioning
- **API Endpoints**: `/api/ercot/search` and `/api/ercot/validate` are operational

## Requirements

### Functional Requirements

1. **Dynamic Plan ID Resolution**
   - Plan IDs must be dynamically retrieved based on the actual plan selected
   - Never use hardcoded plan IDs or static mappings
   - Support ALL providers, not just a subset

2. **Data Source Priority**
   - First: Use MongoDB ObjectId from plan data if available
   - Second: Fetch from real API/database
   - Third: Use generated data files as source of truth
   - Never: Fall back to wrong provider's plan ID

3. **Provider Coverage**
   - Must support all providers in the system
   - Special attention to: 4Change Energy, Amigo Energy, and other providers not in mock database

4. **ESID Integration** (Already Working)
   - Continue using dynamic ESID based on user's entered address
   - Maintain current `/api/ercot/` endpoints

### Technical Requirements

1. **API Endpoint Enhancement**
   - Replace mock database with real data source
   - Connect to MongoDB or use generated JSON files
   - Return actual plan `_id` values

2. **Remove Hardcoded Mappings**
   - Eliminate static plan slug → ObjectId mappings
   - Remove provider-specific fallbacks

3. **Error Handling**
   - If plan ID cannot be resolved, show error to user
   - Never silently fall back to wrong plan
   - Log all plan ID resolution attempts for debugging

### Data Flow Requirements

**Expected Flow:**
1. User selects plan (with MongoDB `_id` in plan data)
2. Plan details page receives complete plan object
3. On "Order This Plan" click, modal opens
4. User enters address, gets ESID
5. System uses plan's actual `_id` and user's ESID
6. Correct order URL generated: `https://orders.comparepower.com/order/service_location?esiid=[USER_ESID]&plan_id=[ACTUAL_PLAN_ID]`

## Constraints

1. **Backward Compatibility**: Must not break existing working plans
2. **Performance**: Plan ID resolution must be fast (<100ms)
3. **Reliability**: System must handle API failures gracefully
4. **Data Integrity**: Must use MongoDB ObjectIds that exist in ComparePower system

## Assumptions Resolved

1. **Plan Data Structure**: Plans in generated JSON files contain valid MongoDB `_id` fields
2. **API Access**: System has access to read plan data from generated files
3. **Order URL Format**: Confirmed format requires MongoDB ObjectId, not URL slugs

## Success Criteria

1. When user selects 4Change Energy plan, order URL contains 4Change plan ID
2. When user selects Amigo Energy plan, order URL contains Amigo plan ID  
3. No hardcoded plan IDs in codebase
4. All providers are supported equally
5. Plan ID resolution is logged for debugging
6. Error messages shown when plan ID cannot be resolved

## Next Steps

Create implementation plan to:
1. Fix `/api/plans/search` endpoint to use real data
2. Update plan data flow to pass MongoDB `_id` through components
3. Remove all hardcoded plan mappings
4. Add comprehensive error handling and logging
5. Test with multiple providers including 4Change Energy