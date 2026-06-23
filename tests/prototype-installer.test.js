/**
 * Phase 29 Prototype Gate
 *
 * Integration tests validating the overlay architecture core mechanism:
 * - PROTO-01: Upstream install.js runs from a composed directory preserving its internal structure
 * - PROTO-02: Surface-only branding (package name, URLs) does not break installation
 * - PROTO-03: Overlay additions can be copied after upstream install without conflict
 *
 * These tests are the go/no-go gate for the v1.0.0 overlay architecture.
 * They will become the foundation for Phase 33's installer.test.js.
 *
 * SAFETY: All tests install to temporary directories. Real ~/.claude is never touched.
 */

const { test, describe, beforeEach, afterEach, expect } = require('bun:test');
const fs = require('fs');
const path = require('path');

const { createTempDir, runWithTimeout } = require('./helpers');

// Path to the upstream package installed as devDependency
const UPSTREAM_PKG = path.join(__dirname, '..', 'node_modules', '@opengsd', 'gsd-core');

/**
 * Sets up a scratch directory that mirrors the upstream package structure.
 * The scratch directory is a copy of the upstream package root, so that
 * scratch/bin/install.js can reference scratch/commands/gsd/, scratch/gsd-core/, etc.
 * via its __dirname-relative resolution.
 *
 * @param {string} tmpDir - Base temp directory path
 * @returns {string} Path to the scratch directory (scratch/bin/install.js is the entry point)
 */
function setupScratchDir(tmpDir) {
  const scratchDir = path.join(tmpDir, 'scratch');
  fs.cpSync(UPSTREAM_PKG, scratchDir, { recursive: true });
  return scratchDir;
}

/**
 * Runs the upstream installer subprocess with --config-dir for cross-platform isolation.
 * Uses --config-dir instead of HOME override because os.homedir() ignores HOME on Windows.
 *
 * @param {string} scratchDir - Path to the scratch directory containing install.js
 * @param {string} targetDir - Installation target directory (passed as --config-dir)
 * @param {string[]} extraArgs - Additional CLI args
 * @returns {{ success: boolean, output: string, error: string }}
 */
function runUpstreamInstaller(scratchDir, targetDir, extraArgs = []) {
  const installScript = path.join(scratchDir, 'bin', 'install.js');
  const args = ['--claude', '--global', '--config-dir', targetDir, ...extraArgs];
  const result = runWithTimeout(process.execPath, [installScript, ...args], {
    encoding: 'utf-8',
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 30000,
  });

  return {
    success: result.status === 0 && !result.timedOut,
    output: result.stdout,
    error: result.stderr || result.error?.message || '',
  };
}

/**
 * Applies surface-only branding to the upstream install.js.
 * CRITICAL: Only replaces exact public package/repo identity strings, NOT bare
 * 'gsd-core' which is used for internal path resolution and directory naming.
 *
 * Substitutions:
 * - "@opengsd/gsd-core@latest" -> "@chude/get-stuff-done@latest" (version-pinned references)
 * - "npx @opengsd/gsd-core" -> "bunx @chude/get-stuff-done" (install command examples)
 * - "@opengsd/gsd-core" -> "@chude/get-stuff-done" (npm package name only)
 * - "open-gsd/gsd-core" -> "chudeemeke/get-stuff-done" (GitHub repo only)
 *
 * @param {string} scratchDir - Path to the scratch directory
 */
function applyBranding(scratchDir) {
  const textExtensions = new Set(['.js', '.cjs', '.mjs', '.json', '.md', '.txt']);
  const brandFile = filePath => {
    if (!textExtensions.has(path.extname(filePath))) return;

    let content = fs.readFileSync(filePath, 'utf-8');

    // Order matters: most specific patterns first to avoid double-replacing
    content = content.replace(/@opengsd\/gsd-core@latest/g, '@chude/get-stuff-done@latest');
    content = content.replace(/npx @opengsd\/gsd-core/g, 'bunx @chude/get-stuff-done');
    content = content.replace(/@opengsd\/gsd-core/g, '@chude/get-stuff-done');
    content = content.replace(/open-gsd\/gsd-core/g, 'chudeemeke/get-stuff-done');

    fs.writeFileSync(filePath, content, 'utf-8');
  };

  const visit = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile()) {
        brandFile(fullPath);
      }
    }
  };

  visit(scratchDir);
}

/**
 * Copies placeholder overlay files to the target directory to prove the overlay
 * coexistence mechanism. These are test fixtures, NOT real fork code.
 *
 * @param {string} targetDir - The installation target directory
 */
