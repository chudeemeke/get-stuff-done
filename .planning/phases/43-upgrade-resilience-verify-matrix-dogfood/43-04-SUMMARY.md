---
phase: 43-upgrade-resilience-verify-matrix-dogfood
plan: 04
subsystem: upgrade-matrix
tags: [compat-matrix, ci, vetted-upstream, evidence]
requires:
  - phase: 43-upgrade-resilience-verify-matrix-dogfood
    provides: vetted upstream manifest and helper
provides:
  - Manifest-driven N=3 compatibility matrix runner
  - Report-only GitHub Actions compatibility matrix workflow
  - Matrix evidence applied to vetted upstream manifest
affects: [phase-43, upgrade-resilience, ci, upstream-authority]
tech-stack:
  added: []
  patterns:
    - Temp-isolated upstream package install per matrix candidate
    - Blocking-vs-informational classification in report data
    - Report-only CI for established upstream-compat drift
key-files:
  created:
    - scripts/run-compat-matrix.js
    - .github/workflows/compat-matrix.yml
  modified:
    - package.json
    - tests/run-upstream-compat-ci.test.js
    - tests/ci-workflow.test.js
    - .planning/vetted-upstream-versions.json
    - .planning/vetted-upstream-versions.schema.json
    - scripts/vetted-upstream-versions.js
    - tests/vetted-upstream-versions.test.js
key-decisions:
  - "The matrix expands only from .planning/vetted-upstream-versions.json."
  - "The CLI exits non-zero when the current blocking pin fails, but CI remains report-only per AF-7 because upstream-compat is intentionally informational today."
  - "Matrix evidence is truthful: all three candidate rows currently fail with 14 upstream-compat failures; the current 1.5.0 row is the blocking drift row."
requirements-completed: ["UPGRADE-02", "UPGRADE-04"]
decisions-completed: ["D-07", "D-08"]
duration: 27 min
completed: 2026-07-03
---

# Phase 43 Plan 04: Compatibility Matrix Evidence And CI Summary

**Manifest-driven matrix exists in code and CI, with failed compat evidence recorded honestly.**

## Performance

- **Duration:** 27 min
- **Completed:** 2026-07-03T22:38:47+01:00
- **Tasks:** 4
- **Files modified:** 11

## Accomplishments

- Added `scripts/run-compat-matrix.js`.
  - Reads `.planning/vetted-upstream-versions.json`.
  - Installs each exact `@opengsd/gsd-core` candidate into a temp root.
  - Composes temp `dist` output per candidate without mutating repo `dist/`.
  - Runs the existing upstream compatibility runner against that temp output.
  - Emits JSON rows with `version`, `blocking`, `ok`, `exitCode`, `durationMs`, and `classification`.
- Added `compat:matrix` package script.
- Applied real matrix evidence to `.planning/vetted-upstream-versions.json` for `1.5.0`, `1.6.0`, and `1.6.1`.
- Added `.github/workflows/compat-matrix.yml`.
  - Validates the manifest as a blocking step.
  - Runs the matrix as report-only, because AF-7 forbids converting existing upstream-compat informational CI into a blocking PR check.
  - Uploads `compat-matrix-report.json` with `actions/upload-artifact@v7` and fails if the report is missing.
- Marked UPGRADE-02 and UPGRADE-04 complete.

## Matrix Evidence

The real matrix command was run:

`node scripts/run-compat-matrix.js --json --report compat-matrix-report.json`

Result: exit code 1, because the current blocking pin failed.

Rows recorded:

| Version | Role | Classification | Status | Failed Tests |
|---------|------|----------------|--------|--------------|
| 1.5.0 | current | blocking | failed | 14 |
| 1.6.0 | historical-candidate | informational | failed | 14 |
| 1.6.1 | latest-stable-candidate | informational | failed | 14 |

This is not a new matrix-isolation failure: `node scripts/run-upstream-compat-ci.js` on the current repo also reports 14 upstream-compat failures and exits 0 by design.

## Task Commits

1. **Task 04-01: Matrix runner tests first** - `a47be85` (test)
2. **Task 04-02: Matrix runner and package script** - `c39687e` (feat), `665b2d2` (fix)
3. **Task 04-03: Apply matrix evidence** - `f87cf3e` (docs)
4. **Task 04-04: CI workflow** - `9aaf8d5` (ci)
5. **Task 04-04: Record summary/state** - pending metadata commit

## Deviations from Plan

### Auto-fixed Issues

**1. [Windows npm spawn] Routed npm through cmd.exe on Windows**
- **Found during:** real current-pin matrix run
- **Issue:** Node could not directly spawn `npm` or `npm.cmd` in this environment (`spawnSync npm.cmd EINVAL`).
- **Fix:** Reused the repo's existing Windows pattern: `cmd.exe /d /s /c npm.cmd ...`.
- **Verification:** The real matrix installed all three exact pins and produced report rows.

**2. [Candidate failure handling] Structured candidate errors instead of aborting**
- **Found during:** real matrix hardening
- **Issue:** A per-version install/compose failure could prevent the matrix from writing evidence for later rows.
- **Fix:** Candidate failures are now structured failed rows; manifest validation still fails before any candidate runs.
- **Verification:** Added `records candidate runner errors and continues through the matrix`.

**3. [Schema alignment] Changed `vettedAt` schema format from date-time to date**
- **Found during:** evidence application
- **Issue:** The plan requires `vettedAt: "2026-07-03"`, but the schema said `date-time`.
- **Fix:** Updated schema and helper wording to date strings.
- **Verification:** `node scripts/vetted-upstream-versions.js --validate` passed.

**4. [CI policy conflict] Kept matrix workflow report-only**
- **Found during:** requirements reconciliation
- **Issue:** The plan's blocking-row policy conflicts with AF-7 if wired directly as a PR-blocking upstream-compat check.
- **Fix:** The CLI preserves blocking exit semantics; the GitHub Actions workflow records and uploads evidence without failing the PR for known upstream-compat drift.
- **Verification:** `tests/ci-workflow.test.js` asserts the AF-7 report-only behavior.

## Verification

- RED: `bun test tests/run-upstream-compat-ci.test.js` failed before implementation because `scripts/run-compat-matrix.js` did not exist.
- `node scripts/run-compat-matrix.js --version 1.5.0 --json --report compat-matrix-current-report.json` - produced a blocking failed row; temp report removed.
- `node scripts/run-compat-matrix.js --json --report compat-matrix-report.json` - produced all three rows; exit 1 due current blocking failure; temp report removed after evidence application.
- `node scripts/vetted-upstream-versions.js --apply-matrix-evidence compat-matrix-report.json --date 2026-07-03` - passed.
- `node scripts/vetted-upstream-versions.js --validate` - passed.
- `node scripts/run-compat-matrix.js --help` - passed.
- `bun test tests/run-upstream-compat-ci.test.js tests/vetted-upstream-versions.test.js tests/ci-workflow.test.js` - passed.
- `bash scripts/lint-workflows.sh` - passed.
- `bunx eslint scripts/run-compat-matrix.js tests/run-upstream-compat-ci.test.js` - passed.

## User Setup Required

None.

## Next Phase Readiness

Ready for Plan 43-05. The matrix now exists and records real drift; Plan 43-05 can focus on semantic JavaScript override staleness without carrying matrix implementation debt.

---
*Phase: 43-upgrade-resilience-verify-matrix-dogfood*
