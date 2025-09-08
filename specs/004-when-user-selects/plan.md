# Implementation Plan: Address ESID Validation for Plan Selection

**Branch**: `004-when-user-selects` | **Date**: 2025-09-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-when-user-selects/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ LOADED: Address ESID validation after plan selection
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ DETECTED: Project Type = web (Astro frontend + API backend)
   → ✅ SET: Structure Decision = Astro/React web application
3. Evaluate Constitution Check section below
   → ✅ NO VIOLATIONS: Follows TDD, real data, dynamic ESID resolution
   → ✅ UPDATE: Initial Constitution Check passed
4. Execute Phase 0 → research.md
   → ✅ RESOLVED: All NEEDS CLARIFICATION items researched
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   → ✅ COMPLETED: Design artifacts generated
6. Re-evaluate Constitution Check section
   → ✅ NO NEW VIOLATIONS: Design adheres to constitutional principles
   → ✅ UPDATE: Post-Design Constitution Check passed
7. Plan Phase 2 → Task generation approach described
8. ✅ STOP - Ready for /tasks command
```

## Summary
Users need to validate their service address and retrieve their ESID after selecting an electricity plan. The system will integrate with ERCOT's address validation API to dynamically generate ESIDs (never hardcoded), validate plan availability at the address location, and provide clear feedback for address corrections when validation fails. Implementation uses Astro/React with TypeScript, following real data architecture principles.

## Technical Context
**Language/Version**: TypeScript 5.3+ with Astro 5.13 and React 18  
**Primary Dependencies**: Astro, React, Zod validation, existing ERCOT API integration  
**Storage**: PostgreSQL with Drizzle ORM (existing), Redis caching for ESID lookups  
**Testing**: Vitest for unit tests, Playwright for E2E tests, contract tests for API validation  
**Target Platform**: Web application (desktop + mobile responsive)
**Project Type**: web - Astro frontend with API routes backend  
**Performance Goals**: <200ms ESID validation response time, <500ms total address processing  
**Constraints**: ERCOT API rate limiting, Texas-only address validation, real-time plan availability  
**Scale/Scope**: Support for all 881+ Texas cities, 100+ concurrent address validations

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Astro web app with API routes - within limit of 3)
- Using framework directly? ✅ Yes (Astro API routes, React components, no wrappers)
- Single data model? ✅ Yes (Address/ESID entities, no unnecessary DTOs)
- Avoiding patterns? ✅ Yes (direct service calls, no Repository pattern overhead)

**Architecture**:
- EVERY feature as library? ✅ Yes (address validation service, ESID lookup service)
- Libraries listed: 
  - `address-validation-service` (address format validation, USPS integration)
  - `esid-lookup-service` (ERCOT API integration, dynamic ESID generation)
  - `plan-availability-service` (verify plan service territory coverage)
- CLI per library: N/A (web application services)
- Library docs: ✅ Yes (JSDoc format for service documentation)

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? ✅ Yes (contract tests fail first, then implementation)
- Git commits show tests before implementation? ✅ Yes (TDD workflow)
- Order: Contract→Integration→E2E→Unit strictly followed? ✅ Yes
- Real dependencies used? ✅ Yes (actual ERCOT API, real address validation)
- Integration tests for: ✅ new services, ✅ ERCOT API contract, ✅ address schemas
- FORBIDDEN: ✅ Implementation before test, ✅ skipping RED phase

**Observability**:
- Structured logging included? ✅ Yes (address validation attempts, ESID lookups)
- Frontend logs → backend? ✅ Yes (API endpoint logging for user actions)
- Error context sufficient? ✅ Yes (validation failures, API errors, user context)

**Versioning**:
- Version number assigned? ✅ Yes (follows existing project versioning)
- BUILD increments on every change? ✅ Yes (automatic via npm version)
- Breaking changes handled? ✅ Yes (backward compatible address validation API)

## Project Structure

### Documentation (this feature)
```
specs/004-when-user-selects/
├── plan.md              # ✅ This file (/plan command output)
├── research.md          # ✅ Phase 0 output (/plan command)
├── data-model.md        # ✅ Phase 1 output (/plan command)
├── quickstart.md        # ✅ Phase 1 output (/plan command)
├── contracts/           # ✅ Phase 1 output (/plan command)
│   ├── address-validation.yaml
│   ├── esid-lookup.yaml
│   └── plan-availability.yaml
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Astro web application structure (existing)
src/
├── components/ui/              # React components
│   ├── AddressValidationForm.tsx
│   └── ESIDLookupModal.tsx
├── pages/api/                  # API routes
│   ├── address/validate.ts
│   ├── esid/lookup.ts
│   └── plan/availability.ts
├── lib/services/               # Business logic
│   ├── address-validation-service.ts
│   ├── esid-lookup-service.ts
│   └── plan-availability-service.ts
├── lib/models/                 # Data models
│   ├── address.ts
│   ├── esid-validation-result.ts
│   └── plan-availability.ts
├── types/                      # TypeScript interfaces
│   └── address-validation.ts
└── lib/validation/             # Zod schemas
    └── address-schemas.ts

tests/
├── contract/                   # API contract tests
│   ├── address-validate.test.ts
│   ├── esid-lookup.test.ts
│   └── plan-availability.test.ts
├── integration/                # Service integration tests
│   ├── address-validation-flow.test.ts
│   └── esid-plan-integration.test.ts
└── unit/                       # Unit tests
    ├── address-validation-service.test.ts
    └── esid-lookup-service.test.ts
```

**Structure Decision**: Astro web application (Option 2 variant) - frontend React components with backend API routes

## Phase 0: Outline & Research ✅

Research has resolved all NEEDS CLARIFICATION items from the specification:

1. **ESID API Provider**: ERCOT Web Services API for official ESID lookup
2. **Address Validation Service**: USPS Address Validation API for standardization
3. **Validation Failure Behavior**: Progressive enhancement with suggestions and retry options
4. **Data Retention**: 90-day retention for support, anonymized analytics for 2 years

**Output**: ✅ research.md with all technical unknowns resolved

## Phase 1: Design & Contracts ✅

Design artifacts have been generated based on functional requirements:

1. **Data Models**: Address, ESID, PlanAvailability entities with validation rules
2. **API Contracts**: RESTful endpoints for address validation, ESID lookup, plan availability
3. **Contract Tests**: Failing tests for each endpoint to ensure TDD compliance
4. **Integration Scenarios**: User story validation tests for complete address-to-ESID flow
5. **Agent Context**: CLAUDE.md updated with address validation service patterns

**Output**: ✅ data-model.md, contracts/*.yaml, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from contracts (3 API endpoints) and data models (3 entities)
- Each API contract → contract test task [P] (parallel execution)
- Each entity model → creation task [P]
- Each user story (4 scenarios) → integration test task
- Implementation tasks in TDD order: models → services → components → API endpoints

**Ordering Strategy**:
- TDD order: Contract tests → Integration tests → Unit tests → Implementation
- Dependency order: TypeScript interfaces → Zod schemas → Data models → Services → Components → API routes
- Mark [P] for parallel tasks: contract tests, model definitions, independent service implementations

**Estimated Output**: 28-32 numbered, ordered tasks covering:
- 3 contract test tasks [P]
- 4 integration test tasks based on user stories
- 6 model/schema definition tasks [P] 
- 9 service implementation tasks
- 6 React component tasks
- 3 API endpoint tasks

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (TDD cycle with failing tests first, then passing implementation)  
**Phase 5**: Validation (quickstart.md execution, performance testing, ERCOT API integration testing)

## Complexity Tracking
*No constitutional violations identified - no entries needed*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*