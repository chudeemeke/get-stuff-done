---
phase: 30-composition-pipeline-branding
plan: 01
subsystem: composition
tags: [branding, overlay, ajv, tdd, compose, substitution]

requires:
  - phase: 29-prototype-gate
    provides: "Validated that surface-only branding of upstream install.js is safe; sortSubstitutions pattern established"

provides:
  - "overlay/ directory scaffold (branding.json, features.json) that all subsequent phases depend on"
  - "overrides/ directory marker (empty, zero overrides on day one)"
  - "Branding engine functions exported from scripts/compose.js"
  - "AJV-backed schema validation for branding.json (BRAND-06)"
  - "Substitution ordering safety via sortSubstitutions (longest-first, BRAND-04)"
  - "shouldBrandFile exclusion rules for binary, overlay, overrides, and LICENSE"
  - "generateCredits for upstream attribution (BRAND-05)"
  - "41 passing branding engine tests covering BRAND-01 through BRAND-06"

affects:
  - 30-02-composition-pipeline
  - 31-feature-flags
  - 32-fork-code-porting
  - 33-installer

tech-stack:
  added: []
  patterns:
    - "sortSubstitutions before applyBrandingToContent: longest-first ordering prevents double-replace"
    - "Word-boundary regex for short all-caps tokens (TACHES); replaceAll for package names and URLs"
    - "AJV schema with additionalProperties:false for strict config validation"
    - "shouldBrandFile: extension-based binary detection, path-prefix exclusion for overlay/ and overrides/"

key-files:
  created:
    - overlay/branding.json
    - overlay/features.json
    - overlay/.gitkeep
    - overrides/.gitkeep
    - tests/branding.test.js
    - scripts/compose.js
  modified:
    - .gitignore
    - package.json

key-decisions:
  - "replaceAll for long patterns (>= 8 chars); word-boundary regex only for short all-caps tokens (TACHES). Rationale: replaceAll is safe for package names and URLs -- they are distinct enough that substring collision is impossible."
  - "Integration test counts raw bare-get-shit-done occurrences dynamically, not hard-coded to 29. The plan spec referenced a stale count (upstream v1.30.0 has 27, not 29). Dynamic comparison guarantees the test stays valid across upstream updates."
  - "BINARY_EXTENSIONS set excludes .svg in addition to raster images. SVG is XML-text but treated as binary by the branding engine to prevent accidental URL substitution in SVG data attributes."

patterns-established:
  - "TDD RED-GREEN: write tests/branding.test.js first (commit 5a9584c), then implement (commit 29e7b60)"
  - "CJS module pattern for scripts/: require/module.exports, consistent with build.js and check-parity.js"
  - "AJV instance created once at module load time (not per-call); compile() result cached as validateSchema"

requirements-completed:
  - BRAND-01
  - BRAND-02
  - BRAND-03
  - BRAND-04
  - BRAND-05
  - BRAND-06
  - COMP-05
  - COMP-11

duration: 4min
completed: 2026-03-28
---

# Phase 30 Plan 01: Overlay Scaffold & Branding Engine Summary

**Surface-only branding engine with AJV schema validation, longest-first substitution ordering, and binary/overlay/LICENSE exclusion -- 41 tests passing across BRAND-01 through BRAND-06**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-28T18:47:08Z
- **Completed:** 2026-03-28T18:51:11Z
- **Tasks:** 2 (plus TDD RED commit)
- **Files modified:** 8

## Accomplishments

- Created overlay/ and overrides/ directory scaffold (branding.json with 3 rules, features.json Phase 31 stub, .gitkeep markers)
- Implemented branding engine in scripts/compose.js with 5 exported functions (applyBrandingToContent, validateBrandingConfig, sortSubstitutions, shouldBrandFile, generateCredits)
- 41 branding tests pass covering BRAND-01 through BRAND-06 including integration test against real upstream install.js
- Added dist/ to .gitignore and "compose" script to package.json

## Task Commits

Each task was committed atomically:

1. **Task 1: Create overlay/ scaffold and update .gitignore** - `815186d` (chore)
2. **Task 2 RED: Failing branding engine tests** - `5a9584c` (test)
3. **Task 2 GREEN: Implement branding engine** - `29e7b60` (feat)

_TDD tasks have multiple commits (RED test commit, GREEN implementation commit)._

## Files Created/Modified

- `overlay/branding.json` - 3 text-scope substitution rules (npm package name, GitHub repo, author attribution)
- `overlay/features.json` - Phase 31 feature flag stub with full schema shape
- `overlay/.gitkeep` - Directory marker for fork additions (Phase 32)
- `overrides/.gitkeep` - Directory marker (zero overrides on day one, OVER-04)
- `tests/branding.test.js` - 41 tests covering BRAND-01 through BRAND-06 with integration test
- `scripts/compose.js` - Branding engine and CLI entry point
- `.gitignore` - Added dist/ for composition output
- `package.json` - Added "compose" script

## Decisions Made

- **replaceAll vs word-boundary regex split:** Long patterns (>= 8 chars) use replaceAll; short all-caps tokens (TACHES, < 8 chars) use `\b` regex. This is the minimum-complexity approach -- replaceAll handles package names and URLs safely because they are structurally distinct from any other substring.
- **Integration test uses dynamic bare-count comparison:** The plan spec said "exactly 29 bare get-shit-done references" but upstream v1.30.0 actually has 27. The test now counts rawBare in the source file and asserts brandedBare equals rawBare (all preserved). This is more correct and survives upstream version updates.
- **SVG treated as binary in shouldBrandFile:** Although SVG is text/XML, it may contain URL-like data attributes. Treating it as binary is the conservative choice that prevents accidental substitution in non-text contexts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Integration test count adjusted from 29 to dynamic comparison**
- **Found during:** Task 2 (TDD test design phase)
- **Issue:** Plan specified "exactly 29 bare get-shit-done path references" but upstream install.js v1.30.0 has 27 bare occurrences. Hard-coding 29 would cause the test to fail immediately.
- **Fix:** Changed test to count rawBare occurrences in the source file first, then assert brandedBare equals rawBare. Also added `toBeGreaterThan(10)` as a lower-bound sanity check.
- **Files modified:** tests/branding.test.js
- **Verification:** Integration test passes with the 27/27 comparison
- **Committed in:** 5a9584c (RED test commit, then 29e7b60 GREEN)

---

**Total deviations:** 1 auto-fixed (Rule 1 - specification diverged from actual upstream version)
**Impact on plan:** Necessary for correctness. The fix makes the test more robust, not more lenient.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- overlay/branding.json and scripts/compose.js branding functions are ready for Plan 02 (full composition pipeline)
- sortSubstitutions + applyBrandingToContent are the core pipeline's branding stage
- validateBrandingConfig runs before any substitutions in the pipeline entry point
- overlay/features.json stub is ready for Plan 01 of Phase 31 (feature flag engine)

---
*Phase: 30-composition-pipeline-branding*
*Completed: 2026-03-28*
