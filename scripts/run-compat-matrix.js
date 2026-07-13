#!/usr/bin/env node
'use strict';

/* eslint-disable security/detect-non-literal-fs-filename -- Matrix verification installs exact upstream pins into temp roots and writes explicit report paths. */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { compose } = require('./compose');
const {
  getCompatPackageRoot,
  runUpstreamCompat,
} = require('./run-upstream-compat');
const {
  loadVettedManifest,
  listMatrixEntries,
  validateVettedManifest,
} = require('./vetted-upstream-versions');
const { cleanupOwnedTemp, createOwnedTemp } = require('./lib/owned-temp');
const { readAuthorityContract } = require('./lib/upstream-source');

const PROJECT_ROOT = path.join(__dirname, '..');
const DEFAULT_MANIFEST_PATH = path.join(PROJECT_ROOT, '.planning', 'vetted-upstream-versions.json');
const DEFAULT_AUTHORITY_PATH = path.join(PROJECT_ROOT, '.planning', 'upstream-authority.json');
const DEFAULT_REPORT_PATH = 'compat-matrix-report.json';
const MATRIX_TEMP_OWNER = 'get-stuff-done/compat-matrix';

function packageNameToParts(packageName) {
  if (packageName.startsWith('@')) {
    return packageName.split('/');
  }
  return [packageName];
}

function normaliseReportPath(reportPath) {
  if (!reportPath) return DEFAULT_REPORT_PATH;
  const relative = path.relative(PROJECT_ROOT, path.resolve(reportPath));
  return relative.startsWith('..') ? path.basename(reportPath) : relative.replace(/\\/g, '/');
}

function getNpmInvocation(args) {
  if (process.platform === 'win32') {
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', 'npm.cmd', ...args],
    };
  }

  return {
    command: 'npm',
    args,
  };
}

function installUpstreamPackage({ packageName, version, tempRoot, execFileSyncImpl = execFileSync }) {
  const packageSpec = `${packageName}@${version}`;
  const invocation = getNpmInvocation([
    'install',
    '--prefix',
    tempRoot,
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    packageSpec,
  ]);

  execFileSyncImpl(invocation.command, invocation.args, {
    cwd: tempRoot,
    stdio: 'inherit',
    timeout: 120000,
  });

  return path.join(tempRoot, 'node_modules', ...packageNameToParts(packageName));
}

function runCandidate(entry, options = {}) {
  const tempBase = options.tempRoot || os.tmpdir();
  const tempLifecycle = options.tempLifecycle || {
    create: createOwnedTemp,
    cleanup: cleanupOwnedTemp,
  };
  const protectedRoots = options.protectedRoots || [
    PROJECT_ROOT,
    path.join(PROJECT_ROOT, 'dist'),
    path.join(PROJECT_ROOT, 'node_modules'),
  ];
  const ownedTemp = tempLifecycle.create({
    tempRoot: tempBase,
    prefix: 'gsd-compat-matrix-',
    owner: MATRIX_TEMP_OWNER,
    protectedRoots,
  });
  const tempRoot = ownedTemp.path;

  try {
    const authority = options.authority || readAuthorityContract({
      authorityPath: options.authorityPath || DEFAULT_AUTHORITY_PATH,
      allowEmbeddedFallback: false,
    });
    const installImpl = options.installUpstreamPackageImpl || installUpstreamPackage;
    const upstreamDir = installImpl({
      packageName: options.packageName,
      version: entry.version,
      tempRoot,
      execFileSyncImpl: options.execFileSyncImpl,
    });
    const distRoot = path.join(tempRoot, 'dist');

    const composeImpl = options.composeImpl || compose;
    composeImpl({
      upstreamDir,
      overlayDir: path.join(PROJECT_ROOT, 'overlay'),
      distDir: distRoot,
    });

    const compatImpl = options.runUpstreamCompatImpl || runUpstreamCompat;
    return compatImpl({
      distDir: getCompatPackageRoot({ distRoot, authority }),
    });
  } finally {
    tempLifecycle.cleanup(tempRoot, {
      tempRoot: tempBase,
      owner: MATRIX_TEMP_OWNER,
      protectedRoots,
    });
  }
}

