# Phase 38 Deferred Items

## Compose Pipeline: Raw Source Hooks Overwrite Bundled Hooks

**Discovered during:** 38-02 Task 2 pre-verification
**Severity:** Medium (blocks standalone `node hooks/gsd-statusline.js` execution)
**Description:** The compose pipeline copies raw overlay source files from `overlay/hooks/` into `dist/hooks/`, overwriting bundled output. The installed `hooks/gsd-statusline.js` has `require('../../src/theme')` which fails outside the source tree. The bundled self-contained version lives at `hooks/dist/gsd-statusline.js` but the overlay manifest and upstream installer both point to `hooks/gsd-statusline.js`.
**Impact:** Running `node ~/.claude/hooks/gsd-statusline.js` directly throws MODULE_NOT_FOUND. Claude Code may invoke hooks differently (piped execution, or the hook may have been configured before the overlay copy overwrote it).
**Fix options:**
  1. Change patchStatusLine to point to `hooks/dist/gsd-statusline.js` (bundled version)
  2. Change compose to copy bundled hooks instead of raw source to `dist/hooks/`
  3. Run build AFTER compose so esbuild re-bundles the raw source files
**Pre-existing:** Yes -- caused by Plan 01 overlay hook relocation + compose ordering, not by Plan 02 patchStatusLine changes.
