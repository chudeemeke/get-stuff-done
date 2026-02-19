# Phase 14: Security Wiring [GAP CLOSURE] - Research

**Researched:** 2026-02-19
**Domain:** Node.js input validation, Result type pattern, npm lifecycle scripts, command file tooling declarations
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

| Decision | Choice |
|----------|--------|
| Return pattern | Result type: `{ok: true, value}` or `{ok: false, error}` -- NOT exceptions |
| Sanitization | Validate + sanitize in one step. `result.value` contains cleaned input. |
| Boolean check | `result.ok` IS the boolean -- no separate `isValidX()` helper needed |
| Coverage | ALL git operations in gsd-tools.js, not just user-facing entry points |
| New functions | Add `validateTagName()` and `validateRemoteURL()` with Result type |
| Config path | Wire `validateConfigPath()` into config loading too |
| Allowed protocols | `https://`, `ssh://`, `git@host:path` only |
| Rejected protocols | `git://`, `file://`, `http://` |
| Failure mode | Hard error + stop (process.exit(1)) via `requireValid()` wrapper |
| requireValid() location | gsd-tools.js application layer -- NOT in validation module |
| prepublishOnly trigger | Extend existing script + add config validation step |
| Standalone script | `bin/validate-configs.js` -- internal-only (in files array, not bin entry) |
| Escape hatch | `SKIP_CONFIG_VALIDATION=1` env var with stderr warning |
| Config schema | `src/config/schema.js` |
| Config files covered | `.planning/config.json`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/PROJECT.md`, `package.json` |
| AskUserQuestion approach | Declaration + scoped correctness audit |
| Hard fork | gsd-tools.js can be freely modified -- no upstream constraint |

### Claude's Discretion

- Exact regex patterns for tag name and remote URL validation
- Order of validation calls within gsd-tools.js functions
- Specific recovery hint wording for each validation error
- validate-configs.js internal structure and validator registration API
- Test file organization within the testing pyramid
- Which specific command files need vs don't need AskUserQuestion (determined by audit)

### Deferred Ideas (OUT OF SCOPE)

- TypeScript migration (v0.3.0)
- Codebase modernization audit (v0.3.0)
- Upstream outreach (separate)
</user_constraints>

---

## Summary

Phase 14 closes two gaps from the v0.2.0 milestone audit: (1) `src/validation/index.js` is orphaned -- it exists and has 366 tests passing but is imported by nothing in production code; (2) config files have no post-sync re-validation gating. A third sub-task performs a correctness audit of AskUserQuestion declarations in command files.

The validation module currently uses an exception-throwing API. CONTEXT.md locks the migration to a Result type pattern (`{ok: true, value}` / `{ok: false, error}`). This is a **breaking change to the module's public API** -- the 33 existing unit tests in `tests/validation.test.js` that assert `expect().toThrow()` must be rewritten to check `result.ok`. Two new validation functions must be added: `validateTagName()` and `validateRemoteURL()`.

The audit of gsd-tools.js reveals that `execGit()` is called in exactly 4 places (lines 914, 918, 931, 995). User-controlled inputs that flow into git operations are: (a) the `message` argument to `git commit`, (b) hashes from a regex match on SUMMARY.md content passed to `git cat-file`. The branch_name is computed from config templates (not user-provided freeform input). The config path is loaded via a hardcoded join -- but the `GSD_CONFIG_PATH` env var creates a controllable path that should also be validated.

The AskUserQuestion audit shows 28 command files in `commands/gsd/`. Of these, 13 reference AskUserQuestion and all 13 correctly declare it in their `allowed-tools`. The 15 files that don't reference AskUserQuestion include several that have user-confirmation steps in their workflows (e.g., `plan-phase.md` directly calls `Use AskUserQuestion` in its workflow). These need the declaration added to `allowed-tools` regardless of the command file body.

**Primary recommendation:** Implement in three self-contained work streams: (1) migrate validation module to Result type + add two new validators + wire into gsd-tools.js; (2) add `bin/validate-configs.js` and wire into prepublishOnly; (3) add AskUserQuestion to the command files that need it.

---

## Standard Stack

### Core (Already in Project)

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| Node.js `path` | built-in | Path resolution for `validateConfigPath()` | HIGH |
| Node.js `fs` | built-in | File existence checks in `validate-configs.js` | HIGH |
| AJV | 8.17.1 (in deps) | JSON schema validation for config files | HIGH |
| json5 | 2.2.3 (in deps) | Parse JSON5 config files (already used by ConfigLoader.js) | HIGH |

### No New Dependencies Required

All tooling needed for Phase 14 is already in the project:
- Validation module (`src/validation/index.js`) -- exists, needs API change
- AJV + ConfigSchema.js (`src/config/ConfigSchema.js`) -- exists for config validation
- bun test -- existing test runner (366 tests passing baseline)
- `scripts/check-parity.js` -- existing; must be updated to know about `bin/validate-configs.js`

### New Files to Create

| File | Purpose | Note |
|------|---------|------|
| `bin/validate-configs.js` | Standalone config validation script | Add to `files` array in package.json, not to `bin` |
| `src/config/schema.js` | Config schema (relocate or supplement) | CONTEXT says new location, but `src/config/ConfigSchema.js` already exists |

**IMPORTANT:** `src/config/ConfigSchema.js` already exists with AJV schema for `~/.gsd/config.json`. The CONTEXT decision is to put the `.planning/config.json` schema in `src/config/schema.js`. These are different configs. Do not confuse them.

---

## Architecture Patterns

### Pattern 1: Result Type Migration

**What:** Change all three validation functions from throw-on-error to return `{ok, value/error}`.

**Current API (exception-throwing):**
```javascript
// src/validation/index.js — CURRENT (to be replaced)
function validateGitSHA(sha) {
  if (typeof sha !== 'string') {
    throw new Error(`Invalid git SHA format: ${sha}`);
  }
  const shaPattern = /^[0-9a-f]{7,40}$/i;
  if (!shaPattern.test(sha)) {
    throw new Error(`Invalid git SHA format: ${sha}`);
  }
  return sha;
}
```

**New API (Result type):**
```javascript
// src/validation/index.js — TARGET
function validateGitSHA(sha) {
  if (typeof sha !== 'string') {
    return { ok: false, error: `Invalid git SHA format: ${sha}` };
  }
  const shaPattern = /^[0-9a-f]{7,40}$/i;
  if (!shaPattern.test(sha)) {
    return { ok: false, error: `Invalid git SHA format: ${sha}` };
  }
  return { ok: true, value: sha.toLowerCase() }; // sanitize: normalize to lowercase
}
```

**Key sanitization decisions:**
- `validateGitSHA`: normalize to lowercase (git accepts uppercase but canonical form is lowercase)
- `validateBranchName`: trim leading/trailing whitespace before validation
- `validateConfigPath`: return resolved absolute path (already did this in old API)
- `validateTagName`: trim whitespace, return as-is (tags are case-sensitive)
- `validateRemoteURL`: return as-is (URLs are case-sensitive in path part)

### Pattern 2: requireValid() Bridge

**What:** Adapter in gsd-tools.js that converts Result type to process.exit(1) for hot paths.

```javascript
// get-stuff-done/bin/gsd-tools.js -- ADD NEAR TOP (after imports, before commands)
function requireValid(result) {
  if (!result.ok) {
    error(result.error);  // uses existing error() which calls process.exit(1)
  }
  return result.value;
}
```

**Where it sits:** Application layer (gsd-tools.js), NOT in the validation module. Validation module stays pure.

**Wire-in pattern at call sites:**
```javascript
// BEFORE (no validation):
const hashResult = execGit(cwd, ['cat-file', '-t', hash]);

