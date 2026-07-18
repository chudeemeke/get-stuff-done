---
phase: 43-upgrade-resilience-verify-matrix-dogfood
kind: interim-independent-architecture-review-packet
date: 2026-07-14
subject_commit: f2d50b29ce567145f264d4a7d047184b999a69fc
hosted_commit: 2c9ba08745cf3bc13cec42b0c05feb2ae5f02233
pull_request: 23
reviewers:
  - claude-fable-xhigh
  - claude-opus-xhigh
  - gpt-5.6-sol-xhigh
status: ready-for-resumed-independent-review
---

# Phase 43 Interim Dual-Review Packet

## Review Mandate

Act as an independent lead architect, lead developer, and delivery critic. Review
the same evidence without relying on another reviewer's conclusions. Do not edit
files, run state-changing commands, mutate GitHub, or assume approval for public
actions. Return a decision-quality recommendation that another lead can reconcile
against the repository evidence.

Fable remains the project's standing lead-review authority. Its usage quota is
unavailable until approximately 2026-07-15 10:00 BST. This Opus plus GPT-5.6-Sol
review is an explicitly authorized interim council, not a replacement
representation or a fabricated Fable checkpoint.

## 2026-07-18 Recovery Amendment

The original 2026-07-14 Opus attempt returned a subscription session limit and
did not review this packet. The original GPT-5.6-Sol process was interrupted
before its output could be recovered. Neither attempt produced a review artifact
or changed the repository.

Current read-only checks on 2026-07-18 establish:

- draft PR `#23` remains open at hosted commit `2c9ba08745cf3bc13cec42b0c05feb2ae5f02233`;
- no newer hosted workflow cycle has run;
- the same CI and Upgrade Verifier failures remain authoritative;
- Claude Code reports a valid first-party Max login; and
- the local branch remains at `f2d50b29ce567145f264d4a7d047184b999a69fc`,
  with only this untracked review packet added since the evidence commit.

The quota/auth blocker is therefore historical, not a current reason to omit
Fable. Fable, Opus, and GPT-5.6-Sol must each review this same amended packet
independently. Their outputs are advisory planning evidence only: they cannot
manufacture the formal Fable checkpoint because the required passed hosted
envelope still does not exist.

## Desired End State

Deliver a market-ready GSD overlay on Open GSD that:

- preserves the user's fork identity and intentional value-add;
- stays thin enough to absorb upstream releases without repeated reconstruction;
- remains loosely coupled at component boundaries while tightly integrated as a
  coherent product;
- follows SOLID and hexagonal boundaries, TDD, four-metric 95% coverage, secure
  defaults, deterministic evidence, and reversible upgrade mechanics;
- can be maintained, released, and supported as credible OSS rather than a private
  patch pile;
- makes claims only as strong as machine-checkable local and hosted evidence.

## Current Repository State

- Repository: `chudeemeke/get-stuff-done`.
- Branch: `phase43-upgrade-resilience-20260703`.
- Draft pull request: `#23`.
- Remote PR head and first real hosted run subject:
  `2c9ba08745cf3bc13cec42b0c05feb2ae5f02233`.
- Local head:
  `f2d50b29ce567145f264d4a7d047184b999a69fc`.
- The local head is one unpushed documentation/evidence commit ahead of the PR.
- No further hosted workflow cycle is authorized.
- No push, issue mutation, merge, release, credential change, or live-service
  change is authorized by this review.
- `authkey`, `remotely`, and `conversations` are running in live sessions and are
  outside this review's mutation scope.

## First Real Hosted Evidence

The canonical observation is
`.planning/evidence/hosted/first-real-run-failure.json`. It records all five
expected workflows at the exact PR head with real executed steps.

Passed workflows:

- Cousin Install: run `29367264675`, 18/18 jobs passed.
- Oversight Probes: run `29367264697`, passed.
- Compat Matrix: run `29367264713`, passed.

Failed workflows:

- CI: run `29367264687`, 9/18 jobs failed.
- Upgrade Verifier: run `29367264690`, its one job failed.

The strict collector correctly failed closed with `run_failed` and did not create
`.planning/evidence/hosted/post-11n.json`. There is no passed hosted envelope.

## Failure Families

### 1. Direct dependency security advisory

Both the blocking audit job and OSV scanner reject
`@cyclonedx/cyclonedx-npm@4.2.1` for HIGH advisory
`GHSA-v75r-vx73-82pj`. npm reports the available fix at major version `6.0.0`.
Treat this as a real release blocker requiring compatibility and regression proof,
not an audit suppression exercise.

### 2. Cross-platform path and runner behavior

- Linux: a Windows executable fixture expected backslashes but received a
  mixed-separator path.
- macOS: hosted receipt logic compared `/var` to canonical `/private/var`; the
  Windows fixture also received mixed separators.
- Windows: hosted receipt logic compared an 8.3 temporary path to its canonical
  long path; a DACL test failed because `Microsoft.PowerShell.Security` did not
  autoload `Get-Acl`.
- The workflow selects `bun-version: latest`; hosted used Bun `1.3.14` while the
  current local authority used Bun `1.3.5`.

The decision must distinguish product defects, test-oracle defects, runner setup
defects, and ungoverned toolchain drift.

### 3. Performance authority is stale or invalid

- Linux install: 133 ms baseline, 209 ms current, ratio 1.57; compose 1.10.
- macOS install: 134 ms baseline, 179 ms current, ratio 1.34; compose 0.69.
- Windows install: 10,203 ms baseline, 17,087 ms current, ratio 1.67; compose 1.15.
- The baseline identifies upstream `1.5.0`; the current upstream is `1.6.1`.
- Temporary exceptions expired on 2026-07-10.

