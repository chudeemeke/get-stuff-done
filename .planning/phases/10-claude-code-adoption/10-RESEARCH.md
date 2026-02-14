# Phase 10: Claude Code Capability Adoption - Research

**Researched:** 2026-02-14
**Domain:** Claude Code platform capabilities (memory, effort, agent teams, AskUserQuestion)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 1. Memory & Persistence

| Decision | Choice |
|----------|--------|
| Scope | Project-level (each project has its own agent memory) |
| Which agents | All GSD agents |
| Curation default | Auto-curation (agents decide what to write); toggleable to explicit triggers or full Claude discretion |
| Access model | Shared read, private write (each agent writes to own section, can read others') |
| Staleness handling | Active staleness detection (agents verify memories still apply before acting) |
| Conflict resolution | Latest-wins with contradiction logging |
| Format | Hybrid -- markdown body with YAML frontmatter for metadata |
| Location | `.planning/memory/` |
| Size limits | No explicit limit by default (grow organically); toggleable to fixed limit or rolling window |
| Phase tagging | Researcher/planner to determine if memories should auto-tag with producing phase |

**Key Insight:** The memory system is also the mechanism for maintaining oversight agent expertise over time. Agents learn from valid flags, missed issues, and verifier catches -- accumulated knowledge improves quality across sessions.

#### 2. Thinking Effort Calibration

| Decision | Choice |
|----------|--------|
| Priority | Quality-first (extended thinking wherever it genuinely improves output) |
| Scaling model | Dynamic -- base level per agent type + upscaling for complex tasks |
| Scale | Claude's native scale (API's reasoning_effort parameter) |
| High-effort operations | Upstream conflict resolution, all analysis operations, plan creation & verification |
| Visibility | Show in statusline when high effort is active |
| Course corrections | Always log to memory when extended thinking changes the answer |
| Location of hints | In agent definition files (self-contained) |

**RESEARCH NEEDED:** The Phase 10 researcher must investigate:
- Whether Task tool subagents inherit the session's effort level setting
- Whether there's an API parameter to set reasoning_effort per-spawn
- How `/model` effort slider maps to the API parameter
- Design thinking effort implementation based on actual findings, not assumptions

#### 3. Agent Teams & Parallelization

