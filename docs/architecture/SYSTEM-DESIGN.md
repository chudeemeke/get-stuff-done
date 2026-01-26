# Get Stuff Done: System Architecture

Technical architecture for implementing the hybrid GSD + Manus approach.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GET STUFF DONE SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         USER INTERFACE                                │   │
│  │  CLI Commands (/gsd:*) │ Interactive Prompts │ Status Display        │   │
│  └────────────────────────────────────┬─────────────────────────────────┘   │
│                                       │                                     │
│  ┌────────────────────────────────────v─────────────────────────────────┐   │
│  │                         ORCHESTRATOR                                  │   │
│  │  Phase Management │ State Machine │ Context Engineering               │   │
│  └────────────────────────────────────┬─────────────────────────────────┘   │
│                                       │                                     │
│  ┌──────────────┬─────────────────────┼───────────────────┬─────────────┐   │
│  │              │                     │                   │             │   │
│  v              v                     v                   v             v   │
│ ┌────────┐  ┌────────┐          ┌──────────┐       ┌──────────┐  ┌────────┐ │
│ │DISCUSS │  │ PLAN   │          │ EXECUTE  │       │ VERIFY   │  │ STATE  │ │
│ │ Engine │  │ Engine │          │ Engine   │       │ Engine   │  │Manager │ │
│ └────────┘  └────────┘          └──────────┘       └──────────┘  └────────┘ │
│                                       │                                     │
│  ┌────────────────────────────────────v─────────────────────────────────┐   │
│  │                      CONTEXT MANAGER                                  │   │
│  │  Stable Prefix │ Fresh Suffix │ Cache Optimization │ Memory Files    │   │
│  └────────────────────────────────────┬─────────────────────────────────┘   │
│                                       │                                     │
│  ┌────────────────────────────────────v─────────────────────────────────┐   │
│  │                      FILE SYSTEM LAYER                                │   │
│  │  Documents │ Plans │ State │ Archives │ Scratch                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. User Interface Layer

**CLI Commands:**
```bash
# Core commands
/gsd:init           # Initialize project
/gsd:discuss        # Start/resume Discuss phase
/gsd:plan           # Start/resume Plan phase
/gsd:execute        # Run execution
/gsd:verify         # Start UAT
/gsd:status         # Show current state

# Quick variants
/gsd:quick          # Skip research, minimal ceremony
/gsd:continue       # Resume from last state

# Utilities
/gsd:state          # Edit STATE.md
/gsd:todo           # Edit todo.md
/gsd:archive        # Archive completed phase
```

**Interactive Prompts:**
- Multi-choice for Discuss phase questions
- Confirmation for plan approval
- Pass/fail for verification items

### 2. Orchestrator

**Responsibilities:**
- Phase transitions
- State machine management
- Context loading/unloading
- Error escalation
- Agent coordination with fresh contexts

**State Machine:**
```
         ┌────────────────────────────────────────────────────┐
         │                                                    │
         v                                                    │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    DISCUSS      │ -> │     PLAN        │ -> │    EXECUTE      │
│                 │    │                 │    │                 │
│ Waiting: Input  │    │ Waiting: Approve│    │ Waiting: None   │
│ Output: CONTEXT │    │ Output: PLAN    │    │ Output: COMMIT  │
└─────────────────┘    └─────────────────┘    └────────┬────────┘
         ^                                             │
         │              ┌─────────────────┐            │
         │              │     VERIFY      │ <──────────┘
         │              │                 │
         │              │ Waiting: Accept │
         └──────────────│ Output: UAT     │
           (if failed)  └─────────────────┘
```

**Context Preservation Principle:**
- Orchestrators maintain 30-40% context utilization
- Heavy work delegated to subagents with fresh 200k-token contexts
- Prevents "context rot" where quality degrades as context fills
- Structured communication via XML/YAML for machine readability

### 3. Agent Architecture (11 GSD Agents)

#### Core Phase Agents

