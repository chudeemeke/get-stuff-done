# Phase 21: Sync Intelligence - Research

**Researched:** 2026-02-25
**Domain:** Git-based upstream monitoring, commit classification, supply chain integrity analysis
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Monitoring trigger:**
- Both passive (statusline hook) and active (manual command) detection
- Maintainer path: git-based upstream check (`git fetch upstream`, compare `HEAD..upstream/main`) replaces current npm-only check
- Consumer path: stays as-is (npm registry version check)
- Cache with 4-hour TTL: background worker writes result to cache file with timestamp; statusline reads cache on every render; background check only re-fetches if cache is stale
- Mid-session freshness via cache TTL -- when statusline reads stale cache, next session-start hook refreshes it
- Role detection: config-driven (`gsd.role` in JSON5 config), defaults to 'consumer'. Explicit, not inferred.
- Statusline notification format: "N upstream (M fixes) | /gsd:upstream" -- count + highest-severity type hint

**Commit classification:**
- Hybrid approach: deterministic in background hook, Claude-assisted in on-demand workflow
- Deterministic: conventional commit prefix parsing (feat:, fix:, refactor:, docs:, chore:, test:, perf:, style:) + file-path heuristics (docs/ = docs, test/ = test, bin/ = feat/fix based on subject)
- Ambiguous commits: deterministic classifier buckets as 'other'; Claude re-classifies in /gsd:upstream workflow context (zero additional API cost)
- Color-as-severity with self-describing type labels:
  - Red: security, breaking
  - Yellow: fix
  - Green: feat
  - Dim/gray: docs, chore, refactor, other

**Supply chain integrity (replaces GPG verification):**
- GPG verification dropped -- wrong threat model for this scenario
- 6 content-based supply chain checks:
  1. Prompt Integrity Scanner (ELEVATED -- primary check, highest prominence)
  2. Dependency Diff Guard
  3. Execution Path Sentinel
  4. Network Endpoint Audit
  5. Obfuscation Detector
  6. Author Anomaly Detection
- All checks are deterministic (regex/pattern matching on diff content and file paths)
- Checks run in sync-preview pipeline and /gsd:upstream workflow, NOT in background hook
- Findings are surfaced, not blocking -- maintainer decides action

**Output presentation:**
- Two output surfaces: statusline (compact notification) and /gsd:upstream (detailed view)
- Detailed view organization: risk-first, then type-grouped
  - Top section: commits with supply chain flags (prompt changes first, then code risks)
  - Bottom section: clean commits grouped by type (feat/fix/docs/chore/other)
- 3-layer depth approach:
  - Layer 1 (always): Dashboard summary -- risk-first commit list with subject, type badge, risk flags, --stat file counts
  - Layer 2 (auto): Risk commits auto-expand their flagged diff portions (specific lines that triggered checks)
  - Layer 3 (on-demand): Clean commits stay as summary; full diff on request
- sync-preview CLI: --json output extended with supply chain risk flags per commit

### Claude's Discretion

- Exact regex patterns for obfuscation and injection detection
- Historical author tracking implementation (Set vs file-based cache)
- Threshold for "long base64 string" length
- Exact color/formatting of risk badges in terminal output
- How to handle commits that trigger multiple checks simultaneously

### Deferred Ideas (OUT OF SCOPE)

- New upstream commits available (Codex runtime support, debug flow changes, etc.) -- sync via existing /gsd:upstream workflow, not Phase 21 scope
- Multi-runtime support (Codex, Gemini) -- separate milestone per earlier decision
- Blocking/auto-reject based on supply chain findings -- intentionally excluded; surface findings, let maintainer decide
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SYNC-03 | Auto-update check with severity indicators -- periodic check for new upstream commits, categorized by severity (breaking, feature, fix, chore) with visual summary | Monitoring architecture in gsd-check-update.js + statusline; cache TTL pattern; git-based upstream check for maintainer path |
| SYNC-07 | GPG verification of upstream commits -- validate commit signatures when available, warn on unsigned commits in security-sensitive paths | Superseded by supply chain checks per CONTEXT.md; 6 content-based checks replace GPG; isSensitivePath() in sync.cjs is the base for Execution Path Sentinel |
| SYNC-08 | Auto-categorization of upstream changes -- classify each commit as feature/fix/refactor/docs/chore using commit message parsing and file path analysis | Conventional commit prefix parsing; file-path heuristics; hybrid deterministic + Claude-assisted approach |
</phase_requirements>

## Summary

