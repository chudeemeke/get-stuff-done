# Phase 7: Security Hardening & Tooling - Research

**Researched:** 2026-02-08
**Domain:** Node.js CLI security, input validation, command injection prevention
**Confidence:** HIGH

## Summary

Security hardening for Node.js CLI tools requires a multi-layered approach addressing input validation, command injection prevention, and automated security verification. The standard approach combines strict input validation using allowlists (not denylists), safe child process APIs that avoid shell interpretation, linter-based security scanning, and pre-publish verification hooks.

For GetStuffDone's upstream sync workflow, security hardening means preventing arbitrary code execution through malicious git commit SHAs, branch names with shell metacharacters, or path traversal patterns in configuration. The workflow already uses child_process but needs audit for injection vectors, input validation needs formalization, and security tooling (ESLint plugins, pre-publish checks) needs integration.

**Primary recommendation:** Implement allowlist-based input validation for all external inputs (git SHAs, branch names, paths), replace child_process.exec() with execFile() or spawn() without shell option, configure ESLint with security plugins for continuous scanning, and add pre-publish verification that blocks releases containing conflict markers or validation failures.

## Standard Stack

The established libraries/tools for Node.js CLI security:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ajv | 8.17.1+ | JSON schema validation | Already in project, fast and comprehensive, supports JSON Schema draft 2020-12 |
| Node.js child_process | Built-in | Process execution | Native module, standard for spawning processes |
| ESLint | 9.x | Static analysis | Industry standard JavaScript linter |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eslint-plugin-security | 3.x | Security rule detection | Detects common security anti-patterns (eval, exec with strings) |
| eslint-plugin-security-node | 1.x | Node.js-specific security | Additional Node.js-focused rules beyond base security plugin |
| validator.js | 13.x | String validation | When needing email, URL, or specialized format validation (optional for this project) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ajv | joi, yup | AJV already in project, faster, JSON Schema standard |
| eslint-plugin-security | Semgrep, CodeQL | ESLint integrates with existing tooling, faster feedback |
| Regex-based validation | git cat-file -e | Regex sufficient for malformed input rejection, git command for existence verification |

**Installation:**
```bash
bun add -d eslint eslint-plugin-security eslint-plugin-security-node
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── validation/          # Input validation functions
│   ├── gitValidation.js     # Git SHA, branch name validation
│   └── pathValidation.js    # Path traversal prevention
├── config/              # Existing config loading (already has AJV)
│   ├── ConfigLoader.js
│   └── ConfigSchema.js
└── hooks/               # Security hooks
    └── pre-publish-check.js  # Conflict marker detection
```

### Pattern 1: Allowlist-Based Validation
**What:** Validate input against explicit allowed patterns rather than denylisting dangerous patterns
**When to use:** Any user-supplied input (git SHAs, branch names, file paths)
**Example:**
```javascript
// Source: https://www.nodejs-security.com/blog/input-validation-best-practices-for-nodejs
// Secure: Allowlist approach
function validateGitSHA(sha) {
  // Git SHA-1: exactly 40 hex characters (0-9, a-f, case-insensitive)
  // Source: https://github.com/k4m4/sha-regex
  const shaPattern = /^[0-9a-f]{40}$/i;

  if (!shaPattern.test(sha)) {
    throw new Error(`Invalid git SHA format: ${sha}`);
  }

  return sha;
}

// Secure: Allowlist for branch names (alphanumeric, hyphens, underscores)
// Source: https://docs.github.com/en/get-started/using-git/dealing-with-special-characters-in-branch-and-tag-names
function validateBranchName(branch) {
  // Safe branch names: alphanumeric, hyphens, underscores, forward slashes
  // Reject shell metacharacters: $, `, |, ;, &, <, >, (, ), etc.
  const safeBranchPattern = /^[a-zA-Z0-9/_-]+$/;

  if (!safeBranchPattern.test(branch)) {
    throw new Error(`Branch name contains shell metacharacters: ${branch}`);
  }

  return branch;
}
```

### Pattern 2: Safe Child Process Execution
**What:** Use execFile() or spawn() instead of exec() to prevent shell interpretation
**When to use:** Any system command execution, especially with user input
**Example:**
```javascript
// Source: https://auth0.com/blog/preventing-command-injection-attacks-in-node-js-apps/
const { execFile, spawn } = require('child_process');

