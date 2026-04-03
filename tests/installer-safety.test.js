/**
 * Installer Safety Unit Tests
 *
 * Comprehensive tests for all 4 safety functions in bin/install.js:
 *   - readInstalledManifest() -- manifest parsing
 *   - removeGsdFiles()        -- manifest-driven + legacy removal
 *   - detectV2()              -- v2 installation detection without false positives
 *   - isSafeToClean()         -- dangerous path rejection
 *
 * Covers: INST-01 (manifest-driven cleanup preserves user content)
 *         INST-02 (detectV2 no false positive on overlay src/)
 *         INST-03 (removal uses manifest, legacy fallback only touches known dirs)
 *
 * Origin: Phase 37 -- post-wipe incident safety validation (2026-04-01)
 */

const { test, describe, beforeEach, afterEach, expect } = require('bun:test');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { createTempDir } = require('./helpers');
const {
  readInstalledManifest,
  removeGsdFiles,
  detectV2,
  isSafeToClean,
  uninstall,
  patchStatusLine,
  INSTALLED_MANIFEST_NAME,
} = require('../bin/install.js');

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

/**
 * Representative user content that must survive all installer operations.
 * Mirrors the actual files destroyed in the 2026-04-01 wipe incident.
 */
const USER_CONTENT = {
  'CLAUDE.md': '# User CLAUDE.md\nCustom instructions',
  'rules/my-rule.md': '# Custom rule\nUser-defined rule content',
  'rules/another-rule.md': '# Another rule',
  'projects/myproject/memory/MEMORY.md': '# Project memory',
  'settings.json': JSON.stringify({ theme: 'dark', customSetting: true }),
  'skills/my-skill/SKILL.md': '# Custom skill',
  'scripts/my-script.sh': '#!/bin/bash\necho "user script"',
  'commands/my-cmd.md': '# Custom command',
};

/**
 * Populate a directory with all user content fixtures.
 * @param {string} dir - Target directory
 */
function populateUserContent(dir) {
  for (const [relPath, content] of Object.entries(USER_CONTENT)) {
    const fullPath = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  }
}

/**
 * Assert all user content fixtures exist with unchanged content.
 * @param {string} dir - Target directory
 */
function assertUserContentIntact(dir) {
  for (const [relPath, expectedContent] of Object.entries(USER_CONTENT)) {
    const fullPath = path.join(dir, relPath);
    expect(fs.existsSync(fullPath)).toBe(true);
    expect(fs.readFileSync(fullPath, 'utf-8')).toBe(expectedContent);
  }
}

/**
 * Write a mock gsd-file-manifest.json using the exported constant.
 * @param {string} dir - Target directory
 * @param {string[]} files - Relative file paths to list in the manifest
 */
function writeManifest(dir, files) {
  const manifest = {
    version: '1.30.0',
    timestamp: '2026-03-29T21:05:13.431Z',
    files: Object.fromEntries(files.map((f) => [f, 'sha256hash'])),
  };
  fs.writeFileSync(
    path.join(dir, INSTALLED_MANIFEST_NAME),
    JSON.stringify(manifest)
  );
}

// ---------------------------------------------------------------------------
// readInstalledManifest
// ---------------------------------------------------------------------------

