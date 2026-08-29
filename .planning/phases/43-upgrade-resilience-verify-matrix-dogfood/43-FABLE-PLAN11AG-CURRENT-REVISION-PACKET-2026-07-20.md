# Fable Review Packet: Phase 43 Plan 11AG Current Revision

## Role And Decision Requested

Act as the authoritative lead developer, architect, security reviewer, and
project designer for this whole project. Review the current local implementation
of Phase 43 Plan 11AG. The candidate implementation and test revision is
`35cbe0883a65409b13f9b7cc6347c793df2a2f15`. Do not edit files.

Return one closure verdict:

- `ACCEPT`: Plan 11AG is locally closure-ready as scoped.
- `ACCEPT_WITH_FOLLOW_UPS`: Plan 11AG is locally closure-ready, with clearly
  separated later-plan work that does not invalidate its acceptance criteria.
- `REVISE`: one or more Plan 11AG acceptance properties are unproved or the
  implementation creates an unacceptable measurement, architecture, security,
  or product risk.

For every finding, provide severity, exact evidence, why it matters, and the
minimum corrective action. Distinguish an 11AG blocker from work explicitly
owned by 11AH or 11AI.

## Project Context

This repository is a market-ready overlay over active Open GSD authority. Phase
43 establishes executable upgrade and release evidence. Plan 11AG replaces a
stale cross-run absolute performance baseline as blocking authority with paired
reference/candidate measurements on one observed runtime. The approved warning
and failure SLOs remain strict `>1.10` and `>1.25`; changing those thresholds or
accepting a regression remains owner-only.

Plan 11AG owns the local schema, pure adjudication domain, process/filesystem
capture adapter, CLI adapter, and fixture-backed proof. Plan 11AH owns hosted
workflow wiring, trusted checkout/harness/run identity, artifact origin, and
upload binding, including the three hosted performance subjects. Plan 11AI
owns the full local corrective-gate integration and a create-only local
pre-retry receipt that includes paired-performance fixtures. Neither later
plan, while still unexecuted, proves a real timing result or hosted authority;
that requires a separately authorized hosted run. Do not transfer later-plan
deliverables into 11AG, but reject any local contract that would make those
later deliverables misleading or impossible to trust.

## Authoritative Scope

Read these current files:

- `.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AG-PLAN.md`
- `.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-11AG-PAIRED-PERF-SPIKE.md`
- `config/perf-comparison.schema.json`
- `scripts/lib/paired-perf.js`
- `scripts/bench.js`
- `scripts/check-perf.js`
- `tests/perf-comparison-schema.test.js`
- `tests/bench.test.js`
- `tests/check-perf.test.js`
- `tests/coverage/paired-perf.test.cjs`
- `tests/helpers/paired-perf-fixture.js`
- `.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-GPT-5.6-SOL-PLAN11AG-ADVISORY-REVIEW-2026-07-20.md`
- `.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-GPT-5.6-SOL-PLAN11AG-CURRENT-REVISION-REVIEW-2026-07-20.md`
- `.planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-GPT-5.6-SOL-PLAN11AG-CORRECTION-REVIEW-2026-07-20.md`

Review the chronological implementation range:

- `7075b039 test(phase-43): specify paired performance evidence`
- `648f8b64 feat(phase-43): define paired evidence envelope`
- `fe1839e0 feat(phase-43): close paired evidence schema`
- `97362f1f feat(phase-43): derive paired performance results`
- `b99be79b feat(phase-43): validate paired capture evidence`
- `95ad0e7e feat(phase-43): enforce paired performance authority`
- `ab462fd6 feat(phase-43): capture paired performance evidence`
- `992b6e55 test(phase-43): enforce paired authority coverage`
- `cfd1a2b0 test(phase-43): classify focused coverage runner`
- `63d21ca9 docs(phase-43): preserve paired review findings`
- `e5fabaf9 test(phase-43): reproduce paired authority defects`
- `6452ca12 feat(phase-43): make paired verdict arithmetic exact`
- `0998d9c3 test(phase-43): bind observed runner identity`
- `59b93b93 test(phase-43): rebind tampered identity receipts`
- `3349eeb1 feat(phase-43): bind observed runner identity`
- `5d946d67 fix(phase-43): make historical perf nonblocking`
- `eaf40011 test(phase-43): cover invalid runner identities`
- `970d11f1 refactor(phase-43): make identity fields explicit`
- `d0fc8eb5 docs(phase-43): preserve paired correction review`
- `a64464ef test(phase-43): close paired adapter evidence gaps`
- `35cbe088 docs(phase-43): correct runner identity example`

