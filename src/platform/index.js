/**
 * GSD Platform Detection Module
 *
 * Centralized platform, path, and terminal detection for cross-platform support.
 *
 * Quick Start:
 *   const { platform, gsdPaths, terminal } = require('./src/platform');
 *
 *   // OS and environment detection
 *   console.log(platform.os);         // 'win32', 'darwin', 'linux'
 *   console.log(platform.shell);      // 'bash', 'zsh', 'pwsh', 'cmd'
 *   console.log(platform.isGitBash);  // true/false
 *
 *   // Path operations (all produce forward slashes)
 *   const config = gsdPaths.gsdHome('config.json');
 *   const normalized = gsdPaths.join('a', 'b', 'c'); // 'a/b/c'
 *
 *   // Terminal capabilities
 *   console.log(terminal.colorLevel);      // 0-3
 *   console.log(terminal.supportsUnicode); // true/false
 *
 * Architecture:
 *   detect.js   - OS, shell, environment, Node.js, git detection
 *   paths.js    - Cross-platform path utilities (wraps pathe)
 *   terminal.js - Terminal color and Unicode capability detection
 *   index.js    - Unified API (this file)
 */

const { detectPlatform, clearCache: clearPlatformCache } = require('./detect');
const { gsdPaths } = require('./paths');
const { detectTerminal, clearCache: clearTerminalCache } = require('./terminal');

// Singleton instances
const platform = detectPlatform();
const terminal = detectTerminal();

/**
 * Clear all detection caches (for testing)
 */
function clearAllCaches() {
  clearPlatformCache();
  clearTerminalCache();
}

module.exports = {
  // Primary API - pre-detected singletons
  platform,
  terminal,
  gsdPaths,

  // Direct function access (for re-detection scenarios)
  detectPlatform,
  detectTerminal,

  // Testing utilities
  clearAllCaches,
};
