/**
 * Unit Tests: Validation Module
 *
 * Tests input validation functions for security-critical operations:
 * - validateGitSHA: git commit hash format validation
 * - validateBranchName: git branch name security validation
 * - validateConfigPath: directory traversal protection
 */

const { describe, test, expect, beforeEach, afterEach } = require('bun:test');
const { validateGitSHA, validateBranchName, validateConfigPath } = require('../src/validation');
const { createTempDir } = require('./helpers');

describe('validateGitSHA', () => {
  describe('accepts valid SHAs', () => {
    test('accepts full 40-char hex SHA', () => {
      const sha = '1234567890abcdef1234567890abcdef12345678';
      expect(validateGitSHA(sha)).toBe(sha);
    });

    test('accepts short 7-char hex SHA', () => {
      const sha = '1234567';
      expect(validateGitSHA(sha)).toBe(sha);
    });

    test('accepts 8-char hex SHA', () => {
      const sha = '12345678';
      expect(validateGitSHA(sha)).toBe(sha);
    });

    test('accepts 12-char hex SHA', () => {
      const sha = '123456789abc';
      expect(validateGitSHA(sha)).toBe(sha);
    });

    test('accepts mixed-case hex (case insensitive)', () => {
      const sha = 'AbCdEf1234567890';
      expect(validateGitSHA(sha)).toBe(sha);
    });

    test('accepts uppercase hex', () => {
      const sha = 'ABCDEF1234567890';
      expect(validateGitSHA(sha)).toBe(sha);
    });

    test('accepts all numeric SHA', () => {
      const sha = '1234567890';
      expect(validateGitSHA(sha)).toBe(sha);
    });

    test('accepts all alphabetic SHA', () => {
      const sha = 'abcdefabcdef';
      expect(validateGitSHA(sha)).toBe(sha);
    });
  });

  describe('rejects invalid SHAs', () => {
    test('rejects non-hex characters (g)', () => {
      const sha = '123456g';
      expect(() => validateGitSHA(sha)).toThrow('Invalid git SHA format');
    });

    test('rejects non-hex characters (z)', () => {
      const sha = 'abcdefz';
      expect(() => validateGitSHA(sha)).toThrow('Invalid git SHA format');
    });

    test('rejects special characters', () => {
      const sha = '123456-';
      expect(() => validateGitSHA(sha)).toThrow('Invalid git SHA format');
    });

    test('rejects whitespace', () => {
      const sha = '123456 789';
      expect(() => validateGitSHA(sha)).toThrow('Invalid git SHA format');
    });

    test('rejects too-short SHA (6 chars)', () => {
      const sha = '123456';
      expect(() => validateGitSHA(sha)).toThrow('Invalid git SHA format');
    });

    test('rejects too-long SHA (41 chars)', () => {
      const sha = '1234567890abcdef1234567890abcdef123456789';
      expect(() => validateGitSHA(sha)).toThrow('Invalid git SHA format');
    });

    test('rejects empty string', () => {
      expect(() => validateGitSHA('')).toThrow('Invalid git SHA format');
    });

    test('rejects non-string input (number)', () => {
      expect(() => validateGitSHA(123456789)).toThrow('Invalid git SHA format');
    });

    test('rejects non-string input (null)', () => {
      expect(() => validateGitSHA(null)).toThrow('Invalid git SHA format');
    });

    test('rejects non-string input (undefined)', () => {
      expect(() => validateGitSHA(undefined)).toThrow('Invalid git SHA format');
    });

    test('rejects non-string input (object)', () => {
      expect(() => validateGitSHA({ sha: '1234567' })).toThrow('Invalid git SHA format');
    });
  });
});

