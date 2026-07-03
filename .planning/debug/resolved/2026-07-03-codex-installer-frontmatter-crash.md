---
status: resolved
date: 2026-07-03
scope: get-stuff-done installer override
issue: memory-nexus Codex no-frontmatter install crash
---

# Codex installer no-frontmatter crash

## Problem

The memory-nexus inbox report showed `npx -y @chude/get-stuff-done@latest --codex --global` crashing after partial install:

```text
TypeError: Cannot read properties of null (reading 'match')
at extractFrontmatterField (...\dist\bin\install.js:1004:29)
at installCodexConfig (...\dist\bin\install.js:2829:18)
```

The immediate bug was not a memory-nexus-specific state issue. The Codex installer assumed every Codex markdown input had YAML frontmatter, but some Codex agent files are valid without it.

## Fix

Added `overrides/bin/install.js` against Open GSD `@opengsd/gsd-core@1.5.0`.

The override preserves upstream behavior except for the frontmatter helper:

```js
function extractFrontmatterField(frontmatter, fieldName) {
  if (typeof frontmatter !== 'string' || frontmatter.length === 0) return null;
  const match = frontmatter.match(new RegExp(`${fieldName}:\\s*(.+)`));
  return match ? match[1].trim() : null;
}
```

This keeps the installer extensible: missing frontmatter becomes absent metadata, not a fatal parser assumption. Codex config generation can then fall back to filename/default behavior.

## Verification

- `node --check overrides\bin\install.js`
- `node scripts\check-overrides.js` -- 7 overrides checked, all fresh
- `bun run compose` -- upstream 1.5.0, overlay 3.0.2, 644 files written
- `bun run lint` -- 0 errors, existing 135 warnings
- `git diff --check` -- no whitespace errors, line-ending warnings only
- `bun test ./tests/codex-installer.test.js`
- `bun test ./tests/codex-installer.test.js ./tests/installer-safety.test.js ./tests/check-overrides.test.js`
- `bun test ./tests/codex-installer.test.js ./tests/installer-v3.test.js ./tests/prototype-installer.test.js`
- `bun test ./tests/sync.test.cjs`
- `bun test ./tests/core.test.cjs ./tests/hooks.test.js ./tests/gsd-tools.test.js`
- `bun test ./tests/hooks.test.js ./tests/platform.test.js`
- Standalone composed installer smoke: `node bin\install.js --codex --global --config-dir <temp>` exited 0 and wrote Codex config plus 38 agent TOML files.

Full serial suite evidence:

- `bun test --max-concurrency=1` ran all 52 files: 1731 passed, 2 timeout failures.
- The two failures were default 5s test-timeout ceilings in hook/platform tests, not assertion failures.
- After applying shared timeout wrappers, the affected files passed together: 191 passed, 0 failed.
- A second full serial rerun was not attempted because local disk headroom was low after the first full pass; CI should provide the final complete-matrix signal after push.

## Remaining Scope

This resolves only the no-frontmatter Codex crash.

Still open from the inbox item:

- Transactional install / preflight / rollback behavior for partial installs.
- VERSION mapping clarity between npm package version and installed tool version.
- `teams` config warning/schema reconciliation.
