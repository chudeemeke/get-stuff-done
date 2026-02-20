# Phase 15: gsd-tools.js Bundling - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Bundle gsd-tools.js via esbuild so `require('../../src/validation')` resolves correctly after copy-mode installation to `~/.claude/`. Dev-mode (`--link`) must continue working unchanged. This is a build infrastructure fix only -- no new features, no behavior changes.

</domain>

<decisions>
## Implementation Decisions

### Bundle output location
- Output to `get-stuff-done/bin/dist/gsd-tools.js` (matching Phase 13's `hooks/dist/` pattern)
- Source `bin/gsd-tools.js` stays readable and unmodified
- `bin/dist/` is gitignored (generated on build)
- Installer copies from `bin/dist/gsd-tools.js` for copy-mode installs

### Build script consolidation
- Rename `scripts/build-hooks.js` to `scripts/build.js` via `git mv`
- Add gsd-tools.js as a second build target in the same file
- Shared esbuild config (platform: 'node', format: 'cjs', bundle: true) across targets
- Single `prepublishOnly` call to `scripts/build.js`
- Rationale: unified build SSOT, DRY esbuild config, industry standard pattern (single build config with multiple entry points)

### Test approach
- Dist regression tests co-located in existing gsd-tools test file (matching Phase 13 pattern)
- Not a separate dist test file

### Claude's Discretion
- esbuild external/inline decisions for built-in Node.js modules
- Exact shared config structure within build.js
- Whether to use esbuild's `entryPoints` array or sequential `build()` calls

</decisions>

<specifics>
## Specific Ideas

- Follow Phase 13 hook bundling pattern exactly (proven approach)
- `beforeAll` auto-builds dist if missing (CI support after fresh checkout)
- No minification (readable dist files aid debugging, matching Phase 13 decision)

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 15-gsd-tools-bundling*
*Context gathered: 2026-02-20*
