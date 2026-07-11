const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  copyCompatHelpers,
  discoverTestFiles,
  getCompatPackageRoot,
  getCompatTestTimeoutMs,
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

describe('run-upstream-compat test discovery', () => {
  test('excludes tests that require repo-root dist layout', () => {
    const basenames = discoverTestFiles().map(filePath => path.basename(filePath));

    expect(basenames).not.toContain('sync.test.cjs');
    expect(basenames).not.toContain('runtime-overrides.test.cjs');
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

describe('run-upstream-compat timeout policy', () => {
  test('uses a longer default timeout on Windows and supports env override', () => {
    expect(getCompatTestTimeoutMs({}, 'win32')).toBe(240000);
    expect(getCompatTestTimeoutMs({}, 'linux')).toBe(120000);
    expect(getCompatTestTimeoutMs({ GSD_COMPAT_TEST_TIMEOUT_MS: '300000' }, 'win32')).toBe(300000);
  });
});

describe('run-upstream-compat helper staging', () => {
  test('copies helpers.cjs and its local helper dependency tree', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-compat-helper-test-'));

    try {
      copyCompatHelpers(tmpDir);

      expect(fs.existsSync(path.join(tmpDir, 'helpers.cjs'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'helpers', 'index.js'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'helpers', 'subprocess-with-timeout.js'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'helpers', 'test-timeouts.js'))).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
