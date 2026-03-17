---
plan: 02-04-PLAN.md
status: complete
type: gap_closure
completed: 2026-02-03T20:00:00Z
---

## Objective

Implement SSOT architecture for autocompact threshold and fix blink detection for Windows Terminal.

## Changes Made

### 1. bin/gsd - SSOT Threshold Handling

**Before:** Always set `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` from config with hardcoded fallback (50).

**After:** Only set env var if `~/.gsd/THRESHOLD` file exists. If missing, Claude Code uses its internal default.

```bash
# New logic (lines 120-140)
if [[ -f "$THRESHOLD_FILE" ]]; then
  export CLAUDE_AUTOCOMPACT_PCT_OVERRIDE="$threshold"
fi
# No THRESHOLD = no env var = Claude Code default
```

Also removed hardcoded `autocompact_threshold: 50` from ensure_config() default JSON.

### 2. hooks/gsd-statusline.js - Threshold from Env Var

**Before:** Read threshold from config file via ConfigLoader with hardcoded default (75).

**After:** Read from `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` env var (set by bin/gsd launcher).

```javascript
function getThreshold() {
  const envValue = process.env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE;
  if (envValue) {
    const value = parseInt(envValue, 10);
    if (!isNaN(value) && value > 0 && value <= 100) return value;
  }
  return 80; // Display fallback when env var not set
}
```

### 3. hooks/gsd-statusline.js - Blink Detection Fix

**Before:** Checked `xterm` FIRST, which returned true for Git Bash in Windows Terminal.

**After:** Check `WT_SESSION` FIRST, returning false before xterm check.

```javascript
function supportsBlinking() {
  // Windows Terminal check FIRST (Git Bash sets TERM=xterm-256color but WT doesn't blink)
  if (process.env.WT_SESSION) return false;

  if (termProgram === 'vscode') return false;
  if (termProgram === 'gnome-terminal') return false;
  if (term.includes('xterm') || termProgram === 'iTerm.app') return true;
  return true;
}
```

### 4. Removed Hardcoded Thresholds

Removed `autocompact_threshold` from:
- `src/config/ConfigLoader.js` getDefaults() (line 29)
- `src/config/ConfigLoader.js` createDefaultConfig() (line 71)
- `config/default-config.json` (line 3)

## Architecture Result

```
~/.gsd/THRESHOLD exists?
  ├─ YES → bin/gsd reads value, exports CLAUDE_AUTOCOMPACT_PCT_OVERRIDE
  │        → statusline reads env var for progress bar calculation
  └─ NO  → bin/gsd does NOT set env var
           → Claude Code uses its internal default
           → statusline uses 80 as display assumption
```

True SSOT: ONE source (THRESHOLD file), no fallback chains, no scattered defaults.

## Files Modified

| File | Change |
|------|--------|
| `bin/gsd` | SSOT threshold logic, removed hardcoded default |
| `hooks/gsd-statusline.js` | Env var reading, WT_SESSION blink fix |
| `src/config/ConfigLoader.js` | Removed autocompact_threshold from defaults |
| `config/default-config.json` | Removed autocompact_threshold |

## Verification

```bash
# bin/gsd conditional logic
grep -A10 "THRESHOLD_FILE" bin/gsd
# Shows: conditional export only if file exists

# statusline env var reading
grep "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE" hooks/gsd-statusline.js
# Shows: process.env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE

# blink detection order
grep -n "WT_SESSION" hooks/gsd-statusline.js
# Shows: WT_SESSION check at line 59 (before xterm)

# no hardcoded thresholds
grep -r "autocompact_threshold.*[0-9]" src/ config/
# Shows: no matches (only comments remain)
```

## User Action Required

**Reinstall GSD** to apply these changes to the installed hook:

```bash
cd C:\Projects\get-stuff-done
bun run install
```

After reinstall:
- Without `~/.gsd/THRESHOLD`: Claude Code uses internal default, progress bar assumes 80%
- With `~/.gsd/THRESHOLD` containing "90": progress bar uses 90% threshold
- In Windows Terminal: red stage will NOT attempt blink (shows bright instead)
