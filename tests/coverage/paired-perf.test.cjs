'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  FAILURE_RATIO,
  WARNING_RATIO,
  adjudicatePairedComparison,
  buildSchedule,
  canonicalSha256,
  capturePairedComparison,
  statusForRatio,
  summarizeMetric,
  validateComparisonSemantics,
} = require('../../scripts/lib/paired-perf');
const {
  captureFixture,
  pairedSpec,
  receiptFor,
} = require('../helpers/paired-perf-fixture');

function expectError(action, pattern) {
  assert.throws(action, pattern);
}

function rebindPolicy(comparison) {
  comparison.controls.policySha256 = canonicalSha256(comparison.policy);
  const { sha256: ignored, ...controls } = comparison.controls;
  void ignored;
  comparison.controls.sha256 = canonicalSha256(controls);
}

function rebindSubject(subject) {
  const { sha256: ignored, ...payload } = subject;
  void ignored;
  subject.sha256 = canonicalSha256(payload);
}

test('derives deterministic schedules, hashes, summaries, and strict statuses', () => {
  assert.equal(canonicalSha256({ b: 2, a: 1 }), canonicalSha256({ a: 1, b: 2 }));
  assert.notEqual(canonicalSha256([1, 2]), canonicalSha256([2, 1]));
  assert.deepEqual(buildSchedule('00'.padEnd(64, '0'), 4), ['AB', 'BA', 'AB', 'BA']);
  assert.deepEqual(buildSchedule('ff'.padEnd(64, '0'), 3), ['BA', 'AB', 'BA']);
  expectError(() => buildSchedule('invalid', 3), /scheduler seed/);
  expectError(() => buildSchedule('00'.padEnd(64, '0'), 0), /pair count/);
  expectError(() => buildSchedule('00'.padEnd(64, '0'), 1.5), /pair count/);

  assert.equal(statusForRatio(WARNING_RATIO), 'pass');
  assert.equal(statusForRatio(WARNING_RATIO + 0.01), 'warn');
  assert.equal(statusForRatio(FAILURE_RATIO), 'warn');
  assert.equal(statusForRatio(FAILURE_RATIO + 0.01), 'fail');

  const pairs = [
    { order: 'AB', samples: [{ subject: 'reference', durationNs: 100 }, { subject: 'candidate', durationNs: 110 }] },
    { order: 'BA', samples: [{ subject: 'candidate', durationNs: 120 }, { subject: 'reference', durationNs: 100 }] },
    { order: 'AB', samples: [{ subject: 'reference', durationNs: 100 }, { subject: 'candidate', durationNs: 130 }] },
  ];
  const summary = summarizeMetric(pairs);
  assert.equal(summary.referenceMeanNs, 100);
  assert.equal(summary.candidateMeanNs, 120);
  assert.equal(summary.ratio, 1.2);
  assert.equal(summary.diagnostics.medianPairRatio, 1.2);
  assert.ok(Math.abs(summary.diagnostics.pairRatioMad - 0.1) < Number.EPSILON);
  assert.equal(summary.diagnostics.abCandidateMeanNs, 120);
  assert.equal(summary.diagnostics.baCandidateMeanNs, 120);
});

test('uses exact aggregate status arithmetic and independent warmup alternation', () => {
  const referenceDurations = Array(10).fill(7_000_000_000_000_000);
  const candidateDurations = Array(10).fill(8_750_000_000_000_000);
  candidateDurations[9] += 1;
  const pairs = referenceDurations.map((durationNs, index) => ({
    order: index % 2 === 0 ? 'AB' : 'BA',
    samples: [
      { subject: 'reference', durationNs },
      { subject: 'candidate', durationNs: candidateDurations[index] },
    ],
  }));
  assert.equal(summarizeMetric(pairs).status, 'fail');

  const comparison = capturePairedComparison(
    pairedSpec({ measuredPairs: 11, warmupRuns: 12 }),
    request => receiptFor(request)
  );
  const observed = comparison.metrics.install.warmups.map(warmup => (
    warmup.samples.at(0).subject === 'reference' ? 'AB' : 'BA'
  ));
  assert.deepEqual(observed, buildSchedule(comparison.policy.seed, 12));
});

test('captures complete evidence and rejects invalid capture inputs', () => {
  const comparison = captureFixture();
  assert.equal(comparison.verdict, 'pass');
  assert.deepEqual(adjudicatePairedComparison(comparison), {
    metrics: {
      install: comparison.metrics.install.summary,
      compose: comparison.metrics.compose.summary,
    },
    verdict: 'pass',
  });

  expectError(() => capturePairedComparison(pairedSpec(), null), /executor/);
  const duplicate = pairedSpec();
  duplicate.subjects.candidate.commit = duplicate.subjects.reference.commit;
  expectError(() => capturePairedComparison(duplicate, () => {}), /distinct commits/);
  expectError(() => capturePairedComparison(pairedSpec({ measuredPairs: 9 }), () => {}), /at least 10/);
  expectError(() => capturePairedComparison(pairedSpec({ measuredPairs: 10.5 }), () => {}), /at least 10/);
  expectError(() => capturePairedComparison(pairedSpec({ warmupRuns: 0 }), () => {}), /at least 1/);
  expectError(() => capturePairedComparison(pairedSpec({ warmupRuns: 1.5 }), () => {}), /at least 1/);
});

