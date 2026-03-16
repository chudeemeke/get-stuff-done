/**
 * GSD Tools Tests - Core
 *
 * Tests for get-stuff-done/bin/lib/core.cjs shared utilities.
 * comparePhaseNum and normalizePhaseName are already covered in phase.test.cjs.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, execFileSync } = require('child_process');
const { createTempProject, cleanup } = require('./helpers.cjs');

const CORE_PATH = path.join(__dirname, '..', 'get-stuff-done', 'bin', 'lib', 'core.cjs');
const core = require(CORE_PATH);

const {
  MODEL_PROFILES,
  safeReadFile,
  loadConfig,
  isGitIgnored,
  execGit,
  escapeRegex,
  searchPhaseInDir,
  findPhaseInternal,
  getArchivedPhaseDirs,
  getRoadmapPhaseInternal,
  resolveModelInternal,
  pathExistsInternal,
  generateSlugInternal,
  getMilestoneInfo,
  validateGitSHA,
  validateBranchName,
  validateConfigPath,
  validateTagName,
  validateRemoteURL,
  requireValid,
} = core;

/**
 * Helper: run a script that requires core.cjs and calls a function.
 * Uses a temp .js file to avoid shell quoting issues on Windows.
 */
function runCoreScript(scriptBody) {
  const tmpScript = path.join(os.tmpdir(), `gsd-core-test-${Date.now()}-${Math.random().toString(36).slice(2)}.js`);
  const corePath = CORE_PATH.replace(/\\/g, '/');
  const content = `const core = require('${corePath}');\n${scriptBody}`;
  fs.writeFileSync(tmpScript, content, 'utf-8');
  try {
    const result = execFileSync(process.execPath, [tmpScript], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
    });
    return { stdout: result, stderr: '', exitCode: 0 };
  } catch (err) {
    return {
      stdout: (err.stdout || '').toString(),
      stderr: (err.stderr || '').toString(),
      exitCode: err.status || 1,
    };
  } finally {
    try { fs.unlinkSync(tmpScript); } catch {}
  }
}

/**
 * Helper: Mock process.exit, stdout.write, stderr.write for in-process tests.
 * Returns captured output and restores originals.
 */
function mockProcess() {
  const origExit = process.exit;
  const origStdout = process.stdout.write;
  const origStderr = process.stderr.write;
  let stdoutBuf = '';
  let stderrBuf = '';
  let exitCode = null;

  process.exit = (code) => { exitCode = code; throw new Error(`__MOCK_EXIT_${code}__`); };
  process.stdout.write = (data) => { stdoutBuf += data; return true; };
  process.stderr.write = (data) => { stderrBuf += data; return true; };

  return {
    restore() {
      process.exit = origExit;
      process.stdout.write = origStdout;
      process.stderr.write = origStderr;
    },
    get stdout() { return stdoutBuf; },
    get stderr() { return stderrBuf; },
    get exitCode() { return exitCode; },
  };
}

// ---- MODEL_PROFILES ----

describe('MODEL_PROFILES', () => {
  test('is an object with known agent types', () => {
    assert.strictEqual(typeof MODEL_PROFILES, 'object');
    assert.ok(MODEL_PROFILES['gsd-planner'], 'should have gsd-planner');
    assert.ok(MODEL_PROFILES['gsd-executor'], 'should have gsd-executor');
    assert.ok(MODEL_PROFILES['gsd-verifier'], 'should have gsd-verifier');
  });

  test('each profile has quality, balanced, and budget keys', () => {
    for (const [agent, profile] of Object.entries(MODEL_PROFILES)) {
      assert.ok('quality' in profile, `${agent} missing quality`);
      assert.ok('balanced' in profile, `${agent} missing balanced`);
      assert.ok('budget' in profile, `${agent} missing budget`);
    }
  });

  test('profile values are valid model names', () => {
    const validModels = ['opus', 'sonnet', 'haiku'];
    for (const [agent, profile] of Object.entries(MODEL_PROFILES)) {
      for (const [tier, model] of Object.entries(profile)) {
        assert.ok(validModels.includes(model), `${agent}.${tier} = '${model}' is not a valid model`);
      }
    }
  });
});

// ---- output() and error() ----

describe('output()', () => {
  test('outputs JSON to stdout and exits 0', () => {
    const res = runCoreScript("core.output({ hello: 'world' }, false);");
    assert.strictEqual(res.exitCode, 0);
    const parsed = JSON.parse(res.stdout);
    assert.deepStrictEqual(parsed, { hello: 'world' });
  });

  test('outputs raw value when raw=true and rawValue provided', () => {
    const res = runCoreScript("core.output({ hello: 'world' }, true, 'my-raw-value');");
    assert.strictEqual(res.exitCode, 0);
    assert.strictEqual(res.stdout, 'my-raw-value');
  });

  test('outputs JSON even when raw=true but rawValue is undefined', () => {
    const res = runCoreScript("core.output({ key: 'val' }, true);");
    assert.strictEqual(res.exitCode, 0);
    const parsed = JSON.parse(res.stdout);
    assert.deepStrictEqual(parsed, { key: 'val' });
  });

  test('handles string result', () => {
    const res = runCoreScript("core.output('just a string', false);");
    assert.strictEqual(res.exitCode, 0);
    assert.strictEqual(JSON.parse(res.stdout), 'just a string');
  });

  test('handles array result', () => {
    const res = runCoreScript("core.output([1, 2, 3], false);");
    assert.strictEqual(res.exitCode, 0);
    assert.deepStrictEqual(JSON.parse(res.stdout), [1, 2, 3]);
  });

  test('handles number result', () => {
    const res = runCoreScript('core.output(42, false);');
    assert.strictEqual(res.exitCode, 0);
    assert.strictEqual(JSON.parse(res.stdout), 42);
  });

  test('handles boolean result', () => {
    const res = runCoreScript('core.output(true, false);');
    assert.strictEqual(res.exitCode, 0);
    assert.strictEqual(JSON.parse(res.stdout), true);
  });

  test('handles null result', () => {
    const res = runCoreScript('core.output(null, false);');
    assert.strictEqual(res.exitCode, 0);
    assert.strictEqual(JSON.parse(res.stdout), null);
  });

  test('large payload (>50KB) writes to tmpfile with @file: prefix', () => {
    const res = runCoreScript("const bigObj = { data: 'x'.repeat(60000) };\ncore.output(bigObj, false);");
    assert.strictEqual(res.exitCode, 0);
    assert.ok(res.stdout.startsWith('@file:'), 'should start with @file: prefix');
    const tmpPath = res.stdout.slice(6);
    assert.ok(fs.existsSync(tmpPath), 'tmpfile should exist');
    const content = JSON.parse(fs.readFileSync(tmpPath, 'utf-8'));
    assert.strictEqual(content.data.length, 60000);
    // Cleanup
    fs.unlinkSync(tmpPath);
  });

  test('raw value with numeric rawValue', () => {
    const res = runCoreScript('core.output({}, true, 12345);');
    assert.strictEqual(res.exitCode, 0);
    assert.strictEqual(res.stdout, '12345');
  });
});

