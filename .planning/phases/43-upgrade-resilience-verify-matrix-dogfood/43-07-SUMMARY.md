---
phase: 43-upgrade-resilience-verify-matrix-dogfood
plan: 07
subsystem: hooks
tags: [statusline, shared-cache, phase-lifecycle, hook-packaging]
requires:
  - phase: 43-upgrade-resilience-verify-matrix-dogfood
    provides: check-update shared cache and worker
provides:
  - Statusline phase-lifecycle rendering
  - Shared cache reader with package-lineage guard
  - Autocompact env-var context scaling
  - Hook packaging proof for check-update, worker, statusline, and pre-compact
affects: [phase-43, hooks, dist, runtime-statusline]
tech-stack:
  added: []
  patterns:
    - Shared cache producer/consumer contract across check-update and statusline
    - Statusline fallback from active todo to GSD state
    - Dist finalization treats worker as a bundled runtime hook
key-files:
  created: []
  modified:
    - overrides/hooks/gsd-statusline.js
    - overrides/hooks/gsd-statusline.js.REASON.md
    - scripts/finalize-dist.js
    - tests/hooks.test.js
    - tests/compose.test.js
key-decisions:
  - "Statusline reads only the shared package-lineage cache at $HOME/.cache/gsd."
  - "GSD state renders only when no active todo is present, preserving todo priority."
  - "The check-update worker is finalized with other bundled hooks so dist/hooks contains the runtime worker after bun run dist."
requirements-completed: ["UPGRADE-07"]
decisions-completed: ["D-13"]
duration: 58 min
completed: 2026-07-04
---

# Phase 43 Plan 07: Statusline Reconciliation And Hook Packaging Summary

**Statusline now shares the check-update cache contract, renders phase lifecycle state, and packages the worker through the dist pipeline.**

## Performance

- **Duration:** 58 min
- **Completed:** 2026-07-04T00:04:30+01:00
- **Tasks:** 4
- **Files modified:** 5 source/test files plus GSD state metadata

## Accomplishments

- Added statusline parsing for `active_phase`, `next_action`, `next_phases`, `completed_phases`, `total_phases`, and `percent` from `.planning/STATE.md` frontmatter.
- Added phase lifecycle rendering:
  - active phase scene,
  - idle next-action scene,
  - milestone complete fallback,
  - legacy status/phase fallback.
- Switched statusline update notifications to the shared `$HOME/.cache/gsd` cache file written by check-update.
- Added package-lineage guard so statusline ignores foreign or pre-lineage cache records.
- Preserved `gsd.role` consumer/maintainer display:
  - maintainer rich upstream count/severity,
  - consumer version update prompt.
- Adopted `CLAUDE_CODE_AUTO_COMPACT_WINDOW` scaling while keeping the fork theme and context bridge.
- Preserved active todo priority: todos render before GSD state.
- Extended `scripts/finalize-dist.js` so `gsd-check-update-worker.js` is finalized with the other bundled hooks.
- Marked UPGRADE-07 complete.

## Task Commits

1. **Task 07-01: Statusline and packaging tests first** - pending commit
2. **Tasks 07-02 / 07-03: Statusline behavior and dist packaging reconciliation** - pending commit
3. **Task 07-04: REASON and summary/state metadata** - pending commit

## Guardrails

- Statusline snapshot metadata remains tied to active upstream `1.5.0`.
- Shared-cache reads require matching `package_name`.
- The statusline still exits silently on malformed JSON or filesystem/config errors.
- `bun run dist` proved generated `dist/hooks/` contains `gsd-check-update.js`, `gsd-statusline.js`, and `gsd-check-update-worker.js`.

## Deviations from Plan

None blocking.

## Verification

- RED: `bun test tests/hooks.test.js tests/compose.test.js` failed before implementation on lifecycle rendering, `CLAUDE_CODE_AUTO_COMPACT_WINDOW`, shared-cache notifications, and worker packaging.
- `node --check overrides/hooks/gsd-statusline.js` - passed.
- `node --check scripts/finalize-dist.js` - passed.
- `bun test tests/hooks.test.js tests/compose.test.js` - passed, 210 tests.
- `bun run dist` - passed; finalized `gsd-statusline.js`, `gsd-check-update.js`, `gsd-check-update-worker.js`, and `pre-compact.js`.
- `Test-Path dist\\hooks\\gsd-check-update.js` - true.
- `Test-Path dist\\hooks\\gsd-statusline.js` - true.
- `Test-Path dist\\hooks\\gsd-check-update-worker.js` - true.
- `bun test tests/compose.test.js tests/hooks.test.js tests/hooks-manifest.test.js` - passed, 224 tests.
- `node scripts/check-overrides.js` - passed, 8 overrides checked.
- `bunx eslint overrides/hooks/gsd-statusline.js scripts/finalize-dist.js tests/hooks.test.js tests/compose.test.js` - passed with 0 errors and the existing warning class.

## User Setup Required

None.

## Next Phase Readiness

Ready for Plan 43-08: override churn generator.

---
*Phase: 43-upgrade-resilience-verify-matrix-dogfood*
