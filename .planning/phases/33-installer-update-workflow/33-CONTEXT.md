# Phase 33: Installer & Update Workflow - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

End users install the fork via `bunx @chude/get-stuff-done --claude --global` using delegation to upstream's install.js. The maintainer can preview and apply upstream updates with supply chain scanning. Covers install, uninstall, v2.x upgrade detection, and preview-update workflow.

</domain>

<decisions>
## Implementation Decisions

### Install delegation
- Subprocess delegation via child_process.spawn with stdio: 'inherit' for stdout/stderr passthrough
- Upstream's install.js (5,008-line monolith) is designed as a CLI entry point with 15 process.exit() calls -- require() would kill the fork process on any upstream error
- All user flags (--claude, --opencode, --all, --global, --local, etc.) pass through to upstream unchanged
- On upstream success (exit 0): copy overlay-only files from composed dist/ to the installed target directory
- On upstream failure (non-zero exit): clean up any partial upstream files, report the error with upstream's stderr, exit with upstream's exit code
- .install-meta.json written after successful overlay application with upstream version, overlay version, timestamp, features disabled, overrides applied

### v2.x upgrade path
- Detection uses both signals: .install-meta.json check first (missing overlay_version or version < 3.0), file structure fingerprint fallback (src/ directory, old hooks layout)
- When v2.x detected: prompt user with what will be removed, require confirmation before proceeding
- Cleanup strategy: wipe the installation target directory entirely, then run fresh v3.0 install. User config (~/.gsd/) and project data (.planning/) are outside the install dir blast radius
- Matches industry pattern (Homebrew upgrade, npm install -g): managed install dir is owned by the installer, user data lives elsewhere

### Preview-update UX
- `bun run preview-update` is a read-only command that shows a structured diff report: version delta, files added/removed/changed, overrides affected by upstream changes, features.json impact, supply chain scan results (6 vectors from existing sync.cjs)
- Supply chain scan runs automatically as part of preview -- security at the foundation per WoW, not deferred to apply step
- Critical findings are flagged prominently but do not block -- maintainer decides
- Preview and apply are separate operations (Terraform plan/apply pattern). No auto-apply. Maintainer bumps version in package.json and re-composes manually
- Actionable next steps included in report output

### Uninstall behavior
- --uninstall removes all files in the installation target directory (both upstream and overlay files)
- Does NOT remove: user config (~/.gsd/config.json), project data (.planning/), Claude Code settings (~/.claude/)
- No confirmation prompt for --uninstall -- matches upstream behavior. The --uninstall flag itself is sufficient intent signal
- Idempotent: missing files skipped, missing target dir exits 0 with "Nothing to uninstall"

### Claude's Discretion
- Exact error message formatting for install failures
- Progress indicators during installation (spinner, dots, etc.)
- Temp file handling during compose-before-install
- preview-update report formatting and section ordering
- Whether to show file counts or file names in the cleanup confirmation prompt

</decisions>

<specifics>
## Specific Ideas

- Subprocess delegation is the OEM pattern: run upstream as-is, customize after (matches the Android/AOSP analogy from PROJECT.md)
- Upstream's GSD_TEST_MODE env var + install() export can be used for test isolation, but production path must be subprocess
- The existing sync.cjs runSupplyChainChecks() scans 6 attack vectors -- reuse for preview-update, don't reimplement
- The existing check-overrides.js (Phase 31) detects stale overrides -- preview-update should invoke it to flag affected overrides

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 33-installer-update-workflow*
*Context gathered: 2026-03-29*