**3.1 gsd-executor**
- Executes plan files atomically with individual commits per task
- Handles deviations with 4 automatic rules:
  1. Auto-fix bugs (security, errors, incorrect behavior)
  2. Auto-add critical functionality (validation, auth, error handling)
  3. Auto-fix blocking issues (missing deps, config errors)
  4. Request architectural decisions (schema changes, major refactoring)
- Checkpoint-based pause/resume for human verification
- TDD support with red-green-refactor cycles
- Generates SUMMARY.md and updates STATE.md

**3.2 gsd-planner**
- Creates executable phase plans with task breakdown
- Plans ARE prompts, not documents that become prompts
- 2-3 tasks maximum per plan (aggressive atomicity)
- Targets ~50% context usage (RED zone: >70%)
- Goal-backward methodology:
  1. State goal (observable result)
  2. Derive truths (3-7 user-perspective behaviors)
  3. Derive artifacts (specific files required)
  4. Derive wiring (critical connections)
  5. Identify key links (fragile connection points)
- Wave-based dependency management for parallel execution
- Vertical slices (full feature ownership) preferred over horizontal layers

**3.3 gsd-phase-researcher**
- Researches implementation approaches before planning
- Produces RESEARCH.md consumed by gsd-planner
- Tool hierarchy: Context7 → Official docs (WebFetch) → WebSearch
- Discovery protocol with 4 levels (0-3) based on complexity
- Honest reporting of gaps and confidence levels
- Treats Claude's training as hypothesis, not fact

**3.4 gsd-project-researcher**
- Researches domain ecosystem before roadmap creation
- Produces files in `.planning/research/` (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md)
- Three modes: Ecosystem (default), Feasibility, Comparison
- Spawned in parallel (4 concurrent instances) during project initialization

#### Verification Agents

**3.5 gsd-verifier**
- Verifies phase goal achievement through goal-backward analysis
- Three-level artifact verification:
  - Level 1: Existence (does file exist?)
  - Level 2: Substantive (real implementation, not stubs?)
  - Level 3: Wired (imported and used throughout codebase?)
- Gap detection for TODOs, placeholders, empty returns, orphaned code
- Status: passed | gaps_found | human_needed
- Critical rule: "DO NOT trust SUMMARY.md claims" - verify actual codebase state

**3.6 gsd-plan-checker**
- Verifies plans before execution (not code after execution)
- Six verification dimensions:
  1. Requirement coverage
  2. Task completeness
  3. Dependency correctness
  4. Key links planned
  5. Scope sanity
  6. Verification derivation
- Iterative revision loop with gsd-planner until clean

**3.7 gsd-integration-checker**
- Verifies cross-phase integration and E2E flows
- Checks: Export/import verification, API route coverage, auth protection, E2E flow tracing
- Fundamental principle: "Existence ≠ Integration"

#### Specialized Agents

**3.8 gsd-debugger**
- Scientific method investigation with hypothesis testing
- Cognitive discipline to fight confirmation bias and anchoring
- Binary search, rubber duck debugging, minimal reproduction techniques
- Debug file protocol with immutable symptoms, append-only evidence
- Status: gathering → investigating → fixing → verifying → resolved

**3.9 gsd-roadmapper**
- Creates project roadmaps with phase breakdown
- Transforms requirements into observable success criteria
- Complete coverage validation (zero orphaned requirements)
- Bidirectional traceability between requirements and phases

**3.10 gsd-codebase-mapper**
- Explores existing codebases across 4 focus areas: tech, arch, quality, concerns
- Produces structured analysis documents in `.planning/codebase/`
- Every finding references actual file paths
- Enables brownfield project support

**3.11 gsd-research-synthesizer**
- Synthesizes outputs from 4 parallel researcher agents
- Creates executive summary with phase structure recommendations
- Confidence assessment matrix for research quality
- Commits all research files

### 4. Orchestration Patterns

