#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- install script with computed paths */

/**
 * v3.0 Delegation Installer
 *
 * Thin wrapper that delegates to upstream's install.js via subprocess,
 * then copies overlay-only files from dist/ to the installed target.
 *
 * Safety invariant: this installer NEVER performs a recursive wipe of the
 * target directory. All cleanup is manifest-driven -- only files that GSD
 * previously installed (tracked in gsd-file-manifest.json) are removed.
 * User content (CLAUDE.md, rules/, projects/, settings.json, skills/, etc.)
 * is structurally impossible to delete through this installer.
 *
 * Flow:
 *   1. Resolve dist directory (composed output from bun run compose)
 *   2. Parse CLI args, resolve target directory
 *   3. If --uninstall: remove manifest-tracked files, exit 0
 *   4. If v2.x detected: remove only GSD-owned files, proceed
 *   5. Spawn upstream install.js with all user flags + stdio: inherit
 *   6. On upstream exit 0: copy overlay files, write .install-meta.json
 *   7. On upstream failure: warn about partial state, exit with upstream code
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIST_DIR = path.join(__dirname, '..', 'dist');
const MANIFEST_PATH = path.join(DIST_DIR, '.overlay-manifest.json');
const DIST_META_PATH = path.join(DIST_DIR, '.install-meta.json');
const PKG_PATH = path.join(__dirname, '..', 'package.json');

/** Filename of the installed-files manifest written by upstream into targetDir. */
const INSTALLED_MANIFEST_NAME = 'gsd-file-manifest.json';

// Colors
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

/**
 * Parse --config-dir value from argv.
 * Supports: --config-dir <path>, --config-dir=<path>, -c <path>, -c=<path>
 * @param {string[]} argv
 * @returns {string|null}
 */
