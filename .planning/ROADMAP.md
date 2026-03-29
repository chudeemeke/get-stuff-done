# Roadmap: GetStuffDone

## Milestones

- v0.1.0 **GetStuffDone Fork** -- Phases 1-6 (shipped 2026-02-05)
- v0.2.0 **Hardening & Upstream Sync** -- Phases 7-17 (shipped 2026-02-21)
- v0.3.0 **Upstream Sync & Workflow Maturity** -- Phases 18-23 (shipped 2026-03-08)
- v0.4.0 **Platform Expansion** -- Phases 24-28 (superseded by overlay architecture)
- v1.0.0 **Overlay Architecture** -- Phases 29-35 (in progress)

## Phases

<details>
<summary>v0.1.0 GetStuffDone Fork (Phases 1-6) -- SHIPPED 2026-02-05</summary>

See: .planning/milestones/v0.1.0-ROADMAP.md

</details>

<details>
<summary>v0.2.0 Hardening & Upstream Sync (Phases 7-17) -- SHIPPED 2026-02-21</summary>

See: .planning/milestones/v0.2.0-ROADMAP.md

</details>

<details>
<summary>v0.3.0 Upstream Sync & Workflow Maturity (Phases 18-23) -- SHIPPED 2026-03-08</summary>

See: .planning/milestones/v0.3.0-ROADMAP.md

</details>

<details>
<summary>v0.4.0 Platform Expansion (Phases 24-28) -- SUPERSEDED</summary>

v0.4.0 was superseded by the v1.0.0 overlay architecture milestone. The direct-edit fork model that v0.4.0 was built on (cherry-pick sync of 569 commits) became unsustainable. The overlay architecture eliminates the sync treadmill entirely.

Phases 24-28 were partially started (Phase 24 had 2/4 plans in progress). Work from Phase 24 (quality verification, bug fixes, test coverage) carries forward as general codebase health but is not formally tracked in the new milestone.

### Phase 24: Quality Verification & Bug Fixes
**Status**: Superseded (2/4 plans completed)
**Requirements**: QUAL-01 through QUAL-05

### Phase 25: Upstream Sync Execution
**Status**: Not started (superseded)
**Requirements**: SYNC-III-01 through SYNC-III-06

### Phase 26: Post-Sync Stabilization
**Status**: Not started (superseded)
**Requirements**: SYNC-III-03

### Phase 27: Multi-Runtime Integration
**Status**: Not started (superseded)
**Requirements**: RUNTIME-01 through RUNTIME-04

### Phase 28: Multi-Runtime Polish
**Status**: Not started (superseded)
**Requirements**: RUNTIME-05 through RUNTIME-07

</details>

### v1.0.0 Overlay Architecture (In Progress)

**Milestone Goal:** Replace the direct-edit fork with an overlay/skin architecture. Upstream (get-shit-done-cc) becomes an npm devDependency consumed at v1.30.0. A composition pipeline builds dist/ at publish time. Surface-only branding preserves internal paths. Ships as npm v3.0.0.

- [x] **Phase 29: Prototype Gate** - Validate installer delegation mechanism before committing to overlay architecture (completed 2026-03-28)
- [x] **Phase 30: Composition Pipeline & Branding** - Build the core composition pipeline (resolve, filter, override, brand, merge) and surface-only branding system (completed 2026-03-28)
- [x] **Phase 31: Feature Flags & Override System** - File-level feature exclusion and explicit upstream module replacement with staleness detection (completed 2026-03-29)
- [ ] **Phase 32: Fork Code Port** - Port ~2,510 lines of fork-specific code to overlay/ structure with updated imports
- [ ] **Phase 33: Installer & Update Workflow** - Delegation-based installer and preview-update workflow with supply chain scanning
- [ ] **Phase 34: Testing & CI Enforcement** - 95%+ coverage per metric, upstream compatibility runner, boundary and override CI checks
- [ ] **Phase 35: Migration & Ship v3.0.0** - Tag legacy, merge overlay branch, upgrade path for existing users, publish v3.0.0

