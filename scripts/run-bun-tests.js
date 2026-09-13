'use strict';

const { spawnSync } = require('child_process');

const FUNCTIONAL_TEST_FILTER = '.test.js';

function normalizeForwardedArgs(args) {
  const normalized = [...args];
  if (normalized[0] === '--') normalized.shift();
  return normalized;
}

function buildBunTestArgs(forwardedArgs) {
  const args = normalizeForwardedArgs(forwardedArgs);

  if (args.includes('--pass-with-no-tests')) {
    throw new Error('Refusing --pass-with-no-tests: a zero-test functional gate must fail closed.');
  }
  if (args.some(arg => /\.test\.cjs(?:$|\s)/i.test(arg))) {
    throw new Error('Node-native .test.cjs contracts must run with node --test or test:repository-compat.');
  }
  const unsupportedSelectors = args.filter(
    arg => /\.(?:test|spec)\.[a-z0-9]+$/i.test(arg) && !arg.endsWith('.test.js')
  );
  if (unsupportedSelectors.length > 0) {
    throw new Error(`Unsupported Bun test selector: ${unsupportedSelectors.join(', ')}`);
  }
  const hasFocusedSelector = args.some(arg => arg.endsWith('.test.js'));

  return hasFocusedSelector
    ? ['test', ...args]
    : ['test', FUNCTIONAL_TEST_FILTER, ...args];
}

function runBunTests(forwardedArgs, dependencies = {}) {
  const spawn = dependencies.spawnSync || spawnSync;
  const executable = dependencies.executable || process.env.BUN_EXE || 'bun';
  const result = spawn(executable, buildBunTestArgs(forwardedArgs), {
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      GSD_BUN_TEST_AUTHORITY: 'functional',
    },
  });

  if (result.error) throw result.error;
  return Number.isInteger(result.status) ? result.status : 1;
}

function main(args = process.argv.slice(2)) {
  try {
    return runBunTests(args);
  } catch (error) {
    process.stderr.write(`Functional test runner failed: ${error.message}\n`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  FUNCTIONAL_TEST_FILTER,
  buildBunTestArgs,
  main,
  normalizeForwardedArgs,
  runBunTests,
};
