#!/usr/bin/env node
'use strict';

/* eslint-disable security/detect-non-literal-fs-filename -- Upgrade verification writes only inside caller-controlled temp roots and a copied workspace. */

const fs = require('fs');
const crypto = require('crypto');
const http = require('http');
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
const OWNED_RUN_PREFIX = 'gsd-verify-upgrade-run-';
const REGISTRY_REQUEST_TIMEOUT_MS = 5000;
const REGISTRY_RESPONSE_MAX_BYTES = 64 * 1024;
const REGISTRY_TOKEN_PATTERN = /^[A-Za-z0-9._~-]{16,4096}$/;
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

function validateRegistryUrl(value) {
  let registry;
  try {
    registry = new URL(value);
  } catch {
    throw new Error('A credential-free loopback HTTP registry URL is required.');
  }
  const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
  if (
    registry.protocol !== 'http:' ||
    !loopbackHosts.has(registry.hostname) ||
    registry.username ||
    registry.password ||
    registry.search ||
    registry.hash ||
    registry.pathname !== '/'
  ) {
    throw new Error('A credential-free loopback HTTP registry URL is required.');
  }
  return registry.href;
}

function secretValuesFromEnv(env) {
  return Object.entries(env || {})
    .filter(([key, value]) =>
      /(?:TOKEN|AUTH|SECRET|PASSWORD)/i.test(key) &&
      typeof value === 'string' &&
      value.length > 0
    )
    .map(([, value]) => value);
}

function redactText(value, secretValues = []) {
  let output = value === null || value === undefined ? '' : String(value);
  const uniqueSecrets = [...new Set(secretValues)]
    .filter(secret => typeof secret === 'string' && secret.length > 0)
    .sort((left, right) => right.length - left.length);
  for (const secret of uniqueSecrets) {
    output = output.split(secret).join('[redacted]');
  }
  return output
    .replace(/\/\/[^\s\r\n]*:_(?:authToken|auth)\s*=\s*[^\s\r\n]*/gi, '[redacted]')
    .replace(/authorization\s*:[^\r\n]*/gi, 'authorization: [redacted]')
    .replace(/\b(?:password|token|_auth)\s*[=:]\s*\S+/gi, '[redacted]');
}

function sanitizeValue(value, secretValues) {
  if (typeof value === 'string') return redactText(value, secretValues);
  if (Array.isArray(value)) return value.map(entry => sanitizeValue(entry, secretValues));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitizeValue(entry, secretValues)])
    );
  }
  return value;
}

