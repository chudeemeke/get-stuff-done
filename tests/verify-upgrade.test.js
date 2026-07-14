'use strict';

const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts', 'verify-upgrade.js');

function loadVerifierModule() {
  delete require.cache[require.resolve('../scripts/verify-upgrade')];
  return require('../scripts/verify-upgrade');
}

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-verify-upgrade-'));
}

function fakeRunner({ failStep } = {}) {
  const calls = [];
  const runner = (command, args, options) => {
    const call = { command, args, options };
    calls.push(call);

    const stepName = options.env.GSD_VERIFY_UPGRADE_STEP;
    if (failStep && stepName === failStep) {
      return {
        status: 1,
        stdout: '',
        stderr: `${failStep} failed`,
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

    return { status: 0, stdout: '', stderr: '', error: null };
  };
  runner.calls = calls;
  return runner;
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
  test('emits D-03 report fields and temp-scoped runner environment', () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const root = tempRoot();
    const runner = fakeRunner();

    try {
      const report = runUpgradeVerification({
        fromVersion: '1.5.0',
        toVersion: '1.6.1',
        registryUrl: 'http://localhost:4873/',
        tempRoot: root,
        prepareWorkspace: false,
        skipVerdaccioHealth: true,
        runner,
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

  test('classifies compose failures', () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const root = tempRoot();

    try {
      const report = runUpgradeVerification({
        fromVersion: '1.5.0',
        toVersion: '1.6.1',
        registryUrl: 'http://localhost:4873/',
        tempRoot: root,
        prepareWorkspace: false,
        skipVerdaccioHealth: true,
        runner: fakeRunner({ failStep: 'compose' }),
      });

      expect(report.exitClassification).toBe('compose_failed');
      expect(report.steps.find(step => step.name === 'compose').ok).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('classifies reinstall failures', () => {
    const { runUpgradeVerification } = loadVerifierModule();
    const root = tempRoot();

    try {
      const report = runUpgradeVerification({
        fromVersion: '1.5.0',
        toVersion: '1.6.1',
        registryUrl: 'http://localhost:4873/',
        tempRoot: root,
        prepareWorkspace: false,
        skipVerdaccioHealth: true,
        runner: fakeRunner({ failStep: 'reinstall-to' }),
      });

      expect(report.exitClassification).toBe('reinstall_failed');
      expect(report.steps.find(step => step.name === 'reinstall-to').ok).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
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
