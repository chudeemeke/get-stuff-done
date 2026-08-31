'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');

function resolveCompatPackageRoot(env = process.env, projectRoot = PROJECT_ROOT) {
  return env.GSD_COMPAT_PACKAGE_ROOT
    ? path.resolve(env.GSD_COMPAT_PACKAGE_ROOT)
    : path.join(projectRoot, 'dist', 'gsd-core');
}

/**
 * Resolve the upstream @opengsd/gsd-core version of the package under test.
 *
 * A composed candidate (matrix temp dist or the repo's dist/) carries
 * .install-meta.json one level above the package root with the exact
 * upstream_version it was composed from. The legacy direct-run root
 * (get-stuff-done/, a pre-Open-GSD self-install) has no such meta — its
 * version numbering belongs to a different line entirely, so returning null
 * (unknown) is the honest answer there, never a semver guess.
 *
 * @param {string} packageRoot  Result of resolveCompatPackageRoot()
 * @returns {string|null}  Stable x.y.z upstream version, or null when unknown
 */
function resolveCompatUpstreamVersion(packageRoot) {
  try {
    const meta = JSON.parse(
      fs.readFileSync(path.join(packageRoot, '..', '.install-meta.json'), 'utf-8')
    );
    const version = meta.upstream_version;
    return typeof version === 'string' && /^\d+\.\d+\.\d+$/.test(version) ? version : null;
  } catch {
    return null;
  }
}

/**
 * True when the package under test is an Open GSD upstream at or above the
 * given stable version; false below it; null when the version is unknown
 * (legacy root) and the caller must fall back to version-agnostic behavior.
 */
function compatUpstreamAtLeast(packageRoot, minVersion) {
  const version = resolveCompatUpstreamVersion(packageRoot);
  if (version === null) return null;
  const [a, b, c] = version.split('.').map(Number);
  const [x, y, z] = minVersion.split('.').map(Number);
  if (a !== x) return a > x;
  if (b !== y) return b > y;
  return c >= z;
}

module.exports = {
  resolveCompatPackageRoot,
  resolveCompatUpstreamVersion,
  compatUpstreamAtLeast,
};
