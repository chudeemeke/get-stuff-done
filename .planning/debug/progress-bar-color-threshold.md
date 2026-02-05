---
status: diagnosed
trigger: "Progress bar is at 28% but showing yellow instead of green"
created: 2026-02-02T00:00:00Z
updated: 2026-02-02T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Default autocompact_threshold is 50, making greenMax=25, causing yellow at 28%
test: Traced threshold calculation from defaults through color logic
expecting: N/A - root cause confirmed
next_action: Return diagnosis

## Symptoms

expected: Progress bar displays green when context usage is below 50% of autocompact threshold
actual: Progress bar shows yellow at 28% (should be green)
errors: None reported (visual display issue)
reproduction: Display statusline at 28% context usage
started: Phase 02 statusline redesign

## Eliminated

## Evidence

- timestamp: 2026-02-02T00:01:00Z
  checked: hooks/gsd-statusline.js lines 10, 66-72, 106-118
  found: |
    - Default autocompactThreshold hardcoded to 50 (line 10)
    - greenMax = autocompactThreshold * 0.5 (line 70)
    - Color logic: green if used < greenMax (line 106)
    - With threshold=50: greenMax=25, so 28% shows yellow
  implication: Threshold calculation is mathematically correct but defaults are misaligned with expectations

- timestamp: 2026-02-02T00:02:00Z
  checked: src/config/ConfigLoader.js lines 29, 71
  found: |
    - getDefaults() returns autocompact_threshold: 50 (line 29)
    - createDefaultConfig() writes autocompact_threshold: 50 (line 71)
  implication: All code paths use 50% as default

- timestamp: 2026-02-02T00:03:00Z
  checked: config/default-config.json line 4
  found: |
    - File contains autocompact_threshold: 75
    - This file is NOT loaded by ConfigLoader - it's reference only
  implication: Documentation/reference file has different value than actual defaults

## Resolution

root_cause: |
  Hardcoded default autocompact_threshold is 50%, making greenMax=25%.
  At 28% usage, 28 < 25 is FALSE, so color falls through to yellow.

  The user expects green below ~37.5% (50% of a 75% threshold per default-config.json),
  but actual defaults use 50%, so green only shows below 25%.

  Three locations have the 50% default:
  1. hooks/gsd-statusline.js line 10
  2. src/config/ConfigLoader.js getDefaults() line 29
  3. src/config/ConfigLoader.js createDefaultConfig() line 71

  Meanwhile config/default-config.json has 75% but is never loaded.

fix:
verification:
files_changed: []
