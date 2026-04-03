#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- build script with computed paths from internal logic, no user input */

/**
 * Finalize dist/ for deployment.
 *
 * Problem: compose.js copies raw overlay source into dist/hooks/. These files
 * have require() calls to src/theme, src/config, src/platform that resolve in
 * the repo but NOT at the install target (~/.claude/). The build script bundles
 * these into self-contained files at hooks/dist/.
 *
 * This script bridges the gap: after compose + build, it replaces raw overlay
 * hooks in dist/hooks/ with their bundled equivalents from hooks/dist/.
 *
 * Single Responsibility: compose assembles, build bundles, finalize-dist
 * prepares dist/ for deployment. Each script has one job.
 *
 * Run order: compose -> build -> finalize-dist
 * npm script: "dist": "bun run compose && bun run build && node scripts/finalize-dist.js"
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const BUNDLED_DIR = path.join(PROJECT_ROOT, 'hooks', 'dist');
const DIST_HOOKS_DIR = path.join(PROJECT_ROOT, 'dist', 'hooks');

/**
 * Hooks that have src/ dependencies and need bundled versions for deployment.
 * These are the overlay hooks that import from ../../src/ — they break at
 * install time because src/ is not deployed to ~/.claude/.
 *
 * Hooks without src/ dependencies (e.g., pre-compact.js) work fine as raw source.
 */
const HOOKS_NEEDING_BUNDLE = [
  'gsd-statusline.js',
  'gsd-check-update.js',
  'pre-compact.js',
];

/**
 * Replace raw overlay hooks in dist/ with their bundled equivalents.
 * @returns {{ replaced: string[], skipped: string[], missing: string[] }}
 */
function finalizeDist() {
  const replaced = [];
  const skipped = [];
  const missing = [];

  if (!fs.existsSync(DIST_HOOKS_DIR)) {
    throw new Error(`dist/hooks/ not found — run 'bun run compose' first`);
  }

  if (!fs.existsSync(BUNDLED_DIR)) {
    throw new Error(`hooks/dist/ not found — run 'bun run build' first`);
  }

  for (const hookFile of HOOKS_NEEDING_BUNDLE) {
    const bundledPath = path.join(BUNDLED_DIR, hookFile);
    const distPath = path.join(DIST_HOOKS_DIR, hookFile);

    if (!fs.existsSync(bundledPath)) {
      missing.push(hookFile);
      continue;
    }

    if (!fs.existsSync(distPath)) {
      // Hook doesn't exist in dist/ — not an overlay hook, skip
      skipped.push(hookFile);
      continue;
    }

    // Replace raw source with bundled version
    fs.copyFileSync(bundledPath, distPath);
    replaced.push(hookFile);
  }

  return { replaced, skipped, missing };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
if (require.main === module) {
  try {
    const result = finalizeDist();

    if (result.replaced.length > 0) {
      console.log(`Finalized ${result.replaced.length} hook(s) in dist/:`);
      for (const f of result.replaced) {
        const size = fs.statSync(path.join(DIST_HOOKS_DIR, f)).size;
        const kb = (size / 1024).toFixed(0);
        console.log(`  ${f} (${kb}KB bundled)`);
      }
    }

    if (result.missing.length > 0) {
      console.warn(`Warning: ${result.missing.length} bundled hook(s) not found:`);
      for (const f of result.missing) {
        console.warn(`  ${f} — run 'bun run build' to generate`);
      }
    }

    if (result.replaced.length === 0 && result.missing.length === 0) {
      console.log('No overlay hooks to finalize.');
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { finalizeDist, HOOKS_NEEDING_BUNDLE };
