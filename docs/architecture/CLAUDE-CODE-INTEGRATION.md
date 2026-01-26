# Claude Code Integration

How Get Stuff Done leverages Claude Code 2.1.16+ features for implementation.

**Last Updated:** 2026-01-25
**Claude Code Version:** 2.1.17+
**Verified Against:** Claude Code CHANGELOG (v2.1.16+), live testing, GSD v1.9.11

---

## Overview

Get Stuff Done (Option A) is implemented as Claude Code commands that leverage native features for:
- Task management and tracking via TaskCreate/TaskUpdate/TaskList/TaskGet
- Fresh context execution via Task tool with custom agents
- Dependency management with automatic unblocking
- Progress visualization with activeForm spinner text
- State persistence across sessions

This document maps GSD methodology to Claude Code 2.1.16+ capabilities, verified through research and live testing.

---

## Critical Tool Distinction

**Understanding the difference between Task tool and TaskCreate/Update/List/Get:**

| Tool | Purpose | Context | When GSD Uses It |
|------|---------|---------|------------------|
| **Task** | Spawns subagent in fresh 200k context | Fresh isolated context | Execute atomic work (11 custom agents) |
| **TaskCreate** | Creates task record for tracking | Main session context | Track phases, plans, orchestration |
| **TaskUpdate** | Updates task status/dependencies | Main session context | Mark progress, manage blockedBy |
| **TaskList** | Lists all tracked tasks | Main session context | Progress reporting, wave status |
| **TaskGet** | Gets detailed task info | Main session context | Inspection, verification |

**GSD's Pattern:**
- TaskCreate tracks high-level progress (phases, plans)
- Task tool executes actual work (spawns custom agents)
- TaskUpdate reflects completion as agents finish
- TaskList generates user-facing progress reports

---

## Feature Mapping

| GSD Concept | Claude Code Feature | Implementation |
|-------------|---------------------|----------------|
| **Fresh context per task** | Task tool (subagents) | Each atomic task runs in isolated 200k context |
| **Progress tracking** | TaskCreate, TaskUpdate, TaskList, TaskGet | Phase/plan/task hierarchy with dependency tracking |
| **Dependency management** | TaskUpdate `addBlockedBy`/`addBlocks` | Wave-based execution with auto-unblocking |
| **State persistence** | File system (Read/Write) | STATE.md, ROADMAP.md, .planning/ (session-scoped tasks) |
| **User interaction** | AskUserQuestion | Discuss phase, verification, checkpoints |
| **Atomic commits** | Bash tool (git) | One commit per completed task |
| **Parallel execution** | Multiple Task invocations | Wave-based parallel task execution |
| **Custom agents** | Task tool `agent` parameter | 11 specialized agents (executor, planner, researcher, etc.) |
| **Spinner text** | TaskCreate/TaskUpdate `activeForm` | User-friendly status during in_progress |
| **Metadata tracking** | TaskCreate/TaskUpdate `metadata` | Arbitrary data for reporting/debugging |

---

## Claude Code 2.1.16+ Features (Verified)

### New Task Management System

Introduced in v2.1.16 (January 16, 2026):

**Capabilities:**
- Dependency tracking with `blockedBy` relationships
- Automatic unblocking when dependencies complete
- Session-scoped task persistence (within session only)
- Metadata storage for custom tracking
- Spinner text via `activeForm` field

**API Surface:**

```typescript
// TaskCreate - Create new tracking task
TaskCreate({
  subject: string,           // Required: Task title
  description: string,       // Required: Detailed description
  activeForm?: string,       // Optional: Spinner text when in_progress
  metadata?: object          // Optional: Arbitrary tracking data
}) → taskId

// TaskUpdate - Modify existing task
TaskUpdate({
  taskId: string,            // Required: Task ID to update
  status?: "pending" | "in_progress" | "completed",
  addBlockedBy?: string[],   // Optional: Dependencies
  addBlocks?: string[],      // Optional: Tasks this blocks
  metadata?: object          // Optional: Merge metadata
}) → confirmation

// TaskList - List all tasks
TaskList() → Task[]

// TaskGet - Detailed task inspection
TaskGet({ taskId: string }) → Task

// Task - Spawn subagent (different tool!)
Task({
  agent?: string,            // Optional: Custom agent name
  subagent_type?: string,    // Optional: "general-purpose" default
  description: string,       // Required: Task description
  prompt: string,            // Required: Full prompt for subagent
  model?: string             // Optional: haiku/sonnet/opus
}) → subagent result
```

