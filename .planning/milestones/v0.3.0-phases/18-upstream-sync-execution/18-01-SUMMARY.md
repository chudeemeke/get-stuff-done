---
phase: 18-upstream-sync-execution
plan: 01
subsystem: infra
tags: [upstream-sync, cherry-pick, git, branding, gsd-tools, install, statusline, gemini, opencode]

# Dependency graph
requires:
  - phase: 17-quality-hardening
    provides: stable test suite at 563+ tests, 95%+ coverage baseline
provides:
  - sync/v1.20.5 feature branch with Batch 6 (v1.18.0..v1.19.0) applied
  - 29 upstream commits cherry-picked with conflicts resolved
  - Sync manifest tracking all 30 upstream commits (29 applied, 1 skipped)
  - Approach comparison document with 6 divergences and 2 convergences
  - gsd-verifier.md Write tool preserved through hostile revert commit
  - Gemini runtime support added to bin/install.js
  - git branch display in hooks/gsd-statusline.js (theme-integrated)
  - In-progress todo state in gsd-tools.js
  - ROADMAP ## and ### phase header support
  - hook path templating for multi-runtime (Claude/OpenCode/Gemini)
affects:
  - 18-02 through 18-12 (subsequent sync batches build on this branch)
  - plan-checker agents (approach-comparison.md documents fork/upstream divergences)
  - release process (Gemini support means 3-runtime install capability)

# Tech tracking
tech-stack:
  added: [Gemini CLI support (convertClaudeToGeminiToml), OpenCode package consolidation, git worktree detection in statusline]
  patterns:
    - cherry-pick --no-commit for safe per-commit review before staging
    - git checkout HEAD -- <file> for protected file restoration during revert commits
    - 4-tier conflict triage: mechanical > cosmetic > semantic > structural
    - Theme-first architecture wins over raw ANSI code insertions
    - getConfigDirFromHome() for runtime-agnostic hook path templating

