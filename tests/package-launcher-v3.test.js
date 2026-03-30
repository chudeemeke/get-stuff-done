/**
 * v3.0 Package Configuration and Launcher Tests
 *
 * Tests for package.json v3.0 shipping configuration and bin/gsd.js
 * import paths for npm package compatibility with local dev fallback.
 *
 * Task 1 of 35-01:
 *   - package.json files array ships dist/, bin/, overlay/branding.json, overlay/features.json
 *   - package.json prepublishOnly runs bun run compose
 *   - bin/gsd.js imports from dist/src/ with fallback to overlay/src/
 */

const { test, describe, expect } = require('bun:test');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');

describe('v3.0 package configuration', () => {
  test('package.json files array contains exactly the v3.0 entries', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8'));
    expect(pkg.files).toEqual(['dist', 'bin', 'overlay/branding.json', 'overlay/features.json']);
  });

  test('package.json prepublishOnly equals "bun run compose"', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8'));
    expect(pkg.scripts.prepublishOnly).toBe('bun run compose');
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
    try {
      const result = execSync(`node "${gsdPath}" --help`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
      });
      // Should produce output without error
      expect(result.length).toBeGreaterThan(0);
    } catch (err) {
      // If it exits non-zero, check it's not MODULE_NOT_FOUND
      const stderr = err.stderr?.toString() || '';
      const stdout = err.stdout?.toString() || '';
      expect(stderr).not.toContain('MODULE_NOT_FOUND');
      expect(stdout + stderr).not.toContain('Cannot find module');
    }
  });
});
