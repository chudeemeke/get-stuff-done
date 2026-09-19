'use strict';

// Tier S unit suite for the installer transaction (bin/lib/install-names.js and, from
// the next step, bin/lib/install-transaction.js). Node-only so the c8 per-file gate
// can run it: bun run test:coverage:install-transaction.
// Contract: docs/reviews/installer-rollback-redesign-2026-09-18.md.
const test = require('node:test');
const assert = require('node:assert/strict');
const names = require('../../bin/lib/install-names');

// Code points are spelled as numbers: a written escape for an invisible or composed
// character is not a reliable channel through every tool that touches this file.
const E_ACUTE_COMPOSED = String.fromCodePoint(0xe9);
const E_ACUTE_DECOMPOSED = `e${String.fromCodePoint(0x301)}`;

test('names: the four classes match the accepted table exactly', () => {
  assert.deepEqual([...names.GENERATED], [
    'gsd-file-manifest.json', '.install-meta.json', '.overlay-manifest.json', '.gsd-profile',
    '.gsd-source', 'CREDITS.md', 'gsd-install-state.json', 'package.json',
  ]);
  assert.deepEqual([...names.LEGACY], ['get-stuff-done', 'get-shit-done', 'gsd-core']);
  assert.deepEqual([...names.OBSERVED], ['settings.json', 'gsd-local-patches', 'gsd-pristine', 'gsd-migration-journal']);
  assert.deepEqual([...names.PROTECTED], ['gsd-install-transaction', 'gsd-install.lock', 'gsd-local-patch-history']);
  assert.deepEqual([...names.PROTECTED_PREFIXES], ['gsd-install-transaction-retired-', 'gsd-install.lock.stale-']);
});

test('names: the table cannot be changed by a consumer', () => {
  for (const list of [names.GENERATED, names.LEGACY, names.OBSERVED, names.PROTECTED, names.PROTECTED_PREFIXES]) {
    assert.ok(Object.isFrozen(list));
    assert.throws(() => list.push('projects'), TypeError);
  }
  assert.ok(Object.isFrozen(names));
});

test('names: no name belongs to two classes, so a root is never also protected', () => {
  const all = [...names.GENERATED, ...names.LEGACY, ...names.OBSERVED, ...names.PROTECTED];
  assert.equal(new Set(all).size, all.length);
  for (const name of [...names.GENERATED, ...names.LEGACY, ...names.OBSERVED]) {
    for (const platform of ['win32', 'darwin', 'linux']) assert.equal(names.isProtectedName(name, platform), false, name);
  }
});

