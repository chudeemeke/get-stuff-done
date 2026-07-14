---
phase: 43
plan: "11L"
wave: 14
status: complete
date: 2026-07-14
requirements:
  - SHIP-08A
  - SHIP-08B
---

# Phase 43 Plan 11L Summary - Truthful Plan-Scan Read Models

## Outcome

Corrected Open GSD's shared plan classifier so derivative PLAN-REVIEW
artifacts no longer inflate executable-plan counts. The fix is a temporary,
reviewed override bound to upstream issue `open-gsd/gsd-core#2252`, and every
existing plan-scan consumer receives the same behavior without caller-specific
filters.

The real project now reports the authoritative 46-plan portfolio total. Phase
43 reports 24 disk/effective plans and 13 summaries before this summary; Phase
42 reports 5 disk/effective plans. The former false totals were 47, 24 for
Phase 43's then-23 real plans, and 6 for Phase 42's 5 real plans.

## TDD

RED proved the defect at all three required levels:

- `isRootPlanFile('42-PLAN-REVIEW.md')` returned `true`;
- a directory containing one plan plus one PLAN-REVIEW artifact returned a
  plan count of 2; and
- `roadmap analyze` reported 2 total plans for that same one-plan fixture.

GREEN added one case-insensitive derivative regex and one early rejection to
the exact pinned `plan-scan.cjs`. Strict `PLAN.md`/`*-PLAN.md`, supported nested
forms, loose legacy root-plan names, and summary behavior remain covered and
unchanged.

## Upstream And Override Contract

- Pinned upstream source: `@opengsd/gsd-core@1.6.1`.
- Pinned source SHA-256:
  `07cadb766a55c6d018f10da4d4a487e21190361dc3f2b71a7c5225121b292a9d`.
- Open GSD `next` remained affected when checked on 2026-07-14.
- Upstream issue: `https://github.com/open-gsd/gsd-core/issues/2252`.
- Removal trigger: the pinned upstream ships the correction and direct,
  roadmap, repository, and N=3 compatibility gates pass without the override.
- The final source diff from pinned upstream contains only the derivative regex
  and its early rejection.

`roadmap.test.cjs` now declares `bin/lib/plan-scan.cjs` in its exact authority
evidence. The repository gate deliberately failed until that direct dependency
was added, proving the contract rejects hidden internal coupling.

## Durable Compatibility Evidence

- Open GSD `1.5.0`: 315 passed, 0 failed, 0 skipped.
- Open GSD `1.6.0`: 315 passed, 0 failed, 0 skipped.
- Open GSD `1.6.1`: 315 passed, 0 failed, 0 skipped.
- Total: 945/945 across the same 11 candidate suites and three classified
  exclusions.
- Report: `.planning/evidence/phase43-compat.json`.
- Exact-byte report SHA-256:
  `e4b29fab3d07f5fdac1b4c62785ac3a708b7d3bb4f7ca05935c393f39fb84712`.
- All three vetted manifest rows are dated `2026-07-14`, passed, and reference
  the exact report path and digest.

## Validation

- Native Node roadmap suite: 19/19.
- Blocking repository compatibility: 154/154.
- Override staleness/reason gate: 9/9 fresh.
- N=3 candidate compatibility: 945/945.
- `bun run dist`: 740 composed files, Open GSD `1.6.1`, overlay `3.0.2`, bundled
  hooks, and generated CycloneDX SBOM.
- Focused ESLint, markdown lint, manifest validation, and `git diff --check`
  passed.
- No marker-owned compatibility matrix directory remains.

## Execution Corrections

The initial plan named a new test file, a Bun test command, and package-script
aliases that do not exist. Execution kept the regression in the existing
candidate `roadmap.test.cjs`, used its authoritative `node --test` runner, and
corrected commands to `node scripts/check-overrides.js`,
`bun run test:repository-compat`, and
`node scripts/vetted-upstream-versions.js --apply-matrix-evidence`. Bun's
native-test shim lacks the required `mock.method` behavior and its five-second
default times out the Windows byte-preserving publication tests; this was tool
selection evidence, not a product failure.

## Commit

1. **Shared plan-scan correction and evidence:** `e9bce72` (`fix`)

## Cleanup And Boundaries

The failed Bun runner left one verified `gsd-test-gyaHqi` fixture directory.
It was resolved under the OS temp root, checked against the exact fixture-name
contract, and removed after no child process remained. Matrix-owned temp roots
are absent. `dist/` and `node_modules/` were preserved, and no live `authkey`,
`remotely`, or `conversations` session was touched.

## Next

Push the current branch as a draft PR and obtain a hosted CI verdict. Resolve
blocking runner/performance evidence through GSD, then execute Plan 11D's
coverage source-contract and feasibility foundation.
