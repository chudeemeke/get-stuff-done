# Upstream Sync Process Improvement Plan

**Date:** 2026-02-09
**Context:** Post-Phase-8 retrospective identifying recurring issues during upstream sync

## Problem Statement

Phase 8 (upstream sync v1.18.0) encountered several issues that should not recur in future syncs:

1. **Cherry-picks deleted fork files** -- package.json, README.md, bin/install.js, hooks/gsd-statusline.js were deleted because upstream removed them
2. **Planning files overwritten** -- .planning/ROADMAP.md, REQUIREMENTS.md, PROJECT.md overwritten with upstream content
3. **Incomplete protected paths** -- Only a subset of fork-critical files were protected
4. **Missing files not detected** -- 7 reference/template files and 16 workflow references went unnoticed until post-sync verification
5. **Branding pass was manual** -- sed replacements applied by hand across 111 files
6. **No runtime install step** -- Files copied to project repo but not installed to ~/.claude/get-stuff-done/
7. **Agent tool gaps** -- gsd-verifier missing Write tool caused settings.local.json corruption (Issue #491)

## Root Causes

| Issue | Root Cause |
|-------|-----------|
| Fork files deleted | Protected paths list was incomplete |
| Planning files overwritten | .planning/ not in protected paths |
| Missing files | No post-sync inventory comparison |
| Manual branding | No automated branding script |
| No runtime install | Sync workflow doesn't include install step |
| Agent tool gap | Upstream bug, not sync-specific |

## Improvements

### 1. Expanded Protected Paths

**Current protected paths (Phase 8):**
```
eslint.config.js, src/validation/, get-stuff-done/, assets/gsd-logo-*,
config/, src/theme/
```

**Proposed protected paths:**
```
# Fork identity
package.json
README.md
LICENSE
.planning/

# Fork customizations
eslint.config.js
src/validation/
src/theme/
assets/gsd-logo-*
config/

# Fork-specific files
hooks/gsd-statusline.js
bin/install.js
get-stuff-done/  (entire fork template directory)

# Agent customizations (if any local changes)
agents/gsd-verifier.md
agents/gsd-plan-checker.md
```

**Implementation:** Store in `.planning/sync/protected-paths.txt` (one pattern per line). The sync orchestrator reads this file before executing cherry-picks.

### 2. Pre-Sync File Inventory

Before starting cherry-picks, generate a complete file inventory comparison:

```bash
# Fork files
find get-stuff-done/ -type f | sort > .planning/sync/fork-inventory.txt

# Upstream files (from archive or fetched branch)
find .upstream/get-shit-done/ -type f | sort > .planning/sync/upstream-inventory.txt

# Files only in upstream (candidates for copying)
comm -23 upstream-inventory.txt fork-inventory.txt > sync-candidates.txt

# Files only in fork (should not be deleted)
comm -13 upstream-inventory.txt fork-inventory.txt > fork-only.txt
```

**Gate:** Orchestrator presents inventory diff to user BEFORE cherry-picking. User approves which upstream-only files to include.

### 3. Post-Sync Verification Checklist

Automated verification after sync completes, BEFORE merge to main:

**a) Reference resolution check:**
```bash
# Find all @~/.claude/get-stuff-done/ references
grep -r '@~/.claude/get-stuff-done/' commands/ agents/ | \
  sed 's/.*@~\/.claude\/get-stuff-done\///' | \
  sed 's/[[:space:]].*//' | sort -u > referenced-files.txt

# Check each reference resolves
while read -r ref; do
  if [ ! -f "get-stuff-done/$ref" ]; then
    echo "MISSING: $ref"
  fi
done < referenced-files.txt
```

**b) Branding completeness check:**
```bash
# No remaining upstream branding in active files
grep -r 'get-shit-done' commands/ agents/ get-stuff-done/ \
  --include='*.md' --include='*.js' --include='*.json' \
  -l | grep -v '.upstream/'
# Should return empty
```

**c) Fork file integrity check:**
```bash
# Protected files still match pre-sync state
for file in $(cat .planning/sync/protected-paths.txt); do
  git diff HEAD~N..HEAD -- "$file" && echo "MODIFIED: $file"
done
# Should return empty (protected files unchanged)
```

