'use strict';
const { test, expect } = require('./helpers/portable-test-api');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { inspectInstallations, main } = require('../scripts/check-install-drift');
const { getActivePackageVersion } = require('../scripts/lib/upstream-source');

test('reports matching upstream generations independently of fork version', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-drift-'));
  try {
    for (const runtime of ['.claude', '.codex']) {
      const target = path.join(home, runtime);
      fs.mkdirSync(path.join(target, 'gsd-core'), { recursive: true });
      fs.writeFileSync(path.join(target, 'gsd-core', 'VERSION'), '1.8.0\n');
      fs.writeFileSync(path.join(target, '.install-meta.json'), JSON.stringify({
        upstreamPackage: '@opengsd/gsd-core', upstreamVersion: '1.8.0', forkVersion: '3.0.2',
      }));
    }
    const report = inspectInstallations({ home, expectedVersion: '1.8.0' });
    expect(report.ok).toBe(true);
    expect(report.runtimes.map(item => item.status)).toEqual(['matching-version', 'matching-version']);
    const tildeReport = inspectInstallations({ home, expectedVersion: '1.8.0', runtimeRoots: { claude: '~/.claude', codex: '~/.codex' } });
    expect(tildeReport.ok).toBe(true);
    expect(tildeReport.runtimes.map(item => item.target)).toEqual([path.join(home, '.claude'), path.join(home, '.codex')]);
    fs.writeFileSync(path.join(home, '.claude/gsd-core/VERSION'), '1.6.1');
    expect(inspectInstallations({ home, expectedVersion: '1.8.0' }).ok).toBe(false);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test('distinguishes legacy, absent, missing and invalid provenance without comparing lineages', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-drift-'));
  try {
    expect(inspectInstallations({ home }).runtimes[0].status).toBe('missing');
    fs.mkdirSync(path.join(home, '.claude/get-shit-done'), { recursive: true });
    fs.writeFileSync(path.join(home, '.claude/get-shit-done/VERSION'), '1.32.0');
    expect(inspectInstallations({ home }).runtimes[0].status).toBe('legacy-source');
    fs.mkdirSync(path.join(home, '.codex/get-stuff-done'), { recursive: true });
    fs.writeFileSync(path.join(home, '.codex/get-stuff-done/VERSION'), '2.4.0');
    expect(inspectInstallations({ home }).runtimes[1].status).toBe('legacy-source');
    fs.mkdirSync(path.join(home, '.claude/gsd-core'), { recursive: true });
    fs.writeFileSync(path.join(home, '.claude/gsd-core/VERSION'), getActivePackageVersion());
    expect(inspectInstallations({ home }).runtimes[0].status).toBe('unverified-provenance');
    const meta = path.join(home, '.claude/.install-meta.json');
    fs.writeFileSync(meta, '{');
    expect(inspectInstallations({ home }).runtimes[0].status).toBe('unreadable-provenance');
    fs.writeFileSync(meta, JSON.stringify({ upstreamPackage: 'get-shit-done-cc', upstreamVersion: getActivePackageVersion() }));
    expect(inspectInstallations({ home }).runtimes[0].status).toBe('drift');
    fs.writeFileSync(meta, JSON.stringify({ upstreamPackage: '@opengsd/gsd-core', upstreamVersion: '0.0.1' }));
    expect(inspectInstallations({ home }).runtimes[0].status).toBe('drift');
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test('CLI reports truthful exit codes for isolated homes and invalid arguments', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-drift-cli-'));
  const io = { stdout: { write() {} }, stderr: { write() {} } };
  try {
    expect(main(['--unknown'], io)).toBe(1);
    expect(main(['--home', ''], io)).toBe(1);
    expect(main(['--other', home], io)).toBe(1);
    expect(main(['--home', home], io)).toBe(1);
    for (const runtime of ['.claude', '.codex']) {
      fs.mkdirSync(path.join(home, runtime, 'gsd-core'), { recursive: true });
      fs.writeFileSync(path.join(home, runtime, 'gsd-core/VERSION'), getActivePackageVersion());
      fs.writeFileSync(path.join(home, runtime, '.install-meta.json'), JSON.stringify({
        upstreamPackage: '@opengsd/gsd-core', upstreamVersion: getActivePackageVersion(),
      }));
    }
    expect(main(['--home', home], io)).toBe(0);
    const cli = spawnSync(process.execPath, [path.join(__dirname, '../scripts/check-install-drift.js')], {
      encoding: 'utf8', env: { ...process.env, USERPROFILE: home, HOME: home, CLAUDE_CONFIG_DIR: '', CODEX_HOME: '' },
    });
    expect(cli.status).toBe(0);
    expect(JSON.parse(cli.stdout).ok).toBe(true);
    const configured = spawnSync(process.execPath, [path.join(__dirname, '../scripts/check-install-drift.js')], {
      encoding: 'utf8', env: { ...process.env, USERPROFILE: home, HOME: home,
        CLAUDE_CONFIG_DIR: path.join(home, 'configured-claude'), CODEX_HOME: path.join(home, 'configured-codex') },
    });
    expect(configured.status).toBe(1);
    expect(JSON.parse(configured.stdout).runtimes.every(row => row.status === 'missing')).toBe(true);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});
