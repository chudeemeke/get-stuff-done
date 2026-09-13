const { test, expect } = require('bun:test');
const { collectLinks, documentLinks, exclusionPattern } = require('../scripts/collect-monitored-links');
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

test('stops at both HTML quote delimiters', () => {
  expect(collectLinks([
    `<img src='https://example.org/single'>`,
    '<img src="https://example.org/double">',
  ], { exclude: ['^https://example\\.org/'] })).toEqual([
    'https://example.org/double', 'https://example.org/single',
  ]);
});

test('preserves apostrophes in structurally parsed Markdown URLs', () => {
  expect(documentLinks(`<https://example.org/O'Reilly> [book](https://example.org/D'Angelo)`))
    .toEqual(["https://example.org/O'Reilly", "https://example.org/D'Angelo"]);
});

test('extracts quoted HTML URL attributes and srcset candidates', () => {
  expect(documentLinks(`<source srcset='https://example.org/one 1x, https://example.org/two 2x'>`))
    .toEqual(['https://example.org/one', 'https://example.org/two']);
});

test('decodes HTML entities in URL attributes before monitoring', () => {
  expect(documentLinks('<a href="https://example.org/?a=1&amp;b=2">link</a>'))
    .toEqual(['https://example.org/?a=1&b=2']);
  expect(documentLinks('<img src="https://example.org/&#x4f;%27Reilly">'))
    .toEqual(["https://example.org/O%27Reilly"]);
});

test('preserves valid trailing punctuation inside structural URL delimiters', () => {
  expect(collectLinks([
    '<https://example.org/items;>',
    `<a href='https://example.org/item,'>item</a>`,
  ], { exclude: ['^https://example\\.org/'] })).toEqual([
    'https://example.org/item,', 'https://example.org/items;',
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

test('rejects patterns unsafe for JavaScript backtracking evaluation', () => {
  for (const pattern of ['^https?://(a+)+$', '^https?://(a*)*$', '^https?://(a+){2}$']) {
    expect(() => exclusionPattern(pattern)).toThrow();
  }
});

test('shared subset preserves literal escapes, groups, digits and absolute end', () => {
  const host = exclusionPattern('^http://localhost(/|$)');
  const port = exclusionPattern('^http://localhost:[0-9]+(/|$)');
  expect(port.test('http://localhost:123/')).toBe(true);
  expect(host.test('http://localhost')).toBe(true);
  expect(host.test('http://localhost\n')).toBe(false);
  expect(exclusionPattern('^https://example\\.org/').test('https://exampleXorg/')).toBe(false);
});

test('picks up new exclusions without modifying the monitor', () => {
  expect(collectLinks(['https://new.org/a'], { exclude: ['^https://new\\.org/'] }))
    .toEqual(['https://new.org/a']);
  expect(collectLinks(['https://new.org/a'], { exclude: [] })).toEqual([]);
});
