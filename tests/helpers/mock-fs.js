/**
 * Test Helpers: Filesystem Mocking Utilities
 *
 * Provides utilities for creating temporary directories and files for tests.
 * All functions return cleanup functions that should be called in afterEach.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Creates a temporary directory in the system temp location
 * @returns {{ path: string, cleanup: function }} Directory path and cleanup function
 */
function createTempDir() {
  const tmpPath = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-test-'));

  const cleanup = () => {
    if (fs.existsSync(tmpPath)) {
      fs.rmSync(tmpPath, { recursive: true, force: true });
    }
  };

  return { path: tmpPath, cleanup };
}

/**
 * Creates a file in a temporary directory
 * @param {string} dir - Directory path
 * @param {string} name - File name
 * @param {string} content - File content
 * @returns {string} Full path to created file
 */
function createTempFile(dir, name, content) {
  const filePath = path.join(dir, name);
  const fileDir = path.dirname(filePath);

  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

/**
 * Creates a mock .planning directory structure
 * @param {string} dir - Base directory
 * @returns {string} Path to .planning directory
 */
function createMockPlanningDir(dir) {
  const planningPath = path.join(dir, '.planning');
  const phasesPath = path.join(planningPath, 'phases');

  fs.mkdirSync(phasesPath, { recursive: true });

  return planningPath;
}

/**
 * Creates a valid GSD config.json file
 * @param {string} dir - Directory to create config in
 * @param {object} overrides - Optional overrides for config properties
 * @returns {string} Path to created config file
 */
function createMockConfig(dir, overrides = {}) {
  const defaultConfig = {
    version: 1,
    context_management: {
      precompact_save_state: true
    },
    workflow: {
      pause_between_tasks: false,
      pause_between_phases: true,
      auto_checkpoint_interval: 5
    },
    subagents: {
      default_model: 'sonnet',
      executor_model: 'sonnet',
      verifier_model: 'sonnet',
      researcher_model: 'haiku'
    },
    ui: {
      show_progress_bar: true,
      show_context_usage: true,
      theme: 'aidev'
    }
  };

  const config = { ...defaultConfig, ...overrides };
  const configPath = path.join(dir, 'config.json');

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

  return configPath;
}

module.exports = {
  createTempDir,
  createTempFile,
  createMockPlanningDir,
  createMockConfig
};
