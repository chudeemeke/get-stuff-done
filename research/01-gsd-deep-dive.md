# GSD Repository Deep Dive Analysis

## Repository Info
- **URL:** https://github.com/gsd-build/get-shit-done
- **Version:** v1.9.11 (latest release as of January 23, 2026)
- **Date analyzed:** January 25, 2026
- **Stars:** 7.2k
- **Forks:** 755
- **License:** MIT
- **Author:** TÂCHES (glittercowboy)
- **Description:** A light-weight and powerful meta-prompting, context engineering and spec-driven development system for Claude Code and OpenCode

## Custom Agent Definitions Found

### 1. gsd-executor

**Frontmatter:**
```yaml
name: gsd-executor
description: Executes GSD plans with atomic commits, deviation handling, checkpoints, and state management
tools: Read, Write, Edit, Bash, Grep, Glob
color: yellow
```

**Purpose:** Executes plan files atomically, creating individual commits per task while handling deviations, pausing at checkpoints, and producing comprehensive summaries.

**Key Features:**
- Loads project state and planning config before operations
- Parses plan frontmatter and tasks
- Determines execution pattern (autonomous, checkpoint-based, or continuation)
- Executes tasks sequentially with proper verification
- Generates SUMMARY.md and updates STATE.md

**Deviation Handling (4 automatic rules):**
1. Auto-fix bugs (incorrect behavior, errors, security issues)
2. Auto-add critical functionality (validation, auth, error handling)
3. Auto-fix blocking issues (missing dependencies, config errors)
4. Request architectural decisions (new tables, schema changes, major refactoring)

**Checkpoint Protocol:** When encountering checkpoint tasks, the agent stops and returns structured messages indicating human verification, decisions, or actions needed.

**Commit Strategy:** Each completed task receives an atomic commit using conventional format: `{type}({phase}-{plan}): {description}`

**TDD Support:** For tasks marked `tdd="true"`, follows red-green-refactor cycles with test-first development.

---

### 2. gsd-planner

**Frontmatter:**
```yaml
name: gsd-planner
description: Creates executable phase plans with task breakdown, dependency analysis, and goal-backward verification. Spawned by /gsd:plan-phase orchestrator.
tools: Read, Write, Bash, Glob, Grep, WebFetch, mcp__context7__*
color: green
```

**Core Philosophy:**
- **Plans ARE prompts, not documents that become prompts.** Each PLAN.md contains objective, context, tasks with verification criteria, and success criteria—directly executable by Claude.
- **Quality degrades under context pressure.** Plans target ~50% context usage maximum to maintain thoroughness.
- **Aggressive atomicity:** More smaller plans deliver consistent quality versus fewer large plans that degrade mid-execution.

**Operating Modes:**
- Standard planning via `/gsd:plan-phase`
- Gap closure via `/gsd:plan-phase --gaps` (addressing verification failures)
- Revision mode (updating plans based on checker feedback)

**Task Breakdown Standards (4 required elements):**
```xml
<task type="auto">
  <name>Task N: Action-oriented name</name>
  <files>src/path/file.ts, src/other/file.ts</files>
  <action>What to do, what to avoid and WHY</action>
  <verify>Command or check to prove completion</verify>
  <done>Measurable acceptance criteria</done>
</task>
```

**Task Sizing:** 15-60 minutes of Claude execution. Smaller tasks combine; larger tasks split into separate plans. Tasks touching >5 files typically signal split-into-plans.

**Dependency & Wave Management:**
- Builds explicit dependency graphs (needs/creates per task) before grouping into plans
- Wave assignment: tasks with no dependencies → Wave 1 (parallel), tasks depending only on Wave 1 → Wave 2 (parallel), etc.
- **Vertical slices (full feature ownership per plan) preferred over horizontal layers** to enable parallelism

**Goal-Backward Methodology:**
1. State goal (observable result, not work)
2. Derive truths (3-7 user-perspective behaviors)
3. Derive artifacts (specific files required)
4. Derive wiring (critical connections)
5. Identify key links (fragile connection points)

Result: `must_haves` frontmatter capturing truths, artifacts, and key links that verification can validate.

**Discovery Protocol (3 levels):**
- **Level 0:** Skip (internal patterns only, no new dependencies)
- **Level 1:** Quick verify (known library, 2-5 min)
- **Level 2:** Standard research (2-3 options, new integration, 15-30 min)
- **Level 3:** Deep dive (architecture decision, 1+ hour)

**Checkpoint Types:**
- **checkpoint:human-verify (90%):** User confirms Claude's automated work functions correctly
- **checkpoint:decision (9%):** Human selects implementation path
- **checkpoint:human-action (1%, rare):** Unavoidable manual interaction

**Scope & Context Management:**
- Each plan: 2-3 tasks maximum
- Total context per plan: ~50% (target; avoid >70%)
- Estimation: Simple CRUD ~10-15% per task, complex logic ~25-40%

**Plan Format Frontmatter:**
```yaml
phase: XX-name
plan: NN
type: execute|tdd
wave: N
depends_on: [plan-ids]
files_modified: [files]
autonomous: true|false
user_setup: [items]  # omit if empty

must_haves:
  truths: [observable behaviors]
  artifacts: [required files]
  key_links: [critical connections]
```

---

### 3. gsd-phase-researcher

**Frontmatter:**
```yaml
name: gsd-phase-researcher
description: Researches how to implement a phase before planning. Produces RESEARCH.md consumed by gsd-planner. Spawned by /gsd:plan-phase orchestrator.
tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*
color: cyan
```

**Core Question:** "What do I need to know to PLAN this phase well?"

**Research Philosophy:**
- **Treat Claude's training as hypothesis, not fact.** Verify claims through Context7, official docs, and WebSearch
- Report honestly about gaps and uncertainties rather than padding findings

**Tool Strategy Hierarchy:**
1. **Context7 first** — resolve library ID, query documentation
2. **Official docs via WebFetch** — verify changelog, features, configuration
3. **WebSearch** — discover ecosystem patterns, community approaches
4. **Verification** — cross-reference findings, assign confidence levels

