/**
 * v3.0 Package Configuration and Launcher Tests
 *
 * Tests for package.json v3.0 shipping configuration and bin/gsd.js
 * import paths for npm package compatibility with local dev fallback.
 *
 * Task 1 of 35-01:
 *   - package.json files array ships dist/, bin/, overlay manifests, and packaged runtime helpers
 *   - package.json prepublishOnly runs bun run dist
 *   - bin/gsd.js imports from dist/src/ with fallback to overlay/src/
 */

const { test, describe, expect } = require('bun:test');
const fs = require('fs');
const path = require('path');
const { runWithTimeout } = require('./helpers');

const PROJECT_ROOT = path.join(__dirname, '..');

describe('v3.0 package configuration', () => {
  test('package.json files array contains exactly the v3.0 entries', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8'));
    expect(pkg.files).toEqual([
      'dist',
      'bin',
      'overlay/branding.json',
      'overlay/features.json',
      'scripts/check-overrides.js',
      'scripts/lib/upstream-source.js',
      'scripts/preview-update.js',
    ]);
  });

  test('package.json prepublishOnly equals "bun run dist"', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8'));
    expect(pkg.scripts.prepublishOnly).toBe('bun run dist');
  });
});

describe('v3.0 launcher imports', () => {
  const gsdPath = path.join(PROJECT_ROOT, 'bin', 'gsd.js');

  test('bin/gsd.js contains require for dist/src/platform/paths as primary import', () => {
    const content = fs.readFileSync(gsdPath, 'utf-8');
    expect(content).toContain("'../dist/src/platform/paths'");
  });

  test('bin/gsd.js contains require for dist/src/platform/terminal as primary import', () => {
    const content = fs.readFileSync(gsdPath, 'utf-8');
    expect(content).toContain("'../dist/src/platform/terminal'");
  });

  test('bin/gsd.js contains require for dist/src/config/ConfigLoader as primary import', () => {
    const content = fs.readFileSync(gsdPath, 'utf-8');
    expect(content).toContain("'../dist/src/config/ConfigLoader'");
  });

  test('bin/gsd.js contains fallback to overlay/src/platform/paths', () => {
    const content = fs.readFileSync(gsdPath, 'utf-8');
    expect(content).toContain("'../overlay/src/platform/paths'");
  });

  test('bin/gsd.js --help exits without MODULE_NOT_FOUND', { timeout: 15000 }, () => {
    const result = runWithTimeout(process.execPath, [gsdPath, '--help'], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
    });

    if (result.status === 0) {
      expect(result.stdout.length).toBeGreaterThan(0);
    } else {
      expect(result.stderr).not.toContain('MODULE_NOT_FOUND');
      expect(result.stdout + result.stderr).not.toContain('Cannot find module');
    }
  });
});
