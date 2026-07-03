'use strict';

/**
 * scripts/run-upstream-compat.js -- Upstream Compatibility Runner
 *
 * Phase 34 Plan 02: Implements TEST-03 -- runs upstream .test.cjs files
 * against the composed dist/ output to validate behavioral correctness.
 *
 * Approach: Creates a temp directory with a symlink/junction that redirects
 * `get-stuff-done/` to the composed active package root under dist/, copies
 * test files there, and runs them with `node --test`.
 *
 * Usage:
 *   node scripts/run-upstream-compat.js
 *   node scripts/run-upstream-compat.js --compose-first
 *
 * Exit codes:
 *   0 -- all upstream tests pass against composed dist/
 *   1 -- one or more upstream tests failed
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync, execSync } = require('child_process');
const { getAuthorityPathRelative } = require('./lib/upstream-source');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.join(__dirname, '..');
const DIST_ROOT = path.join(PROJECT_ROOT, 'dist');
const TESTS_DIR = path.join(PROJECT_ROOT, 'tests');

/**
 * Test files to exclude from the compat run.
 * sync.test.cjs has a dist-relative import blocker (overlay/lib/sync.cjs
 * requires ../get-shit-done/bin/lib/core.cjs which only resolves from
 * the installed dist/ layout, not from the temp dir structure).
 */
const EXCLUDED_TESTS = new Set(['sync.test.cjs']);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Discover upstream .test.cjs files, excluding known incompatible ones.
 *
 * @returns {string[]} Array of absolute paths to test files
 */
function discoverTestFiles() {
  return fs.readdirSync(TESTS_DIR)
    .filter(f => f.endsWith('.test.cjs') && !EXCLUDED_TESTS.has(f))
    .map(f => path.join(TESTS_DIR, f));
}

/**
 * Resolve the composed active package root used by compatibility tests.
 *
 * The copied upstream tests import through get-stuff-done/bin/*. The active
 * authority may place that bin path under a package subdirectory in dist/
 * (currently gsd-core/bin/gsd-tools.cjs), so derive the symlink target from
 * the authority contract instead of hardcoding a legacy package name.
 *
 * @param {object} [opts]
 * @param {string} [opts.distRoot]  Absolute or relative dist root
 * @returns {string} Directory that should be exposed as get-stuff-done/
 */
function getCompatPackageRoot(opts = {}) {
  const distRoot = opts.distRoot || DIST_ROOT;
  const gsdToolsRel = getAuthorityPathRelative('gsdTools', opts);
  const parts = gsdToolsRel.split('/').filter(Boolean);
  const binIndex = parts.indexOf('bin');
  const packageRootParts = binIndex > 0 ? parts.slice(0, binIndex) : [];

  return path.join(distRoot, ...packageRootParts);
}

/**
 * Create the symlink/junction from get-stuff-done/ to the composed package root.
 *
 * On Windows, uses 'junction' type (no admin privileges required).
 * On Unix, uses 'dir' type (standard directory symlink).
 *
 * @param {string} linkPath  Where the symlink/junction will be created
 * @param {string} target    Where it points to under dist/
 */
function createLink(linkPath, target) {
  const type = process.platform === 'win32' ? 'junction' : 'dir';
  fs.symlinkSync(target, linkPath, type);
}

/**
 * Create the patched helpers.cjs content.
 *
 * The original helpers.cjs TOOLS_PATH points to:
 *   path.join(__dirname, '..', 'get-stuff-done', 'bin', 'gsd-tools.cjs')
 *
 * In the temp dir, `get-stuff-done/` is a symlink to the composed active
 * package root, so this path resolves correctly without patching. However, the
 * helpers/ directory import needs special handling.
 *
 * @param {string} originalContent  The original helpers.cjs content
 * @param {string} projectRoot      Absolute path to the project root
 * @returns {string} Patched content
 */
