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
        role: 'current',
        blocking: true,
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
        role: 'latest-stable-candidate',
        blocking: false,
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
      }),
      stdout: { write: chunk => { output += chunk; } },
    });

    expect(exitCode).toBe(0);
    expect(output).toContain('Result: FAIL');
    expect(output).toContain('non-blocking');
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
        }),
        summaryPath,
        stdout: { write: () => {} },
      });

      const summary = fs.readFileSync(summaryPath, 'utf8');
      expect(summary).toContain('Upstream compatibility');
      expect(summary).toContain('non-blocking');
      expect(summary).toContain('expected branding drift');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('run-compat-matrix', () => {
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
          };
        },
        now: () => '2026-07-03T22:30:00.000Z',
      });

      expect(exitCode).toBe(0);
      expect(calls).toEqual(['1.5.0', '1.6.0', '1.6.1']);
      expect(report.results).toHaveLength(3);
      expect(report.results[0]).toMatchObject({
        version: '1.5.0',
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
          ok: entry.version !== '1.5.0',
          passed: 0,
          failed: entry.version === '1.5.0' ? 1 : 0,
          skipped: 0,
          excluded: [],
          errors: entry.version === '1.5.0' ? ['blocking pin failed'] : [],
        }),
      });

      expect(exitCode).toBe(1);
      expect(report.results.find(result => result.version === '1.5.0')).toMatchObject({
        blocking: true,
        classification: 'blocking',
        ok: false,
        exitCode: 1,
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
