'use strict';

/**
 * Phase 36 Plan 02 -- check-boundary.js Dedicated Coverage Tests
 *
 * Single top-level require avoids bun 1.3.5 coverage attribution bug
 * (multiple require() calls from different test files confuse coverage tracking).
 *
 * Tests here exercise all 3 exported functions through one module load.
 */

const { checkBoundary, formatReport, parseArgs } = require('../scripts/check-boundary');
const { describe, test, expect } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('check-boundary coverage', () => {
  test('checkBoundary returns report object', () => {
    const report = checkBoundary();
    expect(report).toHaveProperty('ok');
    expect(report).toHaveProperty('violations');
    expect(Array.isArray(report.violations)).toBe(true);
  });

  test('a dangling symlink in the tree does not abort the walk', () => {
    // Regression: walkDir used fs.statSync, which follows symlinks and throws ENOENT on a
    // broken one. A single dangling link anywhere (e.g. inside a stale .claude/worktrees/
    // checkout) crashed the whole boundary gate instead of reporting violations.
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-boundary-'));
    try {
      fs.writeFileSync(path.join(projectDir, 'real-file.js'), '// present\n');
      const nested = path.join(projectDir, 'nested');
      fs.mkdirSync(nested);
      fs.writeFileSync(path.join(nested, 'other.js'), '// present\n');

      let linkCreated = true;
      try {
        fs.symlinkSync(path.join(projectDir, 'no-such-target'), path.join(nested, 'broken-link'));
      } catch {
        // Windows without developer mode/elevation cannot create symlinks.
        linkCreated = false;
      }

      const report = checkBoundary({ projectDir });
      expect(report).toHaveProperty('violations');
      expect(Array.isArray(report.violations)).toBe(true);

      if (linkCreated) {
        // Prove the link really was dangling, so this assertion is not vacuous.
        expect(fs.existsSync(path.join(nested, 'broken-link'))).toBe(false);
        expect(fs.lstatSync(path.join(nested, 'broken-link')).isSymbolicLink()).toBe(true);
      }
    } finally {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });

  test('formatReport with clean report', () => {
    const output = formatReport({ ok: true, violations: [] });
    expect(output).toContain('No boundary violations found');
  });

  test('formatReport with violations', () => {
    const output = formatReport({ ok: false, violations: ['bin/tool.cjs', 'src/fake.js'] });
    expect(output).toContain('2 boundary violation(s)');
  });

  test('parseArgs with no arguments', () => {
    const args = parseArgs([]);
    expect(args).toBeDefined();
  });

  test('parseArgs with --upstream-dir and --project-dir flags', () => {
    const args = parseArgs(['--upstream-dir', '/tmp/up', '--project-dir', '/tmp/proj']);
    expect(args.upstreamDir).toBe('/tmp/up');
    expect(args.projectDir).toBe('/tmp/proj');
  });
});
