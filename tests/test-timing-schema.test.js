'use strict';

const { describe, test, expect } = require('bun:test');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const SCHEMA_PATH = path.join(__dirname, '..', 'config', 'test-timing.schema.json');

function compileSchema() {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

function metric(overrides = {}) {
  return {
    mean_ms: 3000,
    stddev_ms: 100,
    min_ms: 2900,
    max_ms: 3150,
    samples: 5,
    ...overrides,
  };
}

function platformTiming() {
  return {
    total: metric(),
    files: {
      'tests/example.test.js': metric({ mean_ms: 120, stddev_ms: 4, min_ms: 116, max_ms: 128 }),
    },
  };
}

function validTiming(overrides = {}) {
  return {
    metadata: {
      capturedAt: '2026-07-01T16:30:00.000Z',
      nodeVersion: 'v22.17.1',
      bunVersion: '1.3.5',
      upstreamVersion: '1.5.0',
      runs: 5,
    },
    platforms: {
      linux: platformTiming(),
      macos: platformTiming(),
      windows: platformTiming(),
    },
    ...overrides,
  };
}

function partialTiming() {
  return {
    metadata: {
      capturedAt: '2026-07-01T16:30:00.000Z',
      nodeVersion: 'v22.17.1',
      bunVersion: '1.3.5',
      upstreamVersion: '1.5.0',
      runs: 1,
      partial: true,
    },
    platform: 'local',
    total: metric({ samples: 1 }),
    files: {
      'tests/example.test.js': metric({ mean_ms: 120, stddev_ms: 0, min_ms: 120, max_ms: 120, samples: 1 }),
    },
  };
}

describe('test-timing schema', () => {
  test('accepts the committed three-platform timing shape', () => {
    const validate = compileSchema();

    expect(validate(validTiming())).toBe(true);
  });

  test('rejects an extra top-level property', () => {
    const validate = compileSchema();

    expect(validate(validTiming({ unexpected: true }))).toBe(false);
    expect(JSON.stringify(validate.errors)).toContain('additional');
  });

  test('rejects a missing windows platform', () => {
    const validate = compileSchema();
    const timing = validTiming();
    delete timing.platforms.windows;

    expect(validate(timing)).toBe(false);
    expect(JSON.stringify(validate.errors)).toContain('windows');
  });

  test('rejects partial local timing as the committed merged artifact', () => {
    const validate = compileSchema();

    expect(validate(partialTiming())).toBe(false);
    expect(JSON.stringify(validate.errors)).toContain('platforms');
  });
});
