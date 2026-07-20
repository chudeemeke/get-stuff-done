#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const { adjudicatePairedComparison } = require('./lib/paired-perf');

const PROJECT_ROOT = path.join(__dirname, '..');
const VALID_PLATFORMS = new Set(['linux', 'macos', 'windows']);
const METRICS = ['install', 'compose'];

function printHelp(stream = process.stdout) {
  stream.write(`check-perf - adjudicate paired evidence or inspect historical baseline drift

USAGE
  node scripts/check-perf.js --comparison <file>
  node scripts/check-perf.js --baseline <file> --current <file> --platform <linux|macos|windows>

OPTIONS
  --comparison <file>     Paired same-run artifact used for blocking authority.
  --baseline <file>       Historical baseline JSON file (diagnostic mode only).
  --current <file>        Historical one-platform artifact (diagnostic mode only).
  --platform <name>       Historical platform: linux, macos, or windows.
  --warn-ratio <number>   Historical warning threshold. Default: 1.10.
  --fail-ratio <number>   Historical failure threshold. Default: 1.25.
  -h, --help              Show this help.
`);
}

function parseArgs(argv) {
  const options = {
    warnRatio: 1.10,
    failRatio: 1.25,
    thresholdOverride: false,
    help: false,
  };
  const args = [...argv];

  while (args.length > 0) {
    const arg = args.shift();
    const [flag, inlineValue] = arg.split('=', 2);
    const value = inlineValue === undefined ? args[0] : inlineValue;

    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (flag === '--comparison' && value) {
      options.comparison = path.resolve(value);
      if (inlineValue === undefined) args.shift();
    } else if (flag === '--baseline' && value) {
      options.baseline = path.resolve(value);
      if (inlineValue === undefined) args.shift();
    } else if (flag === '--current' && value) {
      options.current = path.resolve(value);
      if (inlineValue === undefined) args.shift();
    } else if (flag === '--platform' && value) {
      options.platform = value;
      if (inlineValue === undefined) args.shift();
    } else if (flag === '--warn-ratio' && value) {
      options.warnRatio = Number(value);
      options.thresholdOverride = true;
      if (inlineValue === undefined) args.shift();
    } else if (flag === '--fail-ratio' && value) {
      options.failRatio = Number(value);
      options.thresholdOverride = true;
      if (inlineValue === undefined) args.shift();
    } else {
      throw new Error(`Unknown or incomplete option: ${arg}`);
    }
  }

  return options;
}

function readJson(filePath) {
  // CLI inputs intentionally read user-supplied JSON paths after option parsing.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function assertRatio(value, name) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
}

function assertPlatform(platform) {
  if (!VALID_PLATFORMS.has(platform)) {
    throw new Error(`Invalid platform '${platform}'. Expected one of: linux, macos, windows`);
  }
}

function formatAjvErrors(errors) {
  return (errors || [])
    .map(error => {
      const location = error.instancePath || error.schemaPath || '(root)';
      return `${location} ${error.message}`;
    })
    .join('; ');
}

function validateBaselineShape(baseline) {
  const schemaPath = path.join(PROJECT_ROOT, 'config', 'perf-baseline.schema.json');
  const schema = readJson(schemaPath);
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);

  if (!validate(baseline)) {
    throw new Error(`Invalid perf baseline: ${formatAjvErrors(validate.errors)}`);
  }
}

function validateComparisonShape(comparison) {
  const schemaPath = path.join(PROJECT_ROOT, 'config', 'perf-comparison.schema.json');
  const schema = readJson(schemaPath);
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);

  if (!validate(comparison)) {
    throw new Error(`Invalid paired comparison: ${formatAjvErrors(validate.errors)}`);
  }
}

function assertPairedInputs(options) {
  if (!options.comparison) throw new Error('--comparison is required');
  if (options.baseline || options.current || options.platform || options.thresholdOverride) {
    throw new Error('--comparison cannot be mixed with historical inputs or threshold overrides');
  }
}

function assertInputs(options, baseline, current) {
  if (!options.baseline) throw new Error('--baseline is required');
  if (!options.current) throw new Error('--current is required');
  if (!options.platform) throw new Error('--platform is required');
  assertPlatform(options.platform);
  assertRatio(options.warnRatio, '--warn-ratio');
  assertRatio(options.failRatio, '--fail-ratio');

  if (options.warnRatio > options.failRatio) {
    throw new Error('--warn-ratio must be less than or equal to --fail-ratio');
  }

  if (!baseline.platforms || !baseline.platforms[options.platform]) {
    throw new Error(`Missing baseline for platform: ${options.platform}`);
  }

  validateBaselineShape(baseline);

  if (current.platform && current.platform !== options.platform) {
    throw new Error(`Current artifact platform '${current.platform}' does not match --platform ${options.platform}`);
  }
}

function isExpired(entry, now = new Date()) {
  if (!entry.expiresOn) return false;
  const today = now.toISOString().slice(0, 10);
  return entry.expiresOn < today;
}

