# Research: ZIP Code to City Navigation Implementation

**Feature**: Functional ZIP Code to City Plans Navigation
**Research Phase**: Phase 0 - Understanding current implementation and issues

## Current Implementation Analysis

### 1. **ZIP Validation Services Structure**

**Decision**: Two parallel ZIP validation systems exist with different redirect patterns
**Rationale**: The legacy system redirects to wrong URLs, new system has correct pattern
**Alternatives considered**: Consolidating to single system vs fixing legacy system

#### Current Services:
- **Legacy ZIP Lookup API** (`/src/pages/api/zip-lookup.ts`) → **PROBLEMATIC**
  - Redirects to: `/texas/${citySlug}` 
  - Used by: Standard ZIP input components site-wide
  - **Root cause of wrong redirect issue**

- **New ZIP Validation Service** (`/src/lib/services/zip-validation-service.ts`) → **CORRECT**
  - Redirects to: `/electricity-plans/${citySlug}?zip=${zipCode}`
  - Used by: New ZIP lookup forms
  - **Has correct redirect pattern**

### 2. **Current Navigation Flow Issues**

**Decision**: Legacy API causes wrong destination redirects
**Rationale**: Line 174 in zip-lookup.ts uses wrong URL pattern
**Alternatives considered**: Fix legacy API vs replace with new service

#### Issue #1: Wrong Redirect Destination
```
CURRENT (WRONG):  ZIP → /api/zip-lookup → /texas/dallas → Basic city page
EXPECTED (RIGHT): ZIP → Validation → /electricity-plans/dallas-tx → Full plans page
```

#### Issue #2: Inconsistent City Slug Formats  
- Legacy API: `dallas`, `houston` (no suffix)
- New service: `dallas-tx`, `houston-tx` (with suffix)
- Plans pages expect: `/electricity-plans/{city}-tx/` format

### 3. **URL Structure and Page Types**

**Decision**: Users should reach faceted plans pages, not basic city overview pages
**Rationale**: Faceted plans pages provide comprehensive electricity plan listings
**Alternatives considered**: Enhancing city overview pages vs redirecting to proper plans pages

#### Correct Destination: `/electricity-plans/[...path].astro`
- Format: `/electricity-plans/dallas-tx/`, `/electricity-plans/houston-tx/`
- Features: Comprehensive plan listings, filtering, real TDSP data
- **This is where users should land**

#### Wrong Current Destination: `/texas/[city].astro` 
- Format: `/texas/dallas`, `/texas/houston`
- Features: Basic city overview, limited plan display
- **Users don't find what they're looking for here**

### 4. **Plan Data Loading and Partial Rendering Issues**

**Decision**: Current plan data loading shows intermediate states to users
**Rationale**: API failures and slow loading cause poor UX
**Alternatives considered**: Better loading states vs faster data sources

#### Root Causes of Partial Rendering:
- Database connection failures falling back to JSON files
- API rate limiting during plan data fetching
- Slow plan data generation for some cities  
- Error states displayed during data loading transitions

#### Plan Data Services Chain:
```
1. Provider service (/src/lib/services/provider-service.ts)
2. Plan data service (/src/lib/api/plan-data-service.ts)  
3. ComparePower client (/src/lib/api/comparepower-client.ts)
4. Faceted navigation system (/src/lib/faceted/)
```

## Technical Implementation Approach

### 1. **Fix Strategy: Replace Legacy with New Service**

**Decision**: Use existing new ZIP validation service, deprecate legacy API
**Rationale**: New service has correct redirect pattern and better validation
**Alternatives considered**: Fixing legacy API vs replacing it entirely

#### Implementation Path:
- Update all ZIP input components to use new validation service
- Ensure consistent city slug format (with `-tx` suffix)
- Remove or redirect legacy `/api/zip-lookup` endpoint

### 2. **Direct Navigation Implementation**

**Decision**: Implement direct ZIP → plans page navigation without intermediate stops
**Rationale**: Meets requirement for smooth user experience
**Alternatives considered**: Keeping intermediate pages vs eliminating them

#### Flow Design:
```
User enters ZIP → Validation → Direct redirect to /electricity-plans/{city}-tx/
```

### 3. **Plan Data Loading Reliability**

**Decision**: Implement better error handling and loading states
**Rationale**: Current partial rendering violates full page load requirement
**Alternatives considered**: Faster APIs vs better error handling

#### Improvements Needed:
- Pre-validate plan data availability before navigation
- Implement loading states that don't appear as partial rendering
- Add proper fallback mechanisms for API failures
- Ensure consistent plan data across all city pages

## Constitutional Compliance Analysis

### Real Data Architecture ✅
- Existing services use real data (PostgreSQL + JSON fallbacks)
- New validation service follows constitutional patterns
- No mock data usage in current or planned implementation

### Plan ID & ESID Resolution ✅  
- Current city plans pages use dynamic plan ID resolution
- ZIP validation doesn't involve hardcoded plan IDs
- ESID lookup remains address-based (not ZIP-based)

### Performance Standards 🟡
- Current: Some cities have slow plan data loading
- Target: <200ms ZIP validation, <500ms total navigation
- Improvement needed: Optimize plan data loading for full page render

## Files Requiring Changes

### Critical Fix - Legacy API Redirect:
**File**: `/src/pages/api/zip-lookup.ts` (Line 174)
```typescript
// CHANGE FROM:
redirectUrl: `/texas/${citySlug}`,
// CHANGE TO:  
redirectUrl: `/electricity-plans/${citySlug}`,
```

### Service Integration Points:
- `/src/lib/services/zip-validation-service.ts` - Already correct
- `/src/scripts/zip-lookup.js` - Update to use new service
- Components using ZIP lookup - Migrate to new service

### Plan Data Reliability:
- `/src/lib/services/provider-service.ts` - Error handling
- `/src/lib/api/plan-data-service.ts` - Loading states
- `/src/pages/electricity-plans/[...path].astro` - Full render validation

## Research Conclusions

The main issue is architectural: the legacy ZIP lookup API redirects to basic city overview pages (`/texas/{city}`) instead of comprehensive electricity plans pages (`/electricity-plans/{city}-tx/`). The new ZIP validation service already has the correct redirect pattern, so the solution is to replace legacy usage with the new service and ensure consistent city slug formatting.

Partial rendering issues stem from plan data loading failures and error states being visible to users. The solution requires better error handling and pre-validation of plan data availability before navigation.

All NEEDS CLARIFICATION items have been resolved through codebase analysis.