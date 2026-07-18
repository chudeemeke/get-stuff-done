---
status: local-corrective-execution
blocker: corrective-chain-before-next-hosted-window
next_owner: get-stuff-done
created: 2026-07-14
updated: 2026-07-19
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
issue `#5` through `#11`: `Observed again in` the CI run URL. Read-only history
verification on 2026-07-18 found 38 such comments on each issue, 266 total. The
latest run added seven; repeated append-on-every-run behavior is the larger
design defect. The PR test job has a second `issues: write` flake-upsert surface.
No comment deletion or edit has been attempted because that is a separate public
mutation requiring explicit user approval.

The review also proved the current envelope overstates executed-subject
authority. GitHub associated the run with PR head `2c9ba087...`, while job
`87201829510` explicitly checked out synthetic merge
`e2139a78cdba1d5bf5130431d2bd8e8e6f7bdd52`. The collector validates run-head
metadata but no per-job checked-out commit. In addition, `compat-matrix.yml`
forces `exit 0` after internal blocking drift. These are corrective
preconditions, not reasons to weaken the collector.

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

## Local Corrective Sequence

Fable, Opus, and GPT-5.6-Sol independently reviewed the tracked failure packet
at `xhigh` on 2026-07-18. All returned `proceed-with-corrections`. Their outputs,
lead synthesis, and primary-evidence corrections are persisted beside the Phase
43 plans. The formal passed-envelope Fable checkpoint remains unpassed.

Execute locally through GSD:

1. Plan 11AC repairs executed-subject and toolchain authority contracts.
2. Plans 11AD-11AG independently repair CycloneDX, platform behavior/oracles,
   Verdaccio authentication, and paired performance measurement.
3. Plan 11AH wires exact subject/pins, makes PR CI read-only, separates issue
   mutation, makes active compatibility blocking, and separates decorative
   third-party availability from blocking docs correctness.
4. Plan 11AI runs the full local corrective gate and commits a local-only
   pre-retry receipt with four-metric coverage.

No public authorization is needed for those local, reversible plan slices.

## External Resumption Trigger

Plan 11AJ presents the exact corrective head and local receipt, then obtains a
new explicit user authorization for one PR-head update and its five governed
workflow runs. A passed `post-11n.json` must prove each job's exact execution
subject. Performance above the unchanged 1.25 budget, any workflow failure,
head drift, or public mutation stops the cycle without rerun or policy change.

After the passed envelope is committed, Plan 11AJ separately obtains a safe
Fable window and runs the formal Plan 11P checkpoint. Only an approving valid
receipt permits the truthful 11R supersession summary and Plan 11D entry.

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
- Editing source or workflow files outside Plans 11AC-11AI before their local gates.
- Pushing or rerunning workflows without a new explicit authorization window.
- Creating, deleting, or editing issue state/comments without explicit approval.
- Changing the 1.10/1.25 performance budget or accepting a regression without explicit approval.
- Replacing the gate with self-hosted or alternate CI.
- Merging draft PR #23.

## Additional Finding

Main branch protection still requires the stale context
`Boundary & Override Check`, while the current workflow reports separate
`Boundary Check (informational)` and `Override Staleness Check (blocking)`
contexts. Plan 11R reports this as governance drift; do not mutate branch
protection until a real hosted run proves the replacement contexts.
