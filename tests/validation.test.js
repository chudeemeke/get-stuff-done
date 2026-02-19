/**
 * Unit Tests: Validation Module
 *
 * Tests input validation functions for security-critical operations:
 * - validateGitSHA: git commit hash format validation
 * - validateBranchName: git branch name security validation
 * - validateConfigPath: directory traversal protection
 * - validateTagName: git tag name validation
 * - validateRemoteURL: remote URL protocol allowlist validation
 *
 * All functions return Result type: {ok: true, value} or {ok: false, error}.
 * No function throws exceptions -- assertions check result.ok and result.value/error.
 */

const { describe, test, expect, beforeEach, afterEach } = require('bun:test');
const { validateGitSHA, validateBranchName, validateConfigPath, validateTagName, validateRemoteURL } = require('../src/validation');
const { createTempDir } = require('./helpers');

describe('validateGitSHA', () => {
  describe('accepts valid SHAs', () => {
    test('accepts full 40-char hex SHA', () => {
      const sha = '1234567890abcdef1234567890abcdef12345678';
      const result = validateGitSHA(sha);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(sha.toLowerCase());
    });

    test('accepts short 7-char hex SHA', () => {
      const sha = '1234567';
      const result = validateGitSHA(sha);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(sha.toLowerCase());
    });

    test('accepts 8-char hex SHA', () => {
      const sha = '12345678';
      const result = validateGitSHA(sha);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(sha.toLowerCase());
    });

    test('accepts 12-char hex SHA', () => {
      const sha = '123456789abc';
      const result = validateGitSHA(sha);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(sha.toLowerCase());
    });

    test('accepts mixed-case hex (normalizes to lowercase)', () => {
      const sha = 'AbCdEf1234567890';
      const result = validateGitSHA(sha);
      expect(result.ok).toBe(true);
      expect(result.value).toBe('abcdef1234567890');
    });

    test('accepts uppercase hex (normalizes to lowercase)', () => {
      const sha = 'ABCDEF1234567890';
      const result = validateGitSHA(sha);
      expect(result.ok).toBe(true);
      expect(result.value).toBe('abcdef1234567890');
    });

    test('accepts all numeric SHA', () => {
      const sha = '1234567890';
      const result = validateGitSHA(sha);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(sha.toLowerCase());
    });

    test('accepts all alphabetic SHA', () => {
      const sha = 'abcdefabcdef';
      const result = validateGitSHA(sha);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(sha.toLowerCase());
    });
  });

  describe('rejects invalid SHAs', () => {
    test('rejects non-hex characters (g)', () => {
      const result = validateGitSHA('123456g');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid git SHA format');
    });

    test('rejects non-hex characters (z)', () => {
      const result = validateGitSHA('abcdefz');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid git SHA format');
    });

    test('rejects special characters', () => {
      const result = validateGitSHA('123456-');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid git SHA format');
    });

    test('rejects whitespace', () => {
      const result = validateGitSHA('123456 789');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid git SHA format');
    });

    test('rejects too-short SHA (6 chars)', () => {
      const result = validateGitSHA('123456');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid git SHA format');
    });

    test('rejects too-long SHA (41 chars)', () => {
      const result = validateGitSHA('1234567890abcdef1234567890abcdef123456789');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid git SHA format');
    });

    test('rejects empty string', () => {
      const result = validateGitSHA('');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid git SHA format');
    });

    test('rejects non-string input (number)', () => {
      const result = validateGitSHA(123456789);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid git SHA format');
    });

    test('rejects non-string input (null)', () => {
      const result = validateGitSHA(null);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid git SHA format');
    });

    test('rejects non-string input (undefined)', () => {
      const result = validateGitSHA(undefined);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid git SHA format');
    });

    test('rejects non-string input (object)', () => {
      const result = validateGitSHA({ sha: '1234567' });
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid git SHA format');
    });
  });
});

