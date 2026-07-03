#!/usr/bin/env node
'use strict';

/* eslint-disable security/detect-non-literal-fs-filename -- CI smoke helper writes only under caller-supplied temp roots after containment checks. */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULT_PACKAGE_SPEC = '@chude/get-stuff-done@latest';
const PNPM_VERSION = '10.17.1';
const SUPPORTED_PACKAGE_MANAGERS = new Set(['npm', 'pnpm', 'bun']);
const REQUIRED_PROVENANCE_KEYS = [
  'packageName',
  'version',
  'upstreamPackage',
  'upstreamVersion',
  'overlayManifestSha256',
];

function printHelp(stream = process.stdout) {
  stream.write(`cousin-smoke - cold-install @chude/get-stuff-done and verify runtime provenance

USAGE
  node scripts/cousin-smoke.js --package-manager <npm|pnpm|bun> --temp-root <path> [--package <spec>]

OPTIONS
  --package-manager <npm|pnpm|bun>  Package manager used for the cold install.
  --package <spec>                  Package spec or packed tarball path. Default: ${DEFAULT_PACKAGE_SPEC}
  --temp-root <path>                Runner temp root used for HOME, USERPROFILE, CLAUDE_CONFIG_DIR, and GSD_CI_SMOKE_DIR.
  -h, --help                        Show this help.

VERIFY
  Runs the installed local gsd bin with --version --json and validates packageName,
  version, upstreamPackage, upstreamVersion, and overlayManifestSha256.
`);
}

function optionValue(arg, flag) {
  if (arg === flag) return { matches: true };
  if (arg.startsWith(`${flag}=`)) return { matches: true, value: arg.slice(flag.length + 1) };
  return { matches: false };
}

function takeValue(queue, flag) {
  const next = queue.shift();
  if (!next || next.startsWith('-')) {
    throw new Error(`Missing value for ${flag}`);
  }
  return next;
}

