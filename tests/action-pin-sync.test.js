const { test, expect } = require('bun:test');
const { synchronize } = require('../scripts/sync-action-pins');
const { isSafeTagLabel } = require('../scripts/lib/tag-authority');

const pins = { 'actions/example': { sha: 'a'.repeat(40), tag: 'v2.0.0' } };
const workflow = steps => `name: test\non: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n${steps}`;

test('synchronizes actual steps and is idempotent', () => {
  const source = workflow('      - uses: actions/example@v1 # v1\n      - uses: actions/example@old\n');
  const result = synchronize(source, pins);
  expect(result).toBe(source.replace('@v1 # v1', `@${pins['actions/example'].sha} # pin: v2.0.0`)
    .replace('@old', `@${pins['actions/example'].sha}`));
  expect(synchronize(result, pins)).toBe(result);
});

test('preserves explanatory comments, local actions and container digests', () => {
  const source = workflow('      - uses: actions/example@old # reviewed for special behavior\n      - uses: ./local\n      - uses: docker://image@sha256:123\n');
  expect(synchronize(source, pins)).toBe(source.replace('@old', `@${pins['actions/example'].sha}`));
});

test('ignores comments, run bodies and unrelated uses keys', () => {
  const source = workflow('      # uses: unknown/action@v1\n      - run: |\n          uses: unknown/action@v1\n          echo "uses: actions/example@old"\n      - env:\n          uses: unknown/action@v1\n        run: true\n');
  expect(synchronize(source, pins)).toBe(source);
});

test('supports quoted values and job-level reusable workflows without reformatting', () => {
  const source = 'on: push\r\njobs:\r\n  call: { uses: "actions/example@old" }\r\n';
  expect(synchronize(source, pins)).toBe(source.replace('@old', `@${pins['actions/example'].sha}`));
});

test('accepts all safe tag labels allowed by the authority schema', () => {
  const source = workflow('      - uses: actions/example@old # v1\n');
  for (const tag of ['stable', 'release-v2', '6', 'v2.1.0', 'v1.2.3+build.1']) {
    expect(synchronize(source, { 'actions/example': { sha: 'a'.repeat(40), tag } }))
      .toContain(`# pin: ${tag}`);
  }
});

test('tag authority follows safe Git ref-name rules', () => {
  for (const tag of ['v1.2.3+build.1', 'release/topic#1', 'stable@2026']) {
    expect(isSafeTagLabel(tag)).toBe(true);
  }
  for (const tag of ['', '@', 'release lock', 'bad..tag', '.hidden', 'topic/.hidden',
    'topic.lock', 'bad~tag', 'bad\\tag', 'bad\ntag']) {
    expect(isSafeTagLabel(tag)).toBe(false);
  }
});

test('preserves one-word explanatory comments and updates explicit managed comments', () => {
  for (const comment of ['temporary', 'reviewed', 'security-reviewed', 'v1-only', '2026-review']) {
    const source = workflow(`      - uses: actions/example@old # ${comment}\n`);
    expect(synchronize(source, pins)).toBe(source.replace('@old', `@${pins['actions/example'].sha}`));
  }
  const managed = workflow('      - uses: actions/example@old # pin: stable\n');
  expect(synchronize(managed, pins)).toContain(`# pin: ${pins['actions/example'].tag}`);
  const buildTag = { 'actions/example': { sha: 'a'.repeat(40), tag: 'v1.2.3+build.1' } };
  expect(synchronize(managed, buildTag)).toContain('# pin: v1.2.3+build.1');
});

test('rejects unknown actions and mutable authority', () => {
  expect(() => synchronize(workflow('      - uses: unknown/action@v1'), pins)).toThrow('Missing or invalid');
  expect(() => synchronize(workflow('      - uses: actions/example@v1'), {
    'actions/example': { sha: 'v2', tag: 'v2' },
  })).toThrow('Missing or invalid');
});

test('rejects invalid YAML and aliased uses without partial edits', () => {
  expect(() => synchronize('jobs: [', pins)).toThrow();
  expect(() => synchronize('ref: &ref actions/example@old\njobs:\n  call:\n    uses: *ref\n', pins)).toThrow('literal scalar');
});