**4.1 Sequential-with-Parallel Phases**
Example: `/gsd:new-project`
```
1. Setup (Sequential): Git init, brownfield detection
2. Questioning (Sequential): Interactive threading
3. Research (Parallel): 4 concurrent researcher agents
4. Requirements (Sequential): Category-based scoping
5. Roadmap (Sequential): Single roadmapper synthesis
```

**4.2 Wave-Based Parallel Execution**
Example: `/gsd:execute-phase`
- Wave 1: Tasks with no dependencies (parallel)
- Wave 2: Tasks depending only on Wave 1 (parallel after Wave 1)
- Wave N: Tasks depending on Wave N-1
- Each wave spawns parallel executors with fresh contexts

**4.3 Iterative Verification Loop**
```
1. gsd-planner creates PLAN.md files
2. gsd-plan-checker verifies plans
3. If issues found:
   - gsd-planner revises based on feedback
   - Loop back to step 2
4. When verification passes: Proceed to execution
```

**4.4 Goal-Backward Validation**
```
1. Load phase goals from ROADMAP.md
2. Extract must_haves (truths, artifacts, key links)
3. Verify existence → substantive → wiring
4. Detect gaps
5. Return status: passed | gaps_found | human_needed
```

**4.5 Checkpoint-Based Pause-Resume**
```
1. Parse plan with checkpoint tasks
2. Execute autonomous tasks sequentially
3. When checkpoint encountered: Stop, return structured message
4. User provides input (verification/decision/action)
5. Resume execution from next task
```

**4.6 Context-Preserving Orchestration**
- Orchestrators: Lightweight coordination (30-40% context)
- Subagents: Heavy research/planning/execution work
- Communication: Structured XML/YAML
- Persistence: Files written immediately, not held in memory

### 5. Execute Engine

**Purpose:** Run plans with fresh contexts using observation loop.

**Observation Loop:**
```
┌─────────────────────────────────────────┐
│           OBSERVATION LOOP              │
├─────────────────────────────────────────┤
│                                         │
│   1. EXECUTE single action              │
│          │                              │
│          v                              │
│   2. OBSERVE result                     │
│          │                              │
│          v                              │
│   3. SUCCESS? ────┬──── No ────┐        │
│          │        │            │        │
│         Yes       │            v        │
│          │        │     PRESERVE error  │
│          v        │     DIAGNOSE cause  │
│   4. UPDATE todo  │     RETRY or ALT    │
│          │        │            │        │
│          v        │            │        │
│   5. MORE ACTIONS?│<───────────┘        │
│          │                              │
│      ┌───┴───┐                          │
│     Yes     No                          │
│      │       │                          │
│      v       v                          │
│   REPEAT   COMMIT                       │
│                                         │
└─────────────────────────────────────────┘
```

**Atomic Commit Strategy:**
- Each task = one commit (enables git bisect)
- Format: `{type}({phase}-{plan}): {description}`
- Independent revertability at multiple granularities

### 6. Verify Engine

**Purpose:** User acceptance testing with gap-driven fix plans.

**Process:**
1. Extract testable deliverables
2. Present each to user
3. Collect pass/fail
4. Generate fix plans for failures (via `/gsd:plan-phase --gaps`)
5. Execute fix plans (via `/gsd:execute-phase --gaps-only`)
6. Re-verify with focused verification
7. Loop until acceptance

**Verification Item:**
```typescript
interface VerificationItem {
  id: string;
  description: string;
  testMethod: string;
  expected: string;
  status: 'pending' | 'passed' | 'failed';
  failureReason?: string;
  fixPlan?: Plan;
}
```

### 7. State Manager

**Purpose:** Persist state across sessions.

**Files Managed:**
- `STATE.md` - Decisions, blockers, errors, quick tasks
- `ROADMAP.md` - Phase position
- `todo.md` - Live checklist
- `.planning/` - All artifacts

**State Persistence Philosophy:**
"Context windows are temporary, files are permanent"
- STATE.md persists decisions, blockers, position
- SUMMARY.md persists what was built and why
- VERIFICATION.md persists what works and what doesn't
- Config persists preferences

