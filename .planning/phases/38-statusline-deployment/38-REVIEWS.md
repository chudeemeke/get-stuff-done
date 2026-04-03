---
phase: 38
reviewers: [gemini, codex]
reviewed_at: 2026-04-03T00:30:00Z
plans_reviewed: [38-01-PLAN.md, 38-02-PLAN.md]
notes: Gemini via stdin pipe. Codex (GPT-5.4, medium reasoning) via stdin pipe with minimal prompt pattern.
---

# Cross-AI Plan Review -- Phase 38

## Gemini Review

### Summary
High-signal, two-stage plan that systematically resolves the "local-only" limitation. Plan 01 correctly moves hooks into overlay/ to leverage the existing composition pipeline. Plan 02 completes deployment with a safe read-modify-write installer patch for global settings. TDD-driven timeout fixes (15s to 3s) significantly improve UX on slow networks.

### Strengths
- Idiomatic structural fix: moving to overlay/hooks/ eliminates special-case compose logic
- User-centric safety: patchStatusLine preserves custom non-GSD statusline settings (D-06)
- Upstream pattern alignment: setTimeout stdin guard and buildHookCommand format maintain compatibility
- Comprehensive testing: assertions for internal logic, timeout values, and composition manifest

### Concerns
- **LOW**: Residual root artifacts -- gsd-context-monitor.js left in hooks/ root while others move. If fork-specific, it should also move to overlay/hooks/.
- **LOW**: Project-level settings.json continues to use relative paths. May confuse users expecting global-first config.

### Suggestions
- Hook content audit: verify if gsd-context-monitor.js should also move to overlay/hooks/
- require path verification: confirm ../src paths still resolve correctly after move (same depth, likely fine)
- Installer export count: update tests asserting total exports from bin/install.js to account for new patchStatusLine

### Risk Assessment: LOW
Plans follow established upstream patterns with robust rollback/preservation logic.

**Verdict:** APPROVED. Proceed with Plan 01.

---

## Codex Review (GPT-5.4, medium reasoning effort)

### Summary
Plans correctly identify the core deployment gap and the sequencing is sound. However, the plans miss implementation details that are likely to break either local execution or existing tooling. Path resolution after the move and stale tooling references are structural risks.

### Strengths
- Good sequencing: compose/deployment first, installer wiring second
- Clear success criteria around overlay inclusion, manifest output, and timeout behavior
- Explicitly protects user custom statusline settings
- Test-oriented rather than relying on manual verification

### Concerns
- **HIGH**: `38-01` deletes hooks from root but does not update `scripts/build.js` (bundles from `hooks/`) and `scripts/check-parity.js` (checks root hook paths). Will break hook bundling/parity workflows.
- **HIGH**: Hooks require `../src/config/ConfigLoader` from `hooks/` directory. After moving to `overlay/hooks/`, that relative path changes but the plan doesn't rewrite it. Will break direct execution of moved source files.
- **MEDIUM**: `patchStatusLine()` always returns 'updated' because it sets `settings.statusLine` before computing the return action. Logic bug in plan pseudocode.
- **MEDIUM**: Corrupt `settings.json` handling resets to `{}` and rewrites. Destroys unrelated user config. Inconsistent with installer safety posture.
- **MEDIUM**: Manual verification commands are Unix-centric and use wrong stdin payload shape (flat keys vs nested `model.display_name`, `workspace.current_dir`, `context_window.remaining_percentage`).
- **LOW**: Compose test fixture underspecified -- `createMockOverlay()` has no hook files, plan leaves fixture change as a note.

### Suggestions
- Expand 38-01 to update `scripts/build.js` and `scripts/check-parity.js` hook path references
- Rewrite moved hooks' relative imports for `overlay/hooks/` depth, or test only composed `dist/hooks/` output
- Fix patchStatusLine() to compute setting existence before mutation
- Change corrupt-settings behavior to fail with warning or backup, not silent replace
- Use actual Claude Code stdin payload shape for manual verification
- Make compose fixture update explicit in 38-01

### Risk Assessment: MEDIUM-HIGH
Structural risks (path resolution, stale tooling) will cause breakage even if executed faithfully. If fixed, drops to MEDIUM-LOW.

---

## Consensus Summary

### Agreed Strengths (both reviewers)
- Overlay-idiomatic file relocation is correct approach
- Good sequencing (compose first, installer second)
- Settings preservation for existing users
- Test-oriented plans

### Agreed Concerns
- Require() path verification needed after move (Gemini: suggestion, Codex: HIGH)

### Codex-Only Findings (Gemini missed)
1. **Stale tooling references** (HIGH) -- `scripts/build.js` and `scripts/check-parity.js` still reference `hooks/` root paths
2. **patchStatusLine logic bug** (MEDIUM) -- always returns 'updated'
3. **Corrupt settings.json destroys user config** (MEDIUM) -- resets to `{}`
4. **Wrong stdin payload shape** (MEDIUM) -- manual verification uses flat keys, statusline expects nested
5. **Compose fixture underspecified** (LOW)

### Gemini-Only Findings (Codex missed)
1. Audit gsd-context-monitor.js for overlay promotion (LOW)

### Divergent Views
| Topic | Gemini | Codex |
|-------|--------|-------|
| Risk level | LOW | MEDIUM-HIGH |
| Import path issue | Suggestion (likely fine) | HIGH (will break) |
| Stale tooling | Not mentioned | HIGH |

---
*Reviewed: 2026-04-03*
*Reviewers: Gemini (2.5 Pro), Codex (GPT-5.4 medium reasoning)*
*CLI invocation: stdin pipe. Codex requires minimal prompt with file path references (not embedded content) to avoid hanging.*