## Phase Details

### Phase 29: Prototype Gate
**Goal**: Confirm that upstream's install.js runs correctly from a composed directory with surface-only branding, and that overlay additions can layer on top -- before committing to the full overlay architecture
**Depends on**: Nothing (first phase of v1.0.0; go/no-go gate)
**Requirements**: PROTO-01, PROTO-02, PROTO-03
**Success Criteria** (what must be TRUE):
  1. Upstream install.js executes from a scratch directory that preserves its internal structure (get-shit-done/ paths intact) and installs to a target directory without errors
  2. Text-only branding applied to install.js (package name, URLs in help strings) does not break the installation process -- installed files are functional
  3. After upstream install completes, fork-specific files (a test hook, a test command) can be copied to the target directory and coexist without conflict
**Plans**: 1 plan
Plans:
- [x] 29-01-PLAN.md -- Prototype gate validation: upstream devDep, scratch dir setup, 3 PROTO integration tests

### Phase 30: Composition Pipeline & Branding
**Goal**: Users can run `bun run compose` and get a correct dist/ output that merges upstream files with overlay files, applies surface-only branding, and produces an auditable .install-meta.json
**Depends on**: Phase 29 (delegation mechanism validated)
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, COMP-07, COMP-08, COMP-09, COMP-10, COMP-11, BRAND-01, BRAND-02, BRAND-03, BRAND-04, BRAND-05, BRAND-06
**Success Criteria** (what must be TRUE):
  1. `bun run compose` reads from node_modules/get-shit-done-cc/ and overlay/, validates upstream structure, and writes a complete dist/ with .install-meta.json audit trail
  2. Branding substitutions appear in user-visible text (help strings, docs, CLI output) but internal directory names (get-shit-done/), code paths, import statements, config keys, and regex patterns are untouched
  3. Each pipeline stage (resolve, filter, override, brand, merge) is a separate importable function with its own tests; composition tests cover branding, feature flags, overrides, collision detection, and meta output
  4. `bun run compose --dry-run` previews changes without writing; `bun run compose --diff` shows delta since last composition
  5. Collision detection errors when an overlay file exists at the same path as an upstream file, with guidance to move to overrides/ if intentional
**Plans**: 3 plans
Plans:
- [x] 30-01-PLAN.md -- Scaffold overlay/ directory structure and TDD branding engine (BRAND-01 through BRAND-06)
- [x] 30-02-PLAN.md -- TDD 5-stage composition pipeline with CLI entry point (COMP-01 through COMP-10)
- [x] 30-03-PLAN.md -- Gap closure: computeDelta() tracks CREDITS.md and .install-meta.json additive outputs (COMP-09)

### Phase 31: Feature Flags & Override System
**Goal**: Fork maintainer can disable upstream features by name in features.json and replace upstream modules via overrides/ with enforced documentation and staleness detection
**Depends on**: Phase 30 (composition pipeline operational)
**Requirements**: FEAT-01, FEAT-02, FEAT-03, FEAT-04, OVER-01, OVER-02, OVER-03, OVER-04
**Success Criteria** (what must be TRUE):
  1. Adding a workflow/command/agent/hook name to the exclude list in features.json causes that file to be absent from dist/ after composition
  2. New upstream files not mentioned in any exclude list appear automatically in dist/ (opt-out model verified)
  3. A file placed in overrides/ replaces the corresponding upstream file in dist/; composition fails if the override lacks a companion REASON.md
  4. check-overrides.js detects when the upstream version has changed since an override was written and reports which overrides need review
  5. Zero overrides exist on day one; config and validation enhancements are wrappers in overlay/ that extend upstream modules
**Plans**: 3 plans
Plans:
- [x] 31-01-PLAN.md -- TDD features.json AJV validation and filter() category exclusion (FEAT-01 through FEAT-04)
- [x] 31-02-PLAN.md -- TDD override() file replacement with REASON.md enforcement (OVER-01, OVER-02, OVER-04)
- [x] 31-03-PLAN.md -- TDD check-overrides.js standalone staleness detection (OVER-03)

