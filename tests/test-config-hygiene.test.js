'use strict';

/**
 * tests/test-config-hygiene.test.js
 *
 * Meta-test: assert invariants of test-config and test-discovery scope.
 *
 * STRUCTURAL PREVENTION for the upstream-discovery failure mode that
 * caused 538+87 CI failures on PR #3 (Phase 40.5 Waves 1.5a + 1.5c, 2026-04-30).
 *
 * Failure mode this test prevents:
 *   1. Upstream package ships .test.* and ESM-syntax files inside its npm tarball
 *      (e.g. legacy get-shit-done-cc@1.38.5 shipped 77 .test.ts files in sdk/src/...).
 *   2. `bun run compose` copies node_modules/<upstream>/ to dist/.
 *   3. Tooling configured for the fork's CommonJS context (bun-test, eslint with
 *      sourceType:'commonjs') discovers files in dist/ and either runs them as
 *      tests they aren't (fixtures/paths missing) or parses them as the wrong
 *      module type (ESM import/export rejected by CJS parser).
 *
 * Categorical fix: every tool that discovers files by glob excludes dist.
 *   - bunfig.toml [test].exclude includes "double-star/dist/double-star" and
 *     "double-star/node_modules/double-star"
 *   - eslint.config.js ignores includes "dist/double-star"
 * This meta-test asserts those invariants are preserved AND that no test files
 * exist in dist/ at test time.
 *
 * If this test fails: someone removed an exclusion or compose accidentally
 * preserved upstream content. The failure message points at the file to fix.
 */

const fs = require('fs');
const path = require('path');
const { describe, test, expect } = require('bun:test');

const PROJECT_ROOT = path.join(__dirname, '..');
const BUNFIG_PATH = path.join(PROJECT_ROOT, 'bunfig.toml');
const ESLINT_CONFIG_PATH = path.join(PROJECT_ROOT, 'eslint.config.js');

function readBunfig() {
  if (!fs.existsSync(BUNFIG_PATH)) {
    throw new Error(`bunfig.toml not found at ${BUNFIG_PATH}`);
  }
  return fs.readFileSync(BUNFIG_PATH, 'utf8');
}

function extractExcludeArray(bunfigContent) {
  // Naive TOML parsing — bunfig is small and stable. Extract `exclude = [...]`
  // line(s) and parse the array. If the format ever grows complex (multi-line
  // arrays, nested tables), replace this with a proper TOML parser.
  const match = bunfigContent.match(/^\s*exclude\s*=\s*\[([^\]]+)\]/m);
  if (!match) return [];
  return match[1]
    .split(',')
    .map(s => s.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

function findTestFiles(dir, found = []) {
  if (!fs.existsSync(dir)) return found;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Don't recurse into nested node_modules
      if (entry.name === 'node_modules') continue;
      findTestFiles(fullPath, found);
    } else if (/\.(test|spec)\.(js|ts|cjs|mjs)$/.test(entry.name)) {
      found.push(fullPath);
    }
  }
  return found;
}

describe('test-config hygiene (meta-test)', () => {
  test('bunfig.toml exists', () => {
    expect(fs.existsSync(BUNFIG_PATH)).toBe(true);
  });

  test('bunfig.toml has [test] section', () => {
    const content = readBunfig();
    expect(content).toMatch(/^\s*\[test\]/m);
  });

  test('bunfig.toml [test].exclude contains "**/node_modules/**"', () => {
    const exclude = extractExcludeArray(readBunfig());
    const hasNodeModules = exclude.some(p =>
      p.includes('node_modules')
    );
    expect(hasNodeModules).toBe(true);
  });

  test('bunfig.toml [test].exclude contains "**/dist/**"', () => {
    const exclude = extractExcludeArray(readBunfig());
    const hasDist = exclude.some(p => p.includes('dist'));
    expect(hasDist).toBe(true);
  });

  test('bunfig.toml [test].exclude contains "**/*.test.cjs"', () => {
    // .cjs tests run via separate runner (test:upstream script in package.json)
    // and must not be picked up by bun-test which doesn't handle CJS-only deps.
    const exclude = extractExcludeArray(readBunfig());
    const hasCjs = exclude.some(p => p.endsWith('.test.cjs'));
    expect(hasCjs).toBe(true);
  });

  test('zero test files exist in dist/ at test time', () => {
    const distDir = path.join(PROJECT_ROOT, 'dist');
    const testFiles = findTestFiles(distDir);
    if (testFiles.length > 0) {
      const sample = testFiles.slice(0, 5).map(p => path.relative(PROJECT_ROOT, p)).join('\n  ');
      throw new Error(
        `Found ${testFiles.length} test file(s) in dist/.\n\n` +
          `This means \`bun run compose\` copied upstream test files into dist/.\n` +
          `Even with bunfig.toml dist/** exclusion in place, having test files\n` +
          `in dist/ is a code smell — upstream packaging changed and the compose\n` +
          `pipeline should filter them out. Sample (first 5):\n  ${sample}\n\n` +
          `Fix in scripts/compose.js or upgrade pipeline filter logic.`
      );
    }
    expect(testFiles.length).toBe(0);
  });

  test('test discovery glob is bounded (not naked **/*.test.*)', () => {
    const content = readBunfig();
    const includeMatch = content.match(/^\s*include\s*=\s*\[([^\]]+)\]/m);
    expect(includeMatch).toBeTruthy();

    const includes = includeMatch[1]
      .split(',')
      .map(s => s.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);

    // Allowed: specific extensions like **/*.test.js
    // Disallowed: wildcard **/*.test.* (would discover .ts in dist/ even with exclusions
    //             if exclusion patterns ever drift)
    for (const pattern of includes) {
      expect(pattern).not.toMatch(/\*\.test\.\*\s*$/);
    }
  });

  test('eslint.config.js ignores dist/**', () => {
    // Same dist/-discovery failure mode as bun-test, but for eslint's parser.
    // Without this exclusion, eslint with sourceType:'commonjs' chokes on the
    // ESM import/export syntax in upstream's bundled files (87 parse errors
    // on PR #3 v1.38.5 bump CI run, 2026-04-30).
    expect(fs.existsSync(ESLINT_CONFIG_PATH)).toBe(true);
    const config = require(ESLINT_CONFIG_PATH);
    expect(Array.isArray(config)).toBe(true);
    const ignoresEntry = config.find(c => Array.isArray(c.ignores));
    expect(ignoresEntry).toBeTruthy();
    expect(ignoresEntry.ignores).toContain('dist/**');
  });
});
