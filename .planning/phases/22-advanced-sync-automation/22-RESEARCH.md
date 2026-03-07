# Phase 22: Advanced Sync Automation - Research

**Researched:** 2026-03-07
**Domain:** Selective git cherry-pick orchestration, commit dependency analysis, AI-assisted conflict resolution
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Commit categorization:**
- Auto-detect categories from conventional commit prefixes (feat:, fix:, refactor:, docs:, chore:, test:, perf:)
- Use raw conventional commit types as categories -- no broader bucketing
- Non-conventional commits classified by AI (Claude reads the diff and infers category) -- free in Claude Code context
- Cache categorization results in sync manifest (sync-manifest.json or similar) so re-running preview reuses cached classifications

**Selection interface:**
- Category flags on existing /gsd:upstream sync workflow -- not a new subcommand
- Flags: --category feat,fix to include, --exclude refactor to exclude
- Individual commit SHA support: --include abc123 / --exclude def456 for fine-grained control alongside category filtering
- Enhanced sync-preview output shows category grouping and selection indicators before applying

**Dependency tracking:**
- AI analysis for semantic dependency detection -- Claude reads diffs and determines dependencies between commits (catches logic dependencies across files, not just file-overlap)
- Explicit cross-module warnings: when a selected commit in one module (e.g., sync.cjs) depends on an excluded commit in another module (e.g., state.cjs), show a distinct warning highlighting the cross-module boundary
- Dependency info always shown in sync-preview output -- user sees the full picture before committing
- When a dependency is detected: auto-include the required commit with a warning, overridable with --force

**Conflict resolution UX:**
- Inline terminal explanation when cherry-pick conflicts occur
- Context + suggestion format: explain what upstream changed, what fork has, why they conflict, and suggest a resolution preserving fork identity -- concise but complete
- User interaction: accept (apply suggestion as-is), reject (skip this commit), or edit (manual resolution)
- Fork identity preservation rule: fork branding (get-stuff-done vs get-shit-done), custom features, and fork config always win over upstream. Upstream logic/behavior changes are accepted.

### Claude's Discretion

- Exact format of dependency graph visualization in preview
- How to handle circular dependencies (if they exist)
- Conflict resolution file staging mechanics
- Error recovery when AI classification or dependency analysis fails

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SYNC-09 | Selective sync -- allow cherry-picking specific categories or individual commits instead of all-or-nothing, with dependency tracking between related commits | Category filtering via --category/--exclude flags on upstream workflow; dependency analysis via Claude reading diffs; cross-module warnings; enhanced sync-preview with grouping |
| SYNC-10 | AI-assisted conflict resolution -- when cherry-pick conflicts arise, use Claude to analyze both sides, suggest resolutions that preserve fork identity, and explain the conflict context | Inline conflict analysis replacing manual conflict checkpoint; fork identity preservation via branding-map.json; accept/reject/edit interaction model |
</phase_requirements>

## Summary

Phase 22 adds two capabilities to the upstream sync workflow: selective cherry-picking by category (SYNC-09) and AI-assisted conflict resolution (SYNC-10). Both features build on the existing `sync.cjs` module and `upstream-sync.md` workflow from Phases 20-21.

For selective sync (SYNC-09), the infrastructure already exists: `classifyCommit()` in `sync.cjs` categorizes every commit by conventional prefix (feat, fix, docs, chore, refactor, security, breaking, other). The `cmdSyncPreview --json` output already includes per-commit `classification.type` and `summary.byType` counts. What's missing is: (1) filtering logic that takes `--category`/`--exclude`/`--include`/`--exclude` flags and produces a filtered commit list, (2) dependency analysis between commits to warn when skipping a commit would break a downstream one, and (3) enhanced sync-preview output with category grouping and selection indicators. The dependency analysis is the hardest part -- it requires Claude to read diffs of all commits and determine semantic relationships, which is computationally free in Claude Code context but architecturally new (the plumbing module has been purely deterministic until now).

For AI-assisted conflict resolution (SYNC-10), the current workflow pauses at a CONFLICT_DETECTED checkpoint and tells the user to resolve manually. Phase 22 replaces this with Claude analyzing the conflict: reading both sides (`git show` for upstream commit, current file content for fork), understanding the context, and suggesting a resolution that preserves fork identity. The branding-map.json already defines which strings are fork-specific. The key design decision is the interaction model: accept (apply AI suggestion), reject (skip commit), or edit (manual resolution). This replaces the current manual-only conflict handling.

