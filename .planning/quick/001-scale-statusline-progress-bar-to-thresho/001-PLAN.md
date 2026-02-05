---
id: quick-001
type: execute
wave: 1
depends_on: []
files_modified:
  - hooks/gsd-statusline.js
  - config/default-config.json
autonomous: true

must_haves:
  truths:
    - "Progress bar shows ~99-100% when autocompact is imminent"
    - "Progress bar shows 0% on fresh context"
    - "Threshold is configurable via context_management.autocompact_threshold"
    - "Color stage thresholds work correctly with scaled values"
  artifacts:
    - path: "hooks/gsd-statusline.js"
      provides: "Scaled proximity calculation"
      contains: "maxUsage = 100 - threshold"
    - path: "config/default-config.json"
      provides: "Default threshold config"
      contains: "autocompact_threshold"
  key_links:
    - from: "hooks/gsd-statusline.js"
      to: "config/default-config.json"
      via: "ConfigLoader.getConfigValue"
      pattern: "context_management.*autocompact_threshold"
---

<objective>
Scale statusline progress bar to autocompact threshold so 100% = autocompact fires.

Purpose: The current bar shows raw context usage (0-83.5%), making 100% meaningless. When autocompact is 1% away, the bar should show ~99%, not 83%.

Output: Updated statusline with threshold-scaled progress bar and configurable threshold.
</objective>

<execution_context>
@C:\Users\Destiny\.claude/get-stuff-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/quick/statusline-threshold-scaling-CONTEXT.md
@hooks/gsd-statusline.js
@config/default-config.json
@src/config/ConfigLoader.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add threshold config and apply scaling calculation</name>
  <files>config/default-config.json, hooks/gsd-statusline.js</files>
  <action>
1. In config/default-config.json, add to context_management section:
   ```json
   "autocompact_threshold": 16.5
   ```
   This is the % remaining when autocompact fires (matches Claude Code's current behavior).

2. In hooks/gsd-statusline.js:
   a. Load threshold from config (after the existing gsdRole loading block):
      ```javascript
      let autocompactThreshold = 16.5;  // Default: % remaining when autocompact fires
      try {
        const { loadConfig, getConfigValue } = require('../src/config/ConfigLoader');
        const config = loadConfig();
        autocompactThreshold = getConfigValue(config, 'context_management.autocompact_threshold', 16.5);
      } catch (e) {
        // Silent fail - use default
      }
      ```
      Note: Can combine with existing config loading block since both use same pattern.

   b. Update the proximity calculation (around line 84) from:
      ```javascript
      const proximity = Math.max(0, Math.min(100, 100 - Math.round(remaining)));
      ```
      To:
      ```javascript
      // Scale raw usage to threshold: 0% raw = 0% bar, threshold = 100% bar
      const maxUsage = 100 - autocompactThreshold;  // e.g., 83.5% when threshold=16.5
      const rawUsage = 100 - remaining;
      const proximity = Math.max(0, Math.min(100, Math.round((rawUsage / maxUsage) * 100)));
      ```

   c. Update the file header comment (lines 5-10) to correct the explanation:
      ```javascript
      // IMPORTANT: Claude Code's remaining_percentage is RAW remaining space, NOT threshold-relative.
      // Autocompact triggers when remaining hits ~16.5% (configurable).
      // We scale the bar so 0% = fresh context, 100% = autocompact fires.
      //
      // Formula: proximity = (rawUsage / maxUsage) * 100
      // Where: rawUsage = 100 - remaining, maxUsage = 100 - threshold
      ```
  </action>
  <verify>
1. Check config has new field: `grep autocompact_threshold config/default-config.json`
2. Check statusline loads threshold: `grep -A2 autocompactThreshold hooks/gsd-statusline.js`
3. Check scaling formula: `grep "maxUsage" hooks/gsd-statusline.js`
4. Manual test: Run `/status` and verify bar shows scaled percentage
  </verify>
  <done>
- config/default-config.json has autocompact_threshold: 16.5
- hooks/gsd-statusline.js loads threshold from config with 16.5 default
- Proximity calculation uses scaling formula: (rawUsage / maxUsage) * 100
- File header comment accurately describes the calculation
  </done>
</task>

</tasks>

<verification>
1. Fresh context (remaining=100%): proximity should be 0%
2. Half used (remaining=50%): rawUsage=50%, proximity=(50/83.5)*100 = ~60%
3. Near autocompact (remaining=17%): rawUsage=83%, proximity=(83/83.5)*100 = ~99%
4. At autocompact (remaining=16.5%): rawUsage=83.5%, proximity=100%
5. Color stages still work (green < 50%, amber 50-75%, red 75-87.5%, critical 87.5%+)
</verification>

<success_criteria>
- [ ] Progress bar shows 0% on fresh context
- [ ] Progress bar shows ~99-100% when autocompact imminent
- [ ] Threshold configurable via context_management.autocompact_threshold
- [ ] Default threshold is 16.5%
- [ ] Color stages still function correctly
</success_criteria>

<output>
No summary needed for quick tasks.
</output>