### Phase 32: Fork Code Port
**Goal**: All ~3,800 lines of fork-specific source code live in overlay/ with updated imports, and existing fork tests pass against the ported code
**Depends on**: Phase 31 (overlay/ structure and composition pipeline complete)
**Requirements**: PORT-01, PORT-02, PORT-03, PORT-04, PORT-05, PORT-06, PORT-07, PORT-08, PORT-09
**Success Criteria** (what must be TRUE):
  1. sync.cjs, platform detection, theme system, validation module, launcher, hooks, workflows, and commands all live under overlay/ (or bin/ for the launcher) with correct import paths
  2. Config and validation enhancements are implemented as wrappers that extend upstream modules via import, not as overrides that replace them
  3. Existing fork tests ported alongside their code pass without modification to test assertions (only import paths change)
  4. `bun run compose` produces dist/ that includes both upstream files and all ported overlay code in the correct directory layout
**Plans**: 3 plans
Plans:
- [ ] 32-01-PLAN.md -- Port leaf modules (platform, theme, validation) to overlay/src/ with test import updates
- [ ] 32-02-PLAN.md -- Port sync.cjs to overlay/lib/, create sync-tools.cjs CLI, port fork-specific markdown files
- [ ] 32-03-PLAN.md -- Port config, hooks, validate-configs to overlay/, update launcher imports, verify composition

### Phase 33: Installer & Update Workflow
**Goal**: End users can install the fork via `bunx @chude/get-stuff-done --claude --global` using delegation to upstream's install.js, and the maintainer can preview and apply upstream updates with supply chain scanning
**Depends on**: Phase 32 (all fork code ported; dist/ contains complete composed output)
**Requirements**: INST-01, INST-02, INST-03, INST-04, INST-05, INST-06, UPD-01, UPD-02, UPD-03, UPD-04
**Success Criteria** (what must be TRUE):
  1. bin/install.js delegates to upstream's install.js (from dist/) which installs to the target directory, then copies overlay additions (hooks, commands, workflows) on top
  2. .install-meta.json is written to the installed directory with upstream version, overlay version, timestamp, features disabled, and overrides applied
  3. `--uninstall` removes both upstream-installed and overlay-installed files from the target
  4. v2.x installations are detected (by checking .install-meta.json for missing overlay_version or version < 3.0) and cleaned up before v3.0 install proceeds
  5. `bun run preview-update` diffs pinned upstream version against latest on npm, runs supply chain scan, and flags overrides affected by upstream changes -- all before any upgrade happens
**Plans**: TBD

### Phase 34: Testing & CI Enforcement
**Goal**: Fork-specific code achieves 95%+ coverage at each metric individually, upstream compatibility runner validates composed output, and CI enforces boundary and override rules on every push
**Depends on**: Phase 33 (installer and update workflow complete; full system available for end-to-end testing)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, CI-01, CI-02, CI-03, CI-04
**Success Criteria** (what must be TRUE):
  1. Fork test suite achieves 95%+ at statements, branches, functions, and lines individually -- each metric passes independently
  2. Upstream test assertions are categorised (path-based, package-name-based, behavioural) and the compatibility runner approach is determined by the feasibility gate (>30% needing adaptation triggers reassessment)
  3. Upstream compatibility runner executes upstream tests against composed dist/ output and reports pass/fail
  4. CI matrix runs all four checks (fork tests, upstream compat, boundary check, override check) on macOS, Linux, and Windows
  5. check-boundary.js fails the build if any upstream file exists in the repo outside overrides/; check-overrides.js fails the build if any override lacks a REASON.md
**Plans**: TBD

