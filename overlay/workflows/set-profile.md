<purpose>
Switch the model profile used by GSD agents. Controls which Claude model each agent uses, balancing quality vs token spend.
</purpose>

<process>

<step name="validate_argument">
Parse $ARGUMENTS for profile name.

**If no argument:**

Use AskUserQuestion:
- header: "Profile"
- question: "Which model profile?"
- multiSelect: false
- options:
  - label: "quality"
    description: "Opus planning + Opus execution. Best results, highest cost."
  - label: "balanced (Recommended)"
    description: "Opus planning + Sonnet execution. Good balance."
  - label: "budget"
    description: "Sonnet planning + Sonnet execution. Lowest cost."

**If argument provided:**
Validate against allowed values: quality, balanced, budget.

**If invalid:**
```
Error: Invalid profile "[value]"

Valid profiles: quality, balanced, budget
```
Exit workflow.
</step>

<step name="ensure_config">
Ensure config file exists:

```bash
mkdir -p .planning
if [ ! -f .planning/config.json ]; then
  echo '{}' > .planning/config.json
fi
```
</step>

<step name="update_config">
Read current config, update model_profile field, write back:

```bash
CONFIG=$(cat .planning/config.json)
```

Update the `model_profile` key to the selected profile value. Write updated JSON back to `.planning/config.json`.

Preserve all existing config keys.
</step>

<step name="confirm">
Display confirmation with model table:

```
Profile set to: [PROFILE]

| Agent | Model |
|-------|-------|
| gsd-planner | [model] |
| gsd-plan-checker | [model] |
| gsd-executor | [model] |
| gsd-verifier | [model] |
| gsd-phase-researcher | [model] |

Model lookup:
| Agent | quality | balanced | budget |
|-------|---------|----------|--------|
| gsd-planner | opus | opus | sonnet |
| gsd-plan-checker | sonnet | sonnet | haiku |
| gsd-phase-researcher | opus | sonnet | sonnet |
| gsd-executor | opus | sonnet | sonnet |
| gsd-verifier | sonnet | sonnet | haiku |
```
</step>

</process>

<success_criteria>
- [ ] Profile argument validated or prompted
- [ ] config.json created if missing
- [ ] model_profile updated in config.json
- [ ] Confirmation with model table displayed
</success_criteria>
