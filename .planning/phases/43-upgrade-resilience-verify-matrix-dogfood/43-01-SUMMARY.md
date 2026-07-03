---
phase: 43-upgrade-resilience-verify-matrix-dogfood
plan: 01
subsystem: ci
tags: [upgrade-verifier, verdaccio, npm, temp-isolation, upstream-bump]
requires:
  - phase: 42-budget-enforcement-process-hardening-cousin-test
    provides: runtime package provenance and cousin cold-install smoke pattern
provides:
  - Temp-isolated `verify-upgrade` CLI and package script
  - D-03 structured upgrade report schema
  - Linux Verdaccio upgrade verifier workflow
affects: [phase-43, upgrade-resilience, ci, maintenance-evidence]
tech-stack:
  added: []
  patterns:
    - Injected command runner for upgrade orchestration tests
    - Temp-scoped HOME, USERPROFILE, CLAUDE_CONFIG_DIR, npmrc, and npm cache
key-files:
  created:
    - scripts/verify-upgrade.js
    - tests/verify-upgrade.test.js
    - .github/workflows/upgrade-verifier.yml
  modified:
    - package.json
    - tests/ci-workflow.test.js
key-decisions:
  - "verify-upgrade rejects tags, ranges, and prerelease versions; only exact stable upstream pins are accepted."
  - "Unit tests use an injected runner and explicit workspace-copy skip so CI-facing orchestration remains testable without local npm/Verdaccio mutation."
  - "The full Verdaccio verifier is Linux CI scoped for this plan; local verification covered CLI/report behavior and workflow shape."
patterns-established:
  - "Maintainer upgrade simulations must emit machine-readable exit classifications."
  - "Upgrade tests assert temp-scoped install/config paths before CI exercises the live registry path."
requirements-completed: ["UPGRADE-01"]
duration: 18 min
completed: 2026-07-03
---

# Phase 43 Plan 01: Upgrade Verifier Summary

**Temp-isolated Open GSD upgrade verifier with D-03 JSON reporting and a Linux Verdaccio CI workflow**

## Performance

- **Duration:** 18 min
- **Started:** 2026-07-03T20:00:00+01:00
- **Completed:** 2026-07-03T20:17:10+01:00
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments

- Added `scripts/verify-upgrade.js`, a CommonJS CLI and importable helper that rejects non-exact upstream versions and records the planned upgrade sequence: `pack-current`, `publish-current`, `install-from`, `bump-upstream`, `compose`, `pack-bumped`, `publish-bumped`, `reinstall-to`, and `smoke-verify`.
- Added the full D-03 report surface: `fromVersion`, `toVersion`, `registryUrl`, `packageTarball`, `packedArtifact`, `composeResult`, `reinstallTarget`, `smokeCommands`, `durationMs`, `changedOverrides`, `steps`, `warnings`, and `exitClassification`.
- Added temp-scope protections for `HOME`, `USERPROFILE`, `CLAUDE_CONFIG_DIR`, `npm_config_userconfig`, `NPM_CONFIG_USERCONFIG`, `npm_config_cache`, and `NPM_CONFIG_CACHE`.
- Added `.github/workflows/upgrade-verifier.yml` with a `verdaccio/verdaccio:6` service on `4873:4873`, weekly/manual/path-scoped PR triggers, `bun run verify-upgrade --from 1.5.0 --to 1.6.1 --registry-url http://localhost:4873/ --json --report upgrade-report.json`, and `actions/upload-artifact@v7`.

## Task Commits

Each task was committed atomically:

1. **Task 01-01: Write verifier report tests first** - `03ea169` (test)
2. **Task 01-02: Implement verify-upgrade orchestration** - `9015bfc` (feat)
3. **Task 01-03: Wire Linux Verdaccio verifier workflow** - `0bd2aa2` (feat)
4. **Task 01-04: Record verifier summary** - pending metadata commit

## Files Created/Modified

- `scripts/verify-upgrade.js` - Temp-isolated upgrade verification CLI, report generator, and injected-runner orchestration helper.
- `tests/verify-upgrade.test.js` - CLI/report schema, temp-env, invalid-version, and failure-classification coverage.
- `.github/workflows/upgrade-verifier.yml` - Linux Verdaccio workflow for scheduled/manual/upgrade-path PR verification.
- `tests/ci-workflow.test.js` - Workflow contract coverage for the upgrade verifier.
- `package.json` - Added `verify-upgrade` script.

## Decisions Made

- Exact stable upstream pins are enforced at parse time with `exact stable version required`; `latest`, `next`, ranges, and prereleases fail before orchestration.
- The exported helper accepts an injected runner, so report schema, environment injection, and failure classification are unit-testable without a real registry.
- Real CLI runs copy a workspace before bumping the upstream dependency; tests set `prepareWorkspace: false` only for fake-runner speed and isolation.
- Local verification did not run a Verdaccio container; the new workflow is the Verdaccio execution surface and will publish `upgrade-report.json`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Avoided fake-runner unit-test timeout from workspace copying**
- **Found during:** Task 01-02 (Implement verify-upgrade orchestration)
- **Issue:** The fake-runner tests timed out because helper execution copied the repo workspace before simulated commands.
- **Fix:** Added explicit `prepareWorkspace: false` support for injected-runner tests while preserving default workspace copying for the real CLI.
- **Files modified:** `scripts/verify-upgrade.js`, `tests/verify-upgrade.test.js`
- **Verification:** `bun test tests/verify-upgrade.test.js` passed in under one second after the fix.
- **Committed in:** `9015bfc`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix improved testability without weakening the real upgrade verifier path.

## Issues Encountered

- Local task verification did not start a real Verdaccio service. The CI workflow now owns that registry-backed path and writes `upgrade-report.json` as the durable artifact.

## Verification

- `bun test tests/verify-upgrade.test.js` - passed
- `node scripts/verify-upgrade.js --help` - passed
- `bun test tests/ci-workflow.test.js` - passed
- `bash scripts/lint-workflows.sh` - passed
- `rg -n "verdaccio/verdaccio:6|4873|verify-upgrade|upgrade-report.json|actions/upload-artifact@v7" .github/workflows/upgrade-verifier.yml tests/ci-workflow.test.js` - passed

## User Setup Required

None - no external service configuration required for local use. The Verdaccio service is provisioned by the GitHub Actions workflow.

## Next Phase Readiness

Ready for Plan 43-02. The upgrade verifier now provides a D-03 report contract for later maintenance evidence, but the live Verdaccio run remains CI evidence to collect after this branch is pushed.

---
*Phase: 43-upgrade-resilience-verify-matrix-dogfood*
*Completed: 2026-07-03*
