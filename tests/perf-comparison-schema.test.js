'use strict';

const { describe, test, expect } = require('bun:test');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const SCHEMA_PATH = path.join(__dirname, '..', 'config', 'perf-comparison.schema.json');
const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);
const SHA_C = 'c'.repeat(64);
const SHA_D = 'd'.repeat(64);
const SHA_E = 'e'.repeat(64);
const SHA_F = 'f'.repeat(64);
const REFERENCE_COMMIT = '1'.repeat(40);
const CANDIDATE_COMMIT = '2'.repeat(40);

function compileSchema() {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  return new Ajv({ allErrors: true, strict: false }).compile(schema);
}

function sample(subject, durationNs) {
  const reference = subject === 'reference';
  return {
    subject,
    executionIdentitySha256: SHA_A,
    resolvedCommit: reference ? REFERENCE_COMMIT : CANDIDATE_COMMIT,
    dirty: false,
    preparationExitCode: 0,
    benchmarkExitCode: 0,
    durationNs,
    controlsBeforeSha256: SHA_B,
    controlsAfterSha256: SHA_B,
    subjectBeforeSha256: reference ? SHA_C : SHA_D,
    subjectAfterSha256: reference ? SHA_C : SHA_D,
  };
}

function metricEvidence() {
  const pairs = Array.from({ length: 10 }, (_, index) => {
    const order = index % 2 === 0 ? 'AB' : 'BA';
    const reference = sample('reference', 100_000_000 + index);
    const candidate = sample('candidate', 105_000_000 + index);
    return {
      index,
      order,
      samples: order === 'AB' ? [reference, candidate] : [candidate, reference],
    };
  });
  return {
    warmups: [{
      index: 0,
      samples: [sample('reference', 99_000_000), sample('candidate', 104_000_000)],
    }],
    pairs,
    summary: {
      referenceMeanNs: 100_000_004.5,
      candidateMeanNs: 105_000_004.5,
      ratio: 1.04999999775,
      status: 'pass',
      diagnostics: {
        pairRatios: pairs.map(() => 1.05),
        medianPairRatio: 1.05,
        meanAbsoluteDeltaNs: 5_000_000,
        abCandidateMeanNs: 105_000_004,
        baCandidateMeanNs: 105_000_005,
      },
    },
  };
}

function validComparison() {
  return {
    schemaVersion: 1,
    authority: 'paired-blocking',
    capturedAt: '2026-07-20T00:00:00.000Z',
    executionIdentity: {
      platform: 'windows',
      architecture: 'x64',
      cpu: 'fixture-cpu',
      runnerImage: 'fixture-image',
      nodeVersion: 'v22.17.1',
      bunVersion: '1.3.5',
      hyperfineVersion: '1.20.0',
      sha256: SHA_A,
    },
    controls: {
      harnessSha256: SHA_E,
      workloadSha256: SHA_F,
      schedulerSha256: SHA_C,
      commandTemplateSha256: SHA_D,
      policySha256: SHA_A,
      sha256: SHA_B,
    },
    policy: {
      measuredPairs: 10,
      warmupRuns: 1,
      warningRatio: 1.1,
      failureRatio: 1.25,
      scheduler: 'alternating-ab-ba-v1',
      seed: SHA_F,
    },
    subjects: {
      reference: {
        commit: REFERENCE_COMMIT,
        packageSha256: SHA_A,
        lockSha256: SHA_B,
        upstreamAuthoritySha256: SHA_C,
        sha256: SHA_C,
      },
      candidate: {
        commit: CANDIDATE_COMMIT,
        packageSha256: SHA_D,
        lockSha256: SHA_E,
        upstreamAuthoritySha256: SHA_F,
        sha256: SHA_D,
      },
    },
    metrics: {
      install: metricEvidence(),
      compose: metricEvidence(),
    },
    verdict: 'pass',
  };
}

describe('paired performance comparison schema', () => {
  test('accepts a complete ten-pair blocking comparison artifact', () => {
    const validate = compileSchema();
    expect(validate(validComparison())).toBe(true);
  });
});