test('names: the module requires nothing, so cleanup never loads the transaction to read names', () => {
  const source = require('node:fs').readFileSync(require.resolve('../../bin/lib/install-names'), 'utf8');
  assert.equal(/\brequire\s*\(/.test(source), false);
  assert.equal(/\bimport\b/.test(source), false);
});

test('comparison keys: stored names are kept on linux, case folds on win32, case and NFC fold on darwin', () => {
  assert.equal(names.comparisonKey('Skills/README.md', 'linux'), 'Skills/README.md');
  assert.equal(names.comparisonKey(E_ACUTE_DECOMPOSED, 'linux'), E_ACUTE_DECOMPOSED);
  assert.equal(names.comparisonKey('Skills/README.md', 'win32'), 'skills/readme.md');
  assert.equal(names.comparisonKey(E_ACUTE_DECOMPOSED, 'win32'), E_ACUTE_DECOMPOSED);
  assert.equal(names.comparisonKey('Skills/README.md', 'darwin'), 'skills/readme.md');
  assert.equal(names.comparisonKey(`Caf${E_ACUTE_DECOMPOSED}`, 'darwin'), `caf${E_ACUTE_COMPOSED}`);
  assert.equal(names.comparisonKey(`caf${E_ACUTE_COMPOSED}`, 'darwin'), `caf${E_ACUTE_COMPOSED}`);
});

test('comparison keys: an unknown platform keeps stored names, like linux', () => {
  assert.equal(names.comparisonKey('Skills', 'freebsd'), 'Skills');
});

test('protected names: exact names and both generated families are recognised', () => {
  for (const platform of ['win32', 'darwin', 'linux']) {
    for (const name of names.PROTECTED) assert.equal(names.isProtectedName(name, platform), true, name);
    assert.equal(names.isProtectedName('gsd-install-transaction-retired-20260919T031500Z-4f2a', platform), true);
    assert.equal(names.isProtectedName('gsd-install.lock.stale-4f2a', platform), true);
  }
});

test('protected names: near misses are owner names, not protected ones', () => {
  for (const name of ['gsd-install-transaction.bak', 'gsd-install.lock2', 'my-gsd-install.lock', 'gsd-local-patch-history-old',
    'gsd-install-transaction-retired', 'gsd-install.lock.stale', 'projects', '.credentials.json', '']) {
    assert.equal(names.isProtectedName(name, 'linux'), false, name);
  }
});

test('protected names: a case variant is the same directory on win32 and darwin, a different one on linux', () => {
  assert.equal(names.isProtectedName('GSD-Install-Transaction', 'win32'), true);
  assert.equal(names.isProtectedName('GSD-INSTALL.LOCK.STALE-1', 'darwin'), true);
  assert.equal(names.isProtectedName('GSD-Install-Transaction', 'linux'), false);
});

// ---------------------------------------------------------------------------
// Transaction. RED until each seam lands (plan Step 3): the skeleton throws
// "not implemented: <operation>", so every case below fails on its own.
// ---------------------------------------------------------------------------
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const transaction = require('../../bin/lib/install-transaction');
const { fileError } = require('../helpers/fault-fs.cjs');

const NOW = Date.parse('2026-09-19T03:00:00.000Z');
const LOCK = 'gsd-install.lock';

function makeTarget(t) {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd install transaction '));
  t.after(() => fs.rmSync(target, { recursive: true, force: true }));
  return target;
}

// Every pid is dead unless a case says otherwise, as process.kill(pid, 0) reports it.
function apiWith(ports = {}) {
  return transaction.createInstallTransactionApi({
    platform: 'linux', pid: 1111, now: () => NOW, newId: () => 'tx-0001',
    signalProcess: () => { throw fileError('ESRCH'); },
    ...ports,
  });
}

function writeLock(target, content) {
  fs.writeFileSync(path.join(target, LOCK), typeof content === 'string' ? content : JSON.stringify(content));
}

function refusalOf(action) {
  try {
    action();
  } catch (error) {
    // An unbuilt operation is not a refusal; let the case fail as "not implemented".
    if (String(error.message).startsWith('not implemented:')) throw error;
    return error;
  }
  return assert.fail('expected a refusal');
}

test('transaction: the module exposes one factory and the sixteen planned operations', () => {
  assert.deepEqual(Object.keys(transaction).sort(), ['OPERATIONS', 'createInstallTransactionApi']);
  assert.deepEqual(Object.keys(apiWith()).sort(), [...transaction.OPERATIONS].sort());
  assert.equal(transaction.OPERATIONS.length, 16);
});

test('lock: acquiring writes the pid and creation time, and releasing removes the file', t => {
  const target = makeTarget(t);
  const lock = apiWith().acquireLock(target);
  assert.equal(lock.path, path.join(target, LOCK));
  assert.equal(lock.tookOver, false);
  assert.deepEqual(JSON.parse(fs.readFileSync(lock.path, 'utf8')), { pid: 1111, created: '2026-09-19T03:00:00.000Z' });
  lock.release();
  assert.deepEqual(fs.readdirSync(target), []);
});

test('lock: it is published whole by a link from a finished temp file, never written in place', t => {
  const target = makeTarget(t);
  const calls = [];
  const spy = new Proxy(fs, {
    get: (real, name) => (typeof real[name] !== 'function' ? real[name] : (...args) => {
      calls.push([name, ...args.filter(arg => typeof arg === 'string')]);
      return real[name](...args);
    }),
  });
  const lock = apiWith({ fs: spy }).acquireLock(target);
  const link = calls.find(([name]) => name === 'linkSync');
  assert.ok(link, 'no linkSync call');
  assert.equal(link[2], lock.path);
  assert.equal(calls.some(([name, first]) => (name.startsWith('write') || name.startsWith('append')) && first === lock.path), false);
  assert.deepEqual(fs.readdirSync(target), [LOCK]);
});

test('lock: releasing never deletes a lock that now names another installer', t => {
  const target = makeTarget(t);
  const lock = apiWith().acquireLock(target);
  writeLock(target, { pid: 2222, created: '2026-09-19T03:05:00.000Z' });
  lock.release();
  assert.equal(JSON.parse(fs.readFileSync(lock.path, 'utf8')).pid, 2222);
  lock.release();
});

for (const [label, signalProcess] of [
  ['alive', () => true],
  ['alive but owned by another user (EPERM)', () => { throw fileError('EPERM'); }],
  ['undecidable (an unexpected error)', () => { throw fileError('EINVAL'); }],
]) {
  test(`lock: a holder that is ${label} refuses with the exact instruction and touches nothing`, t => {
    const target = makeTarget(t);
    const held = { pid: 4242, created: '2026-09-19T02:58:00.000Z' };
    writeLock(target, held);
    const error = refusalOf(() => apiWith({ signalProcess }).acquireLock(target));
    assert.equal(error.name, 'InstallRefusal');
    assert.equal(error.exitCode, 6);
    assert.equal(error.message, `Another install appears to be running (pid 4242, lock ${path.join(target, LOCK)}, `
      + 'created 2026-09-19T02:58:00.000Z). If no installer is running, delete that file and run again.');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(target, LOCK), 'utf8')), held);
    assert.deepEqual(fs.readdirSync(target), [LOCK]);
  });
}

