# Phase 14: Security Wiring [GAP CLOSURE] - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire orphaned validation module (`src/validation/index.js`) into production code (`gsd-tools.js`), add config re-validation via prepublishOnly + standalone script, and fix AskUserQuestion tool declarations in command files. Closes GAP-2 and GAP-3 from the v0.2.0 milestone audit.

**Upstream relationship:** Hard fork confirmed (Option C). No upstream sync constraint -- modify gsd-tools.js freely. No need to consider merge compatibility.

</domain>

<decisions>
## Implementation Decisions

### 1. Validation Module API (Result Type Pattern)

| Decision | Choice |
|----------|--------|
| Return pattern | Result type: `{ok: true, value}` or `{ok: false, error}` -- NOT exceptions |
| Rationale | Modern pattern (Rust Result, Go error returns). No try/catch proliferation. Explicit error handling. More performant (no exception stack traces for expected failures). |
| Sanitization | Validate + sanitize in one step. `result.value` contains the cleaned input (trimmed whitespace, lowercased SHAs, normalized paths). Follows Robustness Principle. |
| Boolean check | `result.ok` IS the boolean -- no separate `isValidX()` helper needed |
| Breaking change | Existing tests from Phase 11 that test `expect().toThrow()` must be rewritten to check `result.ok` instead |

### 2. Validation Scope

| Decision | Choice |
|----------|--------|
| Coverage | ALL git operations in gsd-tools.js, not just user-facing entry points |
| Existing functions | Refactor `validateGitSHA()`, `validateBranchName()`, `validateConfigPath()` to Result type |
| New functions | Add `validateTagName()` and `validateRemoteURL()` with Result type |
| Config path | Wire `validateConfigPath()` into config loading too, not just upstream sync paths |
| Inline regex | Replace ALL inline SHA/branch regex in gsd-tools.js with validation module calls. Single source of truth. |

### 3. Remote URL Protocol Allowlist

| Decision | Choice |
|----------|--------|
| Allowed | `https://`, `ssh://`, `git@host:path` (scp-like SSH syntax) |
| Rejected | `git://` (disabled by GitHub 2022, no encryption), `file://` (SSRF/LFI vector per OWASP), `http://` (no TLS) |
| Rationale | Matches GitHub enforcement, OWASP SSRF Prevention Cheat Sheet, GitLab hardening guidelines, isomorphic-git implementation |
| SCP syntax | Must handle both `git@github.com:user/repo.git` (scp-like) and `ssh://git@github.com/user/repo.git` (standard URI) |

### 4. Validation Failure Behavior

| Decision | Choice |
|----------|--------|
| Failure mode | Hard error + stop (process.exit(1)) |
| Error format | Use existing `error()` function pattern in gsd-tools.js (writes `Error: message` to stderr) |
| Recovery hints | Include recovery guidance for mid-operation failures |
| Call site pattern | `requireValid()` wrapper in gsd-tools.js bridges Result type to error()/exit |
| Non-standard paths | Direct Result usage for batch processing or warn-and-continue contexts |

**requireValid() pattern:**
```javascript
function requireValid(result) {
  if (!result.ok) {
    error(result.error);
    process.exit(1);
  }
  return result.value;
}

// Usage:
const sha = requireValid(validateGitSHA(userInput));
```

**Where requireValid() lives:** gsd-tools.js (application layer). NOT in the validation module. Validation module stays pure -- no knowledge of error() or process.exit(). Dependency direction: application imports domain, not reverse.

### 5. Config Re-validation (Layered Defense)

| Decision | Choice |
|----------|--------|
| Trigger | prepublishOnly (safety net) + standalone script (shift-left, on-demand) |
| prepublishOnly | Extend existing script -- add config validation step. Blocks on ANY validation error. |
| Standalone script | `bin/validate-configs.js` -- NOT a bin entry, internal-only (in files array) |
| Escape hatch | `SKIP_CONFIG_VALIDATION=1` env var with stderr warning. No package.json script for bypass. |
| Exit behavior | Verbose + exit codes. Summary line always printed. Errors to stderr. Exit 0/1 for scripting. Supports `--quiet`. |
| Reporting | Both per-file AND aggregate results |

**Escape hatch rationale:** npm's `--ignore-scripts` does NOT work with `npm publish` (npm/cli #2755). Without escape hatch, a validation bug blocks all publishing with no recovery path except editing package.json.

### 6. Config Validation Scope

