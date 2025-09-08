# Tasks: Functional ZIP Code to City Plans Navigation

**Input**: Design documents from `/specs/006-functional-zip-code/`
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, contracts/zip-navigation-api.yaml ✓

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: TypeScript 5.9.2, Astro 5.13.4, React 18.3.1
   → Structure: Web application (existing Astro src/ structure)
2. Load optional design documents: ✓
   → data-model.md: 5 entities (ZIP Code, Texas City, TDSP Territory, Electricity Plan, City Plans Page)
   → contracts/: zip-navigation-api.yaml (2 endpoints)
   → research.md: Legacy API fix strategy, performance requirements
3. Generate tasks by category: ✓
   → Setup: Dependencies, linting, environment
   → Tests: Contract tests (2), integration tests (5), E2E tests (3)
   → Core: API endpoints (2), service updates (3), UI components (2)
   → Integration: Navigation flow, performance validation
   → Polish: Unit tests, documentation updates
4. Apply task rules: ✓
   → Different files = [P], same file = sequential
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...) ✓
6. Generate dependency graph ✓
7. Create parallel execution examples ✓
8. Validate task completeness: ✓
   → All contracts have tests: ✓ (2 endpoints → 2 contract tests)
   → All entities have models: ✓ (TypeScript interfaces)
   → All endpoints implemented: ✓ (2 endpoints + 1 legacy fix)
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **File paths**: Absolute paths from repository root `/Users/mbp-ez/Downloads/AI Library/Apps/CMP/choose-my-power/`

## Path Conventions
**Web application structure** (from plan.md):
- API endpoints: `src/pages/api/`
- Services: `src/lib/services/`
- Components: `src/components/ui/`
- Tests: `tests/contract/`, `tests/integration/`, `tests/e2e/`

---

## Phase 3.1: Setup & Environment

- [ ] **T001** Verify existing TypeScript and dependency versions match requirements (TypeScript 5.9.2, Node.js >=20.5.0)
- [ ] **T002** [P] Configure ESLint rules for new API endpoints and service files  
- [ ] **T003** [P] Update `.gitignore` to include any new test artifacts or build outputs

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE PHASE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoints)
- [ ] **T004** [P] Contract test POST `/api/zip/navigate` endpoint in `tests/contract/zip-navigation-post.test.ts`
  - Test valid ZIP codes (75201 Dallas, 77001 Houston)
  - Test invalid ZIP formats, non-Texas ZIPs, regulated markets
  - Validate response schema matches `contracts/zip-navigation-api.yaml`
  - Performance requirement: <200ms response time
  
- [ ] **T005** [P] Contract test GET `/api/zip/validate-city-plans` endpoint in `tests/contract/zip-plans-validation.test.ts`
  - Test city plan availability validation
  - Test city not found scenarios
  - Validate response schema matches contract
  - Performance requirement: <300ms response time

### Integration Tests (User Story Scenarios)
- [ ] **T006** [P] Integration test: Primary user story navigation flow in `tests/integration/zip-navigation-primary.test.ts`
  - ZIP entry → button activation → API call → redirect URL → plans page access
  - Covers Scenario 1 from `quickstart.md`

- [ ] **T007** [P] Integration test: Multi-city ZIP validation in `tests/integration/zip-multi-city.test.ts`
  - Test Dallas (75201), Houston (77001), Austin (78701), Fort Worth (76101)
  - Verify TDSP territory mapping accuracy
  - Covers Scenario 2 from `quickstart.md`

- [ ] **T008** [P] Integration test: Invalid ZIP code handling in `tests/integration/zip-error-handling.test.ts`
  - Test all error cases: invalid format, non-Texas, regulated market, no plans
  - Verify no navigation occurs on errors
  - Covers Scenario 3 from `quickstart.md`

- [ ] **T009** [P] Integration test: Button state management in `tests/integration/zip-button-states.test.ts`
  - Test button disabled/enabled states based on ZIP validity
  - Covers Scenario 4 from `quickstart.md`