**Primary recommendation:** Implement Phase 22 in 3 plans: (1) selective sync filtering in `sync.cjs` + enhanced preview output, (2) commit dependency analysis using Claude + cross-module warnings, (3) AI-assisted conflict resolution in `upstream-sync.md`. Plan 1 is pure deterministic logic (filtering + grouping). Plan 2 introduces AI analysis for dependencies (new pattern for this module). Plan 3 modifies the conflict handling flow in the workflow. This sequencing lets selective sync work standalone before adding the more complex dependency and conflict features.

## Standard Stack

### Core

| Component | Location | Purpose | Why Standard |
|-----------|----------|---------|--------------|
| `sync.cjs` | `get-stuff-done/bin/lib/sync.cjs` | All sync plumbing -- filtering, dependency, conflict helpers | Phase 20 established module; Phase 21 extended it |
| `gsd-tools.cjs` | `get-stuff-done/bin/gsd-tools.cjs` | CLI router -- extends sync-preview with new flags | Existing router pattern for sync commands |
| `upstream-sync.md` | `get-stuff-done/workflows/upstream-sync.md` | Workflow orchestration -- enhanced Stage 2/3/4 | Porcelain layer for UX, plumbing calls sync.cjs |
| `upstream.md` | `commands/gsd/upstream.md` | Command entry point -- passes new flags to workflow | Existing command; extended with --category, --exclude flags |
| `branding-map.json` | `.planning/sync/branding-map.json` | Fork identity patterns for conflict resolution | Already defines all upstream-to-fork string mappings |
| `sync-manifest.json` | `.planning/sync/sync-manifest.json` | Cached categorization and sync history | Already stores applied/skipped commits with metadata |

### Supporting

| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| `spawnGit()` | sync.cjs local | Git commands with special chars | All git operations (established Windows safety pattern) |
| `classifyCommit()` | sync.cjs | Commit categorization | Phase 21 function -- reused for category filtering |
| `getCommitsInRange()` | sync.cjs | Fetch commits in a range | Reused for filtered commit list generation |
| `getFilesForCommit()` | sync.cjs | Files changed per commit | Used for file-overlap dependency detection |
| `loadProtectedPaths()` | sync.cjs | Fork-sensitive path list | Used by conflict resolver to detect branding conflicts |
| `node:test` + `assert` | stdlib | Unit testing | All tests in tests/sync.test.cjs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| AI dependency analysis | File-overlap-only heuristic | File overlap catches mechanical deps but misses semantic ones (function A calls function B, both in different commits). CONTEXT.md explicitly chose AI analysis for this reason. |
| Inline conflict explanation | External diff tool (meld, vimdiff) | External tools require installation and break Claude Code workflow. Inline analysis keeps everything in the terminal session. |
| Caching AI classifications in sync-manifest | Re-classifying on every preview | AI classification (for non-conventional commits) calls Claude; caching avoids redundant analysis on re-runs. CONTEXT.md explicitly requires caching. |

**Installation:** No new npm packages required. All functionality uses Node.js stdlib + existing sync.cjs primitives + Claude's built-in reasoning (in-session, zero API cost).

## Architecture Patterns

### Recommended Project Structure

Phase 22 changes touch existing files only. No new modules created:

```
get-stuff-done/bin/lib/
  sync.cjs                    # Extended: filtering, dependency analysis helpers, conflict helpers

get-stuff-done/bin/
  gsd-tools.cjs               # Extended: sync-preview --category/--exclude flags

get-stuff-done/workflows/
  upstream-sync.md             # Extended: enhanced Stage 2 (category preview), Stage 3 (filtering), Stage 4 (AI conflict resolution)

commands/gsd/
  upstream.md                  # Extended: --category, --exclude, --include flags in argument-hint

tests/
  sync.test.cjs               # Extended: tests for filtering, dependency, conflict helpers
```

### Pattern 1: Category Filtering in sync.cjs (Pure Function)

**What:** A new `filterCommitsByCategory()` function takes enriched commits (already classified by `classifyCommit()`) and filter options, returns a filtered subset.

