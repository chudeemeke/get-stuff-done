# Phase 10 Plan 03: Team Templates & Oversight Agents Summary

Team templates for 4 parallel workflows and specialized oversight agent definitions

---
phase: 10-claude-code-adoption
plan: 03
subsystem: agent-teams-oversight
tags:
  - agent-teams
  - oversight-agents
  - parallel-orchestration
  - quality-monitoring
  - claude-code-adoption

dependency-graph:
  requires:
    - 10-01 (memory protocol and effort calibration)
  provides:
    - team-templates-for-4-workflows
    - oversight-agents-per-workflow
    - fallback-to-sequential-subagents
    - flag-and-advise-pattern
  affects:
    - plan-phase-workflow
    - execute-phase-workflow
    - upstream-sync-workflow
    - verify-work-workflow

tech-stack:
  added:
    - team-templates-directory
    - oversight-agent-definitions
    - flag-routing-patterns
  patterns:
    - shared-read-private-write-memory
    - active-monitoring-without-blocking
    - high-stakes-flag-routing
    - experimental-feature-fallback

key-files:
  created:
    - C:\Users\Destiny\.claude\get-stuff-done\teams\plan-phase-team.md
    - C:\Users\Destiny\.claude\get-stuff-done\teams\execute-phase-team.md
    - C:\Users\Destiny\.claude\get-stuff-done\teams\upstream-sync-team.md
    - C:\Users\Destiny\.claude\get-stuff-done\teams\verify-work-team.md
    - C:\Users\Destiny\.claude\agents\gsd-oversight-planning.md
    - C:\Users\Destiny\.claude\agents\gsd-oversight-execution.md
    - C:\Users\Destiny\.claude\agents\gsd-oversight-sync.md
    - C:\Users\Destiny\.claude\agents\gsd-oversight-verification.md
  modified: []

decisions:
  - TEAM-SIZE-001: "Soft cap of 8 agents per team per user decision (execute-phase can split waves if needed)"
  - TEAM-FALLBACK-001: "All team workflows MUST have sequential subagent fallback (teams are experimental)"
  - OVERSIGHT-AUTH-001: "Oversight agents flag and advise only, never block execution"
  - OVERSIGHT-TOOLS-001: "Oversight agents have Read/Write/Grep/Glob/Bash, no Edit (Write only for memory files)"
  - FLAG-ROUTING-001: "High-stakes workflows (upstream-sync) route ALL flags through lead; routine workflows route CRITICAL through lead, WARNING/INFO direct"
  - OVERSIGHT-MEMORY-001: "Each oversight agent has own memory file for expertise accumulation"

metrics:
  duration: "310 seconds (5.2 minutes)"
  completed: 2026-02-15T00:03:43Z
  tasks: 2
  files_created: 8
  commits: 2
---

## One-Liner

Four team templates define parallel orchestration shapes (researcher+mapper, wave-executors, upstream-analyzers, parallel-verifiers) with specialized oversight agents monitoring quality via flag-and-advise pattern, all with subagent fallback since teams are experimental.

## Task Completion

