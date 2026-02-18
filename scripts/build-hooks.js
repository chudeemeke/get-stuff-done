#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- build script with computed paths from internal logic, no user input */

/**
 * Bundle GSD hooks to dist for installation.
 *
 * Uses esbuild to inline all src/ dependencies into self-contained bundles.
 * Hooks installed to ~/.claude/hooks/ have no access to src/ at runtime,
 * so all dependencies must be bundled at build time.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const HOOKS_DIR = path.join(__dirname, '..', 'hooks');
const DIST_DIR = path.join(HOOKS_DIR, 'dist');

// Hooks to bundle (all hooks, including those without src/ imports, for consistency)
const HOOKS_TO_BUNDLE = [
  'gsd-check-update.js',
  'gsd-statusline.js',
  'pre-compact.js'
];

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${bytes}B`;
}

function build() {
  // Ensure dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Bundle hooks via esbuild (inlines all src/ dependencies)
  for (const hookFile of HOOKS_TO_BUNDLE) {
    const src = path.join(HOOKS_DIR, hookFile);
    const dest = path.join(DIST_DIR, hookFile);

    if (!fs.existsSync(src)) {
      console.warn(`Warning: ${hookFile} not found, skipping`);
      continue;
    }

    process.stdout.write(`Bundling ${hookFile}... `);

    esbuild.buildSync({
      entryPoints: [src],
      bundle: true,           // Inline all require()d modules
      platform: 'node',       // Target Node.js (CJS output, correct path resolution)
      target: 'node20',       // Match engines.node in package.json
      outfile: dest,
      // NO 'external' -- everything must be inlined for copy-mode install
      // NO 'format: esm' -- platform:'node' defaults to CJS which is correct
      // NO 'minify' -- keep readable for debugging installed hooks
      // esbuild auto-preserves #!/usr/bin/env node shebang
    });

    const size = fs.statSync(dest).size;
    console.log(`done (${formatSize(size)})`);
  }

  console.log('\nBuild complete.');
}

build();
