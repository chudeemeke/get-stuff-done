'use strict';

const { describe, expect, test } = require('bun:test');
const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const crypto = require('node:crypto');
const fs = require('fs');
const os = require('node:os');
const path = require('path');

const {
  applyMatrixEvidence,
  loadVettedManifest,
  main,
  validateMatrixEvidenceReport,
  validateVettedManifest,
  listMatrixEntries,
  pruneForBump,
} = require('../scripts/vetted-upstream-versions');

const PROJECT_ROOT = path.join(__dirname, '..');
const AUTHORITY = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, '.planning', 'upstream-authority.json'), 'utf-8')
);
const ACTIVE_UPSTREAM_VERSION = '1.6.1';
const REPORT_SHA256 = 'a'.repeat(64);
const COMPAT_CONTRACT = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, 'tests', 'upstream-compat-contract.json'), 'utf8')
);
const CANDIDATE_SUITES = COMPAT_CONTRACT.suites.filter(suite => suite.classification === 'candidate');
const EXCLUDED_SUITES = COMPAT_CONTRACT.suites.filter(suite => suite.classification !== 'candidate');

function passingSuites() {
  return CANDIDATE_SUITES.map(suite => ({
    path: suite.path,
    classification: 'candidate',
    authorityBoundary: suite.authorityBoundary,
    status: 'passed',
    passed: 1,
    failed: 0,
    skipped: 0,
    exitCode: 0,
    errors: [],
  }));
}

function passingResult(entry) {
  const suites = passingSuites();
  return {
    version: entry.version,
    role: entry.role,
    blocking: entry.blocking,
    ok: true,
    exitCode: 0,
    status: 'passed',
    passed: suites.reduce((total, suite) => total + suite.passed, 0),
    failed: 0,
    skipped: 0,
    excluded: EXCLUDED_SUITES.map(suite => suite.path),
    classifiedExclusions: EXCLUDED_SUITES.map(suite => ({
      path: suite.path,
      classification: suite.classification,
    })),
    suites,
    errors: [],
  };
}

function candidate(version, overrides = {}) {
  return {
    version,
    role: 'historical-candidate',
    blocking: false,
    vettedAt: null,
    evidence: {},
    ...overrides,
  };
}

function baseManifest(overrides = {}) {
  return {
    schemaVersion: 1,
    packageName: '@opengsd/gsd-core',
    policy: {
      maxVersions: 3,
      prune: 'oldest-on-successful-bump',
      evidenceRequiredForVetted: true,
      notes: 'Test manifest evidence policy.',
    },
    versions: [
      candidate('1.5.0'),
      candidate('1.6.0'),
      candidate(ACTIVE_UPSTREAM_VERSION, { role: 'current', blocking: true }),
    ],
    ...overrides,
  };
}