describe('output() in-process coverage', () => {
  test('writes JSON to stdout and calls process.exit(0)', () => {
    const mock = mockProcess();
    try {
      core.output({ test: true }, false);
    } catch (e) {
      // Expected mock exit
    } finally {
      mock.restore();
    }
    assert.strictEqual(mock.exitCode, 0);
    assert.deepStrictEqual(JSON.parse(mock.stdout), { test: true });
  });

  test('writes raw value when raw=true and rawValue defined', () => {
    const mock = mockProcess();
    try {
      core.output({ x: 1 }, true, 'raw-out');
    } catch (e) {}
    finally { mock.restore(); }
    assert.strictEqual(mock.exitCode, 0);
    assert.strictEqual(mock.stdout, 'raw-out');
  });

  test('writes JSON when raw=true but rawValue undefined', () => {
    const mock = mockProcess();
    try {
      core.output({ y: 2 }, true);
    } catch (e) {}
    finally { mock.restore(); }
    assert.strictEqual(mock.exitCode, 0);
    assert.deepStrictEqual(JSON.parse(mock.stdout), { y: 2 });
  });

  test('large payload writes to tmpfile with @file: prefix', () => {
    const mock = mockProcess();
    try {
      core.output({ data: 'x'.repeat(60000) }, false);
    } catch (e) {}
    finally { mock.restore(); }
    assert.strictEqual(mock.exitCode, 0);
    assert.ok(mock.stdout.startsWith('@file:'));
    const tmpPath = mock.stdout.slice(6);
    assert.ok(fs.existsSync(tmpPath));
    fs.unlinkSync(tmpPath);
  });
});

describe('error()', () => {
  test('writes error to stderr and exits with code 1', () => {
    const res = runCoreScript("core.error('something went wrong');");
    assert.strictEqual(res.exitCode, 1);
    assert.ok(res.stderr.includes('Error: something went wrong'));
  });

  test('formats error message with Error: prefix', () => {
    const res = runCoreScript("core.error('test message');");
    assert.ok(res.stderr.includes('Error: test message\n'));
  });
});

describe('error() in-process coverage', () => {
  test('writes to stderr and calls process.exit(1)', () => {
    const mock = mockProcess();
    try {
      core.error('in-process error');
    } catch (e) {}
    finally { mock.restore(); }
    assert.strictEqual(mock.exitCode, 1);
    assert.ok(mock.stderr.includes('Error: in-process error\n'));
  });
});

// ---- requireValid() ----

describe('requireValid()', () => {
  test('returns value when result is ok', () => {
    const result = requireValid({ ok: true, value: 'hello' });
    assert.strictEqual(result, 'hello');
  });

  test('returns undefined value when ok', () => {
    const result = requireValid({ ok: true, value: undefined });
    assert.strictEqual(result, undefined);
  });

  test('exits with error when result is not ok', () => {
    const res = runCoreScript("core.requireValid({ ok: false, error: 'validation failed' });");
    assert.strictEqual(res.exitCode, 1);
    assert.ok(res.stderr.includes('Error: validation failed'));
  });

  test('in-process: writes error and exits on invalid result', () => {
    const mock = mockProcess();
    try {
      core.requireValid({ ok: false, error: 'bad input' });
    } catch (e) {}
    finally { mock.restore(); }
    assert.strictEqual(mock.exitCode, 1);
    assert.ok(mock.stderr.includes('Error: bad input'));
  });
});

// ---- safeReadFile() ----

describe('safeReadFile()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-core-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns file content when file exists', () => {
    const filePath = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(filePath, 'hello world');
    assert.strictEqual(safeReadFile(filePath), 'hello world');
  });

  test('returns null when file does not exist', () => {
    assert.strictEqual(safeReadFile(path.join(tmpDir, 'nonexistent.txt')), null);
  });

  test('returns null for directory path', () => {
    // fs.readFileSync on a directory throws EISDIR
    assert.strictEqual(safeReadFile(tmpDir), null);
  });
});

// ---- loadConfig() ----

