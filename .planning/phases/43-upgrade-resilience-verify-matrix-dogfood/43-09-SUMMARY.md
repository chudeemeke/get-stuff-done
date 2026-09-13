---
phase: 43-upgrade-resilience-verify-matrix-dogfood
plan: 09
subsystem: supply-chain
tags: [sbom, cyclonedx, dist, ci-artifact]
requires:
  - phase: 43-upgrade-resilience-verify-matrix-dogfood
    provides: override churn generation
provides:
  - CycloneDX SBOM generation into dist/bom.json
  - SBOM package inclusion through package files dist entry
  - CI package-evidence artifact upload
affects: [phase-43, dist, ci, package]
tech-stack:
  added:
    - "@cyclonedx/cyclonedx-npm@4.2.1"
  patterns:
    - Dedicated lifecycle script between compose and finalize-dist
    - Bun package-script env sanitization before npm-based tool invocation
    - CI artifact proof for package evidence
key-files:
  created:
    - scripts/generate-sbom.js
  modified:
    - package.json
    - bun.lock
    - .github/workflows/ci.yml
    - tests/compose.test.js
    - tests/ci-workflow.test.js
    - .planning/ROADMAP.md
    - .planning/STATE.md
    - .planning/phases/43-upgrade-resilience-verify-matrix-dogfood/43-VALIDATION.md
key-decisions:
  - "SBOM generation uses pinned @cyclonedx/cyclonedx-npm@4.2.1."
  - "bun run dist order is compose -> build -> sbom -> finalize-dist."
  - "CI uploads dist/bom.json as package evidence; release-asset attachment remains open until Phase 44 publish flow exists."
requirements-completed: []
requirements-advanced: ["SHIP-03"]
decisions-completed: []
duration: 54 min
completed: 2026-07-04
---

# Phase 43 Plan 09: CycloneDX SBOM Pipeline Summary

**The dist pipeline now generates a validated CycloneDX SBOM at `dist/bom.json` after compose and before finalize-dist.**

## Performance

- **Duration:** 54 min
- **Completed:** 2026-07-04T00:40:00+01:00
- **Tasks:** 4
- **Files modified:** 6 source/product files plus GSD state metadata

## Accomplishments

- Added `@cyclonedx/cyclonedx-npm@4.2.1` as the pinned SBOM generator.
- Added `scripts/generate-sbom.js`.
- Added package script `sbom`: `node scripts/generate-sbom.js`.
- Updated `bun run dist` order to `compose -> build -> sbom -> finalize-dist`.
- Generated `dist/bom.json` and validated `bomFormat: CycloneDX`.
- Confirmed package inclusion through existing `package.json#files` `dist` entry.
- Added CI parity-job steps:
  - `bun run sbom`,
  - `test -f dist/bom.json`,
  - upload `dist/bom.json` using `actions/upload-artifact@v7`.
- Added tests in `tests/compose.test.js` and `tests/ci-workflow.test.js`.

## Guardrails

- The SBOM wrapper requires `dist/` to exist, so it cannot silently generate detached metadata before compose.
- The wrapper removes Bun's `npm_config_user_agent` before invoking CycloneDX because CycloneDX otherwise reads Bun `1.3.5` as an unsupported npm version.
- The wrapper passes `--ignore-npm-errors` because the current npm tree reports existing `picomatch` override noise through `npm ls`.
- `dist/bom.json` is generated but not committed; `dist/` remains generated package output.

## Deviations from Plan

- SHIP-03 is advanced but not fully checked complete. The repo currently has no GitHub release workflow, so literal release-asset attachment for `dist/bom.json` remains open for Phase 44 publish/release flow integration. Package tarball inclusion and CI package-evidence artifact upload are complete.

## Verification

- RED: `bun test tests/compose.test.js tests/ci-workflow.test.js` failed before implementation on missing package pin, missing `sbom` script, missing `dist/bom.json`, and missing CI SBOM references.
- `bun add -d @cyclonedx/cyclonedx-npm@4.2.1 --ignore-scripts` - passed and updated `bun.lock`.
- `bunx --bun cyclonedx-npm --help` - passed and confirmed the pinned CLI options.
- `node scripts\\generate-sbom.js` - passed after compose and created `dist/bom.json`.
- `bun run dist` - passed and created `dist/bom.json` before finalize-dist.
- `bun test tests/compose.test.js tests/ci-workflow.test.js` - passed, 173 tests.
- `bun install --frozen-lockfile --ignore-scripts` - passed.
- `bash scripts/lint-workflows.sh` - passed.
- `node --check scripts\\generate-sbom.js` - passed.
- `bunx eslint scripts\\generate-sbom.js tests\\compose.test.js tests\\ci-workflow.test.js` - passed with 0 errors.
- `rg -n '@cyclonedx/cyclonedx-npm|4\\.2\\.1|dist/bom\\.json|"sbom"|bun run sbom|actions/upload-artifact@v7' package.json bun.lock scripts\\generate-sbom.js tests\\compose.test.js tests\\ci-workflow.test.js .github\\workflows\\ci.yml` - passed.
- `Test-Path dist\\bom.json` - true; file size 641014 bytes.
- `node scripts/check-parity.js` - passed; package files check saw `dist/` with 26 files.
- `git diff --check` - passed.

## User Setup Required

None.

## Next Phase Readiness

Ready for Plan 43-10: live target reverify and authority bump.

---
*Phase: 43-upgrade-resilience-verify-matrix-dogfood*
