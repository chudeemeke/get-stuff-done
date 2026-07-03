/**
 * Codex installer adapter tests.
 *
 * These cover the composed upstream runtime artifact because that is the
 * installer path executed by the fork wrapper after `bun run compose`.
 */

const { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { createTempDir } = require('./helpers');
const { compose } = require('../scripts/compose');

let installerPackage;
let installCodexConfig;

function createInstallerPackageFixture() {
  const tmp = createTempDir();
  const distDir = path.join(tmp.path, 'dist');

  compose({ distDir });

  return {
    cleanup: tmp.cleanup,
    installScript: path.join(distDir, 'bin', 'install.js'),
  };
}

function importInstallerWithTestMode(installScript) {
  const originalGsdTestMode = process.env.GSD_TEST_MODE;
  process.env.GSD_TEST_MODE = '1';

  try {
    ({ installCodexConfig } = require(installScript));
  } finally {
    if (originalGsdTestMode === undefined) {
      delete process.env.GSD_TEST_MODE;
    } else {
      process.env.GSD_TEST_MODE = originalGsdTestMode;
    }
  }
}

describe('installCodexConfig', () => {
  let tmpDir;

  beforeAll(() => {
    installerPackage = createInstallerPackageFixture();
    importInstallerWithTestMode(installerPackage.installScript);
  }, 30000);

  afterAll(() => {
    if (installerPackage) installerPackage.cleanup();
  }, 30000);

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-codex-install-'));
  });

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('falls back to filename metadata when a Codex agent has no YAML frontmatter', () => {
    const targetDir = path.join(tmpDir, 'codex');
    const agentsSrc = path.join(tmpDir, 'agents');
    fs.mkdirSync(agentsSrc, { recursive: true });
    fs.writeFileSync(
      path.join(agentsSrc, 'gsd-no-frontmatter.md'),
      '# Agent Without Frontmatter\n\nUse GSD workflow context.'
    );

    expect(() => installCodexConfig(targetDir, agentsSrc)).not.toThrow();
    expect(fs.existsSync(path.join(targetDir, 'agents', 'gsd-no-frontmatter.toml'))).toBe(true);
    expect(fs.readFileSync(path.join(targetDir, 'config.toml'), 'utf8')).toContain('gsd-no-frontmatter');
  });
});
