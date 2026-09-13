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
