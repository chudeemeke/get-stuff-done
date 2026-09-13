---
phase: 41-foundation-flip-gate-install-audit-surface-windows-slo
plan: 02
subsystem: security
tags: [audit-ci, suppressions, eslint-security, maintenance, triage]

requires:
  - phase: 41-01
    provides: Changelog self-test command for the bump runbook
provides:
  - Strict audit suppression schema with 60-day TTL enforcement
  - Local audit-ci wrapper and empty suppressions file
  - Security triage policy and Phase 41 maintenance sections
affects: [phase-41, security-audit, maintenance]

tech-stack:
  added: [audit-ci]
  patterns:
    - Validate rich suppressions before generating audit-ci allowlists
    - Keep Phase 41 maintenance sections scope-partial but quality-full

key-files:
  created:
    - config/suppressions.schema.json
    - scripts/audit-check.js
    - tests/audit-check.test.js
    - .planning/audits/suppressions.json
    - MAINTENANCE.md
  modified:
    - package.json
    - bun.lock
    - SECURITY.md
    - eslint.config.js

key-decisions:
  - "SECURITY-01 is advanced but remains pending until Plan 03 wires the CI audit job."
  - "UPGRADE-06 is complete after MAINTENANCE.md Bump Runbook references the changelog self-test."
  - "Test-only eslint security rule disables remain allowed only with an explicit rationale comment."

patterns-established:
  - "Suppression TTL validation runs before scanner allowlist generation."
  - "MAINTENANCE.md Phase 41 sections avoid Phase 44-only scope."

requirements-completed: [SECURITY-05, SECURITY-06, UPGRADE-06]
requirements-advanced: [SECURITY-01]

duration: 56 min
completed: 2026-06-23
---

# Phase 41 Plan 02: Audit Suppression and Security Policy Summary

**Structured audit suppressions with TTL validation, local audit-ci wrapper, and scoped Phase 41 maintenance policy**

## Performance

- **Duration:** 56 min
- **Started:** 2026-06-23T02:41:00+01:00
- **Completed:** 2026-06-23T03:37:00+01:00
- **Tasks:** 4
- **Files modified:** 9

## Accomplishments

- Added strict `.planning/audits/suppressions.json` schema with required `id`, `severity`, `reason`, `reviewer`, `reviewedDate`, and `reReviewDate`.
- Added `scripts/audit-check.js` with expiry validation, 60 calendar-day max TTL validation, `medium` to `moderate` normalization, and audit-ci config generation.
- Pinned `audit-ci@7.1.0`, added `bun run audit:ci`, and updated `bun.lock` with `bun install --ignore-scripts`.
- Added `SECURITY.md` triage policy covering critical, high, moderate, and low findings.
- Created `MAINTENANCE.md` with exactly the Phase 41 sections: `Bump Runbook`, `Security`, and `Escape-Hatch Decisions Log`.
- Added eslint config rationale for test-only security rule disables while keeping production security rules active.

## Task Commits

1. **Task 02-01: Create suppression schema and audit wrapper tests** - `78898b8` (feat)
2. **Task 02-02: Implement audit-ci wrapper and package script** - `f8059fc` (feat)
3. **Task 02-03: Document triage policy and audit eslint security config** - `883bafd` (docs)

## Files Created/Modified

- `config/suppressions.schema.json` - strict AJV schema for suppression entries.
- `tests/audit-check.test.js` - expiry, TTL, schema, and allowlist behavior tests.
- `scripts/audit-check.js` - validate-only mode, audit-ci config generation, and package-lock preflight.
- `.planning/audits/suppressions.json` - empty suppressions list.
- `package.json` - `audit-ci@7.1.0` and `audit:ci` script.
- `bun.lock` - lockfile update from `bun install --ignore-scripts`.
- `SECURITY.md` - committed triage policy and suppression requirements.
- `MAINTENANCE.md` - Phase 41 Bump Runbook, Security, and Escape-Hatch Decisions Log sections.
- `eslint.config.js` - documented test-only security rule exceptions.

## Verification

- `bun install --ignore-scripts` - passed; `audit-ci@7.1.0` installed and `bun.lock` updated.
- `node scripts/audit-check.js --validate-only` - passed; validated 0 audit suppressions.
- `bun test tests/audit-check.test.js` - passed, 6 tests.
- `bun run lint` - passed with 104 warnings and 0 errors.
- `node -e` content assertion for `SECURITY.md` and `MAINTENANCE.md` - passed.
- `package-lock.json` check - passed; no package-lock was created or committed.
- TTL spot check for `reviewedDate: 2026-06-01` and `reReviewDate: 2026-08-01` - failed validation as expected because it exceeds 60 calendar days.

## Decisions Made

- `SECURITY-01` remains pending until Plan 03 wires the CI job; this plan completed the local suppression and wrapper foundation.
- `UPGRADE-06` is now complete because the changelog conflict guard exists and the Bump Runbook names `bash .changelog-conflict-check.sh --self-test`.
- `MAINTENANCE.md` intentionally contains only the three Phase 41 sections. Phase 44 owns the remaining maintenance-document sections.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 02-01 tests required the audit-check module before Task 02-02**
- **Found during:** Task 02-01 (Create suppression schema and audit wrapper tests)
- **Issue:** The plan listed tests and schema for Task 02-01, but those tests necessarily import `scripts/audit-check.js`, which was listed under Task 02-02.
- **Fix:** Added the validation module during Task 02-01, then extended it with audit-ci execution behavior during Task 02-02.
- **Files modified:** `scripts/audit-check.js`
- **Verification:** `bun test tests/audit-check.test.js` exited 0.
- **Committed in:** `78898b8` and extended in `f8059fc`

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** The implementation stayed within Plan 02 scope and preserved the intended task boundary at the behavior level.

## Issues Encountered

- `bun run lint` reports 104 warnings from existing eslint-security warning rules, including new warnings in `scripts/audit-check.js`; lint exits 0 as required.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 03 can wire scanner CI jobs on top of `scripts/audit-check.js`, `.planning/audits/suppressions.json`, and the committed triage policy. `SECURITY-01` should remain pending until that CI wiring exists.

## Self-Check: PASSED

---
*Phase: 41-foundation-flip-gate-install-audit-surface-windows-slo*
*Completed: 2026-06-23*