function parseConfigDir(argv) {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--config-dir' || argv[i] === '-c') {
      const val = argv[i + 1];
      if (val && !val.startsWith('-')) return val.replace(/^["']|["']$/g, '');
      return null;
    }
    if (argv[i].startsWith('--config-dir=')) {
      return argv[i].slice('--config-dir='.length).replace(/^["']|["']$/g, '');
    }
    if (argv[i].startsWith('-c=')) {
      return argv[i].slice('-c='.length).replace(/^["']|["']$/g, '');
    }
  }
  return null;
}

/**
 * Determine the target installation directory.
 * Replicates upstream's getGlobalDir() resolution priority.
 *
 * @param {string[]} argv - CLI arguments
 * @returns {string} Resolved target directory path
 */
function resolveTargetDir(argv) {
  const configDir = parseConfigDir(argv);

  const hasLocal = argv.includes('--local');
  const hasOpencode = argv.includes('--opencode');
  const hasGemini = argv.includes('--gemini');

  if (hasLocal) {
    if (hasOpencode) return path.join(process.cwd(), '.opencode');
    if (hasGemini) return path.join(process.cwd(), '.gemini');
    return path.join(process.cwd(), '.claude');
  }

  // --config-dir takes first priority for global installs
  if (configDir) return configDir;

  // Environment variable overrides
  if (hasOpencode) {
    if (process.env.OPENCODE_CONFIG_DIR) return process.env.OPENCODE_CONFIG_DIR;
    if (process.env.OPENCODE_CONFIG) return path.dirname(process.env.OPENCODE_CONFIG);
    if (process.env.XDG_CONFIG_HOME) return path.join(process.env.XDG_CONFIG_HOME, 'opencode');
    return path.join(os.homedir(), '.config', 'opencode');
  }

  if (hasGemini) {
    if (process.env.GEMINI_CONFIG_DIR) return process.env.GEMINI_CONFIG_DIR;
    return path.join(os.homedir(), '.gemini');
  }

  // Default: Claude
  if (process.env.CLAUDE_CONFIG_DIR) return process.env.CLAUDE_CONFIG_DIR;
  return path.join(os.homedir(), '.claude');
}

// ---------------------------------------------------------------------------
// Manifest-driven file removal
// ---------------------------------------------------------------------------

/**
 * Read the installed-files manifest from a previous GSD installation.
 * Returns the list of relative paths that GSD owns in the target directory.
 *
 * @param {string} targetDir
 * @returns {string[]} Relative paths of GSD-installed files, empty if no manifest
 */
function readInstalledManifest(targetDir) {
  const manifestPath = path.join(targetDir, INSTALLED_MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) return [];

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    if (manifest.files && typeof manifest.files === 'object') {
      return Object.keys(manifest.files);
    }
  } catch {
    // Corrupt manifest -- return empty (fallback will handle cleanup)
  }
  return [];
}

/**
 * Remove only GSD-owned files from the target directory.
 *
 * Strategy (in priority order):
 *   1. If gsd-file-manifest.json exists, remove exactly those files (manifest-driven)
 *   2. Otherwise, remove known v2.x directory structures (legacy fallback)
 *
 * In both cases, the manifest file itself and GSD metadata files are also removed.
 * Empty parent directories left behind after file removal are pruned.
 *
 * @param {string} targetDir
 * @param {boolean} quiet
 * @returns {{ removed: number, strategy: string }}
 */
function removeGsdFiles(targetDir, quiet) {
  const manifestFiles = readInstalledManifest(targetDir);
  let removed = 0;
  let skipped = 0;
  let strategy;

  // Path containment boundary -- all resolved paths must start with this prefix
  const resolvedTarget = path.resolve(targetDir) + path.sep;

  if (manifestFiles.length > 0) {
    // Strategy 1: Manifest-driven -- remove exactly what the previous install put down
    strategy = 'manifest';
    for (const relPath of manifestFiles) {
      const fullPath = path.join(targetDir, relPath);
      const resolvedFull = path.resolve(fullPath);
      // Path containment: reject entries that escape targetDir
      if (!resolvedFull.startsWith(resolvedTarget)) {
        skipped++;
        continue;
      }
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { force: true });
        removed++;
      }
    }

    // Prune empty directories left behind (deepest-first)
    const dirs = new Set();
    for (const relPath of manifestFiles) {
      let dir = path.dirname(relPath);
      while (dir && dir !== '.') {
        dirs.add(dir);
        dir = path.dirname(dir);
      }
    }
    const sortedDirs = [...dirs].sort((a, b) => b.split('/').length - a.split('/').length);
    for (const dir of sortedDirs) {
      const fullDir = path.join(targetDir, dir);
      const resolvedDir = path.resolve(fullDir);
      // Path containment: skip directory pruning outside targetDir
      if (!resolvedDir.startsWith(resolvedTarget)) {
        continue;
      }
      try {
        const entries = fs.readdirSync(fullDir);
        if (entries.length === 0) {
          fs.rmdirSync(fullDir);
        }
      } catch {
        // Directory already gone or not empty -- fine
      }
    }
  } else {
    // Strategy 2: Legacy fallback -- remove known v2.x structures
    // Only used when no manifest exists (pre-manifest installs)
    strategy = 'legacy-fallback';
    const v2Paths = [
      'get-stuff-done',   // v2.x directory name
      'get-shit-done',    // v3.0 upstream directory
    ];

    for (const relPath of v2Paths) {
      const fullPath = path.join(targetDir, relPath);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        removed++;
      }
    }
  }

  // Always clean GSD metadata files
  for (const meta of [INSTALLED_MANIFEST_NAME, '.install-meta.json', 'CREDITS.md', 'package.json']) {
    const fullPath = path.join(targetDir, meta);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { force: true });
      removed++;
    }
  }

  if (!quiet) {
    const skippedMsg = skipped > 0 ? `, ${skipped} skipped (path containment)` : '';
    console.log(`  ${dim}Strategy: ${strategy} (${removed} items removed${skippedMsg})${reset}`);
  }

  return { removed, skipped, strategy };
}

// ---------------------------------------------------------------------------
// v2.x detection
// ---------------------------------------------------------------------------

/**
 * Detect v2.x installation in the target directory.
 * Two signals checked in priority order:
 *   1. Meta file at get-stuff-done/.install-meta.json (v2.x location)
 *   2. get-stuff-done/ exists without get-shit-done/ (v2.x dir name)
 *
 * Note: src/ directory presence is NOT a v2.x signal. v3.0 overlay installs
 * src/ files, and other tools may create src/ directories inside the target.
 * Using src/ as a signal causes false positives that trigger cleanup.
 *
 * @param {string} targetDir
 * @returns {{ isV2: boolean, signal?: string, version?: string }}
 */
