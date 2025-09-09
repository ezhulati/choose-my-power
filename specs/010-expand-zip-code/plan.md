# Implementation Plan: Comprehensive Texas ZIP Code Navigation

**Branch**: `010-expand-zip-code` | **Date**: 2025-09-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-expand-zip-code/spec.md`

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
Expand ZIP code navigation beyond the 4 core metro areas to achieve 100% coverage of all Texas deregulated electricity markets. Currently, users in Tyler get routed to Dallas plans, Corpus Christi users get NOT_FOUND errors, and Waco users get Fort Worth plans. The solution requires precise ZIP-to-city mapping for all 20+ deregulated cities in Texas, replacing overly broad ZIP ranges with city-specific routing.

## Technical Context
**Language/Version**: TypeScript 4.9+, Node.js 18+, Astro 5  
**Primary Dependencies**: Astro, React 18, TypeScript, Drizzle ORM, Neon PostgreSQL  
**Storage**: PostgreSQL (Neon) with JSON fallbacks, Redis cache  
**Testing**: Vitest (unit), Playwright (E2E), integration tests  
**Target Platform**: Web (Netlify serverless functions + static generation)
**Project Type**: web - determines source structure  
**Performance Goals**: <500ms ZIP validation, handles concurrent lookups  
**Constraints**: Must maintain existing 4 metro area functionality, constitutional compliance  
**Scale/Scope**: 881+ Texas cities, 20+ new deregulated areas, statewide coverage

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (web application with frontend + backend)
- Using framework directly? Yes (Astro/React without wrapper classes)
- Single data model? Yes (ZIP mapping extends existing city/plan entities)
- Avoiding patterns? Yes (direct service layer access, no unnecessary repositories)

**Architecture**:
- EVERY feature as library? Yes (ZIP validation service, mapping utilities)
- Libraries listed: 
  - zip-validation-service: ZIP code validation and city resolution
  - texas-market-data: Deregulated area definitions and TDU mappings
  - city-routing: URL generation and navigation logic
- CLI per library: Not applicable (web service endpoints)
- Library docs: Will be documented in service layer

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES (tests fail first, then implementation)
- Git commits show tests before implementation? YES (constitutional requirement)
- Order: Contract→Integration→E2E→Unit strictly followed? YES 
- Real dependencies used? YES (PostgreSQL, real ERCOT/TDU APIs, no mocks)
- Integration tests for: YES (ZIP validation service, TDU mapping updates, city routing)
- FORBIDDEN: Implementation before test, skipping RED phase - ACKNOWLEDGED

**Observability**:
- Structured logging included? YES (existing AnalyticsService integration)
- Frontend logs → backend? YES (ZIP navigation tracking via existing service)
- Error context sufficient? YES (detailed error codes and user-friendly messages)

**Versioning**:
- Version number assigned? YES (extends existing ZIP validation system)
- BUILD increments on every change? YES (follows existing CI/CD practices)  
- Breaking changes handled? YES (maintains backward compatibility, adds new coverage)

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
- Generate from Phase 1 design artifacts (research.md, data-model.md, contracts/, quickstart.md)
- Each API endpoint in contracts/ → contract test task + implementation task
- Each entity in data-model.md → database schema + service layer task
- Each test scenario in quickstart.md → integration test task
- Performance requirements → load testing tasks

**Ordering Strategy** (Constitutional TDD Compliance):
1. **Contract Tests**: API endpoint contract tests (must fail initially)
2. **Integration Tests**: Service layer integration tests (real database/APIs)
3. **E2E Tests**: Complete user journey tests via quickstart scenarios
4. **Implementation Tasks**: Make tests pass through service/API implementation
5. **Performance Tasks**: Load testing and optimization after functionality

**Parallel Execution Opportunities [P]**:
- Database schema migrations [P]
- Individual city ZIP mapping data population [P]
- Contract test creation for different API endpoints [P]
- Service layer unit tests [P]

**Critical Dependencies**:
- Database schema must complete before service layer implementation
- Service layer must complete before API endpoint implementation  
- All tests must be written and failing before implementation begins
- Performance tasks require functional implementation to be complete

**Estimated Output**: 30-35 numbered, ordered tasks in tasks.md
- 8-10 Contract test tasks
- 6-8 Database/data model tasks  
- 10-12 Service layer implementation tasks
- 4-6 Integration test tasks
- 3-4 Performance and validation tasks

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
- [x] Phase 0: Research complete (/plan command) - research.md generated
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/zip-navigation-api.yml, quickstart.md generated  
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - strategy documented
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS - no violations identified
- [x] Post-Design Constitution Check: PASS - design maintains constitutional compliance  
- [x] All NEEDS CLARIFICATION resolved - research phase addressed all unknowns
- [x] Complexity deviations documented - no deviations needed

**Deliverables Completed**:
- [x] research.md - comprehensive analysis with ComparePower API integration requirements
- [x] data-model.md - complete entity definitions with pricing API DUNS mapping
- [x] contracts/zip-navigation-api.yml - OpenAPI 3.0 specification with ComparePower testing endpoint
- [x] quickstart.md - comprehensive testing guide including real plan availability validation
- [x] Constitutional compliance verified throughout
- [x] ComparePower Pricing API integration design (real plan data validation)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*