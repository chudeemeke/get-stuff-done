'use strict';

// Run explicitly: node tests/acceptance/installer-recovery.cjs (after bun run compose)
// Contract: docs/reviews/installer-rollback-redesign-2026-09-18.md, "Proof".
// Exercises the real wrapper and the real composed child in disposable homes under
// this checkout. It never reads the wrapper's journal or snapshot to learn the
// pre-image: the oracles are a twin fixture and this file's own tree walker.
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
const wrapper = path.join(project, 'bin/install.js');
const upstream = path.join(project, 'dist/bin/install.js');

const INJECTED = 'INJECTED_MANIFEST_PUBLICATION_FAILURE';
const TRANSACTION_DIR = 'gsd-install-transaction';
const OWNER_FILES = {
  'owner.txt': 'owner bytes\n',
  'settings.json': '{"owner":{"keep":true},"statusLine":{"type":"command","command":"echo owner"}}\n',
};
const OUTCOME = /^Rollback applied: GSD roots restored to their state at (\S.*) and verified$/;
const ANSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');

const report = { platform: process.platform, node: process.version, accepted: false, checks: [] };

class ScenarioAborted extends Error {}

function record(scenario, kind, id, fn) {
  try {
    fn();
    report.checks.push({ scenario, kind, id, ok: true });
    return true;
  } catch (error) {
    report.checks.push({ scenario, kind, id, ok: false, detail: String(error.message).replace(ANSI, '').slice(0, 600) });
    return false;
  }
}

// A harness check proves the scenario ran as designed; without it nothing later means anything.
function harness(scenario, id, fn) {
  if (!record(scenario, 'harness', id, fn)) throw new ScenarioAborted(`${scenario}:${id}`);
}

function accept(scenario, id, fn) {
  record(scenario, 'acceptance', id, fn);
}

function digestOf(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

// Own walker: type, SHA-256, link targets, and every directory so empty ones count.
function snapshotTree(root) {
  const entries = {};
  const pending = [''];
  while (pending.length) {
    const relative = pending.pop();
    for (const name of fs.readdirSync(path.join(root, relative))) {
      const child = relative ? `${relative}/${name}` : name;
      const absolute = path.join(root, child);
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) entries[child] = `link:${fs.readlinkSync(absolute)}`;
      else if (stat.isDirectory()) {
        entries[child] = 'dir';
        pending.push(child);
      } else entries[child] = `file:${digestOf(fs.readFileSync(absolute))}`;
    }
  }
  return entries;
}

function typesOnly(tree) {
  return Object.fromEntries(Object.entries(tree).map(([name, value]) => [name, value.split(':')[0]]));
}

function without(tree, topLevelName) {
  return Object.fromEntries(Object.entries(tree)
    .filter(([name]) => name !== topLevelName && !name.startsWith(`${topLevelName}/`)));
}

function assertSameTree(actual, expected, label) {
  const missing = Object.keys(expected).filter(name => !(name in actual)).sort();
  const unexpected = Object.keys(actual).filter(name => !(name in expected)).sort();
  const changed = Object.keys(expected).filter(name => name in actual && actual[name] !== expected[name]).sort();
  if (missing.length + unexpected.length + changed.length === 0) return;
  const show = list => `${list.length}${list.length ? ` (${list.slice(0, 6).join(', ')})` : ''}`;
  assert.fail(`${label}: missing ${show(missing)}; unexpected ${show(unexpected)}; changed ${show(changed)}`);
}

function createFixture(name) {
  const home = path.join(scratch, `${name} home`);
  const target = path.join(home, 'runtime with spaces');
  fs.mkdirSync(target, { recursive: true });
  for (const [file, content] of Object.entries(OWNER_FILES)) fs.writeFileSync(path.join(target, file), content);
  return { name, home, target };
}

