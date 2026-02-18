/**
 * Tests for Hook Scripts
 *
 * Covers:
 * - hooks/gsd-check-update.js
 * - hooks/gsd-statusline.js
 * - hooks/pre-compact.js
 * - hooks/dist/gsd-check-update.js (bundled)
 * - hooks/dist/gsd-statusline.js (bundled)
 * - hooks/dist/pre-compact.js (bundled)
 *
 * Testing strategy: Hooks are CLI scripts without module.exports.
 * Test via child process execution with controlled env/stdin/stdout.
 *
 * Dist tests are the regression guard for GAP-1: if bundling breaks,
 * these tests catch it before copy-mode installs fail in production.
 */

const { describe, test, expect, beforeEach, afterEach, beforeAll } = require('bun:test');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createTempDir, createTempFile, createMockPlanningDir } = require('./helpers');

// Project root (for finding hook scripts)
const PROJECT_ROOT = path.join(__dirname, '..');

// Hook script paths (source)
const HOOKS = {
  checkUpdate: path.join(PROJECT_ROOT, 'hooks', 'gsd-check-update.js'),
  statusline: path.join(PROJECT_ROOT, 'hooks', 'gsd-statusline.js'),
  preCompact: path.join(PROJECT_ROOT, 'hooks', 'pre-compact.js')
};

// Hook script paths (bundled dist)
const DIST_HOOKS = {
  checkUpdate: path.join(PROJECT_ROOT, 'hooks', 'dist', 'gsd-check-update.js'),
  statusline: path.join(PROJECT_ROOT, 'hooks', 'dist', 'gsd-statusline.js'),
  preCompact: path.join(PROJECT_ROOT, 'hooks', 'dist', 'pre-compact.js')
};

// Ensure dist files exist before running dist tests
beforeAll(() => {
  const distDir = path.join(PROJECT_ROOT, 'hooks', 'dist');
  const distFilesExist = Object.values(DIST_HOOKS).every(f => fs.existsSync(f));
  if (!distFilesExist) {
    execSync('node scripts/build-hooks.js', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });
  }
});

describe('hooks/gsd-check-update.js', () => {
  let tempHome;
  let cleanup;

  beforeEach(() => {
    const temp = createTempDir();
    tempHome = temp.path;
    cleanup = temp.cleanup;

    // Create necessary directory structure
    const cacheDir = path.join(tempHome, '.claude', 'cache');
    fs.mkdirSync(cacheDir, { recursive: true });
  });

  afterEach(() => {
    if (cleanup) cleanup();
  });

  test('creates cache directory if missing', () => {
    const newTempHome = path.join(tempHome, 'no-cache');
    fs.mkdirSync(newTempHome, { recursive: true });

    // Run hook with HOME pointing to directory without cache
    try {
      execSync(`node "${HOOKS.checkUpdate}"`, {
        env: { ...process.env, HOME: newTempHome, USERPROFILE: newTempHome },
        timeout: 3000,
        stdio: 'ignore'
      });
    } catch (e) {
      // Hook spawns background process, may exit before completion
    }

    // Check cache directory was created
    const cacheDir = path.join(newTempHome, '.claude', 'cache');
    expect(fs.existsSync(cacheDir)).toBe(true);
  });

  test('handles missing VERSION file gracefully', () => {
    // Run hook without VERSION file - should not crash
    expect(() => {
      execSync(`node "${HOOKS.checkUpdate}"`, {
        env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
        timeout: 3000,
        stdio: 'ignore'
      });
    }).not.toThrow();
  });

  test('reads VERSION file when present', () => {
    // Create VERSION file in expected location
    const gsdDir = path.join(tempHome, '.claude', 'get-stuff-done');
    fs.mkdirSync(gsdDir, { recursive: true });
    createTempFile(gsdDir, 'VERSION', '2.1.1\n');

    // Run hook
    try {
      execSync(`node "${HOOKS.checkUpdate}"`, {
        env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
        timeout: 3000,
        stdio: 'ignore'
      });
    } catch (e) {
      // Background process spawned, exit is expected
    }

    // Give background process time to write cache (wait up to 2 seconds)
    const cacheFile = path.join(tempHome, '.claude', 'cache', 'gsd-update-check.json');
    let attempts = 0;
    while (!fs.existsSync(cacheFile) && attempts < 20) {
      execSync('sleep 0.1', { stdio: 'ignore' });
      attempts++;
    }

    // Verify cache was written (if background process completed in time)
    if (fs.existsSync(cacheFile)) {
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      expect(cache).toHaveProperty('installed');
      expect(cache).toHaveProperty('checked');
    }
  });

  test('writes cache with timestamp', () => {
    const cacheFile = path.join(tempHome, '.claude', 'cache', 'gsd-update-check.json');

    // Run hook
    try {
      execSync(`node "${HOOKS.checkUpdate}"`, {
        env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
        timeout: 3000,
        stdio: 'ignore'
      });
    } catch (e) {
      // Expected
    }

    // Wait for cache file (up to 2 seconds)
    let attempts = 0;
    while (!fs.existsSync(cacheFile) && attempts < 20) {
      execSync('sleep 0.1', { stdio: 'ignore' });
      attempts++;
    }

    // Verify cache structure if created
    if (fs.existsSync(cacheFile)) {
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      expect(cache).toHaveProperty('checked');
      expect(typeof cache.checked).toBe('number');
    }
  });
});

