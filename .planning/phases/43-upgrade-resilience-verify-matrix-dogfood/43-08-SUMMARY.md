---
phase: 43-upgrade-resilience-verify-matrix-dogfood
plan: 08
subsystem: upgrade-changelog
tags: [override-churn, changelog, upstream-bump]
requires:
  - phase: 43-upgrade-resilience-verify-matrix-dogfood
    provides: semantic override staleness and hook reconciliation
provides:
  - Deterministic Override Churn generator
  - CHANGELOG marker-only replacement contract
  - Package script for bump-time churn generation
affects: [phase-43, changelog, upgrade-runbook]
tech-stack:
  added: []
  patterns:
    - Filesystem-evidence classification
    - Marker-bounded changelog writes
    - Fixture-driven CLI contract
key-files:
  created:
    - scripts/generate-override-churn.js
    - tests/override-churn.test.js
  modified:
    - CHANGELOG.md
    - package.json
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/STATE.md
    - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-VALIDATION.md
key-decisions:
  - "Override Churn compares current override paths across previous and target upstream trees."
  - "CHANGELOG writes are allowed only between override-churn markers under Unreleased."
  - "Plan 10/11 bump execution supplies the real from/to upstream directories."
requirements-completed: ["UPGRADE-09"]
decisions-completed: ["D-12"]
duration: 35 min
completed: 2026-07-04
---

# Phase 43 Plan 08: Override Churn Generator Summary

**Override Churn is now generated from upstream/override filesystem evidence instead of handwritten bump notes.**

## Performance

- **Duration:** 35 min
- **Completed:** 2026-07-04T00:20:00+01:00
- **Tasks:** 4
- **Files modified:** 4 source/product files plus GSD state metadata

## Accomplishments

- Added `scripts/generate-override-churn.js`.
- Added `tests/override-churn.test.js` before implementation.
- Implemented deterministic classifications:
  - `changed`: previous and target upstream files both exist and differ.
  - `carried`: previous and target upstream files both exist and match.
  - `orphaned`: override path has no upstream counterpart in either tree.
  - `added`: target upstream newly has the override path.
  - `removed`: previous upstream had the path and target upstream removed it.
- Added deterministic JSON output with sorted entries.
- Added markdown output for the Override Churn section.
- Added marker-bounded CHANGELOG replacement using `<!-- override-churn:start -->` and `<!-- override-churn:end -->`.
- Added package script: `bun run override:churn`.
- Marked UPGRADE-09 complete.

## Guardrails

- `--from-upstream-dir` and `--to-upstream-dir` are required for real generation.
- CHANGELOG writes fail unless both markers exist under `## [Unreleased]`.
- `--json` without upstream dirs exits `2` with documented fixture-required usage.
- The current CHANGELOG marker body remains a pending bump placeholder; Plans 10-11 provide the real upstream pair and replace it.

## Deviations from Plan

- None blocking.
- Observed debt: `bash .changelog-conflict-check.sh CHANGELOG.md` flags existing published-release bullets. The required synthetic `--self-test` passed, so this stayed out of scope and was recorded in STATE for future checker semantics cleanup.

## Verification

- RED: `bun test tests/override-churn.test.js` failed before implementation because `scripts/generate-override-churn.js` did not exist.
- `node scripts/generate-override-churn.js --help` - passed.
- `bun test tests/override-churn.test.js` - passed, 6 tests.
- `bash .changelog-conflict-check.sh --self-test` - passed.
- `rg -n "override:churn|override-churn:start|override-churn:end|generate-override-churn|changed|carried|orphaned|added|removed" package.json CHANGELOG.md scripts\\generate-override-churn.js tests\\override-churn.test.js` - passed.
- `node scripts/generate-override-churn.js --json` - returned documented exit `2` with required input usage.
- `node --check scripts\\generate-override-churn.js` - passed.
- `bunx eslint scripts\\generate-override-churn.js tests\\override-churn.test.js` - passed with 0 errors and expected filesystem/object-injection warnings.
- `bun run lint:docs` - passed.
- `bun run override:churn -- --help` - passed.

## User Setup Required

None.

## Next Phase Readiness

Ready for Plan 43-09: CycloneDX SBOM pipeline.

---
*Phase: 43-upgrade-resilience-verify-matrix-dogfood*