test('aborts capture on every invalid sample receipt class', () => {
  const mutations = [
    () => null,
    () => [],
    (request) => {
      const receipt = receiptFor(request);
      delete receipt.durationNs;
      return receipt;
    },
    request => receiptFor(request, { subject: request.subject === 'reference' ? 'candidate' : 'reference' }),
    request => receiptFor(request, { executionIdentitySha256: 'f'.repeat(64) }),
    request => receiptFor(request, { resolvedCommit: 'f'.repeat(40) }),
    request => receiptFor(request, { dirty: true }),
    request => receiptFor(request, { preparationExitCode: 1 }),
    request => receiptFor(request, { benchmarkExitCode: 1 }),
    request => receiptFor(request, { durationNs: 0 }),
    request => receiptFor(request, { durationNs: 1.5 }),
    request => receiptFor(request, { controlsBeforeSha256: 'f'.repeat(64) }),
    request => receiptFor(request, { controlsAfterSha256: 'f'.repeat(64) }),
    request => receiptFor(request, { subjectBeforeSha256: 'f'.repeat(64) }),
    request => receiptFor(request, { subjectAfterSha256: 'f'.repeat(64) }),
  ];

  for (const mutate of mutations) {
    expectError(() => capturePairedComparison(pairedSpec(), mutate), /sample|receipt|controls|subject/);
  }
});

test('rejects all semantic provenance, schedule, and derivative tampering', () => {
  const cases = [
    [comparison => { comparison.executionIdentity.cpu = 'changed'; }, /execution identity digest/],
    [comparison => {
      comparison.executionIdentity.runnerImageExpected = 'different-image';
      const { sha256: ignored, ...identity } = comparison.executionIdentity;
      void ignored;
      comparison.executionIdentity.sha256 = canonicalSha256(identity);
    }, /observed runner image/],
    [comparison => { comparison.subjects.reference.lockSha256 = 'f'.repeat(64); }, /reference subject digest/],
    [comparison => { comparison.subjects.candidate.lockSha256 = 'f'.repeat(64); }, /candidate subject digest/],
    [comparison => {
      comparison.subjects.candidate.commit = comparison.subjects.reference.commit;
      rebindSubject(comparison.subjects.candidate);
    }, /distinct commits/],
    [comparison => { comparison.policy.seed = 'f'.repeat(64); }, /policy seed/],
    [comparison => {
      comparison.policy.scheduler = 'other';
      rebindPolicy(comparison);
    }, /fixed authority/],
    [comparison => {
      comparison.policy.warningRatio = 9;
      rebindPolicy(comparison);
    }, /fixed authority/],
    [comparison => {
      comparison.policy.failureRatio = 9;
      rebindPolicy(comparison);
    }, /fixed authority/],
    [comparison => {
      comparison.policy.measuredPairs = 9;
      rebindPolicy(comparison);
    }, /invalid run counts/],
    [comparison => {
      comparison.policy.warmupRuns = 0;
      rebindPolicy(comparison);
    }, /invalid run counts/],
    [comparison => { comparison.controls.policySha256 = 'f'.repeat(64); }, /policy digest/],
    [comparison => { comparison.controls.sha256 = 'f'.repeat(64); }, /controls digest/],
    [comparison => { comparison.metrics.install.warmups = []; }, /warmup count/],
    [comparison => { comparison.metrics.compose.pairs.pop(); }, /pair count/],
    [comparison => { comparison.metrics.install.warmups[0].index = 2; }, /warmup indices/],
    [comparison => { comparison.metrics.install.pairs[0].index = 2; }, /pair indices/],
    [comparison => {
      comparison.metrics.install.pairs[0].order = comparison.metrics.install.pairs[0].order === 'AB' ? 'BA' : 'AB';
    }, /deterministic schedule/],
    [comparison => { comparison.metrics.compose.pairs[0].samples.reverse(); }, /sample order/],
    [comparison => { comparison.metrics.install.pairs[0].samples[0].dirty = true; }, /worktree must be clean/],
    [comparison => { comparison.metrics.install.summary.ratio = 9; }, /stored install summary/],
    [comparison => { comparison.metrics.compose.summary.ratio = 9; }, /stored compose summary/],
    [comparison => { comparison.verdict = 'fail'; }, /stored verdict/],
  ];

  for (const [mutate, pattern] of cases) {
    const comparison = captureFixture();
    mutate(comparison);
    expectError(() => adjudicatePairedComparison(comparison), pattern);
  }

  assert.doesNotThrow(() => validateComparisonSemantics(captureFixture()));
});
