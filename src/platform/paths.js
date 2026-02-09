const os = require('os');
const pathe = require('pathe');

/**
 * Path Operations Module
 *
 * Cross-platform path utilities wrapping pathe library.
 * All operations produce forward-slash paths for consistency.
 *
 * Usage:
 *   const { gsdPaths } = require('./paths');
 *   const configPath = gsdPaths.gsdHome('config.json');
 *   const normalized = gsdPaths.toForwardSlash('C:\\Users\\...');
 *
 * Why pathe?
 *   - Produces forward slashes on all platforms (better for display/logging)
 *   - Compatible with Node.js path module API
 *   - Handles edge cases consistently across OS
 */

/**
 * Get GSD home directory
 * @param {...string} segments - Path segments to join with GSD home
 * @returns {string} GSD home path with forward slashes
 */
function gsdHome(...segments) {
  const base = process.env.GSD_HOME || pathe.join(os.homedir(), '.gsd');
  return segments.length > 0 ? pathe.join(base, ...segments) : base;
}

/**
 * Get Claude config directory
 * @param {...string} segments - Path segments to join with Claude home
 * @returns {string} Claude config path with forward slashes
 */
function claudeHome(...segments) {
  const base = process.env.CLAUDE_CONFIG_DIR || pathe.join(os.homedir(), '.claude');
  return segments.length > 0 ? pathe.join(base, ...segments) : base;
}

/**
 * Convert path to forward slashes (for display/logging)
 * @param {string} p - Path to convert
 * @returns {string} Path with forward slashes
 */
function toForwardSlash(p) {
  return p.replace(/\\/g, '/');
}

/**
 * Expand ~ to home directory
 * @param {string} p - Path potentially starting with ~
 * @returns {string} Expanded path
 */
function expandTilde(p) {
  if (p.startsWith('~/') || p === '~') {
    return pathe.join(os.homedir(), p.slice(2));
  }
  return p;
}

/**
 * Check if path is absolute
 * @param {string} p - Path to check
 * @returns {boolean} True if absolute
 */
function isAbsolute(p) {
  return pathe.isAbsolute(p);
}

/**
 * Get relative path from `from` to `to`
 * @param {string} from - Base path
 * @param {string} to - Target path
 * @returns {string} Relative path
 */
function relative(from, to) {
  return pathe.relative(from, to);
}

/**
 * Path utilities object (namespace export)
 */
const gsdPaths = {
  // pathe re-exports (all produce forward slashes)
  join: pathe.join,
  resolve: pathe.resolve,
  normalize: pathe.normalize,
  dirname: pathe.dirname,
  basename: pathe.basename,
  extname: pathe.extname,
  isAbsolute,
  relative,

  // GSD-specific utilities
  gsdHome,
  claudeHome,
  toForwardSlash,
  expandTilde,

  // Direct pathe access for advanced use
  pathe,
};

module.exports = {
  gsdPaths,
};
