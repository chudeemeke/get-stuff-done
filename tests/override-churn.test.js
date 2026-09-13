'use strict';

const { describe, test, expect, afterEach } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runWithTimeout } = require('./helpers');

const PROJECT_ROOT = path.join(__dirname, '..');
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts', 'generate-override-churn.js');

const tempDirs = [];

function makeTempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-override-churn-'));
  tempDirs.push(dir);
  return dir;
}

function writeFile(root, relPath, content) {
  const abs = path.join(root, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf-8');
}

function createFixture() {
  const root = makeTempDir();
  const fromUpstreamDir = path.join(root, 'from-upstream');
  const toUpstreamDir = path.join(root, 'to-upstream');
  const overridesDir = path.join(root, 'overrides');

  fs.mkdirSync(fromUpstreamDir, { recursive: true });
  fs.mkdirSync(toUpstreamDir, { recursive: true });
  fs.mkdirSync(overridesDir, { recursive: true });

  writeFile(fromUpstreamDir, 'hooks/carried.js', 'module.exports = "same";\n');
  writeFile(toUpstreamDir, 'hooks/carried.js', 'module.exports = "same";\n');

  writeFile(fromUpstreamDir, 'hooks/changed.js', 'module.exports = "before";\n');
  writeFile(toUpstreamDir, 'hooks/changed.js', 'module.exports = "after";\n');

  writeFile(toUpstreamDir, 'hooks/added.js', 'module.exports = "target only";\n');
  writeFile(fromUpstreamDir, 'hooks/removed.js', 'module.exports = "source only";\n');

  for (const relPath of [
    'hooks/orphaned.js',
    'hooks/removed.js',
    'hooks/changed.js',
    'hooks/carried.js',
    'hooks/added.js',
  ]) {
    writeFile(overridesDir, relPath, `// fork override for ${relPath}\n`);
    writeFile(overridesDir, `${relPath}.REASON.md`, `# Override: ${relPath}\n`);
  }

  return { root, fromUpstreamDir, toUpstreamDir, overridesDir };
}

function runCli(args) {
  return runWithTimeout(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: PROJECT_ROOT,
    encoding: 'utf-8',
  });
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('override churn classification', () => {
  test('classifies changed, carried, orphaned, added, and removed overrides deterministically', () => {
    const { generateOverrideChurn } = require('../scripts/generate-override-churn');
    const fixture = createFixture();

    const result = generateOverrideChurn({
      fromUpstreamDir: fixture.fromUpstreamDir,
      toUpstreamDir: fixture.toUpstreamDir,
      overridesDir: fixture.overridesDir,
    });

    expect(result.entries.map(entry => entry.relPath)).toEqual([
      'hooks/added.js',
      'hooks/carried.js',
      'hooks/changed.js',
      'hooks/orphaned.js',
      'hooks/removed.js',
    ]);
    expect(Object.fromEntries(result.entries.map(entry => [entry.relPath, entry.status]))).toEqual({
      'hooks/added.js': 'added',
      'hooks/carried.js': 'carried',
      'hooks/changed.js': 'changed',
      'hooks/orphaned.js': 'orphaned',
      'hooks/removed.js': 'removed',
    });
    expect(result.summary).toEqual({
      total: 5,
      changed: 1,
      carried: 1,
      orphaned: 1,
      added: 1,
      removed: 1,
    });
  });

  test('markdown output includes every churn class in path order', () => {
    const { generateOverrideChurn, formatMarkdown } = require('../scripts/generate-override-churn');
    const fixture = createFixture();

    const markdown = formatMarkdown(generateOverrideChurn({
      fromUpstreamDir: fixture.fromUpstreamDir,
      toUpstreamDir: fixture.toUpstreamDir,
      overridesDir: fixture.overridesDir,
    }));

    expect(markdown).toContain('### Override Churn');
    for (const status of ['changed', 'carried', 'orphaned', 'added', 'removed']) {
      expect(markdown).toContain(status);
    }
    expect(markdown.indexOf('hooks/added.js')).toBeLessThan(markdown.indexOf('hooks/carried.js'));
    expect(markdown.indexOf('hooks/carried.js')).toBeLessThan(markdown.indexOf('hooks/changed.js'));
  });
});

describe('CHANGELOG marker replacement', () => {
  test('replaces only content between override-churn:start and override-churn:end', () => {
    const { updateChangelogSection } = require('../scripts/generate-override-churn');
    const changelog = [
      '# Changelog',
      '',
      '## [Unreleased]',
      '',
      '### Added',
      '- Keep existing unreleased entry',
      '',
      '### Override Churn',
      '<!-- override-churn:start -->',
      '- old generated content',
      '<!-- override-churn:end -->',
      '',
      '## [1.0.0] - 2026-01-01',
      '- Keep published entry',
      '',
    ].join('\n');

    const updated = updateChangelogSection(changelog, '- new generated content');

    expect(updated).toContain('<!-- override-churn:start -->');
    expect(updated).toContain('<!-- override-churn:end -->');
    expect(updated).toContain('- new generated content');
    expect(updated).not.toContain('- old generated content');
    expect(updated).toContain('- Keep existing unreleased entry');
    expect(updated).toContain('- Keep published entry');
  });
});

describe('override churn CLI', () => {
  test('prints help and exits 0', () => {
    const result = runCli(['--help']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('generate-override-churn');
    expect(result.stdout).toContain('--from-upstream-dir');
  });

  test('emits deterministic JSON for fixture inputs', () => {
    const fixture = createFixture();
    const result = runCli([
      '--from-upstream-dir',
      fixture.fromUpstreamDir,
      '--to-upstream-dir',
      fixture.toUpstreamDir,
      '--overrides-dir',
      fixture.overridesDir,
      '--json',
    ]);

    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.entries.map(entry => entry.status)).toEqual([
      'added',
      'carried',
      'changed',
      'orphaned',
      'removed',
    ]);
  });

  test('documents required fixture inputs when --json is used without upstream dirs', () => {
    const result = runCli(['--json']);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('--from-upstream-dir');
    expect(result.stderr).toContain('--to-upstream-dir');
  });
});
