# Upstream Approach Comparison

**Phase:** 18-upstream-sync-execution
**Sync Range:** v1.18.0 through upstream/main HEAD
**Purpose:** Document where fork and upstream solved the same problem differently

## Format

Each entry documents a divergence or convergence:
- **Area**: What feature/behavior
- **Fork approach**: How the fork does it
- **Upstream approach**: How upstream does it
- **Resolution**: Which was kept and why
- **Batch**: When discovered during sync

## Divergences

### 1. gsd-verifier.md Write Tool

**Area:** Agent tools list in gsd-verifier.md

**Fork approach:** `tools: Read, Write, Bash, Grep, Glob` — Write tool added in Phase 8 as emergency fix after settings.local.json corruption caused by agent falling back to Bash heredoc when Write was missing.

**Upstream approach:** Upstream added Write tool in commit 173ff7a (same reason, independently discovered). However, upstream's mega-revert commit 9d815d3 then attempted to remove Write tool again by reverting 173ff7a. This would have re-introduced the corruption bug.

**Resolution:** Fork wins. Write tool preserved despite revert. The revert commit was applied selectively — regex fix from 9d815d3 adopted, Write tool removal rejected via `git checkout HEAD -- agents/gsd-verifier.md`.

**Batch:** Batch 6 (commits 173ff7a and 9d815d3)

---

### 2. Statusline Architecture: Full System vs Simplified Reader

**Area:** hooks/gsd-statusline.js — overall statusline implementation and context window indicator

**Fork approach:** 232-line implementation with a 4-stage context window progress indicator using `theme.indicators` (filled/partial/empty blocks from the theme system), `getBranding()` label, `SEP` separator constant, and `theme.text.muted.render()` for muted colors. Context health computed from `proximity` (distance from autocompact threshold), producing 4 stages: healthy / moderate / critical / urgent. All colors route through the theme system for consistent rendering. Statusline also writes a bridge file (`$TMPDIR/claude-ctx-${session}.json`) for the context monitor hook.

**Upstream approach:** 88-line implementation (upstream HEAD) focusing on git branch display via raw ANSI escape codes (`\x1b[2m...\x1b[0m`) and direct string concatenation. Git branch detection (traverse parent dirs to find `.git`, read `HEAD`, support worktrees) was well-implemented but the visual rendering bypassed the theme system entirely.

**Resolution:** Fork architecture wins for the visual indicator (proximity-based 4-stage bar preserved). Upstream's git branch traversal logic (including worktree support) adopted wholesale. Upstream's ANSI codes replaced with `theme.text.muted.render()`. Revert commit 9d815d3 attempted to remove the branch display — fork kept it since it was independently valuable.

**Batch:** Batch 6 (commits 1bc6d00 and 9d815d3)

---

### 3. Gemini Runtime Support Origin

**Area:** bin/install.js — Gemini CLI installer support

**Fork approach:** Not previously implemented. Fork only had Claude Code and OpenCode support.

**Upstream approach:** Upstream's mega-revert commit 9d815d3 is paradoxical: it claims to revert 12 PRs, but it actually ADDS Gemini support that was not in the reverted PRs. The Gemini support appears to have been built alongside the revert rather than being part of any of the 12 reverted PRs.

**Resolution:** Fork adopted the Gemini support from 9d815d3 despite the commit being a "revert". Functions adopted: `hasGemini`, `hasAll`, `getDirName('gemini')`, `getGlobalDir('gemini')`, `convertClaudeToGeminiToml()`. Menu updated to include options 3 (Gemini) and 4 (all runtimes).

**Batch:** Batch 6 (commit 9d815d3)

---

### 4. install.js useLinks Mode Preservation

**Area:** bin/install.js — symlink-based installation mode

**Fork approach:** `useLinks` mode (detected from `.install-meta.json`) for symlink-based dev installs where files are symlinked rather than copied. Allows live editing without reinstall.

**Upstream approach:** Upstream's revert commit 9d815d3 attempted to remove the `useLinks` detection and `execFileSync` (synchronous execution) pattern in favor of a simpler async-only approach. The removal would have broken existing dev installations using symlinks.

**Resolution:** Fork wins. `useLinks` detection and `execFileSync` preserved via `git checkout HEAD -- bin/install.js` followed by selective integration of upstream Gemini additions.

**Batch:** Batch 6 (commit 9d815d3)

---

### 5. hook Path Templating for Multi-Runtime

