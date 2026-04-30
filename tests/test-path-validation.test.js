'use strict';

/**
 * tests/test-path-validation.test.js
 *
 * Meta-test: assert that hardcoded path constants in test files resolve
 * to existing files on disk.
 *
 * STRUCTURAL PREVENTION for the stale-test-paths failure mode that
 * caused 42 of 586 CI failures on PR #3 (Phase 40.5 Wave 1, 2026-04-30)
 * AND latent bugs in scripts/build.js and scripts/check-parity.js.
 *
 * Failure mode this test prevents:
 *   1. Architectural transition (e.g., Phase 30 / v3.0.0 overrides/-vs-overlay/
 *      split) moves source files between fork-owned directories.
 *   2. Test files (and downstream scripts) retain hardcoded references to
 *      the old paths.
 *   3. Tests fail with `Cannot find module` or `expect(received).toBe(true)`
 *      where `received` is `false` because `fs.existsSync` returns false.
 *
 * Categorical fix: scan test files for hardcoded path constants targeting
 * known fork-owned directories (overlay/, overrides/, hooks/, commands/,
 * agents/, scripts/, get-stuff-done/, src/) and assert each resolves to an
 * existing file at test time.
 *
 * If this test fails: someone moved a file without updating its references.
 * Failure message identifies exactly which file:line has the broken path.
 *
 * Scope:
 *   - Scans tests/-star-star/-star.test.js and tests/-star-star/-star.test.cjs
 *   - Looks for path.join(PROJECT_ROOT, ...) and similar patterns
 *   - Whitelist: only checks paths under known fork-owned roots (avoids
 *     false positives on temp dirs, runtime-computed paths, env paths)
 */

const fs = require('fs');
const path = require('path');
const { describe, test, expect } = require('bun:test');

const PROJECT_ROOT = path.join(__dirname, '..');
const TESTS_DIR = __dirname;

// Known fork-owned directory roots. Paths under these roots SHOULD exist.
// Paths under other roots (temp dirs, /usr/, ~/, etc.) are not asserted.
const FORK_OWNED_ROOTS = [
  'overlay',
  'overrides',
  'hooks',
  'commands',
  'agents',
  'scripts',
  'get-stuff-done',
  'src',
  'bin',
];

// Known base identifiers that point at PROJECT_ROOT (the only bases for which
// `path.join(BASE, '<root>', ...)` should resolve to a real fork-owned file).
// Excluded: `dir`, `tempDir`, `srcDir`, etc. — these are test fixtures under
// temp directories, NOT real fork-owned paths. False positives if checked.
const PROJECT_ROOT_BASES = new Set([
  'PROJECT_ROOT',
  'ROOT',
  'projectRoot',
  '__dirname', // when used with `..` to climb out of tests/
]);

/**
 * Recursively walk a directory and return all file paths matching a regex.
 */
function findFiles(dir, pattern, found = []) {
  if (!fs.existsSync(dir)) return found;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      findFiles(fullPath, pattern, found);
    } else if (pattern.test(entry.name)) {
      found.push(fullPath);
    }
  }
  return found;
}

/**
 * Extract path constants from a JS source file. Looks for:
 *   path.join(PROJECT_ROOT, '<root>', '<sub>', ...)
 *   path.join(__dirname, '..', '<root>', ...)
 *
 * Returns array of { line, segments } where segments is the array of
 * string literals after the base var.
 */
// Per-line escape marker. Any source line containing this literal substring is
// excluded from path-constant extraction. Use for paths created at runtime by the
// test itself (e.g., symlinks built at module load, fixtures provisioned per-test)
// where non-existence at meta-test scan time is expected.
//
//   const SHIM = path.join(ROOT, 'a', 'b'); // meta-test:skip — runtime-created symlink
//
// Recommend including the reason after the marker so future readers know WHY the
// line is exempt.
const SKIP_MARKER = 'meta-test:skip';

