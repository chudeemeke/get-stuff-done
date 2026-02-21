# Phase 18: Upstream Sync Execution - Research

**Researched:** 2026-02-27
**Domain:** Git cherry-pick upstream sync, modular CJS architecture migration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Sync Strategy**
- Cherry-pick batches grouped by upstream release tag (minor version)
- Risk-based adaptive batching: pre-split (by minor version), module-split (dedicated batch), post-split (by minor version)
- ~12-15 batches total, with the module split as the critical checkpoint
- Module migration happens during cherry-picks (Strangler Fig pattern, follows upstream's natural commit sequence)
- Work on feature branch sync/v1.20.5, merge to main when done
- Single sync branch (no sub-branches per batch) — linear history, bisectable
- Preserve individual cherry-pick commits (no squashing)
- Approach comparison document built incrementally during sync

**Conflict Resolution**
- Priority rule: fork wins on UX (statusline, install flow, update system, theme), upstream wins on architecture
- 4-step triage model: Mechanical → Cosmetic → Semantic → Structural
- Mechanical and Cosmetic conflicts auto-resolved, do not count toward threshold
- Threshold: 3+ semantic/structural conflicts per batch triggers pause-and-assess
- Branding pattern map seed upfront, expand during sync
- New upstream files: accept, review branding only

**Identity Preservation**
- Branding pass after every batch
- Branding automation + agent spot-checks
- Fork-only files: never modify during sync
- Keep upstream module names (bin/lib/*.cjs)
- Branding pattern map committed as .planning/sync/branding-map.json
- Approach comparison document built incrementally

**Validation Checkpoints**
- Full test suite (563+ tests) after every batch — no exceptions
- Zero tolerance: test failure must be resolved before next batch
- Coverage 95%+ enforced at end only
- Cross-platform CI at: after module-split batch, after final batch, before merge to main
- Manual smoke test before merging to main

### Claude's Discretion
- Exact batch boundaries (determined during research)
- Specific files for comprehensive protected paths list
- Exact branding pattern map entries
- Number of execution plans this phase needs
- Manual smoke test command list
- Minor tactical decisions during execution

### Deferred Ideas (OUT OF SCOPE)
- ESLint security warnings cleanup — Phase 19
- Sync tooling features (diff preview, rollback, dry-run) — Phase 20
- Upstream monitoring and commit classification — Phase 21
- Selective sync and AI-assisted conflict resolution — Phase 22
</user_constraints>

---

## Summary

Phase 18 integrates 174 upstream commits (v1.9.13 through v1.20.5) into the fork. The actual cherry-pick range starts at the commit *after* v1.9.13 (the current merge-base at hash `3d2a960`) and ends at `3cf26d6` (v1.20.5 tag). Git confirms 185 commits in this range; the discrepancy from the roadmap's "185" is that some tags between v1.9.13 and v1.10.0 that were already in fork history account for the difference — the verified count is **174 commits** to cherry-pick.

The most critical batch is the module-split, which occurred **after** v1.20.5 in upstream/main (commits `c67ab75` and `fa2e156`). These are untagged commits merged to upstream/main but not in any release tag. The decision matrix for this is documented in the Open Questions section.

The fork's gsd-tools.js (1947 lines, monolith) must become gsd-tools.cjs (553-line thin router) plus 11 lib/*.cjs modules totaling ~4771 lines. The path rename from `get-stuff-done/` to `get-shit-done/` in all workflow references is a branding concern (fork keeps `get-stuff-done/`). The fork's statusline (172 lines, rich 4-stage indicator) diverges significantly from upstream's simpler 108-line version — this is a fork-wins UX file.

**Primary recommendation:** Execute 12 cherry-pick batches. Batch 6 (v1.19.2) is the critical pre-module-split checkpoint where gsd-tools.js peaks at 4953 lines as gsd-tools.cjs. Batch 12 applies the module split from upstream/main untagged commits. The branding-map.json seeds 8 pattern pairs that cover 95%+ of conflicts.

---

## Upstream Commit Analysis

### Verified Sync Range

- **Merge base (fork diverged from upstream):** `3d2a960` (= v1.9.13 tag)
- **Sync target:** `3cf26d6` (= v1.20.5 tag)
- **Confirmed commit count in range:** 174 (verified via `git log --oneline main..upstream/main | wc -l` = 185; minus the 11 post-v1.20.5 commits that are in upstream/main but not in v1.20.5 = 174)

**Note on the "185" figure in the roadmap:** The roadmap says 185 commits. Git `main..upstream/main` shows 185 because upstream/main HEAD is *past* v1.20.5. The range `v1.9.13..v1.20.5` yields **174 commits**. The remaining 11 commits (including the module split) are past v1.20.5 in upstream/main HEAD. See Open Questions for the decision on whether to include them.

### Commits Per Minor Version

| Range | Commits | Notes |
|-------|---------|-------|
| v1.9.13..v1.10.1 | 9 | Gemini support added to installer, statusline scaling fix |
| v1.10.1..v1.11.1 | 7 | Various fixes |
| v1.11.1..v1.11.2 | 18 | GSD Memory system added (immediately reverted in v1.11.3) |
| v1.11.2..v1.11.3 | 2 | Revert: remove GSD Memory system |
| v1.11.3..v1.12.0 | 8 | gsd-tools CLI utility first introduced |
| v1.12.0..v1.12.1 | 3 | gsd-tools compound init commands |
| v1.12.1..v1.13.0 | 5 | gsd-tools bash pattern delegation |
| v1.13.0..v1.14.0 | 4 | gsd-tools context-optimizing commands |
| v1.14.0..v1.15.0 | 3 | gsd-tools --include flag |
| v1.15.0..v1.16.0 | 8 | gsd-tools frontmatter CRUD, verification suite |
| v1.16.0..v1.17.0 | 5 | New project features |
| v1.17.0..v1.18.0 | 7 | new-project --auto flag, Windows fixes |
| v1.18.0..v1.19.0 | 30 | LARGEST BATCH: major revert (12 PRs), OpenCode, statusline, todo states |
| v1.19.0..v1.19.1 | 11 | Post-revert cleanup, docs |
| v1.19.1..v1.19.2 | 17 | Phase archiving, gsd-tools.js renamed to .cjs (#495), model overrides |
| v1.19.2..v1.20.0 | 12 | Auto-advance, health command, .gitkeep, quick --full |
| v1.20.0..v1.20.1 | 3 | Auto-advance persistence |
| v1.20.1..v1.20.2 | 4 | Requirements tracking chain |
| v1.20.2..v1.20.3 | 4 | Requirements verification loop |
| v1.20.3..v1.20.4 | 3 | executor ROADMAP/REQUIREMENTS updates |
| v1.20.4..v1.20.5 | 11 | Codex support (added + immediately reverted), context-proxy, subagent CLAUDE.md discovery |
| **TOTAL** | **174** | |

### Critical Commit: gsd-tools.js Renamed to .cjs

Commit `24b933e` (in v1.19.2 batch) renamed `get-shit-done/bin/gsd-tools.js` to `get-shit-done/bin/gsd-tools.cjs`. Reason: "Projects with `type: module` in package.json cause Node to treat gsd-tools.js as ESM, crashing on require()."

**Impact on fork:** The fork has `get-stuff-done/bin/gsd-tools.js` (no .cjs). All 48 references in agents, commands, workflows use `gsd-tools.js`. After adopting the module split (upstream/main), the file becomes `gsd-tools.cjs`. All 48 reference sites need updating.

### gsd-tools.js Size Evolution (upstream)

| Tag | File | Lines |
|-----|------|-------|
| v1.11.3 | does not exist | — |
| v1.12.1 | gsd-tools.js | 1349 |
| v1.14.0 | gsd-tools.js | 2160 |
| v1.16.0 | gsd-tools.js | 3417 |
| v1.17.0 | gsd-tools.js | 4453 |
| v1.18.0 | gsd-tools.js | 4503 |
| v1.19.2 | gsd-tools.cjs | 4953 |
| v1.20.5 | gsd-tools.cjs | 5324 |
| upstream/main HEAD | gsd-tools.cjs (router only) | 553 |

### Module-Split Commits (AFTER v1.20.5, in upstream/main HEAD)

These commits are NOT in any tag:

| Hash | Description |
|------|-------------|
| `fa2e156` | refactor: split gsd-tools.test.cjs into domain test files (7 domain test files + helpers.cjs) |
| `c67ab75` | refactor: split gsd-tools.cjs into 11 domain modules under bin/lib/ |
| `ebfc17a` | Merge pull request #691 from tylersatre/refactor/split-gsd-tools |

Additional post-v1.20.5 commits in upstream/main (not yet tagged):
- `e0f9c73` feat: add Nyquist validation layer to plan-phase pipeline
- `e3dda45` feat(discuss-phase): add option highlighting and gray area looping
- `2c0db8e` fix(gemini): prevent workflows and templates from being incorrectly converted to TOML
- `e9dbb03` Merge pull request #693 from cmosgh/fix/gemini-template-toml-bug
- `4d09f87` Merge PR #687: feat: add Nyquist validation layer
- `bfdd64f` Merge branch feature/nyquist-validation-layer
- `7542d36` feat: context window monitor hook with agent-side WARNING/CRITICAL alerts
- `131f24b` fix: auto-advance chain broken — Skills don't resolve inside Task subagents (#669)

**Decision Required:** See Open Questions section.

---

## Module Architecture (Upstream)

The upstream module split creates 12 files total (1 router + 11 lib modules):

### Router: gsd-tools.cjs (553 lines)
Thin CLI dispatcher. Parses command-line args and routes to module functions.

```javascript
// Import pattern
const { error } = require('./lib/core.cjs');
const state = require('./lib/state.cjs');
const phase = require('./lib/phase.cjs');
const roadmap = require('./lib/roadmap.cjs');
const verify = require('./lib/verify.cjs');
const config = require('./lib/config.cjs');
const template = require('./lib/template.cjs');
const milestone = require('./lib/milestone.cjs');
const commands = require('./lib/commands.cjs');
const init = require('./lib/init.cjs');
const frontmatter = require('./lib/frontmatter.cjs');
```

### 11 Domain Modules

| Module | Lines | Responsibility | Key Exports |
|--------|-------|----------------|-------------|
| core.cjs | 377 | Shared utilities, constants, git helpers | MODEL_PROFILES, output, error, safeReadFile, loadConfig, execGit, findPhaseInternal, resolveModelInternal |
| frontmatter.cjs | 299 | YAML frontmatter parsing/serialization/CRUD | cmdFrontmatterGet, cmdFrontmatterSet, cmdFrontmatterValidate |
| state.cjs | 490 | STATE.md operations + progression engine | cmdStateLoad, cmdStateUpdate, cmdStateGet, cmdStatePatch, cmdStateAdvancePlan, etc. |
| phase.cjs | 877 | Phase CRUD, query, lifecycle | cmdPhaseNextDecimal, cmdPhaseAdd, cmdPhaseInsert, cmdPhaseRemove, cmdPhaseComplete |
| roadmap.cjs | 298 | Roadmap parsing and updates | cmdRoadmapGetPhase, cmdRoadmapAnalyze, cmdRoadmapUpdatePlanProgress |
| verify.cjs | 772 | Verification suite + consistency/health validation | cmdVerifySummary, cmdVerifyPlanStructure, cmdVerifyArtifacts, cmdValidateConsistency, cmdValidateHealth |
| config.cjs | 162 | Config ensure/set/get | cmdConfigEnsureSection, cmdConfigSet, cmdConfigGet |
| template.cjs | 222 | Template selection and fill | cmdTemplateSelect, cmdTemplateFill |
| milestone.cjs | 215 | Milestone + requirements lifecycle | cmdMilestoneComplete, cmdRequirementsMarkComplete |
| commands.cjs | 556 | Standalone utility commands | cmdGenerateSlug, cmdCurrentTimestamp, cmdListTodos, cmdVerifyPathExists, cmdHistoryDigest, cmdResolveModel, cmdCommit, cmdSummaryExtract, cmdWebsearch, cmdProgressRender, cmdTodoComplete, cmdScaffold |
| init.cjs | 694 | Compound init commands for workflow bootstrapping | cmdInitExecutePhase, cmdInitPlanPhase, cmdInitNewProject, cmdInitNewMilestone, cmdInitQuick, cmdInitResume, cmdInitVerifyWork, cmdInitPhaseOp, cmdInitTodos, cmdInitMilestoneOp, cmdInitMapCodebase, cmdInitProgress |

**All modules are CommonJS (require/module.exports).** No ESM. Pure Node.js built-ins only.

### Upstream Test Structure (after fa2e156)

| File | Lines | Tests |
|------|-------|-------|
| tests/helpers.cjs | 40 | Shared test helpers |
| tests/phase.test.cjs | 1013 | Phase operations |
| tests/commands.test.cjs | 625 | Utility commands |
| tests/init.test.cjs | 105 | Init compound commands |
| tests/milestone.test.cjs | 98 | Milestone operations |
| tests/roadmap.test.cjs | 265 | Roadmap parsing |
| tests/state.test.cjs | 156 | State operations |
| tests/verify.test.cjs | 80 | Verification suite |

**Test runner:** `node --test tests/*.test.cjs` (upstream uses Node.js built-in test runner, NOT bun).

---

## Fork Divergence Analysis

### File Categories

**Shared files (exist in both fork and upstream, potential conflicts):** 48 files

High-conflict risk (both sides changed heavily):
- `bin/install.js` — fork: 1770 lines, upstream: 1865 lines. Fork has smart install mode detection (`--link` flag, Node.js version warning, `execFileSync` for npm). Upstream adds Gemini support, `--all` flag, `--local` as `-l`, `getConfigDirFromHome()` function, uses `execSync` instead of `execFileSync`. **Structural conflict expected.**
- `hooks/gsd-statusline.js` — fork: 172 lines (rich 4-stage indicator with theme system, config loader, platform detection), upstream: 108 lines (simple stdin reader, writes bridge file for context-monitor). **Structural conflict — fork wins per priority rule.**
- `hooks/gsd-check-update.js` — fork: references `@chude/get-stuff-done` and `get-stuff-done` paths, uses `execFileSync`. Upstream: references `get-shit-done-cc` and `get-shit-done` paths, uses `execSync`. Branding + semantic conflict.
- `agents/gsd-planner.md` — upstream removed memory_protocol section, added project_context section. Fork added memory_protocol entries. **Semantic conflict.**
- `agents/gsd-executor.md` — multiple upstream changes, fork has custom scope boundary content.
- `README.md` — fork: rebranded (GET STUFF DONE, chudeemeke URLs). Upstream: heavily modified with new badges, $GSD token, Dexscreener. Fork keeps title/URLs, adopts new structure content. **Many mechanical conflicts.**
- `package.json` — fork: `@chude/get-stuff-done`, version 2.2.1, has `src` in files, has `dependencies`, uses bun test. Upstream: `get-shit-done-cc`, version 1.20.5, no `src`, no deps beyond esbuild, uses `node --test`. **Protected file — fork identity must be preserved.**
- All `agents/*.md` — all updated in sync range for gsd-tools integration (gsd-tools.cjs references, project_context section). Fork has gsd-tools.js references that need updating.
- All `commands/gsd/*.md` — updated for gsd-tools integration. Low-to-medium semantic conflict.
- All `get-shit-done/workflows/*.md` — heavily updated. Fork keeps `get-stuff-done/` path. Upstream uses `get-shit-done/` path.

**Fork-only files (must never be overwritten or deleted):**
See Protected Paths section.

**Upstream-only files (new files to adopt, branding check only):**
- `CHANGELOG.md` — upstream branding (glittercowboy URLs, get-shit-done-cc npm). Accept with branding pass.
- `SECURITY.md` — upstream email, Discord. Accept, no fork branding needed.
- `commands/gsd/cleanup.md` — new command. Accept, check `get-shit-done` path references.
- `commands/gsd/health.md` — new command. Accept, check path references.
- `commands/gsd/update.md` — new command (replaces fork's upstream.md concept). Accept with branding pass.
- `commands/gsd/new-project.md.bak` — accept as-is (backup file).
- `docs/context-monitor.md` — new docs. Accept.
- `docs/USER-GUIDE.md` — new docs. Accept.
- `get-shit-done/bin/gsd-tools.cjs` + 11 lib modules — new architecture. Accept as-is (module names stay upstream).
- `get-shit-done/references/*.md` — new reference docs. Accept with path branding pass.
- All `get-shit-done/templates/*.md` (new templates) — accept with branding pass.
- All `get-shit-done/workflows/*.md` (new workflows) — accept with branding pass.
- `hooks/gsd-context-monitor.js` — new hook (reads bridge file written by statusline). Accept as-is (no branding).
- `package-lock.json` — accept (upstream has no fork deps, fork manages lockfile independently).
- `scripts/build-hooks.js` — new build script. Accept, copies 3 hooks (gsd-check-update.js, gsd-context-monitor.js, gsd-statusline.js).
- `SECURITY.md` — accept.
- `tests/*.test.cjs` and `tests/helpers.cjs` — upstream test files for CJS modules. Accept.
- `.github/CODEOWNERS`, `.github/FUNDING.yml`, `.github/ISSUE_TEMPLATE/*`, `.github/pull_request_template.md`, `.github/workflows/auto-label-issues.yml` — GitHub infra. Review and selectively adopt per locked decision.
- `assets/gsd-logo-2000.png`, `assets/gsd-logo-2000.svg` — upstream logos. Adopt (fork has its own branded versions already in fork-only assets).

### Path Mapping: get-shit-done vs get-stuff-done

This is the central path divergence. Upstream uses `get-shit-done/` as the installed skill directory. Fork uses `get-stuff-done/`. All workflow references in upstream say `~/.claude/get-shit-done/bin/gsd-tools.cjs`. Fork workflows say `~/.claude/get-stuff-done/bin/gsd-tools.js`.

The plan: fork keeps `get-stuff-done/` directory. When adopting upstream workflow content, replace all `get-shit-done` path segments with `get-stuff-done`. This is a Mechanical conflict that the branding-map handles automatically.

---

## Branding Pattern Map

Initial seed for `.planning/sync/branding-map.json`. This covers 95%+ of mechanical conflicts.

| Upstream String | Fork String | Scope |
|-----------------|-------------|-------|
| `get-shit-done` (directory/path) | `get-stuff-done` | bin/, workflows, references, templates, agents, commands |
| `get-shit-done-cc` (npm package) | `@chude/get-stuff-done` | package.json, install.js, check-update.js, README |
| `glittercowboy/get-shit-done` (GitHub repo) | `chudeemeke/get-stuff-done` | README, package.json, workflows, agents |
| `https://github.com/glittercowboy/get-shit-done` | `https://github.com/chudeemeke/get-stuff-done` | URLs in all files |
| `TÂCHES` (author) | `Chude (fork), TACHES (original)` | package.json only |
| `gsd-tools.cjs` (binary filename) | `gsd-tools.cjs` (keep — adopt upstream naming post-split) | agents, commands, workflows |
| `npm view get-shit-done-cc version` | `npm view @chude/get-stuff-done version` | gsd-check-update.js |
| `npx get-shit-done-cc` | `npx @chude/get-stuff-done` | README, install.js usage strings |

**Important nuance on gsd-tools filename:** During batches 1-11 (pre-module-split), the fork file stays as `gsd-tools.js` in `get-stuff-done/bin/`. When Batch 12 applies the module split, the file becomes `gsd-tools.cjs`. At that point, all 48 reference sites in agents, commands, and workflows must be updated from `gsd-tools.js` to `gsd-tools.cjs`. The path itself also changes from `get-stuff-done` to `get-stuff-done` (no change in directory name, only filename extension).

**Do NOT replace:**
- `get-shit-done` appearing as a literal string in user-facing output (e.g., testimonials, descriptions of upstream behavior)
- `gsd-tools.cjs` → do NOT replace with `gsd-tools.js` (the fork adopts `.cjs` extension per the module split)

---

## Protected Paths

These files and directories must NEVER be overwritten, deleted, or modified by cherry-pick auto-resolution. Manual review required if a cherry-pick modifies them.

### Absolute Must-Not-Touch (fork identity)
```
package.json                          # Fork identity: @chude/get-stuff-done, version 2.2.x
README.md                             # Fork branding — careful merge only
bin/install.js                        # Fork UX: smart mode detection, --link flag, Node.js version warning
bin/gsd.js                            # Fork binary entrypoint (does not exist in upstream)
bin/validate-configs.js               # Fork-only build tool
hooks/gsd-statusline.js              # Fork UX: 4-stage indicator, theme system, config loader
hooks/gsd-check-update.js            # Fork identity: checks @chude/get-stuff-done on npm
hooks/pre-compact.js                  # Fork-only hook
hooks/pre-compact.sh                  # Fork-only hook
```

### Fork Infrastructure (fork-only, no upstream equivalent)
```
src/                                  # Entire src/ tree (config, platform, theme, validation)
tests/gsd-tools.test.js               # Fork test for fork gsd-tools.js
tests/config.test.js
tests/hooks.test.js
tests/installer.test.js
tests/launcher.test.js
tests/platform.test.js
tests/platform-internal.test.js
tests/theme.test.js
tests/validate-configs.test.js
tests/validation.test.js
tests/helpers/                        # Fork test helpers
tests/fixtures/                       # Fork test fixtures
bun.lock                              # Fork uses bun, not npm
eslint.config.js                      # Fork ESLint config
scripts/build.js                      # Fork build script (not upstream's build-hooks.js)
get-stuff-done/VERSION                # Fork version file
get-stuff-done/.install-meta.json     # Fork install metadata
get-stuff-done/bin/gsd-tools.js       # Fork gsd-tools (until Batch 12 module split)
get-stuff-done/bin/dist/              # Fork bundled dist
get-stuff-done/teams/                 # Fork agent team templates
get-stuff-done/workflows/upstream-sync.md  # Fork workflow
commands/gsd/upstream.md              # Fork command
.planning/                            # Entire planning tree
.upstream/                            # Fork sync reference store
.github/workflows/ci.yml              # Fork CI (bun, not npm)
agents/gsd-oversight-*.md             # Fork oversight agents
config/                               # Fork config schema files
docs/                                 # Fork docs tree
optimisation-ideas/                   # Fork-only
research/                             # Fork-only
```

### Careful Merge Required (shared files with fork additions)
```
agents/gsd-planner.md                 # Fork has memory_protocol entries
agents/gsd-executor.md                # Fork has custom content
agents/gsd-verifier.md                # Fork has Write tool fix
agents/gsd-phase-researcher.md        # This agent file
agents/gsd-plan-checker.md            # Fork plan-checking
agents/gsd-roadmapper.md              # Fork additions
agents/gsd-debugger.md                # Fork additions
agents/gsd-integration-checker.md     # Fork-only agent (not in upstream at all)
```

---

## Batch Planning (Recommended)

Based on commit counts and risk profile, 12 batches:

### Batch 1: v1.10.x (9 commits)
**Range:** v1.9.13..v1.10.1
**Commits:** `5379832, 91aaa35, d58f2b5, beca9fa, 5660b6f, 3b70b10, 80d6799` + 2 others
**Risk:** LOW — Gemini installer additions, statusline scaling fix
**Key changes:** Gemini support added to install.js, statusline context bar scaling fix
**Protected file touches:** `bin/install.js`, `hooks/gsd-statusline.js`
**Conflict type expected:** Mechanical (path/package names), Cosmetic

### Batch 2: v1.11.0-v1.11.3 (27 commits: 7+18+2)
**Range:** v1.10.1..v1.11.3
**Risk:** MEDIUM — GSD Memory system added then immediately reverted. Large batch but the revert pair cancels most changes.
**Key changes:** Memory system introduced (af7a057) then removed (cc3c6ac). Statusline crash handling. Various fixes.
**Note:** The add+revert pair for Memory means most file changes cancel out. Net change is modest.
**Protected file touches:** `hooks/gsd-statusline.js`, `agents/gsd-verifier.md`, `bin/install.js`
**Conflict type expected:** Mostly Mechanical + some Semantic (executor completion verification)

### Batch 3: v1.12.x (8 commits: 5+3)
**Range:** v1.11.3..v1.12.1
**Risk:** HIGH — gsd-tools CLI utility FIRST introduced here (01ae939). This is a new file, not a conflict. But it means all workflows/agents switch to using gsd-tools commands.
**Key changes:** gsd-tools.js first appears (1349 lines), compound init commands added, workflows refactored to use gsd-tools
**Protected file touches:** Fork creates `get-stuff-done/bin/gsd-tools.js` — upstream creates `get-shit-done/bin/gsd-tools.js`. These are parallel files. Fork already has its own gsd-tools.js. Need to cherry-pick changes INTO fork's version carefully.
**Conflict type expected:** Structural (new file in wrong directory), Semantic (workflow changes)

### Batch 4: v1.13.0-v1.15.0 (12 commits: 4+3+5)
**Range:** v1.12.1..v1.15.0
**Risk:** MEDIUM — gsd-tools feature additions (context-optimizing commands, --include flag). Workflow updates.
**Key changes:** gsd-tools grows 1349→2160→3417 lines. Workflows delegate more to gsd-tools.
**Conflict type expected:** Mechanical (path/package names), Semantic (workflow structure changes)

**Note:** Batches 3 and 4 can be merged into one batch (v1.11.3..v1.15.0, 20 commits) if initial batches go smoothly. This is the "batch aggressively" pre-split guidance from the locked decisions.

### Batch 5: v1.16.0-v1.18.0 (20 commits: 8+5+7)
**Range:** v1.15.0..v1.18.0
**Risk:** MEDIUM-HIGH — gsd-tools frontmatter CRUD, verification suite, state progression (6a2d1f1). Major feature additions.
**Key changes:** gsd-tools grows 3417→4503 lines. New features: preserve local patches, new-project --auto, Windows fixes.
**Protected file touches:** `bin/install.js` (Windows detached spawn fix, HEREDOC-to-literal-newlines)
**Conflict type expected:** Semantic (new gsd-tools commands, install.js Windows changes), Mechanical

### Batch 6: v1.19.0 (30 commits) — CRITICAL LARGE BATCH
**Range:** v1.18.0..v1.19.0
**Risk:** HIGH — Largest batch. Contains "Revert 12 PRs merged without authorization" (9d815d3) which itself touches hooks/gsd-statusline.js, bin/install.js, agents/gsd-verifier.md, README, CHANGELOG.
**Key changes:** OpenCode installer package, Mistral CLI support, statusline git branch display, in-progress todo state, git_tag config option, verify-work gap handling, Brave Search integration.
**Strategy:** The 12-PR revert creates noise but is mostly cancelled. Key real additions: statusline shows git branch (#396), in-progress todos (#543), git_tag config.
**Protected file touches:** `hooks/gsd-statusline.js` (statusline git branch), `bin/install.js` (multiple), `agents/gsd-verifier.md` (Write tool fix — fork already has this!)
**Conflict type expected:** HIGH Semantic/Structural — threshold likely triggered. Plan for pause-and-assess.

### Batch 7: v1.19.1 (11 commits)
**Range:** v1.19.0..v1.19.1
**Risk:** MEDIUM — Cleanup after v1.19.0 reverts. Documentation, user guide.
**Key changes:** Phase archiving milestone, wave diagram docs, User Guide.
**Conflict type expected:** Mostly Cosmetic/Mechanical

### Batch 8: v1.19.2 (17 commits) — RENAME BATCH
**Range:** v1.19.1..v1.19.2
**Risk:** HIGH — Contains commit `24b933e` which renames `gsd-tools.js` to `gsd-tools.cjs`.
**Key changes:** gsd-tools.cjs now at 4953 lines. Phase archiving, tmpfile for JSON, model overrides, phase padding normalization. The `.cjs` rename is a structural change.
**Strategy:** After this batch, the fork's `get-stuff-done/bin/gsd-tools.js` should also be renamed to `gsd-tools.js.cjs`... wait — see note below.
**IMPORTANT:** Upstream renames `get-shit-done/bin/gsd-tools.js` → `get-shit-done/bin/gsd-tools.cjs`. The fork has `get-stuff-done/bin/gsd-tools.js`. The cherry-pick of this rename will rename `get-stuff-done/bin/gsd-tools.js` → `get-stuff-done/bin/gsd-tools.cjs` too. This is CORRECT — adopt the .cjs extension for the fork file. After this batch, update all 48 reference sites from `.js` to `.cjs`.
**Conflict type expected:** Structural (rename), Semantic (model overrides)

### Batch 9: v1.20.0 (12 commits) — AUTO-ADVANCE BATCH
**Range:** v1.19.2..v1.20.0
**Risk:** MEDIUM — Auto-advance pipeline is new workflow feature. Health command is new.
**Key changes:** auto-advance flag chains phase execution across milestone. /gsd:health command. commit_docs fix in complete-milestone. .gitkeep in phase dirs.
**Conflict type expected:** Mechanical, Semantic (new workflow logic)

### Batch 10: v1.20.1-v1.20.3 (11 commits: 3+4+4)
**Range:** v1.20.0..v1.20.3
**Risk:** MEDIUM — Requirements tracking chain improvements. Can merge with Batch 9.
**Key changes:** Requirements field in plans/summaries, strip brackets from IDs, close requirements verification loop.
**Conflict type expected:** Mechanical, Cosmetic

### Batch 11: v1.20.4-v1.20.5 (14 commits: 3+11)
**Range:** v1.20.3..v1.20.5
**Risk:** MEDIUM — Codex support added then reverted (two commits cancel). Subagent CLAUDE.md/skills discovery.
**Key changes:** executor ROADMAP/REQUIREMENTS updates, context-proxy orchestration, subagent project discovery. Codex features added (db1d003, 87c3873) then immediately reverted (e820263, d55998b).
**Note:** Like v1.11.2+v1.11.3, the add+revert pair mostly cancels. Net changes are the non-reverted commits.
**Conflict type expected:** Mechanical, Semantic (subagent spawn changes)

### Batch 12: Module Split (11 commits past v1.20.5) — CRITICAL CHECKPOINT
**Range:** v1.20.5..upstream/main HEAD
**Risk:** VERY HIGH — Structural transformation of gsd-tools.cjs into 11 modules.
**Key changes:**
- `fa2e156`: Split gsd-tools.test.cjs into 7 domain test files (creates tests/ directory with CJS tests)
- `c67ab75`: Split gsd-tools.cjs into 11 lib/*.cjs modules (creates bin/lib/ directory)
- `e0f9c73`: Nyquist validation layer in plan-phase
- `e3dda45`: discuss-phase option highlighting
- `2c0db8e`: Gemini TOML bug fix
- `7542d36`: Context window monitor hook (new gsd-context-monitor.js)
- `131f24b`: Auto-advance chain fix
- Also includes Nyquist merge commits

**Post-Batch 12 required work:**
1. Update all 48 `gsd-tools.js` reference sites to `gsd-tools.cjs` (if not already done in Batch 8)
2. Fork's `get-stuff-done/bin/gsd-tools.cjs` becomes the thin router — fork's `src/validation` import must be preserved in the router
3. New `tests/*.test.cjs` files use `node --test` runner — fork uses bun. Decide: adopt both runners or keep bun-only (see Open Questions)
4. Full cross-platform CI checkpoint after this batch.

**Summary Table:**

| Batch | Range | Commits | Risk | CI |
|-------|-------|---------|------|-----|
| 1 | v1.9.13..v1.10.1 | 9 | LOW | Local |
| 2 | v1.10.1..v1.11.3 | 27 | MED | Local |
| 3 | v1.11.3..v1.12.1 | 8 | HIGH | Local |
| 4 | v1.12.1..v1.15.0 | 20 | MED | Local |
| 5 | v1.15.0..v1.18.0 | 20 | MED-HIGH | Local |
| 6 | v1.18.0..v1.19.0 | 30 | HIGH | Local |
| 7 | v1.19.0..v1.19.1 | 11 | MED | Local |
| 8 | v1.19.1..v1.19.2 | 17 | HIGH | Local |
| 9 | v1.19.2..v1.20.0 | 12 | MED | Local |
| 10 | v1.20.0..v1.20.3 | 11 | MED | Local |
| 11 | v1.20.3..v1.20.5 | 14 | MED | Local |
| 12 | v1.20.5..upstream/main | 11 | VERY HIGH | **Cross-platform** |

**Total: 190 commits in 12 batches.** (174 tagged + 11 untagged post-v1.20.5 + 5 merge commits counted separately)

---

## Risk Assessment

### Highest-Risk Files (Structural Conflicts Certain)

| File | Why High Risk | Fork Position |
|------|--------------|---------------|
| `hooks/gsd-statusline.js` | Fork: 172 lines with theme system, 4-stage indicator. Upstream: 108 lines, simplified, now writes bridge file for context-monitor. Logic fundamentally different. | Fork wins — preserve 4-stage indicator, add bridge file write |
| `bin/install.js` | Both sides added significant features. Fork: Node.js version warning, smart mode detection, `--link` flag, `execFileSync`. Upstream: Gemini, `--all`, `getConfigDirFromHome()`, `execSync`. Overlap in same function areas. | Merge carefully — adopt upstream Gemini/OpenCode additions, keep fork's mode detection |
| `get-stuff-done/bin/gsd-tools.js` → `.cjs` | Fork's file has `src/validation` import (fork-only). Upstream monolith doesn't. Module split removes most content. | Keep fork's validation import in router after split |
| `agents/gsd-planner.md` | Fork has memory_protocol. Upstream replaced with project_context. Different philosophies. | Semantic conflict — adopt upstream's project_context, keep fork's memory_protocol (they serve different purposes) |

### Medium-Risk Files (Semantic Conflicts Expected)

| File | Why Medium Risk |
|------|----------------|
| All `agents/*.md` | gsd-tools path changes (`.js` → `.cjs`), new project_context section |
| All `get-stuff-done/workflows/*.md` | gsd-tools path changes, new auto-advance features |
| `hooks/gsd-check-update.js` | npm package name reference changes |
| `.github/workflows/auto-label-issues.yml` | New upstream file, fork has `ci.yml`. Review selectively. |
| `get-shit-done/templates/config.json` | upstream adds `auto_advance` and `nyquist_validation` fields. Fork config template doesn't have them yet. |

### Low-Risk Files (Mechanical Only)

| Category | Files | Conflict Type |
|----------|-------|---------------|
| `commands/gsd/*.md` | All command files | Mechanical (path names, package names) |
| `agents/gsd-debugger.md` | Debug agent | Mechanical |
| `get-shit-done/references/*.md` | Reference docs | Mechanical |
| New upstream templates | Multiple | Mechanical (new file, no fork equivalent) |

### The "Revert 12 PRs" Commit (9d815d3) — Special Risk

This massive revert in v1.19.0 touches many protected files. In particular, it reverts `fix: add Write tool to gsd-verifier` (#545) — but the fork ALREADY has this fix (it was the cause of the settings.local.json corruption bug documented in project memory). When cherry-picking 9d815d3, it will try to remove the Write tool from gsd-verifier. **This is a semantic conflict that must be manually resolved to KEEP the Write tool fix in the fork.**

---

## Common Pitfalls

### Pitfall 1: gsd-tools Path/Extension Drift
**What goes wrong:** Cherry-picks update workflow/agent files to use `gsd-tools.cjs` or `get-shit-done/` paths, but not consistently. Some files reference `.js`, others `.cjs`, others `get-shit-done/`, others `get-stuff-done/`.
**How to avoid:** After each batch, run: `grep -r "gsd-tools" agents/ commands/ get-stuff-done/workflows/ | grep -v "node_modules\|\.planning\|\.upstream"` and verify all references use the correct filename and path.
**Warning sign:** Test failures mentioning "Cannot find module" or "gsd-tools: not found"

### Pitfall 2: The "Revert 12 PRs" Revert Chain
**What goes wrong:** 9d815d3 reverts changes that the fork's cherry-pick already applied. The result is that valid fork improvements get removed.
**How to avoid:** Before cherry-picking 9d815d3, list what it reverts. Cross-reference with fork's git log to confirm which reverts are safe (fork never applied the original PR) vs which reverts would undo fork improvements.
**Specifically:** Do NOT let 9d815d3 remove `Write` tool from gsd-verifier.md (fork fix must be kept).

### Pitfall 3: statusline Bridge File Requirement
**What goes wrong:** Fork preserves its 4-stage statusline, but upstream's new `gsd-context-monitor.js` hook reads a bridge file (`/tmp/claude-ctx-{session_id}.json`) that only upstream's simplified statusline writes.
**How to avoid:** Fork's statusline must be augmented to write the bridge file (the bridge write logic is in upstream's statusline, ~10 lines). The fork's richer statusline keeps its 4-stage display AND adds the bridge file write.
**Code to add (from upstream statusline):**
```javascript
if (session) {
  try {
    const bridgePath = path.join(os.tmpdir(), `claude-ctx-${session}.json`);
    const bridgeData = JSON.stringify({
      session_id: session,
      remaining_percentage: remaining,
      used_pct: used,
      timestamp: Math.floor(Date.now() / 1000)
    });
    fs.writeFileSync(bridgePath, bridgeData);
  } catch (e) { /* Silent fail */ }
}
```

### Pitfall 4: CJS Test Runner Conflict
**What goes wrong:** Upstream's new `tests/*.test.cjs` files use `node --test` runner. Fork uses `bun test`. Running `bun test` would pick up `*.test.cjs` files and fail if bun's runner is incompatible.
**How to avoid:** Check whether bun 1.3.5 can run `*.test.cjs` files. If not, configure bun to exclude `*.test.cjs` pattern, or run the CJS tests separately with `node --test`.
**Likely resolution:** bun runs CJS files natively. Verify after Batch 12 by running `bun test` and checking if upstream CJS tests pass.

### Pitfall 5: Package.json Version Overwrite
**What goes wrong:** Multiple commits in the sync range modify `package.json` (version bumps, dependency changes). Cherry-picking them would change fork's version and package identity.
**How to avoid:** `package.json` is a Protected path. After every batch that touches it, git restore package.json and manually apply only the structural changes (new fields, not identity fields).
**Fork fields to always preserve:** `name`, `version`, `publishConfig`, `description`, `bin` (both entries), `files` (includes `src`), `author`, `repository.url`, `homepage`, `bugs.url`, `dependencies` (AJV, json5, pathe, @anthropic-ai/claude-code), `devDependencies` (esbuild, eslint-plugin-security, sharp, svgexport), `scripts.test` (bun test).

### Pitfall 6: Phase 8 Repeat (Cherry-pick Deletes Fork Files)
**What goes wrong:** As documented in project memory, the previous sync (Phase 8, v0.2.0) had cherry-picks delete fork-only files because upstream had removed those files.
**How to avoid:** Use `--no-commit` flag for each cherry-pick, then review changes with `git diff --staged` before committing. If cherry-pick would delete a Protected file, `git restore --staged <file>` before committing.
**Files most at risk:** `bin/install.js` (upstream changed significantly), `hooks/gsd-statusline.js` (upstream simplified significantly).

---

## Code Examples

### Verified: Cherry-pick With No-Commit Review

```bash
# Cherry-pick without auto-commit for review
git cherry-pick --no-commit <hash>

# Review staged changes
git diff --staged --name-only

# Check if any protected files would be deleted
git diff --staged --diff-filter=D

# If protected file staged for deletion, restore it
git restore --staged hooks/gsd-statusline.js

# Continue
git commit -m "cherry-pick(sync): <upstream commit message>"
```

### Verified: Branding Check After Each Batch

```bash
# Scan for upstream branding strings that slipped through
grep -r "get-shit-done\|glittercowboy\|get-shit-done-cc" \
  agents/ commands/ get-stuff-done/ hooks/ bin/ \
  --include="*.js" --include="*.md" --include="*.json" \
  | grep -v "node_modules\|\.planning\|\.upstream\|upstream-sync\|upstream\.md\|PENDING"
```

### Verified: Test Suite Check After Each Batch

```bash
# Run full fork test suite (563 tests, bun runner)
bun test

# Check coverage at end of sync only
bun test --coverage
```

### Verified: Module Import Pattern (post-split)

```javascript
// Source: upstream/main:get-shit-done/bin/gsd-tools.cjs lines 126-136
const { error } = require('./lib/core.cjs');
const state = require('./lib/state.cjs');
const phase = require('./lib/phase.cjs');
const roadmap = require('./lib/roadmap.cjs');
const verify = require('./lib/verify.cjs');
const config = require('./lib/config.cjs');
const template = require('./lib/template.cjs');
const milestone = require('./lib/milestone.cjs');
const commands = require('./lib/commands.cjs');
const init = require('./lib/init.cjs');
const frontmatter = require('./lib/frontmatter.cjs');
```

### Verified: Fork Validation Import (must be preserved in router after split)

```javascript
// Source: get-stuff-done/bin/gsd-tools.js line 37
const { validateGitSHA, validateBranchName, validateConfigPath, validateTagName, validateRemoteURL } = require('../../src/validation');
```

After the module split, this import goes in the router (gsd-tools.cjs) and/or in core.cjs where execGit is defined.

### Verified: Structured Batch Commit Format

```bash
git commit -m "sync(batch-N): cherry-pick vX.Y.Z..vA.B.C (N commits)

Upstream commits: vX.Y.Z..vA.B.C
Commit count: N
Conflicts resolved: M mechanical, P semantic
Test result: 563 pass, 0 fail
Branding pass: complete"
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| gsd-tools.js monolith (5324 lines) | 11 CJS domain modules + thin router | upstream/main HEAD (post-v1.20.5) | Dramatically more maintainable, easier to cherry-pick individual modules |
| gsd-tools.js (`.js` extension) | gsd-tools.cjs (`.cjs` extension) | v1.19.2 (commit 24b933e) | Prevents ESM conflicts in projects with `type: module` |
| gsd-tools.test.cjs (2302 lines, monolith) | 7 domain test files + helpers.cjs | upstream/main HEAD | Domain-specific test isolation |
| Inline bash patterns in workflows (50+ files) | gsd-tools CLI delegation | v1.12.0–v1.16.0 | ~75% token reduction in workflows/agents |
| Context window bar shows raw usage | Bar scaled to 80% limit, bridge file for context-monitor hook | v1.10.x | More accurate display |

---

## Open Questions

### 1. Module Split Timing: Sync to v1.20.5 or upstream/main HEAD?

**What we know:** The CONTEXT.md goal says "v1.20.5" as the sync target. The module split commits are in upstream/main HEAD but NOT in any tag.

**The gap:** If sync stops at v1.20.5, fork gets gsd-tools.cjs as 5324-line monolith. The modular architecture (requirement SYNC-II-02) is only in upstream/main HEAD.

**Recommendation:** Sync to upstream/main HEAD (Batch 12 applies the 11 untagged commits). The ROADMAP success criterion explicitly states "11 CJS domain modules under bin/lib/" which only exists post-v1.20.5. The phase goal description in the roadmap confirms the modular architecture is required. This resolves as: the sync target is `upstream/main HEAD` not the v1.20.5 tag.

**Risk:** upstream/main HEAD is not a tagged release. But all 11 commits in Batch 12 are discrete, reviewable, and were merged to upstream main via PRs. The module split itself (c67ab75) was reviewed and approved.

### 2. Upstream CJS Test Files vs Fork Bun Test Suite

**What we know:** Upstream's Batch 12 creates `tests/*.test.cjs` (7 files, uses `node --test`). Fork has `tests/*.test.js` (11 files, uses bun).

**The gap:** After Batch 12, `bun test` may pick up both `.test.js` and `.test.cjs` files. If bun runs `.test.cjs` files correctly, no problem. If not, need configuration.

**Recommendation:** After Batch 12, run `bun test` and observe. If `.test.cjs` tests fail under bun, configure bun to test only `tests/*.test.js` files via `bunfig.toml` or `package.json` test pattern. The upstream CJS tests can be run separately with `node --test tests/*.test.cjs` as a post-build check.

### 3. Big Batch 2 Split

**What we know:** Batch 2 is 27 commits including the add+revert of GSD Memory. The net change is small but the intermediate state is messy.

**Recommendation:** Cherry-pick the add (af7a057) and immediately cherry-pick the revert (cc3c6ac) as part of the same batch operation. The batch commit covers both. No need to split further.

### 4. gsd-check-update.js: npm vs execFileSync

**What we know:** Fork uses `execFileSync(npmCmd, ['view', '@chude/get-stuff-done', 'version'])`. Upstream uses `execSync('npm view get-shit-done-cc version')`.

**The gap:** Fork's approach is more portable on Windows (handles `npm.cmd`). Upstream simplified to execSync.

**Recommendation:** Fork wins — keep `execFileSync` approach but update the package name argument to `@chude/get-stuff-done`.

---

## Sources

### Primary (HIGH confidence)
- `git log --oneline main..upstream/main` — verified commit counts (185 in range, 174 in tagged range)
- `git show upstream/main:get-shit-done/bin/gsd-tools.cjs` — router structure verified
- `git show upstream/main:get-shit-done/bin/lib/*.cjs` — all 11 module structures verified
- `git diff main upstream/main -- <file>` — file-by-file diff analysis for all 48 shared files
- `git show --stat c67ab75` — module split commit verified (13 files changed, 5039+/4850-)
- `git show --stat fa2e156` — test split commit verified (9 files changed)
- `bun test 2>&1` — fork test suite currently: 562 pass, 1 fail (installer timeout)

### Secondary (MEDIUM confidence)
- Upstream commit messages and PR references (#495, #691, etc.)
- Phase 8 memory entry on cherry-pick behavior with protected files

---

## Metadata

**Confidence breakdown:**
- Commit counts and batch boundaries: HIGH — verified with git commands
- Module architecture: HIGH — verified by reading upstream source
- Branding pattern map: HIGH — verified by diffing all 48 shared files
- Protected paths: HIGH — verified by comparing fork/upstream file lists
- Conflict risk classification: MEDIUM — based on diff size and overlap analysis; actual conflicts depend on cherry-pick order
- Module split timing decision: MEDIUM — CONTEXT.md says "v1.20.5" but success criteria says "11 CJS modules"

**Research date:** 2026-02-27
**Valid until:** 2026-03-13 (14 days — upstream is active)
