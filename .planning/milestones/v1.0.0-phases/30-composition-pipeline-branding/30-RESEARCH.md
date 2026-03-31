# Phase 30: Composition Pipeline & Branding - Research

**Researched:** 2026-03-28
**Domain:** Build pipeline composition, file system manipulation, text branding/substitution
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Compose CLI output:**
- Default output: summary only. Silent during work, summary table at end showing upstream files, overlay files, branding rules applied, overrides, warnings, output size
- Errors go to stderr immediately (fail fast)
- `--verbose` shows stage-by-stage progress: [RESOLVE], [FILTER], [OVERRIDE], [BRAND], [MERGE] with counts and branding hit details per rule
- No file-by-file listing in any mode (too noisy for 150+ files)

**Dry run and diff:**
- `--dry-run` shows "DRY RUN -- no files written" banner, then summary of what would happen: file counts by action type (copy, brand, override, overlay), collision count, warning count. No files written.
- `--diff` shows change summary comparing current `dist/` against what a new composition would produce: added/removed/changed file counts with filenames listed per category. No content-level diffs (just filenames).

**Validation strictness:**
- Upstream structure validation: fail fast on first mismatch. No partial dist/ written. Error includes what was expected and where, plus hint to run `preview-update`.
- Branding rule with zero file matches: warning, not error. Surfaced in summary. Rule may be stale after upstream restructure -- not dangerous enough to block composition.
- Collision detection: error with actionable guidance. Names both sources, shows exact commands to move to overrides/ or rename.

**Composition behavior:**
- Clean rebuild every time: delete dist/ entirely before composing. No incremental mode. Guarantees no stale files from previous compositions.

### Claude's Discretion

- Pipeline stage function signatures and data flow between stages
- Internal file manifest format (how files are tracked through the pipeline)
- Branding word-boundary matching algorithm (regex vs more sophisticated)
- Error message formatting beyond the patterns discussed above
- Test structure and organization for compose.test.js and branding.test.js

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMP-01 | compose.js reads upstream files from node_modules/get-shit-done-cc/ and overlay files from overlay/ | Upstream at node_modules/get-shit-done-cc/ confirmed (225 files). overlay/ dir does not yet exist -- Phase 30 creates it as scaffold. |
| COMP-02 | compose.js validates upstream directory structure matches expected layout before composing | Expected layout: bin/, commands/gsd/, get-shit-done/, agents/, hooks/dist/, scripts/, package.json. Confirmed from upstream. |
| COMP-03 | compose.js applies feature flag filtering (exclude workflows, commands, agents, hooks, SDK by name) | CONTEXT: FEAT-01 to FEAT-04 are Phase 31. Phase 30 scope is FILTER stage stub that supports feature flags; the full features.json system is Phase 31. |
| COMP-04 | compose.js applies overrides (files in overrides/ replace upstream equivalents) | OVER-01 to OVER-04 are Phase 31. Phase 30 scope is OVERRIDE stage stub; zero overrides on day one. |
| COMP-05 | compose.js applies surface-only branding from branding.json (text scope, not paths) | 11 upstream files contain branding targets. branding.json has 3 substitution rules. Word-boundary matching critical to avoid partial replacements. |
| COMP-06 | compose.js merges overlay additive files into composed output | Merge stage copies overlay/ files to dist/ (additive, no clobber of upstream). |
| COMP-07 | compose.js writes .install-meta.json with upstream version, overlay version, timestamp, features disabled, overrides applied | Schema defined in design spec. Keys: upstream_version, overlay_version, composed_at, features_disabled, overrides_applied, branding_rules_applied. |
| COMP-08 | compose.js detects collisions (overlay file at same path as upstream file) and errors with guidance | Triggered only in overlay/ vs upstream file comparison. overrides/ vs upstream is NOT a collision (intentional replacement). |
| COMP-09 | compose.js supports --dry-run and --diff flags | --dry-run: no files written, summary only. --diff: filename-only delta against current dist/. |
| COMP-10 | Each pipeline stage (resolve, filter, override, brand, merge) is a separate importable function following SRP | Functions exported from scripts/compose.js, callable in tests without running the full CLI. |
| COMP-11 | Composition pipeline tests written before implementation (TDD); tests verify branding, feature flags, overrides, collision detection, meta output | Tests in tests/compose.test.js (pipeline) and tests/branding.test.js (branding engine). Written RED before implementation. |
| BRAND-01 | branding.json substitutions apply only to user-visible text (help text, docs, CLI output) | 11 upstream files contain branding targets. Brand engine applies only to these files. |
| BRAND-02 | Internal directory names (get-shit-done/) preserved unchanged in composed output | install.js has 29 occurrences of bare 'get-shit-done' -- all path resolution. MUST NOT be replaced. |
| BRAND-03 | Internal code paths, import statements, config keys, regex patterns are NOT branded | GSD_CODEX_MARKER and GSD_COPILOT_INSTRUCTIONS_MARKER strings contain 'get-shit-done installer' -- these are const names and strings used as file markers, must be preserved. |
| BRAND-04 | Word-boundary matching prevents partial-string corruption | 'get-shit-done-cc' must not accidentally match as part of 'get-shit-done-cc@latest' before the @latest substitution runs. Order-dependent substitution required. |
| BRAND-05 | LICENSE file preserved from upstream; CREDITS.md added attributing upstream | LICENSE copied unmodified. CREDITS.md generated during MERGE stage when preserveUpstreamCredit: true. |
| BRAND-06 | branding.json validated against schema before use (prevent injection via malformed substitution rules) | Schema validation in RESOLVE stage before any substitutions run. Uses existing AJV devDependency pattern from project. |
</phase_requirements>