describe('validateBranchName', () => {
  describe('accepts valid branch names', () => {
    test('accepts standard branch name (main)', () => {
      const result = validateBranchName('main');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('main');
    });

    test('accepts standard branch name (feature/add-login)', () => {
      const result = validateBranchName('feature/add-login');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('feature/add-login');
    });

    test('accepts branch name with hyphens (fix-123)', () => {
      const result = validateBranchName('fix-123');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('fix-123');
    });

    test('accepts branch name with underscores (test_branch)', () => {
      const result = validateBranchName('test_branch');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('test_branch');
    });

    test('accepts branch name with dots (release-v1.0.0)', () => {
      const result = validateBranchName('release-v1.0.0');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('release-v1.0.0');
    });

    test('accepts branch name with slashes (team/feature/name)', () => {
      const result = validateBranchName('team/feature/name');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('team/feature/name');
    });

    test('accepts branch name with numbers', () => {
      const result = validateBranchName('branch123');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('branch123');
    });

    test('accepts branch name starting with uppercase', () => {
      const result = validateBranchName('Feature-Branch');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('Feature-Branch');
    });

    test('accepts long branch name (under 255 chars)', () => {
      const longName = 'a'.repeat(200);
      const result = validateBranchName(longName);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(longName);
    });
  });

  describe('rejects invalid branch names', () => {
    test('rejects shell metacharacter (;)', () => {
      const result = validateBranchName('branch;rm -rf');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects shell metacharacter (|)', () => {
      const result = validateBranchName('branch|command');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects shell metacharacter (&)', () => {
      const result = validateBranchName('branch&command');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects shell metacharacter ($)', () => {
      const result = validateBranchName('branch$VAR');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects shell metacharacter (backtick)', () => {
      const result = validateBranchName('branch`cmd`');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects shell metacharacter (>)', () => {
      const result = validateBranchName('branch>file');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects shell metacharacter (<)', () => {
      const result = validateBranchName('branch<file');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects names starting with hyphen (looks like flag)', () => {
      const result = validateBranchName('-branch');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects names with double-dot (git traversal)', () => {
      const result = validateBranchName('feature..branch');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid sequence');
    });

    test('rejects names ending with .lock', () => {
      const result = validateBranchName('feature.lock');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('cannot end with');
    });

    test('rejects names with reflog syntax (@{)', () => {
      const result = validateBranchName('branch@{yesterday}');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects empty string', () => {
      const result = validateBranchName('');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects non-string input', () => {
      const result = validateBranchName(123);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects branch name exceeding 255 chars', () => {
      const tooLong = 'a'.repeat(256);
      const result = validateBranchName(tooLong);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('exceeds maximum length');
    });

    test('rejects whitespace', () => {
      const result = validateBranchName('branch name');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects parentheses', () => {
      const result = validateBranchName('branch(name)');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects square brackets', () => {
      const result = validateBranchName('branch[name]');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects asterisk (glob pattern)', () => {
      const result = validateBranchName('branch*');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects question mark (glob pattern)', () => {
      const result = validateBranchName('branch?');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
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
      const userPath = path.join(tempDir, 'config.json');
      const result = validateConfigPath(userPath, tempDir);
      expect(result.ok).toBe(true);
      expect(result.value).toContain(tempDir);
    });

    test('accepts nested path within base directory', () => {
      const path = require('path');
      const userPath = path.join(tempDir, 'sub', 'dir', 'config.json');
      const result = validateConfigPath(userPath, tempDir);
      expect(result.ok).toBe(true);
      expect(result.value).toContain(tempDir);
    });

    test('accepts absolute path within base directory', () => {
      const path = require('path');
      const userPath = path.join(tempDir, 'config.json');
      const result = validateConfigPath(userPath, tempDir);
      expect(result.ok).toBe(true);
      // Normalize both paths for comparison (Windows uses backslashes)
      const normalizedValue = result.value.replace(/\\/g, '/');
      const normalizedUserPath = userPath.replace(/\\/g, '/');
      expect(normalizedValue).toBe(normalizedUserPath);
    });
  });

  describe('rejects path traversal', () => {
    test('rejects path traversal (../../etc/passwd)', () => {
      const result = validateConfigPath('../../etc/passwd', tempDir);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });

    test('rejects path traversal (../../../root)', () => {
      const result = validateConfigPath('../../../root', tempDir);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });

    test('rejects URL-encoded traversal (%2e%2e)', () => {
      const result = validateConfigPath('%2e%2e/etc/passwd', tempDir);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });

    test('rejects double URL-encoded traversal', () => {
      const result = validateConfigPath('%252e%252e/etc/passwd', tempDir);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });

    test('rejects absolute path outside base directory', () => {
      const result = validateConfigPath('/etc/passwd', tempDir);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });

    test('rejects paths starting with base but then escaping', () => {
      const userPath = `${tempDir}/../../../etc/passwd`;
      const result = validateConfigPath(userPath, tempDir);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });
  });

  describe('handles platform-specific paths', () => {
    test('handles Windows backslash paths', () => {
      const path = require('path');
      const userPath = path.join(tempDir, 'sub', 'dir', 'config.json');
      const result = validateConfigPath(userPath, tempDir);
      expect(result.ok).toBe(true);
      expect(result.value).toContain(tempDir);
    });

    test('handles mixed slashes', () => {
      const path = require('path');
      const userPath = path.join(tempDir, 'sub', 'dir', 'config.json');
      const result = validateConfigPath(userPath, tempDir);
      expect(result.ok).toBe(true);
      expect(result.value).toContain(tempDir);
    });

    test('rejects Windows-style traversal (..\\..\\etc)', () => {
      const result = validateConfigPath('..\\..\\etc\\passwd', tempDir);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });
  });

  describe('rejects invalid input', () => {
    test('rejects non-string input', () => {
      const result = validateConfigPath(123, tempDir);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });

    test('rejects null input', () => {
      const result = validateConfigPath(null, tempDir);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });

    test('rejects undefined input', () => {
      const result = validateConfigPath(undefined, tempDir);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });
  });
});

