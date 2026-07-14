#!/usr/bin/env node
'use strict';

/* eslint-disable security/detect-non-literal-fs-filename -- maintainer CLI reads/writes explicit repo-local manifest/report paths. */

const fs = require('fs');
const crypto = require('node:crypto');
const path = require('path');
const { writeJsonFileAtomic } = require('./lib/atomic-json-file');
const { loadCompatContract, validateCompatContract } = require('./run-upstream-compat');
const {
  getActivePackageName,
  getActivePackageVersion,
  readAuthorityContract,
  validatePinnedVersion,
} = require('./lib/upstream-source');

const PROJECT_ROOT = path.join(__dirname, '..');
const DEFAULT_MANIFEST_PATH = path.join(PROJECT_ROOT, '.planning', 'vetted-upstream-versions.json');
const DEFAULT_AUTHORITY_PATH = path.join(PROJECT_ROOT, '.planning', 'upstream-authority.json');
const VALID_ROLES = new Set(['current', 'historical-candidate', 'latest-stable-candidate']);

function readJsonDocument(filePath, description) {
  try {
    const bytes = fs.readFileSync(filePath);
    return {
      bytes,
      value: JSON.parse(bytes.toString('utf-8')),
    };
  } catch (err) {
    throw new Error(`Failed to read ${description} at ${filePath}: ${err.message}`);
  }
}

function readJsonFile(filePath, description) {
  return readJsonDocument(filePath, description).value;
}

function loadVettedManifest(filePath = DEFAULT_MANIFEST_PATH) {
  return readJsonFile(filePath, 'vetted upstream versions manifest');
}

function validateStableVersion(version) {
  try {
    return validatePinnedVersion(version);
  } catch {
    throw new Error(`Version must be stable semver: ${String(version)}`);
  }
}

function isIsoCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validateVettedManifest(manifest, authority = readAuthorityContract({ authorityPath: DEFAULT_AUTHORITY_PATH })) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Vetted upstream manifest must be an object');
  }
  if (manifest.schemaVersion !== 1) {
    throw new Error('Vetted upstream manifest schemaVersion must be 1');
  }
  if (manifest.packageName !== getActivePackageName(authority)) {
    throw new Error(`Manifest packageName must be ${getActivePackageName(authority)}`);
  }
  if (!manifest.policy || manifest.policy.maxVersions !== 3) {
    throw new Error('Manifest policy.maxVersions must be exactly 3');
  }
  if (manifest.policy.prune !== 'oldest-on-successful-bump') {
    throw new Error('Manifest policy.prune must be oldest-on-successful-bump');
  }
  if (!Array.isArray(manifest.versions) || manifest.versions.length !== 3) {
    throw new Error('Vetted upstream manifest must contain exactly 3 versions');
  }

  const blockingEntries = manifest.versions.filter(entry => entry.blocking === true);
  if (blockingEntries.length !== 1) {
    throw new Error('Vetted upstream manifest must contain exactly one blocking entry');
  }
  if (blockingEntries[0].version !== getActivePackageVersion(authority)) {
    throw new Error('Manifest blocking entry must match active upstream version');
  }

  const seenVersions = new Set();
  for (const entry of manifest.versions) {
    validateStableVersion(entry.version);
    if (seenVersions.has(entry.version)) {
      throw new Error(`Duplicate upstream version in manifest: ${entry.version}`);
    }
    seenVersions.add(entry.version);

    if (!VALID_ROLES.has(entry.role)) {
      throw new Error(`Invalid vetted upstream role: ${entry.role}`);
    }
    if (entry.vettedAt !== null && typeof entry.vettedAt !== 'string') {
      throw new Error(`vettedAt must be null or a date string for ${entry.version}`);
    }
    if (entry.vettedAt && !isIsoCalendarDate(entry.vettedAt)) {
      throw new Error(`vettedAt must be a real ISO calendar date for ${entry.version}`);
    }
    if (entry.vettedAt && (!entry.evidence || typeof entry.evidence.matrixReport !== 'string' || entry.evidence.matrixReport.length === 0)) {
      throw new Error(`vettedAt requires non-empty evidence.matrixReport for ${entry.version}`);
    }
    if (entry.vettedAt && entry.evidence.status !== 'passed') {
      throw new Error(`vettedAt requires passed matrix evidence for ${entry.version}`);
    }
    if (entry.vettedAt && !/^[a-f0-9]{64}$/.test(entry.evidence.matrixReportSha256 || '')) {
      throw new Error(`vettedAt requires evidence.matrixReportSha256 for ${entry.version}`);
    }
  }

  return manifest;
}

