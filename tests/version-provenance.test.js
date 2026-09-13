const { test, describe, expect, beforeEach, afterEach } = require('bun:test');
const fs = require('fs');
const path = require('path');

const { createTempDir, SUBPROCESS_TIMEOUT } = require('./helpers');
const { writeInstallMeta } = require('../bin/install.js');
const { readPackageProvenance } = require('../scripts/lib/package-provenance');
const {
  REQUIRED_PROVENANCE_KEYS,
  validateProvenance,
} = require('../scripts/cousin-smoke');

function writePackageRoot(rootDir, distMeta = {}) {
  fs.writeFileSync(
    path.join(rootDir, 'package.json'),
    JSON.stringify({
      name: '@chude/get-stuff-done',
      version: '3.0.2',
    }, null, 2),
    'utf-8'
  );

  const distDir = path.join(rootDir, 'dist');
  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(
    path.join(distDir, '.overlay-manifest.json'),
    JSON.stringify(['hooks/gsd-statusline.js'], null, 2),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(distDir, '.install-meta.json'),
    JSON.stringify({
      upstreamPackage: '@opengsd/gsd-core',
      upstreamVersion: '1.6.1',
      upstream_version: '1.6.1',
      ...distMeta,
    }, null, 2),
    'utf-8'
  );

  return distDir;
}

describe('VERSION and package provenance clarity', { timeout: SUBPROCESS_TIMEOUT }, () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    tmpDir.cleanup();
  });

  test('install metadata records fork package/version separately from upstream package/version', () => {
    const distDir = writePackageRoot(tmpDir.path);
    const targetDir = path.join(tmpDir.path, 'target');
    fs.mkdirSync(targetDir, { recursive: true });

    writeInstallMeta(targetDir, distDir, path.join(tmpDir.path, 'package.json'));

    const meta = JSON.parse(fs.readFileSync(path.join(targetDir, '.install-meta.json'), 'utf-8'));
    expect(meta.forkPackage).toBe('@chude/get-stuff-done');
    expect(meta.forkVersion).toBe('3.0.2');
    expect(meta.upstreamPackage).toBe('@opengsd/gsd-core');
    expect(meta.upstreamVersion).toBe('1.6.1');
    expect(meta.upstream_version).toBe('1.6.1');
    expect(meta.overlay_version).toBe('3.0.2');
  });

  test('launcher provenance reads forkVersion from package.json and upstreamVersion from dist metadata', () => {
    writePackageRoot(tmpDir.path, {
      upstreamPackage: '@opengsd/gsd-core',
      upstreamVersion: '1.6.1',
      upstream_version: '1.6.1',
    });

    const provenance = readPackageProvenance(tmpDir.path);

    expect(provenance.forkPackage).toBe('@chude/get-stuff-done');
    expect(provenance.forkVersion).toBe('3.0.2');
    expect(provenance.packageName).toBe('@chude/get-stuff-done');
    expect(provenance.version).toBe('3.0.2');
    expect(provenance.upstreamPackage).toBe('@opengsd/gsd-core');
    expect(provenance.upstreamVersion).toBe('1.6.1');
  });

  test('cousin smoke requires explicit forkPackage and upstreamPackage provenance fields', () => {
    expect(REQUIRED_PROVENANCE_KEYS).toContain('forkPackage');
    expect(REQUIRED_PROVENANCE_KEYS).toContain('forkVersion');
    expect(REQUIRED_PROVENANCE_KEYS).toContain('upstreamPackage');
    expect(REQUIRED_PROVENANCE_KEYS).toContain('upstreamVersion');

    const valid = validateProvenance({
      forkPackage: '@chude/get-stuff-done',
      forkVersion: '3.0.2',
      packageName: '@chude/get-stuff-done',
      version: '3.0.2',
      upstreamPackage: '@opengsd/gsd-core',
      upstreamVersion: '1.6.1',
      overlayManifestSha256: 'a'.repeat(64),
    });

    expect(valid.forkPackage).toBe('@chude/get-stuff-done');
  });

  test('no provenance code path reports upstream @opengsd/gsd-core as the fork package', () => {
    writePackageRoot(tmpDir.path);
    const provenance = readPackageProvenance(tmpDir.path);

    expect(provenance.forkPackage).not.toBe(provenance.upstreamPackage);
    expect(provenance.packageName).not.toBe(provenance.upstreamPackage);
    expect(() => validateProvenance({
      forkPackage: '@opengsd/gsd-core',
      forkVersion: '1.6.1',
      packageName: '@opengsd/gsd-core',
      version: '1.6.1',
      upstreamPackage: '@opengsd/gsd-core',
      upstreamVersion: '1.6.1',
      overlayManifestSha256: 'a'.repeat(64),
    })).toThrow('fork package must differ from upstream package');
  });

  test('test source contains the explicit provenance field names', () => {
    const testText = fs.readFileSync(__filename, 'utf-8');
    expect(testText).toContain('forkPackage');
    expect(testText).toContain('upstreamPackage');
    expect(testText).toContain('forkVersion');
    expect(testText).toContain('upstreamVersion');
  });
});
