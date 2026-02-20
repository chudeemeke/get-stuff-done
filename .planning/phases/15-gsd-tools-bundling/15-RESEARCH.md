# Phase 15: gsd-tools.js Bundling - Research

**Researched:** 2026-02-20
**Domain:** Node.js module bundling, esbuild, installer path resolution
**Confidence:** HIGH

## Summary

The bug is confirmed and fully understood: `get-stuff-done/bin/gsd-tools.js` line 37 does `require('../../src/validation')`. At source, this resolves to `<project-root>/src/validation/` — correct. Post copy-mode install, the file lands at `~/.claude/get-stuff-done/bin/gsd-tools.js`, where `../../src/validation` resolves to `~/.claude/src/validation/` — which does not exist. Every GSD workflow command that exercises validation (verify-summary hash checking, commit path validation, branch name validation) fails with MODULE_NOT_FOUND.

The fix is identical to Phase 13: use esbuild to bundle gsd-tools.js from `get-stuff-done/bin/` into a self-contained `get-stuff-done/bin/dist/gsd-tools.js` (or alternatively bundle in-place, overwriting the source). The installer must then copy the bundled output, not the source. esbuild is already a devDependency (v0.24.0), the programmatic API is proven from Phase 13, and the `src/validation/index.js` module is pure Node.js (no external npm dependencies) so the bundle output will be small.

Dev-mode (`--link`) is unaffected: symlinks point back to the project source tree where `../../src/validation` resolves correctly — exactly as today. Only copy-mode install is broken and needs the bundled output.

**Primary recommendation:** Bundle gsd-tools.js via esbuild (following the Phase 13 hook-bundling pattern exactly). Create `scripts/build-tools.js`, produce `get-stuff-done/bin/dist/gsd-tools.js`, update `bin/install.js` to copy from `bin/dist/gsd-tools.js`. Update `prepublishOnly` to run the new build step.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| esbuild | ^0.24.0 | Bundle gsd-tools.js with inlined src/validation | Already devDependency, proven from Phase 13, zero-config for Node.js CJS, handles pure-CJS entry points in under 1 second |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none beyond esbuild) | — | src/validation is pure Node.js with only `path` built-in | No npm packages to inline; bundle will be small |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| esbuild bundle (Option A) | Copy src/ alongside get-stuff-done/ in installer (Option B) | Option B doubles install footprint, still fragile if src/ gains npm deps later, more installer code |
| esbuild bundle (Option A) | Inline validators directly into gsd-tools.js (Option C) | Option C creates divergence with src/validation as canonical source; maintenance burden; validation logic duplicated |
| bundle into dist/ subdir | Bundle in-place (overwrite gsd-tools.js) | In-place overwrite makes dev workflow impossible without rebuilding; dist/ separation follows Phase 13 precedent and allows source to remain readable |

**Installation:** No new dependencies. esbuild already in devDependencies.

```bash
# Nothing new to install
bun install  # already satisfied
```

## Architecture Patterns

### Recommended Project Structure
```
scripts/
├── build-hooks.js      # Phase 13: bundles hooks/ -> hooks/dist/
└── build-tools.js      # Phase 15: bundles get-stuff-done/bin/ -> get-stuff-done/bin/dist/

get-stuff-done/
└── bin/
    ├── gsd-tools.js         # Source (unchanged, stays readable)
    └── dist/
        └── gsd-tools.js     # Bundled output (self-contained, gitignored)
```

