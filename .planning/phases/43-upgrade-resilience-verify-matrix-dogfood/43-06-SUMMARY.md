---
phase: 43-upgrade-resilience-verify-matrix-dogfood
plan: 06
subsystem: hooks
tags: [check-update, worker, shared-cache, stale-hooks, fork-identity]
requires:
  - phase: 43-upgrade-resilience-verify-matrix-dogfood
    provides: JavaScript semantic override staleness
provides:
  - Check-update parent hook with shared cache and multi-runtime config detection
  - Check-update worker override with stale-hook detection
  - Hook manifest worker registration
  - Focused source/manifest/bundled hook tests
affects: [phase-43, hooks, override-gate, install-runtime]
tech-stack:
  added: []
  patterns:
    - Parent hook owns config, package identity, role routing, and 4-hour spawn throttle
    - Worker hook owns network checks, stale hook detection, and 7-day network throttle
    - Source/runtime package identity fallback for installed and test shapes
key-files:
  created:
    - overrides/hooks/gsd-check-update-worker.js
    - overrides/hooks/gsd-check-update-worker.js.REASON.md
  modified:
    - overrides/hooks/gsd-check-update.js
    - overrides/hooks/gsd-check-update.js.REASON.md
    - hooks/index.js
    - tests/hooks.test.js
    - tests/hooks-manifest.test.js
key-decisions:
  - "Active @opengsd/gsd-core@1.5.0 already ships hooks/gsd-check-update-worker.js, so the worker is classified as an override, not an overlay."
  - "Check-update now writes to the shared cache directory $HOME/.cache/gsd while preserving fork package identity @chude/get-stuff-done."
  - "Local stale-hook detection runs before the 7-day network throttle exits, so no-update cache reuse cannot hide stale installed hooks."
requirements-completed: []
decisions-completed: []
duration: 48 min
completed: 2026-07-03
---

# Phase 43 Plan 06: Check-Update Hook Reconciliation Summary

**Check-update now adopts the upstream worker split, shared cache, config detection, and stale-hook resilience while preserving the fork's package identity and role routing.**

## Performance

- **Duration:** 48 min
- **Completed:** 2026-07-03T23:46:00+01:00
- **Tasks:** 4
- **Files modified:** 7 source/test files plus this summary/state metadata

## Accomplishments

- Replaced the inline `node -e` background body in `overrides/hooks/gsd-check-update.js` with a parent/worker split.
- Added `detectConfigDir(baseDir)` with runtime config support for Claude, Gemini, Kilo, and OpenCode.
- Moved check-update cache writes to the shared cache path `$HOME/.cache/gsd`.
- Preserved fork identity by checking `@chude/get-stuff-done`.
- Preserved `gsd.role` routing, including `GSD_ROLE_OVERRIDE` for tests and automation.
- Preserved the exact 4-hour parent spawn throttle and 7-day worker network throttle.
- Added `overrides/hooks/gsd-check-update-worker.js` as an override because active `@opengsd/gsd-core@1.5.0` already has that path.
- Added stale installed hook detection using `gsd-hook-version` headers before a throttled no-update result.
- Updated `hooks/index.js` so the worker is part of the hook manifest SSOT.
- Updated REASON metadata with current-pin `Version: 1.5.0`, upstream hashes, `Forward-ported 1.6.1 behavior`, and `Plan 11 refreshes snapshot after authority pin moves`.

## Task Commits

1. **Task 06-01: Check-update tests first** - pending commit
2. **Tasks 06-02 / 06-03: Parent/worker reconciliation and manifest registration** - pending commit
3. **Task 06-04: REASON and summary/state metadata** - pending commit

## Guardrails

- Current-pin snapshot honesty is preserved: override metadata remains tied to active upstream `1.5.0`.
- The worker is an override, not an overlay, because active upstream ships the same path.
- Network throttling still suppresses npm/git calls inside 7 days.
- Stale-hook detection is local filesystem work and can update cache state without making a network call.
- Statusline cache-reader reconciliation remains Plan 43-07; do not merge the hook PR before Plan 07 closes the coupled runtime surface.

## Deviations from Plan

- The plan listed `overlay/hooks/gsd-check-update-worker.js` as a possible artifact, but its own conditional required override classification when active `1.5.0` contains the same upstream path. Live inspection confirmed it does, so the worker was added under `overrides/hooks/`.

## Verification

- RED: `bun test tests/hooks.test.js tests/hooks-manifest.test.js` failed before implementation on shared-cache, worker-manifest, and stale-hook assertions.
- `node --check overrides/hooks/gsd-check-update.js` - passed.
- `node --check overrides/hooks/gsd-check-update-worker.js` - passed.
- `bun run build` - passed; generated the manifest-driven hook bundles.
- `bun test tests/hooks.test.js tests/hooks-manifest.test.js` - passed, 68 tests.
- `node scripts/check-overrides.js` - passed, 8 overrides checked.
- `bunx eslint overrides/hooks/gsd-check-update.js overrides/hooks/gsd-check-update-worker.js tests/hooks.test.js tests/hooks-manifest.test.js hooks/index.js` - passed with 0 errors and the existing security-plugin warning class.
- `rg -n "isNewer|detectConfigDir|stale|\\.cache.*gsd|@chude/get-stuff-done|gsd\\.role|4h|4-hour|7d|7-day" overrides/hooks/gsd-check-update.js overrides/hooks/gsd-check-update-worker.js tests/hooks.test.js` - passed.

## User Setup Required

None.

## Next Phase Readiness

Ready for Plan 43-07. The next plan must reconcile `gsd-statusline.js` and hook packaging so statusline/update-banner readers consume the same shared cache contract introduced here.

---
*Phase: 43-upgrade-resilience-verify-matrix-dogfood*
