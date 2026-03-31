---
phase: 34-testing-ci-enforcement
plan: 01
subsystem: testing
tags: [node-test, coverage, sync, symlink, junction, supply-chain]

# Dependency graph
requires:
  - phase: 29-overlay-architecture
    provides: overlay/lib/sync.cjs with dist-relative import path
provides:
  - sync.cjs source-tree testing via symlink shim
  - 94.86% line coverage on overlay/lib/sync.cjs (from ~5% baseline)
  - captureCmd pattern for testing process.exit-calling functions in-process
affects: [34-testing-ci-enforcement, coverage-reporting]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Symlink/junction shim for dist-relative imports in source-tree tests"
    - "captureCmd: intercept process.exit and stdout/stderr for in-process CLI function testing"

key-files:
  created: []
  modified:
    - tests/sync.test.cjs
    - .gitignore

key-decisions:
  - "Junction placed at overlay/get-shit-done (not project root) -- require resolution from overlay/lib/ needs .. to reach overlay/, not project root"
  - "captureCmd pattern over subprocess: node --test coverage only tracks in-process code, not child processes"
  - "process.on('exit') cleanup is best-effort; junction is gitignored and setup is idempotent"

patterns-established:
  - "Symlink shim pattern: for modules with dist-relative imports, create junction at the resolved parent directory"
  - "captureCmd helper: monkey-patch process.exit/stdout.write/stderr.write to test functions that call process.exit"

requirements-completed: [TEST-01, TEST-04]

# Metrics
duration: 56min
completed: 2026-03-30
---

# Phase 34 Plan 01: Sync Coverage Summary

**Symlink shim enables source-tree testing of overlay/lib/sync.cjs, closing the largest coverage gap from ~5% to 94.86% lines / 97.10% functions**

## Performance

- **Duration:** 56 min
- **Started:** 2026-03-30T02:21:51Z
- **Completed:** 2026-03-30T03:17:33Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Resolved the dist-relative import blocker: sync.cjs requires `../get-shit-done/bin/lib/core.cjs` which only resolves from composed dist/ -- junction at `overlay/get-shit-done` -> `get-stuff-done/` makes it resolve from source tree
- Coverage on overlay/lib/sync.cjs: 94.86% lines, 84.16% branches, 97.10% functions (from ~5% baseline)
- 153 tests total (126 original + 27 new), 0 failures, 0 skipped
- captureCmd helper pattern for testing functions that call process.exit() in-process

## Task Commits

Each task was committed atomically:

1. **Task 1: RED -- verify sync.test.cjs fails without shim, then add symlink shim** - `6e0e739` (test)
2. **Task 2: GREEN -- ensure comprehensive sync.cjs test coverage** - `3fca83b` (test)

## Files Created/Modified
- `tests/sync.test.cjs` - Added symlink shim setup, captureCmd helper, 27 new tests for coverage gaps
- `.gitignore` - Added `overlay/get-shit-done` to prevent symlink from being tracked

## Decisions Made
- **Junction path at overlay/ not project root:** The `require('../get-shit-done/...')` in `overlay/lib/sync.cjs` resolves `..` to `overlay/`, not project root. The junction must be at `overlay/get-shit-done`.
- **captureCmd over subprocess testing:** Node.js test coverage (`--experimental-test-coverage`) only tracks V8 coverage in the main process, not child processes spawned via execSync. To get coverage on overlay/lib/sync.cjs for cmd* functions, they must be called in-process with process.exit intercepted.
- **Best-effort cleanup:** The junction is gitignored and setup is idempotent (checks existsSync before creating). process.on('exit') cleanup may not fire reliably with node --test, so leftover junctions are harmless.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Junction path correction: overlay/ not project root**
- **Found during:** Task 1 (symlink shim creation)
- **Issue:** Plan specified creating symlink at `{PROJECT_ROOT}/get-shit-done`, but `../get-shit-done/` from `overlay/lib/sync.cjs` resolves to `overlay/get-shit-done/`, not project root
- **Fix:** Changed SHIM_PATH from `path.join(PROJECT_ROOT, 'get-shit-done')` to `path.join(PROJECT_ROOT, 'overlay', 'get-shit-done')`
- **Files modified:** tests/sync.test.cjs, .gitignore
- **Verification:** `node --test tests/sync.test.cjs` passes all 126 tests after correction
- **Committed in:** 6e0e739

---

**Total deviations:** 1 auto-fixed (1 bug in plan's path specification)
**Impact on plan:** Essential correction. Plan incorrectly assumed `..` from `overlay/lib/` resolves to project root.

## Issues Encountered
- `fs.rmSync` on Windows junctions follows the junction and tries to remove target contents. Fixed by using `fs.unlinkSync` which removes the junction entry only.
- `process.on('exit')` handlers have limited I/O capability; cleanup is best-effort. The junction is gitignored so leftover shims are harmless.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- sync.cjs coverage gap closed -- the largest single-file drag on overall metrics is resolved
- Remaining uncovered lines (74 of 1420) are conditional rendering branches in cmdSyncPreview's human-readable output formatter (ANSI color selection, filter flag display, effort estimate formatting)
- captureCmd pattern available for reuse in other tests needing process.exit interception

---
*Phase: 34-testing-ci-enforcement*
*Completed: 2026-03-30*
