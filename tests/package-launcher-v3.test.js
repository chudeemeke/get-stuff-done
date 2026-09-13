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
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runWithTimeout } = require('./helpers');
const {
  getActivePackageName,
  getActivePackageVersion,
  readAuthorityContract,
} = require('../scripts/lib/upstream-source');

const PROJECT_ROOT = path.join(__dirname, '..');
const GSD_PATH = path.join(PROJECT_ROOT, 'bin', 'gsd.js');
const FAKE_CLAUDE_SENTINEL = 'FAKE_CLAUDE_WAS_LAUNCHED';

function readPackageJson() {
  return JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8'));
}

function readAuthority() {
  return readAuthorityContract({ projectRoot: PROJECT_ROOT });
}

function hashOverlayManifest() {
  const manifestPath = path.join(PROJECT_ROOT, 'dist', '.overlay-manifest.json');
  const manifest = fs.readFileSync(manifestPath);
  return crypto.createHash('sha256').update(manifest).digest('hex');
}

function createFakeClaudeDir(tmpRoot) {
  const binDir = path.join(tmpRoot, 'bin');
  fs.mkdirSync(binDir, { recursive: true });

  const posixLauncher = path.join(binDir, 'claude');
  fs.writeFileSync(
    posixLauncher,
    `#!/bin/sh\necho ${FAKE_CLAUDE_SENTINEL}\nexit 47\n`,
    'utf-8'
  );
  fs.chmodSync(posixLauncher, 0o755);

  fs.writeFileSync(
    path.join(binDir, 'claude.cmd'),
    `@echo off\r\necho ${FAKE_CLAUDE_SENTINEL}\r\nexit /b 47\r\n`,
    'utf-8'
  );

  return binDir;
}

function runLauncher(args) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-launcher-version-'));
  const fakeClaudeDir = createFakeClaudeDir(tmpRoot);

  try {
    return runWithTimeout(process.execPath, [GSD_PATH, ...args], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 15000,
      env: {
        ...process.env,
        PATH: `${fakeClaudeDir}${path.delimiter}${process.env.PATH || ''}`,
        GSD_HOME: path.join(tmpRoot, 'gsd-home'),
        CLAUDE_CONFIG_DIR: path.join(tmpRoot, 'claude-home'),
      },
    });
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

describe('v3.0 package configuration', () => {
  test('package.json files array contains exactly the v3.0 entries', () => {
    const pkg = readPackageJson();
    expect(pkg.files).toEqual([
      'dist',
      'bin',
      'overlay/branding.json',
      'overlay/features.json',
      'scripts/check-overrides.js',
      'scripts/lib/package-provenance.js',
      'scripts/lib/upstream-source.js',
      'scripts/preview-update.js',
    ]);
  });

  test('package.json prepublishOnly equals "bun run dist"', () => {
    const pkg = readPackageJson();
    expect(pkg.scripts.prepublishOnly).toBe('bun run dist');
  });
});

describe('v3.0 launcher imports', () => {
  test('bin/gsd.js contains require for dist/src/platform/paths as primary import', () => {
    const content = fs.readFileSync(GSD_PATH, 'utf-8');
    expect(content).toContain("'../dist/src/platform/paths'");
  });

  test('bin/gsd.js contains require for dist/src/platform/terminal as primary import', () => {
    const content = fs.readFileSync(GSD_PATH, 'utf-8');
    expect(content).toContain("'../dist/src/platform/terminal'");
  });

  test('bin/gsd.js contains require for dist/src/config/ConfigLoader as primary import', () => {
    const content = fs.readFileSync(GSD_PATH, 'utf-8');
    expect(content).toContain("'../dist/src/config/ConfigLoader'");
  });

  test('bin/gsd.js contains fallback to overlay/src/platform/paths', () => {
    const content = fs.readFileSync(GSD_PATH, 'utf-8');
    expect(content).toContain("'../overlay/src/platform/paths'");
  });

  test('bin/gsd.js --help exits without MODULE_NOT_FOUND', { timeout: 15000 }, () => {
    const result = runWithTimeout(process.execPath, [GSD_PATH, '--help'], {
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

describe('runtime package provenance output', () => {
  test('bin/gsd.js --version prints fork and upstream provenance without launching claude', { timeout: 20000 }, () => {
    const pkg = readPackageJson();
    const authority = readAuthority();
    const result = runLauncher(['--version']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(pkg.name);
    expect(result.stdout).toContain(pkg.version);
    expect(result.stdout).toContain(getActivePackageName(authority));
    expect(result.stdout).not.toContain('Project state:');
    expect(result.stdout).not.toContain(FAKE_CLAUDE_SENTINEL);
    expect(result.stderr).not.toContain(FAKE_CLAUDE_SENTINEL);
  });

  test('bin/gsd.js --version --json emits parseable package provenance', { timeout: 20000 }, () => {
    const pkg = readPackageJson();
    const authority = readAuthority();
    const result = runLauncher(['--version', '--json']);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).not.toContain(FAKE_CLAUDE_SENTINEL);

    const provenance = JSON.parse(result.stdout);
    expect(Object.keys(provenance).sort()).toEqual([
      'forkPackage',
      'forkVersion',
      'overlayManifestSha256',
      'packageName',
      'upstreamPackage',
      'upstreamVersion',
      'version',
    ]);
    expect(provenance.forkPackage).toBe(pkg.name);
    expect(provenance.forkVersion).toBe(pkg.version);
    expect(provenance.packageName).toBe(pkg.name);
    expect(provenance.version).toBe(pkg.version);
    expect(provenance.upstreamPackage).toBe(getActivePackageName(authority));
    expect(provenance.upstreamVersion).toBe(getActivePackageVersion(authority));
    expect(provenance.overlayManifestSha256).toBe(hashOverlayManifest());
    expect(provenance.overlayManifestSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  test('test source covers the machine-readable provenance contract', () => {
    const content = fs.readFileSync(__filename, 'utf-8');
    expect(content).toContain('overlayManifestSha256');
    expect(content).toContain('--version --json');
  });
});
