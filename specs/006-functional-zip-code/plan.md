# Implementation Plan: Functional ZIP Code to City Plans Navigation

**Branch**: `006-functional-zip-code` | **Date**: January 9, 2025 | **Spec**: [spec.md](/Users/mbp-ez/Downloads/AI%20Library/Apps/CMP/choose-my-power/specs/006-functional-zip-code/spec.md)
**Input**: Feature specification from `/specs/006-functional-zip-code/spec.md`

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
Create a streamlined ZIP code entry system that directly navigates users to city-specific electricity plans pages with real TDSP/TDU data. Fixes current issues with wrong /texas redirects, intermediate error pages, and partial rendering. The solution leverages existing ZIP validation services while improving the navigation flow to ensure users reach `/electricity-plans/{city-slug}-tx/` with full page loads and real plan data.

## Technical Context
**Language/Version**: TypeScript 5.9.2, Node.js >=20.5.0  
**Primary Dependencies**: Astro 5.13.4, React 18.3.1, Tailwind CSS, existing ZIP validation services  
**Storage**: PostgreSQL with Drizzle ORM, Redis caching, JSON fallback files  
**Testing**: Vitest (unit), Playwright (E2E), existing contract tests  
**Target Platform**: Web application (server-side rendered with hydrated components)
**Project Type**: web - frontend+backend (Astro with React components)  
**Performance Goals**: <200ms ZIP validation, <500ms total navigation flow  
**Constraints**: No intermediate pages, full page rendering, real data only (no mock data)  
**Scale/Scope**: 881+ Texas cities, existing ZIP validation API, TDSP territory mapping

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (web app - leverages existing Astro structure)
- Using framework directly? YES (Astro pages, React components, no wrappers)
- Single data model? YES (ZIP → City → Plans mapping, no DTOs)
- Avoiding patterns? YES (direct service calls, no Repository pattern needed)

**Architecture**:
- EVERY feature as library? NO - web app enhancement using existing services
- Libraries listed: Existing ZIP validation service, city mapping service
- CLI per library: N/A (web feature, not library)
- Library docs: N/A (web feature integration)

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES (contract tests fail first)
- Git commits show tests before implementation? YES (contract tests → implementation)
- Order: Contract→Integration→E2E→Unit strictly followed? YES
- Real dependencies used? YES (actual PostgreSQL, Redis, no mocks per constitution)
- Integration tests for: ZIP navigation flow, city plan rendering
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? YES (navigation analytics, error tracking)
- Frontend logs → backend? YES (navigation events, error reporting)
- Error context sufficient? YES (ZIP validation errors, navigation failures)

**Versioning**:
- Version number assigned? YES (0.0.0 incremented to 0.1.0)
- BUILD increments on every change? YES
- Breaking changes handled? NO breaking changes (enhancement only)

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

**Structure Decision**: Option 2 - Web application (existing Astro src/ structure with React components)

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
- Load `/templates/tasks-template.md` as base structure
- Generate tasks from Phase 1 artifacts: contracts, data model, quickstart scenarios
- **Contract-driven tasks**: `/contracts/zip-navigation-api.yaml` → contract test implementations
- **Data model tasks**: Entities from `data-model.md` → type definitions and validation
- **User story tasks**: Scenarios from `quickstart.md` → integration tests and UI components
- **Implementation tasks**: Make failing tests pass with real implementations

**Specific Task Categories**:

1. **Contract Testing Tasks** [P]:
   - Implement contract tests for `/api/zip/navigate` endpoint
   - Implement contract tests for `/api/zip/validate-city-plans` endpoint  
   - Performance validation tests (<200ms, <500ms requirements)
   - Error handling validation tests

2. **API Implementation Tasks**:
   - Create `/api/zip/navigate` endpoint implementation
   - Create `/api/zip/validate-city-plans` endpoint implementation
   - Fix legacy `/api/zip-lookup` redirect URL (critical bug fix)
   - Implement ZIP validation service integration

3. **Data Model & Service Tasks** [P]:
   - Update ZIP validation service with city slug consistency
   - Implement plan availability pre-validation service
   - Create navigation result tracking service
   - Update city service for proper URL slug generation

4. **UI Component Tasks**:
   - Update ZIP input components to use new navigation API
   - Implement button state management (inactive until valid ZIP)
   - Add real-time validation feedback
   - Ensure direct navigation without intermediate pages

5. **Integration & E2E Tasks**:
   - Complete navigation flow testing (ZIP entry → city plans page)
   - Full page rendering validation (no partial loading states)
   - Cross-browser navigation testing
   - Performance benchmarking and optimization

**Ordering Strategy**:
- **TDD Phase 1**: Contract tests first (must fail initially - RED phase)
- **TDD Phase 2**: API implementations to make contract tests pass (GREEN phase)  
- **TDD Phase 3**: UI components and integration tests
- **TDD Phase 4**: E2E validation and performance optimization (REFACTOR phase)
- **Dependency order**: API endpoints → Services → UI components → Integration tests
- **Mark [P]** for parallel execution (independent contract tests, service updates)

**Critical Path Items**:
1. Fix legacy API redirect URL (blocks all navigation)
2. Implement new navigation endpoint (enables proper flow)
3. Update UI components (provides user interface)
4. E2E validation (ensures complete functionality)

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md

**Performance & Quality Gates**:
- All contract tests must pass before UI implementation
- Navigation performance must meet <500ms requirement
- Zero intermediate pages in navigation flow
- Full constitutional compliance (real data, dynamic IDs)

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
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*