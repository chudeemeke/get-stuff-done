# Roadmap: GetStuffDone Fork v0.1.0

## Overview

This roadmap delivers a personalized GSD fork with distinct identity while maintaining upstream compatibility. The six phases progress from foundational configuration through visual identity, with independent phases parallelizable where useful. Configuration is foundational (statusline depends on it), branding precedes update commands (URLs must be correct), and logo work is purely additive.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Configuration System** - Foundation for dynamic behavior
- [ ] **Phase 2: Statusline Redesign** - New visual identity in terminal
- [ ] **Phase 3: Installation Enhancements** - Hybrid install (copies default, --link for dev)
- [ ] **Phase 4: Branding and URLs** - Fork identity establishment
- [ ] **Phase 5: Update Commands** - Split update workflow (fork vs upstream)
- [ ] **Phase 6: Logo Assets** - Visual identity assets

## Phase Details

### Phase 1: Configuration System
**Goal**: User can configure GSD behavior from a single config file
**Depends on**: Nothing (first phase)
**Requirements**: CONFIG-01, CONFIG-02, CONFIG-03, CONFIG-04
**Success Criteria** (what must be TRUE):
  1. User can set autocompact token threshold in `~/.gsd/config.json`
  2. Running `gsd` passes the correct autocompact flag to Claude based on config
  3. Statusline reads thresholds from the same config file
  4. Changing config value changes behavior without code edits
**Plans**: 1 plan

Plans:
- [ ] 01-01-PLAN.md — Config schema, loader, launcher and statusline integration

### Phase 2: Statusline Redesign
**Goal**: User sees redesigned statusline with GSD branding and dynamic thresholds
**Depends on**: Phase 1 (needs config for thresholds)
**Requirements**: STATUS-01, STATUS-02, STATUS-03, STATUS-04, STATUS-05, STATUS-06, STATUS-07, STATUS-08, STATUS-09
**Success Criteria** (what must be TRUE):
  1. Statusline displays `[GSD]` prefix in cyan
  2. Progress bar changes color at 50%, 75%, 87.5% of autocompact threshold
  3. Red stage (bar, icon, percentage) blinks
  4. Update notification appears on second line only when upstream has changes
  5. Model and CWD visible in statusline (dim)
**Plans**: TBD

Plans:
- [ ] 02-01: Statusline branding and layout
- [ ] 02-02: Dynamic thresholds and visual states

### Phase 3: Installation Enhancements
**Goal**: Hybrid installation - copies by default (industry standard), symlinks/junctions with --link flag (dev workflow)
**Depends on**: Nothing (independent)
**Requirements**: INSTALL-01, INSTALL-02, INSTALL-03, INSTALL-04
**Success Criteria** (what must be TRUE):
  1. Running installer creates file copies by default (standard behavior)
  2. Running installer with --link creates symlinks/junctions instead
  3. On Windows, --link uses junctions (no admin required)
  4. Re-running installer detects existing install type and matches it
**Plans**: TBD

Plans:
- [ ] 03-01: Hybrid installation logic (copies + --link flag)

### Phase 4: Branding and URLs
**Goal**: All URLs and identity markers point to private fork
**Depends on**: Nothing (independent)
**Requirements**: BRAND-01, BRAND-02, BRAND-03, BRAND-04, BRAND-05
**Success Criteria** (what must be TRUE):
  1. package.json repository points to chudeemeke/get-stuff-done
  2. README shows private repo clone URL
  3. Install completion message shows Chude/AI Dev Environment author
  4. .upstream/ directory remains unchanged for diffing
**Plans**: TBD

Plans:
- [ ] 04-01: URL and identity updates

### Phase 5: Update Commands
**Goal**: User can update fork and check upstream separately
**Depends on**: Phase 4 (URLs must be correct)
**Requirements**: UPDATE-01, UPDATE-02, UPDATE-03, UPDATE-04, UPDATE-05
**Success Criteria** (what must be TRUE):
  1. `/gsd:update` checks chudeemeke/get-stuff-done for releases
  2. `/gsd:upstream` checks glittercowboy/get-shit-done for commits
  3. After upstream sync, user is prompted to run `/gsd:update`
  4. Last sync SHA and date persisted in cache file
**Plans**: TBD

Plans:
- [ ] 05-01: Fork update command
- [ ] 05-02: Upstream check and sync

### Phase 6: Logo Assets
**Goal**: Custom logo assets for fork identity
**Depends on**: Nothing (independent, can run anytime)
**Requirements**: LOGO-01, LOGO-02, LOGO-03, LOGO-04, LOGO-05
**Success Criteria** (what must be TRUE):
  1. Isometric 3D rendering of interlocking squares icon exists
  2. Layout follows FYNORA style (icon left, text right)
  3. Colors are cyan (#5FD7D7) and green (#87D787)
  4. Text uses retro boxy font with bullet separators (Get*Stuff*Done)
**Plans**: TBD

Plans:
- [ ] 06-01: Logo design and assets

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6
(Phases 3 and 4 are independent and could run in parallel if needed)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Configuration System | 0/1 | Planned | - |
| 2. Statusline Redesign | 0/2 | Not started | - |
| 3. Installation Enhancements | 0/1 | Not started | - |
| 4. Branding and URLs | 0/1 | Not started | - |
| 5. Update Commands | 0/2 | Not started | - |
| 6. Logo Assets | 0/1 | Not started | - |

---
*Roadmap created: 2026-01-28*
*Requirements: 28 total, 28 mapped*
