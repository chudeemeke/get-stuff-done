'use strict';

// Run explicitly: node tests/acceptance/installer-recovery.cjs
// Exercises the composed installer in a small disposable project-local home.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const project = path.resolve(__dirname, '../..');
const scratchParent = path.join(project, '.claude');
fs.mkdirSync(scratchParent, { recursive: true });
const scratch = fs.mkdtempSync(path.join(scratchParent, 'installer-recovery-'));
const home = path.join(scratch, 'isolated home');
const target = path.join(home, 'runtime with spaces');
const upstream = path.join(project, 'dist/bin/install.js');
const report = { platform: process.platform, node: process.version, accepted: false };

function inventory(root) {
  const files = [];
  const pending = [root];
  while (pending.length) {
    const dir = pending.pop();
    for (const name of fs.readdirSync(dir)) {
      const entry = path.join(dir, name);
      const stat = fs.lstatSync(entry);
      assert.equal(stat.isSymbolicLink(), false, 'fixture must not redirect traversal');
      if (stat.isDirectory()) pending.push(entry);
      else files.push(path.relative(root, entry).replaceAll('\\', '/'));
    }
  }
  return files.sort();
}

try {
  assert.ok(fs.existsSync(upstream), 'compose the candidate before running acceptance');
  report.sourceHashes = Object.fromEntries(['bin/install.js', 'dist/bin/install.js'].map(name => [
    name, crypto.createHash('sha256').update(fs.readFileSync(path.join(project, name))).digest('hex'),
  ]));
  fs.mkdirSync(target, { recursive: true });
  const settings = '{"owner":{"keep":true},"statusLine":{"type":"command","command":"echo owner"}}\n';
  fs.writeFileSync(path.join(target, 'settings.json'), settings);
  fs.writeFileSync(path.join(target, 'owner.txt'), 'owner bytes\n');
  const preload = path.join(scratch, 'inject write failure.cjs');
  // Inject only at the first manifest publication in the real upstream child,
  // after materialization has started. The wrapper's recovery is not mocked.
  fs.writeFileSync(preload, `
    const fs = require('node:fs');
    const path = require('node:path');
    if (path.resolve(process.argv[1]) === ${JSON.stringify(upstream)}) {
      const write = fs.writeFileSync;
      fs.writeFileSync = function(destination, ...args) {
        if (typeof destination === 'string' && path.resolve(destination) === ${JSON.stringify(path.join(target, 'gsd-file-manifest.json'))}) {
          throw new Error('INJECTED_MANIFEST_PUBLICATION_FAILURE');
        }
        return write.call(this, destination, ...args);
      };
    }
  `);
  const env = {
    ...process.env, HOME: home, USERPROFILE: home,
    GSD_HOME: path.join(home, '.gsd'), CLAUDE_CONFIG_DIR: target,
    CODEX_HOME: path.join(home, '.codex'), XDG_CONFIG_HOME: path.join(home, '.config'),
    NODE_OPTIONS: `--require ${JSON.stringify(preload)}`,
    TEMP: scratch, TMP: scratch,
  };
  for (const key of ['GSD_TEST_MODE', 'GSD_PROJECT_DIR', 'GSD_WORKSTREAM']) delete env[key];
  const result = spawnSync(process.execPath, [path.join(project, 'bin/install.js'),
    '--claude', '--global', '--config-dir', target], {
    cwd: scratch, env, encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024,
  });
  report.status = result.status;
  report.error = result.error?.message;
  report.injectedFailureReached = result.stderr.includes('INJECTED_MANIFEST_PUBLICATION_FAILURE');
  report.claimedRollbackApplied = result.stderr.includes('Rollback applied');
  report.settingsPreserved = fs.readFileSync(path.join(target, 'settings.json'), 'utf8') === settings;
  report.ownerPreserved = fs.readFileSync(path.join(target, 'owner.txt'), 'utf8') === 'owner bytes\n';
  const remaining = inventory(target).filter(name => !['owner.txt', 'settings.json'].includes(name));
  report.residualFileCount = remaining.length;
  report.residualExamples = remaining.slice(0, 12);
  assert.equal(result.error, undefined);
  assert.equal(report.injectedFailureReached, true, 'failure must occur at the intended real write');
  assert.notEqual(result.status, 0);
  assert.equal(report.settingsPreserved, true);
  assert.equal(report.ownerPreserved, true);
  assert.equal(remaining.length, 0, 'failed installation must not leave unowned candidate files');
  report.accepted = true;
} catch (error) {
  report.failure = error.message;
  process.exitCode = 1;
} finally {
  // Only delete this invocation's generated fixture inside this checkout.
  assert.equal(path.dirname(path.resolve(scratch)), path.resolve(scratchParent));
  assert.ok(path.basename(scratch).startsWith('installer-recovery-'));
  fs.rmSync(scratch, { recursive: true, force: true });
  report.fixtureRemoved = !fs.existsSync(scratch);
  process.stdout.write(JSON.stringify(report, null, 2) + os.EOL);
}
