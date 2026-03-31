---
phase: 33-installer-update-workflow
plan: 02
subsystem: tooling
tags: [preview-update, supply-chain, overrides, npm, semver]

requires:
  - phase: 31-feature-flags-override-system
    provides: checkOverrides() staleness detection
  - phase: 18-upstream-sync-execution
    provides: runSupplyChainChecks() 6-vector scanner in sync.cjs
provides:
  - preview-update CLI script (bun run preview-update)
  - getVersionDelta, runPreviewScan, getOverrideImpact, generateReport exports
  - Terraform plan/apply pattern for upstream version updates
affects: [33-installer-update-workflow, 35-migration]

tech-stack:
  added: []
  patterns: [terraform-plan-apply, delegation-to-existing-modules, fallback-checks]

key-files:
  created:
    - scripts/preview-update.js
    - tests/preview-update.test.js
  modified:
    - package.json

key-decisions:
  - "Fallback supply chain checks when sync.cjs not loadable from source tree (dist/ import path)"
  - "Known author string 'npm-package' to skip author-anomaly check for npm packages"
  - "getVersionDelta accepts explicit args for testing, reads package.json when called with no args"
  - "getOverrideImpact directly delegates to checkOverrides (no wrapper logic needed)"

patterns-established:
  - "Preview scripts: read-only, no fs writes, structured report output, module exports for testability"
  - "Supply chain scan adaptation: filter irrelevant checks (author-anomaly) for non-git contexts"

requirements-completed: [UPD-01, UPD-02, UPD-03, UPD-04]

duration: 6min
completed: 2026-03-29
---

# Phase 33 Plan 02: Preview-Update Summary

**Read-only preview-update script with version diff, 6-vector supply chain scan, override staleness check, and structured report with rollback instructions**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-29T21:00:37Z
- **Completed:** 2026-03-29T21:07:07Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- TDD'd preview-update script that diffs pinned upstream version against npm latest
- Reuses existing runSupplyChainChecks() from sync.cjs and checkOverrides() from check-overrides.js
- 5-section structured report: Version Delta, Supply Chain Scan, Override Impact, Next Steps, Rollback
- Script is read-only (no fs write operations, modifies nothing)

## Task Commits

Each task was committed atomically:

1. **Task 1: RED -- failing tests** - `2f96a50` (test)
2. **Task 2: GREEN -- implementation** - `2b7a408` (feat)

## Files Created/Modified
- `scripts/preview-update.js` - Read-only update preview script with 4 exported functions
- `tests/preview-update.test.js` - 27 tests covering UPD-01 through UPD-04
- `package.json` - Added "preview-update" script entry

## Decisions Made
- sync.cjs imports target dist/ layout (../get-shit-done/bin/lib/core.cjs) which is not resolvable from source tree. Implemented fallback supply chain checks that replicate execution-path and prompt-integrity vectors inline when sync.cjs cannot be loaded.
- Used 'npm-package' as a known author string passed to runSupplyChainChecks to ensure author-anomaly check does not trigger for npm package updates. Also filter out any author-anomaly findings from results.
- getVersionDelta supports dual call modes: no-args (reads package.json + queries npm) and explicit args (for unit testing without network calls).
- getOverrideImpact is a thin delegation to checkOverrides() -- no additional wrapper logic needed since the existing module already returns the full structured result.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] sync.cjs not loadable from source tree**
- **Found during:** Task 2 (runPreviewScan implementation)
- **Issue:** overlay/lib/sync.cjs requires ../get-shit-done/bin/lib/core.cjs which only exists in composed dist/ layout, not in the source tree
- **Fix:** Added fallback supply chain checks (runFallbackChecks) that replicate file-path-based vectors (execution-path, prompt-integrity) inline. When sync.cjs loads successfully, uses the full 6-vector scanner.
- **Files modified:** scripts/preview-update.js
- **Verification:** All 27 tests pass; fallback checks correctly trigger for execution-path and prompt-integrity vectors
- **Committed in:** 2b7a408

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Fallback checks ensure the script works in both source tree and composed dist/ contexts. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- preview-update script ready for use: `bun run preview-update`
- Phase 33 Plan 01 (installer) can proceed independently (Wave 1 parallel)
- Supply chain scanning works with fallback for source tree; full scanner available after compose

---
*Phase: 33-installer-update-workflow*
*Completed: 2026-03-29*
