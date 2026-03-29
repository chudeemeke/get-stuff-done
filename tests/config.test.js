/**
 * Unit Tests: Config Module
 *
 * Tests ConfigLoader and ConfigSchema for:
 * - Loading defaults when no config exists
 * - Parsing JSON5 with comments, trailing commas
 * - Config validation and error messages
 * - Path traversal and nested value access
 */

const { describe, test, expect, beforeEach, afterEach } = require('bun:test');
const os = require('os');
const path = require('path');
const { loadConfig, getConfigPath, getDefaults, getConfigValue } = require('../overlay/src/config/ConfigLoader');
const { validateConfig, configSchema } = require('../overlay/src/config/ConfigSchema');
const { createTempDir, createTempFile, mockEnv } = require('./helpers');

describe('ConfigLoader', () => {
  let tempDir;
  let cleanup;
  let restoreEnv;

  beforeEach(() => {
    const temp = createTempDir();
    tempDir = temp.path;
    cleanup = temp.cleanup;
  });

  afterEach(() => {
    cleanup();
    if (restoreEnv) {
      restoreEnv();
      restoreEnv = null;
    }
  });

  describe('getConfigPath()', () => {
    test('uses GSD_CONFIG_PATH env var when set', () => {
      const homePath = path.join(os.homedir(), '.gsd-test', 'config.json');
      restoreEnv = mockEnv({ GSD_CONFIG_PATH: homePath });
      const result = getConfigPath();
      expect(result).toBe(homePath);
    });

    test('rejects GSD_CONFIG_PATH with path traversal', () => {
      restoreEnv = mockEnv({ GSD_CONFIG_PATH: '/etc/shadow' });
      expect(() => getConfigPath()).toThrow('GSD_CONFIG_PATH validation failed');
    });

    test('accepts GSD_CONFIG_PATH within tmpdir', () => {
      const tmpPath = path.join(os.tmpdir(), 'gsd-test', 'config.json');
      restoreEnv = mockEnv({ GSD_CONFIG_PATH: tmpPath });
      const result = getConfigPath();
      expect(result).toBe(tmpPath);
    });

    test('defaults to ~/.gsd/config.json when env var not set', () => {
      // Delete the env var to ensure it's not set
      const originalValue = process.env.GSD_CONFIG_PATH;
      delete process.env.GSD_CONFIG_PATH;

      const path = getConfigPath();
      expect(path).toMatch(/\.gsd[/\\]config\.json$/);

      // Restore if it was set
      if (originalValue !== undefined) {
        process.env.GSD_CONFIG_PATH = originalValue;
      }
    });
  });

  describe('getDefaults()', () => {
    test('returns object with version:1', () => {
      const defaults = getDefaults();
      expect(defaults.version).toBe(1);
    });

    test('returns all expected sections', () => {
      const defaults = getDefaults();
      expect(defaults).toHaveProperty('context_management');
      expect(defaults).toHaveProperty('workflow');
      expect(defaults).toHaveProperty('subagents');
      expect(defaults).toHaveProperty('ui');
    });

    test('context_management has precompact_save_state', () => {
      const defaults = getDefaults();
      expect(defaults.context_management).toHaveProperty('precompact_save_state', true);
    });

    test('workflow has pause_between_tasks and pause_between_phases', () => {
      const defaults = getDefaults();
      expect(defaults.workflow.pause_between_tasks).toBe(false);
      expect(defaults.workflow.pause_between_phases).toBe(true);
    });

    test('subagents has model selections', () => {
      const defaults = getDefaults();
      expect(defaults.subagents.default_model).toBe('sonnet');
      expect(defaults.subagents.executor_model).toBe('sonnet');
      expect(defaults.subagents.verifier_model).toBe('sonnet');
      expect(defaults.subagents.researcher_model).toBe('haiku');
    });

    test('ui has theme and progress settings', () => {
      const defaults = getDefaults();
      expect(defaults.ui.show_progress_bar).toBe(true);
      expect(defaults.ui.show_context_usage).toBe(true);
      expect(defaults.ui.theme).toBe('aidev');
    });
  });

  describe('loadConfig()', () => {
    test('returns defaults when config file does not exist', () => {
      const nonExistentPath = `${tempDir}/nonexistent/config.json`;
      restoreEnv = mockEnv({ GSD_CONFIG_PATH: nonExistentPath });

      const config = loadConfig();
      expect(config.version).toBe(1);
      expect(config).toHaveProperty('workflow');
    });

    test('parses a valid JSON5 config file', () => {
      const configContent = `{
  version: 1,
  workflow: {
    pause_between_tasks: true,
  },
}`;
      const configPath = createTempFile(tempDir, 'config.json', configContent);
      restoreEnv = mockEnv({ GSD_CONFIG_PATH: configPath });

      const config = loadConfig();
      expect(config.version).toBe(1);
      expect(config.workflow.pause_between_tasks).toBe(true);
    });

    test('handles JSON5 features (comments, trailing commas, unquoted keys)', () => {
      const configContent = `{
  // This is a comment
  version: 1,
  workflow: {
    pause_between_tasks: false, // Trailing comma on next line
  },
  ui: {
    theme: "aidev",
  },
}`;
      const configPath = createTempFile(tempDir, 'config.json', configContent);
      restoreEnv = mockEnv({ GSD_CONFIG_PATH: configPath });

      const config = loadConfig();
      expect(config.version).toBe(1);
      expect(config.workflow.pause_between_tasks).toBe(false);
      expect(config.ui.theme).toBe('aidev');
    });

    test('throws on malformed JSON5', () => {
      const configContent = `{ version: 1, broken: }`;
      const configPath = createTempFile(tempDir, 'config.json', configContent);
      restoreEnv = mockEnv({ GSD_CONFIG_PATH: configPath });

      expect(() => loadConfig()).toThrow('Failed to parse config file');
    });

    test('throws on invalid config (wrong version)', () => {
      const configContent = `{ version: 99 }`;
      const configPath = createTempFile(tempDir, 'config.json', configContent);
      restoreEnv = mockEnv({ GSD_CONFIG_PATH: configPath });

      expect(() => loadConfig()).toThrow('Invalid config');
    });
  });

  describe('getConfigValue()', () => {
    test('traverses nested paths', () => {
      const config = {
        workflow: {
          pause_between_tasks: true,
          auto_checkpoint_interval: 10
        }
      };

      const value = getConfigValue(config, 'workflow.pause_between_tasks', false);
      expect(value).toBe(true);
    });

    test('returns defaultValue for missing paths', () => {
      const config = { workflow: {} };
      const value = getConfigValue(config, 'workflow.missing_field', 'default');
      expect(value).toBe('default');
    });

    test('returns defaultValue for null intermediate values', () => {
      const config = { workflow: null };
      const value = getConfigValue(config, 'workflow.pause_between_tasks', 'fallback');
      expect(value).toBe('fallback');
    });

    test('returns defaultValue for undefined values', () => {
      const config = { workflow: { pause_between_tasks: undefined } };
      const value = getConfigValue(config, 'workflow.pause_between_tasks', 'default');
      expect(value).toBe('default');
    });

    test('handles deep nesting', () => {
      const config = {
        a: {
          b: {
            c: {
              d: 'deep-value'
            }
          }
        }
      };
      const value = getConfigValue(config, 'a.b.c.d', 'default');
      expect(value).toBe('deep-value');
    });

    test('handles array-like numeric keys', () => {
      const config = {
        items: {
          0: 'first',
          1: 'second'
        }
      };
      const value = getConfigValue(config, 'items.0', 'default');
      expect(value).toBe('first');
    });
  });
});

