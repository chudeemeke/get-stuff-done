# Phase 13: Hook Bundling [GAP CLOSURE] - Research

**Researched:** 2026-02-18
**Domain:** Node.js hook bundling, esbuild, module resolution
**Confidence:** HIGH

## Summary

The bug is confirmed and fully understood: `hooks/dist/` files are plain copies of `hooks/*.js` source files (build-hooks.js uses `fs.copyFileSync`). When the installer copies these to `~/.claude/hooks/`, the `require('../src/...')` calls resolve relative to the hook file's location — `~/.claude/src/` — which does not exist. This produces MODULE_NOT_FOUND errors on first hook invocation.

The fix is esbuild bundling: replace `build-hooks.js`'s plain-copy approach with esbuild bundling that inlines all `src/` dependencies. esbuild is already a devDependency (v0.24.2) and proven to bundle all three hooks with zero errors. End-to-end tests confirm both `pre-compact.js` and `gsd-statusline.js` produce correct output when run from the bundled file.

The approach is Option (a) from the audit: bundle hooks with esbuild to inline dependencies. Options (b) install src/, (c) inline manually, and (d) dynamic resolution are all inferior for reasons documented below.

**Primary recommendation:** Replace `scripts/build-hooks.js` plain-copy with esbuild bundling for all three hooks. Update tests to also verify `hooks/dist/` bundled files work correctly.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| esbuild | ^0.24.0 | Bundle hooks with inlined dependencies | Already a devDependency; proven to work with all three hooks; zero-config for Node.js CJS |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pathe | ^2.0.3 | Cross-platform path utilities (pulled into pre-compact bundle) | Inlined by esbuild automatically |
| json5 | ^2.2.3 | JSON5 config parsing (pulled into statusline bundle) | Inlined by esbuild automatically |
| ajv | ^8.17.1 | Schema validation (pulled into statusline bundle) | Inlined by esbuild automatically |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| esbuild bundle (option a) | Install src/ alongside hooks (option b) | Option b doubles install footprint (~40 files) and still breaks if npm packages aren't co-installed |
| esbuild bundle (option a) | Inline functions manually (option c) | Manual inlining creates divergence between hooks and src/; maintenance burden; error-prone |
| esbuild bundle (option a) | Dynamic path resolution (option d) | Requires locating the npm package at runtime; fragile across global/local/npx install paths; complex |

**Installation:** No new dependencies needed. esbuild is already installed.

## Architecture Patterns

### Recommended Project Structure
```
scripts/
└── build-hooks.js     # Replace plain-copy with esbuild API calls

hooks/
├── pre-compact.js         # Source (unchanged)
├── gsd-statusline.js      # Source (unchanged)
├── gsd-check-update.js    # Source (unchanged)
└── dist/
    ├── pre-compact.js         # Bundled output (~23KB, self-contained)
    ├── gsd-statusline.js      # Bundled output (~311KB or ~154KB minified)
    └── gsd-check-update.js    # Bundled output (~1.8KB, no deps so smaller)
```

### Pattern: esbuild Programmatic API
**What:** Use esbuild's Node.js API (not CLI) inside build-hooks.js for fine-grained control over each hook's bundle options.
**When to use:** Always — hooks have different dependency profiles and may need per-hook settings.
**Example:**
```javascript
// Source: esbuild programmatic API (https://esbuild.github.io/api/)
const esbuild = require('esbuild');

esbuild.buildSync({
  entryPoints: ['hooks/pre-compact.js'],
  bundle: true,           // Inline all require()d modules
  platform: 'node',       // Target Node.js (not browser)
  target: 'node20',       // Match engines.node in package.json
  outfile: 'hooks/dist/pre-compact.js',
  // No 'external' — we want everything inlined
  // esbuild auto-preserves the #!/usr/bin/env node shebang
});
```

### Pattern: Shebang Preservation
**What:** esbuild automatically detects and preserves `#!/usr/bin/env node` from the entry file.
**When to use:** Always for hook files (they need the shebang for direct execution).
**Example:**
```javascript
// esbuild auto-handles shebang — no extra configuration needed
// Verified: first line of output is #!/usr/bin/env node
```

