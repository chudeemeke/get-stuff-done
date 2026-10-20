'use strict';
// Bounded experiment, not shipped code. Every subprocess uses a disposable home.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const scratch = path.join(root, '.claude', 'value-comparison-2026-09-19');
const bunDir = 'C:/Users/Destiny/AppData/Local/npm-cache/_npx/bb6645c1041000be/node_modules/@oven/bun-windows-x64-baseline/bin';
const candidates = {
  upstream: path.join(__dirname, 'package'),
  skin: path.join(scratch, 'skin-package'),
};
function hash(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function isolate(name) {
  const dir = path.join(scratch, name);
  if (!dir.startsWith(scratch + path.sep)) throw new Error('Outside scratch');
  const home = path.join(dir, 'home');
  const temp = path.join(dir, 'temp');
  fs.mkdirSync(home, { recursive: true });
  fs.mkdirSync(temp, { recursive: true });
  fs.mkdirSync(path.join(dir, '.planning'), { recursive: true });
  const config = path.join(dir, '.planning/config.json');
  if (!fs.existsSync(config)) fs.writeFileSync(config, '{}\n');
  const env = { ...process.env, PATH: bunDir + path.delimiter + process.env.PATH,
    HOME: home, USERPROFILE: home, TMP: temp, TEMP: temp, TMPDIR: temp,
    APPDATA: path.join(home, 'AppData/Roaming'), LOCALAPPDATA: path.join(home, 'AppData/Local'),
    XDG_CONFIG_HOME: path.join(home, '.config'), XDG_CACHE_HOME: path.join(home, '.cache'),
    XDG_DATA_HOME: path.join(home, '.local/share'), GSD_HOME: path.join(home, '.gsd'),
    CLAUDE_CONFIG_DIR: path.join(home, '.claude'), CODEX_HOME: path.join(home, '.codex'),
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: path.join(home, '.gitconfig'),
  };
  for (const key of ['GSD_WORKSTREAM', 'GSD_PROJECT_DIR', 'GSD_TEST_MODE', 'NODE_OPTIONS',
    'GSD_COMPAT_PACKAGE_ROOT', 'GSD_ACCEPTANCE_TOOLS']) delete env[key];
  return { dir, home, env };
}
function runSuite(candidate, suite) {
  const isolation = isolate(candidate + '-' + suite);
  const packageRoot = candidates[candidate];
  if (!packageRoot) throw new Error('Unknown candidate');
  const tool = path.join(packageRoot, 'gsd-core/bin/gsd-tools.cjs');
  const file = suite === 'state' ? path.join(root, 'tests/acceptance/state-delivery.cjs')
    : path.join(__dirname, 'behavior.test.cjs');
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', file], {
    cwd: isolation.dir, env: { ...isolation.env, GSD_ACCEPTANCE_TOOLS: tool,
      GSD_COMPARISON_PACKAGE: packageRoot }, encoding: 'utf8', timeout: 240000,
  });
  fs.writeFileSync(path.join(__dirname, `${candidate}-${suite}.tap`), result.stdout || '');
  fs.writeFileSync(path.join(__dirname, `${candidate}-${suite}.stderr`), result.stderr || '');
  const counts = Object.fromEntries(['tests', 'pass', 'fail', 'cancelled', 'skipped']
    .map(key => [key, Number(result.stdout?.match(new RegExp('^# ' + key + ' (\\d+)$', 'm'))?.[1] ?? NaN)]));
  const receipt = { candidate, suite, packageRoot, node: process.version, platform: process.platform,
    toolSha256: hash(tool), suiteSha256: hash(file), status: result.status,
    error: result.error?.message || null, counts,
    validSummary: Object.values(counts).every(Number.isFinite) && counts.tests > 0 && counts.cancelled === 0,
  };
  fs.writeFileSync(path.join(__dirname, `${candidate}-${suite}.json`), JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify(receipt, null, 2));
  if (!receipt.validSummary) process.exitCode = 2;
}
module.exports = { root, scratch, candidates, isolate, hash };
const [mode, candidate, suite] = process.argv.slice(2);
if (require.main !== module) { /* helpers for the isolated installer experiment */ }
else if (mode === 'prepare') {
  if (fs.existsSync(candidates.skin)) throw new Error('Refuse replacing existing comparison candidate');
  fs.mkdirSync(scratch, { recursive: true });
  const { compose } = require(path.join(root, 'scripts/compose.js'));
  const summary = compose({ distDir: path.join(candidates.skin, 'dist') });
  // The composed child is compared on its own. The wrapper fixture uses the same dist.
  fs.cpSync(path.join(candidates.skin, 'dist'), candidates.skin, { recursive: true });
  const wrapper = path.join(scratch, 'wrapper-package');
  fs.mkdirSync(wrapper, { recursive: true });
  fs.cpSync(path.join(root, 'bin'), path.join(wrapper, 'bin'), { recursive: true });
  fs.cpSync(path.join(candidates.skin, 'dist'), path.join(wrapper, 'dist'), { recursive: true });
  for (const file of ['package.json', 'overlay/branding.json', 'overlay/features.json',
    'scripts/lib/package-provenance.js', 'scripts/lib/upstream-source.js']) {
    const target = path.join(wrapper, file);
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(path.join(root, file), target);
  }
  const receipt = { head: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim(),
    upstream: JSON.parse(fs.readFileSync(path.join(__dirname, 'upstream-metadata.json'))),
    summary, packageRoots: candidates };
  fs.writeFileSync(path.join(__dirname, 'provenance.json'), JSON.stringify(receipt, null, 2));
  console.log('Prepared isolated composed candidate and wrapper.');
} else if (mode === 'suite') runSuite(candidate, suite);
else throw new Error('Expected prepare or suite <upstream|skin> <state|behavior>');
