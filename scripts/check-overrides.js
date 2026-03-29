'use strict';

/**
 * scripts/check-overrides.js -- Standalone Override Staleness Detection
 *
 * Phase 31 Plan 03: Implements OVER-03 -- SHA-256 content hash comparison
 * for detecting stale overrides relative to upstream.
 *
 * Purpose: Enable CI to independently verify that all overrides have
 * documentation (REASON.md) and are not stale relative to their upstream
 * counterpart. This script runs separately from compose -- a developer can
 * compose without being blocked by stale overrides during active work.
 *
 * Usage:
 *   node scripts/check-overrides.js
 *   node scripts/check-overrides.js --overrides-dir <path> --upstream-dir <path>
 *
 * Exit codes:
 *   0 -- all overrides are fresh and have REASON.md (or zero overrides)
 *   1 -- any override is stale or missing REASON.md
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.join(__dirname, '..');
const DEFAULT_OVERRIDES_DIR = path.join(PROJECT_ROOT, 'overrides');
const DEFAULT_UPSTREAM_DIR = path.join(PROJECT_ROOT, 'node_modules', 'get-shit-done-cc');

// ---------------------------------------------------------------------------
// File system helpers
// ---------------------------------------------------------------------------

/**
 * Recursively walk a directory and return relative forward-slash paths.
 *
 * Standalone copy (not imported from compose.js per CONTEXT.md).
 *
 * @param {string} dir   Absolute path to walk
 * @param {string} base  Relative path prefix (empty string at root)
 * @returns {string[]}   Forward-slash relative paths
 */
