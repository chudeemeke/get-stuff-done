'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { candidates, scratch, isolate, hash } = require('./compare.cjs');
const [candidate, runtime, mode = 'lifecycle'] = process.argv.slice(2);
if (!['upstream', 'skin'].includes(candidate) || !['claude', 'codex'].includes(runtime)
  || !['lifecycle', 'failure', 'configuration'].includes(mode)) throw new Error('Unknown comparison input');
const name = `${candidate}-${runtime}-${mode}-isolated${mode === 'configuration' ? '-v2' : ''}`;
const isolation = isolate(name);
const target = path.join(isolation.home, '.' + runtime);
fs.mkdirSync(target, { recursive: true });
const installer = path.join(candidate === 'skin' ? path.join(scratch, 'wrapper-package') : candidates.upstream, 'bin/install.js');
const trace = path.join(isolation.dir, 'trace.jsonl');
const env = { ...isolation.env, COMPARISON_WRITE_ROOT: isolation.dir, COMPARISON_TRACE: trace,
  NODE_OPTIONS: '--require=' + path.join(__dirname, 'guard.cjs'),
  npm_config_prefix: path.join(isolation.home, 'npm'), npm_config_cache: path.join(isolation.home, '.npm'),
};
const owner = { 'owner.txt': 'owner bytes\n', 'scripts/lib/owner-helper.cjs': 'owner script\n',
  'scripts/changeset/owner-check.cjs': 'owner changeset\n' };
