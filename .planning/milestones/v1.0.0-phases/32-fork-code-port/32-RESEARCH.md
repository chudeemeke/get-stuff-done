# Phase 32: Fork Code Port - Research

**Researched:** 2026-03-29
**Domain:** CJS module porting, overlay composition, import path migration
**Confidence:** HIGH

## Summary

Phase 32 ports ~6,100 lines of fork-specific code (3,527 source + 2,576 commands/workflows/agents) from their current locations in the direct-edit fork structure to overlay/ (and bin/ for the launcher). The composition pipeline already handles overlay additive files -- it copies everything from overlay/ (except metadata files) to dist/ preserving directory structure. The primary work is moving files, updating import paths, and implementing the wrapper pattern for config/validation enhancements (PORT-08).

The critical complexity is PORT-08: the fork's core.cjs currently has `require('../../../src/validation')` hardcoded -- a direct modification of an upstream file. In the overlay architecture, upstream files are untouched. The validation integration must be reimplemented as a wrapper that imports from both upstream's core.cjs and the fork's validation module, without modifying the upstream file. This is the only module that requires architectural design; all other ports are mechanical file moves with import path updates.

**Primary recommendation:** Port in dependency order (leaf modules first, consumers last) to keep each step testable. Validation/platform/theme have no fork-internal dependencies and can move first. Config wraps validation. Hooks consume config/platform/theme. sync.cjs consumes core.cjs. Launcher consumes config/platform. Commands/workflows/agents are plain markdown files with no import dependencies.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PORT-01 | sync.cjs ported to overlay/lib/ with imports updated | sync.cjs imports core.cjs via `require('./core.cjs')` -- must update to `require('../../get-shit-done/bin/lib/core.cjs')` relative from overlay/lib/ in dist/ |
| PORT-02 | src/platform/ ported to overlay/src/platform/ | 3 files (613 lines), only external dep is `pathe` npm package -- pure leaf modules, no fork-internal imports |
| PORT-03 | src/theme/ ported to overlay/src/theme/ | 4 files (395 lines), pure self-referencing module set with no external deps -- straightforward move |
| PORT-04 | src/validation/ ported to overlay/src/validation/ | 1 file (191 lines), only uses `path` built-in -- pure leaf module |
| PORT-05 | bin/gsd.js ported to bin/ (launcher) | Already at bin/gsd.js; update imports from `../src/` to `../overlay/src/` paths. bin/ stays outside overlay/ per design spec |
| PORT-06 | hooks/pre-compact.* ported to overlay/hooks/ | 2 files (248 lines), imports gsdPaths from platform/paths.js -- update relative path |
| PORT-07 | Fork-specific workflows and commands ported to overlay/ | 1 command (upstream.md), 2 workflows (upstream-sync.md, set-profile.md), 5 agents -- markdown files, no code imports |
| PORT-08 | Config and validation as wrappers extending upstream | Current core.cjs has fork validation require -- must be redesigned as overlay wrapper pattern (no upstream file modifications) |
| PORT-09 | Existing fork tests pass after port (only import paths change) | 8,120 lines of test code across 9 files -- update require paths from `../src/` to `../overlay/src/` etc. |
</phase_requirements>

## Architecture Patterns

### Recommended Overlay Directory Structure

After porting, overlay/ will contain:

