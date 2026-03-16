/**
 * GSD Tools Tests - Config
 *
 * Tests config.cjs functions both via subprocess (integration, error paths)
 * and via direct import with process.exit mocking (for bun coverage tracking).
 *
 * The CLI functions call output()/error() from core.cjs which invoke
 * process.exit(). For success paths, process.exit is mocked as a no-op
 * (safe because output() is always the last call before return). Error
 * paths must use subprocess because error() is called mid-function and
 * a no-op exit would let execution continue into undefined state.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { runGsdTools, runGsdToolsDirect, createTempProject, cleanup } = require('./helpers.cjs');

// Direct import for in-process coverage tracking
const { cmdConfigEnsureSection, cmdConfigSet, cmdConfigGet } = require('../get-stuff-done/bin/lib/config.cjs');

/**
 * Run a config function with process.exit as no-op and stdout/stderr captured.
 * For success paths, execution continues normally after output() since it's
 * typically the last call. For error paths, execution may crash after error()
 * returns (because the function expects error() to halt). The crash is caught
 * and suppressed -- we only care that error() was reached and exitCode was set.
 * Returns { exitCode, stdout, stderr }.
 */
function captureOutput(fn) {
  const originalExit = process.exit;
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;

  let stdout = '';
  let stderr = '';
  let exitCode = null;

  process.stdout.write = (data) => { stdout += String(data); return true; };
  process.stderr.write = (data) => { stderr += String(data); return true; };
  process.exit = (code) => { if (exitCode === null) exitCode = code; };

  try {
    fn();
  } catch (err) {
    // After error() returns (no-op exit), the function may crash because it
    // expects error() to have halted. This is expected for error path tests.
    // The exitCode and stderr were already captured before the crash.
    if (exitCode !== 1) throw err; // Only suppress if error() was called
  } finally {
    process.exit = originalExit;
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  }

  return { exitCode, stdout, stderr };
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
    assert.strictEqual(config.branching_strategy, 'none');
    assert.strictEqual(config.phase_branch_template, 'gsd/phase-{phase}-{slug}');
    assert.strictEqual(config.milestone_branch_template, 'gsd/{milestone}-{slug}');
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
    const { execSync } = require('child_process');
    const toolsPath = path.join(__dirname, '..', 'get-stuff-done', 'bin', 'gsd-tools.cjs');

    try {
      execSync(`node "${toolsPath}" config-ensure-section`, {
        cwd: tmpDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
      });

      const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
      assert.strictEqual(config.brave_search, true);
    } catch (err) {
      assert.fail(`Command failed: ${err.stderr}`);
    }
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

    const { execSync } = require('child_process');
    const toolsPath = path.join(__dirname, '..', 'get-stuff-done', 'bin', 'gsd-tools.cjs');

    const env = { ...process.env };
    delete env.BRAVE_API_KEY;
    if (process.platform === 'win32') {
      env.USERPROFILE = fakeHome;
      env.HOMEDRIVE = '';
      env.HOMEPATH = fakeHome;
    }
    env.HOME = fakeHome;

    try {
      execSync(`node "${toolsPath}" config-ensure-section`, {
        cwd: tmpDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
      });

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

    const { execSync } = require('child_process');
    const toolsPath = path.join(__dirname, '..', 'get-stuff-done', 'bin', 'gsd-tools.cjs');

    const env = { ...process.env };
    delete env.BRAVE_API_KEY;
    if (process.platform === 'win32') {
      env.USERPROFILE = fakeHome;
      env.HOMEDRIVE = '';
      env.HOMEPATH = fakeHome;
    }
    env.HOME = fakeHome;

    try {
      execSync(`node "${toolsPath}" config-ensure-section`, {
        cwd: tmpDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
      });

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

    const { execSync } = require('child_process');
    const toolsPath = path.join(__dirname, '..', 'get-stuff-done', 'bin', 'gsd-tools.cjs');

    const env = { ...process.env };
    delete env.BRAVE_API_KEY;
    if (process.platform === 'win32') {
      env.USERPROFILE = fakeHome;
      env.HOMEDRIVE = '';
      env.HOMEPATH = fakeHome;
    }
    env.HOME = fakeHome;

    try {
      const stdout = execSync(`node "${toolsPath}" config-ensure-section`, {
        cwd: tmpDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
      });

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
    captureOutput(() => cmdConfigSet(tmpDir, 'max_retries', '42', false));
    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
    assert.strictEqual(config.max_retries, 42);
    assert.strictEqual(typeof config.max_retries, 'number');
  });

  test('keeps string values as strings', () => {
    captureOutput(() => cmdConfigSet(tmpDir, 'branching_strategy', 'feature', false));
    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
    assert.strictEqual(config.branching_strategy, 'feature');
    assert.strictEqual(typeof config.branching_strategy, 'string');
  });

  test('creates intermediate objects for deeply nested keys', () => {
    captureOutput(() => cmdConfigSet(tmpDir, 'a.b.c', 'deep-value', false));
    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
    assert.strictEqual(config.a.b.c, 'deep-value');
  });

  test('creates config.json if none exists', () => {
    fs.unlinkSync(path.join(tmpDir, '.planning', 'config.json'));
    captureOutput(() => cmdConfigSet(tmpDir, 'newkey', 'hello', false));
    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
    assert.strictEqual(config.newkey, 'hello');
  });

  test('raw mode outputs raw value', () => {
    const { stdout } = captureOutput(() => cmdConfigSet(tmpDir, 'model_profile', 'budget', true));
    assert.strictEqual(stdout, 'model_profile=budget');
  });

  test('overwrites existing non-object key to create nested path', () => {
    captureOutput(() => cmdConfigSet(tmpDir, 'model_profile.sub', 'nested', false));
    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
    assert.strictEqual(typeof config.model_profile, 'object');
    assert.strictEqual(config.model_profile.sub, 'nested');
  });

  test('handles malformed config.json by starting fresh', () => {
    // Write invalid JSON to config.json
    fs.writeFileSync(path.join(tmpDir, '.planning', 'config.json'), '{bad-json', 'utf-8');

    // cmdConfigSet catches the parse error (line 96-97), falls back to config={},
    // then continues to set the key and write. With no-op exit, error() returns
    // and execution proceeds because keyPath is valid.
    const { exitCode, stderr } = captureOutput(() => cmdConfigSet(tmpDir, 'newkey', 'test', false));

    // The first exit code will be 1 from error(), but then output() sets 0
    // Since we only record the first exit, it's 1
    assert.strictEqual(exitCode, 1);
    assert.ok(stderr.includes('Failed to read config.json'));

    // Despite the error, the key was set (function continued after no-op exit)
    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.planning', 'config.json'), 'utf-8'));
    assert.strictEqual(config.newkey, 'test');
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
    const result = runGsdTools('config-set mykey myval', tmpDir);
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
      max_retries: 5,
      workflow: { research: true, plan_check: false },
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

  test('retrieves a top-level numeric value', () => {
    const { exitCode, stdout } = captureOutput(() => cmdConfigGet(tmpDir, 'max_retries', false));
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
    assert.deepStrictEqual(JSON.parse(stdout), { research: true, plan_check: false });
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
    const { stdout } = captureOutput(() => cmdConfigGet(tmpDir, 'max_retries', true));
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
    const { exitCode, stderr } = captureOutput(() => cmdConfigGet(tmpDir, 'model_profile.sub', false));
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
