'use strict';

const { describe, test, expect } = require('./helpers/portable-test-api');
const fs = require('fs');
const path = require('path');

const {
  evaluateAuditFindings,
  parseBunAuditJson,
  parseArgs,
  runBunAudit,
  main,
  validateSuppressions,
} = require('../scripts/audit-check');

const TODAY = '2026-06-23';

function bunAuditFinding(overrides = {}) {
  return {
    id: 1121296,
    url: 'https://github.com/advisories/GHSA-v75r-vx73-82pj',
    title: 'CycloneDX workspace shell injection',
    severity: 'high',
    vulnerable_versions: '>=2.1.0 <5.0.0',
    cwe: ['CWE-78'],
    cvss: { score: 0, vectorString: null },
    ...overrides,
  };
}

function validSuppression(overrides = {}) {
  return {
    id: 'GHSA-2345-6789-cfgh',
    severity: 'high',
    reason: 'Test-only vulnerable fixture is not reachable.',
    reviewer: 'Chude',
    reviewedDate: '2026-06-01',
    reReviewDate: '2026-07-31',
    ...overrides,
  };
}

function runWithAuditResult(auditResult, overrides = {}) {
  return () =>
    runBunAudit({
      expectedVersion: '1.3.5',
      projectRoot: 'C:\\repo',
      spawnSync: (_command, args) =>
        args[0] === '--version'
          ? { status: 0, stdout: '1.3.5\n', stderr: '' }
          : auditResult,
      ...overrides,
    });
}

