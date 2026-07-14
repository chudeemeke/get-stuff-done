'use strict';

/**
 * scripts/preview-update.js -- Read-Only Update Preview
 *
 * Phase 33 Plan 02: Implements UPD-01 through UPD-04.
 *
 * Terraform plan/apply pattern: this script previews what would change
 * if the upstream version were bumped. It modifies nothing.
 *
 * Usage:
 *   node scripts/preview-update.js
 *   bun run preview-update
 *
 * Exit codes:
 *   0 -- preview complete (or already up to date)
 *   1 -- npm view failed or unexpected error
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const {
  getActivePackageName,
  getAuthorityPathRelative,
  getBinRelativePath,
  getPackageDir,
} = require('./lib/upstream-source');

const PROJECT_ROOT = path.join(__dirname, '..');
const ACTIVE_UPSTREAM_PACKAGE = getActivePackageName();
const NPM_COMMAND = process.platform === 'win32'
  ? (process.env.ComSpec || 'cmd.exe')
  : 'npm';
const NPM_VIEW_ARGS = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'npm.cmd', 'view']
  : ['view'];

// ---------------------------------------------------------------------------
// UPD-01: Version diff
// ---------------------------------------------------------------------------

/**
 * Compare pinned upstream version against latest on npm.
 *
 * When called with no arguments, reads the pinned version from package.json
 * and queries npm for the latest version. When called with explicit versions,
 * returns the comparison result directly (used by tests).
 *
 * @param {string} [pinnedVersion]  Explicit pinned version (skips package.json read)
 * @param {string} [latestVersion]  Explicit latest version (skips npm view)
 * @returns {{ pinned: string, latest: string, hasUpdate: boolean }}
 */
function getVersionDelta(pinnedVersion, latestVersion) {
  const pinned = pinnedVersion || readPinnedVersion();
  const latest = latestVersion || queryLatestVersion();
  return {
    pinned,
    latest,
    hasUpdate: pinned !== latest,
  };
}

/**
 * Read the pinned upstream version from package.json devDependencies.
 *
 * @returns {string} Version string (e.g. '1.30.0')
 */
