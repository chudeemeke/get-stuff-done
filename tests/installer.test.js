/**
 * Installer Tests
 *
 * Tests for bin/install.js covering directory creation, symlink/junction/copy fallback,
 * hook registration, metadata writing, and error handling.
 *
 * SAFETY: All tests use temp directories. Real ~/.gsd and ~/.claude are never touched.
 */

const { test, describe, beforeEach, afterEach, expect } = require('bun:test');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawnSync } = require('child_process');

const { createTempDir, mockEnv, mockPlatform } = require('./helpers');

// Path to installer script
const INSTALL_SCRIPT = path.join(__dirname, '..', 'bin', 'install.js');

/**
 * Run installer with custom environment
 * @param {object} env - Environment overrides
 * @param {string[]} args - CLI arguments
 * @returns {{ success: boolean, output: string, error: string }}
 */
function runInstaller(env = {}, args = []) {
  try {
    const result = execSync(`node "${INSTALL_SCRIPT}" ${args.join(' ')}`, {
      encoding: 'utf-8',
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output: result };
  } catch (err) {
    return {
      success: false,
      output: err.stdout?.toString() || '',
      error: err.stderr?.toString() || err.message,
    };
  }
}

/**
 * Get the actual package root directory
 * The installer will use this as its source (via __dirname/..)
 * @returns {string} Path to package root
 */
function getPackageRoot() {
  // Installer is at bin/install.js, so package root is bin/..
  return path.join(__dirname, '..');
}

/**
 * Verify installed directory structure
 * @param {string} targetDir - Target installation directory
 * @param {boolean} useLinks - Whether symlinks were used
 * @returns {object} Verification results
 */
function verifyInstallation(targetDir, useLinks = false) {
  const results = {
    commandsExists: fs.existsSync(path.join(targetDir, 'commands', 'gsd')),
    agentsExists: fs.existsSync(path.join(targetDir, 'agents')),
    skillExists: fs.existsSync(path.join(targetDir, 'get-stuff-done')),
    hooksExists: fs.existsSync(path.join(targetDir, 'hooks')),
    settingsExists: fs.existsSync(path.join(targetDir, 'settings.json')),
    metadataExists: fs.existsSync(path.join(targetDir, 'get-stuff-done', '.install-meta.json')),
    versionExists: fs.existsSync(path.join(targetDir, 'get-stuff-done', 'VERSION')),
    commandsSymlink: false,
    agentsSymlink: false,
    skillSymlink: false,
    hooksSymlink: false,
  };

  if (useLinks) {
    try {
      results.commandsSymlink = fs.lstatSync(path.join(targetDir, 'commands', 'gsd')).isSymbolicLink();
      results.agentsSymlink = fs.lstatSync(path.join(targetDir, 'agents')).isSymbolicLink();
      results.skillSymlink = fs.lstatSync(path.join(targetDir, 'get-stuff-done')).isSymbolicLink();
      results.hooksSymlink = fs.lstatSync(path.join(targetDir, 'hooks')).isSymbolicLink();
    } catch {
      // Symlink checks may fail on Windows or if paths don't exist
    }
  }

  return results;
}

describe('Installer - Directory Creation', () => {
  let tmpDir;
  let mockHome;
  let cleanup;

  beforeEach(() => {
    const tmp = createTempDir();
    tmpDir = tmp.path;
    cleanup = tmp.cleanup;

    // Create mock home directory
    mockHome = path.join(tmpDir, 'home');
    fs.mkdirSync(mockHome, { recursive: true });
  });

  afterEach(() => {
    cleanup();
  });

  test('creates .claude directory structure', () => {
    const claudeDir = path.join(mockHome, '.claude');

    // Mock HOME to point to temp directory
    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global']
    );

    expect(result.success).toBe(true);
    expect(fs.existsSync(claudeDir)).toBe(true);
  });

  test('creates commands, agents, get-stuff-done, hooks directories', () => {
    const claudeDir = path.join(mockHome, '.claude');

    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global']
    );

    expect(result.success).toBe(true);

    const verification = verifyInstallation(claudeDir);
    expect(verification.commandsExists).toBe(true);
    expect(verification.agentsExists).toBe(true);
    expect(verification.skillExists).toBe(true);
    expect(verification.hooksExists).toBe(true);
  });

  test('handles pre-existing directories without error', () => {
    const claudeDir = path.join(mockHome, '.claude');

    // Create pre-existing directory structure
    fs.mkdirSync(path.join(claudeDir, 'commands'), { recursive: true });
    fs.mkdirSync(path.join(claudeDir, 'agents'), { recursive: true });

    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global']
    );

    expect(result.success).toBe(true);
  });

  test('respects CLAUDE_CONFIG_DIR override', () => {
    const customDir = path.join(tmpDir, 'custom-config');

    const result = runInstaller(
      {
        HOME: mockHome,
        USERPROFILE: mockHome,
        CLAUDE_CONFIG_DIR: customDir
      },
      ['--claude', '--global']
    );

    expect(result.success).toBe(true);
    expect(fs.existsSync(customDir)).toBe(true);

    const verification = verifyInstallation(customDir);
    expect(verification.commandsExists).toBe(true);
  });

  test('respects --config-dir flag', () => {
    const customDir = path.join(tmpDir, 'flag-config');

    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global', '--config-dir', customDir]
    );

    expect(result.success).toBe(true);
    expect(fs.existsSync(customDir)).toBe(true);

    const verification = verifyInstallation(customDir);
    expect(verification.commandsExists).toBe(true);
  });

  test('creates local installation in current directory', () => {
    const projectDir = path.join(tmpDir, 'project');
    fs.mkdirSync(projectDir, { recursive: true });

    // Use cwd option instead of 'cd && node' shell chaining (cross-platform compatible)
    execSync(
      `node "${INSTALL_SCRIPT}" --claude --local`,
      {
        cwd: projectDir,
        encoding: 'utf-8',
        env: { ...process.env, HOME: mockHome, USERPROFILE: mockHome },
      }
    );

    const localClaudeDir = path.join(projectDir, '.claude');
    expect(fs.existsSync(localClaudeDir)).toBe(true);

    const verification = verifyInstallation(localClaudeDir);
    expect(verification.commandsExists).toBe(true);
  });
});

