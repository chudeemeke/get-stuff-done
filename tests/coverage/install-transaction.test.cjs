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
