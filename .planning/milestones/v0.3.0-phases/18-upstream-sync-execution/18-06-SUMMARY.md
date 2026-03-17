---
phase: 18-upstream-sync-execution
plan: "06"
subsystem: cli
tags: [gsd-tools, cli, help-flag, branding, opencode]

requires:
  - phase: 18-upstream-sync-execution
    provides: "gsd-tools.cjs modular CLI router after Phase 18 cherry-pick sync"

provides:
  - "--help/-h/help flag support in gsd-tools CLI router (exit 0, stdout)"
  - "opencode/ upstream package removed, zero upstream branding in active code"

affects: [cli-usability, fork-identity]

tech-stack:
  added: []
  patterns:
    - "CLI help: detect --help/-h before command routing, write to stdout, exit 0"
    - "Subcommand alias: 'help' case in switch identical to --help flag handler"

key-files:
  created: []
  modified:
    - get-stuff-done/bin/gsd-tools.cjs

key-decisions:
  - "Deleted opencode/ entirely rather than rebranding: fork is Claude Code-only per REQUIREMENTS.md Out of Scope"
  - "help subcommand added alongside --help/--h flags so both 'gsd-tools help' and 'gsd-tools --help' work"

patterns-established:
  - "Help display: process.stdout.write (not error()), process.exit(0) — never stderr for --help"

requirements-completed: [SYNC-II-02, SYNC-II-04]

duration: 4min
completed: 2026-02-23
---

# Phase 18 Plan 06: UAT Gap Closure Summary

**--help flag added to gsd-tools CLI router and upstream opencode/ package deleted to clear fork identity**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-23T09:21:05Z
- **Completed:** 2026-02-23T09:25:11Z
- **Tasks:** 2/2
- **Files modified:** 1 modified, 3 deleted

## Accomplishments

- gsd-tools CLI now responds to `--help`, `-h`, and `help` with formatted usage info (stdout, exit 0)
- No-args behavior preserved (error to stderr, exit 1)
- 22 upstream branding references eliminated by removing `opencode/get-shit-done-opencode/` directory
- 648 tests pass with zero regressions after both changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Add --help/-h/help flag handling to gsd-tools CLI router** - `eedc008` (feat)
2. **Task 2: Remove upstream OpenCode installer package** - `01ec4ac` (chore)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `get-stuff-done/bin/gsd-tools.cjs` - Added --help/-h detection before command routing; added 'help' case in switch statement
- `opencode/README.md` - Deleted (upstream OpenCode package README)
- `opencode/get-shit-done-opencode/bin/install.js` - Deleted (upstream installer script with 22 branding refs)
- `opencode/get-shit-done-opencode/package.json` - Deleted (upstream package manifest)

## Decisions Made

- Deleted opencode/ entirely rather than rebranding it: the fork is Claude Code-only per REQUIREMENTS.md (Out of Scope: "OpenCode/Gemini/Mistral installer support"). Rebranding would be wasted effort on code the fork will never use.
- Used `process.stdout.write` for help display (not the existing `error()` helper which writes to stderr and exits 1). This follows CLI standards: `--help` should exit 0 with output on stdout.
- Added both flag-style (`--help`, `-h`) and subcommand-style (`help`) handlers so the CLI works naturally in all forms.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The `opencode/` references in `bin/install.js` (e.g., `--opencode` flag, OpenCode runtime support) are legitimate fork features, distinct from the deleted upstream branding package. Branding check confirmed 0 `get-shit-done`/`glittercowboy` references after deletion.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both UAT gaps from Phase 18 are closed
- Phase 18 is now fully complete (18-01 through 18-06 done)
- No blockers for Phase 20

---
*Phase: 18-upstream-sync-execution*
*Completed: 2026-02-23*
