# Technology Stack

**Project:** GetStuffDone (GSD Fork) v0.2.0
**Researched:** 2026-02-07
**Confidence:** HIGH

## Executive Summary

v0.2.0 focuses on hardening, cross-platform support, and leveraging Claude Code's 2026 capabilities. The existing stack (pure Node.js + stdlib) remains solid. Recommended additions: security linting (ESLint + plugins), cross-platform utilities (pathe, execa), and optional Claude Agent SDK integration for future extensibility. Opus 4.6's improved agentic capabilities and 1M context window provide immediate value without code changes.

## Current Stack (v0.1.0 - Validated)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Node.js | >=16.7.0 | Runtime environment | Keep |
| npm | Latest | Package manager | Migrate to bun |
| AJV | ^8.17.1 | JSON5 config validation | Keep |
| json5 | ^2.2.3 | Human-friendly config format | Keep |
| esbuild | ^0.24.0 | Hook bundling | Keep |
| sharp | ^0.34.5 | Logo rasterization (dev) | Keep |
| svgexport | ^0.4.2 | Logo export (dev) | Keep |

**Foundation philosophy:** Zero runtime dependencies beyond config validation. Pure Node.js stdlib for file operations, process spawning, path handling.

## Recommended Stack Additions for v0.2.0

### 1. Package Manager Migration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| bun | latest | Package manager + test runner | WoW standard, faster installs, native TypeScript support, compatible lockfile |

**Rationale:** Anthropic uses bun for Claude Code. Aligns with user's tooling preferences (see CLAUDE.md rules/tooling-preferences.md). No breaking changes for consumers (package.json remains compatible).

**Migration:**
```bash
bun install              # generates bun.lock
rm package-lock.json     # cleanup
```

### 2. Security Hardening

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ESLint | ^9.x | Code linting framework | Industry standard, extensible, WoW requirement |
| eslint-plugin-security | ^3.0.1 | Security pattern detection | Detects common Node.js security issues |
| npm audit / Snyk | Latest | Dependency vulnerability scanning | Multi-layer security (audit free, Snyk premium optional) |

