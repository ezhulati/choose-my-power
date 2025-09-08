# Tasks: Add Comprehensive ZIP Code Lookup Forms to City Pages

**Input**: Design documents from `/specs/003-add-comprehensive-zip/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: Astro frontend with React components and API routes
- Files in `src/components/`, `src/pages/api/`, `src/lib/`, `tests/`
- Paths are relative to repository root `/Users/mbp-ez/Downloads/AI Library/Apps/CMP/choose-my-power`

## Phase 3.1: Setup
- [ ] T001 Install required dependencies for form validation (react-hook-form, zod)
- [ ] T002 [P] Configure TypeScript interfaces for ZIP validation types in `src/types/zip-validation.ts`
- [ ] T003 [P] Set up test data fixtures for ZIP codes and TDSP mappings in `tests/fixtures/zip-data.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Contract test POST /api/zip/validate in `tests/contract/zip-validate.test.ts`
- [ ] T005 [P] Contract test GET /api/zip/city/{citySlug} in `tests/contract/zip-city.test.ts`
- [ ] T006 [P] Contract test POST /api/analytics/form-interaction in `tests/contract/analytics.test.ts`
- [ ] T007 [P] Integration test ZIP validation with ERCOT API in `tests/integration/zip-validation.test.ts`
- [ ] T008 [P] Integration test TDSP mapping resolution in `tests/integration/tdsp-mapping.test.ts`
- [ ] T009 [P] Integration test cross-city ZIP redirection in `tests/integration/cross-city-redirect.test.ts`
- [ ] T010 [P] E2E test basic ZIP lookup form submission in `tests/e2e/zip-form-basic.spec.ts`
- [ ] T011 [P] E2E test mobile responsive form interaction in `tests/e2e/zip-form-mobile.spec.ts`

## Phase 3.3: Data Models (ONLY after tests are failing)
- [ ] T012 [P] ZIPCodeLookup entity model in `src/lib/models/zip-code-lookup.ts`
- [ ] T013 [P] ZIPValidationResult entity model in `src/lib/models/zip-validation-result.ts`
- [ ] T014 [P] FormInteraction entity model in `src/lib/models/form-interaction.ts`
- [ ] T015 [P] ZIP validation schema with Zod in `src/lib/validation/zip-schemas.ts`

## Phase 3.4: Core Implementation (ONLY after models are created)
- [ ] T016 [P] ZIP validation service in `src/lib/services/zip-validation-service.ts`
- [ ] T017 [P] TDSP mapping service integration in `src/lib/services/tdsp-service.ts`
- [ ] T018 [P] Form analytics tracking service in `src/lib/services/analytics-service.ts`
- [ ] T019 ZIPCodeLookupForm React component in `src/components/ui/ZIPCodeLookupForm.tsx`
- [ ] T020 ZIP validation API endpoint POST /api/zip/validate in `src/pages/api/zip/validate.ts`
- [ ] T021 City ZIP codes API endpoint GET /api/zip/city/[citySlug].ts in `src/pages/api/zip/city/[citySlug].ts`
- [ ] T022 Analytics tracking API endpoint POST /api/analytics/form-interaction in `src/pages/api/analytics/form-interaction.ts`

## Phase 3.5: Integration & Database
- [ ] T023 Database schema for ZIP lookups in `src/lib/database/schema/zip-lookups.sql`
- [ ] T024 Database schema for form interactions in `src/lib/database/schema/form-interactions.sql`
- [ ] T025 Redis caching layer for ZIP-TDSP mappings in `src/lib/cache/zip-cache.ts`
- [ ] T026 Integration with existing ERCOT validation API in service layer
- [ ] T027 City page integration - add form to all Texas city templates in `src/layouts/CityPageLayout.astro`

## Phase 3.6: Error Handling & Validation
- [ ] T028 [P] Client-side form validation with error messaging in ZIPCodeLookupForm component
- [ ] T029 [P] Server-side input validation and sanitization for all API endpoints
- [ ] T030 [P] Rate limiting middleware for ZIP validation endpoints
- [ ] T031 Error boundary component for form failures in `src/components/ErrorBoundary.tsx`

## Phase 3.7: Polish & Performance
- [ ] T032 [P] Unit tests for ZIP validation logic in `tests/unit/zip-validation.test.ts`
- [ ] T033 [P] Unit tests for form component behavior in `tests/unit/zip-form.test.ts`
- [ ] T034 [P] Unit tests for TDSP mapping service in `tests/unit/tdsp-service.test.ts`
- [ ] T035 Performance optimization - lazy loading of form component
- [ ] T036 Core Web Vitals validation - ensure form doesn't impact LCP/CLS
- [ ] T037 [P] Accessibility testing with screen readers and keyboard navigation
- [ ] T038 [P] Mobile touch interaction optimization and testing