---

## Summary

Phase 30 builds `scripts/compose.js` -- the dev-time composition pipeline that reads 225 upstream files from `node_modules/get-shit-done-cc/`, applies three transformations (feature flag filtering, override replacement, surface branding), merges fork-specific `overlay/` files, and writes the result to `dist/` with a `.install-meta.json` audit trail. The pipeline has five stages (RESOLVE, FILTER, OVERRIDE, BRAND, MERGE), each a separately importable function for testability.

The branding system is the most technically nuanced part. Upstream contains exactly 11 files with branding targets (`get-shit-done-cc`, `TACHES/TÂCHES`, `glittercowboy`). The core constraint -- proven in Phase 29 -- is that bare `get-shit-done` (without `-cc`) appears 29 times in install.js as internal path identifiers and must not be replaced. The design's scope `"text"` means substitutions apply to user-visible strings (help text, CLI output, docs) but not code paths or data structure keys. Because the upstream `update.md` workflow contains shell commands like `npx get-shit-done-cc@latest` that are instructions to users, those ARE user-visible text and should be branded.

Phase 30 also creates the `overlay/` directory scaffold (branding.json, features.json, empty overrides/) that subsequent phases (31-35) will populate. The `overlay/` directory does not yet exist in the project. Feature flags (COMP-03, FEAT-01 through FEAT-04) and the override system (COMP-04, OVER-01 through OVER-04) are scaffolded as stubs in Phase 30 and fully implemented in Phase 31.

