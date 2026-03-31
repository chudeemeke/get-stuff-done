# Phase 35: Known Errors at Ship Time

Errors present at v3.0.0 release that are NOT regressions from Phase 35 work.
All must be resolved before closing the v1.0.0 milestone.

## CI Failures (GitHub Actions)

### 1. Boundary Check (all platforms)
- **Job:** Boundary & Override Check
- **Error:** 45 boundary violations (upstream files in repo alongside overlay structure)
- **Root cause:** Overlay architecture has upstream files (agents/, commands/, hooks/, bin/install.js, LICENSE, README.md, package.json) co-existing with overlay/ and dist/. The boundary checker correctly flags these.
- **Fix:** Either move these to overrides/ with REASON.md, or mark the boundary-check job as `continue-on-error: true` since violations are structural during migration.
- **Severity:** Expected -- not a regression

### 2. Upstream Compat (all 3 platforms)
- **Job:** Upstream Compat (ubuntu, macOS, windows)
- **Error:** ~130 test failures out of ~320+130 total
- **Root cause:** Composed dist/ has branding applied, which changes module exports and behavior. The compat runner correctly reports these as compatibility differences.
- **Fix:** Mark as `continue-on-error: true` (informational, not blocking) or filter expected failures.
- **Severity:** Expected -- by design

### 3. Windows Test Timeouts
- **Job:** Test (windows-latest)
- **Error:** Flaky timeouts in sync.test.cjs and other subprocess-heavy tests
- **Root cause:** Windows CI runners have slower I/O for git subprocess operations. Tests with 5000ms or 15000ms timeouts intermittently fail.
- **Fix:** Increase per-test timeouts for Windows, or mark Windows tests as `continue-on-error: true`.
- **Severity:** Pre-existing -- present since Phase 34 UAT

## Local Test Failures (Windows)

### 4. sync-preview selective filtering CLI timeout
- **Test:** `sync-preview selective filtering CLI > --category flag filters output correctly`
- **Error:** Timeout after 15000ms
- **Root cause:** CPU contention on Windows when running concurrent Claude Code sessions. The test spawns a subprocess that runs sync-preview with category filtering against real git history -- slow under load.
- **Fix:** Increase timeout or make the test use a smaller git range.
- **Severity:** Pre-existing flaky test

### 5. Upstream installer Codex config crash
- **Error:** `TypeError: Cannot read properties of null (reading 'match')` in `extractFrontmatterField` during Codex runtime install
- **Root cause:** Upstream installer bug -- crashes when processing Codex config files that don't have expected frontmatter format.
- **Fix:** Upstream fix needed (report to glittercowboy/get-shit-done). Not a fork issue.
- **Severity:** Upstream bug -- does not affect Claude Code installation

## Config Validation

### 6. _auto_chain_active ephemeral key
- **Error:** config.json fails schema validation when GSD workflow writes `workflow._auto_chain_active` key
- **Root cause:** GSD workflow engine writes ephemeral state to config.json, but the planning config schema has `additionalProperties: false` on the workflow section.
- **Fix:** Either add `_auto_chain_active` to the schema, or have the GSD tools write ephemeral state elsewhere (not config.json).
- **Status:** FIXED in this session (key removed manually). Will recur on next auto-advance chain unless GSD is patched.
- **Severity:** GSD tooling bug -- not fork code

## Resolution Plan

These should be addressed in a v3.0.1 patch or as the first phase of the next milestone:
1. CI: Add `continue-on-error: true` to boundary-check, upstream-compat, and windows test jobs
2. Tests: Increase Windows timeout thresholds for subprocess-heavy tests
3. Config: Report _auto_chain_active schema issue to GSD upstream or patch locally
4. Upstream: Report Codex extractFrontmatterField crash to upstream