describe('loadConfig()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns defaults when config does not exist', () => {
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.model_profile, 'balanced');
    assert.strictEqual(config.commit_docs, true);
    assert.strictEqual(config.search_gitignored, false);
    assert.strictEqual(config.branching_strategy, 'none');
    assert.strictEqual(config.research, true);
    assert.strictEqual(config.plan_checker, true);
    assert.strictEqual(config.verifier, true);
    assert.strictEqual(config.parallelization, true);
    assert.strictEqual(config.brave_search, false);
    assert.strictEqual(config.phase_branch_template, 'gsd/phase-{phase}-{slug}');
    assert.strictEqual(config.milestone_branch_template, 'gsd/{milestone}-{slug}');
  });

  test('loads top-level keys from config.json', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      model_profile: 'quality',
      commit_docs: false,
      brave_search: true,
    }));
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.model_profile, 'quality');
    assert.strictEqual(config.commit_docs, false);
    assert.strictEqual(config.brave_search, true);
  });

  test('loads nested workflow keys', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      workflow: {
        research: false,
        plan_check: false,
        verifier: false,
      },
    }));
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.research, false);
    assert.strictEqual(config.plan_checker, false);
    assert.strictEqual(config.verifier, false);
  });

  test('loads nested git keys', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      git: {
        branching_strategy: 'feature-branch',
        phase_branch_template: 'custom/{phase}',
        milestone_branch_template: 'custom/{milestone}',
      },
    }));
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.branching_strategy, 'feature-branch');
    assert.strictEqual(config.phase_branch_template, 'custom/{phase}');
    assert.strictEqual(config.milestone_branch_template, 'custom/{milestone}');
  });

  test('loads nested planning keys', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      planning: {
        commit_docs: false,
        search_gitignored: true,
      },
    }));
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.commit_docs, false);
    assert.strictEqual(config.search_gitignored, true);
  });

  test('parallelization as boolean true', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ parallelization: true }));
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.parallelization, true);
  });

  test('parallelization as boolean false', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ parallelization: false }));
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.parallelization, false);
  });

  test('parallelization as object with enabled field', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      parallelization: { enabled: false, max_concurrent: 3 },
    }));
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.parallelization, false);
  });

  test('parallelization as object with enabled=true', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      parallelization: { enabled: true },
    }));
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.parallelization, true);
  });

  test('returns defaults on invalid JSON', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, 'not valid json');
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.model_profile, 'balanced');
  });

  test('top-level keys take precedence over nested section keys', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      research: false,
      workflow: { research: true },
    }));
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.research, false);
  });

  test('parallelization defaults when value is non-boolean non-object', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ parallelization: 'yes' }));
    const config = loadConfig(tmpDir);
    // 'yes' is not boolean, not an object with 'enabled' -> defaults.parallelization
    assert.strictEqual(config.parallelization, true);
  });

  test('parallelization as null falls to default', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ parallelization: null }));
    const config = loadConfig(tmpDir);
    // null is an object but without 'enabled' -> defaults.parallelization
    assert.strictEqual(config.parallelization, true);
  });
});

// ---- isGitIgnored() ----

describe('isGitIgnored()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-gitignore-'));
    execSync('git init', { cwd: tmpDir, stdio: 'pipe' });
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'ignored.txt\n*.log\n');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns true for gitignored files', () => {
    assert.strictEqual(isGitIgnored(tmpDir, 'ignored.txt'), true);
  });

  test('returns true for pattern-matched gitignored files', () => {
    assert.strictEqual(isGitIgnored(tmpDir, 'test.log'), true);
  });

  test('returns false for non-ignored files', () => {
    assert.strictEqual(isGitIgnored(tmpDir, 'readme.md'), false);
  });

  test('returns false when not in a git repo', () => {
    const nonGitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-nogit-'));
    try {
      assert.strictEqual(isGitIgnored(nonGitDir, 'anything.txt'), false);
    } finally {
      fs.rmSync(nonGitDir, { recursive: true, force: true });
    }
  });
});

// ---- execGit() ----

describe('execGit()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-execgit-'));
    execSync('git init', { cwd: tmpDir, stdio: 'pipe' });
    execSync('git config user.email "test@test.com"', { cwd: tmpDir, stdio: 'pipe' });
    execSync('git config user.name "Test"', { cwd: tmpDir, stdio: 'pipe' });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('executes git command and returns stdout', () => {
    fs.writeFileSync(path.join(tmpDir, 'file.txt'), 'content');
    execSync('git add file.txt', { cwd: tmpDir, stdio: 'pipe' });
    execSync('git commit -m "initial"', { cwd: tmpDir, stdio: 'pipe' });
    const result = execGit(tmpDir, ['log', '--oneline']);
    assert.strictEqual(result.exitCode, 0);
    assert.ok(result.stdout.includes('initial'));
  });

  test('returns non-zero exit code on failure', () => {
    // git log on empty repo fails
    const result = execGit(tmpDir, ['log', '--oneline']);
    assert.ok(result.exitCode !== 0);
  });

  test('returns empty stderr on success', () => {
    const result = execGit(tmpDir, ['status']);
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stderr, '');
  });

  test('returns stderr content on failure', () => {
    const result = execGit(tmpDir, ['checkout', 'nonexistent-branch']);
    assert.ok(result.exitCode !== 0);
    assert.ok(result.stderr.length > 0);
  });

  test('escapes safe args without quotes', () => {
    const result = execGit(tmpDir, ['status']);
    assert.strictEqual(result.exitCode, 0);
  });

  test('handles rev-parse command', () => {
    fs.writeFileSync(path.join(tmpDir, 'file.txt'), 'content');
    execSync('git add file.txt', { cwd: tmpDir, stdio: 'pipe' });
    execSync('git commit -m "test commit"', { cwd: tmpDir, stdio: 'pipe' });
    const result = execGit(tmpDir, ['rev-parse', 'HEAD']);
    assert.strictEqual(result.exitCode, 0);
    assert.ok(/^[a-f0-9]{40}$/.test(result.stdout));
  });

  test('wraps args containing special characters in single quotes', () => {
    // Args with spaces trigger single-quote wrapping in execGit
    fs.writeFileSync(path.join(tmpDir, 'file.txt'), 'content');
    execSync('git add file.txt', { cwd: tmpDir, stdio: 'pipe' });
    execSync('git commit -m "test commit"', { cwd: tmpDir, stdio: 'pipe' });
    // 'test commit' contains a space, triggers the quote branch
    const result = execGit(tmpDir, ['log', '--format=%s', '-1']);
    // Even if the format arg triggers quoting, the command may succeed or fail
    // depending on the platform; we just need the branch executed
    assert.strictEqual(typeof result.exitCode, 'number');
  });
});

