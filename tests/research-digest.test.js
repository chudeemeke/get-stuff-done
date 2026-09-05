const { test, expect } = require('./helpers/portable-test-api');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
// These two integration cases launch multiple isolated processes. Give their
// aggregate work the same 30s budget as CI, independently of Bun's 5s default.
const processTest = (name, run) => process.versions.bun
  ? test(name, run, 30000)
  : test(name, { timeout: 30000 }, run);
const helper = process.env.GSD_RESEARCH_DIGEST_HELPER || path.join(__dirname, '../dist/gsd-core/bin/research-digest.cjs');
assert.ok(path.isAbsolute(helper), 'Digest test subject must be an absolute artifact path.');
const { createDigest, main } = require(helper);
const source = '# Research\n\n## Storage\nUse transactions.\n\n### Recovery\nKeep the journal.\n\n```md\n## Fake\n```\n\n## UI\nUse the existing component.\n';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

test('digest keeps selected children and fenced text with exact source provenance', () => {
  const result = createDigest(Buffer.from(source), { source: '.planning/RESEARCH.md', sections: ['Storage'] });
  expect(result.source_sha256).toBe(sha(source));
  expect(result.selected_sections).toEqual([{ heading: 'Storage', start: 3, end: 12 }]);
  expect(result.markdown).toContain('Keep the journal.');
  expect(result.markdown).toContain('## Fake');
  expect(result.markdown).not.toContain('Use the existing component.');
  expect(createDigest(Buffer.from(source), { source: '.planning/RESEARCH.md', sections: ['Storage'] })).toEqual(result);
});

test('CRLF provenance hashes original bytes while excerpts normalize line endings', () => {
  const bytes = Buffer.from(source.replace(/\n/g, '\r\n'));
  const result = createDigest(bytes, { source: 'RESEARCH.md', sections: ['UI'], expectedHash: sha(bytes), maxLines: 100 });
  expect(result.source_sha256).toBe(sha(bytes));
  expect(result.markdown).not.toContain('\r');
  expect(result.markdown).toContain('Use the existing component.');
});

test('disjoint sections retain source order and accept the exact line budget', () => {
  const options = { source: 'RESEARCH.md', sections: ['UI', 'Storage'] };
  let result;
  assert.doesNotThrow(() => { result = createDigest(Buffer.from(source), options); });
  expect(result.selected_sections.map(item => item.heading)).toEqual(['Storage', 'UI']);
  expect(result.markdown).toContain('Keep the journal.');
  expect(result.markdown).toContain('Use the existing component.');
  expect(createDigest(Buffer.from(source), { ...options, maxLines: result.digest_lines })).toEqual(result);
});

test('line budget counts trailing whitespace lines in the emitted Markdown', () => {
  const bytes = Buffer.from('## UI\nKeep this.\n' + '   \n'.repeat(300));
  expect(() => createDigest(bytes, { source: 'RESEARCH.md', sections: ['UI'], maxLines: 20 })).toThrow('budget');
});

test('missing, duplicate and overlapping section selections fail explicitly', () => {
  for (const sections of [[], ['Fake'], ['Storage', 'Storage'], ['Storage', 'Recovery']]) {
    expect(() => createDigest(Buffer.from(source), { source: 'RESEARCH.md', sections })).toThrow();
  }
  expect(() => createDigest(Buffer.from(source + '\n## Storage\nOther.\n'), { source: 'RESEARCH.md', sections: ['Storage'] })).toThrow('ambiguous');
});

test('stale hashes, invalid UTF-8 and line-budget overflow cannot emit partial evidence', () => {
  const options = { source: 'RESEARCH.md', sections: ['Storage'] };
  expect(() => createDigest(Buffer.from(source), { ...options, expectedHash: '0'.repeat(64) })).toThrow('changed');
  expect(() => createDigest(Buffer.from([255]), options)).toThrow('UTF-8');
  expect(() => createDigest(Buffer.from(source), { ...options, maxLines: 2 })).toThrow('budget');
  for (const maxLines of [0, -1, 2.5, NaN, 2001]) expect(() => createDigest(Buffer.from(source), { ...options, maxLines })).toThrow();
});