function patchHelpers(originalContent, projectRoot) {
  // Replace the helpers/ directory require with an absolute path to the
  // real helpers directory, since we don't copy it to the temp dir
  const helpersDir = path.join(projectRoot, 'tests', 'helpers', 'index.js')
    .replace(/\\/g, '/');

  return originalContent.replace(
    /require\(['"]\.\/helpers\/index\.js['"]\)/,
    `require('${helpersDir}')`
  );
}

// ---------------------------------------------------------------------------
// Core runner
// ---------------------------------------------------------------------------

/**
 * Run upstream compatibility tests against composed dist/.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.composeFirst]  Run `bun run compose` before testing
 * @returns {{ ok: boolean, passed: number, failed: number, skipped: number, excluded: string[], errors: string[] }}
 */
function runUpstreamCompat(opts = {}) {
  // Optionally compose first
  if (opts.composeFirst) {
    console.log('Running compose before compat tests...');
    execSync('bun run compose', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    console.log('');
  }

  const distDir = opts.distDir || getCompatPackageRoot(opts);
  const distRel = path.relative(PROJECT_ROOT, distDir).replace(/\\/g, '/');

  // Verify dist package root exists
  if (!fs.existsSync(distDir)) {
    return {
      ok: false,
      passed: 0,
      failed: 0,
      skipped: 0,
      excluded: [...EXCLUDED_TESTS],
      errors: [`${distRel}/ does not exist. Run \`bun run compose\` first.`],
    };
  }

  // Discover test files
  const testFiles = discoverTestFiles();
  const testFileNames = testFiles.map(f => path.basename(f));

  let tmpDir;
  try {
    // Create temp directory
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-compat-'));

    // Create symlink: {tmpDir}/get-stuff-done/ -> active package root under dist/
    const linkPath = path.join(tmpDir, 'get-stuff-done');
    createLink(linkPath, distDir);

    // Create tests/ directory in temp
    const tmpTestsDir = path.join(tmpDir, 'tests');
    fs.mkdirSync(tmpTestsDir, { recursive: true });

    // Copy and patch helpers.cjs
    const helpersContent = fs.readFileSync(
      path.join(TESTS_DIR, 'helpers.cjs'),
      'utf-8'
    );
    const patchedHelpers = patchHelpers(helpersContent, PROJECT_ROOT);
    fs.writeFileSync(path.join(tmpTestsDir, 'helpers.cjs'), patchedHelpers, 'utf-8');

    // Copy test files
    for (const testFile of testFiles) {
      const basename = path.basename(testFile);
      fs.copyFileSync(testFile, path.join(tmpTestsDir, basename));
    }

    // Build the glob pattern for test files
    const testGlobs = testFileNames.map(f => path.join(tmpTestsDir, f));

    // Run node --test
    let output;
    let exitCode = 0;
    try {
      output = execFileSync(
        process.execPath,
        ['--test', ...testGlobs],
        {
          cwd: tmpDir,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 120000,
        }
      );
    } catch (err) {
      exitCode = err.status || 1;
      output = (err.stdout || '') + '\n' + (err.stderr || '');
    }

    // Parse results
    const result = parseTestOutput(output, exitCode);
    result.excluded = [...EXCLUDED_TESTS];
    return result;

  } finally {
    // Cleanup: remove junction/symlink first (Windows EBUSY prevention),
    // then remove the temp directory tree
    if (tmpDir && fs.existsSync(tmpDir)) {
      const linkPath = path.join(tmpDir, 'get-stuff-done');
      try {
        // On Windows, junctions must be unlinked before the parent can be removed.
        // fs.unlinkSync works for junctions; fs.rmdirSync works for directory symlinks.
        if (fs.existsSync(linkPath)) {
          const stat = fs.lstatSync(linkPath);
          if (stat.isSymbolicLink()) {
            fs.unlinkSync(linkPath);
          } else {
            // Junction appears as directory to lstat; rmdir removes the junction point
            fs.rmdirSync(linkPath);
          }
        }
      } catch { /* best effort */ }

      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // Windows may still hold handles briefly; non-critical
      }
    }
  }
}

/**
 * Parse node --test output for pass/fail/skip counts.
 *
 * @param {string} output  Combined stdout+stderr
 * @param {number} exitCode  Process exit code
 * @returns {{ ok: boolean, passed: number, failed: number, skipped: number, errors: string[] }}
 */
function parseTestOutput(output, exitCode) {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const errors = [];

  // node --test outputs TAP-like format:
  // # tests N
  // # pass N
  // # fail N
  // # skipped N
  const passMatch = output.match(/# pass (\d+)/);
  const failMatch = output.match(/# fail (\d+)/);
  const skipMatch = output.match(/# skipped (\d+)/);

  if (passMatch) passed = parseInt(passMatch[1], 10);
  if (failMatch) failed = parseInt(failMatch[1], 10);
  if (skipMatch) skipped = parseInt(skipMatch[1], 10);

  // If we couldn't parse counts but exit code was non-zero, record error
  if (!passMatch && !failMatch && exitCode !== 0) {
    errors.push('Failed to parse test output. Raw output may contain errors.');
    // Try to extract error messages
    const errorLines = output.split('\n').filter(l => l.includes('Error') || l.includes('error'));
    if (errorLines.length > 0) {
      errors.push(...errorLines.slice(0, 5));
    }
  }

  return {
    ok: failed === 0 && errors.length === 0,
    passed,
    failed,
    skipped,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

/**
 * Format the compat runner result into a human-readable report.
 *
 * @param {{ ok: boolean, passed: number, failed: number, skipped: number, excluded: string[], errors: string[] }} result
 * @returns {string}
 */
function formatReport(result) {
  const lines = [];

  lines.push('Upstream compatibility report');
  lines.push('=============================');
  lines.push('');
  lines.push(`  Passed:   ${result.passed}`);
  lines.push(`  Failed:   ${result.failed}`);
  lines.push(`  Skipped:  ${result.skipped}`);

  if (result.excluded && result.excluded.length > 0) {
    lines.push(`  Excluded: ${result.excluded.join(', ')}`);
  }

  lines.push('');

  if (result.errors.length > 0) {
    lines.push('Errors:');
    for (const err of result.errors) {
      lines.push(`  ${err}`);
    }
    lines.push('');
  }

  if (result.ok) {
    lines.push('Result: PASS');
  } else {
    lines.push('Result: FAIL');
  }

  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

/**
 * Parse --compose-first flag from process.argv.
 *
 * @returns {{ composeFirst: boolean }}
 */
function parseArgs(argv) {
  return {
    composeFirst: argv.includes('--compose-first'),
  };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (require.main === module) {
  const opts = parseArgs(process.argv.slice(2));
  const result = runUpstreamCompat(opts);
  process.stdout.write(formatReport(result));
  process.exit(result.ok ? 0 : 1);
}

// ---------------------------------------------------------------------------
// Module exports
// ---------------------------------------------------------------------------

module.exports = { getCompatPackageRoot, runUpstreamCompat, parseTestOutput, formatReport };
