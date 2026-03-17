# Phase 16: Platform Quality & Cleanup - Research

**Researched:** 2026-02-20
**Domain:** bun:test coverage mechanics, platform-conditional code testing, Node.js module caching
**Confidence:** HIGH

## Summary

Phase 16 addresses three gap-closure items (GAP-2, GAP-3, GAP-4) from the milestone audit. The platform module at `src/platform/` has two files below the 95% WoW line-coverage threshold: `detect.js` at 66.67% and `terminal.js` at 93.50%. Additionally, `src/platform/index.js` is dead code with zero production consumers.

The primary investigation revealed a **confirmed bun 1.3.5 V8 coverage tracking limitation**: bun only tracks line coverage from a module's FIRST load. The existing test strategy in `tests/platform.test.js` uses `delete require.cache[...] + re-require` to simulate different platforms, which executes the code correctly but does NOT generate coverage attribution for the re-loaded module. This explains why the coverage gaps persist despite extensive test coverage already written.

The correct fix requires restructuring `detect.js` to export its internal helper functions (`detectShell`, `detectEnvironment`, `detectNodeVersion`, `detectGit`) so tests can call them directly with mocked inputs, without re-requiring the module. For `terminal.js`, a similar export of `detectColorLevel`, `detectTerminalEmulator`, `detectUnicodeSupport` is needed. Once exported, tests can call these functions after mutating `process.platform` and `process.env`, and bun will correctly track the coverage within the single first-load context.

**Primary recommendation:** Export internal helper functions from detect.js and terminal.js, then rewrite the coverage-gap tests to call those helpers directly instead of using the cache-clear + re-require pattern.

## Standard Stack

### Core (already in place)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| bun:test | 1.3.5 | Test runner and coverage | Project-standard per package.json |
| helpers/mock-process.js | project | `mockEnv`, `mockPlatform` utilities | Established project pattern |

### No New Dependencies Required
All needed tools are already in the project. No new packages needed for Phase 16.

### How Coverage Works in bun 1.3.5
Coverage uses V8's block coverage. Key behavior:
- Coverage is tracked per-script (each module load = one script)
- The first `require('./module')` registers the script and tracks its execution
- `delete require.cache[path] + require(path)` creates a NEW script - coverage from that script is NOT merged back into the original source file's coverage
- Multiple `clearCache() + detectPlatform()` calls within the SAME test run DO accumulate coverage (same script)
- `process.platform` mutations take effect immediately for subsequent function calls within the same script context

## Architecture Patterns

### Recommended Project Structure (no change needed)
```
src/platform/
├── detect.js    # Export internal functions for testability
├── paths.js     # Already well-covered
├── terminal.js  # Export internal functions for testability
└── index.js     # DELETE (dead code)

tests/
└── platform.test.js  # Add direct tests for exported internals
```

### Pattern 1: Export Internals for Testability
**What:** Add internal helper functions to module.exports
**When to use:** When functions are currently private closures that need platform-conditional coverage
**Example:**
```javascript
// detect.js - add to module.exports
module.exports = {
  detectPlatform,
  clearCache,
  // Test-only exports (internal helpers)
  _detectShell,
  _detectEnvironment,
  _detectNodeVersion,
  _detectGit,
};
```

Tests then call `_detectShell()` directly with appropriate `process.platform` and `process.env` mutations, without any module cache manipulation.

### Pattern 2: Direct Function Testing (established by mockPlatform)
**What:** Mutate `process.platform` + `process.env`, then call the function directly
**When to use:** When testing platform-conditional code paths in the SAME module load
**Example:**
```javascript
// Source: tests/helpers/mock-process.js (mockPlatform function)
function mockPlatform(platform) {
  const original = process.platform;
  Object.defineProperty(process, 'platform', {
    value: platform,
    writable: true,
    configurable: true
  });
  return () => {
    Object.defineProperty(process, 'platform', {
      value: original,
      writable: true,
      configurable: true
    });
  };
}

// Usage in test (no re-require needed):
test('PowerShell detection on Windows', () => {
  const restore = mockPlatform('win32');
  const saved = {};
  ['MSYSTEM', 'PSModulePath'].forEach(v => { saved[v] = process.env[v]; delete process.env[v]; });
  process.env.PSModulePath = 'C:\\Program Files\\PowerShell';

  const result = _detectShell();  // Call exported internal
  expect(result.shell).toBe('pwsh');

  restore();
  Object.entries(saved).forEach(([k,v]) => v !== undefined ? process.env[k] = v : delete process.env[k]);
});
```

### Pattern 3: Removing Dead Code
**What:** Delete `src/platform/index.js` after verifying zero consumers
**When to use:** When a module has no production importers
**Verification performed:** grep for `require.*platform/index` and `require.*src/platform'` - only `index.js` itself references the `src/platform` path (in its JSDoc comment). No production code uses it.

