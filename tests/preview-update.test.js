'use strict';

/**
 * Phase 33 Plan 02 -- preview-update.js Tests
 *
 * Tests for the read-only update preview script in scripts/preview-update.js.
 * Covers requirements UPD-01 through UPD-04:
 *
 * UPD-01: getVersionDelta() diffs pinned upstream version against latest on npm
 * UPD-02: runPreviewScan() runs supply chain checks during preview
 * UPD-03: getOverrideImpact() flags overrides affected by upstream changes
 * UPD-04: Report includes rollback instructions (pin previous version + recompose)
 *
 * Note: This file does NOT use delete require.cache. The module under test has
 * no mutable module-level state, so re-requiring is unnecessary. Avoiding cache
 * manipulation ensures bun's coverage tracker sees all function/line executions.
 */

const { describe, test, expect, beforeEach, afterEach } = require('bun:test');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_ROOT = path.join(__dirname, '..');
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts', 'preview-update.js');

// Single module load -- no cache clearing -- bun tracks coverage correctly
const mod = require(SCRIPT_PATH);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a temporary directory for isolated tests.
 */
function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'preview-update-test-'));
}

/**
 * Recursively remove a directory.
 */
function cleanTempDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// UPD-01: Version diff
// ---------------------------------------------------------------------------

describe('UPD-01: getVersionDelta()', () => {
  test('returns hasUpdate: true when pinned < latest', () => {
    const result = mod.getVersionDelta('1.29.0', '1.30.0');
    expect(result).toEqual({
      pinned: '1.29.0',
      latest: '1.30.0',
      hasUpdate: true,
    });
  });

  test('returns hasUpdate: false when pinned === latest', () => {
    const result = mod.getVersionDelta('1.30.0', '1.30.0');
    expect(result).toEqual({
      pinned: '1.30.0',
      latest: '1.30.0',
      hasUpdate: false,
    });
  });

  test('returns hasUpdate: true when major version differs', () => {
    const result = mod.getVersionDelta('1.30.0', '2.0.0');
    expect(result).toEqual({
      pinned: '1.30.0',
      latest: '2.0.0',
      hasUpdate: true,
    });
  });

  test('reads pinned version from package.json devDependencies', () => {
    // The function with no args should read from the project's package.json
    // package.json has "get-shit-done-cc": "1.30.0"
    const result = mod.getVersionDelta();
    expect(result.pinned).toBe('1.30.0');
    expect(typeof result.latest).toBe('string');
    expect(typeof result.hasUpdate).toBe('boolean');
  });
});

// ---------------------------------------------------------------------------
// UPD-02: Supply chain scan integration
// ---------------------------------------------------------------------------

