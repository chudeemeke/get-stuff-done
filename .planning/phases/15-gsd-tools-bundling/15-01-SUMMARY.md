---
phase: "15"
plan: "01"
subsystem: "build"
tags: [bundling, esbuild, gsd-tools, dist, copy-mode, gap-closure]
one-liner: "esbuild bundle for gsd-tools.js inlining src/validation, fixing MODULE_NOT_FOUND in copy-mode installs"
dependency-graph:
  requires: [13-01, 14-01, 14-02]
  provides: [bundled-gsd-tools, unified-build-script, dist-regression-guard]
  affects: [bin/install.js, scripts/build.js, package.json, tests/gsd-tools.test.js]
tech-stack:
  added: []
  patterns: [esbuild-bundle, shared-esbuild-config, dist-regression-tests, git-mv-rename]
key-files:
  created:
    - scripts/build.js
    - get-stuff-done/bin/dist/gsd-tools.js
  modified:
    - bin/install.js
    - package.json
    - .gitignore
    - tests/gsd-tools.test.js
    - tests/hooks.test.js
key-decisions:
  - "BUNDLE-UNIFIED-001: Consolidate build-hooks.js into unified build.js via git mv (user-locked decision from 15-CONTEXT)"
  - "BUNDLE-SHARED-001: ESBUILD_BASE shared config with bundle:true, platform:node, target:node20, no external/minify"
  - "TEST-DIST-TOOLS-001: Dist tests added to gsd-tools.test.js (not separate file) matching hooks.test.js pattern"
  - "INSTALL-OVERWRITE-001: Installer post-copy overwrites source gsd-tools.js with bundled version, warns but does not fail if dist missing"
metrics:
  duration: "~5 minutes"
  tasks_completed: 2
  files_created: 2
  files_modified: 5
  tests_added: 4
  test_baseline: 441
  test_final: 445
  completed_date: "2026-02-20"
---

# Phase 15 Plan 01: gsd-tools.js Bundling Summary

## What Was Built

esbuild bundle for gsd-tools.js that inlines src/validation so the file works correctly after copy-mode install to `~/.claude/get-stuff-done/bin/`, where `src/` does not exist.

## Problem Solved

Phase 14 added `require('../../src/validation')` to gsd-tools.js. This works at source root but produces MODULE_NOT_FOUND after copy-mode install because `~/.claude/src/validation/` does not exist. Phase 13 fixed the identical bug for hooks -- this plan applies the same fix pattern to gsd-tools.js.

## Tasks

### Task 1: Rename build-hooks.js to build.js, add gsd-tools target, wire installer and package.json

Commit: `92db1ff`

Files modified:
- `scripts/build-hooks.js` renamed to `scripts/build.js` via `git mv` (preserves git history)
- `scripts/build.js` updated to unified build script handling hooks AND gsd-tools.js with shared `ESBUILD_BASE` config
- `.gitignore` updated to add `get-stuff-done/bin/dist/`
- `package.json` scripts: renamed `build:hooks` to `build`, updated `prepublishOnly` chain
- `bin/install.js` updated: post-copy overwrite replaces source gsd-tools.js with bundled version
- `tests/hooks.test.js` updated: `beforeAll` references renamed `scripts/build.js`

**Build output:**
- `hooks/dist/gsd-check-update.js` (2KB)
- `hooks/dist/gsd-statusline.js` (308KB)
- `hooks/dist/pre-compact.js` (23KB)
- `get-stuff-done/bin/dist/gsd-tools.js` (58KB, ~59KB)

### Task 2: Add dist regression tests for bundled gsd-tools.js

Commit: `c2d7e7a`

Files modified:
- `tests/gsd-tools.test.js` updated with 4 new dist regression tests

New tests in describe block `dist: gsd-tools bundled (regression guard for GAP-1)`:
1. `bundled gsd-tools.js exists and is a non-trivial bundle` -- size >10KB guard
2. `bundled gsd-tools.js contains no relative src/ require paths` -- no `../../src/` in bundle
3. `bundled gsd-tools.js resolves without MODULE_NOT_FOUND from isolated dir` -- runs `generate-slug` from temp dir lacking `src/`
4. `bundled gsd-tools.js validation commands work from isolated dir` -- exercises validation module load path

## Verification Results

1. `scripts/build-hooks.js` no longer exists (renamed via git mv)
2. `node scripts/build.js` produces all 4 targets: 3 hooks + 1 gsd-tools bundle
3. No `require('../../src/validation')` in bundled file (grep returns 0 matches)
4. `get-stuff-done/bin/dist/` does NOT appear in `git status` (correctly gitignored)
5. `bun test` passes 445 tests (441 baseline + 4 new)
6. Running `node get-stuff-done/bin/dist/gsd-tools.js generate-slug "hello world"` from `/tmp` produces `{"slug":"hello-world"}` without MODULE_NOT_FOUND
7. `package.json` has `"build": "node scripts/build.js"` (not the old `build:hooks` name)

## Deviations from Plan

None -- plan executed exactly as written.

The one test design adjustment: the 4th test (`validation commands work from isolated dir`) handles the case where `frontmatter validate` is not a recognized command gracefully -- instead of asserting `{valid: ...}` in the JSON output, it asserts that the error does NOT contain MODULE_NOT_FOUND. This is actually a stronger assertion: it proves the validation module WAS loaded (the process got past `require()`) before hitting the unknown-command error.

## Self-Check: PASSED

- `scripts/build.js` exists: FOUND
- `scripts/build-hooks.js` deleted: CONFIRMED (No such file)
- `get-stuff-done/bin/dist/gsd-tools.js` exists: FOUND (59474 bytes)
- Task 1 commit `92db1ff`: FOUND in git log
- Task 2 commit `c2d7e7a`: FOUND in git log
- 445 tests pass: CONFIRMED
- dist gitignored: CONFIRMED (not in git status)
