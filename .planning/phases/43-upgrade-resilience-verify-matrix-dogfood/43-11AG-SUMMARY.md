---
phase: 43
plan: "11AG"
wave: 19
status: complete
date: 2026-07-20
requirements: ["UPGRADE-08", "SHIP-08"]
---

# Phase 43 Plan 11AG Summary - Paired Performance Authority

## Outcome

Replaced stale cross-run performance enforcement with a closed paired same-run
evidence contract. Reference and candidate now execute under one observed and
expected runner/toolchain identity, with equal warmups, deterministic AB/BA
ordering, at least ten measured pairs, raw positive integer nanosecond samples,
and pre/post identity receipts for every sample.

Blocking status preserves the existing strict budgets without owner-bypass
paths: warn only when the exact candidate total exceeds 1.10 times the exact
reference total, and fail only when it exceeds 1.25 times the reference total.
BigInt cross-multiplication owns those decisions. Floating-point means, ratios,
and dispersion statistics are recomputed diagnostic caches only.

## Architecture

- `scripts/lib/paired-perf.js` is the pure domain boundary. It owns canonical
  hashing, schedule derivation, receipt validation, exact adjudication, and
  deterministic summary recomputation behind one injected benchmark executor.
- `scripts/bench.js` owns Git, filesystem, sandbox, process, Hyperfine, and JSON
  adapters. Each sample receives a fresh tracked sandbox; compose preparation
  occurs outside timing; Hyperfine receives exactly `--warmup 0 --runs 1`.
- `scripts/check-perf.js --comparison` is the sole blocking paired authority.
  Mixed legacy inputs, caller-supplied thresholds, and suppression fields are
  rejected. Historical baseline/current measurement remains diagnostic and
  cannot fail a PR for a measured ratio.
- `config/perf-comparison.schema.json` is closed and versioned. Structural and
  semantic validation run at capture and adjudication boundaries.
- Shared harness, workload, scheduler, command-template, and policy digests are
  identical across subjects. Package, lock, and upstream-authority digests are
  recorded per subject because legitimate candidate changes may alter them.

## TDD And Review Disposition

The first RED/GREEN sequence established the schema, exact scheduler, raw
receipt model, pure capture/adjudication domain, adapter boundary, and blocking
CLI. GPT-5.6-Sol then identified six correctness and evidence gaps. Corrective
RED tests reproduced float-boundary ambiguity, placeholder runner identity,
historical-mode blocking, warmup-schedule coupling, insufficient adapter
negatives, and missing dispersion evidence before the implementation changed.

The final implementation revision is
`35cbe0883a65409b13f9b7cc6347c793df2a2f15`. Later commits through the Fable
packet changed planning evidence only; no reviewed product byte changed.

Fable independently inspected the code, reran the focused tests, focused
coverage, and full suite, and returned:

- Plan 11AG closure: `ACCEPT_WITH_FOLLOW_UPS`
- Plan 11AH architecture: `APPROVE_PLAN_WITH_FOLLOW_UPS`

The authoritative report is
`43-FABLE-PLAN11AG-11AH-AUTHORITATIVE-REVIEW-2026-07-20.md`, preserved with
SHA-256 `31bfb86617ad7a1140db07060a9600269f5c2a83a5b84c57509c19c600821522`.

Fable confirmed every 11AG acceptance property and found no closure blocker.
Its binding later-plan findings were dispositioned into Plans 11AH, 11AI, and
11AJ at `ee3e82bd`.

## Validation Evidence

- Focused schema/domain/adapter/checker suite: 39/39 tests, 454 assertions.
- Focused pure-domain c8 gate: 100% statements, 98.18% branches, 100%
  functions, and 100% lines.
- Full Bun suite: 1,581/1,581 tests, 4,797 assertions, 59 files.
- Repository compatibility: 154/154 tests across 34 suites.
- Distribution: 740 files composed, 124 branding rules applied, hooks and SBOM
  finalization passed.