- [ ] **T010** [P] Integration test: Full page rendering validation in `tests/integration/zip-full-rendering.test.ts`
  - Verify no partial loading states visible to users
  - Validate complete navigation without intermediate pages
  - Covers Scenario 5 from `quickstart.md`

### End-to-End Tests  
- [ ] **T011** [P] E2E test: Complete ZIP navigation flow in `tests/e2e/zip-navigation-complete.test.ts`
  - Browser automation testing ZIP entry → city plans page
  - Cross-browser validation (Chrome, Firefox, Safari)

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### TypeScript Interfaces & Types (Data Model)
- [ ] **T012** [P] Create ZIP code validation types in `src/types/zip-navigation.ts`
  - `ZipCodeValidation`, `CityResolution`, `NavigationResult` interfaces
  - Based on data model entities and validation schemas

### API Endpoints Implementation  
- [ ] **T013** Create POST `/api/zip/navigate` endpoint in `src/pages/api/zip/navigate.ts`
  - Implement ZIP validation, city mapping, redirect URL generation
  - Handle all error cases defined in contract
  - Performance target: <200ms response time
  - Make contract test T004 pass

- [ ] **T014** Create GET `/api/zip/validate-city-plans` endpoint in `src/pages/api/zip/validate-city-plans.ts`
  - Pre-validate plan availability for city
  - Return plan count and availability status
  - Performance target: <300ms response time
  - Make contract test T005 pass

- [ ] **T015** Fix legacy API redirect URL in `src/pages/api/zip-lookup.ts` (CRITICAL BUG FIX)
  - Change line 174: `redirectUrl: "/texas/${citySlug}"` → `redirectUrl: "/electricity-plans/${citySlug}"`
  - Ensure city slug includes `-tx` suffix for consistency
  - **This is the root cause fix identified in research.md**

### Service Layer Updates
- [ ] **T016** [P] Update ZIP validation service in `src/lib/services/zip-validation-service.ts`
  - Ensure consistent city slug format with `-tx` suffix
  - Add plan availability pre-validation option
  - Integrate with new navigation endpoint

- [ ] **T017** [P] Create navigation analytics service in `src/lib/services/navigation-analytics-service.ts`
  - Track ZIP navigation success/failure rates
  - Performance metrics collection
  - User behavior analytics for optimization

- [ ] **T018** [P] Update city service for URL generation in `src/lib/services/city-service.ts`  
  - Ensure consistent slug format: `{city-name}-tx`
  - Add city plans availability validation
  - Geographic data accuracy for ZIP → city mapping

### UI Component Updates
- [ ] **T019** Update ZIP input components to use new navigation API in `src/components/ui/ZIPCodeLookupForm.tsx`
  - Replace old API calls with new `/api/zip/navigate` endpoint
  - Implement real-time button state management
  - Add proper error handling and user feedback
  - Make integration tests T006-T010 pass

- [ ] **T020** Update existing ZIP lookup usage in `src/scripts/zip-lookup.js`
  - Replace legacy API usage with new service
  - Ensure direct navigation without intermediate pages
  - Remove any hardcoded redirects to `/texas/` paths

## Phase 3.4: Integration & Performance

- [ ] **T021** Implement complete navigation flow validation
  - End-to-end ZIP entry → city plans page flow
  - Verify zero intermediate pages visible to users
  - Validate full page rendering before display
  - Make E2E test T011 pass

- [ ] **T022** Performance optimization and validation
  - Benchmark ZIP validation (<200ms) and total navigation (<500ms)
  - Optimize database queries for city/plan lookups
  - Implement caching for frequent ZIP → city mappings
  - Add performance monitoring and alerts

- [ ] **T023** Navigation flow error handling and recovery
  - Graceful fallback for API failures
  - User-friendly error messages without navigation triggers
  - Service reliability improvements

## Phase 3.5: Polish & Documentation

- [ ] **T024** [P] Unit tests for ZIP validation utilities in `tests/unit/zip-validation-utils.test.ts`
  - Test ZIP format validation, Texas validation, deregulated market checks
  - Edge cases and boundary conditions

