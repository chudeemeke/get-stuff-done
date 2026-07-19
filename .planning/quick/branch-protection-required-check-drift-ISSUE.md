# Reconcile Stale Main Branch Required Check

**Status:** Local issue draft; owner-gated GitHub settings mutation

**Proposed labels:** `type:ci`, `type:release-blocker`,
`status:misconfigured`, `status:owner-gated`, `priority:p1`

**Linked GSD artifact:**
`.planning/quick/pr-issue-evidence-workflow-CONTEXT.md`; Phase 43 in
`.planning/ROADMAP.md`

## Problem

A read-only GitHub API query on 2026-07-19 showed strict protection for `main`
requiring these contexts:

- `Workflow Lint`
- `Lint`
- `Source Parity Check`
- `Boundary & Override Check`
- `Secret Scan`

The current CI workflow no longer emits `Boundary & Override Check`. It emits
`Boundary Check (informational)` and `Override Staleness Check (blocking)` as
separate contexts. The stale required context can block a healthy pull request,
while the current blocking override check is absent from the protection rule.

## Desired Outcome

Make the live `main` protection rule match the minimum blocking context contract
in `config/hosted-evidence-contract.json`, with the informational boundary report
remaining observable but not required.

## Scope Boundaries

- Change only the required-status-check setting after explicit owner approval.
- Do not change workflow behavior, merge pull request 23, publish a release, or
  alter repository visibility in this issue.
- Do not weaken strict branch freshness or required conversation resolution.
- Do not rewrite published history.

## Acceptance Criteria

- `Boundary & Override Check` is absent from live required contexts.
- `Override Staleness Check (blocking)` is present in live required contexts.
- All other minimum contexts in the repository contract remain required.
- Strict branch freshness and required conversation resolution remain enabled.
- The final pull request HEAD has every expected workflow and job dispositioned.
- The GitHub API result, final HEAD SHA, hosted run IDs, and setting-change time
  are recorded in the issue and durable GSD state.

## Verification Required

Run and preserve the relevant output from:

```bash
gh api repos/chudeemeke/get-stuff-done/branches/main/protection
gh pr checks <number>
gh run list --branch <branch>
```

Confirm the expected checks ran on the final PR HEAD, skipped jobs were
intentional, and no new commit invalidated the recorded evidence. Close through
a merged PR or with a written evidence note if the settings-only correction
requires no code or documentation change.

## Explicit Non-Claims

- This draft does not create a GitHub issue or change branch protection.
- A green pull request badge alone does not satisfy this issue.
- Correcting the stale context does not implement the missing coverage or
  release-plan gates.
- Closing this issue does not complete Phase 43, Phase 44, or the v1.2 goal.

## Current Evidence

The 2026-07-19 read-only query reported `strict: true`, required conversation
resolution enabled, and the five contexts listed under Problem. No GitHub
setting was changed while gathering that evidence.
