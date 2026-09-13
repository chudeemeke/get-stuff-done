---
phase: 43-upgrade-resilience-verify-matrix-dogfood
plan: 02
subsystem: installer
tags: [installer, rollback, provenance, version, upgrade-safety]
requires:
  - phase: 43-upgrade-resilience-verify-matrix-dogfood
    provides: temp-isolated upgrade verifier and D-03 report contract
provides:
  - Transactional installer preflight, snapshot, rollback, and commit helpers
  - Explicit fork/upstream package provenance fields
  - Resolved Windows installer-v3 subprocess hang surfaced after Plan 01
affects: [phase-43, upgrade-resilience, installer, cousin-smoke, runtime-provenance]
tech-stack:
  added: []
  patterns:
    - Exported installer transaction helpers with injected process/step dependencies
    - Additive provenance schema evolution preserving packageName/version compatibility
key-files:
  created:
    - tests/version-provenance.test.js
  modified:
    - bin/install.js
    - scripts/lib/package-provenance.js
    - scripts/cousin-smoke.js
    - tests/installer-safety.test.js
    - tests/cousin-smoke.test.js
    - tests/package-launcher-v3.test.js
key-decisions:
  - "Installer rollback snapshots prior settings.json, metadata, previous manifests, and current dist overlay paths before delegating to upstream."
  - "Rollback removes only newly copied current-overlay files and restores prior GSD-owned files when they existed before install."
  - "Runtime provenance adds forkPackage/forkVersion while preserving packageName/version as backward-compatible aliases for cousin CI."
  - "The installer uses upstream-source.js when available, with an embedded Open GSD fallback for minimal package fixtures and partial installs."
patterns-established:
  - "Installer failure paths must return/report rollback: applied or rollback: failed, not merely warn about partial state."
  - "Fork/upstream provenance must make package identity unambiguous in both install metadata and gsd --version --json output."
requirements-completed: []
decisions-completed: ["D-20"]
duration: 40 min
completed: 2026-07-03
---

# Phase 43 Plan 02: Installer Rollback and Provenance Summary

**Transactional installer rollback plus explicit fork/upstream VERSION provenance**

## Performance

- **Duration:** 40 min
- **Started:** 2026-07-03T21:15:00+01:00
- **Completed:** 2026-07-03T21:57:52+01:00
- **Tasks:** 4
- **Files modified:** 7

## Accomplishments

- Added failing TDD coverage for `preflightInstallTarget`, `createInstallTransaction`, `rollbackInstallTransaction`, injected install failure rollback, and explicit provenance fields.
- Implemented installer preflight checks for unsafe target paths, missing upstream installer, missing `dist/.overlay-manifest.json`, and missing `dist/.install-meta.json`.
- Added transaction snapshots for previous `gsd-file-manifest.json`, `.overlay-manifest.json`, `.install-meta.json`, `settings.json`, previous manifest-owned files, and current dist overlay files.
- Added rollback behavior that restores previous snapshots, removes newly copied current-overlay files, prunes only empty parent directories, and preserves unrelated user files such as `CLAUDE.md`, `rules/user.md`, and `projects/keep.md`.
- Refactored `install()` to support injected `spawnImpl`, `copyOverlayFilesImpl`, `writeInstallMetaImpl`, `patchStatusLineImpl`, and `exitImpl`, and to report `rollback: "applied"` on post-upstream failures.
- Switched the delegated upstream watcher from `close` to guarded `exit` handling. This resolved the previously surfaced `tests/installer-v3.test.js` timeout/hang after upstream printed `Installed 70 skills to skills/`.
- Added `forkPackage`, `forkVersion`, `upstreamPackage`, and `upstreamVersion` to install metadata and runtime package provenance while preserving `packageName` and `version` aliases for existing smoke consumers.

## Task Commits

Each task was committed atomically:

1. **Task 02-01 / 02-03: Write installer transaction and provenance tests first** - `e2bd4d3` (test)
2. **Task 02-02 / 02-04: Implement rollback helpers and provenance clarity** - `9bfbc7e` (feat)
3. **Task 02 summary and metadata** - pending metadata commit

## Files Created/Modified