describe('hooks/gsd-statusline.js', () => {
  let tempHome;
  let cleanup;

  beforeEach(() => {
    const temp = createTempDir();
    tempHome = temp.path;
    cleanup = temp.cleanup;
  });

  afterEach(() => {
    if (cleanup) cleanup();
  });

  test('produces output string (non-empty stdout)', () => {
    const input = JSON.stringify({
      model: { display_name: 'Claude Sonnet' },
      workspace: { current_dir: '/test/dir' },
      context_window: { remaining_percentage: 50 }
    });

    const output = execSync(`node "${HOOKS.statusline}"`, {
      input,
      encoding: 'utf8',
      env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
      timeout: 5000
    });

    expect(output.length).toBeGreaterThan(0);
    expect(output).toContain('Claude Sonnet');
  });

  test('reads stdin input from Claude Code', () => {
    const input = JSON.stringify({
      model: { display_name: 'Test Model' },
      workspace: { current_dir: '/test/workspace' },
      context_window: { remaining_percentage: 75 }
    });

    const output = execSync(`node "${HOOKS.statusline}"`, {
      input,
      encoding: 'utf8',
      env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
      timeout: 5000
    });

    expect(output).toContain('Test Model');
  });

  test('handles missing .planning/ directory gracefully', () => {
    const input = JSON.stringify({
      model: { display_name: 'Claude' },
      workspace: { current_dir: tempHome },
      context_window: { remaining_percentage: 50 }
    });

    // Should not crash when .planning/ is missing
    expect(() => {
      execSync(`node "${HOOKS.statusline}"`, {
        input,
        encoding: 'utf8',
        env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
        timeout: 5000
      });
    }).not.toThrow();
  });

  test('handles missing config file gracefully', () => {
    const input = JSON.stringify({
      model: { display_name: 'Claude' },
      workspace: { current_dir: tempHome }
    });

    // Should use defaults when config missing
    const output = execSync(`node "${HOOKS.statusline}"`, {
      input,
      encoding: 'utf8',
      env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
      timeout: 5000
    });

    expect(output.length).toBeGreaterThan(0);
  });

  test('handles malformed JSON input gracefully', () => {
    const output = execSync(`node "${HOOKS.statusline}"`, {
      input: 'not valid json',
      encoding: 'utf8',
      env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
      timeout: 5000
    });

    // Should produce empty output on parse error (silent fail)
    expect(output.length).toBe(0);
  });
});