function defaultHttpRequest(request) {
  return new Promise((resolve, reject) => {
    const target = new URL(request.url);
    const clientRequest = http.request(target, {
      method: request.method,
      headers: request.headers,
    }, response => {
      const chunks = [];
      let totalBytes = 0;
      response.on('data', chunk => {
        totalBytes += chunk.length;
        if (totalBytes > request.maxResponseBytes) {
          clientRequest.destroy(new Error('Registry identity response exceeded its byte bound.'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });
    clientRequest.setTimeout(request.timeoutMs, () => {
      clientRequest.destroy(new Error('Registry identity request timed out.'));
    });
    clientRequest.on('error', reject);
    clientRequest.end(request.body);
  });
}

function createRegistryCredentials(randomBytes = crypto.randomBytes) {
  const usernameBytes = randomBytes(12);
  const passwordBytes = randomBytes(32);
  if (!Buffer.isBuffer(usernameBytes) || usernameBytes.length !== 12 ||
      !Buffer.isBuffer(passwordBytes) || passwordBytes.length !== 32) {
    throw new Error('Registry credential entropy port returned invalid bytes.');
  }
  return {
    username: `gsd-${usernameBytes.toString('hex')}`,
    password: passwordBytes.toString('base64url'),
  };
}

async function bootstrapRegistryIdentity(context, options) {
  const credentials = createRegistryCredentials(options.randomBytes || crypto.randomBytes);
  context.secretValues.push(credentials.username, credentials.password);
  const identity = {
    _id: `org.couchdb.user:${credentials.username}`,
    name: credentials.username,
    password: credentials.password,
    type: 'user',
    roles: [],
  };
  const body = JSON.stringify(identity);
  const route = `-/user/org.couchdb.user:${encodeURIComponent(credentials.username)}`;
  const response = await (options.httpRequest || defaultHttpRequest)({
    url: new URL(route, context.registryUrl).href,
    method: 'PUT',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(body),
    },
    body,
    timeoutMs: REGISTRY_REQUEST_TIMEOUT_MS,
    maxResponseBytes: REGISTRY_RESPONSE_MAX_BYTES,
    followRedirects: false,
  });
  if (!response || response.statusCode !== 201 ||
      typeof response.body !== 'string' ||
      Buffer.byteLength(response.body) > REGISTRY_RESPONSE_MAX_BYTES) {
    throw new Error('Verdaccio rejected the disposable registry identity.');
  }
  let decoded;
  try {
    decoded = JSON.parse(response.body);
  } catch {
    throw new Error('Verdaccio returned a malformed registry identity response.');
  }
  if (!decoded || typeof decoded !== 'object' ||
      !REGISTRY_TOKEN_PATTERN.test(decoded.token || '')) {
    throw new Error('Verdaccio returned an invalid registry identity token.');
  }
  context.secretValues.push(decoded.token);
  return { ...credentials, token: decoded.token };
}

function printHelp(stream = process.stdout) {
  stream.write(`verify-upgrade - temp-isolated Open GSD upgrade verification

USAGE
  node scripts/verify-upgrade.js --from <x.y.z> --to <x.y.z> [options]

OPTIONS
  --from <x.y.z>              Current exact stable upstream version pin.
  --to <x.y.z>                Target exact stable upstream version pin.
  --registry-url <url>        Local registry URL. Default: ${DEFAULT_REGISTRY_URL}
  --json                      Emit the structured report as JSON to stdout.
  --temp-root <path>          Parent for the verifier-owned per-run temporary root.
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

function ensureDir(dirPath, fileSystem = fs) {
  fileSystem.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function assertInside(parent, child, label) {
  const parentPath = path.resolve(parent);
  const childPath = path.resolve(child);
  if (childPath !== parentPath && !childPath.startsWith(parentPath + path.sep)) {
    throw new Error(`${label} must be inside temp root`);
  }
}

function npmConfigCandidates(projectRoot, env) {
  const candidates = new Set([path.resolve(projectRoot, '.npmrc')]);
  for (const candidate of [
    env.npm_config_userconfig,
    env.NPM_CONFIG_USERCONFIG,
    env.HOME && path.join(env.HOME, '.npmrc'),
    env.USERPROFILE && path.join(env.USERPROFILE, '.npmrc'),
  ]) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      candidates.add(path.resolve(candidate));
    }
  }
  return [...candidates].sort();
}

function fingerprintPath(fileSystem, filePath) {
  try {
    const stat = fileSystem.lstatSync(filePath);
    const bytes = fileSystem.readFileSync(filePath);
    return {
      exists: true,
      kind: stat.isFile() ? 'file' : stat.isSymbolicLink() ? 'symlink' : 'other',
      size: stat.size,
      digest: crypto.createHash('sha256').update(bytes).digest('hex'),
    };
  } catch (error) {
    if (error.code === 'ENOENT') return { exists: false };
    throw new Error('Unable to fingerprint ambient npm configuration.');
  }
}

function snapshotNpmConfigs(projectRoot, env, fileSystem = fs) {
  return npmConfigCandidates(projectRoot, env).map(filePath => ({
    filePath,
    fingerprint: fingerprintPath(fileSystem, filePath),
  }));
}

function verifyNpmConfigSnapshots(snapshots, fileSystem = fs) {
  for (const snapshot of snapshots) {
    const current = fingerprintPath(fileSystem, snapshot.filePath);
    if (JSON.stringify(current) !== JSON.stringify(snapshot.fingerprint)) {
      throw new Error('Ambient npm configuration changed during upgrade verification.');
    }
  }
}

function isolatedChildEnvironment(env) {
  return Object.fromEntries(Object.entries(env).filter(([key]) => !(
    /^(?:NPM_TOKEN|NODE_AUTH_TOKEN)$/i.test(key) ||
    /^npm_config_.*(?:auth|token|password)/i.test(key)
  )));
}

function createVerifierContext({
  registryUrl = DEFAULT_REGISTRY_URL,
  tempRoot,
  env = process.env,
  projectRoot = PROJECT_ROOT,
  fs: fileSystem = fs,
}) {
  const normalizedRegistryUrl = validateRegistryUrl(registryUrl);
  const baseRoot = tempRoot ? path.resolve(tempRoot) : os.tmpdir();
  ensureDir(baseRoot, fileSystem);
  const prefix = tempRoot ? OWNED_RUN_PREFIX : 'gsd-verify-upgrade-';
  const root = fileSystem.mkdtempSync(path.join(baseRoot, prefix));
  try {
    const registryDir = ensureDir(path.join(root, 'registry'), fileSystem);
    const workspaceDir = ensureDir(path.join(root, 'workspace'), fileSystem);
    const installTargetDir = ensureDir(path.join(root, 'install-target'), fileSystem);
    const homeDir = ensureDir(path.join(root, 'home'), fileSystem);
    const userProfileDir = ensureDir(path.join(root, 'userprofile'), fileSystem);
    const claudeConfigDir = ensureDir(path.join(root, 'claude-config'), fileSystem);
    const npmCacheDir = ensureDir(path.join(root, 'npm-cache'), fileSystem);
    const npmrcDir = ensureDir(path.join(root, 'npmrc'), fileSystem);
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

    fileSystem.writeFileSync(npmrcPath, `registry=${normalizedRegistryUrl}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });
    fileSystem.writeFileSync(path.join(installTargetDir, 'package.json'), JSON.stringify({
      private: true,
      name: 'gsd-upgrade-install-target',
      version: '0.0.0',
    }, null, 2), 'utf8');

    return {
      registryUrl: normalizedRegistryUrl,
      root,
      projectRoot,
      registryDir,
      workspaceDir,
      installTargetDir,
      npmrcPath,
      fs: fileSystem,
      secretValues: secretValuesFromEnv(env),
      env: {
        ...isolatedChildEnvironment(env),
        HOME: homeDir,
        USERPROFILE: userProfileDir,
        CLAUDE_CONFIG_DIR: claudeConfigDir,
        npm_config_userconfig: npmrcPath,
        NPM_CONFIG_USERCONFIG: npmrcPath,
        npm_config_cache: npmCacheDir,
        NPM_CONFIG_CACHE: npmCacheDir,
        npm_config_registry: normalizedRegistryUrl,
        NPM_CONFIG_REGISTRY: normalizedRegistryUrl,
      },
    };
  } catch (error) {
    try {
      fileSystem.rmSync(root, { recursive: true, force: true });
    } catch {
      // The caller receives the original setup failure; no credentials exist yet.
    }
    throw error;
  }
}

function writeAuthenticatedNpmrc(context, token) {
  const registry = new URL(context.registryUrl);
  const authKey = `//${registry.host}${registry.pathname}:_authToken`;
  context.fs.writeFileSync(
    context.npmrcPath,
    `registry=${context.registryUrl}\n${authKey}=${token}\n`,
    { encoding: 'utf8', mode: 0o600 }
  );
}

function defaultRunner(command, args, options) {
  return spawnSync(command, args, options);
}

function sanitizeResult(result, secretValues) {
  return {
    status: typeof result.status === 'number' ? result.status : null,
    stdout: redactText(result.stdout, secretValues),
    stderr: redactText(result.stderr, secretValues),
    error: result.error ? redactText(result.error.message, secretValues) : null,
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
  }), context.secretValues);

  return {
    name: step.name,
    command: redactText(step.command, context.secretValues),
    args: step.args.map(arg => redactText(arg, context.secretValues)),
    cwd: redactText(step.cwd || context.projectRoot, context.secretValues),
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error,
    ok: !result.error && result.status === 0,
  };
}

