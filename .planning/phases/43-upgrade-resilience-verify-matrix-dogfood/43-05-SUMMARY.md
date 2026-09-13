---
phase: 43-upgrade-resilience-verify-matrix-dogfood
plan: 05
subsystem: override-staleness
tags: [semantic-js, override-staleness, acorn, byte-hash-fallback]
requires:
  - phase: 43-upgrade-resilience-verify-matrix-dogfood
    provides: compatibility matrix evidence and CI
provides:
  - JavaScript semantic override hash helper
  - Semantic SHA-256 support in override staleness gate
  - JS override REASON semantic hash evidence
affects: [phase-43, override-gate, ci, upstream-bump]
tech-stack:
  added:
    - acorn@8.17.0
  patterns:
    - Pure semantic helper isolated from reporting facade
    - JS-only semantic pass with byte-hash fallback
    - Parse-failure fail-closed behavior
key-files:
  created:
    - scripts/lib/semantic-js.js
  modified:
    - package.json
    - bun.lock
    - scripts/check-overrides.js
    - tests/check-overrides.test.js
    - tests/check-overrides-integration.test.js
    - overrides/bin/install.js.REASON.md
    - overrides/hooks/gsd-check-update.js.REASON.md
    - overrides/hooks/gsd-statusline.js.REASON.md
key-decisions:
  - "Semantic freshness applies only to parsed .js overrides with a recorded Semantic SHA-256."
  - "Missing semantic hashes, parse failures, and non-JS overrides preserve byte-hash blocking behavior."
  - "Markdown semantic staleness remains deferred to v1.3.0."
requirements-completed: ["UPGRADE-08"]
decisions-completed: ["D-09", "D-10", "D-11"]
duration: 20 min
completed: 2026-07-03
---

# Phase 43 Plan 05: JavaScript Semantic Override Staleness Summary

**Comment-only and whitespace-only `.js` upstream drift no longer creates false-positive stale override failures.**

## Performance

- **Duration:** 20 min
- **Completed:** 2026-07-03T22:58:40+01:00
- **Tasks:** 4
- **Files modified:** 10

## Accomplishments

- Added `acorn@8.17.0` as a dev dependency.
- Added `scripts/lib/semantic-js.js` with:
  - `parseJavaScriptForSemanticHash`
  - `normalizeJavaScriptAst`
  - `semanticHashJavaScript`
- Updated `scripts/check-overrides.js` to read `Semantic SHA-256` from REASON files.
- Added status `fresh-semantic` and report output `OK (semantic)`.
- Preserved byte-hash behavior for:
  - non-JS overrides,
  - `.js` overrides missing `Semantic SHA-256`,
  - Acorn parse failure.
- Added semantic hash evidence to current `.js` override REASON files:
  - `overrides/bin/install.js.REASON.md`
  - `overrides/hooks/gsd-check-update.js.REASON.md`
  - `overrides/hooks/gsd-statusline.js.REASON.md`
- Marked UPGRADE-08 complete.

## Task Commits

1. **Task 05-01: Semantic override tests first** - `7c6c6c2` (test)
2. **Tasks 05-02 / 05-03: Acorn helper and override gate integration** - `117e8b4` (feat)
3. **Task 05-03: Current JS override semantic evidence** - `3797c33` (docs)
4. **Task 05-04: Record summary/state** - pending metadata commit

## Guardrails

- Semantic comparison is `.js` only.
- The gate does not use semantic comparison unless `Semantic SHA-256` exists.
- Parse failure returns `stale` when the byte hash differs.
- `.md` and other non-JS semantic diff remains deferred to v1.3.0 per D-11.

## Deviations from Plan

None blocking.

## Verification

- RED: `bun test tests/check-overrides.test.js tests/check-overrides-integration.test.js` failed before implementation because `scripts/lib/semantic-js.js` did not exist and `fresh-semantic` was unsupported.
- `bun add -d acorn@8.17.0 --ignore-scripts` - passed and updated `package.json` / `bun.lock`.
- `bun install --frozen-lockfile --ignore-scripts` - passed.
- `node scripts/check-overrides.js` - passed.
- `bun test tests/check-overrides.test.js tests/check-overrides-integration.test.js` - passed.
- `bunx eslint scripts/lib/semantic-js.js scripts/check-overrides.js tests/check-overrides.test.js tests/check-overrides-integration.test.js` - passed with 0 errors and existing warning class only.
- `rg -n "fresh-semantic|OK \\(semantic\\)|Semantic SHA-256|semanticHashJavaScript" scripts/check-overrides.js tests/check-overrides.test.js overrides -g "*.md"` - passed.
- Non-JS REASON scan found no `Semantic SHA-256` entries.

## User Setup Required

None.

## Next Phase Readiness

Ready for Plan 43-06. The staleness gate can now distinguish false-positive `.js` comment/whitespace drift from real semantic upstream changes before hook override reconciliation.

---
*Phase: 43-upgrade-resilience-verify-matrix-dogfood*
