#!/usr/bin/env node
// gsd-hook-version: {{GSD_VERSION}}
// Check for GSD updates in background, write result to cache.
// Called by SessionStart hook - runs once per session.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const FALLBACK_IDENTITY = Object.freeze({
  packageName: '@chude/get-stuff-done',
  PACKAGE_NAME: '@chude/get-stuff-done',
  updateCacheFileName: 'gsd-update-check-opengsd-gsd-core.json',
});

const RUNTIME_CONFIG_DIRS = Object.freeze([
  '.claude',
  '.gemini',
  '.config/kilo',
  '.kilo',
  '.config/opencode',
  '.opencode',
]);

const VERSION_DIRS = Object.freeze(['gsd-core', 'get-stuff-done']);
const FOUR_HOURS_SECS = 4 * 60 * 60;
const SEVEN_DAYS_SECS = 7 * 24 * 60 * 60;

function requireIfPresent(modulePath) {
  try {
    if (fs.existsSync(modulePath)) {
      return require(modulePath);
    }
  } catch (e) {
    // Fall through to the next candidate.
  }
  return null;
}

function loadPackageIdentity() {
  const candidates = [
    // Installed/runtime shape: hooks/<this file> beside ../gsd-core/.
    path.join(__dirname, '..', 'gsd-core', 'bin', 'lib', 'package-identity.cjs'),
    // Source-test shape: overrides/hooks/<this file> with composed dist available.
    path.join(__dirname, '..', '..', 'dist', 'gsd-core', 'bin', 'lib', 'package-identity.cjs'),
  ];

  for (const candidate of candidates) {
    const identity = requireIfPresent(candidate);
    if (identity && (identity.packageName || identity.PACKAGE_NAME)) {
      return {
        packageName: identity.packageName || identity.PACKAGE_NAME,
        PACKAGE_NAME: identity.PACKAGE_NAME || identity.packageName,
        updateCacheFileName: identity.updateCacheFileName || FALLBACK_IDENTITY.updateCacheFileName,
      };
    }
  }

  return FALLBACK_IDENTITY;
}

function hasVersionFile(configDir) {
  return VERSION_DIRS.some(dir => fs.existsSync(path.join(configDir, dir, 'VERSION')));
}

// Detect runtime config directory (supports Claude, OpenCode, Kilo, Gemini).
// Respects CLAUDE_CONFIG_DIR for custom config directory setups.
function detectConfigDir(baseDir) {
  const envDir = process.env.CLAUDE_CONFIG_DIR;
  if (envDir && hasVersionFile(envDir)) {
    return envDir;
  }

  for (const dir of RUNTIME_CONFIG_DIRS) {
    const candidate = path.join(baseDir, dir);
    if (hasVersionFile(candidate)) {
      return candidate;
    }
  }

  return envDir || path.join(baseDir, '.claude');
}

function findVersionFile(configDir) {
  for (const dir of VERSION_DIRS) {
    const candidate = path.join(configDir, dir, 'VERSION');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return path.join(configDir, VERSION_DIRS[0], 'VERSION');
}

function readGsdRole() {
  if (process.env.GSD_ROLE_OVERRIDE) {
    return process.env.GSD_ROLE_OVERRIDE;
  }

  try {
    const { loadConfig, getConfigValue } = require('../../src/config/ConfigLoader');
    const config = loadConfig();
    return getConfigValue(config, 'gsd.role', 'consumer');
  } catch (e) {
    return 'consumer';
  }
}

function readCheckedAt(cacheFile) {
  try {
    if (!fs.existsSync(cacheFile)) return null;
    const existing = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    return typeof existing.checked === 'number' ? existing.checked : null;
  } catch (e) {
    return null;
  }
}

function isCacheFresh(cacheFile, nowSecs) {
  const checkedAt = readCheckedAt(cacheFile);
  return checkedAt !== null && nowSecs - checkedAt < FOUR_HOURS_SECS;
}

const identity = loadPackageIdentity();
const homeDir = os.homedir();
const cwd = process.cwd();

const globalConfigDir = detectConfigDir(homeDir);
const projectConfigDir = detectConfigDir(cwd);

// Shared, tool-agnostic cache directory. Statusline/banner readers can resolve
// one cache location regardless of Claude, Codex, OpenCode, Kilo, or Gemini.
const cacheDir = path.join(homeDir, '.cache', 'gsd');
const cacheFile = path.join(cacheDir, identity.updateCacheFileName);

const projectVersionFile = findVersionFile(projectConfigDir);
const globalVersionFile = findVersionFile(globalConfigDir);

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

if (isCacheFresh(cacheFile, Math.floor(Date.now() / 1000))) {
  process.exit(0);
}

const workerPath = path.join(__dirname, 'gsd-check-update-worker.js');
const child = spawn(process.execPath, [workerPath], {
  stdio: 'ignore',
  windowsHide: true,
  detached: true,
  env: {
    ...process.env,
    GSD_CACHE_FILE: cacheFile,
    GSD_PROJECT_VERSION_FILE: projectVersionFile,
    GSD_GLOBAL_VERSION_FILE: globalVersionFile,
    GSD_ROLE: readGsdRole(),
    GSD_PACKAGE_NAME: identity.PACKAGE_NAME || identity.packageName,
    GSD_UPDATE_CACHE_FILE_NAME: identity.updateCacheFileName,
    GSD_SEVEN_DAYS_SECS: String(SEVEN_DAYS_SECS),
  },
});

child.unref();