## Required Truths

Plan 11AG requires all of the following:

1. Blocking authority compares immutable reference and candidate commits on one
   observed runner/toolchain identity.
2. Raw positive safe-integer nanosecond samples, execution order, commits,
   workload/control digests, subject digests, and environment provenance remain
   inspectable.
3. The blocking status is derived from exact aggregate arithmetic using strict
   `>1.10` and `>1.25` boundaries. Floating summaries cannot change status.
4. Stored summaries, diagnostics, and verdict are caches and must exactly match
   recomputation from raw evidence.
5. Both metrics use equal warmup policy and at least ten measured pairs, with a
   deterministic seed and uninterrupted AB/BA alternation.
6. Every sample proves expected execution identity, controls, subject commit and
   digests, clean worktree, successful preparation, successful benchmark, and
   unchanged pre/post state.
7. Hyperfine measures exactly one target command with `--warmup 0 --runs 1` per
   outer-scheduled sample; setup/reset is outside the timed command.
8. Any missing, malformed, failed, drifting, incomplete, or derivative-
   inconsistent evidence invalidates the complete paired artifact.
9. Historical baseline results, accepted regressions, calendar state, and
   caller-supplied threshold overrides cannot produce or suppress a blocking
   performance verdict.
10. Shared harness/workload/scheduler/command/policy controls match while
    reference and candidate package, lock, and upstream-authority digests may
    legitimately differ.

## Implementation Decisions To Challenge

### Exact Blocking Arithmetic

Individual raw samples remain JSON safe integers. The domain sums them with
`BigInt` and classifies by rational cross-multiplication:

```text
warn when 10 * candidateTotal > 11 * referenceTotal
fail when 4 * candidateTotal > 5 * referenceTotal
```

Numeric means and ratios remain presentation caches. A mathematically
above-boundary ratio may display rounded as `1.10` or `1.25`, while exact status
still warns or fails. Challenge whether this split is honest, deterministic,
and sufficiently inspectable, and whether any conversion can re-enter the
blocking path.

### Observed Versus Expected Runtime Identity

The default adapter observes a normalized OS fingerprint from platform, release,
and OS version. `--runner-image` is an explicit expectation, recorded separately
as `runnerImageExpected`; capture fails unless it exactly equals observed
`runnerImage`. The domain independently enforces normalized non-placeholder
values and equality. The adapter re-observes execution identity before and after
every sample.

The field retains the name `runnerImage` although local fallback is an observed
OS fingerprint rather than a cryptographically attested image identifier.
Plan 11AH owns the trusted hosted source and artifact-origin binding. Challenge
whether the 11AG naming and contract are sufficiently accurate, whether an
untrusted caller can manufacture misleading evidence that later wiring cannot
detect, and whether the trust boundary is correctly deferred rather than hidden.

### Pure Domain And Deep Executor Port

`scripts/lib/paired-perf.js` owns deterministic scheduling, receipt validation,
exact adjudication, derivative recomputation, and semantic validation. It has no
filesystem or process dependency and receives one benchmark-executor function.
`scripts/bench.js` owns Git, filesystem isolation, process spawning, Hyperfine,
and JSON publication. `scripts/check-perf.js` owns shape validation and
presentation. Challenge whether this is loose coupling with tight integration
or whether responsibilities leak across adapters.

### Measurement Isolation

Each scheduled subject receives a fresh sandbox copied from tracked files. For
compose, `bun install --frozen-lockfile --ignore-scripts` completes before
timing. Hyperfine then runs one target command, one raw sample, no internal
warmup. Every sandbox is cleaned in `finally`. Tests exercise actual spawn
arguments, preparation-before-Hyperfine ordering, nonzero preparation failure,
no measurement after preparation failure, cleanup, dirty resolution, and
identity/control/subject drift.

Challenge whether install and compose preparation semantics are comparable
between subjects and whether fixture-backed process tests are sufficient for
11AG without confusing them with the broader local 11AI corrective-gate
receipt.

### Historical Compatibility

The legacy baseline/current mode remains available and labels all measured
results as historical diagnostics. Warn/fail historical results emit warning
annotations and return success. Malformed or operationally invalid historical
input still returns `EPERF` failure; this is not a measured performance verdict.
Only paired `--comparison` failure can return a performance-failure exit.

