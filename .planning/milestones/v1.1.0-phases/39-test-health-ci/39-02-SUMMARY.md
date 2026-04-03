---
phase: 39-test-health-ci
plan: 02
subsystem: testing
tags: [bun-test, node-test, subprocess, timeout, windows, cross-platform]

requires:
  - phase: 37-installer-safety
    provides: Installer test suite and helpers infrastructure
provides:
  - Central timeout constants module (tests/helpers/test-timeouts.js)
  - Consistent subprocess timeout handling across sync and hooks test suites
affects: [39-test-health-ci, future-test-suites]

tech-stack:
  added: []
  patterns: [central-timeout-constants, import-constant-over-hardcode]

key-files:
  created:
    - tests/helpers/test-timeouts.js
  modified:
    - tests/helpers/index.js
    - tests/sync.test.cjs
    - tests/hooks.test.js

key-decisions:
  - "15000ms for standard subprocess tests, 30000ms for heavy multi-subprocess tests"
  - "Constants in dedicated module re-exported via helpers/index.js barrel"

patterns-established:
  - "Central timeout constants: import { SUBPROCESS_TIMEOUT } from helpers and use in test options"
  - "New subprocess tests get correct timeout by importing constant, not hardcoding"

requirements-completed: [TEST-02, TEST-03]

duration: 10min
completed: 2026-04-03
---

# Phase 39 Plan 02: Subprocess Timeout Constants Summary

**Central timeout constants (SUBPROCESS_TIMEOUT 15s, HEAVY_SUBPROCESS_TIMEOUT 30s) replacing 28 hardcoded timeout values across sync.test.cjs and hooks.test.js**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-03T11:49:28Z
- **Completed:** 2026-04-03T11:59:53Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created tests/helpers/test-timeouts.js with SUBPROCESS_TIMEOUT (15000ms) and HEAVY_SUBPROCESS_TIMEOUT (30000ms) constants
- Replaced all 20 hardcoded `{ timeout: 15000 }` and 1 hardcoded `{ timeout: 30000 }` in sync.test.cjs
- Replaced all hardcoded timeout values in hooks.test.js maintainer path tests (7 instances)
- Added missing timeout to sync-preview `--json` schema test that previously used the 5000ms bun default
- Removed redundant trailing numeric timeout on background process test in hooks.test.js
- All 153 sync tests and 50 hooks tests pass on Windows

## Task Commits

Each task was committed atomically:

1. **Task 1: Create central timeout constants module** - `74a508e` (feat)
2. **Task 2: Apply timeout constants to sync.test.cjs and hooks.test.js** - `9671d6c` (refactor)

Note: hooks.test.js changes were partially applied by a parallel agent (39-03) working on the same file. The timeout constant import and replacements in hooks.test.js were committed in that agent's work. This plan's Task 2 commit contains the sync.test.cjs changes.

## Files Created/Modified
- `tests/helpers/test-timeouts.js` - Central timeout constants (SUBPROCESS_TIMEOUT, HEAVY_SUBPROCESS_TIMEOUT)
- `tests/helpers/index.js` - Re-exports timeout constants from barrel module
- `tests/sync.test.cjs` - 21 tests now use imported constants instead of hardcoded values
- `tests/hooks.test.js` - 7 tests now use imported constants instead of hardcoded values

## Decisions Made
- 15000ms for SUBPROCESS_TIMEOUT: matches the Phase 37 convention for subprocess-heavy tests on Windows
- 30000ms for HEAVY_SUBPROCESS_TIMEOUT: for tests that spawn multiple subprocesses or do heavy git operations
- Dedicated module in tests/helpers/ with re-export from index.js: follows existing helper pattern (mock-fs, mock-process, mock-child-process)
- execSync call-level timeouts also use the constant: keeps subprocess kill timeout consistent with test-level timeout

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] hooks.test.js changes overlapped with parallel agent**
- **Found during:** Task 2 (committing hooks.test.js)
- **Issue:** Parallel agent (39-03) had already applied timeout constant changes to hooks.test.js as part of its own work
- **Fix:** No fix needed -- the file was already in the correct state. Committed sync.test.cjs changes only.
- **Files modified:** None additional
- **Verification:** git diff confirmed hooks.test.js matches expected state at HEAD

---

**Total deviations:** 1 (parallel execution overlap, no code impact)
**Impact on plan:** No scope creep. All intended changes are in place, committed across two agents.

## Issues Encountered
None beyond the parallel agent overlap noted above.

## Known Stubs
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Timeout constants available for any future subprocess test via `require('./helpers')`
- sync.test.cjs and hooks.test.js pass reliably on Windows
- TEST-02 and TEST-03 requirements satisfied

## Self-Check: PASSED

- All 4 files exist (test-timeouts.js, index.js, sync.test.cjs, hooks.test.js)
- Both commits found (74a508e, 9671d6c)
- 0 hardcoded timeout:15000 in sync.test.cjs
- 0 hardcoded timeout:30000 in sync.test.cjs
- 23 SUBPROCESS_TIMEOUT references in sync.test.cjs
- 9 SUBPROCESS_TIMEOUT references in hooks.test.js
- 153/153 sync tests pass, 50/50 hooks tests pass

---
*Phase: 39-test-health-ci*
*Completed: 2026-04-03*
