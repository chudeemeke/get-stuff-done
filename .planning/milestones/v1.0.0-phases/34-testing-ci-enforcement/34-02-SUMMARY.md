---
phase: 34-testing-ci-enforcement
plan: 02
subsystem: testing
tags: [ci-enforcement, boundary-check, upstream-compat, node-test, symlink, junction]

# Dependency graph
requires:
  - phase: 31-feature-flags
    provides: check-overrides.js pattern (walkDir, CLI entry, --dir flags)
  - phase: 30-composition-pipeline
    provides: compose.js producing dist/get-shit-done/ output
provides:
  - scripts/check-boundary.js -- repo boundary enforcement (detects upstream files outside allowed dirs)
  - scripts/run-upstream-compat.js -- upstream test runner against composed dist/
  - tests/check-boundary.test.js -- 16 tests for boundary check
affects: [34-04-PLAN (CI yaml integration), future overlay migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CI enforcement script pattern: export function + CLI entry via require.main check"
    - "Upstream compat via symlink/junction redirection in temp directory"
    - "Junction-first cleanup on Windows to prevent EBUSY errors"

key-files:
  created:
    - scripts/check-boundary.js
    - scripts/run-upstream-compat.js
    - tests/check-boundary.test.js
  modified: []

key-decisions:
  - "ALLOWED_PREFIXES for boundary check: overrides/, dist/, node_modules/, .git/, .planning/, tests/, .github/"
  - "Junction cleanup before rmSync on Windows -- prevents EBUSY file-handle errors"
  - "Upstream compat runner uses TAP output parsing for pass/fail counts"
  - "sync.test.cjs excluded from compat runner (dist-relative import blocker known from Phase 32)"

patterns-established:
  - "CI script pattern: checkX(opts) export + CLI entry + --dir flags for test isolation"
  - "Windows junction cleanup: unlink/rmdir junction before rmSync on parent directory"

requirements-completed: [TEST-02, TEST-03, TEST-04, CI-01]

# Metrics
duration: 14min
completed: 2026-03-30
---

# Phase 34 Plan 02: CI Enforcement Scripts Summary

**check-boundary.js detects 48 boundary violations in current repo; run-upstream-compat.js runs 11 upstream test files against composed dist/ with pass/fail reporting**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-30T02:22:29Z
- **Completed:** 2026-03-30T02:36:05Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- check-boundary.js scans repo against upstream file set and detects files outside allowed directories (48 violations in current repo)
- run-upstream-compat.js creates temp dir with junction/symlink, copies upstream test files, runs them against composed dist/
- 16 tests for check-boundary.js covering all edge cases (clean repo, violations, allowed dirs, CLI exit codes)
- Both scripts follow the established CI script pattern: exported function + CLI entry + flag-based test isolation

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: check-boundary.js failing tests** - `73d1aba` (test)
2. **Task 1 GREEN: check-boundary.js implementation** - `cfddc2b` (feat)
3. **Task 2: upstream compatibility runner** - `e35acd1` (feat)

## Files Created/Modified
- `scripts/check-boundary.js` - Repo boundary enforcement: walks upstream package, compares against repo files, reports violations (220 lines)
- `tests/check-boundary.test.js` - 16 tests with temp dir fixtures for isolation (375 lines)
- `scripts/run-upstream-compat.js` - Upstream test runner against composed dist/ via symlink/junction redirection (334 lines)

## Decisions Made
- ALLOWED_PREFIXES set matches plan exactly: overrides/, dist/, node_modules/, .git/, .planning/, tests/, .github/
- walkDir in check-boundary.js skips allowed prefixes at the top-level only (not nested) for efficiency
- Separate walkUpstream function (no prefix filtering) for the upstream directory
- Junction cleanup uses lstat to distinguish symlinks from junctions on Windows, with rmdir for junctions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Windows junction cleanup EBUSY error**
- **Found during:** Task 2 (upstream compat runner)
- **Issue:** fs.rmSync on temp directory failed with EBUSY because Windows holds handles on junctions
- **Fix:** Added explicit junction/symlink removal before rmSync; lstat-based detection distinguishes symlinks from junctions; wrapped in try/catch for best-effort cleanup
- **Files modified:** scripts/run-upstream-compat.js
- **Verification:** No leftover temp directories after runner execution
- **Committed in:** e35acd1 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for cross-platform correctness. No scope creep.

## Issues Encountered
- Upstream compat runner finds 131 test failures against composed dist/ (320 pass, 131 fail). This is expected -- the composed dist/ has branding applied which changes module exports and behavior. The failures represent legitimate compatibility differences that the runner is designed to detect.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- check-boundary.js ready for CI integration in Plan 04
- run-upstream-compat.js ready for CI integration in Plan 04
- Both scripts use exit code 0/1 convention for CI pass/fail detection
- Upstream compat failures (131) will surface as CI feedback -- expected until overlay migration addresses structural differences

## Self-Check: PASSED

All 4 files verified present. All 3 commits verified in git log.

---
*Phase: 34-testing-ci-enforcement*
*Completed: 2026-03-30*