Phase 21 adds intelligence to the sync workflow across three dimensions: monitoring for new upstream commits, classifying those commits by type, and scanning for supply chain risks. All three features build directly on the existing `sync.cjs` module's primitives (`getCommitsInRange()`, `getFilesForCommit()`, `isSensitivePath()`, `spawnGit()`) and extend the existing cache/statusline infrastructure in `gsd-check-update.js` and `gsd-statusline.js`.

The monitoring work is two changes: (1) extending `gsd-check-update.js` to do a git-based check (`git fetch upstream && git rev-list HEAD..upstream/main --count`) when `gsd.role === 'maintainer'`, writing richer cache data including commit count and highest-severity type; (2) extending `gsd-statusline.js` to read that richer cache and format "N upstream (M fixes) | /gsd:upstream". The commit classification and supply chain analysis are new functions added to `sync.cjs`, consumed by both `cmdSyncPreview()` (extended to include classification and risk data in --json output) and the `/gsd:upstream` workflow (for the detailed view).

The most significant implementation complexity is the supply chain scanner: 6 distinct pattern-matching passes over commit diffs, each targeting a documented real-world attack vector. The highest-risk area is regex design for the Prompt Integrity Scanner and Obfuscation Detector -- poorly tuned patterns produce too many false positives and destroy user trust. The Author Anomaly Detector requires persistent state (a cache file of known authors), which is a new pattern for this codebase.

**Primary recommendation:** Implement Phase 21 in 3 discrete plans: (1) commit classifier in sync.cjs + extended sync-preview output, (2) supply chain scanner in sync.cjs + extended sync-preview output, (3) monitoring upgrade in gsd-check-update.js + statusline notification. This sequencing means classification and risk data are testable via CLI before the background monitoring hooks them up.

## Standard Stack

### Core

| Component | Location | Purpose | Why Standard |
|-----------|----------|---------|--------------|
| `sync.cjs` | `get-stuff-done/bin/lib/sync.cjs` | All sync plumbing | Already exists; Phase 20 established the module pattern |
| `spawnGit()` | `sync.cjs` local helper | Git commands with special chars | Required for Windows MINGW64 compatibility (see pitfalls.md) |
| `gsd-check-update.js` | `hooks/gsd-check-update.js` | Background update checker hook | SessionStart hook; already writes cache to `~/.claude/cache/gsd-update-check.json` |
| `gsd-statusline.js` | `hooks/gsd-statusline.js` | Statusline renderer | Already reads update cache and shows notification on line 2 |
| `node:test` + `assert` | stdlib | Unit testing framework | All existing tests in `tests/sync.test.cjs` use this |

### Supporting

| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| `child_process.spawnSync` | stdlib | Git subprocess calls | Any git command with %, |, ^, *, spaces in args |
| `fs.readFileSync` / `writeFileSync` | stdlib | Cache and author-history file I/O | Persistent state (update cache, author history) |
| `path.join` | stdlib | Path construction | All file path construction |
| `os.homedir()` | stdlib | Home directory for cache paths | Cache file at `~/.claude/cache/gsd-update-check.json` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Regex-based conventional commit parsing | A dedicated cc-parser npm package | Regex is zero-dependency; the conventional commit format is stable and simple enough; adding an npm package for this is unnecessary complexity |
| File-based author cache | In-memory Set populated at startup | File-based survives across sessions; Set loses state on restart; persistent history is required for author anomaly detection to be useful |
| Extending gsd-check-update.js for git check | A new separate hook script | Less to maintain; the TTL/cache/spawn pattern is already there; a new script would duplicate the infrastructure |

**Installation:** No new npm packages required. All functionality uses Node.js stdlib (`fs`, `path`, `os`, `child_process`) plus the existing git CLI.

## Architecture Patterns

### Recommended Project Structure

The Phase 21 changes touch 4 files, all existing:

```
get-stuff-done/bin/lib/
└── sync.cjs                    # 3 new exported functions + extended cmdSyncPreview

hooks/
├── gsd-check-update.js         # Extended: git-based check for maintainer role
└── gsd-statusline.js           # Extended: richer notification from extended cache

tests/
└── sync.test.cjs               # Extended: new test suites for the 3 new functions
```

No new files are required in the core path. The author history cache file (a new runtime artifact) lives at `~/.claude/cache/gsd-upstream-authors.json` (alongside the existing `gsd-update-check.json`).

### Pattern 1: New sync.cjs Functions Follow Existing Export Pattern