### Pattern 1: esbuild Programmatic API for gsd-tools.js
**What:** Call `esbuild.buildSync` with `bundle: true, platform: 'node', target: 'node20'` pointing at `get-stuff-done/bin/gsd-tools.js`. No `external` option -- all deps (src/validation) must be inlined.
**When to use:** Always for the build step; run before publish via `prepublishOnly`.
**Example:**
```javascript
// scripts/build-tools.js
// Source: follows esbuild pattern from scripts/build-hooks.js (Phase 13)
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const BIN_DIR = path.join(__dirname, '..', 'get-stuff-done', 'bin');
const DIST_DIR = path.join(BIN_DIR, 'dist');

function build() {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  process.stdout.write('Bundling gsd-tools.js... ');
  esbuild.buildSync({
    entryPoints: [path.join(BIN_DIR, 'gsd-tools.js')],
    bundle: true,          // Inline all require()d modules (src/validation)
    platform: 'node',      // Target Node.js (CJS output, correct path resolution)
    target: 'node20',      // Match engines.node in package.json
    outfile: path.join(DIST_DIR, 'gsd-tools.js'),
    // NO 'external' -- src/validation must be inlined for copy-mode install
    // NO 'format: esm' -- platform:'node' defaults to CJS which is correct
    // NO 'minify' -- keep readable for debugging installed gsd-tools
    // esbuild auto-preserves #!/usr/bin/env node shebang
  });

  const size = fs.statSync(path.join(DIST_DIR, 'gsd-tools.js')).size;
  console.log(`done (${(size / 1024).toFixed(0)}KB)`);
  console.log('\nBuild complete.');
}

build();
```

### Pattern 2: Installer Updates (bin/install.js)
**What:** The installer must copy the bundled `get-stuff-done/bin/dist/gsd-tools.js`, not the source `get-stuff-done/bin/gsd-tools.js`.
**When to use:** copy-mode install only. Link-mode (`--link`) symlinks the entire `get-stuff-done/` directory tree, so changes to source are immediately visible — no bundled version needed.
**How the installer currently works:**
```javascript
// bin/install.js lines 1258-1272 (copy-mode)
const skillSrc = path.join(src, 'get-stuff-done');  // entire get-stuff-done/ directory
const skillDest = path.join(targetDir, 'get-stuff-done');
// Uses copyWithPathReplacement() which recursively copies everything
copyWithPathReplacement(skillSrc, skillDest, pathPrefix, runtime);
```
The `copyWithPathReplacement()` function recursively copies the entire `get-stuff-done/` directory including `bin/gsd-tools.js`. The fix must ensure that when copying, the bundled `bin/dist/gsd-tools.js` ends up at `~/.claude/get-stuff-done/bin/gsd-tools.js` (replacing the unbundled source).

**Two implementation options:**

**Option A - Copy dist over source during install (recommended):**
After `copyWithPathReplacement(skillSrc, skillDest, ...)`, overwrite the copied source with the bundled version:
```javascript
// After copy, replace the broken source with the bundled version
const bundledSrc = path.join(src, 'get-stuff-done', 'bin', 'dist', 'gsd-tools.js');
const installedBin = path.join(skillDest, 'bin', 'gsd-tools.js');
if (fs.existsSync(bundledSrc)) {
  fs.copyFileSync(bundledSrc, installedBin);
}
```

**Option B - Exclude bin/ from directory copy, copy bundled separately:**
This is more invasive and requires changing `copyWithPathReplacement` to support exclusions. Avoid.

**Option C - Replace gsd-tools.js in-place before copyWithPathReplacement reads it:**
Not viable — would overwrite the source on developer machines.

**Recommended: Option A.** Minimal change to install.js. The copy-then-replace pattern matches the existing CHANGELOG.md post-copy step (lines 1340-1349 of install.js) which also copies a single file after the main directory copy.

### Pattern 3: Dev-Mode (--link) Is Unaffected
**What:** `--link` mode creates a junction/symlink from `~/.claude/get-stuff-done` -> project's `get-stuff-done/` directory. Since the source tree has `../../src/validation` relative to `bin/gsd-tools.js`, and `src/` is at project root, the path resolves correctly through the symlink.
**When to use:** No changes needed for link mode. It works now and will continue to work.
**Key insight:** The installer's link-mode path (lines 1261-1264 of install.js) never copies files. Symlink traversal means Node.js resolves `../../src/validation` relative to the real file location (project root), not the symlink location (`~/.claude/`).

### Pattern 4: .gitignore for dist/
**What:** `hooks/dist/` is already gitignored (Phase 13 decision BUILD-001). The new `get-stuff-done/bin/dist/` must be added to .gitignore in the same way.
**When to use:** Always for generated build artifacts.

