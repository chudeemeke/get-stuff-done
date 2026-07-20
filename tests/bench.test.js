'use strict';

const { describe, test, expect } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  buildInstallHyperfineArgs,
  mergeBaselineArtifacts,
  normalizeHyperfineResults,
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
  test('derives the first order from the recorded seed and then alternates', () => {
    expect(buildSchedule('00'.padEnd(64, '0'), 6)).toEqual(['AB', 'BA', 'AB', 'BA', 'AB', 'BA']);
    expect(buildSchedule('ff'.padEnd(64, '0'), 6)).toEqual(['BA', 'AB', 'BA', 'AB', 'BA', 'AB']);
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