**What:** All new functions added to `sync.cjs` are exported at the bottom in the `module.exports` block. Functions are pure (take `cwd` + data, return results) and exported for direct testability -- the same pattern that avoids the bun re-require coverage pitfall.

**When to use:** All new sync intelligence functions.

**Example (based on existing pattern in sync.cjs):**
```javascript
// All new functions follow this signature pattern:
function classifyCommit(subject, files) {
  // Pure function: no cwd, no git calls -- input is pre-fetched
  // Returns { type, confidence } where type is feat|fix|refactor|docs|chore|security|other
}

function runSupplyChainChecks(cwd, sha, diff) {
  // Takes pre-fetched diff string; orchestrates all 6 sub-checks
  // Returns array of findings: [{ check, severity, evidence }]
}

function loadKnownAuthors(cacheDir) {
  // Returns Set of known author strings from persistent JSON cache
}

function saveKnownAuthors(cacheDir, authorsSet) {
  // Writes Set to JSON cache file
}

// Extended cmdSyncPreview calls these and adds to output:
// enrichedCommit.classification = classifyCommit(commit.subject, files)
// enrichedCommit.supplyChainRisks = runSupplyChainChecks(cwd, commit.hash, diff)

module.exports = {
  // ... existing exports ...
  classifyCommit,
  runSupplyChainChecks,
  loadKnownAuthors,
  saveKnownAuthors,
};
```

### Pattern 2: Extended Cache Schema for Maintainer Monitoring

**What:** `gsd-check-update.js` writes a richer JSON cache when role is 'maintainer'. The statusline reads this cache and shows the extended notification.

**When to use:** Only the monitoring plan (Plan 3).

**Extended cache schema:**
```javascript
// Current schema (consumer):
{
  update_available: true,
  installed: '2.3.0',
  latest: '2.4.0',
  checked: 1234567890
}

// Extended schema (maintainer -- same fields + extras):
{
  update_available: true,    // true when upstream_count > 0
  installed: '2.3.0',       // local version (from VERSION file)
  latest: 'upstream/main',  // canonical for maintainer path
  checked: 1234567890,      // Unix timestamp (seconds)
  // NEW maintainer fields:
  upstream_count: 5,         // commits ahead count
  highest_severity: 'fix',   // 'security'|'breaking'|'fix'|'feat'|'chore'
  commit_summary: [          // lightweight preview (no diffs, just metadata)
    { hashShort: 'abc1234', subject: 'fix: ...' type: 'fix' },
    ...
  ]
}
```

**Statusline reads this and formats:**
```javascript
// Maintainer notification (line 2 in statusline):
// "N upstream (M fixes) | /gsd:upstream"
// e.g., "5 upstream (2 fixes) | /gsd:upstream"
// Highest severity determines the parenthetical label
```

### Pattern 3: Commit Classification Logic

**What:** Deterministic classification via conventional commit prefix + file path heuristics.

**Classification precedence (evaluated in order):**
```javascript
function classifyCommit(subject, files) {
  // 1. Security keyword anywhere in subject (highest priority)
  if (/\b(security|cve|vuln|exploit|xss|sqli|rce|injection)\b/i.test(subject)) {
    return { type: 'security', confidence: 'high' };
  }

  // 2. Breaking change marker
  if (/^[a-z]+(\(.+\))?!:/.test(subject) || subject.includes('BREAKING CHANGE')) {
    return { type: 'breaking', confidence: 'high' };
  }

  // 3. Conventional commit prefix
  const ccMatch = subject.match(/^(feat|fix|refactor|docs|chore|test|perf|style)(\(.+\))?:/);
  if (ccMatch) {
    const typeMap = { perf: 'refactor', style: 'chore', test: 'chore' };
    const raw = ccMatch[1];
    return { type: typeMap[raw] || raw, confidence: 'high' };
  }

  // 4. File-path heuristics (fallback when no prefix)
  const hasDocs = files.some(f => /^docs\/|\.md$/.test(f.path));
  const hasTest = files.some(f => /^tests?\/|\.test\.|\.spec\./.test(f.path));
  const hasBin  = files.some(f => /^bin\/|^hooks\//.test(f.path));
  if (hasDocs && !hasBin) return { type: 'docs', confidence: 'medium' };
  if (hasTest && !hasBin) return { type: 'chore', confidence: 'medium' };
  if (hasBin) return { type: 'feat', confidence: 'low' };

  // 5. Nothing matched -- ambiguous
  return { type: 'other', confidence: 'low' };
}
```

