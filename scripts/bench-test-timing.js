#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const DEFAULT_RUNS = 5;
const VALID_PLATFORMS = new Set(['linux', 'macos', 'windows', 'local']);

function printHelp(stream = process.stdout) {
  stream.write(`bench-test-timing - capture or merge Bun JUnit test timing metrics

USAGE
  node scripts/bench-test-timing.js --platform <linux|macos|windows|local> --runs <n> --out <file>
  node scripts/bench-test-timing.js --merge <dir-or-glob> --require-platforms linux,macos,windows --out <file>

OPTIONS
  --platform <name>           Platform name for a one-platform artifact.
  --out <file>                Output JSON file.
  --runs <n>                  Bun test runs for a one-platform artifact. Default: 5.
  --merge <dir-or-glob>       Merge per-platform JSON artifacts.
  --require-platforms <list>  Comma-separated platforms required during merge.
  -h, --help                  Show this help.

EXAMPLES
  node scripts/bench-test-timing.js --platform local --runs 1 --out .planning/perf/test-timing.local.json
  node scripts/bench-test-timing.js --merge artifacts --require-platforms linux,macos,windows --out .planning/perf/test-timing.json
`);
}

function parseArgs(argv) {
  const options = {
    runs: DEFAULT_RUNS,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const [flag, inlineValue] = arg.split('=', 2);
    const value = inlineValue === undefined ? argv[i + 1] : inlineValue;
    const consumed = inlineValue === undefined;

    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (flag === '--platform' && value) {
      options.platform = value;
      if (consumed) i++;
    } else if (flag === '--out' && value) {
      options.out = path.resolve(value);
      if (consumed) i++;
    } else if (flag === '--runs' && value) {
      options.runs = Number(value);
      if (consumed) i++;
    } else if (flag === '--merge' && value) {
      options.merge = value;
      if (consumed) i++;
    } else if (flag === '--require-platforms' && value) {
      options.requirePlatforms = value.split(',').map(item => item.trim()).filter(Boolean);
      if (consumed) i++;
    } else {
      throw new Error(`Unknown or incomplete option: ${arg}`);
    }
  }

  return options;
}

function assertPositiveInteger(value, name) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
}

function assertPlatform(platform) {
  if (!VALID_PLATFORMS.has(platform)) {
    throw new Error(`Invalid platform '${platform}'. Expected one of: linux, macos, windows, local`);
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || PROJECT_ROOT,
    env: options.env || process.env,
    encoding: 'utf-8',
    stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    throw new Error(`${command} exited with status ${result.status}${stderr ? `: ${stderr}` : ''}`);
  }

  return (result.stdout || '').trim();
}

function getBunVersion() {
  return run('bun', ['--version']);
}

function getUpstreamVersion() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8'));
  return packageJson.devDependencies && packageJson.devDependencies['@opengsd/gsd-core']
    ? packageJson.devDependencies['@opengsd/gsd-core']
    : 'unknown';
}

function decodeXml(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function parseAttributes(tag) {
  const attrs = {};
  const attrPattern = /([A-Za-z_:][A-Za-z0-9_:.-]*)="([^"]*)"/g;
  let match;
  while ((match = attrPattern.exec(tag)) !== null) {
    attrs[match[1]] = decodeXml(match[2]);
  }
  return attrs;
}

function parseJUnitTiming(xml) {
  const files = {};
  const suitePattern = /<testsuite\s+[^>]*>/g;
  let match;
  while ((match = suitePattern.exec(xml)) !== null) {
    const attrs = parseAttributes(match[0]);
    if (!attrs.name || attrs.time === undefined) continue;
    const seconds = Number(attrs.time);
    if (!Number.isFinite(seconds)) continue;
    files[attrs.name] = Math.round(seconds * 1000);
  }

  const rootMatch = /<testsuites\s+[^>]*>/.exec(xml);
  let totalMs = 0;
  if (rootMatch) {
    const attrs = parseAttributes(rootMatch[0]);
    const seconds = Number(attrs.time);
    if (Number.isFinite(seconds)) {
      totalMs = Math.round(seconds * 1000);
    }
  }

  if (!totalMs) {
    totalMs = Object.values(files).reduce((sum, value) => sum + value, 0);
  }

  return {
    total_ms: totalMs,
    files,
  };
}