**When to use:** Whenever the user passes --category or --exclude flags to /gsd:upstream.

**Example:**
```javascript
// Source: extension of existing cmdSyncPreview pattern in sync.cjs
/**
 * Filter enriched commits by category inclusion/exclusion and individual SHA include/exclude.
 *
 * Precedence: individual --include/--exclude override category filters.
 * If --category provided, only those types are included.
 * If --exclude provided, those types are removed from the set.
 * Both can combine: --category feat,fix --exclude feat gives only fix.
 *
 * @param {Array<{hash, hashShort, classification: {type}}>} commits - Enriched commits
 * @param {{categories?: string[], excludeCategories?: string[], includeShas?: string[], excludeShas?: string[]}} filters
 * @returns {{selected: Array, excluded: Array}}
 */
function filterCommitsByCategory(commits, filters) {
  const { categories, excludeCategories, includeShas, excludeShas } = filters;

  // Build SHA override sets
  const forceInclude = new Set((includeShas || []).map(s => s.toLowerCase()));
  const forceExclude = new Set((excludeShas || []).map(s => s.toLowerCase()));

  const selected = [];
  const excluded = [];

  for (const commit of commits) {
    const sha = commit.hashShort.toLowerCase();
    const fullSha = commit.hash.toLowerCase();
    const type = commit.classification.type;

    // Individual SHA overrides take priority
    if (forceExclude.has(sha) || forceExclude.has(fullSha)) {
      excluded.push({ ...commit, excludeReason: 'sha-excluded' });
      continue;
    }
    if (forceInclude.has(sha) || forceInclude.has(fullSha)) {
      selected.push(commit);
      continue;
    }

    // Category filtering
    let included = true;
    if (categories && categories.length > 0) {
      included = categories.includes(type);
    }
    if (included && excludeCategories && excludeCategories.length > 0) {
      included = !excludeCategories.includes(type);
    }

    if (included) {
      selected.push(commit);
    } else {
      excluded.push({ ...commit, excludeReason: 'category-filtered' });
    }
  }

  return { selected, excluded };
}
```

### Pattern 2: Dependency Analysis Results Structure

**What:** The dependency analysis produces a structured graph showing which commits depend on which others. This is computed by Claude (reading diffs) in the workflow, not in the plumbing module. The plumbing module provides helpers: file-overlap detection (deterministic) and a dependency result format that the workflow populates with AI analysis.

**When to use:** After filtering commits, before applying cherry-picks.

**Dependency data schema:**
```javascript
// Dependency analysis result structure
{
  dependencies: [
    {
      commit: 'abc1234',           // this commit...
      dependsOn: 'def5678',        // ...depends on this commit
      reason: 'abc1234 calls newHelper() which is defined in def5678',
      type: 'semantic',            // 'semantic' (AI-detected) or 'file-overlap'
      crossModule: true,           // true if commits touch different bin/lib/*.cjs files
      modules: {
        source: 'sync.cjs',       // module that defines the dependency
        dependent: 'commands.cjs'   // module that uses it
      }
    }
  ],
  warnings: [
    {
      type: 'missing-dependency',  // selected commit depends on excluded commit
      commit: 'abc1234',
      missingDep: 'def5678',
      reason: 'abc1234 uses function from def5678 which is excluded',
      autoIncluded: true,          // was the dependency auto-included?
      crossModule: true
    }
  ]
}
```

### Pattern 3: Cross-Module Detection (Deterministic Helper)

**What:** Detects which `bin/lib/*.cjs` module a commit touches. Used to flag cross-module dependencies.

**Example:**
```javascript
/**
 * Detect which bin/lib/*.cjs modules a commit touches.
 *
 * @param {Array<{path: string}>} files - Files changed in commit
 * @returns {string[]} Module names (e.g., ['sync', 'state', 'core'])
 */
function detectModules(files) {
  const modules = new Set();
  for (const f of files) {
    // Match get-stuff-done/bin/lib/*.cjs or bin/lib/*.cjs
    const match = f.path.match(/(?:get-stuff-done\/)?bin\/lib\/([^/]+)\.cjs$/);
    if (match) {
      modules.add(match[1]);
    }
  }
  return [...modules];
}

/**
 * Check if two commits cross a module boundary.
 *
 * @param {string[]} modulesA - Modules touched by commit A
 * @param {string[]} modulesB - Modules touched by commit B
 * @returns {boolean}
 */
function isCrossModule(modulesA, modulesB) {
  const setA = new Set(modulesA);
  return modulesB.some(m => !setA.has(m)) || modulesA.some(m => !new Set(modulesB).has(m));
}
```

