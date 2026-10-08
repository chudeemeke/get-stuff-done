'use strict';
// Defense for the experiment: refuse synchronous writes outside its disposable root.
// This is not a general sandbox or proof of all native/async writes.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.env.COMPARISON_WRITE_ROOT);
const trace = process.env.COMPARISON_TRACE;
const append = fs.appendFileSync;
function record(row) { append(trace, JSON.stringify({ pid: process.pid, ...row }) + '\n'); }
function check(value) {
  if (typeof value !== 'string' && !Buffer.isBuffer(value)) return;
  const file = path.resolve(String(value));
  if (file !== root && !file.startsWith(root + path.sep)) {
    record({ blocked: file });
    throw new Error('COMPARISON_OUTSIDE_WRITE_ROOT: ' + file);
  }
}
for (const [method, indices] of Object.entries({ writeFileSync: [0], appendFileSync: [0],
  copyFileSync: [1], cpSync: [1], mkdirSync: [0], unlinkSync: [0], rmSync: [0], rmdirSync: [0],
  renameSync: [0, 1], linkSync: [1], symlinkSync: [1], chmodSync: [0], chownSync: [0], utimesSync: [0] })) {
  const original = fs[method];
  fs[method] = function(...args) {
    for (const i of indices) check(args[i]);
    if (method === 'writeFileSync' && process.env.COMPARISON_FAIL_MANIFEST
      && typeof args[0] === 'string' && path.resolve(args[0]) === path.resolve(process.env.COMPARISON_FAIL_MANIFEST)) {
      record({ injected: true, method, file: args[0] });
      const error = new Error('COMPARISON_MANIFEST_FAILURE'); error.code = 'ENOSPC'; throw error;
    }
    return original.apply(this, args);
  };
}
const open = fs.openSync;
fs.openSync = function(file, flags, ...rest) {
  if (typeof flags === 'number' ? (flags & (fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT)) !== 0 : /[wa+]/.test(flags)) check(file);
  return open.call(this, file, flags, ...rest);
};
record({ loaded: true, entry: process.argv[1] });
