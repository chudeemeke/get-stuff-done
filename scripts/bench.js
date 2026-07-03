#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const DEFAULT_WARMUP = 3;
const DEFAULT_RUNS = 5;
const VALID_PLATFORMS = new Set(['linux', 'macos', 'windows']);

function printHelp(stream = process.stdout) {
  stream.write(`bench - capture or merge install/compose benchmark metrics

USAGE
  node scripts/bench.js --platform <linux|macos|windows> --out <file>
  node scripts/bench.js --merge <dir-or-glob> --require-platforms linux,macos,windows --out <file>

OPTIONS
  --platform <name>           Platform name for a one-platform artifact.
  --out <file>                Output JSON file.
  --merge <dir-or-glob>       Merge per-platform JSON artifacts.
  --require-platforms <list>  Comma-separated platforms required during merge.
  --runs <n>                  Hyperfine runs per benchmark. Default: 5.
  --warmup <n>                Hyperfine warmup runs. Default: 3.
  -h, --help                  Show this help.

EXAMPLES
  node scripts/bench.js --platform linux --out perf-linux.json
  node scripts/bench.js --merge artifacts --require-platforms linux,macos,windows --out perf-baseline.json
`);
}

function parseArgs(argv) {
  const options = {
    runs: DEFAULT_RUNS,
    warmup: DEFAULT_WARMUP,
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
    } else if (flag === '--merge' && value) {
      options.merge = value;
      if (consumed) i++;
    } else if (flag === '--require-platforms' && value) {
      options.requirePlatforms = value.split(',').map(item => item.trim()).filter(Boolean);
      if (consumed) i++;
    } else if (flag === '--runs' && value) {
      options.runs = Number(value);
      if (consumed) i++;
    } else if (flag === '--warmup' && value) {
      options.warmup = Number(value);
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
    throw new Error(`Invalid platform '${platform}'. Expected one of: linux, macos, windows`);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || PROJECT_ROOT,
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

function getHyperfineVersion() {
  return run('hyperfine', ['--version']);
}

function getUpstreamVersion() {
  const packageJson = readJson(path.join(PROJECT_ROOT, 'package.json'));
  return packageJson.devDependencies && packageJson.devDependencies['@opengsd/gsd-core']
    ? packageJson.devDependencies['@opengsd/gsd-core']
    : 'unknown';
}

function ms(value) {
  return Math.round(Number(value || 0) * 1000);
}

function metricFromHyperfineResult(result) {
  return {
    mean_ms: ms(result.mean),
    stddev_ms: ms(result.stddev),
    min_ms: ms(result.min),
    max_ms: ms(result.max),
    samples: Array.isArray(result.times) && result.times.length > 0
      ? result.times.length
      : 1,
  };
}

function classifyCommand(command) {
  if (/bun\s+install/.test(command)) return 'install';
  if (/bun\s+run\s+compose/.test(command)) return 'compose';
  return null;
}

function normalizeHyperfineResults(raw, requiredKeys = ['install', 'compose']) {
  if (!raw || !Array.isArray(raw.results)) {
    throw new Error('Invalid hyperfine JSON: expected results array');
  }

  const normalized = {};
  for (const result of raw.results) {
    const key = classifyCommand(result.command || '');
    if (!key) continue;
    normalized[key] = metricFromHyperfineResult(result);
  }

  for (const key of requiredKeys) {
    if (!normalized[key]) {
      throw new Error(`Hyperfine output missing ${key} benchmark result`);
    }
  }

  return normalized;
}

function quoteShellArg(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function buildInstallHyperfineArgs({ scratchDir, outputFile, runs = DEFAULT_RUNS, warmup = DEFAULT_WARMUP }) {
  const scratchNodeModules = path.join(scratchDir, 'node_modules');
  const prepare = [
    'node',
    '-e',
    quoteShellArg("require('fs').rmSync(process.argv[1],{recursive:true,force:true})"),
    quoteShellArg(scratchNodeModules),
  ].join(' ');
  const installCommand = [
    'bun install --ignore-scripts --cwd',
    quoteShellArg(scratchDir),
  ].join(' ');

  return [
    '--warmup', String(warmup),
    '--runs', String(runs),
    '--export-json', outputFile,
    '--prepare', prepare,
    installCommand,
  ];
}

function buildComposeHyperfineArgs({ outputFile, runs = DEFAULT_RUNS, warmup = DEFAULT_WARMUP }) {
  return [
    '--warmup', String(warmup),
    '--runs', String(runs),
    '--export-json', outputFile,
    'bun run compose',
  ];
}

function copyInstallManifests(scratchDir) {
  fs.mkdirSync(scratchDir, { recursive: true });
  for (const name of ['package.json', 'bun.lock']) {
    fs.copyFileSync(path.join(PROJECT_ROOT, name), path.join(scratchDir, name));
  }
}

function runHyperfine(args, cwd = PROJECT_ROOT) {
  run('hyperfine', args, { cwd, stdio: ['ignore', 'inherit', 'pipe'] });
}

function createPartialBaseline(platform, metrics, metadataOverrides = {}) {
  return {
    metadata: {
      capturedAt: new Date().toISOString(),
      nodeVersion: process.version,
      bunVersion: metadataOverrides.bunVersion || getBunVersion(),
      upstreamVersion: metadataOverrides.upstreamVersion || getUpstreamVersion(),
      hyperfineVersion: metadataOverrides.hyperfineVersion || getHyperfineVersion(),
    },
    platform,
    install: metrics.install,
    compose: metrics.compose,
  };
}

function capturePlatformBaseline({ platform, out, runs, warmup }) {
  assertPlatform(platform);
  assertPositiveInteger(runs, '--runs');
  assertPositiveInteger(warmup, '--warmup');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-bench-'));
  const scratchDir = path.join(tempDir, 'install-scratch');
  const installOut = path.join(tempDir, 'install-hyperfine.json');
  const composeOut = path.join(tempDir, 'compose-hyperfine.json');

  try {
    copyInstallManifests(scratchDir);
    runHyperfine(buildInstallHyperfineArgs({ scratchDir, outputFile: installOut, runs, warmup }));
    runHyperfine(buildComposeHyperfineArgs({ outputFile: composeOut, runs, warmup }));

    const metrics = {
      install: normalizeHyperfineResults({ results: readJson(installOut).results }, ['install']).install,
      compose: normalizeHyperfineResults({ results: readJson(composeOut).results }, ['compose']).compose,
    };
    const partial = createPartialBaseline(platform, metrics);
    writeJson(out, partial);
    process.stderr.write(`Wrote ${platform} perf artifact to ${out}\n`);
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

function readPartialArtifacts(input) {
  const artifacts = [];
  for (const file of resolveInputFiles(input)) {
    try {
      const parsed = readJson(file);
      if (parsed && parsed.platform && parsed.install && parsed.compose) {
        artifacts.push({ file, value: parsed });
      }
    } catch {
      /* Ignore non-JSON artifacts in downloaded workflow directories. */
    }
  }
  return artifacts;
}

function mergeBaselineArtifacts(input, requiredPlatforms = ['linux', 'macos', 'windows']) {
  const artifacts = readPartialArtifacts(input);
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
  for (const platform of requiredPlatforms) {
    const artifact = byPlatform.get(platform);
    platforms[platform] = {
      install: artifact.install,
      compose: artifact.compose,
    };
  }

  return {
    metadata: {
      capturedAt: new Date().toISOString(),
      nodeVersion: 'per-platform',
      bunVersion: 'per-platform',
      upstreamVersion: getUpstreamVersion(),
      hyperfineVersion: 'per-platform',
      source: `merge:${input}`,
    },
    platforms,
    acceptedRegressions: [],
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
      const merged = mergeBaselineArtifacts(options.merge, required);
      writeJson(options.out, merged);
      process.stderr.write(`Wrote merged perf baseline to ${options.out}\n`);
      return 0;
    }

    if (!options.platform) {
      throw new Error('--platform is required unless --merge is used');
    }

    capturePlatformBaseline(options);
    return 0;
  } catch (err) {
    process.stderr.write(`Error [EBENCH]: ${err.message}\n`);
    process.stderr.write('  Hint: run node scripts/bench.js --help for usage.\n');
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  buildComposeHyperfineArgs,
  buildInstallHyperfineArgs,
  capturePlatformBaseline,
  main,
  mergeBaselineArtifacts,
  normalizeHyperfineResults,
  parseArgs,
  quoteShellArg,
  resolveInputFiles,
};
