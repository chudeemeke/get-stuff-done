/**
 * Sync — CLI plumbing for upstream sync safety features
 *
 * Provides diff preview, checkpoint management, and effort estimation.
 * Designed as crash-recoverable plumbing: CLI data operations that the
 * workflow porcelain (upstream-sync.md) calls. State remains inspectable
 * even when Claude Code crashes mid-sync.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { execGit, output, error, safeReadFile } = require('./core.cjs');

/**
 * Execute a git command using spawnSync (array form, no shell escaping issues).
 * Used for git commands that have format strings with %, |, or other special chars.
 *
 * @param {string} cwd - Working directory
 * @param {string[]} args - Git arguments as array
 * @returns {{exitCode: number, stdout: string, stderr: string}}
 */
function spawnGit(cwd, args) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return {
    exitCode: result.status ?? 1,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  };
}

// ─── Internal Helpers (all exported for direct testability) ───────────────────

/**
 * Get commits in a git range as structured objects.
 * Uses %x1F (ASCII unit separator) as field delimiter to avoid pipe-in-subject issues.
 *
 * @param {string} cwd - Working directory
 * @param {string} baseRef - Base commit/ref (exclusive)
 * @param {string} targetRef - Target commit/ref (inclusive)
 * @returns {Array<{hash, hashShort, subject, date, author}>}
 */
function getCommitsInRange(cwd, baseRef, targetRef) {
  const SEP = '\x1f';
  // Use spawnGit (array form) to avoid shell escaping issues with % and | in format strings.
  // execGit builds a shell command string and single-quotes args with %, which breaks on Windows MINGW64.
  const result = spawnGit(cwd, [
    'log',
    '--format=%H\x1f%h\x1f%ad\x1f%an\x1f%s',
    '--date=iso',
    baseRef + '..' + targetRef,
  ]);

  if (result.exitCode !== 0 || !result.stdout) {
    return [];
  }

  const commits = [];
  for (const line of result.stdout.split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split(SEP);
    if (parts.length < 5) continue;
    commits.push({
      hash: parts[0],
      hashShort: parts[1],
      date: parts[2],
      author: parts[3],
      subject: parts.slice(4).join(SEP), // re-join if subject itself had SEP (very rare)
    });
  }

  return commits;
}

/**
 * Get files changed in a specific commit.
 * Uses git diff-tree for reliable name-status output.
 *
 * @param {string} cwd - Working directory
 * @param {string} sha - Commit SHA
 * @returns {Array<{status, path}>}
 */
function getFilesForCommit(cwd, sha) {
  // Use --root to handle the initial commit (no parent) correctly.
  // spawnGit avoids shell escaping issues.
  const result = spawnGit(cwd, [
    'diff-tree',
    '--no-commit-id',
    '--root',
    '-r',
    '--name-status',
    sha,
  ]);

  if (result.exitCode !== 0 || !result.stdout) {
    return [];
  }

  const files = [];
  for (const line of result.stdout.split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length < 2) continue;
    files.push({
      status: parts[0].trim(),
      path: parts[parts.length - 1].trim(), // use last part (handles rename: A\told\tnew)
    });
  }

  return files;
}

/**
 * Load protected paths from branding-map.json.
 * Extracts fork-side path strings for sensitive path detection.
 *
 * @param {string} cwd - Working directory
 * @returns {string[]} Flat array of protected path strings
 */
function loadProtectedPaths(cwd) {
  const mapPath = path.join(cwd, '.planning', 'sync', 'branding-map.json');
  const raw = safeReadFile(mapPath);
  if (!raw) return [];

  let map;
  try {
    map = JSON.parse(raw);
  } catch {
    return [];
  }

  const paths = [];

  // Extract fork values from all pattern arrays
  const patternSections = [
    'path_patterns',
    'npm_patterns',
    'github_patterns',
    'display_name_patterns',
  ];

  for (const section of patternSections) {
    if (Array.isArray(map[section])) {
      for (const entry of map[section]) {
        if (entry && typeof entry.fork === 'string') {
          paths.push(entry.fork);
        }
      }
    }
  }

  // Also include any top-level flat arrays of protected fields/paths
  const flatSections = ['package_json_protected_fields', 'post_module_split_only'];
  for (const section of flatSections) {
    if (Array.isArray(map[section])) {
      for (const entry of map[section]) {
        if (typeof entry === 'string') {
          paths.push(entry);
        } else if (entry && typeof entry.fork === 'string') {
          paths.push(entry.fork);
        }
      }
    }
  }

  return paths;
}

/**
 * Check if a file path is sensitive (matches any protected path pattern).
 *
 * @param {string} filePath - File path to check
 * @param {string[]} protectedPaths - Array of protected path strings
 * @returns {boolean}
 */
function isSensitivePath(filePath, protectedPaths) {
  for (const protected_ of protectedPaths) {
    if (!protected_) continue;
    // Exact match
    if (filePath === protected_) return true;
    // Prefix match (file is inside protected directory)
    if (filePath.startsWith(protected_ + '/') || filePath.startsWith(protected_ + '\\')) return true;
    // Substring match (handles package names in paths like @chude/get-stuff-done)
    if (filePath.includes(protected_)) return true;
  }
  return false;
}

