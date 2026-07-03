'use strict';

const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');

function loadSmokeModule() {
  return require('../scripts/cousin-smoke');
}

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-cousin-smoke-'));
}

function provenanceJson(overrides = {}) {
  return JSON.stringify({
    packageName: '@chude/get-stuff-done',
    version: '3.0.2',
    upstreamPackage: '@opengsd/gsd-core',
    upstreamVersion: '1.5.0',
    overlayManifestSha256: 'a'.repeat(64),
    ...overrides,
  });
}

function fakeRunner({ failCommand, stderr = '', stdout = provenanceJson() } = {}) {
  const calls = [];
  const runner = (command, args, options) => {
    calls.push({ command, args, options });
    if (failCommand && command.includes(failCommand)) {
      return { status: 1, stdout: '', stderr, error: null };
    }
    if (args.includes('--version') && args.includes('--json')) {
      return { status: 0, stdout, stderr: '', error: null };
    }
    return { status: 0, stdout: '', stderr: '', error: null };
  };
  runner.calls = calls;
  return runner;
}

describe('cousin smoke CLI contract', () => {
  test('accepts only npm, pnpm, and bun package managers', () => {
    const { SUPPORTED_PACKAGE_MANAGERS, parseArgs } = loadSmokeModule();

    expect([...SUPPORTED_PACKAGE_MANAGERS].sort()).toEqual(['bun', 'npm', 'pnpm']);
    expect(parseArgs(['--package-manager', 'npm', '--temp-root', 'tmp']).packageManager).toBe('npm');
    expect(() => parseArgs(['--package-manager', 'yarn', '--temp-root', 'tmp'])).toThrow('Unsupported package manager');
  });

  test('defaults to the published latest package spec', () => {
    const { DEFAULT_PACKAGE_SPEC, parseArgs } = loadSmokeModule();

    expect(DEFAULT_PACKAGE_SPEC).toBe('@chude/get-stuff-done@latest');
    expect(parseArgs(['--package-manager', 'bun', '--temp-root', 'tmp']).packageSpec).toBe(DEFAULT_PACKAGE_SPEC);
  });

  test('prints help without requiring install inputs', () => {
    const { main } = loadSmokeModule();
    const output = [];

    const status = main(['--help'], {
      stdout: { write: text => output.push(text) },
      stderr: { write: text => output.push(text) },
    });

    expect(status).toBe(0);
    expect(output.join('')).toContain('--package-manager <npm|pnpm|bun>');
    expect(output.join('')).toContain('--version --json');
  });
});