**Primary recommendation:** Implement each pipeline stage as a pure function (input: file manifest state, output: next state). Use a single file manifest object that flows through all stages, accumulating mutations. This makes each stage testable in isolation and enables --dry-run by simply not calling the MERGE stage's write operations.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fs (built-in) | Node 20+ | File read/write/copy/delete | No external deps needed for file operations |
| path (built-in) | Node 20+ | Cross-platform path resolution | Project already uses path.join everywhere |
| node:fs/promises | Node 20+ | Async file ops (optional) | Upstream uses sync fs; compose can too for simplicity |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| AJV | ^8.17.1 | JSON schema validation for branding.json/features.json | Already in project dependencies; use for BRAND-06 |
| bun:test | built-in | Test runner | Already the test framework (bunfig.toml includes **/*.test.js) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fs.cpSync (recursive) | Manual file-by-file copy | fs.cpSync handles symlinks and is one line; manual gives more control. Use cpSync for full-tree copies, manual for selective copies. |
| String.prototype.replace | node:stream Transform | Streams overkill for text files; string replace simpler and upstream files are all <50KB text. |
| AJV for schema validation | JSON Schema Draft-7 manual check | AJV already in project deps (Phase 14 wired it). No new dependency needed. |

**Installation:** No new dependencies needed. All required tools are Node.js built-ins or existing project devDependencies.

---

## Architecture Patterns

### Recommended Project Structure

Phase 30 creates:
```
scripts/
  compose.js           # Pipeline entry point + exportable stage functions
  build.js             # Existing (unchanged)
  check-parity.js      # Existing (unchanged)

overlay/
  branding.json        # 3 substitution rules (created by Phase 30)
  features.json        # Feature flag scaffold (stub for Phase 31)
  .gitkeep             # Marker for empty overlay/ (no fork code yet)

overrides/
  .gitkeep             # Empty by design on day one (OVER-04)

tests/
  compose.test.js      # Pipeline tests (TDD -- written first)
  branding.test.js     # Branding engine tests (TDD -- written first)
```

### Pattern 1: File Manifest Pipeline

The pipeline tracks each file as an entry in a manifest array. Each stage reads the manifest and returns an updated manifest.

**What:** A manifest entry describes one file's journey through the pipeline: its source path, destination path in dist/, content (or null to use source as-is), what action was taken, and which stage last touched it.

**When to use:** Any multi-stage file transformation where stages need to inspect and modify what previous stages decided.

**Example:**
```javascript
// Source: design spec + Phase 29 prototype pattern

/**
 * @typedef {Object} ManifestEntry
 * @property {string} sourcePath    - Absolute path to source file
 * @property {string} destPath      - Relative path in dist/ output
 * @property {string|null} content  - Modified content, or null to copy verbatim
 * @property {'copy'|'brand'|'override'|'overlay'|'skip'} action
 * @property {string} stage         - Last pipeline stage that touched this entry
 */

// RESOLVE: build initial manifest from upstream + overlay scan
function resolve(upstreamDir, overlayDir, overridesDir, brandingConfig, featuresConfig) {
  const manifest = [];
  // Walk upstream, create entry for each file
  // Load branding.json, features.json, scan overrides/
  return { manifest, branding: brandingConfig, features: featuresConfig, warnings: [] };
}

// FILTER: exclude disabled features (stub in Phase 30, full in Phase 31)
function filter(state) {
  // For each manifest entry, mark as 'skip' if disabled in features.json
  // Phase 30: pass-through (all features enabled)
  return state;
}

// OVERRIDE: replace upstream entries with overrides/ content
function override(state) {
  // For each entry, check overrides/ for matching path
  // Phase 30: pass-through (zero overrides)
  return state;
}

// BRAND: apply text substitutions to user-visible content
function brand(state) {
  // For each non-skipped entry, apply branding if file is in text-brandable set
  return state;
}

// MERGE: write dist/, copy overlay/ files, write .install-meta.json
function merge(state, distDir, opts = {}) {
  if (opts.dryRun) { return state; } // dry-run: skip writes
  // Delete dist/ entirely, then write all manifest entries
  // Copy overlay/ additive files
  // Write .install-meta.json
  return state;
}
```

### Pattern 2: Surface-Only Branding Engine

Branding must distinguish between text that is user-visible (help strings, docs, install commands) and code that is internal (path resolution, config keys, regex patterns).

**What:** The branding engine applies string substitutions in a defined order, on text files only, but with logic to skip code-path contexts.

**Key insight from Phase 29 prototype:** The challenge is NOT detecting code vs. text at the file level -- it IS file-level. `install.js` is code, but it contains user-visible strings embedded in it. The Phase 29 prototype used simple `String.replace()` with exact patterns and it worked correctly because `get-shit-done-cc` (with `-cc`) ONLY appears in user-visible contexts in install.js (help text, error messages, examples). The bare `get-shit-done` (without `-cc`) is what appears in code paths. The two strings do not overlap.

**Therefore:** The `scope: "text"` rule is implemented by the **specificity of the substitution patterns themselves**, not by HTML/AST parsing. `get-shit-done-cc` is always a package name reference (user-visible). Bare `get-shit-done` is always a directory/path reference (internal). No code-vs-text detection needed.

**When to use:** Apply to all 11 branding-target files during BRAND stage.

**Example:**
```javascript
// Source: Phase 29 applyBranding() + design spec branding system

function applyBrandingToContent(content, substitutions) {
  // Apply in order: most-specific patterns first (longer patterns before shorter)
  // This prevents 'get-shit-done-cc@latest' from being partially replaced
  // before the @latest version gets its own substitution
  let result = content;
  for (const sub of substitutions) {
    if (sub.scope !== 'text') continue; // only text-scoped rules
    result = result.replaceAll(sub.from, sub.to);
  }
  return result;
}

// Word-boundary approach for TACHES/author names (prevents partial replacement)
function applyBrandingWithWordBoundary(content, from, to) {
  // Simple approach: TACHES appears as whole word in author contexts only
  // Use \b word boundary regex for short tokens that could be substrings
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return content.replace(new RegExp(`\\b${escaped}\\b`, 'g'), to);
}
```

### Pattern 3: Expected Upstream Structure Validation

The pipeline must fail fast if upstream changes its directory layout (COMP-02).

**What:** Validate that specific expected paths exist in node_modules/get-shit-done-cc/ before composing.

**When to use:** First thing in RESOLVE stage, before reading any files.

**Example:**
```javascript
// Source: design spec + observed upstream structure

const EXPECTED_UPSTREAM_PATHS = [
  'bin/install.js',
  'commands/gsd',          // directory
  'get-shit-done',         // directory
  'get-shit-done/bin/gsd-tools.cjs',
  'agents',                // directory
  'hooks/dist',            // directory
  'hooks/dist/gsd-check-update.js',
  'package.json',
];

function validateUpstreamStructure(upstreamDir) {
  for (const expected of EXPECTED_UPSTREAM_PATHS) {
    const fullPath = path.join(upstreamDir, expected);
    if (!fs.existsSync(fullPath)) {
      throw new Error(
        `Upstream structure validation failed.\n` +
        `Expected: ${expected}\n` +
        `Not found at: ${fullPath}\n` +
        `Hint: run \`bun run preview-update\` to check upstream version compatibility.`
      );
    }
  }
}
```

### Pattern 4: Collision Detection

Overlay files at the same path as upstream files are an error (COMP-08). Override files at the same path as upstream files are intentional and NOT a collision.

**What:** After building the upstream file list, check if any overlay/ file shares a relative path with any upstream file.

**When to use:** RESOLVE stage, after loading both manifests.

**Example:**
```javascript
// Source: design spec conflict resolution table

function detectCollisions(upstreamRelPaths, overlayRelPaths, overridesRelPaths) {
  const collisions = [];
  const upstreamSet = new Set(upstreamRelPaths);

  for (const overlayPath of overlayRelPaths) {
    if (upstreamSet.has(overlayPath) && !overridesRelPaths.includes(overlayPath)) {
      collisions.push(overlayPath);
    }
  }
  return collisions;
  // If collisions.length > 0, error with guidance:
  // "Collision detected: overlay/X exists at same path as upstream file.
  //  Move to overrides/ if intentional:
  //    mv overlay/X overrides/X
  //    echo '# Override: X\n## Why\n[reason]' > overrides/X.REASON.md"
}
```

### Anti-Patterns to Avoid

- **Incremental composition:** Never skip deleting dist/ before composing. Stale files from previous compositions break the audit trail and produce non-reproducible output. The CONTEXT locks this to "clean rebuild every time."
- **Branding by file extension alone:** `.md` files are not all user-visible text (some contain code blocks). The branding targets are specific enough that pattern specificity (not file type) is the right filter.
- **Applying branding to overlay/ or overrides/ files:** These are fork-owned. Skip them in BRAND stage entirely.
- **Applying substitutions in alphabetical order:** Order matters. `get-shit-done-cc@latest` must be substituted before `get-shit-done-cc` to avoid double-replacing. Apply most-specific (longest) patterns first.
- **fs.writeFileSync on every file:** For files with no branding hits and no override, use fs.copyFileSync (faster, preserves metadata). Only use writeFileSync when content was modified.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema validation | Custom validation logic for branding.json | AJV (already in package.json dependencies) | AJV handles type coercion, error messages, additionalProperties. Already wired in project (ConfigSchema.js) |
| Recursive directory copy | Manual recursive walk + copy | fs.cpSync(src, dst, { recursive: true }) | One built-in call handles symlinks, permissions, nested dirs. Used in prototype-installer.test.js already. |
| Recursive directory walk | Custom walk function | Recursive readdirSync pattern (standard Node idiom) | Simple enough to inline; no npm package needed |
| Path normalization | Custom string manipulation | path.join / path.relative / path.normalize | Built-in handles Windows/Unix separator differences |

**Key insight:** This pipeline deals with file system operations and string substitution -- both are fully covered by Node.js built-ins and one existing project dependency (AJV). No new npm packages are needed.

---

## Common Pitfalls

### Pitfall 1: Branding 'get-shit-done' When Only 'get-shit-done-cc' Should Be Replaced

**What goes wrong:** A substitution rule like `{ from: "get-shit-done", to: "get-stuff-done" }` with `scope: "text"` would corrupt every path reference in install.js (29 occurrences), breaking the entire installer.

**Why it happens:** The design's "scope: text" can be misread as applying to any text file, rather than understanding that the scope is expressed via pattern specificity.

**How to avoid:** The three branding.json substitutions in the design spec use `get-shit-done-cc` (with `-cc` suffix), not bare `get-shit-done`. The `-cc` suffix ONLY appears in user-visible contexts. Validate this invariant in branding tests: after BRAND stage, bare `get-shit-done` occurrences in install.js must equal the upstream count (29).

**Warning signs:** If branding tests fail with "upstream installed directory not found" or install.js path errors, a path-corrupting substitution has been applied.

### Pitfall 2: Substitution Order Causing Partial Double-Replace

**What goes wrong:** Applying `get-shit-done-cc -> @chude/get-stuff-done` before `get-shit-done-cc@latest -> @chude/get-stuff-done@latest` results in `@chude/get-stuff-done@latest` (correct), but applying in the wrong order (short before long) results in `@chude/get-stuff-done@latest -> @chude/get-stuff-done@latest@latest` if not careful.

**Why it happens:** JavaScript's `String.replace/replaceAll` does not have a longest-match rule. It applies patterns sequentially.

**How to avoid:** Sort substitutions by `from` length descending before applying. Apply most-specific patterns first. The design spec's three substitutions naturally order: `glittercowboy/get-shit-done` (longest) > `get-shit-done-cc` > `TACHES`.

**Warning signs:** Branding output contains double-replaced artifacts like `@@chude/get-stuff-done` or `@chude/get-stuff-done@latest-done@latest`.

### Pitfall 3: GSD_CODEX_MARKER / GSD_COPILOT_INSTRUCTIONS_MARKER Corruption

**What goes wrong:** install.js defines constants:
```javascript
const GSD_CODEX_MARKER = '# GSD Agent Configuration — managed by get-shit-done installer';
const GSD_COPILOT_INSTRUCTIONS_MARKER = '<!-- GSD Configuration — managed by get-shit-done installer -->';
```
These strings contain `get-shit-done` (bare, no `-cc`). A "brand all occurrences of get-shit-done" approach would corrupt them to `get-stuff-done installer`, potentially breaking marker detection in user files during uninstall.

**Why it happens:** Conflating "brand the npm package name" with "brand all occurrences of the project name."

**How to avoid:** The branding.json only brands `get-shit-done-cc` (with `-cc`). These markers use bare `get-shit-done`. They are untouched. Verify in branding tests that these exact strings remain present in the dist/bin/install.js after composition.

### Pitfall 4: dist/ Not Gitignored Before Phase 30 Commit

**What goes wrong:** Running `bun run compose` during development creates dist/ with 225+ files. If .gitignore is not updated, these files get committed, polluting git history and creating merge conflicts later.

**Why it happens:** The design spec says dist/ is gitignored but the .gitignore has not been updated in the project yet (dist/ does not currently exist, so there is no current entry for it).

**How to avoid:** Add `dist/` to .gitignore as the very first task in Phase 30, before running compose.

**Warning signs:** `git status` shows hundreds of new files under `dist/` after first compose run.

### Pitfall 5: bun test Timeout on compose.test.js Integration Tests

**What goes wrong:** Composition tests that use the real upstream package (225 files, fs.cpSync) can take longer than the default 15-second test timeout in bunfig.toml.

**Why it happens:** bunfig.toml sets `timeout = 15000`. Full composition involves reading 225 files, applying branding, writing dist/. On Windows CI, file operations are slower.

**How to avoid:** Use `{ timeout: 30000 }` on integration tests that do full composition (same pattern as prototype-installer.test.js). Unit tests that use in-memory fake manifests need no timeout override.

**Warning signs:** Tests pass locally but fail with "timeout exceeded" in CI.

### Pitfall 6: Windows Path Separators in Relative Paths

**What goes wrong:** `path.relative(upstreamDir, filePath)` returns `'bin\\install.js'` on Windows but `'bin/install.js'` on Unix. Using these as collision detection keys produces false negatives (Windows key != Unix key).

**Why it happens:** path.relative uses the platform separator.

**How to avoid:** Normalize all relative paths with forward slashes: `relPath.replace(/\\/g, '/')`. Create a helper `toRelPath(base, full)` used everywhere in the pipeline. The existing pitfalls.md documents the Windows path issue from Phase 20.

---

## Code Examples

### Pipeline Entry Point (CLI)

```javascript
// Source: design spec + check-parity.js pattern + build.js pattern
#!/usr/bin/env node

const path = require('path');
const { resolve, filter, override, brand, merge } = require('./compose');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const diff = args.includes('--diff');
const verbose = args.includes('--verbose');

const PROJECT_ROOT = path.join(__dirname, '..');
const UPSTREAM_DIR = path.join(PROJECT_ROOT, 'node_modules', 'get-shit-done-cc');
const OVERLAY_DIR = path.join(PROJECT_ROOT, 'overlay');
const OVERRIDES_DIR = path.join(PROJECT_ROOT, 'overrides');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');

try {
  // Stage 1: RESOLVE
  if (verbose) process.stdout.write('[RESOLVE] Scanning upstream and overlay...\n');
  let state = resolve(UPSTREAM_DIR, OVERLAY_DIR, OVERRIDES_DIR);

  // Stage 2: FILTER
  if (verbose) process.stdout.write(`[FILTER] ${state.manifest.length} files in queue...\n`);
  state = filter(state);

  // Stage 3: OVERRIDE
  if (verbose) process.stdout.write('[OVERRIDE] Applying overrides...\n');
  state = override(state);

  // Stage 4: BRAND
  if (verbose) process.stdout.write('[BRAND] Applying branding...\n');
  state = brand(state);

  // Stage 5: MERGE
  if (verbose) process.stdout.write('[MERGE] Writing dist/...\n');
  state = merge(state, DIST_DIR, { dryRun, diff });

  // Print summary
  printSummary(state, { dryRun });
} catch (err) {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
}
```

### branding.json Schema (for AJV validation)

```javascript
// Source: design spec branding system section
const brandingSchema = {
  type: 'object',
  required: ['substitutions'],
  additionalProperties: false,
  properties: {
    substitutions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['from', 'to', 'scope'],
        additionalProperties: false,
        properties: {
          from: { type: 'string', minLength: 1 },
          to: { type: 'string', minLength: 1 },
          scope: { type: 'string', enum: ['text'] },
          note: { type: 'string' }
        }
      }
    },
    preserveUpstreamCredit: { type: 'boolean' }
  }
};
```

### .install-meta.json Content

```json
{
  "upstream_version": "1.30.0",
  "overlay_version": "3.0.0",
  "composed_at": "2026-03-28T14:00:00.000Z",
  "features_disabled": [],
  "overrides_applied": [],
  "branding_rules_applied": 3
}
```

Note: `overlay_version` reads from `package.json` `version` field. `upstream_version` reads from `node_modules/get-shit-done-cc/package.json` `version` field.

### CREDITS.md Content (when preserveUpstreamCredit: true)

```markdown
# Credits

