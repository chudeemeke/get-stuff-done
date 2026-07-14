/**
 * GSD Tools Tests - Config
 *
 * Tests config.cjs functions both via subprocess and via direct import with a
 * process boundary capture for coverage tracking.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const ORIGINAL_COMPAT_PACKAGE_ROOT = process.env.GSD_COMPAT_PACKAGE_ROOT;
const { resolveCompatPackageRoot } = require('./helpers/compat-package-root.cjs');
const COMPAT_PACKAGE_ROOT = resolveCompatPackageRoot();
const { createGsdToolsHelpers, createTempProject, cleanup, runWithTimeout } = require('./helpers.cjs');
const { runGsdTools, runGsdToolsDirect } = createGsdToolsHelpers(COMPAT_PACKAGE_ROOT);

// Direct import for in-process coverage tracking
const configCommands = require(path.join(COMPAT_PACKAGE_ROOT, 'bin', 'lib', 'config.cjs'));
const { cmdConfigEnsureSection, cmdConfigSet, cmdConfigGet, VALID_CONFIG_KEYS } = configCommands;
const TOOLS_PATH = path.join(COMPAT_PACKAGE_ROOT, 'bin', 'gsd-tools.cjs');
const { captureCommandOutput } = require('./helpers/capture-command-output.cjs');

function canonicalKey(key) {
  if (VALID_CONFIG_KEYS instanceof Set) {
    assert.ok(VALID_CONFIG_KEYS.has(key), `${key} must remain in the exported config schema`);
  }
  return key;
}

describe('captureCommandOutput', () => {
  test('candidate package resolution does not mutate process environment', () => {
    assert.strictEqual(process.env.GSD_COMPAT_PACKAGE_ROOT, ORIGINAL_COMPAT_PACKAGE_ROOT);
  });

  test('normalizes natural return and explicit exit zero as success', () => {
    const returned = captureCommandOutput(() => {
      fs.writeSync(1, 'returned');
      return 'value';
    });
    const exited = captureCommandOutput(() => {
      process.stdout.write('exited');
      process.exit(0);
    });

    assert.deepStrictEqual(returned, {
      exitCode: 0,
      rawExitCode: null,
      stdout: 'returned',
      stderr: '',
      returnValue: 'value',
    });
    assert.deepStrictEqual(exited, {
      exitCode: 0,
      rawExitCode: 0,
      stdout: 'exited',
      stderr: '',
      returnValue: undefined,
    });
  });

  test('unwinds immediately at a non-zero exit boundary', () => {
    const result = captureCommandOutput(() => {
      process.stderr.write('invalid');
      process.exit(2);
      process.stdout.write('unreachable');
    });

    assert.strictEqual(result.exitCode, 2);
    assert.strictEqual(result.rawExitCode, 2);
    assert.strictEqual(result.stdout, '');
    assert.strictEqual(result.stderr, 'invalid');
  });

  test('retains the first non-zero exit when command code catches the sentinel', () => {
    let continued = false;
    const result = captureCommandOutput(() => {
      try {
        process.exit(2);
      } catch {
        continued = true;
      }
      process.exit(0);
    });

    assert.strictEqual(continued, true);
    assert.strictEqual(result.exitCode, 2);
    assert.strictEqual(result.rawExitCode, 2);
  });

  test('restores process globals when the command throws', () => {
    const originalExit = process.exit;
    const originalStdoutWrite = process.stdout.write;
    const originalStderrWrite = process.stderr.write;
    const originalFsWriteSync = fs.writeSync;
    const failure = new Error('assertion failed');

    assert.throws(() => captureCommandOutput(() => { throw failure; }), failure);
    assert.strictEqual(process.exit, originalExit);
    assert.strictEqual(process.stdout.write, originalStdoutWrite);
    assert.strictEqual(process.stderr.write, originalStderrWrite);
    assert.strictEqual(fs.writeSync, originalFsWriteSync);
  });
});

const captureOutput = captureCommandOutput;

function runConfigEnsureSection(tmpDir, env) {
  const result = runWithTimeout(process.execPath, [TOOLS_PATH, 'config-ensure-section'], {
    cwd: tmpDir,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
  });

  if (result.status !== 0 || result.timedOut) {
    assert.fail(`Command failed: ${result.stderr || result.error?.message || result.status}`);
  }

  return result.stdout;
}

// ============================================================================
// cmdConfigEnsureSection — direct calls (success paths)
// ============================================================================

describe('cmdConfigEnsureSection (direct)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('creates config.json with default structure', () => {
    const { exitCode, stdout } = captureOutput(() => cmdConfigEnsureSection(tmpDir, false));
    assert.strictEqual(exitCode, 0);

    const output = JSON.parse(stdout);
    assert.strictEqual(output.created, true);
    assert.strictEqual(output.path, '.planning/config.json');

    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
    assert.strictEqual(config.model_profile, 'balanced');
    assert.strictEqual(config.commit_docs, true);
    assert.strictEqual(config.search_gitignored, false);
    assert.strictEqual(config.git.branching_strategy, 'none');
    assert.strictEqual(config.git.phase_branch_template, 'gsd/phase-{phase}-{slug}');
    assert.strictEqual(config.git.milestone_branch_template, 'gsd/{milestone}-{slug}');
    assert.strictEqual(config.parallelization, true);
    assert.strictEqual(typeof config.brave_search, 'boolean');
    assert.ok(config.workflow);
    assert.strictEqual(config.workflow.research, true);
    assert.strictEqual(config.workflow.plan_check, true);
    assert.strictEqual(config.workflow.verifier, true);
    assert.strictEqual(config.workflow.nyquist_validation, true);
  });

  test('returns already_exists when config exists', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ custom: true }), 'utf-8');

    const { exitCode, stdout } = captureOutput(() => cmdConfigEnsureSection(tmpDir, false));
    assert.strictEqual(exitCode, 0);

    const output = JSON.parse(stdout);
    assert.strictEqual(output.created, false);
    assert.strictEqual(output.reason, 'already_exists');

    // Original content preserved
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    assert.strictEqual(config.custom, true);
  });

  test('creates .planning directory if missing', () => {
    fs.rmSync(path.join(tmpDir, '.planning'), { recursive: true, force: true });

    const { exitCode } = captureOutput(() => cmdConfigEnsureSection(tmpDir, false));
    assert.strictEqual(exitCode, 0);
    assert.ok(fs.existsSync(path.join(tmpDir, '.planning', 'config.json')));
  });

  test('raw=true outputs raw value created', () => {
    const { exitCode, stdout } = captureOutput(() => cmdConfigEnsureSection(tmpDir, true));
    assert.strictEqual(exitCode, 0);
    assert.strictEqual(stdout, 'created');
  });

  test('raw=true outputs exists for existing config', () => {
    fs.writeFileSync(path.join(tmpDir, '.planning', 'config.json'), '{}', 'utf-8');
    const { exitCode, stdout } = captureOutput(() => cmdConfigEnsureSection(tmpDir, true));
    assert.strictEqual(exitCode, 0);
    assert.strictEqual(stdout, 'exists');
  });
});

// ============================================================================
// cmdConfigEnsureSection — subprocess (env-dependent behavior)
// ============================================================================

describe('cmdConfigEnsureSection (subprocess)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('detects BRAVE_API_KEY environment variable', () => {
    const env = { ...process.env, BRAVE_API_KEY: 'test-key-123' };
    runConfigEnsureSection(tmpDir, env);

    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
    assert.strictEqual(config.brave_search, true);
  });

  test('picks up user defaults from ~/.gsd/defaults.json', () => {
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-home-'));
    const gsdDir = path.join(fakeHome, '.gsd');
    fs.mkdirSync(gsdDir, { recursive: true });
    fs.writeFileSync(
      path.join(gsdDir, 'defaults.json'),
      JSON.stringify({ model_profile: 'quality', commit_docs: false }),
      'utf-8'
    );

    const env = { ...process.env };
    delete env.BRAVE_API_KEY;
    if (process.platform === 'win32') {
      env.USERPROFILE = fakeHome;
      env.HOMEDRIVE = '';
      env.HOMEPATH = fakeHome;
    }
    env.HOME = fakeHome;

    try {
      runConfigEnsureSection(tmpDir, env);

      const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
      assert.strictEqual(config.model_profile, 'quality');
      assert.strictEqual(config.commit_docs, false);
      assert.strictEqual(config.workflow.research, true);
    } catch (err) {
      assert.fail(`Command failed: ${err.stderr}`);
    } finally {
      fs.rmSync(fakeHome, { recursive: true, force: true });
    }
  });

  test('user defaults with workflow overrides merge correctly', () => {
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-home-'));
    const gsdDir = path.join(fakeHome, '.gsd');
    fs.mkdirSync(gsdDir, { recursive: true });
    fs.writeFileSync(
      path.join(gsdDir, 'defaults.json'),
      JSON.stringify({ workflow: { research: false } }),
      'utf-8'
    );

    const env = { ...process.env };
    delete env.BRAVE_API_KEY;
    if (process.platform === 'win32') {
      env.USERPROFILE = fakeHome;
      env.HOMEDRIVE = '';
      env.HOMEPATH = fakeHome;
    }
    env.HOME = fakeHome;

    try {
      runConfigEnsureSection(tmpDir, env);

      const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
      assert.strictEqual(config.workflow.research, false);
      assert.strictEqual(config.workflow.plan_check, true);
    } catch (err) {
      assert.fail(`Command failed: ${err.stderr}`);
    } finally {
      fs.rmSync(fakeHome, { recursive: true, force: true });
    }
  });

  test('handles malformed defaults.json gracefully', () => {
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-home-'));
    const gsdDir = path.join(fakeHome, '.gsd');
    fs.mkdirSync(gsdDir, { recursive: true });
    fs.writeFileSync(path.join(gsdDir, 'defaults.json'), '{bad json', 'utf-8');

    const env = { ...process.env };
    delete env.BRAVE_API_KEY;
    if (process.platform === 'win32') {
      env.USERPROFILE = fakeHome;
      env.HOMEDRIVE = '';
      env.HOMEPATH = fakeHome;
    }
    env.HOME = fakeHome;

    try {
      const stdout = runConfigEnsureSection(tmpDir, env);

      const output = JSON.parse(stdout.trim());
      assert.strictEqual(output.created, true);
      const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
      assert.strictEqual(config.model_profile, 'balanced');
    } catch (err) {
      assert.fail(`Command failed: ${err.stderr}`);
    } finally {
      fs.rmSync(fakeHome, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// cmdConfigSet — direct calls (success paths)
// ============================================================================

describe('cmdConfigSet (direct)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      model_profile: 'balanced',
      commit_docs: true,
      workflow: { research: true, plan_check: true },
    }, null, 2), 'utf-8');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('sets a top-level key', () => {
    const { exitCode, stdout } = captureOutput(() => cmdConfigSet(tmpDir, 'model_profile', 'quality', false));
    assert.strictEqual(exitCode, 0);

    const output = JSON.parse(stdout);
    assert.strictEqual(output.updated, true);
    assert.strictEqual(output.key, 'model_profile');
    assert.strictEqual(output.value, 'quality');

    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
    assert.strictEqual(config.model_profile, 'quality');
  });

  test('sets a nested key using dot notation', () => {
    const { exitCode } = captureOutput(() => cmdConfigSet(tmpDir, 'workflow.research', 'false', false));
    assert.strictEqual(exitCode, 0);

    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
    assert.strictEqual(config.workflow.research, false);
    assert.strictEqual(config.workflow.plan_check, true);
  });

  test('parses boolean true', () => {
    captureOutput(() => cmdConfigSet(tmpDir, 'commit_docs', 'true', false));
    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
    assert.strictEqual(config.commit_docs, true);
    assert.strictEqual(typeof config.commit_docs, 'boolean');
  });

  test('parses boolean false', () => {
    captureOutput(() => cmdConfigSet(tmpDir, 'commit_docs', 'false', false));
    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
    assert.strictEqual(config.commit_docs, false);
    assert.strictEqual(typeof config.commit_docs, 'boolean');
  });

  test('parses numeric string value', () => {
    captureOutput(() => cmdConfigSet(tmpDir, canonicalKey('workflow.max_discuss_passes'), '42', false));
    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
    assert.strictEqual(config.workflow.max_discuss_passes, 42);
    assert.strictEqual(typeof config.workflow.max_discuss_passes, 'number');
  });

  test('keeps string values as strings', () => {
    captureOutput(() => cmdConfigSet(tmpDir, 'features.release_notes', 'feature', false));
    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
    assert.strictEqual(config.features.release_notes, 'feature');
    assert.strictEqual(typeof config.features.release_notes, 'string');
  });

  test('creates intermediate objects for deeply nested keys', () => {
    captureOutput(() => cmdConfigSet(tmpDir, 'model_profile_overrides.claude.sonnet', 'deep-value', false));
    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
    assert.strictEqual(config.model_profile_overrides.claude.sonnet, 'deep-value');
  });

  test('creates config.json if none exists', () => {
    fs.unlinkSync(path.join(tmpDir, '.planning', 'config.json'));
    captureOutput(() => cmdConfigSet(tmpDir, 'features.bootstrap', 'hello', false));
    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
    assert.strictEqual(config.features.bootstrap, 'hello');
  });

  test('raw mode outputs raw value', () => {
    const { stdout } = captureOutput(() => cmdConfigSet(tmpDir, 'model_profile', 'budget', true));
    assert.strictEqual(stdout, 'model_profile=budget');
  });

  test('overwrites existing non-object key to create nested path', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const before = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    before.features = 'disabled';
    fs.writeFileSync(configPath, JSON.stringify(before, null, 2), 'utf-8');

    captureOutput(() => cmdConfigSet(tmpDir, 'features.transition', 'nested', false));
    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
    assert.strictEqual(typeof config.features, 'object');
    assert.strictEqual(config.features.transition, 'nested');
  });

  test('rejects malformed config.json without mutation', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const malformed = '{bad-json';
    fs.writeFileSync(configPath, malformed, 'utf-8');

    const { exitCode, stderr } = captureOutput(() =>
      cmdConfigSet(tmpDir, canonicalKey('model_profile'), 'quality', false));

    assert.notStrictEqual(exitCode, 0);
    assert.ok(stderr.includes('Failed to read config.json'));
    assert.strictEqual(fs.readFileSync(configPath, 'utf-8'), malformed);
  });
});

// ============================================================================
// cmdConfigSet — error paths (direct + subprocess)
// ============================================================================

describe('cmdConfigSet error paths (direct)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    fs.writeFileSync(path.join(tmpDir, '.planning', 'config.json'), '{}', 'utf-8');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('rejects an unknown key without mutating config', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const before = fs.readFileSync(configPath, 'utf-8');

    const { exitCode, stderr } = captureOutput(() =>
      cmdConfigSet(tmpDir, 'unknown_contract_key', 'value', false));

    assert.notStrictEqual(exitCode, 0);
    assert.ok(stderr.includes('Unknown config key'));
    assert.strictEqual(fs.readFileSync(configPath, 'utf-8'), before);
  });

  test('rejects an invalid canonical enum without mutating config', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const before = fs.readFileSync(configPath, 'utf-8');

    const { exitCode, stderr } = captureOutput(() =>
      cmdConfigSet(tmpDir, 'workflow.human_verify_mode', 'sometimes', false));

    assert.notStrictEqual(exitCode, 0);
    assert.ok(stderr.includes('Invalid workflow.human_verify_mode'));
    assert.strictEqual(fs.readFileSync(configPath, 'utf-8'), before);
  });

  test('errors when no key path provided (direct)', () => {
    const { exitCode, stderr } = captureOutput(() => cmdConfigSet(tmpDir, undefined, 'val', false));
    assert.strictEqual(exitCode, 1);
    assert.ok(stderr.includes('Usage'));
  });

  test('errors when no key path provided via subprocess', () => {
    const result = runGsdTools('config-set', tmpDir);
    assert.ok(!result.success);
    assert.ok(result.error.includes('Usage'));
  });

  test('errors with malformed config.json via subprocess', () => {
    fs.writeFileSync(path.join(tmpDir, '.planning', 'config.json'), '{bad-json', 'utf-8');
    const result = runGsdTools('config-set model_profile quality', tmpDir);
    assert.ok(!result.success);
    assert.ok(result.error.includes('Failed to read config.json'));
  });
});

// ============================================================================
// cmdConfigGet — direct calls (success paths)
// ============================================================================

describe('cmdConfigGet (direct)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      model_profile: 'balanced',
      commit_docs: true,
      workflow: { research: true, plan_check: false, max_discuss_passes: 5 },
    }, null, 2), 'utf-8');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('retrieves a top-level string value', () => {
    const { exitCode, stdout } = captureOutput(() => cmdConfigGet(tmpDir, 'model_profile', false));
    assert.strictEqual(exitCode, 0);
    assert.strictEqual(JSON.parse(stdout), 'balanced');
  });

  test('retrieves a top-level boolean value', () => {
    const { exitCode, stdout } = captureOutput(() => cmdConfigGet(tmpDir, 'commit_docs', false));
    assert.strictEqual(exitCode, 0);
    assert.strictEqual(JSON.parse(stdout), true);
  });

  test('retrieves a nested numeric value', () => {
    const { exitCode, stdout } = captureOutput(() =>
      cmdConfigGet(tmpDir, canonicalKey('workflow.max_discuss_passes'), false));
    assert.strictEqual(exitCode, 0);
    assert.strictEqual(JSON.parse(stdout), 5);
  });

  test('retrieves a nested key using dot notation', () => {
    const { exitCode, stdout } = captureOutput(() => cmdConfigGet(tmpDir, 'workflow.research', false));
    assert.strictEqual(exitCode, 0);
    assert.strictEqual(JSON.parse(stdout), true);
  });

  test('retrieves a nested object', () => {
    const { exitCode, stdout } = captureOutput(() => cmdConfigGet(tmpDir, 'workflow', false));
    assert.strictEqual(exitCode, 0);
    assert.deepStrictEqual(JSON.parse(stdout), {
      research: true,
      plan_check: false,
      max_discuss_passes: 5,
    });
  });

  test('raw mode outputs raw string value', () => {
    const { stdout } = captureOutput(() => cmdConfigGet(tmpDir, 'model_profile', true));
    assert.strictEqual(stdout, 'balanced');
  });

  test('raw mode outputs raw boolean as string', () => {
    const { stdout } = captureOutput(() => cmdConfigGet(tmpDir, 'commit_docs', true));
    assert.strictEqual(stdout, 'true');
  });

  test('raw mode outputs raw number as string', () => {
    const { stdout } = captureOutput(() =>
      cmdConfigGet(tmpDir, canonicalKey('workflow.max_discuss_passes'), true));
    assert.strictEqual(stdout, '5');
  });
});

// ============================================================================
// cmdConfigGet — error paths (direct + subprocess)
// ============================================================================

describe('cmdConfigGet error paths (direct)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      model_profile: 'balanced',
      workflow: { research: true },
    }, null, 2), 'utf-8');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('errors when no key path provided (direct)', () => {
    const { exitCode, stderr } = captureOutput(() => cmdConfigGet(tmpDir, undefined, false));
    assert.strictEqual(exitCode, 1);
    assert.ok(stderr.includes('Usage'));
  });

  test('errors when config.json does not exist (direct)', () => {
    fs.unlinkSync(path.join(tmpDir, '.planning', 'config.json'));
    const { exitCode, stderr } = captureOutput(() => cmdConfigGet(tmpDir, 'model_profile', false));
    assert.strictEqual(exitCode, 1);
    assert.ok(stderr.includes('No config.json'));
  });

  test('errors when key not found at end of traversal (direct)', () => {
    const { exitCode, stderr } = captureOutput(() => cmdConfigGet(tmpDir, 'nonexistent', false));
    assert.strictEqual(exitCode, 1);
    assert.ok(stderr.includes('Key not found'));
  });

  test('errors when traversing through non-object (direct)', () => {
    const { exitCode, stderr } = captureOutput(() => cmdConfigGet(tmpDir, 'workflow.research.extra', false));
    assert.strictEqual(exitCode, 1);
    assert.ok(stderr.includes('Key not found'));
  });

  test('errors when nested key not found (direct)', () => {
    const { exitCode, stderr } = captureOutput(() => cmdConfigGet(tmpDir, 'workflow.nonexistent', false));
    assert.strictEqual(exitCode, 1);
    assert.ok(stderr.includes('Key not found'));
  });

  test('errors with malformed config.json (direct)', () => {
    fs.writeFileSync(path.join(tmpDir, '.planning', 'config.json'), '{bad}', 'utf-8');
    const { exitCode, stderr } = captureOutput(() => cmdConfigGet(tmpDir, 'model_profile', false));
    assert.strictEqual(exitCode, 1);
    assert.ok(stderr.includes('Failed to read config.json'));
  });
});

describe('cmdConfigGet error paths (subprocess)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      model_profile: 'balanced',
      workflow: { research: true },
    }, null, 2), 'utf-8');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('errors when key not found', () => {
    const result = runGsdTools('config-get nonexistent', tmpDir);
    assert.ok(!result.success);
    assert.ok(result.error.includes('Key not found'));
  });

  test('errors when no key path provided', () => {
    const result = runGsdTools('config-get', tmpDir);
    assert.ok(!result.success);
    assert.ok(result.error.includes('Usage'));
  });

  test('errors when config.json does not exist', () => {
    fs.unlinkSync(path.join(tmpDir, '.planning', 'config.json'));
    const result = runGsdTools('config-get model_profile', tmpDir);
    assert.ok(!result.success);
    assert.ok(result.error.includes('No config.json'));
  });
});
