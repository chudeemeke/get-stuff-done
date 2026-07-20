#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const Ajv = require('ajv');
const {
  SCHEDULER,
  canonicalSha256,
  capturePairedComparison,
} = require('./lib/paired-perf');

const PROJECT_ROOT = path.join(__dirname, '..');
const DEFAULT_WARMUP = 3;
const DEFAULT_RUNS = 5;
const DEFAULT_PAIRS = 10;
const VALID_PLATFORMS = new Set(['linux', 'macos', 'windows']);
const PAIRED_COMMANDS = {
  install: 'bun install --frozen-lockfile --ignore-scripts',
  compose: 'bun run compose',
};

function printHelp(stream = process.stdout) {
  stream.write(`bench - capture or merge install/compose benchmark metrics

USAGE
  node scripts/bench.js --paired --reference-worktree <dir> --candidate-worktree <dir> --runner-image <id> --out <file>
  node scripts/bench.js --platform <linux|macos|windows> --out <file>
  node scripts/bench.js --merge <dir-or-glob> --require-platforms linux,macos,windows --out <file>

OPTIONS
  --paired                    Capture blocking same-run paired evidence.
  --reference-worktree <dir> Reference Git worktree; HEAD is resolved at execution.
  --candidate-worktree <dir> Candidate Git worktree; HEAD is resolved at execution.
  --runner-image <id>         Expected observed runner image or OS fingerprint.
  --pairs <n>                 Measured reference/candidate pairs. Minimum: 10.
  --platform <name>           Platform name for a one-platform artifact.
  --out <file>                Output JSON file.
  --merge <dir-or-glob>       Merge per-platform JSON artifacts.
  --require-platforms <list>  Comma-separated platforms required during merge.
  --runs <n>                  Hyperfine runs per benchmark. Default: 5.
  --warmup <n>                Hyperfine warmup runs. Default: 3.
  -h, --help                  Show this help.

EXAMPLES
  node scripts/bench.js --paired --reference-worktree ../base --candidate-worktree . --runner-image windows-2025 --out perf-comparison.json
  node scripts/bench.js --platform linux --out perf-linux.json
  node scripts/bench.js --merge artifacts --require-platforms linux,macos,windows --out perf-baseline.json
`);
}

function parseArgs(argv) {
  const options = {
    runs: DEFAULT_RUNS,
    warmup: DEFAULT_WARMUP,
    pairs: DEFAULT_PAIRS,
    runsSpecified: false,
    pairsSpecified: false,
    paired: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const [flag, inlineValue] = arg.split('=', 2);
    const value = inlineValue === undefined ? argv[i + 1] : inlineValue;
    const consumed = inlineValue === undefined;

    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '--paired') {
      options.paired = true;
    } else if (flag === '--reference-worktree' && value) {
      options.referenceWorktree = path.resolve(value);
      if (consumed) i++;
    } else if (flag === '--candidate-worktree' && value) {
      options.candidateWorktree = path.resolve(value);
      if (consumed) i++;
    } else if (flag === '--runner-image' && value) {
      options.runnerImage = value;
      if (consumed) i++;
    } else if (flag === '--pairs' && value) {
      options.pairs = Number(value);
      options.pairsSpecified = true;
      if (consumed) i++;
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
      options.runsSpecified = true;
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

function runResult(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || PROJECT_ROOT,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });
  if (result.error) throw result.error;
  return result;
}

function readFileBuffer(filePath) {
  // Paired paths are rooted in validated clean Git worktrees or this harness.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return fs.readFileSync(filePath);
}

function createPairedRuntime(overrides = {}) {
  return {
    run,
    spawn: runResult,
    readFile: readFileBuffer,
    readJson,
    platform: os.platform,
    architecture: os.arch,
    cpu: () => (os.cpus().at(0) || {}).model || 'unavailable',
    runnerImage: () => [normalizedPlatform(os.platform()), os.release(), os.version()].join(':'),
    now: () => new Date().toISOString(),
    ...overrides,
  };
}

