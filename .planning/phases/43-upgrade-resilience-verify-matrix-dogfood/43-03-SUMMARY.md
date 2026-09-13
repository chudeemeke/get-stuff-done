---
phase: 43-upgrade-resilience-verify-matrix-dogfood
plan: 03
subsystem: upgrade-matrix
tags: [vetted-upstream, manifest, compat-matrix, exact-pins]
requires:
  - phase: 43-upgrade-resilience-verify-matrix-dogfood
    provides: installer rollback and provenance clarity
provides:
  - N=3 upstream candidate manifest
  - Vetted manifest JSON schema
  - Manifest validation/list/evidence/prune helper CLI
affects: [phase-43, upgrade-resilience, compat-matrix, upstream-authority]
tech-stack:
  added: []
  patterns:
    - Manifest-first matrix source of truth
    - Candidate state separated from matrix evidence state
key-files:
  created:
    - .planning/vetted-upstream-versions.json
    - .planning/vetted-upstream-versions.schema.json
    - scripts/vetted-upstream-versions.js
  modified:
    - package.json
key-decisions:
  - "The initial candidate set is exactly 1.5.0, 1.6.0, and 1.6.1 based on refreshed npm metadata from 2026-07-03."
  - "All entries keep vettedAt null until Plan 04 applies compatibility matrix evidence."
  - "Only the current pinned upstream version is blocking; historical/latest candidates remain non-blocking until matrix policy uses them."
  - "pruneForBump adds the new stable version as current/blocking and drops the oldest version to keep exactly three entries."
patterns-established:
  - "Compatibility matrix expansion must read .planning/vetted-upstream-versions.json, not hardcoded version lists."
  - "Stable exact semver validation rejects latest, next, and prerelease versions before evidence can be applied."
requirements-completed: []
decisions-completed: ["D-07", "D-08"]
duration: 22 min
completed: 2026-07-03
---

# Phase 43 Plan 03: Vetted Upstream Candidate Manifest Summary

**N=3 exact-stable Open GSD candidate manifest with validation and prune helper**

## Performance

- **Duration:** 22 min
- **Started:** 2026-07-03T21:49:00+01:00
- **Completed:** 2026-07-03T22:11:37+01:00
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments

- Rechecked npm metadata: `@opengsd/gsd-core` still reports `latest = 1.6.1`, `next = 1.7.0-rc.2`, with stable versions including `1.5.0`, `1.6.0`, and `1.6.1`.
- Added `.planning/vetted-upstream-versions.json` with exactly three candidate versions:
  - `1.5.0` as `current`, `blocking: true`, `vettedAt: null`.
  - `1.6.0` as `historical-candidate`, `blocking: false`, `vettedAt: null`.
  - `1.6.1` as `latest-stable-candidate`, `blocking: false`, `vettedAt: null`.
- Added `.planning/vetted-upstream-versions.schema.json` with `maxVersions: 3`, `vettedAt`, and `evidence.matrixReport` shape.
- Added `scripts/vetted-upstream-versions.js` with `loadVettedManifest`, `validateVettedManifest`, `listMatrixEntries`, `applyMatrixEvidence`, and `pruneForBump`.
- Added CLI modes `--validate`, `--list-json`, `--apply-matrix-evidence <report>`, and `--prune-for-bump <version>`.
- Added package script `vetted-upstream:validate`.

## Task Commits

Each task was committed atomically:

1. **Task 03-01: Write vetted manifest tests first** - `ce2690f` (test)
2. **Tasks 03-02 / 03-03: Add manifest, schema, helper, package script** - `11e0f9f` (feat)
3. **Task 03-04: Record manifest summary** - pending metadata commit

## Files Created/Modified

- `.planning/vetted-upstream-versions.json` - Candidate manifest and matrix source of truth.
- `.planning/vetted-upstream-versions.schema.json` - Schema for the manifest shape.
- `scripts/vetted-upstream-versions.js` - Validation, list, evidence application, and prune helper.
- `tests/vetted-upstream-versions.test.js` - TDD coverage for exact-three policy, exact stable pins, blocking current pin, `vettedAt` evidence rules, and pruning.
- `package.json` - Added `vetted-upstream:validate`.

## Decisions Made

- The manifest intentionally uses candidate state, not evidence-complete state. `vettedAt` remains `null` because Plan 04 is responsible for running the compatibility matrix and applying `evidence.matrixReport`.
- `UPGRADE-02` remains pending. Plan 03 creates the manifest/helper prerequisite, but the historical-version compatibility matrix does not run in CI until Plan 04.
- `pruneForBump(manifest, "1.7.0")` keeps exactly three entries by returning `1.6.0`, `1.6.1`, and `1.7.0`, with the new stable version marked `current` and `blocking`.
- The helper reuses upstream-authority exact stable semver validation so `latest`, `next`, and prerelease versions cannot enter the matrix.

## Deviations from Plan

### Auto-fixed Issues

**1. [Shell quoting] Replaced fragile rg verification with Select-String**
- **Found during:** package script verification
- **Issue:** PowerShell split the `rg` pattern containing `--validate` as if it were a flag/path.
- **Fix:** Verified the package script with `Select-String -LiteralPath package.json -Pattern 'vetted-upstream:validate'`.
- **Verification:** Located `package.json:89` with the expected script.

**2. [PowerShell pipeline encoding] Avoided JSON parse through PowerShell pipe**
- **Found during:** `--list-json` verification
- **Issue:** Piping JSON through PowerShell into `node -e` inserted a BOM before the JSON payload.
- **Fix:** Verified `node scripts/vetted-upstream-versions.js --list-json` directly and kept structured parsing in Bun tests.
- **Verification:** Direct CLI output showed the three JSON entries, and `bun test tests/vetted-upstream-versions.test.js` parsed/listed entries successfully.

---

**Total deviations:** 2 auto-fixed tooling issues
**Impact on plan:** No product or manifest behavior changed; only verification command mechanics were adjusted for PowerShell.

## Issues Encountered

- None blocking. The manifest is deliberately not evidence-complete yet; Plan 04 owns matrix execution and `vettedAt` population.

## Verification

- RED: `bun test tests/vetted-upstream-versions.test.js` failed before implementation because `scripts/vetted-upstream-versions.js` did not exist.
- `npm view @opengsd/gsd-core version dist-tags versions --json` - passed; confirmed `latest = 1.6.1`, `next = 1.7.0-rc.2`.
- `bun test tests/vetted-upstream-versions.test.js` - passed.
- `node scripts/vetted-upstream-versions.js --validate` - passed.
- `node scripts/vetted-upstream-versions.js --list-json` - passed.
- `bun run vetted-upstream:validate` - passed.
- `bunx eslint scripts/vetted-upstream-versions.js tests/vetted-upstream-versions.test.js` - passed with 0 errors and 0 warnings after comparator cleanup.
- `bun test tests/vetted-upstream-versions.test.js tests/upstream-source.test.js tests/run-upstream-compat-ci.test.js` - passed.
- `bun test tests/ci-workflow.test.js` - passed.
- `Select-String -LiteralPath package.json -Pattern 'vetted-upstream:validate'` - passed.

## User Setup Required

None.

## Next Phase Readiness

Ready for Plan 43-04. The compatibility matrix can now expand from `.planning/vetted-upstream-versions.json`, and Plan 04 can apply matrix evidence to replace the current `vettedAt: null` candidate state.

---
*Phase: 43-upgrade-resilience-verify-matrix-dogfood*
