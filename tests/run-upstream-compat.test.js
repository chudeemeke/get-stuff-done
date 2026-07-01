const { describe, expect, test } = require('bun:test');
const path = require('path');

const {
  getCompatPackageRoot,
  parseTestOutput,
} = require('../scripts/run-upstream-compat');

describe('run-upstream-compat package root resolution', () => {
  test('uses active authority gsdTools path instead of legacy get-shit-done path', () => {
    const distRoot = path.join('repo', 'dist');
    const authority = {
      contractScope: 'maintainer-build-time',
      active: {
        packageName: '@opengsd/gsd-core',
        version: '1.5.0',
        sourceRoot: '.',
        bin: {},
        paths: {
          gsdTools: 'gsd-core/bin/gsd-tools.cjs',
        },
      },
    };

    expect(getCompatPackageRoot({ distRoot, authority })).toBe(
      path.join(distRoot, 'gsd-core')
    );
  });

  test('falls back to dist root when gsdTools is directly under bin', () => {
    const distRoot = path.join('repo', 'dist');
    const authority = {
      contractScope: 'maintainer-build-time',
      active: {
        packageName: 'legacy-package',
        version: '1.0.0',
        sourceRoot: '.',
        bin: {},
        paths: {
          gsdTools: 'bin/gsd-tools.cjs',
        },
      },
    };

    expect(getCompatPackageRoot({ distRoot, authority })).toBe(distRoot);
  });
});

describe('run-upstream-compat output parsing', () => {
  test('parses TAP pass fail and skipped counts', () => {
    const result = parseTestOutput('# pass 10\n# fail 2\n# skipped 1\n', 1);

    expect(result.passed).toBe(10);
    expect(result.failed).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.ok).toBe(false);
  });
});