// Inject only at the first manifest publication in the real upstream child, after
// materialization has started. The wrapper's recovery is not mocked. The trace is a
// lower bound: synchronous path-based calls only.
function writeInjection(fixture) {
  const preload = path.join(scratch, `${fixture.name} inject write failure.cjs`);
  const traceFile = path.join(scratch, `${fixture.name}-write-trace.json`);
  fs.writeFileSync(preload, `
    const fs = require('node:fs');
    const path = require('node:path');
    if (path.resolve(process.argv[1]) === ${JSON.stringify(upstream)}) {
      const write = fs.writeFileSync;
      const trace = [];
      const home = ${JSON.stringify(fixture.home)};
      const methods = { writeFileSync: [0], copyFileSync: [1], appendFileSync: [0],
        unlinkSync: [0], rmSync: [0], rmdirSync: [0], mkdirSync: [0], renameSync: [0, 1] };
      for (const [method, indices] of Object.entries(methods)) {
        const original = fs[method];
        fs[method] = function(...args) {
          const paths = indices.flatMap(index => {
            if (typeof args[index] !== 'string') return [];
            const absolute = path.resolve(args[index]);
            return absolute.startsWith(home + path.sep) ? [path.relative(home, absolute).replaceAll('\\\\', '/')] : [];
          });
          try {
            if (method === 'writeFileSync' && typeof args[0] === 'string' && path.resolve(args[0]) === ${JSON.stringify(path.join(fixture.target, 'gsd-file-manifest.json'))}) {
              throw new Error(${JSON.stringify(INJECTED)});
            }
            const result = original.apply(this, args);
            if (paths.length) trace.push({ method, paths, completed: true });
            return result;
          } catch (error) {
            if (paths.length) trace.push({ method, paths, completed: false });
            throw error;
          }
        };
      }
      process.on('exit', () => write(${JSON.stringify(traceFile)}, JSON.stringify(trace)));
    }
  `);
  return { preload, traceFile };
}

function run(script, fixture, injection) {
  const env = {
    ...process.env, HOME: fixture.home, USERPROFILE: fixture.home,
    GSD_HOME: path.join(fixture.home, '.gsd'), CLAUDE_CONFIG_DIR: fixture.target,
    CODEX_HOME: path.join(fixture.home, '.codex'), XDG_CONFIG_HOME: path.join(fixture.home, '.config'),
    TEMP: scratch, TMP: scratch,
  };
  for (const key of ['GSD_TEST_MODE', 'GSD_PROJECT_DIR', 'GSD_WORKSTREAM', 'NODE_OPTIONS', 'FORCE_COLOR']) delete env[key];
  if (injection) env.NODE_OPTIONS = `--require ${JSON.stringify(injection.preload)}`;
  const started = Date.now();
  const result = spawnSync(process.execPath, [script, '--claude', '--global', '--config-dir', fixture.target], {
    cwd: scratch, env, encoding: 'utf8', timeout: 180000, maxBuffer: 32 * 1024 * 1024,
  });
  const output = `${result.stdout || ''}\n${result.stderr || ''}`.replace(ANSI, '');
  return { result, output, started, finished: Date.now() };
}

function readTrace(injection) {
  return fs.existsSync(injection.traceFile) ? JSON.parse(fs.readFileSync(injection.traceFile, 'utf8')) : [];
}

// Independent source for "exactly the residue": the same failure-injected child,
// without the wrapper, against a twin fixture.
function measureTwin() {
  const scenario = 'twin';
  const details = report[scenario] = {};
  const twin = createFixture('twin');
  const injection = writeInjection(twin);
  const before = snapshotTree(twin.target);
  const attempt = run(upstream, twin, injection);
  harness(scenario, 'child-failed-at-injection', () => {
    assert.equal(attempt.result.error, undefined);
    assert.ok(attempt.output.includes(INJECTED), 'twin child never reached the injected write');
    assert.notEqual(attempt.result.status, 0);
  });
  const after = snapshotTree(twin.target);
  const residue = typesOnly(Object.fromEntries(Object.entries(after).filter(([name]) => !(name in before))));
  const changed = Object.keys(before).filter(name => after[name] !== before[name]).sort();
  // Files the trace saw the child write one by one. The child also places whole
  // directories with fs.cpSync, which the trace cannot attribute to a file.
  const prefix = `${path.relative(twin.home, twin.target).replaceAll('\\', '/')}/`;
  const traced = new Set(readTrace(injection).filter(event => event.completed)
    .flatMap(event => event.paths).filter(name => name.startsWith(prefix)).map(name => name.slice(prefix.length)));
  const tracedFiles = Object.keys(residue).filter(name => residue[name] === 'file' && name.includes('/') && traced.has(name)).sort();
  details.residueEntries = Object.keys(residue).length;
  details.changed = changed;
  details.tracedFiles = tracedFiles.length;
  harness(scenario, 'residue-non-empty', () => assert.ok(Object.keys(residue).length > 0));
  return { residue, changed, tracedFiles };
}

