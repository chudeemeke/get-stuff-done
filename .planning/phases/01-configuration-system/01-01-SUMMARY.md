---
phase: 01-configuration-system
plan: 01
subsystem: configuration
tags: [config, validation, node.js, json5, nested-structure]
requires: []
provides: [config-loader, config-schema, nested-config-support]
affects: [bin/gsd, hooks/gsd-statusline.js]
tech-stack:
  added: [ajv, json5]
  patterns: [nested-configuration, dot-path-access, migration]
key-files:
  created:
    - src/config/ConfigSchema.js
    - src/config/ConfigLoader.js
  modified:
    - config/gsd-config.schema.json
    - bin/gsd
    - hooks/gsd-statusline.js
decisions:
  - id: nested-config-structure
    choice: Use nested object structure (context_management, workflow, subagents, ui)
    rationale: Matches user's existing config, better organization than flat structure
  - id: percentage-threshold
    choice: Use percentage (10-90) instead of token count for autocompact_threshold
    rationale: Simpler for users, works across different model context sizes
  - id: dynamic-statusline-thresholds
    choice: Calculate color thresholds as fractions of autocompact value (0.5, 0.75, 0.875)
    rationale: Statusline adapts to user's configured threshold preference
metrics:
  duration: 16 minutes
  completed: 2026-01-30
---

# Phase 01 Plan 01: Configuration System Summary

**One-liner:** Node.js config system with nested JSON5 structure, validation via ajv, and dynamic statusline thresholds

## What Was Built

Fixed Node.js config modules to match user's existing nested config format.

**Context:** The user's `~/.gsd/config.json` already used nested structure (`context_management.autocompact_threshold`). The Node.js code was incorrectly created with a flat schema (`working_context` at root). This plan fixed the code to match the config.

**Key changes:**
1. ConfigSchema.js now validates nested structure with four sections: context_management, workflow, subagents, ui
2. ConfigLoader.js returns nested defaults and provides `getConfigValue()` for dot-path access
3. bin/gsd replaced jq dependency with Node.js ConfigLoader calls
4. Statusline calculates dynamic color thresholds based on configured autocompact value
5. Legacy config migration adds `version: 1` field automatically

## Technical Implementation

### Config Schema (src/config/ConfigSchema.js)
- Nested JSON Schema with four top-level sections
- AJV validation with `additionalProperties: false` at each level
- Clear error messages for unknown keys, type mismatches, range violations
- Percentage-based threshold (10-90) instead of token count

### Config Loader (src/config/ConfigLoader.js)
- JSON5 parser for comments and trailing commas in config files
- `getDefaults()` returns full nested structure with sensible defaults
- `getConfigValue(config, 'context_management.autocompact_threshold', 50)` for deep path access
- Validation on load with user-friendly error messages

### Launcher Integration (bin/gsd)
- `GSD_INSTALL_DIR` detection via `readlink -f` (works with symlinks)
- `read_config()` function uses Node.js instead of jq
- Legacy config migration: detects missing `version` field and adds it
- Config key paths changed from jq syntax (`.key`) to dot-separated (`key.subkey`)

### Statusline Dynamics (hooks/gsd-statusline.js)
- Loads config at startup to read `autocompact_threshold`
- Calculates thresholds: greenMax (50%), yellowMax (75%), orangeMax (87.5%)
- With default threshold 50: green<25%, yellow<37.5%, orange<43.75%, red≥43.75%
- Removed skull emoji from red state (blinking text only)

## Files Changed

### Created
- `src/config/ConfigSchema.js` - AJV-based nested schema validation
- `src/config/ConfigLoader.js` - JSON5 config loading with dot-path helper

### Modified
- `config/gsd-config.schema.json` - IDE validation schema matching nested structure
- `bin/gsd` - GSD_INSTALL_DIR detection, Node.js config reading, version migration
- `hooks/gsd-statusline.js` - Dynamic threshold calculation from config

## Decisions Made

### Nested Config Structure
**Choice:** Use nested objects (context_management, workflow, subagents, ui) instead of flat structure

**Rationale:**
- Matches user's existing config format
- Better organization as config grows
- Allows per-section `additionalProperties: false` validation

**Alternatives considered:**
- Flat structure with prefixed keys (e.g., `context_autocompact_threshold`)
- Rejected: Less readable, harder to validate unknown keys per section

