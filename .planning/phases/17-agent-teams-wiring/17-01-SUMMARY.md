---
phase: 17
plan: 01
subsystem: workflows
tags: [agent-teams, config-routing, experimental, teams-integration]
dependency_graph:
  requires:
    - "10-03 team templates (execute-phase-team.md, plan-phase-team.md, upstream-sync-team.md, verify-work-team.md)"
    - ".planning/config.json teams.enabled config key"
  provides:
    - "Config-driven conditional team routing in all 4 GSD workflows"
    - "teams_integration sections with CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS env flag check"
  affects:
    - "get-stuff-done/workflows/execute-phase.md"
    - "get-stuff-done/workflows/plan-phase.md"
    - "get-stuff-done/workflows/upstream-sync.md"
    - "get-stuff-done/workflows/verify-phase.md"
tech_stack:
  added: []
  patterns:
    - "Config-driven conditional routing via python3 JSON read"
    - "Env flag check with graceful degradation"
    - "XML teams_integration section as extensibility hook in workflow markdown"
key_files:
  created: []
  modified:
    - "get-stuff-done/workflows/execute-phase.md"
    - "get-stuff-done/workflows/plan-phase.md"
    - "get-stuff-done/workflows/upstream-sync.md"
    - "get-stuff-done/workflows/verify-phase.md"
decisions:
  - "Use python3 JSON read for teams.enabled (grep unreliable for nested keys)"
  - "Env flag CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS required in addition to config (two-gate safety)"
  - "upstream-sync uses verify-work config key (matching team template naming convention)"
  - "Fallback message is a warning not an error (non-blocking, teams are experimental)"
metrics:
  duration: "5 minutes"
  completed: "2026-02-20"
  tasks: 2
  files: 4
---

# Phase 17 Plan 01: Agent Teams Wiring Summary

**One-liner:** Config-driven teams_integration sections wired into all 4 GSD workflows with python3 JSON read and env flag gating

## What Was Built

Four GSD workflow markdown files now contain a `<teams_integration>` XML section that reads `teams.enabled` from `.planning/config.json` and conditionally routes to team-based execution. Each section also checks for the `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` env flag as a second gate (experimental feature protection).

When `teams.enabled=false` (the default), all 4 workflows behave identically to before -- zero behavior change. When both the config flag and env flag are set, each workflow spawns its matching team template with the appropriate team composition, oversight agent, and flag routing strategy.

## Deliverables

| File | Section Added | Team Template Referenced |
|------|--------------|--------------------------|
| `get-stuff-done/workflows/execute-phase.md` | Inside `execute_waves` step | `execute-phase-team.md` |
| `get-stuff-done/workflows/plan-phase.md` | Inside `run_research` step | `plan-phase-team.md` |
| `get-stuff-done/workflows/upstream-sync.md` | Between Stage 3 and Stage 3.5 | `upstream-sync-team.md` |
| `get-stuff-done/workflows/verify-phase.md` | Inside `load_context` step | `verify-work-team.md` |

## Team Configurations Documented

**execute-phase team:**
- Lead: execute-phase orchestrator (delegate mode)
- Teammates: 1 gsd-executor per plan in wave (max 6)
- Observer: gsd-oversight-execution
- Flag routing: CRITICAL through lead, WARNING/INFO direct to executor

**plan-phase team:**
- Lead: plan-phase orchestrator (delegate mode)
- Teammates: gsd-phase-researcher + gsd-codebase-mapper
- Observer: gsd-oversight-planning
- Covers both research and planning; skips spawn_planner step when active

**upstream-sync team:**
- Lead: upstream-sync orchestrator (delegate mode)
- Teammates: commit-analyzer + conflict-detector + identity-checker
- Observer: gsd-oversight-sync
- Flag routing: ALL through lead (high-stakes per FLAG-ROUTING-001)

**verify-work team:**
- Lead: verify-work orchestrator (delegate mode)
- Teammates: gsd-verifier + platform-verifier + security-verifier
- Observer: gsd-oversight-verification
- Config key: `verify-work` (not `verify-phase`) matching team template convention

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- FOUND: get-stuff-done/workflows/execute-phase.md (contains teams_integration)
- FOUND: get-stuff-done/workflows/plan-phase.md (contains teams_integration)
- FOUND: get-stuff-done/workflows/upstream-sync.md (contains teams_integration)
- FOUND: get-stuff-done/workflows/verify-phase.md (contains teams_integration)
- FOUND: .planning/phases/17-agent-teams-wiring/17-01-SUMMARY.md
- FOUND: commit 73501d8 (Task 1: execute-phase + plan-phase)
- FOUND: commit d9ae53a (Task 2: upstream-sync + verify-phase)
- Tests: 563 pass, 0 fail