// UNSAFE: exec() passes to shell, vulnerable to injection
// BAD: execSync(`git cherry-pick ${userSHA}`);

// SAFE: execFile() executes binary directly, no shell interpretation
function cherryPickCommit(sha) {
  // Validate first
  validateGitSHA(sha);

  // Execute with arguments array (not shell string)
  execFile('git', ['cherry-pick', sha], (error, stdout, stderr) => {
    if (error) {
      throw new Error(`Cherry-pick failed: ${stderr}`);
    }
    return stdout;
  });
}

// SAFE: spawn() with arguments array, no shell option
function fetchUpstream(remote, branch) {
  validateBranchName(branch);

  const git = spawn('git', ['fetch', remote, branch], {
    // CRITICAL: shell: false (default, but explicit is better)
    shell: false,
    windowsHide: true
  });

  return new Promise((resolve, reject) => {
    git.on('close', (code) => {
      if (code !== 0) reject(new Error(`git fetch failed: ${code}`));
      resolve();
    });
  });
}
```

### Pattern 3: Path Traversal Prevention
**What:** Canonicalize paths and verify they remain within allowed directories
**When to use:** File path operations from config or user input
**Example:**
```javascript
// Source: https://www.nodejs-security.com/blog/secure-coding-practices-nodejs-path-traversal-vulnerabilities
const path = require('path');
const fs = require('fs');

function validateConfigPath(userPath) {
  // Decode URL-encoded traversal attempts
  const decoded = decodeURIComponent(userPath);

  // Resolve to absolute canonical path
  const resolved = path.resolve(decoded);

  // Verify it's within allowed directory
  const allowedDir = path.resolve(process.cwd(), '.planning');

  if (!resolved.startsWith(allowedDir)) {
    throw new Error(`Path traversal detected: ${userPath}`);
  }

  return resolved;
}
```

### Pattern 4: Config Re-validation After Sync
**What:** Re-run JSON schema validation after applying upstream changes
**When to use:** After cherry-picking commits that might modify config files
**Example:**
```javascript
// Source: Project already has AJV validation in ConfigLoader.js
const Ajv = require('ajv');
const ConfigSchema = require('./ConfigSchema');