function stats(values) {
  if (!values.length) {
    return { mean_ms: 0, stddev_ms: 0, min_ms: 0, max_ms: 0, samples: 0 };
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
  return {
    mean_ms: Math.round(mean),
    stddev_ms: Math.round(Math.sqrt(variance)),
    min_ms: Math.round(Math.min(...values)),
    max_ms: Math.round(Math.max(...values)),
    samples: values.length,
  };
}

function aggregateRuns(runs) {
  const totals = runs.map(runResult => runResult.total_ms);
  const byFile = {};
  for (const runResult of runs) {
    for (const [file, duration] of Object.entries(runResult.files)) {
      if (!byFile[file]) byFile[file] = [];
      byFile[file].push(duration);
    }
  }

  const files = {};
  for (const [file, durations] of Object.entries(byFile).sort(([a], [b]) => a.localeCompare(b))) {
    files[file] = stats(durations);
  }

  return {
    total: stats(totals),
    files,
  };
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function capturePlatformTiming({ platform, out, runs: runCount }) {
  assertPlatform(platform);
  assertPositiveInteger(runCount, '--runs');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-test-timing-'));
  const parsedRuns = [];

  try {
    for (let i = 0; i < runCount; i++) {
      const xmlPath = path.join(tempDir, `junit-${i}.xml`);
      run('bun', ['test', '--reporter=junit', '--reporter-outfile', xmlPath], {
        env: {
          ...process.env,
          BUN_TEST_TIMEOUT: process.env.BUN_TEST_TIMEOUT || '30000',
        },
        stdio: ['ignore', 'pipe', 'inherit'],
      });
      parsedRuns.push(parseJUnitTiming(fs.readFileSync(xmlPath, 'utf-8')));
    }

    const aggregated = aggregateRuns(parsedRuns);
    const artifact = {
      metadata: {
        capturedAt: new Date().toISOString(),
        nodeVersion: process.version,
        bunVersion: getBunVersion(),
        upstreamVersion: getUpstreamVersion(),
        runs: runCount,
        partial: true,
      },
      platform,
      total: aggregated.total,
      files: aggregated.files,
    };

    writeJson(out, artifact);
    process.stderr.write(`Wrote ${platform} test timing artifact to ${out}\n`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function globToRegex(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

function walkJsonFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

function resolveInputFiles(input) {
  const resolved = path.resolve(input);
  if (fs.existsSync(resolved)) {
    const stat = fs.statSync(resolved);
    return stat.isDirectory() ? walkJsonFiles(resolved) : [resolved];
  }

  if (!/[*?]/.test(input)) {
    throw new Error(`Merge input not found: ${input}`);
  }

  const normalized = input.replace(/\\/g, '/');
  const firstWildcard = normalized.search(/[*?]/);
  const basePrefix = normalized.slice(0, firstWildcard);
  const baseDir = path.resolve(basePrefix.includes('/') ? basePrefix.slice(0, basePrefix.lastIndexOf('/')) : '.');
  const relPattern = path.relative(baseDir, path.resolve(input)).replace(/\\/g, '/');
  const regex = globToRegex(relPattern);

  return walkJsonFiles(baseDir).filter(file => regex.test(path.relative(baseDir, file).replace(/\\/g, '/')));
}

function readTimingArtifacts(input) {
  const artifacts = [];
  for (const file of resolveInputFiles(input)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
      if (parsed && parsed.platform && parsed.total && parsed.files) {
        artifacts.push({ file, value: parsed });
      }
    } catch {
      /* Ignore unrelated workflow JSON artifacts. */
    }
  }
  return artifacts;
}

function mergeTimingArtifacts(input, requiredPlatforms = ['linux', 'macos', 'windows']) {
  const artifacts = readTimingArtifacts(input);
  const byPlatform = new Map();
  for (const artifact of artifacts) {
    byPlatform.set(artifact.value.platform, artifact.value);
  }

  for (const platform of requiredPlatforms) {
    if (!byPlatform.has(platform)) {
      throw new Error(`Missing required platform artifact: ${platform}`);
    }
  }

  const platforms = {};
  const runs = [];
  for (const platform of requiredPlatforms) {
    const artifact = byPlatform.get(platform);
    platforms[platform] = {
      total: artifact.total,
      files: artifact.files,
    };
    if (artifact.metadata && Number.isInteger(artifact.metadata.runs)) {
      runs.push(artifact.metadata.runs);
    }
  }

  return {
    metadata: {
      capturedAt: new Date().toISOString(),
      nodeVersion: 'per-platform',
      bunVersion: 'per-platform',
      upstreamVersion: getUpstreamVersion(),
      runs: runs.length ? Math.min(...runs) : DEFAULT_RUNS,
      source: `merge:${input}`,
    },
    platforms,
  };
}

function main(argv = process.argv.slice(2)) {
  let options;
  try {
    options = parseArgs(argv);
    if (options.help) {
      printHelp();
      return 0;
    }

    if (!options.out) {
      throw new Error('--out is required');
    }

    if (options.merge) {
      const required = options.requirePlatforms || ['linux', 'macos', 'windows'];
      const merged = mergeTimingArtifacts(options.merge, required);
      writeJson(options.out, merged);
      process.stderr.write(`Wrote merged test timing baseline to ${options.out}\n`);
      return 0;
    }

    if (!options.platform) {
      throw new Error('--platform is required unless --merge is used');
    }

    capturePlatformTiming(options);
    return 0;
  } catch (err) {
    process.stderr.write(`Error [ETIMING]: ${err.message}\n`);
    process.stderr.write('  Hint: run node scripts/bench-test-timing.js --help for usage.\n');
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  aggregateRuns,
  capturePlatformTiming,
  main,
  mergeTimingArtifacts,
  parseArgs,
  parseJUnitTiming,
  resolveInputFiles,
};
