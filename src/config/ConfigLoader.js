const fs = require('fs');
const path = require('path');
const os = require('os');
const JSON5 = require('json5');
const { validateConfig } = require('./ConfigSchema');
const { validateConfigPath } = require('../validation');

/**
 * Get the configuration file path
 * @returns {string} Path to config file
 */
function getConfigPath() {
  // Allow override via environment variable
  if (process.env.GSD_CONFIG_PATH) {
    // Validate path is within user-accessible directories
    // homedir: production config paths (~/.gsd/config.json)
    // tmpdir: test harness paths (createTempDir creates under os.tmpdir())
    const allowedBases = [os.homedir(), os.tmpdir()];
    for (const base of allowedBases) {
      const result = validateConfigPath(process.env.GSD_CONFIG_PATH, base);
      if (result.ok) {
        return result.value;
      }
    }
    throw new Error('GSD_CONFIG_PATH validation failed: path must be within home or temp directory');
  }

  // Default: ~/.gsd/config.json
  return path.join(os.homedir(), '.gsd', 'config.json');
}

/**
 * Get default configuration
 * @returns {object} Default config object
 */
function getDefaults() {
  return {
    version: 1,
    context_management: {
      // Note: autocompact_threshold removed - Claude Code controls this internally
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
}

/**
 * Create default config file with JSON5 comments
 * @param {string} configPath - Path to config file
 */
function createDefaultConfig(configPath) {
  const configDir = path.dirname(configPath);

  // Ensure directory exists
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- configDir from path.dirname(configPath), internal path construction
  if (!fs.existsSync(configDir)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- configDir from path.dirname(configPath), internal path construction
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Default config content with JSON5 comments
  const defaultContent = `{
  // Config version (for future migrations)
  version: 1,

  // Context window management
  context_management: {
    // Note: autocompact is controlled by Claude Code internally
    // Save state before compaction
    precompact_save_state: true,
  },

  // Workflow control
  workflow: {
    pause_between_tasks: false,
    pause_between_phases: true,
    auto_checkpoint_interval: 5,
  },

  // Subagent model selection
  subagents: {
    default_model: "sonnet",
    executor_model: "sonnet",
    verifier_model: "sonnet",
    researcher_model: "haiku",
  },

  // UI preferences
  ui: {
    show_progress_bar: true,
    show_context_usage: true,
    theme: "aidev",
  },
}
`;

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- configPath from getConfigPath(), internal path construction
  fs.writeFileSync(configPath, defaultContent, 'utf8');
}

/**
 * Load and validate configuration from file
 * @returns {object} Validated config object (with defaults applied)
 * @throws {Error} If config file has parse or validation errors
 */
function loadConfig() {
  const configPath = getConfigPath();

  // If config doesn't exist, create it with defaults
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- configPath from getConfigPath(), internal path construction
  if (!fs.existsSync(configPath)) {
    createDefaultConfig(configPath);
    return getDefaults();
  }

  // Read and parse config file
  let config;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- configPath from getConfigPath(), internal path construction
    const content = fs.readFileSync(configPath, 'utf8');
    config = JSON5.parse(content);
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(
        `Failed to parse config file ${configPath}:\n  ${err.message}`
      );
    }
    throw err;
  }

  // Validate config
  try {
    validateConfig(config);
  } catch (err) {
    throw new Error(
      `Invalid config in ${configPath}:\n  ${err.message}`
    );
  }

  return config;
}

/**
 * Get a config value using dot-separated path
 * @param {object} config - Config object
 * @param {string} path - Dot-separated path (e.g., 'context_management.autocompact_threshold')
 * @param {*} defaultValue - Value to return if path not found
 * @returns {*} Value at path or defaultValue
 */
function getConfigValue(config, path, defaultValue) {
  const parts = path.split('.');
  let value = config;
  for (const part of parts) {
    if (value == null || typeof value !== 'object') {
      return defaultValue;
    }
    // eslint-disable-next-line security/detect-object-injection -- part from split('.') on config path string, trusted internal key access
    value = value[part];
  }
  return value !== undefined ? value : defaultValue;
}

module.exports = {
  loadConfig,
  getConfigPath,
  getDefaults,
  getConfigValue
};
