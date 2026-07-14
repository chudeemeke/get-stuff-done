'use strict';

function hasFunctionalTestAuthority(environment) {
  return environment.GSD_BUN_TEST_AUTHORITY === 'functional';
}

function assertCanonicalBunTestInvocation(environment, argv) {
  if (hasFunctionalTestAuthority(environment)) return;

  const route = argv.some(arg => arg.includes('.test.cjs'))
    ? 'Run Node-native contracts with node --test or bun run test:repository-compat.'
    : 'Use bun run test; bare bun test crosses the Bun/Node test-authority boundary.';
  throw new Error(route);
}

function runAuthorityGuard(environment, argv, ports) {
  try {
    assertCanonicalBunTestInvocation(environment, argv);
    return 0;
  } catch (error) {
    ports.stderr.write(`${error.message}\n`);
    ports.process.exit(1);
    return 1;
  }
}

if (!hasFunctionalTestAuthority(process.env)) {
  runAuthorityGuard(process.env, process.argv, {
    stderr: process.stderr,
    process,
  });
}

module.exports = {
  assertCanonicalBunTestInvocation,
  hasFunctionalTestAuthority,
  runAuthorityGuard,
};
