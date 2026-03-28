# Phase 31: Feature Flags & Override System - Research

**Researched:** 2026-03-28
**Domain:** Composition pipeline -- feature flag filtering and override replacement
**Confidence:** HIGH

## Summary

Phase 31 implements the two pass-through stubs from Phase 30: `filter()` and `override()` in `scripts/compose.js`. It also creates `scripts/check-overrides.js` as a standalone staleness detection script. The features.json schema is validated via AJV (already a project dependency at ^8.17.1) following the identical pattern established for branding.json in Phase 30.

The implementation domain is narrow and well-defined. All integration points are already scaffolded: filter() and override() exist as stub functions with correct signatures, the pipeline state object carries `features` and `meta` properties, merge() already has a `features_disabled: []` stub in `.install-meta.json`, and `overlay/features.json` exists with the complete schema shape. No new dependencies are needed. No external APIs. No UI work.

**Primary recommendation:** Implement in 3 plans: (1) features.json schema validation + filter() implementation, (2) override() implementation + REASON.md enforcement, (3) check-overrides.js standalone staleness detection script. TDD throughout -- tests first for each behavior.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Exclude entries use **basename only** (without extension): "upstream-sync" matches workflows/upstream-sync.md
- Each category (workflows, commands, agents, hooks) has its own exclude list -- entries only match within their category
- SDK exclusion is **all-or-nothing**: `sdk: true` includes entire sdk/ directory, `sdk: false` excludes it. No per-file granularity.
- Runtimes section is **ignored entirely** by filter() in v3.0 -- pure documentation, no validation, no warnings, no processing
- Exclude entry that matches no upstream file: **warning** (not error). Same pattern as branding zero-match. Compose succeeds.
- check-overrides.js is a **standalone script** -- separate from compose. CI runs both independently. Developer can compose without being blocked by stale overrides during active work.
- Staleness detection uses **content hash** (SHA-256) stored in REASON.md. Compares hash of current upstream file against recorded hash. No git dependency. Only triggers when the specific overridden file changed, not on any upstream version bump.
- Output: **actionable report** -- names each stale override, shows version mismatch (recorded vs current), suggests actions (review/update/remove). Summary line with counts. Exit 1 if any stale or missing REASON.md.
- **Companion file** next to override: `overrides/lib/config.cjs.REASON.md` paired with `overrides/lib/config.cjs`
- REASON.md includes: Why, Upstream snapshot (version + SHA-256 hash), What's different, Review trigger
- Missing REASON.md: **error with template hint** -- shows exact content to paste, but does NOT auto-create. Developer must write the "Why" section.
- features.json validated via **AJV schema** (consistent with branding.json pattern)
- Schema: runtimes (object, boolean values), workflows/commands/agents/hooks (each with enabled enum + exclude string array), sdk boolean, additionalProperties: false
- Validation runs in resolve() stage before filter() processes exclude lists

### Claude's Discretion
- How filter() maps basename entries to upstream file paths (directory prefix per category)
- How override() discovers and applies replacement files
- check-overrides.js internal structure and hash computation
- Test organization for the new functionality

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FEAT-01 | features.json controls file-level inclusion of workflows, commands, agents, hooks, SDK directory | filter() implementation with category-to-directory mapping; basename matching against exclude arrays |
| FEAT-02 | New upstream files not in any exclude list are included by default (opt-out model) | filter() only removes files that ARE in exclude lists; unmentioned files pass through unchanged |
| FEAT-03 | Runtime flags exist in features.json for documentation but do NOT filter code in v3.0 | filter() ignores runtimes section entirely; schema validates structure but filter() skips processing |
| FEAT-04 | features.json validated against schema before use | AJV schema definition + validateFeaturesConfig() in resolve(), identical pattern to BRANDING_SCHEMA |
| OVER-01 | Files in overrides/ replace corresponding upstream files during composition | override() scans overrides/ dir, matches relPaths to manifest entries, swaps sourcePath |
| OVER-02 | Every override requires a companion REASON.md; CI fails without it | override() checks for REASON.md companion and errors if missing; check-overrides.js also validates |
| OVER-03 | check-overrides.js detects stale overrides when upstream version changes the underlying file | SHA-256 content hash comparison between recorded hash in REASON.md and current upstream file |
| OVER-04 | Zero overrides on day one; config and validation enhancements are wrappers in overlay/ | Verified: overrides/ contains only .gitkeep; no overrides to create in this phase |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js crypto | built-in | SHA-256 hash computation for staleness detection | Zero dependencies; `crypto.createHash('sha256')` is the standard Node.js approach |
| AJV | ^8.17.1 | JSON schema validation for features.json | Already in project; same pattern as branding.json validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs | built-in | File system operations (walkDir, readFileSync) | Override discovery, file reading |
| path | built-in | Path manipulation (basename, join, dirname) | Category-to-directory mapping, override path resolution |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| crypto.createHash | xxhash/murmurhash | Faster but adds dependency; SHA-256 is fine for <300 files |
| AJV | Manual validation | AJV already in project; manual is error-prone for nested schemas |

