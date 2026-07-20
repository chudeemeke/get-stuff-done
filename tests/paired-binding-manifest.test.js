'use strict';

const { describe, expect, test } = require('./helpers/portable-test-api');
const { spawnSync } = require('child_process');
const { createHash, randomUUID } = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  createPairedBindingManifest,
  defaultReadEvidence,
  main,
  parseArgs,
  publishManifestCreateOnly,
} = require('../scripts/emit-paired-binding-manifest');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const REPOSITORY = 'chudeemeke/get-stuff-done';
const BOOTSTRAP_SHA = '5c813db4d8a17bd2dbf7523e016a5152a6a0c3ce';
const HARNESS_SHA = '35cbe0883a65409b13f9b7cc6347c793df2a2f15';
const BASE_SHA = 'a'.repeat(40);
const HEAD_SHA = 'b'.repeat(40);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function options(overrides = {}) {
  return {
    bootstrap: { repository: REPOSITORY, sha: BOOTSTRAP_SHA },
    harness: { repository: REPOSITORY, sha: HARNESS_SHA },
    reference: { repository: REPOSITORY, sha: BASE_SHA },
    candidate: { repository: REPOSITORY, sha: HEAD_SHA },
    tierBReceipt: 'artifacts/runtime-receipt.json',
    comparison: 'artifacts/comparison.json',
    output: 'artifacts/binding-manifest.json',
    ...overrides,
  };
}

function cliArgs() {
  return [
    '--bootstrap-repository', REPOSITORY,
    '--bootstrap-sha', BOOTSTRAP_SHA,
    '--harness-repository', REPOSITORY,
    '--harness-sha', HARNESS_SHA,
    '--reference-repository', REPOSITORY,
    '--reference-sha', BASE_SHA,
    '--candidate-repository', REPOSITORY,
    '--candidate-sha', HEAD_SHA,
    '--tier-b-receipt', 'artifacts/runtime-receipt.json',
    '--comparison', 'artifacts/comparison.json',
    '--output', 'artifacts/binding-manifest.json',
  ];
}