**Verified Behaviors:**
- ✅ Tasks persist across turns within same session
- ✅ Dependencies auto-unblock when blocking task completes
- ✅ TaskGet shows full dependency graph
- ✅ Task IDs are sequential integers (#1, #2, #3, ...)
- ❌ Tasks do NOT persist across session restarts (need STATE.md sync)

---

## Custom Agent Architecture (GSD's 11 Agents)

GSD defines 11 specialized agents in `~/.gsd/agents/` directory:

### Agent File Format

```markdown
---
name: agent-name
description: Agent purpose
tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch
color: yellow
---

[Agent instructions in markdown]

When invoked, you should:
1. Load context from specified files
2. Perform specialized task
3. Write output files directly
4. Return structured results
```

### GSD's 11 Custom Agents

| Agent | Purpose | Primary Tools | Spawned By |
|-------|---------|---------------|------------|
| **gsd-executor** | Executes plans atomically with deviation handling | Read, Write, Edit, Bash, Grep, Glob | `/gsd:execute-phase` |
| **gsd-planner** | Creates executable phase plans with task breakdown | Read, Write, Bash, Glob, Grep, WebFetch | `/gsd:plan-phase` |
| **gsd-phase-researcher** | Researches how to implement a phase | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch | `/gsd:plan-phase` (research mode) |
| **gsd-project-researcher** | Researches domain ecosystem | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch | `/gsd:new-project` (4 parallel) |
| **gsd-verifier** | Verifies phase goal achievement | Read, Bash, Grep, Glob | `/gsd:verify-phase` |
| **gsd-plan-checker** | Verifies plans before execution | Read, Bash, Glob, Grep | `/gsd:plan-phase` (validation) |
| **gsd-debugger** | Investigates bugs using scientific method | Read, Write, Edit, Bash, Grep, Glob, WebSearch | `/gsd:debug` |
| **gsd-roadmapper** | Creates project roadmaps with phases | Read, Write, Bash, Glob, Grep | `/gsd:new-project` (roadmap) |
| **gsd-codebase-mapper** | Analyzes existing codebase | Read, Bash, Grep, Glob, Write | `/gsd:map-codebase` |
| **gsd-integration-checker** | Verifies cross-phase integration | Read, Bash, Grep, Glob | `/gsd:verify-integration` |
| **gsd-research-synthesizer** | Synthesizes parallel research outputs | Read, Write, Bash | `/gsd:new-project` (synthesis) |

### Agent Invocation Pattern

```typescript
// Example: Spawning gsd-executor for a plan
const result = await Task({
  agent: "gsd-executor",
  description: "Execute Plan 02-01: User Authentication",
  prompt: `
    <context>
      Phase: 02-user-management
      Plan: 02-01-PLAN.md
      State: .planning/STATE.md
      Config: .planning/config.json
    </context>

    <objective>
      Execute all tasks in Plan 02-01 with atomic commits.
      Handle deviations according to 4 automatic rules.
      Pause at checkpoints for human input.
    </objective>

    <instructions>
      1. Load STATE.md and config.json
      2. Parse plan frontmatter and tasks
      3. Execute tasks sequentially
      4. Create atomic commit per task
      5. Generate SUMMARY.md
      6. Update STATE.md
    </instructions>
  `
});
```

**Why Custom Agents?**
- Specialized instructions per agent type (executor vs. planner vs. researcher)
- Fresh 200k context per invocation (zero noise)
- Consistent behavior across invocations
- Reusable across projects
- Tool access control (executors don't need WebSearch, researchers do)

---

## Task Management Integration

### Three-Level Task Hierarchy

```
Phase (TaskCreate)
  │
  ├─ Plan 1 (TaskCreate)
  │    ├─ Atomic Task 1 (Task tool → gsd-executor)
  │    ├─ Atomic Task 2 (Task tool → gsd-executor)
  │    └─ Atomic Task 3 (Task tool → gsd-executor)
  │
  └─ Plan 2 (TaskCreate)
       ├─ Atomic Task 4 (Task tool → gsd-executor)
       └─ Atomic Task 5 (Task tool → gsd-executor)
```

### Level 1: Phases (Orchestrator Tasks)

```typescript
// Example: Track phase progress
const phaseTask = TaskCreate({
  subject: "Execute Phase 1: Foundation",
  description: "Run all plans for Phase 1 with dependency-aware wave execution",
  activeForm: "Executing Phase 1 plans",
  metadata: {
    phase_id: "01-foundation",
    total_plans: 3,
    wave: null  // Will be updated as waves complete
  }
});
```

**Purpose:** High-level progress tracking across phases.

**Status Updates:**
- `pending` → `in_progress` (when phase starts)
- Metadata updates as waves complete
- `in_progress` → `completed` (when all plans done)

### Level 2: Plans (Orchestrator Tasks with Dependencies)

```typescript
// Example: Track plan with wave dependencies
const plan1 = TaskCreate({
  subject: "Plan 1-01: Bootstrap Framework",
  description: "Implement bootstrap.sh with command protocol",
  activeForm: "Implementing bootstrap framework",
  metadata: {
    phase: "01-foundation",
    plan_id: "01-01",
    wave: 1,
    files_modified: ["bin/bootstrap.sh", "src/core/command-protocol.sh"]
  }
});

const plan2 = TaskCreate({
  subject: "Plan 1-02: Discovery System",
  description: "Implement command discovery and routing",
  activeForm: "Implementing discovery system",
  metadata: {
    phase: "01-foundation",
    plan_id: "01-02",
    wave: 2
  }
});

// Plan 1-02 depends on Plan 1-01
TaskUpdate({
  taskId: plan2,
  addBlockedBy: [plan1]
});
```

**Purpose:** Track plan-level progress with dependency management.

**Dependency Behavior:**
- Task #plan2 remains `pending` and shows `[blocked by #plan1]` in TaskList
- When TaskUpdate({ taskId: plan1, status: "completed" }) is called:
  - Task #plan2 automatically unblocks
  - TaskList shows #plan2 as `pending` (no longer blocked)
  - Orchestrator can now spawn executor for plan2

### Level 3: Atomic Tasks (Task Tool Subagents)

```typescript
// Example: Execute atomic task via custom agent
const result = await Task({
  agent: "gsd-executor",
  description: "Implement command_meta function",
  prompt: `
    <context>
      Plan: .planning/phases/01-foundation/01-01-PLAN.md
      Task: Task 1 from plan XML
      State: .planning/STATE.md
    </context>

    <task>
      <name>Task 1: Implement command_meta parser</name>
      <files>bin/bootstrap.sh</files>
      <action>
        Create command_meta() function that:
        - Reads metadata from heredoc
        - Parses key:value format
        - Returns structured data
      </action>
      <verify>
        command_meta <<EOF
        name: test
        version: 1.0.0
        EOF
        # Should output structured metadata
      </verify>
      <done>
        - Function exists in bootstrap.sh
        - Returns correct format
        - Handles edge cases (empty values, multiline)
      </done>
    </task>

    <commit_message>
      feat(01-01): implement command_meta parser

      - Parse metadata from heredoc format
      - Support key:value syntax
      - Handle multiline values
    </commit_message>
  `
});

// Update plan tracking task after executor completes
TaskUpdate({
  taskId: plan1,
  metadata: {
    tasks_completed: 1,
    tasks_total: 3,
    last_commit: result.commit_sha
  }
});
```

**Purpose:** Execute single atomic task in fresh 200k context.

**Why subagent (Task tool)?**
- Zero accumulated context noise from previous tasks
- Clean 200k tokens for implementation
- Built-in isolation from main session
- Custom agent specialization (gsd-executor knows deviation rules)

---

## Execution Flow

### Phase Execution Pattern

```
Main Session (Orchestrator - TaskCreate/Update/List/Get)
     │
     ├─ TaskCreate: Phase 1 (#1)
     │      │
     │      ├─ TaskCreate: Plan 1-01 (#2) [wave: 1]
     │      ├─ TaskCreate: Plan 1-02 (#3) [wave: 1]
     │      ├─ TaskCreate: Plan 1-03 (#4) [wave: 2, blockedBy: [#2]]
     │      │
     │      │ Check dependencies:
     │      │ - Plan #2 and #3 have no blockedBy → Wave 1
     │      │ - Plan #4 blockedBy #2 → Wave 2 (waits)
     │      │
     │      │ Execute Wave 1 (parallel):
     │      ├─ Task({ agent: "gsd-executor", ... }) ─────┐
     │      │      └─ Fresh 200k context (Plan 1-01)     │ Parallel
     │      ├─ Task({ agent: "gsd-executor", ... }) ─────┤
     │      │      └─ Fresh 200k context (Plan 1-02)     │
     │      │                                             │
     │      │ Wait for Wave 1 completion...               │
     │      │                                             │
     │      ├─ TaskUpdate: Plan 1-01 (#2) → completed    │
     │      ├─ TaskUpdate: Plan 1-02 (#3) → completed ───┘
     │      │
     │      │ Plan #4 auto-unblocks (dependency #2 completed)
     │      │
     │      │ Execute Wave 2:
     │      ├─ Task({ agent: "gsd-executor", ... })
     │      │      └─ Fresh 200k context (Plan 1-03)
     │      │
     │      └─ TaskUpdate: Plan 1-03 (#4) → completed
     │      │
     │      └─ TaskUpdate: Phase 1 (#1) → completed
     │
     └─ Generate progress report via TaskList
```

### Context Distribution Strategy

| Session Type | Context Allocation | Purpose |
|--------------|-------------------|---------|
| **Main session** | 30-40% utilization | Orchestration, dependency tracking, reporting |
| **Task subagent** | 200k fresh context | Plan execution, research, verification, debugging |

**Why this matters:**
- Main session never accumulates implementation noise
- Each task gets clean context for quality
- No context rot across tasks
- Orchestrator can handle dozens of plans without degradation

---

## Dependency Management (Wave-Based Execution)

### TaskUpdate Dependency API

```typescript
// Create tasks
const taskA = TaskCreate({ subject: "Build foundation", ... });
const taskB = TaskCreate({ subject: "Build feature A", ... });
const taskC = TaskCreate({ subject: "Build feature B", ... });
const taskD = TaskCreate({ subject: "Integration", ... });

// Define dependencies
TaskUpdate({ taskId: taskB, addBlockedBy: [taskA] }); // B depends on A
TaskUpdate({ taskId: taskC, addBlockedBy: [taskA] }); // C depends on A
TaskUpdate({ taskId: taskD, addBlockedBy: [taskB, taskC] }); // D depends on B and C

// TaskList output:
// #1 [pending] Build foundation
// #2 [pending] Build feature A [blocked by #1]
// #3 [pending] Build feature B [blocked by #1]
// #4 [pending] Integration [blocked by #2, #3]
```

### Wave Assignment Algorithm

```typescript
function assignWaves(tasks: Task[]): Map<number, Task[]> {
  const waves = new Map<number, Task[]>();
  const completed = new Set<string>();

  let waveNum = 1;
  while (completed.size < tasks.length) {
    const currentWave = tasks.filter(task => {
      // Not yet completed
      if (completed.has(task.id)) return false;

      // No dependencies or all dependencies completed
      if (!task.blockedBy || task.blockedBy.length === 0) return true;
      return task.blockedBy.every(depId => completed.has(depId));
    });

    if (currentWave.length === 0) {
      throw new Error("Circular dependency detected");
    }

    waves.set(waveNum, currentWave);
    currentWave.forEach(task => completed.add(task.id));
    waveNum++;
  }

  return waves;
}
```

### Parallel Execution with Auto-Unblocking

```typescript
// Wave 1: No dependencies (execute in parallel)
const wave1Results = await Promise.all([
  Task({ agent: "gsd-executor", description: "Plan 1-01", ... }),
  Task({ agent: "gsd-executor", description: "Plan 1-02", ... })
]);

// Mark Wave 1 complete
TaskUpdate({ taskId: plan1, status: "completed" });
TaskUpdate({ taskId: plan2, status: "completed" });

// Plan 3 auto-unblocks (was blockedBy: [plan1])
// TaskList now shows #3 as pending (no longer blocked)

// Wave 2: Depends on Wave 1 (executes after Wave 1)
const wave2Results = await Task({
  agent: "gsd-executor",
  description: "Plan 1-03",
  ...
});

TaskUpdate({ taskId: plan3, status: "completed" });
```

**Benefits:**
- Faster execution (parallel when possible)
- Automatic dependency resolution
- Clear wave boundaries in reporting
- No manual dependency tracking needed

---

## Progress Visualization

### User-Facing Progress with TaskList

```typescript
// Query task list
const tasks = TaskList();

// Generate progress report
function generateProgressReport(tasks: Task[]): string {
  const phases = groupByPhase(tasks);
  let report = "Overall Progress:        ";

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const percentage = Math.round((completedTasks / totalTasks) * 100);

  report += renderBar(percentage) + "\n\n";

  for (const [phaseId, phaseTasks] of phases) {
    const phaseCompleted = phaseTasks.filter(t => t.status === "completed").length;
    const phasePercentage = Math.round((phaseCompleted / phaseTasks.length) * 100);
    const phaseStatus = phasePercentage === 100 ? "✓" : "";

    report += `${phaseId}  ${renderBar(phasePercentage)} ${phaseStatus}\n`;

    for (const task of phaseTasks) {
      const taskStatus = task.status === "completed" ? "✓" : "";
      const blockedText = task.blockedBy?.length ? " [blocked]" : "";
      report += `  ${task.subject}  ${renderBar(task.metadata.completion || 0)} ${taskStatus}${blockedText}\n`;
    }
    report += "\n";
  }

  return report;
}

// Example output:
// Overall Progress:        ████████████░░░░░░░░ 60%
//
// Phase 1: Foundation      ████████████████████ 100% ✓
//   Plan 1-01: Bootstrap   ████████████████████ 100% ✓
//   Plan 1-02: Discovery   ████████████████████ 100% ✓
//
// Phase 2: Frameworks      ████████████░░░░░░░░ 60%
//   Plan 2-01: Routing     ████████████████████ 100% ✓
//   Plan 2-02: Help        ████████████░░░░░░░░ 60%
//   Plan 2-03: Auth        ░░░░░░░░░░░░░░░░░░░░ 0% [blocked]
```

### Spinner Text with activeForm

```typescript
// When creating task
TaskCreate({
  subject: "Plan 2-02: Help System",
  description: "Implement help command with discovery",
  activeForm: "Building help system components"  // Shows in spinner
});

// When task is in_progress, user sees:
// ⠋ Building help system components

// Update spinner text mid-execution
TaskUpdate({
  taskId: "5",
  activeForm: "Generating help documentation"
});

// User now sees:
// ⠙ Generating help documentation
```

---

## State Synchronization

### Between Task List and File System

The task list is **ephemeral** (per session). Files are **persistent** (cross-session).

**Synchronization Strategy:**

```
Session Start:
  1. Read STATE.md (persistent state)
  2. Parse task history from STATE.md
  3. Recreate tracking tasks via TaskCreate
  4. Restore dependency relationships via TaskUpdate
  5. Continue from last position

Session End:
  1. Call TaskList to get current state
  2. Update STATE.md with:
     - Current phase/plan position
     - Completed tasks (with commits)
     - Blocked tasks (with reasons)
     - Next session context
  3. Update ROADMAP.md phase checkboxes
  4. Commit planning documentation
```

**STATE.md Structure:**

```markdown
## Current Status

Project in phase: 02-user-management
Active plans: [02-02]
Blocked on: none

Last session: 2026-01-25T14:30:00Z
Tasks in session: 12 completed, 3 pending

## Session Task History

### Session 2026-01-25 (tasks #8-#20)

| Task ID | Subject | Status | Commit | Blocked By |
|---------|---------|--------|--------|------------|
| #8 | Phase 2: User Management | in_progress | - | - |
| #9 | Plan 2-01: User Model | completed | abc123f | - |
| #10 | Plan 2-02: Auth Service | in_progress | - | - |
| #11 | Plan 2-03: Integration | pending | - | #9, #10 |

## Decisions Made

### Decision: Password Hashing Algorithm
- **Date:** 2026-01-25
- **Choice:** bcrypt with cost factor 12
- **Rationale:** Industry standard, OWASP recommended
- **Impact:** affects 02-02 (auth service)

## Context for Next Session

Plan 2-02 is 60% complete (2/3 tasks done).
Remaining: Implement password reset flow.
Plan 2-03 will auto-unblock when 2-02 completes.
```

---

## Verification Integration

### Post-Plan Verification with TaskUpdate

```typescript
// Plan completes
TaskUpdate({ taskId: planId, status: "completed" });

// Spawn verifier agent
const verifyResult = await Task({
  agent: "gsd-verifier",
  description: "Verify Plan 2-01 achieved phase goals",
  prompt: `
    <phase_goals>
      From ROADMAP.md Phase 2 success criteria
    </phase_goals>

    <plan_must_haves>
      From .planning/phases/02-user-management/02-01-PLAN.md frontmatter
    </plan_must_haves>

    <verification_process>
      1. Load phase goals and plan must_haves
      2. Verify truths (observable behaviors)
      3. Verify artifacts (file existence, substantive, wired)
      4. Verify key links (critical connections)
      5. Detect gaps (TODOs, stubs, placeholders)
      6. Generate VERIFICATION.md
    </verification_process>
  `
});

// Handle verification results
if (verifyResult.status === "gaps_found") {
  // Create gap-fixing tasks with dependencies
  const gapFixTask = TaskCreate({
    subject: "Fix gaps from Plan 2-01 verification",
    description: verifyResult.gaps.join(", "),
    activeForm: "Fixing verification gaps",
    metadata: {
      original_plan: "02-01",
      gap_count: verifyResult.gaps.length
    }
  });

  // Block subsequent plans on gap fix
  TaskUpdate({
    taskId: nextPlanId,
    addBlockedBy: [gapFixTask]
  });
}
```

---

## Command Implementation Pattern

### /gsd:execute Command with Dependency-Aware Waves

```markdown
# /gsd:execute-phase - Execute Plans with Wave-Based Parallelization

## Process

1. Read STATE.md to determine position
2. Get pending plans from ROADMAP.md for current phase
3. Parse plan frontmatter to extract dependencies (depends_on field)
4. Create tracking tasks for all plans (TaskCreate)
5. Establish dependencies (TaskUpdate with addBlockedBy)
6. Build wave assignment from dependency graph
7. For each wave (sequential):
   a. Get all unblocked plans in current wave via TaskList
   b. Spawn executors in parallel (all plans in wave):
      i. Task({ agent: "gsd-executor", ... }) for each plan
   c. Wait for all wave executors to complete
   d. Update plan tasks to completed (TaskUpdate)
   e. Dependencies auto-unblock for next wave
8. After all waves complete, update phase task to completed
9. Update STATE.md with progress
10. Generate completion report via TaskList

## Example Execution

```
Phase 2: User Management (4 plans)

Plan Dependencies:
- Plan 2-01: User Model (wave: 1, depends_on: [])
- Plan 2-02: Auth Service (wave: 1, depends_on: [])
- Plan 2-03: Integration (wave: 2, depends_on: [2-01, 2-02])
- Plan 2-04: Testing (wave: 3, depends_on: [2-03])

Creating tracking tasks...
  Created: #5 Phase 2: User Management
  Created: #6 Plan 2-01: User Model
  Created: #7 Plan 2-02: Auth Service
  Created: #8 Plan 2-03: Integration [blockedBy: #6, #7]
  Created: #9 Plan 2-04: Testing [blockedBy: #8]

Executing Wave 1 (2 plans in parallel)...
  [in_progress] Plan 2-01: User Model
  [in_progress] Plan 2-02: Auth Service

  [completed] ✓ Plan 2-01: User Model (commit: abc123f)
  [completed] ✓ Plan 2-02: Auth Service (commit: def456g)

Plan 2-03 auto-unblocked (dependencies #6, #7 completed)

Executing Wave 2 (1 plan)...
  [in_progress] Plan 2-03: Integration
  [completed] ✓ Plan 2-03: Integration (commit: ghi789j)

Plan 2-04 auto-unblocked (dependency #8 completed)

Executing Wave 3 (1 plan)...
  [in_progress] Plan 2-04: Testing
  [completed] ✓ Plan 2-04: Testing (commit: klm012n)

Phase 2: ✓ All plans complete (4/4)

Updated STATE.md with progress.
```
```

---

## Error Recovery with Tasks

### Automatic Retry Logic with TaskUpdate

```typescript
async function executeTaskWithRetry(
  taskDef: TaskDefinition,
  maxRetries: number = 2
): Promise<TaskResult> {
  let attempt = 0;

  while (attempt <= maxRetries) {
    // Create tracking task for this attempt
    const trackingId = TaskCreate({
      subject: `${taskDef.subject}${attempt > 0 ? ` (retry ${attempt})` : ""}`,
      description: taskDef.description,
      activeForm: taskDef.activeForm,
      metadata: {
        attempt,
        original_task: taskDef.id,
        max_retries: maxRetries
      }
    });

    // Mark as in progress
    TaskUpdate({ taskId: trackingId, status: "in_progress" });

    // Execute via Task tool
    const result = await Task({
      agent: taskDef.agent,
      description: taskDef.description,
      prompt: buildPrompt(taskDef, attempt)
    });

    if (result.success) {
      // Success - mark completed
      TaskUpdate({
        taskId: trackingId,
        status: "completed",
        metadata: { commit: result.commit_sha }
      });
      return result;
    }

    // Failure - mark failed with error
    TaskUpdate({
      taskId: trackingId,
      status: "failed",
      metadata: {
        attempt,
        error: result.error,
        will_retry: attempt < maxRetries
      }
    });

    attempt++;
  }

  // Max retries exceeded - escalate to user
  throw new Error(`Task failed after ${maxRetries} retries: ${taskDef.subject}`);
}
```

---

## Comparison: With vs Without Task Management

### Without Task Management (Naive Approach)

```
Session fills with:
- Plan discussions
- Implementation details
- Error messages
- Test outputs
- Refactoring thoughts
- Duplicate context from retries

Context at 95% → Quality degradation
No dependency tracking → Manual sequencing
No progress visibility → "Where are we?"
```

### With Task Management (GSD Approach)

```
Main Session (30% utilization):
- TaskCreate for orchestration
- TaskUpdate for progress tracking
- TaskList for reporting
- Dependency management via blockedBy

Task Subagents (Fresh 200k each):
- Implementation work
- Testing
- Committing
- Research
- Verification

Benefits:
- Context never exceeds 40% → Consistent quality
- Auto-unblocking → Zero manual dependency tracking
- Progress bars → Real-time visibility
- Metadata → Debugging and reporting
- Session-scoped → Clean slate per session
```

---

## Integration Checklist

When implementing GSD commands:

- [ ] Use TaskCreate for phase/plan/wave tracking
- [ ] Use TaskUpdate with addBlockedBy for dependencies
- [ ] Use Task tool with custom agents for actual execution
- [ ] Use TaskUpdate to reflect progress as agents complete
- [ ] Use TaskList for progress reporting to user
- [ ] Use TaskGet for detailed task inspection when debugging
- [ ] Include activeForm in TaskCreate for user-friendly spinners
- [ ] Store metadata in TaskCreate for reporting/debugging
- [ ] Sync task state to STATE.md on session end
- [ ] Restore tasks from STATE.md on session start
- [ ] Implement wave-based parallel execution with dependency auto-unblocking
- [ ] Include verification after each plan completion
- [ ] Handle task failures with retry logic using TaskUpdate status
- [ ] Report progress with visual bars generated from TaskList
- [ ] Define custom agents in ~/.gsd/agents/ for specialized work

---

## References

### Official Documentation
- [Claude Code CHANGELOG v2.1.16](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) - Task management system introduction
- [Claude Code Release Notes](https://claudelog.com/faqs/claude-code-release-notes/) - Feature announcements

### Verified Research
- `C:/Users/Destiny/Projects/get-stuff-done/research/03-claude-code-features.md` - Live testing results
- `C:/Users/Destiny/Projects/get-stuff-done/research/01-gsd-deep-dive.md` - GSD agent analysis

### GSD Architecture Documents
- `../GSD-METHODOLOGY.md` - Core methodology
- `../HYBRID-APPROACH.md` - Implementation strategy
- `./SYSTEM-DESIGN.md` - Technical design
