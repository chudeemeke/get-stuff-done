---
status: blocked
blocker: hosted-ci-billing-lock
next_owner: user
created: 2026-07-14
pull_request: 23
last_observed_head: 64f137a110e985c86b08acb3140bc8b982d34843
---

# Phase 43 Hosted CI Resumption

## Blocker

GitHub accepted draft PR #23 and created all expected check runs, but every job
started zero steps. Check-run annotation `86986198397` states:

> The job was not started because your account is locked due to a billing
> issue.

This means zero hosted evidence exists for this head. The failed rows are
account-policy records, not product, runner, performance, or compatibility
verdicts.

Affected workflow runs:

| Workflow | Run ID | Conclusion |
|----------|--------|------------|
| CI | 29301557411 | failure, zero steps |
| Cousin Install | 29301557419 | failure, zero steps |
| Oversight Probes | 29301557449 | failure, zero steps |
| Compat Matrix | 29301557470 | failure, zero steps |
| Upgrade Verifier | 29301557484 | failure, zero steps |

## Local Evidence Only

These results remain useful local diagnostics but do not satisfy the hosted
gate:

- Bun functional authority: 1,322/1,322 across 54 files, zero `.test.cjs`
  headers.
- Native phase/roadmap contracts: 73/73.
- Repository compatibility: 154/154.
- N=3 Open GSD compatibility: 945/945.

## Resumption Trigger

At Plan 11R's blocking human-action checkpoint, the user confirms the GitHub
account billing lock is cleared and the shared Claude sessions are in a safe
window for this project's Fable invocation.

Then:

1. Verify status-only GitHub and Claude authentication without printing secrets.
2. Verify PR #23's head equals the committed Plan 11N/local `HEAD`, then push
   that head through the ordinary pre-push hook.
3. Rerun each of the five workflows once; do not reuse locked-window rows as
   evidence.
4. Run `bun run phase43:hosted-verdict -- collect --pr 23 --receipt .planning/evidence/hosted/post-11n.json`.
5. Require a new envelope for the exact checked head with `verdict: passed`,
   `hostedEvidenceExists: true`, all five workflows, every required job, and
   at least one executed step per job. Run `verify-pending`, then let normal GSD
   task completion commit the envelope at its immutable path.
6. Run strict offline `verify-receipt` against the tracked envelope, proving its
   `checkedCommit` is an ancestor and its source, workflow, contract, and policy
   digests are unchanged. Run the standing post-hosted-CI Fable lead checkpoint
   with that repository-backed evidence and disposition every finding in the
   canonical checkpoint record.
7. Commit the review, disposition, planning, and state changes, then let the
   standard GSD executor create and commit the Plan 11R summary and metadata.
   The summary records run IDs, attempts, head SHA, timestamp, Fable decision
   and review digest, planning corrections, and conclusion.
8. In Plan 11D Task 11D-00, require a clean tracked worktree, push
   the fully finalized Plan 11R head, rerun all five workflows once, and require
   a second passed envelope at `.planning/evidence/hosted/plan11d-entry.json`
   for that exact PR/local checked head. Verify it pending and commit it through
   normal task completion.
9. Begin the first Plan 11D source edit only after strict verification of the
   tracked entry envelope succeeds. The envelope is durable Plan 11D entry
   authority; later source commits intentionally invalidate its continuity and
   do not claim to remain certified by it.

Hosted envelopes are tracked beneath `.planning/evidence/hosted/`. Each
certifies an ancestor `checkedCommit`; its later evidence commit is not part of
the claim, avoiding self-reference. Evidence/docs-only commits remain valid
only while canonical source, workflow, contract, and policy digests are
unchanged. Every authority event uses a distinct immutable path:
`post-11n.json` authorizes the Fable checkpoint, while `plan11d-entry.json`,
captured after ordinary Plan 11R finalization, authorizes Plan 11D's first
source edit. No existing envelope is ever overwritten.

## Forbidden While Locked

- Starting or partially implementing Plan 11D.
- Treating local results as hosted results.
- Repeatedly rerunning workflows while the billing lock remains.
- Replacing the gate with self-hosted or alternate CI.
- Merging draft PR #23.

## Additional Finding

Main branch protection still requires the stale context
`Boundary & Override Check`, while the current workflow reports separate
`Boundary Check (informational)` and `Override Staleness Check (blocking)`
contexts. Plan 11R reports this as governance drift; do not mutate branch
protection until a real hosted run proves the replacement contexts.
