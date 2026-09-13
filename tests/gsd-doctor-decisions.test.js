'use strict';

const { describe, test, expect } = require('./helpers/portable-test-api');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const source = fs.readFileSync(path.join(__dirname, '../scripts/gsd-doctor.cjs'), 'utf8');
const cases = [
  ['link refusal', 'fs.lstatSync(settingsPath).isSymbolicLink()', 'false', 'refuses a symlinked'],
  ['backup exclusion', "mode: origMode, flag: 'wx'", "mode: origMode, flag: 'w'", 'timestamp collision'],
  ['cleanup', 'fs.unlinkSync(tmpPath);', 'void tmpPath;', 'failed atomic rename'],
  ['empty path refusal', "!next || next.startsWith('-')", "next === undefined || next.startsWith('--')", 'rejects unsafe --settings'],
  ['diagnostic agreement', 'changed !== findings.length', 'false', 'diagnosis and mutation disagree'],
  ['dry run', 'if (dryRun)', 'if (false)', 'dry-run reports without writing'],
  ['unrelated commands', 'return r.fixed ? r.after : cmd;', "return r.fixed ? r.after : 'changed';", 'preserves unrelated hook commands'],
  ['repair output', 'after: `node ${m[2]}`', 'after: cmd', 'repairs a canonical broken shape'],
  ['custom settings binding', 'path.resolve(settingsPath)', "path.join(os.homedir(), '.claude', 'settings.json')", 'suggested Bash'],
];

describe('doctor safety decision checks', () => {
  for (const [name, before, after, pattern] of cases) {
    test(`rejects incorrect ${name}`, { timeout: 30000 }, () => {
      expect(source.split(before).length - 1).toBe(1);
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-doctor-decision-'));
      try {
        const subject = path.join(directory, 'doctor.cjs');
        fs.writeFileSync(subject, source.replace(before, after));
        const result = spawnSync('node', ['--test', '--test-name-pattern', pattern, path.join(__dirname, 'gsd-doctor.test.js')], {
          encoding: 'utf8', timeout: 20000,
          env: { ...process.env, GSD_DOCTOR_TEST_SUBJECT: subject },
        });
        expect(result.error).toBeUndefined();
        expect(result.status).toBe(1);
        expect(result.stdout + result.stderr).toMatch(/Expected|expect\(|AssertionError|Internal error: diagnose found 1 but walk repaired 3/);
      } finally {
        const resolved = path.resolve(directory);
        if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('gsd-doctor-decision-')) {
          throw new Error('Refusing cleanup outside the owned decision fixture');
        }
        fs.rmSync(resolved, { recursive: true, force: true });
      }
    });
  }
});
