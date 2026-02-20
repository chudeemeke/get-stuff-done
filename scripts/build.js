#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- build script with computed paths from internal logic, no user input */

/**
 * Unified build script for GSD hooks and gsd-tools.js.
 *
 * Uses esbuild to inline all src/ dependencies into self-contained bundles.
 * Both hooks (installed to ~/.claude/hooks/) and gsd-tools.js (installed to
 * ~/.claude/get-stuff-done/bin/) have no access to src/ at runtime, so all
 * dependencies must be bundled at build time.
 *
 * Targets:
 *   - hooks/*.js -> hooks/dist/ (3 hooks)
 *   - get-stuff-done/bin/gsd-tools.js -> get-stuff-done/bin/dist/ (1 tool)
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const HOOKS_DIR = path.join(__dirname, '..', 'hooks');
const DIST_DIR = path.join(HOOKS_DIR, 'dist');

const GSD_BIN_DIR = path.join(__dirname, '..', 'get-stuff-done', 'bin');
const GSD_DIST_DIR = path.join(GSD_BIN_DIR, 'dist');

// Hooks to bundle (all hooks, including those without src/ imports, for consistency)
const HOOKS_TO_BUNDLE = [
  'gsd-check-update.js',
  'gsd-statusline.js',
  'pre-compact.js'
];

// Shared esbuild config: inline all deps for copy-mode install compatibility
const ESBUILD_BASE = {
  bundle: true,           // Inline all require()d modules
  platform: 'node',       // Target Node.js (CJS output, correct path resolution)
  target: 'node20',       // Match engines.node in package.json
  // NO 'external' -- everything must be inlined for copy-mode install
  // NO 'format: esm' -- platform:'node' defaults to CJS which is correct
  // NO 'minify' -- keep readable for debugging installed files
  // esbuild auto-preserves #!/usr/bin/env node shebang
};

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${bytes}B`;
}

function buildHooks() {
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

    process.stdout.write(`Bundling hooks/${hookFile}... `);

    esbuild.buildSync({
      ...ESBUILD_BASE,
      entryPoints: [src],
      outfile: dest,
    });

    const size = fs.statSync(dest).size;
    console.log(`done (${formatSize(size)})`);
  }
}

function buildGsdTools() {
  // Ensure dist directory exists
  if (!fs.existsSync(GSD_DIST_DIR)) {
    fs.mkdirSync(GSD_DIST_DIR, { recursive: true });
  }

  const src = path.join(GSD_BIN_DIR, 'gsd-tools.js');
  const dest = path.join(GSD_DIST_DIR, 'gsd-tools.js');

  if (!fs.existsSync(src)) {
    console.warn('Warning: get-stuff-done/bin/gsd-tools.js not found, skipping');
    return;
  }

  process.stdout.write('Bundling get-stuff-done/bin/gsd-tools.js... ');

  esbuild.buildSync({
    ...ESBUILD_BASE,
    entryPoints: [src],
    outfile: dest,
  });

  const size = fs.statSync(dest).size;
  console.log(`done (${formatSize(size)})`);
}

function build() {
  buildHooks();
  buildGsdTools();
  console.log('\nBuild complete.');
}

build();