### Pattern 4: File-Overlap Dependency Detection (Deterministic)

**What:** Two commits that touch the same file have a file-overlap dependency. This is the fast deterministic check that runs before AI analysis.

**Example:**
```javascript
/**
 * Detect file-overlap dependencies between commits.
 * If commit B modifies a file also modified by earlier commit A,
 * B may depend on A.
 *
 * @param {Array<{hash, hashShort, files: Array<{path}>}>} commits - Chronological order
 * @returns {Array<{commit, dependsOn, reason, type: 'file-overlap', files: string[]}>}
 */
function detectFileOverlapDeps(commits) {
  const deps = [];
  // Map: filePath -> earliest commit that touches it
  const fileToCommit = new Map();

  for (const commit of commits) {
    for (const file of commit.files) {
      if (fileToCommit.has(file.path)) {
        const earlier = fileToCommit.get(file.path);
        if (earlier.hash !== commit.hash) {
          deps.push({
            commit: commit.hashShort,
            dependsOn: earlier.hashShort,
            reason: `Both modify ${file.path}`,
            type: 'file-overlap',
            files: [file.path],
          });
        }
      } else {
        fileToCommit.set(file.path, commit);
      }
    }
  }
  return deps;
}
```

### Pattern 5: AI Conflict Resolution Flow (Workflow-Level)

**What:** When `git cherry-pick -x {sha}` exits with status 1 (conflict), the workflow reads both sides and presents Claude's analysis to the user. This replaces the current manual CONFLICT_DETECTED checkpoint.

**Flow:**
```
1. git cherry-pick -x {sha}  --> exit code 1
2. git status --short         --> identify conflicted files (UU/AA/DD)
3. For each conflicted file:
   a. Read current file content (fork version with conflict markers)
   b. Read upstream version: git show {sha}:{filepath}
   c. Read fork base version: git show HEAD:{filepath}
   d. Identify fork-identity patterns (from branding-map.json)
   e. Claude analyzes:
      - What upstream changed and why
      - What fork has and why
      - Where they conflict
      - Suggested resolution (preserving fork identity)
4. Present to user:
   - Conflict explanation (concise)
   - Suggested resolved content
   - Options: accept / reject / edit
5. On accept: write suggested content, git add, continue
6. On reject: git cherry-pick --abort, skip this commit
7. On edit: user manually resolves, then tells workflow "resolved"
```

### Pattern 6: Enhanced sync-preview Output (Category Grouping)

**What:** When filters are applied, sync-preview shows commits grouped by category with selection indicators.

**Example output format:**
```
Sync Preview: abc1234..def5678  (12 commits, 8 selected, 4 excluded)

[SELECTED] feat (3 commits)
  abc1234 [feat] add new command support
  bcd2345 [feat] extend CLI parser
  cde3456 [feat] add progress indicator

[SELECTED] fix (5 commits)
  def4567 [fix] resolve race condition
  ...

[EXCLUDED by --exclude refactor] refactor (3 commits)
  ghi7890 [refactor] simplify error handling
  ...

[EXCLUDED by category filter] docs (1 commit)
  jkl0123 [docs] update README

--- Dependencies ---
  bcd2345 depends on abc1234 (file-overlap: bin/lib/commands.cjs)
  WARNING: cde3456 depends on ghi7890 [EXCLUDED] -- auto-including ghi7890
```

### Anti-Patterns to Avoid