**Output Format:** Creates `.planning/phases/XX-name/{phase}-RESEARCH.md` containing:
- Executive summary
- Standard Stack (with versions and rationale)
- Architecture Patterns (with code examples)
- Don't Hand-Roll (problems with existing solutions)
- Common Pitfalls (gotchas and prevention)
- State of the Art (deprecated vs. current approaches)
- Source attribution and confidence breakdown

**Success Indicators:** Research succeeds when findings are **specific** (versions, exact libraries), **verified** (cited sources), **honest** (confidence levels, acknowledged gaps), and **actionable** (planner can create tasks from it).

---

### 4. gsd-project-researcher

**Frontmatter:**
```yaml
name: gsd-project-researcher
description: Researches domain ecosystem before roadmap creation. Produces files in .planning/research/ consumed during roadmap creation. Spawned by /gsd:new-project or /gsd:new-milestone orchestrators.
tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*
color: cyan
```

**Core Question:** "What does this domain ecosystem look like?"

**Key Responsibilities:**
- Survey domain ecosystems broadly
- Identify technology options and recommendations
- Map feature categories (table stakes vs. differentiators)
- Document architecture patterns and anti-patterns
- Catalog domain-specific pitfalls
- Produce research files consumed by roadmap creation

**Research Modes:**
1. **Ecosystem** (default): Survey landscape, identify standards, document options
2. **Feasibility**: Assess technical achievability and blockers
3. **Comparison**: Evaluate alternatives with tradeoff analysis

**Tool Strategy:** Context7 → Official docs (WebFetch) → WebSearch with verification

**Output Files (all in `.planning/research/`):**
- **SUMMARY.md**: Executive synthesis with roadmap implications
- **STACK.md**: Technology recommendations with versions
- **FEATURES.md**: Feature landscape categorization
- **ARCHITECTURE.md**: System structure patterns
- **PITFALLS.md**: Common mistakes and prevention strategies
- Optional: COMPARISON.md, FEASIBILITY.md

**Success Criteria:** Comprehensive, opinionated findings with verified sources, honest confidence levels, and actionable recommendations for phase structuring.

---

### 5. gsd-verifier

**Frontmatter:**
```yaml
name: gsd-verifier
description: Verifies phase goal achievement through goal-backward analysis. Checks codebase delivers what phase promised, not just that tasks completed. Creates VERIFICATION.md report.
tools: Read, Bash, Grep, Glob
color: green
```

**Core Principle:** "Task completion ≠ Goal achievement."

**Verification Process:**
1. **Load Context:** Extract phase goals from ROADMAP.md and requirements from REQUIREMENTS.md
2. **Establish Must-Haves:** Identify truths (observable behaviors), artifacts (files), and key links (wiring)
3. **Three-Level Artifact Verification:**
   - **Level 1: Existence** — Does the file exist?
   - **Level 2: Substantive** — Does it contain real implementation (adequate lines, no stubs, exports)?
   - **Level 3: Wired** — Is it imported and used throughout the codebase?
4. **Link Verification:** Confirm critical connections (component→API, API→database, form→handler, state→render)
5. **Gap Detection:** Identify missing or stubbed implementations using pattern matching for TODOs, placeholders, empty returns, orphaned code
6. **Re-verification Support:** Focus on failed items from previous VERIFICATION.md and check for regressions
7. **Report Generation:** Create VERIFICATION.md with structured gap analysis in YAML frontmatter

**Status Outcomes:**
- **passed** — All truths verified, artifacts complete, no blockers
- **gaps_found** — Specific missing/stubbed items blocking goal
- **human_needed** — Automated checks pass; human testing required

**Critical Constraint:** "DO NOT trust SUMMARY.md claims." The agent verifies actual codebase state, not stated intentions.

---

### 6. gsd-plan-checker

**Frontmatter:**
```yaml
name: gsd-plan-checker
description: Verifies plans will achieve phase goal before execution. Goal-backward analysis of plan quality. Spawned by /gsd:plan-phase orchestrator.
tools: Read, Bash, Glob, Grep
color: green
```

**Core Distinction:** Plan completeness differs fundamentally from goal achievement. This agent verifies plans *before* execution (unlike gsd-verifier, which checks code *after* execution).

**Six Verification Dimensions:**
1. **Requirement Coverage** — Every phase requirement has corresponding tasks
2. **Task Completeness** — All required fields present (files, action, verify, done)
3. **Dependency Correctness** — Valid, acyclic dependency graphs with proper wave assignment
4. **Key Links Planned** — Artifacts are wired together, not isolated
5. **Scope Sanity** — Plans remain within context budget (2-3 tasks per plan target)
6. **Verification Derivation** — must_haves reflect user-observable truths, not implementation details

**10-Step Methodology:**
- Load context
- Parse all plans
- Extract must_haves
- Map requirements to tasks
- Validate task structure
- Build dependency graphs
- Check artifact wiring
- Assess scope
- Verify must_haves derivation
- Determine overall status

**Output:**
- **VERIFICATION PASSED** (execution ready)
- **ISSUES FOUND** (blockers, warnings, info-level items requiring revision)

---

### 7. gsd-debugger

**Frontmatter:**
```yaml
name: gsd-debugger
description: Investigates bugs using scientific method, manages debug sessions, handles checkpoints. Spawned by /gsd:debug orchestrator.
tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch
color: orange
```

**Core Philosophy:**
- Users report symptoms; Claude investigates causes without asking what's broken
- Fights "meta-debugging" bias by treating its own code as foreign
- Questions design decisions rather than defending them

**Cognitive Discipline:**
- Avoids confirmation bias by actively seeking disconfirming evidence
- Prevents anchoring by generating 3+ hypotheses before investigating
- Applies "sunk cost check" every 30 minutes

**Investigation Techniques:**
- **Binary search:** Isolates failures by repeatedly halving problem space
- **Rubber duck debugging:** Exposes gaps through complete articulation
- **Minimal reproduction:** Strips complexity until bugs become obvious
- **Working backwards:** Starts from desired output, traces to where actual diverges
- **Differential debugging:** Identifies what changed (time-based or environment-based)
- **Git bisect:** Finds exact breaking commits
- **Observability first:** Adds logging before making changes

