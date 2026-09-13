const { test, expect } = require('bun:test');
const { synchronize } = require('../scripts/sync-action-pins');

const pins = { 'actions/example': { sha: 'a'.repeat(40), tag: 'v2.0.0' } };

test('synchronizes all usages and is idempotent', () => {
  const source = '  - uses: actions/example@v1 # v1\n  - uses: actions/example@old\n';
  const result = synchronize(source, pins);
  expect(result).toBe(`  - uses: actions/example@${pins['actions/example'].sha} # v2.0.0\n  - uses: actions/example@${pins['actions/example'].sha} # v2.0.0\n`);
  expect(synchronize(result, pins)).toBe(result);
});

test('preserves explanatory comments, local actions and container digests', () => {
  const source = 'uses: actions/example@old # reviewed for special behavior\nuses: ./local\nuses: docker://image@sha256:123\n';
  expect(synchronize(source, pins)).toBe(source.replace('@old', `@${pins['actions/example'].sha}`));
});

test('rejects unknown actions and mutable authority', () => {
  expect(() => synchronize('uses: unknown/action@v1', pins)).toThrow('Missing or invalid');
  expect(() => synchronize('uses: actions/example@v1', { 'actions/example': { sha: 'v2', tag: 'v2' } })).toThrow('Missing or invalid');
});
