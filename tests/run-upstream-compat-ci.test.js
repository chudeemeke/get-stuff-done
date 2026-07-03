const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts', 'run-upstream-compat-ci.js');

describe('run-upstream-compat-ci', () => {
  test('returns success even when upstream compatibility detects expected drift', () => {
    if (!fs.existsSync(SCRIPT_PATH)) {
      expect(fs.existsSync(SCRIPT_PATH)).toBe(true);
      return;
    }

    const { main } = require('../scripts/run-upstream-compat-ci');
    let output = '';
    const exitCode = main({
      runUpstreamCompatImpl: () => ({
        ok: false,
        passed: 10,
        failed: 2,
        skipped: 0,
        excluded: ['sync.test.cjs'],
        errors: [],
      }),
      stdout: { write: chunk => { output += chunk; } },
    });

    expect(exitCode).toBe(0);
    expect(output).toContain('Result: FAIL');
    expect(output).toContain('non-blocking');
  });

  test('writes a GitHub step summary when GITHUB_STEP_SUMMARY is available', () => {
    if (!fs.existsSync(SCRIPT_PATH)) {
      expect(fs.existsSync(SCRIPT_PATH)).toBe(true);
      return;
    }

    const { main } = require('../scripts/run-upstream-compat-ci');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-compat-summary-'));
    const summaryPath = path.join(dir, 'summary.md');

    try {
      main({
        runUpstreamCompatImpl: () => ({
          ok: false,
          passed: 4,
          failed: 1,
          skipped: 0,
          excluded: [],
          errors: ['expected branding drift'],
        }),
        summaryPath,
        stdout: { write: () => {} },
      });

      const summary = fs.readFileSync(summaryPath, 'utf8');
      expect(summary).toContain('Upstream compatibility');
      expect(summary).toContain('non-blocking');
      expect(summary).toContain('expected branding drift');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
