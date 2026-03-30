#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- install script with computed paths */

/**
 * v3.0 Delegation Installer
 *
 * Thin wrapper that delegates to upstream's install.js via subprocess,
 * then copies overlay-only files from dist/ to the installed target.
 *
 * Flow:
 *   1. Resolve dist directory (composed output from bun run compose)
 *   2. Parse CLI args, resolve target directory
 *   3. If --uninstall: wipe target, exit 0
 *   4. If v2.x detected: auto-clean and proceed (--force for silent mode)
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
// v2.x detection
// ---------------------------------------------------------------------------

/**
 * Detect v2.x installation in the target directory.
 * Three signals checked in priority order:
 *   1. Meta file at get-stuff-done/.install-meta.json (v2.x location)
 *   2. src/ directory in target (v2.x installed fork source)
 *   3. get-stuff-done/ exists without get-shit-done/ (v2.x dir name)
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
      // Corrupt meta -- treat as v2.x (better safe than sorry)
      return { isV2: true, signal: 'meta-corrupt' };
    }
  }

  // Also check target-root/.install-meta.json (v3.0 composition format in target)
  const rootMetaPath = path.join(targetDir, '.install-meta.json');
  if (fs.existsSync(rootMetaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(rootMetaPath, 'utf-8'));
      if (meta.overlay_version) {
        // This is a v3.0+ installation, not v2.x
        return { isV2: false };
      }
    } catch {
      // Ignore
    }
  }

  // Signal 2: src/ directory in target (v2.x installed fork source files)
  if (fs.existsSync(path.join(targetDir, 'src'))) {
    return { isV2: true, signal: 'src-directory' };
  }

  // Signal 3: get-stuff-done/ exists without get-shit-done/ (v2.x dir name)
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
 * Check if a target directory is safe to wipe during v2.x cleanup.
 * Refuses home directories, filesystem roots, and suspiciously short paths.
 * @param {string} targetDir
 * @returns {{ safe: boolean, reason?: string }}
 */
function isSafeToClean(targetDir) {
  const resolved = path.resolve(targetDir);
  const home = os.homedir();

  // Never delete home directory itself
  if (resolved === path.resolve(home)) {
    return { safe: false, reason: 'target is home directory' };
  }

  // Never delete filesystem root
  const parsed = path.parse(resolved);
  if (resolved === parsed.root) {
    return { safe: false, reason: 'target is filesystem root' };
  }

  // Never delete single-level paths like /usr, /tmp, C:\Users
  const segments = resolved.replace(parsed.root, '').split(path.sep).filter(Boolean);
  if (segments.length < 2) {
    return { safe: false, reason: 'target path too shallow (less than 2 segments below root)' };
  }

  return { safe: true };
}

/**
 * Clean up a v2.x installation by wiping the target directory.
 * Non-interactive: always proceeds. Use --force for silent mode (no banner).
 *
 * @param {string} targetDir
 * @param {{ isV2: boolean, signal?: string, version?: string }} detection
 * @param {boolean} quiet - Suppress migration banner (--force flag)
 * @returns {Promise<boolean>} true if cleaned, false if safety guard refused
 */
async function cleanupV2(targetDir, detection, quiet) {
  // Safety guard: refuse to delete unsafe targets
  const safety = isSafeToClean(targetDir);
  if (!safety.safe) {
    console.error(`\n${red}Error:${reset} Refusing to clean target directory.`);
    console.error(`  Reason: ${safety.reason}`);
    console.error(`  Path: ${targetDir}`);
    console.error(`  This is a safety guard. Use --config-dir to specify a valid target.\n`);
    return false;
  }

  const version = detection.version || 'unknown';
  const signal = detection.signal;

  if (!quiet) {
    console.log(`\n${yellow}Upgrading from v2.x to v3.0 -- cleaning old files...${reset}`);
    console.log(`  Signal: ${signal}`);
    if (version !== 'unknown') console.log(`  Previous version: ${version}`);
    console.log(`  Location: ${targetDir}`);
    console.log(`  User config (~/.gsd/) and project data (.planning/) are not affected.`);
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  if (!quiet) {
    console.log(`  ${green}v2.x files removed. Proceeding with v3.0 install.${reset}\n`);
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

  // Write to get-shit-done/ subdirectory (where upstream writes its own metadata)
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
// Uninstall
// ---------------------------------------------------------------------------

/**
 * Remove all installed files from the target directory.
 * Idempotent: missing target exits 0 with informational message.
 *
 * @param {string} targetDir
 */
function uninstall(targetDir) {
  if (!fs.existsSync(targetDir)) {
    console.log(`${dim}Nothing to uninstall at ${targetDir}${reset}`);
    process.exit(0);
  }

  // Remove all contents but keep the target directory itself (empty)
  const entries = fs.readdirSync(targetDir);
  for (const entry of entries) {
    const fullPath = path.join(targetDir, entry);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }

  console.log(`${green}Uninstalled from ${targetDir}${reset}`);
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

    // Upstream succeeded -- copy overlay files
    const copied = copyOverlayFiles(distDir, targetDir);
    console.log(`\n  ${green}Overlay files copied:${reset} ${copied}`);

    // Write v3.0 install metadata
    writeInstallMeta(targetDir);
    console.log(`  ${green}.install-meta.json written${reset}`);

    process.exit(0);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Verify dist/ exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error(`${red}Error:${reset} dist/ directory not found.`);
    console.error(`  Run ${cyan}bun run compose${reset} to generate the composed output first.`);
    process.exit(1);
  }

  const args = process.argv.slice(2);

  // Handle --help
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
  const hasForce = args.includes('--force');
  const targetDir = resolveTargetDir(args);

  // Handle uninstall
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

  // Run install
  install(DIST_DIR, targetDir, args);
}

main().catch((err) => {
  console.error(`${red}Error:${reset} ${err.message}`);
  process.exit(1);
});