function assertOutcome(scenario, details, attempt) {
  accept(scenario, 'status-is-1', () => assert.equal(attempt.result.status, 1));
  accept(scenario, 'outcome-exact', () => {
    const lines = attempt.output.split(/\r?\n/).map(line => line.trim()).filter(line => line.startsWith('Rollback '));
    details.outcomeLines = lines;
    assert.equal(lines.length, 1, `expected one outcome line, saw ${JSON.stringify(lines)}`);
    const match = OUTCOME.exec(lines[0]);
    assert.ok(match, `outcome line is not the verified form: ${JSON.stringify(lines[0])}`);
    const claimed = Date.parse(match[1]);
    assert.ok(Number.isFinite(claimed), `pre-image time does not parse: ${match[1]}`);
    assert.ok(claimed >= attempt.started - 1000 && claimed <= attempt.finished,
      `pre-image time ${match[1]} is outside this run`);
  });
}

// Inside the transaction directory: only quarantine/<one id>/ with new/**, displaced/**
// and moved.txt. No lock, journal, snapshot/ or anything else.
function readQuarantine(scenario, details, fixture, attempt) {
  const quarantine = { entries: {}, displaced: [], moved: '' };
  accept(scenario, 'transaction-directory-shape', () => {
    const root = path.join(fixture.target, TRANSACTION_DIR);
    assert.deepEqual(fs.readdirSync(root).sort(), ['quarantine']);
    const ids = fs.readdirSync(path.join(root, 'quarantine'));
    assert.equal(ids.length, 1, `expected one transaction id, saw ${JSON.stringify(ids)}`);
    const idDir = path.join(root, 'quarantine', ids[0]);
    const names = fs.readdirSync(idDir).sort();
    assert.deepEqual(names.filter(name => !['displaced', 'moved.txt', 'new'].includes(name)), []);
    assert.ok(names.includes('new') && names.includes('moved.txt'), `saw ${JSON.stringify(names)}`);
    quarantine.idDir = idDir;
    quarantine.entries = typesOnly(snapshotTree(path.join(idDir, 'new')));
    quarantine.moved = fs.readFileSync(path.join(idDir, 'moved.txt'), 'utf8');
    if (names.includes('displaced')) {
      const found = new Set();
      for (const attemptName of fs.readdirSync(path.join(idDir, 'displaced'))) {
        const tree = snapshotTree(path.join(idDir, 'displaced', attemptName));
        for (const [name, value] of Object.entries(tree)) if (value !== 'dir') found.add(name);
      }
      quarantine.displaced = [...found].sort();
    }
    details.quarantinedEntries = Object.keys(quarantine.entries).length;
    details.displaced = quarantine.displaced;
  });
  accept(scenario, 'quarantine-path-printed', () => {
    assert.ok(quarantine.idDir, 'no quarantine to name');
    assert.ok(attempt.output.includes(quarantine.idDir), `output never names ${quarantine.idDir}`);
  });
  return quarantine;
}

function assertMovedListsFiles(scenario, quarantine, expectedEntries) {
  accept(scenario, 'moved-txt-lists-every-file', () => {
    const files = Object.keys(expectedEntries).filter(name => expectedEntries[name] === 'file');
    const absent = files.filter(name => !quarantine.moved.includes(name));
    assert.equal(absent.length, 0, `${absent.length} of ${files.length} absent, e.g. ${absent.slice(0, 4).join(', ')}`);
  });
}

function freshScenario(twin) {
  const scenario = 'fresh';
  const details = report[scenario] = {};
  const fixture = createFixture('fresh');
  const injection = writeInjection(fixture);
  const attempt = run(wrapper, fixture, injection);
  details.status = attempt.result.status;
  details.traceCount = readTrace(injection).length;
  harness(scenario, 'wrapper-child-failed-at-injection', () => {
    assert.equal(attempt.result.error, undefined);
    assert.ok(attempt.output.includes(INJECTED), 'child under the wrapper never reached the injected write');
  });

  assertOutcome(scenario, details, attempt);
  accept(scenario, 'top-level-exact-allowlist', () => {
    const names = fs.readdirSync(fixture.target).sort();
    details.topLevelCount = names.length;
    assert.deepEqual(names, [...Object.keys(OWNER_FILES), TRANSACTION_DIR].sort());
  });
  accept(scenario, 'owner-bytes-preserved', () => {
    for (const [file, content] of Object.entries(OWNER_FILES)) {
      assert.equal(fs.readFileSync(path.join(fixture.target, file), 'utf8'), content, file);
    }
  });
  const quarantine = readQuarantine(scenario, details, fixture, attempt);
  accept(scenario, 'new-equals-twin-residue', () => assertSameTree(quarantine.entries, twin.residue, 'new/ against twin'));
  accept(scenario, 'displaced-equals-twin-changes', () => assert.deepEqual(quarantine.displaced, twin.changed));
  assertMovedListsFiles(scenario, quarantine, twin.residue);
}

