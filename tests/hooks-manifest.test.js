'use strict';

/**
 * tests/hooks-manifest.test.js
 *
 * Invariant tests for hooks/index.js — the hook system manifest.
 *
 * These assertions prevent the manifest itself from drifting:
 *   - Every entry has required fields
 *   - Every source path resolves to an existing file
 *   - No two hooks share the same name (would collide in dist/)
 *   - Kind values are constrained to known set
 *   - HOOKS array is frozen (immutability invariant)
 *   - Entries are frozen
 *
 * If a future change breaks one of these, this test surfaces it
 * with a specific failure message.
 *
 * Pairs with:
 *   - tests/test-config-hygiene.test.js (test-discovery hygiene)
 *   - tests/test-path-validation.test.js (broader path scanning)
 */

const fs = require('fs');
const { describe, test, expect } = require('bun:test');

const hooksManifest = require('../hooks');

describe('hooks/index.js manifest (invariants)', () => {
  test('exports HOOKS array', () => {
    expect(Array.isArray(hooksManifest.HOOKS)).toBe(true);
    expect(hooksManifest.HOOKS.length).toBeGreaterThan(0);
  });

  test('HOOKS array is frozen (immutable)', () => {
    expect(Object.isFrozen(hooksManifest.HOOKS)).toBe(true);
  });

  test('every HOOKS entry is frozen (immutable)', () => {
    for (const hook of hooksManifest.HOOKS) {
      expect(Object.isFrozen(hook)).toBe(true);
    }
  });

  test('every entry has required fields (name, source, kind)', () => {
    for (const hook of hooksManifest.HOOKS) {
      expect(typeof hook.name).toBe('string');
      expect(hook.name.length).toBeGreaterThan(0);
      expect(typeof hook.source).toBe('string');
      expect(hook.source.length).toBeGreaterThan(0);
      expect(typeof hook.kind).toBe('string');
    }
  });

  test('every entry kind is "override" or "overlay"', () => {
    const validKinds = new Set(['override', 'overlay']);
    for (const hook of hooksManifest.HOOKS) {
      if (!validKinds.has(hook.kind)) {
        throw new Error(
          `Hook ${hook.name} has invalid kind: ${hook.kind}.\n` +
            `Allowed values: ${[...validKinds].join(', ')}`
        );
      }
    }
  });

  test('no two hooks share the same name', () => {
    const seen = new Map();
    for (const hook of hooksManifest.HOOKS) {
      if (seen.has(hook.name)) {
        throw new Error(
          `Duplicate hook name: ${hook.name}\n` +
            `Both hooks would bundle to the same dist path. Rename one.`
        );
      }
      seen.set(hook.name, true);
    }
  });

  test('every source path resolves to an existing file', () => {
    const failures = [];
    for (const hook of hooksManifest.HOOKS) {
      const resolved = hooksManifest.sourcePath(hook);
      if (!fs.existsSync(resolved)) {
        failures.push({ hook, resolved });
      }
    }
    if (failures.length > 0) {
      const formatted = failures
        .map(f => `  ${f.hook.name} (${f.hook.kind})\n    expected at: ${f.resolved}`)
        .join('\n');
      throw new Error(
        `Found ${failures.length} hook(s) whose manifest source path is missing.\n\n` +
          `Either the hook moved (update hooks/index.js) or was deleted\n` +
          `(remove the entry).\n\n${formatted}`
      );
    }
  });

  test('overrides/ hooks have a corresponding upstream file (kind invariant)', () => {
    // Hooks with kind: 'override' should have a counterpart in node_modules/
    // (the file they're overriding). If not, the kind label is wrong.
    const path = require('path');
    const failures = [];
    for (const hook of hooksManifest.filterByKind('override')) {
      // Compute what the upstream path would be: replace overrides/ with
      // node_modules/@opengsd/gsd-core/ -- same relative subpath after that.
      const subPath = hook.source.replace(/^overrides\//, '');
      const upstream = path.join(
        hooksManifest.PROJECT_ROOT,
        'node_modules',
        '@opengsd',
        'gsd-core',
        subPath,
        hook.name
      );
      if (!fs.existsSync(upstream)) {
        failures.push({ hook, upstream });
      }
    }
    // INFO-only: this catches a "labeled override but no upstream" case, which
    // could be either (a) upstream removed it (we should switch kind to overlay)
    // or (b) the upstream package isn't installed (skip in that case).
    // Skip if upstream isn't installed at all.
    const upstreamRoot = path.join(
      hooksManifest.PROJECT_ROOT,
      'node_modules',
      '@opengsd',
      'gsd-core'
    );
    if (!fs.existsSync(upstreamRoot)) {
      // Upstream not installed — can't verify. Skip gracefully.
      return;
    }
    if (failures.length > 0) {
      const formatted = failures
        .map(
          f =>
            `  ${f.hook.name} labeled 'override' but upstream missing at:\n    ${f.upstream}`
        )
        .join('\n');
      throw new Error(
        `Found ${failures.length} hook(s) labeled 'override' with no upstream counterpart.\n\n` +
          `Either upstream removed the file (change kind to 'overlay' since\n` +
          `this is now fork-only) or the upstream path is wrong.\n\n${formatted}`
      );
    }
  });

  test('sourcePath() throws on bad input (defensive contract)', () => {
    expect(() => hooksManifest.sourcePath(null)).toThrow();
    expect(() => hooksManifest.sourcePath({})).toThrow();
    expect(() => hooksManifest.sourcePath({ name: 'x' })).toThrow();
    expect(() => hooksManifest.sourcePath({ source: 'x' })).toThrow();
  });

  test('distPath() throws on bad input (defensive contract)', () => {
    expect(() => hooksManifest.distPath(null)).toThrow();
    expect(() => hooksManifest.distPath({})).toThrow();
  });

  test('findByName returns the entry when present', () => {
    const sample = hooksManifest.HOOKS[0];
    const found = hooksManifest.findByName(sample.name);
    expect(found).toBe(sample);
  });

  test('findByName returns undefined when absent', () => {
    const found = hooksManifest.findByName('this-hook-does-not-exist.js');
    expect(found).toBeUndefined();
  });

  test('filterByKind returns matching entries only', () => {
    for (const kind of ['override', 'overlay']) {
      const filtered = hooksManifest.filterByKind(kind);
      for (const hook of filtered) {
        expect(hook.kind).toBe(kind);
      }
    }
  });
});