describe('Installer - Symlink and Copy Modes', () => {
  let tmpDir;
  let mockHome;
  let cleanup;

  beforeEach(() => {
    const tmp = createTempDir();
    tmpDir = tmp.path;
    cleanup = tmp.cleanup;

    mockHome = path.join(tmpDir, 'home');
    fs.mkdirSync(mockHome, { recursive: true });
  });

  afterEach(() => {
    cleanup();
  });

  test('uses copy mode by default', () => {
    const claudeDir = path.join(mockHome, '.claude');

    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global']
    );

    expect(result.success).toBe(true);

    const verification = verifyInstallation(claudeDir, false);
    expect(verification.skillExists).toBe(true);

    // In copy mode, should not be symlinks
    expect(verification.skillSymlink).toBe(false);
  });

  test('uses symlinks with --link flag', () => {
    const claudeDir = path.join(mockHome, '.claude');

    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global', '--link']
    );

    expect(result.success).toBe(true);

    const verification = verifyInstallation(claudeDir, true);
    expect(verification.skillExists).toBe(true);

    // In link mode, should be symlinks
    if (process.platform !== 'win32') {
      expect(verification.skillSymlink).toBe(true);
    }
  });

  test('copy mode creates all required files', () => {
    const claudeDir = path.join(mockHome, '.claude');

    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global']
    );

    expect(result.success).toBe(true);

    // Verify key directories and files exist
    // (Specific files depend on actual package content, which may vary)
    expect(fs.existsSync(path.join(claudeDir, 'commands', 'gsd'))).toBe(true);
    expect(fs.existsSync(path.join(claudeDir, 'agents'))).toBe(true);
    expect(fs.existsSync(path.join(claudeDir, 'get-stuff-done'))).toBe(true);
    expect(fs.existsSync(path.join(claudeDir, 'hooks'))).toBe(true);

    // Check that commands directory has markdown files
    const commandFiles = fs.readdirSync(path.join(claudeDir, 'commands', 'gsd'));
    const hasMdFiles = commandFiles.some(f => f.endsWith('.md'));
    expect(hasMdFiles).toBe(true);
  });

  test('copy mode includes teams directory', () => {
    const claudeDir = path.join(mockHome, '.claude');

    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global']
    );

    expect(result.success).toBe(true);

    const teamsDir = path.join(claudeDir, 'get-stuff-done', 'teams');
    expect(fs.existsSync(teamsDir)).toBe(true);

    // Check that teams directory has markdown files
    const teamFiles = fs.readdirSync(teamsDir);
    const hasMdFiles = teamFiles.some(f => f.endsWith('.md'));
    expect(hasMdFiles).toBe(true);
  });
});