- Focused changed-file lint: zero errors; 12 pre-existing benchmark warnings.
- Repository ESLint: zero errors and 220 existing warnings.
- Documentation lint: zero errors.
- Dependency policy: seven findings, zero blocking, zero suppressed.
- Gitleaks range `c4967c6b..35cbe088`: no leaks.
- `git diff --check`: passed.

Fable independently reproduced the 39 focused tests, the exact four-metric
coverage result, and the 1,581-test full-suite result. Its test runs left only
regeneratable coverage output, which was removed after the report was
hash-preserved.

## Exact Decision Semantics

- Exact 1.10 is pass; any exact excess is warn.
- Exact 1.25 is warn; any exact excess is fail.
- An exact fail remains fail even if the rounded diagnostic cache displays
  `1.25`.
- Any failed preparation, benchmark, identity, control, subject, sequence,
  receipt, summary, or verdict check aborts the whole artifact.
- Calendar exceptions, accepted regressions, stale baselines, and threshold
  overrides cannot enter the blocking decision path.

## Follow-Up Ownership

- Plan 11AH limits blocking paired authority to same-repository PR heads. Fork
  PRs receive explicit no-authority because shared-runner candidate code can
  bias later reference measurements without changing a digest.
- Plan 11AH states that PR-side workflow definitions and check-name identity
  are claims, not authority; Plan 11AJ retains owner-gated platform ruleset and
  collector enforcement.
- Plan 11AH maps `runnerImage` to the observed OS fingerprint while Tier B owns
  the nullable actual hosted image name/version.
- Plan 11AH verifies `package.json`, `bun.lock`, and
  `.planning/upstream-authority.json` in all four checkouts before capture.
- Plan 11AH removes the unused floating-point `statusForRatio` public export so
  exact arithmetic remains the only public blocking classifier.
- Plan 11AI must execute one real local Hyperfine 1.20.0 adapter-operability
  comparison before any Plan 11AJ public authorization.
- Exact totals in warn/fail presentation remain optional polish for the next
  checker presentation change; they are not required for authority.

## GSD Closeout

- Both tasks and all must-have truths have direct code, test, coverage, and
  authoritative-review evidence.
- Plan 11AG is the twenty-second of fifty Phase 43 plans with a summary.
- Portfolio progress becomes 44/72 plans (61%).
- Plan 11AH is the next autonomous Wave 20 unit and has Fable-approved
  architecture with binding amendments already recorded.
- Plan 11R remains blocked because no passed exact-subject hosted envelope or
  formal post-hosted Fable checkpoint exists.

## Boundaries

This closeout proves the paired evidence model, exact adjudication, adapter
contract, and fixture-backed execution behavior. It does not claim a real
timing ratio, real Hyperfine operability, cross-platform execution, hosted
artifact provenance, Tier A identity, an accepted regression, an SLO change,
release readiness, or Phase 43 completion.

No push, PR, hosted run, issue/comment mutation, merge, release, repository
visibility change, branch-protection change, credential change, package
publication, or live `authkey`, `remotely`, or `conversations` state changed.

## Task Commits

1. **RED contract and coverage:** `7075b039`, `992b6e55`, `cfd1a2b0`,
   `e5fabaf9`, `0998d9c3`, `59b93b93`, `eaf40011`
2. **GREEN schema/domain/adapters:** `648f8b64`, `fe1839e0`, `97362f1f`,
   `b99be79b`, `95ad0e7e`, `ab462fd6`, `6452ca12`, `3349eeb1`, `5d946d67`,
   `970d11f1`
3. **Review correction and evidence:** `63d21ca9`, `d0fc8eb5`, `a64464ef`,
   `35cbe088`, `734f28c5`, `ee3e82bd`

## Self-Check: PASSED

- Every blocking decision derives from raw exact integer evidence.
- Every changed-domain coverage metric independently exceeds 95%.
- Sol's reproduced defects are closed by tests and implementation.
- Fable independently accepted closure with no blocker.
- Later-plan and owner-gated work remains explicit and unclaimed.
- The next durable resume target is Plan 11AH.