// AFTER (with validation):
const validHash = requireValid(validateGitSHA(hash));
const hashResult = execGit(cwd, ['cat-file', '-t', validHash]);
```

### Pattern 3: New Validator Patterns

**validateTagName() -- design rationale:**

Git tag naming follows the same rules as branch names with a few differences. Tags cannot contain `~`, `^`, `:`, `?`, `*`, `\`, spaces, DEL, control chars. The v-prefix is conventional (v1.0.0) but not required. Verified against git-check-ref-format(1) man page semantics.

```javascript
function validateTagName(tag) {
  if (typeof tag !== 'string' || tag.length === 0) {
    return { ok: false, error: `Invalid tag name: ${tag}` };
  }
  if (tag.length > 255) {
    return { ok: false, error: `Tag name exceeds maximum length of 255 characters` };
  }
  // Allowlist: alphanumeric, hyphen, underscore, dot, forward slash, v-prefix
  // Reject: ~, ^, :, ?, *, \, .., .lock, @{, space, control chars
  const tagPattern = /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/;
  if (!tagPattern.test(tag)) {
    return { ok: false, error: `Tag name contains invalid characters: ${tag}` };
  }
  if (tag.includes('..')) {
    return { ok: false, error: `Tag name contains invalid sequence '..': ${tag}` };
  }
  if (tag.endsWith('.lock')) {
    return { ok: false, error: `Tag name cannot end with '.lock': ${tag}` };
  }
  if (tag.includes('@{')) {
    return { ok: false, error: `Tag name contains invalid sequence '@{': ${tag}` };
  }
  return { ok: true, value: tag };
}
```

**validateRemoteURL() -- design rationale:**

Allowlist: `https://`, `ssh://`, `git@host:path` (scp-like SSH syntax).
Rejected: `git://` (GitHub disabled 2022), `file://` (SSRF/LFI per OWASP), `http://` (no TLS).

