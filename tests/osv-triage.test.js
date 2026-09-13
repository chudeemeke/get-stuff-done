'use strict';

const { describe, test, expect, afterEach } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runWithTimeout } = require('./helpers');

const { main, normalizeOsvResults } = require('../scripts/osv-triage');

const PROJECT_ROOT = path.join(__dirname, '..');
const MEDIUM_LOW_FIXTURE = path.join(PROJECT_ROOT, 'tests', 'fixtures', 'osv', 'medium-low.json');
const HIGH_CRITICAL_FIXTURE = path.join(PROJECT_ROOT, 'tests', 'fixtures', 'osv', 'high-critical.json');

const cleanupPaths = [];

afterEach(() => {
  for (const filePath of cleanupPaths.splice(0)) {
    fs.rmSync(filePath, { force: true, recursive: true });
  }
});

function readFixture(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function tempOutputPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-osv-triage-'));
  const filePath = path.join(dir, 'triage.json');
  cleanupPaths.push(filePath, dir);
  return filePath;
}

describe('OSV triage normalization', () => {
  test('deduplicates medium and low findings by vulnerability id plus package name', () => {
    const findings = normalizeOsvResults(readFixture(MEDIUM_LOW_FIXTURE));

    expect(findings.map(finding => `${finding.id}:${finding.packageName}`)).toEqual([
      'GHSA-medium-0001:medium-lib',
      'GHSA-low-0001:low-lib',
    ]);
  });

  test('emits deterministic issue titles, bodies, labels, and normalized severities', () => {
    const findings = normalizeOsvResults(readFixture(MEDIUM_LOW_FIXTURE));

    expect(findings).toEqual([
      {
        id: 'GHSA-medium-0001',
        packageName: 'medium-lib',
        packageVersion: '3.1.4',
        ecosystem: 'npm',
        sourcePath: 'bun.lock',
        severity: 'medium',
        title: 'OSV medium: GHSA-medium-0001 in medium-lib',
        labels: ['security', 'security-moderate', 'osv', 'dependency'],
        body: [
          '## OSV Finding',
          '',
          '- ID: GHSA-medium-0001',
          '- Severity: medium',
          '- Package: medium-lib@3.1.4',
          '- Ecosystem: npm',
          '- Source: bun.lock',
          '',
          'Medium fixture vulnerability',
          '',
          'Aliases: CVE-2026-0003',
          '',
          'Review through SECURITY.md triage policy and .planning/audits/suppressions.json if suppression is justified.'
        ].join('\n'),
      },
      {
        id: 'GHSA-low-0001',
        packageName: 'low-lib',
        packageVersion: '0.9.0',
        ecosystem: 'npm',
        sourcePath: 'bun.lock',
        severity: 'low',
        title: 'OSV low: GHSA-low-0001 in low-lib',
        labels: ['security', 'security-low', 'osv', 'dependency'],
        body: [
          '## OSV Finding',
          '',
          '- ID: GHSA-low-0001',
          '- Severity: low',
          '- Package: low-lib@0.9.0',
          '- Ecosystem: npm',
          '- Source: bun.lock',
          '',
          'Low fixture vulnerability',
          '',
          'Aliases: CVE-2026-0004',
          '',
          'Review through SECURITY.md triage policy and .planning/audits/suppressions.json if suppression is justified.'
        ].join('\n'),
      },
    ]);
  });

  test('classifies high and critical vulnerabilities as blocking severities', () => {
    const findings = normalizeOsvResults(readFixture(HIGH_CRITICAL_FIXTURE));

    expect(findings.map(finding => finding.severity)).toEqual(['critical', 'high']);
    expect(findings.map(finding => finding.labels)).toContainEqual([
      'security',
      'security-critical',
      'osv',
      'dependency',
    ]);
    expect(findings.map(finding => finding.labels)).toContainEqual([
      'security',
      'security-high',
      'osv',
      'dependency',
    ]);
  });
});

describe('OSV triage CLI', () => {
  test('writes deterministic JSON output for medium and low findings', () => {
    const outputPath = tempOutputPath();
    const exitCode = main([
      '--input',
      MEDIUM_LOW_FIXTURE,
      '--output',
      outputPath,
      '--fail-on',
      'high,critical',
    ]);

    expect(exitCode).toBe(0);
    expect(JSON.parse(fs.readFileSync(outputPath, 'utf-8'))).toEqual(
      normalizeOsvResults(readFixture(MEDIUM_LOW_FIXTURE))
    );
  });

  test('exits non-zero when --fail-on matches high or critical findings', () => {
    const outputPath = tempOutputPath();
    const result = runWithTimeout(
      process.execPath,
      [
        'scripts/osv-triage.js',
        '--input',
        HIGH_CRITICAL_FIXTURE,
        '--output',
        outputPath,
        '--fail-on',
        'high,critical',
      ],
      {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
      }
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Blocking OSV findings: GHSA-critical-0001, GHSA-high-0001');
    expect(JSON.parse(fs.readFileSync(outputPath, 'utf-8')).map(finding => finding.severity)).toEqual([
      'critical',
      'high',
    ]);
  });
});
