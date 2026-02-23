# Phase 20: Sync Safety & Transparency - Research

**Researched:** 2026-02-23
**Domain:** Git operations (diff preview, checkpoint tags, dry-run), Node.js CJS module architecture, cross-platform bash
**Confidence:** HIGH

## Summary

Phase 20 adds three safety features to the upstream-sync workflow: per-batch diff preview with conflict prediction (SYNC-01), git-tag-based rollback checkpoints (SYNC-02), and a dry-run mode that halts before Stage 4 (SYNC-04). All three features follow the plumbing/porcelain split decided in CONTEXT.md: a new `bin/lib/sync.cjs` module provides CLI plumbing, and `upstream-sync.md` is enhanced with porcelain UX.

The codebase is well-understood from Phase 18 execution. The sync-manifest.json records 91 applied commits with a 63.7% conflict rate (58/91) — the historical training data for effort estimation. The `branding-map.json` already defines the protected paths list. All required git commands (`git diff --color=always --stat`, `git tag -a`, `git cherry-pick -n`) work correctly on this platform (Windows Git Bash + Node.js 22).

The implementation is entirely self-contained in the existing technology stack — no new npm dependencies are needed. The primary technical risks are: (1) correct abort of trial merges without leaving dirty state, (2) Windows ANSI color passthrough, and (3) keeping the workflow markdown correct across its new 3.5-checkpoint additions.

**Primary recommendation:** Implement `sync.cjs` as a thin domain module (following `commands.cjs` as the structural template), register four new commands in the gsd-tools.cjs router (`sync-preview`, `sync-checkpoint-create`, `sync-checkpoint-list`, `sync-checkpoint-cleanup`), then enhance Stage 3.5 and add a dry-run gate in `upstream-sync.md`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Architecture: Plumbing/Porcelain Separation**
- CLI plumbing in `gsd-tools.cjs` for data operations (reusable, scriptable, crash-recoverable)
- Workflow porcelain in `upstream-sync.md` for user interaction (prompts, approvals, checkpoints)
- Most sync features need both: CLI does the work, workflow presents it
- New `bin/lib/sync.cjs` module for all sync plumbing, following Phase 18's modular architecture
- Router dispatches to sync.cjs like the 11 existing domain modules

