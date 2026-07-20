'use strict';

const { describe, test, expect } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  buildPairedCaptureContext,
  buildInstallHyperfineArgs,
  capturePairedArtifact,
  createPairedBenchmarkExecutor,
  mergeBaselineArtifacts,
  normalizeHyperfineResults,
  parseHyperfineSample,
  parseArgs,
} = require('../scripts/bench');
const { buildSchedule, capturePairedComparison } = require('../scripts/lib/paired-perf');
const { pairedSpec, receiptFor } = require('./helpers/paired-perf-fixture');

function hyperfineResult(command, overrides = {}) {
  return {
    command,
    mean: 1.234,
    stddev: 0.05,
    min: 1.1,
    max: 1.4,
    times: [1.1, 1.2, 1.4],
    ...overrides,
  };
}

function partialBaseline(platform) {
  return {
    metadata: {
      capturedAt: '2026-07-01T16:30:00.000Z',
      nodeVersion: 'v22.17.1',
      bunVersion: '1.3.5',
      upstreamVersion: '1.5.0',
      hyperfineVersion: '1.20.0',
    },
    platform,
    install: { mean_ms: 1000, stddev_ms: 10, min_ms: 990, max_ms: 1010, samples: 5 },
    compose: { mean_ms: 500, stddev_ms: 5, min_ms: 490, max_ms: 510, samples: 5 },
  };
}