### Anti-Patterns to Avoid
- **Plain file copy for hooks with src/ imports:** The entire bug — `fs.copyFileSync` never resolves require paths.
- **`external` for node_modules:** Setting `external: ['ajv', 'json5']` etc. would break copy-mode installs because node_modules are not co-installed at `~/.claude/`.
- **esbuild CLI in build-hooks.js via child_process:** Use the programmatic API directly; it's already importable and avoids shell quoting issues on Windows.
- **Minification for hooks:** Optional. The 154KB vs 311KB tradeoff is not worth the readability cost for debugging installed hooks. Skip minify unless size becomes a real concern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bundling src/ deps into hooks | Custom regex/template inlining | esbuild | esbuild handles circular deps, CJS/ESM interop, pathe (ESM package), tree-shaking |
| Shebang handling in bundled output | Manual `#!/usr/bin/env node` injection | esbuild | esbuild auto-detects and preserves shebangs |
| JSON5 comment stripping | Custom comment stripper | Bundle json5 via esbuild | json5 uses unquoted keys, trailing commas — not safe to hand-roll; comment stripping gets complex |

**Key insight:** The only reason ConfigLoader pulls in AJV + json5 (~290KB of the statusline bundle) is that statusline uses `loadConfig()` which validates config. If bundle size ever becomes a concern, a targeted refactor could extract a lightweight "read 2 values" function from ConfigLoader that skips validation. But 311KB for a one-time install is acceptable.

## Common Pitfalls

### Pitfall 1: pathe is an ESM package bundled as CJS
**What goes wrong:** pathe distributes both CJS (`dist/index.cjs`) and ESM formats. esbuild correctly picks CJS for a `platform: 'node'` bundle. If someone adds `format: 'esm'` to the build options, esbuild may pick the ESM version and produce invalid CJS output.
**Why it happens:** pathe's package.json has `exports` conditions pointing to different files.
**How to avoid:** Always use `platform: 'node'` (defaults to CJS format). Do not set `format: 'esm'`.
**Warning signs:** Bundle output contains `import` or `export` statements when node expects CJS.

### Pitfall 2: dist/ files look identical to source in version control
**What goes wrong:** If dist/ files are committed as plain copies (current state), git diff won't show a meaningful change when bundling is introduced — the file content completely changes. This is confusing in PR review.
**Why it happens:** Plain copy produces identical content; bundle produces minified/iife wrapper content.
**How to avoid:** Ensure the commit message for this phase clearly explains the content change. The dist/ files will shift from being identical to source to being self-contained bundles.
**Warning signs:** Reviewer asks "why is this file so much larger than the source?"

### Pitfall 3: Tests test source, not dist
**What goes wrong:** Existing tests in `tests/hooks.test.js` run `hooks/gsd-check-update.js`, `hooks/gsd-statusline.js`, and `hooks/pre-compact.js` — the source files, not the dist files. The tests pass even when dist is broken.
**Why it happens:** Tests were written before the dist/bundling distinction was enforced.
**How to avoid:** Add a parallel test suite (or extend the existing one) that runs the dist/ versions of all three hooks. This validates that bundling produces working output. The dist tests become the regression guard for GAP-1.
**Warning signs:** CI passes but copy-mode install fails in production.

### Pitfall 4: Windows path in esbuild output directory
**What goes wrong:** On Windows, `path.join(__dirname, '..', 'hooks', 'dist')` uses backslashes. esbuild's `outfile` and `outdir` options accept both slash styles on Windows, but consistency matters.
**Why it happens:** Windows native paths vs esbuild's internal path handling.
**How to avoid:** Use `path.join()` as normal — esbuild handles it correctly on Windows (verified in research).
**Warning signs:** esbuild throws path error or writes to wrong location.

### Pitfall 5: build-hooks.js still has "pure Node.js, no bundling needed" comment
**What goes wrong:** The comment on line 14 of build-hooks.js says `// Hooks to copy (pure Node.js, no bundling needed)`. After this fix, this comment is misleading and should be updated or removed.
**Why it happens:** Comment from original implementation predates the src/ import additions.
**How to avoid:** Update the comment when replacing the build script.

