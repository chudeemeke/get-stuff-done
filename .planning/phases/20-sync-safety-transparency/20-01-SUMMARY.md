---
phase: 20-sync-safety-transparency
plan: 01
subsystem: infra
tags: [git, sync, checkpoint, diff-preview, plumbing, windows]

requires:
  - phase: 18-upstream-sync-execution
    provides: sync-manifest.json and branding-map.json as data sources for preview and effort estimation
  - phase: 18-upstream-sync-execution
    provides: gsd-tools.cjs modular architecture (11 lib/*.cjs modules + thin router)

provides:
  - sync plumbing module (bin/lib/sync.cjs) with 4 CLI commands and 6 exported internal helpers
  - sync-preview command for diff preview with sensitive path flagging and effort estimation
  - sync-checkpoint create/list/cleanup for crash-recoverable rollback infrastructure
  - spawnGit() pattern: use spawnSync array form for git commands with special chars on Windows

affects:
  - 20-sync-safety-transparency Plan 02 (workflow porcelain calls sync plumbing)
  - upstream-sync.md workflow (Stage 3.5 diff preview, checkpoint creation)

tech-stack:
  added: []
  patterns:
    - spawnGit() for git commands with %, |, ^, *, spaces -- avoids execGit shell escaping on Windows MINGW64
    - spawnSync array form vs execSync shell string -- critical distinction for cross-platform git operations

key-files:
  created:
    - get-stuff-done/bin/lib/sync.cjs
    - tests/sync.test.cjs
  modified:
    - get-stuff-done/bin/gsd-tools.cjs

key-decisions:
  - "spawnGit() via spawnSync array form: execGit uses shell escaping that wraps args containing %, |, ^, * in single quotes -- on Windows MINGW64 this breaks git log --format, tag -a -m, and tag -l glob patterns. All sync commands now use spawnGit() for git operations with special characters"
  - "diff-tree --root flag: initial commits have no parent; without --root, git diff-tree returns empty output for the first commit in a temp git repo. Adding --root handles this correctly"
  - "All 6 internal helpers exported: follows bun 1.3.5 coverage pitfall pattern -- re-require breaks coverage attribution. Direct export + direct call is the correct pattern for testability"

patterns-established:
  - "spawnGit pattern: for any git operation with format strings, glob patterns, caret refs, or multi-word messages, use spawnGit() (spawnSync array form) instead of execGit()"
  - "sync plumbing isolation: all sync git operations live in sync.cjs; gsd-tools.cjs router only dispatches. Crash-recoverable by design."

requirements-completed:
  - SYNC-01
  - SYNC-02
  - SYNC-04

duration: 8min
completed: 2026-02-23
---

# Phase 20 Plan 01: Sync Plumbing Module Summary

**sync.cjs plumbing module with diff preview, checkpoint management, effort estimation, and Windows spawnGit() fix for special-character git commands**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-23T19:25:38Z
- **Completed:** 2026-02-23T19:33:49Z
- **Tasks:** 2
- **Files modified:** 3 (sync.cjs created, gsd-tools.cjs updated, sync.test.cjs created)

## Accomplishments

- Created `get-stuff-done/bin/lib/sync.cjs` as the 12th domain module under bin/lib/ with 4 CLI commands and 6 exported internal helpers
- Implemented `sync-preview` with both human-readable (colorized, ANSI) and JSON output modes matching the locked schema from CONTEXT.md
- Implemented `sync-checkpoint create/list/cleanup` for per-batch rollback tags with annotated git tags
- Registered sync commands in gsd-tools.cjs router and updated both --help and help subcommand text
- Created 33-test suite (565 lines) covering all commands and helpers using real temp git repos (no mocking)
- Discovered and fixed critical Windows MINGW64 shell escaping bug in execGit for format strings and glob patterns

## Task Commits

Each task was committed atomically:

1. **Task 1: Create sync.cjs module with all exported commands and helpers** - `dd1e349` (feat)
2. **Task 2: Create comprehensive tests for sync.cjs module** - `b70af13` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `get-stuff-done/bin/lib/sync.cjs` - Sync plumbing module: cmdSyncPreview, cmdSyncCheckpointCreate/List/Cleanup, plus 6 internal helpers all exported for direct testability
- `get-stuff-done/bin/gsd-tools.cjs` - Added sync require, sync-preview and sync-checkpoint router cases, updated help text in both --help and help subcommand blocks
- `tests/sync.test.cjs` - 565-line test file with 33 tests: direct helper tests using real temp git repos, CLI integration tests via runGsdTools, checkpoint lifecycle tests

## Decisions Made

- **spawnGit() pattern established:** execGit() builds a shell command string and single-quotes args containing `%`, `|`, `^`, `*`. On Windows MINGW64, single-quoted arguments are treated literally by the shell, causing `fatal: ambiguous argument` for git log format strings and `fatal: too many arguments` for git tag -a with multi-word messages. All sync commands use `spawnSync` array form (no shell, no escaping) via `spawnGit()`.
- **diff-tree --root flag:** Without --root, `git diff-tree` returns empty output for the initial commit (no parent). Added to getFilesForCommit() so tests using `createTempGitProject()` work correctly.
- **All helpers exported:** Follows the bun 1.3.5 coverage pitfall documented in shared memory. Exporting internal helpers and calling them directly ensures coverage is attributed to the source file, not a re-required instance.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Windows MINGW64 shell escaping breaks execGit for format strings, glob patterns, and multi-word messages**
- **Found during:** Task 2 (test failures in getCommitsInRange, getFilesForCommit, checkpoint create)
- **Issue:** execGit() builds a shell command string where args containing `%`, `|`, `^`, `*`, or spaces get wrapped in single quotes. On Windows MINGW64, `git log '--format=%H'` fails with `fatal: ambiguous argument ''--format=%H''`; `git tag -a name -m 'msg with spaces'` fails with `fatal: too many arguments`; `git tag -l 'sync-checkpoint-*'` fails to match tags.
- **Fix:** Introduced `spawnGit()` using Node.js `spawnSync` with array args (no shell escaping). Updated getCommitsInRange, getFilesForCommit, cmdSyncCheckpointCreate, cmdSyncCheckpointList, cmdSyncCheckpointCleanup, and parent-check/diff-stat in cmdSyncPreview to use spawnGit().
- **Files modified:** get-stuff-done/bin/lib/sync.cjs
- **Verification:** All 33 tests pass on Windows MINGW64 after fix
- **Committed in:** b70af13 (Task 2 commit)

**2. [Rule 1 - Bug] diff-tree returns empty output for initial commits without --root flag**
- **Found during:** Task 2 (getFilesForCommit test "returns added file with A status" failed)
- **Issue:** `git diff-tree` without `--root` returns empty output for commits with no parent (initial commit in temp git repo). Test asserted init.txt was listed as added file.
- **Fix:** Added `--root` flag to the diff-tree invocation in getFilesForCommit.
- **Files modified:** get-stuff-done/bin/lib/sync.cjs
- **Verification:** Test passes, init.txt correctly shown with status A
- **Committed in:** b70af13 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 bugs found during test execution)
**Impact on plan:** Both fixes required for correctness on Windows MINGW64 (the primary development platform). spawnGit() pattern is now established as standard for git operations with special characters.

## Issues Encountered

None beyond the auto-fixed deviations above.

## Next Phase Readiness

- sync.cjs plumbing module complete and tested
- Router dispatch working: `sync-preview` and `sync-checkpoint` commands accessible via gsd-tools.cjs
- Plan 02 (workflow porcelain) can now call these plumbing commands from the upstream-sync.md workflow
- The spawnGit() pattern should be applied to any future lib module that needs git commands with special characters

---
*Phase: 20-sync-safety-transparency*
*Completed: 2026-02-23*