describe('Bun audit report authority', () => {
  test('keeps bun.lock as the sole graph and removes audit-ci delegation', () => {
    const packageJson = require('../package.json');

    expect(packageJson.devDependencies['audit-ci']).toBeUndefined();
    expect(fs.existsSync(path.join(__dirname, '..', 'bun.lock'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '..', 'package-lock.json'))).toBe(false);
  });

  test('parses the observed Bun 1.3.5 JSON schema into canonical findings', () => {
    const report = parseBunAuditJson(
      JSON.stringify({
        '@cyclonedx/cyclonedx-npm': [bunAuditFinding()],
      })
    );

    expect(report).toEqual([
      {
        package: '@cyclonedx/cyclonedx-npm',
        ghsaId: 'GHSA-v75r-vx73-82pj',
        ...bunAuditFinding(),
      },
    ]);
  });

  test('rejects advisory URLs that do not contain one canonical GHSA identifier', () => {
    const parse = () =>
      parseBunAuditJson(
        JSON.stringify({
          dependency: [
            bunAuditFinding({
              url: 'https://github.com/advisories/GHSA-0000-0000-0000',
            }),
          ],
        })
      );

    expect(parse).toThrow('Bun audit finding schema is invalid');
  });

  test('rejects malformed and unbounded report envelopes and package entries', () => {
    expect(() => parseBunAuditJson('')).toThrow('empty or exceeds');
    expect(() => parseBunAuditJson('x'.repeat(1024 * 1024 + 1))).toThrow(
      'empty or exceeds'
    );
    expect(() => parseBunAuditJson('null')).toThrow('report schema is invalid');
    expect(() => parseBunAuditJson('[]')).toThrow('report schema is invalid');
    expect(() =>
      parseBunAuditJson(
        JSON.stringify(
          Object.fromEntries(
            Array.from({ length: 1001 }, (_, index) => [
              `package-${index}`,
              [bunAuditFinding()],
            ])
          )
        )
      )
    ).toThrow('package limit');

    const invalidEntries = [
      { '': [bunAuditFinding()] },
      { 'bad package': [bunAuditFinding()] },
      { dependency: {} },
      { dependency: [] },
      { dependency: Array.from({ length: 101 }, () => bunAuditFinding()) },
    ];
    for (const report of invalidEntries) {
      expect(() => parseBunAuditJson(JSON.stringify(report))).toThrow(
        'package entry is invalid'
      );
    }
  });

  test('rejects finding-field schema drift at every bounded boundary', () => {
    const invalidFindings = [
      bunAuditFinding({ unexpected: true }),
      bunAuditFinding({ id: 0 }),
      bunAuditFinding({ id: 1.5 }),
      bunAuditFinding({ title: '' }),
      bunAuditFinding({ title: 'x'.repeat(501) }),
      bunAuditFinding({ severity: 'unknown' }),
      bunAuditFinding({ vulnerable_versions: '' }),
      bunAuditFinding({ cwe: null }),
      bunAuditFinding({ cwe: Array.from({ length: 21 }, () => 'CWE-78') }),
      bunAuditFinding({ cwe: ['invalid'] }),
      bunAuditFinding({ cvss: null }),
      bunAuditFinding({ cvss: { score: null, vectorString: null } }),
      bunAuditFinding({ cvss: { score: -1, vectorString: null } }),
      bunAuditFinding({ cvss: { score: 11, vectorString: null } }),
      bunAuditFinding({ cvss: { score: 5, vectorString: '' } }),
    ];

    for (const finding of invalidFindings) {
      expect(() =>
        parseBunAuditJson(JSON.stringify({ dependency: [finding] }))
      ).toThrow('finding schema is invalid');
    }

    expect(
      parseBunAuditJson(
        JSON.stringify({
          dependency: [
            bunAuditFinding({
              cvss: { score: 7.5, vectorString: 'CVSS:3.1/AV:N/AC:L' },
            }),
          ],
        })
      )
    ).toHaveLength(1);
  });

  test('blocks high and critical findings while retaining moderate visibility', () => {
    const findings = parseBunAuditJson(
      JSON.stringify({
        highDependency: [bunAuditFinding()],
        moderateDependency: [
          bunAuditFinding({
            id: 2,
            url: 'https://github.com/advisories/GHSA-2345-6789-cfgh',
            severity: 'moderate',
          }),
        ],
      })
    );

    const verdict = evaluateAuditFindings(findings, []);

    expect(verdict.ok).toBe(false);
    expect(verdict.blocking.map(finding => finding.ghsaId)).toEqual([
      'GHSA-v75r-vx73-82pj',
    ]);
    expect(verdict.findings).toHaveLength(2);
    expect(verdict.suppressed).toEqual([]);
  });

  test('keeps a reviewed matching suppression visible while removing its blocker', () => {
    const findings = parseBunAuditJson(
      JSON.stringify({ dependency: [bunAuditFinding()] })
    );
    const suppression = validSuppression({
      id: 'GHSA-v75r-vx73-82pj',
      severity: 'high',
    });
    const validated = validateSuppressions([suppression], { today: TODAY });

    const verdict = evaluateAuditFindings(findings, validated.suppressions);

    expect(validated.ok).toBe(true);
    expect(verdict.ok).toBe(true);
    expect(verdict.blocking).toEqual([]);
    expect(verdict.suppressed).toEqual([
      expect.objectContaining({
        ghsaId: 'GHSA-v75r-vx73-82pj',
        suppression: expect.objectContaining({ reviewer: 'Chude' }),
      }),
    ]);
  });

  test('attests Bun 1.3.5 and accepts findings exit one only with valid JSON', () => {
    const calls = [];
    const spawn = (command, args, options) => {
      calls.push({ command, args, options });
      if (args[0] === '--version') {
        return { status: 0, stdout: '1.3.5\n', stderr: '' };
      }
      return {
        status: 1,
        stdout: JSON.stringify({ dependency: [bunAuditFinding()] }),
        stderr: 'bun audit v1.3.5',
      };
    };

    const findings = runBunAudit({
      expectedVersion: '1.3.5',
      projectRoot: 'C:\\repo',
      spawnSync: spawn,
    });

    expect(findings).toHaveLength(1);
    expect(calls.map(call => [call.command, call.args])).toEqual([
      ['bun', ['--version']],
      ['bun', ['audit', '--json']],
    ]);
    expect(calls.every(call => call.options.shell === false)).toBe(true);
  });

  test('fails closed on runtime, tool, JSON, schema, and status disagreement', () => {
    expect(
      runWithAuditResult(
        { status: 0, stdout: '{}', stderr: '' },
        {
          spawnSync: (_command, args) =>
            args[0] === '--version'
              ? { status: 0, stdout: '1.3.4\n', stderr: '' }
              : { status: 0, stdout: '{}', stderr: '' },
        }
      )
    ).toThrow('does not match');
    expect(
      runWithAuditResult({ status: null, stdout: '', stderr: 'network unavailable' })
    ).toThrow('failed before producing');
    expect(
      runWithAuditResult({
        status: null,
        error: new Error('network unavailable'),
        stdout: '',
        stderr: '',
      })
    ).toThrow('failed before producing');
    expect(runWithAuditResult({ status: 1, stdout: '{', stderr: '' })).toThrow(
      'not valid JSON'
    );
    expect(
      runWithAuditResult({
        status: 1,
        stdout: JSON.stringify({ dependency: [bunAuditFinding({ url: undefined })] }),
        stderr: '',
      })
    ).toThrow('schema is invalid');
    expect(runWithAuditResult({ status: 1, stdout: '{}', stderr: '' })).toThrow(
      'status and report findings disagree'
    );
    expect(
      runWithAuditResult({
        status: 0,
        stdout: JSON.stringify({ dependency: [bunAuditFinding()] }),
        stderr: '',
      })
    ).toThrow('status and report findings disagree');
    expect(runWithAuditResult({ status: 0, stdout: '{}', stderr: '' })()).toEqual([]);
    expect(() =>
      runBunAudit({
        expectedVersion: '',
        spawnSync: () => ({ status: 0, stdout: '1.3.5' }),
      })
    ).toThrow('version authority is missing');
    expect(() =>
      runBunAudit({
        expectedVersion: '1.3.5',
        spawnSync: () => ({ status: 2, stdout: '', stderr: '' }),
      })
    ).toThrow('version attestation failed');
    expect(() =>
      runBunAudit({
        expectedVersion: '1.3.5',
        spawnSync: () => ({ error: new Error('missing bun'), status: null }),
      })
    ).toThrow('version attestation failed');
  });

  test('keeps a severity-mismatched suppression from hiding a blocker', () => {
    const findings = parseBunAuditJson(
      JSON.stringify({ dependency: [bunAuditFinding()] })
    );
    const verdict = evaluateAuditFindings(findings, [
      validSuppression({ id: 'GHSA-v75r-vx73-82pj', severity: 'critical' }),
    ]);

    expect(verdict.ok).toBe(false);
    expect(verdict.blocking).toHaveLength(1);
    expect(verdict.suppressed).toEqual([]);
  });

  test('CLI composition reports moderate findings without invoking audit-ci', () => {
    const stdout = [];
    const stderr = [];
    const moderate = parseBunAuditJson(
      JSON.stringify({
        dependency: [
          bunAuditFinding({
            id: 2,
            url: 'https://github.com/advisories/GHSA-2345-6789-cfgh',
            severity: 'moderate',
          }),
        ],
      })
    );

    const status = main([], {
      readJson: () => [],
      readBunVersion: () => '1.3.5',
      runBunAudit: () => moderate,
      writeOutput: value => stdout.push(value),
      writeError: value => stderr.push(value),
    });

    expect(status).toBe(0);
    expect(stdout.join('')).toContain('1 finding(s), 0 blocking, 0 suppressed');
    expect(stderr).toEqual([]);
  });

  test('CLI composition exposes blockers, suppressions, validation, and failures', () => {
    const stdout = [];
    const stderr = [];
    const suppression = validSuppression({
      id: 'GHSA-v75r-vx73-82pj',
      severity: 'high',
    });
    const findings = parseBunAuditJson(
      JSON.stringify({
        highDependency: [bunAuditFinding()],
        criticalDependency: [
          bunAuditFinding({
            id: 2,
            url: 'https://github.com/advisories/GHSA-2345-6789-cfgh',
            severity: 'critical',
          }),
        ],
      })
    );
    const ports = {
      readJson: () => [suppression],
      readBunVersion: () => '1.3.5',
      runBunAudit: () => findings,
      validationOptions: { today: TODAY },
      writeOutput: value => stdout.push(value),
      writeError: value => stderr.push(value),
    };

    expect(main([], ports)).toBe(1);
    expect(stdout.join('')).toContain('SUPPRESSED high GHSA-v75r-vx73-82pj');
    expect(stderr.join('')).toContain('BLOCKING critical GHSA-2345-6789-cfgh');

    let invoked = false;
    expect(
      main(['--validate-only'], {
        ...ports,
        readJson: () => [],
        runBunAudit: () => {
          invoked = true;
          return [];
        },
      })
    ).toBe(0);
    expect(invoked).toBe(false);

    expect(
      main([], {
        ...ports,
        readJson: () => {
          throw new Error('suppression read failed');
        },
      })
    ).toBe(1);
    expect(stderr.join('')).toContain('suppression read failed');
  });

  test('CLI argument parsing resolves custom policy paths and ignores unknown flags', () => {
    const options = parseArgs([
      '--unknown',
      '--suppressions-file',
      './custom-suppressions.json',
      '--validate-only',
    ]);

    expect(options.suppressionsFile).toBe(path.resolve('./custom-suppressions.json'));
    expect(options.validateOnly).toBe(true);
  });

  test('CLI composition reads the repository-pinned Bun version by default', () => {
    let observedVersion;
    const status = main([], {
      readJson: () => [],
      runBunAudit: options => {
        observedVersion = options.expectedVersion;
        return [];
      },
      writeOutput: () => {},
      writeError: () => {},
    });

    expect(status).toBe(0);
    expect(observedVersion).toBe('1.3.5');
  });
});

