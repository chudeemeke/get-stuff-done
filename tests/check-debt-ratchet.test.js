'use strict';

/**
 * tests/check-debt-ratchet.test.js
 *
 * Unit tests for the ratchet gate logic (Phase 40.5 Wave 1.6 Task 1.6-04).
 *
 * Tests are pure (no child processes, no real producers). The producers
 * (check-boundary, run-upstream-compat) are exercised by their own tests
 * and at CLI invocation time. This file tests the ratchet's compare()
 * logic, baseline parsing, and threshold extraction.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { describe, test, expect, beforeEach, afterEach } = require('bun:test');

const ratchet = require('../scripts/check-debt-ratchet.cjs');

// Fixture using the production union schema:
//   - boundary stays scalar (OS-independent)
//   - compat is per-OS map (OS-dependent)
const fixtureBaseline = {
  $schema: './debt-baseline.schema.json',
  version: '2026-05-03-test',
  policy: 'ratchet',
  rationale: 'test fixture',
  thresholds: {
    boundary_violations_max: {
      value: 48,
      source_script: 'scripts/check-boundary.js',
      rationale: 'fixture',
      established: '2026-05-03',
      last_observed: '2026-05-03',
    },
    upstream_compat_diffs_max: {
      value: { linux: 132, macos: 132, windows: 133 },
      source_script: 'scripts/run-upstream-compat.js',
      rationale: 'fixture',
      established: '2026-05-03',
      last_observed: '2026-05-03',
    },
  },
};

// Legacy/scalar-only fixture for back-compat tests
const scalarFixture = {
  thresholds: {
    boundary_violations_max: { value: 48 },
    upstream_compat_diffs_max: { value: 130 },
  },
};

let tmpDir;
let tmpBaselinePath;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-test-'));
  tmpBaselinePath = path.join(tmpDir, 'debt-baseline.json');
});

afterEach(() => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* noop */
  }
});

describe('readBaseline', () => {
  test('reads and parses a valid baseline file', () => {
    fs.writeFileSync(tmpBaselinePath, JSON.stringify(fixtureBaseline));
    const result = ratchet.readBaseline(tmpBaselinePath);
    expect(result.version).toBe('2026-05-03-test');
    expect(result.thresholds.boundary_violations_max.value).toBe(48);
  });

  test('throws actionable error when file is missing', () => {
    const missing = path.join(tmpDir, 'nope.json');
    expect(() => ratchet.readBaseline(missing)).toThrow(/not found/);
  });

  test('throws when JSON is malformed', () => {
    fs.writeFileSync(tmpBaselinePath, '{ not json');
    expect(() => ratchet.readBaseline(tmpBaselinePath)).toThrow(/not valid JSON/);
  });

  test('throws when thresholds object is missing', () => {
    fs.writeFileSync(
      tmpBaselinePath,
      JSON.stringify({ version: 'x', policy: 'ratchet' })
    );
    expect(() => ratchet.readBaseline(tmpBaselinePath)).toThrow(
      /no \.thresholds object/
    );
  });
});

describe('normalisePlatform', () => {
  test('darwin maps to macos', () => {
    expect(ratchet.normalisePlatform('darwin')).toBe('macos');
  });

  test('win32 maps to windows', () => {
    expect(ratchet.normalisePlatform('win32')).toBe('windows');
  });

  test('linux passes through unchanged', () => {
    expect(ratchet.normalisePlatform('linux')).toBe('linux');
  });

  test('unknown platforms pass through unchanged (extension point)', () => {
    expect(ratchet.normalisePlatform('freebsd')).toBe('freebsd');
    expect(ratchet.normalisePlatform('sunos')).toBe('sunos');
  });
});

describe('getThreshold — scalar values (OS-independent)', () => {
  test('extracts scalar number with variant=scalar', () => {
    const result = ratchet.getThreshold(scalarFixture, 'boundary_violations_max');
    expect(result.threshold).toBe(48);
    expect(result.variant).toBe('scalar');
  });

  test('scalar value applies regardless of platform override', () => {
    const linux = ratchet.getThreshold(scalarFixture, 'boundary_violations_max', 'linux');
    const win = ratchet.getThreshold(scalarFixture, 'boundary_violations_max', 'win32');
    expect(linux.threshold).toBe(48);
    expect(win.threshold).toBe(48);
  });
});

