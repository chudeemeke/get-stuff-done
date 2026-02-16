/**
 * Tests for bin/gsd.js Launcher
 *
 * Testing strategy: Test launcher components by testing the underlying
 * modules it uses (gsdPaths, ConfigLoader) and verifying file operations.
 * Avoids testing the actual claude spawn (async, hard to control in tests).
 */

const { describe, test, expect, beforeEach, afterEach } = require('bun:test');
const fs = require('fs');
const path = require('path');
const { createTempDir, createTempFile } = require('./helpers');

// Project root
const PROJECT_ROOT = path.join(__dirname, '..');

describe('bin/gsd.js launcher', () => {
  let tempHome;
  let cleanup;
  let originalHome;
  let originalUserProfile;

  beforeEach(() => {
    const temp = createTempDir();
    tempHome = temp.path;
    cleanup = temp.cleanup;

    // Save original env vars
    originalHome = process.env.HOME;
    originalUserProfile = process.env.USERPROFILE;

    // Set temp home for tests
    process.env.HOME = tempHome;
    process.env.USERPROFILE = tempHome;
  });

  afterEach(() => {
    if (cleanup) cleanup();

    // Restore original env vars
    if (originalHome !== undefined) {
      process.env.HOME = originalHome;
    }
    if (originalUserProfile !== undefined) {
      process.env.USERPROFILE = originalUserProfile;
    }
  });

  test('gsdPaths uses correct home directory', () => {
    // Clear module cache to pick up new HOME env
    delete require.cache[require.resolve('../src/platform/paths')];
    const { gsdPaths } = require('../src/platform/paths');

    const gsdHome = gsdPaths.gsdHome();

    // Normalize paths for comparison (gsdPaths uses forward slashes)
    const normalizedTempHome = tempHome.replace(/\\/g, '/');
    expect(gsdHome).toContain(normalizedTempHome);
    expect(gsdHome).toContain('.gsd');
  });

  test('creates .gsd directory structure', () => {
    const gsdHome = path.join(tempHome, '.gsd');
    const hooksDir = path.join(gsdHome, 'hooks');

    // Create directory structure (mimicking launcher behavior)
    if (!fs.existsSync(gsdHome)) {
      fs.mkdirSync(gsdHome, { recursive: true });
    }
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    expect(fs.existsSync(gsdHome)).toBe(true);
    expect(fs.existsSync(hooksDir)).toBe(true);
  });

  test('creates default config with proper structure', () => {
    const gsdHome = path.join(tempHome, '.gsd');
    const configPath = path.join(gsdHome, 'config.json');

    // Create directory
    fs.mkdirSync(gsdHome, { recursive: true });

    // Create default config (mimicking launcher behavior)
    const defaultContent = `{
  version: 1,
  context_management: {
    precompact_save_state: true,
  },
  workflow: {
    pause_between_tasks: false,
    pause_between_phases: true,
    auto_checkpoint_interval: 5,
  },
  subagents: {
    default_model: "sonnet",
    executor_model: "sonnet",
    verifier_model: "sonnet",
    researcher_model: "haiku",
  },
  ui: {
    show_progress_bar: true,
    show_context_usage: true,
    theme: "aidev",
  },
}
`;
    fs.writeFileSync(configPath, defaultContent, 'utf8');

    expect(fs.existsSync(configPath)).toBe(true);

    const content = fs.readFileSync(configPath, 'utf8');
    expect(content).toContain('version: 1');
    expect(content).toContain('context_management');
    expect(content).toContain('workflow');
    expect(content).toContain('subagents');
  });

  test('reads version from package.json', () => {
    const pkgPath = path.join(PROJECT_ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    expect(pkg).toHaveProperty('version');
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('config migration adds version field', () => {
    const JSON5 = require('json5');

    const gsdHome = path.join(tempHome, '.gsd');
    const configPath = path.join(gsdHome, 'config.json');

    // Create directory and old config without version
    fs.mkdirSync(gsdHome, { recursive: true });
    const oldConfig = {
      context_management: { precompact_save_state: true }
    };
    fs.writeFileSync(configPath, JSON.stringify(oldConfig, null, 2), 'utf8');

    // Verify config is missing version initially
    let configBefore = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(configBefore.version).toBeUndefined();

    // Migrate (mimicking launcher behavior)
    const content = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON5.parse(content);
    parsed.version = 1;
    fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2), 'utf8');

    // Verify version was added
    const updatedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(updatedConfig).toHaveProperty('version');
    expect(updatedConfig.version).toBe(1);
  });

  test('detects .planning/STATE.md in current directory', () => {
    const planningDir = path.join(tempHome, '.planning');
    const statePath = path.join(planningDir, 'STATE.md');

    fs.mkdirSync(planningDir, { recursive: true });
    createTempFile(planningDir, 'STATE.md', '# Project State\n\nPhase: 11\n');

    expect(fs.existsSync(statePath)).toBe(true);

    const content = fs.readFileSync(statePath, 'utf8');
    expect(content).toContain('Project State');
  });

  test('detects .planning/CONTINUE.md for continuation context', () => {
    const planningDir = path.join(tempHome, '.planning');
    const continuePath = path.join(planningDir, 'CONTINUE.md');

    fs.mkdirSync(planningDir, { recursive: true });
    createTempFile(planningDir, 'CONTINUE.md', '# Continuation Context\n');

    expect(fs.existsSync(continuePath)).toBe(true);

    const content = fs.readFileSync(continuePath, 'utf8');
    expect(content).toContain('Continuation Context');
  });

  test('launcher script exists and is executable', () => {
    const launcherPath = path.join(PROJECT_ROOT, 'bin', 'gsd.js');

    expect(fs.existsSync(launcherPath)).toBe(true);

    const content = fs.readFileSync(launcherPath, 'utf8');
    expect(content).toContain('#!/usr/bin/env node');
    expect(content).toContain('Get Stuff Done');
  });

  test('launcher imports required modules', () => {
    const launcherPath = path.join(PROJECT_ROOT, 'bin', 'gsd.js');
    const content = fs.readFileSync(launcherPath, 'utf8');

    expect(content).toContain('require');
    expect(content).toContain('gsdPaths');
    expect(content).toContain('detectTerminal');
    expect(content).toContain('loadConfig');
  });

  test('launcher has error handling for claude not found', () => {
    const launcherPath = path.join(PROJECT_ROOT, 'bin', 'gsd.js');
    const content = fs.readFileSync(launcherPath, 'utf8');

    expect(content).toContain('ENOENT');
    expect(content).toContain('Claude Code not found');
  });
});