**Diff Preview**
- Enhanced terminal diff using git's built-in `--color=always` with `--stat` summary
- Per-batch granularity with drill-down: combined `--stat` summary for the batch, user can request individual commit diffs on demand
- Approve batch as a whole; skip individual commits only during cherry-pick execution if they fail
- Flag sensitive paths in `--stat` output using markers for files matching branding-map.json protectedPaths
- Sensitive path list sourced from `.planning/sync/branding-map.json` protectedPaths (single source of truth)
- Flag only, drill-down on request (don't auto-expand sensitive commit diffs)
- Current Stage 3.5 security analysis kept as-is, plus new path flagging on top
- Conflict prediction: basic file overlap heuristic first (fast), then optional trial merge (`--no-commit`) for flagged commits only
- CLI plumbing: `gsd-tools.cjs sync-preview <range>` computes all data (commits, stats, flags, conflict risk)
- Workflow porcelain: Stage 3.5 calls sync-preview, presents with approve/skip/abort UX

**Diff Preview Output Format**
- Human-readable default (terminal, colorized)
- `--json` flag for structured output (for Phase 22 automation)
- JSON schema: flat with tags (array of objects, each commit has metadata fields)
- Schema: `{hash, subject, files: [{path, status, sensitive: bool}], conflictRisk: 'none'|'overlap'|'confirmed', securityFlags: [...], ...}`
- Extensible: Phase 21 adds category field, Phase 22 filters by it

**Rollback Mechanism**
- Lightweight git tags with `sync-checkpoint-` prefix before each batch
- Per-batch granularity (not per-commit): matches diff preview and approval granularity
- Individual cherry-picks are already atomic (git handles within-batch recovery natively)
- Automatic cleanup: tags deleted after successful sync completion
- Rollback UX: workflow-guided (cherry-pick fails -> offer "rollback to checkpoint?" inline) + documented fallback (`git reset --hard sync-checkpoint-<batch>` for crash recovery)
- No new CLI command for rollback: the git command IS the command, documented in the workflow

**Dry-Run Mode**
- Terraform-style plan output: commit list, --stat per batch, conflict predictions, sensitive path markers, effort estimate
- Effort estimate calculated from historical conflict rate in sync-manifest.json (% of past commits with conflicts, applied to pending commits)
- Invocation: workflow `--dry-run` flag runs Stages 1-3 (fetch, classify, plan+preview) then STOPS, no Stage 4 execution
- CLI plumbing: `sync-preview` command is reused (same as diff preview, but called standalone or via --dry-run flag)
- Human-readable + JSON output (same dual output as diff preview)

### Claude's Discretion
- Exact format of sensitive path markers in --stat output (color, symbol, placement)
- Trial merge implementation details (abort strategy, error handling)
- Effort estimate formula and presentation format
- Checkpoint tag naming convention details (batch numbering scheme)
- How to handle edge cases: partial batches, interrupted syncs, multiple active sync branches

### Deferred Ideas (OUT OF SCOPE)
- Per-commit selective sync (Phase 22 scope, not Phase 20)
- Commit categorization in preview (Phase 21 adds classification, Phase 20 shows raw commits)
- Interactive diff viewer with syntax highlighting via external tool (PLAT-07, deferred to v0.4.0 per ASSESS-02)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SYNC-01 | Colorized diff preview before cherry-picks -- user can visually review what each commit changes with syntax-highlighted diffs before accepting | git diff --color=always --stat works on all 3 platforms; sensitive path flagging via branding-map.json protectedPaths; conflict heuristic via file overlap; trial merge via cherry-pick -n |
| SYNC-02 | State snapshots and rollback -- sync workflow creates restore points before each cherry-pick batch, enabling rollback to last known-good state on failure | git tag -a creates annotated tags; git reset --hard restores state; tag cleanup with git tag -d; all commands verified working on Windows Git Bash |
| SYNC-04 | --dry-run mode for sync operations -- preview the full sync plan without modifying the working tree | sync-preview CLI command covers all data; workflow --dry-run stops after Stage 3; effort estimate from sync-manifest.json historical data (63.7% conflict rate from Phase 18) |
</phase_requirements>

---

## Standard Stack

### Core (No New Dependencies)

All required capabilities are already available in the existing stack:

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| Node.js | >=20.0.0 | CJS module runtime | Already required |
| `child_process.execSync` | built-in | Git command execution | Already used in core.cjs `execGit()` |
| `fs` | built-in | File I/O | Already used everywhere |
| `path` | built-in | Path manipulation | Already used everywhere |
| git | system | diff, tag, cherry-pick | Verified working on Win/Mac/Linux |

**No new npm packages are required.** All git operations are standard porcelain commands available on git 2.x+.

### New Module to Create

| File | Purpose |
|------|---------|
| `get-stuff-done/bin/lib/sync.cjs` | All sync plumbing: preview, checkpoint create/list/cleanup |

### Supporting: Existing Files Modified

| File | Modification |
|------|-------------|
| `get-stuff-done/bin/gsd-tools.cjs` | Router: add `case 'sync-preview':`, `case 'sync-checkpoint':` dispatch to sync.cjs |
| `get-stuff-done/workflows/upstream-sync.md` | Stage 3.5 enhanced with sync-preview call; Stage 4 gets checkpoint-create before batch; Stage 4 success path gets checkpoint-cleanup; --dry-run gate between Stage 3 and Stage 4 |
| `commands/gsd/upstream.md` | Add `--dry-run` to argument-hint |

---

## Architecture Patterns

### New Module Structure: `bin/lib/sync.cjs`

Following the `commands.cjs` structural template (simplest existing module):

```javascript
/**
 * Sync — CLI plumbing for upstream sync safety features
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { output, error, execGit, safeReadFile } = require('./core.cjs');

// ─── Exported Commands ─────────────────────────────────────────────────────

function cmdSyncPreview(cwd, range, options, raw) { ... }
function cmdSyncCheckpointCreate(cwd, batchId, raw) { ... }
function cmdSyncCheckpointList(cwd, raw) { ... }
function cmdSyncCheckpointCleanup(cwd, raw) { ... }

module.exports = {
  cmdSyncPreview,
  cmdSyncCheckpointCreate,
  cmdSyncCheckpointList,
  cmdSyncCheckpointCleanup,
};
```

### Router Registration Pattern

In `gsd-tools.cjs` — add `sync` to requires at top and add cases in the switch:

```javascript
// At top with other requires:
const sync = require('./lib/sync.cjs');

// In switch(command):
case 'sync-preview': {
  const range = args[1];
  const jsonOutput = args.includes('--json');
  const verboseIdx = args.indexOf('--verbose');
  sync.cmdSyncPreview(cwd, range, { json: jsonOutput }, raw);
  break;
}

case 'sync-checkpoint': {
  const subcommand = args[1];
  if (subcommand === 'create') {
    sync.cmdSyncCheckpointCreate(cwd, args[2], raw);
  } else if (subcommand === 'list') {
    sync.cmdSyncCheckpointList(cwd, raw);
  } else if (subcommand === 'cleanup') {
    sync.cmdSyncCheckpointCleanup(cwd, raw);
  } else {
    error('Unknown sync-checkpoint subcommand. Available: create, list, cleanup');
  }
  break;
}
```

### Recommended Project Structure (new files only)

```
get-stuff-done/
├── bin/
│   ├── gsd-tools.cjs         # (modified) router + sync require + cases
│   └── lib/
│       └── sync.cjs          # (NEW) sync plumbing module
tests/
└── sync.test.cjs             # (NEW) upstream test format for sync module
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Colorized terminal diff | Custom ANSI diff formatter | `git diff --color=always` | Git's own diff renderer works on all 3 platforms; verified on Win Git Bash |
| File list per commit | Manual commit parsing | `git diff-tree --no-commit-id --name-status -r {SHA}` | Already used in Stage 1 of upstream-sync.md |
| Trial merge for conflict detection | Custom merge state machine | `git cherry-pick -n {SHA}` + `git cherry-pick --abort` | Git handles all merge state; -n means no-commit, abort is clean |
| Rollback mechanism | Custom state snapshots to disk | `git tag -a sync-checkpoint-{batch} HEAD` | Tags are atomic, crash-safe, and `git reset --hard <tag>` is the standard recovery command |
| Tag cleanup | Custom cleanup script | `git tag -d sync-checkpoint-{batch}` in loop | Standard git; zero deps |
| Sensitive path matching | Custom glob engine | String-startsWith/includes against `branding-map.json` protectedPaths array | branding-map.json is already the SSOT; no new config needed |
| Effort estimation | ML model | Historical conflict rate from sync-manifest.json | Phase 18 provides 91 data points; simple percentage is accurate enough |

**Key insight:** Every capability needed for Phase 20 is already in git itself. The sync.cjs module is a thin adapter that calls git commands and formats their output — not a reimplementation of git logic.

---

## Common Pitfalls

### Pitfall 1: Trial Merge Leaving Dirty State
**What goes wrong:** `git cherry-pick -n {SHA}` succeeds (no conflict), stages changes. If we then `git cherry-pick --abort`, it errors "no cherry-pick in progress". The staged changes remain.
**Why it happens:** `-n` means no-commit, not no-apply. After a clean `-n` cherry-pick, there is no in-progress cherry-pick to abort.
**How to avoid:** After trial merge, ALWAYS use `git reset HEAD` (unstages) + `git checkout -- .` (discards working tree) OR use a temporary worktree/stash. The safest pattern:
```bash
# Before trial merge: save clean state
git stash push -m "sync-preview-trial-{sha}"
# Attempt trial merge
git cherry-pick -n {SHA}
# Check for conflicts
git status --short | grep '^[UADC][UADC]'
# Always restore clean state
git stash pop
```
Alternatively: use `git cherry-pick --abort` only when `git status` shows UU/AA/DD (actual conflict markers). If status shows only M/A/D (clean apply), use `git reset --hard HEAD` instead.
**Warning signs:** `git status --short` has M/A/D lines after trial merge but no UU lines — cherry-pick succeeded silently and state is dirty.

### Pitfall 2: ANSI Color Codes in JSON Output
**What goes wrong:** When `--json` flag is used, `git diff --color=always` output is captured into JSON strings. ANSI escape sequences (`\033[32m`, `\033[m`) appear literally in the JSON, making it invalid for programmatic consumption.
**Why it happens:** `--color=always` overrides tty detection; output always contains ANSI regardless of whether stdout is a terminal.
**How to avoid:** In `cmdSyncPreview` with `--json` flag, call `git diff --no-color --stat` for the JSON data path. Use `--color=always` only for the human-readable terminal path. The JSON schema stores raw file lists (from `git diff-tree`), not colorized diff text.

### Pitfall 3: Windows Git Bash Tag Format
**What goes wrong:** `git tag -a sync-checkpoint-1 -m "message"` requires `-m` (message) for annotated tags. Without `-m`, git opens an editor — which hangs in non-interactive mode.
**Why it happens:** Annotated tags require a message. Without `-m`, git tries to launch `$GIT_EDITOR`.
**How to avoid:** Always pass `-m "..."` when creating annotated tags programmatically. The message content is not important for rollback; use a consistent format: `-m "sync checkpoint before batch {batchId}"`.
**Verification:** `git tag -a sync-checkpoint-test -m "test" HEAD` was confirmed working in this repo on Windows Git Bash (MINGW64).

### Pitfall 4: `git diff {SHA}^` Fails on Root Commit
**What goes wrong:** Stage 1 of upstream-sync.md uses `git diff-tree {SHA}` which works for any commit. But `git diff {first_sha}^..{last_sha}` fails if `first_sha` is the root commit (no parent).
**Why it happens:** `{SHA}^` is syntax for parent commit; root commits have no parent.
**How to avoid:** In `sync-preview`, check if the first SHA has a parent before using `^` syntax. If no parent: use `git diff --root {SHA}` for single-commit ranges. In practice, upstream commits will never be root commits, so this is a low-risk but easy defensive check.

### Pitfall 5: bun test Coverage re-require Pattern
**What goes wrong:** Tests that do `delete require.cache[path]; require(path)` to test different code paths do NOT accumulate coverage in bun 1.3.5 (tracked in shared memory pitfalls.md).
**Why it happens:** bun registers each module load as a separate V8 Script; coverage from re-loaded scripts is never merged.
**How to avoid:** For `sync.cjs` tests, export all internal helper functions. Test helpers directly. Do not re-require to test different states. Use `MockExecSync` (from `tests/helpers/mock-child-process.js`) to control `execSync` behavior without re-loading the module.

### Pitfall 6: Upstream-sync.md Batch Numbering
**What goes wrong:** The workflow uses the word "batch" informally throughout Stage 3 and Stage 4. Phase 20 introduces formal batch identifiers for checkpoints. If the numbering scheme is ambiguous (e.g., is it a sequential counter or a SHA-derived ID?), rollback commands become fragile.
**Why it happens:** Batch is not a formal concept in the current workflow — it's just "all selected commits in one cherry-pick sequence."
**How to avoid:** Define batch ID as a zero-padded sequential integer per sync session: `sync-checkpoint-001`, `sync-checkpoint-002`. Since Phase 20's design is per-batch with user-approved batches (Stage 3.5 approval covers the whole batch), there is typically only one checkpoint per sync run. Use padded 3-digit numbers to allow for future multi-batch scenarios (Phase 22 selective sync).

---

## Code Examples

### sync-preview: Getting Commits in a Range

```javascript
// Source: git porcelain, verified in upstream-sync.md Stage 1
function getCommitsInRange(cwd, baseRef, targetRef) {
  const result = execGit(cwd, [
    'log', '--oneline',
    '--format=%H|%ad|%an|%s',
    '--date=short',
    `${baseRef}..${targetRef}`
  ]);
  if (result.exitCode !== 0) return [];
  return result.stdout
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const [hash, date, author, ...subjectParts] = line.split('|');
      return { hash, date, author, subject: subjectParts.join('|') };
    });
}
```

### sync-preview: Getting Files Changed by a Commit

```javascript
// Source: upstream-sync.md Stage 1, git diff-tree
function getFilesForCommit(cwd, sha) {
  const result = execGit(cwd, [
    'diff-tree', '--no-commit-id', '--name-status', '-r', sha
  ]);
  if (result.exitCode !== 0) return [];
  return result.stdout
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const [status, ...pathParts] = line.split('\t');
      return { status, path: pathParts.join('\t') };
    });
}
```

### sync-preview: Sensitive Path Flagging

```javascript
// Source: branding-map.json protectedPaths field (SSOT)
function loadProtectedPaths(cwd) {
  const mapPath = path.join(cwd, '.planning', 'sync', 'branding-map.json');
  try {
    const raw = fs.readFileSync(mapPath, 'utf-8');
    const map = JSON.parse(raw);
    // Collect all 'fork' fields from path_patterns, npm_patterns, etc.
    // Also include post_module_split_only patterns
    const paths = [];
    for (const pattern of (map.path_patterns || [])) {
      if (pattern.fork) paths.push(pattern.fork);
    }
    // Add package_json_protected_fields special paths
    return paths;
  } catch {
    return [];
  }
}

