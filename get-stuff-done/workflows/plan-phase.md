<purpose>
Create executable phase prompts (PLAN.md files) for a roadmap phase. Default flow: Research (if needed) -> Plan -> Verify -> Done. Orchestrator parses arguments, validates phase, optionally researches domain, spawns gsd-planner, verifies with gsd-plan-checker, iterates until pass or max iterations.
</purpose>

<process>

<step name="resolve_model_profile" priority="first">
Read model profile for agent spawning:

```bash
MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
```

Default to "balanced" if not set.

**Model lookup table:**

| Agent | quality | balanced | budget |
|-------|---------|----------|--------|
| gsd-phase-researcher | opus | sonnet | sonnet |
| gsd-planner | opus | opus | sonnet |
| gsd-plan-checker | sonnet | sonnet | haiku |

Store resolved models for use in Task calls below.
</step>

<step name="parse_arguments">
Parse $ARGUMENTS for phase number and flags:

- Phase number (positional, optional -- auto-detect if omitted)
- `--research` -- Force re-research even if RESEARCH.md exists
- `--skip-research` -- Skip research entirely
- `--gaps` -- Gap closure mode (reads VERIFICATION.md gaps)
- `--skip-verify` -- Skip plan verification loop

**Normalize phase input:**
- "3" -> 3
- "03" -> 3
- "Phase 3" -> 3
- "3.1" -> 3.1 (decimal phases supported)
</step>

<step name="validate_phase">
**If phase number provided:**

```bash
PADDED=$(printf "%02d" ${PHASE_NUM} 2>/dev/null || echo "${PHASE_NUM}")
PHASE_DIR=$(ls -d .planning/phases/${PADDED}-* .planning/phases/${PHASE_NUM}-* 2>/dev/null | head -1)
```

If not found:
```
Error: Phase ${PHASE_NUM} not found.

Available phases:
[list from .planning/phases/]
```
Exit workflow.

**If no phase number:**
Auto-detect next unplanned phase:

```bash
# Find first phase directory with no PLAN.md files
for dir in .planning/phases/*/; do
  PLANS=$(ls "$dir"/*-PLAN.md 2>/dev/null | wc -l)
  if [ "$PLANS" -eq 0 ]; then
    echo "$dir"
    break
  fi
done
```

If all phases are planned:
```
All phases have plans. Nothing to plan.

Options:
- /gsd:add-phase <description>  -- Add a new phase
- /gsd:execute-phase [N]        -- Execute existing plans
```
Exit workflow.
</step>

<step name="load_context">
Read phase and project context:

```bash
cat .planning/ROADMAP.md
cat .planning/STATE.md
cat .planning/REQUIREMENTS.md 2>/dev/null
cat .planning/PROJECT.md 2>/dev/null
cat "$PHASE_DIR"/*-CONTEXT.md 2>/dev/null
cat .planning/config.json 2>/dev/null
```

Extract:
- Phase goal from ROADMAP.md
- Phase scope from CONTEXT.md (if exists, from /gsd:discuss-phase)
- Requirements relevant to this phase
- Project constraints and decisions
</step>

<step name="check_research">
**If --gaps flag:** Skip research entirely. Load VERIFICATION.md gaps instead:
```bash
cat "$PHASE_DIR"/*-VERIFICATION.md 2>/dev/null
cat "$PHASE_DIR"/*-UAT.md 2>/dev/null
```
Go to spawn_planner.

**If --skip-research flag:** Skip research. Go to spawn_planner.

**If --research flag:** Force research even if RESEARCH.md exists.

**Default:** Check if research exists:
```bash
ls "$PHASE_DIR"/*-RESEARCH.md 2>/dev/null
```

If RESEARCH.md exists: Skip research, go to spawn_planner.
If not: Continue to research step.

**Check config:**
```bash
SKIP_RESEARCH=$(cat .planning/config.json 2>/dev/null | grep -o '"skip_research"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "false")
```
If skip_research is true: Skip research.
</step>

<step name="run_research">
Display:
```
Researching Phase [N]: [Name]...
```

<teams_integration workflow="plan-phase">
**Config-driven team routing (check before spawning research and planning agents):**

```bash
TEAMS_ENABLED=$(python3 -c "import json; c=json.load(open('.planning/config.json')); print(str(c.get('teams',{}).get('enabled',False)).lower())" 2>/dev/null || echo "false")
```

