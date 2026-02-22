<purpose>
Interactive configuration of GSD workflow toggles and model profile. Presents current settings, allows modification via structured questions, writes updated config.
</purpose>

<process>

<step name="ensure_config">
Create config with defaults if missing:

```bash
mkdir -p .planning
```

Default config:
```json
{
  "model_profile": "balanced",
  "skip_research": false,
  "skip_plan_check": false,
  "skip_verification": false,
  "commit_docs": true,
  "branch_per_phase": false
}
```

If `.planning/config.json` exists, read it. If not, create with defaults.
</step>

<step name="read_current">
Read and parse current config values. Display:

```
Current GSD Settings:

| Setting | Value |
|---------|-------|
| Model Profile | [value] |
| Research | [enabled/disabled] |
| Plan Verification | [enabled/disabled] |
| Phase Verification | [enabled/disabled] |
| Commit Planning Docs | [yes/no] |
| Branch Per Phase | [yes/no] |
```
</step>

<step name="prompt_settings">
Use AskUserQuestion with up to 4 questions (batch into two rounds if needed):

**Round 1:**

Question 1:
- header: "Profile"
- question: "Model profile for GSD agents?"
- multiSelect: false
- options:
  - label: "quality"
    description: "Opus planning + Opus execution"
  - label: "balanced"
    description: "Opus planning + Sonnet execution"
  - label: "budget"
    description: "Sonnet planning + Sonnet execution"

Question 2:
- header: "Research"
- question: "Run domain research before planning?"
- multiSelect: false
- options:
  - label: "Enabled (Recommended)"
    description: "Research phase domain before creating plans"
  - label: "Disabled"
    description: "Skip research, go straight to planning"

Question 3:
- header: "Plan Check"
- question: "Verify plans with plan-checker agent?"
- multiSelect: false
- options:
  - label: "Enabled (Recommended)"
    description: "Verify plans meet phase goals before execution"
  - label: "Disabled"
    description: "Skip plan verification"

Question 4:
- header: "Verification"
- question: "Run phase verification after execution?"
- multiSelect: false
- options:
  - label: "Enabled (Recommended)"
    description: "Verify phase goal achieved after execution"
  - label: "Disabled"
    description: "Skip post-execution verification"

**Round 2 (if needed):**

Question 5:
- header: "Auto"
- question: "Auto-advance pipeline? (discuss → plan → execute automatically)"
- multiSelect: false
- options:
  - label: "No (Recommended)"
    description: "Manual /clear + paste between stages"
  - label: "Yes"
    description: "Chain stages via Task() subagents (same isolation)"

Question 6:
- header: "Branching"
- question: "Create git branch per phase?"
- multiSelect: false
- options:
  - label: "No (Recommended)"
    description: "All work on current branch"
  - label: "Yes"
    description: "Create branch for each phase execution"
</step>

<step name="write_config">
Merge user selections into config:

Map answers to config keys:
- "quality"/"balanced"/"budget" -> model_profile
- Research "Enabled" -> skip_research: false, "Disabled" -> skip_research: true
- Plan Check "Enabled" -> skip_plan_check: false, "Disabled" -> skip_plan_check: true
- Verification "Enabled" -> skip_verification: false, "Disabled" -> skip_verification: true
- Auto "Yes" -> workflow.auto_advance: true, "No" -> workflow.auto_advance: false
- Branching "Yes" -> branch_per_phase: true, "No" -> branch_per_phase: false

Write updated config.json preserving any extra keys not in this prompt.
</step>

<step name="confirm">
Display updated settings:

```
Settings updated.

| Setting | Value |
|---------|-------|
| Model Profile | [value] |
| Research | [enabled/disabled] |
| Plan Verification | [enabled/disabled] |
| Phase Verification | [enabled/disabled] |
| Commit Planning Docs | [yes/no] |
| Branch Per Phase | [yes/no] |

Quick commands:
  /gsd:set-profile [quality|balanced|budget]  -- change profile only
  /gsd:settings                                -- full settings menu
```
</step>

</process>

<success_criteria>
- [ ] Config created with defaults if missing
- [ ] Current settings displayed before prompting
- [ ] All settings prompted via AskUserQuestion
- [ ] Config file updated with selections
- [ ] Confirmation displayed with quick command references
</success_criteria>