### 8. Context Manager (Manus-Verified Principles)

**Purpose:** Optimize context for cache and quality using verified Manus patterns.

**Verified Principles Implemented:**

**✅ Principle 1: Design Around KV-Cache**
- Stable prompt prefixes (maximize cache hits)
- Append-only context (no retroactive edits)
- Deterministic JSON serialization
- Avoid timestamps in prompt prefix
- Cost savings: Cached tokens $0.30/MTok vs $3/MTok uncached (10x difference)
- Average input-to-output ratio: 100:1 in agent tasks

**✅ Principle 3: File System as Context**
- Treat external storage as unlimited, persistent memory
- Intermediate results saved to files rather than held in chat context
- Event stream externalization (user messages, actions, results)
- Older events summarized and pruned from active context
- Strategic retrieval via RAG when needed
- Industry standard practice (AutoGPT, BabyAGI also use this)

**✅ Principle 5: Keep the Wrong Stuff In**
- Preserve failed actions and error traces in context
- Allow models to learn from mistakes rather than erasing evidence
- Append-only architecture naturally supports this
- Trade-off: Context window fills faster, but debugging easier

**Context Structure:**
```typescript
interface Context {
  stablePrefix: {
    system: string;       // System instructions (cacheable)
    project: string;      // PROJECT.md (cacheable)
    preferences: string;  // From Discuss phase (cacheable)
    domain: string;       // Domain knowledge (cacheable)
  };
  freshSuffix: {
    plan: string;         // Current task plan
    files: string[];      // Relevant file contents
    errors: string[];     // Error history (preserved)
    progress: string;     // todo.md state
  };
}
```

**Cache Strategy:**
```
Prefix Hash = hash(system + project + preferences + domain)

If Prefix Hash unchanged:
  → Append-only to suffix (cache hit)

If Prefix Hash changed:
  → Full context reload (cache miss)
  → Log reason for invalidation
```

**Manus Principles NOT Implemented (Low Confidence):**
- ❌ Principle 2: Mask, Don't Remove (requires logits masking API)
- ❌ Principle 4: Attention Recitation (no evidence of value)
- ❌ Principle 6: Don't Get Few-Shotted (conflicts with cache stability)

---

## File System Layout

```
project/
├── .gsd/                           # GSD system files
│   ├── config.json                 # Project configuration
│   ├── context-cache/              # Cached context hashes
│   └── logs/                       # Execution logs
│
├── PROJECT.md                      # Project definition
├── REQUIREMENTS.md                 # Requirements
├── ROADMAP.md                      # Phase roadmap
├── STATE.md                        # State persistence
├── todo.md                         # Live checklist
│
├── .planning/                      # Planning artifacts
│   ├── phase-1/
│   │   ├── CONTEXT.md
│   │   ├── RESEARCH.md
│   │   ├── plans/
│   │   │   ├── 01-PLAN.md
│   │   │   └── 02-PLAN.md
│   │   ├── SUMMARY.md (per plan)
│   │   ├── VERIFICATION.md
│   │   └── UAT.md
│   ├── research/                   # Project-level research
│   │   ├── SUMMARY.md
│   │   ├── STACK.md
│   │   ├── FEATURES.md
│   │   ├── ARCHITECTURE.md
│   │   └── PITFALLS.md
│   ├── codebase/                   # Brownfield mapping
│   │   ├── STACK.md
│   │   ├── INTEGRATIONS.md
│   │   ├── ARCHITECTURE.md
│   │   ├── STRUCTURE.md
│   │   ├── CONVENTIONS.md
│   │   ├── TESTING.md
│   │   └── CONCERNS.md
│   └── debug/                      # Debug sessions
│       └── [session-id].md
│
├── scratch/                        # Working files
│   └── ...
│
└── archive/                        # Completed artifacts
    └── ...
```

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
- `type="auto"` — Claude executes autonomously (90%)
- `type="checkpoint:human-verify"` — User verification required (9%)
- `type="checkpoint:decision"` — User choice required
- `type="checkpoint:human-action"` — Manual user action required (1%, rare)

