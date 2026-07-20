'use strict';

const { describe, test, expect } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  adjudicatePairedComparison,
  canonicalSha256,
  summarizeMetric,
} = require('../scripts/lib/paired-perf');
const { captureFixture } = require('./helpers/paired-perf-fixture');

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

function runPairedCheck(comparisonValue, extraArgs = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-check-paired-perf-'));
  const comparisonPath = path.join(dir, 'comparison.json');

  try {
    fs.writeFileSync(comparisonPath, JSON.stringify(comparisonValue, null, 2));
    const result = spawnSync('node', [CHECK_PERF, '--comparison', comparisonPath, ...extraArgs], {
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

function pairedSamples(referenceDurations, candidateDurations) {
  return referenceDurations.map((referenceDuration, index) => {
    const order = index % 2 === 0 ? 'AB' : 'BA';
    const reference = { subject: 'reference', durationNs: referenceDuration };
    const candidate = { subject: 'candidate', durationNs: candidateDurations[index] };
    return {
      index,
      order,
      samples: order === 'AB' ? [reference, candidate] : [candidate, reference],
    };
  });
}

describe('paired performance adjudication', () => {
  test('derives the blocking ratio and diagnostics only from raw paired samples', () => {
    const pairs = pairedSamples(
      Array.from({ length: 10 }, (_, index) => 100 + index),
      Array.from({ length: 10 }, (_, index) => 105 + index)
    );

    expect(summarizeMetric(pairs)).toEqual({
      referenceMeanNs: 104.5,
      candidateMeanNs: 109.5,
      ratio: 109.5 / 104.5,
      status: 'pass',
      diagnostics: {
        pairRatios: pairs.map((pair) => {
          const reference = pair.samples.find(sample => sample.subject === 'reference');
          const candidate = pair.samples.find(sample => sample.subject === 'candidate');
          return candidate.durationNs / reference.durationNs;
        }),
        medianPairRatio: (109 / 104 + 110 / 105) / 2,
        meanAbsoluteDeltaNs: 5,
        abCandidateMeanNs: 109,
        baCandidateMeanNs: 110,
      },
    });
  });

  test('rejects stored summaries or verdicts that differ from raw-sample recomputation', () => {
    const comparison = captureFixture();
    expect(adjudicatePairedComparison(comparison)).toEqual({
      metrics: {
        install: comparison.metrics.install.summary,
        compose: comparison.metrics.compose.summary,
      },
      verdict: 'pass',
    });

    const tamperedSummary = structuredClone(comparison);
    tamperedSummary.metrics.install.summary.ratio = 1.26;
    expect(() => adjudicatePairedComparison(tamperedSummary)).toThrow(/stored install summary/);

    const tamperedVerdict = structuredClone(comparison);
    tamperedVerdict.verdict = 'fail';
    expect(() => adjudicatePairedComparison(tamperedVerdict)).toThrow(/stored verdict/);
  });

  test('rejects provenance, schedule, commit, and receipt tampering', () => {
    const comparison = captureFixture();

    const identity = structuredClone(comparison);
    identity.executionIdentity.cpu = 'different-cpu';
    expect(() => adjudicatePairedComparison(identity)).toThrow(/execution identity digest/);

    const schedule = structuredClone(comparison);
    schedule.metrics.install.pairs[0].order = schedule.metrics.install.pairs[0].order === 'AB' ? 'BA' : 'AB';
    expect(() => adjudicatePairedComparison(schedule)).toThrow(/schedule/);

    const receipt = structuredClone(comparison);
    receipt.metrics.compose.pairs[0].samples[0].controlsAfterSha256 = 'f'.repeat(64);
    expect(() => adjudicatePairedComparison(receipt)).toThrow(/controls changed/);

    const duplicateCommit = structuredClone(comparison);
    duplicateCommit.subjects.candidate.commit = duplicateCommit.subjects.reference.commit;
    const { sha256: ignored, ...candidate } = duplicateCommit.subjects.candidate;
    void ignored;
    duplicateCommit.subjects.candidate.sha256 = canonicalSha256(candidate);
    expect(() => adjudicatePairedComparison(duplicateCommit)).toThrow(/distinct commits/);
  });
});

describe('check-perf CLI', () => {
  test('uses validated paired evidence as the strict blocking verdict', () => {
    const pass = runPairedCheck(captureFixture({ candidateDurationNs: 110_000_000 }));
    const warning = runPairedCheck(captureFixture({ candidateDurationNs: 111_000_000 }));
    const boundary = runPairedCheck(captureFixture({ candidateDurationNs: 125_000_000 }));
    const failure = runPairedCheck(captureFixture({ candidateDurationNs: 126_000_000 }));

    expect(pass.status).toBe(0);
    expect(pass.output).not.toContain('::warning');
    expect(warning.status).toBe(0);
    expect(warning.output).toContain('::warning');
    expect(boundary.status).toBe(0);
    expect(boundary.output).toContain('::warning');
    expect(failure.status).toBe(1);
    expect(failure.output).toContain('::error');
  });

  test('rejects mixed modes, threshold overrides, and structurally invalid paired evidence', () => {
    for (const extraArgs of [
      ['--baseline', 'historical.json'],
      ['--current', 'current.json'],
      ['--platform', 'linux'],
      ['--warn-ratio', '9'],
      ['--fail-ratio', '9'],
    ]) {
      const result = runPairedCheck(captureFixture(), extraArgs);
      expect(result.status).toBe(1);
      expect(result.output).toContain('cannot be mixed');
    }

    const invalid = captureFixture();
    invalid.acceptedRegressions = [];
    const result = runPairedCheck(invalid);
    expect(result.status).toBe(1);
    expect(result.output).toContain('Invalid paired comparison');
  });

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
