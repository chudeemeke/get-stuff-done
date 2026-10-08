'use strict';

// Assertion-quality check for the install transaction (Tier S: "does the suite fail when
// this line is wrong"). Copies the two bin/lib modules and the unit suite into a temp
// tree with the same relative layout, applies ONE exact replacement per mutant, and
// requires every mutant to make a case fail that passes on the unmutated copy. The
// working tree is never mutated. A needle that does not occur exactly once is an error,
// so a refactor cannot silently retire a mutant.
// Each seam adds its decision points to MUTANTS in the commit that lands it.
// Run: bun run test:mutants:install-transaction (about one second per mutant).
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const MODULE = 'bin/lib/install-transaction.js';
const SUITE = 'tests/coverage/install-transaction.test.cjs';
const FILES = ['bin/lib/install-names.js', MODULE, SUITE, 'tests/helpers/fault-fs.cjs'];

// [label, needle, replacement]. Needles are matched against the module with LF endings.
const MUTANTS = [
  ['lock: undecided holder treated as dead', "return error.code === 'ESRCH';", 'return true;'],
  ['lock: live holder treated as dead', 'signalProcess(holder, 0);\n      return false;', 'signalProcess(holder, 0);\n      return true;'],
  ['lock: no check that the rename moved the dead lock', 'readLock(claim).text === holder.text;', 'true;'],
  ['lock: rival lock never put back', 'if (!movedTheDeadLock) {', 'if (false) {'],
  ['lock: release deletes any lock', 'if (readLock(lockPath).text === text) removeQuietly(lockPath);', 'removeQuietly(lockPath);'],
  ['lock: release deletes nothing', 'if (readLock(lockPath).text === text) removeQuietly(lockPath);', ''],
  ['lock: pid 0 accepted', 'holder <= 0', 'holder < 0'],
  ['lock: creation time not round-tripped', ' && new Date(value).toISOString() === value;', ';'],
  ['lock: temp file overwrites an existing one', "{ flag: 'wx' }", "{ flag: 'w' }"],
  ['lock: claim file left behind', '    removeQuietly(claim);\n', ''],
  ['lock: temp file left behind', '      removeQuietly(pending);\n', ''],
  ['lock: publish failure after the claim ignored', 'if (!published) throw changedHands(lockPath);', ''],
  ['lock: lost rename not a changed hand', "if (error.code === 'ENOENT') throw changedHands(lockPath);", ''],
  ['lock: vanished lock read as unreadable', "error.code === 'ENOENT' ? 'absent' : 'unreadable'", "'unreadable'"],
  ['lock: existing lock overwritten instead of refused', "if (error.code === 'EEXIST') return false;", ''],
  ['lock: written in place, not linked', 'fs.linkSync(pending, lockPath);\n      return true;', 'fs.copyFileSync(pending, lockPath, 1);\n      return true;'],
  ['lock: takeover not reported', 'tookOver = true;', 'tookOver = false;'],
  ['refusal exit code', 'this.exitCode = 6;', 'this.exitCode = 1;'],
];

function failingCases(root) {
  const run = spawnSync(process.execPath, ['--test', '--test-reporter=tap', path.join(root, SUITE)], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
  const lines = String(run.stdout).split(/\r?\n/);
  if (!lines.some(line => line.startsWith('# tests '))) throw new Error(`the suite did not finish: ${String(run.stderr).slice(0, 300)}`);
  return new Set(lines.filter(line => /^not ok \d+ - /.test(line)).map(line => line.replace(/^not ok \d+ - /, '')));
}

function main(log = message => process.stdout.write(`${message}\n`)) {
  const original = fs.readFileSync(path.join(REPO, MODULE), 'utf8').replace(/\r\n/g, '\n');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-install-transaction-mutants-'));
  try {
    for (const file of FILES) {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      fs.copyFileSync(path.join(REPO, file), path.join(root, file));
    }
    fs.writeFileSync(path.join(root, MODULE), original);
    // Cases that fail unmutated (a seam still "not implemented") cannot kill anything.
    const baseline = failingCases(root);
    let survivors = 0;
    for (const [label, needle, replacement] of MUTANTS) {
      const matches = original.split(needle).length - 1;
      if (matches !== 1) {
        survivors += 1;
        log(`BAD NEEDLE (${matches} matches): ${label}`);
        continue;
      }
      fs.writeFileSync(path.join(root, MODULE), original.replace(needle, replacement));
      const killedBy = [...failingCases(root)].filter(name => !baseline.has(name));
      if (killedBy.length === 0) survivors += 1;
      log(`${killedBy.length === 0 ? 'SURVIVED' : 'killed  '} ${label} (${killedBy.length} cases)`);
    }
    log(`survivors: ${survivors} of ${MUTANTS.length}`);
    return survivors === 0 ? 0 : 1;
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = { MUTANTS, main };
