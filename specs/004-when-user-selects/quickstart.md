# Quickstart Guide: Address ESID Validation

**Feature**: Address ESID Validation for Plan Selection
**Date**: 2025-09-06

## Overview

This quickstart guide walks through the complete address validation and ESID lookup flow for electricity plan enrollment. Follow these steps to test the feature end-to-end.

## Prerequisites

- Development server running (`npm run dev`)
- ERCOT API integration configured
- USPS API key registered (for address validation)
- Redis cache available for performance
- Test plan ID available (dynamically resolved MongoDB ObjectId)

## Quick Test Scenarios

### Scenario 1: Successful Address Validation and ESID Lookup

**User Story**: Customer selects a plan and enters a valid Dallas address

```bash
# Step 1: Validate address
curl -X POST http://localhost:4325/api/address/validate \
  -H "Content-Type: application/json" \
  -d '{
    "street": "123 Main Street",
    "city": "Dallas", 
    "state": "TX",
    "zipCode": "75201",
    "sessionId": "test-session-001"
  }'

# Expected Response (200):
{
  "success": true,
  "originalAddress": {
    "street": "123 Main Street",
    "city": "Dallas",
    "state": "TX", 
    "zipCode": "75201"
  },
  "standardizedAddress": {
    "street": "123 Main St",
    "city": "Dallas",
    "state": "TX",
    "zipCode": "75201",
    "zipPlus4": "1234"
  },
  "validationStatus": "CORRECTED",
  "confidence": 0.95,
  "suggestions": [],
  "canRetry": false
}
```

```bash
# Step 2: Lookup ESID for standardized address  
curl -X POST http://localhost:4325/api/esid/lookup \
  -H "Content-Type: application/json" \
  -d '{
    "address": {
      "street": "123 Main St",
      "city": "Dallas",
      "state": "TX",
      "zipCode": "75201",
      "zipPlus4": "1234"
    },
    "planId": "60c72b2f4f1a4c0015e8b123",
    "sessionId": "test-session-001"
  }'

# Expected Response (200):
{
  "success": true,
  "address": { /* standardized address */ },
  "esid": "10752010001234567",
  "lookupStatus": "FOUND", 
  "tdspId": "oncor",
  "serviceStatus": "ACTIVE",
  "meterType": "RESIDENTIAL"
}
```

```bash
# Step 3: Check plan availability at ESID
curl -X POST http://localhost:4325/api/plan/availability \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "60c72b2f4f1a4c0015e8b123",
    "esid": "10752010001234567", 
    "address": {
      "street": "123 Main St",
      "city": "Dallas", 
      "state": "TX",
      "zipCode": "75201"
    },
    "sessionId": "test-session-001"
  }'

# Expected Response (200):
{
  "success": true,
  "planId": "60c72b2f4f1a4c0015e8b123",
  "esid": "10752010001234567",
  "available": true,
  "availabilityStatus": "AVAILABLE",
  "tdspCompatibility": {
    "requiredTdsp": "oncor",
    "actualTdsp": "oncor", 
    "compatible": true
  },
  "enrollmentUrl": "https://compare-power.com/enroll?plan=60c72b2f4f1a4c0015e8b123&esid=10752010001234567",
  "estimatedActivation": "1-3 business days"
}
```

### Scenario 2: Address Validation Failure with Suggestions

**User Story**: Customer enters an incomplete or ambiguous address

```bash
# Test with incomplete address
curl -X POST http://localhost:4325/api/address/validate \
  -H "Content-Type: application/json" \  
  -d '{
    "street": "123 Main",
    "city": "Dallas",
    "state": "TX", 
    "zipCode": "75201"
  }'

# Expected Response (200):
{
  "success": false,
  "originalAddress": { /* user input */ },
  "validationStatus": "AMBIGUOUS",
  "confidence": 0.6,
  "suggestions": [
    {
      "street": "123 Main Street",
      "city": "Dallas",
      "state": "TX",
      "zipCode": "75201"
    },
    {
      "street": "123 Main Ave", 
      "city": "Dallas",
      "state": "TX",
      "zipCode": "75201"
    }
  ],
  "errorMessage": "Multiple addresses found. Please select the correct one.",
  "canRetry": true
}
```

### Scenario 3: ESID Not Found (New Construction)

**User Story**: Customer enters valid address but no ESID exists yet

```bash
# Test ESID lookup for new construction
curl -X POST http://localhost:4325/api/esid/lookup \
  -H "Content-Type: application/json" \
  -d '{
    "address": {
      "street": "999 New Construction Blvd",
      "city": "Plano",
      "state": "TX", 
      "zipCode": "75023"
    },
    "planId": "60c72b2f4f1a4c0015e8b123"
  }'

# Expected Response (200):  
{
  "success": false,
  "address": { /* input address */ },
  "lookupStatus": "NEW_CONSTRUCTION",
  "errorMessage": "No electric service found at this address",
  "suggestedActions": [
    "Contact the utility company to establish service",
    "Verify the address with your builder or landlord"
  ]
}
```