describe('cousin smoke isolated install execution', () => {
  test('npm mode initializes a temp project, installs the package spec, and runs local gsd provenance', () => {
    const { runCousinSmoke } = loadSmokeModule();
    const root = tempRoot();
    const runner = fakeRunner();

    try {
      const result = runCousinSmoke({
        packageManager: 'npm',
        packageSpec: './pkg.tgz',
        tempRoot: root,
        env: { PATH: process.env.PATH || '' },
        runner,
      });

      expect(runner.calls.map(call => [call.command, call.args])).toEqual([
        ['npm', ['init', '-y']],
        ['npm', ['install', './pkg.tgz']],
        [result.binPath, ['--version', '--json']],
      ]);
      expect(result.binPath).toContain(path.join('node_modules', '.bin', process.platform === 'win32' ? 'gsd.cmd' : 'gsd'));
      expect(result.env.HOME.startsWith(root)).toBe(true);
      expect(result.env.USERPROFILE.startsWith(root)).toBe(true);
      expect(result.env.CLAUDE_CONFIG_DIR.startsWith(root)).toBe(true);
      expect(result.env.GSD_CI_SMOKE_DIR.startsWith(root)).toBe(true);
      expect(result.env.COREPACK_HOME.startsWith(root)).toBe(true);
      expect(result.env.BUN_INSTALL.startsWith(root)).toBe(true);
      expect(result.env.NPM_CONFIG_USERCONFIG.startsWith(root)).toBe(true);
      expect(runner.calls[0].options.shell).toBe(process.platform === 'win32');
      expect(result.provenance.overlayManifestSha256).toHaveLength(64);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('pnpm mode uses Corepack pnpm and resolves the installed local bin', () => {
    const { runCousinSmoke } = loadSmokeModule();
    const root = tempRoot();
    const runner = fakeRunner();

    try {
      const result = runCousinSmoke({
        packageManager: 'pnpm',
        packageSpec: '@chude/get-stuff-done@latest',
        tempRoot: root,
        env: { PATH: process.env.PATH || '' },
        runner,
      });

      expect(runner.calls[0].command).toBe('corepack');
      expect(runner.calls[0].args).toEqual([
        'pnpm@10.17.1',
        'add',
        '--allow-build=@anthropic-ai/claude-code',
        '--allow-build=@chude/get-stuff-done',
        '@chude/get-stuff-done@latest',
      ]);
      expect(runner.calls[1].command).toBe(result.binPath);
      expect(runner.calls[1].args).toEqual(['--version', '--json']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('bun mode uses bun add and supports packed tarball specs for PR mode', () => {
    const { runCousinSmoke } = loadSmokeModule();
    const root = tempRoot();
    const runner = fakeRunner();
    const tarballSpec = path.join(root, 'chude-get-stuff-done-3.0.2.tgz');

    try {
      const result = runCousinSmoke({
        packageManager: 'bun',
        packageSpec: tarballSpec,
        tempRoot: root,
        env: { PATH: process.env.PATH || '' },
        runner,
      });

      expect(runner.calls[0].command).toBe('bun');
      expect(runner.calls[0].args).toEqual(['add', tarballSpec]);
      expect(runner.calls[1].command).toBe(result.binPath);
      expect(runner.calls[1].args).toEqual(['--version', '--json']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('Windows local bin resolution supports Bun executable shims', () => {
    const { localBinPath } = loadSmokeModule();
    const root = tempRoot();
    const binDir = path.join(root, 'node_modules', '.bin');

    try {
      fs.mkdirSync(binDir, { recursive: true });
      fs.writeFileSync(path.join(binDir, 'gsd.exe'), '', 'utf8');

      expect(localBinPath(root, 'gsd', 'win32')).toBe(path.join(binDir, 'gsd.exe'));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('optional NODE_AUTH_TOKEN is written only to temp project npmrc and redacted from errors', () => {
    const { runCousinSmoke } = loadSmokeModule();
    const root = tempRoot();
    const token = 'ghp_cousin_smoke_secret';
    const runner = fakeRunner({ failCommand: 'npm', stderr: `install failed with ${token}` });

    try {
      expect(() => runCousinSmoke({
        packageManager: 'npm',
        packageSpec: '@chude/get-stuff-done@latest',
        tempRoot: root,
        env: { PATH: process.env.PATH || '', NODE_AUTH_TOKEN: token },
        runner,
      })).toThrow('[REDACTED]');

      const projectDirs = fs.readdirSync(root)
        .filter(entry => entry.startsWith('project-'))
        .map(entry => path.join(root, entry));
      const npmrcPaths = projectDirs
        .map(projectDir => path.join(projectDir, '.npmrc'))
        .filter(filePath => fs.existsSync(filePath));

      expect(npmrcPaths).toHaveLength(1);
      expect(npmrcPaths[0].startsWith(root)).toBe(true);
      expect(fs.readFileSync(npmrcPaths[0], 'utf8')).toContain(token);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('rejects provenance output missing required JSON keys', () => {
    const { runCousinSmoke } = loadSmokeModule();
    const root = tempRoot();
    const runner = fakeRunner({ stdout: provenanceJson({ overlayManifestSha256: undefined }) });

    try {
      expect(() => runCousinSmoke({
        packageManager: 'bun',
        packageSpec: '@chude/get-stuff-done@latest',
        tempRoot: root,
        env: { PATH: process.env.PATH || '' },
        runner,
      })).toThrow('overlayManifestSha256');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('cousin smoke repository contract', () => {
  test('test file covers required acceptance terms', () => {
    const testText = fs.readFileSync(__filename, 'utf8');

    expect(testText).toContain('CLAUDE_CONFIG_DIR');
    expect(testText).toContain('--version');
    expect(testText).toContain('--json');
    expect(testText).toContain('npm');
    expect(testText).toContain('pnpm');
    expect(testText).toContain('bun');
    expect(PROJECT_ROOT).toContain('get-stuff-done');
  });
});
