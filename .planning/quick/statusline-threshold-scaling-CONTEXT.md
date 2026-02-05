# Statusline Progress Bar Threshold Scaling

## Problem Statement

The progress bar shows raw context usage (0-100%), but autocompact triggers at ~83.5% usage (when 16.5% remains). This makes the bar's 100% mark meaningless - it implies headroom that doesn't exist.

**User observation:**
- Progress bar at 83% → Claude showed "1% till autocompact"
- Progress bar at 75% → Claude showed "10% till autocompact"
- Autocompact fired when bar showed ~83% (matching the 16.5% buffer from /context)

## Desired Behavior

Scale the progress bar so that:
- 0% bar = 0% context usage (fresh)
- 100% bar = autocompact triggers

When autocompact is imminent (1% buffer left), the bar should show ~99%, not 83%.

## Technical Details

**Current calculation (wrong):**
```javascript
const proximity = 100 - remaining_percentage;  // Raw usage, maxes at 83.5%
```

**Correct calculation:**
```javascript
const threshold = 16.5;  // % remaining when autocompact fires (configurable)
const maxUsage = 100 - threshold;  // = 83.5% (the trigger point)
const rawUsage = 100 - remaining_percentage;
const proximity = Math.min(100, (rawUsage / maxUsage) * 100);  // Scaled 0-100%
```

**Example mappings with 16.5% threshold:**
| remaining_percentage | rawUsage | proximity (scaled) |
|---------------------|----------|-------------------|
| 100% | 0% | 0% |
| 50% | 50% | 59.9% |
| 20% | 80% | 95.8% |
| 17% | 83% | 99.4% |
| 16.5% | 83.5% | 100% |

## Configuration

Add configurable threshold to GSD config:

```json
{
  "context_management": {
    "autocompact_threshold": 16.5
  }
}
```

Default: 16.5 (matches Claude Code's current behavior per /context output)

## Files to Modify

1. `hooks/gsd-statusline.js` - Apply scaling calculation
2. `get-stuff-done/templates/default-config.json` - Add default threshold (if exists)
3. Update comments to clarify the calculation

## Historical Context

- GSD previously HAD a configurable threshold (removed in commit 280df42)
- It was removed based on incorrect belief that `remaining_percentage` was threshold-relative
- Research confirmed `remaining_percentage` is RAW remaining, not threshold-relative
- This fix brings back threshold concept, but applies it to bar scaling (not just color stages)

## Success Criteria

- [ ] Progress bar shows ~99-100% when autocompact is imminent
- [ ] Progress bar shows 0% on fresh context
- [ ] Threshold is configurable (default 16.5%)
- [ ] Color stage thresholds still work correctly with scaled values
- [ ] Existing tests pass (if any)