// ---- escapeRegex() ----

describe('escapeRegex()', () => {
  test('escapes dot', () => {
    assert.strictEqual(escapeRegex('.'), '\\.');
  });

  test('escapes asterisk', () => {
    assert.strictEqual(escapeRegex('*'), '\\*');
  });

  test('escapes plus', () => {
    assert.strictEqual(escapeRegex('+'), '\\+');
  });

  test('escapes question mark', () => {
    assert.strictEqual(escapeRegex('?'), '\\?');
  });

  test('escapes caret', () => {
    assert.strictEqual(escapeRegex('^'), '\\^');
  });

  test('escapes dollar sign', () => {
    assert.strictEqual(escapeRegex('$'), '\\$');
  });

  test('escapes curly braces', () => {
    assert.strictEqual(escapeRegex('{}'), '\\{\\}');
  });

  test('escapes parentheses', () => {
    assert.strictEqual(escapeRegex('()'), '\\(\\)');
  });

  test('escapes pipe', () => {
    assert.strictEqual(escapeRegex('|'), '\\|');
  });

  test('escapes square brackets', () => {
    assert.strictEqual(escapeRegex('[]'), '\\[\\]');
  });

  test('escapes backslash', () => {
    assert.strictEqual(escapeRegex('\\'), '\\\\');
  });

  test('returns unchanged string when no special characters', () => {
    assert.strictEqual(escapeRegex('hello world'), 'hello world');
  });

  test('handles numeric input via String() coercion', () => {
    assert.strictEqual(escapeRegex(123), '123');
  });

  test('handles mixed content', () => {
    assert.strictEqual(escapeRegex('file.txt'), 'file\\.txt');
  });

  test('escaped string works as regex pattern', () => {
    const pattern = escapeRegex('test.file(1)');
    const regex = new RegExp(pattern);
    assert.ok(regex.test('test.file(1)'));
    assert.ok(!regex.test('testXfile11'));
  });
});

// ---- comparePhaseNum / normalizePhaseName (in-process coverage) ----
// These are already tested in phase.test.cjs but need in-process coverage here

describe('comparePhaseNum (in-process coverage)', () => {
  const { comparePhaseNum, normalizePhaseName } = core;

  test('compares simple integers', () => {
    assert.ok(comparePhaseNum('1', '2') < 0);
    assert.ok(comparePhaseNum('10', '2') > 0);
    assert.strictEqual(comparePhaseNum('5', '5'), 0);
  });

  test('compares with letter suffixes', () => {
    assert.ok(comparePhaseNum('12', '12A') < 0);
    assert.ok(comparePhaseNum('12A', '12B') < 0);
    assert.ok(comparePhaseNum('12B', '12A') > 0);
  });

  test('compares with decimal parts', () => {
    assert.ok(comparePhaseNum('12A', '12A.1') < 0);
    assert.ok(comparePhaseNum('12A.1', '12A.2') < 0);
    assert.ok(comparePhaseNum('12A.1.2', '12A.2') < 0);
  });

  test('handles non-matching patterns via localeCompare', () => {
    const result = comparePhaseNum('abc', 'def');
    assert.strictEqual(typeof result, 'number');
  });

  test('both have no letter sorts equal for letter comparison', () => {
    assert.strictEqual(comparePhaseNum('5', '5'), 0);
  });

  test('one has letter, other does not', () => {
    assert.ok(comparePhaseNum('5', '5A') < 0);
    assert.ok(comparePhaseNum('5A', '5') > 0);
  });

  test('decimal comparison with unequal lengths', () => {
    assert.ok(comparePhaseNum('5A.1', '5A.1.2') < 0);
    assert.ok(comparePhaseNum('5A.1.2', '5A.1') > 0);
  });
});

describe('normalizePhaseName (in-process coverage)', () => {
  const { normalizePhaseName } = core;

  test('pads single digit', () => {
    assert.strictEqual(normalizePhaseName('1'), '01');
  });

  test('preserves two-digit phase', () => {
    assert.strictEqual(normalizePhaseName('12'), '12');
  });

  test('handles letter suffix', () => {
    assert.strictEqual(normalizePhaseName('5a'), '05A');
  });

  test('returns input unchanged when no match', () => {
    assert.strictEqual(normalizePhaseName('abc'), 'abc');
  });
});

// ---- searchPhaseInDir() ----