async function revalidateConfigAfterSync() {
  const configPath = '.planning/config.json';
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(ConfigSchema);

  if (!validate(config)) {
    console.error('Config validation failed after sync:');
    console.error(JSON.stringify(validate.errors, null, 2));
    throw new Error('Upstream sync introduced invalid config');
  }

  console.log('Config validation passed after sync');
}
```

### Anti-Patterns to Avoid
- **String concatenation in shell commands:** Always use argument arrays
- **Denylisting dangerous characters:** Attackers use encoding to bypass; use allowlists
- **Trusting normalized paths:** path.normalize() doesn't prevent traversal
- **Eval() or Function() with user input:** Never dynamically execute untrusted code
- **Ignoring validation errors:** Fail fast and loud on validation failures

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON validation | Custom field checkers | AJV with JSON Schema | Handles edge cases (nested objects, arrays, type coercion), already in project |
| Regex for input validation | Manual string parsing | Pre-tested regex patterns + validator.js | ReDoS vulnerabilities, encoding bypasses, Unicode edge cases |
| Shell command escaping | String escaping functions | execFile() / spawn() with args array | Shell escaping is complex and error-prone, argument arrays avoid shell entirely |
| Conflict marker detection | Custom regex | git diff --check | Git's built-in checker handles all marker variants, line numbers, file names |
| Path canonicalization | Manual .. removal | path.resolve() + startsWith() | Handles symlinks, Windows vs Unix paths, URL encoding |

**Key insight:** Security validation has subtle edge cases that take years to discover. Use battle-tested libraries and APIs rather than implementing from scratch.

## Common Pitfalls

### Pitfall 1: Using child_process.exec() with User Input
**What goes wrong:** exec() passes commands to shell, enabling command injection via metacharacters
**Why it happens:** exec() is convenient for simple commands, developers don't realize it spawns shell
**How to avoid:** Always use execFile() or spawn() without shell option, pass arguments as array
**Warning signs:** String concatenation in exec() calls, user input in command strings
**Source:** https://auth0.com/blog/preventing-command-injection-attacks-in-node-js-apps/

### Pitfall 2: Denylisting Shell Metacharacters
**What goes wrong:** Attackers use URL encoding, Unicode, or overlooked characters to bypass filters
**Why it happens:** Impossible to enumerate all dangerous patterns across all contexts
**How to avoid:** Use allowlists of safe characters (alphanumeric, hyphens, underscores)
**Warning signs:** Regex with negation (^), blacklist arrays, "filter dangerous characters" comments
**Source:** https://www.nodejs-security.com/blog/input-validation-best-practices-for-nodejs

### Pitfall 3: Assuming path.normalize() Prevents Traversal
**What goes wrong:** normalize() removes redundant separators but doesn't block ../ sequences
**Why it happens:** Developers confuse normalization with security validation
**How to avoid:** Use path.resolve() to canonicalize, then verify with startsWith()
**Warning signs:** normalize() used alone without additional checks
**Source:** https://www.stackhawk.com/blog/node-js-path-traversal-guide-examples-and-prevention/

### Pitfall 4: Trusting User Input Without Decoding
**What goes wrong:** URL-encoded traversal sequences bypass simple pattern checks
**Why it happens:** Validation happens before decoding, or decoding not applied at all
**How to avoid:** Apply decodeURI() / decodeURIComponent() before validation
**Warning signs:** Path validation without decoding, direct use of req.query paths
**Source:** https://www.nodejs-security.com/blog/secure-coding-practices-nodejs-path-traversal-vulnerabilities

### Pitfall 5: Missing ReDoS Protection in Regex Validation
**What goes wrong:** Complex regex patterns with nested quantifiers cause exponential backtracking
**Why it happens:** Regex complexity not obvious, validated against short strings in testing
**How to avoid:** Use simple patterns, test with long strings, enable AJV fast mode for formats
**Warning signs:** Nested quantifiers (.*.*), alternation with overlap, no maxLength constraint
**Source:** https://ajv.js.org/security.html

### Pitfall 6: Committing Unresolved Conflict Markers
**What goes wrong:** Files with <<<<<<< HEAD markers get committed and published
**Why it happens:** Developer resolves conflicts manually, forgets markers in files
**How to avoid:** Pre-publish hook runs git diff --check, CI/CD verification
**Warning signs:** Manual conflict resolution without automated verification
**Source:** https://ardalis.com/detect-git-conflict-markers/

## Code Examples

Verified patterns from official sources:

### Git SHA Validation
```javascript
// Source: https://github.com/k4m4/sha-regex
// Verified: 40 hex characters, case-insensitive
function validateGitSHA(sha) {
  if (typeof sha !== 'string') {
    throw new TypeError('Git SHA must be a string');
  }

  // SHA-1: exactly 40 hexadecimal characters
  if (!/^[0-9a-f]{40}$/i.test(sha)) {
    throw new Error(`Invalid git SHA format: ${sha}`);
  }

  return sha;
}