function listMatrixEntries(manifest) {
  return manifest.versions.map(entry => ({
    version: entry.version,
    role: entry.role,
    blocking: entry.blocking,
    vettedAt: entry.vettedAt,
    evidence: entry.evidence || {},
  }));
}

function validateMatrixEvidenceReport(manifest, report, options = {}) {
  if (!report || report.schemaVersion !== 2) {
    throw new Error('Matrix evidence report schemaVersion must be 2');
  }
  if (report.packageName !== manifest.packageName) {
    throw new Error(`Matrix evidence report packageName must be ${manifest.packageName}`);
  }
  if (report.policy !== 'require-all' || report.ok !== true) {
    throw new Error('Matrix evidence application requires a successful require-all report');
  }
  if (
    !Array.isArray(report.blockingFailures) || report.blockingFailures.length !== 0 ||
    !Array.isArray(report.failedVersions) || report.failedVersions.length !== 0
  ) {
    throw new Error('Successful matrix evidence report must contain empty failure arrays');
  }

  const contract = validateCompatContract(
    options.contract || loadCompatContract(options.contractPath),
    options.compatValidation
  );
  const expectedSuites = [...contract.candidates].sort((left, right) => (
    left.path.localeCompare(right.path)
  ));
  const expectedSuitePaths = expectedSuites.map(suite => suite.path);
  const expectedSuitesByPath = new Map(expectedSuites.map(suite => [suite.path, suite]));
  const expectedExclusions = contract.excluded
    .map(suite => ({ path: suite.path, classification: suite.classification }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const expectedExcludedPaths = expectedExclusions.map(suite => suite.path);
  const manifestByVersion = new Map(manifest.versions.map(entry => [entry.version, entry]));

  const results = Array.isArray(report.results) ? report.results : [];
  const expectedVersions = manifest.versions.map(entry => entry.version).sort();
  const actualVersions = results.map(result => result.version).sort();
  if (
    results.length !== expectedVersions.length ||
    new Set(actualVersions).size !== actualVersions.length ||
    JSON.stringify(actualVersions) !== JSON.stringify(expectedVersions)
  ) {
    throw new Error(`Matrix evidence report must contain exactly the ${expectedVersions.length} manifest versions`);
  }

  for (const result of results) {
    const manifestEntry = manifestByVersion.get(result.version);
    if (
      !manifestEntry ||
      result.role !== manifestEntry.role ||
      result.blocking !== manifestEntry.blocking
    ) {
      throw new Error(`Matrix evidence row ${result.version} must match its manifest role and blocking policy`);
    }

    const suites = Array.isArray(result.suites) ? result.suites : [];
    const actualSuitePaths = suites.map(suite => suite.path).sort();
    const suitesPass = (
      suites.length === expectedSuites.length &&
      new Set(actualSuitePaths).size === actualSuitePaths.length &&
      JSON.stringify(actualSuitePaths) === JSON.stringify(expectedSuitePaths) &&
      suites.every(suite => {
        const expectedSuite = expectedSuitesByPath.get(suite.path);
        return (
          expectedSuite &&
          suite.classification === 'candidate' &&
          suite.authorityBoundary === expectedSuite.authorityBoundary &&
          suite.status === 'passed' &&
          Number.isInteger(suite.passed) &&
          suite.passed > 0 &&
          suite.failed === 0 &&
          suite.skipped === 0 &&
          suite.exitCode === 0 &&
          Array.isArray(suite.errors) &&
          suite.errors.length === 0
        );
      })
    );
    if (!suitesPass) {
      throw new Error(`Matrix evidence row ${result.version} must contain fully passing candidate suites`);
    }

    const actualExcludedPaths = Array.isArray(result.excluded)
      ? [...result.excluded].sort()
      : [];
    const actualExclusions = Array.isArray(result.classifiedExclusions)
      ? result.classifiedExclusions
        .map(suite => ({ path: suite.path, classification: suite.classification }))
        .sort((left, right) => left.path.localeCompare(right.path))
      : [];
    if (
      new Set(actualExcludedPaths).size !== actualExcludedPaths.length ||
      JSON.stringify(actualExcludedPaths) !== JSON.stringify(expectedExcludedPaths) ||
      JSON.stringify(actualExclusions) !== JSON.stringify(expectedExclusions)
    ) {
      throw new Error(`Matrix evidence row ${result.version} must contain exact classified exclusions`);
    }

    const totals = suites.reduce((aggregate, suite) => ({
      passed: aggregate.passed + suite.passed,
      failed: aggregate.failed + suite.failed,
      skipped: aggregate.skipped + suite.skipped,
    }), { passed: 0, failed: 0, skipped: 0 });
    if (
      result.ok !== true ||
      result.status !== 'passed' ||
      result.passed !== totals.passed ||
      result.failed !== totals.failed ||
      result.skipped !== totals.skipped ||
      result.exitCode !== 0 ||
      !Array.isArray(result.errors) ||
      result.errors.length !== 0
    ) {
      throw new Error(`Matrix evidence row ${result.version} must be internally consistent`);
    }
  }

  return report;
}

function cloneManifest(manifest) {
  return JSON.parse(JSON.stringify(manifest));
}

function compareStableVersions(a, b) {
  const [leftMajor, leftMinor, leftPatch] = a.split('.').map(Number);
  const [rightMajor, rightMinor, rightPatch] = b.split('.').map(Number);

  if (leftMajor !== rightMajor) return leftMajor - rightMajor;
  if (leftMinor !== rightMinor) return leftMinor - rightMinor;
  if (leftPatch !== rightPatch) return leftPatch - rightPatch;
  return 0;
}

function candidateForVersion(version, overrides = {}) {
  return {
    version,
    role: 'historical-candidate',
    blocking: false,
    vettedAt: null,
    evidence: {},
    ...overrides,
  };
}

function pruneForBump(manifest, newVersion) {
  validateStableVersion(newVersion);
  const next = cloneManifest(manifest);
  const byVersion = new Map();

  for (const entry of next.versions) {
    byVersion.set(entry.version, {
      ...entry,
      role: entry.role === 'current' ? 'historical-candidate' : entry.role,
      blocking: false,
    });
  }

  byVersion.set(newVersion, candidateForVersion(newVersion, {
    role: 'current',
    blocking: true,
  }));

  next.versions = [...byVersion.values()]
    .sort((a, b) => compareStableVersions(a.version, b.version))
    .slice(-next.policy.maxVersions);

  if (!next.versions.some(entry => entry.blocking && entry.version === newVersion)) {
    throw new Error(`Pruned manifest lost new blocking version: ${newVersion}`);
  }

  return next;
}

function applyMatrixEvidence(
  manifest,
  report,
  date = new Date().toISOString().slice(0, 10),
  options = {}
) {
  const matrixReportSha256 = options.matrixReportSha256;
  if (!/^[a-f0-9]{64}$/.test(matrixReportSha256 || '')) {
    throw new Error('matrixReportSha256 must be a lowercase SHA-256 digest of the exact report bytes');
  }
  const next = cloneManifest(manifest);
  const results = Array.isArray(report.results) ? report.results : [];
  const matrixReport = report.matrixReport || report.reportPath || 'compat-matrix-report.json';

  for (const entry of next.versions) {
    const result = results.find(item => item.version === entry.version);
    if (!result) continue;

    const reportedStatus = result.status || result.outcome || 'unknown';
    const suitesPass = Array.isArray(result.suites) && result.suites.length > 0 &&
      result.suites.every(suite => (
        suite.status === 'passed' && suite.failed === 0 && suite.exitCode === 0
      ));
    const passed = result.ok === true && reportedStatus === 'passed' && suitesPass;
    const status = passed ? 'passed' : 'failed';
    entry.vettedAt = passed ? date : null;
    entry.evidence = {
      ...(entry.evidence || {}),
      matrixReport,
      matrixReportSha256,
      status,
    };
  }

  return next;
}

function printHelp(stream = process.stdout) {
  stream.write(`vetted-upstream-versions - validate and update the Open GSD candidate matrix manifest

USAGE
  node scripts/vetted-upstream-versions.js --validate
  node scripts/vetted-upstream-versions.js --list-json
  node scripts/vetted-upstream-versions.js --apply-matrix-evidence <report>
  node scripts/vetted-upstream-versions.js --prune-for-bump <version>

OPTIONS
  --manifest <path>                 Manifest path. Default: .planning/vetted-upstream-versions.json
  --authority <path>                Upstream authority path. Default: .planning/upstream-authority.json
  --date <iso>                      Evidence date for --apply-matrix-evidence.
  -h, --help                        Show this help.
`);
}

function takeValue(queue, flag) {
  const value = queue.shift();
  if (!value || value.startsWith('-')) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function parseArgs(argv) {
  const options = {
    manifestPath: DEFAULT_MANIFEST_PATH,
    authorityPath: DEFAULT_AUTHORITY_PATH,
  };
  const queue = [...argv];

  while (queue.length > 0) {
    const arg = queue.shift();

    if (arg === '-h' || arg === '--help') {
      options.mode = 'help';
      continue;
    }
    if (arg === '--validate') {
      options.mode = 'validate';
      continue;
    }
    if (arg === '--list-json') {
      options.mode = 'list-json';
      continue;
    }
    if (arg === '--apply-matrix-evidence') {
      options.mode = 'apply-matrix-evidence';
      options.reportPath = takeValue(queue, arg);
      continue;
    }
    if (arg === '--prune-for-bump') {
      options.mode = 'prune-for-bump';
      options.newVersion = takeValue(queue, arg);
      continue;
    }
    if (arg === '--manifest') {
      options.manifestPath = path.resolve(takeValue(queue, arg));
      continue;
    }
    if (arg === '--authority') {
      options.authorityPath = path.resolve(takeValue(queue, arg));
      continue;
    }
    if (arg === '--date') {
      options.date = takeValue(queue, arg);
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  if (!options.mode) {
    options.mode = 'help';
  }

  return options;
}

function readAuthority(authorityPath) {
  return readAuthorityContract({ authorityPath, allowEmbeddedFallback: false });
}

function main(argv = process.argv.slice(2), io = process, deps = {}) {
  try {
    const options = parseArgs(argv);
    if (options.mode === 'help') {
      printHelp(io.stdout);
      return 0;
    }

    const authority = readAuthority(options.authorityPath);
    const manifest = loadVettedManifest(options.manifestPath);
    validateVettedManifest(manifest, authority);

    if (options.mode === 'validate') {
      io.stdout.write(`Vetted upstream manifest valid: ${manifest.versions.length} versions\n`);
      return 0;
    }

    if (options.mode === 'list-json') {
      io.stdout.write(`${JSON.stringify(listMatrixEntries(manifest), null, 2)}\n`);
      return 0;
    }

    if (options.mode === 'apply-matrix-evidence') {
      const reportDocument = readJsonDocument(
        path.resolve(options.reportPath),
        'compat matrix report'
      );
      validateMatrixEvidenceReport(manifest, reportDocument.value);
      const matrixReportSha256 = crypto.createHash('sha256')
        .update(reportDocument.bytes)
        .digest('hex');
      const updated = applyMatrixEvidence(manifest, reportDocument.value, options.date, {
        matrixReportSha256,
      });
      validateVettedManifest(updated, authority);
      const writeJsonFileImpl = deps.writeJsonFileImpl || writeJsonFileAtomic;
      writeJsonFileImpl(options.manifestPath, updated);
      io.stdout.write(`Applied matrix evidence to ${options.manifestPath}\n`);
      return 0;
    }

    if (options.mode === 'prune-for-bump') {
      const updated = pruneForBump(manifest, options.newVersion);
      const writeJsonFileImpl = deps.writeJsonFileImpl || writeJsonFileAtomic;
      writeJsonFileImpl(options.manifestPath, updated);
      io.stdout.write(`Pruned vetted manifest for bump to ${options.newVersion}\n`);
      return 0;
    }

    throw new Error(`Unsupported mode: ${options.mode}`);
  } catch (err) {
    io.stderr.write(`Error: ${err.message}\n`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  DEFAULT_MANIFEST_PATH,
  applyMatrixEvidence,
  listMatrixEntries,
  loadVettedManifest,
  main,
  parseArgs,
  pruneForBump,
  validateMatrixEvidenceReport,
  validateVettedManifest,
};
