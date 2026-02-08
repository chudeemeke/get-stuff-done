# Upstream Sync Commit Analysis

## Summary Statistics

**Total commits to sync:** 72 (7 merge commits excluded)

**By type:**
- Features: 14
- Bugfixes: 22
- Refactors: 3
- Documentation: 26
- Chores: 6

**Conflict risk:**
- None: 13
- Low: 31
- High: 28

**Protected paths:**
- Touches protected paths: 1
- Touches get-shit-done/ (needs branding rename): 27

**Fork point:** 3d2a960
**Target:** v1.18.0

---

## v1.9.14

| SHA | Message | Type | Files | Conflict | Protected | GSD |
|-----|---------|------|-------|----------|-----------|-----|
| 197800e | feat(git): add unified branching strategy option | feature | 4 | low | no | yes |
| 339e911 | chore: remove GitHub Actions release workflow | chore | 1 | none | no | no |
| 87b2cd0 | fix: scale context bar to show 100% at actual 80% limit | bugfix | 1 | high | no | no |
| 5379832 | feat: add Gemini support to installer (#301) | feature | 2 | high | no | no |
| 91aaa35 | chore: remove dead code from Gemini PR | chore | 1 | high | no | no |
| d58f2b5 | docs: update README and changelog for v1.9.14 | docs | 2 | low | no | no |

## v1.10.0

| SHA | Message | Type | Files | Conflict | Protected | GSD |
|-----|---------|------|-------|----------|-----------|-----|
| beca9fa | 1.10.0 | docs | 3 | high | no | no |

## v1.10.1

| SHA | Message | Type | Files | Conflict | Protected | GSD |
|-----|---------|------|-------|----------|-----------|-----|
| 5660b6f | fix: Gemini CLI agent loading errors (#347) | bugfix | 5 | high | no | no |
| 3b70b10 | docs: update changelog for v1.10.1 | docs | 1 | low | no | no |
| 80d6799 | 1.10.1 | docs | 2 | high | no | no |

## v1.11.0

| SHA | Message | Type | Files | Conflict | Protected | GSD |
|-----|---------|------|-------|----------|-----------|-----|
| 5ee22e6 | feat(git): add squash merge option for branching strategies | feature | 2 | none | no | yes |
| 3257139 | fix(plan-phase): pass CONTEXT.md to all downstream agents | bugfix | 2 | low | no | no |
| f3db981 | docs: update changelog and README for v1.11.0 | docs | 2 | low | no | no |
| d8840c4 | 1.11.0 | docs | 3 | high | no | no |

## v1.11.1

| SHA | Message | Type | Files | Conflict | Protected | GSD |
|-----|---------|------|-------|----------|-----------|-----|
| b5ca9a2 | 1.11.1 | docs | 2 | high | no | no |

## v1.11.2

| SHA | Message | Type | Files | Conflict | Protected | GSD |
|-----|---------|------|-------|----------|-----------|-----|
| 8d2651d | fix: remove broken gsd-gemini link (404) | bugfix | 1 | low | no | no |
| d165496 | feat(install): respect attribution.commit setting (compatible opencode) (#286) | feature | 1 | high | no | no |
| 2347fca | fix: clarify ASCII box-drawing vs text content with diacritics (#289) | bugfix | 4 | low | no | yes |
| 4267c6c | fix: respect parallelization config setting (#379) | bugfix | 1 | none | no | yes |
| ecbc692 | fix(#326): enforce context fidelity in planning pipeline (#391) | bugfix | 4 | low | no | yes |
| 074b2bc | fix(#330): update statusline.js reference during install (#392) | bugfix | 1 | high | no | no |
| 9d7ea9c | fix: statusline crash handling, color validation, git staging rules | bugfix | 5 | high | no | no |
| 161aa61 | fix: researcher agent always writes RESEARCH.md regardless of commit_docs | bugfix | 1 | none | no | no |
| 8384575 | fix: update command respects local vs global install | bugfix | 1 | low | no | no |
| f380275 | fix(executor): add completion verification to prevent hallucinated success (#315) | bugfix | 4 | low | no | yes |
| 4dff989 | fix(settings): auto-create config.json when missing (#264) | bugfix | 2 | low | no | no |
| f53011c | fix(#429): prevent API keys from being committed via map-codebase | bugfix | 3 | low | no | yes |
| af7a057 | feat: add GSD Memory cross-project knowledge system | feature | 120 | high | no | yes |
| 75fb063 | docs: update changelog for v1.11.2 | docs | 1 | low | no | no |
| 7c42763 | 1.11.2 | docs | 2 | high | no | no |

## v1.11.3

| SHA | Message | Type | Files | Conflict | Protected | GSD |
|-----|---------|------|-------|----------|-----------|-----|
| cc3c6ac | revert: remove GSD Memory system (not ready for release) | chore | 120 | high | no | yes |
| ddc736e | v1.11.3 - revert memory system | other | 2 | high | no | no |

## v1.12.0

| SHA | Message | Type | Files | Conflict | Protected | GSD |
|-----|---------|------|-------|----------|-----------|-----|
| 01ae939 | feat(gsd-tools): add CLI utility for command extraction | feature | 1 | none | no | yes |
| 8f26bfa | refactor: extract check-todos, add-phase, update to thin orchestrators | refactor | 6 | low | no | yes |
| d2623e0 | refactor: extract settings, add-todo, pause-work, set-profile to thin orchestrators | refactor | 8 | low | no | yes |
| d44c7dc | refactor: update commands, workflows, agents for gsd-tools integration | refactor | 44 | low | no | yes |
| 56b487a | chore: tidy up old files | chore | 13 | low | yes | yes |
| c94f563 | docs: update changelog for v1.12.0 | docs | 1 | low | no | no |
| e02b37d | 1.12.0 | docs | 2 | high | no | no |

## v1.12.1

| SHA | Message | Type | Files | Conflict | Protected | GSD |
|-----|---------|------|-------|----------|-----------|-----|
| 246d542 | feat(gsd-tools): add compound init commands and update workflows (#468) | feature | 31 | low | no | yes |
| 3e3f81e | docs: update changelog for v1.12.1 | docs | 1 | low | no | no |
| e92e64c | 1.12.1 | docs | 2 | high | no | no |

## v1.13.0

| SHA | Message | Type | Files | Conflict | Protected | GSD |
|-----|---------|------|-------|----------|-----------|-----|
| 3f5ab10 | chore: remove CONTRIBUTING.md and GSD-STYLE.md | chore | 2 | low | no | no |
| 1b317de | feat: extract repetitive bash patterns into gsd-tools commands (#472) | feature | 29 | high | no | yes |
| a52248c | chore: remove project-specific planning files | chore | 10 | low | no | no |
| c9aea44 | docs: update changelog for v1.13.0 | docs | 1 | low | no | no |
| 64373a8 | 1.13.0 | docs | 2 | high | no | no |

## v1.14.0

| SHA | Message | Type | Files | Conflict | Protected | GSD |
|-----|---------|------|-------|----------|-----------|-----|
| 6c53737 | feat: add context-optimizing parsing commands to gsd-tools (#473) | feature | 6 | none | no | yes |
| 6cf4a4e | fix: prevent installer from deleting opencode.json on parse errors (#475) | bugfix | 1 | high | no | no |
| 1fbffcf | docs: update changelog for v1.14.0 | docs | 1 | low | no | no |
| ecba990 | 1.14.0 | docs | 2 | high | no | no |

## v1.15.0

| SHA | Message | Type | Files | Conflict | Protected | GSD |
|-----|---------|------|-------|----------|-----------|-----|
| fa81821 | feat: add --include flag to init commands to eliminate redundant file reads | feature | 6 | none | no | yes |
| 63d99df | docs: update changelog for v1.15.0 | docs | 1 | low | no | no |
| 9ad7903 | 1.15.0 | docs | 2 | high | no | no |

## v1.15.1/v1.16.0

| SHA | Message | Type | Files | Conflict | Protected | GSD |
|-----|---------|------|-------|----------|-----------|-----|
| 1c6a35f | fix: normalize Windows backslashes in gsd-tools path prefix | bugfix | 1 | high | no | no |
| 36f5bb3 | feat: delegate deterministic workflow operations to gsd-tools CLI | feature | 8 | none | no | yes |
| 01c9115 | fix(#478): respect commit_docs=false in all .planning commit paths (#482) | bugfix | 7 | none | no | yes |
| 4249506 | fix(execute-phase): explicitly specify subagent_type="gsd-executor" | bugfix | 1 | none | no | yes |
| 2a4e0b1 | docs: update changelog for v1.15.1 | docs | 1 | low | no | no |
| ea0204b | 1.16.0 | docs | 3 | high | no | no |

## v1.17.0

| SHA | Message | Type | Files | Conflict | Protected | GSD |
|-----|---------|------|-------|----------|-----------|-----|
| ca03a06 | feat: preserve local patches across GSD updates (#481) | feature | 3 | high | no | yes |
| 4072fd2 | fix: add workaround for Claude Code classifyHandoffIfNeeded bug (#480) | bugfix | 3 | none | no | yes |
| 6a2d1f1 | feat(gsd-tools): frontmatter CRUD, verification suite, template fill, state progression (#485) | feature | 7 | low | no | yes |
| 5a2f5fa | docs: update changelog for v1.17.0 | docs | 1 | low | no | no |
| 06399ec | 1.17.0 | docs | 2 | high | no | no |

## v1.18.0

| SHA | Message | Type | Files | Conflict | Protected | GSD |
|-----|---------|------|-------|----------|-----------|-----|
| 767bef6 | fix(#484): persist research decision from new-milestone to config | bugfix | 2 | none | no | yes |
| ced41d7 | fix(#453): replace HEREDOC with literal newlines for Windows compatibility | bugfix | 1 | none | no | yes |
| 1344bd8 | fix(#466): add detached: true to SessionStart hook spawn for Windows | bugfix | 1 | high | no | no |
| 7f49083 | feat(new-project): add --auto flag for unattended initialization | feature | 2 | low | no | yes |
| cbb4aa1 | docs: add --auto flag to new-project command table | docs | 1 | low | no | no |
| fac1217 | docs: update changelog for v1.18.0 | docs | 1 | low | no | no |
| 9adb09f | 1.18.0 | docs | 2 | high | no | no |

## Batching Recommendations

### Can batch (trivial, low risk):
- Version bump commits (e.g., 1.10.0, 1.11.0)
- Changelog updates (docs: update changelog)
- README updates with no branding impact

### Needs individual review:
- All feature commits
- All bugfixes (may have subtle interactions)
- Refactors (especially gsd-tools introduction)
- Any commit touching hooks/, bin/, or package.json
- Any commit touching get-shit-done/ (needs path rename)

---

## Known Concerns

### 1. Reverted GSD Memory Feature
- **af7a057**: feat: add GSD Memory cross-project knowledge system
- **cc3c6ac**: revert: remove GSD Memory system (not ready for release)
- **Impact**: These commits touch multiple files. The revert should be included to maintain upstream parity, but verify no residual artifacts remain.

### 2. gsd-tools.js Introduction (v1.12.0)
- **01ae939**: feat(gsd-tools): add CLI utility for command extraction
- **Impact**: Large new file (get-shit-done/gsd-tools.js). This is a core refactor that subsequent commits depend on.
- **Action**: Must apply before dependent refactor commits in same release.

### 3. get-shit-done/ Directory Rename
- **Multiple commits** touch get-shit-done/ directory
- **Fork has renamed to:** get-stuff-done/
- **Action**: After cherry-pick, must rename paths:
  - get-shit-done/ → get-stuff-done/
  - Any references in code/docs must be updated
  - Verify with: grep -r "get-shit-done" . after sync

### 4. High-conflict files
- **bin/install.js**: Fork has WoW installer changes
- **hooks/gsd-statusline.js**: Fork has threshold scaling changes
- **package.json**: Fork has branding changes
- **Action**: Manual merge resolution required, preserve fork customizations

### 5. Protected paths
The following paths have fork-specific customizations and must be carefully reviewed:
- eslint.config.js (Phase 7 security tooling)
- src/validation/ (Phase 7 security tooling)
- get-stuff-done/ (branding rename)
- assets/gsd-logo-* (custom branding assets)
- config/default-config.json (fork config)
- src/config/ConfigLoader.js (fork config)
- src/theme/ (fork theming)

---

## Detailed Commit List

### 197800e: feat(git): add unified branching strategy option

- **Type:** feature
- **Files changed:** 4
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- commands/gsd/settings.md
- get-shit-done/references/planning-config.md
- get-shit-done/workflows/complete-milestone.md
- get-shit-done/workflows/execute-phase.md

### 339e911: chore: remove GitHub Actions release workflow

- **Type:** chore
- **Files changed:** 1
- **Conflict risk:** none
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- .github/workflows/release.yml

### 87b2cd0: fix: scale context bar to show 100% at actual 80% limit

- **Type:** bugfix
- **Files changed:** 1
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- hooks/gsd-statusline.js

### 5379832: feat: add Gemini support to installer (#301)

- **Type:** feature
- **Files changed:** 2
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- bin/install.js
- package.json

### 91aaa35: chore: remove dead code from Gemini PR

- **Type:** chore
- **Files changed:** 1
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- bin/install.js

### d58f2b5: docs: update README and changelog for v1.9.14

- **Type:** docs
- **Files changed:** 2
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- CHANGELOG.md
- README.md

### beca9fa: 1.10.0

- **Type:** docs
- **Files changed:** 3
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- CHANGELOG.md
- package-lock.json
- package.json

### 5660b6f: fix: Gemini CLI agent loading errors (#347)

- **Type:** bugfix
- **Files changed:** 5
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- agents/gsd-phase-researcher.md
- agents/gsd-plan-checker.md
- agents/gsd-planner.md
- agents/gsd-verifier.md
- bin/install.js

### 3b70b10: docs: update changelog for v1.10.1

- **Type:** docs
- **Files changed:** 1
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- CHANGELOG.md

### 80d6799: 1.10.1

- **Type:** docs
- **Files changed:** 2
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- package-lock.json
- package.json

### 5ee22e6: feat(git): add squash merge option for branching strategies

- **Type:** feature
- **Files changed:** 2
- **Conflict risk:** none
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- get-shit-done/references/planning-config.md
- get-shit-done/workflows/complete-milestone.md

### 3257139: fix(plan-phase): pass CONTEXT.md to all downstream agents

- **Type:** bugfix
- **Files changed:** 2
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- agents/gsd-plan-checker.md
- commands/gsd/plan-phase.md

### f3db981: docs: update changelog and README for v1.11.0

- **Type:** docs
- **Files changed:** 2
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- CHANGELOG.md
- README.md

### d8840c4: 1.11.0

- **Type:** docs
- **Files changed:** 3
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- CHANGELOG.md
- package-lock.json
- package.json

### b5ca9a2: 1.11.1

- **Type:** docs
- **Files changed:** 2
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- package-lock.json
- package.json

### 8d2651d: fix: remove broken gsd-gemini link (404)

- **Type:** bugfix
- **Files changed:** 1
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- README.md

### d165496: feat(install): respect attribution.commit setting (compatible opencode) (#286)

- **Type:** feature
- **Files changed:** 1
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- bin/install.js

### 2347fca: fix: clarify ASCII box-drawing vs text content with diacritics (#289)

- **Type:** bugfix
- **Files changed:** 4
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- GSD-STYLE.md
- commands/gsd/add-todo.md
- get-shit-done/templates/codebase/structure.md
- get-shit-done/templates/research-project/ARCHITECTURE.md

### 4267c6c: fix: respect parallelization config setting (#379)

- **Type:** bugfix
- **Files changed:** 1
- **Conflict risk:** none
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- get-shit-done/workflows/execute-phase.md

### ecbc692: fix(#326): enforce context fidelity in planning pipeline (#391)

- **Type:** bugfix
- **Files changed:** 4
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- .work/001-map-gsd-deps/001-PROMPT.md
- agents/gsd-phase-researcher.md
- agents/gsd-planner.md
- get-shit-done/templates/research.md

### 074b2bc: fix(#330): update statusline.js reference during install (#392)

- **Type:** bugfix
- **Files changed:** 1
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- bin/install.js

### 9d7ea9c: fix: statusline crash handling, color validation, git staging rules

- **Type:** bugfix
- **Files changed:** 5
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- BUG_REPORT.md
- FIXES_APPLIED.md
- bin/install.js
- commands/gsd/execute-phase.md
- hooks/gsd-statusline.js

### 161aa61: fix: researcher agent always writes RESEARCH.md regardless of commit_docs

- **Type:** bugfix
- **Files changed:** 1
- **Conflict risk:** none
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- agents/gsd-phase-researcher.md

### 8384575: fix: update command respects local vs global install

- **Type:** bugfix
- **Files changed:** 1
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- commands/gsd/update.md

### f380275: fix(executor): add completion verification to prevent hallucinated success (#315)

- **Type:** bugfix
- **Files changed:** 4
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- agents/gsd-executor.md
- commands/gsd/execute-phase.md
- get-shit-done/workflows/execute-phase.md
- get-shit-done/workflows/execute-plan.md

### 4dff989: fix(settings): auto-create config.json when missing (#264)

- **Type:** bugfix
- **Files changed:** 2
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- commands/gsd/set-profile.md
- commands/gsd/settings.md

### f53011c: fix(#429): prevent API keys from being committed via map-codebase

- **Type:** bugfix
- **Files changed:** 3
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- README.md
- agents/gsd-codebase-mapper.md
- get-shit-done/workflows/map-codebase.md

### af7a057: feat: add GSD Memory cross-project knowledge system

- **Type:** feature
- **Files changed:** 120
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- agents/gsd-phase-researcher.md
- agents/gsd-project-researcher.md
- bin/install.js
- commands/gsd/new-project.md
- get-shit-done/workflows/complete-milestone.md
- get-shit-done/workflows/execute-phase.md
- gsd-memory/.gitignore
- gsd-memory/README.md
- gsd-memory/dist/extractors/frontmatter.d.ts
- gsd-memory/dist/extractors/frontmatter.d.ts.map
- gsd-memory/dist/extractors/frontmatter.js
- gsd-memory/dist/extractors/frontmatter.js.map
- gsd-memory/dist/extractors/index.d.ts
- gsd-memory/dist/extractors/index.d.ts.map
- gsd-memory/dist/extractors/index.js
- gsd-memory/dist/extractors/index.js.map
- gsd-memory/dist/extractors/project.d.ts
- gsd-memory/dist/extractors/project.d.ts.map
- gsd-memory/dist/extractors/project.js
- gsd-memory/dist/extractors/project.js.map
- gsd-memory/dist/extractors/research.d.ts
- gsd-memory/dist/extractors/research.d.ts.map
- gsd-memory/dist/extractors/research.js
- gsd-memory/dist/extractors/research.js.map
- gsd-memory/dist/extractors/summary.d.ts
- gsd-memory/dist/extractors/summary.d.ts.map
- gsd-memory/dist/extractors/summary.js
- gsd-memory/dist/extractors/summary.js.map
- gsd-memory/dist/index.d.ts
- gsd-memory/dist/index.d.ts.map
- gsd-memory/dist/index.js
- gsd-memory/dist/index.js.map
- gsd-memory/dist/qmd.d.ts
- gsd-memory/dist/qmd.d.ts.map
- gsd-memory/dist/qmd.js
- gsd-memory/dist/qmd.js.map
- gsd-memory/dist/registry.d.ts
- gsd-memory/dist/registry.d.ts.map
- gsd-memory/dist/registry.js
- gsd-memory/dist/registry.js.map
- gsd-memory/dist/tools/decisions.d.ts
- gsd-memory/dist/tools/decisions.d.ts.map
- gsd-memory/dist/tools/decisions.js
- gsd-memory/dist/tools/decisions.js.map
- gsd-memory/dist/tools/index-tool.d.ts
- gsd-memory/dist/tools/index-tool.d.ts.map
- gsd-memory/dist/tools/index-tool.js
- gsd-memory/dist/tools/index-tool.js.map
- gsd-memory/dist/tools/patterns.d.ts
- gsd-memory/dist/tools/patterns.d.ts.map
- gsd-memory/dist/tools/patterns.js
- gsd-memory/dist/tools/patterns.js.map
- gsd-memory/dist/tools/pitfalls.d.ts
- gsd-memory/dist/tools/pitfalls.d.ts.map
- gsd-memory/dist/tools/pitfalls.js
- gsd-memory/dist/tools/pitfalls.js.map
- gsd-memory/dist/tools/register.d.ts
- gsd-memory/dist/tools/register.d.ts.map
- gsd-memory/dist/tools/register.js
- gsd-memory/dist/tools/register.js.map
- gsd-memory/dist/tools/search.d.ts
- gsd-memory/dist/tools/search.d.ts.map
- gsd-memory/dist/tools/search.js
- gsd-memory/dist/tools/search.js.map
- gsd-memory/dist/tools/stack.d.ts
- gsd-memory/dist/tools/stack.d.ts.map
- gsd-memory/dist/tools/stack.js
- gsd-memory/dist/tools/stack.js.map
- gsd-memory/dist/tools/status.d.ts
- gsd-memory/dist/tools/status.d.ts.map
- gsd-memory/dist/tools/status.js
- gsd-memory/dist/tools/status.js.map
- gsd-memory/package-lock.json
- gsd-memory/package.json
- gsd-memory/src/extractors/frontmatter.ts
- gsd-memory/src/extractors/index.ts
- gsd-memory/src/extractors/project.ts
- gsd-memory/src/extractors/research.ts
- gsd-memory/src/extractors/summary.ts
- gsd-memory/src/index.ts
- gsd-memory/src/qmd.ts
- gsd-memory/src/registry.ts
- gsd-memory/src/tools/decisions.ts
- gsd-memory/src/tools/index-tool.ts
- gsd-memory/src/tools/patterns.ts
- gsd-memory/src/tools/pitfalls.ts
- gsd-memory/src/tools/register.ts
- gsd-memory/src/tools/search.ts
- gsd-memory/src/tools/stack.ts
- gsd-memory/src/tools/status.ts
- gsd-memory/tests/extractors/frontmatter.test.ts
- gsd-memory/tests/extractors/project.test.ts
- gsd-memory/tests/extractors/research.test.ts
- gsd-memory/tests/extractors/summary.test.ts
- gsd-memory/tests/fixtures/mock-planning/PROJECT.md
- gsd-memory/tests/fixtures/mock-planning/STATE.md
- gsd-memory/tests/fixtures/mock-planning/config.json
- gsd-memory/tests/fixtures/mock-planning/phases/01-foundation/01-01-SUMMARY.md
- gsd-memory/tests/fixtures/mock-planning/phases/01-foundation/01-RESEARCH.md
- gsd-memory/tests/fixtures/mock-planning/research/SUMMARY.md
- gsd-memory/tests/fixtures/mock-project/.planning/PROJECT.md
- gsd-memory/tests/fixtures/mock-project/.planning/STATE.md
- gsd-memory/tests/fixtures/mock-project/.planning/config.json
- gsd-memory/tests/fixtures/mock-project/.planning/phases/01-foundation/01-01-SUMMARY.md
- gsd-memory/tests/fixtures/mock-project/.planning/phases/01-foundation/01-RESEARCH.md
- gsd-memory/tests/fixtures/mock-project/.planning/research/SUMMARY.md
- gsd-memory/tests/fixtures/sample-project.md
- gsd-memory/tests/fixtures/sample-research.md
- gsd-memory/tests/fixtures/sample-summary.md
- gsd-memory/tests/integration/end-to-end.test.ts
- gsd-memory/tests/integration/mcp-server.test.ts
- gsd-memory/tests/integration/qmd-wrapper.test.ts
- gsd-memory/tests/qmd-wrapper.test.ts
- gsd-memory/tests/setup.ts
- gsd-memory/tests/tools/decisions.test.ts
- gsd-memory/tests/tools/register.test.ts
- gsd-memory/tests/tools/search.test.ts
- gsd-memory/tsconfig.json
- gsd-memory/vitest.config.ts
- gsd-memory/vitest.integration.config.ts

### 75fb063: docs: update changelog for v1.11.2

- **Type:** docs
- **Files changed:** 1
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- CHANGELOG.md

### 7c42763: 1.11.2

- **Type:** docs
- **Files changed:** 2
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- package-lock.json
- package.json

### cc3c6ac: revert: remove GSD Memory system (not ready for release)

- **Type:** chore
- **Files changed:** 120
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- agents/gsd-phase-researcher.md
- agents/gsd-project-researcher.md
- bin/install.js
- commands/gsd/new-project.md
- get-shit-done/workflows/complete-milestone.md
- get-shit-done/workflows/execute-phase.md
- gsd-memory/.gitignore
- gsd-memory/README.md
- gsd-memory/dist/extractors/frontmatter.d.ts
- gsd-memory/dist/extractors/frontmatter.d.ts.map
- gsd-memory/dist/extractors/frontmatter.js
- gsd-memory/dist/extractors/frontmatter.js.map
- gsd-memory/dist/extractors/index.d.ts
- gsd-memory/dist/extractors/index.d.ts.map
- gsd-memory/dist/extractors/index.js
- gsd-memory/dist/extractors/index.js.map
- gsd-memory/dist/extractors/project.d.ts
- gsd-memory/dist/extractors/project.d.ts.map
- gsd-memory/dist/extractors/project.js
- gsd-memory/dist/extractors/project.js.map
- gsd-memory/dist/extractors/research.d.ts
- gsd-memory/dist/extractors/research.d.ts.map
- gsd-memory/dist/extractors/research.js
- gsd-memory/dist/extractors/research.js.map
- gsd-memory/dist/extractors/summary.d.ts
- gsd-memory/dist/extractors/summary.d.ts.map
- gsd-memory/dist/extractors/summary.js
- gsd-memory/dist/extractors/summary.js.map
- gsd-memory/dist/index.d.ts
- gsd-memory/dist/index.d.ts.map
- gsd-memory/dist/index.js
- gsd-memory/dist/index.js.map
- gsd-memory/dist/qmd.d.ts
- gsd-memory/dist/qmd.d.ts.map
- gsd-memory/dist/qmd.js
- gsd-memory/dist/qmd.js.map
- gsd-memory/dist/registry.d.ts
- gsd-memory/dist/registry.d.ts.map
- gsd-memory/dist/registry.js
- gsd-memory/dist/registry.js.map
- gsd-memory/dist/tools/decisions.d.ts
- gsd-memory/dist/tools/decisions.d.ts.map
- gsd-memory/dist/tools/decisions.js
- gsd-memory/dist/tools/decisions.js.map
- gsd-memory/dist/tools/index-tool.d.ts
- gsd-memory/dist/tools/index-tool.d.ts.map
- gsd-memory/dist/tools/index-tool.js
- gsd-memory/dist/tools/index-tool.js.map
- gsd-memory/dist/tools/patterns.d.ts
- gsd-memory/dist/tools/patterns.d.ts.map
- gsd-memory/dist/tools/patterns.js
- gsd-memory/dist/tools/patterns.js.map
- gsd-memory/dist/tools/pitfalls.d.ts
- gsd-memory/dist/tools/pitfalls.d.ts.map
- gsd-memory/dist/tools/pitfalls.js
- gsd-memory/dist/tools/pitfalls.js.map
- gsd-memory/dist/tools/register.d.ts
- gsd-memory/dist/tools/register.d.ts.map
- gsd-memory/dist/tools/register.js
- gsd-memory/dist/tools/register.js.map
- gsd-memory/dist/tools/search.d.ts
- gsd-memory/dist/tools/search.d.ts.map
- gsd-memory/dist/tools/search.js
- gsd-memory/dist/tools/search.js.map
- gsd-memory/dist/tools/stack.d.ts
- gsd-memory/dist/tools/stack.d.ts.map
- gsd-memory/dist/tools/stack.js
- gsd-memory/dist/tools/stack.js.map
- gsd-memory/dist/tools/status.d.ts
- gsd-memory/dist/tools/status.d.ts.map
- gsd-memory/dist/tools/status.js
- gsd-memory/dist/tools/status.js.map
- gsd-memory/package-lock.json
- gsd-memory/package.json
- gsd-memory/src/extractors/frontmatter.ts
- gsd-memory/src/extractors/index.ts
- gsd-memory/src/extractors/project.ts
- gsd-memory/src/extractors/research.ts
- gsd-memory/src/extractors/summary.ts
- gsd-memory/src/index.ts
- gsd-memory/src/qmd.ts
- gsd-memory/src/registry.ts
- gsd-memory/src/tools/decisions.ts
- gsd-memory/src/tools/index-tool.ts
- gsd-memory/src/tools/patterns.ts
- gsd-memory/src/tools/pitfalls.ts
- gsd-memory/src/tools/register.ts
- gsd-memory/src/tools/search.ts
- gsd-memory/src/tools/stack.ts
- gsd-memory/src/tools/status.ts
- gsd-memory/tests/extractors/frontmatter.test.ts
- gsd-memory/tests/extractors/project.test.ts
- gsd-memory/tests/extractors/research.test.ts
- gsd-memory/tests/extractors/summary.test.ts
- gsd-memory/tests/fixtures/mock-planning/PROJECT.md
- gsd-memory/tests/fixtures/mock-planning/STATE.md
- gsd-memory/tests/fixtures/mock-planning/config.json
- gsd-memory/tests/fixtures/mock-planning/phases/01-foundation/01-01-SUMMARY.md
- gsd-memory/tests/fixtures/mock-planning/phases/01-foundation/01-RESEARCH.md
- gsd-memory/tests/fixtures/mock-planning/research/SUMMARY.md
- gsd-memory/tests/fixtures/mock-project/.planning/PROJECT.md
- gsd-memory/tests/fixtures/mock-project/.planning/STATE.md
- gsd-memory/tests/fixtures/mock-project/.planning/config.json
- gsd-memory/tests/fixtures/mock-project/.planning/phases/01-foundation/01-01-SUMMARY.md
- gsd-memory/tests/fixtures/mock-project/.planning/phases/01-foundation/01-RESEARCH.md
- gsd-memory/tests/fixtures/mock-project/.planning/research/SUMMARY.md
- gsd-memory/tests/fixtures/sample-project.md
- gsd-memory/tests/fixtures/sample-research.md
- gsd-memory/tests/fixtures/sample-summary.md
- gsd-memory/tests/integration/end-to-end.test.ts
- gsd-memory/tests/integration/mcp-server.test.ts
- gsd-memory/tests/integration/qmd-wrapper.test.ts
- gsd-memory/tests/qmd-wrapper.test.ts
- gsd-memory/tests/setup.ts
- gsd-memory/tests/tools/decisions.test.ts
- gsd-memory/tests/tools/register.test.ts
- gsd-memory/tests/tools/search.test.ts
- gsd-memory/tsconfig.json
- gsd-memory/vitest.config.ts
- gsd-memory/vitest.integration.config.ts

### ddc736e: v1.11.3 - revert memory system

- **Type:** other
- **Files changed:** 2
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- package-lock.json
- package.json

### 01ae939: feat(gsd-tools): add CLI utility for command extraction

- **Type:** feature
- **Files changed:** 1
- **Conflict risk:** none
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- get-shit-done/bin/gsd-tools.js

### 8f26bfa: refactor: extract check-todos, add-phase, update to thin orchestrators

- **Type:** refactor
- **Files changed:** 6
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- commands/gsd/add-phase.md
- commands/gsd/check-todos.md
- commands/gsd/update.md
- get-shit-done/workflows/add-phase.md
- get-shit-done/workflows/check-todos.md
- get-shit-done/workflows/update.md

### d2623e0: refactor: extract settings, add-todo, pause-work, set-profile to thin orchestrators

- **Type:** refactor
- **Files changed:** 8
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- commands/gsd/add-todo.md
- commands/gsd/pause-work.md
- commands/gsd/set-profile.md
- commands/gsd/settings.md
- get-shit-done/workflows/add-todo.md
- get-shit-done/workflows/pause-work.md
- get-shit-done/workflows/set-profile.md
- get-shit-done/workflows/settings.md

### d44c7dc: refactor: update commands, workflows, agents for gsd-tools integration

- **Type:** refactor
- **Files changed:** 44
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- .planning/config.json.example
- agents/gsd-debugger.md
- agents/gsd-executor.md
- agents/gsd-phase-researcher.md
- agents/gsd-plan-checker.md
- agents/gsd-planner.md
- agents/gsd-project-researcher.md
- agents/gsd-research-synthesizer.md
- agents/gsd-verifier.md
- commands/gsd/audit-milestone.md
- commands/gsd/debug.md
- commands/gsd/execute-phase.md
- commands/gsd/help.md
- commands/gsd/insert-phase.md
- commands/gsd/new-milestone.md
- commands/gsd/new-project.md
- commands/gsd/plan-milestone-gaps.md
- commands/gsd/plan-phase.md
- commands/gsd/progress.md
- commands/gsd/quick.md
- commands/gsd/remove-phase.md
- commands/gsd/research-phase.md
- commands/gsd/verify-work.md
- get-shit-done/references/checkpoints.md
- get-shit-done/references/planning-config.md
- get-shit-done/workflows/audit-milestone.md
- get-shit-done/workflows/complete-milestone.md
- get-shit-done/workflows/diagnose-issues.md
- get-shit-done/workflows/discuss-phase.md
- get-shit-done/workflows/execute-phase.md
- get-shit-done/workflows/execute-plan.md
- get-shit-done/workflows/help.md
- get-shit-done/workflows/insert-phase.md
- get-shit-done/workflows/map-codebase.md
- get-shit-done/workflows/new-milestone.md
- get-shit-done/workflows/new-project.md
- get-shit-done/workflows/plan-milestone-gaps.md
- get-shit-done/workflows/plan-phase.md
- get-shit-done/workflows/progress.md
- get-shit-done/workflows/quick.md
- get-shit-done/workflows/remove-phase.md
- get-shit-done/workflows/resume-project.md
- get-shit-done/workflows/verify-phase.md
- get-shit-done/workflows/verify-work.md

### 56b487a: chore: tidy up old files

- **Type:** chore
- **Files changed:** 13
- **Conflict risk:** low
- **Touches protected:** yes
- **Touches GSD directory:** yes

**Files:**
- .planning/config.json.example
- .work/001-map-gsd-deps/001-PROMPT.md
- BUG_REPORT.md
- FIXES_APPLIED.md
- MAINTAINERS.md
- assets/gsd-logo-2000-transparent.png
- assets/gsd-logo-2000-transparent.svg
- commands/gsd/new-project.md.bak
- get-shit-done/references/decimal-phase-calculation.md
- get-shit-done/references/git-planning-commit.md
- get-shit-done/references/model-profile-resolution.md
- get-shit-done/references/phase-argument-parsing.md
- get-shit-done/workflows/research-phase.md

### c94f563: docs: update changelog for v1.12.0

- **Type:** docs
- **Files changed:** 1
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- CHANGELOG.md

### e02b37d: 1.12.0

- **Type:** docs
- **Files changed:** 2
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- package-lock.json
- package.json

### 246d542: feat(gsd-tools): add compound init commands and update workflows (#468)

- **Type:** feature
- **Files changed:** 31
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- agents/gsd-debugger.md
- agents/gsd-executor.md
- agents/gsd-phase-researcher.md
- agents/gsd-plan-checker.md
- agents/gsd-planner.md
- commands/gsd/debug.md
- commands/gsd/research-phase.md
- get-shit-done/bin/gsd-tools.js
- get-shit-done/references/planning-config.md
- get-shit-done/workflows/add-phase.md
- get-shit-done/workflows/add-todo.md
- get-shit-done/workflows/audit-milestone.md
- get-shit-done/workflows/check-todos.md
- get-shit-done/workflows/complete-milestone.md
- get-shit-done/workflows/discuss-phase.md
- get-shit-done/workflows/execute-phase.md
- get-shit-done/workflows/execute-plan.md
- get-shit-done/workflows/insert-phase.md
- get-shit-done/workflows/map-codebase.md
- get-shit-done/workflows/new-milestone.md
- get-shit-done/workflows/new-project.md
- get-shit-done/workflows/pause-work.md
- get-shit-done/workflows/plan-phase.md
- get-shit-done/workflows/progress.md
- get-shit-done/workflows/quick.md
- get-shit-done/workflows/remove-phase.md
- get-shit-done/workflows/resume-project.md
- get-shit-done/workflows/set-profile.md
- get-shit-done/workflows/settings.md
- get-shit-done/workflows/verify-phase.md
- get-shit-done/workflows/verify-work.md

### 3e3f81e: docs: update changelog for v1.12.1

- **Type:** docs
- **Files changed:** 1
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- CHANGELOG.md

### e92e64c: 1.12.1

- **Type:** docs
- **Files changed:** 2
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- package-lock.json
- package.json

### 3f5ab10: chore: remove CONTRIBUTING.md and GSD-STYLE.md

- **Type:** chore
- **Files changed:** 2
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- CONTRIBUTING.md
- GSD-STYLE.md

### 1b317de: feat: extract repetitive bash patterns into gsd-tools commands (#472)

- **Type:** feature
- **Files changed:** 29
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- .gitignore
- .planning/PROJECT.md
- .planning/REQUIREMENTS.md
- .planning/ROADMAP.md
- .planning/STATE.md
- .planning/config.json
- agents/gsd-plan-checker.md
- agents/gsd-planner.md
- agents/gsd-verifier.md
- commands/gsd/research-phase.md
- get-shit-done/bin/gsd-tools.js
- get-shit-done/bin/gsd-tools.test.js
- get-shit-done/references/decimal-phase-calculation.md
- get-shit-done/references/phase-argument-parsing.md
- get-shit-done/templates/summary-complex.md
- get-shit-done/templates/summary-minimal.md
- get-shit-done/templates/summary-standard.md
- get-shit-done/workflows/audit-milestone.md
- get-shit-done/workflows/insert-phase.md
- get-shit-done/workflows/plan-milestone-gaps.md
- get-shit-done/workflows/plan-phase.md
- get-shit-done/workflows/research-phase.md
- get-shit-done/workflows/verify-phase.md
- optimisation-ideas/ACTION-PLAN.md
- optimisation-ideas/codex.md
- optimisation-ideas/gemini.md
- optimisation-ideas/syntheses/codex.md
- optimisation-ideas/syntheses/gemini.md
- package.json

### a52248c: chore: remove project-specific planning files

- **Type:** chore
- **Files changed:** 10
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- .planning/PROJECT.md
- .planning/REQUIREMENTS.md
- .planning/ROADMAP.md
- .planning/STATE.md
- .planning/config.json
- optimisation-ideas/ACTION-PLAN.md
- optimisation-ideas/codex.md
- optimisation-ideas/gemini.md
- optimisation-ideas/syntheses/codex.md
- optimisation-ideas/syntheses/gemini.md

### c9aea44: docs: update changelog for v1.13.0

- **Type:** docs
- **Files changed:** 1
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- CHANGELOG.md

### 64373a8: 1.13.0

- **Type:** docs
- **Files changed:** 2
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- package-lock.json
- package.json

### 6c53737: feat: add context-optimizing parsing commands to gsd-tools (#473)

- **Type:** feature
- **Files changed:** 6
- **Conflict risk:** none
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- get-shit-done/bin/gsd-tools.js
- get-shit-done/bin/gsd-tools.test.js
- get-shit-done/workflows/complete-milestone.md
- get-shit-done/workflows/execute-phase.md
- get-shit-done/workflows/plan-phase.md
- get-shit-done/workflows/research-phase.md

### 6cf4a4e: fix: prevent installer from deleting opencode.json on parse errors (#475)

- **Type:** bugfix
- **Files changed:** 1
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- bin/install.js

### 1fbffcf: docs: update changelog for v1.14.0

- **Type:** docs
- **Files changed:** 1
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- CHANGELOG.md

### ecba990: 1.14.0

- **Type:** docs
- **Files changed:** 2
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- package-lock.json
- package.json

### fa81821: feat: add --include flag to init commands to eliminate redundant file reads

- **Type:** feature
- **Files changed:** 6
- **Conflict risk:** none
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- get-shit-done/bin/gsd-tools.js
- get-shit-done/bin/gsd-tools.test.js
- get-shit-done/workflows/execute-phase.md
- get-shit-done/workflows/execute-plan.md
- get-shit-done/workflows/plan-phase.md
- get-shit-done/workflows/progress.md

### 63d99df: docs: update changelog for v1.15.0

- **Type:** docs
- **Files changed:** 1
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- CHANGELOG.md

### 9ad7903: 1.15.0

- **Type:** docs
- **Files changed:** 2
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- package-lock.json
- package.json

### 1c6a35f: fix: normalize Windows backslashes in gsd-tools path prefix

- **Type:** bugfix
- **Files changed:** 1
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- bin/install.js

### 36f5bb3: feat: delegate deterministic workflow operations to gsd-tools CLI

- **Type:** feature
- **Files changed:** 8
- **Conflict risk:** none
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- get-shit-done/bin/gsd-tools.js
- get-shit-done/bin/gsd-tools.test.js
- get-shit-done/workflows/add-phase.md
- get-shit-done/workflows/complete-milestone.md
- get-shit-done/workflows/insert-phase.md
- get-shit-done/workflows/progress.md
- get-shit-done/workflows/remove-phase.md
- get-shit-done/workflows/transition.md

### 01c9115: fix(#478): respect commit_docs=false in all .planning commit paths (#482)

- **Type:** bugfix
- **Files changed:** 7
- **Conflict risk:** none
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- agents/gsd-debugger.md
- get-shit-done/bin/gsd-tools.js
- get-shit-done/references/git-integration.md
- get-shit-done/references/git-planning-commit.md
- get-shit-done/references/planning-config.md
- get-shit-done/workflows/execute-phase.md
- get-shit-done/workflows/execute-plan.md

### 4249506: fix(execute-phase): explicitly specify subagent_type="gsd-executor"

- **Type:** bugfix
- **Files changed:** 1
- **Conflict risk:** none
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- get-shit-done/workflows/execute-phase.md

### 2a4e0b1: docs: update changelog for v1.15.1

- **Type:** docs
- **Files changed:** 1
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- CHANGELOG.md

### ea0204b: 1.16.0

- **Type:** docs
- **Files changed:** 3
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- CHANGELOG.md
- package-lock.json
- package.json

### ca03a06: feat: preserve local patches across GSD updates (#481)

- **Type:** feature
- **Files changed:** 3
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- bin/install.js
- commands/gsd/reapply-patches.md
- get-shit-done/workflows/update.md

### 4072fd2: fix: add workaround for Claude Code classifyHandoffIfNeeded bug (#480)

- **Type:** bugfix
- **Files changed:** 3
- **Conflict risk:** none
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- get-shit-done/workflows/execute-phase.md
- get-shit-done/workflows/execute-plan.md
- get-shit-done/workflows/quick.md

### 6a2d1f1: feat(gsd-tools): frontmatter CRUD, verification suite, template fill, state progression (#485)

- **Type:** feature
- **Files changed:** 7
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- agents/gsd-executor.md
- agents/gsd-plan-checker.md
- agents/gsd-planner.md
- agents/gsd-verifier.md
- get-shit-done/bin/gsd-tools.js
- get-shit-done/workflows/execute-plan.md
- get-shit-done/workflows/verify-phase.md

### 5a2f5fa: docs: update changelog for v1.17.0

- **Type:** docs
- **Files changed:** 1
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- CHANGELOG.md

### 06399ec: 1.17.0

- **Type:** docs
- **Files changed:** 2
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- package-lock.json
- package.json

### 767bef6: fix(#484): persist research decision from new-milestone to config

- **Type:** bugfix
- **Files changed:** 2
- **Conflict risk:** none
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- get-shit-done/bin/gsd-tools.js
- get-shit-done/workflows/new-milestone.md

### ced41d7: fix(#453): replace HEREDOC with literal newlines for Windows compatibility

- **Type:** bugfix
- **Files changed:** 1
- **Conflict risk:** none
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- get-shit-done/workflows/complete-milestone.md

### 1344bd8: fix(#466): add detached: true to SessionStart hook spawn for Windows

- **Type:** bugfix
- **Files changed:** 1
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- hooks/gsd-check-update.js

### 7f49083: feat(new-project): add --auto flag for unattended initialization

- **Type:** feature
- **Files changed:** 2
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** yes

**Files:**
- commands/gsd/new-project.md
- get-shit-done/workflows/new-project.md

### cbb4aa1: docs: add --auto flag to new-project command table

- **Type:** docs
- **Files changed:** 1
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- README.md

### fac1217: docs: update changelog for v1.18.0

- **Type:** docs
- **Files changed:** 1
- **Conflict risk:** low
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- CHANGELOG.md

### 9adb09f: 1.18.0

- **Type:** docs
- **Files changed:** 2
- **Conflict risk:** high
- **Touches protected:** no
- **Touches GSD directory:** no

**Files:**
- package-lock.json
- package.json