**Area:** bin/install.js `copyFlattenedCommands`/`copyWithPathReplacement` — how hook .js files reference their runtime's config directory

**Fork approach (before this batch):** Hook .js files hardcoded `~/.claude/` as the config directory prefix.

**Upstream approach (commit 9a7bb22):** Introduced `getConfigDirFromHome(runtime, isGlobal)` helper function that returns the correct config dir per runtime (`.claude/` for Claude Code, `.opencode/` for OpenCode, `.gemini/` for Gemini). During copy, hook source files are string-replaced to use `getConfigDirFromHome()` call instead of hardcoded paths.

**Resolution:** Upstream approach adopted. `getConfigDirFromHome()` function added to bin/install.js. Selective integration: upstream's `processAttribution`/`getCommitAttribution` calls were skipped since those functions don't exist in the fork.

**Batch:** Batch 6 (commit 9a7bb22)

---

### 6. ROADMAP Phase Header Regex

**Area:** get-stuff-done/bin/gsd-tools.js `cmdRoadmapGetPhase` — detecting phase headers in ROADMAP.md

**Fork approach (before this batch):** Only matched `### Phase N:` (three-hash headers).

**Upstream approach (commit 7b140c2):** Regex updated to `#{2,3}\s*Phase` matching both `## Phase N:` and `### Phase N:` formats. Also added malformed ROADMAP detection when neither format is found.

**Resolution:** Upstream approach adopted. Fork also added `getRoadmapPhaseInternal()` as a fallback in `cmdInitPhaseOp` via commit b9f9ee9 — this function applies the same `#{2,3}` pattern.

**Batch:** Batch 6 (commits 7b140c2 and b9f9ee9)

---

### 7. gsd-tools.cjs Architecture: Monolith vs Modular Split

**Area:** get-stuff-done/bin/gsd-tools.cjs — overall code organization

**Fork approach (pre-Batch 12):** Single 4953-line monolith containing all command implementations, state management, phase operations, roadmap handling, verification, config, templates, milestones, and utility functions.

**Upstream approach (commit c67ab75):** Split the 5324-line monolith into a 553-line thin router + 11 domain modules under bin/lib/:
- `core.cjs` — shared utilities, constants, git helpers (~400 lines)
- `state.cjs` — STATE.md operations + progression engine (~500 lines)
- `phase.cjs` — Phase CRUD, query, lifecycle (~900 lines)
- `roadmap.cjs` — ROADMAP.md operations (~350 lines)
- `verify.cjs` — verification suite + consistency validation (~800 lines)
- `config.cjs` — configuration management (~200 lines)
- `template.cjs` — template operations (~200 lines)
- `milestone.cjs` — milestone tracking (~200 lines)
- `commands.cjs` — standalone utility commands (~600 lines)
- `init.cjs` — compound init commands (~700 lines)
- `frontmatter.cjs` — YAML frontmatter parsing (~100 lines)

**Resolution:** Upstream architecture adopted wholesale (Batch 12). Fork's validation import (`validateGitSHA`, `validateBranchName`, `validateConfigPath`, `validateTagName`, `validateRemoteURL`) was preserved in `core.cjs` (not the router) since git operation helpers live there. The router file was branded from `get-shit-done` to `get-stuff-done` paths throughout.

**Batch:** Batch 12 (commit c67ab75)

---

### 8. Test Runner Strategy: bun vs node:test for Upstream CJS Tests

**Area:** tests/ directory — test runner compatibility

**Fork approach:** All fork tests are `.test.js` files using `bun:test` runner (describe/it/expect/test from 'bun:test'). Bun discovers and runs these automatically.

**Upstream approach (commit fa2e156):** Upstream split `gsd-tools.test.cjs` into 7 domain `.test.cjs` files using `node:test` APIs (`import {describe, it} from 'node:test'` with `assert` from 'node:assert'). These are designed to run via `node --test tests/*.test.cjs`.

