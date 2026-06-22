'use strict';

const { describe, test, expect, beforeEach, afterEach } = require('bun:test');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  readAuthorityContract,
  getActivePackageName,
  getActivePackageVersion,
  getActiveRepository,
  getPackageDir,
  assertPackageDir,
  resolveSourceRoot,
  getBinRelativePath,
  getCategoryDirMap,
  getRequiredUpstreamDirs,
  validatePinnedVersion,
  validateRelativePath,
} = require('../scripts/lib/upstream-source');

const PROJECT_ROOT = path.join(__dirname, '..');

function makeAuthority(overrides = {}) {
  const base = {
    schemaVersion: 1,
    contractScope: 'maintainer-build-time',
    active: {
      packageName: '@opengsd/gsd-core',
      version: '1.5.0',
      repository: 'https://github.com/open-gsd/gsd-core',
      npmUrl: 'https://www.npmjs.com/package/@opengsd/gsd-core',
      sourceRoot: '.',
      bin: {
        'gsd-core': 'bin/install.js',
        'gsd-tools': 'gsd-core/bin/gsd-tools.cjs',
        gsd_run: 'gsd-core/bin/gsd_run',
      },
      paths: {
        agents: 'agents',
        commands: 'commands/gsd',
        hooksRuntime: 'hooks/dist',
        hooksSource: 'hooks',
        installer: 'bin/install.js',
        scripts: 'scripts',
        gsdTools: 'gsd-core/bin/gsd-tools.cjs',
        workflows: 'gsd-core/workflows',
      },
    },
    legacy: {
      packageName: 'get-shit-done-cc',
      repository: 'https://github.com/gsd-build/get-shit-done',
      npmUrl: 'https://www.npmjs.com/package/get-shit-done-cc',
      status: 'deprecated-authority',
    },
    rules: {
      exactVersionPinRequired: true,
      allowLatestTag: false,
      allowPrerelease: false,
      globalInstallMutationAllowed: false,
      runtimeMayReadPlanningManifest: false,
    },
  };

  return {
    ...base,
    ...overrides,
    active: { ...base.active, ...(overrides.active || {}) },
    rules: { ...base.rules, ...(overrides.rules || {}) },
  };
}

describe('upstream-source authority helper', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-upstream-source-'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('reads active package identity from the maintainer authority contract', () => {
    const authority = readAuthorityContract({ projectRoot: PROJECT_ROOT });

    expect(getActivePackageName(authority)).toBe('@opengsd/gsd-core');
    expect(getActivePackageVersion(authority)).toBe('1.5.0');
    expect(getActiveRepository(authority)).toBe('https://github.com/open-gsd/gsd-core');
  });

  test('resolves scoped npm packages under node_modules without shell escaping', () => {
    const authority = makeAuthority();
    const pkgDir = getPackageDir({ projectRoot: tmpDir, authority });

    expect(pkgDir).toBe(path.join(tmpDir, 'node_modules', '@opengsd', 'gsd-core'));
  });

  test('resolves the package source root from manifest data', () => {
    const authority = makeAuthority({ active: { sourceRoot: 'gsd-core' } });
    const pkgDir = getPackageDir({ projectRoot: tmpDir, authority });
    fs.mkdirSync(path.join(pkgDir, 'gsd-core'), { recursive: true });

    expect(resolveSourceRoot({ projectRoot: tmpDir, authority }))
      .toBe(path.join(pkgDir, 'gsd-core'));
  });

  test('maps compose categories to the Open GSD package layout', () => {
    const map = getCategoryDirMap(makeAuthority());

    expect(map).toEqual({
      workflows: 'gsd-core/workflows/',
      commands: 'commands/gsd/',
      agents: 'agents/',
      hooks: 'hooks/dist/',
    });
  });

  test('required upstream entries include gsd-core and exclude legacy get-shit-done root', () => {
    const required = getRequiredUpstreamDirs(makeAuthority());

    expect(required).toContain('gsd-core');
    expect(required).not.toContain('get-shit-done');
  });

  test('rejects mutable tags and prerelease channels for active package pins', () => {
    for (const version of ['latest', 'next', '1.5.0-canary.1', '1.5.0-dev.1', '1.5.0-rc.1']) {
      expect(() => validatePinnedVersion(version)).toThrow(/exact stable semver/i);
    }
  });

  test('rejects traversal and absolute manifest-controlled paths', () => {
    for (const candidate of ['../outside', '..\\outside', '/tmp/pkg', 'C:\\tmp\\pkg']) {
      expect(() => validateRelativePath(candidate, 'sourceRoot')).toThrow(/relative path/i);
    }
  });

  test('reports a clear error when the upstream package directory is missing', () => {
    expect(() => assertPackageDir({ projectRoot: tmpDir, authority: makeAuthority() }))
      .toThrow(/Upstream package directory not found.*@opengsd\/gsd-core/);
  });

  test('reports a clear error when the manifest source root is missing', () => {
    const authority = makeAuthority({ active: { sourceRoot: 'missing-root' } });
    fs.mkdirSync(getPackageDir({ projectRoot: tmpDir, authority }), { recursive: true });

    expect(() => resolveSourceRoot({ projectRoot: tmpDir, authority }))
      .toThrow(/Upstream source root not found.*missing-root/);
  });

  test('reports a clear error for missing expected bin entries', () => {
    expect(() => getBinRelativePath('gsd-sdk', { authority: makeAuthority() }))
      .toThrow(/Missing upstream bin "gsd-sdk"/);
  });
});