function isSensitivePath(filePath, protectedPaths) {
  return protectedPaths.some(p =>
    filePath.startsWith(p) || filePath.includes(p)
  );
}
```

### sync-preview: Conflict Risk Heuristic (File Overlap)

```javascript
// File overlap: if commit touches files that exist in the fork's working tree
// with local modifications, there is "overlap" conflict risk
function assessConflictRiskByOverlap(cwd, commitFiles) {
  // Get current dirty files (if any)
  const statusResult = execGit(cwd, ['status', '--porcelain']);
  const dirtyFiles = new Set(
    (statusResult.stdout || '').split('\n')
      .filter(Boolean)
      .map(line => line.slice(3).trim())
  );

  const overlapFiles = commitFiles.filter(f => dirtyFiles.has(f.path));
  return overlapFiles.length > 0 ? 'overlap' : 'none';
}
```

### sync-preview: Trial Merge (Confirmed Conflict Detection)

```javascript
// Trial merge: attempts cherry-pick -n, checks for conflicts, restores clean state
// Only called for commits that already show 'overlap' risk
function assessConflictByTrialMerge(cwd, sha) {
  // Save clean state via stash
  const stashResult = execGit(cwd, ['stash', 'push', '-m', `sync-preview-trial-${sha.slice(0, 7)}`]);
  const stashed = stashResult.exitCode === 0 && !stashResult.stdout.includes('No local changes');

  try {
    // Attempt trial cherry-pick (no commit)
    const cpResult = execGit(cwd, ['cherry-pick', '-n', sha]);

    if (cpResult.exitCode !== 0) {
      // Conflict detected
      execGit(cwd, ['cherry-pick', '--abort']);
      return 'confirmed';
    }

    // No conflict: clean up staged changes
    execGit(cwd, ['reset', 'HEAD']);
    execGit(cwd, ['checkout', '--', '.']);
    return 'none';
  } finally {
    // Always restore stash if we created one
    if (stashed) {
      execGit(cwd, ['stash', 'pop']);
    }
  }
}
```

### sync-checkpoint-create: Creating a Checkpoint Tag

```javascript
// Source: git tag, verified on Windows Git Bash in this repo
function cmdSyncCheckpointCreate(cwd, batchId, raw) {
  if (!batchId) error('batchId required (e.g., "001")');

  const tagName = `sync-checkpoint-${batchId}`;
  const message = `sync checkpoint before batch ${batchId}`;

  const result = execGit(cwd, ['tag', '-a', tagName, '-m', message, 'HEAD']);
  if (result.exitCode !== 0) {
    error(`Failed to create checkpoint tag: ${result.stderr}`);
  }

  output({ tag: tagName, sha: 'HEAD', created: new Date().toISOString() }, raw, tagName);
}
```

### sync-checkpoint-cleanup: Deleting All Checkpoint Tags

```javascript
// Source: git tag -l + git tag -d
function cmdSyncCheckpointCleanup(cwd, raw) {
  const listResult = execGit(cwd, ['tag', '-l', 'sync-checkpoint-*']);
  const tags = listResult.stdout.split('\n').filter(Boolean);

  const deleted = [];
  const failed = [];

  for (const tag of tags) {
    const deleteResult = execGit(cwd, ['tag', '-d', tag]);
    if (deleteResult.exitCode === 0) {
      deleted.push(tag);
    } else {
      failed.push({ tag, error: deleteResult.stderr });
    }
  }

  output({ deleted, failed, count: deleted.length }, raw, deleted.length.toString());
}
```

### Effort Estimate from Historical Data

```javascript
// Source: .planning/sync/sync-manifest.json (91 entries, 63.7% conflict rate from Phase 18)
function computeEffortEstimate(cwd, pendingCount) {
  const manifestPath = path.join(cwd, '.planning', 'sync', 'sync-manifest.json');
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const applied = (manifest.applied || []).filter(e => e.status === 'applied');
    const conflicts = applied.filter(e => e.conflictType !== null && e.conflictType !== undefined);
    const historicalRate = applied.length > 0 ? conflicts.length / applied.length : 0;
    const estimatedConflicts = Math.round(pendingCount * historicalRate);

    return {
      historicalConflictRate: Math.round(historicalRate * 100),
      estimatedConflicts,
      estimatedCleanCommits: pendingCount - estimatedConflicts,
      dataPoints: applied.length,
    };
  } catch {
    return {
      historicalConflictRate: null,
      estimatedConflicts: null,
      estimatedCleanCommits: null,
      dataPoints: 0,
    };
  }
}
```

### Dry-Run Gate in upstream-sync.md (Workflow Pseudocode)

```markdown
## Stage 3 completion:

