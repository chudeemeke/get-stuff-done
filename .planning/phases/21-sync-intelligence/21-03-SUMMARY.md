---
phase: 21-sync-intelligence
plan: "03"
subsystem: monitoring
tags: [sync, monitoring, statusline, hooks, git-upstream, cache]
dependency_graph:
  requires:
    - phase: 21-01
      provides: gsd.role ConfigSchema support, classifyCommit logic
  provides:
    - Maintainer git-based upstream check in gsd-check-update.js with extended cache schema
    - Rich statusline notification "N commits upstream (severity) | /gsd:upstream"
    - 4-hour TTL cache: hook skips background spawn if cache is fresh
  affects:
    - Consumer path npm registry check (unchanged)
    - hooks/gsd-statusline.js notification rendering
tech-stack:
  added: []
  patterns:
    - role-injection-via-spawn-string: inject gsd.role from parent process into background child process via JSON.stringify interpolation
    - inline-classification-in-subprocess: duplicate subject-only classification logic inside background process string (cannot require sync.cjs from node -e subprocess)
    - severity-order-array: SEVERITY_ORDER array with indexOf for computing highest-severity across multiple commits
key-files:
  created: []
  modified:
    - hooks/gsd-check-update.js
    - hooks/gsd-statusline.js
    - tests/hooks.test.js
key-decisions:
  - "Inject gsd.role via JSON.stringify before spawning (Option B from RESEARCH.md Open Question 1)"
  - "Classification logic duplicated inline in background process string - cannot require sync.cjs from node -e subprocess without access to project node_modules"
  - "fetch_error field added to cache when git fetch fails; statusline treats fetch_error as no-notification (update_available will already be false)"
  - "4-hour TTL implemented in parent process (not background): skip spawn entirely if cache.checked is within 4hr window"
  - "Rule 1 auto-fix: undeclared 'used' variable in statusline bridge write replaced with 'rawUsage'"
  - "Consumer notification updated to use correct cache fields (installed, latest) instead of old current_version/latest_version fallbacks"
requirements-completed: [SYNC-03]
metrics:
  duration: 1064s
  completed: 2026-02-25
  tasks_completed: 2
  files_modified: 3
---

# Phase 21 Plan 03: Monitoring Upgrade Summary

**Maintainer git-based upstream check with commit counting, subject-only severity classification, and rich statusline "N commits upstream (severity) | /gsd:upstream" notification**

## Performance

- **Duration:** 17 min
- **Started:** 2026-02-25T13:21:39Z
- **Completed:** 2026-02-25T13:39:03Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Extended `gsd-check-update.js` with maintainer path: git fetch upstream + rev-list count + subject-only commit classification + extended cache write (upstream_count, highest_severity, commit_summary)
- Extended `gsd-statusline.js` with rich notification format replacing "upstream updates" with "N commits upstream (severity) | /gsd:upstream"
- 4-hour TTL implemented: hook exits early (no background spawn) when cache.checked is within 4 hours
- Consumer path unchanged: npm registry check still writes update_available, installed, latest
- 13 new tests in `tests/hooks.test.js` covering maintainer path, TTL, fetch failure, severity classification, statusline formats

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend gsd-check-update.js with maintainer git-based path** - `8ed1373` (feat)
2. **Task 2: Extend gsd-statusline.js with rich maintainer notification** - `5c60997` (feat)

**Plan metadata:** (docs commit - see below)

## Files Created/Modified

- `hooks/gsd-check-update.js` - Extended: reads gsd.role before spawning, 4hr TTL check, maintainer path with git fetch + rev-list + classification, consumer path unchanged
- `hooks/gsd-statusline.js` - Extended: rich maintainer notification with count + severity labels, correct consumer cache field names, fixed undeclared 'used' variable
- `tests/hooks.test.js` - New: createGitRepoWithUpstream helper, waitForFile helper, maintainer path test suite (6 tests), statusline maintainer notification test suite (7 tests)

## Decisions Made

- gsd.role injected into background subprocess via `${JSON.stringify(gsdRole)}` in spawn string (same pattern as cacheFile/projectVersionFile injection)
- Classification logic is duplicated inline (not required from sync.cjs) because the background process runs as `node -e "..."` without project node_modules on path
- Severity labels: fix->fixes, feat->features, security->security fixes, breaking->breaking changes, chore->chores, refactor->refactors
- 4-hour TTL check runs in parent process before spawning (not inside background string) so no spawn happens at all for fresh cache

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed undeclared 'used' variable in bridge data write**
- **Found during:** Task 2 (reviewing gsd-statusline.js for update notification changes)
- **Issue:** `used_pct: used` on line 93 referenced an undeclared variable `used`. Should have been `rawUsage` (computed earlier at line 82). The error was swallowed by the surrounding try/catch, silently producing `used_pct: undefined` in the bridge JSON.
- **Fix:** Changed `used_pct: used` to `used_pct: rawUsage`
- **Files modified:** hooks/gsd-statusline.js
- **Verification:** 40 hook tests pass; bridge data now correctly contains the proximity value
- **Committed in:** 5c60997 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 1 bug fix)
**Impact on plan:** Pre-existing silent bug in bridge write. Fix restores correct bridge data for context-monitor hook. No scope creep.

## Issues Encountered

- `node -e "..."` with complex multiline scripts and special characters fails on Windows due to shell quoting. Fixed by writing temp script files and running `node "path/to/script.js"` instead.
- `git checkout -b main` fails if git init.defaultBranch is already 'main'. Fixed by wrapping in try/catch in `createGitRepoWithUpstream` helper.
- Windows EBUSY on git directory cleanup in tests. Fixed by wrapping cleanup calls in try/catch.

## User Setup Required

None - no external service configuration required. Cache is written to `~/.claude/cache/gsd-update-check.json`. Set `gsd.role` to `'maintainer'` in `~/.gsd/config.json` to activate the new path.

## Next Phase Readiness

- SYNC-03 satisfied: auto-update check with severity indicators works end-to-end for maintainer role
- Consumer path unchanged and tested
- Phase 21 Plan 02 (supply chain scanner) is independent and can be executed in any order
- Phase 21 Plan 03 is complete

## Self-Check

Files modified:
- FOUND: hooks/gsd-check-update.js
- FOUND: hooks/gsd-statusline.js
- FOUND: tests/hooks.test.js

Commits:
- FOUND: 8ed1373 (Task 1 - extend background hook)
- FOUND: 5c60997 (Task 2 - extend statusline)

## Self-Check: PASSED

---
*Phase: 21-sync-intelligence*
*Completed: 2026-02-25*
