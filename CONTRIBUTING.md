# Contributing

This project uses issues, GSD artifacts, and pull requests as one evidence
chain:

`issue -> GSD record -> branch -> PR -> final-HEAD hosted evidence -> merge -> durable state`

## Pull Request Workflow

For every non-trivial change:

1. Create a focused branch from `main`.
2. Commit in chronological, factual slices. Do not mix unrelated cleanup.
3. Open a draft pull request before merge and link the owning issue and GSD
   artifact.
4. Complete every section of the pull request template, including explicit
   non-claims and known risks.
5. Verify the expected hosted workflows and jobs against the final PR HEAD.
6. Re-run and re-record hosted evidence after every new commit.
7. Squash merge unless the PR records a concrete reason to preserve commits.
8. After merge, update durable GSD state and any release or maintenance ledger.

The PR is an evidence gate, not merely a review container. A green badge is
insufficient when an expected job is missing, skipped incorrectly, warning-only,
stale, or attached to an older commit.

Use both views when checking hosted evidence:

```bash
gh pr checks <number>
gh run list --branch <branch>
```

Record the final PR HEAD SHA, expected check list, run IDs, intentional skips,
and failure dispositions in the PR or linked GSD summary. If repository
rulesets cannot enforce the contract, watch the checks manually and preserve
the same evidence before merge.

The machine-readable expected-check and capability record is
[`config/hosted-evidence-contract.json`](config/hosted-evidence-contract.json).
It is fail-closed: a capability marked `missing` is a release blocker, not an
implicit exception. The initial contract explicitly records that 95% per-metric
coverage enforcement is owned by Phase 43 SHIP-08A, release-plan verification
is owned by Phase 44, and fuzzing is currently not applicable until the project
owns a suitable untrusted-input or protocol target.

## Issue Workflow

Use one issue per meaningful deliverable or owner-gated decision, including
bugs, phase tasks, release blockers, security or CI defects, adoption feedback,
follow-up work, and cross-project handoffs.

Every issue records:

- Problem
- Desired outcome
- Scope boundaries
- Acceptance criteria
- Verification required
- Explicit non-claims
- Linked GSD artifact

Close an issue only through a merged PR or with a written evidence note that
explains why no code or documentation change was required. The standardized
label catalog is [`config/github-labels.json`](config/github-labels.json).
Specialized telemetry labels may coexist with this governance taxonomy.

## Completion Semantics

A merged PR completes its coherent slice. It does not complete the project goal
unless the corresponding roadmap criteria, verification evidence,
release/install state, and owner-gated actions are also complete.

After merge, update durable GSD state so a future session can recover the truth
from disk without relying on chat history.
