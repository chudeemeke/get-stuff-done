---
phase: 13-hook-bundling
plan: 01
subsystem: infra
tags: [esbuild, hooks, bundling, dist, testing, regression-guard, GAP-1]

requires:
  - phase: 09-cross-platform
    provides: hooks/pre-compact.js and gsd-statusline.js with src/ imports added
  - phase: 11-ci-testing
    provides: bun:test infrastructure, hooks.test.js baseline (16 tests)

provides:
  - esbuild bundling in scripts/build-hooks.js replacing plain fs.copyFileSync
  - hooks/dist/ files as self-contained bundles (no runtime src/ dependencies)
  - 11 dist regression tests in tests/hooks.test.js as permanent GAP-1 guard

affects:
  - 14-final-polish
  - copy-mode install via bin/install.js (hooks now self-contained)

tech-stack:
  added: []
  patterns:
    - "esbuild.buildSync with bundle:true, platform:node, target:node20 for all hooks"
    - "dist regression tests mirror source tests but run against bundled files"
    - "beforeAll auto-build pattern for CI: build dist if missing before test run"

key-files:
  created:
    - hooks/dist/pre-compact.js (generated, gitignored)
    - hooks/dist/gsd-statusline.js (generated, gitignored)
    - hooks/dist/gsd-check-update.js (generated, gitignored)
  modified:
    - scripts/build-hooks.js
    - tests/hooks.test.js

key-decisions:
  - "BUNDLE-001: No 'external' option in esbuild -- all src/ and node_modules deps inlined for copy-mode install"
  - "BUNDLE-002: No minification -- readable dist files aid debugging of installed hooks"
  - "TEST-DIST-001: Dist tests in same file (hooks.test.js), not separate file -- keeps related tests together"
  - "BUILD-VERIFY-001: beforeAll auto-build dist if missing -- CI support after fresh checkout"

patterns-established:
  - "esbuild bundling pattern: use programmatic API (not CLI), platform:node, no external"
  - "dist test pattern: mirror key source tests with DIST_HOOKS paths, add build verification describe"

duration: 6min
completed: 2026-02-18
---

# Phase 13 Plan 01: Hook Bundling Summary

**esbuild bundling replaces plain-copy build in build-hooks.js, producing self-contained hooks/dist/ bundles that work after copy-mode install to ~/.claude/hooks/ (fixes GAP-1)**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-18T19:33:17Z
- **Completed:** 2026-02-18T19:38:57Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Replaced `fs.copyFileSync` loop in `scripts/build-hooks.js` with `esbuild.buildSync` API calls for all three hooks
- All three `hooks/dist/` bundles are self-contained: zero `require('../src/')` references (verified by grep and test)
- Added 11 dist regression tests to `tests/hooks.test.js`: build verification, and per-hook execution tests for all three bundled files
- Full test suite passes with 366/366 tests (up from 355/355 before this plan)

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace plain-copy build-hooks.js with esbuild bundling** - `3416d94` (feat)
2. **Task 2: Add dist hook tests as regression guard** - `09b872d` (test)

**Plan metadata:** (pending final commit)

## Files Created/Modified

- `scripts/build-hooks.js` - Rewritten to use esbuild.buildSync API; produces self-contained bundles with file size output
- `tests/hooks.test.js` - Extended with DIST_HOOKS constants, beforeAll auto-build, and 4 new describe blocks (build verification + 3 bundled hook suites)
- `hooks/dist/pre-compact.js` - Generated bundle (23KB, gitignored); bundles pathe via src/platform/paths.js
- `hooks/dist/gsd-statusline.js` - Generated bundle (304KB, gitignored); bundles ajv + json5 + theme + terminal via src/
- `hooks/dist/gsd-check-update.js` - Generated bundle (2KB, gitignored); no src/ deps, comment-stripped

## Decisions Made

- **BUNDLE-001:** No `external` option in esbuild calls -- all src/ and node_modules dependencies must be inlined for copy-mode installs where neither `src/` nor `node_modules` exist at `~/.claude/`
- **BUNDLE-002:** No minification (`minify: false`) -- 304KB vs ~150KB is acceptable for one-time install; readable dist files aid debugging in production
- **TEST-DIST-001:** Dist tests added to existing `tests/hooks.test.js`, not a separate file -- keeps source and dist tests co-located and prevents test fragmentation
- **BUILD-VERIFY-001:** `beforeAll()` auto-builds dist files if missing -- CI support after fresh checkout without requiring manual `bun run build:hooks` step

## Deviations from Plan

None - plan executed exactly as written.

The only noteworthy discovery: `hooks/dist/` is gitignored (decision 09-02 BUILD-001), so only `scripts/build-hooks.js` was staged for Task 1 commit. The dist files themselves are generated artifacts and correctly excluded from version control.

## Issues Encountered

None.

## Next Phase Readiness

- GAP-1 is closed: hooks bundled, dist tests in place as permanent regression guard
- Phase 14 (Final Polish) can proceed
- The `prepublishOnly` hook in package.json already runs `bun run build:hooks` -- all published packages will have correct self-contained dist files going forward

## Self-Check: PASSED

- scripts/build-hooks.js: FOUND
- tests/hooks.test.js: FOUND
- 13-01-SUMMARY.md: FOUND
- Commit 3416d94 (Task 1): FOUND
- Commit 09b872d (Task 2): FOUND

---
*Phase: 13-hook-bundling*
*Completed: 2026-02-18*