### Pitfall 6: prepublishOnly runs build:hooks — ensure it runs BEFORE publish
**What goes wrong:** `package.json` `prepublishOnly` script runs `bun run build:hooks`. If the build fails silently or is skipped, the published dist/ files would be plain copies (the current broken state).
**Why it happens:** `bun run build:hooks` exits 0 even if build-hooks.js has issues.
**How to avoid:** Add explicit error handling in build-hooks.js so non-zero exit propagates to prepublishOnly. esbuild's `buildSync` throws on failure, so this is already covered.

## Code Examples

Verified patterns from actual test runs:

### esbuild bundle (pre-compact.js — simple case)
```javascript
// Source: esbuild programmatic API, verified working 2026-02-18
const esbuild = require('esbuild');
const path = require('path');

const HOOKS_DIR = path.join(__dirname, '..', 'hooks');
const DIST_DIR = path.join(HOOKS_DIR, 'dist');

esbuild.buildSync({
  entryPoints: [path.join(HOOKS_DIR, 'pre-compact.js')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: path.join(DIST_DIR, 'pre-compact.js'),
});
// Result: 23KB self-contained file. require('../src/platform/paths') inlined.
// pathe (2 modules) bundled inline. No external deps needed.
```

### esbuild bundle (gsd-statusline.js — complex case with AJV)
```javascript
// Source: esbuild programmatic API, verified working 2026-02-18
esbuild.buildSync({
  entryPoints: [path.join(HOOKS_DIR, 'gsd-statusline.js')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: path.join(DIST_DIR, 'gsd-statusline.js'),
});
// Result: 311KB self-contained file.
// Inlines: src/config/ConfigLoader.js, src/config/ConfigSchema.js,
//          src/theme/ (4 files), src/platform/terminal.js,
//          json5 (5 modules), ajv (74 modules), pathe (2 modules)
// All require('../src/...') calls resolved at build time.
```

### esbuild bundle (gsd-check-update.js — no deps)
```javascript
// gsd-check-update.js has no src/ imports (only built-in modules)
// esbuild still works but result is slightly smaller than source
// because esbuild strips comments
esbuild.buildSync({
  entryPoints: [path.join(HOOKS_DIR, 'gsd-check-update.js')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: path.join(DIST_DIR, 'gsd-check-update.js'),
});
// Result: 1.8KB (source is 2.5KB — comment removal accounts for size decrease)
```

### End-to-end test of bundled pre-compact (verified working)
```javascript
// Bundled pre-compact correctly creates events.log with trigger info
const { execSync } = require('child_process');
execSync('node hooks/dist/pre-compact.js', {
  input: JSON.stringify({ trigger: 'auto' }),
  env: { ...process.env, GSD_PLANNING_DIR: planningDir },
});
// Produces: "2026-02-18T17:13:31.527Z | COMPACTION | trigger=auto" in events.log
```

### End-to-end test of bundled gsd-statusline (verified working)
```javascript
// Bundled statusline produces correct ANSI output
const output = execSync('node hooks/dist/gsd-statusline.js', {
  input: JSON.stringify({
    model: { display_name: 'Claude Sonnet' },
    workspace: { current_dir: '/test' },
    context_window: { remaining_percentage: 50 }
  }),
  encoding: 'utf8',
});
// Output: "\x1b[36;1m⧉\x1b[0m \x1b[36m[GSD]\x1b[0m ... Claude Sonnet ..."
// Contains model name, context bar, directory — all correct
```

## Exact Dependency Tree (by hook)

### pre-compact.js
- **Direct src/ import:** `require('../src/platform/paths')` -> `gsdPaths.join`
- **Chain:** `paths.js` -> `pathe` (2 CJS modules)
- **What `gsdPaths.join` does:** Cross-platform path.join with forward slashes
- **Could be replaced with:** `path.join` from Node built-ins (pathe provides no behavioral difference for these calls)
- **Bundle size:** 23KB (4 modules total)

### gsd-statusline.js
- **Direct src/ imports (3):**
  1. `require('../src/config/ConfigLoader')` -> `loadConfig`, `getConfigValue` (try-catch, fallback to defaults)
  2. `require('../src/theme')` -> `getTheme` (CRASHES without this — used outside try-catch)
  3. `require('../src/platform/terminal')` -> `detectTerminal` (CRASHES without this — used outside try-catch)