**Installation:**
```bash
# No new dependencies needed -- AJV and crypto are already available
```

## Architecture Patterns

### Current Pipeline State Shape

The pipeline state object (returned by each stage) has this shape established in Phase 30:

```javascript
{
  manifest: [
    {
      relPath: 'agents/gsd-executor.md',     // forward-slash relative path
      sourcePath: '/abs/path/to/file',         // absolute source on disk
      content: null,                           // null = copy verbatim
      brandedContent: null,                    // populated by brand()
      action: 'copy',                          // 'copy' | 'override' | 'exclude'
      stage: 'resolve',                        // last stage that modified this entry
    }
  ],
  branding: { /* branding.json contents */ },
  features: { /* features.json contents */ },
  warnings: [],
  meta: {
    upstreamVersion: '1.30.0',
    overlayVersion: '3.0.0',
    upstreamDir: '/abs/path',
    overlayDir: '/abs/path',
    brandingRulesApplied: 0,
    // Phase 31 additions:
    featuresDisabled: [],  // array of "category/basename" strings
    overridesApplied: [],  // array of relPath strings
  },
}
```

### Category-to-Directory Mapping (filter())

Each features.json category maps to a specific upstream directory prefix:

```javascript
const CATEGORY_DIR_MAP = {
  workflows: 'get-shit-done/workflows/',
  commands:  'commands/gsd/',
  agents:    'agents/',
  hooks:     'hooks/dist/',
};
```

For a given exclude entry (basename without extension), filter() matches against manifest entries where:
1. `entry.relPath` starts with the category's directory prefix
2. `path.basename(entry.relPath, path.extname(entry.relPath))` equals the exclude entry

SDK filtering is different: when `features.sdk === false`, exclude ALL entries where `relPath` starts with `sdk/` (currently no sdk/ in upstream v1.30.0, but the logic must handle it for forward compatibility).

### Override Discovery Pattern (override())

```javascript
// overrides/ directory mirrors upstream relPath structure
// overrides/lib/config.cjs  -> replaces upstream lib/config.cjs
// overrides/bin/install.js  -> replaces upstream bin/install.js

function override(state) {
  const overridesDir = path.join(state.meta.overlayDir, '..', 'overrides');
  const overrideFiles = walkDir(overridesDir, '');

  // Build lookup: relPath -> override sourcePath
  // Skip .gitkeep and *.REASON.md files
  const overrideMap = new Map();
  for (const f of overrideFiles) {
    const normalised = f.replace(/\\/g, '/');
    if (normalised === '.gitkeep') continue;
    if (normalised.endsWith('.REASON.md')) continue;
    overrideMap.set(normalised, path.join(overridesDir, f));
  }

  // For each override, verify REASON.md companion exists
  // Then swap sourcePath in manifest entry
}
```

### check-overrides.js Output Format

```
Override staleness report
=========================

overrides/lib/config.cjs
  Status:          STALE
  Recorded hash:   abc123...
  Current hash:    def456...
  Recorded version: v1.30.0
  Current version:  v1.32.0
  Action:          Review upstream changes, update or remove override

overrides/bin/helper.js
  Status:          MISSING REASON.md
  Expected:        overrides/bin/helper.js.REASON.md
  Action:          Create REASON.md (template below)

Summary: 2 overrides checked, 1 stale, 1 missing REASON.md
```

### REASON.md Template (for error hint)

```markdown
# Override: {relPath}

## Why
[Explain why the upstream file needs replacement]

## Upstream snapshot
- Version: {upstream_version}
- SHA-256: {hash}

## What's different
- [Bullet list of changes from upstream]

## Review trigger
When upstream {relPath} changes, review whether the override is still needed.
```

### Recommended Project Structure Changes

