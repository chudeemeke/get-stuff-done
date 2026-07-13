const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { cleanupOwnedTemp, createOwnedTemp } = require('../scripts/lib/owned-temp');

const PROJECT_ROOT = path.join(__dirname, '..');
const MATRIX_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'run-compat-matrix.js');
const COMPAT_CONTRACT = require('./upstream-compat-contract.json');
const OWNER = 'get-stuff-done/compat-transition-test';
const ACTIVE_VERSION = '1.6.1';
const NODE_EXECUTABLE = process.versions.bun ? 'node' : process.execPath;
const EXPECTED_SUITE_PATHS = COMPAT_CONTRACT.suites
  .filter((suite) => suite.classification === 'candidate')
  .map((suite) => suite.path);

function passingSuite(suitePath) {
  return {
    path: suitePath,
    status: 'passed',
    passed: 1,
    failed: 0,
    skipped: 0,
    exitCode: 0,
    errors: [],
  };
}

function transitionSuites() {
  return EXPECTED_SUITE_PATHS.map((suitePath) => (
    suitePath === 'roadmap.test.cjs'
      ? {
        path: suitePath,
        status: 'failed',
        passed: 12,
        failed: 1,
        skipped: 0,
        exitCode: 1,
        errors: ['expected'],
      }
      : passingSuite(suitePath)
  ));
}

function transitionReport(suites = transitionSuites()) {
  const totals = suites.reduce((result, suite) => ({
    passed: result.passed + suite.passed,
    failed: result.failed + suite.failed,
    skipped: result.skipped + suite.skipped,
  }), { passed: 0, failed: 0, skipped: 0 });
  const errors = suites.flatMap((suite) => (
    suite.errors.map((error) => `${suite.path}: ${error}`)
  ));

  return {
    ok: false,
    results: [{
      version: ACTIVE_VERSION,
      ok: false,
      status: 'failed',
      exitCode: 1,
      ...totals,
      errors,
      suites,
    }],
  };
}

function hasNonEmptyErrorEvidence(errors) {
  return (
    Array.isArray(errors) &&
    errors.length > 0 &&
    errors.every((error) => typeof error === 'string' && error.trim().length > 0)
  );
}

function assertExpectedTransition(exitCode, report) {
  if (exitCode !== 1) {
    throw new Error(`Expected raw matrix exit 1, received ${exitCode}`);
  }
  if (!report || !Array.isArray(report.results) || report.results.length !== 1) {
    throw new Error('Expected exactly one active-version matrix result');
  }

  const [result] = report.results;
  if (result.version !== ACTIVE_VERSION) {
    throw new Error(`Expected active version ${ACTIVE_VERSION}, received ${result.version}`);
  }
  if (!Array.isArray(result.suites)) {
    throw new Error('Expected complete candidate suite evidence');
  }

  const actualPaths = result.suites.map((suite) => suite.path);
  const actualPathSet = new Set(actualPaths);
  const missingPaths = EXPECTED_SUITE_PATHS.filter((suitePath) => !actualPathSet.has(suitePath));
  const extraPaths = actualPaths.filter((suitePath) => !EXPECTED_SUITE_PATHS.includes(suitePath));
  if (
    actualPaths.length !== EXPECTED_SUITE_PATHS.length ||
    actualPathSet.size !== actualPaths.length ||
    missingPaths.length > 0 ||
    extraPaths.length > 0
  ) {
    throw new Error('Expected complete candidate suite evidence');
  }

  for (const suite of result.suites) {
    const countsAreValid = ['passed', 'failed', 'skipped'].every((field) => (
      Number.isInteger(suite[field]) && suite[field] >= 0
    ));
    const passed = (
      suite.status === 'passed' &&
      countsAreValid &&
      suite.failed === 0 &&
      suite.exitCode === 0 &&
      Array.isArray(suite.errors) &&
      suite.errors.length === 0
    );
    const failed = (
      suite.status === 'failed' &&
      countsAreValid &&
      suite.failed > 0 &&
      Number.isInteger(suite.exitCode) &&
      suite.exitCode !== 0 &&
      hasNonEmptyErrorEvidence(suite.errors)
    );
    if (!passed && !failed) {
      throw new Error(`Found contradictory suite evidence for ${suite.path}`);
    }
  }

  const failedSuites = result.suites.filter((suite) => suite.status !== 'passed');
  if (failedSuites.length !== 1 || failedSuites[0].path !== 'roadmap.test.cjs') {
    const paths = failedSuites.map((suite) => suite.path).join(', ') || 'none';
    throw new Error(`Expected only roadmap.test.cjs to fail, received: ${paths}`);
  }
  if (report.ok !== false || result.ok !== false || result.status !== 'failed') {
    throw new Error('Expected report and active row to remain failed');
  }

  const totals = result.suites.reduce((aggregate, suite) => ({
    passed: aggregate.passed + suite.passed,
    failed: aggregate.failed + suite.failed,
    skipped: aggregate.skipped + suite.skipped,
  }), { passed: 0, failed: 0, skipped: 0 });
  if (
    !Number.isInteger(result.exitCode) ||
    result.exitCode === 0 ||
    result.passed !== totals.passed ||
    result.failed !== totals.failed ||
    result.skipped !== totals.skipped ||
    !hasNonEmptyErrorEvidence(result.errors)
  ) {
    throw new Error('Found contradictory active row evidence');
  }

  return failedSuites[0];
}