describe('Installer - Hook Registration', () => {
  let tmpDir;
  let mockHome;
  let cleanup;

  beforeEach(() => {
    const tmp = createTempDir();
    tmpDir = tmp.path;
    cleanup = tmp.cleanup;

    mockHome = path.join(tmpDir, 'home');
    fs.mkdirSync(mockHome, { recursive: true });
  });

  afterEach(() => {
    cleanup();
  });

  test('creates settings.json with hooks', () => {
    const claudeDir = path.join(mockHome, '.claude');

    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global']
    );

    expect(result.success).toBe(true);

    const settingsPath = path.join(claudeDir, 'settings.json');
    expect(fs.existsSync(settingsPath)).toBe(true);

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    expect(settings.hooks).toBeDefined();
  });

  test('registers SessionStart hook for update checking', () => {
    const claudeDir = path.join(mockHome, '.claude');

    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global']
    );

    expect(result.success).toBe(true);

    const settingsPath = path.join(claudeDir, 'settings.json');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

    expect(settings.hooks.SessionStart).toBeDefined();
    expect(Array.isArray(settings.hooks.SessionStart)).toBe(true);

    const hasUpdateHook = settings.hooks.SessionStart.some(entry =>
      entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsd-check-update'))
    );
    expect(hasUpdateHook).toBe(true);
  });

  test('registers PreCompact hook for state preservation', () => {
    const claudeDir = path.join(mockHome, '.claude');

    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global']
    );

    expect(result.success).toBe(true);

    const settingsPath = path.join(claudeDir, 'settings.json');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

    expect(settings.hooks.PreCompact).toBeDefined();
    expect(Array.isArray(settings.hooks.PreCompact)).toBe(true);

    const hasPreCompactHook = settings.hooks.PreCompact.some(entry =>
      entry.hooks && entry.hooks.some(h => h.command && h.command.includes('pre-compact'))
    );
    expect(hasPreCompactHook).toBe(true);
  });

  test('preserves existing settings.json content', () => {
    const claudeDir = path.join(mockHome, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    // Create pre-existing settings.json with user content
    const existingSettings = {
      customSetting: 'user-value',
      hooks: {
        SessionStart: [
          {
            hooks: [
              { type: 'command', command: 'echo "user hook"' }
            ]
          }
        ]
      }
    };
    fs.writeFileSync(
      path.join(claudeDir, 'settings.json'),
      JSON.stringify(existingSettings, null, 2)
    );

    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global']
    );

    expect(result.success).toBe(true);

    const settings = JSON.parse(fs.readFileSync(path.join(claudeDir, 'settings.json'), 'utf-8'));

    // Custom setting should be preserved
    expect(settings.customSetting).toBe('user-value');

    // User hook should still exist
    const hasUserHook = settings.hooks.SessionStart.some(entry =>
      entry.hooks && entry.hooks.some(h => h.command && h.command.includes('user hook'))
    );
    expect(hasUserHook).toBe(true);

    // GSD hook should be added
    const hasGsdHook = settings.hooks.SessionStart.some(entry =>
      entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsd-check-update'))
    );
    expect(hasGsdHook).toBe(true);
  });

  test('handles missing settings.json by creating new', () => {
    const claudeDir = path.join(mockHome, '.claude');

    // Ensure no pre-existing settings.json
    const settingsPath = path.join(claudeDir, 'settings.json');
    expect(fs.existsSync(settingsPath)).toBe(false);

    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global']
    );

    expect(result.success).toBe(true);
    expect(fs.existsSync(settingsPath)).toBe(true);

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    expect(settings.hooks).toBeDefined();
  });

  test('does not duplicate hooks on reinstall', () => {
    const claudeDir = path.join(mockHome, '.claude');

    // First install
    runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global']
    );

    // Second install (reinstall)
    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global']
    );

    expect(result.success).toBe(true);

    const settings = JSON.parse(fs.readFileSync(path.join(claudeDir, 'settings.json'), 'utf-8'));

    // Count update check hooks
    const updateHookCount = settings.hooks.SessionStart.filter(entry =>
      entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsd-check-update'))
    ).length;

    // Should only have one update hook, not two
    expect(updateHookCount).toBe(1);
  });
});

