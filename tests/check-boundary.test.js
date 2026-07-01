'use strict';

/**
 * Phase 34 Plan 02 -- check-boundary.js Tests
 *
 * Tests for the repo boundary enforcement script in scripts/check-boundary.js.
 * Covers requirement CI-01: detect upstream files existing in repo outside
 * overrides/ and dist/.
 */

const { describe, test, expect, afterEach } = require('bun:test');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const CHECK_BOUNDARY_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'check-boundary.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a temporary directory for isolated tests.
 */
function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-check-boundary-test-'));
}

/**
 * Remove a directory tree recursively.
 */
function rmDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Create a mock project structure for boundary testing.
 *
 * @param {object} opts
 * @param {string[]} opts.upstreamFiles - Relative paths to create in the upstream dir
 * @param {string[]} opts.repoFiles - Relative paths to create in the project dir
 * @param {string[]} [opts.overrideFiles] - Relative paths to create under overrides/
 * @param {string[]} [opts.distFiles] - Relative paths to create under dist/
 * @returns {{ tmpDir, upstreamDir, projectDir }}
 */
function createFixture(opts = {}) {
  const tmpDir = makeTempDir();
  const upstreamDir = path.join(tmpDir, 'upstream');
  const projectDir = path.join(tmpDir, 'project');

  // Create upstream directory with files
  fs.mkdirSync(upstreamDir, { recursive: true });
  for (const relPath of (opts.upstreamFiles || [])) {
    const abs = path.join(upstreamDir, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, `upstream: ${relPath}`, 'utf-8');
  }

  // Create project directory with files
  fs.mkdirSync(projectDir, { recursive: true });
  for (const relPath of (opts.repoFiles || [])) {
    const abs = path.join(projectDir, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, `repo: ${relPath}`, 'utf-8');
  }

  // Create override files (under overrides/)
  for (const relPath of (opts.overrideFiles || [])) {
    const abs = path.join(projectDir, 'overrides', relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, `override: ${relPath}`, 'utf-8');
  }

  // Create dist files (under dist/)
  for (const relPath of (opts.distFiles || [])) {
    const abs = path.join(projectDir, 'dist', relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, `dist: ${relPath}`, 'utf-8');
  }

  return { tmpDir, upstreamDir, projectDir };
}

// ---------------------------------------------------------------------------
// Module exports
// ---------------------------------------------------------------------------