- **Putting AI analysis in sync.cjs plumbing:** sync.cjs is deterministic plumbing. AI-based dependency detection and conflict analysis belong in the workflow (`upstream-sync.md`), not in the plumbing module. sync.cjs provides the data; the workflow layer calls Claude.
- **Blocking on dependency detection:** Dependency warnings are informational with auto-include. Never silently skip a commit because of a detected dependency. Always show the warning and let the user override with --force.
- **Running AI classification on every preview:** Cache non-conventional commit classifications in sync-manifest.json. Only call Claude for commits not yet classified.
- **Applying conflict resolution without user consent:** Always present the suggested resolution and wait for explicit accept/reject/edit. Never auto-apply conflict resolutions.
- **Breaking the existing all-or-nothing path:** When no --category/--exclude/--include flags are provided, behavior must be identical to current workflow. Selective sync is additive, not a breaking change.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Commit categorization | New classifier | `classifyCommit()` (Phase 21, already in sync.cjs) | Already classifies by conventional prefix + file heuristics; covers the deterministic path |
| Fork identity string matching | Custom pattern lists | `branding-map.json` + `loadProtectedPaths()` | Complete mapping of upstream-to-fork strings already exists |
| Git conflict file reading | Custom diff parser | `git show {sha}:{path}` for upstream, `cat` for current file | Git's built-in show command gives clean file content per commit |
| Commit range fetching | Custom log parsing | `getCommitsInRange()` (sync.cjs) | Already handles field parsing with ASCII separators, Windows-safe |
| File change detection per commit | Custom diff-tree parsing | `getFilesForCommit()` (sync.cjs) | Already parses name-status output correctly |

**Key insight:** Phase 22 is mostly integration and orchestration. The plumbing primitives (classify, fetch commits, get files, detect sensitive paths) all exist from Phases 20-21. The new work is: filtering logic, dependency graph construction (AI + deterministic), and conflict resolution UX. The plumbing module gets helper functions; the heavy AI work lives in the workflow.

## Common Pitfalls

### Pitfall 1: Category Flags Must Parse Before Workflow Spawning

**What goes wrong:** The /gsd:upstream command spawns upstream-sync.md as a Task. If category flags are parsed inside the workflow subagent, the subagent needs to extract them from unstructured input text, which is fragile.

**Why it happens:** The orchestrator (upstream.md) currently passes `$ARGUMENTS` to the workflow via sync_context. Category flags like `--category feat,fix --exclude refactor` need structured parsing, not string matching.

**How to avoid:** Parse --category, --exclude, --include flags in the orchestrator (upstream.md) before spawning the workflow. Pass them as structured fields in sync_context:
```
sync_context:
  categories: ["feat", "fix"]
  exclude_categories: ["refactor"]
  include_shas: ["abc1234"]
  exclude_shas: ["def5678"]
```
The workflow reads these structured fields, never parses raw flag strings.

**Warning signs:** Workflow failing to detect flags or misinterpreting comma-separated values.

### Pitfall 2: AI Dependency Analysis Can Hallucinate Dependencies

**What goes wrong:** Claude reads diffs and declares dependencies that don't exist (e.g., two commits that both touch `package.json` but for completely unrelated reasons, or a function name match that's coincidental).

**Why it happens:** AI analysis of code relationships is probabilistic. Small diffs with generic variable names trigger false pattern matching.

**How to avoid:** Layer deterministic file-overlap detection under AI analysis. File-overlap deps are always flagged. AI semantic deps are flagged but clearly labeled as AI-inferred with confidence. The user sees both and can override with --force. Also: keep the AI prompt focused -- don't ask "what are all possible relationships?" Ask "does commit B use anything defined or modified by commit A?"

**Warning signs:** Every commit pair being flagged as dependent. Dependency reasons that describe general concepts rather than specific code references.

### Pitfall 3: Conflict Resolution File Content Can Be Corrupted