This software is based on [GSD (Get Shit Done)](https://github.com/glittercowboy/get-shit-done) by TACHES.

The upstream project is available at https://github.com/glittercowboy/get-shit-done
and is licensed under the MIT License.
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct-edit fork (cherry-pick sync) | Overlay architecture (npm devDependency) | Phase 29 -- v1.0.0 milestone | Upstream sync becomes `bun update` + `bun run compose` |
| All-or-nothing file copy | Pipeline stages with manifest tracking | Phase 30 | Testable, auditable, diff-able |
| Scope "all" branding (internal renames) | Scope "text" branding (surface only) | Phase 29 QA review | No install.js path rewriting needed |

**Deprecated/outdated:**
- `scope: "all"` branding: was in original design, removed during QA review. Never implement it. Internal directory names (get-shit-done/) stay unchanged.
- Cherry-pick sync (upstream-sync.md workflow): still exists in fork code for v0.4.0-legacy compatibility, but is NOT used in overlay architecture.

---

## Open Questions

1. **Where does `overlay/` live during Phase 30?**
   - What we know: overlay/ does not yet exist. Phase 30 creates it.
   - What's unclear: Does Phase 30 create just the config files (branding.json, features.json) and empty dirs, or does it also populate overlay/ with actual fork code?
   - Recommendation: Phase 30 creates the scaffold only (branding.json, features.json, overrides/.gitkeep, overlay/.gitkeep). Fork code porting is Phase 32. The compose.js handles an empty overlay/ gracefully (zero overlay files, no collisions).

2. **Does Phase 30 need `bun run compose` to produce a working dist/?**
   - What we know: COMP-01 through COMP-11 all reference the full pipeline. The design spec says composition happens at publish time.
   - What's unclear: Is a working dist/ a success criterion for Phase 30, or just the pipeline machinery?
   - Recommendation: Yes -- success criteria includes `bun run compose` producing a correct dist/ with .install-meta.json. The compose.js should work end-to-end with the upstream package in node_modules/ even when overlay/ is empty. Tests verify this.

3. **Does `update.md` `npm view get-shit-done-cc version` need branding?**
   - What we know: update.md line 149 has `npm view get-shit-done-cc version` as a shell command. This is a command that queries the upstream npm package by its actual package name.
   - What's unclear: Should this be branded to `npm view @chude/get-stuff-done version`? The @chude package is separate from upstream.
   - Recommendation: Do NOT brand this line. The update workflow uses npm view to check the UPSTREAM package version, not the fork. Branding it would break the update check. This is a case where `get-shit-done-cc` appears in a code-execution context (not user-visible help text). Consider adding this as an explicit exception case in the branding engine, or adding a `"scope": "docs-only"` rule variant. For now, document that the three branding rules apply, but the update.md npm view line will retain the upstream package name -- which is functionally correct.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | bun:test (built-in) |
| Config file | bunfig.toml -- `include = ["**/*.test.js"]`, `timeout = 15000` |
| Quick run command | `bun test tests/compose.test.js tests/branding.test.js` |
| Full suite command | `bun test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMP-01 | compose reads from node_modules/get-shit-done-cc/ and overlay/ | integration | `bun test tests/compose.test.js` | No -- Wave 0 |
| COMP-02 | upstream structure validation fails fast | unit | `bun test tests/compose.test.js` | No -- Wave 0 |
| COMP-03 | feature flag filtering (stub pass-through) | unit | `bun test tests/compose.test.js` | No -- Wave 0 |
| COMP-04 | overrides replacement (stub pass-through) | unit | `bun test tests/compose.test.js` | No -- Wave 0 |
| COMP-05 | surface-only branding applied correctly | unit | `bun test tests/branding.test.js` | No -- Wave 0 |
| COMP-06 | overlay files merged additively | unit | `bun test tests/compose.test.js` | No -- Wave 0 |
| COMP-07 | .install-meta.json written correctly | unit | `bun test tests/compose.test.js` | No -- Wave 0 |
| COMP-08 | collision detection errors with guidance | unit | `bun test tests/compose.test.js` | No -- Wave 0 |
| COMP-09 | --dry-run and --diff flags work | unit | `bun test tests/compose.test.js` | No -- Wave 0 |
| COMP-10 | each stage is separately importable | unit | `bun test tests/compose.test.js` | No -- Wave 0 |
| COMP-11 | TDD: tests written before implementation | process | verify test file created before compose.js | No -- Wave 0 |
| BRAND-01 | substitutions apply to user-visible text | unit | `bun test tests/branding.test.js` | No -- Wave 0 |
| BRAND-02 | internal directory names preserved | unit | `bun test tests/branding.test.js` | No -- Wave 0 |
| BRAND-03 | code paths/keys/markers not branded | unit | `bun test tests/branding.test.js` | No -- Wave 0 |
| BRAND-04 | word-boundary matching prevents corruption | unit | `bun test tests/branding.test.js` | No -- Wave 0 |
| BRAND-05 | LICENSE preserved, CREDITS.md added | unit | `bun test tests/compose.test.js` | No -- Wave 0 |
| BRAND-06 | branding.json validated against schema | unit | `bun test tests/branding.test.js` | No -- Wave 0 |

### Sampling Rate

- **Per task commit:** `bun test tests/compose.test.js tests/branding.test.js`
- **Per wave merge:** `bun test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/compose.test.js` -- covers COMP-01 through COMP-10
- [ ] `tests/branding.test.js` -- covers BRAND-01 through BRAND-06
- [ ] `overlay/branding.json` -- branding substitution rules (required by compose.js)
- [ ] `overlay/features.json` -- feature flag scaffold (required by compose.js)
- [ ] `overrides/.gitkeep` -- empty overrides dir marker
- [ ] `dist/` entry in `.gitignore` -- must exist before first compose run
- [ ] `scripts/compose.js` -- the implementation (written after tests)

---

## Sources

### Primary (HIGH confidence)

- Phase 29 prototype tests (tests/prototype-installer.test.js) -- branding scope, path conventions, test isolation patterns verified by working code
- Design spec (docs/superpowers/specs/2026-03-28-overlay-architecture-design.md) -- full architecture including pipeline stages, branding system, .install-meta.json schema
- REQUIREMENTS.md (.planning/REQUIREMENTS.md) -- COMP-01 through BRAND-06 requirement text
- Upstream package (node_modules/get-shit-done-cc@1.30.0) -- 225 files directly inspected, 11 branding-target files identified, 29 code-path occurrences of bare 'get-shit-done' confirmed in install.js
- CONTEXT.md (30-CONTEXT.md) -- locked decisions on output format, dry-run/diff behavior, validation strictness

### Secondary (MEDIUM confidence)

- scripts/build.js -- esbuild pipeline pattern, established script conventions for this project
- scripts/check-parity.js -- output formatting conventions (colors, PASS/FAIL format)
- tests/prototype-installer.test.js -- applyBranding() implementation validated working in Phase 29

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All tools are Node.js built-ins + existing project deps. No new packages needed.
- Architecture: HIGH -- Pipeline design derived directly from design spec + Phase 29 proven prototype patterns.
- Pitfalls: HIGH -- Branding pitfalls derived from direct inspection of 225 upstream files and working prototype code. Windows path separator issue documented in shared/pitfalls.md.

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (upstream v1.30.0 pinned; structure stable until deliberate update)

---

## Key Findings Summary

- **225 upstream files** in node_modules/get-shit-done-cc/. Only **11 files** contain branding targets (`get-shit-done-cc`, `TACHES/TÂCHES`, `glittercowboy`). The remaining 214 files pass through BRAND stage untouched.
- **`get-shit-done` (bare, no -cc)** appears **29 times** in install.js as path identifiers. These MUST NOT be replaced. The branding.json's three rules use `get-shit-done-cc` specifically -- this is safe by design.
- **`overlay/` does not exist yet.** Phase 30 creates it as a scaffold. The compose.js must handle an empty overlay/ gracefully (zero overlay files, zero collisions).
- **`dist/` is not in .gitignore yet.** This must be the first task in Phase 30 before any compose runs.
- **update.md npm view line** (`npm view get-shit-done-cc version`) should NOT be branded -- it intentionally queries the upstream package name, not the fork.
- **TDD order:** tests/compose.test.js and tests/branding.test.js written RED before scripts/compose.js implementation.
- **Test timeout:** Use `{ timeout: 30000 }` on integration tests that run full composition (follows prototype-installer.test.js pattern).
- **No new npm packages needed.** Node.js built-ins + AJV (existing dep) cover all requirements.
