---
phase: 35-migration-ship-v3-0-0
plan: 02
subsystem: migration
tags: [git-tags, upgrading, rollback, documentation]

requires:
  - phase: 35-01
    provides: package.json v3.0, launcher imports, v2.x cleanup logic
provides:
  - v2.4.0-legacy annotated tag on origin for rollback reference
  - UPGRADING.md with migration, rollback, and architecture comparison
affects: [35-03]

tech-stack:
  added: []
  patterns: [annotated-tag-for-legacy-versions]

key-files:
  created: [UPGRADING.md]
  modified: []

key-decisions:
  - "Sync-snapshot tags (72 total) left in place -- zero cost, documents pre-overlay sync history"
  - "v2.4.0-legacy derived from v2.4.0 tag via git rev-list (not hardcoded commit hash)"

patterns-established:
  - "Legacy tagging: annotated tag with -legacy suffix on the same commit as the last published version"

requirements-completed: [MIG-01, MIG-02, MIG-06]

duration: 12min
completed: 2026-03-30
---

# Phase 35 Plan 02: Legacy Tag & UPGRADING.md Summary

**v2.4.0-legacy annotated tag pushed to origin, UPGRADING.md documents install/rollback/architecture changes for v3.0**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-30T20:00:00Z
- **Completed:** 2026-03-30T20:12:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Created annotated `v2.4.0-legacy` tag on commit `681dab8` (same as v2.4.0) with descriptive message
- Pushed tag to origin (verified via `git ls-remote`)
- Created UPGRADING.md with four sections: What Changed, Install v3.0, Rollback to v2.x, Architecture Overview
- Architecture comparison table documents the five key differences between v2.x and v3.0

## Task Commits

Each task was committed atomically:

1. **Task 1: Create v2.4.0-legacy tag and write UPGRADING.md** - `bd47b06` (docs)
2. **Task 2: Verify and push legacy tag to origin** - checkpoint:human-verify (tag push, no code commit)

## Files Created/Modified
- `UPGRADING.md` - Migration guide with install, rollback, and architecture comparison

## Decisions Made
- Derived tag commit from `git rev-list -n 1 v2.4.0` instead of hardcoding the hash (per review feedback)
- Left 72 sync-snapshot-* tags in place per RESEARCH.md recommendation (zero cost, historical documentation value)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Legacy tag is on origin; rollback path is documented
- UPGRADING.md committed and ready for inclusion in the v3.0.0 release
- Plan 35-03 (pre-publish validation and npm release) is unblocked

## Self-Check: PASSED

- FOUND: UPGRADING.md
- FOUND: 35-02-SUMMARY.md
- FOUND: bd47b06 (Task 1 commit)
- FOUND: v2.4.0-legacy tag (local)
- FOUND: v2.4.0-legacy tag (remote)

---
*Phase: 35-migration-ship-v3-0-0*
*Completed: 2026-03-30*