### Pattern 4: Supply Chain Scanner Architecture

**What:** `runSupplyChainChecks(cwd, sha, diff)` orchestrates 6 sub-check functions, each returning findings or null.

**Scan sequence (matches CONTEXT.md priority order):**
```javascript
function runSupplyChainChecks(cwd, sha, diff, files) {
  const findings = [];

  // Check 1 (ELEVATED -- runs first, highest display prominence)
  const promptRisk = checkPromptIntegrity(diff, files);
  if (promptRisk) findings.push({ check: 'prompt-integrity', severity: 'elevated', ...promptRisk });

  // Checks 2-6 (standard severity, run in order)
  const depRisk = checkDependencyDiff(diff, files);
  if (depRisk) findings.push({ check: 'dependency-diff', severity: 'high', ...depRisk });

  const execRisk = checkExecutionPath(files);
  if (execRisk) findings.push({ check: 'execution-path', severity: 'high', ...execRisk });

  const netRisk = checkNetworkEndpoints(diff);
  if (netRisk) findings.push({ check: 'network-endpoints', severity: 'medium', ...netRisk });

  const obfRisk = checkObfuscation(diff, files);
  if (obfRisk) findings.push({ check: 'obfuscation', severity: 'high', ...obfRisk });

  // Check 6 needs persistent author history
  const cacheDir = path.join(os.homedir(), '.claude', 'cache');
  const knownAuthors = loadKnownAuthors(cacheDir);
  const authorRisk = checkAuthorAnomaly(sha, cwd, knownAuthors);
  if (!authorRisk.isKnown) findings.push({ check: 'author-anomaly', severity: 'medium', ...authorRisk });

  return findings;
}
```

**Diff acquisition for supply chain checks:**
Supply chain checks need the raw diff text. `cmdSyncPreview` already calls `spawnGit(cwd, ['diff', '--color=always', '--stat', ...])` per commit. The supply chain scanner needs `git show` or `git diff` without `--stat` -- full patch text. Extend `cmdSyncPreview` to fetch the full diff once per commit and pass it to `runSupplyChainChecks`.

```javascript
// In cmdSyncPreview, per-commit:
const diffResult = spawnGit(cwd, ['show', '--format=', commit.hash]);
const diff = diffResult.exitCode === 0 ? diffResult.stdout : '';
const supplyChainRisks = runSupplyChainChecks(cwd, commit.hash, diff, enrichedFiles);
```

### Pattern 5: gsd.role Config Integration

**Critical finding:** `gsd.role` is read in `gsd-statusline.js` via `getConfigValue(config, 'gsd.role', 'consumer')`, but the `ConfigSchema.js` has `additionalProperties: false` at the top level with no `gsd` property defined. This means any `gsd` key in `~/.gsd/config.json` would cause a schema validation error. Currently the role always falls back to `'consumer'` (the default) because the schema rejects the key.

**Resolution required in Phase 21:** Add `gsd` section to `ConfigSchema.js` before relying on role detection in `gsd-check-update.js`. This is a pre-existing bug surfaced by Phase 21's reliance on role detection.

```javascript
// ConfigSchema.js addition:
gsd: {
  type: 'object',
  properties: {
    role: { type: 'string', enum: ['consumer', 'maintainer'], default: 'consumer' }
  },
  additionalProperties: false
}
```

### Anti-Patterns to Avoid

- **Running supply chain checks in the background hook:** Diff content is expensive to fetch. The hook runs at every session start. Only metadata (count, severity) belongs in the background; full diff analysis belongs in the on-demand workflow.
- **Blocking on supply chain findings:** CONTEXT explicitly says findings are surfaced, not blocking. Never exit non-zero based on supply chain results in sync-preview.
- **Re-requiring sync.cjs in tests:** The bun coverage pitfall. All new functions must be exported and tested via direct import, same as existing sync.cjs functions.
- **Using execGit() for git commands with special chars:** Known Windows MINGW64 pitfall. Use `spawnGit()` for any git command involving `^`, `%`, `|`, `*`, or messages with spaces.
- **Hardcoding author history in memory:** The author Set must persist to a JSON cache file. A non-persistent Set resets on every session, making anomaly detection useless.
- **Over-sensitive regex patterns for obfuscation/injection:** False positives on common coding patterns (long JSON strings, valid base64 in tests, prompt-style comments in workflow files) will erode trust. Start conservative and tune.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Git subprocess calls with special chars | Custom shell escaping logic | `spawnGit(cwd, args)` (already in sync.cjs) | Windows MINGW64 breaks shell-quoted args; spawnSync array form is the established fix |
| Cache file TTL check | Re-implement timestamp math | Check `checked` field in existing cache JSON: `Date.now()/1000 - cache.checked > 4*3600` | One-liner; cache schema is already established |
| Conventional commit parsing | Full grammar parser | Simple regex: `/^(feat|fix|refactor|docs|chore|test|perf|style)(\(.+\))?:/` | CC format is a simple prefix convention, not a grammar |
| Diff fetching per commit | Custom diff infrastructure | `spawnGit(cwd, ['show', '--format=', sha])` | `git show` gives full patch; `--format=` suppresses commit header |

