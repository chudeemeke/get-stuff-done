'use strict';

const { describe, expect, test } = require('bun:test');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  assertCanonicalBunTestInvocation,
  hasFunctionalTestAuthority,
  runAuthorityGuard,
} = require('./helpers/enforce-bun-test-authority');

describe('Bun test authority preload', () => {
  test('accepts the adapter-owned child capability', () => {
    expect(hasFunctionalTestAuthority({ GSD_BUN_TEST_AUTHORITY: 'functional' })).toBe(true);
  });

  test('rejects direct invocation with routing guidance', () => {
    expect(() => assertCanonicalBunTestInvocation({}, ['bun', 'test'])).toThrow('bun run test');
    expect(() => assertCanonicalBunTestInvocation({}, ['bun', 'test', 'phase.test.cjs'])).toThrow('node --test');
  });

  test('guard reports one error and exits through injected process ports', () => {
    const messages = [];
    const exitCodes = [];

    expect(
      runAuthorityGuard({}, ['bun', 'test'], {
        stderr: {
          write(message) {
            messages.push(message);
          },
        },
        process: {
          exit(code) {
            exitCodes.push(code);
          },
        },
      })
    ).toBe(1);
    expect(messages).toEqual([
      'Use bun run test; bare bun test crosses the Bun/Node test-authority boundary.\n',
    ]);
    expect(exitCodes).toEqual([1]);
  });

  test('bare bun test exits once with one actionable message', () => {
    const result = spawnSync(process.env.BUN_EXE || 'bun', ['test'], {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      env: {
        ...process.env,
        GSD_BUN_TEST_AUTHORITY: '',
      },
      shell: false,
      timeout: 5000,
    });
    const output = `${result.stdout}${result.stderr}`;
    const matches = output.match(/bare bun test crosses the Bun\/Node test-authority boundary/g) || [];

    expect(result.status).toBe(1);
    expect(matches).toHaveLength(1);
  });
});
