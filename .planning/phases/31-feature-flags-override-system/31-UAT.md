---
status: complete
phase: 31-feature-flags-override-system
source: [31-01-SUMMARY.md, 31-02-SUMMARY.md, 31-03-SUMMARY.md]
started: 2026-03-29T15:10:00Z
updated: 2026-03-29T15:35:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Feature exclusion via features.json
expected: Add "help" to workflows.exclude in overlay/features.json, run `bun run compose`. dist/get-shit-done/workflows/help.md should NOT exist. All other workflow files should still be present.
result: pass

### 2. features_disabled in .install-meta.json
expected: After compose with "help" excluded, .install-meta.json features_disabled array should include "workflows/help".
result: pass

### 3. Invalid features.json rejected
expected: Add an invalid field ("bogus": true) to overlay/features.json. Composition should fail with AJV validation error mentioning "additionalProperties".
result: pass

### 4. Override replaces upstream file
expected: Create overrides/bin/install.js with REASON.md companion. After compose, dist/bin/install.js should contain override content.
result: pass

### 5. Missing REASON.md blocks composition
expected: Override without REASON.md companion should cause compose to fail with error showing expected path and paste-ready template.
result: pass

### 6. overrides_applied in .install-meta.json
expected: After compose with override, .install-meta.json overrides_applied array should include "bin/install.js".
result: pass

### 7. check-overrides.js with zero overrides
expected: Run node scripts/check-overrides.js with only .gitkeep in overrides/. Should exit 0 with "0 overrides checked".
result: pass

### 8. Compose dry-run with exclusions
expected: Dry-run with "help" excluded should show reduced file count and not mention excluded file.
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
