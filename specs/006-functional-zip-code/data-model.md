# Data Model: ZIP Code to City Plans Navigation

**Feature**: Functional ZIP Code to City Plans Navigation
**Phase**: 1 - Design & Contracts
**Source**: Extracted from feature specification requirements

## Core Entities

### 1. **ZIP Code**
**Purpose**: 5-digit postal code input that maps to Texas cities and TDSP territories

**Fields**:
- `code`: string (5 digits, e.g., "75201")
- `isValid`: boolean (US ZIP code format validation)
- `isTexas`: boolean (starts with 7)
- `isDeregulated`: boolean (in Texas deregulated electricity market)

**Validation Rules**:
- FR-001: Must be exactly 5 digits
- FR-006: Invalid ZIP codes must trigger error messaging without navigation
- Must pass Texas deregulated market validation

**State Transitions**:
- `entered` → `validating` → `valid|invalid`
- Only `valid` state allows navigation trigger

### 2. **Texas City**
**Purpose**: Municipal area with electricity deregulation that serves as navigation destination

**Fields**:
- `name`: string (e.g., "Dallas", "Houston")
- `slug`: string (URL-safe identifier, e.g., "dallas-tx", "houston-tx")
- `zipCodes`: string[] (list of ZIP codes in this city)
- `tdspTerritory`: string (transmission provider service area)
- `hasElectricityPlans`: boolean (plan data availability)

**Validation Rules**:
- FR-002: Must map correctly from ZIP codes using real geographic data
- City slug must follow format: `{city-name}-tx`
- Must be in Texas deregulated market

**Relationships**:
- One city contains multiple ZIP codes
- One city maps to one TDSP territory
- One city has many electricity plans

### 3. **TDSP Territory**
**Purpose**: Transmission and Distribution Service Provider service area that determines plan availability

**Fields**:
- `name`: string (e.g., "Oncor", "Centerpoint", "AEP Texas")
- `serviceArea`: string[] (list of cities served)
- `zipCodePrefixes`: string[] (ZIP code patterns served)
- `planCount`: number (available plans in this territory)

**Validation Rules**:
- Must accurately reflect Texas utility territory boundaries
- Plan availability must be determined by TDSP territory

**Relationships**:
- One TDSP serves multiple cities
- One TDSP serves specific ZIP code ranges
- Each TDSP has associated electricity plans

### 4. **Electricity Plan**
**Purpose**: Real rate plan with current pricing from providers serving the TDSP territory

**Fields**:
- `id`: string (MongoDB ObjectId - dynamically resolved)
- `name`: string (plan name)
- `provider`: string (electricity provider name)
- `rate`: number (current rate in cents per kWh)
- `tdsp`: string (associated TDSP territory)
- `contractLength`: number (months)

**Validation Rules**:
- FR-004: Must be real data from correct TDSP/TDU territory
- No hardcoded plan IDs (constitutional requirement)
- Must have current rates (not mock or stale data)

**Relationships**:
- Plans belong to one TDSP territory
- Plans available for cities in that TDSP territory
- Plans displayed on city-specific pages

### 5. **City Plans Page**
**Purpose**: Destination URL showing comprehensive list of available electricity plans for specific city

**Fields**:
- `url`: string (format: `/electricity-plans/{city-slug}-tx/`)
- `citySlug`: string (matches Texas City slug)
- `planCount`: number (number of plans available)
- `isFullyRendered`: boolean (no partial loading states visible)

**Validation Rules**:
- FR-003: Must use format `/electricity-plans/{city-slug}-tx/`
- FR-005: Must ensure full page rendering
- FR-007: No broken redirects or 404 errors

**State Transitions**:
- `loading` → `ready` (full render complete)
- No intermediate states visible to users

## Data Flow Relationships

### ZIP Code → City Mapping
```
ZIP Code (75201) 
→ Validation Service 
→ Geographic Lookup 
→ Texas City (dallas-tx)
→ URL Generation (/electricity-plans/dallas-tx/)
```

### City → Plans Loading
```
Texas City (dallas-tx)
→ TDSP Territory Lookup (Oncor)
→ Plan Service Query
→ Electricity Plans (filtered by TDSP)
→ City Plans Page (full render)
```

## Validation Schema Definitions

### ZIP Code Validation
```typescript
interface ZipCodeValidation {
  code: string;           // 5-digit ZIP
  isValid: boolean;       // Format validation
  isTexas: boolean;       // Starts with 7
  isDeregulated: boolean; // In deregulated market
  errorMessage?: string;  // If invalid
}
```

### City Resolution
```typescript
interface CityResolution {
  zipCode: string;        // Input ZIP
  cityName: string;       // Human readable name
  citySlug: string;       // URL slug with -tx suffix
  tdspTerritory: string;  // Service provider
  planCount: number;      // Available plans
  redirectUrl: string;    // Final destination URL
}
```

### Navigation Result
```typescript
interface NavigationResult {
  success: boolean;       // Navigation completed
  finalUrl: string;       // Where user landed
  loadTime: number;       // Total navigation time
  isFullyRendered: boolean; // No partial states
  errorDetails?: string;  // If failed
}
```

## Business Rules

### Navigation Flow Rules
1. **No Intermediate Pages**: Direct ZIP → city plans page navigation
2. **Real Data Only**: All displayed plans must be current, real rate data
3. **Full Rendering**: No partial loading states visible to users
4. **Error Containment**: Invalid ZIP errors don't trigger navigation

### Data Consistency Rules
1. **City Slug Format**: All city slugs must include `-tx` suffix
2. **URL Pattern**: All plans pages must use `/electricity-plans/{slug}/` format
3. **TDSP Accuracy**: ZIP → TDSP mapping must reflect actual utility territories
4. **Plan Currency**: All rate data must be current (not stale or mock)

### Performance Requirements
1. **ZIP Validation**: <200ms response time
2. **Total Navigation**: <500ms from ZIP entry to full page load
3. **Plan Loading**: Pre-validated data availability before navigation
4. **Error Recovery**: Graceful fallback without user-visible failures

This data model ensures constitutional compliance with real data architecture and dynamic plan ID resolution while meeting all functional requirements from the feature specification.