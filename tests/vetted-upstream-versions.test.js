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
  verifyEvidenceFiles,
  listMatrixEntries,
  pruneForBump,
} = require('../scripts/vetted-upstream-versions');

const PROJECT_ROOT = path.join(__dirname, '..');
const AUTHORITY = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, '.planning', 'upstream-authority.json'), 'utf-8')
);
// Derived from the live authority contract (Testing rule 5: never hardcode a
// copy of an authority that lives elsewhere) — validateVettedManifest couples
// the blocking entry to this value, so fixtures must track it across bumps.
const ACTIVE_UPSTREAM_VERSION = AUTHORITY.active.version;
const REPORT_SHA256 = 'a'.repeat(64);
const COMPAT_CONTRACT = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, 'tests', 'upstream-compat-contract.json'), 'utf8')
);
const CANDIDATE_SUITES = COMPAT_CONTRACT.suites.filter(suite => suite.classification === 'candidate');
const EXCLUDED_SUITES = COMPAT_CONTRACT.suites.filter(suite => suite.classification !== 'candidate');

test('evidence validation rejects changed or missing report bytes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-evidence-hash-'));
  try {
    const report = path.join(root, 'report.json');
    const bytes = '{"verified":true}\n';
    fs.writeFileSync(report, bytes);
    const manifest = { versions: [{ version: '1.8.0', vettedAt: '2026-09-05', evidence: {
      matrixReport: 'report.json', matrixReportSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    } }] };
    expect(() => verifyEvidenceFiles(manifest, root)).not.toThrow();
    fs.writeFileSync(report, bytes + ' ');
    expect(() => verifyEvidenceFiles(manifest, root)).toThrow('SHA-256');
    fs.unlinkSync(report);
    expect(() => verifyEvidenceFiles(manifest, root)).toThrow();
    manifest.versions[0].evidence.matrixReport = '../outside.json';
    expect(() => verifyEvidenceFiles(manifest, root)).toThrow('outside');
    manifest.versions[0].vettedAt = null;
    expect(() => verifyEvidenceFiles(manifest, root)).not.toThrow();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('evidence validation rejects a directory link outside the project even with matching bytes', () => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-evidence-link-'));
  const root = path.join(sandbox, 'project');
  const outside = path.join(sandbox, 'outside');
  const link = path.join(root, 'reports');
  try {
    fs.mkdirSync(root);
    fs.mkdirSync(outside);
    const bytes = '{"verified":true}\n';
    fs.writeFileSync(path.join(outside, 'report.json'), bytes);
    fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
    const manifest = { versions: [{ version: ACTIVE_UPSTREAM_VERSION, vettedAt: '2026-09-05', evidence: {
      matrixReport: 'reports/report.json', matrixReportSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    } }] };
    expect(() => verifyEvidenceFiles(manifest, root)).toThrow('outside');
    expect(fs.readFileSync(path.join(outside, 'report.json'), 'utf8')).toBe(bytes);
  } finally {
    // Remove the link itself before deleting this test's resolved sandbox.
    if (fs.existsSync(link)) fs.unlinkSync(link);
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
});

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
    // Content derives from the authority: exactly 3 ascending stable semver
    // entries whose newest is the active pin (the validator separately enforces
    // that the blocking entry matches the authority version).
    const versions = manifest.versions.map(entry => entry.version);
    expect(versions).toHaveLength(3);
    for (const version of versions) expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    expect([...versions].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))).toEqual(versions);
    expect(versions[2]).toBe(ACTIVE_UPSTREAM_VERSION);
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
      results: manifest.versions.map(entry => {
        const row = passingResult(entry);
        if (entry.version !== '1.5.0') return row;
        const suites = row.suites.map((suite, index) => (
          index === 0
            ? { ...suite, status: 'failed', passed: 0, failed: 1, exitCode: 1, errors: ['red'] }
            : suite
        ));
        return {
          ...row,
          ok: false,
          status: 'failed',
          exitCode: 1,
          passed: suites.reduce((total, suite) => total + suite.passed, 0),
          failed: 1,
          suites,
          errors: ['red'],
        };
      }),
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
    const blocking = baseManifest().versions.find(entry => entry.blocking === true);
    const row = passingResult(blocking);
    const suites = row.suites.map((suite, index) => (
      index === 0
        ? { ...suite, status: 'failed', passed: 0, failed: 1, exitCode: 1, errors: ['red'] }
        : suite
    ));
    const updated = applyMatrixEvidence(baseManifest(), {
      matrixReport: 'new-report.json',
      results: [{
        ...row,
        passed: suites.reduce((total, suite) => total + suite.passed, 0),
        failed: 1,
        suites,
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
    const blocking = baseManifest().versions.find(entry => entry.blocking === true);
    const updated = applyMatrixEvidence(baseManifest(), {
      matrixReport: 'new-report.json',
      results: [passingResult(blocking)],
    }, undefined, { matrixReportSha256: REPORT_SHA256 });
    const current = updated.versions.find(entry => entry.version === ACTIVE_UPSTREAM_VERSION);

    expect(current.vettedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  // Deferred step-1 review finding (d): the exported applyMatrixEvidence used a
  // weaker per-row recheck than the CLI's validator, so a direct library caller
  // could stamp vettedAt onto evidence the CLI would have rejected. Both now
  // enforce the per-row pass criteria; this tests both public entry points.
  test('applyMatrixEvidence never vets a row the validator would reject', () => {
    const blocking = baseManifest().versions.find(entry => entry.blocking === true);
    const weakenings = [
      ['suite reports skipped tests', row => ({
        ...row,
        skipped: 1,
        suites: row.suites.map((suite, i) => (i === 0 ? { ...suite, skipped: 1 } : suite)),
      })],
      ['suite carries errors', row => ({
        ...row,
        suites: row.suites.map((suite, i) => (i === 0 ? { ...suite, errors: ['boom'] } : suite)),
      })],
      ['row totals disagree with its suites', row => ({ ...row, passed: row.passed + 5 })],
      ['row exit code is non-zero', row => ({ ...row, exitCode: 1 })],
      ['row carries errors', row => ({ ...row, errors: ['boom'] })],
      ['suite is not a candidate classification', row => ({
        ...row,
        suites: row.suites.map((suite, i) => (i === 0 ? { ...suite, classification: 'excluded' } : suite)),
      })],
    ];

    for (const [label, weaken] of weakenings) {
      const report = {
        schemaVersion: 2,
        packageName: '@opengsd/gsd-core',
        policy: 'current-pin',
        ok: true,
        blockingFailures: [],
        failedVersions: [],
        matrixReport: 'new-report.json',
        results: [weaken(passingResult(blocking))],
      };

      // The CLI gate rejects it...
      expect(() => validateMatrixEvidenceReport(baseManifest(), report, {
        contract: COMPAT_CONTRACT,
      })).toThrow();

      // ...and the exported helper must not vet it either.
      const updated = applyMatrixEvidence(baseManifest(), report, '2026-07-13', {
        matrixReportSha256: REPORT_SHA256,
      });
      const current = updated.versions.find(entry => entry.version === ACTIVE_UPSTREAM_VERSION);
      expect(`${label}:${current.vettedAt}`).toBe(`${label}:${null}`);
      expect(current.evidence.status).toBe('failed');
    }
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
      policy: 'partial',
    })).toThrow('require-all or current-pin');
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

  test('current-pin evidence validates as a subset that must include a fully passing blocking row', () => {
    const manifest = baseManifest();
    const blockingEntry = manifest.versions.find(entry => entry.blocking === true);
    const report = {
      schemaVersion: 2,
      packageName: '@opengsd/gsd-core',
      policy: 'current-pin',
      ok: true,
      blockingFailures: [],
      failedVersions: [],
      matrixReport: 'bump-report.json',
      results: [passingResult(blockingEntry)],
    };

    expect(() => validateMatrixEvidenceReport(manifest, report)).not.toThrow();

    expect(() => validateMatrixEvidenceReport(manifest, {
      ...report,
      ok: false,
    })).toThrow('require-all or current-pin');
    expect(() => validateMatrixEvidenceReport(manifest, {
      ...report,
      results: [],
    })).toThrow('at least one');
    expect(() => validateMatrixEvidenceReport(manifest, {
      ...report,
      results: [passingResult(manifest.versions[0])],
    })).toThrow('blocking pin row');
    expect(() => validateMatrixEvidenceReport(manifest, {
      ...report,
      results: [passingResult(blockingEntry), passingResult(blockingEntry)],
    })).toThrow('unique');
    expect(() => validateMatrixEvidenceReport(manifest, {
      ...report,
      results: [{
        ...passingResult(blockingEntry),
        suites: passingResult(blockingEntry).suites.map((suite, index) => index === 0
          ? { ...suite, status: 'failed', failed: 1, exitCode: 1 }
          : suite),
      }],
    })).toThrow('fully passing candidate suites');
    // A row for a version the manifest does not know is rejected by the
    // per-row manifest match — the only guard on the subset path, so pin it.
    expect(() => validateMatrixEvidenceReport(manifest, {
      ...report,
      results: [passingResult(blockingEntry), passingResult(candidate('2.0.0'))],
    })).toThrow('manifest role');
    // Stale-report replay across a bump: the demoted pin claims role 'current'
    // in the report while the manifest has since demoted it.
    expect(() => validateMatrixEvidenceReport(manifest, {
      ...report,
      results: [
        passingResult(blockingEntry),
        { ...passingResult(manifest.versions[0]), role: 'current', blocking: true },
      ],
    })).toThrow('manifest role');
  });

  test('CLI applies current-pin evidence to present rows and leaves absent historical evidence untouched', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-vetted-current-pin-'));
    const manifestPath = path.join(dir, 'manifest.json');
    const reportPath = path.join(dir, 'bump-compat.json');
    const manifest = baseManifest();
    const priorEvidence = {
      matrixReport: 'old-report.json',
      matrixReportSha256: 'b'.repeat(64),
      status: 'passed',
    };
    manifest.versions[0].vettedAt = '2026-07-14';
    manifest.versions[0].evidence = { ...priorEvidence };
    const blockingEntry = manifest.versions.find(entry => entry.blocking === true);
    const reportBytes = Buffer.from(`${JSON.stringify({
      schemaVersion: 2,
      packageName: '@opengsd/gsd-core',
      policy: 'current-pin',
      ok: true,
      blockingFailures: [],
      failedVersions: [],
      matrixReport: 'bump-compat.json',
      results: [passingResult(blockingEntry)],
    }, null, 2)}\n`, 'utf8');
    const expectedDigest = crypto.createHash('sha256').update(reportBytes).digest('hex');

    try {
      fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
      fs.writeFileSync(reportPath, reportBytes);
      let stderr = '';

      const exitCode = main([
        '--manifest', manifestPath,
        '--authority', path.join(PROJECT_ROOT, '.planning', 'upstream-authority.json'),
        '--date', '2026-08-30',
        '--apply-matrix-evidence', reportPath,
      ], {
        stdout: { write: () => {} },
        stderr: { write: chunk => { stderr += chunk; } },
      });

      expect(exitCode).toBe(0);
      expect(stderr).toBe('');
      const updated = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const updatedBlocking = updated.versions.find(entry => entry.blocking === true);
      expect(updatedBlocking).toMatchObject({
        vettedAt: '2026-08-30',
        evidence: {
          matrixReport: 'bump-compat.json',
          matrixReportSha256: expectedDigest,
          status: 'passed',
        },
      });
      expect(updated.versions[0]).toMatchObject({
        vettedAt: '2026-07-14',
        evidence: priorEvidence,
      });
      expect(updated.versions[1]).toMatchObject({ vettedAt: null, evidence: {} });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
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
    expect(entries.map(entry => entry.version)).toEqual(['1.5.0', '1.6.0', ACTIVE_UPSTREAM_VERSION]);
    expect(entries[2].blocking).toBe(true);
  });

  test('pruneForBump drops the oldest historical version and keeps exactly 3 versions', () => {
    const pruned = pruneForBump(baseManifest(), '9.9.9');

    expect(pruned.versions).toHaveLength(3);
    expect(pruned.versions.map(entry => entry.version)).toEqual(['1.6.0', ACTIVE_UPSTREAM_VERSION, '9.9.9']);
    expect(pruned.versions.filter(entry => entry.blocking)).toEqual([
      expect.objectContaining({ version: '9.9.9', role: 'current' }),
    ]);
  });

  // Deferred step-1 review finding (c): demoted rows kept reading "passed" with
  // nothing marking that their evidence belongs to a dead override generation.
  // Stamping at demotion time makes the marker self-maintaining.
  test('pruneForBump stamps the outgoing pin as superseded by the new version', () => {
    const pruned = pruneForBump(baseManifest(), '9.9.9');
    const demoted = pruned.versions.find(entry => entry.version === ACTIVE_UPSTREAM_VERSION);
    const untouched = pruned.versions.find(entry => entry.version === '1.6.0');
    const incoming = pruned.versions.find(entry => entry.version === '9.9.9');

    expect(demoted.role).toBe('historical-candidate');
    expect(demoted.evidence.supersededBy).toBe('9.9.9');
    // Already-historical rows keep whatever marker they had; the incoming pin
    // is live evidence and must never carry one.
    expect(untouched.evidence.supersededBy).toBeUndefined();
    expect(incoming.evidence.supersededBy).toBeUndefined();
    expect(() => validateVettedManifest(pruned, {
      ...AUTHORITY,
      active: { ...AUTHORITY.active, version: '9.9.9' },
    })).not.toThrow();
  });

  test('supersededBy is rejected on the blocking row and on self-reference', () => {
    expect(() => validateVettedManifest(baseManifest({
      versions: baseManifest().versions.map(entry => (
        entry.blocking
          ? { ...entry, evidence: { ...entry.evidence, supersededBy: '9.9.9' } }
          : entry
      )),
    }), AUTHORITY)).toThrow('must not carry evidence.supersededBy');

    expect(() => validateVettedManifest(baseManifest({
      versions: baseManifest().versions.map(entry => (
        entry.version === '1.6.0'
          ? { ...entry, evidence: { ...entry.evidence, supersededBy: '1.6.0' } }
          : entry
      )),
    }), AUTHORITY)).toThrow('must differ from the row version');
  });

  test('re-running a superseded row against live overrides clears its marker', () => {
    const manifest = baseManifest({
      versions: baseManifest().versions.map(entry => (
        entry.blocking
          ? entry
          : { ...entry, evidence: { ...entry.evidence, supersededBy: '9.9.9' } }
      )),
    });
    const target = manifest.versions.find(entry => !entry.blocking);

    const updated = applyMatrixEvidence(manifest, {
      matrixReport: 'new-report.json',
      results: [passingResult(target)],
    }, '2026-07-13', { matrixReportSha256: REPORT_SHA256 });
    const refreshed = updated.versions.find(entry => entry.version === target.version);
    const untouched = updated.versions.find(entry => (
      !entry.blocking && entry.version !== target.version
    ));

    expect(refreshed.evidence.supersededBy).toBeUndefined();
    expect(refreshed.vettedAt).toBe('2026-07-13');
    expect(untouched.evidence.supersededBy).toBe('9.9.9');
  });

  test('the live manifest validates against its own JSON schema', () => {
    const schema = JSON.parse(fs.readFileSync(
      path.join(PROJECT_ROOT, '.planning', 'vetted-upstream-versions.schema.json'), 'utf8'
    ));
    const ajv = addFormats(new Ajv2020({ allErrors: true }));
    const validate = ajv.compile(schema);
    const manifest = loadVettedManifest(
      path.join(PROJECT_ROOT, '.planning', 'vetted-upstream-versions.json')
    );

    expect(validate(manifest) ? [] : validate.errors).toEqual([]);
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