**Size Constraint:** 2-3 tasks maximum per plan.

**Why XML:** Semantic structure for Claude comprehension, machine-parseable, human-readable.

### 2. STATE.md Format

**Purpose:** Living memory across sessions with machine-readable tracking.

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
```

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

### 6. Configuration File Format

**Location:** `.planning/config.json`

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

## Model Selection

### 4 Model Profiles

**1. Quality Profile**
- All agents use Opus
- Highest quality output, highest cost

**2. Balanced Profile (Recommended)**
- All agents use Sonnet
- Good balance of quality and cost

**3. Budget Profile**
- Simple tasks: Haiku
- Complex tasks: Sonnet
- Lowest cost, acceptable quality

**4. Adaptive Profile**
- Automatic model selection based on task complexity
- Cost optimization or quality preference
- Intelligent fallback on rate limits

### Adaptive Model Selection Logic

**Task Complexity Thresholds:**

| Complexity | Model | Criteria |
|------------|-------|----------|
| **Simple** | Haiku | CRUD endpoints following patterns, <3 files, clear template |
| **Medium** | Sonnet | Security-critical logic, 4-6 files, some architectural decisions |
| **Complex** | Opus | New subsystem design, 8+ files, major architecture decisions |

**Example Cost Savings (24-hour period):**
- Haiku: 18 tasks
- Sonnet: 12 tasks
- Opus: 3 tasks
- **Estimated savings:** ~62% vs quality profile, ~35% vs balanced profile

**Per-Agent Model Override:**
```json
{
  "model_profile": "adaptive",
  "researcher_model": "sonnet",    // Override
  "planner_model": "sonnet",       // Override
  "executor_model": "adaptive",    // Use adaptive
  "verifier_model": "sonnet"       // Override
}
```

---

## Integration Points

### Claude Code Integration

**Implementation:** Custom commands in `.claude/commands/`

```bash
~/.claude/commands/
├── gsd/
│   ├── init.md
│   ├── discuss.md
│   ├── plan.md
│   ├── execute.md
│   ├── verify.md
│   └── status.md
```

**Agent Definitions:** Custom agents in `.claude/agents/`

```bash
~/.claude/agents/
├── gsd-executor.md
├── gsd-planner.md
├── gsd-phase-researcher.md
├── gsd-project-researcher.md
├── gsd-verifier.md
├── gsd-plan-checker.md
├── gsd-debugger.md
├── gsd-roadmapper.md
├── gsd-codebase-mapper.md
├── gsd-integration-checker.md
└── gsd-research-synthesizer.md
```

### WoW System Integration (Optional)

**Hooks:**
- `PreToolUse` - Check if operation allowed in current zone
- `PostToolUse` - Log operation to WoW audit

**Bypass Coordination:**
```bash
# Before autonomous execution phase
wow bypass  # Activate bypass if needed

# After execution complete
wow protect  # Re-enable protection
```

---

## Error Handling Strategy

### Error Categories

| Category | Example | Response |
|----------|---------|----------|
| **Recoverable** | File not found | Create file, retry |
| **Retryable** | Network timeout | Wait, retry |
| **Requires Decision** | Ambiguous requirement | Escalate to user |
| **Fatal** | Invalid project state | Halt, require manual fix |

### Deviation Handling (4 Automatic Rules)

**gsd-executor automatic rules:**
1. **Auto-fix bugs** - Security, errors, incorrect behavior
2. **Auto-add critical functionality** - Validation, auth, error handling
3. **Auto-fix blocking issues** - Missing deps, config errors
4. **Request architectural decisions** - Schema changes, major refactoring

All deviations documented in SUMMARY.md with rationale.

### Verification Failure Handling

```
1. gsd-verifier creates VERIFICATION.md with gap analysis
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

