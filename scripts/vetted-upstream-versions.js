#!/usr/bin/env node
'use strict';

/* eslint-disable security/detect-non-literal-fs-filename -- maintainer CLI reads/writes explicit repo-local manifest/report paths. */

const fs = require('fs');
const path = require('path');
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

function readJsonFile(filePath, description) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    throw new Error(`Failed to read ${description} at ${filePath}: ${err.message}`);
  }
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
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
    if (entry.vettedAt && (!entry.evidence || typeof entry.evidence.matrixReport !== 'string' || entry.evidence.matrixReport.length === 0)) {
      throw new Error(`vettedAt requires non-empty evidence.matrixReport for ${entry.version}`);
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

function applyMatrixEvidence(manifest, report, date = new Date().toISOString()) {
  const next = cloneManifest(manifest);
  const results = Array.isArray(report.results) ? report.results : [];
  const matrixReport = report.matrixReport || report.reportPath || 'compat-matrix-report.json';

  for (const entry of next.versions) {
    const result = results.find(item => item.version === entry.version);
    if (!result) continue;

    entry.vettedAt = date;
    entry.evidence = {
      ...(entry.evidence || {}),
      matrixReport,
      status: result.status || result.outcome || 'unknown',
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

function main(argv = process.argv.slice(2), io = process) {
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
      const report = readJsonFile(path.resolve(options.reportPath), 'compat matrix report');
      const updated = applyMatrixEvidence(manifest, report, options.date);
      validateVettedManifest(updated, authority);
      writeJsonFile(options.manifestPath, updated);
      io.stdout.write(`Applied matrix evidence to ${options.manifestPath}\n`);
      return 0;
    }

    if (options.mode === 'prune-for-bump') {
      const updated = pruneForBump(manifest, options.newVersion);
      writeJsonFile(options.manifestPath, updated);
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
  validateVettedManifest,
};
