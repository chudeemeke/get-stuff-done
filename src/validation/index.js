/**
 * Input validation functions for security-critical operations.
 * All validation uses allowlist patterns (not denylists).
 *
 * API: Result type pattern -- all functions return {ok: true, value} or {ok: false, error}.
 * No function throws an exception. Callers check result.ok before using result.value.
 */

const path = require('path');

/**
 * Validates git commit SHA format.
 * Accepts both short SHAs (7-40 chars) and full SHAs (40 chars).
 * Normalizes to lowercase on success.
 *
 * @param {string} sha - The git SHA to validate
 * @returns {{ok: true, value: string} | {ok: false, error: string}}
 */
function validateGitSHA(sha) {
  if (typeof sha !== 'string') {
    return { ok: false, error: `Invalid git SHA format: ${sha}` };
  }

  // Accept 7-40 hex characters (short and full SHAs)
  const shaPattern = /^[0-9a-f]{7,40}$/i;

  if (!shaPattern.test(sha)) {
    return { ok: false, error: `Invalid git SHA format: ${sha}` };
  }

  return { ok: true, value: sha.toLowerCase() };
}

/**
 * Validates git branch name format.
 * Uses git's branch name restrictions plus additional security constraints.
 * Trims whitespace on success.
 *
 * @param {string} branch - The branch name to validate
 * @returns {{ok: true, value: string} | {ok: false, error: string}}
 */
function validateBranchName(branch) {
  if (typeof branch !== 'string' || branch.length === 0) {
    return { ok: false, error: `Branch name contains invalid characters: ${branch}` };
  }

  // Maximum length check
  if (branch.length > 255) {
    return { ok: false, error: `Branch name exceeds maximum length of 255 characters: ${branch}` };
  }

  // Allowlist: alphanumeric start, then alphanumeric + hyphens, underscores, forward slashes, dots
  const branchPattern = /^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/;

  if (!branchPattern.test(branch)) {
    return { ok: false, error: `Branch name contains invalid characters: ${branch}` };
  }

  // Reject git ref traversal
  if (branch.includes('..')) {
    return { ok: false, error: `Branch name contains invalid sequence '..': ${branch}` };
  }

  // Reject git lock files
  if (branch.endsWith('.lock')) {
    return { ok: false, error: `Branch name cannot end with '.lock': ${branch}` };
  }

  // Reject git reflog syntax
  if (branch.includes('@{')) {
    return { ok: false, error: `Branch name contains invalid sequence '@{': ${branch}` };
  }

  return { ok: true, value: branch.trim() };
}

/**
 * Validates config file paths against directory traversal attacks.
 * Ensures the resolved path stays within the allowed base directory.
 * Returns the resolved absolute path on success.
 *
 * @param {string} userPath - The user-provided path to validate
 * @param {string} allowedBaseDir - The base directory to constrain paths within
 * @returns {{ok: true, value: string} | {ok: false, error: string}}
 */
function validateConfigPath(userPath, allowedBaseDir) {
  if (typeof userPath !== 'string') {
    return { ok: false, error: `Path traversal detected: ${userPath}` };
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
    return { ok: false, error: `Path traversal detected: ${userPath}` };
  }

  return { ok: true, value: resolvedPath };
}

/**
 * Validates git tag name format.
 * Similar rules to branch names per git-check-ref-format(1).
 * Tags are case-sensitive -- no transformation applied on success.
 *
 * @param {string} tag - The tag name to validate
 * @returns {{ok: true, value: string} | {ok: false, error: string}}
 */
function validateTagName(tag) {
  if (typeof tag !== 'string' || tag.length === 0) {
    return { ok: false, error: `Tag name contains invalid characters: ${tag}` };
  }

  // Maximum length check
  if (tag.length > 255) {
    return { ok: false, error: `Tag name exceeds maximum length of 255 characters: ${tag}` };
  }

  // Allowlist: alphanumeric start, then alphanumeric + dots, underscores, hyphens, forward slashes
  const tagPattern = /^[a-zA-Z0-9][a-zA-Z0-9._\/-]*$/;

  if (!tagPattern.test(tag)) {
    return { ok: false, error: `Tag name contains invalid characters: ${tag}` };
  }

  // Reject git ref traversal
  if (tag.includes('..')) {
    return { ok: false, error: `Tag name contains invalid sequence '..': ${tag}` };
  }

  // Reject git lock files
  if (tag.endsWith('.lock')) {
    return { ok: false, error: `Tag name cannot end with '.lock': ${tag}` };
  }

  // Reject git reflog syntax
  if (tag.includes('@{')) {
    return { ok: false, error: `Tag name contains invalid sequence '@{': ${tag}` };
  }

  return { ok: true, value: tag };
}

/**
 * Validates git remote URL format.
 * Protocol allowlist: https://, ssh://, git@host:path (scp-like SSH).
 * Rejects git://, file://, http:// and all other protocols.
 * URLs are case-sensitive -- no transformation applied on success.
 *
 * @param {string} url - The remote URL to validate
 * @returns {{ok: true, value: string} | {ok: false, error: string}}
 */
function validateRemoteURL(url) {
  if (typeof url !== 'string' || url.length === 0) {
    return { ok: false, error: `Remote URL uses disallowed protocol: ${url}. Allowed: https://, ssh://, git@host:path` };
  }

  // Allow https:// (most common, TLS-secured)
  if (/^https:\/\/.+/.test(url)) {
    return { ok: true, value: url };
  }

  // Allow ssh:// URI form
  if (/^ssh:\/\/.+/.test(url)) {
    return { ok: true, value: url };
  }

  // Allow git@host:path scp-like SSH syntax
  if (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+:[a-zA-Z0-9._\/-]+/.test(url)) {
    return { ok: true, value: url };
  }

  return { ok: false, error: `Remote URL uses disallowed protocol: ${url}. Allowed: https://, ssh://, git@host:path` };
}

module.exports = {
  validateGitSHA,
  validateBranchName,
  validateConfigPath,
  validateTagName,
  validateRemoteURL
};
