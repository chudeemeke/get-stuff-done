const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  copyCompatHelpers,
  discoverTestFiles,
  getCompatPackageRoot,
  getCompatTestTimeoutMs,
  loadCompatContract,
  parseTestOutput,
  runUpstreamCompat,
  validateCompatContract,
} = require('../scripts/run-upstream-compat');

function makeCompatFixture(suiteNames) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-compat-runner-test-'));
  const testsDir = path.join(root, 'tests');
  const distDir = path.join(root, 'dist', 'gsd-core');
  const tempRoot = path.join(root, 'temp');
  fs.mkdirSync(path.join(testsDir, 'helpers'), { recursive: true });
  fs.mkdirSync(path.join(distDir, 'bin'), { recursive: true });
  fs.mkdirSync(tempRoot);
  fs.writeFileSync(path.join(distDir, 'bin', 'gsd-tools.cjs'), "'use strict';\n", 'utf8');
  fs.writeFileSync(path.join(testsDir, 'helpers.cjs'), "'use strict';\n", 'utf8');
  fs.writeFileSync(path.join(testsDir, 'helpers', 'index.js'), "'use strict';\n", 'utf8');
  for (const suiteName of suiteNames) {
    fs.writeFileSync(path.join(testsDir, suiteName), "'use strict';\n", 'utf8');
  }
  return { root, testsDir, distDir, tempRoot };
}

describe('run-upstream-compat package root resolution', () => {
  test('uses active authority gsdTools path instead of legacy get-shit-done path', () => {
    const distRoot = path.join('repo', 'dist');
    const authority = {
      contractScope: 'maintainer-build-time',
      active: {
        packageName: '@opengsd/gsd-core',
        version: '1.5.0',
        sourceRoot: '.',
        bin: {},
        paths: {
          gsdTools: 'gsd-core/bin/gsd-tools.cjs',
        },
      },
    };

    expect(getCompatPackageRoot({ distRoot, authority })).toBe(
      path.join(distRoot, 'gsd-core')
    );
  });

  test('falls back to dist root when gsdTools is directly under bin', () => {
    const distRoot = path.join('repo', 'dist');
    const authority = {
      contractScope: 'maintainer-build-time',
      active: {
        packageName: 'legacy-package',
        version: '1.0.0',
        sourceRoot: '.',
        bin: {},
        paths: {
          gsdTools: 'bin/gsd-tools.cjs',
        },
      },
    };

    expect(getCompatPackageRoot({ distRoot, authority })).toBe(distRoot);
  });
});

