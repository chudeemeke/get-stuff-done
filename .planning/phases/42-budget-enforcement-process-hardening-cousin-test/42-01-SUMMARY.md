---
phase: 42-budget-enforcement-process-hardening-cousin-test
plan: 01
subsystem: infra
tags: [performance, ci, github-actions, ajv, tdd]

requires:
  - phase: 41-foundation-flip-gate-install-audit-surface-windows-slo
    provides: perf-baseline.json with real linux, macos, and windows install/compose metrics
provides:
  - scripts/check-perf.js comparator for Phase 41 baselines
  - perf-budget CI job across linux, macos, and windows
  - acceptedRegressions target/global scope schema
affects: [phase-42, phase-43, ci, perf-baseline]

tech-stack:
  added: []
  patterns:
    - CLI policy comparator separated from benchmark capture
    - accepted regression escape hatch requires reviewed metadata plus explicit target scope

key-files:
  created:
    - scripts/check-perf.js
    - tests/check-perf.test.js
  modified:
    - config/perf-baseline.schema.json
    - package.json
    - .github/workflows/ci.yml
    - tests/ci-workflow.test.js
    - tests/perf-baseline-schema.test.js

key-decisions:
  - "Perf budget thresholds are strict greater-than boundaries: 1.10x warns only when exceeded; 1.25x fails only when exceeded."
  - "acceptedRegressions entries must target platform plus metric unless they declare explicit reviewed global scope."
  - "scripts/bench.js remains measurement-only; scripts/check-perf.js owns policy comparison."

patterns-established:
  - "Perf policy gates should compare committed baselines against current one-platform artifacts through a small CLI."
  - "CI workflow tests assert new jobs and runner labels so action YAML changes are covered locally."

requirements-completed: ["PERF-03", "PERF-04", "PERF-05"]

duration: 11 min
completed: 2026-07-03
---

# Phase 42 Plan 01: Perf Budget Comparison and CI Enforcement Summary

**Per-platform install/compose perf budget enforcement with reviewed accepted-regression scoping and a blocking `perf-budget` CI job**

## Performance

- **Duration:** 11 min
- **Started:** 2026-07-03T06:31:00Z
- **Completed:** 2026-07-03T06:42:25Z
- **Tasks:** 4
- **Files modified:** 7

## Accomplishments

- Added `scripts/check-perf.js`, a CLI comparator that validates `perf-baseline.json`, compares current install/compose means per platform, emits GitHub warning/error annotations, and exits non-zero for unaccepted hard failures.
- Extended `config/perf-baseline.schema.json` so accepted regressions still require `reason`, `reviewer`, `reviewedDate`, and `ticket`, and now must also provide `platform` plus `metric` or explicit `scope: "global"`.
- Added `perf-budget` to `.github/workflows/ci.yml` across `ubuntu-latest`, `macos-15`, and `windows-latest`, using three hyperfine runs plus one warmup and enforcing `1.10` warning / `1.25` failure thresholds.

## Task Commits

Each task was committed atomically:

1. **RED: Perf budget policy tests** - `049af25` (`test`)
2. **GREEN: Perf budget comparator and schema** - `4b697aa` (`feat`)
3. **RED: Perf budget workflow invariant** - `326f743` (`test`)
4. **GREEN: CI perf-budget job** - `b1e315a` (`feat`)
5. **Refactor: Perf comparator lint surface** - `88a885f` (`refactor`)

**Plan metadata:** captured in the final plan completion commit.

## Files Created/Modified

- `scripts/check-perf.js` - CLI comparator for current metrics vs committed baseline.
- `tests/check-perf.test.js` - Behavior tests for pass, warning, failure, missing platform, and accepted regression cases.
- `config/perf-baseline.schema.json` - Accepted regression target/global scope schema.
- `tests/perf-baseline-schema.test.js` - Schema coverage for accepted regression scopes and missing metadata.
- `package.json` - Adds `perf:check` script.
- `.github/workflows/ci.yml` - Adds blocking `perf-budget` matrix job.
- `tests/ci-workflow.test.js` - Asserts the perf-budget workflow contract.

## Decisions Made

- Kept benchmark capture and policy comparison separate. `scripts/bench.js` still owns measurement; `scripts/check-perf.js` owns merge policy.
- Treated exact `1.10` and `1.25` ratios as non-crossing boundary values because the roadmap wording says greater than the thresholds.
- Modeled broad accepted regressions as explicit `scope: "global"` entries rather than treating missing target fields as a wildcard.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope creep.

## Issues Encountered

None.

## Verification

- `node scripts/check-perf.js --help` - passed.
- `bun test tests/check-perf.test.js tests/perf-baseline-schema.test.js tests/ci-workflow.test.js` - 22 pass, 0 fail.
- `bash scripts/lint-workflows.sh` - passed.
- `bun run lint` - passed with the repository's existing warning-only lint surface; no `scripts/check-perf.js` warnings remained.
- `git diff --check` - passed.
- `rg -n -- 'perf-budget|check-perf\.js|--warn-ratio 1\.10|--fail-ratio 1\.25' .github\workflows\ci.yml tests\ci-workflow.test.js` - found expected workflow/test references.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 01 is ready for remote CI validation. Phase 42 Wave 1 can continue with Plan 02 runtime package provenance and Plan 04 oversight probes; Plan 03 remains dependent on Plan 02.

---
*Phase: 42-budget-enforcement-process-hardening-cousin-test*
*Completed: 2026-07-03*
