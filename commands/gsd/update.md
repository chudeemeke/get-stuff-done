---
name: gsd:update
description: Update GSD to latest version with changelog display
---

<objective>
Check for GSD updates, install if available, and display what changed.

Provides a better update experience than raw `npx @chude/get-stuff-done` by showing version diff and changelog entries.
</objective>

<process>

<step name="get_installed_version">
Read installed version:

```bash
cat ~/.claude/get-stuff-done/VERSION 2>/dev/null
```

**If VERSION file missing:**
```
## GSD Update

**Installed version:** Unknown

Your installation doesn't include version tracking.

Running fresh install...
```

Proceed to install step (treat as version 0.0.0 for comparison).
</step>

<step name="check_latest_version">
Read registry preference from cache (if available):

```bash
REGISTRY=$(cat .planning/sync/cache.json 2>/dev/null | grep -o '"last_used"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"')
REGISTRY=${REGISTRY:-https://registry.npmjs.org}
```

Check registry for latest version:

```bash
npm view @chude/get-stuff-done version --registry "$REGISTRY" 2>/dev/null
```

**If npm check fails:**
```
Couldn't check for updates (offline or registry unavailable).

To update manually: `npx @chude/get-stuff-done --global`
```

STOP here if registry unavailable.
</step>

<step name="compare_versions">
Compare installed vs latest:

**If installed == latest:**
```
## GSD Update

**Installed:** X.Y.Z
**Latest:** X.Y.Z

You're already on the latest version.
```

STOP here if already up to date.

**If installed > latest:**
```
## GSD Update

**Installed:** X.Y.Z
**Latest:** A.B.C

You're ahead of the latest release (development version?).
```

STOP here if ahead.
</step>

<step name="show_changes_and_confirm">
**If update available**, fetch and show what's new BEFORE updating:

1. Fetch changelog (same as fetch_changelog step)
2. Extract entries between installed and latest versions
3. Display preview and ask for confirmation:

```
## GSD Update Available

**Installed:** 1.5.10
**Latest:** 1.5.15

### What's New
────────────────────────────────────────────────────────────

## [1.5.15] - 2026-01-20

### Added
- Feature X

## [1.5.14] - 2026-01-18

### Fixed
- Bug fix Y

────────────────────────────────────────────────────────────

⚠️  **Note:** The installer performs a clean install of GSD folders:
- `~/.claude/commands/gsd/` will be wiped and replaced
- `~/.claude/get-stuff-done/` will be wiped and replaced
- `~/.claude/agents/gsd-*` files will be replaced

Your custom files in other locations are preserved:
- Custom commands in `~/.claude/commands/your-stuff/` ✓
- Custom agents not prefixed with `gsd-` ✓
- Custom hooks ✓
- Your CLAUDE.md files ✓

If you've modified any GSD files directly, back them up first.
```

Use AskUserQuestion:
- Question: "Proceed with update?"
- Options:
  - "Yes, update now"
  - "No, cancel"

**If user cancels:** STOP here.
</step>

<step name="run_update">
Run the update:

```bash
npx @chude/get-stuff-done --global
```

Capture output. If install fails, show error and STOP.

Clear the update cache so statusline indicator disappears:

```bash
rm -f ~/.claude/cache/gsd-update-check.json
```

Update sync cache with installed version (using jq for nested structure):

```bash
if [ -d ".planning/sync" ] && [ -f ".planning/sync/cache.json" ]; then
  jq --arg v "${NEW_VERSION}" --arg d "$(date -Iseconds)" \
    '.last_update.version = $v | .last_update.date = $d' \
    .planning/sync/cache.json > /tmp/gsd-cache.tmp && \
    mv /tmp/gsd-cache.tmp .planning/sync/cache.json
fi
```
</step>

<step name="display_result">
Format completion message (changelog was already shown in confirmation step):

```
╔═══════════════════════════════════════════════════════════╗
║  GSD Updated: v1.5.10 → v1.5.15                           ║
╚═══════════════════════════════════════════════════════════╝

⚠️  Restart Claude Code to pick up the new commands.

[View full changelog](https://github.com/chudeemeke/get-stuff-done/blob/main/CHANGELOG.md)
```
</step>

</process>

<success_criteria>
- [ ] Installed version read correctly
- [ ] Latest version checked via npm
- [ ] Update skipped if already current
- [ ] Changelog fetched and displayed BEFORE update
- [ ] Clean install warning shown
- [ ] User confirmation obtained
- [ ] Update executed successfully
- [ ] Restart reminder shown
</success_criteria>
