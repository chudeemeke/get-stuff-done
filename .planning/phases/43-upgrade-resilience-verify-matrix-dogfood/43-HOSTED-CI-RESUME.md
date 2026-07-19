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

## Plan 11AC Local WIP Checkpoint (2026-07-19)

Plan 11AC has an uncommitted local implementation at committed head
`9402163951e76bc7c75af8d500da1749af93bdd4`. No task is marked done and no
summary, commit, push, hosted run, or public mutation has been made for this
slice.

Current local changes:

- `.bun-version`
- `config/phase43-hosted-ci-contract.json`
- `config/phase43-toolchain-authority.json`
- `scripts/verify-hosted-ci.js`
- `scripts/verify-toolchain-authority.js`
- `tests/verify-hosted-ci.test.js`
- `tests/toolchain-authority.test.js`

The hosted collector binds each required job to the selected workflow run,
selected run attempt, exact real job URL, expected PR-head subject, successful
checkout/verification steps, stable workflow name/path identity, and
new-run-first freshness. Jobs are fetched from the attempt-specific GitHub API
endpoint and each subject record repeats the selected attempt. Static
topology now requires checkout as the first YAML step, exactly one governed
`actions/checkout`, a closed exact-ref checkout record, an adjacent closed
verification record in the default workspace, and no workflow/job/step shell
or runtime injection environment, `PATH`, `GIT_*`, or inherited
working-directory override. Matrix schemas, scalar evidence, and aggregate
Cartesian expansion fail closed before allocation.

The toolchain checker defines exact Bun `1.3.5`, exact action SHAs, the
Verdaccio container digest, bounded Node 20/22 compatibility, one-to-one
job/runtime subjects, and unconditional blocking setup for both Node and Bun in
every shell/runtime-subject job. Setup action inputs are closed to
`node-version` and `bun-version-file`; mirror/download source overrides fail
closed. Shared bounded fatal-UTF-8 parsers govern the Bun version, manifest,
and workflow YAML. Hosted and toolchain manifests must name exactly the same
workflow set. Local actions, duplicate/unsupported matrices, unbounded
evidence, ambiguous runtime rows, and containment escapes fail closed.

Focused authority/config tests pass 119/119 with 454 expectations. The latest
broad run executed 1,459 tests: 1,458 passed and 1 failed. A focused 40-test
rerun confirms the Windows PowerShell security-module failure occurs before
product execution. Bounded diagnosis found name-based import resolves an
incompatible PowerShell 7 WindowsApps module, while importing Windows
PowerShell's exact `$PSHOME` manifest succeeds. The correction remains owned by
dependency-blocked Plan 11AE. The earlier bundled statusline malformed-input
status-9 result
did not reproduce in 5/5 direct source/bundle probes, an isolated bundled test,
or a full 58/58 hook-suite rerun. It is retained only as a load-sensitive
observation under Plan 11I's bounded-subprocess contract, not as a Plan 11AC or
11AE product defect. Static verification reports 77 expected pre-11AH
diagnostics: 50 action pins, 14 non-authoritative Bun setups, 1 missing Bun
setup, 1 container pin, and 11 missing Node setups, with no runtime-matrix
authority diagnostics. Node syntax, `git diff --check`, and ESLint pass with
zero errors. Live tag resolution matches all ten recorded GitHub Action
commits; Docker Registry v2 resolves `verdaccio/verdaccio:6` to the recorded
OCI index digest; and local Bun matches `.bun-version` at `1.3.5`.

Bun coverage output became internally inconsistent across equivalent focused
runs and does not expose statements or branches, so it remains non-authoritative
for this claim. A narrow Node-native seam now reuses the verifier suites through
`node:test`, exact `expect@30.4.1`, and c8 `9.1.0`. The 107/107 Node lane proves
hosted coverage at 98.76/96.81/98.21/98.76 and toolchain coverage at
97.04/95.33/100/97.04 for statements/branches/functions/lines. Full Jest and
c8 11 were removed after the proof showed they were unnecessary and
incompatible with the deliberate minimatch 3 override. The compatible
brace-expansion 1.1.13 override clears the advisory on the new coverage path.
`bun audit` remains red on eight pre-existing advisories, including the high
CycloneDX CLI advisory owned by Plan 11AD. Generated coverage output was
removed after verification. A persistent read-only GPT-5.6-Sol `xhigh` review
completed after 1,325 seconds with `proceed-with-corrections`, no P0, seven P1,
and two P2 findings. Its record is
`43-SOL-PLAN11AC-ADVISORY-REVIEW-2026-07-19.md`.
Sol remains advisory and cannot approve architecture or satisfy Fable's formal
checkpoint. The Opus attempt failed before execution because Claude OAuth was
expired, and Fable quota is unavailable until about 10:00.

Directly composing the complete toolchain evaluator into hosted topology was
tested and removed because it exposed an unresolved semantic collision. The
mandatory Bash subject-control step makes action-only jobs appear to be
Node/Bun runtime jobs under the current conservative `any run step` classifier.
Forcing Node and Bun setup into those jobs would add dependencies and a false
runtime claim. No policy was silently chosen.