- **ConfigLoader chain:** `ConfigLoader.js` -> `ConfigSchema.js` -> `ajv` (74 modules) + `json5` (5 modules)
- **Theme chain:** `src/theme/index.js` -> `Style.js`, `tokens.js`, `themes.js`
- **Terminal chain:** `src/platform/terminal.js` (pure Node.js built-ins only)
- **Bundle size:** 311KB (81 modules total)

### gsd-check-update.js
- **Direct src/ imports:** NONE
- **All imports:** `fs`, `path`, `os`, `child_process` (all Node.js built-ins)
- **Bundle size:** 1.8KB (esbuild strips comments)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Shell-based hooks (pre-compact.sh) | Node.js hooks | v1.x | Better cross-platform, async capability |
| No build step needed | build-hooks.js with plain copy | When src/ imports were added | Created GAP-1: copy ≠ working |
| esbuild as dev tool only | esbuild as build step for hooks | Phase 13 (this fix) | Hooks become self-contained for copy-mode |

**Deprecated/outdated:**
- Plain `fs.copyFileSync` in `build-hooks.js` line 38: was valid when hooks had no src/ imports; broken since src/ imports were added to pre-compact.js and gsd-statusline.js.

## Open Questions

1. **Should dist/ tests be added to existing hooks.test.js or as a new file?**
   - What we know: existing tests reference `hooks/` source (16 tests pass). No dist/ tests exist.
   - What's unclear: Whether to extend hooks.test.js with dist/ variants, or add a separate `hooks.dist.test.js`.
   - Recommendation: Add `hooks/dist/` variants to existing `hooks.test.js` using the same test structure with different HOOKS paths. Keep source tests as unit tests; add dist tests as integration verification.

2. **Should gsd-check-update.js be bundled even though it has no src/ imports?**
   - What we know: bundling it produces a 1.8KB file (slightly smaller). No deps to inline.
   - What's unclear: Is consistency (bundle all three) worth the marginal complexity?
   - Recommendation: Yes — bundle all three for consistency. The build loop is uniform and gsd-check-update.js will always stay in sync with source.

3. **Should the build emit a manifest (list of bundled modules)?**
   - What we know: esbuild's `metafile: true` option generates a JSON manifest of all bundled modules.
   - What's unclear: Whether check-parity.js should validate the manifest.
   - Recommendation: Out of scope for GAP-1. Add metafile only if debugging becomes necessary. Not worth the complexity.

## Sources

### Primary (HIGH confidence)
- esbuild programmatic API — direct execution of `require('esbuild').buildSync()` in project root
- Source code read: `hooks/pre-compact.js`, `hooks/gsd-statusline.js`, `hooks/gsd-check-update.js`
- Source code read: `scripts/build-hooks.js`, `bin/install.js` (hooks copy logic lines 1374-1413)
- Source code read: `src/platform/paths.js`, `src/config/ConfigLoader.js`, `src/config/ConfigSchema.js`
- Source code read: `src/theme/index.js`, `src/theme/Style.js`, `src/theme/themes.js`, `src/theme/tokens.js`
- Source code read: `src/platform/terminal.js`
- Execution test: bundled pre-compact correctly creates events.log (verified 2026-02-18)
- Execution test: bundled statusline produces correct ANSI output with model name (verified 2026-02-18)
- `bun test tests/hooks.test.js` — 16/16 tests pass on source hooks
- `package.json` — confirmed esbuild ^0.24.0 in devDependencies; node ^20.0.0 in engines

### Secondary (MEDIUM confidence)
- esbuild bundle metafile analysis — confirmed exact module counts and dependency chains

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Bug diagnosis: HIGH — confirmed by reading source code and installer logic
- Fix approach (esbuild): HIGH — verified working end-to-end with real hook execution
- Bundle sizes: HIGH — measured directly
- Test strategy: MEDIUM — recommendation based on existing test patterns; planner may choose differently

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable — esbuild API is very stable; hook sources won't change)
