---
id: quick-002
type: quick
completed: 2026-02-05
duration: 3 minutes
---

# Quick Task 002: Fix Hooks Symlink-to-Copy Transition Bug

**One-liner:** Hooks directory now properly removes symlinks before copying, matching agents directory behavior

## Objective

Fix hooks symlink-to-copy transition bug in bin/install.js. When users switch from `--link` mode to copy mode, the hooks directory must be handled the same way as agents - check for existing symlink and remove it before copying files.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add symlink detection to hooks installation | f913e41 | bin/install.js |
| 2 | Verify consistency with agents pattern | f913e41 | bin/install.js |

## Changes Made

### Bug Fix
- Added symlink detection code between lines 1260 and 1269 in bin/install.js
- Checks for existing symlink before `mkdirSync(hooksDest, ...)`
- Uses `lstatSync()` (not `statSync()`) to avoid following symlinks
- Only removes if path IS a symlink (preserves real directories)

### Pattern Consistency
- Hooks section now mirrors agents section (lines 1168-1175)
- Both use same conditional structure: `existsSync` -> `lstatSync` -> `isSymbolicLink` -> `unlinkSync`
- Both positioned before `mkdirSync`
- Both have explanatory comments

## Verification Results

Verification confirmed:
- Symlink check appears before `mkdirSync` (lines 1261-1268)
- Pattern matches agents section exactly (same method calls)
- `lstatSync` used in both sections (line 1171 for agents, line 1264 for hooks)
- Syntax check passed: `node --check bin/install.js`

## Technical Details

**Problem:** The agents directory correctly checked for symlinks before copying (lines 1170-1175), but the hooks directory did not (lines 1260-1276). This caused hooks to remain as symlinks when switching from `--link` to copy mode, leading to potential installation failures.

**Solution:** Add identical symlink detection pattern to hooks section.

**Implementation:**
```javascript
// Before (missing symlink check):
} else {
  fs.mkdirSync(hooksDest, { recursive: true });
  // ... copy files ...
}

// After (with symlink check):
} else {
  // If hooksDest is a symlink (from previous link-mode install), remove it first
  // Otherwise mkdirSync may fail or behave unexpectedly with symlinks
  if (fs.existsSync(hooksDest)) {
    const stat = fs.lstatSync(hooksDest);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(hooksDest);
    }
  }
  fs.mkdirSync(hooksDest, { recursive: true });
  // ... copy files ...
}
```

**Why `lstatSync` not `statSync`:**
- `statSync()` follows symlinks and returns info about the TARGET
- `lstatSync()` does NOT follow symlinks and returns info about the LINK itself
- We need to detect the symlink itself, not what it points to

## Deviations from Plan

None - plan executed exactly as written.

## Files Modified

- `bin/install.js` (lines 1261-1268) - Added symlink detection for hooks directory

## Next Phase Readiness

Quick task complete. Bug fix unblocks pushing to GitHub and publishing to npm.

Switching from `--link` to copy mode will now properly handle both agents and hooks directories consistently.

## Success Criteria

- [x] bin/install.js passes syntax check
- [x] Hooks section has symlink detection before mkdirSync
- [x] Pattern matches agents section (lstatSync, isSymbolicLink, unlinkSync)
- [x] Switching from --link to copy mode will properly remove hooks symlinks

---
*Completed: 2026-02-05*