**Rationale:**
- ESLint provides baseline code quality and security pattern detection
- eslint-plugin-security has 1.5M weekly downloads, covers 13 common Node.js security patterns
- Layer npm audit (free, built-in) with optional Snyk for comprehensive dependency scanning
- By 2026, 60%+ security incidents come from compromised dependencies (source: [Node.js Security Best Practices 2026](https://medium.com/@sparklewebhelp/node-js-security-best-practices-for-2026-3b27fb1e8160))

**Known limitation:** eslint-plugin-security is minimally maintained (last update 2 years ago, [DEV Community article](https://dev.to/ofri-peretz/eslint-plugin-security-is-unmaintained-heres-what-nobody-tells-you-96h)), but still valuable for static pattern detection. Complement with npm audit and manual review.

**Security focus areas for upstream sync:**
- Input validation (commit SHA validation, branch name sanitization)
- Command injection prevention (parameterized git commands)
- Path traversal protection (validate .upstream/ paths)
- Secrets detection (scan cherry-picked commits)

**Installation:**
```bash
bun add -d eslint eslint-plugin-security
```

**Config (.eslintrc.json):**
```json
{
  "extends": ["eslint:recommended"],
  "plugins": ["security"],
  "env": {
    "node": true,
    "es2021": true
  },
  "rules": {
    "security/detect-child-process": "warn",
    "security/detect-non-literal-fs-filename": "warn",
    "security/detect-eval-with-expression": "error",
    "security/detect-no-csrf-before-method-override": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-object-injection": "warn",
    "security/detect-possible-timing-attacks": "warn",
    "security/detect-pseudoRandomBytes": "error",
    "security/detect-unsafe-regex": "error"
  }
}
```

### 3. Cross-Platform Utilities

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| pathe | ^1.x | Cross-platform path handling | Normalizes paths to Unix format (/ not \\), modern ESM, zero deps |
| execa | ^9.x | Cross-platform command execution | Promise-based, handles Windows vs Unix command differences, better error reporting |

**Rationale:**
- **pathe** over upath: Modern ESM support, no Node.js dependency, works in all environments ([GitHub: unjs/pathe](https://github.com/unjs/pathe))
- **execa** over child_process: Automatic cross-platform compatibility, promise-based API, better error handling ([Better Stack Guide](https://betterstack.com/community/guides/scaling-nodejs/execa-cli/))
- Current code uses native `path` and `child_process` which work but require manual Windows/Unix handling

**Use cases:**
- Replace `path.join()` with `pathe.join()` for consistent path separators
- Replace `child_process.spawn()` with `execa()` for git commands
- Normalize paths in config file operations
- Ensure hooks work identically on macOS, Linux, Windows

**Installation:**
```bash
bun add pathe execa
```

**Example migration:**
```javascript
// Before (manual cross-platform handling)
const path = require('path');
const { spawn } = require('child_process');

const hookPath = path.join(configDir, 'hooks', 'statusline.js');
const gitProcess = spawn('git', ['cherry-pick', commitSha]);

// After (automatic cross-platform)
const { join } = require('pathe');
const { execa } = require('execa');

const hookPath = join(configDir, 'hooks', 'statusline.js'); // always uses /
const { stdout } = await execa('git', ['cherry-pick', commitSha]); // handles Windows/Unix
```

### 4. Testing Infrastructure (Stretch Goal)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| bun:test | Built-in | Unit test runner | Fast, native, no additional deps |
| GitHub Actions | N/A | CI matrix testing | Cross-platform validation (macOS, Linux, Windows) |

**Rationale:** GSD currently has no test infrastructure. For v0.2.0 cross-platform support, automated testing across OS platforms validates installers, hooks, and git operations work consistently.

**CI Matrix recommendation:**
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
    node-version: [16.x, 18.x, 20.x]
```

**Test priorities:**
1. Installer behavior (copy vs --link modes)
2. Path handling (Windows backslash vs Unix forward slash)
3. Git command execution (execa cross-platform)
4. Config file parsing (JSON5 on all platforms)
5. Hook activation (statusline display)

**Status:** Stretch goal. Manual cross-platform verification sufficient for v0.2.0 if CI setup exceeds time budget.

## Claude Code & Opus 4.6 Capabilities (2026)

### Claude Opus 4.6 Model Improvements

| Capability | Impact on GSD | Recommendation |
|------------|---------------|----------------|
| 1M token context window (beta) | Entire codebase + planning docs in context | Use immediately - no code changes needed |
| 65.4% on Terminal-Bench 2.0 | Best agentic coding performance | Leverage for complex multi-file refactors |
| 76% on MRCR v2 (1M needle) | Better retrieval from large contexts | Improves /gsd:analyze with full codebase |
| Effort parameter (low/med/high/max) | Control reasoning depth vs speed | Default to "high" for critical operations |
| Improved planning & long-term concentration | Better multi-stage workflow execution | Benefits /gsd:upstream 7-stage workflow |

**Source:** [Introducing Claude Opus 4.6](https://www.anthropic.com/news/claude-opus-4-6), [Claude Opus 4.6 Features Guide](https://www.digitalapplied.com/blog/claude-opus-4-6-release-features-benchmarks-guide)

**Immediate benefits (no code changes):**
- v0.1.0's 7-stage upstream workflow benefits from improved planning
- Large planning docs (.planning/ directory) fit entirely in 1M context
- Multi-file operations (statusline redesign, config system) execute more reliably

**Future optimization opportunities:**
- Add effort parameter hints to agent instructions ("Use max effort for security review")
- Structure prompts to leverage improved long-context retrieval

### Claude Code Platform Features (2026)

| Feature | Impact on GSD | Recommendation |
|---------|---------------|----------------|
| Claude Agent SDK | Build custom agents using Claude Code harness | Optional - for future extensibility |
| Model Context Protocol (MCP) | Connect to external tools/databases | Not needed - GSD is self-contained |
| Tool Search (46.9% context reduction) | Dynamic tool loading vs preloading | Automatic - no action needed |
| Code execution tool | Execute code in sandboxed environment | Not applicable - GSD operates on files |
| Files API | Upload/manage files programmatically | Not needed - uses filesystem directly |
| Compaction API (beta) | Server-side context summarization | Benefits long GSD sessions automatically |
| Programmatic Tool Calling | Claude orchestrates tools via code | No action - platform feature |

**Source:** [Claude Code Overview](https://code.claude.com/docs/en/overview), [Introducing Advanced Tool Use](https://www.anthropic.com/engineering/advanced-tool-use), [Claude Code MCP Integration](https://code.claude.com/docs/en/mcp)

**Key takeaway:** Claude Code's 2026 improvements benefit GSD automatically through platform upgrades. No code changes required.

**Optional future integration: Claude Agent SDK**

The [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) (formerly Claude Code SDK) provides:
- Built-in tools for file operations, command execution, code editing
- Agent loop and context management
- Available in TypeScript and Python
- Powers Claude Code's core functionality

**When to consider:**
- If GSD adds programmatic agent orchestration (beyond current command-based model)
- If building GSD-powered tools that run outside Claude Code CLI
- If creating custom MCP servers for GSD integrations

**Current recommendation:** Not needed for v0.2.0. GSD's command + agent model works well with current Claude Code architecture. Evaluate for v0.3.0 if building programmatic workflows.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Package Manager | bun | npm | WoW standard is bun; npm works but slower |
| Path handling | pathe | upath | pathe is modern ESM, no Node.js dep; upath is older |
| Command execution | execa | cross-spawn | execa is higher-level, promise-based, better DX |
| Security linting | ESLint + plugin | SonarQube | ESLint lighter, faster, sufficient for GSD's scope |
| Dependency scanning | npm audit + Snyk | Socket | npm audit built-in, Snyk has GitHub integration |
| Testing | bun:test | Jest / Mocha | bun:test native, fast, zero deps |
| Path separator | Forward slash (/) | Backslash (\\) | Unix-style works on all platforms, Windows supports it |

## Installation

```bash
# Core
bun install

# Security tooling
bun add -d eslint eslint-plugin-security

# Cross-platform utilities
bun add pathe execa

# Testing (stretch goal)
# No additional deps - uses bun:test built-in
```

## Scripts (Updated)

```json
{
  "scripts": {
    "install": "node bin/install.js",
    "build:hooks": "node scripts/build-hooks.js",
    "prepublishOnly": "bun run build:hooks",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "audit": "npm audit",
    "test": "bun test",
    "test:platforms": "bun test --filter platform"
  }
}
```

## What NOT to Add (Anti-Recommendations)

| Technology | Why Avoid |
|------------|-----------|
| TypeScript | GSD is simple Node.js; TS adds build complexity for marginal benefit |
| Bundler for runtime code | Pure Node.js code doesn't need bundling; esbuild sufficient for hooks |
| Heavy config libraries | AJV + JSON5 already provides robust validation; no need for joi/yup/zod |
| Complex testing frameworks | bun:test sufficient; Jest/Mocha overkill for GSD's scope |
| Docker | GSD runs natively in Claude Code CLI; containerization unnecessary |
| Express/Fastify | GSD is CLI-based, not server-based; no HTTP layer needed |
| Database | GSD uses filesystem (JSON config, git); no persistent storage needed |
| Logging libraries | console.log sufficient for CLI feedback; Winston/Pino overkill |
| Lodash/Ramda | Native JS methods sufficient; avoid utility library bloat |
| Husky | GSD creates hooks FOR Claude Code, not git hooks for itself |

**Philosophy:** Maintain GSD's zero-dependency runtime philosophy. Add only what's necessary for security, cross-platform support, and developer experience.

## Platform-Specific Considerations

### Windows (Current Platform)

**Current status:** Works on Windows with Git Bash
**v0.2.0 improvements:**
- pathe normalizes paths (no more manual Windows path handling)
- execa handles Windows command differences automatically
- Junction creation for --link flag already working (no admin required)

**Known Windows quirks to test:**
- Path separator consistency (\ vs /)
- Line endings (CRLF vs LF) in generated hooks
- Junction creation without admin privileges
- Git Bash vs PowerShell vs CMD compatibility

### macOS (New Target)

**Required verification:**
- Symlink creation (should work - POSIX-compliant)
- Config directory resolution (~/.claude vs XDG paths)
- Git command execution (should match Linux)
- NPM global installation path resolution

**Potential issues:**
- macOS Gatekeeper warnings (unsigned binary)
- Homebrew git vs Apple git differences
- File permissions (chmod +x on hooks)

### Linux (New Target)

**Required verification:**
- Distribution variations (Ubuntu, Fedora, Arch)
- Config directory resolution (XDG_CONFIG_HOME spec)
- Git command execution (standard POSIX)
- NPM global installation paths (distro-dependent)

**Potential issues:**
- SELinux/AppArmor restrictions
- Different shell environments (bash, zsh, fish)
- File permissions (chmod +x on hooks)

## Security Hardening Checklist

Based on [Node.js Security Best Practices](https://nodejs.org/en/learn/getting-started/security-best-practices) and [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html):

**Input Validation:**
- [ ] Validate git commit SHAs (hex format, 7-40 chars)
- [ ] Sanitize branch names (alphanumeric + - _ / only)
- [ ] Validate config file paths (prevent path traversal)
- [ ] Check upstream repository URL format

**Command Injection Prevention:**
- [ ] Use execa with argument arrays (not string concatenation)
- [ ] Never pass user input to eval()
- [ ] Validate all git command arguments
- [ ] Use parameterized git commands

**Filesystem Security:**
- [ ] Check file permissions before reading configs
- [ ] Validate .upstream/ paths before operations
- [ ] Prevent directory traversal in file operations
- [ ] Use pathe.normalize() to prevent path manipulation

**Dependency Security:**
- [ ] Run npm audit regularly
- [ ] Pin dependency versions (no ^ or ~ in production)
- [ ] Use lockfile linters (future enhancement)
- [ ] Monitor dependency vulnerabilities (Snyk optional)

**Code Review for Upstream Sync:**
- [ ] Manual inspection of cherry-picked commits
- [ ] ESLint security plugin scan
- [ ] Diff preview before applying
- [ ] Rollback capability for failed syncs

## Integration with Existing GSD Stack

**No breaking changes to v0.1.0 features:**
- Dynamic config system (AJV + JSON5) - unchanged
- Statusline rendering (ANSI escape codes) - unchanged
- Hook activation (fs operations) - unchanged
- Style Composer pattern - unchanged
- 7-stage upstream workflow - enhanced with security review

**Enhancement pattern:**
```javascript
// v0.1.0: Direct Node.js stdlib
const path = require('path');
const { spawn } = require('child_process');

// v0.2.0: Enhanced with cross-platform utilities
const { join } = require('pathe');        // Drop-in replacement
const { execa } = require('execa');       // Enhanced child_process

// Same logic, better cross-platform support
```

## Rollout Strategy

**Phase 1: Security Hardening**
1. Add ESLint + eslint-plugin-security
2. Run initial audit (npm audit)
3. Fix identified issues
4. Add security review step to /gsd:upstream workflow

**Phase 2: Cross-Platform Support**
1. Add pathe + execa
2. Replace path operations with pathe
3. Replace child_process with execa
4. Manual testing on macOS and Linux

**Phase 3: Testing Infrastructure (Stretch)**
1. Add bun:test tests for core operations
2. Set up GitHub Actions CI matrix
3. Automate cross-platform validation

**Phase 4: Package Manager Migration**
1. Run bun install
2. Generate bun.lock
3. Test all scripts with bun
4. Remove package-lock.json
5. Update documentation

## Migration Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| bun migration | Low | npm commands still work; bun.lock compatible |
| pathe adoption | Low | Drop-in replacement for path module |
| execa adoption | Medium | Behavior changes possible; test thoroughly |
| ESLint addition | Low | Dev-only; doesn't affect runtime |
| Cross-platform testing | Medium | Manual verification on all platforms required |

**Overall risk:** Low. Changes are additive (not destructive). Existing v0.1.0 functionality remains intact. Pure Node.js stdlib code still works if new utilities fail.

## Sources

### Claude Code & Opus 4.6
- [Claude Code Overview - Claude Code Docs](https://code.claude.com/docs/en/overview)
- [Introducing Claude Opus 4.6](https://www.anthropic.com/news/claude-opus-4-6)
- [What's new in Claude 4.6 - Claude API Docs](https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-6)
- [Claude Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Model Context Protocol - Claude Code Docs](https://code.claude.com/docs/en/mcp)
- [Building Agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)

### Security
- [Node.js Security Best Practices 2026](https://medium.com/@sparklewebhelp/node-js-security-best-practices-for-2026-3b27fb1e8160)
- [Node.js Security Best Practices - Official](https://nodejs.org/en/learn/getting-started/security-best-practices)
- [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [10 Best Practices for Secure Code Review](https://www.nodejs-security.com/blog/ten-best-practices-for-secure-code-review-of-nodejs-code)
- [eslint-plugin-security - npm](https://www.npmjs.com/package/eslint-plugin-security)
- [Comparing npm audit with Snyk](https://nearform.com/insights/comparing-npm-audit-with-snyk/)

### Cross-Platform Development
- [GitHub: awesome-cross-platform-nodejs](https://github.com/bcoe/awesome-cross-platform-nodejs)
- [GitHub: unjs/pathe](https://github.com/unjs/pathe)
- [A Practical Guide to Execa for Node.js](https://betterstack.com/community/guides/scaling-nodejs/execa-cli/)
- [Writing cross-platform Node.js](https://shapeshed.com/writing-cross-platform-node/)
- [GitHub: ehmicky/cross-platform-node-guide](https://github.com/ehmicky/cross-platform-node-guide)

### Git Automation
- [Git Cherry Pick - Atlassian Tutorial](https://www.atlassian.com/git/tutorials/cherry-pick)
- [How LinkedIn automates cherry-picking commits](https://www.linkedin.com/blog/engineering/developer-experience-productivity/how-linkedin-automates-cherry-picking-commits-to-improve-develop)

---

*Research completed: 2026-02-07*
*Confidence: HIGH - All recommendations verified with official sources and 2026 documentation*
