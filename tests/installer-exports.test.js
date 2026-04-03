/**
 * Installer Export Tests
 *
 * Verifies that bin/install.js exports safety functions and constants
 * for unit testing, and that requiring the module produces no side effects.
 */

const { test, describe, expect } = require('bun:test');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('bin/install.js module exports', { timeout: 15000 }, () => {
  test('exports all 8 safety functions + uninstall', () => {
    const mod = require('../bin/install.js');
    const expectedFunctions = [
      'readInstalledManifest',
      'removeGsdFiles',
      'detectV2',
      'isSafeToClean',
      'parseConfigDir',
      'resolveTargetDir',
      'patchStatusLine',
      'uninstall',
    ];

    for (const fnName of expectedFunctions) {
      expect(typeof mod[fnName]).toBe('function');
    }
  });

  test('exports INSTALLED_MANIFEST_NAME constant', () => {
    const mod = require('../bin/install.js');
    expect(mod.INSTALLED_MANIFEST_NAME).toBe('gsd-file-manifest.json');
  });

  test('require() produces no stdout or stderr output', () => {
    const { execSync } = require('child_process');
    // Redirect stderr to a temp file so we can capture it separately
    const tmpStderr = path.join(os.tmpdir(), `gsd-stderr-${Date.now()}.txt`);
    try {
      const stdout = execSync(
        `node -e "require('./bin/install.js')" 2>"${tmpStderr}"`,
        {
          cwd: path.join(__dirname, '..'),
          encoding: 'utf-8',
          timeout: 10000,
        }
      );
      const stderr = fs.readFileSync(tmpStderr, 'utf-8');
      expect(stdout).toBe('');
      expect(stderr).toBe('');
    } finally {
      try { fs.unlinkSync(tmpStderr); } catch { /* ignore cleanup errors */ }
    }
  });

  test('stale src/ fingerprint test is removed from installer-v3.test.js', () => {
    const content = fs.readFileSync(
      path.join(__dirname, 'installer-v3.test.js'),
      'utf-8'
    );
    expect(content).not.toContain('detects v2.x via src/ directory fingerprint');
  });
});
