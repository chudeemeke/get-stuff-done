# Phase 37: Installer Safety - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify the installer's manifest-driven cleanup, v2 detection, and uninstall paths work correctly end-to-end. The implementation code already exists in `bin/install.js` (557 lines, rewritten 2026-04-01 after the wipe incident). This phase is primarily about writing comprehensive tests and verifying the fix, not implementing new code.

</domain>

<decisions>
## Implementation Decisions

### Test scenarios
- **D-01:** Test ALL install paths: fresh install, re-install over v3 (overlay), re-install over v2 (legacy), uninstall, and install with user content present
- **D-02:** User content preservation is the critical assertion -- every scenario must verify that non-GSD files (CLAUDE.md, rules/, projects/, settings.json, skills/) survive the operation unchanged

### Test isolation
- **D-03:** Each test creates a fresh temp directory, populates it with scenario-specific fixtures, runs the installer with `--config-dir`, and asserts. No repo pollution, full isolation.
- **D-04:** Use the existing `--config-dir` flag for target redirection. This was identified during v1.0.0 Phase 29 (Prototype Gate) as the correct approach for test isolation on Windows.

### Edge cases
- **D-05:** Test the current fallback behavior as-is. No manifest = remove known v2 directories only (`get-stuff-done/`, `get-shit-done/`). Corrupt manifest = treat as missing. No new fallback logic.
- **D-06:** The v2 fallback is a transitional bridge (v2 never wrote manifests). Tests should verify it never touches anything outside known v2 directories. This becomes dead code as users migrate to v3.
- **D-07:** Follow industry best practice: manifest is truth. Tests verify that when a manifest exists, exactly those files are removed and nothing else.

### Claude's Discretion
- Test file organization (extend existing `installer-v3.test.js` or new file)
- Specific temp directory creation pattern (os.tmpdir vs test-scoped)
- Whether to mock the upstream subprocess call or test against composed dist/

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Installer code
- `bin/install.js` -- The installer under test (557 lines). Key functions: `detectV2()` (line 249), `removeGsdFiles()` (line 161), `isSafeToClean()` (line 297), `readInstalledManifest()` (line 133)

### Existing tests
- `tests/installer-v3.test.js` -- Existing installer tests from v1.0.0 Phase 34
- `tests/prototype-installer.test.js` -- Prototype gate tests from v1.0.0 Phase 29

### Incident context
- Memory: `incident_installer_wipe_2026_03_31.md` -- Root cause analysis: `src/` false-positive signal, `fs.rmSync` on home directory. Details the manifest-driven fix.

### Design spec
- `docs/superpowers/specs/2026-03-28-overlay-architecture-design.md` -- Installer delegation architecture

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `detectV2()` (bin/install.js:249) -- Already fixed, excludes src/ as signal. Needs test coverage.
- `removeGsdFiles()` (bin/install.js:161) -- Manifest-driven removal with fallback. Needs test coverage.
- `isSafeToClean()` (bin/install.js:297) -- Guards against home dir, root, shallow paths. Needs test coverage.
- `readInstalledManifest()` (bin/install.js:133) -- Reads gsd-file-manifest.json. Handles missing/corrupt.

### Established Patterns
- Tests use `bun:test` with `describe`/`it` blocks
- Subprocess tests use `spawnSync` with `--config-dir` for isolation
- Temp directories cleaned up in `afterEach`
- 15000ms timeout for subprocess-heavy tests on Windows

### Integration Points
- Installer delegates to upstream's `dist/bin/install.js` via subprocess
- Overlay manifest at `dist/.overlay-manifest.json` lists fork-owned files
- Installed manifest `gsd-file-manifest.json` written by upstream into target dir

</code_context>

<specifics>
## Specific Ideas

- The wipe incident destroyed rules/, CLAUDE.md, settings.json, project memories, skills, scripts, custom commands -- tests should use a representative subset of these as "user content" fixtures
- Industry standard: manifest is truth, no manifest = no action (current code deviates with v2 fallback, which is acceptable as a migration bridge)

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 37-installer-safety*
*Context gathered: 2026-04-02*