**Hypothesis Testing Framework:**
Valid hypotheses are **falsifiable** with specific predictions.
- **BAD:** "Something is wrong with state"
- **GOOD:** "State resets when component remounts after route change"

Testing follows: **Prediction → Test Setup → Measurement → Success Criteria → Execution → Observation → Conclusion**

**Debug File Protocol:**
Files persist in `.planning/debug/` with:
- Immutable: Symptoms
- Append-only: Evidence, Eliminated sections
- Overwritable: Current Focus, Resolution

**Status Transitions:** gathering → investigating → fixing → verifying → resolved

**Mode Flags:**
- `symptoms_prefilled: true` – Skip gathering, start investigating
- `goal: find_root_cause_only` – Diagnose without fixing
- `goal: find_and_fix` – Full cycle (default)

**Returns:**
- **ROOT CAUSE FOUND** – Diagnosis with evidence summary
- **DEBUG COMPLETE** – Root cause, fix applied, verification method, files changed
- **INVESTIGATION INCONCLUSIVE** – What was checked, eliminated hypotheses, remaining possibilities
- **CHECKPOINT REACHED** – Type-specific format awaiting user input

---

### 8. gsd-roadmapper

**Frontmatter:**
```yaml
name: gsd-roadmapper
description: Creates project roadmaps with phase breakdown, requirement mapping, success criteria derivation, and coverage validation. Spawned by /gsd:new-project orchestrator.
tools: Read, Write, Bash, Glob, Grep
color: purple
```

**Core Purpose:** Transforms project requirements into structured phases with observable success criteria. Operates within solo developer + Claude workflow.

**Key Responsibilities:**
- **Phase Derivation:** Extract natural delivery boundaries from requirements rather than applying arbitrary structure
- **Complete Coverage:** Ensure every v1 requirement maps to exactly one phase with no orphans
- **Goal-Backward Thinking:** Define success by what must be true for users upon completion, not by task lists
- **Success Criteria:** Generate 2-5 observable user behaviors per phase
- **State Management:** Initialize project memory in STATE.md

**Quality Checkpoints:**
- All v1 requirements achieve bidirectional traceability with phases and success criteria
- Zero orphaned requirements
- Fully documented dependencies

---

### 9. gsd-codebase-mapper

**Frontmatter:**
```yaml
name: gsd-codebase-mapper
description: Explores codebase and writes structured analysis documents. Spawned by map-codebase with a focus area (tech, arch, quality, concerns). Writes documents directly to reduce orchestrator context load.
tools: Read, Bash, Grep, Glob, Write
color: cyan
```

**Core Purpose:** Systematically analyzes codebases across four focus areas and generates reference documents consumed by other GSD commands. Writes analysis directly to `.planning/codebase/`.

**Focus Areas & Outputs:**

| Focus | Documents | Purpose |
|-------|-----------|---------|
| **tech** | STACK.md, INTEGRATIONS.md | Technology stack and external service integrations |
| **arch** | ARCHITECTURE.md, STRUCTURE.md | System design patterns and file organization |
| **quality** | CONVENTIONS.md, TESTING.md | Code style standards and test patterns |
| **concerns** | CONCERNS.md | Technical debt, bugs, security risks |

**Key Operational Principles:**
- **File Paths Required:** Every finding must reference actual file locations in backticks (e.g., `src/services/user.ts`)
- **Prescriptive Over Descriptive:** Documents should guide future code writing with patterns and examples
- **Template Compliance:** All documents follow structured templates
- **Direct Document Writing:** Output goes directly to `.planning/codebase/` without intermediate orchestrator summaries

---

### 10. gsd-integration-checker

**Frontmatter:**
```yaml
name: gsd-integration-checker
description: Verifies cross-phase integration and E2E flows. Checks that phases connect properly and user workflows complete end-to-end.
tools: Read, Bash, Grep, Glob
color: blue
```

**Fundamental Principle:** "Existence ≠ Integration"—a codebase can have all pieces present yet fail due to broken connections.

**Key Responsibilities:**
1. **Export/Import Verification:** Confirms that exported functions, components, and types from one phase are actually imported and used by consuming phases
2. **API Route Coverage:** Ensures API endpoints have callers; identifies orphaned routes with no consumers
3. **Auth Protection Validation:** Checks that sensitive areas properly implement authentication checks
4. **End-to-End Flow Tracing:** Follows complete user workflows to identify breaks at any step

**Six Verification Steps:**
- Build export/import dependency maps from phase summaries
- Scan for unused exports across phases
- Identify APIs without consumers
- Validate auth protections on restricted routes
- Trace common flows (auth, data display, forms)
- Generate structured findings

**Output:** Detailed report identifying orphaned code, missing connections, broken flows, and unprotected routes—with specific file locations and actionable break points.

---

### 11. gsd-research-synthesizer

**Frontmatter:**
```yaml
name: gsd-research-synthesizer
description: Synthesizes research outputs from parallel researcher agents into SUMMARY.md. Spawned by /gsd:new-project after 4 researcher agents complete.
tools: Read, Write, Bash
color: purple
```

**Core Purpose:** Consolidates parallel research streams (STACK, FEATURES, ARCHITECTURE, PITFALLS) into a unified research summary that informs roadmap creation.

**Primary Responsibilities:**
1. Aggregate research: Read outputs from four parallel researcher agents
2. Extract patterns: Identify cross-cutting themes and dependencies across research domains
3. Synthesize findings: Create executive summary with clear conclusions
4. Derive implications: Generate phase structure recommendations for roadmap
5. Assess confidence: Evaluate source quality and identify gaps
6. Commit research: Write SUMMARY.md and commit all planning documentation

**8-Step Process:**
- Read all four research files from `.planning/research/`
- Generate 2-3 paragraph executive summary
- Extract key findings per research domain
- Propose phase structure with rationale
- Identify which phases need additional research
- Complete confidence assessment matrix
- Write SUMMARY.md to template format
- Commit all research files (unless `commit_docs: false`)

