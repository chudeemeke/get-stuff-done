# Requirements: GetStuffDone v1.0.0 Overlay Architecture

**Defined:** 2026-03-28
**Core Value:** Get upstream improvements automatically while preserving fork identity and additions
**Design Spec:** docs/superpowers/specs/2026-03-28-overlay-architecture-design.md

## v1.0.0 Requirements

Requirements for the overlay architecture milestone. Ships as npm v3.0.0.

### Prototype Gate

- [x] **PROTO-01**: Upstream install.js runs correctly from a composed directory that preserves its internal structure
- [x] **PROTO-02**: Surface-only text branding (package name, URLs) in install.js does not break installation
- [x] **PROTO-03**: Overlay additions (fork hooks, commands, workflows) can be copied to target after upstream install completes

### Composition Pipeline

- [x] **COMP-01**: compose.js reads upstream files from node_modules/get-shit-done-cc/ and overlay files from overlay/
- [x] **COMP-02**: compose.js validates upstream directory structure matches expected layout before composing
- [x] **COMP-03**: compose.js applies feature flag filtering (exclude workflows, commands, agents, hooks, SDK by name)
- [x] **COMP-04**: compose.js applies overrides (files in overrides/ replace upstream equivalents)
- [x] **COMP-05**: compose.js applies surface-only branding from branding.json (text scope, not paths)
- [x] **COMP-06**: compose.js merges overlay additive files into composed output
- [x] **COMP-07**: compose.js writes .install-meta.json with upstream version, overlay version, timestamp, features disabled, overrides applied
- [x] **COMP-08**: compose.js detects collisions (overlay file at same path as upstream file) and errors with guidance
- [x] **COMP-09**: compose.js supports --dry-run and --diff flags
- [x] **COMP-10**: Each pipeline stage (resolve, filter, override, brand, merge) is a separate importable function following SRP
- [x] **COMP-11**: Composition pipeline tests written before implementation (TDD); composition tests verify branding, feature flags, overrides, collision detection, meta output

### Branding

- [x] **BRAND-01**: branding.json substitutions apply only to user-visible text (help text, docs, CLI output)
- [x] **BRAND-02**: Internal directory names (get-shit-done/) preserved unchanged in composed output
- [x] **BRAND-03**: Internal code paths, import statements, config keys, regex patterns are NOT branded
- [x] **BRAND-04**: Word-boundary matching prevents partial-string corruption
- [x] **BRAND-05**: LICENSE file preserved from upstream; CREDITS.md added attributing upstream
- [x] **BRAND-06**: branding.json validated against schema before use (prevent injection via malformed substitution rules)

### Feature Flags

- [x] **FEAT-01**: features.json controls file-level inclusion of workflows, commands, agents, hooks, SDK directory
- [x] **FEAT-02**: New upstream files not in any exclude list are included by default (opt-out model)
- [x] **FEAT-03**: Runtime flags exist in features.json for documentation but do NOT filter code in v3.0
- [x] **FEAT-04**: features.json validated against schema before use

### Override System

- [x] **OVER-01**: Files in overrides/ replace corresponding upstream files during composition
- [x] **OVER-02**: Every override requires a companion REASON.md; CI fails without it
- [x] **OVER-03**: check-overrides.js detects stale overrides when upstream version changes the underlying file
- [x] **OVER-04**: Zero overrides on day one; config and validation enhancements are wrappers in overlay/

### Installer

- [x] **INST-01**: bin/install.js delegates to upstream's install.js operating on composed dist/ files
- [x] **INST-02**: After upstream install completes, overlay additions copied to target (fork hooks, commands, workflows)
- [x] **INST-03**: .install-meta.json written to installed directory with version and composition metadata
- [x] **INST-04**: --uninstall removes both upstream and overlay files from target
- [x] **INST-05**: Existing v2.x installations detected and cleaned up during v3.0 install
- [x] **INST-06**: Installer tests written before implementation (TDD)

### Fork Code Port