```
overlay/
  branding.json                  # existing (Phase 30)
  features.json                  # existing (Phase 31)
  lib/
    sync.cjs                     # PORT-01: from get-stuff-done/bin/lib/sync.cjs
  src/
    config/
      ConfigLoader.js            # PORT-08: wrapper, imports upstream config + fork validation
      ConfigSchema.js            # PORT-08: fork-specific schema (JSON5, ~/.gsd/config.json)
      schema.js                  # PORT-08: .planning/config.json validation schema
    platform/
      detect.js                  # PORT-02: OS/shell/environment detection
      paths.js                   # PORT-02: cross-platform paths (pathe)
      terminal.js                # PORT-02: terminal capability detection
    theme/
      index.js                   # PORT-03: theme entry point
      Style.js                   # PORT-03: fluent ANSI builder
      themes.js                  # PORT-03: theme definitions
      tokens.js                  # PORT-03: design tokens
    validation/
      index.js                   # PORT-04: git-ops input validation
  hooks/
    pre-compact.js               # PORT-06: context preservation hook
    pre-compact.sh               # PORT-06: bash version
  workflows/
    upstream-sync.md             # PORT-07: fork-specific workflow
    set-profile.md               # PORT-07: fork-specific workflow
  commands/
    gsd/
      upstream.md                # PORT-07: fork-specific command
  agents/
    general-purpose.md           # PORT-07: fork-specific agent
    gsd-oversight-execution.md   # PORT-07: fork-specific agent
    gsd-oversight-planning.md    # PORT-07: fork-specific agent
    gsd-oversight-sync.md        # PORT-07: fork-specific agent
    gsd-oversight-verification.md # PORT-07: fork-specific agent
```

Files that stay OUTSIDE overlay/:
```
bin/
  gsd.js                         # PORT-05: launcher (design spec places it here, not in overlay/)
```

### Pattern 1: Direct File Move (PORT-01 through PORT-04, PORT-06, PORT-07)

**What:** Copy fork-specific file to overlay/, update its internal require paths to work from the new location within dist/.

**When to use:** For modules that have no dependency on upstream modules (pure fork code).

**Critical path calculation:** When overlay files are composed to dist/, their relative path from dist/ root is preserved. So overlay/src/platform/detect.js ends up at dist/src/platform/detect.js. Any require within that file resolves relative to dist/src/platform/.

**Example (platform/detect.js):**
```javascript
// Before (at src/platform/detect.js):
const os = require('os');
// (no fork-internal imports, only Node.js built-ins)

// After (at overlay/src/platform/detect.js):
const os = require('os');
// No change needed -- this module has no fork-internal imports
```

**Example (hooks/pre-compact.js -- has a fork-internal import):**
```javascript
// Before (at hooks/pre-compact.js):
const { gsdPaths } = require('../src/platform/paths');

// After (at overlay/hooks/pre-compact.js):
// In dist/, this file lands at dist/hooks/pre-compact.js
// and platform/paths lands at dist/src/platform/paths.js
// So the relative path is the same: ../src/platform/paths
const { gsdPaths } = require('../src/platform/paths');
// No change needed -- overlay/ mirrors the same relative structure
```

### Pattern 2: Wrapper Pattern (PORT-08 -- Config & Validation)

**What:** Fork's config/validation code wraps or extends upstream modules via import rather than modifying upstream files directly.

**When to use:** When the fork adds capabilities ON TOP of upstream modules.

**The problem:**
- Fork's `get-stuff-done/bin/lib/core.cjs` (line 8) has: `require('../../../src/validation')` -- this is a fork modification to an upstream file
- In the overlay architecture, upstream's `core.cjs` is UNTOUCHED
- The fork's validation module (src/validation/index.js) provides `validateGitSHA`, `validateBranchName`, `validateConfigPath`, `validateTagName`, `validateRemoteURL`
- The fork's `core.cjs` wraps these in a `requireValid()` helper used by `execGit()`