**Success Criteria:** SUMMARY.md synthesizes rather than concatenates findings, provides opinionated recommendations, enables phase structuring, and honestly assesses research confidence levels and gaps.

---

## Task Management Tools Usage

### Does GSD use TaskCreate/TaskUpdate/TaskList?

**YES** - GSD extensively uses the Task tool for spawning subagents.

### Evidence and Examples:

**From gsd-statusline.js:**
The statusline hook reads task state files directly from the filesystem:
```javascript
// Location: ~/.claude/todos/[session-id]-agent-*.json
// Expected JSON structure with:
// - status field (e.g., "in_progress")
// - activeForm field (displays current task description)
```

**From /gsd:new-project orchestration:**
The specification defines **7 Task invocations** during project initialization:

| Task | Type | Purpose |
|------|------|---------|
| Stack research | general-purpose | Determine 2025 tech stack with versions |
| Features research | general-purpose | Categorize table stakes vs. differentiators |
| Architecture research | general-purpose | Map component boundaries and data flow |
| Pitfalls research | general-purpose | Surface domain-specific mistakes |
| Research synthesizer | gsd-research-synthesizer | Merge 4 outputs into SUMMARY.md |
| Roadmapper | gsd-roadmapper | Create phases with requirement mappings |
| Roadmap revision | gsd-roadmapper | Adjust phases per user feedback |

**Parallel Task Spawning Pattern:**
```
Research phase spawns 4 concurrent Task calls:
Task(..., subagent_type="general-purpose", model="{researcher_model}")
- STACK.md researcher
- FEATURES.md researcher
- ARCHITECTURE.md researcher
- PITFALLS.md researcher
```

All agents receive identical context structure:
- `<research_type>`: Dimension they investigate
- `<milestone_context>`: Greenfield vs. subsequent flag
- `<project_context>`: PROJECT.md summary
- `<downstream_consumer>`: How their output gets used
- `<quality_gate>`: Verification checklist

**Key Insight:** GSD does NOT use TaskCreate/TaskUpdate/TaskList in the traditional todo-tracking sense. Instead, it uses the **Task tool for spawning subagents with fresh context windows**. The task state files are generated automatically by Claude Code's Task tool, not manually managed through TaskCreate/TaskUpdate/TaskList API calls.

---

## Orchestration Patterns

### 1. Sequential-with-Parallel Phases Pattern

**Example: /gsd:new-project**

```
1. Setup (Sequential): Git initialization, brownfield detection
2. Questioning (Sequential): Interactive threading until clarity achieved
3. Research (Parallel): 4 independent researcher agents spawn simultaneously
4. Requirements (Sequential): Scoping through category-based decisions
5. Roadmap (Sequential): Single roadmapper synthesizes all context
```

### 2. Wave-Based Parallel Execution

**Example: /gsd:execute-phase**

Plans are organized into dependency-aware waves:
- **Wave 1:** Tasks with no dependencies (execute in parallel)
- **Wave 2:** Tasks depending only on Wave 1 (execute in parallel after Wave 1 completes)
- **Wave N:** Tasks depending on Wave N-1

Each wave spawns parallel executors with fresh 200k-token contexts.

### 3. Iterative Verification Loop

**Example: Plan Verification**

```
1. gsd-planner creates PLAN.md files
2. gsd-plan-checker verifies plans
3. If issues found:
   - gsd-planner revises plans based on feedback
   - Loop back to step 2
4. When verification passes:
   - Proceed to execution
```

### 4. Goal-Backward Validation

**Example: gsd-verifier**

```
1. Load phase goals from ROADMAP.md
2. Extract must_haves (truths, artifacts, key links)
3. Verify existence (Level 1)
4. Verify substantive implementation (Level 2)
5. Verify wiring/integration (Level 3)
6. Detect gaps (TODOs, placeholders, stubs)
7. Return status: passed | gaps_found | human_needed
```

### 5. Checkpoint-Based Pause-Resume

**Example: gsd-executor**

```
1. Parse plan with checkpoint tasks
2. Execute autonomous tasks sequentially
3. When checkpoint encountered:
   - Stop execution
   - Return structured checkpoint message to user
   - Wait for user input
4. User provides input (verification, decision, action)
5. Resume execution from next task
```

### 6. Context-Preserving Orchestration

**Key Insight:** Orchestrators maintain 30-40% context utilization while delegating heavy work to subagent contexts, preventing context window degradation.

**Pattern:**
- Orchestrator: Lightweight coordination logic only
- Subagents: Heavy research, planning, execution work
- Communication: Structured XML/YAML for machine readability
- Persistence: Files written immediately, not held in memory

---

## State File Formats

### 1. PLAN.md Format

**Frontmatter (YAML):**
```yaml
---
phase: XX-name
plan: NN
type: execute|tdd
wave: N
depends_on: [plan-ids]
files_modified: [files]
autonomous: true|false
user_setup: [items]  # omit if empty

must_haves:
  truths: [observable behaviors]
  artifacts: [required files]
  key_links: [critical connections]
---
```

**Body (XML):**
```xml
<objective>
What/why/when for the plan
</objective>

<execution_context>
Relevant phase/project context
</execution_context>

<context>
Technical context, patterns, conventions
</context>

<tasks>
<task type="auto">
  <name>Task 1: Action-oriented name</name>
  <files>src/path/file.ts, src/other/file.ts</files>
  <action>What to do, what to avoid and WHY</action>
  <verify>Command or check to prove completion</verify>
  <done>Measurable acceptance criteria</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Description of deliverable</what-built>
  <how-to-verify>
    1. Step one
    2. Step two
  </how-to-verify>
  <resume-signal>Type: verified</resume-signal>
</task>

<task type="checkpoint:decision" gate="blocking">
  <decision>What needs deciding</decision>
  <context>Why this matters</context>
  <options>
    <option id="identifier">
      <name>Option Name</name>
      <pros>Benefits</pros>
      <cons>Tradeoffs</cons>
    </option>
  </options>
  <resume-signal>Type: decision={option-id}</resume-signal>
</task>
</tasks>

<verification>
How to verify plan achieves objective
</verification>

<success_criteria>
Observable user behaviors when complete
</success_criteria>

<output>
What files/artifacts this plan produces
</output>
```