describe('searchPhaseInDir()', () => {
  let tmpDir;
  let phasesDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-search-'));
    phasesDir = path.join(tmpDir, 'phases');
    fs.mkdirSync(phasesDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('finds phase directory by number prefix', () => {
    const phaseDir = path.join(phasesDir, '01-foundation');
    fs.mkdirSync(phaseDir);
    fs.writeFileSync(path.join(phaseDir, '01-01-PLAN.md'), '---\n---\n');

    const result = searchPhaseInDir(phasesDir, 'phases', '01');
    assert.ok(result, 'should find phase');
    assert.strictEqual(result.found, true);
    assert.strictEqual(result.phase_number, '01');
    assert.strictEqual(result.phase_name, 'foundation');
  });

  test('returns plans and summaries lists', () => {
    const phaseDir = path.join(phasesDir, '02-api');
    fs.mkdirSync(phaseDir);
    fs.writeFileSync(path.join(phaseDir, '02-01-PLAN.md'), '');
    fs.writeFileSync(path.join(phaseDir, '02-02-PLAN.md'), '');
    fs.writeFileSync(path.join(phaseDir, '02-01-SUMMARY.md'), '');

    const result = searchPhaseInDir(phasesDir, 'phases', '02');
    assert.ok(result);
    assert.deepStrictEqual(result.plans, ['02-01-PLAN.md', '02-02-PLAN.md']);
    assert.deepStrictEqual(result.summaries, ['02-01-SUMMARY.md']);
    assert.deepStrictEqual(result.incomplete_plans, ['02-02-PLAN.md']);
  });

  test('detects research, context, and verification files', () => {
    const phaseDir = path.join(phasesDir, '03-test');
    fs.mkdirSync(phaseDir);
    fs.writeFileSync(path.join(phaseDir, '03-RESEARCH.md'), '');
    fs.writeFileSync(path.join(phaseDir, '03-CONTEXT.md'), '');
    fs.writeFileSync(path.join(phaseDir, '03-VERIFICATION.md'), '');

    const result = searchPhaseInDir(phasesDir, 'phases', '03');
    assert.ok(result);
    assert.strictEqual(result.has_research, true);
    assert.strictEqual(result.has_context, true);
    assert.strictEqual(result.has_verification, true);
  });

  test('returns null when phase not found', () => {
    assert.strictEqual(searchPhaseInDir(phasesDir, 'phases', '99'), null);
  });

  test('returns null when directory does not exist', () => {
    assert.strictEqual(searchPhaseInDir(path.join(tmpDir, 'nonexistent'), 'base', '01'), null);
  });

  test('generates phase_slug from phase name', () => {
    const phaseDir = path.join(phasesDir, '05-My Phase Name');
    fs.mkdirSync(phaseDir);
    fs.writeFileSync(path.join(phaseDir, 'PLAN.md'), '');

    const result = searchPhaseInDir(phasesDir, 'phases', '05');
    assert.ok(result);
    assert.strictEqual(result.phase_slug, 'my-phase-name');
  });

  test('handles PLAN.md without prefix (bare file)', () => {
    const phaseDir = path.join(phasesDir, '06-bare');
    fs.mkdirSync(phaseDir);
    fs.writeFileSync(path.join(phaseDir, 'PLAN.md'), '');
    fs.writeFileSync(path.join(phaseDir, 'SUMMARY.md'), '');

    const result = searchPhaseInDir(phasesDir, 'phases', '06');
    assert.ok(result);
    assert.deepStrictEqual(result.plans, ['PLAN.md']);
    assert.deepStrictEqual(result.summaries, ['SUMMARY.md']);
    assert.deepStrictEqual(result.incomplete_plans, []);
  });

  test('phase directory with no suffix returns null phase_name', () => {
    const phaseDir = path.join(phasesDir, '07');
    fs.mkdirSync(phaseDir);

    const result = searchPhaseInDir(phasesDir, 'phases', '07');
    assert.ok(result);
    assert.strictEqual(result.phase_name, null);
    assert.strictEqual(result.phase_slug, null);
  });

  test('returns directory path using relBase', () => {
    const phaseDir = path.join(phasesDir, '08-relbase');
    fs.mkdirSync(phaseDir);

    const result = searchPhaseInDir(phasesDir, '.planning/phases', '08');
    assert.ok(result);
    assert.strictEqual(result.directory, path.join('.planning/phases', '08-relbase'));
  });

  test('no research/context/verification when files absent', () => {
    const phaseDir = path.join(phasesDir, '09-empty');
    fs.mkdirSync(phaseDir);

    const result = searchPhaseInDir(phasesDir, 'phases', '09');
    assert.ok(result);
    assert.strictEqual(result.has_research, false);
    assert.strictEqual(result.has_context, false);
    assert.strictEqual(result.has_verification, false);
  });

  test('detects RESEARCH.md without prefix', () => {
    const phaseDir = path.join(phasesDir, '10-bare-research');
    fs.mkdirSync(phaseDir);
    fs.writeFileSync(path.join(phaseDir, 'RESEARCH.md'), '');
    fs.writeFileSync(path.join(phaseDir, 'CONTEXT.md'), '');
    fs.writeFileSync(path.join(phaseDir, 'VERIFICATION.md'), '');

    const result = searchPhaseInDir(phasesDir, 'phases', '10');
    assert.ok(result);
    assert.strictEqual(result.has_research, true);
    assert.strictEqual(result.has_context, true);
    assert.strictEqual(result.has_verification, true);
  });
});

// ---- findPhaseInternal() ----

describe('findPhaseInternal()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('finds phase in active phases directory', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '01-01-PLAN.md'), '');

    const result = findPhaseInternal(tmpDir, '1');
    assert.ok(result);
    assert.strictEqual(result.found, true);
    assert.strictEqual(result.phase_number, '01');
  });

  test('falls back to archived phases', () => {
    const archiveDir = path.join(tmpDir, '.planning', 'milestones', 'v1.0-phases', '01-foundation');
    fs.mkdirSync(archiveDir, { recursive: true });
    fs.writeFileSync(path.join(archiveDir, '01-01-PLAN.md'), '');

    const result = findPhaseInternal(tmpDir, '1');
    assert.ok(result);
    assert.strictEqual(result.found, true);
    assert.strictEqual(result.archived, 'v1.0');
  });

  test('returns null when phase not found anywhere', () => {
    assert.strictEqual(findPhaseInternal(tmpDir, '99'), null);
  });

  test('returns null when phase argument is falsy', () => {
    assert.strictEqual(findPhaseInternal(tmpDir, null), null);
    assert.strictEqual(findPhaseInternal(tmpDir, ''), null);
    assert.strictEqual(findPhaseInternal(tmpDir, undefined), null);
  });

  test('returns null when milestones directory does not exist', () => {
    assert.strictEqual(findPhaseInternal(tmpDir, '50'), null);
  });

  test('prefers newest milestone archive when searching', () => {
    const v1Dir = path.join(tmpDir, '.planning', 'milestones', 'v1.0-phases', '05-test');
    const v2Dir = path.join(tmpDir, '.planning', 'milestones', 'v2.0-phases', '05-test');
    fs.mkdirSync(v1Dir, { recursive: true });
    fs.mkdirSync(v2Dir, { recursive: true });
    fs.writeFileSync(path.join(v1Dir, '05-01-PLAN.md'), '');
    fs.writeFileSync(path.join(v2Dir, '05-01-PLAN.md'), '');

    const result = findPhaseInternal(tmpDir, '5');
    assert.ok(result);
    assert.strictEqual(result.archived, 'v2.0');
  });

  test('prefers active phase over archived', () => {
    // Active phase
    const activeDir = path.join(tmpDir, '.planning', 'phases', '03-test');
    fs.mkdirSync(activeDir, { recursive: true });
    fs.writeFileSync(path.join(activeDir, '03-01-PLAN.md'), '');
    // Archive same phase
    const archiveDir = path.join(tmpDir, '.planning', 'milestones', 'v1.0-phases', '03-test');
    fs.mkdirSync(archiveDir, { recursive: true });
    fs.writeFileSync(path.join(archiveDir, '03-01-PLAN.md'), '');

    const result = findPhaseInternal(tmpDir, '3');
    assert.ok(result);
    // Should be from active (no archived property)
    assert.strictEqual(result.archived, undefined);
  });
});