function matchesAcceptedRegression(entry, target) {
  const targetMatches = entry.scope === 'global' ||
    (entry.platform === target.platform && entry.metric === target.metric);

  if (!targetMatches) return false;
  if (isExpired(entry)) return false;
  if (typeof entry.maxRatio === 'number' && target.ratio > entry.maxRatio) return false;
  return true;
}

function findAcceptedRegression(baseline, target) {
  return (baseline.acceptedRegressions || [])
    .find(entry => matchesAcceptedRegression(entry, target));
}

function formatRatio(value) {
  return value.toFixed(2);
}

function getPlatformBaseline(platforms, platform) {
  if (platform === 'linux') return platforms.linux;
  if (platform === 'macos') return platforms.macos;
  if (platform === 'windows') return platforms.windows;
  return undefined;
}

function getMetric(metrics, metric) {
  if (metric === 'install') return metrics.install;
  if (metric === 'compose') return metrics.compose;
  return undefined;
}

function compareMetric({ baseline, current, platform, metric, warnRatio, failRatio }) {
  const platformBaseline = getPlatformBaseline(baseline.platforms, platform);
  const baselineMetric = platformBaseline ? getMetric(platformBaseline, metric) : null;
  const currentMetric = getMetric(current, metric);

  if (!baselineMetric || typeof baselineMetric.mean_ms !== 'number') {
    throw new Error(`Missing baseline metric ${platform} ${metric}`);
  }
  if (!currentMetric || typeof currentMetric.mean_ms !== 'number') {
    throw new Error(`Missing current metric ${platform} ${metric}`);
  }
  if (baselineMetric.mean_ms <= 0) {
    throw new Error(`Baseline metric ${platform} ${metric} must have mean_ms greater than 0`);
  }

  const ratio = currentMetric.mean_ms / baselineMetric.mean_ms;
  const target = { platform, metric, ratio };
  const accepted = ratio > failRatio ? findAcceptedRegression(baseline, target) : null;

  return {
    platform,
    metric,
    baselineMean: baselineMetric.mean_ms,
    currentMean: currentMetric.mean_ms,
    ratio,
    status: ratio > failRatio && !accepted
      ? 'fail'
      : ratio > warnRatio
        ? 'warn'
        : 'pass',
    accepted,
  };
}

function printComparison(result, stream = process.stdout) {
  const summary = `historical diagnostic ${result.platform} ${result.metric}: baseline=${result.baselineMean}ms current=${result.currentMean}ms ratio=${formatRatio(result.ratio)}`;
  stream.write(`${summary}\n`);

  if (result.accepted) {
    stream.write(`acceptedRegressions: accepted ${result.platform} ${result.metric} regression by ${result.accepted.reviewer} (${result.accepted.ticket})\n`);
    return;
  }

  if (result.status === 'fail' || result.status === 'warn') {
    stream.write(`::warning title=Historical perf diagnostic::${summary}\n`);
  }
}

function runComparison(options, baseline, current) {
  const results = METRICS.map(metric => compareMetric({
    baseline,
    current,
    platform: options.platform,
    metric,
    warnRatio: options.warnRatio,
    failRatio: options.failRatio,
  }));

  for (const result of results) {
    printComparison(result);
  }

  return 0;
}

function printPairedMetric(metric, summary, stream = process.stdout) {
  const line = `paired ${metric}: reference=${summary.referenceMeanNs}ns candidate=${summary.candidateMeanNs}ns ratio=${formatRatio(summary.ratio)}`;
  stream.write(`${line}\n`);
  if (summary.status === 'fail') {
    stream.write(`::error title=Paired perf budget failure::${line}\n`);
  } else if (summary.status === 'warn') {
    stream.write(`::warning title=Paired perf budget warning::${line}\n`);
  }
}

function runPairedComparison(comparison) {
  validateComparisonShape(comparison);
  const result = adjudicatePairedComparison(comparison);
  printPairedMetric('install', result.metrics.install);
  printPairedMetric('compose', result.metrics.compose);
  return result.verdict === 'fail' ? 1 : 0;
}

function main(argv = process.argv.slice(2)) {
  try {
    const options = parseArgs(argv);
    if (options.help) {
      printHelp();
      return 0;
    }

    if (options.comparison) {
      assertPairedInputs(options);
      return runPairedComparison(readJson(options.comparison));
    }

    const baseline = readJson(options.baseline);
    const current = readJson(options.current);
    assertInputs(options, baseline, current);
    return runComparison(options, baseline, current);
  } catch (err) {
    process.stderr.write(`Error [EPERF]: ${err.message}\n`);
    process.stderr.write('  Hint: run node scripts/check-perf.js --help for usage.\n');
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  compareMetric,
  findAcceptedRegression,
  main,
  matchesAcceptedRegression,
  parseArgs,
  runPairedComparison,
};