function upgradeScenario(twin) {
  const scenario = 'upgrade';
  const details = report[scenario] = {};
  const fixture = createFixture('upgrade');
  const first = run(wrapper, fixture, null);
  harness(scenario, 'first-install-succeeded', () => {
    assert.equal(first.result.error, undefined);
    assert.equal(first.result.status, 0, first.output.slice(-400));
  });

  // Give the rollback real work: one installed file carries an owner edit (must come
  // back byte-identical) and one is gone (its re-creation must be quarantined).
  // Picked from what the twin's trace saw the child write, so the child is known to write both.
  const written = twin.tracedFiles;
  const edited = written[0];
  const removed = written[written.length - 1];
  harness(scenario, 'picked-files-installed', () => {
    assert.ok(written.length >= 2, `saw ${written.length}`);
    for (const name of [edited, removed]) assert.ok(fs.existsSync(path.join(fixture.target, name)), name);
  });
  fs.appendFileSync(path.join(fixture.target, edited), '\nowner edit made before the failed upgrade\n');
  fs.unlinkSync(path.join(fixture.target, removed));
  details.edited = edited;
  details.removed = removed;
  const before = without(snapshotTree(fixture.target), TRANSACTION_DIR);

  const injection = writeInjection(fixture);
  const attempt = run(wrapper, fixture, injection);
  details.status = attempt.result.status;
  const trace = readTrace(injection);
  details.traceCount = trace.length;
  harness(scenario, 'wrapper-child-failed-at-injection', () => {
    assert.equal(attempt.result.error, undefined);
    assert.ok(attempt.output.includes(INJECTED), 'child under the wrapper never reached the injected write');
  });
  // The trace is a lower bound, so a hit is proof the rollback had both jobs to do.
  harness(scenario, 'child-rewrote-picked-files', () => {
    const prefix = path.relative(fixture.home, fixture.target).replaceAll('\\', '/');
    const completed = new Set(trace.filter(event => event.completed).flatMap(event => event.paths));
    for (const name of [edited, removed]) assert.ok(completed.has(`${prefix}/${name}`), `child never wrote ${name}`);
  });

  assertOutcome(scenario, details, attempt);
  accept(scenario, 'tree-deep-equal-outside-allowlist', () => {
    assertSameTree(without(snapshotTree(fixture.target), TRANSACTION_DIR), before, 'after against before');
  });
  const quarantine = readQuarantine(scenario, details, fixture, attempt);
  accept(scenario, 'removed-file-quarantined-as-new', () => assert.equal(quarantine.entries[removed], 'file'));
  accept(scenario, 'edited-file-displaced', () => assert.ok(quarantine.displaced.includes(edited), JSON.stringify(quarantine.displaced.slice(0, 6))));
  assertMovedListsFiles(scenario, quarantine, { [removed]: 'file' });
}

try {
  assert.ok(fs.existsSync(upstream), 'compose the candidate before running acceptance');
  report.sourceHashes = Object.fromEntries(['bin/install.js', 'dist/bin/install.js'].map(name => [
    name, digestOf(fs.readFileSync(path.join(project, name))),
  ]));
  const guarded = fn => {
    try {
      return fn();
    } catch (error) {
      if (!(error instanceof ScenarioAborted)) throw error;
      return undefined;
    }
  };
  const twin = guarded(measureTwin);
  if (twin) for (const scenario of [freshScenario, upgradeScenario]) guarded(() => scenario(twin));
  const failed = report.checks.filter(check => !check.ok);
  report.accepted = failed.length === 0;
  if (failed.length) report.failure = failed.map(check => `${check.scenario}:${check.id}`).join(', ');
} catch (error) {
  report.harnessError = error.message;
} finally {
  if (!report.accepted) process.exitCode = 1;
  // Only delete this invocation's generated fixture inside this checkout.
  assert.equal(path.dirname(path.resolve(scratch)), path.resolve(scratchParent));
  assert.ok(path.basename(scratch).startsWith('installer-recovery-'));
  fs.rmSync(scratch, { recursive: true, force: true });
  report.fixtureRemoved = !fs.existsSync(scratch);
  process.stdout.write(JSON.stringify(report, null, 2) + os.EOL);
}
