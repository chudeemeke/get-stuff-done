'use strict';

const { describe, expect, test } = require('bun:test');
const {
  buildBunTestArgs,
  main,
  normalizeForwardedArgs,
  runBunTests,
} = require('../scripts/run-bun-tests');

describe('canonical Bun functional runner', () => {
  test('always prepends the explicit .test.js authority filter', () => {
    expect(buildBunTestArgs([])).toEqual(['test', '.test.js']);
    expect(buildBunTestArgs(['--coverage'])).toEqual(['test', '.test.js', '--coverage']);
  });

  test('uses an explicit .test.js path as a focused selector', () => {
    expect(buildBunTestArgs(['./tests/config.test.js', '--coverage'])).toEqual([
      'test',
      './tests/config.test.js',
      '--coverage',
    ]);
  });

  test('normalizes bun run argument separators', () => {
    expect(normalizeForwardedArgs(['--', '--coverage'])).toEqual(['--coverage']);
    expect(normalizeForwardedArgs(['--coverage'])).toEqual(['--coverage']);
  });

  test('rejects Node-native suites and silent-empty flags', () => {
    expect(() => buildBunTestArgs(['tests/phase.test.cjs'])).toThrow('node --test');
    expect(() => buildBunTestArgs(['--pass-with-no-tests'])).toThrow('zero-test');
    expect(() => buildBunTestArgs(['tests/phase.spec.ts'])).toThrow('Unsupported Bun test selector');
  });

  test('spawns Bun without a shell and propagates its status', () => {
    const calls = [];
    const status = runBunTests(['--coverage'], {
      executable: 'bun',
      spawnSync(command, args, options) {
        calls.push({ command, args, options });
        return { status: 7 };
      },
    });

    expect(status).toBe(7);
    expect(calls).toHaveLength(1);
    expect(calls[0].command).toBe('bun');
    expect(calls[0].args).toEqual(['test', '.test.js', '--coverage']);
    expect(calls[0].options.stdio).toBe('inherit');
    expect(calls[0].options.shell).toBe(false);
    expect(calls[0].options.env.GSD_BUN_TEST_AUTHORITY).toBe('functional');
  });

  test('fails closed on spawn errors and missing child status', () => {
    const failure = new Error('spawn unavailable');

    expect(() =>
      runBunTests([], {
        spawnSync() {
          return { error: failure };
        },
      })
    ).toThrow('spawn unavailable');
    expect(
      runBunTests([], {
        spawnSync() {
          return { status: null };
        },
      })
    ).toBe(1);
  });

  test('main translates validation errors into one actionable failure', () => {
    const messages = [];
    const originalWrite = process.stderr.write;
    process.stderr.write = message => {
      messages.push(message);
      return true;
    };

    try {
      expect(main(['tests/phase.spec.ts'])).toBe(1);
    } finally {
      process.stderr.write = originalWrite;
    }

    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('Unsupported Bun test selector');
  });
});
