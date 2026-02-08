/**
 * Input validation functions for security-critical operations.
 * All validation uses allowlist patterns (not denylists).
 */

const path = require('path');

/**
 * Validates git commit SHA format.
 * Accepts both short SHAs (7-40 chars) and full SHAs (40 chars).
 *
 * @param {string} sha - The git SHA to validate
 * @returns {string} The validated SHA
 * @throws {Error} If SHA format is invalid
 */
function validateGitSHA(sha) {
  if (typeof sha !== 'string') {
    throw new Error(`Invalid git SHA format: ${sha}`);
  }

  // Accept 7-40 hex characters (short and full SHAs)
  const shaPattern = /^[0-9a-f]{7,40}$/i;

  if (!shaPattern.test(sha)) {
    throw new Error(`Invalid git SHA format: ${sha}`);
  }

  return sha;
}

/**
 * Validates git branch name format.
 * Uses git's branch name restrictions plus additional security constraints.
 *
 * @param {string} branch - The branch name to validate
 * @returns {string} The validated branch name
 * @throws {Error} If branch name is invalid
 */
function validateBranchName(branch) {
  if (typeof branch !== 'string' || branch.length === 0) {
    throw new Error(`Branch name contains invalid characters: ${branch}`);
  }

  // Maximum length check
  if (branch.length > 255) {
    throw new Error(`Branch name exceeds maximum length of 255 characters: ${branch}`);
  }

  // Allowlist: alphanumeric start, then alphanumeric + hyphens, underscores, forward slashes, dots
  const branchPattern = /^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/;

  if (!branchPattern.test(branch)) {
    throw new Error(`Branch name contains invalid characters: ${branch}`);
  }

  // Reject git ref traversal
  if (branch.includes('..')) {
    throw new Error(`Branch name contains invalid sequence '..': ${branch}`);
  }

  // Reject git lock files
  if (branch.endsWith('.lock')) {
    throw new Error(`Branch name cannot end with '.lock': ${branch}`);
  }

  // Reject git reflog syntax
  if (branch.includes('@{')) {
    throw new Error(`Branch name contains invalid sequence '@{': ${branch}`);
  }

  return branch;
}

/**
 * Validates config file paths against directory traversal attacks.
 * Ensures the resolved path stays within the allowed base directory.
 *
 * @param {string} userPath - The user-provided path to validate
 * @param {string} allowedBaseDir - The base directory to constrain paths within
 * @returns {string} The resolved, validated absolute path
 * @throws {Error} If path traversal is detected
 */
function validateConfigPath(userPath, allowedBaseDir) {
  if (typeof userPath !== 'string') {
    throw new Error(`Path traversal detected: ${userPath}`);
  }

  // Decode URL-encoded traversal attempts
  const decodedPath = decodeURIComponent(userPath);

  // Resolve both paths to absolute
  const resolvedPath = path.resolve(decodedPath);
  const resolvedBase = path.resolve(allowedBaseDir);

  // Normalize to forward slashes for cross-platform comparison
  const normalizedPath = resolvedPath.replace(/\\/g, '/');
  const normalizedBase = resolvedBase.replace(/\\/g, '/');

  // Ensure resolved path starts with the base directory
  if (!normalizedPath.startsWith(normalizedBase)) {
    throw new Error(`Path traversal detected: ${userPath}`);
  }

  return resolvedPath;
}

module.exports = {
  validateGitSHA,
  validateBranchName,
  validateConfigPath
};
