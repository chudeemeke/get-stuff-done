'use strict';

const { describe, test, expect } = require('./helpers/portable-test-api');
const { createTempDir, SUBPROCESS_TIMEOUT } = require('./helpers');
const { runWithTimeout } = require('./helpers/subprocess-with-timeout');
const fs = require('fs');
const path = require('path');

const installer = path.join(__dirname, '..', 'bin', 'install.js');

function invoke(tmp, args) {
  const home = path.join(tmp.path, 'home');
  fs.mkdirSync(home, { recursive: true });
  return runWithTimeout('node', [installer, ...args], {
    encoding: 'utf8', timeout: SUBPROCESS_TIMEOUT,
    env: {
      ...process.env,
      HOME: home, USERPROFILE: home, GSD_HOME: path.join(home, '.gsd'),
      CLAUDE_CONFIG_DIR: path.join(home, '.claude'), CODEX_HOME: path.join(home, '.codex'),
      XDG_CONFIG_HOME: path.join(home, '.config'),
    },
  });
}

describe('installer CLI safety', { timeout: SUBPROCESS_TIMEOUT }, () => {
  test('unsupported --all refuses before legacy cleanup can remove owner content', () => {
    const tmp = createTempDir();
    try {
      const target = path.join(tmp.path, 'runtime with spaces');
      fs.mkdirSync(path.join(target, 'get-stuff-done'), { recursive: true });
      const ownerFile = path.join(target, 'get-stuff-done/owner.md');
      fs.writeFileSync(ownerFile, 'owner legacy changes');
      const result = invoke(tmp, ['--all', '--global', '--config-dir', target]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('--all is not supported transactionally');
      expect(fs.readFileSync(ownerFile, 'utf8')).toBe('owner legacy changes');
      expect(fs.readdirSync(target)).toEqual(['get-stuff-done']);
    } finally { tmp.cleanup(); }
  });

  test('CLI uninstall refuses the isolated home without deleting its inventory', () => {
    const tmp = createTempDir();
    try {
      const target = path.join(tmp.path, 'home');
      fs.mkdirSync(target);
      fs.writeFileSync(path.join(target, 'owner.txt'), 'owner bytes');
      fs.writeFileSync(path.join(target, 'gsd-file-manifest.json'), JSON.stringify({ files: { 'owner.txt': 'hash' } }));
      const result = invoke(tmp, ['--claude', '--global', '--config-dir', target, '--uninstall']);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('target is home directory');
      expect(fs.readFileSync(path.join(target, 'owner.txt'), 'utf8')).toBe('owner bytes');
      expect(fs.existsSync(path.join(target, 'gsd-file-manifest.json'))).toBe(true);
    } finally { tmp.cleanup(); }
  });

  test('corrupt overlay ownership refuses legacy install before cleanup or upstream writes', () => {
    const tmp = createTempDir();
    try {
      const target = path.join(tmp.path, 'target with spaces');
      fs.mkdirSync(path.join(target, 'get-stuff-done'), { recursive: true });
      const original = {
        '.overlay-manifest.json': '{ invalid overlay ownership',
        'get-stuff-done/.install-meta.json': '{"version":"2.5.0"}',
        'get-stuff-done/owner.md': 'owner changes inside legacy tree',
        'settings.json': '{"owner":true}',
      };
      for (const [name, bytes] of Object.entries(original)) fs.writeFileSync(path.join(target, name), bytes);
      const result = invoke(tmp, ['--claude', '--global', '--config-dir', target]);
      expect(result.timedOut).toBe(false);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('.overlay-manifest.json');
      for (const [name, bytes] of Object.entries(original)) expect(fs.readFileSync(path.join(target, name), 'utf8')).toBe(bytes);
      expect(fs.readdirSync(target).sort()).toEqual(['.overlay-manifest.json', 'get-stuff-done', 'settings.json']);
    } finally { tmp.cleanup(); }
  });

  test('corrupt installed ownership refuses uninstall without removing owner or legacy files', () => {
    const tmp = createTempDir();
    try {
      const target = path.join(tmp.path, 'target with spaces');
      fs.mkdirSync(path.join(target, 'get-stuff-done'), { recursive: true });
      const original = {
        'gsd-file-manifest.json': '{ invalid ownership',
        'get-stuff-done/owner.md': 'owner changes inside legacy tree',
        'package.json': '{"name":"owner-package"}',
        'settings.json': '{"owner":true}',
      };
      for (const [name, bytes] of Object.entries(original)) fs.writeFileSync(path.join(target, name), bytes);
      const result = invoke(tmp, ['--claude', '--global', '--config-dir', target, '--uninstall']);
      expect(result.timedOut).toBe(false);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('gsd-file-manifest.json');
      for (const [name, bytes] of Object.entries(original)) expect(fs.readFileSync(path.join(target, name), 'utf8')).toBe(bytes);
    } finally { tmp.cleanup(); }
  });

  for (const flag of ['--help', '-h']) {
    test(`${flag} documents the public installer without creating a runtime`, () => {
      const tmp = createTempDir();
      try {
        const result = invoke(tmp, [flag]);
        expect(result.status).toBe(0);
        expect(result.stdout).toContain('--config-dir');
        expect(result.stdout).toContain('--uninstall');
        expect(fs.existsSync(path.join(tmp.path, 'home/.claude'))).toBe(false);
      } finally { tmp.cleanup(); }
    });
  }

  test('CLI uninstall is idempotent and preserves untracked owner files', () => {
    const tmp = createTempDir();
    try {
      const target = path.join(tmp.path, 'target');
      const args = ['--claude', '--global', '--config-dir', target, '--uninstall'];
      const missing = invoke(tmp, args);
      expect(missing.status).toBe(0);
      expect(missing.stdout).toContain('Nothing to uninstall');
      fs.mkdirSync(path.join(target, 'hooks'), { recursive: true });
      fs.writeFileSync(path.join(target, 'hooks/gsd-test.js'), 'generated');
      fs.writeFileSync(path.join(target, 'owner.txt'), 'owner');
      fs.writeFileSync(path.join(tmp.path, 'outside.txt'), 'outside');
      fs.writeFileSync(path.join(target, 'gsd-file-manifest.json'), JSON.stringify({
        files: { 'hooks/gsd-test.js': 'hash', '../outside.txt': 'invalid' },
      }));
      const first = invoke(tmp, args);
      expect(first.status).toBe(0);
      expect(first.stdout).toContain('1 skipped');
      expect(fs.existsSync(path.join(target, 'hooks/gsd-test.js'))).toBe(false);
      expect(fs.readFileSync(path.join(target, 'owner.txt'), 'utf8')).toBe('owner');
      expect(fs.readFileSync(path.join(tmp.path, 'outside.txt'), 'utf8')).toBe('outside');
      const second = invoke(tmp, args);
      expect(second.status).toBe(0);
      expect(fs.readFileSync(path.join(target, 'owner.txt'), 'utf8')).toBe('owner');
    } finally { tmp.cleanup(); }
  });

  // The outer test must allow the existing 30-second real-installer budget.
  test('real install and uninstall preserve owner script helpers without claiming them', { timeout: SUBPROCESS_TIMEOUT }, () => {
    const tmp = createTempDir();
    try {
      const target = path.join(tmp.path, 'runtime with spaces');
      const ownerFiles = ['scripts/lib/owner helper.cjs', 'scripts/changeset/owner check.cjs'];
      for (const name of ownerFiles) {
        const file = path.join(target, name);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, 'owner:' + name);
      }
      const args = ['--claude', '--global', '--config-dir', target];
      const installed = invoke(tmp, args);
      expect({ status: installed.status, stderr: installed.stderr, timedOut: installed.timedOut }).toEqual({
        status: 0, stderr: '', timedOut: false,
      });
      const manifest = JSON.parse(fs.readFileSync(path.join(target, 'gsd-file-manifest.json'), 'utf8'));
      for (const name of ownerFiles) expect(Object.hasOwn(manifest.files, name)).toBe(false);
      for (const group of ['changeset', 'lib']) {
        const source = path.join(__dirname, '../dist/scripts', group);
        for (const file of fs.readdirSync(source)) {
          if (fs.statSync(path.join(source, file)).isFile()) {
            expect(Object.hasOwn(manifest.files, `scripts/${group}/${file}`)).toBe(true);
          }
        }
      }
      const managed = Object.keys(manifest.files).filter(name => /^scripts\/(lib|changeset)\//.test(name));
      expect(managed.length).toBeGreaterThan(0);
      const removed = invoke(tmp, [...args, '--uninstall']);
      expect(removed.status).toBe(0);
      for (const name of ownerFiles) expect(fs.readFileSync(path.join(target, name), 'utf8')).toBe('owner:' + name);
      for (const name of managed) expect(fs.existsSync(path.join(target, name))).toBe(false);
    } finally { tmp.cleanup(); }
  });

  test('real CLI migration preserves owner content and installs composed metadata', { timeout: SUBPROCESS_TIMEOUT }, () => {
    const tmp = createTempDir();
    try {
      const target = path.join(tmp.path, 'target');
      fs.mkdirSync(path.join(target, 'get-stuff-done'), { recursive: true });
      fs.writeFileSync(path.join(target, 'get-stuff-done/.install-meta.json'), '{"version":"2.5.0"}');
      fs.writeFileSync(path.join(target, 'CLAUDE.md'), '# owner instructions');
      const result = invoke(tmp, ['--claude', '--global', '--config-dir', target]);
      expect({ status: result.status, stderr: result.stderr, timedOut: result.timedOut }).toEqual({
        status: 0, stderr: '', timedOut: false,
      });
      expect(result.stdout).toContain('Previous version: 2.5.0');
      expect(fs.readFileSync(path.join(target, 'CLAUDE.md'), 'utf8')).toBe('# owner instructions');
      const metadata = JSON.parse(fs.readFileSync(path.join(target, '.install-meta.json'), 'utf8'));
      expect(metadata.forkPackage).toBe('@chude/get-stuff-done');
      expect(metadata.upstreamPackage).toBe('@opengsd/gsd-core');
      expect(fs.existsSync(path.join(target, '.overlay-manifest.json'))).toBe(true);
    } finally { tmp.cleanup(); }
  });
});