**Task Types:**
- `type="auto"` — Claude executes autonomously
- `type="checkpoint:human-verify"` — User verification required
- `type="checkpoint:decision"` — User choice required
- `type="checkpoint:human-action"` — Manual user action required

**Size Constraint:** 2-3 tasks maximum per plan.

---

### 2. STATE.md Format

**Purpose:** Living memory across sessions. Machine-readable tracking for session continuity.

**Structure for Quick Tasks:**
```markdown
## Current Status

Project in phase: XX-name
Active plans: [plan-ids]
Blocked on: [blocker-description or "none"]

## Decisions Made

### Decision: [Topic]
- **Date:** YYYY-MM-DD
- **Choice:** What was decided
- **Rationale:** Why this choice
- **Impact:** Which phases/files affected

## Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Add dark mode toggle | 2026-01-19 | abc123f | [001-add-dark-mode](./quick/001-add-dark-mode/) |
| 002 | Fix login redirect bug | 2026-01-20 | def456g | [002-fix-login](./quick/002-fix-login/) |

## Context for Next Session

[Free-form notes about what Claude should know when resuming]
```

---

### 3. ROADMAP.md Format

**Frontmatter (YAML):**
```yaml
---
project: project-name
version: v1
total_phases: N
---
```

**Body:**
```markdown
# Project Roadmap

## Phase 01: Phase Name

**Goal:** User-observable outcome

**Success Criteria:**
- [ ] Criterion 1 (observable behavior)
- [ ] Criterion 2 (observable behavior)

**Requirements Covered:**
- [REQ-ID-1]: Requirement description
- [REQ-ID-2]: Requirement description

**Plans:**
- [ ] [01-01-PLAN.md](./phases/01-name/01-01-PLAN.md)
- [ ] [01-02-PLAN.md](./phases/01-name/01-02-PLAN.md)

**Verification:** [01-VERIFICATION.md](./phases/01-name/01-VERIFICATION.md)

---

## Phase 02: Next Phase Name
...
```

---

### 4. SUMMARY.md Format

**Frontmatter (YAML):**
```yaml
---
phase: XX-name
plan: NN
wave: N
date_completed: YYYY-MM-DD
commits: [commit-sha-1, commit-sha-2]
provides:
  - artifact-name
  - function/component name
consumes:
  - dependency-name
---
```

**Body:**
```markdown
# Phase XX Plan NN Summary

## What Was Built

[Description of deliverables]

## Key Decisions

- Decision 1 and rationale
- Decision 2 and rationale

## Deviations from Plan

- Deviation 1 (why it was necessary)
- Deviation 2 (why it was necessary)

## Files Modified

- `src/path/file1.ts` - What changed
- `src/path/file2.ts` - What changed

## Verification

✅ All tasks completed
✅ All verify commands passed
✅ Success criteria met

## Next Steps

[What the next plan/phase should address]
```

---

### 5. VERIFICATION.md Format

**Frontmatter (YAML):**
```yaml
---
phase: XX-name
date_verified: YYYY-MM-DD
status: passed|gaps_found|human_needed
gaps:
  - file: src/path/file.ts
    issue: Description of gap
    severity: blocking|warning
---
```

**Body:**
```markdown
# Phase XX Verification Report

## Must-Haves Verification

### Truths (Observable Behaviors)
- [x] Truth 1: Verified via [method]
- [x] Truth 2: Verified via [method]
- [ ] Truth 3: **GAP** - Issue description

### Artifacts (Required Files)
- [x] `src/file1.ts` - Level 3 (Wired)
- [x] `src/file2.ts` - Level 2 (Substantive)
- [ ] `src/file3.ts` - **GAP** - Only stubbed

### Key Links (Critical Connections)
- [x] Component → API: Verified
- [ ] API → Database: **GAP** - Missing connection

## Gap Analysis

### Blocking Gaps (Must Fix)
1. `src/file3.ts` - Only contains stub implementation
2. API → Database connection missing in `src/api/route.ts`

### Warnings (Should Review)
1. Missing error handling in `src/component.tsx`

## Re-verification Plan

[If gaps found, describe what needs to be fixed and how to verify]
```

---

### 6. RESEARCH.md Format

**Created by gsd-phase-researcher**

```markdown
# Phase XX Research

## Executive Summary

[2-3 paragraph synthesis of findings]

## Standard Stack

| Technology | Version | Rationale | Confidence |
|------------|---------|-----------|------------|
| Next.js | 14.1.0 | App router, RSC support | HIGH |
| Prisma | 5.9.0 | Type-safe ORM | HIGH |

## Architecture Patterns

### Pattern 1: Server Actions

```typescript
// Example code showing pattern
'use server'
export async function createUser(data: FormData) {
  // Implementation
}
```

**Why this pattern:** Benefits explained
**Alternatives considered:** Other approaches and why not chosen

## Don't Hand-Roll

1. **Authentication:** Use NextAuth.js instead of custom JWT
2. **Database migrations:** Use Prisma migrations instead of raw SQL

## Common Pitfalls

1. **Pitfall:** Description of mistake
   **Prevention:** How to avoid it
   **Source:** Link to documentation/issue

## State of the Art (2025)

| Approach | Status | Notes |
|----------|--------|-------|
| Old approach | DEPRECATED | Use new approach instead |
| New approach | CURRENT | Industry standard as of 2025 |

## Sources

- Source 1 (url) - HIGH confidence
- Source 2 (url) - MEDIUM confidence
```

---

### 7. Configuration File Format (.planning/config.json)