**Key insight:** The entire Phase 21 stack is regex-over-text applied to git CLI output. No external parsing libraries, no new npm dependencies, no new infrastructure beyond one new cache file.

## Common Pitfalls

### Pitfall 1: ConfigSchema Does Not Have `gsd` Section

**What goes wrong:** `gsd-check-update.js` needs to know whether `gsd.role === 'maintainer'` to run the git-based check. The statusline already reads this value, but `ConfigSchema.js` has `additionalProperties: false` at the top level with no `gsd` property. If a user adds `gsd: { role: 'maintainer' }` to their `~/.gsd/config.json`, the schema validation throws and `loadConfig()` crashes, falling back to defaults.

**Why it happens:** The `gsd` section was not added to `ConfigSchema.js` when the role feature was introduced in Phase 2. The statusline works (role defaults to 'consumer') but role detection is effectively broken for maintainers.

**How to avoid:** Add `gsd` section to `ConfigSchema.js` as the first task of Phase 21. This is a prerequisite for all monitoring work.

**Warning signs:** `loadConfig()` throwing "Unknown config key: 'gsd'" when a user sets `gsd.role` in their config file.

### Pitfall 2: gsd-check-update.js Is a Detached Background Process

**What goes wrong:** The hook spawns a child process (`child.unref()`) and exits immediately. The background process does the actual git fetch and cache write. If you add logic to the hook's main process body that requires the cache to be current, it won't be.

**Why it happens:** The spawn-and-unref pattern is intentional: hooks must be non-blocking. The background check finishes asynchronously (seconds later).

**How to avoid:** All role detection and git fetch logic goes inside the spawn callback string, not in the hook's main body. The hook body only ensures the background process starts. The statusline reads stale cache and triggers a re-fetch on the NEXT session start (4hr TTL design).

**Warning signs:** Logic in hook body that assumes cache is fresh immediately after the hook runs.

### Pitfall 3: `git show --format=` Produces Large Output for Big Commits

**What goes wrong:** `git show` on a commit that touches 50+ files produces megabytes of diff text. Running supply chain checks on this in a sync-preview with 20+ commits could take seconds and produce unusably large output.

**Why it happens:** The supply chain scanner reads full diff text per commit to do pattern matching.

**How to avoid:** Cap diff size: check `result.stdout.length` before passing to supply chain checks. If diff > 500KB, skip obfuscation/injection pattern matching and flag the commit as "diff too large to scan" with a note to inspect manually. The prompt integrity check (file path based) and dependency diff check (package.json/lockfile path based) still run since they only need file lists.

**Warning signs:** sync-preview hanging on commits that touch generated files or large data files.

### Pitfall 4: Author Anomaly Detection False-Positive Rate

**What goes wrong:** If the author history cache is empty (first run), EVERY commit will be flagged as "unknown author." This produces a wall of false positives that users ignore.

**Why it happens:** The history file doesn't exist on first run, so the known-authors Set is empty.

**How to avoid:** On first run (empty/missing author cache), seed the cache from the existing git log of the fork repo: `git log --format='%an <%ae>' | sort -u`. This gives a baseline of known authors before Phase 21 adds any new upstream commits. Document this seeding behavior explicitly in the implementation.

**Warning signs:** All commits in first `/gsd:upstream` run being flagged as author anomalies.

### Pitfall 5: Prompt Integrity False Positives on Legitimate Workflow Changes

**What goes wrong:** The Prompt Integrity Scanner triggers on ANY `.md` file change in `workflows/`, `agents/`, `commands/`, `templates/`. Legitimate workflow improvements (adding a new command option, fixing a typo, adding a step) get flagged alongside actual injection attacks.

**Why it happens:** The scanner is file-path triggered, not content-triggered. Many legitimate changes modify these paths.

