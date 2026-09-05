#!/usr/bin/env node
'use strict';
/* eslint-disable security/detect-non-literal-fs-filename -- read-only inspection under explicitly selected runtime homes */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { getActivePackageVersion } = require('./lib/upstream-source');
const { detectV2 } = require('../bin/install');

function inspectInstallations({ home = os.homedir(), expectedVersion = getActivePackageVersion(), runtimeRoots = {} } = {}) {
  const runtimes = ['claude', 'codex'].map(runtime => {
    const target = runtimeRoots[runtime] || path.join(home, `.${runtime}`);
    const versionPath = path.join(target, 'gsd-core', 'VERSION');
    const legacyPath = path.join(target, 'get-shit-done', 'VERSION');
    const row = { runtime, target, expectedVersion, legacyPresent: fs.existsSync(legacyPath) || detectV2(target).isV2 };
    if (!fs.existsSync(versionPath)) return { ...row, status: row.legacyPresent ? 'legacy-source' : 'missing' };
    try {
      const installedVersion = fs.readFileSync(versionPath, 'utf8').trim();
      const metaPath = path.join(target, '.install-meta.json');
      if (!fs.existsSync(metaPath)) return { ...row, installedVersion, status: 'unverified-provenance' };
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      const matching = meta.upstreamPackage === '@opengsd/gsd-core' &&
        meta.upstreamVersion === expectedVersion && installedVersion === expectedVersion;
      return { ...row, installedVersion, status: matching ? 'matching-version' : 'drift' };
    } catch {
      return { ...row, status: 'unreadable-provenance' };
    }
  });
  return { schemaVersion: 1, expectedVersion, ok: runtimes.every(row => row.status === 'matching-version'), runtimes,
    nonClaim: 'Version agreement does not prove artifact integrity, route resolution or effective runtime configuration.' };
}

function main(args = process.argv.slice(2), io = process) {
  try {
    if (args.length && (args.length !== 2 || args[0] !== '--home' || !args[1])) {
      throw new Error('Usage: node scripts/check-install-drift.js [--home <isolated-or-user-home>]');
    }
    const report = inspectInstallations(args.length ? { home: path.resolve(args[1]) } : {
      runtimeRoots: { claude: process.env.CLAUDE_CONFIG_DIR, codex: process.env.CODEX_HOME },
    });
    io.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return report.ok ? 0 : 1;
  } catch (error) {
    io.stderr.write(`${error.message}\n`);
    return 1;
  }
}

if (require.main === module) process.exitCode = main();
module.exports = { inspectInstallations, main };
