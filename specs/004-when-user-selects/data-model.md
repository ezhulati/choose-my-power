# Phase 1: Data Model Design

**Feature**: Address ESID Validation for Plan Selection
**Date**: 2025-09-06

## Entity Overview

This feature introduces four core entities that work together to validate user addresses and retrieve ESIDs for electricity plan enrollment.

## Entity Definitions

### 1. ServiceAddress

**Purpose**: Represents a complete physical address where electricity service is provided

**Key Attributes**:
- `street`: Street number and name (e.g., "123 Main Street")
- `unit`: Optional apartment/unit number (e.g., "Apt 4B")  
- `city`: City name (e.g., "Dallas")
- `state`: State abbreviation (always "TX" for Texas)
- `zipCode`: 5-digit ZIP code (e.g., "75201")
- `zipPlus4`: Optional ZIP+4 extension (e.g., "1234")

**Validation Rules**:
- Street address is required and must be non-empty
- City is required and must be valid Texas city
- State must be "TX" 
- ZIP code must be 5 digits and within Texas range (73000-79999)
- Unit number is optional but validated if provided

**State Transitions**:
1. **Raw** → User enters address components
2. **Validating** → USPS standardization in progress  
3. **Standardized** → USPS has corrected/confirmed address
4. **Invalid** → Address cannot be validated or corrected

**Relationships**:
- Has one ESID (retrieved after validation)
- Associated with one Plan Selection context
- May have multiple AddressSuggestions if ambiguous

### 2. ESID (Electric Service Identifier)

**Purpose**: Unique 17-digit identifier for each electric service point, dynamically generated from address

**Key Attributes**:
- `esid`: 17-digit identifier string (e.g., "10123456789012345")
- `serviceAddress`: Associated validated address
- `tdspId`: Transmission/Distribution Service Provider ID
- `serviceStatus`: Current service status (active, inactive, pending)
- `meterType`: Type of electric meter (residential, commercial)

**Validation Rules**:
- ESID must be exactly 17 digits
- Must be dynamically generated via ERCOT API (constitutional requirement)
- Cannot be hardcoded or cached permanently
- TDSP ID must match address location

**State Transitions**:
1. **Unknown** → No ESID lookup attempted yet
2. **Looking Up** → ERCOT API call in progress
3. **Found** → Valid ESID retrieved from ERCOT
4. **Not Found** → No ESID exists for this address
5. **Service Inactive** → ESID exists but service disconnected

**Relationships**:  
- Belongs to one ServiceAddress
- Used to validate PlanAvailability
- Links to TDSP mapping system

### 3. PlanAvailability  

**Purpose**: Represents whether a selected electricity plan is available at a specific ESID location

**Key Attributes**:
- `planId`: Selected plan identifier (dynamic MongoDB ObjectId)
- `esid`: Target service location identifier  
- `available`: Boolean availability status
- `reason`: Explanation if unavailable
- `alternativePlans`: Suggested plans if current unavailable
- `effectiveDate`: When availability status was determined

**Validation Rules**:
- Plan ID must be valid MongoDB ObjectId (constitutional requirement)
- ESID must be validated before checking availability
- Availability reason required if not available
- Alternative plans must be from same provider or compatible

**State Transitions**:
1. **Pending** → Availability check not started
2. **Checking** → TDSP territory validation in progress  
3. **Available** → Plan serves this ESID location
4. **Unavailable** → Plan does not serve this location
5. **Error** → Unable to determine availability

**Relationships**:
- References one electricity plan (by dynamic ID)
- Associated with one ESID
- May suggest alternative plans

### 4. AddressValidationResult

**Purpose**: Comprehensive response containing validation status, corrections, and next steps

**Key Attributes**:
- `originalAddress`: User's entered address
- `standardizedAddress`: USPS-corrected address (if successful)
- `validationStatus`: Success/failure status
- `suggestions`: Alternative address corrections
- `esidResult`: Associated ESID lookup result
- `planAvailability`: Plan availability at this address
- `errorMessages`: User-friendly error descriptions
- `retryOptions`: Available retry/correction actions

**Validation Rules**:
- Original address must be preserved for user reference
- Standardized address required only if validation successful
- Suggestions array may be empty or contain multiple options
- Error messages must be user-friendly (no technical codes)

**State Transitions**:
1. **Initialized** → Created with user input
2. **Validating** → Address standardization in progress
3. **Validated** → Address confirmed and ESID retrieved
4. **Failed** → Validation failed with corrections available
5. **Completed** → Full validation including plan availability

**Relationships**:
- Contains one ServiceAddress (original and standardized)
- May contain one ESID result
- May contain one PlanAvailability result
- May contain multiple AddressSuggestions

## Data Flow Relationships

```
User Input (ServiceAddress)
    ↓
AddressValidationResult (initialized)
    ↓  
USPS Validation (standardized address)
    ↓
ERCOT Lookup (ESID generation)
    ↓
TDSP Mapping (plan availability)
    ↓
Final Result (complete validation)
```

## Validation Schema Design

### Address Validation Pipeline
1. **Format Validation**: Required fields, basic format checks
2. **USPS Standardization**: Official address correction
3. **ERCOT ESID Lookup**: Dynamic ESID generation  
4. **TDSP Territory Check**: Plan service area validation
5. **Result Compilation**: Comprehensive response generation

### Error Handling Strategy
- **Validation Errors**: Clear user messages with correction suggestions
- **API Errors**: Graceful degradation with retry options
- **Not Found**: Helpful guidance for address entry
- **Service Unavailable**: Fallback validation methods

## Performance Considerations

### Caching Strategy
- **ESID Lookups**: 15-minute Redis cache (balance freshness vs. performance)
- **Address Standardization**: 24-hour cache for valid addresses
- **Plan Availability**: 1-hour cache (plans change infrequently)

### Database Storage
- **Operational Data**: Full details for 90 days (customer support)
- **Analytics Data**: Anonymized success/failure patterns (2 years)
- **PII Handling**: Automated scrubbing after retention period

### API Integration Points
- **ERCOT API**: Existing integration patterns at `/api/ercot/validate`
- **USPS API**: New integration requiring API key management
- **TDSP Mapping**: Leverage existing utility territory system

---

**Status**: ✅ Entity models designed with validation rules and relationships
**Next**: API contract generation and test scenario creation