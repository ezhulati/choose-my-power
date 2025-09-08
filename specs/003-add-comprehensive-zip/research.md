# Research: ZIP Code Lookup Forms Implementation

**Feature**: Add Comprehensive ZIP Code Lookup Forms to City Pages  
**Date**: 2025-09-06  
**Status**: Complete

## Research Questions & Findings

### 1. ZIP Code Validation Integration with ERCOT API

**Decision**: Use existing ERCOT validation API `/api/ercot/validate` with ZIP-to-ESID generation
**Rationale**: 
- Existing system already handles ERCOT validation in `/src/pages/api/ercot/validate.ts`
- ZIP codes can be mapped to ESIDs using established ZIP code pattern-based generation
- Maintains consistency with current address validation workflow
**Alternatives considered**: 
- Direct ZIP validation service (rejected - ERCOT integration provides utility territory data)
- Third-party ZIP validation APIs (rejected - adds external dependency)

### 2. TDSP Mapping System Integration

**Decision**: Leverage existing multi-TDSP mapping in `/src/config/multi-tdsp-mapping.ts`
**Rationale**:
- System already maps ZIP codes to transmission/distribution service providers
- Accurate utility territory boundaries are critical for plan availability
- Existing validation handles complex geographic boundaries
**Alternatives considered**:
- Build new ZIP-to-TDSP mapping (rejected - duplicate existing functionality)
- Simplified ZIP validation without TDSP (rejected - inaccurate plan filtering)

### 3. Form Component Architecture

**Decision**: Create reusable React form component with Astro integration
**Rationale**:
- Consistent form behavior across 881+ city pages
- React component allows interactive validation and state management
- Astro integration enables server-side rendering with hydration
- Follows existing component patterns in `/src/components/ui/`
**Alternatives considered**:
- Pure Astro forms (rejected - limited interactivity for validation)
- Individual forms per city page (rejected - maintenance nightmare)

### 4. Responsive Design Integration

**Decision**: Use Texas design system with mobile-first approach
**Rationale**:
- Must comply with existing design system in CLAUDE.md
- Texas-themed colors (texas-navy, texas-red, texas-gold)
- Touch-optimized for mobile users
- Consistent with site branding and accessibility standards
**Alternatives considered**:
- Generic responsive design (rejected - breaks brand consistency)
- Desktop-first approach (rejected - majority mobile traffic)

### 5. Analytics and Tracking Integration

**Decision**: Implement form interaction tracking with existing analytics system
**Rationale**:
- Track ZIP lookup success/failure rates
- Monitor popular ZIP codes by city
- Identify cross-city redirection patterns
- Support business intelligence for market analysis
**Alternatives considered**:
- No tracking (rejected - loses valuable user behavior data)
- Third-party analytics only (rejected - lacks granular form-specific metrics)

### 6. URL Redirection Strategy

**Decision**: Redirect to existing plan pages with ZIP code filtering
**Rationale**:
- Leverage existing `/electricity-plans/{city-slug}` pages
- Add ZIP code parameter for TDSP-specific filtering
- Maintains SEO value and URL structure
- Uses established plan filtering system
**Alternatives considered**:
- New ZIP-specific page templates (rejected - duplicate content)
- Pop-up/modal plan display (rejected - poor mobile experience)

### 7. Error Handling and User Experience

**Decision**: Progressive enhancement with clear error messaging
**Rationale**:
- Graceful degradation if JavaScript disabled
- Clear error messages for invalid ZIP codes
- Helpful suggestions for common input mistakes
- Loading states for validation API calls
**Alternatives considered**:
- JavaScript-only forms (rejected - accessibility concerns)
- Silent error handling (rejected - poor user experience)

### 8. Performance Optimization Strategy

**Decision**: Client-side validation with server-side verification
**Rationale**:
- Immediate feedback for format validation (5-digit requirement)
- Server-side ERCOT API verification for accuracy
- Redis caching for frequently accessed ZIP-TDSP mappings
- Minimal impact on Core Web Vitals
**Alternatives considered**:
- Server-only validation (rejected - slow user feedback)
- Client-only validation (rejected - potential security issues)

## Technical Implementation Approach

### Form Component Structure
- Reusable React component: `ZIPCodeLookupForm.tsx`
- Props: `citySlug`, `cityName`, `validZipCodes[]`
- State management for validation and submission
- Integration with existing UI components

### API Integration Points
- `/api/ercot/validate` for ZIP code verification
- `/api/plans/search` for plan filtering by ZIP/TDSP
- `/api/cities` for cross-city redirection logic

### Data Flow
1. User enters ZIP code → Client validation (format)
2. Form submission → Server validation (ERCOT API)
3. ZIP validated → TDSP mapping lookup
4. Redirect to filtered plans → `/electricity-plans/{city}?zip={code}`

### Testing Strategy
- Unit tests: ZIP format validation, error handling
- Integration tests: ERCOT API calls, TDSP mapping
- E2E tests: Full form submission workflow across cities
- Performance tests: Form loading, API response times

## Dependencies and Constraints

### Existing System Dependencies
- ERCOT validation API (established)
- Multi-TDSP mapping system (established)
- Plan filtering system (established)
- Texas design system (established)

### New Dependencies
- Form validation library (react-hook-form recommended)
- Loading state management
- Analytics tracking hooks

### Performance Constraints
- API response time <200ms target
- Form loading time <100ms
- Mobile-optimized touch interactions
- Core Web Vitals compliance maintained

## Risk Mitigation

### High Traffic Scenarios
- Redis caching for ZIP-TDSP mappings
- Rate limiting on validation endpoints
- Graceful degradation with fallback messages

### Data Accuracy Risks
- Server-side validation required
- ERCOT API dependency (existing risk)
- Fallback to manual ZIP code entry if validation fails

### Cross-City Complexity
- Comprehensive ZIP-to-city mapping required
- Handle ZIP codes spanning multiple cities
- Clear user messaging for ambiguous cases

## Constitutional Compliance

### Real Data Architecture
- No mock data usage (constitutional requirement)
- Service layer integration with PostgreSQL/JSON fallbacks
- Real ERCOT API integration (no simulated responses)

### Dynamic Resolution System
- No hardcoded ZIP-to-plan mappings
- Dynamic TDSP territory resolution
- Real-time plan availability checking

### Texas Design System
- Texas flag-inspired color system compliance
- Professional shadows (shadow-md only)
- Proper mobile-first responsive design
- WCAG AA accessibility compliance