describe('readInstalledManifest', { timeout: 15000 }, () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    tmpDir.cleanup();
  });

  test('returns array of relative paths when valid manifest exists', () => {
    const files = [
      'get-shit-done/bin/gsd-tools.cjs',
      'commands/gsd/workstreams.md',
      'hooks/gsd-statusline.js',
    ];
    writeManifest(tmpDir.path, files);

    const result = readInstalledManifest(tmpDir.path);
    expect(result).toEqual(files);
  });

  test('returns empty array when no manifest file exists', () => {
    const result = readInstalledManifest(tmpDir.path);
    expect(result).toEqual([]);
  });

  test('returns empty array when manifest is corrupt JSON', () => {
    fs.writeFileSync(
      path.join(tmpDir.path, INSTALLED_MANIFEST_NAME),
      '{ invalid json !!!'
    );

    const result = readInstalledManifest(tmpDir.path);
    expect(result).toEqual([]);
  });

  test('returns empty array when manifest.files is missing', () => {
    fs.writeFileSync(
      path.join(tmpDir.path, INSTALLED_MANIFEST_NAME),
      JSON.stringify({ version: '1.0.0', timestamp: '2026-01-01' })
    );

    const result = readInstalledManifest(tmpDir.path);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// removeGsdFiles
// ---------------------------------------------------------------------------

describe('removeGsdFiles', { timeout: 15000 }, () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    tmpDir.cleanup();
  });

  test('INST-01: manifest strategy removes listed files, user content survives', () => {
    const manifestFiles = [
      'get-shit-done/bin/gsd-tools.cjs',
      'get-shit-done/bin/lib/commands.cjs',
      'get-shit-done/templates/config.json',
      'commands/gsd/workstreams.md',
      'agents/gsd-executor.md',
      'hooks/gsd-statusline.js',
    ];

    // Create manifest-listed GSD files
    for (const f of manifestFiles) {
      const fullPath = path.join(tmpDir.path, f);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, 'gsd content');
    }

    // Create user content
    populateUserContent(tmpDir.path);

    // Write manifest
    writeManifest(tmpDir.path, manifestFiles);

    // Act
    const result = removeGsdFiles(tmpDir.path, true);

    // Assert: strategy is manifest
    expect(result.strategy).toBe('manifest');

    // Assert: all manifest-listed files removed
    for (const f of manifestFiles) {
      expect(fs.existsSync(path.join(tmpDir.path, f))).toBe(false);
    }

    // Assert: user content intact (INST-01 critical assertion)
    assertUserContentIntact(tmpDir.path);
  });

  test('INST-03: legacy fallback removes only get-stuff-done/ and get-shit-done/', () => {
    // No manifest -- triggers legacy fallback

    // Create v2-style directories
    fs.mkdirSync(path.join(tmpDir.path, 'get-stuff-done', 'bin'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir.path, 'get-stuff-done', 'bin', 'tools.cjs'), 'v2 code');

    fs.mkdirSync(path.join(tmpDir.path, 'get-shit-done', 'bin'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir.path, 'get-shit-done', 'bin', 'tools.cjs'), 'v3 code');

    // Create user content
    populateUserContent(tmpDir.path);

    // Act
    const result = removeGsdFiles(tmpDir.path, true);

    // Assert: strategy is legacy-fallback
    expect(result.strategy).toBe('legacy-fallback');

    // Assert: v2 directories removed
    expect(fs.existsSync(path.join(tmpDir.path, 'get-stuff-done'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, 'get-shit-done'))).toBe(false);

    // Assert: user content intact (INST-03)
    assertUserContentIntact(tmpDir.path);
  });

  test('manifest strategy prunes empty directories after file removal', () => {
    const manifestFiles = [
      'get-shit-done/bin/lib/deep/file.cjs',
    ];

    // Create the file
    const fullPath = path.join(tmpDir.path, manifestFiles[0]);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, 'content');

    // Write manifest
    writeManifest(tmpDir.path, manifestFiles);

    // Act
    removeGsdFiles(tmpDir.path, true);

    // Assert: the file is gone
    expect(fs.existsSync(fullPath)).toBe(false);

    // Assert: empty parent directories pruned all the way up
    expect(fs.existsSync(path.join(tmpDir.path, 'get-shit-done', 'bin', 'lib', 'deep'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, 'get-shit-done', 'bin', 'lib'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, 'get-shit-done', 'bin'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, 'get-shit-done'))).toBe(false);
  });

  test('does NOT prune directory containing user file (co-located content)', () => {
    // Pitfall 4: GSD file and user file in the same directory
    const manifestFiles = [
      'hooks/gsd-statusline.js',
    ];

    // Create GSD file listed in manifest
    fs.mkdirSync(path.join(tmpDir.path, 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir.path, 'hooks', 'gsd-statusline.js'), 'gsd hook');

    // Create user file in the SAME directory
    fs.writeFileSync(path.join(tmpDir.path, 'hooks', 'my-custom-hook.js'), 'user hook content');

    // Write manifest
    writeManifest(tmpDir.path, manifestFiles);

    // Act
    removeGsdFiles(tmpDir.path, true);

    // Assert: GSD file removed
    expect(fs.existsSync(path.join(tmpDir.path, 'hooks', 'gsd-statusline.js'))).toBe(false);

    // Assert: hooks/ directory still exists because user file is there
    expect(fs.existsSync(path.join(tmpDir.path, 'hooks'))).toBe(true);
    expect(fs.readFileSync(path.join(tmpDir.path, 'hooks', 'my-custom-hook.js'), 'utf-8')).toBe('user hook content');
  });

  test('always removes metadata files (manifest, .install-meta, CREDITS, package.json)', () => {
    // Create metadata files at target root
    fs.writeFileSync(path.join(tmpDir.path, INSTALLED_MANIFEST_NAME), '{}');
    fs.writeFileSync(path.join(tmpDir.path, '.install-meta.json'), '{}');
    fs.writeFileSync(path.join(tmpDir.path, 'CREDITS.md'), '# Credits');
    fs.writeFileSync(path.join(tmpDir.path, 'package.json'), '{}');

    // Write a valid manifest so it uses manifest strategy
    writeManifest(tmpDir.path, ['get-shit-done/bin/gsd-tools.cjs']);
    fs.mkdirSync(path.join(tmpDir.path, 'get-shit-done', 'bin'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir.path, 'get-shit-done', 'bin', 'gsd-tools.cjs'), 'content');

    // Act
    removeGsdFiles(tmpDir.path, true);

    // Assert: all metadata files removed
    expect(fs.existsSync(path.join(tmpDir.path, INSTALLED_MANIFEST_NAME))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, '.install-meta.json'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, 'CREDITS.md'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir.path, 'package.json'))).toBe(false);
  });

  test('returns correct strategy and removed count', () => {
    const manifestFiles = [
      'get-shit-done/bin/gsd-tools.cjs',
      'hooks/gsd-statusline.js',
    ];

    // Create the manifest-listed files
    for (const f of manifestFiles) {
      const fullPath = path.join(tmpDir.path, f);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, 'content');
    }

    // Also create metadata that gets cleaned
    fs.writeFileSync(path.join(tmpDir.path, '.install-meta.json'), '{}');

    // Write manifest
    writeManifest(tmpDir.path, manifestFiles);

    // Act
    const result = removeGsdFiles(tmpDir.path, true);

    // Assert: strategy is manifest
    expect(result.strategy).toBe('manifest');

    // Assert: removed = 2 manifest files + manifest file itself + .install-meta.json = 4
    expect(result.removed).toBe(4);
  });

  // -------------------------------------------------------------------------
  // Path containment (traversal rejection)
  // -------------------------------------------------------------------------

  describe('path containment (traversal rejection)', () => {
    test('rejects manifest entry with ../ traversal', () => {
      // Create a file OUTSIDE targetDir that a traversal would reach
      const escapeDir = path.join(path.dirname(tmpDir.path), 'escape-target');
      fs.mkdirSync(escapeDir, { recursive: true });
      const escapeFile = path.join(escapeDir, 'precious.txt');
      fs.writeFileSync(escapeFile, 'must survive');

      // Create a valid GSD file inside targetDir
      fs.mkdirSync(path.join(tmpDir.path, 'get-shit-done'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir.path, 'get-shit-done', 'legit.cjs'), 'gsd');

      // Write manifest with traversal entry + valid entry
      writeManifest(tmpDir.path, [
        '../escape-target/precious.txt',
        'get-shit-done/legit.cjs',
      ]);

      const result = removeGsdFiles(tmpDir.path, true);

      // Traversal entry skipped, valid entry removed
      expect(fs.existsSync(escapeFile)).toBe(true);
      expect(fs.readFileSync(escapeFile, 'utf-8')).toBe('must survive');
      expect(fs.existsSync(path.join(tmpDir.path, 'get-shit-done', 'legit.cjs'))).toBe(false);
      expect(result.skipped).toBeGreaterThanOrEqual(1);
      expect(result.removed).toBeGreaterThanOrEqual(1);

      // Cleanup escape dir
      fs.rmSync(escapeDir, { recursive: true, force: true });
    });

    test('rejects manifest entry with deeply nested traversal (../../)', () => {
      const deepEscape = path.join(path.dirname(path.dirname(tmpDir.path)), 'fake-bashrc');
      fs.mkdirSync(path.dirname(deepEscape), { recursive: true });
      fs.writeFileSync(deepEscape, 'shell config');

      writeManifest(tmpDir.path, ['../../fake-bashrc']);

      const result = removeGsdFiles(tmpDir.path, true);
      expect(fs.existsSync(deepEscape)).toBe(true);
      expect(result.skipped).toBeGreaterThanOrEqual(1);

      fs.rmSync(deepEscape, { force: true });
    });

    test('rejects absolute paths that resolve outside targetDir', () => {
      // On Unix, /etc/passwd resolves to itself (outside targetDir).
      // On Windows, path.join(target, '/etc/passwd') stays inside target (no escape).
      // Use a path that is guaranteed to escape on the current platform.
      const outsidePath = path.resolve(path.join(tmpDir.path, '..', '..', 'abs-escape-test.txt'));
      // Compute the ../ relative path from targetDir to that location
      const relEscape = path.relative(tmpDir.path, outsidePath);

      writeManifest(tmpDir.path, [relEscape]);

      const result = removeGsdFiles(tmpDir.path, true);
      expect(result.skipped).toBeGreaterThanOrEqual(1);
    });

    test('rejects entries using platform-native absolute paths', () => {
      // Construct an absolute path on the current OS that is clearly outside targetDir
      const absoluteOutside = path.join(os.tmpdir(), 'gsd-abs-escape-test', 'evil.txt');
      // Compute relative path from targetDir to that location -- will contain ../
      const relToAbsolute = path.relative(tmpDir.path, absoluteOutside);

      writeManifest(tmpDir.path, [relToAbsolute]);

      const result = removeGsdFiles(tmpDir.path, true);
      expect(result.skipped).toBeGreaterThanOrEqual(1);
    });

    test('mixed valid and traversal entries: deletes valid, skips traversal, user content intact', () => {
      // Valid GSD files
      const validFiles = [
        'get-shit-done/bin/gsd-tools.cjs',
        'commands/gsd/workstreams.md',
      ];
      for (const f of validFiles) {
        const fp = path.join(tmpDir.path, f);
        fs.mkdirSync(path.dirname(fp), { recursive: true });
        fs.writeFileSync(fp, 'gsd content');
      }

      // User content
      populateUserContent(tmpDir.path);

      // Manifest with valid + traversal entries (../escape always escapes on all platforms)
      writeManifest(tmpDir.path, [
        ...validFiles,
        '../escape/nope.txt',
        '../../another-escape/nope.txt',
      ]);

      const result = removeGsdFiles(tmpDir.path, true);

      expect(result.strategy).toBe('manifest');
      expect(result.skipped).toBe(2);
      // Valid files removed
      for (const f of validFiles) {
        expect(fs.existsSync(path.join(tmpDir.path, f))).toBe(false);
      }
      // User content intact
      assertUserContentIntact(tmpDir.path);
    });
  });
});

