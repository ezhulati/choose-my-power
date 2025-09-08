# Quickstart: ZIP Code to City Plans Navigation

**Feature**: Functional ZIP Code to City Plans Navigation
**Purpose**: End-to-end validation scenarios derived from feature specification user stories
**Usage**: Manual testing guide and automated test scenario reference

## User Story Validation Scenarios

### Scenario 1: Successful ZIP Code Navigation (Primary User Story)

**Story**: A potential electricity customer enters their ZIP code and is immediately taken to a comprehensive list of real electricity plans for their city.

#### Steps:
1. **Navigate** to a page with ZIP code entry form
2. **Enter** valid Texas ZIP code (e.g., `75201` for Dallas)
3. **Click** the submit button
4. **Verify** direct redirect to `/electricity-plans/dallas-tx/`
5. **Confirm** page loads fully with real plan data
6. **Validate** no intermediate pages or loading states visible

#### Expected Results:
- ✅ ZIP code validates successfully
- ✅ Button becomes active after ZIP entry
- ✅ Direct navigation to city plans page (no intermediate stops)
- ✅ URL format: `/electricity-plans/{city-slug}-tx/`
- ✅ Full page rendering (no partial loading states)
- ✅ Real electricity plans displayed with current rates
- ✅ Plans match correct TDSP territory for ZIP code

#### Performance Targets:
- ZIP validation: **<200ms**
- Total navigation time: **<500ms**

### Scenario 2: Multi-City ZIP Code Validation

**Story**: User enters ZIP codes from different Texas cities to compare available plans.

#### Test Cases:
| ZIP Code | Expected City | Expected URL | TDSP Territory |
|----------|---------------|--------------|----------------|
| 75201    | Dallas        | `/electricity-plans/dallas-tx/` | Oncor |
| 77001    | Houston       | `/electricity-plans/houston-tx/` | Centerpoint |
| 78701    | Austin        | `/electricity-plans/austin-tx/` | Austin Energy* |
| 76101    | Fort Worth    | `/electricity-plans/fort-worth-tx/` | Oncor |

*Note: Austin may have different market structure - validate current deregulation status

#### Validation Steps:
1. Enter each ZIP code from table above
2. Verify correct city identification
3. Confirm proper URL generation with `-tx` suffix
4. Validate TDSP territory mapping accuracy
5. Ensure plan count > 0 for each city

### Scenario 3: Invalid ZIP Code Handling (Edge Cases)

**Story**: System provides clear error messages for invalid ZIP codes without triggering navigation.

#### Test Cases:

##### 3a: Invalid Format
- **Input**: `1234` (4 digits)
- **Expected**: Error message "Invalid ZIP code format. Please enter a 5-digit ZIP code."
- **Behavior**: Button remains inactive, no navigation

##### 3b: Non-Texas ZIP
- **Input**: `10001` (New York)
- **Expected**: Error message "This ZIP code is outside Texas. Please enter a Texas ZIP code."
- **Suggestions**: "Texas ZIP codes start with 7"
- **Behavior**: No navigation triggered

##### 3c: Regulated Market ZIP
- **Input**: `79901` (El Paso - regulated)
- **Expected**: Error message "This area is served by a regulated utility."
- **Suggestions**: Alternative service information
- **Behavior**: No navigation, proper error handling

##### 3d: No Plans Available
- **Input**: Valid Texas ZIP but no electricity plans
- **Expected**: Error message "No electricity plans available for this area."
- **Behavior**: No navigation to empty plans page

#### Validation Steps:
1. Enter invalid ZIP from test cases above
2. Verify appropriate error message displays
3. Confirm button remains inactive/disabled
4. Ensure no navigation attempt occurs
5. Check suggestions are actionable and helpful

### Scenario 4: Button State Management

**Story**: ZIP code button remains inactive until valid ZIP is entered, providing clear UX feedback.