After writing the plan file, check for dry-run mode:
```bash
if [[ "${DRY_RUN:-false}" == "true" ]]; then
  # Call sync-preview for full plan output
  node ~/.claude/get-stuff-done/bin/gsd-tools.cjs sync-preview "${FIRST_SHA}..${LAST_SHA}"

  echo ""
  echo "## DRY RUN COMPLETE"
  echo ""
  echo "**Mode:** Dry run (no changes applied)"
  echo "**Commits planned:** ${N}"
  echo "**Batches:** 1"
  echo ""
  echo "No files were modified. Re-run without --dry-run to execute the sync."
  exit 0
fi
```

Continue to Stage 3.5 only when not in dry-run mode.
```

---

## State of the Art

| Old Approach | Current Approach | Changed In | Impact |
|--------------|------------------|------------|--------|
| No diff preview (Stage 3.5 just shows --stat inline) | sync-preview CLI + enhanced Stage 3.5 with approve/skip/abort | Phase 20 | User sees full diff context including sensitive path flags |
| No rollback (conflict = manual recovery) | git tag checkpoints before each batch | Phase 20 | Single command recovery: `git reset --hard sync-checkpoint-001` |
| No dry-run (sync always modifies git state) | --dry-run flag stops after Stage 3 | Phase 20 | Safe preview without any git changes |
| Conflict prediction: none | File overlap heuristic + optional trial merge | Phase 20 | Predictive conflict warnings before cherry-pick execution |
| Effort estimate: none | Historical conflict rate from sync-manifest.json | Phase 20 | "Estimated 58 conflicts based on 63.7% historical rate" |

**Deprecated patterns to avoid in Phase 20 implementation:**
- Do NOT use `git diff {sha}^..{sha}` in sync-preview (breaks on root commits). Use `git diff-tree` for per-commit file lists.
- Do NOT use `grep -o` for JSON parsing (used in Stage 7 of current upstream-sync.md). Use Node.js `JSON.parse` in sync.cjs.
- Do NOT shell-escape the batch ID into tag names (could be user-controlled). Generate batch IDs internally.

---

## Implementation Blueprint

### sync.cjs Command Surface

```
node gsd-tools.cjs sync-preview <firstSHA>..<lastSHA>   # human-readable default
node gsd-tools.cjs sync-preview <firstSHA>..<lastSHA> --json   # JSON output
node gsd-tools.cjs sync-checkpoint create <batchId>    # create tag at HEAD
node gsd-tools.cjs sync-checkpoint list                # list active checkpoint tags
node gsd-tools.cjs sync-checkpoint cleanup             # delete all checkpoint tags
```

### upstream-sync.md Changes (Stage-by-Stage)

**Stage 3: PLAN** — Add dry-run check at end. After writing plan file, if `DRY_RUN=true`: call `sync-preview`, print dry-run completion, exit. This is the only change to Stage 3.

**Stage 3.5: SECURITY REVIEW** — Enhanced with sync-preview output. Replace inline `git diff --stat` with `node gsd-tools.cjs sync-preview <range>` call. Output now includes: stat summary + sensitive path markers + conflict risk per commit + effort estimate. Keep existing security analysis (exec/spawn patterns, etc.) as-is. Options updated to add "drill down on commit X" option.

**Stage 4: EXECUTE** — Add checkpoint-create before batch execution starts:
```bash
node ~/.claude/get-stuff-done/bin/gsd-tools.cjs sync-checkpoint create 001
```
Add rollback offer in conflict handling:
```
**Options:**
1. Resolve conflicts manually (follow instructions above), then respond "resolved"
2. Rollback to checkpoint: `git reset --hard sync-checkpoint-001`
3. Abort cherry-pick (leaves HEAD at last successful pick): `git cherry-pick --abort`
```
Add checkpoint-cleanup in Stage 7 after successful sync.

**commands/gsd/upstream.md** — Add `--dry-run` to `argument-hint` field. Add dry-run to pre-flight process section: if `--dry-run` is in `$CLAUDE_ARGS` or user input, pass `DRY_RUN=true` to sync_context.

### JSON Output Schema (Locked)

Per CONTEXT.md decision:

```json
{
  "range": "abc1234..def5678",
  "commits": [
    {
      "hash": "abc1234567890abcdef",
      "hashShort": "abc1234",
      "subject": "fix: resolve typo in help text",
      "date": "2026-01-15",
      "author": "glittercowboy",
      "files": [
        { "path": "README.md", "status": "M", "sensitive": false },
        { "path": "package.json", "status": "M", "sensitive": true }
      ],
      "conflictRisk": "none",
      "securityFlags": []
    }
  ],
  "summary": {
    "totalCommits": 3,
    "sensitivePathCount": 1,
    "highRiskCount": 0,
    "overlapRiskCount": 0
  },
  "effortEstimate": {
    "historicalConflictRate": 64,
    "estimatedConflicts": 2,
    "estimatedCleanCommits": 1,
    "dataPoints": 91
  }
}
```

### Test File: `tests/sync.test.cjs`

Following the `commands.test.cjs` pattern (upstream test format, `node:test` + `node:assert`):

```javascript
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

