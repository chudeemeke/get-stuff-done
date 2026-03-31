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

describe('check-boundary coverage', () => {
  test('checkBoundary returns report object', () => {
    const report = checkBoundary();
    expect(report).toHaveProperty('ok');
    expect(report).toHaveProperty('violations');
    expect(Array.isArray(report.violations)).toBe(true);
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
