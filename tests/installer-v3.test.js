/**
 * v3.0 Delegation Installer Tests
 *
 * Tests for the v3.0 bin/install.js delegation-based installer covering:
 *   INST-01: Subprocess delegation to upstream install.js
 *   INST-02: Overlay files copied to target after upstream install
 *   INST-03: .install-meta.json written with v3.0 format
 *   INST-04: --uninstall removes all files from target, idempotent
 *   INST-05: v2.x detection via meta check and directory fingerprint
 *
 * SAFETY: All tests install to temporary directories via --config-dir.
 * Real ~/.claude is never touched.
 */

const { test, describe, beforeAll, afterAll, beforeEach, afterEach, expect } = require('bun:test');
const fs = require('fs');
const path = require('path');

const { createTempDir, runWithTimeout } = require('./helpers');
const { compose } = require('../scripts/compose');

// Paths
const PROJECT_ROOT = path.join(__dirname, '..');
const INSTALL_SCRIPT = path.join(PROJECT_ROOT, 'bin', 'install.js');
const PACKAGE_JSON = path.join(PROJECT_ROOT, 'package.json');

let installerPackage;

function createInstallerPackageFixture() {
  const tmp = createTempDir();
  const packageRoot = tmp.path;
  const distDir = path.join(packageRoot, 'dist');
  const installScript = path.join(packageRoot, 'bin', 'install.js');

  fs.mkdirSync(path.dirname(installScript), { recursive: true });
  fs.copyFileSync(INSTALL_SCRIPT, installScript);
  fs.copyFileSync(PACKAGE_JSON, path.join(packageRoot, 'package.json'));
  compose({ distDir });

  return {
    cleanup: tmp.cleanup,
    distDir,
    installScript,
    overlayManifest: path.join(distDir, '.overlay-manifest.json'),
  };
}

/**
 * Runs the v3.0 installer with --config-dir for test isolation.
 *
 * @param {string} targetDir - Installation target directory (--config-dir value)
 * @param {string[]} extraArgs - Additional CLI args
 * @returns {{ success: boolean, output: string, error: string, exitCode: number }}
 */
function runV3Installer(targetDir, extraArgs = []) {
  const args = ['--claude', '--global', '--config-dir', targetDir, ...extraArgs];
  const result = runWithTimeout(process.execPath, [installerPackage.installScript, ...args], {
    encoding: 'utf-8',
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 30000,
  });

  return {
    success: result.status === 0 && !result.timedOut,
    output: result.stdout,
    error: result.stderr || result.error?.message || '',
    exitCode: result.status || 1,
  };
}