### Percentage-Based Threshold
**Choice:** `autocompact_threshold` as percentage (10-90) instead of token count

**Rationale:**
- Simpler for users (50% is intuitive)
- Works across different model context sizes
- Easier to calculate statusline thresholds as fractions

**Implementation:** Value stored in config, converted to token count by Claude Code via `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` env var

### Dynamic Statusline Thresholds
**Choice:** Calculate color transitions as fractions of configured autocompact threshold

**Rationale:**
- If user sets threshold to 70%, statusline should warn earlier
- Thresholds: green (50% of threshold), yellow (75%), orange (87.5%)
- Example: threshold 60 → green<30%, yellow<45%, orange<52.5%

**Trade-off:** Requires config loading on every statusline render (acceptable - statusline runs once per prompt)

## Deviations from Plan

None - plan executed exactly as written. All six tasks completed successfully without architectural changes or unexpected blockers.

## Verification Results

All verification criteria passed:

1. **Nested config validates:** `{version: 1, context_management: {autocompact_threshold: 50}}` validates successfully
2. **Unknown keys rejected:** `{version: 1, bad_key: true}` throws clear error message
3. **bin/gsd reads config:** No jq errors, shows configured threshold in banner
4. **Statusline uses dynamic thresholds:** 30% used shows YELLOW with default threshold 50 (greenMax=25%)
5. **Version migration works:** Legacy configs get `version: 1` added automatically

## Testing Evidence

### Schema Validation
```bash
# Valid nested config
node -e "validateConfig({version: 1, context_management: {autocompact_threshold: 50}})"
# Output: (success, no error)

# Invalid config with unknown key
node -e "validateConfig({version: 1, bad_key: true})"
# Output: Config validation failed: Unknown config key: "bad_key"
```

### Statusline Thresholds
```bash
# 70% remaining = 30% used (greenMax=25%, yellowMax=37.5%)
echo '{"context_window":{"remaining_percentage":70},"model":{"display_name":"Sonnet"}}' | node hooks/gsd-statusline.js
# Output: [33m███░░░░░░░ 30%[0m  (YELLOW - correct)

# 85% remaining = 15% used (< greenMax)
echo '{"context_window":{"remaining_percentage":85},"model":{"display_name":"Sonnet"}}' | node hooks/gsd-statusline.js
# Output: [32m█░░░░░░░░░ 15%[0m  (GREEN - correct)

# 55% remaining = 45% used (>= orangeMax 43.75%)
echo '{"context_window":{"remaining_percentage":55},"model":{"display_name":"Sonnet"}}' | node hooks/gsd-statusline.js
# Output: [5;31m████░░░░░░ 45%[0m  (RED blinking - correct)
```

### Version Migration
```bash
# Config without version field
echo '{"context_management":{"autocompact_threshold":65}}' > test-config.json

# After migration
cat test-config.json
# Contains: "version": 1
```

## Next Phase Readiness

**Phase 02 (Workflow Automation) is ready to begin.**

This plan delivered:
- Working config system with validation
- Nested structure matching user's existing format
- No jq dependency (pure Node.js)
- Dynamic statusline thresholds
- Legacy config migration

**Dependencies satisfied for Phase 02:**
- Config loader available for workflow settings (pause_between_tasks, etc.)
- Percentage-based threshold working with Claude Code
- Schema validation prevents invalid workflow configs

**No blockers or concerns.**

## Commits

- `0c738c7` refactor(01-01): fix ConfigSchema for nested config format
- `08b83d6` refactor(01-01): update ConfigLoader for nested defaults
- `2ce71d2` feat(01-01): add GSD_INSTALL_DIR detection to bin/gsd
- `89f4eb3` refactor(01-01): replace jq with Node.js ConfigLoader in bin/gsd
- `dfec75e` feat(01-01): add version field migration to ensure_config()
- `9f59a2a` feat(01-01): add dynamic thresholds to statusline

**Total:** 6 commits (1 per task)
**Duration:** 16 minutes

## Lessons Learned

### What Went Well
- Plan was clear and actionable with exact code examples
- Nested structure validation worked first try with AJV
- getConfigValue() dot-path helper simplified config access
- Dynamic threshold calculation was straightforward

### What Could Be Improved
- Could have added tests for ConfigLoader and ConfigSchema
- Version migration could be more robust (backup before modifying)

### For Future Plans
- Include test coverage in execution plans for core modules
- Consider config backup mechanism for migrations