### Plan Verification Failure Handling

```
1. gsd-plan-checker returns ISSUES FOUND with categories:
   - Blockers (must fix)
   - Warnings (should fix)
   - Info (nice to fix)

2. Orchestrator invokes gsd-planner in revision mode
3. Planner updates plans to address issues
4. Re-run gsd-plan-checker on updated plans
5. Loop until verification passes
6. Proceed to execution only when clean
```

---

## Metrics & Observability

### Key Metrics

| Metric | Purpose |
|--------|---------|
| Cache Hit Rate | Context optimization effectiveness |
| Tasks per Phase | Planning granularity |
| Error Rate | System reliability |
| Time to Completion | Efficiency |
| Retry Count | Error handling quality |
| Model Distribution | Cost tracking (Haiku/Sonnet/Opus usage) |

### Logging

```json
{
  "timestamp": "2026-01-23T12:00:00Z",
  "phase": "execute",
  "plan": "phase-1-01",
  "task": "implement-auth",
  "action": "file_write",
  "result": "success",
  "duration_ms": 150,
  "cache_hit": true,
  "context_size": 45000,
  "model_used": "haiku"
}
```

---

## Security Considerations

### File Access
- Stay within project directory
- Respect .gitignore
- No secrets in plans/state

### Execution Sandboxing
- Tasks execute in project context
- No system-wide operations
- WoW integration for dangerous ops

### Data Persistence
- No credentials in state files
- Plans may reference but not contain secrets
- Archive cleanup policy

---

## Future Enhancements

### Phase 2: Multi-Agent
- Parallel task execution
- Agent coordination protocol
- Shared state management

### Phase 3: Learning
- Pattern recognition across projects
- Common error → solution mapping
- Preference learning

### Phase 4: Integration
- IDE plugins
- CI/CD hooks
- Team collaboration

---

## Option C: Standalone CLI Architecture

### Dual Implementation Strategy

```
~/.gsd/                               # GSD_HOME
├── methodology/                       # Implementation-agnostic (SHARED)
│   ├── phases/
│   │   ├── discuss.md                # WHAT, not HOW
│   │   ├── plan.md
│   │   ├── execute.md
│   │   └── verify.md
│   ├── templates/
│   │   ├── CONTEXT.template.md      # With YAML frontmatter
│   │   ├── PLAN.template.md
│   │   └── STATE.template.md
│   └── schemas/                      # Machine-parseable contracts
│       ├── state.schema.json
│       ├── plan.schema.json
│       └── phase-interface.schema.json
│
├── implementations/
│   ├── claude-code/                  # Option A (build first)
│   │   ├── commands/
│   │   │   ├── init.md
│   │   │   ├── discuss.md
│   │   │   └── ...
│   │   └── agents/
│   │       ├── gsd-executor.md
│   │       ├── gsd-planner.md
│   │       └── ...
│   │
│   └── cli/                          # Option C (add later)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── orchestrator.ts       # State machine, API calls
│           ├── phases/
│           │   ├── discuss.ts
│           │   ├── plan.ts
│           │   ├── execute.ts
│           │   └── verify.ts
│           ├── context/
│           │   ├── manager.ts        # Context engineering
│           │   └── cache.ts          # KV-cache optimization
│           └── api/
│               └── claude.ts         # Anthropic API wrapper
│
└── config.json                       # Shared config
```

### Phase Interface Contract (Implementation-Agnostic)

```json
// schemas/phase-interface.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Phase Interface",
  "type": "object",
  "properties": {
    "phase": { "type": "string", "enum": ["discuss", "plan", "execute", "verify"] },
    "inputs": {
      "type": "object",
      "properties": {
        "required": { "type": "array", "items": { "type": "string" } },
        "optional": { "type": "array", "items": { "type": "string" } }
      }
    },
    "outputs": {
      "type": "object",
      "properties": {
        "files": { "type": "array", "items": { "type": "string" } },
        "state_updates": { "type": "object" }
      }
    },
    "transitions": {
      "type": "object",
      "properties": {
        "from": { "type": "string" },
        "to": { "type": "string" },
        "condition": { "type": "string" }
      }
    }
  }
}
```

