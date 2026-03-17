---
phase: 11-ci-cd
plan: 05
subsystem: ci-cd
tags: [github-actions, ci, linting, parity-check, cross-platform]
dependency-graph:
  requires: [11-02, 11-03, 11-04]
  provides: [ci-pipeline, parity-validation]
  affects: [release-workflow, publishing]
key-files:
  created:
    - .github/workflows/ci.yml
    - scripts/check-parity.js
  modified:
    - eslint.config.js
decisions:
  - TEST-MATRIX-001: Cross-platform test matrix (ubuntu, macos, windows) with fail-fast disabled for complete platform coverage visibility
  - PARITY-STRATEGY-001: Source-to-installed parity check validates package.json files array, with special handling for build-generated hooks/dist directory
  - LINT-TEST-001: Test files exempt from security ESLint rules (non-literal fs/require operations needed for mocks)
metrics:
  duration_minutes: 8
  completed: 2026-02-16
---

# Phase 11 Plan 05: GitHub Actions CI Workflow Summary

**One-liner:** GitHub Actions CI pipeline with cross-platform matrix testing, ESLint linting, coverage reporting, and source-to-installed parity validation

## What Was Built

### 1. Source-to-Installed Parity Check Script (scripts/check-parity.js)

A Node.js script that verifies all distributable files declared in package.json exist in source:

- Reads package.json "files" array (bin, commands, get-stuff-done, agents, hooks/dist, scripts, src)
- Validates directories are non-empty, files exist
- Special handling for hooks/dist (build-generated): checks hooks/ source files instead
- Verifies key distributable files: bin/gsd.js, bin/install.js, gsd-tools.js, ConfigLoader, platform detection
- Verifies hooks source files: gsd-check-update.js, gsd-statusline.js, pre-compact.js
- Exit 0 if all pass, exit 1 if any fail
- Output format: colored PASS/FAIL/SKIP status with file counts

**Verification:** 15/15 checks passed, 1 skipped (hooks/dist build artifact)

### 2. GitHub Actions CI Workflow (.github/workflows/ci.yml)

Three-job pipeline triggered on push/PR to main:

**Job 1: Lint**
- Runs on ubuntu-latest
- Uses oven-sh/setup-bun@v2 with latest bun
- Frozen lockfile install
- ESLint check (bun run lint)

**Job 2: Test (Cross-Platform Matrix)**
- Matrix: ubuntu-latest, macos-latest, windows-latest
- fail-fast: false (complete visibility across all platforms)
- Bun dependency caching (runner.os-specific, keyed on bun.lock hash)
- Frozen lockfile install
- Full test suite with coverage (bun test --coverage)

**Job 3: Parity Check**
- Runs on ubuntu-latest
- No dependencies needed (pure Node.js script)
- Validates source-to-installed file consistency

### 3. ESLint Config Updates (eslint.config.js)

Added test file configuration block:

- Files: tests/**/*.js
- Bun test globals: describe, it, test, expect, beforeAll/Each, afterAll/Each, jest, mock
- Security rule exemptions for test files:
  - detect-non-literal-fs-filename: off (mocks use dynamic paths)
  - detect-non-literal-require: off (dynamic module loading in tests)
  - detect-child-process: off (process spawning tests)
  - detect-object-injection: off (fixture data access)

**Rationale:** Test files require dynamic file system operations, process mocking, and dynamic module loading for comprehensive testing. These are safe in test context and necessary for effective testing.

## Test Suite Results

**Lint:** 0 errors, 95 warnings
- 91 warnings from get-stuff-done/bin/gsd-tools.js (upstream code, documented as non-blocking in STATE.md)
- 4 warnings from scripts/check-parity.js (expected for file operations)
- 1 warning from .planning/sync/cherry-pick-all.js (will be cleaned up)

**Tests:** 298 tests passing across 8 files
- Test execution: 38.81s
- 546 expect() calls
- No failures

**Coverage:**
- Functions: 92.00%
- Lines: 86.10%
- All main source modules: 98-100% line coverage (config, validation, theme)
- Platform modules: 50-70% line coverage (OS-specific branches can't all execute in single test run)
- Test helpers: Lower coverage (unused fallback/error paths expected)

**Parity:** 15/15 checks passed
- All package.json files entries verified
- All key distributable files exist
- All hooks source files present

## CI Job Verification

All three CI jobs verified locally:

1. ✅ `bun run lint` - 0 errors (warnings acceptable)
2. ✅ `bun test --coverage` - 298 pass, 92% functions / 86% lines
3. ✅ `node scripts/check-parity.js` - exit 0, all PASS

## Deviations from Plan

None - plan executed exactly as written.

## Commits

- `e72fc89`: chore(11-05): add source-to-installed parity check script
- `15fb1cc`: chore(11-05): add GitHub Actions CI workflow and update ESLint config

## Self-Check: PASSED

Created files:
```bash
$ ls -la .github/workflows/ci.yml
-rw-r--r-- 1 Destiny 197609 953 Feb 16 12:22 .github/workflows/ci.yml

$ ls -la scripts/check-parity.js
-rw-r--r-- 1 Destiny 197609 5485 Feb 16 12:17 scripts/check-parity.js
```

Modified files:
```bash
$ git diff HEAD~2 eslint.config.js | grep -c "files: \['tests/"
1
```

Commits:
```bash
$ git log --oneline --all | grep -c "e72fc89"
1

$ git log --oneline --all | grep -c "15fb1cc"
1
```

All files created, all commits present.
