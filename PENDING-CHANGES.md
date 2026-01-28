# Pending Changes

Tracked changes needed for the GetStuffDone fork/rebrand. Nothing here has been implemented yet -- this is a planning document.

---

## 1. Symlink Installation

**Status:** Not started
**Priority:** High

The installer (`bin/install.js`) currently COPIES files to `~/.claude/`. Everything should be SYMLINKED back to `C:\Projects\get-stuff-done\` so edits in either location stay in sync.

### Files currently copied that should be symlinked

| Installed Location | Source in Project |
|---|---|
| `~/.claude/commands/gsd/` | `commands/gsd/` |
| `~/.claude/agents/` | `agents/` |
| `~/.claude/get-stuff-done/` | `get-stuff-done/` |
| `~/.claude/hooks/gsd-statusline.js` | `hooks/gsd-statusline.js` |
| `~/.claude/hooks/gsd-check-update.js` | `hooks/gsd-check-update.js` |

### Changes required

- **`bin/install.js`**: Replace `fs.copyFileSync` / recursive copy logic with symlink creation (`fs.symlinkSync` or junction on Windows)
- Handle Windows vs Unix: use junctions for directories on Windows, symlinks on Unix
- Add `--force` flag to replace existing copies with symlinks
- Add detection: if destination exists and is already a symlink pointing to the right place, skip

---

## 2. URL and Branding Strategy

**Status:** Not started
**Priority:** Medium

### URL Strategy (CONFIRMED)

| URL Type | Points To | Rationale |
|---|---|---|
| Upstream sync check | `github.com/glittercowboy/get-shit-done` | Check for new features to adopt |
| Everything else | User's private GitHub repo (TBD) | Fork's own identity |

**Key principle**: Only the once-per-session upstream check should reference the original repo. All other URLs (package.json, README, install messages, etc.) should point to the private fork.

### Branding map

| Old Value | New Value |
|---|---|
| `glittercowboy` | (private GitHub username -- TBD) |
| `get-shit-done` | `get-stuff-done` |
| `TACHES` / `TACHES` | `Chude` or `AI Dev Environment` |
| `github.com/glittercowboy/get-shit-done` | (private repo URL -- TBD) |

### Files requiring changes (by priority)

**High priority (user-facing):**
- `package.json` -- repository, homepage, bugs URLs, author, description
- `README.md` -- fork note, clone URL, star history, footer
- `bin/install.js` -- line 101, TACHES attribution in install message
- `commands/gsd/update.md` -- point to private repo changelog

**Medium priority (documentation):**
- `CONTRIBUTING.md` -- release URL (line 174), clone URL (line 305), credit (line 331)
- `docs/GSD-METHODOLOGY.md` -- lines 3, 5, 126
- `docs/CHANGELOG.md` -- version tag links (lines 468-473)
- `docs/SESSION-LOG-2026-01-20.md` -- lines 16, 24, 36
- `docs/HYBRID-APPROACH.md` -- line 514

**Keep original URL (upstream sync only):**
- `hooks/gsd-check-update.js` -- the upstream check logic (new `/gsd:upstream` command)

**Low priority (reference/research):**
- `CHANGELOG.md` -- ~145 version comparison URLs at bottom of file
- `research/01-gsd-deep-dive.md` -- multiple attribution references

### Decision: `.upstream/` directory

Keep `.upstream/` untouched as a reference copy of the original for diffing/comparison.

---

## 3. Statusline Redesign

**Status:** Ready to implement
**Priority:** High

### New Format (CONFIRMED)

**Line 1 (always shown):**
```
⧉ [GSD] │ [Opus 4.5] │ get-stuff-done │ ██████░░░░ 50%
```

**Line 2 (only when upstream updates available):**
```
📦 updates available │ /gsd:upstream
```

### Element Colors (CONFIRMED)

| Element | Color |
|---------|-------|
| `⧉ [GSD]` | CYAN (#5FD7D7) always |
| Separators `│` | WHITE |
| `[Model]` | DIM |
| `CWD` | DIM |
| `📦 updates available │ /gsd:upstream` | YELLOW (when shown) |
| Stage icon | Matches bar color |
| Progress bar filled | Stage color |
| Progress bar empty `░` | DIM |
| Percentage | Stage color |

### Progress Bar Stages (CONFIRMED)

Thresholds are **relative to autocompact_threshold**. If autocompact = 80%:

| Stage | Range | Calculation | Icon |
|---|---|---|---|
| Green | 0-40% | < threshold × 0.5 | None (clean = good) |
| Yellow | 40-60% | < threshold × 0.75 | ⚠ (yellow-colored) |
| Orange | 60-70% | < threshold × 0.875 | ⚡ (orange-colored) |
| Red | 70-80% | >= threshold × 0.875 | ⚡ (red-colored, BLINKS) |

**Design decisions:**
- Icons only from yellow onwards (no icon when healthy)
- Icons match progress bar color (not white)
- Red stage (icon + bar + percentage) all BLINK
- Separators are WHITE for visibility

### Update Notification (CONFIRMED)

- Notification refers to **UPSTREAM** changes (glittercowboy repo), not fork releases
- Shows on **second line** only when upstream has new commits
- After `/gsd:upstream` completes, prompt user to run `/gsd:update` to release integrated changes

### Dynamic Thresholds

The statusline reads `~/.gsd/config.json` to get `autocompact_threshold`, then calculates warning levels as fractions:
- Green max: threshold × 0.5
- Yellow max: threshold × 0.75
- Orange max: threshold × 0.875
- Red: anything above orange max

### Files to modify

- `hooks/gsd-statusline.js` -- Complete rewrite with new format
- `hooks/gsd-check-update.js` -- Check upstream repo, not fork

---

## 4. Update Commands (Split Design)

**Status:** Ready to implement
**Priority:** Medium

### Command Split (CONFIRMED)

Two separate commands that reference each other in output:

| Command | Purpose |
|---|---|
| `/gsd:update` | Update YOUR fork only (check private repo releases) |
| `/gsd:upstream` | Check/review/adopt changes from original GSD |

### `/gsd:update` Workflow

```
Check private repo version
        │
        ▼
