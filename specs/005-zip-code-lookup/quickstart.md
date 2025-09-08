# Quickstart: ZIP Code Lookup Form Integration

**Branch**: `005-zip-code-lookup` | **Date**: 2025-09-06

## Overview
Quick verification guide for ZIP code lookup form integration with existing address validation system.

## Prerequisites
- Development server running (`npm run dev`)
- Database connection established
- Redis cache available
- Existing ZIP validation infrastructure operational

## Test Scenarios

### Scenario 1: Valid ZIP Code Entry
**Purpose**: Verify successful ZIP validation and integration handoff

**Steps**:
1. Navigate to any city page (e.g., `/texas/dallas`)
2. Locate ZIP code lookup form
3. Enter valid Texas ZIP code: `75201`
4. Click "Check Availability" button
5. Verify ZIP validation success
6. Confirm seamless handoff to AddressSearchModal

**Expected Results**:
- ZIP validation completes in <200ms
- TDSP territory displayed: "Oncor Electric Delivery"
- Available plans count shown: >40 plans
- AddressSearchModal opens with ZIP pre-filled
- No page refresh or navigation disruption

### Scenario 2: Invalid ZIP Code Handling
**Purpose**: Verify error handling and user guidance

**Steps**:
1. Navigate to any city page
2. Enter invalid ZIP code: `90210`
3. Submit form
4. Verify error message display
5. Check suggested alternatives shown

**Expected Results**:
- Clear error message: "ZIP code not in Texas service territory"
- Suggested Texas ZIP codes displayed (max 3)
- Form remains accessible for correction
- No broken state or crashes

### Scenario 3: Mobile Device Experience
**Purpose**: Verify responsive design and touch interactions

**Steps**:
1. Open developer tools, switch to mobile view
2. Navigate to city page
3. Test ZIP form on mobile layout
4. Verify touch-friendly interface
5. Complete validation flow

**Expected Results**:
- Form properly sized for mobile screens
- Touch targets appropriately sized (44px minimum)
- Modal integration works on mobile
- Performance remains <500ms total flow

### Scenario 4: Analytics Integration
**Purpose**: Verify form interaction tracking

**Steps**:
1. Open browser developer tools
2. Navigate to city page with ZIP form
3. Interact with form (focus, input, submit)
4. Check network tab for analytics calls
5. Verify data structure

**Expected Results**:
- Form interactions sent to `/api/analytics/form-interaction`
- Proper action types logged (focus, input, submit)
- Device type correctly identified
- Session tracking functional

### Scenario 5: Cache Performance
**Purpose**: Verify caching reduces API load

**Steps**:
1. Clear browser cache
2. Enter ZIP code `75201` (first time)
3. Note response time
4. Enter same ZIP code again
5. Compare response times

**Expected Results**:
- First request: <200ms (API call)
- Subsequent requests: <50ms (cache hit)
- Consistent response format
- Cache TTL respected

## API Testing

### Direct API Validation
```bash
# Test ZIP validation endpoint
curl -X POST "http://localhost:4325/api/zip/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "zipCode": "75201",
    "citySlug": "dallas",
    "sessionId": "quickstart_test"
  }'
```

**Expected Response**:
```json
{
  "zipCode": "75201",
  "isValid": true,
  "tdsp": "Oncor Electric Delivery",
  "citySlug": "dallas",
  "redirectUrl": "/electricity-plans/dallas-tx",
  "availablePlans": 45,
  "errorMessage": null,
  "suggestions": []
}
```

### Analytics API Testing
```bash
# Test analytics endpoint
curl -X POST "http://localhost:4325/api/analytics/form-interaction" \
  -H "Content-Type: application/json" \
  -d '{
    "zipCode": "75201",
    "cityPage": "/texas/dallas",
    "action": "submit",
    "duration": 2500,
    "deviceType": "desktop",
    "success": true,
    "sessionId": "quickstart_test"
  }'
```

**Expected Response**:
```json
{
  "success": true
}
```

## Integration Points Verification

### AddressSearchModal Integration
1. ZIP lookup success → Modal opens automatically
2. ZIP code pre-filled in modal address field
3. Modal retains all existing functionality
4. No disruption to existing address validation flow

### Service Layer Integration
1. ZIP validation uses existing `zip-validation-service.ts`
2. Form interactions tracked via existing analytics service
3. Caching handled by existing Redis infrastructure
4. Error handling consistent with existing patterns

## Performance Benchmarks
- ZIP validation response: <200ms (target)
- Service territory lookup: <300ms (target)
- Total user flow completion: <500ms (target)
- Cache hit response: <50ms
- Analytics tracking: <100ms (non-blocking)

## Rollback Plan
If integration causes issues:
1. Feature toggle to disable ZIP lookup forms
2. Preserve all existing AddressSearchModal functionality
3. Maintain current address validation flow
4. No data loss or service disruption

## Success Criteria
✅ All test scenarios pass  
✅ API endpoints return expected responses  
✅ Performance benchmarks met  
✅ Analytics integration functional  
✅ No regression in existing functionality  
✅ Mobile experience optimized  
✅ Error handling graceful  
✅ Cache performance verified