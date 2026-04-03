# Phase 39: Test Health & CI - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix pre-existing test failures across 3 test files, add throttled upstream version check to the session hook, and fix or evaluate sync-preview timeout. This phase targets zero test failures as a precondition for Phase 40's milestone exit gate.

</domain>

<decisions>
## Implementation Decisions

### Schema update strategy
- **D-01:** Update `config/gsd-config.schema.json` to match the actual config structure exactly. Define every key that gsd-tools writes: model_profile, skip_research, skip_plan_check, skip_verification, commit_docs, branch_per_phase, memory, effort, teams, gsd, and any others found in `.planning/config.json`.
- **D-02:** Strict validation (no `additionalProperties: true`). Schema drift should be caught early. If gsd-tools adds a new key, the schema must be updated too.

### Test timeout fixes
- **D-03:** Increase per-test timeout to 15000ms for all subprocess-heavy tests in `sync.test.cjs` and `hooks.test.js` that currently use the 5000ms default. This is the established project convention from Phase 37.
- **D-04:** Include sync-preview timeout in this phase. Evaluate whether the flaky test is a Windows-specific issue or a general timeout issue. Fix by increasing timeout or adding retry logic.

### CI upstream version check
- **D-05:** Extend `overlay/hooks/gsd-check-update.js` with a 7-day throttled cache pattern. Check npm registry only if `>7 days` since last successful check. Use the existing cache file's `checked` timestamp field.
- **D-06:** Pattern follows brew/npm/pip convention: client-side polling with time-based throttle. No GitHub Actions dependency. Runs in SessionStart hook.
- **D-07:** If upstream has a newer version, show notification in statusline (existing pattern). If check fails (network error), silently skip and retry next session.

### Claude's Discretion
- Whether to fix specific sync.test.cjs flaky tests via timeout increase alone or also add cleanup retry for EBUSY errors
- Exact schema structure for new config keys (types, defaults)
- Whether sync-preview timeout needs retry logic or just a longer timeout

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Test files to fix
- `tests/validate-configs.test.js` -- 2 failing tests against real `.planning/config.json`
- `tests/sync.test.cjs` -- 2 flaky timeout tests (subprocess timeouts on Windows)
- `tests/hooks.test.js` -- 2 maintainer path tests failing on git config in test env
- `config/gsd-config.schema.json` -- Schema to update (currently stale)

### Config files
- `.planning/config.json` -- Actual config structure (source of truth for schema update)

### Hook to extend
- `overlay/hooks/gsd-check-update.js` -- Add 7-day throttled upstream check (line ~95 area)

### Prior diagnosis
- `.continue-here.md` -- Root cause analysis for test failures (schema drift, subprocess timeouts)
- `whats-next.md` -- Additional context on test failure root causes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `gsd-check-update.js` already has `checked` timestamp in cache and npm version comparison logic. The 7-day throttle is an extension, not a rewrite.
- `tests/helpers.cjs` has `runGsdToolsDirect()` for subprocess testing without shell expansion.

### Established Patterns
- 15000ms timeout for subprocess-heavy tests (Phase 37 convention)
- AJV schema validation in `bin/validate-configs.js`
- Cache file at `~/.claude/gsd-update-cache.json` with JSON structure

### Integration Points
- Schema changes affect `bin/validate-configs.js` and its test file
- Hook changes need `bun run build` to rebundle for deployment
- Throttle cache is the existing `~/.claude/gsd-update-cache.json`

</code_context>

<specifics>
## Specific Ideas

- The validate-configs failures are purely schema drift -- the code works correctly, the schema just doesn't know about new keys. This is a 10-minute fix once you read the actual config.json.
- The sync/hooks timeouts are Windows-specific subprocess performance issues. The same tests pass on macOS/Linux within 5s.
- The upstream version check already exists in consumer mode. The addition is the 7-day throttle to avoid checking every session.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 39-test-health-ci*
*Context gathered: 2026-04-03*
