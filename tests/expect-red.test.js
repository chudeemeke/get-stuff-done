const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const path = require('path');

const {
  INSTALLER_RECOVERY_HARNESS,
  INSTALLER_RECOVERY_SIGNATURE,
  commandFor,
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

describe('expect-red: command line', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

  test('the gate command is read from package.json, not copied', () => {
    expect(commandFor({ script: 'test:acceptance:installer-recovery' }, packageJson)).toEqual([
      'tests/acceptance/installer-recovery.cjs',
    ]);
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
    expect(lines.join('\n')).toContain('Usage: node scripts/expect-red.cjs <installer-recovery>');
  });
});