**d) Config validation:**
```bash
node -e "JSON.parse(require('fs').readFileSync('package.json'))"
node -e "JSON.parse(require('fs').readFileSync('.planning/config.json'))"
node get-stuff-done/bin/gsd-tools.js --version 2>/dev/null
```

### 4. Automated Branding Script

Create `scripts/apply-branding.sh`:

```bash
#!/usr/bin/env bash
# Apply fork branding to files synced from upstream

SEARCH="get-shit-done"
REPLACE="get-stuff-done"

# Directories to process (exclude .upstream/)
DIRS="agents commands get-stuff-done"

for dir in $DIRS; do
  find "$dir" -type f \( -name '*.md' -o -name '*.js' -o -name '*.json' \) | while read -r file; do
    if grep -q "$SEARCH" "$file"; then
      sed -i "s|$SEARCH|$REPLACE|g" "$file"
      echo "Branded: $file"
    fi
  done
done

# Path references
find "$DIRS" -type f -name '*.md' | while read -r file; do
  sed -i "s|~/.claude/get-shit-done|~/.claude/get-stuff-done|g" "$file"
done
```

### 5. Runtime Install Step

Add to sync workflow Stage 7 (FINALIZE):

```bash
# Sync project repo to installed runtime location
INSTALL_DIR="$HOME/.claude/get-stuff-done"

# References
cp -u get-stuff-done/references/*.md "$INSTALL_DIR/references/"

# Templates
cp -u get-stuff-done/templates/*.md "$INSTALL_DIR/templates/"

# Workflows
cp -u get-stuff-done/workflows/*.md "$INSTALL_DIR/workflows/"

# Agents (to installed location)
cp -u agents/*.md "$HOME/.claude/agents/"

echo "Runtime install complete: $INSTALL_DIR"
```

### 6. Testing Strategy

GSD commands are Claude Code slash commands and cannot be tested via automated scripts. Testing strategy:

**Automated (pre-merge):**
- Reference resolution (section 3a)
- Branding completeness (section 3b)
- Fork integrity (section 3c)
- Config validation (section 3d)
- gsd-tools.js smoke test: `node get-stuff-done/bin/gsd-tools.js --help`

**Manual (post-merge):**
Run these GSD commands in a fresh Claude Code session:

| Command | Validates |
|---------|-----------|
| `/gsd:help` | Command registration, help workflow |
| `/gsd:progress` | STATE.md reading, roadmap parsing |
| `/gsd:settings` | Config loading, settings workflow |
| `/gsd:plan-phase 9` | Full orchestration: research, plan, verify loop |

If `/gsd:progress` shows correct state and `/gsd:plan-phase` successfully spawns agents, the sync is validated.

## Integration into Existing Workflow

The `upstream-sync.md` workflow already has 7 stages. Improvements slot in as:

| Stage | Current | Improved |
|-------|---------|----------|
| Pre-Stage 1 | -- | Load protected-paths.txt, generate file inventory |
| Stage 1 (FETCH) | Same | Same |
| Stage 2 (PRESENT) | Same | Include inventory diff in presentation |
| Stage 3 (PLAN) | Same | Include new-files-to-copy in plan |
| Stage 3.5 (SECURITY REVIEW) | Same | Same |
| Stage 4 (EXECUTE) | Cherry-pick only | Cherry-pick + copy new files + run branding script |
| Stage 5 (VERIFY) | Syntax only | Full post-sync checklist (3a-3d) |
| Stage 6 (PUBLISH) | Same | Same |
| Stage 7 (FINALIZE) | Cache update only | Cache + runtime install |

## Priority

1. **Protected paths file** -- prevents the most damaging issues (fork file deletion)
2. **Post-sync verification checklist** -- catches issues before merge
3. **Branding script** -- reduces manual work and error
4. **Pre-sync inventory** -- identifies missing files early
5. **Runtime install step** -- prevents forgotten installs
6. **Manual test protocol** -- validates end-to-end

## Open Questions

1. **16 missing workflow files** -- These don't exist in upstream either. Should we create them as fork-specific additions, or wait for upstream to provide them? Commands work without them (degraded mode) but would benefit from structured orchestration.

2. **Sync frequency** -- How often to sync? On every upstream release, or batch multiple releases?

3. **Automation level** -- Should the upstream-sync.md workflow incorporate all improvements, or keep some as manual pre/post steps?

---
*Created: 2026-02-09*
*Related: .planning/phases/08-upstream-sync/sync-report.md*