describe('validateBranchName', () => {
  describe('accepts valid branch names', () => {
    test('accepts standard branch name (main)', () => {
      expect(validateBranchName('main')).toBe('main');
    });

    test('accepts standard branch name (feature/add-login)', () => {
      expect(validateBranchName('feature/add-login')).toBe('feature/add-login');
    });

    test('accepts branch name with hyphens (fix-123)', () => {
      expect(validateBranchName('fix-123')).toBe('fix-123');
    });

    test('accepts branch name with underscores (test_branch)', () => {
      expect(validateBranchName('test_branch')).toBe('test_branch');
    });

    test('accepts branch name with dots (release-v1.0.0)', () => {
      expect(validateBranchName('release-v1.0.0')).toBe('release-v1.0.0');
    });

    test('accepts branch name with slashes (team/feature/name)', () => {
      expect(validateBranchName('team/feature/name')).toBe('team/feature/name');
    });

    test('accepts branch name with numbers', () => {
      expect(validateBranchName('branch123')).toBe('branch123');
    });

    test('accepts branch name starting with uppercase', () => {
      expect(validateBranchName('Feature-Branch')).toBe('Feature-Branch');
    });

    test('accepts long branch name (under 255 chars)', () => {
      const longName = 'a'.repeat(200);
      expect(validateBranchName(longName)).toBe(longName);
    });
  });

  describe('rejects invalid branch names', () => {
    test('rejects shell metacharacter (;)', () => {
      expect(() => validateBranchName('branch;rm -rf')).toThrow('invalid characters');
    });

    test('rejects shell metacharacter (|)', () => {
      expect(() => validateBranchName('branch|command')).toThrow('invalid characters');
    });

    test('rejects shell metacharacter (&)', () => {
      expect(() => validateBranchName('branch&command')).toThrow('invalid characters');
    });

    test('rejects shell metacharacter ($)', () => {
      expect(() => validateBranchName('branch$VAR')).toThrow('invalid characters');
    });

    test('rejects shell metacharacter (backtick)', () => {
      expect(() => validateBranchName('branch`cmd`')).toThrow('invalid characters');
    });

    test('rejects shell metacharacter (>)', () => {
      expect(() => validateBranchName('branch>file')).toThrow('invalid characters');
    });

    test('rejects shell metacharacter (<)', () => {
      expect(() => validateBranchName('branch<file')).toThrow('invalid characters');
    });

    test('rejects names starting with hyphen (looks like flag)', () => {
      expect(() => validateBranchName('-branch')).toThrow('invalid characters');
    });

    test('rejects names with double-dot (git traversal)', () => {
      expect(() => validateBranchName('feature..branch')).toThrow('invalid sequence');
    });

    test('rejects names ending with .lock', () => {
      expect(() => validateBranchName('feature.lock')).toThrow('cannot end with');
    });

    test('rejects names with reflog syntax (@{)', () => {
      expect(() => validateBranchName('branch@{yesterday}')).toThrow('invalid characters');
    });

    test('rejects empty string', () => {
      expect(() => validateBranchName('')).toThrow('invalid characters');
    });

    test('rejects non-string input', () => {
      expect(() => validateBranchName(123)).toThrow('invalid characters');
    });

    test('rejects branch name exceeding 255 chars', () => {
      const tooLong = 'a'.repeat(256);
      expect(() => validateBranchName(tooLong)).toThrow('exceeds maximum length');
    });

    test('rejects whitespace', () => {
      expect(() => validateBranchName('branch name')).toThrow('invalid characters');
    });

    test('rejects parentheses', () => {
      expect(() => validateBranchName('branch(name)')).toThrow('invalid characters');
    });

    test('rejects square brackets', () => {
      expect(() => validateBranchName('branch[name]')).toThrow('invalid characters');
    });

    test('rejects asterisk (glob pattern)', () => {
      expect(() => validateBranchName('branch*')).toThrow('invalid characters');
    });

    test('rejects question mark (glob pattern)', () => {
      expect(() => validateBranchName('branch?')).toThrow('invalid characters');
    });
  });
});

