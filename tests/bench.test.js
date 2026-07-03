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

  test('install benchmark uses scratch working directory and --ignore-scripts', () => {
    const args = buildInstallHyperfineArgs({
      scratchDir: path.join(os.tmpdir(), 'gsd scratch dir'),
      outputFile: path.join(os.tmpdir(), 'install.json'),
      runs: 5,
      warmup: 3,
    });

    expect(args).toContain('--working-directory');
    expect(args).toContain('bun install --ignore-scripts');
    expect(args.join(' ')).toContain('node_modules');
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
