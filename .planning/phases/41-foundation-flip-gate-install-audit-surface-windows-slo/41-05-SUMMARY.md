---
phase: 41-foundation-flip-gate-install-audit-surface-windows-slo
plan: 05
subsystem: reliability
tags: [subprocess, windows, flake-hardening, tests, timeout-helper]

requires:
  - phase: 41-01
    provides: Blocking override gate test surface that still has subprocess debt outside this plan
  - phase: 41-02
    provides: Maintenance escape-hatch table for later REL-03 decisions
provides:
  - Shared subprocess timeout helper using Node built-in timeout and killSignal behavior
  - High-volume Windows-prone test migration away from raw execSync/spawnSync call sites
  - Focused verification suite for subprocess-heavy test files
affects: [phase-41, reliability-slo, windows-ci]

tech-stack:
  added: []
  patterns:
    - Central subprocess helper for test calls that need timeout classification
    - Prefer argv arrays over shell command strings for temp paths and git/node calls
    - Platform-neutral synchronous wait helper instead of shell sleep in tests

key-files:
  created:
    - tests/helpers/subprocess-with-timeout.js
    - tests/subprocess-with-timeout.test.js
  modified:
    - tests/helpers.cjs
    - tests/sync.test.cjs
    - tests/hooks.test.js
    - tests/gsd-tools.test.js
    - tests/core.test.cjs
    - tests/config.test.cjs
    - tests/installer-v3.test.js
    - tests/prototype-installer.test.js
    - tests/installer-exports.test.js
    - tests/package-launcher-v3.test.js

key-decisions:
  - "Use spawnSync's built-in timeout and killSignal behavior in the helper rather than a hand-rolled Promise.race timer."
  - "Keep shell parsing isolated behind runShellWithTimeout and prefer runWithTimeout argv arrays for temp paths."
  - "REL-02 remains pending until Plan 06 completes the remaining subprocess surface and telemetry path."

patterns-established:
  - "Subprocess-heavy tests call runWithTimeout/runShellWithTimeout instead of raw child_process sync helpers."
  - "Test waits use Atomics.wait-based waitMs rather than shell sleep."
  - "Plan summaries must distinguish target-file cleanliness from broader repo carry-forward debt."

requirements-advanced: [REL-02]

duration: multi-session
completed: 2026-07-01
---

# Phase 41 Plan 05: Subprocess Timeout Helper and High-Volume Migration Summary

**Central timeout helper plus high-volume subprocess test migration for the Windows reliability SLO**

## Performance

- **Duration:** Multi-session continuation across 2026-06-23 and 2026-07-01.
- **Completed:** 2026-07-01T15:48:16+01:00
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments

- Added `tests/helpers/subprocess-with-timeout.js` with `runWithTimeout` and `runShellWithTimeout`.
- Added helper contract coverage in `tests/subprocess-with-timeout.test.js`.
- Exported the timeout helper from `tests/helpers.cjs`.
- Migrated the Plan 05 target files away from raw `execSync`, `spawnSync`, `exec(`, and `spawn(` text matches:
  - `tests/sync.test.cjs`
  - `tests/hooks.test.js`
  - `tests/gsd-tools.test.js`
  - `tests/core.test.cjs`
  - `tests/config.test.cjs`
  - `tests/installer-v3.test.js`
  - `tests/prototype-installer.test.js`
  - `tests/installer-exports.test.js`
  - `tests/package-launcher-v3.test.js`
- Replaced shell sleeps in `tests/hooks.test.js` with a platform-neutral `waitMs` helper.
- Added explicit timeout coverage to the previously default-timeout `getCommitsInRange` tests that exceeded Bun's default 5s budget on Windows.

## Task Commits

1. **Task 05-01: Add subprocess helper contract** - `2428a3f` (feat)
2. **Task 05-02a: Migrate installer/config/core/gsd-tools subprocess tests** - `6e4da1a` (test)
3. **Task 05-02b: Migrate sync and hook subprocess tests** - `5b7dd8c` (test)

## Files Created/Modified

- `tests/helpers/subprocess-with-timeout.js` - shared timeout helper using `spawnSync`, `timeout`, and `killSignal`.
- `tests/subprocess-with-timeout.test.js` - helper success, failure, timeout, heavy-timeout, and shell-helper coverage.
- `tests/helpers.cjs` - helper export surface.
- `tests/sync.test.cjs` - git setup/rev-parse/tag calls routed through timeout helpers.
- `tests/hooks.test.js` - hook/node/git calls routed through timeout helpers; shell sleep removed.
- `tests/gsd-tools.test.js` - local command runner and dist checks routed through timeout helpers.
- `tests/core.test.cjs` - git setup/staging routed through timeout helpers.
- `tests/config.test.cjs` - config subprocess calls routed through timeout helper.
- `tests/installer-v3.test.js`, `tests/prototype-installer.test.js`, `tests/installer-exports.test.js`, `tests/package-launcher-v3.test.js` - installer/launcher subprocess calls converted to argv-array helper usage.