Challenge whether this distinction is robust and whether accepted-regression or
calendar state can still affect any blocking result through an alternate path.

### Diagnostic Completeness

The artifact stores per-pair ratios, median pair ratio, median absolute
deviation of pair ratios, mean absolute nanosecond delta, and AB/BA candidate
means. All diagnostics are recomputed from raw pairs and stored disagreement is
rejected. They are inspectable but cannot override exact aggregate status.

## Evidence At Candidate Revision

All evidence below was rerun after the final implementation/help change at
`35cbe088`:

- Focused schema/domain/adapter/checker tests: 39 passed, 0 failed.
- Focused pure-domain coverage: statements 100%, branches 98.18%, functions
  100%, lines 100%.
- Full suite: 1,581 passed across 59 files, 0 failed, 4,797 assertions.
- Repository compatibility: 154 passed across 34 suites, 0 failed.
- `bun run dist`: passed; composed 740 files, applied 124 branding rules,
  rebuilt bundled hooks, generated the SBOM, and finalized distribution.
- Targeted ESLint: 0 errors; only the 12 pre-existing `bench.js` warnings.
- Full ESLint: 0 errors; 220 pre-existing security-plugin warnings, unchanged
  from the pre-plan baseline.
- Documentation lint: 0 errors across both configured sets.
- Dependency policy: 7 findings, 0 blocking, 0 suppressed.
- Gitleaks over `c4967c6b..35cbe088`: 21 commits scanned, no leaks found.
- `git diff --check`: passed.
- Candidate worktree: clean.

No real Hyperfine timing command was run. The process adapter is fixture-backed;
that limit is intentional and explicit.

## Review History And Current Disposition

The pre-implementation Sol advisory required exact raw-sample authority,
observed provenance, recomputed caches, shared controls, fixed policy, and clear
11AG/11AH/11AI separation. Those constraints shaped the first implementation.

A current-revision Sol review then returned `REJECT` with these findings:

1. Aggregate `Number` sums could round an exact above-`1.25` result down to the
   boundary and avoid failure.
2. Runner image identity was copied from the caller rather than observed.
3. Historical diagnostic mode could still return a measured failure exit.
4. Warmups could stop alternating when they exceeded an odd measured-pair
   schedule length.
5. Production Hyperfine/drift adapter behavior lacked direct fixture evidence.
6. The accepted dispersion diagnostic was absent.

Each defect was reproduced in tests before correction. The correction review
returned `ACCEPT_WITH_FOLLOW_UPS`: findings 1, 2, 3, 4, and 6 were closed;
finding 5 was reduced to dirty/preparation/order test gaps. It also found an
invalid runner-image help example. Commits `a64464ef` and `35cbe088` close those
bounded follow-ups. The older `REJECT` and later conditional acceptance are
both preserved; neither has been rewritten after the fact.

## Explicit Non-Claims

- This is local Windows and fixture-backed adapter evidence, not hosted Linux,
  macOS, or container evidence.
- No real timing ratio, performance pass, or regression acceptance is claimed.
- The artifact has no trusted hosted origin or cryptographic authenticity root;
  Plan 11AH owns trusted workflow/run/harness/artifact binding.
- No push, PR, hosted run, merge, release, package publication, credential
  change, repository visibility mutation, or branch-protection change is
  authorized or claimed.
- Plan 11AG does not prove the Plan 11AH workflow or the Plan 11AI local
  pre-retry corrective-gate receipt.
- A green local gate is not a substitute for the final hosted PR evidence
  contract.

## Reviewer Questions

1. Does the implementation prove every Required Truth above, or which exact
   truth remains unproved?
2. Is exact rational status plus numeric diagnostic caches the correct
   first-principles decision for JSON nanosecond evidence?
3. Is observed OS fingerprint plus separately recorded expectation an honest and
   extensible 11AG identity contract, given the trusted source belongs to 11AH?
4. Can malformed, tampered, caller-controlled, historical, or derivative data
   become blocking authority or suppress a real paired failure?
5. Is the one deep executor port appropriately SOLID and sufficiently isolated?
6. Are the process adapter tests enough for 11AG without requiring the broader
   local 11AI corrective-gate receipt?
7. Can Plan 11AG be closed locally now, or what minimum revision is required?
8. List later-plan follow-ups separately so they cannot be mistaken for 11AG
   blockers.