```
scripts/
  compose.js        # Existing -- filter() and override() stubs replaced
  check-overrides.js # NEW -- standalone staleness detection
tests/
  compose.test.js   # Existing -- new test blocks for filter() and override()
  check-overrides.test.js # NEW -- tests for staleness detection
```

### Anti-Patterns to Avoid
- **Coupling check-overrides.js to compose.js pipeline state:** check-overrides.js must read files independently. It should NOT import pipeline state or depend on compose() having been run.
- **Mutating input state in filter()/override():** Both functions must return NEW state objects (established pattern in Phase 30 stubs).
- **Using git for staleness detection:** CONTEXT.md explicitly says content hash, not git. No `git log` or `git diff` in check-overrides.js.
- **Regex-based REASON.md parsing:** Use simple line-by-line extraction for the SHA-256 hash. Look for the known field pattern, not complex regex.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema validation | Manual property-by-property checks | AJV with FEATURES_SCHEMA constant | AJV already used for branding.json; consistency matters |
| SHA-256 hashing | Custom hash or external tool | `crypto.createHash('sha256').update(content).digest('hex')` | Built-in Node.js, zero deps, standard approach |
| Directory walking | Custom recursive readdir | Existing `walkDir()` in compose.js | Already implemented and tested in Phase 30 |

**Key insight:** Phase 30 established patterns for schema validation (AJV), file walking (walkDir), state immutability, and pipeline stage signatures. Phase 31 follows these patterns exactly -- no new patterns needed.

## Common Pitfalls

### Pitfall 1: Basename matching with nested directory structures
**What goes wrong:** An exclude entry like "help" could match `commands/gsd/help.md` and `get-shit-done/workflows/help.md` if categories aren't checked independently.
**Why it happens:** Both workflows and commands have a `help.md` file.
**How to avoid:** Each exclude entry ONLY matches within its own category's directory prefix. The exclude "help" in `workflows.exclude` matches `get-shit-done/workflows/help.md` but NOT `commands/gsd/help.md`.
**Warning signs:** Tests that exclude a name in one category and see it disappear from another category.

### Pitfall 2: Override relPath alignment
**What goes wrong:** Override at `overrides/hooks/dist/gsd-statusline.js` must match manifest entry `hooks/dist/gsd-statusline.js`. If the overrides directory walk includes the `overrides/` prefix in relPaths, matching fails.
**Why it happens:** walkDir is called with the overrides/ directory as root, so relPaths already exclude the prefix. But if called incorrectly, the prefix leaks in.
**How to avoid:** Call `walkDir(overridesDir, '')` -- the same pattern used for upstream and overlay directory walks in resolve().
**Warning signs:** override() finds no matches despite files existing in overrides/.

### Pitfall 3: REASON.md companion naming convention
**What goes wrong:** The companion file is `overrides/lib/config.cjs.REASON.md` (file extension included before .REASON.md), not `overrides/lib/config.REASON.md`.
**Why it happens:** Easy to forget that the full filename (with extension) is preserved.
**How to avoid:** `companionPath = overridePath + '.REASON.md'` -- append to the full path, not to the basename without extension.
**Warning signs:** REASON.md exists but check reports it as missing.

### Pitfall 4: features_disabled propagation to merge()
**What goes wrong:** merge() writes `.install-meta.json` with `features_disabled: []` because the filter stage didn't propagate disabled entries through `state.meta`.
**Why it happens:** The Phase 30 stub doesn't pass disabled info. Phase 31 must add `featuresDisabled` to `state.meta` in filter() and read it in merge().
**How to avoid:** filter() populates `state.meta.featuresDisabled` with an array of descriptive strings (e.g., `["workflows/forensics", "sdk"]`). merge() reads `state.meta.featuresDisabled` instead of hardcoded `[]`.
**Warning signs:** Successful filtering but `.install-meta.json` always shows empty features_disabled array.

### Pitfall 5: Windows path separators in override matching
**What goes wrong:** `walkDir` returns forward-slash paths, but `path.join()` on Windows returns backslashes. If override paths use backslashes and manifest paths use forward slashes, Map lookups fail.
**Why it happens:** Phase 30's walkDir normalizes to forward slashes, but any path.join() in new code may reintroduce backslashes.
**How to avoid:** Always normalize with `.replace(/\\/g, '/')` after any `path.join()` that produces a relPath used for matching.
**Warning signs:** Tests pass on Linux/macOS but overrides don't match on Windows.

