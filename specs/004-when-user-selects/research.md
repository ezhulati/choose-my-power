# Phase 0: Research & Technical Decisions

**Feature**: Address ESID Validation for Plan Selection
**Date**: 2025-09-06

## Research Summary

This document resolves all NEEDS CLARIFICATION items from the feature specification and establishes technical foundations for implementation.

## Decision Matrix

### 1. ESID API Provider Selection

**Decision**: ERCOT Web Services API (Public Utility Commission of Texas)

**Rationale**:
- Official source of truth for all Texas electric service identifiers
- Real-time data directly from ERCOT's central registry
- No intermediary services or data lag
- Supports constitutional requirement for dynamic ESID generation
- Existing integration patterns in the codebase at `src/pages/api/ercot/validate.ts`

**Alternatives Considered**:
- Third-party utility data providers: Rejected due to potential data lag and additional cost
- Manual ESID database: Rejected due to maintenance overhead and constitutional violation (would enable hardcoded ESIDs)
- Utility company APIs: Rejected due to fragmentation across multiple TDSPs

**Implementation Notes**:
- Use existing ERCOT API client patterns
- Implement caching layer for ESID lookups (15-minute TTL)
- Handle rate limiting with exponential backoff

### 2. Address Validation Service

**Decision**: USPS Address Validation Web API with geocoding fallback

**Rationale**:
- Official US postal service validation ensures standardized addresses
- Required for accurate ERCOT ESID lookup (exact address matching)
- Supports apartment/unit number validation (multi-unit addresses)
- Integrates with existing address handling in `src/lib/models/address.ts`

**Alternatives Considered**:
- Google Maps Geocoding API: More expensive, overkill for address validation
- Commercial services (Melissa, SmartyStreets): Additional vendor dependency
- ZIP+4 validation only: Insufficient for ESID lookup accuracy

**Implementation Notes**:
- Primary: USPS API for address standardization
- Fallback: Simple format validation if USPS unavailable
- Cache valid addresses for 24 hours to reduce API calls

### 3. Validation Failure Behavior

**Decision**: Progressive enhancement with intelligent suggestions and retry options

**Rationale**:
- Improves user experience with guided error correction
- Reduces customer service load from address validation failures
- Supports constitutional requirement for clear user feedback
- Aligns with existing error handling patterns in ZIP validation feature

**Alternatives Considered**:
- Simple error messages: Poor UX, high abandonment rate
- Manual review queue: Too slow for real-time plan selection
- Customer service escalation: Not scalable

**Implementation Flow**:
1. **Format Validation**: Check required fields and basic format
2. **USPS Standardization**: Attempt address correction
3. **ERCOT Lookup**: Validate ESID exists for standardized address
4. **Plan Territory Check**: Verify selected plan serves this ESID
5. **Error Recovery**: Provide specific suggestions based on failure type

### 4. Data Retention Policy

**Decision**: 90-day operational retention, 2-year anonymized analytics

**Rationale**:
- 90 days covers customer support window for plan enrollment issues
- Anonymized analytics enable business intelligence without privacy concerns
- Complies with Texas privacy regulations
- Supports fraud detection patterns

**Alternatives Considered**:
- No retention: Eliminates support capability
- Indefinite retention: Privacy compliance issues
- 30-day only: Insufficient for enrollment dispute resolution

**Implementation**:
- Operational data: Full address + ESID + user context (90 days)
- Analytics data: ZIP code + success/failure only (2 years)
- PII scrubbing: Automated daily process removes expired records

## Technical Architecture Decisions

### API Design Pattern
**Decision**: RESTful API with resource-based endpoints

- `POST /api/address/validate` - Address standardization and validation
- `POST /api/esid/lookup` - ESID retrieval for validated address
- `POST /api/plan/availability` - Plan service territory verification

### Error Handling Strategy
**Decision**: Structured error responses with recovery suggestions

```typescript
{
  success: false,
  error: "ADDRESS_NOT_FOUND",
  message: "Address could not be validated",
  suggestions: ["123 Main St", "123 Main Street"],
  retryable: true
}
```

### Caching Strategy
**Decision**: Multi-tier caching for performance

- Redis: ESID lookups (15 minutes)
- Memory: Address validation results (5 minutes)
- Browser: Plan availability (1 hour)

### State Management
**Decision**: React Hook Form + Zod validation (consistent with existing patterns)

- Aligns with ZIP validation form implementation
- Supports Texas design system requirements
- Enables real-time validation feedback

## Integration Points

### Existing Systems
- **ZIP Validation**: Reuse validation schemas and error patterns
- **TDSP Mapping**: Leverage existing utility territory logic
- **Plan Service**: Integrate with plan availability checking
- **Design System**: Follow Texas color scheme and responsive patterns

### External APIs
- **ERCOT API**: Use existing authentication and rate limiting
- **USPS API**: New integration requiring API key registration
- **Redis Cache**: Use existing caching infrastructure

## Performance Targets

Based on constitutional requirements and user experience standards:

- **Address Validation**: <200ms response time
- **ESID Lookup**: <300ms response time  
- **Total Flow**: <500ms end-to-end (address → ESID → plan availability)
- **Concurrent Users**: Support 100+ simultaneous validations
- **Availability**: 99.5% uptime (with graceful degradation)

## Risk Mitigation

### API Rate Limiting
- Implement exponential backoff for ERCOT API
- Use caching to reduce API calls
- Queue validation requests during peak usage

### Address Ambiguity
- Provide multiple address suggestions when standardization uncertain
- Allow manual address confirmation step
- Support unit number specification for multi-unit buildings

### Plan Availability Edge Cases
- Handle newly constructed addresses (no ESID yet)
- Support seasonal disconnect scenarios
- Manage utility territory boundary changes

---

**Status**: ✅ All NEEDS CLARIFICATION items resolved
**Next Phase**: Design & Contracts (Phase 1)