**How to avoid:** The ELEVATED flag should trigger when the file-path check AND at least one content check matches. File-path alone = informational note, not elevated risk. Content checks (tool list changes, guardrail removal, hidden Unicode, injection patterns) trigger the elevated severity. Show the specific triggering line in the diff (Layer 2 auto-expand behavior per CONTEXT.md).

**Warning signs:** Every upstream commit touching documentation being flagged as ELEVATED.

## Code Examples

Verified patterns from existing codebase:

### Reading TTL Cache (gsd-check-update.js pattern)
```javascript
// Source: hooks/gsd-check-update.js + gsd-statusline.js (existing)
// Cache path:
const cacheFile = path.join(homeDir, '.claude', 'cache', 'gsd-update-check.json');

// In statusline (read cache, check if stale):
const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
const FOUR_HOURS_SECS = 4 * 60 * 60;
const isStale = (Math.floor(Date.now() / 1000) - cache.checked) > FOUR_HOURS_SECS;
// Statusline just reads the value; gsd-check-update.js rewrites if stale on next session start

// In gsd-check-update.js background process (write extended cache):
const result = {
  update_available: upstreamCount > 0,
  installed: localVersion,
  latest: 'upstream/main',
  checked: Math.floor(Date.now() / 1000),
  // maintainer-specific:
  upstream_count: upstreamCount,
  highest_severity: computeHighestSeverity(commitTypes),
  commit_summary: lightweightCommits  // subject + type only, no diffs
};
fs.writeFileSync(cacheFile, JSON.stringify(result));
```

### Fetching Git Upstream Count for Maintainer
```javascript
// Source pattern: spawnGit() in sync.cjs (existing)
// In background process (inside spawn callback string in gsd-check-update.js):
const fetch = execFileSync('git', ['fetch', 'upstream', 'main'],
  { encoding: 'utf8', timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'] });

const countResult = execFileSync('git', ['rev-list', '--count', 'HEAD..upstream/main'],
  { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
const upstreamCount = parseInt(countResult.trim(), 10) || 0;

const logResult = execFileSync('git',
  ['log', '--format=%h\x1f%s', 'HEAD..upstream/main'],
  { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
// Parse and classify each line for commit_summary and highest_severity
```

### Conventional Commit Classification
```javascript
// Source: derived from CONTEXT.md decisions + conventional commits spec
function classifyCommit(subject, files) {
  // Security first (highest priority)
  if (/\b(security|cve|vuln|exploit)\b/i.test(subject)) {
    return { type: 'security', confidence: 'high' };
  }
  // Breaking change
  if (/^[a-z]+(\(.+\))?!:/.test(subject) || /BREAKING[ -]CHANGE/i.test(subject)) {
    return { type: 'breaking', confidence: 'high' };
  }
  // Conventional prefix
  const m = subject.match(/^(feat|fix|refactor|docs|chore|test|perf|style)(\(.+\))?:/i);
  if (m) {
    const normalize = { test: 'chore', perf: 'refactor', style: 'chore' };
    const t = m[1].toLowerCase();
    return { type: normalize[t] || t, confidence: 'high' };
  }
  // File-path heuristics
  const paths = files.map(f => f.path);
  if (paths.some(p => /^docs\/|\.md$/i.test(p)) && !paths.some(p => /^bin\/|^hooks\//.test(p))) {
    return { type: 'docs', confidence: 'medium' };
  }
  if (paths.some(p => /^tests?\/|\.test\.|\.spec\./i.test(p))) {
    return { type: 'chore', confidence: 'medium' };
  }
  return { type: 'other', confidence: 'low' };
}
```

### Prompt Integrity Scanner (Check 1)
```javascript
// Source: derived from CONTEXT.md attack vector descriptions
// Execution directories where prompt content has elevated blast radius:
const PROMPT_DIRS = ['workflows/', 'agents/', 'commands/', 'templates/'];
const EXECUTION_MD = files.some(f =>
  f.path.endsWith('.md') && PROMPT_DIRS.some(d => f.path.startsWith(d))
);

if (!EXECUTION_MD) return null; // File-path gate: not in prompt-execution dirs

// Content checks on diff text (any one match = ELEVATED):
const INJECTION_PATTERNS = [
  /ignore previous instructions?/i,
  /override (your|all) instructions?/i,
  /new instructions?:/i,
  /you are now/i,
  /disregard/i
];
const HIDDEN_UNICODE = /[\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/;
const CREDENTIAL_EXPAND = /~\/\.ssh|~\/\.aws|\.env|credentials/;
const TOOL_CHANGE = /^[+-].*tools:/m;
const GUARDRAIL_REMOVAL = /^-.*\b(safe|blocked?|forbidden|disallow|prevent|restrict)\b/im;

const triggered = [];
for (const [name, re] of [
  ['injection-pattern', INJECTION_PATTERNS.some(p => p.test(diff))],
  ['hidden-unicode', HIDDEN_UNICODE.test(diff)],
  ['credential-expand', CREDENTIAL_EXPAND.test(diff)],
  ['tool-list-change', TOOL_CHANGE.test(diff)],
  ['guardrail-removal', GUARDRAIL_REMOVAL.test(diff)]
]) {
  if (re) triggered.push(name);
}

return triggered.length > 0
  ? { triggered, evidence: extractTriggerLines(diff, triggered) }
  : null; // File-path match but no content match = no finding (just informational)
```