### Anti-Patterns to Avoid
- **Cache-clear + re-require for coverage:** Does not work in bun 1.3.5. Executes correctly but coverage is not attributed back to original source.
- **Platform-guarded test skipping for coverage:** Tests like `if (process.platform !== 'win32') { return; }` are useful for integration tests but prevent coverage on non-matching platforms. For unit tests of internal functions, remove the guard and use `mockPlatform` instead.
- **Adding `src/platform/index.js` consumers to "fix" dead code:** The correct fix is deletion, not adding artificial consumers.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Platform mocking | Custom mock | `mockPlatform` from `tests/helpers/mock-process.js` | Already built, handles defineProperty correctly |
| Env mocking | Manual save/restore | `mockEnv` from `tests/helpers/mock-process.js` | Already built, handles missing keys correctly |
| Coverage thresholds | Custom script | `bunfig.toml` with `[test.coverage]` section | Native bun support |

**Key insight:** All mock infrastructure is already in `tests/helpers/`. The only missing piece is the export of internal functions from the source modules.

## Common Pitfalls

### Pitfall 1: Bun Coverage Doesn't Aggregate Re-Loaded Module Coverage
**What goes wrong:** Tests use `delete require.cache[path] + require(path)` after `mockPlatform`, execute the alternate-platform code, tests pass - but coverage for those lines remains 0%.
**Why it happens:** bun registers each module load as a separate V8 Script. Coverage from the second (re-loaded) script is not merged into the first script's source map coverage. bun 1.3.5 confirmed.
**How to avoid:** Export the internal functions being tested. Call them directly in the same module-load context. Coverage accumulates correctly across multiple calls to the same function.
**Warning signs:** Test passes but line remains uncovered in report. Coverage gap persists despite test existing.

### Pitfall 2: Platform Guards in Unit Tests Block Coverage
**What goes wrong:** Test has `if (process.platform !== 'win32') { return; }`. On non-win32 machines, the test body never runs. On win32, the guard return-line is uncovered. Either way, some lines are "not covered."
**Why it happens:** Platform guards were appropriate for integration tests but over-applied to unit tests of internal functions.
**How to avoid:** For unit tests of internal helpers, mock the platform with `mockPlatform()` instead of using OS guards. Only the integration tests (that run actual `execSync` commands like `which git`) need real OS guards.
**Warning signs:** Test file itself shows uncovered lines at the guard's return statement.

### Pitfall 3: MSYSTEM Environment Variable on Windows
**What goes wrong:** Tests running on Windows with MinGW/Git Bash (MSYSTEM=MINGW64) will have MSYSTEM set in process.env. Tests that need to test "plain Windows" behavior must explicitly delete MSYSTEM.
**Why it happens:** Developer environment runs in Git Bash which sets MSYSTEM=MINGW64 and WT_SESSION (Windows Terminal).
**How to avoid:** The existing `cleanTerminalEnv()` helper in platform.test.js already clears MSYSTEM. For new tests, use `mockEnv({ MSYSTEM: undefined })` or manually `delete process.env.MSYSTEM` and restore.
**Warning signs:** Terminal emulator detection returns 'unknown' instead of 'Windows Console Host' when testing Windows-specific behavior.

### Pitfall 4: src/platform/index.js Eager Singleton
**What goes wrong:** `index.js` calls `detectPlatform()` and `detectTerminal()` at module-load time (lines 34-35), creating singletons. If tests import from `index.js`, the platform is detected once and cached.
**Why it happens:** The file was designed for convenience, not testability.
**How to avoid:** Tests should import from `detect.js` and `terminal.js` directly (already the pattern in `tests/platform.test.js`). Deleting `index.js` removes this footgun.
**Warning signs:** Platform detection caching causes test interference across test cases.

### Pitfall 5: paths.js `relative()` Function Uncovered
**What goes wrong:** `paths.js` shows 85.71% functions - one function (`relative`) is untested.
**Why it happens:** No test calls `gsdPaths.relative(from, to)` even though it's exported.
**How to avoid:** Add one test: `expect(gsdPaths.relative('/a/b', '/a/b/c')).toBe('c')`.
**Warning signs:** Function count below threshold despite full line coverage.

## Code Examples

Verified patterns for the planner to reference:

### Export Internal Functions from detect.js
```javascript
// src/platform/detect.js - add to module.exports
module.exports = {
  detectPlatform,
  clearCache,
  // Internal exports for testing
  _detectShell,
  _detectEnvironment,
  _detectNodeVersion,
  _detectGit,
};
```