Fable adjudicated the eight architecture decisions on 2026-07-19 with
`proceed-with-corrections`:

1. Distinguish the exact contract-governed subject control step from payload
   runtime without reopening executable-name guessing.
2. Reconcile exact-pinned `harden-runner`, adjacent checkout verification, and
   the secret scan's required `fetch-depth: 0` through a closed security
   prelude and job-specific checkout policy.
3. Limit the product claim to exact pre-payload event-subject proof, a
   byte-pinned governed step program, no subsequent checkout, and a closed
   injection surface. Whole-job worktree immutability is not claimed.
4. Define trusted hosted runtime receipts, runner identity, closed job
   exemptions, and ownership across Plans 11AC/11AH/11AJ.
5. Decide whether to accept the implemented narrow `node:test`/expect/c8
   four-metric seam in 11AC and how Plans 11D/11W consume its evidence without
   changing their canonical runner migration.
6. Decide whether the 982-line toolchain verifier and 1,622-line hosted
   verifier require a hexagonal/SRP module split now, or a bounded later
   extraction, without cosmetic slicing or an unbounded refactor.
7. Choose one Bun-first package audit authority or an explicitly parity-proven
   dual-lock contract before Plan 11AD changes dependencies or lockfiles.
8. Insert and scope the stable 1.7.0 bump plus override reconciliation before
   the next hosted cycle without contaminating the current 11AC review subject.

The cold-readable review input is
`43-FABLE-PLAN11AC-ADJUDICATION-PACKET-2026-07-19.md`; the exact captured
response and authoritative adjudication are
`43-FABLE-PLAN11AC-WHOLE-PROJECT-REVIEW-2026-07-19.md` and
`43-FABLE-PLAN11AC-AUTHORITATIVE-ADJUDICATION-2026-07-19.md`. The current WIP
remains uncommitted, and the distinct formal post-hosted Fable checkpoint is
still required by Plan 11AJ.

## Local GSD State Integrity Follow-up (2026-07-19)

GSD resume routing incorrectly selected Phase 40.5 because three historical
summary records were absent even though Plans 02 and 03 had committed evidence
and Plan 05 had been superseded by verified Phase 40.6. Retrospective summaries
now preserve those exact distinctions in local commit `94021639`:

- Plan 02 closes against implementation commit `db8de746` and its drift log.
- Plan 03 closes against implementation commit `0abd5b55` and its collision log.
- Plan 05 closes as superseded, explicitly without claiming that its legacy
  issue/PR filing or historical synthesis commands executed.

`query init.progress` now reports Phase 40.5 as 6/6 complete and correctly keeps
Phase 43 current. The root-local memory-nexus health handoff was also corrected
and linted: remaining W002 work is active backlog Phase 999.8 under locked D-22,
not removed Plan 11O and not a Phase 43/44 release blocker. The paired
conversations control-plane item remains non-blocking and was not edited because
conversations is running in a live session.

## Local Environment Attribution Correction -- 2026-07-19

A compatibility preflight found the user npm registry pointing to the stopped
local endpoint at `localhost:4873`. The operator later confirmed manually
running `npm set registry http://localhost:4873/` from WSL, so this was not
evidence that the Verdaccio spike changed external config. Native Windows and
WSL npm currently resolve the same user-level config file, report the npmjs
registry, and report no local endpoint reference. Existing npmjs
authentication was neither printed nor replaced. Plan 11AF retains pre/post
byte-invariance evidence for external npm configuration as defense in depth.

The same preflight found the two new `PLAN11AC` review artifacts inflating
Phase 43 to 51 plans. The shared Plan 11L override now requires a
delimiter-bounded legacy `PLAN` token. Roadmap 19/19, repository 154/154, and
N=3 945/945 gates pass; composed progress again reports 17/49. No public action
or live first-party service mutation occurred.

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

## Public Repository Audit (2026-07-19)

Read-only GitHub and unauthenticated HTTP checks confirmed
`chudeemeke/get-stuff-done` is already public, independent rather than a fork,
and MIT licensed. No visibility mutation was issued. GitHub reports secret
scanning and push protection enabled with zero open secret-scanning or
Dependabot alerts. A Gitleaks scan across all published `origin/*` history
scanned 2,660 commits and returned two occurrences of one generic-key rule;
redacted context proved both occurrences are the same test-fixture filename,
not credential material. Locally fetched upstream-only refs produced additional
test-fixture findings but are not published by this repository.

All published workflow runner selectors resolve to standard GitHub-hosted
Ubuntu, macOS, or Windows runners. Repository cache usage was approximately
1.35 GB and retained artifacts approximately 0.92 MB at audit time. Account-level
billing attribution remains unavailable because the current GitHub token lacks
the `user` scope; no authentication scope or credential was changed.

Public-history hygiene remains a separate governance decision before the next
push. The published branch contains historical absolute user paths and bounded
account/authentication diagnostics in planning evidence. They are not secrets,
and rewriting already-public history would not undo prior exposure. Plan 11AH
should define the forward-looking tracked-artifact contract; any branch
protection or other GitHub-setting mutation remains user-gated in Plan 11AJ.
