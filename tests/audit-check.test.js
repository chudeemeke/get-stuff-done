'use strict';

const { describe, test, expect } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  buildAuditCiCommand,
  buildAuditCiAllowlist,
  findAuditCiBin,
  validateSuppressions,
} = require('../scripts/audit-check');

const TODAY = '2026-06-23';

function validSuppression(overrides = {}) {
  return {
    id: 'GHSA-test-0001',
    severity: 'high',
    reason: 'Test-only vulnerable fixture is not reachable.',
    reviewer: 'Chude',
    reviewedDate: '2026-06-01',
    reReviewDate: '2026-07-31',
    ...overrides,
  };
}

describe('audit suppression validation', () => {
  test('valid empty suppressions array passes', () => {
    const result = validateSuppressions([], { today: TODAY });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
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
      [validSuppression({ id: 'GHSA-expired-0001', reReviewDate: '2026-06-01' })],
      { today: TODAY }
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      'Suppression for GHSA-expired-0001 expired 2026-06-01; re-review and update or remove the entry in .planning/audits/suppressions.json'
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

  test('non-expired entry is transformed into an audit-ci allowlist id', () => {
    const suppressions = [
      validSuppression({ id: 'GHSA-allow-0001', severity: 'medium' }),
    ];

    const result = validateSuppressions(suppressions, { today: TODAY });
    const allowlist = buildAuditCiAllowlist(result.suppressions);

    expect(result.ok).toBe(true);
    expect(result.suppressions[0].severity).toBe('moderate');
    expect(allowlist).toEqual(['GHSA-allow-0001']);
  });
});

describe('audit-ci binary discovery', () => {
  test('finds Bun Windows audit-ci executable shim', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-audit-bin-'));
    const binDir = path.join(projectRoot, 'node_modules', '.bin');
    const auditCiExe = path.join(binDir, 'audit-ci.exe');

    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(auditCiExe, '', 'utf-8');

    try {
      expect(findAuditCiBin(projectRoot)).toBe(auditCiExe);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test.skipIf(process.platform !== 'win32')('prefers executable shims over shell shims when both exist', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-audit-bin-'));
    const binDir = path.join(projectRoot, 'node_modules', '.bin');
    const auditCiCmd = path.join(binDir, 'audit-ci.cmd');
    const auditCiExe = path.join(binDir, 'audit-ci.exe');

    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(auditCiCmd, '', 'utf-8');
    fs.writeFileSync(auditCiExe, '', 'utf-8');

    try {
      expect(findAuditCiBin(projectRoot)).toBe(auditCiExe);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('builds no-shell spawn command for executable path with spaces', () => {
    const auditCiBin = path.join(os.tmpdir(), 'dir with spaces', 'audit-ci.exe');
    const configPath = path.join(os.tmpdir(), 'dir with spaces', 'audit-ci.json');

    expect(buildAuditCiCommand(auditCiBin, configPath)).toEqual({
      command: auditCiBin,
      args: ['--config', configPath],
    });
  });
});