#### Test Sequence:
1. **Initial State**: Button disabled/inactive
2. **Enter 1 digit**: Button remains disabled
3. **Enter 2-4 digits**: Button remains disabled
4. **Enter 5th digit (invalid ZIP)**: Button remains disabled
5. **Enter valid Texas ZIP**: Button becomes active/enabled
6. **Clear ZIP field**: Button returns to disabled state

#### Validation Points:
- Button visual state changes (disabled/enabled styling)
- Button click functionality (only works when enabled)
- Proper UX feedback (user understands when they can proceed)

### Scenario 5: Full Page Rendering Validation

**Story**: City plans page loads completely without partial rendering states visible to users.

#### Validation Checklist:
- [ ] **Navigation**: Direct transition from ZIP entry to plans page
- [ ] **No Intermediate Pages**: Zero stops at loading/error pages
- [ ] **Complete Rendering**: All plan data loaded before page display
- [ ] **Plan Data**: Real rates and provider information visible
- [ ] **Layout Stability**: No content shifting during load
- [ ] **Error Handling**: Graceful fallbacks if data unavailable

#### Technical Validation:
```typescript
// Page load completion check
expect(document.readyState).toBe('complete');

// Plan data availability
expect(planElements.length).toBeGreaterThan(0);

// No loading indicators visible
expect(loadingSpinners.length).toBe(0);
```

## Quick Test Commands

### Manual Testing URLs:
```bash
# Development server
http://localhost:4324/

# Test ZIP codes for development
75201  # Dallas - high plan availability
77001  # Houston - major metro
78701  # Austin - check deregulation status
```

### API Testing:
```bash
# Test ZIP navigation API directly
curl -X POST http://localhost:4324/api/zip/navigate \
  -H "Content-Type: application/json" \
  -d '{"zipCode": "75201", "validatePlansAvailable": true}'

# Expected response:
# {
#   "success": true,
#   "redirectUrl": "/electricity-plans/dallas-tx/",
#   "cityName": "Dallas",
#   "citySlug": "dallas-tx",
#   "tdspTerritory": "Oncor",
#   "planCount": 47,
#   "validationTime": 145
# }
```

### Contract Test Execution:
```bash
# Run contract tests
npm run test:contract

# Run specific navigation tests
npm run test tests/contract/zip-navigation.test.ts

# Run with coverage
npm run test:coverage -- tests/contract/
```

## Production Readiness Checklist

### Before Release:
- [ ] All quickstart scenarios pass manually
- [ ] Contract tests pass (100% success rate)
- [ ] Performance targets met (<200ms validation, <500ms total)
- [ ] Error handling verified for all edge cases
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness validated
- [ ] Real data validation (no mock data usage)
- [ ] TDSP territory mapping accuracy verified
- [ ] Plan availability validated for major TX cities

### Post-Release Monitoring:
- [ ] ZIP validation response times
- [ ] Navigation success rates
- [ ] Error rates by ZIP code patterns
- [ ] Plan data availability metrics
- [ ] User behavior analytics (ZIP entry → plan views)

## Troubleshooting Guide

### Common Issues:

#### Navigation redirects to `/texas/{city}` instead of `/electricity-plans/{city}-tx/`
- **Cause**: Legacy ZIP lookup API still in use
- **Fix**: Ensure new ZIP validation service is being used
- **Validation**: Check redirect URL format in API response

#### Button remains disabled with valid ZIP
- **Cause**: ZIP validation not recognizing valid Texas ZIP
- **Fix**: Check ZIP validation service configuration
- **Validation**: Test with known-good ZIP codes (75201, 77001)

#### Partial page rendering visible
- **Cause**: Plan data loading delays or failures
- **Fix**: Implement proper loading states and error handling
- **Validation**: Check plan data service reliability

#### Performance below targets
- **Cause**: Database queries, API rate limiting, or network latency
- **Fix**: Optimize data queries and implement caching
- **Validation**: Monitor response times in production

This quickstart guide ensures all user stories from the feature specification are properly validated and provides clear testing procedures for both manual and automated validation.