function detectV2(targetDir) {
  // Signal 1: v2.x meta file
  const v2MetaPath = path.join(targetDir, 'get-stuff-done', '.install-meta.json');
  if (fs.existsSync(v2MetaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(v2MetaPath, 'utf-8'));
      if (!meta.overlay_version || (meta.version && parseFloat(meta.version) < 3.0)) {
        return { isV2: true, signal: 'meta', version: meta.version };
      }
    } catch {
      return { isV2: true, signal: 'meta-corrupt' };
    }
  }

  // Check target-root/.install-meta.json (v3.0 composition format)
  const rootMetaPath = path.join(targetDir, '.install-meta.json');
  if (fs.existsSync(rootMetaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(rootMetaPath, 'utf-8'));
      if (meta.overlay_version) {
        return { isV2: false };
      }
    } catch {
      // Ignore
    }
  }

  // Signal 2: get-stuff-done/ exists without get-shit-done/ (v2.x dir name)
  if (
    fs.existsSync(path.join(targetDir, 'get-stuff-done')) &&
    !fs.existsSync(path.join(targetDir, 'get-shit-done'))
  ) {
    return { isV2: true, signal: 'directory-name' };
  }

  return { isV2: false };
}

// ---------------------------------------------------------------------------
// v2.x cleanup
// ---------------------------------------------------------------------------

/**
 * Check if a target directory is safe to operate on.
 * Refuses home directories, filesystem roots, and suspiciously short paths.
 * @param {string} targetDir
 * @returns {{ safe: boolean, reason?: string }}
 */
function isSafeToClean(targetDir) {
  const resolved = path.resolve(targetDir);
  const home = os.homedir();

  if (resolved === path.resolve(home)) {
    return { safe: false, reason: 'target is home directory' };
  }

  const parsed = path.parse(resolved);
  if (resolved === parsed.root) {
    return { safe: false, reason: 'target is filesystem root' };
  }

  const segments = resolved.replace(parsed.root, '').split(path.sep).filter(Boolean);
  if (segments.length < 2) {
    return { safe: false, reason: 'target path too shallow (less than 2 segments below root)' };
  }

  return { safe: true };
}

/**
 * Clean up a previous GSD installation using manifest-driven removal.
 * Only GSD-owned files are removed. User content is structurally preserved.
 *
 * @param {string} targetDir
 * @param {{ isV2: boolean, signal?: string, version?: string }} detection
 * @param {boolean} quiet
 * @returns {Promise<boolean>} true if cleaned, false if safety guard refused
 */
async function cleanupV2(targetDir, detection, quiet) {
  const safety = isSafeToClean(targetDir);
  if (!safety.safe) {
    console.error(`\n${red}Error:${reset} Refusing to clean target directory.`);
    console.error(`  Reason: ${safety.reason}`);
    console.error(`  Path: ${targetDir}`);
    console.error(`  This is a safety guard. Use --config-dir to specify a valid target.\n`);
    return false;
  }

  if (!quiet) {
    console.log(`\n${yellow}Upgrading from v2.x to v3.0 -- cleaning GSD files...${reset}`);
    console.log(`  Signal: ${detection.signal}`);
    if (detection.version && detection.version !== 'unknown') {
      console.log(`  Previous version: ${detection.version}`);
    }
    console.log(`  Location: ${targetDir}`);
    console.log(`  User content (CLAUDE.md, rules/, projects/, settings.json) is preserved.`);
  }

  const { removed, strategy } = removeGsdFiles(targetDir, quiet);

  if (!quiet) {
    console.log(`  ${green}GSD files removed (${strategy}: ${removed} items). Proceeding with v3.0 install.${reset}\n`);
  }
  return true;
}

// ---------------------------------------------------------------------------
// Overlay file copy
// ---------------------------------------------------------------------------