| Decision | Choice |
|----------|--------|
| Files covered | `.planning/config.json`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/PROJECT.md`, `package.json` |
| JSON validation | Structure + schema compliance |
| Markdown validation | Structure + content (required sections, correct heading hierarchy) |
| package.json | npm spec compliance + verify files listed in `files` array actually exist on disk |
| Conflict markers | Include conflict marker check in validation (currently only in prepublishOnly for all tracked files) |
| Extensibility | Code-based validator registry (module exports). New validators added by exporting from the registry module. |

### 7. Config Schema Location

| Decision | Choice |
|----------|--------|
| Location | `src/config/schema.js` |
| Rationale | SRP: schema defines "valid config structure" (config module's responsibility). Validation module owns security input format validation (SHAs, branches, paths). Different concerns. High cohesion with ConfigLoader.js. Avoids coupling generic validation module to config internals. |
| Pattern | `validate-configs.js` imports schema from `src/config/schema.js` and security validators from `src/validation/index.js` -- each module contributes its own concern |

### 8. Testing Approach

| Decision | Choice |
|----------|--------|
| Strategy | Both unit tests AND integration tests (testing pyramid) |
| Unit tests | `src/validation/` -- exhaustive edge cases, boundary values, injection attempts. Fast, isolated. |
| Integration tests | gsd-tools.js -- verify validation functions are actually called (prevents another orphaned-module situation) |
| Rationale | Phase 14 exists because Phase 7 built validation with no integration tests. Both layers prevent recurrence. |

### 9. AskUserQuestion in Command Files (SC3)

| Decision | Choice |
|----------|--------|
| Approach | Declaration + scoped correctness audit (NOT declaration-only) |
| Audit scope | For each of the ~13 files missing it: determine if command has user interaction points. Add only where appropriate. Do NOT add to read-only commands (e.g., `progress.md`). |
| Existing files | Spot-check the ~13 files that already declare AskUserQuestion to verify they reference it correctly |
| Depth | Identify issues only. Fixing command file bodies that need rework is a separate task if warranted. |

### 10. Claude's Discretion

- Exact regex patterns for tag name and remote URL validation
- Order of validation calls within gsd-tools.js functions
- Specific recovery hint wording for each validation error
- validate-configs.js internal structure and validator registration API
- Test file organization within the testing pyramid
- Which specific command files need vs don't need AskUserQuestion (determined by audit)

</decisions>

<specifics>
## Specific Ideas

- Result type pattern chosen specifically for TypeScript migration readiness (v0.3.0). In TS, this becomes a discriminated union with compile-time enforcement.
- requireValid() mirrors Rust's unwrap()/expect() -- standard industry pattern for "validate or die" paths
- Env var escape hatch (`SKIP_CONFIG_VALIDATION=1`) with stderr warning -- visible, auditable, intentional-only. NOT a package.json script.
- prepublishOnly is for builds + critical validation. Exploratory/tunable checks belong in CI. Config validation is critical (blocks publish on any error).
- validate-configs outputs: per-file pass/fail + aggregate summary. Supports scripting via exit codes.

</specifics>

<deferred>
## Deferred Ideas

### TypeScript Migration (v0.3.0)
Result type, validation module, config schema all designed for TypeScript readiness. Migration would add compile-time enforcement of Result checking, discriminated unions, and typed schema. First phase of v0.3.0.

### Codebase Modernization Audit (v0.3.0)
Full audit of all patterns in the codebase for modern alternatives. Will use parallel Explore agents covering core engine, source modules, hooks/launcher, and commands/workflows. Findings become v0.3.0 phases.

### Upstream Outreach (Separate)
Email drafts prepared at `.planning/upstream-outreach-drafts.md` for contributing improvements back to upstream (glittercowboy/get-shit-done). Option A (contribute specific improvements) and Option B (propose plugin architecture). Research showed: 16k+ stars, 163 commits in 27 days since fork, multi-runtime expansion, tight governance model. Expectations set low but worth attempting.

</deferred>

---

## Constraints & Risks

- **API breaking change:** Switching from exceptions to Result types changes the validation module's public API. All existing tests (Phase 11) that test throw behavior must be updated. Plan the migration carefully.
- **validate-configs is a new artifact:** Must be added to package.json files array, tested cross-platform, and known to check-parity.js.
- **prepublishOnly strictness:** Blocks on ANY config validation error. Mitigated by env var escape hatch. Test validation thoroughly before wiring into prepublishOnly.
- **New validation functions:** validateTagName() and validateRemoteURL() are net-new code, not just wiring. Need comprehensive test coverage including malicious input patterns.
- **gsd-tools.js size:** The file is large. Wiring validation into all git operations touches many functions. Integration tests must cover the critical paths.

---

*Phase: 14-security-wiring*
*Context gathered: 2026-02-19*