describe('ConfigSchema', () => {
  test('validateConfig() accepts valid config matching schema', () => {
    const validConfig = {
      version: 1,
      workflow: {
        pause_between_tasks: false,
        pause_between_phases: true,
        auto_checkpoint_interval: 5
      },
      subagents: {
        default_model: 'sonnet'
      }
    };

    expect(() => validateConfig(validConfig)).not.toThrow();
  });

  test('rejects config with wrong version', () => {
    const invalidConfig = {
      version: 99
    };

    expect(() => validateConfig(invalidConfig)).toThrow('must be 1');
  });

  test('rejects config with unknown top-level fields', () => {
    const invalidConfig = {
      version: 1,
      unknown_field: 'value'
    };

    expect(() => validateConfig(invalidConfig)).toThrow('Unknown config key');
  });

  test('rejects config with unknown nested fields', () => {
    const invalidConfig = {
      version: 1,
      workflow: {
        pause_between_tasks: false,
        unknown_nested: 'value'
      }
    };

    expect(() => validateConfig(invalidConfig)).toThrow('Unknown config key');
  });

  test('rejects invalid types (string where number expected)', () => {
    const invalidConfig = {
      version: 1,
      workflow: {
        auto_checkpoint_interval: 'not-a-number'
      }
    };

    expect(() => validateConfig(invalidConfig)).toThrow('must be number');
  });

  test('rejects invalid types (number where boolean expected)', () => {
    const invalidConfig = {
      version: 1,
      workflow: {
        pause_between_tasks: 123
      }
    };

    expect(() => validateConfig(invalidConfig)).toThrow('must be boolean');
  });

  test('rejects auto_checkpoint_interval below minimum', () => {
    const invalidConfig = {
      version: 1,
      workflow: {
        auto_checkpoint_interval: 0
      }
    };

    expect(() => validateConfig(invalidConfig)).toThrow('must be >= 1');
  });

  test('rejects auto_checkpoint_interval above maximum', () => {
    const invalidConfig = {
      version: 1,
      workflow: {
        auto_checkpoint_interval: 999
      }
    };

    expect(() => validateConfig(invalidConfig)).toThrow('must be <= 60');
  });

  test('error message includes field path', () => {
    const invalidConfig = {
      version: 1,
      workflow: {
        pause_between_tasks: 'not-boolean'
      }
    };

    try {
      validateConfig(invalidConfig);
      expect(true).toBe(false); // Should not reach here
    } catch (err) {
      expect(err.message).toMatch(/workflow\/pause_between_tasks/);
    }
  });

  test('configSchema export is a valid JSON Schema object', () => {
    expect(configSchema).toHaveProperty('type', 'object');
    expect(configSchema).toHaveProperty('properties');
    expect(configSchema).toHaveProperty('required');
    expect(configSchema.required).toContain('version');
  });

  test('missing required field (version) is rejected', () => {
    const invalidConfig = {
      workflow: {
        pause_between_tasks: false
      }
    };

    expect(() => validateConfig(invalidConfig)).toThrow('Missing required field');
  });

  test('accepts gsd.role maintainer as valid', () => {
    const validConfig = {
      version: 1,
      gsd: {
        role: 'maintainer'
      }
    };

    expect(() => validateConfig(validConfig)).not.toThrow();
  });

  test('accepts gsd.role consumer as valid', () => {
    const validConfig = {
      version: 1,
      gsd: {
        role: 'consumer'
      }
    };

    expect(() => validateConfig(validConfig)).not.toThrow();
  });

  test('rejects gsd.role with invalid enum value', () => {
    const invalidConfig = {
      version: 1,
      gsd: {
        role: 'invalid'
      }
    };

    expect(() => validateConfig(invalidConfig)).toThrow();
  });

  test('accepts config without gsd section', () => {
    const validConfig = {
      version: 1
    };

    expect(() => validateConfig(validConfig)).not.toThrow();
  });
});