### Pitfall 6: SHA-256 hash read from REASON.md
**What goes wrong:** Hash extraction from REASON.md fails because the format isn't exactly as expected (extra whitespace, different field label).
**Why it happens:** REASON.md is human-written markdown. Parsing must be tolerant.
**How to avoid:** Use a simple regex like `/^- SHA-256:\s*([a-f0-9]{64})\s*$/m` to extract the hash. Validate the extracted value is exactly 64 hex characters. If extraction fails, report as "unable to determine recorded hash" rather than crashing.
**Warning signs:** Stale check always reports "missing hash" even when REASON.md has the hash.

## Code Examples

### features.json AJV Schema

```javascript
// Source: follows BRANDING_SCHEMA pattern in scripts/compose.js lines 51-72
const FEATURES_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    runtimes: {
      type: 'object',
      additionalProperties: { type: 'boolean' },
    },
    workflows: {
      type: 'object',
      required: ['enabled', 'exclude'],
      additionalProperties: false,
      properties: {
        enabled: { type: 'string', enum: ['all'] },
        exclude: { type: 'array', items: { type: 'string' } },
      },
    },
    commands: {
      type: 'object',
      required: ['enabled', 'exclude'],
      additionalProperties: false,
      properties: {
        enabled: { type: 'string', enum: ['all'] },
        exclude: { type: 'array', items: { type: 'string' } },
      },
    },
    agents: {
      type: 'object',
      required: ['enabled', 'exclude'],
      additionalProperties: false,
      properties: {
        enabled: { type: 'string', enum: ['all'] },
        exclude: { type: 'array', items: { type: 'string' } },
      },
    },
    hooks: {
      type: 'object',
      required: ['enabled', 'exclude'],
      additionalProperties: false,
      properties: {
        enabled: { type: 'string', enum: ['all'] },
        exclude: { type: 'array', items: { type: 'string' } },
      },
    },
    sdk: { type: 'boolean' },
  },
};
```

### filter() Implementation Pattern

```javascript
// Source: compose.js existing stub + CONTEXT.md decisions
const CATEGORY_DIR_MAP = {
  workflows: 'get-shit-done/workflows/',
  commands:  'commands/gsd/',
  agents:    'agents/',
  hooks:     'hooks/dist/',
};

function filter(state) {
  const { features } = state;
  const excludeSet = new Set();
  const featuresDisabled = [];

  // Build exclusion set from each category
  for (const [category, dirPrefix] of Object.entries(CATEGORY_DIR_MAP)) {
    const categoryConfig = features[category];
    if (!categoryConfig || !Array.isArray(categoryConfig.exclude)) continue;

    for (const baseName of categoryConfig.exclude) {
      excludeSet.add(`${dirPrefix}${baseName}`);  // stored without extension for matching
      featuresDisabled.push(`${category}/${baseName}`);
    }
  }

  // SDK all-or-nothing
  const sdkExcluded = features.sdk === false;
  if (sdkExcluded) {
    featuresDisabled.push('sdk');
  }

  const warnings = [...state.warnings];
  const matchedExcludes = new Set();

  const manifest = state.manifest.filter(entry => {
    // SDK exclusion: drop everything under sdk/
    if (sdkExcluded && entry.relPath.startsWith('sdk/')) {
      return false;
    }

    // Category exclusion: basename match within category prefix
    for (const [category, dirPrefix] of Object.entries(CATEGORY_DIR_MAP)) {
      if (!entry.relPath.startsWith(dirPrefix)) continue;
      const ext = path.extname(entry.relPath);
      const baseName = path.basename(entry.relPath, ext);
      const key = `${dirPrefix}${baseName}`;
      if (excludeSet.has(key)) {
        matchedExcludes.add(key);
        return false;
      }
    }

    return true;
  });

  // Warn on unmatched excludes
  for (const key of excludeSet) {
    if (!matchedExcludes.has(key)) {
      warnings.push(`Feature exclude "${key}" matched no upstream file`);
    }
  }

  return {
    ...state,
    manifest,
    warnings,
    meta: { ...state.meta, featuresDisabled },
  };
}
```

### SHA-256 Hash Computation

```javascript
// Source: Node.js built-in crypto module
const crypto = require('crypto');

function hashFileContent(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}
```

### REASON.md Hash Extraction