### API Strategy

| Approach | Pros | Cons |
|----------|------|------|
| **ANTHROPIC_API_KEY** | Standard, clear billing | Separate cost |
| **OAuth (Max)** | Use existing subscription | May violate ToS |

**Recommendation:** Support API key officially, leave OAuth as undocumented option.

### What Option A Provides for Option C

If Option A is built correctly:

1. **Validated methodology** - Real-world testing through Claude Code use
2. **Structured state** - YAML frontmatter makes parsing trivial
3. **JSON schemas** - Validation logic already defined
4. **Phase interfaces** - Implementation contract documented
5. **Templates** - Reusable across both implementations

**Pivot cost:** ~2 weeks for competent TypeScript developer vs 2+ months if starting fresh.

---

## Implementation Roadmap

### Current: Option A (Claude Code)

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| 0.1 | Foundation | Directory structure, state files with YAML frontmatter |
| 0.2 | Discuss Engine | Interactive questioning, CONTEXT.md, JSON schemas |
| 0.3 | Plan Engine | Backward reasoning, plan templates, phase interfaces |
| 0.4 | Execute Engine | Observation loop, atomic commits, Task tool integration |
| 0.5 | Verify Engine | UAT flow, fix plan generation |
| 1.0 | Integration | CLI commands, full workflow, validation |

### Future: Option C (Standalone CLI)

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| 1.1 | API Integration | Anthropic SDK, message streaming |
| 1.2 | Orchestrator | State machine, phase routing |
| 1.3 | Context Manager | KV-cache optimization, context building |
| 1.4 | Phase Implementation | TypeScript versions of all phases |
| 1.5 | Tool Abstractions | Local implementations of Read/Write/Bash |
| 2.0 | Dual Mode | Both implementations work side-by-side |

---

## Key Architectural Insights

### 1. Goal-Backward Methodology
- Traditional: "Do these tasks" → Hope outcome achieved
- GSD: "Achieve this outcome" → Derive required tasks
- Benefits: Plans verified before execution, gaps caught early, clear acceptance criteria

### 2. Vertical Slicing Over Horizontal Layers
- Traditional: Plan 1 = All DB models, Plan 2 = All APIs, Plan 3 = All UI (nothing works until complete)
- GSD: Plan 1 = User login (DB+API+UI), Plan 2 = User profile (DB+API+UI) (each plan delivers working feature)
- Result: Faster delivery, earlier integration testing, better parallelization

### 3. Plans ARE Prompts
- Not documents that become prompts
- Each PLAN.md contains objective, context, tasks with verification—directly executable by Claude
- YAML frontmatter for machine reading, XML body for semantic structure

### 4. Checkpoint Philosophy
- 90% are human-verify (Claude builds, user verifies)
- 9% are decision (Claude presents options, human selects)
- 1% are human-action (truly unavoidable manual steps)
- Most efficient use of human time

### 5. Atomic Commits Strategy
- Each task = one commit
- Format: `{type}({phase}-{plan}): {description}`
- Benefits: Git bisect locates failures, independent revertability, clear history

### 6. Verification at Multiple Levels
- Before execution: gsd-plan-checker (will plans achieve goal?)
- After execution: gsd-verifier (does code achieve goal?)
- Integration: gsd-integration-checker (do phases connect?)
- Result: Catch failures early (cheap) rather than late (expensive)

---

## References

- Claude Code Integration: `./CLAUDE-CODE-INTEGRATION.md`
- Hybrid Approach: `../HYBRID-APPROACH.md`
- Manus Context Engineering: `../MANUS-METHODOLOGY.md`
- GSD Methodology: `../GSD-METHODOLOGY.md`
- Research: `../../research/01-gsd-deep-dive.md`, `../../research/02-manus-verification.md`
