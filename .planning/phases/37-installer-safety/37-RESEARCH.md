# Phase 37: Installer Safety - Research

**Researched:** 2026-04-02
**Domain:** Node.js installer testing -- manifest-driven cleanup, v2 detection, file preservation
**Confidence:** HIGH

## Summary

Phase 37 is a testing phase for installer safety functions that already exist in `bin/install.js` (rewritten 2026-04-01 after the wipe incident). The implementation code is complete -- this phase writes comprehensive tests proving the safety invariants hold.

The critical architectural finding is that **all 14 subprocess-dependent tests in the existing `installer-v3.test.js` currently fail** because the upstream installer subprocess exits code 1 (agents directory verification failure). This is an upstream environmental issue unrelated to Phase 37's scope. The 5 passing tests are static analysis checks that do not invoke the installer.

**Primary recommendation:** Phase 37 tests MUST unit-test the safety functions (`detectV2()`, `removeGsdFiles()`, `isSafeToClean()`, `readInstalledManifest()`) in isolation by extracting them or requiring the file directly, rather than testing exclusively through subprocess delegation. Subprocess tests are fragile (14/19 currently broken) and conflate upstream installer health with safety function correctness. Unit tests for the safety functions are the correct level of abstraction for INST-01/02/03.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Test ALL install paths: fresh install, re-install over v3 (overlay), re-install over v2 (legacy), uninstall, and install with user content present
- **D-02:** User content preservation is the critical assertion -- every scenario must verify that non-GSD files (CLAUDE.md, rules/, projects/, settings.json, skills/) survive the operation unchanged
- **D-03:** Each test creates a fresh temp directory, populates it with scenario-specific fixtures, runs the installer with `--config-dir`, and asserts. No repo pollution, full isolation.
- **D-04:** Use the existing `--config-dir` flag for target redirection. This was identified during v1.0.0 Phase 29 (Prototype Gate) as the correct approach for test isolation on Windows.
- **D-05:** Test the current fallback behavior as-is. No manifest = remove known v2 directories only (`get-stuff-done/`, `get-shit-done/`). Corrupt manifest = treat as missing. No new fallback logic.
- **D-06:** The v2 fallback is a transitional bridge (v2 never wrote manifests). Tests should verify it never touches anything outside known v2 directories. This becomes dead code as users migrate to v3.
- **D-07:** Follow industry best practice: manifest is truth. Tests verify that when a manifest exists, exactly those files are removed and nothing else.

### Claude's Discretion
- Test file organization (extend existing `installer-v3.test.js` or new file)
- Specific temp directory creation pattern (os.tmpdir vs test-scoped)
- Whether to mock the upstream subprocess call or test against composed dist/

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INST-01 | Installer manifest-driven cleanup passes end-to-end test (install with user content present, verify nothing deleted) | Unit test `removeGsdFiles()` with manifest + user content fixtures; verify manifest files removed, user files intact |
| INST-02 | `detectV2()` does not false-positive on overlay-installed `src/` directories | Unit test `detectV2()` with overlay-installed directory layout (has `src/`, has `.install-meta.json` with `overlay_version`); verify returns `{ isV2: false }` |
| INST-03 | `uninstall()` uses manifest-driven `removeGsdFiles()` and removes only GSD-owned files | Unit test `removeGsdFiles()` + verify uninstall subprocess path removes only manifest-listed files, user content survives |
</phase_requirements>

## Architecture Patterns

### Current Test Architecture Problem

The existing `installer-v3.test.js` uses a subprocess integration test pattern exclusively:

```
Test -> execSync("node bin/install.js --config-dir $tmp") -> subprocess delegates to upstream -> upstream installs -> verify
```

This has a fatal dependency chain: if the upstream subprocess fails (currently broken -- agents dir verification), ALL safety tests fail regardless of whether the safety functions themselves work correctly.

### Recommended Test Architecture

Two-layer approach:

**Layer 1: Unit tests for safety functions (PRIMARY -- covers INST-01, INST-02, INST-03)**
```
Test -> require('bin/install.js') or extract functions -> call directly with temp dir fixtures -> assert
```

**Layer 2: Subprocess integration tests (SECONDARY -- validates full flow when upstream works)**
```
Test -> execSync("node bin/install.js --config-dir $tmp") -> verify end-to-end
```

The unit tests are the authoritative proof that safety invariants hold. The integration tests are supplementary validation of the full flow.

### Function Extraction Strategy

`bin/install.js` currently exports nothing (`module.exports` is absent). The four safety functions need to be testable:

