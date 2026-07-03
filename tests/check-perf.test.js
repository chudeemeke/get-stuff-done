'use strict';

const { describe, test, expect } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const CHECK_PERF = path.join(PROJECT_ROOT, 'scripts', 'check-perf.js');

function metric(meanMs) {
  return {
    mean_ms: meanMs,
    stddev_ms: 10,
    min_ms: Math.max(0, meanMs - 10),
    max_ms: meanMs + 10,
    samples: 5,
  };
}

function baseline(overrides = {}) {
  return {
    metadata: {
      capturedAt: '2026-07-03T04:48:43.893Z',
      nodeVersion: 'per-platform',
      bunVersion: 'per-platform',
      upstreamVersion: '1.5.0',
      hyperfineVersion: 'per-platform',
    },
    platforms: {
      linux: { install: metric(1000), compose: metric(1000) },
      macos: { install: metric(1000), compose: metric(1000) },
      windows: { install: metric(1000), compose: metric(1000) },
    },
    acceptedRegressions: [],
    ...overrides,
  };
}

function current(platform, metrics = {}) {
  return {
    metadata: {
      capturedAt: '2026-07-03T05:00:00.000Z',
      nodeVersion: 'v22.17.1',
      bunVersion: '1.3.5',
      upstreamVersion: '1.5.0',
      hyperfineVersion: '1.20.0',
    },
    platform,
    install: metric(metrics.install || 1000),
    compose: metric(metrics.compose || 1000),
  };
}

function runCheck({ baselineValue = baseline(), currentValue = current('linux'), platform = 'linux' }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-check-perf-'));
  const baselinePath = path.join(dir, 'baseline.json');
  const currentPath = path.join(dir, 'current.json');

  try {
    fs.writeFileSync(baselinePath, JSON.stringify(baselineValue, null, 2));
    fs.writeFileSync(currentPath, JSON.stringify(currentValue, null, 2));

    const result = spawnSync('node', [
      CHECK_PERF,
      '--baseline', baselinePath,
      '--current', currentPath,
      '--platform', platform,
      '--warn-ratio', '1.10',
      '--fail-ratio', '1.25',
    ], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
    });

    return {
      status: result.status,
      output: `${result.stdout || ''}${result.stderr || ''}`,
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function acceptedRegression(overrides = {}) {
  return {
    reason: 'Reviewed temporary CI runner migration cost',
    reviewer: 'Chude',
    reviewedDate: '2026-07-03',
    ticket: 'PERF-05',
    ...overrides,
  };
}

describe('check-perf CLI', () => {
  test('passes compose ratios below or exactly at warning threshold without annotations', () => {
    for (const ratio of [1.09, 1.10]) {
      const result = runCheck({ currentValue: current('linux', { compose: Math.round(1000 * ratio) }) });

      expect(result.status).toBe(0);
      expect(result.output).toContain('linux compose');
      expect(result.output).not.toContain('::warning');
      expect(result.output).not.toContain('::error');
    }
  });

  test('warns above warning threshold but does not fail until ratio is greater than failure threshold', () => {
    const warning = runCheck({ currentValue: current('linux', { compose: 1110 }) });
    const boundary = runCheck({ currentValue: current('linux', { compose: 1250 }) });

    expect(warning.status).toBe(0);
    expect(warning.output).toContain('::warning');
    expect(warning.output).not.toContain('::error');

    expect(boundary.status).toBe(0);
    expect(boundary.output).toContain('::warning');
    expect(boundary.output).not.toContain('::error');
  });

  test('fails compose and install ratios greater than failure threshold', () => {
    const compose = runCheck({ currentValue: current('linux', { compose: 1260 }) });
    const install = runCheck({ currentValue: current('linux', { install: 1260 }) });

    expect(compose.status).toBe(1);
    expect(compose.output).toContain('::error');
    expect(compose.output).toContain('linux compose');

    expect(install.status).toBe(1);
    expect(install.output).toContain('::error');
    expect(install.output).toContain('linux install');
  });

  test('fails with an actionable message when the baseline lacks the selected platform', () => {
    const missingWindows = baseline();
    delete missingWindows.platforms.windows;

    const result = runCheck({
      baselineValue: missingWindows,
      currentValue: current('windows', { compose: 1260 }),
      platform: 'windows',
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain('Missing baseline for platform');
  });

  test('accepts reviewed regressions only for matching platform plus metric or explicit global scope', () => {
    const targeted = runCheck({
      baselineValue: baseline({
        acceptedRegressions: [acceptedRegression({ platform: 'linux', metric: 'compose' })],
      }),
      currentValue: current('linux', { compose: 1260 }),
    });
    const untargeted = runCheck({
      baselineValue: baseline({
        acceptedRegressions: [acceptedRegression()],
      }),
      currentValue: current('linux', { compose: 1260 }),
    });
    const globalScope = runCheck({
      baselineValue: baseline({
        acceptedRegressions: [acceptedRegression({ scope: 'global' })],
      }),
      currentValue: current('linux', { install: 1260 }),
    });

    expect(targeted.status).toBe(0);
    expect(targeted.output).toContain('acceptedRegressions');
    expect(targeted.output).not.toContain('::error');

    expect(untargeted.status).toBe(1);
    expect(untargeted.output).toContain('acceptedRegressions');

    expect(globalScope.status).toBe(0);
    expect(globalScope.output).toContain('acceptedRegressions');
    expect(globalScope.output).not.toContain('::error');
  });
});
