# Get Stuff Done (GSD) Methodology

Comprehensive documentation of TACHES/GlitterCowboy's "Get Stuff Done" framework.

**Source:** https://github.com/glittercowboy/get-shit-done
**Version:** 1.9.11 (latest release as of January 23, 2026)
**Installation:** `npx @chude/get-stuff-done --global` or `npx @chude/get-stuff-done --local`

---

## Core Philosophy

GSD is a spec-driven development system designed to combat "context rot" - quality degradation as Claude fills its context window.

> "The complexity is in the system, not in your workflow."

> "No enterprise roleplay. No sprint ceremonies, story points, stakeholder syncs, or Jira workflows. Just an incredibly effective system for building cool stuff consistently."

**Target User:** Solo developers who want Claude Code to build features reliably based on descriptions.

**Primary Benefit:** Consistent, high-quality AI code generation through meticulous context management.

---

## The Four-Phase Cycle

### Phase 1: Discuss

**Purpose:** Capture implementation preferences BEFORE planning begins.

- Identify gray areas specific to the feature type (visual, API, content, organizational)
- Shape implementation details upfront
- Ensure Claude builds YOUR vision, not "reasonable defaults"

**Output:** `{phase}-CONTEXT.md`

### Phase 2: Plan

**Purpose:** Research and create atomic task plans.

- Conduct domain research guided by decisions from Discuss phase
- Create 2-3 atomic task plans with XML structure
- Verify plans against requirements through iteration

**Output:** `{phase}-RESEARCH.md`, `{phase}-{N}-PLAN.md`

### Phase 3: Execute

**Purpose:** Run plans with fresh contexts.

- Run plans in parallel waves where possible
- Allocate fresh 200k context per plan (prevents degradation)
- Commit each task atomically with clean git history

**Output:** `{phase}-{N}-SUMMARY.md`, `{phase}-VERIFICATION.md`

### Phase 4: Verify

**Purpose:** User acceptance testing.

- Extract testable deliverables
- Walk through each one
- Automatically diagnose failures with targeted fix plans

**Output:** `{phase}-UAT.md`, fix plans if needed

---

## How Requirements Are Derived

The system works **forward from understanding** (not backward from goals):

1. **Questions establish intent** - What are you building, why, for whom
2. **Research informs constraints** - What patterns exist, what pitfalls are known
3. **Requirements scope reality** - What's realistic for v1, what's deferred
4. **Phase planning operationalizes** - How requirements become concrete tasks

---

## Key Principles

### Context Engineering