**What goes wrong:** When the AI suggests a resolution and the user accepts, the workflow writes the suggested content to the conflicted file. If the content contains conflict markers (from the AI's explanation) or is truncated, the file is corrupted.

**Why it happens:** Claude may include `<<<<<<<` markers in its explanation (quoting the conflict) and the write operation includes them.

**How to avoid:** The conflict resolution must produce clean file content (no markers). After writing the suggested resolution, verify: `grep -c '^<<<<<<<' {file}` returns 0. If markers remain, abort the accept and fall back to manual edit. Also: use a structured prompt that asks Claude to produce ONLY the resolved file content, separate from the explanation.

**Warning signs:** Conflict markers appearing in files after "accept" operation. Test verification (Stage 5) catching unresolved markers.

### Pitfall 4: Selective Sync Breaks Stage 5/6 Commit Counting

**What goes wrong:** Stage 5 (verify) and Stage 6 (publish) use `HEAD~${N_COMMITS}` to count back through cherry-picked commits. If selective sync applies fewer commits than the total in the range, N_COMMITS must reflect the actual applied count, not the original range count.

**Why it happens:** The current workflow calculates N_COMMITS from `selected_commits.length` which is set during Stage 3. If selective sync changes which commits are applied (via category filtering), this count must update.

**How to avoid:** Track the actual number of successfully applied commits during Stage 4, not the planned count from Stage 3. Pass `applied_count` (not `selected_count`) to Stages 5-7.

**Warning signs:** Stage 5 checking wrong commits (too many or too few in the range).

### Pitfall 5: Auto-Include Overrides Create Unexpected Commit Ordering

**What goes wrong:** User filters for `--category fix` only, but dependency analysis detects that a fix commit depends on a feat commit. The system auto-includes the feat commit, but if it's chronologically before the fix commit and touches different modules, the cherry-pick order matters.

**Why it happens:** Auto-included commits are added to the selected set but may not be in the right chronological position.

**How to avoid:** After auto-inclusion, re-sort the entire selected set chronologically. The existing pattern is "sort selected commits chronologically (oldest first for cherry-pick order)" -- this must apply after auto-inclusion, not before.

**Warning signs:** Cherry-pick conflicts caused by out-of-order application of auto-included commits.

### Pitfall 6: spawnGit and execGit Windows Compatibility

**What goes wrong:** Any new git commands using shell special characters (^, %, |, *, spaces in messages) fail on Windows MINGW64 if called via execGit().

**Why it happens:** Known pitfall from Phase 20 -- execGit() single-quotes arguments, breaking on Windows.

**How to avoid:** Use `spawnGit(cwd, args)` (array form) for ALL new git commands. This is already the established pattern. Never use execGit() for new code.

**Warning signs:** Tests passing on Linux CI but failing on Windows.

## Code Examples

Verified patterns from existing codebase:

### Parsing Filter Flags from User Input (orchestrator level)

```javascript
// In upstream.md orchestrator, parse flags before spawning workflow:
// Input: "--category feat,fix --exclude refactor --include abc1234"
// This parsing happens in the command file, not in sync.cjs

// Extract --category
const categoryMatch = userInput.match(/--category\s+([^\s]+)/);
const categories = categoryMatch ? categoryMatch[1].split(',') : [];

// Extract --exclude (categories)
const excludeMatch = userInput.match(/--exclude\s+([^\s]+)/);
const excludeCategories = excludeMatch ? excludeMatch[1].split(',') : [];

// Extract --include (SHAs)
const includeMatches = [...userInput.matchAll(/--include\s+([0-9a-f]{7,40})/gi)];
const includeShas = includeMatches.map(m => m[1]);

// Extract --exclude (SHAs) -- distinguished from category exclude by SHA format
const excludeShaMatches = [...userInput.matchAll(/--exclude\s+([0-9a-f]{7,40})/gi)];
const excludeShas = excludeShaMatches.map(m => m[1]);
```

### Reading Conflict Context for AI Analysis (git show pattern)

```javascript
// Source: established spawnGit pattern from sync.cjs
// For each conflicted file, get upstream version and fork base:

// Upstream version (what the cherry-picked commit has):
const upstreamContent = spawnGit(cwd, ['show', `${sha}:${filePath}`]);

// Fork base version (what HEAD had before the conflict):
const forkBaseContent = spawnGit(cwd, ['show', `HEAD:${filePath}`]);

// Current file (with conflict markers):
const conflictedContent = fs.readFileSync(path.join(cwd, filePath), 'utf-8');

// Diff between fork and upstream for this file:
const fileDiff = spawnGit(cwd, ['diff', 'HEAD', '--', filePath]);
```

### Sync-Manifest Category Cache Extension

```javascript
// Source: existing sync-manifest.json schema + CONTEXT.md caching decision
// Extended applied[] entries gain a 'category' field:
{
  "applied": [
    {
      "upstreamHash": "abc1234",
      "forkHash": "def5678",
      "subject": "feat: add new command",
      "appliedAt": "2026-03-07T10:00:00Z",
      "conflictType": null,
      "status": "applied",
      // NEW Phase 22 fields:
      "category": "feat",           // cached classification type
      "categoryConfidence": "high", // from classifyCommit
      "categorySource": "conventional-prefix" // or "ai-inferred"
    }
  ]
}
```

### Fork Identity Resolution Logic

```javascript
// Source: branding-map.json patterns + CONTEXT.md fork identity rule
// When resolving conflicts, fork identity always wins for these patterns:

const brandingMap = JSON.parse(safeReadFile(
  path.join(cwd, '.planning', 'sync', 'branding-map.json')
));

// Build upstream->fork replacement pairs
const replacements = [];
for (const section of ['path_patterns', 'npm_patterns', 'github_patterns', 'display_name_patterns']) {
  for (const entry of (brandingMap[section] || [])) {
    if (entry.upstream && entry.fork) {
      replacements.push({ upstream: entry.upstream, fork: entry.fork });
    }
  }
}

// In conflict resolution: if upstream content contains upstream branding,
// replace with fork branding before suggesting resolution
function applyForkIdentity(content, replacements) {
  let result = content;
  for (const { upstream, fork } of replacements) {
    result = result.split(upstream).join(fork);
  }
  return result;
}
```

### Enhanced Sync-Preview with Category Grouping (JSON output extension)

```javascript
// Source: existing cmdSyncPreview --json schema in sync.cjs
// Extended with filter metadata:
{
  range: 'abc..def',
  filters: {
    categories: ['feat', 'fix'],
    excludeCategories: ['refactor'],
    includeShas: [],
    excludeShas: [],
    active: true  // false when no filters applied
  },
  commits: [...],   // ALL commits (both selected and excluded)
  selected: [...],  // filtered subset
  excluded: [...],  // commits removed by filters
  dependencies: {
    fileOverlap: [...],  // deterministic
    semantic: [...],     // AI-inferred (populated by workflow, not plumbing)
    warnings: [...]      // missing dependency warnings
  },
  summary: {
    totalCommits: 12,
    selectedCommits: 8,
    excludedCommits: 4,
    autoIncluded: 1,     // dependencies auto-added
    sensitivePathCount: 2,
    byType: { feat: 3, fix: 5, docs: 1, refactor: 3, ... },
    byTypeSelected: { feat: 3, fix: 5 },
    supplyChainFindings: 0
  },
  effortEstimate: { ... }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All-or-nothing cherry-pick selection (Stage 2: "enter SHAs" or "all") | Category-based filtering with --category/--exclude + individual SHA include/exclude | Phase 22 | Users can sync "only bug fixes" or "everything except refactors" |
| Manual conflict resolution (CONFLICT_DETECTED checkpoint: user resolves, responds "resolved") | AI-analyzed conflict with suggested resolution + fork identity preservation | Phase 22 | Conflicts resolved faster with context; fork branding automatically preserved |
| No dependency tracking between commits | File-overlap (deterministic) + semantic (AI) dependency detection with auto-include | Phase 22 | Users warned when skipping a commit would break a dependent; cross-module deps highlighted |

**Deprecated/outdated:**
- Stage 2 CHERRY_PICK_SELECTION checkpoint's "enter SHAs" interface remains available but is supplemented by category flags. The existing "all" and "abort" options continue to work unchanged.
- Stage 4 CONFLICT_DETECTED checkpoint's manual-only resolution flow is replaced by AI-assisted analysis, but "edit" option preserves the manual fallback.

## Open Questions

1. **How should AI-inferred categories be cached persistently?**
   - What we know: CONTEXT.md says "cache categorization results in sync manifest." The sync-manifest.json has an `applied[]` array with per-commit entries. Non-conventional commits need AI classification that should be cached.
   - What's unclear: Should AI classifications be cached in sync-manifest.json (alongside applied/skipped status) or in a separate classification cache file? sync-manifest.json is per-sync-operation; a classification cache could span across multiple sync operations.
   - Recommendation: Extend the enriched commit data in sync-manifest.json with `category`, `categoryConfidence`, and `categorySource` fields. On re-run, sync-preview checks if a commit SHA already has a cached category before re-classifying. This keeps all sync data in one file.

2. **How to structure the AI prompt for dependency analysis?**
   - What we know: Claude needs to read diffs of N commits and determine semantic dependencies. For a batch of 20 commits, this means reading 20 diffs and analyzing pairwise relationships. That's O(N^2) comparisons.
   - What's unclear: Should the analysis be done in one prompt (all diffs at once) or iteratively (per-commit)?
   - Recommendation: One prompt with all diffs. Claude Code's context window can handle 20 diffs easily. The prompt should enumerate commits with their diffs and ask: "For each commit, does it depend on any earlier commit? List only dependencies where commit B uses code defined, modified, or restructured by commit A." This avoids N separate prompts and gives Claude the full picture.

3. **What happens when the user passes --force to override dependency warnings?**
   - What we know: CONTEXT.md says auto-include with warning, overridable with --force.
   - What's unclear: Does --force suppress the auto-include (apply only explicitly selected commits regardless of dependencies) or suppress the warning (still auto-include but don't show the warning)?
   - Recommendation: --force suppresses auto-include. User explicitly said "I know what I'm doing, give me exactly what I asked for." Warnings should still appear but as informational, not blocking.

4. **How to handle the case where all commits in a category depend on a commit in an excluded category?**
   - What we know: User says `--category fix`, but every fix commit depends on a feat commit.
   - What's unclear: Auto-including all feat commits defeats the purpose of the category filter. Does the system warn and proceed, or flag it as "most commits in the excluded set would be auto-included"?
   - Recommendation: Show a summary warning: "4 of 5 excluded commits would be auto-included due to dependencies. Consider including the feat category." Let the user decide. Don't silently include 80% of what they excluded.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `get-stuff-done/bin/lib/sync.cjs` -- all existing plumbing functions: `classifyCommit()`, `getCommitsInRange()`, `getFilesForCommit()`, `cmdSyncPreview()`, `loadProtectedPaths()`, `isSensitivePath()`, `spawnGit()`, supply chain scanner pipeline
- Direct codebase inspection: `get-stuff-done/workflows/upstream-sync.md` -- full 7-stage workflow with checkpoint protocol, Stage 2 (commit selection), Stage 3 (plan generation), Stage 3.5 (security review), Stage 4 (cherry-pick execution with conflict handling)
- Direct codebase inspection: `commands/gsd/upstream.md` -- orchestrator command with --dry-run flag parsing, Task spawn pattern with sync_context, checkpoint handling for all return types
- Direct codebase inspection: `.planning/sync/branding-map.json` -- fork identity mapping with path_patterns, npm_patterns, github_patterns, display_name_patterns
- Direct codebase inspection: `.planning/sync/sync-manifest.json` -- 97 entries with applied/skipped status, conflict types, timestamps, per-commit notes
- Direct codebase inspection: `.planning/sync/cache.json` -- last_sync SHA, registry config
- Phase 21 RESEARCH.md -- classifier design (conventional prefix + file heuristics), supply chain scanner architecture, cache patterns
- Phase 20 RESEARCH.md -- plumbing/porcelain split, sync.cjs module creation, checkpoint tag pattern, trial merge cleanup
- `.planning/memory/shared/pitfalls.md` -- spawnGit Windows pitfall, bun re-require coverage pitfall

### Secondary (MEDIUM confidence)
- Git cherry-pick documentation: `git cherry-pick -x` appends upstream SHA reference, `--abort` cancels in-progress cherry-pick, `--continue` resumes after conflict resolution -- verified against codebase usage in Stage 4
- Conventional commits specification: prefix list (feat, fix, refactor, docs, chore, test, perf, style) + breaking change format -- verified against `classifyCommit()` implementation

### Tertiary (LOW confidence)
- AI dependency analysis accuracy: no established benchmarks for Claude's ability to detect semantic dependencies between code commits. Recommendation to combine with deterministic file-overlap detection mitigates this uncertainty. False positive rate will need tuning during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components are existing files with verified behavior; no new modules
- Architecture: HIGH -- filtering is deterministic extension of existing classifier; dependency graph is a new data structure but follows established JSON schema patterns
- Pitfalls: HIGH -- all identified from direct codebase inspection and Phase 20/21 experience; Windows compatibility pitfall is documented in shared memory
- AI analysis patterns (dependency + conflict): MEDIUM -- AI-assisted features are architecturally new for this codebase; the prompt design and false positive rate will require iteration
- Conflict resolution UX: MEDIUM -- accept/reject/edit flow is well-defined in CONTEXT.md but file write mechanics and marker verification need careful implementation

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable domain -- git CLI, conventional commits, and sync.cjs module are not changing; AI prompt tuning may need iteration during implementation)