function resultExitCode(result) {
  if (typeof result.exitCode === 'number') return result.exitCode;
  return result.ok ? 0 : 1;
}

function classifyResult(entry, result, durationMs) {
  const suites = Array.isArray(result.suites) ? result.suites : [];
  const suitesPass = suites.length === 0 || suites.every(suite => (
    suite.classification === 'candidate' &&
    suite.status === 'passed' &&
    suite.failed === 0 &&
    suite.exitCode === 0
  ));
  const ok = result.ok === true && suitesPass;
  const reportedExitCode = resultExitCode(result);
  const exitCode = ok ? 0 : (reportedExitCode === 0 ? 1 : reportedExitCode);

  return {
    version: entry.version,
    role: entry.role,
    blocking: entry.blocking === true,
    ok,
    exitCode,
    durationMs,
    classification: entry.blocking === true ? 'blocking' : 'informational',
    status: ok ? 'passed' : 'failed',
    passed: result.passed || 0,
    failed: result.failed || 0,
    skipped: result.skipped || 0,
    excluded: Array.isArray(result.excluded) ? result.excluded : [],
    classifiedExclusions: Array.isArray(result.classifiedExclusions)
      ? result.classifiedExclusions
      : [],
    suites,
    errors: Array.isArray(result.errors) ? result.errors : [],
  };
}

