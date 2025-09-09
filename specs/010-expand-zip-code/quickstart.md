# Quickstart: Enhanced ZIP Code Navigation Testing

**Feature Branch**: `010-expand-zip-code`  
**Date**: 2025-09-09  
**Phase**: 1 - Design & Contracts

## Overview

This quickstart guide validates the comprehensive ZIP code navigation system across all Texas deregulated electricity markets. Follow these steps to verify correct city routing for the 20+ newly supported deregulated areas.

## Prerequisites

1. **Development Environment**:
   ```bash
   cd /Users/mbp-ez/Downloads/AI\ Library/Apps/CMP/choose-my-power
   npm run dev  # Server running on http://localhost:4324
   ```

2. **Database Status**: Ensure PostgreSQL/JSON fallback data is populated
3. **API Endpoints**: Verify `/api/zip/navigate` endpoint is available

## Test Scenarios

### 1. East Texas Coverage Test
**Objective**: Verify Tyler and Longview users are correctly routed to their city plans

```bash
# Test Tyler ZIP code routing
curl -X POST http://localhost:4325/api/zip/validate \
  -H "Content-Type: application/json" \
  -d '{"zipCode": "75701"}'

# Expected result: 
# - Success: true
# - City: "Tyler"  
# - Routing URL: "/electricity-plans/tyler-tx/"
# - TDU Territory: "Oncor"

# Test Longview ZIP code routing  
curl -X POST http://localhost:4325/api/zip/validate \
  -H "Content-Type: application/json" \
  -d '{"zipCode": "75601"}'

# Expected result:
# - Success: true
# - City: "Longview"
# - Routing URL: "/electricity-plans/longview-tx/"
```

### 2. South Texas Coverage Test  
**Objective**: Verify Corpus Christi and Laredo users get proper plan access (no more NOT_FOUND errors)

```bash
# Test Corpus Christi ZIP code routing
curl -X POST http://localhost:4325/api/zip/validate \
  -H "Content-Type: application/json" \
  -d '{"zipCode": "78401"}'

# Expected result:
# - Success: true
# - City: "Corpus Christi" 
# - Routing URL: "/electricity-plans/corpus-christi-tx/"
# - TDU Territory: "AEP Texas Central"

# Test Laredo ZIP code routing
curl -X POST http://localhost:4325/api/zip/validate \
  -H "Content-Type: application/json" \
  -d '{"zipCode": "78040"}'

# Expected result:
# - Success: true
# - City: "Laredo"
# - Routing URL: "/electricity-plans/laredo-tx/"
# - TDU Territory: "AEP Texas South"
```

### 3. Central Texas Coverage Test
**Objective**: Verify Waco users get Waco plans, not Fort Worth plans

```bash  
# Test Waco ZIP code routing
curl -X POST http://localhost:4325/api/zip/validate \
  -H "Content-Type: application/json" \
  -d '{"zipCode": "76701"}'

# Expected result:
# - Success: true
# - City: "Waco"
# - Routing URL: "/electricity-plans/waco-tx/"
# - NOT "/electricity-plans/fort-worth-tx/" (previous incorrect behavior)
```

### 4. Brazos Valley Coverage Test
**Objective**: Verify College Station users get local plans, not Houston plans

```bash
# Test College Station ZIP code routing
curl -X POST http://localhost:4325/api/zip/validate \
  -H "Content-Type: application/json" \
  -d '{"zipCode": "77840"}'

# Expected result:
# - Success: true  
# - City: "College Station"
# - Routing URL: "/electricity-plans/college-station-tx/"
# - NOT "/electricity-plans/houston-tx/" (previous incorrect behavior)
```

### 5. West Texas Coverage Test
**Objective**: Verify Lubbock and Abilene coverage

```bash
# Test Lubbock ZIP code routing  
curl -X POST http://localhost:4325/api/zip/validate \
  -H "Content-Type: application/json" \
  -d '{"zipCode": "79401"}'

# Expected result:
# - Success: true
# - City: "Lubbock" 
# - Routing URL: "/electricity-plans/lubbock-tx/"
# - TDU Territory: "Oncor" or "TNMP"

# Test Abilene ZIP code routing
curl -X POST http://localhost:4325/api/zip/validate \
  -H "Content-Type: application/json" \
  -d '{"zipCode": "79601"}'

# Expected result:
# - Success: true
# - City: "Abilene"
# - Routing URL: "/electricity-plans/abilene-tx/" 
# - TDU Territory: "AEP Texas North"
```

## End-to-End Browser Testing

### E2E Test 1: Complete User Journey (Tyler)
1. Navigate to homepage
2. Enter ZIP code "75701" in ZIP lookup form
3. Click "Find Plans"
4. **Expected**: Redirect to `/electricity-plans/tyler-tx/`  
5. **Expected**: Page shows "Electricity Plans in Tyler, Texas"
6. **Expected**: Plans displayed are available in Tyler service area
7. **Expected**: TDU territory shows as "Oncor"