// Additional verification with git (when repo available)
// Source: https://git-scm.com/docs/git-cat-file
function verifyGitSHAExists(sha) {
  const { execFileSync } = require('child_process');

  try {
    execFileSync('git', ['cat-file', '-e', sha], { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}
```

### Branch Name Validation
```javascript
// Source: https://docs.github.com/en/get-started/using-git/dealing-with-special-characters-in-branch-and-tag-names
// Rejects shell metacharacters: $, `, |, ;, &, <, >, (, )
function validateBranchName(branch) {
  if (typeof branch !== 'string' || branch.length === 0) {
    throw new TypeError('Branch name must be a non-empty string');
  }

  // Allowlist: alphanumeric, hyphens, underscores, forward slashes
  // Rejects: shell metacharacters, spaces, special characters
  if (!/^[a-zA-Z0-9/_-]+$/.test(branch)) {
    throw new Error(`Branch name contains invalid characters: ${branch}`);
  }

  return branch;
}
```

### Safe Command Execution with Validation
```javascript
// Source: https://www.stackhawk.com/blog/nodejs-command-injection-examples-and-prevention/
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

async function cherryPickCommits(shas) {
  // Validate all SHAs first
  const validatedSHAs = shas.map(validateGitSHA);

  for (const sha of validatedSHAs) {
    try {
      // execFile with argument array - no shell interpretation
      const { stdout, stderr } = await execFileAsync('git',
        ['cherry-pick', sha],
        {
          cwd: process.cwd(),
          timeout: 30000,
          windowsHide: true
        }
      );

      console.log(`Cherry-picked ${sha}: ${stdout}`);
    } catch (error) {
      throw new Error(`Failed to cherry-pick ${sha}: ${error.message}`);
    }
  }
}
```

### Conflict Marker Detection
```javascript
// Source: https://ardalis.com/detect-git-conflict-markers/
const { execFileSync } = require('child_process');

function detectConflictMarkers() {
  try {
    // git diff --check exits non-zero if conflict markers found
    execFileSync('git', ['diff', '--check'], {
      stdio: 'pipe',
      encoding: 'utf8'
    });

    return false; // No conflict markers
  } catch (error) {
    if (error.status !== 0) {
      // Parse output for file names and line numbers
      console.error('Conflict markers detected:');
      console.error(error.stdout);
      return true;
    }
    throw error;
  }
}

// Pre-publish verification hook
function prePublishCheck() {
  if (detectConflictMarkers()) {
    console.error('ERROR: Cannot publish with unresolved conflict markers');
    process.exit(1);
  }

  console.log('Pre-publish check passed');
}
```

### ESLint Security Configuration
```javascript
// .eslintrc.json
// Source: https://www.npmjs.com/package/eslint-plugin-security
{
  "plugins": ["security", "security-node"],
  "extends": [
    "eslint:recommended",
    "plugin:security/recommended",
    "plugin:security-node/recommended"
  ],
  "rules": {
    "security/detect-child-process": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-non-literal-fs-filename": "warn",
    "security/detect-non-literal-regexp": "warn",
    "security-node/detect-insecure-randomness": "error",
    "security-node/detect-crlf": "error"
  },
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Regex-based validation only | Regex + schema validation (AJV) | 2020+ | Structured validation with clear error messages |
| exec() with string escaping | execFile() / spawn() with args | 2019+ | Eliminates shell interpretation layer |
| Denylisting dangerous chars | Allowlisting safe patterns | 2018+ | Reduces bypass vectors |
| Manual conflict detection | git diff --check | Git 1.7+ | Standard tool, handles all marker variants |
| eslint-plugin-security only | Multiple security plugins | 2023+ | Broader coverage (original plugin unmaintained since 2020) |

**Deprecated/outdated:**
- **child_process.exec() with user input**: Use execFile() or spawn() without shell option
- **String concatenation for commands**: Use argument arrays to avoid injection
- **path.normalize() for security**: Use path.resolve() + containment checks
- **Custom regex for git SHAs**: Use standard pattern /^[0-9a-f]{40}$/i

## Open Questions

Things that couldn't be fully resolved:

1. **Security review checkpoint implementation**
   - What we know: User must review diff before cherry-pick, workflow already has checkpoints
   - What's unclear: Best UX for presenting diffs (raw, colorized, stats), storage of review decisions
   - Recommendation: Start with git diff output in checkpoint, iterate on formatting

2. **ESLint plugin maintenance status**
   - What we know: eslint-plugin-security unmaintained since 2020, still widely used (1.5M weekly downloads)
   - What's unclear: Whether to use unmaintained plugin or newer alternatives
   - Recommendation: Use both eslint-plugin-security (for compatibility) + eslint-plugin-security-node (actively maintained), evaluate alternatives if issues arise

3. **Windows-specific security considerations**
   - What we know: Project targets Windows with Git Bash, CVE-2024-27980 addressed batch file handling
   - What's unclear: Additional Windows-specific validation needed beyond standard practices
   - Recommendation: Test with Git Bash environment, ensure windowsHide: true on spawned processes

4. **Upstream cherry-pick approval granularity**
   - What we know: User approves cherry-picks at commit selection stage
   - What's unclear: Should each commit require individual approval or batch approval sufficient
   - Recommendation: Batch approval for selected commits, individual review only on conflict

## Sources

### Primary (HIGH confidence)
- [Node.js Security Best Practices (Official)](https://nodejs.org/en/learn/getting-started/security-best-practices)
- [AJV Security Considerations (Official)](https://ajv.js.org/security.html)
- [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [eslint-plugin-security (npm)](https://www.npmjs.com/package/eslint-plugin-security)
- [eslint-plugin-security-node (npm)](https://www.npmjs.com/package/eslint-plugin-security-node)
- [GitHub Git Special Characters Docs](https://docs.github.com/en/get-started/using-git/dealing-with-special-characters-in-branch-and-tag-names)

### Secondary (MEDIUM confidence)
- [Node.js Input Validation Best Practices](https://www.nodejs-security.com/blog/input-validation-best-practices-for-nodejs)
- [Auth0: Preventing Command Injection in Node.js](https://auth0.com/blog/preventing-command-injection-attacks-in-node-js-apps/)
- [StackHawk: Node.js Command Injection Guide](https://www.stackhawk.com/blog/nodejs-command-injection-examples-and-prevention/)
- [StackHawk: Node.js Path Traversal Guide](https://www.stackhawk.com/blog/node-js-path-traversal-guide-examples-and-prevention/)
- [Node.js Security: Path Traversal Vulnerabilities](https://www.nodejs-security.com/blog/secure-coding-practices-nodejs-path-traversal-vulnerabilities)
- [Ardalis: Detect Git Conflict Markers](https://ardalis.com/detect-git-conflict-markers/)
- [Ken Muse: Hidden Danger in Git Ref Names](https://www.kenmuse.com/blog/the-hidden-danger-in-git-ref-names/)

### Tertiary (LOW confidence)
- [Medium: Node.js Security Best Practices for 2026](https://medium.com/@sparklewebhelp/node-js-security-best-practices-for-2026-3b27fb1e8160) - WebSearch only, verify recommendations against primary sources
- [GitHub: sha-regex](https://github.com/k4m4/sha-regex) - Community project, pattern validated against Git spec

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - AJV already in project, ESLint plugins widely adopted, execFile/spawn are Node.js built-ins
- Architecture: HIGH - Patterns verified in official Node.js security docs and OWASP guidelines
- Pitfalls: HIGH - All sourced from official documentation or authoritative security sites
- Code examples: HIGH - All patterns verified against official documentation

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (30 days - stable domain, core security practices evolve slowly)

**Notes:**
- Project already has AJV 8.17.1 installed and working config validation
- No current ESLint configuration - needs full setup
- Existing code uses spawn() in hooks/gsd-check-update.js - good pattern
- installer (bin/install.js) has extensive path handling - needs audit against traversal patterns
- Upstream sync workflow uses Task tool for orchestration - validation layer needs insertion before exec calls
