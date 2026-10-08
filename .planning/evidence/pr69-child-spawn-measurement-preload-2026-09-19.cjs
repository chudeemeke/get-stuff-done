'use strict';
// Measurement preload. Configured by env only, so no source is generated.
// Armed only inside the process whose script path equals GUARD_SCRIPT.
const fs = require('node:fs');
const path = require('node:path');
const append = fs.appendFileSync.bind(fs);
const trace = process.env.GUARD_TRACE;
const script = process.env.GUARD_SCRIPT;
const same = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();

if (trace && script && process.argv[1] && same(process.argv[1], script)) {
  const record = (event) => append(trace, JSON.stringify(event) + '\n');
  record({ kind: 'armed', pid: process.pid, argv1: process.argv[1], cwd: process.cwd() });

  const caller = () => {
    const lines = String(new Error().stack).split('\n').slice(3);
    const hit = lines.find(l => !l.includes('node:') && !l.includes('spawn-preload'));
    return (hit || lines[0] || '').trim();
  };
  const cp = require('node:child_process');
  for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) {
    const original = cp[name];
    cp[name] = function wrapped(...args) {
      record({ kind: 'spawn', api: name, file: String(args[0]), args: Array.isArray(args[1]) ? args[1] : [], from: caller() });
      return original.apply(this, args);
    };
  }
  const Module = require('node:module');
  const load = Module._load;
  Module._load = function patched(request, parent, ...rest) {
    const bare = String(request).replace(/^node:/, '');
    if (bare === 'child_process' || bare === 'cluster' || bare === 'worker_threads') {
      record({ kind: 'load', request: bare, parent: parent && parent.filename ? parent.filename : null });
    }
    return load.call(this, request, parent, ...rest);
  };
}
