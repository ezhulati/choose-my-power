# Implementation Plan: Complete Texas Deregulated ZIP Code Coverage

**Branch**: `007-hundreds-of-deregulated` | **Date**: September 9, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-hundreds-of-deregulated/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Fix massive ZIP code coverage gap where 883 out of 893 Texas cities with electricity choice cannot be accessed via ZIP code navigation. Users get "not found in service area" errors despite being in deregulated markets. Achieve 100% coverage by integrating authoritative data sources (ERCOT, PUCT, utility APIs) to map all Texas deregulated ZIP codes to appropriate city electricity plan pages with <200ms response times and 99.9% accuracy.

## Technical Context
**Language/Version**: TypeScript 5.x with Node.js 18+, Astro 5.x framework  
**Primary Dependencies**: Drizzle ORM, PostgreSQL (Neon), Redis (ioredis), Zod validation  
**Storage**: PostgreSQL database with JSON file fallbacks, Redis caching layer  
**Testing**: Vitest (unit), Playwright (E2E), contract tests, integration tests  
**Target Platform**: Web application, Netlify deployment with serverless functions
**Project Type**: web - existing web application enhancement  
**Performance Goals**: <200ms ZIP lookup response time, 10,000+ concurrent requests, <500ms total navigation  
**Constraints**: Constitutional compliance (no hardcoded IDs), 100% real data architecture, Texas-only focus  
**Scale/Scope**: 25,000+ Texas ZIP codes, 893 cities, 5 major TDSPs, external API integrations

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: [#] (max 3 - e.g., api, cli, tests)
- Using framework directly? (no wrapper classes)
- Single data model? (no DTOs unless serialization differs)
- Avoiding patterns? (no Repository/UoW without proven need)

**Architecture**:
- EVERY feature as library? (no direct app code)
- Libraries listed: [name + purpose for each]
- CLI per library: [commands with --help/--version/--format]
- Library docs: llms.txt format planned?

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? (test MUST fail first)
- Git commits show tests before implementation?
- Order: Contract→Integration→E2E→Unit strictly followed?
- Real dependencies used? (actual DBs, not mocks)
- Integration tests for: new libraries, contract changes, shared schemas?
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included?
- Frontend logs → backend? (unified stream)
- Error context sufficient?

**Versioning**:
- Version number assigned? (MAJOR.MINOR.BUILD)
- BUILD increments on every change?
- Breaking changes handled? (parallel tests, migration plan)

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: [DEFAULT to Option 1 unless Technical Context indicates web/mobile app]

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Generate from ZIP coverage API contracts and data model entities
- External data integration tasks (ERCOT, PUCT, TDSP API clients)
- Database schema and migration tasks for ZIP mapping entities
- Service layer implementation for coverage validation and sync
- API endpoint implementation matching OpenAPI contracts
- Contract test implementation (failing tests first - TDD compliance)
- Integration tests for external data source validation
- Performance optimization tasks (caching, indexing, query optimization)

**Ordering Strategy**:
- **Phase A**: Contract tests and external API research [P]
- **Phase B**: Database schema, migrations, and entity models [P] 
- **Phase C**: External data source integration services (ERCOT→PUCT→TDSPs)
- **Phase D**: Core ZIP coverage validation service implementation
- **Phase E**: API endpoint implementation and enhanced lookup logic
- **Phase F**: Performance optimization, caching, and monitoring
- **Phase G**: Integration testing and validation scenario execution

**Task Categories**:
1. **Contract Tests** (5 tasks) [P] - API endpoint validation tests
2. **Data Infrastructure** (4 tasks) [P] - Database schema, indexes, migrations  
3. **External Integration** (8 tasks) - ERCOT, PUCT, TDSP API clients
4. **Core Services** (6 tasks) - ZIP validation, territory mapping, conflict resolution
5. **API Implementation** (5 tasks) - Endpoint logic, enhanced lookup, bulk operations
6. **Performance** (4 tasks) - Caching, optimization, monitoring
7. **Testing & Validation** (6 tasks) - Integration tests, quickstart validation, load testing

**Estimated Output**: 38-42 numbered, dependency-ordered tasks in tasks.md

**Critical Path**: External API integration → Core validation service → Enhanced lookup API
**Parallel Execution**: Contract tests, database setup, API client development

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅
- [ ] Phase 3: Tasks generated (/tasks command) - NEXT
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅  
- [x] All NEEDS CLARIFICATION resolved ✅
- [x] Complexity deviations documented (none required) ✅

**Artifacts Generated**:
- [x] research.md - External data source analysis and integration approach
- [x] data-model.md - ZIP mapping entities, validation schemas, performance optimization
- [x] contracts/zip-coverage-api.yml - OpenAPI specification for ZIP coverage endpoints
- [x] quickstart.md - Validation scenarios and testing procedures

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*