- Files sized to stay under quality degradation thresholds
- Documents loaded strategically (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
- Main session stays at 30-40% context utilization

### Atomic Execution

- Each task gets independent commit
- Fresh context per plan eliminates accumulated noise
- Verification steps built into task structure

### State Preservation

- `STATE.md` tracks decisions and blockers across sessions
- `ROADMAP.md` maintains position in milestone cycle
- `.planning/` directory archives all decisions

---

## Document Outputs

| Document | Purpose |
|----------|---------|
| `PROJECT.md` | Project definition, goals, constraints |
| `REQUIREMENTS.md` | v1, v2, out-of-scope items |
| `ROADMAP.md` | Phases mapped to requirements |
| `STATE.md` | Decisions and blockers across sessions |
| `{phase}-CONTEXT.md` | Implementation decisions for phase |
| `{phase}-RESEARCH.md` | Domain research findings |
| `{phase}-{N}-PLAN.md` | Atomic task plan |
| `{phase}-VERIFICATION.md` | Execution verification |
| `{phase}-UAT.md` | User acceptance test results |

---

## Quick Mode

For ad-hoc tasks: `/gsd:quick` skips research and verification while maintaining atomic commits and state tracking.

---

## Related: Inversion Thinking

TACHES also provides `/consider:inversion` - "Solve backwards (what guarantees failure?)"

This is pre-mortem style thinking: identify failure conditions, then invert them to find success factors.

---

## Command Reference

### Core Commands

| Command | Purpose |
|---------|---------|
| `/gsd:new-project` | Initialize a new GSD project |
| `/gsd:create-roadmap` | Create roadmap and phases |
| `/gsd:plan-phase <N>` | Create detailed plan for phase N |
| `/gsd:quick` | Skip research/verification, maintain atomic commits |

### Supporting Commands

| Command | Purpose |
|---------|---------|
| `/consider:inversion` | Pre-mortem thinking: "What guarantees failure?" |

---

## Notable Recognition

The project has been starred by notable figures including:
- Jonathan Ragan-Kelley (Professor at MIT)
- Wes McKinney (Author of Pandas)
- Elvis Saravia (Founder of DAIR.AI)
- Didier Lopes (Founder of OpenBB)
- Li Jiang (Coauthor of AutoGen; Engineer at Microsoft)

---

## Technical Implementation Details

### Context Engineering Strategy

**Problem:** Context windows fill up, quality degrades.

**Solution:**
- Files sized to stay under quality degradation thresholds
- Documents loaded strategically (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
- Main session stays at 30-40% context utilization
- Fresh 200k context allocated per plan execution

### Atomic Execution Model

Each atomic task:
1. Gets independent context (no accumulated noise)
2. Produces independent commit (clean git history)
3. Includes built-in verification steps
4. Can run in parallel waves where possible

### State Preservation Across Sessions

| File | Purpose |
|------|---------|
| `STATE.md` | Decisions and blockers |
| `ROADMAP.md` | Position in milestone cycle |
| `.planning/` | Archive of all decisions |

---

## Comparison with Other Tools

GSD differs from tools like BMAD and Speckit:

> "Other spec-driven development tools exist; BMAD, Speckit... But they all seem to make things way more complicated than they need to be (sprint ceremonies, story points, stakeholder syncs, retrospectives, Jira workflows)."

GSD strips away enterprise ceremony while keeping engineering rigor.

---

## Integration Points

- **Claude Code:** Native integration via npx installation
- **Git:** Atomic commits per task
- **File System:** Document-based state persistence

---

## Version Info

- GSD Version: 1.9.11 (as of Jan 23, 2026)
- Latest features: Uncommitted planning mode, Quick Mode, Adaptive model selection
- Active development: Project is evolving quickly
- Official website: gsd.site

---

## Custom Agent Definitions

GSD uses specialized agents for different phases of the development workflow. Each agent has specific tools, responsibilities, and frontmatter configuration.

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

## Task Tool vs TaskCreate Clarification

**Does GSD use TaskCreate/TaskUpdate/TaskList?**

**Answer:** GSD uses the **Task tool for spawning subagents**, NOT for traditional todo-list tracking.

### How GSD Uses the Task Tool

**Primary Usage:** Spawning subagents with fresh context windows
- Each Task invocation creates a new subagent with isolated 200k-token context
- Prevents "context rot" where quality degrades as main context fills
- Enables parallel execution of independent work streams

**Task State Files:** Auto-generated by Claude Code's Task tool
- Location: `~/.claude/todos/[session-id]-agent-*.json`
- Structure: `{ "status": "in_progress", "activeForm": "...", "subject": "...", ... }`
- Created automatically by Task tool, not manually via TaskCreate/TaskUpdate API

### Evidence from /gsd:new-project

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

### Statusline Integration

The gsd-statusline.js hook reads task state files directly from the filesystem to display current agent activity:

```javascript
// Location: ~/.claude/todos/[session-id]-agent-*.json
// Expected JSON structure with:
// - status field (e.g., "in_progress")
// - activeForm field (displays current task description)
```

**Key Insight:** GSD leverages the Task tool's subagent spawning capability for architectural benefits (fresh contexts, parallelization), not for todo management.

---

## Orchestration Patterns in Practice

GSD implements several sophisticated orchestration patterns for managing complex workflows while preserving context.

### 1. Sequential-with-Parallel Phases Pattern

**Example: /gsd:new-project**

```
1. Setup (Sequential): Git initialization, brownfield detection
2. Questioning (Sequential): Interactive threading until clarity achieved
3. Research (Parallel): 4 independent researcher agents spawn simultaneously
4. Requirements (Sequential): Scoping through category-based decisions
5. Roadmap (Sequential): Single roadmapper synthesizes all context
```

**Why this pattern:**
- Research tasks are independent → safe to parallelize
- Setup and questioning require sequential user interaction
- Roadmapping requires synthesis → must be sequential after research

### 2. Wave-Based Parallel Execution

**Example: /gsd:execute-phase**

Plans are organized into dependency-aware waves:
- **Wave 1:** Tasks with no dependencies (execute in parallel)
- **Wave 2:** Tasks depending only on Wave 1 (execute in parallel after Wave 1 completes)
- **Wave N:** Tasks depending on Wave N-1

Each wave spawns parallel executors with fresh 200k-token contexts.

**Benefits:**
- Maximum parallelization without race conditions
- Fresh context per executor prevents degradation
- Clear dependency tracking

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

**Why this pattern:**
- Catches plan issues BEFORE execution (cheaper than post-execution fixes)
- Provides specific feedback for targeted revisions
- Ensures plans will achieve goals before investing execution time

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

**Why this pattern:**
- Validates OUTCOMES, not just task completion
- Three-level verification catches different failure modes
- Gap detection identifies incomplete work automatically

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

**Checkpoint Types:**
- **checkpoint:human-verify (90%):** User confirms work functions
- **checkpoint:decision (9%):** User selects implementation path
- **checkpoint:human-action (1%):** Manual user action required

**Why this pattern:**
- Efficient use of human time (verify results, not supervise work)
- Enables autonomous execution with strategic human input
- Prevents Claude from making arbitrary architectural choices

### 6. Context-Preserving Orchestration

**Key Insight:** Orchestrators maintain 30-40% context utilization while delegating heavy work to subagent contexts, preventing context window degradation.

**Pattern:**
- **Orchestrator:** Lightweight coordination logic only
- **Subagents:** Heavy research, planning, execution work
- **Communication:** Structured XML/YAML for machine readability
- **Persistence:** Files written immediately, not held in memory

**Example from /gsd:plan-phase:**
```
Orchestrator (30-40% context):
1. Load phase requirements
2. Spawn gsd-phase-researcher (fresh context)
3. Wait for RESEARCH.md output
4. Spawn gsd-planner (fresh context)
5. Wait for PLAN.md outputs
6. Spawn gsd-plan-checker (fresh context)
7. If issues: loop planner with feedback
8. Return success status

Each subagent operates in clean 200k context
```

**Why this pattern:**
- Prevents "context rot" where quality degrades as context fills
- Enables complex workflows without degradation
- Main orchestrator stays responsive and coherent

---