describe('getThreshold — per-OS map values (OS-dependent)', () => {
  test('selects linux entry when platform=linux', () => {
    const result = ratchet.getThreshold(
      fixtureBaseline,
      'upstream_compat_diffs_max',
      'linux'
    );
    expect(result.threshold).toBe(132);
    expect(result.variant).toBe('linux');
  });

  test('selects macos entry when platform=darwin', () => {
    const result = ratchet.getThreshold(
      fixtureBaseline,
      'upstream_compat_diffs_max',
      'darwin'
    );
    expect(result.threshold).toBe(132);
    expect(result.variant).toBe('macos');
  });

  test('selects windows entry when platform=win32', () => {
    const result = ratchet.getThreshold(
      fixtureBaseline,
      'upstream_compat_diffs_max',
      'win32'
    );
    expect(result.threshold).toBe(133);
    expect(result.variant).toBe('windows');
  });

  test('throws actionable error when no entry exists for current OS', () => {
    expect(() =>
      ratchet.getThreshold(
        fixtureBaseline,
        'upstream_compat_diffs_max',
        'freebsd'
      )
    ).toThrow(/no entry for 'freebsd'/);
  });

  test('error message lists known OS keys', () => {
    expect(() =>
      ratchet.getThreshold(
        fixtureBaseline,
        'upstream_compat_diffs_max',
        'aix'
      )
    ).toThrow(/Known keys: linux, macos, windows/);
  });
});

describe('getThreshold — error paths', () => {
  test('throws when key is missing', () => {
    expect(() => ratchet.getThreshold(fixtureBaseline, 'nonexistent')).toThrow(
      /missing or has no \.value/
    );
  });

  test('throws when value is unsupported type (string)', () => {
    const bad = { thresholds: { foo: { value: 'forty-eight' } } };
    expect(() => ratchet.getThreshold(bad, 'foo')).toThrow(/unsupported \.value type/);
  });

  test('throws when value is unsupported type (array)', () => {
    const bad = { thresholds: { foo: { value: [1, 2, 3] } } };
    expect(() => ratchet.getThreshold(bad, 'foo')).toThrow(/unsupported \.value type/);
  });
});

describe('compare — ratchet semantics (per-OS, platform=linux)', () => {
  // Tests pin platform=linux so the compat threshold resolves to 132
  // deterministically regardless of which OS the test runs on.
  test('passes when observed counts are below thresholds', () => {
    const verdict = ratchet.compare(
      { boundary: 47, compat: 130 },
      fixtureBaseline,
      'linux'
    );
    expect(verdict.ok).toBe(true);
    expect(verdict.lines.some(l => l.includes('boundary: 47 / 48'))).toBe(true);
    expect(verdict.lines.some(l => l.includes('under by 1'))).toBe(true);
    expect(verdict.lines.some(l => l.includes('compat (linux): 130 / 132'))).toBe(true);
  });

  test('passes when observed counts equal thresholds (at-threshold)', () => {
    const verdict = ratchet.compare(
      { boundary: 48, compat: 132 },
      fixtureBaseline,
      'linux'
    );
    expect(verdict.ok).toBe(true);
    expect(verdict.lines.some(l => l.includes('at threshold'))).toBe(true);
  });

  test('fails when boundary count exceeds threshold', () => {
    const verdict = ratchet.compare(
      { boundary: 49, compat: 130 },
      fixtureBaseline,
      'linux'
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.lines.some(l => l.includes('OVER BY 1'))).toBe(true);
    expect(verdict.lines.some(l => l.includes('RATCHET BROKEN'))).toBe(true);
  });

  test('fails when compat count exceeds threshold', () => {
    const verdict = ratchet.compare(
      { boundary: 47, compat: 133 },
      fixtureBaseline,
      'linux'
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.lines.some(l => l.includes('compat (linux)') && l.includes('OVER BY 1'))).toBe(true);
  });

  test('fails when both counts exceed thresholds (reports both)', () => {
    const verdict = ratchet.compare(
      { boundary: 50, compat: 135 },
      fixtureBaseline,
      'linux'
    );
    expect(verdict.ok).toBe(false);
    const overLines = verdict.lines.filter(l => l.includes('OVER BY'));
    expect(overLines.length).toBe(2);
  });

  test('paydown is reflected in summary text (under-by message)', () => {
    const verdict = ratchet.compare(
      { boundary: 40, compat: 100 },
      fixtureBaseline,
      'linux'
    );
    expect(verdict.ok).toBe(true);
    expect(verdict.lines.some(l => l.includes('under by 8'))).toBe(true);
    expect(verdict.lines.some(l => l.includes('under by 32'))).toBe(true);
  });
});

describe('compare — windows uses higher threshold (133)', () => {
  test('count of 133 passes on windows but fails on linux', () => {
    const onWindows = ratchet.compare(
      { boundary: 47, compat: 133 },
      fixtureBaseline,
      'win32'
    );
    expect(onWindows.ok).toBe(true);
    expect(onWindows.lines.some(l => l.includes('compat (windows): 133 / 133'))).toBe(true);

    const onLinux = ratchet.compare(
      { boundary: 47, compat: 133 },
      fixtureBaseline,
      'linux'
    );
    expect(onLinux.ok).toBe(false);
    expect(onLinux.lines.some(l => l.includes('compat (linux): 133 / 132 (OVER BY 1'))).toBe(true);
  });
});

describe('failureGuidance', () => {
  test('returns multi-line guidance referencing baseline file', () => {
    const guidance = ratchet.failureGuidance();
    expect(guidance).toContain('debt-baseline.json');
    expect(guidance).toContain('ratchet_history');
    expect(guidance).toContain('Ratchet policy');
  });
});
