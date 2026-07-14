const { describe, expect, test } = require('bun:test');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTRACT_PATH = path.join(__dirname, 'upstream-compat-contract.json');

describe('repository compatibility runner', () => {
  test('derives every repository suite from the validated compatibility contract', () => {
    const { getRepositorySuites } = require('../scripts/run-repository-compat');

    expect(getRepositorySuites({ contractPath: CONTRACT_PATH })).toEqual([
      path.join(__dirname, 'phase-verification.test.cjs'),
      path.join(__dirname, 'sync.test.cjs'),
    ]);
  });

  test('runs the derived suites through the current Node test runner', () => {
    const { runRepositoryCompat } = require('../scripts/run-repository-compat');
    const calls = [];
    const exitCode = runRepositoryCompat({
      contractPath: CONTRACT_PATH,
      spawnSyncImpl: (command, args, options) => {
        calls.push({ command, args, options });
        return { status: 0 };
      },
    });

    expect(exitCode).toBe(0);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({
      command: process.execPath,
      args: [
        '--test',
        path.join(__dirname, 'phase-verification.test.cjs'),
        path.join(__dirname, 'sync.test.cjs'),
      ],
      options: {
        cwd: PROJECT_ROOT,
        stdio: 'inherit',
      },
    });
  });

  test('propagates test failures and spawn errors as blocking exits', () => {
    const { runRepositoryCompat } = require('../scripts/run-repository-compat');

    expect(runRepositoryCompat({
      contractPath: CONTRACT_PATH,
      spawnSyncImpl: () => ({ status: 7 }),
    })).toBe(7);
    expect(() => runRepositoryCompat({
      contractPath: CONTRACT_PATH,
      spawnSyncImpl: () => ({ status: null, error: new Error('spawn failed') }),
    })).toThrow('spawn failed');
  });

  test('fails closed when the validated contract selects no repository suites', () => {
    const { runRepositoryCompat } = require('../scripts/run-repository-compat');

    expect(() => runRepositoryCompat({
      getRepositorySuitesImpl: () => [],
      spawnSyncImpl: () => ({ status: 0 }),
    })).toThrow('Compatibility contract contains no repository suites');
  });

  test('maps runner success and errors onto CLI exit semantics', () => {
    const { main } = require('../scripts/run-repository-compat');
    let stderr = '';
    const io = { stderr: { write: chunk => { stderr += chunk; } } };

    expect(main(io, {
      contractPath: CONTRACT_PATH,
      spawnSyncImpl: () => ({ status: 0 }),
    })).toBe(0);
    expect(main(io, {
      contractPath: CONTRACT_PATH,
      spawnSyncImpl: () => ({ error: new Error('runner unavailable') }),
    })).toBe(1);
    expect(stderr).toBe('Error: runner unavailable\n');
  });
});