| Function | Line | Purpose | Test Priority |
|----------|------|---------|---------------|
| `readInstalledManifest(targetDir)` | 132 | Read manifest, return file list or empty array | HIGH |
| `removeGsdFiles(targetDir, quiet)` | 161 | Manifest-driven removal with legacy fallback | HIGH |
| `detectV2(targetDir)` | 249 | Detect v2 installation, avoid false positives | HIGH |
| `isSafeToClean(targetDir)` | 297 | Guard against dangerous target paths | HIGH |

**Extraction approach:** Add a conditional export block at the bottom of `install.js`:

```javascript
// Test exports -- only available when required as a module, not when run as CLI
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    readInstalledManifest,
    removeGsdFiles,
    detectV2,
    isSafeToClean,
    parseConfigDir,
    resolveTargetDir,
  };
}
```

Since the file uses `require.main === module` (implicitly, via the `main()` call at the bottom), the export block will be available when the file is `require()`'d by tests but will not interfere with CLI execution. The `main()` function runs unconditionally -- the extraction must also add a guard:

```javascript
if (require.main === module) {
  main().catch(/* ... */);
}
```

### Recommended Project Structure for Tests

```
tests/
  installer-safety.test.js      # NEW: Phase 37 unit tests for safety functions
  installer-v3.test.js           # EXISTING: subprocess integration tests (fix separately)
  prototype-installer.test.js    # EXISTING: Phase 29 prototype gate tests
  helpers/
    mock-fs.js                   # EXISTING: createTempDir, createTempFile
    mock-process.js              # EXISTING
    mock-child-process.js        # EXISTING
```

### User Content Fixture Pattern

Per D-02, user content fixtures should represent what the wipe incident destroyed:

```javascript
const USER_CONTENT = {
  'CLAUDE.md': '# User CLAUDE.md\nCustom instructions',
  'rules/my-rule.md': '# Custom rule\nUser-defined rule content',
  'rules/another-rule.md': '# Another rule',
  'projects/myproject/memory/MEMORY.md': '# Project memory',
  'settings.json': JSON.stringify({ theme: 'dark' }),
  'skills/my-skill/SKILL.md': '# Custom skill',
  'scripts/my-script.sh': '#!/bin/bash\necho "user script"',
  'commands/my-cmd.md': '# Custom command',
};
```

Each test creates these in the temp directory, runs the operation, then asserts ALL of them still exist with identical content.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Temp directory management | Custom temp dir logic | `createTempDir()` from `tests/helpers/mock-fs.js` | Already tested, handles cleanup in afterEach |
| Content hashing for preservation checks | SHA256 comparison | `fs.readFileSync()` + string equality | Content is small text fixtures, direct comparison is simpler and more debuggable |
| Manifest simulation | Generate real manifests | Write fixture JSON matching `gsd-file-manifest.json` format | Format is `{ version, timestamp, files: { "path": "hash" } }` |

## Common Pitfalls

### Pitfall 1: Testing Through Subprocess Only

**What goes wrong:** All tests fail when an unrelated upstream change breaks the subprocess (exactly the current state -- 14/19 fail).
**Why it happens:** Tests conflate "upstream installer works" with "safety functions work."
**How to avoid:** Unit test the safety functions directly. Use subprocess tests only for supplementary end-to-end validation.
**Warning signs:** Every test calls `runV3Installer()` and asserts `result.success === true` before reaching the actual safety assertion.

### Pitfall 2: Path Separator Issues on Windows

**What goes wrong:** Manifest files use forward slashes (`get-shit-done/bin/gsd-tools.cjs`) but `path.join()` on Windows produces backslashes.
**Why it happens:** The manifest is written by upstream which uses forward slashes. Tests on Windows must handle both.
**How to avoid:** In `removeGsdFiles()`, the manifest paths are joined with `path.join(targetDir, relPath)` which normalizes. Tests should create fixture manifests with forward slashes (matching real behavior) and verify `path.join()` handles the normalization.
**Warning signs:** Test passes on CI (Linux) but fails locally (Windows).

### Pitfall 3: src/ False Positive -- Stale Test

**What goes wrong:** The existing test `detects v2.x via src/ directory fingerprint` (line 293) asserts that `src/` triggers v2 detection. This is the OPPOSITE of the fix (INST-02 requires `src/` to NOT trigger detection).
**Why it happens:** Test was written before the wipe incident fix. `detectV2()` was subsequently rewritten to exclude `src/` as a signal.
**How to avoid:** This test must be updated or deleted. The new test should assert that `src/` alone does NOT trigger v2 detection. The existing test is actively wrong -- it asserts the bug behavior.
**Warning signs:** Test named "detects v2.x via src/ directory fingerprint" -- this is the exact false positive that caused the wipe.

### Pitfall 4: Empty Directory Pruning Edge Cases