describe('validateTagName', () => {
  describe('accepts valid tag names', () => {
    test('accepts simple version tag (v1.0.0)', () => {
      const result = validateTagName('v1.0.0');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('v1.0.0');
    });

    test('accepts tag with path-like structure (release/1.0)', () => {
      const result = validateTagName('release/1.0');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('release/1.0');
    });

    test('accepts tag with hyphens (my-tag)', () => {
      const result = validateTagName('my-tag');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('my-tag');
    });

    test('accepts mixed-case tag (MyTag)', () => {
      const result = validateTagName('MyTag');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('MyTag');
    });

    test('accepts tag with dots (tag.with.dots)', () => {
      const result = validateTagName('tag.with.dots');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('tag.with.dots');
    });

    test('accepts tag with underscore (tag_underscore)', () => {
      const result = validateTagName('tag_underscore');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('tag_underscore');
    });

    test('accepts long tag name under 255 chars', () => {
      const longTag = 'v' + '1'.repeat(200);
      const result = validateTagName(longTag);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(longTag);
    });

    test('preserves case (no lowercase normalization)', () => {
      const result = validateTagName('UPPERCASE-TAG');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('UPPERCASE-TAG');
    });
  });

  describe('rejects invalid tag names', () => {
    test('rejects empty string', () => {
      const result = validateTagName('');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects non-string input (number)', () => {
      const result = validateTagName(123);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects non-string input (null)', () => {
      const result = validateTagName(null);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects names starting with hyphen', () => {
      const result = validateTagName('-tag');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects names starting with dot', () => {
      const result = validateTagName('.tag');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects names containing double-dot (git traversal)', () => {
      const result = validateTagName('tag..name');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid sequence');
    });

    test('rejects names ending with .lock', () => {
      const result = validateTagName('v1.0.0.lock');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('cannot end with');
    });

    test('rejects names containing @{', () => {
      const result = validateTagName('tag@{yesterday}');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects shell metacharacter (;)', () => {
      const result = validateTagName('v1;rm -rf');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects shell metacharacter (|)', () => {
      const result = validateTagName('v1|cmd');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects shell metacharacter (&)', () => {
      const result = validateTagName('v1&cmd');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects shell metacharacter ($)', () => {
      const result = validateTagName('v1$VAR');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects shell metacharacter (backtick)', () => {
      const result = validateTagName('v1`cmd`');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects tag name exceeding 255 chars', () => {
      const tooLong = 'v' + '1'.repeat(255);
      const result = validateTagName(tooLong);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('exceeds maximum length');
    });

    test('rejects spaces in tag name', () => {
      const result = validateTagName('v1 0 0');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects tilde (git ancestor syntax)', () => {
      const result = validateTagName('v1~1');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects caret (git parent syntax)', () => {
      const result = validateTagName('v1^2');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects colon (git range separator)', () => {
      const result = validateTagName('v1:v2');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects question mark (glob pattern)', () => {
      const result = validateTagName('v1?0');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects asterisk (glob pattern)', () => {
      const result = validateTagName('v1*');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('rejects backslash', () => {
      const result = validateTagName('v1\\v2');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('invalid characters');
    });
  });
});

describe('validateRemoteURL', () => {
  describe('accepts valid remote URLs', () => {
    test('accepts https:// GitHub URL with .git suffix', () => {
      const result = validateRemoteURL('https://github.com/user/repo.git');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('https://github.com/user/repo.git');
    });

    test('accepts https:// GitLab URL without .git suffix', () => {
      const result = validateRemoteURL('https://gitlab.com/user/repo');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('https://gitlab.com/user/repo');
    });

    test('accepts ssh:// URI form', () => {
      const result = validateRemoteURL('ssh://git@github.com/user/repo.git');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('ssh://git@github.com/user/repo.git');
    });

    test('accepts git@host:path scp-like SSH syntax (GitHub)', () => {
      const result = validateRemoteURL('git@github.com:user/repo.git');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('git@github.com:user/repo.git');
    });

    test('accepts git@host:path scp-like SSH syntax (GitLab)', () => {
      const result = validateRemoteURL('git@gitlab.com:user/repo.git');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('git@gitlab.com:user/repo.git');
    });

    test('accepts git@host:path with nested group path', () => {
      const result = validateRemoteURL('git@gitlab.com:group/subgroup/repo.git');
      expect(result.ok).toBe(true);
      expect(result.value).toBe('git@gitlab.com:group/subgroup/repo.git');
    });

    test('preserves URL case (no normalization)', () => {
      const url = 'https://GitHub.com/User/Repo.git';
      const result = validateRemoteURL(url);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(url);
    });
  });

  describe('rejects disallowed protocols', () => {
    test('rejects git:// protocol (disabled by GitHub 2022, no encryption)', () => {
      const result = validateRemoteURL('git://github.com/user/repo.git');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('disallowed protocol');
    });

    test('rejects file:// protocol (SSRF/LFI vector)', () => {
      const result = validateRemoteURL('file:///etc/passwd');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('disallowed protocol');
    });

    test('rejects http:// protocol (no TLS)', () => {
      const result = validateRemoteURL('http://github.com/user/repo.git');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('disallowed protocol');
    });

    test('rejects ftp:// protocol', () => {
      const result = validateRemoteURL('ftp://example.com/repo');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('disallowed protocol');
    });

    test('rejects javascript: protocol', () => {
      const result = validateRemoteURL('javascript:alert(1)');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('disallowed protocol');
    });
  });

  describe('rejects invalid input', () => {
    test('rejects empty string', () => {
      const result = validateRemoteURL('');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('disallowed protocol');
    });

    test('rejects non-string input (null)', () => {
      const result = validateRemoteURL(null);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('disallowed protocol');
    });

    test('rejects non-string input (number)', () => {
      const result = validateRemoteURL(42);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('disallowed protocol');
    });

    test('rejects random text without protocol', () => {
      const result = validateRemoteURL('not-a-url');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('disallowed protocol');
    });
  });
});
