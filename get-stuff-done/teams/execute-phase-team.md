# Team Template: execute-phase-team

---
name: execute-phase-team
description: Parallel execution team with conflict watcher. Multiple executors can run wave-parallel plans while oversight monitors for drift.
workflow: execute-phase
experimental: true
fallback: sequential-subagents
---

## Team Configuration

### Lead
- **Role:** execute-phase orchestrator
- **Mode:** delegate (coordination only)
- **Model:** inherit

### Teammates

**1-N. plan-executors**
- Agent: gsd-executor
- Task: Execute one plan from current wave
- Count: 1 per parallel plan in current wave
- Model: per config profile (inherit, sonnet, opus)

### Observer

**N+1. requirement-drift-watcher**
- Agent: gsd-oversight-execution
- Task: Watch execution for requirement drift, missed deviations, security gaps
- Model: opus

### Team Size
Variable: Lead + N executors + 1 oversight = N+2 members

Soft cap is 8, so max ~6 parallel executors + lead + oversight.

## Task Dependencies

**Wave-based execution:**

1. **Wave N plans (parallel)**
   - Each executor runs one plan from wave
   - All executors in wave run simultaneously
   - Oversight monitors all executors continuously
   - Dependencies: None within wave

2. **Wave N+1 plans (parallel)**
   - Dependencies: All Wave N plans complete
   - Pattern repeats for each wave

**Flag routing:**
- CRITICAL flags from oversight: Routed through lead
- WARNING/INFO flags: Routed directly to executor

## Soft Cap

This team size varies by wave. Soft cap is 8 per user decision, meaning max ~6 parallel executors + lead + oversight.

If wave has more than 6 plans, orchestrator should split into sub-waves or run sequentially.

## Fallback (non-team mode)

If `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is not enabled:

1. For each wave:
   - Spawn gsd-executor via Task tool for each plan in wave (sequential or parallel depending on dependencies)
   - Wait for all plans in wave to complete
   - Continue to next wave

**Note:** Oversight is skipped in fallback mode. Requirement drift checks are performed during verification phase instead.

## Prerequisites

- Agent teams require `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in environment or settings.json
- Known limitations: no session resumption with in-process teammates, one team per session, no nested teams
- All workflows MUST work without teams (fallback path is the primary path until teams stabilize)