**What goes wrong:** `removeGsdFiles()` prunes empty directories after file removal. If a user file happens to be in a directory that GSD created, the directory must NOT be pruned.
**Why it happens:** The prune logic only checks `entries.length === 0`, which is correct. But test fixtures must include this scenario.
**How to avoid:** Test: create a GSD-installed file AND a user file in the same directory. Remove via manifest. Assert the directory still exists (because the user file is still there).
**Warning signs:** Tests only use separate directory trees for GSD and user files, never co-located.

### Pitfall 5: Windows Timeouts on Subprocess Tests

**What goes wrong:** `execSync` calls timeout on Windows when the subprocess spawns child processes.
**Why it happens:** Windows process creation overhead (500ms+ per `execSync` call in tests).
**How to avoid:** Unit tests avoid subprocess overhead entirely. For any remaining subprocess tests, use 15000ms+ timeout per D-04/established patterns.
**Warning signs:** Tests pass locally but intermittently fail in CI.

## Code Examples

### Manifest Fixture Format

Based on the real `gsd-file-manifest.json` at `.claude/gsd-file-manifest.json`:

```javascript
// Source: actual gsd-file-manifest.json from installed directory
const MOCK_MANIFEST = {
  version: '1.30.0',
  timestamp: '2026-03-29T21:05:13.431Z',
  files: {
    'get-shit-done/bin/gsd-tools.cjs': 'sha256hash1',
    'get-shit-done/bin/lib/commands.cjs': 'sha256hash2',
    'get-shit-done/templates/config.json': 'sha256hash3',
    'commands/gsd/workstreams.md': 'sha256hash4',
    'agents/gsd-executor.md': 'sha256hash5',
    'hooks/gsd-statusline.js': 'sha256hash6',
  },
};
```

### Unit Test Pattern for detectV2()

```javascript
// Source: bin/install.js detectV2() behavior (lines 249-285)
describe('detectV2()', () => {
  it('returns false for overlay-installed directory with src/', () => {
    // Setup: directory with src/ AND .install-meta.json with overlay_version
    fs.mkdirSync(path.join(tmpDir, 'src', 'config'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.install-meta.json'),
      JSON.stringify({ overlay_version: '3.0.0' }));

    const result = detectV2(tmpDir);
    expect(result.isV2).toBe(false);  // INST-02: no false positive
  });

  it('returns true for v2.x meta without overlay_version', () => {
    fs.mkdirSync(path.join(tmpDir, 'get-stuff-done'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'get-stuff-done', '.install-meta.json'),
      JSON.stringify({ version: '2.4.0', installType: 'link' }));

    const result = detectV2(tmpDir);
    expect(result.isV2).toBe(true);
    expect(result.signal).toBe('meta');
  });
});
```

### Unit Test Pattern for removeGsdFiles() with User Content Preservation

```javascript
// Source: bin/install.js removeGsdFiles() behavior (lines 161-230)
describe('removeGsdFiles() - manifest strategy', () => {
  it('removes only manifest-listed files, preserves user content', () => {
    // Setup: create manifest-listed files
    const manifestFiles = ['get-shit-done/bin/gsd-tools.cjs', 'hooks/gsd-statusline.js'];
    for (const f of manifestFiles) {
      fs.mkdirSync(path.dirname(path.join(tmpDir, f)), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, f), 'gsd content');
    }

    // Setup: create user content that must survive
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'user rules');
    fs.mkdirSync(path.join(tmpDir, 'rules'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'rules', 'my-rule.md'), 'custom rule');

    // Setup: write manifest
    fs.writeFileSync(path.join(tmpDir, 'gsd-file-manifest.json'),
      JSON.stringify({ files: Object.fromEntries(manifestFiles.map(f => [f, 'hash'])) }));

    // Act
    const result = removeGsdFiles(tmpDir, true);

    // Assert: manifest files removed
    expect(result.strategy).toBe('manifest');
    for (const f of manifestFiles) {
      expect(fs.existsSync(path.join(tmpDir, f))).toBe(false);
    }

    // Assert: user content preserved (INST-01 critical assertion)
    expect(fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8')).toBe('user rules');
    expect(fs.readFileSync(path.join(tmpDir, 'rules', 'my-rule.md'), 'utf-8')).toBe('custom rule');
  });
});
```

### isSafeToClean() Unit Tests