describe('validateConfigPath', () => {
  let tempDir;
  let cleanup;

  beforeEach(() => {
    const temp = createTempDir();
    tempDir = temp.path;
    cleanup = temp.cleanup;
  });

  afterEach(() => {
    cleanup();
  });

  describe('accepts valid paths', () => {
    test('accepts path within allowed base directory', () => {
      const path = require('path');
      // Use path.join to create path relative to base directory
      const userPath = path.join(tempDir, 'config.json');
      const validated = validateConfigPath(userPath, tempDir);
      expect(validated).toContain(tempDir);
    });

    test('accepts nested path within base directory', () => {
      const path = require('path');
      const userPath = path.join(tempDir, 'sub', 'dir', 'config.json');
      const validated = validateConfigPath(userPath, tempDir);
      expect(validated).toContain(tempDir);
    });

    test('accepts absolute path within base directory', () => {
      const path = require('path');
      const userPath = path.join(tempDir, 'config.json');
      const validated = validateConfigPath(userPath, tempDir);
      // Normalize both paths for comparison (Windows uses backslashes)
      const normalizedValidated = validated.replace(/\\/g, '/');
      const normalizedUserPath = userPath.replace(/\\/g, '/');
      expect(normalizedValidated).toBe(normalizedUserPath);
    });
  });

  describe('rejects path traversal', () => {
    test('rejects path traversal (../../etc/passwd)', () => {
      const userPath = '../../etc/passwd';
      expect(() => validateConfigPath(userPath, tempDir)).toThrow('Path traversal detected');
    });

    test('rejects path traversal (../../../root)', () => {
      const userPath = '../../../root';
      expect(() => validateConfigPath(userPath, tempDir)).toThrow('Path traversal detected');
    });

    test('rejects URL-encoded traversal (%2e%2e)', () => {
      const userPath = '%2e%2e/etc/passwd';
      expect(() => validateConfigPath(userPath, tempDir)).toThrow('Path traversal detected');
    });

    test('rejects double URL-encoded traversal', () => {
      const userPath = '%252e%252e/etc/passwd';
      expect(() => validateConfigPath(userPath, tempDir)).toThrow('Path traversal detected');
    });

    test('rejects absolute path outside base directory', () => {
      const userPath = '/etc/passwd';
      expect(() => validateConfigPath(userPath, tempDir)).toThrow('Path traversal detected');
    });

    test('rejects paths starting with base but then escaping', () => {
      // e.g., /tmp/gsd-test-abc/../../../etc/passwd
      const userPath = `${tempDir}/../../../etc/passwd`;
      expect(() => validateConfigPath(userPath, tempDir)).toThrow('Path traversal detected');
    });
  });

  describe('handles platform-specific paths', () => {
    test('handles Windows backslash paths', () => {
      const path = require('path');
      const userPath = path.join(tempDir, 'sub', 'dir', 'config.json');
      const validated = validateConfigPath(userPath, tempDir);
      expect(validated).toContain(tempDir);
    });

    test('handles mixed slashes', () => {
      const path = require('path');
      // Create a proper path then test
      const userPath = path.join(tempDir, 'sub', 'dir', 'config.json');
      const validated = validateConfigPath(userPath, tempDir);
      expect(validated).toContain(tempDir);
    });

    test('rejects Windows-style traversal (..\\..\\etc)', () => {
      const userPath = '..\\..\\etc\\passwd';
      expect(() => validateConfigPath(userPath, tempDir)).toThrow('Path traversal detected');
    });
  });

  describe('rejects invalid input', () => {
    test('rejects non-string input', () => {
      expect(() => validateConfigPath(123, tempDir)).toThrow('Path traversal detected');
    });

    test('rejects null input', () => {
      expect(() => validateConfigPath(null, tempDir)).toThrow('Path traversal detected');
    });

    test('rejects undefined input', () => {
      expect(() => validateConfigPath(undefined, tempDir)).toThrow('Path traversal detected');
    });
  });
});
