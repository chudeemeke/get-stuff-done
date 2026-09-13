'use strict';

const { describe, test, expect } = require('bun:test');

const {
  HEAVY_SUBPROCESS_TIMEOUT,
  SUBPROCESS_TIMEOUT,
  runShellWithTimeout,
  runWithTimeout,
} = require('./helpers.cjs');

describe('subprocess timeout helpers', () => {
  test('successful command returns status, stdout, and stderr', () => {
    const result = runWithTimeout(process.execPath, ['-e', 'process.stdout.write("ok")']);

    expect(result.status).toBe(0);
    expect(result.stdout).toBe('ok');
    expect(result.stderr).toBe('');
    expect(result.timedOut).toBe(false);
  });

  test('non-zero command returns status and stderr without throwing by default', () => {
    const result = runWithTimeout(process.execPath, [
      '-e',
      'process.stderr.write("bad"); process.exit(7)',
    ]);

    expect(result.status).toBe(7);
    expect(result.stderr).toBe('bad');
    expect(result.timedOut).toBe(false);
  });

  test('throwOnError throws with captured result for non-zero exit', () => {
    expect(() => runWithTimeout(process.execPath, [
      '-e',
      'process.stderr.write("bad"); process.exit(7)',
    ], { throwOnError: true })).toThrow(/exited with status 7/);
  });

  test('timeout kills process and marks timedOut true', () => {
    const result = runWithTimeout(process.execPath, [
      '-e',
      'setTimeout(() => {}, 5000)',
    ], { timeout: 50 });

    expect(result.timedOut).toBe(true);
    expect(result.status).toBeNull();
  });

  test('heavy option uses HEAVY_SUBPROCESS_TIMEOUT by default', () => {
    const result = runWithTimeout(process.execPath, ['-e', ''], { heavy: true });

    expect(result.timeout).toBe(HEAVY_SUBPROCESS_TIMEOUT);
  });

  test('default timeout comes from SUBPROCESS_TIMEOUT', () => {
    const result = runWithTimeout(process.execPath, ['-e', '']);

    expect(result.timeout).toBe(SUBPROCESS_TIMEOUT);
  });

  test('runShellWithTimeout is available for explicit shell parsing cases', () => {
    const result = runShellWithTimeout(`${JSON.stringify(process.execPath)} -e "process.stdout.write('shell-ok')"`);

    expect(result.status).toBe(0);
    expect(result.stdout).toBe('shell-ok');
  });
});