/**
 * Assess conflict risk by checking for overlap with dirty working tree files.
 * A commit touching a file that is currently modified indicates risk.
 *
 * @param {string} cwd - Working directory
 * @param {Array<{path}>} commitFiles - Files changed in commits being previewed
 * @returns {'none'|'overlap'}
 */
function assessConflictRiskByOverlap(cwd, commitFiles) {
  const dirtyResult = execGit(cwd, ['status', '--short']);
  if (dirtyResult.exitCode !== 0 || !dirtyResult.stdout) {
    return 'none';
  }

  const dirtyFiles = new Set();
  for (const line of dirtyResult.stdout.split('\n')) {
    if (!line.trim()) continue;
    // git status --short: "XY filename" or "XY old -> new"
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2) {
      dirtyFiles.add(parts[parts.length - 1]);
    }
  }

  if (dirtyFiles.size === 0) return 'none';

  for (const file of commitFiles) {
    if (dirtyFiles.has(file.path)) return 'overlap';
  }

  return 'none';
}

/**
 * Compute effort estimate from historical sync manifest data.
 * Uses past conflict rate to predict effort for pending commits.
 *
 * @param {string} cwd - Working directory
 * @param {number} pendingCount - Number of commits to be synced
 * @returns {{historicalConflictRate, estimatedConflicts, estimatedCleanCommits, dataPoints}|null}
 */
function computeEffortEstimate(cwd, pendingCount) {
  const manifestPath = path.join(cwd, '.planning', 'sync', 'sync-manifest.json');
  const raw = safeReadFile(manifestPath);
  if (!raw) {
    return {
      historicalConflictRate: null,
      estimatedConflicts: null,
      estimatedCleanCommits: null,
      dataPoints: 0,
    };
  }

  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch {
    return {
      historicalConflictRate: null,
      estimatedConflicts: null,
      estimatedCleanCommits: null,
      dataPoints: 0,
    };
  }

  const applied = Array.isArray(manifest.applied) ? manifest.applied : [];
  const dataPoints = applied.length;

  if (dataPoints === 0) {
    return {
      historicalConflictRate: null,
      estimatedConflicts: null,
      estimatedCleanCommits: null,
      dataPoints: 0,
    };
  }

  const conflictCount = applied.filter(
    entry => entry.conflictType && entry.conflictType !== 'none'
  ).length;

  const historicalConflictRate = conflictCount / dataPoints;
  const estimatedConflicts = Math.round(pendingCount * historicalConflictRate);
  const estimatedCleanCommits = pendingCount - estimatedConflicts;

  return {
    historicalConflictRate,
    estimatedConflicts,
    estimatedCleanCommits,
    dataPoints,
  };
}

// ─── Commit Classification ────────────────────────────────────────────────────

/**
 * Classify a commit by subject and changed files into a semantic type.
 *
 * Classification precedence (highest to lowest):
 *   1. Security keywords in subject
 *   2. Breaking change marker (! or BREAKING CHANGE)
 *   3. Conventional commit prefix (feat, fix, refactor, docs, chore, test, perf, style)
 *   4. File-path heuristics (docs/, tests/, bin/, hooks/)
 *   5. Fallback: 'other'
 *
 * @param {string} subject - Commit subject line
 * @param {Array<{path: string}>} files - Files changed in the commit
 * @returns {{type: string, confidence: 'high'|'medium'|'low'}}
 */
function classifyCommit(subject, files) {
  const subjectStr = typeof subject === 'string' ? subject : '';

  // Tier 1: Security keywords (highest priority)
  const SECURITY_RE = /\b(security|cve|vuln|exploit|xss|sqli|rce|injection)\b/i;
  if (SECURITY_RE.test(subjectStr)) {
    return { type: 'security', confidence: 'high' };
  }

  // Tier 2: Breaking change markers
  // Matches "feat!:" or "feat(scope)!:" or bare "BREAKING CHANGE" keyword
  const BREAKING_PREFIX_RE = /^[a-z]+(\(.+\))?!:/;
  if (BREAKING_PREFIX_RE.test(subjectStr) || subjectStr.includes('BREAKING CHANGE')) {
    return { type: 'breaking', confidence: 'high' };
  }

  // Tier 3: Conventional commit prefix
  const CONVENTIONAL_RE = /^(feat|fix|refactor|docs|chore|test|perf|style)(\(.+\))?:/i;
  const convMatch = subjectStr.match(CONVENTIONAL_RE);
  if (convMatch) {
    const prefix = convMatch[1].toLowerCase();
    // Normalize aliases
    let type = prefix;
    if (prefix === 'test' || prefix === 'style') type = 'chore';
    if (prefix === 'perf') type = 'refactor';
    return { type, confidence: 'high' };
  }

  // Tier 4: File-path heuristics (fallback when no conventional prefix)
  const filePaths = Array.isArray(files) ? files.map(f => f && f.path || '') : [];

  // docs/ or .md extension files (but not bin/ or hooks/)
  const hasDocs = filePaths.some(p => {
    if (p.startsWith('bin/') || p.startsWith('hooks/')) return false;
    return p.startsWith('docs/') || p.endsWith('.md');
  });
  if (hasDocs) {
    return { type: 'docs', confidence: 'medium' };
  }

  // tests/ or .test. or .spec. files (but not bin/ or hooks/)
  const hasTest = filePaths.some(p => {
    if (p.startsWith('bin/') || p.startsWith('hooks/')) return false;
    return p.startsWith('tests/') || p.includes('.test.') || p.includes('.spec.');
  });
  if (hasTest) {
    return { type: 'chore', confidence: 'medium' };
  }

  // bin/ or hooks/ files
  const hasBinOrHooks = filePaths.some(p => p.startsWith('bin/') || p.startsWith('hooks/'));
  if (hasBinOrHooks) {
    return { type: 'feat', confidence: 'low' };
  }

  // Tier 5: Fallback
  return { type: 'other', confidence: 'low' };
}

