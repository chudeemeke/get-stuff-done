---
phase: 35-migration-ship-v3-0-0
plan: 01
subsystem: infra
tags: [package.json, installer, launcher, v3.0, npm-publish, safety-guard]

requires:
  - phase: 33-overlay-installer-boundary
    provides: compose pipeline producing dist/, overlay manifest, install.js delegation
provides:
  - package.json v3.0 shipping configuration (files, prepublishOnly)
  - bin/gsd.js dual-source import pattern (dist/ primary, overlay/ fallback)
  - Non-interactive v2.x cleanup with safety guards
  - --force as quiet mode for scripted installs
affects: [35-02, 35-03]

tech-stack:
  added: []
  patterns: [tryRequire fallback for dual-source imports, isSafeToClean guard pattern]

key-files:
  created:
    - tests/package-launcher-v3.test.js
  modified:
    - package.json
    - bin/gsd.js
    - bin/install.js
    - tests/installer-v3.test.js

key-decisions:
  - "tryRequire() fallback pattern for dist/src vs overlay/src (not conditional require)"
  - "Safety guard checks home dir, root, and path depth (< 2 segments = refuse)"
  - "--force kept as quiet mode per review consensus (suppress banner, not removed)"
  - "Negative detection tests verify fresh dirs and v3.0 installs are not false-positived"

patterns-established:
  - "tryRequire(distPath, overlayPath): try dist/ first, catch and fallback to overlay/src/"
  - "isSafeToClean(): structural guard preventing deletion of dangerous paths"

requirements-completed: [MIG-03, MIG-04, MIG-05]

duration: 8min
completed: 2026-03-30
---

# Phase 35 Plan 01: Package/Launcher/Installer v3.0 Summary

**package.json ships dist/ with compose pipeline, launcher uses dual-source imports, installer auto-cleans v2.x non-interactively with safety guards**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-30T19:42:01Z
- **Completed:** 2026-03-30T19:50:21Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- package.json files array updated to ship dist/, bin/, overlay/branding.json, overlay/features.json (no more source in npm package)
- prepublishOnly changed from v2.x build pipeline to `bun run compose`
- bin/gsd.js uses tryRequire() to load from dist/src/ (npm) with fallback to overlay/src/ (local dev)
- v2.x cleanup is fully non-interactive with migration banner; --force suppresses banner for scripted installs
- Safety guard (isSafeToClean) prevents deletion of home directory, filesystem root, or shallow paths
- 26 total tests across both test files, all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Update package.json and fix launcher imports with local dev fallback** - `ea80eff` (feat)
2. **Task 2: Make v2.x cleanup non-interactive with safety guards** - `bc6be86` (feat)

## Files Created/Modified
- `package.json` - v3.0 files array and prepublishOnly script
- `bin/gsd.js` - tryRequire dual-source imports (dist/ primary, overlay/ fallback)
- `bin/install.js` - Non-interactive cleanupV2, isSafeToClean guard, removed readline/askConfirmation
- `tests/package-launcher-v3.test.js` - 7 tests for package config and launcher imports
- `tests/installer-v3.test.js` - Updated INST-05 tests + 7 new tests (quiet mode, negatives, safety guard)

## Decisions Made
- tryRequire() chosen over conditional require or environment detection -- simpler, works in all scenarios
- Safety guard uses path.parse() to detect root, os.homedir() for home, and segment counting for shallow paths
- --force parameter meaning changed from "skip confirmation" to "quiet mode" -- same variable name, new semantics
- Negative detection tests added to catch false positives in v2.x detection logic

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- package.json is ready for v3.0 publish (files array, prepublishOnly)
- Launcher works from both npm package and local dev
- Installer handles v2.x upgrades safely and non-interactively
- Ready for Plan 02 (version bump and final pre-publish checks)

## Self-Check: PASSED

All files verified present. All commit hashes verified in git log.

---
*Phase: 35-migration-ship-v3-0-0*
*Completed: 2026-03-30*
