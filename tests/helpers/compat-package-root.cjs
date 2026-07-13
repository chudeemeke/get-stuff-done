'use strict';

const path = require('node:path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');

function resolveCompatPackageRoot(env = process.env, projectRoot = PROJECT_ROOT) {
  return env.GSD_COMPAT_PACKAGE_ROOT
    ? path.resolve(env.GSD_COMPAT_PACKAGE_ROOT)
    : path.join(projectRoot, 'dist', 'gsd-core');
}

module.exports = {
  resolveCompatPackageRoot,
};
