'use strict';
// One-off measurement: does the composed upstream installer spawn processes
// during a real fresh install? Isolated home; never the real ~/.claude.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const project = path.resolve(process.argv[2]);
const insideGit = process.argv[3] !== 'outside';
const upstream = path.join(project, 'dist', 'bin', 'install.js');
assert.ok(fs.existsSync(upstream), 'composed dist/bin/install.js is required');

const scratchParent = insideGit ? path.join(project, '.claude') : os.tmpdir();
fs.mkdirSync(scratchParent, { recursive: true });
const scratch = fs.mkdtempSync(path.join(scratchParent, 'spawn-measure-'));
const home = path.join(scratch, 'home');
const target = path.join(home, 'runtime');
const trace = path.join(scratch, 'trace.jsonl');
fs.mkdirSync(target, { recursive: true });

const realClaude = path.join(os.homedir(), '.claude');
assert.notEqual(path.resolve(target).toLowerCase(), path.resolve(realClaude).toLowerCase());
const namesBefore = fs.readdirSync(realClaude).sort().join('|');

const env = {
  ...process.env, HOME: home, USERPROFILE: home,
  GSD_HOME: path.join(home, '.gsd'), CLAUDE_CONFIG_DIR: target,
  CODEX_HOME: path.join(home, '.codex'), XDG_CONFIG_HOME: path.join(home, '.config'),
  TEMP: scratch, TMP: scratch,
  GUARD_TRACE: trace, GUARD_SCRIPT: upstream,
  NODE_OPTIONS: '--require ' + JSON.stringify(path.join(__dirname, 'spawn-preload.cjs')),
};
for (const key of ['GSD_TEST_MODE', 'GSD_PROJECT_DIR', 'GSD_WORKSTREAM']) delete env[key];

const report = { insideGitWorkTree: insideGit, node: process.version, platform: process.platform };
try {
  const result = spawnSync(process.execPath, [upstream, '--claude', '--global', '--config-dir', target], {
    cwd: scratch, env, encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024,
  });
  report.status = result.status;
  report.error = result.error ? result.error.message : null;
  const events = fs.existsSync(trace)
    ? fs.readFileSync(trace, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)) : [];
  report.armed = events.filter(e => e.kind === 'armed').length;
  report.loaders = [...new Set(events.filter(e => e.kind === 'load')
    .map(e => e.request + ' <- ' + (e.parent ? path.relative(project, e.parent).replaceAll('\\', '/') : 'null')))];
  report.spawns = events.filter(e => e.kind === 'spawn').map(e => ({
    api: e.api, file: e.file, args: e.args.slice(0, 6),
    from: e.from.replace(project, '').replaceAll('\\', '/'),
  }));
  report.spawnCount = report.spawns.length;
  let files = 0;
  const pending = [target];
  while (pending.length) {
    const dir = pending.pop();
    for (const name of fs.readdirSync(dir)) {
      const entry = path.join(dir, name);
      if (fs.lstatSync(entry).isDirectory()) pending.push(entry); else files++;
    }
  }
  report.filesWritten = files;
  report.realClaudeNamesUnchanged = fs.readdirSync(realClaude).sort().join('|') === namesBefore;
} finally {
  assert.equal(path.dirname(path.resolve(scratch)), path.resolve(scratchParent));
  assert.ok(path.basename(scratch).startsWith('spawn-measure-'));
  fs.rmSync(scratch, { recursive: true, force: true });
  report.fixtureRemoved = !fs.existsSync(scratch);
  process.stdout.write(JSON.stringify(report, null, 2) + os.EOL);
}
