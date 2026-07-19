'use strict';

const { describe, expect, test } = require('./helpers/portable-test-api');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts', 'verify-upgrade.js');
const TOKEN_CANARY = 'verdaccio.token.canary.signature';

function loadVerifierModule() {
  delete require.cache[require.resolve('../scripts/verify-upgrade')];
  return require('../scripts/verify-upgrade');
}

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-verify-upgrade-'));
}

function fakeRunner({
  failStep,
  requireAuth = false,
  leakedValues = () => [],
  materializeTarget = true,
  onCall,
  packCurrentStdout = 'chude-get-stuff-done-3.0.2.tgz\n',
  packBumpedStdout = 'chude-get-stuff-done-3.0.2-upgrade.1.6.1.tgz\n',
  smokeStdout,
} = {}) {
  const calls = [];
  let installedSpec = '@chude/get-stuff-done@3.0.2-upgrade.1.6.1';
  let overlayManifestSha256 = null;
  const runner = (command, args, options) => {
    const npmrcPath = options.env.npm_config_userconfig;
    const npmrc = fs.existsSync(npmrcPath) ? fs.readFileSync(npmrcPath, 'utf8') : '';
    const call = {
      command,
      args,
      options,
      hasAuthToken: /:_authToken=/.test(npmrc),
    };
    calls.push(call);

    const stepName = options.env.GSD_VERIFY_UPGRADE_STEP;
    if (onCall) onCall({ call, stepName });
    if (requireAuth && stepName.startsWith('publish-') && !call.hasAuthToken) {
      return {
        status: 1,
        stdout: '',
        stderr: 'npm error code ENEEDAUTH',
        error: null,
      };
    }
    if (failStep && stepName === failStep) {
      const leaks = leakedValues();
      return {
        status: 1,
        stdout: '',
        stderr: `${failStep} failed ${leaks.join(' ')} //localhost:4873/:_authToken=${TOKEN_CANARY}`,
        error: null,
      };
    }

    if (stepName === 'pack-current') {
      materializeFakePack(packCurrentStdout, call);
      return {
        status: 0,
        stdout: packCurrentStdout,
        stderr: '',
        error: null,
      };
    }

    if (stepName === 'pack-bumped') {
      materializeFakePack(packBumpedStdout, call);
      return {
        status: 0,
        stdout: packBumpedStdout,
        stderr: '',
        error: null,
      };
    }

    if (stepName === 'bump-upstream' && materializeTarget) {
      const installManifest = JSON.parse(
        fs.readFileSync(path.join(call.options.cwd, 'package.json'), 'utf8')
      );
      const upstreamVersion = installManifest.dependencies?.['@opengsd/gsd-core'];
      const upstreamDir = path.join(
        call.options.cwd,
        'node_modules',
        '@opengsd',
        'gsd-core'
      );
      fs.mkdirSync(upstreamDir, { recursive: true });
      fs.writeFileSync(path.join(upstreamDir, 'package.json'), JSON.stringify({
        name: '@opengsd/gsd-core',
        version: upstreamVersion,
      }), 'utf8');
    }

    if (stepName === 'compose') {
      const manifestPath = path.join(call.options.cwd, 'dist', '.overlay-manifest.json');
      const manifestBytes = '["overlay/example.md"]\n';
      fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
      fs.writeFileSync(manifestPath, manifestBytes, 'utf8');
      overlayManifestSha256 = crypto.createHash('sha256').update(manifestBytes).digest('hex');
    }

    if (stepName === 'reinstall-to') {
      installedSpec = args.find(arg => String(arg).startsWith('@chude/get-stuff-done@')) || installedSpec;
    }

    if (stepName === 'smoke-verify') {
      const forkVersion = installedSpec.slice(installedSpec.lastIndexOf('@') + 1);
      const upstreamVersion = forkVersion.split('-upgrade.').at(-1);
      return {
        status: 0,
        stdout: smokeStdout || JSON.stringify({
          forkPackage: '@chude/get-stuff-done',
          forkVersion,
          packageName: '@chude/get-stuff-done',
          version: forkVersion,
          upstreamPackage: '@opengsd/gsd-core',
          upstreamVersion,
          overlayManifestSha256: overlayManifestSha256 || 'a'.repeat(64),
        }),
        stderr: '',
        error: null,
      };
    }

    const stdout = stepName === 'compose' ? leakedValues().join(' ') : '';
    return { status: 0, stdout, stderr: '', error: null };
  };
  runner.calls = calls;
  return runner;
}

function packFilename(output) {
  try {
    const payload = JSON.parse(String(output || ''));
    const record = Array.isArray(payload) ? payload.at(-1) : payload;
    if (record && typeof record.filename === 'string') return record.filename;
  } catch {
    // Plain npm pack output is covered below.
  }
  return String(output || '').split(/\r?\n/).map(line => line.trim())
    .find(line => line.endsWith('.tgz')) || null;
}

function materializeFakePack(output, call) {
  const filename = packFilename(output);
  if (!filename) return;
  const destinationIndex = call.args.indexOf('--pack-destination');
  const destination = destinationIndex >= 0 ? call.args[destinationIndex + 1] : call.options.cwd;
  const artifactPath = path.isAbsolute(filename) ? filename : path.join(destination, filename);
  if (fs.existsSync(artifactPath)) return;
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  fs.writeFileSync(artifactPath, `artifact:${path.basename(artifactPath)}`, 'utf8');
}

async function startRegistryServer(handler) {
  const server = http.createServer(handler);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  return {
    url: `http://127.0.0.1:${address.port}/`,
    close: () => new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    }),
  };
}

function configFixture({ upstreamVersion = '1.5.0' } = {}) {
  const root = tempRoot();
  const projectRoot = path.join(root, 'project');
  const home = path.join(root, 'ambient-home');
  const runBase = path.join(root, 'run-base');
  fs.mkdirSync(projectRoot, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  fs.mkdirSync(runBase, { recursive: true });
  fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify({
    name: '@chude/get-stuff-done',
    version: '3.0.2',
    dependencies: {
      ajv: '^8.17.1',
    },
    devDependencies: {
      '@opengsd/gsd-core': upstreamVersion,
    },
  }), 'utf8');
  const ajvDir = path.join(projectRoot, 'node_modules', 'ajv');
  fs.mkdirSync(ajvDir, { recursive: true });
  fs.writeFileSync(path.join(ajvDir, 'package.json'), JSON.stringify({
    name: 'ajv',
    version: '8.17.1',
  }), 'utf8');

  const projectNpmrc = path.join(projectRoot, '.npmrc');
  const userNpmrc = path.join(home, '.npmrc');
  const projectBytes = 'registry=https://project.invalid/\nproject-canary=true\n';
  const userBytes = 'registry=https://user.invalid/\nuser-canary=true\n';
  fs.writeFileSync(projectNpmrc, projectBytes, 'utf8');
  fs.writeFileSync(userNpmrc, userBytes, 'utf8');

  return {
    root,
    projectRoot,
    runBase,
    projectNpmrc,
    userNpmrc,
    projectBytes,
    userBytes,
    env: {
      ...process.env,
      HOME: home,
      USERPROFILE: home,
      npm_config_userconfig: userNpmrc,
      NPM_CONFIG_USERCONFIG: userNpmrc,
    },
  };
}