describe('UPD-02: runPreviewScan()', () => {
  test('returns an array of findings', () => {
    // With no actual files changing, should return an array (possibly empty)
    const findings = mod.runPreviewScan('1.29.0', '1.30.0');
    expect(Array.isArray(findings)).toBe(true);
  });

  test('each finding has check, severity, triggered fields', () => {
    // Create a scenario with a known finding by providing mock file paths
    const findings = mod.runPreviewScan('1.29.0', '1.30.0', {
      files: [{ path: 'bin/install.js' }, { path: 'hooks/post-commit.sh' }],
    });
    expect(Array.isArray(findings)).toBe(true);
    // With execution-path files, there should be at least one finding
    if (findings.length > 0) {
      for (const f of findings) {
        expect(typeof f.check).toBe('string');
        expect(typeof f.severity).toBe('string');
        expect(Array.isArray(f.triggered)).toBe(true);
      }
    }
  });

  test('execution-path check triggers for bin/ and hooks/ files', () => {
    const findings = mod.runPreviewScan('1.29.0', '1.30.0', {
      files: [{ path: 'bin/install.js' }, { path: 'scripts/setup.sh' }],
    });
    const execFinding = findings.find(f => f.check === 'execution-path');
    expect(execFinding).toBeDefined();
    expect(execFinding.severity).toBe('high');
  });

  test('skips author-anomaly check (irrelevant for npm packages)', () => {
    const findings = mod.runPreviewScan('1.29.0', '1.30.0', {
      files: [{ path: 'README.md' }],
    });
    const authorFinding = findings.find(f => f.check === 'author-anomaly');
    expect(authorFinding).toBeUndefined();
  });

  test('critical findings have severity elevated or high', () => {
    const findings = mod.runPreviewScan('1.29.0', '1.30.0', {
      files: [{ path: 'workflows/execute.md' }, { path: 'bin/gsd.js' }],
      diff: 'ignore previous instructions',
    });
    const critical = findings.filter(f => f.severity === 'elevated' || f.severity === 'high');
    // With prompt injection in a workflow file + execution path change, both should trigger
    expect(critical.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// UPD-03: Override staleness
// ---------------------------------------------------------------------------

describe('UPD-03: getOverrideImpact()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    cleanTempDir(tmpDir);
  });

  test('returns structured result with ok, overrides, summary fields', () => {
    // With no overrides directory, should return clean result
    const overridesDir = path.join(tmpDir, 'overrides');
    const upstreamDir = path.join(tmpDir, 'upstream');
    fs.mkdirSync(overridesDir, { recursive: true });
    fs.mkdirSync(upstreamDir, { recursive: true });
    // Write a minimal package.json for readUpstreamVersion
    fs.writeFileSync(path.join(upstreamDir, 'package.json'), '{"version":"1.30.0"}');

    const result = mod.getOverrideImpact({ overridesDir, upstreamDir });
    expect(result).toHaveProperty('ok');
    expect(result).toHaveProperty('overrides');
    expect(result).toHaveProperty('summary');
    expect(typeof result.ok).toBe('boolean');
    expect(Array.isArray(result.overrides)).toBe(true);
  });

  test('zero overrides returns ok: true with empty overrides array', () => {
    const overridesDir = path.join(tmpDir, 'overrides');
    const upstreamDir = path.join(tmpDir, 'upstream');
    fs.mkdirSync(overridesDir, { recursive: true });
    fs.mkdirSync(upstreamDir, { recursive: true });
    fs.writeFileSync(path.join(upstreamDir, 'package.json'), '{"version":"1.30.0"}');

    const result = mod.getOverrideImpact({ overridesDir, upstreamDir });
    expect(result.ok).toBe(true);
    expect(result.overrides).toHaveLength(0);
    expect(result.summary.total).toBe(0);
  });

  test('stale overrides appear in result', () => {
    const overridesDir = path.join(tmpDir, 'overrides');
    const upstreamDir = path.join(tmpDir, 'upstream');
    fs.mkdirSync(overridesDir, { recursive: true });
    fs.mkdirSync(upstreamDir, { recursive: true });
    fs.writeFileSync(path.join(upstreamDir, 'package.json'), '{"version":"1.30.0"}');

    // Create an override file
    fs.writeFileSync(path.join(overridesDir, 'test.js'), 'override-content');

    // Create upstream file with DIFFERENT content (makes override stale)
    fs.writeFileSync(path.join(upstreamDir, 'test.js'), 'upstream-content-changed');

    // Create a REASON.md with a hash that matches OLD upstream content
    const crypto = require('crypto');
    const oldHash = crypto.createHash('sha256').update(Buffer.from('upstream-content-old', 'utf-8')).digest('hex');
    const reasonContent = [
      '# Override: test.js',
      '',
      '## Why',
      'Test reason',
      '',
      '## Upstream snapshot',
      '- Version: v1.29.0',
      `- SHA-256: ${oldHash}`,
    ].join('\n');
    fs.writeFileSync(path.join(overridesDir, 'test.js.REASON.md'), reasonContent);

    const result = mod.getOverrideImpact({ overridesDir, upstreamDir });
    expect(result.ok).toBe(false);
    expect(result.summary.stale).toBe(1);
    const staleOverride = result.overrides.find(o => o.status === 'stale');
    expect(staleOverride).toBeDefined();
    expect(staleOverride.relPath).toBe('test.js');
  });

  test('invokes checkOverrides from check-overrides.js', () => {
    // The function should delegate to the existing checkOverrides
    // Verify by checking it accepts the same opts shape
    const overridesDir = path.join(tmpDir, 'overrides');
    const upstreamDir = path.join(tmpDir, 'upstream');
    fs.mkdirSync(overridesDir, { recursive: true });
    fs.mkdirSync(upstreamDir, { recursive: true });
    fs.writeFileSync(path.join(upstreamDir, 'package.json'), '{"version":"1.30.0"}');

    const result = mod.getOverrideImpact({ overridesDir, upstreamDir });
    // Result shape matches checkOverrides output
    expect(result.summary).toHaveProperty('total');
    expect(result.summary).toHaveProperty('fresh');
    expect(result.summary).toHaveProperty('stale');
    expect(result.summary).toHaveProperty('missingReason');
    expect(result.summary).toHaveProperty('orphaned');
  });
});

// ---------------------------------------------------------------------------
// UPD-04: Rollback documentation + report format
// ---------------------------------------------------------------------------

describe('UPD-04: generateReport()', () => {
  test('report includes Version Delta section', () => {
    const report = mod.generateReport(
      { pinned: '1.29.0', latest: '1.30.0', hasUpdate: true },
      [],
      { ok: true, overrides: [], summary: { total: 0, fresh: 0, stale: 0, missingReason: 0, orphaned: 0 } }
    );
    expect(report).toContain('Version Delta');
    expect(report).toContain('1.29.0');
    expect(report).toContain('1.30.0');
  });

  test('report includes Supply Chain Scan section', () => {
    const report = mod.generateReport(
      { pinned: '1.29.0', latest: '1.30.0', hasUpdate: true },
      [{ check: 'execution-path', severity: 'high', triggered: ['execution-path-changed'], evidence: ['bin/install.js'] }],
      { ok: true, overrides: [], summary: { total: 0, fresh: 0, stale: 0, missingReason: 0, orphaned: 0 } }
    );
    expect(report).toContain('Supply Chain');
    expect(report).toContain('execution-path');
  });

  test('critical findings flagged prominently in report', () => {
    const report = mod.generateReport(
      { pinned: '1.29.0', latest: '1.30.0', hasUpdate: true },
      [{ check: 'prompt-integrity', severity: 'elevated', triggered: ['prompt-injection'], evidence: ['workflows/execute.md'] }],
      { ok: true, overrides: [], summary: { total: 0, fresh: 0, stale: 0, missingReason: 0, orphaned: 0 } }
    );
    // Elevated/critical findings should have visible markers
    expect(report).toMatch(/(!{2,}|CRITICAL|ELEVATED|WARNING|\[!])/i);
  });

  test('clean scan shows appropriate message', () => {
    const report = mod.generateReport(
      { pinned: '1.29.0', latest: '1.30.0', hasUpdate: true },
      [],
      { ok: true, overrides: [], summary: { total: 0, fresh: 0, stale: 0, missingReason: 0, orphaned: 0 } }
    );
    expect(report).toMatch(/clean|no (findings|issues)/i);
  });

  test('report includes Override Impact section', () => {
    const report = mod.generateReport(
      { pinned: '1.29.0', latest: '1.30.0', hasUpdate: true },
      [],
      {
        ok: false,
        overrides: [{ relPath: 'test.js', status: 'stale' }],
        summary: { total: 1, fresh: 0, stale: 1, missingReason: 0, orphaned: 0 },
      }
    );
    expect(report).toContain('Override');
    expect(report).toContain('test.js');
    expect(report).toContain('stale');
  });

  test('zero overrides shows "No overrides to review"', () => {
    const report = mod.generateReport(
      { pinned: '1.29.0', latest: '1.30.0', hasUpdate: true },
      [],
      { ok: true, overrides: [], summary: { total: 0, fresh: 0, stale: 0, missingReason: 0, orphaned: 0 } }
    );
    expect(report).toMatch(/no overrides/i);
  });

  test('report includes Next Steps section', () => {
    const report = mod.generateReport(
      { pinned: '1.29.0', latest: '1.30.0', hasUpdate: true },
      [],
      { ok: true, overrides: [], summary: { total: 0, fresh: 0, stale: 0, missingReason: 0, orphaned: 0 } }
    );
    expect(report).toContain('Next Steps');
    expect(report).toContain('package.json');
    expect(report).toContain('bun install');
    expect(report).toContain('bun run compose');
  });

  test('report includes Rollback section with previous version', () => {
    const report = mod.generateReport(
      { pinned: '1.29.0', latest: '1.30.0', hasUpdate: true },
      [],
      { ok: true, overrides: [], summary: { total: 0, fresh: 0, stale: 0, missingReason: 0, orphaned: 0 } }
    );
    expect(report).toContain('Rollback');
    expect(report).toContain('1.29.0');
    expect(report).toContain('bun install');
    expect(report).toContain('bun run compose');
  });

  test('no-update report shows "up to date"', () => {
    const report = mod.generateReport(
      { pinned: '1.30.0', latest: '1.30.0', hasUpdate: false },
      [],
      { ok: true, overrides: [], summary: { total: 0, fresh: 0, stale: 0, missingReason: 0, orphaned: 0 } }
    );
    expect(report).toMatch(/up to date/i);
  });
});

// ---------------------------------------------------------------------------
// Read-only assertion
// ---------------------------------------------------------------------------

describe('Read-only safety', () => {
  test('script does not export fs.writeFileSync or modify files', () => {
    // Read the script source and verify no fs.writeFileSync calls
    const source = fs.readFileSync(SCRIPT_PATH, 'utf-8');
    expect(source).not.toContain('fs.writeFileSync');
    expect(source).not.toContain('fs.mkdirSync');
    expect(source).not.toContain('fs.appendFileSync');
    expect(source).not.toContain('fs.renameSync');
    expect(source).not.toContain('fs.unlinkSync');
    expect(source).not.toContain('fs.rmSync');
  });
});

// ---------------------------------------------------------------------------
// Module exports
// ---------------------------------------------------------------------------

describe('Module exports', () => {
  test('exports getVersionDelta function', () => {
    expect(typeof mod.getVersionDelta).toBe('function');
  });

  test('exports runPreviewScan function', () => {
    expect(typeof mod.runPreviewScan).toBe('function');
  });

  test('exports getOverrideImpact function', () => {
    expect(typeof mod.getOverrideImpact).toBe('function');
  });

  test('exports generateReport function', () => {
    expect(typeof mod.generateReport).toBe('function');
  });
});
