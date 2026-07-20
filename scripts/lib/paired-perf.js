'use strict';

const WARNING_RATIO = 1.10;
const FAILURE_RATIO = 1.25;

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

function mean(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
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

function summarizeMetric(pairs) {
  const referenceDurations = pairs.map(pair => sampleFor(pair, 'reference').durationNs);
  const candidateDurations = pairs.map(pair => sampleFor(pair, 'candidate').durationNs);
  const pairRatios = pairs.map((pair) => (
    sampleFor(pair, 'candidate').durationNs / sampleFor(pair, 'reference').durationNs
  ));
  const referenceMeanNs = mean(referenceDurations);
  const candidateMeanNs = mean(candidateDurations);
  const ratio = candidateMeanNs / referenceMeanNs;

  return {
    referenceMeanNs,
    candidateMeanNs,
    ratio,
    status: statusForRatio(ratio),
    diagnostics: {
      pairRatios,
      medianPairRatio: median(pairRatios),
      meanAbsoluteDeltaNs: mean(pairs.map((pair) => Math.abs(
        sampleFor(pair, 'candidate').durationNs - sampleFor(pair, 'reference').durationNs
      ))),
      abCandidateMeanNs: mean(pairs
        .filter(pair => pair.order === 'AB')
        .map(pair => sampleFor(pair, 'candidate').durationNs)),
      baCandidateMeanNs: mean(pairs
        .filter(pair => pair.order === 'BA')
        .map(pair => sampleFor(pair, 'candidate').durationNs)),
    },
  };
}

module.exports = {
  FAILURE_RATIO,
  WARNING_RATIO,
  buildSchedule,
  statusForRatio,
  summarizeMetric,
};
