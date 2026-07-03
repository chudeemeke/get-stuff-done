'use strict';

/* eslint-disable security/detect-non-literal-fs-filename -- provenance reads package-owned files below the supplied package root */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  getActivePackageName,
  getActivePackageVersion,
  readAuthorityContract,
} = require('./upstream-source');

function readJsonFile(filePath, description) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    throw new Error(`Failed to read ${description} at ${filePath}: ${err.message}`);
  }
}

function readPackageJson(rootDir) {
  const packagePath = path.join(rootDir, 'package.json');
  const pkg = readJsonFile(packagePath, 'package.json');

  if (!pkg.name || !pkg.version) {
    throw new Error(`Invalid package.json at ${packagePath}: missing name or version`);
  }

  return pkg;
}

function readDistMeta(rootDir) {
  const metaPath = path.join(rootDir, 'dist', '.install-meta.json');
  if (!fs.existsSync(metaPath)) {
    return null;
  }

  return readJsonFile(metaPath, 'dist install metadata');
}

function hashOverlayManifest(rootDir) {
  const manifestPath = path.join(rootDir, 'dist', '.overlay-manifest.json');
  let content;

  try {
    content = fs.readFileSync(manifestPath);
  } catch (err) {
    throw new Error(`Failed to read overlay manifest at ${manifestPath}: ${err.message}`);
  }

  try {
    const parsed = JSON.parse(content.toString('utf-8'));
    if (!Array.isArray(parsed)) {
      throw new Error('expected an array');
    }
  } catch (err) {
    throw new Error(`Invalid overlay manifest at ${manifestPath}: ${err.message}`);
  }

  return crypto.createHash('sha256').update(content).digest('hex');
}

function readPackageProvenance(rootDir) {
  const packageRoot = rootDir || path.join(__dirname, '..', '..');
  const pkg = readPackageJson(packageRoot);
  const authority = readAuthorityContract({ projectRoot: packageRoot });
  const distMeta = readDistMeta(packageRoot);
  const upstreamVersion = distMeta && typeof distMeta.upstream_version === 'string'
    ? distMeta.upstream_version
    : getActivePackageVersion(authority);

  return {
    packageName: pkg.name,
    version: pkg.version,
    upstreamPackage: getActivePackageName(authority),
    upstreamVersion,
    overlayManifestSha256: hashOverlayManifest(packageRoot),
  };
}

module.exports = {
  hashOverlayManifest,
  readPackageProvenance,
};