**If `TEAMS_ENABLED=false` (default):** Continue to existing sequential research and planning below. No behavior change.

**If `TEAMS_ENABLED=true`:**

Check for the experimental env flag:
```bash
echo "${CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS:-missing}"
```

If flag is missing or not set to `1`: Warn and fall through to sequential mode:
```
Warning: teams.enabled=true but CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS is not set.
Falling back to sequential research and planning mode.
```

If flag is present (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`):

Check oversight setting for this workflow:
```bash
OVERSIGHT_ENABLED=$(python3 -c "import json; c=json.load(open('.planning/config.json')); print(str(c.get('teams',{}).get('oversight',{}).get('per_workflow',{}).get('plan-phase',True)).lower())" 2>/dev/null || echo "true")
```

Spawn the plan-phase-research-team using the template at `get-stuff-done/teams/plan-phase-team.md`:
- **Lead role:** plan-phase orchestrator (delegate mode)
- **Teammate 1:** `gsd-phase-researcher` (domain research)
- **Teammate 2:** `gsd-codebase-mapper` (codebase analysis)
- **Observer:** `gsd-oversight-planning` (research quality watcher, if `OVERSIGHT_ENABLED=true`)
- **Flag routing:** direct to planner (not high-stakes)
- **Task dependencies:** parallel research (Teammate 1 + Teammate 2) -> cross-reference -> quality review by oversight -> generate plans (planner spawned by lead after team completes)
- When team is active, the team lead handles BOTH research and planning. **Skip to `verify_plans` step** after team produces plan files. The `spawn_planner` step is also skipped — the team lead spawns the planner internally.
</teams_integration>

Read files needed for context, then spawn researcher:

```bash
ROADMAP_CONTENT=$(cat .planning/ROADMAP.md)
STATE_CONTENT=$(cat .planning/STATE.md)
CONTEXT_CONTENT=$(cat "$PHASE_DIR"/*-CONTEXT.md 2>/dev/null || echo "No context file")
REQUIREMENTS_CONTENT=$(cat .planning/REQUIREMENTS.md 2>/dev/null || echo "")
```

```
Task(
  prompt="""
<research_context>

**Phase:** {phase_number} - {phase_name}
**Phase Goal:** {goal from roadmap}
**Output Path:** {phase_dir}/

**Roadmap:**
{roadmap_content}

**Project State:**
{state_content}

**Phase Context (from /gsd:discuss-phase):**
{context_content}

**Requirements:**
{requirements_content}

</research_context>

Research the domain, existing codebase patterns, and technical approaches needed for this phase. Produce RESEARCH.md.
""",
  subagent_type="gsd-phase-researcher",
  model="{researcher_model}",
  description="Research Phase {phase_number}"
)
```

Verify RESEARCH.md was created:
```bash
ls "$PHASE_DIR"/*-RESEARCH.md
```
</step>

<step name="spawn_planner">
Display:
```
Planning Phase [N]: [Name]...
```

Note: If teams mode was activated in `run_research` step above, this step is skipped. The team lead spawns the planner internally.

Read all context files:

```bash
ROADMAP_CONTENT=$(cat .planning/ROADMAP.md)
STATE_CONTENT=$(cat .planning/STATE.md)
RESEARCH_CONTENT=$(cat "$PHASE_DIR"/*-RESEARCH.md 2>/dev/null || echo "No research")
CONTEXT_CONTENT=$(cat "$PHASE_DIR"/*-CONTEXT.md 2>/dev/null || echo "No context file")
REQUIREMENTS_CONTENT=$(cat .planning/REQUIREMENTS.md 2>/dev/null || echo "")
VERIFICATION_CONTENT=""
UAT_CONTENT=""
```

If --gaps mode:
```bash
VERIFICATION_CONTENT=$(cat "$PHASE_DIR"/*-VERIFICATION.md 2>/dev/null || echo "")
UAT_CONTENT=$(cat "$PHASE_DIR"/*-UAT.md 2>/dev/null || echo "")
```

```
Task(
  prompt="""
<planning_context>

**Phase:** {phase_number} - {phase_name}
**Phase Goal:** {goal from roadmap}
**Mode:** {normal or gap_closure}
**Output Path:** {phase_dir}/

**Roadmap:**
{roadmap_content}

**Project State:**
{state_content}

**Research:**
{research_content}

**Phase Context:**
{context_content}

**Requirements:**
{requirements_content}

{if gaps mode:}
**Verification Gaps:**
{verification_content}

**UAT Results:**
{uat_content}
{end if}

</planning_context>

<downstream_consumer>
Output consumed by /gsd:execute-phase.
Plans must be executable prompts for gsd-executor agents.
</downstream_consumer>
""",
  subagent_type="gsd-planner",
  model="{planner_model}",
  description="Plan Phase {phase_number}"
)
```

Verify plans were created:
```bash
ls "$PHASE_DIR"/*-PLAN.md
```

If no plans created, report error and exit.
</step>

<step name="verify_plans">
**If --skip-verify flag:** Skip verification. Go to present_results.

**Check config:**
```bash
SKIP_VERIFY=$(cat .planning/config.json 2>/dev/null | grep -o '"skip_plan_check"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "false")
```
If skip_plan_check is true: Skip verification.

Display:
```
Verifying plans...
```

Initialize: `iteration_count = 1`

Read plan files:
```bash
PLAN_FILES=$(ls "$PHASE_DIR"/*-PLAN.md)
PLAN_CONTENT=""
for f in $PLAN_FILES; do
  PLAN_CONTENT="$PLAN_CONTENT\n\n--- $(basename $f) ---\n$(cat $f)"
done
```

```
Task(
  prompt="""
<verification_context>

**Phase:** {phase_number} - {phase_name}
**Phase Goal:** {goal from roadmap}

**Plans to verify:**
{plan_content}

**Requirements:**
{requirements_content}

</verification_context>

<expected_output>
Return one of:
- ## VERIFICATION PASSED -- all checks pass
- ## ISSUES FOUND -- structured issue list with specific fixes needed
</expected_output>
""",
  subagent_type="gsd-plan-checker",
  model="{checker_model}",
  description="Verify Phase {phase_number} plans"
)
```

**On return:**
- If "VERIFICATION PASSED": Go to present_results.
- If "ISSUES FOUND": Go to revision_loop.
</step>

<step name="revision_loop">
Iterate planner + checker until plans pass (max 3 iterations).

**If iteration_count < 3:**

Display: `Sending back to planner for revision... (iteration {N}/3)`

Spawn gsd-planner with revision context (include checker issues).
After planner returns, spawn checker again.
Increment iteration_count.

**If iteration_count >= 3:**

Display: `Max iterations reached. Issues remain.`

Use AskUserQuestion:
- header: "Proceed"
- question: "Plans have unresolved issues after 3 iterations. How to proceed?"
- multiSelect: false
- options:
  - label: "Accept as-is"
    description: "Proceed with current plans despite issues"
  - label: "Provide guidance"
    description: "Give direction for another revision attempt"
  - label: "Abandon"
    description: "Exit, manually edit plans"

If "Accept as-is": Go to present_results.
If "Provide guidance": Get user input, retry with guidance.
If "Abandon": Exit workflow.
</step>

<step name="present_results">
Display planning results:

```
## Phase [N]: [Name] -- Planning Complete

**Plans created:** [count]
**Research:** [yes/no/skipped]
**Verification:** [passed/skipped/accepted with issues]

| Plan | Name | Tasks | Wave |
|------|------|-------|------|
| [NN]-01 | [name] | [N] | 1 |
| [NN]-02 | [name] | [N] | 1 |
| [NN]-03 | [name] | [N] | 2 |

---

## Next Up

**Execute Phase [N]** -- run all plans

`/gsd:execute-phase [N]`

Also available:
- `/gsd:discuss-phase [N]` -- add more context before executing
- `/gsd:list-phase-assumptions [N]` -- review assumptions

---
```
</step>

</process>

<success_criteria>
- [ ] Phase validated (exists, has directory)
- [ ] Research executed or skipped based on flags/config
- [ ] gsd-planner spawned with full context
- [ ] Plans created in phase directory
- [ ] Plans verified with gsd-plan-checker (unless skipped)
- [ ] Revision loop if needed (max 3 iterations)
- [ ] Results presented with plan table
- [ ] Next step command displayed
</success_criteria>