describe('check-boundary module exports', () => {
  test('checkBoundary is an exported function', () => {
    const mod = require('../scripts/check-boundary');
    expect(typeof mod.checkBoundary).toBe('function');
  });

  test('module can be required without error', () => {
    expect(() => require('../scripts/check-boundary')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// No violations (clean repo)
// ---------------------------------------------------------------------------

describe('no boundary violations', () => {
  let tmpDir;

  afterEach(() => rmDir(tmpDir));

  test('returns ok:true and empty violations when no upstream files in repo', () => {
    const fixture = createFixture({
      upstreamFiles: ['bin/tool.cjs', 'lib/config.cjs'],
      repoFiles: ['package.json', 'README.md'],
    });
    tmpDir = fixture.tmpDir;
    const { checkBoundary } = require('../scripts/check-boundary');
    const result = checkBoundary({
      upstreamDir: fixture.upstreamDir,
      projectDir: fixture.projectDir,
    });
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  test('returns ok:true when project has zero files', () => {
    const fixture = createFixture({
      upstreamFiles: ['bin/tool.cjs'],
      repoFiles: [],
    });
    tmpDir = fixture.tmpDir;
    const { checkBoundary } = require('../scripts/check-boundary');
    const result = checkBoundary({
      upstreamDir: fixture.upstreamDir,
      projectDir: fixture.projectDir,
    });
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Violations detected
// ---------------------------------------------------------------------------

describe('boundary violations', () => {
  let tmpDir;

  afterEach(() => rmDir(tmpDir));

  test('file matching upstream path triggers a violation', () => {
    const fixture = createFixture({
      upstreamFiles: ['bin/tool.cjs', 'lib/config.cjs'],
      repoFiles: ['bin/tool.cjs'], // matches upstream path
    });
    tmpDir = fixture.tmpDir;
    const { checkBoundary } = require('../scripts/check-boundary');
    const result = checkBoundary({
      upstreamDir: fixture.upstreamDir,
      projectDir: fixture.projectDir,
    });
    expect(result.ok).toBe(false);
    expect(result.violations.length).toBe(1);
    expect(result.violations[0]).toBe('bin/tool.cjs');
  });

  test('multiple matching files all reported as violations', () => {
    const fixture = createFixture({
      upstreamFiles: ['bin/tool.cjs', 'lib/config.cjs', 'lib/runner.cjs'],
      repoFiles: ['bin/tool.cjs', 'lib/config.cjs'],
    });
    tmpDir = fixture.tmpDir;
    const { checkBoundary } = require('../scripts/check-boundary');
    const result = checkBoundary({
      upstreamDir: fixture.upstreamDir,
      projectDir: fixture.projectDir,
    });
    expect(result.ok).toBe(false);
    expect(result.violations.length).toBe(2);
    expect(result.violations).toContain('bin/tool.cjs');
    expect(result.violations).toContain('lib/config.cjs');
  });
});

// ---------------------------------------------------------------------------
// Allowed directories (not violations)
// ---------------------------------------------------------------------------

describe('allowed directories', () => {
  let tmpDir;

  afterEach(() => rmDir(tmpDir));

  test('files in overrides/ are not violations', () => {
    const fixture = createFixture({
      upstreamFiles: ['bin/tool.cjs'],
      repoFiles: [],
      overrideFiles: ['bin/tool.cjs'], // same path but under overrides/
    });
    tmpDir = fixture.tmpDir;
    const { checkBoundary } = require('../scripts/check-boundary');
    const result = checkBoundary({
      upstreamDir: fixture.upstreamDir,
      projectDir: fixture.projectDir,
    });
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  test('files in dist/ are not violations', () => {
    const fixture = createFixture({
      upstreamFiles: ['bin/tool.cjs'],
      repoFiles: [],
      distFiles: ['bin/tool.cjs'], // same path but under dist/
    });
    tmpDir = fixture.tmpDir;
    const { checkBoundary } = require('../scripts/check-boundary');
    const result = checkBoundary({
      upstreamDir: fixture.upstreamDir,
      projectDir: fixture.projectDir,
    });
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  test('files in node_modules/ are not violations', () => {
    const fixture = createFixture({
      upstreamFiles: ['bin/tool.cjs'],
      repoFiles: [],
    });
    tmpDir = fixture.tmpDir;
    // Manually create a matching file under node_modules/
    const nmFile = path.join(fixture.projectDir, 'node_modules', 'bin', 'tool.cjs');
    fs.mkdirSync(path.dirname(nmFile), { recursive: true });
    fs.writeFileSync(nmFile, 'nm content', 'utf-8');

    const { checkBoundary } = require('../scripts/check-boundary');
    const result = checkBoundary({
      upstreamDir: fixture.upstreamDir,
      projectDir: fixture.projectDir,
    });
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  test('.git/ directory is excluded from scanning', () => {
    const fixture = createFixture({
      upstreamFiles: ['bin/tool.cjs'],
      repoFiles: [],
    });
    tmpDir = fixture.tmpDir;
    // Create a matching file under .git/
    const gitFile = path.join(fixture.projectDir, '.git', 'bin', 'tool.cjs');
    fs.mkdirSync(path.dirname(gitFile), { recursive: true });
    fs.writeFileSync(gitFile, 'git content', 'utf-8');

    const { checkBoundary } = require('../scripts/check-boundary');
    const result = checkBoundary({
      upstreamDir: fixture.upstreamDir,
      projectDir: fixture.projectDir,
    });
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  test('tests/ directory is excluded from scanning', () => {
    const fixture = createFixture({
      upstreamFiles: ['bin/tool.cjs'],
      repoFiles: [],
    });
    tmpDir = fixture.tmpDir;
    // Create a matching file under tests/
    const testFile = path.join(fixture.projectDir, 'tests', 'bin', 'tool.cjs');
    fs.mkdirSync(path.dirname(testFile), { recursive: true });
    fs.writeFileSync(testFile, 'test content', 'utf-8');

    const { checkBoundary } = require('../scripts/check-boundary');
    const result = checkBoundary({
      upstreamDir: fixture.upstreamDir,
      projectDir: fixture.projectDir,
    });
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  test('.planning/ directory is excluded from scanning', () => {
    const fixture = createFixture({
      upstreamFiles: ['bin/tool.cjs'],
      repoFiles: [],
    });
    tmpDir = fixture.tmpDir;
    const planFile = path.join(fixture.projectDir, '.planning', 'bin', 'tool.cjs');
    fs.mkdirSync(path.dirname(planFile), { recursive: true });
    fs.writeFileSync(planFile, 'planning content', 'utf-8');

    const { checkBoundary } = require('../scripts/check-boundary');
    const result = checkBoundary({
      upstreamDir: fixture.upstreamDir,
      projectDir: fixture.projectDir,
    });
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// CLI exit codes
// ---------------------------------------------------------------------------

describe('CLI exit codes', () => {
  let tmpDir;

  afterEach(() => rmDir(tmpDir));

  test('exits 0 when no violations found', () => {
    const fixture = createFixture({
      upstreamFiles: ['bin/tool.cjs'],
      repoFiles: ['package.json'],
    });
    tmpDir = fixture.tmpDir;

    const result = spawnSync(
      process.execPath,
      [CHECK_BOUNDARY_SCRIPT, '--upstream-dir', fixture.upstreamDir, '--project-dir', fixture.projectDir],
      { encoding: 'utf-8' }
    );
    expect(result.status).toBe(0);
  });

  test('exits 1 when violations found', () => {
    const fixture = createFixture({
      upstreamFiles: ['bin/tool.cjs'],
      repoFiles: ['bin/tool.cjs'],
    });
    tmpDir = fixture.tmpDir;

    const result = spawnSync(
      process.execPath,
      [CHECK_BOUNDARY_SCRIPT, '--upstream-dir', fixture.upstreamDir, '--project-dir', fixture.projectDir],
      { encoding: 'utf-8' }
    );
    expect(result.status).toBe(1);
  });

  test('exits 0 in report-only mode when violations found', () => {
    const fixture = createFixture({
      upstreamFiles: ['bin/tool.cjs'],
      repoFiles: ['bin/tool.cjs'],
    });
    tmpDir = fixture.tmpDir;

    const result = spawnSync(
      process.execPath,
      [
        CHECK_BOUNDARY_SCRIPT,
        '--report-only',
        '--upstream-dir',
        fixture.upstreamDir,
        '--project-dir',
        fixture.projectDir,
      ],
      { encoding: 'utf-8' }
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('bin/tool.cjs');
  });

  test('CLI output includes violation path when violations found', () => {
    const fixture = createFixture({
      upstreamFiles: ['bin/tool.cjs'],
      repoFiles: ['bin/tool.cjs'],
    });
    tmpDir = fixture.tmpDir;

    const result = spawnSync(
      process.execPath,
      [CHECK_BOUNDARY_SCRIPT, '--upstream-dir', fixture.upstreamDir, '--project-dir', fixture.projectDir],
      { encoding: 'utf-8' }
    );
    expect(result.stdout).toContain('bin/tool.cjs');
  });

  test('CLI output includes clean message when no violations', () => {
    const fixture = createFixture({
      upstreamFiles: ['bin/tool.cjs'],
      repoFiles: ['package.json'],
    });
    tmpDir = fixture.tmpDir;

    const result = spawnSync(
      process.execPath,
      [CHECK_BOUNDARY_SCRIPT, '--upstream-dir', fixture.upstreamDir, '--project-dir', fixture.projectDir],
      { encoding: 'utf-8' }
    );
    expect(result.stdout).toContain('No boundary violations');
  });
});

// ---------------------------------------------------------------------------
// formatReport unit tests
// ---------------------------------------------------------------------------

describe('formatReport', () => {
  const { formatReport } = require('../scripts/check-boundary');

  test('clean result produces no-violation message', () => {
    const report = formatReport({ ok: true, violations: [] });
    expect(report).toContain('No boundary violations found');
  });

  test('violations produce count and file list', () => {
    const report = formatReport({ ok: false, violations: ['bin/tool.cjs', 'lib/config.cjs'] });
    expect(report).toContain('2 boundary violation(s)');
    expect(report).toContain('bin/tool.cjs');
    expect(report).toContain('lib/config.cjs');
    expect(report).toContain('Move to overrides/ or remove from repo');
  });
});

// ---------------------------------------------------------------------------
// parseArgs unit tests
// ---------------------------------------------------------------------------

describe('parseArgs', () => {
  const { parseArgs } = require('../scripts/check-boundary');

  test('parses --upstream-dir flag', () => {
    const opts = parseArgs(['--upstream-dir', '/tmp/upstream']);
    expect(opts.upstreamDir).toBe('/tmp/upstream');
  });

  test('parses --project-dir flag', () => {
    const opts = parseArgs(['--project-dir', '/tmp/project']);
    expect(opts.projectDir).toBe('/tmp/project');
  });

  test('parses --report-only flag', () => {
    const opts = parseArgs(['--report-only']);
    expect(opts.reportOnly).toBe(true);
  });

  test('parses both flags', () => {
    const opts = parseArgs(['--upstream-dir', '/tmp/up', '--project-dir', '/tmp/proj']);
    expect(opts.upstreamDir).toBe('/tmp/up');
    expect(opts.projectDir).toBe('/tmp/proj');
  });

  test('returns empty opts for no flags', () => {
    const opts = parseArgs([]);
    expect(opts.upstreamDir).toBeUndefined();
    expect(opts.projectDir).toBeUndefined();
  });
});
