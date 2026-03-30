'use strict';

/**
 * scripts/check-boundary.js -- Repo Boundary Enforcement
 *
 * Phase 34 Plan 02: Implements CI-01 -- detects upstream files existing
 * in the repo outside allowed directories (overrides/, dist/, etc.).
 *
 * Purpose: Prevent accidental vendoring of upstream files into the repo.
 * Files from get-shit-done-cc should only exist in node_modules/ (installed),
 * overrides/ (intentional replacements), or dist/ (composed output).
 *
 * Usage:
 *   node scripts/check-boundary.js
 *   node scripts/check-boundary.js --upstream-dir <path> --project-dir <path>
 *
 * Exit codes:
 *   0 -- no boundary violations found
 *   1 -- boundary violations detected
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.join(__dirname, '..');
const DEFAULT_UPSTREAM_DIR = path.join(PROJECT_ROOT, 'node_modules', 'get-shit-done-cc');
const DEFAULT_PROJECT_DIR = PROJECT_ROOT;

/**
 * Top-level directory prefixes that are allowed to contain upstream-matching
 * files. Any file whose path starts with one of these is skipped.
 */
const ALLOWED_PREFIXES = [
  'overrides/',
  'dist/',
  'node_modules/',
  '.git/',
  '.planning/',
  'tests/',
  '.github/',
];

// ---------------------------------------------------------------------------
// File system helpers
// ---------------------------------------------------------------------------

/**
 * Recursively walk a directory and return relative forward-slash paths.
 *
 * Standalone copy (not imported from compose.js per project convention).
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

    // Skip allowed top-level directories when walking from root
    if (!base && ALLOWED_PREFIXES.some(p => p === `${entry}/`)) {
      continue;
    }

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
// Core check function
// ---------------------------------------------------------------------------

/**
 * Check the repo for boundary violations -- files that match upstream paths
 * but exist outside allowed directories.
 *
 * @param {object} [opts]
 * @param {string} [opts.upstreamDir]  Absolute path to the upstream package
 * @param {string} [opts.projectDir]   Absolute path to the project root
 * @returns {{ ok: boolean, violations: string[] }}
 */
function checkBoundary(opts = {}) {
  const upstreamDir = opts.upstreamDir || DEFAULT_UPSTREAM_DIR;
  const projectDir = opts.projectDir || DEFAULT_PROJECT_DIR;

  // Build set of upstream file paths
  const upstreamFiles = new Set(walkUpstream(upstreamDir, ''));

  // Walk the project root (skipping allowed prefixes)
  const repoFiles = walkDir(projectDir, '');

  // Find violations: repo files whose relative path exists in the upstream set
  const violations = [];
  for (const repoFile of repoFiles) {
    if (upstreamFiles.has(repoFile)) {
      violations.push(repoFile);
    }
  }

  return {
    ok: violations.length === 0,
    violations,
  };
}

/**
 * Walk the upstream directory without prefix filtering.
 *
 * @param {string} dir   Absolute path to walk
 * @param {string} base  Relative path prefix
 * @returns {string[]}   Forward-slash relative paths
 */
function walkUpstream(dir, base) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir)) {
    const abs = path.join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      results.push(...walkUpstream(abs, rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

/**
 * Format the check result into a human-readable report.
 *
 * @param {{ ok: boolean, violations: string[] }} result
 * @returns {string}
 */
function formatReport(result) {
  const lines = [];

  lines.push('Boundary violation report');
  lines.push('=========================');
  lines.push('');

  if (result.ok) {
    lines.push('No boundary violations found.');
    lines.push('');
    return lines.join('\n');
  }

  lines.push(`Found ${result.violations.length} boundary violation(s):`);
  lines.push('');

  for (const v of result.violations) {
    lines.push(`  ${v}`);
    lines.push('    Action: Move to overrides/ or remove from repo');
  }

  lines.push('');
  lines.push('Upstream files must only exist in: overrides/, dist/, node_modules/');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

/**
 * Parse --upstream-dir and --project-dir from process.argv.
 *
 * @returns {{ upstreamDir?: string, projectDir?: string }}
 */
function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--upstream-dir' && argv[i + 1]) {
      opts.upstreamDir = argv[i + 1];
      i++;
    } else if (argv[i] === '--project-dir' && argv[i + 1]) {
      opts.projectDir = argv[i + 1];
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
  const result = checkBoundary(opts);
  process.stdout.write(formatReport(result));
  process.exit(result.ok ? 0 : 1);
}

// ---------------------------------------------------------------------------
// Module exports
// ---------------------------------------------------------------------------

module.exports = { checkBoundary, formatReport };
