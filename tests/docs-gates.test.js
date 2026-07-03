const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = path.join(PROJECT_ROOT, 'package.json');
const LINT_DOCS = path.join(PROJECT_ROOT, 'scripts', 'lint-docs.js');
const MARKDOWNLINT_CONFIG = path.join(PROJECT_ROOT, '.markdownlint-cli2.yaml');
const LYCHEE_CONFIG = path.join(PROJECT_ROOT, 'lychee.toml');

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('Phase 42 docs gate package contract', () => {
  test('package exposes markdownlint-cli2 through lint:docs', () => {
    const pkg = JSON.parse(readText(PACKAGE_JSON));

    expect(pkg.scripts['lint:docs']).toBe('node scripts/lint-docs.js');
    expect(pkg.devDependencies['markdownlint-cli2']).toBe('0.23.0');
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
});