Prior Fable direction explicitly forbids another calendar waiver. It requires the
hosted observations to choose empirical rebaselining or a variance-aware policy.
The review must define what evidence can separate regression from hosted-runner
variance and prevent convenient baseline laundering.

### 4. Upgrade verifier lacks publish authentication

The Verdaccio-backed verifier packed successfully, then `npm publish` failed with
`ENEEDAUTH`. Its temporary `.npmrc` contains only the registry URL. Verdaccio 6
requires authenticated publication by default. The correction must use ephemeral,
least-privilege local registry identity, avoid secret leakage, and retain genuine
pack/publish/install/upgrade coverage.

### 5. Documentation link endpoint failed externally

Three README checks against `api.star-history.com` returned HTTP 500. The review
must distinguish a broken project link from transient third-party availability and
recommend a deterministic docs policy without silently ignoring real link rot.

### 6. Unapproved issue-comment side effect

The CI OSV job has `issues: write` and automatically posted the following comment
to each existing issue `#5` through `#11`:

`Observed again in https://github.com/chudeemeke/get-stuff-done/actions/runs/29367264687.`

No new issues were opened. No comment was edited or deleted afterward because that
would be another public mutation. This side effect was not identified to the user
before authorizing the bounded hosted run. The review must propose governance that
separates diagnostic CI from public issue mutation, remains useful for recurring
advisories, and makes authority explicit.

## Existing Fable Direction

The prior whole-project review is recorded at
`.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-FABLE-WHOLE-PROJECT-REVIEW-2026-07-14.md`.
Two accepted directions are decisive:

- F3: obtain hosted CI before Plan 11D and resolve blocking failures through GSD
  before the coverage wave.
- F8: do not add another calendar-expiring performance exception; use the next
  hosted run to choose empirical rebaselining or a variance-aware policy.

The first standing checkpoint is explicitly after the first real hosted run and
before Plan 11D, with runner failures and performance observations as inputs.

## GSD Sequencing Conflict

Plan `43-11R-PLAN.md` was written around a passed hosted envelope followed by a
validated Fable checkpoint. The real run failed, so its required envelope cannot
exist. The plan now records failure evidence and stops for corrective replanning.

The architecture problem is not whether CI must become green. It is how corrective
work enters the GSD graph without:

- pretending that Plan 11R completed;
- weakening the exact-head hosted-evidence contract;
- editing source under a plan whose preconditions failed;
- burying six independent failure families in one oversized plan;
- rerunning hosted CI before local deterministic authority is restored;
- displacing already-reviewed downstream ownership without cause.

## First-Principles Invariants

1. A failed hosted run is evidence, but never a passed envelope.
2. Security, cross-platform correctness, performance authority, upgrade realism,
   docs availability, and public automation governance are different concerns.
3. Every corrective source edit must have explicit GSD ownership, RED-GREEN tests,
   bounded write scope, and a locally executable verification path.
4. Toolchain versions and path identity must be governed as inputs, not accidental
   properties of one developer machine or one hosted image.
5. A performance baseline is authority only if its provenance, workload, sample
   method, variance, and accepted comparison are reproducible.
6. Diagnostic CI should be read-only by default. Public mutations require an
   explicit, separately authorized workflow or human gate.
7. No compatibility fix should erase upstream behavior or fork identity merely to
   satisfy a test oracle.
8. Hosted reruns are scarce, public, and consequential. Local gates should reject
   known defects before another cycle is requested.
9. Fable's unavailable quota does not justify forging its receipt or claiming its
   standing checkpoint passed.
10. Review advice is not evidence: recommendations must identify how they become
    testable GSD work and what remains a user-owned decision.

## Candidate Graph Shapes To Critique

### Shape A: Corrective plans inserted before Plan 11D

Close Plan 11R only as a failure-observation checkpoint, insert separately owned
corrective plans, run local authority, request one hosted cycle, collect a passed
exact-head envelope, then run the genuine Fable checkpoint when available.

### Shape B: Expand Plan 11R to own corrections

Keep the failure, implementation, rerun, and review in Plan 11R. This is simpler
administratively but risks oversized scope, retrospective preconditions, and weak
ownership boundaries.

### Shape C: Pull existing downstream plans forward

Map failures into already-planned source, performance, coverage, or release plans
and reorder them ahead of the gate. This reduces plan count but may contaminate
their reviewed intent and create circular evidence dependencies.

Do not select a shape merely for fewer files. Derive the minimum coherent graph
from the invariants and identify any better shape.

## Required Reviewer Output

Return these sections:

1. `VERDICT`: proceed, proceed-with-corrections, or stop-and-redesign.
2. `CRITICAL FINDINGS`: ordered by severity; cite repository paths or exact
   evidence where applicable.
3. `CORRECTED GSD GRAPH`: plan boundaries, dependencies, local gates, external
   gate, Fable gate, and where Plan 11R truthfully ends.
4. `REMEDIATION DIRECTION`: security dependency, platform/path behavior,
   deterministic toolchain, performance policy, Verdaccio authentication, docs
   link policy, and issue-mutation governance.
5. `USER CONSULTATION BOUNDARY`: actions the project lead may take autonomously,
   actions requiring prior approval, and findings requiring notification after
   action.
6. `REJECTED ALTERNATIVES`: credible approaches considered and why they lose.
7. `CONFIDENCE AND OPEN EVIDENCE`: distinguish high-confidence repository facts
   from assumptions that need a spike, test, hosted run, upstream research, or
   user decision.

Be direct. Identify contradictions and hidden debt. Prefer the smallest design
that preserves the invariants, not the least work.
