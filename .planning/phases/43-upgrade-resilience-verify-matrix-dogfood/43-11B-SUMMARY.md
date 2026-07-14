---
phase: 43
plan: "11B"
wave: 12
status: complete
date: 2026-07-13
requirements:
  - UPGRADE-04
  - UPGRADE-05
  - SHIP-08B
---

# Phase 43 Plan 11B Summary - Open GSD Candidate Contracts

## Outcome

Modernized stale compatibility expectations to Open GSD `1.6.1` behavior,
moved direct and matrix candidate suites onto one explicit package-root port,
and brought fork runtime override regressions into the candidate contract. The
active matrix now reports 309 passed assertions and one deliberate roadmap
preservation failure; Plan 11C owns that final behavior.

## Candidate Authority

- `tests/helpers/compat-package-root.cjs` resolves an explicit
  `GSD_COMPAT_PACKAGE_ROOT` or the composed `dist/gsd-core` direct-test root
  without mutating process environment.
- `tests/helpers.cjs` exposes package-bound command helpers while retaining its
  repository package as the default for repository-only `sync.test.cjs`.
- Config, frontmatter, template, and phase tests bind explicitly to the
  candidate package. Phase identity imports the canonical exact-pin
  `bin/lib/phase-id.cjs`; no new legacy `core.cjs` facade or import was added.
- Runtime override tests fail closed when an explicit candidate lacks
  `bin/gsd-tools.cjs`; candidate execution cannot fall back to repository
  `dist/` accidentally.

## Supported Behavior

- A shared test-only command boundary captures stream and synchronous fd
  output, accepts natural return and explicit exit zero, and restores process
  and fs globals in `finally`.
- The first nonzero exit observation is sticky even when command code catches
  the sentinel and later calls `process.exit(0)`, so failure cannot be reported
  as success.
- Config tests use canonical schema keys, require strict unknown-key and enum
  rejection without mutation, and verify malformed JSON remains unchanged.
- Pure CRLF frontmatter now asserts the supported parsed object.
- Phase completion fixtures provide passed verification evidence and effective
  waves follow the candidate dependency graph.

## Transitional Evidence Gate

- The marker-owned integration test runs the active `1.6.1` matrix and accepts
  only raw exit one with the exact complete candidate suite inventory.
- It rejects missing, duplicate, extra, or differently failed suites;
  contradictory status/count/exit/error records; empty or non-string failure
  evidence; and row aggregates that disagree with suite records.
- Report and active row status must remain failed, and `roadmap.test.cjs` must
  be the sole red suite. Plan 11C removes this transitional test only after the
  real active matrix exits zero.

## TDD And Review Corrections

- RED proved legacy permissive config writes, invalid enum acceptance, and
  empty CRLF parsing before candidate behavior was adopted.
- RED proved absent candidate executable preflight, repository fallback,
  synchronous fd capture escape, caught-exit failure overwrite, incomplete
  suite evidence, contradictory evidence, shared-process environment leakage,
  malformed error evidence, inconsistent row totals, and invalid row exits.
- Each defect received focused GREEN evidence before the broader gate was run.
- Independent critical review ran four remediation cycles. Findings covered
  failure overwrite, incomplete evidence, broken direct authority, error-array
  contradictions, test-order leakage, malformed row evidence, and exit-code
  typing. The final implementation re-review returned PASS.
- The requested Claude Fable review is scoped to the whole project rather than
  this plan. Its strategic brief is ready, but Claude reported a session limit
  resetting at 01:50 Europe/London; no narrower review is being represented as
  an equivalent substitute.

## Plan Deviation

The original write set omitted the shared helper owner, its new pure
candidate-root resolver, and the runner regression suite. Review proved that
ambient environment activation made Bun's default suite order-dependent, so
the bounded correction added `tests/helpers.cjs`,
`tests/helpers/compat-package-root.cjs`, and
`tests/run-upstream-compat.test.js` to the manifest. The explicit helper
factory removes shared ambient state instead of adding suite-specific cleanup.

## Validation Evidence

- `bun run compose` passed for upstream `1.6.1`, overlay `3.0.2`, 739 written
  artifacts, and 124 branding rules.
- The exact direct candidate batch passed 243/243.
- `node --test tests/sync.test.cjs` passed 153/153.
- The shared-process authority regression
  `bun test tests/config.test.cjs tests/sync.test.cjs` passed 200/200.
- `bun test tests/run-upstream-compat.test.js` passed 14 tests and 61
  assertions.
- `bun test tests/run-compat-transition.test.js` passed 7 tests and 18
  assertions, including the live active matrix.
- Direct active compatibility evidence is 309 passed, 1 failed, and 0 skipped;
  only `roadmap.test.cjs` is red. `core.test.cjs` remains retired and
  `sync.test.cjs` remains separately enforced as repository-only.
- Focused ESLint passed with zero errors and the established eight validated
  dynamic-path warnings. Syntax, registry validation, no-new-`core.cjs`, and
  `git diff --check` gates passed.
- Plan 11B makes no SHIP-08A coverage claim. The independent four-metric 95%
  gate remains owned by Plans 11D through 11J.

## Task Commits

1. **Plan 11B implementation:** `330f2a1` (`test`)

## Cleanup And Boundary

Removed one verified 546 KB Phase 43 diagnostic staging directory from the OS
temp root after containment and link checks. Final compatibility residue scans
are empty. `dist/` and `node_modules/` were preserved, and no live `authkey`,
`remotely`, or `conversations` session was touched.

Original Plan 11 remains failed closed until validator-first Plan 11J accepts
both assurance children. Plan 11C now owns roadmap byte preservation and the
first durable green N=3 compatibility proof.

## Self-Check: PASSED

- Required Plan 11B implementation and evidence artifacts exist.
- Focused candidate, repository, shared-process, transition, lint, syntax, and
  cleanup gates pass.
- Implementation commit `330f2a1` contains only the bounded contract, runner,
  helper, and test changes.