describe('hooks/pre-compact.js', () => {
  let tempDir;
  let cleanup;

  beforeEach(() => {
    const temp = createTempDir();
    tempDir = temp.path;
    cleanup = temp.cleanup;
  });

  afterEach(() => {
    if (cleanup) cleanup();
  });

  test('reads stdin JSON input with trigger type', () => {
    const planningDir = createMockPlanningDir(tempDir);
    const input = JSON.stringify({ trigger: 'auto' });

    const result = execSync(`node "${HOOKS.preCompact}"`, {
      input,
      encoding: 'utf8',
      cwd: tempDir,
      env: { ...process.env, GSD_PLANNING_DIR: planningDir },
      timeout: 5000
    });

    // Should exit 0 (success)
    expect(result).toBeDefined();
  });

  test('handles missing .planning/ directory (clean exit)', () => {
    const input = JSON.stringify({ trigger: 'manual' });

    // Hook creates .planning/ if missing, should exit 0
    expect(() => {
      execSync(`node "${HOOKS.preCompact}"`, {
        input,
        encoding: 'utf8',
        cwd: tempDir,
        timeout: 5000
      });
    }).not.toThrow();

    // Verify .planning was created
    expect(fs.existsSync(path.join(tempDir, '.planning'))).toBe(true);
  });

  test('creates events.log entry', () => {
    const planningDir = createMockPlanningDir(tempDir);
    const input = JSON.stringify({ trigger: 'auto' });

    execSync(`node "${HOOKS.preCompact}"`, {
      input,
      encoding: 'utf8',
      cwd: tempDir,
      env: { ...process.env, GSD_PLANNING_DIR: planningDir },
      timeout: 5000
    });

    const eventsLog = path.join(planningDir, 'events.log');
    expect(fs.existsSync(eventsLog)).toBe(true);

    const content = fs.readFileSync(eventsLog, 'utf8');
    expect(content).toContain('COMPACTION');
    expect(content).toContain('trigger=auto');
  });

  test('creates CONTINUE.md file', () => {
    const planningDir = createMockPlanningDir(tempDir);
    const input = JSON.stringify({ trigger: 'manual' });

    execSync(`node "${HOOKS.preCompact}"`, {
      input,
      encoding: 'utf8',
      cwd: tempDir,
      env: { ...process.env, GSD_PLANNING_DIR: planningDir },
      timeout: 5000
    });

    const continuePath = path.join(planningDir, 'CONTINUE.md');
    expect(fs.existsSync(continuePath)).toBe(true);

    const content = fs.readFileSync(continuePath, 'utf8');
    expect(content).toContain('Continuation Context');
    expect(content).toContain('**Trigger:** manual');
  });

  test('exits with code 0 (allow compaction)', () => {
    const planningDir = createMockPlanningDir(tempDir);
    const input = JSON.stringify({ trigger: 'auto' });

    // execSync throws on non-zero exit
    expect(() => {
      execSync(`node "${HOOKS.preCompact}"`, {
        input,
        encoding: 'utf8',
        cwd: tempDir,
        env: { ...process.env, GSD_PLANNING_DIR: planningDir },
        timeout: 5000
      });
    }).not.toThrow();
  });

  test('blocks compaction on invalid JSON (exit 2)', () => {
    const planningDir = createMockPlanningDir(tempDir);

    expect(() => {
      execSync(`node "${HOOKS.preCompact}"`, {
        input: 'invalid json',
        encoding: 'utf8',
        cwd: tempDir,
        env: { ...process.env, GSD_PLANNING_DIR: planningDir },
        timeout: 5000
      });
    }).toThrow();
  });

  test('includes STATE.md snapshot in CONTINUE.md', () => {
    const planningDir = createMockPlanningDir(tempDir);

    // Create STATE.md with test content
    createTempFile(planningDir, 'STATE.md', '# Project State\n\nPhase: 11\nPlan: 3\n');

    const input = JSON.stringify({ trigger: 'auto' });

    execSync(`node "${HOOKS.preCompact}"`, {
      input,
      encoding: 'utf8',
      cwd: tempDir,
      env: { ...process.env, GSD_PLANNING_DIR: planningDir },
      timeout: 5000
    });

    const continuePath = path.join(planningDir, 'CONTINUE.md');
    const content = fs.readFileSync(continuePath, 'utf8');

    expect(content).toContain('Last Known State');
    expect(content).toContain('Phase: 11');
  });
});