describe('run-upstream-compat test discovery', () => {
  test('classifies every discovered root compatibility suite exactly once', () => {
    const discoveredFiles = discoverTestFiles();
    const validated = validateCompatContract(loadCompatContract(), {
      discoveredFiles,
    });
    const basenames = discoveredFiles.map(filePath => path.basename(filePath));

    expect(basenames).toHaveLength(13);
    expect(validated.suites.map(suite => suite.path).sort()).toEqual(basenames.sort());
  });

  test('rejects unclassified, missing, and duplicate suite paths', () => {
    const discoveredFiles = discoverTestFiles();
    const contract = loadCompatContract();

    expect(() => validateCompatContract(contract, {
      discoveredFiles: [...discoveredFiles, path.join(__dirname, 'unclassified.test.cjs')],
    })).toThrow('Unclassified compatibility suite: unclassified.test.cjs');

    expect(() => validateCompatContract({
      ...contract,
      suites: [...contract.suites, {
        path: 'missing.test.cjs',
        classification: 'candidate',
        authorityBoundary: 'black-box',
      }],
    }, { discoveredFiles })).toThrow('Registered compatibility suite is missing: missing.test.cjs');

    expect(() => validateCompatContract({
      ...contract,
      suites: [...contract.suites, { ...contract.suites[0] }],
    }, { discoveredFiles })).toThrow(`Duplicate compatibility suite path: ${contract.suites[0].path}`);
  });

  test('rejects invalid classifications and incomplete policy metadata', () => {
    const discoveredFiles = discoverTestFiles();
    const source = loadCompatContract();
    const validateMutation = (mutate, message) => {
      const contract = structuredClone(source);
      mutate(contract);
      expect(() => validateCompatContract(contract, { discoveredFiles })).toThrow(message);
    };

    validateMutation(contract => {
      contract.suites[0].classification = 'ignored';
    }, 'Unknown compatibility suite classification: ignored');
    validateMutation(contract => {
      contract.schemaVersion = 2;
    }, 'Compatibility contract schemaVersion must be 1');
    validateMutation(contract => {
      contract.suites[0].authorityBoundary = 'private-api';
    }, 'Unknown compatibility authority boundary: private-api');
    validateMutation(contract => {
      contract.suites.find(suite => suite.path === 'sync.test.cjs').authorityBoundary = 'private-api';
    }, 'Unknown compatibility authority boundary: private-api');
    validateMutation(contract => {
      delete contract.suites.find(suite => suite.path === 'sync.test.cjs').owner;
    }, 'sync.test.cjs repository suite requires rationale, owner, and trigger');
    validateMutation(contract => {
      contract.suites.find(suite => suite.path === 'sync.test.cjs').trigger = 'review later';
    }, 'sync.test.cjs must retain its exact port-or-retire trigger');
    validateMutation(contract => {
      delete contract.suites.find(suite => suite.path === 'core.test.cjs').replacements;
    }, 'core.test.cjs retired suite requires canonical replacements');
    validateMutation(contract => {
      contract.suites.find(suite => suite.path === 'config.test.cjs').authorityBoundary = 'black-box';
    }, 'config.test.cjs imports bin/lib/config.cjs and must be upstream-internal-observed');
    validateMutation(contract => {
      delete contract.suites.find(suite => suite.path === 'config.test.cjs').authorityEvidence;
    }, 'config.test.cjs upstream-internal-observed suite requires exact authority evidence');
    validateMutation(contract => {
      contract.suites.find(suite => suite.path === 'config.test.cjs').authorityEvidence.push('bin/lib/stale.cjs');
    }, 'config.test.cjs upstream-internal-observed suite requires exact authority evidence');
    validateMutation(contract => {
      const suite = contract.suites.find(entry => entry.path === 'commands.test.cjs');
      suite.authorityBoundary = 'upstream-internal-observed';
      suite.authorityEvidence = [];
      suite.rationale = 'incorrect internal classification';
      suite.bumpReviewTrigger = 'review on every bump';
    }, 'commands.test.cjs upstream-internal-observed suite requires exact authority evidence');
    validateMutation(contract => {
      delete contract.suites.find(suite => suite.path === 'config.test.cjs').bumpReviewTrigger;
    }, 'config.test.cjs upstream-internal-observed suite requires rationale and a bump-review trigger');
    validateMutation(contract => {
      contract.suites[0].versions = { '1.5.0': { skip: true } };
    }, 'commands.test.cjs candidate suite cannot define per-version execution policy');
    validateMutation(contract => {
      contract.commonVersions = ['1.6.1'];
    }, 'Compatibility contract must apply to 1.5.0, 1.6.0, and 1.6.1');
  });
});

describe('run-upstream-compat output parsing', () => {
  test('parses TAP pass fail and skipped counts', () => {
    const result = parseTestOutput('# pass 10\n# fail 2\n# skipped 1\n', 1);

    expect(result.passed).toBe(10);
    expect(result.failed).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.ok).toBe(false);
  });
});

describe('run-upstream-compat timeout policy', () => {
  test('uses a longer default timeout on Windows and supports env override', () => {
    expect(getCompatTestTimeoutMs({}, 'win32')).toBe(240000);
    expect(getCompatTestTimeoutMs({}, 'linux')).toBe(120000);
    expect(getCompatTestTimeoutMs({ GSD_COMPAT_TEST_TIMEOUT_MS: '300000' }, 'win32')).toBe(300000);
  });
});

