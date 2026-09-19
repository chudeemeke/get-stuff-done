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
  expect(documentLinks('<img srcset="https://example.org/one, https://example.org/two 2x">'))
    .toEqual(['https://example.org/one', 'https://example.org/two']);
  expect(documentLinks(`<source srcset='https://example.org/one 1x, https://example.org/two 2x'>`))
    .toEqual(['https://example.org/one', 'https://example.org/two']);
  expect(documentLinks(`<img srcset='https://example.org/a,b 1x, https://example.org/c 2x'>`))
    .toEqual(['https://example.org/a,b', 'https://example.org/c']);
});

test('extracts standard single and multi URL-bearing HTML attributes', () => {
  expect(documentLinks([
    '<form action="https://example.org/submit">',
    '<video poster=https://example.org/poster>',
    '<blockquote cite="https://example.org/source">',
    '<object data=https://example.org/object>',
    '<button formaction=https://example.org/button>',
    '<a ping="https://example.org/ping-one https://example.org/ping-two">',
  ].join(''))).toEqual([
    'https://example.org/submit', 'https://example.org/poster',
    'https://example.org/source', 'https://example.org/object',
    'https://example.org/button', 'https://example.org/ping-one',
    'https://example.org/ping-two',
  ]);
});

test('preserves punctuation in whitespace-delimited URL attributes', () => {
  expect(documentLinks([
    '<a ping="https://example.org/item, https://example.org/item;">',
    '<object archive="https://example.org/a(1)\thttps://example.org/b!">',
    '<meta itemtype="https://example.org/Type?">',
  ].join(''))).toEqual([
    'https://example.org/item,', 'https://example.org/item;',
    'https://example.org/a(1)', 'https://example.org/b!',
    'https://example.org/Type?',
  ]);
});

test('parses unquoted HTML attributes and ignores attribute-like text', () => {
  expect(documentLinks('<img SRC=https://example.org/chart data-src=https://example.org/ignored>'))
    .toEqual(['https://example.org/chart']);
  expect(documentLinks('<a href=https://example.org/?a&amp;b>link</a>'))
    .toEqual(['https://example.org/?a&b']);
  expect(documentLinks('<img alt="src=https://example.org/ignored" srcset=https://example.org/one>'))
    .toEqual(['https://example.org/one']);
  expect(documentLinks('<!-- <img src=https://example.org/ignored> -->')).toEqual([]);
});

test('HTML parsing decodes entities once and serializes the browser destination', () => {
  expect(documentLinks('<img src="https://example.org/a\\*b?x=&amp;amp;">'))
    .toEqual(['https://example.org/a/*b?x=&amp;']);
  expect(documentLinks('<a href="https://example.org/a&quot;b&lt;c&gt;`d">'))
    .toEqual(['https://example.org/a%22b%3Cc%3E%60d']);
});

test('normalizes URL-standard ASCII tabs and newlines in HTML attributes', () => {
  expect(documentLinks('<a href="https://example.org/a&#10;b&#x9;c&#13;d">link</a>'))
    .toEqual(['https://example.org/abcd']);
});

test('trims URL-standard C0 whitespace without removing non-ASCII URL data', () => {
  expect(documentLinks('<a href="&#x20;https://example.org/a&#xA0;&#x20;">link</a>'))
    .toEqual(['https://example.org/a%C2%A0']);
});

test('percent-encodes interior C0 URL data after HTML entity decoding', () => {
  expect(documentLinks('<a href="https://example.org/a&#12;b c">link</a>'))
    .toEqual(['https://example.org/a%0Cb%20c']);
});

test('accepts case-insensitive HTTP schemes before applying configured exclusions', () => {
  const url = 'HTTPS://example.org/resource';
  expect(documentLinks(`<a href="${url}">link</a>`)).toEqual([url]);
  expect(collectLinks([`<a href="${url}">link</a>`], {
    exclude: ['^HTTPS://example\\.org/'],
  })).toEqual([url]);
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

test('rejects unbounded group repetition including overlapping alternatives', () => {
  for (const pattern of ['^https://example\\.org/(a|aa)+$', '(ab|a)*$', '(a|a?)+$', '(abc)+']) {
    expect(() => exclusionPattern(pattern)).toThrow('Repeated exclusion groups');
  }
  expect(exclusionPattern('^https?://(www\\.)?example\\.org/').test('https://www.example.org/'))
    .toBe(true);
});

test('rejects multiple unbounded repetitions that can backtrack polynomially', () => {
  for (const pattern of ['^https://example\\.org/a+a+$', '[0-9]+[0-9]+$', 'a+b*']) {
    expect(() => exclusionPattern(pattern)).toThrow('Multiple unbounded exclusions');
  }
  expect(exclusionPattern('^https://example\\.org/a+$').test('https://example.org/aaa'))
    .toBe(true);
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