### Export Internal Functions from terminal.js
```javascript
// src/platform/terminal.js - add to module.exports
module.exports = {
  detectTerminal,
  clearCache,
  // Internal exports for testing
  _detectColorLevel,
  _detectTerminalEmulator,
  _detectUnicodeSupport,
  _getTerminalDimensions,
};
```

### Test Pattern for Internal Functions (no re-require needed)
```javascript
// tests/platform.test.js - direct internal function tests
const { _detectShell, _detectEnvironment } = require('../src/platform/detect');
const { mockPlatform, mockEnv } = require('./helpers');

test('detects PowerShell on Windows via PSModulePath', () => {
  const restorePlatform = mockPlatform('win32');
  const restoreEnv = mockEnv({ MSYSTEM: undefined, PSModulePath: 'C:\\Program Files\\PowerShell' });

  const result = _detectShell();

  restorePlatform();
  restoreEnv();

  expect(result.shell).toBe('pwsh');
  expect(result.isPowerShell).toBe(true);
});
```

### Rename Convention for Internal Exports
Use underscore prefix to signal test-only exports:
- `_detectShell` not `detectShell` (avoids collision with the implied public API)
- Or use a nested `_internals` object: `module.exports._internals = { detectShell, ... }`

### Add relative() Test
```javascript
// In gsdPaths describe block
test('relative() computes path between two directories', () => {
  const result = gsdPaths.relative('/home/user', '/home/user/projects');
  expect(result).toBe('projects');
});
```

### Delete index.js
```bash
# No migration needed - zero consumers
rm src/platform/index.js
```

### bunfig.toml Coverage Threshold (optional enforcement)
```toml
# bunfig.toml - add to project root if desired
[test]
coverage = true
coverageThreshold = 0.95
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Re-require module after mockPlatform | Export internals, call directly | Coverage actually works |
| Module-level platform guards in tests | mockPlatform() for unit tests | Tests run on all platforms |
| index.js as centralized API | Direct submodule imports | No dead code |

**Deprecated/outdated:**
- `delete require.cache + re-require`: Works for behavior testing, fails for coverage. Should be replaced with direct internal function testing.
- Platform-guarded tests for internal function coverage: Should only guard tests that invoke real OS commands (execSync).

## Open Questions

1. **GAP-2: Manual cross-platform testing documentation**
   - What we know: CI matrix covers mac/linux/windows. The gap is about manual installation, launcher, hooks, statusline rendering, and permission fallback testing.
   - What's unclear: Phase 16 description mentions "automated integration tests OR documented manual testing." The CI already covers functional correctness automatically. Is the gap about documenting WHAT to manually test, or about actually doing it?
   - Recommendation: Treat GAP-2 as documentation-only. Create a manual-testing checklist document. The CI matrix already covers automated verification. Actual manual testing would need to be performed by the user.

2. **Rename or not: internal exports**
   - What we know: Underscore prefix convention (`_detectShell`) is common but not enforced. An alternative is a nested `_internals` property.
   - What's unclear: Whether the planner prefers `module.exports._detectShell` (direct) or `module.exports._internals = { detectShell }` (namespaced).
   - Recommendation: Use underscore prefix directly on exports for simplicity. Fewer levels of nesting.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `src/platform/detect.js` (260 lines), `src/platform/terminal.js` (237 lines), `src/platform/index.js` (57 lines), `src/platform/paths.js` (108 lines)
- Direct codebase inspection: `tests/platform.test.js` (1392 lines), `tests/helpers/mock-process.js`, `tests/helpers/index.js`
- Live coverage measurement: `bun test --coverage` ran against project, results verified

### Secondary (HIGH confidence from empirical testing)
- bun 1.3.5 coverage behavior verified empirically: re-requiring a module after cache-clear does NOT accumulate coverage into the original source file's report. Confirmed via isolated test cases.
- `clearCache() + function call` (without re-require) DOES accumulate coverage. Confirmed.
- process.platform mutation via `Object.defineProperty` works in bun 1.3.5. Confirmed.

### Tertiary (MEDIUM confidence)
- [Bun Code Coverage Gap](https://www.charpeni.com/blog/bun-code-coverage-gap) - explains that bun only tracks coverage for files actually loaded. Consistent with observed behavior.
- [Bun test coverage docs](https://bun.com/docs/test/coverage) - confirms V8-based coverage, threshold configuration via bunfig.toml.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified by direct inspection, no new tools needed
- Architecture: HIGH - empirically verified which approaches do/don't produce coverage
- Pitfalls: HIGH - every pitfall was directly verified via test runs
- bun coverage behavior: HIGH - empirically confirmed across multiple test configurations

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (stable domain, 30-day window; if bun upgrades, re-verify coverage behavior)