┌─────────────────────────────────────────┐
│ Your fork: v2.0.1 installed             │
│            v2.0.3 available             │
│                                         │
│ Changes in v2.0.2:                      │
│ • fix: context detection bug            │
│                                         │
│ Changes in v2.0.3:                      │
│ • feat: new checkpoint format           │
└─────────────────────────────────────────┘
        │
        ▼
  [Update] [Skip]
        │
        ▼
───────────────────────────────────────────
Also available:
- /gsd:upstream — Check for new features from original GSD
───────────────────────────────────────────
```

### `/gsd:upstream` Workflow

```
Check glittercowboy/get-shit-done for new commits
        │
        ▼
┌─────────────────────────────────────────┐
│ Upstream: 4 new commits since last sync │
│           (2026-01-15)                  │
│                                         │
│ Commits:                                │
│ • abc1234: feat: add /gsd:quick command │
│ • def5678: fix: context file detection  │
│ • ghi9012: refactor: checkpoint auto    │
│ • jkl3456: docs: update methodology     │
│                                         │
│ [View details for any commit]           │
└─────────────────────────────────────────┘
        │
        ▼
  For each change:
  [Adopt as-is] [Adapt] [Skip] [View diff]
        │
        ▼
  Apply selected changes, preserving adaptations
        │
        ▼