function walkDir(dir, base) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir)) {
    const abs = path.join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      results.push(...walkDir(abs, rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Hash and REASON.md helpers
// ---------------------------------------------------------------------------

/**
 * Compute the SHA-256 hex digest of a file's content.
 *
 * @param {string} filePath  Absolute path to the file
 * @returns {string}  64-character lowercase hex string
 */
function hashFileContent(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Extract the SHA-256 hash from a REASON.md file.
 *
 * Looks for a line matching:  - SHA-256: <64-char hex>
 *
 * @param {string} reasonPath  Absolute path to the REASON.md file
 * @returns {string|null}  The 64-char hex hash, or null if not found
 */
function extractHashFromReason(reasonPath) {
  const content = fs.readFileSync(reasonPath, 'utf-8');
  const match = content.match(/^- SHA-256:\s*([a-f0-9]{64})\s*$/m);
  return match ? match[1] : null;
}

/**
 * Extract the upstream version from a REASON.md file.
 *
 * Looks for a line matching:  - Version: <value>
 *
 * @param {string} reasonPath  Absolute path to the REASON.md file
 * @returns {string|null}  The version string, or null if not found
 */
function extractVersionFromReason(reasonPath) {
  const content = fs.readFileSync(reasonPath, 'utf-8');
  const match = content.match(/^- Version:\s*(.+?)\s*$/m);
  return match ? match[1].trim() : null;
}

/**
 * Read the upstream package version from package.json.
 *
 * @param {string} upstreamDir  Absolute path to the upstream package directory
 * @returns {string}  Version string (e.g. '1.30.0'), or 'unknown' if not found
 */
function readUpstreamVersion(upstreamDir) {
  try {
    const pkgPath = path.join(upstreamDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

// ---------------------------------------------------------------------------
// Core check function
// ---------------------------------------------------------------------------

/**
 * Check all overrides for staleness.
 *
 * @param {object} [opts]
 * @param {string} [opts.overridesDir]  Absolute path to the overrides/ directory
 * @param {string} [opts.upstreamDir]   Absolute path to the upstream package directory
 * @returns {{
 *   ok: boolean,
 *   overrides: Array<{
 *     relPath: string,
 *     status: 'fresh' | 'stale' | 'missing-reason' | 'orphaned',
 *     recordedHash?: string,
 *     currentHash?: string,
 *     recordedVersion?: string,
 *     currentVersion?: string,
 *     expectedReasonPath?: string,
 *   }>,
 *   summary: {
 *     total: number,
 *     fresh: number,
 *     stale: number,
 *     missingReason: number,
 *     orphaned: number,
 *   },
 * }}
 */
function checkOverrides(opts = {}) {
  const overridesDir = opts.overridesDir || DEFAULT_OVERRIDES_DIR;
  const upstreamDir = opts.upstreamDir || DEFAULT_UPSTREAM_DIR;

  const currentVersion = readUpstreamVersion(upstreamDir);
  const allFiles = walkDir(overridesDir, '');

  // Collect override files: skip .gitkeep and *.REASON.md files
  const overrideRelPaths = allFiles
    .map(f => f.replace(/\\/g, '/')) // normalize to forward slashes
    .filter(f => f !== '.gitkeep' && !f.endsWith('.REASON.md'));

  const overrides = [];
  const summary = { total: 0, fresh: 0, stale: 0, missingReason: 0, orphaned: 0 };

  for (const relPath of overrideRelPaths) {
    summary.total++;
    const overridePath = path.join(overridesDir, relPath);
    const reasonPath = overridePath + '.REASON.md';
    const upstreamPath = path.join(upstreamDir, relPath);

    // Check for companion REASON.md
    if (!fs.existsSync(reasonPath)) {
      const expectedReasonPath = path.join('overrides', relPath).replace(/\\/g, '/') + '.REASON.md';
      overrides.push({ relPath, status: 'missing-reason', expectedReasonPath });
      summary.missingReason++;
      continue;
    }

    // Check if upstream file exists
    if (!fs.existsSync(upstreamPath)) {
      overrides.push({ relPath, status: 'orphaned' });
      summary.orphaned++;
      continue;
    }

    // Compare hashes
    const recordedHash = extractHashFromReason(reasonPath);
    const recordedVersion = extractVersionFromReason(reasonPath);
    const currentHash = hashFileContent(upstreamPath);

    if (recordedHash === currentHash) {
      overrides.push({ relPath, status: 'fresh' });
      summary.fresh++;
    } else {
      overrides.push({
        relPath,
        status: 'stale',
        recordedHash,
        currentHash,
        recordedVersion,
        currentVersion: `v${currentVersion}`,
      });
      summary.stale++;
    }
  }

  const ok = summary.stale === 0 && summary.missingReason === 0;
  return { ok, overrides, summary };
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

/**
 * Format the check result into an actionable, human-readable report.
 *
 * @param {{ok: boolean, overrides: Array, summary: object}} result
 * @returns {string}  Formatted report string (with trailing newline)
 */
function formatReport(result) {
  const lines = [];

  lines.push('Override staleness report');
  lines.push('=========================');
  lines.push('');

  if (result.overrides.length === 0) {
    lines.push('No overrides found.');
    lines.push('');
  }

  for (const entry of result.overrides) {
    lines.push(`overrides/${entry.relPath}`);

    if (entry.status === 'fresh') {
      lines.push('  Status:          OK');

    } else if (entry.status === 'stale') {
      const recHash = entry.recordedHash ? entry.recordedHash.slice(0, 16) + '...' : '(none)';
      const curHash = entry.currentHash ? entry.currentHash.slice(0, 16) + '...' : '(unknown)';
      lines.push('  Status:          STALE');
      lines.push(`  Recorded hash:   ${recHash}`);
      lines.push(`  Current hash:    ${curHash}`);
      if (entry.recordedVersion) {
        lines.push(`  Recorded version: ${entry.recordedVersion}`);
      }
      if (entry.currentVersion) {
        lines.push(`  Current version:  ${entry.currentVersion}`);
      }
      lines.push('  Action:          Review upstream changes, update or remove override');

    } else if (entry.status === 'missing-reason') {
      lines.push('  Status:          MISSING REASON.md');
      lines.push(`  Expected:        ${entry.expectedReasonPath}`);
      lines.push('  Action:          Create REASON.md (template below)');
      lines.push('');
      lines.push('  --- Template ---');
      lines.push(`  # Override: ${entry.relPath}`);
      lines.push('  ');
      lines.push('  ## Why');
      lines.push('  [Explain why the upstream file needs replacement]');
      lines.push('  ');
      lines.push('  ## Upstream snapshot');
      lines.push('  - Version: {upstream_version}');
      lines.push('  - SHA-256: {hash}');
      lines.push('  ');
      lines.push("  ## What's different");
      lines.push('  - [Bullet list of changes from upstream]');
      lines.push('  ');
      lines.push('  ## Review trigger');
      lines.push(`  When upstream ${entry.relPath} changes, review whether the override is still needed.`);
      lines.push('  ----------------');

    } else if (entry.status === 'orphaned') {
      lines.push('  Status:          ORPHANED');
      lines.push('  Action:          Remove this override -- upstream file no longer exists');
    }

    lines.push('');
  }

  // Summary line
  const { total, stale, missingReason, orphaned } = result.summary;
  const parts = [`${total} overrides checked`];
  if (stale > 0) parts.push(`${stale} stale`);
  if (missingReason > 0) parts.push(`${missingReason} missing REASON.md`);
  if (orphaned > 0) parts.push(`${orphaned} orphaned`);
  if (stale === 0 && missingReason === 0 && orphaned === 0 && total > 0) parts.push('all fresh');
  lines.push(`Summary: ${parts.join(', ')}`);
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

/**
 * Parse --overrides-dir and --upstream-dir from process.argv.
 *
 * @returns {{ overridesDir?: string, upstreamDir?: string }}
 */
function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--overrides-dir' && argv[i + 1]) {
      opts.overridesDir = argv[i + 1];
      i++;
    } else if (argv[i] === '--upstream-dir' && argv[i + 1]) {
      opts.upstreamDir = argv[i + 1];
      i++;
    }
  }
  return opts;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (require.main === module) {
  const opts = parseArgs(process.argv.slice(2));
  const result = checkOverrides(opts);
  process.stdout.write(formatReport(result));
  process.exit(result.ok ? 0 : 1);
}

// ---------------------------------------------------------------------------
// Module exports
// ---------------------------------------------------------------------------

module.exports = {
  checkOverrides,
  hashFileContent,
  extractHashFromReason,
  extractVersionFromReason,
  formatReport,
};
