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
 *   - All hooks declared in hooks/index.js (the SSOT manifest) -> hooks/dist/
 *   - get-stuff-done/bin/gsd-tools.cjs -> get-stuff-done/bin/dist/ (1 tool)
 *
 * Hook list comes from hooks/index.js — see that module + ADR-0001 for
 * the SSOT pattern rationale. Adding/moving a hook requires NO changes
 * to this script; edit hooks/index.js instead.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const hooksManifest = require('../hooks');

const PROJECT_ROOT = hooksManifest.PROJECT_ROOT;
const GSD_BIN_DIR = path.join(PROJECT_ROOT, 'get-stuff-done', 'bin');
const GSD_DIST_DIR = path.join(GSD_BIN_DIR, 'dist');

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
  // Ensure dist directory exists (parent of all per-hook dist paths)
  const distDir = path.join(PROJECT_ROOT, 'hooks', 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Iterate the SSOT manifest. Adding/moving hooks is a hooks/index.js edit;
  // this loop body is intentionally agnostic to specific hook names.
  for (const hook of hooksManifest.HOOKS) {
    const src = hooksManifest.sourcePath(hook);
    const dest = hooksManifest.distPath(hook);
    const sourceRel = `${hook.source}/${hook.name}`;

    if (!fs.existsSync(src)) {
      // FAIL LOUD. Manifest says this file should exist; if it doesn't,
      // either the file moved (update hooks/index.js) or was deleted
      // (remove the manifest entry). Silently skipping was the v3.0.0-era
      // bug that left hooks/dist/ stale for ~50 days. The
      // tests/hooks-manifest.test.js invariant test will also fail in this
      // case at test time. See 40.5-CI-DIAGNOSIS.md and ADR-0001.
      throw new Error(
        `Hook source not found: ${sourceRel}\n` +
        `  Expected at: ${src}\n` +
        `  Manifest entry: hooks/index.js (kind=${hook.kind})\n` +
        `  Either the file moved (update manifest) or was deleted (remove entry).`
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
