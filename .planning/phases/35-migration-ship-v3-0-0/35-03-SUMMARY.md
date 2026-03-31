---
phase: 35-migration-ship-v3-0-0
plan: 03
subsystem: infra
tags: [npm-publish, v3.0.0, release, tarball-validation, smoke-test]

requires:
  - phase: 35-01
    provides: package.json v3.0 shipping config, launcher imports, v2.x cleanup
  - phase: 35-02
    provides: v2.4.0-legacy tag, UPGRADING.md rollback documentation
provides:
  - v3.0.0 published to npm registry as @chude/get-stuff-done
  - Git tag v3.0.0 on main
  - Verified installability via bunx
affects: []

tech-stack:
  added: []
  patterns: [artifact-level smoke test via npm pack extraction]

key-files:
  created: []
  modified:
    - .github/workflows/ci.yml

key-decisions:
  - "CI fix: added --ignore-scripts and compose step to all CI jobs for v3.0 overlay architecture"

patterns-established:
  - "Pre-release validation: extract npm pack tarball, verify binaries run from extracted package before publishing"

requirements-completed: [MIG-04, MIG-05]

duration: ~15min
completed: 2026-03-30
---

# Phase 35 Plan 03: Release & Publish v3.0.0 Summary

**Artifact-level tarball validation, npm publish of @chude/get-stuff-done@3.0.0, and post-publish installability verification via bunx**

## Performance

- **Duration:** ~15 min (across checkpoint pause for human-action release/publish)
- **Started:** 2026-03-30
- **Completed:** 2026-03-30
- **Tasks:** 2
- **Files modified:** 1 (.github/workflows/ci.yml)

## Accomplishments

- Validated composed dist/ via npm pack tarball extraction: all expected files present (dist/, bin/gsd.js, bin/install.js, overlay/branding.json, overlay/features.json), excluded files absent (overlay/src/, tests/, scripts/, .planning/)
- Confirmed bin/gsd.js and bin/install.js run successfully from extracted tarball context (the actual artifact users receive)
- Published @chude/get-stuff-done@3.0.0 to npm (268 files, 2.50MB)
- Verified post-publish installability: `bunx @chude/get-stuff-done@3.0.0 --help` runs successfully
- Fixed CI workflows to work with v3.0 overlay architecture (--ignore-scripts, compose step)

## Task Commits

Each task was committed atomically:

1. **Task 1: Compose, verify, and artifact-level smoke test via npm pack** - No commit (validation-only task, no files modified)
2. **Task 2: Release v3.0.0, publish to npm, and verify installability** - `311921b` (chore: bump version to 3.0.0) + `36a9ca9` (fix: CI for v3.0 overlay architecture)

## Files Created/Modified

- `.github/workflows/ci.yml` - Added --ignore-scripts and compose step to all CI jobs for v3.0 overlay architecture

## Decisions Made

- CI fix was necessary as a deviation: the v3.0 overlay architecture requires a compose step before tests can find dist/ files, and --ignore-scripts prevents npm lifecycle scripts from running during CI install

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CI workflow needed --ignore-scripts and compose step**
- **Found during:** Task 2 (release process)
- **Issue:** CI jobs failed because v3.0 overlay architecture requires composition before tests, and npm lifecycle scripts interfere with CI install
- **Fix:** Added --ignore-scripts to install commands and a compose step to all CI jobs
- **Files modified:** .github/workflows/ci.yml
- **Verification:** CI passes after fix
- **Committed in:** 36a9ca9

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for CI to work with the new architecture. No scope creep.

## Issues Encountered

None beyond the CI fix documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

This is the final plan of the final phase of the v1.0.0 milestone. The overlay architecture is shipped:

- @chude/get-stuff-done@3.0.0 is live on npm
- v2.4.0-legacy tag available for rollback
- UPGRADING.md documents migration path
- CI enforces boundary checks, override staleness, and coverage
- Composition pipeline produces dist/ from upstream devDep + overlay/

## Self-Check: PASSED

- FOUND: 35-03-SUMMARY.md
- FOUND: 311921b (release commit)
- FOUND: 36a9ca9 (CI fix commit)
- FOUND: .github/workflows/ci.yml

---
*Phase: 35-migration-ship-v3-0-0*
*Completed: 2026-03-30*
