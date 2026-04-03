---
phase: 38-statusline-deployment
plan: 01
subsystem: hooks
tags: [statusline, hooks, overlay, esbuild, compose, timeout]

# Dependency graph
requires:
  - phase: 36-overlay-architecture
    provides: overlay composition pipeline and manifest system
provides:
  - Fork-specific hooks relocated to overlay/hooks/ for standard composition
  - 3s stdin timeout guard on statusline
  - 3s git fetch timeout on check-update (was 15s)
  - Build and parity scripts updated for overlay/hooks/ source paths
affects: [38-statusline-deployment plan 02, installer, compose pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fork hooks in overlay/hooks/ follow standard overlay composition"
    - "stdin timeout guard (belt-and-suspenders) for non-blocking hook execution"

key-files:
  created:
    - overlay/hooks/gsd-statusline.js
    - overlay/hooks/gsd-check-update.js
  modified:
    - scripts/build.js
    - scripts/check-parity.js
    - tests/hooks.test.js
    - tests/compose.test.js

key-decisions:
  - "Hooks moved to overlay/hooks/ to use standard compose pipeline (no special cases)"
  - "require paths updated to ../../src/ for 2-level depth from overlay/hooks/"
  - "pre-compact.js left with existing ../src/ path (bundled via esbuild, never run directly)"

patterns-established:
  - "Fork hooks live in overlay/hooks/, bundled to hooks/dist/ via esbuild"

requirements-completed: [STAT-01, STAT-03]

# Metrics
duration: 12min
completed: 2026-04-03
---

# Phase 38 Plan 01: Statusline Deployment -- Hook Relocation Summary

**Fork hooks relocated to overlay/hooks/ with 3s timeout fixes, require-path corrections, and build/parity tooling updates**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-03T01:49:47Z
- **Completed:** 2026-04-03T02:02:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Moved gsd-statusline.js (254 lines) and gsd-check-update.js (193 lines) from hooks/ to overlay/hooks/ so the compose pipeline includes them in dist/ and the overlay manifest
- Fixed require paths from ../src/ to ../../src/ for the 2-level depth of overlay/hooks/
- Added 3s stdin timeout guard to statusline (D-08) with clearTimeout in end handler
- Reduced git fetch timeout from 15s to 3s in check-update (D-07)
- Updated scripts/build.js to bundle from overlay/hooks/ instead of hooks/
- Updated scripts/check-parity.js to check overlay/hooks/ paths
- Verified compose produces dist/hooks/gsd-statusline.js and dist/hooks/gsd-check-update.js
- Overlay manifest now includes both hooks

## Task Commits

Each task was committed atomically (TDD RED-GREEN):

1. **Task 1: Move hooks to overlay, fix require paths, fix timeouts, update build/parity scripts**
   - `09ec22c` (test: RED -- failing tests for relocation)
   - `54fb584` (feat: GREEN -- move hooks, fix paths/timeouts)
2. **Task 2: Update tests for moved hooks and new behaviors**
   - `a27f9db` (test: compose fixture and manifest tests)

_TDD: RED tests written first to verify new paths and behaviors, then implementation made them GREEN._

## Files Created/Modified
- `overlay/hooks/gsd-statusline.js` - Fork's enhanced 254-line statusline (moved from hooks/)
- `overlay/hooks/gsd-check-update.js` - Fork's check-update with maintainer git fetch (moved from hooks/)
- `scripts/build.js` - HOOKS_DIR now points to overlay/hooks/, DIST_DIR remains hooks/dist/
- `scripts/check-parity.js` - hookFiles array and source check updated to overlay/hooks/
- `tests/hooks.test.js` - Paths updated, 7 new behavior tests added (timeouts, require depth, tooling refs)
- `tests/compose.test.js` - createMockOverlay includes hook files, manifest inclusion test added

## Decisions Made
- Hooks moved to overlay/hooks/ to use standard compose pipeline with zero special-casing
- require paths updated from ../src/ to ../../src/ because depth changed from 1 level (hooks/) to 2 levels (overlay/hooks/)
- pre-compact.js in overlay/hooks/ left with existing ../src/ path -- it is only used through esbuild bundling, not run directly from overlay/hooks/
- hooks/gsd-context-monitor.js left in hooks/ root -- it uses only Node built-ins (fs, os, path) with no ConfigLoader dependency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- overlay/hooks/ now contains all fork-specific hooks (gsd-statusline, gsd-check-update, pre-compact)
- Compose pipeline confirmed to include hooks in dist/ and overlay manifest
- Build script bundles from overlay/hooks/ to hooks/dist/
- Ready for Phase 38 Plan 02 (remaining statusline deployment tasks)

## Self-Check: PASSED

All 6 created/modified files exist. All 3 task commits verified. Both original files confirmed deleted.

---
*Phase: 38-statusline-deployment*
*Completed: 2026-04-03*