test('lock: a holder that is dead is taken over, and no stale file is left behind', t => {
  const target = makeTarget(t);
  writeLock(target, { pid: 4242, created: '2026-09-18T01:00:00.000Z' });
  const probed = [];
  const signalProcess = (pid, signal) => {
    probed.push([pid, signal]);
    throw fileError('ESRCH');
  };
  const lock = apiWith({ signalProcess }).acquireLock(target);
  assert.deepEqual(probed, [[4242, 0]]);
  assert.equal(lock.tookOver, true);
  assert.deepEqual(JSON.parse(fs.readFileSync(lock.path, 'utf8')), { pid: 1111, created: '2026-09-19T03:00:00.000Z' });
  assert.deepEqual(fs.readdirSync(target), [LOCK]);
});

for (const [label, content] of [
  ['empty', ''],
  ['not JSON', '{"pid": 42'],
  ['missing its pid', { created: '2026-09-19T02:58:00.000Z' }],
  ['carrying a pid that is not a positive integer', { pid: -1, created: '2026-09-19T02:58:00.000Z' }],
  ['missing its creation time', { pid: 4242 }],
]) {
  test(`lock: a lock file that is ${label} cannot prove its holder dead, so it refuses without a pid or a time`, t => {
    const target = makeTarget(t);
    writeLock(target, content);
    const before = fs.readFileSync(path.join(target, LOCK), 'utf8');
    const error = refusalOf(() => apiWith({ signalProcess: () => assert.fail('nothing to probe') }).acquireLock(target));
    assert.equal(error.exitCode, 6);
    assert.equal(error.message, `An install lock exists but cannot be read (lock ${path.join(target, LOCK)}). `
      + 'If no installer is running, delete that file and run again.');
    assert.equal(fs.readFileSync(path.join(target, LOCK), 'utf8'), before);
  });
}

// --- renderOutcome: pure, so message, exit code and bytes are each assertable ---------

const QUARANTINE = '/target/gsd-install-transaction/quarantine/tx-0001';
const RETIRED = '/target/gsd-install-transaction-retired-20260919T030000Z-tx-0001';

function applied(overrides = {}) {
  return {
    kind: 'applied',
    preImageTime: '2026-09-19T03:00:00.000Z',
    topLevel: { appeared: [], disappeared: [] },
    quarantine: { path: QUARANTINE, newUnits: 0, newFiles: 0, displaced: [], movedList: `${QUARANTINE}/moved.txt` },
    ...overrides,
  };
}

function incomplete(overrides = {}) {
  return { kind: 'incomplete', problems: [{ path: 'agents/a.md', reason: 'EBUSY' }], retiredPath: RETIRED, quarantine: applied().quarantine, ...overrides };
}

function recovered(result) {
  return { kind: 'recovered', interruptedAt: '2026-09-19T02:40:00.000Z', result };
}

function render(outcome, notices = []) {
  const rendered = apiWith().renderOutcome(outcome, notices);
  assert.deepEqual(Object.keys(rendered).sort(), ['exitCode', 'lines']);
  for (const line of rendered.lines) assert.equal(typeof line, 'string');
  return { ...rendered, text: rendered.lines.join('\n') };
}

test('render: a verified rollback exits 1 with the exact claim', () => {
  const { exitCode, lines } = render(applied());
  assert.equal(exitCode, 1);
  assert.equal(lines[0], 'Rollback applied: GSD roots restored to their state at 2026-09-19T03:00:00.000Z and verified');
});

test('render: top-level names that came or went are reported, left untouched, and exit 3', () => {
  const { exitCode, lines } = render(applied({ topLevel: { appeared: ['ide', 'todos'], disappeared: ['statsig'] } }));
  assert.equal(exitCode, 3);
  assert.equal(lines[0], 'Rollback applied: GSD roots restored to their state at 2026-09-19T03:00:00.000Z and verified; '
    + 'top-level entries appeared or disappeared and were left untouched: ide (appeared), todos (appeared), statsig (disappeared)');
});

