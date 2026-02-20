---
phase: 14-security-wiring
plan: 03
subsystem: security
tags: [ajv, validation, schema, config, command-tools, AskUserQuestion]

# Dependency graph
requires:
  - phase: 14-security-wiring-plan-01
    provides: "Result type validation API (validatePlanningConfig, all validators)"
  - phase: 10-claude-code-capabilities
    provides: "AskUserQuestion tool introduced, command file patterns established"
provides:
  - "AJV schema for .planning/config.json (src/config/schema.js) with memory, effort, teams sections"
  - "Standalone config validation script (bin/validate-configs.js) validating 5 project files"
  - "prepublishOnly gating: config validation runs before every publish"
  - "SKIP_CONFIG_VALIDATION=1 escape hatch for emergency publishes"
  - "AskUserQuestion declared in 16 command files (3 newly fixed)"
affects: [publishing-workflow, gsd-commands]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Validator registry pattern: array of {label, run} objects, each returning {ok, errors?}"
    - "Factory pattern for markdown section validators: validateMarkdownSections(name, sections) returns validator function"
    - "Escape hatch pattern: SKIP_CONFIG_VALIDATION=1 env var exits early with stderr warning"

key-files:
  created:
    - src/config/schema.js
    - bin/validate-configs.js
    - tests/validate-configs.test.js
  modified:
    - package.json
    - commands/gsd/plan-phase.md
    - commands/gsd/set-profile.md
    - commands/gsd/verify-work.md

key-decisions:
  - "Validator registry as array (not object): ordered execution, easy to extend with new validators"
  - "Markdown section validation uses regex per section (not line-by-line): correct for multi-line content"
  - "AskUserQuestion added to 3 files only: complete-milestone and remove-phase use inline prompts, not AskUserQuestion"

patterns-established:
  - "Config validation at publish time: catches corruption, conflict markers, missing sections before release"
  - "SKIP_CONFIG_VALIDATION=1 pattern: escape hatch for hotfix publishes when planning files are intentionally out of state"

# Metrics
duration: 7min
completed: 2026-02-20
---

# Phase 14 Plan 03: Config Validation Script and AskUserQuestion Audit Summary

**AJV config validation script gating publish (5 files: config.json, ROADMAP.md, STATE.md, PROJECT.md, package.json) plus AskUserQuestion declarations corrected in 16 of 28 command files**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-20T00:38:42Z
- **Completed:** 2026-02-20T00:45:47Z
- **Tasks:** 2
- **Files modified:** 7 (+ 3 created)

## Accomplishments

- Created src/config/schema.js: AJV schema for .planning/config.json with fully-specified memory (enabled/location/curation/staleness_check), effort (default/agents), and teams (enabled/experimental_flag/oversight/soft_cap) sections using additionalProperties: false at each level
- Created bin/validate-configs.js: validates .planning/config.json (schema), ROADMAP.md/STATE.md/PROJECT.md (required sections), and package.json (files array on disk); checks all for git conflict markers; supports --quiet and SKIP_CONFIG_VALIDATION=1
- Extended prepublishOnly to include node bin/validate-configs.js after build:hooks
- Fixed 3 command files missing AskUserQuestion: plan-phase.md, set-profile.md, verify-work.md; confirmed 13 existing declarations correct; confirmed 12 remaining files correctly omit it

## Task Commits

Each task was committed atomically:

1. **Task 1: Create config schema and validation script** - `20b1c01` (feat)
2. **Task 2: AskUserQuestion declaration audit and fix** - `136d89f` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified

- `src/config/schema.js` - AJV schema for .planning/config.json, exports planningConfigSchema and validatePlanningConfig
- `bin/validate-configs.js` - Standalone validation script covering 5 project config files
- `tests/validate-configs.test.js` - 23 tests for schema validation, script behavior, smoke test against real config
- `package.json` - prepublishOnly extended with validate-configs.js step
- `commands/gsd/plan-phase.md` - AskUserQuestion added to allowed-tools
- `commands/gsd/set-profile.md` - AskUserQuestion added to allowed-tools
- `commands/gsd/verify-work.md` - AskUserQuestion added to allowed-tools

## Decisions Made

- Validator registry as ordered array of {label, run} objects: deterministic execution order, easy extension
- Markdown section checks use per-section regex against full file content (not line-by-line scan): handles sections that might appear as part of longer headers
- complete-milestone.md and remove-phase.md: NOT updated with AskUserQuestion because their workflows use inline text confirmations, not the AskUserQuestion tool

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Committed incomplete Plan 14-02 work (ConfigLoader.js wiring left unstaged)**
- **Found during:** Task 1 (full test suite run)
- **Issue:** Full test suite showed 1 pre-existing failure: `ConfigLoader.js imports validateConfigPath from validation module`. Investigation revealed Plan 14-02 committed gsd-tools.js and tests/gsd-tools.test.js but left src/config/ConfigLoader.js and tests/config.test.js unstaged in the working tree. The test expected validateConfigPath wiring in ConfigLoader.js but the committed file lacked it.
- **Fix:** Committed the unstaged ConfigLoader.js (adds validateConfigPath import and GSD_CONFIG_PATH validation against homedir/tmpdir allowlist) and config.test.js (updates env var test, adds path traversal rejection test, adds tmpdir acceptance test)
- **Files modified:** src/config/ConfigLoader.js, tests/config.test.js
- **Verification:** Full test suite went from 438 pass/1 fail to 441 pass/0 fail
- **Committed in:** 55ac4d2 (fix(14-02): commit ConfigLoader.js validation wiring left out of prior commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - incomplete prior commit)
**Impact on plan:** The fix restored the test suite to green and completed work that was already designed and implemented but accidentally omitted from the Plan 14-02 commit. No scope creep.

## Issues Encountered

None beyond the deviation documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 14 complete: all 3 plans executed (validation Result type, gsd-tools wiring, config validation + AskUserQuestion audit)
- v0.2.0 milestone complete: 14/14 phases done
- Ready for release: prepublishOnly now gates on config validation; run `aidev release patch` or `minor` for next version

## Self-Check: PASSED

All created files exist on disk. All commits verified in git log.

---
*Phase: 14-security-wiring*
*Completed: 2026-02-20*
