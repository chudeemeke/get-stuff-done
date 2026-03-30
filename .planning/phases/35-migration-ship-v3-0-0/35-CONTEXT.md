# Phase 35: Migration & Ship v3.0.0 - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the overlay architecture as npm v3.0.0. Tag legacy state for rollback reference, update package.json to ship composed output, ensure v2.x users upgrade cleanly, and publish via aidev release/publish.

Requirements: MIG-01 through MIG-06.

</domain>

<decisions>
## Implementation Decisions

### Git History Strategy
- **D-01:** Tag-and-continue pattern. Tag the last pre-overlay commit as `v2.4.0-legacy` (not v0.4.0-legacy -- matches actual published version). All overlay work is already on main. No branch merging or history rewriting. MIG-01 is satisfied by the legacy tag; MIG-02 is satisfied by main already having the overlay structure.
- **D-02:** Full commit history preserved. No squashing overlay commits -- .planning/ history across 4 milestones is valuable context. Industry standard for architectural migrations (Homebrew, Node.js, Android OEMs all tag-and-continue).

### Package Contents (npm files array)
- **D-03:** Rewrite package.json `files` array to ship: `dist/`, `bin/`, `overlay/branding.json`, `overlay/features.json`, `overlay/.overlay-manifest.json`. Source (overlay/, src/, scripts/, tests/) and planning (.planning/) stay repo-only.
- **D-04:** Add `"prepublishOnly": "bun run compose"` to package.json scripts. Ensures dist/ is always freshly composed before any publish. Industry standard for build-then-ship packages (Next.js, Vite, esbuild).

### v2.x Upgrade Experience
- **D-05:** Warn-then-auto-clean pattern. When installer detects v2.x artifacts (via INST-05 detection logic), print a clear migration banner ("Upgrading from v2.x to v3.0 -- cleaning old files..."), remove v2.x-specific files, then proceed with v3.0 install. Non-interactive. Matches npm 6->7 and Homebrew 2->3 patterns.
- **D-06:** Rollback documented in README or UPGRADING.md: `bunx @chude/get-stuff-done@2.4.0 --claude --global` installs the legacy version. Simple version pin, no special tooling.

### Release Mechanics
- **D-07:** Direct release to npm @latest tag. `aidev release major` (tests, version bump to 3.0.0, git tag v3.0.0, push) followed by `aidev publish` (npm publish with OTP). No release candidate cycle -- private fork with single-user audience doesn't benefit from RC staging.
- **D-08:** Pre-publish validation is CI + prepublishOnly compose. No additional npm pack dry-run step.

### Claude's Discretion
- Exact list of v2.x files to clean up during upgrade (based on what INST-05 already detects)
- README/UPGRADING.md wording and structure
- Whether to clean up old sync-snapshot-* tags as part of migration housekeeping

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture
- `docs/superpowers/specs/2026-03-28-overlay-architecture-design.md` -- full overlay architecture design spec
- `.planning/PROJECT.md` -- project context, constraints, key decisions
- `.planning/REQUIREMENTS.md` -- MIG-01 through MIG-06 requirements with acceptance criteria

### Existing Implementation
- `bin/install.js` -- v3.0 delegation installer with v2.x detection (INST-05)
- `scripts/compose.js` -- composition pipeline that produces dist/
- `overlay/.overlay-manifest.json` -- manifest of overlay files for installer
- `package.json` -- current files array and scripts (needs updating)

### Prior Phase Context
- `.planning/phases/33-installer-update-workflow/33-01-SUMMARY.md` -- installer architecture details
- `.planning/phases/34-testing-ci-enforcement/34-04-SUMMARY.md` -- CI matrix configuration

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/install.js` already has v2.x detection logic (INST-05): checks .install-meta.json format, src/ fingerprint, get-stuff-done/ without get-shit-done/
- `scripts/compose.js` produces dist/ with .install-meta.json containing all metadata
- `overlay/.overlay-manifest.json` lists all overlay-specific files for the installer
- `.github/workflows/ci.yml` has 5-job CI matrix already running

### Established Patterns
- `aidev release` and `aidev publish` are the standard release workflow
- prepublishOnly scripts for build-before-publish (varLock, other projects)
- Conventional commits format for version bump commits

### Integration Points
- `package.json` files array -- must be updated before publish
- `package.json` scripts -- must add prepublishOnly
- `package.json` version -- 2.4.0 -> 3.0.0 via aidev release major
- Git tags -- v2.4.0-legacy tag on pre-overlay commit, v3.0.0 on release commit

</code_context>

<specifics>
## Specific Ideas

- User wants recommendations grounded in what industry leaders do (Homebrew, npm, Node.js, React patterns referenced)
- Tag name should match actual version (v2.4.0-legacy, not v0.4.0-legacy as originally spec'd)
- MIG-01/02 requirements need reinterpretation: no branch to merge, tag-and-continue instead

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 35-migration-ship-v3-0-0*
*Context gathered: 2026-03-30*
