# Tasks: Comprehensive Texas ZIP Code Navigation

**Input**: Design documents from `/specs/010-expand-zip-code/`
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, contracts/zip-navigation-api.yml ✓, quickstart.md ✓

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: TypeScript, Astro, React, Drizzle ORM, PostgreSQL
   → Structure: Web application with frontend + backend
2. Load design documents ✓:
   → data-model.md: 4 core entities (ZIPCodeMapping, DeregulatedMarketArea, ZIPValidationResult, supporting entities)
   → contracts/: 3 API endpoints (/zip/validate, /zip/lookup/{zipCode}, /deregulated-areas)  
   → quickstart.md: 5 test scenarios (East TX, South TX, Central TX, Brazos Valley, West TX)
3. Generate tasks by category:
   → Setup: TypeScript types, database schema, service layer
   → Tests: Contract tests, integration tests for all scenarios
   → Core: Data models, validation services, API endpoints
   → Integration: Database connections, caching, analytics
   → Polish: Performance tests, E2E validation, documentation
4. Apply TDD ordering: Tests before implementation ✓
5. Parallel execution: Different files marked [P] ✓
6. Constitutional compliance: Real data, no hardcoded values ✓
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- All tasks include exact file paths for implementation

## Phase 3.1: Setup & Data Foundation
- [ ] **T001** Create TypeScript types for ZIP code navigation system in `src/lib/types/zip-navigation.ts`
- [ ] **T002** [P] Create Drizzle schema for ZIPCodeMapping table in `src/lib/database/schema/zip-mappings.ts`
- [ ] **T003** [P] Create Drizzle schema for DeregulatedMarketArea table in `src/lib/database/schema/market-areas.ts`
- [ ] **T004** [P] Create database migration for ZIP navigation tables in `src/lib/database/migrations/001_zip_navigation_tables.sql`
- [ ] **T005** Populate initial ZIP code mapping data in `src/data/zip-mappings/texas-deregulated-zips.json`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests [P] - API Endpoint Validation
- [ ] **T006** [P] Contract test POST /api/zip/validate endpoint in `tests/contract/zip-validate.test.ts`
- [ ] **T007** [P] Contract test GET /api/zip/lookup/{zipCode} endpoint in `tests/contract/zip-lookup.test.ts`
- [ ] **T008** [P] Contract test GET /api/deregulated-areas endpoint in `tests/contract/deregulated-areas.test.ts`