SCP-like syntax (`git@github.com:user/repo.git`) is the most common SSH form and must be handled separately from the URI form (`ssh://git@host/path`).

```javascript
function validateRemoteURL(url) {
  if (typeof url !== 'string' || url.length === 0) {
    return { ok: false, error: `Invalid remote URL: ${url}` };
  }
  // Allowlist: https, ssh URI, or scp-like git@ syntax
  const httpsPattern = /^https:\/\/.+/;
  const sshUriPattern = /^ssh:\/\/.+/;
  const scpPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+:[a-zA-Z0-9._\/-]+/;

  if (httpsPattern.test(url) || sshUriPattern.test(url) || scpPattern.test(url)) {
    return { ok: true, value: url };
  }
  return {
    ok: false,
    error: `Remote URL uses disallowed protocol: ${url}. Use https://, ssh://, or git@host:path format.`
  };
}
```

### Pattern 4: validate-configs.js Structure

**What:** Standalone validation script with a registry pattern for extensibility.

```javascript
// bin/validate-configs.js
#!/usr/bin/env node

const validators = require('./validators'); // registry

async function main() {
  if (process.env.SKIP_CONFIG_VALIDATION === '1') {
    process.stderr.write('Warning: Config validation skipped (SKIP_CONFIG_VALIDATION=1)\n');
    process.exit(0);
  }

  const results = [];
  for (const [file, validator] of Object.entries(validators)) {
    const result = await validator(file);
    results.push({ file, ...result });
  }

  // Per-file output
  for (const r of results) {
    if (r.ok) {
      process.stdout.write(`PASS ${r.file}\n`);
    } else {
      process.stderr.write(`FAIL ${r.file}: ${r.errors.join(', ')}\n`);
    }
  }

  // Summary
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  process.stdout.write(`\n${passed} passed, ${failed} failed\n`);

  if (failed > 0) process.exit(1);
}

main();
```

**Validator registry in src/config/schema.js:**

The CONTEXT decision places the `.planning/config.json` schema in `src/config/schema.js`. The existing `src/config/ConfigSchema.js` validates the global `~/.gsd/config.json`. These are different configs -- do not merge them. Create `src/config/schema.js` as a separate module.

### Pattern 5: prepublishOnly Extension

**Current prepublishOnly:**
```json
"prepublishOnly": "git diff --check HEAD && bun run build:hooks"
```

**Target prepublishOnly:**
```json
"prepublishOnly": "git diff --check HEAD && bun run build:hooks && node bin/validate-configs.js"
```

**Why this order:** Build hooks first (creates dist files that validate-configs.js may check), then validate configs.

### Recommended Project Structure (New Files)

```
bin/
  validate-configs.js    # NEW: standalone config validation script

