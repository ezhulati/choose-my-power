# Data Model: ZIP Code Lookup Forms

**Feature**: Add Comprehensive ZIP Code Lookup Forms to City Pages  
**Date**: 2025-09-06  
**Status**: Design Complete

## Core Entities

### 1. ZIPCodeLookup
**Purpose**: Represents a ZIP code lookup form submission
**Fields**:
- `id`: string (UUID) - Unique submission identifier
- `zipCode`: string (5 digits) - User-entered ZIP code
- `citySlug`: string - Source city page (e.g., "dallas-tx")
- `timestamp`: Date - When submission occurred
- `isValid`: boolean - Whether ZIP code is valid for Texas
- `tdspId`: string | null - Associated TDSP if valid
- `redirectUrl`: string | null - Target URL for successful submission
- `errorCode`: string | null - Error code for failed validation
- `userAgent`: string - Browser/device information
- `sessionId`: string - User session identifier

**Validation Rules**:
- `zipCode` must be exactly 5 digits
- `citySlug` must match existing Texas city
- `tdspId` must exist in TDSP mapping when valid
- `timestamp` must be within reasonable range (not future)

**State Transitions**:
- Initial → Validating → Valid/Invalid → Redirected/Error

### 2. ZIPValidationResult
**Purpose**: Response from ZIP code validation API
**Fields**:
- `zipCode`: string (5 digits) - Validated ZIP code
- `isValid`: boolean - Validation result
- `tdsp`: string | null - Associated utility territory
- `citySlug`: string | null - Correct city for this ZIP
- `availablePlans`: number - Count of plans available
- `errorMessage`: string | null - Human-readable error
- `suggestions`: string[] - Alternative ZIP codes if applicable

**Validation Rules**:
- `zipCode` format must be validated
- `tdsp` must exist in mapping table when provided
- `citySlug` must be valid Texas city when provided

### 3. FormInteraction
**Purpose**: Analytics tracking for form usage
**Fields**:
- `id`: string (UUID) - Unique interaction identifier
- `zipCode`: string (5 digits) - User input
- `cityPage`: string - Source city page
- `action`: string - User action (focus, input, submit, error)
- `timestamp`: Date - When action occurred
- `duration`: number - Time spent on form (milliseconds)
- `deviceType`: string - Mobile/desktop/tablet
- `success`: boolean - Whether interaction succeeded

**Validation Rules**:
- `action` must be from predefined list
- `duration` must be positive number
- `deviceType` must be from predefined list

## Entity Relationships

```
ZIPCodeLookup (1) → (1) ZIPValidationResult
  - Links via zipCode field
  - Validation result determines redirect behavior

ZIPCodeLookup (1) → (*) FormInteraction  
  - Multiple interactions per lookup session
  - Tracks user behavior throughout submission

City (1) → (*) ZIPCodeLookup
  - Each city page generates multiple lookups
  - Links via citySlug field

TDSP (1) → (*) ZIPValidationResult
  - Each utility territory serves multiple ZIP codes
  - Links via tdsp field
```

## Data Flow Patterns

### 1. ZIP Code Submission Flow
```
User Input → Form Validation → API Call → TDSP Resolution → Plan Redirect
     ↓              ↓              ↓              ↓              ↓
FormInteraction → ZIPCodeLookup → ZIPValidationResult → Analytics → Success
```

### 2. Cross-City Redirection Flow
```
ZIP Code → City Mismatch Detection → Correct City Lookup → Redirect URL Generation
     ↓              ↓                        ↓                     ↓
ZIPCodeLookup → City Resolution → ZIPValidationResult → FormInteraction
```

### 3. Error Handling Flow
```
Invalid ZIP → Error Detection → Suggestion Generation → User Feedback
     ↓              ↓                    ↓                   ↓
ZIPCodeLookup → Error Code → ZIPValidationResult → FormInteraction
```

## Storage Considerations

### Primary Storage (PostgreSQL)
- `zip_lookups` table for ZIPCodeLookup entities
- `form_interactions` table for analytics
- Indexed on `zipCode`, `citySlug`, `timestamp`
- Partitioned by date for performance

### Caching Layer (Redis)
- ZIP-to-TDSP mappings (1 hour TTL)
- City-to-ZIP mappings (24 hour TTL)
- Validation results (15 minute TTL)
- Error message templates (no expiration)

### Fallback Storage (JSON)
- Generated ZIP code data per city
- Static TDSP mapping files
- City-specific valid ZIP lists
- Located in `/src/data/generated/`

## Integration Points

### Existing Systems
- **ERCOT API**: `/api/ercot/validate` for ZIP verification
- **TDSP Mapping**: `/src/config/multi-tdsp-mapping.ts`
- **Plan Service**: `/src/lib/services/provider-service.ts`
- **City Service**: `/src/lib/services/city-service.ts`

### New API Endpoints
- `POST /api/zip/validate` - Validate ZIP code
- `GET /api/zip/city/{citySlug}` - Get valid ZIPs for city
- `POST /api/analytics/form-interaction` - Track form usage

## Performance Requirements

### Response Times
- ZIP validation: <200ms
- City redirection: <100ms
- Form rendering: <50ms
- Analytics tracking: <25ms (async)

### Caching Strategy
- Hot ZIP codes cached in Redis
- City mappings preloaded on server start
- Validation results cached with TTL
- Analytics buffered and batched

### Database Indexing
```sql
-- Primary indexes
CREATE INDEX idx_zip_lookups_zip ON zip_lookups(zipCode);
CREATE INDEX idx_zip_lookups_city ON zip_lookups(citySlug);
CREATE INDEX idx_zip_lookups_timestamp ON zip_lookups(timestamp);

-- Composite indexes for common queries
CREATE INDEX idx_zip_lookups_city_timestamp ON zip_lookups(citySlug, timestamp);
CREATE INDEX idx_form_interactions_analytics ON form_interactions(cityPage, action, timestamp);
```

## Validation Rules Summary

### Client-Side Validation
- ZIP code format: exactly 5 digits
- Required field validation
- Basic format checking before submission

### Server-Side Validation
- ZIP code exists in USPS database
- ZIP code corresponds to Texas utility territory
- City slug matches existing city pages
- TDSP assignment is valid and current

### Business Rules
- ZIP codes must be in Texas
- Each ZIP code maps to exactly one primary TDSP
- Cross-city redirections preserve user intent
- Error messages provide helpful suggestions
- Analytics respect user privacy settings

## Security Considerations

### Input Sanitization
- ZIP code restricted to 5-digit pattern
- City slug validated against whitelist
- User agent string sanitized
- SQL injection prevention via parameterized queries

### Rate Limiting
- 10 requests per minute per IP for ZIP validation
- 100 form interactions per hour per session
- Exponential backoff for repeated failures

### Privacy Protection
- No PII stored in ZIP lookups
- Session IDs anonymized after 24 hours
- Analytics data aggregated for reporting
- GDPR compliance for EU visitors