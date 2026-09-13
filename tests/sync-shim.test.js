'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { test, expect } = require('bun:test');

test('an inaccessible dangling sync shim records skips without loading sync', () => {
  const source = fs.readFileSync(path.join(__dirname, 'sync.test.cjs'), 'utf8');
  const suites = [];
  const inaccessible = () => { throw Object.assign(new Error('access denied'), { code: 'EPERM' }); };
  const fakeFs = {
    lstatSync: () => ({}),
    statSync: () => { throw Object.assign(new Error('missing target'), { code: 'ENOENT' }); },
    unlinkSync: inaccessible,
    rmdirSync: inaccessible,
  };
  const requireForTest = name => {
    if (name === 'fs') return fakeFs;
    if (name === 'path') return path;
    if (name === 'node:assert') return require('node:assert');
    if (name === 'node:test') return { describe: (title, options) => suites.push({ title, options }) };
    if (name === './helpers.cjs' || name === './helpers/test-timeouts') return {};
    throw new Error(`Unexpected module load while shim is unavailable: ${name}`);
  };
  vm.runInNewContext(source, { require: requireForTest, __dirname, process: { platform: process.platform }, console });
  expect(suites.length).toBeGreaterThan(0);
  expect(suites.every(suite => typeof suite.options?.skip === 'string' &&
    suite.options.skip.includes('dangling'))).toBe(true);
});