describe('paired binding manifest emitter', () => {
  test('binds four immutable subjects to collector-recomputable content digests', () => {
    const tierB = Buffer.from('{"subject":"ci-perf-linux"}\n');
    const comparison = Buffer.from('{"authority":"paired-blocking"}\n');
    const publications = [];
    const manifest = createPairedBindingManifest(options(), {
      projectRoot: PROJECT_ROOT,
      readEvidence(root, filePath) {
        expect(root).toBe(PROJECT_ROOT);
        return filePath.includes('runtime-receipt') ? tierB : comparison;
      },
      publishManifest(root, filePath, value) {
        publications.push({ root, filePath, value });
        return path.join(root, filePath);
      },
    });

    expect(manifest).toEqual({
      schemaVersion: 1,
      bootstrap: { repository: REPOSITORY, sha: BOOTSTRAP_SHA },
      harness: { repository: REPOSITORY, sha: HARNESS_SHA },
      reference: { repository: REPOSITORY, sha: BASE_SHA },
      candidate: { repository: REPOSITORY, sha: HEAD_SHA },
      tierBReceiptSha256: sha256(tierB),
      comparisonSha256: sha256(comparison),
    });
    expect(publications).toEqual([
      {
        root: PROJECT_ROOT,
        filePath: 'artifacts/binding-manifest.json',
        value: manifest,
      },
    ]);
  });

  test('parses one closed CLI shape and rejects duplicates or incomplete flags', () => {
    expect(parseArgs(cliArgs())).toEqual(options());
    expect(parseArgs(['--help'])).toEqual({ help: true });
    expect(parseArgs(['-h'])).toEqual({ help: true });
    for (const args of [
      null,
      [],
      ['--unknown', 'value'],
      [...cliArgs(), '--output', 'other.json'],
      cliArgs().slice(0, -1),
      ['--bootstrap-repository'],
    ]) {
      expect(() => parseArgs(args)).toThrow();
    }
  });

  test('rejects malformed subjects, paths, bytes, and adapters before publication', () => {
    const validDependencies = {
      projectRoot: PROJECT_ROOT,
      readEvidence: () => Buffer.from('{}'),
      publishManifest: () => 'manifest.json',
    };
    for (const candidate of [
      null,
      options({ bootstrap: { repository: '../unsafe', sha: BOOTSTRAP_SHA } }),
      options({ candidate: { repository: REPOSITORY, sha: 'main' } }),
      options({ tierBReceipt: '../outside.json' }),
      options({ comparison: '' }),
      options({ output: 'C:\\outside.json' }),
      options({ bootstrap: { repository: REPOSITORY, sha: BOOTSTRAP_SHA, extra: true } }),
      options({ comparison: 'artifacts/runtime-receipt.json' }),
      { ...options(), unexpected: true },
    ]) {
      expect(() => createPairedBindingManifest(candidate, validDependencies)).toThrow();
    }

    for (const dependencies of [
      { ...validDependencies, projectRoot: null },
      { ...validDependencies, projectRoot: '' },
      { ...validDependencies, readEvidence: null },
      { ...validDependencies, publishManifest: null },
      { ...validDependencies, readEvidence: () => 'not-bytes' },
      { ...validDependencies, readEvidence: () => Buffer.alloc(16 * 1024 * 1024 + 1) },
    ]) {
      expect(() => createPairedBindingManifest(options(), dependencies)).toThrow();
    }
  });

  test('reads bounded regular files and publishes one create-only private manifest', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-paired-manifest-'));
    try {
      fs.mkdirSync(path.join(root, 'artifacts'));
      fs.writeFileSync(path.join(root, 'artifacts', 'comparison.json'), '{}\n');
      expect(defaultReadEvidence(root, 'artifacts/comparison.json')).toEqual(Buffer.from('{}\n'));
      expect(() => defaultReadEvidence(root, '../outside.json')).toThrow();
      expect(() => defaultReadEvidence(root, 'artifacts')).toThrow();

      const manifest = { schemaVersion: 1 };
      const output = publishManifestCreateOnly(root, 'artifacts/manifest.json', manifest);
      expect(JSON.parse(fs.readFileSync(output, 'utf8'))).toEqual(manifest);
      expect(() => publishManifestCreateOnly(root, 'artifacts/manifest.json', manifest)).toThrow(
        'already exists'
      );
      expect(
        fs.existsSync(publishManifestCreateOnly(root, 'new/nested/manifest.json', manifest))
      ).toBe(true);

      const originalLink = fs.linkSync;
      try {
        fs.linkSync = () => {
          const error = new Error('simulated hard-link failure');
          error.code = 'EPERM';
          throw error;
        };
        expect(() =>
          publishManifestCreateOnly(root, 'artifacts/link-failure.json', manifest)
        ).toThrow('simulated hard-link failure');
        expect(fs.readdirSync(path.join(root, 'artifacts')).some(name => name.endsWith('.tmp'))).toBe(
          false
        );
      } finally {
        fs.linkSync = originalLink;
      }

      const originalRead = fs.readFileSync;
      try {
        fs.readFileSync = (filePath, ...args) =>
          path.resolve(filePath) === path.join(root, 'artifacts', 'comparison.json')
            ? Buffer.alloc(16 * 1024 * 1024 + 1)
            : originalRead(filePath, ...args);
        expect(() => defaultReadEvidence(root, 'artifacts/comparison.json')).toThrow(
          'bounded regular file'
        );
      } finally {
        fs.readFileSync = originalRead;
      }

      const linked = path.join(root, 'linked');
      try {
        fs.symlinkSync(path.join(root, 'artifacts'), linked, 'junction');
        expect(() => defaultReadEvidence(root, 'linked/comparison.json')).toThrow('linked path');
        expect(() => publishManifestCreateOnly(root, 'linked/other.json', manifest)).toThrow(
          'linked path'
        );
      } catch (error) {
        if (!['EPERM', 'EACCES'].includes(error?.code)) throw error;
      }

      const targetLink = path.join(root, 'artifacts', 'comparison-link.json');
      try {
        fs.symlinkSync(path.join(root, 'artifacts', 'comparison.json'), targetLink, 'file');
        expect(() => defaultReadEvidence(root, 'artifacts/comparison-link.json')).toThrow(
          'linked path'
        );
      } catch (error) {
        if (!['EPERM', 'EACCES'].includes(error?.code)) throw error;
      }
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('routes CLI publication and sanitizes failures', () => {
    const output = [];
    const errors = [];
    const writes = [];
    expect(
      main(cliArgs(), {
        projectRoot: PROJECT_ROOT,
        readEvidence: () => Buffer.from('{}'),
        publishManifest(root, filePath, manifest) {
          writes.push({ root, filePath, manifest });
          return filePath;
        },
        stdout: { write: value => output.push(value) },
        stderr: { write: value => errors.push(value) },
      })
    ).toBe(0);
    expect(writes).toHaveLength(1);
    expect(output.join('')).toContain('"output":"artifacts/binding-manifest.json"');
    expect(errors).toEqual([]);

    expect(
      main(['--unknown'], {
        stdout: { write() {} },
        stderr: { write: value => errors.push(value) },
      })
    ).toBe(1);
    expect(errors.at(-1)).toBe('Paired binding manifest failed.\n');

    const help = [];
    expect(
      main(['--help'], {
        stdout: { write: value => help.push(value) },
        stderr: { write() {} },
      })
    ).toBe(0);
    expect(help.join('')).toContain('Emits one create-only paired binding manifest.');
  });

  test('executes the real CLI through default bounded adapters', () => {
    const directory = `coverage/paired-binding-${randomUUID()}`;
    const receipt = `${directory}/runtime-receipt.json`;
    const comparison = `${directory}/comparison.json`;
    const output = `${directory}/binding-manifest.json`;
    const absoluteDirectory = path.join(PROJECT_ROOT, ...directory.split('/'));
    fs.mkdirSync(absoluteDirectory, { recursive: true });
    fs.writeFileSync(path.join(absoluteDirectory, 'runtime-receipt.json'), '{}\n');
    fs.writeFileSync(path.join(absoluteDirectory, 'comparison.json'), '{}\n');
    try {
      const result = spawnSync(
        'node',
        [
          path.join(PROJECT_ROOT, 'scripts', 'emit-paired-binding-manifest.js'),
          ...cliArgs().map(value =>
            value === 'artifacts/runtime-receipt.json'
              ? receipt
              : value === 'artifacts/comparison.json'
                ? comparison
                : value === 'artifacts/binding-manifest.json'
                  ? output
                  : value
          ),
        ],
        { cwd: PROJECT_ROOT, encoding: 'utf8', shell: false, windowsHide: true }
      );
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(JSON.parse(result.stdout)).toEqual({ output });
      expect(JSON.parse(fs.readFileSync(path.join(absoluteDirectory, 'binding-manifest.json')))).toMatchObject({
        schemaVersion: 1,
        candidate: { repository: REPOSITORY, sha: HEAD_SHA },
      });
    } finally {
      fs.rmSync(absoluteDirectory, { recursive: true, force: true });
    }
  });
});
