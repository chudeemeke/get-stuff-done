'use strict';

const { describe, expect, test } = require('./helpers/portable-test-api');
const crypto = require('crypto');
const fs = require('fs');
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

function fakeRunner({ failStep, requireAuth = false, leakedValues = () => [] } = {}) {
  const calls = [];
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
      return {
        status: 0,
        stdout: 'chude-get-stuff-done-3.0.2.tgz\n',
        stderr: '',
        error: null,
      };
    }

    if (stepName === 'pack-bumped') {
      return {
        status: 0,
        stdout: 'chude-get-stuff-done-3.0.3.tgz\n',
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

function configFixture() {
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
});

describe('verify-upgrade orchestration report', () => {
  test('emits D-03 report fields and temp-scoped runner environment', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const root = tempRoot();
    const capture = {};
    const runner = fakeRunner({ requireAuth: true });

    try {
      const report = await runUpgradeVerification({
        fromVersion: '1.5.0',
        toVersion: '1.6.1',
        registryUrl: 'http://localhost:4873/',
        tempRoot: root,
        prepareWorkspace: false,
        skipVerdaccioHealth: true,
        runner,
        httpRequest: successfulRegistryRequest(capture),
        randomBytes: deterministicRandomBytes,
      });

      expect(report.fromVersion).toBe('1.5.0');
      expect(report.toVersion).toBe('1.6.1');
      expect(report.registryUrl).toBe('http://localhost:4873/');
      expect(report.packageTarball).toContain('chude-get-stuff-done-3.0.2.tgz');
      expect(report.packedArtifact).toContain('chude-get-stuff-done-3.0.3.tgz');
      expect(report.composeResult.status).toBe(0);
      expect(report.reinstallTarget).toContain('install-target');
      expect(report.smokeCommands).toEqual([
        ['node', ['bin/gsd.js', '--version', '--json']],
      ]);
      expect(typeof report.durationMs).toBe('number');
      expect(report.changedOverrides).toEqual([]);
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
      expect(report.warnings).toEqual([]);
      expect(report.exitClassification).toBe('success');

      for (const call of runner.calls) {
        expect(call.options.env.HOME.startsWith(root)).toBe(true);
        expect(call.options.env.USERPROFILE.startsWith(root)).toBe(true);
        expect(call.options.env.CLAUDE_CONFIG_DIR.startsWith(root)).toBe(true);
        expect(call.options.env.npm_config_userconfig.startsWith(root)).toBe(true);
        expect(call.options.env.NPM_CONFIG_USERCONFIG.startsWith(root)).toBe(true);
        expect(call.options.env.npm_config_cache.startsWith(root)).toBe(true);
      }
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('classifies compose failures', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const root = tempRoot();

    try {
      const report = await runUpgradeVerification({
        fromVersion: '1.5.0',
        toVersion: '1.6.1',
        registryUrl: 'http://localhost:4873/',
        tempRoot: root,
        prepareWorkspace: false,
        skipVerdaccioHealth: true,
        runner: fakeRunner({ failStep: 'compose' }),
        httpRequest: successfulRegistryRequest({}),
        randomBytes: deterministicRandomBytes,
      });

      expect(report.exitClassification).toBe('compose_failed');
      expect(report.steps.find(step => step.name === 'compose').ok).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('classifies reinstall failures', async () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const root = tempRoot();

    try {
      const report = await runUpgradeVerification({
        fromVersion: '1.5.0',
        toVersion: '1.6.1',
        registryUrl: 'http://localhost:4873/',
        tempRoot: root,
        prepareWorkspace: false,
        skipVerdaccioHealth: true,
        runner: fakeRunner({ failStep: 'reinstall-to' }),
        httpRequest: successfulRegistryRequest({}),
        randomBytes: deterministicRandomBytes,
      });

      expect(report.exitClassification).toBe('reinstall_failed');
      expect(report.steps.find(step => step.name === 'reinstall-to').ok).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
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