/**
 * Copy overlay-only files from dist/ to the target directory.
 * Reads the manifest generated by compose.js.
 *
 * @param {string} distDir - Source dist directory
 * @param {string} targetDir - Installation target
 * @returns {number} Number of files copied
 */
function copyOverlayFiles(distDir, targetDir) {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`${red}Error:${reset} .overlay-manifest.json not found in dist/`);
    console.error(`  Run ${cyan}bun run compose${reset} to generate dist/ first.`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  let copied = 0;

  for (const relPath of manifest) {
    const srcPath = path.join(distDir, relPath);
    const destPath = path.join(targetDir, relPath);

    if (!fs.existsSync(srcPath)) continue;

    const destDir = path.dirname(destPath);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(srcPath, destPath);
    copied++;
  }

  return copied;
}

// ---------------------------------------------------------------------------
// Overlay provenance manifest
// ---------------------------------------------------------------------------

/**
 * Copy .overlay-manifest.json to the target directory (inside get-shit-done/).
 * This records which installed files came from the overlay vs upstream,
 * enabling provenance auditing at the installed location.
 *
 * Gracefully skips if either the source manifest or get-shit-done/ target
 * directory doesn't exist (partial install state).
 *
 * @param {string} distDir - Source dist directory
 * @param {string} targetDir - Installation target
 * @returns {boolean} Whether the manifest was copied
 */
function copyOverlayManifest(distDir, targetDir) {
  const srcManifest = path.join(distDir, '.overlay-manifest.json');
  const gsdDir = path.join(targetDir, 'get-shit-done');

  if (!fs.existsSync(srcManifest) || !fs.existsSync(gsdDir)) return false;

  fs.copyFileSync(srcManifest, path.join(gsdDir, '.overlay-manifest.json'));
  return true;
}

// ---------------------------------------------------------------------------
// Orphan cleanup
// ---------------------------------------------------------------------------

/**
 * Remove known orphaned paths from previous install layouts.
 *
 * Upstream's installer reads from hooks/dist/ in the source package and writes
 * to hooks/ in the target (flattening). Previous installer versions or manual
 * operations may have left a hooks/dist/ subdirectory at the target. This
 * function removes those stale artifacts.
 *
 * @param {string} targetDir - Installation target
 * @returns {number} Number of orphaned paths removed
 */
function cleanOrphanedPaths(targetDir) {
  const orphans = [
    path.join(targetDir, 'hooks', 'dist'),
  ];

  let removed = 0;
  for (const orphanPath of orphans) {
    try {
      if (fs.existsSync(orphanPath) && fs.lstatSync(orphanPath).isDirectory()) {
        fs.rmSync(orphanPath, { recursive: true, force: true });
        removed++;
      }
    } catch (_) {
      // Graceful: orphan cleanup is best-effort, never crashes installer
    }
  }
  return removed;
}

// ---------------------------------------------------------------------------
// Install metadata
// ---------------------------------------------------------------------------

/**
 * Write .install-meta.json to the target directory (inside get-shit-done/).
 *
 * @param {string} targetDir - Installation target
 */
function writeInstallMeta(targetDir) {
  const distMeta = JSON.parse(fs.readFileSync(DIST_META_PATH, 'utf-8'));
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));

  const meta = {
    upstream_version: distMeta.upstream_version,
    overlay_version: pkg.version,
    installed_at: new Date().toISOString(),
    features_disabled: distMeta.features_disabled || [],
    overrides_applied: distMeta.overrides_applied || [],
  };

  const gsdDir = path.join(targetDir, 'get-shit-done');
  if (fs.existsSync(gsdDir)) {
    fs.writeFileSync(
      path.join(gsdDir, '.install-meta.json'),
      JSON.stringify(meta, null, 2),
      'utf-8'
    );
  }
}

// ---------------------------------------------------------------------------
// StatusLine setting
// ---------------------------------------------------------------------------

/**
 * Ensure statusLine setting exists in global settings.json.
 * Read-modify-write: preserves all existing settings.
 * Per D-06: if user has a custom (non-GSD) statusLine, preserve it.
 *
 * @param {string} targetDir - The config directory (e.g., ~/.claude)
 * @returns {{ action: string, command?: string }} What was done
 */
