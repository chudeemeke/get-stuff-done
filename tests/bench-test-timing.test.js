'use strict';

const { describe, test, expect } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  mergeTimingArtifacts,
  parseJUnitTiming,
} = require('../scripts/bench-test-timing');

const JUNIT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="2" failures="0" time="1.500">
  <testsuite name="tests/alpha.test.js" tests="1" failures="0" time="0.250"></testsuite>
  <testsuite name="tests/beta.test.js" tests="1" failures="0" time="1.250"></testsuite>
</testsuites>`;

function partialTiming(platform) {
  return {
    metadata: {
      capturedAt: '2026-07-01T16:30:00.000Z',
      nodeVersion: 'v22.17.1',
      bunVersion: '1.3.5',
      upstreamVersion: '1.5.0',
      runs: 1,
      partial: true,
    },
    platform,
    total: { mean_ms: 1500, stddev_ms: 0, min_ms: 1500, max_ms: 1500, samples: 1 },
    files: {
      'tests/alpha.test.js': { mean_ms: 250, stddev_ms: 0, min_ms: 250, max_ms: 250, samples: 1 },
      'tests/beta.test.js': { mean_ms: 1250, stddev_ms: 0, min_ms: 1250, max_ms: 1250, samples: 1 },
    },
  };
}

describe('bench-test-timing JUnit parsing', () => {
  test('parses per-file and total durations from Bun JUnit XML', () => {
    const parsed = parseJUnitTiming(JUNIT_XML);

    expect(parsed.total_ms).toBe(1500);
    expect(parsed.files['tests/alpha.test.js']).toBe(250);
    expect(parsed.files['tests/beta.test.js']).toBe(1250);
  });
});

describe('bench-test-timing merge', () => {
  test('fails when a required platform artifact is missing', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-timing-merge-'));

    try {
      fs.writeFileSync(path.join(dir, 'test-timing-linux.json'), JSON.stringify(partialTiming('linux')));
      fs.writeFileSync(path.join(dir, 'test-timing-macos.json'), JSON.stringify(partialTiming('macos')));

      expect(() =>
        mergeTimingArtifacts(dir, ['linux', 'macos', 'windows'])
      ).toThrow(/Missing required platform artifact: windows/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('merges required platform artifacts into committed timing shape', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-timing-merge-'));

    try {
      for (const platform of ['linux', 'macos', 'windows']) {
        fs.writeFileSync(
          path.join(dir, `test-timing-${platform}.json`),
          JSON.stringify(partialTiming(platform))
        );
      }

      const merged = mergeTimingArtifacts(dir, ['linux', 'macos', 'windows']);

      expect(Object.keys(merged.platforms).sort()).toEqual(['linux', 'macos', 'windows']);
      expect(merged.platforms.windows.files['tests/beta.test.js'].mean_ms).toBe(1250);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
