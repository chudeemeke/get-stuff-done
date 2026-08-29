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
const { execSync, spawnSync } = require('child_process');
const { cleanupOwnedTemp, createOwnedTemp } = require('./lib/owned-temp');
const { getAuthorityPathRelative } = require('./lib/upstream-source');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.join(__dirname, '..');
const DIST_ROOT = path.join(PROJECT_ROOT, 'dist');
const TESTS_DIR = path.join(PROJECT_ROOT, 'tests');
const COMPAT_CONTRACT_PATH = path.join(TESTS_DIR, 'upstream-compat-contract.json');
const SUITE_CLASSIFICATIONS = new Set(['candidate', 'repository', 'retired']);
const AUTHORITY_BOUNDARIES = new Set([
  'black-box',
  'upstream-internal-observed',
  'fork-runtime',
]);
const COMMON_COMPAT_VERSIONS = ['1.5.0', '1.6.0', '1.6.1'];
const SYNC_REVIEW_TRIGGER = 'port when the sync helper can consume the composed Open GSD package or retire when that source-only helper is removed';
const TEMP_OWNER = 'get-stuff-done/upstream-compat';
const MAX_FAILURE_LINES = 5;
const MAX_FAILURE_LINE_LENGTH = 500;
const DEFAULT_COMPAT_TEST_TIMEOUT_MS = 120000;
const WINDOWS_COMPAT_TEST_TIMEOUT_MS = 240000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Discover root compatibility suites without applying execution policy.
 *
 * @returns {string[]} Array of absolute paths to test files
 */
function discoverTestFiles(testsDir = TESTS_DIR) {
  return fs.readdirSync(testsDir)
    .filter(f => f.endsWith('.test.cjs'))
    .map(f => path.join(testsDir, f));
}

