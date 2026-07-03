/**
 * Installer Export Tests
 *
 * Verifies that bin/install.js exports safety functions and constants
 * for unit testing, and that requiring the module produces no side effects.
 */

const { test, describe, expect } = require('bun:test');
const fs = require('fs');
const path = require('path');
const { runWithTimeout, SUBPROCESS_TIMEOUT } = require('./helpers');

describe('bin/install.js module exports', { timeout: SUBPROCESS_TIMEOUT }, () => {
  test('exports all 10 safety functions + uninstall', () => {
    const mod = require('../bin/install.js');
    const expectedFunctions = [
      'readInstalledManifest',
      'removeGsdFiles',
      'detectV2',
      'isSafeToClean',
      'parseConfigDir',
      'resolveTargetDir',
      'patchStatusLine',
      'copyOverlayManifest',
      'cleanOrphanedPaths',
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
    const result = runWithTimeout(process.execPath, ['-e', "require('./bin/install.js')"], {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
      timeout: 10000,
    });
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
  });

  test('stale src/ fingerprint test is removed from installer-v3.test.js', () => {
    const content = fs.readFileSync(
      path.join(__dirname, 'installer-v3.test.js'),
      'utf-8'
    );
    expect(content).not.toContain('detects v2.x via src/ directory fingerprint');
  });
});
