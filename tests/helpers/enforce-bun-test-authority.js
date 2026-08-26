'use strict';

const fs = require('fs');

// process.exit() does not flush pending writes, and on POSIX a stderr pipe is asynchronous.
// Writing the guidance through process.stderr.write and exiting on the next line therefore
// races: the message reaches a terminal (unbuffered) but can be truncated when stderr is a
// pipe, which is exactly how a parent captures it. That surfaced as a macOS-only failure
// where `bun test` exited 1 in 25ms with no message at all, while Windows and Linux won the
// race. fs.writeSync bypasses the stream buffer entirely, so the message is on the fd before
// exit is called on every platform.
const synchronousStderr = {
  write(message) {
    try {
      fs.writeSync(2, message);
    } catch {
      // EPIPE/EBADF: the parent closed stderr. Losing the message is preferable to throwing
      // out of a preload guard whose job is to fail with a clear exit code.
    }
  },
};

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

// Deliberately NOT process.argv. A bun preload runs once per discovered test file, and bun
// puts the file it is currently loading into argv. Routing on that made the guidance depend
// on filesystem iteration order: on macos-15 bun reached tests/phase.test.cjs first, so a
// plain `bun test` was told "Run Node-native contracts with node --test" instead of "Use bun
// run test", and the same command produced different advice on ubuntu and windows.
//
// The preload only ever guards one situation — the process was started as bare `bun test`
// without the adapter-owned authority variable — so it states that situation directly. The
// .test.cjs route stays reachable through assertCanonicalBunTestInvocation for callers that
// pass a real command line, which is what its unit test exercises.
const BARE_BUN_TEST_INVOCATION = ['bun', 'test'];

if (!hasFunctionalTestAuthority(process.env)) {
  runAuthorityGuard(process.env, BARE_BUN_TEST_INVOCATION, {
    stderr: synchronousStderr,
    process,
  });
}

module.exports = {
  assertCanonicalBunTestInvocation,
  hasFunctionalTestAuthority,
  runAuthorityGuard,
};