**Conflict:** When the upstream `.test.cjs` files land in the fork's `tests/` directory, bun tries to run them (bun can execute CJS files) but `require('./helpers')` resolves to `tests/helpers.cjs` (upstream's helpers file) instead of `tests/helpers/index.js` (fork's helpers directory). This caused 171 test failures.

**Resolution (Rule 1 - Bug fix):** Extended `tests/helpers.cjs` to re-export everything from `tests/helpers/index.js` while also exporting upstream's `runGsdTools`, `createTempProject`, `cleanup`, `TOOLS_PATH`. Now `require('./helpers')` works for both upstream `.test.cjs` files and any callers expecting the helpers directory exports. Added `bunfig.toml` with `exclude = ["**/*.test.cjs"]` so bun only runs fork's `.test.js` files, avoiding CJS-in-bun execution issues. Upstream `.test.cjs` files run separately via `node --test`.

**Batch:** Batch 12 (commit fa2e156, fix in `6601879`)

---

### 9. Context Window Monitor Architecture: Hook vs External Command

**Area:** Context window monitoring mechanism

**Fork approach (pre-Batch 12):** No context window monitoring beyond the statusline visual indicator.

**Upstream approach (commit 7542d36):** Two-part system:
1. `hooks/gsd-statusline.js` (PreToolUse hook) writes a bridge file to `$TMPDIR/claude-ctx-${session}.json` with `remaining_percentage`, `used_pct`, and `timestamp`
2. `hooks/gsd-context-monitor.js` (PostToolUse hook) reads the bridge file and emits `[GSD CONTEXT WARNING]` or `[GSD CONTEXT CRITICAL]` messages to the model when remaining drops below 35% or 25%

**Conflict:** Fork's statusline uses `proximity` percentage (distance from autocompact threshold) for its 4-stage indicator, while upstream uses `used` percentage. The bridge file needed to capture `remaining` (= 100 - used) for the monitor to work.

**Resolution:** Fork architecture wins for the visual indicator (proximity-based 4-stage bar preserved). Bridge file write added after the indicator computation, providing both `remaining_percentage` (for monitor threshold math) and `used_pct` (for reference). Monitor hook adopted as-is from upstream.

**Batch:** Batch 12 (commit 7542d36)

---

### 10. Auto-Advance Chain: Skill Tool vs Direct File References

**Area:** get-stuff-done/workflows/discuss-phase.md and plan-phase.md — spawning the next phase step

**Fork approach (pre-Batch 12):** `Task(prompt="Run /gsd:execute-phase ${PHASE} --auto")` — uses Skill tool to invoke the execute-phase slash command.

**Upstream approach (commit 131f24b):** `Task(prompt="...<execution_context>@~/.claude/get-stuff-done/workflows/execute-phase.md...</execution_context>...")` — directly embeds the workflow file contents via `@file` references in the Task prompt.

**Root cause:** Skills don't resolve inside Task subagents. The `/gsd:execute-phase` slash command reference works in a main conversation but fails when spawned in a Task subagent context, breaking the auto-advance chain silently.

**Resolution:** Upstream approach adopted. All three workflow files updated: `discuss-phase.md` (broader status return including PHASE COMPLETE / PLANNING COMPLETE / PLANNING INCONCLUSIVE / GAPS FOUND), `plan-phase.md` (create_validation_strategy step added, auto-advance updated), `execute-phase.md` (parse_flags step added with --no-transition handling).

**Batch:** Batch 12 (commit 131f24b)

---

### 11. Nyquist Validation Layer: Automated Test Coverage Research

**Area:** agents/gsd-plan-checker.md, agents/gsd-phase-researcher.md, agents/gsd-planner.md, get-stuff-done/workflows/plan-phase.md

**Fork approach (pre-Batch 12):** Plan-checker had 7 check dimensions. Phase-researcher focused on implementation research. No automated test coverage research as part of planning.

**Upstream approach (commit e0f9c73):** Added Nyquist sampling validation as Dimension 8 in plan-checker. Phase-researcher gains a Validation Architecture section documenting test coverage requirements. Planner gains structured `verify` and `done` format requirements. Plan-phase workflow adds a `create_validation_strategy` step between research and planner spawn. New `VALIDATION.md` template captures per-phase test coverage strategy.

**Resolution:** Upstream approach adopted. Dimension 8 (8a-8d) added to plan-checker. RESEARCH.md cat command added before gsd-tools call in plan-checker (conflict resolved — fork branding preserved). Phase-researcher and planner agents augmented. `VALIDATION.md` template created. Plan-phase workflow updated.

**Batch:** Batch 12 (commit e0f9c73)

---

### 12. Update System: execFileSync vs execSync for npm version check

**Area:** hooks/gsd-check-update.js — checking for newer package versions on npm

**Fork approach:** `execFileSync(npmCmd, ['view', '@chude/get-stuff-done', 'version'], { encoding: 'utf8', timeout: 10000, windowsHide: true })` — uses `execFileSync` with an array of arguments and a dynamically resolved `npmCmd` (finds npm executable via `process.execPath` sibling lookup). This avoids shell interpolation and works reliably on Windows where `npm` resolves differently than on Unix.

**Upstream approach:** `execSync('npm view get-shit-done-cc version', { encoding: 'utf8', timeout: 10000, windowsHide: true })` — uses `execSync` with a single shell string. On Windows, `npm` in a shell string can resolve to the wrong binary or fail if node_modules/.bin is not in PATH during hook execution.

**Resolution:** Fork wins. `execFileSync` with array arguments is safer on Windows: no shell expansion, no PATH lookup ambiguity, `windowsHide: true` keeps the console window hidden. The package name is also correctly rebranded to `@chude/get-stuff-done`. Upstream's `execSync` approach works on macOS/Linux but is fragile on Windows.

**Batch:** Fork customization (established in Phase 5/8 branding); upstream approach documented for comparison in Batch 12 review.

---

### 13. Build System: esbuild Bundling vs Simple File Copy

**Area:** scripts/build.js (fork) vs scripts/build-hooks.js (upstream) — preparing hooks for installation

**Fork approach:** `scripts/build.js` uses esbuild to bundle hooks and gsd-tools into self-contained artifacts. esbuild inlines all `src/` dependencies (theme system, platform detection, config, validation) into each hook. This is necessary because hooks are installed to `~/.claude/hooks/` which has no access to the package's `src/` directory at runtime. The build produces `hooks/dist/` (3 hooks) and historically a `get-stuff-done/bin/dist/` bundle.

**Upstream approach:** `scripts/build-hooks.js` performs a simple file copy of hook `.js` files from `hooks/` to `hooks/dist/`. This works because upstream hooks are simpler — they use Node.js built-ins only, with no `src/` library dependencies. No bundling step required.

**Resolution:** Fork requires esbuild bundling because its hooks import from `src/theme`, `src/platform`, and `src/config`. Upstream hooks are self-contained. After the Batch 12 module split, gsd-tools.cjs no longer needs bundling (it uses `require('./lib/...')` which resolves relative to its installed location). The esbuild build pipeline is a Phase 19 concern — the current `scripts/build.js` may need updating to reflect the modular architecture. This is documented as a known gap rather than a blocker for Phase 18 merge.

**Batch:** Fork customization (established in Phase 13 hook bundling); comparison finalized in Batch 12 review.

---

## Convergences

### 1. Write Tool in gsd-verifier.md

**Area:** agents/gsd-verifier.md tools list

**Fork:** Added Write tool in Phase 8 after discovering gsd-verifier was creating files via Bash heredoc (causing settings.local.json corruption).

**Upstream:** Independently added Write tool in commit 173ff7a for the same root cause — documented the same corruption mechanism and fix.

**Outcome:** Fork and upstream arrived at identical solution. Upstream documentation (the root cause analysis file) was adopted. This is strong validation that the fix was correct.

**Batch:** Batch 6 (commit 173ff7a)

---

### 2. build hooks/dist on the fly

**Area:** bin/install.js — handling missing hooks/dist directory in dev installs

**Fork:** Upstream commit e146b08 added this. Fork did not have it pre-batch.

**Outcome:** Upstream solution adopted. When `hooks/dist` doesn't exist, installer now runs `scripts/build.js` to generate it before proceeding.

**Batch:** Batch 6 (commit e146b08)

---

### 3. Gemini TOML Template Conversion Scope

**Area:** bin/install.js `convertClaudeToGeminiToml` — which files get converted to TOML format

**Fork:** Gemini support adopted in Batch 6 (commit 9d815d3). `copyWithPathReplacement` called without `isCommand` flag, causing workflows and templates to also be converted to TOML (incorrect behavior — only commands should be TOML).

**Upstream (commit 2c0db8e):** Bug fix adds `isCommand=true` parameter to `copyWithPathReplacement` for the commands-only copy path, so only `.md` files in the commands directory get TOML conversion. Workflows and templates remain as `.md` files.

**Outcome:** Upstream bug fix adopted. Fork's `useLinks` branch preserved during conflict resolution; the fix applied only to the non-useLinks (copy) path where `isCommand=true` needed to be passed.

**Batch:** Batch 12 (commit 2c0db8e)
