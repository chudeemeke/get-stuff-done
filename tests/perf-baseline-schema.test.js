'use strict';

const { describe, test, expect } = require('bun:test');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const SCHEMA_PATH = path.join(__dirname, '..', 'config', 'perf-baseline.schema.json');

function compileSchema() {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

function metric(overrides = {}) {
  return {
    mean_ms: 1000,
    stddev_ms: 25,
    min_ms: 970,
    max_ms: 1040,
    samples: 5,
    ...overrides,
  };
}

function platformMetrics() {
  return {
    install: metric(),
    compose: metric({ mean_ms: 500, stddev_ms: 10, min_ms: 490, max_ms: 515 }),
  };
}

function validBaseline(overrides = {}) {
  return {
    metadata: {
      capturedAt: '2026-07-01T16:30:00.000Z',
      nodeVersion: 'v22.17.1',
      bunVersion: '1.3.5',
      upstreamVersion: '1.5.0',
      hyperfineVersion: '1.20.0',
    },
    platforms: {
      linux: platformMetrics(),
      macos: platformMetrics(),
      windows: platformMetrics(),
    },
    acceptedRegressions: [],
    ...overrides,
  };
}

describe('perf-baseline schema', () => {
  test('accepts the committed three-platform baseline shape', () => {
    const validate = compileSchema();

    expect(validate(validBaseline())).toBe(true);
  });

  test('rejects an extra top-level property', () => {
    const validate = compileSchema();

    expect(validate(validBaseline({ unexpected: true }))).toBe(false);
    expect(JSON.stringify(validate.errors)).toContain('additional');
  });

  test('rejects a missing windows platform', () => {
    const validate = compileSchema();
    const baseline = validBaseline();
    delete baseline.platforms.windows;

    expect(validate(baseline)).toBe(false);
    expect(JSON.stringify(validate.errors)).toContain('windows');
  });

  test('rejects an install metric missing samples', () => {
    const validate = compileSchema();
    const baseline = validBaseline();
    delete baseline.platforms.linux.install.samples;

    expect(validate(baseline)).toBe(false);
    expect(JSON.stringify(validate.errors)).toContain('samples');
  });

  test('accepts an accepted regression scoped to platform and metric', () => {
    const validate = compileSchema();
    const baseline = validBaseline({
      acceptedRegressions: [{
        reason: 'Reviewed Linux compose runner migration',
        reviewer: 'Chude',
        reviewedDate: '2026-07-03',
        ticket: 'PERF-05',
        platform: 'linux',
        metric: 'compose',
      }],
    });

    expect(validate(baseline)).toBe(true);
  });

  test('accepts an accepted regression with explicit global scope', () => {
    const validate = compileSchema();
    const baseline = validBaseline({
      acceptedRegressions: [{
        reason: 'Reviewed temporary platform-wide runner migration',
        reviewer: 'Chude',
        reviewedDate: '2026-07-03',
        ticket: 'PERF-05',
        scope: 'global',
      }],
    });

    expect(validate(baseline)).toBe(true);
  });

  test('rejects accepted regressions without target fields or required review metadata', () => {
    const validate = compileSchema();

    expect(validate(validBaseline({
      acceptedRegressions: [{
        reason: 'Missing target',
        reviewer: 'Chude',
        reviewedDate: '2026-07-03',
        ticket: 'PERF-05',
      }],
    }))).toBe(false);

    expect(validate(validBaseline({
      acceptedRegressions: [{
        reviewer: 'Chude',
        reviewedDate: '2026-07-03',
        ticket: 'PERF-05',
        platform: 'linux',
        metric: 'compose',
      }],
    }))).toBe(false);
  });
});