### Integration Tests [P] - User Journey Validation
- [ ] **T009** [P] Integration test East Texas coverage (Tyler 75701, Longview 75601) in `tests/integration/east-texas-coverage.test.ts`
- [ ] **T010** [P] Integration test South Texas coverage (Corpus Christi 78401, Laredo 78040) in `tests/integration/south-texas-coverage.test.ts`
- [ ] **T011** [P] Integration test Central Texas coverage (Waco 76701) in `tests/integration/central-texas-coverage.test.ts`
- [ ] **T012** [P] Integration test Brazos Valley coverage (College Station 77840) in `tests/integration/brazos-valley-coverage.test.ts`
- [ ] **T013** [P] Integration test West Texas coverage (Lubbock 79401, Abilene 79601) in `tests/integration/west-texas-coverage.test.ts`
- [ ] **T014** [P] Integration test error handling for electric cooperatives in `tests/integration/cooperative-areas.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Service Layer Implementation
- [ ] **T015** [P] ZIP validation service with TDU territory lookup in `src/lib/services/zip-validation-service.ts`
- [ ] **T016** [P] Texas market data service for deregulated areas in `src/lib/services/texas-market-data-service.ts`
- [ ] **T017** [P] City routing service for URL generation in `src/lib/services/city-routing-service.ts`
- [ ] **T018** ZIP code mapping repository with database queries in `src/lib/repositories/zip-mapping-repository.ts`

### API Endpoint Implementation
- [ ] **T019** Enhanced POST /api/zip/validate endpoint with comprehensive validation in `src/pages/api/zip/validate.ts`
- [ ] **T020** GET /api/zip/lookup/[zipCode].ts endpoint for direct routing in `src/pages/api/zip/lookup/[zipCode].ts`
- [ ] **T021** GET /api/deregulated-areas endpoint for coverage information in `src/pages/api/deregulated-areas.ts`

### Data Processing & Validation  
- [ ] **T022** ZIP code format validation and Texas boundary checking in `src/lib/validation/zip-code-validator.ts`
- [ ] **T023** TDU territory mapping and validation logic in `src/lib/validation/tdu-territory-validator.ts`
- [ ] **T024** Error response generation for cooperative areas and invalid ZIPs in `src/lib/utils/zip-error-handler.ts`

## Phase 3.4: Integration & Enhancement

### Database & Caching Integration
- [ ] **T025** Database connection and query optimization for ZIP lookups in `src/lib/database/zip-navigation-queries.ts`
- [ ] **T026** Redis caching integration for frequent ZIP validations in `src/lib/cache/zip-validation-cache.ts`
- [ ] **T027** JSON fallback system for offline/degraded mode operation in `src/lib/fallback/zip-navigation-fallback.ts`

### Analytics & Monitoring
- [ ] **T028** Analytics integration for ZIP lookup tracking in `src/lib/analytics/zip-navigation-analytics.ts`
- [ ] **T029** Error logging and monitoring for ZIP validation failures in `src/lib/logging/zip-validation-logger.ts`
- [ ] **T030** Performance monitoring for ZIP validation response times in `src/lib/monitoring/zip-performance-monitor.ts`

## Phase 3.5: Polish & Validation

### Performance & Load Testing
- [ ] **T031** [P] Performance tests ensuring <500ms ZIP validation in `tests/performance/zip-validation-performance.test.ts`
- [ ] **T032** [P] Load testing for 100+ concurrent ZIP lookups in `tests/load/zip-lookup-load.test.ts`
- [ ] **T033** [P] Unit tests for validation logic and error handling in `tests/unit/zip-validation-unit.test.ts`

### End-to-End Validation
- [ ] **T034** E2E test complete user journey for Tyler ZIP 75701 → Tyler plans page in `tests/e2e/tyler-zip-navigation.spec.ts`
- [ ] **T035** E2E test Corpus Christi ZIP 78401 → Corpus Christi plans page (no more NOT_FOUND) in `tests/e2e/corpus-christi-navigation.spec.ts`
- [ ] **T036** Execute complete quickstart.md validation scenarios in `tests/validation/quickstart-validation.test.ts`

### Documentation & Constitutional Compliance
- [ ] **T037** [P] Update CLAUDE.md with ZIP navigation service patterns and constitutional compliance in `CLAUDE.md`
- [ ] **T038** [P] Verify no hardcoded plan IDs or ZIP mappings using `npm run validate:ids` in validation script
- [ ] **T039** [P] Update API documentation with new ZIP navigation endpoints in `docs/api/zip-navigation.md`

## Dependencies

### Critical Path Dependencies
- **Setup Foundation**: T001-T005 must complete before any other tasks
- **Test-First (Constitutional)**: T006-T014 must complete and FAIL before T015-T024
- **Service Layer**: T015-T018 must complete before T019-T021 (API endpoints)
- **Integration Layer**: T025-T027 must complete before T028-T030 (monitoring)
- **Implementation**: T015-T030 must complete before T031-T039 (polish)

### Blocking Relationships
- T001 (types) blocks all implementation tasks T015-T024
- T002-T003 (database schema) blocks T025 (database queries)
- T005 (initial data) blocks T015-T017 (service implementation)
- T018 (repository) blocks T025 (database integration)
- T015-T017 (services) block T019-T021 (API endpoints)

## Parallel Execution Examples

### Phase 3.1 Setup (After T001)
```bash
# Launch T002-T004 together (different schema files):
Task: "Create Drizzle schema for ZIPCodeMapping table in src/lib/database/schema/zip-mappings.ts"
Task: "Create Drizzle schema for DeregulatedMarketArea table in src/lib/database/schema/market-areas.ts"  
Task: "Create database migration for ZIP navigation tables in src/lib/database/migrations/001_zip_navigation_tables.sql"
```

### Phase 3.2 Contract Tests (TDD Critical Phase)
```bash
# Launch T006-T008 together (API contract tests):
Task: "Contract test POST /api/zip/validate endpoint in tests/contract/zip-validate.test.ts"
Task: "Contract test GET /api/zip/lookup/{zipCode} endpoint in tests/contract/zip-lookup.test.ts"
Task: "Contract test GET /api/deregulated-areas endpoint in tests/contract/deregulated-areas.test.ts"