function loadCompatContract(registryPath = COMPAT_CONTRACT_PATH) {
  return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function findInternalImports(source) {
  const imports = new Set();
  const normalized = source.replace(/\\/g, '/');
  const literalPattern = /(?:get-stuff-done\/)?bin\/lib\/([A-Za-z0-9._-]+\.cjs)/g;
  const pathJoinPattern = /['"]bin['"]\s*,\s*['"]lib['"]\s*,\s*['"]([^'"]+\.cjs)['"]/g;
  let match;

  while ((match = literalPattern.exec(normalized)) !== null) {
    imports.add(`bin/lib/${match[1]}`);
  }
  while ((match = pathJoinPattern.exec(source)) !== null) {
    imports.add(`bin/lib/${match[1]}`);
  }

  return [...imports];
}

function containsVersionExecutionPolicy(value) {
  if (!value || typeof value !== 'object') return false;

  return Object.entries(value).some(([key, child]) => (
    /^(?:skip|skipped|exclude|excluded|enabled|classification|authorityBoundary)$/i.test(key) ||
    containsVersionExecutionPolicy(child)
  ));
}

function validateSuitePolicy(suite, testsDir) {
  if (!SUITE_CLASSIFICATIONS.has(suite.classification)) {
    throw new Error(`Unknown compatibility suite classification: ${suite.classification}`);
  }
  if (
    suite.authorityBoundary !== undefined &&
    !AUTHORITY_BOUNDARIES.has(suite.authorityBoundary)
  ) {
    throw new Error(`Unknown compatibility authority boundary: ${suite.authorityBoundary}`);
  }

  if (suite.classification !== 'candidate') {
    if (![suite.rationale, suite.owner, suite.trigger].every(isNonEmptyString)) {
      throw new Error(`${suite.path} ${suite.classification} suite requires rationale, owner, and trigger`);
    }
    if (suite.path === 'sync.test.cjs' && suite.trigger !== SYNC_REVIEW_TRIGGER) {
      throw new Error('sync.test.cjs must retain its exact port-or-retire trigger');
    }
    if (suite.classification === 'retired' && (
      !Array.isArray(suite.replacements) || suite.replacements.length === 0
    )) {
      throw new Error(`${suite.path} retired suite requires canonical replacements`);
    }
    return;
  }

  if (!AUTHORITY_BOUNDARIES.has(suite.authorityBoundary)) {
    throw new Error(`Unknown compatibility authority boundary: ${suite.authorityBoundary}`);
  }
  if (containsVersionExecutionPolicy(suite.versions) || containsVersionExecutionPolicy(suite.versionMetadata)) {
    throw new Error(`${suite.path} candidate suite cannot define per-version execution policy`);
  }

  const source = fs.readFileSync(path.join(testsDir, suite.path), 'utf8');
  const internalImports = findInternalImports(source);
  if (internalImports.length > 0 && suite.authorityBoundary !== 'upstream-internal-observed') {
    throw new Error(
      `${suite.path} imports ${internalImports.join(', ')} and must be upstream-internal-observed`
    );
  }
  if (suite.authorityBoundary === 'upstream-internal-observed') {
    const normalizedEvidence = Array.isArray(suite.authorityEvidence)
      ? suite.authorityEvidence
        .filter(isNonEmptyString)
        .map(evidence => evidence.trim().replace(/\\/g, '/'))
        .sort()
      : [];
    const expectedEvidence = [...internalImports].sort();
    if (
      expectedEvidence.length === 0 ||
      JSON.stringify(normalizedEvidence) !== JSON.stringify(expectedEvidence)
    ) {
      throw new Error(`${suite.path} upstream-internal-observed suite requires exact authority evidence`);
    }
    if (!isNonEmptyString(suite.rationale) || !isNonEmptyString(suite.bumpReviewTrigger)) {
      throw new Error(
        `${suite.path} upstream-internal-observed suite requires rationale and a bump-review trigger`
      );
    }
  }
}

function validateCompatContract(contract, opts = {}) {
  if (!contract || contract.schemaVersion !== 1) {
    throw new Error('Compatibility contract schemaVersion must be 1');
  }
  const testsDir = opts.testsDir || TESTS_DIR;
  const discoveredFiles = opts.discoveredFiles || discoverTestFiles(testsDir);
  const discoveredPaths = discoveredFiles.map(filePath => path.basename(filePath));
  const suites = Array.isArray(contract.suites) ? contract.suites : [];
  const registeredPaths = suites.map(suite => suite.path);
  const seenPaths = new Set();

  for (const registeredPath of registeredPaths) {
    if (seenPaths.has(registeredPath)) {
      throw new Error(`Duplicate compatibility suite path: ${registeredPath}`);
    }
    seenPaths.add(registeredPath);
  }

  const unclassifiedPath = discoveredPaths.find(discoveredPath => !seenPaths.has(discoveredPath));
  if (unclassifiedPath) {
    throw new Error(`Unclassified compatibility suite: ${unclassifiedPath}`);
  }

  const discoveredSet = new Set(discoveredPaths);
  const missingPath = registeredPaths.find(registeredPath => !discoveredSet.has(registeredPath));
  if (missingPath) {
    throw new Error(`Registered compatibility suite is missing: ${missingPath}`);
  }

  if (JSON.stringify(contract.commonVersions) !== JSON.stringify(COMMON_COMPAT_VERSIONS)) {
    throw new Error('Compatibility contract must apply to 1.5.0, 1.6.0, and 1.6.1');
  }

  for (const suite of suites) {
    validateSuitePolicy(suite, testsDir);
  }

  return {
    ...contract,
    suites,
    discoveredPaths,
    candidates: suites.filter(suite => suite.classification === 'candidate'),
    excluded: suites.filter(suite => suite.classification !== 'candidate'),
  };
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

function getCompatTestTimeoutMs(env = process.env, platform = process.platform) {
  const parsed = Number.parseInt(env.GSD_COMPAT_TEST_TIMEOUT_MS || '', 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return platform === 'win32' ? WINDOWS_COMPAT_TEST_TIMEOUT_MS : DEFAULT_COMPAT_TEST_TIMEOUT_MS;
}

function copyDirectory(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Stage helpers.cjs and the local helpers/ dependency tree into the temp test
 * directory so relative imports still resolve there.
 *
 * @param {string} tmpTestsDir  Temp tests directory
 * @param {string} [testsDir]   Source tests directory
 */
function copyCompatHelpers(tmpTestsDir, testsDir = TESTS_DIR) {
  fs.copyFileSync(
    path.join(testsDir, 'helpers.cjs'),
    path.join(tmpTestsDir, 'helpers.cjs')
  );
  copyDirectory(
    path.join(testsDir, 'helpers'),
    path.join(tmpTestsDir, 'helpers')
  );
}

// ---------------------------------------------------------------------------
// Core runner
// ---------------------------------------------------------------------------

function stageCompatWorkspace({ tempDir, distDir, testsDir, candidates, linkPath }) {
  const packageLinkPath = linkPath || path.join(tempDir, 'get-stuff-done');
  createLink(packageLinkPath, distDir);

  const stagedTestsDir = path.join(tempDir, 'tests');
  fs.mkdirSync(stagedTestsDir, { recursive: true });
  copyCompatHelpers(stagedTestsDir, testsDir);

  for (const suite of candidates) {
    fs.copyFileSync(
      path.join(testsDir, suite.path),
      path.join(stagedTestsDir, suite.path)
    );
  }

  return { linkPath: packageLinkPath, stagedTestsDir };
}

function normalizeOutput(value) {
  if (value === null || value === undefined) return '';
  return Buffer.isBuffer(value) ? value.toString('utf8') : String(value);
}

function boundedEvidence(value) {
  const lines = normalizeOutput(value)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  const failedBlocks = [];
  let inFailedBlock = false;
  for (const line of lines) {
    if (/^not ok\b/i.test(line)) {
      inFailedBlock = true;
      failedBlocks.push(line);
      continue;
    }
    if (/^ok\b|^# (?:pass|fail|skipped)\b/i.test(line)) {
      inFailedBlock = false;
      continue;
    }
    if (inFailedBlock && (
      /^(?:error|expected|actual|operator|code|name|message|stack):/i.test(line) ||
      /\b(?:assertionerror|err_assertion)\b/i.test(line)
    )) {
      failedBlocks.push(line);
    }
  }
  const actionable = failedBlocks.length > 0
    ? failedBlocks
    : lines.filter(line => (
      /\b(?:assertion|assertionerror|err_assertion|error|failed|failure|expected|actual)\b/i.test(line)
    ));
  const selected = actionable.length > 0 ? actionable : lines.slice(-MAX_FAILURE_LINES);
  return [...new Set(selected)]
    .slice(0, MAX_FAILURE_LINES)
    .map(line => line.slice(0, MAX_FAILURE_LINE_LENGTH));
}

function runCompatSuite(suite, options) {
  const stagedPath = path.join(options.stagedTestsDir, suite.path);
  const startMs = options.now();
  let processResult;

  try {
    processResult = options.runProcessImpl(
      process.execPath,
      ['--test', stagedPath],
      {
        cwd: options.tempDir,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: options.timeoutMs,
        env: {
          ...process.env,
          GSD_COMPAT_PACKAGE_ROOT: options.distDir,
        },
      }
    );
  } catch (err) {
    processResult = { status: null, stdout: '', stderr: '', error: err };
  }

  const durationMs = Math.max(0, options.now() - startMs);
  const stdout = normalizeOutput(processResult.stdout);
  const stderr = normalizeOutput(processResult.stderr);
  const timedOut = processResult.error && processResult.error.code === 'ETIMEDOUT';
  const spawnError = processResult.error && !timedOut;
  const exitCode = Number.isInteger(processResult.status) ? processResult.status : 1;
  const parsed = parseTestOutput(`${stdout}\n${stderr}`, exitCode);
  let errors = parsed.errors;

  if (spawnError || timedOut) {
    errors = [...new Set([
      processResult.error.message,
      ...boundedEvidence(stderr),
    ])].slice(0, MAX_FAILURE_LINES);
  } else if (!parsed.ok) {
    errors = [...new Set([
      ...boundedEvidence(stderr || stdout),
      ...parsed.errors,
    ])].slice(0, MAX_FAILURE_LINES);
  }

  return {
    path: suite.path,
    classification: suite.classification,
    authorityBoundary: suite.authorityBoundary,
    status: timedOut ? 'timed-out' : spawnError ? 'spawn-error' : parsed.ok ? 'passed' : 'failed',
    passed: parsed.passed,
    failed: parsed.failed,
    skipped: parsed.skipped,
    durationMs,
    exitCode,
    errors,
  };
}

function aggregateSuites(suites, excludedSuites) {
  const aggregate = suites.reduce((result, suite) => ({
    passed: result.passed + suite.passed,
    failed: result.failed + suite.failed,
    skipped: result.skipped + suite.skipped,
  }), { passed: 0, failed: 0, skipped: 0 });
  const errors = suites.flatMap(suite => suite.errors.map(error => `${suite.path}: ${error}`));

  return {
    ok: suites.every(suite => suite.status === 'passed'),
    ...aggregate,
    excluded: excludedSuites.map(suite => suite.path),
    classifiedExclusions: excludedSuites.map(suite => ({
      path: suite.path,
      classification: suite.classification,
    })),
    suites,
    errors,
  };
}

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

  const testsDir = opts.testsDir || TESTS_DIR;
  const contract = validateCompatContract(
    opts.contract || loadCompatContract(opts.registryPath),
    { discoveredFiles: discoverTestFiles(testsDir), testsDir }
  );
  const distDir = opts.distDir || getCompatPackageRoot(opts);
  const distRel = path.relative(PROJECT_ROOT, distDir).replace(/\\/g, '/');
  if (!fs.existsSync(distDir)) {
    return {
      ...aggregateSuites([], contract.excluded),
      ok: false,
      errors: [`${distRel}/ does not exist. Run \`bun run compose\` first.`],
    };
  }
  const toolsPath = path.join(distDir, 'bin', 'gsd-tools.cjs');
  // distDir is the explicit candidate root; this checks its fixed executable contract.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!fs.existsSync(toolsPath)) {
    return {
      ...aggregateSuites([], contract.excluded),
      ok: false,
      errors: [`Candidate package root is missing bin/gsd-tools.cjs: ${distRel}/bin/gsd-tools.cjs`],
    };
  }

  const tempRoot = opts.tempRoot || os.tmpdir();
  const tempLifecycle = opts.tempLifecycle || {
    create: createOwnedTemp,
    cleanup: cleanupOwnedTemp,
  };
  const protectedRoots = opts.protectedRoots || [
    PROJECT_ROOT,
    path.join(PROJECT_ROOT, 'dist'),
    path.join(PROJECT_ROOT, 'node_modules'),
  ];
  const ownedTemp = tempLifecycle.create({
    tempRoot,
    prefix: 'gsd-compat-',
    owner: TEMP_OWNER,
    protectedRoots,
  });
  const linkPath = path.join(ownedTemp.path, 'get-stuff-done');

  try {
    const staged = stageCompatWorkspace({
      tempDir: ownedTemp.path,
      distDir,
      testsDir,
      candidates: contract.candidates,
      linkPath,
    });
    const runOptions = {
      tempDir: ownedTemp.path,
      stagedTestsDir: staged.stagedTestsDir,
      distDir,
      timeoutMs: getCompatTestTimeoutMs(opts.env, opts.platform),
      runProcessImpl: opts.runProcessImpl || spawnSync,
      now: opts.now || Date.now,
    };
    const suites = contract.candidates.map(suite => runCompatSuite(suite, runOptions));
    return aggregateSuites(suites, contract.excluded);
  } finally {
    tempLifecycle.cleanup(ownedTemp.path, {
      tempRoot,
      owner: TEMP_OWNER,
      protectedRoots,
      allowedLinks: [linkPath],
    });
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
  const counts = { pass: null, fail: null, skipped: null };
  const summaryPattern = /^\s*# (pass|fail|skipped) (\d+)\s*$/gm;
  let summaryMatch;
  while ((summaryMatch = summaryPattern.exec(output)) !== null) {
    counts[summaryMatch[1]] = parseInt(summaryMatch[2], 10);
  }
  const passed = counts.pass || 0;
  const failed = counts.fail || 0;
  const skipped = counts.skipped || 0;
  const errors = [];

  // node --test outputs TAP-like format:
  // # tests N
  // # pass N
  // # fail N
  // # skipped N
  // If we couldn't parse counts but exit code was non-zero, record error
  if (counts.pass === null && counts.fail === null && exitCode !== 0) {
    errors.push('Failed to parse test output. Raw output may contain errors.');
    // Try to extract error messages
    const errorLines = output.split('\n').filter(l => l.includes('Error') || l.includes('error'));
    if (errorLines.length > 0) {
      errors.push(...errorLines.slice(0, 5));
    }
  }

  return {
    ok: exitCode === 0 && failed === 0 && errors.length === 0,
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
  const hasSuiteRecords = Array.isArray(result.suites) && result.suites.length > 0;

  lines.push('Upstream compatibility report');
  lines.push('=============================');
  lines.push('');
  lines.push(`  Passed:   ${result.passed}`);
  lines.push(`  Failed:   ${result.failed}`);
  lines.push(`  Skipped:  ${result.skipped}`);

  if (result.excluded && result.excluded.length > 0) {
    lines.push(`  Excluded: ${result.excluded.join(', ')}`);
  }

  if (hasSuiteRecords) {
    lines.push('');
    lines.push('Suites:');
    lines.push('  Suite | Boundary | Status | Passed | Failed | Skipped | Duration');
    for (const suite of result.suites) {
      lines.push(
        `  ${suite.path} | ${suite.authorityBoundary} | ${suite.status} | ` +
        `${suite.passed} | ${suite.failed} | ${suite.skipped} | ${suite.durationMs}ms`
      );
      for (const error of (suite.errors || []).slice(0, MAX_FAILURE_LINES)) {
        lines.push(`    ${String(error).slice(0, MAX_FAILURE_LINE_LENGTH)}`);
      }
    }
  }

  lines.push('');

  if (!hasSuiteRecords && result.errors.length > 0) {
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

module.exports = {
  copyCompatHelpers,
  discoverTestFiles,
  getCompatPackageRoot,
  getCompatTestTimeoutMs,
  loadCompatContract,
  runUpstreamCompat,
  parseTestOutput,
  formatReport,
  validateCompatContract,
};