```javascript
// Source: bin/install.js isSafeToClean() behavior (lines 297-316)
describe('isSafeToClean()', () => {
  it('refuses home directory', () => {
    const result = isSafeToClean(os.homedir());
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('home directory');
  });

  it('refuses filesystem root', () => {
    const result = isSafeToClean(path.parse(os.homedir()).root);
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('filesystem root');
  });

  it('refuses shallow paths', () => {
    // On Windows: C:\Users is only 1 segment below root
    const result = isSafeToClean(path.join(path.parse(os.homedir()).root, 'single'));
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('too shallow');
  });

  it('accepts valid deep path', () => {
    const result = isSafeToClean(path.join(os.tmpdir(), 'gsd-test-abc123'));
    expect(result.safe).toBe(true);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `fs.rmSync(targetDir, { recursive: true })` | Manifest-driven removal of individual files | 2026-04-01 (post-wipe) | Structurally prevents home directory destruction |
| `src/` as v2 detection signal | `src/` excluded from v2 signals | 2026-04-01 (post-wipe) | Eliminates false positive that caused the wipe incident |
| Inline functions, no exports | Functions need extraction for unit testing | Phase 37 (pending) | Enables direct testing of safety invariants |

## Open Questions

1. **Upstream subprocess failure**
   - What we know: The upstream installer exits 1 with "Failed to install agents: directory is empty" even though `dist/agents/` has 23 files. All 14 subprocess-dependent tests currently fail.
   - What's unclear: Root cause of the agents verification failure. May be a path resolution issue in the upstream installer's `__dirname` when run from the fork's `dist/bin/install.js`.
   - Recommendation: This is out of scope for Phase 37 (D-05: test current behavior as-is). Unit tests bypass this entirely. The subprocess failure should be tracked as a separate issue (likely TEST-04 scope in Phase 40).

2. **Function extraction approach**
   - What we know: `bin/install.js` has no `module.exports` and calls `main()` unconditionally at the bottom (line 554).
   - What's unclear: Whether adding `if (require.main === module)` guard + exports constitutes "new code" vs "test infrastructure."
   - Recommendation: This is minimal, non-behavioral refactoring (adding exports and a guard). It enables testing without changing any logic. The alternative (eval/regex extraction) is fragile and not worth the complexity.

3. **Stale test: "detects v2.x via src/ directory fingerprint"**
   - What we know: Test at line 293 asserts `src/` triggers v2 detection. This contradicts the post-wipe fix and INST-02 requirement.
   - What's unclear: Whether to update in-place or delete and replace.
   - Recommendation: Delete the test. Write a replacement that asserts the opposite: `src/` alone does NOT trigger v2 detection.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | bun:test v1.3.5 |
| Config file | bunfig.toml (implicit) |
| Quick run command | `bun test tests/installer-safety.test.js` |
| Full suite command | `bun test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INST-01 | Manifest-driven cleanup preserves user content | unit | `bun test tests/installer-safety.test.js` | No -- Wave 0 |
| INST-02 | detectV2() no false positive on overlay src/ | unit | `bun test tests/installer-safety.test.js` | No -- Wave 0 |
| INST-03 | uninstall removes only manifest-listed files | unit | `bun test tests/installer-safety.test.js` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `bun test tests/installer-safety.test.js`
- **Per wave merge:** `bun test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/installer-safety.test.js` -- covers INST-01, INST-02, INST-03
- [ ] `bin/install.js` extraction -- add `require.main === module` guard + `module.exports` for safety functions
- [ ] Stale test `installer-v3.test.js` line 293 ("src/ fingerprint") -- update to match post-wipe behavior

## Project Constraints (from CLAUDE.md)

No project-level CLAUDE.md exists. Global CLAUDE.md directives apply:

| Directive | Impact on Phase 37 |
|-----------|-------------------|
| TDD (RED-GREEN-REFACTOR) | Tests first, then any needed extraction refactoring |
| 95%+ coverage at each metric | Coverage applies to modified code in `bin/install.js` |
| bun over npm | Use `bun test` for test execution |
| No AI attribution | No co-authored-by lines in commits |
| Hexagonal architecture | Not directly applicable (installer is infrastructure) |
| Commit after every completed feature | Atomic commits per test group |

## Sources

### Primary (HIGH confidence)
- `bin/install.js` -- Direct source code analysis (557 lines, all 4 safety functions inspected)
- `tests/installer-v3.test.js` -- Existing test patterns and current pass/fail state (5 pass, 14 fail)
- `tests/prototype-installer.test.js` -- Phase 29 subprocess test patterns
- `tests/helpers/mock-fs.js` -- `createTempDir()` and `createTempFile()` utilities
- `.claude/gsd-file-manifest.json` -- Real manifest format reference
- `37-CONTEXT.md` -- Locked decisions D-01 through D-07

### Secondary (MEDIUM confidence)
- Manual installer execution -- Confirmed upstream exits code 1 with "agents: directory is empty"
- `dist/bin/install.js` -- Upstream installer source (verified agents verification logic at line 3847)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- bun:test, Node.js fs, path, os are all established in this project
- Architecture: HIGH -- Function extraction pattern is straightforward CommonJS
- Pitfalls: HIGH -- Based on direct observation of current test failures and the wipe incident root cause

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (30 days -- stable domain, no external dependency changes expected)