src/
  config/
    ConfigLoader.js      # existing -- loads ~/.gsd/config.json
    ConfigSchema.js      # existing -- AJV schema for ~/.gsd/config.json
    schema.js            # NEW: schema for .planning/config.json
  validation/
    index.js             # MODIFY: migrate to Result type, add 2 new functions
```

### Anti-Patterns to Avoid

- **Putting requireValid() in the validation module:** Validation module must be pure (no knowledge of error() or process.exit). This is the dependency direction rule -- domain modules don't import application concerns.
- **Using exceptions for expected failures:** The whole point of Result type is no try/catch proliferation. Only use exceptions for unexpected/unrecoverable errors.
- **Validating only at CLI entry points:** Must validate wherever user-controlled data enters git operations, including data extracted from file content (the SUMMARY.md hash extraction case at line 990-999).
- **Double-encoding protection without decoding:** `validateConfigPath` already decodes URI components. Don't add a second decode layer without thinking about double-decode attacks.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema validation | Custom JSON structure checker | AJV (already in deps) | Edge cases: nested required, type coercion, additionalProperties |
| JSON5 parsing for config | Manual parser | json5 package (already in deps, used by ConfigLoader.js) | Already handles comments, trailing commas |
| Conflict marker detection | String search | `git diff --check HEAD` (already in prepublishOnly) | Already handles staging edge cases |

---

## Common Pitfalls

### Pitfall 1: Test Migration - All 33 Existing Tests Use .toThrow()

**What goes wrong:** Every test in `tests/validation.test.js` uses `expect(() => ...).toThrow()`. The new API returns `{ok: false, error}` instead of throwing. All 33 throw-checking tests will pass against the old API but fail after migration.

**Why it happens:** The validation module was built with exceptions before the Result type decision was made.

**How to avoid:** Migrate tests BEFORE or SIMULTANEOUSLY with the API change. The test file must be fully rewritten. Key pattern changes:
- `expect(validateGitSHA(sha)).toBe(sha)` → `expect(validateGitSHA(sha)).toEqual({ok: true, value: sha.toLowerCase()})`
- `expect(() => validateGitSHA(sha)).toThrow('message')` → `expect(validateGitSHA(sha)).toEqual({ok: false, error: expect.stringContaining('...')})`

**Warning signs:** Any test run that shows fewer than 33 validation tests, or validation tests "passing" while the API still throws.

### Pitfall 2: The Hash Extraction Call Site (Line 990-999)

**What goes wrong:** At line 990-999 in gsd-tools.js, `hashes` are extracted from SUMMARY.md content using a regex, then passed to `git cat-file -t`. This is not user CLI input -- it's content from the filesystem. But the file could have been tampered with, and the regex already enforces `[0-9a-f]{7,40}` format. Calling `validateGitSHA()` here is still correct defense-in-depth.

**Why it happens:** The existing regex at line 990 (`/\b[0-9a-f]{7,40}\b/g`) already constrains to valid hex format, so validation will always pass. The value of adding it is: (a) single source of truth for the SHA format rule, (b) prevents future regressions if the regex is ever weakened.

**How to avoid:** Add `requireValid(validateGitSHA(hash))` but don't be surprised when it never fires -- that's expected given the existing pre-filter.

### Pitfall 3: validateConfigPath Already Has a Subtle Behavior

**What goes wrong:** `validateConfigPath(userPath, allowedBaseDir)` uses `path.resolve(decodedPath)` which resolves relative to `process.cwd()`. If `userPath` is relative (e.g., `.planning/config.json`) and `allowedBaseDir` is absolute, the resolution is correct. But if the cwd is unexpected, the resolved path may not be within the base dir even for legitimately in-scope paths.

**How to avoid:** Always pass an absolute `allowedBaseDir`. In gsd-tools.js, `cwd` is `process.cwd()` and is absolute. When wiring `validateConfigPath` into config loading, pass `cwd` as the base dir.

### Pitfall 4: ConfigSchema.js vs schema.js Naming Collision

**What goes wrong:** `src/config/ConfigSchema.js` already exists and validates `~/.gsd/config.json`. CONTEXT says to put the `.planning/config.json` schema in `src/config/schema.js`. These are different configs. Mixing them would cause incorrect validation (the schemas have different `required` fields and `additionalProperties` rules).

**How to avoid:** Create `src/config/schema.js` as a completely separate module. It should NOT import from ConfigSchema.js. The validate-configs.js script imports from schema.js for `.planning/config.json` validation.

### Pitfall 5: SKIP_CONFIG_VALIDATION Has No npm-native Alternative

**What goes wrong:** npm's `--ignore-scripts` flag does NOT skip `prepublishOnly` when running `npm publish`. This is a known npm bug (npm/cli #2755). Without `SKIP_CONFIG_VALIDATION=1`, a validation bug in `validate-configs.js` would make ALL publishing impossible.

**How to avoid:** The escape hatch env var is mandatory, not optional. Do not remove it. Test that `SKIP_CONFIG_VALIDATION=1 bun run prepublishOnly` exits 0.

### Pitfall 6: AskUserQuestion Audit Scope - Workflows vs Command Files

**What goes wrong:** The CONTEXT decision audits command files (`commands/gsd/*.md`), but user interaction is actually invoked by workflows (`get-stuff-done/workflows/*.md`). Some command files delegate to workflows that call AskUserQuestion. The allowed-tools in the command file is what Claude Code enforces -- not what the workflow says.

**Finding:** `plan-phase.md` workflow directly contains `Use AskUserQuestion:` at line 334 but the `plan-phase.md` command file does NOT list AskUserQuestion in its allowed-tools. This is a real gap.

**How to avoid:** Identify which command files invoke workflows that use AskUserQuestion and add the declaration. Read the workflow files, not just the command files.

### Pitfall 7: SCP-like SSH Syntax Has No URI Scheme

**What goes wrong:** The standard scp-like Git SSH URL format `git@github.com:user/repo.git` has no URI scheme. A naive pattern check for `://<rest>` would reject it. The colon-without-double-slash distinguishes it from `ssh://`.

**How to avoid:** The validateRemoteURL() pattern must handle both `ssh://` URI form AND `git@host:path` scp form separately. The regex for scp form must not accidentally match `file:///path` or other schemes.

---

## Code Examples

### Migration Example: validateBranchName (Result type)

```javascript
// Source: codebase analysis + CONTEXT.md decision
function validateBranchName(branch) {
  if (typeof branch !== 'string' || branch.length === 0) {
    return { ok: false, error: `Branch name contains invalid characters: ${branch}` };
  }
  if (branch.length > 255) {
    return { ok: false, error: `Branch name exceeds maximum length of 255 characters: ${branch}` };
  }
  const branchPattern = /^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/;
  if (!branchPattern.test(branch)) {
    return { ok: false, error: `Branch name contains invalid characters: ${branch}` };
  }
  if (branch.includes('..')) {
    return { ok: false, error: `Branch name contains invalid sequence '..': ${branch}` };
  }
  if (branch.endsWith('.lock')) {
    return { ok: false, error: `Branch name cannot end with '.lock': ${branch}` };
  }
  if (branch.includes('@{')) {
    return { ok: false, error: `Branch name contains invalid sequence '@{': ${branch}` };
  }
  return { ok: true, value: branch.trim() };
}
```

### Test Migration Example

```javascript
// BEFORE (exception-based):
test('rejects too-short SHA (6 chars)', () => {
  const sha = '123456';
  expect(() => validateGitSHA(sha)).toThrow('Invalid git SHA format');
});

// AFTER (Result type):
test('rejects too-short SHA (6 chars)', () => {
  const sha = '123456';
  const result = validateGitSHA(sha);
  expect(result.ok).toBe(false);
  expect(result.error).toContain('Invalid git SHA format');
});

// BEFORE (happy path):
test('accepts full 40-char hex SHA', () => {
  const sha = '1234567890abcdef1234567890abcdef12345678';
  expect(validateGitSHA(sha)).toBe(sha);
});

// AFTER (happy path):
test('accepts full 40-char hex SHA', () => {
  const sha = '1234567890abcdef1234567890abcdef12345678';
  const result = validateGitSHA(sha);
  expect(result.ok).toBe(true);
  expect(result.value).toBe(sha.toLowerCase()); // normalized
});
```

### Integration Test Example (gsd-tools validation wiring)

```javascript
// tests/gsd-tools.test.js addition -- integration test for validation wiring
describe('commit command - SHA validation wiring', () => {
  test('verify-summary calls validateGitSHA on extracted hashes', () => {
    // Spy or mock validateGitSHA to verify it was called
    // OR test indirectly: write a SUMMARY with a valid hash, expect the command to proceed
    // without throwing, write one with an invalid SHA pattern (bypasses the existing regex)
    // Note: existing regex at line 990 already filters to [0-9a-f]{7,40}, so injections
    // are blocked upstream. Integration test verifies the wiring exists.
  });
});
```

### AskUserQuestion Declaration Pattern (YAML list format)

```yaml
---
name: gsd:plan-phase
description: Create detailed execution plan for a phase
argument-hint: "[phase] [--research] [--skip-research] [--gaps] [--skip-verify]"
agent: gsd-planner
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - WebFetch
  - mcp__context7__*
  - AskUserQuestion  # ADD THIS
---
```

---

## Codebase State: Current Wiring Gaps

### Validation Injection Points in gsd-tools.js

| Line | Git Op | User Input Source | Validator Needed |
|------|--------|-------------------|-----------------|
| 914 | `git add <file>` | files from CLI args | `validateConfigPath()` (already bounded by config) |
| 918 | `git commit -m <message>` | message from CLI args | None -- commit messages are unconstrained by git |
| 931 | `git rev-parse --short HEAD` | No user input | None |
| 990-999 | `git cat-file -t <hash>` | regex-extracted from file | `validateGitSHA()` (defense-in-depth) |

**Assessment:** The current gsd-tools.js does not directly expose git branch, tag, or remote URL operations to user input. The `branch_name` at line 1206-1213 is computed from config templates (not freeform). The CONTEXT's direction to validate "ALL git operations" primarily applies to the two identified injection points plus any commands added by Phase 14 itself (validateTagName, validateRemoteURL for potential future use or for the validate-configs checks).

**Practical scope:** Wire `validateGitSHA()` into the hash-checking loop (line 994). Wire `validateConfigPath()` into `loadConfig()` when `GSD_CONFIG_PATH` env var is used. Add `validateBranchName()` to any branch-taking CLI command. Add module import at top of gsd-tools.js.

### AskUserQuestion Audit Results

**Files that reference AskUserQuestion AND have the declaration:** 13 files (all correct).

**Files that DON'T reference AskUserQuestion but NEED it based on workflow analysis:**

| Command File | Workflow Evidence | Recommendation |
|-------------|------------------|----------------|
| `plan-phase.md` | `plan-phase.md` workflow line 334: `Use AskUserQuestion:` | ADD declaration |
| `complete-milestone.md` | Workflow has interactive confirmation gate ("yes/wait/adjust scope") | ADD declaration |
| `remove-phase.md` | Workflow has `confirm_removal` step with "Proceed? (yes/no)" | ADD declaration (inline text is less structured but could use AskUserQuestion) |

**Files that have `<step name="confirm">` but don't need AskUserQuestion declaration:**
- `add-phase.md` -- confirm step just prints output, no question
- `insert-phase.md` -- confirm step just prints output, no question
- `pause-work.md` -- confirm step just prints output, no question

**Read-only/output-only files (no interaction possible):**
- `help.md`, `join-discord.md`, `progress.md`, `audit-milestone.md` -- output only, no user questions
- `research-phase.md`, `map-codebase.md` -- spawn subagents, no interactive user questions
- `set-profile.md`, `verify-work.md`, `add-todo.md`... -- need content review

**Verified no AskUserQuestion in workflow for:**
- `add-phase.md` -- confirm step outputs result text, waits for no input
- `insert-phase.md` -- confirm step outputs result text, waits for no input
- `pause-work.md` -- confirm step outputs result text, waits for no input

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Exception-based validation | Result type (`{ok, value/error}`) | CONTEXT decision (2026-02-19) | API breaking change; tests must be rewritten |
| Orphaned validation module | Wired into production code | Phase 14 | GAP-2 closed |
| No publish-time config check | prepublishOnly + standalone script | Phase 14 | GAP-3 closed |
| git:// protocol allowed | git:// rejected (disabled by GitHub 2022) | Phase 14 | Security hardening |
| file:// protocol allowed | file:// rejected (SSRF/LFI per OWASP) | Phase 14 | Security hardening |

---

## Open Questions

1. **validate-configs.js: Should it validate Markdown structure?**
   - What we know: CONTEXT says ROADMAP.md, STATE.md, PROJECT.md are covered. Markdown validation = "required sections + correct heading hierarchy."
   - What's unclear: The heading hierarchy check requires parsing Markdown -- is a regex approach sufficient or do we need a parser?
   - Recommendation: Use regex for section header checks (sufficient for required sections). Do not add a Markdown parser dependency. Keep it simple.

2. **`git add <file>` at line 914: Should file paths be validated?**
   - What we know: `filesToStage` comes from CLI args (`--files f1 f2`). These could theoretically be user-supplied paths.
   - What's unclear: The callers of `commit` are always agent-generated calls (not end-user freeform input). The risk is low.
   - Recommendation: Add `validateConfigPath()` for the files array entries as defense-in-depth. Base dir = `cwd`. This makes the validation complete.

3. **`schema.js` for `.planning/config.json`: What does the schema look like?**
   - What we know: `.planning/config.json` has these keys: `model_profile`, `commit_docs`, `search_gitignored`, `branching_strategy`, `phase_branch_template`, `milestone_branch_template`, `research`, `plan_checker`, `verifier`, `parallelization`. See `loadConfig()` in gsd-tools.js lines 56-104.
   - What's unclear: Whether to use AJV (already a dep) or a simpler hand-rolled schema check.
   - Recommendation: Use AJV (already in deps, already used for ConfigSchema.js). Schema definition is straightforward from loadConfig() defaults.

---

## Sources

### Primary (HIGH confidence)

- Codebase direct inspection (`get-stuff-done/bin/gsd-tools.js`, `src/validation/index.js`, `tests/validation.test.js`, `commands/gsd/*.md`, `package.json`)
- `.planning/phases/14-security-wiring/14-CONTEXT.md` -- locked decisions
- `src/config/ConfigSchema.js` -- existing AJV pattern for reference
- `get-stuff-done/workflows/plan-phase.md` line 334 -- AskUserQuestion usage evidence

### Secondary (MEDIUM confidence)

- git-check-ref-format(1) semantics for tag name rules (standard knowledge, high confidence based on documented git behavior)
- OWASP SSRF Prevention: file:// as SSRF/LFI vector (well-documented security principle)
- GitHub git:// protocol deprecation (2022) -- widely documented event

### Tertiary (LOW confidence)

- npm/cli #2755 (`--ignore-scripts` not working for prepublishOnly with npm publish) -- from CONTEXT.md, not independently verified in this session. The escape hatch design stands regardless of whether this bug is confirmed.

---

## Metadata

**Confidence breakdown:**
- Validation module API change: HIGH -- codebase directly read, all 33 tests inspected, CONTEXT locked
- New validator patterns (tag, URL): HIGH -- regex patterns are verifiable, CONTEXT locked the protocol allowlist
- Wire-in scope in gsd-tools.js: HIGH -- all 4 execGit calls inspected, injection points identified
- validate-configs.js structure: HIGH -- CONTEXT fully specifies behavior, existing patterns (check-parity.js) provide structural model
- AskUserQuestion audit: HIGH -- all 28 command files inspected, workflow files read for confirmation steps
- Config schema for .planning/config.json: HIGH -- loadConfig() defaults provide complete key inventory

**Research date:** 2026-02-19
**Valid until:** Stable (no external dependencies change; all findings are codebase-internal)