```json
{
  "mode": "interactive",
  "depth": "standard",
  "model_profile": "adaptive",
  "adaptive_settings": {
    "enable_auto_selection": true,
    "prefer_cost_optimization": true,
    "fallback_on_rate_limit": true,
    "min_model": "haiku",
    "max_model": "opus",
    "log_selections": true
  },
  "commit_planning_docs": true,
  "statusline_display": "full",
  "researcher_model": "sonnet",
  "planner_model": "sonnet",
  "executor_model": "adaptive",
  "verifier_model": "sonnet"
}
```

**Configuration Options:**

| Setting | Options | Default | Control |
|---------|---------|---------|---------|
| `mode` | `yolo`, `interactive` | `interactive` | Auto-approve vs confirmation |
| `depth` | `quick`, `standard`, `comprehensive` | `standard` | Planning thoroughness |
| `model_profile` | `quality`, `balanced`, `budget`, `adaptive` | `balanced` | Cost vs quality tradeoff |

---

### 8. Task State File Format (Auto-generated by Claude Code)

**Location:** `~/.claude/todos/[session-id]-agent-*.json`

```json
{
  "id": "task-123",
  "status": "in_progress",
  "activeForm": "Researching authentication patterns",
  "subject": "Research authentication implementation",
  "description": "Investigate Next.js authentication patterns for phase 03",
  "metadata": {
    "agent_type": "gsd-phase-researcher",
    "phase": "03-auth",
    "started_at": "2026-01-25T10:30:00Z"
  }
}
```

**Note:** These files are auto-generated by Claude Code's Task tool, NOT manually created through TaskCreate/TaskUpdate API calls.

---

## Model Selection

### Model Profiles

GSD offers four profile options configurable via `/gsd:set-profile`:

1. **Quality Profile**
   - All agents use Opus
   - Highest quality output
   - Highest cost

2. **Balanced Profile (Recommended)**
   - Researchers: Sonnet
   - Planners: Sonnet
   - Executors: Sonnet
   - Verifiers: Sonnet
   - Good balance of quality and cost

3. **Budget Profile**
   - Simple tasks: Haiku
   - Complex tasks: Sonnet
   - Lowest cost
   - Acceptable quality for most cases

4. **Adaptive Profile**
   - Automatic model selection based on task complexity
   - Cost optimization or quality preference
   - Intelligent fallback on rate limits

### Adaptive Model Selection Logic

**Task Complexity Thresholds:**

| Complexity | Model | Criteria |
|------------|-------|----------|
| **Simple** | Haiku | CRUD endpoints following established patterns, <3 files, clear template |
| **Medium** | Sonnet | Security-critical logic, 4-6 files, some architectural decisions |
| **Complex** | Opus | New subsystem design, 8+ files, major architecture decisions |

**Adaptive Configuration:**
```json
{
  "model_profile": "adaptive",
  "adaptive_settings": {
    "enable_auto_selection": true,
    "prefer_cost_optimization": true,  // or false for quality
    "fallback_on_rate_limit": true,
    "min_model": "haiku",
    "max_model": "opus",
    "log_selections": true
  }
}
```

**Example Cost Savings (24-hour period):**
- Haiku: 18 tasks
- Sonnet: 12 tasks
- Opus: 3 tasks
- **Estimated savings:** ~62% versus quality profile, ~35% versus balanced profile

### Per-Agent Model Override

Configuration allows granular control:
```json
{
  "model_profile": "adaptive",
  "researcher_model": "sonnet",    // Override: always use Sonnet for research
  "planner_model": "sonnet",       // Override: always use Sonnet for planning
  "executor_model": "adaptive",    // Use adaptive logic for execution
  "verifier_model": "sonnet"       // Override: always use Sonnet for verification
}
```

### Model Selection Commands

- `/gsd:set-profile` - Choose profile (quality/balanced/budget/adaptive)
- `/gsd:settings` - Configure model preferences and adaptive settings

---

## Error Handling

### 1. Blocking Scenarios with Graceful Recovery

**Project Already Initialized:**
```
ERROR: Project already initialized. Use /gsd:progress to view status.
```

**Roadmap Blocked:**
```
1. Present blocker info to user
2. Work with user to resolve blocker
3. Re-spawn roadmapper with updated context
4. Continue workflow
```

**Brownfield Codebase Detected:**
```
1. Detect existing code during initialization
2. Offer mapping via AskUserQuestion
3. If accepted: Run /gsd:map-codebase before continuing
4. If declined: Proceed with new-project flow
```

### 2. Graceful Fallbacks

**Missing Configuration:**
- Model profile defaults to "balanced" if config missing
- Mode defaults to "interactive" if not specified

**Research Skipping:**
- User can skip research if domain is known
- System proceeds directly to requirements gathering

**Alternative Requirements Gathering:**
- Research files preferred but not required
- Can gather requirements via conversation if research unavailable

### 3. Checkpoint-Based Error Recovery

**Authentication Failures:**
Treated as expected pauses, not failures:
```xml
<task type="checkpoint:human-action" gate="blocking">
  <action-needed>Authenticate with GitHub CLI</action-needed>
  <instructions>
    1. Run: gh auth login
    2. Complete browser authentication
    3. Return here and type: authenticated
  </instructions>
  <resume-signal>Type: authenticated</resume-signal>
</task>
```

**External Dependency Failures:**
```xml
<task type="checkpoint:human-action" gate="blocking">
  <action-needed>API credentials required</action-needed>
  <context>Stripe integration needs API keys</context>
  <instructions>
    1. Visit https://dashboard.stripe.com/apikeys
    2. Copy secret key
    3. Run: echo "STRIPE_SECRET_KEY=sk_..." >> .env
  </instructions>
  <resume-signal>Type: credentials-added</resume-signal>
</task>
```

### 4. Deviation Handling in Execution

**4 Automatic Rules (gsd-executor):**

1. **Auto-fix bugs** - Immediately correct:
   - Incorrect behavior
   - Runtime errors
   - Security vulnerabilities

2. **Auto-add critical functionality** - Silently include:
   - Input validation
   - Authentication checks
   - Error handling
   - Missing imports

3. **Auto-fix blocking issues** - Resolve automatically:
   - Missing dependencies (install packages)
   - Configuration errors (fix config)
   - Build failures (address root cause)

