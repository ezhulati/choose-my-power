# ChooseMyPower Constitution

## Core Principles

### I. Dynamic Plan & ESID Resolution (NON-NEGOTIABLE)
**NEVER USE HARDCODED PLAN IDs or ESIDs**
- All plan IDs must be dynamically resolved via `/api/plans/search` with plan name + provider + city context
- All ESIDs must be generated from actual user addresses via ERCOT validation API
- Plan ordering URLs must contain real MongoDB ObjectIds from generated data files
- Address validation must use ZIP code pattern-based ESID generation
- **VIOLATION DETECTION**: `npm run validate:ids` must pass with ZERO hardcoded IDs found
- **EMERGENCY PROTOCOL**: Show error messages instead of wrong data - never fallback to hardcoded values

### II. Real Data Architecture (NON-NEGOTIABLE)
**NO MOCK DATA - 100% Database-First Service Layer**
- All components MUST use real data services: `getProviders()`, `getCities()`, `getPlansForCity()`
- Database-first: PostgreSQL with Drizzle ORM provides primary data
- JSON fallbacks: Generated data files provide resilience if database unavailable
- Service layer: Abstracted data access with comprehensive error handling
- **FORBIDDEN**: Import or use `mockData.ts` - system never falls back to mock data
- **STANDARD PATTERN**: Loading states, error handling, and graceful degradation required

### III. Texas Electricity Market Integrity (NON-NEGOTIABLE)
**Accurate TDSP and Plan Data**
- Multi-TDSP mapping system must handle all Texas utility territories accurately
- ZIP codes must map correctly to transmission/distribution service providers
- Plan availability determination must reflect actual geographic boundaries
- Rate comparisons must be based on real-time electricity plan pricing
- **COMPLIANCE**: All 881+ Texas cities must have accurate deregulated market data

### IV. Performance & Scalability Standards
**Core Web Vitals and Texas-Focused Optimization**
- Data generation pipeline must support incremental builds for 881+ cities
- Smart caching with Redis optimization for frequently accessed data
- CDN optimization specifically for Texas users and geographic distribution
- Mobile-first responsive design with touch-optimized interactions
- **PERFORMANCE GATES**: `npm run perf:test` must pass Core Web Vitals standards

### V. Design System Consistency
**Texas-Themed Authentic Branding**
- Texas flag-inspired color system: texas-navy, texas-red, texas-gold, texas-cream
- Professional shadows: Use `shadow-md`, never `shadow-lg`
- Proper overlay containment: Never use `absolute inset-0 bg-black/20` without `relative` parent
- Trust signals spacing: Following content must have `mt-8` for symmetrical spacing
- **ACCESSIBILITY**: WCAG AA compliance minimum, AAA target where possible

## Data Generation & Build Standards

**Smart Data Pipeline Requirements**
- Use `npm run build:data:smart` for development (cached, faster)
- Use `npm run build:data:fresh` when data sources change
- Monitor API rate limiting with `BATCH_SIZE` and `BATCH_DELAY_MS` controls
- Support tier-based deployment: `npm run build:data:tier1` for priority cities
- **ENVIRONMENT CONTROLS**: `MAX_CITIES`, `USE_CACHED_DATA`, `FORCE_REBUILD` for testing
- **PRODUCTION**: Full 881-city build can take 20+ minutes, cache invalidation affects all pages

**Quality Assurance Pipeline**
- All code changes require changelog updates via `npm run changelog:add`
- Git hooks enforce pre-commit validation and testing
- Security scanning via `npm run security:audit` and ESLint security rules
- Database health monitoring via `npm run db:health` and performance metrics
- **TESTING HIERARCHY**: Unit tests (Vitest) → Integration tests → E2E tests (Playwright) → Performance tests

## Development Workflow

**Spec-Driven Development Lifecycle**
1. **Feature Specification**: Use `/specify <description>` to create feature branch and spec
2. **Implementation Planning**: Use `/plan` to generate technical implementation plan
3. **Task Breakdown**: Use `/tasks` to create actionable development tasks
4. **Real Data Integration**: Implement using service layer patterns with loading/error states
5. **Testing Pipeline**: Unit → Integration → E2E → Performance testing required
6. **Quality Gates**: Lint, security scan, plan ID validation must pass
7. **Changelog**: Interactive changelog entry required before merge

**Code Review Requirements**
- Verify no hardcoded plan IDs or ESIDs: `grep -r "68b[0-9a-f]\{21\}" src/`
- Confirm real data service usage, no mock data imports
- Validate Texas design system compliance and accessibility
- Check mobile responsiveness and Core Web Vitals impact
- Ensure proper error handling and loading states

## Governance

**Constitution Authority**
- This constitution supersedes all other development practices and guidelines
- Amendments require documentation in `memory/constitution_update_checklist.md`
- All pull requests and code reviews must verify constitutional compliance
- **CRITICAL VIOLATIONS**: Plan ID/ESID hardcoding, mock data usage result in immediate rejection

**Runtime Development Guidance**
- Use `CLAUDE.md` for detailed technical implementation guidance
- Reference design system specifications for UI/UX consistency
- Consult troubleshooting sections for common issue resolution
- Emergency response protocols documented for critical system failures

**Compliance Verification**
- **Plan ID Integrity**: `npm run validate:ids` must return zero results
- **Data Architecture**: No imports from `mockData.ts` or mock data files
- **Performance Standards**: Core Web Vitals and Texas-optimized metrics
- **Security**: No secrets, credentials, or sensitive data in commits

**Version**: 1.0.0 | **Ratified**: 2025-01-09 | **Last Amended**: 2025-01-09