describe('v3.0 Delegation Installer', () => {
  let tmpDir;
  let cleanupTmp;

  beforeAll(() => {
    installerPackage = createInstallerPackageFixture();
  }, 30000);

  afterAll(() => {
    installerPackage.cleanup();
  }, 30000);

  beforeEach(() => {
    const tmp = createTempDir();
    tmpDir = tmp;
    cleanupTmp = tmp.cleanup;
  }, 30000);

  afterEach(() => {
    cleanupTmp();
  }, 30000);

  // -----------------------------------------------------------------------
  // Pre-condition: overlay manifest exists
  // -----------------------------------------------------------------------

  test('pre-condition: dist/.overlay-manifest.json exists', () => {
    expect(fs.existsSync(installerPackage.overlayManifest)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(installerPackage.overlayManifest, 'utf-8'));
    expect(Array.isArray(manifest)).toBe(true);
    expect(manifest.length).toBeGreaterThan(0);
  });

  // -----------------------------------------------------------------------
  // INST-01: Subprocess delegation
  // -----------------------------------------------------------------------

  describe('INST-01: subprocess delegation', () => {
    test('delegates to upstream and produces installed file structure', { timeout: 30000 }, () => {
      const targetDir = path.join(tmpDir.path, 'target');
      fs.mkdirSync(targetDir, { recursive: true });

      const result = runV3Installer(targetDir);

      // v3.0 installer must delegate to upstream and exit 0
      expect(result.success).toBe(true);

      // Upstream files must exist in target (Open GSD writes gsd-core/ as its package root)
      expect(fs.existsSync(path.join(targetDir, 'gsd-core'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'commands', 'gsd'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'agents'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'hooks'))).toBe(true);
    });

    test('passes all user flags through to upstream', { timeout: 30000 }, () => {
      const targetDir = path.join(tmpDir.path, 'target');
      fs.mkdirSync(targetDir, { recursive: true });

      // Running with --claude --global should produce claude-specific install
      const result = runV3Installer(targetDir);
      expect(result.success).toBe(true);

      // commands/gsd/ directory is created by upstream for claude runtime
      expect(fs.existsSync(path.join(targetDir, 'commands', 'gsd'))).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // INST-02: Overlay files copied
  // -----------------------------------------------------------------------

  describe('INST-02: overlay files copied', () => {
    test('overlay-only files exist in target after install', { timeout: 30000 }, () => {
      const targetDir = path.join(tmpDir.path, 'target');
      fs.mkdirSync(targetDir, { recursive: true });

      const result = runV3Installer(targetDir);
      expect(result.success).toBe(true);

      // Read the manifest to know which files should be there
      const manifest = JSON.parse(fs.readFileSync(installerPackage.overlayManifest, 'utf-8'));

      // Check representative overlay files
      const representativeFiles = [
        'lib/sync.cjs',
        'src/config/ConfigLoader.js',
        'src/platform/detect.js',
        'hooks/pre-compact.js',
        'CREDITS.md',
      ];

      for (const relPath of representativeFiles) {
        // File must be in the manifest
        expect(manifest).toContain(relPath);
        // File must exist in the target directory
        expect(fs.existsSync(path.join(targetDir, relPath))).toBe(true);
      }
    });

    test('all manifest files are copied to target', { timeout: 30000 }, () => {
      const targetDir = path.join(tmpDir.path, 'target');
      fs.mkdirSync(targetDir, { recursive: true });

      const result = runV3Installer(targetDir);
      expect(result.success).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(installerPackage.overlayManifest, 'utf-8'));

      for (const relPath of manifest) {
        expect(fs.existsSync(path.join(targetDir, relPath))).toBe(true);
      }
    });
  });

  // -----------------------------------------------------------------------
  // INST-03: .install-meta.json written
  // -----------------------------------------------------------------------

  describe('INST-03: .install-meta.json written', () => {
    test('writes v3.0 format install metadata', { timeout: 30000 }, () => {
      const targetDir = path.join(tmpDir.path, 'target');
      fs.mkdirSync(targetDir, { recursive: true });

      const result = runV3Installer(targetDir);
      expect(result.success).toBe(true);

      // .install-meta.json should be written at the target root for the composed install
      const metaPath = path.join(targetDir, '.install-meta.json');
      expect(fs.existsSync(metaPath)).toBe(true);

      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

      // Required v3.0 fields
      expect(typeof meta.upstream_version).toBe('string');
      expect(meta.upstream_version.length).toBeGreaterThan(0);
      expect(typeof meta.overlay_version).toBe('string');
      expect(meta.overlay_version.length).toBeGreaterThan(0);
      expect(typeof meta.installed_at).toBe('string');
      // ISO timestamp format check
      expect(new Date(meta.installed_at).toISOString()).toBe(meta.installed_at);
      expect(Array.isArray(meta.features_disabled)).toBe(true);
      expect(Array.isArray(meta.overrides_applied)).toBe(true);
    });

    test('upstream_version matches dist metadata', { timeout: 30000 }, () => {
      const targetDir = path.join(tmpDir.path, 'target');
      fs.mkdirSync(targetDir, { recursive: true });

      const result = runV3Installer(targetDir);
      expect(result.success).toBe(true);

      const distMeta = JSON.parse(fs.readFileSync(path.join(installerPackage.distDir, '.install-meta.json'), 'utf-8'));
      const metaPath = path.join(targetDir, '.install-meta.json');
      const installedMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

      expect(installedMeta.upstream_version).toBe(distMeta.upstream_version);
    });
  });

  // -----------------------------------------------------------------------
  // INST-04: Uninstall
  // -----------------------------------------------------------------------

  describe('INST-04: --uninstall', () => {
    test('removes installed files and exits 0', { timeout: 30000 }, () => {
      const targetDir = path.join(tmpDir.path, 'target');
      fs.mkdirSync(targetDir, { recursive: true });

      // First install
      const installResult = runV3Installer(targetDir);
      expect(installResult.success).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'gsd-core'))).toBe(true);

      // Then uninstall
      const uninstallResult = runV3Installer(targetDir, ['--uninstall']);
      expect(uninstallResult.success).toBe(true);

      // GSD-owned files should be removed. settings.json is preserved as user content.
      if (fs.existsSync(targetDir)) {
        const remaining = fs.readdirSync(targetDir);
        expect(remaining).toEqual(['settings.json']);
      }
    });

    test('idempotent: uninstall on empty dir exits 0', { timeout: 30000 }, () => {
      const targetDir = path.join(tmpDir.path, 'empty-target');
      // Dir does not exist -- uninstall should still exit 0
      const result = runV3Installer(targetDir, ['--uninstall']);
      expect(result.success).toBe(true);
    });

    test('idempotent: double uninstall exits 0', { timeout: 30000 }, () => {
      const targetDir = path.join(tmpDir.path, 'target');
      fs.mkdirSync(targetDir, { recursive: true });

      // Install then uninstall twice
      const installResult = runV3Installer(targetDir);
      expect(installResult.success).toBe(true);

      const first = runV3Installer(targetDir, ['--uninstall']);
      expect(first.success).toBe(true);

      const second = runV3Installer(targetDir, ['--uninstall']);
      expect(second.success).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // INST-05: v2.x detection
  // -----------------------------------------------------------------------

  describe('INST-05: v2.x detection', () => {
    test('detects v2.x via .install-meta.json (no overlay_version)', { timeout: 30000 }, () => {
      const targetDir = path.join(tmpDir.path, 'target');

      // Create mock v2.x installation
      const gsdDir = path.join(targetDir, 'get-stuff-done');
      fs.mkdirSync(gsdDir, { recursive: true });
      fs.writeFileSync(
        path.join(gsdDir, '.install-meta.json'),
        JSON.stringify({
          version: '2.4.0',
          installType: 'link',
          installedAt: new Date().toISOString(),
          platform: { os: 'win32', arch: 'x64' },
          installMethod: { method: 'junction', reason: 'default' },
        }),
        'utf-8'
      );

      // Run v3.0 installer -- v2.x auto-cleaned without prompt
      const result = runV3Installer(targetDir, []);
      expect(result.success).toBe(true);

      // v2.x files should be cleaned up -- get-stuff-done/ should be gone
      expect(fs.existsSync(gsdDir)).toBe(false);

      // v3.0 files should be installed
      expect(fs.existsSync(path.join(targetDir, 'gsd-core'))).toBe(true);

      // Auto-clean output contains migration banner
      expect(result.output).toContain('Upgrading from v2.x to v3.0');
    });

    test('detects v2.x via get-stuff-done/ without Open GSD root/', { timeout: 30000 }, () => {
      const targetDir = path.join(tmpDir.path, 'target');

      // Create mock v2.x installation with old directory name
      const gsdDir = path.join(targetDir, 'get-stuff-done');
      fs.mkdirSync(path.join(gsdDir, 'bin'), { recursive: true });
      fs.writeFileSync(path.join(gsdDir, 'bin', 'gsd-tools.cjs'), '// v2.x tools');

      // Run v3.0 installer -- v2.x auto-cleaned without prompt
      const result = runV3Installer(targetDir, []);
      expect(result.success).toBe(true);

      // v2.x directory should be cleaned up
      expect(fs.existsSync(gsdDir)).toBe(false);

      // v3.0 files should be installed
      expect(fs.existsSync(path.join(targetDir, 'gsd-core'))).toBe(true);
    });

    test('--force suppresses migration banner (quiet mode)', { timeout: 30000 }, () => {
      const targetDir = path.join(tmpDir.path, 'target');

      // Create mock v2.x installation
      const gsdDir = path.join(targetDir, 'get-stuff-done');
      fs.mkdirSync(gsdDir, { recursive: true });
      fs.writeFileSync(
        path.join(gsdDir, '.install-meta.json'),
        JSON.stringify({ version: '2.4.0', installType: 'link' }),
        'utf-8'
      );

      // Run with --force (quiet mode)
      const result = runV3Installer(targetDir, ['--force']);
      expect(result.success).toBe(true);

      // Banner should NOT appear in quiet mode
      expect(result.output).not.toContain('Upgrading from v2.x to v3.0');

      // v3.0 files should still be installed
      expect(fs.existsSync(path.join(targetDir, 'gsd-core'))).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // INST-05b: Negative detection tests
  // -----------------------------------------------------------------------

  describe('INST-05b: negative v2.x detection', () => {
    test('does NOT detect v2.x for fresh empty directory', { timeout: 30000 }, () => {
      const targetDir = path.join(tmpDir.path, 'fresh-target');
      fs.mkdirSync(targetDir, { recursive: true });

      const result = runV3Installer(targetDir, []);
      expect(result.success).toBe(true);
      // Should NOT contain cleanup messages -- it is not v2.x
      expect(result.output).not.toContain('Upgrading from v2.x');
    });

    test('does NOT detect v2.x for v3.0 installation', { timeout: 30000 }, () => {
      const targetDir = path.join(tmpDir.path, 'v3-target');
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(
        path.join(targetDir, '.install-meta.json'),
        JSON.stringify({ overlay_version: '3.0.0', version: '3.0.0' }),
        'utf-8'
      );

      const result = runV3Installer(targetDir, []);
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('Upgrading from v2.x');
    });
  });

  // -----------------------------------------------------------------------
  // INST-05c: Safety guard
  // -----------------------------------------------------------------------

  describe('INST-05c: safety guard (isSafeToClean)', () => {
    // The safety guard (isSafeToClean) in install.js prevents cleanupV2 from
    // deleting dangerous targets like home directory, filesystem root, or
    // shallow paths. These are verified by code inspection (grep) rather than
    // runtime execution, since actually pointing the installer at os.homedir()
    // or '/' would be destructive. The guard is tested structurally below.

    test('safety guard function exists in install.js', () => {
      const installSrc = fs.readFileSync(
        path.join(PROJECT_ROOT, 'bin', 'install.js'),
        'utf-8'
      );
      expect(installSrc).toContain('isSafeToClean');
      expect(installSrc).toContain('target is home directory');
      expect(installSrc).toContain('target is filesystem root');
      expect(installSrc).toContain('target path too shallow');
    });

    test('readline is not imported in install.js', () => {
      const installSrc = fs.readFileSync(
        path.join(PROJECT_ROOT, 'bin', 'install.js'),
        'utf-8'
      );
      expect(installSrc).not.toContain("require('readline')");
    });

    test('askConfirmation function does not exist in install.js', () => {
      const installSrc = fs.readFileSync(
        path.join(PROJECT_ROOT, 'bin', 'install.js'),
        'utf-8'
      );
      expect(installSrc).not.toContain('askConfirmation');
    });
  });
});
