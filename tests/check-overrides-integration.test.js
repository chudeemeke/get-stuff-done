'use strict';

const { describe, test, expect, afterEach } = require('bun:test');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { runWithTimeout } = require('./helpers');

const PROJECT_ROOT = path.join(__dirname, '..');
const CHECK_OVERRIDES_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'check-overrides.js');

function computeHash(content) {
  return crypto.createHash('sha256').update(Buffer.from(content, 'utf-8')).digest('hex');
}

function createReasonMd(relPath, version, hash) {
  return [
    `# Override: ${relPath}`,
    '',
    '## Why',
    'Integration test override reason',
    '',
    '## Upstream snapshot',
    `- Version: ${version}`,
    `- SHA-256: ${hash}`,
    '',
    "## What's different",
    '- Integration test fork change',
    '',
    '## Review trigger',
    `When upstream ${relPath} changes.`,
  ].join('\n');
}

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-check-overrides-integration-'));
}

function rmDir(dir) {
  if (dir && fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('check-overrides subprocess integration', () => {
  let tmpDir;

  afterEach(() => rmDir(tmpDir));

  test('stale override exits non-zero with actionable output', () => {
    tmpDir = makeTempDir();
    const upstreamDir = path.join(tmpDir, 'upstream');
    const overridesDir = path.join(tmpDir, 'overrides');
    const relPath = 'lib/config.cjs';
    const upstreamFile = path.join(upstreamDir, relPath);
    const overrideFile = path.join(overridesDir, relPath);

    fs.mkdirSync(path.dirname(upstreamFile), { recursive: true });
    fs.mkdirSync(path.dirname(overrideFile), { recursive: true });
    fs.writeFileSync(
      path.join(upstreamDir, 'package.json'),
      JSON.stringify({ name: '@opengsd/gsd-core', version: '1.5.0' }),
      'utf-8'
    );
    fs.writeFileSync(upstreamFile, 'updated upstream content', 'utf-8');
    fs.writeFileSync(overrideFile, 'fork override content', 'utf-8');
    fs.writeFileSync(
      `${overrideFile}.REASON.md`,
      createReasonMd(relPath, '1.4.0', computeHash('old upstream content')),
      'utf-8'
    );

    const result = runWithTimeout(
      process.execPath,
      [
        CHECK_OVERRIDES_SCRIPT,
        '--overrides-dir', overridesDir,
        '--upstream-dir', upstreamDir,
      ],
      { encoding: 'utf-8', cwd: PROJECT_ROOT }
    );
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('overrides/lib/config.cjs');
    expect(output).toContain('STALE');
    expect(output).toContain('Current hash:');
    expect(output).toContain('Action:');
  });
});
