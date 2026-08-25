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

// Excerpt from the windows-latest JUnit artifact of run 32897419319 (commit e7943b47),
// preserving the real shape and ordering: bun writes passing testcases SELF-CLOSING, a
// timeout failure as a self-closing <failure/> with no body, and (as at artifact lines
// 1633/1636) a passing self-closing testcase immediately precedes the failing one.
// String.raw keeps the Windows `\` in file paths -- a plain template literal silently
// eats it, which would make the fixture exercise no Windows path at all.
// The original paired-tag-only parser reported "No JUnit failure events found" on this.
const JUNIT_BUN_SELF_CLOSING = String.raw`<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="3" failures="1">
  <testsuite name="audit-check" file="tests\audit-check.test.js" tests="1" failures="0">
    <testcase name="valid empty suppressions array passes" classname="audit-check" time="0.4" file="tests\audit-check.test.js" line="12" assertions="1" />
  </testsuite>
  <testsuite name="_detectGit direct tests" file="tests\platform-internal.test.js" tests="2" failures="1">
    <testcase name="version matches process.versions.node" classname="_detectNodeVersion direct tests" time="0.000036" file="tests\platform-internal.test.js" line="310" assertions="1" />
    <testcase name="git available: returns available=true with path and version strings" classname="_detectGit direct tests" time="5.002067" file="tests\platform-internal.test.js" line="327" assertions="1">
      <failure type="TimeoutError" message="test timed out" />
    </testcase>
  </testsuite>
</testsuites>
`;

// A test NAME may legally contain an unescaped `/>`; bun puts names in an attribute.
const JUNIT_SLASH_IN_ATTRIBUTE = String.raw`<testsuites><testsuite>
  <testcase name="detects a self-closing bun &lt;failure/> element" file="tests\meta.test.js">
    <failure message="boom">stack</failure>
  </testcase>
</testsuite></testsuites>`;

// A real paired <failure> followed by a trailing self-closing <error/> in the same testcase.
const JUNIT_PAIRED_THEN_SELF_CLOSING = String.raw`<testsuites><testsuite>
  <testcase name="t" file="tests\order.test.js">
    <failure message="THE REAL ONE">stack</failure>
    <error type="teardown" message="secondary" />
  </testcase>
</testsuite></testsuites>`;

describe('JUnit flake parsing', () => {
  test('detects a self-closing bun <failure/> and keeps the Windows path', () => {
    const events = parseJunitFailures(JUNIT_BUN_SELF_CLOSING, { platform: 'windows-latest' });

    expect(events).toHaveLength(1);
    expect(events[0].testFilePath).toBe(String.raw`tests\platform-internal.test.js`);
    expect(events[0].testName).toBe('git available: returns available=true with path and version strings');
    expect(events[0].failureMessage).toBe('test timed out');
  });

  test('does not attribute a failure to a preceding self-closing testcase', () => {
    const events = parseJunitFailures(JUNIT_BUN_SELF_CLOSING, { platform: 'windows-latest' });

    // Regression: `<testcase ... />` parsed as an opening tag let a passing test's body
    // run on to a later `</testcase>` and adopt its failure. Against the real artifact
    // that reported the failure under tests\audit-check.test.js.
    expect(events.map((event) => event.testName)).toEqual([
      'git available: returns available=true with path and version strings',
    ]);
  });

  test('does not drop a failure when an attribute value contains "/>"', () => {
    const events = parseJunitFailures(JUNIT_SLASH_IN_ATTRIBUTE, { platform: 'windows-latest' });

    // Regression: skipping quoted attribute values as units. A naive `[^>]*?` stops at the
    // `/>` inside the name and ends the tag early, dropping the failure entirely -- the
    // same silent blindness this parser exists to remove.
    expect(events).toHaveLength(1);
    expect(events[0].testFilePath).toBe(String.raw`tests\meta.test.js`);
    expect(events[0].failureMessage).toBe('boom');
  });

  test('prefers the earlier paired <failure> over a later self-closing <error/>', () => {
    const events = parseJunitFailures(JUNIT_PAIRED_THEN_SELF_CLOSING, { platform: 'windows-latest' });

    // Regression: matching self-closing forms in a separate earlier pass lost document
    // order, so a trailing teardown <error/> outranked the real failure.
    expect(events).toHaveLength(1);
    expect(events[0].failureMessage).toBe('THE REAL ONE');
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