// ─── Supply Chain Scanner ─────────────────────────────────────────────────────

/**
 * Extract lines from diff text that contain a given pattern.
 * Returns up to 5 matching lines as evidence strings.
 *
 * @param {string} diff - Full diff text
 * @param {RegExp[]} patterns - Patterns to search for
 * @returns {string[]}
 */
function extractEvidenceLines(diff, patterns) {
  const evidence = [];
  for (const line of diff.split('\n')) {
    if (evidence.length >= 5) break;
    for (const re of patterns) {
      if (re.test(line)) {
        evidence.push(line.slice(0, 200)); // cap line length
        break;
      }
    }
  }
  return evidence;
}

/**
 * Check 1: Prompt Integrity Scanner
 *
 * Detects potential prompt injection attacks targeting AI execution files.
 * ELEVATED severity. Requires BOTH file-path AND content check to trigger.
 *
 * @param {string} diff - Full diff text
 * @param {Array<{path: string}>} files - Files changed in commit
 * @returns {{triggered: string[], evidence: string[]}|null}
 */
function checkPromptIntegrity(diff, files) {
  const PROMPT_DIRS = ['workflows/', 'agents/', 'commands/', 'templates/'];

  // File-path gate: at least one .md file in a PROMPT_DIR required
  const hasPromptFile = files.some(f =>
    f.path && f.path.endsWith('.md') && PROMPT_DIRS.some(d => f.path.startsWith(d))
  );
  if (!hasPromptFile) return null;

  // Content checks (any ONE match elevates the finding)
  const INJECTION_PATTERNS = [
    /ignore previous instructions?/i,
    /override (your|all) instructions?/i,
    /new instructions?:/i,
    /you are now/i,
    /disregard/i,
  ];
  const HIDDEN_UNICODE = /[\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/;
  const CREDENTIAL_EXPAND = /~\/\.ssh|~\/\.aws|\.env|credentials/i;
  const TOOL_CHANGE = /^[+-].*tools:/m;
  const GUARDRAIL_REMOVAL = /^-.*\b(safe|blocked?|forbidden|disallow|prevent|restrict)\b/im;

  const triggered = [];
  const evidence = [];

  if (INJECTION_PATTERNS.some(p => p.test(diff))) {
    triggered.push('injection-pattern');
    evidence.push(...extractEvidenceLines(diff, INJECTION_PATTERNS));
  }
  if (HIDDEN_UNICODE.test(diff)) {
    triggered.push('hidden-unicode');
    evidence.push(...extractEvidenceLines(diff, [HIDDEN_UNICODE]));
  }
  if (CREDENTIAL_EXPAND.test(diff)) {
    triggered.push('credential-expand');
    evidence.push(...extractEvidenceLines(diff, [CREDENTIAL_EXPAND]));
  }
  if (TOOL_CHANGE.test(diff)) {
    triggered.push('tool-list-change');
    evidence.push(...extractEvidenceLines(diff, [TOOL_CHANGE]));
  }
  if (GUARDRAIL_REMOVAL.test(diff)) {
    triggered.push('guardrail-removal');
    evidence.push(...extractEvidenceLines(diff, [GUARDRAIL_REMOVAL]));
  }

  if (triggered.length === 0) return null;
  return { triggered, evidence: evidence.slice(0, 5) };
}

/**
 * Check 2: Dependency Diff Guard
 *
 * Detects changes to package dependencies or new import/require statements.
 *
 * @param {string} diff - Full diff text
 * @param {Array<{path: string}>} files - Files changed in commit
 * @returns {{triggered: string[], evidence: string[]}|null}
 */
function checkDependencyDiff(diff, files) {
  const DEP_FILES = ['package.json', 'bun.lock', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];

  const hasDepFile = files.some(f => f.path && DEP_FILES.some(d => f.path.endsWith(d)));
  const hasNewRequire = /^\+.*\brequire\s*\(/m.test(diff);
  const hasNewImport = /^\+.*\bimport\s+/m.test(diff);

  if (!hasDepFile && !hasNewRequire && !hasNewImport) return null;

  const triggered = [];
  const evidence = [];

  if (hasDepFile) {
    // Parse package.json additions/removals/changes
    const addedPkgs = diff.match(/^\+\s+"[^"]+"\s*:/gm) || [];
    const removedPkgs = diff.match(/^-\s+"[^"]+"\s*:/gm) || [];
    if (addedPkgs.length > 0) {
      triggered.push('dependency-added');
      evidence.push(...addedPkgs.slice(0, 3).map(l => l.trim()));
    }
    if (removedPkgs.length > 0) {
      triggered.push('dependency-removed');
      evidence.push(...removedPkgs.slice(0, 3).map(l => l.trim()));
    }
    if (triggered.length === 0) {
      // Lockfile or other dep file change with no clear pkg lines
      triggered.push('dependency-file-changed');
      evidence.push(...files.filter(f => DEP_FILES.some(d => f.path.endsWith(d))).map(f => f.path));
    }
  }
  if (hasNewRequire) {
    triggered.push('new-require');
    evidence.push(...extractEvidenceLines(diff, [/^\+.*\brequire\s*\(/m]));
  }
  if (hasNewImport) {
    triggered.push('new-import');
    evidence.push(...extractEvidenceLines(diff, [/^\+.*\bimport\s+/m]));
  }

  return { triggered, evidence: evidence.slice(0, 5) };
}

/**
 * Check 3: Execution Path Sentinel
 *
 * Detects commits touching install scripts, hooks, executables, or CI configs.
 * File-path only check -- runs even on large diffs.
 *
 * @param {Array<{path: string}>} files - Files changed in commit
 * @returns {{triggered: string[], evidence: string[]}|null}
 */
function checkExecutionPath(files) {
  const EXEC_PATTERNS = [
    /^bin\//,
    /^hooks\//,
    /^scripts\//,
    /^\.github\/workflows\//,
    /^\.github\/actions\//,
    /^Makefile$/,
    /^Dockerfile/,
    /install/i,
  ];

  const matchingFiles = files.filter(f =>
    f.path && EXEC_PATTERNS.some(p => p.test(f.path))
  );

  if (matchingFiles.length === 0) return null;

  return {
    triggered: ['execution-path-changed'],
    evidence: matchingFiles.map(f => f.path),
  };
}

/**
 * Check 4: Network Endpoint Audit
 *
 * Detects new URLs, fetch/http calls, and network-related additions.
 * Only flags lines starting with + (additions, not removals).
 *
 * @param {string} diff - Full diff text
 * @returns {{triggered: string[], evidence: string[]}|null}
 */
function checkNetworkEndpoints(diff) {
  const NET_PATTERNS = [
    { name: 'fetch-call', re: /^\+.*\bfetch\s*\(/m },
    { name: 'http-request', re: /^\+.*\bhttp\.request\s*\(/m },
    { name: 'http-get', re: /^\+.*\bhttp\.get\s*\(/m },
    { name: 'new-url', re: /^\+.*\bnew\s+URL\s*\(/m },
    { name: 'axios', re: /^\+.*\baxios\b/m },
    { name: 'xhr', re: /^\+.*\bXMLHttpRequest\b/m },
    { name: 'url-literal', re: /^\+.*https?:\/\/[^\s'")\]]+/m },
  ];

  const triggered = [];
  const evidence = [];

  for (const { name, re } of NET_PATTERNS) {
    if (re.test(diff)) {
      triggered.push(name);
      evidence.push(...extractEvidenceLines(diff, [re]));
    }
  }

  if (triggered.length === 0) return null;
  return { triggered, evidence: evidence.slice(0, 5) };
}

/**
 * Check 5: Obfuscation Detector
 *
 * Detects eval(), new Function(), long base64 strings, and hex payloads.
 * Only checks lines starting with + (additions).
 *
 * @param {string} diff - Full diff text
 * @param {Array<{path: string}>} files - Files changed in commit
 * @returns {{triggered: string[], evidence: string[]}|null}
 */
function checkObfuscation(diff, files) {
  // Only examine added lines
  const addedLines = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));

  const OBF_PATTERNS = [
    { name: 'eval', re: /\beval\s*\(/ },
    { name: 'dynamic-function', re: /\bnew\s+Function\s*\(/ },
    { name: 'base64-payload', re: /[A-Za-z0-9+/=]{200,}/ },
    { name: 'hex-payload', re: /(?:\\x[0-9a-fA-F]{2}){11,}/ },
  ];

  const triggered = [];
  const evidence = [];

  for (const { name, re } of OBF_PATTERNS) {
    const matchingLines = addedLines.filter(l => re.test(l));
    if (matchingLines.length > 0) {
      triggered.push(name);
      evidence.push(...matchingLines.slice(0, 2).map(l => l.slice(0, 200)));
    }
  }

  if (triggered.length === 0) return null;
  return { triggered, evidence: evidence.slice(0, 5) };
}

/**
 * Check 6: Author Anomaly Detection (pure function, stateless)
 *
 * Checks if a commit author is in the known authors set.
 *
 * @param {string} authorString - "Name <email>" format
 * @param {Set<string>} knownAuthors - Set of known author strings
 * @returns {{isKnown: boolean, author?: string}}
 */
function checkAuthorAnomaly(authorString, knownAuthors) {
  if (knownAuthors.has(authorString)) {
    return { isKnown: true };
  }
  return { isKnown: false, author: authorString };
}

/**
 * Load known authors from persistent JSON cache.
 *
 * @param {string} cacheDir - Directory containing gsd-upstream-authors.json
 * @returns {Set<string>}
 */
function loadKnownAuthors(cacheDir) {
  const file = path.join(cacheDir, 'gsd-upstream-authors.json');
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return new Set(data.authors || []);
  } catch {
    return new Set();
  }
}

/**
 * Save known authors to persistent JSON cache.
 *
 * @param {string} cacheDir - Directory to write gsd-upstream-authors.json
 * @param {Set<string>} authorsSet - Authors to persist
 */
function saveKnownAuthors(cacheDir, authorsSet) {
  fs.mkdirSync(cacheDir, { recursive: true });
  const file = path.join(cacheDir, 'gsd-upstream-authors.json');
  fs.writeFileSync(file, JSON.stringify({ authors: [...authorsSet], updated: Date.now() }));
}

/**
 * Seed known authors from git log (used on first run when cache is empty).
 * Runs git log --format='%an <%ae>', deduplicates, and saves to cache.
 *
 * @param {string} cwd - Working directory (git repo)
 * @param {string} cacheDir - Directory to write gsd-upstream-authors.json
 * @returns {Set<string>}
 */
function seedKnownAuthors(cwd, cacheDir) {
  const result = spawnGit(cwd, ['log', '--format=%an <%ae>']);
  if (result.exitCode !== 0 || !result.stdout) {
    return new Set();
  }
  const authors = new Set(result.stdout.split('\n').filter(Boolean));
  saveKnownAuthors(cacheDir, authors);
  return authors;
}

/**
 * Orchestrate all 6 supply chain checks for a single commit.
 *
 * @param {string} diff - Full diff text from git show
 * @param {Array<{path: string}>} files - Files changed in commit
 * @param {string} authorString - Commit author "Name <email>"
 * @param {Set<string>} knownAuthors - Set of known author strings
 * @returns {Array<{check: string, severity: string, triggered: string[], evidence: string[]}>}
 */
function runSupplyChainChecks(diff, files, authorString, knownAuthors) {
  const findings = [];

  // Diff size guard: skip content-based checks for very large diffs (Pitfall 3)
  const diffTooLarge = diff.length > 500 * 1024;
  const safeDiff = diffTooLarge ? '' : diff;

  // Check 1 (ELEVATED -- primary check, highest display prominence)
  const promptRisk = checkPromptIntegrity(safeDiff, files);
  if (promptRisk) findings.push({ check: 'prompt-integrity', severity: 'elevated', ...promptRisk });

  // Check 2
  const depRisk = checkDependencyDiff(safeDiff, files);
  if (depRisk) findings.push({ check: 'dependency-diff', severity: 'high', ...depRisk });

  // Check 3 (file-path only -- runs even on large diffs)
  const execRisk = checkExecutionPath(files);
  if (execRisk) findings.push({ check: 'execution-path', severity: 'high', ...execRisk });

  // Check 4
  const netRisk = checkNetworkEndpoints(safeDiff);
  if (netRisk) findings.push({ check: 'network-endpoints', severity: 'medium', ...netRisk });

  // Check 5
  const obfRisk = checkObfuscation(safeDiff, files);
  if (obfRisk) findings.push({ check: 'obfuscation', severity: 'high', ...obfRisk });

  // Check 6 -- author anomaly (stateless check; caller manages cache)
  const authorResult = checkAuthorAnomaly(authorString, knownAuthors);
  if (!authorResult.isKnown) {
    findings.push({ check: 'author-anomaly', severity: 'medium', author: authorResult.author, triggered: ['unknown-author'], evidence: [authorResult.author] });
  }

  // If diff was too large, add an informational finding
  if (diffTooLarge) {
    findings.push({
      check: 'diff-size',
      severity: 'info',
      triggered: ['diff-too-large'],
      evidence: [`Diff is ${Math.round(diff.length / 1024)}KB, content checks skipped`],
    });
  }

  return findings;
}

// ─── Selective sync filtering ─────────────────────────────────────────────────

/**
 * Filter enriched commits by category inclusion/exclusion and individual SHA overrides.
 *
 * Precedence (per commit):
 *   1. Individual SHA --exclude overrides everything (force exclude)
 *   2. Individual SHA --include overrides category filters (force include)
 *   3. If categories provided and non-empty, only those types included
 *   4. If excludeCategories provided and non-empty, those types removed
 *   5. Both can combine: --category feat,fix --exclude feat gives only fix
 *
 * @param {Array<{hash, hashShort, classification: {type}}>} commits - Enriched commits
 * @param {{categories?: string[], excludeCategories?: string[], includeShas?: string[], excludeShas?: string[]}} filters
 * @returns {{selected: Array, excluded: Array}}
 */
function filterCommitsByCategory(commits, filters) {
  const { categories, excludeCategories, includeShas, excludeShas } = filters || {};

  // Build SHA override sets (lowercase for case-insensitive matching)
  const forceInclude = new Set((includeShas || []).map(s => s.toLowerCase()));
  const forceExclude = new Set((excludeShas || []).map(s => s.toLowerCase()));

  const selected = [];
  const excluded = [];

  for (const commit of commits) {
    const sha = commit.hashShort.toLowerCase();
    const fullSha = commit.hash.toLowerCase();
    const type = commit.classification.type;

    // Rule 1: Individual SHA --exclude overrides everything
    if (forceExclude.has(sha) || forceExclude.has(fullSha)) {
      excluded.push({ ...commit, excludeReason: 'sha-excluded' });
      continue;
    }

    // Rule 2: Individual SHA --include overrides category filters
    if (forceInclude.has(sha) || forceInclude.has(fullSha)) {
      selected.push(commit);
      continue;
    }

    // Rules 3-4: Category filtering
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

/**
 * Detect which bin/lib/*.cjs modules a commit's files touch.
 *
 * @param {Array<{path: string}>} files - File objects with path field
 * @returns {string[]} Module names (e.g., ['sync', 'state', 'core'])
 */
function detectModules(files) {
  const modules = new Set();
  for (const f of files) {
    const match = f.path.match(/(?:get-stuff-done\/)?bin\/lib\/([^/]+)\.cjs$/);
    if (match) {
      modules.add(match[1]);
    }
  }
  return [...modules];
}

/**
 * Check whether two sets of modules share any overlap or have unique entries.
 * Returns true if the module sets are different (cross-module relationship).
 *
 * @param {string[]} modulesA - Modules touched by commit A
 * @param {string[]} modulesB - Modules touched by commit B
 * @returns {boolean} true if module sets differ
 */
function isCrossModule(modulesA, modulesB) {
  const setA = new Set(modulesA);
  const setB = new Set(modulesB);
  return modulesB.some(m => !setA.has(m)) || modulesA.some(m => !setB.has(m));
}

/**
 * Detect file-overlap dependencies between chronologically ordered commits.
 * If commit B modifies a file also modified by an earlier commit A, B may depend on A.
 *
 * @param {Array<{hash, hashShort, files: Array<{path: string}>}>} commits - Chronological order
 * @returns {Array<{commit: string, dependsOn: string, reason: string, type: 'file-overlap', files: string[]}>}
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
          // Check if we already recorded this exact dependency pair for another file
          const existing = deps.find(
            d => d.commit === commit.hashShort && d.dependsOn === earlier.hashShort
          );
          if (existing) {
            // Append file to existing dependency
            existing.files.push(file.path);
            existing.reason = `Both modify ${existing.files.join(', ')}`;
          } else {
            deps.push({
              commit: commit.hashShort,
              dependsOn: earlier.hashShort,
              reason: `Both modify ${file.path}`,
              type: 'file-overlap',
              files: [file.path],
            });
          }
        }
      } else {
        fileToCommit.set(file.path, commit);
      }
    }
  }
  return deps;
}

// ─── CLI Commands ──────────────────────────────────────────────────────────────

/**
 * Preview commits in a range with diff stats, sensitive path flags, and effort estimate.
 *
 * @param {string} cwd - Working directory
 * @param {string} range - Commit range "baseRef..targetRef"
 * @param {{json: boolean}} options - Output options
 * @param {boolean} raw - Raw output flag
 */
function cmdSyncPreview(cwd, range, options, raw) {
  if (!range) {
    error('range required -- usage: sync-preview <baseRef..targetRef> [--json]');
  }

  // Parse range
  const sepIdx = range.indexOf('..');
  if (sepIdx === -1) {
    error('invalid range format -- expected "baseRef..targetRef"');
  }

  const baseRef = range.substring(0, sepIdx);
  const targetRef = range.substring(sepIdx + 2);

  if (!baseRef || !targetRef) {
    error('invalid range format -- both baseRef and targetRef required');
  }

  // Validate both refs exist
  // Use spawnGit: short SHAs may not match the safe-char regex in execGit
  const baseCheck = spawnGit(cwd, ['cat-file', '-t', baseRef]);
  if (baseCheck.exitCode !== 0) {
    error('SHA not found -- run git fetch upstream main first');
  }

  const targetCheck = spawnGit(cwd, ['cat-file', '-t', targetRef]);
  if (targetCheck.exitCode !== 0) {
    error('SHA not found -- run git fetch upstream main first');
  }

  // Get commits in range
  const commits = getCommitsInRange(cwd, baseRef, targetRef);

  // Load protected paths
  const protectedPaths = loadProtectedPaths(cwd);

  // Load known authors for supply chain author anomaly detection
  const cacheDir = path.join(os.homedir(), '.claude', 'cache');
  let knownAuthors = loadKnownAuthors(cacheDir);
  if (knownAuthors.size === 0) {
    knownAuthors = seedKnownAuthors(cwd, cacheDir);
  }

  // Build per-commit data
  const allCommitFiles = [];
  const enrichedCommits = [];
  const newAuthors = new Set();

  for (const commit of commits) {
    const files = getFilesForCommit(cwd, commit.hash);
    allCommitFiles.push(...files);

    const enrichedFiles = files.map(f => ({
      path: f.path,
      status: f.status,
      sensitive: isSensitivePath(f.path, protectedPaths),
    }));

    const sensitiveFiles = enrichedFiles.filter(f => f.sensitive);
    const conflictRisk = assessConflictRiskByOverlap(cwd, files);
    const classification = classifyCommit(commit.subject, enrichedFiles);

    // Fetch full diff for supply chain analysis
    const diffResult = spawnGit(cwd, ['show', '--format=', commit.hash]);
    const diff = diffResult.exitCode === 0 ? diffResult.stdout : '';
    const supplyChainRisks = runSupplyChainChecks(diff, enrichedFiles, commit.author, knownAuthors);

    // Track new authors for cache update after loop
    if (!knownAuthors.has(commit.author)) {
      newAuthors.add(commit.author);
    }

    enrichedCommits.push({
      hash: commit.hash,
      hashShort: commit.hashShort,
      subject: commit.subject,
      date: commit.date,
      author: commit.author,
      files: enrichedFiles,
      conflictRisk,
      securityFlags: sensitiveFiles.map(f => f.path),
      classification,
      supplyChainRisks,
    });
  }

  // Persist any new authors encountered to the cache
  if (newAuthors.size > 0) {
    for (const author of newAuthors) {
      knownAuthors.add(author);
    }
    saveKnownAuthors(cacheDir, knownAuthors);
  }

  // Effort estimate
  const effortEstimate = computeEffortEstimate(cwd, commits.length);

  // Summary stats
  const sensitivePathCount = enrichedCommits.reduce(
    (acc, c) => acc + c.securityFlags.length,
    0
  );
  const highRiskCount = enrichedCommits.filter(
    c => c.conflictRisk === 'confirmed'
  ).length;
  const overlapRiskCount = enrichedCommits.filter(
    c => c.conflictRisk === 'overlap'
  ).length;

  // Compute byType summary from classifications
  const byType = { feat: 0, fix: 0, docs: 0, chore: 0, refactor: 0, other: 0, security: 0, breaking: 0 };
  for (const c of enrichedCommits) {
    const t = c.classification.type;
    if (t in byType) byType[t]++;
    else byType.other++;
  }

  const supplyChainFindings = enrichedCommits.filter(c => c.supplyChainRisks.length > 0).length;

  if (options && options.json) {
    // JSON output path: structured schema
    const result = {
      range,
      commits: enrichedCommits,
      summary: {
        totalCommits: commits.length,
        sensitivePathCount,
        highRiskCount,
        overlapRiskCount,
        byType,
        supplyChainFindings,
      },
      effortEstimate,
    };
    output(result, raw);
    return;
  }

  // Human-readable colorized output
  const RESET = '\x1b[0m';
  const BOLD = '\x1b[1m';
  const RED = '\x1b[31m';
  const YELLOW = '\x1b[33m';
  const CYAN = '\x1b[36m';
  const GREEN = '\x1b[32m';
  const DIM = '\x1b[2m';

  // Map classification type to ANSI color for type badge
  function typeBadgeColor(type) {
    if (type === 'security' || type === 'breaking') return RED;
    if (type === 'fix') return YELLOW;
    if (type === 'feat') return GREEN;
    return DIM; // docs, chore, refactor, other
  }

  let out = '';
  out += BOLD + 'Sync Preview: ' + range + RESET + '\n';
  out += CYAN + `${commits.length} commits` + RESET;
  if (sensitivePathCount > 0) {
    out += ' | ' + YELLOW + `${sensitivePathCount} sensitive paths` + RESET;
  }
  out += '\n\n';

  for (const commit of enrichedCommits) {
    const { type } = commit.classification;
    const badgeColor = typeBadgeColor(type);
    out += BOLD + commit.hashShort + RESET + ' ' + badgeColor + '[' + type + ']' + RESET + ' ' + commit.subject + '\n';
    out += '  ' + commit.date + ' by ' + commit.author + '\n';

    if (commit.conflictRisk === 'overlap') {
      out += '  ' + RED + '[OVERLAP RISK]' + RESET + ' Files overlap with dirty working tree\n';
    }

    // Get stat summary for this commit
    // Use spawnGit for parent check and diff stat: caret ^ is not safe for shell escaping in execGit
    const parentCheck = spawnGit(cwd, ['rev-parse', commit.hash + '^']);
    if (parentCheck.exitCode === 0) {
      const statResult = spawnGit(cwd, [
        'diff',
        '--color=always',
        '--stat',
        commit.hash + '^..' + commit.hash,
      ]);
      if (statResult.exitCode === 0 && statResult.stdout) {
        const statLines = statResult.stdout.split('\n');
        for (const line of statLines) {
          // Flag sensitive paths with [!] marker
          const matchedSensitive = commit.files.find(
            f => f.sensitive && line.includes(f.path)
          );
          if (matchedSensitive) {
            out += '  ' + YELLOW + '[!]' + RESET + ' ' + line + '\n';
          } else {
            out += '  ' + line + '\n';
          }
        }
      }
    } else {
      // Root commit: list files directly
      for (const f of commit.files) {
        const prefix = f.sensitive ? YELLOW + '[!] ' + RESET : '    ';
        out += prefix + f.status + ' ' + f.path + '\n';
      }
    }

    // Supply chain risk badges
    if (commit.supplyChainRisks && commit.supplyChainRisks.length > 0) {
      for (const finding of commit.supplyChainRisks) {
        let badgeAnsi;
        if (finding.severity === 'elevated' || finding.severity === 'high') {
          badgeAnsi = RED;
        } else if (finding.severity === 'medium') {
          badgeAnsi = YELLOW;
        } else {
          badgeAnsi = DIM;
        }
        const evidenceSummary = finding.evidence && finding.evidence.length > 0
          ? finding.evidence[0].slice(0, 80)
          : '';
        out += '  ' + badgeAnsi + '[RISK:' + finding.check + ']' + RESET + ' ' + finding.severity;
        if (evidenceSummary) out += ': ' + evidenceSummary;
        out += '\n';
      }
    }

    out += '\n';
  }

  // Effort estimate section
  out += BOLD + '--- Effort Estimate ---' + RESET + '\n';
  if (effortEstimate && effortEstimate.historicalConflictRate !== null) {
    const rate = (effortEstimate.historicalConflictRate * 100).toFixed(1);
    out += `Historical conflict rate: ${rate}% (${effortEstimate.dataPoints} commits)\n`;
    out += GREEN + `  Estimated clean: ${effortEstimate.estimatedCleanCommits}` + RESET + '\n';
    if (effortEstimate.estimatedConflicts > 0) {
      out += YELLOW + `  Estimated conflicts: ${effortEstimate.estimatedConflicts}` + RESET + '\n';
    } else {
      out += `  Estimated conflicts: ${effortEstimate.estimatedConflicts}\n`;
    }
  } else {
    out += 'No historical conflict data available (run a sync first).\n';
  }

  const result = { rendered: out };
  output(result, raw, out);
}

/**
 * Create an annotated sync checkpoint tag at HEAD.
 *
 * @param {string} cwd - Working directory
 * @param {string} batchId - Batch identifier for the checkpoint
 * @param {boolean} raw - Raw output flag
 */
function cmdSyncCheckpointCreate(cwd, batchId, raw) {
  if (!batchId) {
    error('batchId required -- usage: sync-checkpoint create <batchId>');
  }

  const tagName = 'sync-checkpoint-' + batchId;

  // MUST use spawnGit (array form): the -m message contains spaces which execGit
  // single-quotes incorrectly on Windows MINGW64, causing "fatal: too many arguments".
  // MUST include -m flag: Windows Git Bash hangs waiting for editor without it.
  const tagResult = spawnGit(cwd, [
    'tag',
    '-a',
    tagName,
    '-m',
    'sync checkpoint before batch ' + batchId,
    'HEAD',
  ]);

  if (tagResult.exitCode !== 0) {
    error('Failed to create checkpoint tag: ' + tagResult.stderr);
  }

  const shaResult = spawnGit(cwd, ['rev-parse', 'HEAD']);
  const sha = shaResult.exitCode === 0 ? shaResult.stdout : null;

  const result = {
    tag: tagName,
    sha,
    created: new Date().toISOString(),
  };
  output(result, raw);
}

/**
 * List all active sync checkpoint tags.
 *
 * @param {string} cwd - Working directory
 * @param {boolean} raw - Raw output flag
 */
function cmdSyncCheckpointList(cwd, raw) {
  // Use spawnGit: glob pattern 'sync-checkpoint-*' contains * which execGit would single-quote
  const listResult = spawnGit(cwd, ['tag', '-l', 'sync-checkpoint-*']);

  const checkpoints = [];

  if (listResult.exitCode === 0 && listResult.stdout) {
    const tags = listResult.stdout.split('\n').filter(t => t.trim());
    for (const tag of tags) {
      const shaResult = spawnGit(cwd, ['rev-list', '-1', tag]);
      const sha = shaResult.exitCode === 0 ? shaResult.stdout : null;
      checkpoints.push({ tag, sha });
    }
  }

  const result = { checkpoints, count: checkpoints.length };
  output(result, raw);
}

/**
 * Delete all sync checkpoint tags.
 *
 * @param {string} cwd - Working directory
 * @param {boolean} raw - Raw output flag
 */
function cmdSyncCheckpointCleanup(cwd, raw) {
  // Use spawnGit: glob pattern 'sync-checkpoint-*' contains * which execGit would single-quote
  const listResult = spawnGit(cwd, ['tag', '-l', 'sync-checkpoint-*']);

  const deleted = [];
  const failed = [];

  if (listResult.exitCode === 0 && listResult.stdout) {
    const tags = listResult.stdout.split('\n').filter(t => t.trim());
    for (const tag of tags) {
      const deleteResult = spawnGit(cwd, ['tag', '-d', tag]);
      if (deleteResult.exitCode === 0) {
        deleted.push(tag);
      } else {
        failed.push(tag);
      }
    }
  }

  const result = { deleted, failed, count: deleted.length };
  output(result, raw);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  // CLI commands
  cmdSyncPreview,
  cmdSyncCheckpointCreate,
  cmdSyncCheckpointList,
  cmdSyncCheckpointCleanup,
  // Internal helpers (exported for direct testability, avoids re-require coverage pitfall)
  getCommitsInRange,
  getFilesForCommit,
  loadProtectedPaths,
  isSensitivePath,
  assessConflictRiskByOverlap,
  computeEffortEstimate,
  classifyCommit,
  // Selective sync filtering
  filterCommitsByCategory,
  detectModules,
  isCrossModule,
  detectFileOverlapDeps,
  // Supply chain scanner
  checkPromptIntegrity,
  checkDependencyDiff,
  checkExecutionPath,
  checkNetworkEndpoints,
  checkObfuscation,
  checkAuthorAnomaly,
  runSupplyChainChecks,
  loadKnownAuthors,
  saveKnownAuthors,
  seedKnownAuthors,
};
