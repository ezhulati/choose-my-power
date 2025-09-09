# Quickstart Guide: Texas ZIP Code Coverage

**Phase**: 1 - Design & Contracts  
**Date**: September 9, 2025  
**Purpose**: Validation scenarios for 100% Texas ZIP code coverage implementation

## Prerequisites

### System Requirements
- Node.js 18+ with npm
- PostgreSQL database (Neon) access
- Redis cache instance
- External API access (ERCOT, PUCT, TDSP APIs)

### Environment Setup
```bash
# Install dependencies
npm install

# Set environment variables
export DATABASE_URL="postgresql://..."
export REDIS_URL="redis://..."
export ERCOT_API_KEY="your-ercot-key"
export PUCT_API_KEY="your-puct-key"

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

## Validation Scenario 1: Basic ZIP Code Coverage

**Objective**: Verify that all 533 existing ZIP codes still work after enhancement

### Test Steps
1. **Load Existing Mappings**
   ```bash
   # Test current ZIP codes from existing system
   curl "http://localhost:4325/api/zip-lookup?zip=75201"
   # Expected: Success, redirects to Dallas
   
   curl "http://localhost:4325/api/zip-lookup?zip=77001" 
   # Expected: Success, redirects to Houston
   
   curl "http://localhost:4325/api/zip-lookup?zip=78701"
   # Expected: Success, municipal utility message for Austin
   ```

2. **Verify Response Format**
   ```json
   {
     "success": true,
     "zipCode": "75201",
     "city": "dallas",
     "cityDisplayName": "Dallas, TX",
     "redirectUrl": "/electricity-plans/dallas/",
     "municipalUtility": false
   }
   ```

3. **Performance Validation**
   ```bash
   # Measure response times
   time curl "http://localhost:4325/api/zip-lookup?zip=75201"
   # Expected: < 200ms response time
   ```

**Success Criteria**:
- ✅ All 533 existing ZIP codes return valid responses
- ✅ Response time < 200ms for 95% of requests
- ✅ No regression in existing functionality

## Validation Scenario 2: Major Cities Coverage Expansion

**Objective**: Verify new coverage for major Texas cities without ZIP mappings

### Test Cases
1. **Abilene (AEP Texas North Territory)**
   ```bash
   # Test Abilene ZIP codes (previously unmapped)
   curl "http://localhost:4325/api/zip/enhanced-lookup?zipCode=79601"
   # Expected: Success, redirects to Abilene plans page
   
   curl "http://localhost:4325/api/zip/enhanced-lookup?zipCode=79602"
   # Expected: Success, same TDSP territory
   ```

2. **Beaumont (Texas-New Mexico Power Territory)**
   ```bash
   curl "http://localhost:4325/api/zip/enhanced-lookup?zipCode=77701"
   # Expected: Success, redirects to Beaumont plans page
   
   # Verify TDSP mapping
   curl "http://localhost:4325/api/zip/coverage-bulk" -H "Content-Type: application/json" -d '{"zipCodes":["77701","77702"]}'
   # Expected: Both map to TNMP territory
   ```

3. **Corpus Christi (AEP Texas Central Territory)**
   ```bash
   curl "http://localhost:4325/api/zip/enhanced-lookup?zipCode=78401"
   # Expected: Success, redirects to Corpus Christi plans page
   ```

**Success Criteria**:
- ✅ Major cities previously unmapped now have ZIP navigation
- ✅ Correct TDSP territory assignment for each ZIP code
- ✅ Proper redirect URLs to city electricity plans pages

## Validation Scenario 3: Comprehensive Coverage Analysis

**Objective**: Verify 100% coverage of deregulated Texas ZIP codes

### Coverage Metrics Test
```bash
# Get overall coverage statistics
curl "http://localhost:4325/api/zip/coverage-status"
# Expected response:
{
  "success": true,
  "coverageStats": {
    "totalZIPCodes": 25000,
    "mappedZIPCodes": 18000,
    "deregulatedCoverage": 100.0,
    "accuracyScore": 99.9
  }
}
```

### Gap Analysis Test
```bash
# Check for remaining gaps
curl "http://localhost:4325/api/zip/coverage-gaps?limit=10"
# Expected: Only regulated/municipal areas in gaps list
```

### TDSP Distribution Test
```bash
# Verify all major TDSPs represented
curl "http://localhost:4325/api/zip/coverage-status?serviceType=deregulated"
# Expected: Coverage across all 5 major TDSPs
```

**Success Criteria**:
- ✅ 100% coverage of deregulated market ZIP codes
- ✅ Zero gaps in major metropolitan areas
- ✅ Proper classification of municipal vs. deregulated areas

## Validation Scenario 4: External Data Source Integration

**Objective**: Verify real-time integration with authoritative sources

### ERCOT Integration Test
```bash
# Test ERCOT data sync
curl -X POST "http://localhost:4325/api/zip/coverage-sync" -H "Content-Type: application/json" -d '{"sources":["ercot"],"dryRun":true}'
# Expected: Sync initiated, status endpoint provided
```

### Cross-Validation Test
```bash
# Test multi-source validation for high-confidence areas
curl "http://localhost:4325/api/zip/coverage-bulk" -H "Content-Type: application/json" -d '{"zipCodes":["75201","77001","78701"],"validateAccuracy":true}'
# Expected: High confidence scores (95-100)
```

### Conflict Detection Test
```bash
# Test handling of data source conflicts
curl "http://localhost:4325/api/zip/enhanced-lookup?zipCode=76101"
# Expected: Conflict resolution with transparency about sources
```

**Success Criteria**:
- ✅ Real-time integration with ERCOT, PUCT, TDSP APIs
- ✅ Confidence scores reflect multi-source validation
- ✅ Conflicts identified and resolved transparently

## Validation Scenario 5: User Experience Testing

**Objective**: Verify end-to-end user journey improvements

### Previously Failed ZIP Codes
```bash
# Test ZIP codes that previously returned "not found" errors
# but are in deregulated areas