### Author Anomaly Detection
```javascript
// Source: derived from CONTEXT.md (xz-utils pattern)
// Cache file path (alongside existing update-check cache):
const AUTHORS_CACHE = path.join(cacheDir, 'gsd-upstream-authors.json');

function loadKnownAuthors(cacheDir) {
  const file = path.join(cacheDir, 'gsd-upstream-authors.json');
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return new Set(data.authors || []);
  } catch {
    return new Set(); // First run: empty set, will be seeded
  }
}

function saveKnownAuthors(cacheDir, authorsSet) {
  const file = path.join(cacheDir, 'gsd-upstream-authors.json');
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ authors: [...authorsSet], updated: Date.now() }));
}

// Seeding on first run (when Set is empty):
function seedKnownAuthors(cwd, cacheDir) {
  const result = spawnGit(cwd, ['log', '--format=%an <%ae>']);
  if (result.exitCode === 0 && result.stdout) {
    const authors = new Set(result.stdout.split('\n').filter(Boolean));
    saveKnownAuthors(cacheDir, authors);
    return authors;
  }
  return new Set();
}
```

### Extended sync-preview --json Schema
```javascript
// Source: cmdSyncPreview in sync.cjs (existing), extended for Phase 21
// Each commit in the commits array gains 2 new fields:
{
  hash: 'abc1234...',
  hashShort: 'abc1234',
  subject: 'fix: typo in help text',
  date: '2026-02-25',
  author: 'glittercowboy',
  files: [...],
  conflictRisk: 'none',
  securityFlags: [],
  // NEW Phase 21 fields:
  classification: { type: 'fix', confidence: 'high' },
  supplyChainRisks: []  // array of { check, severity, evidence } or empty
}

// Summary object gains:
{
  totalCommits: 5,
  sensitivePathCount: 1,
  highRiskCount: 0,
  overlapRiskCount: 0,
  // NEW Phase 21 fields:
  byType: { feat: 1, fix: 3, docs: 0, chore: 1, other: 0, security: 0, breaking: 0 },
  supplyChainFindings: 2  // count of commits with at least one supply chain finding
}
```