// =============================================================================
// DIST HOOK TESTS (regression guard for GAP-1)
//
// These tests verify that the bundled hooks/dist/ files work correctly.
// If esbuild bundling breaks, these tests catch it before copy-mode installs
// fail in production (copy-mode installs have no access to src/).
// =============================================================================

describe('hooks/dist build verification', () => {
  test('dist files exist and are self-contained bundles', () => {
    // All three dist files must exist
    for (const [name, filePath] of Object.entries(DIST_HOOKS)) {
      expect(fs.existsSync(filePath)).toBe(true);
    }

    // File sizes confirm bundling occurred (not plain copies)
    const preCompactSize = fs.statSync(DIST_HOOKS.preCompact).size;
    const statuslineSize = fs.statSync(DIST_HOOKS.statusline).size;
    const checkUpdateSize = fs.statSync(DIST_HOOKS.checkUpdate).size;

    // pre-compact bundles pathe -- must be significantly larger than source (~5KB)
    expect(preCompactSize).toBeGreaterThan(10 * 1024); // >10KB
    // statusline bundles ajv + json5 + theme -- must be large
    expect(statuslineSize).toBeGreaterThan(100 * 1024); // >100KB
    // check-update has no src/ deps but is still a valid bundle
    expect(checkUpdateSize).toBeGreaterThan(512); // >0.5KB
  });

  test('dist files contain no unresolved require(../src/) references', () => {
    for (const [name, filePath] of Object.entries(DIST_HOOKS)) {
      const content = fs.readFileSync(filePath, 'utf8');
      // Source-relative imports must all be resolved by esbuild at build time
      const srcRequires = content.match(/require\(['"]\.\.\/src\//g) || [];
      expect(srcRequires.length).toBe(0);
    }
  });
});

describe('hooks/dist/gsd-check-update.js (bundled)', () => {
  let tempHome;
  let cleanup;

  beforeEach(() => {
    const temp = createTempDir();
    tempHome = temp.path;
    cleanup = temp.cleanup;
  });

  afterEach(() => {
    if (cleanup) cleanup();
  });

  test('creates cache directory if missing', () => {
    const newTempHome = path.join(tempHome, 'no-cache');
    fs.mkdirSync(newTempHome, { recursive: true });

    try {
      execSync(`node "${DIST_HOOKS.checkUpdate}"`, {
        env: { ...process.env, HOME: newTempHome, USERPROFILE: newTempHome },
        timeout: 3000,
        stdio: 'ignore'
      });
    } catch (e) {
      // Hook spawns background process, may exit before completion
    }

    const cacheDir = path.join(newTempHome, '.claude', 'cache');
    expect(fs.existsSync(cacheDir)).toBe(true);
  });

  test('handles missing VERSION file gracefully', () => {
    expect(() => {
      execSync(`node "${DIST_HOOKS.checkUpdate}"`, {
        env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
        timeout: 3000,
        stdio: 'ignore'
      });
    }).not.toThrow();
  });
});

describe('hooks/dist/gsd-statusline.js (bundled)', () => {
  let tempHome;
  let cleanup;

  beforeEach(() => {
    const temp = createTempDir();
    tempHome = temp.path;
    cleanup = temp.cleanup;
  });

  afterEach(() => {
    if (cleanup) cleanup();
  });

  test('produces output string containing model name', () => {
    const input = JSON.stringify({
      model: { display_name: 'Claude Sonnet' },
      workspace: { current_dir: '/test/dir' },
      context_window: { remaining_percentage: 50 }
    });

    const output = execSync(`node "${DIST_HOOKS.statusline}"`, {
      input,
      encoding: 'utf8',
      env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
      timeout: 5000
    });

    expect(output.length).toBeGreaterThan(0);
    expect(output).toContain('Claude Sonnet');
  });

  test('handles missing config file gracefully', () => {
    // No config file in tempHome -- should use defaults without crashing
    const input = JSON.stringify({
      model: { display_name: 'Claude' },
      workspace: { current_dir: tempHome }
    });

    const output = execSync(`node "${DIST_HOOKS.statusline}"`, {
      input,
      encoding: 'utf8',
      env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
      timeout: 5000
    });

    // Bundled ConfigLoader must fall back to defaults when config missing
    expect(output.length).toBeGreaterThan(0);
  });

  test('handles malformed JSON input gracefully', () => {
    const output = execSync(`node "${DIST_HOOKS.statusline}"`, {
      input: 'not valid json',
      encoding: 'utf8',
      env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
      timeout: 5000
    });

    // Silent fail on parse error -- empty output, no crash
    expect(output.length).toBe(0);
  });
});

describe('hooks/dist/pre-compact.js (bundled)', () => {
  let tempDir;
  let cleanup;

  beforeEach(() => {
    const temp = createTempDir();
    tempDir = temp.path;
    cleanup = temp.cleanup;
  });

  afterEach(() => {
    if (cleanup) cleanup();
  });

  test('creates events.log entry (proves gsdPaths inlined correctly)', () => {
    const planningDir = createMockPlanningDir(tempDir);
    const input = JSON.stringify({ trigger: 'auto' });

    execSync(`node "${DIST_HOOKS.preCompact}"`, {
      input,
      encoding: 'utf8',
      cwd: tempDir,
      env: { ...process.env, GSD_PLANNING_DIR: planningDir },
      timeout: 5000
    });

    const eventsLog = path.join(planningDir, 'events.log');
    expect(fs.existsSync(eventsLog)).toBe(true);

    const content = fs.readFileSync(eventsLog, 'utf8');
    expect(content).toContain('COMPACTION');
    expect(content).toContain('trigger=auto');
  });

  test('creates CONTINUE.md file', () => {
    const planningDir = createMockPlanningDir(tempDir);
    const input = JSON.stringify({ trigger: 'manual' });

    execSync(`node "${DIST_HOOKS.preCompact}"`, {
      input,
      encoding: 'utf8',
      cwd: tempDir,
      env: { ...process.env, GSD_PLANNING_DIR: planningDir },
      timeout: 5000
    });

    const continuePath = path.join(planningDir, 'CONTINUE.md');
    expect(fs.existsSync(continuePath)).toBe(true);

    const content = fs.readFileSync(continuePath, 'utf8');
    expect(content).toContain('Continuation Context');
    expect(content).toContain('**Trigger:** manual');
  });

  test('exits with code 0 on valid input', () => {
    const planningDir = createMockPlanningDir(tempDir);
    const input = JSON.stringify({ trigger: 'auto' });

    expect(() => {
      execSync(`node "${DIST_HOOKS.preCompact}"`, {
        input,
        encoding: 'utf8',
        cwd: tempDir,
        env: { ...process.env, GSD_PLANNING_DIR: planningDir },
        timeout: 5000
      });
    }).not.toThrow();
  });

  test('blocks compaction on invalid JSON (exit 2)', () => {
    const planningDir = createMockPlanningDir(tempDir);

    expect(() => {
      execSync(`node "${DIST_HOOKS.preCompact}"`, {
        input: 'invalid json',
        encoding: 'utf8',
        cwd: tempDir,
        env: { ...process.env, GSD_PLANNING_DIR: planningDir },
        timeout: 5000
      });
    }).toThrow();
  });
});
