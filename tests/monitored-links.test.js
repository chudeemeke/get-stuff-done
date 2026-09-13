const { test, expect } = require('bun:test');
const { collectLinks, exclusionPattern } = require('../scripts/collect-monitored-links');
const fs = require('fs');
const path = require('path');
const { parse } = require('smol-toml');

test('monitors excluded external URLs, deduplicates and ignores localhost', () => {
  const docs = ['[paper](https://example.org/paper.pdf). https://example.org/paper.pdf',
    'https://healthy.org/ http://localhost:3000/'];
  expect(collectLinks(docs, { exclude: ['^https://example\\.org/', '^http://localhost'] }))
    .toEqual(['https://example.org/paper.pdf']);
});

test('preserves balanced URL parentheses while removing Markdown delimiters', () => {
  expect(collectLinks([
    '[spec](https://example.org/Foo_(bar)).',
    '[nested](https://example.org/Foo_(bar_(baz)))',
    '<https://example.org/Foo_(bar)>',
  ], { exclude: ['^https://example\\.org/'] })).toEqual([
    'https://example.org/Foo_(bar)', 'https://example.org/Foo_(bar_(baz))',
  ]);
});

test('validates actual Lychee exclusions during PR testing', () => {
  const config = parse(fs.readFileSync(path.join(__dirname, '../lychee.toml'), 'utf8'));
  for (const pattern of [...config.exclude, ...config.exclude_path]) {
    expect(() => exclusionPattern(pattern)).not.toThrow();
  }
});

test('rejects dialect-specific patterns explicitly rather than silently changing semantics', () => {
  for (const pattern of ['(?i)^https://example', '\\w+', '\\p{Letter}', '[a-z&&[^b]]', '(?=x)', '.*', 'é']) {
    expect(() => exclusionPattern(pattern)).toThrow();
  }
});

test('shared subset preserves literal escapes, groups, digits and absolute end', () => {
  const regex = exclusionPattern('^http://localhost(:[0-9]+)?(/|$)');
  expect(regex.test('http://localhost:123/')).toBe(true);
  expect(regex.test('http://localhost')).toBe(true);
  expect(regex.test('http://localhost\n')).toBe(false);
  expect(exclusionPattern('^https://example\\.org/').test('https://exampleXorg/')).toBe(false);
});

test('picks up new exclusions without modifying the monitor', () => {
  expect(collectLinks(['https://new.org/a'], { exclude: ['^https://new\\.org/'] }))
    .toEqual(['https://new.org/a']);
  expect(collectLinks(['https://new.org/a'], { exclude: [] })).toEqual([]);
});
