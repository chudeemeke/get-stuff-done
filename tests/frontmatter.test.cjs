/**
 * GSD Tools Tests - Frontmatter
 *
 * Tests frontmatter.cjs pure functions directly (extractFrontmatter,
 * reconstructFrontmatter, spliceFrontmatter, parseMustHavesBlock) and
 * CLI commands via both direct calls with process boundary capture and
 * subprocess execution.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { resolveCompatPackageRoot } = require('./helpers/compat-package-root.cjs');
const COMPAT_PACKAGE_ROOT = resolveCompatPackageRoot();
const { createGsdToolsHelpers, createTempProject, cleanup } = require('./helpers.cjs');
const { runGsdTools, runGsdToolsDirect } = createGsdToolsHelpers(COMPAT_PACKAGE_ROOT);

const {
  extractFrontmatter,
  reconstructFrontmatter,
  spliceFrontmatter,
  parseMustHavesBlock,
  FRONTMATTER_SCHEMAS,
  cmdFrontmatterGet,
  cmdFrontmatterSet,
  cmdFrontmatterMerge,
  cmdFrontmatterValidate,
} = require(path.join(COMPAT_PACKAGE_ROOT, 'bin', 'lib', 'frontmatter.cjs'));
const { captureCommandOutput } = require('./helpers/capture-command-output.cjs');

const captureOutput = captureCommandOutput;

// ============================================================================
// extractFrontmatter — pure function tests
// ============================================================================

describe('extractFrontmatter', () => {
  test('returns empty object when no frontmatter present', () => {
    const result = extractFrontmatter('# Just a heading\nSome content');
    assert.deepStrictEqual(result, {});
  });

  test('returns empty object for empty string', () => {
    const result = extractFrontmatter('');
    assert.deepStrictEqual(result, {});
  });

  test('extracts simple key-value pairs', () => {
    const content = '---\nphase: 01\nplan: 02\ntype: execute\n---\n\n# Content';
    const result = extractFrontmatter(content);
    assert.strictEqual(result.phase, '01');
    assert.strictEqual(result.plan, '02');
    assert.strictEqual(result.type, 'execute');
  });

  test('handles boolean values', () => {
    const content = '---\nautonomous: true\ncommit_docs: false\n---';
    const result = extractFrontmatter(content);
    assert.strictEqual(result.autonomous, 'true');
    assert.strictEqual(result.commit_docs, 'false');
  });

  test('handles numeric values', () => {
    const content = '---\nwave: 1\nscore: 95\n---';
    const result = extractFrontmatter(content);
    assert.strictEqual(result.wave, '1');
    assert.strictEqual(result.score, '95');
  });

  test('handles quoted string values', () => {
    const content = '---\nname: "my project"\ndesc: \'single quoted\'\n---';
    const result = extractFrontmatter(content);
    assert.strictEqual(result.name, 'my project');
    assert.strictEqual(result.desc, 'single quoted');
  });

  test('handles inline arrays', () => {
    const content = '---\ndepends_on: [plan-01, plan-02]\ntags: [a, b, c]\n---';
    const result = extractFrontmatter(content);
    assert.deepStrictEqual(result.depends_on, ['plan-01', 'plan-02']);
    assert.deepStrictEqual(result.tags, ['a', 'b', 'c']);
  });

  test('handles empty inline array', () => {
    const content = '---\ndepends_on: []\n---';
    const result = extractFrontmatter(content);
    assert.deepStrictEqual(result.depends_on, []);
  });

  test('handles multi-line arrays (YAML list syntax)', () => {
    const content = '---\nfiles_modified:\n  - src/foo.js\n  - src/bar.js\n---';
    const result = extractFrontmatter(content);
    assert.deepStrictEqual(result.files_modified, ['src/foo.js', 'src/bar.js']);
  });

  test('handles nested objects', () => {
    const content = '---\nworkflow:\n  research: true\n  plan_check: false\n---';
    const result = extractFrontmatter(content);
    assert.strictEqual(result.workflow.research, 'true');
    assert.strictEqual(result.workflow.plan_check, 'false');
  });

  test('handles deeply nested structure (must_haves)', () => {
    const content = '---\nmust_haves:\n  truths:\n    - "condition A"\n    - "condition B"\n---';
    const result = extractFrontmatter(content);
    assert.ok(result.must_haves);
    assert.deepStrictEqual(result.must_haves.truths, ['condition A', 'condition B']);
  });

  test('handles key with opening bracket value', () => {
    const content = '---\nitems: [\n---';
    const result = extractFrontmatter(content);
    assert.deepStrictEqual(result.items, []);
  });

  test('skips empty lines in frontmatter', () => {
    const content = '---\nphase: 01\n\nplan: 02\n---';
    const result = extractFrontmatter(content);
    assert.strictEqual(result.phase, '01');
    assert.strictEqual(result.plan, '02');
  });

  test('pops stack when indent decreases', () => {
    const content = '---\nouter:\n  inner: value\ntop_level: after\n---';
    const result = extractFrontmatter(content);
    assert.strictEqual(result.outer.inner, 'value');
    assert.strictEqual(result.top_level, 'after');
  });

  test('parses pure CRLF frontmatter', () => {
    const content = '---\r\nphase: 01\r\nplan: 02\r\n---\r\n';
    const result = extractFrontmatter(content);
    assert.deepStrictEqual(result, { phase: '01', plan: '02' });
  });

  test('handles inline array with quoted values', () => {
    const content = '---\ntags: ["feat", "fix"]\n---';
    const result = extractFrontmatter(content);
    assert.deepStrictEqual(result.tags, ['feat', 'fix']);
  });

  test('handles array item pushing to existing array', () => {
    const content = '---\nitems: [\n  - first\n  - second\n---';
    const result = extractFrontmatter(content);
    assert.ok(Array.isArray(result.items));
  });
});

// ============================================================================
// reconstructFrontmatter — pure function tests
// ============================================================================

describe('reconstructFrontmatter', () => {
  test('reconstructs simple key-value pairs', () => {
    const result = reconstructFrontmatter({ phase: '01', plan: '02', type: 'execute' });
    assert.ok(result.includes('phase: 01'));
    assert.ok(result.includes('plan: 02'));
    assert.ok(result.includes('type: execute'));
  });

  test('skips null and undefined values', () => {
    const result = reconstructFrontmatter({ phase: '01', skip_null: null, skip_undef: undefined });
    assert.ok(result.includes('phase: 01'));
    assert.ok(!result.includes('skip_null'));
    assert.ok(!result.includes('skip_undef'));
  });

  test('handles empty arrays', () => {
    const result = reconstructFrontmatter({ depends_on: [] });
    assert.strictEqual(result, 'depends_on: []');
  });

  test('handles short inline arrays (3 items or less)', () => {
    const result = reconstructFrontmatter({ tags: ['a', 'b', 'c'] });
    assert.strictEqual(result, 'tags: [a, b, c]');
  });

  test('handles long arrays (more than 3 items) as multi-line', () => {
    const result = reconstructFrontmatter({ tags: ['a', 'b', 'c', 'd'] });
    assert.ok(result.includes('tags:'));
    assert.ok(result.includes('  - a'));
    assert.ok(result.includes('  - d'));
  });

  test('quotes array items containing colons or hashes', () => {
    const result = reconstructFrontmatter({ items: ['normal', 'has: colon', 'has# hash', 'extra'] });
    assert.ok(result.includes('  - "has: colon"'));
    assert.ok(result.includes('  - "has# hash"'));
    assert.ok(result.includes('  - normal'));
  });

  test('handles nested objects', () => {
    const result = reconstructFrontmatter({ workflow: { research: true, plan_check: false } });
    assert.ok(result.includes('workflow:'));
    assert.ok(result.includes('  research: true'));
    assert.ok(result.includes('  plan_check: false'));
  });

  test('skips null/undefined in nested objects', () => {
    const result = reconstructFrontmatter({ outer: { keep: 'yes', skip: null } });
    assert.ok(result.includes('  keep: yes'));
    assert.ok(!result.includes('skip'));
  });

  test('handles nested object with array values', () => {
    const result = reconstructFrontmatter({ outer: { tags: ['a', 'b'] } });
    assert.ok(result.includes('outer:'));
    assert.ok(result.includes('  tags: [a, b]'));
  });

  test('handles nested object with empty array', () => {
    const result = reconstructFrontmatter({ outer: { items: [] } });
    assert.ok(result.includes('  items: []'));
  });

  test('handles nested object with long array (multi-line)', () => {
    const result = reconstructFrontmatter({ outer: { items: ['a', 'b', 'c', 'd'] } });
    assert.ok(result.includes('  items:'));
    assert.ok(result.includes('    - a'));
  });

  test('handles nested array items with colons/hashes', () => {
    const result = reconstructFrontmatter({ outer: { items: ['has: colon', 'normal', 'has# hash', 'extra'] } });
    assert.ok(result.includes('    - "has: colon"'));
    assert.ok(result.includes('    - "has# hash"'));
  });

  test('handles deeply nested objects (3 levels)', () => {
    const result = reconstructFrontmatter({
      level1: { level2: { key: 'val' } },
    });
    assert.ok(result.includes('level1:'));
    assert.ok(result.includes('  level2:'));
    assert.ok(result.includes('    key: val'));
  });

  test('handles deeply nested objects with null/undefined', () => {
    const result = reconstructFrontmatter({
      level1: { level2: { keep: 'yes', skip: null, undef: undefined } },
    });
    assert.ok(result.includes('    keep: yes'));
    assert.ok(!result.includes('skip'));
    assert.ok(!result.includes('undef'));
  });

  test('handles deeply nested objects with arrays', () => {
    const result = reconstructFrontmatter({
      level1: { level2: { items: ['x', 'y'] } },
    });
    // Sub-sub arrays with <=3 items but length check differs at depth 3
    assert.ok(result.includes('    items:'));
  });

  test('handles deeply nested objects with empty arrays', () => {
    const result = reconstructFrontmatter({
      level1: { level2: { items: [] } },
    });
    assert.ok(result.includes('    items: []'));
  });

  test('handles string values containing colons', () => {
    const result = reconstructFrontmatter({ url: 'http://example.com' });
    assert.ok(result.includes('url: "http://example.com"'));
  });

  test('handles string values containing hashes', () => {
    const result = reconstructFrontmatter({ comment: 'has # hash' });
    assert.ok(result.includes('comment: "has # hash"'));
  });

  test('handles string values starting with bracket', () => {
    const result = reconstructFrontmatter({ val: '[not array]' });
    assert.ok(result.includes('val: "[not array]"'));
  });

  test('handles string values starting with brace', () => {
    const result = reconstructFrontmatter({ val: '{not object}' });
    assert.ok(result.includes('val: "{not object}"'));
  });

  test('handles plain string values without quoting', () => {
    const result = reconstructFrontmatter({ name: 'simple' });
    assert.strictEqual(result, 'name: simple');
  });

  test('handles boolean values', () => {
    const result = reconstructFrontmatter({ flag: true });
    assert.strictEqual(result, 'flag: true');
  });

  test('handles numeric values', () => {
    const result = reconstructFrontmatter({ count: 42 });
    assert.strictEqual(result, 'count: 42');
  });

  test('handles nested subval with colon', () => {
    const result = reconstructFrontmatter({ outer: { url: 'http://test.com' } });
    assert.ok(result.includes('  url: "http://test.com"'));
  });

  test('handles nested subval with hash', () => {
    const result = reconstructFrontmatter({ outer: { note: 'has# hash' } });
    assert.ok(result.includes('  note: "has# hash"'));
  });

  test('roundtrip preserves data for simple frontmatter', () => {
    const original = { phase: '01', plan: '02', type: 'execute', wave: '1' };
    const reconstructed = reconstructFrontmatter(original);
    const reparsed = extractFrontmatter('---\n' + reconstructed + '\n---');
    assert.deepStrictEqual(reparsed, original);
  });

  test('roundtrip preserves arrays', () => {
    const original = { tags: ['a', 'b'] };
    const reconstructed = reconstructFrontmatter(original);
    const reparsed = extractFrontmatter('---\n' + reconstructed + '\n---');
    assert.deepStrictEqual(reparsed, original);
  });
});

// ============================================================================
// spliceFrontmatter — pure function tests
// ============================================================================

describe('spliceFrontmatter', () => {
  test('replaces existing frontmatter in content', () => {
    const content = '---\nphase: 01\n---\n\n# Heading\nBody text';
    const result = spliceFrontmatter(content, { phase: '02', plan: '01' });
    assert.ok(result.startsWith('---\nphase: 02\nplan: 01\n---'));
    assert.ok(result.includes('# Heading'));
    assert.ok(result.includes('Body text'));
  });

  test('adds frontmatter to content that has none', () => {
    const content = '# Just a heading\nSome body';
    const result = spliceFrontmatter(content, { phase: '01' });
    assert.ok(result.startsWith('---\nphase: 01\n---\n\n'));
    assert.ok(result.includes('# Just a heading'));
  });

  test('preserves content after frontmatter block', () => {
    const content = '---\nold: data\n---\nLine1\nLine2\nLine3';
    const result = spliceFrontmatter(content, { new_key: 'value' });
    assert.ok(result.includes('new_key: value'));
    assert.ok(result.includes('Line1'));
    assert.ok(result.includes('Line3'));
    assert.ok(!result.includes('old: data'));
  });

  test('handles empty content', () => {
    const result = spliceFrontmatter('', { key: 'val' });
    assert.ok(result.startsWith('---\nkey: val\n---\n\n'));
  });
});

// ============================================================================
// parseMustHavesBlock — pure function tests
// ============================================================================

describe('parseMustHavesBlock', () => {
  test('returns empty array when no frontmatter', () => {
    const result = parseMustHavesBlock('# No frontmatter', 'truths');
    assert.deepStrictEqual(result, []);
  });

  test('returns empty array when block not found', () => {
    const content = '---\nmust_haves:\n    truths:\n      - "truth 1"\n---';
    const result = parseMustHavesBlock(content, 'nonexistent');
    assert.deepStrictEqual(result, []);
  });

  test('parses truths array (simple string items)', () => {
    const content = '---\nmust_haves:\n    truths:\n      - "condition A"\n      - "condition B"\n---';
    const result = parseMustHavesBlock(content, 'truths');
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0], 'condition A');
    assert.strictEqual(result[1], 'condition B');
  });

  test('parses artifacts with key-value pairs', () => {
    const content = [
      '---',
      'must_haves:',
      '    artifacts:',
      '      - path: "src/foo.js"',
      '        provides: "Foo module"',
      '        min_lines: 100',
      '      - path: "src/bar.js"',
      '        provides: "Bar module"',
      '---',
    ].join('\n');
    const result = parseMustHavesBlock(content, 'artifacts');
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].path, 'src/foo.js');
    assert.strictEqual(result[0].provides, 'Foo module');
    assert.strictEqual(result[0].min_lines, 100);
    assert.strictEqual(result[1].path, 'src/bar.js');
  });

  test('parses key_links with from/to/via/pattern', () => {
    const content = [
      '---',
      'must_haves:',
      '    key_links:',
      '      - from: "tests/foo.test.js"',
      '        to: "src/foo.js"',
      '        via: "require(\'../src/foo.js\')"',
      '        pattern: "require.*foo"',
      '---',
    ].join('\n');
    const result = parseMustHavesBlock(content, 'key_links');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].from, 'tests/foo.test.js');
    assert.strictEqual(result[0].to, 'src/foo.js');
  });

  test('skips empty lines in block', () => {
    const content = [
      '---',
      'must_haves:',
      '    truths:',
      '',
      '      - "truth 1"',
      '',
      '      - "truth 2"',
      '---',
    ].join('\n');
    const result = parseMustHavesBlock(content, 'truths');
    assert.strictEqual(result.length, 2);
  });

  test('stops at lower indent level', () => {
    const content = [
      '---',
      'must_haves:',
      '    truths:',
      '      - "truth 1"',
      '    artifacts:',
      '      - path: "src/foo.js"',
      '---',
    ].join('\n');
    const result = parseMustHavesBlock(content, 'truths');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], 'truth 1');
  });

  test('handles array items under a key in artifacts', () => {
    const content = [
      '---',
      'must_haves:',
      '    artifacts:',
      '      - path: "src/foo.js"',
      '        exports:',
      '          - "functionA"',
      '          - "functionB"',
      '---',
    ].join('\n');
    const result = parseMustHavesBlock(content, 'artifacts');
    assert.strictEqual(result.length, 1);
    assert.ok(Array.isArray(result[0].exports));
    assert.deepStrictEqual(result[0].exports, ['functionA', 'functionB']);
  });

  test('handles empty exports list in artifacts', () => {
    const content = [
      '---',
      'must_haves:',
      '    artifacts:',
      '      - path: "src/foo.js"',
      '        provides: "Foo module"',
      '        exports:',
      '          - "fn1"',
      '---',
    ].join('\n');
    const result = parseMustHavesBlock(content, 'artifacts');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].path, 'src/foo.js');
  });

  test('handles numeric values in continuation keys', () => {
    const content = [
      '---',
      'must_haves:',
      '    artifacts:',
      '      - path: "src/foo.js"',
      '        min_lines: 250',
      '---',
    ].join('\n');
    const result = parseMustHavesBlock(content, 'artifacts');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].min_lines, 250);
    assert.strictEqual(typeof result[0].min_lines, 'number');
  });
});

// ============================================================================
// FRONTMATTER_SCHEMAS — structure tests
// ============================================================================

describe('FRONTMATTER_SCHEMAS', () => {
  test('plan schema has required fields', () => {
    const schema = FRONTMATTER_SCHEMAS.plan;
    assert.ok(schema.required.includes('phase'));
    assert.ok(schema.required.includes('plan'));
    assert.ok(schema.required.includes('type'));
    assert.ok(schema.required.includes('wave'));
    assert.ok(schema.required.includes('depends_on'));
    assert.ok(schema.required.includes('files_modified'));
    assert.ok(schema.required.includes('autonomous'));
    assert.ok(schema.required.includes('must_haves'));
  });

  test('summary schema has required fields', () => {
    const schema = FRONTMATTER_SCHEMAS.summary;
    assert.ok(schema.required.includes('phase'));
    assert.ok(schema.required.includes('plan'));
    assert.ok(schema.required.includes('subsystem'));
    assert.ok(schema.required.includes('tags'));
    assert.ok(schema.required.includes('duration'));
    assert.ok(schema.required.includes('completed'));
  });

  test('verification schema has required fields', () => {
    const schema = FRONTMATTER_SCHEMAS.verification;
    assert.ok(schema.required.includes('phase'));
    assert.ok(schema.required.includes('verified'));
    assert.ok(schema.required.includes('status'));
    assert.ok(schema.required.includes('score'));
  });
});

// ============================================================================
// cmdFrontmatterGet — direct calls
// ============================================================================

describe('cmdFrontmatterGet (direct)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    fs.writeFileSync(
      path.join(tmpDir, 'test.md'),
      '---\nphase: 01\nplan: 02\ntype: execute\n---\n\n# Content',
      'utf-8'
    );
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('gets all frontmatter when no field specified', () => {
    const { exitCode, stdout } = captureOutput(() => cmdFrontmatterGet(tmpDir, 'test.md', null, false));
    assert.strictEqual(exitCode, 0);
    const output = JSON.parse(stdout);
    assert.strictEqual(output.phase, '01');
    assert.strictEqual(output.plan, '02');
    assert.strictEqual(output.type, 'execute');
  });

  test('gets a specific field value', () => {
    const { exitCode, stdout } = captureOutput(() => cmdFrontmatterGet(tmpDir, 'test.md', 'phase', false));
    assert.strictEqual(exitCode, 0);
    const output = JSON.parse(stdout);
    assert.strictEqual(output.phase, '01');
  });

  test('returns field not found for missing field', () => {
    const { exitCode, stdout } = captureOutput(() => cmdFrontmatterGet(tmpDir, 'test.md', 'nonexistent', false));
    assert.strictEqual(exitCode, 0);
    const output = JSON.parse(stdout);
    assert.strictEqual(output.error, 'Field not found');
    assert.strictEqual(output.field, 'nonexistent');
  });

  test('returns file not found for missing file', () => {
    const { exitCode, stdout } = captureOutput(() => cmdFrontmatterGet(tmpDir, 'missing.md', null, false));
    assert.strictEqual(exitCode, 0);
    const output = JSON.parse(stdout);
    assert.strictEqual(output.error, 'File not found');
  });

  test('handles absolute file path', () => {
    const absPath = path.join(tmpDir, 'test.md');
    const { exitCode, stdout } = captureOutput(() => cmdFrontmatterGet(tmpDir, absPath, 'phase', false));
    assert.strictEqual(exitCode, 0);
    const output = JSON.parse(stdout);
    assert.strictEqual(output.phase, '01');
  });

  test('raw mode outputs JSON stringified value', () => {
    const { stdout } = captureOutput(() => cmdFrontmatterGet(tmpDir, 'test.md', 'phase', true));
    assert.strictEqual(stdout, '"01"');
  });

  test('errors when no file path provided (direct)', () => {
    const { exitCode, stderr } = captureOutput(() => cmdFrontmatterGet(tmpDir, null, null, false));
    assert.strictEqual(exitCode, 1);
    assert.ok(stderr.includes('file path required'));
  });
});

// ============================================================================
// cmdFrontmatterSet — direct calls
// ============================================================================

describe('cmdFrontmatterSet (direct)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    fs.writeFileSync(
      path.join(tmpDir, 'test.md'),
      '---\nphase: 01\nplan: 02\n---\n\n# Content',
      'utf-8'
    );
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('sets a field value in existing frontmatter', () => {
    const { exitCode, stdout } = captureOutput(() => cmdFrontmatterSet(tmpDir, 'test.md', 'phase', '"03"', false));
    assert.strictEqual(exitCode, 0);
    const output = JSON.parse(stdout);
    assert.strictEqual(output.updated, true);
    assert.strictEqual(output.field, 'phase');
    assert.strictEqual(output.value, '03');

    const content = fs.readFileSync(path.join(tmpDir, 'test.md'), 'utf-8');
    const fm = extractFrontmatter(content);
    assert.strictEqual(fm.phase, '03');
  });

  test('preserves other fields when setting one', () => {
    captureOutput(() => cmdFrontmatterSet(tmpDir, 'test.md', 'type', '"execute"', false));
    const content = fs.readFileSync(path.join(tmpDir, 'test.md'), 'utf-8');
    const fm = extractFrontmatter(content);
    assert.strictEqual(fm.phase, '01');
    assert.strictEqual(fm.plan, '02');
    assert.strictEqual(fm.type, 'execute');
  });

  test('adds new field to frontmatter', () => {
    captureOutput(() => cmdFrontmatterSet(tmpDir, 'test.md', 'wave', '1', false));
    const content = fs.readFileSync(path.join(tmpDir, 'test.md'), 'utf-8');
    const fm = extractFrontmatter(content);
    assert.strictEqual(fm.wave, '1');
  });

  test('parses JSON value (array)', () => {
    captureOutput(() => cmdFrontmatterSet(tmpDir, 'test.md', 'tags', '["a","b"]', false));
    const content = fs.readFileSync(path.join(tmpDir, 'test.md'), 'utf-8');
    const fm = extractFrontmatter(content);
    assert.deepStrictEqual(fm.tags, ['a', 'b']);
  });

  test('uses raw string when JSON parse fails', () => {
    captureOutput(() => cmdFrontmatterSet(tmpDir, 'test.md', 'desc', 'not-json', false));
    const content = fs.readFileSync(path.join(tmpDir, 'test.md'), 'utf-8');
    const fm = extractFrontmatter(content);
    assert.strictEqual(fm.desc, 'not-json');
  });

  test('returns file not found for missing file', () => {
    const { exitCode, stdout } = captureOutput(() => cmdFrontmatterSet(tmpDir, 'missing.md', 'field', 'val', false));
    assert.strictEqual(exitCode, 0);
    const output = JSON.parse(stdout);
    assert.strictEqual(output.error, 'File not found');
  });

  test('handles absolute file path', () => {
    const absPath = path.join(tmpDir, 'test.md');
    const { exitCode } = captureOutput(() => cmdFrontmatterSet(tmpDir, absPath, 'wave', '2', false));
    assert.strictEqual(exitCode, 0);
  });

  test('errors when missing required args (direct)', () => {
    const { exitCode, stderr } = captureOutput(() => cmdFrontmatterSet(tmpDir, null, null, undefined, false));
    assert.strictEqual(exitCode, 1);
    assert.ok(stderr.includes('file, field, and value required'));
  });

  test('raw mode outputs true', () => {
    const { stdout } = captureOutput(() => cmdFrontmatterSet(tmpDir, 'test.md', 'wave', '1', true));
    assert.strictEqual(stdout, 'true');
  });
});

// ============================================================================
// cmdFrontmatterMerge — direct calls
// ============================================================================

describe('cmdFrontmatterMerge (direct)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    fs.writeFileSync(
      path.join(tmpDir, 'test.md'),
      '---\nphase: 01\nplan: 02\n---\n\n# Content',
      'utf-8'
    );
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('merges JSON into existing frontmatter', () => {
    const data = JSON.stringify({ type: 'execute', wave: '1' });
    const { exitCode, stdout } = captureOutput(() => cmdFrontmatterMerge(tmpDir, 'test.md', data, false));
    assert.strictEqual(exitCode, 0);
    const output = JSON.parse(stdout);
    assert.strictEqual(output.merged, true);
    assert.deepStrictEqual(output.fields, ['type', 'wave']);

    const content = fs.readFileSync(path.join(tmpDir, 'test.md'), 'utf-8');
    const fm = extractFrontmatter(content);
    assert.strictEqual(fm.phase, '01');
    assert.strictEqual(fm.type, 'execute');
    assert.strictEqual(fm.wave, '1');
  });

  test('overwrites existing fields with merged data', () => {
    const data = JSON.stringify({ phase: '03' });
    captureOutput(() => cmdFrontmatterMerge(tmpDir, 'test.md', data, false));
    const content = fs.readFileSync(path.join(tmpDir, 'test.md'), 'utf-8');
    const fm = extractFrontmatter(content);
    assert.strictEqual(fm.phase, '03');
  });

  test('returns file not found for missing file', () => {
    const { exitCode, stdout } = captureOutput(() =>
      cmdFrontmatterMerge(tmpDir, 'missing.md', '{"key":"val"}', false));
    assert.strictEqual(exitCode, 0);
    const output = JSON.parse(stdout);
    assert.strictEqual(output.error, 'File not found');
  });

  test('errors with invalid JSON data (direct)', () => {
    const { exitCode, stderr } = captureOutput(() =>
      cmdFrontmatterMerge(tmpDir, 'test.md', '{bad-json', false));
    assert.strictEqual(exitCode, 1);
    assert.ok(stderr.includes('Invalid JSON'));
  });

  test('errors when missing required args (direct)', () => {
    const { exitCode, stderr } = captureOutput(() =>
      cmdFrontmatterMerge(tmpDir, null, null, false));
    assert.strictEqual(exitCode, 1);
    assert.ok(stderr.includes('file and data required'));
  });

  test('handles absolute file path', () => {
    const absPath = path.join(tmpDir, 'test.md');
    const { exitCode } = captureOutput(() =>
      cmdFrontmatterMerge(tmpDir, absPath, '{"wave":"2"}', false));
    assert.strictEqual(exitCode, 0);
  });

  test('raw mode outputs true', () => {
    const { stdout } = captureOutput(() =>
      cmdFrontmatterMerge(tmpDir, 'test.md', '{"wave":"1"}', true));
    assert.strictEqual(stdout, 'true');
  });
});

// ============================================================================
// cmdFrontmatterValidate — direct calls
// ============================================================================

describe('cmdFrontmatterValidate (direct)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns valid=true when all required fields present (plan schema)', () => {
    const content = [
      '---',
      'phase: 01',
      'plan: 01',
      'type: execute',
      'wave: 1',
      'depends_on: []',
      'files_modified: [src/foo.js]',
      'autonomous: true',
      'must_haves:',
      '  truths:',
      '    - "truth 1"',
      '---',
    ].join('\n');
    fs.writeFileSync(path.join(tmpDir, 'plan.md'), content, 'utf-8');

    const { exitCode, stdout } = captureOutput(() =>
      cmdFrontmatterValidate(tmpDir, 'plan.md', 'plan', false));
    assert.strictEqual(exitCode, 0);
    const output = JSON.parse(stdout);
    assert.strictEqual(output.valid, true);
    assert.strictEqual(output.missing.length, 0);
    assert.strictEqual(output.schema, 'plan');
  });

  test('returns valid=false with missing fields', () => {
    fs.writeFileSync(path.join(tmpDir, 'plan.md'), '---\nphase: 01\n---\n', 'utf-8');

    const { exitCode, stdout } = captureOutput(() =>
      cmdFrontmatterValidate(tmpDir, 'plan.md', 'plan', false));
    assert.strictEqual(exitCode, 0);
    const output = JSON.parse(stdout);
    assert.strictEqual(output.valid, false);
    assert.ok(output.missing.includes('plan'));
    assert.ok(output.missing.includes('type'));
    assert.ok(output.present.includes('phase'));
  });

  test('validates summary schema', () => {
    const content = '---\nphase: 01\nplan: 01\nsubsystem: core\ntags: [test]\nduration: 10min\ncompleted: 2024-01-01\n---\n';
    fs.writeFileSync(path.join(tmpDir, 'summary.md'), content, 'utf-8');

    const { exitCode, stdout } = captureOutput(() =>
      cmdFrontmatterValidate(tmpDir, 'summary.md', 'summary', false));
    assert.strictEqual(exitCode, 0);
    const output = JSON.parse(stdout);
    assert.strictEqual(output.valid, true);
  });

  test('validates verification schema', () => {
    const content = '---\nphase: 01\nverified: true\nstatus: passed\nscore: 95\n---\n';
    fs.writeFileSync(path.join(tmpDir, 'verify.md'), content, 'utf-8');

    const { exitCode, stdout } = captureOutput(() =>
      cmdFrontmatterValidate(tmpDir, 'verify.md', 'verification', false));
    assert.strictEqual(exitCode, 0);
    const output = JSON.parse(stdout);
    assert.strictEqual(output.valid, true);
  });

  test('returns file not found for missing file', () => {
    const { exitCode, stdout } = captureOutput(() =>
      cmdFrontmatterValidate(tmpDir, 'missing.md', 'plan', false));
    assert.strictEqual(exitCode, 0);
    const output = JSON.parse(stdout);
    assert.strictEqual(output.error, 'File not found');
  });

  test('errors with unknown schema (direct)', () => {
    fs.writeFileSync(path.join(tmpDir, 'test.md'), '---\nphase: 01\n---\n', 'utf-8');
    const { exitCode, stderr } = captureOutput(() =>
      cmdFrontmatterValidate(tmpDir, 'test.md', 'unknown', false));
    assert.strictEqual(exitCode, 1);
    assert.ok(stderr.includes('Unknown schema'));
  });

  test('errors when missing required args (direct)', () => {
    const { exitCode, stderr } = captureOutput(() =>
      cmdFrontmatterValidate(tmpDir, null, null, false));
    assert.strictEqual(exitCode, 1);
    assert.ok(stderr.includes('file and schema required'));
  });

  test('handles absolute file path', () => {
    fs.writeFileSync(path.join(tmpDir, 'test.md'), '---\nphase: 01\n---\n', 'utf-8');
    const absPath = path.join(tmpDir, 'test.md');
    const { exitCode } = captureOutput(() =>
      cmdFrontmatterValidate(tmpDir, absPath, 'plan', false));
    assert.strictEqual(exitCode, 0);
  });

  test('raw mode outputs valid/invalid', () => {
    const content = '---\nphase: 01\nplan: 01\nsubsystem: core\ntags: [test]\nduration: 10min\ncompleted: 2024-01-01\n---\n';
    fs.writeFileSync(path.join(tmpDir, 'summary.md'), content, 'utf-8');

    const { stdout } = captureOutput(() =>
      cmdFrontmatterValidate(tmpDir, 'summary.md', 'summary', true));
    assert.strictEqual(stdout, 'valid');
  });

  test('raw mode outputs invalid for incomplete frontmatter', () => {
    fs.writeFileSync(path.join(tmpDir, 'plan.md'), '---\nphase: 01\n---\n', 'utf-8');
    const { stdout } = captureOutput(() =>
      cmdFrontmatterValidate(tmpDir, 'plan.md', 'plan', true));
    assert.strictEqual(stdout, 'invalid');
  });
});

// ============================================================================
// CLI subprocess tests (integration validation)
// ============================================================================

describe('frontmatter CLI (subprocess)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    fs.writeFileSync(
      path.join(tmpDir, 'test.md'),
      '---\nphase: 01\nplan: 02\ntype: execute\n---\n\n# Content',
      'utf-8'
    );
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('frontmatter get returns all fields', () => {
    const result = runGsdToolsDirect(['frontmatter', 'get', 'test.md'], tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase, '01');
  });

  test('frontmatter get with --field returns specific field', () => {
    const result = runGsdToolsDirect(['frontmatter', 'get', 'test.md', '--field', 'phase'], tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase, '01');
  });

  test('frontmatter set updates field', () => {
    const result = runGsdToolsDirect(['frontmatter', 'set', 'test.md', '--field', 'wave', '--value', '2'], tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const content = fs.readFileSync(path.join(tmpDir, 'test.md'), 'utf-8');
    const fm = extractFrontmatter(content);
    assert.strictEqual(fm.wave, '2');
  });

  test('frontmatter merge adds fields', () => {
    const data = JSON.stringify({ wave: '1', autonomous: 'true' });
    const result = runGsdToolsDirect(['frontmatter', 'merge', 'test.md', '--data', data], tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const content = fs.readFileSync(path.join(tmpDir, 'test.md'), 'utf-8');
    const fm = extractFrontmatter(content);
    assert.strictEqual(fm.wave, '1');
    assert.strictEqual(fm.autonomous, 'true');
  });

  test('frontmatter validate checks plan schema', () => {
    const result = runGsdToolsDirect(['frontmatter', 'validate', 'test.md', '--schema', 'plan'], tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(output.valid, false);
    assert.ok(output.missing.includes('wave'));
  });

  test('frontmatter get errors with no file path', () => {
    const result = runGsdToolsDirect(['frontmatter', 'get'], tmpDir);
    assert.ok(!result.success);
    assert.ok(result.error.includes('file path required'));
  });

  test('frontmatter set errors with missing args', () => {
    const result = runGsdToolsDirect(['frontmatter', 'set', 'test.md'], tmpDir);
    assert.ok(!result.success);
    assert.ok(result.error.includes('file, field, and value required'));
  });

  test('frontmatter merge errors with invalid JSON', () => {
    const result = runGsdToolsDirect(['frontmatter', 'merge', 'test.md', '--data', '{bad}'], tmpDir);
    assert.ok(!result.success);
    assert.ok(result.error.includes('Invalid JSON'));
  });

  test('frontmatter validate errors with unknown schema', () => {
    const result = runGsdToolsDirect(['frontmatter', 'validate', 'test.md', '--schema', 'unknown'], tmpDir);
    assert.ok(!result.success);
    assert.ok(result.error.includes('Unknown schema'));
  });
});
