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

### 2. Statusline Git Branch Display Architecture

**Area:** hooks/gsd-statusline.js — displaying git branch in status line

**Fork approach:** Theme-based architecture using `theme.text.muted.render()`, `getBranding()`, `SEP` constant, and `theme.indicators` for the 4-stage progress indicator. All colors flow through the theme system for consistent rendering.

**Upstream approach:** Upstream commit 1bc6d00 added git branch display using raw ANSI escape codes (`\x1b[2m...\x1b[0m`) and direct string concatenation. The branch detection logic itself (traverse parent dirs to find `.git`, read `HEAD` file, support git worktrees) was solid.

**Resolution:** Fork architecture wins. Upstream's ANSI codes replaced with `theme.text.muted.render()`. Upstream's git branch traversal logic (including worktree support) adopted wholesale. Revert commit 9d815d3 attempted to remove the branch display — fork kept it since it was independently valuable and correctly integrated.

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