- [x] **PORT-01**: sync.cjs ported to overlay/lib/ with imports updated
- [x] **PORT-02**: src/platform/ ported to overlay/src/platform/
- [x] **PORT-03**: src/theme/ ported to overlay/src/theme/
- [x] **PORT-04**: src/validation/ ported to overlay/src/validation/
- [x] **PORT-05**: bin/gsd.js ported to bin/ (launcher)
- [x] **PORT-06**: hooks/pre-compact.* ported to overlay/hooks/
- [x] **PORT-07**: Fork-specific workflows and commands ported to overlay/
- [x] **PORT-08**: Config and validation enhancements reimplemented as wrappers extending upstream modules
- [x] **PORT-09**: Existing fork tests ported alongside their code; tests pass after port

### Update Workflow

- [x] **UPD-01**: preview-update script diffs current pinned upstream version against latest on npm
- [x] **UPD-02**: Supply chain scan runs during preview-update, before bun update
- [x] **UPD-03**: check-overrides.js flags overrides affected by upstream changes
- [x] **UPD-04**: Rollback supported by pinning previous upstream version and recomposing

### Testing and Quality

- [x] **TEST-01**: Fork-specific code achieves 95%+ at EACH coverage metric (statements, branches, functions, lines) individually
- [x] **TEST-02**: Upstream test assertion categorisation completed (feasibility gate for compat runner approach)
- [x] **TEST-03**: Upstream compatibility runner executes upstream tests against composed dist/ output
- [x] **TEST-04**: TDD enforced: tests written before or alongside implementation in every phase, not as a separate phase

### CI and Enforcement

- [x] **CI-01**: check-boundary.js scans repo for upstream files outside overrides/; fails build if found
- [ ] **CI-02**: check-overrides.js verifies REASON.md exists for each override; fails build if missing
- [ ] **CI-03**: Cross-platform matrix (macOS, Linux, Windows) for all test suites
- [ ] **CI-04**: All four CI checks pass: fork tests, upstream compat, boundary check, override check

### Migration

- [ ] **MIG-01**: Current main tagged as v0.4.0-legacy before overlay branch merges
- [ ] **MIG-02**: overlay-architecture branch created with clean structure
- [ ] **MIG-03**: .planning/ history preserved across migration
- [ ] **MIG-04**: npm package name (@chude/get-stuff-done) and GitHub repo preserved
- [ ] **MIG-05**: Ships as v3.0.0 (semver major for architectural change)
- [ ] **MIG-06**: Rollback documented: users can install v2.4.0 if v3.0 has issues

## v2 Requirements

Deferred to future releases. Not in current roadmap.

### Enhanced Capabilities

- **ENH-01**: Runtime filtering in feature flags (requires upstream installer modularisation)
- **ENH-02**: CI job for weekly upstream outdated check with notification
- **ENH-03**: Automated upstream changelog summary generation

## Out of Scope

| Feature | Reason |
|---------|--------|
| Internal path renaming | QA review: cascades complexity through installer and tests; Android OEMs preserve internals |
| Runtime filtering in install.js | Upstream installer is 5K-line monolith; code-level filtering infeasible |
| Reimplementing upstream install logic | 5,000+ lines; delegation is the core architecture principle |
| TypeScript migration | Adds build complexity; upstream uses CJS; marginal benefit |
| Multi-upstream support | Single upstream (get-shit-done-cc) is sufficient |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROTO-01 through PROTO-03 | Phase 29 | Pending |
| COMP-01 through COMP-11 | Phase 30 | Pending |
| BRAND-01 through BRAND-06 | Phase 30 | Pending |
| FEAT-01 through FEAT-04 | Phase 31 | Complete |
| OVER-01 through OVER-04 | Phase 31 | Complete |
| PORT-01 through PORT-09 | Phase 32 | Pending |
| INST-01 through INST-06 | Phase 33 | Complete |
| UPD-01 through UPD-04 | Phase 33 | Pending |
| TEST-01 through TEST-04 | Phase 34 | Pending |
| CI-01 through CI-04 | Phase 34 | Pending |
| MIG-01 through MIG-06 | Phase 35 | Pending |

**Coverage:**
- v1.0.0 requirements: 61 total (PROTO: 3, COMP: 11, BRAND: 6, FEAT: 4, OVER: 4, PORT: 9, INST: 6, UPD: 4, TEST: 4, CI: 4, MIG: 6)
- Mapped to phases: 61
- Unmapped: 0

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 -- corrected requirement count from 52 to 61*