function sha256Bytes(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizedPlatform(value) {
  if (value === 'win32') return 'windows';
  if (value === 'darwin') return 'macos';
  return value;
}

function exactToolVersion(output, tool) {
  const match = String(output).match(/(?:^|\s)v?(\d+\.\d+\.\d+)(?:\s|$)/);
  if (!match) throw new Error(`Unable to resolve exact ${tool} version from '${output}'`);
  return match[1];
}

function resolveSubject(worktree, dependencies) {
  const commit = dependencies.run('git', ['-C', worktree, 'rev-parse', 'HEAD']).trim();
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error(`Invalid Git HEAD for worktree: ${worktree}`);
  const status = dependencies.run(
    'git',
    ['-C', worktree, 'status', '--porcelain=v1', '--untracked-files=all']
  );
  if (status.trim()) throw new Error(`Paired benchmark worktree is not clean: ${worktree}`);

  return {
    commit,
    packageSha256: sha256Bytes(dependencies.readFile(path.join(worktree, 'package.json'))),
    lockSha256: sha256Bytes(dependencies.readFile(path.join(worktree, 'bun.lock'))),
    upstreamAuthoritySha256: sha256Bytes(
      dependencies.readFile(path.join(worktree, '.planning', 'upstream-authority.json'))
    ),
  };
}

function resolveSharedControls(dependencies) {
  const harnessFiles = {
    benchSha256: sha256Bytes(dependencies.readFile(__filename)),
    domainSha256: sha256Bytes(dependencies.readFile(require.resolve('./lib/paired-perf'))),
  };
  return {
    harnessSha256: canonicalSha256(harnessFiles),
    workloadSha256: canonicalSha256({
      isolation: 'fresh-tracked-snapshot-per-sample-v1',
      metrics: ['install', 'compose'],
    }),
    schedulerSha256: canonicalSha256({
      algorithm: 'seed-first-byte-parity-then-alternate',
      name: SCHEDULER,
    }),
    commandTemplateSha256: canonicalSha256(PAIRED_COMMANDS),
  };
}

function assertIdentityValue(value, label) {
  const placeholders = new Set(['unknown', 'unavailable', 'n/a']);
  if (typeof value !== 'string' || value !== value.trim() ||
      !value || placeholders.has(value.toLowerCase())) {
    throw new Error(`${label} must be a normalized non-placeholder identity`);
  }
  return value;
}

function resolveExecutionIdentity(runnerImageExpected, dependencies) {
  const runnerImage = assertIdentityValue(dependencies.runnerImage(), 'observed runner image');
  assertIdentityValue(runnerImageExpected, '--runner-image');
  if (runnerImage !== runnerImageExpected) {
    throw new Error(`Observed runner image '${runnerImage}' does not match expected runner image '${runnerImageExpected}'`);
  }
  return {
    platform: normalizedPlatform(dependencies.platform()),
    architecture: dependencies.architecture(),
    cpu: dependencies.cpu(),
    runnerImage,
    runnerImageExpected,
    nodeVersion: process.version,
    bunVersion: exactToolVersion(dependencies.run('bun', ['--version']), 'Bun'),
    hyperfineVersion: exactToolVersion(
      dependencies.run('hyperfine', ['--version']),
      'Hyperfine'
    ),
  };
}

function buildPairedCaptureContext(options, overrides = {}) {
  assertPositiveInteger(options.pairs, '--pairs');
  if (options.pairs < 10) throw new Error('--pairs must be at least 10');
  assertPositiveInteger(options.warmup, '--warmup');
  assertIdentityValue(options.runnerImage, '--runner-image');

  const dependencies = createPairedRuntime(overrides);
  const subjects = {
    reference: resolveSubject(options.referenceWorktree, dependencies),
    candidate: resolveSubject(options.candidateWorktree, dependencies),
  };
  const controls = resolveSharedControls(dependencies);

  return {
    spec: {
      capturedAt: dependencies.now(),
      executionIdentity: resolveExecutionIdentity(options.runnerImage, dependencies),
      controls,
      subjects,
      measuredPairs: options.pairs,
      warmupRuns: options.warmup,
    },
    worktrees: {
      reference: options.referenceWorktree,
      candidate: options.candidateWorktree,
    },
  };
}

function assertTrackedPath(worktree, relativePath) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error(`Invalid tracked path '${relativePath}' in ${worktree}`);
  }
  const source = path.resolve(worktree, relativePath);
  const relative = path.relative(path.resolve(worktree), source);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Tracked path escapes worktree: ${relativePath}`);
  }
  return source;
}

function createTrackedSandbox(worktree, dependencies) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-paired-sample-'));
  const workspace = path.join(root, 'workspace');
  try {
    // Workspace is a fixed child of the process-created temporary root.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdirSync(workspace, { recursive: true });
    const tracked = dependencies.run('git', ['-C', worktree, 'ls-files', '-z'])
      .split('\0')
      .filter(Boolean);
    for (const relativePath of tracked) {
      const source = assertTrackedPath(worktree, relativePath);
      const destination = path.join(workspace, relativePath);
      // Destination is constrained to a validated tracked path under workspace.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.cpSync(source, destination, { dereference: false, recursive: true });
    }
    return { root, workspace };
  } catch (err) {
    fs.rmSync(root, { recursive: true, force: true });
    throw err;
  }
}

function prepareSandbox(metric, sandbox, dependencies) {
  if (metric === 'install') return 0;
  const result = dependencies.spawn(
    'bun',
    ['install', '--frozen-lockfile', '--ignore-scripts'],
    { cwd: sandbox.workspace }
  );
  return Number.isInteger(result.status) ? result.status : 1;
}

function measureSandbox(metric, sandbox, dependencies) {
  const outputFile = path.join(sandbox.root, 'hyperfine.json');
  const command = metric === 'install' ? PAIRED_COMMANDS.install : PAIRED_COMMANDS.compose;
  const result = dependencies.spawn('hyperfine', [
    '--warmup', '0',
    '--runs', '1',
    '--export-json', outputFile,
    command,
  ], { cwd: sandbox.workspace });
  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    throw new Error(`Hyperfine sample failed${stderr ? `: ${stderr}` : ''}`);
  }
  return parseHyperfineSample(dependencies.readJson(outputFile));
}

function cleanupSandbox(sandbox) {
  fs.rmSync(sandbox.root, { recursive: true, force: true });
}

function assertSameResolvedValue(label, actual, expected) {
  if (canonicalSha256(actual) !== canonicalSha256(expected)) {
    throw new Error(`${label} changed during paired benchmark capture`);
  }
}

function createPairedBenchmarkExecutor(context, overrides = {}) {
  const runtime = createPairedRuntime(overrides);
  const dependencies = {
    resolveExecutionIdentity: overrides.resolveExecutionIdentity || (() => (
      resolveExecutionIdentity(context.spec.executionIdentity.runnerImageExpected, runtime)
    )),
    resolveControls: overrides.resolveControls || (() => resolveSharedControls(runtime)),
    resolveSubject: overrides.resolveSubject || (worktree => resolveSubject(worktree, runtime)),
    createSandbox: overrides.createSandbox || (worktree => createTrackedSandbox(worktree, runtime)),
    prepare: overrides.prepare || ((metric, sandbox) => prepareSandbox(metric, sandbox, runtime)),
    measure: overrides.measure || ((metric, sandbox) => measureSandbox(metric, sandbox, runtime)),
    cleanup: overrides.cleanup || cleanupSandbox,
  };

  return request => {
    const worktree = request.subject === 'reference'
      ? context.worktrees.reference
      : context.worktrees.candidate;
    const expectedSubject = request.subject === 'reference'
      ? context.spec.subjects.reference
      : context.spec.subjects.candidate;
    const inspect = () => {
      const identity = dependencies.resolveExecutionIdentity();
      const controls = dependencies.resolveControls();
      const subject = dependencies.resolveSubject(worktree);
      assertSameResolvedValue('execution identity', identity, context.spec.executionIdentity);
      assertSameResolvedValue('shared controls', controls, context.spec.controls);
      assertSameResolvedValue(`${request.subject} subject`, subject, expectedSubject);
      if (canonicalSha256(identity) !== request.executionIdentitySha256) {
        throw new Error('resolved execution identity does not match scheduled evidence');
      }
      if (canonicalSha256(subject) !== request.subjectSha256) {
        throw new Error('resolved subject does not match scheduled evidence');
      }
      return subject;
    };

    const before = inspect();
    const sandbox = dependencies.createSandbox(worktree, request);
    try {
      const preparationExitCode = dependencies.prepare(request.metric, sandbox, request);
      if (preparationExitCode !== 0) throw new Error('sample preparation failed');
      const measurement = dependencies.measure(request.metric, sandbox, request);
      if (!measurement || measurement.benchmarkExitCode !== 0) {
        throw new Error('sample benchmark failed');
      }
      if (!Number.isSafeInteger(measurement.durationNs) || measurement.durationNs <= 0) {
        throw new Error('sample benchmark returned an invalid duration');
      }
      const after = inspect();

      return {
        subject: request.subject,
        executionIdentitySha256: request.executionIdentitySha256,
        resolvedCommit: before.commit,
        dirty: false,
        preparationExitCode,
        benchmarkExitCode: measurement.benchmarkExitCode,
        durationNs: measurement.durationNs,
        controlsBeforeSha256: request.controlsSha256,
        controlsAfterSha256: request.controlsSha256,
        subjectBeforeSha256: canonicalSha256(before),
        subjectAfterSha256: canonicalSha256(after),
      };
    } finally {
      dependencies.cleanup(sandbox);
    }
  };
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

function parseHyperfineSample(raw) {
  if (!raw || !Array.isArray(raw.results) || raw.results.length !== 1) {
    throw new Error('Hyperfine output must contain exactly one benchmark result');
  }
  const result = raw.results.at(0);
  if (!Array.isArray(result.times) || !Array.isArray(result.exit_codes) ||
      result.times.length !== 1 || result.exit_codes.length !== 1) {
    throw new Error('Hyperfine output must contain exactly one raw sample and exit code');
  }
  const benchmarkExitCode = result.exit_codes.at(0);
  if (benchmarkExitCode !== 0) throw new Error(`Hyperfine benchmark exit code was ${benchmarkExitCode}`);
  const durationNs = Math.round(result.times.at(0) * 1_000_000_000);
  if (!Number.isSafeInteger(durationNs) || durationNs <= 0) {
    throw new Error('Hyperfine raw sample must resolve to positive safe integer nanoseconds');
  }
  return { benchmarkExitCode, durationNs };
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

function validatePairedComparisonShape(comparison) {
  const schema = readJson(path.join(PROJECT_ROOT, 'config', 'perf-comparison.schema.json'));
  const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
  if (!validate(comparison)) {
    const details = (validate.errors || [])
      .map(error => `${error.instancePath || error.schemaPath} ${error.message}`)
      .join('; ');
    throw new Error(`Invalid captured paired comparison: ${details}`);
  }
}

function assertPairedOptions(options) {
  if (!options.referenceWorktree) throw new Error('--reference-worktree is required with --paired');
  if (!options.candidateWorktree) throw new Error('--candidate-worktree is required with --paired');
  if (!options.runnerImage) throw new Error('--runner-image is required with --paired');
  if (options.platform || options.merge || options.requirePlatforms || options.runsSpecified) {
    throw new Error('--paired cannot be mixed with legacy platform, merge, or runs options');
  }
}

function capturePairedArtifact(options, overrides = {}) {
  assertPairedOptions(options);
  const context = buildPairedCaptureContext(options, overrides);
  const executor = createPairedBenchmarkExecutor(context, overrides);
  const comparison = capturePairedComparison(context.spec, executor);
  validatePairedComparisonShape(comparison);
  writeJson(options.out, comparison);
  return comparison;
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

    if (options.paired) {
      capturePairedArtifact(options);
      process.stderr.write(`Wrote paired perf comparison to ${options.out}\n`);
      return 0;
    }

    if (options.pairsSpecified || options.referenceWorktree ||
        options.candidateWorktree || options.runnerImage) {
      throw new Error('paired benchmark options require --paired');
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
  buildPairedCaptureContext,
  buildComposeHyperfineArgs,
  buildInstallHyperfineArgs,
  capturePairedArtifact,
  capturePlatformBaseline,
  createPairedBenchmarkExecutor,
  main,
  mergeBaselineArtifacts,
  normalizeHyperfineResults,
  parseHyperfineSample,
  parseArgs,
  quoteShellArg,
  resolveInputFiles,
};
