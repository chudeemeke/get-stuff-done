'use strict';

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const AUTHORITY_REL_PATH = path.join('.planning', 'upstream-authority.json');
const STABLE_VERSION_RE = /^[0-9]+\.[0-9]+\.[0-9]+$/;
const EMBEDDED_AUTHORITY = Object.freeze({
  schemaVersion: 1,
  contractScope: 'maintainer-build-time',
  active: Object.freeze({
    packageName: '@opengsd/gsd-core',
    version: '1.5.0',
    repository: 'https://github.com/open-gsd/gsd-core',
    npmUrl: 'https://www.npmjs.com/package/@opengsd/gsd-core',
    sourceRoot: '.',
    bin: Object.freeze({
      'gsd-core': 'bin/install.js',
      'gsd-tools': 'gsd-core/bin/gsd-tools.cjs',
      gsd_run: 'gsd-core/bin/gsd_run',
    }),
    paths: Object.freeze({
      agents: 'agents',
      commands: 'commands/gsd',
      hooksRuntime: 'hooks/dist',
      hooksSource: 'hooks',
      installer: 'bin/install.js',
      scripts: 'scripts',
      gsdTools: 'gsd-core/bin/gsd-tools.cjs',
      workflows: 'gsd-core/workflows',
    }),
  }),
  legacy: Object.freeze({
    packageName: 'get-shit-done-cc',
    repository: 'https://github.com/gsd-build/get-shit-done',
    npmUrl: 'https://www.npmjs.com/package/get-shit-done-cc',
    status: 'deprecated-authority',
  }),
  rules: Object.freeze({
    exactVersionPinRequired: true,
    allowLatestTag: false,
    allowPrerelease: false,
    globalInstallMutationAllowed: false,
    runtimeMayReadPlanningManifest: false,
  }),
});

function getProjectRoot(opts = {}) {
  return opts.projectRoot || PROJECT_ROOT;
}

function readAuthorityContract(opts = {}) {
  const projectRoot = getProjectRoot(opts);
  const authorityPath = opts.authorityPath || path.join(projectRoot, AUTHORITY_REL_PATH);
  let parsed;

  try {
    parsed = JSON.parse(fs.readFileSync(authorityPath, 'utf-8'));
  } catch (err) {
    if (err.code === 'ENOENT' && opts.allowEmbeddedFallback !== false) {
      return EMBEDDED_AUTHORITY;
    }
    throw new Error(`Failed to read upstream authority contract at ${authorityPath}: ${err.message}`);
  }

  validateAuthorityShape(parsed);
  return parsed;
}

function validateAuthorityShape(authority) {
  if (!authority || typeof authority !== 'object') {
    throw new Error('Invalid upstream authority contract: root must be an object');
  }
  if (authority.contractScope !== 'maintainer-build-time') {
    throw new Error('Invalid upstream authority contract: contractScope must be maintainer-build-time');
  }
  if (!authority.active || typeof authority.active !== 'object') {
    throw new Error('Invalid upstream authority contract: missing active package section');
  }
  if (!authority.active.packageName) {
    throw new Error('Invalid upstream authority contract: missing active.packageName');
  }
  validatePinnedVersion(authority.active.version);
  validateRelativePath(authority.active.sourceRoot == null ? '.' : authority.active.sourceRoot, 'active.sourceRoot');

  for (const [key, value] of Object.entries(authority.active.bin || {})) {
    validateRelativePath(value, `active.bin.${key}`);
  }
  for (const [key, value] of Object.entries(authority.active.paths || {})) {
    validateRelativePath(value, `active.paths.${key}`);
  }
}

function resolveAuthority(optsOrAuthority = {}) {
  if (optsOrAuthority && optsOrAuthority.active) return optsOrAuthority;
  if (optsOrAuthority && optsOrAuthority.authority) return optsOrAuthority.authority;
  return readAuthorityContract(optsOrAuthority);
}

function getActivePackageName(authority = readAuthorityContract()) {
  return resolveAuthority(authority).active.packageName;
}

function getActivePackageVersion(authority = readAuthorityContract()) {
  return resolveAuthority(authority).active.version;
}

function getActiveRepository(authority = readAuthorityContract()) {
  return resolveAuthority(authority).active.repository;
}

function validatePinnedVersion(version) {
  if (typeof version !== 'string' || !STABLE_VERSION_RE.test(version)) {
    throw new Error(`Upstream version must be an exact stable semver pin, got: ${String(version)}`);
  }
  return version;
}