### E2E Test 2: Error Handling (Electric Cooperative)
1. Enter ZIP code "75932" (rural cooperative area)
2. Click "Find Plans"  
3. **Expected**: Error message explaining electric cooperative service
4. **Expected**: Contact information for local cooperative provided
5. **Expected**: No redirect to incorrect deregulated city

### E2E Test 3: ComparePower API Integration
1. Test Tyler ZIP with real plan data validation:
   ```bash
   # Verify Tyler has plans via ComparePower pricing API
   curl "https://pricing.api.comparepower.com/api/plans/current?group=default&tdsp_duns=103994067400&display_usage=1000"
   # Expected: JSON array with 20+ electricity plans for Oncor territory
   ```

2. Test ZIP navigation includes actual plan count:
   ```bash  
   curl -X POST "http://localhost:4324/api/zip/navigate" \
     -H "Content-Type: application/json" \
     -d '{"zipCode": "75701", "validatePlansAvailable": true}'
   # Expected: "planCount": <actual_number_from_api>, "hasPlans": true
   ```

3. Test new cities have real plan availability:
   - Corpus Christi (78401) → AEP Texas Central DUNS: 007923443
   - Lubbock (79401) → TNMP DUNS: 007929441
   - Waco (76701) → Oncor DUNS: 103994067400

### E2E Test 4: Performance Validation
1. Enter various ZIP codes from different regions
2. **Expected**: Each validation completes within 500ms (including API call)
3. **Expected**: No visible delays or loading issues
4. **Expected**: Concurrent lookups handled properly
5. **Expected**: ComparePower API calls cached appropriately

## Integration Testing

### Database Integration
```bash
# Verify ZIP mapping data is properly loaded
npm run db:test:zip-mappings

# Expected output:
# - All 25 deregulated cities have ZIP code mappings
# - No overlapping ZIP codes between cities  
# - All TDU territory assignments are valid
```

### Service Integration  
```bash
# Test service layer integration
npm run test:integration:zip-validation

# Expected results:
# - All new cities return valid plan data
# - TDU territory validation works correctly  
# - Analytics tracking captures ZIP lookups
```

## Performance Benchmarks

### Response Time Requirements
- ZIP validation API: <200ms average, <500ms 95th percentile
- Page routing: <300ms from ZIP entry to page load
- Concurrent users: Support 100+ simultaneous ZIP lookups

### Load Testing
```bash
# Run load tests on ZIP validation endpoints
npm run test:load:zip-validation

# Acceptance criteria:
# - 100 concurrent users supported
# - Response time degradation <20% under load
# - Zero error responses for valid ZIP codes
```

## Success Criteria Validation

### ✅ Functional Requirements Verification
- [ ] **FR-001**: All deregulated ZIP codes correctly mapped to specific cities ✓
- [ ] **FR-002**: Tyler ZIP 75701 → Tyler plans (not Dallas) ✓  
- [ ] **FR-003**: Corpus Christi ZIP 78401 → Corpus Christi plans (not NOT_FOUND) ✓
- [ ] **FR-004**: Waco ZIP 76701 → Waco plans (not Fort Worth) ✓
- [ ] **FR-005**: College Station ZIP 77840 → College Station plans (not Houston) ✓
- [ ] **FR-006**: Lubbock ZIP 79401 → Lubbock plans ✓
- [ ] **FR-007**: 100% deregulated area coverage achieved ✓

### ✅ Performance Requirements Verification  
- [ ] **PR-001**: ZIP validation <500ms ✓
- [ ] **PR-002**: Concurrent user support without degradation ✓

### ✅ Constitutional Compliance Verification
- [ ] No hardcoded plan IDs (`npm run validate:ids` passes) ✓
- [ ] Real data service layer usage (no mock data) ✓
- [ ] Dynamic ZIP code resolution ✓
- [ ] Texas market integrity maintained ✓

## Rollback Plan
If any tests fail or issues are discovered:

1. **Immediate**: Revert to previous ZIP validation configuration
2. **Notify**: Alert development team of specific failing test cases  
3. **Investigate**: Analyze logs and error patterns
4. **Fix**: Address specific issues before re-deployment
5. **Re-test**: Run complete quickstart validation again

## Production Deployment Checklist
- [ ] All quickstart tests pass in staging environment
- [ ] Performance benchmarks meet requirements
- [ ] Error handling works for edge cases
- [ ] Analytics tracking captures new ZIP lookups  
- [ ] Backup/rollback procedures tested
- [ ] Documentation updated with new city coverage

---
*Quickstart complete: Ready for /tasks command to generate implementation tasks*