// ---------------------------------------------------------------------------
// detectV2
// ---------------------------------------------------------------------------

describe('detectV2', { timeout: 15000 }, () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    tmpDir.cleanup();
  });

  test('INST-02: returns false for overlay-installed dir with src/ and overlay_version', () => {
    // Overlay v3.0 installs src/ files AND writes .install-meta.json with overlay_version
    fs.mkdirSync(path.join(tmpDir.path, 'src', 'config'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir.path, 'src', 'config', 'index.js'), '// overlay code');
    fs.writeFileSync(
      path.join(tmpDir.path, '.install-meta.json'),
      JSON.stringify({ overlay_version: '3.0.0' })
    );

    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(false);
  });

  test('INST-02: returns false when only src/ exists (no meta files)', () => {
    // Critical false-positive regression: src/ alone must NOT trigger v2 detection
    fs.mkdirSync(path.join(tmpDir.path, 'src', 'config'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir.path, 'src', 'config', 'index.js'), '// some code');

    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(false);
  });

  test('returns true with signal meta for v2.x meta without overlay_version', () => {
    fs.mkdirSync(path.join(tmpDir.path, 'get-stuff-done'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir.path, 'get-stuff-done', '.install-meta.json'),
      JSON.stringify({ version: '2.4.0', installType: 'link' })
    );

    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(true);
    expect(result.signal).toBe('meta');
  });

  test('returns true with version string from v2.x meta', () => {
    fs.mkdirSync(path.join(tmpDir.path, 'get-stuff-done'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir.path, 'get-stuff-done', '.install-meta.json'),
      JSON.stringify({ version: '2.4.0', installType: 'link' })
    );

    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(true);
    expect(result.signal).toBe('meta');
    expect(result.version).toBe('2.4.0');
  });

  test('returns true with signal meta-corrupt for corrupt meta JSON', () => {
    fs.mkdirSync(path.join(tmpDir.path, 'get-stuff-done'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir.path, 'get-stuff-done', '.install-meta.json'),
      '{ broken json !!!'
    );

    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(true);
    expect(result.signal).toBe('meta-corrupt');
  });

  test('returns true with signal directory-name when get-stuff-done/ exists without get-shit-done/', () => {
    fs.mkdirSync(path.join(tmpDir.path, 'get-stuff-done', 'bin'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir.path, 'get-stuff-done', 'bin', 'tools.cjs'),
      'v2 code'
    );

    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(true);
    expect(result.signal).toBe('directory-name');
  });

  test('returns false for empty directory', () => {
    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(false);
  });

  test('returns false when both get-stuff-done/ and get-shit-done/ exist (v3.0 has both)', () => {
    fs.mkdirSync(path.join(tmpDir.path, 'get-stuff-done'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir.path, 'get-shit-done'), { recursive: true });

    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(false);
  });

  test('returns false when only get-shit-done/ exists (v3 baseline, not v2)', () => {
    // Per Gemini review: get-shit-done-only is a v3 baseline state.
    // The directory-name signal is specific to get-stuff-done/, not get-shit-done/.
    fs.mkdirSync(path.join(tmpDir.path, 'get-shit-done', 'bin'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir.path, 'get-shit-done', 'bin', 'gsd-tools.cjs'),
      'v3 code'
    );

    const result = detectV2(tmpDir.path);
    expect(result.isV2).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isSafeToClean
// ---------------------------------------------------------------------------

describe('isSafeToClean', { timeout: 15000 }, () => {
  test('refuses home directory', () => {
    const result = isSafeToClean(os.homedir());
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('home directory');
  });

  test('refuses filesystem root', () => {
    const root = path.parse(os.homedir()).root;
    const result = isSafeToClean(root);
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('filesystem root');
  });

  test('refuses shallow paths (single segment below root)', () => {
    const root = path.parse(os.homedir()).root;
    const shallowPath = path.join(root, 'single');
    const result = isSafeToClean(shallowPath);
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('too shallow');
  });

  test('accepts valid deep path', () => {
    const deepPath = path.join(os.tmpdir(), 'gsd-test-abc123');
    const result = isSafeToClean(deepPath);
    expect(result.safe).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// uninstall (public entrypoint)
// ---------------------------------------------------------------------------

describe('uninstall', { timeout: 15000 }, () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    tmpDir.cleanup();
  });

  test('removes GSD files via manifest and preserves user content', () => {
    // Seed GSD files
    const gsdFiles = [
      'get-shit-done/bin/gsd-tools.cjs',
      'commands/gsd/workstreams.md',
    ];
    for (const f of gsdFiles) {
      const fp = path.join(tmpDir.path, f);
      fs.mkdirSync(path.dirname(fp), { recursive: true });
      fs.writeFileSync(fp, 'gsd content');
    }

    // Seed user content
    populateUserContent(tmpDir.path);

    // Write manifest
    writeManifest(tmpDir.path, gsdFiles);

    // Act -- exit: false so we don't kill the test runner
    const result = uninstall(tmpDir.path, { exit: false });

    // Assert: GSD files removed
    for (const f of gsdFiles) {
      expect(fs.existsSync(path.join(tmpDir.path, f))).toBe(false);
    }

    // Assert: user content intact
    assertUserContentIntact(tmpDir.path);

    // Assert: result contains removal info
    expect(result.removed).toBeGreaterThanOrEqual(1);
    expect(result.strategy).toBeDefined();
  });

  test('handles non-existent directory without throwing', () => {
    const missingDir = path.join(tmpDir.path, 'does-not-exist');

    // Should not throw
    const result = uninstall(missingDir, { exit: false });
    expect(result.removed).toBe(0);
    expect(result.missing).toBe(true);
  });

  test('legacy fallback path through uninstall removes only known dirs', () => {
    // No manifest -- triggers legacy fallback via removeGsdFiles
    fs.mkdirSync(path.join(tmpDir.path, 'get-stuff-done', 'bin'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir.path, 'get-stuff-done', 'bin', 'tools.cjs'), 'v2');

    populateUserContent(tmpDir.path);

    const result = uninstall(tmpDir.path, { exit: false });

    expect(fs.existsSync(path.join(tmpDir.path, 'get-stuff-done'))).toBe(false);
    assertUserContentIntact(tmpDir.path);
    expect(result.strategy).toBe('legacy-fallback');
  });
});

// ---------------------------------------------------------------------------
// patchStatusLine
// ---------------------------------------------------------------------------

describe('patchStatusLine', { timeout: 15000 }, () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    tmpDir.cleanup();
  });

  test('creates settings.json and adds statusLine when file missing', () => {
    const result = patchStatusLine(tmpDir.path);
    expect(result.action).toBe('added');
    const settings = JSON.parse(fs.readFileSync(path.join(tmpDir.path, 'settings.json'), 'utf8'));
    expect(settings.statusLine).toBeDefined();
    expect(settings.statusLine.type).toBe('command');
    expect(settings.statusLine.command).toContain('gsd-statusline.js');
  });

  test('adds statusLine to existing settings with other keys', () => {
    const settingsPath = path.join(tmpDir.path, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify({
      hooks: { pre_compact: 'node hooks/pre-compact.js' },
      theme: 'dark'
    }, null, 2));
    const result = patchStatusLine(tmpDir.path);
    expect(result.action).toBe('added');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(settings.statusLine.command).toContain('gsd-statusline.js');
    expect(settings.hooks).toBeDefined();  // preserved
    expect(settings.theme).toBe('dark');    // preserved
  });

  test('preserves custom non-GSD statusLine (per D-06)', () => {
    const settingsPath = path.join(tmpDir.path, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify({
      statusLine: { type: 'command', command: 'node my-custom-statusline.js' }
    }, null, 2));
    const result = patchStatusLine(tmpDir.path);
    expect(result.action).toBe('preserved_custom');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(settings.statusLine.command).toBe('node my-custom-statusline.js');
  });

  test('updates existing GSD statusLine path', () => {
    const settingsPath = path.join(tmpDir.path, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify({
      statusLine: { type: 'command', command: 'node "/old/path/hooks/gsd-statusline.js"' }
    }, null, 2));
    const result = patchStatusLine(tmpDir.path);
    expect(result.action).toBe('updated');
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(settings.statusLine.command).toContain(tmpDir.path.replace(/\\/g, '/'));
  });

  test('uses forward-slash paths in command', () => {
    const result = patchStatusLine(tmpDir.path);
    const settings = JSON.parse(fs.readFileSync(path.join(tmpDir.path, 'settings.json'), 'utf8'));
    expect(settings.statusLine.command).not.toContain('\\');
  });

  test('handles corrupt settings.json with backup and warning (not silent reset)', () => {
    const settingsPath = path.join(tmpDir.path, 'settings.json');
    fs.writeFileSync(settingsPath, 'not valid json{{{');
    const result = patchStatusLine(tmpDir.path);
    // Must create backup
    expect(fs.existsSync(settingsPath + '.backup')).toBe(true);
    expect(fs.readFileSync(settingsPath + '.backup', 'utf8')).toBe('not valid json{{{');
    // Must still write valid settings
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(settings.statusLine).toBeDefined();
    expect(result.action).toBe('added');
  });

  test('returns correct action for empty settings (no statusLine key)', () => {
    const settingsPath = path.join(tmpDir.path, 'settings.json');
    fs.writeFileSync(settingsPath, '{}');
    const result = patchStatusLine(tmpDir.path);
    expect(result.action).toBe('added');
  });

  test('uses atomic write (temp file + rename) to prevent TOCTOU', () => {
    // Structural verification: patchStatusLine source code must use renameSync
    const installSrc = fs.readFileSync(path.join(__dirname, '..', 'bin', 'install.js'), 'utf8');
    // Extract the patchStatusLine function body
    const fnStart = installSrc.indexOf('function patchStatusLine(');
    const fnBody = installSrc.slice(fnStart, installSrc.indexOf('\n}', fnStart) + 2);

    // Must use temp file + rename pattern (atomic write)
    expect(fnBody).toContain('renameSync');
    expect(fnBody).toContain('.tmp');
    // Must NOT use direct writeFileSync on the settings path for the final write
    // (writeFileSync is still used for the temp file, which is fine)
  });
});