function patchStatusLine(targetDir) {
  const settingsPath = path.join(targetDir, 'settings.json');
  let settings = {};

  if (fs.existsSync(settingsPath)) {
    const raw = fs.readFileSync(settingsPath, 'utf8');
    try {
      settings = JSON.parse(raw);
    } catch (e) {
      // Corrupt JSON: backup and warn, don't silently destroy
      const backupPath = settingsPath + '.backup';
      fs.copyFileSync(settingsPath, backupPath);
      console.warn(`  Warning: ${settingsPath} is corrupt JSON. Backed up to ${backupPath}`);
      settings = {};
    }
  }

  // Per D-06: preserve custom (non-GSD) statusLine
  if (settings.statusLine &&
      typeof settings.statusLine === 'object' &&
      settings.statusLine.command &&
      !settings.statusLine.command.includes('gsd-statusline')) {
    return { action: 'preserved_custom' };
  }

  // Determine action BEFORE mutation (fixes Codex logic bug)
  const hadGsdStatusLine = settings.statusLine &&
      typeof settings.statusLine === 'object' &&
      settings.statusLine.command &&
      settings.statusLine.command.includes('gsd-statusline');
  const action = hadGsdStatusLine ? 'updated' : 'added';

  // Build the command using forward slashes (cross-platform, per upstream pattern)
  // dist/hooks/ contains bundled versions (finalize-dist.js replaces raw source after compose+build)
  const hooksPath = targetDir.replace(/\\/g, '/') + '/hooks/gsd-statusline.js';
  const command = `node "${hooksPath}"`;

  // Per D-05: set the statusLine entry
  settings.statusLine = {
    type: 'command',
    command: command,
  };

  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  const content = JSON.stringify(settings, null, 2) + '\n';
  const tmpPath = settingsPath + '.tmp';
  fs.writeFileSync(tmpPath, content);
  fs.renameSync(tmpPath, settingsPath);

  return { action, command };
}

// ---------------------------------------------------------------------------
// Uninstall
// ---------------------------------------------------------------------------

/**
 * Remove only GSD-installed files from the target directory using the manifest.
 * User content is structurally preserved. Idempotent: missing target exits 0.
 *
 * @param {string} targetDir
 * @param {{ exit?: boolean }} [options] - When exit is false, returns result instead of calling process.exit()
 * @returns {{ removed: number, skipped: number, strategy: string, missing?: boolean } | void}
 */