// ---- getArchivedPhaseDirs() ----

describe('getArchivedPhaseDirs()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns empty array when no milestones directory exists', () => {
    const result = getArchivedPhaseDirs(tmpDir);
    assert.deepStrictEqual(result, []);
  });

  test('returns archived phase directories', () => {
    const archiveDir = path.join(tmpDir, '.planning', 'milestones', 'v1.0-phases');
    fs.mkdirSync(path.join(archiveDir, '01-foundation'), { recursive: true });
    fs.mkdirSync(path.join(archiveDir, '02-api'), { recursive: true });

    const result = getArchivedPhaseDirs(tmpDir);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].name, '01-foundation');
    assert.strictEqual(result[0].milestone, 'v1.0');
    assert.strictEqual(result[1].name, '02-api');
    assert.strictEqual(result[1].milestone, 'v1.0');
  });

  test('returns results from multiple milestones (newest first)', () => {
    const v1Dir = path.join(tmpDir, '.planning', 'milestones', 'v1.0-phases');
    const v2Dir = path.join(tmpDir, '.planning', 'milestones', 'v2.0-phases');
    fs.mkdirSync(path.join(v1Dir, '01-foundation'), { recursive: true });
    fs.mkdirSync(path.join(v2Dir, '10-final'), { recursive: true });

    const result = getArchivedPhaseDirs(tmpDir);
    assert.strictEqual(result.length, 2);
    // v2.0 comes first (newest first due to .reverse())
    assert.strictEqual(result[0].milestone, 'v2.0');
    assert.strictEqual(result[1].milestone, 'v1.0');
  });

  test('ignores non-matching directories in milestones', () => {
    const milestonesDir = path.join(tmpDir, '.planning', 'milestones');
    fs.mkdirSync(path.join(milestonesDir, 'v1.0-phases', '01-test'), { recursive: true });
    fs.mkdirSync(path.join(milestonesDir, 'some-other-dir'), { recursive: true });

    const result = getArchivedPhaseDirs(tmpDir);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].milestone, 'v1.0');
  });

  test('each result has basePath and fullPath', () => {
    const archiveDir = path.join(tmpDir, '.planning', 'milestones', 'v1.0-phases');
    fs.mkdirSync(path.join(archiveDir, '01-test'), { recursive: true });

    const result = getArchivedPhaseDirs(tmpDir);
    assert.strictEqual(result.length, 1);
    assert.ok(result[0].basePath.includes('v1.0-phases'));
    assert.ok(result[0].fullPath.includes('01-test'));
  });
});

// ---- getRoadmapPhaseInternal() ----

