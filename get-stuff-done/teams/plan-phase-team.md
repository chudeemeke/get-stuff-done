# Team Template: plan-phase-research-team

---
name: plan-phase-research-team
description: Parallel research team for plan-phase workflow. Researcher and codebase mapper work simultaneously, feeding findings into planner.
workflow: plan-phase
experimental: true
fallback: sequential-subagents
---

## Team Configuration

### Lead
- **Role:** plan-phase orchestrator
- **Mode:** delegate (coordination only)
- **Model:** inherit

### Teammates

**1. domain-researcher**
- Agent: gsd-phase-researcher
- Task: Investigate phase technology domain, produce research findings
- Model: inherit

**2. codebase-analyst**
- Agent: gsd-codebase-mapper
- Task: Analyze codebase for relevant patterns and constraints
- Model: opus

### Observer

**3. research-quality-watcher**
- Agent: gsd-oversight-planning
- Task: Watch research quality, flag gaps and assumptions
- Model: opus

### Team Size
Total: 4 members (lead + 2 teammates + 1 observer)

## Task Dependencies

1. **Parallel research phase**
   - domain-researcher: Investigate phase technology domain
   - codebase-analyst: Analyze codebase for relevant patterns
   - Dependencies: None (run in parallel)

2. **Cross-reference findings**
   - Dependencies: domain-researcher, codebase-analyst (must complete first)
   - Owner: Lead orchestrator

3. **Quality review**
   - Dependencies: Cross-reference findings
   - Owner: research-quality-watcher (oversight)

4. **Generate plans**
   - Dependencies: Quality review
   - Owner: Lead orchestrator (spawns gsd-planner)

## Soft Cap

This team has 4 members. Soft cap is 8 per user decision.

## Fallback (non-team mode)

If `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is not enabled:

1. Spawn gsd-phase-researcher via Task tool
2. Spawn gsd-codebase-mapper via Task tool (parallel)
3. Wait for both to complete
4. Synthesize results in orchestrator context
5. Spawn gsd-planner via Task tool with synthesized context

**Note:** Oversight is skipped in fallback mode. Quality checks are performed by the orchestrator.

## Prerequisites

- Agent teams require `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in environment or settings.json
- Known limitations: no session resumption with in-process teammates, one team per session, no nested teams
- All workflows MUST work without teams (fallback path is the primary path until teams stabilize)
