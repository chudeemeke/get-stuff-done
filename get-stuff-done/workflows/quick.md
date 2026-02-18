<purpose>
Execute small, ad-hoc tasks with GSD guarantees (atomic commits, STATE.md tracking) while skipping optional agents (research, plan-checker, verifier). Quick tasks live in .planning/quick/ separate from planned phases.
</purpose>

<core_principle>
Quick mode is the same system with a shorter path: plan -> execute. No research, no plan verification, no phase verification. For when you know exactly what to do.
</core_principle>

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
| gsd-planner | opus | opus | sonnet |
| gsd-executor | opus | sonnet | sonnet |

Store resolved models for use in Task calls below.
</step>

<step name="load_state">
```bash
cat .planning/STATE.md 2>/dev/null
mkdir -p .planning/quick
```

If no STATE.md, warn but continue (quick tasks don't require full project setup).
</step>

<step name="get_task_description">
**If $ARGUMENTS provided:**
Use as task description.

**If no arguments:**
Use AskUserQuestion:
- header: "Task"
- question: "What quick task to execute?"
- multiSelect: false
- options:
  - label: "From discussion"
    description: "Extract task from what we just discussed"
  - label: "Let me describe"
    description: "I'll type the task description"

Wait for task description.
</step>

<step name="generate_quick_id">
Generate sequential ID:

```bash
EXISTING=$(ls .planning/quick/Q*.md 2>/dev/null | wc -l | tr -d ' ')
QUICK_ID="Q$(printf "%03d" $((EXISTING + 1)))"
```
</step>

<step name="plan_quick_task">
Spawn gsd-planner in quick mode:

Read STATE.md content for context:
```bash
STATE_CONTENT=$(cat .planning/STATE.md 2>/dev/null || echo "No state file")
```

```
Task(
  prompt="""
<planning_context>

**Mode:** quick
**Task:** {task_description}
**Quick ID:** {QUICK_ID}
**Output path:** .planning/quick/{QUICK_ID}-PLAN.md

**Project State:**
{state_content}

</planning_context>

<quick_mode_rules>
- Single plan file, no research needed
- Keep tasks small (1-5 atomic commits)
- Each task must have clear success criteria
- Include wave: 1 in frontmatter (single wave)
- Include autonomous: true in frontmatter
</quick_mode_rules>

<downstream_consumer>
Output consumed by gsd-executor.
Plan must be an executable prompt.
</downstream_consumer>
""",
  subagent_type="gsd-planner",
  model="{planner_model}",
  description="Plan quick task {QUICK_ID}"
)
```

Verify plan was created:
```bash
ls .planning/quick/${QUICK_ID}-PLAN.md
```
</step>

<step name="execute_quick_task">
Read the plan and spawn executor:

```bash
PLAN_CONTENT=$(cat .planning/quick/${QUICK_ID}-PLAN.md)
STATE_CONTENT=$(cat .planning/STATE.md 2>/dev/null || echo "")
```

```
Task(
  prompt="""
<objective>
Execute quick task plan {QUICK_ID}.

Commit each task atomically. Create SUMMARY.md when complete. Update STATE.md.
</objective>

<execution_context>
@~/.claude/get-stuff-done/workflows/execute-plan.md
@~/.claude/get-stuff-done/templates/summary.md
</execution_context>

<context>
Plan:
{plan_content}

Project state:
{state_content}
</context>
""",
  subagent_type="gsd-executor",
  model="{executor_model}",
  description="Execute quick task {QUICK_ID}"
)
```
</step>

<step name="update_state">
After execution, update STATE.md with quick task record:

Read existing "Quick Tasks Completed" table from STATE.md (create if missing).

Add entry:
```markdown
| {QUICK_ID} | {task_description} | {date} | {outcome from SUMMARY} |
```
</step>

<step name="commit_state">
Check planning config:

```bash
COMMIT_PLANNING_DOCS=$(cat .planning/config.json 2>/dev/null | grep -o '"commit_docs"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
git check-ignore -q .planning 2>/dev/null && COMMIT_PLANNING_DOCS=false
```

If commit_docs is true:
```bash
git add .planning/quick/${QUICK_ID}-*.md .planning/STATE.md
git commit -m "docs: complete quick task ${QUICK_ID}"
```
</step>

<step name="confirm">
Read SUMMARY.md for outcomes:

```
Quick task ${QUICK_ID} complete.

[Brief outcome from SUMMARY.md]

State updated. Ready for next task.
```
</step>

</process>

<success_criteria>
- [ ] Task description captured
- [ ] Quick ID generated
- [ ] gsd-planner spawned in quick mode
- [ ] Plan created in .planning/quick/
- [ ] gsd-executor spawned with plan
- [ ] SUMMARY.md created
- [ ] STATE.md updated with quick task record
- [ ] Git commit (if commit_docs enabled)
- [ ] Confirmation displayed
</success_criteria>
