# Assessment Report: CLAUDE-06 Agent Teams vs Upstream Auto-Advance

**Date:** 2026-02-23
**Requirement ID:** ASSESS-01
**Evaluating:** CLAUDE-06 (agent teams orchestration) against upstream auto-advance pipeline

---

## Executive Summary

Upstream's auto-advance pipeline (sequential phase chaining via `--auto` flag and `workflow.auto_advance` config) and CLAUDE-06 (parallel task execution within a phase using the TeamCreate API) solve fundamentally different problems. Auto-advance eliminates manual phase progression by chaining discuss -> plan -> execute -> transition sequentially. Agent teams accelerate individual phase execution by running independent tasks simultaneously. Both capabilities are already partially present in the fork: auto-advance was cherry-picked in Phase 18 Batch 12 (commit 131f24b) and is fully operational; CLAUDE-06 team templates and workflow routing were wired in Phases 10 and 17 but the TeamCreate API calls are dormant pending stabilization of the experimental API flag. CLAUDE-06 scope should be narrowed to reflect current state -- not eliminated -- and the conditional requirement is satisfied by what is already in place.

---

## What Auto-Advance Does

**Status: COMPLETE (cherry-picked in Phase 18 Batch 12, commit 131f24b)**

Auto-advance handles sequential phase chaining with no user confirmation required between phases:

- `workflow.auto_advance: true` in `.planning/config.json` enables the behavior
- `--auto` flag threads through discuss-phase -> plan-phase -> execute-phase -> transition in sequence
- When a phase completes with no blockers, the workflow automatically chains to the next phase
- Works by embedding direct `@file` references in Task() prompts instead of calling `/gsd:` skills (skills do not resolve inside Task subagents)
- Direction: strictly sequential -- one phase at a time, no parallelism

**What auto-advance does NOT do:** It does not run multiple plans, tasks, or agents simultaneously. Each step completes before the next begins.

---

## What CLAUDE-06 Does

**Status: PARTIAL (routing wired, TeamCreate API calls not active)**

CLAUDE-06 is the agent teams orchestration capability for running tasks IN PARALLEL simultaneously within a single phase:

- **Phase 10:** Created 4 team templates (`gsd-executor-team.md`, `gsd-planner-team.md`, `gsd-verifier-team.md`, `gsd-oversight-team.md`) and 4 oversight agent definitions
- **Phase 17:** Added `<teams_integration>` conditional sections to 4 workflows (execute-phase, plan-phase, upstream-sync, verify-work)
- **Current state:** Config-driven routing exists in `.planning/config.json` under `teams.enabled` and `teams.experimental_flag` fields. However, no actual TeamCreate API calls are made -- the sections are conditional on `teams.enabled: true` which currently defaults to `false`
- **Experimental dependency:** Activating full teams requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` environment flag, which is experimental and not stable

**Existing Task-based parallelism:** The execute-phase workflow already spawns multiple executors via the Task tool (not TeamCreate). This provides task-level parallelism today, without the experimental API. Agent teams would add native coordination and oversight beyond what Task-spawning provides.

---

## Comparison

| Dimension | Auto-Advance | Agent Teams (CLAUDE-06) |
|-----------|-------------|------------------------|
| Direction | Sequential phase chaining | Parallel task execution within a phase |
| Status | Complete (cherry-picked Phase 18 Batch 12) | Partial (routing wired, TeamCreate API not called) |
| Config entry | `workflow.auto_advance: true` | `teams.enabled: false` (dormant) |
| API dependency | None (uses Task tool + @file refs) | Experimental `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` flag |
| What it replaces | Manual `/gsd:execute-phase` skill invocations | Manual sequential task execution within a phase |
| Value | Hands-free phase progression | Faster execution of independent tasks in parallel |
| Complementary to the other | Yes -- auto-advance chains phases; teams parallelize within each phase | Yes |

---

## Assessment

Auto-advance does NOT make CLAUDE-06 redundant. They are complementary capabilities addressing different dimensions of the execution pipeline:

- Auto-advance reduces latency between phases (sequential chaining)
- Agent teams reduce latency within phases (parallel execution)
- A fully automated pipeline could use both: auto-advance chains phases sequentially while agent teams parallelize independent tasks within each phase

The existing Task-based parallelism in execute-phase already provides practical task-level parallelism without the TeamCreate API. The incremental value of full CLAUDE-06 (over Task-based spawning) is native team coordination and oversight agents. That incremental value is real but not blocking any current workflow.

The experimental API flag (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) is a production blocker. Until Claude Code's agent teams API is stable and non-experimental, activating TeamCreate calls would create an unreliable dependency.

---

## Scope Recommendation

**CLAUDE-06 conditional requirement: SATISFIED by current state.**

Rationale:

1. Phase 10 team templates and Phase 17 workflow routing represent the full design for agent teams orchestration
2. The teams configuration infrastructure is present in config.json (`teams.enabled`, `teams.experimental_flag`, `teams.soft_cap`, `teams.oversight`)
3. The execute-phase workflow already achieves parallel execution via Task spawning -- the core value is delivered
4. No additional Phase 19 work is needed for CLAUDE-06

**No action required in Phase 19.**

**Revisit condition:** When Claude Code's agent teams API transitions from experimental to stable and is widely supported across Claude Code versions. At that point, the scope would be activating the TeamCreate API calls that are already wired but dormant -- a narrow implementation task, not a design task.

**If revisited:** Change `teams.enabled: false` to `true` in config.json and implement the actual TeamCreate API calls in the `<teams_integration>` sections already present in the 4 workflows. The team templates and oversight agent definitions are already in place.

---

*Phase: 19-post-sync-stabilization*
*Completed: 2026-02-23*
