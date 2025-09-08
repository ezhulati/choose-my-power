# Quickstart: ZIP Code Lookup Forms

**Feature**: Add Comprehensive ZIP Code Lookup Forms to City Pages  
**Date**: 2025-09-06  
**Status**: Implementation Ready

## Quick Development Setup

### Prerequisites
- Node.js 18+ installed
- Repository cloned and dependencies installed via `npm install`
- Development server running via `npm run dev`
- Database connection configured (PostgreSQL + Redis)

### Development Workflow

1. **Start Development Server**
   ```bash
   cd /Users/mbp-ez/Downloads/AI\ Library/Apps/CMP/choose-my-power
   npm run dev
   ```

2. **Run Tests in Watch Mode**
   ```bash
   npm run test        # Unit tests
   npm run test:e2e:ui # E2E tests with UI
   ```

3. **Validate Implementation**
   ```bash
   npm run validate:ids  # Ensure no hardcoded IDs
   npm run lint         # Code quality
   npm run perf:test    # Performance validation
   ```

## Feature Validation Tests

### Test Scenario 1: Basic ZIP Code Lookup
**User Story**: User enters valid ZIP code on city page and gets redirected to filtered plans

**Steps**:
1. Navigate to `http://localhost:4324/texas/dallas/`
2. Locate ZIP code lookup form on page
3. Enter ZIP code `75201` (valid Dallas ZIP)
4. Click "Find Plans" button
5. **Expected Result**: Redirected to `/electricity-plans/dallas-tx?zip=75201`
6. **Expected Result**: Page shows plans filtered for ZIP 75201 and Oncor TDSP

**API Test**:
```bash
curl -X POST "http://localhost:4324/api/zip/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "zipCode": "75201",
    "citySlug": "dallas-tx"
  }'

# Expected response: 
# {
#   "zipCode": "75201",
#   "isValid": true,
#   "tdsp": "oncor",
#   "citySlug": "dallas-tx", 
#   "redirectUrl": "/electricity-plans/dallas-tx?zip=75201",
#   "availablePlans": 42
# }
```

### Test Scenario 2: Cross-City ZIP Code Redirection  
**User Story**: User enters ZIP code from different city and gets redirected to correct city

**Steps**:
1. Navigate to `http://localhost:4324/texas/dallas/`
2. Enter ZIP code `77001` (Houston ZIP)
3. Submit form
4. **Expected Result**: Redirected to `/texas/houston/` with success message
5. **Expected Result**: Form pre-filled with `77001` for immediate plan lookup

**API Test**:
```bash
curl -X POST "http://localhost:4324/api/zip/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "zipCode": "77001", 
    "citySlug": "dallas-tx"
  }'

# Expected response:
# {
#   "zipCode": "77001",
#   "isValid": true,
#   "tdsp": "centerpoint",
#   "citySlug": "houston-tx",
#   "redirectUrl": "/texas/houston/?zip=77001"
# }
```

### Test Scenario 3: Invalid ZIP Code Handling
**User Story**: User enters invalid ZIP code and receives helpful error message

**Steps**:
1. Navigate to any city page
2. Enter invalid ZIP code `12345` (not in Texas)
3. Submit form  
4. **Expected Result**: Error message displayed inline
5. **Expected Result**: Suggested Texas ZIP codes shown if applicable
6. **Expected Result**: Form remains on same page for correction

**API Test**:
```bash
curl -X POST "http://localhost:4324/api/zip/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "zipCode": "12345",
    "citySlug": "dallas-tx"
  }'

# Expected response:
# {
#   "zipCode": "12345", 
#   "isValid": false,
#   "tdsp": null,
#   "citySlug": null,
#   "redirectUrl": null,
#   "errorMessage": "ZIP code 12345 is not in Texas electricity service area",
#   "suggestions": ["75201", "75202", "75203"]
# }
```

### Test Scenario 4: Mobile Responsive Behavior
**User Story**: Mobile user can easily interact with ZIP lookup form

**Steps**:
1. Open browser developer tools, set mobile viewport (375x667)
2. Navigate to any city page
3. **Expected Result**: ZIP form is clearly visible and accessible
4. Tap on ZIP code input field
5. **Expected Result**: Numeric keyboard appears on mobile
6. Enter ZIP code with touch interface
7. **Expected Result**: Submit button is large enough for touch interaction
8. **Expected Result**: Form validation messages are readable on mobile

### Test Scenario 5: Analytics Tracking
**User Story**: Form interactions are tracked for business intelligence

**Steps**:
1. Open browser developer tools, check Network tab
2. Navigate to city page and interact with form
3. **Expected Result**: Analytics calls visible in network requests
4. Fill out form and submit
5. **Expected Result**: Form interaction data sent to `/api/analytics/form-interaction`