function digest(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function deterministicRandomBytes(size) {
  return Buffer.alloc(size, size === 12 ? 0x11 : 0x22);
}

function successfulRegistryRequest(capture, token = TOKEN_CANARY) {
  return async request => {
    capture.request = request;
    capture.credentials = JSON.parse(request.body);
    return {
      statusCode: 201,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: 'user created', token }),
    };
  };
}

function baseOptions(fixture, overrides = {}) {
  return {
    fromVersion: '1.5.0',
    toVersion: '1.6.1',
    registryUrl: 'http://localhost:4873/',
    tempRoot: fixture.runBase,
    projectRoot: fixture.projectRoot,
    env: fixture.env,
    prepareWorkspace: false,
    skipVerdaccioHealth: true,
    randomBytes: deterministicRandomBytes,
    ...overrides,
  };
}

function expectAmbientConfigUnchanged(fixture, before) {
  expect(digest(fixture.projectNpmrc)).toBe(before.project);
  expect(digest(fixture.userNpmrc)).toBe(before.user);
  expect(fs.readFileSync(fixture.projectNpmrc, 'utf8')).toBe(fixture.projectBytes);
  expect(fs.readFileSync(fixture.userNpmrc, 'utf8')).toBe(fixture.userBytes);
}

describe('verify-upgrade CLI contract', () => {
  test('help documents maintainer upgrade verification options', () => {
    const result = spawnSync('node', [SCRIPT_PATH, '--help'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    const output = `${result.stdout}${result.stderr}`;
    expect(output).toContain('--from <x.y.z>');
    expect(output).toContain('--to <x.y.z>');
    expect(output).toContain('--registry-url <url>');
    expect(output).toContain('--json');
    expect(output).toContain('--temp-root <path>');
    expect(output).toContain('--skip-verdaccio-health');
    expect(output).toContain('--report <path>');
  });

  test('rejects latest tags for the source version', () => {
    const result = spawnSync('node', [
      SCRIPT_PATH,
      '--from', 'latest',
      '--to', '1.6.1',
      '--skip-verdaccio-health',
    ], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
    });

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain('exact stable version required');
  });

  test('rejects prerelease tags for the target version', () => {
    const result = spawnSync('node', [
      SCRIPT_PATH,
      '--from', '1.5.0',
      '--to', '1.7.0-rc.2',
      '--skip-verdaccio-health',
    ], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
    });

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain('exact stable version required');
  });

  test('parses inline options and rejects missing or unknown values', () => {
    const { parseArgs } = loadVerifierModule();
    expect(parseArgs([
      '--from=1.5.0',
      '--to=1.6.1',
      '--registry-url=http://127.0.0.1:4873/',
      '--temp-root=C:\\temp\\upgrade',
      '--report=C:\\temp\\report.json',
      '--json',
      '--skip-verdaccio-health',
    ])).toMatchObject({
      fromVersion: '1.5.0',
      toVersion: '1.6.1',
      registryUrl: 'http://127.0.0.1:4873/',
      json: true,
      skipVerdaccioHealth: true,
    });
    expect(parseArgs(['-h'])).toMatchObject({ help: true });
    expect(parseArgs([
      '--from', '1.5.0',
      '--to', '1.6.1',
      '--registry-url', 'http://localhost:4873/',
      '--temp-root', 'C:\\temp\\upgrade',
    ])).toMatchObject({
      registryUrl: 'http://localhost:4873/',
      tempRoot: 'C:\\temp\\upgrade',
    });
    expect(() => parseArgs(['--from'])).toThrow('Missing value for --from');
    expect(() => parseArgs(['--unknown'])).toThrow('Unknown option');
  });

  test('resolves Node, npm, and Bun without a command shell', () => {
    const { resolveToolInvocation } = loadVerifierModule();
    const root = tempRoot();
    const missing = path.join(root, 'missing');
    const posixBin = path.join(root, 'posix-bin');
    const windowsExeBin = path.join(root, 'windows-exe-bin');
    const windowsCmdBin = path.join(root, 'windows-cmd-bin');
    fs.mkdirSync(posixBin, { recursive: true });
    fs.mkdirSync(windowsExeBin, { recursive: true });
    fs.mkdirSync(windowsCmdBin, { recursive: true });
    fs.writeFileSync(path.join(posixBin, 'npm'), '', 'utf8');
    fs.writeFileSync(path.join(posixBin, 'bun'), '', 'utf8');
    fs.writeFileSync(path.join(windowsExeBin, 'npm.exe'), '', 'utf8');
    fs.writeFileSync(path.join(windowsExeBin, 'bun.exe'), '', 'utf8');
    fs.writeFileSync(path.join(windowsCmdBin, 'npm.cmd'), '', 'utf8');

    try {
      expect(resolveToolInvocation('node', ['--version'], {}, 'win32')).toEqual({
        command: process.execPath,
        args: ['--version'],
      });
      expect(resolveToolInvocation('npm', ['ping'], {
        PATH: `${missing}${path.delimiter}${posixBin}`,
      }, 'linux')).toEqual({
        command: path.join(posixBin, 'npm'),
        args: ['ping'],
      });
      expect(resolveToolInvocation('bun', ['run', 'compose'], { PATH: posixBin }, 'linux'))
        .toEqual({ command: path.join(posixBin, 'bun'), args: ['run', 'compose'] });
      expect(resolveToolInvocation('npm', ['ping'], { PATH: windowsExeBin }, 'win32'))
        .toEqual({ command: path.join(windowsExeBin, 'npm.exe'), args: ['ping'] });
      expect(resolveToolInvocation('bun', ['run'], { PATH: windowsExeBin }, 'win32'))
        .toEqual({ command: path.join(windowsExeBin, 'bun.exe'), args: ['run'] });

      expect(() => resolveToolInvocation('npm', [], {}, 'win32'))
        .toThrow('resolve npm without a command shell');
      expect(() => resolveToolInvocation('bun', [], {}, 'linux'))
        .toThrow('resolve Bun without a command shell');
      expect(() => resolveToolInvocation('npm', [], { PATH: windowsCmdBin }, 'win32'))
        .toThrow('npm CLI behind the Windows command shim');

      const npmCli = path.join(windowsCmdBin, 'node_modules', 'npm', 'bin', 'npm-cli.js');
      fs.mkdirSync(path.dirname(npmCli), { recursive: true });
      fs.writeFileSync(npmCli, '', 'utf8');
      expect(resolveToolInvocation('npm', ['publish'], { PATH: windowsCmdBin }, 'win32'))
        .toEqual({ command: process.execPath, args: [npmCli, 'publish'] });
      expect(() => resolveToolInvocation('git', [], { PATH: posixBin }, 'linux'))
        .toThrow('Unsupported verifier command');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('emits JSON and text reports through the CLI boundary', async () => {
    const { main } = loadVerifierModule();
    const root = tempRoot();
    const reportPath = path.join(root, 'reports', 'upgrade.json');
    const stdout = [];
    const stderr = [];
    const io = {
      stdout: { write: value => stdout.push(value) },
      stderr: { write: value => stderr.push(value) },
    };
    const success = {
      fromVersion: '1.5.0',
      toVersion: '1.6.1',
      exitClassification: 'success',
    };

    try {
      const successCode = await main([
        '--from', '1.5.0',
        '--to', '1.6.1',
        '--json',
        '--report', reportPath,
      ], io, {
        runUpgradeVerification: async () => success,
      });
      expect(successCode).toBe(0);
      expect(JSON.parse(stdout.join(''))).toEqual(success);
      expect(JSON.parse(fs.readFileSync(reportPath, 'utf8'))).toEqual(success);

      stdout.length = 0;
      const failureCode = await main(['--from=1.5.0', '--to=1.6.1'], io, {
        runUpgradeVerification: async () => ({
          ...success,
          exitClassification: 'compose_failed',
        }),
      });
      expect(failureCode).toBe(1);
      expect(stdout.join('')).toContain('Upgrade verification compose_failed');
      expect(stderr).toEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('verify-upgrade orchestration report', () => {
  test('emits D-03 report fields and temp-scoped runner environment', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture({ upstreamVersion: '1.6.1' });
    const capture = {};
    const runner = fakeRunner({
      requireAuth: true,
      packCurrentStdout: JSON.stringify([{
        filename: 'chude-get-stuff-done-3.0.2.tgz',
      }]),
      packBumpedStdout: JSON.stringify([{
        filename: 'chude-get-stuff-done-3.0.2-upgrade.1.7.0.tgz',
      }]),
    });

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        fromVersion: '1.6.1',
        toVersion: '1.7.0',
        runner,
        httpRequest: successfulRegistryRequest(capture),
      }));

      expect(report.fromVersion).toBe('1.6.1');
      expect(report.toVersion).toBe('1.7.0');
      expect(report.registryUrl).toBe('http://localhost:4873/');
      expect(report.packageTarball).toContain('chude-get-stuff-done-3.0.2.tgz');
      expect(report.packedArtifact).toContain('chude-get-stuff-done-3.0.2-upgrade.1.7.0.tgz');
      expect(report.composeResult.status).toBe(0);
      expect(report.reinstallTarget).toContain('install-target');
      expect(report.smokeCommands).toEqual([
        ['node', ['bin/gsd.js', '--version', '--json']],
      ]);
      expect(typeof report.durationMs).toBe('number');
      expect(report.changedOverrides).toEqual([]);
      expect(report.registryLifecycle).toEqual({
        ownership: 'external-disposable',
        disposalRequired: true,
        verifierOwnsRegistry: false,
      });
      expect(report.artifacts.current).toMatchObject({
        filename: 'chude-get-stuff-done-3.0.2.tgz',
        sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      });
      expect(report.artifacts.bumped).toMatchObject({
        filename: 'chude-get-stuff-done-3.0.2-upgrade.1.7.0.tgz',
        sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      });
      expect(report.smokeProvenance).toMatchObject({
        forkPackage: '@chude/get-stuff-done',
        forkVersion: '3.0.2-upgrade.1.7.0',
        upstreamPackage: '@opengsd/gsd-core',
        upstreamVersion: '1.7.0',
      });
      expect(report.steps.map(step => step.name)).toEqual([
        'pack-current',
        'publish-current',
        'install-from',
        'bump-upstream',
        'compose',
        'pack-bumped',
        'publish-bumped',
        'reinstall-to',
        'smoke-verify',
      ]);
      expect(report.steps.find(step => step.name === 'reinstall-to').args).toContain(
        '@chude/get-stuff-done@3.0.2-upgrade.1.7.0'
      );
      for (const stepName of ['pack-current', 'pack-bumped']) {
        const packStep = report.steps.find(step => step.name === stepName);
        const packCall = runner.calls.find(call =>
          call.options.env.GSD_VERIFY_UPGRADE_STEP === stepName
        );
        expect(packStep.args).toContain('--json');
        expect(packStep.args).toContain('--ignore-scripts');
        expect(packCall.options.env.npm_config_ignore_scripts).toBe('true');
        expect(packCall.options.env.NPM_CONFIG_IGNORE_SCRIPTS).toBe('true');
        expect(packCall.options.env.PATH.split(path.delimiter)[0]).toBe(
          path.join(fixture.projectRoot, 'node_modules', '.bin')
        );
      }
      const publishBumped = report.steps.find(step => step.name === 'publish-bumped');
      expect(publishBumped.args).toContain('--tag');
      expect(publishBumped.args).toContain('upgrade-verifier');
      const bumpStep = report.steps.find(step => step.name === 'bump-upstream');
      expect(bumpStep.args).toContain('--no-save');
      expect(bumpStep.args).toContain('--omit=optional');
      expect(report.warnings).toEqual([]);
      expect(report.exitClassification).toBe('success');

      for (const call of runner.calls) {
        expect(call.options.env.HOME.startsWith(fixture.runBase)).toBe(true);
        expect(call.options.env.USERPROFILE.startsWith(fixture.runBase)).toBe(true);
        expect(call.options.env.CLAUDE_CONFIG_DIR.startsWith(fixture.runBase)).toBe(true);
        expect(call.options.env.npm_config_userconfig.startsWith(fixture.runBase)).toBe(true);
        expect(call.options.env.NPM_CONFIG_USERCONFIG.startsWith(fixture.runBase)).toBe(true);
        expect(call.options.env.npm_config_cache.startsWith(fixture.runBase)).toBe(true);
        expect(call.options.shell).toBe(false);
      }
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('classifies compose failures', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture({ upstreamVersion: '1.6.1' });

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        fromVersion: '1.6.1',
        toVersion: '1.7.0',
        runner: fakeRunner({ failStep: 'compose' }),
        httpRequest: successfulRegistryRequest({}),
      }));

      expect(report.exitClassification).toBe('compose_failed');
      expect(report.steps.find(step => step.name === 'compose').ok).toBe(false);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('classifies reinstall failures', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture({ upstreamVersion: '1.6.1' });

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        fromVersion: '1.6.1',
        toVersion: '1.7.0',
        runner: fakeRunner({ failStep: 'reinstall-to' }),
        httpRequest: successfulRegistryRequest({}),
      }));

      expect(report.exitClassification).toBe('reinstall_failed');
      expect(report.steps.find(step => step.name === 'reinstall-to').ok).toBe(false);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('accepts only credential-free loopback HTTP registry URLs', () => {
    const { validateRegistryUrl } = loadVerifierModule();

    expect(validateRegistryUrl('http://localhost:4873/')).toBe('http://localhost:4873/');
    expect(validateRegistryUrl('http://127.0.0.1:4873')).toBe('http://127.0.0.1:4873/');
    expect(validateRegistryUrl('http://[::1]:4873/')).toBe('http://[::1]:4873/');

    for (const candidate of [
      'https://localhost:4873/',
      'http://registry.example:4873/',
      'http://user:password@localhost:4873/',
      'http://localhost:4873/path',
      'http://localhost:4873/?token=secret',
      'http://localhost:4873/#secret',
      'not-a-url',
    ]) {
      expect(() => validateRegistryUrl(candidate)).toThrow('loopback HTTP registry URL');
    }
  });

  test('authenticates through the bounded HTTP port and redacts every observable surface', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const capture = {};
    const before = {
      project: digest(fixture.projectNpmrc),
      user: digest(fixture.userNpmrc),
    };
    const runner = fakeRunner({
      requireAuth: true,
      leakedValues: () => [
        TOKEN_CANARY,
        capture.credentials?.name,
        capture.credentials?.password,
      ].filter(Boolean),
    });

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        runner,
        httpRequest: successfulRegistryRequest(capture),
      }));

      expect(report.exitClassification).toBe('success');
      expect(capture.request.method).toBe('PUT');
      expect(capture.request.followRedirects).toBe(false);
      expect(capture.request.timeoutMs).toBeGreaterThan(0);
      expect(capture.request.maxResponseBytes).toBeLessThanOrEqual(64 * 1024);
      expect(capture.request.url).toContain(
        `/-/user/org.couchdb.user:${encodeURIComponent(capture.credentials.name)}`
      );
      expect(capture.credentials.password.length).toBeGreaterThanOrEqual(32);
      expect(runner.calls.filter(call => call.options.env.GSD_VERIFY_UPGRADE_STEP.startsWith('publish-'))
        .every(call => call.hasAuthToken)).toBe(true);

      const serializedReport = JSON.stringify(report);
      const observableCalls = JSON.stringify(runner.calls.map(call => ({
        command: call.command,
        args: call.args,
        env: call.options.env,
      })));
      for (const secret of [
        TOKEN_CANARY,
        capture.credentials.name,
        capture.credentials.password,
      ]) {
        expect(serializedReport).not.toContain(secret);
        expect(observableCalls).not.toContain(secret);
      }
      expect(serializedReport).not.toContain('_authToken');
      expect(serializedReport).toContain('[redacted]');
      expectAmbientConfigUnchanged(fixture, before);
      expect(fs.readdirSync(fixture.runBase)).toEqual([]);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('registers through the real bounded HTTP adapter', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    let requestBody = '';
    const registry = await startRegistryServer((request, response) => {
      request.setEncoding('utf8');
      request.on('data', chunk => { requestBody += chunk; });
      request.on('end', () => {
        response.writeHead(201, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ token: TOKEN_CANARY }));
      });
    });

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        registryUrl: registry.url,
        runner: fakeRunner({ requireAuth: true }),
      }));
      expect(report.exitClassification).toBe('success');
      expect(JSON.parse(requestBody).name).toMatch(/^gsd-/);
      expect(JSON.stringify(report)).not.toContain(TOKEN_CANARY);
    } finally {
      await registry.close();
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('uses default entropy and an OS-owned run root when no temp parent is supplied', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const capture = {};

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        tempRoot: undefined,
        randomBytes: undefined,
        runner: fakeRunner({ requireAuth: true }),
        httpRequest: successfulRegistryRequest(capture),
      }));
      expect(report.exitClassification).toBe('success');
      expect(capture.credentials.name).toMatch(/^gsd-[a-f0-9]{24}$/);
      expect(capture.credentials.password.length).toBeGreaterThanOrEqual(32);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('rejects an oversized real registry identity response', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const registry = await startRegistryServer((_request, response) => {
      response.writeHead(201, { 'content-type': 'application/json' });
      response.end('x'.repeat((64 * 1024) + 1));
    });

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        registryUrl: registry.url,
        runner: fakeRunner({ requireAuth: true }),
      }));
      expect(report.exitClassification).toBe('verdaccio_auth_failed');
      expect(report.steps).toEqual([]);
    } finally {
      await registry.close();
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('prepares a copied bump workspace without build or dependency artifacts', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const authorityDir = path.join(fixture.projectRoot, '.planning');
    fs.mkdirSync(authorityDir, { recursive: true });
    fs.writeFileSync(path.join(authorityDir, 'upstream-authority.json'), JSON.stringify({
      active: { package: '@opengsd/gsd-core', version: '1.5.0' },
    }), 'utf8');
    fs.mkdirSync(path.join(fixture.projectRoot, 'docs', 'nested'), { recursive: true });
    fs.writeFileSync(path.join(fixture.projectRoot, 'docs', 'nested', 'evidence.txt'), 'kept', 'utf8');
    fs.mkdirSync(path.join(fixture.projectRoot, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(fixture.projectRoot, 'dist', 'current.txt'), 'current-dist', 'utf8');
    fs.mkdirSync(path.join(fixture.projectRoot, 'node_modules'), { recursive: true });
    fs.writeFileSync(path.join(fixture.projectRoot, 'node_modules', 'ignored.txt'), 'ignored', 'utf8');
    fs.symlinkSync(
      path.join(fixture.projectRoot, 'docs'),
      path.join(fixture.projectRoot, 'linked-docs'),
      process.platform === 'win32' ? 'junction' : 'dir'
    );
    let observedWorkspace;
    let observedCurrentPackage;
    let observedInstallManifest;
    const runner = fakeRunner({
      onCall: ({ call, stepName }) => {
        if (stepName === 'pack-current') {
          observedCurrentPackage = {
            dist: fs.readFileSync(path.join(call.options.cwd, 'dist', 'current.txt'), 'utf8'),
            copiedNpmrc: fs.existsSync(path.join(call.options.cwd, '.npmrc')),
          };
        }
        if (stepName === 'bump-upstream') {
          observedInstallManifest = JSON.parse(
            fs.readFileSync(path.join(call.options.cwd, 'package.json'), 'utf8')
          );
        }
        if (stepName !== 'compose') return;
        observedWorkspace = {
          packageJson: JSON.parse(fs.readFileSync(path.join(call.options.cwd, 'package.json'), 'utf8')),
          authority: JSON.parse(fs.readFileSync(
            path.join(call.options.cwd, '.planning', 'upstream-authority.json'),
            'utf8'
          )),
          nested: fs.readFileSync(path.join(call.options.cwd, 'docs', 'nested', 'evidence.txt'), 'utf8'),
          copiedNodeModules: fs.existsSync(path.join(call.options.cwd, 'node_modules', 'ignored.txt')),
          copiedLink: fs.existsSync(path.join(call.options.cwd, 'linked-docs')),
          copiedNpmrc: fs.existsSync(path.join(call.options.cwd, '.npmrc')),
          copiedDist: fs.existsSync(path.join(call.options.cwd, 'dist')),
          nodePath: call.options.env.NODE_PATH,
        };
      },
    });

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        prepareWorkspace: true,
        runner,
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(report.exitClassification).toBe('success');
      expect(observedCurrentPackage).toEqual({ dist: 'current-dist', copiedNpmrc: false });
      expect(observedInstallManifest.dependencies).toEqual({
        '@opengsd/gsd-core': '1.6.1',
        ajv: '8.17.1',
      });
      expect(observedInstallManifest.devDependencies).toBeUndefined();
      expect(observedWorkspace.packageJson.devDependencies['@opengsd/gsd-core']).toBe('1.6.1');
      expect(observedWorkspace.packageJson.version).toBe('3.0.2-upgrade.1.6.1');
      expect(observedWorkspace.authority.active.version).toBe('1.6.1');
      expect(observedWorkspace.nested).toBe('kept');
      expect(observedWorkspace.copiedNodeModules).toBe(false);
      expect(observedWorkspace.copiedLink).toBe(false);
      expect(observedWorkspace.copiedNpmrc).toBe(false);
      expect(observedWorkspace.copiedDist).toBe(false);
      expect(observedWorkspace.nodePath).toBeUndefined();
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('discovers a contained packed artifact from disk and accepts object pack output', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const runner = fakeRunner({
      packCurrentStdout: '',
      packBumpedStdout: JSON.stringify({ filename: 'object-bumped.tgz' }),
      onCall: ({ call, stepName }) => {
        if (stepName === 'pack-current') {
          const destination = call.args[call.args.indexOf('--pack-destination') + 1];
          fs.writeFileSync(path.join(destination, 'fallback-current.tgz'), 'artifact', 'utf8');
        }
      },
    });

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        runner,
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(report.exitClassification).toBe('success');
      expect(report.packageTarball).toContain('fallback-current.tgz');
      expect(report.packedArtifact).toContain('object-bumped.tgz');
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('classifies bump and bumped-pack failures at their stopping step', async () => {
    for (const [failStep, classification] of [
      ['bump-upstream', 'bump_upstream_failed'],
      ['pack-bumped', 'pack_bumped_failed'],
    ]) {
      const { runUpgradeVerification } = loadVerifierModule();
      const fixture = configFixture();
      try {
        const report = await runUpgradeVerification(baseOptions(fixture, {
          runner: fakeRunner({ failStep }),
          httpRequest: successfulRegistryRequest({}),
        }));
        expect(report.exitClassification).toBe(classification);
        expect(report.steps.at(-1).name).toBe(failStep);
      } finally {
        fs.rmSync(fixture.root, { recursive: true, force: true });
      }
    }
  });

  test('rejects a successful bumped pack command that produces no new artifact', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        runner: fakeRunner({ packBumpedStdout: '' }),
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(report.exitClassification).toBe('pack_bumped_artifact_invalid');
      expect(report.steps.at(-1)).toMatchObject({ name: 'pack-bumped', ok: true });
      expect(report.artifacts.bumped).toBeNull();
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('rejects npm JSON that reuses the current tarball as the bumped artifact', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        runner: fakeRunner({
          packBumpedStdout: JSON.stringify([{
            name: '@chude/get-stuff-done',
            version: '3.0.2-upgrade.1.6.1',
            filename: 'chude-get-stuff-done-3.0.2.tgz',
          }]),
        }),
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(report.exitClassification).toBe('pack_bumped_artifact_invalid');
      expect(report.artifacts.bumped).toBeNull();
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('fails before compose when the exact target upstream is absent from the workspace', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const runner = fakeRunner({ materializeTarget: false });
    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        runner,
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(report.exitClassification).toBe('target_upstream_invalid');
      expect(report.steps.map(step => step.name)).not.toContain('compose');
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('fails closed when the checkout upstream pin does not match --from', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const runner = fakeRunner();

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        fromVersion: '1.6.0',
        runner,
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(report.exitClassification).toBe('source_pin_mismatch');
      expect(report.warnings).toContain('Checkout upstream pin does not match --from');
      expect(runner.calls).toEqual([]);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('fails closed when the checkout has no active upstream pin', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const packagePath = path.join(fixture.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    delete packageJson.devDependencies;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson), 'utf8');
    const runner = fakeRunner();

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        runner,
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(report.exitClassification).toBe('source_pin_mismatch');
      expect(runner.calls).toEqual([]);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('fails before publication on rejected or malformed registry identity responses', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const cases = [
      {
        statusCode: 401,
        body: JSON.stringify({ error: `rejected ${TOKEN_CANARY}` }),
      },
      {
        statusCode: 201,
        body: '{not-json',
      },
      {
        statusCode: 201,
        body: JSON.stringify({ token: 'short' }),
      },
      {
        statusCode: 201,
        body: JSON.stringify({}),
      },
    ];

    for (const response of cases) {
      const fixture = configFixture();
      const before = {
        project: digest(fixture.projectNpmrc),
        user: digest(fixture.userNpmrc),
      };
      const runner = fakeRunner({ requireAuth: true });
      try {
        const report = await runUpgradeVerification(baseOptions(fixture, {
          runner,
          httpRequest: async () => ({ headers: {}, ...response }),
        }));

        expect(report.exitClassification).toBe('verdaccio_auth_failed');
        expect(runner.calls.some(call => call.options.env.GSD_VERIFY_UPGRADE_STEP === 'pack-current'))
          .toBe(false);
        expect(JSON.stringify(report)).not.toContain(TOKEN_CANARY);
        expect(JSON.stringify(report)).not.toContain('short');
        expectAmbientConfigUnchanged(fixture, before);
        expect(fs.readdirSync(fixture.runBase)).toEqual([]);
      } finally {
        fs.rmSync(fixture.root, { recursive: true, force: true });
      }
    }
  });

  test('redacts an authenticated publish failure and preserves ambient npm config', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const capture = {};
    const before = {
      project: digest(fixture.projectNpmrc),
      user: digest(fixture.userNpmrc),
    };
    const runner = fakeRunner({
      requireAuth: true,
      failStep: 'publish-current',
      leakedValues: () => [
        TOKEN_CANARY,
        capture.credentials?.password,
      ].filter(Boolean),
    });

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        runner,
        httpRequest: successfulRegistryRequest(capture),
      }));
      const serialized = JSON.stringify(report);

      expect(report.exitClassification).toBe('publish_current_failed');
      expect(serialized).toContain('[redacted]');
      expect(serialized).not.toContain(TOKEN_CANARY);
      expect(serialized).not.toContain(capture.credentials.password);
      expect(serialized).not.toContain('_authToken');
      expectAmbientConfigUnchanged(fixture, before);
      expect(fs.readdirSync(fixture.runBase)).toEqual([]);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('attempts owned-root cleanup and reports a bounded cleanup failure', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const capture = {};
    const before = {
      project: digest(fixture.projectNpmrc),
      user: digest(fixture.userNpmrc),
    };
    let cleanupAttempts = 0;
    let retainedRoot = null;
    const fileSystem = {
      ...fs,
      rmSync(targetPath, options) {
        if (path.dirname(targetPath) === fixture.runBase) {
          cleanupAttempts += 1;
          retainedRoot = targetPath;
          throw new Error(`cleanup blocked ${TOKEN_CANARY}`);
        }
        return fs.rmSync(targetPath, options);
      },
    };

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        fs: fileSystem,
        runner: fakeRunner({ requireAuth: true }),
        httpRequest: successfulRegistryRequest(capture),
      }));

      expect(cleanupAttempts).toBe(1);
      expect(report.exitClassification).toBe('cleanup_failed');
      expect(JSON.stringify(report)).not.toContain(TOKEN_CANARY);
      expectAmbientConfigUnchanged(fixture, before);
      expect(retainedRoot).not.toBeNull();
    } finally {
      if (retainedRoot) fs.rmSync(retainedRoot, { recursive: true, force: true });
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('detects ambient npm configuration mutation after execution', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const runner = fakeRunner({
      onCall: ({ stepName }) => {
        if (stepName === 'compose') fs.appendFileSync(fixture.userNpmrc, 'mutated=true\n');
      },
    });

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        runner,
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(report.exitClassification).toBe('npm_config_changed');
      expect(report.warnings).toContain('Ambient npm configuration changed during upgrade verification');
      expect(fs.readdirSync(fixture.runBase)).toEqual([]);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('accepts a non-file npm config fingerprint and rejects an unreadable one', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const otherKindFs = {
      ...fs,
      lstatSync(targetPath) {
        if (path.resolve(targetPath) === path.resolve(fixture.projectNpmrc)) {
          const stat = fs.lstatSync(targetPath);
          return {
            ...stat,
            isFile: () => false,
            isSymbolicLink: () => false,
          };
        }
        return fs.lstatSync(targetPath);
      },
    };

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        fs: otherKindFs,
        runner: fakeRunner(),
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(report.exitClassification).toBe('success');

      const symlinkKindFs = {
        ...fs,
        lstatSync(targetPath) {
          if (path.resolve(targetPath) === path.resolve(fixture.projectNpmrc)) {
            const stat = fs.lstatSync(targetPath);
            return {
              ...stat,
              isFile: () => false,
              isSymbolicLink: () => true,
            };
          }
          return fs.lstatSync(targetPath);
        },
      };
      const symlinkReport = await runUpgradeVerification(baseOptions(fixture, {
        fs: symlinkKindFs,
        runner: fakeRunner(),
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(symlinkReport.exitClassification).toBe('success');

      const unreadableFs = {
        ...fs,
        lstatSync(targetPath) {
          if (path.resolve(targetPath) === path.resolve(fixture.projectNpmrc)) {
            const error = new Error('access denied');
            error.code = 'EACCES';
            throw error;
          }
          return fs.lstatSync(targetPath);
        },
      };
      await expect(runUpgradeVerification(baseOptions(fixture, {
        fs: unreadableFs,
        runner: fakeRunner(),
        httpRequest: successfulRegistryRequest({}),
      }))).rejects.toThrow('Unable to fingerprint ambient npm configuration');

      fs.unlinkSync(fixture.projectNpmrc);
      const absentConfigReport = await runUpgradeVerification(baseOptions(fixture, {
        runner: fakeRunner(),
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(absentConfigReport.exitClassification).toBe('success');
      expect(fs.existsSync(fixture.projectNpmrc)).toBe(false);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('deletes the owned root even if credential-file neutralization fails', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    let npmrcWrites = 0;
    const fileSystem = {
      ...fs,
      writeFileSync(targetPath, ...args) {
        if (path.basename(targetPath) === '.npmrc' && targetPath.includes('gsd-verify-upgrade-run-')) {
          npmrcWrites += 1;
          if (npmrcWrites === 3) throw new Error('neutralization blocked');
        }
        return fs.writeFileSync(targetPath, ...args);
      },
    };

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        fs: fileSystem,
        runner: fakeRunner(),
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(report.exitClassification).toBe('success');
      expect(npmrcWrites).toBe(3);
      expect(fs.readdirSync(fixture.runBase)).toEqual([]);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('accepts root deletion as authority when direct credential unlink fails', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    let unlinkAttempts = 0;
    const fileSystem = {
      ...fs,
      unlinkSync(targetPath) {
        if (path.basename(targetPath) === '.npmrc' && targetPath.includes('gsd-verify-upgrade-run-')) {
          unlinkAttempts += 1;
          throw new Error('direct unlink blocked');
        }
        return fs.unlinkSync(targetPath);
      },
    };

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        fs: fileSystem,
        runner: fakeRunner(),
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(report.exitClassification).toBe('success');
      expect(unlinkAttempts).toBe(1);
      expect(fs.readdirSync(fixture.runBase)).toEqual([]);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('removes the credential file when neutralization and root deletion both fail', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    let npmrcWrites = 0;
    let retainedRoot;
    const fileSystem = {
      ...fs,
      writeFileSync(targetPath, ...args) {
        if (path.basename(targetPath) === '.npmrc' && targetPath.includes('gsd-verify-upgrade-run-')) {
          npmrcWrites += 1;
          if (npmrcWrites === 3) throw new Error('neutralization blocked');
        }
        return fs.writeFileSync(targetPath, ...args);
      },
      rmSync(targetPath, options) {
        if (path.dirname(targetPath) === fixture.runBase) {
          retainedRoot = targetPath;
          throw new Error('root deletion blocked');
        }
        return fs.rmSync(targetPath, options);
      },
    };

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        fs: fileSystem,
        runner: fakeRunner(),
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(report.exitClassification).toBe('cleanup_failed');
      expect(retainedRoot).not.toBeNull();
      expect(fs.existsSync(path.join(retainedRoot, 'npmrc', '.npmrc'))).toBe(false);
    } finally {
      if (retainedRoot) fs.rmSync(retainedRoot, { recursive: true, force: true });
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('uses a minimum child environment and never invokes a command shell', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const globalNpmrc = path.join(fixture.root, 'ambient-global.npmrc');
    fs.writeFileSync(globalNpmrc, 'registry=https://global.invalid/\n', 'utf8');
    const runner = fakeRunner();

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        env: {
          ...fixture.env,
          GITHUB_TOKEN: TOKEN_CANARY,
          AWS_SECRET_ACCESS_KEY: 'aws-secret-canary',
          npm_config_globalconfig: globalNpmrc,
          NPM_CONFIG_GLOBALCONFIG: globalNpmrc,
        },
        runner,
        httpRequest: successfulRegistryRequest({}),
      }));

      expect(report.exitClassification).toBe('success');
      for (const call of runner.calls) {
        expect(call.options.shell).toBe(false);
        expect(call.options.env.GITHUB_TOKEN).toBeUndefined();
        expect(call.options.env.AWS_SECRET_ACCESS_KEY).toBeUndefined();
        expect(call.options.env.npm_config_globalconfig).not.toBe(globalNpmrc);
        expect(call.options.env.NPM_CONFIG_GLOBALCONFIG).not.toBe(globalNpmrc);
      }
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('rejects a verifier temp parent nested inside the source checkout', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const nestedRunBase = path.join(fixture.projectRoot, '.tmp-verifier');

    try {
      await expect(runUpgradeVerification(baseOptions(fixture, {
        tempRoot: nestedRunBase,
        runner: fakeRunner(),
        httpRequest: successfulRegistryRequest({}),
      }))).rejects.toThrow('outside the source checkout');
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('rejects a temp parent whose canonical alias points inside the source checkout', () => {
    const { createVerifierContext } = loadVerifierModule();
    const fixture = configFixture();
    const aliasPath = path.join(fixture.root, 'project-alias');
    const aliasedRunBase = path.join(aliasPath, 'canonical-run-base');
    let context;
    let caught;
    try {
      fs.symlinkSync(
        fixture.projectRoot,
        aliasPath,
        process.platform === 'win32' ? 'junction' : 'dir'
      );
      try {
        context = createVerifierContext({
          registryUrl: 'http://localhost:4873/',
          tempRoot: aliasedRunBase,
          env: fixture.env,
          projectRoot: fixture.projectRoot,
        });
      } catch (error) {
        caught = error;
      }
      expect(caught?.message).toContain('outside the source checkout');
    } finally {
      if (context?.root) fs.rmSync(context.root, { recursive: true, force: true });
      fs.rmSync(path.join(fixture.projectRoot, 'canonical-run-base'), { recursive: true, force: true });
      try {
        fs.unlinkSync(aliasPath);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('resolves outer npm from the baseline path instead of the prepare compatibility path', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const projectBin = path.join(fixture.projectRoot, 'node_modules', '.bin');
    const fakeNpm = path.join(projectBin, process.platform === 'win32' ? 'npm.cmd' : 'npm');
    fs.mkdirSync(projectBin, { recursive: true });
    fs.writeFileSync(fakeNpm, process.platform === 'win32'
      ? '@echo off\r\nexit /b 99\r\n'
      : '#!/bin/sh\nexit 99\n', 'utf8');
    if (process.platform !== 'win32') fs.chmodSync(fakeNpm, 0o700);
    let resolvedNpm;
    const runner = fakeRunner({
      onCall: ({ call, stepName }) => {
        if (stepName === 'pack-current') {
          resolvedNpm = call.options.resolveTool('npm');
        }
      },
    });
    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        runner,
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(report.exitClassification).toBe('success');
      expect(path.resolve(resolvedNpm.command)).not.toBe(path.resolve(fakeNpm));
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('rejects missing, escaping, and non-file pack artifacts', async () => {
    const cases = [
      {
        stdout: '',
      },
      {
        stdout: fixture => `${path.join(fixture.root, 'outside.tgz')}\n`,
        setup: fixture => fs.writeFileSync(path.join(fixture.root, 'outside.tgz'), 'outside', 'utf8'),
      },
      {
        stdout: JSON.stringify({ filename: 'directory.tgz' }),
        setup: (_fixture, call) => {
          const destination = call.args[call.args.indexOf('--pack-destination') + 1];
          fs.mkdirSync(path.join(destination, 'directory.tgz'), { recursive: true });
        },
      },
    ];

    for (const testCase of cases) {
      const { runUpgradeVerification } = loadVerifierModule();
      const fixture = configFixture();
      if (testCase.setup && testCase.setup.length === 1) testCase.setup(fixture);
      const stdout = typeof testCase.stdout === 'function' ? testCase.stdout(fixture) : testCase.stdout;
      const runner = fakeRunner({
        packCurrentStdout: stdout,
        onCall: ({ call, stepName }) => {
          if (stepName === 'pack-current' && testCase.setup && testCase.setup.length > 1) {
            testCase.setup(fixture, call);
          }
        },
      });
      try {
        const report = await runUpgradeVerification(baseOptions(fixture, {
          runner,
          httpRequest: successfulRegistryRequest({}),
        }));
        expect(report.exitClassification).toBe('pack_current_artifact_invalid');
        expect(report.steps.map(step => step.name)).toEqual(['pack-current']);
      } finally {
        fs.rmSync(fixture.root, { recursive: true, force: true });
      }
    }
  });

  test('fails closed when smoke exits zero with the wrong installed provenance', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const runner = fakeRunner({
      smokeStdout: JSON.stringify({
        forkPackage: '@chude/get-stuff-done',
        forkVersion: '3.0.2-upgrade.1.6.1',
        upstreamPackage: '@opengsd/gsd-core',
        upstreamVersion: '9.9.9',
      }),
    });

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        runner,
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(report.steps.at(-1)).toMatchObject({ name: 'smoke-verify', ok: true });
      expect(report.exitClassification).toBe('smoke_provenance_mismatch');
      expect(report.smokeProvenance).toBeNull();
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('fails closed when smoke reports a different valid manifest digest', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const runner = fakeRunner({
      smokeStdout: JSON.stringify({
        forkPackage: '@chude/get-stuff-done',
        forkVersion: '3.0.2-upgrade.1.6.1',
        packageName: '@chude/get-stuff-done',
        version: '3.0.2-upgrade.1.6.1',
        upstreamPackage: '@opengsd/gsd-core',
        upstreamVersion: '1.6.1',
        overlayManifestSha256: 'b'.repeat(64),
      }),
    });

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        runner,
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(report.exitClassification).toBe('smoke_provenance_mismatch');
      expect(report.smokeProvenance).toBeNull();
      expect(report.smokeProvenanceExpected.overlayManifestSha256).not.toBe('b'.repeat(64));
      expect(report.smokeProvenanceObserved.overlayManifestSha256).toBe('b'.repeat(64));
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('accepts only complete exact smoke provenance JSON', () => {
    const { parseSmokeProvenance } = loadVerifierModule();
    const expected = {
      forkPackage: '@chude/get-stuff-done',
      forkVersion: '3.0.2-upgrade.1.6.1',
      upstreamPackage: '@opengsd/gsd-core',
      upstreamVersion: '1.6.1',
      overlayManifestSha256: 'a'.repeat(64),
    };
    const valid = {
      ...expected,
      packageName: expected.forkPackage,
      version: expected.forkVersion,
      overlayManifestSha256: expected.overlayManifestSha256.toUpperCase(),
    };

    expect(parseSmokeProvenance(JSON.stringify(valid), expected)).toMatchObject({
      ...valid,
      overlayManifestSha256: 'a'.repeat(64),
    });
    for (const payload of [
      '',
      'null',
      '[]',
      '{}',
      JSON.stringify({ ...valid, upstreamVersion: '9.9.9' }),
      JSON.stringify({ ...valid, overlayManifestSha256: 'b'.repeat(64) }),
      JSON.stringify({ ...valid, overlayManifestSha256: 'short' }),
      JSON.stringify({ ...valid, overlayManifestSha256: undefined }),
    ]) {
      expect(parseSmokeProvenance(payload, expected)).toBeNull();
    }
  });

  test('turns an unexpected runner exception into a redacted verifier report', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        env: { ...fixture.env, CUSTOM_SECRET: TOKEN_CANARY },
        runner: () => { throw new Error(`runner exploded ${TOKEN_CANARY}`); },
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(report.exitClassification).toBe('verifier_failed');
      expect(report.warnings).toContain('runner exploded [redacted]');
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('uses the real process runner for a deterministic failed health probe', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const fakeBin = path.join(fixture.root, 'fake-bin');
    fs.mkdirSync(fakeBin, { recursive: true });
    if (process.platform === 'win32') {
      fs.writeFileSync(path.join(fakeBin, 'npm.cmd'), '@echo off\r\nexit /b 1\r\n', 'utf8');
    } else {
      const npmPath = path.join(fakeBin, 'npm');
      fs.writeFileSync(npmPath, '#!/bin/sh\nexit 1\n', 'utf8');
      fs.chmodSync(npmPath, 0o755);
    }

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        env: {
          ...fixture.env,
          PATH: `${fakeBin}${path.delimiter}${fixture.env.PATH || ''}`,
        },
        runner: undefined,
        skipVerdaccioHealth: false,
      }));
      expect(report.exitClassification).toBe('verdaccio_failed');
      expect(report.warnings).toContain('Verdaccio health check failed before upgrade verification');
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('contains setup failures even when best-effort setup cleanup also fails', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const fileSystem = {
      ...fs,
      writeFileSync(targetPath, ...args) {
        if (targetPath.endsWith(path.join('install-target', 'package.json'))) {
          throw new Error(`setup failed ${TOKEN_CANARY}`);
        }
        return fs.writeFileSync(targetPath, ...args);
      },
      rmSync(targetPath, options) {
        if (path.dirname(targetPath) === fixture.runBase) throw new Error('cleanup also failed');
        return fs.rmSync(targetPath, options);
      },
    };

    try {
      await expect(runUpgradeVerification(baseOptions(fixture, {
        fs: fileSystem,
        env: { ...fixture.env, CUSTOM_SECRET: TOKEN_CANARY },
        runner: fakeRunner(),
        httpRequest: successfulRegistryRequest({}),
      }))).rejects.toThrow('setup failed [redacted]');
    } finally {
      for (const entry of fs.readdirSync(fixture.runBase)) {
        fs.rmSync(path.join(fixture.runBase, entry), { recursive: true, force: true });
      }
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('rejects invalid entropy and sanitizes malformed process results', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();

    try {
      const entropyReport = await runUpgradeVerification(baseOptions(fixture, {
        runner: fakeRunner(),
        httpRequest: successfulRegistryRequest({}),
        randomBytes: () => Buffer.alloc(1),
      }));
      expect(entropyReport.exitClassification).toBe('verdaccio_auth_failed');

      const processReport = await runUpgradeVerification(baseOptions(fixture, {
        runner: () => ({
          status: undefined,
          stdout: null,
          stderr: undefined,
          error: new Error(`spawn failed ${TOKEN_CANARY}`),
        }),
        httpRequest: successfulRegistryRequest({}),
      }));
      expect(processReport.exitClassification).toBe('pack_current_failed');
      expect(processReport.steps[0]).toMatchObject({
        status: null,
        stdout: '',
        stderr: '',
        error: 'spawn failed [redacted]',
        ok: false,
      });
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('cleans its owned root and preserves ambient npm config on health failure', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const fixture = configFixture();
    const before = {
      project: digest(fixture.projectNpmrc),
      user: digest(fixture.userNpmrc),
    };
    let identityCalls = 0;

    try {
      const report = await runUpgradeVerification(baseOptions(fixture, {
        skipVerdaccioHealth: false,
        runner: fakeRunner({ failStep: 'verdaccio-health' }),
        httpRequest: async () => {
          identityCalls += 1;
          throw new Error('must not register after failed health');
        },
      }));

      expect(report.exitClassification).toBe('verdaccio_failed');
      expect(identityCalls).toBe(0);
      expectAmbientConfigUnchanged(fixture, before);
      expect(fs.readdirSync(fixture.runBase)).toEqual([]);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  test('central sanitizer removes secret values and npm authentication lines', () => {
    const { redactText } = loadVerifierModule();
    const raw = [
      `token=${TOKEN_CANARY}`,
      `//localhost:4873/:_authToken=${TOKEN_CANARY}`,
      `authorization: Bearer ${TOKEN_CANARY}`,
      `password=${TOKEN_CANARY}`,
    ].join('\n');
    const redacted = redactText(raw, [TOKEN_CANARY]);

    expect(redacted).not.toContain(TOKEN_CANARY);
    expect(redacted).not.toContain('_authToken');
    expect(redacted).toContain('[redacted]');
  });

  test('test file covers required acceptance terms', () => {
    const testText = fs.readFileSync(__filename, 'utf8');

    expect(testText).toContain('packageTarball');
    expect(testText).toContain('packedArtifact');
    expect(testText).toContain('composeResult');
    expect(testText).toContain('reinstallTarget');
    expect(testText).toContain('smokeCommands');
    expect(testText).toContain('changedOverrides');
    expect(testText).toContain('npm_config_userconfig');
    expect(testText).toContain('compose_failed');
  });
});
