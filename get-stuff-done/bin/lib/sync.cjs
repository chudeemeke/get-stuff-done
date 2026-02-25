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

  // Build per-commit data
  const allCommitFiles = [];
  const enrichedCommits = [];

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
    });
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
};