processTest('CLI emits Markdown or JSON without modifying research and rejects invalid input', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-digest-test-'));
  try {
    fs.writeFileSync(path.join(root, 'RESEARCH.md'), source);
    fs.writeFileSync(path.join(root, 'STATE.md'), source);
    function run(args) {
      const result = spawnSync(process.execPath, [helper, '--stdin', ...args], { input: source, cwd: root, encoding: 'utf8', timeout: 10000 });
      assert.equal(result.error, undefined);
      return result;
    }
    const md = run(['RESEARCH.md', '--section', 'UI']);
    expect(md.status).toBe(0); expect(md.stderr).toBe(''); expect(md.stdout).toContain('source_sha256:');
    const json = run(['--json', '--section=UI', '--max-lines=100', '--expect-sha256', sha(source), '--', 'RESEARCH.md']);
    expect(json.status).toBe(0); expect(JSON.parse(json.stdout).source_sha256).toBe(sha(source));
    const missing = run(['missing-RESEARCH.md', '--section', 'UI', '--json']);
    expect(missing.status).toBe(0);
    expect(JSON.parse(missing.stdout).source_kind).toBe('supplied_bytes');
    for (const args of [[], ['RESEARCH.md'], ['STATE.md', '--section', 'UI'], ['RESEARCH.md', '--section', 'UI', '--unknown'], ['RESEARCH.md', 'extra', '--section', 'UI'], ['RESEARCH.md', '--section', 'UI', '--expect-sha256', '0'.repeat(64)]]) {
      const bad = run(args); expect(bad.status).toBe(1); expect(bad.stdout).toBe(''); expect(bad.stderr).toContain('research-digest:');
    }
    for (const args of [['--help'], ['-h'], ['help'], ['--version']]) expect(run(args).status).toBe(0);
    expect(fs.readFileSync(path.join(root, 'RESEARCH.md'), 'utf8')).toBe(source);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

processTest('digest decision mutations are rejected by the behavioral tests', () => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-digest-mutant-'));
  try {
    const bin = path.join(sandbox, 'bin');
    fs.mkdirSync(bin);
    fs.cpSync(path.join(path.dirname(helper), 'lib'), path.join(bin, 'lib'), { recursive: true });
    const original = fs.readFileSync(helper, 'utf8');
    const childEnv = { ...process.env };
    // Each mutation is a new Node test run, not a child test-runner worker.
    delete childEnv.NODE_TEST_CONTEXT;
    const mutants = [
      ['expectedHash !== undefined && expectedHash !== sourceHash', 'false', '^stale hashes'],
      ['digestLines > maxLines', 'false', '^stale hashes'],
      ["markdown.slice(0, -1).split('\\n').length", "markdown.trimEnd().split('\\n').length", '^line budget counts'],
      ['matches.length !== 1', 'matches.length === 0', '^missing, duplicate'],
      ['selected[i].start <= selected[i - 1].end', 'false', '^missing, duplicate'],
      ['selected[i].start <= selected[i - 1].end', 'true', '^disjoint sections'],
      ["sourceLabel.split('/').includes('..')", 'false', '^source labels'],
      ['!values.stdin || positionals.length !== 1', 'positionals.length !== 1', '^CLI requires'],
      ["!Buffer.from(decoded, 'utf8').equals(bytes)", 'false', '^stale hashes'],
      ['!Number.isInteger(maxLines) || maxLines < 1 || maxLines > 2000', 'false', '^stale hashes'],
    ];
    for (const [before, after, pattern] of mutants) {
      assert.equal(original.split(before).length, 2, `Mutation must target exactly one decision: ${before}`);
      const mutant = path.join(bin, 'research-digest.cjs');
      fs.writeFileSync(mutant, original.replace(before, after));
      const result = spawnSync('node', ['--test', '--test-reporter=tap', '--test-name-pattern', pattern, __filename], {
        env: { ...childEnv, GSD_RESEARCH_DIGEST_HELPER: mutant }, encoding: 'utf8', timeout: 30000,
      });
      assert.equal(result.error, undefined);
      assert.notEqual(result.status, 0, `Behavioral suite must reject mutation: ${before}\n${result.stdout}\n${result.stderr}`);
      assert.match(result.stdout, /^not ok \d+ - /m, 'Mutation must fail a named behavioral test.');
      assert.match(result.stdout, /failureType: 'testCodeFailure'/, 'Mutation must fail a real behavioral assertion.');
      assert.match(result.stdout, /expect\(received\)\.(?:toThrow|toBe)\((?:expected)?\)|code: 'ERR_ASSERTION'/, 'Setup failures cannot count as killed mutations.');
      assert.doesNotMatch(result.stderr, /MODULE_NOT_FOUND|SyntaxError/, 'Setup errors cannot count as killed mutations.');
    }
  } finally { fs.rmSync(sandbox, { recursive: true, force: true }); }
});

test('source labels require relative research paths without filesystem claims', () => {
  for (const label of [undefined, '', 'STATE.md', '../RESEARCH.md', 'phase/../RESEARCH.md', '/RESEARCH.md', 'C:/RESEARCH.md', 'C:phase/RESEARCH.md', 'bad\0/RESEARCH.md']) {
    expect(() => createDigest(Buffer.from(source), { source: label, sections: ['UI'] })).toThrow('label');
  }
  expect(createDigest(Buffer.from(source), { source: '.planning\\23-RESEARCH.md', sections: ['UI'] }).source).toBe('.planning/23-RESEARCH.md');
});

test('CLI requires explicit stdin mode and emits nothing on hash mismatch', () => {
  for (const args of [['RESEARCH.md', '--section', 'UI'], ['RESEARCH.md', '--stdin', '--section', 'UI', '--expect-sha256', '0'.repeat(64)]]) {
    let stdout = '', stderr = '';
    expect(main(args, { readStdin: () => Buffer.from(source), stdout: text => { stdout += text; }, stderr: text => { stderr += text; } })).toBe(1);
    expect(stdout).toBe(''); expect(stderr).toContain('research-digest:');
  }
});

test('CLI reads source bytes only from fd0 and never opens a supplied label', () => {
  const read = fs.readFileSync;
  const reads = [];
  let stdout = '', stderr = '';
  try {
    fs.readFileSync = function (input) {
      assert.equal(input, 0, 'A provenance label must never become a filesystem read.');
      reads.push(input);
      return Buffer.from(source);
    };
    expect(main(['nonexistent/23-RESEARCH.md', '--stdin', '--section', 'UI', '--json'], {
      stdout: text => { stdout += text; }, stderr: text => { stderr += text; },
    })).toBe(0);
    expect(reads).toEqual([0]); expect(stderr).toBe('');
    const result = JSON.parse(stdout);
    expect(result.source).toBe('nonexistent/23-RESEARCH.md');
    expect(result.source_kind).toBe('supplied_bytes');
    expect(result.source_sha256).toBe(sha(source));
  } finally { fs.readFileSync = read; }
});