describe('run-upstream-compat helper staging', () => {
  test('copies helpers.cjs and its local helper dependency tree', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-compat-helper-test-'));

    try {
      copyCompatHelpers(tmpDir);

      expect(fs.existsSync(path.join(tmpDir, 'helpers.cjs'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'helpers', 'index.js'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'helpers', 'subprocess-with-timeout.js'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'helpers', 'test-timeouts.js'))).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('run-upstream-compat per-suite execution', () => {
  test('rejects an absent candidate package root before spawning', () => {
    const fixture = makeCompatFixture(['alpha.test.cjs']);
    fs.rmSync(fixture.distDir, { recursive: true, force: true });
    let spawnCount = 0;

    try {
      const result = runUpstreamCompat({
        distDir: fixture.distDir,
        testsDir: fixture.testsDir,
        tempRoot: fixture.tempRoot,
        contract: {
          schemaVersion: 1,
          commonVersions: ['1.5.0', '1.6.0', '1.6.1'],
          suites: [{
            path: 'alpha.test.cjs',
            classification: 'candidate',
            authorityBoundary: 'black-box',
          }],
        },
        runProcessImpl: () => {
          spawnCount += 1;
          return { status: 0, stdout: '# pass 1\n# fail 0\n', stderr: '' };
        },
      });

      expect(result.ok).toBe(false);
      expect(result.errors).toEqual([expect.stringContaining('does not exist')]);
      expect(spawnCount).toBe(0);
      expect(fs.readdirSync(fixture.tempRoot)).toEqual([]);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('rejects a candidate package root without bin/gsd-tools.cjs before spawning', () => {
    const fixture = makeCompatFixture(['alpha.test.cjs']);
    fs.rmSync(path.join(fixture.distDir, 'bin', 'gsd-tools.cjs'));
    let spawnCount = 0;

    try {
      const result = runUpstreamCompat({
        distDir: fixture.distDir,
        testsDir: fixture.testsDir,
        tempRoot: fixture.tempRoot,
        contract: {
          schemaVersion: 1,
          commonVersions: ['1.5.0', '1.6.0', '1.6.1'],
          suites: [{
            path: 'alpha.test.cjs',
            classification: 'candidate',
            authorityBoundary: 'black-box',
          }],
        },
        runProcessImpl: () => {
          spawnCount += 1;
          return { status: 0, stdout: '# pass 1\n# fail 0\n', stderr: '' };
        },
      });

      expect(result.ok).toBe(false);
      expect(result.errors).toEqual([
        expect.stringContaining('bin/gsd-tools.cjs'),
      ]);
      expect(spawnCount).toBe(0);
      expect(fs.readdirSync(fixture.tempRoot)).toEqual([]);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('continues after a failed suite and derives aggregate evidence from suite records', () => {
    const fixture = makeCompatFixture(['alpha.test.cjs', 'beta.test.cjs']);
    const calls = [];
    let clock = 0;

    try {
      const result = runUpstreamCompat({
        distDir: fixture.distDir,
        testsDir: fixture.testsDir,
        tempRoot: fixture.tempRoot,
        contract: {
          schemaVersion: 1,
          commonVersions: ['1.5.0', '1.6.0', '1.6.1'],
          suites: [
            {
              path: 'alpha.test.cjs',
              classification: 'candidate',
              authorityBoundary: 'black-box',
            },
            {
              path: 'beta.test.cjs',
              classification: 'candidate',
              authorityBoundary: 'fork-runtime',
            },
          ],
        },
        now: () => {
          clock += 5;
          return clock;
        },
        runProcessImpl: (command, args, options) => {
          calls.push({ command, args, options });
          if (args.at(-1).endsWith('alpha.test.cjs')) {
            return {
              status: 1,
              stdout: '# pass 1\n# fail 2\n# skipped 0\n',
              stderr: 'alpha assertion failed',
            };
          }
          return {
            status: 0,
            stdout: '# pass 3\n# fail 0\n# skipped 1\n',
            stderr: '',
          };
        },
      });

      expect(calls).toHaveLength(2);
      expect(result).toMatchObject({
        ok: false,
        passed: 4,
        failed: 2,
        skipped: 1,
        excluded: [],
      });
      expect(result.suites).toEqual([
        expect.objectContaining({
          path: 'alpha.test.cjs',
          classification: 'candidate',
          authorityBoundary: 'black-box',
          status: 'failed',
          passed: 1,
          failed: 2,
          skipped: 0,
          durationMs: 5,
          exitCode: 1,
          errors: ['alpha assertion failed'],
        }),
        expect.objectContaining({
          path: 'beta.test.cjs',
          classification: 'candidate',
          authorityBoundary: 'fork-runtime',
          status: 'passed',
          passed: 3,
          failed: 0,
          skipped: 1,
          durationMs: 5,
          exitCode: 0,
          errors: [],
        }),
      ]);
      expect(calls[1].options.env.GSD_COMPAT_PACKAGE_ROOT).toBe(fixture.distDir);
      expect(fs.readdirSync(fixture.tempRoot)).toEqual([]);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('normalizes timeout and spawn errors without launching classified exclusions', () => {
    const suiteNames = [
      'timeout.test.cjs',
      'spawn.test.cjs',
      'repository.test.cjs',
      'retired.test.cjs',
    ];
    const fixture = makeCompatFixture(suiteNames);
    const calls = [];

    try {
      const result = runUpstreamCompat({
        distDir: fixture.distDir,
        testsDir: fixture.testsDir,
        tempRoot: fixture.tempRoot,
        contract: {
          schemaVersion: 1,
          commonVersions: ['1.5.0', '1.6.0', '1.6.1'],
          suites: [
            {
              path: 'timeout.test.cjs',
              classification: 'candidate',
              authorityBoundary: 'black-box',
            },
            {
              path: 'spawn.test.cjs',
              classification: 'candidate',
              authorityBoundary: 'black-box',
            },
            {
              path: 'repository.test.cjs',
              classification: 'repository',
              rationale: 'source-only gate',
              owner: 'get-stuff-done maintainers',
              trigger: 'review when the source gate changes',
            },
            {
              path: 'retired.test.cjs',
              classification: 'retired',
              rationale: 'obsolete internal contract',
              owner: 'get-stuff-done maintainers',
              trigger: 'remove after replacement coverage is complete',
              replacements: ['bin/lib/replacement.cjs'],
            },
          ],
        },
        runProcessImpl: (command, args) => {
          calls.push({ command, args });
          if (args.at(-1).endsWith('timeout.test.cjs')) {
            return {
              status: null,
              stdout: '',
              stderr: '',
              error: Object.assign(new Error('process timed out'), { code: 'ETIMEDOUT' }),
            };
          }
          throw new Error('spawn unavailable');
        },
      });

      expect(calls).toHaveLength(2);
      expect(result.suites.map(suite => suite.status)).toEqual(['timed-out', 'spawn-error']);
      expect(result.suites[0].errors).toEqual(['process timed out']);
      expect(result.suites[1].errors).toEqual(['spawn unavailable']);
      expect(result.classifiedExclusions).toEqual([
        { path: 'repository.test.cjs', classification: 'repository' },
        { path: 'retired.test.cjs', classification: 'retired' },
      ]);
      expect(fs.readdirSync(fixture.tempRoot)).toEqual([]);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('cleans the owned workspace without masking a staging failure', () => {
    const fixture = makeCompatFixture(['alpha.test.cjs']);
    fs.rmSync(path.join(fixture.testsDir, 'helpers.cjs'));

    try {
      expect(() => runUpstreamCompat({
        distDir: fixture.distDir,
        testsDir: fixture.testsDir,
        tempRoot: fixture.tempRoot,
        contract: {
          schemaVersion: 1,
          commonVersions: ['1.5.0', '1.6.0', '1.6.1'],
          suites: [{
            path: 'alpha.test.cjs',
            classification: 'candidate',
            authorityBoundary: 'black-box',
          }],
        },
      })).toThrow(/helpers\.cjs/);
      expect(fs.readdirSync(fixture.tempRoot)).toEqual([]);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('uses the final TAP summary and reports actionable failure context', () => {
    const fixture = makeCompatFixture(['nested.test.cjs', 'contradictory.test.cjs']);

    try {
      const result = runUpstreamCompat({
        distDir: fixture.distDir,
        testsDir: fixture.testsDir,
        tempRoot: fixture.tempRoot,
        contract: {
          schemaVersion: 1,
          commonVersions: ['1.5.0', '1.6.0', '1.6.1'],
          suites: [
            {
              path: 'nested.test.cjs',
              classification: 'candidate',
              authorityBoundary: 'black-box',
            },
            {
              path: 'contradictory.test.cjs',
              classification: 'candidate',
              authorityBoundary: 'black-box',
            },
          ],
        },
        runProcessImpl: (command, args) => {
          if (args.at(-1).endsWith('nested.test.cjs')) {
            return {
              status: 0,
              stdout: '# fail 1\n# pass 0\n# fail 0\n# pass 1\n# skipped 0\n',
              stderr: '',
            };
          }
          return {
            status: 0,
            stdout: [
              'TAP version 13',
              "error: 'expected validation error was returned'",
              "expected: 'invalid input'",
              "actual: 'invalid input'",
              'ok 1 - setup',
              'ok 2 - config',
              'ok 3 - state',
              'ok 4 - phase',
              'ok 5 - milestone',
              'not ok 6 - preserves roadmap line endings',
              "error: 'Expected CRLF to remain stable'",
              "expected: '\\r\\n'",
              "actual: '\\n'",
              '# pass 5',
              '# fail 1',
              '# skipped 0',
            ].join('\n'),
            stderr: '',
          };
        },
      });

      expect(result.suites[0]).toMatchObject({ status: 'passed', failed: 0 });
      expect(result.suites[1]).toMatchObject({ status: 'failed', failed: 1, exitCode: 0 });
      expect(result.suites[1].errors[0]).toContain('not ok 6');
      expect(result.suites[1].errors.join('\n')).toContain('Expected CRLF');
      expect(result.suites[1].errors).toHaveLength(4);
      expect(result.suites[1].errors.join('\n')).not.toContain('TAP version');
      expect(result.suites[1].errors.join('\n')).not.toContain('expected validation error');
      expect(result.ok).toBe(false);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
