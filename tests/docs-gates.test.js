const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = path.join(PROJECT_ROOT, 'package.json');
const LINT_DOCS = path.join(PROJECT_ROOT, 'scripts', 'lint-docs.js');
const MARKDOWNLINT_CONFIG = path.join(PROJECT_ROOT, '.markdownlint-cli2.yaml');
const LYCHEE_CONFIG = path.join(PROJECT_ROOT, 'lychee.toml');
const CI_WORKFLOW = path.join(PROJECT_ROOT, '.github', 'workflows', 'ci.yml');
const AVAILABILITY_WORKFLOW = path.join(
  PROJECT_ROOT,
  '.github',
  'workflows',
  'docs-link-availability.yml'
);

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('Phase 42 docs gate package contract', () => {
  test('package exposes markdownlint-cli2 through lint:docs', () => {
    const pkg = JSON.parse(readText(PACKAGE_JSON));

    expect(pkg.scripts['lint:docs']).toBe('node scripts/lint-docs.js');
    // Phase 42 contract: an exact pin (no range), so the docs gate is
    // reproducible. The specific version moves with security bumps.
    expect(pkg.devDependencies['markdownlint-cli2']).toMatch(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  });

  test('docs lint script uses tracked markdown targets with narrow generated exclusions', () => {
    expect(fs.existsSync(LINT_DOCS)).toBe(true);

    const script = readText(LINT_DOCS);

    expect(script).toContain('git');
    expect(script).toContain('ls-files');
    expect(script).toContain('*.md');
    expect(script).not.toContain('**/*.md');
    expect(script).toContain('node_modules/');
    expect(script).toContain('dist/');
    expect(script).toContain('.upstream/');
    expect(script).toContain('overlay/get-shit-done/');
    expect(script).not.toContain('.planning/');
    expect(script).not.toContain('docs/');
  });

  test('markdownlint and lychee configs exist without broad documentation ignores', () => {
    expect(fs.existsSync(MARKDOWNLINT_CONFIG)).toBe(true);
    expect(fs.existsSync(LYCHEE_CONFIG)).toBe(true);

    const markdownlint = readText(MARKDOWNLINT_CONFIG);
    const lychee = readText(LYCHEE_CONFIG);

    expect(markdownlint).toContain('MD013');
    expect(lychee).toContain('^node_modules/');
    expect(lychee).toContain('^dist/');
    expect(lychee).toContain('^\\\\.upstream/');
    expect(lychee).toContain('^overlay/get-shit-done/');
    expect(lychee).not.toContain('.planning/**');
    expect(lychee).not.toContain('docs/**');
  });

  test('project-owned documentation failures remain blocking', () => {
    const workflow = readText(CI_WORKFLOW);
    const lychee = readText(LYCHEE_CONFIG);

    expect(workflow).toContain('name: Docs Gates');
    expect(workflow).toContain('fail: "true"');
    expect(workflow).toContain('failIfEmpty: "true"');
    expect(lychee).not.toContain('500');
    expect(lychee).not.toContain('400..=599');
  });

  test('decorative third-party availability is scoped to a read-only scheduled report', () => {
    const lychee = readText(LYCHEE_CONFIG);
    const workflow = readText(AVAILABILITY_WORKFLOW);

    expect(lychee).toContain('^https://api\\\\.star-history\\\\.com/');
    expect(workflow).toContain('schedule:');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).not.toContain('pull_request:');
    expect(workflow).not.toContain('push:');
    expect(workflow).toContain('permissions:\n  contents: read');
    expect(workflow).not.toContain('issues: write');
    expect(workflow).toContain('--retry 3');
    expect(workflow).toContain('404|410');
    expect(workflow).toContain('link-rot-candidate');
    expect(workflow).toContain('availability-degradation');
    expect(workflow).toContain('recurrence');
    expect(workflow).toContain('GITHUB_STEP_SUMMARY');
    expect(workflow).toContain('decorative-link-availability-${{ github.run_id }}');
  });
});

// A captured record (a review packet, a transcript) is not a document the project
// maintains: its bytes are bound by a receipt and cannot be restyled. It is exempt from
// the style lint by identity, never by location, so the gate keeps its full scope.
describe('docs lint: registered captures', () => {
  const { createHash } = require('crypto');
  const lintDocs = require('../scripts/lint-docs.js');
  const digestOf = name => createHash('sha256').update(fs.readFileSync(path.join(PROJECT_ROOT, name))).digest('hex');
  const A = 'a'.repeat(64);
  const B = 'b'.repeat(64);

  test('a registered capture with its registered bytes is not linted; everything else is', () => {
    const result = lintDocs.partitionCaptures(['kept.md', 'capture.md'], { 'capture.md': A }, () => A);
    expect(result).toEqual({ targets: ['kept.md'], problems: [] });
  });

  test('a registered capture whose bytes changed fails the gate instead of being skipped', () => {
    const result = lintDocs.partitionCaptures(['capture.md'], { 'capture.md': A }, () => B);
    expect(result.targets).toEqual([]);
    expect(result.problems).toEqual(['registered capture changed: capture.md']);
  });

  test('a registered capture that is not a tracked markdown file fails the gate', () => {
    const result = lintDocs.partitionCaptures(['kept.md'], { 'gone.md': A }, () => A);
    expect(result.targets).toEqual(['kept.md']);
    expect(result.problems).toEqual(['registered capture is not a tracked markdown file: gone.md']);
  });

  test('a registry that is not a map of path to SHA-256 is refused', () => {
    for (const registry of [null, [], { captures: [] }, { captures: { 'x.md': 'short' } }, { captures: { 'x.md': 7 } },
      { captures: { 'x.md': A }, extra: true }]) {
      expect(() => lintDocs.parseCaptures(JSON.stringify(registry))).toThrow();
    }
    expect(lintDocs.parseCaptures(JSON.stringify({ captures: { 'x.md': A } }))).toEqual({ 'x.md': A });
  });

  test('the committed registry holds only evidence captures, each tracked and byte-identical', () => {
    const captures = lintDocs.parseCaptures(readText(lintDocs.CAPTURES_FILE));
    const names = Object.keys(captures);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) expect(name.startsWith('.planning/evidence/')).toBe(true);
    const result = lintDocs.partitionCaptures(lintDocs.runGitLsFiles(), captures, digestOf);
    expect(result.problems).toEqual([]);
  });

  test('evidence is stored byte-exact, so a registered digest holds on every platform', () => {
    expect(readText(path.join(PROJECT_ROOT, '.gitattributes'))).toContain('.planning/evidence/** -text');
  });
});