describe('Plan 11B compatibility transition contract', () => {
  test('rejects zero exit, missing evidence, extra failures, and a different failure', () => {
    const baseReport = transitionReport();

    expect(() => assertExpectedTransition(0, baseReport)).toThrow('Expected raw matrix exit 1');
    expect(() => assertExpectedTransition(1, null)).toThrow('Expected exactly one active-version');
    expect(() => assertExpectedTransition(1, {
      ...baseReport,
      results: [{
        ...baseReport.results[0],
        suites: baseReport.results[0].suites.filter((suite) => suite.path !== 'config.test.cjs'),
      }],
    })).toThrow('complete candidate suite evidence');
    expect(() => assertExpectedTransition(1, {
      ...baseReport,
      results: [{
        ...baseReport.results[0],
        suites: baseReport.results[0].suites.map((suite) => (
          suite.path === 'phase.test.cjs'
            ? { ...suite, status: 'failed', failed: 1, exitCode: 1, errors: ['unexpected'] }
            : suite
        )),
      }],
    })).toThrow('phase.test.cjs, roadmap.test.cjs');
    expect(() => assertExpectedTransition(1, {
      ...baseReport,
      results: [{
        ...baseReport.results[0],
        suites: baseReport.results[0].suites.map((suite) => (
          suite.path === 'roadmap.test.cjs'
            ? passingSuite(suite.path)
            : suite.path === 'phase.test.cjs'
              ? { ...suite, status: 'failed', failed: 1, exitCode: 1, errors: ['unexpected'] }
              : suite
        )),
      }],
    })).toThrow('received: phase.test.cjs');
  });

  test('rejects internally contradictory suite evidence', () => {
    const suites = transitionSuites();
    const configIndex = suites.findIndex((suite) => suite.path === 'config.test.cjs');
    suites[configIndex] = {
      ...suites[configIndex],
      failed: 2,
      exitCode: 1,
    };
    const report = transitionReport(suites);

    expect(() => assertExpectedTransition(1, report)).toThrow('contradictory suite evidence');
  });

  test('rejects passed suites that retain error evidence', () => {
    const suites = transitionSuites();
    const configIndex = suites.findIndex((suite) => suite.path === 'config.test.cjs');
    suites[configIndex] = {
      ...suites[configIndex],
      errors: ['unexpected failure chatter'],
    };
    const report = transitionReport(suites);

    expect(() => assertExpectedTransition(1, report)).toThrow('contradictory suite evidence');
  });

  test('rejects empty or non-string failure evidence', () => {
    for (const errors of [[null], ['']]) {
      const suites = transitionSuites();
      const roadmapIndex = suites.findIndex((suite) => suite.path === 'roadmap.test.cjs');
      suites[roadmapIndex] = { ...suites[roadmapIndex], errors };

      expect(() => assertExpectedTransition(1, transitionReport(suites)))
        .toThrow('contradictory suite evidence');
    }
  });

  test('rejects row aggregates that contradict suite records', () => {
    const report = transitionReport();
    report.results[0].failed = 0;
    report.results[0].errors = [];

    expect(() => assertExpectedTransition(1, report)).toThrow('contradictory active row evidence');
  });

  test('rejects missing or non-integer row exit evidence', () => {
    for (const exitCode of [undefined, null, '1', 0]) {
      const report = transitionReport();
      report.results[0].exitCode = exitCode;

      expect(() => assertExpectedTransition(1, report))
        .toThrow('contradictory active row evidence');
    }
  });

  test('active matrix is red only for the roadmap preservation transition', () => {
    const protectedRoots = [
      PROJECT_ROOT,
      path.join(PROJECT_ROOT, 'dist'),
      path.join(PROJECT_ROOT, 'node_modules'),
    ];
    const owned = createOwnedTemp({
      tempRoot: os.tmpdir(),
      prefix: 'gsd-compat-transition-',
      owner: OWNER,
      protectedRoots,
    });
    const reportPath = path.join(owned.path, 'active-matrix.json');

    try {
      const result = spawnSync(
        NODE_EXECUTABLE,
        [MATRIX_SCRIPT, '--version', ACTIVE_VERSION, '--json', '--report', reportPath],
        {
          cwd: PROJECT_ROOT,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 300000,
        }
      );

      expect(result.error).toBeUndefined();
      expect(fs.existsSync(reportPath)).toBe(true);
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      const roadmapFailure = assertExpectedTransition(result.status, report);
      expect(roadmapFailure.failed).toBeGreaterThan(0);
      expect(roadmapFailure.errors.length).toBeGreaterThan(0);
    } finally {
      cleanupOwnedTemp(owned.path, {
        tempRoot: os.tmpdir(),
        owner: OWNER,
        protectedRoots,
      });
    }
  }, 360000);
});