# Amarillo (AEP North - previously unmapped)
curl "http://localhost:4325/api/zip-lookup?zip=79101"
# Expected: Redirect to Amarillo plans page

# Tyler (Oncor - previously unmapped)  
curl "http://localhost:4325/api/zip-lookup?zip=75701"
# Expected: Redirect to Tyler plans page

# Lubbock (AEP North - previously unmapped)
curl "http://localhost:4325/api/zip-lookup?zip=79401"
# Expected: Redirect to Lubbock plans page
```

### Error Handling Test
```bash
# Test invalid ZIP codes
curl "http://localhost:4325/api/zip-lookup?zip=12345"
# Expected: Helpful error with Texas ZIP suggestions

# Test non-deregulated areas
curl "http://localhost:4325/api/zip/enhanced-lookup?zipCode=78701"
# Expected: Municipal utility information for Austin
```

### Mobile/Performance Test
```bash
# Test high-concurrency scenarios
for i in {1..100}; do
  curl "http://localhost:4325/api/zip-lookup?zip=7520$((i%10))" &
done
wait
# Expected: All requests complete successfully under load
```

**Success Criteria**:
- ✅ Previously failing ZIP codes now work successfully
- ✅ Clear, helpful error messages for invalid inputs
- ✅ System handles high concurrency without degradation

## Validation Scenario 6: Data Quality Assurance

**Objective**: Verify accuracy and consistency of ZIP code mappings

### Accuracy Sampling Test
```bash
# Test random sample of ZIP codes against known authorities
curl "http://localhost:4325/api/zip/coverage-bulk" -H "Content-Type: application/json" -d '{
  "zipCodes": ["75201","77001","79601","78401","76101"],
  "validateAccuracy": true
}'
# Expected: 99.9%+ accuracy scores
```

### Consistency Test
```bash
# Test ZIP codes in same city map to same territory
curl "http://localhost:4325/api/zip/coverage-bulk" -H "Content-Type: application/json" -d '{
  "zipCodes": ["75201","75202","75203","75204","75205"]
}'
# Expected: All Dallas ZIP codes map to same TDSP (Oncor)
```

### Plan Availability Test
```bash
# Verify plan count accuracy for major cities
curl "http://localhost:4325/api/zip/enhanced-lookup?zipCode=75201&validatePlans=true"
# Expected: Accurate plan count matching actual availability
```

**Success Criteria**:
- ✅ 99.9% accuracy when validated against authoritative sources
- ✅ Consistent TDSP mapping within city boundaries
- ✅ Accurate plan availability counts

## Monitoring and Maintenance Tests

### Automated Sync Test
```bash
# Verify scheduled sync operations
curl "http://localhost:4325/api/zip/coverage-status" | grep lastUpdated
# Expected: Recent timestamp indicating fresh data
```

### Performance Monitoring
```bash
# Load test with realistic traffic
ab -n 1000 -c 10 "http://localhost:4325/api/zip-lookup?zip=75201"
# Expected: 95% of requests < 200ms
```

### Error Rate Monitoring
```bash
# Check error rates across ZIP code ranges
for zip in 73001 74001 75001 76001 77001 78001 79001; do
  curl "http://localhost:4325/api/zip-lookup?zip=$zip"