4. **Request architectural decisions** - STOP and checkpoint:
   - New database tables
   - Schema changes
   - Major refactoring
   - Technology selection

**Deviation Documentation:**
All deviations (both automatic and manual) are documented in SUMMARY.md with rationale.

### 5. Verification Failure Handling

**When gsd-verifier finds gaps:**

```
1. Create VERIFICATION.md with gap analysis
2. Orchestrator presents gaps to user
3. User chooses:
   - Run /gsd:plan-phase --gaps (create fix plans)
   - Fix manually
   - Accept gaps and proceed
4. If fix plans created:
   - Execute via /gsd:execute-phase --gaps-only
   - Re-verify with focused verification
5. Loop until verification passes
```

**Gap Severity Levels:**
- **Blocking:** Must fix before phase complete
- **Warning:** Should review, may proceed with acknowledgment
- **Info:** Optional improvement, can defer

### 6. Plan Verification Failure Handling

**When gsd-plan-checker finds issues:**

```
1. Return ISSUES FOUND with categorized problems:
   - Blockers (must fix)
   - Warnings (should fix)
   - Info (nice to fix)

2. Orchestrator invokes gsd-planner in revision mode:
   - Pass issue list to planner
   - Planner updates plans to address issues
   - Planner returns updated files

3. Re-run gsd-plan-checker on updated plans

4. Loop until verification passes

5. Proceed to execution only when clean
```

### 7. Context Window Management

**Proactive Prevention:**
- Plans target ~50% context usage (RED zone: >70%)
- TDD plans target ~40% context (more back-and-forth)
- Orchestrators maintain 30-40% utilization
- Heavy work delegated to fresh subagent contexts

**Reactive Handling:**
If context pressure detected:
```
1. Split current plan into 2 smaller plans
2. Reduce task count per plan
3. Extract research to separate phase
4. Create checkpoint for human review
```

### 8. File System Error Handling

**Missing Files:**
```javascript
// From gsd-statusline.js
try {
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
} catch (err) {
  // Silently handle - no state file means no active tasks
  return;
}
```

**Write Failures:**
All agents write files immediately and commit atomically:
```
1. Write file to .planning/
2. Git add
3. Git commit
4. If write fails: Log error, retry once
5. If commit fails: File exists but uncommitted (recoverable)
6. If both fail: Return error to orchestrator
```

### 9. Rate Limit Handling (Adaptive Profile)

**Configuration:**
```json
{
  "adaptive_settings": {
    "fallback_on_rate_limit": true,
    "min_model": "haiku",
    "max_model": "opus"
  }
}
```

**Behavior:**
```
1. Task assigned to Opus based on complexity
2. Opus rate limit hit
3. Automatic fallback to Sonnet
4. If Sonnet rate limited, fallback to Haiku
5. Log downgrade decision
6. Continue execution with degraded model
7. User notified in summary: "Used Haiku due to rate limits"
```

### 10. Git Commit Failure Handling

**Atomic Commit Strategy:**
Each task = one commit. If commit fails:

```
1. Check git status
2. If files staged but not committed:
   - Retry commit
   - If retry fails, create checkpoint for user
3. If files not staged:
   - Re-stage files
   - Retry commit
4. If nothing to commit:
   - Log warning (task may have been no-op)
   - Continue to next task
```

### 11. Debugging Session Management

**Prevents Duplicate Sessions:**
```
1. Check .planning/debug/ for active sessions
2. If active session exists:
   - ERROR: "Debug session [ID] already active"
   - "Use /gsd:debug --resume [ID] to continue"
3. If no active session:
   - Create new debug file
   - Proceed with investigation
```

**Session Persistence:**
```
1. All investigation state persists in debug file
2. If /clear is used:
   - Agent reads debug file to reconstruct state
   - Continues investigation seamlessly
3. When resolved:
   - Archive to .planning/debug/resolved/
   - Optionally commit debug file for history
```

---

## Key Insights

### 1. Orchestration Architecture Principles

**Context-Preserving Design:**
- Orchestrators are lightweight coordinators (30-40% context utilization)
- Heavy work delegated to subagents with fresh 200k-token contexts
- Prevents "context rot" where quality degrades as context fills

**Structured Communication:**
- XML for semantic task structure (Claude comprehension optimized)
- YAML frontmatter for machine-readable metadata
- Markdown bodies for human readability
- Result: Files are both executable prompts AND documentation

**Atomic Operations:**
- Each task = one commit (git bisect locates exact failures)
- Each plan = 2-3 tasks (manageable scope)
- Each phase = coherent user-observable milestone
- Independent revertability at multiple granularities

### 2. Goal-Backward Methodology

**Fundamental Shift:**
Traditional: "Do these tasks" → Hope outcome achieved
GSD: "Achieve this outcome" → Derive required tasks

**Implementation:**
1. Define success as user-observable truths
2. Derive required artifacts (files)
3. Derive critical connections (wiring)
4. Create tasks that produce artifacts and connections
5. Verify truths are achievable before execution
6. Verify truths are achieved after execution

**Benefits:**
- Plans verified before execution (gsd-plan-checker)
- Code verified after execution (gsd-verifier)
- Gaps caught early (before wasted execution effort)
- Clear acceptance criteria (no ambiguity about "done")

### 3. Vertical Slicing Over Horizontal Layers

**Traditional Approach (Horizontal):**
```
Plan 1: All database models
Plan 2: All API routes
Plan 3: All UI components
→ Nothing works until all plans complete
→ No parallelization possible
```

**GSD Approach (Vertical):**
```
Plan 1: User login (DB model + API + UI) [Wave 1]
Plan 2: User profile (DB model + API + UI) [Wave 1]
Plan 3: Settings (depends on profile) [Wave 2]
→ Each plan delivers working feature
→ Plans 1 and 2 execute in parallel
```

**Result:** Faster delivery, earlier integration testing, better parallelization.

### 4. Checkpoint Types and Usage

**90% are human-verify checkpoints:**
- Claude builds feature autonomously
- User verifies it works as expected
- Most efficient use of human time

