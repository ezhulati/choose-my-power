# Data Model: ZIP Code Lookup Form Integration

**Branch**: `005-zip-code-lookup` | **Date**: 2025-09-06

## Data Model Overview
This feature integrates with existing ZIP validation data models. No new entities are required - all data flows use established types from `src/types/zip-validation.ts`.

## Existing Entities (Reused)

### ZIPValidationResult
**Purpose**: Represents the result of ZIP code validation with service territory information
**Source**: Already defined in `src/types/zip-validation.ts`
**Fields**:
- `zipCode: string` - The 5-digit ZIP code being validated
- `isValid: boolean` - Whether the ZIP code is valid for Texas electricity service
- `tdsp: string | null` - Transmission/Distribution Service Provider territory
- `citySlug: string | null` - Matching city page slug for redirection
- `redirectUrl: string | null` - URL to redirect user to for plan selection
- `availablePlans: number` - Count of available electricity plans
- `errorMessage: string | null` - Error message for invalid ZIP codes
- `suggestions: string[]` - Suggested alternative ZIP codes

**Validation Rules**:
- ZIP code must be 5 digits
- Must be in Texas range (73000-79999)
- Must map to a valid TDSP territory
- Suggestions limited to 3 alternatives maximum

### FormInteraction
**Purpose**: Tracks user interactions with ZIP lookup forms for analytics
**Source**: Already defined in `src/types/zip-validation.ts`
**Fields**:
- `id: string` - Unique interaction identifier
- `zipCode: string` - ZIP code entered by user
- `cityPage: string` - City page where form was accessed
- `action: FormAction` - Type of interaction (focus/input/submit/error/redirect)
- `timestamp: Date` - When the interaction occurred
- `duration: number` - Time spent on the interaction (milliseconds)
- `deviceType: DeviceType` - User's device type (mobile/desktop/tablet)
- `success: boolean` - Whether the interaction was successful
- `sessionId?: string` - Optional session tracking identifier

**State Transitions**:
1. `focus` → User focuses on ZIP input field
2. `input` → User types in ZIP code
3. `submit` → User submits the form
4. `redirect` (success) → Valid ZIP, redirect to plans
5. `error` (failure) → Invalid ZIP, show error message

## Integration Data Flow

### ZIP Lookup → Address Validation Handoff
**Flow**: ZIP validation success → AddressSearchModal integration
**Data Passed**:
- Validated ZIP code
- TDSP territory information
- City/plan context for modal

### Error Handling Data
**Invalid ZIP Scenarios**:
- Format validation errors (non-numeric, wrong length)
- Out-of-Texas ZIP codes
- ZIP codes without TDSP mapping
- ZIP codes with no available plans

**Error Data Structure**:
Uses existing `ZIPValidationResult.errorMessage` and `suggestions` fields for user feedback.

## No New Database Schema Required
This integration feature uses existing database tables and caching infrastructure:
- ZIP validation results cached in Redis using existing patterns
- Form interactions stored using existing analytics database schema
- No migrations or schema changes needed

## Data Consistency Rules
- ZIP validation results must be consistent with existing address validation system
- Form interactions must follow existing analytics data patterns
- Cache TTL values must align with existing ZIP validation service settings
- All data flows must preserve existing ESID lookup functionality