# PR And Issue Evidence Workflow

**Date:** 2026-07-19
**Status:** Approved governance direction; local implementation branch
`docs/pr-issue-evidence-workflow`

## Decision

Use one issue per meaningful deliverable or owner-gated decision, one pull
request per coherent implementation/evidence slice, and GSD artifacts as the
authoritative deep record. A pull request counts as evidence only when the
expected hosted contract ran against its final HEAD and the durable record cites
the actual result.

## Required Chain

`issue -> GSD artifact -> focused branch -> PR -> final-HEAD checks -> merge -> state update`

## Acceptance

- Repository-owned contribution guidance defines issue, PR, merge, closure,
  and goal-completion semantics.
- The PR template requires summary, scope, verification, non-claims,
  risks/blockers, links, and final-HEAD hosted evidence.
- Every issue form requires problem, outcome, boundaries, acceptance,
  verification, non-claims, and a GSD link.
- A machine-readable label catalog contains the approved shared taxonomy.
- A machine-readable hosted contract lists expected workflows and records
  missing coverage and release-plan gates without claiming they exist.
- Focused governance tests and documentation gates pass.

## Explicit Non-Claims

- Committing these files does not create or verify remote GitHub labels.
- This slice does not implement the missing 95% coverage gate or release-plan
  job; Phase 43 SHIP-08A and Phase 44 retain those owners.
- No issue, PR, push, merge, ruleset, release, or other public mutation is part
  of the local implementation without the applicable owner gate.
- Merging this governance slice does not complete Phase 43, Phase 44, or the
  v1.2 milestone.