**The solution:**
The fork's ConfigLoader.js, ConfigSchema.js, and schema.js are entirely fork-specific -- they manage ~/.gsd/config.json (fork's user config), not .planning/config.json (upstream's planning config). They can live in overlay/src/config/ as-is, with import paths adjusted.

The validation-to-core.cjs wiring is the harder problem. Options:

1. **Don't wire validation into upstream core.cjs at all.** The upstream's `execGit()` works fine without validation (it did for 1,400+ commits). The fork's validation was additive security hardening. In the overlay architecture, this validation can be applied at the overlay level (hooks, launcher) where fork code calls git operations, rather than deep inside upstream's core module. This means: remove the validation require from core.cjs (it becomes unmodified upstream), keep validation in overlay/src/validation/, and apply validation in fork's own calling code.

2. **Create an override for core.cjs.** Copy upstream's core.cjs to overrides/ with the validation require added, plus REASON.md. This is explicitly against PORT-08 and OVER-04 ("zero overrides on day one").

**Recommendation: Option 1.** The validation module functions (`validateGitSHA`, `validateBranchName`, etc.) are security hardening that the fork added to `execGit()`. But `execGit()` is upstream's function used by upstream's 12 lib modules. Modifying it (even via override) means every upstream update to core.cjs needs override review. Instead, fork code that calls git operations directly (sync.cjs, hooks) should validate inputs at THEIR level, not deep in upstream's shared utility.

### Pattern 3: Launcher Path Update (PORT-05)

**What:** bin/gsd.js stays at bin/gsd.js (per design spec) but its imports change.

**Example:**
```javascript
// Before:
const { gsdPaths } = require('../src/platform/paths');
const { detectTerminal } = require('../src/platform/terminal');
const { loadConfig, getConfigValue } = require('../src/config/ConfigLoader');

// After (bin/gsd.js importing from overlay/):
const { gsdPaths } = require('../overlay/src/platform/paths');
const { detectTerminal } = require('../overlay/src/platform/terminal');
const { loadConfig, getConfigValue } = require('../overlay/src/config/ConfigLoader');
```

**Note:** bin/gsd.js is NOT in overlay/ -- it is at the package root. The design spec is explicit: "bin/ gsd.js cross-platform launcher" is listed at the top level, not under overlay/. The launcher is a package entry point; overlay/ is for additive content that gets composed into dist/.

### Pattern 4: sync.cjs Import Resolution (PORT-01)

**What:** sync.cjs imports from core.cjs. In the fork, it uses `require('./core.cjs')` because they are siblings in get-stuff-done/bin/lib/. After porting to overlay/lib/sync.cjs, it needs to reach upstream's core.cjs (which will be at dist/get-shit-done/bin/lib/core.cjs when composed).

**The problem:** sync.cjs uses `{ execGit, output, error, safeReadFile }` from core.cjs. In the composed dist/, sync.cjs lands at dist/lib/sync.cjs, and upstream's core.cjs is at dist/get-shit-done/bin/lib/core.cjs.

**Solution:**
```javascript
// In overlay/lib/sync.cjs:
// When composed to dist/lib/sync.cjs, upstream core is at dist/get-shit-done/bin/lib/core.cjs
const { execGit, output, error, safeReadFile } = require('../get-shit-done/bin/lib/core.cjs');
```

### Anti-Patterns to Avoid

- **Modifying upstream files:** Never add fork requires to upstream modules. Use wrappers or apply validation at the overlay level.
- **Creating overrides for code integration:** Overrides are for replacing broken upstream behavior, not for adding fork features. Use composition instead.
- **Breaking the relative path invariant:** overlay/X must become dist/X. If a file in overlay/ needs to reach an upstream file, calculate the path as if both are in dist/.
- **Moving tests alongside source into overlay/:** Tests stay in tests/ at the project root. Only source code goes into overlay/. Test import paths update to point at overlay/ locations.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File copying to overlay/ | Custom copy script | Manual cp/mv + git add | Small number of files, one-time operation |
| Import path rewriting | AST transform / sed pipeline | Manual find-and-replace per file | Only ~15 import statements need changing across all files; automated rewriting risks corruption |
| Validating dist/ output | Custom validation script | `bun run compose` + inspect dist/ | Pipeline already handles additive file merging |

## Common Pitfalls

### Pitfall 1: Relative Import Path Calculation Error
**What goes wrong:** Import paths that work from the source location break from the overlay/ location because the relative directory depth differs.
**Why it happens:** Developer calculates path relative to overlay/ but forgets that compose copies to dist/ preserving structure, so the file's final location in dist/ is what matters for resolving imports to other dist/ files.
**How to avoid:** For each file, determine its dist/ path, determine its import target's dist/ path, compute relative path between those two dist/ paths.
**Warning signs:** `MODULE_NOT_FOUND` errors when running composed dist/ code.

### Pitfall 2: Hooks Need Bundled Versions
**What goes wrong:** Pre-compact.js is ported to overlay/hooks/ but the hooks/dist/ bundled versions (used by copy-mode install) are not updated.
**Why it happens:** The esbuild bundling step (scripts/build.js) has hardcoded source paths.
**How to avoid:** Phase 32 ports source files only. The build.js bundling entry points are Phase 33 (installer) scope. Port the source hooks, verify they work from overlay/hooks/ directly, and note that build.js paths will need updating when the installer is built.
**Warning signs:** bundled hooks in hooks/dist/ reference old paths.

### Pitfall 3: gsd-statusline and gsd-check-update Are Upstream Hooks
**What goes wrong:** Treating gsd-statusline.js and gsd-check-update.js as fork-only hooks that need porting.
**Why it happens:** They exist in the fork's hooks/ directory AND in upstream's hooks/dist/. They are NOT fork-only.
**How to avoid:** Only port pre-compact.js and pre-compact.sh (fork-only hooks). gsd-statusline.js and gsd-check-update.js exist in upstream (verified: hooks/dist/ contains both). The fork versions have fork-specific modifications (theme imports, config loader imports), but those are bundled into hooks/dist/ by esbuild -- the source files are not shipped. The bundled versions in hooks/dist/ are what upstream provides. Fork modifications to these hooks (if still needed in v3.0) would be overrides, not overlay additive code.
**Warning signs:** Collision detection error from compose.js if fork hooks land at same path as upstream hooks.

### Pitfall 4: sync.cjs Router Wiring
**What goes wrong:** sync.cjs is ported to overlay/lib/ but the gsd-tools.cjs router still has `require('./lib/sync.cjs')` pointing to its old location.
**Why it happens:** The fork's gsd-tools.cjs at get-stuff-done/bin/gsd-tools.cjs is an upstream file (albeit modified). In the overlay architecture, the upstream router does not know about sync.cjs.
**How to avoid:** The sync commands (sync-preview, sync-checkpoint) are fork-only features. In the composed dist/, the upstream gsd-tools.cjs will NOT have sync.cjs wired in. Fork-specific CLI commands that use sync.cjs should be exposed through the fork's own entry point (bin/gsd.js or a separate CLI tool), not by modifying upstream's router.
**Warning signs:** upstream gsd-tools.cjs crashes with `Cannot find module './lib/sync.cjs'` because sync.cjs was never in upstream.

### Pitfall 5: ConfigLoader npm Dependencies
**What goes wrong:** ConfigLoader.js uses `json5` and `ajv` npm packages. If these aren't available in the dist/ runtime, config loading fails.
**Why it happens:** The fork has json5 and ajv as production dependencies. Upstream has zero production dependencies. The composed dist/ may not have these available.
**How to avoid:** json5 and ajv must remain in the fork's package.json `dependencies` (not devDependencies). When the npm package ships, these deps are installed alongside the composed output. The installer can use them because they're in node_modules/.
**Warning signs:** `MODULE_NOT_FOUND: json5` or `MODULE_NOT_FOUND: ajv` at runtime.

### Pitfall 6: Test Framework Split (node:test vs bun:test)
**What goes wrong:** Some fork tests use `node:test` (sync.test.cjs, config.test.cjs) while others use `bun:test`. Moving test imports must preserve the correct test framework.
**Why it happens:** The .cjs test files use node:test for CJS module compatibility; .js test files use bun:test.
**How to avoid:** When updating import paths in tests, only change the source-module paths (e.g., `../src/platform/detect` -> `../overlay/src/platform/detect`). Do not change test framework imports.
**Warning signs:** Tests fail to find test framework functions.

## Code Examples

### Import Path Update Mapping

For each source file, this is the import path transformation:

| File | Current Location | Overlay Location | Dist Location |
|------|-----------------|-----------------|---------------|
| detect.js | src/platform/detect.js | overlay/src/platform/detect.js | dist/src/platform/detect.js |
| paths.js | src/platform/paths.js | overlay/src/platform/paths.js | dist/src/platform/paths.js |
| terminal.js | src/platform/terminal.js | overlay/src/platform/terminal.js | dist/src/platform/terminal.js |
| Style.js | src/theme/Style.js | overlay/src/theme/Style.js | dist/src/theme/Style.js |
| themes.js | src/theme/themes.js | overlay/src/theme/themes.js | dist/src/theme/themes.js |
| tokens.js | src/theme/tokens.js | overlay/src/theme/tokens.js | dist/src/theme/tokens.js |
| index.js (theme) | src/theme/index.js | overlay/src/theme/index.js | dist/src/theme/index.js |
| index.js (valid.) | src/validation/index.js | overlay/src/validation/index.js | dist/src/validation/index.js |
| ConfigLoader.js | src/config/ConfigLoader.js | overlay/src/config/ConfigLoader.js | dist/src/config/ConfigLoader.js |
| ConfigSchema.js | src/config/ConfigSchema.js | overlay/src/config/ConfigSchema.js | dist/src/config/ConfigSchema.js |
| schema.js | src/config/schema.js | overlay/src/config/schema.js | dist/src/config/schema.js |
| sync.cjs | get-stuff-done/bin/lib/sync.cjs | overlay/lib/sync.cjs | dist/lib/sync.cjs |
| pre-compact.js | hooks/pre-compact.js | overlay/hooks/pre-compact.js | dist/hooks/pre-compact.js |
| pre-compact.sh | hooks/pre-compact.sh | overlay/hooks/pre-compact.sh | dist/hooks/pre-compact.sh |
| gsd.js | bin/gsd.js | bin/gsd.js (stays) | N/A (launcher, not in dist/) |

### Test Import Path Update Mapping

| Test File | Current Import | Updated Import |
|-----------|---------------|----------------|
| platform.test.js | `../src/platform/detect` | `../overlay/src/platform/detect` |
| platform.test.js | `../src/platform/paths` | `../overlay/src/platform/paths` |
| platform.test.js | `../src/platform/terminal` | `../overlay/src/platform/terminal` |
| platform-internal.test.js | `../src/platform/detect` | `../overlay/src/platform/detect` |
| theme.test.js | `../src/theme/Style` | `../overlay/src/theme/Style` |
| theme.test.js | `../src/theme/themes` | `../overlay/src/theme/themes` |
| theme.test.js | `../src/theme/tokens` | `../overlay/src/theme/tokens` |
| validation.test.js | `../src/validation` | `../overlay/src/validation` |
| config.test.js | `../src/config/ConfigLoader` | `../overlay/src/config/ConfigLoader` |
| config.test.js | `../src/config/ConfigSchema` | `../overlay/src/config/ConfigSchema` |
| launcher.test.js | `../src/platform/paths` | `../overlay/src/platform/paths` |
| hooks.test.js | (imports hooks source files) | Update hook paths if hooks.test.js references moved files |

### sync.cjs Import Resolution

```javascript
// BEFORE: get-stuff-done/bin/lib/sync.cjs (sibling of core.cjs)
const { execGit, output, error, safeReadFile } = require('./core.cjs');

// AFTER: overlay/lib/sync.cjs (in dist/, needs to reach get-shit-done/bin/lib/core.cjs)
// dist/lib/sync.cjs -> dist/get-shit-done/bin/lib/core.cjs
const { execGit, output, error, safeReadFile } = require('../get-shit-done/bin/lib/core.cjs');
```

### ConfigLoader Wrapper Pattern

```javascript
// overlay/src/config/ConfigLoader.js
// This is pure fork code -- it manages ~/.gsd/config.json (fork's user config)
// It does NOT wrap upstream's config.cjs (which manages .planning/config.json)
// These are separate config systems for separate purposes

const fs = require('fs');
const path = require('path');
const os = require('os');
const JSON5 = require('json5');
const { validateConfig } = require('./ConfigSchema');
const { validateConfigPath } = require('../validation');
// Internal imports stay the same -- both files move together into overlay/src/
```

## Fork-Specific Hooks Analysis

### Hooks That Must Port (fork-only)

| Hook | Lines | Why Fork-Only |
|------|-------|---------------|
| pre-compact.js | 170 | Fork-specific context preservation, imports gsdPaths |
| pre-compact.sh | 78 | Bash version of pre-compact |

### Hooks That Do NOT Port (exist in upstream)

| Hook | Upstream? | Fork Modifications |
|------|-----------|-------------------|
| gsd-statusline.js | Yes (hooks/dist/) | Fork adds theme imports, config loader, 4-stage display |
| gsd-check-update.js | Yes (hooks/dist/) | Fork adds maintainer role path, config loader |
| gsd-context-monitor.js | Yes (hooks/dist/) | Minimal fork changes |

The upstream hooks are shipped as pre-bundled .js files in hooks/dist/. The fork's source versions (hooks/gsd-statusline.js etc.) have fork modifications but are also bundled to hooks/dist/ by esbuild. In the overlay architecture:
- Upstream's hooks/dist/ is included via composition
- Fork modifications to these hooks would need to be overrides (or the fork accepts upstream behavior)
- This decision is deferred -- it is an OVERRIDE decision (OVER-01 scope), and the target is zero overrides on day one

### Decision: Fork hook modifications in v3.0

The fork's gsd-statusline.js modifications (theme system, 4-stage display, config-driven behavior) are significant fork differentiators. However, the hook files ship as BUNDLED code (hooks/dist/), not source. In v3.0, the simplest correct approach is:

1. Port pre-compact.js and pre-compact.sh to overlay/hooks/ (additive -- no upstream equivalent)
2. Accept upstream's bundled hooks from hooks/dist/ for gsd-statusline, gsd-check-update, gsd-context-monitor
3. If fork-specific hook behavior is critical, create overrides in a LATER phase (not Phase 32)

This aligns with OVER-04: "zero overrides on day one."

## sync.cjs Router Integration

### The Problem

The fork's gsd-tools.cjs (the command router at get-stuff-done/bin/gsd-tools.cjs) has:
```javascript
const sync = require('./lib/sync.cjs');
```
And handles `sync-preview`, `sync-checkpoint` commands. In the overlay architecture, the upstream gsd-tools.cjs does NOT have this require (sync.cjs is fork-only).

### The Solution

sync.cjs sync commands are used by the upstream-sync.md workflow (fork-specific). The workflow calls `node gsd-tools.cjs sync-preview ...` as a subprocess. In the overlay architecture, the upstream gsd-tools.cjs router won't have these commands.

Options:
1. **Override gsd-tools.cjs** to add sync commands -- violates zero-overrides goal
2. **Create a separate sync CLI entry point** in the overlay (e.g., overlay/bin/sync-tools.cjs) -- the upstream-sync.md workflow calls this instead
3. **Wire through bin/gsd.js** -- the launcher could expose sync commands

**Recommendation: Option 2.** Create overlay/bin/sync-tools.cjs as a minimal CLI entry point that imports sync.cjs functions and exposes the sync-preview and sync-checkpoint commands. Update upstream-sync.md workflow to call this entry point instead of gsd-tools.cjs for sync operations. This keeps upstream untouched and the sync tooling self-contained.

## Composition Pipeline Verification

After porting, `bun run compose` must produce dist/ containing:
- All upstream files (from node_modules/get-shit-done-cc/) -- already works
- All overlay additive files at their overlay-relative paths -- needs verification after port

Current compose behavior (verified): overlay files are copied to dist/ at lines 781-797 of compose.js. The walkDir function recursively lists files, skips metadata (branding.json, features.json, .gitkeep), and copies to dist/ preserving relative paths. No code changes to compose.js are needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | bun:test (for .js files) + node:test (for .cjs files) |
| Config file | none -- bun test auto-discovers |
| Quick run command | `bun test tests/platform.test.js tests/theme.test.js tests/validation.test.js` |
| Full suite command | `bun test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PORT-01 | sync.cjs imports resolve from overlay/lib/ | integration | `bun test tests/sync.test.cjs -t "sync"` | Exists (needs path update) |
| PORT-02 | platform/ modules importable from overlay/src/platform/ | unit | `bun test tests/platform.test.js` | Exists (needs path update) |
| PORT-03 | theme/ modules importable from overlay/src/theme/ | unit | `bun test tests/theme.test.js` | Exists (needs path update) |
| PORT-04 | validation/ importable from overlay/src/validation/ | unit | `bun test tests/validation.test.js` | Exists (needs path update) |
| PORT-05 | launcher imports resolve from overlay paths | unit | `bun test tests/launcher.test.js` | Exists (needs path update) |
| PORT-06 | pre-compact hooks importable from overlay/hooks/ | unit | `bun test tests/hooks.test.js -t "pre-compact"` | Exists (needs path update) |
| PORT-07 | fork-specific md files exist in overlay/ dirs | smoke | `ls overlay/workflows/ overlay/commands/gsd/ overlay/agents/` | N/A (directory check) |
| PORT-08 | config modules work as wrappers (no upstream modification) | unit | `bun test tests/config.test.js tests/config.test.cjs` | Exists (needs path update) |
| PORT-09 | all ported tests pass with updated imports | integration | `bun test` | Exists (needs path updates) |

### Sampling Rate
- **Per task commit:** `bun test tests/<affected-file>.test.js`
- **Per wave merge:** `bun test`
- **Phase gate:** Full suite green + `bun run compose` produces correct dist/

### Wave 0 Gaps
- [ ] Smoke test verifying compose includes overlay files in dist/ -- currently untested because overlay/ has no additive files yet
- [ ] Verify dist/ relative import resolution for sync.cjs -> core.cjs path

## Open Questions

1. **gsd-statusline/gsd-check-update fork modifications**
   - What we know: these hooks exist in upstream (bundled in hooks/dist/). The fork has source-level modifications (theme system, config loader, maintainer role).
   - What's unclear: whether v3.0 can accept upstream hook behavior or needs overrides.
   - Recommendation: accept upstream hooks for v3.0 (zero overrides on day one). If fork hook behavior is critical, create overrides in Phase 34 or later.

2. **sync.cjs CLI exposure**
   - What we know: sync commands are wired into the fork's modified gsd-tools.cjs router. Upstream router does not know about sync.
   - What's unclear: exact CLI entry point design for sync commands in overlay architecture.
   - Recommendation: create overlay/bin/sync-tools.cjs minimal entry point. Update upstream-sync.md to call it.

3. **bin/validate-configs.js**
   - What we know: exists at bin/validate-configs.js (265 lines), imports from src/config/schema.js. Fork-specific.
   - What's unclear: whether this should port to overlay/ or stay at bin/.
   - Recommendation: port to overlay/bin/validate-configs.js -- it's a fork utility, not a user-facing entry point.

## Sources

### Primary (HIGH confidence)
- Design spec: `docs/superpowers/specs/2026-03-28-overlay-architecture-design.md` -- authoritative architecture document with explicit directory structure and wrapper pattern specification
- compose.js source: `scripts/compose.js` lines 781-797 -- verified overlay additive file merging behavior
- Codebase analysis: direct inspection of all fork-specific files, their imports, and dependencies

### Secondary (MEDIUM confidence)
- REQUIREMENTS.md PORT-01 through PORT-09 -- requirement definitions
- ROADMAP.md Phase 32 success criteria -- acceptance criteria

## Metadata

**Confidence breakdown:**
- Architecture (file locations, overlay structure): HIGH -- design spec is explicit and verified against compose.js behavior
- Import path resolution: HIGH -- verified by tracing require chains and computing dist/ relative paths
- Wrapper pattern (PORT-08): HIGH -- analyzed current fork modifications to upstream core.cjs, identified clean separation
- Hook porting scope: HIGH -- verified upstream hooks/dist/ contents against fork hooks directory
- sync.cjs router wiring: MEDIUM -- recommended approach (separate CLI entry point) not yet validated

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (stable -- architecture decisions are locked)
