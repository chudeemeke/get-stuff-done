#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');
const {
  loadCompatContract,
  validateCompatContract,
} = require('./run-upstream-compat');

const PROJECT_ROOT = path.join(__dirname, '..');
const DEFAULT_CONTRACT_PATH = path.join(PROJECT_ROOT, 'tests', 'upstream-compat-contract.json');

function getRepositorySuites(options = {}) {
  const contractPath = options.contractPath || DEFAULT_CONTRACT_PATH;
  const testsDir = options.testsDir || path.dirname(contractPath);
  const contract = validateCompatContract(loadCompatContract(contractPath), { testsDir });

  return contract.suites
    .filter(suite => suite.classification === 'repository')
    .map(suite => path.join(testsDir, suite.path));
}

function runRepositoryCompat(options = {}) {
  const getRepositorySuitesImpl = options.getRepositorySuitesImpl || getRepositorySuites;
  const suites = getRepositorySuitesImpl(options);
  if (suites.length === 0) {
    throw new Error('Compatibility contract contains no repository suites');
  }

  const spawnSyncImpl = options.spawnSyncImpl || spawnSync;
  const result = spawnSyncImpl(process.execPath, ['--test', ...suites], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  return Number.isInteger(result.status) ? result.status : 1;
}

function main(io = process, options = {}) {
  try {
    return runRepositoryCompat(options);
  } catch (error) {
    io.stderr.write(`Error: ${error.message}\n`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  getRepositorySuites,
  main,
  runRepositoryCompat,
};
