const { test, expect } = require('bun:test');
const { collectLinks } = require('../scripts/collect-monitored-links');

test('monitors excluded external URLs, deduplicates and ignores localhost', () => {
  const docs = ['[paper](https://example.org/paper.pdf). https://example.org/paper.pdf',
    'https://healthy.org/ http://localhost:3000/'];
  expect(collectLinks(docs, { exclude: ['^https://example\\.org/', '^http://localhost'] }))
    .toEqual(['https://example.org/paper.pdf']);
});

test('picks up new exclusions without modifying the monitor', () => {
  expect(collectLinks(['https://new.org/a'], { exclude: ['^https://new\\.org/'] }))
    .toEqual(['https://new.org/a']);
  expect(collectLinks(['https://new.org/a'], { exclude: [] })).toEqual([]);
});