key-files:
  created:
    - .planning/phases/18-upstream-sync-execution/approach-comparison.md
    - .github/CODEOWNERS
    - .github/ISSUE_TEMPLATE/bug_report.yml
    - .github/ISSUE_TEMPLATE/feature_request.yml
    - .github/workflows/auto-label-issues.yml
    - SECURITY.md
    - "gsd-verifier Missing Write Tool -- Root Cause Analysis.md"
  modified:
    - bin/install.js (Gemini support, build-on-the-fly, hook path templating, package.json write, multi-runtime menu)
    - hooks/gsd-statusline.js (git branch display via theme.text.muted.render(), worktree support)
    - get-stuff-done/bin/gsd-tools.js (in-progress todos, ## header support, ROADMAP fallback, {phase_num} placeholder)
    - agents/gsd-verifier.md (Write tool preserved, regex fix adopted)
    - .planning/sync/sync-manifest.json (30-entry applied array with conflict notes)
    - CHANGELOG.md (v1.19.0 section added)
    - package.json (description updated for OpenCode and Gemini)
    - tests/gsd-tools.test.js (2 new tests for ## header and malformed ROADMAP detection)

key-decisions:
  - "Fork wins on Write tool in gsd-verifier.md despite upstream revert 9d815d3 attempting removal"
  - "Fork's theme architecture wins over upstream's raw ANSI codes for statusline git branch display"
  - "Adopt Gemini support from mega-revert commit (9d815d3) even though it was bundled with a revert"
  - "Skip upstream Discord badge commit 90f1f66 -- fork README has no Discord/Dexscreener badges"
  - "Adopt upstream's hook path templating (getConfigDirFromHome) but skip processAttribution calls (function not in fork)"
  - "Upstream's #{2,3} ROADMAP phase header regex adopted -- fork only matched ### before"

patterns-established:
  - "Protected file restoration: git checkout HEAD -- <file> when revert commits touch protected paths"
  - "Conflict triage model: mechanical (branding) -> cosmetic -> semantic -> structural"
  - "Approach comparison document: document divergences incrementally per batch"
  - "Sync manifest: one entry per upstream commit with forkHash, conflictType, notes"

# Metrics
duration: 34min
completed: 2026-02-22
---

# Phase 18 Plan 01: Batch 6 Sync (v1.18.0..v1.19.0) Summary

**30-commit upstream batch cherry-picked with Gemini runtime support, git branch statusline display, in-progress todos, and multi-runtime hook path templating — Write tool preserved through hostile revert**

## Performance

- **Duration:** 34 min (00:33 to 01:07 UTC 2026-02-22)
- **Started:** 2026-02-22T00:33:15Z
- **Completed:** 2026-02-22T01:07:44Z
- **Tasks:** 2 (Task 1: infra setup, Task 2: 30 cherry-picks)
- **Files modified:** 36

## Accomplishments

- Applied all 30 upstream commits from v1.18.0..v1.19.0 (29 applied, 1 skipped) on sync/v1.20.5 branch
- Preserved fork's Write tool fix in gsd-verifier.md through the hostile "Revert 12 PRs" mega-commit
- Integrated Gemini runtime support (convertClaudeToGeminiToml, hasGemini, 4-option install menu) from the revert commit
- Adopted git branch display in statusline using fork's theme architecture (theme.text.muted.render() not raw ANSI)
- Added in-progress todo state, ## ROADMAP header support, ROADMAP fallback, {phase_num} template, hook path templating
- 565 tests pass, 0 failures after all changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create feature branch and update sync infrastructure** - `3a2fb58` (docs)
2. **Task 2: Cherry-pick Batch 6 (30 commits)**
   - `c1b5ab4` cherry-pick: Brave Search integration (60ccba9)
   - `25377de` cherry-pick: use @latest in primary install commands (19568d6)
   - `3181f53` cherry-pick: add badges to README (d80e4ef)
   - `dd1b395` cherry-pick: add CODEOWNERS (f7511db)
   - `f25895c` cherry-pick: add bug report issue template (a4626b5)
   - `4f388d0` cherry-pick: add feature request issue template (279f3bc)
   - `900eade` cherry-pick: add security policy (392742e)
   - `27c6638` cherry-pick: add workflow to auto-label new issues (b85247a)
   - `0334f5a` cherry-pick: add Write tool to gsd-verifier (173ff7a)
   - `5033c98` cherry-pick: create feature branch before first commit in workflows (c3c9d52)
   - `f1a7741` cherry-pick: move resolved debug sessions to resolved/ folder (ba27912)
   - `b930a78` cherry-pick: verify-work defers to plan-phase --gaps (25aeb44)
   - `ffc7b2a` cherry-pick: auto-migrate statusline.js reference (f4d6b30)
   - `395643a` cherry-pick: use @latest for uninstall commands (9d3d9d8)
   - `9754331` cherry-pick: Mistral Vibe CLI support (fbd727e)
   - `b4604f4` cherry-pick: OpenCode installer package (80246e9)
   - `d2efd87` cherry-pick: git_tag config option (430a7e4)
   - `6dc934d` cherry-pick: in-progress state for todos (6f98b4f)
   - `0c162b6` cherry-pick: git branch display in statusline (1bc6d00)
   - `160174b` cherry-pick: build hooks/dist on the fly (e146b08)
   - `f9eaf38` cherry-pick: Revert 12 PRs (9d815d3) -- selective integration
   - `e55bd2d` cherry-pick: package.json to prevent ESM inheritance (5154446)
   - `81a97cf` cherry-pick: use {phase_num} for filenames (d863858)
   - `d13589e` cherry-pick: accept ## and ### phase headers (7b140c2)
   - `38410eb` cherry-pick: template hook paths for OpenCode/Gemini (9a7bb22)
   - `add1f82` cherry-pick: fall back to ROADMAP.md (b9f9ee9)
   - `277fa12` cherry-pick: close parent UAT artifacts (dcace25)
   - `bc1621d` cherry-pick: update changelog for v1.19.0 (4622aa7)
   - `3783d85` cherry-pick: v1.19.0 version sync (ca18c24)
   - `5a268dd` fix: branding pass (gsd-roadmapper.md line 400)
3. **Sync state update** - `b9b9259` (docs: sync manifest + approach comparison)

## Files Created/Modified

- `bin/install.js` - Gemini runtime (convertClaudeToGeminiToml, hasGemini, 4-option menu), build-on-the-fly, package.json write, getConfigDirFromHome(), hook path templating
- `hooks/gsd-statusline.js` - Git branch display using theme.text.muted.render(), worktree detection via .git traversal
- `get-stuff-done/bin/gsd-tools.js` - In-progress todos (cmdTodoStart, cmdTodoComplete), #{2,3} ROADMAP regex, getRoadmapPhaseInternal() fallback, {phase_num} placeholder
- `agents/gsd-verifier.md` - Write tool preserved, regex fix adopted (\\{} -> \\{\\}, \\[] -> \\[\\])
- `tests/gsd-tools.test.js` - 2 new tests for ## header acceptance and malformed ROADMAP detection
- `.planning/sync/sync-manifest.json` - 30-entry applied array (29 applied, 1 skipped) with conflict notes
- `.planning/phases/18-upstream-sync-execution/approach-comparison.md` - 6 divergences, 2 convergences documented
- `CHANGELOG.md` - v1.19.0 section added with fork URLs
- `package.json` - Description updated to include OpenCode and Gemini
- `.github/CODEOWNERS`, `.github/ISSUE_TEMPLATE/bug_report.yml`, `.github/ISSUE_TEMPLATE/feature_request.yml` - GitHub community files
- `.github/workflows/auto-label-issues.yml` - Auto-label workflow
- `SECURITY.md` - Security disclosure policy
- `agents/gsd-roadmapper.md` - Branding fix (get-shit-done -> get-stuff-done)
- `opencode/README.md`, `opencode/get-shit-done-opencode/bin/install.js`, `opencode/get-shit-done-opencode/package.json` - OpenCode package files

## Decisions Made

1. **Write tool preserved in gsd-verifier.md through revert**: The "Revert 12 PRs" commit (9d815d3) attempted to remove the Write tool. Fork independently fixed this same bug in Phase 8. Restored via `git checkout HEAD -- agents/gsd-verifier.md`, adopted the regex fix but not the Write tool removal.

2. **Gemini support adopted from revert commit**: Although 9d815d3 is a "revert", it includes Gemini support that wasn't in any of the 12 reverted PRs. The Gemini integration is valuable functional content. Adopted: `convertClaudeToGeminiToml()`, `hasGemini`, menu options 3-4.

3. **Fork's theme architecture wins over upstream ANSI codes in statusline**: Upstream's git branch display used raw ANSI escape codes. Fork's existing statusline uses a `theme` system. Integrated upstream's branch detection logic with `theme.text.muted.render()` for consistent styling.

4. **Discord badge commit (90f1f66) skipped**: Fork README has no Discord/Dexscreener/GSD-token badges (upstream-specific social links). The commit only changes a badge the fork doesn't have.

5. **processAttribution skipped in hook path templating**: Upstream commit 9a7bb22 added `processAttribution`/`getCommitAttribution` calls alongside hook path templating. These functions don't exist in the fork. Adopted the templating (`getConfigDirFromHome()`) but skipped attribution function calls.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Duplicate const hooksSrc after build-on-the-fly integration**
- **Found during:** Task 2 (cherry-pick e146b08 then 5154446)
- **Issue:** Applying build-on-the-fly (e146b08) then ESM package.json (5154446) created two `const hooksSrc` declarations in the same scope
- **Fix:** Rewrote the install.js section to merge both additions, placing build-on-the-fly before the hooksSrc declaration
- **Files modified:** `bin/install.js`
- **Verification:** No syntax errors, test suite passes
- **Committed in:** `160174b` and `e55bd2d`

**2. [Rule 1 - Bug] Stray `{}` file created during revert conflict resolution**
- **Found during:** Task 2 (cherry-pick 9d815d3)
- **Issue:** During conflict resolution, a stray file `{}\357\200\242` was created (likely from a conflict marker handling artifact)
- **Fix:** `rm -f '{}'*` to remove the stray file
- **Files modified:** N/A (file deleted before staging)
- **Verification:** `git status` showed no stray files after removal
- **Committed in:** Part of `f9eaf38`

**3. [Rule 1 - Bug] Branding leak in agents/gsd-roadmapper.md**
- **Found during:** Post-Task-2 branding pass
- **Issue:** `get-shit-done` reference at line 400 (`~/.claude/get-shit-done/templates/roadmap.md`)
- **Fix:** Replaced with `get-stuff-done` in `agents/gsd-roadmapper.md`
- **Files modified:** `agents/gsd-roadmapper.md`
- **Verification:** Branding check grep returned 0 results after fix
- **Committed in:** `5a268dd`

---

**Total deviations:** 3 auto-fixed (3 Rule 1 bugs)
**Impact on plan:** All auto-fixes were necessary for correctness. No scope creep.

## Issues Encountered

1. **"Revert 12 PRs" mega-commit (9d815d3)**: 26 files in conflict. Required per-file triage:
   - Protected files restored with `git checkout HEAD -- <file>`: `agents/gsd-verifier.md`, `bin/install-vibe.js`, `agents/general-purpose.md`, `opencode/` directory, `bin/install.js` (then manually merged Gemini additions)
   - README.md: fork wins on title/badges, upstream wins on Gemini uninstall section
   - Root cause analysis doc (gsd-verifier) was in the revert's delete list -- restored

2. **CHANGELOG.md conflict**: The conflict block contained 160 lines of upstream glittercowboy comparison URLs. Used a Node.js one-liner to remove the `=======` through `>>>>>>>` block programmatically.

3. **install.js conflict cascade**: Each installer commit (e146b08, 9d815d3, 5154446, 9a7bb22) built on the previous one, requiring careful integration ordering. The revert commit was the hardest -- 6 conflict blocks, some spanning 50+ lines.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- sync/v1.20.5 branch is ready for Batch 7 (v1.19.0..v1.20.0) cherry-picks
- Approach comparison document is initialized and can accept Batch 7 divergences
- Sync manifest tracks Batch 6 status; Batch 7 entries will be appended
- 565 tests passing provides confidence baseline for subsequent batches
- Concern: Batch 7+ will encounter the module split (gsd-tools.js into 11 modules) which is the highest-risk structural change in Phase 18

---
*Phase: 18-upstream-sync-execution*
*Completed: 2026-02-22*