done
# Expected: High success rates across all Texas regions
```

**Success Criteria**:
- ✅ Automated data refresh maintains currency
- ✅ Performance maintains constitutional requirements
- ✅ Error rates remain under 5% for valid Texas ZIP codes

## Success Checklist

### Functional Requirements ✅
- [ ] 100% coverage of Texas deregulated market ZIP codes
- [ ] <200ms response time for ZIP lookups
- [ ] 99.9% accuracy validated against authoritative sources
- [ ] Proper TDSP territory assignment for all ZIP codes
- [ ] Clear error messages for invalid or non-deregulated ZIP codes

### User Experience Requirements ✅
- [ ] Previously failing ZIP codes now work correctly
- [ ] Seamless integration with existing ZIP lookup functionality
- [ ] No regression in existing 533 ZIP code mappings
- [ ] Mobile-responsive performance under load

### Technical Requirements ✅
- [ ] Real-time integration with ERCOT, PUCT, TDSP APIs
- [ ] Monthly automated data synchronization
- [ ] Conflict detection and resolution for data source discrepancies
- [ ] Comprehensive logging and analytics for coverage gap analysis

### Constitutional Compliance ✅
- [ ] No hardcoded ZIP codes or city mappings
- [ ] Dynamic resolution from authoritative external sources
- [ ] Database-first architecture with JSON fallbacks
- [ ] Performance standards maintained (<200ms, high concurrency)

## Troubleshooting Guide

### Common Issues

1. **ZIP Code Returns "Not Found" Despite Being in Texas**
   ```bash
   # Debug with enhanced lookup
   curl "http://localhost:4325/api/zip/enhanced-lookup?zipCode=XXXXX&includeFallback=true"
   # Check fallback suggestions and nearest territories
   ```

2. **Performance Degradation**
   ```bash
   # Check cache hit rates
   curl "http://localhost:4325/api/debug/cache-stats"
   # Expected: >80% cache hit rate for frequent ZIP codes
   ```

3. **Data Source Conflicts**
   ```bash
   # Review conflict details
   curl "http://localhost:4325/api/zip/coverage-gaps?priority=high"
   # Examine conflicting sources and resolution recommendations
   ```

## Next Steps

After successful validation:
1. **Production Deployment**: Deploy to production with feature flag
2. **Monitoring Setup**: Configure alerts for coverage gaps and performance
3. **User Testing**: A/B test ZIP navigation success rates
4. **Analytics Review**: Monitor user behavior and conversion improvements

**Estimated Total Validation Time**: 2-3 hours
**Required Team Members**: Developer + QA tester
**Success Rate Target**: 100% of validation scenarios passing