---
phase: 37-installer-safety
plan: 02
subsystem: testing
tags: [installer, safety, path-traversal, uninstall, manifest, tdd, security]

# Dependency graph
requires:
  - phase: 37-installer-safety
    plan: 01
    provides: Testable installer module with 23 unit tests and 6 exported functions
provides:
  - Path containment guard in removeGsdFiles preventing manifest-driven path traversal
  - Exported uninstall() function testable via { exit: false } option
  - Dual-stream side-effect verification (stdout + stderr) on require()
  - 8 new tests (5 traversal + 3 uninstall) bringing total to 35
affects: [installer-changes, deployment-hardening, future-manifest-operations]

# Tech tracking
tech-stack:
  added: []
  patterns: [path.resolve + startsWith containment guard, { exit: false } testable mode for process.exit functions]

key-files:
  created: []
  modified:
    - bin/install.js
    - tests/installer-safety.test.js
    - tests/installer-exports.test.js

key-decisions:
  - "Cross-platform path containment: path.resolve + resolvedTarget + path.sep + startsWith -- handles both Unix and Windows path semantics"
  - "Absolute path tests use path.relative to construct escaping paths that work on any OS, not hardcoded /etc/passwd or C:\\Windows"
  - "uninstall() testable mode via { exit: false } options object instead of mocking process.exit -- cleaner, no mock leaks"

patterns-established:
  - "Path containment guard: resolve both target and candidate, verify candidate startsWith(target + sep) before any fs operation"
  - "Testable process.exit functions: accept { exit: false } option, return result when false, call process.exit when true (default)"
  - "Dual-stream capture: redirect stderr to temp file via shell, read back for assertion"

requirements-completed: [INST-01, INST-03]

# Metrics
duration: 27min
completed: 2026-04-02
---

# Phase 37 Plan 02: Gap Closure Summary

**Path traversal containment guard in removeGsdFiles, exported uninstall() with testable mode, and dual-stream side-effect verification closing three gaps from Codex cross-AI review**

## Performance

- **Duration:** 27 min
- **Started:** 2026-04-02T18:48:22Z
- **Completed:** 2026-04-02T19:15:36Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Closed HIGH-severity path traversal vulnerability: removeGsdFiles() now rejects manifest entries that resolve outside targetDir via path.resolve + startsWith containment check
- Exported uninstall() as public API with { exit: false } testable mode, proving user content preservation through the public entrypoint (not just internals)
- Strengthened side-effect verification to capture both stdout AND stderr from require(), confirming zero bytes on both streams
- Added `skipped` count to removeGsdFiles return value for observability: { removed, skipped, strategy }
- Applied containment guard to both file removal loop and directory pruning loop (two separate attack surfaces)
- Total test count: 35 (31 safety + 4 export), all passing, 0 regressions

## Task Commits

Each task was committed atomically (TDD RED-GREEN pairs):

1. **Task 1 RED: Failing path traversal tests** - `1eed3e1` (test)
2. **Task 1 GREEN: Path containment guard** - `4003187` (feat)
3. **Task 2 RED: Failing uninstall tests** - `5ef3e47` (test)
4. **Task 2 GREEN: Export uninstall with testable mode** - `67e02bd` (feat)
5. **Task 3: Strengthen side-effect verification** - `47726f1` (test)

## Files Created/Modified

- `bin/install.js` - Path containment guard in removeGsdFiles, skipped count in return value, uninstall() refactored for testable mode, added to module.exports (8 exports)
- `tests/installer-safety.test.js` - 5 path traversal tests + 3 uninstall integration tests (8 new, 31 total)
- `tests/installer-exports.test.js` - Dual-stream capture, updated exports list to 7 functions + 1 constant

## Decisions Made

- **Cross-platform absolute path testing:** Replaced hardcoded `/etc/passwd` and `C:\Windows` with `path.relative`-computed escaping paths. On Windows, `/etc/passwd` via path.join resolves inside targetDir (no escape), so platform-specific absolute paths are not a real attack vector there. The `../` traversal is the universal vulnerability and is tested thoroughly.
- **path.sep appended to resolvedTarget:** Using `resolvedTarget + path.sep` for the startsWith check prevents a subtle bypass where `/tmp/target-evil` would pass a check against `/tmp/target` without the separator.
- **{ exit: false } pattern over mock:** Instead of mocking process.exit, the function accepts an options object. When exit is false, it returns the result. This is cleaner (no mock cleanup), more explicit (function signature documents the option), and safer (no risk of mock leaking to other tests).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cross-platform absolute path test adjustment**
- **Found during:** Task 1 (path containment tests)
- **Issue:** Plan specified tests for `/etc/passwd` and `C:\Windows\System32\evil.txt`, but on Windows `path.join(targetDir, '/etc/passwd')` resolves inside targetDir (no escape), causing tests to hang on assertion failure
- **Fix:** Replaced platform-specific absolute paths with `path.relative`-computed escaping paths that work on both Unix and Windows
- **Files modified:** tests/installer-safety.test.js
- **Verification:** All 5 containment tests pass on Windows; cross-platform behavior confirmed
- **Committed in:** `4003187` (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test adjustment necessary for cross-platform correctness. Same security properties verified. No scope creep.

## Issues Encountered

- bun test on Windows with certain path manipulation tests would hang instead of reporting assertion failures. Added explicit timeout handling and restructured tests to avoid the issue. Not a bun bug per se -- the test created external files that caused bun's cleanup to stall.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All installer safety functions are now comprehensively tested (35 tests across 4 functions + public entrypoint)
- Path traversal vulnerability is closed -- same vulnerability class as the original wipe incident
- Module exports are fully verified with 8 exports (7 functions + 1 constant)
- Side-effect verification covers both output streams
- Ready for Phase 38+ deployment hardening or statusline work

## Self-Check: PASSED

- All 3 modified files exist on disk
- All 5 task commits found in git log:
  - 1eed3e1: test(37-02) RED path traversal
  - 4003187: feat(37-02) GREEN path containment
  - 5ef3e47: test(37-02) RED uninstall
  - 67e02bd: feat(37-02) GREEN uninstall export
  - 47726f1: test(37-02) strengthened side-effect
- 35 tests pass (31 safety + 4 export), 0 failures

---
*Phase: 37-installer-safety*
*Completed: 2026-04-02*
