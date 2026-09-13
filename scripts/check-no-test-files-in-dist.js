#!/usr/bin/env node

'use strict';

/**
 * scripts/check-no-test-files-in-dist.js
 *
 * CI guard: assert that dist/ contains no test or spec files after compose.
 *
 * STRUCTURAL PREVENTION (Phase 40.5 Wave 1.6 Task 1.6-03) for the
 * upstream-discovery failure mode that produced 538+ CI failures on PR #3
 * (Wave 1.5a, 2026-04-30). This is the defense-in-depth peer of the
 * test-config-hygiene meta-test:
 *
 *   - Meta-test runs INSIDE the test runner — covers the case where test
 *     discovery accidentally includes dist/ at test time.
 *   - This script runs BETWEEN compose and test in CI — catches drift
 *     even when the test runner is misconfigured, skipped, or short-circuits.
 *
 * Failure mode caught: upstream npm tarball ships .test.* files; compose
 * copies node_modules/<upstream>/ to dist/; test runner discovers them.
 * Bun discovery is rooted at tests/; this remains defense in depth against
 * accidentally shipping upstream test files in the composed package.
 * This guard catches the case where exclusion drifts or compose changes
 * shape.
 *
 * Usage: `bun run compose && node scripts/check-no-test-files-in-dist.js`
 *
 * Exit codes:
 *   0 — clean (no test files in dist/)
 *   1 — test files found OR fatal I/O error
 */

const fs = require('fs');
const path = require('path');
const hooksManifest = require('../hooks');

const PROJECT_ROOT = hooksManifest.PROJECT_ROOT;
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const NC = '\x1b[0m';

const TEST_FILE_PATTERN = /\.(test|spec)\.(js|ts|cjs|mjs)$/;

function findTestFiles(dir, found) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return found;
    throw err;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      findTestFiles(fullPath, found);
    } else if (entry.isFile() && TEST_FILE_PATTERN.test(entry.name)) {
      found.push(fullPath);
    }
  }
  return found;
}

function main() {
  if (!fs.existsSync(DIST_DIR)) {
    console.log(`${GREEN}OK:${NC} dist/ does not exist (no compose run yet) — skipping check`);
    process.exit(0);
  }

  const found = findTestFiles(DIST_DIR, []);

  if (found.length === 0) {
    console.log(`${GREEN}OK:${NC} dist/ contains no test files`);
    process.exit(0);
  }

  const sample = found.slice(0, 10).map(p => path.relative(PROJECT_ROOT, p));
  const more = found.length > 10 ? `  ... and ${found.length - 10} more` : '';

  console.error(`${RED}FAIL:${NC} found ${found.length} test/spec file(s) in dist/`);
  console.error('');
  for (const p of sample) console.error(`  ${p}`);
  if (more) console.error(more);
  console.error('');
  console.error('This means upstream test files leaked into the bundle.');
  console.error('Fix: review scripts/compose.js test-file filter (compose.js:438-441)');
  console.error('     and the bunfig.toml [test] discovery boundary.');
  console.error('See: tests/test-config-hygiene.test.js for the in-runner peer check.');
  process.exit(1);
}

main();