function buildReport({ manifest, results, generatedAt, reportPath, requireAll = false }) {
  const blockingFailures = results.filter(result => result.blocking && !result.ok);
  const failedResults = results.filter(result => !result.ok);

  return {
    schemaVersion: 2,
    packageName: manifest.packageName,
    generatedAt,
    matrixReport: normaliseReportPath(reportPath),
    policy: requireAll ? 'require-all' : 'current-pin',
    ok: requireAll ? failedResults.length === 0 : blockingFailures.length === 0,
    blockingFailures: blockingFailures.map(result => result.version),
    failedVersions: failedResults.map(result => result.version),
    results,
  };
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function filterEntries(entries, version) {
  if (!version) return entries;
  const filtered = entries.filter(entry => entry.version === version);
  if (filtered.length === 0) {
    throw new Error(`Version ${version} is not present in the vetted upstream manifest`);
  }
  return filtered;
}

function runCompatMatrix(options = {}) {
  const manifestPath = path.resolve(options.manifestPath || DEFAULT_MANIFEST_PATH);
  const authorityPath = path.resolve(options.authorityPath || DEFAULT_AUTHORITY_PATH);
  const authority = options.authority || readAuthorityContract({ authorityPath, allowEmbeddedFallback: false });
  const manifest = loadVettedManifest(manifestPath);
  validateVettedManifest(manifest, authority);
  if (options.requireAll && options.version) {
    throw new Error('--require-all cannot be combined with --version');
  }

  const runCandidateImpl = options.runCandidateImpl || (({ entry }) => runCandidate(entry, {
    authority,
    authorityPath,
    packageName: manifest.packageName,
    execFileSyncImpl: options.execFileSyncImpl,
    tempRoot: options.tempRoot,
    tempLifecycle: options.tempLifecycle,
    protectedRoots: options.protectedRoots,
  }));
  const selectedEntries = filterEntries(listMatrixEntries(manifest), options.version);
  const results = [];

  for (const entry of selectedEntries) {
    const startMs = Date.now();
    let result;
    try {
      result = runCandidateImpl({ entry, manifest, composeFirst: options.composeFirst === true });
    } catch (err) {
      result = {
        ok: false,
        exitCode: 1,
        passed: 0,
        failed: 0,
        skipped: 0,
        excluded: [],
        errors: [err.message],
      };
    }
    results.push(classifyResult(entry, result, Date.now() - startMs));
  }

  const report = buildReport({
    manifest,
    results,
    generatedAt: options.now ? options.now() : new Date().toISOString(),
    reportPath: options.reportPath,
    requireAll: options.requireAll === true,
  });

  if (options.reportPath) {
    writeJsonFile(path.resolve(options.reportPath), report);
  }

  return {
    exitCode: report.ok ? 0 : 1,
    report,
  };
}

function printHelp(stream = process.stdout) {
  stream.write(`run-compat-matrix - run upstream compatibility checks across vetted Open GSD pins

USAGE
  node scripts/run-compat-matrix.js [options]

OPTIONS
  --manifest <path>       Vetted upstream manifest. Default: .planning/vetted-upstream-versions.json
  --authority <path>      Upstream authority contract. Default: .planning/upstream-authority.json
  --json                  Print the JSON report instead of text.
  --report <path>         Write the JSON report to a file.
  --compose-first         Accepted for CI parity; matrix candidates always compose isolated temp dist output.
  --require-all           Fail when any matrix row is red. Cannot be combined with --version.
  --version <x.y.z>       Run one manifest version instead of every entry.
  -h, --help              Show this help.
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
    json: false,
    composeFirst: false,
    requireAll: false,
  };
  const queue = [...argv];

  while (queue.length > 0) {
    const arg = queue.shift();

    if (arg === '-h' || arg === '--help') {
      options.help = true;
      continue;
    }
    if (arg === '--manifest') {
      options.manifestPath = takeValue(queue, arg);
      continue;
    }
    if (arg === '--authority') {
      options.authorityPath = takeValue(queue, arg);
      continue;
    }
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--report') {
      options.reportPath = takeValue(queue, arg);
      continue;
    }
    if (arg === '--compose-first') {
      options.composeFirst = true;
      continue;
    }
    if (arg === '--require-all') {
      options.requireAll = true;
      continue;
    }
    if (arg === '--version') {
      options.version = takeValue(queue, arg);
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function formatTextReport(report) {
  const lines = [
    'Compatibility matrix report',
    '===========================',
    '',
    `Package: ${report.packageName}`,
    `Generated: ${report.generatedAt}`,
    `Result: ${report.ok ? 'PASS' : 'FAIL'}`,
    '',
  ];

  for (const result of report.results) {
    lines.push(
      `- ${result.version} (${result.classification}): ${result.status}; ` +
      `passed=${result.passed} failed=${result.failed} skipped=${result.skipped} durationMs=${result.durationMs}`
    );
  }

  const suiteRows = report.results.flatMap(result => (
    (result.suites || []).map(suite => ({ version: result.version, ...suite }))
  ));
  if (suiteRows.length > 0) {
    lines.push('');
    lines.push('Suites:');
    lines.push('Version | Suite | Boundary | Status | Passed | Failed | Skipped | Duration');
    for (const suite of suiteRows) {
      lines.push(
        `${suite.version} | ${suite.path} | ${suite.authorityBoundary} | ${suite.status} | ` +
        `${suite.passed} | ${suite.failed} | ${suite.skipped} | ${suite.durationMs}ms`
      );
      for (const error of (suite.errors || []).slice(0, 5)) {
        lines.push(`  ${String(error).slice(0, 500)}`);
      }
    }
  }

  lines.push('');
  return lines.join('\n');
}

function main(argv = process.argv.slice(2), io = process, deps = {}) {
  try {
    const options = parseArgs(argv);
    if (options.help) {
      printHelp(io.stdout);
      return 0;
    }

    const { exitCode, report } = runCompatMatrix({
      ...options,
      runCandidateImpl: deps.runCandidateImpl,
      execFileSyncImpl: deps.execFileSyncImpl,
      now: deps.now,
      authority: deps.authority,
    });

    if (options.json) {
      io.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    } else {
      io.stdout.write(formatTextReport(report));
    }

    return exitCode;
  } catch (err) {
    io.stderr.write(`Error: ${err.message}\n`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  buildReport,
  classifyResult,
  formatTextReport,
  getNpmInvocation,
  installUpstreamPackage,
  main,
  parseArgs,
  runCandidate,
  runCompatMatrix,
};