### Pattern 5: prepublishOnly Build Chain
**What:** `package.json` `prepublishOnly` currently runs `bun run build:hooks`. Add `build:tools` to the chain.
```json
"scripts": {
  "build:hooks": "node scripts/build-hooks.js",
  "build:tools": "node scripts/build-tools.js",
  "prepublishOnly": "git diff --check HEAD && bun run build:hooks && bun run build:tools && node bin/validate-configs.js"
}
```

### Pattern 6: Test Auto-Build (beforeAll)
**What:** Phase 13 added a `beforeAll()` in hooks.test.js that auto-builds dist if missing before test run. The gsd-tools dist tests should follow the same pattern.
```javascript
// In tests/gsd-tools.test.js, existing describe blocks test source via node gsd-tools.js
// Add a beforeAll that builds dist if missing, then add dist-specific tests
beforeAll(() => {
  const distFile = path.join(PROJECT_ROOT, 'get-stuff-done', 'bin', 'dist', 'gsd-tools.js');
  if (!fs.existsSync(distFile)) {
    execSync('node scripts/build-tools.js', { cwd: PROJECT_ROOT, stdio: 'inherit' });
  }
});
```

### Anti-Patterns to Avoid
- **Setting `external: ['path', 'fs', 'child_process']` in esbuild:** Node built-ins are always external by default when `platform: 'node'`. Setting this is redundant. Setting `external: ['../../src/validation']` would break the fix entirely — src/validation MUST be inlined.
- **Bundling gsd-tools.js in-place (overwriting source):** Destroys developer workflow. Always bundle to a `dist/` subdirectory.
- **Using `format: 'esm'` in esbuild:** gsd-tools.js uses CommonJS (`require`, `module.exports` style). ESM output would break it. Use `platform: 'node'` which defaults to CJS.
- **Adding `src/` to the `files` array in package.json for npm publish:** src/ is already listed, which is correct (it's needed for link-mode dev and for other things). Do not remove it. The bundling fixes copy-mode; link-mode already works.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Inline src/validation into gsd-tools.js | Manual copy-paste of validation functions | esbuild bundle | Manual copy creates dual maintenance, validation can change in src/ without updating gsd-tools.js |
| Shebang preservation | Inject `#!/usr/bin/env node` manually after bundling | esbuild | esbuild auto-detects and preserves shebangs from entry file |
| Build verification in test | Write custom file-exists + parse check | Follow hooks.test.js `beforeAll` pattern | Pattern already proven and used by Phase 13 |

**Key insight:** src/validation is pure Node.js with only the `path` built-in. The bundle output for gsd-tools.js will be much smaller than the gsd-statusline.js bundle (which pulled in AJV + json5 = 300KB+). Expect gsd-tools bundle to be in the 100-200KB range since it's a 1913-line file plus the 192-line validation module.

## Common Pitfalls

### Pitfall 1: install.js copies gsd-tools.js source BEFORE dist/ is built
**What goes wrong:** If `build:tools` hasn't run (fresh checkout, CI without explicit build step), the dist/ file doesn't exist. The installer silently falls back to copying the source with the broken require path.
**Why it happens:** copyWithPathReplacement copies everything in get-stuff-done/ — including the un-bundled gsd-tools.js — then the overwrite step tries to copy a non-existent dist file.
**How to avoid:** The install.js post-copy step should check if bundled file exists before overwriting. Log a warning if dist is missing. The `prepublishOnly` script ensures dist is built before npm publish, so the published package always has the bundled file.
**Warning signs:** Post-install gsd-tools.js still contains `require('../../src/validation')` verbatim.

### Pitfall 2: Tests run against source (broken require path undetected)
**What goes wrong:** Current tests run `node get-stuff-done/bin/gsd-tools.js ...` from the project root where `../../src/validation` resolves correctly. Tests pass even though post-install execution fails.
**Why it happens:** Node.js resolves requires relative to the calling file's disk location. From project root, the relative path works. Post-install (`~/.claude/`), it doesn't.
**How to avoid:** Add dist-specific tests that run `node get-stuff-done/bin/dist/gsd-tools.js` from a temp directory that doesn't contain `src/`. This is the exact pattern Phase 13 used for hook dist tests.
**Warning signs:** All tests pass but `MODULE_NOT_FOUND` on real install.

### Pitfall 3: The validation test in gsd-tools.test.js checks source content, not runtime behavior
**What goes wrong:** The `validation wiring` test suite (lines 569-618 of gsd-tools.test.js) uses `fs.readFileSync(TOOLS_PATH, ...)` to check that the source has the correct `require` call. This test will PASS even after bundling because the source file is unchanged. It doesn't test the bundled file.
**Why it happens:** Source-inspection tests are checking code structure, not runtime behavior.
**How to avoid:** Add a runtime test that exercises `verify-summary` (which uses `validateGitSHA`) on the dist file from a temp dir that lacks `src/`. This catches MODULE_NOT_FOUND at test time.
**Warning signs:** `validation wiring` tests pass but runtime validation fails post-install.

### Pitfall 4: dist/gsd-tools.js committed to git
**What goes wrong:** Generated files in dist/ should be gitignored. If committed, they cause noise in diffs and can drift from source.
**Why it happens:** Easy to forget to update .gitignore.
**How to avoid:** Add `get-stuff-done/bin/dist/` to .gitignore before running the build. Verify `git status` after first build confirms dist file is ignored.

### Pitfall 5: copyWithPathReplacement path-replaces the bundled gsd-tools.js
**What goes wrong:** `copyWithPathReplacement` replaces `~/.claude/` with the target pathPrefix in all `.md` files. It does NOT transform `.js` files. However, if the post-copy overwrite logic runs against `.md` files or has path issues on Windows, it could fail silently.
**Why it happens:** `copyWithPathReplacement` skips non-.md binary/JS files (uses `fs.copyFileSync` for them). The dist file will be copied correctly as-is. The overwrite adds a second copy step that is explicit. No transformation is applied.
**How to avoid:** Verify the overwrite uses `fs.copyFileSync(bundledSrc, installedBin)` directly — no path replacement, no transformation. The bundled file is already standalone.

## Code Examples

Verified patterns from Phase 13 (directly applicable):

### build-tools.js (complete, following build-hooks.js pattern)
```javascript
// scripts/build-tools.js
// Source: follows scripts/build-hooks.js pattern (Phase 13, commit 3416d94)
#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- build script with computed paths from internal logic, no user input */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const BIN_DIR = path.join(__dirname, '..', 'get-stuff-done', 'bin');
const DIST_DIR = path.join(BIN_DIR, 'dist');

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${bytes}B`;
}