function readPinnedVersion() {
  const pkgPath = path.join(PROJECT_ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const version = pkg.devDependencies && pkg.devDependencies[ACTIVE_UPSTREAM_PACKAGE];
  if (!version) {
    throw new Error(`${ACTIVE_UPSTREAM_PACKAGE} not found in devDependencies`);
  }
  return version;
}

/**
 * Query npm registry for the latest version of the active upstream package.
 *
 * @returns {string} Latest version string
 */
function queryLatestVersion() {
  try {
    const result = execFileSync(NPM_COMMAND, [...NPM_VIEW_ARGS, ACTIVE_UPSTREAM_PACKAGE, 'version'], {
      encoding: 'utf-8',
      timeout: 15000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim();
  } catch (err) {
    throw new Error(`Failed to query npm registry: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// UPD-02: Supply chain scan
// ---------------------------------------------------------------------------

/**
 * Run supply chain checks for a version update preview.
 *
 * Adapts the existing runSupplyChainChecks() from sync.cjs for version-level
 * scanning. For npm packages, the author-anomaly check is irrelevant and is
 * skipped by providing a known author string.
 *
 * @param {string} pinnedVersion  Currently pinned version
 * @param {string} latestVersion  Latest available version
 * @param {object} [opts]         Options for test injection
 * @param {Array<{path: string}>} [opts.files]  File list override (for testing)
 * @param {string} [opts.diff]    Diff content override (for testing)
 * @returns {Array<{check: string, severity: string, triggered: string[], evidence: string[]}>}
 */
function runPreviewScan(pinnedVersion, latestVersion, opts = {}) {
  // Load the supply chain scanner
  let runSupplyChainChecks;
  try {
    const syncModule = require(path.join(PROJECT_ROOT, 'overlay', 'lib', 'sync.cjs'));
    runSupplyChainChecks = syncModule.runSupplyChainChecks;
  } catch {
    // sync.cjs may not be resolvable from source tree (imports dist/ layout)
    // Fall back to individual check functions
    return runFallbackChecks(opts.files || [], opts.diff || '');
  }

  // Build file list and diff for scanning
  const files = opts.files || buildFileList(pinnedVersion, latestVersion);
  const diff = opts.diff || '';

  // Use a known author string to skip author-anomaly check
  // (npm packages don't have per-commit author attribution)
  const knownAuthor = 'npm-package';
  const knownAuthors = new Set(['npm-package']);

  const findings = runSupplyChainChecks(diff, files, knownAuthor, knownAuthors);

  // Filter out author-anomaly findings (irrelevant for npm packages)
  return findings.filter(f => f.check !== 'author-anomaly');
}

/**
 * Build a file list representing files in an upstream package.
 *
 * For version-level scanning without downloading tarballs, generates a
 * representative list of known file paths in the upstream package.
 *
 * @param {string} _pinnedVersion  Currently pinned version (unused in initial impl)
 * @param {string} _latestVersion  Latest available version (unused in initial impl)
 * @returns {Array<{path: string}>}
 */
function buildFileList(_pinnedVersion, _latestVersion) {
  // Try to read from the installed node_modules package
  try {
    const pkgDir = getPackageDir({ projectRoot: PROJECT_ROOT });
    const entries = walkDirFlat(pkgDir, '');
    return entries.map(p => ({ path: p }));
  } catch {
    // If package not installed, return minimal known paths
    return [
      { path: getBinRelativePath('gsd-core') },
      { path: getBinRelativePath('gsd-tools') },
      { path: 'hooks/pre-compact.sh' },
      { path: `${getAuthorityPathRelative('workflows')}/execute-plan.md` },
      { path: `${getAuthorityPathRelative('agents')}/gsd-executor.md` },
    ];
  }
}

/**
 * Flat recursive directory walk returning forward-slash relative paths.
 *
 * @param {string} dir   Absolute path to walk
 * @param {string} base  Relative path prefix
 * @returns {string[]}
 */
function walkDirFlat(dir, base) {
  const results = [];
  const readdir = require('fs').readdirSync;
  const stat = require('fs').statSync;

  for (const entry of readdir(dir)) {
    if (entry === 'node_modules' || entry === '.git') continue;
    const abs = path.join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    const s = stat(abs);
    if (s.isDirectory()) {
      results.push(...walkDirFlat(abs, rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

/**
 * Run individual supply chain checks as fallback when sync.cjs is not loadable.
 *
 * @param {Array<{path: string}>} files  File list
 * @param {string} diff  Diff content
 * @returns {Array<{check: string, severity: string, triggered: string[], evidence: string[]}>}
 */
function runFallbackChecks(files, diff) {
  const findings = [];

  // Execution path check (file-path only)
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

  if (matchingFiles.length > 0) {
    findings.push({
      check: 'execution-path',
      severity: 'high',
      triggered: ['execution-path-changed'],
      evidence: matchingFiles.map(f => f.path),
    });
  }

  // Prompt integrity check (file-path + diff content)
  const PROMPT_DIRS = ['gsd-core/workflows/', 'workflows/', 'agents/', 'commands/', 'templates/'];
  const hasPromptFile = files.some(f =>
    f.path && f.path.endsWith('.md') && PROMPT_DIRS.some(d => f.path.startsWith(d))
  );

  if (hasPromptFile && diff) {
    const INJECTION_PATTERNS = [
      /ignore previous instructions?/i,
      /override (your|all) instructions?/i,
      /new instructions?:/i,
      /you are now/i,
      /disregard/i,
    ];

    if (INJECTION_PATTERNS.some(p => p.test(diff))) {
      findings.push({
        check: 'prompt-integrity',
        severity: 'elevated',
        triggered: ['prompt-injection'],
        evidence: files.filter(f => f.path && f.path.endsWith('.md')).map(f => f.path),
      });
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// UPD-03: Override staleness
// ---------------------------------------------------------------------------

/**
 * Check override staleness using the existing check-overrides.js module.
 *
 * @param {object} [opts]
 * @param {string} [opts.overridesDir]  Override directory path
 * @param {string} [opts.upstreamDir]   Upstream package directory path
 * @returns {{ ok: boolean, overrides: Array, summary: object }}
 */
function getOverrideImpact(opts = {}) {
  const { checkOverrides } = require(path.join(PROJECT_ROOT, 'scripts', 'check-overrides.js'));
  const resolvedOpts = { ...opts };
  if (!resolvedOpts.upstreamDir) {
    const packageDir = getPackageDir({ projectRoot: PROJECT_ROOT });
    resolvedOpts.upstreamDir = fs.existsSync(packageDir)
      ? packageDir
      : path.join(PROJECT_ROOT, 'dist');
  }
  return checkOverrides(resolvedOpts);
}

// ---------------------------------------------------------------------------
// UPD-04: Report generation
// ---------------------------------------------------------------------------

/**
 * Generate a structured text report from preview scan results.
 *
 * Sections: Version Delta, Supply Chain Scan, Override Impact, Next Steps, Rollback.
 *
 * @param {{ pinned: string, latest: string, hasUpdate: boolean }} versionDelta
 * @param {Array<{check: string, severity: string, triggered: string[], evidence: string[]}>} scanFindings
 * @param {{ ok: boolean, overrides: Array, summary: object }} overrideImpact
 * @returns {string} Formatted report
 */
function generateReport(versionDelta, scanFindings, overrideImpact) {
  const lines = [];

  // Early return for no-update case
  if (!versionDelta.hasUpdate) {
    lines.push(`Already up to date (pinned: ${versionDelta.pinned})`);
    lines.push('');
    return lines.join('\n');
  }

  // --- Section 1: Version Delta ---
  lines.push('== Version Delta ==');
  lines.push('');
  lines.push(`  Current pinned:    ${versionDelta.pinned}`);
  lines.push(`  Latest available:  ${versionDelta.latest}`);
  lines.push('');

  // --- Section 2: Supply Chain Scan ---
  lines.push('== Supply Chain Scan ==');
  lines.push('');

  if (scanFindings.length === 0) {
    lines.push('  Clean scan -- no findings.');
  } else {
    // Sort by severity: elevated first, then high, then medium, then others
    const severityOrder = { elevated: 0, high: 1, medium: 2, low: 3, info: 4 };
    const sorted = [...scanFindings].sort(
      (a, b) => (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99)
    );

    for (const finding of sorted) {
      const marker = (finding.severity === 'elevated' || finding.severity === 'high')
        ? ' [!!]'
        : '';
      lines.push(`  ${finding.check} (${finding.severity})${marker}`);
      if (finding.triggered) {
        lines.push(`    Triggered: ${finding.triggered.join(', ')}`);
      }
      if (finding.evidence && finding.evidence.length > 0) {
        lines.push(`    Evidence:  ${finding.evidence.join(', ')}`);
      }
    }

    const criticalCount = scanFindings.filter(
      f => f.severity === 'elevated' || f.severity === 'high'
    ).length;
    if (criticalCount > 0) {
      lines.push('');
      lines.push(`  WARNING: ${criticalCount} elevated/high severity finding(s) detected.`);
      lines.push('  Review before proceeding with the update.');
    }
  }
  lines.push('');

  // --- Section 3: Override Impact ---
  lines.push('== Override Impact ==');
  lines.push('');

  if (overrideImpact.summary.total === 0) {
    lines.push('  No overrides to review.');
  } else {
    const { summary } = overrideImpact;
    lines.push(`  ${summary.total} overrides checked:`);
    if (summary.fresh > 0) lines.push(`    ${summary.fresh} fresh`);
    if (summary.stale > 0) lines.push(`    ${summary.stale} stale -- review needed`);
    if (summary.missingReason > 0) lines.push(`    ${summary.missingReason} missing REASON.md`);
    if (summary.orphaned > 0) lines.push(`    ${summary.orphaned} orphaned`);

    // List stale overrides explicitly
    const staleOverrides = overrideImpact.overrides.filter(o => o.status === 'stale');
    if (staleOverrides.length > 0) {
      lines.push('');
      lines.push('  Stale overrides:');
      for (const o of staleOverrides) {
        lines.push(`    - ${o.relPath}`);
      }
    }
  }
  lines.push('');

  // --- Section 4: Next Steps ---
  lines.push('== Next Steps ==');
  lines.push('');
  lines.push('  To apply this update:');
  lines.push(`    1. Edit package.json: set ${ACTIVE_UPSTREAM_PACKAGE} to "${versionDelta.latest}"`);
  lines.push('    2. Run: bun install');
  lines.push('    3. Run: bun run compose');
  lines.push('    4. Run tests: bun run test');
  lines.push('');

  // --- Section 5: Rollback ---
  lines.push('== Rollback ==');
  lines.push('');
  lines.push(`  To rollback: pin the previous version (${versionDelta.pinned}) in package.json,`);
  lines.push('  run bun install, run bun run compose.');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CLI logic (extracted for testability)
// ---------------------------------------------------------------------------

/**
 * Run the preview-update check and return structured output.
 *
 * @param {object} [opts]                Options for test injection
 * @param {string} [opts.pinnedVersion]  Explicit pinned version (skips package.json read)
 * @param {string} [opts.latestVersion]  Explicit latest version (skips npm query)
 * @returns {{ output: string, exitCode: number }}
 */
function runCLI(opts = {}) {
  const lines = ['preview-update: Checking for upstream updates...', ''];

  try {
    const delta = getVersionDelta(opts.pinnedVersion, opts.latestVersion);

    if (!delta.hasUpdate) {
      lines.push(`Already up to date (pinned: ${delta.pinned})`);
      return { output: lines.join('\n'), exitCode: 0 };
    }

    lines.push(`Update available: ${delta.pinned} -> ${delta.latest}`);
    lines.push('Running supply chain scan...');

    const findings = runPreviewScan(delta.pinned, delta.latest);
    const overrideResult = getOverrideImpact();
    const report = generateReport(delta, findings, overrideResult);

    lines.push('');
    lines.push(report);
    return { output: lines.join('\n'), exitCode: 0 };
  } catch (err) {
    return { output: `preview-update error: ${err.message}`, exitCode: 1 };
  }
}

// ---------------------------------------------------------------------------
// Module exports
// ---------------------------------------------------------------------------

module.exports = {
  getVersionDelta,
  runPreviewScan,
  getOverrideImpact,
  generateReport,
  runFallbackChecks,
  runCLI,
};