- `tests/version-provenance.test.js` - New D-20 provenance contract coverage.
- `tests/installer-safety.test.js` - Added installer transaction and rollback tests.
- `bin/install.js` - Added preflight, transaction, rollback, commit, injected install steps, and explicit install metadata fields.
- `scripts/lib/package-provenance.js` - Runtime provenance now emits explicit fork/upstream fields and reads upstream package/version from dist metadata when available.
- `scripts/cousin-smoke.js` - Cold-install smoke validates explicit fork/upstream fields and rejects upstream-as-fork identity.
- `tests/cousin-smoke.test.js` - Updated fake provenance schema.
- `tests/package-launcher-v3.test.js` - Updated `gsd --version --json` schema expectations.

## Decisions Made

- `forkPackage` / `forkVersion` were added without removing `packageName` / `version`. This avoids breaking existing cousin smoke and workflow consumers while making package identity unambiguous.
- Rollback snapshots current dist overlay paths even if they were not in a previous GSD manifest. That protects pre-existing user files at overlay paths from being deleted on a failed install.
- The installer keeps a small embedded Open GSD identity fallback for minimal package fixtures and partial install layouts, but normal package/source installs still use `scripts/lib/upstream-source.js`.
- Plan 02 closes D-20 but does not mark an additional requirement complete; `UPGRADE-01` was already marked complete by Plan 01, and the remaining Phase 43 requirement IDs belong to later matrix/hook/dogfood/SBOM plans.

## Deviations from Plan

### Auto-fixed Issues

**1. [Plan reference drift] Used actual launcher provenance test surface**
- **Found during:** Task 02-03 (Write VERSION/package provenance tests first)
- **Issue:** The plan referenced `tests/launcher-provenance.test.js`, which does not exist.
- **Fix:** Used the actual current surface: `tests/package-launcher-v3.test.js` plus `scripts/lib/package-provenance.js`.
- **Verification:** `bun test tests/version-provenance.test.js tests/package-launcher-v3.test.js` passed.
- **Committed in:** `9bfbc7e`

**2. [Package fixture gap] Installer import needed a minimal-layout fallback**
- **Found during:** `tests/installer-v3.test.js`
- **Issue:** The package-fixture test copies only `bin/install.js` and `package.json`; a top-level `scripts/lib/upstream-source.js` require failed before install execution.
- **Fix:** Added an embedded Open GSD fallback for upstream package/version, while retaining the helper import when present.
- **Verification:** `bun test --timeout 30000 tests/installer-v3.test.js` passed.
- **Committed in:** `9bfbc7e`

---

**Total deviations:** 2 auto-fixed (1 stale plan reference, 1 package fixture gap)
**Impact on plan:** Both fixes tightened the implementation against real repo surfaces without widening Phase 43 scope.

## Issues Encountered

- Full `bun test` was not rerun after Plan 02 because Plan 01 already showed the unsplit Windows full-suite command exceeding long tool timeouts. The relevant installer/provenance regression surfaces were run directly, and the previously failing `installer-v3` surface now passes.
- `tests/hooks.test.js` timeout debt remains associated with the planned hook reconciliation work in 43-06 / 43-07.

## Verification

- RED: `bun test tests/installer-safety.test.js tests/version-provenance.test.js` failed before implementation on missing transaction helpers and provenance fields.
- `bun test tests/installer-safety.test.js tests/version-provenance.test.js` - passed.
- `node -e "const i=require('./bin/install.js'); for (const k of ['preflightInstallTarget','createInstallTransaction','rollbackInstallTransaction']) if (typeof i[k] !== 'function') process.exit(1)"` - passed.
- `bun test tests/cousin-smoke.test.js tests/package-launcher-v3.test.js` - passed.
- `bun test tests/installer-exports.test.js` - passed.
- `bun test --timeout 30000 tests/installer-v3.test.js` - passed.
- `bun test tests/installer-safety.test.js tests/version-provenance.test.js tests/cousin-smoke.test.js tests/package-launcher-v3.test.js tests/installer-exports.test.js` - passed.
- `bunx eslint bin/install.js scripts/lib/package-provenance.js scripts/cousin-smoke.js tests/installer-safety.test.js tests/version-provenance.test.js tests/cousin-smoke.test.js tests/package-launcher-v3.test.js` - passed with existing computed-argv warnings in `bin/install.js`.
- `bun run lint` - passed with 135 warnings and 0 errors.
- `bun run lint:docs` - passed.
- `git diff --check` - passed.

## User Setup Required

None.

## Next Phase Readiness

Ready for Plan 43-03. Installer failure recovery and provenance clarity no longer block the vetted upstream candidate manifest and compatibility matrix work.

---
*Phase: 43-upgrade-resilience-verify-matrix-dogfood*
