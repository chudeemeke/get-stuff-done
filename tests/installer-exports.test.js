/**
 * Installer Export Tests
 *
 * Verifies that bin/install.js exports safety functions and constants
 * for unit testing, and that requiring the module produces no side effects.
 */

const { test, describe, expect } = require('bun:test');

describe('bin/install.js module exports', { timeout: 15000 }, () => {
  test('exports all 6 safety functions', () => {
    const mod = require('../bin/install.js');
    const expectedFunctions = [
      'readInstalledManifest',
      'removeGsdFiles',
      'detectV2',
      'isSafeToClean',
      'parseConfigDir',
      'resolveTargetDir',
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
    const result = execSync(
      'node -e "require(\'./bin/install.js\')"',
      {
        cwd: require('path').join(__dirname, '..'),
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
      }
    );
    expect(result).toBe('');
  });

  test('stale src/ fingerprint test is removed from installer-v3.test.js', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, 'installer-v3.test.js'),
      'utf-8'
    );
    expect(content).not.toContain('detects v2.x via src/ directory fingerprint');
  });
});