### Scenario 4: Plan Not Available (Wrong Territory)

**User Story**: Customer's ESID is in different TDSP territory than plan requires

```bash
# Test plan availability check with territory mismatch
curl -X POST http://localhost:4325/api/plan/availability \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "60c72b2f4f1a4c0015e8b123",
    "esid": "10770010001234567",
    "includeAlternatives": true
  }'

# Expected Response (200):
{
  "success": false,
  "planId": "60c72b2f4f1a4c0015e8b123", 
  "esid": "10770010001234567",
  "available": false,
  "availabilityStatus": "UNAVAILABLE_TERRITORY",
  "reason": "Plan only available in Oncor territory, but this address is served by CenterPoint",
  "tdspCompatibility": {
    "requiredTdsp": "oncor",
    "actualTdsp": "centerpoint",
    "compatible": false
  },
  "alternativePlans": [
    {
      "planId": "60c72b2f4f1a4c0015e8b456", 
      "planName": "Green Choice 12",
      "providerName": "Reliant Energy",
      "rate": 12.8,
      "termMonths": 12,
      "reason": "Similar rate, available in CenterPoint territory"
    }
  ]
}
```

## Frontend Integration Test

### React Component Integration

```typescript
// Test the complete flow with React components
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddressValidationForm from '../src/components/ui/AddressValidationForm';

test('complete address validation and ESID lookup flow', async () => {
  render(<AddressValidationForm 
    planId="60c72b2f4f1a4c0015e8b123" 
    onComplete={(result) => console.log(result)}
  />);
  
  // Enter address
  fireEvent.change(screen.getByLabelText('Street Address'), {
    target: { value: '123 Main Street' }
  });
  fireEvent.change(screen.getByLabelText('City'), {
    target: { value: 'Dallas' }
  });
  fireEvent.change(screen.getByLabelText('ZIP Code'), {
    target: { value: '75201' }
  });
  
  // Submit form
  fireEvent.click(screen.getByText('Validate Address'));
  
  // Wait for validation to complete
  await waitFor(() => {
    expect(screen.getByText('Address validated successfully')).toBeInTheDocument();
  });
  
  // ESID should be displayed
  expect(screen.getByText(/ESID: 10752010001234567/)).toBeInTheDocument();
  
  // Plan availability should be confirmed  
  expect(screen.getByText('Plan available at this location')).toBeInTheDocument();
});
```

## Performance Validation

### Response Time Testing

```bash
# Test API response times (should be <200ms for address validation)
time curl -X POST http://localhost:4325/api/address/validate \
  -H "Content-Type: application/json" \
  -d '{"street":"123 Main St","city":"Dallas","state":"TX","zipCode":"75201"}'

# Test ESID lookup performance (should be <300ms)
time curl -X POST http://localhost:4325/api/esid/lookup \
  -H "Content-Type: application/json" \
  -d '{"address":{"street":"123 Main St","city":"Dallas","state":"TX","zipCode":"75201"}}'
```

### Load Testing  

```bash
# Test concurrent validation requests
for i in {1..10}; do
  curl -X POST http://localhost:4325/api/address/validate \
    -H "Content-Type: application/json" \
    -d '{"street":"123 Main St","city":"Dallas","state":"TX","zipCode":"75201"}' &
done
wait
```

## Error Scenarios Testing

### Rate Limiting
```bash
# Test rate limiting (should return 429 after threshold)
for i in {1..50}; do
  curl -X POST http://localhost:4325/api/address/validate \
    -H "Content-Type: application/json" \
    -d '{"street":"test","city":"test","state":"TX","zipCode":"75201"}'
done
```

### Invalid Input
```bash
# Test validation errors
curl -X POST http://localhost:4325/api/address/validate \
  -H "Content-Type: application/json" \
  -d '{"street":"","city":"","state":"CA","zipCode":"invalid"}'

# Expected: 400 Bad Request with validation details
```

## Success Criteria

- ✅ Address validation completes in <200ms
- ✅ ESID lookup completes in <300ms  
- ✅ Plan availability check completes in <100ms
- ✅ End-to-end flow completes in <500ms
- ✅ Error responses provide actionable user guidance
- ✅ Alternative suggestions work for ambiguous addresses
- ✅ TDSP territory validation prevents incorrect enrollments
- ✅ All ESIDs are dynamically generated (no hardcoded values)

## Troubleshooting

### Common Issues
- **USPS API errors**: Check API key configuration
- **ERCOT timeouts**: Implement exponential backoff 
- **Redis cache misses**: Verify Redis connection
- **Plan ID not found**: Ensure MongoDB ObjectId is valid and current

### Debugging Commands
```bash
# Check API logs
grep "address-validation" logs/application.log

# Verify cache status
redis-cli info stats

# Test ERCOT connectivity  
curl -X GET "https://ercot-api.com/health"
```

---

**Status**: ✅ Complete end-to-end testing scenarios defined
**Next**: Implementation task generation via `/tasks` command