test('render: every rollback outcome names what was quarantined and where the full list is', () => {
  const quarantine = {
    path: QUARANTINE, newUnits: 9, newFiles: 628, movedList: `${QUARANTINE}/moved.txt`,
    displaced: [{ path: 'settings.json', quarantinePath: `${QUARANTINE}/displaced/1/settings.json` }],
  };
  for (const outcome of [applied({ quarantine }), incomplete({ quarantine }), recovered(applied({ quarantine }))]) {
    const { text } = render(outcome);
    assert.ok(text.includes(`settings.json -> ${QUARANTINE}/displaced/1/settings.json`), outcome.kind);
    assert.ok(text.includes(`9 new entries (628 files) moved to ${QUARANTINE}/new`), outcome.kind);
    assert.ok(text.includes(`${QUARANTINE}/moved.txt`), outcome.kind);
  }
});

test('render: an incomplete rollback exits 4, lists each entry with its reason, names the retired path, gives one instruction', () => {
  const { exitCode, lines, text } = render(incomplete({
    problems: [{ path: 'agents/a.md', reason: 'EBUSY: resource busy or locked' }, { path: 'settings.json', reason: 'restored bytes do not match the pre-image' }],
  }));
  assert.equal(exitCode, 4);
  assert.equal(lines[0], 'Rollback incomplete: 2 entries were not moved or restored');
  assert.ok(text.includes('agents/a.md: EBUSY: resource busy or locked'));
  assert.ok(text.includes('settings.json: restored bytes do not match the pre-image'));
  assert.ok(text.includes(RETIRED));
  assert.equal(lines.filter(line => line.startsWith('To recover:')).length, 1);
  assert.equal(text.includes('Rollback applied'), false);
});

test('render: a verified recovery exits 5 whatever the top-level names did, and asks for a re-run', () => {
  for (const topLevel of [{ appeared: [], disappeared: [] }, { appeared: ['ide'], disappeared: [] }]) {
    const { exitCode, lines, text } = render(recovered(applied({ topLevel })));
    assert.equal(exitCode, 5);
    assert.equal(lines[0], 'Recovered an interrupted install from 2026-09-19T02:40:00.000Z');
    assert.ok(text.includes('and verified'));
    assert.ok(text.includes('Run the installer again.'));
    assert.equal(text.includes('ide (appeared)'), topLevel.appeared.length === 1);
  }
});

test('render: a recovery whose rollback is incomplete exits 4, not 5', () => {
  const { exitCode, text } = render(recovered(incomplete()));
  assert.equal(exitCode, 4);
  assert.ok(text.includes('Rollback incomplete'));
});

test('render: a refusal exits 6 and argument misuse exits 2, each with only its message', () => {
  assert.deepEqual(apiWith().renderOutcome({ kind: 'refused', message: 'Refusing: the target is a link.' }, []),
    { exitCode: 6, lines: ['Refusing: the target is a link.'] });
  assert.deepEqual(apiWith().renderOutcome({ kind: 'misuse', message: '--all is not supported.' }, []),
    { exitCode: 2, lines: ['--all is not supported.'] });
});

test('render: the child exit code or signal is printed and never becomes the exit code', () => {
  for (const [childExit, expected] of [
    [{ code: 3, signal: null }, 'Upstream installer exited with code 3'],
    [{ code: 4, signal: null }, 'Upstream installer exited with code 4'],
    [{ code: null, signal: 'SIGKILL' }, 'Upstream installer was ended by signal SIGKILL'],
  ]) {
    const { exitCode, text } = render(applied({ childExit }));
    assert.equal(exitCode, 1);
    assert.ok(text.includes(expected), expected);
  }
});

test('render: a committed install exits 0, and still exits 0 with a warning when snapshot/ could not be deleted', () => {
  assert.deepEqual(apiWith().renderOutcome({ kind: 'committed', warnings: [] }, []), { exitCode: 0, lines: [] });
  const { exitCode, text } = render({ kind: 'committed', warnings: [{ path: '/target/gsd-install-transaction/snapshot', reason: 'EBUSY' }] });
  assert.equal(exitCode, 0);
  assert.ok(text.includes('/target/gsd-install-transaction/snapshot') && text.includes('EBUSY'));
});

test('render: the notice about a retired transaction is repeated in every outcome until the owner deletes it', () => {
  const retiredPath = '/target/gsd-install-transaction-retired-20260918T010000Z-tx-0000';
  const notice = { retiredPath, displaced: 2, movedList: `${retiredPath}/quarantine/tx-0000/moved.txt`, leftInRoots: 5 };
  for (const outcome of [applied(), incomplete(), recovered(applied()), { kind: 'committed', warnings: [] }, { kind: 'refused', message: 'Refusing.' }]) {
    const { text } = render(outcome, [notice]);
    assert.ok(text.includes(retiredPath), outcome.kind);
    assert.ok(text.includes('snapshot/ holds the copies from before the interrupted install'), outcome.kind);
    assert.ok(text.includes(notice.movedList) && text.includes('2 displaced') && text.includes('5 entries'), outcome.kind);
  }
});