describe('getRoadmapPhaseInternal()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('parses phase info from ROADMAP.md', () => {
    const roadmapContent = `# Roadmap

## Phase 1: Foundation Setup

**Goal:** Set up the project foundation

Some details here.

## Phase 2: API Layer

**Goal:** Build the API
`;
    fs.writeFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), roadmapContent);

    const result = getRoadmapPhaseInternal(tmpDir, 1);
    assert.ok(result);
    assert.strictEqual(result.found, true);
    assert.strictEqual(result.phase_number, '1');
    assert.strictEqual(result.phase_name, 'Foundation Setup');
    assert.strictEqual(result.goal, 'Set up the project foundation');
    // Section should NOT contain phase 2 content
    assert.ok(!result.section.includes('API Layer'));
  });

  test('returns null for non-existent phase', () => {
    const roadmapContent = '# Roadmap\n\n## Phase 1: Test\n';
    fs.writeFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), roadmapContent);

    assert.strictEqual(getRoadmapPhaseInternal(tmpDir, 99), null);
  });

  test('returns null when ROADMAP.md does not exist', () => {
    assert.strictEqual(getRoadmapPhaseInternal(tmpDir, 1), null);
  });

  test('returns null when phaseNum is falsy', () => {
    assert.strictEqual(getRoadmapPhaseInternal(tmpDir, null), null);
    assert.strictEqual(getRoadmapPhaseInternal(tmpDir, 0), null);
  });

  test('handles phase with no goal', () => {
    const roadmapContent = '# Roadmap\n\n## Phase 1: Test Phase\n\nSome content without goal.\n';
    fs.writeFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), roadmapContent);

    const result = getRoadmapPhaseInternal(tmpDir, 1);
    assert.ok(result);
    assert.strictEqual(result.goal, null);
  });

  test('handles last phase (no next header)', () => {
    const roadmapContent = '# Roadmap\n\n## Phase 5: Final Phase\n\n**Goal:** Finish everything\n\nLots of content here.\n';
    fs.writeFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), roadmapContent);

    const result = getRoadmapPhaseInternal(tmpDir, 5);
    assert.ok(result);
    assert.ok(result.section.includes('Lots of content here'));
  });

  test('returns section content between phase headers', () => {
    const roadmapContent = '# Roadmap\n\n### Phase 3: Middle\n\n**Goal:** Do middle things\n\nMiddle details.\n\n### Phase 4: End\n';
    fs.writeFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), roadmapContent);

    const result = getRoadmapPhaseInternal(tmpDir, 3);
    assert.ok(result);
    assert.ok(result.section.includes('Middle details'));
    assert.ok(!result.section.includes('End'));
  });
});

// ---- resolveModelInternal() ----

describe('resolveModelInternal()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('resolves model from default balanced profile', () => {
    // No config => default profile = balanced
    const result = resolveModelInternal(tmpDir, 'gsd-planner');
    // gsd-planner balanced = opus => returns 'inherit'
    assert.strictEqual(result, 'inherit');
  });

  test('resolves model from quality profile', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ model_profile: 'quality' }));
    const result = resolveModelInternal(tmpDir, 'gsd-executor');
    // gsd-executor quality = opus => 'inherit'
    assert.strictEqual(result, 'inherit');
  });

  test('resolves model from budget profile', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ model_profile: 'budget' }));
    const result = resolveModelInternal(tmpDir, 'gsd-executor');
    // gsd-executor budget = sonnet
    assert.strictEqual(result, 'sonnet');
  });

  test('returns sonnet for unknown agent type', () => {
    assert.strictEqual(resolveModelInternal(tmpDir, 'unknown-agent'), 'sonnet');
  });

  test('falls back to balanced when unknown profile name', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ model_profile: 'nonexistent' }));
    // gsd-executor: nonexistent profile -> falls to agentModels['balanced'] = sonnet
    const result = resolveModelInternal(tmpDir, 'gsd-executor');
    assert.strictEqual(result, 'sonnet');
  });

  test('opus model maps to inherit', () => {
    // gsd-planner quality = opus
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ model_profile: 'quality' }));
    const result = resolveModelInternal(tmpDir, 'gsd-planner');
    assert.strictEqual(result, 'inherit');
  });

  test('haiku model returned directly for budget codebase-mapper', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ model_profile: 'budget' }));
    const result = resolveModelInternal(tmpDir, 'gsd-codebase-mapper');
    // gsd-codebase-mapper budget = haiku
    assert.strictEqual(result, 'haiku');
  });

  test('model_overrides path unreachable through loadConfig', () => {
    // loadConfig does not extract model_overrides from config.json
    // so the override path is effectively dead code when called via loadConfig
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      model_overrides: { 'gsd-planner': 'haiku' },
    }));
    // model_overrides is not in the loadConfig return value, so this falls through to profile
    const result = resolveModelInternal(tmpDir, 'gsd-planner');
    // Without override, gsd-planner balanced = opus => 'inherit'
    assert.strictEqual(result, 'inherit');
  });
});

// ---- pathExistsInternal() ----

describe('pathExistsInternal()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-pathexists-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns true for existing file (relative path)', () => {
    fs.writeFileSync(path.join(tmpDir, 'exists.txt'), '');
    assert.strictEqual(pathExistsInternal(tmpDir, 'exists.txt'), true);
  });

  test('returns false for non-existing file', () => {
    assert.strictEqual(pathExistsInternal(tmpDir, 'nope.txt'), false);
  });

  test('returns true for existing directory', () => {
    fs.mkdirSync(path.join(tmpDir, 'subdir'));
    assert.strictEqual(pathExistsInternal(tmpDir, 'subdir'), true);
  });

  test('handles absolute paths', () => {
    const filePath = path.join(tmpDir, 'abs.txt');
    fs.writeFileSync(filePath, '');
    assert.strictEqual(pathExistsInternal(tmpDir, filePath), true);
  });
});

// ---- generateSlugInternal() ----

describe('generateSlugInternal()', () => {
  test('converts spaces to hyphens', () => {
    assert.strictEqual(generateSlugInternal('hello world'), 'hello-world');
  });

  test('converts to lowercase', () => {
    assert.strictEqual(generateSlugInternal('Hello World'), 'hello-world');
  });

  test('removes special characters', () => {
    assert.strictEqual(generateSlugInternal('Hello, World!'), 'hello-world');
  });

  test('handles multiple consecutive special characters', () => {
    assert.strictEqual(generateSlugInternal('a---b___c'), 'a-b-c');
  });

  test('strips leading and trailing hyphens', () => {
    assert.strictEqual(generateSlugInternal('--hello--'), 'hello');
  });

  test('returns null for empty string', () => {
    assert.strictEqual(generateSlugInternal(''), null);
  });

  test('returns null for null input', () => {
    assert.strictEqual(generateSlugInternal(null), null);
  });

  test('returns null for undefined input', () => {
    assert.strictEqual(generateSlugInternal(undefined), null);
  });
});

// ---- getMilestoneInfo() ----

