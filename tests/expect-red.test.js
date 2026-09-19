const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const path = require('path');

const {
  INSTALLER_RECOVERY_HARNESS,
  INSTALLER_RECOVERY_SIGNATURE,
  commandFor,
  judgeInstallTransactionCoverage,
  judgeInstallerRecovery,
  main,
} = require('../scripts/expect-red.cjs');

// A real report captured from tests/acceptance/installer-recovery.cjs on the unfixed
// installer (win32, 2026-09-19), not a hand-written one: a hand-written fixture would
// encode the judge's own assumptions about the report shape.
const KNOWN_RED = fs.readFileSync(
  path.join(__dirname, 'fixtures', 'expect-red', 'installer-recovery-known-red.json'),
  'utf8'
);

function runOf(report, status = 1) {
  return { status, stdout: typeof report === 'string' ? report : JSON.stringify(report), stderr: '' };
}

function mutated(change) {
  const report = JSON.parse(KNOWN_RED);
  change(report);
  return report;
}

function setCheck(report, key, ok) {
  const check = report.checks.find(candidate => `${candidate.scenario}:${candidate.id}` === key);
  check.ok = ok;
  check.detail = ok ? undefined : 'forced by the test';
}

describe('expect-red: installer recovery', () => {
  test('the captured red from the unfixed installer is the known red', () => {
    expect(judgeInstallerRecovery(runOf(KNOWN_RED))).toEqual([]);
  });

  test('an unexpected pass fails and says how to retire the wrapper', () => {
    const green = mutated(report => {
      report.accepted = true;
      for (const check of report.checks) check.ok = true;
    });
    const problems = judgeInstallerRecovery(runOf(green, 0));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('UNEXPECTED PASS');
  });

  test.each(INSTALLER_RECOVERY_HARNESS)('a red with harness check %s failing is the wrong red', key => {
    const problems = judgeInstallerRecovery(runOf(mutated(report => setCheck(report, key, false))));
    expect(problems.some(problem => problem.includes(key))).toBe(true);
  });

  test.each(INSTALLER_RECOVERY_HARNESS)('a red that never ran harness check %s is the wrong red', key => {
    const partial = mutated(report => {
      report.checks = report.checks.filter(check => `${check.scenario}:${check.id}` !== key);
    });
    expect(judgeInstallerRecovery(runOf(partial))).toContain(`harness check did not pass: ${key}`);
  });

  test.each(INSTALLER_RECOVERY_SIGNATURE)('a red in which %s passes is not the known red', key => {
    const problems = judgeInstallerRecovery(runOf(mutated(report => setCheck(report, key, true))));
    expect(problems).toEqual([`known failure absent: ${key}`]);
  });

  test('a missing compose is the wrong red', () => {
    const report = { accepted: false, checks: [], harnessError: 'compose the candidate before running acceptance' };
    const problems = judgeInstallerRecovery(runOf(report));
    expect(problems).toContain('harness error: compose the candidate before running acceptance');
  });

  test('a crash with no report and an unexpected exit status are both refused', () => {
    expect(judgeInstallerRecovery({ status: 1, stdout: '', stderr: 'SyntaxError: boom' })[0]).toContain('SyntaxError: boom');
    expect(judgeInstallerRecovery(runOf(KNOWN_RED, 3))).toContain('exit status 3, expected 1');
  });
});

describe('expect-red: install transaction coverage', () => {
  // Real TAP captured from the gate against the skeleton module (win32, 2026-09-19).
  const KNOWN_TAP = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'expect-red', 'install-transaction-known-red.tap.txt'),
    'utf8'
  );
  const tapRun = (stdout, status = 1, stderr = '') => ({ status, stdout, stderr });
  const FIRST_REASON = "error: 'not implemented: acquireLock'";

  test('the captured red from the skeleton is the known red', () => {
    expect(KNOWN_TAP.split(FIRST_REASON).length).toBeGreaterThan(2);
    expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP))).toEqual([]);
  });

  test('a case failing for any reason other than an unbuilt operation is the wrong red', () => {
    const wrong = KNOWN_TAP.replace(FIRST_REASON, "error: 'Expected values to be strictly equal'");
    const problems = judgeInstallTransactionCoverage(tapRun(wrong));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toStartWith('failed for another reason: lock:');
  });

  test('a coverage shortfall on landed code is the wrong red, on either stream', () => {
    const shortfall = 'ERROR: Coverage for branches (88.88%) does not meet threshold (100%) for bin/lib/install-names.js';
    expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP, 1, `${shortfall}\n`))).toEqual([shortfall]);
    expect(judgeInstallTransactionCoverage(tapRun(`${KNOWN_TAP}\n${shortfall}\n`))).toEqual([shortfall]);
  });

  test('nothing failing, a crash with no summary, and a miscounted summary are all refused', () => {
    const green = KNOWN_TAP.split('\n').filter(line => !line.startsWith('# fail ')).join('\n');
    expect(judgeInstallTransactionCoverage(tapRun(`${green}\n# fail 0\n`, 0))[0]).toContain('UNEXPECTED PASS');
    expect(judgeInstallTransactionCoverage(tapRun('', 1, 'Error: Cannot find module'))[0]).toContain('Cannot find module');
    expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP.replace('# fail 22', '# fail 23')))).toEqual([
      'summary reports 23 failures, 22 found',
    ]);
    expect(judgeInstallTransactionCoverage(tapRun(KNOWN_TAP, 7))).toEqual(['exit status 7, expected 1']);
  });
});

describe('expect-red: command line', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

  test('the gate command is read from package.json, not copied', () => {
    expect(commandFor({ script: 'test:acceptance:installer-recovery' }, packageJson)).toEqual([
      'tests/acceptance/installer-recovery.cjs',
    ]);
    const coverage = commandFor({ script: 'test:coverage:install-transaction' }, packageJson);
    expect(coverage).toContain('--include=bin/lib/install-transaction.js');
    expect(coverage.some(argument => argument.includes("'"))).toBe(false);
    expect(() => commandFor({ script: 'test' }, { scripts: { test: 'bun test' } })).toThrow('plain "node <file>"');
    expect(() => commandFor({ script: 'absent' }, packageJson)).toThrow('absent');
  });

  test('exits 0 on the known red, 1 on anything else, 2 on misuse', () => {
    const lines = [];
    const dependencies = result => ({ packageJson, log: line => lines.push(line), spawnSync: () => result });
    expect(main(['installer-recovery'], dependencies(runOf(KNOWN_RED)))).toBe(0);
    expect(main(['installer-recovery'], dependencies(runOf(KNOWN_RED, 0)))).toBe(1);
    expect(main(['installer-recovery'], dependencies({ error: new Error('spawn ENOENT') }))).toBe(1);
    expect(main([], dependencies(runOf(KNOWN_RED)))).toBe(2);
    expect(main(['constructor'], dependencies(runOf(KNOWN_RED)))).toBe(2);
    expect(lines.join('\n')).toContain('Usage: node scripts/expect-red.cjs <installer-recovery|install-transaction-coverage>');
  });
});