function validateRelativePath(value, fieldName = 'path') {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${fieldName} must be a non-empty relative path`);
  }

  const normalised = value.replace(/\\/g, '/');
  if (
    path.isAbsolute(value) ||
    path.posix.isAbsolute(normalised) ||
    path.win32.isAbsolute(value) ||
    normalised === '..' ||
    normalised.startsWith('../') ||
    normalised.includes('/../')
  ) {
    throw new Error(`${fieldName} must be a safe relative path inside the upstream package`);
  }

  return normalised.replace(/^\.\//, '').replace(/\/+$/, '') || '.';
}

function packageNameToParts(packageName) {
  if (typeof packageName !== 'string' || packageName.length === 0) {
    throw new Error('Package name must be a non-empty string');
  }
  if (packageName.startsWith('@')) {
    const parts = packageName.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error(`Invalid scoped package name: ${packageName}`);
    }
    return parts;
  }
  return [packageName];
}

function getPackageDir(opts = {}) {
  const authority = resolveAuthority(opts);
  const projectRoot = getProjectRoot(opts);
  const packageName = opts.packageName || getActivePackageName(authority);
  return path.join(projectRoot, 'node_modules', ...packageNameToParts(packageName));
}

function assertPackageDir(opts = {}) {
  const packageDir = getPackageDir(opts);
  const authority = resolveAuthority(opts);
  if (!fs.existsSync(packageDir)) {
    throw new Error(
      `Upstream package directory not found for ${getActivePackageName(authority)}: ${packageDir}. ` +
      'Run bun install to install the pinned upstream package.'
    );
  }
  return packageDir;
}

function getSourceRootRelative(opts = {}) {
  const authority = resolveAuthority(opts);
  const sourceRoot = authority.active.sourceRoot == null ? '.' : authority.active.sourceRoot;
  return validateRelativePath(sourceRoot, 'active.sourceRoot');
}

function resolveSourceRoot(opts = {}) {
  const authority = resolveAuthority(opts);
  const packageDir = opts.mustExist === false ? getPackageDir(opts) : assertPackageDir(opts);
  const sourceRoot = getSourceRootRelative({ authority });
  const sourceRootPath = path.join(packageDir, sourceRoot);

  if (opts.mustExist !== false && !fs.existsSync(sourceRootPath)) {
    throw new Error(`Upstream source root not found for ${getActivePackageName(authority)} (${sourceRoot}): ${sourceRootPath}`);
  }

  return sourceRootPath;
}

function getBinRelativePath(binName, opts = {}) {
  const authority = resolveAuthority(opts);
  const bin = authority.active.bin || {};
  if (!Object.prototype.hasOwnProperty.call(bin, binName)) {
    throw new Error(`Missing upstream bin "${binName}" in authority contract for ${getActivePackageName(authority)}`);
  }
  return validateRelativePath(bin[binName], `active.bin.${binName}`);
}

function getAuthorityPathRelative(pathName, opts = {}) {
  const authority = resolveAuthority(opts);
  const paths = authority.active.paths || {};
  if (!Object.prototype.hasOwnProperty.call(paths, pathName)) {
    throw new Error(`Missing upstream path "${pathName}" in authority contract for ${getActivePackageName(authority)}`);
  }
  return validateRelativePath(paths[pathName], `active.paths.${pathName}`);
}

function withTrailingSlash(relPath) {
  const normalised = validateRelativePath(relPath);
  return normalised.endsWith('/') ? normalised : `${normalised}/`;
}

function getCategoryDirMap(optsOrAuthority = {}) {
  const authority = resolveAuthority(optsOrAuthority);
  return {
    workflows: withTrailingSlash(getAuthorityPathRelative('workflows', { authority })),
    commands: withTrailingSlash(getAuthorityPathRelative('commands', { authority })),
    agents: withTrailingSlash(getAuthorityPathRelative('agents', { authority })),
    hooks: withTrailingSlash(getAuthorityPathRelative('hooksRuntime', { authority })),
  };
}

function getRequiredUpstreamDirs(optsOrAuthority = {}) {
  const authority = resolveAuthority(optsOrAuthority);
  const required = new Set();

  for (const relPath of Object.values(authority.active.paths || {})) {
    required.add(validateRelativePath(relPath).split('/')[0]);
  }
  for (const relPath of Object.values(authority.active.bin || {})) {
    required.add(validateRelativePath(relPath).split('/')[0]);
  }

  return [...required].sort();
}

module.exports = {
  AUTHORITY_REL_PATH,
  EMBEDDED_AUTHORITY,
  readAuthorityContract,
  getActivePackageName,
  getActivePackageVersion,
  getActiveRepository,
  getPackageDir,
  assertPackageDir,
  getSourceRootRelative,
  resolveSourceRoot,
  getBinRelativePath,
  getAuthorityPathRelative,
  getCategoryDirMap,
  getRequiredUpstreamDirs,
  validatePinnedVersion,
  validateRelativePath,
};
