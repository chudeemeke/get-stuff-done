#!/usr/bin/env node
'use strict';

/* eslint-disable security/detect-non-literal-fs-filename -- Upgrade verification writes only inside caller-controlled temp roots and a copied workspace. */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  getActivePackageName,
  validatePinnedVersion,
} = require('./lib/upstream-source');

const PROJECT_ROOT = path.join(__dirname, '..');
const DEFAULT_REGISTRY_URL = 'http://localhost:4873/';
const EXACT_VERSION_MESSAGE = 'exact stable version required';
const STEP_NAMES = [
  'pack-current',
  'publish-current',
  'install-from',
  'bump-upstream',
  'compose',
  'pack-bumped',
  'publish-bumped',
  'reinstall-to',
  'smoke-verify',
];
const COPY_EXCLUDES = new Set([
  '.git',
  '.claude',
  '.upstream',
  'node_modules',
  'dist',
  'coverage',
  '.turbo',
  '.next',
]);

function printHelp(stream = process.stdout) {
  stream.write(`verify-upgrade - temp-isolated Open GSD upgrade verification

USAGE
  node scripts/verify-upgrade.js --from <x.y.z> --to <x.y.z> [options]

OPTIONS
  --from <x.y.z>              Current exact stable upstream version pin.
  --to <x.y.z>                Target exact stable upstream version pin.
  --registry-url <url>        Local registry URL. Default: ${DEFAULT_REGISTRY_URL}
  --json                      Emit the structured report as JSON to stdout.
  --temp-root <path>          Root used for registry, workspace, install target, HOME, npmrc, and cache.
  --skip-verdaccio-health     Skip the npm ping preflight for local/unit runs.
  --report <path>             Write the structured report JSON to a file.
  -h, --help                  Show this help.

REPORT
  The JSON report includes fromVersion, toVersion, registryUrl, packageTarball,
  packedArtifact, composeResult, reinstallTarget, smokeCommands, durationMs,
  changedOverrides, steps, warnings, and exitClassification.
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
    registryUrl: DEFAULT_REGISTRY_URL,
    json: false,
    help: false,
    skipVerdaccioHealth: false,
  };

  const queue = [...argv];
  while (queue.length > 0) {
    const arg = queue.shift();

    if (arg === '-h' || arg === '--help') {
      options.help = true;
      continue;
    }
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--skip-verdaccio-health') {
      options.skipVerdaccioHealth = true;
      continue;
    }

    const fromVersion = optionValue(arg, '--from');
    if (fromVersion.matches) {
      options.fromVersion = fromVersion.value === undefined
        ? takeValue(queue, '--from')
        : fromVersion.value;
      continue;
    }

    const toVersion = optionValue(arg, '--to');
    if (toVersion.matches) {
      options.toVersion = toVersion.value === undefined
        ? takeValue(queue, '--to')
        : toVersion.value;
      continue;
    }

    const registryUrl = optionValue(arg, '--registry-url');
    if (registryUrl.matches) {
      options.registryUrl = registryUrl.value === undefined
        ? takeValue(queue, '--registry-url')
        : registryUrl.value;
      continue;
    }

    const tempRoot = optionValue(arg, '--temp-root');
    if (tempRoot.matches) {
      options.tempRoot = tempRoot.value === undefined
        ? takeValue(queue, '--temp-root')
        : tempRoot.value;
      continue;
    }

    const reportPath = optionValue(arg, '--report');
    if (reportPath.matches) {
      options.reportPath = reportPath.value === undefined
        ? takeValue(queue, '--report')
        : reportPath.value;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  if (options.help) return options;
  requireExactStableVersion('--from', options.fromVersion);
  requireExactStableVersion('--to', options.toVersion);
  return options;
}

function requireExactStableVersion(field, version) {
  try {
    validatePinnedVersion(version);
  } catch {
    throw new Error(`${field} ${EXACT_VERSION_MESSAGE}: ${String(version)}`);
  }
  return version;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function assertInside(parent, child, label) {
  const parentPath = path.resolve(parent);
  const childPath = path.resolve(child);
  if (childPath !== parentPath && !childPath.startsWith(parentPath + path.sep)) {
    throw new Error(`${label} must be inside temp root`);
  }
}

function createVerifierContext({
  registryUrl = DEFAULT_REGISTRY_URL,
  tempRoot,
  env = process.env,
  projectRoot = PROJECT_ROOT,
}) {
  const root = path.resolve(tempRoot || fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-verify-upgrade-')));
  ensureDir(root);

  const registryDir = ensureDir(path.join(root, 'registry'));
  const workspaceDir = ensureDir(path.join(root, 'workspace'));
  const installTargetDir = ensureDir(path.join(root, 'install-target'));
  const homeDir = ensureDir(path.join(root, 'home'));
  const userProfileDir = ensureDir(path.join(root, 'userprofile'));
  const claudeConfigDir = ensureDir(path.join(root, 'claude-config'));
  const npmCacheDir = ensureDir(path.join(root, 'npm-cache'));
  const npmrcDir = ensureDir(path.join(root, 'npmrc'));
  const npmrcPath = path.join(npmrcDir, '.npmrc');

  for (const [label, dirPath] of [
    ['registry', registryDir],
    ['workspace', workspaceDir],
    ['install-target', installTargetDir],
    ['HOME', homeDir],
    ['USERPROFILE', userProfileDir],
    ['CLAUDE_CONFIG_DIR', claudeConfigDir],
    ['npm_config_cache', npmCacheDir],
    ['npm_config_userconfig', npmrcPath],
  ]) {
    assertInside(root, dirPath, label);
  }

  fs.writeFileSync(npmrcPath, `registry=${registryUrl}\n`, 'utf8');
  fs.writeFileSync(path.join(installTargetDir, 'package.json'), JSON.stringify({
    private: true,
    name: 'gsd-upgrade-install-target',
    version: '0.0.0',
  }, null, 2), 'utf8');

  return {
    registryUrl,
    root,
    projectRoot,
    registryDir,
    workspaceDir,
    installTargetDir,
    npmrcPath,
    env: {
      ...env,
      HOME: homeDir,
      USERPROFILE: userProfileDir,
      CLAUDE_CONFIG_DIR: claudeConfigDir,
      npm_config_userconfig: npmrcPath,
      NPM_CONFIG_USERCONFIG: npmrcPath,
      npm_config_cache: npmCacheDir,
      NPM_CONFIG_CACHE: npmCacheDir,
      npm_config_registry: registryUrl,
      NPM_CONFIG_REGISTRY: registryUrl,
    },
  };
}

function defaultRunner(command, args, options) {
  return spawnSync(command, args, options);
}

function sanitizeResult(result) {
  return {
    status: typeof result.status === 'number' ? result.status : null,
    stdout: result.stdout == null ? '' : String(result.stdout),
    stderr: result.stderr == null ? '' : String(result.stderr),
    error: result.error ? result.error.message : null,
  };
}

function runProcess(step, context, runner, overrides = {}) {
  const result = sanitizeResult(runner(step.command, step.args, {
    cwd: step.cwd || context.projectRoot,
    env: {
      ...context.env,
      GSD_VERIFY_UPGRADE_STEP: step.name,
      ...(overrides.env || {}),
    },
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  }));

  return {
    name: step.name,
    command: step.command,
    args: step.args,
    cwd: step.cwd || context.projectRoot,
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error,
    ok: !result.error && result.status === 0,
  };
}

function copyTree(sourceDir, destDir) {
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (COPY_EXCLUDES.has(entry.name)) continue;
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyTree(sourcePath, destPath);
      continue;
    }
    if (entry.isSymbolicLink()) continue;
    if (entry.isFile()) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function prepareBumpWorkspace(context, toVersion, options = {}) {
  if (options.prepareWorkspace === false) return;

  if (fs.readdirSync(context.workspaceDir).length === 0) {
    copyTree(context.projectRoot, context.workspaceDir);
  }

  const packagePath = path.join(context.workspaceDir, 'package.json');
  const packageJson = readJson(packagePath);
  const upstreamPackage = getActivePackageName();
  packageJson.devDependencies = packageJson.devDependencies || {};
  // eslint-disable-next-line security/detect-object-injection -- Key comes from validated upstream-source authority.
  packageJson.devDependencies[upstreamPackage] = toVersion;
  writeJson(packagePath, packageJson);

  const authorityPath = path.join(context.workspaceDir, '.planning', 'upstream-authority.json');
  if (fs.existsSync(authorityPath)) {
    const authority = readJson(authorityPath);
    authority.active.version = toVersion;
    writeJson(authorityPath, authority);
  }
}

function resolveTarballPath(stdout, directory) {
  const lines = String(stdout || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  const tarball = [...lines].reverse().find(line => line.endsWith('.tgz'));
  if (tarball) {
    return path.isAbsolute(tarball) ? tarball : path.join(directory, tarball);
  }

  const candidates = fs.existsSync(directory)
    ? fs.readdirSync(directory)
      .filter(entry => entry.endsWith('.tgz'))
      .map(entry => path.join(directory, entry))
    : [];
  candidates.sort();
  return candidates[candidates.length - 1] || null;
}

function classificationFor(stepName) {
  if (stepName === 'compose') return 'compose_failed';
  if (stepName === 'reinstall-to') return 'reinstall_failed';
  return `${stepName.replace(/-/g, '_')}_failed`;
}

function runRecordedStep(step, report, context, runner) {
  const result = runProcess(step, context, runner);
  report.steps.push(result);
  if (step.name === 'compose') {
    report.composeResult = {
      status: result.status,
      ok: result.ok,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }
  if (!result.ok) {
    report.exitClassification = classificationFor(step.name);
    return false;
  }
  return true;
}

function createBaseReport({ fromVersion, toVersion, registryUrl, installTargetDir }) {
  return {
    fromVersion,
    toVersion,
    registryUrl,
    packageTarball: null,
    packedArtifact: null,
    composeResult: null,
    reinstallTarget: installTargetDir,
    smokeCommands: [
      ['node', ['bin/gsd.js', '--version', '--json']],
    ],
    durationMs: 0,
    changedOverrides: [],
    steps: [],
    warnings: [],
    exitClassification: 'success',
  };
}

function maybeCheckRegistry(context, runner, skipVerdaccioHealth) {
  if (skipVerdaccioHealth) return null;
  return runProcess({
    name: 'verdaccio-health',
    command: 'npm',
    args: ['ping', '--registry', context.registryUrl],
    cwd: context.projectRoot,
  }, context, runner);
}

function runUpgradeVerification(options) {
  const startedAt = Date.now();
  const runner = options.runner || defaultRunner;
  const context = createVerifierContext(options);
  const report = createBaseReport({
    fromVersion: requireExactStableVersion('--from', options.fromVersion),
    toVersion: requireExactStableVersion('--to', options.toVersion),
    registryUrl: context.registryUrl,
    installTargetDir: context.installTargetDir,
  });

  const health = maybeCheckRegistry(context, runner, options.skipVerdaccioHealth);
  if (health && !health.ok) {
    report.warnings.push('Verdaccio health check failed before upgrade verification');
    report.exitClassification = 'verdaccio_failed';
    report.durationMs = Date.now() - startedAt;
    return report;
  }

  const packageJson = readJson(path.join(context.projectRoot, 'package.json'));
  const packageSpec = `${packageJson.name}@${packageJson.version}`;

  const packCurrent = {
    name: 'pack-current',
    command: 'npm',
    args: ['pack', '--pack-destination', context.registryDir],
    cwd: context.projectRoot,
  };
  if (!runRecordedStep(packCurrent, report, context, runner)) return finishReport(report, startedAt);
  report.packageTarball = resolveTarballPath(report.steps.at(-1).stdout, context.registryDir);

  const orderedSteps = [
    {
      name: 'publish-current',
      command: 'npm',
      args: ['publish', report.packageTarball, '--registry', context.registryUrl, '--access', 'public'],
      cwd: context.projectRoot,
    },
    {
      name: 'install-from',
      command: 'npm',
      args: ['install', packageSpec, '--registry', context.registryUrl],
      cwd: context.installTargetDir,
    },
  ];

  for (const step of orderedSteps) {
    if (!runRecordedStep(step, report, context, runner)) return finishReport(report, startedAt);
  }

  prepareBumpWorkspace(context, options.toVersion, options);
  if (!runRecordedStep({
    name: 'bump-upstream',
    command: 'bun',
    args: ['install', '--ignore-scripts'],
    cwd: context.workspaceDir,
  }, report, context, runner)) return finishReport(report, startedAt);

  if (!runRecordedStep({
    name: 'compose',
    command: 'bun',
    args: ['run', 'compose'],
    cwd: context.workspaceDir,
  }, report, context, runner)) return finishReport(report, startedAt);

  if (!runRecordedStep({
    name: 'pack-bumped',
    command: 'npm',
    args: ['pack', '--pack-destination', context.registryDir],
    cwd: context.workspaceDir,
  }, report, context, runner)) return finishReport(report, startedAt);
  report.packedArtifact = resolveTarballPath(report.steps.at(-1).stdout, context.registryDir);

  for (const step of [
    {
      name: 'publish-bumped',
      command: 'npm',
      args: ['publish', report.packedArtifact, '--registry', context.registryUrl, '--access', 'public'],
      cwd: context.workspaceDir,
    },
    {
      name: 'reinstall-to',
      command: 'npm',
      args: ['install', packageSpec, '--registry', context.registryUrl],
      cwd: context.installTargetDir,
    },
    {
      name: 'smoke-verify',
      command: 'node',
      args: [
        path.join('node_modules', '@chude', 'get-stuff-done', 'bin', 'gsd.js'),
        '--version',
        '--json',
      ],
      cwd: context.installTargetDir,
    },
  ]) {
    if (!runRecordedStep(step, report, context, runner)) return finishReport(report, startedAt);
  }

  return finishReport(report, startedAt);
}

function finishReport(report, startedAt) {
  report.durationMs = Date.now() - startedAt;
  return report;
}

function writeReport(report, reportPath) {
  if (!reportPath) return;
  fs.mkdirSync(path.dirname(path.resolve(reportPath)), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

function main(argv = process.argv.slice(2), io = process) {
  try {
    const options = parseArgs(argv);
    if (options.help) {
      printHelp(io.stdout);
      return 0;
    }

    const report = runUpgradeVerification(options);
    writeReport(report, options.reportPath);
    if (options.json) {
      io.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    } else {
      io.stdout.write(`Upgrade verification ${report.exitClassification}: ${report.fromVersion} -> ${report.toVersion}\n`);
    }
    return report.exitClassification === 'success' ? 0 : 1;
  } catch (error) {
    io.stderr.write(`Error [EVERIFYUPGRADE]: ${error.message}\n`);
    io.stderr.write('  Hint: run node scripts/verify-upgrade.js --help for usage.\n');
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  DEFAULT_REGISTRY_URL,
  STEP_NAMES,
  createVerifierContext,
  main,
  parseArgs,
  runUpgradeVerification,
};
