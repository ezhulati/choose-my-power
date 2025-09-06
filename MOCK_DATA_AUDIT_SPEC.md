# Mock Data Audit Specification

**Date**: 2025-09-06  
**Auditor**: Claude Code  
**Criticality**: HIGH - Production system where incorrect data could cause wrong electricity plans to be ordered

## Executive Summary

A comprehensive audit was conducted to identify all mock data usage in the ChooseMyPower electricity comparison platform. The audit found that while critical order flow components (plan ordering, ESIID validation) are using real data, there are **39 React components still importing and using mock data** from `src/data/mockData.ts`. This represents a significant risk for production deployment.

## Critical Findings

### ✅ SAFE: Order Flow Components (Using Real Data)

1. **AddressSearchModal.tsx** - Uses dynamic plan IDs from API
   - Fetches real MongoDB ObjectIds via `getPlanObjectId()`
   - No hardcoded plan IDs found
   - Properly validates plan data before order URL generation

2. **ProductDetailsPageShadcn.tsx** - Fetches real plan data
   - Calls `/api/plans/search` to get actual MongoDB ObjectIds
   - Uses database or generated JSON files as data source
   - No mock data usage

3. **Plan Search API** (`/api/plans/search.ts`)
   - Uses real database via `plan-database-service.ts`
   - Falls back to generated JSON files if database is empty
   - Returns actual MongoDB ObjectIds from production data

4. **ERCOT Validation** (`/api/ercot/validate.ts`)
   - Generates ESIIDs dynamically based on actual addresses
   - Uses ZIP code patterns to determine utility territories
   - No hardcoded ESIIDs (except in test files, which is acceptable)

### ❌ AT RISK: Components Still Using Mock Data

The following 39 components are still importing from `mockData.ts`:

#### State-Level Pages (14 components)
- StateNoDepositPage.tsx
- StateSwitchProviderPage.tsx
- StateElectricityPlansPage.tsx
- StateElectricityProvidersPage.tsx
- StateElectricityRatesPage.tsx
- StateMarketInfoPage.tsx
- StatePage.tsx

#### City-Level Pages (7 components)
- CitySwitchProviderPage.tsx
- CityElectricityProvidersPage.tsx
- CityPage.tsx
- CityNoDepositPage.tsx
- CityElectricityPlansPage.tsx
- CityElectricityRatesPage.tsx

#### Texas-Specific Pages (5 components)
- TexasElectricityPage.tsx
- TexasCityPage.tsx
- TexasCompaniesPage.tsx
- TexasPlansPage.tsx
- TexasMarketForecastPage.tsx

#### Comparison & Provider Pages (8 components)
- CompareRatesPage.tsx
- ComparePlansPage.tsx
- CompareProvidersPage.tsx
- ProviderPage.tsx
- ProviderComparisonPage.tsx
- Top5ProvidersPage.tsx
- ElectricityCompaniesPage.tsx
- ElectricityPlansPage.tsx

#### General Pages (5 components)
- ShopPage.tsx
- LocationsPage.tsx
- LocationFinderPage.tsx
- CalculatorPage.tsx
- CheapestElectricityLandingPage.tsx

#### Astro Components (1 component)
- providers/[provider].astro

#### Utility Functions (1 file)
- lib/utils/dynamic-counts.ts

## Risk Assessment

### High Risk Areas
1. **Provider Pages** - Showing fake provider information to users
2. **Plan Comparison Pages** - Displaying incorrect rates and terms
3. **City/State Pages** - Wrong provider availability by location
4. **Calculator Pages** - Incorrect cost calculations based on fake rates

### Medium Risk Areas
1. **Marketing Pages** - Using mock counts for "500+ providers" claims
2. **SEO Pages** - Generated content may reference non-existent providers

### Low Risk Areas
1. **Test Files** - Acceptable to use mock data in tests
2. **Demo/Preview Components** - If clearly marked as examples

## Data Source Analysis

### Mock Data File Contents
- `mockProviders`: 18 hardcoded electricity providers with fake plans
- `mockStates`: Texas and Pennsylvania with hardcoded city data
- `utilityCompanies`: Hardcoded utility company information

### Real Data Sources Available
1. **Database** (PostgreSQL via Drizzle ORM)
   - Real electricity plans with MongoDB ObjectIds
   - City and TDSP mappings
   - Provider information

2. **Generated JSON Files** (`src/data/generated/`)
   - 881 city-specific data files
   - Real plan data from ComparePower API
   - Actual MongoDB ObjectIds

3. **ComparePower API** (`comparepower-client.ts`)
   - Live plan data fetching
   - Real provider information
   - Current pricing and availability

## Verification Tests Performed

### ✅ Passed Tests
1. No hardcoded MongoDB ObjectIds in source code (pattern: `68b[0-9a-f]{21}`)
2. No hardcoded ESIIDs in production code (pattern: `10[0-9]{15}`)
3. API endpoints not using mock data
4. Order flow using dynamic plan resolution

### ❌ Failed Tests
1. 39 components importing mockData.ts
2. Provider pages showing static mock provider data
3. Dynamic counts utility still referencing mockProviders

## Recommended Actions

### Phase 1: Immediate (Critical Path)
1. Replace mock data in provider pages with database queries
2. Update city/state pages to use generated JSON data
3. Fix dynamic-counts.ts to query real data sources

### Phase 2: Short-term (1-2 days)
1. Create provider service layer to abstract data access
2. Migrate all comparison pages to real data
3. Update calculator components with actual rates

### Phase 3: Complete Migration (3-5 days)
1. Remove all mockData.ts imports
2. Delete or archive mockData.ts file
3. Add lint rule to prevent mock data imports
4. Comprehensive testing of all affected pages

## Implementation Priority

### Critical (Do First)
1. **Provider Pages** - Users see provider details here
2. **Plan Comparison** - Direct impact on user decisions
3. **City/State Pages** - Main landing pages for SEO

### Important (Do Second)
1. **Calculator Pages** - Affects cost estimates
2. **Shop Pages** - Main conversion funnel
3. **Location Pages** - User navigation paths

### Nice-to-Have (Do Last)
1. **Marketing Pages** - Update counts to be dynamic
2. **SEO Optimization** - Ensure all content is real

## Testing Requirements

After mock data removal:
1. Verify all pages load without errors
2. Check that provider data matches database
3. Confirm plan IDs are valid MongoDB ObjectIds
4. Test order flow end-to-end
5. Validate ESIID generation still works
6. Performance testing (real data may be larger)

## Success Criteria

- [ ] Zero imports of mockData.ts in production code
- [ ] All provider information from database or API
- [ ] Plan data uses real MongoDB ObjectIds
- [ ] Dynamic counts reflect actual database content
- [ ] All pages function correctly with real data
- [ ] No regression in order flow functionality

## Conclusion

The system is partially migrated to real data, with critical order flow components properly implemented. However, significant work remains to remove mock data from display components. The presence of mock data in 39 components represents a serious risk for production deployment and must be addressed before launch.

**Recommendation**: DO NOT deploy to production until all mock data is removed from user-facing components.