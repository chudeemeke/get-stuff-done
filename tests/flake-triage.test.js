'use strict';

const { describe, test, expect, afterEach } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  buildFlakeLabels,
  formatRel03Summary,
  main,
  parseJunitFailures,
  scanRel03Skips,
  validateRel03Wrappers,
} = require('../scripts/flake-triage');

const cleanupPaths = [];

afterEach(() => {
  for (const targetPath of cleanupPaths.splice(0)) {
    fs.rmSync(targetPath, { force: true, recursive: true });
  }
});

function createTempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-flake-triage-'));
  cleanupPaths.push(dir);
  return dir;
}

function writeTempFile(name, content) {
  const dir = createTempDir();
  const filePath = path.join(dir, name);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

const JUNIT_WITH_FAILURE = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="1" failures="1">
  <testsuite name="tests/sync.test.cjs" tests="1" failures="1">
    <testcase classname="tests/sync.test.cjs" name="sync retries failed pushes" file="tests/sync.test.cjs" time="1.23">
      <failure message="expected retry to pass">stack trace</failure>
    </testcase>
  </testsuite>
</testsuites>
`;

describe('JUnit flake parsing', () => {
  test('parses a JUnit failure into the D-10 dedup key', () => {
    const events = parseJunitFailures(JUNIT_WITH_FAILURE, {
      platform: 'windows',
      runUrl: 'https://github.com/chudeemeke/get-stuff-done/actions/runs/123',
      commit: 'abc123',
    });

    expect(events).toEqual([
      {
        key: 'tests/sync.test.cjs::sync retries failed pushes::windows',
        title: 'Flake: tests/sync.test.cjs::sync retries failed pushes::windows',
        testFilePath: 'tests/sync.test.cjs',
        testName: 'sync retries failed pushes',
        platform: 'windows',
        labels: ['flake-report', 'flake-platform-windows', 'flake-file-sync'],
        runUrl: 'https://github.com/chudeemeke/get-stuff-done/actions/runs/123',
        commit: 'abc123',
        failureMessage: 'expected retry to pass',
      },
    ]);
  });

  test('adds rel-03-candidate after three hits in fourteen days', () => {
    expect(buildFlakeLabels({
      testFilePath: 'tests/sync.test.cjs',
      platform: 'windows',
      recentHits: 3,
    })).toEqual([
      'flake-report',
      'flake-platform-windows',
      'flake-file-sync',
      'rel-03-candidate',
    ]);
  });
});

describe('REL-03 source scanning', () => {
  test('scans active REL-03 skip reasons and produces a Markdown summary table', () => {
    const sourceRoot = createTempDir();
    const testFile = path.join(sourceRoot, 'tests', 'sync.test.cjs');
    const rel03Id = ['REL', '03', '1'].join('-');
    fs.mkdirSync(path.dirname(testFile), { recursive: true });
    fs.writeFileSync(
      testFile,
      `test.skip.if(isWindows, { reason: '${rel03Id}: https://github.com/chudeemeke/get-stuff-done/issues/77, deadline 2026-08-01' })('temporary skip', () => {});\n`,
      'utf-8'
    );

    const skips = scanRel03Skips({ sourceRoot });
    expect(skips).toHaveLength(1);
    expect(formatRel03Summary(skips)).toContain('### Active REL-03 skips');
    expect(formatRel03Summary(skips)).toContain(`| ${rel03Id} | tests/sync.test.cjs |`);
  });

  test('validates active REL-03 skips use issue URL and deadline wrapper shape', () => {
    const sourceRoot = createTempDir();
    const validFile = path.join(sourceRoot, 'tests', 'valid.test.js');
    const invalidFile = path.join(sourceRoot, 'tests', 'invalid.test.js');
    const validRel03Id = ['REL', '03', '2'].join('-');
    const invalidRel03Id = ['REL', '03', '3'].join('-');
    fs.mkdirSync(path.dirname(validFile), { recursive: true });
    fs.writeFileSync(
      validFile,
      `test.skip.if(isWindows, { reason: '${validRel03Id}: https://github.com/chudeemeke/get-stuff-done/issues/88, deadline 2026-08-02' })('valid', () => {});\n`,
      'utf-8'
    );
    fs.writeFileSync(
      invalidFile,
      `test.skip('${invalidRel03Id} missing deadline', () => {});\n`,
      'utf-8'
    );

    const validation = validateRel03Wrappers({ sourceRoot });
    expect(validation.ok).toBe(false);
    expect(validation.violations[0]).toContain(invalidRel03Id);
  });
});

describe('flake-triage CLI', () => {
  test('writes flake events from JUnit XML', () => {
    const junitPath = writeTempFile('junit.xml', JUNIT_WITH_FAILURE);
    const outputPath = path.join(createTempDir(), 'flake-events.json');

    const exitCode = main([
      '--junit',
      junitPath,
      '--platform',
      'windows',
      '--run-url',
      'https://github.com/chudeemeke/get-stuff-done/actions/runs/123',
      '--commit',
      'abc123',
      '--output',
      outputPath,
    ]);

    expect(exitCode).toBe(0);
    const events = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    expect(events[0].key).toBe('tests/sync.test.cjs::sync retries failed pushes::windows');
  });

  test('scan-rel03 writes a Markdown section beginning with Active REL-03 skips', () => {
    const sourceRoot = createTempDir();
    const outputPath = path.join(createTempDir(), 'rel03-summary.md');

    const exitCode = main([
      '--scan-rel03',
      '--source-root',
      sourceRoot,
      '--output-summary',
      outputPath,
    ]);

    expect(exitCode).toBe(0);
    expect(fs.readFileSync(outputPath, 'utf-8')).toStartWith('### Active REL-03 skips');
  });
});
