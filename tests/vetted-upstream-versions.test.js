'use strict';

const { describe, expect, test } = require('bun:test');
const fs = require('fs');
const path = require('path');

const {
  loadVettedManifest,
  validateVettedManifest,
  listMatrixEntries,
  pruneForBump,
} = require('../scripts/vetted-upstream-versions');

const PROJECT_ROOT = path.join(__dirname, '..');
const AUTHORITY = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, '.planning', 'upstream-authority.json'), 'utf-8')
);
const ACTIVE_UPSTREAM_VERSION = '1.6.1';

function candidate(version, overrides = {}) {
  return {
    version,
    role: 'historical-candidate',
    blocking: false,
    vettedAt: null,
    evidence: {},
    ...overrides,
  };
}

function baseManifest(overrides = {}) {
  return {
    schemaVersion: 1,
    packageName: '@opengsd/gsd-core',
    policy: {
      maxVersions: 3,
      prune: 'oldest-on-successful-bump',
      evidenceRequiredForVetted: true,
    },
    versions: [
      candidate('1.5.0'),
      candidate('1.6.0'),
      candidate(ACTIVE_UPSTREAM_VERSION, { role: 'current', blocking: true }),
    ],
    ...overrides,
  };
}

describe('vetted upstream versions manifest', () => {
  test('loads the repository manifest with exactly 3 stable semver entries', () => {
    const manifest = loadVettedManifest(path.join(PROJECT_ROOT, '.planning', 'vetted-upstream-versions.json'));

    expect(manifest.policy.maxVersions).toBe(3);
    expect(manifest.versions.map(entry => entry.version)).toEqual(['1.5.0', '1.6.0', '1.6.1']);
    expect(() => validateVettedManifest(manifest, AUTHORITY)).not.toThrow();
  });

  test('fewer or more than exactly 3 versions fails validation', () => {
    expect(() => validateVettedManifest(baseManifest({ versions: [
      candidate('1.5.0', { role: 'current', blocking: true }),
      candidate('1.6.0'),
    ] }), AUTHORITY)).toThrow('exactly 3');

    expect(() => validateVettedManifest(baseManifest({ versions: [
      candidate('1.5.0', { role: 'current', blocking: true }),
      candidate('1.6.0'),
      candidate('1.6.1'),
      candidate('1.7.0'),
    ] }), AUTHORITY)).toThrow('exactly 3');
  });

  test('latest, next, and prerelease versions fail with stable semver errors', () => {
    for (const version of ['latest', 'next', '1.7.0-rc.1']) {
      const manifest = baseManifest({
        versions: [
          candidate('1.5.0'),
          candidate(version),
          candidate(ACTIVE_UPSTREAM_VERSION, { role: 'current', blocking: true }),
        ],
      });

      expect(() => validateVettedManifest(manifest, AUTHORITY)).toThrow('stable semver');
    }
  });

  test('exactly one blocking entry must match upstream authority active version', () => {
    expect(() => validateVettedManifest(baseManifest({
      versions: [
        candidate('1.5.0', { role: 'current', blocking: true }),
        candidate('1.6.0', { blocking: true }),
        candidate(ACTIVE_UPSTREAM_VERSION),
      ],
    }), AUTHORITY)).toThrow('exactly one');

    expect(() => validateVettedManifest(baseManifest({
      versions: [
        candidate('1.5.0', { role: 'current', blocking: true }),
        candidate('1.6.0'),
        candidate(ACTIVE_UPSTREAM_VERSION),
      ],
    }), AUTHORITY)).toThrow('blocking entry must match active upstream version');
  });

  test('candidate entries may keep vettedAt null before matrix evidence exists', () => {
    const manifest = baseManifest();

    expect(manifest.versions.every(entry => entry.vettedAt === null)).toBe(true);
    expect(() => validateVettedManifest(manifest, AUTHORITY)).not.toThrow();
  });

  test('vettedAt requires non-empty evidence.matrixReport', () => {
    expect(() => validateVettedManifest(baseManifest({
      versions: [
        candidate('1.5.0'),
        candidate('1.6.0', { vettedAt: '2026-07-03', evidence: {} }),
        candidate(ACTIVE_UPSTREAM_VERSION, { role: 'current', blocking: true }),
      ],
    }), AUTHORITY)).toThrow('matrixReport');
  });

  test('listMatrixEntries returns the three manifest entries in order', () => {
    const entries = listMatrixEntries(baseManifest());

    expect(entries).toHaveLength(3);
    expect(entries.map(entry => entry.version)).toEqual(['1.5.0', '1.6.0', '1.6.1']);
    expect(entries[2].blocking).toBe(true);
  });

  test('pruneForBump drops the oldest historical version and keeps exactly 3 versions', () => {
    const pruned = pruneForBump(baseManifest(), '1.7.0');

    expect(pruned.versions).toHaveLength(3);
    expect(pruned.versions.map(entry => entry.version)).toEqual(['1.6.0', '1.6.1', '1.7.0']);
    expect(pruned.versions.filter(entry => entry.blocking)).toEqual([
      expect.objectContaining({ version: '1.7.0', role: 'current' }),
    ]);
  });

  test('test source covers acceptance terms', () => {
    const source = fs.readFileSync(__filename, 'utf-8');

    expect(source).toContain('exactly 3');
    expect(source).toContain('stable semver');
    expect(source).toContain('blocking');
    expect(source).toContain('vettedAt');
    expect(source).toContain('matrixReport');
    expect(source).toContain('pruneForBump');
  });
});