- [ ] **T025** [P] Unit tests for city mapping utilities in `tests/unit/city-mapping-utils.test.ts`
  - Test ZIP → city slug generation
  - TDSP territory mapping accuracy

- [ ] **T026** [P] Update feature documentation in `CLAUDE.md`
  - Add new API endpoint documentation
  - Update troubleshooting guide with resolved issues
  - Document performance targets and monitoring

- [ ] **T027** Run complete validation using `specs/006-functional-zip-code/quickstart.md`
  - Execute all manual testing scenarios
  - Verify production readiness checklist
  - Performance validation in staging environment

---

## Dependencies

### Critical Path (Sequential)
1. **Setup** (T001-T003) → **Tests** (T004-T011) → **Implementation** (T012-T020) → **Integration** (T021-T023) → **Polish** (T024-T027)

### Specific Dependencies
- **Tests must fail first**: T004-T011 before any implementation (T013-T020)
- **API endpoints**: T013 (navigate) + T015 (legacy fix) before UI updates (T019-T020)
- **Service updates**: T016-T018 before integration testing (T021-T023)
- **Navigation flow**: T019-T020 before E2E testing (T021)

### Parallel Execution Groups
**Group 1 - Contract Tests** (after setup):
```bash
# Launch T004-T005 together:
Task: "Contract test POST /api/zip/navigate in tests/contract/zip-navigation-post.test.ts"
Task: "Contract test GET /api/zip/validate-city-plans in tests/contract/zip-plans-validation.test.ts"
```

**Group 2 - Integration Tests** (after contract tests):
```bash
# Launch T006-T011 together:
Task: "Integration test primary navigation flow in tests/integration/zip-navigation-primary.test.ts"
Task: "Integration test multi-city validation in tests/integration/zip-multi-city.test.ts"  
Task: "Integration test error handling in tests/integration/zip-error-handling.test.ts"
Task: "Integration test button states in tests/integration/zip-button-states.test.ts"
Task: "Integration test full rendering in tests/integration/zip-full-rendering.test.ts"
Task: "E2E test complete flow in tests/e2e/zip-navigation-complete.test.ts"
```

**Group 3 - Service Layer** (after API endpoints):
```bash
# Launch T016-T018 together:
Task: "Update ZIP validation service in src/lib/services/zip-validation-service.ts"
Task: "Create navigation analytics service in src/lib/services/navigation-analytics-service.ts"
Task: "Update city service in src/lib/services/city-service.ts"
```

**Group 4 - Polish** (final phase):
```bash
# Launch T024-T026 together:
Task: "Unit tests for ZIP validation in tests/unit/zip-validation-utils.test.ts"
Task: "Unit tests for city mapping in tests/unit/city-mapping-utils.test.ts"
Task: "Update documentation in CLAUDE.md"
```

---

## Task Validation Checklist
*GATE: Checked before execution*

- [x] All contracts have corresponding tests (2 endpoints → T004, T005)
- [x] All entities have model tasks (ZIP Code, City, TDSP, Plan, Page → T012)
- [x] All tests come before implementation (T004-T011 before T013-T020)  
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path (absolute paths provided)
- [x] No task modifies same file as another [P] task
- [x] Critical legacy bug fix identified and prioritized (T015)
- [x] Performance requirements included (<200ms, <500ms targets)
- [x] Constitutional compliance maintained (real data, dynamic IDs, TDD)

## Success Criteria
✅ **All contract tests pass** (validates API compliance)  
✅ **Navigation performance** <500ms total from ZIP entry to full page load  
✅ **Zero intermediate pages** visible during navigation  
✅ **Button state management** works correctly (inactive until valid ZIP)  
✅ **Error handling** prevents navigation on invalid ZIPs  
✅ **Real plan data** displays on city pages (no mock data)  
✅ **Legacy redirect fixed** (no more `/texas/{city}` destinations)

**Total Tasks**: 27 tasks across 5 phases
**Estimated Timeline**: 2-3 development days following TDD approach
**Critical Dependencies**: Tests must fail first (TDD), legacy API fix blocks navigation