───────────────────────────────────────────
Also available:
- /gsd:update — Update your fork installation
- /gsd:progress — Check overall milestone progress
───────────────────────────────────────────
```

### Design Decisions (CONFIRMED)

- **Granularity**: Commit-level summary, drill into files on demand
- **Tracking**: Store last sync date/commit SHA in `.claude/cache/gsd-upstream-sync.json`
- **Conflict handling**: Flag files you've modified for manual review
- **Preservation**: Never auto-overwrite customizations without confirmation

### Files to modify/create

- `commands/gsd/update.md` -- Rewrite for fork-only updates
- `commands/gsd/upstream.md` -- New command for upstream sync
- `hooks/gsd-check-update.js` -- May need split logic or new hook

---

## 5. Terminal Shortcut and Autocompact

**Status:** Investigation complete, ready to implement
**Priority:** High (blocks statusline dynamic thresholds)

### Investigation Results

#### The `gsd` Launcher Script

**Location:** `bin/gsd` (bash script)

**How it works:**
1. Reads config from `~/.gsd/config.json` (user-level) or `.gsd/config.json` (project-level)
2. Extracts `context_management.autocompact_threshold` (default: 50)
3. Displays in banner: "Context auto-compact: 50%"
4. Sets environment variable: `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=$threshold`
5. Launches Claude Code with `exec claude "$@"`

#### Configuration Files

| File | Purpose |
|---|---|
| `~/.gsd/config.json` | User-level config (created on first run) |
| `.gsd/config.json` | Project-level config (takes priority) |
| `config/default-config.json` | Defaults template |
| `config/gsd-config.schema.json` | Validation schema (20-90% range) |

#### Current Config Structure

```json
{
  "context_management": {
    "autocompact_threshold": 50,
    "precompact_save_state": true
  },
  "ui": {
    "show_progress_bar": true,
    "show_context_usage": true,
    "theme": "aidev"
  }
}
```

### Changes Needed

#### A. Support Token-Based Thresholds

User wants: Autocompact at 100,000 tokens (not percentage)

**Option 1: Add token-based config field**
```json
{
  "context_management": {
    "autocompact_threshold": 50,
    "autocompact_token_limit": 100000,
    "threshold_mode": "tokens"
  }
}
```

**Option 2: Interpret large numbers as tokens**
- Values 1-100 = percentage
- Values > 100 = token count

Claude Code's `--autocompact` flag accepts both formats.

#### B. Statusline Dynamic Thresholds

The statusline hook needs to read the same config to adjust warning levels:

**Current (hardcoded in `gsd-statusline.js`):**
```javascript
if (used < 50) { /* green */ }
else if (used < 65) { /* yellow */ }
else if (used < 80) { /* orange */ }
else { /* red */ }
```

**Proposed (dynamic):**
```javascript
const config = readGsdConfig();
const threshold = config.context_management.autocompact_threshold;

// Calculate warning levels relative to threshold
const greenMax = threshold * 0.6;
const yellowMax = threshold * 0.8;
const orangeMax = threshold * 0.95;
// Red = anything above orangeMax
```

This way, if autocompact is set to 80%, warnings adjust proportionally.

#### C. Files to Modify

| File | Change |
|---|---|
| `bin/gsd` | Support token-based threshold, pass correct flag to claude |
| `config/gsd-config.schema.json` | Add `autocompact_token_limit` and `threshold_mode` |
| `config/default-config.json` | Add new fields with defaults |
| `hooks/gsd-statusline.js` | Read config, calculate dynamic thresholds |
| `bin/install.js` | Update default config template |

---

## 6. Logo/Assets

**Status:** Deferred
**Priority:** Low

Logo SVGs were attempted but didn't meet expectations. Current state:
- `assets/gsd-logo-style-a.svg` and `gsd-logo-style-b.svg` exist as attempts
- Extra files moved to `assets/.backup/`
- `assets/terminal.svg` was updated with aidev branding
- Original logo files backed up as `.bak`

### When revisiting

- Icon: Isometric 3D rendering of ⧉ (interlocking squares)
- Layout: Icon LEFT, [GSD] top-right, Get Stuff Done below (FYNORA-style)
- Colors: Cyan #5FD7D7, Green #87D787
- Font: Retro boxy/square monospace
- Dots between words use bullet character (Get•Stuff•Done)

---

## Change Log

| Date | What | By |
|---|---|---|
| 2026-01-28 | Created this tracking document | Session |
| 2026-01-28 | Added confirmed statusline design, URL strategy, command split | Session |