## Verification

- `bun test tests/subprocess-with-timeout.test.js` - passed, 7 tests.
- `bun test tests/sync.test.cjs` - passed, 153 tests.
- `bun test tests/hooks.test.js` - passed, 52 tests.
- `bun test tests/subprocess-with-timeout.test.js tests/sync.test.cjs tests/hooks.test.js tests/gsd-tools.test.js tests/core.test.cjs tests/config.test.cjs tests/installer-v3.test.js tests/prototype-installer.test.js tests/installer-exports.test.js tests/package-launcher-v3.test.js` - passed, 479 tests.
- `node -e "const fs=require('fs'); const files=['tests/sync.test.cjs','tests/hooks.test.js','tests/gsd-tools.test.js','tests/core.test.cjs','tests/config.test.cjs','tests/installer-v3.test.js','tests/prototype-installer.test.js','tests/installer-exports.test.js','tests/package-launcher-v3.test.js']; const re=/\b(execSync|spawnSync|exec\(|spawn\()/; const hits=files.filter(f=>fs.existsSync(f) && re.test(fs.readFileSync(f,'utf8'))); if(hits.length) { console.log(hits.join('\n')); process.exit(1); }"` - passed.
- `rg -n "execSync|spawnSync|exec\(|spawn\(" tests/sync.test.cjs tests/hooks.test.js tests/gsd-tools.test.js tests/core.test.cjs tests/config.test.cjs tests/installer-v3.test.js tests/prototype-installer.test.js tests/installer-exports.test.js tests/package-launcher-v3.test.js` - no matches.

## Remaining raw subprocess calls

Plan 05 target files have **zero** remaining raw subprocess matches.

Known carry-forward outside the Plan 05 target set:

- `tests/helpers.cjs` still has the legacy `runGsdTools` wrapper using `execSync` string form.
- `tests/check-boundary.test.js`, `tests/check-overrides*.test.js`, `tests/compose.test.js`, `tests/preview-update-coverage.test.js`, and `tests/validate-configs.test.js` still use raw `spawnSync`/`execSync` and should be handled by Plan 06 or an explicitly scoped follow-up.
- `tests/helpers/subprocess-with-timeout.js` uses `spawnSync` internally by design; that is the centralized helper implementation, not residual call-site debt.
- Some broad `rg` hits are comments or mocks (`tests/helpers/mock-child-process.js`, platform test comments, `tests/state.test.cjs`) and are not runtime subprocess call sites.

## Decisions Made

- The helper uses Node's built-in `spawnSync` timeout/kill behavior. This is simpler and easier to audit than adding a custom timer race.
- `runWithTimeout` is the default for git/node/bun/script calls. `runShellWithTimeout` remains explicit for legacy command-string helpers where changing every call signature would expand the plan.
- `REL-02` is advanced by this plan but remains pending because Plan 06 owns the remaining subprocess migration and Windows flake telemetry.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `sync.test.cjs` exposed Bun's default 5s timeout on a git-heavy Windows test**
- **Found during:** Task 05-02 focused verification.
- **Issue:** `getCommitsInRange > handles subjects containing special characters` exceeded Bun's default 5s timeout under Windows load.
- **Fix:** Added the existing `SUBPROCESS_TIMEOUT` to that test and the adjacent empty-range test.
- **Files modified:** `tests/sync.test.cjs`
- **Verification:** `bun test tests/sync.test.cjs` passed, 153 tests.
- **Committed in:** `5b7dd8c`

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** The fix reinforces REL-02 by applying the existing central timeout budget to git-heavy tests.

## Issues Encountered

- `gsd-progress` still reports Phase 40.5 as partial because 40.5 has more plans than summaries. This is pre-existing tracking debt; Phase 40.6 retired the legacy 40.5 Wave 5 filing path, and `.planning/STATE.md` remains the active Phase 41 resume source.
- Broad test-surface subprocess debt remains outside the Plan 05 target files and is explicitly carried into Plan 06.

## User Setup Required

None.

## Next Phase Readiness

Wave 1 is now complete. Phase 41 can proceed to Wave 2:

- `41-03-PLAN.md` - Security scanner CI surface and OSV triage.
- `41-04-PLAN.md` - Perf baseline harness, schemas, workflow, and real three-platform capture protocol.

`REL-02` should remain pending until Plan 06 finishes the remaining subprocess migration and CI telemetry path.

## Self-Check: PASSED

---
*Phase: 41-foundation-flip-gate-install-audit-surface-windows-slo*
*Completed: 2026-07-01*