### Phase 35: Migration & Ship v3.0.0
**Goal**: Existing users can upgrade from v2.x to v3.0.0 cleanly, the overlay-architecture branch becomes main, and the package ships to npm as v3.0.0
**Depends on**: Phase 34 (all tests pass, CI green on all platforms)
**Requirements**: MIG-01, MIG-02, MIG-03, MIG-04, MIG-05, MIG-06
**Success Criteria** (what must be TRUE):
  1. Current main is tagged as v0.4.0-legacy and the overlay-architecture branch is created with clean overlay structure
  2. .planning/ history, npm package name (@chude/get-stuff-done), and GitHub repo are all preserved across migration
  3. `aidev release major` ships v3.0.0 to npm; `bunx @chude/get-stuff-done@3.0.0 --claude --global` installs successfully on a clean machine
  4. Users on v2.4.0 can install v3.0.0 and the installer detects and cleans up v2.x artifacts automatically
  5. Rollback is documented: `bunx @chude/get-stuff-done@2.4.0 --claude --global` installs the legacy version
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 29 -> 30 -> 31 -> 32 -> 33 -> 34 -> 35

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Configuration System | v0.1.0 | 1/1 | Complete | 2026-01-30 |
| 2. Statusline Redesign | v0.1.0 | 5/5 | Complete | 2026-02-02 |
| 3. Installation Enhancements | v0.1.0 | 1/1 | Complete | 2026-02-02 |
| 4. Branding & URLs | v0.1.0 | 1/1 | Complete | 2026-02-03 |
| 5. Update Commands | v0.1.0 | 2/2 | Complete | 2026-02-04 |
| 6. Logo Assets | v0.1.0 | 2/2 | Complete | 2026-02-05 |
| 7. Security Hardening & Tooling | v0.2.0 | 3/3 | Complete | 2026-02-08 |
| 8. Upstream Sync | v0.2.0 | 3/3 | Complete | 2026-02-09 |
| 9. Cross-Platform Foundation | v0.2.0 | 4/4 | Complete | 2026-02-11 |
| 10. Claude Code Adoption | v0.2.0 | 8/8 | Complete | 2026-02-14 |
| 11. CI/CD | v0.2.0 | 6/6 | Complete | 2026-02-17 |
| 12. Missing Workflows | v0.2.0 | 1/1 | Complete | 2026-02-17 |
| 13. Hook Bundling | v0.2.0 | 1/1 | Complete | 2026-02-18 |
| 14. Security Wiring | v0.2.0 | 3/3 | Complete | 2026-02-19 |
| 15. GSD Tools Bundling | v0.2.0 | 1/1 | Complete | 2026-02-19 |
| 16. Platform Quality | v0.2.0 | 1/1 | Complete | 2026-02-20 |
| 17. Agent Teams Wiring | v0.2.0 | 1/1 | Complete | 2026-02-21 |
| 18. Upstream Sync Execution | v0.3.0 | 6/6 | Complete | 2026-02-23 |
| 19. Post-Sync Stabilization | v0.3.0 | 3/3 | Complete | 2026-02-23 |
| 20. Sync Safety & Transparency | v0.3.0 | 2/2 | Complete | 2026-02-23 |
| 21. Sync Intelligence | v0.3.0 | 3/3 | Complete | 2026-02-25 |
| 22. Advanced Sync Automation | v0.3.0 | 2/2 | Complete | 2026-03-07 |
| 23. v0.3.0 Gap Closure | v0.3.0 | 1/1 | Complete | 2026-03-08 |
| 24-28. Platform Expansion | v0.4.0 | - | Superseded | - |
| 29. Prototype Gate | v1.0.0 | 1/1 | Complete | 2026-03-28 |
| 30. Composition Pipeline & Branding | v1.0.0 | 3/3 | Complete | 2026-03-28 |
| 31. Feature Flags & Override System | v1.0.0 | Complete    | 2026-03-29 | 2026-03-29 |
| 32. Fork Code Port | v1.0.0 | 0/3 | Not started | - |
| 33. Installer & Update Workflow | v1.0.0 | 0/? | Not started | - |
| 34. Testing & CI Enforcement | v1.0.0 | 0/? | Not started | - |
| 35. Migration & Ship v3.0.0 | v1.0.0 | 0/? | Not started | - |
