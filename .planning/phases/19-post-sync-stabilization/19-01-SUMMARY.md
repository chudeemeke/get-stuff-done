---
phase: 19-post-sync-stabilization
plan: "01"
subsystem: infra
tags: [esbuild, bundling, copy-mode, install, dist, gsd-tools]

# Dependency graph
requires:
  - phase: 18-upstream-sync-execution
    provides: gsd-tools modular split (thin router + 11 lib/*.cjs modules) introduced the naming mismatch
provides:
  - esbuild pipeline producing dist/gsd-tools.cjs (correctly named for workflow compatibility)
  - install.js copy-mode targeting gsd-tools.cjs (correct file for workflows calling node gsd-tools.cjs)
affects: [copy-mode-install, workflow-execution, 19-03-coverage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "esbuild outfile naming: dist output name must match the filename workflows call (gsd-tools.cjs)"

key-files:
  created: []
  modified:
    - scripts/build.js
    - bin/install.js
    - tests/gsd-tools.test.js

key-decisions:
  - "Renamed dist output from gsd-tools.js to gsd-tools.cjs to match what workflows call via `node gsd-tools.cjs`"
  - "Updated test names and DIST_TOOLS_PATH constant together to keep grep verification clean"

patterns-established:
  - "Dist output filename must match the invocation path in workflow files (node gsd-tools.cjs)"

requirements-completed:
  - SYNC-II-03

# Metrics
duration: 4min
completed: 2026-02-23
---

# Phase 19 Plan 01: esbuild Dist Naming Fix Summary

**esbuild bundling pipeline renamed dist output from gsd-tools.js to gsd-tools.cjs, fixing copy-mode installs so workflows can call `node gsd-tools.cjs` against the self-contained bundle**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-23T08:32:15Z
- **Completed:** 2026-02-23T08:36:32Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Fixed esbuild pipeline to produce `get-stuff-done/bin/dist/gsd-tools.cjs` instead of `gsd-tools.js`
- Updated `bin/install.js` copy-mode logic to overwrite `bin/gsd-tools.cjs` with the bundle (was overwriting `bin/gsd-tools.js`)
- Updated `tests/gsd-tools.test.js` DIST_TOOLS_PATH constant and test names to reference `.cjs`
- All 649 tests pass; copy-mode simulation confirms bundle works in isolation without access to lib/ or src/

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename dist output to gsd-tools.cjs in build pipeline and install.js** - `24fd790` (fix)
2. **Task 2: Run full test suite and verify end-to-end copy-mode simulation** - verification only, no code changes

**Plan metadata:** (docs commit, see below)

## Files Created/Modified

- `scripts/build.js` - Changed `dest` variable from `gsd-tools.js` to `gsd-tools.cjs` in `buildGsdTools()`
- `bin/install.js` - Updated `bundledToolsSrc` and `installedTools` path constants to reference `gsd-tools.cjs`
- `tests/gsd-tools.test.js` - Updated `DIST_TOOLS_PATH` constant and 6 test descriptions from `.js` to `.cjs`

## Decisions Made

- Renamed the dist output to `.cjs` rather than keeping `.js` and updating install.js path only: semantically correct (the file is a CommonJS module), and aligns with the source router filename (`gsd-tools.cjs`)
- Updated test descriptions alongside the path constant to ensure `grep -n "gsd-tools.js"` returns clean results across all three files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated test description strings referencing gsd-tools.js**

- **Found during:** Task 1 verification
- **Issue:** The plan's verification criterion (`grep -n "gsd-tools.js" tests/gsd-tools.test.js` returns NO results) was not met because 6 test description strings and 1 comment still contained `gsd-tools.js` after updating the path constant
- **Fix:** Updated all 6 test descriptions and the comment section header from `gsd-tools.js` to `gsd-tools.cjs`
- **Files modified:** tests/gsd-tools.test.js
- **Verification:** `grep -n "gsd-tools.js" tests/gsd-tools.test.js` returns no results
- **Committed in:** 24fd790 (included in Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — test string references alongside path constant)
**Impact on plan:** Auto-fix necessary to meet plan's own verification criterion. Correct behavior: test names now accurately describe the actual file being tested.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SYNC-II-03 complete: copy-mode installs now produce a working gsd-tools.cjs bundle
- Plan 19-02 (assessment reports) is already complete (19-02-SUMMARY.md exists)
- Plan 19-03 (platform coverage fix: 94% -> 95%+) is the remaining prerequisite for Phase 19 completion
- Phase 19 will be complete after Plan 19-03 executes

---
*Phase: 19-post-sync-stabilization*
*Completed: 2026-02-23*
