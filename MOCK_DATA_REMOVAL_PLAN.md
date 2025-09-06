# Mock Data Removal Implementation Plan

**Created**: 2025-09-06  
**Priority**: CRITICAL - Must complete before production deployment  
**Estimated Time**: 3-5 days for complete removal

## Overview

This plan details the step-by-step process to remove all mock data from the ChooseMyPower application and replace it with real data sources. The plan is organized by priority and includes specific implementation details for each component.

## Data Source Architecture

### Available Real Data Sources

1. **PostgreSQL Database** (Primary Source)
   ```typescript
   import { db } from '@/config/database';
   import { electricityPlans, providers, cities } from '@/lib/database/schema';
   ```

2. **Generated JSON Files** (Fallback/Static Source)
   ```typescript
   import { getCityData } from '@/lib/api/city-data-loader';
   const cityData = await getCityData('dallas');
   ```

3. **ComparePower API** (Live Data)
   ```typescript
   import { comparePowerClient } from '@/lib/api/comparepower-client';
   const plans = await comparePowerClient.getPlans({ zip: '75201' });
   ```

## Phase 1: Create Data Service Layer (Day 1)

### Step 1.1: Create Provider Service
**File**: `src/lib/services/provider-service.ts`

```typescript
// Replace mock provider data with database queries
export async function getProviders(state?: string) {
  // Query from database
  const providers = await db.select().from(providers)
    .where(state ? eq(providers.serviceStates, state) : undefined);
  return providers;
}

export async function getProviderBySlug(slug: string) {
  const provider = await db.select().from(providers)
    .where(eq(providers.slug, slug))
    .limit(1);
  return provider[0];
}
```

### Step 1.2: Create City/State Service
**File**: `src/lib/services/location-service.ts`

```typescript
export async function getCityData(citySlug: string) {
  // First try database
  const city = await db.select().from(cities)
    .where(eq(cities.slug, citySlug))
    .limit(1);
  
  if (city.length > 0) return city[0];
  
  // Fallback to generated JSON
  return await getCityDataFromJSON(citySlug);
}

export async function getStateData(stateSlug: string) {
  // Aggregate city data for state
  const stateCities = await db.select().from(cities)
    .where(eq(cities.state_slug, stateSlug));
  return {
    slug: stateSlug,
    cities: stateCities,
    // ... other state data
  };
}
```

### Step 1.3: Create Plan Service
**File**: `src/lib/services/plan-service.ts`

```typescript
export async function getPlansForCity(citySlug: string, filters?: PlanFilters) {
  // Use existing plan-data-service with enhancements
  const cityData = await getCityData(citySlug);
  return cityData.plans.filter(/* apply filters */);
}

export async function getProviderPlans(providerSlug: string) {
  const plans = await db.select().from(electricityPlans)
    .where(eq(electricityPlans.provider_slug, providerSlug));
  return plans;
}
```

## Phase 2: Update Critical Components (Day 1-2)

### Step 2.1: Provider Pages
**Priority**: CRITICAL

#### Update `src/pages/providers/[provider].astro`
```typescript
// REMOVE:
import { mockProviders } from '../../data/mockData';

// ADD:
import { getProviderBySlug, getProviders } from '@/lib/services/provider-service';

// In getStaticPaths():
const providers = await getProviders();
return providers.map(provider => ({
  params: { provider: provider.slug }
}));

// In component:
const provider = await getProviderBySlug(providerSlug);
```

#### Update `src/pages/_components/ProviderPage.tsx`
```typescript
// REMOVE mock data import
// ADD service layer import
import { useProvider } from '@/hooks/useProvider';

// Replace mock data usage:
const { provider, loading, error } = useProvider(providerId);
```

### Step 2.2: City/State Pages
**Priority**: CRITICAL

#### Components to Update:
- CityPage.tsx
- StatePage.tsx
- CityElectricityPlansPage.tsx
- StateElectricityPlansPage.tsx
- CityElectricityProvidersPage.tsx
- StateElectricityProvidersPage.tsx

**Pattern for Each**:
```typescript
// REMOVE:
import { mockProviders, mockStates } from '@/data/mockData';

// ADD:
import { getCityData, getStateData } from '@/lib/services/location-service';
import { getProvidersForLocation } from '@/lib/services/provider-service';

// Replace in component:
const cityData = await getCityData(city);
const providers = await getProvidersForLocation(city, state);
```

### Step 2.3: Comparison Pages
**Priority**: HIGH

#### Update Compare Components:
- CompareRatesPage.tsx
- ComparePlansPage.tsx
- CompareProvidersPage.tsx

**Implementation**:
```typescript
// Create comparison service
// src/lib/services/comparison-service.ts
export async function getPlansForComparison(criteria: ComparisonCriteria) {
  // Query real plans based on criteria
  const plans = await db.select().from(electricityPlans)
    .where(/* build WHERE clause from criteria */)
    .orderBy(/* sort by rate, term, etc. */);
  return plans;
}
```