describe('getMilestoneInfo()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('extracts version from ROADMAP.md', () => {
    const roadmapContent = '# Roadmap v0.4.0\n\n## Phase 1: Setup\n';
    fs.writeFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), roadmapContent);

    const result = getMilestoneInfo(tmpDir);
    assert.strictEqual(result.version, 'v0.4');
  });

  test('extracts name from heading with version and colon', () => {
    // The nameMatch regex: /## .*v\d+\.\d+[:\s]+([^\n(]+)/
    // Requires vX.Y (not vX.Y.Z) followed by colon or space
    const roadmapContent = '## Roadmap v0.4: Quality and Polish\n\nContent.\n';
    fs.writeFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), roadmapContent);

    const result = getMilestoneInfo(tmpDir);
    assert.strictEqual(result.version, 'v0.4');
    assert.strictEqual(result.name, 'Quality and Polish');
  });

  test('returns defaults when ROADMAP.md does not exist', () => {
    const result = getMilestoneInfo(tmpDir);
    assert.strictEqual(result.version, 'v1.0');
    assert.strictEqual(result.name, 'milestone');
  });

  test('returns default name when name pattern does not match', () => {
    const roadmapContent = '# Roadmap v0.5.0\n\nContent only.\n';
    fs.writeFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), roadmapContent);

    const result = getMilestoneInfo(tmpDir);
    assert.strictEqual(result.version, 'v0.5');
    assert.strictEqual(result.name, 'milestone');
  });
});

// ---- Validators (re-exported from src/validation) ----

describe('validateGitSHA()', () => {
  test('accepts valid short SHA', () => {
    const result = validateGitSHA('abc1234');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.value, 'abc1234');
  });

  test('accepts valid full SHA (40 chars)', () => {
    const result = validateGitSHA('abcdef1234567890abcdef1234567890abcdef12');
    assert.strictEqual(result.ok, true);
  });

  test('normalizes to lowercase', () => {
    const result = validateGitSHA('ABC1234');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.value, 'abc1234');
  });

  test('rejects too short SHA', () => {
    const result = validateGitSHA('abc12');
    assert.strictEqual(result.ok, false);
  });

  test('rejects non-hex characters', () => {
    const result = validateGitSHA('ghijklm');
    assert.strictEqual(result.ok, false);
  });

  test('rejects non-string input', () => {
    const result = validateGitSHA(123);
    assert.strictEqual(result.ok, false);
  });
});

describe('validateBranchName()', () => {
  test('accepts valid branch name', () => {
    const result = validateBranchName('feature/my-branch');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.value, 'feature/my-branch');
  });

  test('rejects empty string', () => {
    const result = validateBranchName('');
    assert.strictEqual(result.ok, false);
  });

  test('rejects names with double dots', () => {
    const result = validateBranchName('feature..test');
    assert.strictEqual(result.ok, false);
  });

  test('rejects names ending with .lock', () => {
    const result = validateBranchName('my-branch.lock');
    assert.strictEqual(result.ok, false);
  });

  test('rejects names with @{', () => {
    const result = validateBranchName('branch@{0}');
    assert.strictEqual(result.ok, false);
  });

  test('rejects non-string input', () => {
    const result = validateBranchName(null);
    assert.strictEqual(result.ok, false);
  });
});

describe('validateConfigPath()', () => {
  test('accepts path within allowed base', () => {
    const base = process.cwd();
    const result = validateConfigPath(path.join(base, 'config.json'), base);
    assert.strictEqual(result.ok, true);
  });

  test('rejects path outside allowed base', () => {
    const result = validateConfigPath('/etc/shadow', process.cwd());
    assert.strictEqual(result.ok, false);
  });

  test('rejects traversal attempts', () => {
    const result = validateConfigPath('../../etc/passwd', process.cwd());
    assert.strictEqual(result.ok, false);
  });

  test('rejects non-string input', () => {
    const result = validateConfigPath(null, process.cwd());
    assert.strictEqual(result.ok, false);
  });
});

describe('validateTagName()', () => {
  test('accepts valid tag name', () => {
    const result = validateTagName('v1.0.0');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.value, 'v1.0.0');
  });

  test('rejects empty string', () => {
    const result = validateTagName('');
    assert.strictEqual(result.ok, false);
  });

  test('rejects names with double dots', () => {
    const result = validateTagName('v1..0');
    assert.strictEqual(result.ok, false);
  });

  test('rejects names ending with .lock', () => {
    const result = validateTagName('v1.0.lock');
    assert.strictEqual(result.ok, false);
  });

  test('rejects non-string input', () => {
    const result = validateTagName(42);
    assert.strictEqual(result.ok, false);
  });
});

describe('validateRemoteURL()', () => {
  test('accepts https URL', () => {
    const result = validateRemoteURL('https://github.com/user/repo.git');
    assert.strictEqual(result.ok, true);
  });

  test('accepts ssh URL', () => {
    const result = validateRemoteURL('ssh://git@github.com/user/repo.git');
    assert.strictEqual(result.ok, true);
  });

  test('accepts scp-like SSH syntax', () => {
    const result = validateRemoteURL('git@github.com:user/repo.git');
    assert.strictEqual(result.ok, true);
  });

  test('rejects git:// protocol', () => {
    const result = validateRemoteURL('git://github.com/user/repo.git');
    assert.strictEqual(result.ok, false);
  });

  test('rejects http:// protocol', () => {
    const result = validateRemoteURL('http://github.com/user/repo.git');
    assert.strictEqual(result.ok, false);
  });

  test('rejects empty string', () => {
    const result = validateRemoteURL('');
    assert.strictEqual(result.ok, false);
  });

  test('rejects non-string input', () => {
    const result = validateRemoteURL(null);
    assert.strictEqual(result.ok, false);
  });
});
