---
phase: 43
plan: 11
wave: 11
status: blocked
date: 2026-07-11
requirements:
  - UPGRADE-05
  - UPGRADE-07
  - UPGRADE-08
  - UPGRADE-09
  - SHIP-03
blocking_gate: compat-matrix
summary_file_created: false
---

# Phase 43 Plan 11 Blocker - Post-Bump Gate Failed Closed

## Why This Is Not A Summary

`43-11-SUMMARY.md` is intentionally absent. GSD uses SUMMARY existence as the
plan-completion marker, and the active-pin compatibility gate is red. Plan 11
and dependent Plan 12 therefore remain incomplete.

## Completed Evidence

- **Snapshot refresh:** all eight override REASON files now reference the
  reviewed Open GSD `1.6.1` source. `node scripts/check-overrides.js` passes.
- **Worker classification:** `hooks/gsd-check-update-worker.js` remains an
  `override` because Open GSD `1.6.1` contains the same upstream path and the
  fork still needs package identity, role routing, and throttle behavior.
- **Override Churn:** the Unreleased CHANGELOG block records five changed and
  three carried overrides.
- **SBOM:** `bun run dist` passes and generates `dist/bom.json` from the bumped
  package state.
- **Authority recheck:** on 2026-07-11, npm and GitHub still identify `1.6.1`
  as latest stable. `1.7.0-rc.5` is prerelease-only and remains excluded by the
  exact-stable-pin policy.
- **upgrade-report:** Verdaccio is not installed locally, so no local
  `upgrade-report.json` was created. `.github/workflows/upgrade-verifier.yml`
  remains the authoritative upgrade-verifier surface once this branch reaches
  CI; local success is not claimed.

## Blocking Gate

The repaired current-pin command failed closed:

```text
node scripts/run-compat-matrix.js --manifest .planning/vetted-upstream-versions.json --json --report compat-matrix-report.json --version 1.6.1
exit: 1
classification: blocking
passed: 159
failed: 87
excluded: sync.test.cjs, runtime-overrides.test.cjs
```

The full N=3 run also failed. Historical `1.5.0` and `1.6.0` produced the same
159 passing / 87 failing result. Its `1.6.1` row timed out, but the separate
current-pin run above had already completed and proved the blocking failure.

## Interpretation

This is not evidence that the `1.6.1` authority bump itself is invalid. It is
evidence that the compatibility contract still mixes three different things:

1. supported Open GSD runtime behavior;
2. market-critical fork behavior that must be ported through overlays or
   reviewed overrides; and
3. legacy expectations for modules or permissive config behavior that Open GSD
   no longer exposes.

Observed failure families include strict config-key validation, the removed
legacy `bin/lib/core.cjs` path, and unported frontmatter, template, phase, and
roadmap behavior. Blindly copying the old runtime would erase upstream
improvements and violate the overlay architecture.

## Next Required GSD Work

Before Plan 43-12, add and execute a corrective GSD slice that classifies every
failing suite against the supported product contract, ports fork-critical
behavior through the narrowest overlay/override boundary, and replaces obsolete
legacy expectations with explicit migration or upstream-contract coverage. The
active-pin compat-matrix must then pass before `43-11-SUMMARY.md` can be created.

## Temporary Reports

- `compat-matrix-report.json` is regenerable and is removed after this evidence
  is recorded.
- `upgrade-report.json` was not created.

## Requirement Status

- **UPGRADE-05:** blocked by the post-bump active-pin compat-matrix.
- **UPGRADE-07, UPGRADE-08, UPGRADE-09, SHIP-03:** advanced by refreshed hook,
  override, churn, and SBOM evidence, but not closed while the blocking gate is
  red.
