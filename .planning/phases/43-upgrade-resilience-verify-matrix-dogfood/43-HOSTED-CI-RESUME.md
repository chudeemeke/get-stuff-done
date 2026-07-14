---
status: blocked
blocker: hosted-ci-real-failures-and-fable-replan
next_owner: user-then-fable
created: 2026-07-14
pull_request: 23
last_observed_head: 2c9ba08745cf3bc13cec42b0c05feb2ae5f02233
---

# Phase 43 Hosted CI Resumption

## Current Blocker

GitHub billing recovery was user-confirmed and the bounded hosted cycle ran
against exact PR/local head
`2c9ba08745cf3bc13cec42b0c05feb2ae5f02233`. Every selected job executed real
steps. Three workflows passed and two failed:

| Workflow | Run ID | Jobs | Conclusion |
|----------|--------|------|------------|
| CI | 29367264687 | 9 passed, 9 failed | failure |
| Cousin Install | 29367264675 | 18 passed | success |
| Oversight Probes | 29367264697 | 1 passed | success |
| Compat Matrix | 29367264713 | 1 passed | success |
| Upgrade Verifier | 29367264690 | 1 failed | failure |

The fail-closed collector returned `run_failed` and did not create
`.planning/evidence/hosted/post-11n.json`. The exact run, job, failure, toolchain,
and governance-side-effect observation is tracked at
`.planning/evidence/hosted/first-real-run-failure.json`.

The failure families are:

1. HIGH direct-dependency advisory `GHSA-v75r-vx73-82pj` in
   `@cyclonedx/cyclonedx-npm@4.2.1`, independently blocked by npm audit and OSV.
2. Cross-platform path/canonicalization test assumptions plus one Windows
   PowerShell security-module autoload failure.
3. Linux, macOS, and Windows install performance reds against a baseline that
   still identifies upstream `1.5.0`; all temporary exceptions expired.
4. Three HTTP 500 responses from the external Star History SVG endpoint.
5. Verdaccio `publish-current` rejected the temp-scoped npm client with
   `ENEEDAUTH` because no authenticated publish identity exists.

The cycle also exposed an unanticipated governance side effect. CI's OSV job
has `issues: write` and posted one `github-actions` comment to each existing
issue `#5` through `#11`: `Observed again in` the CI run URL. It created no new
issues. No deletion or edit has been attempted because that would be another
external mutation requiring explicit user approval.

## Historical Billing Blocker

GitHub accepted draft PR #23 and created all expected check runs, but every job
started zero steps. Check-run annotation `86986198397` states:

> The job was not started because your account is locked due to a billing
> issue.

This meant zero hosted evidence existed for that earlier head. Those failed rows were
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

After the reported quota reset at approximately 10:00 BST on 2026-07-15, the
user confirms that Fable quota is restored and the shared Claude sessions are
in a safe window for this project's exact `claude -p --model fable`
invocation.

Then:

1. Verify Claude status and quota without printing secrets or mutating shared
   authentication.
2. Bind the tracked first-real-run failure observation, this resumption record,
   and the standing whole-project review into the subject-bound Fable packet.
3. Require Fable's lead decision on the corrected GSD sequence, remediation
   slices, security priority, performance authority, workflow side effects, and
   the point at which a passed hosted envelope becomes mandatory.
4. Disposition every finding against verified repository facts, executable
   evidence, security/WoW, and locked user decisions. Apply the reviewed graph
   correction before any source edit.
5. Obtain explicit user authorization before another push/workflow cycle and
   before deleting or editing the seven automated issue comments.
6. After corrective work is locally green, publish a new exact head and require
   `post-11n.json` to pass pending and strict verification before Plan 11D.

Passed hosted envelopes remain tracked beneath `.planning/evidence/hosted/`.
The failed observation is not a passed envelope and cannot authorize Plan 11D.
It exists to make the Fable replan evidence-bearing without weakening the
collector's fail-closed contract. Each passed envelope certifies an ancestor
`checkedCommit`; its later evidence commit is not part of the claim, avoiding
self-reference. Evidence/docs-only commits remain valid only while canonical
source, workflow, contract, and policy digests are unchanged. Every authority
event uses a distinct immutable path:
`post-11n.json` authorizes the Fable checkpoint, while `plan11d-entry.json`,
captured after ordinary Plan 11R finalization, authorizes Plan 11D's first
source edit. No existing envelope is ever overwritten.

## Forbidden While Blocked

- Starting or partially implementing Plan 11D.
- Treating local results as hosted results.
- Editing source or workflow files before the Fable-led GSD replan.
- Pushing or rerunning workflows without a new explicit authorization window.
- Deleting or editing the automated issue comments without explicit approval.
- Replacing the gate with self-hosted or alternate CI.
- Merging draft PR #23.

## Additional Finding

Main branch protection still requires the stale context
`Boundary & Override Check`, while the current workflow reports separate
`Boundary Check (informational)` and `Override Staleness Check (blocking)`
contexts. Plan 11R reports this as governance drift; do not mutate branch
protection until a real hosted run proves the replacement contexts.