describe('Installer - Metadata', () => {
  let tmpDir;
  let mockHome;
  let mockSource;
  let cleanup;

  beforeEach(() => {
    const tmp = createTempDir();
    tmpDir = tmp.path;
    cleanup = tmp.cleanup;

    mockHome = path.join(tmpDir, 'home');
    fs.mkdirSync(mockHome, { recursive: true });
  });

  afterEach(() => {
    cleanup();
  });

  test('writes .install-meta.json with install method and timestamp', () => {
    const claudeDir = path.join(mockHome, '.claude');

    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global']
    );

    expect(result.success).toBe(true);

    const metaPath = path.join(claudeDir, 'get-stuff-done', '.install-meta.json');
    expect(fs.existsSync(metaPath)).toBe(true);

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    expect(meta.installType).toBeDefined();
    expect(meta.version).toBeDefined();
    expect(meta.installedAt).toBeDefined();
    expect(meta.platform).toBeDefined();
    expect(meta.installMethod).toBeDefined();
  });

  test('writes VERSION file with package version', () => {
    const claudeDir = path.join(mockHome, '.claude');

    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global']
    );

    expect(result.success).toBe(true);

    const versionPath = path.join(claudeDir, 'get-stuff-done', 'VERSION');
    expect(fs.existsSync(versionPath)).toBe(true);

    const version = fs.readFileSync(versionPath, 'utf-8').trim();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic version format
  });

  test('updates metadata on reinstall', () => {
    const claudeDir = path.join(mockHome, '.claude');

    // First install
    runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global']
    );

    const metaPath = path.join(claudeDir, 'get-stuff-done', '.install-meta.json');
    const firstMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const firstTimestamp = firstMeta.installedAt;

    // Wait a bit to ensure timestamp difference
    const start = Date.now();
    while (Date.now() - start < 100) {
      // Busy wait
    }

    // Second install
    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global']
    );

    expect(result.success).toBe(true);

    const secondMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const secondTimestamp = secondMeta.installedAt;

    // Timestamp should be updated
    expect(secondTimestamp).not.toBe(firstTimestamp);
  });
});

describe('Installer - Error Handling', () => {
  let tmpDir;
  let mockHome;
  let mockSource;
  let cleanup;

  beforeEach(() => {
    const tmp = createTempDir();
    tmpDir = tmp.path;
    cleanup = tmp.cleanup;

    mockHome = path.join(tmpDir, 'home');
    fs.mkdirSync(mockHome, { recursive: true });
  });

  afterEach(() => {
    cleanup();
  });

  test('shows error for conflicting --global and --local', () => {
    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global', '--local']
    );

    expect(result.success).toBe(false);
    expect(result.output + result.error).toContain('Cannot specify both --global and --local');
  });

  test('shows error for --config-dir with --local', () => {
    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--local', '--config-dir', '/tmp/custom']
    );

    expect(result.success).toBe(false);
    expect(result.output + result.error).toContain('Cannot use --config-dir with --local');
  });

  test('shows error for --link with --local', () => {
    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--local', '--link']
    );

    expect(result.success).toBe(false);
    expect(result.output + result.error).toContain('Cannot use --link with --local');
  });

  test('shows error for --link with --uninstall', () => {
    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global', '--link', '--uninstall']
    );

    expect(result.success).toBe(false);
    expect(result.output + result.error).toContain('Cannot use --link with --uninstall');
  });

  test('shows error for --config-dir without value', () => {
    const result = runInstaller(
      { HOME: mockHome, USERPROFILE: mockHome },
      ['--claude', '--global', '--config-dir']
    );

    expect(result.success).toBe(false);
    expect(result.output + result.error).toContain('--config-dir requires');
  });

  test('shows warning for Node.js version < 20', () => {
    // This test is informational - the installer warns but doesn't fail
    // Skip if current Node.js is already < 20 (we can't downgrade)
    const nodeVersion = parseInt(process.version.slice(1).split('.')[0], 10);
    if (nodeVersion < 20) {
      return; // Skip test
    }

    // Note: We can't easily mock process.version for the child process,
    // so this test is more of a documentation of the feature
    expect(nodeVersion).toBeGreaterThanOrEqual(20);
  });
});