### Statusline Notification Format (Extended)
```javascript
// Source: gsd-statusline.js lines 151-167 (existing), extended for Phase 21
// Existing code reads cache.update_available and formats line2.
// Phase 21: read cache.upstream_count + cache.highest_severity for richer message.

if (cache.update_available && gsdRole === 'maintainer') {
  const count = cache.upstream_count || 0;
  const severity = cache.highest_severity || 'chore';
  // Format: "N upstream (M fixes) | /gsd:upstream"
  // severity label pluralization: fix -> fixes, feat -> features, chore -> chores
  const severityLabel = { fix: 'fixes', feat: 'features', security: 'security fixes',
    breaking: 'breaking changes', chore: 'chores', other: 'changes' }[severity] || 'changes';
  const countLabel = count === 1 ? '1 commit' : `${count} commits`;
  line2 = theme.text.notice.render(
    `${countLabel} upstream (${severityLabel}) | /gsd:upstream`
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GPG verification of commit signatures | Content-based supply chain pattern matching | Phase 21 decision (CONTEXT.md) | GPG can't verify upstream keys in this scenario; content checks target real documented attack vectors |
| npm registry version check only | npm check (consumer) + git upstream check (maintainer) | Phase 21 | Maintainers need to know about upstream commits, not npm releases |
| Sync-preview shows sensitive paths only | Sync-preview shows sensitive paths + type classification + supply chain risks | Phase 21 | Richer context for cherry-pick decisions |

**Deprecated/outdated:**
- `SYNC-07` requirement text says "GPG verification" -- per CONTEXT.md this is superseded by supply chain checks. The requirement is satisfied by the 6-check scanner, not by GPG. Document this in the plan.

## Open Questions

1. **`gsd.role` config read in background process**
   - What we know: `gsd-check-update.js` spawns a child process using a string passed to `node -e`. The child process cannot require `ConfigLoader` because it runs in a subprocess without the project's node_modules on its path.
   - What's unclear: How does the background process access `gsd.role`? Option A: Read `~/.gsd/config.json` with JSON5 directly inside the child process string. Option B: The parent process reads the role before spawning and passes it as a variable in the spawn string (same as how `cacheFile`, `projectVersionFile`, `globalVersionFile` are injected via `${JSON.stringify(...)}`)
   - Recommendation: Option B (inject role via `${JSON.stringify(gsdRole)}` in the spawn string) matches the existing pattern in the hook. The parent process reads the role via `loadConfig()` before spawning.

2. **Where to classify commits for background monitoring vs on-demand workflow**
   - What we know: Background hook should not run heavy per-commit analysis (diff fetch + supply chain scan). The classification for background monitoring only needs subject + file list (no diff), which is lightweight.
   - What's unclear: Should the background hook classify all N upstream commits to compute `highest_severity`, or just parse subjects?
   - Recommendation: Background hook classifies using subject-only (conventional prefix parsing, no file-path heuristics -- file lists require `getFilesForCommit()` per commit which is too heavy for session-start). Subject-only classification is sufficient for `highest_severity` in the statusline hint.

3. **How to handle `git fetch upstream` failure in background**
   - What we know: The background process runs silently (`stdio: 'ignore'`). If upstream remote doesn't exist or network is down, the fetch fails silently.
   - What's unclear: Should fetch failure write a specific cache state (e.g., `fetch_failed: true`) vs leaving the cache stale?
   - Recommendation: On fetch failure, leave the existing cache file unchanged (if it exists) or write `{ update_available: false, upstream_count: 0, checked: timestamp, fetch_error: true }`. The statusline reads whatever is there. No special handling needed -- same TTL logic applies.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `hooks/gsd-check-update.js` -- background spawn pattern, cache schema, TTL not currently implemented (parent exits immediately; child writes cache asynchronously)
- Direct codebase inspection: `hooks/gsd-statusline.js` -- gsd.role reading, update notification format, theme system integration
- Direct codebase inspection: `get-stuff-done/bin/lib/sync.cjs` -- existing primitives: `getCommitsInRange()`, `getFilesForCommit()`, `isSensitivePath()`, `spawnGit()`, `cmdSyncPreview()` and its `--json` output schema
- Direct codebase inspection: `tests/sync.test.cjs` -- test pattern: direct function import + `createTempGitProject()` + `node:test` framework
- Direct codebase inspection: `src/config/ConfigSchema.js` -- `additionalProperties: false` at top level; no `gsd` section (identified bug)
- `.planning/phases/21-sync-intelligence/21-CONTEXT.md` -- all locked decisions, deferred items, and discretion areas
- `.planning/memory/shared/pitfalls.md` -- spawnGit() Windows pitfall and bun re-require coverage pitfall

### Secondary (MEDIUM confidence)
- Conventional Commits specification (https://www.conventionalcommits.org/en/v1.0.0/) -- prefix list, breaking change format -- training data verified against codebase usage patterns
- Real-world supply chain attack patterns cited in CONTEXT.md: event-stream, ua-parser-js, xz-utils, SolarWinds, colors.js -- patterns well-documented in public security literature

### Tertiary (LOW confidence)
- Exact base64 length threshold for "long base64 string" -- no canonical standard; recommendation of 200+ chars is calibrated from common encoding patterns (SHA-256 is 44 chars base64, reasonable keys/tokens are under 100 chars; 200 chars catches encoded payloads while avoiding false positives on common encoded strings)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components are existing codebase files with verified behavior
- Architecture: HIGH -- extension pattern is identical to Phase 20's sync.cjs additions; no new infrastructure
- Pitfalls: HIGH -- ConfigSchema bug verified by inspection; Windows spawnGit pitfall is documented in shared memory; bun coverage pitfall documented; author seeding false-positive risk is logic-derived
- Regex patterns (discretion area): MEDIUM -- patterns are derived from documented attack signatures and conventional commits spec; exact tuning requires testing against real upstream commits

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable domain -- git CLI and conventional commits spec don't change; regex tuning may need iteration during implementation)