function extractPathConstants(source) {
  const results = [];
  const lines = source.split('\n');

  // Match path.join(BASE, 'a', 'b', 'c')
  // BASE: PROJECT_ROOT, __dirname, or similar identifier
  // Args: comma-separated single-quoted or double-quoted strings
  const pattern = /path\.join\(\s*([A-Z_a-z][A-Za-z0-9_]*)\s*,\s*((?:['"][^'"]+['"]\s*,?\s*)+)\)/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes(SKIP_MARKER)) continue;
    let match;
    while ((match = pattern.exec(line)) !== null) {
      const base = match[1];
      const argsStr = match[2];
      const segments = [];
      const argPattern = /['"]([^'"]+)['"]/g;
      let argMatch;
      while ((argMatch = argPattern.exec(argsStr)) !== null) {
        segments.push(argMatch[1]);
      }
      results.push({ line: i + 1, base, segments });
    }
  }

  return results;
}

/**
 * Resolve a path constant relative to PROJECT_ROOT, skipping `..` jumps that
 * lead outside fork-owned directories.
 *
 * Returns the absolute path if and only if:
 *   1. The base identifier is a known PROJECT_ROOT-equivalent (filters out
 *      test-fixture base vars like `dir`, `tempDir`, `srcDir`)
 *   2. After stripping leading `..`, the first segment is a fork-owned root
 *
 * Returns null otherwise (skip — out of scope for this validation).
 */
function resolveIfForkOwned(base, segments) {
  if (!PROJECT_ROOT_BASES.has(base)) return null;

  // Filter out `..` segments at the start (they're __dirname-relative jumps to PROJECT_ROOT)
  let realSegments = segments.slice();
  while (realSegments.length > 0 && realSegments[0] === '..') {
    realSegments = realSegments.slice(1);
  }

  if (realSegments.length === 0) return null;
  const root = realSegments[0];

  if (!FORK_OWNED_ROOTS.includes(root)) return null;

  // Build absolute path under PROJECT_ROOT
  return path.join(PROJECT_ROOT, ...realSegments);
}

describe('test-path-validation (meta-test)', () => {
  // Discover test files at module-load time so we have stable test IDs
  const testFiles = findFiles(TESTS_DIR, /\.(test|spec)\.(js|cjs)$/);

  test('found at least 1 test file to scan', () => {
    expect(testFiles.length).toBeGreaterThan(0);
  });

  test('meta-test:skip marker excludes the line from extraction', () => {
    const source = [
      `const A = path.join(PROJECT_ROOT, 'overlay', 'definitely-not-here'); // meta-test:skip — runtime-created`,
      `const B = path.join(PROJECT_ROOT, 'overlay', 'get-shit-done');`,
    ].join('\n');
    const constants = extractPathConstants(source);
    const lines = constants.map(c => c.line);
    expect(lines).not.toContain(1);
    expect(lines).toContain(2);
  });

  test('every fork-owned path constant in test files resolves to an existing file or directory', () => {
    const failures = [];
    for (const file of testFiles) {
      // Skip ourselves to avoid recursive whining
      if (path.basename(file) === 'test-path-validation.test.js') continue;

      const source = fs.readFileSync(file, 'utf8');
      const constants = extractPathConstants(source);

      for (const c of constants) {
        const resolved = resolveIfForkOwned(c.base, c.segments);
        if (resolved === null) continue; // out of scope (not fork-owned)
        if (!fs.existsSync(resolved)) {
          failures.push({
            file: path.relative(PROJECT_ROOT, file),
            line: c.line,
            segments: c.segments.join(' / '),
            resolved: path.relative(PROJECT_ROOT, resolved),
          });
        }
      }
    }

    if (failures.length > 0) {
      const formatted = failures
        .slice(0, 10)
        .map(
          f =>
            `  ${f.file}:${f.line}\n    path: ${f.segments}\n    resolves to: ${f.resolved} (NOT FOUND)`
        )
        .join('\n');
      throw new Error(
        `Found ${failures.length} stale path constant(s) in test files.\n\n` +
          `Each path resolves under a fork-owned root but the target doesn't exist.\n` +
          `Likely cause: a source file moved (e.g. across the overrides/ vs overlay/\n` +
          `architectural boundary) without updating its test references.\n\n` +
          `First ${Math.min(10, failures.length)} failure(s):\n${formatted}\n\n` +
          `Fix: update the path constant to point at the file's current location,\n` +
          `or remove the test if the source is genuinely gone.`
      );
    }

    expect(failures.length).toBe(0);
  });
});