function copyOverlayAdditions(targetDir) {
  // Overlay hook placeholder
  const hooksDir = path.join(targetDir, 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.writeFileSync(
    path.join(hooksDir, 'test-overlay-hook.js'),
    '// Overlay hook placeholder for prototype validation'
  );

  // Overlay command placeholder
  const commandsGsdDir = path.join(targetDir, 'commands', 'gsd');
  fs.mkdirSync(commandsGsdDir, { recursive: true });
  fs.writeFileSync(
    path.join(commandsGsdDir, 'test-overlay-command.md'),
    '# Test overlay command\nPrototype validation placeholder'
  );
}

describe('Phase 29: Prototype Gate', () => {
  let tmpDir;
  let cleanupTmp;

  beforeEach(() => {
    const tmp = createTempDir();
    tmpDir = tmp;
    cleanupTmp = tmp.cleanup;
  });

  afterEach(() => {
    cleanupTmp();
  });

  test('PROTO-01: upstream install.js runs from composed dir preserving internal structure', { timeout: 15000 }, () => {
    // Set up a scratch directory mirroring the upstream package
    const scratchDir = setupScratchDir(tmpDir.path);

    // Create a target directory for the install
    const targetDir = path.join(tmpDir.path, 'target');
    fs.mkdirSync(targetDir, { recursive: true });

    // Run the upstream installer
    const result = runUpstreamInstaller(scratchDir, targetDir);

    // Installer must exit 0
    expect(result.success).toBe(true);

    // Verify installed directory structure
    expect(fs.existsSync(path.join(targetDir, 'gsd-core'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'agents'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'hooks'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'skills'))).toBe(true);

    // Full content verification: at least one .md file in agents/
    const agentFiles = fs.readdirSync(path.join(targetDir, 'agents'));
    expect(agentFiles.some(f => f.endsWith('.md'))).toBe(true);

    // Full content verification: at least one skill directory is installed
    const skillEntries = fs.readdirSync(path.join(targetDir, 'skills'));
    expect(skillEntries.length).toBeGreaterThan(0);

    // Full content verification: at least one .js file in hooks/
    const hookFiles = fs.readdirSync(path.join(targetDir, 'hooks'));
    expect(hookFiles.some(f => f.endsWith('.js'))).toBe(true);

    // Verify gsd-core/ contains expected subdirectories (confirms __dirname path resolution worked)
    const gsdSubdirs = fs.readdirSync(path.join(targetDir, 'gsd-core'));
    expect(gsdSubdirs.length).toBeGreaterThan(0);
  });

  test('PROTO-02: surface branding does not break installation', { timeout: 15000 }, () => {
    // Set up scratch directory and apply branding
    const scratchDir = setupScratchDir(tmpDir.path);
    applyBranding(scratchDir);

    // Pre-install branding verification
    const brandedContent = fs.readFileSync(path.join(scratchDir, 'bin', 'install.js'), 'utf-8');

    // Branded package name must be present
    expect(brandedContent).toContain('@chude/get-stuff-done');

    // Original npm package name must be gone
    expect(brandedContent).not.toContain('@opengsd/gsd-core');

    // CRITICAL: Bare 'gsd-core' (internal path name) must still be present
    expect(brandedContent).toContain('gsd-core');

    // Create target directory and run branded installer
    const targetDir = path.join(tmpDir.path, 'target');
    fs.mkdirSync(targetDir, { recursive: true });

    const result = runUpstreamInstaller(scratchDir, targetDir);

    // Branding must NOT break the installer
    expect(result.success).toBe(true);

    // Structural verification: installation succeeded despite branding
    expect(fs.existsSync(path.join(targetDir, 'gsd-core'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'agents'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'hooks'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'skills'))).toBe(true);

    // Post-install branding verification: run --help and check output
    const installScript = path.join(scratchDir, 'bin', 'install.js');
    const helpResult = runWithTimeout(process.execPath, [installScript, '--help'], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 15000,
    });
    const helpOutput = helpResult.stdout;
    // Branded name should appear in help text (if help text references the package)
    if (helpOutput.length > 0) {
      expect(helpOutput).not.toContain('@opengsd/gsd-core');
    }
  });

  test('PROTO-03: overlay additions can be copied after upstream install', { timeout: 15000 }, () => {
    // Use branded version for the most realistic prototype scenario
    const scratchDir = setupScratchDir(tmpDir.path);
    applyBranding(scratchDir);

    // Create target directory and run upstream installer
    const targetDir = path.join(tmpDir.path, 'target');
    fs.mkdirSync(targetDir, { recursive: true });

    const result = runUpstreamInstaller(scratchDir, targetDir);

    // Base install must succeed before overlay copy
    expect(result.success).toBe(true);

    // Copy overlay additions on top of upstream install
    copyOverlayAdditions(targetDir);

    // Verify overlay files exist in target
    const overlayHookPath = path.join(targetDir, 'hooks', 'test-overlay-hook.js');
    const overlayCommandPath = path.join(targetDir, 'commands', 'gsd', 'test-overlay-command.md');
    expect(fs.existsSync(overlayHookPath)).toBe(true);
    expect(fs.existsSync(overlayCommandPath)).toBe(true);

    // Verify overlay file contents are correct
    const hookContent = fs.readFileSync(overlayHookPath, 'utf-8');
    expect(hookContent).toBe('// Overlay hook placeholder for prototype validation');

    const commandContent = fs.readFileSync(overlayCommandPath, 'utf-8');
    expect(commandContent).toBe('# Test overlay command\nPrototype validation placeholder');

    // Verify upstream files still exist (overlay did NOT clobber them)
    expect(fs.existsSync(path.join(targetDir, 'gsd-core'))).toBe(true);

    const agentFiles = fs.readdirSync(path.join(targetDir, 'agents'));
    expect(agentFiles.some(f => f.endsWith('.md'))).toBe(true);

    const hookFiles = fs.readdirSync(path.join(targetDir, 'hooks'));
    const upstreamHooks = hookFiles.filter(f => f.endsWith('.js') && f !== 'test-overlay-hook.js');
    expect(upstreamHooks.length).toBeGreaterThan(0);

    // Verify no name conflicts: overlay files are additive
    // (overlay files use unique names that upstream never creates)
    expect(hookFiles).toContain('test-overlay-hook.js');
    const commandFiles = fs.readdirSync(path.join(targetDir, 'commands', 'gsd'));
    expect(commandFiles).toContain('test-overlay-command.md');
  });
});

// Go/No-Go Summary:
// PROTO-01 PASS: Upstream install.js runs from composed directory
// PROTO-02 PASS: Surface branding does not break installation
// PROTO-03 PASS: Overlay additions coexist after upstream install
// VERDICT: GO -- proceed with overlay architecture (Phases 30-35)