function build() {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  const src = path.join(BIN_DIR, 'gsd-tools.js');
  const dest = path.join(DIST_DIR, 'gsd-tools.js');

  process.stdout.write('Bundling gsd-tools.js... ');
  esbuild.buildSync({
    entryPoints: [src],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: dest,
    // NO 'external' -- src/validation must be inlined for copy-mode install
  });

  const size = fs.statSync(dest).size;
  console.log(`done (${formatSize(size)})`);
  console.log('\nBuild complete.');
}

build();
```

### install.js post-copy overwrite (Option A)
```javascript
// In install() function in bin/install.js, after copyWithPathReplacement(skillSrc, skillDest, ...):
// Replace broken source gsd-tools.js with self-contained bundled version
const bundledToolsSrc = path.join(src, 'get-stuff-done', 'bin', 'dist', 'gsd-tools.js');
const installedTools = path.join(skillDest, 'bin', 'gsd-tools.js');
if (fs.existsSync(bundledToolsSrc) && fs.existsSync(path.dirname(installedTools))) {
  fs.copyFileSync(bundledToolsSrc, installedTools);
  console.log(`  ${green}✓${reset} Installed gsd-tools (bundled)`);
} else {
  console.warn(`  ${yellow}!${reset} gsd-tools bundle not found, using source (validation may fail post-install)`);
}
```

### dist test pattern for gsd-tools.js
```javascript
// In tests/gsd-tools.test.js, following hooks.test.js beforeAll pattern (Phase 13)
const PROJECT_ROOT = path.join(__dirname, '..');
const DIST_TOOLS_PATH = path.join(PROJECT_ROOT, 'get-stuff-done', 'bin', 'dist', 'gsd-tools.js');

