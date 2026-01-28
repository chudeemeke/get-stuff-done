# Architecture

**Analysis Date:** 2026-01-28

## Pattern Overview

**Overall:** Multi-Agent Orchestration with File-Based State Persistence

**Key Characteristics:**
- Thin orchestrators delegate heavy work to specialized subagents with fresh 200k-token contexts
- State persists in markdown files, not conversation context (prevents context rot)
- Wave-based parallel execution with dependency management
- Goal-backward verification at multiple levels (plans, phases, milestones)
- XML-structured prompts for machine-parseable task definitions

## Layers

**User Interface Layer:**
- Purpose: Entry points for user interaction via Claude Code slash commands
- Location: `commands/gsd/`
- Contains: 29 slash command definitions (markdown files)
- Depends on: Orchestration layer, workflows
- Used by: Claude Code runtime

**Orchestration Layer:**
- Purpose: Coordinate agent spawning, dependency tracking, state transitions
- Location: `get-stuff-done/workflows/`
- Contains: 12 workflow definitions (execute-phase, verify-work, map-codebase, etc.)
- Depends on: Agent definitions, templates
- Used by: Slash commands

**Agent Layer:**
- Purpose: Specialized subagents for isolated execution with fresh contexts
- Location: `agents/`
- Contains: 11 agent definitions (gsd-executor, gsd-planner, gsd-verifier, etc.)
- Depends on: Templates, references
- Used by: Orchestrators via Claude Code Task tool

**Template Layer:**
- Purpose: Document structure definitions for generated artifacts
- Location: `get-stuff-done/templates/`
- Contains: Phase prompts, summaries, codebase analysis templates
- Depends on: None
- Used by: Agents during artifact generation

**Reference Layer:**
- Purpose: Shared knowledge and behavior specifications
- Location: `get-stuff-done/references/`
- Contains: Checkpoints, verification patterns, TDD, git integration, model profiles
- Depends on: None
- Used by: Agents and workflows via @-references

## Data Flow

**Project Initialization:**
1. `/gsd:new-project` command triggers questioning flow
2. User provides project vision, requirements, constraints
3. 4 parallel `gsd-project-researcher` agents investigate domain
4. `gsd-research-synthesizer` consolidates findings
5. `gsd-roadmapper` creates phase breakdown
6. Artifacts written: `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`

**Phase Execution:**
1. `/gsd:execute-phase N` discovers plans in phase directory
2. Plans grouped by wave number from frontmatter
3. Per wave: spawn parallel `gsd-executor` subagents
4. Each executor: read plan, execute tasks, commit per-task, write SUMMARY.md
5. `gsd-verifier` validates phase goals against codebase
6. STATE.md and ROADMAP.md updated

**State Management:**
- STATE.md tracks: current position, decisions, blockers, quick tasks
- ROADMAP.md tracks: phase completion status, requirement coverage
- PLAN.md files track: task completion, deviations, summaries
- All state persists in files, enabling fresh context windows per session

## Key Abstractions

**Plan (Executable Prompt):**
- Purpose: Atomic unit of work with tasks, verification, and acceptance criteria
- Examples: `{phase}-{plan}-PLAN.md` files in `.planning/phases/`
- Pattern: YAML frontmatter (metadata) + XML body (tasks)

**Wave:**
- Purpose: Group of plans that can execute in parallel
- Examples: Wave 1 = no dependencies, Wave 2 = depends on Wave 1, etc.
- Pattern: Pre-computed during planning, stored in frontmatter `wave: N`

**Checkpoint:**
- Purpose: Human interaction point during autonomous execution
- Examples: `type="checkpoint:human-verify"`, `type="checkpoint:decision"`
- Pattern: Executor pauses, returns structured message, fresh agent continues

**Must-Haves:**
- Purpose: Verifiable success criteria derived from goals
- Examples: `truths` (behaviors), `artifacts` (files), `key_links` (connections)
- Pattern: Defined in plan frontmatter, verified by gsd-verifier

## Entry Points

**CLI Launcher (`bin/gsd`):**
- Location: `bin/gsd`
- Triggers: User runs `gsd` in terminal
- Responsibilities: Set environment vars, launch Claude Code with autocompact settings

**Installer (`bin/install.js`):**
- Location: `bin/install.js`
- Triggers: `npx get-stuff-done` or `node bin/install.js`
- Responsibilities: Copy agents, commands, hooks to `~/.claude/` or `.claude/`

**Slash Commands (`commands/gsd/*.md`):**
- Location: `commands/gsd/`
- Triggers: User types `/gsd:command-name` in Claude Code
- Responsibilities: Parse arguments, load context, execute workflow

## Error Handling

**Strategy:** Four-rule automatic deviation handling during execution

**Patterns:**
- **Rule 1 (Auto-fix bugs):** Fix security issues, errors, incorrect behavior immediately
- **Rule 2 (Auto-add critical):** Add validation, auth, error handling automatically
- **Rule 3 (Auto-fix blockers):** Resolve missing deps, config errors to proceed
- **Rule 4 (Request architectural):** Stop and ask user for schema changes, major refactoring

**Verification Failure Handling:**
1. gsd-verifier creates VERIFICATION.md with gap analysis
2. Orchestrator presents gaps to user
3. User runs `/gsd:plan-phase N --gaps` to create fix plans
4. Execute fix plans, re-verify, loop until passed

## Cross-Cutting Concerns

**Logging:**
- Event logging in `.planning/events.log`
- Per-session compaction events tracked
- Metrics snapshots before compaction

**Context Management:**
- PreCompact hook saves state before context clears
- Autocompact threshold configurable (default 50%)
- CONTINUE.md generated for seamless resume

**Git Integration:**
- Atomic commits per task: `{type}({phase}-{plan}): {description}`
- Plan metadata commits: `docs({phase}-{plan}): complete [plan-name] plan`
- Phase completion commits bundle state updates
- Individual file staging (never `git add .`)

**Model Selection:**
- Three profiles: quality (opus), balanced (sonnet), budget (haiku/sonnet)
- Per-agent model override via config.json
- Profile selection via `/gsd:set-profile`

---

*Architecture analysis: 2026-01-28*
