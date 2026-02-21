# Phase 18: Upstream Sync Execution - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate 185 upstream commits (v1.10.0 through v1.20.5) into the fork, adopting the modular gsd-tools architecture (11 CJS domain modules under bin/lib/), while preserving fork identity (@chude/get-stuff-done) and passing the full test suite (563+ tests at 95%+ coverage on 3 CI platforms). This phase is execution only -- sync tooling, monitoring, and automation belong in Phases 20-22.

</domain>

<decisions>
## Implementation Decisions

### Sync Strategy
- Cherry-pick batches grouped by upstream release tag (minor version)
- Risk-based adaptive batching:
  - Pre-split batches: group by minor version (v1.10.x, v1.11.x, etc.) -- lower conflict risk, batch aggressively
  - Module-split batch: isolate the specific commits that introduce the 11-module architecture into a dedicated batch with maximum testing scrutiny
  - Post-split batches: group by minor version again -- changes to the now-aligned modular structure
- Estimated ~12-15 batches total, with the module split as the critical checkpoint
- Module migration happens during cherry-picks (follow upstream's natural evolution, not a separate step) -- Strangler Fig pattern, follows upstream's proven commit sequence
- Work on a feature branch (sync/v1.20.5), merge to main when all success criteria are met
- Single sync branch (no sub-branches per batch) -- linear history, bisectable, batch boundaries tracked via structured commits
- Preserve individual cherry-pick commits (no squashing) -- full traceability, git bisect support
- Approach comparison document built incrementally during sync, not as a final step

### Conflict Resolution
- Priority rule: fork wins on UX (statusline, install flow, update system, theme), upstream wins on architecture (module structure, internal patterns)
- 4-step triage model (industry standard from Chromium/LineageOS forks):
  1. **Classify each conflict by type:**
     - Mechanical (branding, URLs, package names) -- auto-resolve with branding pattern map, don't count toward threshold
     - Cosmetic (whitespace, import order) -- auto-resolve, prefer upstream, don't count
     - Semantic (different logic, different approach to same problem) -- requires agent judgment, counts toward threshold
     - Structural (file moved/reorganized/deleted vs modified) -- highest risk, counts toward threshold
  2. **Auto-resolve mechanical conflicts** using the branding pattern map (e.g., upstream-package-name -> @chude/get-stuff-done, upstream-repo-url -> chudeemeke/get-stuff-done)
  3. **Threshold: 3+ semantic/structural conflicts per batch** triggers pause-and-assess (signals architectural divergence, not routine sync)
  4. **When threshold hit:** commit clean work in that batch, document unresolved conflicts in approach comparison doc, continue to next batch, revisit tough conflicts with full context
- Stop batch, fix, resume on conflicts (industry standard) -- preserves git bisect compatibility, isolates conflict resolution
- Branding pattern map: seed upfront during research, expand during sync as new patterns surface
- New files from upstream: accept, review branding only (scan for upstream branding to replace)

### Identity Preservation
- Branding pass after every batch (not just module split or end)
- Branding automation: script applies pattern map, agent performs comprehensive spot-checks:
  - All files in high-risk paths (bin/, hooks/, package.json, README)
  - Any file where the pattern map made 3+ replacements
  - Any file type not previously encountered in the pattern map
  - User-facing output strings (not just imports/configs)
- Fork-only files (src/theme/*, hooks/gsd-*.js, .planning/*, etc.): never modify during sync, verify they still work after each batch
- Keep upstream module names (bin/lib/commands.js, config.js, etc.) -- minimizes future sync conflicts
- Full identity audit scope: package name, repo URLs, author field, license, homepage, bugs URL, npm scope, CLI binary name, branding strings in output
- Branding pattern map committed as reusable artifact (.planning/sync/branding-map.json) for future syncs
- Approach comparison document includes both divergences AND convergences between fork and upstream
- Protected paths list: comprehensive (package.json, README.md, bin/install.js, hooks/*, src/theme/*, .planning/*, all fork-identity files)
- CI/CD workflows (.github/workflows/): review and selectively adopt upstream improvements, keep fork-specific configurations

### Validation Checkpoints
- Full test suite (563+ tests) runs after every batch -- no exceptions
- Zero tolerance: any test failure must be resolved before cherry-picking the next batch
- Coverage metrics (95%+ at each metric) enforced at end only -- upstream code may temporarily lower coverage mid-sync
- Cross-platform CI (macOS, Linux, Windows) at key checkpoints only: after module-split batch, after final batch, before merge to main. Local tests (single platform) after every batch.
- Manual smoke test before merging sync branch to main: run key GSD commands end-to-end (install, hooks, gsd-tools commands)
- Structured batch commit messages including: upstream version range, commit count, conflict summary, test results -- creates audit trail
- New upstream test files: adopt and adapt to fork conventions (bun:test runner, fork naming patterns)
- ESLint security warnings (95 in upstream gsd-tools): defer to Phase 19 (non-blocking, upstream code)
- Done definition: all 5 success criteria must be met before merge to main

### Claude's Discretion
- Exact batch boundaries (determined during research by analyzing upstream tags)
- Specific files for the comprehensive protected paths list (enumerated from codebase during research)
- Exact branding pattern map entries (built from fork analysis during research)
- Number of execution plans this phase needs
- Manual smoke test command list
- Minor tactical decisions during execution (e.g., how to handle edge cases in auto-resolution)

</decisions>

<specifics>
## Specific Ideas

- Phase 8 (v0.2.0 sync of 72 commits) had issues: cherry-picks deleted fork files (package.json, README.md, bin/install.js, hooks/gsd-statusline.js) and overwrote .planning/ files. The comprehensive protected paths and branding automation address this.
- Fork UX features to preserve: 4-stage context window indicator (gsd-statusline.js), smart install mode detection (bin/install.js), role-aware update system (gsd-check-update.js, upstream.md)
- The sync is 2.5x larger than v0.2.0's sync (185 vs 72 commits) -- risk-based batching and the triage model account for this scale
- Upstream split gsd-tools.js into 11 CJS modules: commands, config, core, frontmatter, init, milestone, phase, roadmap, state, template, verify

</specifics>

<deferred>
## Deferred Ideas

- ESLint security warnings cleanup -- Phase 19 (post-sync stabilization)
- Sync tooling features (diff preview, rollback, dry-run) -- Phase 20
- Upstream monitoring and commit classification -- Phase 21
- Selective sync and AI-assisted conflict resolution -- Phase 22

</deferred>

---

*Phase: 18-upstream-sync-execution*
*Context gathered: 2026-02-27*
