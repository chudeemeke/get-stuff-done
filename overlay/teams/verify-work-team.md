# Team Template: verify-work-team

---
name: verify-work-team
description: Parallel verification team. Functional, cross-platform, and security verifiers work simultaneously on phase outputs.
workflow: verify-work
experimental: true
fallback: sequential-subagents
---

## Team Configuration

### Lead
- **Role:** verify-work orchestrator
- **Mode:** delegate (coordination only)
- **Model:** inherit

### Teammates

**1. functional-verifier**
- Agent: gsd-verifier
- Task: Functional verification via goal-backward analysis
- Model: inherit

**2. platform-verifier**
- Agent: cross-platform verifier (custom agent for platform-specific checks)
- Task: Platform-specific verification (Windows, macOS, Linux)
- Model: opus

**3. security-verifier**
- Agent: security verifier (custom agent for security-focused review)
- Task: Security-focused review of phase outputs
- Model: opus

### Observer

**4. completeness-watcher**
- Agent: gsd-oversight-verification
- Task: Watch verification completeness, flag false passes
- Model: opus

### Team Size
Total: 5 members (lead + 3 teammates + 1 observer)

## Task Dependencies

1. **Parallel verification (all verifiers run simultaneously)**
   - functional-verifier: Goal-backward analysis of must-have truths
   - platform-verifier: Platform-specific checks (paths, commands, hooks)
   - security-verifier: Security review (secrets, validation, auth)
   - Dependencies: None (run in parallel)

2. **Completeness review**
   - Dependencies: All parallel verifiers complete
   - Owner: completeness-watcher (oversight)

3. **Final synthesis**
   - Dependencies: Completeness review
   - Owner: Lead orchestrator
   - Output: Combined VERIFICATION.md with all findings

## Soft Cap

This team has 5 members. Soft cap is 8 per user decision.

## Fallback (non-team mode)

If `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is not enabled:

1. Spawn gsd-verifier via Task tool (current behavior)
2. Run additional verification checks sequentially in orchestrator:
   - Cross-platform checks (Windows/macOS/Linux paths, commands)
   - Security checks (secrets, validation patterns)
3. Synthesize combined verification report

**Note:** Current behavior. All verification is done by gsd-verifier with orchestrator post-processing.

## Prerequisites

- Agent teams require `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in environment or settings.json
- Known limitations: no session resumption with in-process teammates, one team per session, no nested teams
- All workflows MUST work without teams (fallback path is the primary path until teams stabilize)