| Decision | Choice |
|----------|--------|
| Scope | Expand team patterns to more workflows |
| Team templates | Build now (Phase 10 scope) -- templates define common team shapes, workflows reference and optionally customize |
| Oversight agents | Specialized per workflow, memory-driven expertise accumulation |
| Monitoring style | Active monitoring (watches every action, flags in real-time) |
| Oversight authority | Flag and advise only (no blocking power) |
| Team size cap | Soft cap of 8 agents with warning; override allowed |
| Team integration | Native team member via TeamCreate/SendMessage (Claude Code primitives) |
| Flag routing | Configurable per workflow -- high-stakes (upstream sync, security) routes through lead; routine goes direct to executor |
| Oversight access | Full codebase access, artifact-first prompting (match Anthropic's pattern) |
| Default state | Oversight always on by default; configurable per workflow in config.json |

**Workflows to expand with teams:**
1. `/gsd:plan-phase` -- Parallel researcher + codebase mapper, both feeding into planner
2. `/gsd:execute-phase` -- Conflict watcher alongside parallel executors
3. `/gsd:upstream` -- Parallel upstream analyzer, fork conflict checker, branding handler
4. `/gsd:verify-work` -- Parallel verifiers (functional, cross-platform, security)

**Oversight agent design:**
- Specialized agents per workflow (not generic) -- separate `.md` files
- Memory-driven expertise: initial seeding from project knowledge, then auto-learning
- Structured flags: requirement reference, memory entry that prompted check, severity classification, suggested fix
- Expertise maintained through memory system (area 1) -- not manual curation

#### 4. Tool Migration

**DROPPED from Phase 10.**

#### 5. Other Claude Code Capabilities

| Capability | Decision | Notes |
|------------|----------|-------|
| AskUserQuestion | Include | Add to workflows: discuss-phase, verify-work, execute-phase checkpoints, plan-phase clarifications |
| Fast mode | Exclude | Marginal benefit -- GSD already has model profiles (haiku/sonnet/opus) |
| Additional hooks | Exclude | Pre-compact hook is sufficient |
| EnterPlanMode | Exclude | GSD has its own PLAN.md format with domain-specific structure |
| NotebookEdit | Exclude | Not relevant to GSD |

### Claude's Discretion

- Phase tagging: Researcher/planner to determine if memories should auto-tag with producing phase
- Memory file organization strategy (single file vs topic files per agent)
- Specific oversight agent names and prompt structures
- Team template file format and location

### Deferred Ideas (OUT OF SCOPE)

- Tool migration (Bash to Claude native tools) -- DROPPED
- Fast mode integration -- Excluded
- Additional hooks beyond pre-compact -- Excluded
- EnterPlanMode integration -- Excluded
- NotebookEdit -- Excluded
</user_constraints>

## Summary

Phase 10 adopts four Claude Code 2026 platform capabilities into GSD: agent memory, thinking effort calibration, agent teams with oversight, and AskUserQuestion structured input. Research reveals that three of the four map cleanly to existing platform primitives. The critical finding is that **thinking effort has no per-spawn API parameter** -- effort must be controlled through prompt content (e.g., "ultrathink" keyword in skills), not through a Task tool parameter. This changes the implementation approach from API-level configuration to prompt engineering within agent definitions.

The memory system has a divergence between the user's locked decision (`.planning/memory/`) and Claude Code's native agent memory location (`.claude/agent-memory/<name>/`). The recommended approach is to implement a custom memory layer using Read/Write tools at `.planning/memory/` rather than the native `memory` frontmatter field, because the native system stores files outside `.planning/` and uses per-agent directories rather than shared-read sections. Agent teams are experimental (require `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) with known limitations including no session resumption, one team per session, and no nested teams -- but subagent-based parallelization (current GSD approach) remains fully viable and can coexist.

**Primary recommendation:** Implement memory as custom Read/Write layer at `.planning/memory/`, effort hints as prompt engineering in agent definitions (not API params), teams using existing Task tool parallelization with optional experimental TeamCreate upgrade path, and AskUserQuestion in four workflows with the verified 1-4 question / 2-4 option constraint.

## Standard Stack

### Core

This phase adds no new external libraries. All capabilities use Claude Code built-in primitives.

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Claude Code Agent `.md` files | Current | Agent definitions with frontmatter | Existing GSD pattern, verified by official docs |
| Task tool (subagents) | Current | Parallel agent spawning | Already used by GSD workflows |
| Read/Write/Edit tools | Current | Memory file operations | Native Claude Code tools |
| AskUserQuestion tool | Current | Structured user input | Built-in Claude Code tool |

### Supporting (Experimental)

| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| TeamCreate/SendMessage | Experimental | Multi-session agent coordination | When workflows need inter-agent communication beyond subagent return values |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | env flag | Enables agent teams | Required for TeamCreate/SendMessage |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom `.planning/memory/` | Native `memory` frontmatter field | Native stores at `.claude/agent-memory/<name>/`, not `.planning/memory/`; per-agent dirs vs shared sections; auto-enables Read/Write/Edit but controls location |
| Task tool parallelization | TeamCreate agent teams | Teams enable direct inter-agent messaging but are experimental with known limitations |
| Prompt-based effort hints | API `reasoning_effort` parameter | No per-spawn effort parameter exists on Task tool; prompt-based is the only option |

## Architecture Patterns

### Memory System Architecture

```
.planning/
  memory/
    MEMORY.md              # Index file (first 200 lines loaded concept)
    gsd-executor.md        # Executor agent's private write section
    gsd-verifier.md        # Verifier agent's private write section
    gsd-planner.md         # Planner agent's private write section
    gsd-phase-researcher.md # Researcher agent's private write section
    gsd-debugger.md        # Debugger agent's private write section
    shared/                # Cross-agent knowledge (any agent can write)
      project-patterns.md  # Discovered project conventions
      pitfalls.md          # Known gotchas and fixes
```

#### Pattern: Shared Read, Private Write Memory

**What:** Each agent has its own memory file for writing. All agents can read all files. A shared directory exists for cross-cutting knowledge.

**When to use:** Every GSD agent interaction that produces reusable knowledge.

**Implementation approach:**

```markdown
# Agent memory file: .planning/memory/gsd-executor.md
---
agent: gsd-executor
updated: 2026-02-14T10:00:00Z
entries: 3
---

## Learned Patterns

- **TDD infrastructure detection**: This project uses bun test, not jest.
  Source: Phase 3 execution. Confidence: HIGH.

## Project-Specific Notes

- Build command requires `--experimental-vm-modules` flag
  Source: Phase 5 deviation. Confidence: HIGH.
```

**Memory read protocol (add to each agent's system prompt):**

```markdown
Before starting work, read your memory file and the shared memory:
1. Read `.planning/memory/<your-agent-name>.md` for your accumulated knowledge
2. Read `.planning/memory/shared/` files for cross-agent knowledge
3. Verify memories still apply (staleness check) before acting on them
4. After completing work, write new learnings to your memory file
```

**Memory write protocol:**

```markdown
When writing to memory:
1. Use YAML frontmatter with: agent, updated timestamp, entry count
2. Each entry: finding, source (which phase/task), confidence level
3. If contradicting an existing entry: keep both, mark old as "superseded by"
4. Log contradictions for transparency
```

### Agent Definition Enhancement Pattern

**What:** Add memory instructions, effort hints, and team awareness to existing agent `.md` frontmatter and system prompts.

**Current agent frontmatter (example: gsd-executor):**

```yaml
---
name: gsd-executor
description: Executes GSD plans with atomic commits...
tools: Read, Write, Edit, Bash, Grep, Glob
color: yellow
---
```

**Enhanced agent frontmatter:**

```yaml
---
name: gsd-executor
description: Executes GSD plans with atomic commits...
tools: Read, Write, Edit, Bash, Grep, Glob
color: yellow
---
```

Note: The `memory` frontmatter field is NOT used because it stores files at `.claude/agent-memory/` instead of `.planning/memory/`. Memory instructions go in the agent's system prompt body instead.

### Thinking Effort via Prompt Engineering

**What:** Control reasoning depth through prompt content in agent definitions and skills, since no per-spawn API parameter exists.

**When to use:** Agent definitions for base effort level; workflow orchestrators for task-specific upscaling.

**Implementation approach -- effort hints in agent system prompts:**

```markdown
<!-- In agent .md body, after role definition -->

<effort_calibration>
## Thinking Effort

**Base effort:** HIGH (this agent performs analysis operations)

**Upscale triggers** (use extended thinking for these):
- Conflict resolution between upstream and fork changes
- Architectural decision analysis
- Requirements coverage verification
- Multi-file dependency analysis

**Downscale triggers** (standard effort sufficient):
- File existence checks
- Simple grep operations
- Status reporting

When encountering an upscale trigger, think deeply and systematically.
Log to memory when extended thinking changes your initial conclusion.
</effort_calibration>
```

**Implementation approach -- effort in workflow orchestrator prompts:**

```markdown
<!-- In workflow .md, when spawning agents via Task tool -->

Spawn gsd-verifier with this prompt:
"[standard verification prompt]

EFFORT: This is a critical verification pass. Think very carefully and
systematically about each must-have truth. Do not rush through wiring
verification -- trace every connection thoroughly."
```

### Agent Teams Pattern (Experimental Path)

**What:** Use TeamCreate/SendMessage for workflows that benefit from inter-agent communication.

**When to use:** When subagent parallelization is insufficient because agents need to share findings mid-execution.

**Prerequisite:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings.json env.

**Team template structure:**

```markdown
# Team Template: plan-phase-research
# Used by: /gsd:plan-phase workflow

## Team Shape
- Lead: plan-phase orchestrator (delegate mode)
- Teammate 1: gsd-phase-researcher (domain research)
- Teammate 2: gsd-codebase-mapper (codebase analysis)
- Observer: gsd-oversight-planner (quality watcher)

## Task List
1. [researcher] Investigate phase technology domain
2. [mapper] Analyze codebase for relevant patterns
3. [researcher] Cross-reference findings with codebase map
4. [oversight] Review research completeness
```

**Fallback:** All team workflows must also work with standard Task tool subagent parallelization (non-team mode), since teams are experimental.

### AskUserQuestion Integration Pattern

**What:** Replace inline questions with structured AskUserQuestion tool calls in workflows.

**When to use:** discuss-phase (primary), verify-work, execute-phase checkpoints, plan-phase clarifications.

**Constraints verified from official docs:**
- 1-4 questions per call
- Each question: `question` (string), `header` (string, max 12 chars), `multiSelect` (boolean), `options` (array of 2-4 items)
- Each option: `label` (string, 1-5 words), `description` (string)
- "Other" option automatically added by the tool
- In plan mode: use for clarification, not approval gates

**Example pattern for discuss-phase:**

```markdown
Use AskUserQuestion to gather the user's preference:

Question: "How should agents handle memory conflicts?"
Header: "Conflicts"
multiSelect: false
Options:
  - label: "Latest wins (Recommended)"
    description: "Most recent write overwrites. Simple, predictable."
  - label: "Manual merge"
    description: "Flag conflicts for user resolution. More control."
  - label: "Version both"
    description: "Keep both entries with timestamps. Most data preserved."
```

### Oversight Agent Pattern

**What:** Specialized watcher agents per workflow that flag issues without blocking execution.

**When to use:** Every workflow that has team execution (plan-phase, execute-phase, upstream, verify-work).

**Agent definition pattern:**

```yaml
---
name: gsd-oversight-execution
description: Watches execution for requirement drift, security issues, and quality regressions. Flags concerns without blocking.
tools: Read, Grep, Glob, Bash
color: red
---
```

**System prompt pattern:**

```markdown
<role>
You are an execution oversight agent. You watch work in progress and flag
concerns. You NEVER block execution -- you flag and advise only.
</role>

<flag_format>
## Flag: [SEVERITY] [Category]

**Requirement:** [which requirement is at risk]
**Memory basis:** [which memory entry prompted this check]
**Finding:** [what you observed]
**Suggested fix:** [actionable recommendation]
**Severity:** CRITICAL | WARNING | INFO
</flag_format>

<expertise>
Before starting, read your memory at `.planning/memory/gsd-oversight-execution.md`
for accumulated expertise from previous sessions.

After flagging, update memory with:
- Valid flags (confirmed by executor/verifier)
- False positives (to avoid repeating)
- New patterns worth checking
</expertise>
```

### Anti-Patterns to Avoid

- **Using native `memory` frontmatter for GSD memory:** Stores at `.claude/agent-memory/` not `.planning/memory/`. Use custom Read/Write instead.
- **Assuming per-spawn effort control:** No `reasoning_effort` parameter on Task tool. Use prompt content.
- **Depending on TeamCreate for core functionality:** Experimental feature. All workflows must have subagent fallback.
- **Blocking oversight agents:** Oversight agents must flag and advise only, never block execution.
- **Loading entire memory at startup:** Follow the 200-line index pattern. Keep MEMORY.md as a concise index; detailed knowledge in topic files read on demand.
- **Oversight agents writing to executor memory files:** Violates private-write model. Oversight writes to its own file only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Structured user input | Custom prompt parsing | AskUserQuestion tool | Built-in UI with options, multiSelect, "Other" fallback |
| Agent spawning | Custom process management | Task tool | Handles context isolation, model selection, permission inheritance |
| Inter-agent messaging | File-based message passing | SendMessage (experimental) or Task tool return values | Race conditions, file locking complexity |
| Memory file format | Custom serialization | Markdown + YAML frontmatter | Human-readable, git-friendly, already used by GSD artifacts |
| Agent definition format | Custom config files | `.md` files with YAML frontmatter | Standard Claude Code format, auto-discovered, supports all fields |

**Key insight:** Phase 10 adds no new infrastructure. Every capability maps to existing Claude Code primitives or established GSD patterns. The work is agent definitions, workflow modifications, and memory protocol design.

## Common Pitfalls

### Pitfall 1: Memory Location Mismatch

**What goes wrong:** Using the native `memory` frontmatter field causes agent memories to be stored at `.claude/agent-memory/<name>/` instead of the user-specified `.planning/memory/`.

**Why it happens:** The `memory` frontmatter field is convenient (auto-enables Read/Write/Edit, auto-loads first 200 lines) but stores in a fixed location.

**How to avoid:** Implement memory through explicit Read/Write instructions in agent system prompts, targeting `.planning/memory/`. Do not use the `memory` frontmatter field.

**Warning signs:** Memory files appearing in `.claude/agent-memory/` instead of `.planning/memory/`.

### Pitfall 2: Effort Parameter Assumption

**What goes wrong:** Planning assumes a `reasoning_effort` parameter exists on the Task tool for per-agent effort control.

**Why it happens:** The CONTEXT.md references "API's reasoning_effort parameter" and "effort parameters" -- but these exist at the API/session level, not the Task tool spawn level.

**How to avoid:** Implement effort hints as prompt engineering in agent definitions and workflow spawn instructions. Use keywords like "think deeply", "analyze systematically", "ultrathink" in skill content.

**Warning signs:** Agent frontmatter containing `reasoning_effort` or `effort` fields (these don't exist).

### Pitfall 3: Agent Teams Feature Flag Missing

**What goes wrong:** TeamCreate/SendMessage calls fail silently or error because the experimental flag is not set.

**Why it happens:** Agent teams require `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in environment or settings.json.

**How to avoid:** Add the flag to settings.json env section. Ensure all team-based workflows have non-team fallback paths.

**Warning signs:** "TeamCreate is not available" errors, teammates not spawning.

### Pitfall 4: Agent Teams Session Limitations

**What goes wrong:** Team state is lost after session end, teammates become orphaned, or nested team creation fails.

**Why it happens:** Known limitations: no session resumption for in-process teammates, one team per session, no nested teams.

**How to avoid:** Design workflows to complete within a single session. Use subagent parallelization for shorter-lived work. Don't attempt to resume teams across sessions.

**Warning signs:** Lead attempting to message non-existent teammates after session resume, `/resume` not restoring team state.

### Pitfall 5: Oversight Agent Blocking Execution

**What goes wrong:** Oversight agent is given too much authority and starts blocking executor work, creating bottlenecks.

**Why it happens:** Natural instinct to give quality gates blocking power.

**How to avoid:** Oversight agents use flag-and-advise pattern only. Their tools list should NOT include Write/Edit for production code (only for their memory files). Flag routing is configurable per workflow.

**Warning signs:** Executors waiting on oversight approval, oversight agents modifying source code.

### Pitfall 6: Memory Bloat

**What goes wrong:** Auto-curation fills memory files with low-value entries, slowing down agent startup and consuming context.

**Why it happens:** Agents write memories for every observation without quality filtering.

**How to avoid:** Include curation guidelines in agent prompts: "Only write memories that would change your behavior next time." Follow the 200-line index pattern for MEMORY.md. Implement staleness detection (agents verify memories before acting on them).

**Warning signs:** Memory files exceeding 200 lines without being refactored into topic files, agents spending significant time reading irrelevant memories.

### Pitfall 7: AskUserQuestion in Wrong Mode

**What goes wrong:** AskUserQuestion used for approval gates in plan mode, or used when agent is running in background.

**Why it happens:** Misunderstanding of tool constraints.

**How to avoid:** In plan mode, use AskUserQuestion for clarification only, not approval. Background subagents cannot use AskUserQuestion (tool call fails). Only foreground agents should use it.

**Warning signs:** AskUserQuestion calls failing silently in background subagents.

## Code Examples

### Example 1: Memory-Enhanced Agent Definition

```markdown
# File: ~/.claude/agents/gsd-executor.md
---
name: gsd-executor
description: Executes GSD plans with atomic commits, deviation handling,
  checkpoint protocols, and state management.
tools: Read, Write, Edit, Bash, Grep, Glob
color: yellow
---

<role>
You are a GSD plan executor...
[existing role content]
</role>

<memory_protocol>
## Agent Memory

**Your memory file:** `.planning/memory/gsd-executor.md`
**Shared memory:** `.planning/memory/shared/`

### On Session Start
1. Read `.planning/memory/gsd-executor.md` (your accumulated knowledge)
2. Scan `.planning/memory/shared/` for cross-agent insights
3. For each memory entry, verify it still applies to current codebase state
4. Note any stale entries for cleanup

### During Execution
When you discover something reusable:
- Project-specific build/test commands
- Deviation patterns (what goes wrong and how to fix)
- Tool-specific gotchas (e.g., "bun test needs --experimental-vm-modules")
- Authentication gate patterns

Write to your memory file with this format:
```yaml
- finding: "Description of what you learned"
  source: "Phase X, Plan Y, Task Z"
  confidence: HIGH|MEDIUM|LOW
  date: "2026-02-14"
```

### On Session End
Update your memory file with new learnings.
If contradicting an existing entry, mark old as superseded:
```yaml
- finding: "Old understanding"
  status: superseded
  superseded_by: "New understanding"
  date: "2026-02-14"
```
</memory_protocol>

<effort_calibration>
## Thinking Effort

**Base effort:** MEDIUM

**Upscale to HIGH for:**
- Deviation rule decisions (Rule 1-4 classification)
- TDD test design (writing meaningful failing tests)
- Summary creation (substantive one-liners, accurate deviation docs)
- Checkpoint message composition

**Standard effort for:**
- File creation from plan specifications
- Git operations (staging, committing)
- State updates via gsd-tools
- Simple verification commands
</effort_calibration>

[rest of existing executor content]
```

### Example 2: Oversight Agent Definition

```markdown
# File: ~/.claude/agents/gsd-oversight-execution.md
---
name: gsd-oversight-execution
description: Watches plan execution for requirement drift, missed deviations,
  and quality regressions. Flags without blocking. Use alongside executors.
tools: Read, Grep, Glob, Bash
color: red
---

<role>
You are an execution oversight agent for GSD workflows. You monitor work
in progress and flag concerns to the team lead or directly to executors.

**Authority:** Flag and advise ONLY. You never block execution.
**Access:** Full codebase read access. No write access to source code.
**Memory:** Read/write to `.planning/memory/gsd-oversight-execution.md`
</role>

<monitoring_protocol>
## What to Watch For

1. **Requirement drift**: Executor implementing something different from plan
2. **Missing deviations**: Executor fixing things without documenting as deviation
3. **Security gaps**: Missing input validation, exposed secrets, auth bypasses
4. **Quality regressions**: Tests removed, error handling stripped, TODOs left
5. **Cross-plan conflicts**: Changes in one plan breaking assumptions of another

## Flag Format

When you find an issue, produce a structured flag:

**FLAG: [SEVERITY] [Category]**
- Requirement: [which requirement or plan task]
- Memory: [which memory entry prompted this check, if any]
- Finding: [what you observed, with file:line references]
- Suggested fix: [actionable recommendation]
- Severity: CRITICAL (blocks goal) | WARNING (degrades quality) | INFO (notable)

## Routing
- CRITICAL flags: Route through team lead
- WARNING/INFO flags: Route directly to executor
</monitoring_protocol>

<expertise_accumulation>
## Learning Protocol

After each session, update your memory with:
- Valid flags that led to fixes (positive signal)
- False positives (avoid repeating)
- New patterns worth checking in future sessions
- Project-specific quality standards discovered

Read your memory before starting each session to apply accumulated expertise.
</expertise_accumulation>
```

### Example 3: AskUserQuestion in Workflow

```markdown
# In discuss-phase.md workflow, replacing inline questions:

## Gray Area Selection

Use AskUserQuestion to identify which topics need discussion:

AskUserQuestion with:
  Question 1:
    question: "Which areas need discussion before planning?"
    header: "Scope"
    multiSelect: true
    options:
      - label: "All gray areas"
        description: "Discuss every area where approach is unclear"
      - label: "High-risk only"
        description: "Focus on decisions that could cause rework"
      - label: "Quick defaults"
        description: "Accept Claude's recommendations, discuss only blockers"

Then for each selected area, use additional AskUserQuestion calls
to gather specific preferences (max 4 questions per call, 2-4 options each).
```

### Example 4: Team Template

```markdown
# File: ~/.claude/get-stuff-done/teams/plan-phase-team.md
---
name: plan-phase-research-team
description: Parallel research team for plan-phase workflow
experimental: true
fallback: sequential-subagents
---

## Team Configuration

### Lead
- Role: plan-phase orchestrator
- Mode: delegate (coordination only)
- Model: inherit

### Teammates
1. **domain-researcher**
   - Agent: gsd-phase-researcher
   - Task: Investigate phase technology domain, produce findings
   - Model: inherit

2. **codebase-analyst**
   - Agent: gsd-codebase-mapper
   - Task: Analyze codebase for relevant patterns and constraints
   - Model: sonnet

3. **oversight**
   - Agent: gsd-oversight-planner
   - Task: Watch research quality, flag gaps and assumptions
   - Model: sonnet

## Task Dependencies
- Task "Cross-reference findings" depends on: domain-researcher, codebase-analyst
- Task "Review completeness" depends on: Cross-reference findings

## Fallback (non-team mode)
If CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS is not enabled:
1. Spawn gsd-phase-researcher via Task tool
2. Spawn gsd-codebase-mapper via Task tool (parallel)
3. Wait for both to complete
4. Synthesize results in orchestrator context
```

### Example 5: Config.json Enhancement

```json
{
  "model_profile": "balanced",
  "commit_docs": true,
  "memory": {
    "enabled": true,
    "location": ".planning/memory/",
    "curation": "auto",
    "staleness_check": true
  },
  "effort": {
    "default": "quality",
    "agents": {
      "gsd-executor": "medium",
      "gsd-verifier": "high",
      "gsd-planner": "high",
      "gsd-phase-researcher": "high",
      "gsd-plan-checker": "high",
      "gsd-codebase-mapper": "medium",
      "gsd-debugger": "high",
      "gsd-roadmapper": "medium"
    }
  },
  "teams": {
    "enabled": false,
    "experimental_flag": "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS",
    "oversight": {
      "default": true,
      "per_workflow": {
        "execute-phase": true,
        "plan-phase": true,
        "upstream-sync": true,
        "verify-work": true
      }
    },
    "soft_cap": 8
  }
}
```

## Critical Research Findings

### Finding 1: No Per-Spawn Effort Parameter (CONFIRMED)

**Confidence:** HIGH
**Source:** Official Claude Code subagent documentation (https://code.claude.com/docs/en/sub-agents)

The Task tool frontmatter supports these fields: `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`. There is NO `reasoning_effort`, `effort`, or `thinking` parameter.

**Impact on CONTEXT.md decisions:**
- "Claude's native scale (API's reasoning_effort parameter)" -- this exists at the API level but NOT at the Task tool spawn level
- "Location of hints: In agent definition files" -- CORRECT approach, but implemented as prompt content, not YAML field
- Subagents do NOT inherit the session's effort slider setting through any documented mechanism

**Recommended implementation:** Effort hints as structured prompt sections in agent definitions. The `skills` frontmatter field can inject effort-calibrated content at spawn time. Workflow orchestrators can add effort instructions to Task tool spawn prompts.

### Finding 2: Memory Location Divergence (CONFIRMED)

**Confidence:** HIGH
**Source:** Official Claude Code memory documentation (https://code.claude.com/docs/en/memory)

Native agent memory via the `memory` frontmatter field stores at:
- `user` scope: `~/.claude/agent-memory/<name>/`
- `project` scope: `.claude/agent-memory/<name>/`
- `local` scope: `.claude/agent-memory-local/<name>/`

User decision specifies `.planning/memory/`. These are incompatible locations.

**Recommended implementation:** Do NOT use the `memory` frontmatter field. Implement custom memory protocol using Read/Write tools with explicit instructions in each agent's system prompt. This gives full control over location, format, and access patterns.

**Tradeoff:** Lose auto-loading of first 200 lines into system prompt. Mitigate by having agents explicitly read their memory file at session start (already part of the proposed protocol).

### Finding 3: Agent Teams Are Experimental (CONFIRMED)

**Confidence:** HIGH
**Source:** Official Claude Code agent teams documentation (https://code.claude.com/docs/en/agent-teams)

Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Known limitations:
- No session resumption with in-process teammates
- One team per session
- No nested teams (teammates cannot spawn teams)
- Lead is fixed for session lifetime
- Permissions set at spawn (no per-teammate modes at spawn time)
- Task status can lag
- Shutdown can be slow
- Split panes require tmux or iTerm2

**Recommended implementation:** Build all workflows with Task tool subagent parallelization as primary path. Create team templates as optional upgrade when experimental flag is enabled. Test team workflows but don't depend on them for core functionality.

### Finding 4: Subagents Cannot Spawn Subagents (CONFIRMED)

**Confidence:** HIGH
**Source:** Official Claude Code subagent documentation

"Subagents cannot spawn other subagents." This means oversight agents spawned as subagents cannot spawn their own helpers. They must operate independently within their context window.

**Impact:** Oversight agents must be self-contained. They cannot delegate sub-tasks. Their monitoring must be achievable within a single agent's context.

### Finding 5: AskUserQuestion Constraints (CONFIRMED)

**Confidence:** HIGH
**Source:** Claude Code system prompts repository, multiple verified sources

Constraints:
- 1-4 questions per AskUserQuestion call
- Each question: `question` (string), `header` (max 12 chars), `multiSelect` (boolean), `options` (2-4 items)
- Each option: `label` (1-5 words), `description` (string)
- "Other" option automatically added
- Background subagents CANNOT use AskUserQuestion (tool call fails)
- Plan mode: use for clarification, not approval gates

**Impact on workflows:**
- discuss-phase: Can batch up to 4 questions per call, max 4 options each
- verify-work: Can present verification results with structured options
- execute-phase: Checkpoint decisions can use structured options
- plan-phase: Clarification questions only (not approval)

### Finding 6: Existing GSD Agent Inventory (CONFIRMED)

**Confidence:** HIGH
**Source:** Direct file reads of all 11 agent definitions

All 11 GSD agents currently have NO `memory` field, NO effort hints, and NO team awareness:

| Agent | Tools | Model | Needs Memory | Needs Effort | Needs Team |
|-------|-------|-------|-------------|-------------|-----------|
| gsd-executor | Read, Write, Edit, Bash, Grep, Glob | inherit | YES | YES | YES |
| gsd-verifier | Read, Write, Bash, Grep, Glob | inherit | YES | YES | YES |
| gsd-planner | Read, Write, Bash, Glob, Grep, WebFetch, mcp__context7__* | inherit | YES | YES | YES |
| gsd-phase-researcher | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__* | inherit | YES | YES | YES |
| gsd-plan-checker | Read, Bash, Glob, Grep | inherit | YES | YES | NO |
| gsd-codebase-mapper | Read, Bash, Grep, Glob, Write | inherit | YES | YES | YES |
| gsd-debugger | Read, Write, Edit, Bash, Grep, Glob, WebSearch | inherit | YES | YES | NO |
| gsd-project-researcher | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__* | inherit | YES | YES | NO |
| gsd-research-synthesizer | Read, Write, Bash | inherit | YES | MEDIUM | NO |
| gsd-roadmapper | Read, Write, Bash, Glob, Grep | inherit | YES | MEDIUM | NO |
| gsd-integration-checker | Read, Bash, Grep, Glob | inherit | YES | YES | NO |

### Finding 7: Model Field Options (CONFIRMED)

**Confidence:** HIGH
**Source:** Official Claude Code subagent documentation

Available model values: `sonnet`, `opus`, `haiku`, `inherit` (default).

These map to GSD's existing model_profile concept:
- quality = opus
- balanced = sonnet (or inherit)
- budget = haiku

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No agent memory | Native `memory` frontmatter field | 2025-2026 | Agents can accumulate knowledge across sessions |
| Single-model sessions | Per-agent model selection via frontmatter | 2025-2026 | Different agents can use different models |
| Sequential subagents only | Agent teams with TeamCreate/SendMessage | 2026 (experimental) | Inter-agent communication during execution |
| Free-form user questions | AskUserQuestion structured tool | 2025-2026 | Constrained, consistent user input UI |
| Manual skill loading | `skills` frontmatter field | 2025-2026 | Inject skill content at agent spawn |

**Deprecated/outdated:**
- Using `cat > file << 'HEREDOC'` for file creation -- Use Write tool instead (GSD lesson from Phase 9)
- Using `npm` -- Use `bun` (project convention)

## Open Questions

1. **Memory auto-loading without native `memory` field**
   - What we know: Native `memory` field auto-loads first 200 lines of MEMORY.md into system prompt. Custom Read/Write approach requires agents to explicitly read their file.
   - What's unclear: Whether the explicit-read approach adds meaningful latency or token cost vs auto-loading.
   - Recommendation: Accept the tradeoff. Explicit read is one Read tool call per session -- negligible cost. Gains full control over location and format.

2. **Effort hint effectiveness via prompt engineering**
   - What we know: Keywords like "ultrathink" in skill content trigger extended thinking. Prompt-based instructions like "think deeply" influence reasoning quality.
   - What's unclear: Exact correlation between prompt phrasing and actual reasoning depth. No documented API for measuring thinking effort applied.
   - Recommendation: Implement structured effort sections in agent definitions. Monitor output quality qualitatively. Adjust phrasing based on observed behavior.

3. **Agent teams stability timeline**
   - What we know: Teams are experimental with known limitations as of Feb 2026.
   - What's unclear: When (if ever) teams will become stable/default.
   - Recommendation: Build subagent-first architecture. Team templates as optional upgrade path. Don't block Phase 10 on team stability.

4. **Phase tagging for memories**
   - What we know: CONTEXT.md says "Researcher/planner to determine if memories should auto-tag with producing phase."
   - What's unclear: Whether phase tags add enough value to justify the metadata overhead.
   - Recommendation: YES, auto-tag with producing phase. Minimal overhead (one YAML field), significant value for staleness detection ("this was learned during Phase 3, is it still true in Phase 8?").

## Sources

### Primary (HIGH confidence)
- Claude Code Subagent Documentation: https://code.claude.com/docs/en/sub-agents -- Full frontmatter field reference, model options, memory field, subagent limitations
- Claude Code Agent Teams Documentation: https://code.claude.com/docs/en/agent-teams -- TeamCreate/SendMessage, limitations, experimental status, task list mechanics
- Claude Code Memory Documentation: https://code.claude.com/docs/en/memory -- Auto memory, MEMORY.md loading, agent-level memory scopes and paths
- Direct file reads of all 11 GSD agent definitions at `~/.claude/agents/gsd-*.md`
- Direct file reads of all 5 GSD workflow definitions at `~/.claude/get-stuff-done/workflows/*.md`
- Direct file read of `.planning/config.json`

### Secondary (MEDIUM confidence)
- Claude Code system prompts repository (AskUserQuestion schema): https://github.com/Piebald-AI/claude-code-system-prompts -- Tool parameter constraints
- Multiple web sources confirming AskUserQuestion 1-4 questions, 2-4 options constraint

### Tertiary (LOW confidence)
- "ultrathink" keyword behavior for extended thinking -- referenced in multiple sources but exact mechanism undocumented by Anthropic

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All based on official Claude Code documentation, verified frontmatter fields
- Architecture: HIGH -- Patterns derived from verified platform capabilities mapped to user decisions
- Pitfalls: HIGH -- Based on confirmed platform limitations and known GSD historical issues
- Effort calibration: MEDIUM -- Prompt-based effort control is real but exact effectiveness is qualitative, not quantifiable

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (30 days -- agent teams experimental status may change)