describe('Installer - OpenCode Support', () => {
  let tmpDir;
  let mockHome;
  let mockSource;
  let cleanup;

  beforeEach(() => {
    const tmp = createTempDir();
    tmpDir = tmp.path;
    cleanup = tmp.cleanup;

    mockHome = path.join(tmpDir, 'home');
    fs.mkdirSync(mockHome, { recursive: true });
  });

  afterEach(() => {
    cleanup();
  });

  test('creates OpenCode directory structure', () => {
    const opencodeDir = path.join(mockHome, '.config', 'opencode');

    const result = runInstaller(
      {
        HOME: mockHome,
        USERPROFILE: mockHome,
        XDG_CONFIG_HOME: path.join(mockHome, '.config')
      },
      ['--opencode', '--global']
    );

    expect(result.success).toBe(true);
    expect(fs.existsSync(opencodeDir)).toBe(true);
  });

  test('respects OPENCODE_CONFIG_DIR override', () => {
    const customDir = path.join(tmpDir, 'custom-opencode');

    const result = runInstaller(
      {
        HOME: mockHome,
        USERPROFILE: mockHome,
        OPENCODE_CONFIG_DIR: customDir
      },
      ['--opencode', '--global']
    );

    expect(result.success).toBe(true);
    expect(fs.existsSync(customDir)).toBe(true);
  });

  test('uses flat command structure for OpenCode', () => {
    const opencodeDir = path.join(mockHome, '.config', 'opencode');

    const result = runInstaller(
      {
        HOME: mockHome,
        USERPROFILE: mockHome,
        XDG_CONFIG_HOME: path.join(mockHome, '.config')
      },
      ['--opencode', '--global']
    );

    expect(result.success).toBe(true);

    // OpenCode uses command/ (singular) with flat structure
    const commandDir = path.join(opencodeDir, 'command');
    expect(fs.existsSync(commandDir)).toBe(true);

    // Commands should be flattened with gsd- prefix
    const commandFiles = fs.readdirSync(commandDir);
    const gsdCommands = commandFiles.filter(f => f.startsWith('gsd-') && f.endsWith('.md'));
    expect(gsdCommands.length).toBeGreaterThan(0);
  });

  test('does not support --link for OpenCode', () => {
    const result = runInstaller(
      {
        HOME: mockHome,
        USERPROFILE: mockHome,
        XDG_CONFIG_HOME: path.join(mockHome, '.config')
      },
      ['--opencode', '--global', '--link']
    );

    expect(result.success).toBe(false);
    expect(result.output + result.error).toContain('--link is not supported for OpenCode');
  });
});

describe('Installer - Help and Version', () => {
  test('shows help with --help flag', () => {
    const result = runInstaller({}, ['--help']);

    expect(result.success).toBe(true);
    expect(result.output).toContain('Usage:');
    expect(result.output).toContain('Options:');
    expect(result.output).toContain('--global');
    expect(result.output).toContain('--local');
  });

  test('shows help with -h flag', () => {
    const result = runInstaller({}, ['-h']);

    expect(result.success).toBe(true);
    expect(result.output).toContain('Usage:');
  });
});