describe('vetted upstream versions manifest', () => {
  test('loads the repository manifest with exactly 3 stable semver entries', () => {
    const manifest = loadVettedManifest(path.join(PROJECT_ROOT, '.planning', 'vetted-upstream-versions.json'));

    expect(manifest.policy.maxVersions).toBe(3);
    expect(manifest.versions.map(entry => entry.version)).toEqual(['1.5.0', '1.6.0', '1.6.1']);
    expect(() => validateVettedManifest(manifest, AUTHORITY)).not.toThrow();
  });

  test('JSON Schema requires the same evidence fields as runtime validation', () => {
    const schema = JSON.parse(fs.readFileSync(
      path.join(PROJECT_ROOT, '.planning', 'vetted-upstream-versions.schema.json'),
      'utf8'
    ));
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const vetted = baseManifest({
      versions: [
        candidate('1.5.0', {
          vettedAt: '2026-07-13',
          evidence: {
            matrixReport: 'phase43-compat.json',
            matrixReportSha256: REPORT_SHA256,
            status: 'passed',
          },
        }),
        candidate('1.6.0'),
        candidate(ACTIVE_UPSTREAM_VERSION, { role: 'current', blocking: true }),
      ],
    });

    expect(validate(vetted)).toBe(true);
    delete vetted.versions[0].evidence.matrixReportSha256;
    expect(validate(vetted)).toBe(false);
    expect(validate.errors.some(error => error.keyword === 'required')).toBe(true);

    vetted.versions[0].evidence.matrixReportSha256 = REPORT_SHA256;
    vetted.versions[0].evidence.status = 'failed';
    expect(validate(vetted)).toBe(false);
    expect(validate.errors.some(error => error.keyword === 'const')).toBe(true);
  });

  test('fewer or more than exactly 3 versions fails validation', () => {
    expect(() => validateVettedManifest(baseManifest({ versions: [
      candidate('1.5.0', { role: 'current', blocking: true }),
      candidate('1.6.0'),
    ] }), AUTHORITY)).toThrow('exactly 3');

    expect(() => validateVettedManifest(baseManifest({ versions: [
      candidate('1.5.0', { role: 'current', blocking: true }),
      candidate('1.6.0'),
      candidate('1.6.1'),
      candidate('1.7.0'),
    ] }), AUTHORITY)).toThrow('exactly 3');
  });

  test('latest, next, and prerelease versions fail with stable semver errors', () => {
    for (const version of ['latest', 'next', '1.7.0-rc.1']) {
      const manifest = baseManifest({
        versions: [
          candidate('1.5.0'),
          candidate(version),
          candidate(ACTIVE_UPSTREAM_VERSION, { role: 'current', blocking: true }),
        ],
      });

      expect(() => validateVettedManifest(manifest, AUTHORITY)).toThrow('stable semver');
    }
  });

  test('exactly one blocking entry must match upstream authority active version', () => {
    expect(() => validateVettedManifest(baseManifest({
      versions: [
        candidate('1.5.0', { role: 'current', blocking: true }),
        candidate('1.6.0', { blocking: true }),
        candidate(ACTIVE_UPSTREAM_VERSION),
      ],
    }), AUTHORITY)).toThrow('exactly one');

    expect(() => validateVettedManifest(baseManifest({
      versions: [
        candidate('1.5.0', { role: 'current', blocking: true }),
        candidate('1.6.0'),
        candidate(ACTIVE_UPSTREAM_VERSION),
      ],
    }), AUTHORITY)).toThrow('blocking entry must match active upstream version');
  });

  test('candidate entries may keep vettedAt null before matrix evidence exists', () => {
    const manifest = baseManifest();

    expect(manifest.versions.every(entry => entry.vettedAt === null)).toBe(true);
    expect(() => validateVettedManifest(manifest, AUTHORITY)).not.toThrow();
  });

  test('vettedAt requires non-empty evidence.matrixReport', () => {
    expect(() => validateVettedManifest(baseManifest({
      versions: [
        candidate('1.5.0'),
        candidate('1.6.0', { vettedAt: '2026-07-03', evidence: {} }),
        candidate(ACTIVE_UPSTREAM_VERSION, { role: 'current', blocking: true }),
      ],
    }), AUTHORITY)).toThrow('matrixReport');
  });

  test('vettedAt rejects failed matrix evidence loaded from disk', () => {
    expect(() => validateVettedManifest(baseManifest({
      versions: [
        candidate('1.5.0', {
          vettedAt: '2026-07-03',
          evidence: { matrixReport: 'compat-matrix-report.json', status: 'failed' },
        }),
        candidate('1.6.0'),
        candidate(ACTIVE_UPSTREAM_VERSION, { role: 'current', blocking: true }),
      ],
    }), AUTHORITY)).toThrow('vettedAt requires passed matrix evidence');
  });

  test('vettedAt accepts only real ISO calendar dates', () => {
    for (const vettedAt of ['2026-07-13T12:00:00.000Z', '2026-02-30', '13-07-2026']) {
      expect(() => validateVettedManifest(baseManifest({
        versions: [
          candidate('1.5.0', {
            vettedAt,
            evidence: {
              matrixReport: 'phase43-compat.json',
              matrixReportSha256: REPORT_SHA256,
              status: 'passed',
            },
          }),
          candidate('1.6.0'),
          candidate(ACTIVE_UPSTREAM_VERSION, { role: 'current', blocking: true }),
        ],
      }), AUTHORITY)).toThrow('ISO calendar date');
    }
  });

  test('vettedAt requires a lowercase SHA-256 digest of the exact matrix report bytes', () => {
    for (const matrixReportSha256 of [undefined, 'sha256:abc', 'A'.repeat(64)]) {
      expect(() => validateVettedManifest(baseManifest({
        versions: [
          candidate('1.5.0', {
            vettedAt: '2026-07-13',
            evidence: {
              matrixReport: 'phase43-compat.json',
              matrixReportSha256,
              status: 'passed',
            },
          }),
          candidate('1.6.0'),
          candidate(ACTIVE_UPSTREAM_VERSION, { role: 'current', blocking: true }),
        ],
      }), AUTHORITY)).toThrow('matrixReportSha256');
    }
  });

  test('matrix evidence clears vettedAt for red rows and dates only green rows', () => {
    const manifest = baseManifest({
      versions: baseManifest().versions.map(entry => ({
        ...entry,
        vettedAt: '2026-07-03',
        evidence: { matrixReport: 'old-report.json', status: 'passed' },
      })),
    });
    const updated = applyMatrixEvidence(manifest, {
      matrixReport: 'new-report.json',
      results: manifest.versions.map(entry => ({
        version: entry.version,
        ok: entry.version !== '1.5.0',
        status: entry.version === '1.5.0' ? 'failed' : 'passed',
        suites: [{
          path: 'commands.test.cjs',
          status: entry.version === '1.5.0' ? 'failed' : 'passed',
          failed: entry.version === '1.5.0' ? 1 : 0,
          exitCode: entry.version === '1.5.0' ? 1 : 0,
        }],
      })),
    }, '2026-07-13', { matrixReportSha256: REPORT_SHA256 });

    expect(updated.versions[0]).toMatchObject({
      vettedAt: null,
      evidence: {
        matrixReport: 'new-report.json',
        matrixReportSha256: REPORT_SHA256,
        status: 'failed',
      },
    });
    expect(updated.versions.slice(1).every(entry => entry.vettedAt === '2026-07-13')).toBe(true);
    expect(updated.versions.every(entry => entry.evidence.matrixReportSha256 === REPORT_SHA256)).toBe(true);
  });

  test('matrix evidence cannot vet a row with a failed suite', () => {
    const updated = applyMatrixEvidence(baseManifest(), {
      matrixReport: 'new-report.json',
      results: [{
        version: ACTIVE_UPSTREAM_VERSION,
        ok: true,
        status: 'passed',
        suites: [{
          path: 'roadmap.test.cjs',
          status: 'failed',
          failed: 1,
          exitCode: 1,
        }],
      }],
    }, '2026-07-13', { matrixReportSha256: REPORT_SHA256 });
    const current = updated.versions.find(entry => entry.version === ACTIVE_UPSTREAM_VERSION);

    expect(current).toMatchObject({
      vettedAt: null,
      evidence: {
        matrixReport: 'new-report.json',
        matrixReportSha256: REPORT_SHA256,
        status: 'failed',
      },
    });
  });

  test('matrix evidence defaults vettedAt to an ISO calendar date', () => {
    const updated = applyMatrixEvidence(baseManifest(), {
      matrixReport: 'new-report.json',
      results: [{
        version: ACTIVE_UPSTREAM_VERSION,
        ok: true,
        status: 'passed',
        suites: [{ path: 'commands.test.cjs', status: 'passed', failed: 0, exitCode: 0 }],
      }],
    }, undefined, { matrixReportSha256: REPORT_SHA256 });
    const current = updated.versions.find(entry => entry.version === ACTIVE_UPSTREAM_VERSION);

    expect(current.vettedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('CLI applies the SHA-256 of exact durable report bytes to every manifest row', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-vetted-evidence-'));
    const manifestPath = path.join(dir, 'manifest.json');
    const reportPath = path.join(dir, 'phase43-compat.json');
    const reportBytes = Buffer.from(`{\n "schemaVersion": 2,\n "packageName": "@opengsd/gsd-core",\n "policy": "require-all",\n "ok": true,\n "blockingFailures": [],\n "failedVersions": [],\n "matrixReport": ".planning/evidence/phase43-compat.json",\n "results": ${JSON.stringify(
      baseManifest().versions.map(passingResult)
    )}\n}\n`, 'utf8');
    const expectedDigest = crypto.createHash('sha256').update(reportBytes).digest('hex');

    try {
      fs.writeFileSync(manifestPath, `${JSON.stringify(baseManifest(), null, 2)}\n`, 'utf8');
      fs.writeFileSync(reportPath, reportBytes);
      let stderr = '';

      const exitCode = main([
        '--manifest', manifestPath,
        '--authority', path.join(PROJECT_ROOT, '.planning', 'upstream-authority.json'),
        '--date', '2026-07-13',
        '--apply-matrix-evidence', reportPath,
      ], {
        stdout: { write: () => {} },
        stderr: { write: chunk => { stderr += chunk; } },
      });

      expect(exitCode).toBe(0);
      expect(stderr).toBe('');
      const updated = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(updated.versions.every(entry => (
        entry.vettedAt === '2026-07-13' &&
        entry.evidence.matrixReportSha256 === expectedDigest
      ))).toBe(true);
      expect(fs.readdirSync(dir).sort()).toEqual(['manifest.json', 'phase43-compat.json']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('matrix evidence application rejects non-closeout and incomplete reports', () => {
    const manifest = baseManifest();
    const passingResults = manifest.versions.map(passingResult);
    const report = {
      schemaVersion: 2,
      packageName: '@opengsd/gsd-core',
      policy: 'require-all',
      ok: true,
      blockingFailures: [],
      failedVersions: [],
      results: passingResults,
    };

    expect(() => validateMatrixEvidenceReport(manifest, {
      ...report,
      policy: 'current-pin',
    })).toThrow('require-all');
    expect(() => validateMatrixEvidenceReport(manifest, {
      ...report,
      packageName: 'wrong-package',
    })).toThrow('packageName');
    expect(() => validateMatrixEvidenceReport(manifest, {
      ...report,
      failedVersions: ['1.6.0'],
    })).toThrow('failure arrays');
    expect(() => validateMatrixEvidenceReport(manifest, {
      ...report,
      results: passingResults.slice(1),
    })).toThrow('exactly the 3 manifest versions');
    expect(() => validateMatrixEvidenceReport(manifest, {
      ...report,
      results: passingResults.map((result, index) => index === 1
        ? { ...result, suites: [{ ...result.suites[0], classification: 'repository' }] }
        : result),
    })).toThrow('fully passing candidate suites');
    expect(() => validateMatrixEvidenceReport(manifest, {
      ...report,
      results: passingResults.map((result, index) => index === 1
        ? { ...result, errors: ['contradictory row error'] }
        : result),
    })).toThrow('internally consistent');
    expect(() => validateMatrixEvidenceReport(manifest, {
      ...report,
      results: passingResults.map((result, index) => index === 1
        ? {
          ...result,
          suites: result.suites.map((suite, suiteIndex) => suiteIndex === 0
            ? { ...suite, errors: ['contradictory suite error'] }
            : suite),
        }
        : result),
    })).toThrow('fully passing candidate suites');
    expect(() => validateMatrixEvidenceReport(manifest, {
      ...report,
      results: passingResults.map((result, index) => index === 1
        ? { ...result, passed: result.passed + 1 }
        : result),
    })).toThrow('internally consistent');
    expect(() => validateMatrixEvidenceReport(manifest, {
      ...report,
      results: passingResults.map((result, index) => index === 1
        ? { ...result, excluded: result.excluded.slice(1) }
        : result),
    })).toThrow('classified exclusions');
    expect(() => validateMatrixEvidenceReport(manifest, {
      ...report,
      results: passingResults.map((result, index) => index === 1
        ? { ...result, blocking: !result.blocking }
        : result),
    })).toThrow('manifest role');
  });

  test('manifest publication failures propagate without changing the existing manifest', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-vetted-publish-failure-'));
    const manifestPath = path.join(dir, 'manifest.json');
    const reportPath = path.join(dir, 'phase43-compat.json');
    const originalBytes = `${JSON.stringify(baseManifest(), null, 2)}\n`;
    const report = {
      schemaVersion: 2,
      packageName: '@opengsd/gsd-core',
      policy: 'require-all',
      ok: true,
      blockingFailures: [],
      failedVersions: [],
      matrixReport: '.planning/evidence/phase43-compat.json',
      results: baseManifest().versions.map(passingResult),
    };

    try {
      fs.writeFileSync(manifestPath, originalBytes, 'utf8');
      fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
      let stderr = '';
      const publicationError = Object.assign(new Error('manifest publish denied'), { code: 'EACCES' });

      const exitCode = main([
        '--manifest', manifestPath,
        '--authority', path.join(PROJECT_ROOT, '.planning', 'upstream-authority.json'),
        '--apply-matrix-evidence', reportPath,
      ], {
        stdout: { write: () => {} },
        stderr: { write: chunk => { stderr += chunk; } },
      }, {
        writeJsonFileImpl: () => { throw publicationError; },
      });

      expect(exitCode).toBe(1);
      expect(stderr).toContain('manifest publish denied');
      expect(fs.readFileSync(manifestPath, 'utf8')).toBe(originalBytes);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('listMatrixEntries returns the three manifest entries in order', () => {
    const entries = listMatrixEntries(baseManifest());

    expect(entries).toHaveLength(3);
    expect(entries.map(entry => entry.version)).toEqual(['1.5.0', '1.6.0', '1.6.1']);
    expect(entries[2].blocking).toBe(true);
  });

  test('pruneForBump drops the oldest historical version and keeps exactly 3 versions', () => {
    const pruned = pruneForBump(baseManifest(), '1.7.0');

    expect(pruned.versions).toHaveLength(3);
    expect(pruned.versions.map(entry => entry.version)).toEqual(['1.6.0', '1.6.1', '1.7.0']);
    expect(pruned.versions.filter(entry => entry.blocking)).toEqual([
      expect.objectContaining({ version: '1.7.0', role: 'current' }),
    ]);
  });

  test('test source covers acceptance terms', () => {
    const source = fs.readFileSync(__filename, 'utf-8');

    expect(source).toContain('exactly 3');
    expect(source).toContain('stable semver');
    expect(source).toContain('blocking');
    expect(source).toContain('vettedAt');
    expect(source).toContain('matrixReport');
    expect(source).toContain('pruneForBump');
  });
});