## Dependencies
**Critical Path**:
1. Setup (T001-T003) → Tests (T004-T011) → Models (T012-T015) → Implementation (T016-T022)
2. Database schemas (T023-T024) before API endpoints (T020-T022)
3. Caching (T025) before performance optimization (T035-T036)
4. Form component (T019) before city page integration (T027)

**Blocking Dependencies**:
- T004-T011 must ALL complete before ANY implementation begins
- T012-T015 (models) block T016-T018 (services)
- T016-T018 (services) block T020-T022 (API endpoints)
- T019 (form component) blocks T027 (city integration)
- T023-T024 (database) blocks T020-T022 (API endpoints)

## Parallel Example
```
# Launch T004-T011 together (all contract/integration tests):
Task: "Contract test POST /api/zip/validate in tests/contract/zip-validate.test.ts"
Task: "Contract test GET /api/zip/city/{citySlug} in tests/contract/zip-city.test.ts" 
Task: "Contract test POST /api/analytics/form-interaction in tests/contract/analytics.test.ts"
Task: "Integration test ZIP validation with ERCOT API in tests/integration/zip-validation.test.ts"
Task: "Integration test TDSP mapping resolution in tests/integration/tdsp-mapping.test.ts"
Task: "Integration test cross-city ZIP redirection in tests/integration/cross-city-redirect.test.ts"
Task: "E2E test basic ZIP lookup form submission in tests/e2e/zip-form-basic.spec.ts"
Task: "E2E test mobile responsive form interaction in tests/e2e/zip-form-mobile.spec.ts"

# Launch T012-T015 together (all models):
Task: "ZIPCodeLookup entity model in src/lib/models/zip-code-lookup.ts"
Task: "ZIPValidationResult entity model in src/lib/models/zip-validation-result.ts" 
Task: "FormInteraction entity model in src/lib/models/form-interaction.ts"
Task: "ZIP validation schema with Zod in src/lib/validation/zip-schemas.ts"

# Launch T016-T018 together (all services):
Task: "ZIP validation service in src/lib/services/zip-validation-service.ts"
Task: "TDSP mapping service integration in src/lib/services/tdsp-service.ts"
Task: "Form analytics tracking service in src/lib/services/analytics-service.ts"
```

## Validation Tests from Quickstart

### Test Scenario Coverage
- **T007**: Basic ZIP code lookup (Dallas 75201 → Oncor TDSP)
- **T009**: Cross-city redirection (Houston 77001 from Dallas page)
- **T008**: Invalid ZIP handling (12345 not in Texas)
- **T011**: Mobile responsive behavior testing
- **T006**: Analytics tracking validation

### API Response Validation
Each contract test (T004-T006) must validate:
- Request schema matches OpenAPI specification
- Response schema matches expected format
- Error codes align with specification
- Rate limiting returns proper 429 responses

## Constitutional Compliance Checks

### Real Data Requirements
- **T026**: Must integrate with actual ERCOT API (no mocks)
- **T017**: Must use real TDSP mapping system
- **T025**: Must implement Redis caching for real performance benefits
- All services must handle database unavailability with JSON fallbacks

### Dynamic Resolution Requirements
- **T016**: ZIP validation must be fully dynamic (no hardcoded mappings)
- **T020-T021**: API endpoints must resolve plan IDs dynamically
- **T027**: City page integration must not hardcode ZIP-city relationships

### Texas Design System Requirements
- **T019**: Form component must use texas-navy, texas-red, texas-gold colors
- **T037**: Must meet WCAG AA accessibility standards
- **T011**: Mobile-first responsive design required
- **T028**: Error messaging must follow established UI patterns

## Notes
- [P] tasks = different files, no dependencies
- Verify ALL tests fail before implementing
- Commit after each task completion
- Run `npm run validate:ids` after T020-T022 to ensure no hardcoded IDs
- Run `npm run perf:test:critical` after T035-T036 for performance validation

## Task Generation Rules Applied
1. **From Contracts**: zip-validation-api.yaml → T004-T006 (contract tests) → T020-T022 (endpoints)
2. **From Data Model**: 3 entities → T012-T014 (models) → T016-T018 (services)
3. **From Quickstart**: 5 test scenarios → T007-T011 (integration/E2E tests)
4. **Constitutional**: Real data + dynamic resolution → T025-T027 (integration)

## Validation Checklist
- [x] All contracts have corresponding tests (T004-T006)
- [x] All entities have model tasks (T012-T014)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task