// Auto-build dist if missing before running dist tests
beforeAll(() => {
  if (!fs.existsSync(DIST_TOOLS_PATH)) {
    execSync('node scripts/build-tools.js', { cwd: PROJECT_ROOT, stdio: 'inherit' });
  }
});

describe('dist: gsd-tools bundled (regression guard for GAP-2)', () => {
  test('bundled gsd-tools.js resolves without MODULE_NOT_FOUND', () => {
    // Run from a temp dir that lacks src/ to simulate post-install environment
    const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gsd-dist-test-'));
    try {
      // Generate-slug is a simple command with no external deps -- if validation import
      // fails (MODULE_NOT_FOUND), the entire script fails before this command runs
      const result = execSync(`node "${DIST_TOOLS_PATH}" generate-slug "test text"`, {
        cwd: tmpDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      const output = JSON.parse(result.trim());
      expect(output.slug).toBe('test-text');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('bundled gsd-tools.js contains no relative src/ require paths', () => {
    const content = fs.readFileSync(DIST_TOOLS_PATH, 'utf-8');
    // After bundling, src/validation code is inlined -- no relative path should remain
    expect(content).not.toMatch(/require\(['"]\.\.\/\.\.\/src\//);
  });
});
```

## Dependency Analysis: What Gets Bundled

### gsd-tools.js dependency tree
- **src/validation/index.js** (192 lines)
  - Only Node.js built-in: `path`
  - Zero npm packages
  - Functions: validateGitSHA, validateBranchName, validateConfigPath, validateTagName, validateRemoteURL
- **Node.js built-ins (external by default in esbuild):** fs, path, child_process
- **npm packages:** NONE

**Expected bundle size:** ~50-80KB (1913-line source + 192-line validation, no npm modules to inline, esbuild overhead is minimal for pure-JS).

This is far smaller than the hook bundles (300KB+ for gsd-statusline.js with AJV). No size concerns whatsoever.

## Installer Path Analysis

### Copy-mode install path (what breaks today)
```
Source:          get-stuff-done/bin/gsd-tools.js
                 └─ require('../../src/validation')
                        ↓ resolves to
                 src/validation/index.js  ← EXISTS at project root

After copy:      ~/.claude/get-stuff-done/bin/gsd-tools.js (exact copy of source)
                 └─ require('../../src/validation')
                        ↓ resolves to
                 ~/.claude/src/validation/  ← DOES NOT EXIST
```

### After fix (copy-mode)
```
Source:          get-stuff-done/bin/gsd-tools.js       (unchanged)
Bundled:         get-stuff-done/bin/dist/gsd-tools.js  (all deps inlined by esbuild)

Installer copies get-stuff-done/ directory, then overwrites:
After install:   ~/.claude/get-stuff-done/bin/gsd-tools.js  (bundled content)
                 └─ src/validation code is inlined, no require('../..') remains
                        ↓ works anywhere
```

### Link-mode install path (not broken, no change needed)
```
Symlink:         ~/.claude/get-stuff-done -> /project/get-stuff-done (junction on Windows)
                 ↓
Node.js resolves: /project/get-stuff-done/bin/gsd-tools.js
                 └─ require('../../src/validation')
                        ↓ resolves to
                 /project/src/validation/  ← EXISTS
```

## What gsd-tools.js Installs To

From `bin/install.js` line 1258-1272:
- Source: `<npm-package-root>/get-stuff-done/` (the `get-stuff-done/` directory at project root)
- Destination: `~/.claude/get-stuff-done/` (copy-mode) or symlink (link-mode)
- `gsd-tools.js` ends up at `~/.claude/get-stuff-done/bin/gsd-tools.js`
- Referenced in commands/workflows as: `node ~/.claude/get-stuff-done/bin/gsd-tools.js`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hooks copied as-is | Hooks bundled via esbuild | Phase 13 | Hooks self-contained post-install |
| gsd-tools.js has no src/ deps | gsd-tools.js requires src/validation | Phase 14 | Created GAP-2: gsd-tools breaks post copy-mode install |
| No build step for gsd-tools | scripts/build-tools.js + dist/ bundle | Phase 15 (this fix) | gsd-tools self-contained for copy-mode install |

**Deprecated/outdated:**
- Treating `get-stuff-done/bin/gsd-tools.js` as a standalone file safe to copy without bundling: was true before Phase 14 added `require('../../src/validation')`. Broken since Phase 14.

## Open Questions

1. **Should `get-stuff-done/bin/dist/gsd-tools.js` replace source in the npm package `files` array?**
   - What we know: `package.json` `files` includes `"get-stuff-done"` which recursively includes all files including `bin/dist/`. The dist/ file will be in the published package automatically.
   - What's unclear: Whether to explicitly add `"get-stuff-done/bin/dist"` to files or rely on the directory catch-all.
   - Recommendation: Rely on the catch-all `"get-stuff-done"` entry. If `bin/dist/` is gitignored but not listed in `.npmignore`, it will be included in npm publish correctly. Verify with `npm pack --dry-run` or `bun pack --dry-run`.

2. **Should the installer warn (not fail) when dist is missing?**
   - What we know: On a fresh dev checkout, `get-stuff-done/bin/dist/gsd-tools.js` doesn't exist until `bun run build:tools` is run.
   - Recommendation: Warn, don't fail. The install still completes with the un-bundled source (which works in link mode and if someone runs from a source checkout). The warning guides them to run the build step.

3. **Should dist tests simulate the `~/.claude/` environment (run from a temp dir)?**
   - What we know: Phase 13 hooks tests don't simulate the install dir; they just run dist files from PROJECT_ROOT. This is sufficient because the test verifies no MODULE_NOT_FOUND, not the exact path resolution.
   - Recommendation: For gsd-tools, run from a temp dir that lacks `src/` to prove the MODULE_NOT_FOUND is actually fixed. This is stronger than Phase 13's approach and directly proves the bug is resolved.

## Sources

### Primary (HIGH confidence)
- Source code read: `get-stuff-done/bin/gsd-tools.js` (line 37: the broken require)
- Source code read: `src/validation/index.js` (192 lines, pure Node.js, zero npm deps)
- Source code read: `bin/install.js` (full 1761-line installer; link/copy logic lines 1168-1413)
- Source code read: `scripts/build-hooks.js` (Phase 13 esbuild precedent, proven working)
- Source code read: `tests/gsd-tools.test.js` (validation wiring tests, existing test coverage)
- Source code read: `package.json` (esbuild ^0.24.0 confirmed; files array; prepublishOnly script)
- Phase 13 SUMMARY (confirmed esbuild approach, build pattern, dist test pattern)
- `bun test` run: 441 tests passing on current codebase (confirmed baseline)
- Installer trace: confirmed `get-stuff-done/` directory copied to `~/.claude/get-stuff-done/` in copy-mode install

### Secondary (MEDIUM confidence)
- None needed — all findings verified from primary sources

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Bug diagnosis: HIGH — line 37 of gsd-tools.js confirmed; installer path confirmed; no ambiguity
- Fix approach (esbuild): HIGH — identical to Phase 13 which is proven working; validation module has zero npm deps
- Bundle size estimate: MEDIUM — calculated from source file sizes and Phase 13 bundle data; actual size requires running esbuild
- Installer change: HIGH — Option A (post-copy overwrite) is minimal and follows existing CHANGELOG.md pattern
- Test strategy: HIGH — mirrors Phase 13 dist test pattern; adds stronger path-isolation test

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (stable — esbuild API is stable; installer logic won't change)
