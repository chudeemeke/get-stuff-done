---
phase: 37-installer-safety
plan: 01
subsystem: testing
tags: [installer, safety, manifest, tdd, bun-test, require-guard]

# Dependency graph
requires:
  - phase: 36-overlay-architecture
    provides: bin/install.js with manifest-driven cleanup functions (post-wipe rewrite)
provides:
  - Testable installer module (6 exported functions + INSTALLED_MANIFEST_NAME constant)
  - 23 unit tests proving INST-01 (manifest removal preserves user content), INST-02 (no false positive on src/), INST-03 (legacy fallback scoped to known dirs)
  - 4 export verification tests (exports exist, constant correct, no side effects on require, stale test removed)
affects: [installer-v3-tests, future-installer-changes, deployment-hardening]

# Tech tracking
tech-stack:
  added: []
  patterns: [require.main guard for CLI/module dual use, INSTALLED_MANIFEST_NAME export for test consistency]

key-files:
  created:
    - tests/installer-safety.test.js
    - tests/installer-exports.test.js
  modified:
    - bin/install.js
    - tests/installer-v3.test.js

key-decisions:
  - "require.main === module guard instead of conditional module.exports -- cleaner, prevents main() execution on require()"
  - "Export INSTALLED_MANIFEST_NAME alongside functions -- tests use the constant instead of hardcoding the filename (per Gemini review)"
  - "Delete stale src/ fingerprint test rather than update -- old assertion contradicts INST-02, replacement covered in installer-safety.test.js"

patterns-established:
  - "CLI/module dual use: require.main guard + module.exports at bottom of bin/ scripts"
  - "User content fixture pattern: USER_CONTENT object + populateUserContent/assertUserContentIntact helpers"

requirements-completed: [INST-01, INST-02, INST-03]

# Metrics
duration: 4min
completed: 2026-04-02
---

# Phase 37 Plan 01: Installer Safety Summary

**Testable installer module with 27 unit tests proving manifest-driven cleanup preserves user content, detectV2 has no false positives, and legacy fallback is scoped to known directories**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-02T17:31:01Z
- **Completed:** 2026-04-02T17:35:13Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Extracted 6 safety functions + INSTALLED_MANIFEST_NAME constant as exports from bin/install.js behind a require.main guard
- Wrote 23 unit tests covering all 4 safety functions: readInstalledManifest (4 tests), removeGsdFiles (6 tests), detectV2 (9 tests), isSafeToClean (4 tests)
- Wrote 4 export verification tests confirming module contract and zero side effects on require
- Removed stale "src/ directory fingerprint" test that asserted the pre-wipe bug behavior
- Proved INST-01: manifest-driven removal preserves 8 user content types (CLAUDE.md, rules/, projects/, settings.json, skills/, scripts/, commands/)
- Proved INST-02: detectV2 returns false for overlay src/, src/-alone, and get-shit-done-only baseline
- Proved INST-03: legacy fallback removes only get-stuff-done/ and get-shit-done/ directories

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract safety function exports + fix stale test** - `099a992` (refactor)
2. **Task 2: Write installer safety unit tests** - `7fadc16` (test)

## Files Created/Modified

- `bin/install.js` - Added require.main guard + module.exports block (6 functions + 1 constant)
- `tests/installer-safety.test.js` - 23 unit tests for all 4 safety functions (474 lines)
- `tests/installer-exports.test.js` - 4 tests verifying exports, constant value, no side effects, stale test removed
- `tests/installer-v3.test.js` - Removed stale "detects v2.x via src/ directory fingerprint" test block

## Decisions Made

- **require.main guard placement:** Added at line 554, replacing the unconditional main() call. This prevents subprocess spawning when the file is required as a module, while preserving CLI behavior when run directly.
- **INSTALLED_MANIFEST_NAME export:** Per Gemini review feedback, exported the constant alongside functions so tests never hardcode the manifest filename. If the filename changes, tests adapt automatically.
- **Stale test deletion vs update:** Deleted the "src/ fingerprint" test entirely rather than updating it. The old test asserted the bug behavior (src/ triggers v2 detection). The correct assertion (src/ does NOT trigger detection) is covered comprehensively in the new installer-safety.test.js with two dedicated tests.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All installer safety functions are now directly testable via require('../bin/install.js')
- 27 total new tests (23 safety + 4 export) provide a regression safety net for any future installer changes
- The existing 14 failing subprocess tests in installer-v3.test.js remain unchanged (upstream environmental issue, tracked separately)
- Ready for subsequent deployment hardening phases

## Self-Check: PASSED

- All 5 created/modified files exist on disk
- Both task commits (099a992, 7fadc16) found in git log
- 27 tests pass (23 safety + 4 export), 0 failures

---
*Phase: 37-installer-safety*
*Completed: 2026-04-02*
