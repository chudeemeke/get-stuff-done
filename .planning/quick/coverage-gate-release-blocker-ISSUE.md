# Enforce 95 Percent Coverage On Every Metric

**Status:** Local issue draft; implementation is blocked on its GSD owner

**Proposed labels:** `type:ci`, `type:release-blocker`, `status:blocked`,
`priority:p1`

**Linked GSD artifact:** Phase 43 SHIP-08A in `.planning/ROADMAP.md` and
`.planning/quick/pr-issue-evidence-workflow-CONTEXT.md`

## Problem

Current coverage commands can report coverage without enforcing at least 95%
independently for statements, branches, functions, and lines across the
canonical fork-owned source scope. A green pull request can therefore omit the
required coverage authority.

## Desired Outcome

Make coverage a blocking, reproducible local and hosted gate that fails when
any one of the four metrics is below 95% and records final-HEAD evidence for the
same declared source scope.

## Scope Boundaries

- Define the canonical fork-owned source scope and enforce all four thresholds.
- Keep test-runner, reporting, and hosted composition within the owning Phase 43
  plans and Fable decisions.
- Do not narrow source scope, add hidden exclusions, average metrics, or use a
  report-only job to obtain a pass.
- Do not claim that this issue is resolved by the existing bounded verifier-only
  coverage seam.
- Do not change release publication or branch-protection settings here.

## Acceptance Criteria

- Statements, branches, functions, and lines each have an enforced threshold of
  at least 95% for the canonical declared scope.
- A fixture or mutation below each individual threshold causes a nonzero result.
- Source discovery and exclusions are explicit, reviewed, and fail on drift.
- Local and hosted commands use the same configuration and runtime authority.
- The expected coverage job runs against the final PR HEAD and publishes an
  inspectable report without exposing machine-specific or account data.
- The actual hosted run ID, final HEAD SHA, scope digest, and four metrics are
  recorded in the issue and durable GSD state.

## Verification Required

Preserve the final owning-plan coverage command and negative-threshold tests,
then verify hosted evidence with:

```bash
gh pr checks <number>
gh run list --branch <branch>
```

Confirm the coverage job is blocking, tied to the final PR HEAD, and fails on a
real below-threshold probe rather than merely printing a warning.

## Explicit Non-Claims

- This draft does not implement or pass the missing coverage gate.
- Existing focused verifier coverage does not prove repository-wide compliance.
- A merged implementation PR does not complete Phase 43 or v1.2 until every
  roadmap, hosted, install, and owner-gated criterion is also complete.
