'use strict';
// Validate receipt completeness, then bind the retained evidence to its bytes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const read = name => JSON.parse(fs.readFileSync(path.join(__dirname, name), 'utf8'));
const metadata = read('upstream-metadata.json');
const integrity = 'sha512-' + crypto.createHash('sha512').update(fs.readFileSync(path.join(__dirname, 'gsd-core-1.14.0.tgz'))).digest('base64');
assert.equal(integrity, metadata.dist.integrity);
const summaries = [];
for (const [name, pass, fail] of [['upstream-state', 9, 3], ['skin-state', 9, 3], ['upstream-behavior', 0, 8], ['skin-behavior', 8, 0]]) {
  const receipt = read(name + '.json');
  assert.equal(receipt.validSummary, true);
  assert.deepEqual(receipt.counts, { tests: pass + fail, pass, fail, cancelled: 0, skipped: 0 });
  assert.equal(receipt.status, fail ? 1 : 0);
  const tap = fs.readFileSync(path.join(__dirname, name + '.tap'), 'utf8');
  assert.ok(tap.includes('# tests ' + (pass + fail)) && tap.includes('# fail ' + fail));
  summaries.push({ name, pass, fail });
}
for (const [name, pass, fail] of [
  ['upstream-claude-lifecycle-isolated', 19, 2], ['upstream-codex-lifecycle-isolated', 19, 2],
  ['skin-claude-lifecycle-isolated', 21, 0], ['skin-codex-lifecycle-isolated', 21, 0],
  ['upstream-claude-failure-isolated', 9, 1], ['skin-claude-failure-isolated', 8, 2],
  ['upstream-claude-configuration-isolated-v2', 9, 0], ['upstream-codex-configuration-isolated-v2', 9, 0],
]) {
  const receipt = read(name + '.json');
  assert.equal(receipt.passed, pass); assert.equal(receipt.failed, fail);
  assert.equal(receipt.checks.length, pass + fail);
  assert.equal(receipt.checks.filter(row => row.ok).length, pass);
  assert.equal(receipt.checks.find(row => row.id === 'no-blocked-external-write').ok, true);
  summaries.push({ name, pass, fail });
}
const adoption = read('upstream-adoption.json');
assert.equal(adoption.length, 7);
assert.equal(adoption.find(row => row.id === 'canonical-replanning-count').ok, true);
assert.equal(adoption.find(row => row.id === 'guard-rejects-outside-write').ok, true);
const summary = { timestamp: new Date().toISOString(), verification: 'Expected experimental results present; NOT product acceptance',
  upstreamIntegrityVerified: true, summaries, adoptionCases: adoption.length };
fs.writeFileSync(path.join(__dirname, 'verified-summary.json'), JSON.stringify(summary, null, 2));
const files = fs.readdirSync(__dirname, { withFileTypes: true }).filter(entry => entry.isFile()
  && !['evidence-manifest.json', 'gsd-core-1.14.0.tgz'].includes(entry.name)).map(entry => {
  const bytes = fs.readFileSync(path.join(__dirname, entry.name));
  return { path: entry.name, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
}).sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(path.join(__dirname, 'evidence-manifest.json'), JSON.stringify({ timestamp: summary.timestamp,
  upstreamIntegrityVerified: true, upstreamIntegrity: integrity, files }, null, 2));
for (const file of files) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, file.path))).digest('hex'), file.sha256);
console.log(`Verified 12 result receipts, 7 adoption/control observations and ${files.length} evidence hashes. Experimental failures retained; no product acceptance claimed.`);