### Task 1: Create 4 team template files
- Created `teams/` directory at `C:\Users\Destiny\.claude\get-stuff-done\teams\`
- Created plan-phase-team.md (4 members: lead + researcher + mapper + oversight)
- Created execute-phase-team.md (N+2 members: lead + N executors + oversight, variable by wave size)
- Created upstream-sync-team.md (5 members: lead + 3 analyzers + oversight, HIGH-STAKES flag routing)
- Created verify-work-team.md (5 members: lead + 3 verifiers + oversight)
- All templates include: Lead/Teammates/Observer, task dependencies, soft cap note, fallback section, prerequisites
- **Commit:** b13c7db

### Task 2: Create 4 specialized oversight agent definitions
- Created gsd-oversight-planning.md (watches requirement coverage, dependencies, scope, CONTEXT.md violations)
- Created gsd-oversight-execution.md (watches requirement drift, missed deviations, security gaps, quality regressions)
- Created gsd-oversight-sync.md (watches fork integrity, branding losses, security risks in cherry-picks, protected paths)
- Created gsd-oversight-verification.md (watches false passes, untested wiring, coverage gaps)
- All agents include: YAML frontmatter, role section, monitoring_protocol, memory_protocol, effort_calibration, expertise_accumulation
- All agents have Read/Write/Grep/Glob/Bash tools (no Edit)
- All agents flag and advise only (no blocking authority)
- **Commit:** 2ddfae8

## Deviations from Plan

None - plan executed exactly as written.

## Verification

All verification steps passed:
- `teams/` directory exists with 4 template files
- Each team template has Lead, Teammates, Observer, task dependencies, soft cap note, and fallback section
- 4 oversight agent definitions exist
- Oversight agents have flag-and-advise authority only (no blocking)
- Oversight agents have Read, Write, Grep, Glob, Bash tools (no Edit tool found - correct)
- All oversight agents include memory_protocol, effort_calibration, and expertise_accumulation sections
- High-stakes workflow (upstream-sync) routes ALL flags through lead
- All team templates include experimental prerequisites and subagent fallback

## Key Decisions

**TEAM-SIZE-001:** Soft cap of 8 agents per team
- Rationale: User decision from CONTEXT.md, balances parallelization with coordination overhead
- Impact: Execute-phase can run max ~6 parallel executors (lead + 6 executors + oversight = 8)

**TEAM-FALLBACK-001:** All team workflows MUST have sequential subagent fallback
- Rationale: Agent teams are experimental with known limitations (no session resumption, one team per session, no nested teams)
- Implementation: Each team template includes "Fallback (non-team mode)" section with exact subagent spawn sequence

**OVERSIGHT-AUTH-001:** Oversight agents flag and advise only
- Rationale: Blocking execution creates bottlenecks; flag-and-advise enables continuous execution with quality feedback
- Implementation: Role section explicitly states "Flag and advise ONLY. You never block execution."

**OVERSIGHT-TOOLS-001:** Oversight agents have Read/Write/Grep/Glob/Bash, no Edit
- Rationale: Oversight should monitor, not modify source code; Write access for memory files only
- Implementation: Tools frontmatter excludes Edit; role section clarifies "Write access only to your memory file"

**FLAG-ROUTING-001:** High-stakes workflows route ALL flags through lead
- Rationale: Upstream-sync is HIGH-STAKES per CONTEXT.md; security risks and fork integrity need orchestrator-level decisions
- Implementation: upstream-sync-team.md and gsd-oversight-sync.md explicitly document routing through lead

**OVERSIGHT-MEMORY-001:** Each oversight agent has own memory file
- Rationale: Expertise accumulation over time (valid flags, false positives, new patterns)
- Location: `.planning/memory/gsd-oversight-{workflow}.md`

## Technical Notes

### Team Template Structure
Each template follows consistent format:
1. YAML frontmatter: name, description, workflow, experimental: true, fallback: sequential-subagents
2. Team Configuration: Lead (delegate mode), Teammates (with agent refs and tasks), Observer (oversight agent)
3. Task Dependencies: Execution order, parallel vs sequential, dependencies
4. Soft Cap: Team size vs 8-member soft cap
5. Fallback (non-team mode): Exact subagent spawn sequence for when teams disabled
6. Prerequisites: Experimental flag requirement and known limitations

### Oversight Agent Pattern
All oversight agents share common structure:
- Flag-and-advise authority (never block)
- Active monitoring (watch every action, flag in real-time)
- Memory-driven expertise (learn from valid flags, false positives, new patterns)
- Structured flag format: severity, requirement, memory basis, finding, suggested fix
- Self-contained (cannot spawn sub-agents)

### Team Size Variability
- plan-phase-team: Fixed 4 members (lead + researcher + mapper + oversight)
- execute-phase-team: Variable N+2 (lead + N executors + oversight), where N ≤ 6 per soft cap
- upstream-sync-team: Fixed 5 members (lead + 3 analyzers + oversight)
- verify-work-team: Fixed 5 members (lead + 3 verifiers + oversight)

### Flag Routing Strategies

**Routine workflows (plan-phase, verify-work):**
- CRITICAL flags: Through lead
- WARNING/INFO flags: Direct to working agent

**High-stakes workflows (upstream-sync):**
- ALL flags (CRITICAL, WARNING, INFO): Through lead
- Lead decides: proceed with fix, skip commit, stop sync

**Execution workflow (execute-phase):**
- CRITICAL flags: Through lead
- WARNING/INFO flags: Direct to executor

### Fallback Behavior
All team templates work without `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` flag:
- Plan-phase: Sequential researcher → mapper → planner (current behavior)
- Execute-phase: Sequential or parallel Task spawns per wave (current behavior)
- Upstream-sync: Sequential analysis in orchestrator (current behavior)
- Verify-work: gsd-verifier + orchestrator post-processing (current behavior)

Oversight is skipped in fallback mode (quality checks done by orchestrator or during verification phase).

## Self-Check

PASSED

Created files verified:
- FOUND: C:\Users\Destiny\.claude\get-stuff-done\teams\plan-phase-team.md
- FOUND: C:\Users\Destiny\.claude\get-stuff-done\teams\execute-phase-team.md
- FOUND: C:\Users\Destiny\.claude\get-stuff-done\teams\upstream-sync-team.md
- FOUND: C:\Users\Destiny\.claude\get-stuff-done\teams\verify-work-team.md
- FOUND: C:\Users\Destiny\.claude\agents\gsd-oversight-planning.md (with memory_protocol, flag-and-advise)
- FOUND: C:\Users\Destiny\.claude\agents\gsd-oversight-execution.md (with memory_protocol, flag-and-advise)
- FOUND: C:\Users\Destiny\.claude\agents\gsd-oversight-sync.md (with memory_protocol, flag-and-advise)
- FOUND: C:\Users\Destiny\.claude\agents\gsd-oversight-verification.md (with memory_protocol, flag-and-advise)

Commits verified:
- FOUND: b13c7db (team templates)
- FOUND: 2ddfae8 (oversight agents)

---

*Completed: 2026-02-15T00:03:43Z*
*Executor: gsd-executor (Sonnet 4.5)*
*Duration: 5.2 minutes*