describe('sync-checkpoint commands', () => {
  // Tests use createTempProject() temp dirs initialized with .planning/
  // Note: checkpoint tests require a git repo — extend createTempProject() with git init
});

describe('sync-preview command', () => {
  // Tests mock execSync responses for git commands
  // Use --json flag for deterministic output assertion
});
```

**Coverage requirement:** 95%+ at each metric for sync.cjs. Export internal helpers (getCommitsInRange, getFilesForCommit, isSensitivePath, assessConflictRiskByOverlap) so tests can call them directly without re-requiring (avoiding bun coverage accumulation pitfall).

---

## Open Questions

1. **Trial merge: stash vs worktree**
   - What we know: `git stash push -m "..."` saves and `git stash pop` restores. But stash operations fail if there are untracked files with no `--include-untracked`.
   - What's unclear: The upstream-sync workflow requires a clean working tree before running. The `upstream.md` pre-flight check enforces this. So stash should always be clean at preview time.
   - Recommendation: Document that sync-preview requires clean working tree (same as the sync command itself). Add `git status --short` check at start of `cmdSyncPreview` and error if dirty.

2. **Batch ID generation: who generates it?**
   - What we know: CONTEXT.md says per-batch granularity. In Phase 20, there is one batch per sync run (all selected commits).
   - What's unclear: Should the workflow generate the batch ID and pass it to `sync-checkpoint create`, or should `sync-checkpoint create` auto-generate?
   - Recommendation: Workflow generates batch ID as a timestamp-based string (e.g., YYYYMMDD-HHmmss) and passes it as argument. This makes the tag name predictable in crash recovery docs without requiring the workflow to remember a counter.

3. **sync-preview with no upstream remote**
   - What we know: `sync-preview <range>` needs both SHAs to exist in the repo.
   - What's unclear: If called standalone (not via Stage 3.5 where fetch has already run), the upstream SHAs may not be fetched yet.
   - Recommendation: `cmdSyncPreview` should validate that both SHAs exist using `git cat-file -t <sha>`. If either is missing, emit a clear error: "SHA not found — run `git fetch upstream main` first."

---

## Sources

### Primary (HIGH confidence)
- Codebase: `get-stuff-done/workflows/upstream-sync.md` — current workflow structure, all stage definitions
- Codebase: `get-stuff-done/bin/lib/core.cjs` — `execGit()` pattern, module template
- Codebase: `get-stuff-done/bin/lib/commands.cjs` — module structural template (simplest module)
- Codebase: `get-stuff-done/bin/gsd-tools.cjs` — router pattern, require/case structure
- Codebase: `.planning/sync/sync-manifest.json` — 91 entries, 63.7% conflict rate verified via Node.js
- Codebase: `.planning/sync/branding-map.json` — protectedPaths SSOT
- Live verification: `git tag -a sync-checkpoint-test -m "test" HEAD && git tag -d sync-checkpoint-test` — confirmed working
- Live verification: `git diff --color=always HEAD~1..HEAD --stat` — ANSI output confirmed on Windows Git Bash
- Live verification: `git diff-tree --no-commit-id --name-status -r HEAD` — confirmed working
- Codebase: `tests/helpers/mock-child-process.js` — MockExecSync pattern for tests
- Shared memory: `.planning/memory/shared/pitfalls.md` — bun coverage re-require pitfall

### Secondary (MEDIUM confidence)
- Git documentation (general knowledge): `git cherry-pick -n` (no-commit flag), `git cherry-pick --abort`
- Memory: Phase 18 execution experience — two bun segfault crashes proved crash-recovery value; branding-map.json battle-tested on 185 commits

### Tertiary (LOW confidence - flagged for validation)
- Trial merge stash behavior on edge cases (untracked files, pre-existing stash): NOT tested live. Mitigation: enforce clean working tree precondition in sync-preview.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps, all tools verified live in repo
- Architecture: HIGH — follows established lib/sync.cjs pattern exactly; router registration is mechanical
- Pitfalls: HIGH — trial merge dirty state, ANSI in JSON, annotated tag `-m` requirement all verified; bun coverage pitfall from shared memory
- Effort estimate formula: HIGH — sync-manifest.json data verified via Node.js (91 entries, 63.7%)
- Workflow markdown changes: MEDIUM — Stage modifications are well-understood, but workflow complexity means a careful read is required before editing

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (git APIs are stable; sync-manifest data grows with each sync but formula does not change)
