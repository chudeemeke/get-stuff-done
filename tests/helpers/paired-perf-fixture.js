'use strict';

const { capturePairedComparison } = require('../../scripts/lib/paired-perf');

const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);
const SHA_C = 'c'.repeat(64);
const SHA_D = 'd'.repeat(64);

function pairedSpec(overrides = {}) {
  return {
    capturedAt: '2026-07-20T00:00:00.000Z',
    executionIdentity: {
      platform: 'windows',
      architecture: 'x64',
      cpu: 'fixture-cpu',
      runnerImage: 'fixture-image',
      nodeVersion: 'v22.17.1',
      bunVersion: '1.3.5',
      hyperfineVersion: '1.20.0',
    },
    controls: {
      harnessSha256: SHA_A,
      workloadSha256: SHA_B,
      schedulerSha256: SHA_C,
      commandTemplateSha256: SHA_D,
    },
    subjects: {
      reference: {
        commit: '1'.repeat(40),
        packageSha256: SHA_A,
        lockSha256: SHA_B,
        upstreamAuthoritySha256: SHA_C,
      },
      candidate: {
        commit: '2'.repeat(40),
        packageSha256: SHA_D,
        lockSha256: SHA_C,
        upstreamAuthoritySha256: SHA_B,
      },
    },
    measuredPairs: 10,
    warmupRuns: 1,
    ...overrides,
  };
}

function receiptFor(request, overrides = {}) {
  return {
    subject: request.subject,
    executionIdentitySha256: request.executionIdentitySha256,
    resolvedCommit: request.commit,
    dirty: false,
    preparationExitCode: 0,
    benchmarkExitCode: 0,
    durationNs: request.subject === 'reference' ? 100_000_000 : 105_000_000,
    controlsBeforeSha256: request.controlsSha256,
    controlsAfterSha256: request.controlsSha256,
    subjectBeforeSha256: request.subjectSha256,
    subjectAfterSha256: request.subjectSha256,
    ...overrides,
  };
}

function captureFixture(options = {}) {
  const spec = pairedSpec(options.spec);
  return capturePairedComparison(spec, request => receiptFor(request, {
    durationNs: request.subject === 'reference'
      ? (options.referenceDurationNs || 100_000_000)
      : (options.candidateDurationNs || 105_000_000),
  }));
}

module.exports = { captureFixture, pairedSpec, receiptFor };