describe('paired benchmark scheduling', () => {
  test('parses paired worktrees without caller-declared commit provenance', () => {
    const options = parseArgs([
      '--paired',
      '--reference-worktree', 'reference',
      '--candidate-worktree', 'candidate',
      '--runner-image', 'windows-2025',
      '--pairs', '12',
      '--warmup', '2',
      '--out', 'comparison.json',
    ]);

    expect(options.paired).toBe(true);
    expect(options.referenceWorktree).toBe(path.resolve('reference'));
    expect(options.candidateWorktree).toBe(path.resolve('candidate'));
    expect(options.runnerImage).toBe('windows-2025');
    expect(options.pairs).toBe(12);
    expect(options.warmup).toBe(2);
    expect(options).not.toHaveProperty('referenceCommit');
    expect(options).not.toHaveProperty('candidateCommit');
  });

  test('resolves executed commits, subject digests, and one shared runtime identity', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-paired-context-'));
    const referenceWorktree = path.join(root, 'reference');
    const candidateWorktree = path.join(root, 'candidate');
    const commits = new Map([
      [referenceWorktree, '1'.repeat(40)],
      [candidateWorktree, '2'.repeat(40)],
    ]);

    try {
      for (const [worktree, version] of [[referenceWorktree, '1.6.1'], [candidateWorktree, '1.7.0']]) {
        fs.mkdirSync(path.join(worktree, '.planning'), { recursive: true });
        fs.writeFileSync(path.join(worktree, 'package.json'), JSON.stringify({ version }));
        fs.writeFileSync(path.join(worktree, 'bun.lock'), `lock:${version}\n`);
        fs.writeFileSync(path.join(worktree, '.planning', 'upstream-authority.json'), JSON.stringify({ version }));
      }
      const fakeRun = (command, args) => {
        if (command === 'bun') return '1.3.5';
        if (command === 'hyperfine') return 'hyperfine 1.20.0';
        const worktree = args[1];
        return args[2] === 'rev-parse' ? commits.get(worktree) : '';
      };

      const context = buildPairedCaptureContext({
        referenceWorktree,
        candidateWorktree,
        runnerImage: 'windows-2025',
        pairs: 10,
        warmup: 1,
      }, {
        run: fakeRun,
        platform: () => 'win32',
        architecture: () => 'x64',
        cpu: () => 'fixture-cpu',
        runnerImage: () => 'windows-2025',
      });

      expect(context.spec.subjects.reference.commit).toBe('1'.repeat(40));
      expect(context.spec.subjects.candidate.commit).toBe('2'.repeat(40));
      expect(context.spec.subjects.reference.lockSha256)
        .not.toBe(context.spec.subjects.candidate.lockSha256);
      expect(context.spec.executionIdentity).toEqual({
        platform: 'windows',
        architecture: 'x64',
        cpu: 'fixture-cpu',
        runnerImage: 'windows-2025',
        runnerImageExpected: 'windows-2025',
        nodeVersion: process.version,
        bunVersion: '1.3.5',
        hyperfineVersion: '1.20.0',
      });
      expect(context.spec.controls.harnessSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(context.worktrees).toEqual({ reference: referenceWorktree, candidate: candidateWorktree });

      expect(() => buildPairedCaptureContext({
        referenceWorktree,
        candidateWorktree,
        runnerImage: 'windows-2025',
        pairs: 10,
        warmup: 1,
      }, {
        run: fakeRun,
        platform: () => 'win32',
        architecture: () => 'x64',
        cpu: () => 'fixture-cpu',
        runnerImage: () => 'ubuntu-24.04',
      })).toThrow(/expected runner image/i);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('inspects, isolates, measures, and cleans every scheduled sample', () => {
    const spec = pairedSpec();
    const context = {
      spec,
      worktrees: { reference: 'reference-worktree', candidate: 'candidate-worktree' },
    };
    const events = [];
    const subjectFor = worktree => (
      worktree === context.worktrees.reference ? spec.subjects.reference : spec.subjects.candidate
    );
    const executor = createPairedBenchmarkExecutor(context, {
      resolveExecutionIdentity: () => spec.executionIdentity,
      resolveControls: () => spec.controls,
      resolveSubject: worktree => subjectFor(worktree),
      createSandbox: (worktree, request) => {
        events.push(`create:${request.metric}:${request.phase}:${request.index}:${worktree}`);
        return { root: `root-${events.length}`, workspace: `workspace-${events.length}` };
      },
      prepare: (metric, sandbox) => {
        events.push(`prepare:${metric}:${sandbox.workspace}`);
        return 0;
      },
      measure: (metric, sandbox, request) => {
        events.push(`measure:${metric}:${sandbox.workspace}`);
        return {
          benchmarkExitCode: 0,
          durationNs: request.subject === 'reference' ? 100_000_000 : 105_000_000,
        };
      },
      cleanup: sandbox => events.push(`cleanup:${sandbox.root}`),
    });

    const comparison = capturePairedComparison(spec, executor);

    expect(comparison.verdict).toBe('pass');
    expect(events.filter(event => event.startsWith('create:'))).toHaveLength(44);
    expect(events.filter(event => event.startsWith('prepare:'))).toHaveLength(44);
    expect(events.filter(event => event.startsWith('measure:'))).toHaveLength(44);
    expect(events.filter(event => event.startsWith('cleanup:'))).toHaveLength(44);
  });

  test('runs production preparation and exactly one Hyperfine command per scheduled sample', () => {
    const spec = pairedSpec();
    const context = {
      spec,
      worktrees: { reference: 'reference-worktree', candidate: 'candidate-worktree' },
    };
    const calls = [];
    const executor = createPairedBenchmarkExecutor(context, {
      resolveExecutionIdentity: () => spec.executionIdentity,
      resolveControls: () => spec.controls,
      resolveSubject: worktree => (
        worktree === context.worktrees.reference ? spec.subjects.reference : spec.subjects.candidate
      ),
      createSandbox: (worktree, request) => ({
        root: `root-${request.metric}-${request.phase}-${request.index}-${request.subject}`,
        workspace: `workspace-${worktree}`,
      }),
      spawn: (command, args, options) => {
        calls.push({ command, args, options });
        return { status: 0, stderr: '' };
      },
      readJson: () => ({ results: [{ times: [0.125], exit_codes: [0] }] }),
      cleanup: () => {},
    });

    capturePairedComparison(spec, executor);

    const hyperfineCalls = calls.filter(call => call.command === 'hyperfine');
    const preparationCalls = calls.filter(call => call.command === 'bun');
    expect(hyperfineCalls).toHaveLength(44);
    expect(preparationCalls).toHaveLength(22);
    for (const call of hyperfineCalls) {
      expect(call.args.slice(0, 4)).toEqual(['--warmup', '0', '--runs', '1']);
      expect(call.args.filter(arg => arg === '--export-json')).toHaveLength(1);
      expect(['bun install --frozen-lockfile --ignore-scripts', 'bun run compose'])
        .toContain(call.args.at(-1));
      expect(call.options.cwd).toMatch(/^workspace-/);
    }
    for (const call of preparationCalls) {
      expect(call.args).toEqual(['install', '--frozen-lockfile', '--ignore-scripts']);
      expect(call.options.cwd).toMatch(/^workspace-/);
    }
  });

  test('rejects observed identity, control, and subject drift after measurement', () => {
    const spec = pairedSpec();
    const context = {
      spec,
      worktrees: { reference: 'reference-worktree', candidate: 'candidate-worktree' },
    };
    const cases = [
      {
        pattern: /execution identity changed/,
        overrides: {
          resolveExecutionIdentity: (() => {
            let calls = 0;
            return () => calls++ === 0 ? spec.executionIdentity : { ...spec.executionIdentity, cpu: 'changed' };
          })(),
          resolveControls: () => spec.controls,
          resolveSubject: worktree => (
            worktree === context.worktrees.reference ? spec.subjects.reference : spec.subjects.candidate
          ),
        },
      },
      {
        pattern: /shared controls changed/,
        overrides: {
          resolveExecutionIdentity: () => spec.executionIdentity,
          resolveControls: (() => {
            let calls = 0;
            return () => calls++ === 0 ? spec.controls : { ...spec.controls, workloadSha256: 'f'.repeat(64) };
          })(),
          resolveSubject: worktree => (
            worktree === context.worktrees.reference ? spec.subjects.reference : spec.subjects.candidate
          ),
        },
      },
      {
        pattern: /reference subject changed/,
        overrides: {
          resolveExecutionIdentity: () => spec.executionIdentity,
          resolveControls: () => spec.controls,
          resolveSubject: (() => {
            let calls = 0;
            return worktree => {
              const subject = worktree === context.worktrees.reference
                ? spec.subjects.reference
                : spec.subjects.candidate;
              return calls++ === 0 ? subject : { ...subject, lockSha256: 'f'.repeat(64) };
            };
          })(),
        },
      },
    ];

    for (const fixture of cases) {
      let cleanups = 0;
      const executor = createPairedBenchmarkExecutor(context, {
        ...fixture.overrides,
        createSandbox: () => ({ root: 'fixture-root', workspace: 'fixture-workspace' }),
        prepare: () => 0,
        measure: () => ({ benchmarkExitCode: 0, durationNs: 100_000_000 }),
        cleanup: () => { cleanups++; },
      });
      expect(() => capturePairedComparison(spec, executor)).toThrow(fixture.pattern);
      expect(cleanups).toBe(1);
    }
  });

  test('accepts exactly one successful raw Hyperfine sample in integer nanoseconds', () => {
    expect(parseHyperfineSample({
      results: [{ times: [0.125], exit_codes: [0] }],
    })).toEqual({ benchmarkExitCode: 0, durationNs: 125_000_000 });

    expect(() => parseHyperfineSample({
      results: [{ times: [0.125, 0.126], exit_codes: [0, 0] }],
    })).toThrow(/exactly one raw sample/);
    expect(() => parseHyperfineSample({
      results: [{ times: [0.125], exit_codes: [1] }],
    })).toThrow(/benchmark exit code/);
  });

  test('writes schema-valid paired evidence only after the complete capture succeeds', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-paired-artifact-'));
    const referenceWorktree = path.join(root, 'reference');
    const candidateWorktree = path.join(root, 'candidate');
    const out = path.join(root, 'comparison.json');
    const commits = new Map([
      [referenceWorktree, '1'.repeat(40)],
      [candidateWorktree, '2'.repeat(40)],
    ]);

    try {
      for (const [worktree, version] of [[referenceWorktree, '1.6.1'], [candidateWorktree, '1.7.0']]) {
        fs.mkdirSync(path.join(worktree, '.planning'), { recursive: true });
        fs.writeFileSync(path.join(worktree, 'package.json'), JSON.stringify({ version }));
        fs.writeFileSync(path.join(worktree, 'bun.lock'), `lock:${version}\n`);
        fs.writeFileSync(path.join(worktree, '.planning', 'upstream-authority.json'), JSON.stringify({ version }));
      }
      const fakeRun = (command, args) => {
        if (command === 'bun') return '1.3.5';
        if (command === 'hyperfine') return 'hyperfine 1.20.0';
        const worktree = args[1];
        return args[2] === 'rev-parse' ? commits.get(worktree) : '';
      };
      let samples = 0;
      const comparison = capturePairedArtifact({
        paired: true,
        referenceWorktree,
        candidateWorktree,
        runnerImage: 'windows-2025',
        pairs: 10,
        warmup: 1,
        out,
      }, {
        run: fakeRun,
        platform: () => 'win32',
        architecture: () => 'x64',
        cpu: () => 'fixture-cpu',
        runnerImage: () => 'windows-2025',
        now: () => '2026-07-20T00:00:00.000Z',
        createSandbox: () => ({ root: 'fixture-root', workspace: 'fixture-workspace' }),
        prepare: () => 0,
        measure: (metric, sandbox, request) => {
          void metric;
          void sandbox;
          samples++;
          return {
            benchmarkExitCode: 0,
            durationNs: request.subject === 'reference' ? 100_000_000 : 105_000_000,
          };
        },
        cleanup: () => {},
      });

      expect(samples).toBe(44);
      expect(JSON.parse(fs.readFileSync(out, 'utf8'))).toEqual(comparison);
      expect(comparison.authority).toBe('paired-blocking');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('aborts the complete capture and cleans the sandbox when a sample fails', () => {
    const spec = pairedSpec();
    let cleanups = 0;
    const context = {
      spec,
      worktrees: { reference: 'reference-worktree', candidate: 'candidate-worktree' },
    };
    const executor = createPairedBenchmarkExecutor(context, {
      resolveExecutionIdentity: () => spec.executionIdentity,
      resolveControls: () => spec.controls,
      resolveSubject: worktree => (
        worktree === context.worktrees.reference ? spec.subjects.reference : spec.subjects.candidate
      ),
      createSandbox: () => ({ root: 'fixture-root', workspace: 'fixture-workspace' }),
      prepare: () => 0,
      measure: () => ({ benchmarkExitCode: 1, durationNs: 1 }),
      cleanup: () => { cleanups++; },
    });

    expect(() => capturePairedComparison(spec, executor)).toThrow(/sample benchmark failed/);
    expect(cleanups).toBe(1);
  });

  test('derives the first order from the recorded seed and then alternates', () => {
    expect(buildSchedule('00'.padEnd(64, '0'), 6)).toEqual(['AB', 'BA', 'AB', 'BA', 'AB', 'BA']);
    expect(buildSchedule('ff'.padEnd(64, '0'), 6)).toEqual(['BA', 'AB', 'BA', 'AB', 'BA', 'AB']);
  });

  test('alternates warmups independently when warmups exceed an odd measured-pair count', () => {
    const comparison = capturePairedComparison(
      pairedSpec({ measuredPairs: 11, warmupRuns: 12 }),
      request => receiptFor(request)
    );
    const observed = comparison.metrics.install.warmups.map(warmup => (
      warmup.samples.at(0).subject === 'reference' ? 'AB' : 'BA'
    ));
    expect(observed).toEqual(buildSchedule(comparison.policy.seed, 12));
  });

  test('captures complete deterministic evidence through one benchmark executor', () => {
    const spec = pairedSpec();
    const calls = [];
    const execute = request => {
      calls.push(request);
      return receiptFor(request);
    };

    const first = capturePairedComparison(spec, execute);
    const second = capturePairedComparison(spec, execute);

    expect(calls).toHaveLength(88);
    expect(first).toEqual(second);
    expect(first.metrics.install.pairs).toHaveLength(10);
    expect(first.metrics.compose.pairs.map(pair => pair.order)).toEqual(
      buildSchedule(first.policy.seed, 10)
    );
    expect(first.metrics.install.summary.ratio).toBe(1.05);
    expect(first.verdict).toBe('pass');
  });

  test('rejects indistinguishable subjects before invoking the benchmark executor', () => {
    const spec = pairedSpec();
    spec.subjects.candidate.commit = spec.subjects.reference.commit;
    let calls = 0;

    expect(() => capturePairedComparison(spec, request => {
      calls++;
      return receiptFor(request);
    })).toThrow(/distinct commits/);
    expect(calls).toBe(0);
  });
});

describe('bench hyperfine normalization', () => {
  test('normalizes hyperfine seconds to integer millisecond metrics', () => {
    const normalized = normalizeHyperfineResults({
      results: [
        hyperfineResult('bun install --ignore-scripts'),
        hyperfineResult('bun run compose', { mean: 0.456, stddev: 0.01, min: 0.44, max: 0.48 }),
      ],
    });

    expect(normalized.install).toEqual({
      mean_ms: 1234,
      stddev_ms: 50,
      min_ms: 1100,
      max_ms: 1400,
      samples: 3,
    });
    expect(normalized.compose.mean_ms).toBe(456);
  });

  test('can normalize a single-operation hyperfine file', () => {
    const normalized = normalizeHyperfineResults(
      { results: [hyperfineResult('bun install --ignore-scripts')] },
      ['install']
    );

    expect(normalized.install.mean_ms).toBe(1234);
  });

  test('install benchmark uses Bun cwd support and --ignore-scripts in scratch directory', () => {
    const scratchDir = path.join(os.tmpdir(), 'gsd scratch dir');
    const args = buildInstallHyperfineArgs({
      scratchDir,
      outputFile: path.join(os.tmpdir(), 'install.json'),
      runs: 5,
      warmup: 3,
    });

    expect(args).not.toContain('--working-directory');
    expect(args).toContain('--prepare');
    expect(args.join(' ')).toContain('node_modules');
    expect(args[args.length - 1]).toContain('bun install --ignore-scripts --cwd');
    expect(args[args.length - 1]).toContain(scratchDir);
  });
});

describe('bench baseline merge', () => {
  test('fails when a required platform artifact is missing', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-bench-merge-'));

    try {
      fs.writeFileSync(path.join(dir, 'perf-linux.json'), JSON.stringify(partialBaseline('linux')));
      fs.writeFileSync(path.join(dir, 'perf-macos.json'), JSON.stringify(partialBaseline('macos')));

      expect(() =>
        mergeBaselineArtifacts(dir, ['linux', 'macos', 'windows'])
      ).toThrow(/Missing required platform artifact: windows/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('merges required platform artifacts into committed baseline shape', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-bench-merge-'));

    try {
      for (const platform of ['linux', 'macos', 'windows']) {
        fs.writeFileSync(
          path.join(dir, `perf-${platform}.json`),
          JSON.stringify(partialBaseline(platform))
        );
      }

      const merged = mergeBaselineArtifacts(dir, ['linux', 'macos', 'windows']);

      expect(Object.keys(merged.platforms).sort()).toEqual(['linux', 'macos', 'windows']);
      expect(merged.acceptedRegressions).toEqual([]);
      expect(merged.platforms.windows.install.mean_ms).toBe(1000);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
