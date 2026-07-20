'use strict';

const crypto = require('crypto');

const WARNING_RATIO = 1.10;
const FAILURE_RATIO = 1.25;
const WARNING_FRACTION = { numerator: 11n, denominator: 10n };
const FAILURE_FRACTION = { numerator: 5n, denominator: 4n };
const SCHEDULER = 'alternating-ab-ba-v1';
const METRICS = ['install', 'compose'];
const PLACEHOLDER_IDENTITIES = new Set(['unknown', 'unavailable', 'n/a']);
const SAMPLE_FIELDS = [
  'benchmarkExitCode',
  'controlsAfterSha256',
  'controlsBeforeSha256',
  'dirty',
  'durationNs',
  'executionIdentitySha256',
  'preparationExitCode',
  'resolvedCommit',
  'subject',
  'subjectAfterSha256',
  'subjectBeforeSha256',
];

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalize(child)])
  );
}

function canonicalSha256(value) {
  return crypto.createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

function sameValue(left, right) {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

function bindDigest(value) {
  return { ...value, sha256: canonicalSha256(value) };
}

function assertExecutionIdentity(identity) {
  const fields = [
    ['platform', identity.platform],
    ['architecture', identity.architecture],
    ['cpu', identity.cpu],
    ['runnerImage', identity.runnerImage],
    ['runnerImageExpected', identity.runnerImageExpected],
    ['nodeVersion', identity.nodeVersion],
    ['bunVersion', identity.bunVersion],
    ['hyperfineVersion', identity.hyperfineVersion],
  ];
  for (const [field, value] of fields) {
    if (typeof value !== 'string' || value !== value.trim() ||
        !value || PLACEHOLDER_IDENTITIES.has(value.toLowerCase())) {
      throw new Error(`execution identity ${field} must be a normalized non-placeholder value`);
    }
  }
  if (identity.runnerImage !== identity.runnerImageExpected) {
    throw new Error('observed runner image does not match expected runner image');
  }
}

function buildSchedule(seed, pairCount) {
  if (!/^[a-f0-9]{64}$/.test(seed)) {
    throw new Error('scheduler seed must be a lowercase SHA-256 digest');
  }
  if (!Number.isInteger(pairCount) || pairCount < 1) {
    throw new Error('pair count must be a positive integer');
  }

  const firstOrder = Number.parseInt(seed.slice(0, 2), 16) % 2 === 0 ? 'AB' : 'BA';
  return Array.from({ length: pairCount }, (_, index) => (
    index % 2 === 0
      ? firstOrder
      : firstOrder === 'AB' ? 'BA' : 'AB'
  ));
}

function deriveSeed(controls, subjects) {
  return canonicalSha256({ controls, subjects });
}

function integerTotal(values) {
  return values.reduce((total, value) => total + BigInt(value), 0n);
}

function integerMean(values) {
  return Number(integerTotal(values)) / values.length;
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted.at(midpoint - 1) + sorted.at(midpoint)) / 2
    : sorted.at(midpoint);
}

function sampleFor(pair, subject) {
  return pair.samples.find(sample => sample.subject === subject);
}

function statusForRatio(ratio) {
  if (ratio > FAILURE_RATIO) return 'fail';
  if (ratio > WARNING_RATIO) return 'warn';
  return 'pass';
}

function exceedsFraction(candidateTotal, referenceTotal, fraction) {
  return candidateTotal * fraction.denominator > referenceTotal * fraction.numerator;
}

function statusForTotals(referenceTotal, candidateTotal) {
  if (exceedsFraction(candidateTotal, referenceTotal, FAILURE_FRACTION)) return 'fail';
  if (exceedsFraction(candidateTotal, referenceTotal, WARNING_FRACTION)) return 'warn';
  return 'pass';
}

function summarizeMetric(pairs) {
  const referenceDurations = pairs.map(pair => sampleFor(pair, 'reference').durationNs);
  const candidateDurations = pairs.map(pair => sampleFor(pair, 'candidate').durationNs);
  const pairRatios = pairs.map((pair) => (
    sampleFor(pair, 'candidate').durationNs / sampleFor(pair, 'reference').durationNs
  ));
  const referenceTotal = integerTotal(referenceDurations);
  const candidateTotal = integerTotal(candidateDurations);
  const referenceMeanNs = Number(referenceTotal) / referenceDurations.length;
  const candidateMeanNs = Number(candidateTotal) / candidateDurations.length;
  const ratio = Number(candidateTotal) / Number(referenceTotal);
  const medianPairRatio = median(pairRatios);
  const absoluteDeltas = pairs.map((pair) => {
    const candidate = BigInt(sampleFor(pair, 'candidate').durationNs);
    const reference = BigInt(sampleFor(pair, 'reference').durationNs);
    return candidate >= reference ? candidate - reference : reference - candidate;
  });

  return {
    referenceMeanNs,
    candidateMeanNs,
    ratio,
    status: statusForTotals(referenceTotal, candidateTotal),
    diagnostics: {
      pairRatios,
      medianPairRatio,
      pairRatioMad: median(pairRatios.map(value => Math.abs(value - medianPairRatio))),
      meanAbsoluteDeltaNs: Number(integerTotal(absoluteDeltas)) / absoluteDeltas.length,
      abCandidateMeanNs: integerMean(pairs
        .filter(pair => pair.order === 'AB')
        .map(pair => sampleFor(pair, 'candidate').durationNs)),
      baCandidateMeanNs: integerMean(pairs
        .filter(pair => pair.order === 'BA')
        .map(pair => sampleFor(pair, 'candidate').durationNs)),
    },
  };
}

function assertCaptureSpec(spec, execute) {
  if (typeof execute !== 'function') throw new Error('benchmark executor must be a function');
  assertExecutionIdentity(spec.executionIdentity);
  if (spec.subjects.reference.commit === spec.subjects.candidate.commit) {
    throw new Error('reference and candidate must resolve to distinct commits');
  }
  if (!Number.isInteger(spec.measuredPairs) || spec.measuredPairs < 10) {
    throw new Error('measuredPairs must be at least 10');
  }
  if (!Number.isInteger(spec.warmupRuns) || spec.warmupRuns < 1) {
    throw new Error('warmupRuns must be at least 1');
  }
}

function assertSampleReceipt(sample, request) {
  if (!sample || typeof sample !== 'object' || Array.isArray(sample)) {
    throw new Error(`${request.metric} ${request.phase} ${request.index} returned no sample receipt`);
  }
  if (JSON.stringify(Object.keys(sample).sort()) !== JSON.stringify(SAMPLE_FIELDS)) {
    throw new Error(`${request.metric} ${request.phase} ${request.index} returned an incomplete sample receipt`);
  }
  if (sample.subject !== request.subject) throw new Error('sample subject does not match the scheduled subject');
  if (sample.executionIdentitySha256 !== request.executionIdentitySha256) {
    throw new Error('sample execution identity does not match the comparison identity');
  }
  if (sample.resolvedCommit !== request.commit) throw new Error('sample resolved commit does not match the subject');
  if (sample.dirty !== false) throw new Error('sample worktree must be clean');
  if (sample.preparationExitCode !== 0) throw new Error('sample preparation failed');
  if (sample.benchmarkExitCode !== 0) throw new Error('sample benchmark failed');
  if (!Number.isSafeInteger(sample.durationNs) || sample.durationNs <= 0) {
    throw new Error('sample durationNs must be a positive safe integer');
  }
  if (sample.controlsBeforeSha256 !== request.controlsSha256 ||
      sample.controlsAfterSha256 !== request.controlsSha256) {
    throw new Error('sample controls changed or do not match the comparison controls');
  }
  if (sample.subjectBeforeSha256 !== request.subjectSha256 ||
      sample.subjectAfterSha256 !== request.subjectSha256) {
    throw new Error('sample subject changed or does not match the comparison subject');
  }
}

function subjectsForOrder(order) {
  return order === 'AB' ? ['reference', 'candidate'] : ['candidate', 'reference'];
}

function executePair({ metric, phase, index, order, executionIdentity, controls, subjects, execute }) {
  const samples = subjectsForOrder(order).map(subject => {
    const boundSubject = subject === 'reference' ? subjects.reference : subjects.candidate;
    const request = {
      metric,
      phase,
      index,
      order,
      subject,
      executionIdentitySha256: executionIdentity.sha256,
      controlsSha256: controls.sha256,
      subjectSha256: boundSubject.sha256,
      commit: boundSubject.commit,
    };
    const sample = execute(request);
    assertSampleReceipt(sample, request);
    return sample;
  });
  return samples;
}

function captureMetric(metric, context) {
  const schedule = buildSchedule(context.policy.seed, context.policy.measuredPairs);
  const warmupSchedule = buildSchedule(context.policy.seed, context.policy.warmupRuns);
  const warmups = Array.from({ length: context.policy.warmupRuns }, (_, index) => ({
    index,
    samples: executePair({
      ...context,
      metric,
      phase: 'warmup',
      index,
      order: warmupSchedule.at(index),
    }),
  }));
  const pairs = schedule.map((order, index) => ({
    index,
    order,
    samples: executePair({ ...context, metric, phase: 'measure', index, order }),
  }));
  return { warmups, pairs, summary: summarizeMetric(pairs) };
}

function aggregateVerdict(metrics) {
  const statuses = [metrics.install.summary.status, metrics.compose.summary.status];
  if (statuses.includes('fail')) return 'fail';
  if (statuses.includes('warn')) return 'warn';
  return 'pass';
}

function capturePairedComparison(spec, execute) {
  assertCaptureSpec(spec, execute);
  const executionIdentity = bindDigest(spec.executionIdentity);
  const subjects = {
    reference: bindDigest(spec.subjects.reference),
    candidate: bindDigest(spec.subjects.candidate),
  };
  const seed = deriveSeed(spec.controls, spec.subjects);
  const policy = {
    measuredPairs: spec.measuredPairs,
    warmupRuns: spec.warmupRuns,
    warningRatio: WARNING_RATIO,
    failureRatio: FAILURE_RATIO,
    scheduler: SCHEDULER,
    seed,
  };
  const controls = bindDigest({
    ...spec.controls,
    policySha256: canonicalSha256(policy),
  });
  const context = { executionIdentity, controls, policy, subjects, execute };
  const metrics = Object.fromEntries(METRICS.map(metric => [metric, captureMetric(metric, context)]));

  const comparison = {
    schemaVersion: 1,
    authority: 'paired-blocking',
    capturedAt: spec.capturedAt,
    executionIdentity,
    controls,
    policy,
    subjects,
    metrics,
    verdict: aggregateVerdict(metrics),
  };
  validateComparisonSemantics(comparison);
  return comparison;
}

function splitDigest(value) {
  const { sha256, ...payload } = value;
  return { sha256, payload };
}

function assertDigest(label, value) {
  const { sha256, payload } = splitDigest(value);
  if (sha256 !== canonicalSha256(payload)) {
    throw new Error(`${label} digest does not match its recorded fields`);
  }
  return payload;
}

function validateSampleSequence(samples, order, context) {
  const expectedSubjects = subjectsForOrder(order);
  for (const [position, sample] of samples.entries()) {
    const subject = expectedSubjects.at(position);
    if (sample.subject !== subject) {
      throw new Error(`${context.metric} ${context.phase} ${context.index} sample order does not match schedule`);
    }
    const boundSubject = subject === 'reference' ? context.subjects.reference : context.subjects.candidate;
    assertSampleReceipt(sample, {
      metric: context.metric,
      phase: context.phase,
      index: context.index,
      subject,
      executionIdentitySha256: context.executionIdentity.sha256,
      controlsSha256: context.controls.sha256,
      subjectSha256: boundSubject.sha256,
      commit: boundSubject.commit,
    });
  }
}

function validateMetricSemantics(metric, evidence, context) {
  if (evidence.warmups.length !== context.policy.warmupRuns) {
    throw new Error(`${metric} warmup count does not match policy`);
  }
  if (evidence.pairs.length !== context.policy.measuredPairs) {
    throw new Error(`${metric} pair count does not match policy`);
  }

  const schedule = buildSchedule(context.policy.seed, context.policy.measuredPairs);
  const warmupSchedule = buildSchedule(context.policy.seed, context.policy.warmupRuns);
  for (const [index, warmup] of evidence.warmups.entries()) {
    if (warmup.index !== index) throw new Error(`${metric} warmup indices must be consecutive`);
    validateSampleSequence(warmup.samples, warmupSchedule.at(index), {
      ...context,
      metric,
      phase: 'warmup',
      index,
    });
  }
  for (const [index, pair] of evidence.pairs.entries()) {
    if (pair.index !== index) throw new Error(`${metric} pair indices must be consecutive`);
    if (pair.order !== schedule.at(index)) throw new Error(`${metric} order does not match deterministic schedule`);
    validateSampleSequence(pair.samples, pair.order, {
      ...context,
      metric,
      phase: 'measure',
      index,
    });
  }
}

function validateComparisonSemantics(comparison) {
  const executionIdentity = assertDigest('execution identity', comparison.executionIdentity);
  assertExecutionIdentity(executionIdentity);
  const reference = assertDigest('reference subject', comparison.subjects.reference);
  const candidate = assertDigest('candidate subject', comparison.subjects.candidate);
  if (reference.commit === candidate.commit) {
    throw new Error('reference and candidate must resolve to distinct commits');
  }

  const { sha256: controlsSha256, policySha256, ...baseControls } = comparison.controls;
  const expectedSeed = deriveSeed(baseControls, { reference, candidate });
  if (comparison.policy.seed !== expectedSeed) throw new Error('policy seed does not match bound inputs');
  if (comparison.policy.scheduler !== SCHEDULER ||
      comparison.policy.warningRatio !== WARNING_RATIO ||
      comparison.policy.failureRatio !== FAILURE_RATIO) {
    throw new Error('paired performance policy does not match fixed authority');
  }
  if (!Number.isInteger(comparison.policy.measuredPairs) || comparison.policy.measuredPairs < 10 ||
      !Number.isInteger(comparison.policy.warmupRuns) || comparison.policy.warmupRuns < 1) {
    throw new Error('paired performance policy has invalid run counts');
  }
  if (policySha256 !== canonicalSha256(comparison.policy)) {
    throw new Error('policy digest does not match the recorded policy');
  }
  const controlsPayload = { ...baseControls, policySha256 };
  if (controlsSha256 !== canonicalSha256(controlsPayload)) {
    throw new Error('controls digest does not match its recorded fields');
  }

  const context = {
    executionIdentity: comparison.executionIdentity,
    controls: comparison.controls,
    policy: comparison.policy,
    subjects: comparison.subjects,
  };
  validateMetricSemantics('install', comparison.metrics.install, context);
  validateMetricSemantics('compose', comparison.metrics.compose, context);
}

function adjudicatePairedComparison(comparison) {
  validateComparisonSemantics(comparison);
  const metrics = {
    install: summarizeMetric(comparison.metrics.install.pairs),
    compose: summarizeMetric(comparison.metrics.compose.pairs),
  };
  if (!sameValue(comparison.metrics.install.summary, metrics.install)) {
    throw new Error('stored install summary does not match raw samples');
  }
  if (!sameValue(comparison.metrics.compose.summary, metrics.compose)) {
    throw new Error('stored compose summary does not match raw samples');
  }

  const verdict = aggregateVerdict({
    install: { summary: metrics.install },
    compose: { summary: metrics.compose },
  });
  if (comparison.verdict !== verdict) {
    throw new Error('stored verdict does not match raw samples');
  }
  return { metrics, verdict };
}

module.exports = {
  FAILURE_RATIO,
  SCHEDULER,
  WARNING_RATIO,
  adjudicatePairedComparison,
  buildSchedule,
  canonicalSha256,
  capturePairedComparison,
  statusForRatio,
  summarizeMetric,
  validateComparisonSemantics,
};
