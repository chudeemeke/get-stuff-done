---
phase: quick-3
plan: 01
subsystem: testing
tags: [execFileSync, MINGW, shell-expansion, cross-platform]

# Dependency graph
requires:
  - phase: 18-upstream-sync-execution
    provides: upstream test infrastructure (helpers.cjs, state.test.cjs)
provides:
  - runGsdToolsDirect helper for shell-safe CLI argument passing
  - Dollar-sign tests that execute assertions on all platforms
affects: [future tests needing shell-sensitive arguments]

# Tech tracking
tech-stack:
  added: []
  patterns: [execFileSync array form for shell-safe CLI invocation]

key-files:
  created: []
  modified:
    - tests/helpers.cjs
    - tests/state.test.cjs

key-decisions:
  - "Used process.execPath instead of string 'node' for portability across CI environments"
  - "Kept runGsdTools unchanged -- new helper is additive, not a replacement"

patterns-established:
  - "runGsdToolsDirect pattern: use execFileSync with array args when CLI arguments contain dollar signs or other shell-sensitive characters"

requirements-completed: [OPEN-ITEM-1]

# Metrics
duration: 2min
completed: 2026-02-25
---

# Quick Task 3: Fix Dollar-Sign Test Approach Summary

**execFileSync array-form helper (runGsdToolsDirect) replaces early-return guards so dollar-sign tests execute on all platforms including Windows MINGW**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T05:56:27Z
- **Completed:** 2026-02-25T05:58:33Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `runGsdToolsDirect(argsArray, cwd)` helper to tests/helpers.cjs using `execFileSync` array form
- Removed `if (process.platform === 'win32') return;` guards from 2 dollar-sign tests
- Both tests now execute their full assertion chains on Windows MINGW without shell expansion
- Existing tests (including file-input variants) remain unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Add runGsdToolsDirect helper** - `44c9f49` (feat)
2. **Task 2: Update dollar-sign tests** - `b585a43` (fix)

## Files Created/Modified
- `tests/helpers.cjs` - Added execFileSync import and runGsdToolsDirect function + export
- `tests/state.test.cjs` - Updated import, replaced 2 early-return tests with runGsdToolsDirect calls

## Decisions Made
- Used `process.execPath` instead of literal `'node'` string for the Node binary path -- handles CI environments where the binary name may differ
- Kept `runGsdTools` completely unchanged -- dozens of other tests use it with string args that have no shell-expansion issues

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Steps
- Open item #1 is resolved
- Remaining open items: Phase 21/22 scope reassessment, multi-runtime support (future milestone)

## Self-Check: PASSED

All files exist. All commits verified.

---
*Quick Task: 3-fix-the-dollar-sign-test-approach*
*Completed: 2026-02-25*
