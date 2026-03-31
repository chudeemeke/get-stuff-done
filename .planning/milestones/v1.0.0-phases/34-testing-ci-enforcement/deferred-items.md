# Deferred Items -- Phase 34

## Pre-existing Bugs

### preview-update.js: severityOrder sort uses `|| 99` instead of `?? 99`

**File:** scripts/preview-update.js, line ~302
**Issue:** The sort comparator `(severityOrder[a.severity] || 99)` treats severity value `0` (for "elevated") as falsy, mapping it to `99`. This means "elevated" severity findings sort LAST instead of FIRST.
**Fix:** Change `|| 99` to `?? 99` (nullish coalescing) on line ~302.
**Impact:** Low -- the report still shows all findings, just in slightly wrong order.
**Discovered during:** Phase 34 Plan 03 Task 2
