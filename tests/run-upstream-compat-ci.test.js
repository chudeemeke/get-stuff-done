const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts', 'run-upstream-compat-ci.js');
const MATRIX_SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts', 'run-compat-matrix.js');

function makeTempDir(prefix = 'gsd-compat-matrix-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeManifest(dir, overrides = {}) {
  const manifestPath = path.join(dir, 'vetted-upstream-versions.json');
  const manifest = {
    schemaVersion: 1,
    packageName: '@opengsd/gsd-core',
    policy: {
      maxVersions: 3,
      prune: 'oldest-on-successful-bump',
      evidenceRequiredForVetted: true,
    },
    versions: [
      {
        version: '1.5.0',
        role: 'historical-candidate',
        blocking: false,
        vettedAt: null,
        evidence: {},
      },
      {
        version: '1.6.0',
        role: 'historical-candidate',
        blocking: false,
        vettedAt: null,
        evidence: {},
      },
      {
        version: '1.6.1',
        role: 'current',
        blocking: true,
        vettedAt: null,
        evidence: {},
      },
    ],
    ...overrides,
  };

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifestPath;
}

describe('run-upstream-compat-ci', () => {
  test('returns success even when upstream compatibility detects expected drift', () => {
    if (!fs.existsSync(SCRIPT_PATH)) {
      expect(fs.existsSync(SCRIPT_PATH)).toBe(true);
      return;
    }

    const { main } = require('../scripts/run-upstream-compat-ci');
    let output = '';
    const exitCode = main({
      runUpstreamCompatImpl: () => ({
        ok: false,
        passed: 10,
        failed: 2,
        skipped: 0,
        excluded: ['sync.test.cjs'],
        errors: [],
        suites: [{
          path: 'roadmap.test.cjs',
          classification: 'candidate',
          authorityBoundary: 'black-box',
          status: 'failed',
          passed: 10,
          failed: 2,
          skipped: 0,
          durationMs: 12,
          exitCode: 1,
          errors: ['roadmap assertion failed'],
        }],
      }),
      stdout: { write: chunk => { output += chunk; } },
    });

    expect(exitCode).toBe(0);
    expect(output).toContain('Result: FAIL');
    expect(output).toContain('non-blocking');
    expect(output).toContain('roadmap.test.cjs');
  });

  test('writes a GitHub step summary when GITHUB_STEP_SUMMARY is available', () => {
    if (!fs.existsSync(SCRIPT_PATH)) {
      expect(fs.existsSync(SCRIPT_PATH)).toBe(true);
      return;
    }

    const { main } = require('../scripts/run-upstream-compat-ci');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-compat-summary-'));
    const summaryPath = path.join(dir, 'summary.md');

    try {
      main({
        runUpstreamCompatImpl: () => ({
          ok: false,
          passed: 4,
          failed: 1,
          skipped: 0,
          excluded: [],
          errors: ['expected branding drift'],
          suites: [{
            path: 'commands.test.cjs',
            classification: 'candidate',
            authorityBoundary: 'black-box',
            status: 'failed',
            passed: 4,
            failed: 1,
            skipped: 0,
            durationMs: 8,
            exitCode: 1,
            errors: ['expected branding drift'],
          }],
        }),
        summaryPath,
        stdout: { write: () => {} },
      });

      const summary = fs.readFileSync(summaryPath, 'utf8');
      expect(summary).toContain('Upstream compatibility');
      expect(summary).toContain('non-blocking');
      expect(summary).toContain('expected branding drift');
      expect(summary).toContain('commands.test.cjs');
      expect(summary.match(/expected branding drift/g)).toHaveLength(1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('run-compat-matrix', () => {
  test('cleans its owned installer root when candidate installation fails', () => {
    const tempRoot = makeTempDir('gsd-compat-matrix-owned-');
    const authority = {
      contractScope: 'maintainer-build-time',
      active: {
        packageName: '@opengsd/gsd-core',
        version: '1.6.1',
        sourceRoot: '.',
        bin: {},
        paths: { gsdTools: 'gsd-core/bin/gsd-tools.cjs' },
      },
    };

    try {
      const { runCandidate } = require('../scripts/run-compat-matrix');
      expect(() => runCandidate({ version: '1.6.1' }, {
        tempRoot,
        authority,
        packageName: '@opengsd/gsd-core',
        installUpstreamPackageImpl: () => {
          throw new Error('candidate install failed');
        },
      })).toThrow('candidate install failed');
      expect(fs.readdirSync(tempRoot)).toEqual([]);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  test('runs the compatibility runner once per manifest entry and classifies results', () => {
    const dir = makeTempDir();

    try {
      const manifestPath = writeManifest(dir);
      const { runCompatMatrix } = require('../scripts/run-compat-matrix');
      const calls = [];
      const { exitCode, report } = runCompatMatrix({
        manifestPath,
        reportPath: path.join(dir, 'compat-matrix-report.json'),
        runCandidateImpl: ({ entry }) => {
          calls.push(entry.version);
          return {
            ok: entry.version !== '1.6.0',
            passed: 12,
            failed: entry.version === '1.6.0' ? 1 : 0,
            skipped: 0,
            excluded: [],
            errors: entry.version === '1.6.0' ? ['expected historical drift'] : [],
            suites: [{
              path: 'roadmap.test.cjs',
              classification: 'candidate',
              authorityBoundary: 'black-box',
              status: entry.version === '1.6.0' ? 'failed' : 'passed',
              passed: 12,
              failed: entry.version === '1.6.0' ? 1 : 0,
              skipped: 0,
              durationMs: 7,
              exitCode: entry.version === '1.6.0' ? 1 : 0,
              errors: entry.version === '1.6.0' ? ['expected historical drift'] : [],
            }],
          };
        },
        now: () => '2026-07-03T22:30:00.000Z',
      });

      expect(exitCode).toBe(0);
      expect(calls).toEqual(['1.5.0', '1.6.0', '1.6.1']);
      expect(report.results).toHaveLength(3);
      expect(report.results[0]).toMatchObject({
        version: '1.5.0',
        blocking: false,
        ok: true,
        exitCode: 0,
        classification: 'informational',
        status: 'passed',
      });
      expect(report.results[2]).toMatchObject({
        version: '1.6.1',
        blocking: true,
        ok: true,
        exitCode: 0,
        classification: 'blocking',
        status: 'passed',
      });
      expect(report.results[1]).toMatchObject({
        version: '1.6.0',
        blocking: false,
        ok: false,
        exitCode: 1,
        classification: 'informational',
        status: 'failed',
      });
      expect(report.schemaVersion).toBe(2);
      expect(report.results[1].suites[0]).toMatchObject({
        path: 'roadmap.test.cjs',
        authorityBoundary: 'black-box',
        status: 'failed',
      });
      const { formatTextReport } = require('../scripts/run-compat-matrix');
      expect(formatTextReport(report)).toContain('1.6.0 | roadmap.test.cjs | black-box | failed');
      expect(typeof report.results[1].durationMs).toBe('number');
      expect(fs.existsSync(path.join(dir, 'compat-matrix-report.json'))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('returns non-zero only when the blocking manifest entry fails', () => {
    const dir = makeTempDir();

    try {
      const manifestPath = writeManifest(dir);
      const { runCompatMatrix } = require('../scripts/run-compat-matrix');
      const { exitCode, report } = runCompatMatrix({
        manifestPath,
        runCandidateImpl: ({ entry }) => ({
          ok: entry.version !== '1.6.1',
          passed: 0,
          failed: entry.version === '1.6.1' ? 1 : 0,
          skipped: 0,
          excluded: [],
          errors: entry.version === '1.6.1' ? ['blocking pin failed'] : [],
        }),
      });

      expect(exitCode).toBe(1);
      expect(report.results.find(result => result.version === '1.6.1')).toMatchObject({
        blocking: true,
        classification: 'blocking',
        ok: false,
        exitCode: 1,
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('--require-all returns non-zero when a historical row is red', () => {
    const dir = makeTempDir();

    try {
      const manifestPath = writeManifest(dir);
      const { main } = require('../scripts/run-compat-matrix');
      let output = '';
      const exitCode = main(['--manifest', manifestPath, '--require-all', '--json'], {
        stdout: { write: chunk => { output += chunk; } },
        stderr: { write: () => {} },
      }, {
        runCandidateImpl: ({ entry }) => ({
          ok: entry.version !== '1.5.0',
          passed: entry.version === '1.5.0' ? 0 : 1,
          failed: entry.version === '1.5.0' ? 1 : 0,
          skipped: 0,
          excluded: [],
          errors: entry.version === '1.5.0' ? ['historical drift'] : [],
          suites: [],
        }),
      });

      expect(exitCode).toBe(1);
      const report = JSON.parse(output);
      expect(report).toMatchObject({
        ok: false,
        policy: 'require-all',
        failedVersions: ['1.5.0'],
      });
      expect(report.results.find(result => result.version === '1.6.1')).toMatchObject({
        blocking: true,
        ok: true,
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('failed suite evidence overrides an inconsistent green row result', () => {
    const dir = makeTempDir();

    try {
      const manifestPath = writeManifest(dir);
      const { runCompatMatrix } = require('../scripts/run-compat-matrix');
      const { exitCode, report } = runCompatMatrix({
        manifestPath,
        runCandidateImpl: ({ entry }) => ({
          ok: true,
          passed: 1,
          failed: 0,
          skipped: 0,
          excluded: [],
          errors: [],
          suites: [{
            path: 'roadmap.test.cjs',
            classification: 'candidate',
            authorityBoundary: 'black-box',
            status: entry.blocking ? 'failed' : 'passed',
            passed: entry.blocking ? 0 : 1,
            failed: entry.blocking ? 1 : 0,
            skipped: 0,
            durationMs: 1,
            exitCode: entry.blocking ? 1 : 0,
            errors: entry.blocking ? ['suite failed'] : [],
          }],
        }),
      });

      const current = report.results.find(result => result.version === '1.6.1');
      expect(exitCode).toBe(1);
      expect(current).toMatchObject({ ok: false, status: 'failed', exitCode: 1 });
      expect(report.blockingFailures).toEqual(['1.6.1']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('records candidate runner errors and continues through the matrix', () => {
    const dir = makeTempDir();

    try {
      const manifestPath = writeManifest(dir);
      const { runCompatMatrix } = require('../scripts/run-compat-matrix');
      const calls = [];
      const { exitCode, report } = runCompatMatrix({
        manifestPath,
        runCandidateImpl: ({ entry }) => {
          calls.push(entry.version);
          if (entry.version === '1.6.0') {
            throw new Error('install failed for historical pin');
          }

          return {
            ok: true,
            passed: 1,
            failed: 0,
            skipped: 0,
            excluded: [],
            errors: [],
          };
        },
      });

      expect(exitCode).toBe(0);
      expect(calls).toEqual(['1.5.0', '1.6.0', '1.6.1']);
      expect(report.results.find(result => result.version === '1.6.0')).toMatchObject({
        classification: 'informational',
        ok: false,
        exitCode: 1,
        errors: ['install failed for historical pin'],
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('invalid manifests exit non-zero before any matrix entry runs', () => {
    const dir = makeTempDir();

    try {
      const manifestPath = writeManifest(dir, { versions: [] });
      const { main } = require('../scripts/run-compat-matrix');
      let calls = 0;
      let stderr = '';
      const exitCode = main(['--manifest', manifestPath, '--json'], {
        stdout: { write: () => {} },
        stderr: { write: chunk => { stderr += chunk; } },
      }, {
        runCandidateImpl: () => {
          calls += 1;
          return { ok: true, passed: 1, failed: 0, skipped: 0, excluded: [], errors: [] };
        },
      });

      expect(exitCode).toBe(1);
      expect(calls).toBe(0);
      expect(stderr).toContain('Vetted upstream manifest must contain exactly 3 versions');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('CLI JSON report contains required compatibility matrix fields', () => {
    const dir = makeTempDir();

    try {
      const manifestPath = writeManifest(dir);
      const reportPath = path.join(dir, 'compat-matrix-report.json');
      const { main } = require('../scripts/run-compat-matrix');
      let stdout = '';
      const exitCode = main(['--manifest', manifestPath, '--json', '--report', reportPath], {
        stdout: { write: chunk => { stdout += chunk; } },
        stderr: { write: () => {} },
      }, {
        runCandidateImpl: ({ entry }) => ({
          ok: true,
          passed: entry.blocking ? 11 : 9,
          failed: 0,
          skipped: 0,
          excluded: [],
          errors: [],
        }),
        now: () => '2026-07-03T22:30:00.000Z',
      });

      expect(exitCode).toBe(0);
      expect(stdout).toContain('"classification"');
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      expect(report.results.every(result => (
        Object.prototype.hasOwnProperty.call(result, 'version') &&
        Object.prototype.hasOwnProperty.call(result, 'blocking') &&
        Object.prototype.hasOwnProperty.call(result, 'ok') &&
        Object.prototype.hasOwnProperty.call(result, 'exitCode') &&
        Object.prototype.hasOwnProperty.call(result, 'durationMs') &&
        Object.prototype.hasOwnProperty.call(result, 'classification')
      ))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