## Phase 3: Update Utility Functions (Day 2)

### Step 3.1: Fix Dynamic Counts
**File**: `src/lib/utils/dynamic-counts.ts`

```typescript
// REMOVE:
const { mockProviders } = await import('../../data/mockData');

// ADD:
import { getProviderCount, getPlanCount } from '@/lib/services/stats-service';

// Update functions:
export async function getDynamicCounts() {
  const providerCount = await getProviderCount();
  const planCount = await getPlanCount();
  const cityCount = 881; // From build config
  
  return {
    providers: providerCount,
    plans: planCount,
    cities: cityCount
  };
}
```

## Phase 4: Update Remaining Pages (Day 2-3)

### Step 4.1: Texas-Specific Pages
- TexasElectricityPage.tsx
- TexasCityPage.tsx
- TexasCompaniesPage.tsx
- TexasPlansPage.tsx

### Step 4.2: General Pages
- ShopPage.tsx
- LocationsPage.tsx
- LocationFinderPage.tsx
- CalculatorPage.tsx
- CheapestElectricityLandingPage.tsx

### Step 4.3: Calculator Components
- CalculatorPage.tsx
- RateCalculatorPage.tsx

## Phase 5: Testing & Validation (Day 3-4)

### Step 5.1: Create Test Suite
```typescript
// tests/integration/mock-data-removal.test.ts
describe('Mock Data Removal Validation', () => {
  test('No mock data imports in production code', async () => {
    const files = await glob('src/**/*.{ts,tsx,astro}');
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      expect(content).not.toContain('mockData');
      expect(content).not.toContain('mockProviders');
      expect(content).not.toContain('mockStates');
    }
  });
  
  test('All provider data from real sources', async () => {
    const providers = await getProviders();
    expect(providers.length).toBeGreaterThan(0);
    providers.forEach(provider => {
      expect(provider.id).toMatch(/^[a-f0-9]{24}$/); // Valid MongoDB ObjectId
    });
  });
});
```

### Step 5.2: Manual Testing Checklist
- [ ] All provider pages load with real data
- [ ] City pages show correct providers
- [ ] State pages aggregate correctly
- [ ] Plan comparisons work
- [ ] Calculator uses real rates
- [ ] Order flow still functions
- [ ] No console errors about missing data

## Phase 6: Cleanup (Day 4)

### Step 6.1: Remove Mock Data File
```bash
# Archive mock data (don't delete immediately)
mv src/data/mockData.ts .archive/deprecated/mockData.ts.bak

# Add to .gitignore
echo ".archive/deprecated/mockData.ts.bak" >> .gitignore
```

### Step 6.2: Add Lint Rules
**File**: `.eslintrc.js`
```javascript
module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      patterns: ['**/mockData*', '**/mock*']
    }]
  }
};
```

### Step 6.3: Update Documentation
- Update CLAUDE.md with new data architecture
- Remove references to mock data in README
- Document new service layer

## Implementation Checklist

### Day 1
- [ ] Create service layer files
- [ ] Update provider pages
- [ ] Update 5 most critical city/state pages
- [ ] Test order flow still works

### Day 2
- [ ] Update remaining city/state pages
- [ ] Fix dynamic counts utility
- [ ] Update comparison pages
- [ ] Update calculator pages

### Day 3
- [ ] Update all Texas-specific pages
- [ ] Update general/marketing pages
- [ ] Complete integration tests
- [ ] Manual testing of critical paths

### Day 4
- [ ] Fix any discovered issues
- [ ] Archive mock data file
- [ ] Add lint rules
- [ ] Update documentation

### Day 5 (Buffer)
- [ ] Final testing
- [ ] Performance validation
- [ ] Deployment preparation

## Rollback Plan

If issues arise:
1. Service layer can fall back to mock data temporarily
2. Keep mock data file archived but accessible
3. Feature flag to toggle between mock and real data
4. Gradual rollout by component

## Success Metrics

1. **Zero Mock Data Imports**: `grep -r "mockData" src/` returns 0 results
2. **All Tests Pass**: Integration and E2E tests succeed
3. **Performance Maintained**: Page load times don't increase
4. **Data Accuracy**: Spot checks confirm real data displayed
5. **Order Flow Works**: Can complete full order with real plan IDs

## Risk Mitigation

1. **Data Availability**: Ensure database is seeded before removal
2. **Performance**: Add caching layer if queries are slow
3. **Backwards Compatibility**: Keep service interfaces consistent
4. **Testing**: Comprehensive test coverage before deployment

## Notes

- Mock data in test files is acceptable and should remain
- Consider keeping example/demo components with clearly marked fake data
- Monitor error logs closely after deployment
- Have database backup ready before migration

## Approval Required

This plan requires approval from:
- [ ] Development Lead
- [ ] Product Owner
- [ ] QA Team

Once approved, implementation can begin immediately.