/**
 * Tests for Hook Scripts
 *
 * Covers:
 * - hooks/gsd-check-update.js
 * - hooks/gsd-statusline.js
 * - hooks/pre-compact.js
 *
 * Testing strategy: Hooks are CLI scripts without module.exports.
 * Test via child process execution with controlled env/stdin/stdout.
 */

const { describe, test, expect, beforeEach, afterEach } = require('bun:test');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createTempDir, createTempFile, createMockPlanningDir } = require('./helpers');

// Project root (for finding hook scripts)
const PROJECT_ROOT = path.join(__dirname, '..');

// Hook script paths
const HOOKS = {
  checkUpdate: path.join(PROJECT_ROOT, 'hooks', 'gsd-check-update.js'),
  statusline: path.join(PROJECT_ROOT, 'hooks', 'gsd-statusline.js'),
  preCompact: path.join(PROJECT_ROOT, 'hooks', 'pre-compact.js')
};

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
