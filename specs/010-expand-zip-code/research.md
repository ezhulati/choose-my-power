# Research: Comprehensive Texas ZIP Code Navigation Expansion

**Feature Branch**: `010-expand-zip-code`  
**Date**: 2025-09-09  
**Phase**: 0 - Research & Analysis

## Executive Summary

Analysis of the current ZIP code validation system reveals systematic coverage gaps affecting 20+ deregulated Texas cities. The existing service uses overly broad ZIP ranges that incorrectly map rural and mid-sized cities to major metropolitan areas, preventing accurate electricity plan navigation.

## Research Questions Addressed
1. Current ZIP validation system architecture and gaps
2. Texas electricity market structure and deregulated area boundaries
3. TDU territory mapping integration with ZIP code resolution
4. Performance requirements for expanded coverage
5. Constitutional compliance with existing data architecture

## Research Findings

### 1. ZIP Code Mapping Strategies

**Decision**: Granular ZIP-to-city mapping with TDU territory validation  
**Rationale**: Current overly broad ZIP ranges (e.g., 75000-75999 → Dallas) incorrectly route users from different cities. Precise mapping ensures Tyler residents get Tyler plans, not Dallas plans.  
**Alternatives considered**:
- Geographic coordinate-based mapping: Too complex, performance overhead
- County-based routing: Insufficient granularity for electricity markets  
- Current broad ZIP ranges: Proven inadequate in specification analysis

### 2. Texas Deregulated Market Boundaries

**Decision**: Utilize PUCT official deregulated area definitions with city-specific plan availability  
**Rationale**: Texas Public Utility Commission defines precise boundaries for competitive electricity markets. Each deregulated city has distinct provider availability and plan options.  
**Alternatives considered**:
- Self-defined market areas: Risk of inaccuracy, regulatory compliance issues
- Regional groupings: Loses city-specific plan differentiation  
- ZIP-code-only approach: Misses rural cooperative boundaries

**Identified Deregulated Areas for Coverage**:
- **East Texas**: Tyler (75701-75799), Longview (75601-75699), Marshall, Paris, Texarkana
- **Central Texas**: Waco (76701-76799), Temple, Killeen, Round Rock  
- **South Texas**: Corpus Christi (78401-78499), Laredo (78040-78049), Brownsville, McAllen, Victoria
- **Brazos Valley**: College Station (77840-77849), Bryan (77801-77808)
- **West Texas**: Lubbock (79401-79499), Abilene, Midland, Odessa

### 3. TDU Territory Mapping Research

**Decision**: Implement comprehensive TDU territory validation with ZIP code cross-reference  
**Rationale**: Transmission/Distribution Service Providers determine plan availability. Accurate TDU mapping prevents showing plans unavailable in user's service area.  
**Alternatives considered**:
- API-only validation: Latency concerns for user experience
- Static mapping without validation: Risk of outdated territory information  
- User-reported service provider: Unreliable, error-prone

**TDU Territory Coverage Required**:
- **Oncor**: Dallas-Fort Worth, East Texas (Tyler, Longview), parts of West Texas
- **CenterPoint Energy**: Houston metro, parts of South Texas  
- **AEP Texas North**: Abilene, parts of West Texas
- **AEP Texas Central**: Corpus Christi, Victoria, parts of South Texas
- **AEP Texas South**: Laredo, McAllen, Brownsville
- **TNMP (Texas-New Mexico Power)**: Parts of South and West Texas

### 4. ZIP Code Validation Performance

**Decision**: Implement cached validation with <200ms response time target  
**Rationale**: User experience requires immediate feedback on ZIP code entry. Caching frequently accessed ZIP codes reduces API calls and improves response time.  
**Alternatives considered**:
- Real-time API validation only: Unacceptable latency (800ms+ observed)
- Pre-computed static lookup table: Memory overhead, update complexity  
- Hybrid approach with smart caching: Balances performance and accuracy

**Performance Requirements**:
- ZIP validation: <200ms target, <500ms maximum  
- Concurrent user support: 100+ simultaneous ZIP lookups  
- Cache invalidation: 24-hour TTL for ZIP mappings  
- Fallback handling: Graceful degradation if validation service unavailable

### 5. Geographic Routing Error Handling

**Decision**: Progressive error messaging with user guidance and fallback options  
**Rationale**: Users in non-deregulated areas or unmapped ZIP codes need clear explanation and alternative actions.  
**Alternatives considered**:
- Generic "not found" errors: Poor user experience, high abandonment
- Redirect to nearest metro: Potentially incorrect plan recommendations  
- No error handling: System failures, user confusion

**Error Handling Strategy**:
- **Unknown ZIP codes**: "We're working to add coverage for this area" with email signup
- **Non-deregulated areas**: Clear explanation of electric cooperative service with contact information  
- **Service unavailable**: Fallback to manual city selection with user guidance  
- **Multiple matches**: Disambiguation with ZIP+4 or address verification

## Technical Implementation Approach

### Data Storage Strategy
- **Primary**: PostgreSQL with indexed ZIP code to city mappings
- **Cache**: Redis for frequently accessed ZIP validations  
- **Fallback**: JSON static files for offline/degraded mode operation
- **Update mechanism**: Batch processing for TDU territory changes

### API Integration Pattern
- **Validation service**: Standalone ZIP validation with TDU territory lookup
- **Routing service**: URL generation based on validated city mappings  
- **Analytics service**: ZIP lookup success rates and error tracking  
- **Admin service**: ZIP mapping management and territory updates

### Data Sources Identified
- **PUCT deregulated area definitions**: Official regulatory boundaries
- **USPS ZIP code database**: Authoritative ZIP code to geographic mapping  
- **TDU service territory maps**: Provider-specific coverage areas
- **ComparePower Pricing API**: Live electricity plan availability data
  - Endpoint: `https://pricing.api.comparepower.com/api/plans/current`
  - Required parameters: `group=default&tdsp_duns={DUNS}&display_usage={KWH}`
  - TDSP DUNS format: Oncor=103994067400, CenterPoint=957877905, etc.
- **Existing platform data**: 881+ city electricity plan data for validation

## Constitutional Compliance Verification

### Dynamic Data Resolution
✅ **Compliant**: All ZIP codes dynamically resolved to cities, no hardcoded mappings  
✅ **Real Data Architecture**: Uses existing service layer pattern with database-first approach  
✅ **Texas Market Integrity**: Accurate TDU territory and deregulated area handling  

### Performance Standards  
✅ **Response Time**: <500ms ZIP validation meets constitutional performance requirements  
✅ **Scalability**: Service layer design supports 881+ city expansion  
✅ **Caching Strategy**: Redis optimization aligns with existing platform architecture

## Next Steps for Phase 1

1. **Data Model Design**: Define ZIP mapping entities and relationships  
2. **API Contracts**: Specify validation and routing service endpoints  
3. **Test Strategy**: Contract tests for all ZIP validation scenarios  
4. **Integration Plan**: Service layer integration with existing city/plan services  
5. **Error Handling**: Comprehensive error response specifications

---
*Research completed: All technical approaches resolved for Phase 1 design*