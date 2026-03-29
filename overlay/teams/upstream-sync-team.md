# Team Template: upstream-sync-team

---
name: upstream-sync-team
description: Parallel upstream analysis team. Analyzer, conflict checker, and branding handler work simultaneously on commit analysis.
workflow: upstream-sync
experimental: true
fallback: sequential-subagents
---

## Team Configuration

### Lead
- **Role:** upstream-sync orchestrator
- **Mode:** delegate (coordination only)
- **Model:** inherit

### Teammates

**1. commit-analyzer**
- Agent: upstream analyzer (custom agent for upstream commit analysis)
- Task: Analyze upstream commits for integration feasibility
- Model: sonnet

**2. conflict-detector**
- Agent: fork conflict checker (custom agent for fork-specific conflicts)
- Task: Identify fork-specific conflicts and protected path violations
- Model: opus

**3. identity-checker**
- Agent: branding handler (custom agent for branding/naming preservation)
- Task: Check for branding/naming preservation in cherry-picks
- Model: haiku

### Observer

**4. security-watcher**
- Agent: gsd-oversight-sync
- Task: Watch for security risks and fork integrity violations
- Model: sonnet

### Team Size
Total: 5 members (lead + 3 teammates + 1 observer)

## Task Dependencies

**Per commit batch:**

1. **Parallel analysis**
   - commit-analyzer: Analyze upstream commits
   - conflict-detector: Identify fork conflicts
   - identity-checker: Check branding preservation
   - Dependencies: None (run in parallel)

2. **Security review**
   - Dependencies: Parallel analysis complete
   - Owner: security-watcher (oversight)

3. **Flag routing (CRITICAL)**
   - ALL flags from oversight route through lead
   - Lead decides whether to proceed, skip, or stop
   - Rationale: upstream-sync is HIGH-STAKES per CONTEXT.md

4. **Cherry-pick execution**
   - Dependencies: Security review, lead approval
   - Owner: Lead orchestrator

## Soft Cap

This team has 5 members. Soft cap is 8 per user decision.

## Fallback (non-team mode)

If `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is not enabled:

1. Sequential analysis per commit batch:
   - Analyze upstream commits (orchestrator context)
   - Identify fork conflicts (orchestrator context)
   - Check branding preservation (orchestrator context)
   - Security review (orchestrator context)
2. Cherry-pick execution
3. Repeat for next batch

**Note:** This is current sync workflow behavior. All concerns are addressed sequentially by orchestrator.

## High-Stakes Flag Routing

**IMPORTANT:** This is a HIGH-STAKES workflow per CONTEXT.md decision.

**Flag routing rule:** All oversight flags (CRITICAL, WARNING, INFO) route through lead, not directly to teammates.

**Rationale:** Security risks in cherry-picked code, fork integrity violations, and protected path modifications require orchestrator-level decisions, not individual executor judgment.

## Prerequisites

- Agent teams require `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in environment or settings.json
- Known limitations: no session resumption with in-process teammates, one team per session, no nested teams
- All workflows MUST work without teams (fallback path is the primary path until teams stabilize)