if (runtime === 'claude') owner['settings.json'] = '{"owner":{"keep":true},"statusLine":{"type":"command","command":"echo owner"}}\n';
else owner['config.toml'] = '# Owner configuration\nmodel = "owner-model"\n';
for (const [rel, text] of Object.entries(owner)) {
  const file = path.join(target, rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text);
}
function snapshot(dir) {
  const result = {};
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) result[entry.name] = 'link:' + fs.readlinkSync(file);
    else if (entry.isDirectory()) for (const [rel, value] of Object.entries(snapshot(file))) result[entry.name + '/' + rel] = value;
    else result[entry.name] = hash(file);
  }
  return result;
}
const before = snapshot(target);
const rows = [];
function check(id, ok, detail) { rows.push({ id, ok: Boolean(ok), ...(detail === undefined ? {} : { detail }) }); }
function invoke(operation, extra = [], fault = false) {
  const start = Date.now();
  const result = spawnSync(process.execPath, [installer, '--' + runtime, '--global', '--config-dir', target, ...extra], {
    cwd: isolation.dir, env: { ...env, ...(fault ? { COMPARISON_FAIL_MANIFEST: path.join(target, 'gsd-file-manifest.json') } : {}) },
    encoding: 'utf8', timeout: 90000,
  });
  fs.writeFileSync(path.join(__dirname, `${name}-${operation}.log`), (result.stdout || '') + '\nSTDERR\n' + (result.stderr || ''));
  const resultRow = { operation, status: result.status, durationMs: Date.now() - start, error: result.error?.message || null };
  console.log(JSON.stringify(resultRow));
  return { ...resultRow, output: (result.stdout || '') + (result.stderr || '') };
}
function ownerChecks(stage) {
  for (const [rel, content] of Object.entries(owner)) {
    const file = path.join(target, rel);
    const actual = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    const ok = rel === 'settings.json' ? actual !== null && JSON.parse(actual).owner?.keep === true && JSON.parse(actual).statusLine?.command === 'echo owner'
      : rel === 'config.toml' ? actual !== null && actual.includes('model = "owner-model"') : actual === content;
    check(stage + ':preserve:' + rel, ok);
  }
}
if (mode === 'failure') {
  const result = invoke('manifest-fault', [], true);
  const records = fs.existsSync(trace) ? fs.readFileSync(trace, 'utf8') : '';
  check('injection-reached', records.includes('"injected":true'));
  check('failure-exits-nonzero', result.status !== 0 && result.status !== null);
  ownerChecks('failure');
  const after = snapshot(target);
  const residue = Object.keys(after).filter(rel => !(rel in before));
  check('no-unquarantined-residue', residue.length === 0, { count: residue.length, sample: residue.slice(0, 12) });
  check('no-false-rollback-claim', !/Rollback applied/.test(result.output) || residue.length === 0);
} else if (mode === 'configuration') {
  const installed = invoke('install'); check('install:exit-zero', installed.status === 0);
  const config = { runtime, effort: { agent_overrides: { 'gsd-plan-checker': 'high' } },
    agent_skills: { 'gsd-planner': ['global:comparison-digest'] } };
  fs.writeFileSync(path.join(isolation.dir, '.planning/config.json'), JSON.stringify(config));
  const skill = path.join(isolation.home, runtime === 'claude' ? '.claude' : '.agents', 'skills/comparison-digest/SKILL.md');
  fs.mkdirSync(path.dirname(skill), { recursive: true });
  fs.writeFileSync(skill, '---\nname: comparison-digest\ndescription: Isolated routing probe\n---\nRead the approved plan digest.\n');
  const tool = path.join(target, 'gsd-core/bin/gsd-tools.cjs');
  function query(label, args) {
    const result = spawnSync(process.execPath, [tool, ...args], { cwd: isolation.dir, env, encoding: 'utf8', timeout: 30000 });
    fs.writeFileSync(path.join(__dirname, `${name}-${label}.log`), (result.stdout || '') + '\nSTDERR\n' + (result.stderr || ''));
    check(label + ':exit-zero', result.status === 0, result.error?.message);
    return result;
  }
  const skills = query('agent-skills', ['query', 'agent-skills', 'gsd-planner']);
  check('native-planner-skill-routing', skills.stdout.includes(skill.replaceAll(path.sep, '/')));
  const agent = path.join(target, 'agents', 'gsd-plan-checker.' + (runtime === 'claude' ? 'md' : 'toml'));
  if (fs.existsSync(agent)) {
    let content = fs.readFileSync(agent, 'utf8');
    if (runtime === 'claude') content = content.replace(/^effort:.*$/m, 'effort: low');
    else content = content.replace(/^model\s*=.*\r?\n/gm, '').replace(/^model_reasoning_effort\s*=.*\r?\n/gm, '')
      + '\nmodel = "sonnet"\nmodel_reasoning_effort = "low"\n';
    fs.writeFileSync(agent, content);
    query('effort-sync', ['effort', 'sync', '--apply', '--runtime', runtime, '--config-dir', target]);
    const after = fs.readFileSync(agent, 'utf8');
    check('native-effort-sync-repairs-stale-agent', runtime === 'claude' ? /^effort: high\r?$/m.test(after)
      : !/^model\s*=\s*"sonnet"/m.test(after) && !/^model_reasoning_effort\s*=/m.test(after));
    const noop = query('effort-sync-noop', ['effort', 'sync', '--apply', '--runtime', runtime, '--config-dir', target]);
    try { check('effort-sync-idempotent', JSON.parse(noop.stdout).synced === 0); }
    catch { check('effort-sync-idempotent', false, 'Missing JSON'); }
  } else check('checker-agent-installed', false);
} else {
  for (const operation of ['install', 'reinstall']) {
    const result = invoke(operation); check(operation + ':exit-zero', result.status === 0);
    ownerChecks(operation);
    check(operation + ':installed-tool', fs.existsSync(path.join(target, 'gsd-core/bin/gsd-tools.cjs')));
    const manifestPath = path.join(target, 'gsd-file-manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath));
      check(operation + ':does-not-claim-owner-scripts', !Object.keys(owner).filter(p => p.endsWith('.cjs')).some(p => Object.hasOwn(manifest.files || {}, p)));
    } else check(operation + ':manifest-present', false);
  }
  const result = invoke('uninstall', ['--uninstall']); check('uninstall:exit-zero', result.status === 0);
  ownerChecks('uninstall');
}
const traceRows = fs.existsSync(trace) ? fs.readFileSync(trace, 'utf8').trim().split('\n').map(line => JSON.parse(line)) : [];
check('write-guard-loaded', traceRows.some(row => row.loaded));
check('no-blocked-external-write', !traceRows.some(row => row.blocked), traceRows.filter(row => row.blocked));
const report = { candidate, runtime, mode, installer, installerSha256: hash(installer), platform: process.platform,
  node: process.version, scratch: isolation.dir, checks: rows,
  passed: rows.filter(r => r.ok).length, failed: rows.filter(r => !r.ok).length };
fs.writeFileSync(path.join(__dirname, `${name}.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ passed: report.passed, failed: report.failed, failures: rows.filter(r => !r.ok) }, null, 2));
