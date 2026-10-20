'use strict';

const { test, expect } = require('./helpers/portable-test-api');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const doctor = require('../scripts/gsd-doctor.cjs');

function fixture(number = '42') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-durability-'));
  const file = path.join(root, 'settings.json');
  const settings = { owner: '__NUMBER__', hooks: { PreToolUse: [{ hooks: [{ command: '& "C:/bunx" "C:/hook.js"' }] }] } };
  const raw = JSON.stringify(settings).replace('"__NUMBER__"', number);
  fs.writeFileSync(file, raw);
  return { root, file, raw, repair: () => doctor.repair({ settingsPath: file, inspectSecurity: () => {} }) };
}

for (const number of ['9007199254740993', '0.10000000000000001', '1e400', '1e-400', '-0']) {
  test(`refuses lossy unrelated JSON number ${number} without writing`, () => {
    const f = fixture(number);
    try {
      expect(() => f.repair()).toThrow(/number.*losslessly/i);
      expect(fs.readFileSync(f.file, 'utf8')).toBe(f.raw);
      expect(fs.readdirSync(f.root)).toEqual(['settings.json']);
    } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
  });
}

for (const number of ['42', '0.1000', '1.2e2', '0', '-2.5']) {
  test(`preserves ordinary JSON number ${number}`, () => {
    const f = fixture(number);
    try {
      expect(f.repair().changed).toBe(1);
      expect(JSON.parse(fs.readFileSync(f.file, 'utf8')).owner).toBe(Number(number));
    } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
  });
}

test('repaired hook command executes literal dollar, backtick and apostrophe paths', { timeout: 20000 }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-hook-'));
  try {
    const file = path.join(root, "owner's $literal `not-a-command` hook.js");
    fs.writeFileSync(file, "process.stdout.write('exact literal hook');");
    const fixed = doctor.repairCommand(`& "C:/bunx" "${file}"`);
    const result = spawnSync('bash', ['--noprofile', '--norc', '-c', fixed.after], { encoding: 'utf8', timeout: 15000 });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe('exact literal hook');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('failed backup writes never leave a published partial backup', () => {
  const f = fixture();
  const write = fs.writeFileSync;
  try {
    fs.writeFileSync = (file, value, ...args) => {
      write(file, String(value).slice(0, 8), ...args);
      throw new Error('backup storage full');
    };
    expect(() => f.repair()).toThrow('backup storage full');
    expect(fs.readFileSync(f.file, 'utf8')).toBe(f.raw);
    expect(fs.readdirSync(f.root)).toEqual(['settings.json']);
  } finally { fs.writeFileSync = write; fs.rmSync(f.root, { recursive: true, force: true }); }
});

test('a failed durability flush prevents settings replacement', () => {
  const f = fixture();
  const sync = fs.fsyncSync;
  try {
    fs.fsyncSync = () => { throw new Error('storage flush failed'); };
    expect(() => f.repair()).toThrow('storage flush failed');
    expect(fs.readFileSync(f.file, 'utf8')).toBe(f.raw);
  } finally { fs.fsyncSync = sync; fs.rmSync(f.root, { recursive: true, force: true }); }
});

test('incorrect staging permissions prevent backup publication', () => {
  const f = fixture();
  const fstat = fs.fstatSync;
  try {
    fs.fstatSync = fd => ({ ...fstat(fd), mode: 0 });
    expect(() => f.repair()).toThrow('permission verification failed');
    expect(fs.readFileSync(f.file, 'utf8')).toBe(f.raw);
    expect(fs.readdirSync(f.root)).toEqual(['settings.json']);
  } finally { fs.fstatSync = fstat; fs.rmSync(f.root, { recursive: true, force: true }); }
});
