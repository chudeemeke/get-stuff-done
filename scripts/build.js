#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- build script with computed paths from internal logic, no user input */

/**
 * Unified build script for GSD hooks and gsd-tools.cjs.
 *
 * Uses esbuild to inline all src/ dependencies into self-contained bundles.
 * Both hooks (installed to ~/.claude/hooks/) and gsd-tools.cjs (installed to
 * ~/.claude/get-stuff-done/bin/) have no access to src/ at runtime, so all
 * dependencies must be bundled at build time.
 *
 * Targets:
 *   - overrides/hooks/gsd-check-update.js -> hooks/dist/ (override of upstream hook)
 *   - overrides/hooks/gsd-statusline.js   -> hooks/dist/ (override of upstream hook)
 *   - overlay/hooks/pre-compact.js        -> hooks/dist/ (fork-only hook)
 *   - get-stuff-done/bin/gsd-tools.cjs    -> get-stuff-done/bin/dist/ (1 tool)
 *
 * Hook source-tree convention (Phase 30 / v3.0.0 architecture):
 *   - overrides/ — files that REPLACE an upstream file at the same path
 *   - overlay/   — files that ADD a new path not present upstream
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const PROJECT_ROOT = path.join(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'hooks', 'dist');

const GSD_BIN_DIR = path.join(PROJECT_ROOT, 'get-stuff-done', 'bin');
const GSD_DIST_DIR = path.join(GSD_BIN_DIR, 'dist');

// Hooks to bundle: source path varies per hook (overrides/ for upstream
// replacements, overlay/ for fork-only additions). Keep the source location
// alongside the file name so adding/moving a hook is a single-file edit.
const HOOKS_TO_BUNDLE = [
  { name: 'gsd-check-update.js', sourceDir: 'overrides/hooks' },
  { name: 'gsd-statusline.js',   sourceDir: 'overrides/hooks' },
  { name: 'pre-compact.js',      sourceDir: 'overlay/hooks' }
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
  for (const hook of HOOKS_TO_BUNDLE) {
    const sourceRel = `${hook.sourceDir}/${hook.name}`;
    const src = path.join(PROJECT_ROOT, hook.sourceDir, hook.name);
    const dest = path.join(DIST_DIR, hook.name);

    if (!fs.existsSync(src)) {
      // FAIL LOUD instead of silently skipping. A missing hook source means
      // the architecture moved underneath this file (or someone deleted a
      // hook). Silently skipping was the v3.0.0-era bug that left
      // hooks/dist/ stale for ~50 days. See 40.5-CI-DIAGNOSIS.md.
      throw new Error(
        `Hook source not found: ${sourceRel}\n` +
        `  Expected at: ${src}\n` +
        `  Either the file moved or HOOKS_TO_BUNDLE in scripts/build.js is stale.\n` +
        `  Convention: overrides/ for upstream replacements; overlay/ for fork-only.`
      );
    }

    process.stdout.write(`Bundling ${sourceRel}... `);

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

  const src = path.join(GSD_BIN_DIR, 'gsd-tools.cjs');
  const dest = path.join(GSD_DIST_DIR, 'gsd-tools.cjs');

  if (!fs.existsSync(src)) {
    console.warn('Warning: get-stuff-done/bin/gsd-tools.cjs not found, skipping');
    return;
  }

  process.stdout.write('Bundling get-stuff-done/bin/gsd-tools.cjs... ');

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