describe('audit suppression validation', () => {
  test('valid empty suppressions array passes', () => {
    const result = validateSuppressions([], { today: TODAY });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('rejects a suppression id outside the canonical GHSA namespace', () => {
    const result = validateSuppressions(
      [validSuppression({ id: 'GHSA-0000-0000-0000' })],
      { today: TODAY }
    );

    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toContain('pattern');
  });

  test('missing required field fails and names the field', () => {
    const entry = validSuppression();
    delete entry.reason;

    const result = validateSuppressions([entry], { today: TODAY });

    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toContain('reason');
  });

  test('additional property fails', () => {
    const result = validateSuppressions(
      [validSuppression({ ticket: 'SEC-1' })],
      { today: TODAY }
    );

    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toContain('additional');
  });

  test('expired entry fails with exact actionable message', () => {
    const result = validateSuppressions(
      [validSuppression({ id: 'GHSA-2345-6789-cfgh', reReviewDate: '2026-06-01' })],
      { today: TODAY }
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      'Suppression for GHSA-2345-6789-cfgh expired 2026-06-01; re-review and update or remove the entry in .planning/audits/suppressions.json'
    );
  });

  test('reReviewDate more than 60 calendar days after reviewedDate fails', () => {
    const result = validateSuppressions(
      [validSuppression({ reviewedDate: '2026-06-01', reReviewDate: '2026-08-01' })],
      { today: TODAY }
    );

    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toContain('reviewedDate');
    expect(result.errors.join('\n')).toContain('reReviewDate');
    expect(result.errors.join('\n')).toContain('60 calendar days');
  });

  test('non-expired entry normalizes medium severity to moderate', () => {
    const suppressions = [
      validSuppression({ id: 'GHSA-2345-6789-cfgh', severity: 'medium' }),
    ];

    const result = validateSuppressions(suppressions, { today: TODAY });
    expect(result.ok).toBe(true);
    expect(result.suppressions[0].severity).toBe('moderate');
  });

  test('duplicate advisory suppressions fail as ambiguous policy', () => {
    const result = validateSuppressions(
      [validSuppression(), validSuppression()],
      { today: TODAY }
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      'Duplicate suppression for GHSA-2345-6789-cfgh is not allowed'
    );
  });

  test('invalid date shapes and calendar values fail closed', () => {
    const malformed = validateSuppressions(
      [validSuppression({ reviewedDate: 'June 1' })],
      { today: TODAY }
    );
    const impossible = validateSuppressions(
      [validSuppression({ reviewedDate: '2026-02-30' })],
      { today: TODAY }
    );

    expect(malformed.errors.join('\n')).toContain('expected YYYY-MM-DD');
    expect(impossible.errors.join('\n')).toContain('real calendar date');
  });

  test('non-array and partially shaped policies preserve validator diagnostics', () => {
    const rootErrorValidator = () => false;
    rootErrorValidator.errors = [
      { keyword: 'type', instancePath: '', message: 'must be array' },
    ];
    const invalidRoot = validateSuppressions(null, {
      today: TODAY,
      validate: rootErrorValidator,
    });
    expect(invalidRoot.ok).toBe(false);
    expect(invalidRoot.suppressions).toEqual([]);
    expect(invalidRoot.errors).toContain('(root) must be array');

    const noDetailsValidator = () => false;
    const noDetails = validateSuppressions([], {
      today: TODAY,
      validate: noDetailsValidator,
    });
    expect(noDetails.ok).toBe(true);

    const missingDates = validateSuppressions(
      [{ id: 'GHSA-2345-6789-cfgh', severity: 'high' }],
      { today: TODAY }
    );
    expect(missingDates.ok).toBe(false);

    const malformedEntry = validateSuppressions([null], { today: TODAY });
    expect(malformedEntry.ok).toBe(false);
    expect(malformedEntry.suppressions).toEqual([null]);
  });

  test('finding evaluation rejects non-array inputs', () => {
    expect(() => evaluateAuditFindings(null, [])).toThrow('must be arrays');
    expect(() => evaluateAuditFindings([], null)).toThrow('must be arrays');
  });
});
