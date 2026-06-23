---
phase: 41-foundation-flip-gate-install-audit-surface-windows-slo
plan: 01
subsystem: ci
tags: [override-staleness, changelog, actionlint, workflow]

requires:
  - phase: 40.6-upstream-authority-migration
    provides: Open GSD authority and fresh override hashes
provides:
  - Blocking override staleness CI job
  - Informational boundary check with blocking debt ratchet
  - Changelog published-section conflict self-test
affects: [phase-41, upgrade-resilience, maintenance-runbook]

tech-stack:
  added: [github-actionlint]
  patterns:
    - Split blocking and informational CI signals into separate jobs
    - Self-tested shell guard with isolated markdown fixtures

key-files:
  created:
    - .changelog-conflict-check.sh
    - tests/check-overrides-integration.test.js
    - tests/fixtures/changelog-conflict/good-changelog.md
    - tests/fixtures/changelog-conflict/bad-changelog.md
  modified:
    - .github/workflows/ci.yml
    - scripts/lint-workflows.sh
    - tests/check-overrides.test.js

key-decisions:
  - "boundary-check remains informational; override-check is blocking"
  - "scripts/lint-workflows.sh now falls back to github-actionlint@1.7.12 when Docker is unavailable locally"
  - "The changelog guard runs against explicit files or --self-test rather than defaulting to the legacy CHANGELOG.md history"

patterns-established:
  - "Blocking CI gates get their own job id and no continue-on-error"
  - "Published-changelog conflict checks stay single-pattern until the Phase 42 markdown toolchain exists"

requirements-completed: [UPGRADE-03]
requirements-advanced: [UPGRADE-06]

duration: 1h 08m
completed: 2026-06-23
---

# Phase 41 Plan 01: Override Gate and Changelog Guard Summary

**Blocking override staleness gate plus a single-pattern changelog conflict self-test for Phase 41 upgrade hygiene**

## Performance

- **Duration:** 1h 08m
- **Started:** 2026-06-23T01:32:47Z
- **Completed:** 2026-06-23T02:40:45+01:00
- **Tasks:** 4
- **Files modified:** 7

## Accomplishments

- Split the previous combined `boundary-override-check` job into `boundary-check` and `override-check`.
- Preserved `node scripts/check-boundary.js` as informational while keeping `node scripts/check-debt-ratchet.cjs --no-compose` blocking.
- Made `node scripts/check-overrides.js` a blocking CI job with no `continue-on-error`.
- Added unit and subprocess integration coverage for stale override and missing `REASON.md` failures.
- Added `.changelog-conflict-check.sh --self-test` with good and bad changelog fixtures.

## Task Commits

1. **Task 01-01: Split boundary and override CI jobs** - `819c078` (ci)
2. **Task 01-02: Extend override gate tests before relying on CI** - `5e2cbfa` (test)
3. **Task 01-03: Add changelog conflict guard and fixtures** - `10f4e18` (test)

## Files Created/Modified

- `.github/workflows/ci.yml` - separate `boundary-check` and blocking `override-check` jobs.
- `scripts/lint-workflows.sh` - actionlint local fallback when Docker is unavailable.
- `tests/check-overrides.test.js` - CLI output assertions for stale and missing-REASON failures.
- `tests/check-overrides-integration.test.js` - isolated subprocess proof for stale override failure.
- `.changelog-conflict-check.sh` - state-machine guard with `--self-test`.
- `tests/fixtures/changelog-conflict/good-changelog.md` - passing fixture.
- `tests/fixtures/changelog-conflict/bad-changelog.md` - failing fixture with line-numbered output.

## Verification

- `bash scripts/lint-workflows.sh` - passed.
- `bun test tests/check-overrides.test.js tests/check-overrides-integration.test.js` - passed, 58 tests.
- `bash .changelog-conflict-check.sh --self-test` - passed.
- `bash .changelog-conflict-check.sh tests/fixtures/changelog-conflict/bad-changelog.md` - exited 1 with `tests/fixtures/changelog-conflict/bad-changelog.md:10`.
- `bash .changelog-conflict-check.sh tests/fixtures/changelog-conflict/good-changelog.md` - passed.
- `node scripts/check-overrides.js` - passed; 2 overrides checked, all fresh.

## Decisions Made

- `boundary-check remains informational; override-check is blocking`.
- The workflow lint script keeps Docker as the CI path but can validate locally through pinned `github-actionlint@1.7.12` when Docker Desktop is not running.
- The changelog guard requires an explicit file or `--self-test`; this avoids invalidating existing historical published changelog sections while still guarding the intended fixture pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Workflow lint was not runnable on local Windows without Docker daemon**
- **Found during:** Task 01-01 (Split boundary and override CI jobs)
- **Issue:** `bash scripts/lint-workflows.sh` failed because Docker was installed but the daemon was unavailable.
- **Fix:** Added a narrow fallback to run pinned `github-actionlint@1.7.12` through `npx` when no local `actionlint` binary exists and Docker is not usable.
- **Files modified:** `scripts/lint-workflows.sh`
- **Verification:** `bash scripts/lint-workflows.sh` exited 0.
- **Committed in:** `819c078`

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** The fallback only affects local workflow lint execution. CI still uses Docker when available.

## Issues Encountered

- Docker Desktop was not running, so the original lint script could not satisfy the plan's own verification command until the local fallback was added.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 02 must wire the changelog self-test command into `MAINTENANCE.md` before `UPGRADE-06` is marked complete. Plan 03 can add scanner jobs knowing `override-check` is already a blocking CI status.

## Self-Check: PASSED

---
*Phase: 41-foundation-flip-gate-install-audit-surface-windows-slo*
*Completed: 2026-06-23*