```javascript
function extractHashFromReason(reasonPath) {
  const content = fs.readFileSync(reasonPath, 'utf-8');
  const match = content.match(/^- SHA-256:\s*([a-f0-9]{64})\s*$/m);
  return match ? match[1] : null;
}

function extractVersionFromReason(reasonPath) {
  const content = fs.readFileSync(reasonPath, 'utf-8');
  const match = content.match(/^- Version:\s*(.+?)\s*$/m);
  return match ? match[1].trim() : null;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| filter() pass-through | filter() with category exclusion | Phase 31 (now) | Excluded files removed from manifest before brand/merge |
| override() pass-through | override() with file replacement | Phase 31 (now) | Override files swap into manifest, REASON.md enforced |
| No staleness detection | check-overrides.js with SHA-256 | Phase 31 (now) | CI catches stale overrides after upstream updates |

**Key architectural note:** The `features_disabled` field in `.install-meta.json` was already allocated (as empty array) in Phase 30's merge(). Phase 31 populates it.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | bun:test (built-in) |
| Config file | none (bun test runs automatically) |
| Quick run command | `bun test tests/compose.test.js` |
| Full suite command | `bun test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FEAT-01 | filter() excludes files by category/name | unit | `bun test tests/compose.test.js` | Yes (extends existing) |
| FEAT-02 | Unmentioned files pass through filter() | unit | `bun test tests/compose.test.js` | Yes (extends existing) |
| FEAT-03 | Runtimes section ignored by filter() | unit | `bun test tests/compose.test.js` | Yes (extends existing) |
| FEAT-04 | features.json validated by AJV schema | unit | `bun test tests/compose.test.js` | Yes (extends existing) |
| OVER-01 | override() replaces upstream files | unit | `bun test tests/compose.test.js` | Yes (extends existing) |
| OVER-02 | Missing REASON.md causes error | unit | `bun test tests/compose.test.js` | Yes (extends existing) |
| OVER-03 | check-overrides.js detects stale overrides | unit | `bun test tests/check-overrides.test.js` | No -- Wave 0 |
| OVER-04 | Zero overrides on day one | smoke | manual verification of overrides/ dir | N/A |

### Sampling Rate
- **Per task commit:** `bun test tests/compose.test.js tests/check-overrides.test.js`
- **Per wave merge:** `bun test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/check-overrides.test.js` -- covers OVER-03 (check-overrides.js staleness detection)
- No framework install needed (bun:test is built-in)
- No conftest/fixtures needed beyond the existing `createMockUpstream()`/`createMockOverlay()` helpers in compose.test.js

## Open Questions

1. **SDK directory location in future upstream versions**
   - What we know: v1.30.0 has no `sdk/` directory. features.json has `"sdk": true`.
   - What's unclear: When upstream adds sdk/, where will it be? Top-level `sdk/` or nested?
   - Recommendation: Implement filter for top-level `sdk/` prefix. If upstream nests it differently, the filter will be a no-op (harmless). The important thing is the schema validates the boolean.

2. **Hook file extensions**
   - What we know: Upstream hooks in `hooks/dist/` are all `.js` files. The exclude uses basename without extension.
   - What's unclear: Whether upstream could add hooks with different extensions (`.cjs`, `.mjs`).
   - Recommendation: The basename-without-extension matching handles this naturally. "gsd-statusline" matches `gsd-statusline.js`, `gsd-statusline.cjs`, etc.

## Sources

### Primary (HIGH confidence)
- **scripts/compose.js** -- Current pipeline implementation with stub signatures, BRANDING_SCHEMA pattern, walkDir helper
- **overlay/features.json** -- Current feature flags file shape
- **31-CONTEXT.md** -- User decisions on implementation approach
- **REQUIREMENTS.md** -- Requirement IDs FEAT-01..04, OVER-01..04
- **Overlay Architecture Design spec** -- Full pipeline stage descriptions and override rules

### Secondary (MEDIUM confidence)
- **Upstream package inspection** (node_modules/get-shit-done-cc/) -- Directory structure verified: 56 workflows, 57 commands, 18 agents, 5 hooks, no sdk/

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- AJV already in project, crypto is built-in, zero new dependencies
- Architecture: HIGH -- Pipeline pattern fully established in Phase 30; filter() and override() are slot-in replacements for existing stubs
- Pitfalls: HIGH -- Category mapping verified against actual upstream directory structure; path separator issues documented from Phase 30 experience

**Research date:** 2026-03-28
**Valid until:** Stable -- upstream v1.30.0 directory structure unlikely to change without version bump