function parseArgs(argv) {
  const options = {
    packageSpec: DEFAULT_PACKAGE_SPEC,
    help: false,
  };

  const queue = [...argv];
  while (queue.length > 0) {
    const arg = queue.shift();

    if (arg === '-h' || arg === '--help') {
      options.help = true;
      continue;
    }

    const packageManager = optionValue(arg, '--package-manager');
    if (packageManager.matches) {
      options.packageManager = packageManager.value === undefined
        ? takeValue(queue, '--package-manager')
        : packageManager.value;
      continue;
    }

    const packageSpec = optionValue(arg, '--package');
    if (packageSpec.matches) {
      options.packageSpec = packageSpec.value === undefined
        ? takeValue(queue, '--package')
        : packageSpec.value;
      continue;
    }

    const tempRoot = optionValue(arg, '--temp-root');
    if (tempRoot.matches) {
      options.tempRoot = tempRoot.value === undefined
        ? takeValue(queue, '--temp-root')
        : tempRoot.value;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  if (options.help) return options;

  if (!options.packageManager) {
    throw new Error('--package-manager is required');
  }
  if (!SUPPORTED_PACKAGE_MANAGERS.has(options.packageManager)) {
    throw new Error(`Unsupported package manager: ${options.packageManager}`);
  }
  if (!options.tempRoot) {
    throw new Error('--temp-root is required');
  }

  return options;
}

function assertInside(parent, child, label) {
  const parentPath = path.resolve(parent);
  const childPath = path.resolve(child);
  if (childPath !== parentPath && !childPath.startsWith(parentPath + path.sep)) {
    throw new Error(`${label} must be inside temp root`);
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function createSmokeContext({ packageManager, packageSpec, tempRoot, env = process.env }) {
  const resolvedTempRoot = path.resolve(tempRoot);
  ensureDir(resolvedTempRoot);

  const projectDir = fs.mkdtempSync(path.join(resolvedTempRoot, 'project-'));
  const homeDir = ensureDir(path.join(resolvedTempRoot, 'home'));
  const userProfileDir = ensureDir(path.join(resolvedTempRoot, 'userprofile'));
  const claudeConfigDir = ensureDir(path.join(resolvedTempRoot, 'claude-config'));
  const gsdSmokeDir = ensureDir(path.join(resolvedTempRoot, 'gsd-ci-smoke'));
  const corepackHome = ensureDir(path.join(resolvedTempRoot, 'corepack'));
  const bunInstall = ensureDir(path.join(resolvedTempRoot, 'bun'));
  const npmrcPath = path.join(projectDir, '.npmrc');

  for (const [label, dirPath] of [
    ['projectDir', projectDir],
    ['HOME', homeDir],
    ['USERPROFILE', userProfileDir],
    ['CLAUDE_CONFIG_DIR', claudeConfigDir],
    ['GSD_CI_SMOKE_DIR', gsdSmokeDir],
    ['COREPACK_HOME', corepackHome],
    ['BUN_INSTALL', bunInstall],
    ['NPM_CONFIG_USERCONFIG', npmrcPath],
  ]) {
    assertInside(resolvedTempRoot, dirPath, label);
  }

  const smokeEnv = {
    ...env,
    HOME: homeDir,
    USERPROFILE: userProfileDir,
    CLAUDE_CONFIG_DIR: claudeConfigDir,
    GSD_CI_SMOKE_DIR: gsdSmokeDir,
    COREPACK_HOME: corepackHome,
    BUN_INSTALL: bunInstall,
    NPM_CONFIG_USERCONFIG: npmrcPath,
    npm_config_userconfig: npmrcPath,
  };

  if (env.NODE_AUTH_TOKEN) {
    fs.writeFileSync(npmrcPath, `//registry.npmjs.org/:_authToken=${env.NODE_AUTH_TOKEN}\n`, 'utf8');
  }

  if (packageManager !== 'npm') {
    fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({
      private: true,
      name: 'gsd-cousin-smoke',
      version: '0.0.0',
    }, null, 2), 'utf8');
  }

  return {
    packageManager,
    packageSpec,
    tempRoot: resolvedTempRoot,
    projectDir,
    npmrcPath,
    env: smokeEnv,
  };
}

function localBinPath(projectDir, binName = 'gsd', platform = process.platform) {
  const binDir = path.join(projectDir, 'node_modules', '.bin');
  const candidates = platform === 'win32'
    ? [`${binName}.cmd`, `${binName}.exe`, `${binName}.bunx`, binName]
    : [binName];

  for (const candidate of candidates) {
    const candidatePath = path.join(binDir, candidate);
    if (fs.existsSync(candidatePath)) return candidatePath;
  }

  return path.join(binDir, candidates[0]);
}

function installSteps(packageManager, packageSpec) {
  if (packageManager === 'npm') {
    return [
      { command: 'npm', args: ['init', '-y'] },
      { command: 'npm', args: ['install', packageSpec] },
    ];
  }
  if (packageManager === 'pnpm') {
    return [{
      command: 'corepack',
      args: [
        `pnpm@${PNPM_VERSION}`,
        'add',
        '--allow-build=@anthropic-ai/claude-code',
        '--allow-build=@chude/get-stuff-done',
        packageSpec,
      ],
    }];
  }
  if (packageManager === 'bun') {
    return [{ command: 'bun', args: ['add', packageSpec] }];
  }
  throw new Error(`Unsupported package manager: ${packageManager}`);
}

function tokenValues(env) {
  return Object.entries(env)
    .filter(([key, value]) => /TOKEN|AUTH|SECRET|PASSWORD/i.test(key) && typeof value === 'string' && value.length > 0)
    .map(([, value]) => value);
}

function redactOutput(value, env = process.env) {
  let output = value === null || value === undefined ? '' : String(value);
  for (const token of tokenValues(env)) {
    output = output.split(token).join('[REDACTED]');
  }
  return output;
}

function runStep(step, context, runner) {
  const result = runner(step.command, step.args, {
    cwd: context.projectDir,
    env: context.env,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error || result.status !== 0) {
    const stdout = redactOutput(result.stdout, context.env);
    const stderr = redactOutput(result.stderr || (result.error && result.error.message), context.env);
    throw new Error([
      `Command failed: ${step.command} ${step.args.join(' ')}`,
      `status: ${result.status}`,
      stdout && `stdout: ${stdout}`,
      stderr && `stderr: ${stderr}`,
    ].filter(Boolean).join('\n'));
  }

  return result;
}

function parseJsonOutput(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse gsd --version --json output: ${error.message}`);
  }
}

function assertProvenanceValue(key, value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required provenance key: ${key}`);
  }
}

function validateProvenance(provenance) {
  assertProvenanceValue('packageName', provenance.packageName);
  assertProvenanceValue('version', provenance.version);
  assertProvenanceValue('upstreamPackage', provenance.upstreamPackage);
  assertProvenanceValue('upstreamVersion', provenance.upstreamVersion);
  assertProvenanceValue('overlayManifestSha256', provenance.overlayManifestSha256);
  return provenance;
}

function defaultRunner(command, args, options) {
  return spawnSync(command, args, options);
}

function runCousinSmoke(options) {
  const runner = options.runner || defaultRunner;
  const context = createSmokeContext(options);

  for (const step of installSteps(context.packageManager, context.packageSpec)) {
    runStep(step, context, runner);
  }

  const binPath = localBinPath(context.projectDir);
  const versionResult = runStep({ command: binPath, args: ['--version', '--json'] }, context, runner);
  const provenance = validateProvenance(parseJsonOutput(versionResult.stdout));

  return {
    ...context,
    binPath,
    provenance,
  };
}

function main(argv = process.argv.slice(2), io = process) {
  try {
    const options = parseArgs(argv);
    if (options.help) {
      printHelp(io.stdout);
      return 0;
    }

    const result = runCousinSmoke(options);
    io.stdout.write(`Cousin smoke passed: ${result.packageManager} ${result.provenance.packageName} ${result.provenance.version}\n`);
    return 0;
  } catch (error) {
    io.stderr.write(`Error [ECOUSIN]: ${redactOutput(error.message)}\n`);
    io.stderr.write('  Hint: run node scripts/cousin-smoke.js --help for usage.\n');
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  DEFAULT_PACKAGE_SPEC,
  PNPM_VERSION,
  REQUIRED_PROVENANCE_KEYS,
  SUPPORTED_PACKAGE_MANAGERS,
  createSmokeContext,
  installSteps,
  localBinPath,
  main,
  parseArgs,
  redactOutput,
  runCousinSmoke,
  validateProvenance,
};
