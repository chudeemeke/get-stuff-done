#!/usr/bin/env node
'use strict';

/* eslint-disable security/detect-non-literal-fs-filename -- GitHub provides GITHUB_STEP_SUMMARY; tests inject temp summary paths. */

/**
 * CI wrapper for upstream compatibility checks.
 *
 * The underlying compat runner intentionally exits non-zero when upstream tests
 * differ from this fork. Those differences are useful signal, but this CI job is
 * informational and should not make the PR rollup red.
 */

const fs = require('fs');
const { runUpstreamCompat, formatReport } = require('./run-upstream-compat');

function appendStepSummary(summaryPath, result, report) {
  if (!summaryPath) return;

  const status = result.ok ? 'passing' : 'non-blocking drift detected';
  const summary = [
    '### Upstream compatibility',
    '',
    `Status: ${status}`,
    '',
    '```text',
    report.trimEnd(),
    '```',
    '',
  ].join('\n');

  fs.appendFileSync(summaryPath, summary, 'utf8');
}

function main(options = {}) {
  const runUpstreamCompatImpl = options.runUpstreamCompatImpl || runUpstreamCompat;
  const stdout = options.stdout || process.stdout;
  const summaryPath = Object.prototype.hasOwnProperty.call(options, 'summaryPath')
    ? options.summaryPath
    : process.env.GITHUB_STEP_SUMMARY;

  const result = runUpstreamCompatImpl();
  const report = formatReport(result);
  stdout.write(report);

  if (!result.ok) {
    stdout.write('Upstream compatibility drift is non-blocking in CI; see report above.\n');
  }

  appendStepSummary(summaryPath, result, report);
  return 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { appendStepSummary, main };