# Launch T009-T014 together (integration tests):
Task: "Integration test East Texas coverage (Tyler, Longview) in tests/integration/east-texas-coverage.test.ts"
Task: "Integration test South Texas coverage (Corpus Christi, Laredo) in tests/integration/south-texas-coverage.test.ts"
Task: "Integration test Central Texas coverage (Waco) in tests/integration/central-texas-coverage.test.ts"
```

### Phase 3.3 Service Layer (After tests fail)
```bash
# Launch T015-T017 together (service layer):
Task: "ZIP validation service with TDU territory lookup in src/lib/services/zip-validation-service.ts"
Task: "Texas market data service for deregulated areas in src/lib/services/texas-market-data-service.ts"
Task: "City routing service for URL generation in src/lib/services/city-routing-service.ts"
```

### Phase 3.5 Polish & Validation
```bash
# Launch T031-T033 together (performance tests):
Task: "Performance tests ensuring <500ms ZIP validation in tests/performance/zip-validation-performance.test.ts"
Task: "Load testing for 100+ concurrent ZIP lookups in tests/load/zip-lookup-load.test.ts"
Task: "Unit tests for validation logic in tests/unit/zip-validation-unit.test.ts"

# Launch T037-T039 together (documentation):
Task: "Update CLAUDE.md with ZIP navigation service patterns in CLAUDE.md"
Task: "Verify constitutional compliance using npm run validate:ids"
Task: "Update API documentation with new endpoints in docs/api/zip-navigation.md"
```

## Constitutional Compliance Checkpoints

### ✅ Real Data Architecture (NON-NEGOTIABLE)
- **T005**: Populate with real ZIP code mappings (no mock data)
- **T015**: Dynamic ZIP resolution via database/service layer
- **T038**: Validation that zero hardcoded ZIP codes or plan IDs exist

### ✅ TDD Requirements (NON-NEGOTIABLE)  
- **T006-T014**: All tests must be written first and must fail
- **Contract → Integration → E2E → Unit** test order strictly followed
- **T015+**: Implementation only begins after test failures confirmed

### ✅ Texas Market Integrity
- **T016**: Real deregulated area definitions from PUCT
- **T023**: Accurate TDU territory mappings  
- **T022**: ZIP code validation against actual Texas boundaries

### ✅ Performance Standards
- **T031**: <500ms ZIP validation requirement
- **T032**: Concurrent user support validation
- **T030**: Performance monitoring integration

## Validation Checklist
*GATE: All items must be ✅ before tasks.md completion*

- [x] All contracts (3 API endpoints) have corresponding contract tests (T006-T008)
- [x] All entities (4 core entities) have implementation tasks (T015-T018, T022-T024)  
- [x] All tests (T006-T014) come before implementation (T015-T039)
- [x] Parallel tasks are truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path for implementation
- [x] No task modifies same file as another [P] task
- [x] Constitutional compliance verified throughout (real data, TDD, performance)
- [x] All quickstart scenarios (5 regions) have corresponding integration tests
- [x] Critical dependencies clearly documented and blocking relationships identified

## Expected Outcomes

**Upon Completion**:
- Tyler ZIP 75701 → Tyler electricity plans (not Dallas)
- Corpus Christi ZIP 78401 → Corpus Christi plans (not NOT_FOUND error)  
- Waco ZIP 76701 → Waco plans (not Fort Worth)
- College Station ZIP 77840 → College Station plans (not Houston)
- 100% Texas deregulated area coverage achieved
- <500ms ZIP validation performance maintained
- Constitutional compliance with real data architecture

**Next Phase**: Implementation execution following TDD principles with failing tests driving development

---
*Tasks ready for execution. Total: 39 tasks across 5 phases with proper TDD ordering and constitutional compliance.*