**API Test**:
```bash
curl -X POST "http://localhost:4324/api/analytics/form-interaction" \
  -H "Content-Type: application/json" \
  -d '{
    "zipCode": "75201",
    "cityPage": "dallas-tx", 
    "action": "submit",
    "deviceType": "desktop",
    "duration": 5000,
    "success": true
  }'

# Expected response:
# {
#   "success": true
# }
```

## Performance Validation

### Core Web Vitals Testing
```bash
# Run performance tests
npm run perf:test:critical

# Expected results:
# - LCP (Largest Contentful Paint): <2.5s
# - FID (First Input Delay): <100ms  
# - CLS (Cumulative Layout Shift): <0.1
# - Form loading time: <50ms
```

### API Response Time Testing
```bash
# Test ZIP validation API performance
time curl -X POST "http://localhost:4324/api/zip/validate" \
  -H "Content-Type: application/json" \
  -d '{"zipCode": "75201", "citySlug": "dallas-tx"}'

# Expected: Response time <200ms
```

## Database Validation

### Check Data Integrity
```bash
# Verify ZIP code data exists
npm run db:health

# Check TDSP mapping completeness  
node -e "
const { getCities } = require('./src/lib/services/city-service');
getCities('texas').then(cities => {
  console.log(\`\${cities.length} cities loaded with ZIP data\`);
  cities.slice(0, 5).forEach(city => {
    console.log(\`\${city.name}: \${city.zipCodes?.length || 0} ZIP codes\`);
  });
});
"
```

### Verify Real Data Usage
```bash
# Constitutional compliance check - no mock data
npm run validate:ids

# Should return: "No hardcoded plan IDs or ESIDs found"

# Check for mock data imports (should return nothing)
grep -r "mockData" src/ --exclude-dir=test || echo "No mock data imports found ✅"
```

## Integration Testing Checklist

### Form Component Integration
- [ ] Form renders correctly on all city pages
- [ ] ZIP code input accepts 5-digit numeric input only
- [ ] Submit button is properly styled with Texas design system  
- [ ] Loading states display during API calls
- [ ] Error messages appear inline with form
- [ ] Success redirections work correctly

### API Integration
- [ ] ZIP validation API responds within 200ms
- [ ] ERCOT integration works for ZIP verification
- [ ] TDSP mapping returns correct utility territories
- [ ] Cross-city redirection logic functions properly
- [ ] Analytics tracking captures form interactions

### Database Integration  
- [ ] ZIP code lookups are stored in PostgreSQL
- [ ] Redis caching improves API response times
- [ ] Service layer handles database unavailability gracefully
- [ ] No mock data is used in any component

### Design System Compliance
- [ ] Texas color system used (texas-navy, texas-red, texas-gold)
- [ ] Mobile-first responsive design implemented
- [ ] Touch-optimized for mobile interactions
- [ ] WCAG AA accessibility standards met
- [ ] Form follows existing UI component patterns

## Deployment Validation

### Pre-Deployment Checklist
```bash
# Build with data generation
npm run build:data:smart

# Run full test suite
npm run test:all

# Security audit
npm run security:audit  

# Performance testing
npm run perf:test

# Constitutional compliance
npm run validate:ids
```

### Post-Deployment Verification
1. **Production Health Check**: All city pages load with ZIP forms
2. **API Functionality**: ZIP validation works in production
3. **Analytics Collection**: Form interactions are being tracked
4. **Performance Metrics**: Core Web Vitals remain within targets
5. **Error Monitoring**: No new errors in application logs

## Troubleshooting

### Common Issues

**Form Not Displaying**
- Check if component is imported correctly in city page templates
- Verify Astro component integration with React hydration
- Check for JavaScript errors in browser console

**ZIP Validation Failing**
- Verify ERCOT API connectivity: `curl https://api.ercot.com/...`
- Check TDSP mapping file integrity
- Validate environment variables for API keys

**Poor Performance**
- Check Redis connection for caching
- Verify database queries are optimized with proper indexing
- Monitor API response times during peak usage

**Cross-City Redirects Not Working**  
- Verify city slug mapping in `/src/config/multi-tdsp-mapping.ts`
- Check ZIP-to-city lookup logic
- Validate URL generation for different cities

### Emergency Rollback Plan
1. **Disable Forms**: Set feature flag to hide forms temporarily
2. **Fallback UI**: Show manual city selection instead of ZIP lookup
3. **API Bypass**: Direct users to existing plan pages without ZIP filtering
4. **Monitor**: Watch error rates and user feedback during rollback