function uninstall(targetDir, { exit: shouldExit = true } = {}) {
  if (!fs.existsSync(targetDir)) {
    if (!shouldExit) return { removed: 0, skipped: 0, strategy: 'none', missing: true };
    console.log(`${dim}Nothing to uninstall at ${targetDir}${reset}`);
    process.exit(0);
  }

  const { removed, skipped, strategy } = removeGsdFiles(targetDir, false);

  if (!shouldExit) return { removed, skipped, strategy };

  console.log(`${green}Uninstalled GSD from ${targetDir}${reset}`);
  const skippedMsg = skipped > 0 ? `, ${skipped} skipped (path containment)` : '';
  console.log(`${dim}Strategy: ${strategy} (${removed} items removed${skippedMsg})${reset}`);
  console.log(`${dim}User content preserved (CLAUDE.md, rules/, projects/, settings.json, skills/)${reset}`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Install (main delegation)
// ---------------------------------------------------------------------------

/**
 * Run the full v3.0 install:
 *   1. Spawn upstream install.js with user flags
 *   2. On exit 0: copy overlay files + write meta
 *   3. On non-zero exit: warn and exit with upstream code
 *
 * @param {string} distDir
 * @param {string} targetDir
 * @param {string[]} userArgs - Original CLI args to pass through
 */
function install(distDir, targetDir, userArgs) {
  const upstreamScript = path.join(distDir, 'bin', 'install.js');

  if (!fs.existsSync(upstreamScript)) {
    console.error(`${red}Error:${reset} Upstream install.js not found at ${upstreamScript}`);
    console.error(`  Run ${cyan}bun run compose${reset} to generate dist/ first.`);
    process.exit(1);
  }

  const child = spawn(process.execPath, [upstreamScript, ...userArgs], {
    stdio: 'inherit',
    env: { ...process.env },
  });

  child.on('error', (err) => {
    console.error(`${red}Error:${reset} Failed to spawn upstream installer: ${err.message}`);
    process.exit(1);
  });

  child.on('close', (code) => {
    if (code !== 0) {
      console.error(`\n${yellow}Upstream installer exited with code ${code}.${reset}`);
      console.error(`  The installation may be in a partial state.`);
      process.exit(code);
    }

    // Clean up orphaned paths from previous install layouts
    const orphansRemoved = cleanOrphanedPaths(targetDir);
    if (orphansRemoved > 0) {
      console.log(`\n  ${green}Cleaned ${orphansRemoved} orphaned path(s)${reset}`);
    }

    // Upstream succeeded -- copy overlay files
    const copied = copyOverlayFiles(distDir, targetDir);
    console.log(`\n  ${green}Overlay files copied:${reset} ${copied}`);

    // Write v3.0 install metadata
    writeInstallMeta(targetDir);
    console.log(`  ${green}.install-meta.json written${reset}`);

    // Copy overlay provenance manifest
    if (copyOverlayManifest(distDir, targetDir)) {
      console.log(`  ${green}.overlay-manifest.json written${reset}`);
    }

    // Ensure statusLine setting points to fork's enhanced version
    const slResult = patchStatusLine(targetDir);
    if (slResult.action === 'preserved_custom') {
      console.log(`  ${yellow}StatusLine:${reset} preserved existing custom setting`);
    } else {
      console.log(`  ${green}StatusLine setting ${slResult.action}${reset}`);
    }

    process.exit(0);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error(`${red}Error:${reset} dist/ directory not found.`);
    console.error(`  Run ${cyan}bun run compose${reset} to generate the composed output first.`);
    process.exit(1);
  }

  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    console.log(`\n  ${cyan}@chude/get-stuff-done${reset} v${pkg.version}`);
    console.log(`  Delegation installer -- delegates to upstream, layers overlay additions.\n`);
    console.log(`  ${yellow}Usage:${reset} bunx @chude/get-stuff-done [options]\n`);
    console.log(`  ${yellow}Options:${reset}`);
    console.log(`    ${cyan}--claude${reset}                  Install for Claude Code`);
    console.log(`    ${cyan}--opencode${reset}                Install for OpenCode`);
    console.log(`    ${cyan}--gemini${reset}                  Install for Gemini`);
    console.log(`    ${cyan}--all${reset}                     Install for all runtimes`);
    console.log(`    ${cyan}-g, --global${reset}              Install globally`);
    console.log(`    ${cyan}-l, --local${reset}               Install locally`);
    console.log(`    ${cyan}-c, --config-dir <path>${reset}   Specify custom config directory`);
    console.log(`    ${cyan}-u, --uninstall${reset}           Remove all installed files`);
    console.log(`    ${cyan}--force${reset}                   Quiet mode (suppress migration banner)`);
    console.log(`    ${cyan}-h, --help${reset}                Show this help message\n`);
    process.exit(0);
  }

  const hasUninstall = args.includes('--uninstall') || args.includes('-u');
  const targetDir = resolveTargetDir(args);
  const hasForce = args.includes('--force');

  if (hasUninstall) {
    uninstall(targetDir);
    return;
  }

  // Check for v2.x installation
  if (fs.existsSync(targetDir)) {
    const v2 = detectV2(targetDir);
    if (v2.isV2) {
      const cleaned = await cleanupV2(targetDir, v2, hasForce);
      if (!cleaned) {
        process.exit(1);
      }
    }
  }

  install(DIST_DIR, targetDir, args);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`${red}Error:${reset} ${err.message}`);
    process.exit(1);
  });
}

// Exports for unit testing -- available when required as a module
module.exports = {
  INSTALLED_MANIFEST_NAME,
  readInstalledManifest,
  removeGsdFiles,
  detectV2,
  isSafeToClean,
  parseConfigDir,
  resolveTargetDir,
  patchStatusLine,
  copyOverlayManifest,
  cleanOrphanedPaths,
  uninstall,
};