**9% are decision checkpoints:**
- Claude presents options with pros/cons
- Human selects direction
- Avoids Claude making arbitrary architectural choices

**1% are human-action checkpoints:**
- Truly unavoidable manual steps (SMS codes, physical actions)
- Extremely rare by design (automation-first rule)

### 5. Deviation Handling Philosophy

**NOT a rigidity system:**
GSD doesn't enforce "do exactly what the plan says." Instead, it enforces "achieve what the plan promises."

**4 automatic deviation rules:**
1. Bug fixes: Always auto-correct (no checkpoint)
2. Critical additions: Always auto-include (validation, auth, error handling)
3. Blocking fixes: Always auto-resolve (missing deps, config errors)
4. Architecture decisions: Always checkpoint (major changes need human input)

**Documentation requirement:**
All deviations (auto or manual) documented in SUMMARY.md with rationale.

### 6. TDD Integration

**Selective Application:**
TDD applies when behavior is testable before implementation:
"Can you write `expect(fn(input)).toBe(output)` first?"

**TDD candidates:**
- Business logic
- API contracts
- Data transforms
- Validation
- Algorithms
- State machines

**Standard tasks:**
- UI layout
- Configuration
- Glue code
- Scripts
- Simple CRUD

**Context budget:**
TDD plans target ~40% (vs. 50% for standard) due to red-green-refactor cycles consuming more context.

### 7. Research Verification Culture

**Treat Claude's training as hypothesis, not fact:**
- Verify all claims through Context7, official docs, WebSearch
- Assign confidence levels (HIGH/MEDIUM/LOW) to all findings
- Report honestly about gaps and uncertainties
- Never pad findings to appear comprehensive

**Tool hierarchy:**
1. Context7 (authoritative, current library docs)
2. Official docs via WebFetch (verify changelog, features)
3. WebSearch (ecosystem patterns, community approaches)
4. Cross-reference and assign confidence

**Result:** Plans based on verified 2025 reality, not 2023 training data.

### 8. Atomic Commit Strategy Benefits

**Each task = one commit:**
```
abc123f docs(08-02): complete user registration plan
def456g feat(08-02): add email confirmation flow
hij789k feat(08-02): implement password hashing
```

**Benefits:**
- Git bisect locates exact failures
- Independent revertability
- Clear workflow history for future Claude sessions
- Audit trail for debugging
- Enables blame tracking for specific features

### 9. State Persistence Philosophy

**"Context windows are temporary, files are permanent":**
- STATE.md persists decisions, blockers, position
- SUMMARY.md persists what was built and why
- VERIFICATION.md persists what works and what doesn't
- Debug files persist investigation state
- Config persists preferences

**Result:** Future Claude sessions can resume work seamlessly without asking "what were we doing?"

### 10. Model Selection Economics

**Adaptive profile real-world example (24-hour period):**
- Haiku: 18 tasks (simple CRUD, following patterns)
- Sonnet: 12 tasks (security logic, moderate complexity)
- Opus: 3 tasks (new subsystem, architecture decisions)
- **Savings:** ~62% vs. quality profile, ~35% vs. balanced

**Insight:** Most tasks are simple or medium complexity. Reserving Opus for truly complex work delivers massive cost savings with minimal quality impact.

### 11. Verification at Multiple Levels

**Before execution:**
- gsd-plan-checker: Will plans achieve goal?
- Dependency validation: Are waves correct?
- Scope sanity: Within context budget?

**After execution:**
- gsd-verifier: Does code achieve goal?
- Three-level verification: Existence → Substantive → Wired
- Integration checker: Do phases connect?

**Result:** Catch failures early (cheap) rather than late (expensive).

### 12. Brownfield Support

**Codebase mapping before planning:**
- `/gsd:map-codebase` analyzes existing architecture
- Discovers conventions, patterns, concerns
- Documents STACK, ARCHITECTURE, CONVENTIONS, TESTING
- Subsequent planning automatically loads discovered patterns

**Result:** GSD-generated code conforms to existing codebase style automatically.

---

## Verification

✅ **File created using Write tool:** YES

✅ **File path:** C:/Users/Destiny/Projects/get-stuff-done/research/01-gsd-deep-dive.md

✅ **All agent definitions extracted:** 11/11 agents documented with complete frontmatter and descriptions

✅ **Task tool usage documented:** YES - GSD uses Task tool for spawning subagents, not for todo tracking

✅ **Orchestration patterns documented:** 6 major patterns identified with examples

✅ **State file formats documented:** 8 complete format specifications with examples

✅ **Model selection documented:** Adaptive selection logic, 4 profiles, configuration structure

✅ **Error handling documented:** 12 categories of error handling patterns

---

## Sources

- [GitHub - gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done)
- [get-shit-done README.md](https://github.com/gsd-build/get-shit-done/blob/main/README.md)
- [GSD-STYLE.md](../.upstream/GSD-STYLE.md)
- [gsd-executor.md](https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-executor.md)
- [gsd-planner.md](https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-planner.md)
- [gsd-phase-researcher.md](https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-phase-researcher.md)
- [gsd-project-researcher.md](https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-project-researcher.md)
- [gsd-verifier.md](https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-verifier.md)
- [gsd-plan-checker.md](https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-plan-checker.md)
- [gsd-debugger.md](https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-debugger.md)
- [gsd-roadmapper.md](https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-roadmapper.md)
- [gsd-codebase-mapper.md](https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-codebase-mapper.md)
- [gsd-integration-checker.md](https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-integration-checker.md)
- [gsd-research-synthesizer.md](https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-research-synthesizer.md)
- [gsd-statusline.js](https://raw.githubusercontent.com/gsd-build/get-shit-done/main/hooks/gsd-statusline.js)
- [new-project.md](https://raw.githubusercontent.com/gsd-build/get-shit-done/main/commands/gsd/new-project.md)
- [Adaptive Model Selection Issue #210](https://github.com/gsd-build/get-shit-done/issues/210)
- [Enhanced statusline Issue #212](https://github.com/gsd-build/get-shit-done/issues/212)