function copyTree(sourceDir, destDir, fileSystem = fs) {
  const entries = fileSystem.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (COPY_EXCLUDES.has(entry.name)) continue;
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      fileSystem.mkdirSync(destPath, { recursive: true });
      copyTree(sourcePath, destPath, fileSystem);
      continue;
    }
    if (entry.isSymbolicLink()) continue;
    if (entry.isFile()) {
      fileSystem.mkdirSync(path.dirname(destPath), { recursive: true });
      fileSystem.copyFileSync(sourcePath, destPath);
    }
  }
}

function readJson(filePath, fileSystem = fs) {
  return JSON.parse(fileSystem.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value, fileSystem = fs) {
  fileSystem.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function prepareBumpWorkspace(context, toVersion, bumpedPackageVersion, options = {}) {
  if (options.prepareWorkspace === false) return;

  if (context.fs.readdirSync(context.workspaceDir).length === 0) {
    copyTree(context.projectRoot, context.workspaceDir, context.fs);
  }

  const packagePath = path.join(context.workspaceDir, 'package.json');
  const packageJson = readJson(packagePath, context.fs);
  const upstreamPackage = getActivePackageName();
  packageJson.version = bumpedPackageVersion;
  // eslint-disable-next-line security/detect-object-injection -- Key comes from validated upstream-source authority.
  packageJson.devDependencies[upstreamPackage] = toVersion;
  writeJson(packagePath, packageJson, context.fs);

  const authorityPath = path.join(context.workspaceDir, '.planning', 'upstream-authority.json');
  if (context.fs.existsSync(authorityPath)) {
    const authority = readJson(authorityPath, context.fs);
    authority.active.version = toVersion;
    writeJson(authorityPath, authority, context.fs);
  }
}

function resolveTarballPath(stdout, directory, fileSystem = fs) {
  const lines = String(stdout || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  const tarball = [...lines].reverse().find(line => line.endsWith('.tgz'));
  if (tarball) {
    return path.isAbsolute(tarball) ? tarball : path.join(directory, tarball);
  }

  const candidates = fileSystem.existsSync(directory)
    ? fileSystem.readdirSync(directory)
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

function executeUpgradeSequence(options, context, report, runner) {
  const packageJson = readJson(path.join(context.projectRoot, 'package.json'), context.fs);
  const upstreamPackage = getActivePackageName();
  // eslint-disable-next-line security/detect-object-injection -- Key comes from validated upstream-source authority.
  if (packageJson.devDependencies?.[upstreamPackage] !== options.fromVersion) {
    report.warnings.push('Checkout upstream pin does not match --from');
    report.exitClassification = 'source_pin_mismatch';
    return;
  }
  const sourcePackageVersion = requireExactStableVersion('package version', packageJson.version);
  const packageSpec = `${packageJson.name}@${sourcePackageVersion}`;
  const bumpedPackageVersion = `${sourcePackageVersion}-upgrade.${options.toVersion}`;
  const bumpedPackageSpec = `${packageJson.name}@${bumpedPackageVersion}`;

  const packCurrent = {
    name: 'pack-current',
    command: 'npm',
    args: ['pack', '--pack-destination', context.registryDir],
    cwd: context.projectRoot,
  };
  if (!runRecordedStep(packCurrent, report, context, runner)) return;
  report.packageTarball = resolveTarballPath(
    report.steps.at(-1).stdout,
    context.registryDir,
    context.fs
  );

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
    if (!runRecordedStep(step, report, context, runner)) return;
  }

  prepareBumpWorkspace(context, options.toVersion, bumpedPackageVersion, options);
  if (!runRecordedStep({
    name: 'bump-upstream',
    command: 'bun',
    args: ['install', '--ignore-scripts'],
    cwd: context.workspaceDir,
  }, report, context, runner)) return;

  if (!runRecordedStep({
    name: 'compose',
    command: 'bun',
    args: ['run', 'compose'],
    cwd: context.workspaceDir,
  }, report, context, runner)) return;

  if (!runRecordedStep({
    name: 'pack-bumped',
    command: 'npm',
    args: ['pack', '--pack-destination', context.registryDir],
    cwd: context.workspaceDir,
  }, report, context, runner)) return;
  report.packedArtifact = resolveTarballPath(
    report.steps.at(-1).stdout,
    context.registryDir,
    context.fs
  );

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
      args: ['install', bumpedPackageSpec, '--registry', context.registryUrl],
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
    if (!runRecordedStep(step, report, context, runner)) return;
  }
}

function cleanupVerifierContext(context) {
  try {
    if (context.fs.existsSync(context.npmrcPath)) {
      context.fs.writeFileSync(context.npmrcPath, `registry=${context.registryUrl}\n`, {
        encoding: 'utf8',
        mode: 0o600,
      });
    }
  } catch {
    // Root deletion below is the credential-destruction authority.
  }
  try {
    context.fs.rmSync(context.root, { recursive: true, force: true });
    return null;
  } catch {
    return new Error('Verifier-owned temporary root cleanup failed.');
  }
}

async function runUpgradeVerification(options) {
  const startedAt = Date.now();
  const runner = options.runner || defaultRunner;
  const fileSystem = options.fs || fs;
  const env = options.env || process.env;
  const projectRoot = path.resolve(options.projectRoot || PROJECT_ROOT);
  const snapshots = snapshotNpmConfigs(projectRoot, env, fileSystem);
  let context = null;
  let report = null;
  let executionError = null;

  try {
    context = createVerifierContext({ ...options, projectRoot, env, fs: fileSystem });
    report = createBaseReport({
      fromVersion: requireExactStableVersion('--from', options.fromVersion),
      toVersion: requireExactStableVersion('--to', options.toVersion),
      registryUrl: context.registryUrl,
      installTargetDir: context.installTargetDir,
    });

    const health = maybeCheckRegistry(context, runner, options.skipVerdaccioHealth);
    if (health && !health.ok) {
      report.warnings.push('Verdaccio health check failed before upgrade verification');
      report.exitClassification = 'verdaccio_failed';
    } else {
      try {
        const identity = await bootstrapRegistryIdentity(context, options);
        writeAuthenticatedNpmrc(context, identity.token);
      } catch {
        report.warnings.push('Disposable Verdaccio identity bootstrap failed');
        report.exitClassification = 'verdaccio_auth_failed';
      }
      if (report.exitClassification === 'success') {
        executeUpgradeSequence(options, context, report, runner);
      }
    }
  } catch (error) {
    executionError = error;
    if (report) {
      report.warnings.push(redactText(error.message, context?.secretValues || []));
      report.exitClassification = 'verifier_failed';
    }
  } finally {
    let configError = null;
    let cleanupError = null;
    try {
      verifyNpmConfigSnapshots(snapshots, fileSystem);
    } catch (error) {
      configError = error;
    }
    if (context) cleanupError = cleanupVerifierContext(context);

    if (report) {
      if (configError) {
        report.warnings.push('Ambient npm configuration changed during upgrade verification');
        report.exitClassification = 'npm_config_changed';
      }
      if (cleanupError) {
        report.warnings.push('Verifier-owned temporary root cleanup failed');
        report.exitClassification = 'cleanup_failed';
      }
      report = sanitizeValue(report, context?.secretValues || secretValuesFromEnv(env));
      finishReport(report, startedAt);
    } else if (configError || cleanupError) {
      executionError = new Error('Upgrade verification failed its state-containment checks.');
    }
  }

  if (executionError && !report) {
    throw new Error(redactText(
      executionError.message,
      context?.secretValues || secretValuesFromEnv(env)
    ));
  }
  return report;
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

async function main(argv = process.argv.slice(2), io = process, ports = {}) {
  try {
    const options = parseArgs(argv);
    if (options.help) {
      printHelp(io.stdout);
      return 0;
    }

    const verify = ports.runUpgradeVerification || runUpgradeVerification;
    const report = await verify(options);
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
  main().then(
    code => { process.exitCode = code; },
    error => {
      process.stderr.write(`Error [EVERIFYUPGRADE]: ${redactText(error.message)}\n`);
      process.exitCode = 1;
    }
  );
}

module.exports = {
  DEFAULT_REGISTRY_URL,
  STEP_NAMES,
  createVerifierContext,
  main,
  parseArgs,
  redactText,
  runUpgradeVerification,
  validateRegistryUrl,
};
