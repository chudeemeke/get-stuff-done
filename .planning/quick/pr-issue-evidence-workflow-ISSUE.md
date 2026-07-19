# Adopt PR And Issue Evidence Governance

**Status:** Local issue draft; public issue and PR remain owner-gated

**Proposed labels:** `type:workflow`, `type:docs`, `status:owner-gated`,
`priority:p1`

**Linked GSD artifact:**
`.planning/quick/pr-issue-evidence-workflow-CONTEXT.md`

## Problem

The repository does not yet own a durable contract connecting meaningful work
to issues, GSD records, focused branches, pull requests, exact final-HEAD hosted
evidence, merge, and post-merge state updates. Existing GitHub issue and pull
request surfaces do not require the adopted evidence fields, and the expected
hosted workflow inventory is not machine-readable.

## Desired Outcome

Adopt one coherent repository workflow in which issues define deliverables and
decisions, pull requests act as evidence gates, the expected hosted verifier is
explicit and testable, and future sessions recover completion truth from GSD
artifacts rather than chat.

## Scope Boundaries

- Add contribution guidance, issue forms, a pull request template, the approved
  label catalog, hosted evidence contract, focused governance tests, and durable
  GSD context.
- Apply the cataloged labels only during an explicitly approved public-mutation
  window and before relying on issue-form default labels.
- Do not implement the missing coverage or release-plan gates in this slice.
- Do not change branch protection; the stale required context has a separate
  issue-ready record.
- Do not rewrite published history, configure signing keys, merge another pull
  request, publish a package, or complete the v1.2 goal.

## Acceptance Criteria

- Every issue form requires problem, outcome, boundaries, acceptance criteria,
  verification, explicit non-claims, and a linked GSD artifact.
- The pull request template requires summary, scope, verification, non-claims,
  risks/blockers, linked issues/GSD artifacts, and hosted evidence.
- The label catalog contains the approved taxonomy with unique names, valid
  colors, and non-empty descriptions; issue-form defaults reference that
  catalog.
- `config/hosted-evidence-contract.json` exactly enumerates all pull-request
  workflows and their expanded jobs and records missing capabilities honestly.
- Expected hosted checks run against the final PR HEAD; every failure and skip
  is dispositioned, and any new commit invalidates prior evidence.
- Remote labels are verified after application, and durable GSD state is
  updated after merge.

## Verification Required

Run and preserve:

```bash
bun test tests/governance-evidence.test.js
bun run lint:docs
bun run lint
git diff --check
gh label list
gh pr checks <number>
gh run list --branch <branch>
```

Record the final PR HEAD SHA, expected check list, run IDs, intentional skips,
failure dispositions, and the post-merge durable-state update. Confirm that the
hosted workflow inventory still equals
`config/hosted-evidence-contract.json` on the final HEAD.

## Explicit Non-Claims

- Creating this issue does not verify, push, merge, or release the local branch.
- A green badge is not sufficient if an expected job is missing or stale.
- The governance contract does not itself implement 95%-per-metric coverage or
  no-publish release-plan verification.
- Merging the governance PR does not correct live branch protection, sanitize
  historical public artifacts, or complete Phase 43, Phase 44, or v1.2.

## Risks And Blockers

- The remote currently lacks the cataloged labels, so labels must be applied and
  verified before issue forms can depend on their defaults.
- Git commit signing is not configured; no verified-signature claim is made.
- Public issue creation, push, PR creation, hosted runs, label application,
  branch settings, and merge require the applicable owner gate.
